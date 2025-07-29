describe('async helpers', () => {
  it('loadAndLogConfig retorna config y loguea si debug', async () => {
    const config = { foo: 'bar' };
    const configLoader = { load: jest.fn().mockResolvedValue(config) };
    const logger: any = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      verbose: false,
      levels: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 },
      currentLevel: 2,
      setLevel: jest.fn(),
      isLevelEnabled: jest.fn(() => true),
    };
    logger.withPrefix = function () {
      return this;
    };
    const options = { config: 'path', debug: true };
    const result = await helpers.loadAndLogConfig(
      configLoader,
      options,
      logger
    );
    expect(result).toBe(config);
    expect(logger.debug).toHaveBeenCalledWith(
      'Configuration loaded:',
      JSON.stringify(config, null, 2)
    );
  });

  it('analyzeProject retorna projectInfo y loguea', async () => {
    const projectInfo = {
      projectType: 'react',
      isMonorepo: true,
      zones: [],
      rootPath: '',
    };
    const projectAnalyzer = {
      analyze: jest.fn().mockResolvedValue(projectInfo),
    };
    const config = { zones: {} };
    const logger: any = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      verbose: false,
      levels: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 },
      currentLevel: 2,
      setLevel: jest.fn(),
      isLevelEnabled: jest.fn(() => true),
    };
    logger.withPrefix = function () {
      return this;
    };
    const options = { debug: true };
    const result = await helpers.analyzeProject(
      projectAnalyzer,
      config,
      logger,
      options
    );
    expect(result).toBe(projectInfo);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Project type: react')
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Monorepo: Yes')
    );
    expect(logger.debug).toHaveBeenCalledWith(
      'Project analysis result:',
      projectInfo
    );
  });

  it('getChangedFiles retorna archivos y loguea', async () => {
    const fileScanner = {
      getFilesInCommit: jest.fn().mockResolvedValue(['a.js', 'b.js']),
    };
    const logger: any = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      verbose: false,
      levels: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 },
      currentLevel: 2,
      setLevel: jest.fn(),
      isLevelEnabled: jest.fn(() => true),
    };
    logger.withPrefix = function () {
      return this;
    };
    const result = await helpers.getChangedFiles(fileScanner, logger);
    expect(result).toEqual(['a.js', 'b.js']);
    expect(logger.info).toHaveBeenCalledWith(
      '🔍 Only checking files staged for commit'
    );
    expect(logger.info).toHaveBeenCalledWith('Found 2 files to check');
  });

  it('logSummary imprime resumen', () => {
    const logger: any = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      verbose: false,
      levels: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 },
      currentLevel: 2,
      setLevel: jest.fn(),
      isLevelEnabled: jest.fn(() => true),
    };
    logger.withPrefix = function () {
      return this;
    };
    const summary = {
      processingTime: 123,
      errorsByCategory: {},
      errorsByRule: {},
    };
    helpers.logSummary(logger, summary, 5, 2, 1);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Validation completed')
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Total files: 5')
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Total errors: 2')
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Total warnings: 1')
    );
  });

  it('generateReport llama a reporter.generate y loguea', async () => {
    const reporter = { generate: jest.fn() };
    const logger: any = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      verbose: false,
      levels: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 },
      currentLevel: 2,
      setLevel: jest.fn(),
      isLevelEnabled: jest.fn(() => true),
    };
    logger.withPrefix = function () {
      return this;
    };
    const zoneResults = [
      {
        zone: 'A',
        errors: [
          {
            rule: 'r1',
            message: '',
            filePath: '',
            severity: 'error' as const,
            category: 'cat1',
          },
          {
            rule: 'r2',
            message: '',
            filePath: '',
            severity: 'warning' as const,
            category: 'cat2',
          },
        ],
        filesProcessed: 2,
        errorsCount: 2,
        warningsCount: 0,
      },
      {
        zone: 'B',
        errors: [
          {
            rule: 'r1',
            message: '',
            filePath: '',
            severity: 'error' as const,
            category: 'cat1',
          },
        ],
        filesProcessed: 1,
        errorsCount: 1,
        warningsCount: 0,
      },
    ];
    const projectInfo = {
      isMonorepo: false,
      projectType: 'react' as const,
      zones: [],
      rootPath: '',
    };
    const config = {};
    await helpers.generateReport(
      reporter,
      logger,
      zoneResults,
      projectInfo,
      config
    );
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('Zone A')
    );
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('Zone B')
    );
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('Total errors being passed')
    );
    expect(reporter.generate).toHaveBeenCalledWith(
      expect.any(Object),
      projectInfo,
      config
    );
  });
});
import * as helpers from '../general.helper';

describe('general.helper', () => {
  it('returnEarly retorna el resultado esperado', () => {
    const start = Date.now() - 100;
    const result = helpers.returnEarly(start);
    expect(result.success).toBe(true);
    expect(result.totalFiles).toBe(0);
    expect(result.totalErrors).toBe(0);
    expect(result.totalWarnings).toBe(0);
    expect(result.zones).toEqual([]);
    expect(result.summary).toHaveProperty('processingTime');
  });

  it('createSummary agrupa errores por categoría y regla', () => {
    const zoneResults = [
      {
        zone: 'A',
        filesProcessed: 1,
        errors: [
          {
            rule: 'r1',
            category: 'cat1',
            severity: 'error' as const,
            message: '',
            filePath: '',
          },
          {
            rule: 'r2',
            category: 'cat2',
            severity: 'warning' as const,
            message: '',
            filePath: '',
          },
        ],
        errorsCount: 1,
        warningsCount: 1,
      },
      {
        zone: 'B',
        filesProcessed: 1,
        errors: [
          {
            rule: 'r1',
            category: 'cat1',
            severity: 'error' as const,
            message: '',
            filePath: '',
          },
        ],
        errorsCount: 1,
        warningsCount: 0,
      },
    ];
    const result = helpers.createSummary(
      zoneResults,
      2,
      2,
      1,
      Date.now() - 100
    );
    expect(result.summary.errorsByCategory.cat1).toBe(2);
    expect(result.summary.errorsByRule.r1).toBe(2);
    expect(result.totalFiles).toBe(2);
    expect(result.totalErrors).toBe(2);
    expect(result.totalWarnings).toBe(1);
  });

  it('filterChangedFiles filtra correctamente', () => {
    const files = [
      { path: 'a.js', fullPath: '/root/a.js' },
      { path: 'b.js', fullPath: '/root/b.js' },
      { path: 'c.js', pathOnly: true },
    ];
    const changed = ['/root/a.js', 'b.js'];
    const result = helpers.filterChangedFiles(files, changed, '/root');
    expect(result.some((f) => f.path === 'a.js')).toBe(true);
    expect(result.some((f) => f.path === 'b.js')).toBe(true);
  });
});
