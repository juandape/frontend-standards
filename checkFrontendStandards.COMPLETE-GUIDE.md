# Frontend Standards Checker - Guía Completa de Configuración

Esta guía contiene todos los ejemplos posibles para configurar reglas personalizadas en **Frontend Standards Checker v4.3.0** - la versión optimizada con reducción masiva de falsos positivos y validaciones inteligentes.

## ✅ Estado Actual - Versión 4.3.0 con Validaciones Optimizadas

El validador ha sido **significativamente optimizado** para reducir falsos positivos y enfocarse en reglas realmente importantes:

### 🎯 **Mejoras Principales v4.3.0:**
- **📉 Reducción de 51.2%** en falsos positivos (de 1083 a 529 violations en proyectos reales)
- **🎚️ Severidades inteligentes** (error/warning/info según impacto real)
- **🧠 Reglas contextuales** que entienden archivos de config, tests y setup
- **⚡ Umbrales optimizados** para funciones complejas y documentación
- **🔄 Compatibilidad mejorada** con Next.js App Router y monorepos

### 📋 **Validaciones Actuales:**
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

## 📦 Instalación Universal

### Con Yarn (Recomendado)

```bash
# Instalación desde GitHub
yarn add frontend-standards-checker@https://github.com/juandape/frontend-standards.git

# Agregar scripts al package.json
{
  "scripts": {
    "lint:standards": "frontend-standards-checker",
    "lint:standards:zones": "frontend-standards-checker --zones",
    "lint:standards:verbose": "frontend-standards-checker --verbose",
    "lint:standards:security": "frontend-standards-checker --security-check",
    "lint:standards:gitflow": "frontend-standards-checker --gitflow-check"
  }
}

# Uso básico
yarn lint:standards .
```

### Con NPM

```bash
# Instalación desde GitHub
npm install frontend-standards-checker@https://github.com/juandape/frontend-standards.git

# Agregar scripts al package.json
{
  "scripts": {
    "lint:standards": "frontend-standards-checker",
    "lint:standards:zones": "frontend-standards-checker --zones",
    "lint:standards:verbose": "frontend-standards-checker --verbose",
    "lint:standards:security": "frontend-standards-checker --security-check",
    "lint:standards:gitflow": "frontend-standards-checker --gitflow-check"
  }
}

# Uso básico
npm run lint:standards .
```

### Ejecución Directa (sin scripts)

```bash
# Con yarn
yarn frontend-standards-checker .

# Con npm
npx frontend-standards-checker .

# Con validaciones específicas
npx frontend-standards-checker . --security-check --gitflow-check
```

## 📋 Tabla de Contenidos

- [Frontend Standards Checker - Guía Completa de Configuración](#frontend-standards-checker---guía-completa-de-configuración)
  - [✅ Estado Actual - Versión 4.3.0 con Validaciones Optimizadas](#-estado-actual---versión-430-con-validaciones-optimizadas)
  - [📦 Instalación Universal](#-instalación-universal)
    - [Con Yarn (Recomendado)](#con-yarn-recomendado)
    - [Con NPM](#con-npm)
    - [Ejecución Directa (sin scripts)](#ejecución-directa-sin-scripts)
  - [📋 Tabla de Contenidos](#-tabla-de-contenidos)
  - [🚀 Nuevas Características v4.3.0](#-nuevas-características-v430)
    - [🏷️ Nomenclatura Completa](#️-nomenclatura-completa)
    - [📐 App Router de Next.js](#-app-router-de-nextjs)
    - [📝 Documentación Obligatoria](#-documentación-obligatoria)
    - [🧪 Pruebas Unitarias](#-pruebas-unitarias)
    - [⚛️ Soporte Multiplataforma](#️-soporte-multiplataforma)
    - [🔒 Validaciones de Seguridad](#-validaciones-de-seguridad)
    - [🌊 GitFlow Completo](#-gitflow-completo)
  - [⚙️ Configuración Rápida con Ejemplos](#️-configuración-rápida-con-ejemplos)
    - [1. Sin configuración (Usar reglas por defecto v4.3.0)](#1-sin-configuración-usar-reglas-por-defecto-v430)
    - [2. Configuración básica (checkFrontendStandards.config.js)](#2-configuración-básica-checkfrontendstandardsconfigjs)
    - [3. Configuración para proyectos grandes (monorepos)](#3-configuración-para-proyectos-grandes-monorepos)
    - [4. Configuración para React/Next.js](#4-configuración-para-reactnextjs)
    - [5. Configuración para React Native](#5-configuración-para-react-native)
    - [6. Configuración de Seguridad Estricta](#6-configuración-de-seguridad-estricta)
  - [📋 Comandos Útiles](#-comandos-útiles)
    - [Configuración Básica](#configuración-básica)
    - [Validar Zonas Específicas](#validar-zonas-específicas)
    - [Opciones Avanzadas del CLI](#opciones-avanzadas-del-cli)
    - [🐛 Comandos de Debug y Troubleshooting](#-comandos-de-debug-y-troubleshooting)
    - [🔍 Ejemplos de Uso del Debug](#-ejemplos-de-uso-del-debug)
  - [💡 Consejos y Mejores Prácticas](#-consejos-y-mejores-prácticas)
    - [Configuración](#configuración)
    - [Uso del CLI](#uso-del-cli)
    - [Integración con el Equipo](#integración-con-el-equipo)
    - [Rendimiento](#rendimiento)
  - [📋 Lista Completa de Verificaciones v4.3.0](#-lista-completa-de-verificaciones-v430)
    - [🏷️ Reglas de Nomenclatura (15 reglas)](#️-reglas-de-nomenclatura-15-reglas)
    - [📐 Reglas de Estructura (8 reglas)](#-reglas-de-estructura-8-reglas)
    - [📝 Reglas de Documentación (5 reglas)](#-reglas-de-documentación-5-reglas)
    - [🧪 Reglas de Pruebas (4 reglas)](#-reglas-de-pruebas-4-reglas)
    - [⚛️ Reglas Next.js/React Native (6 reglas)](#️-reglas-nextjsreact-native-6-reglas)
    - [🔍 Reglas de Calidad (7 reglas)](#-reglas-de-calidad-7-reglas)
    - [🔒 Reglas de Seguridad (8 reglas)](#-reglas-de-seguridad-8-reglas)
    - [🌊 Reglas de GitFlow (6 reglas)](#-reglas-de-gitflow-6-reglas)
    - [📱 Reglas Multiplataforma (4 reglas)](#-reglas-multiplataforma-4-reglas)
    - [📊 Resumen Total v4.3.0](#-resumen-total-v430)
  - [🆘 Ayuda y Solución de Problemas](#-ayuda-y-solución-de-problemas)
    - [Problemas Comunes](#problemas-comunes)
      - [❌ "El validador encuentra demasiados errores"](#-el-validador-encuentra-demasiados-errores)
      - [❌ "Reglas de nomenclatura muy estrictas"](#-reglas-de-nomenclatura-muy-estrictas)
      - [❌ "Falsos positivos en validaciones de seguridad"](#-falsos-positivos-en-validaciones-de-seguridad)
      - [❌ "GitFlow rules failing in feature branches"](#-gitflow-rules-failing-in-feature-branches)
    - [Obtener Ayuda](#obtener-ayuda)
    - [Depuración Avanzada](#depuración-avanzada)
      - [🐛 Modo Debug Completo](#-modo-debug-completo)
      - [🔍 Análisis de Rendimiento](#-análisis-de-rendimiento)
      - [💡 Tips para Resolución de Problemas](#-tips-para-resolución-de-problemas)
    - [Integración CI/CD](#integración-cicd)
      - [GitHub Actions](#github-actions)
      - [Pre-commit Hooks](#pre-commit-hooks)
  - [🎉 Estado Final v4.3.0](#-estado-final-v430)
    - [✅ Validador Completamente Expandido](#-validador-completamente-expandido)
      - [🔧 Nuevas Características Implementadas:](#-nuevas-características-implementadas)
      - [📊 Métricas de Cobertura:](#-métricas-de-cobertura)
      - [🚀 Arquitecturas Soportadas:](#-arquitecturas-soportadas)
      - [🎯 Validación Exhaustiva Funcionando:](#-validación-exhaustiva-funcionando)
    - [🌟 El validador v4.2.0 ahora implementa **TODOS los estándares oficiales del equipo** con precisión máxima, cero falsos positivos y cobertura completa de arquitecturas modernas.](#-el-validador-v420-ahora-implementa-todos-los-estándares-oficiales-del-equipo-con-precisión-máxima-cero-falsos-positivos-y-cobertura-completa-de-arquitecturas-modernas)
    - [📚 Documentación Completa](#-documentación-completa)
    - [🎯 Próximos Pasos Recomendados](#-próximos-pasos-recomendados)

## 🚀 Nuevas Características v4.3.0

### 🎯 **Optimización de Reglas Principales**

#### **JSDoc para Funciones Complejas**
- **Antes v4.2.0:** Aplicaba a funciones de 150-200 caracteres (severidad: warning)
- **Ahora v4.3.0:** Solo funciones realmente complejas de 500+ caracteres (severidad: info)
- **Excluye:** Archivos de config, tests, setup, tailwind, sentry, jest

#### **Tipos de Retorno Explícitos**
- **Antes v4.2.0:** Todas las funciones exportadas (severidad: warning)  
- **Ahora v4.3.0:** Solo APIs públicas críticas (severidad: info)
- **Excluye:** Archivos de configuración, tests y funciones internas

#### **Nomenclatura de Directorios**
- **Antes v4.2.0:** Muy estricta (severidad: error)
- **Ahora v4.3.0:** Inteligente con Next.js (severidad: info)
- **Mejoras:** Soporte completo para route groups `(modules)`, dynamic routes `[id]`, etc.

#### **Missing Test Files**
- **Antes v4.2.0:** Aplicaba a todos los archivos
- **Ahora v4.3.0:** Solo componentes principales, hooks y helpers clave
- **Criterio:** Solo archivos que realmente necesitan tests (no configs, types, constants)

#### **Constants y Helpers Naming**
- **Antes v4.2.0:** Muy estricto (severidad: error)
- **Ahora v4.3.0:** Más flexible (severidad: info)
- **Excluye:** Archivos `index.ts` que son solo re-exportadores

### 📊 **Resultados de Optimización**
```
ANTES v4.2.0:  1083 violations
DESPUÉS v4.3.0: 529 violations
REDUCCIÓN:      -51.2% ✨
```

### 🎚️ **Nueva Jerarquía de Severidades**
- **error:** Rompe el build/deployment (problemas críticos)
- **warning:** Debe arreglarse pronto (mejores prácticas importantes)  
- **info:** Sugerencias de mejora (sin bloquear desarrollo)

## 🎯 **Guía de Severidades v4.3.0**

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
# Ejemplos de reglas INFO (nuevas en v4.3.0):
- JSDoc para funciones muy complejas (500+ chars)
- Tipos de retorno explícitos (solo APIs públicas)
- Directory naming (más flexible con Next.js)
- Missing test files (solo componentes principales)
- Constants/helpers naming (excluye index.ts)
- Focus management en modales
- Documentación TSDoc
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
