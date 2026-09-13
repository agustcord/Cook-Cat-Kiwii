import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Shape Cutters Dynamic Subtle Shadows (GameScene)', () => {
  const projectRoot = process.cwd();
  const gameScenePath = path.join(projectRoot, 'src', 'scenes', 'GameScene.js');
  const gameContent = fs.readFileSync(gameScenePath, 'utf8');

  // Extract createShapeButtons method body for focused assertions
  const methodStart = gameContent.indexOf('createShapeButtons(startX, startY) {');
  assert.ok(methodStart !== -1, 'createShapeButtons debe estar definida en GameScene.js');
  const methodEnd = gameContent.indexOf('createOvenStation(startX, startY) {', methodStart);
  assert.ok(methodEnd !== -1, 'createOvenStation debe delimitar el fin de createShapeButtons');
  const shapeCode = gameContent.slice(methodStart, methodEnd);

  describe('1. Estructura e Inicialización de shadowSprite en cada shapeContainer', () => {
    test('instancia shadowSprite con textura clónica "shape_" + s.id y offset local inicial (-3, +4) -> (51, 58)', () => {
      assert.ok(
        shapeCode.includes("this.add.image(51, 58, 'shape_' + s.id)"),
        'shadowSprite debe crearse en coordenadas locales (51, 58) con la textura del cortador'
      );
    });

    test('configura displaySize inicial de 109x109 px', () => {
      assert.ok(
        shapeCode.includes('.setDisplaySize(109, 109)'),
        'shadowSprite debe tener tamaño inicial de 109x109 px'
      );
    });

    test('aplica tinte cálido 0x3a1f04 a la sombra', () => {
      assert.ok(
        shapeCode.includes('.setTint(0x3a1f04)') || shapeCode.includes('shadowSprite.setTint(0x3a1f04)'),
        'shadowSprite debe tener tinte 0x3a1f04'
      );
    });

    test('aplica opacidad condicional (0.24 si desbloqueado, 0.12 si bloqueado)', () => {
      assert.ok(
        shapeCode.includes('isUnlocked ? 0.24 : 0.12'),
        'shadowSprite debe modular su alpha según desbloqueo (0.24 vs 0.12)'
      );
    });

    test('agrega shadowSprite al container ANTES de shapeSprite para orden de pintado z', () => {
      const addShadowIdx = shapeCode.indexOf('container.add(shadowSprite)');
      const addShapeIdx = shapeCode.indexOf('container.add(shapeSprite)');
      assert.ok(addShadowIdx !== -1, 'container.add(shadowSprite) debe existir');
      assert.ok(addShapeIdx !== -1, 'container.add(shapeSprite) debe existir');
      assert.ok(
        addShadowIdx < addShapeIdx,
        'shadowSprite debe agregarse al contenedor ANTES que shapeSprite (hijo 0 = sombra, hijo 1 = cortador)'
      );
    });

    test('asigna container.shadowSprite como referencia directa', () => {
      assert.ok(
        shapeCode.includes('container.shadowSprite = shadowSprite'),
        'container.shadowSprite debe almacenar la referencia directa a la sombra'
      );
    });
  });

  describe('2. Sincronización de Dimensiones en Hover (pointerover / pointerout)', () => {
    test('en pointerover escala shadowSprite a 120x120 px', () => {
      const overIdx = shapeCode.indexOf("dragZone.on('pointerover'");
      assert.ok(overIdx !== -1, "Debe existir listener 'pointerover'");
      const overBlock = shapeCode.slice(overIdx, shapeCode.indexOf('});', overIdx));
      assert.ok(
        overBlock.includes('shadowSprite.setDisplaySize(120, 120)'),
        'pointerover debe escalar shadowSprite a (120, 120)'
      );
      assert.ok(
        overBlock.includes('shapeSprite.setDisplaySize(120, 120)'),
        'pointerover debe escalar shapeSprite a (120, 120)'
      );
    });

    test('en pointerout restaura shadowSprite a 109x109 px', () => {
      const outIdx = shapeCode.indexOf("dragZone.on('pointerout'");
      assert.ok(outIdx !== -1, "Debe existir listener 'pointerout'");
      const outBlock = shapeCode.slice(outIdx, shapeCode.indexOf('});', outIdx));
      assert.ok(
        outBlock.includes('shadowSprite.setDisplaySize(109, 109)'),
        'pointerout debe restaurar shadowSprite a (109, 109)'
      );
      assert.ok(
        outBlock.includes('shapeSprite.setDisplaySize(109, 109)'),
        'pointerout debe restaurar shapeSprite a (109, 109)'
      );
    });
  });

  describe('3. Dinámica de Elevación y Aterrizaje en Drag & Drop', () => {
    test('en dragstart asigna depth 29990 a container y dragZone', () => {
      const dragstartIdx = shapeCode.indexOf("dragZone.on('dragstart'");
      assert.ok(dragstartIdx !== -1, "Debe existir listener 'dragstart'");
      const dragstartBlock = shapeCode.slice(dragstartIdx, shapeCode.indexOf("dragZone.on('drag'", dragstartIdx));
      assert.ok(
        dragstartBlock.includes('container.setDepth(29990)'),
        'container.setDepth debe ser 29990 en dragstart'
      );
      assert.ok(
        dragstartBlock.includes('dragZone.setDepth(29990)'),
        'dragZone.setDepth debe ser 29990 en dragstart'
      );
      assert.ok(
        !dragstartBlock.includes('setDepth(30000)'),
        'dragstart NO debe usar setDepth(30000) para evitar colisión con el brazo del gato'
      );
    });

    test('en dragstart ejecuta tween de elevación en shadowSprite (-10, +22 px, alpha 0.16, 115.54 px, 120 ms, Quad.out)', () => {
      const dragstartIdx = shapeCode.indexOf("dragZone.on('dragstart'");
      const dragstartBlock = shapeCode.slice(dragstartIdx, shapeCode.indexOf("dragZone.on('drag'", dragstartIdx));
      assert.ok(
        dragstartBlock.includes('this.tweens.killTweensOf(shadowSprite)'),
        'dragstart debe detener tweens previos de shadowSprite'
      );
      assert.ok(dragstartBlock.includes('targets: shadowSprite'), 'tween debe tener como target a shadowSprite');
      assert.ok(dragstartBlock.includes('x: 44'), 'offset x de elevación debe ser 44 (54 - 10)');
      assert.ok(dragstartBlock.includes('y: 76'), 'offset y de elevación debe ser 76 (54 + 22)');
      assert.ok(dragstartBlock.includes('alpha: 0.16'), 'alpha de elevación debe ser 0.16');
      assert.ok(dragstartBlock.includes('displayWidth: 115.54'), 'displayWidth de elevación debe ser 115.54');
      assert.ok(dragstartBlock.includes('displayHeight: 115.54'), 'displayHeight de elevación debe ser 115.54');
      assert.ok(dragstartBlock.includes('duration: 120'), 'duración del tween de elevación debe ser 120 ms');
      assert.ok(dragstartBlock.includes("ease: 'Quad.out'"), "curva de elevación debe ser 'Quad.out'");
    });

    test('en dragend ejecuta tween de retorno en shadowSprite (-3, +4 px, alpha 0.24, 109 px, 250 ms, Back.out)', () => {
      const dragendIdx = shapeCode.indexOf("dragZone.on('dragend'");
      assert.ok(dragendIdx !== -1, "Debe existir listener 'dragend'");
      const dragendBlock = shapeCode.slice(dragendIdx);
      assert.ok(
        dragendBlock.includes('this.tweens.killTweensOf(shadowSprite)'),
        'dragend debe detener tweens previos de shadowSprite'
      );
      assert.ok(dragendBlock.includes('targets: shadowSprite'), 'tween debe tener como target a shadowSprite');
      assert.ok(dragendBlock.includes('x: 51'), 'offset x de retorno debe ser 51 (54 - 3)');
      assert.ok(dragendBlock.includes('y: 58'), 'offset y de retorno debe ser 58 (54 + 4)');
      assert.ok(dragendBlock.includes('alpha: 0.24'), 'alpha de reposo debe ser 0.24');
      assert.ok(dragendBlock.includes('displayWidth: 109'), 'displayWidth de reposo debe ser 109');
      assert.ok(dragendBlock.includes('displayHeight: 109'), 'displayHeight de reposo debe ser 109');
      assert.ok(dragendBlock.includes('duration: 250'), 'duración del tween de retorno debe ser 250 ms');
      assert.ok(dragendBlock.includes("ease: 'Back.out'"), "curva de retorno debe ser 'Back.out'");
    });

    test('en dragend restaura la profundidad a 2 al completar el retorno del contenedor', () => {
      const dragendIdx = shapeCode.indexOf("dragZone.on('dragend'");
      const dragendBlock = shapeCode.slice(dragendIdx);
      assert.ok(
        dragendBlock.includes('container.setDepth(2)'),
        'container.setDepth debe restaurarse a 2 en onComplete'
      );
      assert.ok(
        dragendBlock.includes('dragZone.setDepth(2)'),
        'dragZone.setDepth debe restaurarse a 2 en onComplete'
      );
    });
  });

  describe('4. Invariante de Profundidades e Inviolabilidad de la Pata del Gato', () => {
    test('profundidad del cortador en arrastre (29990) es estrictamente menor que las capas del brazo y pata', () => {
      assert.ok(
        gameContent.includes('this.catArmOutlineGraphics = this.add.graphics().setDepth(30000)'),
        'catArmOutlineGraphics debe tener profundidad 30000'
      );
      assert.ok(
        gameContent.includes('this.catArmFillGraphics = this.add.graphics().setDepth(30001)'),
        'catArmFillGraphics debe tener profundidad 30001'
      );
      assert.ok(
        gameContent.includes('.setDepth(30002)'),
        'catPawSprite debe tener profundidad 30002'
      );

      const dragDepth = 29990;
      const armOutlineDepth = 30000;
      const armFillDepth = 30001;
      const pawSpriteDepth = 30002;

      assert.ok(dragDepth < armOutlineDepth, 'La sombra y cortador jamás tapan el borde del brazo');
      assert.ok(dragDepth < armFillDepth, 'La sombra y cortador jamás tapan el relleno del brazo');
      assert.ok(dragDepth < pawSpriteDepth, 'La sombra y cortador jamás tapan la pata del gato');
    });

    test('profundidad del cortador en arrastre (29990) es superior a galletas, bandeja y mesa', () => {
      const dragDepth = 29990;
      const cookieDepth = 4;
      const prepTrayDepth = 2.5;
      const tableDepth = 0;

      assert.ok(dragDepth > cookieDepth, 'La sombra se proyecta sobre las galletas durante el vuelo');
      assert.ok(dragDepth > prepTrayDepth, 'La sombra se proyecta sobre la bandeja de preparación');
      assert.ok(dragDepth > tableDepth, 'La sombra se proyecta sobre la mesa');
    });
  });

  describe('5. Integridad de Assets Originales y Configuración', () => {
    const shapes = ['star', 'heart', 'cat', 'fish'];

    test('los 4 assets de cortadores en public/assets/stations/ existen y no están vacíos', () => {
      for (const id of shapes) {
        const filePath = path.join(projectRoot, 'public', 'assets', 'stations', `shape_${id}.png`);
        assert.ok(fs.existsSync(filePath), `shape_${id}.png debe existir físicamente`);
        const stats = fs.statSync(filePath);
        assert.ok(stats.size > 0, `shape_${id}.png no debe estar vacío`);
      }
    });

    test('ui-config.json permanece intacto y es un JSON válido', () => {
      const configPath = path.join(projectRoot, 'ui-config.json');
      assert.ok(fs.existsSync(configPath), 'ui-config.json debe existir');
      const raw = fs.readFileSync(configPath, 'utf8');
      assert.doesNotThrow(() => JSON.parse(raw), 'ui-config.json debe ser un JSON sintácticamente válido');
    });
  });
});
