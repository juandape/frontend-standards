# Frontend Standards Checker

Una herramienta escalable y modular para validar estándares de frontend en proyectos JavaScript/TypeScript.

## 🚀 Características

- **Arquitectura modular**: Cada componente tiene una responsabilidad específica
- **Escalable**: Fácil agregar nuevas reglas y validadores
- **Configurable**: Configuración flexible mediante archivo de configuración
- **CLI amigable**: Interfaz de línea de comandos con opciones detalladas
- **Reportes detallados**: Genera reportes comprensivos en formato texto y JSON
- **Soporte para monorepos**: Detecta y valida múltiples zonas automáticamente

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

#### Manual con Bun

```bash
bun add --dev frontend-standards-checker@https://github.com/juandape/frontend-standards.git
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
npm run lint:standards

# Con Bun
bun run lint:standards

# Validar zonas específicas
npm run lint:standards -- --zones src components
bun run lint:standards:zones src components
```

# Validar zonas específicas

./bin/cli.js --zones apps/frontend packages/ui

# Modo verbose

./bin/cli.js --verbose

# Saltar validaciones específicas

./bin/cli.js --skip-structure --skip-naming

# Configuración personalizada

./bin/cli.js --config ./my-config.js --output ./my-report.log

````

### Como módulo

```javascript
import { FrontendStandardsChecker } from './src/index.js';

const checker = new FrontendStandardsChecker({
  zones: ['apps/frontend'],
  verbose: true,
  skipStructure: false
});

const results = await checker.run();
console.log(`Found ${results.totalErrors} violations`);
````

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
