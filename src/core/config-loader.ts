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
        rules: [...Object.values(defaultRules).flat(), ...customConfig.rules],
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
   * @returns Default configuration object
   */
  getDefaultConfig(): StandardsConfiguration {
    const defaultRules = this.getDefaultRules();

    return {
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
      merge: true,
    };
  }

  /**
   * Get all default rules organized by category
   * @returns Default rules structure
   */
  getDefaultRules(): DefaultRulesStructure {
    return {
      structure: this.getStructureRules(),
      naming: this.getNamingRules(),
      content: this.getContentRules(),
      style: this.getStyleRules(),
      documentation: this.getDocumentationRules(),
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

          return !fileName.startsWith(fileName[0]?.toUpperCase() ?? '');
        },
        message:
          'Component files should start with uppercase letter (PascalCase)',
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
}
