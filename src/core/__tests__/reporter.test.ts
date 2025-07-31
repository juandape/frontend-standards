
import fs from 'fs';
import path from 'path';
import { Reporter } from '../reporter';

jest.mock('fs');
jest.mock('path');
jest.mock('../../helpers/index.js', () => ({
  getGitLastAuthor: jest.fn(() => 'Mock Author'),
}));

const mockLogger = {
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  verbose: jest.fn(),
  levels: {},
  currentLevel: 'debug',
};

describe('Reporter', () => {
  it('should format report with only warnings', async () => {
    const report = await reporter.formatReport({
      totalErrors: 0,
      totalWarnings: 2,
      totalInfos: 0,
      errorsByRule: {},
      warningsByRule: { w1: 2 },
      infosByRule: {},
      errorsByZone: {},
      warningsByZone: {},
      infosByZone: {},
      oksByZone: {},
      totalCheckedByZone: {},
      summary: [],
      warningSummary: [{ rule: 'w1', count: 2, percentage: '100.0' }],
      infoSummary: [],
    }, {
      type: 'react',
      isMonorepo: false,
      projectType: 'react',
      zones: [],
      structure: {},
      rootPath: '/mock/root',
    }, {} as any);
    expect(report).toContain('warnings');
  });

  it('should format report with only infos', async () => {
    const report = await reporter.formatReport({
      totalErrors: 0,
      totalWarnings: 0,
      totalInfos: 2,
      errorsByRule: {},
      warningsByRule: {},
      infosByRule: { i1: 2 },
      errorsByZone: {},
      warningsByZone: {},
      infosByZone: {},
      oksByZone: {},
      totalCheckedByZone: {},
      summary: [],
      warningSummary: [],
      infoSummary: [{ rule: 'i1', count: 2, percentage: '100.0' }],
    }, {
      type: 'react',
      isMonorepo: false,
      projectType: 'react',
      zones: [],
      structure: {},
      rootPath: '/mock/root',
    }, {} as any);
    expect(report).toContain('suggestions');
  });

  it('should format report with warnings and infos', async () => {
    const report = await reporter.formatReport({
      totalErrors: 0,
      totalWarnings: 1,
      totalInfos: 1,
      errorsByRule: {},
      warningsByRule: { w1: 1 },
      infosByRule: { i1: 1 },
      errorsByZone: {},
      warningsByZone: {},
      infosByZone: {},
      oksByZone: {},
      totalCheckedByZone: {},
      summary: [],
      warningSummary: [{ rule: 'w1', count: 1, percentage: '100.0' }],
      infoSummary: [{ rule: 'i1', count: 1, percentage: '100.0' }],
    }, {
      type: 'react',
      isMonorepo: false,
      projectType: 'react',
      zones: [],
      structure: {},
      rootPath: '/mock/root',
    }, {} as any);
    expect(report).toContain('warnings');
    expect(report).toContain('suggestions');
  });

  it('should add detailed errors section', () => {
    const lines: string[] = [];
    const zoneErrors = {
      zoneA: [
        { filePath: 'fileA.js', message: 'Error message', severity: 'error', rule: 'r1', line: 10 },
        { filePath: 'fileA.js', message: '✅ ok', severity: 'error', rule: 'r2', line: 11 },
      ],
    };
    reporter.setOriginalZoneErrors(zoneErrors as any);
    reporter['addDetailedErrorsSection'](lines);
    expect(lines.join('\n')).toContain('DETAILED VIOLATIONS');
    expect(lines.join('\n')).toContain('Error message');
  });

  it('should add detailed warnings section', () => {
    const lines: string[] = [];
    const zoneErrors = {
      zoneA: [
        { filePath: 'fileA.js', message: 'Warning message', severity: 'warning', rule: 'w1', line: 5 },
        { filePath: 'fileA.js', message: '✅ ok', severity: 'error', rule: 'r2', line: 11 },
      ],
    };
    reporter.setOriginalZoneErrors(zoneErrors as any);
    reporter['addDetailedWarningsSection'](lines);
    expect(lines.join('\n')).toContain('DETAILED WARNINGS');
    expect(lines.join('\n')).toContain('Warning message');
  });

  it('should add detailed infos section', () => {
    const lines: string[] = [];
    const zoneErrors = {
      zoneA: [
        { filePath: 'fileA.js', message: 'Info message', severity: 'info', rule: 'i1', line: 2 },
        { filePath: 'fileA.js', message: '✅ ok', severity: 'error', rule: 'r2', line: 11 },
      ],
    };
    reporter.setOriginalZoneErrors(zoneErrors as any);
    reporter['addDetailedInfosSection'](lines);
    expect(lines.join('\n')).toContain('DETAILED INFO SUGGESTIONS');
    expect(lines.join('\n')).toContain('Info message');
  });

  it('should add statistics section for errors, warnings and infos', () => {
    const lines: string[] = [];
    reporter['addStatisticsSection'](lines, {
      summary: [{ rule: 'r1', count: 2, percentage: '66.7' }],
      warningSummary: [{ rule: 'w1', count: 1, percentage: '100.0' }],
      infoSummary: [{ rule: 'i1', count: 1, percentage: '100.0' }],
      totalErrors: 2,
      totalWarnings: 1,
      totalInfos: 1,
      errorsByRule: {},
      warningsByRule: {},
      infosByRule: {},
      errorsByZone: {},
      warningsByZone: {},
      infosByZone: {},
      oksByZone: {},
      totalCheckedByZone: {},
    });
    expect(lines.join('\n')).toContain('ERROR STATISTICS');
    expect(lines.join('\n')).toContain('WARNING STATISTICS');
    expect(lines.join('\n')).toContain('INFO SUGGESTIONS STATISTICS');
  });

  it('should add recommendations section', () => {
    const lines: string[] = [];
    reporter['addRecommendationsSection'](lines);
    expect(lines.join('\n')).toContain('RECOMMENDATIONS');
    expect(lines.join('\n')).toContain('Focus on the most frequent violation types');
  });

  it('should handle error in saveReport', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.writeFileSync as jest.Mock).mockImplementationOnce(() => { throw new Error('fail-write'); });
    await expect(reporter.saveReport('content')).rejects.toThrow('fail-write');
    expect(mockLogger.error).toHaveBeenCalled();
  });
  const rootDir = '/mock/root';
  const outputPath = '/mock/output.log';
  let reporter: Reporter;

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockImplementation((p) => {
      if (typeof p === 'string' && p.includes('viewer')) return true;
      if (typeof p === 'string' && p.includes('notfound')) return false;
      return true;
    });
    (fs.statSync as jest.Mock).mockReturnValue({
      mtime: new Date('2025-07-31T12:00:00Z'),
    });
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (fs.copyFileSync as jest.Mock).mockImplementation(() => {});
    (path.isAbsolute as jest.Mock).mockImplementation((p) => p.startsWith('/'));
    (path.resolve as jest.Mock).mockImplementation((...args) => args.join('/'));
    (path.basename as jest.Mock).mockImplementation((p) => p.split('/').pop());
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    reporter = new Reporter(rootDir, outputPath, mockLogger as any);
  });

  it('should initialize with correct paths', () => {
    expect(reporter.rootDir).toBe(rootDir);
    expect(reporter.outputPath).toBe(outputPath);
    expect(reporter.logger).toBe(mockLogger);
    expect(reporter.logDir).toContain('logs-standards-validations');
  });

  it('should detect jest files', () => {
    expect(reporter['isJestFile']('foo.test.js')).toBe(true);
    expect(reporter['isJestFile']('foo.spec.ts')).toBe(true);
    expect(reporter['isJestFile']('__tests__/foo.js')).toBe(true);
    expect(reporter['isJestFile']('fooJest.js')).toBe(true);
    expect(reporter['isJestFile']('foo.js')).toBe(false);
  });

  it('should get file meta for existing file', () => {
    const meta = reporter['getFileMeta']('/mock/file.js');
    expect(meta.modDate).toContain('2025');
    expect(meta.lastAuthor).toBe('Mock Author');
  });

  it('should get file meta for non-existing file', () => {
    (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
    const meta = reporter['getFileMeta']('/notfound.js');
    expect(meta.modDate).toBe('No date');
    expect(meta.lastAuthor).toBe('Unknown');
  });

  it('should process errors and skip jest files', () => {
    const zoneErrors = {
      zone1: [
        { filePath: 'foo.test.js', message: 'error', severity: 'error', rule: 'r1' },
        { filePath: 'bar.js', message: 'error', severity: 'error', rule: 'r2' },
        { filePath: 'bar.js', message: 'warning', severity: 'warning', rule: 'r3' },
        { filePath: 'bar.js', message: 'info', severity: 'info', rule: 'r4' },
        { filePath: 'bar.js', message: '✅ ok', severity: 'error', rule: 'r5' },
        { filePath: 'bar.js', message: 'Present: ok', severity: 'error', rule: 'r6' },
      ],
    };
    const data = reporter.processErrors(zoneErrors as any);
    expect(data.totalErrors).toBe(1);
    expect(data.totalWarnings).toBe(1);
    expect(data.totalInfos).toBe(1);
    expect(data.oksByZone.zone1).toBeDefined();
    expect(data.oksByZone.zone1?.length).toBe(2);
  });

  it('should generate summary', () => {
    const summary = reporter.generateSummary({ r1: 2, r2: 1 }, 3);
    expect(summary.length).toBe(2);
    expect(summary[0]).toBeDefined();
    expect(summary[0]?.rule).toBe('r1');
    expect(summary[0]?.percentage).toBe('66.7');
  });

  it('should generate empty summary if no errors', () => {
    expect(reporter.generateSummary({}, 0)).toEqual([]);
  });

  it('should format report for all validations passed', async () => {
    const report = await reporter.formatReport({
      totalErrors: 0,
      totalWarnings: 0,
      totalInfos: 0,
      errorsByRule: {},
      warningsByRule: {},
      infosByRule: {},
      errorsByZone: {},
      warningsByZone: {},
      infosByZone: {},
      oksByZone: {},
      totalCheckedByZone: {},
      summary: [],
      warningSummary: [],
      infoSummary: [],
    }, {
      type: 'react',
      isMonorepo: false,
      projectType: 'react',
      zones: [],
      structure: {},
      rootPath: '/mock/root',
    }, {} as any);
    expect(report).toContain('ALL VALIDATIONS PASSED');
  });

  it('should call saveReport and copy viewer', async () => {
    // Forzar que la carpeta de logs no existe (para que se llame mkdirSync), y que el viewer sí existe
    (fs.existsSync as jest.Mock).mockImplementation((p) => {
      if (typeof p === 'string' && p.includes('logs-standards-validations')) return false;
      if (typeof p === 'string' && p.includes('viewer')) return true;
      return true;
    });
    await reporter.saveReport('content');
    expect(fs.mkdirSync).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(fs.copyFileSync).toHaveBeenCalled();
  });

  it('should handle missing viewer in saveReport', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    await reporter.saveReport('content');
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('should get/set original zone errors', () => {
    const errors = { zone: [{ filePath: 'a', message: 'm', severity: 'error', rule: 'r' }] };
    reporter.setOriginalZoneErrors(errors as any);
    expect(reporter.getOriginalZoneErrors()).toBe(errors);
  });

  it('should generate quick summary for errors', () => {
    const summary = reporter.generateQuickSummary({
      totalErrors: 2,
      summary: [
        { rule: 'r1', count: 1, percentage: '50.0' },
        { rule: 'r2', count: 1, percentage: '50.0' },
      ],
    } as any);
    expect(summary).toContain('violations found');
  });

  it('should generate quick summary for no errors', () => {
    const summary = reporter.generateQuickSummary({ totalErrors: 0, summary: [] } as any);
    expect(summary).toContain('All validations passed');
  });


  it('should format report with only warnings', async () => {
    const report = await reporter.formatReport({
      totalErrors: 0,
      totalWarnings: 2,
      totalInfos: 0,
      errorsByRule: {},
      warningsByRule: { w1: 2 },
      infosByRule: {},
      errorsByZone: {},
      warningsByZone: {},
      infosByZone: {},
      oksByZone: {},
      totalCheckedByZone: {},
      summary: [],
      warningSummary: [{ rule: 'w1', count: 2, percentage: '100.0' }],
      infoSummary: [],
    }, {
      type: 'react',
      isMonorepo: false,
      projectType: 'react',
      zones: [],
      structure: {},
      rootPath: '/mock/root',
    }, {} as any);
    expect(report).toContain('warnings');
  });

  it('should format report with only infos', async () => {
    const report = await reporter.formatReport({
      totalErrors: 0,
      totalWarnings: 0,
      totalInfos: 2,
      errorsByRule: {},
      warningsByRule: {},
      infosByRule: { i1: 2 },
      errorsByZone: {},
      warningsByZone: {},
      infosByZone: {},
      oksByZone: {},
      totalCheckedByZone: {},
      summary: [],
      warningSummary: [],
      infoSummary: [{ rule: 'i1', count: 2, percentage: '100.0' }],
    }, {
      type: 'react',
      isMonorepo: false,
      projectType: 'react',
      zones: [],
      structure: {},
      rootPath: '/mock/root',
    }, {} as any);
    expect(report).toContain('suggestions');
  });

  it('should format report with warnings and infos', async () => {
    const report = await reporter.formatReport({
      totalErrors: 0,
      totalWarnings: 1,
      totalInfos: 1,
      errorsByRule: {},
      warningsByRule: { w1: 1 },
      infosByRule: { i1: 1 },
      errorsByZone: {},
      warningsByZone: {},
      infosByZone: {},
      oksByZone: {},
      totalCheckedByZone: {},
      summary: [],
      warningSummary: [{ rule: 'w1', count: 1, percentage: '100.0' }],
      infoSummary: [{ rule: 'i1', count: 1, percentage: '100.0' }],
    }, {
      type: 'react',
      isMonorepo: false,
      projectType: 'react',
      zones: [],
      structure: {},
      rootPath: '/mock/root',
    }, {} as any);
    expect(report).toContain('warnings');
    expect(report).toContain('suggestions');
  });

  it('should add detailed errors section', () => {
    const lines: string[] = [];
    const zoneErrors = {
      zoneA: [
        { filePath: 'fileA.js', message: 'Error message', severity: 'error', rule: 'r1', line: 10 },
        { filePath: 'fileA.js', message: '✅ ok', severity: 'error', rule: 'r2', line: 11 },
      ],
    };
    reporter.setOriginalZoneErrors(zoneErrors as any);
    reporter['addDetailedErrorsSection'](lines);
    expect(lines.join('\n')).toContain('DETAILED VIOLATIONS');
    expect(lines.join('\n')).toContain('Error message');
  });

  it('should add detailed warnings section', () => {
    const lines: string[] = [];
    const zoneErrors = {
      zoneA: [
        { filePath: 'fileA.js', message: 'Warning message', severity: 'warning', rule: 'w1', line: 5 },
        { filePath: 'fileA.js', message: '✅ ok', severity: 'error', rule: 'r2', line: 11 },
      ],
    };
    reporter.setOriginalZoneErrors(zoneErrors as any);
    reporter['addDetailedWarningsSection'](lines);
    expect(lines.join('\n')).toContain('DETAILED WARNINGS');
    expect(lines.join('\n')).toContain('Warning message');
  });

  it('should add detailed infos section', () => {
    const lines: string[] = [];
    const zoneErrors = {
      zoneA: [
        { filePath: 'fileA.js', message: 'Info message', severity: 'info', rule: 'i1', line: 2 },
        { filePath: 'fileA.js', message: '✅ ok', severity: 'error', rule: 'r2', line: 11 },
      ],
    };
    reporter.setOriginalZoneErrors(zoneErrors as any);
    reporter['addDetailedInfosSection'](lines);
    expect(lines.join('\n')).toContain('DETAILED INFO SUGGESTIONS');
    expect(lines.join('\n')).toContain('Info message');
  });

  it('should add statistics section for errors, warnings and infos', () => {
    const lines: string[] = [];
    reporter['addStatisticsSection'](lines, {
      summary: [{ rule: 'r1', count: 2, percentage: '66.7' }],
      warningSummary: [{ rule: 'w1', count: 1, percentage: '100.0' }],
      infoSummary: [{ rule: 'i1', count: 1, percentage: '100.0' }],
      totalErrors: 2,
      totalWarnings: 1,
      totalInfos: 1,
      errorsByRule: {},
      warningsByRule: {},
      infosByRule: {},
      errorsByZone: {},
      warningsByZone: {},
      infosByZone: {},
      oksByZone: {},
      totalCheckedByZone: {},
    });
    expect(lines.join('\n')).toContain('ERROR STATISTICS');
    expect(lines.join('\n')).toContain('WARNING STATISTICS');
    expect(lines.join('\n')).toContain('INFO SUGGESTIONS STATISTICS');
  });

  it('should add recommendations section', () => {
    const lines: string[] = [];
    reporter['addRecommendationsSection'](lines);
    expect(lines.join('\n')).toContain('RECOMMENDATIONS');
    expect(lines.join('\n')).toContain('Focus on the most frequent violation types');
  });

  it('should handle error in saveReport', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.writeFileSync as jest.Mock).mockImplementationOnce(() => { throw new Error('fail-write'); });
    await expect(reporter.saveReport('content')).rejects.toThrow('fail-write');
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('should export JSON report', async () => {
    const data = { foo: 'bar' };
    const path = await reporter.exportJson(data as any, '/mock/out.json');
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(path).toBe('/mock/out.json');
  });

  it('should throw on exportJson error', async () => {
    (fs.writeFileSync as jest.Mock).mockImplementationOnce(() => { throw new Error('fail'); });
    await expect(reporter.exportJson({} as any, '/fail.json')).rejects.toThrow('fail');
  });
});
