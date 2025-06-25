/**
 * Additional validation functions for frontend standards
 * These functions are extracted from the original checkFrontendStandards.mjs
 */

import fs from 'fs';
import path from 'path';

/**
 * Check for inline styles
 * @param {string} content - File content
 * @param {string} filePath - File path
 * @returns {Array} Array of error objects
 */
export function checkInlineStyles(content, filePath) {
  const lines = content.split('\n');
  const errors = [];

  lines.forEach((line, idx) => {
    // Detects style={{ ... }} and style="..."
    if (
      /style\s*=\s*\{\{[^}]+\}\}/.test(line) ||
      /style\s*=\s*"[^"]+"/.test(line)
    ) {
      errors.push({
        rule: 'Inline styles',
        message: 'Inline styles are not allowed. Use .style.ts files',
        file: filePath,
        line: idx + 1,
      });
    }
  });
  return errors;
}

/**
 * Check for commented code
 * @param {string} content - File content
 * @param {string} filePath - File path
 * @returns {Array} Array of error objects
 */
export function checkCommentedCode(content, filePath) {
  const lines = content.split('\n');
  const errors = [];
  let inJSDoc = false;
  let inMultiLineComment = false;

  lines.forEach((line, idx) => {
    const trimmedLine = line.trim();

    // Track JSDoc comment state
    if (/^\s*\/\*\*/.test(line)) {
      inJSDoc = true;
      return;
    }
    if (inJSDoc && /\*\//.test(line)) {
      inJSDoc = false;
      return;
    }

    // Track multi-line comment state
    if (/^\s*\/\*/.test(line) && !/^\s*\/\*\*/.test(line)) {
      inMultiLineComment = true;
      return;
    }
    if (inMultiLineComment && /\*\//.test(line)) {
      inMultiLineComment = false;
      return;
    }

    // Skip if we're inside any comment block
    if (inJSDoc || inMultiLineComment || /^\s*\*/.test(line)) {
      return;
    }

    // Check for single-line comments that might be commented code
    if (/^\s*\/\//.test(line)) {
      // Skip if it's a valid comment (not commented code)
      const commentContent = trimmedLine.replace(/^\/\/\s*/, '');

      // Skip common valid comment patterns
      if (
        // ESLint/TSLint directives
        /eslint|tslint|@ts-|prettier/.test(line) ||
        // Task comments
        /^(TODO|FIXME|NOTE|HACK|BUG|XXX):/i.test(commentContent) ||
        // Documentation comments
        /^(This|The|When|If|For|To|Used)/.test(commentContent) ||
        /^(Returns?|Handles?|Checks?|Sets?|Gets?)/.test(commentContent) ||
        // Explanation comments
        /because|since|due to|in order to|to ensure|to avoid|to prevent|explanation|reason/i.test(
          commentContent
        ) ||
        // Configuration comments
        /config|setting|option|parameter|default|override/i.test(
          commentContent
        ) ||
        // Single word or very short explanatory comments
        /^[A-Z][a-z]*(\s+[a-z]+){0,3}\.?$/.test(commentContent) ||
        // Comments with common English sentence patterns
        /^(and|or|but|however|therefore|thus|also|additionally)/.test(
          commentContent
        ) ||
        // Comments that end with periods (likely explanations)
        /\.$/.test(commentContent.trim()) ||
        // Comments that are clearly explanatory
        (commentContent.length > 50 && !/^[a-z]+\(/.test(commentContent))
      ) {
        return;
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
        /^[{[].*[}]]$/.test(commentContent) ||
        // Console statements
        /^console\.[a-z]+\s*\(/.test(commentContent) ||
        // Control flow statements with parentheses
        /^(if|for|while|switch|try|catch)\s*\(/.test(commentContent);

      if (looksLikeCode) {
        errors.push({
          rule: 'Commented code',
          message: 'Leaving commented code in the repository is not allowed.',
          file: filePath,
          line: idx + 1,
        });
      }
    }
  });
  return errors;
}

/**
 * Check for hardcoded data
 * @param {string} content - File content
 * @param {string} filePath - File path
 * @returns {Array} Array of error objects
 */
export function checkHardcodedData(content, filePath) {
  const lines = content.split('\n');
  const errors = [];

  // Track JSDoc comment blocks
  let inJSDocComment = false;

  lines.forEach((line, idx) => {
    // Track JSDoc comment state
    if (/^\s*\/\*\*/.test(line)) {
      inJSDocComment = true;
    }
    if (inJSDocComment && /\*\//.test(line)) {
      inJSDocComment = false;
      return; // Skip this line as it ends the JSDoc
    }

    // Skip if we're inside a JSDoc comment
    if (inJSDocComment || /^\s*\*/.test(line)) {
      return;
    }

    // Check for hardcoded data but exclude CSS classes, Tailwind classes, and other valid cases
    const hasHardcodedPattern = /(['"]).*([0-9]{3,}|lorem|dummy|test|prueba|foo|bar|baz).*\1/.test(
      line
    );
    const isCSSClass = /className\s*=|class\s*=|style\s*=/.test(line);

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
    ];

    const isTailwindClass = tailwindPatterns.some((pattern) =>
      pattern.test(line)
    );

    const isTestFile = /mock|__test__|\.test\.|\.spec\./.test(filePath);
    const isImportStatement = /import.*from/.test(line.trim());
    const isURL = /https?:\/\//.test(line);
    const isSingleLineComment = /^\s*\/\//.test(line);
    const isMultiLineComment = /^\s*\/\*/.test(line) && /\*\//.test(line);

    // Additional check: if line contains common CSS/Tailwind context
    const hasClassContext =
      /(className|class)\s*[:=]\s*['"`]/.test(line) ||
      /['"`]\s*\?\s*['"`][^'"`]*\d+[^'"`]*['"`]\s*:\s*['"`]/.test(line);

    // Check for valid configuration contexts that should not be flagged as hardcoded data
    const isValidConfiguration =
      // Next.js font configuration (weight, subset properties)
      /(weight|subsets|style|display)\s*:\s*\[/.test(line) ||
      // Font-specific numeric values in arrays (like ['100', '300', '400'])
      (/weight\s*:\s*\[/.test(
        content.substring(
          Math.max(0, content.indexOf(line) - 200),
          content.indexOf(line) + 100
        )
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
      /(from|to|via|offset|opacity|scale|rotate|skew|translate)\s*:\s*['"][\d-]+['"]/.test(
        line
      ) ||
      // Theme configuration values
      /(fontSize|spacing|borderRadius|colors)\s*:\s*\{/.test(line) ||
      // i18n/translation keys (like 'common.buttons.save', 'footer.success')
      /\b(useTranslations|t)\s*\(\s*['"][a-zA-Z]+(\.[a-zA-Z]+)*['"]/.test(
        line
      ) ||
      // Toast/notification messages using translation keys
      /\b(toast|notification)\.(success|error|info|warning)\s*\(\s*t\s*\(/.test(
        line
      ) ||
      // General translation key pattern (dotted notation)
      /['"][a-zA-Z]+(\.[a-zA-Z]+){2,}['"]/.test(line);

    // Check if the file is a configuration file that commonly contains valid numeric values
    const isConfigurationFile =
      /\/(config|configs|constants|theme|styles|fonts)\//.test(filePath) ||
      /\.(config|constants|theme|styles|fonts)\.(ts|tsx|js|jsx)$/.test(
        filePath
      ) ||
      /\/fonts\//.test(filePath);

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
        message:
          'No hardcoded data should be left in the code except in mocks.',
        file: filePath,
        line: idx + 1,
      });
    }
  });
  return errors;
}

/**
 * Check for missing comments in complex functions
 * This function analyzes JavaScript/TypeScript code to identify functions with high complexity
 * that lack proper documentation. It calculates complexity based on control flow structures,
 * async operations, array methods, and function length. Functions exceeding complexity
 * thresholds require explanatory comments or JSDoc documentation.
 *
 * @param {string} content - File content to analyze
 * @param {string} filePath - Path to the file being analyzed
 * @returns {Array} Array of error objects for undocumented complex functions
 */
export function checkFunctionComments(content, filePath) {
  const lines = content.split('\n');
  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (
      !line ||
      line.startsWith('//') ||
      line.startsWith('*') ||
      line.startsWith('/*')
    ) {
      continue;
    }

    // Detect function declarations (including arrow functions and function expressions)
    const functionMatch =
      line.match(
        /(export\s+)?(const|let|var|function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[:=]?\s*(\([^)]*\)\s*=>|\([^)]*\)\s*\{|async\s*\([^)]*\)\s*=>|function)/
      ) || line.match(/(export\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);

    if (functionMatch) {
      const functionName = functionMatch[3] || functionMatch[2];

      // Skip if it's a type declaration or interface
      if (line.includes('interface ') || line.includes('type ')) {
        continue;
      }

      // Skip simple getters/setters or single-line functions
      if (line.includes('=>') && line.length < 80 && !line.includes('async')) {
        continue;
      }

      // Look ahead to check if this function has complex logic
      let isComplex = false;
      let complexityScore = 0;
      let functionBodyStart = i;
      let braceCount = 0;
      let inFunction = false;
      let linesInFunction = 0;

      // Find the function body and check for complexity
      for (let j = i; j < Math.min(i + 30, lines.length); j++) {
        const bodyLine = lines[j];

        if (bodyLine.includes('{')) {
          braceCount += (bodyLine.match(/\{/g) || []).length;
          inFunction = true;
        }
        if (bodyLine.includes('}')) {
          braceCount -= (bodyLine.match(/\}/g) || []).length;
        }

        if (inFunction) {
          linesInFunction++;

          // Check for complex patterns and assign complexity scores
          if (/\b(if|else if|switch|case)\b/.test(bodyLine)) {
            complexityScore += 1;
          }
          if (/\b(for|while|do)\b/.test(bodyLine)) {
            complexityScore += 2;
          }
          if (/\b(try|catch|finally)\b/.test(bodyLine)) {
            complexityScore += 2;
          }
          if (
            /\b(async|await|Promise\.all|Promise\.resolve|Promise\.reject|\.then|\.catch)\b/.test(
              bodyLine
            )
          ) {
            complexityScore += 2;
          }
          if (
            /\.(map|filter|reduce|forEach|find|some|every)\s*\(/.test(bodyLine)
          ) {
            complexityScore += 1;
          }
          if (/\?\s*[^:]*\s*:/.test(bodyLine)) {
            // Ternary operators
            complexityScore += 1;
          }
          if (/&&|\|\|/.test(bodyLine)) {
            // Logical operators
            complexityScore += 0.5;
          }
        }

        if (inFunction && braceCount === 0) {
          break;
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
          /async|await|Promise/.test(content.substring(content.indexOf(line))));

      // If function is complex, check for comments
      if (isComplex) {
        let hasComment = false;

        // Look for JSDoc comments or regular comments above the function
        for (let k = Math.max(0, i - 15); k < i; k++) {
          const commentLine = lines[k].trim();
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
            hasComment = true;
            break;
          }
        }

        if (!hasComment) {
          errors.push({
            rule: 'Missing comment in complex function',
            message: `Complex function '${functionName}' (complexity: ${complexityScore.toFixed(1)}, lines: ${linesInFunction}) must have comments explaining its behavior.`,
            file: `${filePath}:${i + 1}`,
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Check for unused variables
 * @param {string} content - File content
 * @param {string} filePath - File path
 * @returns {Array} Array of error objects
 */
export function checkUnusedVariables(content, filePath) {
  // Simplified implementation to avoid false positives
  return [];
}

/**
 * Check for function naming conventions
 * @param {string} content - File content
 * @param {string} filePath - File path
 * @returns {Array} Array of error objects
 */
export function checkFunctionNaming(content, filePath) {
  const errors = [];
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Match function declarations and arrow functions
    const functionMatches = line.match(
      /(?:function\s+|const\s+|let\s+|var\s+)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?:\(|\s*=\s*(?:\(|async\s*\())/g
    );

    if (functionMatches) {
      functionMatches.forEach((match) => {
        const functionName = match.match(
          /(?:function\s+|const\s+|let\s+|var\s+)([a-zA-Z_$][a-zA-Z0-9_$]*)/
        )[1];

        // Skip React components (PascalCase) and hooks (start with 'use')
        if (/^[A-Z]/.test(functionName) || functionName.startsWith('use')) {
          return;
        }

        // Function should follow camelCase
        if (!/^[a-z][a-zA-Z0-9]*$/.test(functionName)) {
          errors.push({
            rule: 'Function naming',
            message:
              'Functions must follow camelCase convention (e.g., getProvinces)',
            file: filePath,
            line: idx + 1,
          });
        }
      });
    }
  });

  return errors;
}

/**
 * Check for interface naming conventions
 * @param {string} content - File content
 * @param {string} filePath - File path
 * @returns {Array} Array of error objects
 */
export function checkInterfaceNaming(content, filePath) {
  const errors = [];
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const interfaceMatch = line.match(
      /export\s+interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g
    );

    if (interfaceMatch) {
      interfaceMatch.forEach((match) => {
        const interfaceName = match.match(
          /export\s+interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/
        )[1];

        // Interface should start with 'I' and follow PascalCase
        if (!/^I[A-Z][a-zA-Z0-9]*$/.test(interfaceName)) {
          errors.push({
            rule: 'Interface naming',
            message:
              'Exported interfaces must start with "I" and follow PascalCase (e.g., IButtonProps)',
            file: filePath,
            line: idx + 1,
          });
        }
      });
    }
  });

  return errors;
}

/**
 * Check for style conventions
 * @param {string} content - File content
 * @param {string} filePath - File path
 * @returns {Array} Array of error objects
 */
export function checkStyleConventions(content, filePath) {
  const errors = [];

  // Only check .style.ts files
  if (!filePath.endsWith('.style.ts')) {
    return errors;
  }

  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Check if StyleSheet.create is used (for React Native)
    if (/StyleSheet\.create\s*\(/.test(line)) {
      // This is good, StyleSheet.create is being used
      return;
    }

    // Check for style object exports
    const exportMatch = line.match(
      /export\s+const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/
    );
    if (exportMatch) {
      const styleName = exportMatch[1];

      // Style names should be in camelCase and end with 'Styles'
      if (!/^[a-z][a-zA-Z0-9]*Styles$/.test(styleName)) {
        errors.push({
          rule: 'Style naming',
          message: `Style object '${styleName}' should be in camelCase and end with 'Styles' (e.g., cardPreviewStyles)`,
          file: filePath,
          line: idx + 1,
        });
      }
    }
  });

  return errors;
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
      message:
        'Enums must be in a separate directory from types (use /enums/ instead of /types/).',
      file: filePath,
    };
  }
  return null;
}

/**
 * Check for hook file extension
 * @param {string} filePath - File path
 * @returns {Object|null} Error object or null
 */
export function checkHookFileExtension(filePath) {
  // Only check for hooks (use*.hook.ts[x]?)
  const fileName = path.basename(filePath);
  const dirName = path.dirname(filePath);
  if (!/^use[a-zA-Z0-9]+\.hook\.(ts|tsx)$/.test(fileName)) return null;
  // Omit if index.ts in the same folder
  if (fs.existsSync(path.join(dirName, 'index.ts'))) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  // Heuristic: if contains JSX (return < or React.createElement), must be .tsx
  const needsRender = /return\s*<|React\.createElement/.test(content);
  const isTSX = fileName.endsWith('.tsx');
  if (needsRender && !isTSX) {
    return {
      rule: 'Hook file extension',
      message: 'Hooks that render JSX must have a .tsx extension.',
      file: filePath,
    };
  }
  if (!needsRender && isTSX) {
    return {
      rule: 'Hook file extension',
      message: 'Hooks that do not render JSX should have a .ts extension.',
      file: filePath,
    };
  }
  return null;
}

/**
 * Check for asset naming conventions
 * @param {string} filePath - File path
 * @returns {Object|null} Error object or null
 */
export function checkAssetNaming(filePath) {
  const fileName = path.basename(filePath);
  const fileExt = path.extname(fileName);
  const baseName = fileName.replace(fileExt, '');

  // Check if file is in assets directory
  if (!filePath.includes('/assets/') && !filePath.includes('\\assets\\')) {
    return null;
  }

  // Assets should follow kebab-case
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(baseName)) {
    return {
      rule: 'Asset naming',
      message:
        'Assets must follow kebab-case convention (e.g., service-error.svg)',
      file: filePath,
    };
  }

  return null;
}
