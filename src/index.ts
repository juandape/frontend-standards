import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { ConfigLoader } from "./core/config-loader.js";
import { ProjectAnalyzer } from "./core/project-analyzer.js";
import { RuleEngine } from "./core/rule-engine.js";
import { Reporter } from "./core/reporter.js";
import { FileScanner } from "./utils/file-scanner.js";
import { Logger } from "./utils/logger.js";

import type {
  ICheckerOptions,
  IValidationError,
  IValidationResults,
} from "./types/frontend-standards-checker.types.js";
import type { IProjectInfo, IProjectZone } from "./types/project.types.js";
import type { IProjectConfig } from "./types/config.types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main Frontend Standards Checker class
 * Orchestrates the validation process and coordinates all modules
 */
export class FrontendStandardsChecker {
  private options: Required<ICheckerOptions>;
  private logger: Logger;
  private configLoader: ConfigLoader;
  private projectAnalyzer: ProjectAnalyzer;
  private fileScanner: FileScanner;
  private ruleEngine: RuleEngine;
  private reporter: Reporter;

  constructor(options: ICheckerOptions = {}) {
    this.options = {
      zones: [],
      configPath: null,
      outputPath: null,
      verbose: false,
      skipStructure: false,
      skipNaming: false,
      skipContent: false,
      rootDir: process.cwd(),
      ...options,
    };

    this.logger = new Logger(this.options.verbose);
    this.configLoader = new ConfigLoader(this.options.rootDir, this.logger);
    this.projectAnalyzer = new ProjectAnalyzer(
      this.options.rootDir,
      this.logger
    );
    this.fileScanner = new FileScanner(this.options.rootDir, this.logger);
    this.ruleEngine = new RuleEngine(this.logger);
    this.reporter = new Reporter(
      this.options.rootDir,
      this.options.outputPath,
      this.logger
    );
  }

  /**
   * Main execution method
   */
  async run(): Promise<IValidationResults> {
    try {
      this.logger.info("🚀 Starting Frontend Standards Validation");

      // Load configuration
      const config = await this.configLoader.load(this.options.configPath);
      this.logger.debug("Configuration loaded:", config);

      // Analyze project structure
      const projectInfo = await this.projectAnalyzer.analyze();
      this.logger.debug("Project analysis complete:", projectInfo);

      // Determine zones to check
      const zones = this.determineZones(projectInfo);
      this.logger.info(
        `📂 Checking ${zones.length} zones: ${zones
          .map((z) => z.name)
          .join(", ")}`
      );

      // Initialize rule engine with configuration
      await this.ruleEngine.initialize(config.rules);

      // Validate each zone
      const zoneErrors: Record<string, IValidationError[]> = {};
      for (const zone of zones) {
        this.logger.info(`🔍 Validating zone: ${zone.name}`);
        const errors = await this.validateZone(zone, config);
        if (errors.length > 0) {
          zoneErrors[zone.name] = errors;
        }
      }

      // Generate and save report
      const results = await this.reporter.generate(
        zoneErrors,
        projectInfo,
        config
      );

      this.logger.info(
        `📋 Validation complete. Report saved to: ${results.logFile}`
      );
      return results;
    } catch (error) {
      this.logger.error("Fatal error during validation:", error);
      throw error;
    }
  }

  /**
   * Validate a specific zone
   */
  private async validateZone(
    zone: IProjectZone,
    config: IProjectConfig
  ): Promise<IValidationError[]> {
    const errors: IValidationError[] = [];

    try {
      // Structure validation
      if (!this.options.skipStructure) {
        const structureErrors = await this.validateStructure(zone, config);
        errors.push(...structureErrors);
      }

      // File content validation
      if (!this.options.skipContent) {
        const contentErrors = await this.validateContent(zone, config);
        errors.push(...contentErrors);
      }

      // Naming convention validation
      if (!this.options.skipNaming) {
        const namingErrors = await this.validateNaming(zone, config);
        errors.push(...namingErrors);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Error validating zone ${zone.name}:`, error);
      errors.push({
        rule: "Zone validation error",
        message: `Failed to validate zone: ${errorMessage}`,
        file: zone.path,
      });
    }

    return errors;
  }

  /**
   * Validate zone structure
   */
  private async validateStructure(
    zone: IProjectZone,
    config: IProjectConfig
  ): Promise<IValidationError[]> {
    // Implementation will be moved to structure validator
    return [];
  }

  /**
   * Validate file content
   */
  private async validateContent(
    zone: IProjectZone,
    config: IProjectConfig
  ): Promise<IValidationError[]> {
    const errors: IValidationError[] = [];
    const files = await this.fileScanner.getFiles(zone.path);

    for (const file of files) {
      const fileErrors = await this.ruleEngine.validateFile(file);
      errors.push(...fileErrors);
    }

    return errors;
  }

  /**
   * Validate naming conventions
   */
  private async validateNaming(
    zone: IProjectZone,
    config: IProjectConfig
  ): Promise<IValidationError[]> {
    // Implementation will be moved to naming validator
    return [];
  }

  /**
   * Determine which zones to check based on project structure and options
   */
  private determineZones(projectInfo: IProjectInfo): IProjectZone[] {
    if (this.options.zones.length > 0) {
      // Use specified zones
      return this.options.zones
        .map(
          (zoneName): IProjectZone => ({
            name: zoneName,
            path: path.join(this.options.rootDir, zoneName),
            type: this.projectAnalyzer.detectZoneType(
              path.join(this.options.rootDir, zoneName)
            ),
          })
        )
        .filter((zone) => fs.existsSync(zone.path));
    }

    // Auto-detect zones based on project structure
    return (
      projectInfo.zones || [
        {
          name: "root",
          path: this.options.rootDir,
          type: projectInfo.type,
        },
      ]
    );
  }
}

// Export for CLI usage
export default FrontendStandardsChecker;
