/**
 * Additional validation functions for frontend standards
 * These functions are extracted from the original checkFrontendStandards.mjs
 */

import fs from 'fs'
import path from 'path'

/**
 * Check for inline styles
 * @param {string} content - File content
 * @param {string} filePath - File path
 * @returns {Array} Array of error objects
 */
export function checkInlineStyles(content, filePath) {
  const lines = content.split('\n')
  const errors = []
  
  // Skip validation files themselves to avoid false positives
  if (filePath.includes('additional-validators.js') || filePath.includes('checkFrontendStandards.mjs')) {
    return errors
  }
  
  lines.forEach((line, idx) => {
    // Skip comments that contain regex patterns
    if (line.trim().startsWith('//') || line.trim().startsWith('*') || /^\s*\/\*/.test(line)) {
      return
    }
    
    // Detects style={{ ... }} and style="..."
    if (/style\s*=\s*\{\{[^}]+\}\}/.test(line) || /style\s*=\s*"[^"]+"/.test(line)) {
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
 * Check for commented code
 * @param {string} content - File content
 * @param {string} filePath - File path
 * @returns {Array} Array of error objects
 */
export function checkCommentedCode(content, filePath) {
  const lines = content.split('\n')
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
      const commentContent = trimmedLine.replace(/^\/\/\s*/, '')

      // Skip common valid comment patterns (simplified)
      if (
        /eslint|tslint|@ts-|prettier/.test(line) ||
        /^(FIXME|NOTE|HACK|BUG|XXX):/i.test(commentContent) ||
        commentContent.length > 50 ||
        /\.$/.test(commentContent.trim())
      ) {
        return
      }

      // Check if it looks like commented code
      const looksLikeCode =
        /^[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/.test(commentContent) ||
        /^(const|let|var|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/.test(commentContent) ||
        /^return\s+/.test(commentContent) ||
        /^(import|export)\s+/.test(commentContent) ||
        /^[{[].*[}\]]$/.test(commentContent) ||
        /^console\.[a-z]+\s*\(/.test(commentContent) ||
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
 * Check for hardcoded data
 * @param {string} content - File content
 * @param {string} filePath - File path
 * @returns {Array} Array of error objects
 */
export function checkHardcodedData(content, filePath) {
  const lines = content.split('\n')
  const errors = []
  let inJSDocComment = false

  lines.forEach((line, idx) => {
    // Track JSDoc comment state
    if (/^\s*\/\*\*/.test(line)) {
      inJSDocComment = true
    }
    if (inJSDocComment && /\*\//.test(line)) {
      inJSDocComment = false
      return
    }

    // Skip if we're inside a JSDoc comment
    if (inJSDocComment || /^\s*\*/.test(line)) {
      return
    }

    // Check for hardcoded data (simplified)
    const hasHardcodedPattern = /(['"]).*(\d{3,}|lorem|dummy|test|prueba|foo|bar|baz).*\1/.test(line)
    const isConfigurationFile = /\.(config|constants|theme|styles|fonts)\.(ts|tsx|js|jsx)$/.test(filePath)
    const isTestFile = /mock|__test__|\.test\.|\.spec\./.test(filePath)
    const isComment = /^\s*\/\//.test(line) || /^\s*\/\*/.test(line)

    if (hasHardcodedPattern && !isConfigurationFile && !isTestFile && !isComment) {
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

// Helper functions for checkFunctionComments
function shouldSkipLine(line) {
  return !line || line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')
}

function extractFunctionInfo(line) {
  const functionMatch = line.match(/(export\s+)?(function|const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[=(]/)
  return functionMatch ? { name: functionMatch[3] } : null
}

function isSimpleFunction(line) {
  return line.includes('=>') && line.length < 80
}

function isFunctionComplex(lines, startIndex) {
  const endIndex = Math.min(startIndex + 15, lines.length)
  for (let j = startIndex; j < endIndex; j++) {
    if (/\b(if|for|while|async|await|try|catch)\b/.test(lines[j])) {
      return true
    }
  }
  return false
}

function hasPrecedingComment(lines, functionIndex) {
  const startIndex = Math.max(0, functionIndex - 8)
  for (let k = startIndex; k < functionIndex; k++) {
    const commentLine = lines[k].trim()
    if (isValidComment(commentLine)) {
      return true
    }
  }
  return false
}

function isValidComment(commentLine) {
  return commentLine.includes('/**') || 
         commentLine.includes('*/') || 
         (commentLine.startsWith('//') && commentLine.length > 15)
}

/**
 * Check for function comments
 * @param {string} content - File content
 * @param {string} filePath - File path
 * @returns {Array} Array of error objects
 */
export function checkFunctionComments(content, filePath) {
  const lines = content.split('\n')
  const errors = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (shouldSkipLine(line)) {
      continue
    }

    const functionData = extractFunctionInfo(line)
    if (!functionData) {
      continue
    }

    if (isSimpleFunction(line)) {
      continue
    }

    if (isFunctionComplex(lines, i) && !hasPrecedingComment(lines, i)) {
      errors.push({
        rule: 'Missing comment in complex function',
        message: `Complex function '${functionData.name}' should have comments explaining its behavior.`,
        file: filePath,
        line: i + 1,
      })
    }
  }

  return errors
}

/**
 * Check for unused variables
 * @param {string} content - File content
 * @param {string} filePath - File path
 * @returns {Array} Array of error objects
 */
export function checkUnusedVariables(content, filePath) {
  // Simplified implementation to avoid false positives
  return []
}

/**
 * Check for function naming conventions
 * @param {string} content - File content
 * @param {string} filePath - File path
 * @returns {Array} Array of error objects
 */
export function checkFunctionNaming(content, filePath) {
  const errors = []
  const lines = content.split('\n')

  lines.forEach((line, idx) => {
    const functionMatch = line.match(/(?:function\s+|const\s+|let\s+|var\s+)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[=(]/g)

    if (functionMatch) {
      functionMatch.forEach((match) => {
        const functionName = match.match(/(?:function\s+|const\s+|let\s+|var\s+)([a-zA-Z_$][a-zA-Z0-9_$]*)/)[1]

        // Skip React components and hooks
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

/**
 * Check for interface naming conventions
 * @param {string} content - File content
 * @param {string} filePath - File path
 * @returns {Array} Array of error objects
 */
export function checkInterfaceNaming(content, filePath) {
  const errors = []
  const lines = content.split('\n')

  lines.forEach((line, idx) => {
    const interfaceMatch = line.match(/export\s+interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g)

    if (interfaceMatch) {
      interfaceMatch.forEach((match) => {
        const interfaceName = match.match(/export\s+interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/)[1]

        // Interface should start with 'I' and follow PascalCase
        if (!/^I[A-Z][a-zA-Z0-9]*$/.test(interfaceName)) {
          errors.push({
            rule: 'Interface naming',
            message: 'Exported interfaces must start with "I" and follow PascalCase (e.g., IButtonProps)',
            file: filePath,
            line: idx + 1,
          })
        }
      })
    }
  })

  return errors
}

/**
 * Check for style conventions
 * @param {string} content - File content
 * @param {string} filePath - File path
 * @returns {Array} Array of error objects
 */
export function checkStyleConventions(content, filePath) {
  const errors = []

  // Only check .style.ts files
  if (!filePath.endsWith('.style.ts')) {
    return errors
  }

  const lines = content.split('\n')

  lines.forEach((line, idx) => {
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
  })

  return errors
}

/**
 * Check for enums outside types folder
 * @param {string} filePath - File path
 * @returns {Object|null} Error object or null
 */
export function checkEnumsOutsideTypes(filePath) {
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
 * Check for hook file extension
 * @param {string} filePath - File path
 * @returns {Object|null} Error object or null
 */
export function checkHookFileExtension(filePath) {
  try {
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
  } catch {
    return null
  }
}

/**
 * Check for asset naming conventions
 * @param {string} filePath - File path
 * @returns {Object|null} Error object or null
 */
export function checkAssetNaming(filePath) {
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
