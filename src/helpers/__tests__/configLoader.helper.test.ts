import fs from 'fs';
import path from 'path';
import {
  ConfigLoaderHelper,
  readFileContent,
  extractImportPaths,
  resolveImportPath,
} from '../configLoader.helper';

jest.mock('fs');
jest.mock('path');

const levels = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 } as const;
const mockLogger = {
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  verbose: false,
  levels,
  currentLevel: levels.INFO,
};

describe('ConfigLoaderHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (path.basename as jest.Mock).mockImplementation((filePath: string) => {
      // Simula el comportamiento real de path.basename
      return filePath.split('/').pop() || filePath;
    });
    (path.resolve as jest.Mock).mockImplementation(
      (baseDir: string, importPath: string) => {
        if (importPath) {
          if (importPath.startsWith('.')) {
            return baseDir + '/' + importPath.replace(/^\.\/?/, '');
          }
          return baseDir + '/' + importPath;
        }
        return baseDir;
      }
    );
  });

  describe('isConfigFile', () => {
    it('detecta archivos de configuración comunes', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      expect(helper.isConfigFile('babel.config.js')).toBe(true);
      expect(helper.isConfigFile('vite.config.ts')).toBe(true);
      expect(helper.isConfigFile('tsconfig.json')).toBe(true);
      expect(helper.isConfigFile('.eslintrc.js')).toBe(true);
      expect(helper.isConfigFile('random.js')).toBe(false);
    });
  });

  describe('checkConsoleLogLines', () => {
    it('devuelve líneas con console.log', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      jest
        .spyOn(helper as any, 'shouldSkipConsoleCheck')
        .mockReturnValue(false);
      const content = 'const a = 1;\nconsole.log(a);\n// console.log(b)';
      expect(helper.checkConsoleLogLines(content, 'file.js')).toEqual([2]);
    });
    it('omite archivos debug/dev/__tests__', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      jest.spyOn(helper as any, 'shouldSkipConsoleCheck').mockReturnValue(true);
      expect(
        helper.checkConsoleLogLines('console.log(1);', 'debug.js')
      ).toEqual([]);
    });
  });

  describe('checkDirectImports', () => {
    it('devuelve false si es archivo index', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      jest.spyOn(helper as any, 'isIndexFile').mockReturnValue(true);
      expect(helper.checkDirectImports("import x from './'", 'index.ts')).toBe(
        false
      );
    });
  });
});

describe('readFileContent', () => {
  it('lee el contenido si existe', () => {
    (fs.readFileSync as jest.Mock).mockReturnValue('contenido');
    expect(readFileContent('file.js')).toBe('contenido');
  });
  it('devuelve null si no existe', () => {
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error();
    });
    expect(readFileContent('file.js')).toBeNull();
  });
});

describe('extractImportPaths', () => {
  it('extrae imports relativos', () => {
    const code =
      "import x from './foo'\nimport y from '../bar'\nimport z from 'lib'";
    expect(extractImportPaths(code)).toEqual(['./foo', '../bar']);
  });
});

describe('resolveImportPath', () => {
  it('resuelve import relativo con extensión', () => {
    (fs.existsSync as jest.Mock).mockImplementation((p) => {
      // La función prueba '/a/b/foo.js' y '/a/b/foo.ts' en orden
      return p === '/a/b/foo.js';
    });
    expect(resolveImportPath('/a/b', './foo', ['.js', '.ts'])).toBe(
      '/a/b/foo.js'
    );
  });
  it('resuelve import relativo sin extensión', () => {
    (fs.existsSync as jest.Mock).mockImplementation((p) => {
      // La función prueba '/a/b/foo.js' y luego '/a/b/foo'
      return p === '/a/b/foo';
    });
    expect(resolveImportPath('/a/b', './foo', ['.js'])).toBe('/a/b/foo');
  });
  it('devuelve null si no existe', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    expect(resolveImportPath('/a/b', './foo', ['.js'])).toBeNull();
  });
});
