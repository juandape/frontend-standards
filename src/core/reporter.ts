import fs from "fs";
import path from "path";
import { Logger } from "../utils/logger.js";
import type {
  IValidationError,
  IValidationResults,
} from "../types/frontend-standards-checker.types.js";
import type { IProjectInfo } from "../types/project.types.js";
import type { IProjectConfig } from "../types/config.types.js";

/**
 * Reporter for generating detailed validation reports
 */
export class Reporter {
  private rootDir: string;
  private outputPath: string;
  private logger: Logger;
  private originalZoneErrors: Record<string, IValidationError[]> = {};

  constructor(rootDir: string, outputPath: string | null, logger: Logger) {
    this.rootDir = rootDir;
    this.outputPath =
      outputPath || path.join(rootDir, "frontend-standards.log");
    this.logger = logger;
  }

  /**
   * Generate and save validation report
   */
  async generate(
    zoneErrors: Record<string, IValidationError[]>,
    projectInfo: IProjectInfo,
    config: IProjectConfig
  ): Promise<IValidationResults> {
    // Store original errors for detailed reporting
    this.setOriginalZoneErrors(zoneErrors);

    const reportData = this.processErrors(zoneErrors);
    const reportContent = this.formatReport(reportData, projectInfo, config);

    await this.saveReport(reportContent);

    return {
      logFile: this.outputPath,
      totalErrors: reportData.totalErrors,
      errorsByZone: zoneErrors,
      summary: {
        filesChecked: this.calculateFilesChecked(zoneErrors),
        rulesApplied: config.rules.length,
        zones: Object.keys(zoneErrors).length,
      },
    };
  }

  /**
   * Process errors and generate statistics
   */
  private processErrors(zoneErrors: Record<string, IValidationError[]>) {
    const errorsByRule: Record<string, number> = {};
    const oksByZone: Record<string, string[]> = {};
    const errorsByZone: Record<string, number> = {};
    const totalCheckedByZone: Record<string, number> = {};
    let totalErrors = 0;

    for (const [zone, errors] of Object.entries(zoneErrors)) {
      errorsByZone[zone] = 0;
      oksByZone[zone] = [];
      totalCheckedByZone[zone] = 0;

      for (const error of errors) {
        totalCheckedByZone[zone]++;

        if (error.message.startsWith("✅")) {
          oksByZone[zone].push(error.message.replace("✅ ", ""));
        } else if (error.message.startsWith("Present:")) {
          oksByZone[zone].push(error.message.replace("Present:", "").trim());
        } else {
          errorsByZone[zone]++;
          totalErrors++;
          errorsByRule[error.rule] = (errorsByRule[error.rule] || 0) + 1;
        }
      }
    }

    return {
      totalErrors,
      errorsByRule,
      errorsByZone,
      oksByZone,
      totalCheckedByZone,
      summary: this.generateSummary(errorsByRule, totalErrors),
    };
  }

  /**
   * Generate error summary
   */
  private generateSummary(
    errorsByRule: Record<string, number>,
    totalErrors: number
  ) {
    if (totalErrors === 0) {
      return [];
    }

    return Object.entries(errorsByRule)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([rule, count]) => ({
        rule,
        count,
        percentage: ((count / totalErrors) * 100).toFixed(1),
      }));
  }

  /**
   * Format the complete report
   */
  private formatReport(
    reportData: ReturnType<typeof this.processErrors>,
    projectInfo: IProjectInfo,
    config: IProjectConfig
  ): string {
    const lines: string[] = [];

    this.addReportHeader(lines, projectInfo);

    if (reportData.totalErrors === 0) {
      lines.push("✅ ALL VALIDATIONS PASSED!");
      lines.push("");
      lines.push(
        "Congratulations! Your project complies with all defined frontend standards."
      );
      return lines.join("\n");
    }

    this.addSummarySection(lines, reportData);
    this.addZoneResultsSection(lines, reportData);
    this.addDetailedErrorsSection(lines);
    this.addStatisticsSection(lines, reportData);
    this.addRecommendationsSection(lines);

    return lines.join("\n");
  }

  /**
   * Add report header section
   */
  private addReportHeader(lines: string[], projectInfo: IProjectInfo): void {
    lines.push("=".repeat(80));
    lines.push("FRONTEND STANDARDS VALIDATION REPORT");
    lines.push("=".repeat(80));
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Project: ${path.basename(this.rootDir)}`);
    lines.push(`Project Type: ${projectInfo.type}`);
    lines.push(`Monorepo: ${projectInfo.isMonorepo ? "Yes" : "No"}`);
    lines.push("");
  }

  /**
   * Add summary section
   */
  private addSummarySection(
    lines: string[],
    reportData: ReturnType<typeof this.processErrors>
  ): void {
    lines.push(
      `SUMMARY: ${reportData.totalErrors} violations found across ${
        Object.keys(reportData.errorsByZone).length
      } zones`
    );
    lines.push("");
  }

  /**
   * Add zone results section
   */
  private addZoneResultsSection(
    lines: string[],
    reportData: ReturnType<typeof this.processErrors>
  ): void {
    lines.push("RESULTS BY ZONE:");
    lines.push("-".repeat(40));

    for (const [zone, errors] of Object.entries(reportData.errorsByZone)) {
      lines.push(`\n📂 Zone: ${zone}`);
      lines.push(`   Errors: ${errors}`);
      lines.push(`   Status: ${errors === 0 ? "✅ PASSED" : "❌ FAILED"}`);
    }
  }

  /**
   * Add detailed errors section
   */
  private addDetailedErrorsSection(lines: string[]): void {
    lines.push("\n");
    lines.push("DETAILED VIOLATIONS:");
    lines.push("-".repeat(40));

    const zoneErrors = this.getOriginalZoneErrors();
    for (const [zone, errors] of Object.entries(zoneErrors)) {
      const actualErrors = errors.filter(
        (e) => !e.message.startsWith("✅") && !e.message.startsWith("Present:")
      );

      if (actualErrors.length > 0) {
        lines.push(`\n📂 Zone: ${zone}`);

        for (const error of actualErrors) {
          const fileLocation = error.line
            ? `${error.file}:${error.line}`
            : error.file;
          lines.push(`\n  📄 ${fileLocation}`);
          lines.push(`     Rule: ${error.rule}`);
          lines.push(`     Issue: ${error.message}`);
          lines.push("     " + "-".repeat(50));
        }
      }
    }
  }

  /**
   * Add statistics section
   */
  private addStatisticsSection(
    lines: string[],
    reportData: ReturnType<typeof this.processErrors>
  ): void {
    if (reportData.summary.length > 0) {
      lines.push("\n");
      lines.push("TOP VIOLATION TYPES:");
      lines.push("-".repeat(40));

      for (const stat of reportData.summary) {
        lines.push(`  ${stat.rule}: ${stat.count} (${stat.percentage}%)`);
      }
    }
  }

  /**
   * Add recommendations section
   */
  private addRecommendationsSection(lines: string[]): void {
    lines.push("\n");
    lines.push("RECOMMENDATIONS:");
    lines.push("-".repeat(40));
    lines.push("1. Focus on the most frequent violation types first");
    lines.push("2. Run validation in CI/CD to prevent regression");
    lines.push("3. Use pre-commit hooks for early detection");
    lines.push("4. Consider adding custom rules for project-specific needs");
  }

  /**
   * Save report to file
   */
  private async saveReport(content: string): Promise<void> {
    try {
      const dir = path.dirname(this.outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.outputPath, content, "utf8");
      this.logger.info(`📝 Report saved to: ${this.outputPath}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Failed to save report: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get original zone errors
   */
  private getOriginalZoneErrors(): Record<string, IValidationError[]> {
    return this.originalZoneErrors;
  }

  /**
   * Set original zone errors
   */
  private setOriginalZoneErrors(
    zoneErrors: Record<string, IValidationError[]>
  ): void {
    this.originalZoneErrors = { ...zoneErrors };
  }

  /**
   * Calculate total files checked
   */
  private calculateFilesChecked(
    zoneErrors: Record<string, IValidationError[]>
  ): number {
    const files = new Set<string>();
    for (const errors of Object.values(zoneErrors)) {
      for (const error of errors) {
        files.add(error.file);
      }
    }
    return files.size;
  }
}
