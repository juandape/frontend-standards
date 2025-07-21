# Frontend Standards Checker v0.0.7 - Guía Completa de Configuración

Esta guía contiene todos los ejemplos posibles para configurar reglas personalizadas en **Frontend Standards Checker v0.0.7**.

> **⚠️ Importante**: Esta versión incluye validadores avanzados, mensajes de error enriquecidos y mejoras de precisión. Si tienes una versión anterior, actualiza usando la instalación recomendada.

## 🆕 Novedades

- Validadores avanzados con mensajes enriquecidos (línea, carpeta, función)
- Mejoras en la precisión de reglas de componentes y hooks
- Mensajes de error más claros y útiles para debugging rápido
- Compatibilidad total con React Native y monorepos
- Documentación y ejemplos actualizados
- Carpeta de reportes `logs-standards-validations` para almacenar los reportes generados con fecha y hora y último colaborador que modificó el archivo
- Visor HTML para reportes de validación
- Validación selectiva: opción `onlyZone` para validar solo módulos específicos
- Validación eficiente: por defecto solo valida archivos en staging para commit (`onlyChangedFiles: true`)
- TypeScript nativo: tipos estrictos, autocompletado y mejor experiencia de desarrollo
- Instalación inteligente: detecta React Native y adapta la instalación automáticamente
- Mejoras de compatibilidad: instalación robusta para proyectos con dependencias complejas (React Native, monorepos con dependencias privadas)
- Mejoras en la documentación: ejemplos y guías actualizadas para facilitar la integración
- Nuevas reglas de validación: reglas adicionales para mejorar la calidad del código
- Exportación a CSV: posibilidad de exportar los reportes a formato CSV para análisis externo

---

### 🔎 Ejemplo de mensaje de error enriquecido

```log
📄 /src/components/Calendar/index.tsx:23
   Rule: Component function name match
   Issue: La función principal en index.tsx debe tener el mismo nombre que su carpeta contenedora. Carpeta: 'Calendar', Función: 'CalendarPicker' - Los nombres no coinciden exactamente.
```

Ahora los mensajes incluyen número de línea, nombre de carpeta y función, facilitando la corrección rápida.

---

## 📋 Tabla de Contenidos

- [Frontend Standards Checker v0.0.7 - Guía Completa de Configuración](#frontend-standards-checker-v007---guía-completa-de-configuración)
  - [🆕 Novedades](#-novedades)
    - [🔎 Ejemplo de mensaje de error enriquecido](#-ejemplo-de-mensaje-de-error-enriquecido)
  - [📋 Tabla de Contenidos](#-tabla-de-contenidos)
  - [� Instalación Rápida (v0.0.7)](#-instalación-rápida-v007)
    - [Instalación estándar (Recomendado)](#instalación-estándar-recomendado)
    - [Scripts en package.json](#scripts-en-packagejson)
    - [Copiar guía de instalación y archivo de configuración](#copiar-guía-de-instalación-y-archivo-de-configuración)
  - [📋 Tabla de Contenidos](#-tabla-de-contenidos-1)
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
    - [Comandos Principales (Post-instalación)](#comandos-principales-post-instalación)
    - [Opciones de CLI Avanzadas](#opciones-de-cli-avanzadas)
  - [🎯 Ejemplo Activo para Probar](#-ejemplo-activo-para-probar)
  - [💡 Consejos](#-consejos)
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

## � Instalación Rápida (v0.0.7)

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
    "standards": "frontend-standards-checker",
    "standards:zones": "frontend-standards-checker --zones",
    "standards:verbose": "frontend-standards-checker --verbose",
    "standards:all": "frontend-standards-checker --all",
    "standards:init": "frontend-standards-checker --init"
  }
}
```

**Nota importante:**

- Instala siempre desde npm usando los comandos anteriores.
- No uses tarballs locales ni referencias workspace para evitar errores de instalación.
- El paquete incluye todos los archivos necesarios y es compatible con monorepos, Next.js, Vite y React Native.

### Copiar guía de instalación y archivo de configuración

```bash
npx frontend-standards-init
```

Esto copiará la guía completa y el archivo `checkFrontendStandards.config.js` en la raíz de tu proyecto.

## 📋 Tabla de Contenidos

- [Frontend Standards Checker v0.0.7 - Guía Completa de Configuración](#frontend-standards-checker-v007---guía-completa-de-configuración)
  - [🆕 Novedades](#-novedades)
    - [🔎 Ejemplo de mensaje de error enriquecido](#-ejemplo-de-mensaje-de-error-enriquecido)
  - [📋 Tabla de Contenidos](#-tabla-de-contenidos)
  - [� Instalación Rápida (v0.0.7)](#-instalación-rápida-v007)
    - [Instalación estándar (Recomendado)](#instalación-estándar-recomendado)
    - [Scripts en package.json](#scripts-en-packagejson)
    - [Copiar guía de instalación y archivo de configuración](#copiar-guía-de-instalación-y-archivo-de-configuración)
  - [📋 Tabla de Contenidos](#-tabla-de-contenidos-1)
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
    - [Comandos Principales (Post-instalación)](#comandos-principales-post-instalación)
    - [Opciones de CLI Avanzadas](#opciones-de-cli-avanzadas)
  - [🎯 Ejemplo Activo para Probar](#-ejemplo-activo-para-probar)
  - [💡 Consejos](#-consejos)
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

## 🚀 Instrucciones de Uso

1. Usa el comando `npx frontend-standards-init`
   - Este comando creará el archivo de configuración y copiará la guía completa de instalación.
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

### Comandos Principales (Post-instalación)

**Para proyectos estándar (monorepos, Next.js, etc.):**

```bash
# Validación estándar (solo archivos modificados)
npm run standards

# Validar zonas específicas
npm run standards:zones

# Modo verbose (más detalles)
npm run standards:verbose

# Validar TODOS los archivos
npm run standards:all

# Copiar archivos de configuración adicionales
npm run standards:init
```

**Para React Native:**

```bash
# Validación estándar
yarn standards

# Validar zonas específicas
yarn standards:zones

# Modo verbose
yarn standards:verbose

# Validar todos los archivos
yarn standards:all

# Copiar configuraciones
yarn standards:init
```

### Opciones de CLI Avanzadas

**Para instalación estándar con argumentos:**

```bash
# Validar zonas específicas
npm run standards -- --zones src components

# Validar solo una zona
npm run standards -- --only-zone auth

# Validar todos los archivos (override config)
npm run standards -- --only-changed-files=false

# Modo verbose con configuración personalizada
npm run standards -- --verbose --config mi-config.js
```

**Para React Native (los comandos ya incluyen configuración externa):**

```bash
# Los scripts ya están configurados correctamente
yarn standards                 # Incluye --config ../checkFrontendStandards.config.js
yarn standards:zones           # Incluye configuración externa
yarn standards:verbose         # Con configuración optimizada
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

## 📋 Lista Completa de Verificaciones

Esta sección contiene **todas las verificaciones que el script realiza actualmente**. Estas son las reglas por defecto que se ejecutan cuando corres `node checkFrontendStandards.mjs`.

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

El script valida contra esta estructura estándar definida en `estructura standards.txt`:

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
