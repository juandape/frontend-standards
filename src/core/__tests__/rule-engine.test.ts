import { RuleEngine } from '../rule-engine';
import fs from 'fs';

// Mock dependencies
jest.mock('fs');
jest.mock(
  './additional-validators.js',
  () => ({
    checkInlineStyles: jest.fn(() => []),
    checkCommentedCode: jest.fn(() => []),
    checkHardcodedData: jest.fn(() => []),
    checkFunctionComments: jest.fn(() => []),
    checkFunctionNaming: jest.fn(() => []),
    checkInterfaceNaming: jest.fn(() => []),
    checkStyleConventions: jest.fn(() => []),
    checkEnumsOutsideTypes: jest.fn(() => null),
    checkHookFileExtension: jest.fn(() => null),
    checkAssetNaming: jest.fn(() => null),
  }),
  { virtual: true }
);

describe('RuleEngine', () => {
  let mockLogger: any;
  let ruleEngine: RuleEngine;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    ruleEngine = new RuleEngine(mockLogger);
  });

  describe('constructor', () => {
    it('should initialize with empty rules and no config', () => {
      expect(ruleEngine.logger).toBe(mockLogger);
      expect(ruleEngine.rules).toEqual([]);
      expect(ruleEngine.config).toBeNull();
    });
  });

  describe('initialize', () => {
    it('should set config and rules', () => {
      const mockConfig = {
        rules: [
          { name: 'test-rule', check: () => false, message: 'Test message' },
        ],
        merge: true,
      };

      ruleEngine.initialize(mockConfig);

      expect(ruleEngine.config).toBe(mockConfig);
      expect(ruleEngine.rules).toEqual(mockConfig.rules);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Initialized rule engine with 1 rules'
      );
    });
  });

  describe('isConfigFile', () => {
    it('should identify config files', () => {
      expect(ruleEngine['isConfigFile']('webpack.config.js')).toBe(true);
      expect(ruleEngine['isConfigFile']('jest.config.ts')).toBe(true);
      expect(ruleEngine['isConfigFile']('.eslintrc.json')).toBe(true);
      expect(ruleEngine['isConfigFile']('tsconfig.json')).toBe(true);
      expect(ruleEngine['isConfigFile']('babel.config.js')).toBe(true);
    });

    it('should not identify non-config files', () => {
      expect(ruleEngine['isConfigFile']('component.tsx')).toBe(false);
      expect(ruleEngine['isConfigFile']('utils.js')).toBe(false);
      expect(ruleEngine['isConfigFile']('styles.css')).toBe(false);
    });
  });

  describe('isConfigurationFile (public method)', () => {
    it('should delegate to private isConfigFile method', () => {
      jest.spyOn(ruleEngine as any, 'isConfigFile').mockReturnValue(true);

      const result = ruleEngine.isConfigurationFile('test-file');

      expect(result).toBe(true);
      expect(ruleEngine['isConfigFile']).toHaveBeenCalledWith('test-file');
    });
  });

  describe('validateFile', () => {
    const mockFilePath = '/path/to/file.ts';
    const mockContent = 'const test = 123;';

    beforeEach(() => {
      jest.spyOn(fs, 'readFileSync').mockReturnValue(mockContent);
    });

    it('should skip config files', async () => {
      jest.spyOn(ruleEngine as any, 'isConfigFile').mockReturnValue(true);

      const errors = await ruleEngine.validateFile(mockFilePath);

      expect(errors).toEqual([]);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Skipping configuration file: ${mockFilePath}`
      );
    });

    it('should validate file content against rules', async () => {
      const mockRules: any = [
        {
          name: 'test-rule',
          check: jest.fn(() => true),
          message: 'Test message',
          severity: 'error' as const,
          category: 'content' as const,
        },
      ];
      ruleEngine.initialize({ rules: mockRules });

      const errors = await ruleEngine.validateFile(mockFilePath);

      expect(errors).toEqual([
        {
          rule: 'test-rule',
          message: 'Test message',
          filePath: mockFilePath,
          severity: 'error',
          category: 'content',
        },
      ]);
      expect(mockRules[0].check).toHaveBeenCalledWith(
        mockContent,
        mockFilePath
      );
    });

    it('should handle rule errors gracefully', async () => {
      const mockRules: any = [
        {
          name: 'failing-rule',
          check: jest.fn(() => {
            throw new Error('Rule failed');
          }),
          message: 'Should fail',
          severity: 'error' as const,
          category: 'content' as const,
        },
      ];
      ruleEngine.initialize({ rules: mockRules });

      const errors = await ruleEngine.validateFile(mockFilePath);

      expect(errors).toEqual([]);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Rule "failing-rule" failed for /path/to/file.ts:',
        'Rule failed'
      );
    });

    it('should handle file read errors', async () => {
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('File not found');
      });

      const errors = await ruleEngine.validateFile(mockFilePath);

      expect(errors).toEqual([
        {
          rule: 'File validation error',
          message: 'Could not validate file: File not found',
          filePath: mockFilePath,
          severity: 'error',
          category: 'content',
        },
      ]);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to validate file /path/to/file.ts:',
        'File not found'
      );
    });

    it('should skip additional content validators for index files', async () => {
      const mockRules: any = [];
      ruleEngine.initialize({ rules: mockRules });

      await ruleEngine.validateFile('/path/to/index.ts');

      expect(
        require('./additional-validators.js').checkInlineStyles
      ).not.toHaveBeenCalled();
    });

    it('should deduplicate errors', async () => {
      const mockRules: any = [
        {
          name: 'duplicate-rule',
          check: jest.fn(() => true),
          message: 'Duplicate message',
          severity: 'error' as const,
          category: 'content' as const,
        },
        {
          name: 'duplicate-rule',
          check: jest.fn(() => true),
          message: 'Duplicate message',
          severity: 'error' as const,
          category: 'content' as const,
        },
      ];
      ruleEngine.initialize({ rules: mockRules });

      const errors = await ruleEngine.validateFile(mockFilePath);

      expect(errors.length).toBe(1);
    });

    it('should handle variable shadowing rules specially', async () => {
      const mockRules: any = [
        {
          name: 'No variable shadowing',
          check: jest.fn(() => true),
          message: 'Avoid shadowing',
          severity: 'error' as const,
          category: 'content' as const,
          shadowingDetails: {
            variable: 'test',
            line: 42,
          },
        },
      ];
      ruleEngine.initialize({ rules: mockRules });

      const errors = await ruleEngine.validateFile(mockFilePath);

      expect(errors).toEqual([
        {
          rule: 'No variable shadowing',
          message:
            "Variable 'test' shadows a variable from an outer scope (line 42). Avoid shadowing",
          filePath: mockFilePath,
          severity: 'error',
          category: 'content',
          line: 42,
        },
      ]);
    });
  });

  describe('validate', () => {
    it('should delegate to validateFile', async () => {
      const mockFilePath = '/path/to/file.ts';
      const mockContent = 'const test = 123;';
      jest.spyOn(ruleEngine, 'validateFile').mockResolvedValue([]);

      await ruleEngine.validate(mockContent, mockFilePath);

      expect(ruleEngine.validateFile).toHaveBeenCalledWith(mockFilePath);
    });
  });

  describe('loadAdditionalValidators', () => {
    it('should handle missing validators', async () => {
      jest.resetModules();
      jest.doMock(
        './additional-validators.js',
        () => {
          throw new Error('Module not found');
        },
        { virtual: true }
      );
      const { RuleEngine } = require('../rule-engine');
      ruleEngine = new RuleEngine(mockLogger);
      const validators = await ruleEngine['loadAdditionalValidators']();

      expect(validators).toBeNull();
      // El mensaje real puede variar según Node, así que solo verificamos el inicio
      expect(mockLogger.debug.mock.calls[0][0]).toBe(
        'Additional validators not found:'
      );
      expect(mockLogger.debug.mock.calls[0][1]).toMatch(
        /Module not found|Cannot find module/
      );
    });
  });

  describe('runContentValidators', () => {
    it('should run all content validators', () => {
      const mockErrors: any[] = [];
      const mockValidators = {
        checkInlineStyles: jest.fn(() => [
          { rule: 'inline-styles', message: 'Avoid inline styles' },
        ]),
        checkCommentedCode: jest.fn(() => []),
        checkHardcodedData: jest.fn(() => []),
        checkFunctionComments: jest.fn(() => []),
        checkFunctionNaming: jest.fn(() => []),
        checkInterfaceNaming: jest.fn(() => []),
        checkStyleConventions: jest.fn(() => []),
      };

      ruleEngine['runContentValidators'](
        mockValidators,
        'const test = 123;',
        '/path/to/file.ts',
        mockErrors
      );

      expect(mockErrors.length).toBe(1);
      expect(mockErrors[0].rule).toBe('inline-styles');
      expect(mockValidators.checkInlineStyles).toHaveBeenCalled();
      // ... other validators
    });

    it('should handle validator errors', () => {
      const mockErrors: any[] = [];
      const mockValidators = {
        checkInlineStyles: jest.fn(() => {
          throw new Error('Validator failed');
        }),
        // ... other validators
      };

      ruleEngine['runContentValidators'](
        mockValidators,
        'const test = 123;',
        '/path/to/file.ts',
        mockErrors
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to run content validators:',
        'Validator failed'
      );
    });
  });

  describe('runFileValidators', () => {
    it('should run all file validators', () => {
      const mockErrors: any[] = [];
      const mockValidators = {
        checkEnumsOutsideTypes: jest.fn(() => ({
          rule: 'enum-placement',
          message: 'Enums should be in types folder',
        })),
        checkHookFileExtension: jest.fn(() => null),
        checkAssetNaming: jest.fn(() => null),
      };

      ruleEngine['runFileValidators'](
        mockValidators,
        '/path/to/file.ts',
        mockErrors
      );

      expect(mockErrors.length).toBe(1);
      expect(mockErrors[0].rule).toBe('enum-placement');
      expect(mockValidators.checkEnumsOutsideTypes).toHaveBeenCalled();
      // ... other validators
    });

    it('should handle validator errors', () => {
      const mockErrors: any[] = [];
      const mockValidators = {
        checkEnumsOutsideTypes: jest.fn(() => {
          throw new Error('Validator failed');
        }),
        // ... other validators
      };

      ruleEngine['runFileValidators'](
        mockValidators,
        '/path/to/file.ts',
        mockErrors
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to run file validators:',
        'Validator failed'
      );
    });
  });
});
