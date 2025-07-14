# 📋 Changelog - Frontend Standards Checker

## [v4.9.0] - 2025-07-14

### 🔧 Mejoras de Compatibilidad e Instalación

- **📦 Script de instalación automática mejorado**:

  - Detección automática de yarn/npm en el proyecto
  - Manejo inteligente de conflictos de dependencias
  - Instalación alternativa para proyectos complejos (React Native, monorepos)

- **🎯 Múltiples métodos de instalación**:

  - Método 1: Script automático con curl
  - Método 2: Instalación manual para proyectos con dependencias privadas
  - Método 3: Copia directa para entornos restringidos

- **✅ Compatibilidad mejorada**:

  - React Native con dependencias nativas
  - Yarn PnP (Plug'n'Play)
  - Monorepos con workspaces
  - Proyectos con registries privados

- **📋 Configuración automática**:

  - Scripts agregados automáticamente al package.json
  - Configuración por defecto para React Native
  - Archivo de configuración personalizable

- **🚀 Comandos simplificados para equipos**:
  - `yarn standards` - Validación completa
  - `yarn standards:zones` - Validar zonas específicas
  - `yarn standards:verbose` - Modo detallado
  - `yarn standards:config` - Con configuración personalizada

### 📋 Documentación Actualizada

- Instrucciones de instalación para equipos de desarrollo
- Guía de configuración para React Native
- Ejemplos de instalación para diferentes entornos
- Troubleshooting para problemas comunes

## [v4.8.0] - 2025-07-09

### 🆕 Nuevas Reglas

- **Direct imports for sibling files** - Nueva regla de error que evita posibles dependencias circulares:
  - Detecta cuando archivos hermanos (dentro de la misma carpeta) se importan a través del index.
  - Obliga a importar directamente del archivo original en lugar de usar el index.
  - Proporciona mensajes de error claros que indican cómo corregir el problema.

## [v4.7.0] - 2025-07-11

### 🔒 Rule Severity Updates

- **Reglas elevadas a ERROR**:
  - "No console.log" - Ahora produce errores en lugar de advertencias
  - "No inline styles" - Ahora produce errores en lugar de advertencias
  - Actualizada la documentación para reflejar estas reglas como errores críticos

### 🚀 Default Behavior Change

- **onlyChangedFiles por defecto**:
  - Ahora el validador solo procesa archivos en stage por defecto (`onlyChangedFiles: true`)
  - Se puede desactivar explícitamente en configuración o con `--only-changed-files=false`
  - Mejora significativa de rendimiento en flujos de trabajo habituales
  - Ideal para usar en pre-commit hooks sin configuración adicional

## [v4.6.0] - 2025-07-04

### 🚀 New Feature

- **onlyChangedFiles Configuration**: Nueva opción para validar solo archivos preparados para commit
  - Ahora por defecto solo valida archivos staged en Git
  - Mejora significativa en velocidad de validación en proyectos grandes
  - Detección automática de archivos en commit mediante Git
  - Se puede desactivar con `--only-changed-files=false` o en configuración
  - Ideal para usar en pre-commit hooks

### 🔧 Technical Improvements

- Integración directa con Git para detectar archivos staged
- Optimización del proceso de escaneo para filtrar solo archivos relevantes
- Actualizadas interfaces TypeScript para soportar nuevas opciones
- Actualizada la documentación con ejemplos del nuevo workflow

## [v4.5.1] - 2025-07-01

### 🚀 New Feature

- **onlyZone Configuration**: Nueva opción `onlyZone` en configuración de zonas
  - Permite validar únicamente una zona específica, ignorando todas las demás
  - Soporte para rutas como `auth`, `src/auth`, `app/(auth)`, `packages/ui`, etc.
  - Mejora significativa en workflows donde solo se necesita validar un módulo específico
  - Actualizada documentación con ejemplos de uso y configuración

### 🔧 Technical Improvements

- Agregado `onlyZone` a interfaces `ZoneConfiguration` y `MonorepoZoneConfig`
- Implementada lógica en `detectMonorepoZones` para procesar zona única
- Actualizados ejemplos en `checkFrontendStandards.config.js`
- Mejorada documentación JSDoc con ejemplos de `onlyZone`

## [v4.5.0] - 2025-06-27

### 🐛 Critical Bug Fix

- **INFO Rules Reporting**: Corregido bug crítico donde las reglas con severidad 'info' no aparecían en los reportes
  - Agregado soporte completo para reglas INFO en el reporter
  - Nuevas secciones "DETAILED INFO SUGGESTIONS" y "INFO SUGGESTIONS STATISTICS" en el log
  - Actualizados tipos TypeScript para incluir contadores de INFO
  - Las 15 reglas INFO ahora aparecen correctamente en todos los proyectos

### ✨ Enhancements

- **Reporter Mejorado**:
  - Contadores separados para errores, warnings e info
  - Estadísticas detalladas por tipo de severidad
  - Mejor organización del reporte con secciones claras

### 📚 Documentation

- **Lista de Reglas Actualizada**: Documento `rules-list.md` con formato mejorado y todas las reglas clasificadas correctamente

---

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
