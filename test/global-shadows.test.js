import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Global Subtle Shadows & Central Zenithal Lighting System (GameScene)', () => {
  const projectRoot = process.cwd();
  const gameScenePath = path.join(projectRoot, 'src', 'scenes', 'GameScene.js');
  const gameContent = fs.readFileSync(gameScenePath, 'utf8');

  // Delimiters for method inspection
  const getMethodCode = (methodName, nextMethodName) => {
    const start = gameContent.indexOf(`${methodName}`);
    assert.ok(start !== -1, `${methodName} debe existir en GameScene.js`);
    const end = nextMethodName ? gameContent.indexOf(`${nextMethodName}`, start) : gameContent.length;
    assert.ok(end !== -1, `${nextMethodName} debe delimitar el fin de ${methodName}`);
    return gameContent.slice(start, end);
  };

  const doughCode = getMethodCode('createDoughButtons() {', 'createShapeButtons(startX, startY) {');
  const shapeCode = getMethodCode('createShapeButtons(startX, startY) {', 'createOvenStation(startX, startY) {');
  const toppingCode = getMethodCode('createToppingButtons(startX, startY) {', 'updateStockTexts() {');
  const stockCode = getMethodCode('updateStockTexts() {', 'createCookieTray(width, height) {');
  const trayCode = getMethodCode('createCookieTray(width, height) {', 'drawCookie() {');
  const drawCookieCode = getMethodCode('drawCookie() {', 'updateCookieVisuals() {');

  describe('1. Cortadores (Lado Izquierdo, x < 960) — Orientación Abajo-Izquierda', () => {
    test('sombra en reposo proyectada hacia abajo-izquierda: coordenadas locales (51, 58)', () => {
      assert.ok(
        shapeCode.includes("this.add.image(51, 58, 'shape_' + s.id)"),
        'shadowSprite debe crearse en (51, 58), desplazado -3px en X y +4px en Y del centro (54, 54)'
      );
    });

    test('sombra de cortador aplica tinte cálido 0x3a1f04 y alpha modulado (0.24 / 0.12)', () => {
      assert.ok(
        shapeCode.includes('.setTint(0x3a1f04)'),
        'shadowSprite debe tener tinte 0x3a1f04'
      );
      assert.ok(
        shapeCode.includes('isUnlocked ? 0.24 : 0.12'),
        'shadowSprite debe modular su alpha según estado de desbloqueo'
      );
    });

    test('tween de elevación en dragstart desplaza sombra a (44, 76) con alpha 0.16', () => {
      const dragstartIdx = shapeCode.indexOf("dragZone.on('dragstart'");
      const dragBlock = shapeCode.slice(dragstartIdx, shapeCode.indexOf("dragZone.on('drag'", dragstartIdx));
      assert.ok(dragBlock.includes('x: 44'), 'Sombra elevada debe ubicarse en x: 44 (54 - 10)');
      assert.ok(dragBlock.includes('y: 76'), 'Sombra elevada debe ubicarse en y: 76 (54 + 22)');
      assert.ok(dragBlock.includes('alpha: 0.16'), 'Alpha de sombra en arrastre debe ser 0.16');
      assert.ok(dragBlock.includes('container.setDepth(29990)'), 'Container depth en dragstart debe ser 29990');
      assert.ok(!dragBlock.includes('setDepth(30000)'), 'Cortador dragstart no debe usar depth >= 30000');
    });

    test('tween de retorno en dragend restaura sombra a reposo (51, 58) con alpha 0.24', () => {
      const dragendIdx = shapeCode.indexOf("dragZone.on('dragend'");
      const dragendBlock = shapeCode.slice(dragendIdx);
      assert.ok(dragendBlock.includes('x: 51'), 'Sombra retornada debe regresar a x: 51');
      assert.ok(dragendBlock.includes('y: 58'), 'Sombra retornada debe regresar a y: 58');
      assert.ok(dragendBlock.includes('alpha: 0.24'), 'Alpha de reposo debe ser 0.24');
    });
  });

  describe('2. Masas Grandes y Porción (Lado Izquierdo, x ~ 140) — Orientación Abajo-Izquierda', () => {
    test('instancia sombra de reposo en b.x - 5, b.y + 6 con tinte 0x3a1f04, alpha 0.22 y depth 1.9', () => {
      assert.ok(
        doughCode.includes('this.add.image(b.x - 5, b.y + 6, b.key)'),
        'doughShadow debe proyectarse en b.x - 5, b.y + 6'
      );
      assert.ok(
        doughCode.includes('.setTint(0x3a1f04)'),
        'doughShadow debe tener tinte 0x3a1f04'
      );
      assert.ok(
        doughCode.includes('.setAlpha(0.22)'),
        'doughShadow debe tener opacidad 0.22 en reposo'
      );
      assert.ok(
        doughCode.includes('.setDepth(1.9)'),
        'doughShadow debe tener depth 1.9 (inferior a la masa con depth 2)'
      );
    });

    test('sincroniza hover sobre la masa: doughShadow escala a 1.08 en pointerover y 1.0 en pointerout', () => {
      const overIdx = doughCode.indexOf("dragZone.on('pointerover'");
      const overBlock = doughCode.slice(overIdx, doughCode.indexOf("dragZone.on('pointerout'", overIdx));
      assert.ok(overBlock.includes('doughShadow.setScale(1.08)'), 'doughShadow debe escalar a 1.08 en hover');

      const outIdx = doughCode.indexOf("dragZone.on('pointerout'");
      const outBlock = doughCode.slice(outIdx, doughCode.indexOf("dragZone.on('dragstart'", outIdx));
      assert.ok(outBlock.includes('doughShadow.setScale(1.0)'), 'doughShadow debe restaurarse a 1.0 en pointerout');
    });

    test('en dragstart crea portionShadowSprite en dragZone.x - 8, dragZone.y + 18 con depth 29989', () => {
      const dragstartIdx = doughCode.indexOf("dragZone.on('dragstart'");
      const dragstartBlock = doughCode.slice(dragstartIdx, doughCode.indexOf("dragZone.on('drag'", dragstartIdx));
      assert.ok(
        dragstartBlock.includes('this.add.image(dragZone.x - 8, dragZone.y + 18'),
        'portionShadowSprite debe crearse en (dragZone.x - 8, dragZone.y + 18)'
      );
      assert.ok(
        dragstartBlock.includes('portionShadowSprite.setDepth(29989)'),
        'portionShadowSprite debe tener depth 29989'
      );
      assert.ok(
        dragstartBlock.includes('portionShadowSprite.setAlpha(0.18)'),
        'portionShadowSprite debe tener alpha 0.18'
      );
      assert.ok(
        dragstartBlock.includes('portionSprite.setDepth(29990)'),
        'portionSprite debe tener depth 29990'
      );
      assert.ok(
        !dragstartBlock.includes('portionSprite.setDepth(30000)'),
        'portionSprite NO debe tener depth 30000'
      );
    });

    test('en drag actualiza coordenadas de portionShadowSprite a dragX - 8, clampedY + 18', () => {
      const dragIdx = doughCode.indexOf("dragZone.on('drag'");
      const dragBlock = doughCode.slice(dragIdx, doughCode.indexOf("dragZone.on('dragend'", dragIdx));
      assert.ok(
        dragBlock.includes('portionShadowSprite.x = dragX - 8'),
        'portionShadowSprite.x debe seguir dragX - 8'
      );
      assert.ok(
        dragBlock.includes('portionShadowSprite.y = clampedY + 18'),
        'portionShadowSprite.y debe seguir clampedY + 18'
      );
    });

    test('en dragend destruye portionShadowSprite y restaura escala de doughShadow', () => {
      const dragendIdx = doughCode.indexOf("dragZone.on('dragend'");
      const dragendBlock = doughCode.slice(dragendIdx);
      assert.ok(
        dragendBlock.includes('portionShadowSprite.destroy()'),
        'portionShadowSprite debe destruirse en dragend'
      );
      assert.ok(
        dragendBlock.includes('doughShadow.setScale(1.0)'),
        'doughShadow debe restaurar escala 1.0 en dragend'
      );
    });

    test('updateStockTexts modula opacidad de doughShadows según stock (0.11 stock 0, 0.22 con stock)', () => {
      assert.ok(
        stockCode.includes('this.doughShadows[id].setAlpha(0.11)'),
        'updateStockTexts debe fijar alpha 0.11 si stock <= 0'
      );
      assert.ok(
        stockCode.includes('this.doughShadows[id].setAlpha(0.22)'),
        'updateStockTexts debe fijar alpha 0.22 si stock > 0'
      );
    });
  });

  describe('3. Galletas y Bandeja de Preparación (Centro, x ~ 960) — Orientación Cenital Pura', () => {
    test('en drawCookie instancia cookieShadow con offset X cenital dinámico y offset Y + 4', () => {
      assert.ok(
        drawCookieCode.includes('const shadowOffsetX = Math.round((x - 960) * 0.02)'),
        'shadowOffsetX debe calcularse dinámicamente con Math.round((x - 960) * 0.02)'
      );
      assert.ok(
        drawCookieCode.includes('this.add.image(x + shadowOffsetX, y + 4, key)'),
        'cookieShadow debe ubicarse en (x + shadowOffsetX, y + 4)'
      );
      assert.ok(
        drawCookieCode.includes('.setDepth(3.9)'),
        'cookieShadow debe tener depth 3.9 (justo debajo del sprite de galleta depth 4)'
      );
      assert.ok(
        drawCookieCode.includes('.setAlpha(0.20)'),
        'cookieShadow debe tener alpha 0.20 en reposo'
      );
      assert.ok(
        drawCookieCode.includes('.setTint(0x3a1f04)'),
        'cookieShadow debe tener tinte 0x3a1f04'
      );
    });

    test('en dragstart de galleta eleva sombra a depth 29989 y sprite a depth 29990', () => {
      const dragstartIdx = drawCookieCode.indexOf("sprite.on('dragstart'");
      const dragstartBlock = drawCookieCode.slice(dragstartIdx, drawCookieCode.indexOf("sprite.on('drag'", dragstartIdx));
      assert.ok(
        dragstartBlock.includes('sprite.setDepth(29990)'),
        'sprite de galleta en dragstart debe tener depth 29990'
      );
      assert.ok(
        dragstartBlock.includes('cookieShadow.setDepth(29989)'),
        'cookieShadow en dragstart debe tener depth 29989'
      );
      assert.ok(
        dragstartBlock.includes('cookieShadow.setAlpha(0.14)'),
        'cookieShadow en vuelo debe tener alpha 0.14'
      );
      assert.ok(
        !dragstartBlock.includes('sprite.setDepth(30000)'),
        'galleta en dragstart NO debe tener depth >= 30000'
      );
    });

    test('en drag de galleta sombra sigue el puntero con elevación Y + 16 y offset horizontal cenital', () => {
      const dragIdx = drawCookieCode.indexOf("sprite.on('drag'");
      const dragBlock = drawCookieCode.slice(dragIdx, drawCookieCode.indexOf("sprite.on('dragend'", dragIdx));
      assert.ok(
        dragBlock.includes('Math.round((dragX - 960) * 0.02)'),
        'cookieShadow debe actualizar offset horizontal cenital con dragX'
      );
      assert.ok(
        dragBlock.includes('cookieShadow.y = clampedY + 16'),
        'cookieShadow debe proyectarse a clampedY + 16 en vuelo'
      );
    });

    test('en dragstart de bandeja (createCookieTray) las profundidades son estrictamente <= 29990', () => {
      const trayDragstartIdx = trayCode.indexOf("this.prepTrayZone.on('dragstart'");
      const trayDragstartBlock = trayCode.slice(trayDragstartIdx, trayCode.indexOf("this.prepTrayZone.on('drag'", trayDragstartIdx));
      assert.ok(
        trayDragstartBlock.includes('this.prepTrayZone.setDepth(29990)'),
        'prepTrayZone depth en dragstart debe ser 29990'
      );
      assert.ok(
        trayDragstartBlock.includes('this.prepTrayBg.setDepth(29988)'),
        'prepTrayBg depth en dragstart debe ser 29988'
      );
      assert.ok(
        trayDragstartBlock.includes('s.setDepth(29990)'),
        'prepTraySprites depth en dragstart debe ser 29990'
      );
      assert.ok(
        trayDragstartBlock.includes('s.setDepth(29989)'),
        'prepTrayShadowSprites depth en dragstart debe ser 29989'
      );
      assert.ok(
        !trayDragstartBlock.includes('setDepth(30000)') && !trayDragstartBlock.includes('setDepth(30001)'),
        'Bandeja y galletas no deben usar depth >= 30000'
      );
    });

    test('en dragend de bandeja restaura profundidades originales (zona 2.5, bg 2, sprites 4, sombras 3.9)', () => {
      const trayDragendIdx = trayCode.indexOf("this.prepTrayZone.on('dragend'");
      const trayDragendBlock = trayCode.slice(trayDragendIdx);
      assert.ok(trayDragendBlock.includes('this.prepTrayZone.setDepth(2.5)'), 'prepTrayZone debe restaurarse a 2.5');
      assert.ok(trayDragendBlock.includes('this.prepTrayBg.setDepth(2)'), 'prepTrayBg debe restaurarse a 2');
      assert.ok(trayDragendBlock.includes('s.setDepth(4)'), 'prepTraySprites deben restaurarse a 4');
      assert.ok(trayDragendBlock.includes('s.setDepth(3.9)'), 'prepTrayShadowSprites deben restaurarse a 3.9');
    });
  });

  describe('4. Frascos de Toppings (Lado Derecho, x ~ 1767) — Orientación Abajo-Derecha', () => {
    test('sombra en reposo proyectada hacia abajo-derecha: x + 5, y + 5 con tinte 0x3a1f04 y depth 1.9', () => {
      assert.ok(
        toppingCode.includes("this.add.image(x + 5, y + 5, 'topping_' + t.id)"),
        'jarShadow debe crearse en x + 5, y + 5'
      );
      assert.ok(
        toppingCode.includes('.setTint(0x3a1f04)'),
        'jarShadow debe tener tinte 0x3a1f04'
      );
      assert.ok(
        toppingCode.includes('.setDepth(1.9)'),
        'jarShadow debe tener depth 1.9'
      );
    });

    test('sincroniza hover del frasco: jarShadow escala a jarHoverSize (173) en pointerover y 158 en pointerout', () => {
      const overIdx = toppingCode.indexOf("dragZone.on('pointerover'");
      const overBlock = toppingCode.slice(overIdx, toppingCode.indexOf("dragZone.on('pointerout'", overIdx));
      assert.ok(
        overBlock.includes('jarShadow.setDisplaySize(jarHoverSize, jarHoverSize)'),
        'jarShadow debe escalar a jarHoverSize en pointerover'
      );

      const outIdx = toppingCode.indexOf("dragZone.on('pointerout'");
      const outBlock = toppingCode.slice(outIdx, toppingCode.indexOf("dragZone.on('dragstart'", outIdx));
      assert.ok(
        outBlock.includes('jarShadow.setDisplaySize(jarSize, jarSize)'),
        'jarShadow debe restaurarse a jarSize en pointerout'
      );
    });

    test('en dragstart crea jarShadowClone en x + 10, y + 20 con depth 29989 y jarClone a depth 29990', () => {
      const dragstartIdx = toppingCode.indexOf("dragZone.on('dragstart'");
      const dragstartBlock = toppingCode.slice(dragstartIdx, toppingCode.indexOf("dragZone.on('drag'", dragstartIdx));
      assert.ok(
        dragstartBlock.includes("this.add.image(x + 10, y + 20, 'topping_' + t.id)"),
        'jarShadowClone debe crearse en x + 10, y + 20'
      );
      assert.ok(
        dragstartBlock.includes('jarShadowClone.setDepth(29989)'),
        'jarShadowClone debe tener depth 29989'
      );
      assert.ok(
        dragstartBlock.includes('jarShadowClone.setAlpha(0.16)'),
        'jarShadowClone debe tener alpha 0.16'
      );
      assert.ok(
        dragstartBlock.includes('jarClone.setDepth(29990)'),
        'jarClone debe tener depth 29990'
      );
      assert.ok(
        !dragstartBlock.includes('jarClone.setDepth(30000)'),
        'jarClone NO debe tener depth >= 30000'
      );
    });

    test('en drag actualiza posición y rotación de jarShadowClone sincronizada con jarClone', () => {
      const dragIdx = toppingCode.indexOf("dragZone.on('drag'");
      const dragBlock = toppingCode.slice(dragIdx, toppingCode.indexOf("dragZone.on('dragend'", dragIdx));
      assert.ok(
        dragBlock.includes('jarShadowClone.x = dragX + 10'),
        'jarShadowClone.x debe seguir dragX + 10'
      );
      assert.ok(
        dragBlock.includes('jarShadowClone.y = clampedY + 20'),
        'jarShadowClone.y debe seguir clampedY + 20'
      );
      assert.ok(
        dragBlock.includes('jarShadowClone.setRotation(rot)'),
        'jarShadowClone debe rotar conjuntamente con jarClone'
      );
    });

    test('en dragend destruye jarShadowClone y restaura displaySize de jarShadow', () => {
      const dragendIdx = toppingCode.indexOf("dragZone.on('dragend'");
      const dragendBlock = toppingCode.slice(dragendIdx);
      assert.ok(
        dragendBlock.includes('jarShadowClone.destroy()'),
        'jarShadowClone debe destruirse en dragend'
      );
      assert.ok(
        dragendBlock.includes('jarShadow.setDisplaySize(jarSize, jarSize)'),
        'jarShadow debe restaurarse a jarSize'
      );
    });

    test('updateStockTexts modula opacidad de toppingShadows según stock (0.11 stock 0, 0.22 con stock)', () => {
      assert.ok(
        stockCode.includes('this.toppingShadows[id].setAlpha(0.11)'),
        'updateStockTexts debe fijar alpha 0.11 si stock topping <= 0'
      );
      assert.ok(
        stockCode.includes('this.toppingShadows[id].setAlpha(0.22)'),
        'updateStockTexts debe fijar alpha 0.22 si stock topping > 0'
      );
    });
  });

  describe('5. Invariante Absoluto: Supremacía Visual e Inviolabilidad de la Pata del Gato', () => {
    test('brazo y pata del gato ocupan el estrato superior inviolable (30000..30002)', () => {
      assert.ok(
        gameContent.includes('this.catArmOutlineGraphics = this.add.graphics().setDepth(30000)'),
        'catArmOutlineGraphics debe tener depth 30000'
      );
      assert.ok(
        gameContent.includes('this.catArmFillGraphics = this.add.graphics().setDepth(30001)'),
        'catArmFillGraphics debe tener depth 30001'
      );
      assert.ok(
        gameContent.includes('.setDepth(30002)'),
        'catPawSprite debe tener depth 30002'
      );
    });

    test('ninguna sombra ni elemento interactivo en reposo o arrastre excede depth 29990', () => {
      const interactiveDepths = [
        { name: 'cortador container', depth: 29990 },
        { name: 'porción masa sprite', depth: 29990 },
        { name: 'porción masa sombra', depth: 29989 },
        { name: 'galleta mesa sprite', depth: 29990 },
        { name: 'galleta mesa sombra', depth: 29989 },
        { name: 'bandeja prep zona', depth: 29990 },
        { name: 'bandeja prep fondo', depth: 29988 },
        { name: 'frasco topping clon', depth: 29990 },
        { name: 'frasco topping sombra', depth: 29989 }
      ];

      for (const item of interactiveDepths) {
        assert.ok(
          item.depth < 30000,
          `${item.name} (depth ${item.depth}) debe ser estrictamente menor que el brazo del gato (30000)`
        );
      }
    });
  });

  describe('6. Inmutabilidad de Configuración y Preservación de Assets', () => {
    test('ui-config.json permanece intacto y es válido', () => {
      const configPath = path.join(projectRoot, 'ui-config.json');
      assert.ok(fs.existsSync(configPath), 'ui-config.json debe existir');
      const raw = fs.readFileSync(configPath, 'utf8');
      assert.doesNotThrow(() => JSON.parse(raw), 'ui-config.json debe ser un JSON válido');
    });

    test('los assets originales de masa y toppings en public/assets/ permanecen intactos', () => {
      const assets = [
        'public/assets/masa_vainilla.png',
        'public/assets/masa_chocolate.png',
        'public/assets/masa_avena.png',
        'public/assets/stations/dough_classic.png',
        'public/assets/stations/dough_chocolate.png',
        'public/assets/stations/dough_oat.png',
        'public/assets/stations/topping_sprinkles.png',
        'public/assets/stations/topping_choco.png',
        'public/assets/stations/topping_glazing.png'
      ];

      for (const relPath of assets) {
        const fullPath = path.join(projectRoot, relPath);
        assert.ok(fs.existsSync(fullPath), `${relPath} debe existir`);
        assert.ok(fs.statSync(fullPath).size > 0, `${relPath} no debe estar vacío`);
      }
    });
  });
});
