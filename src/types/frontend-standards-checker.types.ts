/**
 * Type definitions for Frontend Standards Checker main class
 */

export interface IValidationError {
  rule: string;
  message: string;
  file: string;
  line?: number;
  column?: number;
  severity?: "error" | "warning" | "info";
}

export interface IValidationResults {
  totalErrors: number;
  errorsByZone: Record<string, IValidationError[]>;
  logFile: string;
  summary: {
    filesChecked: number;
    rulesApplied: number;
    zones: number;
  };
}

export interface ICheckerOptions {
  zones?: string[];
  configPath?: string | null;
  outputPath?: string | null;
  verbose?: boolean;
  skipStructure?: boolean;
  skipNaming?: boolean;
  skipContent?: boolean;
  rootDir?: string;
}
