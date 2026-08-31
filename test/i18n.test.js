import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import I18nManager from '../src/game/services/I18nManager.js';
import en from '../src/locales/en.js';
import es from '../src/locales/es.js';

describe('I18nManager - Localization Engine & English Default Matrix', () => {
  test('returns singleton instance and defaults to English', () => {
    const i18n = I18nManager.getInstance({ reset: true });
    assert.equal(i18n.getLanguage(), 'en');
  });

  test('translates simple keys in English', () => {
    const i18n = I18nManager.getInstance({ reset: true, language: 'en' });
    assert.equal(i18n.t('mainMenu.play'), 'PLAY');
    assert.equal(i18n.t('mainMenu.newGame'), 'NEW GAME');
    assert.equal(i18n.t('mainMenu.continue'), 'CONTINUE');
  });

  test('interpolates parameters correctly in strings', () => {
    const i18n = I18nManager.getInstance({ reset: true, language: 'en' });
    assert.equal(i18n.t('hud.day', { day: 3 }), 'DAY 3');
    assert.equal(i18n.t('hud.coins', { coins: 150 }), '150');
    assert.equal(i18n.t('hud.goal', { meta: 200 }), '200');
  });

  test('switches language cleanly to Spanish', () => {
    const i18n = I18nManager.getInstance({ reset: true, language: 'en' });
    i18n.setLanguage('es');
    assert.equal(i18n.getLanguage(), 'es');
    assert.equal(i18n.t('mainMenu.play'), 'JUGAR');
    assert.equal(i18n.t('hud.day', { day: 2 }), 'DÍA 2');
  });

  test('falls back to English when translation key is missing in Spanish', () => {
    const mockLocales = {
      en: { testKey: 'English Fallback', nested: { sub: 'Sub English' } },
      es: { testOther: 'Solo Español' }
    };

    const i18n = I18nManager.getInstance({ reset: true, language: 'es', locales: mockLocales });
    assert.equal(i18n.t('testKey'), 'English Fallback');
    assert.equal(i18n.t('nested.sub'), 'Sub English');
  });

  test('returns the key itself when translation does not exist in any locale', () => {
    const i18n = I18nManager.getInstance({ reset: true, language: 'en' });
    assert.equal(i18n.t('non.existent.key'), 'non.existent.key');
  });

  test('returns translation arrays directly when key points to array', () => {
    const i18n = I18nManager.getInstance({ reset: true, language: 'en' });
    const enDialogues = i18n.t('customer.scratchDialogues');
    assert.ok(Array.isArray(enDialogues));
    assert.ok(enDialogues.length >= 4);

    i18n.setLanguage('es');
    const esDialogues = i18n.t('customer.scratchDialogues');
    assert.ok(Array.isArray(esDialogues));
    assert.ok(esDialogues.length >= 4);
  });

  test('persists selected language in storage and restores it', () => {
    const memoryStorage = new Map();
    const mockStorage = {
      getItem: (k) => memoryStorage.get(k) || null,
      setItem: (k, v) => memoryStorage.set(k, String(v))
    };

    const instance1 = I18nManager.getInstance({ reset: true, storage: mockStorage });
    instance1.setLanguage('es');
    assert.equal(mockStorage.getItem('kiwibakery_language'), 'es');

    const instance2 = I18nManager.getInstance({ reset: true, storage: mockStorage });
    assert.equal(instance2.getLanguage(), 'es');
  });

  test('validates all required top-level namespaces exist in both locales', () => {
    const requiredNamespaces = [
      'boot',
      'mainMenu',
      'hud',
      'stations',
      'recipes',
      'customer',
      'game',
      'audio',
      'settings',
      'editor',
      'summary',
      'shop',
      'gameOver',
      'victory'
    ];

    for (const ns of requiredNamespaces) {
      assert.ok(en[ns], `Missing namespace ${ns} in English locale`);
      assert.ok(es[ns], `Missing namespace ${ns} in Spanish locale`);
    }
  });

  test('validates that English and Spanish translation schemas have 100% structural parity', () => {
    function getDeepKeys(obj, prefix = '') {
      let keys = [];
      for (const k of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
          keys = keys.concat(getDeepKeys(obj[k], fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys;
    }

    const enKeys = getDeepKeys(en).sort();
    const esKeys = getDeepKeys(es).sort();

    // Check all EN keys exist in ES
    for (const k of enKeys) {
      assert.ok(esKeys.includes(k), `Missing key in Spanish locale: ${k}`);
    }

    // Check all ES keys exist in EN
    for (const k of esKeys) {
      assert.ok(enKeys.includes(k), `Missing key in English locale: ${k}`);
    }

    assert.equal(enKeys.length, esKeys.length, 'Total translation key counts must match exactly');
  });

  test('validates that all translation values are non-empty strings or non-empty string arrays', () => {
    function validateValues(obj, localeName, prefix = '') {
      for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (Array.isArray(value)) {
          assert.ok(value.length > 0, `Empty array at ${localeName}:${path}`);
          for (const item of value) {
            assert.equal(typeof item, 'string', `Array item must be string at ${localeName}:${path}`);
            assert.ok(item.trim().length > 0, `Empty string in array at ${localeName}:${path}`);
          }
        } else if (typeof value === 'object' && value !== null) {
          validateValues(value, localeName, path);
        } else {
          assert.equal(typeof value, 'string', `Value must be string at ${localeName}:${path}`);
          assert.ok(value.trim().length > 0, `Empty string at ${localeName}:${path}`);
        }
      }
    }

    validateValues(en, 'en');
    validateValues(es, 'es');
  });

  test('validates correction of retryCampaign in Spanish locale', () => {
    assert.equal(es.gameOver.retryCampaign, 'REINTENTAR CAMPAÑA 🔄');
    assert.equal(en.gameOver.retryCampaign, 'RETRY CAMPAIGN 🔄');
  });

  test('validates newly canonicalized game keys (trayEmptied, stock, stockInfinite)', () => {
    const i18n = I18nManager.getInstance({ reset: true, language: 'en' });
    assert.equal(i18n.t('game.feedback.trayEmptied'), 'Tray Emptied! 🗑️');
    assert.equal(i18n.t('game.feedback.ovenEmpty'), 'Oven is empty!');
    assert.equal(i18n.t('game.stock', { qty: 5 }), 'Stock: 5');
    assert.equal(i18n.t('game.stockInfinite'), 'Stock: ∞');

    i18n.setLanguage('es');
    assert.equal(i18n.t('game.feedback.trayEmptied'), '¡Bandeja Vaciada! 🗑️');
    assert.equal(i18n.t('game.feedback.ovenEmpty'), '¡El horno está vacío!');
    assert.equal(i18n.t('game.stock', { qty: 5 }), 'Stock: 5');
    assert.equal(i18n.t('game.stockInfinite'), 'Stock: ∞');
  });

  test('validates complete eradication of residual hardcoded Spanish strings in GameScene.js', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const gameSceneContent = fs.readFileSync(path.resolve('src/scenes/GameScene.js'), 'utf-8');

    // Forbidden hardcoded strings
    assert.ok(!gameSceneContent.includes("'¡Bandeja Vaciada! 🗑️'"), 'GameScene must not contain hardcoded Spanish tray emptied');
    assert.ok(!gameSceneContent.includes("'¡El horno está vacío!'"), 'GameScene must not contain hardcoded Spanish oven empty');
    assert.ok(!gameSceneContent.includes("'Estrella Clásica'"), 'GameScene must not contain hardcoded Spanish Estrella Clásica');
  });

  test('validates PillSwitcher integration in all 5 key scenes with 320x82 scale and calibrated coordinates', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    const sceneSpecs = [
      { path: 'src/scenes/MainMenuScene.js', expectedY: 'y: 90', expectedWidth: 'width: 320', expectedHeight: 'height: 82' },
      { path: 'src/scenes/ShopScene.js', expectedY: 'y: 85', expectedWidth: 'width: 320', expectedHeight: 'height: 82' },
      { path: 'src/scenes/SummaryScene.js', expectedY: 'y: 80', expectedWidth: 'width: 320', expectedHeight: 'height: 82' },
      { path: 'src/scenes/GameOverScene.js', expectedY: 'y: 85', expectedWidth: 'width: 320', expectedHeight: 'height: 82' },
      { path: 'src/scenes/VictoryScene.js', expectedY: 'y: 85', expectedWidth: 'width: 320', expectedHeight: 'height: 82' }
    ];

    for (const spec of sceneSpecs) {
      const content = fs.readFileSync(path.resolve(spec.path), 'utf-8');
      assert.ok(content.includes('PillSwitcher'), `${spec.path} must import and instantiate PillSwitcher`);
      assert.ok(content.includes('width - 190'), `${spec.path} must place PillSwitcher at x: width - 190`);
      assert.ok(content.includes(spec.expectedY), `${spec.path} must place PillSwitcher at ${spec.expectedY}`);
      assert.ok(content.includes(spec.expectedWidth), `${spec.path} must specify ${spec.expectedWidth}`);
      assert.ok(content.includes(spec.expectedHeight), `${spec.path} must specify ${spec.expectedHeight}`);
    }

    const pillSwitcherContent = fs.readFileSync(path.resolve('src/game/PillSwitcher.js'), 'utf-8');
    assert.ok(pillSwitcherContent.includes('320'), 'PillSwitcher.js default width must be 320');
    assert.ok(pillSwitcherContent.includes('82'), 'PillSwitcher.js default height must be 82');
    assert.ok(pillSwitcherContent.includes('0x432818'), 'PillSwitcher.js base fill must be cacao 0x432818');
    assert.ok(pillSwitcherContent.includes('0x38b000'), 'PillSwitcher.js active badge fill must be Kiwipaw 0x38b000');
    assert.ok(pillSwitcherContent.includes('drawFlag'), 'PillSwitcher.js must define drawFlag for procedural flag graphics');
    assert.ok(pillSwitcherContent.includes('0xB22234'), 'PillSwitcher.js must render US red stripes 0xB22234');
    assert.ok(pillSwitcherContent.includes('0x3C3B6E'), 'PillSwitcher.js must render US navy canton 0x3C3B6E');
    assert.ok(pillSwitcherContent.includes('0xAA151B'), 'PillSwitcher.js must render Spain red stripes 0xAA151B');
    assert.ok(pillSwitcherContent.includes('0xF1BF00'), 'PillSwitcher.js must render Spain gold stripe 0xF1BF00');
    assert.ok(pillSwitcherContent.includes('38px'), 'PillSwitcher.js active font size must be 38px');
    assert.ok(pillSwitcherContent.includes('32px'), 'PillSwitcher.js inactive font size must be 32px');
    assert.ok(pillSwitcherContent.includes("'EN'"), "PillSwitcher.js must contain decoupled 'EN' label");
    assert.ok(pillSwitcherContent.includes("'ES'"), "PillSwitcher.js must contain decoupled 'ES' label");
    assert.ok(pillSwitcherContent.includes("fontFamily: 'Outfit, sans-serif'"), 'PillSwitcher.js must use structured Outfit font stack');
  });
});
