import fs from "fs";
import path from "path";
import { Logger } from "../utils/logger.js";
import type {
  IProjectConfig,
  IValidationRule,
  INamingRule,
  IStructureConfig,
  CustomConfig,
} from "../types/config.types.js";

/**
 * Configuration loader and manager
 * Handles loading custom rules and project configuration
 */
export class ConfigLoader {
  private rootDir: string;
  private logger: Logger;
  private configFileName: string;

  constructor(rootDir: string, logger: Logger) {
    this.rootDir = rootDir;
    this.logger = logger;
    this.configFileName = "checkFrontendStandards.config.js";
  }

  /**
   * Load configuration from file or use defaults
   */
  async load(customConfigPath: string | null = null): Promise<IProjectConfig> {
    const configPath =
      customConfigPath || path.join(this.rootDir, this.configFileName);

    try {
      if (fs.existsSync(configPath)) {
        this.logger.info(`📋 Loading configuration from: ${configPath}`);

        // Dynamic import with cache busting
        const configModule = await import(`${configPath}?t=${Date.now()}`);
        const customConfig: CustomConfig = configModule.default || configModule;

        return this.mergeWithDefaults(customConfig);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.warn(
        `Failed to load config from ${configPath}:`,
        errorMessage
      );
    }

    this.logger.info("📋 Using default configuration");
    return this.getDefaultConfig();
  }

  /**
   * Merge custom configuration with defaults
   */
  private mergeWithDefaults(customConfig: CustomConfig): IProjectConfig {
    const defaultConfig = this.getDefaultConfig();

    if (typeof customConfig === "function") {
      return customConfig(defaultConfig);
    }

    if (Array.isArray(customConfig)) {
      return {
        ...defaultConfig,
        rules: [...defaultConfig.rules, ...customConfig],
      };
    }

    if (
      customConfig &&
      customConfig.merge === false &&
      Array.isArray(customConfig.rules)
    ) {
      return {
        ...defaultConfig,
        rules: customConfig.rules,
      };
    }

    if (customConfig && Array.isArray(customConfig.rules)) {
      const { rules, ...restConfig } = customConfig;
      return {
        ...defaultConfig,
        ...restConfig,
        rules: [...defaultConfig.rules, ...rules],
      };
    }

    return {
      ...defaultConfig,
      ...customConfig,
    };
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): IProjectConfig {
    return {
      rules: this.getDefaultRules(),
      zones: {
        includePackages: false,
        customZones: [],
      },
      extensions: [".js", ".ts", ".jsx", ".tsx"],
      ignorePatterns: [
        "node_modules",
        ".next",
        ".git",
        "__tests__",
        "__test__",
        "coverage",
        "dist",
        "build",
      ],
      structure: this.getDefaultStructure(),
      naming: this.getDefaultNamingRules(),
    };
  }

  /**
   * Get default validation rules
   */
  private getDefaultRules(): IValidationRule[] {
    return [
      {
        name: "No console.log",
        check: (content: string): boolean => content.includes("console.log"),
        message: "The use of console.log is not allowed in production code.",
      },
      {
        name: "No var",
        check: (content: string): boolean => /\bvar\b/.test(content),
        message: "Avoid using var, use let or const.",
      },
      {
        name: "No anonymous functions in callbacks",
        check: (content: string): boolean =>
          /\(([^)]*)\)\s*=>/.test(content) && /function\s*\(/.test(content),
        message: "Prefer arrow functions or named functions in callbacks.",
      },
      {
        name: "No unused variables",
        check: (content: string): boolean =>
          /\b_?\w+\b\s*=\s*[^;]*;?\n/g.test(content) &&
          /\/\/\s*eslint-disable-next-line\s+@typescript-eslint\/no-unused-vars/.test(
            content
          ) === false,
        message:
          "There should be no declared and unused variables (@typescript-eslint/no-unused-vars rule).",
      },
      {
        name: "Interface naming convention",
        check: (content: string): boolean => {
          const interfaceMatches = content.match(
            /export\s+interface\s+([A-Za-z_]\w*)/g
          );
          if (interfaceMatches) {
            return interfaceMatches.some((match) => {
              const interfaceName = match.replace(/export\s+interface\s+/, "");
              return !/^I[A-Z][a-zA-Z0-9]*$/.test(interfaceName);
            });
          }
          return false;
        },
        message:
          "Exported interfaces must start with I followed by PascalCase (e.g., IComponentProps).",
      },
    ];
  }

  /**
   * Get default project structure expectations
   */
  private getDefaultStructure(): IStructureConfig {
    return {
      app: ["pages", "components", "public"],
      package: ["src", "package.json"],
      src: {
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
      },
    };
  }

  /**
   * Get default naming convention rules
   */
  private getDefaultNamingRules(): INamingRule[] {
    return [
      {
        dir: "components",
        regex: /^[A-Z][A-Za-z0-9]+\.tsx$/,
        desc: "Components must be in PascalCase and end with .tsx",
      },
      {
        dir: "hooks",
        regex: /^use[A-Z][a-zA-Z0-9]*\.hook\.(ts|tsx)$/,
        desc: "Hooks must start with use followed by PascalCase and end with .hook.ts or .hook.tsx",
      },
      {
        dir: "constants",
        regex: /^[a-z][a-zA-Z0-9]*\.constant\.ts$/,
        desc: "Constants must be camelCase and end with .constant.ts",
      },
      {
        dir: "helpers",
        regex: /^[a-z][a-zA-Z0-9]*\.helper\.ts$/,
        desc: "Helpers must be camelCase and end with .helper.ts",
      },
      {
        dir: "types",
        regex: /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)*\.type\.ts$/,
        desc: "Types must be camelCase and end with .type.ts",
      },
      {
        dir: "styles",
        regex: /^[a-z][a-zA-Z0-9]*\.style\.ts$/,
        desc: "Styles must be camelCase and end with .style.ts",
      },
      {
        dir: "enums",
        regex: /^[a-z][a-zA-Z0-9]*\.enum\.ts$/,
        desc: "Enums must be camelCase and end with .enum.ts",
      },
      {
        dir: "assets",
        regex: /^[a-z0-9]+(-[a-z0-9]+)*\.(svg|png|jpg|jpeg|gif|webp|ico)$/,
        desc: "Assets must be in kebab-case (e.g., service-error.svg)",
      },
    ];
  }
}
