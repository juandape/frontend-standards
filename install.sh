#!/bin/bash

# Frontend Standards Checker - Instalación Automática
# Versión 4.9.0

set -e

# Guardar directorio original
ORIGINAL_DIR=$(pwd)

echo "🚀 Frontend Standards Checker - Instalación Automática v4.9.0"
echo "============================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de utilidad
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar que estamos en un directorio de proyecto
if [ ! -f "package.json" ]; then
    log_error "No se encontró package.json. Ejecuta este script desde la raíz de tu proyecto."
    exit 1
fi

log_info "Detectando tipo de proyecto..."

# Detectar package manager
PACKAGE_MANAGER=""
if [ -f "yarn.lock" ]; then
    PACKAGE_MANAGER="yarn"
    log_info "Detectado: Yarn"
elif [ -f "package-lock.json" ]; then
    PACKAGE_MANAGER="npm"
    log_info "Detectado: NPM"
else
    log_warning "No se detectó yarn.lock ni package-lock.json. Usando npm por defecto."
    PACKAGE_MANAGER="npm"
fi

# Verificar si es proyecto React Native
IS_REACT_NATIVE=false
if grep -q "react-native" package.json; then
    IS_REACT_NATIVE=true
    log_info "Detectado: Proyecto React Native"
fi

# Crear directorio temporal fuera del proyecto
TEMP_DIR="/tmp/temp-frontend-standards-$$"
log_info "Creando directorio temporal: $TEMP_DIR"

# Clonar el repositorio
log_info "Descargando Frontend Standards Checker..."
git clone --depth 1 https://github.com/juandape/frontend-standards.git "$TEMP_DIR"

cd "$TEMP_DIR"

# Instalar dependencias y compilar
log_info "Compilando Frontend Standards Checker..."
if command -v yarn &> /dev/null; then
    yarn install > /dev/null 2>&1
    yarn build > /dev/null 2>&1
else
    npm install > /dev/null 2>&1
    npm run build > /dev/null 2>&1
fi

cd ..

# Método de instalación basado en el tipo de proyecto
install_method() {
    if [ "$IS_REACT_NATIVE" = true ]; then
        log_info "Instalación optimizada para React Native..."

        # Método de copia directa para React Native (evita conflictos de dependencias)
        if [ -d "frontend-standards-full" ]; then
            log_warning "Directorio frontend-standards-full ya existe. Actualizando..."
            rm -rf frontend-standards-full
        fi

        # Volver al directorio original antes de copiar
        cd "$ORIGINAL_DIR"
        cp -r "$TEMP_DIR" frontend-standards-full
        log_success "Frontend Standards copiado a ./frontend-standards-full/"

        # Instalar dependencias en el directorio copiado
        log_info "Instalando dependencias locales..."
        cd frontend-standards-full
        if command -v yarn &> /dev/null; then
            yarn install --production > /dev/null 2>&1
        else
            npm install --production > /dev/null 2>&1
        fi
        cd "$ORIGINAL_DIR"

        # Agregar scripts al package.json
        add_scripts_react_native

    else
        log_info "Instalación estándar..."

        # Intentar instalación con package manager
        if [ "$PACKAGE_MANAGER" = "yarn" ]; then
            if yarn add --dev git+https://github.com/juandape/frontend-standards.git; then
                log_success "Instalado con Yarn"
                add_scripts_standard
            else
                log_warning "Falló instalación con Yarn. Intentando método alternativo..."
                fallback_installation
            fi
        else
            if npm install --save-dev git+https://github.com/juandape/frontend-standards.git --legacy-peer-deps; then
                log_success "Instalado con NPM"
                add_scripts_standard
            else
                log_warning "Falló instalación con NPM. Intentando método alternativo..."
                fallback_installation
            fi
        fi
    fi
}

# Instalación alternativa (copia directa)
fallback_installation() {
    log_info "Usando método de copia directa..."

    # Volver al directorio original
    cd "$ORIGINAL_DIR"

    if [ -d "frontend-standards-full" ]; then
        log_warning "Directorio frontend-standards-full ya existe. Actualizando..."
        rm -rf frontend-standards-full
    fi

    cp -r "$TEMP_DIR" frontend-standards-full
    log_success "Frontend Standards copiado a ./frontend-standards-full/"

    # Instalar dependencias en el directorio copiado
    log_info "Instalando dependencias locales..."
    cd frontend-standards-full
    if command -v yarn &> /dev/null; then
        yarn install --production > /dev/null 2>&1
    else
        npm install --production > /dev/null 2>&1
    fi
    cd "$ORIGINAL_DIR"

    add_scripts_react_native
}

# Agregar scripts para React Native
add_scripts_react_native() {
    log_info "Agregando scripts al package.json..."

    # Volver al directorio del proyecto
    cd "$ORIGINAL_DIR"

    # Usar Node.js para modificar package.json de forma segura
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    if (!pkg.scripts) pkg.scripts = {};

    const scriptsToAdd = {
        'standards': 'cd frontend-standards-full && yarn node dist/bin/cli.js && cd ..',
        'standards:zones': 'cd frontend-standards-full && yarn node dist/bin/cli.js --zones && cd ..',
        'standards:verbose': 'cd frontend-standards-full && yarn node dist/bin/cli.js --verbose && cd ..',
        'standards:config': 'cd frontend-standards-full && yarn node dist/bin/cli.js --config ../checkFrontendStandards.config.js && cd ..'
    };

    let added = [];
    for (const [script, command] of Object.entries(scriptsToAdd)) {
        if (!pkg.scripts[script]) {
            pkg.scripts[script] = command;
            added.push(script);
        }
    }

    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');

    if (added.length > 0) {
        console.log('✅ Scripts agregados:', added.join(', '));
    } else {
        console.log('ℹ️  Scripts ya existían');
    }
    "
}

# Agregar scripts para instalación estándar
add_scripts_standard() {
    log_info "Agregando scripts al package.json..."

    # Volver al directorio del proyecto
    cd "$ORIGINAL_DIR"

    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    if (!pkg.scripts) pkg.scripts = {};

    const scriptsToAdd = {
        'standards': 'frontend-standards',
        'standards:zones': 'frontend-standards --zones',
        'standards:verbose': 'frontend-standards --verbose',
        'standards:config': 'frontend-standards --config checkFrontendStandards.config.js'
    };

    let added = [];
    for (const [script, command] of Object.entries(scriptsToAdd)) {
        if (!pkg.scripts[script]) {
            pkg.scripts[script] = command;
            added.push(script);
        }
    }

    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');

    if (added.length > 0) {
        console.log('✅ Scripts agregados:', added.join(', '));
    } else {
        console.log('ℹ️  Scripts ya existían');
    }
    "
}

# Crear archivo de configuración
create_config_file() {
    # Volver al directorio del proyecto
    cd "$ORIGINAL_DIR"

    if [ ! -f "checkFrontendStandards.config.js" ]; then
        log_info "Creando archivo de configuración..."

        if [ "$IS_REACT_NATIVE" = true ]; then
            # Configuración optimizada para React Native
            cat > checkFrontendStandards.config.js << 'EOF'
// Frontend Standards Config - React Native
module.exports = {
  zones: {
    includePackages: false,
    customZones: ['src'] // Solo validar directorio src
  },
  extensions: ['.js', '.ts', '.jsx', '.tsx'],
  ignorePatterns: [
    'android/**',
    'ios/**',
    'build/**',
    'dist/**',
    'node_modules/**',
    '*.config.js',
    '__tests__/**',
    '*.test.*',
    '*.spec.*'
  ],
  onlyChangedFiles: false,
  rules: [
    // Reglas personalizadas para React Native
    {
      name: 'React Native - No console.log in production',
      check: (content, filePath) => {
        if (filePath.includes('debug') || filePath.includes('dev')) {
          return false; // Permitir en archivos de desarrollo
        }
        return content.includes('console.log');
      },
      message: 'Use proper logging solution for React Native production.',
      level: 'WARNING'
    },
    {
      name: 'React Native - Import organization',
      check: (content) => {
        const lines = content.split('\n');
        let foundReactNative = false;
        let foundOtherImports = false;

        for (const line of lines) {
          if (line.includes("from 'react-native'")) {
            if (foundOtherImports) return true;
            foundReactNative = true;
          } else if (line.startsWith('import') && !line.includes('react')) {
            foundOtherImports = true;
          }
        }
        return false;
      },
      message: 'Import React Native modules before other imports.',
      level: 'WARNING'
    }
  ]
};
EOF
        else
            # Configuración estándar
            cat > checkFrontendStandards.config.js << 'EOF'
// Frontend Standards Config
module.exports = {
  zones: {
    includePackages: false,
    customZones: ['src']
  },
  extensions: ['.js', '.ts', '.jsx', '.tsx'],
  ignorePatterns: [
    'build/**',
    'dist/**',
    'node_modules/**',
    '*.config.js',
    '__tests__/**',
    '*.test.*',
    '*.spec.*'
  ],
  onlyChangedFiles: true,
  rules: [
    // Reglas personalizadas - ejemplo
    {
      name: 'No console statements',
      check: (content) => /console\.(log|warn|error|info|debug)/.test(content),
      message: 'Remove console statements before committing to production.',
      level: 'WARNING'
    }
  ]
};
EOF
        fi

        log_success "Archivo de configuración creado: checkFrontendStandards.config.js"
    else
        log_info "Archivo de configuración ya existe"
    fi
}

# Copiar guía completa
copy_guide() {
    # Volver al directorio del proyecto
    cd "$ORIGINAL_DIR"

    if [ ! -f "checkFrontendStandards.COMPLETE-GUIDE.md" ]; then
        log_info "Copiando guía completa..."
        cp "$TEMP_DIR/checkFrontendStandards.COMPLETE-GUIDE.md" .
        log_success "Guía copiada: checkFrontendStandards.COMPLETE-GUIDE.md"
    else
        log_info "Guía completa ya existe"
    fi
}

# Ejecutar instalación
install_method
create_config_file
copy_guide

# Limpiar
log_info "Limpiando archivos temporales..."
rm -rf "$TEMP_DIR"

# Mensaje final
echo ""
echo "🎉 ¡Instalación completada!"
echo "============================================================"
log_success "Frontend Standards Checker está listo para usar"
echo ""
echo "📋 Comandos disponibles:"
if [ "$IS_REACT_NATIVE" = true ] || [ -d "frontend-standards-full" ]; then
    echo "   yarn standards                 # Validación completa"
    echo "   yarn standards:zones          # Validar zonas específicas"
    echo "   yarn standards:verbose        # Modo verbose"
    echo "   yarn standards:config         # Con configuración personalizada"
else
    echo "   $PACKAGE_MANAGER run standards                 # Validación completa"
    echo "   $PACKAGE_MANAGER run standards:zones          # Validar zonas específicas"
    echo "   $PACKAGE_MANAGER run standards:verbose        # Modo verbose"
    echo "   $PACKAGE_MANAGER run standards:config         # Con configuración personalizada"
fi
echo ""
echo "📁 Archivos creados:"
echo "   ✅ checkFrontendStandards.config.js"
echo "   ✅ checkFrontendStandards.COMPLETE-GUIDE.md"
if [ -d "frontend-standards-full" ]; then
    echo "   ✅ frontend-standards-full/ (instalación completa)"
fi
echo ""
echo "🚀 Ejecuta 'yarn standards' para comenzar a validar tu código"
echo ""
