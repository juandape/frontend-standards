import * as helpers from '../reporter.helper';
import { spawnSync } from 'child_process';
import path from 'path';

import which from 'which';

jest.mock('child_process');
jest.mock('path');
jest.mock('which');

(path.resolve as jest.Mock).mockImplementation((filePath) => filePath);
(which.sync as jest.Mock).mockReturnValue('/usr/bin/git');

describe('getGitLastAuthor', () => {
  beforeEach(() => jest.clearAllMocks());

  it('devuelve el autor si git log funciona', () => {
    (spawnSync as jest.Mock).mockReturnValue({ stdout: 'Juan\n', error: null });
    expect(helpers.getGitLastAuthor('file.js', '/repo')).toBe('Juan');
    expect(spawnSync).toHaveBeenCalled();
  });

  it('devuelve Unknown si git log falla', () => {
    (spawnSync as jest.Mock).mockReturnValue({
      stdout: '',
      error: new Error('fail'),
    });
    expect(helpers.getGitLastAuthor('file.js', '/repo')).toBe('Unknown');
  });
});
