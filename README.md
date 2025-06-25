# 🛡️ Frontend Standards Checker

Una herramienta completa para validar y mantener estándares de frontend en proyectos React, Angular, Vue y Vanilla.

## 🚀 **Instalación**

### **Opción 1: Estándar (npm/yarn/pnpm)**
```bash
# Con npm
npm install frontend-standards-checker

# Con yarn 
yarn add frontend-standards-checker

# Con pnpm
pnpm add frontend-standards-checker
```

### **Opción 2: Con Ejecutables Standalone (Bun)**
```bash
# Instalar Bun (si no lo tienes)
curl -fsSL https://bun.sh/install | bash

# Instalar el paquete
bun add frontend-standards-checker
# O con tu package manager preferido después de instalar Bun
```

## 📋 **Compatibilidad**

| Funcionalidad | npm/yarn/pnpm | Bun |
|---|:---:|:---:|
| ✅ Validación de estándares | ✅ | ✅ |
| ✅ Configuración personalizada | ✅ | ✅ |
| ✅ Reportes detallados | ✅ | ✅ |
| ✅ Integración CI/CD | ✅ | ✅ |
| 📦 Ejecutables standalone | ❌ | ✅ |
| ⚡ Rendimiento máximo | ⭐ | ⭐⭐⭐ |

## 🏃 **Uso**

### **Ejecución Básica (Todos los Package Managers)**
```bash
# Directamente
npx frontend-standards-checker --help

# Con script del proyecto
node launcher.cjs --help

# Si está en tu PATH
frontend-standards-checker --help
```

### **Ejecución con Ejecutables (Solo Bun)**
```bash
# Auto-detecta tu plataforma
./dist/bin/frontend-standards-[platform]
```

### **Comandos Principales**
```bash
# Verificar proyecto actual
npx frontend-standards-checker

# Con configuración específica
npx frontend-standards-checker --config ./custom-config.js

# Modo verbose
npx frontend-standards-checker --verbose

# Solo errores
npx frontend-standards-checker --quiet
```

## ⚙️ **Configuración**

Crea un archivo `checkFrontendStandards.config.js` en la raíz de tu proyecto:

```javascript
export default {
  projectType: 'react', // 'react' | 'angular' | 'vue' | 'vanilla'
  
  structure: {
    enforceStructure: true,
    allowedDirectories: ['src', 'public', 'assets'],
    disallowedPatterns: ['temp/', '*.tmp']
  },
  
  naming: {
    files: 'kebab-case',    // 'kebab-case' | 'camelCase' | 'PascalCase'
    directories: 'kebab-case',
    components: 'PascalCase'
  },
  
  zones: {
    'src/components': {
      allowedExtensions: ['.tsx', '.ts'],
      naming: 'PascalCase',
      maxDepth: 3
    },
    'src/utils': {
      allowedExtensions: ['.ts'],
      naming: 'camelCase'
    }
  }
};
```

## 🔧 **Desarrollo y Build**

### **Para Usuarios (Solo uso)**
```bash
# Instalar y usar
npm install frontend-standards-checker
npx frontend-standards-checker --help
```

### **Para Desarrolladores (Contribuir)**
```bash
# Clonar repositorio
git clone <repo-url>
cd frontend-standards

# Instalar dependencias
npm install
# O con Bun para funcionalidad completa
bun install

# Compilar TypeScript
npm run build:ts

# Crear ejecutables (requiere Bun)
npm run build:cross-platform
```

## 🎯 **Scripts Disponibles**

```bash
# Compilación
npm run build              # Build inteligente (Bun o TypeScript)
npm run build:ts           # Solo TypeScript
npm run build:cross-platform  # Ejecutables multiplataforma

# Ejecución
npm start                  # Ejecutar con launcher
npm run dev                # Modo desarrollo
npm run test:executable    # Probar funcionamiento

# Utilidad
npm run check              # Validar proyecto actual
```

## 🔍 **Detección Automática de Entorno**

El launcher detecta automáticamente:

1. **🍞 Ejecutables Bun**: Máximo rendimiento
2. **📝 TypeScript compilado**: Compatibilidad estándar
3. **🏃 TypeScript directo**: Con ts-node/tsx

## 📊 **Ejemplos de Uso**

### **CI/CD Pipeline**
```yaml
# .github/workflows/frontend-standards.yml
- name: Check Frontend Standards
  run: |
    npm install frontend-standards-checker
    npx frontend-standards-checker --quiet
```

### **Pre-commit Hook**
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npx frontend-standards-checker"
    }
  }
}
```

### **Integración npm scripts**
```json
{
  "scripts": {
    "lint:structure": "npx frontend-standards-checker",
    "pre-build": "npm run lint:structure"
  }
}
```

## 🐛 **Solución de Problemas**

### **Error: Command not found**
```bash
# Verificar instalación
npm list frontend-standards-checker

# Reinstalar si es necesario
npm install frontend-standards-checker
```

### **Error: TypeScript runtime not available**
```bash
# Instalar ts-node
npm install -g ts-node typescript

# O alternativa más rápida
npm install -g tsx
```

### **Builds fallan sin Bun**
```bash
# Instalar Bun para funcionalidad completa
curl -fsSL https://bun.sh/install | bash

# O usar solo TypeScript
npm run build:ts
```

## 📚 **Documentación**

- [📖 Guía Completa](./docs/COMPLETE-GUIDE.md)
- [🔧 Ejemplos y Casos de Uso](./docs/EXAMPLES.md)
- [📋 Sistema de Configuración](./docs/CONFIGURATION.md)
- [📋 Changelog](./docs/CHANGELOG.md)

## 🤝 **Contribuir**

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📄 **Licencia**

MIT License - ver [LICENSE](LICENSE) para detalles.
