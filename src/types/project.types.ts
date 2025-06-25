/**
 * Type definitions for project analysis system
 */

export type ProjectType =
  | "nextjs-app"
  | "react-app"
  | "react-component"
  | "node-package"
  | "app"
  | "package"
  | "other";

export interface IProjectZone {
  name: string;
  path: string;
  type: ProjectType;
}

export interface IProjectInfo {
  type: ProjectType;
  isMonorepo: boolean;
  zones: IProjectZone[];
  structure: Record<string, unknown>;
}

export interface IPackageJson {
  main?: string;
  exports?: Record<string, unknown>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}
