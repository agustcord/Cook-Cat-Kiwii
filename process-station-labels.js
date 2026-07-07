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

    const isWhite = r >= 240 && g >= 240 && b >= 240;
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
  .trim()
  .png()
  .toFile(outputFile);
}

async function main() {
  console.log('Processing station labels...');
  
  const masaInput = path.join(INPUT_DIR, "Bakery_label_says_Masa_202607070106.jpeg");
  const masaOutput = path.join(OUTPUT_DIR, "masa_label.png");
  
  const formaInput = path.join(INPUT_DIR, "Bakery_label__2._Forma__202607070107.jpeg");
  const formaOutput = path.join(OUTPUT_DIR, "forma_label.png");
  
  const toppingInput = path.join(INPUT_DIR, "Bakery_label_says_Topping_202607070106.jpeg");
  const toppingOutput = path.join(OUTPUT_DIR, "topping_label.png");
  
  await processImage(masaInput, masaOutput);
  console.log('✅ Masa label processed');
  
  await processImage(formaInput, formaOutput);
  console.log('✅ Forma label processed');
  
  await processImage(toppingInput, toppingOutput);
  console.log('✅ Topping label processed');
  
  console.log('✅ All station labels processed!');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
