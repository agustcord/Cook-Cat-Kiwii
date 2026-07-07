import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Helper to recursively list files in a directory
function getFilesRecursively(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath));
    } else {
      results.push(fullPath);
    }
  });
  return results;
}

// 1. Gather all files in public/assets
const assetsDir = path.join(projectRoot, 'public', 'assets');
const allAssetFiles = getFilesRecursively(assetsDir);

// 2. Read all source files in src/ and index.html to search for references
const srcDir = path.join(projectRoot, 'src');
const srcFiles = getFilesRecursively(srcDir);
srcFiles.push(path.join(projectRoot, 'index.html'));

const srcContents = srcFiles.map(file => fs.readFileSync(file, 'utf-8')).join('\n');

// 3. Define valid dynamic lists from BootScene.js / GameScene.js
const validShapes = ['star', 'heart', 'cat', 'fish'];
const validBases = ['classic', 'chocolate', 'oat'];
const validToppings = ['sprinkles', 'choco', 'glazing'];
const validStates = ['raw', 'baked', 'burnt'];

function isCookieAssetValid(filename) {
  // Pattern: cookie_{shape}_{base}_{state}[_{topping}].png
  const baseName = path.basename(filename, '.png');
  const parts = baseName.split('_');
  if (parts[0] !== 'cookie') return false;
  
  if (parts.length < 4 || parts.length > 5) return false;
  
  const shape = parts[1];
  const base = parts[2];
  const state = parts[3];
  
  if (!validShapes.includes(shape)) return false;
  if (!validBases.includes(base)) return false;
  if (!validStates.includes(state)) return false;
  
  if (parts.length === 5) {
    const topping = parts[4];
    if (!validToppings.includes(topping)) return false;
  }
  
  return true;
}

console.log('--- Analyzing Assets ---');

const unusedAssets = [];
const tempDirAssets = [];

allAssetFiles.forEach(assetPath => {
  const relativePath = path.relative(projectRoot, assetPath);
  const cleanRelativePath = relativePath.replace(/\\/g, '/'); // Normalize to forward slashes for comparisons
  const filename = path.basename(assetPath);
  
  // Categorize temporary directories
  if (
    cleanRelativePath.includes('assets/cookies_jpg_temp/') ||
    cleanRelativePath.includes('assets/cookies_png_temp/') ||
    cleanRelativePath.includes('assets/ui_temp_jpg/')
  ) {
    tempDirAssets.push(cleanRelativePath);
    return;
  }
  
  // If it's in the cookies directory, check using dynamic cookie logic
  if (cleanRelativePath.includes('assets/cookies/')) {
    if (!isCookieAssetValid(filename)) {
      unusedAssets.push({ path: cleanRelativePath, reason: 'Invalid or unused cookie combination/shape' });
    }
    return;
  }
  
  // For all other assets, check if their filename or path is referenced in code
  // We check for references to the filename (e.g. 'chef_cat.png') or path without extension or exact path
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  
  const isReferenced = 
    srcContents.includes(filename) ||
    srcContents.includes(nameWithoutExt) ||
    srcContents.includes(cleanRelativePath) ||
    srcContents.includes(cleanRelativePath.replace('public/', ''));
    
  if (!isReferenced) {
    unusedAssets.push({ path: cleanRelativePath, reason: 'Not referenced anywhere in source code' });
  }
});

console.log(`\nFound ${tempDirAssets.length} files in temporary directories (_temp folders).`);
console.log(`Found ${unusedAssets.length} unused assets in production directories.`);

// Write results to a file for review
const results = {
  tempDirAssets,
  unusedAssets
};

fs.writeFileSync(
  path.join(projectRoot, 'scratch', 'unused_assets_analysis.json'),
  JSON.stringify(results, null, 2)
);

console.log('\nAnalysis complete! Results written to scratch/unused_assets_analysis.json');
