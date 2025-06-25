#!/bin/bash

# Comando de instalación rápida para Yarn
# Uso directo sin script

echo "🚀 Instalación Rápida - Frontend Standards Checker"
echo "================================================"

# Verificar que estamos en un proyecto Node.js
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json en el directorio actual."
    echo "   Asegúrate de estar en la raíz de tu proyecto Node.js."
    exit 1
fi

echo "✅ Encontrado package.json"

# Verificar si tenemos yarn.lock o usar npm
if [ -f "yarn.lock" ] && command -v yarn &> /dev/null; then
    echo "🧶 Instalando con Yarn..."
    yarn add --dev frontend-standards-checker@https://github.com/juandape/frontend-standards.git
    echo "✅ Instalado con Yarn"
    
    # Agregar scripts si no existen
    if ! grep -q '"lint:standards"' package.json; then
        echo "⚙️  Agrega estos scripts a tu package.json:"
        echo '  "lint:standards": "frontend-standards-checker",'
        echo '  "lint:standards:zones": "frontend-standards-checker --zones",'
        echo '  "lint:standards:verbose": "frontend-standards-checker --verbose",'
        echo '  "lint:standards:report": "frontend-standards-checker --output standards-report.json"'
    fi
    
    echo ""
    echo "🎉 ¡Listo! Usa: yarn lint:standards"
    
elif command -v npm &> /dev/null; then
    echo "📦 Instalando con NPM..."
    npm install --save-dev git+https://github.com/juandape/frontend-standards.git
    echo "✅ Instalado con NPM"
    
    # Agregar scripts si no existen
    if ! grep -q '"lint:standards"' package.json; then
        echo "⚙️  Agrega estos scripts a tu package.json:"
        echo '  "lint:standards": "frontend-standards-checker",'
        echo '  "lint:standards:zones": "frontend-standards-checker --zones",'
        echo '  "lint:standards:verbose": "frontend-standards-checker --verbose",'
        echo '  "lint:standards:report": "frontend-standards-checker --output standards-report.json"'
    fi
    
    echo ""
    echo "🎉 ¡Listo! Usa: npm run lint:standards"
    
else
    echo "❌ Error: No se encontró npm ni yarn instalado."
    exit 1
fi

# Crear archivo de configuración básico si no existe
if [ ! -f "checkFrontendStandards.config.js" ]; then
    echo ""
    echo "📝 Creando archivo de configuración básico..."
    cat > checkFrontendStandards.config.js << 'EOF'
// Frontend Standards Checker - Configuración del Proyecto
export default [
  {
    name: 'No console statements',
    check: (content) => /console\.(log|warn|error|info|debug)/.test(content),
    message: 'Remove console statements before committing to production.',
  },
  {
    name: 'No var keyword',
    check: (content) => /\bvar\s/.test(content),
    message: 'Use "let" or "const" instead of "var".',
  },
  {
    name: 'No hardcoded URLs',
    check: (content) => /https?:\/\/[^\s"']+/.test(content),
    message: 'No hardcoded URLs allowed. Use environment variables or constants.',
  },
  // Agregar más reglas específicas de tu proyecto aquí
];
EOF
    echo "✅ Archivo checkFrontendStandards.config.js creado"
fi

echo ""
echo "📖 Para más información: https://github.com/juandape/frontend-standards"
