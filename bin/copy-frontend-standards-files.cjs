#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const files = [
  'checkFrontendStandards.config.js',
  'checkFrontendStandards.COMPLETE-GUIDE.md',
];

// Obtener la ruta del proyecto donde se está instalando
const projectRoot = process.cwd();

// Obtener la ruta del paquete instalado
let packageRoot;
if (__dirname.includes('node_modules')) {
  // Estamos siendo ejecutados desde node_modules/frontend-standards-checker/bin
  packageRoot = path.resolve(__dirname, '../');
} else {
  // Estamos siendo ejecutados desde el desarrollo local
  packageRoot = path.resolve(__dirname, '../');
}

console.log(`[frontend-standards-checker] Directorio del paquete: ${packageRoot}`);
console.log(`[frontend-standards-checker] Directorio del proyecto: ${projectRoot}`);

files.forEach((file) => {
  const src = path.join(packageRoot, file);
  const dest = path.join(projectRoot, file);
  
  console.log(`[frontend-standards-checker] Intentando copiar desde: ${src}`);
  console.log(`[frontend-standards-checker] Hacia: ${dest}`);
  
  if (!fs.existsSync(dest)) {
    if (fs.existsSync(src)) {
      try {
        fs.copyFileSync(src, dest);
        console.log(`[frontend-standards-checker] ✅ Copiado: ${file}`);
      } catch (error) {
        console.error(`[frontend-standards-checker] ❌ Error copiando ${file}:`, error.message);
      }
    } else {
      console.warn(`[frontend-standards-checker] ⚠️  Archivo no encontrado: ${src}`);
    }
  } else {
    console.log(`[frontend-standards-checker] ℹ️  Ya existe: ${file}`);
  }
});
