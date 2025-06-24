/**
 * @typedef {Object} ValidationRule
 * @property {string} name - The name of the rule.
 * @property {function(string, string): boolean} check - A function that returns true if the content violates the rule.
 * @property {string} message - The error message to display if the rule is violated.
 * @property {Object} [shadowingDetails] - Optional details for shadowing errors.
 */

/**
 * @typedef {Object} ValidationError
 * @property {string} rule - The name of the rule that failed.
 * @property {string} message - The explanation of the error.
 * @property {string} file - The path to the file or directory where the error occurred.
 * @property {number} [line] - The optional line number of the error.
 */

/**
 * @typedef {Object.<string, string[]>} ZoneStructure
 * Defines the expected top-level directories for different types of zones (e.g., 'app', 'package').
 */

/**
 * @typedef {Object.<string, string[]>} SrcStructure
 * Defines the expected subdirectories and files within a 'src' directory.
 */

/**
 * Represents a directory structure, where keys are file/directory names.
 * A value of `true` indicates a file, and an object indicates a subdirectory.
 * @typedef {{ [key: string]: true | Tree }} Tree
 */

/**
 * @typedef {Object} NamingConventionRule
 * @property {string} dir - The directory where the rule applies.
 * @property {RegExp} regex - The regular expression to test the filename against.
 * @property {string} desc - The description of the naming convention.
 */

/**
 * Result of comparing actual directory tree with ideal structure.
 * Contains both errors (missing items) and successful validations.
 * @typedef {Object} ComparisonResult
 * @property {ValidationError[]} errors - Array of validation errors found during comparison.
 * @property {Array<{rule: string, message: string, file: string}>} oks - Array of successful validations.
 */

/**
 * Configuration for zone scanning in monorepo environments.
 * Determines which high-level directories should be included in validation.
 * @typedef {Object} ZoneConfig
 * @property {boolean} includePackages - Whether to include the 'packages' directory in monorepo checks.
 * @property {string[]} customZones - A list of additional custom zone directories to check.
 */

/**
 * This file contains only type definitions via JSDoc typedef comments.
 * No runtime exports are needed, but this export statement is required for ES module compatibility.
 */
export { } 
