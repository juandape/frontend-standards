import fs from 'fs';
import path from 'path';
import type {
  ILogger,
  IValidationError,
  IProjectAnalyzer,
  IMonorepoZoneConfig,
  IProjectAnalysisResult,
  IProjectInfo,
  IZoneInfo,
  IPackageJsonContent,
} from '../types';

/**
 * Project analyzer for detecting project type, structure, and zones
 */
export class ProjectAnalyzer implements IProjectAnalyzer {
  public readonly rootDir: string;
  public readonly logger: ILogger;

  constructor(rootDir: string, logger: ILogger) {
    this.rootDir = rootDir;
    this.logger = logger;
  }

  /**
   * Analyze the project structure and return project information
   */
  async analyze(
    config: IMonorepoZoneConfig = {}
  ): Promise<IProjectAnalysisResult> {
    const projectInfo: IProjectAnalysisResult = {
      type: this.detectProjectType(),
      projectType: this.detectProjectType(), // Alias for backwards compatibility
      isMonorepo: this.isMonorepo(),
      zones: [],
      structure: {},
      rootPath: this.rootDir,
    };

    if (projectInfo.isMonorepo) {
      projectInfo.zones = await this.detectMonorepoZones(config);
    } else if (config.customZones && config.customZones.length > 0) {
      // Para proyectos no-monorepo, usar zonas personalizadas si están definidas
      projectInfo.zones = this.processCustomZones(config.customZones);
    } else {
      // Solo usar zona raíz si no hay zonas personalizadas
      projectInfo.zones = [
        {
          name: '.',
          path: this.rootDir,
          type: projectInfo.type,
        },
      ];
    }

    // Eliminar zonas duplicadas basándose en el nombre
    projectInfo.zones = projectInfo.zones.filter(
      (zone, index, self) =>
        index === self.findIndex((z) => z.name === zone.name)
    );

    this.logger.debug('Project analysis result:', projectInfo);
    return projectInfo;
  }

  /**
   * Detect the type of project (app, package, library, etc.)
   */
  detectProjectType(
    projectPath: string = this.rootDir
  ): IProjectInfo['projectType'] {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const hasPackageJson = fs.existsSync(packageJsonPath);

    if (hasPackageJson) {
      const projectType =
        this.detectProjectTypeFromPackageJson(packageJsonPath);
      if (projectType) return projectType;
    }

    return this.detectProjectTypeFromHeuristics(projectPath, hasPackageJson);
  }

  /**
   * Detect project type from package.json dependencies
   */
  private detectProjectTypeFromPackageJson(
    packageJsonPath: string
  ): IProjectInfo['projectType'] | null {
    try {
      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
      const packageJson: IPackageJsonContent = JSON.parse(packageJsonContent);

      // Check for Next.js app
      if (packageJson.dependencies?.next || packageJson.devDependencies?.next) {
        return 'next';
      }

      // Check for React app
      if (
        packageJson.dependencies?.react ||
        packageJson.devDependencies?.react
      ) {
        return 'react';
      }

      // Check for Angular
      if (
        packageJson.dependencies?.['@angular/core'] ||
        packageJson.devDependencies?.['@angular/core']
      ) {
        return 'angular';
      }

      // Check for Vue
      if (packageJson.dependencies?.vue || packageJson.devDependencies?.vue) {
        return 'vue';
      }

      // Check for Node.js package
      if (packageJson.main || packageJson.exports) {
        return 'node';
      }

      return null;
    } catch (error) {
      this.logger.warn(
        'Failed to parse package.json:',
        (error as Error).message
      );
      return null;
    }
  }

  /**
   * Detect project type using heuristics
   */
  private detectProjectTypeFromHeuristics(
    projectPath: string,
    hasPackageJson: boolean
  ): IProjectInfo['projectType'] {
    const hasSrc = fs.existsSync(path.join(projectPath, 'src'));
    const hasPages = fs.existsSync(path.join(projectPath, 'pages'));
    const hasApp = fs.existsSync(path.join(projectPath, 'app'));

    if (hasPages || hasApp) return 'next';
    if (hasPackageJson && hasSrc) return 'node';

    return 'generic';
  }

  /**
   * Detect zone type for a specific path
   */
  detectZoneType(zonePath: string): IProjectInfo['projectType'] {
    return this.detectProjectType(zonePath);
  }

  /**
   * Check if the project is a monorepo
   */
  isMonorepo(): boolean {
    const monorepoMarkers = [
      'packages',
      'apps',
      'lerna.json',
      'turbo.json',
      'nx.json',
      'rush.json',
    ];

    // Check for standard monorepo markers (directories and config files)
    const hasStandardMarkers = monorepoMarkers.some((marker) =>
      fs.existsSync(path.join(this.rootDir, marker))
    );

    if (hasStandardMarkers) {
      return true;
    }

    // Check for workspaces in package.json
    const packageJsonPath = path.join(this.rootDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(packageJsonContent);

        // Check for workspaces property (yarn/npm workspaces)
        if (packageJson.workspaces) {
          return true;
        }
      } catch (error) {
        // Ignore JSON parsing errors - if package.json is malformed, treat as non-monorepo
        this.logger.debug(
          'Failed to parse package.json for monorepo detection:',
          error
        );
      }
    }

    return false;
  }

  /**
   * Detect zones in a monorepo
   */
  async detectMonorepoZones(
    zoneConfig: IMonorepoZoneConfig = {}
  ): Promise<IZoneInfo[]> {
    const zones: IZoneInfo[] = [];

    // If onlyZone is specified, process only that zone
    if (zoneConfig.onlyZone) {
      zones.push(...this.processZoneDirectory(zoneConfig.onlyZone));
      return zones;
    }

    // Process standard zones
    const standardZones = this.getStandardZones(zoneConfig);
    for (const zoneName of standardZones) {
      zones.push(...this.processZoneDirectory(zoneName));
    }

    // Process workspaces from package.json
    zones.push(...this.processWorkspaceZones(zoneConfig));

    // Process custom zones
    zones.push(...this.processCustomZones(zoneConfig.customZones));

    return zones;
  }

  /**
   * Get list of standard zones to process based on configuration
   */
  getStandardZones(zoneConfig: IMonorepoZoneConfig): string[] {
    const zones = ['apps', 'libs', 'projects']; // Always include these

    if (zoneConfig.includePackages === true) {
      zones.push('packages'); // Only include if explicitly enabled
    }

    return zones;
  }

  /**
   * Process a zone directory and return its sub-zones
   */
  processZoneDirectory(zoneName: string): IZoneInfo[] {
    const zones: IZoneInfo[] = [];
    const candidatePath = path.join(this.rootDir, zoneName);

    if (
      !fs.existsSync(candidatePath) ||
      !fs.statSync(candidatePath).isDirectory()
    ) {
      return zones;
    }

    const subDirs = fs
      .readdirSync(candidatePath)
      .map((dir) => path.join(candidatePath, dir))
      .filter((dirPath) => fs.statSync(dirPath).isDirectory());

    for (const subDir of subDirs) {
      zones.push({
        name: path.relative(this.rootDir, subDir),
        path: subDir,
        type: this.detectZoneType(subDir),
      });
    }

    return zones;
  }

  /**
   * Process custom zones from configuration
   */
  processCustomZones(customZones?: string[]): IZoneInfo[] {
    const zones: IZoneInfo[] = [];

    if (!Array.isArray(customZones)) {
      return zones;
    }

    for (const customZone of customZones) {
      const customZonePath = path.join(this.rootDir, customZone);
      if (
        fs.existsSync(customZonePath) &&
        fs.statSync(customZonePath).isDirectory()
      ) {
        zones.push({
          name: customZone,
          path: customZonePath,
          type: this.detectZoneType(customZonePath),
        });
      }
    }

    return zones;
  }

  /**
   * Process workspace zones from package.json
   */
  processWorkspaceZones(_zoneConfig: IMonorepoZoneConfig): IZoneInfo[] {
    const zones: IZoneInfo[] = [];

    const packageJsonPath = path.join(this.rootDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return zones;
    }

    try {
      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonContent);

      if (!packageJson.workspaces) {
        return zones;
      }

      // Handle both array and object formats for workspaces
      let workspacePatterns: string[] = [];
      if (Array.isArray(packageJson.workspaces)) {
        workspacePatterns = packageJson.workspaces;
      } else if (packageJson.workspaces.packages) {
        workspacePatterns = packageJson.workspaces.packages;
      }

      // Process workspace patterns to find actual directories
      for (const pattern of workspacePatterns) {
        // For simple directory names (not glob patterns)
        if (!pattern.includes('*') && !pattern.includes('?')) {
          const workspacePath = path.join(this.rootDir, pattern);
          if (
            fs.existsSync(workspacePath) &&
            fs.statSync(workspacePath).isDirectory()
          ) {
            zones.push({
              name: pattern,
              path: workspacePath,
              type: this.detectZoneType(workspacePath),
            });
          }
        }
        // Note: Glob pattern support could be added here if needed for complex workspace configurations
      }
    } catch (error) {
      this.logger.debug(
        'Failed to process workspace zones from package.json:',
        error
      );
    }

    return zones;
  }

  /**
   * Get expected structure for a project type
   */
  getExpectedStructure(projectType: string): string[] {
    const structures: Record<string, string[]> = {
      next: ['app', 'components', 'public', 'src'],
      react: ['src', 'public'],
      angular: ['src', 'e2e'],
      vue: ['src', 'public'],
      node: ['src', 'package.json', 'lib'],
      generic: [],
    };

    return structures[projectType] ?? structures.generic ?? [];
  }

  /**
   * Get expected src structure
   */
  getExpectedSrcStructure(): Record<string, string[]> {
    return {
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
    };
  }

  /**
   * Validate zone structure and naming conventions
   */
  async validateZoneStructure(
    files: string[],
    directories: string[],
    _zoneName: string
  ): Promise<IValidationError[]> {
    const errors: IValidationError[] = [];
    const additionalValidators = await this.loadAdditionalValidators();

    if (!additionalValidators) {
      this.logger.warn(
        'Additional validators not available, skipping extended validation'
      );
      return errors;
    }

    try {
      errors.push(...(await this.validateFiles(files, additionalValidators)));
      errors.push(
        ...this.validateDirectories(directories, additionalValidators)
      );
    } catch (error) {
      this.logger.warn('Validation error:', (error as Error).message);
    }

    return errors;
  }

  private async validateFiles(
    files: string[],
    validators: any
  ): Promise<IValidationError[]> {
    const errors: IValidationError[] = [];
    const { checkNamingConventions, checkComponentFunctionNameMatch } =
      validators;

    for (const filePath of files) {
      errors.push(
        ...this.validateSingleFile(
          filePath,
          checkNamingConventions,
          checkComponentFunctionNameMatch
        )
      );
    }

    return errors;
  }

  private validateSingleFile(
    filePath: string,
    namingValidator: (path: string) => IValidationError | undefined,
    functionNameValidator: (
      content: string,
      path: string
    ) => IValidationError | undefined
  ): IValidationError[] {
    const errors: IValidationError[] = [];
    const namingError = namingValidator(filePath);

    if (namingError) {
      errors.push(namingError);
    }

    if (this.isComponentIndexFile(filePath)) {
      this.validateComponentFunctionName(
        filePath,
        functionNameValidator,
        errors
      );
    }

    return errors;
  }

  private isComponentIndexFile(filePath: string): boolean {
    return filePath.endsWith('index.tsx') && filePath.includes('/components/');
  }

  private validateComponentFunctionName(
    filePath: string,
    validator: (content: string, path: string) => IValidationError | undefined,
    errors: IValidationError[]
  ): void {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const functionNameError = validator(content, filePath);
      if (functionNameError) {
        errors.push(functionNameError);
      }
    } catch (error) {
      this.logger.warn(
        `Could not read file for function name validation: ${filePath}. Error: ${(error as Error).message}`
      );
      throw error;
    }
  }

  private validateDirectories(
    directories: string[],
    validators: any
  ): IValidationError[] {
    const errors: IValidationError[] = [];
    const { checkDirectoryNaming, checkComponentStructure } = validators;

    for (const dirPath of directories) {
      errors.push(...checkDirectoryNaming(dirPath));

      if (this.isComponentDirectory(dirPath)) {
        errors.push(...checkComponentStructure(dirPath));
      }
    }

    return errors;
  }

  private isComponentDirectory(dirPath: string): boolean {
    return (
      dirPath.includes('/components/') || dirPath.includes('\\components\\')
    );
  }

  /**
   * Safely load additional validators
   */
  private async loadAdditionalValidators(): Promise<any> {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Temporary workaround for JS module import
      return await import('./additional-validators.js');
    } catch (error) {
      this.logger.debug(
        'Additional validators not found:',
        (error as Error).message
      );
      return null;
    }
  }

  /**
   * Legacy method for compatibility - not used in new implementation
   */
  async detectZones(): Promise<string[]> {
    const result = await this.analyze();
    return result.zones.map((zone) => zone.name);
  }
}
