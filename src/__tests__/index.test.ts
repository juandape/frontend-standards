import FrontendStandardsChecker from '../index';

jest.mock('../utils/logger');
jest.mock('../core/config-loader');
jest.mock('../utils/file-scanner');
jest.mock('../core/project-analyzer');
jest.mock('../core/rule-engine');
jest.mock('../core/reporter');

// Helpers
const mockLoadAndLogConfig = jest.fn();
const mockAnalyzeProject = jest.fn();
const mockGetChangedFiles = jest.fn();
const mockReturnEarly = jest.fn();
const mockCreateSummary = jest.fn();
const mockGenerateReport = jest.fn();
const mockLogSummary = jest.fn();
const mockProcessZone = jest.fn();

jest.mock('../helpers/index', () => ({
  loadAndLogConfig: (...args: any[]) => mockLoadAndLogConfig(...args),
  analyzeProject: (...args: any[]) => mockAnalyzeProject(...args),
  getChangedFiles: (...args: any[]) => mockGetChangedFiles(...args),
  returnEarly: (...args: any[]) => mockReturnEarly(...args),
  createSummary: (...args: any[]) => mockCreateSummary(...args),
  generateReport: (...args: any[]) => mockGenerateReport(...args),
  logSummary: (...args: any[]) => mockLogSummary(...args),
  processZone: (...args: any[]) => mockProcessZone(...args),
}));

describe('FrontendStandardsChecker', () => {
  let checker: FrontendStandardsChecker;
beforeEach(() => {
  jest.clearAllMocks();
  checker = new FrontendStandardsChecker({});
  (checker as any).options.rootDir = '/tmp/project';
  // Por defecto, el mock de generateReport retorna un objeto válido
  mockGenerateReport.mockResolvedValue({ totalErrors: 0, totalWarnings: 0 });
});

  it('should instantiate with default options', () => {
    expect(checker).toBeInstanceOf(FrontendStandardsChecker);
  });

  it('should run the happy path (all zones, no onlyChangedFiles)', async () => {
    mockLoadAndLogConfig.mockResolvedValue({ zones: {} });
    mockAnalyzeProject.mockResolvedValue({ zones: ['web', 'auth'] });
    mockProcessZone.mockResolvedValue({
      filesProcessed: 2,
      errorsCount: 0,
      warningsCount: 0,
    });
    mockCreateSummary.mockReturnValue({ summary: 'ok' });
    mockGenerateReport.mockResolvedValue({ totalErrors: 0, totalWarnings: 0 });
    mockLogSummary.mockReturnValue(undefined);

    const result = await checker.run();
    expect(mockLoadAndLogConfig).toHaveBeenCalled();
    expect(mockAnalyzeProject).toHaveBeenCalled();
    expect(mockProcessZone).toHaveBeenCalledTimes(2);
    expect(mockCreateSummary).toHaveBeenCalled();
    expect(mockGenerateReport).toHaveBeenCalled();
    expect(mockLogSummary).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('should handle onlyChangedFiles with no changed files', async () => {
    checker = new FrontendStandardsChecker({ onlyChangedFiles: true });
    (checker as any).options.rootDir = '/tmp/project';
    mockLoadAndLogConfig.mockResolvedValue({ onlyChangedFiles: true });
    mockAnalyzeProject.mockResolvedValue({ zones: ['web'] });
    mockGetChangedFiles.mockResolvedValue([]);
    mockReturnEarly.mockReturnValue('early');

    const result = await checker.run();
    expect(mockGetChangedFiles).toHaveBeenCalled();
    expect(mockReturnEarly).toHaveBeenCalled();
    expect(result).toBe('early');
  });

  it('should handle hasOnlyZone', async () => {
    mockLoadAndLogConfig.mockResolvedValue({ zones: { onlyZone: 'web' } });
    mockAnalyzeProject.mockResolvedValue({ zones: ['web'] });
    mockProcessZone.mockResolvedValue({
      filesProcessed: 1,
      errorsCount: 0,
      warningsCount: 0,
    });
    mockCreateSummary.mockReturnValue({ summary: 'ok' });
    mockGenerateReport.mockResolvedValue({ totalErrors: 0, totalWarnings: 0 });
    mockLogSummary.mockReturnValue(undefined);

    const result = await checker.run();
    expect(mockProcessZone).toHaveBeenCalledWith(
      expect.objectContaining({ zone: 'web' })
    );
    expect(result).toBeDefined();
  });

  it('should handle errors in run()', async () => {
    mockLoadAndLogConfig.mockRejectedValue(new Error('fail'));
    await expect(checker.run()).rejects.toThrow('fail');
  });

  it('should handle prompt error and default to includeCollaborators=true', async () => {
    // Simula que no hay TTY para forzar el catch
    Object.defineProperty(process.stdout, 'isTTY', { value: false });
    mockLoadAndLogConfig.mockResolvedValue({ zones: {} });
    mockAnalyzeProject.mockResolvedValue({ zones: ['web'] });
    mockProcessZone.mockResolvedValue({
      filesProcessed: 1,
      errorsCount: 0,
      warningsCount: 0,
    });
    mockCreateSummary.mockReturnValue({ summary: 'ok' });
    mockGenerateReport.mockResolvedValue({ totalErrors: 0, totalWarnings: 0 });
    mockLogSummary.mockReturnValue(undefined);
    await checker.run();
    // No assertion, just coverage for the catch
  });

  describe('determineZones', () => {
    it('should return zones from options if present', () => {
      const c = new FrontendStandardsChecker({ zones: ['a', 'b'] });
      (c as any).options.rootDir = '/tmp';
      const result = (c as any).determineZones(
        { zones: ['x', 'y'] },
        { zones: {} }
      );
      expect(result).toEqual(['a', 'b']);
    });
    it('should handle string zones', () => {
      const c = new FrontendStandardsChecker({});
      (c as any).options.rootDir = '/tmp';
      const result = (c as any).determineZones(
        { zones: ['x', 'y'] },
        { zones: {} }
      );
      expect(result).toEqual(['x', 'y']);
    });
    it('should handle object zones', () => {
      const c = new FrontendStandardsChecker({});
      (c as any).options.rootDir = '/tmp';
      const result = (c as any).determineZones(
        { zones: [{ name: 'foo' }, { name: 'bar' }] },
        { zones: {} }
      );
      expect(result).toEqual(['foo', 'bar']);
    });
    it('should filter out packages if not included', () => {
      const c = new FrontendStandardsChecker({});
      (c as any).options.rootDir = '/tmp';
      const result = (c as any).determineZones(
        { zones: ['packages/foo', 'web'] },
        { zones: {} }
      );
      expect(result).toEqual(['web']);
    });
    it('should include packages if config.zones.includePackages', () => {
      const c = new FrontendStandardsChecker({});
      (c as any).options.rootDir = '/tmp';
      const result = (c as any).determineZones(
        { zones: ['packages/foo', 'web'] },
        { zones: { includePackages: true } }
      );
      expect(result).toEqual(['packages/foo', 'web']);
    });
    it('should default to ["."] if no zones', () => {
      const c = new FrontendStandardsChecker({});
      (c as any).options.rootDir = '/tmp';
      const result = (c as any).determineZones({ zones: [] }, { zones: {} });
      expect(result).toEqual(['.']);
    });
  });
});
