import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_DIR = path.join(__dirname, 'public', 'assets', 'ui_temp_jpg');
const OUTPUT_DIR = path.join(__dirname, 'public', 'assets', 'ui');

async function processImage(inputFile, outputFile) {
  // Remove white background and make transparent
  const { data, info } = await sharp(inputFile)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .toColorspace('srgb')
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixelCount = info.width * info.height;
  const newData = Buffer.alloc(pixelCount * 4);

  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const a = data[i * 4 + 3];

    const isWhite = r >= 250 && g >= 250 && b >= 250;
    if (isWhite) {
      newData[i * 4] = 0;
      newData[i * 4 + 1] = 0;
      newData[i * 4 + 2] = 0;
      newData[i * 4 + 3] = 0;
    } else {
      newData[i * 4] = r;
      newData[i * 4 + 1] = g;
      newData[i * 4 + 2] = b;
      newData[i * 4 + 3] = 255;
    }
  }

  await sharp(newData, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
  .png()
  .toFile(outputFile);
}

async function main() {
  console.log('Processing day and coins signs...');
  
  const dayInput = path.join(INPUT_DIR, "Cute_decorative_sign_'DÍA_1'_202607070030.jpeg");
  const dayOutput = path.join(OUTPUT_DIR, "day_sign_empty.png");
  
  const coinsInput = path.join(INPUT_DIR, "Sign_with_coin_icon_202607070030.jpeg");
  const coinsOutput = path.join(OUTPUT_DIR, "coins_sign_empty.png");
  
  await processImage(dayInput, dayOutput);
  console.log('✅ Day sign processed');
  
  await processImage(coinsInput, coinsOutput);
  console.log('✅ Coins sign processed');
  
  console.log('✅ All signs processed!');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
