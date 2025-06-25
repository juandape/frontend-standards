# 📋 Changelog - Frontend Standards Checker

## [v2.0.1] - 2025-06-25

### 🔧 Fixes

- **Yarn Installation**: Corregido formato de instalación para Yarn
  - Cambiado de `git+https://` a `package-name@https://` para compatibilidad con Yarn
  - Actualizado script de instalación automática
  - Agregadas instrucciones específicas para troubleshooting

### 📚 Documentation

- **Nueva guía para Yarn**: Archivo `YARN.md` con instrucciones específicas
- **Troubleshooting mejorado**: Agregadas soluciones para errores comunes
- **Ejemplos actualizados**: Comandos correctos para ambos package managers

### 🛠️ Improvements

- **Script de instalación inteligente**: Detecta automáticamente Yarn vs NPM
- **Mejor detección de package manager**: Prioriza basado en lockfiles existentes
- **Comandos específicos**: Ejemplos diferenciados para NPM y Yarn

## [v2.0.0] - 2025-06-24

### 🚀 Major Release

- **Arquitectura modular**: Completamente reescrito con arquitectura modular
- **CLI nativo**: Interfaz de línea de comandos con múltiples opciones
- **Configuración flexible**: Soporte para múltiples formatos de configuración
- **ES Modules**: Migración completa a ES modules

### ✨ Features

- **Zonas personalizadas**: Validación de zonas específicas del proyecto
- **Reportes JSON**: Generación de reportes detallados
- **Modo verbose**: Información detallada durante la ejecución
- **Skip options**: Posibilidad de omitir tipos específicos de validación

### 📖 Documentation

- **Guía completa**: `checkFrontendStandards.COMPLETE-GUIDE.md` con 900+ líneas
- **Guía de instalación**: `INSTALLATION.md` con instrucciones paso a paso
- **Ejemplos por tecnología**: Configuraciones pre-construidas

## [v1.0.0] - 2025-06-20

### 🎉 Initial Release

- **Script monolítico**: Validador básico en un solo archivo
- **Reglas por defecto**: Conjunto básico de reglas de validación
- **Configuración simple**: Archivo de configuración básico

---

### 🔗 Links Importantes

- [Guía de Instalación](./INSTALLATION.md)
- [Guía Completa](./checkFrontendStandards.COMPLETE-GUIDE.md)
- [Guía Yarn](./YARN.md)
- [Ejemplos](./examples/)

### 🆘 Soporte

Si encuentras algún problema:

1. Revisa la [documentación de troubleshooting](./INSTALLATION.md#-soporte)
2. Verifica que estés usando el formato correcto para tu package manager
3. Ejecuta con `--verbose` para obtener más información
4. Abre un issue en GitHub con los detalles del error
