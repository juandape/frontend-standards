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
          name: 'root',
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
      try {
        const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
        const packageJson: PackageJsonContent = JSON.parse(packageJsonContent);

        // Check for Next.js app
        if (
          packageJson.dependencies?.next ||
          packageJson.devDependencies?.next
        ) {
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
      } catch (error) {
        this.logger.warn(
          'Failed to parse package.json:',
          (error as Error).message
        );
      }
    }

    // Fallback heuristics
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

    return monorepoMarkers.some((marker) =>
      fs.existsSync(path.join(this.rootDir, marker))
    );
  }

  /**
   * Detect zones in a monorepo
   */
  async detectMonorepoZones(
    zoneConfig: MonorepoZoneConfig = {}
  ): Promise<ZoneInfo[]> {
    const zones: ZoneInfo[] = [];

    // Process standard zones
    const standardZones = this.getStandardZones(zoneConfig);
    for (const zoneName of standardZones) {
      zones.push(...this.processZoneDirectory(zoneName));
    }

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
      // Import validation functions - we'll handle this as any for now until we migrate additional-validators
      // @ts-ignore - TODO: Migrate additional-validators.js to TypeScript
      const additionalValidators = (await import(
        './additional-validators.js'
      )) as any;
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
   * Legacy method for compatibility - not used in new implementation
   */
  async detectZones(): Promise<string[]> {
    const result = await this.analyze();
    return result.zones.map((zone) => zone.name);
  }
}
