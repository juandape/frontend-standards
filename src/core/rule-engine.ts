import fs from 'fs';
import path from 'path';
import type {
  IRuleEngine,
  ILogger,
  IValidationRule,
  IValidationError,
  IStandardsConfiguration,
  IRuleEngineInitOptions,
} from '../types';

/**
 * Rule engine for validating file content against defined rules
 */
export class RuleEngine implements IRuleEngine {
  public readonly logger: ILogger;
  public rules: IValidationRule[];
  public config: IStandardsConfiguration | null;

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
    config: IStandardsConfiguration,
    _options?: IRuleEngineInitOptions
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
  async validateFile(filePath: string): Promise<IValidationError[]> {
    if (this.isConfigFile(filePath)) {
      this.logger.debug(`Skipping configuration file: ${filePath}`);
      return [];
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const errors = await this.validateFileContent(content, filePath);
      return this.deduplicateErrors(errors);
    } catch (error) {
      return this.handleValidationError(error, filePath);
    }
  }

  private async validateFileContent(
    content: string,
    filePath: string
  ): Promise<IValidationError[]> {
    const errors: IValidationError[] = [];
    const fileName = path.basename(filePath);
    const isIndexFile = fileName === 'index.ts' || fileName === 'index.tsx';

    await this.runBasicRules(content, filePath, errors);

    if (!isIndexFile) {
      await this.runAdditionalValidations(content, filePath, errors);
    }

    await this.runAlwaysApplicableValidations(filePath, errors);
    return errors;
  }

  private async runBasicRules(
    content: string,
    filePath: string,
    errors: IValidationError[]
  ): Promise<void> {
    for (const rule of this.rules) {
      if (rule.name === 'No unused variables') continue;

      try {
        await this.applyRule(rule, content, filePath, errors);
      } catch (error) {
        this.logRuleError(rule.name, filePath, error);
      }
    }
  }

  private async applyRule(
    rule: any,
    content: string,
    filePath: string,
    errors: IValidationError[]
  ): Promise<void> {
    const ruleResult = await rule.check(content, filePath);
    if (Array.isArray(ruleResult)) {
      if (ruleResult.length === 0) return; // No violaciones, no agregar error
      for (const line of ruleResult) {
        const errorInfo = this.createErrorInfo(rule, filePath);
        errorInfo.line = line;
        errorInfo.message = `${rule.message} (line ${line})`;
        errors.push(errorInfo);
      }
      return;
    }
    if (!ruleResult) return;
    // Si es booleano true, agregar error sin línea
    const errorInfo = this.createErrorInfo(rule, filePath);
    if (rule.name === 'No variable shadowing' && rule.shadowingDetails) {
      this.addShadowingDetails(errorInfo, rule);
    }
    errors.push(errorInfo);
  }

  private createErrorInfo(rule: any, filePath: string): IValidationError {
    return {
      rule: rule.name,
      message: rule.message,
      filePath,
      severity: rule.severity ?? 'error',
      category: rule.category ?? 'content',
    };
  }

  private addShadowingDetails(errorInfo: IValidationError, rule: any): void {
    const { shadowingDetails } = rule;
    errorInfo.line = shadowingDetails.line;
    errorInfo.message = `Variable '${shadowingDetails.variable}' shadows a variable from an outer scope (line ${shadowingDetails.line}). ${rule.message}`;
  }

  private async runAdditionalValidations(
    content: string,
    filePath: string,
    errors: IValidationError[]
  ): Promise<void> {
    const validators = await this.loadAdditionalValidators();
    if (validators) {
      this.runContentValidators(validators, content, filePath, errors);
    }
  }

  private async runAlwaysApplicableValidations(
    filePath: string,
    errors: IValidationError[]
  ): Promise<void> {
    const validators = await this.loadAdditionalValidators();
    if (validators) {
      this.runFileValidators(validators, filePath, errors);
    }
  }

  private logRuleError(
    ruleName: string,
    filePath: string,
    error: unknown
  ): void {
    this.logger.warn(
      `Rule "${ruleName}" failed for ${filePath}:`,
      error instanceof Error ? error.message : String(error)
    );
  }

  private deduplicateErrors(errors: IValidationError[]): IValidationError[] {
    const seen = new Set<string>();
    return errors.filter((err) => {
      const key = `${err.filePath}|${err.rule}|${err.line ?? 'no-line'}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private handleValidationError(
    error: unknown,
    filePath: string
  ): IValidationError[] {
    this.logger.error(
      `Failed to validate file ${filePath}:`,
      error instanceof Error ? error.message : String(error)
    );
    return [
      {
        rule: 'File validation error',
        message: `Could not validate file: ${
          error instanceof Error ? error.message : String(error)
        }`,
        filePath,
        severity: 'error',
        category: 'content',
      },
    ];
  }

  /**
   * Validate content with context (compatibility method)
   */
  async validate(
    _content: string,
    filePath: string,
    _context?: any
  ): Promise<IValidationError[]> {
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
    errors: IValidationError[]
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
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Run file validators that apply to all files
   */
  private runFileValidators(
    additionalValidators: any,
    filePath: string,
    errors: IValidationError[]
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
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}
