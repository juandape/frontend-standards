import fs from 'fs';
import path from 'path';

/**
 * Project analyzer for detecting project type, structure, and zones
 */
export class ProjectAnalyzer {
  constructor(rootDir, logger) {
    this.rootDir = rootDir;
    this.logger = logger;
  }

  /**
   * Analyze the project structure and return project information
   * @returns {Promise<Object>} Project analysis results
   */
  async analyze() {
    const projectInfo = {
      type: this.detectProjectType(),
      isMonorepo: this.isMonorepo(),
      zones: [],
      structure: {},
    };

    if (projectInfo.isMonorepo) {
      projectInfo.zones = await this.detectMonorepoZones();
    } else {
      projectInfo.zones = [
        {
          name: 'root',
          path: this.rootDir,
          type: projectInfo.type,
        },
      ];
    }

    this.logger.debug('Project analysis result:', projectInfo);
    return projectInfo;
  }

  /**
   * Detect the type of project (app, package, library, etc.)
   * @param {string} projectPath Path to analyze (defaults to root)
   * @returns {string} Project type
   */
  detectProjectType(projectPath = this.rootDir) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const hasPackageJson = fs.existsSync(packageJsonPath);

    if (hasPackageJson) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf8')
        );

        // Check for Next.js app
        if (
          packageJson.dependencies?.next ||
          packageJson.devDependencies?.next
        ) {
          return 'nextjs-app';
        }

        // Check for React app
        if (
          packageJson.dependencies?.react ||
          packageJson.devDependencies?.react
        ) {
          return fs.existsSync(path.join(projectPath, 'src'))
            ? 'react-app'
            : 'react-component';
        }

        // Check for Node.js package
        if (packageJson.main || packageJson.exports) {
          return 'node-package';
        }
      } catch (error) {
        this.logger.warn('Failed to parse package.json:', error.message);
      }
    }

    // Fallback heuristics
    const hasSrc = fs.existsSync(path.join(projectPath, 'src'));
    const hasPages = fs.existsSync(path.join(projectPath, 'pages'));
    const hasApp = fs.existsSync(path.join(projectPath, 'app'));

    if (hasPages || hasApp) return 'app';
    if (hasPackageJson && hasSrc) return 'package';

    return 'other';
  }

  /**
   * Detect zone type for a specific path
   * @param {string} zonePath Path to analyze
   * @returns {string} Zone type
   */
  detectZoneType(zonePath) {
    return this.detectProjectType(zonePath);
  }

  /**
   * Check if the project is a monorepo
   * @returns {boolean} True if monorepo
   */
  isMonorepo() {
    const monorepoMarkers = [
      'packages',
      'apps',
      'lerna.json',
      'turbo.json',
      'nx.json',
      'rush.json',
    ];

    return monorepoMarkers.some((marker) =>
      fs.existsSync(path.join(this.rootDir, marker))
    );
  }

  /**
   * Detect zones in a monorepo
   * @returns {Promise<Array>} Array of zone objects
   */
  async detectMonorepoZones() {
    const zones = [];
    const candidates = ['apps', 'packages', 'libs', 'projects'];

    for (const candidate of candidates) {
      const candidatePath = path.join(this.rootDir, candidate);
      if (
        fs.existsSync(candidatePath) &&
        fs.statSync(candidatePath).isDirectory()
      ) {
        const subDirs = fs
          .readdirSync(candidatePath)
          .map((dir) => path.join(candidatePath, dir))
          .filter((dirPath) => fs.statSync(dirPath).isDirectory());

        for (const subDir of subDirs) {
          zones.push({
            name: path.relative(this.rootDir, subDir),
            path: subDir,
            type: this.detectZoneType(subDir),
          });
        }
      }
    }

    return zones;
  }

  /**
   * Get expected structure for a project type
   * @param {string} projectType Type of project
   * @returns {Array} Expected folders/files
   */
  getExpectedStructure(projectType) {
    const structures = {
      app: ['pages', 'components', 'public'],
      'nextjs-app': ['app', 'components', 'public', 'src'],
      'react-app': ['src', 'public'],
      package: ['src', 'package.json'],
      'node-package': ['src', 'package.json', 'lib'],
      other: [],
    };

    return structures[projectType] || structures.other;
  }

  /**
   * Get expected src structure
   * @returns {Object} Expected src structure
   */
  getExpectedSrcStructure() {
    return {
      assets: [],
      components: ['index.ts'],
      constants: ['index.ts'],
      modules: [],
      helpers: ['index.ts'],
      hooks: ['index.ts'],
      providers: ['index.ts'],
      styles: ['index.ts'],
      store: [
        'reducers',
        'types',
        'state.selector.ts',
        'state.interface.ts',
        'store',
      ],
    };
  }
}
