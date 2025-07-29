import type {
  ICliOptions,
  IValidationResult,
  IProjectInfo,
  IStandardsConfiguration,
  IZoneResult,
} from './types/index.js';
import {
  loadAndLogConfig,
  analyzeProject,
  getChangedFiles,
  returnEarly,
  createSummary,
  generateReport,
  logSummary,
  processZone,
} from './helpers/index.js';

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
  private readonly options: Partial<ICliOptions> & { rootDir: string };
  private readonly logger: Logger;
  private readonly configLoader: ConfigLoader;
  private readonly projectAnalyzer: ProjectAnalyzer;
  private readonly fileScanner: FileScanner;
  private readonly ruleEngine: RuleEngine;
  private readonly reporter: Reporter;

  constructor(options: Partial<ICliOptions> = {}) {
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
  async run(): Promise<IValidationResult> {
    try {
      const startTime = Date.now();
      this.logger.info('🔍 Starting Frontend Standards validation...');

      // Prompt interactivo para incluir colaboradores en el log
      let includeCollaborators = true;
      try {
        // Solo mostrar el prompt si está en modo interactivo
        if (process.stdout.isTTY) {
          const inquirer = await import('inquirer');
          const answer = await inquirer.default.prompt([
            {
              type: 'confirm',
              name: 'includeCollaborators',
              message:
                '¿Do you want to include the latest collaborators in the log? (This may take longer)',
              default: false,
            },
          ]);
          includeCollaborators = answer.includeCollaborators;
        }
      } catch (e) {
        this.logger.warn(
          'Could not prompt for collaborators, defaulting to includeCollaborators=true',
          e
        );
        includeCollaborators = true;
      }

      const config = await loadAndLogConfig(
        this.configLoader,
        this.options,
        this.logger
      );
      const projectInfo = await analyzeProject(
        this.projectAnalyzer,
        config,
        this.logger,
        this.options
      );
      const zonesToValidate = this.determineZones(projectInfo, config);
      this.logger.info(`🎯 Zones to validate: ${zonesToValidate.join(', ')}`);

      this.ruleEngine.initialize(config, {
        skipStructure: this.options.skipStructure ?? false,
        skipNaming: this.options.skipNaming ?? false,
        skipContent: this.options.skipContent ?? false,
      });

      let totalFiles = 0;
      let totalErrors = 0;
      let totalWarnings = 0;
      const zoneResults: IZoneResult[] = [];

      let changedFiles: string[] = [];
      const hasOnlyZone = config.zones?.onlyZone !== undefined;

      if (
        (this.options.onlyChangedFiles || config.onlyChangedFiles) &&
        !hasOnlyZone
      ) {
        changedFiles = await getChangedFiles(this.fileScanner, this.logger);
        if (changedFiles.length === 0) {
          this.logger.info(
            'No files staged for commit found. Nothing to check.'
          );
          return returnEarly(startTime);
        }
      } else if (hasOnlyZone) {
        this.logger.info(
          `🎯 Only checking zone: ${config.zones?.onlyZone} (onlyChangedFiles disabled)`
        );
      }

      for (const zone of zonesToValidate) {
        const zoneResult = await processZone({
          zone,
          config,
          changedFiles,
          hasOnlyZone,
          options: this.options,
          rootDir: this.options.rootDir,
          logger: this.logger,
          fileScanner: this.fileScanner,
          ruleEngine: this.ruleEngine,
          projectInfo,
        });

        zoneResults.push(zoneResult);
        totalFiles += zoneResult.filesProcessed;
        totalErrors += zoneResult.errorsCount;
        totalWarnings += zoneResult.warningsCount;
      }

      const result = createSummary(
        zoneResults,
        totalFiles,
        totalErrors,
        totalWarnings,
        startTime
      );

      // Pasar la opción al reporter
      this.reporter.includeCollaborators = includeCollaborators;
      // Generate the report and get processed error/warning counts
      const reportResult = await generateReport(
        this.reporter,
        this.logger,
        zoneResults,
        projectInfo,
        config
      );

      // Use processed counts from Reporter for console summary
      // Obtener datos por zona del Reporter para el resumen
      const processed = this.reporter.processErrors(reportResult.zoneErrors);
      logSummary(
        this.logger,
        result.summary,
        totalFiles,
        reportResult.totalErrors,
        reportResult.totalWarnings,
        {
          errorsByZone: processed.errorsByZone,
          warningsByZone: processed.warningsByZone,
          infosByZone: processed.infosByZone,
        }
      );

      // Return result, but override totalErrors/totalWarnings to match processed counts
      return {
        ...result,
        totalErrors: reportResult.totalErrors,
        totalWarnings: reportResult.totalWarnings,
      };
    } catch (error) {
      this.logger.error('💥 Validation failed:', error);
      throw error;
    }
  }

  /**
   * Determine which zones to validate based on project structure and options
   */
  private determineZones(
    projectInfo: IProjectInfo | { zones: string[] | { name: string }[] },
    config: IStandardsConfiguration
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
export * from './types/standardConfiguration.type.js';
