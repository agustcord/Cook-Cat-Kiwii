/**
 * OrientationManager.js
 * 
 * Inerte (desactivado). Kiwipaw Bakehouse confía en la escala automática
 * Phaser.Scale.FIT en orientación horizontal sin desplegar overlays intrusivos.
 */

export class OrientationManager {
  /**
   * En desuso: Kiwipaw Bakehouse no despliega advertencias de rotación.
   * @returns {boolean} siempre false
   */
  static shouldShowLandscapeWarning() {
    return false;
  }

  /**
   * No-op: Cartel de orientación retirado de Kiwipaw Bakehouse.
   */
  static updateLanguage() {}

  /**
   * No-op: no manipula clases ni atributos del DOM.
   * @returns {boolean} siempre false
   */
  static updateOverlay() {
    return false;
  }

  /**
   * No-op: no registra listeners ni manipula el DOM.
   * @returns {Function} cleanup no-op
   */
  static init() {
    return () => {};
  }
}

export default OrientationManager;
