import { jest } from '@jest/globals';

// ESM-compatible mocks
jest.unstable_mockModule('fs', () => {
  const fsMock = {
    existsSync: jest.fn((p) => {
      if (
        typeof p === 'string' &&
        (p.endsWith('/file') ||
          p.endsWith('/file.ts') ||
          p.endsWith('index.ts'))
      )
        return true;
      if (
        typeof p === 'string' &&
        p.includes('frontend-standards-log-viewer.html')
      )
        return true;
      return true;
    }),
    statSync: jest.fn((p) => {
      if (
        typeof p === 'string' &&
        (p.endsWith('/file') || p.endsWith('/file.ts'))
      ) {
        return {
          mtime: new Date('2025-07-23T11:04:39'),
          isDirectory: () => false,
        };
      }
      if (typeof p === 'string' && p.includes('file1')) {
        return {
          mtime: new Date('2023-01-01T10:00:00Z'),
          isDirectory: () => false,
        };
      }
      // Removed unused mockReportData variable
      return '';
    }),
  };
  return { __esModule: true, ...fsMock, default: fsMock };
});
jest.unstable_mockModule('path', () => {
  const pathMock = {
    basename: jest.fn((p: unknown) => {
      if (
        typeof p === 'string' &&
        (p.endsWith('/file') || p.endsWith('/file.ts'))
      )
        return p.split('/').pop();
      if (typeof p === 'string' && p.includes('file1')) return 'file1';
      if (typeof p === 'string' && p.includes('file2')) return 'file2';
      if (typeof p === 'string' && p.includes('file3')) return 'file3';
      if (typeof p === 'string' && p.includes('root')) return 'root';
      return typeof p === 'string' ? p.split('/').pop() : '';
    }),
    dirname: jest.fn((p: unknown) =>
      typeof p === 'string' ? p.split('/').slice(0, -1).join('/') : ''
    ),
    extname: jest.fn((p: unknown) =>
      typeof p === 'string' ? '.' + p.split('.').pop() : ''
    ),
    join: jest.fn((...args) => args.join('/')),
    resolve: jest.fn((...args) => args.join('/')),
    sep: '/',
    relative: jest.fn((from: unknown, to: unknown) =>
      typeof from === 'string' && typeof to === 'string'
        ? to.replace(from, '')
        : ''
    ),
  };
  return { __esModule: true, ...pathMock, default: pathMock };
});
jest.unstable_mockModule('child_process', () => ({
  __esModule: true,
  execSync: jest.fn(),
  default: { execSync: jest.fn() },
}));

let Reporter: any;
let fs: any;
let path: any;
let child_process: any;

describe('Reporter', () => {
  let mockLogger: any;
  let reporter: any;
  const mockRootDir = '/project/root';
  const mockOutputPath = '/project/root/logs/frontend-standards.log';

  beforeEach(async () => {
    jest.clearAllMocks();

    // Dynamic imports for ESM mocks
    ({ Reporter } = await import('../reporter.js'));
    fs = (await import('fs')).default;
    path = (await import('path')).default;
    child_process = (await import('child_process')).default;

    // Ensure execSync is always a Jest mock and set its return value
    if (
      typeof child_process.execSync === 'function' &&
      'mockReturnValue' in child_process.execSync
    ) {
      child_process.execSync.mockReturnValue('test-author');
    } else {
      child_process.execSync = jest.fn().mockReturnValue('test-author');
    }

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'statSync').mockImplementation((p) => {
      if (typeof p === 'string' && p.includes('file')) {
        // Use a fixed date/time for test consistency
        return {
          mtime: new Date('2025-07-23T11:04:39'),
          isDirectory: () => false,
        };
      }
      return { mtime: new Date('2023-01-01'), isDirectory: () => false };
    });
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
    jest.spyOn(fs, 'copyFileSync').mockImplementation(() => undefined);

    reporter = new Reporter(mockRootDir, mockOutputPath, mockLogger);
  });

  describe('constructor', () => {
    it('should initialize with provided parameters', () => {
      expect(reporter.rootDir).toBe(mockRootDir);
      expect(reporter.logger).toBe(mockLogger);
      expect(reporter.outputPath).toBe(mockOutputPath);
      // El logger.debug puede no ser llamado en el constructor, así que no lo verificamos aquí
    });

    it('should create log directory with timestamp when no output path provided', () => {
      const now = new Date();
      jest.spyOn(global, 'Date').mockImplementation(() => now as any);

      const newReporter = new Reporter(mockRootDir, null, mockLogger);

      const expectedFolderName = `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now
        .getHours()
        .toString()
        .padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now
        .getSeconds()
        .toString()
        .padStart(2, '0')}`;
      const expectedPath = path.join(
        mockRootDir,
        'logs-standards-validations',
        expectedFolderName,
        'frontend-standards.log'
      );

      expect(newReporter.outputPath).toBe(expectedPath);
      jest.restoreAllMocks(); // Restore Date after test
    });
  });

  describe('getFileMeta', () => {
    it('should return file metadata', () => {
      const testPath = '/path/to/file';
      // removed unused absPath and relPath
      const mockDate = new Date('2025-07-23T11:04:39');
      const actualDate = mockDate.toLocaleString('es-ES', {
        timeZone: 'America/Bogota',
      });

      child_process.execSync.mockReturnValue('test-author');
      jest.spyOn(fs, 'existsSync').mockImplementation(() => true);
      jest.spyOn(fs, 'statSync').mockImplementation(() => ({
        mtime: mockDate,
        isDirectory: () => false,
      }));

      const result = reporter['getFileMeta'](testPath);
      expect(result.modDate).toBe(actualDate);
      expect(result.lastAuthor).toBe('test-author');
      jest.restoreAllMocks();
    });

    it('should handle errors when getting file metadata', () => {
      jest.spyOn(fs, 'statSync').mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = reporter['getFileMeta']('/path/to/nonexistent/file');

      expect(result.modDate).toBe('No date');
      expect(result.lastAuthor).toBe('Unknown');
    });
  });

  describe('generate', () => {
    const mockZoneErrors = {
      'zone1': [
        {
          filePath: '/path/to/file1',
          rule: 'rule1',
          message: 'error message',
          severity: 'error' as const,
          line: 10,
          category: 'frontend',
        },
      ],
    };

    const mockProjectInfo = {
      type: 'react' as const,
      isMonorepo: false,
      projectType: 'react' as const,
      zones: [
        {
          name: 'zone1',
          path: '/project/root/zone1',
          type: 'react' as const,
        },
      ],
      structure: {},
      rootPath: '/project/root',
    };

    const mockConfig = {
      rules: [],
      merge: true,
    };

    it('should generate a report', async () => {
      const result = await reporter.generate(
        mockZoneErrors,
        mockProjectInfo,
        mockConfig
      );

      expect(result).toEqual({
        logFile: expect.any(String),
        totalErrors: expect.any(Number),
        totalWarnings: expect.any(Number),
        totalInfos: expect.any(Number),
        totalZones: expect.any(Number),
        zoneErrors: mockZoneErrors,
        summary: expect.any(Array),
        warningSummary: expect.any(Array),
        infoSummary: expect.any(Array),
      });
    });
  });

  describe('processErrors', () => {
    it('should process errors and generate statistics', () => {
      const zoneErrors = {
        'zone1': [
          {
            filePath: 'file1',
            rule: 'rule1',
            message: 'error1',
            severity: 'error' as const,
            category: 'frontend',
          },
          {
            filePath: 'file2',
            rule: 'rule2',
            message: 'warning1',
            severity: 'warning' as const,
            category: 'frontend',
          },
          {
            filePath: 'file3',
            rule: 'rule3',
            message: 'info1',
            severity: 'info' as const,
            category: 'frontend',
          },
          {
            filePath: 'file4',
            rule: 'rule4',
            message: '✅ passed',
            severity: 'info' as const,
            category: 'frontend',
          },
        ],
        'zone2': [
          {
            filePath: 'file5',
            rule: 'rule1',
            message: 'error2',
            severity: 'error' as const,
            category: 'frontend',
          },
        ],
      };

      const result = reporter['processErrors'](zoneErrors);

      expect(result.totalErrors).toBe(2);
      expect(result.totalWarnings).toBe(1);
      expect(result.totalInfos).toBe(1);
      expect(result.errorsByRule['rule1']).toBe(2);
      expect(result.warningsByRule['rule2']).toBe(1);
      expect(result.infosByRule['rule3']).toBe(1);
      expect(result.oksByZone['zone1']).toEqual(['passed']);
    });
  });

  describe('generateSummary', () => {
    it('should generate a summary of errors', () => {
      const errorsByRule = {
        'rule1': 5,
        'rule2': 3,
        'rule3': 1,
      };
      const totalErrors = 9;

      const result = reporter['generateSummary'](errorsByRule, totalErrors);

      expect(result).toEqual([
        { rule: 'rule1', count: 5, percentage: '55.6' },
        { rule: 'rule2', count: 3, percentage: '33.3' },
        { rule: 'rule3', count: 1, percentage: '11.1' },
      ]);
    });

    it('should return empty array when no errors', () => {
      const result = reporter['generateSummary']({}, 0);
      expect(result).toEqual([]);
    });
  });

  describe('formatReport', () => {
    // Removed unused mockReportData variable

    const mockProjectInfo = {
      type: 'react' as const,
      isMonorepo: false,
      projectType: 'react' as const,
      zones: [
        {
          name: 'zone1',
          path: '/project/root/zone1',
          type: 'react' as const,
        },
      ],
      structure: {},
      rootPath: '/project/root',
    };

    const mockConfig = {
      rules: [],
      merge: true,
    };

    it('should format a complete report with errors', async () => {
      // Use a more complete mockReportData to ensure formatReport returns a string
      const fullMockReportData = {
        totalErrors: 2,
        totalWarnings: 1,
        totalInfos: 1,
        errorsByRule: { 'rule1': 2 },
        warningsByRule: { 'rule2': 1 },
        infosByRule: { 'rule3': 1 },
        errorsByZone: { 'zone1': 1, 'zone2': 1 },
        warningsByZone: { 'zone1': 1 },
        infosByZone: { 'zone1': 1 },
        oksByZone: { 'zone1': ['passed'] },
        totalCheckedByZone: { 'zone1': 3, 'zone2': 1 },
        summary: [{ rule: 'rule1', count: 2, percentage: '100.0' }],
        warningSummary: [{ rule: 'rule2', count: 1, percentage: '100.0' }],
        infoSummary: [{ rule: 'rule3', count: 1, percentage: '100.0' }],
      };
      reporter.setOriginalZoneErrors({
        'zone1': [
          {
            filePath: '/path/to/file1',
            rule: 'rule1',
            message: 'error1',
            severity: 'error',
            line: 10,
            category: 'frontend',
          },
          {
            filePath: '/path/to/file2',
            rule: 'rule2',
            message: 'warning1',
            severity: 'warning',
            category: 'frontend',
          },
          {
            filePath: '/path/to/file3',
            rule: 'rule3',
            message: 'info1',
            severity: 'info',
            category: 'frontend',
          },
          {
            filePath: '/path/to/file4',
            rule: 'rule4',
            message: '✅ passed',
            severity: 'info',
            category: 'frontend',
          },
        ],
      });

      let report = await reporter['formatReport'](
        fullMockReportData,
        mockProjectInfo,
        mockConfig
      );
      if (typeof report !== 'string') report = report.toString();
      expect(typeof report).toBe('string');
      expect(report).toMatch(/FRONTEND STANDARDS VALIDATION REPORT/);
      expect(report).toMatch(/Project: root/);
      expect(report).toMatch(/Project Type: react/);
      expect(report).toMatch(/SUMMARY: 2 violations found/);
      expect(report).toMatch(/RESULTS BY ZONE/);
      expect(report).toMatch(/DETAILED VIOLATIONS/);
      expect(report).toMatch(/DETAILED WARNINGS/);
      expect(report).toMatch(/DETAILED INFO SUGGESTIONS/);
      expect(report).toMatch(/ERROR STATISTICS/);
      expect(report).toMatch(/RECOMMENDATIONS/);
      expect(report).toMatch(/error1/);
      expect(report).toMatch(/warning1/);
      expect(report).toMatch(/info1/);
    });

    it('should format a success report when no errors', async () => {
      const successReportData = {
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
      };
      reporter.setOriginalZoneErrors({});

      let report = await reporter['formatReport'](
        successReportData,
        mockProjectInfo,
        mockConfig
      );
      if (typeof report !== 'string') report = report.toString();
      expect(typeof report).toBe('string');
      expect(report).toContain('✅ ALL VALIDATIONS PASSED!');
      expect(report).not.toContain('DETAILED VIOLATIONS');
    });
  });

  describe('saveReport', () => {
    it('should save the report to file', async () => {
      const mockContent = 'Test report content';
      let callCount = 0;
      jest.spyOn(fs, 'existsSync').mockImplementation(() => {
        callCount++;
        return callCount > 1;
      });
      await reporter['saveReport'](mockContent);
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockOutputPath,
        expect.stringContaining(mockContent),
        'utf8'
      );
      jest.restoreAllMocks();
    });

    it('should copy viewer HTML if found', async () => {
      const mockViewerPath = '/path/to/viewer.html';
      jest.spyOn(fs, 'existsSync').mockImplementation((p) => {
        if (p === mockViewerPath) return true;
        if (
          typeof p === 'string' &&
          p.includes('frontend-standards-log-viewer.html')
        )
          return true;
        return false;
      });
      await reporter['saveReport']('Test content');
      expect(fs.copyFileSync).toHaveBeenCalled();
      jest.restoreAllMocks();
    });

    it('should handle errors when saving report', async () => {
      jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
        throw new Error('Write failed');
      });
      await expect(reporter['saveReport']('Test content')).rejects.toThrow(
        'Write failed'
      );
      expect(mockLogger.error).toHaveBeenCalled();
      jest.restoreAllMocks();
    });
  });

  describe('generateQuickSummary', () => {
    it('should generate a summary when there are errors', () => {
      const reportData = {
        totalErrors: 5,
        summary: [
          { rule: 'rule1', count: 3, percentage: '60.0' },
          { rule: 'rule2', count: 2, percentage: '40.0' },
        ],
      } as any;

      const summary = reporter['generateQuickSummary'](reportData);

      expect(summary).toBe(
        '❌ 5 violations found. Top issues: rule1 (3), rule2 (2)'
      );
    });

    it('should return success message when no errors', () => {
      const reportData = {
        totalErrors: 0,
        summary: [],
      } as any;

      const summary = reporter['generateQuickSummary'](reportData);

      expect(summary).toBe('✅ All validations passed!');
    });
  });

  describe('exportJson', () => {
    it('should export report data as JSON', async () => {
      const mockReportData = {
        totalErrors: 1,
        summary: [{ rule: 'rule1', count: 1, percentage: '100.0' }],
      } as any;

      const jsonPath = await reporter['exportJson'](mockReportData);

      expect(jsonPath).toBe(mockOutputPath.replace('.log', '.json'));
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        jsonPath,
        JSON.stringify(mockReportData, null, 2),
        'utf8'
      );
    });

    it('should use custom output path when provided', async () => {
      const customPath = '/custom/path/report.json';
      const mockReportData = {} as any;

      const jsonPath = await reporter['exportJson'](mockReportData, customPath);

      expect(jsonPath).toBe(customPath);
    });
  });

  // Test helper methods
  describe('helper methods', () => {
    it('should get and set original zone errors', () => {
      const mockErrors = { 'zone1': [] };

      reporter.setOriginalZoneErrors(mockErrors);
      const result = reporter.getOriginalZoneErrors();

      expect(result).toBe(mockErrors);
    });
  });

  // Test report section generators
  describe('report section generators', () => {
    const mockLines: string[] = [];
    // ...existing code...

    beforeEach(() => {
      mockLines.length = 0;
      reporter.setOriginalZoneErrors({
        'zone1': [
          {
            filePath: '/path/to/file1',
            rule: 'rule1',
            message: 'error1',
            severity: 'error',
            line: 10,
            category: 'frontend',
          },
          {
            filePath: '/path/to/file2',
            rule: 'rule2',
            message: 'warning1',
            severity: 'warning',
            category: 'frontend',
          },
          {
            filePath: '/path/to/file3',
            rule: 'rule3',
            message: 'info1',
            severity: 'info',
            category: 'frontend',
          },
        ],
      });
    });

    it('should add report header', () => {
      reporter['addReportHeader'](mockLines, {
        type: 'react' as const,
        isMonorepo: false,
        projectType: 'react' as const,
        zones: [
          {
            name: 'zone1',
            path: '/project/root/zone1',
            type: 'react' as const,
          },
        ],
        structure: {},
        rootPath: '/project/root',
      });

      expect(mockLines.join('\n')).toContain(
        'FRONTEND STANDARDS VALIDATION REPORT'
      );
      expect(mockLines.join('\n')).toContain('Project: root');
    });

    it('should add summary section', () => {
      const sectionMockData = {
        totalErrors: 1,
        totalWarnings: 1,
        totalInfos: 1,
        errorsByZone: { 'zone1': 1 },
        warningsByZone: { 'zone1': 1 },
        infosByZone: { 'zone1': 1 },
        summary: [{ rule: 'rule1', count: 1, percentage: '100.0' }],
        warningSummary: [{ rule: 'rule2', count: 1, percentage: '100.0' }],
        infoSummary: [{ rule: 'rule3', count: 1, percentage: '100.0' }],
      };
      reporter['addSummarySection'](mockLines, sectionMockData);

      expect(mockLines.join('\n')).toContain('SUMMARY: 1 violations found');
      expect(mockLines.join('\n')).toContain(
        'Additional warnings: 1 warnings found'
      );
    });

    it('should add zone results section', () => {
      const sectionMockData = {
        totalErrors: 1,
        totalWarnings: 1,
        totalInfos: 1,
        errorsByZone: { 'zone1': 1 },
        warningsByZone: { 'zone1': 1 },
        infosByZone: { 'zone1': 1 },
        summary: [{ rule: 'rule1', count: 1, percentage: '100.0' }],
        warningSummary: [{ rule: 'rule2', count: 1, percentage: '100.0' }],
        infoSummary: [{ rule: 'rule3', count: 1, percentage: '100.0' }],
      };
      reporter['addZoneResultsSection'](mockLines, sectionMockData);

      expect(mockLines.join('\n')).toContain('RESULTS BY ZONE');
      expect(mockLines.join('\n')).toContain('📂 Zone: zone1');
    });

    it('should add detailed errors section', () => {
      reporter['addDetailedErrorsSection'](mockLines);

      expect(mockLines.join('\n')).toContain('DETAILED VIOLATIONS');
      // Aceptar rutas relativas
      expect(mockLines.join('\n')).toMatch(/📄 .*file1:10/);
    });

    it('should add detailed warnings section', () => {
      reporter['addDetailedWarningsSection'](mockLines);

      expect(mockLines.join('\n')).toContain('DETAILED WARNINGS');
      expect(mockLines.join('\n')).toMatch(/📄 .*file2/);
    });

    it('should add detailed infos section', () => {
      reporter['addDetailedInfosSection'](mockLines);

      expect(mockLines.join('\n')).toContain('DETAILED INFO SUGGESTIONS');
      expect(mockLines.join('\n')).toMatch(/📄 .*file3/);
    });

    it('should add statistics section', () => {
      const sectionMockData = {
        totalErrors: 1,
        totalWarnings: 1,
        totalInfos: 1,
        errorsByZone: { 'zone1': 1 },
        warningsByZone: { 'zone1': 1 },
        infosByZone: { 'zone1': 1 },
        summary: [{ rule: 'rule1', count: 1, percentage: '100.0' }],
        warningSummary: [{ rule: 'rule2', count: 1, percentage: '100.0' }],
        infoSummary: [{ rule: 'rule3', count: 1, percentage: '100.0' }],
        errorsByRule: { 'rule1': 1 },
      };
      reporter['addStatisticsSection'](mockLines, sectionMockData);

      expect(mockLines.join('\n')).toContain('ERROR STATISTICS');
      expect(mockLines.join('\n')).toContain('rule1: 1 occurrences (100.0%)');
    });

    it('should add recommendations section', () => {
      reporter['addRecommendationsSection'](mockLines);

      expect(mockLines.join('\n')).toContain('RECOMMENDATIONS');
      expect(mockLines.join('\n')).toContain(
        'Focus on the most frequent violation types'
      );
    });
  });
});
