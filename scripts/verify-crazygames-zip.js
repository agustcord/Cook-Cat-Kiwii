#!/usr/bin/env node

/**
 * verify-crazygames-zip.js
 * 
 * Verificador determinístico de empaquetado para CrazyGames (Kiwipaw Bakehouse).
 * Inspecciona el archivo ZIP sin dependencias externas (usando Node.js nativo + zlib).
 * 
 * Criterios de Aceptación (AC-01 a AC-06):
 *  1. [AC-01] Raíz estricta: `index.html` debe residir en la raíz absoluta (sin `dist/` ni prefijos).
 *  2. [AC-02] Límite de archivos: <= 1500 archivos dentro del ZIP.
 *  3. [AC-03] Límite de tamaño: <= 25 MB (Límite duro CrazyGames: 250 MB; ideal: < 20 MB).
 *  4. [AC-04] Integridad del SDK: Tag <script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"> presente.
 *  5. [AC-05] Rutas relativas: Enlaces a scripts y estilos en index.html relativos (./assets/ o assets/).
 *  6. [AC-06] Coherencia interna: Todos los bundles JS y CSS referenciados existen físicamente en el ZIP.
 * 
 * Código de salida:
 *  0 = Éxito total (todos los checkpoints aprobados).
 *  1 = Fallo en al menos una validación.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de límites y reglas
const LIMITS = {
  MAX_FILES: 1500,
  MAX_SIZE_BYTES: 25 * 1024 * 1024, // 25 MB
  WARN_SIZE_BYTES: 20 * 1024 * 1024, // 20 MB (umbral de recomendación de CrazyGames)
  HARD_LIMIT_BYTES: 250 * 1024 * 1024 // 250 MB (límite duro CrazyGames)
};

/**
 * Parsea la tabla de contenido (Central Directory) de un archivo ZIP.
 * @param {Buffer} buffer
 * @returns {Array<{ name: string, method: number, compSize: number, uncompSize: number, localHeaderOffset: number, isDir: boolean }>}
 */
function parseZipCentralDirectory(buffer) {
  let eocdOffset = -1;
  const minEocdSearch = Math.max(0, buffer.length - 65557);

  for (let i = buffer.length - 22; i >= minEocdSearch; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error('No se encontró el registro EOCD (End of Central Directory). El archivo no es un ZIP válido o está dañado.');
  }

  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const cdOffset = buffer.readUInt32LE(eocdOffset + 16);

  let offset = cdOffset;
  const entries = [];

  for (let i = 0; i < totalEntries; i++) {
    const sig = buffer.readUInt32LE(offset);
    if (sig !== 0x02014b50) {
      throw new Error(`Firma de Central Directory inválida (0x${sig.toString(16)}) en offset ${offset}`);
    }

    const method = buffer.readUInt16LE(offset + 10);
    const compSize = buffer.readUInt32LE(offset + 20);
    const uncompSize = buffer.readUInt32LE(offset + 24);
    const nameLen = buffer.readUInt16LE(offset + 28);
    const extraLen = buffer.readUInt16LE(offset + 30);
    const commentLen = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);

    const rawName = buffer.toString('utf8', offset + 46, offset + 46 + nameLen);
    const normalizedName = rawName.replace(/\\/g, '/');

    entries.push({
      name: normalizedName,
      method,
      compSize,
      uncompSize,
      localHeaderOffset,
      isDir: normalizedName.endsWith('/')
    });

    offset += 46 + nameLen + extraLen + commentLen;
  }

  return entries;
}

/**
 * Descomprime y retorna el contenido de una entrada del ZIP.
 * @param {Buffer} buffer
 * @param {object} entry
 * @returns {Buffer}
 */
function extractEntryContent(buffer, entry) {
  const lhOffset = entry.localHeaderOffset;
  const sig = buffer.readUInt32LE(lhOffset);
  if (sig !== 0x04034b50) {
    throw new Error(`Firma Local Header inválida para entrada "${entry.name}" en offset ${lhOffset}`);
  }

  const lhNameLen = buffer.readUInt16LE(lhOffset + 26);
  const lhExtraLen = buffer.readUInt16LE(lhOffset + 28);
  const dataOffset = lhOffset + 30 + lhNameLen + lhExtraLen;

  if (entry.method === 0) {
    return buffer.subarray(dataOffset, dataOffset + entry.uncompSize);
  } else if (entry.method === 8) {
    const compressedSlice = buffer.subarray(dataOffset, dataOffset + entry.compSize);
    return zlib.inflateRawSync(compressedSlice);
  } else {
    throw new Error(`Método de compresión ${entry.method} no soportado para "${entry.name}"`);
  }
}

/**
 * Función principal de verificación.
 */
export function verifyCrazyGamesZip(targetZipPath) {
  const resolvedPath = path.resolve(targetZipPath || path.join(__dirname, '..', 'release', 'kiwipaw-bakehouse-crazygames.zip'));
  
  console.log('\n======================================================');
  console.log('🔍 VERIFICADOR DETERMINÍSTICO DE PAQUETE CRAZYGAMES');
  console.log('======================================================');
  console.log(`Archivo objetivo: ${resolvedPath}\n`);

  const checks = [];

  function recordCheck(id, description, passed, detail, isWarning = false) {
    checks.push({ id, description, passed, detail, isWarning });
    const tag = passed ? '✅ [PASS]' : (isWarning ? '⚠️  [WARN]' : '❌ [FAIL]');
    console.log(`${tag} ${id} - ${description}`);
    if (detail) {
      console.log(`       └─ ${detail}`);
    }
  }

  // 1. Existencia física del archivo
  if (!fs.existsSync(resolvedPath)) {
    recordCheck('AC-00', 'Existencia del archivo ZIP', false, `No existe el archivo en: ${resolvedPath}`);
    printSummary(checks);
    process.exit(1);
  }

  const stats = fs.statSync(resolvedPath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  recordCheck('AC-00', 'Existencia del archivo ZIP', true, `Archivo detectado (${stats.size} bytes / ${fileSizeMB} MB)`);

  // 2. Límite de tamaño (AC-03)
  if (stats.size > LIMITS.HARD_LIMIT_BYTES) {
    recordCheck('AC-03', 'Límite duro de tamaño (<= 250 MB)', false, `Tamaño (${fileSizeMB} MB) supera el límite duro de 250 MB.`);
  } else if (stats.size > LIMITS.MAX_SIZE_BYTES) {
    recordCheck('AC-03', 'Límite de tamaño del entregable (<= 25 MB)', false, `Tamaño (${fileSizeMB} MB) supera el límite de 25 MB.`);
  } else if (stats.size > LIMITS.WARN_SIZE_BYTES) {
    recordCheck('AC-03', 'Límite de tamaño del entregable (<= 25 MB)', true, `Tamaño (${fileSizeMB} MB) cumple el criterio (< 25 MB), pero excede los 20 MB ideales.`, true);
  } else {
    recordCheck('AC-03', 'Límite de tamaño del entregable (<= 25 MB)', true, `Tamaño óptimo: ${fileSizeMB} MB (dentro del objetivo < 20 MB y límite <= 25 MB)`);
  }

  // Lectura del buffer para análisis interno
  let zipBuffer;
  let entries = [];
  try {
    zipBuffer = fs.readFileSync(resolvedPath);
    entries = parseZipCentralDirectory(zipBuffer);
  } catch (err) {
    recordCheck('ZIP-CORRUPT', 'Integridad estructural del archivo ZIP', false, `Error al parsear: ${err.message}`);
    printSummary(checks);
    process.exit(1);
  }

  // Separar archivos de directorios
  const fileEntries = entries.filter(e => !e.isDir);
  const totalFiles = fileEntries.length;

  // 3. Conteo de archivos (AC-02)
  if (totalFiles > LIMITS.MAX_FILES) {
    recordCheck('AC-02', 'Límite total de archivos (<= 1500)', false, `Contiene ${totalFiles} archivos (supera el límite de ${LIMITS.MAX_FILES}).`);
  } else {
    recordCheck('AC-02', 'Límite total de archivos (<= 1500)', true, `Total de archivos: ${totalFiles} / ${LIMITS.MAX_FILES} (${((totalFiles / LIMITS.MAX_FILES) * 100).toFixed(1)}% del cupo)`);
  }

  // 4. Raíz estricta y ausencia de carpetas contenedoras (AC-01)
  const hasRootIndex = entries.some(e => e.name === 'index.html');
  const distPrefixEntries = entries.filter(e => e.name.startsWith('dist/') || e.name === 'dist');
  const nestedIndexEntries = entries.filter(e => e.name.endsWith('/index.html') && e.name !== 'index.html');

  if (!hasRootIndex) {
    recordCheck('AC-01', 'index.html en raíz estricta del ZIP', false, 'Falta "index.html" en la raíz del archivo ZIP.');
  } else if (distPrefixEntries.length > 0) {
    recordCheck('AC-01', 'Ausencia de prefijo envolvente "dist/"', false, `Se encontraron ${distPrefixEntries.length} entradas con prefijo "dist/". Los assets deben estar en raíz.`);
  } else if (nestedIndexEntries.length > 0) {
    recordCheck('AC-01', 'Único index.html en raíz (sin duplicados anidados)', false, `Se detectó index.html en subdirectorios: ${nestedIndexEntries.map(e => e.name).join(', ')}`);
  } else {
    recordCheck('AC-01', 'index.html en la raíz estricta sin subcarpetas envolventes', true, 'index.html verificado en la raíz. Cero entradas con prefijo dist/.');
  }

  // 5. Análisis del contenido de index.html
  const rootIndexEntry = entries.find(e => e.name === 'index.html');
  if (!rootIndexEntry) {
    printSummary(checks);
    process.exit(1);
  }

  let indexHtmlContent = '';
  try {
    const rawIndex = extractEntryContent(zipBuffer, rootIndexEntry);
    indexHtmlContent = rawIndex.toString('utf8');
  } catch (err) {
    recordCheck('AC-04', 'Extracción de index.html', false, `No se pudo leer el contenido de index.html: ${err.message}`);
    printSummary(checks);
    process.exit(1);
  }

  // 6. Integridad del SDK CrazyGames v3 (AC-04)
  const sdkRegex = /<script\s+[^>]*src=["']https:\/\/sdk\.crazygames\.com\/crazygames-sdk-v3\.js["'][^>]*>\s*<\/script>/i;
  if (sdkRegex.test(indexHtmlContent)) {
    recordCheck('AC-04', 'Inclusión de CrazyGames SDK v3 en <head>', true, 'Tag oficial <script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script> presente.');
  } else {
    recordCheck('AC-04', 'Inclusión de CrazyGames SDK v3 en <head>', false, 'No se encontró el tag oficial del SDK v3 de CrazyGames en index.html.');
  }

  // 7. Rutas relativas en bundles (AC-05) y presencia física de bundles
  const scriptMatches = [...indexHtmlContent.matchAll(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi)];
  const styleMatches = [...indexHtmlContent.matchAll(/<link\s+[^>]*href=["']([^"']+)["'][^>]*>/gi)];

  let absolutePathsFound = [];
  let referencedBundles = [];

  for (const match of scriptMatches) {
    const src = match[1];
    if (src.startsWith('http://') || src.startsWith('https://')) continue; // Assets externos (CDN) permitidos
    if (src.startsWith('/')) {
      absolutePathsFound.push(src);
    } else {
      referencedBundles.push(src);
    }
  }

  for (const match of styleMatches) {
    const href = match[1];
    if (href.startsWith('http://') || href.startsWith('https://')) continue;
    if (href.startsWith('/')) {
      absolutePathsFound.push(href);
    } else {
      referencedBundles.push(href);
    }
  }

  if (absolutePathsFound.length > 0) {
    recordCheck('AC-05', 'Rutas relativas en assets locales', false, `Se encontraron rutas absolutas prohibidas: ${absolutePathsFound.join(', ')}`);
  } else if (referencedBundles.length === 0) {
    recordCheck('AC-05', 'Detección de bundles locales en index.html', false, 'No se encontraron referencias a bundles locales en index.html.');
  } else {
    recordCheck('AC-05', 'Rutas relativas en bundles JS y CSS', true, `Todas las rutas locales son relativas: ${referencedBundles.join(', ')}`);
  }

  // 8. Coherencia interna: verificar que cada bundle referenciado exista dentro del ZIP
  const entryNameSet = new Set(entries.map(e => e.name));
  let missingBundles = [];

  for (const bundle of referencedBundles) {
    // Normalizar './assets/index-xxx.js' -> 'assets/index-xxx.js'
    const normalized = bundle.replace(/^\.\//, '');
    if (!entryNameSet.has(normalized)) {
      missingBundles.push(normalized);
    }
  }

  if (missingBundles.length > 0) {
    recordCheck('BUNDLE-INTEGRITY', 'Existencia física de bundles en el ZIP', false, `Los siguientes bundles referenciados en index.html no existen en el ZIP: ${missingBundles.join(', ')}`);
  } else {
    recordCheck('BUNDLE-INTEGRITY', 'Existencia física de bundles en el ZIP', true, `Todos los bundles locales referenciados (${referencedBundles.length}) están presentes físicamente.`);
  }

  const success = printSummary(checks);
  return success ? 0 : 1;
}

function printSummary(checks) {
  const failed = checks.filter(c => !c.passed && !c.isWarning);
  const warnings = checks.filter(c => c.isWarning);
  const passed = checks.filter(c => c.passed);

  console.log('\n------------------------------------------------------');
  console.log(`📋 RESUMEN DE AUDITORÍA: ${passed.length} PASS | ${failed.length} FAIL | ${warnings.length} WARN`);
  console.log('------------------------------------------------------');

  if (failed.length === 0) {
    console.log('🎉 ¡EL PAQUETE CUMPLE 100% CON TODOS LOS REQUISITOS DE CRAZYGAMES!');
    console.log('    Listo para subir en developer.crazygames.com\n');
    return true;
  } else {
    console.error('💥 ERRORES DETECTADOS QUE IMPIDEN LA APROBACIÓN:');
    for (const f of failed) {
      console.error(`  - [${f.id}] ${f.description}: ${f.detail}`);
    }
    console.log('');
    return false;
  }
}

// Ejecución directa por CLI
const targetZip = process.argv[2];
const exitCode = verifyCrazyGamesZip(targetZip);
process.exit(exitCode);
