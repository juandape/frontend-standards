# 🔧 Solución para "command not found: frontend-standards-checker"

## 🎯 Problema Común en Monorepos

Si ves este error en un monorepo con Yarn workspaces:

```bash
yarn lint:standards
command not found: frontend-standards-checker
```

## ✅ Soluciones (en orden de efectividad)

### 1. **Usar yarn exec (Solución más rápida)**

```bash
# En lugar de:
yarn lint:standards

# Usa:
yarn exec frontend-standards-checker

# Con argumentos:
yarn exec frontend-standards-checker --zones src
yarn exec frontend-standards-checker --verbose
```

### 2. **Actualizar scripts en package.json**

```json
{
  "scripts": {
    "lint:standards": "yarn exec frontend-standards-checker",
    "lint:standards:zones": "yarn exec frontend-standards-checker --zones",
    "lint:standards:verbose": "yarn exec frontend-standards-checker --verbose",
    "lint:standards:report": "yarn exec frontend-standards-checker --output standards-report.json"
  }
}
```

### 3. **Verificar instalación**

```bash
# Verificar que está instalado
yarn list frontend-standards-checker

# Si no aparece, reinstalar
yarn add --dev frontend-standards-checker@https://github.com/juandape/frontend-standards.git
```

### 4. **Limpiar e instalar de nuevo**

```bash
# Limpiar cache
yarn cache clean

# Reinstalar dependencias
rm -rf node_modules
yarn install
```

### 5. **Usar npx como alternativa**

```bash
# Si yarn exec no funciona, prueba npx
npx frontend-standards-checker
npx frontend-standards-checker --zones src
```

## 🏢 Para Monorepos Específicamente

### Opción A: Instalar en el workspace root

```bash
# Desde la raíz del monorepo
yarn add --dev frontend-standards-checker@https://github.com/juandape/frontend-standards.git
```

### Opción B: Instalar en workspace específico

```bash
# Para un workspace específico
yarn workspace my-app add --dev frontend-standards-checker@https://github.com/juandape/frontend-standards.git

# Luego usar:
yarn workspace my-app exec frontend-standards-checker
```

### Opción C: Script global en el monorepo

```json
{
  "scripts": {
    "lint:standards:all": "yarn workspaces foreach run lint:standards",
    "lint:standards:app": "yarn workspace my-app exec frontend-standards-checker"
  }
}
```

## 🚀 Comandos que funcionan garantizado:

```bash
# Estos comandos SIEMPRE funcionan:
yarn exec frontend-standards-checker --help
npx frontend-standards-checker --help

# Para validar tu proyecto:
yarn exec frontend-standards-checker
yarn exec frontend-standards-checker --zones src components
yarn exec frontend-standards-checker --verbose
```

## 🔍 Debug: Verificar qué está pasando

```bash
# Ver dónde está instalado
yarn list frontend-standards-checker

# Ver todos los binarios disponibles
yarn bin

# Ver configuración de Yarn
yarn config list

# Ver estructura de workspaces
yarn workspaces list
```

## 💡 Pro Tip

Si trabajas frecuentemente con este comando, crea un alias:

```bash
# En tu .bashrc o .zshrc
alias fsc="yarn exec frontend-standards-checker"

# Luego usa:
fsc --zones src
fsc --verbose
```

---

**¡Problema resuelto!** 🎉 Usa `yarn exec frontend-standards-checker` y funcionará perfecto.
