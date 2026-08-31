/**
 * SaveManager.js
 * 
 * Servicio singleton para la persistencia del estado de juego en localStorage.
 * Almacena el progreso de campaña (día, monedas, deuda restante, moldes desbloqueados, inventario).
 * Incluye fallback transparente en memoria para entornos con almacenamiento restringido.
 * Cook Gatos Kiwii
 */

const SAVE_KEY = 'kiwibakery_save_state';

class SaveManager {
  static #instance = null;

  /**
   * Obtiene la instancia singleton de SaveManager.
   * @param {Object} [options]
   * @param {boolean} [options.reset=false] Forzar recreación (para tests)
   * @param {Storage} [options.storage] Almacenamiento personalizado
   * @returns {SaveManager}
   */
  static getInstance(options = {}) {
    if (!SaveManager.#instance || options.reset) {
      SaveManager.#instance = new SaveManager(options);
    }
    return SaveManager.#instance;
  }

  constructor(options = {}) {
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    this.memoryFallback = null;
  }

  /**
   * Retorna el estado base inicial de una partida nueva (Día 1).
   * @returns {Object}
   */
  getDefaultState() {
    return {
      day: 1,
      coins: 0,
      loanRemaining: 200,
      unlockedShapes: ['star'],
      stock: {
        dough: { classic: 10, chocolate: 0, oat: 0 },
        topping: { sprinkles: 2, choco: 0, glazing: 0 },
        drink: { coffee_beans: 2, milk: 2 }
      },
      updatedAt: Date.now()
    };
  }

  /**
   * Guarda el estado de la partida actual.
   * @param {Object} state - Datos de la partida
   * @returns {boolean} true si se guardó con éxito
   */
  saveGame(state = {}) {
    try {
      const defaultState = this.getDefaultState();
      const payload = {
        day: Math.max(1, Number(state.day) || defaultState.day),
        coins: Math.max(0, Number(state.coins) || 0),
        loanRemaining: state.loanRemaining !== undefined ? Math.max(0, Number(state.loanRemaining)) : defaultState.loanRemaining,
        unlockedShapes: Array.isArray(state.unlockedShapes) && state.unlockedShapes.length > 0
          ? [...new Set(state.unlockedShapes)]
          : defaultState.unlockedShapes,
        stock: {
          dough: { ...defaultState.stock.dough, ...(state.stock?.dough || {}) },
          topping: { ...defaultState.stock.topping, ...(state.stock?.topping || {}) },
          drink: { ...defaultState.stock.drink, ...(state.stock?.drink || {}) }
        },
        updatedAt: Date.now()
      };

      const serialized = JSON.stringify(payload);

      if (this.storage) {
        try {
          this.storage.setItem(SAVE_KEY, serialized);
          return true;
        } catch {
          // Fallback a memoria
          this.memoryFallback = serialized;
          return true;
        }
      } else {
        this.memoryFallback = serialized;
        return true;
      }
    } catch {
      return false;
    }
  }

  /**
   * Carga el estado de la partida guardada si existe.
   * @returns {Object|null}
   */
  loadGame() {
    try {
      let serialized = null;
      if (this.storage) {
        try {
          serialized = this.storage.getItem(SAVE_KEY);
        } catch {
          serialized = this.memoryFallback;
        }
      } else {
        serialized = this.memoryFallback;
      }

      if (!serialized) return null;

      const parsed = JSON.parse(serialized);
      if (!parsed || typeof parsed !== 'object' || !parsed.day) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Determina si existe una partida guardada con progreso válido para continuar.
   * @returns {boolean}
   */
  hasSavedGame() {
    const saved = this.loadGame();
    if (!saved) return false;

    // Se considera partida continuable si el día > 1 o tiene fondos/desbloqueos acumulados
    return (
      saved.day > 1 ||
      saved.coins > 0 ||
      (saved.unlockedShapes && saved.unlockedShapes.length > 1) ||
      (saved.loanRemaining !== undefined && saved.loanRemaining < 200)
    );
  }

  /**
   * Elimina la partida guardada para permitir un reinicio limpio.
   * @returns {boolean}
   */
  clearSave() {
    this.memoryFallback = null;
    if (this.storage) {
      try {
        this.storage.removeItem(SAVE_KEY);
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }
}

export default SaveManager;
