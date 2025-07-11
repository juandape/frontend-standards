# Frontend Standards Checker v4.8.0

Una herramienta escalable y modular para validar estándares de frontend en proyectos JavaScript/TypeScript. **Versión 4.8.0 con nuevas funcionalidades y mejoras de rendimiento.**

## 🚀 Características

- **Arquitectura modular**: Cada componente tiene una responsabilidad específica
- **Escalable**: Fácil agregar nuevas reglas y validadores
- **Configurable**: Configuración flexible mediante archivo de configuración
- **CLI amigable**: Interfaz de línea de comandos con opciones detalladas
- **Reportes detallados**: Genera reportes comprensivos con secciones para errors, warnings e info
- **Soporte para monorepos**: Detecta y valida múltiples zonas automáticamente
- **🆕 Validación selectiva**: Opción `onlyZone` para validar solo módulos específicos
- **🆕 Validación eficiente**: Por defecto solo valida archivos en staging para commit (`onlyChangedFiles: true`)
- **🆕 TypeScript nativo**: Tipos estrictos, autocompletado y mejor experiencia de desarrollo
- **🆕 Reglas actualizadas**: "No console.log" y "No inline styles" ahora son errores críticos

## 📦 Instalación Rápida

### Para usar en tu proyecto

#### Script automático (Recomendado)

```bash
curl -fsSL https://raw.githubusercontent.com/juandape/frontend-standards/main/install.sh | bash
```

#### Manual con NPM

```bash
npm install --save-dev git+https://github.com/juandape/frontend-standards.git
```

#### Manual con Yarn

```bash
yarn add --dev frontend-standards-checker@https://github.com/juandape/frontend-standards.git
```

### Para desarrollo de la herramienta

```bash
git clone https://github.com/juandape/frontend-standards.git
cd frontend-standards
npm install
```

## 🚀 Uso Rápido

Una vez instalado en tu proyecto:

```bash
# Con NPM
npm run standards

# Con Yarn
yarn standards

# Validar zonas específicas
npm run standards -- --zones src components
yarn standards:zones src components

# 🆕 Solo validar archivos staged en commit (comportamiento predeterminado)
yarn standards

# 🆕 Validar todos los archivos (no solo los staged)
yarn standards -- --only-changed-files=false

# 🆕 Validar únicamente una zona específica
yarn standards -- --only-zone auth
```

## 📚 Documentación Completa

**Para configuración avanzada, ejemplos prácticos y troubleshooting:**

👉 **[Ver Guía Completa de Configuración](./checkFrontendStandards.COMPLETE-GUIDE.md)**

La guía completa incluye:

- ✅ Instalación paso a paso (npm y yarn)
- ⚙️ Ejemplos de configuración para React, Next.js, monorepos
- 🔧 Configuración avanzada de reglas y zonas
- 🐛 Troubleshooting y comandos de debug
- 📋 Lista completa de validaciones disponibles (60 reglas en total)
- 🆕 Configuración de `onlyChangedFiles` y `onlyZone`
- 🆕 Interacción entre diferentes opciones de configuración
- 🆕 Niveles de severidad actualizados (ERROR/WARNING/INFO)

## 🆕 Novedades en v4.8.0

### Nueva regla: Direct imports for sibling files

Se ha implementado una nueva regla de error que evita dependencias circulares:

- Detecta cuando archivos hermanos (que están en el mismo directorio) se importan a través del index.
- Obliga a importar directamente desde el archivo fuente en lugar de a través del index.
- Mejora la organización del código y evita posibles dependencias circulares.

### Validación Eficiente con onlyChangedFiles

Por defecto, la herramienta ahora solo valida archivos que están preparados para commit (staged):

```javascript
// checkFrontendStandards.config.js - Este es el comportamiento predeterminado
export default {
  onlyChangedFiles: true, // Por defecto es true
}
```

Para validar todos los archivos del proyecto:

```bash
# CLI
frontend-standards-checker --only-changed-files=false

# Configuración
export default {
  onlyChangedFiles: false
}
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
# Validar zonas específicas
./bin/cli.js --zones apps/frontend packages/ui

# Modo verbose (incluye reglas INFO)
./bin/cli.js --verbose

# Saltar validaciones específicas
./bin/cli.js --skip-structure --skip-naming

# Configuración personalizada
./bin/cli.js --config ./my-config.js --output ./my-report.log
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

### Scripts npm

```bash
# Ejecutar validación
npm start

# Modo desarrollo con watch
npm run dev

# Ejecutar CLI
npm run cli
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

## 🏗️ Arquitectura

El proyecto está estructurado de manera modular:

```
src/
├── index.js                 # Clase principal y punto de entrada
├── core/
│   ├── config-loader.js     # Carga y manejo de configuración
│   ├── project-analyzer.js  # Análisis de estructura del proyecto
│   ├── rule-engine.js       # Motor de validación de reglas
│   └── reporter.js          # Generación de reportes
└── utils/
    ├── file-scanner.js      # Escaneo y filtrado de archivos
    └── logger.js            # Sistema de logging
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
  -z, --zones <zones...>     Zonas específicas a verificar
  -c, --config <path>        Ruta a archivo de configuración personalizado
  -o, --output <path>        Ruta para archivo de log de salida
  -v, --verbose              Mostrar salida detallada
  --skip-structure           Saltar validación de estructura de directorios
  --skip-naming              Saltar validación de convenciones de nombres
  --skip-content             Saltar validación de contenido
  -h, --help                 Mostrar ayuda
  --version                  Mostrar versión
```

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

## 📊 Reportes

La herramienta genera reportes detallados que incluyen:

- **Resumen ejecutivo**: Estadísticas generales
- **Resultados por zona**: Estado de cada zona validada
- **Violaciones detalladas**: Lista completa de errores con ubicación
- **Estadísticas de errores**: Tipos de errores más frecuentes
- **Recomendaciones**: Sugerencias para mejorar

### Formatos de salida

- **Texto**: Reporte legible para humanos (`.log`)
- **JSON**: Datos estructurados para integración (`.json`)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear un Pull Request

## 📄 Licencia

MIT

## 🆚 Diferencias con la versión anterior

### Mejoras de escalabilidad

- **Arquitectura modular**: Separación clara de responsabilidades
- **Inyección de dependencias**: Fácil testing y extensibilidad
- **Configuración flexible**: Soporte para configuraciones complejas
- **Logging estructurado**: Sistema de logging consistente
- **Manejo de errores robusto**: Mejor recuperación de errores

### Nuevas características

- **CLI completo**: Interfaz de línea de comandos con múltiples opciones
- **Reportes mejorados**: Reportes más detallados y en múltiples formatos
- **Detección automática de proyecto**: Identifica automáticamente tipo y estructura
- **Soporte para monorepos mejorado**: Mejor manejo de proyectos complejos
- **Validadores especializados**: Sistema extensible de validadores

### Mantenibilidad

- **Código más limpio**: Funciones más pequeñas y enfocadas
- **Mejor documentación**: JSDoc completo en todas las funciones
- **Testing facilitado**: Arquitectura que facilita pruebas unitarias
- **Configuración centralizada**: Un solo punto de configuración
