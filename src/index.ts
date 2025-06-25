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
  private readonly options: Required<CliOptions> & { rootDir: string };
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
      this.options.output,
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
      const projectInfo = await this.projectAnalyzer.analyze();
      this.logger.info(`📁 Project type: ${projectInfo.projectType}`);
      this.logger.info(`🏗️ Monorepo: ${projectInfo.isMonorepo ? 'Yes' : 'No'}`);

      // Determine zones to validate
      const zonesToValidate = this.determineZones(projectInfo, config);
      this.logger.info(`🎯 Zones to validate: ${zonesToValidate.join(', ')}`);

      // Initialize rule engine with configuration
      this.ruleEngine.initialize(config, {
        skipStructure: this.options.skipStructure,
        skipNaming: this.options.skipNaming,
        skipContent: this.options.skipContent,
      });

      // Process each zone
      const zoneResults: ZoneResult[] = [];
      let totalFiles = 0;
      let totalErrors = 0;
      let totalWarnings = 0;

      for (const zone of zonesToValidate) {
        this.logger.info(`\n📂 Processing zone: ${zone}`);

        const files = await this.fileScanner.scanZone(zone, {
          extensions: config.extensions || ['.js', '.ts', '.jsx', '.tsx'],
          ignorePatterns: config.ignorePatterns || [],
          zones: zonesToValidate,
          includePackages: config.zones?.includePackages || false,
          customZones: config.zones?.customZones || [],
        });

        if (this.options.debug) {
          this.logger.debug(
            `📁 Debug: Files found in zone "${zone}":`,
            files.map((f: any) => f.path)
          );
        }

        const zoneErrors: ValidationError[] = [];

        for (const file of files) {
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
          filesProcessed: files.length,
          errors: zoneErrors,
          errorsCount: zoneErrorsCount,
          warningsCount: zoneWarningsCount,
        };

        zoneResults.push(zoneResult);
        totalFiles += files.length;
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
      });

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

    // Add custom zones from config
    if (config.zones?.customZones) {
      zones.push(...config.zones.customZones);
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
