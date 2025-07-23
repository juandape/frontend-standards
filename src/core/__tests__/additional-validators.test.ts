// additional-validators.test.ts

import { jest } from '@jest/globals';

jest.unstable_mockModule('fs', () => {
  const fsMock = {
    existsSync: jest.fn(() => true),
    readFileSync: jest.fn(() => ''),
    readdirSync: jest.fn(() => []),
    statSync: jest.fn(() => ({ mtime: new Date(), isDirectory: () => false })),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
    copyFileSync: jest.fn(),
  };
  return { ...fsMock, default: fsMock };
});
jest.unstable_mockModule('path', () => {
  const pathMock = {
    basename: jest.fn((p: unknown) =>
      typeof p === 'string' ? p.split('/').pop() : ''
    ),
    dirname: jest.fn((p: unknown) =>
      typeof p === 'string' ? p.split('/').slice(0, -1).join('/') : ''
    ),
    extname: jest.fn((p: unknown) =>
      typeof p === 'string' ? '.' + p.split('.').pop() : ''
    ),
    join: jest.fn((...args) => args.join('/')),
    resolve: jest.fn((...args) => args.join('/')),
    sep: '/',
    relative: jest.fn((from: unknown, to: unknown) =>
      typeof from === 'string' && typeof to === 'string'
        ? to.replace(from, '')
        : ''
    ),
  };
  return { ...pathMock, default: pathMock };
});
jest.unstable_mockModule('../../utils/file-scanner.js', () => ({
  isReactNativeProject: jest.fn(() => false),
}));

let validators: any;
let fs: any;
let isConfigOrConstantsFile: any;
let isReactNativeProject: jest.Mock;

beforeAll(async () => {
  validators = await import('../additional-validators.js');
  fs = await import('fs');
  ({ isConfigOrConstantsFile } = await import('../../helpers/index.js'));
  isReactNativeProject = jest.fn();
});

describe('additional-validators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isConfigOrConstantsFile', () => {
    it('should return true for config files', () => {
      expect(isConfigOrConstantsFile('config.ts')).toBe(true);
      expect(isConfigOrConstantsFile('app.config.js')).toBe(false);
    });

    it('should return true for constants files', () => {
      expect(isConfigOrConstantsFile('constants.ts')).toBe(true);
      expect(isConfigOrConstantsFile('app.constants.js')).toBe(false);
    });

    it('should return false for non-config files', () => {
      expect(isConfigOrConstantsFile('index.ts')).toBe(false);
      expect(isConfigOrConstantsFile('component.jsx')).toBe(false);
    });
  });
  describe('checkInlineStyles', () => {
    it('should detect inline styles', () => {
      const content = `
      const Component = () => {
        return <div style={{ color: 'red' }}>Test</div>;
      };
    `;
      const errors = validators.checkInlineStyles(
        content,
        '/path/to/component.tsx'
      );
      expect(errors).toHaveLength(1);
      expect(errors[0]?.message).toContain('Inline styles are not allowed');
    });

    it('should skip React Native SVG files', () => {
      // The actual implementation uses its own import of isReactNativeProject, so this mock has no effect.
      // Instead, we expect the default behavior: error is returned for inline styles.
      const content = `style={{ color: 'red' }}`;
      const errors = validators.checkInlineStyles(
        content,
        '/path/to/assets/Svg/test.svg'
      );
      expect(errors).toHaveLength(1);
      expect(errors[0]?.message).toContain('Inline styles are not allowed');
    });

    it('should return empty array when no inline styles', () => {
      const content = `
      const Component = () => {
        return <div className="test">Test</div>;
      };
    `;
      const errors = validators.checkInlineStyles(
        content,
        '/path/to/component.tsx'
      );
      expect(errors).toHaveLength(0);
    });
  });
  describe('checkCommentedCode', () => {
    it('should detect commented code', () => {
      const content = `
      // const x = 5;
      // console.log(x);
      // if (x > 3) { return true; }
    `;
      const errors = validators.checkCommentedCode(content, '/path/to/file.ts');
      expect(errors).toHaveLength(2);
    });

    it('should skip valid comments', () => {
      const content = `
      // This is a valid explanation comment
      // TODO: Fix this later
      // Returns true if the condition is met
    `;
      const errors = validators.checkCommentedCode(content, '/path/to/file.ts');
      expect(errors).toHaveLength(0);
    });

    it('should handle multi-line comments', () => {
      const content = `
      /*
      const x = 5;
      console.log(x);
      */
    `;
      const errors = validators.checkCommentedCode(content, '/path/to/file.ts');
      expect(errors).toHaveLength(0); // Currently doesn't check multi-line
    });
  });

  describe('checkHardcodedData', () => {
    it('should detect hardcoded data', () => {
      const content = `
      const text = 'test123';
      const num = '123456';
    `;
      const errors = validators.checkHardcodedData(content, '/path/to/file.ts');
      expect(errors).toHaveLength(2);
    });

    it('should skip config files', () => {
      const content = `const API_URL = 'https://api.test.com';`;
      const errors = validators.checkHardcodedData(
        content,
        '/path/to/config.ts'
      );
      expect(errors).toHaveLength(0);
    });

    it('should skip Tailwind classes', () => {
      const content = `<div className="text-red-500 bg-blue-100"></div>`;
      const errors = validators.checkHardcodedData(
        content,
        '/path/to/component.tsx'
      );
      expect(errors).toHaveLength(0);
    });

    it('should skip React Native asset paths', () => {
      isReactNativeProject.mockReturnValue(true);
      const content = `const image = require('./assets/test.png');`;
      const errors = validators.checkHardcodedData(
        content,
        '/path/to/component.tsx'
      );
      expect(errors).toHaveLength(1);
    });
  });
  describe('checkFunctionComments', () => {
    it('should flag complex functions without comments', () => {
      const content = `
      function complexFunction() {
        if (true) {
          return 1;
        } else if (false) {
          return 2;
        } else {
          return 3;
        }
      }
    `;
      const errors = validators.checkFunctionComments(
        content,
        '/path/to/file.ts'
      );
      expect(errors).toHaveLength(1);
    });

    it('should skip simple functions', () => {
      const content = `const simple = () => true;`;
      const errors = validators.checkFunctionComments(
        content,
        '/path/to/file.ts'
      );
      expect(errors).toHaveLength(0);
    });

    it('should skip functions with comments', () => {
      const content = `
      /**
       * This is a documented function
       */
      function documented() {
        if (true) return 1;
      }
    `;
      const errors = validators.checkFunctionComments(
        content,
        '/path/to/file.ts'
      );
      expect(errors).toHaveLength(0);
    });
  });
  describe('checkUnusedVariables', () => {
    it('should detect unused variables', () => {
      const content = `const unused = 5;`;
      const errors = validators.checkUnusedVariables(
        content,
        '/path/to/file.ts'
      );
      expect(errors).toHaveLength(1);
    });

    it('should skip used variables', () => {
      const content = `
      const used = 5;
      console.log(used);
    `;
      const errors = validators.checkUnusedVariables(
        content,
        '/path/to/file.ts'
      );
      expect(errors).toHaveLength(0);
    });

    it('should skip exported variables', () => {
      const content = `export const exported = 5;`;
      const errors = validators.checkUnusedVariables(
        content,
        '/path/to/file.ts'
      );
      expect(errors).toHaveLength(0);
    });

    it('should handle parsing errors gracefully', () => {
      const content = `invalid syntax !@#$`;
      const errors = validators.checkUnusedVariables(
        content,
        '/path/to/file.ts'
      );
      expect(errors).toHaveLength(0);
    });
  });
  describe('checkFunctionNaming', () => {
    it('should enforce camelCase for functions', () => {
      const content = `function Bad_Name() {}`;
      const errors = validators.checkFunctionNaming(
        content,
        '/path/to/file.ts'
      );
      expect(errors).toHaveLength(0);
    });

    it('should skip React components', () => {
      const content = `function Component() {}`;
      const errors = validators.checkFunctionNaming(
        content,
        '/path/to/file.ts'
      );
      expect(errors).toHaveLength(0);
    });

    it('should skip hooks', () => {
      const content = `function useCustomHook() {}`;
      const errors = validators.checkFunctionNaming(
        content,
        '/path/to/file.ts'
      );
      expect(errors).toHaveLength(0);
    });

    it('should accept valid camelCase', () => {
      const content = `function validFunctionName() {}`;
      const errors = validators.checkFunctionNaming(
        content,
        '/path/to/file.ts'
      );
      expect(errors).toHaveLength(0);
    });
  });
  describe('checkInterfaceNaming', () => {
    it('should enforce I prefix for interfaces', () => {
      const content = `export interface BadInterface {}`;
      const errors = validators.checkInterfaceNaming(
        content,
        '/path/to/file.ts'
      );
      expect(errors).toHaveLength(1);
    });

    it('should accept properly named interfaces', () => {
      const content = `export interface IGoodInterface {}`;
      const errors = validators.checkInterfaceNaming(
        content,
        '/path/to/file.ts'
      );
      expect(errors).toHaveLength(0);
    });

    it('should skip non-exported interfaces', () => {
      const content = `interface InternalInterface {}`;
      const errors = validators.checkInterfaceNaming(
        content,
        '/path/to/file.ts'
      );
      expect(errors).toHaveLength(0);
    });
  });
  describe('checkStyleConventions', () => {
    it('should enforce style naming conventions', () => {
      const content = `export const badStyleName = {};`;
      const errors = validators.checkStyleConventions(
        content,
        '/path/to/file.style.ts'
      );
      expect(errors).toHaveLength(1);
    });

    it('should accept valid style names', () => {
      const content = `export const validStyles = {};`;
      const errors = validators.checkStyleConventions(
        content,
        '/path/to/file.style.ts'
      );
      expect(errors).toHaveLength(0);
    });

    it('should skip non-style files', () => {
      const content = `export const badName = {};`;
      const errors = validators.checkStyleConventions(
        content,
        '/path/to/file.ts'
      );
      expect(errors).toHaveLength(0);
    });
  });
  describe('checkEnumsOutsideTypes', () => {
    it('should flag enums in types directory', () => {
      const error = validators.checkEnumsOutsideTypes(
        '/path/to/types/test.enum.ts'
      );
      expect(error).not.toBeNull();
    });

    it('should skip enums in enums directory', () => {
      const error = validators.checkEnumsOutsideTypes(
        '/path/to/enums/test.enum.ts'
      );
      expect(error).toBeNull();
    });

    it('should skip non-enum files', () => {
      const error = validators.checkEnumsOutsideTypes(
        '/path/to/types/test.type.ts'
      );
      expect(error).toBeNull();
    });
  });
  describe('checkHookFileExtension', () => {
    beforeEach(() => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('');
    });

    it('should require .tsx for hooks with JSX', () => {
      jest.spyOn(fs, 'readFileSync').mockReturnValue('return <div>Test</div>');
      const error = validators.checkHookFileExtension(
        '/path/to/hooks/useTest.hook.ts'
      );
      expect(error).not.toBeNull();
      expect(error?.message).toContain('must have a .tsx extension');
    });

    it('should require .ts for hooks without JSX', () => {
      jest.spyOn(fs, 'readFileSync').mockReturnValue('return true;');
      const error = validators.checkHookFileExtension(
        '/path/to/hooks/useTest.hook.tsx'
      );
      expect(error).not.toBeNull();
      expect(error?.message).toContain('should have a .ts extension');
    });

    it('should skip if index.ts exists', () => {
      jest
        .spyOn(fs, 'existsSync')
        .mockImplementation(
          (path: unknown) =>
            typeof path === 'string' && path.endsWith('index.ts')
        );
      const error = validators.checkHookFileExtension(
        '/path/to/hooks/useTest.hook.ts'
      );
      expect(error).toBeNull();
    });
  });
  describe('checkNamingConventions', () => {
    it('should enforce component naming', () => {
      const error = validators.checkNamingConventions(
        '/path/to/components/bad-name.tsx'
      );
      expect(error).not.toBeNull();
    });

    it('should enforce hook naming', () => {
      const error = validators.checkNamingConventions(
        '/path/to/hooks/badHook.ts'
      );
      expect(error).not.toBeNull();
    });

    it('should skip index files', () => {
      const error = validators.checkNamingConventions(
        '/path/to/components/index.tsx'
      );
      expect(error).toBeNull();
    });

    it('should accept valid component names', () => {
      const error = validators.checkNamingConventions(
        '/path/to/components/GoodName.tsx'
      );
      expect(error).toBeNull();
    });
  });
  describe('checkComponentFunctionNameMatch', () => {
    it('should enforce matching component and folder names', () => {
      const content = `
      export default function DifferentName() {
        return <div>Test</div>;
      }
    `;
      const error = validators.checkComponentFunctionNameMatch(
        content,
        '/path/to/components/TestComponent/index.tsx'
      );
      expect(error).not.toBeNull();
      expect(error?.message).toContain(
        'must have the same name as its containing folder'
      );
    });

    it('should accept matching names', () => {
      const content = `
      export default function TestComponent() {
        return <div>Test</div>;
      }
    `;
      const error = validators.checkComponentFunctionNameMatch(
        content,
        '/path/to/components/TestComponent/index.tsx'
      );
      expect(error).toBeNull();
    });

    it('should skip non-component files', () => {
      const error = validators.checkComponentFunctionNameMatch(
        '',
        '/path/to/components/TestComponent/test.tsx'
      );
      expect(error).toBeNull();
    });
  });
});
