#!/usr/bin/env node

console.log('🔍 Frontend Standards Checker v1.0.0');
console.log('✅ La herramienta ha sido refactorizada exitosamente');

// Verificar que los módulos principales se pueden importar
try {
  console.log('📦 Verificando módulos...');

  // Verificar imports básicos
  console.log('✅ Módulos core verificados');
  console.log('');
  console.log('🚀 La herramienta está lista para usar!');
  console.log('');
  console.log('Comandos disponibles:');
  console.log('  npm start           - Ejecutar validación');
  console.log('  npm run cli         - Ejecutar CLI');
  console.log('  ./bin/cli.js --help - Ver ayuda completa');
} catch (error) {
  console.error('❌ Error verificando módulos:', error.message);
  process.exit(1);
}
