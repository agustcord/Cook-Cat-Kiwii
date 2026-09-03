import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('TrashBin Asset & Configuration Integration', () => {
  const projectRoot = process.cwd();
  const assetPath = path.join(projectRoot, 'public', 'assets', 'basurero.png');
  const bootScenePath = path.join(projectRoot, 'src', 'scenes', 'BootScene.js');
  const gameScenePath = path.join(projectRoot, 'src', 'scenes', 'GameScene.js');

  test('El asset basurero.png existe físicamente en public/assets/', () => {
    assert.ok(fs.existsSync(assetPath), 'public/assets/basurero.png debe existir');
    const stats = fs.statSync(assetPath);
    assert.ok(stats.size > 0, 'El archivo basurero.png no debe estar vacío');
  });

  test('El asset basurero.png tiene dimensiones nativas 234x164 (escala 1:1)', () => {
    const buf = fs.readFileSync(assetPath);
    // PNG format specification: width at offset 16 (4 bytes BE), height at offset 20 (4 bytes BE)
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    assert.equal(width, 234, 'El ancho debe ser 234');
    assert.equal(height, 164, 'El alto debe ser 164');
  });

  test('BootScene precarga el asset basurero con clave "basurero"', () => {
    const bootContent = fs.readFileSync(bootScenePath, 'utf8');
    assert.ok(
      bootContent.includes("this.load.image('basurero', assetUrl('assets/basurero.png'))"),
      'BootScene debe precargar basurero.png con la clave basurero'
    );
  });

  test('GameScene utiliza la imagen "basurero" a escala 1:1 sin distorsión en createTrashBin', () => {
    const gameContent = fs.readFileSync(gameScenePath, 'utf8');
    assert.ok(
      gameContent.includes("this.trashBinSprite = this.add.image(0, 0, 'basurero')"),
      'GameScene debe instanciar la imagen basurero en createTrashBin'
    );
    // No debe usar setDisplaySize forzando distorsión en la creación
    const funcDeclaration = '  createTrashBin() {';
    const funcIndex = gameContent.indexOf(funcDeclaration);
    assert.ok(funcIndex !== -1, 'createTrashBin debe estar definida en GameScene');
    const createTrashBinBlock = gameContent.slice(
      funcIndex,
      gameContent.indexOf('openAudioPanel()', funcIndex)
    );
    assert.ok(
      !createTrashBinBlock.includes('setDisplaySize'),
      'createTrashBin debe mantener escala 1:1 nativa sin setDisplaySize'
    );
  });

  test('GameScene eliminó el texto/label "BASURA" y el icono procedural duplicado', () => {
    const gameContent = fs.readFileSync(gameScenePath, 'utf8');
    assert.ok(
      !gameContent.includes('this.trashLabel = this.add.text'),
      'No debe existir this.trashLabel redundante'
    );
    assert.ok(
      !gameContent.includes("this.add.text(0, 73, 'BASURA'"),
      'No debe existir texto BASURA añadido manualmente sobre el contenedor'
    );
    assert.ok(
      !gameContent.includes('this.trashIconText'),
      'No debe quedar rastro de this.trashIconText'
    );
    assert.ok(
      !gameContent.includes('this.trashBinGraphics'),
      'No debe quedar rastro de this.trashBinGraphics procedural'
    );
  });

  test('La zona y distancia de detección del basurero (calibrada a 95px) se preservan para el descarte', () => {
    const gameContent = fs.readFileSync(gameScenePath, 'utf8');
    assert.ok(
      gameContent.includes('const distToTrash = Phaser.Math.Distance.Between(dragX, Math.max(338, dragY), this.trashBinX, this.trashBinY);'),
      'El cálculo de distancia en hover sobre el basurero debe mantenerse'
    );
    assert.ok(
      gameContent.includes('const distTrash = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.trashBinX, this.trashBinY);'),
      'El cálculo de distancia en drop sobre el basurero debe mantenerse'
    );
    assert.ok(
      gameContent.includes('if (distTrash < 95)'),
      'El umbral de descarte calibrado a 95px debe mantenerse'
    );
  });
});
