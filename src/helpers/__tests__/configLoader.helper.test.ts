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
  // No se puede testear require/import en Node, así que cubrimos más edge cases de otros métodos

  describe('isConfigFile edge cases', () => {
    it('detecta archivos de configuración con nombres edge', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      expect(helper.isConfigFile('jest.config.mjs')).toBe(true);
      expect(helper.isConfigFile('vite.config.cjs')).toBe(true);
      expect(helper.isConfigFile('tsconfig.base.json')).toBe(true);
      expect(helper.isConfigFile('.prettierrc')).toBe(true);
      expect(helper.isConfigFile('babel.config')).toBe(true);
      expect(helper.isConfigFile('expo.config.js')).toBe(true);
      expect(helper.isConfigFile('notaconfig.txt')).toBe(false);
    });
  });

  describe('checkConsoleLogLines edge', () => {
    it('omite archivos React Native', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      jest
        .spyOn(helper as any, 'shouldSkipConsoleCheck')
        .mockImplementation((...args: any[]) => args[0].includes('App.js'));
      expect(helper.checkConsoleLogLines('console.log(1);', 'App.js')).toEqual(
        []
      );
    });
    it('devuelve vacío si no hay console.log', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      jest
        .spyOn(helper as any, 'shouldSkipConsoleCheck')
        .mockReturnValue(false);
      expect(helper.checkConsoleLogLines('const a = 1;', 'file.js')).toEqual(
        []
      );
    });
  });

  describe('checkDirectImports edge', () => {
    it('devuelve false si no hay import relativo', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      jest.spyOn(helper as any, 'isIndexFile').mockReturnValue(false);
      jest.spyOn(path, 'dirname').mockReturnValue('/dir');
      jest.spyOn(path, 'basename').mockReturnValue('file.ts');
      const code = "import x from 'lib'";
      expect(helper.checkDirectImports(code, '/dir/file.ts')).toBe(false);
    });
  });

  describe('findIndexFileContent', () => {
    it('devuelve null si no existe ningún index', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      // @ts-ignore
      expect(helper.findIndexFileContent('/dir')).toBeNull();
    });
    it('devuelve contenido si existe index.ts', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      const indexPath = path.join('/dir', 'index.ts');
      (fs.existsSync as jest.Mock).mockImplementation((p) => p === indexPath);
      (fs.readFileSync as jest.Mock).mockImplementation((p, enc) => {
        if (p === indexPath && enc === 'utf8') return 'contenido index';
        throw new Error('file not found');
      });
      // @ts-ignore
      expect(helper.findIndexFileContent('/dir')).toBe('contenido index');
    });
  });

  describe('shouldSkipFile y getFileBaseName', () => {
    it('shouldSkipFile retorna true para index y self', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      // @ts-ignore
      expect(helper.shouldSkipFile('index.ts', 'index.ts')).toBe(true);
      // @ts-ignore
      expect(helper.shouldSkipFile('foo.ts', 'foo.ts')).toBe(true);
    });
    it('getFileBaseName elimina extensión', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      // @ts-ignore
      expect(helper.getFileBaseName('foo.ts')).toBe('foo');
      // @ts-ignore
      expect(helper.getFileBaseName('bar.jsx')).toBe('bar');
    });
  });

  describe('checkDirectImports', () => {
    it('detecta import relativo a index y verifica exports', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      jest.spyOn(helper as any, 'isIndexFile').mockReturnValue(false);
      jest.spyOn(path, 'dirname').mockReturnValue('/dir');
      jest.spyOn(path, 'basename').mockReturnValue('file.ts');
      const checkIndexImport = jest
        .spyOn(helper as any, 'checkIndexImport')
        .mockReturnValue(true);
      const code = "import {foo} from './'";
      expect(helper.checkDirectImports(code, '/dir/file.ts')).toBe(true);
      checkIndexImport.mockRestore();
    });
    it('retorna false si checkIndexImport lanza error', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      const spyIndexFile = jest
        .spyOn(helper as any, 'isIndexFile')
        .mockReturnValue(false);
      const spyDirname = jest.spyOn(path, 'dirname').mockReturnValue('/dir');
      const spyBasename = jest
        .spyOn(path, 'basename')
        .mockReturnValue('file.ts');
      // Instead of mocking checkIndexImport, mock findIndexFileContent to throw
      const spyFindIndex = jest
        .spyOn(helper as any, 'findIndexFileContent')
        .mockImplementation(() => {
          throw new Error('fail');
        });
      const code = "import {foo} from './'";
      mockLogger.warn.mockClear();
      let result;
      try {
        result = helper.checkDirectImports(code, '/dir/file.ts');
      } catch (err) {
        spyFindIndex.mockRestore();
        spyIndexFile.mockRestore();
        spyDirname.mockRestore();
        spyBasename.mockRestore();
        throw new Error(
          'Error should have been handled by checkIndexImport, but was thrown: ' +
            err
        );
      }
      spyFindIndex.mockRestore();
      spyIndexFile.mockRestore();
      spyDirname.mockRestore();
      spyBasename.mockRestore();
      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Error checking index import')
      );
    });
  });

  describe('private helpers', () => {
    it('checkSymbolsAgainstExports returns false for empty dirFiles', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      // @ts-ignore
      expect(
        helper['checkSymbolsAgainstExports'](
          ['foo'],
          [],
          'file.ts',
          'index content',
          '/dir'
        )
      ).toBe(false);
    });
    it('checkSymbolsAgainstExports returns false if all files are skipped', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      // @ts-ignore
      expect(
        helper['checkSymbolsAgainstExports'](
          ['foo'],
          ['index.ts', 'file.ts'],
          'file.ts',
          'index content',
          '/dir'
        )
      ).toBe(false);
    });
    it('checkSymbolsAgainstExports returns false if isSymbolExported always false', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      jest.spyOn(helper as any, 'isSymbolExported').mockReturnValue(false);
      // @ts-ignore
      expect(
        helper['checkSymbolsAgainstExports'](
          ['foo'],
          ['other.ts'],
          'file.ts',
          'index content',
          '/dir'
        )
      ).toBe(false);
    });
    it('checkSymbolsAgainstExports returns true if isSymbolExported true for any', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      jest
        .spyOn(helper as any, 'isSymbolExported')
        .mockImplementation((...args) => (args[0] as string[]).includes('foo'));
      // @ts-ignore
      expect(
        helper['checkSymbolsAgainstExports'](
          ['foo'],
          ['other.ts'],
          'file.ts',
          'index content',
          '/dir'
        )
      ).toBe(true);
    });
    it('shouldSkipFile returns true for index or self', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      // @ts-ignore
      expect(helper['shouldSkipFile']('index.ts', 'file.ts')).toBe(true);
      // @ts-ignore
      expect(helper['shouldSkipFile']('file.ts', 'file.ts')).toBe(true);
      // @ts-ignore
      expect(helper['shouldSkipFile']('other.ts', 'file.ts')).toBe(false);
    });
    it('getFileBaseName strips only known extensions', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      // @ts-ignore
      expect(helper['getFileBaseName']('foo.ts')).toBe('foo');
      // @ts-ignore
      expect(helper['getFileBaseName']('bar.jsx')).toBe('bar');
      // @ts-ignore
      expect(helper['getFileBaseName']('baz.txt')).toBe('baz.txt');
    });
    it('isSymbolExported returns false if symbols is empty', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      jest
        .spyOn(helper as any, 'getExportPatterns')
        .mockReturnValue(['pattern']);
      jest.spyOn(helper as any, 'checkSymbolExport').mockReturnValue(false);
      // @ts-ignore
      expect(
        helper['isSymbolExported']([], 'foo', 'index content', 'foo.ts')
      ).toBe(false);
    });
    it('isSymbolExported returns true if any symbol matches', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      jest
        .spyOn(helper as any, 'getExportPatterns')
        .mockReturnValue(['pattern']);
      jest
        .spyOn(helper as any, 'checkSymbolExport')
        .mockImplementation((symbol) => symbol === 'foo');
      // @ts-ignore
      expect(
        helper['isSymbolExported'](
          ['foo', 'bar'],
          'foo',
          'index content',
          'foo.ts'
        )
      ).toBe(true);
    });
    it('getConsoleLogLineNumbers ignora comentarios y detecta console.log', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      const code = [
        '/**',
        ' * doc',
        ' */',
        'const a = 1;',
        '/* multi',
        'line comment */',
        'console.log(a);',
        '// console.log(b)',
        'console.log(b);',
      ].join('\n');
      // @ts-ignore acceso a método privado
      const lines = helper['getConsoleLogLineNumbers'](code);
      expect(lines).toEqual([7, 9]);
    });
    it('updateCommentState y isInComment funcionan correctamente', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      // @ts-ignore acceso a método privado
      let state = helper['updateCommentState']('/**', {
        inJSDoc: false,
        inMultiLineComment: false,
      });
      expect(state.inJSDoc).toBe(true);
      // @ts-ignore
      state = helper['updateCommentState']('*/', {
        inJSDoc: true,
        inMultiLineComment: false,
      });
      expect(state.inJSDoc).toBe(false);
      // @ts-ignore
      state = helper['updateCommentState']('/*', {
        inJSDoc: false,
        inMultiLineComment: false,
      });
      expect(state.inMultiLineComment).toBe(true);
      // @ts-ignore
      state = helper['updateCommentState']('*/', {
        inJSDoc: false,
        inMultiLineComment: true,
      });
      expect(state.inMultiLineComment).toBe(false);
      // @ts-ignore
      expect(
        helper['isInComment'](' * foo', {
          inJSDoc: true,
          inMultiLineComment: false,
        })
      ).toBe(true);
      // @ts-ignore
      expect(
        helper['isInComment']('// bar', {
          inJSDoc: false,
          inMultiLineComment: false,
        })
      ).toBe(true);
      // @ts-ignore
      expect(
        helper['isInComment']('code', {
          inJSDoc: false,
          inMultiLineComment: false,
        })
      ).toBe(false);
    });
    it('hasConsoleStatement detecta solo console.log', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      // @ts-ignore
      expect(helper['hasConsoleStatement']('console.log("a")')).toBe(true);
      // @ts-ignore
      expect(helper['hasConsoleStatement']('console.error("a")')).toBe(false);
    });
    it('extractImportedSymbols extrae símbolos correctamente', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      // @ts-ignore
      expect(
        helper['extractImportedSymbols']("import {foo, bar} from './'")
      ).toEqual(['foo', 'bar']);
      // @ts-ignore
      expect(helper['extractImportedSymbols']("import baz from './'")).toEqual([
        'baz',
      ]);
      // @ts-ignore
      expect(helper['extractImportedSymbols']("import './'")).toEqual([]);
    });
    it('getExportPatterns y checkSymbolExport cubren paths', () => {
      const helper = new ConfigLoaderHelper(mockLogger);
      // @ts-ignore
      const patterns = helper['getExportPatterns'](
        'foo',
        'foo.ts',
        "export { default as foo } from './foo'\nexport * from './foo'\nexport { bar } from './foo'"
      );
      expect(patterns.some((p) => p.includes('foo'))).toBe(true);
      // @ts-ignore
      expect(
        helper['checkSymbolExport'](
          'foo',
          'foo',
          "export { default as foo } from './foo'",
          patterns
        )
      ).toBe(true);
      // @ts-ignore
      expect(
        helper['checkSymbolExport'](
          'bar',
          'foo',
          "export { bar } from './foo'",
          patterns
        )
      ).toBe(true);
    });
  });
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
