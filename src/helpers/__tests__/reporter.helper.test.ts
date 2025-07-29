import * as helpers from '../reporter.helper';
import { execSync } from 'child_process';
import path from 'path';

jest.mock('child_process');
jest.mock('path');

(path.resolve as jest.Mock).mockImplementation((filePath) => filePath);

describe('getGitLastAuthor', () => {
  beforeEach(() => jest.clearAllMocks());

  it('devuelve el autor si git log funciona', () => {
    (execSync as jest.Mock).mockReturnValue('Juan\n');
    expect(helpers.getGitLastAuthor('file.js', '/repo')).toBe('Juan');
    expect(execSync).toHaveBeenCalled();
  });

  it('devuelve Unknown si git log falla', () => {
    (execSync as jest.Mock).mockImplementation(() => {
      throw new Error('fail');
    });
    expect(helpers.getGitLastAuthor('file.js', '/repo')).toBe('Unknown');
  });
});
