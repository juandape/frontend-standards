# Frontend Standards Checker - Guía Completa de Configuración

Esta guía contiene todos los ejemplos posibles para configurar reglas personalizadas en **Frontend Standards Checker v4.5.1** - la versión optimizada con reducción masiva de falsos positivos, validaciones inteligentes, soporte completo para reglas INFO y nueva funcionalidad `onlyZone`.

## ✅ Estado Actual - Versión 4.5.1 con Nueva Funcionalidad onlyZone

El validador ha sido **significativamente optimizado** para reducir falsos positivos y enfocarse en reglas realmente importantes:

### 🎯 **Mejoras Principales v4.5.1:**

- **🆕 Nueva funcionalidad onlyZone:** Validar únicamente una zona específica, ignorando todas las demás
- **🎯 Validación selectiva:** Soporte para `auth`, `src/auth`, `app/(auth)`, `packages/ui`, etc.
- **⚡ Workflows optimizados:** Ideal para validar solo módulos específicos durante desarrollo
- **🐛 Bug crítico corregido:** Las reglas INFO ahora aparecen correctamente en reportes
- **📉 Reducción de 51.2%** en falsos positivos (de 1083 a 529 violations en proyectos reales)
- **🎚️ Severidades inteligentes** (error/warning/info según impacto real)
- **🧠 Reglas contextuales** que entienden archivos de config, tests y setup
- **⚡ Umbrales optimizados** para funciones complejas y documentación
- **🔄 Compatibilidad mejorada** con Next.js App Router y monorepos
- **📊 Reportes completos** con secciones separadas para errors, warnings e info

### 📋 **Validaciones Actuales v4.5.1:**

- **🆕 Validación por zona única** (`onlyZone` configuration)
- **✅ Nomenclatura inteligente** (componentes, hooks, helpers, constants, types, styles, assets, directorios)
- **✅ App Router de Next.js** (page.tsx, layout.tsx, route groups, dynamic routes)
- **✅ Atomic Design** (validación de estructura atoms/molecules/organisms/templates)
- **✅ Documentación contextual** JSDoc/TSDoc para funciones realmente complejas (500+ chars)
- **✅ Pruebas enfocadas** (solo componentes principales, hooks y helpers clave)
- **✅ Next.js y React Native** optimizado (Tailwind, styled-components, archivos .web/.native)
- **✅ Calidad de código** (no código comentado, no datos hardcodeados, no estilos inline)
- **✅ Seguridad** (no credenciales, variables de entorno, detección de datos sensibles)
- **✅ GitFlow** (nomenclatura de ramas, detección de conflictos, sync branches)
- **✅ Multiplataforma** (separación código web/native, estructura específica React Native)
- **✅ Reglas INFO funcionales** (15 reglas de sugerencias que ahora aparecen en reportes)

## 📦 Instalación Universal

### 🚨 **Pasos de Instalación Obligatorios**

1. **Instalar el paquete** con npm o yarn
2. **Ejecutar inicialización** con `npx frontend-standards-init` (⚠️ **REQUERIDO**)
3. **Configurar scripts** en package.json (opcional)

### Con Yarn (Recomendado)

```bash
# Instalación desde GitHub
yarn add frontend-standards-checker@https://github.com/juandape/frontend-standards.git

# ⚠️ MENSAJE POST-INSTALACIÓN: Verás un mensaje recordándote el siguiente paso

# Copia archivos de configuración a tu proyecto
npx frontend-standards-init

# Agregar scripts al package.json
{
  "scripts": {
    "standards": "frontend-standards-checker",
    "standards:zones": "frontend-standards-checker --zones",
    "standards:verbose": "frontend-standards-checker --verbose",
    "standards:security": "frontend-standards-checker --security-check",
    "standards:gitflow": "frontend-standards-checker --gitflow-check"
  }
}

# Uso básico
yarn standards .
```

### Con NPM

```bash
# Instalación desde GitHub
npm install frontend-standards-checker@https://github.com/juandape/frontend-standards.git

# ⚠️ MENSAJE POST-INSTALACIÓN: Verás un mensaje recordándote el siguiente paso

# Copia archivos de configuración a tu proyecto
npx frontend-standards-init

# Agregar scripts al package.json
{
  "scripts": {
    "standards": "frontend-standards-checker",
    "standards:zones": "frontend-standards-checker --zones",
    "standards:verbose": "frontend-standards-checker --verbose",
    "standards:security": "frontend-standards-checker --security-check",
    "standards:gitflow": "frontend-standards-checker --gitflow-check"
  }
}

# Uso básico
npm run standards .
```

### Ejecución Directa (sin scripts)

```bash
# Con yarn
yarn frontend-standards-checker .

# Con npm
npx frontend-standards-checker .

# 🆕 Inicializar archivos de configuración en proyecto existente
npx frontend-standards-init  # Copia checkFrontendStandards.config.js y guía

# Con validaciones específicas
npx frontend-standards-checker . --security-check --gitflow-check
```

## 📋 Tabla de Contenidos

- [Frontend Standards Checker - Guía Completa de Configuración](#frontend-standards-checker---guía-completa-de-configuración)
  - [✅ Estado Actual - Versión 4.5.1 con Nueva Funcionalidad onlyZone](#-estado-actual---versión-451-con-nueva-funcionalidad-onlyzone)
    - [🎯 **Mejoras Principales v4.5.1:**](#-mejoras-principales-v451)
    - [📋 **Validaciones Actuales v4.5.1:**](#-validaciones-actuales-v451)
  - [📦 Instalación Universal](#-instalación-universal)
    - [🚨 **Pasos de Instalación Obligatorios**](#-pasos-de-instalación-obligatorios)
    - [Con Yarn (Recomendado)](#con-yarn-recomendado)
    - [Con NPM](#con-npm)
    - [Ejecución Directa (sin scripts)](#ejecución-directa-sin-scripts)
  - [📋 Tabla de Contenidos](#-tabla-de-contenidos)
  - [🚀 Nuevas Características v4.5.1](#-nuevas-características-v451)
    - [🆕 **Nueva Funcionalidad: onlyZone**](#-nueva-funcionalidad-onlyzone)
      - [**Validación Selectiva por Zona**](#validación-selectiva-por-zona)
      - [**Ejemplos de uso onlyZone:**](#ejemplos-de-uso-onlyzone)
    - [🎯 **Optimización de Reglas Principales (v4.5.0)**](#-optimización-de-reglas-principales-v450)
      - [**JSDoc para Funciones Complejas**](#jsdoc-para-funciones-complejas)
      - [**Tipos de Retorno Explícitos**](#tipos-de-retorno-explícitos)
      - [**Nomenclatura de Directorios**](#nomenclatura-de-directorios)
      - [**Missing Test Files**](#missing-test-files)
      - [**Constants y Helpers Naming**](#constants-y-helpers-naming)
      - [**🆕 Reglas INFO Funcionales**](#-reglas-info-funcionales)
    - [📊 **Resultados de Optimización**](#-resultados-de-optimización)
    - [🎚️ **Nueva Jerarquía de Severidades**](#️-nueva-jerarquía-de-severidades)
  - [🎯 **Guía de Severidades v4.5.0**](#-guía-de-severidades-v450)
    - [🔴 **ERROR** - Problemas Críticos (Bloquean CI/CD)](#-error---problemas-críticos-bloquean-cicd)
    - [🟡 **WARNING** - Mejores Prácticas Importantes](#-warning---mejores-prácticas-importantes)
    - [🔵 **INFO** - Sugerencias de Mejora (Flexibles)](#-info---sugerencias-de-mejora-flexibles)
    - [💡 **Recomendaciones por Severidad**](#-recomendaciones-por-severidad)
      - [Para **CI/CD Pipeline:**](#para-cicd-pipeline)
      - [Para **Pre-commit Hooks:**](#para-pre-commit-hooks)
      - [Para **Desarrollo Local:**](#para-desarrollo-local)
  - [⚙️ Configuración Rápida con Ejemplos](#️-configuración-rápida-con-ejemplos)
    - [1. Sin configuración (Usar reglas por defecto v4.5.1)](#1-sin-configuración-usar-reglas-por-defecto-v451)
    - [2. 🆕 Configuración con onlyZone (v4.5.1)](#2--configuración-con-onlyzone-v451)
    - [3. Configuración básica (checkFrontendStandards.config.js)](#3-configuración-básica-checkfrontendstandardsconfigjs)
    - [3. Configuración para proyectos grandes (monorepos)](#3-configuración-para-proyectos-grandes-monorepos)
    - [4. Configuración para revisar solo módulos específicos (auth, dashboard, etc.)](#4-configuración-para-revisar-solo-módulos-específicos-auth-dashboard-etc)
  - [📋 Lista Completa de Verificaciones v4.5.0](#-lista-completa-de-verificaciones-v450)
    - [🔴 **Reglas ERROR (21 reglas)**](#-reglas-error-21-reglas)
    - [🟡 **Reglas WARNING (21 reglas)**](#-reglas-warning-21-reglas)
    - [🔵 **Reglas INFO (15 reglas) - 🆕 v4.5.0 Funcionales**](#-reglas-info-15-reglas----v450-funcionales)
    - [📊 Resumen Total v4.5.0](#-resumen-total-v450)
  - [🎉 Estado Final v4.5.1](#-estado-final-v451)
    - [✅ **Nueva Funcionalidad Implementada**](#-nueva-funcionalidad-implementada)
    - [✅ **Corrección Crítica v4.5.0 Mantenida**](#-corrección-crítica-v450-mantenida)
    - [📚 Documentación Completa](#-documentación-completa)
    - [🎯 Próximos Pasos Recomendados](#-próximos-pasos-recomendados)

## 🚀 Nuevas Características v4.5.1

### 🆕 **Nueva Funcionalidad: onlyZone**

#### **Validación Selectiva por Zona**

- **Nueva v4.5.1:** Opción `onlyZone` en configuración de zonas
- **Funcionalidad:** Valida únicamente la zona especificada, ignorando todas las demás
- **Casos de uso:** Validar solo `auth`, `components`, `pages`, módulos específicos en monorepos
- **Configuración:** `zones: { onlyZone: 'auth' }`

#### **Ejemplos de uso onlyZone:**

```javascript
// Solo validar módulo de autenticación
export default {
  zones: { onlyZone: 'auth' }
};

// Solo validar zona específica en monorepo
export default {
  zones: { onlyZone: 'packages/ui/src' }
};

// Solo validar ruta de Next.js App Router
export default {
  zones: { onlyZone: 'app/(dashboard)' }
};
```

### 🎯 **Optimización de Reglas Principales (v4.5.0)**

#### **JSDoc para Funciones Complejas**

- **Antes v4.2.0:** Aplicaba a funciones de 150-200 caracteres (severidad: warning)
- **Ahora v4.5.0:** Solo funciones realmente complejas de 500+ caracteres (severidad: info)
- **Excluye:** Archivos de config, tests, setup, tailwind, sentry, jest

#### **Tipos de Retorno Explícitos**

- **Antes v4.2.0:** Todas las funciones exportadas (severidad: warning)
- **Ahora v4.5.0:** Solo APIs públicas críticas (severidad: info)
- **Excluye:** Archivos de configuración, tests y funciones internas

#### **Nomenclatura de Directorios**

- **Antes v4.2.0:** Muy estricta (severidad: error)
- **Ahora v4.5.0:** Inteligente con Next.js (severidad: info)
- **Mejoras:** Soporte completo para route groups `(modules)`, dynamic routes `[id]`, etc.

#### **Missing Test Files**

- **Antes v4.2.0:** Aplicaba a todos los archivos
- **Ahora v4.5.0:** Solo componentes principales, hooks y helpers clave
- **Criterio:** Solo archivos que realmente necesitan tests (no configs, types, constants)

#### **Constants y Helpers Naming**

- **Antes v4.2.0:** Muy estricto (severidad: error)
- **Ahora v4.5.0:** Más flexible (severidad: info)
- **Excluye:** Archivos `index.ts` que son solo re-exportadores

#### **🆕 Reglas INFO Funcionales**

- **Nueva v4.5.0:** Corrección de bug crítico donde las reglas INFO no aparecían en reportes
- **Mejora:** Secciones "DETAILED INFO SUGGESTIONS" y "INFO SUGGESTIONS STATISTICS"
- **Impacto:** 15 reglas INFO ahora visibles en todos los proyectos

### 📊 **Resultados de Optimización**

```
ANTES v4.2.0:  1083 violations
DESPUÉS v4.5.0: 529 violations
REDUCCIÓN:      -51.2% ✨
NUEVO v4.5.0:   15 reglas INFO ahora visibles 🎉
```

### 🎚️ **Nueva Jerarquía de Severidades**

- **error:** Rompe el build/deployment (problemas críticos)
- **warning:** Debe arreglarse pronto (mejores prácticas importantes)
- **info:** Sugerencias de mejora (sin bloquear desarrollo)

## 🎯 **Guía de Severidades v4.5.0**

### 🔴 **ERROR** - Problemas Críticos (Bloquean CI/CD)

```bash
# Ejemplos de reglas ERROR:
- No var (usar let/const)
- No any type
- Botones sin nombres accesibles
- Inputs sin labels
- Keys faltantes en listas React
- Hook naming (useXxx.hook.ts)
- Component naming (PascalCase)
- Type naming (camelCase.type.ts)
```

### 🟡 **WARNING** - Mejores Prácticas Importantes

```bash
# Ejemplos de reglas WARNING:
- Console.log en código
- Estilos inline
- Funciones inline en JSX props
- Imports desordenados
- React.FC usage
- Interface naming convention
- Dependencias de hooks
```

### 🔵 **INFO** - Sugerencias de Mejora (Flexibles)

```bash
# Ejemplos de reglas INFO (mejoradas en v4.5.0):
- JSDoc para funciones muy complejas (500+ chars)
- Tipos de retorno explícitos (solo APIs públicas)
- Directory naming (más flexible con Next.js)
- Missing test files (solo componentes principales)
- Constants/helpers naming (excluye index.ts)
- Focus management en modales
- Documentación TSDoc
- ⭐ NUEVO: Ahora aparecen en reportes con sección dedicada
```

### 💡 **Recomendaciones por Severidad**

#### Para **CI/CD Pipeline:**

```bash
# Solo fallar build en errores críticos
yarn lint:standards . --fail-on=error
```

#### Para **Pre-commit Hooks:**

```bash
# Verificar errores y warnings
yarn lint:standards . --fail-on=warning
```

#### Para **Desarrollo Local:**

```bash
# Ver todo incluyendo sugerencias info
yarn lint:standards . --verbose
```

## ⚙️ Configuración Rápida con Ejemplos

### 1. Sin configuración (Usar reglas por defecto v4.5.1)

```bash
# Ejecución simple - usa todas las reglas optimizadas v4.5.1
npx frontend-standards-checker .

# Con output detallado (incluye reglas INFO)
npx frontend-standards-checker . --verbose
```

### 2. 🆕 Configuración con onlyZone (v4.5.1)

```javascript
// checkFrontendStandards.config.js - Solo validar zona específica
export default {
  zones: {
    onlyZone: 'auth', // Solo validar módulo de autenticación
    // onlyZone: 'src/components',    // Solo componentes
    // onlyZone: 'app/(dashboard)',   // Next.js App Router
    // onlyZone: 'packages/ui',       // Monorepo específico
  },

  rules: [
    // Reglas específicas para la zona (opcional)
  ]
};
```

### 3. Configuración básica (checkFrontendStandards.config.js)

```javascript
// checkFrontendStandards.config.js
export default {
  // Incluir solo reglas críticas (ERROR y WARNING)
  skipInfo: false, // v4.5.1: false para ver reglas INFO

  zones: {
    excludePatterns: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**'
    ]
  },

  rules: {
    // Personalizar severidades
    'JSDoc for complex functions': 'info', // Era warning en v4.4.2
    'Explicit return types for functions': 'info', // Más flexible
    'Directory naming convention': 'info' // Más permisivo
  }
};
```

### 3. Configuración para proyectos grandes (monorepos)

```javascript
// checkFrontendStandards.config.js
export default {
  zones: {
    customZones: [
      'apps/web/src',
      'apps/mobile/src',
      'packages/ui/src',
      'packages/shared/src'
    ],
    excludePatterns: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**'
    ]
  },

  // v4.5.0: INFO rules ahora aparecen en reportes
  reportLevel: 'all', // error, warning, info

  rules: {
    // Reglas INFO más estrictas para packages compartidos
    'Missing test files': 'warning', // En lugar de info
    'Should have TSDoc comments': 'warning' // Para APIs públicas
  }
};
```

### 4. Configuración para revisar solo módulos específicos (auth, dashboard, etc.)

```javascript
// checkFrontendStandards.config.js - Solo revisar autenticación
export default {
  zones: {
    includePackages: false,
    customZones: [
      'auth',           // Carpeta auth en root
      'src/auth',       // Auth dentro de src
      'app/(auth)',     // Next.js App Router con route groups
      'components/auth' // Componentes de auth
    ]
  },

  rules: {
    // Reglas más estrictas para código de autenticación
    'No console.log': 'error',           // Crítico en auth
    'No credenciales hardcodeadas': 'error',
    'Should have TSDoc comments': 'warning', // Documentar APIs de auth
    'Missing test files': 'warning'          // Tests obligatorios en auth
  }
};
```

```bash
# Ejecutar solo en zona auth
npx frontend-standards-checker . --config checkFrontendStandards.config.js

# O especificar directamente la ruta
npx frontend-standards-checker ./auth
npx frontend-standards-checker ./src/auth
npx frontend-standards-checker ./app/\(auth\)
```

## 📋 Lista Completa de Verificaciones v4.5.0

### 🔴 **Reglas ERROR (21 reglas)**

- Nomenclatura crítica (componentes, hooks, types, helpers, styles, assets)
- Problemas de código críticos (no var, no any, no credenciales)
- Accesibilidad obligatoria (buttons, form inputs)
- React crítico (keys en listas, client directive)

### 🟡 **Reglas WARNING (21 reglas)**

- Estructura y organización (folder structure, component size)
- Mejores prácticas React (hook dependencies, props interface)
- Optimización importante (no console.log, import order)
- Missing index.ts en carpetas de organización

### 🔵 **Reglas INFO (15 reglas) - 🆕 v4.5.0 Funcionales**

- Documentación sugerida (TSDoc, JSDoc complejas)
- Tests recomendados (solo componentes principales)
- Naming flexible (constants, directories)
- Optimizaciones opcionales (React.memo, focus management)

### 📊 Resumen Total v4.5.0

**57 reglas totales:**

- 🔴 21 ERROR (críticas)
- 🟡 21 WARNING (importantes)
- 🔵 15 INFO (sugerencias) ← **NUEVO: Ahora visibles en reportes**

## 🎉 Estado Final v4.5.1

### ✅ **Nueva Funcionalidad Implementada**

**🆕 Nueva v4.5.1:** Configuración `onlyZone` para validación selectiva
**✅ Funcionalidad:** Valida únicamente la zona especificada

**Ejemplo de uso:**

```javascript
export default {
  zones: { onlyZone: 'auth' } // Solo validar módulo auth
};
```

**Casos de uso principales:**

- Desarrollo incremental (validar solo módulo actual)
- Debugging específico (aislar problemas por zona)
- CI/CD selectivo (validar solo cambios específicos)
- Monorepos (validar solo packages específicos)

### ✅ **Corrección Crítica v4.5.0 Mantenida**

**🐛 Bug v4.4.2 y anteriores:** Las reglas INFO no aparecían en reportes
**✅ Fix v4.5.0:** Reglas INFO completamente funcionales

**Nuevas secciones en reportes:**

```
DETAILED INFO SUGGESTIONS:
- Missing test files
- Should have TSDoc comments
- Explicit return types for functions
- Constants naming
- Directory naming convention

INFO SUGGESTIONS STATISTICS:
• Should have TSDoc comments: 3 occurrences (37.5%)
• Missing test files: 1 occurrences (12.5%)
Total info suggestions: 8
```

### 📚 Documentación Completa

- ✅ **Lista de reglas actualizada** (rules-list.md)
- ✅ **Guía completa v4.5.1** (este documento)
- ✅ **Changelog detallado** (CHANGELOG.md)
- ✅ **Nueva funcionalidad onlyZone documentada**
- ✅ **Bug crítico documentado y corregido**

### 🎯 Próximos Pasos Recomendados

1. **Actualizar a v4.5.1** para obtener la nueva funcionalidad `onlyZone`
2. **Usar validación selectiva** con `onlyZone` para módulos específicos
3. **Revisar reportes** - incluyen las 15 reglas INFO funcionales desde v4.5.0
4. **Ajustar severidades** según necesidades del proyecto
5. **Documentar** las nuevas configuraciones de zona en guidelines del equipo

---

> **💡 v4.5.1:** Nueva funcionalidad `onlyZone` permite validar únicamente zonas específicas como `auth`, `components`, `packages/ui`, etc. Ideal para desarrollo incremental y debugging específico.

> **💡 v4.5.0:** Las reglas INFO ahora aparecen correctamente en todos los reportes. Este fue un bug crítico presente desde v4.0.0 que afectaba la visibilidad de 15 reglas importantes de sugerencias y optimizaciones.
