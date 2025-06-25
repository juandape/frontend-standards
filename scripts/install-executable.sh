#!/bin/bash

echo "🍞 Frontend Standards Checker - Executable Installation"
echo "======================================================"

# Verificar que estamos en un proyecto Node.js
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json en el directorio actual."
    echo "   Asegúrate de estar en la raíz de tu proyecto Node.js."
    exit 1
fi

echo "✅ Encontrado package.json"

# Detectar si Bun está disponible
if ! command -v bun &> /dev/null; then
    echo "❌ Error: Bun no está instalado."
    echo "   Instala Bun desde: https://bun.sh"
    echo "   O ejecuta: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo "✅ Bun detectado: $(bun --version)"

# Verificar si el proyecto ya está instalado
PACKAGE_INSTALLED=false
if grep -q '"frontend-standards-checker"' package.json 2>/dev/null; then
    PACKAGE_INSTALLED=true
    echo "✅ Paquete ya instalado en package.json"
else
    echo "📥 Instalando frontend-standards-checker..."
    bun add --dev frontend-standards-checker@https://github.com/juandape/frontend-standards.git
fi

# Crear ejecutable local
echo "🔨 Creando ejecutable standalone..."
EXECUTABLE_NAME="check-frontend-standards"

# Si el paquete está instalado como dependencia, usar desde node_modules
if [ "$PACKAGE_INSTALLED" = true ] && [ -f "node_modules/frontend-standards-checker/bin/cli.ts" ]; then
    echo "📦 Compilando desde node_modules..."
    bun build node_modules/frontend-standards-checker/bin/cli.ts --compile --minify --sourcemap --outfile "$EXECUTABLE_NAME"
elif [ -f "bin/cli.ts" ]; then
    echo "📦 Compilando desde código fuente local..."
    bun build bin/cli.ts --compile --minify --sourcemap --outfile "$EXECUTABLE_NAME"
else
    echo "❌ Error: No se encontró el archivo CLI para compilar."
    exit 1
fi

if [ -f "$EXECUTABLE_NAME" ]; then
    # Hacer ejecutable
    chmod +x "$EXECUTABLE_NAME"
    
    echo "✅ Ejecutable creado exitosamente: ./$EXECUTABLE_NAME"
    echo ""
    echo "🎯 Uso:"
    echo "   ./$EXECUTABLE_NAME --help                    # Ver ayuda"
    echo "   ./$EXECUTABLE_NAME --verbose                 # Ejecutar con output detallado"
    echo "   ./$EXECUTABLE_NAME --zones src components    # Validar zonas específicas"
    echo "   ./$EXECUTABLE_NAME --config ./custom.config.js  # Usar configuración personalizada"
    echo ""
    echo "📋 El ejecutable es completamente standalone y no requiere Node.js ni Bun para ejecutarse."
    echo "   Puedes copiarlo a cualquier servidor o distribuirlo independientemente."
    
    # Mostrar información del ejecutable
    EXECUTABLE_SIZE=$(du -h "$EXECUTABLE_NAME" | cut -f1)
    echo ""
    echo "📊 Información del ejecutable:"
    echo "   Tamaño: $EXECUTABLE_SIZE"
    echo "   Ubicación: $(pwd)/$EXECUTABLE_NAME"
    
    # Probar el ejecutable
    echo ""
    echo "🧪 Probando el ejecutable..."
    if ./"$EXECUTABLE_NAME" --version &>/dev/null; then
        echo "✅ Ejecutable funcional"
    else
        echo "⚠️  Advertencia: El ejecutable podría tener problemas"
    fi
    
else
    echo "❌ Error: Falló la creación del ejecutable"
    exit 1
fi

echo ""
echo "🎉 Instalación completada exitosamente!" 
