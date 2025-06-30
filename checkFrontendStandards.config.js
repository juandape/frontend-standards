/**
 * @fileoverview Configuration file for frontend-standards-checker
 *
 * This file allows you to customize rules and zones for the frontend standards validation tool.
 * Multiple configuration patterns are supported for maximum flexibility:
 *
 * **Object Configuration:**
 * - `merge`: Boolean to control if custom rules merge with defaults
 * - `zones`: Object to configure which directories to validate
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
 * @version 4.5.0
 * @since 2024-01-15
 * @see {@link https://github.com/juandape/frontend-standards} Documentation
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
 *   zones: import('./src/types.js').ZoneConfiguration,
 *   rules: import('./src/types.js').ValidationRule[]
 * }}
 */
export default {
  // Merge custom rules with default rules (default: true)
  merge: true,

  // Zone configuration
  zones: {
    // Whether to include 'packages' directory in validation (default: false)
    includePackages: false,

    // Custom zones to include in validation
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
    // Example: Override existing rule severity (using object format)
    // To use object format, change the rules array to an object like this:
    // rules: {
    //   "Missing index.ts in organization folders": "error",
    //   "No console.log": "warning",
    //   "Interface naming with I prefix": "error",
    //   "Hook naming": true,
    //   "Component naming": true,
    //   "Should have TSDoc comments": "info"
    // }
  ],
};

// Alternative configurations:

// 1. Export only custom rules (replaces all default rules)
// export default {
//   merge: false,
//   rules: [
//     {
//       name: 'Custom rule only',
//       check: (content) => content.includes('bad-pattern'),
//       message: 'This is a custom validation.',
//     },
//   ],
// }

// 2. Export rules in object format (easier to configure existing rules)
// export default {
//   zones: {
//     includePackages: true, // Include packages/ in validation
//   },
//   rules: {
//     // Structure rules
//     "Missing index.ts in organization folders": "warning",
//     "Missing test files": "info",
//
//     // Naming rules
//     "Component naming": true,
//     "Hook naming": "error",
//     "Interface naming with I prefix": "error",
//     "Helper naming": true,
//     "Style naming": true,
//
//     // Content quality rules
//     "No console.log": true,
//     "No var": "error",
//     "No any type": "warning",
//     "Must use async/await": "warning",
//
//     // TypeScript rules
//     "Prefer type over interface for unions": "warning",
//
//     // Documentation rules
//     "Should have TSDoc comments": "info",
//     "JSDoc for complex functions": "info"
//   }
// }

// 3. Export a function that receives default rules
// export default function(defaultRules) {
//   return [
//     ...defaultRules,
//     {
//       name: 'Dynamic custom rule',
//       check: (content) => content.includes('dynamic-pattern'),
//       message: 'This rule was added dynamically.',
//     },
//   ]
// }

// 4. Export array of rules directly (merges with defaults)
// export default [
//   {
//     name: 'Array-based rule',
//     check: (content) => content.includes('array-pattern'),
//     message: 'This rule comes from an array export.',
//   },
// ]

// 5. Example with packages enabled and object format rules
// export default {
//   zones: {
//     includePackages: true, // This will include packages/ in validation
//     customZones: ['shared', 'tools'], // Additional folders to validate
//   },
//   rules: [
//     // Custom rules here
//   ],
// }
