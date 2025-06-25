import fs from "fs";
import { Logger } from "../utils/logger.js";
import type { IValidationRule } from "../types/config.types.js";
import type { IValidationError } from "../types/frontend-standards-checker.types.js";

/**
 * Rule engine for validating file content against defined rules
 */
export class RuleEngine {
  private logger: Logger;
  private rules: IValidationRule[];
  private validators: Map<
    string,
    (content: string, filePath: string) => Promise<IValidationError[]>
  >;

  constructor(logger: Logger) {
    this.logger = logger;
    this.rules = [];
    this.validators = new Map();
    this.initializeValidators();
  }

  /**
   * Initialize the rule engine with rules
   */
  async initialize(rules: IValidationRule[]): Promise<void> {
    this.rules = rules || [];
    this.logger.debug(
      `Initialized rule engine with ${this.rules.length} rules`
    );
  }

  /**
   * Validate a file against all rules
   */
  async validateFile(filePath: string): Promise<IValidationError[]> {
    const errors: IValidationError[] = [];

    try {
      const content = fs.readFileSync(filePath, "utf8");
      const fileName = filePath.split("/").pop() || "";

      // Skip validation for index files (they are usually just exports)
      const isIndexFile = fileName === "index.ts" || fileName === "index.tsx";

      // Run basic rules
      for (const rule of this.rules) {
        try {
          if (rule.check(content, filePath)) {
            errors.push({
              rule: rule.name,
              message: rule.message,
              file: filePath,
            });
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          this.logger.warn(
            `Rule "${rule.name}" failed for ${filePath}:`,
            errorMessage
          );
        }
      }

      // Run specialized validators for non-index files
      if (!isIndexFile) {
        errors.push(
          ...(await this.runSpecializedValidators(content, filePath))
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Failed to validate file ${filePath}:`, errorMessage);
      errors.push({
        rule: "File validation error",
        message: `Could not validate file: ${errorMessage}`,
        file: filePath,
      });
    }

    return errors;
  }

  /**
   * Run specialized validators
   */
  private async runSpecializedValidators(
    content: string,
    filePath: string
  ): Promise<IValidationError[]> {
    const errors: IValidationError[] = [];

    for (const [name, validator] of this.validators) {
      try {
        const validatorErrors = await validator(content, filePath);
        errors.push(...validatorErrors);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        this.logger.warn(
          `Validator "${name}" failed for ${filePath}:`,
          errorMessage
        );
      }
    }

    return errors;
  }

  /**
   * Initialize specialized validators
   */
  private initializeValidators(): void {
    this.validators.set("inline-styles", this.validateInlineStyles.bind(this));
    this.validators.set(
      "commented-code",
      this.validateCommentedCode.bind(this)
    );
    this.validators.set(
      "hardcoded-data",
      this.validateHardcodedData.bind(this)
    );
    this.validators.set(
      "function-comments",
      this.validateFunctionComments.bind(this)
    );
    this.validators.set(
      "unused-variables",
      this.validateUnusedVariables.bind(this)
    );
    this.validators.set(
      "function-naming",
      this.validateFunctionNaming.bind(this)
    );
    this.validators.set(
      "interface-naming",
      this.validateInterfaceNaming.bind(this)
    );
    this.validators.set(
      "style-conventions",
      this.validateStyleConventions.bind(this)
    );
  }

  /**
   * Validate inline styles
   */
  private async validateInlineStyles(
    content: string,
    filePath: string
  ): Promise<IValidationError[]> {
    const lines = content.split("\n");
    const errors: IValidationError[] = [];

    lines.forEach((line, idx) => {
      if (
        /style\s*=\s*\{\{[^}]+\}\}/.test(line) ||
        /style\s*=\s*"[^"]+"/i.test(line)
      ) {
        errors.push({
          rule: "Inline styles",
          message: "Inline styles are not allowed. Use .style.ts files",
          file: filePath,
          line: idx + 1,
        });
      }
    });

    return errors;
  }

  /**
   * Validate commented code
   */
  private async validateCommentedCode(
    content: string,
    filePath: string
  ): Promise<IValidationError[]> {
    const lines = content.split("\n");
    const errors: IValidationError[] = [];
    let inJSDoc = false;
    let inMultiLineComment = false;

    lines.forEach((line, idx) => {
      const trimmedLine = line.trim();

      // Track comment state
      if (/^\s*\/\*\*/.test(line)) {
        inJSDoc = true;
        return;
      }
      if (inJSDoc && /\*\//.test(line)) {
        inJSDoc = false;
        return;
      }
      if (/^\s*\/\*/.test(line) && !/^\s*\/\*\*/.test(line)) {
        inMultiLineComment = true;
        return;
      }
      if (inMultiLineComment && /\*\//.test(line)) {
        inMultiLineComment = false;
        return;
      }

      // Skip if inside comment blocks
      if (inJSDoc || inMultiLineComment || /^\s*\*/.test(line)) {
        return;
      }

      // Check for commented code
      if (/^\s*\/\//.test(line)) {
        const commentContent = trimmedLine.replace(/^\/\/\s*/, "");

        if (this.looksLikeCommentedCode(commentContent)) {
          errors.push({
            rule: "Commented code",
            message:
              "Commented code should be removed instead of commenting it out",
            file: filePath,
            line: idx + 1,
          });
        }
      }
    });

    return errors;
  }

  /**
   * Check if comment content looks like commented code
   */
  private looksLikeCommentedCode(commentContent: string): boolean {
    const codePatterns = [
      /^\s*(const|let|var|function|class|interface|type|import|export)\s+/,
      /^\s*\w+\s*[=:]\s*/,
      /^\s*\w+\([^)]*\)\s*[{;]/,
      /^\s*if\s*\(/,
      /^\s*for\s*\(/,
      /^\s*while\s*\(/,
      /^\s*switch\s*\(/,
      /^\s*return\s+/,
      /^\s*console\./,
      /^\s*\w+\.\w+/,
    ];

    return codePatterns.some((pattern) => pattern.test(commentContent));
  }

  /**
   * Validate hardcoded data
   */
  private async validateHardcodedData(
    content: string,
    filePath: string
  ): Promise<IValidationError[]> {
    const errors: IValidationError[] = [];
    const lines = content.split("\n");

    lines.forEach((line, idx) => {
      // Skip imports, comments, and other valid contexts
      if (
        line.trim().startsWith("//") ||
        line.trim().startsWith("*") ||
        line.includes("import ") ||
        line.includes("from ")
      ) {
        return;
      }

      // Check for hardcoded URLs
      const urlMatch = line.match(/(https?:\/\/[^\s"']+)/);
      if (urlMatch && !this.isValidHardcodedContext(line, filePath)) {
        errors.push({
          rule: "Hardcoded data",
          message: "Hardcoded URLs should be moved to configuration files",
          file: filePath,
          line: idx + 1,
        });
      }
    });

    return errors;
  }

  /**
   * Check if hardcoded data is in a valid context
   */
  private isValidHardcodedContext(line: string, filePath: string): boolean {
    // Allow in configuration files, test files, etc.
    return (
      filePath.includes("config") ||
      filePath.includes("test") ||
      filePath.includes("spec") ||
      line.includes("process.env")
    );
  }

  // Simplified implementations for other validators
  private async validateFunctionComments(
    content: string,
    filePath: string
  ): Promise<IValidationError[]> {
    return [];
  }

  private async validateUnusedVariables(
    content: string,
    filePath: string
  ): Promise<IValidationError[]> {
    return [];
  }

  private async validateFunctionNaming(
    content: string,
    filePath: string
  ): Promise<IValidationError[]> {
    return [];
  }

  private async validateInterfaceNaming(
    content: string,
    filePath: string
  ): Promise<IValidationError[]> {
    return [];
  }

  private async validateStyleConventions(
    content: string,
    filePath: string
  ): Promise<IValidationError[]> {
    return [];
  }
}
