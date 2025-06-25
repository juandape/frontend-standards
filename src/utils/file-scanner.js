import fs from 'fs';
import path from 'path';

/**
 * File scanner utility for finding and filtering project files
 */
export class FileScanner {
  constructor(rootDir, logger) {
    this.rootDir = rootDir;
    this.logger = logger;
    this.extensions = ['.js', '.ts', '.jsx', '.tsx'];
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
   * Get all files in a directory that match the criteria
   * @param {string} dirPath Directory to scan
   * @param {Array} customIgnorePatterns Additional patterns to ignore
   * @returns {Promise<Array>} Array of file paths
   */
  async getFiles(dirPath = this.rootDir, customIgnorePatterns = []) {
    const gitIgnorePatterns = this.loadGitIgnorePatterns(dirPath);
    const ignorePatterns = [
      ...this.defaultIgnorePatterns,
      ...gitIgnorePatterns,
      ...customIgnorePatterns,
    ];
    const files = [];

    await this.scanDirectory(dirPath, files, ignorePatterns);

    this.logger.debug(`Found ${files.length} files in ${dirPath}`);
    return files;
  }

  /**
   * Get all directories in a path
   * @param {string} dirPath Directory to scan
   * @param {Array} customIgnorePatterns Additional patterns to ignore
   * @returns {Promise<Array>} Array of directory paths
   */
  async getDirectories(dirPath = this.rootDir, customIgnorePatterns = []) {
    const gitIgnorePatterns = this.loadGitIgnorePatterns(dirPath);
    const ignorePatterns = [
      ...this.defaultIgnorePatterns,
      ...gitIgnorePatterns,
      ...customIgnorePatterns,
    ];
    const directories = [];

    await this.scanDirectories(dirPath, directories, ignorePatterns);

    this.logger.debug(`Found ${directories.length} directories in ${dirPath}`);
    return directories;
  }

  /**
   * Recursively scan directory for files
   * @param {string} dir Directory to scan
   * @param {Array} files Array to accumulate files
   * @param {Array} ignorePatterns Patterns to ignore
   */
  async scanDirectory(dir, files, ignorePatterns) {
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
      this.logger.warn(`Failed to scan directory ${dir}:`, error.message);
    }
  }

  /**
   * Recursively scan for directories
   * @param {string} dir Directory to scan
   * @param {Array} directories Array to accumulate directories
   * @param {Array} ignorePatterns Patterns to ignore
   */
  async scanDirectories(dir, directories, ignorePatterns) {
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
      this.logger.warn(`Failed to scan directories in ${dir}:`, error.message);
    }
  }

  /**
   * Check if a file path should be ignored
   * @param {string} filePath File path to check
   * @param {Array} ignorePatterns Patterns to ignore
   * @returns {boolean} True if should be ignored
   */
  shouldIgnore(filePath, ignorePatterns) {
    const lower = filePath.toLowerCase();
    const base = path.basename(filePath);
    const relativePath = path.relative(this.rootDir, filePath);

    // Check for test files
    if (base.includes('.test') || base.includes('.spec')) {
      return true;
    }

    // Check for system files (but allow .gitignore)
    if (base.startsWith('.') && base !== '.gitignore') {
      return true;
    }

    // Check for common ignored patterns
    if (
      lower.includes('config.ts') ||
      lower.includes('setup') ||
      lower.includes('eslint') ||
      lower.includes('package')
    ) {
      return true;
    }

    // Check against ignore patterns
    return ignorePatterns.some((pattern) => {
      // Handle glob patterns
      if (pattern.includes('*')) {
        const regex = pattern.replace(/\*/g, '.*');
        return (
          new RegExp(regex).test(relativePath) || new RegExp(regex).test(base)
        );
      }

      // Handle directory patterns (ending with /)
      if (pattern.endsWith('/')) {
        const dirPattern = pattern.replace(/\/$/, '');
        return (
          relativePath.includes(dirPattern + '/') ||
          relativePath.startsWith(dirPattern + '/')
        );
      }

      // Handle exact file matches
      if (base === pattern) {
        return true;
      }

      // Handle path contains pattern
      return relativePath.includes(pattern) || filePath.includes(pattern);
    });
  }

  /**
   * Check if a file is valid for processing
   * @param {string} filePath File path to check
   * @returns {boolean} True if valid
   */
  isValidFile(filePath) {
    const ext = path.extname(filePath);
    return this.extensions.includes(ext);
  }

  /**
   * Load ignore patterns from .gitignore
   * @param {string} dirPath Directory to look for .gitignore
   * @returns {Array} Array of ignore patterns
   */
  loadGitIgnorePatterns(dirPath = this.rootDir) {
    const gitignorePath = path.join(dirPath, '.gitignore');
    const patterns = [];

    if (fs.existsSync(gitignorePath)) {
      try {
        const content = fs.readFileSync(gitignorePath, 'utf8');
        const lines = content
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith('#'));

        patterns.push(...lines);
        this.logger.debug(`Loaded ${lines.length} patterns from .gitignore`);
      } catch (error) {
        this.logger.warn(`Failed to read .gitignore: ${error.message}`);
      }
    }

    return patterns;
  }

  /**
   * Set custom file extensions
   * @param {Array} extensions Array of file extensions
   */
  setExtensions(extensions) {
    this.extensions = extensions;
  }

  /**
   * Add custom ignore patterns
   * @param {Array} patterns Array of patterns to ignore
   */
  addIgnorePatterns(patterns) {
    this.defaultIgnorePatterns.push(...patterns);
  }
}
