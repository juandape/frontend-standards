# 📋 Changelog - Frontend Standards Checker

## [v3.0.0] - 2025-06-25

### 🚀 MAJOR: Migration to TypeScript + Bun Executables

#### ✨ **New Features**
- **🍞 Bun Standalone Executables**: Create platform-specific executables that don't require Node.js
- **🎯 Smart Platform Launcher**: Automatically detects platform and runs the correct binary
- **📦 Post-install Build**: Executables are built automatically after npm install
- **🌍 Cross-platform Support**: Linux, Windows, macOS (x64 + ARM64)

#### 🔄 **Breaking Changes**
- **TypeScript Migration**: Complete migration from JavaScript to TypeScript
- **New Entry Point**: `launcher.cjs` as main launcher (replaces direct CLI calls)
- **Build System**: Bun compilation replaces Node.js runtime for better performance
- **Directory Structure**: Organized docs/ and scripts/ directories

#### 🏗️ **Architecture**
- **Strong Typing**: Complete TypeScript implementation with interfaces
- **Modular Design**: Separated types, core modules, and utilities
- **Build Optimization**: Minified executables with source maps
- **Clean Repository**: Executables excluded from Git (built post-install)

#### 🛠️ **Developer Experience**
- **Simple Commands**: `bun run build:executable` for local builds
- **Cross-compilation**: `bun run build:cross-platform` for all platforms
- **Auto-detection**: Launcher handles platform detection automatically
- **Fallback Build**: On-demand executable creation if missing

#### 📚 **Updated Documentation**
- **Clean Structure**: Documentation moved to `docs/` directory
- **Updated Instructions**: All references updated for new build system
- **Installation Scripts**: Moved to `scripts/` directory for organization

#### 🗂️ **File Changes**
- **Added**: `launcher.cjs`, `tsconfig.json`, type definitions
- **Reorganized**: `docs/`, `scripts/` directories
- **Removed**: Makefile, obsolete installation files
- **Migrated**: All `.js` files to `.ts` with proper typing

---

## [v2.0.1] - 2025-06-25

### 🔧 Fixes
- **Bun Installation**: Fixed installation format for Bun compatibility
- **Documentation**: Updated troubleshooting guides

## [v2.0.0] - 2025-06-24

### 🚀 Major Release
- **Modular Architecture**: Complete rewrite with modular design
- **Native CLI**: Command-line interface with multiple options
- **ES Modules**: Migration to ES modules

## [v1.0.0] - 2025-06-20

### 🎉 Initial Release
- **Basic Validator**: Monolithic script with basic validation rules

---

### 🚀 **Quick Start (v3.0.0+)**

```bash
# Install and use automatically
npm install frontend-standards-checker
npx frontend-standards --help

# Build standalone executable
git clone <repo>
cd frontend-standards
bun install && bun run build:executable
./launcher.cjs --version
```

### 📦 **Distribution Options**

- **📦 NPM Package**: Traditional installation with automatic build
- **🍞 Standalone Executable**: Single file, no dependencies required
- **🔧 Development**: Full source code with TypeScript compilation

### 🆘 **Support**

For issues with v3.0.0+:
1. Ensure Bun is installed for executable builds
2. Use `bun run build:cross-platform` if platform detection fails
3. Check `dist/bin/` for generated executables
4. Run with `--verbose` for detailed output
