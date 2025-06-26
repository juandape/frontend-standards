import fs from 'fs';
import path from 'path';
import type {
  IConfigLoader,
  ILogger,
  StandardsConfiguration,
  ConfigurationExport,
  DefaultRulesStructure,
  ValidationRule,
} from '../types.js';

/**
 * Configuration loader and manager
 * Handles loading custom rules and project configuration
 */
export class ConfigLoader implements IConfigLoader {
  public readonly rootDir: string;
  public readonly logger: ILogger;
  public readonly configFileName: string;

  constructor(rootDir: string, logger: ILogger) {
    this.rootDir = rootDir;
    this.logger = logger;
    this.configFileName = 'checkFrontendStandards.config.js';
  }

  /**
   * Load configuration from file or use defaults
   * @param customConfigPath Optional custom config path
   * @returns Configuration object
   */
  async load(
    customConfigPath: string | null = null
  ): Promise<StandardsConfiguration> {
    const configPath =
      customConfigPath ?? path.join(this.rootDir, this.configFileName);

    try {
      if (fs.existsSync(configPath)) {
        this.logger.info(`📋 Loading configuration from: ${configPath}`);

        // Dynamic import with cache busting
        const configModule = await import(`${configPath}?t=${Date.now()}`);
        const customConfig: ConfigurationExport =
          configModule.default ?? configModule;

        return this.mergeWithDefaults(customConfig);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to load config from ${configPath}:`,
        error instanceof Error ? error.message : String(error)
      );
    }

    this.logger.info('📋 Using default configuration');
    return this.getDefaultConfig();
  }

  /**
   * Merge custom configuration with defaults
   * @param customConfig Custom configuration
   * @returns Merged configuration
   */
  mergeWithDefaults(customConfig: ConfigurationExport): StandardsConfiguration {
    const defaultConfig = this.getDefaultConfig();
    const defaultRules = this.getDefaultRules();

    if (typeof customConfig === 'function') {
      const result = customConfig(Object.values(defaultRules).flat());

      if (Array.isArray(result)) {
        return {
          ...defaultConfig,
          rules: result,
        };
      }

      return result;
    }

    if (Array.isArray(customConfig)) {
      return {
        ...defaultConfig,
        rules: [...Object.values(defaultRules).flat(), ...customConfig],
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
        ...customConfig,
        rules: [...Object.values(defaultRules).flat(), ...customConfig.rules],
      };
    }

    if (customConfig && typeof customConfig === 'object') {
      return {
        ...defaultConfig,
        ...customConfig,
        rules: customConfig.rules ?? Object.values(defaultRules).flat(),
      };
    }

    return defaultConfig;
  }

  /**
   * Get default configuration
   * @returns Default configuration
   */
  getDefaultConfig(): StandardsConfiguration {
    const defaultRules = this.getDefaultRules();

    return {
      merge: true,
      rules: Object.values(defaultRules).flat(),
      zones: {
        includePackages: false,
        customZones: [],
      },
      extensions: ['.js', '.ts', '.jsx', '.tsx'],
      ignorePatterns: [
        'node_modules',
        '.git',
        'dist',
        'build',
        'coverage',
        '.next',
        '.nuxt',
        'out',
        '*.log',
        '*.lock',
        '.env*',
        '.DS_Store',
        'Thumbs.db',
      ],
    };
  }

  /**
   * Get default rules organized by category
   * @returns Default rules structure
   */
  getDefaultRules(): DefaultRulesStructure {
    return {
      structure: this.getStructureRules(),
      naming: this.getNamingRules(),
      content: this.getContentRules(),
      style: this.getStyleRules(),
      documentation: this.getDocumentationRules(),
      typescript: this.getTypeScriptRules(),
      react: this.getReactRules(),
      imports: this.getImportRules(),
      performance: this.getPerformanceRules(),
      accessibility: this.getAccessibilityRules(),
    };
  }

  /**
   * Get structure validation rules
   * @returns Structure rules
   */
  private getStructureRules(): ValidationRule[] {
    return [
      {
        name: 'Folder structure',
        category: 'structure',
        severity: 'warning',
        check: (_content: string, filePath: string): boolean => {
          // Check for basic folder structure requirements
          const pathParts = filePath.split('/');
          const isInSrc = pathParts.includes('src');
          const hasProperStructure = isInSrc && pathParts.length > 2;

          return (
            !hasProperStructure &&
            filePath.includes('/components/') &&
            !filePath.includes('index.')
          );
        },
        message: 'Components should follow proper folder structure within src/',
      },
      {
        name: 'Src structure',
        category: 'structure',
        severity: 'warning',
        check: (_content: string, filePath: string): boolean => {
          const requiredFolders = ['components', 'utils', 'types'];
          const isRootFile =
            !filePath.includes('/') || filePath.split('/').length === 2;

          return (
            isRootFile &&
            !filePath.includes('config') &&
            !requiredFolders.some((folder) => filePath.includes(folder))
          );
        },
        message: 'Files should be organized in proper src/ structure',
      },
      {
        name: 'Component size limit',
        category: 'structure',
        severity: 'warning',
        check: (content: string, filePath: string): boolean => {
          if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx'))
            return false;

          const lines = content.split('\n').length;
          return lines > 200; // Components should not exceed 200 lines
        },
        message:
          'Component is too large (>200 lines). Consider breaking it into smaller components.',
      },
      {
        name: 'No circular dependencies',
        category: 'structure',
        severity: 'warning',
        check: (content: string, filePath: string): boolean => {
          // Detect potential circular dependencies
          const imports =
            content.match(/import.*from\s+['"]([^'"]+)['"]/g) || [];
          const currentDir = path.dirname(filePath);
          const currentDirName = path.basename(currentDir);

          return imports.some((imp) => {
            const importRegex = /from\s+['"]([^'"]+)['"]/;
            const importMatch = importRegex.exec(imp);
            if (importMatch?.[1]) {
              const importPath = importMatch[1];
              if (importPath.startsWith('./') || importPath.startsWith('../')) {
                // Simple check: if import path leads back to current directory
                return importPath.includes(currentDirName);
              }
            }
            return false;
          });
        },
        message:
          'Potential circular dependency detected. Review import structure.',
      },
      {
        name: 'Missing test files',
        category: 'structure',
        severity: 'warning',
        check: (_content: string, filePath: string): boolean => {
          // Skip if this is already a test file
          if (
            filePath.includes('__test__') ||
            filePath.includes('.test.') ||
            filePath.includes('.spec.')
          ) {
            return false;
          }

          // Skip non-component/hook files that don't need tests
          if (
            !filePath.includes('/components/') &&
            !filePath.includes('/hooks/') &&
            !filePath.includes('/helpers/') &&
            !filePath.includes('/modules/') &&
            !filePath.endsWith('.tsx') &&
            !filePath.endsWith('.hook.ts')
          ) {
            return false;
          }

          const fileName = path.basename(filePath);
          const dirPath = path.dirname(filePath);
          const testDir = path.join(dirPath, '__tests__');
          const testFileName = fileName.replace(/\.(tsx?|jsx?)$/, '.test.$1');
          const testFilePath = path.join(testDir, testFileName);

          // Check if corresponding test file exists
          try {
            return !require('fs').existsSync(testFilePath);
          } catch {
            return true;
          }
        },
        message:
          'Components, hooks, and modules should have corresponding test files in __tests__/ directory',
      },
      {
        name: 'Test file naming convention',
        category: 'naming',
        severity: 'error',
        check: (_content: string, filePath: string): boolean => {
          // Only check test files
          if (
            !filePath.includes('__test__') &&
            !filePath.includes('.test.') &&
            !filePath.includes('.spec.')
          ) {
            return false;
          }

          const fileName = path.basename(filePath);

          // Test files should follow *.test.tsx or *.spec.tsx pattern
          return !/\.(test|spec)\.(tsx?|jsx?)$/.test(fileName);
        },
        message:
          'Test files should follow *.test.tsx or *.spec.tsx naming convention',
      },
    ];
  }

  /**
   * Get naming validation rules
   * @returns Naming rules
   */
  private getNamingRules(): ValidationRule[] {
    return [
      {
        name: 'Component naming',
        category: 'naming',
        severity: 'error',
        check: (_content: string, filePath: string): boolean => {
          const fileName = path.basename(filePath);
          const dirName = path.basename(path.dirname(filePath));

          // Component files should be PascalCase
          if (filePath.endsWith('.tsx') && filePath.includes('/components/')) {
            if (fileName === 'index.tsx') {
              // For index.tsx files, the parent directory should be PascalCase
              return !/^[A-Z][a-zA-Z0-9]*$/.test(dirName);
            } else {
              // Direct component files should be PascalCase
              const componentName = fileName.replace('.tsx', '');
              return !/^[A-Z][a-zA-Z0-9]*$/.test(componentName);
            }
          }

          return false;
        },
        message:
          'Component files should start with uppercase letter (PascalCase). For index.tsx files, the parent directory should be PascalCase.',
      },
      {
        name: 'Hook naming',
        category: 'naming',
        severity: 'error',
        check: (_content: string, filePath: string): boolean => {
          const fileName = path.basename(filePath);

          // Hook files should follow useHookName.hook.ts pattern
          if (filePath.includes('/hooks/') || fileName.includes('.hook.')) {
            const hookPattern = /^use[A-Z][a-zA-Z0-9]*\.hook\.(ts|tsx)$/;
            if (!hookPattern.test(fileName)) {
              return true;
            }
          }

          return false;
        },
        message: 'Hook files should follow "useHookName.hook.ts" pattern',
      },
      {
        name: 'Type naming',
        category: 'naming',
        severity: 'error',
        check: (_content: string, filePath: string): boolean => {
          const fileName = path.basename(filePath);

          // Type files should be camelCase and end with .type.ts
          if (filePath.includes('/types/') || fileName.endsWith('.type.ts')) {
            const typePattern =
              /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)*\.type\.ts$/;
            if (!typePattern.test(fileName)) {
              return true;
            }
          }

          return false;
        },
        message: 'Type files should be camelCase and end with .type.ts',
      },
      {
        name: 'Constants naming',
        category: 'naming',
        severity: 'error',
        check: (_content: string, filePath: string): boolean => {
          const fileName = path.basename(filePath);

          // Constants files should be camelCase and end with .constant.ts
          if (
            filePath.includes('/constants/') ||
            fileName.endsWith('.constant.ts')
          ) {
            const constantPattern = /^[a-z][a-zA-Z0-9]*\.constant\.ts$/;
            if (!constantPattern.test(fileName)) {
              return true;
            }
          }

          return false;
        },
        message:
          'Constants files should be camelCase and end with .constant.ts',
      },
      {
        name: 'Helper naming',
        category: 'naming',
        severity: 'error',
        check: (_content: string, filePath: string): boolean => {
          const fileName = path.basename(filePath);

          // Helper files should be camelCase and end with .helper.ts
          if (
            filePath.includes('/helpers/') ||
            filePath.includes('/helper/') ||
            fileName.endsWith('.helper.ts')
          ) {
            const helperPattern = /^[a-z][a-zA-Z0-9]*\.helper\.ts$/;
            if (!helperPattern.test(fileName)) {
              return true;
            }
          }

          return false;
        },
        message: 'Helper files should be camelCase and end with .helper.ts',
      },
      {
        name: 'Style naming',
        category: 'naming',
        severity: 'error',
        check: (_content: string, filePath: string): boolean => {
          const fileName = path.basename(filePath);

          // Style files should be camelCase and end with .style.ts
          if (filePath.includes('/styles/') || fileName.endsWith('.style.ts')) {
            const stylePattern = /^[a-z][a-zA-Z0-9]*\.style\.ts$/;
            if (!stylePattern.test(fileName)) {
              return true;
            }
          }

          return false;
        },
        message: 'Style files should be camelCase and end with .style.ts',
      },
      {
        name: 'Assets naming',
        category: 'naming',
        severity: 'error',
        check: (_content: string, filePath: string): boolean => {
          const fileName = path.basename(filePath);
          const fileExt = path.extname(fileName);
          const baseName = fileName.replace(fileExt, '');

          // Assets should follow kebab-case (service-error.svg)
          if (
            filePath.includes('/assets/') &&
            /\.(svg|png|jpg|jpeg|gif|webp|ico)$/.test(fileName)
          ) {
            if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(baseName)) {
              return true;
            }
          }

          return false;
        },
        message:
          'Assets should follow kebab-case naming (e.g., service-error.svg)',
      },
      {
        name: 'Directory naming convention',
        category: 'naming',
        severity: 'error',
        check: (_content: string, filePath: string): boolean => {
          const pathParts = filePath.split('/');

          // Check each directory part for proper naming
          for (let i = 0; i < pathParts.length - 1; i++) {
            const dirName = pathParts[i];

            // Skip empty parts and common framework directories
            if (
              !dirName ||
              [
                'src',
                'app',
                'pages',
                'public',
                'components',
                'hooks',
                'utils',
                'lib',
                'styles',
                'types',
                'constants',
                'helpers',
                'assets',
                'enums',
              ].includes(dirName)
            ) {
              continue;
            }

            // Skip route directories (Next.js app router) - these can be kebab-case
            if (
              pathParts.includes('app') &&
              /^[a-z0-9]+(-[a-z0-9]+)*$/.test(dirName)
            ) {
              continue;
            }

            // General directories should be camelCase or PascalCase
            if (
              !/^[a-z][a-zA-Z0-9]*$/.test(dirName) &&
              !/^[A-Z][a-zA-Z0-9]*$/.test(dirName)
            ) {
              return true;
            }
          }

          return false;
        },
        message:
          'Directories should follow camelCase or PascalCase convention (kebab-case allowed for Next.js routes)',
      },
      {
        name: 'Interface naming with I prefix',
        category: 'naming',
        severity: 'warning',
        check: (content: string): boolean => {
          // Check for interface declarations that don't start with I
          const interfaceRegex = /interface\s+([A-Z][a-zA-Z0-9]*)/g;
          let match;

          while ((match = interfaceRegex.exec(content)) !== null) {
            const interfaceName = match[1];
            // Interface should start with I or end with Props/Type/Config
            if (
              interfaceName &&
              !interfaceName.startsWith('I') &&
              !interfaceName.endsWith('Props') &&
              !interfaceName.endsWith('Type') &&
              !interfaceName.endsWith('Config')
            ) {
              return true;
            }
          }

          return false;
        },
        message:
          'Interfaces should be prefixed with "I" or suffixed with "Props", "Type", or "Config"',
      },
    ];
  }

  /**
   * Get content validation rules
   * @returns Content rules
   */
  private getContentRules(): ValidationRule[] {
    return [
      {
        name: 'No console.log',
        category: 'content',
        severity: 'warning',
        check: (content: string, _filePath: string): boolean => {
          return /console\.(log|warn|error|info|debug)/.test(content);
        },
        message: 'Remove console statements before committing to production',
      },
      {
        name: 'No var',
        category: 'content',
        severity: 'error',
        check: (content: string): boolean => {
          return /\bvar\s+/.test(content);
        },
        message: 'Use let or const instead of var',
      },
      {
        name: 'No inline styles',
        category: 'content',
        severity: 'warning',
        check: (content: string): boolean => {
          return /style\s*=\s*\{/.test(content);
        },
        message: 'Avoid inline styles, use CSS classes or styled components',
      },
      {
        name: 'No any type',
        category: 'typescript',
        severity: 'error',
        check: (content: string): boolean => {
          // Skip type declaration files
          if (content.includes('declare')) return false;

          // Check for explicit any usage (excluding comments)
          const lines = content.split('\n');
          return lines.some((line) => {
            const trimmed = line.trim();
            // Skip comments
            if (trimmed.startsWith('//') || trimmed.startsWith('*'))
              return false;

            // Check for 'any' as a type annotation
            return /:\s*any\b|<any>|Array<any>|Promise<any>|\bas\s+any\b/.test(
              line
            );
          });
        },
        message:
          'Avoid using "any" type. Use specific types or unknown instead',
      },
      {
        name: 'Next.js Image optimization',
        category: 'performance',
        severity: 'warning',
        check: (content: string, filePath: string): boolean => {
          if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx'))
            return false;

          const hasImgTag = /<img\s/i.test(content);
          const hasNextImage = /import.*Image.*from.*next\/image/.test(content);

          return hasImgTag && !hasNextImage;
        },
        message:
          'Use Next.js Image component instead of <img> for better performance',
      },
      {
        name: 'Image alt text',
        category: 'accessibility',
        severity: 'warning',
        check: (content: string): boolean => {
          const imgRegex = /<img[^>]*>/gi;
          let match: RegExpExecArray | null;

          while ((match = imgRegex.exec(content)) !== null) {
            const imgTag = match[0];
            if (!imgTag.includes('alt=')) {
              return true;
            }
          }

          return false;
        },
        message: 'Images should have alt text for accessibility',
      },
      {
        name: 'No alert',
        category: 'content',
        severity: 'error',
        check: (content: string): boolean => {
          return /\balert\s*\(/.test(content);
        },
        message:
          'The use of alert() is not allowed. Use proper notifications or toast messages instead.',
      },
      {
        name: 'No hardcoded URLs',
        category: 'content',
        severity: 'error',
        check: (content: string, filePath: string): boolean => {
          // Skip configuration and setup files
          const isConfigFile =
            /(config|setup|mock|__tests__|\.test\.|\.spec\.|instrumentation|sentry|jest\.setup|jest\.config)/.test(
              filePath
            );
          if (isConfigFile) {
            return false;
          }

          // Check for hardcoded URLs but exclude common valid cases
          const hasHardcodedURL = /https?:\/\/[^\s"'`]+/.test(content);
          const isInComment = content.split('\n').some((line) => {
            const urlMatch = /https?:\/\/[^\s"'`]+/.exec(line);
            if (urlMatch) {
              const beforeUrl = line.substring(0, urlMatch.index);
              return /\/\//.test(beforeUrl) || /\/\*/.test(beforeUrl);
            }
            return false;
          });

          return hasHardcodedURL && !isInComment;
        },
        message:
          'No hardcoded URLs allowed. Use environment variables or constants.',
      },
      {
        name: 'Must use async/await',
        category: 'content',
        severity: 'warning',
        check: (content: string): boolean => {
          // Check for .then() usage without async/await in the same context
          const hasThen = /\.then\s*\(/.test(content);
          const hasAsyncAwait = /async|await/.test(content);

          return hasThen && !hasAsyncAwait;
        },
        message:
          'Prefer async/await over .then() for better readability and error handling.',
      },
      {
        name: 'No jQuery',
        category: 'content',
        severity: 'error',
        check: (content: string): boolean => {
          return /\$\s*\(|jQuery/.test(content);
        },
        message:
          'jQuery is not allowed. Use modern JavaScript, React, or other framework methods instead.',
      },
      {
        name: 'Component size limit',
        category: 'content',
        severity: 'warning',
        check: (content: string, filePath: string): boolean => {
          if (
            !filePath.endsWith('.tsx') ||
            !filePath.includes('/components/')
          ) {
            return false;
          }

          const lines = content.split('\n');
          const nonEmptyLines = lines.filter(
            (line) => line.trim() !== ''
          ).length;

          // Components should not exceed 200 lines of actual code
          return nonEmptyLines > 200;
        },
        message:
          'Component is too large (>200 lines). Consider breaking it into smaller components.',
      },
      {
        name: 'No circular dependencies',
        category: 'content',
        severity: 'error',
        check: (content: string, filePath: string): boolean => {
          // Simple check for potential circular dependencies
          // This is a basic implementation - for full circular dependency detection,
          // a more sophisticated analysis would be needed
          const imports =
            content.match(/import.*from\s+['"`]([^'"`]+)['"`]/g) || [];
          const fileName = filePath
            .split('/')
            .pop()
            ?.replace(/\.(ts|tsx|js|jsx)$/, '');

          if (!fileName) return false;

          // Check if any import path suggests it might import the current file
          return imports.some((importStatement) => {
            const importRegex = /from\s+['"`]([^'"`]+)['"`]/;
            const match = importRegex.exec(importStatement);
            const importPath = match?.[1];
            return (
              importPath &&
              (importPath.includes(`./${fileName}`) ||
                importPath.includes(`../${fileName}`) ||
                importPath.endsWith(`/${fileName}`))
            );
          });
        },
        message:
          'Potential circular dependency detected. Refactor to avoid circular imports.',
      },
    ];
  }

  /**
   * Get style validation rules
   * @returns Style rules
   */
  private getStyleRules(): ValidationRule[] {
    return [
      {
        name: 'Style naming',
        category: 'style',
        severity: 'warning',
        check: (content: string, filePath: string): boolean => {
          if (!filePath.includes('.style.')) {
            return false;
          }

          const hasStyleExport = /export\s+const\s+\w+Styles\s*=/.test(content);
          return !hasStyleExport;
        },
        message: 'Style objects should end with "Styles" suffix',
      },
    ];
  }

  /**
   * Get documentation validation rules
   * @returns Documentation rules
   */
  private getDocumentationRules(): ValidationRule[] {
    return [
      {
        name: 'Missing comment in complex function',
        category: 'documentation',
        severity: 'warning',
        check: (content: string): boolean => {
          const functionRegex = /function\s+\w+\([^)]*\)\s*\{[\s\S]*?\}/g;
          const functions = content.match(functionRegex) || [];

          return functions.some((func) => {
            const lines = func.split('\n').length;
            const hasComment = /\/\*\*[\s\S]*?\*\/|\/\//.test(func);
            return lines > 10 && !hasComment;
          });
        },
        message:
          'Complex functions should have comments explaining their purpose',
      },
      {
        name: 'Should have TSDoc comments',
        category: 'documentation',
        severity: 'info',
        check: (content: string, filePath: string): boolean => {
          // Skip test files
          if (
            filePath.includes('__test__') ||
            filePath.includes('.test.') ||
            filePath.includes('.spec.')
          ) {
            return false;
          }

          // Check for exported functions without TSDoc comments
          const exportedFunctionRegex =
            /export\s+(function|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
          const tsdocRegex = /\/\*\*[\s\S]*?\*\//g;

          const exportedFunctions = Array.from(
            content.matchAll(exportedFunctionRegex)
          );
          const tsdocComments = Array.from(content.matchAll(tsdocRegex));

          // If there are exported functions but no TSDoc comments, flag it
          return exportedFunctions.length > 0 && tsdocComments.length === 0;
        },
        message:
          'Exported functions should have TSDoc comments with @param and @returns',
      },
      {
        name: 'JSDoc for complex functions',
        category: 'documentation',
        severity: 'warning',
        check: (content: string): boolean => {
          // Look for complex functions that should have JSDoc
          const complexFunctionPatterns = [
            /function\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)\s*\{[\s\S]{200,}?\}/g, // Functions with substantial body
            /(export\s+)?(const|function)\s+[a-zA-Z_$][a-zA-Z0-9_$]*.*=.*\{[\s\S]{150,}?\}/g, // Arrow functions with substantial body
          ];

          for (const pattern of complexFunctionPatterns) {
            const matches = Array.from(content.matchAll(pattern));
            for (const match of matches) {
              const beforeFunction = content.substring(0, match.index || 0);
              const lastLines = beforeFunction
                .split('\n')
                .slice(-10)
                .join('\n');

              // Check if there's a JSDoc comment before this function
              if (!/\/\*\*[\s\S]*?\*\/\s*$/.test(lastLines)) {
                return true;
              }
            }
          }

          return false;
        },
        message:
          'Complex functions should have JSDoc comments explaining their behavior in English',
      },
    ];
  }

  /**
   * Get TypeScript specific rules
   */
  private getTypeScriptRules(): ValidationRule[] {
    return [
      {
        name: 'Prefer type over interface for unions',
        category: 'typescript',
        severity: 'warning',
        check: (content: string): boolean => {
          const interfaceWithUnion = /interface\s+\w+.*\{[\s\S]*?\|[\s\S]*?\}/;
          return interfaceWithUnion.test(content);
        },
        message: 'Use "type" instead of "interface" for union types',
      },
      {
        name: 'Explicit return types for functions',
        category: 'typescript',
        severity: 'warning',
        check: (content: string, filePath: string): boolean => {
          if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx'))
            return false;

          const exportedFunctions = content.match(
            /export\s+(async\s+)?function\s+\w+\s*\([^)]*\)\s*(?!:)/g
          );
          const arrowFunctions = content.match(
            /export\s+const\s+\w+\s*=\s*(async\s*)?\([^)]*\)\s*=>\s*(?!\{)/g
          );

          return Boolean(exportedFunctions?.length ?? arrowFunctions?.length);
        },
        message:
          'Exported functions should have explicit return type annotations',
      },
      {
        name: 'Proper generic naming',
        category: 'typescript',
        severity: 'warning',
        check: (content: string): boolean => {
          const genericMatches = content.match(/<([^>]+)>/g);
          if (!genericMatches) return false;

          const invalidGenerics = genericMatches.some((match) => {
            const generics = match
              .slice(1, -1)
              .split(',')
              .map((g) => g.trim());
            return generics.some((g) => this.isInvalidGeneric(g));
          });

          return invalidGenerics;
        },
        message:
          'Generic type parameters should be single uppercase letters or PascalCase names',
      },
      {
        name: 'Interface naming convention',
        category: 'typescript',
        severity: 'warning',
        check: (content: string): boolean => {
          const interfaceMatches = content.match(/interface\s+(\w+)/g);
          if (!interfaceMatches) return false;

          return interfaceMatches.some((match) => {
            const interfaceName = match.split(/\s+/)[1];
            return (
              interfaceName &&
              !interfaceName.endsWith('Props') &&
              !interfaceName.endsWith('Type') &&
              !interfaceName.endsWith('Config') &&
              !interfaceName.startsWith('I')
            );
          });
        },
        message:
          'Interfaces should be prefixed with "I" or suffixed with "Props", "Type", or "Config"',
      },
    ];
  }

  /**
   * Get React specific rules
   */
  private getReactRules(): ValidationRule[] {
    return [
      {
        name: 'Client component directive',
        category: 'react',
        severity: 'error',
        check: (content: string, filePath: string): boolean => {
          if (!filePath.includes('/app/') || !filePath.endsWith('.tsx'))
            return false;

          const hasClientFeatures = [
            'useState',
            'useEffect',
            'useCallback',
            'useMemo',
            'useRef',
            'onClick',
            'onChange',
            'onSubmit',
            'addEventListener',
            'window',
            'document',
            'localStorage',
            'sessionStorage',
          ].some((feature) => content.includes(feature));

          const hasUseClientDirective = /['"]use client['"]/.test(content);

          return hasClientFeatures && !hasUseClientDirective;
        },
        message:
          'Components with client-side features must include "use client" directive',
      },
      {
        name: 'Proper hook dependencies',
        category: 'react',
        severity: 'warning',
        check: (content: string): boolean => {
          const hookRegex =
            /use(Effect|Callback|Memo)\s*\(\s*[^,]+,\s*\[\s*\]/g;
          return hookRegex.test(content);
        },
        message:
          'useEffect, useCallback, and useMemo should include all dependencies in the dependency array',
      },
      {
        name: 'Component props interface',
        category: 'react',
        severity: 'warning',
        check: (content: string, filePath: string): boolean => {
          if (!filePath.endsWith('.tsx') || !filePath.includes('/components/'))
            return false;

          const hasComponentDefinition =
            /function\s+\w+\s*\(|const\s+\w+\s*=\s*\(/g.test(content);
          const hasPropsInterface = /interface\s+\w*Props|type\s+\w*Props/.test(
            content
          );

          return hasComponentDefinition && !hasPropsInterface;
        },
        message:
          'React components should define their props with TypeScript interfaces or types',
      },
      {
        name: 'Avoid React.FC',
        category: 'react',
        severity: 'warning',
        check: (content: string): boolean => {
          return /React\.FC|React\.FunctionComponent/.test(content);
        },
        message:
          'Avoid using React.FC, use regular function declaration or arrow function with explicit props typing',
      },
      {
        name: 'Proper key prop in lists',
        category: 'react',
        severity: 'error',
        check: (content: string): boolean => {
          const mapCallRegex = /\.map\s*\(\s*\([^)]*\)\s*=>\s*<[^>]*>/g;
          let match;
          while ((match = mapCallRegex.exec(content)) !== null) {
            if (!match[0].includes('key=')) {
              return true;
            }
          }
          return false;
        },
        message: 'Elements in arrays should have a key prop',
      },
      {
        name: 'Styled components naming',
        category: 'react',
        severity: 'warning',
        check: (content: string, filePath: string): boolean => {
          if (
            !filePath.endsWith('.style.ts') &&
            !filePath.endsWith('.style.tsx')
          ) {
            return false;
          }

          // Check for styled components
          const styledComponentRegex =
            /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*styled\./g;
          let match;

          while ((match = styledComponentRegex.exec(content)) !== null) {
            const componentName = match[1];
            // Styled components should start with uppercase (PascalCase)
            if (componentName && !/^[A-Z][a-zA-Z0-9]*$/.test(componentName)) {
              return true;
            }
          }

          return false;
        },
        message:
          'Styled components should use PascalCase naming (e.g., StyledButton, Container)',
      },
      {
        name: 'Tailwind CSS preference',
        category: 'style',
        severity: 'info',
        check: (content: string, filePath: string): boolean => {
          // Only check Next.js projects (presence of app/ or pages/ directory)
          if (!filePath.includes('/app/') && !filePath.includes('/pages/')) {
            return false;
          }

          // Check for styled-components usage without Tailwind
          const hasStyledComponents = /styled\./g.test(content);
          const hasTailwindClasses =
            /className=["'][^"']*\b(bg-|text-|p-|m-|w-|h-|flex|grid)/g.test(
              content
            );

          // If using styled-components but no Tailwind, suggest Tailwind first
          return hasStyledComponents && !hasTailwindClasses;
        },
        message:
          'Consider using Tailwind CSS as primary styling approach before styled-components',
      },
      {
        name: 'Next.js app router naming',
        category: 'naming',
        severity: 'error',
        check: (_content: string, filePath: string): boolean => {
          // Check Next.js app router directory naming
          if (filePath.includes('/app/') && !filePath.includes('/api/')) {
            const pathParts = filePath.split('/');
            const appIndex = pathParts.indexOf('app');

            if (appIndex >= 0 && appIndex < pathParts.length - 1) {
              // Check route segments (directories between app/ and file)
              for (let i = appIndex + 1; i < pathParts.length - 1; i++) {
                const segment = pathParts[i];

                // Skip empty segments and special Next.js directories
                if (
                  !segment ||
                  segment.startsWith('(') ||
                  segment.startsWith('[') ||
                  segment.startsWith('_') ||
                  segment === 'api'
                ) {
                  continue;
                }

                // Route segments should be kebab-case
                if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(segment)) {
                  return true;
                }
              }
            }
          }

          return false;
        },
        message:
          'Next.js app router directories should use kebab-case (e.g., /app/user-profile/page.tsx)',
      },
    ];
  }

  /**
   * Get import rules
   */
  private getImportRules(): ValidationRule[] {
    return [
      {
        name: 'Import order',
        category: 'structure',
        severity: 'warning',
        check: (content: string): boolean => {
          const lines = content.split('\n');
          const imports = lines.filter((line) =>
            line.trim().startsWith('import')
          );

          if (imports.length < 2) return false;

          let lastType = 0; // 0: external, 1: internal, 2: relative

          for (const importLine of imports) {
            let currentType = 0;

            if (
              importLine.includes("from './") ||
              importLine.includes("from '../")
            ) {
              currentType = 2; // relative
            } else if (
              importLine.includes("from '@/") ||
              importLine.includes("from '~/")
            ) {
              currentType = 1; // internal alias
            }

            if (currentType < lastType) {
              return true; // Wrong order
            }
            lastType = currentType;
          }

          return false;
        },
        message:
          'Imports should be ordered: external packages, internal aliases, relative imports',
      },
      {
        name: 'Use absolute imports',
        category: 'imports',
        severity: 'warning',
        check: (content: string, filePath: string): boolean => {
          const deepRelativeImports = /from\s+['"`]\.\.\/\.\.\//.test(content);
          const isInSrcFolder = filePath.includes('/src/');

          return deepRelativeImports && isInSrcFolder;
        },
        message:
          'Use absolute imports (@/ or ~/) instead of deep relative imports (../../)',
      },
      {
        name: 'No default and named imports mixed',
        category: 'imports',
        severity: 'info',
        check: (content: string): boolean => {
          const mixedImportRegex = /import\s+\w+\s*,\s*\{[^}]+\}\s+from/g;
          return mixedImportRegex.test(content);
        },
        message:
          'Prefer separate import statements for default and named imports for better readability',
      },
    ];
  }

  /**
   * Get performance rules
   */
  private getPerformanceRules(): ValidationRule[] {
    return [
      {
        name: 'Avoid inline functions in JSX',
        category: 'performance',
        severity: 'warning',
        check: (content: string, filePath: string): boolean => {
          if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx'))
            return false;

          const inlineFunctionRegex =
            /(?:onClick|onChange|onSubmit|onFocus|onBlur)\s*=\s*\{[^}]*(?:=>|\bfunction\b)/g;
          return inlineFunctionRegex.test(content);
        },
        message:
          'Avoid inline functions in JSX props, use useCallback or move to a method',
      },
      {
        name: 'Missing React.memo for pure components',
        category: 'performance',
        severity: 'info',
        check: (content: string, filePath: string): boolean => {
          if (!filePath.endsWith('.tsx') || !filePath.includes('/components/'))
            return false;

          const hasProps =
            /function\s+\w+\s*\([^)]+\)/.test(content) ||
            /const\s+\w+\s*=\s*\([^)]+\)\s*=>/.test(content);
          const isMemoized = /React\.memo|memo\(/.test(content);
          const hasStateOrHooks = /(useState|useEffect|useRef|useContext)/.test(
            content
          );

          return hasProps && !isMemoized && !hasStateOrHooks;
        },
        message:
          'Consider wrapping pure components with React.memo for better performance',
      },
      {
        name: 'Large bundle imports',
        category: 'performance',
        severity: 'warning',
        check: (content: string): boolean => {
          const largeLibraryImports = [
            /import\s+.*\s+from\s+['"`]lodash['"`]/,
            /import\s+.*\s+from\s+['"`]moment['"`]/,
            /import\s+.*\s+from\s+['"`]@mui\/icons-material['"`]/,
          ];

          return largeLibraryImports.some((regex) => regex.test(content));
        },
        message:
          'Consider using specific imports or lighter alternatives for large libraries',
      },
      {
        name: 'Avoid re-renders with object literals',
        category: 'performance',
        severity: 'warning',
        check: (content: string, filePath: string): boolean => {
          if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx'))
            return false;

          const objectLiteralInProps =
            /(?:style|className|data-\w+)\s*=\s*\{[^}]*\{[^}]*\}[^}]*\}/g;
          return objectLiteralInProps.test(content);
        },
        message:
          'Avoid passing object literals as props, use useMemo or move to constants',
      },
    ];
  }

  /**
   * Get accessibility rules
   */
  private getAccessibilityRules(): ValidationRule[] {
    return [
      {
        name: 'Button missing accessible name',
        category: 'accessibility',
        severity: 'error',
        check: (content: string): boolean => {
          const buttonRegex = /<button[^>]*>/gi;
          let match;
          while ((match = buttonRegex.exec(content)) !== null) {
            const button = match[0];
            if (
              !button.includes('aria-label=') &&
              !button.includes('aria-labelledby=')
            ) {
              // Check if button has text content by looking for closing tag
              const buttonStartIndex = match.index;
              const buttonEndIndex = content.indexOf(
                '</button>',
                buttonStartIndex
              );
              if (buttonEndIndex === -1) continue;

              const buttonContent = content
                .slice(buttonStartIndex + button.length, buttonEndIndex)
                .trim();
              if (!buttonContent) {
                return true;
              }
            }
          }
          return false;
        },
        message:
          'Buttons should have accessible names via text content, aria-label, or aria-labelledby',
      },
      {
        name: 'Form inputs missing labels',
        category: 'accessibility',
        severity: 'error',
        check: (content: string): boolean => {
          const inputRegex =
            /<input[^>]*type=['"`](?!hidden)[^'"`]*['"`][^>]*>/gi;
          let match;
          while ((match = inputRegex.exec(content)) !== null) {
            const input = match[0];
            if (
              !input.includes('aria-label=') &&
              !input.includes('aria-labelledby=') &&
              !input.includes('id=')
            ) {
              return true;
            }
          }
          return false;
        },
        message:
          'Form inputs should have associated labels or aria-label attributes',
      },
      {
        name: 'Links missing accessible names',
        category: 'accessibility',
        severity: 'warning',
        check: (content: string): boolean => {
          const linkRegex = /<a[^>]*href[^>]*>/gi;
          let match;
          while ((match = linkRegex.exec(content)) !== null) {
            const link = match[0];
            if (
              !link.includes('aria-label=') &&
              !link.includes('aria-labelledby=')
            ) {
              const linkStartIndex = match.index;
              const linkEndIndex = content.indexOf('</a>', linkStartIndex);
              if (linkEndIndex === -1) continue;

              const linkContent = content
                .slice(linkStartIndex + link.length, linkEndIndex)
                .trim();
              if (!linkContent || linkContent.length < 3) {
                return true;
              }
            }
          }
          return false;
        },
        message:
          'Links should have descriptive text content or aria-label attributes',
      },
      {
        name: 'Missing focus management',
        category: 'accessibility',
        severity: 'info',
        check: (content: string, filePath: string): boolean => {
          if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx'))
            return false;

          const hasModals = /modal|dialog|popup/i.test(content);
          const hasFocusManagement = /focus\(\)|autoFocus|tabIndex/.test(
            content
          );

          return hasModals && !hasFocusManagement;
        },
        message:
          'Components with modals or dynamic content should manage focus for accessibility',
      },
      {
        name: 'Color contrast considerations',
        category: 'accessibility',
        severity: 'info',
        check: (content: string): boolean => {
          const lowContrastColors = [
            /#[a-fA-F0-9]{6}.*#[a-fA-F0-9]{6}.*background.*color/,
            /color.*#ccc|#ddd|#eee/i,
            /background.*#999|#aaa|#bbb/i,
          ];

          return lowContrastColors.some((regex) => regex.test(content));
        },
        message:
          'Consider color contrast ratios for accessibility (WCAG AA: 4.5:1, AAA: 7:1)',
      },
    ];
  }

  /**
   * Helper method to check if a generic type parameter is invalid
   */
  private isInvalidGeneric(generic: string): boolean {
    const reservedKeywords = ['extends', 'keyof'];
    return (
      generic.length > 1 &&
      !/^[A-Z][A-Za-z]*$/.test(generic) &&
      !reservedKeywords.some((keyword) => generic.includes(keyword))
    );
  }
}
