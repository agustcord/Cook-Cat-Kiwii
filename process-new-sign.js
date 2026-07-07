import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const INPUT_FILE = path.join(__dirname, 'public', 'assets', 'ui_temp_jpg', 'Cute_cookie_sign_says_Meta_202607070002.jpeg');
const OUTPUT_FILE = path.join(__dirname, 'public', 'assets', 'ui', 'meta_sign_empty.png');

async function processNewSign() {
  console.log('Processing NEW sign image...');

  // Remove white background and make transparent
  const { data, info } = await sharp(INPUT_FILE)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .toColorspace('srgb')
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  console.log(`Image size: ${info.width}x${info.height}`);

  // Process pixels
  const pixelCount = info.width * info.height;
  const newData = Buffer.alloc(pixelCount * 4);

  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const a = data[i * 4 + 3];

    // Check if pixel is white (background)
    const isWhite = r >= 250 && g >= 250 && b >= 250;

    if (isWhite) {
      // White background -> transparent
      newData[i * 4] = 0;
      newData[i * 4 + 1] = 0;
      newData[i * 4 + 2] = 0;
      newData[i * 4 + 3] = 0;
    } else {
      // Keep original pixel
      newData[i * 4] = r;
      newData[i * 4 + 1] = g;
      newData[i * 4 + 2] = b;
      newData[i * 4 + 3] = 255;
    }
  }

  // Save the processed image
  await sharp(newData, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
  .png()
  .toFile(OUTPUT_FILE);

  console.log('✅ NEW sign processed and saved!');
}

processNewSign().catch(err => {
  console.error('❌ Error processing image:', err);
  process.exit(1);
});
