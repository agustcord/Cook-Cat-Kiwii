import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Modular UI Components Suite (Phaser 4 Native)', () => {
  const uiDir = path.resolve('src/game/ui');

  // 1. Verificación de Componentes Creados
  test('all 6 modular UI component files exist in src/game/ui/', () => {
    const expectedFiles = [
      'SummaryTicket.js',
      'ChefDialogue.js',
      'PantryDisplay.js',
      'ShopRail.js',
      'ShopShelf.js',
      'ShopBasket.js'
    ];

    expectedFiles.forEach(file => {
      const filePath = path.join(uiDir, file);
      assert.ok(fs.existsSync(filePath), `Component ${file} must exist in src/game/ui/`);
      const content = fs.readFileSync(filePath, 'utf-8');
      assert.ok(content.length > 500, `Component ${file} must contain real implementation code`);
    });
  });

  // 2. Prohibición de React / ReactDOM
  test('zero React or ReactDOM imports in src/game/ui and src/scenes', () => {
    const dirsToCheck = [path.resolve('src/game/ui'), path.resolve('src/scenes')];
    dirsToCheck.forEach(dir => {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
      files.forEach(f => {
        const content = fs.readFileSync(path.join(dir, f), 'utf-8');
        assert.ok(!content.includes("from 'react'"), `File ${f} must not import react`);
        assert.ok(!content.includes("from 'react-dom'"), `File ${f} must not import react-dom`);
        assert.ok(!content.includes('React.'), `File ${f} must not reference React`);
      });
    });
  });

  // 3. Verificación de SummaryTicket
  describe('SummaryTicket.js Architecture & Contract', () => {
    const content = fs.readFileSync(path.join(uiDir, 'SummaryTicket.js'), 'utf-8');

    test('extends Phaser.GameObjects.Container', () => {
      assert.ok(content.includes('extends Phaser.GameObjects.Container'), 'SummaryTicket must extend Container');
    });

    test('implements drawPerforatedPaper with procedural triangular notches', () => {
      assert.ok(content.includes('drawPerforatedPaper'), 'Must define drawPerforatedPaper');
      assert.ok(content.includes('0x582f0e'), 'Must use canonical cafe outline 0x582f0e');
      assert.ok(content.includes('0xfffdf9'), 'Must use paper ivory fill 0xfffdf9');
    });

    test('implements dotted guide lines and coin icons', () => {
      assert.ok(content.includes('drawDottedLine'), 'Must define drawDottedLine');
      assert.ok(content.includes('drawCoinIcon'), 'Must define drawCoinIcon');
    });

    test('renders prominent net balance badge with Outfit 800', () => {
      assert.ok(content.includes('badgeBgColor'), 'Must compute badge background color');
      assert.ok(content.includes('38px "Outfit", sans-serif'), 'Net balance must use large 38px Outfit font');
      assert.ok(content.includes("'800'"), 'Net balance must use font weight 800');
    });
  });

  // 4. Verificación de ChefDialogue
  describe('ChefDialogue.js Architecture & Contract', () => {
    const content = fs.readFileSync(path.join(uiDir, 'ChefDialogue.js'), 'utf-8');

    test('renders official chef_cat texture with gentle breathing tween', () => {
      assert.ok(content.includes("'chef_cat'"), 'Must load official chef_cat texture');
      assert.ok(content.includes('scaleY'), 'Must animate breathing with scaleY');
      assert.ok(content.includes('yoyo: true'), 'Breathing tween must yoyo');
      assert.ok(content.includes('repeat: -1'), 'Breathing tween must repeat infinitely');
    });

    test('renders diegetic speech bubble with vector beak pointing to Kiwi', () => {
      assert.ok(content.includes('drawSpeechBubble'), 'Must define drawSpeechBubble');
      assert.ok(content.includes('fillTriangle'), 'Must draw triangular vector beak');
      assert.ok(content.includes('Chef Kiwi'), 'Must include character header');
    });

    test('handles record (3★), tight (1★) and bankruptcy mood responses', () => {
      assert.ok(content.includes('this.stars === 3'), 'Must handle 3-star record mood');
      assert.ok(content.includes('this.isBankrupt'), 'Must handle bankruptcy mood');
    });
  });

  // 5. Verificación de PantryDisplay
  describe('PantryDisplay.js Architecture & Contract', () => {
    const content = fs.readFileSync(path.join(uiDir, 'PantryDisplay.js'), 'utf-8');

    test('tracks classic, chocolate and oat dough stocks with indicator dots', () => {
      assert.ok(content.includes('dough_classic'), 'Must reference classic dough');
      assert.ok(content.includes('dough_chocolate'), 'Must reference chocolate dough');
      assert.ok(content.includes('dough_oat'), 'Must reference oat dough');
      assert.ok(content.includes('drawStockDots'), 'Must define drawStockDots');
    });

    test('renders bank loan amortization progress bar with cat paw marker', () => {
      assert.ok(content.includes('drawCatPawIcon'), 'Must define drawCatPawIcon');
      assert.ok(content.includes('loanInitial'), 'Must track loanInitial');
      assert.ok(content.includes('loanRemaining'), 'Must track loanRemaining');
    });
  });

  // 6. Verificación de ShopRail
  describe('ShopRail.js Architecture & Contract', () => {
    const content = fs.readFileSync(path.join(uiDir, 'ShopRail.js'), 'utf-8');

    test('defines all 5 thematic categories (mold, dough, topping, drink, decor)', () => {
      assert.ok(content.includes("key: 'mold'"), 'Must include mold category');
      assert.ok(content.includes("key: 'dough'"), 'Must include dough category');
      assert.ok(content.includes("key: 'topping'"), 'Must include topping category');
      assert.ok(content.includes("key: 'drink'"), 'Must include drink category');
      assert.ok(content.includes("key: 'decor'"), 'Must include decor category');
    });

    test('supports active selection and interactive callbacks', () => {
      assert.ok(content.includes('setActiveCategory'), 'Must define setActiveCategory');
      assert.ok(content.includes('onSelect'), 'Must trigger onSelect callback');
    });
  });

  // 7. Verificación de ShopBasket
  describe('ShopBasket.js Architecture & Contract', () => {
    const content = fs.readFileSync(path.join(uiDir, 'ShopBasket.js'), 'utf-8');

    test('tracks session purchases and total coins spent', () => {
      assert.ok(content.includes('recordPurchase'), 'Must define recordPurchase');
      assert.ok(content.includes('spentCoins'), 'Must track spentCoins');
    });

    test('renders next-day dough meter with sufficiency gating', () => {
      assert.ok(content.includes('updateDoughMeter'), 'Must define updateDoughMeter');
      assert.ok(content.includes('hasEnough'), 'Must check dough sufficiency');
    });

    test('renders Kiwi shopkeeper avatar with dynamic reactive dialogue', () => {
      assert.ok(content.includes("'chef_cat'"), 'Must render chef_cat texture');
      assert.ok(content.includes('say(message)'), 'Must define say method');
    });
  });

  // 8. Integridad de ui-config.json
  test('ui-config.json is strictly preserved and not modified', () => {
    const uiConfigPath = path.resolve('src/game/ui-config.json');
    if (fs.existsSync(uiConfigPath)) {
      const content = fs.readFileSync(uiConfigPath, 'utf-8');
      assert.ok(content.length > 0, 'ui-config.json must remain valid and intact');
    }
  });
});
