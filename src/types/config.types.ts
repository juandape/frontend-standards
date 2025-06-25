/**
 * Type definitions for configuration system
 */

export interface IValidationRule {
  name: string;
  check: (content: string, filePath?: string) => boolean;
  message: string;
}

export interface IZonesConfig {
  includePackages: boolean;
  customZones: string[];
}

export interface INamingRule {
  dir: string;
  regex: RegExp;
  desc: string;
}

export interface IStructureConfig {
  app: string[];
  package: string[];
  src: {
    assets: string[];
    components: string[];
    constants: string[];
    modules: string[];
    helpers: string[];
    hooks: string[];
    providers: string[];
    styles: string[];
    store: string[];
  };
}

export interface IProjectConfig {
  rules: IValidationRule[];
  zones: IZonesConfig;
  extensions: string[];
  ignorePatterns: string[];
  structure: IStructureConfig;
  naming: INamingRule[];
  merge?: boolean;
}

export type CustomConfigFunction = (
  defaultConfig: IProjectConfig
) => IProjectConfig;
export type CustomConfig =
  | IProjectConfig
  | IValidationRule[]
  | CustomConfigFunction;
