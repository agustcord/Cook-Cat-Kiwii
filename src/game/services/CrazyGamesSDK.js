/**
 * CrazyGamesSDK.js
 * 
 * Wrapper singleton para el SDK v3 oficial de CrazyGames.
 * Gestiona el ciclo de vida (loading, gameplay, happytime) y anuncios (midgame / rewarded)
 * con integración automática de muteo a través de SoundManager.
 * Tolerante a fallos en ejecución offline, modo desarrollo o standalone.
 * Cook Gatos Kiwii
 */

import SoundManager from '../SoundManager.js';

class CrazyGamesSDK {
  static #instance = null;

  /**
   * Obtiene la instancia singleton de CrazyGamesSDK.
   * @param {Object} [options]
   * @param {boolean} [options.reset=false] Forzar reinicio de instancia (para tests)
   * @param {Object} [options.sdk] Inyección de mock del SDK
   * @param {Object} [options.soundManager] Inyección de mock de SoundManager
   * @returns {CrazyGamesSDK}
   */
  static getInstance(options = {}) {
    if (!CrazyGamesSDK.#instance || options.reset) {
      CrazyGamesSDK.#instance = new CrazyGamesSDK(options);
    }
    return CrazyGamesSDK.#instance;
  }

  constructor(options = {}) {
    this.soundManager = options.soundManager || SoundManager.getInstance();
    this.isInitialized = false;

    // Detectar SDK inyectado o desde window global
    if (options.sdk !== undefined) {
      this.sdk = options.sdk;
    } else if (typeof window !== 'undefined' && window.CrazyGames?.SDK) {
      this.sdk = window.CrazyGames.SDK;
    } else {
      this.sdk = null;
    }
  }

  /**
   * Determina si el SDK de CrazyGames está disponible y cargado.
   * @returns {boolean}
   */
  isAvailable() {
    if (this.sdk) return true;
    if (typeof window !== 'undefined' && window.CrazyGames?.SDK) {
      this.sdk = window.CrazyGames.SDK;
      return true;
    }
    return false;
  }

  /**
   * Inicializa el SDK de CrazyGames de forma asíncrona.
   * @returns {Promise<void>}
   */
  async init() {
    if (this.isInitialized) return;

    if (this.isAvailable() && typeof this.sdk.init === 'function') {
      try {
        await this.sdk.init();
      } catch (err) {
        // Fallback silencioso en desarrollo
      }
    }
    this.isInitialized = true;
  }

  /**
   * Hook de ciclo de vida: Inicio de carga de assets.
   * Debe llamarse al comenzar la precarga de la escena BootScene.
   */
  loadingStart() {
    if (this.isAvailable() && typeof this.sdk.game?.loadingStart === 'function') {
      try {
        this.sdk.game.loadingStart();
      } catch {
        // Fallback silencioso
      }
    }
  }

  /**
   * Hook de ciclo de vida: Fin de carga de assets.
   * Debe llamarse una vez finalizada la precarga y listo el menú.
   */
  loadingStop() {
    if (this.isAvailable() && typeof this.sdk.game?.loadingStop === 'function') {
      try {
        this.sdk.game.loadingStop();
      } catch {
        // Fallback silencioso
      }
    }
  }

  /**
   * Hook de ciclo de vida: Inicio de gameplay activo.
   * Debe llamarse al entrar a GameScene.
   */
  gameplayStart() {
    if (this.isAvailable() && typeof this.sdk.game?.gameplayStart === 'function') {
      try {
        this.sdk.game.gameplayStart();
      } catch {
        // Fallback silencioso
      }
    }
  }

  /**
   * Hook de ciclo de vida: Fin o pausa del gameplay activo.
   * Debe llamarse al pausar, terminar el día o cambiar de escena.
   */
  gameplayStop() {
    if (this.isAvailable() && typeof this.sdk.game?.gameplayStop === 'function') {
      try {
        this.sdk.game.gameplayStop();
      } catch {
        // Fallback silencioso
      }
    }
  }

  /**
   * Hook de celebración (Happytime): Se llama en eventos clave de alta satisfacción,
   * como entrega perfecta de 3 estrellas o saldar el préstamo.
   */
  happytime() {
    if (this.isAvailable() && typeof this.sdk.game?.happytime === 'function') {
      try {
        this.sdk.game.happytime();
      } catch {
        // Fallback silencioso
      }
    }
  }

  /**
   * Solicita un anuncio intersticial de mitad de partida (Midgame Ad).
   * Mutea el audio automáticamente y lo restaura al concluir o si falla.
   * @returns {Promise<boolean>} true si el anuncio se ejecutó con éxito o no había SDK, false si hubo error.
   */
  async requestMidgameAd() {
    if (!this.isAvailable() || !this.sdk.ad?.requestAd) {
      return true;
    }

    return new Promise((resolve) => {
      let resolved = false;

      const finishAd = (success) => {
        if (!resolved) {
          resolved = true;
          this.soundManager?.onAdFinished();
          resolve(success);
        }
      };

      try {
        this.soundManager?.onAdStarted();

        this.sdk.ad.requestAd('midgame', {
          adStarted: () => {
            this.soundManager?.onAdStarted();
          },
          adFinished: () => {
            finishAd(true);
          },
          adError: () => {
            finishAd(false);
          }
        });
      } catch {
        finishAd(false);
      }
    });
  }

  /**
   * Solicita un anuncio bonificado (Rewarded Ad).
   * @param {Function} [onReward] Callback ejecutado si el usuario completa el anuncio.
   * @returns {Promise<boolean>} true si se otorgó la recompensa, false si se canceló o falló.
   */
  async requestRewardedAd(onReward) {
    if (!this.isAvailable() || !this.sdk.ad?.requestAd) {
      if (typeof onReward === 'function') onReward();
      return true;
    }

    return new Promise((resolve) => {
      let resolved = false;
      let rewarded = false;

      const finishAd = (success) => {
        if (!resolved) {
          resolved = true;
          this.soundManager?.onAdFinished();
          if (success && typeof onReward === 'function') {
            onReward();
          }
          resolve(success);
        }
      };

      try {
        this.soundManager?.onAdStarted();

        this.sdk.ad.requestAd('rewarded', {
          adStarted: () => {
            this.soundManager?.onAdStarted();
          },
          adFinished: () => {
            rewarded = true;
            finishAd(true);
          },
          adError: () => {
            finishAd(false);
          }
        });
      } catch {
        finishAd(false);
      }
    });
  }
}

export default CrazyGamesSDK;
