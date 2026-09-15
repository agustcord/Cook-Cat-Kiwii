/**
 * DeviceHelper.js
 * 
 * Módulo utilitario puro y testeable para la detección de dispositivos y métodos de entrada
 * (Táctil vs Puntero/Mouse) en Kiwipaw Bakehouse.
 * Evalúa estándares W3C (pointer: coarse, maxTouchPoints), subsistemas de Phaser y
 * persistencia de preferencias de accesibilidad.
 */

export const TOUCH_OVERRIDE_KEY = 'kiwibakery_touch_mode';

let customStorage = null;
let memoryFallbackValue = null;

function getActiveStorage() {
  if (customStorage) return customStorage;
  if (typeof localStorage !== 'undefined') return localStorage;
  return null;
}

export class DeviceHelper {
  /**
   * Permite inyectar un almacenamiento para tests o entornos headless.
   * @param {Storage|Object|null} storage
   */
  static setStorage(storage) {
    customStorage = storage;
    memoryFallbackValue = null;
  }

  /**
   * Obtiene la preferencia guardada de modo táctil ('auto' | 'touch' | 'mouse').
   * @returns {'auto' | 'touch' | 'mouse'}
   */
  static getTouchModeOverride() {
    try {
      const storage = getActiveStorage();
      const val = storage ? storage.getItem(TOUCH_OVERRIDE_KEY) : memoryFallbackValue;
      if (val === 'touch' || val === 'mouse' || val === 'auto') {
        return val;
      }
      return 'auto';
    } catch {
      return memoryFallbackValue || 'auto';
    }
  }

  /**
   * Establece y persiste la preferencia de modo táctil.
   * @param {'auto' | 'touch' | 'mouse'} mode
   * @returns {boolean}
   */
  static setTouchModeOverride(mode) {
    if (!['auto', 'touch', 'mouse'].includes(mode)) {
      return false;
    }
    try {
      const storage = getActiveStorage();
      if (storage) {
        storage.setItem(TOUCH_OVERRIDE_KEY, mode);
      } else {
        memoryFallbackValue = mode;
      }
      return true;
    } catch {
      memoryFallbackValue = mode;
      return true;
    }
  }

  /**
   * Determina de forma universal si la sesión actual debe operar en modo táctil (Touch)
   * o en modo escritorio (Mouse).
   * 
   * @param {Phaser.Game|Object} [game] Instancia del juego Phaser para consultar game.device
   * @param {Object} [options] Opciones de inyección para tests o contextos específicos
   * @param {string} [options.override] 'auto' | 'touch' | 'mouse'
   * @param {Window|Object|null} [options.windowObj]
   * @param {Navigator|Object|null} [options.navigatorObj]
   * @returns {boolean} true si se debe activar el modo táctil
   */
  static isTouchInput(game = null, options = {}) {
    // 1. Evaluar override explícito pasado en opciones o persistido en almacenamiento
    const override = options.override !== undefined ? options.override : DeviceHelper.getTouchModeOverride();
    if (override === 'touch') return true;
    if (override === 'mouse') return false;

    // 2. Resolver referencias de entorno
    const win = options.windowObj !== undefined 
      ? options.windowObj 
      : (typeof window !== 'undefined' ? window : null);

    const nav = options.navigatorObj !== undefined 
      ? options.navigatorObj 
      : (typeof navigator !== 'undefined' ? navigator : null);

    // 3. Evaluar estándares W3C Pointer Media Query: (pointer: coarse)
    let hasCoarsePointer = false;
    try {
      if (win && typeof win.matchMedia === 'function') {
        hasCoarsePointer = Boolean(win.matchMedia('(pointer: coarse)')?.matches);
      }
    } catch {
      hasCoarsePointer = false;
    }

    // 4. Evaluar capacidad multitáctil del hardware (navigator.maxTouchPoints)
    let hasTouchPoints = false;
    try {
      if (nav && typeof nav.maxTouchPoints === 'number') {
        hasTouchPoints = nav.maxTouchPoints > 0;
      }
    } catch {
      hasTouchPoints = false;
    }

    // 5. Evaluar flags del subsistema de dispositivos de Phaser si game está provisto
    let isPhaserTouch = false;
    let isPhaserNonDesktop = false;
    if (game && game.device) {
      if (game.device.input && game.device.input.touch === true) {
        isPhaserTouch = true;
      }
      if (game.device.os && game.device.os.desktop === false) {
        isPhaserNonDesktop = true;
      }
    }

    return Boolean(hasCoarsePointer || hasTouchPoints || isPhaserTouch || isPhaserNonDesktop);
  }
}

/**
 * Función helper de conveniencia para importación directa.
 * @param {Phaser.Game|Object} [game]
 * @param {Object} [options]
 * @returns {boolean}
 */
export function isTouchInput(game = null, options = {}) {
  return DeviceHelper.isTouchInput(game, options);
}

export default DeviceHelper;
