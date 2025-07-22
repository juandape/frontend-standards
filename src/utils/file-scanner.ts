import fs from 'fs';
import path from 'path';
import type {
  IFileScanner,
  ILogger,
  IFileInfo,
  IScanOptions,
  IGitIgnorePattern,
  IFileScanResult,
} from '../types';

/**
 * File scanner utility for finding and filtering project files
 */
export class FileScanner implements IFileScanner {
  public readonly rootDir: string;
  public readonly logger: ILogger;
  public readonly gitignorePatterns: IGitIgnorePattern[] = [];
  private readonly defaultIgnorePatterns: string[];

  constructor(rootDir: string, logger: ILogger) {
    this.rootDir = rootDir;
    this.logger = logger;
    this.defaultIgnorePatterns = [
      'node_modules',
      '.next',
      '.git',
      '__tests__',
      '__test__',
      'coverage',
      'dist',
      'build',
      '.nyc_output',
      'tmp',
      'temp',
    ];
  }

  /**
   * Scan a specific zone for files
   * @param zone Zone to scan
   * @param options Scan options
   * @returns Array of file information
   */
  async scanZone(zone: string, options: IScanOptions): Promise<IFileInfo[]> {
    const zonePath = path.join(this.rootDir, zone);

    if (!fs.existsSync(zonePath)) {
      this.logger.warn(`Zone path does not exist: ${zonePath}`);
      return [];
    }

    const gitIgnorePatterns = await this.loadGitignorePatterns();
    const allIgnorePatterns = [
      ...this.defaultIgnorePatterns,
      ...gitIgnorePatterns.map((p) => p.pattern),
      ...options.ignorePatterns,
    ];

    this.logger.debug(`Loading .gitignore patterns from: ${this.rootDir}`);
    this.logger.debug(`Found ${gitIgnorePatterns.length} gitignore patterns`);
    this.logger.debug(`Total ignore patterns: ${allIgnorePatterns.length}`);

    const files = await this.scanDirectory(zonePath, options);

    this.logger.debug(`Found ${files.length} files in zone: ${zone}`);
    return files;
  }

  /**
   * Scan directory recursively for files
   * @param dirPath Directory path to scan
   * @param options Scan options
   * @returns Array of file information
   */
  async scanDirectory(
    dirPath: string,
    options: IScanOptions
  ): Promise<IFileInfo[]> {
    const files: IFileInfo[] = [];
    const gitIgnorePatterns = await this.loadGitignorePatterns();

    try {
      const entries = await fs.promises.readdir(dirPath, {
        withFileTypes: true,
      });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(this.rootDir, fullPath);

        // Check if path should be ignored
        if (this.isIgnored(relativePath, gitIgnorePatterns)) {
          continue;
        }

        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          const subFiles = await this.scanDirectory(fullPath, options);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          // Check if file has valid extension
          const ext = path.extname(entry.name);
          if (options.extensions.includes(ext)) {
            const content = await fs.promises.readFile(fullPath, 'utf8');
            const zone = this.determineZone(relativePath, options);

            const fileInfo: IFileInfo = {
              path: relativePath,
              content,
              size: content.length,
              extension: ext,
              zone,
              fullPath: fullPath,
            };

            files.push(fileInfo);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error scanning directory ${dirPath}:`, error);
    }

    return files;
  }

  /**
   * Load gitignore patterns from .gitignore file
   * @returns Array of gitignore patterns
   */
  async loadGitignorePatterns(): Promise<IGitIgnorePattern[]> {
    if (this.gitignorePatterns.length > 0) {
      return this.gitignorePatterns;
    }

    const gitignorePath = path.join(this.rootDir, '.gitignore');

    if (!fs.existsSync(gitignorePath)) {
      this.logger.debug('No .gitignore file found');
      return [];
    }

    try {
      const content = await fs.promises.readFile(gitignorePath, 'utf8');
      const lines = content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'));

      const patterns: IGitIgnorePattern[] = lines.map((line) => {
        const isNegation = line.startsWith('!');
        const pattern = isNegation ? line.slice(1) : line;
        const isDirectory = pattern.endsWith('/');

        return {
          pattern: isDirectory ? pattern.slice(0, -1) : pattern,
          isNegation,
          isDirectory,
        };
      });

      // Cache the patterns
      this.gitignorePatterns.push(...patterns);

      return patterns;
    } catch (error) {
      this.logger.error('Error reading .gitignore file:', error);
      return [];
    }
  }

  /**
   * Check if a file path should be ignored based on patterns
   * @param filePath File path to check
   * @param patterns Array of gitignore patterns
   * @returns True if file should be ignored
   */
  isIgnored(filePath: string, patterns: IGitIgnorePattern[]): boolean {
    // Normalize path separators
    const normalizedPath = filePath.replace(/\\/g, '/');

    // Check default ignore patterns first
    for (const pattern of this.defaultIgnorePatterns) {
      if (this.matchesPattern(normalizedPath, pattern)) {
        return true;
      }
    }

    let ignored = false;

    // Process gitignore patterns
    for (const { pattern, isNegation, isDirectory } of patterns) {
      const matches = this.matchesGitignorePattern(
        normalizedPath,
        pattern,
        isDirectory
      );

      if (matches) {
        ignored = !isNegation;
      }
    }

    return ignored;
  }

  /**
   * Check if path matches a simple pattern
   * @param filePath File path to check
   * @param pattern Pattern to match
   * @returns True if matches
   */
  private matchesPattern(filePath: string, pattern: string): boolean {
    // Simple pattern matching for default ignore patterns
    return filePath.includes(pattern) || filePath.startsWith(pattern);
  }

  /**
   * Check if path matches a gitignore pattern
   * @param filePath File path to check
   * @param pattern Gitignore pattern
   * @param isDirectory Whether pattern is for directories only
   * @returns True if matches
   */
  private matchesGitignorePattern(
    filePath: string,
    pattern: string,
    isDirectory: boolean
  ): boolean {
    // Convert gitignore pattern to regex
    let regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]');

    // Handle directory patterns
    if (isDirectory) {
      regexPattern += '(/.*)?$';
    } else {
      regexPattern += '$';
    }

    // Handle patterns that start with /
    if (pattern.startsWith('/')) {
      regexPattern = '^' + regexPattern.slice(1);
    } else {
      regexPattern = '(^|/)' + regexPattern;
    }

    try {
      const regex = new RegExp(regexPattern);
      return regex.test(filePath);
    } catch (error) {
      this.logger.warn(`Invalid gitignore pattern: ${pattern}`, error);
      return false;
    }
  }

  /**
   * Determine which zone a file belongs to
   * @param filePath File path
   * @param options Scan options
   * @returns Zone name
   */
  private determineZone(filePath: string, options: IScanOptions): string {
    const pathParts = filePath.split('/');

    // Check for specific zones
    for (const zone of [...(options.zones ?? []), ...options.customZones]) {
      if (filePath.startsWith(zone)) {
        return zone;
      }
    }

    // Default zone determination
    if (pathParts.includes('apps')) {
      const appsIndex = pathParts.indexOf('apps');
      return pathParts.slice(0, appsIndex + 2).join('/');
    }

    if (pathParts.includes('packages') && options.includePackages) {
      const packagesIndex = pathParts.indexOf('packages');
      return pathParts.slice(0, packagesIndex + 2).join('/');
    }

    // Return root zone
    return '.';
  }

  /**
   * Get file statistics
   * @param options Scan options
   * @returns File scan statistics
   */
  async getStatistics(options: IScanOptions): Promise<IFileScanResult> {
    const allFiles = await this.scanDirectory(this.rootDir, options);
    const gitIgnorePatterns = await this.loadGitignorePatterns();

    return {
      files: allFiles,
      totalFiles: allFiles.length,
      skippedFiles: 0, // Could be calculated if needed
      ignoredPatterns: gitIgnorePatterns.map((p) => p.pattern),
    };
  }

  /**
   * Get files that are staged for commit
   * @returns Array of file paths that are staged for commit
   */
  async getFilesInCommit(): Promise<string[]> {
    try {
      // Execute git command to get staged files (files added to the index)
      const { exec } = await import('child_process');

      return new Promise<string[]>((resolve) => {
        exec(
          'git diff --name-only --cached',
          { cwd: this.rootDir },
          (error, stdout) => {
            if (error) {
              this.logger.warn(`Failed to get staged files: ${error.message}`);
              resolve([]);
              return;
            }

            const files = stdout
              .trim()
              .split('\n')
              .filter(Boolean)
              .map((file) => path.join(this.rootDir, file));

            this.logger.debug(`Found ${files.length} files staged for commit`);
            resolve(files);
          }
        );
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to get staged files - git command failed: ${errorMessage}`
      );
      return [];
    }
  }
}

/**
 * Detect if the current project is a React Native project
 */
export function isReactNativeProject(filePath: string): boolean {
  // Find the root directory by going up until we find package.json
  let currentDir = path.dirname(filePath);
  let packageJsonPath = path.join(currentDir, 'package.json');

  // Keep going up until we find package.json or reach root
  while (
    !fs.existsSync(packageJsonPath) &&
    currentDir !== path.dirname(currentDir)
  ) {
    currentDir = path.dirname(currentDir);
    packageJsonPath = path.join(currentDir, 'package.json');
  }

  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Check for React Native dependencies
    const isRN = !!(
      packageJson.dependencies?.['react-native'] ??
      packageJson.devDependencies?.['react-native'] ??
      packageJson.dependencies?.['@react-native/metro-config'] ??
      packageJson.devDependencies?.['@react-native/metro-config'] ??
      // Check for Expo (which is also React Native)
      packageJson.dependencies?.['expo'] ??
      packageJson.devDependencies?.['expo']
    );

    // Also check for React Native specific files
    const hasMetroConfig = fs.existsSync(
      path.join(currentDir, 'metro.config.js')
    );
    const hasAndroidDir = fs.existsSync(path.join(currentDir, 'android'));
    const hasIosDir = fs.existsSync(path.join(currentDir, 'ios'));

    return isRN || (hasMetroConfig && (hasAndroidDir || hasIosDir));
  } catch {
    return false;
  }
}
