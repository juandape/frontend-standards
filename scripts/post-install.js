#!/usr/bin/env node

/**
 * Post-Install Script
 * Automatically builds the project after installation
 * Graceful fallback if Bun is not available
 */

const { spawn } = require('child_process');
const { existsSync } = require('fs');

async function checkBunAvailability() {
  return new Promise((resolve) => {
    const child = spawn('bun', ['--version'], { stdio: 'pipe' });
    child.on('close', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

async function buildWithBun() {
  console.log('🍞 Building with Bun...');

  return new Promise((resolve, reject) => {
    const child = spawn('node', ['scripts/build-cross-platform.js'], {
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error('Bun build failed'));
      }
    });

    child.on('error', (err) => reject(err));
  });
}

async function buildWithTypeScript() {
  console.log('📝 Building TypeScript...');

  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['tsc'], { stdio: 'inherit' });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ TypeScript build completed');
        console.log('📋 Ready to use with:');
        console.log('  node launcher.cjs --help');
        console.log('  npx frontend-standards-checker --help');
        resolve(true);
      } else {
        reject(new Error('TypeScript compilation failed'));
      }
    });

    child.on('error', (err) => reject(err));
  });
}

async function main() {
  try {
    // Skip post-install if we're in development (has source files)
    if (existsSync('src') && existsSync('bin/cli.ts')) {
      console.log('🏗️  Development environment detected, skipping post-install build');
      return;
    }

    console.log('🚀 Setting up frontend-standards-checker...');

    const bunAvailable = await checkBunAvailability();

    if (bunAvailable) {
      console.log('✅ Bun detected - building standalone executables');
      await buildWithBun();

    } else {
      console.log('⚠️  Bun not found - using TypeScript fallback');
      console.log('💡 For executable builds, install Bun: https://bun.sh');
      await buildWithTypeScript();
    }

    console.log('\n🎉 Installation completed successfully!');

  } catch (error) {
    console.warn('⚠️  Post-install build failed:', error.message);
    console.log('\n💡 You can manually build later:');
    console.log('- With Bun: node scripts/build-cross-platform.js');
    console.log('- Without Bun: npx tsc');
    console.log('\n✨ The package will still work, just run:');
    console.log('  npx frontend-standards-checker --help');

    // Don't fail the installation, just warn
    process.exit(0);
  }
}

main(); 
