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

  const width = info.width;
  const height = info.height;
  const pixelCount = width * height;
  const newData = Buffer.alloc(pixelCount * 4);

  // 1. Convert white background to transparency
  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];

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

  // 2. Automagic Arm Extension: if the top is rounded, extend the arm straight up to the edge
  let extRowY = -1;
  const minArmWidth = Math.floor(width * 0.15); // Require at least 15% width of image to be the arm
  
  for (let y = 0; y < height; y++) {
    let firstOpaqueX = -1;
    let lastOpaqueX = -1;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (newData[idx + 3] > 0) {
        if (firstOpaqueX === -1) firstOpaqueX = x;
        lastOpaqueX = x;
      }
    }
    const rowWidth = (firstOpaqueX !== -1) ? (lastOpaqueX - firstOpaqueX + 1) : 0;
    
    // We scan down from the top. The first row that has a stable arm width (e.g. at least 15% width)
    if (rowWidth >= minArmWidth) {
      extRowY = y;
      break;
    }
  }

  // If we found a stable row, copy it straight up to the top of the canvas
  if (extRowY > 0) {
    console.log(`🔧 Extendiéndo el antebrazo verticalmente desde la fila y=${extRowY} hasta la parte superior (y=0)...`);
    for (let y = 0; y < extRowY; y++) {
      for (let x = 0; x < width; x++) {
        const targetIdx = (y * width + x) * 4;
        const sourceIdx = (extRowY * width + x) * 4;
        newData[targetIdx] = newData[sourceIdx];
        newData[targetIdx + 1] = newData[sourceIdx + 1];
        newData[targetIdx + 2] = newData[sourceIdx + 2];
        newData[targetIdx + 3] = newData[sourceIdx + 3];
      }
    }
  }

  // Create sharp image and resize/trim to standard 256x256
  await sharp(newData, {
    raw: {
      width: width,
      height: height,
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
