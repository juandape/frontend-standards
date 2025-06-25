#!/usr/bin/env node

/**
 * Universal Build Script for Executables
 * Compatible with npm, yarn, pnpm, and bun
 * Automatically detects available tools and provides fallbacks
 */

const { spawn } = require('child_process');
const { existsSync } = require('fs');

const isProduction = process.argv.includes('--production');

async function checkToolAvailability(tool) {
  return new Promise((resolve) => {
    const child = spawn(tool, ['--version'], { stdio: 'pipe' });
    child.on('close', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

async function buildWithBun() {
  console.log('🍞 Building with Bun...');
  const flags = ['build', 'bin/cli.ts', '--compile', '--minify', '--sourcemap'];

  if (isProduction) {
    flags.push('--bytecode');
    console.log('🚀 Production mode: bytecode compilation enabled');
  }

  flags.push('--outfile', 'check-frontend-standards');

  return new Promise((resolve, reject) => {
    const child = spawn('bun', flags, { stdio: 'inherit' });
    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Executable built successfully with Bun');
        resolve(true);
      } else {
        reject(new Error(`Bun build failed with code ${code}`));
      }
    });
    child.on('error', (err) => reject(err));
  });
}

async function buildWithTypeScript() {
  console.log('📝 Building with TypeScript compiler + Node.js...');
  console.log('⚠️  Note: This creates a Node.js script, not a standalone executable');

  return new Promise((resolve, reject) => {
    // First compile TypeScript
    const tscChild = spawn('npx', ['tsc'], { stdio: 'inherit' });

    tscChild.on('close', (code) => {
      if (code === 0) {
        console.log('✅ TypeScript compilation successful');
        console.log('📋 Use "node dist/bin/cli.js" to run the CLI');
        resolve(true);
      } else {
        reject(new Error(`TypeScript compilation failed with code ${code}`));
      }
    });

    tscChild.on('error', (err) => reject(err));
  });
}

function showFallbackMessage() {
  console.log('\n📋 Alternative Usage Options:');
  console.log('1. 🍞 Install Bun for standalone executables: https://bun.sh');
  console.log('2. 📝 Use compiled TypeScript: npm run build && node dist/bin/cli.js');
  console.log('3. 🎯 Use the launcher: node launcher.cjs');
  console.log('4. 📦 Use via npx: npx frontend-standards-checker');
}

async function main() {
  try {
    console.log('🔍 Checking build tools availability...');

    // Check if Bun is available
    const bunAvailable = await checkToolAvailability('bun');

    if (bunAvailable) {
      await buildWithBun();
    } else {
      console.log('⚠️  Bun not found. Using TypeScript compiler fallback...');

      // Check if TypeScript is available
      const tscAvailable = await checkToolAvailability('npx');

      if (tscAvailable) {
        await buildWithTypeScript();
      } else {
        throw new Error('Neither Bun nor TypeScript compiler available');
      }

      showFallbackMessage();
    }

  } catch (error) {
    console.error('❌ Build failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('- Ensure Node.js >= 18 is installed');
    console.log('- For standalone executables, install Bun: https://bun.sh');
    console.log('- For TypeScript compilation, ensure devDependencies are installed');

    process.exit(1);
  }
}

main(); 
