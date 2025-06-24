/**
 * Logger utility for consistent logging across the application
 */
export class Logger {
  constructor(verbose = false) {
    this.verbose = verbose;
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
    };
    this.currentLevel = verbose ? this.levels.DEBUG : this.levels.INFO;
  }

  /**
   * Log an error message
   * @param {string} message Error message
   * @param {any} details Additional details
   */
  error(message, details = null) {
    if (this.currentLevel >= this.levels.ERROR) {
      console.error(`❌ ${message}`);
      if (details && this.verbose) {
        console.error(details);
      }
    }
  }

  /**
   * Log a warning message
   * @param {string} message Warning message
   * @param {any} details Additional details
   */
  warn(message, details = null) {
    if (this.currentLevel >= this.levels.WARN) {
      console.warn(`⚠️  ${message}`);
      if (details && this.verbose) {
        console.warn(details);
      }
    }
  }

  /**
   * Log an info message
   * @param {string} message Info message
   * @param {any} details Additional details
   */
  info(message, details = null) {
    if (this.currentLevel >= this.levels.INFO) {
      console.log(`ℹ️  ${message}`);
      if (details && this.verbose) {
        console.log(details);
      }
    }
  }

  /**
   * Log a debug message
   * @param {string} message Debug message
   * @param {any} details Additional details
   */
  debug(message, details = null) {
    if (this.currentLevel >= this.levels.DEBUG) {
      console.log(`🐛 ${message}`);
      if (details) {
        console.log(details);
      }
    }
  }

  /**
   * Log a success message
   * @param {string} message Success message
   * @param {any} details Additional details
   */
  success(message, details = null) {
    if (this.currentLevel >= this.levels.INFO) {
      console.log(`✅ ${message}`);
      if (details && this.verbose) {
        console.log(details);
      }
    }
  }

  /**
   * Set the logging level
   * @param {string} level Logging level (ERROR, WARN, INFO, DEBUG)
   */
  setLevel(level) {
    const upperLevel = level.toUpperCase();
    if (this.levels[upperLevel] !== undefined) {
      this.currentLevel = this.levels[upperLevel];
    } else {
      this.warn(`Invalid log level: ${level}`);
    }
  }

  /**
   * Check if verbose mode is enabled
   * @returns {boolean} True if verbose
   */
  isVerbose() {
    return this.verbose;
  }

  /**
   * Enable or disable verbose mode
   * @param {boolean} enabled Verbose mode enabled
   */
  setVerbose(enabled) {
    this.verbose = enabled;
    this.currentLevel = enabled ? this.levels.DEBUG : this.levels.INFO;
  }
}
