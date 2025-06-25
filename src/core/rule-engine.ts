import fs from 'fs';
import type {
  IRuleEngine,
  ILogger,
  ValidationRule,
  ValidationError,
  StandardsConfiguration,
  RuleEngineInitOptions,
} from '../types.js';

/**
 * Rule engine for validating file content against defined rules
 */
export class RuleEngine implements IRuleEngine {
  public readonly logger: ILogger;
  public rules: ValidationRule[];
  public config: StandardsConfiguration | null;

  constructor(logger: ILogger) {
    this.logger = logger;
    this.rules = [];
    this.config = null;
  }

  /**
   * Initialize the rule engine with configuration
   */
  initialize(
    config: StandardsConfiguration,
    _options?: RuleEngineInitOptions
  ): void {
    this.config = config;
    this.rules = config.rules || [];
    this.logger.debug(
      `Initialized rule engine with ${this.rules.length} rules`
    );
  }

  /**
   * Validate a file against all rules
   */
  async validateFile(filePath: string): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = filePath.split('/').pop() ?? '';

      // Skip validation for index files (they are usually just exports)
      const isIndexFile = fileName === 'index.ts' || fileName === 'index.tsx';

      // Run basic rules
      for (const rule of this.rules) {
        // Skip "No unused variables" as it's handled separately
        if (rule.name === 'No unused variables') {
          continue;
        }

        try {
          const ruleResult = await rule.check(content, filePath);
          if (ruleResult) {
            const errorInfo: ValidationError = {
              rule: rule.name,
              message: rule.message,
              filePath,
              severity: rule.severity || 'error',
              category: rule.category || 'content',
            };

            // Add specific line information for variable shadowing
            if (
              rule.name === 'No variable shadowing' &&
              (rule as any).shadowingDetails
            ) {
              const shadowingDetails = (rule as any).shadowingDetails;
              errorInfo.line = shadowingDetails.line;
              errorInfo.message = `Variable '${shadowingDetails.variable}' shadows a variable from an outer scope (line ${shadowingDetails.line}). ${rule.message}`;
            }

            errors.push(errorInfo);
          }
        } catch (error) {
          this.logger.warn(
            `Rule "${rule.name}" failed for ${filePath}:`,
            (error as Error).message
          );
        }
      }

      // Run specialized validators for non-index files
      if (!isIndexFile) {
        try {
          // Import additional validators - handle as any until we migrate them
          // @ts-ignore - TODO: Migrate additional-validators.js to TypeScript
          const additionalValidators = (await import(
            './additional-validators.js'
          )) as any;

          const {
            checkInlineStyles,
            checkCommentedCode,
            checkHardcodedData,
            checkFunctionComments,
            checkFunctionNaming,
            checkInterfaceNaming,
            checkStyleConventions,
          } = additionalValidators;

          errors.push(...(checkInlineStyles(content, filePath) || []));
          errors.push(...(checkCommentedCode(content, filePath) || []));
          errors.push(...(checkHardcodedData(content, filePath) || []));
          errors.push(...(checkFunctionComments(content, filePath) || []));
          errors.push(...(checkFunctionNaming(content, filePath) || []));
          errors.push(...(checkInterfaceNaming(content, filePath) || []));
          errors.push(...(checkStyleConventions(content, filePath) || []));
        } catch (error) {
          this.logger.warn(
            'Failed to load additional validators:',
            (error as Error).message
          );
        }
      }

      // These validations always apply regardless of file type
      try {
        // @ts-ignore - TODO: Migrate additional-validators.js to TypeScript
        const additionalValidators = (await import(
          './additional-validators.js'
        )) as any;

        const {
          checkEnumsOutsideTypes,
          checkHookFileExtension,
          checkAssetNaming,
        } = additionalValidators;

        const enumError = checkEnumsOutsideTypes(filePath);
        if (enumError) errors.push(enumError);

        const hookExtError = checkHookFileExtension(filePath);
        if (hookExtError) errors.push(hookExtError);

        const assetError = checkAssetNaming(filePath);
        if (assetError) errors.push(assetError);
      } catch (error) {
        this.logger.warn(
          'Failed to load additional validators for file-level checks:',
          (error as Error).message
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to validate file ${filePath}:`,
        (error as Error).message
      );
      errors.push({
        rule: 'File validation error',
        message: `Could not validate file: ${(error as Error).message}`,
        filePath,
        severity: 'error',
        category: 'content',
      });
    }

    return errors;
  }

  /**
   * Validate content with context (compatibility method)
   */
  async validate(
    _content: string,
    filePath: string,
    _context?: any
  ): Promise<ValidationError[]> {
    // For now, we use validateFile method which reads the file content
    // In future, we could refactor to use the provided content directly
    return this.validateFile(filePath);
  }
}
