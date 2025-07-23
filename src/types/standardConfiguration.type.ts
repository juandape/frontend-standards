import { RuleEngine } from '../core/rule-engine';
import { FileScanner } from '../utils/file-scanner';
import { Logger } from '../utils/logger';
import { IValidationError } from './additionalValidators.type';
import { LogLevel, ILogger, IProjectInfo } from './projectAnalizer.type';
import { IValidationRule, IStandardsConfiguration } from './reporter.type';
import {
  IStandardsConfigurationInput,
  IValidatorContext,
} from './ruleEngine.type';

export type IConfigurationFunction = (
  defaultRules: IValidationRule[]
) => IValidationRule[] | IStandardsConfiguration;

export type IConfigurationExport =
  | IValidationRule[]
  | IStandardsConfigurationInput
  | IConfigurationFunction;

export interface IZoneResult {
  zone: string;
  filesProcessed: number;
  errors: IValidationError[];
  warningsCount: number;
  errorsCount: number;
}

export interface IValidationResult {
  success: boolean;
  totalFiles: number;
  totalErrors: number;
  totalWarnings: number;
  zones: IZoneResult[];
  summary: {
    errorsByCategory: Record<string, number>;
    errorsByRule: Record<string, number>;
    processingTime: number;
  };
}

export interface ILoggerOptions {
  level: 'debug' | 'info' | 'warn' | 'error';
  prefix?: string;
  colors?: boolean;
}

export interface IReporterOptions {
  outputPath?: string;
  format: 'text' | 'json' | 'both';
  verbose: boolean;
}

export interface ICliOptions {
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
  onlyChangedFiles?: boolean;
}

export type IAsyncValidationRule = Omit<IValidationRule, 'check'> & {
  check: (content: string, filePath: string) => Promise<boolean>;
};

export type IRuleFactory = (config?: any) => IValidationRule;

export type IValidatorMap = Map<
  string,
  (
    content: string,
    filePath: string,
    context?: IValidatorContext
  ) => Promise<IValidationError[]>
>;

export interface IDefaultRules {
  structure: IValidationRule[];
  naming: IValidationRule[];
  content: IValidationRule[];
  style: IValidationRule[];
  documentation: IValidationRule[];
}

export interface IValidationEvent {
  type: 'start' | 'file' | 'zone' | 'complete' | 'error';
  data: any;
  timestamp: Date;
}

export type IEventListener = (event: IValidationEvent) => void;

export interface IAdvancedConfiguration extends IStandardsConfiguration {
  hooks?: {
    beforeValidation?: (projectInfo: IProjectInfo) => Promise<void> | void;
    afterValidation?: (result: IValidationResult) => Promise<void> | void;
    onError?: (
      error: Error,
      context: IValidatorContext
    ) => Promise<void> | void;
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

export interface ILoggerConstructorOptions {
  verbose?: boolean;
  level?: keyof LogLevel;
}

export interface IConfigLoaderConstructorOptions {
  rootDir: string;
  logger: ILogger;
}

export interface IDefaultRulesStructure {
  structure: IValidationRule[];
  naming: IValidationRule[];
  content: IValidationRule[];
  style: IValidationRule[];
  documentation: IValidationRule[];
  typescript: IValidationRule[];
  react: IValidationRule[];
  imports: IValidationRule[];
  performance: IValidationRule[];
  accessibility: IValidationRule[];
}

export interface IReportData {
  result: IValidationResult;
  timestamp: Date;
  version: string;
  projectInfo: IProjectInfo;
}

export interface IConfigLoader {
  rootDir: string;
  logger: ILogger;
  configFileName: string;
  load(customConfigPath?: string | null): Promise<IStandardsConfiguration>;
  mergeWithDefaults(
    customConfig: IConfigurationExport
  ): IStandardsConfiguration;
  getDefaultConfig(): IStandardsConfiguration;
  getDefaultRules(): IDefaultRulesStructure;
}

export interface IProcessZoneOptions {
  zone: string;
  config: IStandardsConfiguration;
  changedFiles: string[];
  hasOnlyZone: boolean;
  options: Partial<ICliOptions> & { rootDir: string };
  rootDir: string;
  logger: Logger;
  fileScanner: FileScanner;
  ruleEngine: RuleEngine;
  projectInfo: IProjectInfo;
}
