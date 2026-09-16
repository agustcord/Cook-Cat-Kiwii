import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import CrazyGamesSDK from '../src/game/services/CrazyGamesSDK.js';

describe('CrazyGames SDK v3 Service & Lifecycle Hooks', () => {
  test('returns singleton instance', () => {
    const instance1 = CrazyGamesSDK.getInstance({ reset: true });
    const instance2 = CrazyGamesSDK.getInstance();
    assert.equal(instance1, instance2);
  });

  test('functions safely as no-op when SDK is unavailable (offline / dev)', async () => {
    const sdk = CrazyGamesSDK.getInstance({ reset: true, sdk: null });
    assert.equal(sdk.isAvailable(), false);

    // None of these should throw
    await sdk.init();
    sdk.loadingStart();
    sdk.loadingStop();
    sdk.gameplayStart();
    sdk.gameplayStop();
    sdk.happytime();

    const adResult = await sdk.requestMidgameAd();
    assert.equal(adResult, true);
  });

  test('calls game lifecycle hooks on underlying SDK when present', async () => {
    let initialized = false;
    let loadingStarted = false;
    let loadingStopped = false;
    let gameplayStarted = false;
    let gameplayStopped = false;
    let happytimeTriggered = false;

    const mockSDK = {
      init: async () => { initialized = true; },
      game: {
        loadingStart: () => { loadingStarted = true; },
        loadingStop: () => { loadingStopped = true; },
        gameplayStart: () => { gameplayStarted = true; },
        gameplayStop: () => { gameplayStopped = true; },
        happytime: () => { happytimeTriggered = true; }
      }
    };

    const sdk = CrazyGamesSDK.getInstance({ reset: true, sdk: mockSDK });
    assert.equal(sdk.isAvailable(), true);

    await sdk.init();
    assert.equal(initialized, true);

    sdk.loadingStart();
    assert.equal(loadingStarted, true);

    sdk.loadingStop();
    assert.equal(loadingStopped, true);

    sdk.gameplayStart();
    assert.equal(gameplayStarted, true);

    sdk.gameplayStop();
    assert.equal(gameplayStopped, true);

    sdk.happytime();
    assert.equal(happytimeTriggered, true);
  });

  test('requestMidgameAd mutes audio on start and restores audio on finish', async () => {
    let adStartedMuted = false;
    let adFinishedRestored = false;
    let requestedType = null;

    const mockSoundManager = {
      onAdStarted: () => { adStartedMuted = true; },
      onAdFinished: () => { adFinishedRestored = true; }
    };

    const mockSDK = {
      ad: {
        requestAd: (type, callbacks) => {
          requestedType = type;
          if (callbacks?.adStarted) callbacks.adStarted();
          if (callbacks?.adFinished) callbacks.adFinished();
        }
      }
    };

    const sdk = CrazyGamesSDK.getInstance({
      reset: true,
      sdk: mockSDK,
      soundManager: mockSoundManager
    });

    const result = await sdk.requestMidgameAd();
    assert.equal(result, true);
    assert.equal(requestedType, 'midgame');
    assert.equal(adStartedMuted, true);
    assert.equal(adFinishedRestored, true);
  });

  test('requestMidgameAd restores audio even when ad encounters error', async () => {
    let adStartedMuted = false;
    let adFinishedRestored = false;

    const mockSoundManager = {
      onAdStarted: () => { adStartedMuted = true; },
      onAdFinished: () => { adFinishedRestored = true; }
    };

    const mockSDK = {
      ad: {
        requestAd: (type, callbacks) => {
          if (callbacks?.adError) callbacks.adError(new Error('Ad blocked'));
        }
      }
    };

    const sdk = CrazyGamesSDK.getInstance({
      reset: true,
      sdk: mockSDK,
      soundManager: mockSoundManager
    });

    const result = await sdk.requestMidgameAd();
    assert.equal(result, false);
    assert.equal(adStartedMuted, true);
    assert.equal(adFinishedRestored, true);
  });

  test('requestRewardedAd triggers reward callback on success', async () => {
    let rewarded = false;
    let adFinishedRestored = false;

    const mockSoundManager = {
      onAdStarted: () => {},
      onAdFinished: () => { adFinishedRestored = true; }
    };

    const mockSDK = {
      ad: {
        requestAd: (type, callbacks) => {
          assert.equal(type, 'rewarded');
          if (callbacks?.adStarted) callbacks.adStarted();
          if (callbacks?.adFinished) callbacks.adFinished();
        }
      }
    };

    const sdk = CrazyGamesSDK.getInstance({
      reset: true,
      sdk: mockSDK,
      soundManager: mockSoundManager
    });

    const result = await sdk.requestRewardedAd(() => {
      rewarded = true;
    });

    assert.equal(result, true);
    assert.equal(rewarded, true);
    assert.equal(adFinishedRestored, true);
  });

  describe('Resilience against throwing getters (External Domain / Disabled SDK)', () => {
    test('isAvailable returns false and lifecycle hooks do not throw when game getter throws', async () => {
      const throwingSDK = {
        init: async () => {}
      };
      Object.defineProperty(throwingSDK, 'game', {
        get() {
          throw new Error('CrazySDK is disabled on this domain. Check docs.crazygames.com for more info.');
        }
      });
      Object.defineProperty(throwingSDK, 'ad', {
        get() {
          throw new Error('CrazySDK is disabled on this domain. Check docs.crazygames.com for more info.');
        }
      });

      const sdk = CrazyGamesSDK.getInstance({ reset: true, sdk: throwingSDK });

      assert.equal(sdk.isAvailable(), false);

      // Verify none of these lifecycle methods throw when called
      assert.doesNotThrow(() => sdk.loadingStart());
      assert.doesNotThrow(() => sdk.loadingStop());
      assert.doesNotThrow(() => sdk.gameplayStart());
      assert.doesNotThrow(() => sdk.gameplayStop());
      assert.doesNotThrow(() => sdk.happytime());
      await assert.doesNotReject(async () => await sdk.init());
    });

    test('ad requests gracefully degrade and do not throw when ad getter throws', async () => {
      const throwingSDK = {};
      Object.defineProperty(throwingSDK, 'game', {
        get() {
          throw new Error('CrazySDK is disabled on this domain.');
        }
      });
      Object.defineProperty(throwingSDK, 'ad', {
        get() {
          throw new Error('CrazySDK is disabled on this domain.');
        }
      });

      const sdk = CrazyGamesSDK.getInstance({ reset: true, sdk: throwingSDK });

      const midgameResult = await sdk.requestMidgameAd();
      assert.equal(midgameResult, true);

      let rewardCalled = false;
      const rewardedResult = await sdk.requestRewardedAd(() => {
        rewardCalled = true;
      });
      assert.equal(rewardedResult, true);
      assert.equal(rewardCalled, true);
    });

    test('window.CrazyGames.SDK with throwing getters is handled safely without crashing', async () => {
      const originalWindow = globalThis.window;
      try {
        const throwingSDK = {};
        Object.defineProperty(throwingSDK, 'game', {
          get() {
            throw new Error('CrazySDK is disabled on this domain.');
          }
        });
        Object.defineProperty(throwingSDK, 'ad', {
          get() {
            throw new Error('CrazySDK is disabled on this domain.');
          }
        });

        globalThis.window = {
          CrazyGames: {
            SDK: throwingSDK
          }
        };

        const sdk = CrazyGamesSDK.getInstance({ reset: true });
        assert.equal(sdk.isAvailable(), false);
        assert.doesNotThrow(() => sdk.loadingStart());
        assert.doesNotThrow(() => sdk.loadingStop());
        assert.doesNotThrow(() => sdk.gameplayStart());
        assert.doesNotThrow(() => sdk.gameplayStop());
        assert.doesNotThrow(() => sdk.happytime());

        const midgameResult = await sdk.requestMidgameAd();
        assert.equal(midgameResult, true);
      } finally {
        globalThis.window = originalWindow;
      }
    });
  });
});

