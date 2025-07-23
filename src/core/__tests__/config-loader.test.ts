import { ConfigLoader } from '../config-loader';
import fs from 'fs';

import { jest } from '@jest/globals';
// Mock the filesystem and other dependencies
jest.mock('fs');
jest.mock('../../utils/file-scanner');
jest.mock('../additional-validators');

describe('ConfigLoader', () => {
  let mockLogger: any;
  let configLoader: ConfigLoader;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    configLoader = new ConfigLoader('/project/root', mockLogger);
  });

  describe('constructor', () => {
    it('should initialize with provided root directory and logger', () => {
      expect(configLoader.rootDir).toBe('/project/root');
      expect(configLoader.logger).toBe(mockLogger);
      expect(configLoader.configFileName).toBe(
        'checkFrontendStandards.config.js'
      );
    });
  });

  describe('load', () => {
    it('should return default config when no config file exists', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const config = await configLoader.load();

      const def = configLoader.getDefaultConfig();
      expect(config.merge).toBe(def.merge);
      expect(config.onlyChangedFiles).toBe(def.onlyChangedFiles);
      expect(config.extensions).toEqual(def.extensions);
      expect(config.ignorePatterns).toEqual(def.ignorePatterns);
      expect(config.zones).toEqual(def.zones);
      expect(Array.isArray(config.rules)).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        '📋 Using default configuration'
      );
    });

    it('should load config from file using ESM import', async () => {
      const configPath = '/project/root/checkFrontendStandards.config.js';
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      // Mock Date.now to return a fixed value
      const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(12345);
      // Mock dynamic import via globalThis
      const mockConfig = { rules: [], merge: true };
      const originalImport = (globalThis as any).import;
      (globalThis as any).import = async (importPath: string) => {
        if (importPath === `${configPath}?t=12345`) {
          return { default: mockConfig };
        }
        throw new Error('Not found');
      };

      const config = await configLoader.load();

      expect(config.merge).toBe(mockConfig.merge);
      // Las reglas deben contener las reglas por defecto (no vacías)
      expect(Array.isArray(config.rules)).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        `📋 Loading configuration from: ${configPath}`
      );

      (globalThis as any).import = originalImport;
      dateNowSpy.mockRestore();
    });

    it('should accept custom config path', async () => {
      const customPath = '/custom/path/config.js';
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      // Mock Date.now to return a fixed value
      const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(12345);
      // Mock dynamic import via globalThis
      const mockConfig = { rules: [], merge: true };
      const originalImport = (globalThis as any).import;
      (globalThis as any).import = async (importPath: string) => {
        if (importPath === `${customPath}?t=12345`) {
          return { default: mockConfig };
        }
        throw new Error('Not found');
      };

      const config = await configLoader.load(customPath);

      expect(config.merge).toBe(mockConfig.merge);
      expect(Array.isArray(config.rules)).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        `📋 Loading configuration from: ${customPath}`
      );

      (globalThis as any).import = originalImport;
      dateNowSpy.mockRestore();
    });

    it('should resolve relative custom config path', async () => {
      const relativePath = './config.js';
      const absolutePath = '/project/root/config.js';
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      // Mock Date.now to return a fixed value
      const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(12345);
      // Mock dynamic import via globalThis
      const mockConfig = { rules: [], merge: true };
      const originalImport = (globalThis as any).import;
      (globalThis as any).import = async (importPath: string) => {
        if (importPath === `${absolutePath}?t=12345`) {
          return { default: mockConfig };
        }
        throw new Error('Not found');
      };

      const config = await configLoader.load(relativePath);

      expect(config.merge).toBe(mockConfig.merge);
      expect(Array.isArray(config.rules)).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        `📋 Loading configuration from: ${absolutePath}`
      );

      (globalThis as any).import = originalImport;
      dateNowSpy.mockRestore();
    });
  });

  describe('mergeWithDefaults', () => {
    it('should handle config as a function', () => {
      const mockRules = [
        {
          name: 'test-rule',
          category: 'test',
          severity: 'error',
          check: () => false,
          message: 'msg',
        },
      ];
      const mockFunction = jest.fn(() => ({ rules: mockRules }));

      const result = configLoader.mergeWithDefaults((() => ({
        rules: mockRules,
      })) as any);

      expect(result.rules).toEqual(mockRules);
      expect(mockFunction).not.toHaveBeenCalled(); // mockFunction is not used directly
    });

    it('should handle config as an array', () => {
      const mockRules = [
        {
          name: 'test-rule',
          category: 'test',
          severity: 'error',
          check: () => false,
          message: 'msg',
        },
      ];

      const result = configLoader.mergeWithDefaults(mockRules as any);

      // Comprobar que las reglas mockeadas están al final del array
      expect(result.rules?.slice(-mockRules.length)).toMatchObject(mockRules);
    });

    it('should handle config with merge:false', () => {
      const mockRules = [
        {
          name: 'test-rule',
          category: 'test',
          severity: 'error',
          check: () => false,
          message: 'msg',
        },
      ];
      const config = { merge: false, rules: mockRules };

      const result = configLoader.mergeWithDefaults(config as any);

      expect(result.rules).toEqual(mockRules);
    });

    it('should handle config with rules object format', () => {
      const config = {
        rules: {
          'No console.log': 'error',
          'Component naming': true,
        },
      };

      const result = configLoader.mergeWithDefaults(config as any);

      // Should convert object format to array format
      expect(result.rules).toEqual(expect.any(Array));
      expect(result.rules?.length).toBeGreaterThan(0);
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should handle unknown rules in object format', () => {
      const config = {
        rules: {
          'Unknown Rule': true,
        },
      };

      const result = configLoader.mergeWithDefaults(config as any);

      expect(result.rules).toEqual(expect.any(Array));
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Unknown rule: Unknown Rule'
      );
    });

    it('should return default config when config is empty object', () => {
      const result = configLoader.mergeWithDefaults({} as any);

      // Comparar solo las propiedades relevantes, no funciones
      const def = configLoader.getDefaultConfig();
      expect(result.merge).toBe(def.merge);
      expect(result.onlyChangedFiles).toBe(def.onlyChangedFiles);
      expect(result.extensions).toEqual(def.extensions);
      expect(result.ignorePatterns).toEqual(def.ignorePatterns);
      expect(result.zones).toEqual(def.zones);
      expect(Array.isArray(result.rules)).toBe(true);
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default configuration', () => {
      const defaultConfig = configLoader.getDefaultConfig();

      expect(defaultConfig).toEqual({
        merge: true,
        onlyChangedFiles: true,
        rules: expect.any(Array),
        zones: {
          includePackages: false,
          customZones: [],
        },
        extensions: ['.js', '.ts', '.jsx', '.tsx'],
        ignorePatterns: expect.any(Array),
      });

      // Verify rules are loaded
      expect(defaultConfig.rules?.length).toBeGreaterThan(0);
    });
  });

  describe('getDefaultRules', () => {
    it('should return all default rules organized by category', () => {
      const defaultRules = configLoader.getDefaultRules();

      expect(defaultRules).toEqual({
        structure: expect.any(Array),
        naming: expect.any(Array),
        content: expect.any(Array),
        style: expect.any(Array),
        documentation: expect.any(Array),
        typescript: expect.any(Array),
        react: expect.any(Array),
        imports: expect.any(Array),
        performance: expect.any(Array),
        accessibility: expect.any(Array),
      });

      // Verify each category has rules
      Object.values(defaultRules).forEach((categoryRules) => {
        expect(categoryRules.length).toBeGreaterThan(0);
      });
    });
  });

  describe('isConfigFile', () => {
    it('should identify common config files', () => {
      expect(configLoader['isConfigFile']('webpack.config.js')).toBe(true);
      expect(configLoader['isConfigFile']('jest.config.ts')).toBe(true);
      expect(configLoader['isConfigFile']('.eslintrc.json')).toBe(true);
      expect(configLoader['isConfigFile']('tsconfig.json')).toBe(true);
      expect(configLoader['isConfigFile']('babel.config.js')).toBe(true);
    });

    it('should not identify non-config files', () => {
      expect(configLoader['isConfigFile']('component.tsx')).toBe(false);
      expect(configLoader['isConfigFile']('utils.js')).toBe(false);
      expect(configLoader['isConfigFile']('styles.css')).toBe(false);
    });
  });

  describe('convertObjectRulesToArray', () => {
    it('should convert rules object to array format', () => {
      const defaultRules = configLoader.getDefaultRules();
      const rulesObject = {
        'No console.log': 'error',
        'Component naming': true,
      };

      const result = configLoader['convertObjectRulesToArray'](
        rulesObject as any,
        defaultRules
      );

      expect(result).toEqual(expect.any(Array));
      expect(result.length).toBe(2);
      expect(result[0]).toBeDefined();
      expect(result[0]?.name).toBe('No console.log');
      expect(result[0]?.severity).toBe('error');
      expect(result[1]).toBeDefined();
      expect(result[1]?.name).toBe('Component naming');
    });
  });

  describe('hasUnusedImports', () => {
    it('should detect unused imports', () => {
      const content = `
        import { unusedFunction } from './utils';
        import React from 'react';

        function Component() {
          return <div>Test</div>;
        }
      `;

      expect(configLoader['hasUnusedImports'](content)).toBe(true);
    });

    it('should not flag used imports', () => {
      const content = `
        import { usedFunction } from './utils';
        import React from 'react';

        function Component() {
          usedFunction();
          return <div>Test</div>;
        }
      `;

      expect(configLoader['hasUnusedImports'](content)).toBe(false);
    });

    it('should ignore type-only imports', () => {
      const content = `
        import type { SomeType } from './types';
        import React from 'react';

        function Component() {
          return <div>Test</div>;
        }
      `;

      expect(configLoader['hasUnusedImports'](content)).toBe(false);
    });
  });

  // Additional tests for specific rule categories
  describe('rule categories', () => {
    it('should have structure rules', () => {
      const rules = configLoader['getStructureRules']();
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0]).toBeDefined();
      expect(rules[0]?.category).toBe('structure');
    });

    it('should have naming rules', () => {
      const rules = configLoader['getNamingRules']();
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0]).toBeDefined();
      expect(rules[0]?.category).toBe('naming');
    });

    it('should have content rules', () => {
      const rules = configLoader['getContentRules']();
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0]).toBeDefined();
      expect(rules[0]?.category).toBe('content');
    });

    it('should have documentation rules', () => {
      const rules = configLoader['getDocumentationRules']();
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0]).toBeDefined();
      expect(rules[0]?.category).toBe('documentation');
    });
  });

  // Test for circular dependency detection
  describe('circular dependency detection', () => {
    it('should detect circular dependencies', () => {
      const content = `
        import { something } from './other-file';

        export function test() {
          return something();
        }
      `;

      const filePath = '/project/root/file.ts';

      // Mock the circular dependency scenario
      jest.spyOn(fs, 'readFileSync').mockImplementation((p) => {
        if (p === filePath) return content;
        if (p === '/project/root/other-file.ts') {
          return `import { test } from './file'; export function something() { return test(); }`;
        }
        return '';
      });

      // Mock fs.existsSync para que ambas rutas existan
      jest.spyOn(fs, 'existsSync').mockImplementation((p) => {
        return p === filePath || p === '/project/root/other-file.ts';
      });

      const rules = configLoader['getContentRules']();
      const circularRule = rules.find(
        (r) => r.name === 'No circular dependencies'
      );

      expect(circularRule).toBeDefined();
      expect(circularRule?.check(content, filePath)).toBe(true);
    });
  });
});
