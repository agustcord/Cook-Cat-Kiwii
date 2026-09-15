/**
 * OrientationManager.js
 * 
 * Gestiona de forma reactiva el overlay visual de advertencia de orientación Landscape
 * para dispositivos móviles en Kiwipaw Bakehouse.
 * Evalúa relación de aspecto (portrait: width < height) y capacidades táctiles.
 */

import DeviceHelper from './DeviceHelper.js';
import I18nManager from '../services/I18nManager.js';

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

    // INMUNIDAD TOTAL EN ESCRITORIO
    // En PC / Laptops (Windows, Mac, Linux), NUNCA se muestra la advertencia de orientación,
    // incluso si la ventana se redimensiona a proporción vertical o el monitor es vertical.
    if (DeviceHelper.isDesktop(env)) {
      return false;
    }

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
   * Sincroniza dinámicamente los textos del cartel #landscape-overlay con el idioma activo en I18nManager.
   * @param {Element|null} [overlayElement]
   */
  static updateLanguage(overlayElement = null) {
    const el = overlayElement || (typeof document !== 'undefined' ? document.getElementById('landscape-overlay') : null);
    if (!el) return;

    try {
      const i18n = I18nManager.getInstance();
      const titleEl = el.querySelector ? el.querySelector('.orientation-title') : null;
      const subtitleEl = el.querySelector ? el.querySelector('.orientation-subtitle') : null;

      if (titleEl && i18n.hasKey('orientation.title')) {
        titleEl.textContent = i18n.t('orientation.title');
      }
      if (subtitleEl && i18n.hasKey('orientation.subtitle')) {
        subtitleEl.textContent = i18n.t('orientation.subtitle');
      }
    } catch {
      // Ignorar fallos en contextos headless o cuando I18nManager no esté inicializado
    }
  }

  /**
   * Actualiza la visibilidad del overlay en el DOM según el estado actual y sincroniza textos i18n.
   * @param {Element|null} [overlayElement]
   * @param {Object} [env]
   * @returns {boolean}
   */
  static updateOverlay(overlayElement = null, env = {}) {
    const el = overlayElement || (typeof document !== 'undefined' ? document.getElementById('landscape-overlay') : null);
    const shouldShow = OrientationManager.shouldShowLandscapeWarning(env);

    if (el) {
      if (shouldShow) {
        OrientationManager.updateLanguage(el);
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

    // Sincronizar textos inicialmente
    OrientationManager.updateLanguage(overlayElement);

    // Suscripción reactiva a cambios de idioma en tiempo real
    let unsubscribeI18n = null;
    try {
      const i18n = I18nManager.getInstance();
      if (typeof i18n.addListener === 'function') {
        unsubscribeI18n = i18n.addListener(() => {
          OrientationManager.updateLanguage(overlayElement);
        });
      }
    } catch {
      // Ignorar en entornos donde I18nManager no esté disponible
    }

    // Verificación inicial inmediata
    handler();

    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
      if (typeof unsubscribeI18n === 'function') {
        unsubscribeI18n();
      }
    };
  }
}

export default OrientationManager;
