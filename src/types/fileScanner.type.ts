import { ILogger } from "./projectAnalizer.type";

export interface IFileScanner {
  rootDir: string;
  logger: ILogger;
  gitignorePatterns: IGitIgnorePattern[];
  scanZone(zone: string, options: IScanOptions): Promise<IFileInfo[]>;
  scanDirectory(dirPath: string, options: IScanOptions): Promise<IFileInfo[]>;
  loadGitignorePatterns(): Promise<IGitIgnorePattern[]>;
  isIgnored(filePath: string, patterns: IGitIgnorePattern[]): boolean;
}

export interface IGitIgnorePattern {
  pattern: string;
  isNegation: boolean;
  isDirectory: boolean;
}

export interface IScanOptions {
  extensions: string[];
  ignorePatterns: string[];
  zones?: string[];
  includePackages: boolean;
  customZones: string[];
}

export interface IFileInfo {
  path: string;
  content: string;
  size: number;
  extension: string;
  zone: string;
  fullPath?: string; // Ruta absoluta al archivo (opcional)
}

export interface IFileScanResult {
  files: IFileInfo[];
  totalFiles: number;
  skippedFiles: number;
  ignoredPatterns: string[];
}