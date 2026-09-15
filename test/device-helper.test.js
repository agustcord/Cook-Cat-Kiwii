import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import DeviceHelper, { isTouchInput } from '../src/game/utils/DeviceHelper.js';

describe('DeviceHelper - Modular & Cross-Platform Touch Input Detection Matrix', () => {

  describe('1. Explicit Override Control', () => {
    test('returns true when options.override is "touch", overriding desktop environment', () => {
      const mockGame = { device: { os: { desktop: true }, input: { touch: false } } };
      const options = {
        override: 'touch',
        windowObj: { matchMedia: () => ({ matches: false }) },
        navigatorObj: { maxTouchPoints: 0 }
      };
      assert.equal(DeviceHelper.isTouchInput(mockGame, options), true);
      assert.equal(isTouchInput(mockGame, options), true);
    });

    test('returns false when options.override is "mouse", overriding mobile environment', () => {
      const mockGame = { device: { os: { desktop: false }, input: { touch: true } } };
      const options = {
        override: 'mouse',
        windowObj: { matchMedia: () => ({ matches: true }) },
        navigatorObj: { maxTouchPoints: 5 }
      };
      assert.equal(DeviceHelper.isTouchInput(mockGame, options), false);
      assert.equal(isTouchInput(mockGame, options), false);
    });

    test('respects persistent storage override when options.override is not provided', () => {
      const memory = new Map();
      const mockStorage = {
        getItem: (k) => memory.get(k) || null,
        setItem: (k, v) => memory.set(k, String(v)),
        removeItem: (k) => memory.delete(k)
      };

      DeviceHelper.setStorage(mockStorage);
      DeviceHelper.setTouchModeOverride('touch');
      assert.equal(DeviceHelper.getTouchModeOverride(), 'touch');

      // Now even in a desktop environment, it resolves to touch
      const desktopGame = { device: { os: { desktop: true }, input: { touch: false } } };
      assert.equal(DeviceHelper.isTouchInput(desktopGame, {
        windowObj: { matchMedia: () => ({ matches: false }) },
        navigatorObj: { maxTouchPoints: 0 }
      }), true);

      // Change to mouse
      DeviceHelper.setTouchModeOverride('mouse');
      assert.equal(DeviceHelper.getTouchModeOverride(), 'mouse');
      const mobileGame = { device: { os: { desktop: false }, input: { touch: true } } };
      assert.equal(DeviceHelper.isTouchInput(mobileGame, {
        windowObj: { matchMedia: () => ({ matches: true }) },
        navigatorObj: { maxTouchPoints: 5 }
      }), false);

      // Reset to auto
      DeviceHelper.setTouchModeOverride('auto');
      assert.equal(DeviceHelper.getTouchModeOverride(), 'auto');

      // Clean up
      DeviceHelper.setStorage(null);
    });
  });

  describe('2. W3C Hardware & CSS Media Query Evaluation', () => {
    test('detects touch when pointer: coarse media query matches', () => {
      const options = {
        override: 'auto',
        windowObj: {
          matchMedia: (query) => ({
            matches: query === '(pointer: coarse)'
          })
        },
        navigatorObj: { maxTouchPoints: 0 }
      };
      assert.equal(DeviceHelper.isTouchInput(null, options), true);
    });

    test('detects touch when navigator.maxTouchPoints > 0', () => {
      const options = {
        override: 'auto',
        windowObj: { matchMedia: () => ({ matches: false }) },
        navigatorObj: { maxTouchPoints: 5 }
      };
      assert.equal(DeviceHelper.isTouchInput(null, options), true);
    });

    test('detects touch when Phaser game.device.os.desktop is false', () => {
      const mockGame = {
        device: {
          os: { desktop: false },
          input: { touch: false }
        }
      };
      const options = {
        override: 'auto',
        windowObj: { matchMedia: () => ({ matches: false }) },
        navigatorObj: { maxTouchPoints: 0 }
      };
      assert.equal(DeviceHelper.isTouchInput(mockGame, options), true);
    });

    test('detects touch when Phaser game.device.input.touch is true', () => {
      const mockGame = {
        device: {
          os: { desktop: true },
          input: { touch: true }
        }
      };
      const options = {
        override: 'auto',
        windowObj: { matchMedia: () => ({ matches: false }) },
        navigatorObj: { maxTouchPoints: 0 }
      };
      assert.equal(DeviceHelper.isTouchInput(mockGame, options), true);
    });
  });

  describe('3. Desktop & Headless Fallbacks', () => {
    test('defaults to false (mouse) on pure desktop environment with coarse: false and maxTouchPoints: 0', () => {
      const mockGame = {
        device: {
          os: { desktop: true },
          input: { touch: false }
        }
      };
      const options = {
        override: 'auto',
        windowObj: { matchMedia: () => ({ matches: false }) },
        navigatorObj: { maxTouchPoints: 0 }
      };
      assert.equal(DeviceHelper.isTouchInput(mockGame, options), false);
    });

    test('handles missing window, navigator and game objects gracefully without throwing', () => {
      const options = {
        override: 'auto',
        windowObj: null,
        navigatorObj: null
      };
      assert.equal(DeviceHelper.isTouchInput(null, options), false);
    });
  });

  describe('4. Desktop Detection & Desktop Touch Immunity Matrix', () => {
    test('DeviceHelper.isDesktop identifies Windows NT as desktop', () => {
      const env = {
        navigatorObj: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      };
      assert.equal(DeviceHelper.isDesktop(env), true);
    });

    test('DeviceHelper.isDesktop identifies macOS / Macintosh as desktop', () => {
      const env = {
        navigatorObj: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
        }
      };
      assert.equal(DeviceHelper.isDesktop(env), true);
    });

    test('DeviceHelper.isDesktop identifies Linux x86_64 as desktop', () => {
      const env = {
        navigatorObj: {
          userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      };
      assert.equal(DeviceHelper.isDesktop(env), true);
    });

    test('DeviceHelper.isDesktop respects navigator.userAgentData.mobile === false', () => {
      const env = {
        navigatorObj: {
          userAgentData: { mobile: false }
        }
      };
      assert.equal(DeviceHelper.isDesktop(env), true);
    });

    test('DeviceHelper.isDesktop returns false for Android mobile', () => {
      const env = {
        navigatorObj: {
          userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
        }
      };
      assert.equal(DeviceHelper.isDesktop(env), false);
    });

    test('DeviceHelper.isDesktop returns false for iPhone / iOS mobile', () => {
      const env = {
        navigatorObj: {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1'
        }
      };
      assert.equal(DeviceHelper.isDesktop(env), false);
    });

    test('DeviceHelper.isDesktop returns false for navigator.userAgentData.mobile === true', () => {
      const env = {
        navigatorObj: {
          userAgentData: { mobile: true }
        }
      };
      assert.equal(DeviceHelper.isDesktop(env), false);
    });

    test('DeviceHelper.isDesktop respects Phaser game.device.os.desktop flags', () => {
      assert.equal(DeviceHelper.isDesktop({ game: { device: { os: { desktop: true } } } }), true);
      assert.equal(DeviceHelper.isDesktop({ game: { device: { os: { desktop: false } } } }), false);
    });

    test('DeviceHelper.isTouchInput returns false for Windows PC with maxTouchPoints > 0 (desktop touch immunity)', () => {
      const options = {
        override: 'auto',
        windowObj: { matchMedia: () => ({ matches: false }) },
        navigatorObj: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          maxTouchPoints: 10
        }
      };
      assert.equal(DeviceHelper.isTouchInput(null, options), false);
    });

    test('DeviceHelper.isTouchInput returns false for Mac with maxTouchPoints > 0', () => {
      const options = {
        override: 'auto',
        windowObj: { matchMedia: () => ({ matches: false }) },
        navigatorObj: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
          maxTouchPoints: 5
        }
      };
      assert.equal(DeviceHelper.isTouchInput(null, options), false);
    });

    test('DeviceHelper.isTouchInput respects explicit override="touch" even on Windows PC with desktop user agent', () => {
      const options = {
        override: 'touch',
        windowObj: { matchMedia: () => ({ matches: false }) },
        navigatorObj: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          maxTouchPoints: 10
        }
      };
      assert.equal(DeviceHelper.isTouchInput(null, options), true);
    });
  });

});
