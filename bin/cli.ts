#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { FrontendStandardsChecker } from '../src/index.js';
import type { CliOptions } from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface PackageJson {
  version: string;
  name: string;
  description?: string;
}

// Función para buscar el package.json en varias ubicaciones posibles
function findPackageJson(): PackageJson {
  const possibleLocations = [
    join(__dirname, '../package.json'), // Desarrollo local
    join(__dirname, '../../package.json'), // Instalado como dependencia
    join(process.cwd(), 'package.json'), // Directorio actual de trabajo
    join(__dirname, '../../../package.json'), // Otra posible ubicación en node_modules
  ];

  for (const location of possibleLocations) {
    try {
      return JSON.parse(readFileSync(location, 'utf8'));
    } catch (e) {
      // Intentar con la siguiente ubicación
    }
  }

  // Si no encontramos el package.json, usar valores predeterminados
  return {
    version: '4.9.0',
    name: 'frontend-standards-checker',
  };
}

const packageJson: PackageJson = findPackageJson();

const program = new Command();

program
  .name('frontend-standards-checker')
  .description(
    'A comprehensive frontend standards validation tool with TypeScript support'
  )
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
  .option(
    '--only-changed-files',
    'Only check files that are staged for commit (default: true)'
  )
  .action(async (options: CliOptions) => {
    try {
      console.log(
        chalk.blue(`🔍 Frontend Standards Checker v${packageJson.version}`)
      );
      console.log(
        chalk.gray(
          'Analyzing your frontend project with TypeScript support...\n'
        )
      );

      const checker = new FrontendStandardsChecker({
        zones: options.zones || [],
        config: options.config || null,
        output: options.output || null,
        verbose: options.verbose || false,
        debug: options.debug || false,
        onlyChangedFiles: options.onlyChangedFiles || false,
        skipStructure: options.skipStructure || false,
        skipNaming: options.skipNaming || false,
        skipContent: options.skipContent || false,
      });

      const result = await checker.run();

      // Exit with appropriate code
      const exitCode = result.success ? 0 : 1;

      if (result.success) {
        console.log(chalk.green('\n✅ All validations passed!'));
      } else {
        console.log(chalk.red(`\n❌ Found ${result.totalErrors} errors`));
        if (result.totalWarnings > 0) {
          console.log(
            chalk.yellow(`⚠️  Found ${result.totalWarnings} warnings`)
          );
        }
      }

      process.exit(exitCode);
    } catch (error) {
      console.error(chalk.red('💥 Error running validation:'));
      console.error(error);
      process.exit(1);
    }
  });

// Handle unknown commands
program.on('command:*', function (operands: string[]) {
  console.error(chalk.red(`Unknown command: ${operands[0]}`));
  console.log(chalk.yellow('Use --help to see available commands'));
  process.exit(1);
});

// Parse command line arguments
program.parse(process.argv);

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
