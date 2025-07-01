import fs from 'fs';
import path from 'path';
import type {
  IProjectAnalyzer,
  ILogger,
  ProjectAnalysisResult,
  ZoneInfo,
  MonorepoZoneConfig,
  PackageJsonContent,
  ValidationError,
  ProjectInfo,
} from '../types.js';

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
    config: MonorepoZoneConfig = {}
  ): Promise<ProjectAnalysisResult> {
    const projectInfo: ProjectAnalysisResult = {
      type: this.detectProjectType(),
      projectType: this.detectProjectType(), // Alias for backwards compatibility
      isMonorepo: this.isMonorepo(),
      zones: [],
      structure: {},
      rootPath: this.rootDir,
    };

    if (projectInfo.isMonorepo) {
      projectInfo.zones = await this.detectMonorepoZones(config);
    } else {
      projectInfo.zones = [
        {
          name: '.',
          path: this.rootDir,
          type: projectInfo.type,
        },
      ];
    }

    this.logger.debug('Project analysis result:', projectInfo);
    return projectInfo;
  }

  /**
   * Detect the type of project (app, package, library, etc.)
   */
  detectProjectType(
    projectPath: string = this.rootDir
  ): ProjectInfo['projectType'] {
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
  ): ProjectInfo['projectType'] | null {
    try {
      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
      const packageJson: PackageJsonContent = JSON.parse(packageJsonContent);

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
  ): ProjectInfo['projectType'] {
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
  detectZoneType(zonePath: string): ProjectInfo['projectType'] {
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
    zoneConfig: MonorepoZoneConfig = {}
  ): Promise<ZoneInfo[]> {
    const zones: ZoneInfo[] = [];

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
  getStandardZones(zoneConfig: MonorepoZoneConfig): string[] {
    const zones = ['apps', 'libs', 'projects']; // Always include these

    if (zoneConfig.includePackages === true) {
      zones.push('packages'); // Only include if explicitly enabled
    }

    return zones;
  }

  /**
   * Process a zone directory and return its sub-zones
   */
  processZoneDirectory(zoneName: string): ZoneInfo[] {
    const zones: ZoneInfo[] = [];
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
  processCustomZones(customZones?: string[]): ZoneInfo[] {
    const zones: ZoneInfo[] = [];

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
  processWorkspaceZones(_zoneConfig: MonorepoZoneConfig): ZoneInfo[] {
    const zones: ZoneInfo[] = [];

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
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    try {
      // Import validation functions - temporary import until additional-validators migration
      const additionalValidators = await this.loadAdditionalValidators();
      if (!additionalValidators) {
        this.logger.warn(
          'Additional validators not available, skipping extended validation'
        );
        return errors;
      }

      const {
        checkNamingConventions,
        checkDirectoryNaming,
        checkComponentStructure,
      } = additionalValidators;

      // Validate file naming conventions
      for (const filePath of files) {
        const namingError = checkNamingConventions(filePath);
        if (namingError) {
          errors.push(namingError);
        }
      }

      // Validate directory naming and component structure
      for (const dirPath of directories) {
        // Directory naming validation
        const dirErrors = checkDirectoryNaming(dirPath);
        errors.push(...dirErrors);

        // Component structure validation
        if (
          dirPath.includes('/components/') ||
          dirPath.includes('\\components\\')
        ) {
          const componentErrors = checkComponentStructure(dirPath);
          errors.push(...componentErrors);
        }
      }
    } catch (error) {
      this.logger.warn(
        'Failed to load additional validators:',
        (error as Error).message
      );
    }

    return errors;
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
