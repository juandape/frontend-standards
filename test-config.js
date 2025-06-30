/**
 * Test configuration file to verify rule names work correctly
 */

export default {
  merge: true,
  zones: {
    includePackages: false,
    customZones: [],
  },
  rules: {
    // Structure rules
    'Missing index.ts in organization folders': true,
    'Missing test files': 'info',

    // Naming rules
    'Component naming': true,
    'Hook naming': 'error',
    'Type naming': true,
    'Interface naming with I prefix': 'error',
    'Helper naming': true,
    'Style naming': true,
    'Folder naming convention': true,
    'Constants naming': 'info',

    // Content rules
    'No console.log': true,
    'No var': 'error',
    'No any type': 'warning',
    'No alert': true,
    'Must use async/await': 'warning',

    // TypeScript rules
    'Prefer type over interface for unions': 'warning',

    // Documentation rules
    'Should have TSDoc comments': 'info',
    'JSDoc for complex functions': 'info',
    'Missing comment in complex function': 'warning',
  },
};
