/**
 * Configuration file for checkFrontendStandards.mjs
 *
 * This file allows you to customize rules and zones for the frontend standards validation script.
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
    // Example: Disable a specific pattern
    // {
    //   name: 'Allow console.warn',
    //   check: (content) => false, // Never triggers
    //   message: 'This rule is disabled.',
    // },
  ],
}

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

// 2. Export a function that receives default rules
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

// 3. Export array of rules directly (merges with defaults)
// export default [
//   {
//     name: 'Array-based rule',
//     check: (content) => content.includes('array-pattern'),
//     message: 'This rule comes from an array export.',
//   },
// ]

// 4. Example with packages enabled
// export default {
//   zones: {
//     includePackages: true, // This will include packages/ in validation
//     customZones: ['shared', 'tools'], // Additional folders to validate
//   },
//   rules: [
//     // Custom rules here
//   ],
// }
