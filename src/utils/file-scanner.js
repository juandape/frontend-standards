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
    // Always load gitignore from the project root, not the scan directory
    const gitIgnorePatterns = this.loadGitIgnorePatterns(this.rootDir);
    const ignorePatterns = [
      ...this.defaultIgnorePatterns,
      ...gitIgnorePatterns,
      ...customIgnorePatterns,
    ];
    const files = [];

    this.logger.debug(`Loading .gitignore patterns from: ${this.rootDir}`);
    this.logger.debug(`Found ${gitIgnorePatterns.length} gitignore patterns`);
    this.logger.debug(`Total ignore patterns: ${ignorePatterns.length}`);

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
    // Always load gitignore from the project root, not the scan directory
    const gitIgnorePatterns = this.loadGitIgnorePatterns(this.rootDir);
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

    // Normalize path separators for cross-platform compatibility
    const normalizedRelativePath = relativePath.replace(/\\/g, '/');
    const normalizedFilePath = filePath.replace(/\\/g, '/');

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

    // Check against ignore patterns with improved gitignore-style matching
    return ignorePatterns.some((pattern) => {
      // Skip empty patterns
      if (!pattern || pattern.trim() === '') {
        return false;
      }

      // Normalize the pattern
      const normalizedPattern = pattern.trim().replace(/\\/g, '/');

      // Handle exact filename matches
      if (base === normalizedPattern) {
        return true;
      }

      // Handle directory patterns (ending with /)
      if (normalizedPattern.endsWith('/')) {
        const dirPattern = normalizedPattern.slice(0, -1);
        return (
          normalizedRelativePath.startsWith(dirPattern + '/') ||
          normalizedRelativePath.includes('/' + dirPattern + '/') ||
          normalizedRelativePath === dirPattern
        );
      }

      // Handle wildcard patterns (*, *.extension, etc.)
      if (normalizedPattern.includes('*')) {
        try {
          // Convert gitignore-style wildcards to regex
          const regexPattern = normalizedPattern
            .replace(/\./g, '\\.')
            .replace(/\*\*/g, '.*') // ** matches any number of directories
            .replace(/\*/g, '[^/]*') // * matches anything except path separator
            .replace(/\?/g, '[^/]'); // ? matches single character except path separator

          const regex = new RegExp('^' + regexPattern + '$');

          // Test against both relative path and just the filename
          return regex.test(normalizedRelativePath) || regex.test(base);
        } catch (e) {
          // Fallback to simple contains check if regex fails
          return normalizedRelativePath.includes(
            normalizedPattern.replace(/\*/g, '')
          );
        }
      }

      // Handle patterns starting with / (root-relative)
      if (normalizedPattern.startsWith('/')) {
        const rootPattern = normalizedPattern.slice(1);
        return normalizedRelativePath.startsWith(rootPattern);
      }

      // Handle simple substring matches
      return (
        normalizedRelativePath.includes(normalizedPattern) ||
        normalizedFilePath.includes(normalizedPattern) ||
        base.includes(normalizedPattern)
      );
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

    this.logger.debug(`Looking for .gitignore at: ${gitignorePath}`);

    if (fs.existsSync(gitignorePath)) {
      try {
        const content = fs.readFileSync(gitignorePath, 'utf8');
        const lines = content
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith('#'));

        patterns.push(...lines);
        this.logger.debug(`Loaded ${lines.length} patterns from .gitignore`);
        this.logger.debug(`Patterns: ${JSON.stringify(lines, null, 2)}`);
      } catch (error) {
        this.logger.warn(`Failed to read .gitignore: ${error.message}`);
      }
    } else {
      this.logger.debug(`.gitignore not found at: ${gitignorePath}`);
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
