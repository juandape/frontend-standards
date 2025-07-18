import path from 'path';
import type {
  CliOptions,
  ValidationResult,
  ProjectInfo,
  StandardsConfiguration,
  ValidationError,
  ZoneResult,
} from './types.js';

import { Logger } from './utils/logger.js';
import { ConfigLoader } from './core/config-loader.js';
import { FileScanner } from './utils/file-scanner.js';
import { ProjectAnalyzer } from './core/project-analyzer.js';
import { RuleEngine } from './core/rule-engine.js';
import { Reporter } from './core/reporter.js';

/**
 * Main Frontend Standards Checker class
 * Orchestrates the validation process and coordinates all modules
 */
export class FrontendStandardsChecker {
  private readonly options: Partial<CliOptions> & { rootDir: string };
  private readonly logger: Logger;
  private readonly configLoader: ConfigLoader;
  private readonly projectAnalyzer: ProjectAnalyzer;
  private readonly fileScanner: FileScanner;
  private readonly ruleEngine: RuleEngine;
  private readonly reporter: Reporter;

  constructor(options: Partial<CliOptions> = {}) {
    this.options = {
      zones: [],
      config: null,
      output: null,
      verbose: false,
      debug: false,
      skipStructure: false,
      skipNaming: false,
      skipContent: false,
      version: false,
      help: false,
      rootDir: process.cwd(),
      ...options,
    };

    this.logger = new Logger(this.options.verbose || this.options.debug);
    this.configLoader = new ConfigLoader(this.options.rootDir, this.logger);
    this.projectAnalyzer = new ProjectAnalyzer(
      this.options.rootDir,
      this.logger
    );
    this.fileScanner = new FileScanner(this.options.rootDir, this.logger);
    this.ruleEngine = new RuleEngine(this.logger);
    this.reporter = new Reporter(
      this.options.rootDir,
      this.options.output ?? null,
      this.logger
    );
  }

  /**
   * Main execution method
   * @returns Promise<ValidationResult> - Complete validation results
   */
  async run(): Promise<ValidationResult> {
    try {
      const startTime = Date.now();

      this.logger.info('🔍 Starting Frontend Standards validation...');

      // Load configuration
      const config = await this.configLoader.load(this.options.config);
      if (this.options.debug) {
        this.logger.debug(
          'Configuration loaded:',
          JSON.stringify(config, null, 2)
        );
      }

      // Analyze project
      const projectInfo = await this.projectAnalyzer.analyze(config.zones);
      this.logger.info(`📁 Project type: ${projectInfo.projectType}`);
      this.logger.info(`🏗️ Monorepo: ${projectInfo.isMonorepo ? 'Yes' : 'No'}`);

      if (this.options.debug) {
        this.logger.debug('Project analysis result:', projectInfo);
      }
      const zonesToValidate = this.determineZones(projectInfo, config);
      this.logger.info(`🎯 Zones to validate: ${zonesToValidate.join(', ')}`);

      // Initialize rule engine with configuration
      this.ruleEngine.initialize(config, {
        skipStructure: this.options.skipStructure ?? false,
        skipNaming: this.options.skipNaming ?? false,
        skipContent: this.options.skipContent ?? false,
      });

      // Process each zone
      const zoneResults: ZoneResult[] = [];
      let totalFiles = 0;
      let totalErrors = 0;
      let totalWarnings = 0;

      // Si onlyChangedFiles está habilitado y no hay onlyZone configurado, solo revisar archivos modificados
      let changedFiles: string[] = [];
      const hasOnlyZone = config.zones?.onlyZone !== undefined;

      if (
        (this.options.onlyChangedFiles || config.onlyChangedFiles) &&
        !hasOnlyZone
      ) {
        this.logger.info('🔍 Only checking files staged for commit');
        changedFiles = await this.fileScanner.getFilesInCommit();
        if (changedFiles.length === 0) {
          this.logger.info(
            'No files staged for commit found. Nothing to check.'
          );
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
        this.logger.info(`Found ${changedFiles.length} files to check`);
      } else if (hasOnlyZone) {
        this.logger.info(
          `🎯 Only checking zone: ${config.zones?.onlyZone} (onlyChangedFiles disabled)`
        );
      }

      for (const zone of zonesToValidate) {
        this.logger.info(`\n📂 Processing zone: ${zone}`);

        let files = await this.fileScanner.scanZone(zone, {
          extensions: config.extensions || ['.js', '.ts', '.jsx', '.tsx'],
          ignorePatterns: config.ignorePatterns || [],
          zones: zonesToValidate,
          includePackages: config.zones?.includePackages || false,
          customZones: config.zones?.customZones || [],
        });

        // Si onlyChangedFiles está habilitado y no hay onlyZone configurado, filtrar los archivos escaneados
        const hasOnlyZone = config.zones?.onlyZone !== undefined;
        if (
          (this.options.onlyChangedFiles || config.onlyChangedFiles) &&
          !hasOnlyZone &&
          changedFiles.length > 0
        ) {
          const originalCount = files.length;
          files = files.filter((file) =>
            changedFiles.some((changedFile) => {
              const fileFullPath =
                file.fullPath ?? path.join(this.options.rootDir, file.path);
              return (
                fileFullPath === changedFile ||
                changedFile.endsWith(file.path) ||
                fileFullPath.endsWith(changedFile)
              );
            })
          );
          this.logger.debug(
            `Filtered ${originalCount} files to ${files.length} changed files in zone ${zone}`
          );
        }

        if (this.options.debug) {
          this.logger.debug(
            `📁 Debug: Files found in zone "${zone}":`,
            files.map((f: any) => f.path)
          );
        }

        const zoneErrors: ValidationError[] = [];

        // Filter out configuration files before processing
        const validFiles = files.filter((file) => {
          const isConfigFile = this.ruleEngine.isConfigurationFile(file.path);
          if (isConfigFile && this.options.verbose) {
            this.logger.debug(`Skipping configuration file: ${file.path}`);
          }
          return !isConfigFile;
        });

        for (const file of validFiles) {
          if (this.options.verbose) {
            this.logger.info(`  🔍 Validating: ${file.path}`);
          }

          const fileErrors = await this.ruleEngine.validate(
            file.content,
            file.path,
            {
              filePath: file.path,
              content: file.content,
              projectInfo,
              config,
            }
          );

          zoneErrors.push(...fileErrors);
        }

        const zoneErrorsCount = zoneErrors.filter(
          (e) => e.severity === 'error'
        ).length;
        const zoneWarningsCount = zoneErrors.filter(
          (e) => e.severity === 'warning'
        ).length;

        const zoneResult: ZoneResult = {
          zone,
          filesProcessed: validFiles.length,
          errors: zoneErrors,
          errorsCount: zoneErrorsCount,
          warningsCount: zoneWarningsCount,
        };

        zoneResults.push(zoneResult);
        totalFiles += validFiles.length;
        totalErrors += zoneErrorsCount;
        totalWarnings += zoneWarningsCount;

        this.logger.info(`  ✅ Files processed: ${files.length}`);
        this.logger.info(`  ❌ Errors found: ${zoneErrorsCount}`);
        this.logger.info(`  ⚠️  Warnings found: ${zoneWarningsCount}`);
      }

      const processingTime = Date.now() - startTime;

      // Create summary
      const errorsByCategory: Record<string, number> = {};
      const errorsByRule: Record<string, number> = {};

      zoneResults.forEach((zone) => {
        zone.errors.forEach((error) => {
          errorsByCategory[error.category] =
            (errorsByCategory[error.category] ?? 0) + 1;
          errorsByRule[error.rule] = (errorsByRule[error.rule] ?? 0) + 1;
        });
      });

      const result: ValidationResult = {
        success: totalErrors === 0,
        totalFiles,
        totalErrors,
        totalWarnings,
        zones: zoneResults,
        summary: {
          errorsByCategory,
          errorsByRule,
          processingTime,
        },
      };

      // Generate report - convert zoneResults to the format expected by Reporter
      const zoneErrors: Record<string, ValidationError[]> = {};
      zoneResults.forEach((zone) => {
        zoneErrors[zone.zone] = zone.errors;
        // Debug: log errors count per zone before passing to reporter
        this.logger.debug(
          `🐛 Zone ${zone.zone}: ${zone.errors.length} errors before reporter`
        );
      });

      const totalErrorsToReporter = Object.values(zoneErrors).reduce(
        (sum, errors) => sum + errors.length,
        0
      );
      this.logger.debug(
        `🐛 Total errors being passed to reporter: ${totalErrorsToReporter}`
      );

      await this.reporter.generate(zoneErrors, projectInfo, config);

      this.logger.info(`\n🎉 Validation completed in ${processingTime}ms`);
      this.logger.info(`📊 Total files: ${totalFiles}`);
      this.logger.info(`❌ Total errors: ${totalErrors}`);
      this.logger.info(`⚠️  Total warnings: ${totalWarnings}`);

      return result;
    } catch (error) {
      this.logger.error('💥 Validation failed:', error);
      throw error;
    }
  }

  /**
   * Determine which zones to validate based on project structure and options
   */
  private determineZones(
    projectInfo: ProjectInfo | { zones: string[] | { name: string }[] },
    config: StandardsConfiguration
  ): string[] {
    if (this.options.zones && this.options.zones.length > 0) {
      return this.options.zones;
    }

    // Handle both formats of zones
    let zones: string[] = [];
    if (Array.isArray(projectInfo.zones)) {
      if (typeof projectInfo.zones[0] === 'string') {
        zones = [...(projectInfo.zones as string[])];
      } else {
        zones = (projectInfo.zones as { name: string }[]).map(
          (zone) => zone.name
        );
      }
    }

    // Filter out packages unless explicitly included
    if (!config.zones?.includePackages) {
      zones = zones.filter((zone) => !zone.startsWith('packages/'));
    }

    return zones.length > 0 ? zones : ['.']; // Default to current directory
  }
}

// Export default class and types
export default FrontendStandardsChecker;
export * from './types.js';
