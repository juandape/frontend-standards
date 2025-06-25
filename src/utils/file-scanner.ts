import fs from "fs";
import path from "path";
import { Logger } from "./logger.js";

/**
 * File scanner utility for finding and filtering project files
 */
export class FileScanner {
  private rootDir: string;
  private logger: Logger;
  private extensions: string[];
  private defaultIgnorePatterns: string[];

  constructor(rootDir: string, logger: Logger) {
    this.rootDir = rootDir;
    this.logger = logger;
    this.extensions = [".js", ".ts", ".jsx", ".tsx"];
    this.defaultIgnorePatterns = [
      "node_modules",
      ".next",
      ".git",
      "__tests__",
      "__test__",
      "coverage",
      "dist",
      "build",
      ".nyc_output",
      "tmp",
      "temp",
    ];
  }

  /**
   * Get all files in a directory that match the criteria
   */
  async getFiles(
    dirPath: string = this.rootDir,
    customIgnorePatterns: string[] = []
  ): Promise<string[]> {
    const ignorePatterns = [
      ...this.defaultIgnorePatterns,
      ...customIgnorePatterns,
    ];
    const files: string[] = [];

    await this.scanDirectory(dirPath, files, ignorePatterns);

    this.logger.debug(`Found ${files.length} files in ${dirPath}`);
    return files;
  }

  /**
   * Get all directories in a path
   */
  async getDirectories(
    dirPath: string = this.rootDir,
    customIgnorePatterns: string[] = []
  ): Promise<string[]> {
    const ignorePatterns = [
      ...this.defaultIgnorePatterns,
      ...customIgnorePatterns,
    ];
    const directories: string[] = [];

    await this.scanDirectories(dirPath, directories, ignorePatterns);

    this.logger.debug(`Found ${directories.length} directories in ${dirPath}`);
    return directories;
  }

  /**
   * Recursively scan directory for files
   */
  private async scanDirectory(
    dir: string,
    files: string[],
    ignorePatterns: string[]
  ): Promise<void> {
    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);

        if (this.shouldIgnore(fullPath, ignorePatterns)) {
          continue;
        }

        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          await this.scanDirectory(fullPath, files, ignorePatterns);
        } else if (this.isValidFile(fullPath)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.warn(`Failed to scan directory ${dir}:`, errorMessage);
    }
  }

  /**
   * Recursively scan for directories
   */
  private async scanDirectories(
    dir: string,
    directories: string[],
    ignorePatterns: string[]
  ): Promise<void> {
    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);

        if (this.shouldIgnore(fullPath, ignorePatterns)) {
          continue;
        }

        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          directories.push(fullPath);
          await this.scanDirectories(fullPath, directories, ignorePatterns);
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.warn(`Failed to scan directories in ${dir}:`, errorMessage);
    }
  }

  /**
   * Check if a file path should be ignored
   */
  shouldIgnore(filePath: string, ignorePatterns: string[]): boolean {
    const lower = filePath.toLowerCase();
    const base = path.basename(filePath);

    // Check for test files
    if (base.includes(".test") || base.includes(".spec")) {
      return true;
    }

    // Check for system files
    if (base.startsWith(".") && base !== ".gitignore") {
      return true;
    }

    // Check for common ignored patterns
    if (
      lower.includes("config.ts") ||
      lower.includes("setup") ||
      lower.includes("eslint") ||
      lower.includes("package")
    ) {
      return true;
    }

    // Check custom ignore patterns
    return ignorePatterns.some((pattern) => {
      if (pattern.endsWith("/")) {
        // Folder pattern
        return filePath.includes(path.sep + pattern.replace(/\/$/, ""));
      }
      // File or general pattern
      return filePath.includes(pattern);
    });
  }

  /**
   * Check if a file is valid for processing
   */
  isValidFile(filePath: string): boolean {
    const ext = path.extname(filePath);
    return this.extensions.includes(ext);
  }

  /**
   * Load ignore patterns from .gitignore
   */
  loadGitIgnorePatterns(dirPath: string = this.rootDir): string[] {
    const gitignorePath = path.join(dirPath, ".gitignore");
    const patterns: string[] = [];

    if (fs.existsSync(gitignorePath)) {
      try {
        const content = fs.readFileSync(gitignorePath, "utf8");
        const lines = content
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith("#"));

        patterns.push(...lines);
        this.logger.debug(`Loaded ${lines.length} patterns from .gitignore`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        this.logger.warn(`Failed to read .gitignore: ${errorMessage}`);
      }
    }

    return patterns;
  }

  /**
   * Set custom file extensions
   */
  setExtensions(extensions: string[]): void {
    this.extensions = extensions;
  }

  /**
   * Add custom ignore patterns
   */
  addIgnorePatterns(patterns: string[]): void {
    this.defaultIgnorePatterns.push(...patterns);
  }
}
