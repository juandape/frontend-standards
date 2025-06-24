import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as acorn from 'acorn'
import * as acornWalk from 'acorn-walk'

// Support for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url)

const EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx']
const ROOT_DIR = process.cwd()
const LOG_FILE = path.join(ROOT_DIR, 'frontend-standards.log')

// Project rules configuration
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
    check: (content, filePath) => {
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
            currentScope = scopeStack.pop()
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
    check: (content) =>
      /\/\*\*\s*\n\s*\* [^\n]+\n/.test(content) === false &&
      /export (function|class|const|let|var)/.test(content),
    message:
      'Exported functions, classes, and modules must have TSDoc comments (tsdoc/syntax rule).',
  },
  {
    name: 'Interface naming convention',
    check: (content) => {
      // Check for exported interfaces that don't follow IComponentName pattern
      const interfaceMatches = content.match(/export\s+interface\s+([A-Za-z_][A-Za-z0-9_]*)/g)
      if (interfaceMatches) {
        return interfaceMatches.some((match) => {
          const interfaceName = match.replace(/export\s+interface\s+/, '')
          return !/^I[A-Z][a-zA-Z0-9]*$/.test(interfaceName)
        })
      }
      return false
    },
    message:
      'Exported interfaces must start with I followed by PascalCase (e.g., IComponentProps).',
  },
]

// Load custom rules from a config file if present, and allow merging with default rules
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

function isMonorepo(rootDir) {
  const monorepoMarkers = ['packages', 'apps', 'lerna.json', 'turbo.json']
  return monorepoMarkers.some((marker) => fs.existsSync(path.join(rootDir, marker)))
}

// Read ignore patterns from .gitignore
function getIgnorePatterns() {
  const ignore = ['node_modules', '.next', '.git', '__tests__', '__test__']
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
      return filePath.includes(path.sep + pattern.replace(/\/$/, ''))
    }
    // Simple file or pattern
    return filePath.includes(pattern)
  })
}

function getAllFiles(dir, files = [], ignorePatterns = getIgnorePatterns()) {
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

function checkFile(filePath, rules) {
  const content = fs.readFileSync(filePath, 'utf8')
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

function getZonesFromArgs() {
  return process.argv.slice(2)
}

function writeLogAndPrint(logLines) {
  fs.writeFileSync(LOG_FILE, logLines.join('\n'))
  // eslint-disable-next-line no-console
  console.info(`Validation completed. Check the log at: ${LOG_FILE}`)
}

// Expected structure by zone type
const DEFAULT_STRUCTURE = {
  app: ['pages', 'components', 'public'],
  package: ['src', 'package.json'],
}

// Expected structure for src and subfolders
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

// Naming conventions by file type
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

function detectZoneType(zonePath) {
  // Simple heuristic: if it has package.json and src, it's a package; if it has pages, it's an app
  const hasPackageJson = fs.existsSync(path.join(zonePath, 'package.json'))
  const hasSrc = fs.existsSync(path.join(zonePath, 'src'))
  const hasPages = fs.existsSync(path.join(zonePath, 'pages'))
  if (hasPages) return 'app'
  if (hasPackageJson && hasSrc) return 'package'
  return 'other'
}

function checkZoneStructure(zonePath, zoneType, expectedStructure = DEFAULT_STRUCTURE) {
  const missing = []
  const expected = expectedStructure[zoneType] || []
  for (const item of expected) {
    if (!fs.existsSync(path.join(zonePath, item))) missing.push(item)
  }
  return missing
}

function checkSrcStructure(srcPath) {
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
function checkInlineStyles(content, filePath) {
  const lines = content.split('\n')
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

function checkCommentedCode(content, filePath) {
  const lines = content.split('\n')
  const errors = []
  let inJSDoc = false
  lines.forEach((line, idx) => {
    if (/^\s*\/\*\*/.test(line)) inJSDoc = true
    if (inJSDoc && /\*\//.test(line)) inJSDoc = false
    if (!inJSDoc && /^\s*\/\//.test(line) && !/eslint|tslint|TODO|FIXME|@/.test(line)) {
      errors.push({
        rule: 'Commented code',
        message: 'Leaving commented code in the repository is not allowed.',
        file: filePath,
        line: idx + 1,
      })
    }
  })
  return errors
}

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

function checkHardcodedData(content, filePath) {
  const lines = content.split('\n')
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

    if (
      hasHardcodedPattern &&
      !isCSSClass &&
      !isTailwindClass &&
      !hasClassContext &&
      !isTestFile &&
      !isImportStatement &&
      !isURL &&
      !isSingleLineComment &&
      !isMultiLineComment
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

function checkFunctionComments(content, filePath) {
  const lines = content.split('\n')
  const errors = []
  let inComplexFunction = false
  let functionLine = 0
  lines.forEach((line, idx) => {
    if (/function\s+\w+|const\s+\w+\s*=\s*\(/.test(line)) {
      inComplexFunction = /if|for|while|switch|catch|try|await|async|Promise/.test(line)
      functionLine = idx + 1
    }
    if (inComplexFunction && !/\/\*/.test(lines[functionLine - 2] || '')) {
      errors.push({
        rule: 'Missing comment in complex function',
        message: 'Complex functions must have comments in English explaining their behavior.',
        file: filePath,
        line: functionLine,
      })
      inComplexFunction = false
    }
  })
  return errors
}

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

function compareTree(actual, ideal, basePath = '') {
  const errors = []
  for (const key in ideal) {
    if (!(key in actual)) {
      errors.push({
        rule: 'Tree structure',
        message: `Missing '${key}' in '${basePath || '.'}' according to the standard.`,
        file: path.join(basePath, key),
      })
    } else if (typeof ideal[key] === 'object' && ideal[key] !== true) {
      // Recursive for subfolders
      errors.push(...compareTree(actual[key] || {}, ideal[key], path.join(basePath, key)))
    }
  }
  return errors
}

function compareTreeWithSuccess(actual, ideal, basePath = '') {
  const errors = []
  const oks = []
  for (const key in ideal) {
    if (!(key in actual)) {
      errors.push({
        rule: 'Tree structure',
        message: `Missing '${key}' in '${basePath || '.'}' according to the standard.`,
        file: path.join(basePath, key),
      })
    } else if (typeof ideal[key] === 'object' && ideal[key] !== true) {
      // Recursive for subfolders
      const { errors: subErrors, oks: subOks } = compareTreeWithSuccess(
        actual[key] || {},
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

function buildActualTree(dir, ignorePatterns) {
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

function checkUnusedVariables(content, filePath) {
  const errors = []
  try {
    // Enable location tracking to get line numbers
    const ast = acorn.parse(content, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      locations: true, // Important for line numbers
      plugins: { jsx: true }, // Enable JSX parsing
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
            exportedViaSpecifier.add(specifier.local.name)
          }
        }
      },
      ExportDefaultDeclaration(node) {
        if (node.declaration && node.declaration.name) {
          exportedViaSpecifier.add(node.declaration.name)
        } else if (node.declaration && node.declaration.type === 'Identifier') {
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
  }
  writeLogAndPrint(logLines)
}

// Track directories that have already been flagged for naming errors
const flaggedDirectories = new Set()

// Validation for directory naming (camelCase)
function checkDirectoryNaming(dirPath) {
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
    currentDirName.startsWith('__')
  ) {
    return errors
  }

  // Skip if it's the root directory or first level directories in monorepo (apps, packages, etc)
  if (['apps', 'packages', 'config', 'k8s'].includes(currentDirName)) {
    return errors
  }

  // Only check directories that are actually inside src and are meaningful directories
  if (relativePath.includes('/src/')) {
    // Check if current directory follows camelCase convention
    // Allow PascalCase for component directories and camelCase for others
    const isCamelCase = /^[a-z][a-zA-Z0-9]*$/.test(currentDirName)
    const isPascalCase = /^[A-Z][a-zA-Z0-9]*$/.test(currentDirName)

    if (!isCamelCase && !isPascalCase) {
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

// Validation for assets naming (kebab-case)
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
function checkComponentStructure(componentDir) {
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
      .filter(
        (file) =>
          file.startsWith(`use${componentName}.hook.`) &&
          (file.endsWith('.ts') || file.endsWith('.tsx'))
      )

    if (hookFiles.length === 0) {
      // No hook file found, suggest the basic .ts version
      const expectedHookFile = path.join(hooksDir, `use${componentName}.hook.ts`)
      errors.push({
        rule: 'Component hook naming',
        message: `Hook file should be named use${componentName}.hook.ts (or .tsx if it renders JSX)`,
        file: expectedHookFile,
      })
    } else {
      // Check if the existing hook file has the correct extension based on its content
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
            message: `Hook file should be named use${componentName}.hook.tsx because it renders JSX elements`,
            file: hookFilePath,
          })
        } else if (shouldBeTs && currentExtension === '.tsx') {
          errors.push({
            rule: 'Component hook naming',
            message: `Hook file should be named use${componentName}.hook.ts because it doesn't render JSX elements`,
            file: hookFilePath,
          })
        }
      }
    }
  }

  // Check for styles directory and style file naming
  const stylesDir = path.join(componentDir, 'styles')
  if (fs.existsSync(stylesDir)) {
    // Convert PascalCase component name to camelCase for style files
    const camelCaseStyleName = componentName.charAt(0).toLowerCase() + componentName.slice(1)
    const expectedStyleFile = path.join(stylesDir, `${camelCaseStyleName}.style.ts`)
    if (!fs.existsSync(expectedStyleFile)) {
      errors.push({
        rule: 'Component style naming',
        message: `Style file should be named ${camelCaseStyleName}.style.ts`,
        file: expectedStyleFile,
      })
    }
  }

  // Check for types directory and type file naming
  const typesDir = path.join(componentDir, 'types')
  if (fs.existsSync(typesDir)) {
    // Convert PascalCase component name to camelCase for type files
    const camelCaseTypeName = componentName.charAt(0).toLowerCase() + componentName.slice(1)
    const expectedTypeFile = path.join(typesDir, `${camelCaseTypeName}.type.ts`)
    if (!fs.existsSync(expectedTypeFile)) {
      errors.push({
        rule: 'Component type naming',
        message: `Type file should be named ${camelCaseTypeName}.type.ts`,
        file: expectedTypeFile,
      })
    }
  }

  return errors
}

// Validation for function naming (camelCase)
function checkFunctionNaming(content, filePath) {
  const errors = []
  const lines = content.split('\n')

  lines.forEach((line, idx) => {
    // Match function declarations and arrow functions
    const functionMatches = line.match(
      /(?:function\s+|const\s+|let\s+|var\s+)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?:\(|\s*=\s*(?:\(|async\s*\())/g
    )

    if (functionMatches) {
      functionMatches.forEach((match) => {
        const functionName = match.match(
          /(?:function\s+|const\s+|let\s+|var\s+)([a-zA-Z_$][a-zA-Z0-9_$]*)/
        )[1]

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
      })
    }
  })

  return errors
}

// Enhanced interface validation
function checkInterfaceNaming(content, filePath) {
  const errors = []
  const lines = content.split('\n')

  lines.forEach((line, idx) => {
    // Match exported interfaces
    const interfaceMatch = line.match(/export\s+interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g)

    if (interfaceMatch) {
      interfaceMatch.forEach((match) => {
        const interfaceName = match.match(/export\s+interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/)[1]

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
      })
    }
  })

  return errors
}

// Validation for style file content and naming
function checkStyleConventions(content, filePath) {
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
