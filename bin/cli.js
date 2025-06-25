#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { FrontendStandardsChecker } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

const program = new Command();

program
  .name('check-frontend-standards')
  .description('A comprehensive frontend standards validation tool')
  .version(packageJson.version)
  .option(
    '-z, --zones <zones...>',
    'Specific zones to check (space-separated)',
    []
  )
  .option('-c, --config <path>', 'Path to custom configuration file')
  .option('-o, --output <path>', 'Path for output log file')
  .option('-v, --verbose', 'Show verbose output')
  .option('--debug', 'Show debug information about file scanning')
  .option('--skip-structure', 'Skip directory structure validation')
  .option('--skip-naming', 'Skip naming convention validation')
  .option('--skip-content', 'Skip content validation')
  .action(async (options) => {
    try {
      console.log(chalk.blue(`🔍 Frontend Standards Checker v${packageJson.version}`));
      console.log(chalk.gray('Analyzing your frontend project...\n'));

      const checker = new FrontendStandardsChecker({
        zones: options.zones,
        configPath: options.config,
        outputPath: options.output,
        verbose: options.verbose,
        debug: options.debug,
        skipStructure: options.skipStructure,
        skipNaming: options.skipNaming,
        skipContent: options.skipContent,
      });

      const results = await checker.run();

      if (results.totalErrors === 0) {
        console.log(
          chalk.green(
            '✅ All files and zones comply with the defined standards!'
          )
        );
        process.exit(0);
      } else {
        console.log(
          chalk.red(
            `❌ Found ${results.totalErrors} violations across ${
              Object.keys(results.zoneErrors).length
            } zones`
          )
        );
        console.log(
          chalk.yellow(`📋 Check the detailed report at: ${results.logFile}`)
        );
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error running standards checker:'));
      console.error(chalk.red(error.message));
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program.parse();
