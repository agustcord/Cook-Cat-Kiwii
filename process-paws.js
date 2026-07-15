import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, 'public', 'assets', 'ui_temp_jpg');
const OUTPUT_DIR = path.join(__dirname, 'public', 'assets');

// Helper to process a single paw image
async function processPaw(filename, outputName) {
  const inputPath = path.join(TEMP_DIR, filename);
  const outputPath = path.join(OUTPUT_DIR, outputName);

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Archivo de origen no encontrado: ${inputPath}`);
    return false;
  }

  console.log(`Processing ${filename}...`);

  // Remove white background and make transparent
  const { data, info } = await sharp(inputPath)
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

    // Check if pixel is white (background)
    const isWhite = r >= 245 && g >= 245 && b >= 245;

    if (isWhite) {
      newData[i * 4] = 0;
      newData[i * 4 + 1] = 0;
      newData[i * 4 + 2] = 0;
      newData[i * 4 + 3] = 0; // Transparent
    } else {
      newData[i * 4] = r;
      newData[i * 4 + 1] = g;
      newData[i * 4 + 2] = b;
      newData[i * 4 + 3] = 255; // Opaque
    }
  }

  // Create sharp image and resize/trim to standard 128x128 or 256x256 (let's keep 256x256 as target)
  await sharp(newData, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
  .resize(256, 256, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
  .png()
  .toFile(outputPath);

  console.log(`✅ Procesado con éxito y guardado en: ${outputPath}`);
  return true;
}

async function run() {
  // Try to process both potential extensions (.jpg, .jpeg, .png)
  const filesToTry = [
    { input: 'cat_paw_open.jpg', output: 'cat_paw_open.png' },
    { input: 'cat_paw_open.jpeg', output: 'cat_paw_open.png' },
    { input: 'cat_paw_closed.jpg', output: 'cat_paw_closed.png' },
    { input: 'cat_paw_closed.jpeg', output: 'cat_paw_closed.png' }
  ];

  let processedCount = 0;
  for (const pair of filesToTry) {
    const inputExists = fs.existsSync(path.join(TEMP_DIR, pair.input));
    if (inputExists) {
      const success = await processPaw(pair.input, pair.output);
      if (success) processedCount++;
    }
  }

  if (processedCount === 0) {
    console.log('⚠️ No se encontraron archivos nuevos para procesar. Por favor coloca cat_paw_open.jpg y cat_paw_closed.jpg en public/assets/ui_temp_jpg/');
  }
}

run().catch(err => {
  console.error('Error running script:', err);
});
