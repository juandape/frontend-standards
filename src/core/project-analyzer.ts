import fs from "fs";
import path from "path";
import { Logger } from "../utils/logger.js";
import type {
  IProjectInfo,
  IProjectZone,
  ProjectType,
  IPackageJson,
} from "../types/project.types.js";

/**
 * Project analyzer for detecting project type, structure, and zones
 */
export class ProjectAnalyzer {
  private rootDir: string;
  private logger: Logger;

  constructor(rootDir: string, logger: Logger) {
    this.rootDir = rootDir;
    this.logger = logger;
  }

  /**
   * Analyze the project structure and return project information
   */
  async analyze(): Promise<IProjectInfo> {
    const projectInfo: IProjectInfo = {
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
          name: "root",
          path: this.rootDir,
          type: projectInfo.type,
        },
      ];
    }

    this.logger.debug("Project analysis result:", projectInfo);
    return projectInfo;
  }

  /**
   * Detect the type of project (app, package, library, etc.)
   */
  detectProjectType(projectPath: string = this.rootDir): ProjectType {
    const packageJsonPath = path.join(projectPath, "package.json");
    const hasPackageJson = fs.existsSync(packageJsonPath);

    if (hasPackageJson) {
      try {
        const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");
        const packageJson: IPackageJson = JSON.parse(packageJsonContent);

        // Check for Next.js app
        if (
          packageJson.dependencies?.next ||
          packageJson.devDependencies?.next
        ) {
          return "nextjs-app";
        }

        // Check for React app
        if (
          packageJson.dependencies?.react ||
          packageJson.devDependencies?.react
        ) {
          return fs.existsSync(path.join(projectPath, "src"))
            ? "react-app"
            : "react-component";
        }

        // Check for Node.js package
        if (packageJson.main || packageJson.exports) {
          return "node-package";
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        this.logger.warn("Failed to parse package.json:", errorMessage);
      }
    }

    // Fallback heuristics
    const hasSrc = fs.existsSync(path.join(projectPath, "src"));
    const hasPages = fs.existsSync(path.join(projectPath, "pages"));
    const hasApp = fs.existsSync(path.join(projectPath, "app"));

    if (hasPages || hasApp) return "app";
    if (hasPackageJson && hasSrc) return "package";

    return "other";
  }

  /**
   * Detect zone type for a specific path
   */
  detectZoneType(zonePath: string): ProjectType {
    return this.detectProjectType(zonePath);
  }

  /**
   * Check if the project is a monorepo
   */
  isMonorepo(): boolean {
    const monorepoMarkers = [
      "packages",
      "apps",
      "lerna.json",
      "turbo.json",
      "nx.json",
      "rush.json",
    ];

    return monorepoMarkers.some((marker) =>
      fs.existsSync(path.join(this.rootDir, marker))
    );
  }

  /**
   * Detect zones in a monorepo
   */
  async detectMonorepoZones(): Promise<IProjectZone[]> {
    const zones: IProjectZone[] = [];
    const candidates = ["apps", "packages", "libs", "projects"];

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
   */
  getExpectedStructure(projectType: ProjectType): string[] {
    const structures: Record<ProjectType, string[]> = {
      app: ["pages", "components", "public"],
      "nextjs-app": ["app", "components", "public", "src"],
      "react-app": ["src", "public"],
      package: ["src", "package.json"],
      "node-package": ["src", "package.json", "lib"],
      "react-component": ["src", "package.json"],
      other: [],
    };

    return structures[projectType] || structures.other;
  }

  /**
   * Get expected src structure
   */
  getExpectedSrcStructure(): Record<string, string[]> {
    return {
      assets: [],
      components: ["index.ts"],
      constants: ["index.ts"],
      modules: [],
      helpers: ["index.ts"],
      hooks: ["index.ts"],
      providers: ["index.ts"],
      styles: ["index.ts"],
      store: [
        "reducers",
        "types",
        "state.selector.ts",
        "state.interface.ts",
        "store",
      ],
    };
  }
}
