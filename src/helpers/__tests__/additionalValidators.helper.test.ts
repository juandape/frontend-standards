import * as helpers from '../additionalValidators.helper';

describe('additionalValidators.helper', () => {
  describe('isConfigOrConstantsFile', () => {
    it('detecta archivos config o constants .ts', () => {
      expect(helpers.isConfigOrConstantsFile('src/config/app.config.ts')).toBe(
        true
      );
      expect(helpers.isConfigOrConstantsFile('src/constants/colors.ts')).toBe(
        true
      );
      expect(helpers.isConfigOrConstantsFile('src/other/file.ts')).toBe(false);
      expect(helpers.isConfigOrConstantsFile('src/config/app.config.js')).toBe(
        false
      );
    });
  });

  describe('shouldProcessFile', () => {
    it('solo procesa index.tsx dentro de /components/', () => {
      expect(
        helpers.shouldProcessFile('/src/components/Button/index.tsx')
      ).toBe(true);
      expect(
        helpers.shouldProcessFile('/src/components/Button/Button.tsx')
      ).toBe(false);
      expect(helpers.shouldProcessFile('/src/other/index.tsx')).toBe(false);
    });
  });

  describe('findFunctionMatch', () => {
    it('detecta varias formas de declaración de función', () => {
      const cases = [
        { code: 'export default function StoriesList(){', name: 'StoriesList' },
        { code: 'export const StoriesList = () =>{', name: 'StoriesList' },
        { code: 'const StoriesList = () =>{', name: 'StoriesList' },
        { code: 'function StoriesList(){', name: 'StoriesList' },
      ];
      for (const { code, name } of cases) {
        const result = helpers.findFunctionMatch(code);
        expect(result).not.toBeNull();
        expect(result?.functionName).toBe(name);
      }
    });
    it('devuelve null si no hay match', () => {
      expect(helpers.findFunctionMatch('const x = 1;')).toBeNull();
    });
  });

  describe('validateFunctionName', () => {
    it('devuelve error si el nombre no coincide (no PascalCase)', () => {
      const err = helpers.validateFunctionName(
        'button',
        'boton',
        false,
        'file',
        2
      );
      expect(err).not.toBeNull();
      expect(err?.rule).toMatch(/Component function name match/);
    });
    it('devuelve null si coincide (no PascalCase)', () => {
      expect(
        helpers.validateFunctionName('button', 'button', false, 'file', 2)
      ).toBeNull();
    });
    it('devuelve error si el nombre no coincide (PascalCase)', () => {
      const err = helpers.validateFunctionName(
        'Button',
        'Btn',
        true,
        'file',
        2
      );
      expect(err).not.toBeNull();
    });
    it('devuelve null si coincide (PascalCase)', () => {
      expect(
        helpers.validateFunctionName('Button', 'Button', true, 'file', 2)
      ).toBeNull();
    });
  });

  describe('createNameMismatchError', () => {
    it('genera el error correctamente', () => {
      const err = helpers.createNameMismatchError('Button', 'Btn', 'file', 3);
      expect(err).toMatchObject({
        rule: expect.any(String),
        message: expect.stringContaining('Button'),
        filePath: 'file',
        line: 3,
        severity: 'error',
        category: 'naming',
      });
    });
  });

  describe('createNoFunctionError', () => {
    it('genera el error correctamente', () => {
      const err = helpers.createNoFunctionError('Button', 'file');
      expect(err).toMatchObject({
        rule: expect.any(String),
        message: expect.stringContaining('Button'),
        filePath: 'file',
        line: 1,
        severity: 'error',
        category: 'naming',
      });
    });
  });

  describe('shouldSkipLine', () => {
    it('detecta líneas a saltar', () => {
      expect(helpers.shouldSkipLine('')).toBe(true);
      expect(helpers.shouldSkipLine('// comentario')).toBe(true);
      expect(helpers.shouldSkipLine('* comentario')).toBe(true);
      expect(helpers.shouldSkipLine('/* comentario')).toBe(true);
      expect(helpers.shouldSkipLine('const x = 1;')).toBe(false);
    });
  });

  describe('detectFunctionDeclaration', () => {
    it('detecta varias formas de declaración', () => {
      expect(
        helpers.detectFunctionDeclaration('export const Button = () => {}')
      ).not.toBeNull();
      expect(
        helpers.detectFunctionDeclaration('export function Button() {')
      ).not.toBeNull();
      expect(
        helpers.detectFunctionDeclaration('const Button = function (')
      ).not.toBeNull();
      expect(
        helpers.detectFunctionDeclaration('const Button = async () => {}')
      ).not.toBeNull();
    });
    it('devuelve null si no es función', () => {
      expect(helpers.detectFunctionDeclaration('const x = 1;')).toBeNull();
    });
  });

  describe('getFunctionName', () => {
    it('extrae el nombre de la función', () => {
      const match = helpers.detectFunctionDeclaration(
        'export const Button = () => {}'
      );
      expect(helpers.getFunctionName(match!)).toBe('Button');
    });
  });

  describe('shouldSkipFunction', () => {
    it('detecta funciones a saltar', () => {
      expect(
        helpers.shouldSkipFunction('interface ButtonProps {}', 'Button')
      ).toBe(true);
      expect(helpers.shouldSkipFunction('type ButtonType = {}', 'Button')).toBe(
        true
      );
      expect(helpers.shouldSkipFunction('const x = () => 1;', 'x')).toBe(true);
      expect(helpers.shouldSkipFunction('const x = async () => 1;', 'x')).toBe(
        false
      );
    });
  });

  describe('analyzeFunctionComplexity', () => {
    it('analiza la complejidad de una función simple', () => {
      const lines = ['function foo() {', 'return 1;', '}'];
      const result = helpers.analyzeFunctionComplexity(
        lines,
        0,
        lines.join('\n')
      );
      expect(result.complexityScore).toBeGreaterThanOrEqual(0);
      expect(result.linesInFunction).toBeGreaterThan(0);
      expect(typeof result.isComplex).toBe('boolean');
    });
    it('detecta función compleja', () => {
      const lines = [
        'function foo() {',
        'if (a) {',
        'for (let i=0;i<10;i++) {',
        'try {',
        'await Promise.all([]);',
        '}',
        '}',
        '}',
        '}',
      ];
      const result = helpers.analyzeFunctionComplexity(
        lines,
        0,
        lines.join('\n')
      );
      expect(result.isComplex).toBe(true);
    });
  });

  describe('hasProperComments', () => {
    it('detecta comentarios válidos', () => {
      const lines = ['/** comentario */', 'function foo() {', 'return 1;', '}'];
      expect(helpers.hasProperComments(lines, 1, lines.join('\n'))).toBe(true);
    });
    it('devuelve false si no hay comentarios', () => {
      const lines = ['function foo() {', 'return 1;', '}'];
      expect(helpers.hasProperComments(lines, 0, lines.join('\n'))).toBe(false);
    });
  });

  describe('createCommentError', () => {
    it('genera el error correctamente', () => {
      const err = helpers.createCommentError(
        'foo',
        { complexityScore: 3, linesInFunction: 10 },
        'file',
        5
      );
      expect(err).toMatchObject({
        rule: expect.any(String),
        message: expect.stringContaining('foo'),
        filePath: expect.stringContaining('file'),
        line: 6,
        severity: 'warning',
        category: 'documentation',
      });
    });
  });
});
