import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { ConfigLoader } from './core/config-loader.js';
import { ProjectAnalyzer } from './core/project-analyzer.js';
import { RuleEngine } from './core/rule-engine.js';
import { Reporter } from './core/reporter.js';
import { FileScanner } from './utils/file-scanner.js';
import { Logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main Frontend Standards Checker class
 * Orchestrates the validation process and coordinates all modules
 */
export class FrontendStandardsChecker {
  constructor(options = {}) {
    this.options = {
      zones: [],
      configPath: null,
      outputPath: null,
      verbose: false,
      debug: false,
      skipStructure: false,
      skipNaming: false,
      skipContent: false,
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
      this.options.outputPath,
      this.logger
    );
  }

  /**
   * Main execution method
   * @returns {Promise<Object>} Results object with errors and statistics
   */
  async run() {
    try {
      this.logger.info('🚀 Starting Frontend Standards Validation');

      // Load configuration
      const config = await this.configLoader.load(this.options.configPath);
      this.logger.debug('Configuration loaded:', config);

      // Analyze project structure with configuration
      const projectInfo = await this.projectAnalyzer.analyze(config);
      this.logger.debug('Project analysis complete:', projectInfo);

      // Determine zones to check
      const zones = this.determineZones(projectInfo);
      this.logger.info(
        `📂 Checking ${zones.length} zones: ${zones
          .map((z) => z.name)
          .join(', ')}`
      );

      // Initialize rule engine with configuration
      await this.ruleEngine.initialize(config.rules);

      // Validate each zone
      const zoneErrors = {};
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
      this.logger.error('Fatal error during validation:', error);
      throw error;
    }
  }

  /**
   * Validate a specific zone
   * @param {Object} zone Zone information
   * @param {Object} config Configuration object
   * @returns {Promise<Array>} Array of validation errors
   */
  async validateZone(zone, config) {
    const errors = [];

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
      this.logger.error(`Error validating zone ${zone.name}:`, error);
      errors.push({
        rule: 'Zone validation error',
        message: `Failed to validate zone: ${error.message}`,
        file: zone.path,
      });
    }

    return errors;
  }

  /**
   * Validate zone structure
   */
  async validateStructure(zone, config) {
    // Implementation will be moved to structure validator
    return [];
  }

  /**
   * Validate file content
   */
  async validateContent(zone, config) {
    const errors = [];
    const files = await this.fileScanner.getFiles(zone.path);

    if (this.options.debug) {
      this.logger.info(`📁 Debug: Files found in zone "${zone.name}":`);
      files.forEach((file) => {
        const relativePath = path.relative(this.options.rootDir, file);
        this.logger.info(`  ✓ ${relativePath}`);
      });
      this.logger.info(`📊 Total files to validate: ${files.length}\n`);
    }

    for (const file of files) {
      const fileErrors = await this.ruleEngine.validateFile(file);
      errors.push(...fileErrors);
    }

    return errors;
  }

  /**
   * Validate naming conventions
   */
  async validateNaming(zone, config) {
    const errors = [];

    try {
      // Get all files and directories in the zone
      const files = await this.fileScanner.getFiles(zone.path);
      const directories = await this.fileScanner.getDirectories(zone.path);

      // Use project analyzer to validate zone structure and naming
      const structureErrors = await this.projectAnalyzer.validateZoneStructure(
        files,
        directories,
        zone.name
      );
      errors.push(...structureErrors);
    } catch (error) {
      this.logger.error(
        `Error validating naming for zone ${zone.name}:`,
        error
      );
      errors.push({
        rule: 'Naming validation error',
        message: `Failed to validate naming: ${error.message}`,
        file: zone.path,
      });
    }

    return errors;
  }

  /**
   * Determine which zones to check based on project structure and options
   */
  determineZones(projectInfo) {
    if (this.options.zones.length > 0) {
      // Use specified zones
      return this.options.zones
        .map((zoneName) => ({
          name: zoneName,
          path: path.join(this.options.rootDir, zoneName),
          type: this.projectAnalyzer.detectZoneType(
            path.join(this.options.rootDir, zoneName)
          ),
        }))
        .filter((zone) => fs.existsSync(zone.path));
    }

    // Auto-detect zones based on project structure
    return (
      projectInfo.zones || [
        {
          name: 'root',
          path: this.options.rootDir,
          type: projectInfo.type,
        },
      ]
    );
  }
}

// Export for CLI usage
export default FrontendStandardsChecker;
