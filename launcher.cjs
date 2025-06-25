#!/usr/bin/env node
"use strict";

/**
 * Frontend Standards Checker - Platform Launcher
 * Automatically detects the platform and runs the appropriate binary.
 * Follows industry standards used by tools like esbuild, swc, prisma, etc.
 */

const { spawn } = require('child_process');
const { join } = require('path');
const { existsSync } = require('fs');
const { platform, arch } = require('os');

// Platform detection map
const PLATFORM_MAP = {
  linux: {
    x64: 'frontend-standards-linux',
    arm64: 'frontend-standards-linux', // Linux x64 binary works on ARM64 via emulation
  },
  darwin: {
    x64: 'frontend-standards-darwin-x64',
    arm64: 'frontend-standards-darwin-arm64',
  },
  win32: {
    x64: 'frontend-standards-windows.exe',
    arm64: 'frontend-standards-windows.exe', // Windows x64 binary works on ARM64
  },
};

function detectExecutable() {
  const currentPlatform = platform();
  const currentArch = arch();

  let executableName;

  if (currentPlatform === 'linux') {
    executableName = 'frontend-standards-linux';
  } else if (currentPlatform === 'win32') {
    executableName = 'frontend-standards-windows.exe';
  } else if (currentPlatform === 'darwin') {
    executableName = currentArch === 'arm64'
      ? 'frontend-standards-darwin-arm64'
      : 'frontend-standards-darwin-x64';
  } else {
    return null; // Unsupported platform
  }

  const executablePath = join(__dirname, 'dist', 'bin', executableName);
  return existsSync(executablePath) ? executablePath : null;
}

function fallbackToTypeScript() {
  console.log('💡 Using TypeScript runtime (Node.js)...');

  // Try compiled JS first
  const compiledEntry = join(__dirname, 'dist', 'bin', 'cli.js');
  if (existsSync(compiledEntry)) {
    return runCommand('node', [compiledEntry, ...process.argv.slice(2)]);
  }

  // Fallback to TypeScript source
  const tsEntry = join(__dirname, 'bin', 'cli.ts');
  if (existsSync(tsEntry)) {
    // Check if ts-node is available
    try {
      require.resolve('ts-node');
      return runCommand('npx', ['ts-node', tsEntry, ...process.argv.slice(2)]);
    } catch {
      // Try tsx as alternative
      try {
        require.resolve('tsx');
        return runCommand('npx', ['tsx', tsEntry, ...process.argv.slice(2)]);
      } catch {
        console.error('❌ TypeScript runtime not available');
        console.log('\n💡 Install TypeScript support:');
        console.log('  npm install -g ts-node typescript');
        console.log('  # or');
        console.log('  npm install -g tsx');
        console.log('\n🍞 Or install Bun for standalone executables:');
        console.log('  curl -fsSL https://bun.sh/install | bash');
        process.exit(1);
      }
    }
  }

  console.error('❌ No runnable entry point found');
  process.exit(1);
}

function runCommand(command, args) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  child.on('close', (code) => {
    process.exit(code || 0);
  });

  child.on('error', (err) => {
    if (err && 'code' in err && err.code === 'ENOENT') {
      console.error(`❌ Command not found: ${command}`);
      console.log('\n💡 Make sure Node.js is properly installed');
    } else {
      console.error(`❌ Failed to run command: ${err.message}`);
    }
    process.exit(1);
  });
}

function main() {
  // Show help text for invalid usage
  if (process.argv.includes('--launcher-help')) {
    console.log(`
🚀 Frontend Standards Checker Launcher

Usage:
  frontend-standards-checker [options]
  node launcher.cjs [options]
  npx frontend-standards-checker [options]

Execution modes:
  📦 Standalone executable (if built with Bun)
  📝 TypeScript compilation (Node.js fallback)
  🏃 Direct TypeScript execution (ts-node/tsx)

Build executables:
  node scripts/build-cross-platform.js
  
Get help:
  frontend-standards-checker --help
`);
    return;
  }

  try {
    // Try standalone executable first (fastest)
    const executable = detectExecutable();
    if (executable) {
      console.log(`🚀 Using standalone executable for ${platform()}-${arch()}`);
      return runCommand(executable, process.argv.slice(2));
    }

    // Fallback to TypeScript/Node.js
    console.log('⚡ Executable not found, falling back to Node.js runtime');
    fallbackToTypeScript();

  } catch (error) {
    console.error('❌ Launcher failed:', error.message);
    console.log('\n💡 Try:');
    console.log('  node scripts/build-cross-platform.js  # Build executables');
    console.log('  npx tsc                               # Compile TypeScript');
    console.log('  node launcher.cjs --launcher-help     # Show launcher help');
    process.exit(1);
  }
}

main();

module.exports = { detectExecutable, fallbackToTypeScript, runCommand }; 
