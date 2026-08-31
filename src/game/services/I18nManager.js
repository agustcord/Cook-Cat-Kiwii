/**
 * I18nManager.js
 * 
 * Servicio singleton de internacionalización y localización (I18n).
 * Configurado con INGLÉS COMO IDIOMA PREDETERMINADO conforme a las políticas
 * de CrazyGames, con soporte reactivo para Español y persistencia en localStorage.
 * Cook Gatos Kiwii
 */

import en from '../../locales/en.js';
import es from '../../locales/es.js';

const STORAGE_KEY = 'kiwibakery_language';

class I18nManager {
  static #instance = null;

  /**
   * Obtiene la instancia singleton de I18nManager.
   * @param {Object} [options]
   * @param {boolean} [options.reset=false] Forzar recreación (útil para tests)
   * @param {string} [options.language] Idioma forzado ('en' o 'es')
   * @param {Storage} [options.storage] Almacenamiento personalizado
   * @param {Object} [options.locales] Diccionarios personalizados
   * @returns {I18nManager}
   */
  static getInstance(options = {}) {
    if (!I18nManager.#instance || options.reset) {
      I18nManager.#instance = new I18nManager(options);
    }
    return I18nManager.#instance;
  }

  constructor(options = {}) {
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    this.locales = options.locales || { en, es };

    // Determinar idioma: opción explícita -> localStorage -> 'en' por defecto
    let savedLang = null;
    if (this.storage) {
      try {
        savedLang = this.storage.getItem(STORAGE_KEY);
      } catch {
        // Fallback en iframes restringidos
      }
    }

    this.currentLanguage = options.language || (savedLang && this.locales[savedLang] ? savedLang : 'en');
  }

  /**
   * Retorna el código de idioma actual ('en' | 'es').
   * @returns {string}
   */
  getLanguage() {
    return this.currentLanguage;
  }

  /**
   * Establece el idioma actual y lo persiste en almacenamiento.
   * @param {string} lang ('en' | 'es')
   * @returns {string} Idioma resultante
   */
  setLanguage(lang) {
    if (this.locales[lang]) {
      this.currentLanguage = lang;
      if (this.storage) {
        try {
          this.storage.setItem(STORAGE_KEY, lang);
        } catch {
          // Ignorar error de sandbox
        }
      }
    }
    return this.currentLanguage;
  }

  /**
   * Traduce una clave con soporte para claves anidadas (ej. 'hud.day') e interpolación de variables.
   * Si la clave no existe en el idioma activo, intenta en inglés ('en') como fallback.
   * Si no existe en ningún diccionario, retorna la clave original.
   * 
   * @param {string} key - Clave de traducción (notación punto)
   * @param {Object} [params] - Parámetros de interpolación { day: 1, meta: 100 }
   * @returns {string} Texto traducido
   */
  t(key, params = {}) {
    if (!key || typeof key !== 'string') return '';

    const lang = this.currentLanguage;
    let template = this._resolveKey(this.locales[lang], key);

    // Fallback a inglés si no se encuentra en el idioma actual
    if (template === undefined && lang !== 'en') {
      template = this._resolveKey(this.locales.en, key);
    }

    // Retornar directamente si es un array de cadenas (ej. scratchDialogues)
    if (Array.isArray(template)) {
      return template;
    }

    // Si no se encuentra en ningún diccionario, retornar la clave
    if (template === undefined || typeof template !== 'string') {
      return key;
    }

    // Interpolación de parámetros {paramName}
    return template.replace(/\{(\w+)\}/g, (match, paramName) => {
      return params[paramName] !== undefined ? params[paramName] : match;
    });
  }

  /**
   * Verifica si existe una clave de traducción en el idioma activo o en el fallback.
   * @param {string} key
   * @returns {boolean}
   */
  hasKey(key) {
    if (!key) return false;
    const inCurrent = this._resolveKey(this.locales[this.currentLanguage], key);
    if (inCurrent !== undefined) return true;
    const inFallback = this._resolveKey(this.locales.en, key);
    return inFallback !== undefined;
  }

  /**
   * Retorna el diccionario de locales disponibles.
   * @returns {Object}
   */
  getLocales() {
    return this.locales;
  }

  /**
   * Helper recursivo para resolver claves con notación de punto.
   * @private
   */
  _resolveKey(localeObj, keyPath) {
    if (!localeObj || typeof localeObj !== 'object') return undefined;
    const parts = keyPath.split('.');
    let current = localeObj;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    return current;
  }
}

export default I18nManager;
