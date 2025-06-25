/**
 * @fileoverview Frontend Standards Validation Script for Diners Club
 * 
 * This single-file validation script provides comprehensive frontend code standards checking
 * while maintaining all logic in one place for simplicity, portability, and maintainability.
 * 
 * **Core Features:**
 * - File and directory naming conventions validation (camelCase, PascalCase, kebab-case)
 * - Code quality rules enforcement using AST-based analysis via Acorn parser
 * - Project structure validation for both monorepos and single projects  
 * - Component architecture compliance checking (hooks, styles, types organization)
 * - Configurable rules system via checkFrontendStandards.config.js
 * - Comprehensive logging with detailed error reporting and line numbers
 * 
 * **Architecture Principles:**
 * - Single-file approach for maximum portability and simplified maintenance
 * - Centralized type definitions in separate checkFrontendStandards.types.js
 * - Zero external runtime dependencies beyond Node.js built-ins and Acorn
 * - Monorepo-aware with configurable zone scanning (apps, packages, custom)
 * 
 * **Usage Examples:**
 * ```bash
 * # Validate entire project
 * node checkFrontendStandards.mjs
 * 
 * # Validate specific zones in monorepo
 * node checkFrontendStandards.mjs apps packages
 * 
 * # Results written to frontend-standards.log
 * ```
 * 
 * @author Diners Club Frontend Team
 * @version 1.0.0
 * @since 2024-01-15
 * @see {@link ./checkFrontendStandards.types.js} Centralized type definitions
 * @see {@link ./checkFrontendStandards.config.js} Optional custom rules configuration
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as acorn from 'acorn'
import * as acornWalk from 'acorn-walk'

/**
 * Support for __dirname in ES Modules environments.
 * Converts the current module URL to a file path for directory operations.
 * @type {string}
 * @readonly
 */
const __filename = fileURLToPath(import.meta.url)

/**
 * File extensions that are processed by the validation script.
 * Includes JavaScript (.js), TypeScript (.ts), and JSX variants (.jsx, .tsx) 
 * for comprehensive frontend code analysis.
 * @type {string[]}
 * @readonly
 */
const EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx']

/**
 * Root directory of the project being analyzed.
 * Determined dynamically from the current working directory where the script is executed.
 * All file paths and validations are relative to this directory.
 * @type {string}
 * @readonly
 */
const ROOT_DIR = process.cwd()

/**
 * Path to the log file where validation results are written.
 * Located in the project root for easy access and review.
 * Contains detailed error reports with file paths and line numbers.
 * @type {string}
 * @readonly
 */
const LOG_FILE = path.join(ROOT_DIR, 'frontend-standards.log')

/**
 * Default validation rules applied to all files during analysis.
 * These rules can be extended, modified, or completely overridden via 
 * checkFrontendStandards.config.js configuration file.
 * 
 * Includes advanced rules for:
 * - Code quality (no console.log, proper variable usage)
 * - Variable shadowing detection with scope analysis
 * - Naming conventions for interfaces and functions
 * - TSDoc comment requirements for exported items
 * 
 * @type {import('./checkFrontendStandards.types.js').ValidationRule[]}
 * @readonly
 */
const DEFAULT_RULES = [
  {
    name: 'No console.log',
    check: (content) => content.includes('console.log'),
    message: 'The use of console.log is not allowed in production code.',
  },
  {
    name: 'No var',
    check: (content) => /\bvar\b/.test(content),
    message: 'Avoid using var, use let or const.',
  },
  {
    name: 'No anonymous functions in callbacks',
    check: (content) => /\(([^)]*)\)\s*=>/.test(content) && /function\s*\(/.test(content),
    message: 'Prefer arrow functions or named functions in callbacks.',
  },
  // Advanced rules inspired by BluAdmin
  {
    name: 'No unused variables',
    check: (content) =>
      /\b_?\w+\b\s*=\s*[^;]*;?\n/g.test(content) &&
      /\/\/\s*eslint-disable-next-line\s+@typescript-eslint\/no-unused-vars/.test(content) ===
      false,
    message:
      'There should be no declared and unused variables (@typescript-eslint/no-unused-vars rule).',
  },
  {
    name: 'No variable shadowing',
    check: function (content, filePath) {
      // More sophisticated check for actual variable shadowing patterns
      // Look for common shadowing patterns, but exclude CSS classes and comments

      // Skip if it's just CSS classes or other non-code contexts
      if (
        /className="[^"]*shadow[^"]*"/.test(content) ||
        /class="[^"]*shadow[^"]*"/.test(content) ||
        /\/\/.*shadow/i.test(content) ||
        /\/\*.*shadow.*\*\//i.test(content)
      ) {
        return false
      }

      // Look for actual variable shadowing patterns
      const lines = content.split('\n')
      /** @type {Array<Set<string>>} */
      const scopeStack = []
      let currentScope = new Set()

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        const lineNumber = i + 1

        // Skip comments and imports
        if (
          line.startsWith('//') ||
          line.startsWith('/*') ||
          line.startsWith('import') ||
          line.startsWith('*') ||
          line.startsWith('export type') ||
          line.startsWith('export interface')
        ) {
          continue
        }

        // Handle scope changes
        if (line.includes('{')) {
          scopeStack.push(new Set(currentScope))
        }
        if (line.includes('}')) {
          if (scopeStack.length > 0) {
            const poppedScope = scopeStack.pop()
            if (poppedScope !== undefined) {
              currentScope = poppedScope
            }
          }
        }

        // Look for variable declarations
        const varMatches = line.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g)
        if (varMatches) {
          for (const match of varMatches) {
            const varName = match.replace(/(?:const|let|var)\s+/, '').split(/[^a-zA-Z_$0-9]/)[0]
            if (varName && currentScope.has(varName)) {
              // Store the shadowing information for detailed reporting
              this.shadowingDetails = {
                line: lineNumber,
                variable: varName,
                file: filePath,
              }
              return true
            }
            if (varName) {
              currentScope.add(varName)
            }
          }
        }

        // Look for function parameters and arrow functions that might shadow
        const funcParamMatches =
          line.match(/(?:function\s+\w+|=>|\w+\s*=>)\s*\(([^)]*)\)/) ||
          line.match(/\(([^)]*)\)\s*=>/) ||
          line.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/)

        if (funcParamMatches) {
          /** @type {string[]} */
          let params = []
          if (funcParamMatches[1]) {
            // Handle regular function parameters
            params = funcParamMatches[1]
              .split(',')
              .map((p) => p.trim().split(/[\s:]/)[0])
              .filter((p) => p && /^[a-zA-Z_$]/.test(p))
          }

          for (const param of params) {
            if (param && currentScope.has(param)) {
              this.shadowingDetails = {
                line: lineNumber,
                variable: param,
                file: filePath,
              }
              return true
            }
          }
        }

        // Check for map/forEach/filter callbacks that might shadow
        const callbackMatches = line.match(
          /\.(?:map|forEach|filter|reduce|find|some|every)\s*\(\s*(?:\(([^)]*)\)|([a-zA-Z_$][a-zA-Z0-9_$]*))/
        )
        if (callbackMatches) {
          const param = callbackMatches[1]
            ? callbackMatches[1].split(',')[0].trim().split(/[\s:]/)[0]
            : callbackMatches[2]
          if (param && currentScope.has(param)) {
            this.shadowingDetails = {
              line: lineNumber,
              variable: param,
              file: filePath,
            }
            return true
          }
        }
      }

      return false
    },
    message: 'There should be no variable shadowing (@typescript-eslint/no-shadow rule).',
  },
  {
    name: 'No unnecessary constructors',
    check: (content) => /constructor\s*\(\s*\)\s*{\s*}/.test(content),
    message:
      'There should be no unnecessary empty constructors (@typescript-eslint/no-useless-constructor rule).',
  },
  {
    name: 'Should have TSDoc comments',
    check: (content, filePath) => {
      // Skip configuration files, test files, and simple export files
      if (
        /\/(config|constants|types|styles|enums)\//.test(filePath) ||
        /\.(config|constant|type|style|enum)\.ts$/.test(filePath) ||
        /\.test\.|\.spec\./.test(filePath) ||
        filePath.includes('index.ts') ||
        filePath.includes('index.tsx')
      ) {
        return false
      }

      // Check if file has exports without JSDoc
      const lines = content.split('\n')
      let hasExportsWithoutTSDoc = false
      let inTSDoc = false

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()

        // Track TSDoc state
        if (/^\s*\/\*\*/.test(line)) {
          inTSDoc = true
          continue
        }
        if (inTSDoc && /\*\//.test(line)) {
          inTSDoc = false
          continue
        }

        // Check for complex exports that should have TSDoc
        if (/^export\s+(function|class|const|let|var)\s+[a-zA-Z]/.test(line)) {
          // Look back for TSDoc in the previous few lines
          let hasTSDocAbove = false
          for (let j = Math.max(0, i - 5); j < i; j++) {
            if (/\/\*\*/.test(lines[j]) || /^\s*\*\s+/.test(lines[j])) {
              hasTSDocAbove = true
              break
            }
          }

          // Check if this is a complex export (function or class)
          if (/^export\s+(function|class)/.test(line) && !hasTSDocAbove) {
            hasExportsWithoutTSDoc = true
          }

          // For const/let/var exports, check if they're functions
          if (
            /^export\s+(const|let|var)\s+[a-zA-Z][a-zA-Z0-9]*\s*=\s*(async\s+)?\(/.test(line) &&
            !hasTSDocAbove
          ) {
            hasExportsWithoutTSDoc = true
          }
        }
      }

      return hasExportsWithoutTSDoc
    },
    message:
      'Exported functions and classes should have TSDoc comments explaining their purpose and parameters.',
  },
  {
    name: 'Interface naming convention',
    check: (content) => {
      // Check for exported interfaces that don't follow IComponentName pattern
      const interfaceMatches = content.match(/export\s+interface\s+([A-Za-z_][A-Za-z0-9_]*)/g)
      if (interfaceMatches) {
        return interfaceMatches.some((match) => {
          const interfaceName = match.replace(/export\s+interface\s+/, '')
          return !/^I[A-Z][a-zA-Z0-9]*$/.test(interfaceName);
        });
      }
      return false
    },
    message:
      'Exported interfaces must start with I followed by PascalCase (e.g., IComponentProps).',
  },
]

/**
 * Loads custom rules from `checkFrontendStandards.config.js` and merges them with default rules.
 * The custom rules can be an array to be merged, an object with a `rules` property,
 * or a function that receives the default rules and returns a new set of rules.
 * 
 * @returns {Promise<import('./checkFrontendStandards.types.js').ValidationRule[]>} A promise that resolves to the final array of validation rules.
 * @since 1.0.0
 * @example
 * ```js
 * // Simple array merge (checkFrontendStandards.config.js)
 * export default [
 *   { name: 'Custom rule', check: (content) => false, message: 'Custom message' }
 * ]
 * ```
 * 
 * @example
 * ```js
 * // Function-based configuration for advanced scenarios
 * export default (defaultRules) => [
 *   ...defaultRules,
 *   { name: 'Override rule', check: customCheck, message: 'Custom logic' }
 * ]
 * ```
 * 
 * @example
 * ```js
 * // Complete replacement of default rules
 * export default {
 *   merge: false,
 *   rules: [{ name: 'Only rule', check: () => false, message: 'Only this rule' }]
 * }
 * ```
 */
async function loadProjectRules() {
  const configPath = path.join(ROOT_DIR, 'checkFrontendStandards.config.js')
  if (fs.existsSync(configPath)) {
    // eslint-disable-next-line no-console
    console.info('Loading custom rules from checkFrontendStandards.config.js')
    const configModule = await import(configPath + `?t=${Date.now()}`)
    const customRules = configModule.default || configModule
    // If the config exports a function, call it with the default rules
    if (typeof customRules === 'function') {
      return customRules(DEFAULT_RULES)
    }
    // If the config exports an array, merge with default rules
    if (Array.isArray(customRules)) {
      return [...DEFAULT_RULES, ...customRules]
    }
    // If the config exports an object with a merge flag
    if (customRules && customRules.merge === false && Array.isArray(customRules.rules)) {
      return customRules.rules
    }
    if (customRules && Array.isArray(customRules.rules)) {
      return [...DEFAULT_RULES, ...customRules.rules]
    }
    return DEFAULT_RULES
  }
  return DEFAULT_RULES
}

/**
 * Checks if the project is a monorepo by looking for common marker files and directories.
 * @param {string} rootDir - The root directory of the project.
 * @returns {boolean} True if the project is detected as a monorepo, false otherwise.
 * @since 1.0.0
 */
function isMonorepo(rootDir) {
  const monorepoMarkers = ['packages', 'apps', 'lerna.json', 'turbo.json']
  return monorepoMarkers.some((marker) => fs.existsSync(path.join(rootDir, marker)))
}

/**
 * Reads ignore patterns from the project's `.gitignore` file and combines them with default patterns.
 * @returns {string[]} An array of patterns to ignore during file scanning.
 */
function getIgnorePatterns() {
  const ignore = ['node_modules', '.next', '.git', '__tests__', '__test__', 'checkFrontendStandards.config.js']
  const gitignorePath = path.join(ROOT_DIR, '.gitignore')
  if (fs.existsSync(gitignorePath)) {
    const lines = fs
      .readFileSync(gitignorePath, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
    ignore.push(...lines)
  }
  return ignore
}

/**
 * Determines if a file path should be ignored based on a list of patterns.
 * @param {string} filePath - The path of the file to check.
 * @param {string[]} ignorePatterns - An array of patterns to ignore.
 * @returns {boolean} True if the file should be ignored, false otherwise.
 */
function shouldIgnore(filePath, ignorePatterns) {
  // Ignore if the path contains any ignored folder or pattern
  const lower = filePath.toLowerCase()
  const base = path.basename(filePath)
  // Note: index.ts and index.tsx files should be processed for structure validation
  // but may be excluded from content validation in specific functions
  if (base.includes('.test')) return true // Omit .test files
  if (base.startsWith('__') && base.endsWith('__')) return true // Omit __tests__, __mocks__, etc.
  if (filePath.includes('__tests__') || filePath.includes('__test__')) return true // Omit test directories
  if (
    lower.includes('config.ts') ||
    lower.includes('setup') ||
    lower.includes('eslint') ||
    lower.includes('package')
  )
    return true
  return ignorePatterns.some((pattern) => {
    if (pattern.endsWith('/')) {
      // Folder
      return filePath.includes(path.sep + pattern.replace(/\/$/, ''));
    }
    // Simple file or pattern
    return filePath.includes(pattern)
  });
}

/**
 * Recursively gets all files with allowed extensions from a directory, respecting ignore patterns.
 * @param {string} dir - The directory to start scanning from.
 * @param {string[]} [files=[]] - An array to accumulate the file paths (used for recursion).
 * @param {string[]} [ignorePatterns=getIgnorePatterns()] - The patterns to ignore.
 * @returns {string[]} An array of absolute paths to all found files.
 * @throws {TypeError} When dir is not a string
 * @throws {Error} When directory doesn't exist or cannot be read
 * @example
 * ```js
 * const files = getAllFiles('./src')
 * console.log(`Found ${files.length} files to validate`)
 * ```
 */
function getAllFiles(dir, files = [], ignorePatterns = getIgnorePatterns()) {
  // Parameter validation
  if (typeof dir !== 'string') {
    throw new TypeError('Directory path must be a string')
  }
  if (!fs.existsSync(dir)) {
    throw new Error(`Directory does not exist: ${dir}`)
  }
  if (!fs.statSync(dir).isDirectory()) {
    throw new Error(`Path is not a directory: ${dir}`)
  }

  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file)
    if (shouldIgnore(fullPath, ignorePatterns)) continue
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, files, ignorePatterns)
    } else if (EXTENSIONS.includes(path.extname(fullPath))) {
      files.push(fullPath)
    }
  }
  return files
}

/**
 * Recursively gets all subdirectories from a directory, respecting ignore patterns.
 * @param {string} dir - The directory to start scanning from.
 * @param {string[]} [directories=[]] - An array to accumulate the directory paths (used for recursion).
 * @param {string[]} [ignorePatterns=getIgnorePatterns()] - The patterns to ignore.
 * @returns {string[]} An array of absolute paths to all found directories.
 */
function getAllDirectories(dir, directories = [], ignorePatterns = getIgnorePatterns()) {
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file)
    if (shouldIgnore(fullPath, ignorePatterns)) continue
    if (fs.statSync(fullPath).isDirectory()) {
      directories.push(fullPath)
      getAllDirectories(fullPath, directories, ignorePatterns)
    }
  }
  return directories
}

/**
 * Checks a single file against a set of validation rules and performs additional hardcoded checks.
 * @param {string} filePath - The path to the file to check.
 * @param {import('./checkFrontendStandards.types.js').ValidationRule[]} rules - The array of rules to validate against.
 * @returns {import('./checkFrontendStandards.types.js').ValidationError[]} An array of error objects for any violations found in the file.
 * @throws {TypeError} When filePath is not a string or is empty
 * @throws {TypeError} When rules is not an array
 * @throws {Error} When file cannot be read or doesn't exist
 * @since 1.0.0
 * @example
 * ```js
 * const rules = await loadProjectRules()
 * const errors = checkFile('./src/Button.tsx', rules)
 * if (errors.length > 0) console.log('Violations found:', errors)
 * ```
 */
function checkFile(filePath, rules) {
  // Parameter validation
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    throw new TypeError('filePath must be a non-empty string')
  }
  if (!Array.isArray(rules)) {
    throw new TypeError('rules must be an array of ValidationRule objects')
  }

  let content
  try {
    content = fs.readFileSync(filePath, 'utf8')
  } catch (error) {
    throw new Error(`Cannot read file ${filePath}: ${error.message}`)
  }
  /** @type {import('./checkFrontendStandards.types.js').ValidationError[]} */
  const errors = []
  const fileName = path.basename(filePath)

  // Skip content validations for index files (they are usually just exports)
  const isIndexFile = fileName === 'index.ts' || fileName === 'index.tsx'

  for (const rule of rules) {
    if (rule.name !== 'No unused variables') {
      // Clear any previous shadowing details
      if (rule.name === 'No variable shadowing') {
        rule.shadowingDetails = null
      }

      if (rule.check(content, filePath)) {
        const errorInfo = {
          rule: rule.name,
          message: rule.message,
          file: filePath,
        }

        // Add specific line information for variable shadowing
        if (rule.name === 'No variable shadowing' && rule.shadowingDetails) {
          errorInfo.file = `${filePath}:${rule.shadowingDetails.line}`
          errorInfo.message = `Variable '${rule.shadowingDetails.variable}' shadows a variable from an outer scope (line ${rule.shadowingDetails.line}). ${rule.message}`
        }

        errors.push(errorInfo)
      }
    }
  }

  // Skip most content validations for index files
  if (!isIndexFile) {
    // Additional validations
    errors.push(...checkInlineStyles(content, filePath))
    errors.push(...checkCommentedCode(content, filePath))
    errors.push(...checkHardcodedData(content, filePath))
    errors.push(...checkFunctionComments(content, filePath))
    // Improved unused variable detection
    errors.push(...checkUnusedVariables(content, filePath))
    // Function naming validation
    errors.push(...checkFunctionNaming(content, filePath))
    // Interface naming validation
    errors.push(...checkInterfaceNaming(content, filePath))
    // Style conventions validation
    errors.push(...checkStyleConventions(content, filePath))
  }

  // These validations always apply regardless of file type
  const enumError = checkEnumsOutsideTypes(filePath)
  if (enumError) errors.push(enumError)
  // Hook file extension validation
  const hookExtError = checkHookFileExtension(filePath)
  if (hookExtError) errors.push(hookExtError)
  // Asset naming validation
  const assetError = checkAssetNaming(filePath)
  if (assetError) errors.push(assetError)
  // Style conventions validation
  errors.push(...checkStyleConventions(content, filePath))
  return errors
}

/**
 * Gets the command-line arguments passed to the script, which are expected to be zone names.
 * @returns {string[]} An array of zone names.
 */
function getZonesFromArgs() {
  return process.argv.slice(2)
}

/**
 * Writes a log file with the provided lines and prints a confirmation message to the console.
 * @param {string[]} logLines - An array of strings to be written to the log file.
 * @returns {void}
 */
function writeLogAndPrint(logLines) {
  fs.writeFileSync(LOG_FILE, logLines.join('\n'))
  // eslint-disable-next-line no-console
  console.info(`Validation completed. Check the log at: ${LOG_FILE}`)
}

/**
 * Expected directory structure by zone type for project validation.
 * Defines minimum required directories for different types of project zones.
 * 
 * Zone types:
 * - `app`: Frontend applications (requires pages, components, public)
 * - `package`: Reusable packages/libraries (requires src, package.json)
 * - `other`: Unrecognized structures (no validation applied)
 * 
 * @type {import('./checkFrontendStandards.types.js').ZoneStructure}
 * @readonly
 */
const DEFAULT_STRUCTURE = {
  app: ['pages', 'components', 'public'],
  package: ['src', 'package.json'],
}

/**
 * Expected structure for src directory and its subfolders.
 * Enforces standardized organization within source directories for consistency
 * and maintainability across all projects.
 * 
 * Each key represents a required subdirectory, and the array value contains
 * required files within that subdirectory. Empty arrays indicate the directory
 * should exist but may contain any files following naming conventions.
 * 
 * @type {import('./checkFrontendStandards.types.js').SrcStructure}
 * @readonly
 */
const SRC_STRUCTURE = {
  assets: [],
  components: ['index.ts'],
  constants: ['index.ts'],
  modules: [],
  helpers: ['index.ts'], // Changed from 'helper' to 'helpers' for consistency
  hooks: ['index.ts'],
  providers: ['index.ts'],
  styles: ['index.ts'],
  store: ['reducers', 'types', 'state.selector.ts', 'state.interface.ts', 'store'],
}

/**
 * Naming conventions by file type and directory context.
 * Each rule defines expected patterns for different types of files based on their location.
 * 
 * Naming patterns enforced:
 * - Components: PascalCase with .tsx extension
 * - Hooks: use + PascalCase with .hook.ts/.tsx extension
 * - Constants: camelCase with .constant.ts extension
 * - Helpers: camelCase with .helper.ts extension
 * - Types: camelCase with .type.ts extension
 * - Styles: camelCase with .style.ts extension
 * - Enums: camelCase with .enum.ts extension
 * - Assets: kebab-case with appropriate image extensions
 * 
 * @type {import('./checkFrontendStandards.types.js').NamingConventionRule[]}
 * @readonly
 */
const NAMING_RULES = [
  {
    dir: 'components',
    regex: /^[A-Z][A-Za-z0-9]+\.tsx$/,
    desc: 'Components must be in PascalCase and end with .tsx',
  },
  {
    dir: 'hooks',
    regex: /^use[A-Z][a-zA-Z0-9]*\.hook\.(ts|tsx)$/,
    desc: 'Hooks must start with use followed by PascalCase and end with .hook.ts or .hook.tsx',
  },
  {
    dir: 'constants',
    regex: /^[a-z][a-zA-Z0-9]*\.constant\.ts$/,
    desc: 'Constants must be camelCase and end with .constant.ts',
  },
  {
    dir: 'helper',
    regex: /^[a-z][a-zA-Z0-9]*\.helper\.ts$/,
    desc: 'Helpers must be camelCase and end with .helper.ts',
  },
  {
    dir: 'helpers',
    regex: /^[a-z][a-zA-Z0-9]*\.helper\.ts$/,
    desc: 'Helpers must be camelCase and end with .helper.ts',
  },
  {
    dir: 'types',
    regex: /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)*\.type\.ts$/,
    desc: 'Types must be camelCase and end with .type.ts (may include additional extensions like .provider.type.ts)',
  },
  {
    dir: 'styles',
    regex: /^[a-z][a-zA-Z0-9]*\.style\.ts$/,
    desc: 'Styles must be camelCase and end with .style.ts',
  },
  {
    dir: 'enums',
    regex: /^[a-z][a-zA-Z0-9]*\.enum\.ts$/,
    desc: 'Enums must be camelCase and end with .enum.ts',
  },
  {
    dir: 'assets',
    regex: /^[a-z0-9]+(-[a-z0-9]+)*\.(svg|png|jpg|jpeg|gif|webp|ico)$/,
    desc: 'Assets must be in kebab-case (e.g., service-error.svg)',
  },
]

/**
 * Detects the type of a project zone ('app', 'package', or 'other') based on its file structure.
 * @param {string} zonePath - The absolute path to the zone directory.
 * @returns {'app' | 'package' | 'other'} The detected zone type.
 */
function detectZoneType(zonePath) {
  // Simple heuristic: if it has package.json and src, it's a package; if it has pages, it's an app
  const hasPackageJson = fs.existsSync(path.join(zonePath, 'package.json'))
  const hasSrc = fs.existsSync(path.join(zonePath, 'src'))
  const hasPages = fs.existsSync(path.join(zonePath, 'pages'))
  if (hasPages) return 'app'
  if (hasPackageJson && hasSrc) return 'package'
  return 'other'
}

/**
 * Checks if a zone's directory structure contains the expected items for its type.
 * @param {string} zonePath - The path to the zone directory.
 * @param {'app' | 'package' | 'other'} zoneType - The type of the zone.
 * @param {import('./checkFrontendStandards.types.js').ZoneStructure} [expectedStructure=DEFAULT_STRUCTURE] - The structure to validate against.
 * @returns {string[]} An array of missing item names.
 */
function checkZoneStructure(zonePath, zoneType, expectedStructure = DEFAULT_STRUCTURE) {
  /** @type {string[]} */
  const missing = []
  const expected = expectedStructure[zoneType] || []
  for (const item of expected) {
    if (!fs.existsSync(path.join(zonePath, item))) missing.push(item)
  }
  return missing
}

/**
 * Checks if a `src` directory has the standard folder structure defined in `SRC_STRUCTURE`.
 * @param {string} srcPath - The path to the `src` directory.
 * @returns {import('./checkFrontendStandards.types.js').ValidationError[]} An array of error objects for any missing folders or files.
 */
function checkSrcStructure(srcPath) {
  /** @type {import('./checkFrontendStandards.types.js').ValidationError[]} */
  const errors = []
  for (const [dir, required] of Object.entries(SRC_STRUCTURE)) {
    const fullDir = path.join(srcPath, dir)
    if (!fs.existsSync(fullDir)) {
      errors.push({
        rule: 'Src structure',
        message: `Missing required folder: ${dir}`,
        file: fullDir,
      })
      continue
    }
    for (const req of required) {
      if (!fs.existsSync(path.join(fullDir, req))) {
        errors.push({
          rule: 'Src structure',
          message: `Missing required file/folder: ${dir}/${req}`,
          file: path.join(fullDir, req),
        })
      }
    }
  }
  return errors
}

/**
 * Checks if a file's name conforms to the project's naming conventions.
 * @param {string} filePath - The absolute path to the file.
 * @returns {import('./checkFrontendStandards.types.js').ValidationError | null} An error object if the naming is incorrect, otherwise null.
 */
function checkNamingConventions(filePath) {
  const rel = filePath.split(path.sep)
  const fname = rel[rel.length - 1]
  const parentDir = rel[rel.length - 2] // Get immediate parent directory

  // Omit index.tsx and index.ts from naming convention checks
  if (fname === 'index.tsx' || fname === 'index.ts') {
    return null
  }

  for (const rule of NAMING_RULES) {
    // Check if the immediate parent directory matches the rule directory
    if (parentDir === rule.dir) {
      if (!rule.regex.test(fname)) {
        return {
          rule: 'Naming',
          message: rule.desc,
          file: filePath,
        }
      }
    }
  }
  return null
}

// Additional validations
/**
 * Checks for the use of inline styles in the code.
 * @param {string} content - The content of the file to check.
 * @param {string} filePath - The path to the file.
 * @returns {import('./checkFrontendStandards.types.js').ValidationError[]} An array of error objects for any inline styles found.
 */
function checkInlineStyles(content, filePath) {
  const lines = content.split('\n')
  /** @type {import('./checkFrontendStandards.types.js').ValidationError[]} */
  const errors = []
  lines.forEach((line, idx) => {
    // Detects style={{ ... }} and style=\"...\"
    if (/style\s*=\s*\{\{[^}]+\}\}/.test(line) || /style\s*=\s*\"[^\"]+\"/.test(line)) {
      errors.push({
        rule: 'Inline styles',
        message: 'Inline styles are not allowed. Use .style.ts files',
        file: filePath,
        line: idx + 1,
      })
    }
  })
  return errors
}

/**
 * Checks for commented-out code, ignoring linter directives and TODOs.
 * @param {string} content - The content of the file to check.
 * @param {string} filePath - The path to the file.
 * @returns {import('./checkFrontendStandards.types.js').ValidationError[]} An array of error objects for any commented code found.
 */
function checkCommentedCode(content, filePath) {
  const lines = content.split('\n')
  /** @type {import('./checkFrontendStandards.types.js').ValidationError[]} */
  const errors = []
  let inJSDoc = false
  let inMultiLineComment = false

  lines.forEach((line, idx) => {
    const trimmedLine = line.trim()

    // Track JSDoc comment state
    if (/^\s*\/\*\*/.test(line)) {
      inJSDoc = true
      return
    }
    if (inJSDoc && /\*\//.test(line)) {
      inJSDoc = false
      return
    }

    // Track multi-line comment state
    if (/^\s*\/\*/.test(line) && !/^\s*\/\*\*/.test(line)) {
      inMultiLineComment = true
      return
    }
    if (inMultiLineComment && /\*\//.test(line)) {
      inMultiLineComment = false
      return
    }

    // Skip if we're inside any comment block
    if (inJSDoc || inMultiLineComment || /^\s*\*/.test(line)) {
      return
    }

    // Check for single-line comments that might be commented code
    if (/^\s*\/\//.test(line)) {
      // Skip if it's a valid comment (not commented code)
      const commentContent = trimmedLine.replace(/^\/\/\s*/, '')

      // Skip common valid comment patterns
      if (
        // ESLint/TSLint directives
        /eslint|tslint|@ts-|prettier/.test(line) ||
        // TODO/FIXME/NOTE comments
        /^(TODO|FIXME|NOTE|HACK|BUG|XXX):/i.test(commentContent) ||
        // Documentation comments
        /^(This|The|When|If|For|To|Used|Returns?|Handles?|Checks?|Sets?|Gets?)/.test(
          commentContent
        ) ||
        // Explanation comments
        /because|since|due to|in order to|to ensure|to avoid|to prevent|explanation|reason/i.test(
          commentContent
        ) ||
        // Configuration comments
        /config|setting|option|parameter|default|override/i.test(commentContent) ||
        // Single word or very short explanatory comments
        /^[A-Z][a-z]*(\s+[a-z]+){0,3}\.?$/.test(commentContent) ||
        // Comments with common English sentence patterns
        /^(and|or|but|however|therefore|thus|also|additionally)/.test(commentContent) ||
        // Comments that end with periods (likely explanations)
        /\.$/.test(commentContent.trim()) ||
        // Comments that are clearly explanatory
        (commentContent.length > 50 && !/^[a-z]+\(/.test(commentContent))
      ) {
        return
      }

      // Check if it looks like commented code
      const looksLikeCode =
        // Function calls
        /^[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/.test(commentContent) ||
        // Variable assignments
        /^(const|let|var|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/.test(commentContent) ||
        // Return statements
        /^return\s+/.test(commentContent) ||
        // Import/export statements
        /^(import|export)\s+/.test(commentContent) ||
        // Object/array syntax
        /^[\{\[].*[\}\]]$/.test(commentContent) ||
        // Console statements
        /^console\.[a-z]+\s*\(/.test(commentContent) ||
        // Control flow statements with parentheses
        /^(if|for|while|switch|try|catch)\s*\(/.test(commentContent)

      if (looksLikeCode) {
        errors.push({
          rule: 'Commented code',
          message: 'Leaving commented code in the repository is not allowed.',
          file: filePath,
          line: idx + 1,
        })
      }
    }
  })
  return errors
}

/**
 * Checks if enum files (`.enum.ts`) are incorrectly placed inside a `types` directory.
 * @param {string} filePath - The path to the file to check.
 * @returns {import('./checkFrontendStandards.types.js').ValidationError | null} An error object if the rule is violated, otherwise null.
 */
function checkEnumsOutsideTypes(filePath) {
  // Check if enum files are incorrectly placed inside types directory
  if (filePath.includes('types') && filePath.endsWith('.enum.ts')) {
    return {
      rule: 'Enum outside of types',
      message: 'Enums must be in a separate directory from types (use /enums/ instead of /types/).',
      file: filePath,
    }
  }
  return null
}

/**
 * Checks for hardcoded data and magic strings, ignoring test files, URLs, and comments.
 * @param {string} content - The content of the file to check.
 * @param {string} filePath - The path to the file.
 * @returns {import('./checkFrontendStandards.types.js').ValidationError[]} An array of error objects for any hardcoded data found.
 */
function checkHardcodedData(content, filePath) {
  const lines = content.split('\n')
  /** @type {import('./checkFrontendStandards.types.js').ValidationError[]} */
  const errors = []

  // Track JSDoc comment blocks
  let inJSDocComment = false

  lines.forEach((line, idx) => {
    // Track JSDoc comment state
    if (/^\s*\/\*\*/.test(line)) {
      inJSDocComment = true
    }
    if (inJSDocComment && /\*\//.test(line)) {
      inJSDocComment = false
      return // Skip this line as it ends the JSDoc
    }

    // Skip if we're inside a JSDoc comment
    if (inJSDocComment || /^\s*\*/.test(line)) {
      return
    }

    // Check for hardcoded data but exclude CSS classes, Tailwind classes, and other valid cases
    const hasHardcodedPattern = /(['"]).*([0-9]{3,}|lorem|dummy|test|prueba|foo|bar|baz).*\1/.test(
      line
    )
    const isCSSClass = /className\s*=|class\s*=|style\s*=/.test(line)

    // Comprehensive Tailwind CSS pattern matching
    const tailwindPatterns = [
      // Common Tailwind prefixes with numbers
      /\b(p|m|w|h|text|bg|border|rounded|shadow|grid|flex|space|gap|top|bottom|left|right|inset|absolute|relative|fixed|static|sticky|block|inline|hidden|visible|font|leading|tracking|opacity|scale|rotate|translate|cursor|pointer|select|transition|duration|ease|hover|focus|active|disabled)-\d+/,
      // Responsive prefixes
      /\b(sm|md|lg|xl|2xl):/,
      // Standard Tailwind color patterns with numbers
      /\b(text|bg|border)-(red|blue|green|yellow|purple|pink|gray|grey|indigo|teal|orange|amber|lime|emerald|cyan|sky|violet|fuchsia|rose|slate|zinc|neutral|stone)-(50|100|200|300|400|500|600|700|800|900|950)\b/,
      // Additional color patterns
      /\b(from|via|to|ring|outline|divide|decoration)-(red|blue|green|yellow|purple|pink|gray|grey|indigo|teal|orange|amber|lime|emerald|cyan|sky|violet|fuchsia|rose|slate|zinc|neutral|stone)-(50|100|200|300|400|500|600|700|800|900|950)\b/,
      // Custom semantic color patterns (like semantic-green-500, semantic-red-600, etc.)
      /\b(text|bg|border)-(semantic|custom|brand|primary|secondary|accent|success|warning|error|info|muted|disabled)-(red|blue|green|yellow|purple|pink|gray|grey|indigo|teal|orange|amber|lime|emerald|cyan|sky|violet|fuchsia|rose|slate|zinc|neutral|stone|black|white)-(50|100|200|300|400|500|600|700|800|900|950)\b/,
      // General custom color patterns with numbers (covers any custom prefix)
      /\b(text|bg|border)-[a-zA-Z]+-[a-zA-Z]*-?\d{2,3}\b/,
    ]

    const isTailwindClass = tailwindPatterns.some((pattern) => pattern.test(line))

    const isTestFile = /mock|__test__|\.test\.|\.spec\./.test(filePath)
    const isImportStatement = /import.*from/.test(line.trim())
    const isURL = /https?:\/\//.test(line)
    const isSingleLineComment = /^\s*\/\//.test(line)
    const isMultiLineComment = /^\s*\/\*/.test(line) && /\*\//.test(line)

    // Additional check: if line contains common CSS/Tailwind context
    const hasClassContext =
      /(className|class)\s*[:=]\s*['"`]/.test(line) ||
      /['"`]\s*\?\s*['"`][^'"`]*\d+[^'"`]*['"`]\s*:\s*['"`]/.test(line)

    // Check for valid configuration contexts that should not be flagged as hardcoded data
    const isValidConfiguration =
      // Next.js font configuration (weight, subset properties)
      /(weight|subsets|style|display)\s*:\s*\[/.test(line) ||
      // Font-specific numeric values in arrays (like ['100', '300', '400'])
      (/weight\s*:\s*\[/.test(
        content.substring(Math.max(0, content.indexOf(line) - 200), content.indexOf(line) + 100)
      ) &&
        /['"][\d]{3}['"]/.test(line)) ||
      // Configuration objects with numeric values that are library-specific
      /\b(timeout|port|delay|duration|interval|retry|maxRetries|limit|size|width|height|fontSize|lineHeight)\s*:\s*['"]?\d+['"]?/.test(
        line
      ) ||
      // Version numbers or semantic versioning
      /['"](\d+\.){1,2}\d+['"]/.test(line) ||
      // API endpoints with version numbers
      /['"]\/api\/v\d+\//.test(line) ||
      // Valid configuration properties in objects
      /(from|to|via|offset|opacity|scale|rotate|skew|translate)\s*:\s*['"][\d-]+['"]/.test(line) ||
      // Theme configuration values
      /(fontSize|spacing|borderRadius|colors)\s*:\s*\{/.test(line) ||
      // i18n/translation keys (like 'common.buttons.save', 'footer.success')
      /\b(useTranslations|t)\s*\(\s*['"][a-zA-Z]+(\.[a-zA-Z]+)*['"]/.test(line) ||
      // Toast/notification messages using translation keys
      /\b(toast|notification)\.(success|error|info|warning)\s*\(\s*t\s*\(/.test(line) ||
      // General translation key pattern (dotted notation)
      /['"][a-zA-Z]+(\.[a-zA-Z]+){2,}['"]/.test(line)

    // Check if the file is a configuration file that commonly contains valid numeric values
    const isConfigurationFile =
      /\/(config|configs|constants|theme|styles|fonts)\//.test(filePath) ||
      /\.(config|constants|theme|styles|fonts)\.(ts|tsx|js|jsx)$/.test(filePath) ||
      /\/fonts\//.test(filePath)

    if (
      hasHardcodedPattern &&
      !isCSSClass &&
      !isTailwindClass &&
      !hasClassContext &&
      !isTestFile &&
      !isImportStatement &&
      !isURL &&
      !isSingleLineComment &&
      !isMultiLineComment &&
      !isValidConfiguration &&
      !isConfigurationFile
    ) {
      errors.push({
        rule: 'Hardcoded data',
        message: 'No hardcoded data should be left in the code except in mocks.',
        file: filePath,
        line: idx + 1,
      })
    }
  })
  return errors
}

/**
 * Checks if complex functions have explanatory comments.
 * A function is considered complex if it contains control flow statements like if, for, while, etc.
 * @param {string} content - The content of the file to check.
 * @param {string} filePath - The path to the file.
 * @returns {import('./checkFrontendStandards.types.js').ValidationError[]} An array of error objects for complex functions without comments.
 */
function checkFunctionComments(content, filePath) {
  const lines = content.split('\n')
  /** @type {import('./checkFrontendStandards.types.js').ValidationError[]} */
  const errors = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip empty lines and comments
    if (!line || line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) {
      continue
    }

    // Detect function declarations (including arrow functions and function expressions)
    const functionMatch =
      line.match(
        /(export\s+)?(const|let|var|function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[:=]?\s*(\([^)]*\)\s*=>|\([^)]*\)\s*\{|async\s*\([^)]*\)\s*=>|function)/
      ) || line.match(/(export\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/)

    if (functionMatch) {
      const functionName = functionMatch[3] || functionMatch[2]

      // Skip if it's a type declaration or interface
      if (line.includes('interface ') || line.includes('type ')) {
        continue
      }

      // Skip simple getters/setters or single-line functions
      if (line.includes('=>') && line.length < 80 && !line.includes('async')) {
        continue
      }

      // Look ahead to check if this function has complex logic
      let isComplex = false
      let complexityScore = 0
      let functionBodyStart = i
      let braceCount = 0
      let inFunction = false
      let linesInFunction = 0

      // Find the function body and check for complexity
      for (let j = i; j < Math.min(i + 30, lines.length); j++) {
        const bodyLine = lines[j]

        if (bodyLine.includes('{')) {
          braceCount += (bodyLine.match(/\{/g) || []).length
          inFunction = true
        }
        if (bodyLine.includes('}')) {
          braceCount -= (bodyLine.match(/\}/g) || []).length
        }

        if (inFunction) {
          linesInFunction++

          // Check for complex patterns and assign complexity scores
          if (/\b(if|else if|switch|case)\b/.test(bodyLine)) {
            complexityScore += 1
          }
          if (/\b(for|while|do)\b/.test(bodyLine)) {
            complexityScore += 2
          }
          if (/\b(try|catch|finally)\b/.test(bodyLine)) {
            complexityScore += 2
          }
          if (
            /\b(async|await|Promise\.all|Promise\.resolve|Promise\.reject|\.then|\.catch)\b/.test(
              bodyLine
            )
          ) {
            complexityScore += 2
          }
          if (/\.(map|filter|reduce|forEach|find|some|every)\s*\(/.test(bodyLine)) {
            complexityScore += 1
          }
          if (/\?\s*[^:]*\s*:/.test(bodyLine)) {
            // Ternary operators
            complexityScore += 1
          }
          if (/&&|\|\|/.test(bodyLine)) {
            // Logical operators
            complexityScore += 0.5
          }
        }

        if (inFunction && braceCount === 0) {
          break
        }
      }

      // A function is complex if:
      // - It has a complexity score >= 3, OR
      // - It has more than 8 lines in the function body, OR
      // - It has async operations with complexity score >= 2
      isComplex =
        complexityScore >= 3 ||
        linesInFunction > 8 ||
        (complexityScore >= 2 &&
          /async|await|Promise/.test(content.substring(content.indexOf(line))))

      // If function is complex, check for comments
      if (isComplex) {
        let hasComment = false

        // Look for JSDoc comments or regular comments above the function
        for (let k = Math.max(0, i - 15); k < i; k++) {
          const commentLine = lines[k].trim()
          if (
            // JSDoc comments
            commentLine.includes('/**') ||
            commentLine.includes('*/') ||
            (commentLine.startsWith('*') && commentLine.length > 5) ||
            // Multi-line comments
            commentLine.includes('/*') ||
            // Detailed single-line comments (more than just a word or two)
            (commentLine.startsWith('//') &&
              commentLine.length > 15 &&
              !/^\s*\/\/\s*(TODO|FIXME|NOTE|HACK)/.test(commentLine))
          ) {
            hasComment = true
            break
          }
        }

        if (!hasComment) {
          errors.push({
            rule: 'Missing comment in complex function',
            message: `Complex function '${functionName}' (complexity: ${complexityScore.toFixed(1)}, lines: ${linesInFunction}) must have comments explaining its behavior.`,
            file: `${filePath}:${i + 1}`,
          })
        }
      }
    }
  }

  return errors
}

/**
 * Validates that React hooks that render JSX have a `.tsx` extension, and those that don't have a `.ts` extension.
 * @param {string} filePath - The path to the hook file.
 * @returns {import('./checkFrontendStandards.types.js').ValidationError | null} An error object if the extension is incorrect, otherwise null.
 */
function checkHookFileExtension(filePath) {
  // Only check for hooks (use*.hook.ts[x]?)
  const fileName = path.basename(filePath)
  const dirName = path.dirname(filePath)
  if (!/^use[a-zA-Z0-9]+\.hook\.(ts|tsx)$/.test(fileName)) return null
  // Omit if index.ts in the same folder
  if (fs.existsSync(path.join(dirName, 'index.ts'))) return null
  const content = fs.readFileSync(filePath, 'utf8')
  // Heuristic: if contains JSX (return < or React.createElement), must be .tsx
  const needsRender = /return\s*<|React\.createElement/.test(content)
  const isTSX = fileName.endsWith('.tsx')
  if (needsRender && !isTSX) {
    return {
      rule: 'Hook file extension',
      message: 'Hooks that render JSX must have a .tsx extension.',
      file: filePath,
    }
  }
  if (!needsRender && isTSX) {
    return {
      rule: 'Hook file extension',
      message: 'Hooks that do not render JSX should have a .ts extension.',
      file: filePath,
    }
  }
  return null
}

/**
 * Builds a string representation of a directory tree for logging purposes.
 * @param {string} dir - The directory to build the tree from.
 * @param {string[]} ignorePatterns - An array of patterns to ignore.
 * @param {string} [prefix=''] - The prefix for the current tree level (used for recursion).
 * @returns {string} A string representing the directory tree.
 */
function buildTree(dir, ignorePatterns, prefix = '') {
  let tree = ''
  const items = fs
    .readdirSync(dir)
    .filter((item) => !shouldIgnore(path.join(dir, item), ignorePatterns))
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const isDir = fs.statSync(fullPath).isDirectory()
    tree += `${prefix}${isDir ? '|-- ' : '|-- '}${item}\n`
    if (isDir) {
      tree += buildTree(fullPath, ignorePatterns, prefix + '    ')
    }
  }
  return tree
}

// Ideal tree based on provided images
/**
 * Defines the ideal project structure to be enforced.
 * @type {import('./checkFrontendStandards.types.js').Tree}
 */
const IDEAL_TREE = {
  src: {
    assets: {},
    components: {
      SpecificComponent: {
        __test__: {},
        hooks: {},
        constants: {},
        components: {},
        enums: {},
        types: {},
        styles: {},
        'index.tsx': true,
      },
      OtherSpecificComponent: {
        __test__: {},
        hooks: {},
        constants: {},
        components: {},
        enums: {},
        types: {},
        styles: {},
        'index.tsx': true,
      },
      'index.ts': true,
    },
    constants: {
      'specificConstant.constant.ts': true,
      'otherSpecificConstant.constant.ts': true,
      'index.ts': true,
    },
    modules: {
      SpecificModule: {
        components: {},
        constants: {},
        types: {},
        hooks: {},
        enums: {},
        styles: {},
        utils: {},
        'index.ts': true,
      },
      OtherSpecificModule: {
        components: {},
        constants: {},
        types: {},
        enums: {},
        hooks: {},
        styles: {},
        utils: {},
        'index.ts': true,
      },
    },
    helper: {
      'specificUtil.helper.ts': true,
      'otherSpecificUtil.helper.ts': true,
      'index.ts': true,
    },
    hooks: {
      'useSpecific.hook.ts': true,
      'useSpecificOther.hook.ts': true,
      'index.ts': true,
    },
    providers: {
      'specificProvider.provider.ts': true,
      'index.ts': true,
    },
    styles: {
      'specificStyle.style.ts': true,
      'otherSpecificStyle.style.ts': true,
      'index.ts': true,
    },
    store: {
      reducers: {
        'specific.reducer.ts': true,
        'otherSpecific.reducer.ts': true,
        'index.ts': true,
      },
      types: {
        'specific.type.ts': true,
        'otherSpecific.type.ts': true,
        'index.ts': true,
      },
      'state.selector.ts': true,
      'state.interface.ts': true,
      store: true,
    },
  },
  'App.tsx': true,
  'index.js': true,
  '.eslintignore': true,
  '.eslintrc.js': true,
  '.gitignore': true,
  'package.json': true,
  'package-lock.json': true,
  'README.md': true,
}



/**
 * Recursively compares an actual directory tree with the ideal structure.
 * @param {import('./checkFrontendStandards.types.js').Tree} actual - The actual directory tree object.
 * @param {import('./checkFrontendStandards.types.js').Tree} ideal - The ideal directory tree object to compare against.
 * @param {string} [basePath=''] - The base path for the current comparison level (used for recursion).
 * @returns {import('./checkFrontendStandards.types.js').ValidationError[]} An array of error objects for missing files or directories.
 */
function compareTree(actual, ideal, basePath = '') {
  const errors = []
  for (const key in ideal) {
    if (!(key in actual)) {
      errors.push({
        rule: 'Tree structure',
        message: `Missing '${key}' in '${basePath || '.'}' according to the standard.`,
        file: path.join(basePath, key),
      })
    } else if (typeof ideal[key] === 'object' && ideal[key] !== null && typeof actual[key] === 'object' && actual[key] !== null) {
      // Recursive for subfolders, ensuring both are objects.
      errors.push(...compareTree(actual[key], ideal[key], path.join(basePath, key)))
    }
  }
  return errors
}

/**
 * Recursively compares an actual directory tree with the ideal structure, tracking both successes and failures.
 * @param {import('./checkFrontendStandards.types.js').Tree} actual - The actual directory tree object.
 * @param {import('./checkFrontendStandards.types.js').Tree} ideal - The ideal directory tree object to compare against.
 * @param {string} [basePath=''] - The base path for the current comparison level (used for recursion).
 * @returns {import('./checkFrontendStandards.types.js').ComparisonResult} An object containing arrays of errors and successful checks.
 */
function compareTreeWithSuccess(actual, ideal, basePath = '') {
  /** @type {import('./checkFrontendStandards.types.js').ValidationError[]} */
  const errors = []
  /** @type {Array<{rule: string, message: string, file: string}>} */
  const oks = []
  for (const key in ideal) {
    if (!(key in actual)) {
      errors.push({
        rule: 'Tree structure',
        message: `Missing '${key}' in '${basePath || '.'}' according to the standard.`,
        file: path.join(basePath, key),
      })
    } else if (typeof ideal[key] === 'object' && ideal[key] !== null && typeof actual[key] === 'object' && actual[key] !== null) {
      // Recursive for subfolders, ensuring both are objects.
      const { errors: subErrors, oks: subOks } = compareTreeWithSuccess(
        actual[key],
        ideal[key],
        path.join(basePath, key)
      )
      errors.push(...subErrors)
      oks.push(...subOks)
    } else {
      oks.push({
        rule: 'Tree structure',
        message: `Present: '${key}' in '${basePath || '.'}'`,
        file: path.join(basePath, key),
      })
    }
  }
  return { errors, oks }
}

/**
 * Builds an actual directory tree object from the file system.
 * @param {string} dir - The directory to build the tree from.
 * @param {string[]} ignorePatterns - An array of patterns to ignore.
 * @returns {import('./checkFrontendStandards.types.js').Tree} An object representing the actual directory tree.
 */
function buildActualTree(dir, ignorePatterns) {
  /** @type {import('./checkFrontendStandards.types.js').Tree} */
  const tree = {}
  const items = fs
    .readdirSync(dir)
    .filter((item) => !shouldIgnore(path.join(dir, item), ignorePatterns))
  for (const item of items) {
    const fullPath = path.join(dir, item)
    if (fs.statSync(fullPath).isDirectory()) {
      tree[item] = buildActualTree(fullPath, ignorePatterns)
    } else {
      tree[item] = true
    }
  }
  return tree
}

/**
 * Checks for unused variables in a file using an Abstract Syntax Tree (AST).
 * @param {string} content - The file content to analyze.
 * @param {string} filePath - The path to the file.
 * @returns {import('./checkFrontendStandards.types.js').ValidationError[]} An array of error objects for any unused variables found.
 */
function checkUnusedVariables(content, filePath) {
  /** @type {import('./checkFrontendStandards.types.js').ValidationError[]} */
  const errors = []
  try {
    // Enable location tracking to get line numbers
    const ast = acorn.parse(content, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      locations: true, // Important for line numbers
      // @ts-ignore - Acorn types don't officially include plugins, but it's needed for JSX
      plugins: { jsx: true },
      allowImportExportEverywhere: true,
    })

    const declared = new Map() // name -> { node, exported: false }
    const used = new Set()
    const exportedViaSpecifier = new Set()

    // Find `export { foo }` and `export default foo`
    acornWalk.simple(ast, {
      ExportNamedDeclaration(node) {
        if (node.specifiers) {
          for (const specifier of node.specifiers) {
            // @ts-ignore
            exportedViaSpecifier.add(specifier.local.name)
          }
        }
      },
      ExportDefaultDeclaration(node) {
        // @ts-ignore
        if (node.declaration && node.declaration.name) {
          // @ts-ignore
          exportedViaSpecifier.add(node.declaration.name)
          // @ts-ignore
        } else if (node.declaration && node.declaration.type === 'Identifier') {
          // @ts-ignore
          exportedViaSpecifier.add(node.declaration.name)
        }
      },
    })

    // Pass 1: Find all declarations and mark if they are exported.
    acornWalk.ancestor(ast, {
      VariableDeclarator(node, ancestors) {
        if (node.id.type === 'Identifier') {
          const name = node.id.name
          const parent = ancestors[ancestors.length - 2]
          const grandParent = ancestors.length > 2 ? ancestors[ancestors.length - 3] : null
          const isInlineExport =
            parent.type === 'VariableDeclaration' &&
            grandParent &&
            grandParent.type === 'ExportNamedDeclaration'
          const isSpecifierExport = exportedViaSpecifier.has(name)

          if (!declared.has(name)) {
            declared.set(name, {
              node: node.id,
              exported: isInlineExport || isSpecifierExport,
            })
          }
        }
      },
    })

    // Pass 2: Find all usages.
    acornWalk.ancestor(ast, {
      Identifier(node, ancestors) {
        const parent = ancestors[ancestors.length - 2]

        const isDeclaration =
          (parent.type === 'VariableDeclarator' && parent.id === node) ||
          (parent.type === 'FunctionDeclaration' && parent.id === node) ||
          (parent.type === 'ClassDeclaration' && parent.id === node) ||
          (parent.type === 'ImportSpecifier' && parent.local === node) ||
          (parent.type === 'ImportDefaultSpecifier' && parent.local === node) ||
          (parent.type === 'ImportNamespaceSpecifier' && parent.local === node) ||
          ((parent.type === 'FunctionDeclaration' ||
            parent.type === 'FunctionExpression' ||
            parent.type === 'ArrowFunctionExpression') &&
            parent.params.includes(node))

        const isPropertyKey = parent.type === 'Property' && parent.key === node && !parent.computed

        if (!isDeclaration && !isPropertyKey) {
          used.add(node.name)
        }
      },
    })

    for (const [name, decl] of declared.entries()) {
      if (!used.has(name) && !decl.exported && !/^_/.test(name)) {
        errors.push({
          rule: 'No unused variables',
          message: `Variable '${name}' is declared but never used. (@typescript-eslint/no-unused-vars rule)`,
          file: filePath,
          line: decl.node.loc.start.line,
        })
      }
    }
  } catch (e) {
    // If acorn fails to parse (e.g., complex TS syntax), we can add a log, but for now, we just skip.
    // console.error(`Could not parse ${filePath}: ${e.message}`)
  }
  return errors
}

/**
 * The main function of the script that orchestrates the entire validation process.
 * 
 * **Process Flow:**
 * 1. Loads custom rules from configuration file (if exists)
 * 2. Detects project type (monorepo vs single project)
 * 3. Determines zones to validate (from CLI args or auto-detection)
 * 4. Validates directory structure for each zone
 * 5. Checks file naming conventions and code quality rules
 * 6. Compares actual structure against ideal patterns
 * 7. Generates comprehensive report with errors and successes
 * 8. Writes results to log file for review
 * 
 * **Monorepo Support:**
 * - Auto-detects apps/ and packages/ directories
 * - Configurable via checkFrontendStandards.config.js
 * - Supports custom zone directories
 * 
 * **Output:**
 * - Detailed log file (frontend-standards.log) with file:line format
 * - Console summary with zone-by-zone error counts
 * - Directory tree visualization for structural issues
 * 
 * @returns {Promise<void>} A promise that resolves when validation is complete
 * @since 1.0.0
 * @example
 * ```js
 * // Run validation on entire project
 * await main()
 * ```
 * 
 * @example
 * ```bash
 * # Run validation on specific zones (via CLI)
 * node checkFrontendStandards.mjs apps packages
 * ```
 * 
 * @example
 * ```bash
 * # Check results
 * # Output written to frontend-standards.log
 * # Console shows: "Validation completed. Check the log at: ..."
 * ```
 */
async function main() {
  // Clear the flagged directories set at the beginning of each run
  flaggedDirectories.clear()

  const rules = await loadProjectRules()
  const zoneConfig = await loadZoneConfiguration()
  const isMono = isMonorepo(ROOT_DIR)
  const zones = getZonesFromArgs()
  let searchDirs = []
  const ignorePatterns = getIgnorePatterns()

  if (zones.length > 0) {
    searchDirs = zones.map((z) => path.join(ROOT_DIR, z)).filter((p) => fs.existsSync(p))
    if (searchDirs.length === 0) {
      // eslint-disable-next-line no-console
      console.warn('No se encontraron las zonas indicadas. Revisando todo el proyecto.')
      searchDirs = [ROOT_DIR]
    }
  } else if (isMono) {
    // By default, only include 'apps'. Include 'packages' only if configured
    const candidates = ['apps']
    if (zoneConfig.includePackages) {
      candidates.push('packages')
    }
    // Add any custom zones from configuration
    if (zoneConfig.customZones && zoneConfig.customZones.length > 0) {
      candidates.push(...zoneConfig.customZones)
    }

    searchDirs = candidates.map((c) => path.join(ROOT_DIR, c)).filter((p) => fs.existsSync(p))
    if (searchDirs.length === 0) searchDirs = [ROOT_DIR]
  } else {
    searchDirs = [ROOT_DIR]
  }

  // Agrupar errores por zona
  const zoneErrors = {}
  for (const dir of searchDirs) {
    // Si existe src, validar estructura src
    const srcPath = path.join(dir, 'src')
    if (fs.existsSync(srcPath)) {
      const srcStructErrors = checkSrcStructure(srcPath)
      if (srcStructErrors.length > 0) {
        zoneErrors['src'] = (zoneErrors['src'] || []).concat(srcStructErrors)
      }
    }
    // Si es monorepo, cada subcarpeta es una zona
    const subdirs = fs
      .readdirSync(dir)
      .map((d) => path.join(dir, d))
      .filter((p) => fs.statSync(p).isDirectory())
    const zonesToCheck = isMono ? subdirs : [dir]
    for (const zonePath of zonesToCheck) {
      const zoneName = path.relative(ROOT_DIR, zonePath) || '.'
      const zoneType = detectZoneType(zonePath)
      // Estructura mínima
      const missing = checkZoneStructure(zonePath, zoneType)
      if (missing.length > 0) {
        zoneErrors[zoneName] = zoneErrors[zoneName] || []
        zoneErrors[zoneName].push({
          rule: 'Folder structure',
          message: `Missing required elements for a zone of type '${zoneType}': ${missing.join(', ')}`,
          file: zonePath,
        })
      }
      // Archivos y nomenclatura
      const files = getAllFiles(zonePath, [], ignorePatterns)
      for (const file of files) {
        const errors = checkFile(file, rules)
        if (errors.length > 0) {
          zoneErrors[zoneName] = zoneErrors[zoneName] || []
          zoneErrors[zoneName].push(...errors)
        }
        const namingError = checkNamingConventions(file)
        if (namingError) {
          zoneErrors[zoneName] = zoneErrors[zoneName] || []
          zoneErrors[zoneName].push(namingError)
        }
      }

      // Validación de estructura de directorios
      const allDirs = getAllDirectories(zonePath, ignorePatterns)
      for (const dirPath of allDirs) {
        const dirErrors = checkDirectoryNaming(dirPath)
        if (dirErrors.length > 0) {
          zoneErrors[zoneName] = zoneErrors[zoneName] || []
          zoneErrors[zoneName].push(...dirErrors)
        }

        // Validación de estructura de componentes
        if (dirPath.includes('/components/') || dirPath.includes('\\components\\')) {
          const componentErrors = checkComponentStructure(dirPath)
          if (componentErrors.length > 0) {
            zoneErrors[zoneName] = zoneErrors[zoneName] || []
            zoneErrors[zoneName].push(...componentErrors)
          }
        }
      }
    }
  }

  // Validación de árbol ideal por zona
  let hasFolderErrors = false
  const actualTree = buildActualTree(ROOT_DIR, ignorePatterns)
  const zonesToValidate = actualTree.src ? Object.keys(actualTree.src) : []
  for (const zone of zonesToValidate) {
    if (!IDEAL_TREE.src[zone]) continue
    const { errors: treeErrors, oks: treeOks } = compareTreeWithSuccess(
      actualTree.src[zone],
      IDEAL_TREE.src[zone],
      path.join('src', zone)
    )
    if (treeErrors.length > 0) {
      hasFolderErrors = true
      zoneErrors[zone] = (zoneErrors[zone] || []).concat(treeErrors)
    }
    if (treeOks.length > 0) {
      zoneErrors[zone] = (zoneErrors[zone] || []).concat(treeOks)
    }
    if (treeErrors.length === 0 && treeOks.length > 0) {
      zoneErrors[zone] = zoneErrors[zone] || []
      zoneErrors[zone].push({
        rule: 'Tree structure',
        message: `✅ The structure of the zone '${zone}' is correct.`,
        file: path.join('src', zone),
      })
    }
  }

  // Log agrupado por zona
  /** @type {string[]} */
  const logLines = []
  const oksByZone = {}
  const errorsByZone = {}
  const totalCheckedByZone = {}
  if (Object.keys(zoneErrors).length === 0) {
    logLines.push('✅ All files and zones comply with the defined standards!')
  } else {
    logLines.push('Result of standards validation by zone:\n')
    for (const [zone, errors] of Object.entries(zoneErrors)) {
      logLines.push(`Zone: ${zone}`)
      errorsByZone[zone] = 0
      oksByZone[zone] = []
      totalCheckedByZone[zone] = 0
      for (const error of errors) {
        if (error.message.startsWith('✅')) {
          oksByZone[zone].push(error.message.replace('✅ ', ''))
          totalCheckedByZone[zone]++
        } else if (error.message.startsWith('Presente:')) {
          oksByZone[zone].push(error.message.replace('Presente:', '').trim())
          totalCheckedByZone[zone]++
        } else {
          errorsByZone[zone]++
          totalCheckedByZone[zone]++
          // New format file:line for direct navigation
          logLines.push(`  ${error.file}${error.line ? `:${error.line}` : ''}`)
          logLines.push(`    Rule: ${error.rule}`)
          logLines.push(`    Explanation: ${error.message}`)
          logLines.push('  ---')
        }
      }
      logLines.push('')
    }
    if (hasFolderErrors) {
      logLines.push('---\nCurrent structure of the folder and file tree:\n')
      logLines.push(buildTree(ROOT_DIR, ignorePatterns))
    }
    // Summary of correct and total zones
    logLines.push('\n----------------------------------')
    logLines.push('\nSummary by zone:')
    for (const [zone, oks] of Object.entries(oksByZone)) {
      const total = totalCheckedByZone[zone]
      logLines.push(`- Zone: ${zone} | Errors: ${errorsByZone[zone] || 0}`)
    }

    // Summary of errors by rule type
    const errorsByRule = {}
    let totalErrors = 0
    for (const [zone, errors] of Object.entries(zoneErrors)) {
      for (const error of errors) {
        if (!error.message.startsWith('✅') && !error.message.startsWith('Presente:')) {
          errorsByRule[error.rule] = (errorsByRule[error.rule] || 0) + 1
          totalErrors++
        }
      }
    }

    if (totalErrors > 0) {
      logLines.push('\n----------------------------------')
      logLines.push('\nSummary of errors by rule type:')

      // Sort by frequency (most common errors first)
      const sortedRules = Object.entries(errorsByRule)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15) // Show top 15 most common errors

      for (const [rule, count] of sortedRules) {
        const percentage = ((count / totalErrors) * 100).toFixed(1)
        logLines.push(`- ${rule}: ${count} occurrences (${percentage}%)`)
      }

      logLines.push(`\nTotal errors found: ${totalErrors}`)
    }
  }
  writeLogAndPrint(logLines)
}

// Track directories that have already been flagged for naming errors
const flaggedDirectories = new Set()

// Validation for directory naming (camelCase)
/**
 * Checks if a directory's name follows the camelCase or PascalCase convention.
 * It ignores common non-code directories (e.g., node_modules, .git, public) and special monorepo folders.
 * Only directories inside a `src` folder are actively checked.
 * @param {string} dirPath - The absolute path to the directory to check.
 * @returns {import('./checkFrontendStandards.types.js').ValidationError[]} An array of error objects if the naming is incorrect, otherwise an empty array.
 */
function checkDirectoryNaming(dirPath) {
  /** @type {import('./checkFrontendStandards.types.js').ValidationError[]} */
  const errors = []
  const relativePath = path.relative(ROOT_DIR, dirPath)
  const currentDirName = path.basename(dirPath)

  // Skip excluded directories and files
  if (
    currentDirName.startsWith('.') ||
    currentDirName === 'node_modules' ||
    currentDirName === '__tests__' ||
    currentDirName === '__test__' ||
    currentDirName.includes('(') ||
    currentDirName.includes(')') ||
    currentDirName.includes('[') ||
    currentDirName.includes(']') ||
    currentDirName === 'coverage' ||
    currentDirName === 'dist' ||
    currentDirName === 'build' ||
    currentDirName === 'public' ||
    currentDirName === 'static' ||
    currentDirName === 'temp' ||
    currentDirName === 'tmp' ||
    currentDirName.startsWith('__') ||
    // Skip framework-specific directories that are allowed to have different naming
    currentDirName === 'api' ||
    currentDirName === 'lib' ||
    currentDirName === 'utils' ||
    currentDirName === 'pages' ||
    currentDirName === 'components' ||
    currentDirName === 'styles' ||
    currentDirName === 'types' ||
    currentDirName === 'hooks' ||
    currentDirName === 'constants' ||
    currentDirName === 'helpers' ||
    currentDirName === 'assets' ||
    currentDirName === 'enums'
  ) {
    return errors
  }

  // Skip if it's the root directory or first level directories in monorepo (apps, packages, etc)
  if (['apps', 'packages', 'config', 'k8s', 'src'].includes(currentDirName)) {
    return errors
  }

  // Only check directories that are actually inside meaningful project structure
  if (relativePath.includes('/src/') && !relativePath.includes('/node_modules/')) {
    // Check if current directory follows camelCase convention
    // Allow PascalCase for component directories and camelCase for others
    const isCamelCase = /^[a-z][a-zA-Z0-9]*$/.test(currentDirName)
    const isPascalCase = /^[A-Z][a-zA-Z0-9]*$/.test(currentDirName)

    // Special case: Allow kebab-case for route directories (Next.js routing)
    const isValidRouteDir =
      /^[a-z0-9]+(-[a-z0-9]+)*$/.test(currentDirName) &&
      (relativePath.includes('/app/') || relativePath.includes('/pages/'))

    if (!isCamelCase && !isPascalCase && !isValidRouteDir) {
      // Check if we've already flagged this directory name in any path
      const alreadyFlagged = Array.from(flaggedDirectories).some(
        (flaggedPath) => path.basename(flaggedPath) === currentDirName
      )

      if (!alreadyFlagged) {
        // Generate a proper camelCase suggestion based on the actual directory name
        const camelCaseSuggestion = currentDirName
          .toLowerCase()
          .replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
          .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase())

        errors.push({
          rule: 'Directory naming',
          message: `Directory '${currentDirName}' should follow camelCase convention (e.g., '${camelCaseSuggestion}')`,
          file: dirPath,
        })

        // Mark this directory name as flagged
        flaggedDirectories.add(dirPath)
      }
    }
  }

  return errors
}


/**
 * Checks if a file within an 'assets' directory follows the kebab-case naming convention.
 * Validation for assets naming (kebab-case)
 * @param {string} filePath - The absolute path to the asset file.
 * @returns {import('./checkFrontendStandards.types.js').ValidationError | null} An error object if the naming is incorrect, otherwise null.
 */
function checkAssetNaming(filePath) {
  const fileName = path.basename(filePath)
  const fileExt = path.extname(fileName)
  const baseName = fileName.replace(fileExt, '')

  // Check if file is in assets directory
  if (!filePath.includes('/assets/') && !filePath.includes('\\assets\\')) {
    return null
  }

  // Assets should follow kebab-case
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(baseName)) {
    return {
      rule: 'Asset naming',
      message: 'Assets must follow kebab-case convention (e.g., service-error.svg)',
      file: filePath,
    }
  }

  return null
}

// Validation for component structure
/**
 * Validates the internal structure of a component directory.
 * It checks for the presence and correct naming of index files, hooks, styles, and types directories.
 * @param {string} componentDir - The absolute path to the component directory.
 * @returns {import('./checkFrontendStandards.types.js').ValidationError[]} An array of error objects for any structural issues found.
 */
function checkComponentStructure(componentDir) {
  /** @type {import('./checkFrontendStandards.types.js').ValidationError[]} */
  const errors = []
  const componentName = path.basename(componentDir)

  // Skip validation for generic 'components' directories that are just containers
  if (componentName === 'components') {
    return errors
  }

  // Different expectations based on directory type
  const isUtilityDir = ['hooks', 'types', 'constants', 'helpers', 'utils'].includes(componentName)
  const expectedIndexFile = isUtilityDir ? 'index.ts' : 'index.tsx'
  const indexTsxFile = path.join(componentDir, 'index.tsx')
  const indexTsFile = path.join(componentDir, 'index.ts')

  if (isUtilityDir) {
    // Utility directories should have index.ts
    if (!fs.existsSync(indexTsFile)) {
      errors.push({
        rule: 'Component structure',
        message: `Utility directory '${componentName}' should have an index.ts file for exports`,
        file: indexTsFile,
      })
    }
  } else {
    // Component directories should have index.tsx or index.ts
    if (!fs.existsSync(indexTsxFile) && !fs.existsSync(indexTsFile)) {
      errors.push({
        rule: 'Component structure',
        message:
          'Component must have an index.tsx file (for components) or index.ts file (for exports)',
        file: indexTsxFile,
      })
    }
  }

  // Check for hooks directory and hook file naming
  const hooksDir = path.join(componentDir, 'hooks')
  if (fs.existsSync(hooksDir)) {
    const hookFiles = fs
      .readdirSync(hooksDir)
      .filter((file) => file.endsWith('.hook.ts') || file.endsWith('.hook.tsx'))
      .filter((file) => !file.includes('.test.') && !file.includes('.spec.'))

    if (hookFiles.length > 0) {
      // Check if the existing hook files have the correct extension based on their content
      for (const hookFile of hookFiles) {
        const hookFilePath = path.join(hooksDir, hookFile)
        const hookContent = fs.readFileSync(hookFilePath, 'utf8')

        // More precise JSX detection - avoid TypeScript generics
        const hasJSX =
          // JSX elements being returned
          /return\s*\(?\s*<[A-Z][a-zA-Z]*[\s>]/.test(hookContent) ||
          // JSX elements in variable assignments
          /=\s*<[A-Z][a-zA-Z]*[\s>]/.test(hookContent) ||
          // JSX elements after curly braces (like in conditionals)
          /{\s*<[A-Z][a-zA-Z]*[\s>]/.test(hookContent) ||
          // React.createElement calls
          /React\.createElement/.test(hookContent) ||
          // Direct jsx() calls
          /jsx\s*\(/.test(hookContent) ||
          // JSX fragments
          /<>|<\/>/.test(hookContent) ||
          // JSX with attributes more clearly
          /<[A-Z][a-zA-Z]*\s+[a-zA-Z]/.test(hookContent)

        const currentExtension = path.extname(hookFile)
        const shouldBeTsx = hasJSX
        const shouldBeTs = !hasJSX

        if (shouldBeTsx && currentExtension === '.ts') {
          errors.push({
            rule: 'Component hook naming',
            message: `Hook file should have .tsx extension because it renders JSX elements`,
            file: hookFilePath,
          })
        } else if (shouldBeTs && currentExtension === '.tsx') {
          errors.push({
            rule: 'Component hook naming',
            message: `Hook file should have .ts extension because it doesn't render JSX elements`,
            file: hookFilePath,
          })
        }
      }
    }
  }

  // Check for styles directory and style file naming
  const stylesDir = path.join(componentDir, 'styles')
  if (fs.existsSync(stylesDir)) {
    const styleFiles = fs
      .readdirSync(stylesDir)
      .filter((file) => file.endsWith('.style.ts') || file.endsWith('.ts'))
      .filter((file) => !file.includes('.test.') && !file.includes('.spec.'))

    if (styleFiles.length > 0) {
      for (const styleFile of styleFiles) {
        if (!styleFile.endsWith('.style.ts')) {
          const styleFilePath = path.join(stylesDir, styleFile)
          errors.push({
            rule: 'Component style naming',
            message: `Style file should end with .style.ts`,
            file: styleFilePath,
          })
        }
      }
    }
  }

  // Check for types directory and type file naming
  const typesDir = path.join(componentDir, 'types')
  if (fs.existsSync(typesDir)) {
    const typeFiles = fs
      .readdirSync(typesDir)
      .filter(
        (file) =>
          file.endsWith('.ts') &&
          !file.includes('.test.') &&
          !file.includes('.spec.') &&
          file !== 'index.ts'
      )

    if (typeFiles.length > 0) {
      for (const typeFile of typeFiles) {
        if (!typeFile.endsWith('.type.ts')) {
          const typeFilePath = path.join(typesDir, typeFile)
          errors.push({
            rule: 'Component type naming',
            message: `Type file should end with .type.ts`,
            file: typeFilePath,
          })
        }
      }
    }
  }

  return errors
}

// Validation for function naming (camelCase)
/**
 * Checks if function names follow the camelCase convention.
 * It ignores React components (PascalCase) and hooks (starting with 'use').
 * @param {string} content - The file content to analyze.
 * @param {string} filePath - The path to the file.
 * @returns {import('./checkFrontendStandards.types.js').ValidationError[]} An array of error objects for any functions with incorrect naming.
 */
function checkFunctionNaming(content, filePath) {
  /** @type {import('./checkFrontendStandards.types.js').ValidationError[]} */
  const errors = []
  const lines = content.split('\n')

  lines.forEach((line, idx) => {
    // Match function declarations and arrow functions
    const functionMatches = line.match(
      /(?:function\s+|const\s+|let\s+|var\s+)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?:\(|\s*=\s*(?:\(|async\s*\())/g
    )

    if (functionMatches) {
      functionMatches.forEach((match) => {
        const functionNameMatch = match.match(
          /(?:function\s+|const\s+|let\s+|var\s+)([a-zA-Z_$][a-zA-Z0-9_$]*)/
        )
        if (functionNameMatch && functionNameMatch[1]) {
          const functionName = functionNameMatch[1]

          // Skip React components (PascalCase) and hooks (start with 'use')
          if (/^[A-Z]/.test(functionName) || functionName.startsWith('use')) {
            return
          }

          // Function should follow camelCase
          if (!/^[a-z][a-zA-Z0-9]*$/.test(functionName)) {
            errors.push({
              rule: 'Function naming',
              message: 'Functions must follow camelCase convention (e.g., getProvinces)',
              file: filePath,
              line: idx + 1,
            })
          }
        }
      })
    }
  })

  return errors
}

// Enhanced interface validation
/**
 * Checks if exported interface names follow the 'I' + PascalCase convention (e.g., IButtonProps).
 * @param {string} content - The file content to analyze.
 * @param {string} filePath - The path to the file.
 * @returns {import('./checkFrontendStandards.types.js').ValidationError[]} An array of error objects for any interfaces with incorrect naming.
 */
function checkInterfaceNaming(content, filePath) {
  /** @type {import('./checkFrontendStandards.types.js').ValidationError[]} */
  const errors = []
  const lines = content.split('\n')

  lines.forEach((line, idx) => {
    // Match exported interfaces
    const interfaceMatch = line.match(/export\s+interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g)

    if (interfaceMatch) {
      interfaceMatch.forEach((match) => {
        const interfaceNameMatch = match.match(/export\s+interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/)
        if (interfaceNameMatch && interfaceNameMatch[1]) {
          const interfaceName = interfaceNameMatch[1]

          // Interface should start with 'I' and follow PascalCase
          if (!/^I[A-Z][a-zA-Z0-9]*$/.test(interfaceName)) {
            errors.push({
              rule: 'Interface naming',
              message:
                'Exported interfaces must start with "I" and follow PascalCase (e.g., IButtonProps)',
              file: filePath,
              line: idx + 1,
            })
          }
        }
      })
    }
  })

  return errors
}

// Validation for style file content and naming
/**
 * Checks for style conventions in `.style.ts` files.
 * It validates that style objects are named in camelCase ending with 'Styles' (e.g., cardStyles).
 * It also validates that style properties are in camelCase.
 * @param {string} content - The file content to analyze.
 * @param {string} filePath - The path to the file.
 * @returns {import('./checkFrontendStandards.types.js').ValidationError[]} An array of error objects for any style convention violations.
 */
function checkStyleConventions(content, filePath) {
  /** @type {import('./checkFrontendStandards.types.js').ValidationError[]} */
  const errors = []

  // Only check .style.ts files
  if (!filePath.endsWith('.style.ts')) {
    return errors
  }

  const lines = content.split('\n')

  lines.forEach((line, idx) => {
    // Check if StyleSheet.create is used (for React Native)
    if (/StyleSheet\.create\s*\(/.test(line)) {
      // This is good, StyleSheet.create is being used
      return
    }

    // Check for style object exports
    const exportMatch = line.match(/export\s+const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/)
    if (exportMatch) {
      const styleName = exportMatch[1]

      // Style names should be in camelCase and end with 'Styles'
      if (!/^[a-z][a-zA-Z0-9]*Styles$/.test(styleName)) {
        errors.push({
          rule: 'Style naming',
          message: `Style object '${styleName}' should be in camelCase and end with 'Styles' (e.g., cardPreviewStyles)`,
          file: filePath,
          line: idx + 1,
        })
      }
    }

    // Check style properties inside objects
    const propertyMatch = line.match(/^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/)
    if (propertyMatch) {
      const propertyName = propertyMatch[1]

      // Style properties should be in camelCase
      if (!/^[a-z][a-zA-Z0-9]*$/.test(propertyName)) {
        errors.push({
          rule: 'Style property naming',
          message: `Style property '${propertyName}' should be in camelCase`,
          file: filePath,
          line: idx + 1,
        })
      }
    }
  })

  return errors
}

/**
 * Loads the zone configuration from `checkFrontendStandards.config.js`.
 * This determines which high-level directories (like 'apps' or 'packages') should be scanned.
 * @returns {Promise<import('./checkFrontendStandards.types.js').ZoneConfig>} A promise that resolves to the zone configuration object.
 */
async function loadZoneConfiguration() {
  const configPath = path.join(ROOT_DIR, 'checkFrontendStandards.config.js')
  if (fs.existsSync(configPath)) {
    const configModule = await import(configPath + `?t=${Date.now()}`)
    const config = configModule.default || configModule

    // If the config exports an object with zones configuration
    if (config && config.zones) {
      return config.zones
    }
  }

  // Default zones configuration
  return {
    includePackages: false, // By default, exclude packages
    customZones: [], // Custom zones to include
  }
}

main()
