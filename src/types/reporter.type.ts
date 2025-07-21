import type { ILogger, IProjectAnalysisResult } from './projectAnalizer.type';
import type { IValidationError } from './additionaValidators.type';

export interface IReporter {
  rootDir: string;
  outputPath: string;
  logger: ILogger;
  generate(
    zoneErrors: Record<string, IValidationError[]>,
    projectInfo: IProjectAnalysisResult,
    config: IStandardsConfiguration
  ): Promise<IReportGenerationResult>;
  processErrors(
    zoneErrors: Record<string, IValidationError[]>
  ): IProcessedReportData;
  generateSummary(
    errorsByRule: Record<string, number>,
    totalErrors: number
  ): ISummaryItem[];
  formatReport(
    reportData: IProcessedReportData,
    projectInfo: IProjectAnalysisResult,
    config: IStandardsConfiguration
  ): string;
  saveReport(content: string): Promise<void>;
  generateQuickSummary(reportData: IProcessedReportData): string;
  exportJson(
    reportData: IProcessedReportData,
    outputPath?: string | null
  ): Promise<string>;
  addReportHeader(lines: string[], projectInfo: IProjectAnalysisResult): void;
  addSummarySection(lines: string[], reportData: IProcessedReportData): void;
  addZoneResultsSection(lines: string[], reportData: IProcessedReportData): void;
  addDetailedErrorsSection(lines: string[]): void;
  addStatisticsSection(lines: string[], reportData: IProcessedReportData): void;
  addRecommendationsSection(lines: string[]): void;
  getOriginalZoneErrors(): Record<string, IValidationError[]>;
  setOriginalZoneErrors(zoneErrors: Record<string, IValidationError[]>): void;
}

export interface IStandardsConfiguration {
  rules?: IValidationRule[];
  zones?: IZoneConfiguration;
  merge?: boolean;
  extensions?: string[];
  ignorePatterns?: string[];
  verbose?: boolean;
  outputFormat?: IOutputFormat;
  onlyChangedFiles?: boolean; // Nueva opción para verificar solo archivos modificados en el commit
}

export interface IReportGenerationResult {
  logFile: string;
  totalErrors: number;
  totalWarnings: number;
  totalInfos: number;
  totalZones: number;
  zoneErrors: Record<string, IValidationError[]>;
  summary: ISummaryItem[];
  warningSummary: ISummaryItem[];
  infoSummary: ISummaryItem[];
}

export interface IProcessedReportData {
  totalErrors: number;
  totalWarnings: number;
  totalInfos: number;
  errorsByRule: Record<string, number>;
  warningsByRule: Record<string, number>;
  infosByRule: Record<string, number>;
  errorsByZone: Record<string, number>;
  warningsByZone: Record<string, number>;
  infosByZone: Record<string, number>;
  oksByZone: Record<string, string[]>;
  totalCheckedByZone: Record<string, number>;
  summary: ISummaryItem[];
  warningSummary: ISummaryItem[];
  infoSummary: ISummaryItem[];
}

export interface ISummaryItem {
  rule: string;
  count: number;
  percentage: string;
}

export interface IValidationRule {
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

export interface IZoneConfiguration {
  includePackages?: boolean;
  customZones?: string[];
  excludePatterns?: string[];
  onlyZone?: string; // Nueva opción: revisar solo una zona específica
}

export type IOutputFormat = 'text' | 'json' | 'both';