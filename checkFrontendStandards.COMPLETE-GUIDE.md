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
--debug                    # Modo debug: muestra archivos procesados y patrones de gitignore
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

### 🐛 Comandos de Debug y Troubleshooting

```bash
# Modo debug: Ver qué archivos se procesan y patrones de gitignore
npm start -- --debug
./bin/cli.js --debug

# Debug + verbose para máxima información
npm start -- --debug --verbose
./bin/cli.js --debug --verbose

# Debug de una zona específica
npm start -- --zones src --debug
./bin/cli.js --zones components --debug

# Guardar información de debug en archivo
npm start -- --debug > debug.log 2>&1
./bin/cli.js --debug --verbose > full-debug.log 2>&1

# Script de debug independiente para troubleshooting
node debug-scanner.js

# Verificar configuración cargada (debug muestra config completa)
npm start -- --debug | grep "Configuration loaded"
```

### 🔍 Ejemplos de Uso del Debug

```bash
# Problema: "¿Por qué se valida este archivo?"
npm start -- --debug | grep "Files found"

# Problema: "¿Se está cargando mi .gitignore?"
npm start -- --debug | grep -A 10 "gitignore patterns"

# Problema: "¿Qué configuración se está usando?"
npm start -- --debug | grep -A 20 "Configuration loaded"

# Ver exactamente qué archivos están siendo ignorados
node debug-scanner.js

# Debug de zona específica con salida limpia
npm start -- --zones src --debug --verbose | tee debug-src.log
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

#### 🐛 Modo Debug Integrado

Frontend Standards Checker v2.0 incluye herramientas avanzadas de debugging para diagnosticar problemas con archivos ignorados, patrones de gitignore y reglas personalizadas.

##### Activar el Modo Debug

```bash
# Ejecutar con información detallada de debugging
npx check-frontend-standards --debug

# O con el script npm
npm start -- --debug

# Combinado con otras opciones
npx check-frontend-standards --debug --verbose
```

##### Información que muestra el modo debug:

- **Patrones de .gitignore cargados**: Lista todos los patrones encontrados
- **Archivos encontrados por zona**: Muestra exactamente qué archivos se van a validar
- **Configuración completa**: Displays la configuración final con todas las reglas
- **Estadísticas de exclusión**: Número total de archivos ignorados vs validados

##### Ejemplo de salida del modo debug:

```
🔍 Frontend Standards Checker v1.0.0
🐛 Looking for .gitignore at: /tu/proyecto/.gitignore
🐛 Loaded 46 patterns from .gitignore
🐛 Patterns: [
  "node_modules/",
  "*.log",
  "dist/",
  "build/",
  ".env"
]
🐛 Loading .gitignore patterns from: /tu/proyecto
🐛 Found 46 gitignore patterns
🐛 Total ignore patterns: 57
📁 Debug: Files found in zone "root":
  ✓ src/components/Button.tsx
  ✓ src/utils/helpers.ts
  ✓ src/index.ts
📊 Total files to validate: 15
```

#### 🔍 Script de Debug Independiente

Para troubleshooting avanzado, usa el script `debug-scanner.js`:

```bash
# Ejecutar el analizador de archivos debug
node debug-scanner.js
```

Este script te mostrará:

- Si existe `.gitignore` en tu proyecto
- Todos los patrones de exclusión cargados
- Lista completa de archivos que serán validados
- Consejos para resolver problemas comunes

##### Ejemplo de salida del debug-scanner:

```
🔍 Frontend Standards Debug Tool
================================

📂 Project root: /tu/proyecto
✅ .gitignore found
📋 Loaded 35 ignore patterns from .gitignore

🚫 Ignore patterns:
  1. node_modules/
  2. *.log
  3. dist/
  4. .env
  [... lista completa]

📁 Files that will be validated (12):
  1. src/components/Button.tsx
  2. src/utils/helpers.ts
  [... lista completa]

💡 Tips:
  - If you see files that should be ignored, add them to your .gitignore
  - Patterns like *.log, dist/, node_modules/ are automatically excluded
```

#### 🚨 Diagnóstico de Problemas Comunes

##### Problema: "El validador está revisando archivos del .gitignore"

**Solución paso a paso:**

1. **Verificar que existe `.gitignore`**:

   ```bash
   ls -la | grep gitignore
   ```

2. **Usar el modo debug para verificar patrones**:

   ```bash
   npx check-frontend-standards --debug
   ```

3. **Verificar sintaxis del .gitignore**:

   ```bash
   # Asegúrate de que los patrones estén bien formateados
   cat .gitignore
   ```

4. **Usar el debug-scanner para diagnosticar**:
   ```bash
   node debug-scanner.js
   ```

**Soluciones comunes:**

```bash
# Si .gitignore no existe, crearlo
touch .gitignore

# Agregar patrones básicos
echo "node_modules/" >> .gitignore
echo "*.log" >> .gitignore
echo "dist/" >> .gitignore
echo ".env" >> .gitignore

# Verificar sintaxis de patrones
cat .gitignore
```

##### Problema: "Reglas personalizadas no funcionan"

**Debugging de reglas:**

```javascript
// En tu checkFrontendStandards.config.js
export default {
  merge: true,
  rules: [
    {
      name: 'Debug test rule',
      check: (content, filePath) => {
        // Agregar logging para debug
        console.log('🐛 Processing file:', filePath);
        console.log('🐛 Content length:', content.length);

        const hasIssue = content.includes('console.log');
        console.log('🐛 Found console.log:', hasIssue);

        return hasIssue;
      },
      message: 'Debug: Found console.log statement',
    },
  ],
}
```

```bash
# Ejecutar con debug para ver el logging
npm start -- --debug --verbose
```

##### Problema: "Muchos falsos positivos"

**Análisis con debug:**

```bash
# Ver todos los archivos que se están validando
npm start -- --debug > debug-output.log

# Analizar qué archivos causan errores
grep "violation" frontend-standards.log

# Usar debug-scanner para verificar exclusiones
node debug-scanner.js > scanner-output.log
```

##### Problema: "No entiendo por qué falla en CI pero funciona local"

**Debug remoto:**

```bash
# En CI, agregar estos comandos antes del validador
echo "=== DEBUG INFO ==="
pwd
ls -la
cat .gitignore
node debug-scanner.js
echo "=== END DEBUG ==="

# Luego ejecutar el validador con debug
npm start -- --debug --verbose
```

#### 💡 Consejos de Debug Avanzados

```bash
# 1. Capturar toda la información de debug
npm start -- --debug --verbose 2>&1 | tee complete-debug.log

# 2. Filtrar información específica
npm start -- --debug 2>&1 | grep -E "(gitignore|Files found|Configuration)"

# 3. Debug de zona específica
npm start -- --zones problematic-folder --debug

# 4. Comparar antes y después de cambios
npm start -- --debug > before.log
# Hacer cambios en .gitignore o config
npm start -- --debug > after.log
diff before.log after.log

# 5. Verificar patrones de exclusión en tiempo real
node debug-scanner.js | grep -A 100 "Ignore patterns"
```
