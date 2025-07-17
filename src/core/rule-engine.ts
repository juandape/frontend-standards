import fs from 'fs';
import path from 'path';
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
   * Check if a file is a configuration file that should be excluded from validation
   * @param filePath The file path to check
   * @returns True if the file is a configuration file
   */
  private isConfigFile(filePath: string): boolean {
    const fileName = path.basename(filePath);

    // Common configuration file patterns
    const configPatterns = [
      /\.config\.(js|ts|mjs|cjs|json)$/,
      /^(jest|vite|webpack|tailwind|next|eslint|prettier|babel|rollup|tsconfig)\.config\./,
      /^(vitest|nuxt|quasar)\.config\./,
      /^tsconfig.*\.json$/,
      /^\.eslintrc/,
      /^\.prettierrc/,
      /^babel\.config/,
      /^postcss\.config/,
      /^stylelint\.config/,
      /^cypress\.config/,
      /^playwright\.config/,
      /^storybook\.config/,
      /^metro\.config/,
      /^expo\.config/,
    ];

    return configPatterns.some((pattern) => pattern.test(fileName));
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

    // Skip configuration files completely
    if (this.isConfigFile(filePath)) {
      this.logger.debug(`Skipping configuration file: ${filePath}`);
      return errors;
    }

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
        const additionalValidators = await this.loadAdditionalValidators();
        if (additionalValidators) {
          this.runContentValidators(
            additionalValidators,
            content,
            filePath,
            errors
          );
        }
      }

      // These validations always apply regardless of file type
      const additionalValidators = await this.loadAdditionalValidators();
      if (additionalValidators) {
        this.runFileValidators(additionalValidators, filePath, errors);
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

    // Deduplicate errors by filePath, rule, and line
    const seen = new Set<string>();
    const dedupedErrors: ValidationError[] = [];
    for (const err of errors) {
      // Compose a unique key for each error
      const key = `${err.filePath}|${err.rule}|${err.line ?? 'no-line'}`;
      if (!seen.has(key)) {
        seen.add(key);
        dedupedErrors.push(err);
      }
    }
    return dedupedErrors;
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

  /**
   * Check if a file is a configuration file (public method)
   */
  isConfigurationFile(filePath: string): boolean {
    return this.isConfigFile(filePath);
  }

  /**
   * Safely load additional validators
   */
  private async loadAdditionalValidators(): Promise<any> {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Temporary workaround for JS module import
      return await import('./additional-validators.js');
    } catch (error) {
      this.logger.debug(
        'Additional validators not found:',
        (error as Error).message
      );
      return null;
    }
  }

  /**
   * Run content validators for non-index files
   */
  private runContentValidators(
    additionalValidators: any,
    content: string,
    filePath: string,
    errors: ValidationError[]
  ): void {
    try {
      const {
        checkInlineStyles,
        checkCommentedCode,
        checkHardcodedData,
        checkFunctionComments,
        checkFunctionNaming,
        checkInterfaceNaming,
        checkStyleConventions,
      } = additionalValidators;

      errors.push(...(checkInlineStyles(content, filePath) ?? []));
      errors.push(...(checkCommentedCode(content, filePath) ?? []));
      errors.push(...(checkHardcodedData(content, filePath) ?? []));
      errors.push(...(checkFunctionComments(content, filePath) ?? []));
      errors.push(...(checkFunctionNaming(content, filePath) ?? []));
      errors.push(...(checkInterfaceNaming(content, filePath) ?? []));
      errors.push(...(checkStyleConventions(content, filePath) ?? []));
    } catch (error) {
      this.logger.warn(
        'Failed to run content validators:',
        (error as Error).message
      );
    }
  }

  /**
   * Run file validators that apply to all files
   */
  private runFileValidators(
    additionalValidators: any,
    filePath: string,
    errors: ValidationError[]
  ): void {
    try {
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
        'Failed to run file validators:',
        (error as Error).message
      );
    }
  }
}
