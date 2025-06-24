#!/usr/bin/env node

/**
 * Script de migración para Frontend Standards Checker
 * Ayuda a migrar de la versión monolítica a la versión modular
 */

import fs from 'fs';

const MIGRATION_STEPS = [
  {
    name: '1. Backup del script original',
    check: () => fs.existsSync('checkFrontendStandards.mjs'),
    action: () => {
      if (fs.existsSync('checkFrontendStandards.mjs')) {
        const backupName = `checkFrontendStandards.mjs.backup.${Date.now()}`;
        fs.copyFileSync('checkFrontendStandards.mjs', backupName);
        console.log(`✅ Backup creado: ${backupName}`);
      }
    }
  },
  {
    name: '2. Verificar nueva estructura',
    check: () => fs.existsSync('src/index.js') && fs.existsSync('bin/cli.js'),
    action: () => {
      console.log('✅ Nueva estructura verificada');
    }
  },
  {
    name: '3. Verificar package.json',
    check: () => {
      try {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        return pkg.type === 'module' && pkg.bin?.['check-frontend-standards'];
      } catch {
        return false;
      }
    },
    action: () => {
      console.log('✅ package.json configurado correctamente');
    }
  },
  {
    name: '4. Migrar configuración personalizada',
    check: () => fs.existsSync('checkFrontendStandards.config.js'),
    action: () => {
      if (fs.existsSync('checkFrontendStandards.config.js')) {
        console.log('✅ Configuración personalizada encontrada');
        console.log('ℹ️  Verificar que la configuración sea compatible con la nueva versión');
      } else {
        console.log('ℹ️  No se encontró configuración personalizada');
        console.log('ℹ️  Puedes crear una usando: checkFrontendStandards.config.example.js');
      }
    }
  }
];

console.log('🔄 Iniciando migración a Frontend Standards Checker v2.0\n');

let allChecked = true;

for (const step of MIGRATION_STEPS) {
  console.log(`📋 ${step.name}`);

  try {
    if (step.check()) {
      step.action();
    } else {
      console.log(`❌ ${step.name} - No se cumple el requisito`);
      allChecked = false;
    }
  } catch (error) {
    console.log(`❌ ${step.name} - Error: ${error.message}`);
    allChecked = false;
  }

  console.log('');
}

if (allChecked) {
  console.log('🎉 ¡Migración completada exitosamente!');
  console.log('');
  console.log('📝 Próximos pasos:');
  console.log('  1. Ejecutar: npm install');
  console.log('  2. Probar: npm run cli -- --help');
  console.log('  3. Ejecutar validación: npm start');
  console.log('');
  console.log('📚 Ver README.md para información completa sobre la nueva versión');
} else {
  console.log('⚠️  Migración incompleta. Revisar los pasos fallidos.');
  console.log('📖 Consultar la documentación para resolver los problemas.');
}

console.log('\n📋 Comparación de comandos:');
console.log('  Antes: node checkFrontendStandards.mjs');
console.log('  Ahora: npm start');
console.log('  Ahora: ./bin/cli.js');
console.log('  Ahora: npm run cli -- --zones apps --verbose');
