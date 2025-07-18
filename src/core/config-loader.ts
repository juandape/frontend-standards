import fs from 'fs';
import path from 'path';
import type {
  IConfigLoader,
  ILogger,
  StandardsConfiguration,
  ConfigurationExport,
  DefaultRulesStructure,
  ValidationRule,
  RulesObjectFormat,
} from '../types.js';
import { isReactNativeProject } from '../utils/file-scanner.js';
import { checkInlineStyles } from './additional-validators.js';

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
    // Siempre resolver el path absoluto del config
    let configPath =
      customConfigPath ?? path.join(this.rootDir, this.configFileName);
    if (!path.isAbsolute(configPath)) {
      configPath = path.resolve(this.rootDir, configPath);
    }

    try {
      if (fs.existsSync(configPath)) {
        this.logger.info(`📋 Loading configuration from: ${configPath}`);
        let customConfig: ConfigurationExport | undefined;
        let importError: any = null;
        // Try ESM dynamic import first
        try {
          const configModule = await import(`${configPath}?t=${Date.now()}`);
          customConfig = (configModule as any)?.default ?? configModule;
        } catch (err) {
          importError = err;
          // Try CommonJS require as fallback
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const requiredConfig = require(configPath);
            customConfig = requiredConfig?.default ?? requiredConfig;
          } catch (requireErr) {
            const msg =
              `Failed to load config from ${configPath} with both import and require.\n` +
              `import error: ${
                importError instanceof Error
                  ? importError.message
                  : String(importError)
              }\n` +
              `require error: ${
                requireErr instanceof Error
                  ? requireErr.message
                  : String(requireErr)
              }`;
            this.logger.warn(msg);
            customConfig = undefined;
          }
        }
        if (customConfig) {
          return this.mergeWithDefaults(customConfig);
        }
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
      let finalRules: ValidationRule[];

      if (customConfig.rules && !Array.isArray(customConfig.rules)) {
        // Convert object format to array format
        finalRules = this.convertObjectRulesToArray(
          customConfig.rules,
          defaultRules
        );
      } else if (Array.isArray(customConfig.rules)) {
        finalRules = customConfig.rules;
      } else {
        finalRules = Object.values(defaultRules).flat();
      }

      return {
        ...defaultConfig,
        ...customConfig,
        rules: finalRules,
      };
    }

    return defaultConfig;
  }

  /**
   * Check if a file is a configuration file that should be excluded from validation
   * @param filePath The file path to check
   * @returns True if the file is a configuration file
   */
  private isConfigFile(filePath: string): boolean {
    const fileName = path.basename(filePath);

    // Common configuration file patterns
    const configPatterns = [
      /\.config\.(js|ts|mjs|cjs|json)$/,
      /^(jest|vite|webpack|tailwind|next|eslint|prettier|babel|rollup|tsconfig)\.config\./,
      /^(vitest|nuxt|quasar)\.config\./,
      /^tsconfig.*\.json$/,
      /^\.eslintrc/,
      /^\.prettierrc/,
      /^babel\.config/,
      /^postcss\.config/,
      /^stylelint\.config/,
      /^cypress\.config/,
      /^playwright\.config/,
      /^storybook\.config/,
      /^metro\.config/,
      /^expo\.config/,
    ];

    return configPatterns.some((pattern) => pattern.test(fileName));
  }

  /**
   * Get default configuration
   * @returns Default configuration
   */
  getDefaultConfig(): StandardsConfiguration {
    const defaultRules = this.getDefaultRules();

    return {
      merge: true,
      onlyChangedFiles: true, // Por defecto, solo revisar archivos en commit
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
          const fileName = path.basename(filePath);
          const fileDir = path.dirname(filePath);

          // Skip configuration files
          if (
            fileName.includes('.config.') ||
            fileName.startsWith('jest.config.') ||
            fileName.startsWith('vite.config.') ||
            fileName.startsWith('webpack.config.') ||
            fileName.startsWith('tailwind.config.') ||
            fileName.startsWith('next.config.') ||
            fileName.startsWith('tsconfig.') ||
            fileName.startsWith('eslint.config.') ||
            fileName.includes('test.config.') ||
            fileName.includes('spec.config.')
          ) {
            return false;
          }

          // Detect potential circular dependencies (improved: only if import points to this file itself)
          const imports =
            content.match(/import.*from\s+['"]([^'"]+)['"]/g) || [];
          return imports.some((imp) => {
            const importRegex = /from\s+['"]([^'"]+)['"]/;
            const importMatch = importRegex.exec(imp);
            if (importMatch?.[1]) {
              const importPath = importMatch[1];
              // Only check relative imports
              if (importPath.startsWith('./') || importPath.startsWith('../')) {
                // Resolve the import path relative to the current file
                const resolvedImport = path.resolve(fileDir, importPath);
                const resolvedImportNoExt = resolvedImport.replace(
                  /\.[^.]+$/,
                  ''
                );
                const filePathNoExt = filePath.replace(/\.[^.]+$/, '');
                // Only mark as circular if the import points to this file itself
                if (resolvedImportNoExt === filePathNoExt) {
                  return true;
                }
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
        severity: 'info', // Cambiado de 'warning' a 'info'
        check: (_content: string, filePath: string): boolean => {
          // Skip if this is already a test file
          if (
            filePath.includes('__test__') ||
            filePath.includes('.test.') ||
            filePath.includes('.spec.')
          ) {
            return false;
          }

          // Solo aplicar a componentes principales (no a todos los archivos)
          // Solo para archivos que terminen en Component.tsx o sean hooks principales
          if (
            !filePath.endsWith('Component.tsx') &&
            !filePath.endsWith('.hook.ts') &&
            !filePath.endsWith('.helper.ts') &&
            !(
              filePath.includes('/components/') &&
              filePath.endsWith('index.tsx')
            )
          ) {
            return false;
          }

          // Skip archivos de configuración, types, constants, etc.
          if (
            filePath.includes('/types/') ||
            filePath.includes('/constants/') ||
            filePath.includes('/enums/') ||
            filePath.includes('/config/') ||
            filePath.includes('/styles/') ||
            filePath.includes('layout.tsx') ||
            filePath.includes('page.tsx') ||
            filePath.includes('not-found.tsx') ||
            filePath.includes('global-error.tsx') ||
            filePath.includes('instrumentation.ts') ||
            filePath.includes('next.config.') ||
            filePath.includes('tailwind.config.') ||
            filePath.includes('jest.config.')
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
          'Important components and hooks should have corresponding test files',
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
      {
        name: 'Missing index.ts in organization folders',
        category: 'structure',
        severity: 'warning',
        check: (_content: string, filePath: string): boolean => {
          // Skip configuration files
          if (this.isConfigFile(filePath)) {
            return false;
          }

          // Check if this is a file in an organization folder
          const organizationFolders = [
            '/components/',
            '/types/',
            '/enums/',
            '/hooks/',
            '/constants/',
            '/styles/',
            '/helpers/',
            '/utils/',
            '/lib/',
          ];

          const isInOrganizationFolder = organizationFolders.some((folder) =>
            filePath.includes(folder)
          );

          if (!isInOrganizationFolder) {
            return false;
          }

          const fileName = path.basename(filePath);

          // Skip if this is already an index file
          if (fileName === 'index.ts' || fileName === 'index.tsx') {
            return false;
          }

          // Get the immediate parent directory of the file
          const parentDir = path.dirname(filePath);

          // Check if there's an index.ts or index.tsx in the same directory
          const indexTsPath = path.join(parentDir, 'index.ts');
          const indexTsxPath = path.join(parentDir, 'index.tsx');

          try {
            const fs = require('fs');
            const hasIndexTs = fs.existsSync(indexTsPath);
            const hasIndexTsx = fs.existsSync(indexTsxPath);

            return !hasIndexTs && !hasIndexTsx;
          } catch {
            return true;
          }
        },
        message:
          'Organization folders (components, types, hooks, constants, etc.) should have an index.ts file for exports',
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
          // Skip configuration files
          if (this.isConfigFile(filePath)) {
            return false;
          }

          const fileName = path.basename(filePath);
          const dirName = path.basename(path.dirname(filePath));

          // Skip hook files - they have their own naming rule
          if (fileName.includes('.hook.')) {
            return false;
          }

          // Skip files directly in /hooks/ directory (but not subdirectories like hooks/constants/)
          if (filePath.includes('/hooks/')) {
            const pathParts = filePath.split('/');
            const hooksIndex = pathParts.lastIndexOf('hooks');
            const afterHooksPath = pathParts.slice(hooksIndex + 1);

            // Only skip if it's directly in hooks folder (not in subdirectories)
            if (afterHooksPath.length === 1) {
              return false;
            }
          }

          // Skip helper files - they have their own naming rule
          if (filePath.includes('/helpers/') || fileName.includes('.helper.')) {
            return false;
          }

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
          // Skip configuration files
          if (this.isConfigFile(filePath)) {
            return false;
          }

          const fileName = path.basename(filePath);

          // Allow index.ts/index.tsx files in hooks directories (used for exporting hooks)
          if (fileName === 'index.ts' || fileName === 'index.tsx') {
            return false;
          }

          // Hook files should follow useHookName.hook.ts pattern (PascalCase)
          if (fileName.includes('.hook.')) {
            const hookPattern = /^use[A-Z][a-zA-Z0-9]*\.hook\.(ts|tsx)$/;
            if (!hookPattern.test(fileName)) {
              return true;
            }
          }

          // Files directly in /hooks/ directory should be hooks (not in subdirectories like constants, types, etc.)
          if (filePath.includes('/hooks/') && !fileName.includes('.hook.')) {
            // Skip if this is in a subdirectory of hooks (like hooks/constants/, hooks/types/, etc.)
            const pathParts = filePath.split('/');
            const hooksIndex = pathParts.lastIndexOf('hooks');
            const afterHooksPath = pathParts.slice(hooksIndex + 1);

            // If there are more than 1 path segments after 'hooks', it's in a subdirectory
            if (afterHooksPath.length > 1) {
              return false; // Skip files in subdirectories
            }

            // Files directly in hooks folder should follow hook naming
            const hookPattern = /^use[A-Z][a-zA-Z0-9]*\.hook\.(ts|tsx)$/;
            if (!hookPattern.test(fileName)) {
              return true;
            }
          }

          return false;
        },
        message:
          'Hook files should follow "useHookName.hook.ts" pattern with PascalCase (e.g., useFormInputPassword.hook.tsx, useApiData.hook.ts)',
      },
      {
        name: 'Type naming',
        category: 'naming',
        severity: 'error',
        check: (_content: string, filePath: string): boolean => {
          // Skip configuration files
          if (this.isConfigFile(filePath)) {
            return false;
          }

          const fileName = path.basename(filePath);

          // Allow index.ts/index.tsx files in types directories (used for exporting types)
          if (fileName === 'index.ts' || fileName === 'index.tsx') {
            return false;
          }

          // Type files should be camelCase and end with .type.ts or .types.ts
          if (
            filePath.includes('/types/') ||
            fileName.endsWith('.type.ts') ||
            fileName.endsWith('.types.ts')
          ) {
            const typePattern =
              /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)*\.types?\.ts$/;
            if (!typePattern.test(fileName)) {
              return true;
            }
          }

          return false;
        },
        message:
          'Type files should be camelCase and end with .type.ts (index.ts files are allowed for exports)',
      },
      {
        name: 'Constants naming',
        category: 'naming',
        severity: 'info',
        check: (_content: string, filePath: string): boolean => {
          const fileName = path.basename(filePath);

          // Skip index files
          if (fileName === 'index.ts') {
            return false;
          }

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

          // Skip index files
          if (fileName === 'index.ts' || fileName === 'index.tsx') {
            return false;
          }

          // Helper files should be camelCase and end with .helper.ts or .helper.tsx
          if (
            filePath.includes('/helpers/') ||
            fileName.endsWith('.helper.ts') ||
            fileName.endsWith('.helper.tsx')
          ) {
            const helperPattern = /^[a-z][a-zA-Z0-9]*\.helper\.(ts|tsx)$/;
            if (!helperPattern.test(fileName)) {
              return true;
            }
          }

          return false;
        },
        message:
          'Helper files should be camelCase and end with .helper.ts or .helper.tsx',
      },
      {
        name: 'Style naming',
        category: 'naming',
        severity: 'error',
        check: (_content: string, filePath: string): boolean => {
          const fileName = path.basename(filePath);

          // Skip index files - they are organization files, not style files
          if (fileName === 'index.ts' || fileName === 'index.tsx') {
            return false;
          }

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
        name: 'Folder naming convention',
        category: 'naming',
        severity: 'error',
        check: (_content: string, filePath: string): boolean => {
          // Skip configuration files
          if (this.isConfigFile(filePath)) {
            return false;
          }

          // Check for incorrect singular folder names
          const incorrectFolders = [
            '/helper/',
            '/hook/',
            '/type/',
            '/constant/',
            '/enum/',
          ];
          return incorrectFolders.some((folder) => filePath.includes(folder));
        },
        message:
          'Use plural folder names: helpers, hooks, types, constants, enums (not singular)',
      },
      {
        name: 'Directory naming convention',
        category: 'naming',
        severity: 'info',
        check: (_content: string, filePath: string): boolean => {
          // Skip configuration files
          if (this.isConfigFile(filePath)) {
            return false;
          }

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
                'config',
                'context',
                'i18n',
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

            // Skip common framework patterns
            if (
              (dirName.startsWith('(') && dirName.endsWith(')')) || // Next.js route groups
              (dirName.startsWith('[') && dirName.endsWith(']')) || // Next.js dynamic routes
              (dirName.includes('-') && pathParts.includes('app')) // kebab-case in app router
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
        severity: 'error',
        check: (content: string): boolean => {
          // Check for interface declarations that don't start with I
          const interfaceRegex = /interface\s+([A-Z][a-zA-Z0-9]*)/g;
          let match;

          while ((match = interfaceRegex.exec(content)) !== null) {
            const interfaceName = match[1];
            if (!interfaceName) continue;

            // Interface must start with "I" followed by PascalCase
            if (
              !interfaceName.startsWith('I') ||
              !/^I[A-Z][a-zA-Z0-9]*$/.test(interfaceName)
            ) {
              return true;
            }
          }

          return false;
        },
        message:
          'Interfaces must be prefixed with "I" followed by PascalCase (e.g., IGlobalStateHashProviderProps)',
      },
    ];
  }

  /**
   * Get content validation rules
   * @returns Content rules
   */
  private getContentRules(): ValidationRule[] {
    // Robust circular dependency detection using a dependency graph (in-memory, per run)
    // This is a simplified version, not as powerful as madge, but avoids false positives and detects real cycles
    // Use a module-level cache to avoid rebuilding the graph for every file
    let dependencyGraph: Record<string, Set<string>> = {};
    let graphBuiltFor: string | null = null;
    // Use the top-level fs and path imports for ESM compatibility

    function buildDependencyGraph(
      filePath: string,
      extensions: string[]
    ): void {
      const visitedFiles: Set<string> = new Set();
      dependencyGraph = {};
      function visit(f: string) {
        if (visitedFiles.has(f)) return;
        visitedFiles.add(f);
        let content = '';
        try {
          content = fs.readFileSync(f, 'utf8');
        } catch {
          return;
        }
        const fileDir = path.dirname(f);
        const imports =
          content.match(/import.*from\s+['"]([^'\"]+)['"]/g) || [];
        for (const imp of imports) {
          const importRegex = /from\s+['"]([^'\"]+)['"]/;
          const importMatch = importRegex.exec(imp);
          if (importMatch?.[1]) {
            const importPath = importMatch[1];
            if (importPath.startsWith('./') || importPath.startsWith('../')) {
              let resolvedImport = path.resolve(fileDir, importPath);
              // Try all extensions
              let found = false;
              for (const ext of extensions) {
                if (fs.existsSync(resolvedImport + ext)) {
                  resolvedImport = resolvedImport + ext;
                  found = true;
                  break;
                }
              }
              if (!found && fs.existsSync(resolvedImport)) {
                found = true;
              }
              if (found) {
                if (!dependencyGraph[f]) dependencyGraph[f] = new Set();
                dependencyGraph[f].add(resolvedImport);
                visit(resolvedImport);
              }
            }
          }
        }
      }
      visit(filePath);
    }

    function hasCircularDependency(
      startFile: string,
      currentFile: string,
      visited: Set<string>
    ): boolean {
      if (!dependencyGraph[currentFile]) return false;
      for (const dep of dependencyGraph[currentFile]) {
        if (dep === startFile) return true;
        if (!visited.has(dep)) {
          visited.add(dep);
          if (hasCircularDependency(startFile, dep, visited)) return true;
        }
      }
      return false;
    }

    return [
      {
        name: 'No circular dependencies',
        category: 'content',
        severity: 'error',
        check: (_content: string, filePath: string): boolean => {
          const extensions = ['.js', '.ts', '.jsx', '.tsx'];
          // Only rebuild the graph if for a new root file
          if (graphBuiltFor !== filePath) {
            buildDependencyGraph(filePath, extensions);
            graphBuiltFor = filePath;
          }
          return hasCircularDependency(filePath, filePath, new Set([filePath]));
        },
        message:
          'Potential circular dependency detected. Refactor to avoid circular imports (direct or indirect).',
      },
      {
        name: 'No console.log',
        category: 'content',
        severity: 'error',
        check: (content: string, filePath: string): boolean => {
          // Si es React Native, aplicar la regla (excepto debug/dev/tests)
          if (isReactNativeProject(filePath)) {
            if (
              filePath.includes('debug') ||
              filePath.includes('dev') ||
              filePath.includes('__tests__')
            ) {
              return false;
            }
            return content.includes('console.log');
          }
          // Para otros proyectos, mantener la lógica actual
          if (
            filePath.includes('debug') ||
            filePath.includes('dev') ||
            filePath.includes('__tests__')
          ) {
            return false;
          }
          const lines = content.split('\n');
          let inJSDoc = false;
          let inMultiLineComment = false;
          for (const line of lines) {
            // Track JSDoc comment state
            if (/^\s*\/\*\*/.test(line)) {
              inJSDoc = true;
              continue;
            }
            if (inJSDoc && /\*\//.test(line)) {
              inJSDoc = false;
              continue;
            }

            // Track multi-line comment state
            if (/^\s*\/\*/.test(line) && !/^\s*\/\*\*/.test(line)) {
              inMultiLineComment = true;
              continue;
            }
            if (inMultiLineComment && /\*\//.test(line)) {
              inMultiLineComment = false;
              continue;
            }

            // Skip if we're inside any comment block
            if (inJSDoc || inMultiLineComment || /^\s*\*/.test(line)) {
              continue;
            }

            // Skip single-line comments
            if (/^\s*\/\//.test(line)) {
              continue;
            }

            // Now check for console statements in actual code
            if (/console\.(log|warn|error|info|debug)/.test(line)) {
              return true;
            }
          }
          return false;
        },
        message: 'Remove console statements before committing to production',
      },
      {
        name: 'No inline styles',
        category: 'content',
        severity: 'error',
        check: (content: string, filePath: string): boolean => {
          const errors = checkInlineStyles(content, filePath);
          return errors.length > 0;
        },
        message: 'Avoid inline styles, use CSS classes or styled components',
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
        name: 'No any type',
        category: 'typescript',
        severity: 'error',
        check: (content: string, filePath: string): boolean => {
          // Skip configuration files
          if (this.isConfigFile(filePath)) {
            return false;
          }

          // Skip type declaration files
          if (content.includes('declare')) return false;

          // Allow 'any' in props/interfaces for icon/component props (common in React Native)
          if (
            /icon\s*:\s*any|Icon\s*:\s*any|component\s*:\s*any/.test(content)
          ) {
            return false;
          }

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
          // Skip configuration files
          if (this.isConfigFile(filePath)) {
            return false;
          }

          // Skip setup and test files
          const isSetupFile =
            /(setup|mock|__tests__|\.test\.|\.spec\.|instrumentation|sentry)/.test(
              filePath
            );
          if (isSetupFile) {
            return false;
          }

          // Detect if this is a React Native project
          const isRNProject = isReactNativeProject(filePath);

          // For React Native projects, be more permissive with SVG components
          if (isRNProject) {
            // Skip SVG components that often have legitimate xmlns URLs
            if (
              filePath.includes('/assets/') ||
              filePath.includes('/Svg/') ||
              filePath.includes('.svg')
            ) {
              return false;
            }
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
        name: 'GitFlow branch naming convention',
        category: 'structure',
        severity: 'info',
        check: (_content: string, _filePath: string): boolean => {
          // This rule provides guidance for GitFlow compliance
          // Cannot be automatically validated from file content alone
          return false; // Always passes, serves as documentation
        },
        message:
          'Ensure branch follows GitFlow convention: type/Squad-HU (e.g., feature/Dash-EFI-101, fix/Team-BUG-123)',
      },
      {
        name: 'No merge conflicts markers',
        category: 'content',
        severity: 'error',
        check: (content: string): boolean => {
          // Check for Git merge conflict markers
          const conflictMarkers = [
            '<<<<<<< HEAD',
            '=======',
            '>>>>>>> ',
            '<<<<<<< ',
          ];

          return conflictMarkers.some((marker) => content.includes(marker));
        },
        message:
          'Git merge conflict markers found. Resolve all conflicts before committing.',
      },
      {
        name: 'No committed credentials',
        category: 'content',
        severity: 'error',
        check: (content: string, filePath: string): boolean => {
          // Skip configuration files
          if (this.isConfigFile(filePath)) {
            return false;
          }

          // Skip environment files that might legitimately contain environment variables
          if (/(env|\.env)/.test(filePath)) {
            return false;
          }

          // Check for potential credentials or sensitive data
          const credentialPatterns = [
            /password\s*[:=]\s*['"][^'"]{6,}['"]/i,
            /secret\s*[:=]\s*['"][^'"]{10,}['"]/i,
            /token\s*[:=]\s*['"][^'"]{20,}['"]/i,
            /api[_-]?key\s*[:=]\s*['"][^'"]{15,}['"]/i,
            /private[_-]?key\s*[:=]\s*['"][^'"]{50,}['"]/i,
          ];

          return credentialPatterns.some((pattern) => pattern.test(content));
        },
        message:
          'Potential credentials or sensitive data detected. Use environment variables instead.',
      },
      {
        name: 'Environment-specific configuration',
        category: 'structure',
        severity: 'warning',
        check: (content: string, filePath: string): boolean => {
          // Check if environment-specific logic is properly handled
          if (filePath.includes('config') || filePath.includes('env')) {
            // Should use proper environment variable checks
            const hasEnvironmentLogic =
              /process\.env|NODE_ENV|NEXT_PUBLIC_/.test(content);
            const hasHardcodedEnvironment =
              /['"]production['"]|['"]development['"]|['"]staging['"]/.test(
                content
              );

            // Warn if hardcoded environment values are found without proper env checks
            return hasHardcodedEnvironment && !hasEnvironmentLogic;
          }

          return false;
        },
        message:
          'Use environment variables instead of hardcoded environment strings for better deployment flexibility.',
      },
      {
        name: 'Proper release versioning',
        category: 'structure',
        severity: 'info',
        check: (content: string, filePath: string): boolean => {
          // Check package.json for proper versioning
          if (filePath.endsWith('package.json')) {
            try {
              const packageData = JSON.parse(content);
              const version = packageData.version;

              // Version should follow semantic versioning
              if (version && !/^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/.test(version)) {
                return true;
              }
            } catch {
              return false;
            }
          }

          return false;
        },
        message:
          'Package version should follow semantic versioning (e.g., 1.5.11, 2.0.0-beta)',
      },
      {
        name: 'Platform-specific code organization',
        category: 'structure',
        severity: 'warning',
        check: (content: string, filePath: string): boolean => {
          // Check for platform-specific imports that should be organized properly
          const hasWebSpecific = /react-dom|next\/|dom\//.test(content);
          const hasNativeSpecific =
            /react-native|@react-native|\.native\./.test(content);

          // If both web and native imports are in the same file, suggest separation
          if (hasWebSpecific && hasNativeSpecific) {
            return true;
          }

          // Check for platform files (.web.tsx, .native.tsx)
          if (
            (filePath.includes('.web.') || filePath.includes('.native.')) &&
            hasWebSpecific &&
            hasNativeSpecific
          ) {
            return true;
          }

          return false;
        },
        message:
          'Platform-specific code should be separated. Use .web.tsx and .native.tsx extensions for platform-specific implementations.',
      },
      {
        name: 'Sync branch validation',
        category: 'structure',
        severity: 'info',
        check: (_content: string, _filePath: string): boolean => {
          // This rule provides guidance based on GitFlow diagrams
          return false; // Always passes, serves as documentation
        },
        message:
          'After production deployment, ensure sync branches are created to update other environments as shown in GitFlow.',
      },
    ];
  }

  /**
   * Convert object format rules to ValidationRule array
   */
  private convertObjectRulesToArray(
    rulesObject: RulesObjectFormat,
    defaultRules: DefaultRulesStructure
  ): ValidationRule[] {
    const allDefaultRules = Object.values(defaultRules).flat();
    const validationRules: ValidationRule[] = [];

    for (const [ruleName, ruleValue] of Object.entries(rulesObject)) {
      const defaultRule = allDefaultRules.find(
        (rule) => rule.name === ruleName
      );

      if (defaultRule) {
        // Use the default rule as base
        if (ruleValue === true) {
          validationRules.push(defaultRule);
        } else if (
          ruleValue === 'error' ||
          ruleValue === 'warning' ||
          ruleValue === 'info'
        ) {
          validationRules.push({
            ...defaultRule,
            severity: ruleValue,
          });
        }
      } else {
        this.logger.warn(`Unknown rule: ${ruleName}`);
      }
    }

    return validationRules;
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
        severity: 'info',
        check: (content: string, filePath: string): boolean => {
          // Skip config files, test files, and setup files
          if (
            /(config|setup|mock|__tests__|\.test\.|\.spec\.|jest\.|tailwind\.|sentry)/.test(
              filePath
            )
          ) {
            return false;
          }

          // Only check for VERY complex functions (500+ characters instead of 150-200)
          const complexFunctionPatterns = [
            /function\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)\s*\{[\s\S]{500,}?\}/g, // Very substantial functions only
            /(export\s+)?(const|function)\s+[a-zA-Z_$][a-zA-Z0-9_$]*.*=.*\([^)]*\)\s*=>\s*\{[\s\S]{400,}?\}/g, // Very substantial arrow functions
          ];

          for (const pattern of complexFunctionPatterns) {
            const matches = Array.from(content.matchAll(pattern));
            for (const match of matches) {
              const beforeFunction = content.substring(0, match.index || 0);
              const lastLines = beforeFunction
                .split('\n')
                .slice(-15) // Buscar más líneas hacia atrás
                .join('\n');

              // Mejorar la detección de JSDoc: buscar /** seguido de */ y luego espacios/newlines
              if (!/\/\*\*[\s\S]*?\*\/\s*(\n\s*)*$/.test(lastLines)) {
                return true;
              }
            }
          }

          return false;
        },
        message:
          'Very complex functions (500+ chars) should have JSDoc comments explaining their behavior',
      },
      {
        name: 'English-only comments',
        category: 'documentation',
        severity: 'error',
        check: (content: string): boolean => {
          // Extraer todos los comentarios (tanto de línea como de bloque)
          const singleLineComments = content.match(/\/\/.*$/gm) || [];
          const blockComments = content.match(/\/\*[\s\S]*?\*\//g) || [];
          const jsdocComments = content.match(/\/\*\*[\s\S]*?\*\//g) || [];

          // Combinar todos los comentarios
          const allComments = [
            ...singleLineComments,
            ...blockComments,
            ...jsdocComments,
          ];

          if (allComments.length === 0) {
            return false; // No hay comentarios que revisar
          }

          // Lista de palabras comunes en español que no deberían estar en comentarios en inglés
          const spanishWords = [
            'de',
            'la',
            'el',
            'en',
            'para',
            'con',
            'por',
            'si',
            'esta',
            'este',
            'estos',
            'estas',
            'ese',
            'esa',
            'esos',
            'esas',
            'como',
            'pero',
            'porque',
            'cuando',
            'donde',
            'cual',
            'que',
            'quien',
            'cuyo',
            'cuya',
            'función',
            'método',
            'clase',
            'esto',
            'aquí',
            'ahí',
            'así',
            'según',
            'cada',
            'todo',
            'todos',
            'algunas',
            'algunos',
            'mientras',
            'aunque',
            'desde',
            'hasta',
            'durante',
            'después',
            'antes',
            'sobre',
            'entre',
            'sin',
            'contra',
            'hacia',
            'excepto',
            'mediante',
            'acerca',
            'además',
            'luego',
            'entonces',
            'sino',
            'también',
            'tampoco',
            'pues',
            'ya',
            'solo',
            'solamente',
            'aún',
            'todavía',
            'siempre',
            'nunca',
            'jamás',
            'ahora',
            'después',
            'antes',
            'pronto',
            'tarde',
            'temprano',
            'demasiado',
            'muy',
            'mucho',
            'poco',
            'bastante',
            'más',
            'menos',
            'tan',
            'tanto',
            'algún',
            'alguno',
            'ningún',
            'ninguno',
            'otro',
            'cualquier',
            'cualquiera',
            'quienquiera',
            'dondequiera',
            'comoquiera',
            'cuandoquiera',
          ];

          // Palabras técnicas que pueden parecer españolas pero son válidas en código
          const validTechTerms = [
            'constructor',
            'static',
            'public',
            'private',
            'protected',
            'interface',
            'extends',
            'implements',
            'abstract',
            'readonly',
            'const',
            'enum',
            'union',
            'import',
            'export',
            'async',
            'await',
            'class',
            'super',
            'null',
            'undefined',
            'component',
            'props',
            'state',
            'render',
            'context',
            'provider',
            'consumer',
            'store',
            'action',
            'reducer',
            'dispatch',
            'selector',
            'saga',
            'effect',
            'query',
            'mutation',
            'subscription',
            'apollo',
            'graphql',
          ];

          // Regex para encontrar palabras completas (no partes de palabras)
          const wordBoundaryPattern = (word: string) =>
            new RegExp(`\\b${word}\\b`, 'i');

          // Verificar cada comentario por palabras en español
          return allComments.some((comment) => {
            // Ignorar URLs, imports/exports y partes de código
            const cleanComment = comment
              .replace(/https?:\/\/[^\s)]+/g, '') // URLs
              .replace(/import\s+.*from\s+['"][^'"]+['"]/g, '') // imports
              .replace(/export\s+.*from\s+['"][^'"]+['"]/g, '') // exports
              .replace(/(['"])(?:(?=(\\?))\2.)*?\1/g, ''); // strings

            // Revisar por palabras en español
            return spanishWords.some((word) => {
              const pattern = wordBoundaryPattern(word);
              // Evitar falsos positivos con términos técnicos válidos
              if (pattern.test(cleanComment)) {
                // Si encuentra una palabra española, verificar que no sea un término técnico válido
                return !validTechTerms.some((term) =>
                  cleanComment.includes(term)
                );
              }
              return false;
            });
          });
        },
        message:
          'Comments and JSDoc must be written in English only. Avoid using Spanish or other non-English languages in comments.',
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
          // Look for interface declarations that define actual union types
          // Not just properties that happen to have union types
          const interfaceDeclarationRegex = /interface\s+\w+[^{]*\{([^}]*)\}/g;
          let match;

          while ((match = interfaceDeclarationRegex.exec(content)) !== null) {
            const interfaceBody = match[1];

            if (!interfaceBody) continue;

            // Check if the interface itself is defining union alternatives
            // Look for patterns like: { prop1: type1 } | { prop2: type2 }
            // This is different from properties having union types
            const linesInInterface = interfaceBody.split('\n');
            const hasUnionAlternatives = linesInInterface.some((line) => {
              const trimmed = line.trim();
              // Look for lines that suggest union alternatives (not just union property types)
              return (
                trimmed.includes('|') &&
                !trimmed.includes(':') &&
                trimmed.length > 5
              );
            });

            if (hasUnionAlternatives) {
              return true;
            }
          }

          return false;
        },
        message:
          'Use "type" instead of "interface" for union types (union alternatives, not union properties)',
      },
      {
        name: 'Explicit return types for functions',
        category: 'typescript',
        severity: 'info',
        check: (content: string, filePath: string): boolean => {
          if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx'))
            return false;

          // Skip config files, test files, and simple files
          if (
            /(config|setup|mock|__tests__|\.test\.|\.spec\.|jest\.|tailwind\.|sentry)/.test(
              filePath
            )
          ) {
            return false;
          }

          // Only check public API functions (exported functions), not internal ones
          const exportedFunctions = content.match(
            /export\s+(async\s+)?function\s+\w+\s*\([^)]*\)\s*(?!:)/g
          );

          return Boolean(exportedFunctions?.length);
        },
        message:
          'Public API functions should have explicit return type annotations for better documentation',
      },
      {
        name: 'Proper generic naming',
        category: 'typescript',
        severity: 'info', // Cambiado de 'warning' a 'info'
        check: (content: string): boolean => {
          const genericMatches = content.match(/<([^>]+)>/g);
          if (!genericMatches) return false;

          // Solo verificar generics muy obvios como <a>, <b>, <x>
          const invalidGenerics = genericMatches.some((match) => {
            const generics = match
              .slice(1, -1)
              .split(',')
              .map((g) => g.trim());
            return generics.some((g) => {
              // Solo marcar como inválido si es una sola letra minúscula sin contexto
              return (
                /^[a-z]$/.test(g) && !['T', 'K', 'V', 'P', 'R'].includes(g)
              );
            });
          });

          return invalidGenerics;
        },
        message: 'Consider using more descriptive generic type parameter names',
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
          if (!filePath.includes('/app/') || filePath.includes('/api/')) {
            return false;
          }

          const pathParts = filePath.split('/');
          const appIndex = pathParts.indexOf('app');
          const fileName = pathParts[pathParts.length - 1];

          // Ensure fileName exists
          if (!fileName) {
            return false;
          }

          // Skip index files - they are organization files, not route files
          if (/^index\.(tsx?|jsx?)$/.test(fileName)) {
            return false;
          }

          // Only check if this is a Next.js route file (page, layout, loading, etc.)
          const isNextJSRouteFile =
            /^(page|layout|loading|error|not-found|template|default|global-error)\.(tsx?|jsx?)$/.test(
              fileName
            );

          if (
            appIndex < 0 ||
            appIndex >= pathParts.length - 1 ||
            !isNextJSRouteFile
          ) {
            return false;
          }

          // Check route segments (directories between app/ and file)
          for (let i = appIndex + 1; i < pathParts.length - 1; i++) {
            const segment = pathParts[i];

            // Skip empty segments and special Next.js directories
            if (
              !segment ||
              segment.startsWith('(') ||
              segment.startsWith('[') ||
              segment.startsWith('_') ||
              segment === 'api' ||
              segment === 'components' ||
              segment === 'hooks' ||
              segment === 'types' ||
              segment === 'utils' ||
              segment === 'lib' ||
              segment === 'constants' ||
              segment === 'helpers' ||
              segment === 'styles' ||
              segment === 'context'
            ) {
              continue;
            }

            // Route segments should be kebab-case
            if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(segment)) {
              return true;
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
        name: 'Direct imports for sibling files',
        category: 'imports',
        severity: 'error',
        check: (content: string, filePath: string): boolean => {
          // Skip if this is an index file
          if (
            path.basename(filePath) === 'index.ts' ||
            path.basename(filePath) === 'index.tsx' ||
            path.basename(filePath) === 'index.js' ||
            path.basename(filePath) === 'index.jsx'
          ) {
            return false;
          }

          const currentDir = path.dirname(filePath);
          const fileName = path.basename(filePath);

          // Get all imports from current file
          const importRegex =
            /import\s+(?:(?:{[^}]*})|(?:[\w*]+))\s+from\s+['"`]([^'"`]+)['"`]/g;
          let match;
          let foundViolation = false;

          // Variables for storing detected violation details for better error messages
          let detectedSymbol = '';
          let detectedFile = '';

          while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];

            // Only check relative imports that go through index
            if (importPath === './' || importPath === '.') {
              try {
                const fs = require('fs');

                // Find the index file in the current directory
                let indexContent = '';

                for (const ext of ['ts', 'tsx', 'js', 'jsx']) {
                  const testPath = path.join(currentDir, `index.${ext}`);
                  if (fs.existsSync(testPath)) {
                    indexContent = fs.readFileSync(testPath, 'utf8');
                    break;
                  }
                }

                if (indexContent) {
                  // Extract the imported symbol names
                  const importedSymbols: string[] = [];
                  const symbolsMatch = match[0].match(
                    /import\s+(?:{([^}]*)}|(\w+))/
                  );

                  if (symbolsMatch) {
                    if (symbolsMatch[1]) {
                      // Named imports in curly braces
                      importedSymbols.push(
                        ...symbolsMatch[1].split(',').map((s) => s.trim())
                      );
                    } else if (symbolsMatch[2]) {
                      // Default import
                      importedSymbols.push(symbolsMatch[2]);
                    }
                  }

                  // Look for the imported symbols in the index exports
                  const dirFiles = fs.readdirSync(currentDir);

                  for (const dirFile of dirFiles) {
                    // Skip index files and current file
                    if (dirFile.startsWith('index.') || dirFile === fileName) {
                      continue;
                    }

                    const dirFileWithoutExt = dirFile.replace(
                      /\.(ts|tsx|js|jsx)$/,
                      ''
                    );

                    // Check if the file is exported in index
                    const exportPatterns = [
                      `export * from './${dirFileWithoutExt}'`,
                      `export * from "./${dirFileWithoutExt}"`,
                      `export { default } from './${dirFileWithoutExt}'`,
                      `export { default } from "./${dirFileWithoutExt}"`,
                      `export { default as ${dirFileWithoutExt} }`,
                      `export * as ${dirFileWithoutExt}`,
                    ];

                    // Check for named exports as well
                    const namedExportMatches = indexContent.match(
                      new RegExp(
                        `export\\s+{([^}]*)}\\s+from\\s+['"]\\.\/${dirFileWithoutExt}['"]`,
                        'g'
                      )
                    );

                    if (namedExportMatches) {
                      for (const namedExport of namedExportMatches) {
                        exportPatterns.push(namedExport);
                      }
                    }

                    const isExported = exportPatterns.some((pattern) =>
                      indexContent.includes(pattern)
                    );

                    if (isExported) {
                      // Check if any of the imported symbols come from this file
                      for (const symbol of importedSymbols) {
                        // For default exports
                        if (
                          symbol === dirFileWithoutExt ||
                          indexContent.includes(
                            `export { default as ${symbol} } from './${dirFileWithoutExt}'`
                          ) ||
                          indexContent.includes(
                            `export { default as ${symbol} } from "./${dirFileWithoutExt}"`
                          )
                        ) {
                          foundViolation = true;
                          detectedSymbol = symbol;
                          detectedFile = dirFileWithoutExt;
                          break;
                        }

                        // For named exports
                        if (
                          indexContent.includes(
                            `export { ${symbol} } from './${dirFileWithoutExt}'`
                          ) ||
                          indexContent.includes(
                            `export { ${symbol} } from "./${dirFileWithoutExt}"`
                          ) ||
                          namedExportMatches?.some((exp) =>
                            exp.includes(symbol)
                          )
                        ) {
                          foundViolation = true;
                          detectedSymbol = symbol;
                          detectedFile = dirFileWithoutExt;
                          break;
                        }
                      }

                      if (foundViolation) {
                        // Use the detected symbol and file in the error message
                        if (detectedSymbol && detectedFile) {
                          return true;
                        }
                        break;
                      }
                    }
                  }
                }
              } catch (error) {
                // Ignore file system errors
                return false;
              }
            }
          }

          return foundViolation;
        },
        message: `Archivos al mismo nivel deben importarse directamente, no a través del index. Reemplace import { Component } from "." con import { Component } from "./component"`,
      },
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
      {
        name: 'No unused imports',
        category: 'imports',
        severity: 'warning',
        check: (content: string): boolean => {
          return this.hasUnusedImports(content);
        },
        message:
          'Remove unused imports to keep the code clean and reduce bundle size',
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
   * Check if content has unused imports
   */
  private hasUnusedImports(content: string): boolean {
    const lines = content.split('\n');
    const importLines = lines.filter((line) =>
      line.trim().startsWith('import')
    );

    for (const importLine of importLines) {
      if (this.isUnusedImportLine(importLine, content)) {
        return true;
      }
    }

    return false;
  }
  /**
   * Check if a specific import line contains unused imports
   */
  private isUnusedImportLine(importLine: string, content: string): boolean {
    // Skip type-only imports as they might be used in type annotations
    if (importLine.includes('import type')) return false;

    // Skip side-effect imports (imports without 'from')
    if (!importLine.includes(' from ')) return false;

    // Skip common framework imports that are often used implicitly
    if (this.isFrameworkImport(importLine)) return false;

    const importedNames = this.extractImportedNames(importLine);
    return this.hasAnyUnusedName(importedNames, content);
  }

  /**
   * Check if import is a common framework import that might be used implicitly
   */
  private isFrameworkImport(importLine: string): boolean {
    const frameworkPatterns = [
      /import\s+React\s+from\s+['"]react['"]/,
      /import.*from\s+['"]next\//,
      /import.*from\s+['"]@next\//,
    ];

    return frameworkPatterns.some((pattern) => pattern.test(importLine));
  }

  /**
   * Extract imported names from an import line
   */
  private extractImportedNames(importLine: string): string[] {
    const importRegex = /import\s+(.+?)\s+from/;
    const importMatch = importRegex.exec(importLine);
    if (!importMatch?.[1]) return [];

    const importPart = importMatch[1].trim();
    let importedNames: string[] = [];

    // Handle namespace imports: import * as React from 'react'
    if (importPart.includes(' as ')) {
      const namespaceRegex = /\*\s+as\s+(\w+)/;
      const namespaceMatch = namespaceRegex.exec(importPart);
      if (namespaceMatch?.[1]) {
        importedNames = [namespaceMatch[1]];
      }
    }
    // Handle default imports: import React from 'react'
    else if (!importPart.includes('{') && !importPart.includes(',')) {
      importedNames = [importPart.trim()];
    }
    // Handle named imports: import { useState, useEffect } from 'react'
    else if (importPart.includes('{')) {
      const namedImportsRegex = /\{([^}]+)\}/;
      const namedImportsMatch = namedImportsRegex.exec(importPart);
      if (namedImportsMatch?.[1]) {
        importedNames = namedImportsMatch[1].split(',').map((name) => {
          // Remove 'type' keyword and 'as alias' parts
          return name
            .trim()
            .replace(/^type\s+/, '')
            .replace(/\s+as\s+\w+/, '');
        });
      }

      // Handle default + named: import React, { useState } from 'react'
      const defaultRegex = /^(\w+)\s*,/;
      const defaultMatch = defaultRegex.exec(importPart);
      if (defaultMatch?.[1]) {
        importedNames.unshift(defaultMatch[1].trim());
      }
    }

    return importedNames.filter((name) => name.length > 0);
  }

  /**
   * Check if any of the imported names are unused
   */
  private hasAnyUnusedName(importedNames: string[], content: string): boolean {
    for (const importedName of importedNames) {
      if (this.isNameUnused(importedName, content)) {
        return true;
      }
    }
    return false;
  }
  /**
   * Check if a specific imported name is unused
   */
  private isNameUnused(importedName: string, content: string): boolean {
    // Create regex to find usage of the imported name
    // Include word boundaries and handle type usage in generics
    const usageRegex = new RegExp(`\\b${importedName}\\b`, 'g');
    let usageCount = 0;

    // Remove import statements from content for usage counting
    // Handle both single-line and multi-line imports
    const contentWithoutImports = content.replace(/import\s+[^;]+;?/g, '');

    while (usageRegex.exec(contentWithoutImports) !== null) {
      usageCount++;
      // If found at least once in non-import content, it's used
      if (usageCount >= 1) {
        return false;
      }
    }

    // If not found in non-import content, it's unused
    return true;
  }
}
