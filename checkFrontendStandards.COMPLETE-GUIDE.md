# CheckFrontendStandards - Guía Completa de Configuración

Esta guía contiene todos los ejemplos posibles para configurar reglas personalizadas en el script `checkFrontendStandards.mjs`.

## 📋 Tabla de Contenidos

- [CheckFrontendStandards - Guía Completa de Configuración](#checkfrontendstandards---guía-completa-de-configuración)
  - [📋 Tabla de Contenidos](#-tabla-de-contenidos)
  - [🚀 Instrucciones de Uso](#-instrucciones-de-uso)
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
  - [🎯 Ejemplo Activo para Probar](#-ejemplo-activo-para-probar)
  - [💡 Consejos](#-consejos)

## 🚀 Instrucciones de Uso

1. Crea un archivo llamado `checkFrontendStandards.config.js`
2. Copia el código de la sección que necesites (solo una a la vez)
3. Modifica las reglas según tus necesidades
4. Ejecuta el script normalmente

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
node checkFrontendStandards.mjs
```

### Validar Zonas Específicas

```bash
# Validar una zona específica
node checkFrontendStandards.mjs utils
node checkFrontendStandards.mjs api
node checkFrontendStandards.mjs features/auth

# Validar múltiples zonas
node checkFrontendStandards.mjs utils api middleware

# Validar todo el proyecto
node checkFrontendStandards.mjs
```

## 🎯 Ejemplo Activo para Probar

```javascript
// Copia este código en checkFrontendStandards.config.js para empezar a probar

export default [
  {
    name: 'No console statements',
    check: (content) => /console\.(log|warn|error|info|debug)/.test(content),
    message: 'Remove console statements before committing to production.',
  },
]
```

## 💡 Consejos

1. **Empieza simple** - Usa la Sección 1 para agregar reglas básicas
2. **Una sección a la vez** - No mezcles diferentes tipos de configuración
3. **Prueba gradualmente** - Agrega reglas de una en una para verificar que funcionan
4. **Personaliza los mensajes** - Haz que los mensajes sean claros y útiles para tu equipo
5. **Documenta tus reglas** - Agrega comentarios explicando por qué cada regla es importante

¡Con esta guía puedes crear cualquier tipo de validación personalizada que necesites para tu proyecto!
