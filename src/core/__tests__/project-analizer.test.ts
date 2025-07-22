// project-analyzer.test.ts
import fs from 'fs';
import path from 'path';
import { ProjectAnalyzer } from '../project-analyzer';
import type { ILogger, IMonorepoZoneConfig } from '../../types';

// Mock the file system and path modules
jest.mock('fs');
jest.mock('path');

// Mock logger
const mockLogger: ILogger = {
  verbose: false,
  levels: {} as any,
  currentLevel: 0,
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('ProjectAnalyzer', () => {
  let analyzer: ProjectAnalyzer;
  const mockRootDir = '/project/root';

  beforeEach(() => {
    jest.clearAllMocks();
    analyzer = new ProjectAnalyzer(mockRootDir, mockLogger);
  });

  describe('constructor', () => {
    it('should initialize with root directory and logger', () => {
      expect(analyzer.rootDir).toBe(mockRootDir);
      expect(analyzer.logger).toBe(mockLogger);
    });
  });

  describe('detectProjectType', () => {
    it('should detect Next.js project from package.json', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({ dependencies: { next: '^12.0.0' } })
      );

      const type = analyzer.detectProjectType();
      expect(type).toBe('next');
    });

    it('should detect React project from package.json', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({ dependencies: { react: '^18.0.0' } })
      );

      const type = analyzer.detectProjectType();
      expect(type).toBe('react');
    });

    it('should detect Angular project from package.json', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({ dependencies: { '@angular/core': '^14.0.0' } })
      );

      const type = analyzer.detectProjectType();
      expect(type).toBe('angular');
    });

    it('should detect Vue project from package.json', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({ dependencies: { vue: '^3.0.0' } })
      );

      const type = analyzer.detectProjectType();
      expect(type).toBe('vue');
    });

    it('should detect Node project from package.json', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({ main: 'index.js' })
      );

      const type = analyzer.detectProjectType();
      expect(type).toBe('node');
    });

    it('should detect Next.js from heuristics (pages directory)', () => {
  // 1. Configurar el mock para package.json (sin dependencia next)
  (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
    return p === path.join(mockRootDir, 'package.json') ||
           p === path.join(mockRootDir, 'pages');
  });

  // 2. Configurar statSync para el directorio pages
  (fs.statSync as jest.Mock).mockImplementation((p: string) => ({
    isDirectory: () => p === path.join(mockRootDir, 'pages')
  }));

  // 3. Configurar readFileSync para devolver package.json sin next
  (fs.readFileSync as jest.Mock).mockImplementation((p: string) => {
    if (p === path.join(mockRootDir, 'package.json')) {
      return JSON.stringify({}); // package.json sin next
    }
    return '{}';
  });

  // 4. Llamar a la función
  const type = analyzer.detectProjectType();

  // 5. Verificar que detecta Next.js por el directorio pages
  expect(type).toBe('next');
});

    it('should return generic for unknown project types', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const type = analyzer.detectProjectType();
      expect(type).toBe('generic');
    });

  });

  describe('isMonorepo', () => {

    it('should detect monorepo from workspaces', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({ workspaces: ['packages/*'] })
      );

      expect(analyzer.isMonorepo()).toBe(true);
    });

    it('should return false for non-monorepo projects', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      expect(analyzer.isMonorepo()).toBe(false);
    });

    it('should handle package.json parsing errors', () => {
      (fs.existsSync as jest.Mock).mockImplementation((p) => {
        if (typeof p === 'string' && p.includes('package.json')) return true;
        return false;
      });
      (fs.readFileSync as jest.Mock).mockImplementation((p) => {
        if (typeof p === 'string' && p.includes('package.json'))
          throw new Error('Parse error');
        return '{}';
      });

      expect(analyzer.isMonorepo()).toBe(false);
      // The implementation does not call debug on parse error, so we expect no calls
      expect(mockLogger.debug).not.toHaveBeenCalled();
    });
  });

  describe('analyze', () => {
    it('should return basic project info for non-monorepo', async () => {
      jest.spyOn(analyzer, 'isMonorepo').mockReturnValue(false);
      jest.spyOn(analyzer, 'detectProjectType').mockReturnValue('react');

      const result = await analyzer.analyze();
      expect(result.type).toBe('react');
      expect(result.isMonorepo).toBe(false);
      expect(result.zones).toHaveLength(1);
      expect(result.zones?.[0]?.name).toBe('.');
    });

    it('should detect zones for monorepo', async () => {
      jest.spyOn(analyzer, 'isMonorepo').mockReturnValue(true);
      jest.spyOn(analyzer, 'detectMonorepoZones').mockResolvedValue([
        { name: 'app1', path: '/path/to/app1', type: 'next' },
        { name: 'lib1', path: '/path/to/lib1', type: 'node' },
      ]);

      const result = await analyzer.analyze();
      expect(result.isMonorepo).toBe(true);
      expect(result.zones).toHaveLength(2);
    });

    it('should process custom zones for non-monorepo', async () => {
      jest.spyOn(analyzer, 'isMonorepo').mockReturnValue(false);
      const config: IMonorepoZoneConfig = {
        customZones: ['src/modules/module1', 'src/modules/module2'],
      };

      jest.spyOn(analyzer, 'processCustomZones').mockReturnValue([
        {
          name: 'src/modules/module1',
          path: '/path/to/module1',
          type: 'react',
        },
        {
          name: 'src/modules/module2',
          path: '/path/to/module2',
          type: 'react',
        },
      ]);

      const result = await analyzer.analyze(config);
      expect(result.zones).toHaveLength(2);
    });

    it('should remove duplicate zones', async () => {
      jest.spyOn(analyzer, 'isMonorepo').mockReturnValue(true);
      jest.spyOn(analyzer, 'detectMonorepoZones').mockResolvedValue([
        { name: 'app1', path: '/path/to/app1', type: 'next' },
        { name: 'app1', path: '/path/to/app1', type: 'next' }, // Duplicate
      ]);

      const result = await analyzer.analyze();
      expect(result.zones).toHaveLength(1);
    });
  });

  describe('detectMonorepoZones', () => {
    it('should process only specified zone when onlyZone is configured', async () => {
      const config: IMonorepoZoneConfig = { onlyZone: 'apps/app1' };
      jest
        .spyOn(analyzer, 'processZoneDirectory')
        .mockReturnValue([
          { name: 'apps/app1', path: '/path/to/app1', type: 'next' },
        ]);

      const zones = await analyzer.detectMonorepoZones(config);
      expect(zones).toHaveLength(1);
      expect(analyzer.processZoneDirectory).toHaveBeenCalledWith('apps/app1');
    });

    it('should process standard zones', async () => {
      const config: IMonorepoZoneConfig = {};
      jest
        .spyOn(analyzer, 'getStandardZones')
        .mockReturnValue(['apps', 'libs']);
      jest
        .spyOn(analyzer, 'processZoneDirectory')
        .mockImplementation((zone) => {
          if (zone === 'apps')
            return [{ name: 'apps/app1', path: '/path/to/app1', type: 'next' }];
          if (zone === 'libs')
            return [{ name: 'libs/lib1', path: '/path/to/lib1', type: 'node' }];
          return [];
        });

      const zones = await analyzer.detectMonorepoZones(config);
      expect(zones).toHaveLength(2);
    });

    it('should process workspace zones', async () => {
      const config: IMonorepoZoneConfig = {};
      jest
        .spyOn(analyzer, 'processWorkspaceZones')
        .mockReturnValue([
          { name: 'packages/pkg1', path: '/path/to/pkg1', type: 'node' },
        ]);
      (fs.existsSync as jest.Mock).mockImplementation(
        (p) => typeof p === 'string'
      );
      (fs.statSync as jest.Mock).mockImplementation((p) => ({
        isDirectory: () => typeof p === 'string',
      }));

      const zones = await analyzer.detectMonorepoZones(config);
      expect(zones).toContainEqual(
        expect.objectContaining({ name: 'packages/pkg1' })
      );
    });

    it('should process custom zones', async () => {
      const config: IMonorepoZoneConfig = {
        customZones: ['custom/zone1'],
      };
      jest
        .spyOn(analyzer, 'processCustomZones')
        .mockReturnValue([
          { name: 'custom/zone1', path: '/path/to/zone1', type: 'react' },
        ]);
      (fs.existsSync as jest.Mock).mockImplementation(
        (p) => typeof p === 'string'
      );
      (fs.statSync as jest.Mock).mockImplementation((p) => ({
        isDirectory: () => typeof p === 'string',
      }));

      const zones = await analyzer.detectMonorepoZones(config);
      expect(zones).toContainEqual(
        expect.objectContaining({ name: 'custom/zone1' })
      );
    });
  });

  describe('processZoneDirectory', () => {
    it('should return empty array for non-existent directory', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const zones = analyzer.processZoneDirectory('nonexistent');
      expect(zones).toHaveLength(0);
    });

    it('should return empty array for non-directory paths', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => false });
      const zones = analyzer.processZoneDirectory('file.txt');
      expect(zones).toHaveLength(0);
    });
  });

  describe('processCustomZones', () => {
    it('should return empty array for undefined customZones', () => {
      const zones = analyzer.processCustomZones();
      expect(zones).toHaveLength(0);
    });

    it('should return empty array for non-array customZones', () => {
      const zones = analyzer.processCustomZones({} as any);
      expect(zones).toHaveLength(0);
    });

    it('should process valid custom zones', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });

      jest.spyOn(analyzer, 'detectZoneType').mockReturnValue('react');

      const zones = analyzer.processCustomZones(['src/modules/module1']);
      expect(zones).toHaveLength(1);
      expect(zones?.[0]?.name).toBe('src/modules/module1');
    });
  });

  describe('processWorkspaceZones', () => {
    it('should return empty array when no package.json', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const zones = analyzer.processWorkspaceZones({});
      expect(zones).toHaveLength(0);
    });

    it('should return empty array when no workspaces', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('{}');
      const zones = analyzer.processWorkspaceZones({});
      expect(zones).toHaveLength(0);
    });

    it('should handle parsing errors', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Parse error');
      });

      const zones = analyzer.processWorkspaceZones({});
      expect(zones).toHaveLength(0);
      expect(mockLogger.debug).toHaveBeenCalled();
    });
  });

  describe('validateZoneStructure', () => {
    it('should return empty array when validators not available', async () => {
      (analyzer as any).loadAdditionalValidators = jest
        .fn()
        .mockResolvedValue(null);

      const errors = await analyzer.validateZoneStructure([], [], 'zone1');
      expect(errors).toHaveLength(0);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should validate file naming conventions', async () => {
      const mockValidators = {
        checkNamingConventions: jest.fn().mockReturnValue({
          rule: 'Naming',
          message: 'Invalid name',
          filePath: 'file.ts',
          severity: 'error',
          category: 'naming',
        }),
        checkDirectoryNaming: jest.fn().mockReturnValue([]),
        checkComponentStructure: jest.fn().mockReturnValue([]),
        checkComponentFunctionNameMatch: jest.fn().mockReturnValue(null),
      };
      (analyzer as any).loadAdditionalValidators = jest
        .fn()
        .mockResolvedValue(mockValidators);

      const errors = await analyzer.validateZoneStructure(
        ['/path/to/invalid-file.ts'],
        [],
        'zone1'
      );
      expect(errors).toHaveLength(1);
      expect(mockValidators.checkNamingConventions).toHaveBeenCalled();
    });

    it('should validate component function names', async () => {
      const mockValidators = {
        checkNamingConventions: jest.fn().mockReturnValue(null),
        checkDirectoryNaming: jest.fn().mockReturnValue([]),
        checkComponentStructure: jest.fn().mockReturnValue([]),
        checkComponentFunctionNameMatch: jest.fn().mockReturnValue({
          rule: 'Component name',
          message: 'Mismatch',
          filePath: 'index.tsx',
          severity: 'error',
          category: 'naming',
        }),
      };
      (analyzer as any).loadAdditionalValidators = jest
        .fn()
        .mockResolvedValue(mockValidators);
      jest
        .spyOn(fs, 'readFileSync')
        .mockReturnValue('export default function Component() {}');

      const errors = await analyzer.validateZoneStructure(
        ['/path/to/components/Test/index.tsx'],
        [],
        'zone1'
      );
      expect(errors).toHaveLength(1);
    });
  });
});