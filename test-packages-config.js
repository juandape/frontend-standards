#!/usr/bin/env node

/**
 * Test script to verify that packages/ zone is only validated when includePackages is true
 */

import { ProjectAnalyzer } from './src/core/project-analyzer.js';
import { Logger } from './src/utils/logger.js';

// Create a test workspace directory structure
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testDir = path.join(__dirname, 'test-workspace');

function createTestWorkspace() {
  // Clean up if exists
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  // Create test workspace structure
  fs.mkdirSync(testDir, { recursive: true });

  // Create packages directory with a test package
  fs.mkdirSync(path.join(testDir, 'packages'), { recursive: true });
  fs.mkdirSync(path.join(testDir, 'packages', 'test-package'), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(testDir, 'packages', 'test-package', 'package.json'),
    JSON.stringify({ name: 'test-package', version: '1.0.0' }, null, 2)
  );

  // Create apps directory with a test app
  fs.mkdirSync(path.join(testDir, 'apps'), { recursive: true });
  fs.mkdirSync(path.join(testDir, 'apps', 'test-app'), { recursive: true });
  fs.writeFileSync(
    path.join(testDir, 'apps', 'test-app', 'package.json'),
    JSON.stringify({ name: 'test-app', version: '1.0.0' }, null, 2)
  );

  // Create root package.json to indicate monorepo
  fs.writeFileSync(
    path.join(testDir, 'package.json'),
    JSON.stringify(
      {
        name: 'test-monorepo',
        workspaces: ['apps/*', 'packages/*'],
      },
      null,
      2
    )
  );

  console.log('✅ Test workspace created at:', testDir);
}

async function testWithIncludePackagesFalse() {
  console.log('\n🧪 Testing with includePackages: false (default)');

  const logger = new Logger(true); // debug mode
  const projectAnalyzer = new ProjectAnalyzer(testDir, logger);

  const config = {
    zones: {
      includePackages: false,
      customZones: [],
    },
  };

  const projectInfo = await projectAnalyzer.analyze(config);

  console.log(
    'Detected zones:',
    projectInfo.zones.map((z) => z.name)
  );

  const hasPackagesZone = projectInfo.zones.some((zone) =>
    zone.name.startsWith('packages/')
  );

  if (hasPackagesZone) {
    console.log(
      '❌ FAIL: packages/ zone was included when it should be excluded'
    );
    return false;
  } else {
    console.log('✅ PASS: packages/ zone correctly excluded');
    return true;
  }
}

async function testWithIncludePackagesTrue() {
  console.log('\n🧪 Testing with includePackages: true');

  const logger = new Logger(true); // debug mode
  const projectAnalyzer = new ProjectAnalyzer(testDir, logger);

  const config = {
    zones: {
      includePackages: true,
      customZones: [],
    },
  };

  const projectInfo = await projectAnalyzer.analyze(config);

  console.log(
    'Detected zones:',
    projectInfo.zones.map((z) => z.name)
  );

  const hasPackagesZone = projectInfo.zones.some((zone) =>
    zone.name.startsWith('packages/')
  );

  if (!hasPackagesZone) {
    console.log(
      '❌ FAIL: packages/ zone was excluded when it should be included'
    );
    return false;
  } else {
    console.log('✅ PASS: packages/ zone correctly included');
    return true;
  }
}

function cleanupTestWorkspace() {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
    console.log('🧹 Test workspace cleaned up');
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting packages configuration tests...\n');

    createTestWorkspace();

    const test1 = await testWithIncludePackagesFalse();
    const test2 = await testWithIncludePackagesTrue();

    cleanupTestWorkspace();

    if (test1 && test2) {
      console.log(
        '\n🎉 All tests passed! The includePackages configuration works correctly.'
      );
      process.exit(0);
    } else {
      console.log('\n💥 Some tests failed. Please check the implementation.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    cleanupTestWorkspace();
    process.exit(1);
  }
}

runTests();
