#!/usr/bin/env node

/**
 * package-crazygames.js
 * 
 * Orquestador determinístico de empaquetado para CrazyGames (Kiwipaw Bakehouse).
 * 
 * Pasos:
 *  1. Verifica integridad de ui-config.json antes de empezar.
 *  2. Compila el proyecto en producción (npm run build).
 *  3. Asegura el directorio release/.
 *  4. Comprime el contenido interno dist/* hacia release/kiwipaw-bakehouse-crazygames.zip
 *     garantizando que index.html quede en la raíz absoluta del archivo.
 *  5. Ejecuta verify-crazygames-zip.js para auditar el paquete.
 *  6. Revalida que ui-config.json no haya sufrido mutaciones (Regla de Oro).
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const releaseDir = path.join(rootDir, 'release');
const zipFile = path.join(releaseDir, 'kiwipaw-bakehouse-crazygames.zip');
const distDir = path.join(rootDir, 'dist');
const uiConfigPath = path.join(rootDir, 'ui-config.json');

function getSha256(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

console.log('\n======================================================');
console.log('📦 EMPAQUETADOR DETERMINÍSTICO CRAZYGAMES');
console.log('======================================================');

// 1. Snapshot de seguridad de ui-config.json
const initialUiHash = getSha256(uiConfigPath);
console.log(`[Seguridad] SHA-256 ui-config.json inicial: ${initialUiHash}`);

// 2. Build de producción
console.log('\n▶ Paso 1: Ejecutando npm run build...');
try {
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
} catch (err) {
  console.error('❌ Error fatal al compilar con npm run build');
  process.exit(1);
}

// Validar que dist/index.html exista
if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('❌ dist/index.html no fue generado tras la compilación.');
  process.exit(1);
}

// 3. Asegurar release/
if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

// Eliminar zip previo si existe
if (fs.existsSync(zipFile)) {
  try {
    fs.unlinkSync(zipFile);
  } catch (e) {
    // Si falla el unlink, Compress-Archive con -Force lo sobreescribirá
  }
}

// 4. Compresión determinística
console.log('\n▶ Paso 2: Generando archivo ZIP en release/kiwipaw-bakehouse-crazygames.zip...');

let zipCreated = false;
const distGlob = path.join(distDir, '*');

// Intentar pwsh primero
const pwshCmd = `Compress-Archive -Path '${distGlob}' -DestinationPath '${zipFile}' -Force`;
let result = spawnSync('pwsh', ['-NoProfile', '-Command', pwshCmd], {
  cwd: rootDir,
  stdio: 'inherit'
});

if (result.status === 0 && fs.existsSync(zipFile)) {
  zipCreated = true;
} else {
  // Fallback a powershell de Windows
  console.log('Intentando fallback con Windows PowerShell...');
  result = spawnSync('powershell', ['-NoProfile', '-Command', pwshCmd], {
    cwd: rootDir,
    stdio: 'inherit'
  });
  if (result.status === 0 && fs.existsSync(zipFile)) {
    zipCreated = true;
  }
}

if (!zipCreated) {
  // Fallback con tar si powershell no estuviera disponible
  console.log('Intentando compresión vía tar...');
  try {
    execSync(`tar -a -cf "${zipFile}" -C "${distDir}" .`, { cwd: rootDir, stdio: 'inherit' });
    if (fs.existsSync(zipFile)) {
      zipCreated = true;
    }
  } catch (tarErr) {
    console.error('Fallo en fallback de tar:', tarErr.message);
  }
}

if (!zipCreated) {
  console.error('❌ Error: No se pudo generar el archivo ZIP.');
  process.exit(1);
}

console.log(`✅ ZIP generado exitosamente: ${zipFile}`);

// 5. Verificación automatizada
console.log('\n▶ Paso 3: Verificando integridad del ZIP...');
const verifyScript = path.join(__dirname, 'verify-crazygames-zip.js');
const verifyResult = spawnSync('node', [verifyScript, zipFile], {
  cwd: rootDir,
  stdio: 'inherit'
});

if (verifyResult.status !== 0) {
  console.error('❌ Error: La verificación del ZIP falló.');
  process.exit(1);
}

// 6. Verificación final de inviolabilidad de ui-config.json
const finalUiHash = getSha256(uiConfigPath);
if (initialUiHash !== finalUiHash) {
  console.error('🚨 VIOLACIÓN CRÍTICA DE REGLA DE ORO: ui-config.json fue mutado durante el empaquetado.');
  process.exit(1);
}
console.log(`[Seguridad] SHA-256 ui-config.json final verificado intacto: ${finalUiHash}`);
console.log('🎉 PROCESO DE EMPAQUETADO Y VERIFICACIÓN COMPLETADO CON ÉXITO.\n');
