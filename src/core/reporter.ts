import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
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
  public outputPath: string;
  public logDir: string;
  public readonly logger: ILogger;
  private _originalZoneErrors: Record<string, ValidationError[]> = {};

  private getFileMeta(filePath: string): {
    modDate: string;
    lastAuthor: string;
  } {
    let modDate = 'No date';
    let lastAuthor = 'Unknown';
    try {
      const absPath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(this.rootDir, filePath);
      if (fs.existsSync(absPath)) {
        const stats = fs.statSync(absPath);
        modDate = stats.mtime
          ? stats.mtime.toLocaleString('es-ES', { timeZone: 'America/Bogota' })
          : modDate;
        // Get last author using git log
        try {
          const gitAuthor = execSync(
            `git log -1 --pretty=format:'%an' -- "${absPath}"`,
            { cwd: this.rootDir, encoding: 'utf8' }
          ).trim();
          if (gitAuthor) lastAuthor = gitAuthor;
        } catch {}
      }
    } catch {}
    return { modDate, lastAuthor };
  }

  constructor(rootDir: string, outputPath: string | null, logger: ILogger) {
    this.rootDir = rootDir;
    // Siempre crear una subcarpeta nueva con fecha y hora exacta
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const folderName = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(
      now.getSeconds()
    )}`;
    this.logDir = path.join(rootDir, 'logs-standards-validations', folderName);
    this.outputPath =
      outputPath ?? path.join(this.logDir, 'frontend-standards.log');
    this.logger = logger;
    // Mostrar en consola la ruta generada
    // eslint-disable-next-line no-console
    console.log(`📝 Log folder for this run: ${this.logDir}`);
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
      totalWarnings: reportData.totalWarnings,
      totalInfos: reportData.totalInfos,
      totalZones: Object.keys(zoneErrors).length,
      zoneErrors,
      summary: reportData.summary,
      warningSummary: reportData.warningSummary,
      infoSummary: reportData.infoSummary,
    };
  }

  /**
   * Process errors and generate statistics
   */
  processErrors(
    zoneErrors: Record<string, ValidationError[]>
  ): ProcessedReportData {
    const errorsByRule: Record<string, number> = {};
    const warningsByRule: Record<string, number> = {};
    const infosByRule: Record<string, number> = {};
    const oksByZone: Record<string, string[]> = {};
    const errorsByZone: Record<string, number> = {};
    const warningsByZone: Record<string, number> = {};
    const infosByZone: Record<string, number> = {};
    const totalCheckedByZone: Record<string, number> = {};
    let totalErrors = 0;
    let totalWarnings = 0;
    let totalInfos = 0;

    for (const [zone, errors] of Object.entries(zoneErrors)) {
      errorsByZone[zone] = 0;
      warningsByZone[zone] = 0;
      infosByZone[zone] = 0;
      oksByZone[zone] = [];
      totalCheckedByZone[zone] = 0;

      for (const error of errors) {
        totalCheckedByZone[zone]++;

        if (error.message.startsWith('✅')) {
          oksByZone[zone].push(error.message.replace('✅ ', ''));
        } else if (error.message.startsWith('Present:')) {
          oksByZone[zone].push(error.message.replace('Present:', '').trim());
        } else if (error.severity === 'error') {
          errorsByZone[zone]++;
          totalErrors++;
          errorsByRule[error.rule] = (errorsByRule[error.rule] ?? 0) + 1;
        } else if (error.severity === 'warning') {
          warningsByZone[zone]++;
          totalWarnings++;
          warningsByRule[error.rule] = (warningsByRule[error.rule] ?? 0) + 1;
        } else if (error.severity === 'info') {
          infosByZone[zone]++;
          totalInfos++;
          infosByRule[error.rule] = (infosByRule[error.rule] ?? 0) + 1;
        }
      }
    }

    return {
      totalErrors,
      totalWarnings,
      totalInfos,
      errorsByRule,
      warningsByRule,
      infosByRule,
      errorsByZone,
      warningsByZone,
      infosByZone,
      oksByZone,
      totalCheckedByZone,
      summary: this.generateSummary(errorsByRule, totalErrors),
      warningSummary: this.generateSummary(warningsByRule, totalWarnings),
      infoSummary: this.generateSummary(infosByRule, totalInfos),
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
    this.addDetailedWarningsSection(lines);
    this.addDetailedInfosSection(lines);
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
    lines.push(
      `Generated: ${new Date().toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/Bogota',
      })}`
    );
    lines.push(`Project: ${path.basename(this.rootDir)}`);
    lines.push(`Project Type: ${projectInfo.type}`);
    lines.push(`Monorepo: ${projectInfo.isMonorepo ? 'Yes' : 'No'}`);
    lines.push('');
    lines.push(
      '💡 TIP: Use Cmd+Click (Mac) or Ctrl+Click (Windows/Linux) on file paths to open them directly in your editor'
    );
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

    if (reportData.totalWarnings > 0) {
      lines.push(
        `Additional warnings: ${reportData.totalWarnings} warnings found`
      );
    }

    if (reportData.totalInfos > 0) {
      lines.push(
        `Additional suggestions: ${reportData.totalInfos} info items found`
      );
    }

    lines.push('');
  }

  /**
   * Add zone results section
   */
  addZoneResultsSection(
    lines: string[],
    reportData: ProcessedReportData
  ): void {
    lines.push('-'.repeat(16));
    lines.push('RESULTS BY ZONE:');
    lines.push('-'.repeat(16));

    for (const [zone, errors] of Object.entries(reportData.errorsByZone)) {
      const warnings = reportData.warningsByZone[zone] ?? 0;
      const infos = reportData.infosByZone[zone] ?? 0;
      lines.push(`\n📂 Zone: ${zone}`);
      lines.push(`   Errors: ${errors}`);
      lines.push(`   Warnings: ${warnings}`);
      if (infos > 0) {
        lines.push(`   Info suggestions: ${infos}`);
      }
      lines.push(`   Status: ${errors === 0 ? '✅ PASSED' : '❌ FAILED'}`);
      lines.push('-'.repeat(40));
    }
  }

  /**
   * Add detailed errors section
   */
  addDetailedErrorsSection(lines: string[]): void {
    lines.push('\n');
    lines.push('-'.repeat(20));
    lines.push('DETAILED VIOLATIONS:');
    lines.push('-'.repeat(20));

    const zoneErrors = this.getOriginalZoneErrors();
    for (const [zone, errors] of Object.entries(zoneErrors)) {
      const actualErrors = errors.filter(
        (e) =>
          !e.message.startsWith('✅') &&
          e.severity === 'error' &&
          !e.message.startsWith('Present:')
      );

      if (actualErrors.length > 0) {
        lines.push(`📂 Zone: ${zone}`);

        for (const error of actualErrors) {
          const relPath = path.relative(this.rootDir, error.filePath);
          const fileLocation = error.line
            ? `${relPath}:${error.line}`
            : relPath;
          const meta = this.getFileMeta(error.filePath);
          lines.push(`\n  📄 ${fileLocation}`);
          lines.push(`     Rule: ${error.rule}`);
          lines.push(`     Issue: ${error.message}`);
          lines.push(`     Last modification: ${meta.modDate}`);
          lines.push(`     Last collaborator: ${meta.lastAuthor}`);
          lines.push('     ' + '-'.repeat(50));
        }
      }
    }
  }
  /**
   * Add detailed warnings section
   */
  addDetailedWarningsSection(lines: string[]): void {
    lines.push('\n');
    lines.push('-'.repeat(18));
    lines.push('DETAILED WARNINGS:');
    lines.push('-'.repeat(18));

    const zoneErrors = this.getOriginalZoneErrors();
    for (const [zone, errors] of Object.entries(zoneErrors)) {
      const actualWarnings = errors.filter(
        (e) =>
          !e.message.startsWith('✅') &&
          e.severity === 'warning' &&
          !e.message.startsWith('Present:')
      );

      if (actualWarnings.length > 0) {
        lines.push(`📂 Zone: ${zone}`);

        for (const warning of actualWarnings) {
          const relPath = path.relative(this.rootDir, warning.filePath);
          const fileLocation = warning.line
            ? `${relPath}:${warning.line}`
            : relPath;
          const meta = this.getFileMeta(warning.filePath);
          lines.push(`\n  📄 ${fileLocation}`);
          lines.push(`     Rule: ${warning.rule}`);
          lines.push(`     Issue: ${warning.message}`);
          lines.push(`     Last modification: ${meta.modDate}`);
          lines.push(`     Last collaborator: ${meta.lastAuthor}`);
          lines.push('     ' + '-'.repeat(50));
        }
      }
    }
  }

  /**
   * Add detailed info suggestions section
   */
  addDetailedInfosSection(lines: string[]): void {
    lines.push('\n');
    lines.push('-'.repeat(26));
    lines.push('DETAILED INFO SUGGESTIONS:');
    lines.push('-'.repeat(26));

    const zoneErrors = this.getOriginalZoneErrors();
    for (const [zone, errors] of Object.entries(zoneErrors)) {
      const actualInfos = errors.filter(
        (e) =>
          !e.message.startsWith('✅') &&
          e.severity === 'info' &&
          !e.message.startsWith('Present:')
      );

      if (actualInfos.length > 0) {
        lines.push(`📂 Zone: ${zone}`);

        for (const info of actualInfos) {
          const relPath = path.relative(this.rootDir, info.filePath);
          const fileLocation = info.line ? `${relPath}:${info.line}` : relPath;
          const meta = this.getFileMeta(info.filePath);
          lines.push(`\n  📄 ${fileLocation}`);
          lines.push(`     Rule: ${info.rule}`);
          lines.push(`     Suggestion: ${info.message}`);
          lines.push(`     Last modification: ${meta.modDate}`);
          lines.push(`     Last collaborator: ${meta.lastAuthor}`);
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
      lines.push('-'.repeat(17));
      lines.push('ERROR STATISTICS:');
      lines.push('-'.repeat(17));

      for (const stat of reportData.summary) {
        lines.push(
          `• ${stat.rule}: ${stat.count} occurrences (${stat.percentage}%)`
        );
      }

      lines.push(`\nTotal violations: ${reportData.totalErrors}`);
    }

    if (reportData.warningSummary.length > 0) {
      lines.push('\n');
      lines.push('-'.repeat(19));
      lines.push('WARNING STATISTICS:');
      lines.push('-'.repeat(19));

      for (const stat of reportData.warningSummary) {
        lines.push(
          `• ${stat.rule}: ${stat.count} occurrences (${stat.percentage}%)`
        );
      }

      lines.push(`\nTotal warnings: ${reportData.totalWarnings}`);
    }

    if (reportData.infoSummary.length > 0) {
      lines.push('\n');
      lines.push('-'.repeat(28));
      lines.push('INFO SUGGESTIONS STATISTICS:');
      lines.push('-'.repeat(28));

      for (const stat of reportData.infoSummary) {
        lines.push(
          `• ${stat.rule}: ${stat.count} occurrences (${stat.percentage}%)`
        );
      }

      lines.push(`\nTotal info suggestions: ${reportData.totalInfos}`);
    }
  }

  /**
   * Add recommendations section
   */
  addRecommendationsSection(lines: string[]): void {
    lines.push('\n');
    lines.push('-'.repeat(16));
    lines.push('RECOMMENDATIONS:');
    lines.push('-'.repeat(16));
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
      // Crear la carpeta de logs si no existe
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
      // Get last modification date and last collaborator (if possible)
      let modDate = 'No date';
      // Removed lastAuthor logic
      try {
        if (fs.existsSync(this.outputPath)) {
          const stats = fs.statSync(this.outputPath);
          modDate = stats.mtime
            ? stats.mtime.toLocaleString('es-ES', {
                timeZone: 'America/Bogota',
              })
            : modDate;
        }
        // Try to get last author using git
        // Removed execSync import as collaborator logic is gone
        // Removed the gitLog assignment as collaborator logic is gone
      } catch {}

      // Add info to log content (at the end)
      const logWithMeta = `${content}\n\n---\nLast modification: ${modDate}`;
      fs.writeFileSync(this.outputPath, logWithMeta, 'utf8');
      this.logger.debug(`Report saved to: ${this.outputPath}`);
      // Copiar el viewer HTML en la carpeta de logs
      const possibleViewerPaths = [
        path.join(this.rootDir, 'frontend-standards-log-viewer.html'),
        path.join(this.rootDir, 'src', 'frontend-standards-log-viewer.html'),
        path.join(this.rootDir, 'bin', 'frontend-standards-log-viewer.html'),
        path.join(
          this.rootDir,
          'frontend-standards-full',
          'bin',
          'frontend-standards-log-viewer.html'
        ),
        path.join(
          this.rootDir,
          'node_modules',
          'frontend-standards-checker',
          'bin',
          'frontend-standards-log-viewer.html'
        ),
      ];
      let viewerSrc = '';
      for (const p of possibleViewerPaths) {
        if (fs.existsSync(p)) {
          viewerSrc = p;
          break;
        }
      }
      const viewerDest = path.join(
        this.logDir,
        'frontend-standards-log-viewer.html'
      );
      if (viewerSrc) {
        fs.copyFileSync(viewerSrc, viewerDest);
        this.logger.debug(`Viewer copied to: ${viewerDest}`);
      } else {
        this.logger.warn(
          'Viewer HTML not found in any known location, not copied'
        );
      }
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
