import fs from 'fs';
import type { ILogger } from '../../types/projectAnalizer.type';
import { FileScanner, isReactNativeProject } from '../file-scanner';

describe('FileScanner', () => {
  let logger: ILogger;
  let scanner: FileScanner;
  let rootDir: string;

  beforeEach(() => {
    rootDir = '/root';
    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      verbose: false,
      levels: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 },
      currentLevel: 2,
    };
    scanner = new FileScanner(rootDir, logger);
  });

  it('constructor sets properties', () => {
    expect(scanner.rootDir).toBe(rootDir);
    expect(scanner.logger).toBe(logger);
    expect(Array.isArray(scanner.gitignorePatterns)).toBe(true);
  });

  it('scanZone returns [] and logs if zone does not exist', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const options = {
      extensions: ['.js'],
      ignorePatterns: [],
      customZones: [],
      includePackages: false,
    };
    const result = await scanner.scanZone('no-zone', options);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Zone path does not exist')
    );
    expect(result).toEqual([]);
  });

  it('scanZone returns files for existing zone, applies ignore patterns', async () => {
    jest
      .spyOn(fs, 'existsSync')
      .mockImplementation(
        (p) => p === '/root/zone' || p === '/root/.gitignore'
      );
    const direntMock = (name: string, isDir: boolean, isFile: boolean) => ({
      name,
      isDirectory: () => isDir,
      isFile: () => isFile,
      isBlockDevice: () => false,
      isCharacterDevice: () => false,
      isFIFO: () => false,
      isSocket: () => false,
      isSymbolicLink: () => false,
    });
    jest
      .spyOn(fs.promises, 'readdir')
      .mockResolvedValue([
        direntMock('file1.js', false, true),
        direntMock('file2.txt', false, true),
        direntMock('subdir', true, false),
      ] as any);
    jest.spyOn(fs.promises, 'readFile').mockImplementation(async (p) => {
      if (p === '/root/.gitignore') return 'ignored.txt\n';
      return 'content';
    });
    jest.spyOn(scanner, 'loadGitignorePatterns').mockResolvedValue([]);
    jest
      .spyOn(scanner, 'scanDirectory')
      .mockResolvedValue([
        {
          path: 'zone/file1.js',
          content: 'content',
          size: 7,
          extension: '.js',
          zone: 'zone',
          fullPath: '/root/zone/file1.js',
        },
      ]);
    const options = {
      extensions: ['.js'],
      ignorePatterns: [],
      customZones: [],
      includePackages: false,
    };
    const result = await scanner.scanZone('zone', options);
    // Buscar alguna llamada a logger.debug que contenga 'Found'
    const debugCalls = (logger.debug as jest.Mock).mock.calls;
    expect(debugCalls.some((call) => call[0].includes('Found'))).toBe(true);
    expect(Array.isArray(result)).toBe(true);
  });

  it('scanDirectory returns files with valid extensions and recurses into subdirs', async () => {
    jest.spyOn(fs.promises, 'readdir').mockImplementation(async (dir) => {
      if (dir === '/root/zone') {
        return [
          {
            name: 'file1.js',
            isDirectory: () => false,
            isFile: () => true,
            isBlockDevice: () => false,
            isCharacterDevice: () => false,
            isFIFO: () => false,
            isSocket: () => false,
            isSymbolicLink: () => false,
          },
          {
            name: 'subdir',
            isDirectory: () => true,
            isFile: () => false,
            isBlockDevice: () => false,
            isCharacterDevice: () => false,
            isFIFO: () => false,
            isSocket: () => false,
            isSymbolicLink: () => false,
          },
        ] as any;
      }
      if (dir === '/root/zone/subdir') {
        return [
          {
            name: 'file2.js',
            isDirectory: () => false,
            isFile: () => true,
            isBlockDevice: () => false,
            isCharacterDevice: () => false,
            isFIFO: () => false,
            isSocket: () => false,
            isSymbolicLink: () => false,
          },
        ] as any;
      }
      return [] as any;
    });
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue('content');
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(scanner, 'loadGitignorePatterns').mockResolvedValue([]);
    const options = {
      extensions: ['.js'],
      ignorePatterns: [],
      customZones: [],
      includePackages: false,
    };
    const files = await scanner.scanDirectory('/root/zone', options);
    expect(files.length).toBe(2);
    expect(files[0]?.extension).toBe('.js');
    expect(files[1]?.extension).toBe('.js');
  });

  it('scanDirectory logs error and returns [] if readdir fails', async () => {
    jest.spyOn(fs.promises, 'readdir').mockRejectedValue(new Error('fail'));
    jest.spyOn(scanner, 'loadGitignorePatterns').mockResolvedValue([]);
    const options = {
      extensions: ['.js'],
      ignorePatterns: [],
      customZones: [],
      includePackages: false,
    };
    const files = await scanner.scanDirectory('/root/zone', options);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error scanning directory'),
      expect.any(Error)
    );
    expect(files).toEqual([]);
  });

  it('loadGitignorePatterns returns [] if no .gitignore exists', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const patterns = await scanner.loadGitignorePatterns();
    expect(patterns).toEqual([]);
    expect(logger.debug).toHaveBeenCalledWith('No .gitignore file found');
  });

  it('loadGitignorePatterns parses patterns from .gitignore', async () => {
    jest
      .spyOn(fs, 'existsSync')
      .mockImplementation((p) => p === '/root/.gitignore');
    jest
      .spyOn(fs.promises, 'readFile')
      .mockResolvedValue('node_modules\n!keep.js\nfoo/\n');
    const patterns = await scanner.loadGitignorePatterns();
    expect(patterns.length).toBe(3);
    expect(patterns[0]?.pattern).toBe('node_modules');
    expect(patterns[1]?.isNegation).toBe(true);
    expect(patterns[2]?.isDirectory).toBe(true);
  });

  it('isIgnored returns true for default ignore patterns', () => {
    const patterns: any[] = [];
    expect(scanner.isIgnored('node_modules/foo.js', patterns)).toBe(true);
    expect(scanner.isIgnored('tmp/bar.js', patterns)).toBe(true);
  });

  it('isIgnored returns true for a non-default pattern that matches the path exactly', () => {
    const patterns = [
      { pattern: 'foo/file.js', isNegation: false, isDirectory: false },
    ];
    expect(scanner.isIgnored('foo/file.js', patterns)).toBe(true);
    expect(scanner.isIgnored('foo/other.js', patterns)).toBe(false);
  });

  it('matchesPattern returns true for substring or prefix', () => {
    expect(
      (scanner as any).matchesPattern('node_modules/foo.js', 'node_modules')
    ).toBe(true);
    expect((scanner as any).matchesPattern('tmp/bar.js', 'tmp')).toBe(true);
    expect((scanner as any).matchesPattern('src/foo.js', 'tmp')).toBe(false);
  });

  it('matchesGitignorePattern handles directory and file patterns', () => {
    // Directory pattern
    expect(
      (scanner as any).matchesGitignorePattern('foo/bar/baz.js', 'foo', true)
    ).toBe(true);
    // File pattern
    expect(
      (scanner as any).matchesGitignorePattern('foo.js', 'foo.js', false)
    ).toBe(true);
    // Pattern with *
    expect(
      (scanner as any).matchesGitignorePattern('foo/bar.js', 'foo/*.js', false)
    ).toBe(true);
    // Pattern with ?
    expect(
      (scanner as any).matchesGitignorePattern('foo/a.js', 'foo/?.js', false)
    ).toBe(true);
    // Pattern with invalid regex
    expect((scanner as any).matchesGitignorePattern('foo.js', '[', false)).toBe(
      false
    );
  });
});

describe('isReactNativeProject', () => {
  it('returns false if no package.json', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    expect(isReactNativeProject('/foo/bar/App.js')).toBe(false);
  });
});
