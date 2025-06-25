import fs from 'fs';
import path from 'path';
import type {
  IReporter,
  ILogger,
  ValidationError,
  ProjectAnalysisResult,
  StandardsConfiguration,
  ProcessedReportData,
  SummaryItem,
  ReportGenerationResult,
} from '../types.js';

/**
 * Reporter for generating detailed validation reports
 */
export class Reporter implements IReporter {
  public readonly rootDir: string;
  public readonly outputPath: string;
  public readonly logger: ILogger;
  private _originalZoneErrors: Record<string, ValidationError[]> = {};

  constructor(rootDir: string, outputPath: string | null, logger: ILogger) {
    this.rootDir = rootDir;
    this.outputPath =
      outputPath ?? path.join(rootDir, 'frontend-standards.log');
    this.logger = logger;
  }

  /**
   * Generate and save validation report
   */
  async generate(
    zoneErrors: Record<string, ValidationError[]>,
    projectInfo: ProjectAnalysisResult,
    config: StandardsConfiguration
  ): Promise<ReportGenerationResult> {
    // Store original errors for detailed reporting
    this.setOriginalZoneErrors(zoneErrors);

    const reportData = this.processErrors(zoneErrors);
    const reportContent = this.formatReport(reportData, projectInfo, config);

    await this.saveReport(reportContent);

    return {
      logFile: this.outputPath,
      totalErrors: reportData.totalErrors,
      totalZones: Object.keys(zoneErrors).length,
      zoneErrors,
      summary: reportData.summary,
    };
  }

  /**
   * Process errors and generate statistics
   */
  processErrors(
    zoneErrors: Record<string, ValidationError[]>
  ): ProcessedReportData {
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

        if (error.message.startsWith('✅')) {
          oksByZone[zone].push(error.message.replace('✅ ', ''));
        } else if (error.message.startsWith('Present:')) {
          oksByZone[zone].push(error.message.replace('Present:', '').trim());
        } else {
          errorsByZone[zone]++;
          totalErrors++;
          errorsByRule[error.rule] = (errorsByRule[error.rule] ?? 0) + 1;
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
  generateSummary(
    errorsByRule: Record<string, number>,
    totalErrors: number
  ): SummaryItem[] {
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
  formatReport(
    reportData: ProcessedReportData,
    projectInfo: ProjectAnalysisResult,
    _config: StandardsConfiguration
  ): string {
    const lines: string[] = [];

    this.addReportHeader(lines, projectInfo);

    if (reportData.totalErrors === 0) {
      lines.push('✅ ALL VALIDATIONS PASSED!');
      lines.push('');
      lines.push(
        'Congratulations! Your project complies with all defined frontend standards.'
      );
      return lines.join('\n');
    }

    this.addSummarySection(lines, reportData);
    this.addZoneResultsSection(lines, reportData);
    this.addDetailedErrorsSection(lines);
    this.addStatisticsSection(lines, reportData);
    this.addRecommendationsSection(lines);

    return lines.join('\n');
  }

  /**
   * Add report header section
   */
  addReportHeader(lines: string[], projectInfo: ProjectAnalysisResult): void {
    lines.push('='.repeat(80));
    lines.push('FRONTEND STANDARDS VALIDATION REPORT');
    lines.push('='.repeat(80));
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Project: ${path.basename(this.rootDir)}`);
    lines.push(`Project Type: ${projectInfo.type}`);
    lines.push(`Monorepo: ${projectInfo.isMonorepo ? 'Yes' : 'No'}`);
    lines.push('');
  }

  /**
   * Add summary section
   */
  addSummarySection(lines: string[], reportData: ProcessedReportData): void {
    lines.push(
      `SUMMARY: ${reportData.totalErrors} violations found across ${
        Object.keys(reportData.errorsByZone).length
      } zones`
    );
    lines.push('');
  }

  /**
   * Add zone results section
   */
  addZoneResultsSection(
    lines: string[],
    reportData: ProcessedReportData
  ): void {
    lines.push('RESULTS BY ZONE:');
    lines.push('-'.repeat(40));

    for (const [zone, errors] of Object.entries(reportData.errorsByZone)) {
      lines.push(`\n📂 Zone: ${zone}`);
      lines.push(`   Errors: ${errors}`);
      lines.push(`   Status: ${errors === 0 ? '✅ PASSED' : '❌ FAILED'}`);
    }
  }

  /**
   * Add detailed errors section
   */
  addDetailedErrorsSection(lines: string[]): void {
    lines.push('\n');
    lines.push('DETAILED VIOLATIONS:');
    lines.push('-'.repeat(40));

    const zoneErrors = this.getOriginalZoneErrors();
    for (const [zone, errors] of Object.entries(zoneErrors)) {
      const actualErrors = errors.filter(
        (e) => !e.message.startsWith('✅') && !e.message.startsWith('Present:')
      );

      if (actualErrors.length > 0) {
        lines.push(`\n📂 Zone: ${zone}`);

        for (const error of actualErrors) {
          const fileLocation = error.line
            ? `${error.filePath}:${error.line}`
            : error.filePath;
          lines.push(`\n  📄 ${fileLocation}`);
          lines.push(`     Rule: ${error.rule}`);
          lines.push(`     Issue: ${error.message}`);
          lines.push('     ' + '-'.repeat(50));
        }
      }
    }
  }

  /**
   * Add statistics section
   */
  addStatisticsSection(lines: string[], reportData: ProcessedReportData): void {
    if (reportData.summary.length > 0) {
      lines.push('\n');
      lines.push('ERROR STATISTICS:');
      lines.push('-'.repeat(40));

      for (const stat of reportData.summary) {
        lines.push(
          `• ${stat.rule}: ${stat.count} occurrences (${stat.percentage}%)`
        );
      }

      lines.push(`\nTotal violations: ${reportData.totalErrors}`);
    }
  }

  /**
   * Add recommendations section
   */
  addRecommendationsSection(lines: string[]): void {
    lines.push('\n');
    lines.push('RECOMMENDATIONS:');
    lines.push('-'.repeat(40));
    lines.push('• Focus on the most frequent violation types shown above');
    lines.push('• Review and update your development practices');
    lines.push(
      '• Consider setting up pre-commit hooks to catch violations early'
    );
    lines.push(
      '• Regular team training on coding standards can help reduce violations'
    );
  }

  /**
   * Save report to file
   */
  async saveReport(content: string): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.outputPath, content, 'utf8');
      this.logger.debug(`Report saved to: ${this.outputPath}`);
    } catch (error) {
      this.logger.error(`Failed to save report: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get original zone errors
   */
  getOriginalZoneErrors(): Record<string, ValidationError[]> {
    return this._originalZoneErrors;
  }

  /**
   * Set original zone errors for detailed reporting
   */
  setOriginalZoneErrors(zoneErrors: Record<string, ValidationError[]>): void {
    this._originalZoneErrors = zoneErrors;
  }

  /**
   * Generate a quick summary for console output
   */
  generateQuickSummary(reportData: ProcessedReportData): string {
    if (reportData.totalErrors === 0) {
      return '✅ All validations passed!';
    }

    const topIssues = reportData.summary.slice(0, 3);
    const issuesList = topIssues
      .map((issue) => `${issue.rule} (${issue.count})`)
      .join(', ');

    return `❌ ${reportData.totalErrors} violations found. Top issues: ${issuesList}`;
  }

  /**
   * Export report in JSON format
   */
  async exportJson(
    reportData: ProcessedReportData,
    outputPath: string | null = null
  ): Promise<string> {
    const jsonPath = outputPath ?? this.outputPath.replace('.log', '.json');

    try {
      const jsonContent = JSON.stringify(reportData, null, 2);
      fs.writeFileSync(jsonPath, jsonContent, 'utf8');
      this.logger.debug(`JSON report exported to: ${jsonPath}`);
      return jsonPath;
    } catch (error) {
      this.logger.error(
        `Failed to export JSON report: ${(error as Error).message}`
      );
      throw error;
    }
  }
}
