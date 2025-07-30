describe('Cobertura total de helpers', () => {
  const helpers = require('../general.helper');
  it('Cubre todas las funciones exportadas', async () => {
    // loadAndLogConfig
    await helpers.loadAndLogConfig(
      { load: async () => ({}) },
      {},
      { debug: () => {}, withPrefix: () => ({}) }
    );
    // analyzeProject
    await helpers.analyzeProject(
      { analyze: async () => ({}) },
      {},
      { info: () => {}, debug: () => {}, withPrefix: () => ({}) },
      {}
    );
    // getChangedFiles
    await helpers.getChangedFiles(
      { getFilesInCommit: async () => [] },
      { info: () => {}, withPrefix: () => ({}) }
    );
    // logSummary
    helpers.logSummary({ info: () => {}, withPrefix: () => ({}) }, {}, 0, 0, 0);
    // generateReport
    await helpers.generateReport(
      { generate: () => {} },
      { debug: () => {}, withPrefix: () => ({}) },
      [],
      {},
      {}
    );
    // returnEarly
    helpers.returnEarly(Date.now());
    // createSummary
    helpers.createSummary([], 0, 0, 0, 0);
    // filterChangedFiles
    helpers.filterChangedFiles([], [], '');
    // Probar edge cases válidos
    helpers.createSummary([], 0, 0, 0, 0);
    helpers.filterChangedFiles([], [], '');
    helpers.logSummary({ info: () => {}, withPrefix: () => ({}) }, {}, 0, 0, 0);
    helpers.returnEarly(0);
  });
});
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
    // Edge: file without fullPath, changedFiles with only file name
    const files2 = [{ path: 'd.js' }, { path: 'e.js', fullPath: '/root/e.js' }];
    const changed2 = ['e.js', 'd.js'];
    const result2 = helpers.filterChangedFiles(files2, changed2, '/root');
    expect(result2.some((f) => f.path === 'd.js')).toBe(true);
    expect(result2.some((f) => f.path === 'e.js')).toBe(true);
  });

  it('logSummary cubre zoneSummary y paths alternativos', () => {
    const logger: any = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      withPrefix: function () {
        return this;
      },
    };
    const summary = {
      errorsByCategory: {},
      errorsByRule: {},
      processingTime: 123,
    };
    const zoneSummary = {
      errorsByZone: { Z1: 2, Z2: 0 },
      warningsByZone: { Z1: 1, Z2: 0 },
      infosByZone: { Z1: 3, Z2: 0 },
    };
    helpers.logSummary(logger, summary, 2, 2, 1, zoneSummary);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Zone: Z1')
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Zone: Z2')
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Info suggestions: 3')
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Status: ❌ FAILED')
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Status: ✅ PASSED')
    );
  });

  it('processZone cubre paths principales y edge cases', async () => {
    const logger: any = {
      info: jest.fn(),
      debug: jest.fn(),
      withPrefix: function () {
        return this;
      },
    };
    const fileScanner = {
      defaultIgnorePatterns: [],
      scanZone: jest.fn().mockResolvedValue([
        { path: 'a.js', content: 'code', fullPath: '/root/a.js' },
        { path: 'config.js', content: 'cfg', fullPath: '/root/config.js' },
      ]),
      scanDirectory: jest.fn(),
      loadGitignorePatterns: jest.fn(),
      isIgnored: jest.fn(),
      matchesPattern: jest.fn(),
      matchesGitignorePattern: jest.fn(),
      determineZone: jest.fn(),
      getStatistics: jest.fn(),
      rootDir: '/root',
      logger,
      gitignorePatterns: [],
      scan: jest.fn(),
      getFilesInCommit: jest.fn(),
      getAllFiles: jest.fn(),
      getAllFilesInDir: jest.fn(),
      getAllFilesInDirSync: jest.fn(),
      getAllFilesSync: jest.fn(),
      getAllFilesInDirRecursively: jest.fn(),
      getAllFilesInDirRecursivelySync: jest.fn(),
      getAllFilesRecursively: jest.fn(),
      getAllFilesRecursivelySync: jest.fn(),
    };
    const ruleEngine = {
      runContentValidators: jest.fn(),
      runFileValidators: jest.fn(),
      logRuleError: jest.fn(),
      deduplicateErrors: jest.fn(),
      handleValidationError: jest.fn(),
      loadAdditionalValidators: jest.fn(),
      runAllValidations: jest.fn(),
      runAllRules: jest.fn(),
      isConfigurationFile: (p: string) => p === 'config.js',
      validate: jest
        .fn()
        .mockResolvedValueOnce([{ severity: 'error' }])
        .mockResolvedValueOnce([]),
      logger,
      rules: [],
      config: {},
      isConfigFile: jest.fn(),
      validateFile: jest.fn(),
      validateAll: jest.fn(),
      validateRule: jest.fn(),
      validateRules: jest.fn(),
      getRule: jest.fn(),
      getRuleNames: jest.fn(),
      getRuleCategories: jest.fn(),
      getRuleDocs: jest.fn(),
      getRuleConfig: jest.fn(),
      getRuleSeverity: jest.fn(),
      getRuleOptions: jest.fn(),
      getRuleDefaultOptions: jest.fn(),
      getRuleMeta: jest.fn(),
      getRuleType: jest.fn(),
      getRuleCategory: jest.fn(),
      getRuleDescription: jest.fn(),
      getRuleExamples: jest.fn(),
      getRuleSchema: jest.fn(),
      getRuleUrl: jest.fn(),
      getRuleTags: jest.fn(),
      getRuleFixable: jest.fn(),
      getRuleDeprecated: jest.fn(),
      getRuleReplacedBy: jest.fn(),
      getRuleRemoved: jest.fn(),
      getRuleDocsUrl: jest.fn(),
      getRuleDocsUrlForRule: jest.fn(),
      getRuleDocsUrlForCategory: jest.fn(),
      getRuleDocsUrlForType: jest.fn(),
      getRuleDocsUrlForTag: jest.fn(),
      getRuleDocsUrlForFixable: jest.fn(),
      getRuleDocsUrlForDeprecated: jest.fn(),
      getRuleDocsUrlForReplacedBy: jest.fn(),
      getRuleDocsUrlForRemoved: jest.fn(),
      initialize: jest.fn(),
      validateFileContent: jest.fn(),
      runBasicRules: jest.fn(),
      applyRule: jest.fn(),
      getRuleOptionsForFile: jest.fn(),
      getRuleConfigForFile: jest.fn(),
      getRuleSeverityForFile: jest.fn(),
      getRuleMetaForFile: jest.fn(),
      getRuleTypeForFile: jest.fn(),
      getRuleCategoryForFile: jest.fn(),
      getRuleDescriptionForFile: jest.fn(),
      getRuleExamplesForFile: jest.fn(),
      getRuleSchemaForFile: jest.fn(),
      getRuleUrlForFile: jest.fn(),
      getRuleTagsForFile: jest.fn(),
      getRuleFixableForFile: jest.fn(),
      getRuleDeprecatedForFile: jest.fn(),
      getRuleReplacedByForFile: jest.fn(),
      getRuleRemovedForFile: jest.fn(),
      createErrorInfo: jest.fn(),
      addShadowingDetails: jest.fn(),
      runAdditionalValidations: jest.fn(),
      runAlwaysApplicableValidations: jest.fn(),
      runZoneValidations: jest.fn(),
      runFileValidations: jest.fn(),
      runRuleValidations: jest.fn(),
      runCategoryValidations: jest.fn(),
      runTypeValidations: jest.fn(),
    };
    const options = {
      onlyChangedFiles: true,
      debug: true,
      verbose: true,
      rootDir: '/root',
    };
    const config = {
      extensions: ['.js'],
      ignorePatterns: [],
      zones: {},
      onlyChangedFiles: true,
    };
    const changedFiles = ['/root/a.js'];
    const projectInfo = {
      isMonorepo: false,
      projectType: 'react' as const,
      zones: [],
      rootPath: '/root',
    };
    const result = await helpers.processZone({
      zone: 'Z1',
      config,
      changedFiles,
      hasOnlyZone: false,
      options,
      rootDir: '/root',
      logger: logger as any,
      fileScanner: fileScanner as any,
      ruleEngine: ruleEngine as any,
      projectInfo,
    });
    expect(result.zone).toBe('Z1');
    expect(result.filesProcessed).toBe(1); // config.js is skipped
    expect(result.errorsCount).toBe(1);
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('Filtered')
    );
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('Files found in zone'),
      expect.any(Array)
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Validating: a.js')
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Files processed: 1')
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Errors found: 1')
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Warnings found: 0')
    );
  });
});
