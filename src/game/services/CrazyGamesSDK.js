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
   * Tolerante a dominios no autorizados donde el SDK desactiva sus servicios
   * y arroja errores al acceder a sus getters (ej. sdk.game, sdk.ad).
   * @returns {boolean}
   */
  isAvailable() {
    if (!this.sdk) {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK) {
        this.sdk = window.CrazyGames.SDK;
      } else {
        return false;
      }
    }

    try {
      const _game = this.sdk.game;
      const _ad = this.sdk.ad;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Inicializa el SDK de CrazyGames de forma asíncrona.
   * @returns {Promise<void>}
   */
  async init() {
    if (this.isInitialized) return;

    try {
      if (this.isAvailable() && typeof this.sdk?.init === 'function') {
        await this.sdk.init();
      }
    } catch {
      // Fallback silencioso en desarrollo o dominio deshabilitado
    }
    this.isInitialized = true;
  }

  /**
   * Hook de ciclo de vida: Inicio de carga de assets.
   * Debe llamarse al comenzar la precarga de la escena BootScene.
   */
  loadingStart() {
    try {
      if (this.isAvailable() && typeof this.sdk?.game?.loadingStart === 'function') {
        this.sdk.game.loadingStart();
      }
    } catch {
      // Fallback silencioso
    }
  }

  /**
   * Hook de ciclo de vida: Fin de carga de assets.
   * Debe llamarse una vez finalizada la precarga y listo el menú.
   */
  loadingStop() {
    try {
      if (this.isAvailable() && typeof this.sdk?.game?.loadingStop === 'function') {
        this.sdk.game.loadingStop();
      }
    } catch {
      // Fallback silencioso
    }
  }

  /**
   * Hook de ciclo de vida: Inicio de gameplay activo.
   * Debe llamarse al entrar a GameScene.
   */
  gameplayStart() {
    try {
      if (this.isAvailable() && typeof this.sdk?.game?.gameplayStart === 'function') {
        this.sdk.game.gameplayStart();
      }
    } catch {
      // Fallback silencioso
    }
  }

  /**
   * Hook de ciclo de vida: Fin o pausa del gameplay activo.
   * Debe llamarse al pausar, terminar el día o cambiar de escena.
   */
  gameplayStop() {
    try {
      if (this.isAvailable() && typeof this.sdk?.game?.gameplayStop === 'function') {
        this.sdk.game.gameplayStop();
      }
    } catch {
      // Fallback silencioso
    }
  }

  /**
   * Hook de celebración (Happytime): Se llama en eventos clave de alta satisfacción,
   * como entrega perfecta de 3 estrellas o saldar el préstamo.
   */
  happytime() {
    try {
      if (this.isAvailable() && typeof this.sdk?.game?.happytime === 'function') {
        this.sdk.game.happytime();
      }
    } catch {
      // Fallback silencioso
    }
  }

  /**
   * Solicita un anuncio intersticial de mitad de partida (Midgame Ad).
   * Mutea el audio automáticamente y lo restaura al concluir o si falla.
   * @returns {Promise<boolean>} true si el anuncio se ejecutó con éxito o no había SDK, false si hubo error.
   */
  async requestMidgameAd() {
    try {
      if (!this.isAvailable() || typeof this.sdk?.ad?.requestAd !== 'function') {
        return true;
      }
    } catch {
      return true;
    }

    return new Promise((resolve) => {
      let resolved = false;

      const finishAd = (success) => {
        if (!resolved) {
          resolved = true;
          try {
            this.soundManager?.onAdFinished();
          } catch {
            // Fallback silencioso
          }
          resolve(success);
        }
      };

      try {
        try {
          this.soundManager?.onAdStarted();
        } catch {
          // Fallback silencioso
        }

        this.sdk.ad.requestAd('midgame', {
          adStarted: () => {
            try {
              this.soundManager?.onAdStarted();
            } catch {}
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
    try {
      if (!this.isAvailable() || typeof this.sdk?.ad?.requestAd !== 'function') {
        if (typeof onReward === 'function') {
          try {
            onReward();
          } catch {}
        }
        return true;
      }
    } catch {
      if (typeof onReward === 'function') {
        try {
          onReward();
        } catch {}
      }
      return true;
    }

    return new Promise((resolve) => {
      let resolved = false;

      const finishAd = (success) => {
        if (!resolved) {
          resolved = true;
          try {
            this.soundManager?.onAdFinished();
          } catch {}
          if (success && typeof onReward === 'function') {
            try {
              onReward();
            } catch {}
          }
          resolve(success);
        }
      };

      try {
        try {
          this.soundManager?.onAdStarted();
        } catch {}

        this.sdk.ad.requestAd('rewarded', {
          adStarted: () => {
            try {
              this.soundManager?.onAdStarted();
            } catch {}
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
}

export default CrazyGamesSDK;
