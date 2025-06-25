/**
 * Logger utility for consistent logging across the application
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogLevels {
  ERROR: LogLevel.ERROR;
  WARN: LogLevel.WARN;
  INFO: LogLevel.INFO;
  DEBUG: LogLevel.DEBUG;
}

export class Logger {
  private verbose: boolean;
  private readonly levels: LogLevels;
  private currentLevel: LogLevel;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
    this.levels = {
      ERROR: LogLevel.ERROR,
      WARN: LogLevel.WARN,
      INFO: LogLevel.INFO,
      DEBUG: LogLevel.DEBUG,
    };
    this.currentLevel = verbose ? this.levels.DEBUG : this.levels.INFO;
  }

  /**
   * Log an error message
   */
  error(message: string, details: unknown = null): void {
    if (this.currentLevel >= this.levels.ERROR) {
      console.error(`❌ ${message}`);
      if (details && this.verbose) {
        console.error(details);
      }
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, details: unknown = null): void {
    if (this.currentLevel >= this.levels.WARN) {
      console.warn(`⚠️  ${message}`);
      if (details && this.verbose) {
        console.warn(details);
      }
    }
  }

  /**
   * Log an info message
   */
  info(message: string, details: unknown = null): void {
    if (this.currentLevel >= this.levels.INFO) {
      console.log(`ℹ️  ${message}`);
      if (details && this.verbose) {
        console.log(details);
      }
    }
  }

  /**
   * Log a debug message
   */
  debug(message: string, details: unknown = null): void {
    if (this.currentLevel >= this.levels.DEBUG) {
      console.log(`🐛 ${message}`);
      if (details) {
        console.log(details);
      }
    }
  }

  /**
   * Log a success message
   */
  success(message: string, details: unknown = null): void {
    if (this.currentLevel >= this.levels.INFO) {
      console.log(`✅ ${message}`);
      if (details && this.verbose) {
        console.log(details);
      }
    }
  }

  /**
   * Set the logging level
   */
  setLevel(level: string): void {
    const upperLevel = level.toUpperCase() as keyof LogLevels;
    if (this.levels[upperLevel] !== undefined) {
      this.currentLevel = this.levels[upperLevel];
    } else {
      this.warn(`Invalid log level: ${level}`);
    }
  }

  /**
   * Check if verbose mode is enabled
   */
  isVerbose(): boolean {
    return this.verbose;
  }

  /**
   * Enable or disable verbose mode
   */
  setVerbose(enabled: boolean): void {
    this.verbose = enabled;
    this.currentLevel = enabled ? this.levels.DEBUG : this.levels.INFO;
  }
}
