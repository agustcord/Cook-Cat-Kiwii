import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

describe('Decorations Assets & Boot Preload Suite', () => {
  const windowOverlayPath = path.resolve('public/assets/decorations/decor_window_overlay.png');
  const windowThumbPath = path.resolve('public/assets/decorations/decor_window_thumb.png');
  const buntingOverlayPath = path.resolve('public/assets/decorations/decor_bunting_overlay.png');
  const buntingThumbPath = path.resolve('public/assets/decorations/decor_bunting_thumb.png');
  const bootScenePath = path.resolve('src/scenes/BootScene.js');

  test('decor_window_overlay.png exists with exact 1920x1080 dimensions and clean alpha below y=652', async () => {
    assert.ok(fs.existsSync(windowOverlayPath), 'Window overlay asset must exist');
    const metadata = await sharp(windowOverlayPath).metadata();
    assert.equal(metadata.width, 1920, 'Width must be 1920px');
    assert.equal(metadata.height, 1080, 'Height must be 1080px');
    assert.equal(metadata.channels, 4, 'Must have 4 channels (RGBA)');

    const rawData = await sharp(windowOverlayPath).raw().toBuffer();
    const width = metadata.width;
    const height = metadata.height;
    for (let y = 653; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = rawData[(y * width + x) * 4 + 3];
        assert.equal(alpha, 0, 'Pixel below retouched windowsill (y > 652) must have alpha 0');
      }
    }
  });

  test('decor_window_thumb.png exists with exact 409x369 dimensions and valid content', async () => {
    assert.ok(fs.existsSync(windowThumbPath), 'Window thumb asset must exist');
    const metadata = await sharp(windowThumbPath).metadata();
    assert.equal(metadata.width, 409, 'Thumb width must be 409px');
    assert.equal(metadata.height, 369, 'Thumb height must be 369px');
    assert.equal(metadata.channels, 4, 'Must have 4 channels (RGBA)');

    const rawData = await sharp(windowThumbPath).raw().toBuffer();
    let minY = metadata.height;
    let maxY = -1;
    for (let y = 0; y < metadata.height; y++) {
      for (let x = 0; x < metadata.width; x++) {
        const alpha = rawData[(y * metadata.width + x) * 4 + 3];
        if (alpha > 0) {
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    assert.ok(maxY >= minY, 'Thumb must contain non-transparent content');
    const usefulHeight = maxY - minY + 1;
    assert.ok(usefulHeight > 300, 'Useful height must be substantial');

    // Corners should be transparent
    const corners = [[0, 0], [408, 0], [0, 368], [408, 368]];
    corners.forEach(([cx, cy]) => {
      const alpha = rawData[(cy * metadata.width + cx) * 4 + 3];
      assert.equal(alpha, 0, 'Corner must be transparent');
    });
  });

  test('decor_bunting_overlay.png exists with exact 1920x1080 dimensions and clean alpha below y=336', async () => {
    assert.ok(fs.existsSync(buntingOverlayPath), 'Bunting overlay asset must exist');
    const metadata = await sharp(buntingOverlayPath).metadata();
    assert.equal(metadata.width, 1920, 'Width must be 1920px');
    assert.equal(metadata.height, 1080, 'Height must be 1080px');
    assert.equal(metadata.channels, 4, 'Must have 4 channels (RGBA)');

    const rawData = await sharp(buntingOverlayPath).raw().toBuffer();
    const width = metadata.width;
    const height = metadata.height;
    for (let y = 337; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = rawData[(y * width + x) * 4 + 3];
        assert.equal(alpha, 0, 'Pixel below bunting overlay (y > 336) must have alpha 0');
      }
    }
  });

  test('decor_bunting_thumb.png exists with exact 296x282 dimensions and valid content', async () => {
    assert.ok(fs.existsSync(buntingThumbPath), 'Bunting thumb asset must exist');
    const metadata = await sharp(buntingThumbPath).metadata();
    assert.equal(metadata.width, 296, 'Thumb width must be 296px');
    assert.equal(metadata.height, 282, 'Thumb height must be 282px');
    assert.equal(metadata.channels, 4, 'Must have 4 channels (RGBA)');

    const rawData = await sharp(buntingThumbPath).raw().toBuffer();
    let minY = metadata.height;
    let maxY = -1;
    for (let y = 0; y < metadata.height; y++) {
      for (let x = 0; x < metadata.width; x++) {
        const alpha = rawData[(y * metadata.width + x) * 4 + 3];
        if (alpha > 0) {
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    assert.ok(maxY >= minY, 'Thumb must contain non-transparent content');
  });

  test('BootScene.js preloads decor_window, decor_window_thumb, decor_bunting, and decor_bunting_thumb', () => {
    const content = fs.readFileSync(bootScenePath, 'utf8');
    assert.ok(content.includes('decor_window'), 'BootScene must preload decor_window');
    assert.ok(content.includes('decor_window_thumb'), 'BootScene must preload decor_window_thumb');
    assert.ok(content.includes('decor_bunting'), 'BootScene must preload decor_bunting');
    assert.ok(content.includes('decor_bunting_thumb'), 'BootScene must preload decor_bunting_thumb');
    assert.ok(content.includes('assets/decorations/decor_window_overlay.png'), 'decor_window path must match');
    assert.ok(content.includes('assets/decorations/decor_window_thumb.png'), 'decor_window_thumb path must match');
    assert.ok(content.includes('assets/decorations/decor_bunting_overlay.png'), 'decor_bunting path must match');
    assert.ok(content.includes('assets/decorations/decor_bunting_thumb.png'), 'decor_bunting_thumb path must match');
  });
});
