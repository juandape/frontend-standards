import fs from 'fs';
import {
  checkInlineStyles,
  checkCommentedCode,
  checkHardcodedData,
  checkFunctionComments,
  checkUnusedVariables,
  checkFunctionNaming,
  checkInterfaceNaming,
  checkStyleConventions,
  checkEnumsOutsideTypes,
  checkHookFileExtension,
  checkAssetNaming,
} from './additional-validators.js';

/**
 * Rule engine for validating file content against defined rules
 */
export class RuleEngine {
  constructor(logger) {
    this.logger = logger;
    this.rules = [];
  }

  /**
   * Initialize the rule engine with rules
   * @param {Array} rules Array of validation rules
   */
  async initialize(rules) {
    this.rules = rules || [];
    this.logger.debug(
      `Initialized rule engine with ${this.rules.length} rules`
    );
  }

  /**
   * Validate a file against all rules
   * @param {string} filePath Path to the file to validate
   * @returns {Promise<Array>} Array of validation errors
   */
  async validateFile(filePath) {
    const errors = [];

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = filePath.split('/').pop();

      // Skip validation for index files (they are usually just exports)
      const isIndexFile = fileName === 'index.ts' || fileName === 'index.tsx';

      // Run basic rules
      for (const rule of this.rules) {
        // Skip "No unused variables" as it's handled separately
        if (rule.name === 'No unused variables') {
          continue;
        }

        try {
          if (rule.check(content, filePath)) {
            const errorInfo = {
              rule: rule.name,
              message: rule.message,
              file: filePath,
            };

            // Add specific line information for variable shadowing
            if (
              rule.name === 'No variable shadowing' &&
              rule.shadowingDetails
            ) {
              errorInfo.file = `${filePath}:${rule.shadowingDetails.line}`;
              errorInfo.message = `Variable '${rule.shadowingDetails.variable}' shadows a variable from an outer scope (line ${rule.shadowingDetails.line}). ${rule.message}`;
            }

            errors.push(errorInfo);
          }
        } catch (error) {
          this.logger.warn(
            `Rule "${rule.name}" failed for ${filePath}:`,
            error.message
          );
        }
      }

      // Run specialized validators for non-index files
      if (!isIndexFile) {
        errors.push(...checkInlineStyles(content, filePath));
        errors.push(...checkCommentedCode(content, filePath));
        errors.push(...checkHardcodedData(content, filePath));
        errors.push(...checkFunctionComments(content, filePath));
        errors.push(...checkUnusedVariables(content, filePath));
        errors.push(...checkFunctionNaming(content, filePath));
        errors.push(...checkInterfaceNaming(content, filePath));
        errors.push(...checkStyleConventions(content, filePath));
      }

      // These validations always apply regardless of file type
      const enumError = checkEnumsOutsideTypes(filePath);
      if (enumError) errors.push(enumError);

      const hookExtError = checkHookFileExtension(filePath);
      if (hookExtError) errors.push(hookExtError);

      const assetError = checkAssetNaming(filePath);
      if (assetError) errors.push(assetError);
    } catch (error) {
      this.logger.error(`Failed to validate file ${filePath}:`, error.message);
      errors.push({
        rule: 'File validation error',
        message: `Could not validate file: ${error.message}`,
        file: filePath,
      });
    }

    return errors;
  }
}
