
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const INPUT_DIR = path.join(__dirname, 'public', 'assets', 'cookies_png_temp');
const OUTPUT_DIR = path.join(__dirname, 'public', 'assets', 'cookies');
const REFERENCE_COOKIE = path.join(__dirname, 'public', 'assets', 'cookies', 'cookie_star_classic_baked.png');

async function getReferenceDimensions() {
  const metadata = await sharp(REFERENCE_COOKIE).metadata();
  console.log(`Reference cookie dimensions: ${metadata.width}x${metadata.height}`);
  return { width: metadata.width, height: metadata.height };
}

function getRawCookieFiles() {
  const files = fs.readdirSync(INPUT_DIR);
  return files.filter(file => 
    file.includes('_raw_') && 
    file.endsWith('.png')
  );
}

function fixFilename(filename) {
  return filename.replace('__dup1', '');
}

async function convertImage(inputPath, outputPath, dimensions) {
  // Read the image and process it properly
  const { data, info } = await sharp(inputPath)
    .resize(dimensions.width, dimensions.height, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Create a new buffer for our transparent image
  const pixelCount = info.width * info.height;
  const newData = Buffer.alloc(pixelCount * 4);

  // Process each pixel to remove white/cream background
  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const a = data[i * 4 + 3];

    // Check if the pixel is white/cream (light background)
    const isWhite = r > 240 && g > 240 && b > 240;
    const isCream = r > 230 && g > 220 && b > 200 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15;

    if (isWhite || isCream) {
      // Make it transparent
      newData[i * 4] = 0;
      newData[i * 4 + 1] = 0;
      newData[i * 4 + 2] = 0;
      newData[i * 4 + 3] = 0;
    } else {
      // Keep the original color
      newData[i * 4] = r;
      newData[i * 4 + 1] = g;
      newData[i * 4 + 2] = b;
      newData[i * 4 + 3] = a; // Keep original alpha
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
  console.log('Starting raw cookie conversion with background removal...');
  
  const dimensions = await getReferenceDimensions();
  const files = getRawCookieFiles();
  console.log(`Found ${files.length} raw cookie files to convert`);
  
  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file);
    const outputFilename = fixFilename(file);
    const outputPath = path.join(OUTPUT_DIR, outputFilename);
    
    console.log(`Removing background and converting: ${file} -> ${outputFilename}`);
    await convertImage(inputPath, outputPath, dimensions);
  }
  
  console.log('✅ All raw cookies converted with proper transparent background!');
}

main().catch(err => {
  console.error('❌ Error converting cookies:', err);
  process.exit(1);
});
