/* eslint-disable import/no-unused-modules */
/**
 * @fileoverview Configuration file for checkFrontendStandards.mjs
 *
 * This file allows you to customize rules and zones for the frontend standards validation script.
 * Multiple configuration patterns are supported for maximum flexibility:
 *
 * **Object Configuration:**
 * - `merge`: Boolean to control if custom rules merge with defaults
 * - `onlyChangedFiles`: 🆕 Boolean to only check files staged for commit (default: true)
 * - `zones`: Object to configure which directories to validate
 *   - `includePackages`: Include packages/ directory in monorepos
 *   - `customZones`: Array of additional directories to validate
 *   - `onlyZone`: String to validate only one specific zone (ignores all others)
 * - `rules`: Array of custom validation rules
 *
 * **Function Configuration:**
 * - Export a function that receives default rules and returns modified rules
 * - Allows dynamic rule generation and conditional logic
 *
 * **Array Configuration:**
 * - Export array of rules directly (automatically merges with defaults)
 * - Simplest approach for adding a few custom rules
 *
 * @author Juan David Peña
 * @license MIT
 * @since 2024-01-15
 * @see {@link ./checkFrontendStandards.mjs} Main validation script
 * @see {@link ./checkFrontendStandards.types.js} Type definitions
 *
 * @example
 * ```js
 * // Basic configuration with custom rules
 * export default {
 *   merge: true,
 *   zones: { includePackages: false, customZones: ['shared'] },
 *   rules: [{ name: 'Custom rule', check: (content) => false, message: 'Custom' }]
 * }
 * ```
 *
 * @example
 * ```js
 * // 🆕 Only validate specific zone (auth example)
 * export default {
 *   zones: { onlyZone: 'auth' },
 *   rules: [{ name: 'Auth security', check: (content) => false, message: 'Secure auth' }]
 * }
 * ```
 *
 * @example
 * ```js
 * // Function-based configuration for dynamic rules
 * export default function(defaultRules) {
 *   return [...defaultRules, { name: 'Dynamic', check: () => false, message: 'Dynamic rule' }]
 * }
 * ```
 *
 * @example
 * ```js
 * // Array export (merges with defaults)
 * export default [
 *   { name: 'Array rule', check: (content) => false, message: 'From array' }
 * ]
 * ```
 */

/**
 * Default configuration object for frontend standards validation.
 *
 * @type {{
 *   merge: boolean,
 *   zones: import('./checkFrontendStandards.types.js').ZoneConfig,
 *   rules: import('./checkFrontendStandards.types.js').ValidationRule[]
 * }}
 */
export default {
  // Merge custom rules with default rules (default: true)
  merge: true,

  // By default, only check files staged for commit (default: true)
  // If set to false, all project files will be checked
  // NOTE: The CLI flags --all-files and --only-changed-files take precedence over this setting
  //
  // Options precedence:
  //   1. --all-files (CLI) - Highest precedence, always processes all files
  //   2. --only-changed-files (CLI) - Forces only staged files
  //   3. onlyChangedFiles (file config) - This option
  //   4. Default value (true - only staged files)
  onlyChangedFiles: true, // Default: true = only files in commit, false = ALL zones and files

  // Zone configuration
  zones: {
    // Whether to include 'packages' directory in validation (default: false)
    includePackages: false,

    // 🎯 NEW OPTION: Review only a specific zone
    // If specified, it will ignore all other zones and only process this one
    // onlyZone: 'auth', // Example: 'auth', 'src', 'components', 'pages', etc.
    // onlyZone: 'src/auth',     // For zone within src
    // onlyZone: 'app/(auth)',   // For Next.js App Router
    // onlyZone: 'packages/ui',  // For monorepos

    // Custom zones to include in validation (ignored if onlyZone is set)
    // If specified, all files in these zones will be checked
    // ignoring the onlyChangedFiles option
    customZones: [
      // 'custom-folder',
      // 'another-folder'
    ],
  },

  // Custom rules to add or override
  rules: [
    // Example: Add a custom rule
    // {
    //   name: 'No TODO comments',
    //   check: (content) => content.includes('TODO'),
    //   message: 'TODO comments should be resolved before committing.',
    // },
    // Example: Disable a specific pattern
    // {
    //   name: 'Allow console.warn',
    //   check: (content) => false, // Never triggers
    //   message: 'This rule is disabled.',
    // },
    // Disable the console.log rule
    // {
    //   name: 'No console.log',
    //   check: () => false, // Never triggers
    //   message: 'Rule disabled',
    // },
    // Disable the English-only comments rule
    // {
    //   name: 'English-only comments',
    //   check: () => false,
    //   message: 'Rule disabled',
    // },
  ],

  // 💡 Practical usage examples:
  //
  // For daily development (only staged files):
  //   frontend-standards-checker check
  //
  // For complete project review:
  //   frontend-standards-checker check --all-files
  //
  // To fully validate a specific zone:
  //   frontend-standards-checker check --all-files --zones src
  //
  // For CI/CD (complete validation with verbose):
  //   frontend-standards-checker check --all-files --verbose
};
