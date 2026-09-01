/**
 * TutorialManager.js
 * 
 * Controlador singleton / instancia por escena de la máquina de estados del tutorial (Día 1).
 * Gestiona el ciclo de vida, la escucha reactiva de eventos de GameScene, el auto-restock de seguridad,
 * la protección de paciencia y la persistencia de finalización / salto.
 * 
 * Cook Gatos Kiwii
 */

import { TUTORIAL_STEPS } from './TutorialSteps.js';
import TutorialOverlay from './TutorialOverlay.js';
import SaveManager from '../services/SaveManager.js';
import CrazyGamesSDK from '../services/CrazyGamesSDK.js';

/**
 * Coordenadas y dimensiones de respaldo calibradas para los elementos de la interfaz y estaciones de juego.
 * Coinciden al 100% con la geometría física de GameScene.js y ui-config.json.
 */
export const DEFAULT_TARGET_BOUNDS = {
  customer: { x: 960, y: 431, width: 320, height: 320, radius: 24 },
  dough_classic: { x: 148, y: 684, width: 168, height: 116, radius: 20 },
  dough_chocolate: { x: 142, y: 829.5, width: 168, height: 109, radius: 20 },
  dough_oat: { x: 135.5, y: 958.5, width: 177, height: 115, radius: 20 },
  stock_dough_classic: { x: 148, y: 750, width: 140, height: 50, radius: 12 },
  shape_star: { x: 384, y: 721, width: 110, height: 110, radius: 20 },
  shape_heart: { x: 497, y: 721, width: 110, height: 110, radius: 20 },
  shape_cat: { x: 610, y: 721, width: 110, height: 110, radius: 20 },
  shape_fish: { x: 723, y: 721, width: 110, height: 110, radius: 20 },
  table_cookie: { x: 960, y: 911, width: 120, height: 120, radius: 20 },
  prep_table: { x: 960, y: 911, width: 375, height: 169, radius: 20 },
  prep_tray: { x: 960, y: 911, width: 375, height: 169, radius: 20 },
  oven_power: { x: 1375, y: 261.5, width: 60, height: 60, radius: 18 },
  oven_door: { x: 1499, y: 475, width: 306, height: 249, radius: 20 },
  oven_bake: { x: 1434, y: 261.5, width: 60, height: 60, radius: 18 },
  oven_timer: { x: 1535, y: 261.5, width: 160, height: 60, radius: 16 },
  oven_extract: { x: 1494, y: 717, width: 210, height: 60, radius: 16 },
  trash_bin: { x: 619, y: 911, width: 234, height: 164, radius: 20, isErrorHighlight: true },
  cup_stack: { x: 431, y: 347, width: 70, height: 60, radius: 16 },
  btn_coffee: { x: 287, y: 424, width: 83, height: 68, radius: 16 },
  btn_milk: { x: 385, y: 422, width: 83, height: 68, radius: 16 },
  drink_machine: { x: 351, y: 507, width: 320, height: 320, radius: 24 },
  drink_cup: { x: 351, y: 582, width: 70, height: 60, radius: 16 },
  delivery_tray: { x: 1037, y: 675, width: 375, height: 94, radius: 16 }
};

/**
 * Extrae centro (x, y) y dimensiones (width, height) de cualquier GameObject de Phaser.
 * Maneja métodos getBounds(), Rectangles/Zones, Containers, Images, Sprites y Textos.
 * 
 * @param {Phaser.GameObjects.GameObject|Object} obj
 * @returns {{ x: number, y: number, width: number, height: number }|null}
 */
export function extractGameObjectBounds(obj) {
  if (!obj) return null;

  // 1. Si el objeto tiene método getBounds() de Phaser
  if (typeof obj.getBounds === 'function') {
    try {
      const b = obj.getBounds();
      if (b && typeof b.x === 'number' && typeof b.y === 'number') {
        const width = (typeof b.width === 'number' && b.width > 0)
          ? b.width
          : (obj.displayWidth || obj.width || 0);
        const height = (typeof b.height === 'number' && b.height > 0)
          ? b.height
          : (obj.displayHeight || obj.height || 0);
        const centerX = typeof b.centerX === 'number' ? b.centerX : (b.x + width / 2);
        const centerY = typeof b.centerY === 'number' ? b.centerY : (b.y + height / 2);

        if (width > 0 && height > 0) {
          return {
            x: Math.round(centerX * 10) / 10,
            y: Math.round(centerY * 10) / 10,
            width: Math.round(width * 10) / 10,
            height: Math.round(height * 10) / 10
          };
        }
      }
    } catch {
      // Continuar con fallback de propiedades directas
    }
  }

  // 2. Si el objeto tiene posición (x, y) y dimensiones directas
  if (typeof obj.x === 'number' && typeof obj.y === 'number') {
    const width = obj.displayWidth || obj.width || (obj.input?.hitArea?.width) || 0;
    const height = obj.displayHeight || obj.height || (obj.input?.hitArea?.height) || 0;

    let originX = 0.5;
    let originY = 0.5;
    if (typeof obj.originX === 'number') originX = obj.originX;
    else if (typeof obj.getOriginX === 'function') originX = obj.getOriginX();
    if (typeof obj.originY === 'number') originY = obj.originY;
    else if (typeof obj.getOriginY === 'function') originY = obj.getOriginY();

    const centerX = obj.x + (0.5 - originX) * width;
    const centerY = obj.y + (0.5 - originY) * height;

    if (width > 0 && height > 0) {
      return {
        x: Math.round(centerX * 10) / 10,
        y: Math.round(centerY * 10) / 10,
        width: Math.round(width * 10) / 10,
        height: Math.round(height * 10) / 10
      };
    }

    // Si solo tiene (x, y) sin dimensiones
    return {
      x: obj.x,
      y: obj.y,
      width: 0,
      height: 0
    };
  }

  return null;
}

/**
 * Resuelve dinámicamente los bounds de pantalla correspondientes a una clave de objetivo (targetKey)
 * extrayéndolos directamente de los GameObjects reales de la escena activa.
 * Si no hay escena o el GameObject no existe, devuelve las coordenadas de respaldo calibradas.
 * 
 * @param {string|Object} targetKeyOrStep - Clave del objetivo (ej: 'oven_power') o paso del tutorial
 * @param {Phaser.Scene} [scene] - Instancia activa de GameScene
 * @returns {{ x: number, y: number, width: number, height: number, radius?: number, isErrorHighlight?: boolean }|null}
 */
export function resolveTargetBounds(targetKeyOrStep, scene) {
  const targetKey = typeof targetKeyOrStep === 'string'
    ? targetKeyOrStep
    : (targetKeyOrStep?.targetKey || targetKeyOrStep?.target);

  const fallback = (typeof targetKeyOrStep === 'object' && targetKeyOrStep?.targetCoords)
    ? targetKeyOrStep.targetCoords
    : (DEFAULT_TARGET_BOUNDS[targetKey] || null);

  if (!targetKey && !fallback) return null;

  let targetObj = null;
  if (scene) {
    if (typeof scene.getTutorialTarget === 'function') {
      targetObj = scene.getTutorialTarget(targetKey);
    }
    if (!targetObj) {
      // Búsqueda en propiedades conocidas de scene
      if (targetKey === 'customer') {
        targetObj = scene.currentCustomer?.sprite || scene.currentCustomer?.container || scene.customerContainer;
      } else if (targetKey === 'table_cookie' || targetKey === 'prep_cookie') {
        targetObj = scene.prepTraySprites?.[0] || scene.prepTrayZone || scene.prepTrayBg;
      } else if (targetKey === 'prep_table' || targetKey === 'prep_tray') {
        targetObj = scene.prepTrayZone || scene.prepTrayBg;
      } else if (targetKey === 'drink_cup') {
        targetObj = scene.machineCupSprite;
      } else if (targetKey?.startsWith('dough_')) {
        const id = targetKey.replace('dough_', '');
        targetObj = scene.doughDragZones?.[id] || scene.doughButtons?.[id];
      } else if (targetKey?.startsWith('stock_dough_')) {
        const id = targetKey.replace('stock_dough_', '');
        targetObj = scene.doughStockTexts?.[id];
      } else if (targetKey?.startsWith('shape_')) {
        const id = targetKey.replace('shape_', '');
        targetObj = scene.shapeButtons?.[id] || scene.shapeDragZones?.[0] || scene.shapeContainers?.[0];
      } else if (targetKey === 'oven_power') {
        targetObj = scene.ovenBtnPowerZone || scene.ovenBtnPowerSprite;
      } else if (targetKey === 'oven_bake') {
        targetObj = scene.ovenBtnBakeZone || scene.ovenBtnBakeSprite;
      } else if (targetKey === 'oven_door') {
        targetObj = scene.ovenDoorZone || scene.ovenGlassSprite;
      } else if (targetKey === 'oven_timer') {
        targetObj = scene.ovenTimerZone || scene.ovenKnobSprite || scene.ovenTimerBaseSprite;
      } else if (targetKey === 'oven_extract') {
        targetObj = scene.ovenExtractZone || scene.ovenExtractBtnBg || scene.ovenExtractBtnText;
      } else if (targetKey === 'trash_bin') {
        targetObj = scene.trashBinZone || scene.trashContainer || scene.trashBinSprite;
      } else if (targetKey === 'cup_stack') {
        targetObj = scene.cupStackZone || scene.cupStackImage;
      } else if (targetKey === 'btn_coffee') {
        targetObj = scene.btnCoffeeZone || scene.btnCoffeeImage;
      } else if (targetKey === 'btn_milk') {
        targetObj = scene.btnMilkZone || scene.btnMilkImage;
      } else if (targetKey === 'drink_machine') {
        targetObj = scene.drinkMachine;
      } else if (targetKey === 'delivery_tray') {
        targetObj = scene.deliveryDragZone || scene.deliveryTrayBg;
      } else if (targetKey?.startsWith('topping_')) {
        const id = targetKey.replace('topping_', '');
        targetObj = scene.toppingDragZones?.[id] || scene.toppingButtons?.[id];
      }
    }
  }

  if (targetObj) {
    const extracted = extractGameObjectBounds(targetObj);
    if (extracted && extracted.width > 0 && extracted.height > 0) {
      const isError = targetKey === 'trash_bin' || targetKeyOrStep?.isErrorHighlight || fallback?.isErrorHighlight;
      const isButton = targetKey === 'oven_power' || targetKey === 'oven_bake';
      const width = isButton ? Math.max(extracted.width, 60) : (fallback?.width || extracted.width);
      const height = isButton ? Math.max(extracted.height, 60) : (fallback?.height || extracted.height);
      const radius = fallback?.radius || (isButton ? 18 : 20);

      return {
        x: extracted.x,
        y: extracted.y,
        width,
        height,
        radius,
        isErrorHighlight: Boolean(isError)
      };
    }
  }

  if (fallback) {
    return {
      x: fallback.x,
      y: fallback.y,
      width: fallback.width || 140,
      height: fallback.height || 140,
      radius: fallback.radius || 20,
      isErrorHighlight: Boolean(fallback.isErrorHighlight || targetKey === 'trash_bin')
    };
  }

  return null;
}

export default class TutorialManager {
  /**
   * @param {Phaser.Scene} scene - Escena contenedora (GameScene)
   * @param {Object} [options]
   * @param {Array<Object>} [options.steps] - Pasos personalizados (para testing)
   * @param {SaveManager} [options.saveManager] - Inyección de SaveManager
   * @param {CrazyGamesSDK} [options.sdk] - Inyección de CrazyGamesSDK
   * @param {TutorialOverlay} [options.overlay] - Inyección de TutorialOverlay (opcional)
   * @param {number} [options.depth=25000] - Profundidad del overlay
   */
  constructor(scene, options = {}) {
    this.scene = scene;
    this.steps = options.steps || TUTORIAL_STEPS;
    this.saveManager = options.saveManager || SaveManager.getInstance();
    this.sdk = options.sdk || CrazyGamesSDK.getInstance();

    this.currentStepIndex = 0;
    this.isActive = false;
    this.isCompleted = false;
    this.isDragging = false;

    // Callbacks de eventos internos (step_changed, completed, skipped)
    this._listeners = new Map();

    // Instanciar o inyectar TutorialOverlay
    if (options.overlay !== undefined) {
      this.overlay = options.overlay;
    } else if (this.scene) {
      try {
        this.overlay = new TutorialOverlay(this.scene, { depth: options.depth || 25000 });
      } catch {
        this.overlay = null;
      }
    } else {
      this.overlay = null;
    }

    if (this.overlay && typeof this.overlay.on === 'function') {
      this.overlay.on('skip_confirm', () => this.skip());
      this.overlay.on('next', () => {
        this.handleGameEvent('game:dialog_acknowledged');
      });
    }

    // Handlers vinculados para desuscripción limpia
    this._boundGameEventHandler = (eventName, data) => this.handleGameEvent(eventName, data);
    this._monitoredEvents = [
      'game:drag_start',
      'game:drag_end',
      'game:dough_placed',
      'game:shape_applied',
      'game:topping_applied',
      'game:oven_power',
      'game:cookie_loaded_oven',
      'game:oven_bake_start',
      'game:oven_bell',
      'game:cookie_burnt',
      'game:cookie_extracted',
      'game:cookie_trashed',
      'game:cup_placed',
      'game:drink_brewed',
      'game:drink_to_tray',
      'game:cookie_to_tray',
      'game:tray_delivered',
      'game:tray_trashed',
      'game:dialog_acknowledged'
    ];
  }

  /**
   * Sincroniza la configuración del paso actual con TutorialOverlay.
   * Soporta guía dinámica en dos fases: 'source' (objeto a tomar) y 'destination' (destino a soltar).
   * Resuelve dinámicamente las coordenadas del target desde los GameObjects de la escena.
   * @param {Object} step
   * @param {'source'|'destination'} [phase='source']
   * @private
   */
  _syncOverlayStep(step, phase = 'source') {
    if (!this.overlay || !step) return;

    let targetKey = step.targetKey;
    let fallbackCoords = step.targetCoords;

    if (phase === 'destination' && step.destinationTargetKey) {
      targetKey = step.destinationTargetKey;
      fallbackCoords = step.destinationCoords || DEFAULT_TARGET_BOUNDS[targetKey];
    } else if (phase === 'source' && step.sourceTargetKey) {
      targetKey = step.sourceTargetKey;
      fallbackCoords = step.sourceCoords || step.targetCoords || DEFAULT_TARGET_BOUNDS[targetKey];
    }

    const dynamicTarget = resolveTargetBounds({ targetKey, targetCoords: fallbackCoords }, this.scene);
    const target = dynamicTarget || fallbackCoords || step.target;

    // Si solo es un cambio de fase dinámica (arrastrando/soltando) del mismo paso y el overlay ya tiene diálogo montado:
    if (this.overlay.currentStepConfig?.id === step.id && typeof this.overlay.setTarget === 'function') {
      this.overlay.setTarget(target, {
        pointerDirection: step.pointerDirection,
        pointerOffset: step.pointerOffset
      });
      return;
    }

    if (typeof this.overlay.setStep !== 'function') return;

    // Resuelve posición inteligente de la burbuja para evitar solapar la mesa de preparación
    let bubblePos = step.bubblePosition;
    if (!bubblePos) {
      const tableActions = [
        'LOAD_OVEN',
        'DRAG_DOUGH',
        'DRAG_SHAPE',
        'DRAG_COOKIE_TRAY',
        'DRAG_DRINK_TRAY',
        'DRAG_TRASH',
        'CLICK_EXTRACT',
        'DELIVER_ORDER'
      ];
      if (step.allowedAction && tableActions.includes(step.allowedAction)) {
        bubblePos = 'top';
      } else if (target && target.y > 520) {
        bubblePos = 'top';
      } else {
        bubblePos = 'bottom';
      }
    }

    const overlayConfig = {
      ...step,
      target,
      targetCoords: target,
      showNextBtn: step.allowedAction === 'DIALOG_ACK' || Boolean(step.showNextBtn),
      bubblePosition: bubblePos
    };

    this.overlay.setStep(overlayConfig);
  }

  /**
   * Inicia la máquina de estados del tutorial.
   */
  start() {
    if (this.isActive || this.isCompleted) return;

    this.isActive = true;
    this.isCompleted = false;
    this.isDragging = false;
    this.currentStepIndex = 0;

    // Suscribir a los eventos de la escena
    if (this.scene?.events) {
      this._monitoredEvents.forEach(evt => {
        this.scene.events.on(evt, (data) => this.handleGameEvent(evt, data));
      });
    }

    // Comprobar inventario de seguridad inicial
    this.checkSafetyRestock();

    // Mostrar overlay
    if (this.overlay && typeof this.overlay.show === 'function') {
      this.overlay.show();
    }

    // Notificar primer paso
    const firstStep = this.getCurrentStep();
    if (firstStep) {
      this._syncOverlayStep(firstStep, 'source');
      this.emit('step_changed', firstStep);
    }
  }

  /**
   * Retorna el paso activo actual o null si finalizó.
   * @returns {Object|null}
   */
  getCurrentStep() {
    if (!this.isActive || this.currentStepIndex >= this.steps.length) {
      return null;
    }
    return this.steps[this.currentStepIndex];
  }

  /**
   * Avanza al siguiente micropaso pedagógico.
   */
  nextStep() {
    if (!this.isActive) return;

    this.isDragging = false;

    if (this.currentStepIndex + 1 < this.steps.length) {
      this.currentStepIndex++;
      const next = this.getCurrentStep();
      this.checkSafetyRestock();
      if (next) {
        this._syncOverlayStep(next, 'source');
        this.emit('step_changed', next);
      }
    } else {
      this.complete();
    }
  }

  /**
   * Salta a un paso específico por ID o índice.
   * @param {string|number} stepIdOrIndex
   * @returns {boolean}
   */
  goToStep(stepIdOrIndex) {
    let index = -1;
    if (typeof stepIdOrIndex === 'number') {
      index = stepIdOrIndex;
    } else if (typeof stepIdOrIndex === 'string') {
      index = this.steps.findIndex(s => s.id === stepIdOrIndex);
    }

    if (index >= 0 && index < this.steps.length) {
      this.isDragging = false;
      this.currentStepIndex = index;
      const step = this.getCurrentStep();
      this.checkSafetyRestock();
      if (step) {
        this._syncOverlayStep(step, 'source');
        this.emit('step_changed', step);
      }
      return true;
    }
    return false;
  }

  /**
   * Maneja el inicio de arrastre de un objeto interactivo (Fase 2: Origen -> Destino).
   * @param {Object} [payload]
   */
  handleDragStart(payload) {
    if (!this.isActive) return;

    const step = this.getCurrentStep();
    if (!step || !step.destinationTargetKey) return;

    this.isDragging = true;
    this._syncOverlayStep(step, 'destination');
  }

  /**
   * Maneja el fin de arrastre si se soltó sin completar la acción (Fase 3: Destino -> Origen).
   * @param {Object} [payload]
   */
  handleDragEnd(payload) {
    if (!this.isActive || !this.isDragging) return;

    this.isDragging = false;
    const step = this.getCurrentStep();
    if (step) {
      this._syncOverlayStep(step, 'source');
    }
  }

  /**
   * Procesa un evento de juego emitido por GameScene.
   * @param {string} eventName - Nombre del evento (ej: 'game:dough_placed')
   * @param {Object} [payload] - Datos adjuntos
   */
  handleGameEvent(eventName, payload) {
    if (!this.isActive) return;

    if (eventName === 'game:drag_start') {
      this.handleDragStart(payload);
      return;
    }

    if (eventName === 'game:drag_end') {
      this.handleDragEnd(payload);
      return;
    }

    const step = this.getCurrentStep();
    if (!step) return;

    if (step.triggerEvent === eventName) {
      if (typeof step.validation === 'function') {
        const isValid = step.validation(payload);
        if (!isValid) {
          return;
        }
      }
      this.isDragging = false;
      this.nextStep();
    }
  }

  /**
   * Determina si la paciencia del cliente debe protegerse contra timeout letal.
   * @returns {boolean}
   */
  isPatienceProtected() {
    return Boolean(this.isActive && !this.isCompleted && this.scene && this.scene.day === 1);
  }

  /**
   * Red de Seguridad: Comprueba y reabastece ingredientes críticos durante el tutorial si se agotan.
   * @returns {boolean} true si se aplicó restock
   */
  checkSafetyRestock() {
    if (!this.scene || !this.scene.stock) return false;

    let restocked = false;

    // Asegurar stock mínimo de masa clásica
    if (!this.scene.stock.dough) this.scene.stock.dough = {};
    if ((this.scene.stock.dough.classic ?? 0) <= 1) {
      this.scene.stock.dough.classic = Math.max(5, (this.scene.stock.dough.classic || 0) + 5);
      restocked = true;
    }

    // Asegurar stock mínimo de café
    if (!this.scene.stock.drink) this.scene.stock.drink = {};
    if ((this.scene.stock.drink.coffee_beans ?? 0) <= 0) {
      this.scene.stock.drink.coffee_beans = Math.max(3, (this.scene.stock.drink.coffee_beans || 0) + 3);
      restocked = true;
    }

    if (restocked) {
      if (typeof this.scene.updateStockTexts === 'function') {
        this.scene.updateStockTexts();
      }
      if (typeof this.scene.updateDrinkStockTexts === 'function') {
        this.scene.updateDrinkStockTexts();
      }
    }

    return restocked;
  }

  /**
   * Salta el tutorial y persiste el estado de completado.
   */
  skip() {
    if (this.isCompleted) return;

    this.isActive = false;
    this.isCompleted = true;

    this._cleanupSceneListeners();

    if (this.overlay && typeof this.overlay.hide === 'function') {
      this.overlay.hide();
    }

    // Guardar flag de completado
    try {
      this.saveManager.saveGame({ tutorialCompleted: true });
    } catch {
      // Ignorar fallback
    }

    this.emit('skipped');
  }

  /**
   * Finaliza el tutorial exitosamente, lanza happytime y guarda estado.
   */
  complete() {
    if (this.isCompleted) return;

    this.isActive = false;
    this.isCompleted = true;

    this._cleanupSceneListeners();

    if (this.overlay && typeof this.overlay.hide === 'function') {
      this.overlay.hide();
    }

    // Disparar celebración en CrazyGames SDK
    try {
      this.sdk.happytime();
    } catch {
      // Fallback
    }

    // Guardar flag de completado
    try {
      this.saveManager.saveGame({ tutorialCompleted: true });
    } catch {
      // Fallback
    }

    this.emit('completed');
  }

  /**
   * Registra un callback de evento del tutorial.
   * @param {string} event - 'step_changed' | 'completed' | 'skipped'
   * @param {Function} callback
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event).push(callback);
  }

  /**
   * Desuscribe un callback de evento del tutorial.
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    if (this._listeners.has(event)) {
      const filtered = this._listeners.get(event).filter(cb => cb !== callback);
      this._listeners.set(event, filtered);
    }
  }

  /**
   * Emite un evento a los listeners registrados.
   * @param {string} event
   * @param {...*} args
   */
  emit(event, ...args) {
    if (this._listeners.has(event)) {
      this._listeners.get(event).forEach(cb => {
        try {
          cb(...args);
        } catch (e) {
          // Aislamiento de errores en callbacks externos
        }
      });
    }
  }

  /**
   * Desuscribe todos los listeners de la escena Phaser.
   * @private
   */
  _cleanupSceneListeners() {
    if (this.scene?.events) {
      this._monitoredEvents.forEach(evt => {
        this.scene.events.off(evt, this._boundGameEventHandler);
      });
    }
  }

  /**
   * Destruye la instancia del manager y limpia el overlay.
   */
  destroy() {
    this._cleanupSceneListeners();
    if (this.overlay && typeof this.overlay.destroy === 'function') {
      this.overlay.destroy();
    }
    this.overlay = null;
    this._listeners.clear();
    this.isActive = false;
  }
}
