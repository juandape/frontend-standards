# 🧶 Frontend Standards Checker - Guía Rápida para Yarn

## 🚀 Instalación con Yarn

### Opción 1: Script Automático

```bash
# Detecta automáticamente que usas Yarn
curl -fsSL https://raw.githubusercontent.com/juandape/frontend-standards/main/install.sh | bash
```

### Opción 2: Manual

```bash
yarn add --dev frontend-standards-checker@https://github.com/juandape/frontend-standards.git
```

## ⚙️ Configuración Rápida

### 1. Crear configuración básica

```bash
echo 'export default [
  {
    name: "No console statements",
    check: (content) => /console\.(log|warn|error|info|debug)/.test(content),
    message: "Remove console statements before committing to production.",
  }
];' > checkFrontendStandards.config.js
```

### 2. Agregar scripts a package.json

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

## 🔧 Comandos con Yarn

```bash
# Validar todo el proyecto
yarn lint:standards

# Validar zonas específicas
yarn lint:standards:zones src components

# Modo verbose
yarn lint:standards:verbose

# Generar reporte
yarn lint:standards:report

# Ejecutar directamente (sin scripts)
yarn frontend-standards-checker
yarn frontend-standards-checker --zones src
yarn frontend-standards-checker --verbose
```

## 🔗 Integración con Workspace de Yarn

### Para proyectos con workspaces

```json
{
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "lint:standards:all": "yarn workspaces run lint:standards",
    "lint:standards:workspace": "yarn workspace"
  }
}
```

### Comandos para workspaces

```bash
# Ejecutar en todos los workspaces
yarn workspaces run lint:standards

# Ejecutar en un workspace específico
yarn workspace my-app lint:standards

# Instalar en workspace específico
yarn workspace my-app add --dev frontend-standards-checker@https://github.com/juandape/frontend-standards.git
```

## 🪝 Git Hooks con Yarn

### Instalar husky

```bash
yarn add --dev husky lint-staged
```

### Configurar hooks

```bash
yarn husky install
yarn husky add .husky/pre-commit "yarn lint:standards"
```

### Con lint-staged

```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "yarn frontend-standards-checker --zones",
      "yarn eslint --fix",
      "git add"
    ]
  }
}
```

## 🚀 CI/CD con Yarn

### GitHub Actions

```yaml
name: Standards Check
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

### Dockerfile con Yarn

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn lint:standards:report
```

## 💡 Tips para Yarn

### Acelerar instalación

```bash
# Usar cache local
yarn config set cache-folder ~/.yarn-cache

# Instalar en paralelo
yarn install --frozen-lockfile --silent

# Verificar integridad
yarn check --integrity
```

### Configurar registry para paquetes privados

```bash
# Configurar registry
yarn config set registry https://registry.yarnpkg.com/

# Para paquetes scoped
yarn config set @tu-empresa:registry https://npm.tu-empresa.com/
```

### Debugging con Yarn

```bash
# Ver configuración
yarn config list

# Ver dependencias
yarn list --depth=0

# Verificar por qué se instaló un paquete
yarn why frontend-standards-checker

# Ejecutar con logs detallados
yarn lint:standards --verbose 2>&1 | tee debug.log
```

## 🛠️ Configuración Avanzada para Yarn

### Yarn 2+ (Berry)

```bash
# Si usas Yarn 2+
yarn dlx frontend-standards-checker

# O agregar al .yarnrc.yml
yarnPath: .yarn/releases/yarn-3.6.4.cjs
nodeLinker: node-modules
```

### PnP (Plug'n'Play) Support

```javascript
// Si usas PnP, asegúrate de que el config sea compatible
export default [
  // Tus reglas aquí
];
```

## ⚡ Troubleshooting Yarn

### Errores comunes

```bash
# Cache corrupto
yarn cache clean

# Lockfile desactualizado
rm yarn.lock && yarn install

# Permisos en Windows
yarn config set prefix ~/.yarn

# Conflictos de versiones
yarn install --check-files

# Error de formato Git (MUY COMÚN)
# ❌ INCORRECTO: yarn add --dev git+https://...
# ✅ CORRECTO:   yarn add --dev package-name@https://...
yarn add --dev frontend-standards-checker@https://github.com/juandape/frontend-standards.git

# Error "command not found" en monorepos
# Solución 1: Usar yarn exec
yarn exec frontend-standards-checker --help

# Solución 2: Reinstalar dependencias
yarn install

# Solución 3: Verificar instalación
yarn list frontend-standards-checker
```

### Performance

```bash
# Usar instalación offline
yarn install --offline

# Verificar tiempos
yarn install --verbose

# Usar paralelismo
yarn config set network-concurrency 16
```

---

**¡Yarn + Frontend Standards = Código de calidad! 🧶✨**
