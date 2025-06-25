#!/bin/bash

# Test de instalación para verificar que funciona correctamente
# Uso: ./test-install.sh

set -e

echo "🧪 Probando instalación de Frontend Standards Checker"
echo "=================================================="

# Crear directorio temporal
TEST_DIR="test-installation-$$"
mkdir "$TEST_DIR"
cd "$TEST_DIR"

echo "📁 Directorio de prueba creado: $TEST_DIR"

# Crear package.json básico
echo "📝 Creando package.json básico..."
cat > package.json << 'EOF'
{
  "name": "test-frontend-standards",
  "version": "1.0.0",
  "description": "Test installation",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
EOF

# Detectar package manager disponible
if command -v bun &> /dev/null; then
    echo "🍞 Probando instalación con Bun..."
    bun init -y > /dev/null 2>&1 || true

    echo "📥 Instalando paquete..."
    bun add --dev frontend-standards-checker@https://github.com/juandape/frontend-standards.git

    echo "✅ Instalación con Bun completada"

    # Probar comandos
    echo "🔍 Probando comandos..."
    bun frontend-standards-checker --help > /dev/null && echo "✅ Comando directo funciona"

elif command -v npm &> /dev/null; then
    echo "📦 Probando instalación con NPM..."

    echo "📥 Instalando paquete..."
    npm install --save-dev git+https://github.com/juandape/frontend-standards.git

    echo "✅ Instalación con NPM completada"

    # Probar comandos
    echo "🔍 Probando comandos..."
    npx frontend-standards-checker --help > /dev/null && echo "✅ Comando directo funciona"

else
    echo "❌ Error: No se encontró npm ni bun"
    exit 1
fi

# Limpiar
cd ..
rm -rf "$TEST_DIR"

echo ""
echo "🎉 ¡Prueba de instalación completada exitosamente!"
echo "   El paquete se puede instalar correctamente."
