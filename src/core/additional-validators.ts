import type {
  IDeclaredVariable,
  INamingRule,
  IValidationError,
} from '../types/additionalValidators.type';
import fs from 'fs';
import path from 'path';
import * as acorn from 'acorn';
import * as acornWalk from 'acorn-walk';
import { isReactNativeProject } from '../utils/file-scanner.js';
// Removed duplicate type import from body
import {
  isConfigOrConstantsFile,
  shouldProcessFile,
  findFunctionMatch,
  validateFunctionName,
  createNoFunctionError,
  shouldSkipLine,
  detectFunctionDeclaration,
  getFunctionName,
  shouldSkipFunction,
  analyzeFunctionComplexity,
  hasProperComments,
  createCommentError,
} from '../helpers/index.js';

// Naming conventions by file type
const NAMING_RULES: INamingRule[] = [
  {
    dir: 'components',
    regex: /^[A-Z][a-zA-Z0-9]+\.tsx$/,
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
];

// Keep track of flagged directories to avoid duplicate reports
const flaggedDirectories = new Set<string>();

/**
 * Check for inline styles
 */
export function checkInlineStyles(
  content: string,
  filePath: string
): IValidationError[] {
  const lines = content.split('\n');
  const errors: IValidationError[] = [];

  // Detect if this is a React Native project
  const isRNProject = isReactNativeProject(filePath);

  // For React Native projects, be more permissive with SVG components
  if (isRNProject) {
    // Skip inline style validation for SVG components in React Native
    if (
      filePath.includes('/assets/Svg/') ||
      filePath.includes('/Svg/') ||
      filePath.includes('.svg')
    ) {
      return errors;
    }
  }

  let warned = false;
  lines.forEach((line, idx) => {
    if (/style\s*=\s*\{\{/.test(line)) {
      if (!warned) {
        errors.push({
          rule: 'Inline styles',
          message:
            'Inline styles are not allowed. Use .style.ts files or reference external stylesheets',
          filePath: filePath,
          line: idx + 1,
          severity: 'error',
          category: 'style',
        });
        warned = true;
      }
    }
  });
  return errors;
}

/**
 * Check for commented code
 */
export function checkCommentedCode(
  content: string,
  filePath: string
): IValidationError[] {
  const lines = content.split('\n');
  const errors: IValidationError[] = [];
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
        commentContent.trim().endsWith('.test') ||
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
        /^[{[].*}]$/.test(commentContent) ||
        // Console statements
        /^console\.[a-z]+\s*\(/.test(commentContent) ||
        // Control flow statements with parentheses
        /^(if|for|while|switch|try|catch)\s*\(/.test(commentContent);

      if (looksLikeCode) {
        errors.push({
          rule: 'Commented code',
          message: 'Leaving commented code in the repository is not allowed.',
          filePath: filePath,
          line: idx + 1,
          severity: 'error',
          category: 'content',
        });
      }
    }
  });
  return errors;
}

/**
 * Check for hardcoded data
 */
export function checkHardcodedData(
  content: string,
  filePath: string
): IValidationError[] {
  const lines = content.split('\n');
  const errors: IValidationError[] = [];

  // Skip configuration, setup, helper, config, and constants files entirely
  if (isConfigOrConstantsFile(filePath)) {
    return errors;
  }

  // Detect if this is a React Native project
  const isRNProject = isReactNativeProject(filePath);

  // For React Native projects, be more permissive with SVG components and assets
  if (isRNProject) {
    // Skip SVG components and asset files in React Native projects
    if (
      filePath.includes('/assets/') ||
      filePath.includes('/Svg/') ||
      filePath.includes('.svg') ||
      filePath.includes('/constants/') ||
      filePath.includes('/config/')
    ) {
      return errors;
    }
  }
  if (filePath.includes('jest.setup.ts')) {
    return errors;
  }

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
    const hasHardcodedPattern =
      /(['"]).*(\d{3,}|lorem|dummy|test|prueba|foo|bar|baz).*\1/.test(line);
    const isCSSClass = /className\s*=|class\s*=|style\s*=/.test(line);

    // Comprehensive Tailwind CSS pattern matching
    const tailwindPatterns = [
      // Base spacing and layout utilities
      /\b[pmwh]-\d+\b/, // padding, margin, width, height
      /\b(text|bg|border|rounded|shadow)-\d+\b/, // typography, colors, border, etc.
      /\b(grid|flex|space|gap)-\d+\b/,
      /\b(top|bottom|left|right|inset)-\d+\b/,
      /\b(font|leading|tracking|opacity)-\d+\b/,
      /\b(scale|rotate|translate)-\d+\b/,
      /\b(cursor|select)-\d+\b/,
      /\b(transition|duration|ease)-\d+\b/,
      /\b(hover|focus|active|disabled)-\d+\b/,
      /\b(absolute|relative|fixed|static|sticky|block|inline|hidden|visible)-\d+\b/,
      // Responsive prefixes
      /\b([smd]|lg|xl|2xl):/,

      // Color utilities with standard palette
      /\b(text|bg|border)-([a-z]+)-(50|100|200|300|400|500|600|700|800|900|950)\b/,

      // Extended color utilities (gradients, rings, etc.)
      /\b(from|via|to|ring|outline|divide|decoration)-([a-z]+)-(50|100|200|300|400|500|600|700|800|900|950)\b/,

      // Semantic color utilities
      /\b(text|bg|border)-(semantic|custom|brand|primary|secondary|accent|success|warning|error|info|muted|disabled)-[a-z]+-(?:[5-9]0|[1-9]00|950)\b/,

      // General custom color patterns
      /\b(text|bg|border)-[a-z]+-[a-z]*-?\d{2,3}\b/,
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
        /['"]\d{3}['"]/.test(line)) ||
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
        filePath: filePath,
        line: idx + 1,
        severity: 'error',
        category: 'content',
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
 */
export function checkFunctionComments(
  content: string,
  filePath: string
): IValidationError[] {
  const lines = content.split('\n');
  const errors: IValidationError[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const trimmedLine = line.trim();

    if (shouldSkipLine(trimmedLine)) continue;

    const functionMatch = detectFunctionDeclaration(trimmedLine);
    if (!functionMatch) continue;

    const functionName = getFunctionName(functionMatch);
    if (!functionName || shouldSkipFunction(trimmedLine, functionName))
      continue;

    const functionAnalysis = analyzeFunctionComplexity(lines, i, content);
    if (!functionAnalysis.isComplex) continue;

    if (!hasProperComments(lines, i, content)) {
      errors.push(
        createCommentError(functionName, functionAnalysis, filePath, i)
      );
    }
  }

  return errors;
}

/**
 * Check for unused variables
 */
export function checkUnusedVariables(
  content: string,
  filePath: string
): IValidationError[] {
  const errors: IValidationError[] = [];
  try {
    // Enable location tracking to get line numbers
    const ast = acorn.parse(content, {
      ecmaVersion: 'latest' as acorn.ecmaVersion,
      sourceType: 'module',
      locations: true, // Important for line numbers
    });

    const declared = new Map<string, IDeclaredVariable>(); // name -> { node, exported: false }
    const used = new Set<string>();
    const exportedViaSpecifier = new Set<string>();

    // Find `export { foo }` and `export default foo`
    acornWalk.simple(ast, {
      ExportNamedDeclaration(node: acorn.Node) {
        const exportNode = node as any;
        if (exportNode.specifiers && Array.isArray(exportNode.specifiers)) {
          for (const specifier of exportNode.specifiers) {
            if (
              specifier &&
              typeof specifier === 'object' &&
              'local' in specifier &&
              specifier.local &&
              'name' in specifier.local
            ) {
              exportedViaSpecifier.add(specifier.local.name as string);
            }
          }
        }
      },
      ExportDefaultDeclaration(node: acorn.Node) {
        const exportNode = node as any;
        if (
          exportNode.declaration &&
          'name' in exportNode.declaration &&
          exportNode.declaration.name
        ) {
          exportedViaSpecifier.add(exportNode.declaration.name as string);
        }
      },
    });

    // Pass 1: Find all declarations and mark if they are exported.
    acornWalk.ancestor(ast, {
      VariableDeclarator(node: acorn.Node, ancestors: acorn.Node[]) {
        const declNode = node as any;
        if (
          declNode.id &&
          declNode.id.type === 'Identifier' &&
          'name' in declNode.id &&
          declNode.id.name
        ) {
          const name = declNode.id.name as string;
          const parent = ancestors[ancestors.length - 2] as any;
          const grandParent =
            ancestors.length > 2
              ? (ancestors[ancestors.length - 3] as any)
              : null;
          const isInlineExport =
            parent &&
            parent.type === 'VariableDeclaration' &&
            grandParent &&
            grandParent.type === 'ExportNamedDeclaration';
          const isSpecifierExport = exportedViaSpecifier.has(name);

          if (!declared.has(name)) {
            declared.set(name, {
              node: declNode.id,
              exported: Boolean(isInlineExport ?? isSpecifierExport),
            });
          }
        }
      },
    });

    // Pass 2: Find all usages.
    acornWalk.ancestor(ast, {
      Identifier(node: acorn.Node, ancestors: acorn.Node[]) {
        const identNode = node as any;
        const parent = ancestors[ancestors.length - 2] as any;

        if (!('name' in identNode) || !identNode.name) {
          return;
        }

        const isDeclaration =
          (parent &&
            parent.type === 'VariableDeclarator' &&
            parent.id === identNode) ||
          (parent &&
            parent.type === 'FunctionDeclaration' &&
            parent.id === identNode) ||
          (parent &&
            parent.type === 'ClassDeclaration' &&
            parent.id === identNode) ||
          (parent &&
            parent.type === 'ImportSpecifier' &&
            parent.local === identNode) ||
          (parent &&
            parent.type === 'ImportDefaultSpecifier' &&
            parent.local === identNode) ||
          (parent &&
            parent.type === 'ImportNamespaceSpecifier' &&
            parent.local === identNode) ||
          (parent &&
            (parent.type === 'FunctionDeclaration' ||
              parent.type === 'FunctionExpression' ||
              parent.type === 'ArrowFunctionExpression') &&
            parent.params &&
            Array.isArray(parent.params) &&
            parent.params.includes(identNode));

        const isPropertyKey =
          parent &&
          parent.type === 'Property' &&
          parent.key === identNode &&
          !('computed' in parent && parent.computed);

        if (!isDeclaration && !isPropertyKey) {
          used.add(identNode.name as string);
        }
      },
    });

    for (const [name, decl] of declared.entries()) {
      if (!used.has(name) && !decl.exported && !name.startsWith('_')) {
        const nodeWithLoc = decl.node as any;
        const lineNumber = nodeWithLoc?.loc?.start?.line ?? 1;

        errors.push({
          rule: 'No unused variables',
          message: `Variable '${name}' is declared but never used. (@typescript-eslint/no-unused-vars rule)`,
          filePath: filePath,
          line: lineNumber,
          severity: 'warning',
          category: 'content',
        });
      }
    }
  } catch (error) {
    // If acorn fails to parse (e.g., complex TS syntax), we skip silently
    // This is expected for complex TypeScript syntax that acorn can't handle
    console.debug(
      `Could not parse ${filePath} for unused variable analysis: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
  return errors;
}

/**
 * Check for function naming conventions
 */
export function checkFunctionNaming(
  content: string,
  filePath: string
): IValidationError[] {
  const errors: IValidationError[] = [];
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Match function declarations
    const functionDeclMatch = line.match(
      /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g
    );
    // Match arrow function assignments
    const arrowFuncMatch = line.match(
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s*)?\(/g
    );

    const matches: string[] = [];
    if (functionDeclMatch) matches.push(...functionDeclMatch);
    if (arrowFuncMatch) matches.push(...arrowFuncMatch);

    matches.forEach((match) => {
      const nameMatch =
        /(?:function\s+|const\s+|let\s+|var\s+)([a-zA-Z_$][a-zA-Z0-9_$]*)/.exec(
          match
        );

      if (!nameMatch?.[1]) {
        return;
      }

      const functionName = nameMatch[1];

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
          filePath: filePath,
          line: idx + 1,
          severity: 'error',
          category: 'naming',
        });
      }
    });
  });

  return errors;
}

/**
 * Check for interface naming conventions
 */
export function checkInterfaceNaming(
  content: string,
  filePath: string
): IValidationError[] {
  const errors: IValidationError[] = [];
  const lines = content.split('\n');

  const seen = new Set<string>();
  lines.forEach((line, idx) => {
    const interfaceMatch = line.match(
      /export\s+interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g
    );
    if (interfaceMatch) {
      interfaceMatch.forEach((match) => {
        const nameMatch =
          /export\s+interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/.exec(match);
        if (!nameMatch?.[1]) {
          return;
        }
        const interfaceName = nameMatch[1];
        if (seen.has(interfaceName)) return;
        seen.add(interfaceName);
        if (!/^I[A-Z][a-zA-Z0-9]*$/.test(interfaceName)) {
          errors.push({
            rule: 'Interface naming',
            message:
              'Exported interfaces must start with "I" and follow PascalCase (e.g., IButtonProps)',
            filePath: filePath,
            line: idx + 1,
            severity: 'error',
            category: 'naming',
          });
        }
      });
    }
  });
  // Patch: Suppress "Type naming" and "No any type" in .d.ts files

  return errors;
}

/**
 * Check for style conventions
 */
export function checkStyleConventions(
  content: string,
  filePath: string
): IValidationError[] {
  const errors: IValidationError[] = [];

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
    const exportMatch = /export\s+const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/.exec(
      line
    );
    if (exportMatch?.[1]) {
      const styleName = exportMatch[1];

      // Style names should be in camelCase and end with 'Styles'
      if (!/^[a-z][a-zA-Z0-9]*Styles$/.test(styleName)) {
        errors.push({
          rule: 'Style naming',
          message: `Style object '${styleName}' should be in camelCase and end with 'Styles' (e.g., cardPreviewStyles)`,
          filePath: filePath,
          line: idx + 1,
          severity: 'error',
          category: 'naming',
        });
      }
    }
  });

  return errors;
}

/**
 * Check for enums outside types folder
 */
export function checkEnumsOutsideTypes(
  filePath: string
): IValidationError | null {
  // Check if enum files are incorrectly placed inside types directory
  if (filePath.includes('types') && filePath.endsWith('.enum.ts')) {
    return {
      rule: 'Enum outside of types',
      message:
        'Enums must be in a separate directory from types (use /enums/ instead of /types/).',
      filePath: filePath,
      severity: 'error',
      category: 'structure',
    };
  }
  return null;
}

/**
 * Check for hook file extension
 */
export function checkHookFileExtension(
  filePath: string
): IValidationError | null {
  // Only check for hooks (use*.hook.ts[x]?)
  const fileName = path.basename(filePath);
  const dirName = path.dirname(filePath);
  if (!/^use[a-zA-Z0-9]+\.hook\.(ts|tsx)$/.test(fileName)) return null;
  // Omit if index.ts in the same folder
  if (fs.existsSync(path.join(dirName, 'index.ts'))) return null;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Heuristic: if contains JSX (return < or React.createElement), must be .tsx
    const needsRender = /return\s*<|React\.createElement/.test(content);
    const isTSX = fileName.endsWith('.tsx');

    if (needsRender && !isTSX) {
      return {
        rule: 'Hook file extension',
        message: 'Hooks that render JSX must have a .tsx extension.',
        filePath: filePath,
        severity: 'error',
        category: 'naming',
      };
    }
    if (!needsRender && isTSX) {
      return {
        rule: 'Hook file extension',
        message: 'Hooks that do not render JSX should have a .ts extension.',
        filePath: filePath,
        severity: 'error',
        category: 'naming',
      };
    }
  } catch {
    // If we can't read the file, skip validation silently
    return null;
  }

  return null;
}

/**
 * Check for asset naming conventions
 */
export function checkAssetNaming(filePath: string): IValidationError | null {
  const fileName = path.basename(filePath);
  const fileExt = path.extname(fileName);
  const baseName = fileName.replace(fileExt, '');

  // Check if file is in assets directory
  if (!filePath.includes('/assets/') && !filePath.includes('\\assets\\')) {
    return null;
  }

  // Skip TypeScript declaration files (.d.ts)
  if (fileExt === '.ts' && fileName.endsWith('.d.ts')) {
    return null;
  }

  // Detect if this is a React Native project
  const isRNProject = isReactNativeProject(filePath);

  // For React Native projects, be more permissive with SVG components
  if (isRNProject) {
    // Skip asset naming validation for SVG components in React Native
    if (
      filePath.includes('/Svg/') ||
      filePath.includes('/assets/Svg/') ||
      fileExt === '.tsx' ||
      fileExt === '.jsx'
    ) {
      return null;
    }
  }

  // Assets should follow kebab-case
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(baseName)) {
    return {
      rule: 'Asset naming',
      message:
        'Assets must follow kebab-case convention (e.g., service-error.svg)',
      filePath: filePath,
      severity: 'error',
      category: 'naming',
    };
  }

  return null;
}

/**
 * Check naming conventions for files
 */
export function checkNamingConventions(
  filePath: string
): IValidationError | null {
  const rel = filePath.split(path.sep);
  const fname = rel[rel.length - 1];
  const parentDir = rel[rel.length - 2]; // Get immediate parent directory

  // Omit index.tsx and index.ts from naming convention checks
  if (fname === 'index.tsx' || fname === 'index.ts') {
    return null;
  }

  if (!fname || !parentDir) {
    return null;
  }

  for (const rule of NAMING_RULES) {
    // Check if the immediate parent directory matches the rule directory
    if (parentDir === rule.dir) {
      if (!rule.regex.test(fname)) {
        return {
          rule: 'Naming',
          message: rule.desc,
          filePath: filePath,
          severity: 'error',
          category: 'naming',
        };
      }
    }
  }
  return null;
}

/**
 * Check directory naming conventions
 */
export function checkDirectoryNaming(dirPath: string): IValidationError[] {
  const errors: IValidationError[] = [];
  const currentDirName = path.basename(dirPath);

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
    return errors;
  }

  // Skip if it's the root directory or first level directories in monorepo (apps, packages, etc)
  if (['apps', 'packages', 'config', 'k8s', 'src'].includes(currentDirName)) {
    return errors;
  }

  // Only check directories that are actually inside meaningful project structure
  const ROOT_DIR = process.cwd();
  const relativePath = path.relative(ROOT_DIR, dirPath);

  if (
    relativePath.includes('/src/') &&
    !relativePath.includes('/node_modules/')
  ) {
    // Check if current directory follows camelCase convention
    // Allow PascalCase for component directories and camelCase for others
    const isCamelCase = /^[a-z][a-zA-Z0-9]*$/.test(currentDirName);
    const isPascalCase = /^[A-Z][a-zA-Z0-9]*$/.test(currentDirName);

    // Special case: Allow kebab-case for route directories (Next.js routing)
    const isValidRouteDir =
      /^[a-z0-9]+(-[a-z0-9]+)*$/.test(currentDirName) &&
      (relativePath.includes('/app/') || relativePath.includes('/pages/'));

    if (!isCamelCase && !isPascalCase && !isValidRouteDir) {
      // Check if we've already flagged this directory name in any path
      const alreadyFlagged = Array.from(flaggedDirectories).some(
        (flaggedPath) => path.basename(flaggedPath) === currentDirName
      );

      if (!alreadyFlagged) {
        // Generate a proper camelCase suggestion based on the actual directory name
        const camelCaseSuggestion = currentDirName
          .toLowerCase()
          .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
          .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

        errors.push({
          rule: 'Directory naming',
          message: `Directory '${currentDirName}' should follow camelCase convention (e.g., '${camelCaseSuggestion}')`,
          filePath: dirPath,
          severity: 'error',
          category: 'naming',
        });

        // Mark this directory name as flagged
        flaggedDirectories.add(dirPath);
      }
    }
  }

  return errors;
}

/**
 * Helper function to check index file requirements
 */
function checkIndexFileRequirements(
  componentDir: string,
  componentName: string,
  isUtilityDir: boolean
): IValidationError[] {
  const errors: IValidationError[] = [];
  const indexTsxFile = path.join(componentDir, 'index.tsx');
  const indexTsFile = path.join(componentDir, 'index.ts');

  if (isUtilityDir) {
    // Utility directories should have index.ts
    if (!fs.existsSync(indexTsFile)) {
      errors.push({
        rule: 'Component structure',
        message: `Utility directory '${componentName}' should have an index.ts file for exports`,
        filePath: indexTsFile,
        severity: 'warning',
        category: 'structure',
      });
    }
  } else if (!fs.existsSync(indexTsxFile) && !fs.existsSync(indexTsFile)) {
    // Component directories should have index.tsx or index.ts
    errors.push({
      rule: 'Component structure',
      message:
        'Component must have an index.tsx file (for components) or index.ts file (for exports)',
      filePath: indexTsxFile,
      severity: 'warning',
      category: 'structure',
    });
  }

  return errors;
}

/**
 * Helper function to check hooks directory structure
 */
function checkHooksDirectory(componentDir: string): IValidationError[] {
  const errors: IValidationError[] = [];
  const hooksDir = path.join(componentDir, 'hooks');

  if (fs.existsSync(hooksDir)) {
    try {
      const hookFiles = fs
        .readdirSync(hooksDir)
        .filter(
          (file) => file.endsWith('.hook.ts') || file.endsWith('.hook.tsx')
        );

      if (hookFiles.length === 0) {
        errors.push({
          rule: 'Component structure',
          message:
            'Hooks directory should contain hook files with .hook.ts or .hook.tsx extension',
          filePath: hooksDir,
          severity: 'warning',
          category: 'structure',
        });
      }
    } catch {
      // Directory access error - skip this check
    }
  }

  return errors;
}

/**
 * Helper function to check type file naming in types directory
 */
function checkTypesDirectory(componentDir: string): IValidationError[] {
  const errors: IValidationError[] = [];
  const typesDir = path.join(componentDir, 'types');

  if (fs.existsSync(typesDir)) {
    try {
      const typeFiles = fs
        .readdirSync(typesDir)
        .filter(
          (file) =>
            file.endsWith('.ts') &&
            !file.includes('.test.') &&
            !file.includes('.spec.') &&
            file !== 'index.ts'
        );

      for (const typeFile of typeFiles) {
        if (!typeFile.endsWith('.type.ts')) {
          const typeFilePath = path.join(typesDir, typeFile);
          errors.push({
            rule: 'Component type naming',
            message: 'Type file should end with .type.ts',
            filePath: typeFilePath,
            severity: 'error',
            category: 'naming',
          });
        }
      }
    } catch {
      // Directory access error - skip this check
    }
  }

  return errors;
}

/**
 * Helper function to check style file naming in styles directory
 */
function checkStylesDirectory(componentDir: string): IValidationError[] {
  const errors: IValidationError[] = [];
  const stylesDir = path.join(componentDir, 'styles');

  if (fs.existsSync(stylesDir)) {
    try {
      const styleFiles = fs
        .readdirSync(stylesDir)
        .filter(
          (file) =>
            file.endsWith('.ts') &&
            !file.includes('.test.') &&
            !file.includes('.spec.')
        );

      for (const styleFile of styleFiles) {
        if (!styleFile.endsWith('.style.ts')) {
          const styleFilePath = path.join(stylesDir, styleFile);
          errors.push({
            rule: 'Component style naming',
            message: 'Style file should end with .style.ts',
            filePath: styleFilePath,
            severity: 'error',
            category: 'naming',
          });
        }
      }
    } catch {
      // Directory access error - skip this check
    }
  }

  return errors;
}

/**
 * Check component structure
 */
export function checkComponentStructure(
  componentDir: string
): IValidationError[] {
  const errors: IValidationError[] = [];
  const componentName = path.basename(componentDir);

  // Skip validation for generic 'components' directories that are just containers
  if (componentName === 'components') {
    return errors;
  }

  // Different expectations based on directory type
  const isUtilityDir = [
    'hooks',
    'types',
    'constants',
    'helpers',
    'utils',
  ].includes(componentName);

  // Check index file requirements
  errors.push(
    ...checkIndexFileRequirements(componentDir, componentName, isUtilityDir)
  );

  // Check subdirectories
  errors.push(...checkHooksDirectory(componentDir));
  errors.push(...checkTypesDirectory(componentDir));
  errors.push(...checkStylesDirectory(componentDir));

  return errors;
}

/**
 * Check component function name matches folder name
 */
export function checkComponentFunctionNameMatch(
  content: string,
  filePath: string
): IValidationError | null {
  if (!shouldProcessFile(filePath)) {
    return null;
  }

  const dirName = path.basename(path.dirname(filePath));
  const isPascalCase = /^[A-Z][a-zA-Z0-9]*$/.test(dirName);

  const functionMatch = findFunctionMatch(content);
  if (!functionMatch) {
    return createNoFunctionError(dirName, filePath);
  }

  const { functionName, lineNumber } = functionMatch;
  return validateFunctionName(
    functionName,
    dirName,
    isPascalCase,
    filePath,
    lineNumber
  );
}
