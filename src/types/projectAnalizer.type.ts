import { IValidationError } from './additionalValidators.type';

export interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

export interface ILogger {
  verbose: boolean;
  levels: LogLevel;
  currentLevel: number;
  error(message: string, details?: any): void;
  warn(message: string, details?: any): void;
  info(message: string, details?: any): void;
  debug(message: string, details?: any): void;
}

export interface IProjectAnalyzer {
  rootDir: string;
  logger: ILogger;
  analyze(config?: IMonorepoZoneConfig): Promise<IProjectAnalysisResult>;
  detectProjectType(projectPath?: string): IProjectInfo['projectType'];
  detectZones(): Promise<string[]>;
  isMonorepo(): boolean;
  detectMonorepoZones(zoneConfig?: IMonorepoZoneConfig): Promise<IZoneInfo[]>;
  getStandardZones(zoneConfig: IMonorepoZoneConfig): string[];
  processZoneDirectory(zoneName: string): IZoneInfo[];
  processCustomZones(customZones?: string[]): IZoneInfo[];
  getExpectedStructure(projectType: string): string[];
  getExpectedSrcStructure(): Record<string, string[]>;
  validateZoneStructure(
    files: string[],
    directories: string[],
    zoneName: string
  ): Promise<IValidationError[]>;
}

export interface IMonorepoZoneConfig {
  includePackages?: boolean;
  customZones?: string[];
  onlyZone?: string; // Nueva opción: revisar solo una zona específica
}

export interface IProjectAnalysisResult {
  type: IProjectInfo['projectType'];
  projectType: IProjectInfo['projectType']; // Alias for backwards compatibility
  isMonorepo: boolean;
  zones: IZoneInfo[];
  structure: Record<string, any>;
  rootPath: string;
}

export interface IProjectInfo {
  isMonorepo: boolean;
  projectType: 'react' | 'next' | 'node' | 'angular' | 'vue' | 'generic';
  zones: string[];
  packageJson?: any;
  rootPath: string;
}

export interface IZoneInfo {
  name: string;
  path: string;
  type: IProjectInfo['projectType'];
}

export interface IPackageJsonContent {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  workspaces?: string[] | { packages: string[] };
  type?: 'module' | 'commonjs';
  main?: string;
  exports?: any;
}
