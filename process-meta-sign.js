
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const INPUT_FILE = path.join(__dirname, 'public', 'assets', 'ui_temp_jpg', 'Cute_cookie_sign_says_Meta_202607062349.jpeg');
const OUTPUT_FILE = path.join(__dirname, 'public', 'assets', 'ui', 'meta_sign_empty.png');

async function processMetaSign() {
  console.log('Processing meta sign image...');

  // Step 1: Remove white background and make transparent
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

    const y = Math.floor(i / info.width);
    const x = i % info.width;

    // Check if pixel is white (background)
    const isWhite = r >= 250 && g >= 250 && b >= 250;

    // Check if pixel is in text area (approximate position of "Meta: 100")
    // Text is roughly from y=220 to y=380, and middle x area
    const inTextArea = y >= 220 && y <= 380 && x >= 150 && x <= 550;

    if (isWhite) {
      // White background -> transparent
      newData[i * 4] = 0;
      newData[i * 4 + 1] = 0;
      newData[i * 4 + 2] = 0;
      newData[i * 4 + 3] = 0;
    } else if (inTextArea && r < 150 && g < 100 && b < 80) {
      // Dark text pixel -> replace with sign background color (cream)
      newData[i * 4] = 250;
      newData[i * 4 + 1] = 242;
      newData[i * 4 + 2] = 229;
      newData[i * 4 + 3] = 255;
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

  console.log('✅ Meta sign processed and saved!');
}

processMetaSign().catch(err => {
  console.error('❌ Error processing image:', err);
  process.exit(1);
});
