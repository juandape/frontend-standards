# 📦 Frontend Standards Checker - Guía de Instalación

Una herramienta modular y extensible para mantener la calidad y consistencia en proyectos frontend.

## 🚀 Instalación Rápida

### Opción 1: Script de Instalación Automática (Recomendado)

```bash
# Ejecutar desde la raíz de tu proyecto
curl -fsSL https://raw.githubusercontent.com/juandape/frontend-standards/main/install.sh | bash
```

Este script automáticamente:

- ✅ Detecta si usas npm o yarn
- ✅ Instala el paquete como dependencia de desarrollo
- ✅ Crea un archivo de configuración básico
- ✅ Agrega scripts útiles a tu package.json
- ✅ Configura .gitignore apropiadamente

### Opción 2: Instalación Manual

#### Con NPM

```bash
npm install --save-dev git+https://github.com/juandape/frontend-standards.git
```

#### Con Yarn

```bash
yarn add --dev frontend-standards-checker@https://github.com/juandape/frontend-standards.git
```

> **Nota**: Yarn y NPM usan formatos diferentes para instalar desde repositorios Git. El script automático maneja esto automáticamente.

## ⚙️ Configuración Manual

### 1. Crear Archivo de Configuración

Crea `checkFrontendStandards.config.js` en la raíz de tu proyecto:

```javascript
export default [
  {
    name: 'No console statements',
    check: (content) => /console\.(log|warn|error|info|debug)/.test(content),
    message: 'Remove console statements before committing to production.',
  },
  // Agregar más reglas aquí
];
```

### 2. Agregar Scripts a package.json

```json
{
  "scripts": {
    "lint:standards": "frontend-standards-checker",
    "lint:standards:zones": "frontend-standards-checker --zones",
    "lint:standards:verbose": "frontend-standards-checker --verbose",
    "lint:standards:report": "frontend-standards-checker --output standards-report.json"
  }
}
```

## 🔧 Uso

### Con NPM

```bash
# Validar todo el proyecto
npm run lint:standards

# Validar zonas específicas
npm run lint:standards:zones -- src components

# Modo verbose para ver detalles
npm run lint:standards:verbose

# Generar reporte JSON
npm run lint:standards:report
```

### Con Yarn

```bash
# Validar todo el proyecto
yarn lint:standards

# Validar zonas específicas
yarn lint:standards:zones src components

# Modo verbose para ver detalles
yarn lint:standards:verbose

# Generar reporte JSON
yarn lint:standards:report
```

## 🏢 Para Equipos de Trabajo

### Integración con Git Hooks

#### Con NPM + Husky

```bash
# Instalar husky para git hooks
npm install --save-dev husky

# Configurar pre-commit hook
npx husky install
npx husky add .husky/pre-commit "npm run lint:standards"
```

#### Con Yarn + Husky

```bash
# Instalar husky para git hooks
yarn add --dev husky

# Configurar pre-commit hook
yarn husky install
yarn husky add .husky/pre-commit "yarn lint:standards"
```

#### Configuración de package.json para ambos

```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "frontend-standards-checker --zones",
      "eslint --fix",
      "git add"
    ]
  }
}
```

### Integración con CI/CD

#### GitHub Actions (NPM)

```yaml
# .github/workflows/standards.yml
name: Frontend Standards

on: [push, pull_request]

jobs:
  standards:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    - run: npm ci
    - run: npm run lint:standards:report
```

#### GitHub Actions (Yarn)

```yaml
# .github/workflows/standards.yml
name: Frontend Standards

on: [push, pull_request]

jobs:
  standards:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'yarn'
    - run: yarn install --frozen-lockfile
    - run: yarn lint:standards:report
```

#### GitLab CI (NPM)

```yaml
# .gitlab-ci.yml
standards_check:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm run lint:standards:report
  artifacts:
    reports:
      junit: standards-report.json
```

#### GitLab CI (Yarn)

```yaml
# .gitlab-ci.yml
standards_check:
  stage: test
  image: node:18
  script:
    - yarn install --frozen-lockfile
    - yarn lint:standards:report
  artifacts:
    reports:
      junit: standards-report.json
```

## 📋 Configuraciones por Tipo de Proyecto

### React + TypeScript

```javascript
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
  }
];
```

### Vue.js

```javascript
export default [
  {
    name: 'Vue composition API',
    check: (content, filePath) => {
      if (!filePath.endsWith('.vue')) return false;
      return content.includes('<script>') && !content.includes('<script setup>');
    },
    message: 'Use <script setup> syntax for better TypeScript support.',
  }
];
```

### Node.js + Express

```javascript
export default [
  {
    name: 'Express error handling',
    check: (content, filePath) => {
      if (!filePath.includes('route')) return false;
      return content.includes('app.') && !content.includes('try');
    },
    message: 'API routes must have proper error handling.',
  }
];
```

## 🛠️ Configuración Avanzada

### Para Monorepos

```javascript
// En la raíz del monorepo
export default function(defaultRules) {
  const packagePath = process.cwd();
  const isSharedPackage = packagePath.includes('/packages/shared');

  if (isSharedPackage) {
    return [
      ...defaultRules,
      {
        name: 'Shared package exports',
        check: (content, filePath) => {
          if (!filePath.endsWith('index.ts')) return false;
          return !content.includes('export');
        },
        message: 'Shared packages must export through index.ts',
      }
    ];
  }

  return defaultRules;
}
```

### Variables de Entorno

```javascript
const isProduction = process.env.NODE_ENV === 'production';
const isCI = process.env.CI === 'true';

export default [
  // Reglas más estrictas en producción
  ...(isProduction ? [
    {
      name: 'No TODO comments',
      check: (content) => /TODO|FIXME/.test(content),
      message: 'TODO comments not allowed in production.',
    }
  ] : []),

  // Reglas específicas de CI
  ...(isCI ? [
    {
      name: 'Documentation required',
      check: (content, filePath) => {
        if (!filePath.endsWith('.tsx')) return false;
        return !content.includes('/**');
      },
      message: 'Components must have JSDoc in CI.',
    }
  ] : [])
];
```

## 📚 Documentación Completa

Para ejemplos avanzados, configuraciones personalizadas y guía completa, consulta:

- [Guía Completa de Configuración](./checkFrontendStandards.COMPLETE-GUIDE.md)
- [Guía Específica para Yarn](./YARN.md) 🧶
- [Documentación Técnica](./TECHNICAL.md)
- [Ejemplos de Configuración](./examples/)

## 🆘 Soporte

### Problemas Comunes

#### Con NPM

**Error: "Module not found"**

```bash
rm -rf node_modules package-lock.json
npm install
```

**Error: "Configuration file not found"**

```bash
# Crear archivo básico
echo 'export default [];' > checkFrontendStandards.config.js
```

#### Con Yarn

**Error: "Module not found"**

```bash
rm -rf node_modules yarn.lock
yarn install
```

**Error: "Package not found in registry"**

```bash
# Limpiar cache de yarn
yarn cache clean
# Reinstalar
yarn install
```

**Error: "Command not found"**

```bash
# Verificar que el script existe en package.json
yarn run --help
# Ejecutar directamente si el script no está configurado
yarn frontend-standards-checker
```

**Error: "git+https://... didn't match the required format"**

```bash
# Usar el formato correcto para Yarn
yarn add --dev frontend-standards-checker@https://github.com/juandape/frontend-standards.git
# NO usar: yarn add --dev git+https://...
```

### Obtener Ayuda

#### Con NPM

```bash
# Ver todas las opciones
npx frontend-standards-checker --help

# Modo verbose para depuración
npm run lint:standards:verbose
```

#### Con Yarn

```bash
# Ver todas las opciones
yarn frontend-standards-checker --help

# Modo verbose para depuración
yarn lint:standards:verbose
```

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature
3. Ejecuta las pruebas: `npm test`
4. Envía un pull request

## 📄 Licencia

MIT License - ver [LICENSE](./LICENSE) para más detalles.

---

**Frontend Standards Checker v2.0** - Mantén la calidad de tu código frontend 🚀
