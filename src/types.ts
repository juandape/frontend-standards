/**
 * Frontend Standards Checker - Type Definitions
 * @version 2.3.0
 */

export interface ValidationRule {
  name: string;
  check: (content: string, filePath: string) => boolean | Promise<boolean>;
  message: string;
  category?:
    | 'structure'
    | 'naming'
    | 'content'
    | 'style'
    | 'documentation'
    | 'performance'
    | 'accessibility'
    | 'typescript'
    | 'react'
    | 'imports';
  severity?: 'error' | 'warning' | 'info';
}

export interface ZoneConfiguration {
  includePackages?: boolean;
  customZones?: string[];
  excludePatterns?: string[];
}

export interface StandardsConfiguration {
  rules?: ValidationRule[];
  zones?: ZoneConfiguration;
  merge?: boolean;
  extensions?: string[];
  ignorePatterns?: string[];
  verbose?: boolean;
  outputFormat?: 'text' | 'json' | 'both';
}

export type ConfigurationFunction = (
  defaultRules: ValidationRule[]
) => ValidationRule[] | StandardsConfiguration;

export type ConfigurationExport =
  | ValidationRule[]
  | StandardsConfiguration
  | ConfigurationFunction;

export interface ValidationError {
  rule: string;
  message: string;
  filePath: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  category: string;
}

export interface ZoneResult {
  zone: string;
  filesProcessed: number;
  errors: ValidationError[];
  warningsCount: number;
  errorsCount: number;
}

export interface ValidationResult {
  success: boolean;
  totalFiles: number;
  totalErrors: number;
  totalWarnings: number;
  zones: ZoneResult[];
  summary: {
    errorsByCategory: Record<string, number>;
    errorsByRule: Record<string, number>;
    processingTime: number;
  };
}

export interface ProjectInfo {
  isMonorepo: boolean;
  projectType: 'react' | 'next' | 'node' | 'angular' | 'vue' | 'generic';
  zones: string[];
  packageJson?: any;
  rootPath: string;
}

export interface ScanOptions {
  extensions: string[];
  ignorePatterns: string[];
  zones?: string[];
  includePackages: boolean;
  customZones: string[];
}

export interface LoggerOptions {
  level: 'debug' | 'info' | 'warn' | 'error';
  prefix?: string;
  colors?: boolean;
}

export interface ReporterOptions {
  outputPath?: string;
  format: 'text' | 'json' | 'both';
  verbose: boolean;
}

export interface CliOptions {
  zones?: string[];
  config?: string | null;
  output?: string | null;
  verbose?: boolean;
  debug?: boolean;
  skipStructure?: boolean;
  skipNaming?: boolean;
  skipContent?: boolean;
  version?: boolean;
  help?: boolean;
}

export interface FileInfo {
  path: string;
  content: string;
  size: number;
  extension: string;
  zone: string;
}

export interface ValidatorContext {
  filePath: string;
  content: string;
  projectInfo: ProjectInfo;
  config: StandardsConfiguration;
}

// Utility types
export type AsyncValidationRule = Omit<ValidationRule, 'check'> & {
  check: (content: string, filePath: string) => Promise<boolean>;
};

export type RuleFactory = (config?: any) => ValidationRule;

export type ValidatorMap = Map<
  string,
  (
    content: string,
    filePath: string,
    context?: ValidatorContext
  ) => Promise<ValidationError[]>
>;

// Default rules interface
export interface DefaultRules {
  structure: ValidationRule[];
  naming: ValidationRule[];
  content: ValidationRule[];
  style: ValidationRule[];
  documentation: ValidationRule[];
}

// Event types for extensibility
export interface ValidationEvent {
  type: 'start' | 'file' | 'zone' | 'complete' | 'error';
  data: any;
  timestamp: Date;
}

export type EventListener = (event: ValidationEvent) => void;

// Advanced configuration interfaces
export interface AdvancedConfiguration extends StandardsConfiguration {
  hooks?: {
    beforeValidation?: (projectInfo: ProjectInfo) => Promise<void> | void;
    afterValidation?: (result: ValidationResult) => Promise<void> | void;
    onError?: (error: Error, context: ValidatorContext) => Promise<void> | void;
  };
  cache?: {
    enabled: boolean;
    ttl?: number;
    strategy?: 'memory' | 'file';
  };
  performance?: {
    maxConcurrentFiles?: number;
    timeoutMs?: number;
  };
}

// Logger specific types
export interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

export interface LoggerConstructorOptions {
  verbose?: boolean;
  level?: keyof LogLevel;
}

// Config Loader specific types
export interface ConfigLoaderConstructorOptions {
  rootDir: string;
  logger: ILogger;
}

export interface DefaultRulesStructure {
  structure: ValidationRule[];
  naming: ValidationRule[];
  content: ValidationRule[];
  style: ValidationRule[];
  documentation: ValidationRule[];
  typescript: ValidationRule[];
  react: ValidationRule[];
  imports: ValidationRule[];
  performance: ValidationRule[];
  accessibility: ValidationRule[];
}

// Rule Engine specific types
export interface RuleEngineInitOptions {
  skipStructure?: boolean;
  skipNaming?: boolean;
  skipContent?: boolean;
}

export interface GitIgnorePattern {
  pattern: string;
  isNegation: boolean;
  isDirectory: boolean;
}

// File Scanner specific types
export interface FileScanResult {
  files: FileInfo[];
  totalFiles: number;
  skippedFiles: number;
  ignoredPatterns: string[];
}

// Project Analyzer specific types
export interface PackageJsonContent {
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

// Reporter specific types
export interface ReportData {
  result: ValidationResult;
  timestamp: Date;
  version: string;
  projectInfo: ProjectInfo;
}

// Interface definitions for classes
export interface ILogger {
  verbose: boolean;
  levels: LogLevel;
  currentLevel: number;
  error(message: string, details?: any): void;
  warn(message: string, details?: any): void;
  info(message: string, details?: any): void;
  debug(message: string, details?: any): void;
}

export interface IConfigLoader {
  rootDir: string;
  logger: ILogger;
  configFileName: string;
  load(customConfigPath?: string | null): Promise<StandardsConfiguration>;
  mergeWithDefaults(customConfig: ConfigurationExport): StandardsConfiguration;
  getDefaultConfig(): StandardsConfiguration;
  getDefaultRules(): DefaultRulesStructure;
}

// Enhanced ProjectAnalyzer types
export interface ZoneInfo {
  name: string;
  path: string;
  type: ProjectInfo['projectType'];
}

export interface ProjectAnalysisResult {
  type: ProjectInfo['projectType'];
  projectType: ProjectInfo['projectType']; // Alias for backwards compatibility
  isMonorepo: boolean;
  zones: ZoneInfo[];
  structure: Record<string, any>;
  rootPath: string;
}

export interface MonorepoZoneConfig {
  includePackages?: boolean;
  customZones?: string[];
}

export interface IProjectAnalyzer {
  rootDir: string;
  logger: ILogger;
  analyze(config?: MonorepoZoneConfig): Promise<ProjectAnalysisResult>;
  detectProjectType(projectPath?: string): ProjectInfo['projectType'];
  detectZones(): Promise<string[]>;
  isMonorepo(): boolean;
  detectMonorepoZones(zoneConfig?: MonorepoZoneConfig): Promise<ZoneInfo[]>;
  getStandardZones(zoneConfig: MonorepoZoneConfig): string[];
  processZoneDirectory(zoneName: string): ZoneInfo[];
  processCustomZones(customZones?: string[]): ZoneInfo[];
  getExpectedStructure(projectType: string): string[];
  getExpectedSrcStructure(): Record<string, string[]>;
  validateZoneStructure(
    files: string[],
    directories: string[],
    zoneName: string
  ): Promise<ValidationError[]>;
}

// Enhanced RuleEngine types
export interface IRuleEngine {
  logger: ILogger;
  rules: ValidationRule[];
  config: StandardsConfiguration | null;
  initialize(
    config: StandardsConfiguration,
    options?: RuleEngineInitOptions
  ): void;
  validateFile(filePath: string): Promise<ValidationError[]>;
  validate(
    content: string,
    filePath: string,
    context?: ValidatorContext
  ): Promise<ValidationError[]>;
}

// Enhanced Reporter types
export interface ProcessedReportData {
  totalErrors: number;
  errorsByRule: Record<string, number>;
  errorsByZone: Record<string, number>;
  oksByZone: Record<string, string[]>;
  totalCheckedByZone: Record<string, number>;
  summary: SummaryItem[];
}

export interface SummaryItem {
  rule: string;
  count: number;
  percentage: string;
}

export interface ReportGenerationResult {
  logFile: string;
  totalErrors: number;
  totalZones: number;
  zoneErrors: Record<string, ValidationError[]>;
  summary: SummaryItem[];
}

export interface IReporter {
  rootDir: string;
  outputPath: string;
  logger: ILogger;
  generate(
    zoneErrors: Record<string, ValidationError[]>,
    projectInfo: ProjectAnalysisResult,
    config: StandardsConfiguration
  ): Promise<ReportGenerationResult>;
  processErrors(
    zoneErrors: Record<string, ValidationError[]>
  ): ProcessedReportData;
  generateSummary(
    errorsByRule: Record<string, number>,
    totalErrors: number
  ): SummaryItem[];
  formatReport(
    reportData: ProcessedReportData,
    projectInfo: ProjectAnalysisResult,
    config: StandardsConfiguration
  ): string;
  saveReport(content: string): Promise<void>;
  generateQuickSummary(reportData: ProcessedReportData): string;
  exportJson(
    reportData: ProcessedReportData,
    outputPath?: string | null
  ): Promise<string>;
  addReportHeader(lines: string[], projectInfo: ProjectAnalysisResult): void;
  addSummarySection(lines: string[], reportData: ProcessedReportData): void;
  addZoneResultsSection(lines: string[], reportData: ProcessedReportData): void;
  addDetailedErrorsSection(lines: string[]): void;
  addStatisticsSection(lines: string[], reportData: ProcessedReportData): void;
  addRecommendationsSection(lines: string[]): void;
  getOriginalZoneErrors(): Record<string, ValidationError[]>;
  setOriginalZoneErrors(zoneErrors: Record<string, ValidationError[]>): void;
}

export interface IFileScanner {
  rootDir: string;
  logger: ILogger;
  gitignorePatterns: GitIgnorePattern[];
  scanZone(zone: string, options: ScanOptions): Promise<FileInfo[]>;
  scanDirectory(dirPath: string, options: ScanOptions): Promise<FileInfo[]>;
  loadGitignorePatterns(): Promise<GitIgnorePattern[]>;
  isIgnored(filePath: string, patterns: GitIgnorePattern[]): boolean;
}
