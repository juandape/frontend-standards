import path from 'path';
import type {
  IValidationError,
  IValidationResult,
  IZoneResult,
  IStandardsConfiguration,
  IProjectInfo,
  IProcessZoneOptions,
} from '../types/index.js';

import type { Logger } from '../utils/logger';

export async function loadAndLogConfig(
  configLoader: any,
  options: any,
  logger: Logger
): Promise<IStandardsConfiguration> {
  const config = await configLoader.load(options.config);
  if (options.debug) {
    logger.debug('Configuration loaded:', JSON.stringify(config, null, 2));
  }
  return config;
}

export async function analyzeProject(
  projectAnalyzer: any,
  config: IStandardsConfiguration,
  logger: Logger,
  options: any
): Promise<IProjectInfo> {
  const projectInfo = await projectAnalyzer.analyze(config.zones);
  logger.info(`📁 Project type: ${projectInfo.projectType}`);
  logger.info(`🏗️ Monorepo: ${projectInfo.isMonorepo ? 'Yes' : 'No'}`);
  if (options.debug) {
    logger.debug('Project analysis result:', projectInfo);
  }
  return projectInfo;
}

export async function getChangedFiles(
  fileScanner: any,
  logger: Logger
): Promise<string[]> {
  logger.info('🔍 Only checking files staged for commit');
  const changedFiles = await fileScanner.getFilesInCommit();
  logger.info(`Found ${changedFiles.length} files to check`);
  return changedFiles;
}

export function returnEarly(startTime: number): IValidationResult {
  return {
    success: true,
    totalFiles: 0,
    totalErrors: 0,
    totalWarnings: 0,
    zones: [],
    summary: {
      errorsByCategory: {},
      errorsByRule: {},
      processingTime: Date.now() - startTime,
    },
  };
}

export function createSummary(
  zoneResults: IZoneResult[],
  totalFiles: number,
  totalErrors: number,
  totalWarnings: number,
  startTime: number
): IValidationResult {
  const errorsByCategory: Record<string, number> = {};
  const errorsByRule: Record<string, number> = {};

  zoneResults.forEach((zone) => {
    zone.errors.forEach((error) => {
      const categoryKey = error.category ?? 'uncategorized';
      errorsByCategory[categoryKey] = (errorsByCategory[categoryKey] ?? 0) + 1;
      errorsByRule[error.rule] = (errorsByRule[error.rule] ?? 0) + 1;
    });
  });

  return {
    success: totalErrors === 0,
    totalFiles,
    totalErrors,
    totalWarnings,
    zones: zoneResults,
    summary: {
      errorsByCategory,
      errorsByRule,
      processingTime: Date.now() - startTime,
    },
  };
}

export async function generateReport(
  reporter: any,
  logger: Logger,
  zoneResults: IZoneResult[],
  projectInfo: IProjectInfo,
  config: IStandardsConfiguration
): Promise<void> {
  const zoneErrors: Record<string, IValidationError[]> = {};
  zoneResults.forEach((zone) => {
    zoneErrors[zone.zone] = zone.errors;
    logger.debug(
      `🐛 Zone ${zone.zone}: ${zone.errors.length} errors before reporter`
    );
  });

  const totalErrorsToReporter = Object.values(zoneErrors).reduce(
    (sum, errors) => sum + errors.length,
    0
  );
  logger.debug(
    `🐛 Total errors being passed to reporter: ${totalErrorsToReporter}`
  );

  await reporter.generate(zoneErrors, projectInfo, config);
}

export function logSummary(
  logger: Logger,
  summary: IValidationResult['summary'],
  totalFiles: number,
  totalErrors: number,
  totalWarnings: number
): void {
  logger.info(`\n🎉 Validation completed in ${summary.processingTime}ms`);
  logger.info(`📊 Total files: ${totalFiles}`);
  logger.info(`❌ Total errors: ${totalErrors}`);
  logger.info(`⚠️  Total warnings: ${totalWarnings}`);
}

export function filterChangedFiles(
  files: any[],
  changedFiles: string[],
  rootDir: string
): any[] {
  return files.filter((file) => {
    const fileFullPath = file.fullPath ?? path.join(rootDir, file.path);
    return changedFiles.some(
      (cf) =>
        fileFullPath === cf ||
        (fileFullPath.endsWith(cf) ?? cf.endsWith(file.path))
    );
  });
}

export async function processZone({
  zone,
  config,
  changedFiles,
  hasOnlyZone,
  options,
  rootDir,
  logger,
  fileScanner,
  ruleEngine,
  projectInfo,
}: IProcessZoneOptions): Promise<IZoneResult> {
  logger.info(`\n📂 Processing zone: ${zone}`);

  let files = await fileScanner.scanZone(zone, {
    extensions: config.extensions || ['.js', '.ts', '.jsx', '.tsx'],
    ignorePatterns: config.ignorePatterns || [],
    zones: [zone],
    includePackages: config.zones?.includePackages || false,
    customZones: config.zones?.customZones || [],
  });

  if (
    (options.onlyChangedFiles || config.onlyChangedFiles) &&
    !hasOnlyZone &&
    changedFiles.length > 0
  ) {
    const originalCount = files.length;
    files = filterChangedFiles(files, changedFiles, rootDir);
    logger.debug(
      `Filtered ${originalCount} files to ${files.length} changed files in zone ${zone}`
    );
  }

  if (options.debug) {
    logger.debug(
      `📁 Debug: Files found in zone "${zone}":`,
      files.map((f) => f.path)
    );
  }

  const zoneErrors: IValidationError[] = [];

  const validFiles = files.filter((file) => {
    const isConfigFile = ruleEngine.isConfigurationFile(file.path);
    if (isConfigFile && options.verbose) {
      logger.debug(`Skipping configuration file: ${file.path}`);
    }
    return !isConfigFile;
  });

  for (const file of validFiles) {
    if (options.verbose) {
      logger.info(`  🔍 Validating: ${file.path}`);
    }

    const fileErrors = await ruleEngine.validate(file.content, file.path, {
      filePath: file.path,
      content: file.content,
      projectInfo,
      config,
    });

    zoneErrors.push(...fileErrors);
  }

  const zoneErrorsCount = zoneErrors.filter(
    (e) => e.severity === 'error'
  ).length;
  const zoneWarningsCount = zoneErrors.filter(
    (e) => e.severity === 'warning'
  ).length;

  logger.info(`  ✅ Files processed: ${files.length}`);
  logger.info(`  ❌ Errors found: ${zoneErrorsCount}`);
  logger.info(`  ⚠️  Warnings found: ${zoneWarningsCount}`);

  return {
    zone,
    filesProcessed: validFiles.length,
    errors: zoneErrors,
    errorsCount: zoneErrorsCount,
    warningsCount: zoneWarningsCount,
  };
}
