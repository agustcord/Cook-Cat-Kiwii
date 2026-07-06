import fs from 'fs';
import path from 'path';

function getPngDimensions(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    if (buffer.readUInt32BE(0) !== 0x89504E47) {
      throw new Error('Not a valid PNG file');
    }
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  } catch (e) {
    return { error: e.message };
  }
}

['public/assets/backgrounds'].forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Checking files in ${dir}:`);
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (file.endsWith('.png')) {
        const dimensions = getPngDimensions(path.join(dir, file));
        console.log(`- ${file}: ${dimensions.width}x${dimensions.height} (${fs.statSync(path.join(dir, file)).size} bytes)`);
      }
    });
  }
});
