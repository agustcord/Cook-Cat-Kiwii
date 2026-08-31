import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import SoundManager from '../src/game/SoundManager.js';

// Mock localStorage for test environment
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] !== undefined ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

describe('SoundManager - Core Audio Engine & Architecture Matrix', () => {
  let sm;
  let mockStorage;

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
    globalThis.localStorage = mockStorage;
    sm = SoundManager.getInstance({ reset: true, storage: mockStorage });
  });

  describe('1. Singleton & Default Bus Configuration', () => {
    test('getInstance returns the same singleton instance', () => {
      const instance1 = SoundManager.getInstance();
      const instance2 = SoundManager.getInstance();
      assert.equal(instance1, instance2, 'SoundManager must be a singleton');
    });

    test('Initializes with 5 independent buses (master, bgm, sfx, ui, ambience)', () => {
      const buses = sm.getBusNames();
      assert.deepEqual(buses.sort(), ['ambience', 'bgm', 'master', 'sfx', 'ui'].sort());
      
      // Default volumes check
      assert.equal(sm.getVolume('master'), 1.0);
      assert.equal(sm.getVolume('bgm'), 0.25);
      assert.equal(sm.getVolume('sfx'), 0.7);
      assert.equal(sm.getVolume('ui'), 0.6);
      assert.equal(sm.getVolume('ambience'), 0.3);
    });

    test('Initializes unmuted by default', () => {
      assert.equal(sm.isMuted('master'), false);
      assert.equal(sm.isMuted('bgm'), false);
      assert.equal(sm.isMuted('sfx'), false);
      assert.equal(sm.isMuted('ui'), false);
      assert.equal(sm.isMuted('ambience'), false);
    });
  });

  describe('2. Volume Clamping & Bus Hierarchy', () => {
    test('Clamps volume between 0.0 and 1.0', () => {
      sm.setVolume('sfx', 1.5);
      assert.equal(sm.getVolume('sfx'), 1.0);

      sm.setVolume('sfx', -0.5);
      assert.equal(sm.getVolume('sfx'), 0.0);

      sm.setVolume('master', 0.85);
      assert.equal(sm.getVolume('master'), 0.85);
    });

    test('Calculates effective gain factoring in Master volume and individual Bus volume', () => {
      sm.setVolume('master', 0.5);
      sm.setVolume('sfx', 0.8);
      
      // Effective gain = master (0.5) * sfx (0.8) = 0.4
      const effectiveSfxGain = sm.getEffectiveGain('sfx');
      assert.equal(Math.round(effectiveSfxGain * 1000) / 1000, 0.4);
    });

    test('Master mute silences all effective gains to 0.0', () => {
      sm.setVolume('master', 1.0);
      sm.setVolume('bgm', 0.8);
      sm.setVolume('sfx', 0.7);
      sm.setVolume('ui', 0.9);

      sm.setMuted('master', true);

      assert.equal(sm.getEffectiveGain('master'), 0);
      assert.equal(sm.getEffectiveGain('bgm'), 0);
      assert.equal(sm.getEffectiveGain('sfx'), 0);
      assert.equal(sm.getEffectiveGain('ui'), 0);
      assert.equal(sm.getEffectiveGain('ambience'), 0);
    });

    test('Individual bus mute silences only that bus without affecting others', () => {
      sm.setVolume('master', 1.0);
      sm.setVolume('bgm', 0.5);
      sm.setVolume('sfx', 0.8);

      sm.setMuted('sfx', true);

      assert.equal(sm.getEffectiveGain('sfx'), 0);
      assert.equal(sm.getEffectiveGain('bgm'), 0.5);
      assert.equal(sm.isMuted('sfx'), true);
      assert.equal(sm.isMuted('bgm'), false);
    });

    test('Unknown bus returns 0 volume and defaults safely', () => {
      assert.equal(sm.getVolume('invalid_bus'), 0);
      assert.equal(sm.getEffectiveGain('invalid_bus'), 0);
    });
  });

  describe('3. Pitch Randomizer & Volume Variance', () => {
    test('Calculates pitch shift within configured range (default +/- 5%)', () => {
      const baseFreq = 440;
      const variations = [];
      for (let i = 0; i < 50; i++) {
        const modFreq = sm.calculatePitch(baseFreq, 0.05);
        variations.push(modFreq);
        assert.ok(modFreq >= baseFreq * 0.95 - 0.001, `Frequency ${modFreq} too low for base ${baseFreq}`);
        assert.ok(modFreq <= baseFreq * 1.05 + 0.001, `Frequency ${modFreq} too high for base ${baseFreq}`);
      }

      // Check that not all frequencies are identical (randomness check)
      const uniqueValues = new Set(variations);
      assert.ok(uniqueValues.size > 10, 'Pitch randomizer must produce varying frequencies');
    });

    test('Calculates playback rate within configured variation range', () => {
      const baseRate = 1.0;
      for (let i = 0; i < 30; i++) {
        const rate = sm.calculatePlaybackRate(baseRate, 0.08);
        assert.ok(rate >= 0.92 - 0.001 && rate <= 1.08 + 0.001, `Rate ${rate} out of bounds`);
      }
    });

    test('Calculates micro-gain variance within configured range', () => {
      const baseGain = 0.5;
      for (let i = 0; i < 30; i++) {
        const gain = sm.calculateVolumeVariance(baseGain, 0.05);
        assert.ok(gain >= 0.5 * 0.95 - 0.001 && gain <= 0.5 * 1.05 + 0.001, `Gain ${gain} out of bounds`);
      }
    });
  });

  describe('4. Round-Robin Sound Pools (Anti-Fatigue)', () => {
    test('Round-robin pool of multiple items never repeats the same index consecutively', () => {
      const pool = ['sfx_cut_1', 'sfx_cut_2', 'sfx_cut_3'];
      const poolKey = 'dough_cut';

      let lastChoice = null;
      for (let i = 0; i < 30; i++) {
        const choice = sm.getNextFromPool(poolKey, pool);
        assert.ok(pool.includes(choice), 'Choice must be from pool');
        if (lastChoice !== null) {
          assert.notEqual(choice, lastChoice, `Consecutive repetition detected: ${choice}`);
        }
        lastChoice = choice;
      }
    });

    test('Round-robin handles pool with single item gracefully', () => {
      const pool = ['single_sfx'];
      const choice1 = sm.getNextFromPool('single', pool);
      const choice2 = sm.getNextFromPool('single', pool);
      assert.equal(choice1, 'single_sfx');
      assert.equal(choice2, 'single_sfx');
    });

    test('Round-robin handles empty pool gracefully', () => {
      const choice = sm.getNextFromPool('empty', []);
      assert.equal(choice, null);
    });
  });

  describe('5. Persistence & LocalStorage Sync', () => {
    test('Saves audio settings to localStorage', () => {
      sm.setVolume('master', 0.75);
      sm.setVolume('bgm', 0.35);
      sm.setMuted('master', true);

      const raw = mockStorage.getItem('kiwibakery_audio_settings');
      assert.ok(raw !== null, 'Settings must be stored in localStorage');
      
      const parsed = JSON.parse(raw);
      assert.equal(parsed.volumes.master, 0.75);
      assert.equal(parsed.volumes.bgm, 0.35);
      assert.equal(parsed.mutes.master, true);
    });

    test('Restores audio settings from localStorage on new instance initialization', () => {
      const initialSettings = {
        volumes: { master: 0.6, bgm: 0.2, sfx: 0.9, ui: 0.5, ambience: 0.4 },
        mutes: { master: false, bgm: true, sfx: false, ui: false, ambience: false }
      };
      mockStorage.setItem('kiwibakery_audio_settings', JSON.stringify(initialSettings));

      const newSm = SoundManager.getInstance({ reset: true, storage: mockStorage });
      assert.equal(newSm.getVolume('master'), 0.6);
      assert.equal(newSm.getVolume('bgm'), 0.2);
      assert.equal(newSm.getVolume('sfx'), 0.9);
      assert.equal(newSm.isMuted('bgm'), true);
      assert.equal(newSm.isMuted('master'), false);
    });

    test('Provides backward compatibility with legacy bg_music_volume and bg_music_muted', () => {
      mockStorage.setItem('bg_music_volume', '0.42');
      mockStorage.setItem('bg_music_muted', 'true');

      const legacySm = SoundManager.getInstance({ reset: true, storage: mockStorage });
      assert.equal(legacySm.getVolume('bgm'), 0.42);
      assert.equal(legacySm.isMuted('bgm'), true);
    });
  });

  describe('6. CrazyGames SDK Ad Lifecycle & Page Visibility', () => {
    test('onAdStarted mutes audio and records pre-ad state', () => {
      sm.setVolume('master', 0.8);
      sm.setMuted('master', false);

      sm.onAdStarted();

      assert.equal(sm.isAdPlaying(), true);
      assert.equal(sm.getEffectiveGain('master'), 0);
      assert.equal(sm.getEffectiveGain('bgm'), 0);
    });

    test('onAdFinished restores previous unmuted state', () => {
      sm.setVolume('master', 0.8);
      sm.setMuted('master', false);

      sm.onAdStarted();
      assert.equal(sm.getEffectiveGain('master'), 0);

      sm.onAdFinished();
      assert.equal(sm.isAdPlaying(), false);
      assert.equal(sm.isMuted('master'), false);
      assert.equal(sm.getEffectiveGain('master'), 0.8);
    });

    test('onAdFinished preserves previous muted state if user was already muted', () => {
      sm.setMuted('master', true);

      sm.onAdStarted();
      sm.onAdFinished();

      assert.equal(sm.isMuted('master'), true);
      assert.equal(sm.getEffectiveGain('master'), 0);
    });

    test('Page Visibility hidden pauses/mutes audio and visible restores it', () => {
      sm.setVolume('master', 0.9);
      sm.setMuted('master', false);

      sm.handleVisibilityChange(true); // Hidden
      assert.equal(sm.isTabHidden(), true);
      assert.equal(sm.getEffectiveGain('master'), 0);

      sm.handleVisibilityChange(false); // Visible
      assert.equal(sm.isTabHidden(), false);
      assert.equal(sm.getEffectiveGain('master'), 0.9);
    });
  });

  describe('7. High-Level ASMR & Gameplay API Callbacks', () => {
    test('All ASMR and UI methods exist and execute cleanly without throwing', () => {
      const methods = [
        'playClick',
        'playUiTap',
        'playUiHover',
        'playUiDenied',
        'playCoin',
        'playCoinCollect',
        'playCoinCascade',
        'playStarPop',
        'playDoughSelect',
        'playDoughCut',
        'playDoughPlace',
        'playOvenDoor',
        'playOvenClick',
        'startOvenHum',
        'stopOvenHum',
        'playOvenWarningTick',
        'playOvenBellReady',
        'playOvenBurnAlert',
        'playCookieBurnt',
        'playToppingSprinkles',
        'playToppingChoco',
        'playToppingGlazing',
        'playDrinkButton',
        'playDrinkSteam',
        'playDrinkPour',
        'playDrinkReady',
        'playDoorChime',
        'playCatMeow',
        'playCatPurr',
        'playCatSad',
        'playAngry',
        'playCustomerAngry',
        'playScratch',
        'playShopBuy',
        'playVictoryFanfare',
        'playGameOverMelody',
        'playTrash',
        'playAlarm',
        'playPerfect',
        'playMainMenuMusic',
        'playBakingStart',
        'playCoffeePour'
      ];

      for (const m of methods) {
        assert.equal(typeof sm[m], 'function', `Method ${m} must be defined on SoundManager`);
        assert.doesNotThrow(() => {
          sm[m]();
        }, `Method ${m} must execute cleanly`);
      }
    });
  });
});
