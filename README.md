# Frontend Standards Checker

A scalable and modular tool for validating frontend standards in JavaScript/TypeScript projects. **Version with improved validators, enriched error messages and full compatibility for React Native. HTML report visualization.**

## 🚀 Features

- **Modular architecture**: Each component has a specific responsibility
- **Scalable**: Easy to add new rules and validators
- **Configurable**: Flexible configuration through configuration file
- **Friendly CLI**: Command line interface with detailed options and flag precedence
- **Detailed reports**: Generates comprehensive reports with sections for errors, warnings and info
- **Monorepo support**: Automatically detects and validates multiple zones
- **🆕 Granular file control**: `--all-files` flag for complete validation vs `--only-changed-files` for incremental validation
- **🆕 Options precedence**: CLI flags take precedence over file configuration
- **🆕 Advanced debug mode**: `--debug` option with detailed information about the scanning process
- **🆕 Selective validation**: `onlyZone` option to validate only specific modules
- **🆕 Efficient validation**: By default only validates files staged for commit (`onlyChangedFiles: true`)
- **🆕 Native TypeScript**: Strict types, autocompletion and better development experience
- **🆕 Smart installation**: Detects React Native and adapts installation automatically
- **🆕 Advanced validators**: Enriched error messages with line number, folder name and function for key rules (e.g. component name matching)
- **🆕 Precision improvements**: More precise validation for components, hooks and folder structure
- **🆕 Init command**: `frontend-standards-init` to copy configuration files
- **🆕 Multi-environment support**: Automatic configuration for different development environments
- **🆕 React Native support**: Optimized configuration for React Native projects, including native folder exclusions and specific rules
- **🆕 Yarn PnP support**: Compatible with projects using Yarn Plug'n'Play
- **🆕 Private dependencies support**: Alternative installation for projects with private registries
- **🆕 Compatibility improvements**: Robust installation for projects with complex dependencies (React Native, monorepos with private dependencies)
- **🆕 Documentation improvements**: Updated examples and guides to facilitate integration
- **🆕 New validation rules**: Additional rules to improve code quality
- **🆕 Report generation**: `logs-standards-validations` folder to store generated reports with date and time and last collaborator who modified the file
- **🆕 HTML viewer**: Tool to visualize validation reports in HTML format
- **🆕 CSV export**: Possibility to export reports to CSV format for external analysis

## 📦 Quick Installation

### Standard installation (Recommended)

```bash
# With Yarn
yarn add --dev frontend-standards-checker@latest

# With NPM
npm install --save-dev frontend-standards-checker@latest
```

### Scripts in package.json

```json
{
  "scripts": {
    "standards": "frontend-standards-checker check",
    "standards:zones": "frontend-standards-checker check --zones",
    "standards:verbose": "frontend-standards-checker check --verbose",
    "standards:all": "frontend-standards-checker check --all-files",
    "standards:debug": "frontend-standards-checker check --debug --verbose",
    "standards:init": "frontend-standards-checker init"
  }
}
```

**Important note:**

- Always install from npm using the commands above.
- Don't use local tarballs or workspace references to avoid installation errors.

⚠️ **Important:**

Import only from the main entry point (`frontend-standards-checker`) or from modules explicitly exported in the `exports` section of `package.json`.
Never import from internal directories like `src/helpers` or `dist/src/helpers`, as this will cause import errors for directories not supported in Node.js ES Modules.
If you need to extend functionality, request explicit export of the required module.

- The package includes all necessary files and is compatible with monorepos, Next.js, Vite and React Native.

### Complete setup after installation

```bash
# Run this command to add the script and update .gitignore automatically
npx frontend-standards-checker init
# or
yarn frontend-standards-checker init
```

This will add the `standards` script to your package.json and update .gitignore with relevant files.

## 🚀 Quick Usage

### Main Commands

```bash
# Standard validation (only staged files for commit)
yarn standards        # or npm run standards

# Validate specific zones (only staged files)
yarn standards:zones  # or npm run standards:zones

# Verbose mode (more details, only staged files)
yarn standards:verbose  # or npm run standards:verbose

# Validate ALL project files (ignores staging)
yarn standards:all    # or npm run standards:all

# Debug mode with detailed information
yarn standards:debug  # or npm run standards:debug

# Setup initial project
yarn standards:init   # or npm run standards:init
```

## 📚 Complete Documentation

**For advanced configuration, practical examples and troubleshooting:**

👉 **[View Complete Configuration Guide](./checkFrontendStandards.COMPLETE-GUIDE.md)**
👉 **[View Detailed Installation Guide](./INSTALL-GUIDE.md)**

The complete guide includes:

- ✅ Step-by-step installation (npm and yarn)
- ⚙️ Configuration examples for React, Next.js, monorepos
- 🔧 Advanced rules and zones configuration
- 🐛 Troubleshooting and debug commands
- 📋 Complete list of available validations (60 rules total)
- 🆕 Configuration of `onlyChangedFiles` and `onlyZone`
- 🆕 Interaction between different configuration options
- 🆕 Updated severity levels (ERROR/WARNING/INFO)

#### Simplified configuration file checkFrontendStandards.config.js

```javascript
// checkFrontendStandards.config.js - Configuration for React Native
module.exports = {
  zones: { includePackages: false, customZones: ['src'] },
  extensions: ['.js', '.ts', '.jsx', '.tsx'],
  ignorePatterns: ['android', 'ios', 'node_modules'],
  onlyChangedFiles: false, // Validate all files
  rules: [
    // Custom rules specific for React Native
  ]
};
```

### Efficient Validation with onlyChangedFiles

By default, the tool now only validates files that are staged for commit:

```javascript
// checkFrontendStandards.config.js - This is the default behavior
export default {
  onlyChangedFiles: true, // Default is true
}
```

**Options to validate all files:**

```bash
# Option 1: CLI flag (recommended) - Overrides configuration
frontend-standards-checker check --all-files

# Option 2: CLI flag with specific zone
frontend-standards-checker check --all-files --zones src

# Option 3: Permanent configuration in config file
export default {
  onlyChangedFiles: false
}
```

**Options precedence:**

1. `--all-files` (CLI) - **Highest precedence**
2. `--only-changed-files` (CLI)
3. `onlyChangedFiles` (file configuration)
4. Default value (`true`)

**Practical examples:**

```bash
# Only staged files (default behavior)
yarn standards

# All files (useful for CI/CD or complete review)
yarn standards -- --all-files

# All files in specific zone
yarn standards -- --all-files --zones src components

# Force only staged files even if config says false
yarn standards -- --only-changed-files
```

### Rules Updated to ERROR

The following rules are now considered critical errors:

- **"No console.log"** - Prohibited use of console.log in production code
- **"No inline styles"** - Inline styles are prohibited, use CSS or styled-components

### Zone Validation

Validate only one specific zone, ignoring all others:

```javascript
// Validate only authentication module
export default {
  zones: { onlyZone: 'auth' }
};
```

```bash
# Validate specific zones with all files
frontend-standards-checker check --all-files --zones apps/frontend packages/ui

# Verbose mode only with staged files
frontend-standards-checker check --verbose

# Skip specific validations with all files
frontend-standards-checker check --all-files --skip-structure --skip-naming

# Custom configuration with debug
frontend-standards-checker check --config ./my-config.js --debug --verbose

# Advanced options combination
frontend-standards-checker check --all-files --zones src --verbose --debug
```

### As a module

```javascript
import { FrontendStandardsChecker } from './src/index.js';

const checker = new FrontendStandardsChecker({
  onlyChangedFiles: true, // Default only files in commit
  zones: ['apps/frontend'],
  verbose: true,
  skipStructure: false
});

const results = await checker.run();
console.log(`Found ${results.totalErrors} violations`);
```

### CLI command for configuration

```bash
# Add script and update .gitignore
npx frontend-standards-checker init
# or
yarn frontend-standards-checker init
```

Then you can use:

```bash
yarn standards        # or npm run standards
```

## ⚙️ Configuration

Create a `checkFrontendStandards.config.js` file in your project root:

```javascript
export default {
  // Custom rules (added to defaults)
  rules: [
    {
      name: 'Custom rule',
      check: (content) => content.includes('forbidden-pattern'),
      message: 'This pattern is not allowed'
    }
  ],

  // Zone configuration
  zones: {
    includePackages: true,
    customZones: ['libs', 'tools']
  },

  // File extensions to validate
  extensions: ['.js', '.ts', '.jsx', '.tsx'],

  // Patterns to ignore
  ignorePatterns: [
    'build',
    'dist',
    '*.config.js'
  ]
};
```

### Advanced configuration with function

```javascript
export default function(defaultRules) {
  return {
    rules: [
      // Modify existing rules
      ...defaultRules.filter(rule => rule.name !== 'No console.log'),

      // Add custom rules
      {
        name: 'My custom rule',
        check: (content, filePath) => {
          // Custom logic
          return content.includes('bad-pattern');
        },
        message: 'Custom validation failed'
      }
    ],

    // Additional configuration
    zones: {
      includePackages: false
    }
  };
}
```

## 🔧 Configuration for React Native

Frontend Standards v4.9.0 includes optimized configuration for React Native projects:

### Recommended configuration file

```javascript
// checkFrontendStandards.config.js
module.exports = {
  // React Native specific configuration
  zones: {
    includePackages: false,
    customZones: ['src'] // Only validate src folder
  },

  // File extensions to validate
  extensions: ['.js', '.ts', '.jsx', '.tsx'],

  // React Native specific ignore patterns
  ignorePatterns: [
    'android',           // Android native code
    'ios',              // iOS native code
    'build',
    'dist',
    '*.config.js',      // Configuration files
    'metro.config.js',
    'babel.config.js',
    'react-native.config.js',
    '__tests__',
    '.husky',
    '.bundle',
    'node_modules'
  ],

  // Validate all files by default (recommended for React Native)
  // Alternatively, use --all-files in CLI for specific cases
  onlyChangedFiles: false,

  // Custom rules for React Native
  rules: [
    {
      name: 'React Native - No console.log in production',
      check: (content, filePath) => {
        // Allow console.log in development/debug files
        if (filePath.includes('debug') || filePath.includes('dev')) {
          return false;
        }
        return content.includes('console.log');
      },
      message: 'Avoid console.log in production code. Use a proper logging solution for React Native.',
      level: 'ERROR'
    }
  ]
};
```

**Recommended commands for React Native:**

```bash
# Complete validation (all files)
yarn standards

# Only validate src/ with all files
yarn standards -- --zones src

# Quick validation only of modified files
yarn standards -- --only-changed-files

# Debug mode for troubleshooting
yarn standards -- --all-files --debug --verbose
```

## 🏗️ Architecture

The project is structured in a modular way:

```
src/
├── index.js               # Main class and entry point
├── core/
│   ├── config-loader.js   # Configuration loading and management
│   ├── project-analyzer.js # Project structure analysis
│   ├── rule-engine.js     # Rule validation engine
│   └── reporter.js        # Report generation
└── utils/
    ├── file-scanner.js    # File scanning and filtering
    └── logger.js          # Logging system
```

### Main components

#### FrontendStandardsChecker

The main class that orchestrates the entire validation process.

#### ConfigLoader

Handles configuration loading from custom files and provides default configuration.

#### ProjectAnalyzer

Analyze the project structure, detect if it is a monorepo, identify zones and project types.

#### RuleEngine

Validation engine that executes rules against files and content.

#### Reporter

Generates detailed reports in multiple formats.

#### FileScanner

Utility for scanning files and directories with exclusion patterns.

#### Logger

Consistent logging system with configurable levels.

## 📝 Default rules

- **No console.log**: Prevents console.log in production code
- **No var**: Forces use of let/const instead of var
- **No anonymous functions in callbacks**: Prefers arrow functions
- **No unused variables**: Detects declared but unused variables
- **Interface naming convention**: Interfaces must start with 'I'
- **Inline styles**: Prohibits inline styles
- **Commented code**: Detects commented code
- **Hardcoded data**: Identifies hardcoded data
- **Comments in complex functions**: Requires documentation in complex functions
- **Naming conventions**: Validates naming conventions by file type

## 📊 Rules Summary

The tool includes a total of **60 rules** organized by severity level:

### 🔴 Error Rules (25 total)

_Error rules indicate critical problems that can break code or prevent compilation._

- **Naming**: Component, hooks, types, helpers, styles, assets naming
- **Content/TypeScript**: No var, no any, no alert, no console.log, no inline styles
- **Accessibility**: Accessible button names, inputs with labels
- **React**: Key prop in lists, client component directives

### 🟡 Warning Rules (19 total)

_Warning rules point out important best practices that should be followed._

- **Structure**: Folder structure, component size limits
- **React/Performance**: Hook dependencies, interfaces for props, avoid React.FC
- **Imports**: Import order, absolute imports, no unused imports

### 🔵 Info Rules (16 total)

_Info rules provide suggestions and optional optimizations._

- **Documentation**: JSDoc for complex functions, TSDoc comments
- **TypeScript**: Explicit return types, generic naming
- **Performance**: React.memo for pure components, specific imports
- **Accessibility**: Accessible names for links, focus handling, color contrast

> **👉 To see the complete list of detailed rules, check [rules-list.md](./rules-list.md)**

## 🎯 CLI Options

```
Options:
  -z, --zones <zones...>        Specific zones to check (space separated)
  -c, --config <path>           Path to custom configuration file
  -v, --verbose                 Show detailed output
  --debug                       Show debug information about file scanning
  --skip-structure              Skip directory structure validation
  --skip-naming                 Skip naming convention validation
  --skip-content                Skip content validation
  --only-changed-files          Only check files staged for commit (default: true)
  --all-files                   Check all project files, not just staged ones (overrides config)
  -h, --help                    Display help for commands
```

### New CLI options

- **`--all-files`**: 🆕 Forces validation of all project files, ignoring the `onlyChangedFiles` configuration regardless of whether there are staged files or not.
- **`--only-changed-files`**: Forces validation only of files staged for commit.
- **`--debug`**: Shows detailed information about the file scanning process.

### Usage examples

```bash
# Validate only staged files (default behavior)
frontend-standards-checker check

# Validate ALL project files
frontend-standards-checker check --all-files

# Validate all files in specific zones
frontend-standards-checker check --all-files --zones src components

# Debug mode with all files
frontend-standards-checker check --all-files --debug --verbose

# Only staged files with specific zones
frontend-standards-checker check --only-changed-files --zones apps/web
```

## 🔧 Development

### Adding new rules

1. Create a new rule in the `RuleEngine`:

```javascript
// In src/core/rule-engine.js
this.validators.set('my-validator', this.validateMyRule.bind(this));

async validateMyRule(content, filePath) {
  const errors = [];
  // Your validation logic here
  return errors;
}
```

2. Or add rules through configuration:

```javascript
// In checkFrontendStandards.config.js
export default {
  rules: [
    {
      name: 'My custom rule',
      check: (content, filePath) => {
        // Validation logic
        return content.includes('forbidden-pattern');
      },
      message: 'This pattern is not allowed'
    }
  ]
};
```

### Adding new validators

Specialized validators can be added in `RuleEngine.initializeValidators()`:

```javascript
initializeValidators() {
  // Existing validators...
  this.validators.set('my-validator', this.validateMyRule.bind(this));
}
```
