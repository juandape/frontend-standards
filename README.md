# Frontend Standards Checker

Una herramienta escalable y modular para validar estándares de frontend en proyectos JavaScript/TypeScript. **Versión con validadores mejorados, mensajes de error enriquecidos y compatibilidad total para React Native. Visualización de reportes en HTML.**

## 🚀 Características

- **Arquitectura modular**: Cada componente tiene una responsabilidad específica
- **Escalable**: Fácil agregar nuevas reglas y validadores
- **Configurable**: Configuración flexible mediante archivo de configuración
- **CLI amigable**: Interfaz de línea de comandos con opciones detalladas y precedencia de flags
- **Reportes detallados**: Genera reportes comprensivos con secciones para errors, warnings e info
- **Soporte para monorepos**: Detecta y valida múltiples zonas automáticamente
- **🆕 Control granular de archivos**: Flag `--all-files` para validación completa vs `--only-changed-files` para validación incremental
- **🆕 Precedencia de opciones**: Los flags CLI tienen precedencia sobre configuración de archivos
- **🆕 Modo debug avanzado**: Opción `--debug` con información detallada del proceso de escaneo
- **🆕 Validación selectiva**: Opción `onlyZone` para validar solo módulos específicos
- **🆕 Validación eficiente**: Por defecto solo valida archivos en staging para commit (`onlyChangedFiles: true`)
- **🆕 TypeScript nativo**: Tipos estrictos, autocompletado y mejor experiencia de desarrollo
- **🆕 Instalación inteligente**: Detecta React Native y adapta la instalación automáticamente
- **🆕 Validadores avanzados**: Mensajes de error enriquecidos con número de línea, nombre de carpeta y función para reglas clave (ej. coincidencia de nombre de componente)
- **🆕 Mejoras de precisión**: Validación más precisa para componentes, hooks y estructura de carpetas
- **🆕 Comando init**: `frontend-standards-init` para copiar archivos de configuración
- **🆕 Soporte para múltiples entornos**: Configuración automática para diferentes entornos de desarrollo
- **🆕 Soporte para React Native**: Configuración optimizada para proyectos React Native, incluyendo exclusiones de carpetas nativas y reglas específicas
- **🆕 Soporte para Yarn PnP**: Compatible con proyectos que usan Yarn Plug'n'Play
- **🆕 Soporte para dependencias privadas**: Instalación alternativa para proyectos con registries privados
- **🆕 Mejoras de compatibilidad**: Instalación robusta para proyectos con dependencias complejas (React Native, monorepos con dependencias privadas)
- **🆕 Mejoras en la documentación**: Ejemplos y guías actualizadas para facilitar la integración
- **🆕 Nuevas reglas de validación**: Reglas adicionales para mejorar la calidad del código
- **🆕 Generación de reportes**: Carpeta `logs-standards-validations` para almacenar los reportes generados con fecha y hora y último colaborador que modificó el archivo
- **🆕 Visor html**: Herramienta para visualizar los reportes de validación en formato HTML
- **🆕 Exportación a CSV**: Posibilidad de exportar los reportes a formato CSV para análisis externo

## 📦 Instalación Rápida

### Instalación estándar (Recomendado)

```bash
# Con Yarn
yarn add --dev frontend-standards-checker@latest

# Con NPM
npm install --save-dev frontend-standards-checker@latest
```

### Scripts en package.json

```json
{
  "scripts": {
    "standards": "frontend-standards-checker check",
    "standards:zones": "frontend-standards-checker check --zones",
    "standards:verbose": "frontend-standards-checker check --verbose",
    "standards:all": "frontend-standards-checker check --all-files",
    "standards:debug": "frontend-standards-checker check --debug --verbose",
    "standards:init": "frontend-standards-checker init"
  }
}
```

**Nota importante:**

- Instala siempre desde npm usando los comandos anteriores.
- No uses tarballs locales ni referencias workspace para evitar errores de instalación.

⚠️ **Importante:**

Importa únicamente desde el punto de entrada principal (`frontend-standards-checker`) o desde los módulos explícitamente exportados en la sección `exports` de `package.json`.
No importes nunca desde directorios internos como `src/helpers` o `dist/src/helpers`, ya que esto causará errores de importación de directorios no soportados en Node.js ES Modules.
Si necesitas ampliar la funcionalidad, solicita la exportación explícita del módulo requerido.

- El paquete incluye todos los archivos necesarios y es compatible con monorepos, Next.js, Vite y React Native.

### Completa la configuración tras instalar

```bash
# Ejecuta este comando para agregar el script y actualizar .gitignore automáticamente
npx frontend-standards-checker init
# o
yarn frontend-standards-checker init
```

Esto agregará el script `standards` a tu package.json y actualizará .gitignore con los archivos relevantes.

## 🚀 Uso Rápido

### Comandos Principales

```bash
# Validación estándar (solo archivos staged para commit)
yarn standards        # o npm run standards

# Validar zonas específicas (solo archivos staged)
yarn standards:zones  # o npm run standards:zones

# Modo verbose (más detalles, solo archivos staged)
yarn standards:verbose  # o npm run standards:verbose

# Validar TODOS los archivos del proyecto (ignora staging)
yarn standards:all    # o npm run standards:all

# Modo debug con información detallada
yarn standards:debug  # o npm run standards:debug

# Configurar proyecto inicial
yarn standards:init   # o npm run standards:init
```

## 📚 Documentación Completa

**Para configuración avanzada, ejemplos prácticos y troubleshooting:**

👉 **[Ver Guía Completa de Configuración](./checkFrontendStandards.COMPLETE-GUIDE.md)**
👉 **[Ver Guía de Instalación Detallada](./INSTALL-GUIDE.md)**

La guía completa incluye:

- ✅ Instalación paso a paso (npm y yarn)
- ⚙️ Ejemplos de configuración para React, Next.js, monorepos
- 🔧 Configuración avanzada de reglas y zonas
- 🐛 Troubleshooting y comandos de debug
- 📋 Lista completa de validaciones disponibles (60 reglas en total)
- 🆕 Configuración de `onlyChangedFiles` y `onlyZone`
- 🆕 Interacción entre diferentes opciones de configuración
- 🆕 Niveles de severidad actualizados (ERROR/WARNING/INFO)

#### Configuración simplificada archivo checkFrontendStandards.config.js

```javascript
// checkFrontendStandards.config.js - Configuración para React Native
module.exports = {
  zones: { includePackages: false, customZones: ['src'] },
  extensions: ['.js', '.ts', '.jsx', '.tsx'],
  ignorePatterns: ['android', 'ios', 'node_modules'],
  onlyChangedFiles: false, // Validar todos los archivos
  rules: [
    // Reglas personalizadas específicas para React Native
  ]
};
```

### Validación Eficiente con onlyChangedFiles

Por defecto, la herramienta ahora solo valida archivos que están preparados para commit (staged):

```javascript
// checkFrontendStandards.config.js - Este es el comportamiento predeterminado
export default {
  onlyChangedFiles: true, // Por defecto es true
}
```

**Opciones para validar todos los archivos:**

```bash
# Opción 1: Flag CLI (recomendado) - Anula la configuración
frontend-standards-checker check --all-files

# Opción 2: Flag CLI con zona específica
frontend-standards-checker check --all-files --zones src

# Opción 3: Configuración permanente en archivo config
export default {
  onlyChangedFiles: false
}
```

**Precedencia de opciones:**

1. `--all-files` (CLI) - **Mayor precedencia**
2. `--only-changed-files` (CLI)
3. `onlyChangedFiles` (configuración del archivo)
4. Valor por defecto (`true`)

**Ejemplos prácticos:**

```bash
# Solo archivos staged (comportamiento por defecto)
yarn standards

# Todos los archivos (útil para CI/CD o revisión completa)
yarn standards -- --all-files

# Todos los archivos en zona específica
yarn standards -- --all-files --zones src components

# Forzar solo archivos staged aunque config diga false
yarn standards -- --only-changed-files
```

### Reglas Actualizadas a ERROR

Las siguientes reglas ahora son consideradas errores críticos:

- **"No console.log"** - Prohibido el uso de console.log en código de producción
- **"No inline styles"** - Los estilos inline están prohibidos, usar CSS o styled-components

### Validación por Zonas

Valida únicamente una zona específica, ignorando todas las demás:

```javascript
// Validar solo módulo de autenticación
export default {
  zones: { onlyZone: 'auth' }
};
```

```bash
# Validar zonas específicas con todos los archivos
frontend-standards-checker check --all-files --zones apps/frontend packages/ui

# Modo verbose solo con archivos staged
frontend-standards-checker check --verbose

# Saltar validaciones específicas con todos los archivos
frontend-standards-checker check --all-files --skip-structure --skip-naming

# Configuración personalizada con debug
frontend-standards-checker check --config ./my-config.js --debug --verbose

# Combinación de opciones avanzadas
frontend-standards-checker check --all-files --zones src --verbose --debug
```

### Como módulo

```javascript
import { FrontendStandardsChecker } from './src/index.js';

const checker = new FrontendStandardsChecker({
  onlyChangedFiles: true, // Por defecto solo archivos en commit
  zones: ['apps/frontend'],
  verbose: true,
  skipStructure: false
});

const results = await checker.run();
console.log(`Found ${results.totalErrors} violations`);
```

### Comando CLI para configuración

```bash
# Agregar script y actualizar .gitignore
npx frontend-standards-checker init
# o
yarn frontend-standards-checker init
```

Luego puedes usar:

```bash
yarn standards        # o npm run standards
```

## ⚙️ Configuración

Crea un archivo `checkFrontendStandards.config.js` en la raíz de tu proyecto:

```javascript
export default {
  // Reglas personalizadas (se agregan a las predeterminadas)
  rules: [
    {
      name: 'Custom rule',
      check: (content) => content.includes('forbidden-pattern'),
      message: 'This pattern is not allowed'
    }
  ],

  // Configuración de zonas
  zones: {
    includePackages: true,
    customZones: ['libs', 'tools']
  },

  // Extensiones de archivo a validar
  extensions: ['.js', '.ts', '.jsx', '.tsx'],

  // Patrones a ignorar
  ignorePatterns: [
    'build',
    'dist',
    '*.config.js'
  ]
};
```

### Configuración avanzada con función

```javascript
export default function(defaultRules) {
  return {
    rules: [
      // Modificar reglas existentes
      ...defaultRules.filter(rule => rule.name !== 'No console.log'),

      // Agregar reglas personalizadas
      {
        name: 'My custom rule',
        check: (content, filePath) => {
          // Lógica personalizada
          return content.includes('bad-pattern');
        },
        message: 'Custom validation failed'
      }
    ],

    // Configuración adicional
    zones: {
      includePackages: false
    }
  };
}
```

## 🔧 Configuración para React Native

Frontend Standards v4.9.0 incluye configuración optimizada para proyectos React Native:

### Archivo de configuración recomendado

````javascript
```javascript
// checkFrontendStandards.config.js
module.exports = {
  // Configuración específica para React Native
  zones: {
    includePackages: false,
    customZones: ['src'] // Solo validar carpeta src
  },

  // Extensiones de archivo a validar
  extensions: ['.js', '.ts', '.jsx', '.tsx'],

  // Patrones a ignorar específicos para React Native
  ignorePatterns: [
    'android',           // Código nativo Android
    'ios',              // Código nativo iOS
    'build',
    'dist',
    '*.config.js',      // Archivos de configuración
    'metro.config.js',
    'babel.config.js',
    'react-native.config.js',
    '__tests__',
    '.husky',
    '.bundle',
    'node_modules'
  ],

  // Validar todos los archivos por defecto (recomendado para React Native)
  // Alternativamente, usa --all-files en CLI para casos específicos
  onlyChangedFiles: false,

  // Reglas personalizadas para React Native
  rules: [
    {
      name: 'React Native - No console.log in production',
      check: (content, filePath) => {
        // Permitir console.log en archivos de desarrollo/debug
        if (filePath.includes('debug') || filePath.includes('dev')) {
          return false;
        }
        return content.includes('console.log');
      },
      message: 'Avoid console.log in production code. Use a proper logging solution for React Native.',
      level: 'ERROR'
    }
  ]
};
````

**Comandos recomendados para React Native:**

```bash
# Validación completa (todos los archivos)
yarn standards

# Solo validar src/ con todos los archivos
yarn standards -- --zones src

# Validación rápida solo de archivos modificados
yarn standards -- --only-changed-files

# Debug mode para troubleshooting
yarn standards -- --all-files --debug --verbose
```

```

## 🏗️ Arquitectura

El proyecto está estructurado de manera modular:

```

src/
├── index.js # Clase principal y punto de entrada
├── core/
│ ├── config-loader.js # Carga y manejo de configuración
│ ├── project-analyzer.js # Análisis de estructura del proyecto
│ ├── rule-engine.js # Motor de validación de reglas
│ └── reporter.js # Generación de reportes
└── utils/
├── file-scanner.js # Escaneo y filtrado de archivos
└── logger.js # Sistema de logging

```

### Componentes principales

#### FrontendStandardsChecker

La clase principal que orquesta todo el proceso de validación.

#### ConfigLoader

Maneja la carga de configuración desde archivos personalizados y proporciona configuración por defecto.

#### ProjectAnalyzer

Analiza la estructura del proyecto, detecta si es monorepo, identifica zonas y tipos de proyecto.

#### RuleEngine

Motor de validación que ejecuta reglas contra archivos y contenido.

#### Reporter

Genera reportes detallados en múltiples formatos.

#### FileScanner

Utilidad para escanear archivos y directorios con patrones de exclusión.

#### Logger

Sistema de logging consistente con niveles configurables.

## 📝 Reglas por defecto

- **No console.log**: Previene console.log en código de producción
- **No var**: Fuerza uso de let/const en lugar de var
- **No funciones anónimas en callbacks**: Prefiere arrow functions
- **No variables sin usar**: Detecta variables declaradas pero no utilizadas
- **Convención de nombres de interfaces**: Interfaces deben empezar con 'I'
- **Estilos inline**: Prohíbe estilos inline
- **Código comentado**: Detecta código comentado
- **Datos hardcodeados**: Identifica datos hardcodeados
- **Comentarios en funciones complejas**: Requiere documentación en funciones complejas
- **Convenciones de nombres**: Valida naming conventions por tipo de archivo

## 📊 Resumen de Reglas

La herramienta incluye un total de **60 reglas** organizadas por nivel de severidad:

### 🔴 Reglas de Error (25 total)

_Las reglas de error indican problemas críticos que pueden romper el código o impedir la compilación._

- **Naming**: Nomenclatura de componentes, hooks, tipos, helpers, estilos, assets
- **Content/TypeScript**: No var, no any, no alert, no console.log, no estilos inline
- **Accesibilidad**: Botones con nombres accesibles, inputs con labels
- **React**: Key prop en listas, directivas client component

### 🟡 Reglas de Warning (19 total)

_Las reglas de warning señalan mejores prácticas importantes que deberían seguirse._

- **Structure**: Estructura de carpetas, límites de tamaño de componentes
- **React/Performance**: Dependencias de hooks, interfaces para props, evitar React.FC
- **Imports**: Orden de imports, imports absolutos, no imports sin uso

### 🔵 Reglas de Info (16 total)

_Las reglas de info proporcionan sugerencias y optimizaciones opcionales._

- **Documentation**: JSDoc para funciones complejas, comentarios TSDoc
- **TypeScript**: Tipos de retorno explícitos, naming de genéricos
- **Performance**: React.memo para componentes puros, imports específicos
- **Accessibility**: Nombres accesibles para links, manejo de focus, contraste de color

> **👉 Para ver la lista completa de reglas detalladas, revisa [rules-list.md](./rules-list.md)**

## 🎯 Opciones de CLI

```

Options:
-z, --zones <zones...> Zonas específicas a verificar (separadas por espacios)
-c, --config <path> Ruta a archivo de configuración personalizado
-v, --verbose Mostrar salida detallada
--debug Mostrar información de debug sobre escaneo de archivos
--skip-structure Saltar validación de estructura de directorios
--skip-naming Saltar validación de convenciones de nombres
--skip-content Saltar validación de contenido
--only-changed-files Solo verificar archivos preparados para commit (por defecto: true)
--all-files Verificar todos los archivos del proyecto, no solo los staged (anula config)
-h, --help Mostrar ayuda para comandos

````

### Nuevas opciones de CLI

- **`--all-files`**: 🆕 Fuerza la validación de todos los archivos del proyecto, ignorando la configuración `onlyChangedFiles` y sin importar si hay archivos staged o no.
- **`--only-changed-files`**: Fuerza la validación solo de archivos staged para commit.
- **`--debug`**: Muestra información detallada sobre el proceso de escaneo de archivos.

### Ejemplos de uso

```bash
# Validar solo archivos staged (comportamiento por defecto)
frontend-standards-checker check

# Validar TODOS los archivos del proyecto
frontend-standards-checker check --all-files

# Validar todos los archivos en zonas específicas
frontend-standards-checker check --all-files --zones src components

# Modo debug con todos los archivos
frontend-standards-checker check --all-files --debug --verbose

# Solo archivos staged con zonas específicas
frontend-standards-checker check --only-changed-files --zones apps/web
````

## 🔧 Desarrollo

### Agregar nuevas reglas

1. Crea una nueva regla en el `RuleEngine`:

```javascript
// En src/core/rule-engine.js
this.validators.set('my-validator', this.validateMyRule.bind(this));

async validateMyRule(content, filePath) {
  const errors = [];
  // Tu lógica de validación aquí
  return errors;
}
```

2. O agrega reglas a través de configuración:

```javascript
// En checkFrontendStandards.config.js
export default {
  rules: [
    {
      name: 'Mi regla personalizada',
      check: (content, filePath) => {
        // Lógica de validación
        return content.includes('patron-prohibido');
      },
      message: 'Este patrón no está permitido'
    }
  ]
};
```

### Agregar nuevos validadores

Los validadores especializados se pueden agregar en `RuleEngine.initializeValidators()`:

```javascript
initializeValidators() {
  // Validadores existentes...
  this.validators.set('mi-validador', this.validateMiRegla.bind(this));
}
```
