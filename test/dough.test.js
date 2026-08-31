import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Dough Assets & GameScene Integration (Masa Grande vs Bolitas de Masa)', () => {
  const projectRoot = process.cwd();
  const publicAssetsDir = path.join(projectRoot, 'public', 'assets');
  const stationsAssetsDir = path.join(publicAssetsDir, 'stations');
  const bootScenePath = path.join(projectRoot, 'src', 'scenes', 'BootScene.js');
  const gameScenePath = path.join(projectRoot, 'src', 'scenes', 'GameScene.js');

  const expectedLargeDoughs = [
    { filename: 'masa_vainilla.png', width: 168, height: 116, centerX: 148, centerY: 684, id: 'classic' },
    { filename: 'masa_chocolate.png', width: 168, height: 109, centerX: 142, centerY: 829.5, id: 'chocolate' },
    { filename: 'masa_avena.png', width: 177, height: 115, centerX: 135.5, centerY: 958.5, id: 'oat' }
  ];

  const expectedSmallDoughBalls = [
    'dough_classic.png',
    'dough_chocolate.png',
    'dough_oat.png'
  ];

  test('Los 3 archivos de masa grande existen en public/assets/ y no están vacíos', () => {
    expectedLargeDoughs.forEach(({ filename }) => {
      const assetPath = path.join(publicAssetsDir, filename);
      assert.ok(fs.existsSync(assetPath), `${filename} debe existir en public/assets/`);
      const stats = fs.statSync(assetPath);
      assert.ok(stats.size > 0, `${filename} no debe estar vacío`);
    });
  });

  test('Los 3 archivos de bolitas de masa existen en public/assets/stations/', () => {
    expectedSmallDoughBalls.forEach((filename) => {
      const assetPath = path.join(stationsAssetsDir, filename);
      assert.ok(fs.existsSync(assetPath), `${filename} debe existir en public/assets/stations/`);
      const stats = fs.statSync(assetPath);
      assert.ok(stats.size > 0, `${filename} no debe estar vacío`);
    });
  });

  test('Los assets de masa grande tienen dimensiones nativas exactas (escala 1:1)', () => {
    expectedLargeDoughs.forEach(({ filename, width: expW, height: expH }) => {
      const assetPath = path.join(publicAssetsDir, filename);
      const buf = fs.readFileSync(assetPath);
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      assert.equal(width, expW, `${filename} ancho debe ser ${expW}`);
      assert.equal(height, expH, `${filename} alto debe ser ${expH}`);
    });
  });

  test('BootScene precarga los 3 assets de masa grande ilustrada (masa_vainilla, masa_chocolate, masa_avena)', () => {
    const bootContent = fs.readFileSync(bootScenePath, 'utf8');
    assert.ok(
      bootContent.includes("this.load.image('masa_vainilla', assetUrl('assets/masa_vainilla.png'))"),
      'BootScene debe precargar masa_vainilla.png'
    );
    assert.ok(
      bootContent.includes("this.load.image('masa_chocolate', assetUrl('assets/masa_chocolate.png'))"),
      'BootScene debe precargar masa_chocolate.png'
    );
    assert.ok(
      bootContent.includes("this.load.image('masa_avena', assetUrl('assets/masa_avena.png'))"),
      'BootScene debe precargar masa_avena.png'
    );
  });

  test('BootScene precarga los 3 assets de bolitas de masa originales desde assets/stations/', () => {
    const bootContent = fs.readFileSync(bootScenePath, 'utf8');
    assert.ok(
      bootContent.includes("this.load.image('dough_classic', assetUrl('assets/stations/dough_classic.png'))"),
      'BootScene debe precargar dough_classic.png desde assets/stations/'
    );
    assert.ok(
      bootContent.includes("this.load.image('dough_chocolate', assetUrl('assets/stations/dough_chocolate.png'))"),
      'BootScene debe precargar dough_chocolate.png desde assets/stations/'
    );
    assert.ok(
      bootContent.includes("this.load.image('dough_oat', assetUrl('assets/stations/dough_oat.png'))"),
      'BootScene debe precargar dough_oat.png desde assets/stations/'
    );
  });

  test('GameScene utiliza las coordenadas exactas de Krita (1920x1080) y claves masa_* para las masas principales', () => {
    const gameContent = fs.readFileSync(gameScenePath, 'utf8');
    
    const funcDeclaration = '  createDoughButtons(';
    const funcIndex = gameContent.indexOf(funcDeclaration);
    assert.ok(funcIndex !== -1, 'createDoughButtons debe estar definida en GameScene');
    
    // Check coordinates in createDoughButtons
    assert.ok(gameContent.includes('148') && gameContent.includes('684'), 'Masa vainilla/clásica debe ubicarse en X=148, Y=684');
    assert.ok(gameContent.includes('142') && gameContent.includes('829.5'), 'Masa chocolate debe ubicarse en X=142, Y=829.5');
    assert.ok(gameContent.includes('135.5') && gameContent.includes('958.5'), 'Masa avena debe ubicarse en X=135.5, Y=958.5');

    // Check texture keys in createDoughButtons
    assert.ok(gameContent.includes("key: 'masa_vainilla'"), "Dispensador clásico debe usar key: 'masa_vainilla'");
    assert.ok(gameContent.includes("key: 'masa_chocolate'"), "Dispensador chocolate debe usar key: 'masa_chocolate'");
    assert.ok(gameContent.includes("key: 'masa_avena'"), "Dispensador avena debe usar key: 'masa_avena'");
  });

  test('GameScene utiliza bolitas de masa (dough_*) para arrastrar y visualizar en la bandeja de preparación', () => {
    const gameContent = fs.readFileSync(gameScenePath, 'utf8');
    assert.ok(
      gameContent.includes("portionSprite = this.add.image(dragZone.x, dragZone.y, `dough_${b.id}`);") ||
      gameContent.includes("portionSprite = this.add.image(dragZone.x, dragZone.y, 'dough_' + b.id);"),
      'El sprite arrastrado debe usar la clave de bolita de masa dough_*'
    );
    assert.ok(
      gameContent.includes("key = `dough_${cookie.base}`;") ||
      gameContent.includes("key = 'dough_' + cookie.base;"),
      'La bandeja de preparación debe usar la clave de bolita de masa dough_* para masa sin forma'
    );
  });

  test('GameScene preserva la mecánica de drag, stock y feedback visual de masa', () => {
    const gameContent = fs.readFileSync(gameScenePath, 'utf8');
    const funcIndex = gameContent.indexOf('  createDoughButtons(');
    const nextFuncIndex = gameContent.indexOf('  createShapeButtons(', funcIndex);
    const createDoughBlock = gameContent.slice(funcIndex, nextFuncIndex !== -1 ? nextFuncIndex : funcIndex + 2500);

    assert.ok(createDoughBlock.includes("this.stock.dough[b.id]--"), 'Debe descontar stock al colocar masa');
    assert.ok(createDoughBlock.includes("this.updateStockTexts()"), 'Debe actualizar textos de stock');
    assert.ok(createDoughBlock.includes("new Cookie()"), 'Debe crear nueva Cookie');
    assert.ok(createDoughBlock.includes("this.prepTrayCookies.push(newCookie)"), 'Debe agregar galleta a la bandeja');
    assert.ok(createDoughBlock.includes("this.updateCookieVisuals()"), 'Debe refrescar visuales de bandeja');
  });
});
