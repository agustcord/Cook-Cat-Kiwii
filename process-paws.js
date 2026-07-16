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

  const width = 256;
  const height = 256;

  // 1. Cargar la imagen: si es un archivo .png nuevo, no aplicamos corte de cuadrante ni volteo vertical.
  const isNewPng = inputPath.endsWith('.png');
  let sharpInstance = sharp(inputPath);

  if (isNewPng) {
    sharpInstance = sharpInstance.resize(width, height, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255 }
    });
  } else {
    // Legado: recorte de Q1 (430x430), volteo vertical y redimensionamiento
    sharpInstance = sharpInstance
      .extract({ left: 40, top: 40, width: 430, height: 430 })
      .flip()
      .resize(width, height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255 }
      });
  }

  const flippedBuf = await sharpInstance
    .ensureAlpha()
    .raw()
    .toBuffer();

  // 2. Remove white background in temp buffer
  const tempBuf = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const r = flippedBuf[i * 4];
    const g = flippedBuf[i * 4 + 1];
    const b = flippedBuf[i * 4 + 2];
    const isWhite = r >= 240 && g >= 240 && b >= 240;

    if (isWhite) {
      tempBuf[i * 4 + 3] = 0;
    } else {
      tempBuf[i * 4] = r;
      tempBuf[i * 4 + 1] = g;
      tempBuf[i * 4 + 2] = b;
      tempBuf[i * 4 + 3] = 255;
    }
  }

  // 3. Find tilt angle dynamically
  let sumX_top = 0, count_top = 0;
  for (let y = 10; y < 40; y++) {
    for (let x = 0; x < width; x++) {
      if (tempBuf[(y * width + x) * 4 + 3] > 0) {
        sumX_top += x;
        count_top++;
      }
    }
  }
  const x_top = sumX_top / count_top;

  let lastOpaqueY = -1;
  for (let y = height - 1; y >= 0; y--) {
    let rowHasOpaque = false;
    for (let x = 0; x < width; x++) {
      if (tempBuf[(y * width + x) * 4 + 3] > 0) {
        rowHasOpaque = true;
        break;
      }
    }
    if (rowHasOpaque) {
      lastOpaqueY = y;
      break;
    }
  }

  let sumX_bot = 0, count_bot = 0;
  const botStart = Math.max(0, lastOpaqueY - 40);
  const botEnd = lastOpaqueY;
  for (let y = botStart; y < botEnd; y++) {
    for (let x = 0; x < width; x++) {
      if (tempBuf[(y * width + x) * 4 + 3] > 0) {
        sumX_bot += x;
        count_bot++;
      }
    }
  }
  const x_bot = sumX_bot / count_bot;

  const dx = x_bot - x_top;
  const dy = (botStart + botEnd)/2 - 25;
  const angleRad = Math.atan2(dx, dy);
  const angleDeg = angleRad * 180 / Math.PI;

  console.log(`  📐 Ángulo de inclinación detectado: ${angleDeg.toFixed(2)} grados. Rotando...`);

  // 4. Rotate image to make it perfectly vertical, and resize back to 256x256
  const rotatedRaw = await sharp(tempBuf, {
    raw: {
      width: width,
      height: height,
      channels: 4
    }
  })
  .rotate(angleDeg, { background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .resize(width, height, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .raw()
  .toBuffer();

  // 5. Centering: find the new wrist center of mass and shift horizontally to exactly x=128
  let rotatedX_top = 0, r_count_top = 0;
  for (let y = 10; y < 40; y++) {
    for (let x = 0; x < width; x++) {
      if (rotatedRaw[(y * width + x) * 4 + 3] > 0) {
        rotatedX_top += x;
        r_count_top++;
      }
    }
  }
  const currentWristX = rotatedX_top / r_count_top;
  const shiftX = Math.round(width / 2 - currentWristX);

  const centeredBuf = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcX = x - shiftX;
      const destIdx = (y * width + x) * 4;
      if (srcX >= 0 && srcX < width) {
        const srcIdx = (y * width + srcX) * 4;
        centeredBuf[destIdx] = rotatedRaw[srcIdx];
        centeredBuf[destIdx + 1] = rotatedRaw[srcIdx + 1];
        centeredBuf[destIdx + 2] = rotatedRaw[srcIdx + 2];
        centeredBuf[destIdx + 3] = rotatedRaw[srcIdx + 3];
      }
    }
  }

  // 6. Taper and Normalize Wrist Width to exactly 100 pixels at the top edge (y=0)
  const targetWristWidth = 100;
  const targetLeft = Math.floor((width - targetWristWidth) / 2); // 78
  const targetRight = targetLeft + targetWristWidth - 1; // 183
  const transitionY = Math.floor(height * 0.55); // Transition tapering down to 55% of height

  const pixelCount = width * height;
  const finalBuf = Buffer.alloc(pixelCount * 4);

  for (let y = 0; y < height; y++) {
    let leftSrc = -1;
    let rightSrc = -1;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (centeredBuf[idx + 3] > 0) {
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
          finalBuf[destIdx] = centeredBuf[srcIdx];
          finalBuf[destIdx + 1] = centeredBuf[srcIdx + 1];
          finalBuf[destIdx + 2] = centeredBuf[srcIdx + 2];
          finalBuf[destIdx + 3] = centeredBuf[srcIdx + 3];
        }
      }
    } else {
      // Copy row as is
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        finalBuf[idx] = centeredBuf[idx];
        finalBuf[idx + 1] = centeredBuf[idx + 1];
        finalBuf[idx + 2] = centeredBuf[idx + 2];
        finalBuf[idx + 3] = centeredBuf[idx + 3];
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
    { input: 'cat_paw_open.png', output: 'cat_paw_open.png' },
    { input: 'cat_paw_closed.jpg', output: 'cat_paw_closed.png' },
    { input: 'cat_paw_closed.jpeg', output: 'cat_paw_closed.png' },
    { input: 'cat_paw_closed.png', output: 'cat_paw_closed.png' }
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
