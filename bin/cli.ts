#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { FrontendStandardsChecker } from '../src/index.js';
import type { ICliOptions } from '../src/types';

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
    version: '0.0.12',
    name: 'frontend-standards-checker',
  };
}

const packageJson: PackageJson = findPackageJson();

import { writeFileSync, existsSync, appendFileSync, copyFileSync } from 'fs';

const program = new Command();

program
  .name('frontend-standards-checker')
  .description(
    'A comprehensive frontend standards validation tool with TypeScript support'
  )
  .version(packageJson.version);

// Comando principal de validación
program
  .command('check')
  .description('Run standards validation')
  .option(
    '-z, --zones <zones...>',
    'Specific zones to check (space-separated)',
    []
  )
  .option('-c, --config <path>', 'Path to custom configuration file')
  .option('-v, --verbose', 'Show verbose output')
  .option('--debug', 'Show debug information about file scanning')
  .option('--skip-structure', 'Skip directory structure validation')
  .option('--skip-naming', 'Skip naming convention validation')
  .option('--skip-content', 'Skip content validation')
  .option(
    '--only-changed-files',
    'Only check files that are staged for commit (default: true)'
  )
  .action(async (options: ICliOptions) => {
    try {
      console.log(
        chalk.blue(`🔍 Frontend Standards Checker v${packageJson.version}`)
      );
      console.log(
        chalk.gray(
          'Analyzing your frontend project with TypeScript support...\n'
        )
      );

      const checkerOptions: any = {
        zones: options.zones || [],
        config: options.config || null,
        verbose: options.verbose || false,
        debug: options.debug || false,
        skipStructure: options.skipStructure || false,
        skipNaming: options.skipNaming || false,
        skipContent: options.skipContent || false,
      };
      if (typeof options.onlyChangedFiles === 'boolean') {
        checkerOptions.onlyChangedFiles = options.onlyChangedFiles;
      }
      const checker = new FrontendStandardsChecker(checkerOptions);

      const result = await checker.run();

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

// Comando init para agregar scripts y actualizar .gitignore
program
  .command('init')
  .description(
    'Add standards script to package.json, update .gitignore, and copy guide/config files'
  )
  .action(() => {
    const cwd = process.cwd();
    const pkgPath = join(cwd, 'package.json');
    const gitignorePath = join(cwd, '.gitignore');

    // 1. Copiar archivos de guía y configuración si no existen
    const filesToCopy = [
      {
        src: join(__dirname, '../../checkFrontendStandards.COMPLETE-GUIDE.md'),
        dest: join(cwd, 'checkFrontendStandards.COMPLETE-GUIDE.md'),
        label: 'Guía completa',
      },
      {
        src: join(__dirname, '../../checkFrontendStandards.config.mjs'),
        dest: join(cwd, 'checkFrontendStandards.config.mjs'),
        label: 'Archivo de configuración',
      },
    ];
    for (const file of filesToCopy) {
      try {
        if (!existsSync(file.dest)) {
          copyFileSync(file.src, file.dest);
          console.log(chalk.green(`✅ ${file.label} copied: ${file.dest}`));
        } else {
          console.log(chalk.gray(`ℹ️  ${file.label} already exists: ${file.dest}`));
        }
      } catch (e) {
        console.error(chalk.red(`❌ Could not copy ${file.label}:`), e);
      }
    }

    // 2. Actualizar package.json
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      if (!pkg.scripts) pkg.scripts = {};
      if (!pkg.scripts['standards']) {
        pkg.scripts['standards'] = 'frontend-standards-checker check';
        console.log(
          chalk.green('✅ Script "standards" added to package.json.')
        );
      } else {
        console.log(
          chalk.yellow('ℹ️  Script "standards" already exists in package.json.')
        );
      }
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    } catch (e) {
      console.error(chalk.red('❌ Could not update package.json:'), e);
    }

    // 3. Actualizar .gitignore
    const ignoreList = [
      'logs-standards-validations/',
    ];
    try {
      let gitignoreContent = '';
      if (existsSync(gitignorePath)) {
        gitignoreContent = readFileSync(gitignorePath, 'utf8');
      }
      let added = false;
      for (const item of ignoreList) {
        if (!gitignoreContent.split('\n').includes(item)) {
          appendFileSync(
            gitignorePath,
            (gitignoreContent && !gitignoreContent.endsWith('\n') ? '\n' : '') +
              item +
              '\n'
          );
          added = true;
          console.log(chalk.green(`✅ Added to .gitignore: ${item}`));
        } else {
          console.log(chalk.gray(`ℹ️  Already exists in .gitignore: ${item}`));
        }
      }
      if (!added) {
        console.log(
          chalk.yellow('ℹ️  All items were already in .gitignore.')
        );
      }
    } catch (e) {
      console.error(chalk.red('❌ Could not update .gitignore:'), e);
    }

    // 4. Agregar hook pre-commit de Husky (solo si el entorno está inicializado)
    const huskyDir = join(cwd, '.husky');
    const huskyPreCommit = join(huskyDir, 'pre-commit');
    const huskySh = join(huskyDir, '_', 'husky.sh');
    try {
      if (existsSync(huskySh)) {
        let preCommitContent = '';
        if (existsSync(huskyPreCommit)) {
          preCommitContent = readFileSync(huskyPreCommit, 'utf8');
          const usesYarn = existsSync(join(cwd, 'yarn.lock'));
          const cmd = usesYarn ? 'yarn standards' : 'npm run standards';
          if (!preCommitContent.includes(cmd)) {
            const marker = 'echo "Pre-commit hooks completed"';
            if (preCommitContent.includes(marker)) {
              // Insertar antes del marker
              const lines = preCommitContent.split('\n');
              const idx = lines.findIndex((line) => line.trim() === marker);
              if (idx !== -1) {
                lines.splice(idx, 0, cmd);
                writeFileSync(huskyPreCommit, lines.join('\n'), {
                  mode: 0o755,
                });
                console.log(
                  chalk.green(
                    `✅ Insertado '${cmd}' antes de '${marker}' en .husky/pre-commit`
                  )
                );
              } else {
                appendFileSync(huskyPreCommit, `\n${cmd}\n`);
                console.log(
                  chalk.green(
                    `✅ Añadido '${cmd}' al final de .husky/pre-commit`
                  )
                );
              }
            } else {
              appendFileSync(huskyPreCommit, `\n${cmd}\n`);
              console.log(
                chalk.green(`✅ Añadido '${cmd}' al final de .husky/pre-commit`)
              );
            }
          } else {
            console.log(
              chalk.gray(
                'ℹ️  El hook pre-commit de Husky ya contiene el comando de estándares.'
              )
            );
          }
        } else {
          const usesYarn = existsSync(join(cwd, 'yarn.lock'));
          const cmd = usesYarn ? 'yarn standards' : 'npm run standards';
          const script = `#!/bin/sh\n. "$(dirname \"$0\")/_/husky.sh"\n${cmd}\n`;
          writeFileSync(huskyPreCommit, script, { mode: 0o755 });
          console.log(chalk.green(`✅ Creado .husky/pre-commit con '${cmd}'`));
        }
      } else {
        console.log(
          chalk.yellow(
            '⚠️  Husky is not initialized in this project. If you want to use hooks, run "npx husky install" first.'
          )
        );
      }
    } catch (e) {
      console.error(
        chalk.red('❌ Could not create or update Husky pre-commit:'),
        e
      );
    }

    // Mensaje final
    console.log(
      chalk.blue(
        '\n🎉 Configuration complete. You can use "yarn standards" or "npm run standards" to validate your project.'
      )
    );
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
