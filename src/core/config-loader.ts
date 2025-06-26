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
            !filePath.includes('/') || filePath.split('/').length <= 2;

          return (
            isRootFile &&
            requiredFolders.some((folder) => filePath.includes(folder))
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
    ];
  }

  /**
   * Get naming convention rules
   * @returns Naming rules
   */
  private getNamingRules(): ValidationRule[] {
    return [
      {
        name: 'Component naming',
        category: 'naming',
        severity: 'error',
        check: (_content: string, filePath: string): boolean => {
          const componentRegex = /\.(tsx|jsx)$/;
          if (
            !filePath.includes('/components/') ||
            !componentRegex.exec(filePath)
          ) {
            return false;
          }

          const fileName = path.basename(filePath, path.extname(filePath));
          if (!fileName || fileName.length === 0) return false;

          // For index files, check the parent directory name
          if (fileName === 'index') {
            const parentDir = path.basename(path.dirname(filePath));
            if (!parentDir || parentDir.length === 0) return false;
            // Check if parent directory starts with uppercase letter (PascalCase)
            const firstChar = parentDir.charAt(0);
            return firstChar !== firstChar.toUpperCase();
          }

          // For non-index files, check if filename starts with uppercase letter
          const firstChar = fileName.charAt(0);
          return firstChar !== firstChar.toUpperCase();
        },
        message:
          'Component files should start with uppercase letter (PascalCase). For index.tsx files, the parent directory should be PascalCase.',
      },
      {
        name: 'Hook naming',
        category: 'naming',
        severity: 'error',
        check: (_content: string, filePath: string): boolean => {
          if (!filePath.includes('.hook.')) {
            return false;
          }

          const fileName = path.basename(filePath, path.extname(filePath));
          const baseName = fileName.split('.')[0];
          if (!baseName) return false;

          return (
            !baseName.startsWith('use') ||
            !baseName.startsWith(
              baseName.slice(0, 3) + (baseName[3]?.toUpperCase() ?? '')
            )
          );
        },
        message: 'Hook files should follow "useHookName.hook.ts" pattern',
      },
      {
        name: 'Type naming',
        category: 'naming',
        severity: 'error',
        check: (_content: string, filePath: string): boolean => {
          if (!filePath.includes('/types/') || !filePath.endsWith('.type.ts')) {
            return false;
          }

          const fileName = path.basename(filePath, '.type.ts');
          if (!fileName || fileName.length === 0) return false;

          return fileName.startsWith(fileName[0]?.toUpperCase() ?? '');
        },
        message: 'Type files should be camelCase and end with .type.ts',
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
        check: (content: string): boolean => {
          const exportedFunctions =
            /export\s+(function|const\s+\w+\s*=\s*(async\s+)?function)/.test(
              content
            );
          const hasTSDoc =
            /\/\*\*[\s\S]*?@(param|returns|example)[\s\S]*?\*\//.test(content);

          return exportedFunctions && !hasTSDoc;
        },
        message:
          'Exported functions should have TSDoc comments with @param and @returns',
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
        name: 'Hook dependency completeness',
        category: 'react',
        severity: 'warning',
        check: (content: string): boolean => {
          // Enhanced check for missing dependencies in hooks
          const hookPatterns = [
            /useEffect\s*\(\s*[^,]+,\s*\[([^\]]*)\]/g,
            /useCallback\s*\(\s*[^,]+,\s*\[([^\]]*)\]/g,
            /useMemo\s*\(\s*[^,]+,\s*\[([^\]]*)\]/g,
          ];

          for (const pattern of hookPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
              const dependencyArray = match[1];
              // If dependency array is empty but function body likely uses external variables
              if (
                dependencyArray &&
                dependencyArray.trim() === '' &&
                match[0].length > 50
              ) {
                return true;
              }
            }
          }

          return false;
        },
        message:
          'Hook dependency array may be missing dependencies. Ensure all used variables are included.',
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
