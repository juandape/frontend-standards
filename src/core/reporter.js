import fs from 'fs';
import path from 'path';

/**
 * Reporter for generating detailed validation reports
 */
export class Reporter {
  constructor(rootDir, outputPath, logger) {
    this.rootDir = rootDir;
    this.outputPath =
      outputPath || path.join(rootDir, 'frontend-standards.log');
    this.logger = logger;
  }

  /**
   * Generate and save validation report
   * @param {Object} zoneErrors Errors grouped by zone
   * @param {Object} projectInfo Project information
   * @param {Object} config Configuration object
   * @returns {Promise<Object>} Report results
   */
  async generate(zoneErrors, projectInfo, config) {
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
   * @param {Object} zoneErrors Errors grouped by zone
   * @returns {Object} Processed error data
   */
  processErrors(zoneErrors) {
    const errorsByRule = {};
    const oksByZone = {};
    const errorsByZone = {};
    const totalCheckedByZone = {};
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
   * @param {Object} errorsByRule Errors grouped by rule
   * @param {number} totalErrors Total error count
   * @returns {Array} Summary data
   */
  generateSummary(errorsByRule, totalErrors) {
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
   * @param {Object} reportData Processed report data
   * @param {Object} projectInfo Project information
   * @param {Object} config Configuration
   * @returns {string} Formatted report content
   */
  formatReport(reportData, projectInfo, config) {
    const lines = [];

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
  addReportHeader(lines, projectInfo) {
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
  addSummarySection(lines, reportData) {
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
  addZoneResultsSection(lines, reportData) {
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
  addDetailedErrorsSection(lines) {
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
            ? `${error.file}:${error.line}`
            : error.file;
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
  addStatisticsSection(lines, reportData) {
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
  addRecommendationsSection(lines) {
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
   * @param {string} content Report content
   */
  async saveReport(content) {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.outputPath, content, 'utf8');
      this.logger.debug(`Report saved to: ${this.outputPath}`);
    } catch (error) {
      this.logger.error(`Failed to save report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get original zone errors (placeholder for accessing original data)
   * In a real implementation, this would access the stored zone errors
   */
  getOriginalZoneErrors() {
    // This would be set during the generate method call
    return this._originalZoneErrors || {};
  }

  /**
   * Set original zone errors for detailed reporting
   * @param {Object} zoneErrors Original zone errors
   */
  setOriginalZoneErrors(zoneErrors) {
    this._originalZoneErrors = zoneErrors;
  }

  /**
   * Generate a quick summary for console output
   * @param {Object} reportData Processed report data
   * @returns {string} Quick summary
   */
  generateQuickSummary(reportData) {
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
   * @param {Object} reportData Report data
   * @param {string} outputPath Output file path
   */
  async exportJson(reportData, outputPath = null) {
    const jsonPath = outputPath || this.outputPath.replace('.log', '.json');

    try {
      const jsonContent = JSON.stringify(reportData, null, 2);
      fs.writeFileSync(jsonPath, jsonContent, 'utf8');
      this.logger.debug(`JSON report exported to: ${jsonPath}`);
      return jsonPath;
    } catch (error) {
      this.logger.error(`Failed to export JSON report: ${error.message}`);
      throw error;
    }
  }
}
