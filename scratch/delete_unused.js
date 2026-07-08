import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const analysisPath = path.join(projectRoot, 'scratch', 'unused_assets_analysis.json');
if (!fs.existsSync(analysisPath)) {
  console.error('Analysis file not found.');
  process.exit(1);
}

const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));

console.log('--- Starting Cleanup ---');

// 1. Delete individual files in unusedAssets
analysis.unusedAssets.forEach(asset => {
  const filePath = path.join(projectRoot, asset.path);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`✅ Deleted: ${asset.path}`);
  } else {
    console.log(`ℹ️ Already deleted/not found: ${asset.path}`);
  }
});

// 2. Delete folders in tempDirAssets
const tempFolders = [
  path.join(projectRoot, 'public', 'assets', 'cookies_jpg_temp'),
  path.join(projectRoot, 'public', 'assets', 'cookies_png_temp'),
  path.join(projectRoot, 'public', 'assets', 'ui_temp_jpg')
];

tempFolders.forEach(folderPath => {
  if (fs.existsSync(folderPath)) {
    fs.rmSync(folderPath, { recursive: true, force: true });
    console.log(`✅ Deleted folder: ${path.relative(projectRoot, folderPath)}`);
  } else {
    console.log(`ℹ️ Folder already deleted/not found: ${path.relative(projectRoot, folderPath)}`);
  }
});

console.log('--- Cleanup Finished ---');
