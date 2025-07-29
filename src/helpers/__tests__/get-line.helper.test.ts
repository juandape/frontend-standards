import * as helpers from '../get-line.helper';

jest.mock('nthline', () => jest.fn());
const nthline = require('nthline');

describe('getLineFromFile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('devuelve undefined si filePath o line no es válido', async () => {
    expect(await helpers.getLineFromFile('', 1)).toBeUndefined();
    expect(await helpers.getLineFromFile('file', 0)).toBeUndefined();
    expect(await helpers.getLineFromFile('file', -1)).toBeUndefined();
  });

  it('devuelve la línea si existe', async () => {
    nthline.mockResolvedValueOnce('linea');
    expect(await helpers.getLineFromFile('file', 2)).toBe('linea');
  });

  it('devuelve undefined si nthline retorna undefined', async () => {
    nthline.mockResolvedValueOnce(undefined);
    expect(await helpers.getLineFromFile('file', 2)).toBeUndefined();
  });

  it('devuelve undefined si nthline lanza error', async () => {
    nthline.mockRejectedValueOnce(new Error('fail'));
    expect(await helpers.getLineFromFile('file', 2)).toBeUndefined();
  });
});
