import type { ILogger, LogLevel } from '../types/index.js';

/**
 * Logger utility for consistent logging across the application
 */
export class Logger implements ILogger {
  public readonly verbose: boolean;
  public readonly levels: LogLevel;
  public readonly currentLevel: number;

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
   * @param message Error message
   * @param details Additional details
   */
  error(message: string, details: any = null): void {
    if (this.currentLevel >= this.levels.ERROR) {
      console.error(`❌ ${message}`);
      if (details && this.verbose) {
        console.error(details);
      }
    }
  }

  /**
   * Log a warning message
   * @param message Warning message
   * @param details Additional details
   */
  warn(message: string, details: any = null): void {
    if (this.currentLevel >= this.levels.WARN) {
      console.warn(`⚠️  ${message}`);
      if (details && this.verbose) {
        console.warn(details);
      }
    }
  }

  /**
   * Log an info message
   * @param message Info message
   * @param details Additional details
   */
  info(message: string, details: any = null): void {
    if (this.currentLevel >= this.levels.INFO) {
      console.log(`ℹ️  ${message}`);
      if (details && this.verbose) {
        console.log(details);
      }
    }
  }

  /**
   * Log a debug message
   * @param message Debug message
   * @param details Additional details
   */
  debug(message: string, details: any = null): void {
    if (this.currentLevel >= this.levels.DEBUG) {
      console.log(`🐛 ${message}`);
      if (details) {
        console.log(details);
      }
    }
  }

  /**
   * Create a child logger with a prefix
   * @param prefix Prefix for log messages
   * @returns New logger instance with prefix
   */
  withPrefix(prefix: string): Logger {
    const childLogger = new Logger(this.verbose);

    // Override methods to include prefix
    const originalError = childLogger.error.bind(childLogger);
    const originalWarn = childLogger.warn.bind(childLogger);
    const originalInfo = childLogger.info.bind(childLogger);
    const originalDebug = childLogger.debug.bind(childLogger);

    childLogger.error = (message: string, details?: any) =>
      originalError(`[${prefix}] ${message}`, details);
    childLogger.warn = (message: string, details?: any) =>
      originalWarn(`[${prefix}] ${message}`, details);
    childLogger.info = (message: string, details?: any) =>
      originalInfo(`[${prefix}] ${message}`, details);
    childLogger.debug = (message: string, details?: any) =>
      originalDebug(`[${prefix}] ${message}`, details);

    return childLogger;
  }

  /**
   * Set log level dynamically
   * @param level New log level
   */
  setLevel(level: keyof LogLevel): void {
    (this as any).currentLevel = this.levels[level];
  }

  /**
   * Check if a log level is enabled
   * @param level Log level to check
   * @returns True if level is enabled
   */
  isLevelEnabled(level: keyof LogLevel): boolean {
    return this.currentLevel >= this.levels[level];
  }
}
