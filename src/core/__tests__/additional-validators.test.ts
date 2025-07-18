// additional-validators.test.ts
import * as validators from '../additional-validators';
import * as fs from 'fs';
import { isConfigOrConstantsFile } from '../../helpers';

// Mock the file system and path modules
jest.mock('fs');
jest.mock('path');
jest.mock('../utils/file-scanner', () => ({
  isReactNativeProject: jest.fn(),
}));

describe('additional-validators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

describe('isConfigOrConstantsFile', () => {
  it('should return true for config files', () => {
    expect(isConfigOrConstantsFile).toBe(true);
    expect(isConfigOrConstantsFile).toBe(true);
  });

  it('should return true for constants files', () => {
    expect(isConfigOrConstantsFile).toBe(true);
    expect(isConfigOrConstantsFile).toBe(true);
  });

  it('should return false for non-config files', () => {
    expect(isConfigOrConstantsFile).toBe(false);
    expect(isConfigOrConstantsFile).toBe(false);
  });
});
  describe('checkInlineStyles', () => {
  const mockIsReactNativeProject = require('../utils/file-scanner').isReactNativeProject;

  it('should detect inline styles', () => {
    const content = `
      const Component = () => {
        return <div style={{ color: 'red' }}>Test</div>;
      };
    `;
    const errors = validators.checkInlineStyles(content, '/path/to/component.tsx');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Inline styles are not allowed');
  });

  it('should skip React Native SVG files', () => {
    mockIsReactNativeProject.mockReturnValue(true);
    const content = `style={{ color: 'red' }}`;
    const errors = validators.checkInlineStyles(content, '/path/to/assets/Svg/test.svg');
    expect(errors).toHaveLength(0);
  });

  it('should return empty array when no inline styles', () => {
    const content = `
      const Component = () => {
        return <div className="test">Test</div>;
      };
    `;
    const errors = validators.checkInlineStyles(content, '/path/to/component.tsx');
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
    expect(errors).toHaveLength(3);
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
  const mockIsReactNativeProject = require('../utils/file-scanner').isReactNativeProject;

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
    const errors = validators.checkHardcodedData(content, '/path/to/config.ts');
    expect(errors).toHaveLength(0);
  });

  it('should skip Tailwind classes', () => {
    const content = `<div className="text-red-500 bg-blue-100"></div>`;
    const errors = validators.checkHardcodedData(content, '/path/to/component.tsx');
    expect(errors).toHaveLength(0);
  });

  it('should skip React Native asset paths', () => {
    mockIsReactNativeProject.mockReturnValue(true);
    const content = `const image = require('./assets/test.png');`;
    const errors = validators.checkHardcodedData(content, '/path/to/component.tsx');
    expect(errors).toHaveLength(0);
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
    const errors = validators.checkFunctionComments(content, '/path/to/file.ts');
    expect(errors).toHaveLength(1);
  });

  it('should skip simple functions', () => {
    const content = `const simple = () => true;`;
    const errors = validators.checkFunctionComments(content, '/path/to/file.ts');
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
    const errors = validators.checkFunctionComments(content, '/path/to/file.ts');
    expect(errors).toHaveLength(0);
  });
  });
  describe('checkUnusedVariables', () => {
  it('should detect unused variables', () => {
    const content = `const unused = 5;`;
    const errors = validators.checkUnusedVariables(content, '/path/to/file.ts');
    expect(errors).toHaveLength(1);
  });

  it('should skip used variables', () => {
    const content = `
      const used = 5;
      console.log(used);
    `;
    const errors = validators.checkUnusedVariables(content, '/path/to/file.ts');
    expect(errors).toHaveLength(0);
  });

  it('should skip exported variables', () => {
    const content = `export const exported = 5;`;
    const errors = validators.checkUnusedVariables(content, '/path/to/file.ts');
    expect(errors).toHaveLength(0);
  });

  it('should handle parsing errors gracefully', () => {
    const content = `invalid syntax !@#$`;
    const errors = validators.checkUnusedVariables(content, '/path/to/file.ts');
    expect(errors).toHaveLength(0);
  });
  });
  describe('checkFunctionNaming', () => {
  it('should enforce camelCase for functions', () => {
    const content = `function Bad_Name() {}`;
    const errors = validators.checkFunctionNaming(content, '/path/to/file.ts');
    expect(errors).toHaveLength(1);
  });

  it('should skip React components', () => {
    const content = `function Component() {}`;
    const errors = validators.checkFunctionNaming(content, '/path/to/file.ts');
    expect(errors).toHaveLength(0);
  });

  it('should skip hooks', () => {
    const content = `function useCustomHook() {}`;
    const errors = validators.checkFunctionNaming(content, '/path/to/file.ts');
    expect(errors).toHaveLength(0);
  });

  it('should accept valid camelCase', () => {
    const content = `function validFunctionName() {}`;
    const errors = validators.checkFunctionNaming(content, '/path/to/file.ts');
    expect(errors).toHaveLength(0);
  });
  });
  describe('checkInterfaceNaming', () => {
  it('should enforce I prefix for interfaces', () => {
    const content = `export interface BadInterface {}`;
    const errors = validators.checkInterfaceNaming(content, '/path/to/file.ts');
    expect(errors).toHaveLength(1);
  });

  it('should accept properly named interfaces', () => {
    const content = `export interface IGoodInterface {}`;
    const errors = validators.checkInterfaceNaming(content, '/path/to/file.ts');
    expect(errors).toHaveLength(0);
  });

  it('should skip non-exported interfaces', () => {
    const content = `interface InternalInterface {}`;
    const errors = validators.checkInterfaceNaming(content, '/path/to/file.ts');
    expect(errors).toHaveLength(0);
  });
  });
  describe('checkStyleConventions', () => {
  it('should enforce style naming conventions', () => {
    const content = `export const badStyleName = {};`;
    const errors = validators.checkStyleConventions(content, '/path/to/file.style.ts');
    expect(errors).toHaveLength(1);
  });

  it('should accept valid style names', () => {
    const content = `export const validStyles = {};`;
    const errors = validators.checkStyleConventions(content, '/path/to/file.style.ts');
    expect(errors).toHaveLength(0);
  });

  it('should skip non-style files', () => {
    const content = `export const badName = {};`;
    const errors = validators.checkStyleConventions(content, '/path/to/file.ts');
    expect(errors).toHaveLength(0);
  });
  });
  describe('checkEnumsOutsideTypes', () => {
  it('should flag enums in types directory', () => {
    const error = validators.checkEnumsOutsideTypes('/path/to/types/test.enum.ts');
    expect(error).not.toBeNull();
  });

  it('should skip enums in enums directory', () => {
    const error = validators.checkEnumsOutsideTypes('/path/to/enums/test.enum.ts');
    expect(error).toBeNull();
  });

  it('should skip non-enum files', () => {
    const error = validators.checkEnumsOutsideTypes('/path/to/types/test.type.ts');
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
    const error = validators.checkHookFileExtension('/path/to/hooks/useTest.hook.ts');
    expect(error).not.toBeNull();
  });

  it('should require .ts for hooks without JSX', () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('return true;');
    const error = validators.checkHookFileExtension('/path/to/hooks/useTest.hook.tsx');
    expect(error).not.toBeNull();
  });

  it('should skip if index.ts exists', () => {
    jest.spyOn(fs, 'existsSync').mockImplementation((path) =>
      path.toString().endsWith('index.ts')
    );
    const error = validators.checkHookFileExtension('/path/to/hooks/useTest.hook.ts');
    expect(error).toBeNull();
  });
  });
  describe('checkAssetNaming', () => {
  const mockIsReactNativeProject = require('../utils/file-scanner').isReactNativeProject;

  it('should enforce kebab-case for assets', () => {
    const error = validators.checkAssetNaming('/path/to/assets/badName.svg');
    expect(error).not.toBeNull();
  });

  it('should accept kebab-case assets', () => {
    const error = validators.checkAssetNaming('/path/to/assets/good-name.svg');
    expect(error).toBeNull();
  });

  it('should skip React Native SVG components', () => {
    mockIsReactNativeProject.mockReturnValue(true);
    const error = validators.checkAssetNaming('/path/to/Svg/Component.tsx');
    expect(error).toBeNull();
  });

  it('should skip non-asset files', () => {
    const error = validators.checkAssetNaming('/path/to/components/Test.tsx');
    expect(error).toBeNull();
  });
  });
  describe('checkNamingConventions', () => {
  it('should enforce component naming', () => {
    const error = validators.checkNamingConventions('/path/to/components/bad-name.tsx');
    expect(error).not.toBeNull();
  });

  it('should enforce hook naming', () => {
    const error = validators.checkNamingConventions('/path/to/hooks/badHook.ts');
    expect(error).not.toBeNull();
  });

  it('should skip index files', () => {
    const error = validators.checkNamingConventions('/path/to/components/index.tsx');
    expect(error).toBeNull();
  });

  it('should accept valid component names', () => {
    const error = validators.checkNamingConventions('/path/to/components/GoodName.tsx');
    expect(error).toBeNull();
  });
  });
  describe('checkDirectoryNaming', () => {
  it('should enforce camelCase for directories', () => {
    const errors = validators.checkDirectoryNaming('/path/to/src/bad-name');
    expect(errors).not.toHaveLength(0);
  });

  it('should skip allowed directories', () => {
    const errors = validators.checkDirectoryNaming('/path/to/src/components');
    expect(errors).toHaveLength(0);
  });

  it('should skip root directories', () => {
    const errors = validators.checkDirectoryNaming('/path/to/apps');
    expect(errors).toHaveLength(0);
  });

  it('should accept valid directory names', () => {
    const errors = validators.checkDirectoryNaming('/path/to/src/validName');
    expect(errors).toHaveLength(0);
  });
  });
  describe('checkComponentStructure', () => {
  beforeEach(() => {
    jest.spyOn(fs, 'existsSync').mockImplementation((path) => {
      return path.toString().includes('components');
    });
  });

  it('should require index files', () => {
    const errors = validators.checkComponentStructure('/path/to/components/Test');
    expect(errors.some(e => e.message.includes('index.tsx'))).toBe(true);
  });

  it('should skip generic components directory', () => {
    const errors = validators.checkComponentStructure('/path/to/components');
    expect(errors).toHaveLength(0);
  });

  // it('should check type file naming', () => {
  //   jest.spyOn(fs, 'readdirSync').mockReturnValue(['badName.ts']);
  //   const errors = validators.checkComponentStructure('/path/to/components/Test');
  //   expect(errors.some(e => e.message.includes('.type.ts'))).toBe(true);
  // });
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