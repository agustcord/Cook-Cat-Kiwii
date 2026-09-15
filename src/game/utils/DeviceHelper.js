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
   * Determina si el entorno corresponde a un sistema operativo o dispositivo de escritorio (PC / Mac / Linux).
   * Evalúa Client Hints (userAgentData.mobile), cadenas de User-Agent estándar W3C,
   * y flags del subsistema de Phaser.
   * 
   * @param {Object} [env] Inyección opcional para tests o entornos headless
   * @param {Window|Object|null} [env.windowObj]
   * @param {Navigator|Object|null} [env.navigatorObj]
   * @param {Phaser.Game|Object|null} [env.game]
   * @returns {boolean} true si se identifica con certeza un entorno de escritorio
   */
  static isDesktop(env = {}) {
    let win = null;
    let nav = null;
    let game = null;

    if (env) {
      if (env.windowObj !== undefined || env.navigatorObj !== undefined || env.game !== undefined) {
        win = env.windowObj !== undefined ? env.windowObj : (typeof window !== 'undefined' ? window : null);
        nav = env.navigatorObj !== undefined ? env.navigatorObj : (typeof navigator !== 'undefined' ? navigator : null);
        game = env.game || null;
      } else if (typeof env.matchMedia === 'function' || env.innerWidth !== undefined) {
        win = env;
        nav = typeof navigator !== 'undefined' ? navigator : null;
      } else if (env.userAgent !== undefined || env.userAgentData !== undefined || env.maxTouchPoints !== undefined) {
        nav = env;
        win = typeof window !== 'undefined' ? window : null;
      } else {
        win = typeof window !== 'undefined' ? window : null;
        nav = typeof navigator !== 'undefined' ? navigator : null;
        game = env.game || null;
      }
    } else {
      win = typeof window !== 'undefined' ? window : null;
      nav = typeof navigator !== 'undefined' ? navigator : null;
    }

    // 1. Prioridad: Flags explícitos de Phaser si game está presente
    if (game && game.device && game.device.os) {
      if (typeof game.device.os.desktop === 'boolean') {
        return game.device.os.desktop;
      }
    }

    // 2. Client Hints W3C: navigator.userAgentData
    if (nav && nav.userAgentData && typeof nav.userAgentData.mobile === 'boolean') {
      return !nav.userAgentData.mobile;
    }

    // 3. Inspección rigurosa de User-Agent
    const ua = (nav && (nav.userAgent || nav.vendor)) || '';
    if (ua) {
      // Descartar flags móviles explícitos primero
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Silk/i.test(ua);
      const isWindowsPhone = /Windows Phone/i.test(ua);
      if (isWindowsPhone || isMobileUA) {
        return false;
      }

      // Detectar SO de escritorio reconocidos
      const isWindows = /Windows NT/i.test(ua);
      const isMac = /Macintosh|Mac OS X/i.test(ua);
      const isLinux = /Linux/i.test(ua) && !/Android/i.test(ua);
      const isCrOS = /CrOS/i.test(ua);

      if (isWindows || isMac || isLinux || isCrOS) {
        return true;
      }
    }

    // 4. Fallback W3C Media Queries (pointer: fine & hover: hover)
    if (win && typeof win.matchMedia === 'function') {
      try {
        const hasFinePointer = Boolean(win.matchMedia('(pointer: fine)')?.matches);
        const hasHover = Boolean(win.matchMedia('(hover: hover)')?.matches);
        const hasCoarsePointer = Boolean(win.matchMedia('(pointer: coarse)')?.matches);
        if (hasFinePointer && hasHover && !hasCoarsePointer) {
          return true;
        }
      } catch {
        // Ignorar fallos de matchMedia en entornos headless
      }
    }

    return false;
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

    // 3. Determinar si el entorno es escritorio
    const isDesktopEnv = DeviceHelper.isDesktop({ windowObj: win, navigatorObj: nav, game });

    // 4. Evaluar estándares W3C Pointer Media Query: (pointer: coarse)
    let hasCoarsePointer = false;
    try {
      if (win && typeof win.matchMedia === 'function') {
        hasCoarsePointer = Boolean(win.matchMedia('(pointer: coarse)')?.matches);
      }
    } catch {
      hasCoarsePointer = false;
    }

    // 5. Evaluar capacidad multitáctil del hardware (navigator.maxTouchPoints)
    // En entornos de escritorio (Windows/Mac/Linux), hasTouchPoints por sí solo NO clasifica como táctil
    let hasTouchPoints = false;
    try {
      if (nav && typeof nav.maxTouchPoints === 'number') {
        hasTouchPoints = nav.maxTouchPoints > 0;
      }
    } catch {
      hasTouchPoints = false;
    }

    if (isDesktopEnv) {
      hasTouchPoints = false;
    }

    // 6. Evaluar flags del subsistema de dispositivos de Phaser si game está provisto
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
 * Función helper de conveniencia para importación directa de modo táctil.
 * @param {Phaser.Game|Object} [game]
 * @param {Object} [options]
 * @returns {boolean}
 */
export function isTouchInput(game = null, options = {}) {
  return DeviceHelper.isTouchInput(game, options);
}

/**
 * Función helper de conveniencia para importación directa de detección de escritorio.
 * @param {Object} [env]
 * @returns {boolean}
 */
export function isDesktop(env = {}) {
  return DeviceHelper.isDesktop(env);
}

export default DeviceHelper;
