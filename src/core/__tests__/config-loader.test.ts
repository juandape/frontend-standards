// config-loader.test.ts
import { ConfigLoader } from '../config-loader';

describe('ConfigLoader', () => {
  let logger: any;
  let loader: ConfigLoader;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    loader = new ConfigLoader('/root', logger);
  });

  it('should initialize properties correctly', () => {
    expect(loader.rootDir).toBe('/root');
    expect(loader.logger).toBe(logger);
    expect(loader.configFileName).toBe('checkFrontendStandards.config.js');
  });

  describe('load', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('should use default config if file does not exist', async () => {
      jest.spyOn(require('fs'), 'existsSync').mockReturnValue(false);
      const config = await loader.load();
      expect(config).toEqual(loader.getDefaultConfig());
      expect(logger.info).toHaveBeenCalledWith(
        '📋 Using default configuration'
      );
    });

    it('should handle error and use default config', async () => {
      jest.spyOn(require('fs'), 'existsSync').mockImplementation(() => {
        throw new Error('fail');
      });
      const config = await loader.load();
      expect(config).toEqual(loader.getDefaultConfig());
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('mergeWithDefaults', () => {
    it('should merge array config with defaults', () => {
      const customRule = {
        name: 'Custom',
        category: 'structure',
        severity: 'info',
        check: () => false,
        message: 'msg',
      } as any;
      const result = loader.mergeWithDefaults([customRule]);
      expect(result.rules?.some((r) => r.name === 'Custom')).toBe(true);
    });

    it('should merge object config with rules', () => {
      const customRule = {
        name: 'CustomObj',
        category: 'structure',
        severity: 'info',
        check: () => false,
        message: 'msg',
      } as any;
      const result = loader.mergeWithDefaults({ rules: [customRule] });
      expect(result.rules?.some((r) => r.name === 'CustomObj')).toBe(true);
    });

    it('should not merge if merge is false', () => {
      const customRule = {
        name: 'CustomNoMerge',
        category: 'structure',
        severity: 'info',
        check: () => false,
        message: 'msg',
      } as any;
      const result = loader.mergeWithDefaults({
        merge: false,
        rules: [customRule],
      });
      expect(result.rules).toEqual([customRule]);
    });

    it('should handle function config', () => {
      const fn = jest
        .fn()
        .mockReturnValue([
          {
            name: 'FnRule',
            category: 'structure',
            severity: 'info',
            check: () => false,
            message: 'msg',
          } as any,
        ]);
      const result = loader.mergeWithDefaults(fn);
      expect(result.rules?.some((r) => r.name === 'FnRule')).toBe(true);
    });
  });

  describe('isConfigFile', () => {
    it('should match common config file patterns', () => {
      const configFiles = [
        'jest.config.js',
        'vite.config.ts',
        'webpack.config.mjs',
        'tailwind.config.cjs',
        'next.config.json',
        'tsconfig.json',
        '.eslintrc.js',
        '.prettierrc',
        'babel.config.js',
        'postcss.config.js',
        'stylelint.config.js',
        'cypress.config.js',
        'playwright.config.js',
        'storybook.config.js',
        'metro.config.js',
        'expo.config.js',
      ];
      configFiles.forEach((file) => {
        expect(loader['isConfigFile'](file)).toBe(true);
      });
    });
    it('should not match non-config files', () => {
      const nonConfigFiles = ['index.ts', 'component.jsx', 'app.ts', 'main.js'];
      nonConfigFiles.forEach((file) => {
        expect(loader['isConfigFile'](file)).toBe(false);
      });
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default config object', () => {
      const config = loader.getDefaultConfig();
      expect(config).toHaveProperty('merge', true);
      expect(config).toHaveProperty('onlyChangedFiles', true);
      expect(Array.isArray(config.rules)).toBe(true);
      expect(config.extensions).toContain('.ts');
      expect(config.ignorePatterns).toContain('node_modules');
    });
  });

  describe('getDefaultRules', () => {
    it('should return default rules structure', () => {
      const rules = loader.getDefaultRules();
      expect(rules).toHaveProperty('structure');
      expect(rules).toHaveProperty('naming');
      expect(rules).toHaveProperty('content');
      expect(rules).toHaveProperty('style');
      expect(rules).toHaveProperty('documentation');
      expect(rules).toHaveProperty('typescript');
      expect(rules).toHaveProperty('react');
      expect(rules).toHaveProperty('imports');
      expect(rules).toHaveProperty('performance');
      expect(rules).toHaveProperty('accessibility');
    });
  });

  describe('getStructureRules', () => {
    it('should return structure rules array', () => {
      const rules = loader['getStructureRules']();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.some((r) => r.category === 'structure')).toBe(true);
    });
  });

  describe('getNamingRules', () => {
    it('should return naming rules array', () => {
      const rules = loader['getNamingRules']();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.some((r) => r.category === 'naming')).toBe(true);
    });
  });

  describe('getContentRules', () => {
    it('should return content rules array', () => {
      const rules = loader['getContentRules']();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.some((r) => r.category === 'content')).toBe(true);
    });
  });

  describe('getStyleRules', () => {
    it('should return style rules array', () => {
      const rules = loader['getStyleRules']();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.some((r) => r.category === 'style')).toBe(true);
    });
  });

  describe('getDocumentationRules', () => {
    it('should return documentation rules array', () => {
      const rules = loader['getDocumentationRules']();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.some((r) => r.category === 'documentation')).toBe(true);
    });
  });

  describe('getTypeScriptRules', () => {
    it('should return typescript rules array', () => {
      const rules = loader['getTypeScriptRules']();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.some((r) => r.category === 'typescript')).toBe(true);
    });
  });

  describe('getReactRules', () => {
    it('should return react rules array', () => {
      const rules = loader['getReactRules']();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.some((r) => r.category === 'react')).toBe(true);
    });
  });

  describe('getImportRules', () => {
    it('should return import rules array', () => {
      const rules = loader['getImportRules']();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.some((r) => r.category === 'imports')).toBe(true);
    });
  });

  describe('getPerformanceRules', () => {
    it('should return performance rules array', () => {
      const rules = loader['getPerformanceRules']();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.some((r) => r.category === 'performance')).toBe(true);
    });
  });

  describe('getAccessibilityRules', () => {
    it('should return accessibility rules array', () => {
      const rules = loader['getAccessibilityRules']();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.some((r) => r.category === 'accessibility')).toBe(true);
    });
  });

  describe('hasUnusedImports', () => {
    it('should detect unused imports', () => {
      const content = `import { A, B } from 'lib';\nconst a = 1;`;
      expect(loader['hasUnusedImports'](content)).toBe(true);
    });
    it('should not detect unused if used', () => {
      const content = `import { A, B } from 'lib';\nconsole.log(A);`;
      expect(loader['hasUnusedImports'](content)).toBe(false);
    });
  });

  describe('isUnusedImportLine', () => {
    it('should detect unused import line', () => {
      const importLine = `import { A } from 'lib';`;
      const content = `const b = 2;`;
      expect(loader['isUnusedImportLine'](importLine, content)).toBe(true);
    });
    it('should not detect unused if used', () => {
      const importLine = `import { A } from 'lib';`;
      const content = `console.log(A);`;
      expect(loader['isUnusedImportLine'](importLine, content)).toBe(false);
    });
  });
});
