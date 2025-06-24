import fs from 'fs';
import * as acorn from 'acorn';
import * as acornWalk from 'acorn-walk';

/**
 * Rule engine for validating file content against defined rules
 */
export class RuleEngine {
  constructor(logger) {
    this.logger = logger;
    this.rules = [];
    this.validators = new Map();
    this.initializeValidators();
  }

  /**
   * Initialize the rule engine with rules
   * @param {Array} rules Array of validation rules
   */
  async initialize(rules) {
    this.rules = rules || [];
    this.logger.debug(
      `Initialized rule engine with ${this.rules.length} rules`
    );
  }

  /**
   * Validate a file against all rules
   * @param {string} filePath Path to the file to validate
   * @returns {Promise<Array>} Array of validation errors
   */
  async validateFile(filePath) {
    const errors = [];

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = filePath.split('/').pop();

      // Skip validation for index files (they are usually just exports)
      const isIndexFile = fileName === 'index.ts' || fileName === 'index.tsx';

      // Run basic rules
      for (const rule of this.rules) {
        try {
          if (rule.check(content, filePath)) {
            errors.push({
              rule: rule.name,
              message: rule.message,
              file: filePath,
            });
          }
        } catch (error) {
          this.logger.warn(
            `Rule "${rule.name}" failed for ${filePath}:`,
            error.message
          );
        }
      }

      // Run specialized validators for non-index files
      if (!isIndexFile) {
        errors.push(
          ...(await this.runSpecializedValidators(content, filePath))
        );
      }
    } catch (error) {
      this.logger.error(`Failed to validate file ${filePath}:`, error.message);
      errors.push({
        rule: 'File validation error',
        message: `Could not validate file: ${error.message}`,
        file: filePath,
      });
    }

    return errors;
  }

  /**
   * Run specialized validators
   * @param {string} content File content
   * @param {string} filePath File path
   * @returns {Promise<Array>} Array of validation errors
   */
  async runSpecializedValidators(content, filePath) {
    const errors = [];

    for (const [name, validator] of this.validators) {
      try {
        const validatorErrors = await validator(content, filePath);
        errors.push(...validatorErrors);
      } catch (error) {
        this.logger.warn(
          `Validator "${name}" failed for ${filePath}:`,
          error.message
        );
      }
    }

    return errors;
  }

  /**
   * Initialize specialized validators
   */
  initializeValidators() {
    this.validators.set('inline-styles', this.validateInlineStyles.bind(this));
    this.validators.set(
      'commented-code',
      this.validateCommentedCode.bind(this)
    );
    this.validators.set(
      'hardcoded-data',
      this.validateHardcodedData.bind(this)
    );
    this.validators.set(
      'function-comments',
      this.validateFunctionComments.bind(this)
    );
    this.validators.set(
      'unused-variables',
      this.validateUnusedVariables.bind(this)
    );
    this.validators.set(
      'function-naming',
      this.validateFunctionNaming.bind(this)
    );
    this.validators.set(
      'interface-naming',
      this.validateInterfaceNaming.bind(this)
    );
    this.validators.set(
      'style-conventions',
      this.validateStyleConventions.bind(this)
    );
  }

  /**
   * Validate inline styles
   */
  async validateInlineStyles(content, filePath) {
    const lines = content.split('\n');
    const errors = [];

    lines.forEach((line, idx) => {
      if (
        /style\s*=\s*\{\{[^}]+\}\}/.test(line) ||
        /style\s*=\s*"[^"]+"/i.test(line)
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
   * Validate commented code
   */
  async validateCommentedCode(content, filePath) {
    const lines = content.split('\n');
    const errors = [];
    let inJSDoc = false;
    let inMultiLineComment = false;

    lines.forEach((line, idx) => {
      const trimmedLine = line.trim();

      // Track comment state
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

      // Skip if inside comment blocks
      if (inJSDoc || inMultiLineComment || /^\s*\*/.test(line)) {
        return;
      }

      // Check for commented code
      if (/^\s*\/\//.test(line)) {
        const commentContent = trimmedLine.replace(/^\/\/\s*/, '');

        if (this.looksLikeCommentedCode(commentContent)) {
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
   * Check if comment content looks like commented code
   */
  looksLikeCommentedCode(commentContent) {
    // Skip valid comment patterns
    const validPatterns = [
      /eslint|tslint|@ts-|prettier/,
      /^(TODO|FIXME|NOTE|HACK|BUG|XXX):/i,
      /^(This|The|When|If|For|To|Used)/,
      /Returns?|Handles?|Checks?|Sets?|Gets?/,
      /because|since|due to|in order to|to ensure/i,
      /config|setting|option|parameter|default|override/i,
      /^[A-Z][a-z]*(\s+[a-z]+){0,3}\.?$/,
      /\.$/, // Ends with period
    ];

    if (validPatterns.some((pattern) => pattern.test(commentContent))) {
      return false;
    }

    // Check if it looks like code
    const codePatterns = [
      /^[a-zA-Z_$][\w$]*\s*\(/, // Function calls
      /^(const|let|var)\s*=/, // Variable assignments
      /^[a-zA-Z_$][\w$]*\s*=/, // Other assignments
      /^return\s+/, // Return statements
      /^(import|export)\s+/, // Import/export
      /^[{[].*[}\]]$/, // Object/array syntax
      /^console\.[a-z]+\s*\(/, // Console statements
      /^(if|for|while|switch|try|catch)\s*\(/, // Control flow
    ];

    return codePatterns.some((pattern) => pattern.test(commentContent));
  }

  /**
   * Validate hardcoded data
   */
  async validateHardcodedData(content, filePath) {
    const lines = content.split('\n');
    const errors = [];
    let inJSDocComment = false;

    lines.forEach((line, idx) => {
      // Track JSDoc state
      if (/^\s*\/\*\*/.test(line)) {
        inJSDocComment = true;
      }
      if (inJSDocComment && /\*\//.test(line)) {
        inJSDocComment = false;
        return;
      }
      if (inJSDocComment || /^\s*\*/.test(line)) {
        return;
      }

      // Check for hardcoded data patterns
      const hasHardcodedPattern =
        /(['"]).*(\d{3,}|lorem|dummy|test|prueba|foo|bar|baz).*\1/.test(line);

      if (
        hasHardcodedPattern &&
        !this.isValidHardcodedContext(line, filePath)
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
   * Check if hardcoded data is in a valid context
   */
  isValidHardcodedContext(line, filePath) {
    const validContexts = [
      /className\s*=|class\s*=|style\s*=/, // CSS classes
      /https?:\/\//, // URLs
      /import.*from/, // Import statements
      /^\s*\/\//, // Comments
      /\/\*.*\*\//, // Multi-line comments
      /(weight|subsets|style|display)\s*:\s*\[/, // Font configs
      /(timeout|port|delay|duration|interval|retry|maxRetries|limit|size|width|height|fontSize|lineHeight)\s*:\s*['"]?\d+['"]?/, // Config values
      /['"](\d+\.){1,2}\d+['"]/, // Version numbers
      /['"]\/api\/v\d+\//, // API endpoints
      /\b(useTranslations|t)\s*\(\s*['"][a-zA-Z]+(\.[a-zA-Z]+)*['"]/, // i18n keys
    ];

    const isTestFile = /mock|__test__|\.test\.|\.spec\./.test(filePath);
    const isConfigFile =
      /\/(config|configs|constants|theme|styles|fonts)\//.test(filePath) ||
      /\.(config|constants|theme|styles|fonts)\.(ts|tsx|js|jsx)$/.test(
        filePath
      );

    return (
      isTestFile ||
      isConfigFile ||
      validContexts.some((pattern) => pattern.test(line))
    );
  }

  /**
   * Validate function comments
   */
  async validateFunctionComments(content, filePath) {
    const lines = content.split('\n');
    const errors = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (
        !line ||
        line.startsWith('//') ||
        line.startsWith('*') ||
        line.startsWith('/*')
      ) {
        continue;
      }

      const functionInfo = this.detectFunctionDeclaration(line);

      if (functionInfo) {
        const functionName = functionInfo.name;

        if (this.isFunctionComplexEnoughForComment(lines, i, content)) {
          const hasComment = this.hasFunctionComment(lines, i);

          if (!hasComment) {
            errors.push({
              rule: 'Missing comment in complex function',
              message: `Complex function '${functionName}' must have comments explaining its behavior.`,
              file: `${filePath}:${i + 1}`,
            });
          }
        }
      }
    }

    return errors;
  }

  /**
   * Check if function is complex enough to require comments
   */
  isFunctionComplexEnoughForComment(lines, startIndex, content) {
    const { complexityScore, linesInFunction } =
      this.calculateFunctionComplexity(lines, startIndex);

    // A function is complex if:
    // - It has a complexity score >= 3, OR
    // - It has more than 8 lines in the function body, OR
    // - It has async operations with complexity score >= 2
    const hasAsyncOps = /async|await|Promise/.test(
      content.substring(content.indexOf(lines[startIndex]))
    );

    return (
      complexityScore >= 3 ||
      linesInFunction > 8 ||
      (complexityScore >= 2 && hasAsyncOps)
    );
  }

  /**
   * Check if function has documentation comments
   */
  hasFunctionComment(lines, functionIndex) {
    for (let k = Math.max(0, functionIndex - 15); k < functionIndex; k++) {
      const commentLine = lines[k].trim();
      if (
        commentLine.includes('/**') ||
        commentLine.includes('*/') ||
        (commentLine.startsWith('*') && commentLine.length > 5) ||
        commentLine.includes('/*') ||
        (commentLine.startsWith('//') &&
          commentLine.length > 15 &&
          !/^\s*\/\/\s*(TODO|FIXME|NOTE|HACK)/.test(commentLine))
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Validate unused variables using AST parsing
   */
  async validateUnusedVariables(content, filePath) {
    const errors = [];

    try {
      const ast = acorn.parse(content, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        locations: true,
        allowImportExportEverywhere: true,
      });

      const declared = new Map();
      const used = new Set();
      const exportedViaSpecifier = new Set();

      // Find exports
      acornWalk.simple(ast, {
        ExportNamedDeclaration(node) {
          if (node.specifiers) {
            for (const specifier of node.specifiers) {
              exportedViaSpecifier.add(specifier.local.name);
            }
          }
        },
        ExportDefaultDeclaration(node) {
          if (node.declaration && node.declaration.name) {
            exportedViaSpecifier.add(node.declaration.name);
          }
        },
      });

      // Find declarations
      acornWalk.ancestor(ast, {
        VariableDeclarator(node, ancestors) {
          if (node.id.type === 'Identifier') {
            const name = node.id.name;
            const parent = ancestors[ancestors.length - 2];
            const grandParent =
              ancestors.length > 2 ? ancestors[ancestors.length - 3] : null;
            const isInlineExport =
              parent.type === 'VariableDeclaration' &&
              grandParent &&
              grandParent.type === 'ExportNamedDeclaration';
            const isSpecifierExport = exportedViaSpecifier.has(name);

            if (!declared.has(name)) {
              declared.set(name, {
                node: node.id,
                exported: isInlineExport || isSpecifierExport,
              });
            }
          }
        },
      });

      // Find usages
      acornWalk.ancestor(ast, {
        Identifier(node, ancestors) {
          const parent = ancestors[ancestors.length - 2];
          const isDeclaration = this.isIdentifierDeclaration(node, parent);
          const isPropertyKey =
            parent.type === 'Property' &&
            parent.key === node &&
            !parent.computed;

          if (!isDeclaration && !isPropertyKey) {
            used.add(node.name);
          }
        },
      });

      // Check for unused variables
      for (const [name, decl] of declared.entries()) {
        if (!used.has(name) && !decl.exported && !/^_/.test(name)) {
          errors.push({
            rule: 'No unused variables',
            message: `Variable '${name}' is declared but never used. (@typescript-eslint/no-unused-vars rule)`,
            file: filePath,
            line: decl.node.loc.start.line,
          });
        }
      }
    } catch (e) {
      // Skip files that can't be parsed
      this.logger.debug(
        `Could not parse ${filePath} for unused variables: ${e.message}`
      );
    }

    return errors;
  }

  /**
   * Check if identifier is a declaration
   */
  isIdentifierDeclaration(node, parent) {
    return (
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
    );
  }

  /**
   * Validate function naming conventions
   */
  async validateFunctionNaming(content, filePath) {
    const lines = content.split('\n');
    const errors = [];

    lines.forEach((line, idx) => {
      const functionInfo = this.detectFunctionDeclaration(line);

      if (functionInfo) {
        const functionName = functionInfo.name;

        // Skip React components and hooks
        if (/^[A-Z]/.test(functionName) || functionName.startsWith('use')) {
          return;
        }

        if (!/^[a-z]\w*$/.test(functionName)) {
          errors.push({
            rule: 'Function naming',
            message:
              'Functions must follow camelCase convention (e.g., getProvinces)',
            file: filePath,
            line: idx + 1,
          });
        }
      }
    });

    return errors;
  }

  /**
   * Validate interface naming conventions
   */
  async validateInterfaceNaming(content, filePath) {
    const lines = content.split('\n');
    const errors = [];

    lines.forEach((line, idx) => {
      const interfaceMatch = line.match(
        /export\s+interface\s+([a-zA-Z_$][\w$]*)/g
      );

      if (interfaceMatch) {
        interfaceMatch.forEach((match) => {
          const interfaceName = match.match(
            /export\s+interface\s+([a-zA-Z_$][\w$]*)/
          )[1];

          if (!/^I[A-Z]\w*$/.test(interfaceName)) {
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
   * Validate style conventions
   */
  async validateStyleConventions(content, filePath) {
    const errors = [];

    if (!filePath.endsWith('.style.ts')) {
      return errors;
    }

    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      // Check style object exports
      const exportMatch = line.match(/export\s+const\s+([a-zA-Z_$][\w$]*)\s*=/);
      if (exportMatch) {
        const styleName = exportMatch[1];

        if (!/^[a-z]\w*Styles$/.test(styleName)) {
          errors.push({
            rule: 'Style naming',
            message: `Style object '${styleName}' should be in camelCase and end with 'Styles' (e.g., cardPreviewStyles)`,
            file: filePath,
            line: idx + 1,
          });
        }
      }

      // Check style properties
      const propertyMatch = line.match(/^\s*([a-zA-Z_$][\w$]*)\s*:/);
      if (propertyMatch) {
        const propertyName = propertyMatch[1];

        if (!/^[a-z]\w*$/.test(propertyName)) {
          errors.push({
            rule: 'Style property naming',
            message: `Style property '${propertyName}' should be in camelCase`,
            file: filePath,
            line: idx + 1,
          });
        }
      }
    });

    return errors;
  }

  /**
   * Detect function declarations in a line
   * @param {string} line Line of code
   * @returns {Object|null} Function info or null
   */
  detectFunctionDeclaration(line) {
    // Check for regular function declarations
    const funcMatch = line.match(/(export\s+)?function\s+([a-zA-Z_$]\w*)\s*\(/);
    if (funcMatch) {
      return { name: funcMatch[2], type: 'function' };
    }

    // Check for const/let/var function expressions
    const constMatch = line.match(
      /(export\s+)?(const|let|var)\s+([a-zA-Z_$]\w*)\s*[:=]/
    );
    if (constMatch && (line.includes('=>') || line.includes('function'))) {
      return { name: constMatch[3], type: 'expression' };
    }

    return null;
  }

  /**
   * Calculate function complexity score
   * @param {Array} lines Code lines
   * @param {number} startIndex Starting line index
   * @returns {Object} Complexity information
   */
  calculateFunctionComplexity(lines, startIndex) {
    let complexityScore = 0;
    let braceCount = 0;
    let inFunction = false;
    let linesInFunction = 0;

    for (let j = startIndex; j < Math.min(startIndex + 30, lines.length); j++) {
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
        complexityScore += this.calculateLineComplexity(bodyLine);
      }

      if (inFunction && braceCount === 0) break;
    }

    return { complexityScore, linesInFunction };
  }

  /**
   * Calculate complexity score for a single line
   * @param {string} line Line of code
   * @returns {number} Complexity score
   */
  calculateLineComplexity(line) {
    let score = 0;

    if (/\b(if|else if|switch|case)\b/.test(line)) score += 1;
    if (/\b(for|while|do)\b/.test(line)) score += 2;
    if (/\b(try|catch|finally)\b/.test(line)) score += 2;
    if (/\b(async|await|Promise)\b/.test(line)) score += 2;
    if (/\.(map|filter|reduce|forEach|find|some|every)\s*\(/.test(line))
      score += 1;
    if (/\?\s*[^:]*\s*:/.test(line)) score += 1; // Ternary
    if (/&&|\|\|/.test(line)) score += 0.5; // Logical operators

    return score;
  }
}
