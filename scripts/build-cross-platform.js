#!/usr/bin/env node

/**
 * Cross-platform Build Script
 * Builds executables for all platforms if Bun is available
 * Graceful fallback to TypeScript compilation if not
 */

const { spawn } = require('child_process');
const { mkdirSync, existsSync } = require('fs');

async function checkBunAvailability() {
  return new Promise((resolve) => {
    const child = spawn('bun', ['--version'], { stdio: 'pipe' });
    child.on('close', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

async function buildForPlatform(platform, target, outfile) {
  console.log(`🌍 Building for ${platform}...`);

  return new Promise((resolve, reject) => {
    const child = spawn('bun', [
      'build', 'bin/cli.ts',
      '--compile', '--minify', '--sourcemap',
      `--target=${target}`,
      `--outfile=dist/bin/${outfile}`
    ], { stdio: 'inherit' });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${platform} build completed`);
        resolve(true);
      } else {
        reject(new Error(`${platform} build failed`));
      }
    });

    child.on('error', (err) => reject(err));
  });
}

async function buildAllPlatforms() {
  console.log('🍞 Building executables for all platforms with Bun...');

  // Ensure dist/bin directory exists
  if (!existsSync('dist')) mkdirSync('dist');
  if (!existsSync('dist/bin')) mkdirSync('dist/bin');

  try {
    await Promise.all([
      buildForPlatform('Linux x64', 'bun-linux-x64', 'frontend-standards-linux'),
      buildForPlatform('Windows x64', 'bun-windows-x64', 'frontend-standards-windows'),
      buildForPlatform('macOS ARM64', 'bun-darwin-arm64', 'frontend-standards-darwin-arm64'),
      buildForPlatform('macOS x64', 'bun-darwin-x64', 'frontend-standards-darwin-x64')
    ]);

    console.log('🎉 All platform executables built successfully!');
    console.log('\n📦 Generated executables:');
    console.log('  dist/bin/frontend-standards-linux');
    console.log('  dist/bin/frontend-standards-windows.exe');
    console.log('  dist/bin/frontend-standards-darwin-arm64');
    console.log('  dist/bin/frontend-standards-darwin-x64');

  } catch (error) {
    throw new Error(`Cross-platform build failed: ${error.message}`);
  }
}

async function buildTypeScriptFallback() {
  console.log('📝 Building TypeScript fallback...');

  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['tsc'], { stdio: 'inherit' });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ TypeScript compilation completed');
        console.log('\n📋 Usage without executables:');
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
    console.log('🔍 Checking for Bun availability...');

    const bunAvailable = await checkBunAvailability();

    if (bunAvailable) {
      console.log('✅ Bun detected - building standalone executables');
      await buildAllPlatforms();
    } else {
      console.log('⚠️  Bun not found - using TypeScript fallback');
      console.log('💡 Install Bun (https://bun.sh) for standalone executable builds');
      await buildTypeScriptFallback();
    }

    console.log('\n🎯 Build completed successfully!');

  } catch (error) {
    console.error('❌ Build failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('- Ensure Node.js >= 18 is installed');
    console.log('- For executable builds: install Bun from https://bun.sh');
    console.log('- For basic usage: TypeScript compilation works with any package manager');

    process.exit(1);
  }
}

main(); 
