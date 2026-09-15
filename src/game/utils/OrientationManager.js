/**
 * OrientationManager.js
 * 
 * Gestiona de forma reactiva el overlay visual de advertencia de orientación Landscape
 * para dispositivos móviles en Kiwipaw Bakehouse.
 * Evalúa relación de aspecto (portrait: width < height) y capacidades táctiles.
 */

import DeviceHelper from './DeviceHelper.js';

export class OrientationManager {
  /**
   * Evalúa si se debe mostrar el overlay de rotación landscape.
   * @param {Object} [env] Inyección opcional para tests o entornos headless
   * @param {Window|Object} [env.windowObj]
   * @param {Navigator|Object} [env.navigatorObj]
   * @returns {boolean}
   */
  static shouldShowLandscapeWarning(env = {}) {
    const win = env.windowObj !== undefined 
      ? env.windowObj 
      : (typeof window !== 'undefined' ? window : null);
    
    if (!win) return false;

    const innerW = typeof win.innerWidth === 'number' ? win.innerWidth : 0;
    const innerH = typeof win.innerHeight === 'number' ? win.innerHeight : 0;
    const isPortrait = innerW < innerH;

    // Solo se muestra en pantallas táctiles (pointer: coarse, touch points, etc.)
    const isTouch = DeviceHelper.isTouchInput(null, {
      windowObj: win,
      navigatorObj: env.navigatorObj !== undefined ? env.navigatorObj : (typeof navigator !== 'undefined' ? navigator : null)
    });

    return Boolean(isPortrait && isTouch);
  }

  /**
   * Actualiza la visibilidad del overlay en el DOM según el estado actual.
   * @param {Element|null} [overlayElement]
   * @param {Object} [env]
   * @returns {boolean}
   */
  static updateOverlay(overlayElement = null, env = {}) {
    const el = overlayElement || (typeof document !== 'undefined' ? document.getElementById('landscape-overlay') : null);
    const shouldShow = OrientationManager.shouldShowLandscapeWarning(env);

    if (el) {
      if (shouldShow) {
        if (el.classList && typeof el.classList.add === 'function') {
          el.classList.add('visible');
        }
        if (typeof el.setAttribute === 'function') {
          el.setAttribute('aria-hidden', 'false');
        }
      } else {
        if (el.classList && typeof el.classList.remove === 'function') {
          el.classList.remove('visible');
        }
        if (typeof el.setAttribute === 'function') {
          el.setAttribute('aria-hidden', 'true');
        }
      }
    }

    return shouldShow;
  }

  /**
   * Inicializa la escucha de eventos resize y orientationchange en window.
   * @param {Element|null} [overlayElement]
   * @returns {Function} Función cleanup para remover los event listeners
   */
  static init(overlayElement = null) {
    if (typeof window === 'undefined') return () => {};

    const handler = () => {
      OrientationManager.updateOverlay(overlayElement);
    };

    window.addEventListener('resize', handler, { passive: true });
    window.addEventListener('orientationchange', handler, { passive: true });

    // Verificación inicial inmediata
    handler();

    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
    };
  }
}

export default OrientationManager;
