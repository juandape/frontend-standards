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
    ];
    const changed = ['/root/a.js'];
    const result = helpers.filterChangedFiles(files, changed, '/root');
    expect(result.length).toBe(1);
    expect(result[0].path).toBe('a.js');
  });
});
