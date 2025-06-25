# Frontend Standards Checker - Guía Completa de Configuración

Esta guía contiene todos los ejemplos posibles para configurar reglas personalizadas en **Frontend Standards Checker v2.0** - la nueva versión modular y escalable.

## 📋 Tabla de Contenidos

- [Frontend Standards Checker - Guía Completa de Configuración](#frontend-standards-checker---guía-completa-de-configuración)
  - [📋 Tabla de Contenidos](#-tabla-de-contenidos)
  - [� Instalación y Configuración](#-instalación-y-configuración)
    - [🚀 Instalación Rápida](#-instalación-rápida)
    - [⚙️ Configuración del Proyecto](#️-configuración-del-proyecto)
    - [🔧 Uso en el Proyecto](#-uso-en-el-proyecto)
    - [🏢 Configuración para Equipos](#-configuración-para-equipos)
    - [🔗 Integración con CI/CD](#-integración-con-cicd)
    - [🔄 Integración con Git Hooks](#-integración-con-git-hooks)
    - [📋 Configuraciones Predefinidas por Tipo de Proyecto](#-configuraciones-predefinidas-por-tipo-de-proyecto)
    - [🛠️ Configuración Avanzada para Monorepos](#️-configuración-avanzada-para-monorepos)
    - [📚 Documentación para el Equipo](#-documentación-para-el-equipo)
    - [⚡ Troubleshooting Común](#-troubleshooting-común)
  - [�🚀 Instrucciones de Uso](#-instrucciones-de-uso)
  - [🏗️ Arquitectura Modular v2.0](#️-arquitectura-modular-v20)
    - [Estructura del Proyecto](#estructura-del-proyecto)
    - [CLI y Comandos Disponibles](#cli-y-comandos-disponibles)
    - [Carga de Configuración](#carga-de-configuración)
    - [Migración desde v1.0](#migración-desde-v10)
  - [📁 Configuración de Zonas](#-configuración-de-zonas)
    - [Incluir zonas packages/](#incluir-zonas-packages)
    - [Agregar zonas personalizadas](#agregar-zonas-personalizadas)
    - [Configuración completa de zonas](#configuración-completa-de-zonas)
  - [Sección 1: Agregar Reglas Simples](#sección-1-agregar-reglas-simples)
  - [Sección 2: Modificar Reglas Existentes](#sección-2-modificar-reglas-existentes)
  - [Sección 3: Reemplazar Completamente las Reglas](#sección-3-reemplazar-completamente-las-reglas)
  - [Sección 4: Reglas Condicionales Avanzadas](#sección-4-reglas-condicionales-avanzadas)
  - [Sección 5: Zonas Personalizadas](#sección-5-zonas-personalizadas)
    - [📋 Zonas Personalizadas Disponibles](#-zonas-personalizadas-disponibles)
  - [Sección 6: Reglas por Tipo de Archivo](#sección-6-reglas-por-tipo-de-archivo)
  - [Sección 7: Arquitectura y Mejores Prácticas](#sección-7-arquitectura-y-mejores-prácticas)
  - [📋 Comandos Útiles](#-comandos-útiles)
    - [Configuración Básica](#configuración-básica)
    - [Validar Zonas Específicas](#validar-zonas-específicas)
    - [Opciones Avanzadas del CLI](#opciones-avanzadas-del-cli)
  - [🎯 Ejemplo Activo para Probar](#-ejemplo-activo-para-probar)
    - [Formatos de Configuración Soportados](#formatos-de-configuración-soportados)
  - [💡 Consejos](#-consejos)
    - [Configuración](#configuración)
    - [Uso del CLI](#uso-del-cli)
    - [Mejores Prácticas](#mejores-prácticas)
  - [📋 Lista Completa de Verificaciones](#-lista-completa-de-verificaciones)
    - [🔍 Reglas de Código Base](#-reglas-de-código-base)
    - [📁 Reglas de Estructura de Archivos](#-reglas-de-estructura-de-archivos)
    - [🏗️ Reglas de Arquitectura](#️-reglas-de-arquitectura)
    - [📝 Reglas de Nomenclatura](#-reglas-de-nomenclatura)
    - [🔧 Reglas de Componentes React](#-reglas-de-componentes-react)
    - [🎨 Reglas de Estilos](#-reglas-de-estilos)
    - [📚 Reglas de Documentación](#-reglas-de-documentación)
    - [⚙️ Reglas de Configuración](#️-reglas-de-configuración)
  - [Resumen de Estadísticas Actuales](#resumen-de-estadísticas-actuales)
  - [Estructura de Directorio Estándar](#estructura-de-directorio-estándar)
  - [🆘 Ayuda y Solución de Problemas](#-ayuda-y-solución-de-problemas)
    - [Problemas Comunes](#problemas-comunes)
    - [Obtener Ayuda](#obtener-ayuda)
    - [Depuración](#depuración)
  - [📦 Instalación y Configuración](#-instalación-y-configuración)
    - [🚀 Instalación Rápida](#-instalación-rápida)
    - [⚙️ Configuración del Proyecto](#-configuración-del-proyecto)
    - [🔧 Uso en el Proyecto](#-uso-en-el-proyecto)
    - [🏢 Configuración para Equipos](#-configuración-para-equipos)
    - [🔗 Integración con CI/CD](#-integración-con-cicd)
    - [🔄 Integración con Git Hooks](#-integración-con-git-hooks)
    - [📋 Configuraciones Predefinidas por Tipo de Proyecto](#-configuraciones-predefinidas-por-tipo-de-proyecto)
    - [🛠️ Configuración Avanzada para Monorepos](#-configuración-avanzada-para-monorepos)
    - [📚 Documentación para el Equipo](#-documentación-para-el-equipo)
    - [⚡ Troubleshooting Común](#-troubleshooting-común)

## 🚀 Instrucciones de Uso

1. Crea un archivo llamado `checkFrontendStandards.config.js`
2. Copia el código de la sección que necesites (solo una a la vez)
3. Modifica las reglas según tus necesidades
4. Ejecuta la herramienta usando `npm start` o `./bin/cli.js`

## 🏗️ Arquitectura Modular v2.0

Frontend Standards Checker v2.0 utiliza una **arquitectura modular** con CLI nativo:

### Estructura del Proyecto

```
frontend-standards/
├── bin/
│   └── cli.js              # Punto de entrada del CLI
├── src/
│   ├── core/              # Lógica central de validación
│   ├── rules/             # Reglas de validación por defecto
│   ├── utils/             # Utilidades auxiliares
│   └── index.js           # Exportación principal
├── checkFrontendStandards.config.js    # Tu configuración personalizada
└── package.json           # Scripts npm configurados
```

### CLI y Comandos Disponibles

La herramienta incluye un CLI nativo con múltiples opciones:

```bash
# Comandos equivalentes para ejecutar
npm start                   # Script npm (recomendado)
npm run cli                 # Script alternativo
./bin/cli.js               # CLI directo

# Flags disponibles
-z, --zones <zones...>     # Zonas específicas a validar (separadas por espacio)
-c, --config <file>        # Archivo de configuración personalizado
-o, --output <file>        # Generar reporte en archivo JSON
-v, --verbose              # Mostrar información detallada
--skip-structure           # Omitir validación de estructura de directorios
--skip-naming              # Omitir validación de convenciones de nomenclatura
--skip-content             # Omitir validación de contenido de archivos
--help                     # Mostrar ayuda
```

### Carga de Configuración

El sistema de configuración es flexible y soporta:

- **Exportación por defecto**: `export default [...]` o `export default {...}`
- **Funciones de configuración**: `export default function(defaultRules) { ... }`
- **Arrays de reglas**: Formato simple `[rule1, rule2, ...]`
- **Objetos de configuración**: Con propiedades `rules`, `zones`, `merge`, etc.

### Migración desde v1.0

Si vienes del script monolítico (`checkFrontendStandards.mjs`):

| Comando Anterior                            | Comando Nuevo                    |
| ------------------------------------------- | -------------------------------- |
| `node checkFrontendStandards.mjs`           | `npm start`                      |
| `node checkFrontendStandards.mjs utils`     | `npm start -- --zones utils`     |
| `node checkFrontendStandards.mjs utils api` | `npm start -- --zones utils api` |

## 📁 Configuración de Zonas

**Por defecto, las zonas `packages/` están excluidas** de la validación. Solo se validan las zonas `apps/` automáticamente.

### Incluir zonas packages/

```javascript
export default {
  zones: {
    includePackages: true, // Incluir validación de packages/
  },
  rules: [
    // Tus reglas personalizadas aquí
  ],
}
```

### Agregar zonas personalizadas

```javascript
export default {
  zones: {
    includePackages: false, // Excluir packages/ (por defecto)
    customZones: ['shared', 'tools', 'libs'], // Zonas adicionales a validar
  },
  rules: [
    // Tus reglas personalizadas aquí
  ],
}
```

### Configuración completa de zonas

```javascript
export default {
  zones: {
    includePackages: true, // Incluir packages/
    customZones: ['shared', 'docs', 'scripts'], // Zonas adicionales
  },
  rules: [
    // Tus reglas personalizadas aquí
  ],
}
```

## Sección 1: Agregar Reglas Simples

**La opción más común** - Para agregar reglas personalizadas a las existentes:

```javascript
export default [
  {
    name: 'No jQuery',
    check: (content) => content.includes('$') || content.includes('jQuery'),
    message: 'jQuery is not allowed. Use modern JavaScript or a framework instead.',
  },
  {
    name: 'No alert',
    check: (content) => /\balert\s*\(/.test(content),
    message: 'The use of alert() is not allowed. Use proper notifications.',
  },
  {
    name: 'Must use async/await',
    check: (content) => /\.then\s*\(/.test(content) && !/async|await/.test(content),
    message: 'Prefer async/await over .then() for better readability.',
  },
  {
    name: 'No hardcoded URLs',
    check: (content) => /https?:\/\/[^\s"']+/.test(content),
    message: 'No hardcoded URLs allowed. Use environment variables or constants.',
  },
]
```

## Sección 2: Modificar Reglas Existentes

Para modificar reglas existentes y agregar nuevas usando una función:

```javascript
export default function (defaultRules) {
  // Agregar nuevas reglas
  const customRules = [
    {
      name: 'No hardcoded URLs',
      check: (content) => /https?:\/\/[^\s"']+/.test(content),
      message: 'No hardcoded URLs allowed. Use environment variables or constants.',
    },
  ]

  // Modificar una regla existente
  const modifiedRules = defaultRules.map((rule) => {
    if (rule.name === 'No console.log') {
      return {
        ...rule,
        message: 'No console.log allowed in production. Use proper logging.',
        check: (content) => /console\.(log|warn|error|info)/.test(content),
      }
    }
    return rule
  })

  return [...modifiedRules, ...customRules]
}
```

## Sección 3: Reemplazar Completamente las Reglas

Para usar solo tus reglas personalizadas:

```javascript
export default {
  merge: false, // Si es false, reemplaza completamente las reglas por defecto
  rules: [
    {
      name: 'Custom TypeScript rule',
      check: (content) => {
        // Regla más compleja que analiza múltiples patrones
        const hasAny = /:\s*any\b/.test(content)
        const hasUnknown = /:\s*unknown\b/.test(content)
        return hasAny && !hasUnknown
      },
      message: 'Prefer "unknown" over "any" for better type safety.',
    },
    {
      name: 'React functional components only',
      check: (content) => {
        // Solo en archivos .tsx
        if (!content.includes('React') && !content.includes('jsx')) return false
        return /class\s+\w+\s+extends\s+(React\.)?Component/.test(content)
      },
      message: 'Use functional components instead of class components.',
    },
    {
      name: 'Proper import organization',
      check: (content) => {
        const lines = content.split('\n')
        let foundNonImport = false
        for (const line of lines) {
          if (line.trim() === '') continue
          if (line.startsWith('import ')) {
            if (foundNonImport) return true // Import después de código
          } else if (line.trim()) {
            foundNonImport = true
          }
        }
        return false
      },
      message: 'All imports must be at the top of the file.',
    },
  ],
}
```

## Sección 4: Reglas Condicionales Avanzadas

Para reglas que se aplican solo en ciertos archivos:

```javascript
export default function (defaultRules) {
  return [
    ...defaultRules,
    {
      name: 'React hooks rules',
      check: (content, filePath) => {
        // Solo aplicar en archivos de hooks
        if (!filePath.includes('.hook.')) return false

        // Verificar que los hooks de React estén en la parte superior
        const lines = content.split('\n')
        let foundUseEffect = false
        let foundOtherCode = false

        for (const line of lines) {
          if (/use(State|Effect|Context|Memo|Callback)/.test(line)) {
            if (foundOtherCode) return true
            foundUseEffect = true
          } else if (line.trim() && !line.startsWith('import') && !line.startsWith('//')) {
            foundOtherCode = true
          }
        }
        return false
      },
      message: 'React hooks must be declared at the top of the component/hook.',
    },
    {
      name: 'Test file conventions',
      check: (content, filePath) => {
        if (!filePath.includes('.test.') && !filePath.includes('.spec.')) return false

        // Los archivos de test deben tener describe() y it()
        return !(/describe\s*\(/.test(content) && /it\s*\(/.test(content))
      },
      message: 'Test files must use describe() and it() blocks.',
    },
  ]
}
```

## Sección 5: Zonas Personalizadas

Para agregar validaciones para zonas personalizadas específicas:

```javascript
export default [
  // ---------------------------------------------------------------
  // ZONA: UTILS - Archivos de utilidades
  // ---------------------------------------------------------------
  {
    name: 'Custom zone structure - utils',
    check: (content, filePath) => {
      // Solo aplicar en la zona 'utils'
      if (!filePath.includes('/utils/')) return false

      // Validar que los archivos en utils sigan un patrón específico
      const fileName = filePath.split('/').pop()
      if (!fileName.endsWith('.util.ts')) {
        return true // Error: no sigue el patrón
      }
      return false
    },
    message: 'Files in utils/ directory must end with .util.ts',
  },
  {
    name: 'Custom naming - utils',
    check: (content, filePath) => {
      const pathParts = filePath.split('/')
      const fileName = pathParts.pop()
      const parentDir = pathParts.pop()

      if (parentDir === 'utils') {
        // Validar nomenclatura: debe ser camelCase.util.ts
        if (!/^[a-z][a-zA-Z0-9]*\.util\.ts$/.test(fileName)) {
          return true
        }
      }
      return false
    },
    message: 'Files in utils/ must be camelCase and end with .util.ts',
  },

  // ---------------------------------------------------------------
  // ZONA: VALIDATORS - Archivos de validación
  // ---------------------------------------------------------------
  {
    name: 'Custom zone structure - validators',
    check: (content, filePath) => {
      if (!filePath.includes('/validators/')) return false

      const fileName = filePath.split('/').pop()
      // Los validadores deben seguir el patrón name.validator.ts
      if (!fileName.endsWith('.validator.ts')) {
        return true
      }

      // Y deben exportar una función validate
      if (!content.includes('export') || !content.includes('validate')) {
        return true
      }

      return false
    },
    message: 'Files in validators/ must end with .validator.ts and export a validate function',
  },

  // ---------------------------------------------------------------
  // ZONA: API ROUTES - Rutas de API
  // ---------------------------------------------------------------
  {
    name: 'Custom zone - API routes',
    check: (content, filePath) => {
      // Para una zona de rutas API
      if (!filePath.includes('/api/routes/')) return false

      const fileName = filePath.split('/').pop()

      // Las rutas deben seguir el patrón name.route.ts
      if (!fileName.endsWith('.route.ts')) {
        return true
      }

      // Deben exportar un router
      if (!content.includes('export') || !content.includes('router')) {
        return true
      }

      return false
    },
    message: 'API route files must end with .route.ts and export a router',
  },

  // ---------------------------------------------------------------
  // ZONA: MIDDLEWARE - Middleware de aplicación
  // ---------------------------------------------------------------
  {
    name: 'Custom zone - Middleware',
    check: (content, filePath) => {
      if (!filePath.includes('/middleware/')) return false

      const fileName = filePath.split('/').pop()

      // Middleware debe seguir el patrón name.middleware.ts
      if (!fileName.endsWith('.middleware.ts')) {
        return true
      }

      // Debe exportar una función middleware
      if (
        !content.includes('export') ||
        (!content.includes('middleware') && !content.includes('function'))
      ) {
        return true
      }

      return false
    },
    message: 'Middleware files must end with .middleware.ts and export a middleware function',
  },

  // ---------------------------------------------------------------
  // ZONA: MODELS - Modelos de base de datos
  // ---------------------------------------------------------------
  {
    name: 'Custom zone - Database models',
    check: (content, filePath) => {
      if (!filePath.includes('/models/')) return false

      const fileName = filePath.split('/').pop()

      // Los modelos deben seguir el patrón Name.model.ts (PascalCase)
      if (!/^[A-Z][a-zA-Z0-9]*\.model\.ts$/.test(fileName)) {
        return true
      }

      // Deben exportar una clase o interface
      if (
        !content.includes('export') ||
        (!content.includes('class') && !content.includes('interface'))
      ) {
        return true
      }

      return false
    },
    message: 'Model files must be PascalCase, end with .model.ts, and export a class or interface',
  },

  // ---------------------------------------------------------------
  // ZONA: CONFIG - Archivos de configuración
  // ---------------------------------------------------------------
  {
    name: 'Custom zone - Config files',
    check: (content, filePath) => {
      if (!filePath.includes('/config/')) return false

      const fileName = filePath.split('/').pop()

      // Los archivos de configuración deben seguir el patrón name.config.ts
      if (!fileName.endsWith('.config.ts')) {
        return true
      }

      // Deben exportar un objeto de configuración
      if (!content.includes('export') || !content.includes('config')) {
        return true
      }

      return false
    },
    message: 'Config files must end with .config.ts and export a config object',
  },

  // ---------------------------------------------------------------
  // ZONA: SERVICES - Servicios de aplicación
  // ---------------------------------------------------------------
  {
    name: 'Custom naming - services',
    check: (content, filePath) => {
      const pathParts = filePath.split('/')
      const fileName = pathParts.pop()
      const parentDir = pathParts.pop()

      if (parentDir === 'services') {
        // Servicios deben ser PascalCase.service.ts
        if (!/^[A-Z][a-zA-Z0-9]*\.service\.ts$/.test(fileName)) {
          return true
        }
      }
      return false
    },
    message: 'Files in services/ must be PascalCase and end with .service.ts',
  },

  // ---------------------------------------------------------------
  // ZONA: FEATURES - Estructura completa de features
  // ---------------------------------------------------------------
  {
    name: 'Custom zone complete structure',
    check: (content, filePath) => {
      // Validar que la zona 'features' tenga la estructura correcta
      if (!filePath.includes('/features/')) return false

      const pathParts = filePath.split('/')
      const featuresIndex = pathParts.indexOf('features')

      if (featuresIndex >= 0 && pathParts.length > featuresIndex + 1) {
        const featureName = pathParts[featuresIndex + 1]
        const requiredDirs = ['components', 'hooks', 'services', 'types']

        // Verificar que la feature tenga los directorios requeridos
        // (Esta es una validación simplificada, en un caso real necesitarías
        // verificar la existencia de los directorios)
        const currentDir = pathParts[featuresIndex + 2]

        if (!requiredDirs.includes(currentDir)) {
          return true
        }
      }

      return false
    },
    message: 'Features must have components, hooks, services, and types directories',
  },

  // ---------------------------------------------------------------
  // ZONA: RESTRICCIONES POR CAPAS DE ARQUITECTURA
  // ---------------------------------------------------------------
  {
    name: 'API layer restrictions',
    check: (content, filePath) => {
      // Solo en archivos de servicios/API
      if (!filePath.includes('/services/') && !filePath.includes('/api/')) return false

      // No permitir imports de componentes UI en la capa de API
      return /import.*from.*['"](\.\.\/)*components/.test(content)
    },
    message: 'API/Service layer should not import UI components.',
  },
]
```

### 📋 Zonas Personalizadas Disponibles

| Zona           | Patrón de Archivo    | Requisitos                          |
| -------------- | -------------------- | ----------------------------------- |
| **Utils**      | `name.util.ts`       | camelCase                           |
| **Validators** | `name.validator.ts`  | Export función `validate`           |
| **API Routes** | `name.route.ts`      | Export `router`                     |
| **Middleware** | `name.middleware.ts` | Export función middleware           |
| **Models**     | `Name.model.ts`      | PascalCase + export class/interface |
| **Config**     | `name.config.ts`     | Export objeto config                |
| **Services**   | `Name.service.ts`    | PascalCase                          |
| **Features**   | Estructura completa  | Subdirectorios requeridos           |

## Sección 6: Reglas por Tipo de Archivo

Ejemplos para tipos específicos de archivos:

```javascript
export default [
  {
    name: 'React component structure',
    check: (content, filePath) => {
      if (!filePath.endsWith('.tsx') || !content.includes('export')) return false

      // Los componentes React deben tener PropTypes o TypeScript interfaces
      if (
        !content.includes('interface') &&
        !content.includes('type') &&
        !content.includes('PropTypes')
      ) {
        return true
      }

      return false
    },
    message: 'React components must define prop types using TypeScript interfaces or PropTypes.',
  },
  {
    name: 'Custom hook return types',
    check: (content, filePath) => {
      if (!filePath.includes('.hook.')) return false

      // Los hooks personalizados deben tener tipo de retorno explícito
      const hookExport = /export\s+const\s+use[A-Z]\w*\s*=/.test(content)
      const hasReturnType = /:\s*\w+/.test(content)

      if (hookExport && !hasReturnType) {
        return true
      }

      return false
    },
    message: 'Custom hooks must have explicit return types.',
  },
  {
    name: 'Styled components naming',
    check: (content, filePath) => {
      if (!content.includes('styled') && !content.includes('css`')) return false

      // Los styled components deben seguir nomenclatura específica
      const styledComponents = content.match(/const\s+(\w+)\s*=\s*styled/g)
      if (styledComponents) {
        return styledComponents.some((comp) => {
          const name = comp.match(/const\s+(\w+)/)[1]
          return !/^[A-Z]\w*(?:Container|Wrapper|Box|Text|Button|Input)$/.test(name)
        })
      }

      return false
    },
    message:
      'Styled components must be PascalCase and end with descriptive suffixes (Container, Wrapper, etc.).',
  },
]
```

## Sección 7: Arquitectura y Mejores Prácticas

Reglas avanzadas para mantener buena arquitectura:

```javascript
export default [
  {
    name: 'No circular dependencies',
    check: (content, filePath) => {
      // Detectar posibles dependencias circulares
      const imports = content.match(/import.*from\s+['"]([^'"]+)['"]/g) || []
      const currentDir = filePath.split('/').slice(0, -1).join('/')

      return imports.some((imp) => {
        const importPath = imp.match(/from\s+['"]([^'"]+)['"]/)[1]
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
          // Check if import path leads back to current directory
          // Esta es una validación simplificada
          return importPath.includes(currentDir.split('/').pop())
        }
        return false
      })
    },
    message: 'Potential circular dependency detected. Review import structure.',
  },
  {
    name: 'Component size limit',
    check: (content, filePath) => {
      if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx')) return false

      const lines = content.split('\n').length
      return lines > 200 // Componentes no deben tener más de 200 líneas
    },
    message: 'Component is too large (>200 lines). Consider breaking it into smaller components.',
  },
  {
    name: 'Hook dependency rules',
    check: (content, filePath) => {
      if (!filePath.includes('.hook.')) return false

      // Los hooks no deben tener muchas dependencias externas
      const imports = content.match(/import.*from/g) || []
      return imports.length > 10
    },
    message: 'Hook has too many dependencies. Consider simplifying or breaking it down.',
  },
  {
    name: 'Barrel export validation',
    check: (content, filePath) => {
      if (!filePath.endsWith('index.ts') && !filePath.endsWith('index.tsx')) return false

      // Los archivos index deben solo tener exports
      const lines = content.split('\n').filter((line) => line.trim())
      const nonExportLines = lines.filter(
        (line) =>
          !line.startsWith('export') &&
          !line.startsWith('//') &&
          !line.startsWith('/*') &&
          line.trim() !== ''
      )

      return nonExportLines.length > 0
    },
    message: 'Index files should only contain export statements (barrel exports).',
  },
]
```

## 📋 Comandos Útiles

### Configuración Básica

```bash
# Ejecutar con configuración personalizada
npm start

# O usando el CLI directamente
./bin/cli.js

# O usando npm run
npm run cli
```

### Validar Zonas Específicas

```bash
# Validar una zona específica
npm start -- --zones utils
npm start -- --zones api
npm start -- --zones features/auth

# Usando el CLI directamente
./bin/cli.js --zones utils
./bin/cli.js --zones api
./bin/cli.js --zones features/auth

# Validar múltiples zonas (separadas por espacio)
npm start -- --zones utils api middleware
./bin/cli.js --zones utils api middleware

# Validar todo el proyecto (por defecto)
npm start
./bin/cli.js
```

### Opciones Avanzadas del CLI

```bash
# Usar archivo de configuración personalizado
npm start -- --config mi-config.js
./bin/cli.js --config mi-config.js

# Generar reporte en archivo JSON
npm start -- --output reporte.json
./bin/cli.js --output reporte.json

# Modo verbose para ver más detalles
npm start -- --verbose
./bin/cli.js --verbose

# Omitir tipos específicos de validación
npm start -- --skip-structure --skip-naming
./bin/cli.js --skip-content --verbose

# Combinar opciones
npm start -- --zones api utils --config custom.config.js --verbose
./bin/cli.js --zones api utils --config custom.config.js --output results.json
```

## 🎯 Ejemplo Activo para Probar

```javascript
// Copia este código en checkFrontendStandards.config.js para empezar a probar
// IMPORTANTE: Usa 'export default' (ES modules)

export default [
  {
    name: 'No console statements',
    check: (content) => /console\.(log|warn|error|info|debug)/.test(content),
    message: 'Remove console statements before committing to production.',
  },
]
```

### Formatos de Configuración Soportados

```javascript
// 1. Array simple de reglas (más común)
export default [
  { name: 'rule1', check: (content) => false, message: 'msg' },
  { name: 'rule2', check: (content) => false, message: 'msg' },
]

// 2. Objeto con configuración completa
export default {
  zones: { includePackages: true, customZones: ['shared'] },
  merge: true, // Combinar con reglas por defecto
  rules: [
    { name: 'rule1', check: (content) => false, message: 'msg' },
  ],
}

// 3. Función para modificar reglas existentes
export default function(defaultRules) {
  return [...defaultRules, newRule]
}
```

## 💡 Consejos

### Configuración

1. **Empieza simple** - Usa la Sección 1 para agregar reglas básicas
2. **Una sección a la vez** - No mezcles diferentes tipos de configuración
3. **Usa export default** - Asegúrate de exportar tu configuración con `export default`
4. **Prueba gradualmente** - Agrega reglas de una en una para verificar que funcionan

### Uso del CLI

5. **Usa npm start** - Es la forma más simple y recomendada de ejecutar la herramienta
6. **Aprovecha las opciones** - Usa `--zones` para validar solo partes específicas del proyecto
7. **Modo verbose** - Usa `--verbose` para obtener información detallada durante el desarrollo

### Mejores Prácticas

8. **Personaliza los mensajes** - Haz que los mensajes sean claros y útiles para tu equipo
9. **Documenta tus reglas** - Agrega comentarios explicando por qué cada regla es importante
10. **Genera reportes** - Usa `--output` para crear reportes JSON y hacer seguimiento del progreso

¡Con esta guía puedes crear cualquier tipo de validación personalizada que necesites para tu proyecto!

## 📋 Lista Completa de Verificaciones

Esta sección contiene **todas las verificaciones que la herramienta realiza actualmente**. Estas son las reglas por defecto que se ejecutan cuando corres `npm start` o `./bin/cli.js`.

### 🔍 Reglas de Código Base

| Regla                                   | Descripción                                                                                 | Severidad |
| --------------------------------------- | ------------------------------------------------------------------------------------------- | --------- |
| **No console.log**                      | No se permite el uso de `console.log` en código de producción                               | ⚠️ Error  |
| **No var**                              | Evitar usar `var`, utilizar `let` o `const`                                                 | ⚠️ Error  |
| **No anonymous functions in callbacks** | Preferir arrow functions o funciones nombradas en callbacks                                 | ⚠️ Error  |
| **No unused variables**                 | No debe haber variables declaradas pero no utilizadas (@typescript-eslint/no-unused-vars)   | ⚠️ Error  |
| **No variable shadowing**               | No debe haber sombreado de variables (@typescript-eslint/no-shadow)                         | ⚠️ Error  |
| **No unnecessary constructors**         | No debe haber constructores vacíos innecesarios (@typescript-eslint/no-useless-constructor) | ⚠️ Error  |
| **No inline styles**                    | No usar estilos inline, utilizar archivos de estilo separados                               | ⚠️ Error  |
| **No hardcoded data**                   | No tener datos hardcodeados (URLs, textos, configuraciones)                                 | ⚠️ Error  |

### 📁 Reglas de Estructura de Archivos

| Regla                   | Descripción                                     | Patrón Esperado              |
| ----------------------- | ----------------------------------------------- | ---------------------------- |
| **Folder structure**    | Validar estructura mínima de zonas por tipo     | Según `DEFAULT_STRUCTURE`    |
| **Src structure**       | Validar estructura dentro de `/src/`            | Según `SRC_STRUCTURE`        |
| **Tree structure**      | Validar árbol de carpetas ideal                 | Según `IDEAL_TREE`           |
| **Directory naming**    | Directorios deben seguir camelCase o PascalCase | `camelCase` o `PascalCase`   |
| **Component structure** | Componentes deben tener estructura específica   | `index.tsx` + subdirectorios |

### 🏗️ Reglas de Arquitectura

| Regla                     | Descripción                                              | Aplicación                             |
| ------------------------- | -------------------------------------------------------- | -------------------------------------- |
| **Enum outside of types** | Los enums deben estar en directorios `/types/`           | Archivos `.enum.ts`                    |
| **Hook file extension**   | Hooks deben usar extensión correcta (.ts/.tsx)           | Según contenido JSX                    |
| **Asset naming**          | Assets deben seguir kebab-case                           | `service-error.svg`                    |
| **Component hook naming** | Hooks de componentes deben usar extensión correcta       | `.ts` si no hay JSX, `.tsx` si hay JSX |
| **Function naming**       | Funciones deben seguir camelCase                         | `getUserData`, `handleClick`           |
| **Interface naming**      | Interfaces exportadas deben empezar con 'I' + PascalCase | `IButtonProps`, `IUserData`            |

### 📝 Reglas de Nomenclatura

| Tipo de Archivo | Patrón Requerido                | Ejemplo                    | Ubicación      |
| --------------- | ------------------------------- | -------------------------- | -------------- |
| **Componentes** | PascalCase + .tsx               | `UserProfile.tsx`          | `/components/` |
| **Hooks**       | use + PascalCase + .hook.ts/tsx | `useUserData.hook.ts`      | `/hooks/`      |
| **Constantes**  | camelCase + .constant.ts        | `apiEndpoints.constant.ts` | `/constants/`  |
| **Helpers**     | camelCase + .helper.ts          | `formatDate.helper.ts`     | `/helpers/`    |
| **Types**       | camelCase + .type.ts            | `userProfile.type.ts`      | `/types/`      |
| **Estilos**     | camelCase + .style.ts           | `userCard.style.ts`        | `/styles/`     |
| **Enums**       | camelCase + .enum.ts            | `userStatus.enum.ts`       | `/enums/`      |
| **Assets**      | kebab-case                      | `user-avatar.png`          | `/assets/`     |

### 🔧 Reglas de Componentes React

| Regla                      | Descripción                                              | Detalles                               |
| -------------------------- | -------------------------------------------------------- | -------------------------------------- |
| **Component type naming**  | Archivos de tipos deben terminar en `.type.ts`           | NO `.types.ts`                         |
| **Component style naming** | Archivos de estilos deben terminar en `.style.ts`        | En directorio `/styles/`               |
| **Component hook naming**  | Hooks deben usar extensión correcta según contenido      | `.ts` si no hay JSX, `.tsx` si hay JSX |
| **Function naming**        | Funciones deben seguir camelCase                         | `getUserData`, `handleClick`           |
| **Interface naming**       | Interfaces exportadas deben empezar con 'I' + PascalCase | `IButtonProps`, `IUserData`            |

### 🎨 Reglas de Estilos

| Regla                     | Descripción                                      | Ejemplo                       |
| ------------------------- | ------------------------------------------------ | ----------------------------- |
| **Style naming**          | Objetos de estilo deben terminar en 'Styles'     | `cardPreviewStyles`           |
| **Style property naming** | Propiedades de estilo deben ser camelCase        | `backgroundColor`, `fontSize` |
| **Style file naming**     | Archivos de estilo deben terminar en `.style.ts` | `userCard.style.ts`           |

### 📚 Reglas de Documentación

| Regla                                   | Descripción                                                    | Aplicación                    |
| --------------------------------------- | -------------------------------------------------------------- | ----------------------------- |
| **Should have TSDoc comments**          | Funciones y clases exportadas deben tener comentarios TSDoc    | Funciones/clases complejas    |
| **Missing comment in complex function** | Funciones complejas deben tener comentarios explicativos       | Complejidad > umbral definido |
| **Commented code**                      | No debe haber código comentado (código real, no explicaciones) | Detección inteligente         |

### ⚙️ Reglas de Configuración

| Regla                  | Descripción                                                   | Archivos           |
| ---------------------- | ------------------------------------------------------------- | ------------------ |
| **Naming**             | Validación general de nomenclatura según tipo de archivo      | Todos los archivos |
| **Standard structure** | _(Nueva)_ Validar estructura según `estructura standards.txt` | Todo el proyecto   |

## Resumen de Estadísticas Actuales

Basado en la última ejecución del script:

- **Total de errores encontrados**: 83
- **Zonas validadas**: apps/auth, apps/configuration, apps/personalization, apps/web
- **Regla más común**: Component type naming (33.7% de errores)
- **Top 5 problemas**:
  1. Component type naming: 28 ocurrencias
  2. Naming: 24 ocurrencias
  3. Missing comment in complex function: 15 ocurrencias
  4. Component structure: 7 ocurrencias
  5. Should have TSDoc comments: 4 ocurrencias

## Estructura de Directorio Estándar

La herramienta valida contra esta estructura estándar definida en `estructura standards.txt`:

```
src/
├── assets/
├── components/
│   ├── SpecificComponent/
│   │   ├── __test__/
│   │   ├── hooks/
│   │   ├── constants/
│   │   ├── components/
│   │   ├── enums/
│   │   ├── types/
│   │   ├── styles/
│   │   └── index.tsx
│   └── index.ts
├── constants/
│   ├── specificConstant.constant.ts
│   └── index.ts
├── modules/
├── helpers/
├── hooks/
├── providers/
├── styles/
└── store/
    ├── reducers/
    ├── types/
    ├── state.selector.ts
    ├── state.interface.ts
    └── store
```

## 🆘 Ayuda y Solución de Problemas

### Problemas Comunes

**Error: "Cannot resolve configuration file"**

- Asegúrate de que `checkFrontendStandards.config.js` existe en la raíz del proyecto
- Verifica que uses `export default` en tu configuración

**Error: "Zones not found"**

- Comprueba que las zonas especificadas existen en tu proyecto
- Las zonas deben ser carpetas dentro de tu directorio de trabajo

**Error: "Invalid rule configuration"**

- Cada regla debe tener las propiedades: `name`, `check`, y `message`
- La función `check` debe retornar un booleano

### Obtener Ayuda

```bash
# Ver todas las opciones disponibles
./bin/cli.js --help

# Ejecutar en modo verbose para más información
npm start -- --verbose

# Generar reporte para análisis
npm start -- --output debug-report.json
```

### Depuración

Para depurar reglas personalizadas:

```javascript
export default [
  {
    name: 'Debug rule',
    check: (content, filePath) => {
      console.log('Checking file:', filePath);
      console.log('Content preview:', content.slice(0, 100));
      return false; // Cambiar lógica según necesites
    },
    message: 'Debug message',
  },
]
```

## 📦 Instalación y Configuración

### 🚀 Instalación Rápida

#### Opción 1: Instalar desde NPM (Recomendado)

```bash
# Con npm
npm install --save-dev frontend-standards-checker

# Con bun
bun add --dev frontend-standards-checker
```

#### Opción 2: Instalar desde GitHub

```bash
# Con npm
npm install --save-dev git+https://github.com/tu-usuario/frontend-standards.git

# Con bun
bun add --dev git+https://github.com/tu-usuario/frontend-standards.git
```

#### Opción 3: Clonar e Instalar Localmente

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/frontend-standards.git

# Navegar al directorio
cd frontend-standards

# Instalar dependencias
npm install
# o
yarn install

# Enlazar globalmente (opcional)
npm link
# o
yarn link
```

### ⚙️ Configuración del Proyecto

#### 1. Agregar Scripts a package.json

```json
{
  "scripts": {
    "lint:standards": "frontend-standards-checker",
    "lint:standards:zones": "frontend-standards-checker --zones",
    "lint:standards:verbose": "frontend-standards-checker --verbose",
    "lint:standards:report": "frontend-standards-checker --output standards-report.json"
  },
  "devDependencies": {
    "frontend-standards-checker": "^2.0.0"
  }
}
```

#### 2. Crear Archivo de Configuración

Crea `checkFrontendStandards.config.js` en la raíz de tu proyecto:

```javascript
// checkFrontendStandards.config.js
export default [
  {
    name: 'No console statements',
    check: (content) => /console\.(log|warn|error|info|debug)/.test(content),
    message: 'Remove console statements before committing to production.',
  },
  // Agregar más reglas según necesites
]
```

#### 3. Configurar .gitignore (Opcional)

```gitignore
# Standards reports
standards-report.json
*-standards-report.json
```

### 🔧 Uso en el Proyecto

#### Comandos Básicos

```bash
# Ejecutar validación completa
npm run lint:standards

# Validar zonas específicas
npm run lint:standards -- --zones src components

# Modo verbose
npm run lint:standards:verbose

# Generar reporte
npm run lint:standards:report
```

#### Integración con Scripts Existentes

```json
{
  "scripts": {
    "lint": "eslint . && npm run lint:standards",
    "test": "jest && npm run lint:standards",
    "pre-commit": "npm run lint:standards",
    "ci": "npm run lint && npm run test && npm run lint:standards"
  }
}
```

### 🏢 Configuración para Equipos

#### 1. Configuración Compartida en el Repositorio

```javascript
// checkFrontendStandards.config.js - Configuración del equipo
export default {
  zones: {
    includePackages: false,
    customZones: ['shared', 'utils'],
  },
  rules: [
    // Reglas específicas del proyecto/equipo
    {
      name: 'Team coding standard',
      check: (content) => {
        // Lógica de validación del equipo
        return false;
      },
      message: 'Follow team coding standards.',
    },
  ],
}
```

#### 2. Configuración por Ambiente

```javascript
// checkFrontendStandards.config.js
const isDevelopment = process.env.NODE_ENV === 'development';
const isCI = process.env.CI === 'true';

export default {
  rules: [
    // Reglas básicas para todos
    {
      name: 'No console.log',
      check: (content) => /console\.log/.test(content),
      message: 'Remove console.log statements.',
    },

    // Reglas más estrictas solo en CI
    ...(isCI ? [
      {
        name: 'Strict documentation',
        check: (content, filePath) => {
          if (!filePath.endsWith('.tsx')) return false;
          return !content.includes('/**');
        },
        message: 'Components must have JSDoc documentation in CI.',
      },
    ] : []),

    // Reglas más relajadas en desarrollo
    ...(isDevelopment ? [] : [
      {
        name: 'No TODO comments',
        check: (content) => /TODO|FIXME|HACK/.test(content),
        message: 'TODO comments not allowed in production.',
      },
    ]),
  ],
}
```

### 🔗 Integración con CI/CD

#### GitHub Actions

```yaml
# .github/workflows/frontend-standards.yml
name: Frontend Standards Check

on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main ]

jobs:
  standards-check:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run Frontend Standards Check
      run: npm run lint:standards:report

    - name: Upload Standards Report
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: standards-report
        path: standards-report.json
```

#### GitLab CI

```yaml
# .gitlab-ci.yml
frontend_standards:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm run lint:standards:report
  artifacts:
    reports:
      junit: standards-report.json
    when: always
    expire_in: 1 week
  only:
    - merge_requests
    - main
```

### 🔄 Integración con Git Hooks

#### Usando husky + lint-staged

```bash
# Instalar husky y lint-staged
npm install --save-dev husky lint-staged

# Configurar husky
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

```json
// package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "frontend-standards-checker --zones",
      "eslint --fix",
      "git add"
    ]
  }
}
```

### 📋 Configuraciones Predefinidas por Tipo de Proyecto

#### React + TypeScript

```javascript
// checkFrontendStandards.config.js
export default [
  {
    name: 'React functional components only',
    check: (content, filePath) => {
      if (!filePath.endsWith('.tsx')) return false;
      return /class\s+\w+\s+extends\s+(React\.)?Component/.test(content);
    },
    message: 'Use functional components instead of class components.',
  },
  {
    name: 'TypeScript strict types',
    check: (content) => /:\s*any\b/.test(content),
    message: 'Avoid using "any" type. Use specific types instead.',
  },
  {
    name: 'Component prop types',
    check: (content, filePath) => {
      if (!filePath.endsWith('.tsx')) return false;
      if (!content.includes('export') || !content.includes('function')) return false;
      return !content.includes('interface') && !content.includes('type');
    },
    message: 'React components must define prop types.',
  },
];
```

#### Vue.js + TypeScript

```javascript
export default [
  {
    name: 'Vue composition API',
    check: (content, filePath) => {
      if (!filePath.endsWith('.vue')) return false;
      return content.includes('Vue.extend') || content.includes('options API');
    },
    message: 'Use Composition API instead of Options API.',
  },
  {
    name: 'Script setup syntax',
    check: (content, filePath) => {
      if (!filePath.endsWith('.vue')) return false;
      return content.includes('<script>') && !content.includes('<script setup>');
    },
    message: 'Use <script setup> syntax for better TypeScript support.',
  },
];
```

#### Node.js + Express

```javascript
export default [
  {
    name: 'Express error handling',
    check: (content, filePath) => {
      if (!filePath.includes('route') && !filePath.includes('controller')) return false;
      return content.includes('app.') && !content.includes('try') && !content.includes('catch');
    },
    message: 'API routes must have proper error handling with try/catch.',
  },
  {
    name: 'Environment variables',
    check: (content) => /process\.env\./.test(content) && !/process\.env\.\w+\s*\|\|/.test(content),
    message: 'Environment variables should have fallback values.',
  },
];
```

### 🛠️ Configuración Avanzada para Monorepos

#### Configuración para Lerna/Nx

```javascript
// checkFrontendStandards.config.js (raíz del monorepo)
export default function(defaultRules) {
  const packagePath = process.cwd();
  const isSharedPackage = packagePath.includes('/packages/shared');
  const isAppPackage = packagePath.includes('/apps/');

  const baseRules = [...defaultRules];

  if (isSharedPackage) {
    baseRules.push({
      name: 'Shared package exports',
      check: (content, filePath) => {
        if (!filePath.endsWith('index.ts')) return false;
        return !content.includes('export');
      },
      message: 'Shared packages must export their public API through index.ts',
    });
  }

  if (isAppPackage) {
    baseRules.push({
      name: 'App-specific imports',
      check: (content) => /import.*from.*['"]@shared/.test(content),
      message: 'Apps should import from shared packages, not directly from other apps.',
    });
  }

  return baseRules;
}
```

### 📚 Documentación para el Equipo

#### README.md del Proyecto

```markdown
## 🔍 Frontend Standards

Este proyecto utiliza Frontend Standards Checker para mantener la calidad del código.

### Ejecutar Validaciones

\`\`\`bash
# Validar todo el proyecto
npm run lint:standards

# Validar zonas específicas
npm run lint:standards -- --zones src components

# Ver detalles verbose
npm run lint:standards:verbose
\`\`\`

### Reglas del Proyecto

- No console.log en producción
- Componentes React deben ser funcionales
- TypeScript estricto (no any)
- Documentación JSDoc requerida

### Configuración Personalizada

Ver \`checkFrontendStandards.config.js\` para reglas específicas del proyecto.
```

### ⚡ Troubleshooting Común

#### Error: "Module not found"

```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# O con bun
rm -rf node_modules bun.lockb
bun install
```

#### Error: "Configuration file not found"

```bash
# Verificar que existe el archivo de configuración
ls -la checkFrontendStandards.config.js

# Crear archivo básico si no existe
echo 'export default [];' > checkFrontendStandards.config.js
```

#### Error en CI/CD

```bash
# Verificar versión de Node.js
node --version

# Asegurar que las dependencias están instaladas
npm ci  # En lugar de npm install en CI
```
