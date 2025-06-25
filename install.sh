#!/bin/bash

# Frontend Standards Checker - Script de Instalación Automática
# Uso: curl -fsSL https://raw.githubusercontent.com/tu-usuario/frontend-standards/main/install.sh | bash

set -e

echo "🚀 Frontend Standards Checker - Instalación Automática"
echo "=================================================="

# Verificar si npm o yarn están disponibles y cual se usa en el proyecto
PACKAGE_MANAGER=""
INSTALL_CMD=""
RUN_CMD=""

# Verificar si existe yarn.lock (prioritario)
if [ -f "yarn.lock" ] && command -v yarn &> /dev/null; then
    PACKAGE_MANAGER="yarn"
    INSTALL_CMD="yarn add --dev"
    RUN_CMD="yarn"
# Verificar si existe package-lock.json
elif [ -f "package-lock.json" ] && command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
    INSTALL_CMD="npm install --save-dev"
    RUN_CMD="npm run"
# Verificar si yarn está disponible (sin lock files)
elif command -v yarn &> /dev/null; then
    PACKAGE_MANAGER="yarn"
    INSTALL_CMD="yarn add --dev"
    RUN_CMD="yarn"
# Fallback a npm
elif command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
    INSTALL_CMD="npm install --save-dev"
    RUN_CMD="npm run"
else
    echo "❌ Error: No se encontró npm ni yarn instalado."
    exit 1
fi

echo "📦 Usando $PACKAGE_MANAGER como gestor de paquetes"

# Mostrar información específica según el package manager detectado
if [ "$PACKAGE_MANAGER" = "yarn" ]; then
    if [ -f "yarn.lock" ]; then
        echo "✅ Detectado proyecto con Yarn (yarn.lock encontrado)"
    else
        echo "ℹ️  Usando Yarn (no se encontró yarn.lock, se creará uno nuevo)"
    fi
else
    if [ -f "package-lock.json" ]; then
        echo "✅ Detectado proyecto con NPM (package-lock.json encontrado)"
    else
        echo "ℹ️  Usando NPM (no se encontró package-lock.json, se creará uno nuevo)"
    fi
fi

# Verificar si existe package.json
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json en el directorio actual."
    echo "   Asegúrate de estar en la raíz de tu proyecto Node.js."
    exit 1
fi

echo "✅ Encontrado package.json"

# Instalar el paquete
echo "📥 Instalando frontend-standards-checker..."
if [ "$PACKAGE_MANAGER" = "yarn" ]; then
    yarn add --dev git+https://github.com/juandape/frontend-standards.git
else
    npm install --save-dev git+https://github.com/juandape/frontend-standards.git
fi

echo "✅ Paquete instalado correctamente"

# Crear archivo de configuración básico si no existe
if [ ! -f "checkFrontendStandards.config.js" ]; then
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
else
    echo "ℹ️  Archivo checkFrontendStandards.config.js ya existe, manteniéndolo"
fi

# Agregar scripts a package.json
echo "⚙️  Configurando scripts en package.json..."

# Verificar si los scripts ya existen
if grep -q '"lint:standards"' package.json; then
    echo "ℹ️  Scripts ya configurados en package.json"
else
    # Crear archivo temporal con los nuevos scripts
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        SCRIPTS='"lint:standards": "frontend-standards-checker",
    "lint:standards:zones": "frontend-standards-checker --zones",
    "lint:standards:verbose": "frontend-standards-checker --verbose",
    "lint:standards:report": "frontend-standards-checker --output standards-report.json",'
    else
        SCRIPTS='"lint:standards": "frontend-standards-checker",
    "lint:standards:zones": "frontend-standards-checker --zones",
    "lint:standards:verbose": "frontend-standards-checker --verbose",
    "lint:standards:report": "frontend-standards-checker --output standards-report.json",'
    fi

    # Usar jq si está disponible, si no usar sed
    if command -v jq &> /dev/null; then
        cp package.json package.json.backup
        jq --arg scripts "$SCRIPTS" '.scripts += {
            "lint:standards": "frontend-standards-checker",
            "lint:standards:zones": "frontend-standards-checker --zones",
            "lint:standards:verbose": "frontend-standards-checker --verbose",
            "lint:standards:report": "frontend-standards-checker --output standards-report.json"
        }' package.json.backup > package.json
        rm package.json.backup
    else
        echo "⚠️  Agrega manualmente estos scripts a tu package.json:"
        echo '    "lint:standards": "frontend-standards-checker",'
        echo '    "lint:standards:zones": "frontend-standards-checker --zones",'
        echo '    "lint:standards:verbose": "frontend-standards-checker --verbose",'
        echo '    "lint:standards:report": "frontend-standards-checker --output standards-report.json"'
    fi
    echo "✅ Scripts configurados"
fi

# Crear .gitignore entries si no existen
if [ -f ".gitignore" ]; then
    if ! grep -q "standards-report.json" .gitignore; then
        echo "" >> .gitignore
        echo "# Frontend Standards reports" >> .gitignore
        echo "standards-report.json" >> .gitignore
        echo "*-standards-report.json" >> .gitignore
        echo "✅ Agregadas entradas a .gitignore"
    fi
else
    echo "⚠️  Considera crear un .gitignore que incluya:"
    echo "    standards-report.json"
    echo "    *-standards-report.json"
fi

echo ""
echo "🎉 ¡Instalación completada exitosamente!"
echo ""
echo "🔍 Comandos disponibles:"
if [ "$PACKAGE_MANAGER" = "yarn" ]; then
    echo "   yarn lint:standards                    # Ejecutar validación completa"
    echo "   yarn lint:standards:zones src components # Validar zonas específicas"
    echo "   yarn lint:standards:verbose             # Modo detallado"
    echo "   yarn lint:standards:report              # Generar reporte JSON"
    echo ""
    echo "🧶 Comandos adicionales de Yarn:"
    echo "   yarn frontend-standards-checker         # Ejecutar directamente"
    echo "   yarn frontend-standards-checker --help  # Ver todas las opciones"
else
    echo "   $RUN_CMD lint:standards                # Ejecutar validación completa"
    echo "   $RUN_CMD lint:standards:zones          # Validar zonas específicas"
    echo "   $RUN_CMD lint:standards:verbose        # Modo detallado"
    echo "   $RUN_CMD lint:standards:report         # Generar reporte JSON"
    echo ""
    echo "📦 Comandos adicionales de NPM:"
    echo "   npx frontend-standards-checker         # Ejecutar directamente"
    echo "   npx frontend-standards-checker --help  # Ver todas las opciones"
fi
echo ""
echo "📖 Para más información, consulta la documentación en:"
echo "   https://github.com/juandape/frontend-standards"
echo ""
echo "🚀 ¡A mantener código de calidad!"
