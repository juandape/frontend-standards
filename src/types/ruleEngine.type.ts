import type { ILogger, IProjectInfo } from './projectAnalizer.type.ts';
import type {
  IValidationRule,
  IStandardsConfiguration,
  IZoneConfiguration,
  IOutputFormat,
} from './reporter.type.js';
import type { IValidationError } from './additionaValidators.type.js';

export interface IRuleEngineInitOptions {
  skipStructure?: boolean;
  skipNaming?: boolean;
  skipContent?: boolean;
}

export interface IRuleEngine {
  logger: ILogger;
  rules: IValidationRule[];
  config: IStandardsConfiguration | null;
  initialize(
    config: IStandardsConfiguration,
    options?: IRuleEngineInitOptions
  ): void;
  validateFile(filePath: string): Promise<IValidationError[]>;
  validate(
    content: string,
    filePath: string,
    context?: IValidatorContext
  ): Promise<IValidationError[]>;
}

export interface IStandardsConfigurationInput {
  rules?: IValidationRule[] | IRulesObjectFormat;
  zones?: IZoneConfiguration;
  merge?: boolean;
  extensions?: string[];
  ignorePatterns?: string[];
  verbose?: boolean;
  outputFormat?: IOutputFormat;
  onlyChangedFiles?: boolean; // Nueva opción para verificar solo archivos modificados en el commit
}

export interface IValidatorContext {
  filePath: string;
  content: string;
  projectInfo: IProjectInfo;
  config: IStandardsConfiguration;
}

export interface IRulesObjectFormat {
  [ruleName: string]: boolean | 'error' | 'warning' | 'info';
}