import fs from 'fs';
import path from 'path';

/**
 * Configuration loader and manager
 * Handles loading custom rules and project configuration
 */
export class ConfigLoader {
  constructor(rootDir, logger) {
    this.rootDir = rootDir;
    this.logger = logger;
    this.configFileName = 'checkFrontendStandards.config.js';
  }

  /**
   * Load configuration from file or use defaults
   * @param {string} customConfigPath Optional custom config path
   * @returns {Promise<Object>} Configuration object
   */
  async load(customConfigPath = null) {
    const configPath =
      customConfigPath || path.join(this.rootDir, this.configFileName);

    try {
      if (fs.existsSync(configPath)) {
        this.logger.info(`📋 Loading configuration from: ${configPath}`);

        // Dynamic import with cache busting
        const configModule = await import(`${configPath}?t=${Date.now()}`);
        const customConfig = configModule.default || configModule;

        return this.mergeWithDefaults(customConfig);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to load config from ${configPath}:`,
        error.message
      );
    }

    this.logger.info('📋 Using default configuration');
    return this.getDefaultConfig();
  }

  /**
   * Merge custom configuration with defaults
   * @param {Object|Function} customConfig Custom configuration
   * @returns {Object} Merged configuration
   */
  mergeWithDefaults(customConfig) {
    const defaultConfig = this.getDefaultConfig();

    if (typeof customConfig === 'function') {
      return customConfig(defaultConfig);
    }

    if (Array.isArray(customConfig)) {
      return {
        ...defaultConfig,
        rules: [...defaultConfig.rules, ...customConfig],
      };
    }

    if (
      customConfig &&
      customConfig.merge === false &&
      Array.isArray(customConfig.rules)
    ) {
      return {
        ...defaultConfig,
        rules: customConfig.rules,
      };
    }

    if (customConfig && Array.isArray(customConfig.rules)) {
      return {
        ...defaultConfig,
        rules: [...defaultConfig.rules, ...customConfig.rules],
        ...customConfig,
      };
    }

    return {
      ...defaultConfig,
      ...customConfig,
    };
  }

  /**
   * Get default configuration
   * @returns {Object} Default configuration object
   */
  getDefaultConfig() {
    return {
      rules: this.getDefaultRules(),
      zones: {
        includePackages: false,
        customZones: [],
      },
      extensions: ['.js', '.ts', '.jsx', '.tsx'],
      ignorePatterns: [
        'node_modules',
        '.next',
        '.git',
        '__tests__',
        '__test__',
        'coverage',
        'dist',
        'build',
      ],
      structure: this.getDefaultStructure(),
      naming: this.getDefaultNamingRules(),
    };
  }

  /**
   * Get default validation rules
   * @returns {Array} Array of default rules
   */
  getDefaultRules() {
    return [
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
        check: (content) =>
          /\(([^)]*)\)\s*=>/.test(content) && /function\s*\(/.test(content),
        message: 'Prefer arrow functions or named functions in callbacks.',
      },
      // Advanced rules inspired by BluAdmin
      {
        name: 'No unused variables',
        check: (content) =>
          /\b_?\w+\b\s*=\s*[^;]*;?\n/g.test(content) &&
          /\/\/\s*eslint-disable-next-line\s+@typescript-eslint\/no-unused-vars/.test(
            content
          ) === false,
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
            return false;
          }

          // Look for actual variable shadowing patterns
          const lines = content.split('\n');
          const scopeStack = [];
          let currentScope = new Set();

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;

            // Skip comments and imports
            if (
              line.startsWith('//') ||
              line.startsWith('/*') ||
              line.startsWith('import') ||
              line.startsWith('*') ||
              line.startsWith('export type') ||
              line.startsWith('export interface')
            ) {
              continue;
            }

            // Handle scope changes
            if (line.includes('{')) {
              scopeStack.push(new Set(currentScope));
            }
            if (line.includes('}')) {
              if (scopeStack.length > 0) {
                currentScope = scopeStack.pop();
              }
            }

            // Look for variable declarations
            const varMatches = line.match(
              /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g
            );
            if (varMatches) {
              for (const match of varMatches) {
                const varName = match
                  .replace(/(?:const|let|var)\s+/, '')
                  .split(/[^a-zA-Z_$0-9]/)[0];
                if (varName && currentScope.has(varName)) {
                  // Store the shadowing information for detailed reporting
                  this.shadowingDetails = {
                    line: lineNumber,
                    variable: varName,
                    file: filePath,
                  };
                  return true;
                }
                if (varName) {
                  currentScope.add(varName);
                }
              }
            }

            // Look for function parameters and arrow functions that might shadow
            const funcParamMatches =
              line.match(/(?:function\s+\w+|=>|\w+\s*=>)\s*\(([^)]*)\)/) ||
              line.match(/\(([^)]*)\)\s*=>/) ||
              line.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/);

            if (funcParamMatches) {
              let params = [];
              if (funcParamMatches[1]) {
                // Handle regular function parameters
                params = funcParamMatches[1]
                  .split(',')
                  .map((p) => p.trim().split(/[\s:]/)[0])
                  .filter((p) => p && /^[a-zA-Z_$]/.test(p));
              }

              for (const param of params) {
                if (param && currentScope.has(param)) {
                  this.shadowingDetails = {
                    line: lineNumber,
                    variable: param,
                    file: filePath,
                  };
                  return true;
                }
              }
            }

            // Check for map/forEach/filter callbacks that might shadow
            const callbackMatches = line.match(
              /\.(?:map|forEach|filter|reduce|find|some|every)\s*\(\s*(?:\(([^)]*)\)|([a-zA-Z_$][a-zA-Z0-9_$]*))/
            );
            if (callbackMatches) {
              const param = callbackMatches[1]
                ? callbackMatches[1].split(',')[0].trim().split(/[\s:]/)[0]
                : callbackMatches[2];
              if (param && currentScope.has(param)) {
                this.shadowingDetails = {
                  line: lineNumber,
                  variable: param,
                  file: filePath,
                };
                return true;
              }
            }
          }

          return false;
        },
        message:
          'There should be no variable shadowing (@typescript-eslint/no-shadow rule).',
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
            return false;
          }

          // Check if file has exports without JSDoc
          const lines = content.split('\n');
          let hasExportsWithoutTSDoc = false;
          let inTSDoc = false;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Track TSDoc state
            if (/^\s*\/\*\*/.test(line)) {
              inTSDoc = true;
              continue;
            }
            if (inTSDoc && /\*\//.test(line)) {
              inTSDoc = false;
              continue;
            }

            // Check for complex exports that should have TSDoc
            if (
              /^export\s+(function|class|const|let|var)\s+[a-zA-Z]/.test(line)
            ) {
              // Look back for TSDoc in the previous few lines
              let hasTSDocAbove = false;
              for (let j = Math.max(0, i - 5); j < i; j++) {
                if (/\/\*\*/.test(lines[j]) || /^\s*\*\s+/.test(lines[j])) {
                  hasTSDocAbove = true;
                  break;
                }
              }

              // Check if this is a complex export (function or class)
              if (/^export\s+(function|class)/.test(line) && !hasTSDocAbove) {
                hasExportsWithoutTSDoc = true;
              }

              // For const/let/var exports, check if they're functions
              if (
                /^export\s+(const|let|var)\s+[a-zA-Z][a-zA-Z0-9]*\s*=\s*(async\s+)?\(/.test(
                  line
                ) &&
                !hasTSDocAbove
              ) {
                hasExportsWithoutTSDoc = true;
              }
            }
          }

          return hasExportsWithoutTSDoc;
        },
        message:
          'Exported functions and classes should have TSDoc comments explaining their purpose and parameters.',
      },
      {
        name: 'Interface naming convention',
        check: (content) => {
          // Check for exported interfaces that don't follow IComponentName pattern
          const interfaceMatches = content.match(
            /export\s+interface\s+([A-Za-z_][A-Za-z0-9_]*)/g
          );
          if (interfaceMatches) {
            return interfaceMatches.some((match) => {
              const interfaceName = match.replace(/export\s+interface\s+/, '');
              return !/^I[A-Z][a-zA-Z0-9]*$/.test(interfaceName);
            });
          }
          return false;
        },
        message:
          'Exported interfaces must start with I followed by PascalCase (e.g., IComponentProps).',
      },
    ];
  }

  /**
   * Get default project structure expectations
   * @returns {Object} Structure configuration
   */
  getDefaultStructure() {
    return {
      app: ['pages', 'components', 'public'],
      package: ['src', 'package.json'],
      src: {
        assets: [],
        components: ['index.ts'],
        constants: ['index.ts'],
        modules: [],
        helpers: ['index.ts'],
        hooks: ['index.ts'],
        providers: ['index.ts'],
        styles: ['index.ts'],
        store: [
          'reducers',
          'types',
          'state.selector.ts',
          'state.interface.ts',
          'store',
        ],
      },
    };
  }

  /**
   * Get default naming convention rules
   * @returns {Array} Naming rules array
   */
  getDefaultNamingRules() {
    return [
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
        dir: 'helpers',
        regex: /^[a-z][a-zA-Z0-9]*\.helper\.ts$/,
        desc: 'Helpers must be camelCase and end with .helper.ts',
      },
      {
        dir: 'types',
        regex: /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)*\.type\.ts$/,
        desc: 'Types must be camelCase and end with .type.ts',
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
  }
}
