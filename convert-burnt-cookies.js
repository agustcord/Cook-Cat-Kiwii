
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const INPUT_DIR = path.join(__dirname, 'public', 'assets', 'cookies_jpg_temp');
const OUTPUT_DIR = path.join(__dirname, 'public', 'assets', 'cookies');
const REFERENCE_COOKIE = path.join(__dirname, 'public', 'assets', 'cookies', 'cookie_star_classic_baked.png');

async function getReferenceDimensions() {
  const metadata = await sharp(REFERENCE_COOKIE).metadata();
  console.log(`Reference cookie dimensions: ${metadata.width}x${metadata.height}`);
  return { width: metadata.width, height: metadata.height };
}

function getBurntCookieFiles() {
  const files = fs.readdirSync(INPUT_DIR);
  return files.filter(file => 
    file.includes('_burnt_') && 
    (file.endsWith('.jpg') || file.endsWith('.jpeg')) &&
    !file.startsWith('Copia_de_') &&
    !file.startsWith('Heart_cookie_burnt_flat')
  );
}

function fixFilename(filename) {
  return filename.replace('__dup1', '').replace('.jpeg', '.png').replace('.jpg', '.png');
}

async function convertImage(inputPath, outputPath, dimensions) {
  // First resize and get raw pixels
  const { data, info } = await sharp(inputPath)
    .resize(dimensions.width, dimensions.height, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .toColorspace('srgb')
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Process each pixel
  const pixelCount = info.width * info.height;
  const newData = Buffer.alloc(pixelCount * 4);

  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const a = data[i * 4 + 3];

    // Check if pixel is white (very light)
    const isWhite = r >= 250 && g >= 250 && b >= 250;

    if (isWhite) {
      newData[i * 4] = 0;
      newData[i * 4 + 1] = 0;
      newData[i * 4 + 2] = 0;
      newData[i * 4 + 3] = 0; // Transparent
    } else {
      newData[i * 4] = r;
      newData[i * 4 + 1] = g;
      newData[i * 4 + 2] = b;
      newData[i * 4 + 3] = 255; // Fully opaque
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
  .toFile(outputPath);
}

async function main() {
  console.log('Starting burnt cookie conversion with background removal...');
  
  const dimensions = await getReferenceDimensions();
  const files = getBurntCookieFiles();
  console.log(`Found ${files.length} burnt cookie files to convert`);
  
  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file);
    const outputFilename = fixFilename(file);
    const outputPath = path.join(OUTPUT_DIR, outputFilename);
    
    console.log(`Removing background: ${file} -> ${outputFilename}`);
    await convertImage(inputPath, outputPath, dimensions);
  }
  
  console.log('✅ All burnt cookies converted!');
}

main().catch(err => {
  console.error('❌ Error converting cookies:', err);
  process.exit(1);
});
