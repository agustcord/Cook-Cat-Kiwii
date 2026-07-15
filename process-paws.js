import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, 'public', 'assets', 'ui_temp_jpg');
const OUTPUT_DIR = path.join(__dirname, 'public', 'assets');

// Helper to process a single paw image
async function processPaw(inputPath, outputName) {
  const outputPath = path.join(OUTPUT_DIR, outputName);

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Archivo de origen no encontrado: ${inputPath}`);
    return false;
  }

  console.log(`Processing ${path.basename(inputPath)}...`);

  // 1. Resize to 256x256 first (with white background)
  const { data, info } = await sharp(inputPath)
    .resize(256, 256, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255 }
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const pixelCount = width * height;
  const tempBuf = Buffer.alloc(pixelCount * 4);

  // 2. Convert white background to transparency
  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];

    const isWhite = r >= 245 && g >= 245 && b >= 245;

    if (isWhite) {
      tempBuf[i * 4] = 0;
      tempBuf[i * 4 + 1] = 0;
      tempBuf[i * 4 + 2] = 0;
      tempBuf[i * 4 + 3] = 0; // Transparent
    } else {
      tempBuf[i * 4] = r;
      tempBuf[i * 4 + 1] = g;
      tempBuf[i * 4 + 2] = b;
      tempBuf[i * 4 + 3] = 255; // Opaque
    }
  }

  // 3. Automagic Arm Extension (copy row down from the first stable arm row)
  let extRowY = -1;
  const minArmWidth = Math.floor(width * 0.15); // 38px
  
  for (let y = 0; y < height; y++) {
    let firstOpaqueX = -1;
    let lastOpaqueX = -1;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (tempBuf[idx + 3] > 0) {
        if (firstOpaqueX === -1) firstOpaqueX = x;
        lastOpaqueX = x;
      }
    }
    const rowWidth = (firstOpaqueX !== -1) ? (lastOpaqueX - firstOpaqueX + 1) : 0;
    
    if (rowWidth >= minArmWidth) {
      extRowY = y;
      break;
    }
  }

  if (extRowY > 0) {
    console.log(`  🔧 Extendiéndo el antebrazo verticalmente desde la fila y=${extRowY}...`);
    for (let y = 0; y < extRowY; y++) {
      for (let x = 0; x < width; x++) {
        const targetIdx = (y * width + x) * 4;
        const sourceIdx = (extRowY * width + x) * 4;
        tempBuf[targetIdx] = tempBuf[sourceIdx];
        tempBuf[targetIdx + 1] = tempBuf[sourceIdx + 1];
        tempBuf[targetIdx + 2] = tempBuf[sourceIdx + 2];
        tempBuf[targetIdx + 3] = tempBuf[sourceIdx + 3];
      }
    }
  }

  // 4. Taper and Normalize Wrist Width to exactly 112 pixels at the top edge (y=0)
  // This ensures both open and closed paws have identical wrist width and align perfectly with the arm!
  const targetWristWidth = 112;
  const targetLeft = Math.floor((width - targetWristWidth) / 2); // 72
  const targetRight = targetLeft + targetWristWidth - 1; // 183
  const transitionY = Math.floor(height * 0.55); // Transition arm tapering down to 55% of height

  const finalBuf = Buffer.alloc(pixelCount * 4);

  for (let y = 0; y < height; y++) {
    let leftSrc = -1;
    let rightSrc = -1;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (tempBuf[idx + 3] > 0) {
        if (leftSrc === -1) leftSrc = x;
        rightSrc = x;
      }
    }

    const rowWidth = (leftSrc !== -1) ? (rightSrc - leftSrc + 1) : 0;

    if (y < transitionY && rowWidth > 0) {
      const ratio = y / transitionY;
      const leftDst = Math.round(targetLeft + (leftSrc - targetLeft) * ratio);
      const rightDst = Math.round(targetRight + (rightSrc - targetRight) * ratio);
      const newWidth = rightDst - leftDst + 1;

      for (let x = 0; x < width; x++) {
        const destIdx = (y * width + x) * 4;
        if (x < leftDst || x > rightDst || newWidth <= 1) {
          finalBuf[destIdx] = 0;
          finalBuf[destIdx + 1] = 0;
          finalBuf[destIdx + 2] = 0;
          finalBuf[destIdx + 3] = 0;
        } else {
          const srcX = Math.round(leftSrc + ((x - leftDst) / (newWidth - 1)) * (rightSrc - leftSrc));
          const srcIdx = (y * width + Math.max(0, Math.min(width - 1, srcX))) * 4;
          finalBuf[destIdx] = tempBuf[srcIdx];
          finalBuf[destIdx + 1] = tempBuf[srcIdx + 1];
          finalBuf[destIdx + 2] = tempBuf[srcIdx + 2];
          finalBuf[destIdx + 3] = tempBuf[srcIdx + 3];
        }
      }
    } else {
      // Copy row as is
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        finalBuf[idx] = tempBuf[idx];
        finalBuf[idx + 1] = tempBuf[idx + 1];
        finalBuf[idx + 2] = tempBuf[idx + 2];
        finalBuf[idx + 3] = tempBuf[idx + 3];
      }
    }
  }

  // Save the normalized image
  await sharp(finalBuf, {
    raw: {
      width: width,
      height: height,
      channels: 4
    }
  })
  .png()
  .toFile(outputPath);

  console.log(`   ✅ Procesado y Normalizado guardado en: ${outputPath}`);
  return true;
}

async function run() {
  const filesToTry = [
    { input: 'cat_paw_open.jpg', output: 'cat_paw_open.png' },
    { input: 'cat_paw_open.jpeg', output: 'cat_paw_open.png' },
    { input: 'cat_paw_closed.jpg', output: 'cat_paw_closed.png' },
    { input: 'cat_paw_closed.jpeg', output: 'cat_paw_closed.png' }
  ];

  let processedCount = 0;
  for (const pair of filesToTry) {
    let inputPath = path.join(TEMP_DIR, pair.input);
    if (!fs.existsSync(inputPath)) {
      inputPath = path.join(__dirname, 'public', pair.input);
    }

    if (fs.existsSync(inputPath)) {
      const success = await processPaw(inputPath, pair.output);
      if (success) processedCount++;
    }
  }

  if (processedCount === 0) {
    console.log('⚠️ No se encontraron archivos nuevos para procesar.');
  }
}

run().catch(err => {
  console.error('Error running script:', err);
});
