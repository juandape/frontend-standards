# Frontend Standards Checker Complete Configuration Guide

This guide contains all possible examples for configuring custom rules in **Frontend Standards Checker**.

> **⚠️ Important**: This version includes advanced validators, enriched error messages and precision improvements. If you have a previous version, update using the recommended installation.

## 🆕 New Features

- **🆕 `--all-files` Flag**: New CLI option that forces validation of all project files, overriding `onlyChangedFiles` configuration and Git staging
- **🆕 Improved Option Precedence**: CLI flags now take precedence over file configuration for greater flexibility
- **🆕 Advanced Debug Mode**: New `--debug` option that shows detailed information about the file scanning process
- Advanced validators with enriched messages (line, folder, function)
- Improvements in component and hooks rule precision
- Clearer and more useful error messages for quick debugging
- Full compatibility with React Native and monorepos
- Updated documentation and examples
- `logs-standards-validations` reports folder to store generated reports with date, time and last collaborator who modified the file
- HTML viewer for validation reports
- Selective validation: `onlyZone` option to validate only specific modules
- Efficient validation: by default only validates staged files for commit (`onlyChangedFiles: true`)
- Native TypeScript: strict types, autocompletion and better development experience
- Smart installation: detects React Native and adapts installation automatically
- Compatibility improvements: robust installation for projects with complex dependencies (React Native, monorepos with private dependencies)
- Documentation improvements: updated examples and guides to facilitate integration
- New validation rules: additional rules to improve code quality
- CSV export: possibility to export reports to CSV format for external analysis

### 🎯 Use cases for the new `--all-files` flag

- **CI/CD**: Complete project validation in continuous integration pipelines
- **Pre-release**: Complete review before important releases
- **Onboarding**: Complete validation of legacy projects or new developers
- **Troubleshooting**: Debug issues in specific files that are not staged
- **Audits**: Complete code quality reviews

---

### 🔎 Enriched error message example

```log
📄 /src/components/Calendar/index.tsx:23
   Rule: Component function name match
   Issue: The main function in index.tsx must have the same name as its containing folder. Folder: 'Calendar', Function: 'CalendarPicker' - Names do not match exactly.
```

Messages now include line number, folder name and function, facilitating quick correction.

---

## 📋 Table of Contents

- [Frontend Standards Checker Complete Configuration Guide](#frontend-standards-checker-complete-configuration-guide)
  - [🆕 New Features](#-new-features)
    - [🎯 Use cases for the new `--all-files` flag](#-use-cases-for-the-new---all-files-flag)
    - [🔎 Enriched error message example](#-enriched-error-message-example)
  - [📋 Table of Contents](#-table-of-contents)
  - [� Instalación Rápida](#-instalación-rápida)
    - [Instalación estándar (Recomendado)](#instalación-estándar-recomendado)
    - [Scripts in package.json](#scripts-in-packagejson)
    - [Copy installation guide and configuration file](#copy-installation-guide-and-configuration-file)
  - [🚀 Usage Instructions](#-usage-instructions)
  - [📁 Zone Configuration](#-zone-configuration)
    - [Include packages/ zones](#include-packages-zones)
    - [Add custom zones](#add-custom-zones)
    - [Complete zone configuration](#complete-zone-configuration)
  - [Section 1: Adding Simple Rules](#section-1-adding-simple-rules)
  - [Section 2: Modifying Existing Rules](#section-2-modifying-existing-rules)
  - [Section 3: Completely Replacing Rules](#section-3-completely-replacing-rules)
  - [Section 4: Advanced Conditional Rules](#section-4-advanced-conditional-rules)
  - [Section 5: Custom Zones](#section-5-custom-zones)
    - [📋 Available Custom Zones](#-available-custom-zones)
  - [Section 6: Rules by File Type](#section-6-rules-by-file-type)
  - [Section 7: Architecture and Best Practices](#section-7-architecture-and-best-practices)
  - [📋 Useful Commands](#-useful-commands)
    - [Main Commands (Post-installation)](#main-commands-post-installation)
    - [Advanced CLI Options](#advanced-cli-options)
  - [🚀 Detailed CLI Options Guide](#-detailed-cli-options-guide)
    - [File Validation Options](#file-validation-options)
      - [`--all-files` (Recommended for specific cases)](#--all-files-recommended-for-specific-cases)
      - [`--only-changed-files` (Default)](#--only-changed-files-default)
    - [Information and Debug Options](#information-and-debug-options)
      - [`--debug`](#--debug)
      - [`--verbose`](#--verbose)
    - [Zone and Configuration Options](#zone-and-configuration-options)
      - [`--zones <zone1> <zone2>`](#--zones-zone1-zone2)
      - [`--config <path>`](#--config-path)
    - [Practical Use Cases](#practical-use-cases)
      - [🔄 Daily Development](#-daily-development)
      - [🚀 Pre-Release](#-pre-release)
      - [🐛 Troubleshooting](#-troubleshooting)
      - [🏗️ CI/CD](#️-cicd)
      - [📊 Quality Audit](#-quality-audit)
  - [🎯 Active Example to Test](#-active-example-to-test)
  - [💡 Tips](#-tips)
  - [📋 Complete List of Checks](#-complete-list-of-checks)
    - [🔍 Code Base Rules](#-code-base-rules)
    - [📁 File Structure Rules](#-file-structure-rules)
    - [🏗️ Architecture Rules](#️-architecture-rules)
    - [📝 Naming Rules](#-naming-rules)
    - [🔧 React Component Rules](#-react-component-rules)
    - [🎨 Style Rules](#-style-rules)
    - [📚 Documentation Rules](#-documentation-rules)
    - [⚙️ Configuration Rules](#️-configuration-rules)
  - [Current Statistics Summary](#current-statistics-summary)
  - [Standard Directory Structure](#standard-directory-structure)

## � Instalación Rápida

### Instalación estándar (Recomendado)

```bash
# Con Yarn
yarn add --dev frontend-standards-checker@latest

# Con NPM
npm install --save-dev frontend-standards-checker@latest
```

### Scripts in package.json

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

**Important note:**

- Always install from npm using the above commands.
- Do not use local tarballs or workspace references to avoid installation errors.
- The package includes all necessary files and is compatible with monorepos, Next.js, Vite and React Native.

### Copy installation guide and configuration file

```bash
npx frontend-standards-init
```

This will copy the complete guide and the `checkFrontendStandards.config.js` file to your project root.

## 🚀 Usage Instructions

1. Use the command `npx frontend-standards-init`
   - This command will create the configuration file and copy the complete installation guide.
2. Copy the code from the section you need (only one at a time)
3. Modify the rules according to your needs
4. Run the script normally

## 📁 Zone Configuration

**By default, `packages/` zones are excluded** from validation. Only `apps/` zones are automatically validated.

### Include packages/ zones

```javascript
export default {
  zones: {
    includePackages: true, // Include packages/ validation
  },
  rules: [
    // Your custom rules here
  ],
}
```

### Add custom zones

```javascript
export default {
  zones: {
    includePackages: false, // Exclude packages/ (default)
    customZones: ['shared', 'tools', 'libs'], // Additional zones to validate
  },
  rules: [
    // Your custom rules here
  ],
}
```

### Complete zone configuration

```javascript
export default {
  zones: {
    includePackages: true, // Include packages/
    customZones: ['shared', 'docs', 'scripts'], // Additional zones
  },
  rules: [
    // Your custom rules here
  ],
}
```

## Section 1: Adding Simple Rules

**The most common option** - To add custom rules to existing ones:

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

## Section 2: Modifying Existing Rules

To modify existing rules and add new ones using a function:

```javascript
export default function (defaultRules) {
  // Add new rules
  const customRules = [
    {
      name: 'No hardcoded URLs',
      check: (content) => /https?:\/\/[^\s"']+/.test(content),
      message: 'No hardcoded URLs allowed. Use environment variables or constants.',
    },
  ]

  // Modify an existing rule
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

## Section 3: Completely Replacing Rules

To use only your custom rules:

```javascript
export default {
  merge: false, // If false, completely replaces default rules
  rules: [
    {
      name: 'Custom TypeScript rule',
      check: (content) => {
        // More complex rule that analyzes multiple patterns
        const hasAny = /:\s*any\b/.test(content)
        const hasUnknown = /:\s*unknown\b/.test(content)
        return hasAny && !hasUnknown
      },
      message: 'Prefer "unknown" over "any" for better type safety.',
    },
    {
      name: 'React functional components only',
      check: (content) => {
        // Only in .tsx files
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
            if (foundNonImport) return true // Import after code
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

## Section 4: Advanced Conditional Rules

For rules that only apply to certain files:

```javascript
export default function (defaultRules) {
  return [
    ...defaultRules,
    {
      name: 'React hooks rules',
      check: (content, filePath) => {
        // Only apply to hook files
        if (!filePath.includes('.hook.')) return false

        // Check that React hooks are at the top
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

        // Test files must have describe() and it()
        return !(/describe\s*\(/.test(content) && /it\s*\(/.test(content))
      },
      message: 'Test files must use describe() and it() blocks.',
    },
  ]
}
```

## Section 5: Custom Zones

To add validations for specific custom zones:

```javascript
export default [
  // ---------------------------------------------------------------
  // ZONE: UTILS - Utility files
  // ---------------------------------------------------------------
  {
    name: 'Custom zone structure - utils',
    check: (content, filePath) => {
      // Only apply in the 'utils' zone
      if (!filePath.includes('/utils/')) return false

      // Validate that files in utils follow a specific pattern
      const fileName = filePath.split('/').pop()
      if (!fileName.endsWith('.util.ts')) {
        return true // Error: doesn't follow pattern
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
        // Validate naming: must be camelCase.util.ts
        if (!/^[a-z][a-zA-Z0-9]*\.util\.ts$/.test(fileName)) {
          return true
        }
      }
      return false
    },
    message: 'Files in utils/ must be camelCase and end with .util.ts',
  },

  // ---------------------------------------------------------------
  // ZONE: VALIDATORS - Validation files
  // ---------------------------------------------------------------
  {
    name: 'Custom zone structure - validators',
    check: (content, filePath) => {
      if (!filePath.includes('/validators/')) return false

      const fileName = filePath.split('/').pop()
      // Validators must follow the pattern name.validator.ts
      if (!fileName.endsWith('.validator.ts')) {
        return true
      }

      // And must export a validate function
      if (!content.includes('export') || !content.includes('validate')) {
        return true
      }

      return false
    },
    message: 'Files in validators/ must end with .validator.ts and export a validate function',
  },

  // ---------------------------------------------------------------
  // ZONA: API ROUTES - API routes
  // ---------------------------------------------------------------
  {
    name: 'Custom zone - API routes',
    check: (content, filePath) => {
      // For an API routes zone
      if (!filePath.includes('/api/routes/')) return false

      const fileName = filePath.split('/').pop()

      // Routes must follow the pattern name.route.ts
      if (!fileName.endsWith('.route.ts')) {
        return true
      }

      // Must export a router
      if (!content.includes('export') || !content.includes('router')) {
        return true
      }

      return false
    },
    message: 'API route files must end with .route.ts and export a router',
  },

  // ---------------------------------------------------------------
  // ZONA: MIDDLEWARE - Application middleware
  // ---------------------------------------------------------------
  {
    name: 'Custom zone - Middleware',
    check: (content, filePath) => {
      if (!filePath.includes('/middleware/')) return false

      const fileName = filePath.split('/').pop()

      // Middleware must follow the pattern name.middleware.ts
      if (!fileName.endsWith('.middleware.ts')) {
        return true
      }

      // Must export a middleware function
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
  // ZONA: MODELS - Data Base Models
  // ---------------------------------------------------------------
  {
    name: 'Custom zone - Database models',
    check: (content, filePath) => {
      if (!filePath.includes('/models/')) return false

      const fileName = filePath.split('/').pop()

      // Models must follow the pattern Name.model.ts (PascalCase)
      if (!/^[A-Z][a-zA-Z0-9]*\.model\.ts$/.test(fileName)) {
        return true
      }

      // Must export a class or interface
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
  // ZONA: CONFIG - Config files
  // ---------------------------------------------------------------
  {
    name: 'Custom zone - Config files',
    check: (content, filePath) => {
      if (!filePath.includes('/config/')) return false

      const fileName = filePath.split('/').pop()

      // Config files must follow the pattern name.config.ts
      if (!fileName.endsWith('.config.ts')) {
        return true
      }

      // Must export a config object
      if (!content.includes('export') || !content.includes('config')) {
        return true
      }

      return false
    },
    message: 'Config files must end with .config.ts and export a config object',
  },

  // ---------------------------------------------------------------
  // ZONA: SERVICES - Application services
  // ---------------------------------------------------------------
  {
    name: 'Custom naming - services',
    check: (content, filePath) => {
      const pathParts = filePath.split('/')
      const fileName = pathParts.pop()
      const parentDir = pathParts.pop()

      if (parentDir === 'services') {
        // Services must be PascalCase.service.ts
        if (!/^[A-Z][a-zA-Z0-9]*\.service\.ts$/.test(fileName)) {
          return true
        }
      }
      return false
    },
    message: 'Files in services/ must be PascalCase and end with .service.ts',
  },

  // ---------------------------------------------------------------
  // ZONA: FEATURES - Complete structure of features
  // ---------------------------------------------------------------
  {
    name: 'Custom zone complete structure',
    check: (content, filePath) => {
      // Validate that the 'features' zone has the correct structure
      if (!filePath.includes('/features/')) return false

      const pathParts = filePath.split('/')
      const featuresIndex = pathParts.indexOf('features')

      if (featuresIndex >= 0 && pathParts.length > featuresIndex + 1) {
        const featureName = pathParts[featuresIndex + 1]
        const requiredDirs = ['components', 'hooks', 'services', 'types']

        // Check that the feature has the required directories
        // (This is a simplified validation, in a real case you would need to
        // check for the existence of the directories)
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
  // ZONA: ARCHITECTURE RESTRICTIONS BY LAYERS
  // ---------------------------------------------------------------
  {
    name: 'API layer restrictions',
    check: (content, filePath) => {
      // Only in service/API files
      if (!filePath.includes('/services/') && !filePath.includes('/api/')) return false

      // Do not allow imports of UI components in the API layer
      return /import.*from.*['"](\.\.\/)*components/.test(content)
    },
    message: 'API/Service layer should not import UI components.',
  },
]
```

### 📋 Available Custom Zones

| Zone           | File Pattern         | Requirements                        |
| -------------- | -------------------- | ----------------------------------- |
| **Utils**      | `name.util.ts`       | camelCase                           |
| **Validators** | `name.validator.ts`  | Export `validate` function          |
| **API Routes** | `name.route.ts`      | Export `router`                     |
| **Middleware** | `name.middleware.ts` | Export middleware function          |
| **Models**     | `Name.model.ts`      | PascalCase + export class/interface |
| **Config**     | `name.config.ts`     | Export config object                |
| **Services**   | `Name.service.ts`    | PascalCase                          |
| **Features**   | Complete structure   | Required subdirectories             |

## Section 6: Rules by File Type

Examples for specific file types:

```javascript
export default [
  {
    name: 'React component structure',
    check: (content, filePath) => {
      if (!filePath.endsWith('.tsx') || !content.includes('export')) return false

      // React components must have PropTypes or TypeScript interfaces
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

      // Custom hooks must have explicit return type
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

      // Styled components must follow specific naming
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

## Section 7: Architecture and Best Practices

Advanced rules for maintaining good architecture:

```javascript
export default [
  {
    name: 'No circular dependencies',
    check: (content, filePath) => {
      // Detect possible circular dependencies
      const imports = content.match(/import.*from\s+['"]([^'"]+)['"]/g) || []
      const currentDir = filePath.split('/').slice(0, -1).join('/')

      return imports.some((imp) => {
        const importPath = imp.match(/from\s+['"]([^'"]+)['"]/)[1]
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
          // Check if import path leads back to current directory
          // This is a simplified validation
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
      return lines > 200 // Components should not have more than 200 lines
    },
    message: 'Component is too large (>200 lines). Consider breaking it into smaller components.',
  },
  {
    name: 'Hook dependency rules',
    check: (content, filePath) => {
      if (!filePath.includes('.hook.')) return false

      // Hooks should not have too many external dependencies
      const imports = content.match(/import.*from/g) || []
      return imports.length > 10
    },
    message: 'Hook has too many dependencies. Consider simplifying or breaking it down.',
  },
  {
    name: 'Barrel export validation',
    check: (content, filePath) => {
      if (!filePath.endsWith('index.ts') && !filePath.endsWith('index.tsx')) return false

      // Index files should only have exports
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

## 📋 Useful Commands

### Main Commands (Post-installation)

**For standard projects (monorepos, Next.js, etc.):**

```bash
# Standard validation (only staged files for commit)
npm run standards

# Validate specific zones (only staged files)
npm run standards:zones

# Verbose mode (more details, only staged files)
npm run standards:verbose

# Validate ALL project files
npm run standards:all

# Debug mode with detailed information
npm run standards:debug

# Initial project setup
npm run standards:init
```

**For React Native:**

```bash
# Standard validation (only staged files)
yarn standards

# Validate specific zones (only staged files)
yarn standards:zones

# Verbose mode (only staged files)
yarn standards:verbose

# Validate ALL files
yarn standards:all

# Debug mode for troubleshooting
yarn standards:debug

# Initial setup
yarn standards:init
```

### Advanced CLI Options

**New available options:**

```bash
# Check only specific staged files
frontend-standards-checker check --only-changed-files --zones src

# Check ALL files (ignores staging)
frontend-standards-checker check --all-files

# Check all files in specific zones
frontend-standards-checker check --all-files --zones src components

# Debug mode with detailed scan information
frontend-standards-checker check --debug --verbose

# Combination of options for CI/CD
frontend-standards-checker check --all-files --verbose --zones apps/web

# Skip specific validations
frontend-standards-checker check --skip-structure --skip-naming

# Custom configuration
frontend-standards-checker check --config ./custom-config.mjs
```

**`onlyChangedFiles` option precedence:**

1. **`--all-files`** (CLI) - Highest precedence, always processes all files
2. **`--only-changed-files`** (CLI) - Forces only staged files
3. **`onlyChangedFiles: false/true`** (file configuration)
4. **Default value** (`true` - only staged files)

**Practical use cases:**

```bash
# Daily development - only current changes
yarn standards

# Complete review before merge/release
yarn standards:all

# Debug specific issues
yarn standards -- --all-files --debug --zones src

# CI/CD - complete validation
yarn standards -- --all-files --verbose

# Quick validation of specific zone
yarn standards -- --zones components utils
```

yarn standards:init

````
### Advanced CLI Options

**For standard installation with arguments:**

```bash
# Validate specific zones (only staged files)
npm run standards -- --zones src components

# Validate only one specific zone
npm run standards -- --only-zone auth

# Validate ALL files (ignores staging and config)
npm run standards -- --all-files

# Validate all files in specific zones
npm run standards -- --all-files --zones src components

# Force only staged files (overrides config if set to false)
npm run standards -- --only-changed-files

# Verbose mode with all files
npm run standards -- --all-files --verbose

# Debug mode with custom configuration
npm run standards -- --all-files --debug --config my-config.js
````

**For React Native (updated commands):**

```bash
# Only staged files (fast for development)
yarn standards

# Complete validation of the entire project
yarn standards -- --all-files

# Validate only src/ completely
yarn standards -- --all-files --zones src

# Debug mode for troubleshooting
yarn standards -- --all-files --debug --verbose
```

---

## 🚀 Detailed CLI Options Guide

### File Validation Options

#### `--all-files` (Recommended for specific cases)

**Description**: Forces validation of ALL project files, ignoring Git staging and the `onlyChangedFiles` configuration.

**When to use**:

- ✅ **CI/CD**: Complete validation in pipelines
- ✅ **Pre-release**: Full review before major releases
- ✅ **Audits**: Comprehensive code quality evaluation
- ✅ **Onboarding**: Validation of new or legacy projects
- ✅ **Troubleshooting**: Debug files that are not staged

**Examples**:

```bash
# Complete project validation
frontend-standards-checker check --all-files

# Full validation with detailed information
frontend-standards-checker check --all-files --verbose --debug

# Complete validation of specific zones
frontend-standards-checker check --all-files --zones src components utils
```

#### `--only-changed-files` (Default)

**Description**: Validates only the files staged for commit in Git.

**When to use**:

- ✅ **Daily development**: Fast validation of current changes
- ✅ **Pre-commit hooks**: Automatic validation before commits
- ✅ **Incremental development**: Efficient validation of specific changes

**Examples**:

```bash
# Default behavior (no flag needed)
frontend-standards-checker check

# Explicitly force (useful if config has onlyChangedFiles: false)
frontend-standards-checker check --only-changed-files

# With specific zones
frontend-standards-checker check --only-changed-files --zones src
```

### Information and Debug Options

#### `--debug`

**Description**: Shows detailed information about the file scanning process, exclusion patterns, and validation engine decisions.

**Information provided**:

- 📁 Files found in each zone
- 🚫 Applied exclusion patterns
- ⚙️ Loaded configuration
- 📊 Processing statistics

**Example**:

```bash
# Debug with full validation
frontend-standards-checker check --all-files --debug --verbose
```

#### `--verbose`

**Description**: Displays detailed information during validation, including each processed file and statistics per zone.

**Works well with**:

- `--all-files` for complete reviews
- `--debug` for deep troubleshooting
- `--zones` for specific analysis

### Zone and Configuration Options

#### `--zones <zone1> <zone2>`

**Practical examples**:

```bash
# Validate multiple zones
frontend-standards-checker check --zones src components utils

# Validate a specific zone with all files
frontend-standards-checker check --all-files --zones src

# Validate specific apps in a monorepo
frontend-standards-checker check --zones apps/web apps/mobile
```

#### `--config <path>`

**Examples**:

```bash
# Custom configuration
frontend-standards-checker check --config ./config/custom-standards.mjs

# Environment-specific configuration
frontend-standards-checker check --config ./configs/production.mjs
```

### Practical Use Cases

#### 🔄 Daily Development

```bash
# Fast validation of current changes
yarn standards
```

#### 🚀 Pre-Release

```bash
# Complete validation before release
yarn standards -- --all-files --verbose
```

#### 🐛 Troubleshooting

```bash
# Full debug with maximum information
yarn standards -- --all-files --debug --verbose --zones src
```

#### 🏗️ CI/CD

```bash
# Complete validation for pipeline
frontend-standards-checker check --all-files --verbose
```

#### 📊 Quality Audit

```bash
# Full review with detailed report
frontend-standards-checker check --all-files --verbose > audit-report.log
```

---

## 🎯 Active Example to Test

```javascript
// Copy this code into checkFrontendStandards.config.js to start testing

export default [
  {
    name: 'No console statements',
    check: (content) => /console\.(log|warn|error|info|debug)/.test(content),
    message: 'Remove console statements before committing to production.',
  },
]
```

## 💡 Tips

1. **Start simple** - Use Section 1 to add basic rules
2. **One section at a time** - Don't mix different types of configuration
3. **Test gradually** - Add rules one by one to verify they work
4. **Customize messages** - Make messages clear and useful for your team
5. **Document your rules** - Add comments explaining why each rule is important

With this guide you can create any type of custom validation you need for your project!

## 📋 Complete List of Checks

This section contains **all the checks that the script currently performs**. These are the default rules that run when you execute `node checkFrontendStandards.mjs`.

### 🔍 Code Base Rules

| Rule                                    | Description                                                                                   | Severity |
| --------------------------------------- | --------------------------------------------------------------------------------------------- | -------- |
| **No console.log**                      | console.log usage is not allowed in production code                                           | ⚠️ Error |
| **No var**                              | Avoid using `var`, use `let` or `const`                                                       | ⚠️ Error |
| **No anonymous functions in callbacks** | Prefer arrow functions or named functions in callbacks                                        | ⚠️ Error |
| **No unused variables**                 | There should be no declared but unused variables (@typescript-eslint/no-unused-vars)          | ⚠️ Error |
| **No variable shadowing**               | There should be no variable shadowing (@typescript-eslint/no-shadow)                          | ⚠️ Error |
| **No unnecessary constructors**         | There should be no unnecessary empty constructors (@typescript-eslint/no-useless-constructor) | ⚠️ Error |
| **No inline styles**                    | Don't use inline styles, use separate style files                                             | ⚠️ Error |
| **No hardcoded data**                   | No hardcoded data (URLs, texts, configurations)                                               | ⚠️ Error |

### 📁 File Structure Rules

| Rule                    | Description                                     | Expected Pattern                 |
| ----------------------- | ----------------------------------------------- | -------------------------------- |
| **Folder structure**    | Validate minimum zone structure by type         | According to `DEFAULT_STRUCTURE` |
| **Src structure**       | Validate structure within `/src/`               | According to `SRC_STRUCTURE`     |
| **Tree structure**      | Validate ideal folder tree                      | According to `IDEAL_TREE`        |
| **Directory naming**    | Directories must follow camelCase or PascalCase | `camelCase` or `PascalCase`      |
| **Component structure** | Components must have specific structure         | `index.tsx` + subdirectories     |

### 🏗️ Architecture Rules

| Rule                      | Description                                          | Application                    |
| ------------------------- | ---------------------------------------------------- | ------------------------------ |
| **Enum outside of types** | Enums must be in `/types/` directories               | `.enum.ts` files               |
| **Hook file extension**   | Hooks must use correct extension (.ts/.tsx)          | According to JSX content       |
| **Asset naming**          | Assets must follow kebab-case                        | `service-error.svg`            |
| **Component hook naming** | Component hooks must use correct extension           | `.ts` if no JSX, `.tsx` if JSX |
| **Function naming**       | Functions must follow camelCase                      | `getUserData`, `handleClick`   |
| **Interface naming**      | Exported interfaces must start with 'I' + PascalCase | `IButtonProps`, `IUserData`    |

### 📝 Naming Rules

| File Type      | Required Pattern                | Example                    | Location       |
| -------------- | ------------------------------- | -------------------------- | -------------- |
| **Components** | PascalCase + .tsx               | `UserProfile.tsx`          | `/components/` |
| **Hooks**      | use + PascalCase + .hook.ts/tsx | `useUserData.hook.ts`      | `/hooks/`      |
| **Constants**  | camelCase + .constant.ts        | `apiEndpoints.constant.ts` | `/constants/`  |
| **Helpers**    | camelCase + .helper.ts          | `formatDate.helper.ts`     | `/helpers/`    |
| **Types**      | camelCase + .type.ts            | `userProfile.type.ts`      | `/types/`      |
| **Styles**     | camelCase + .style.ts           | `userCard.style.ts`        | `/styles/`     |
| **Enums**      | camelCase + .enum.ts            | `userStatus.enum.ts`       | `/enums/`      |
| **Assets**     | kebab-case                      | `user-avatar.png`          | `/assets/`     |

### 🔧 React Component Rules

| Rule                       | Description                                          | Details                        |
| -------------------------- | ---------------------------------------------------- | ------------------------------ |
| **Component type naming**  | Type files must end in `.type.ts`                    | NOT `.types.ts`                |
| **Component style naming** | Style files must end in `.style.ts`                  | In `/styles/` directory        |
| **Component hook naming**  | Hooks must use correct extension based on content    | `.ts` if no JSX, `.tsx` if JSX |
| **Function naming**        | Functions must follow camelCase                      | `getUserData`, `handleClick`   |
| **Interface naming**       | Exported interfaces must start with 'I' + PascalCase | `IButtonProps`, `IUserData`    |

### 🎨 Style Rules

| Rule                      | Description                         | Example                       |
| ------------------------- | ----------------------------------- | ----------------------------- |
| **Style naming**          | Style objects must end in 'Styles'  | `cardPreviewStyles`           |
| **Style property naming** | Style properties must be camelCase  | `backgroundColor`, `fontSize` |
| **Style file naming**     | Style files must end in `.style.ts` | `userCard.style.ts`           |

### 📚 Documentation Rules

| Rule                                    | Description                                                       | Application                    |
| --------------------------------------- | ----------------------------------------------------------------- | ------------------------------ |
| **Should have TSDoc comments**          | Exported functions and classes must have TSDoc comments           | Complex functions/classes      |
| **Missing comment in complex function** | Complex functions must have explanatory comments                  | Complexity > defined threshold |
| **Commented code**                      | There should be no commented code (actual code, not explanations) | Smart detection                |

### ⚙️ Configuration Rules

| Rule                   | Description                                                        | Files          |
| ---------------------- | ------------------------------------------------------------------ | -------------- |
| **Naming**             | General naming validation according to file type                   | All files      |
| **Standard structure** | _(New)_ Validate structure according to `estructura standards.txt` | Entire project |

## Current Statistics Summary

Based on the latest script execution:

- **Total errors found**: 83
- **Zones validated**: apps/auth, apps/configuration, apps/personalization, apps/web
- **Most common rule**: Component type naming (33.7% of errors)
- **Top 5 issues**:
  1. Component type naming: 28 occurrences
  2. Naming: 24 occurrences
  3. Missing comment in complex function: 15 occurrences
  4. Component structure: 7 occurrences
  5. Should have TSDoc comments: 4 occurrences

## Standard Directory Structure

The script validates against this standard structure defined in `estructura standards.txt`:

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
