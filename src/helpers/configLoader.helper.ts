import fs from 'fs';
import path from 'path';
import type { ILogger } from '../types/index.js';
import { isReactNativeProject } from '../utils/file-scanner.js';

/**
 * Helper functions for ConfigLoader
 */
export class ConfigLoaderHelper {
  private readonly logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  /**
   * Try to load config file using both ESM and CommonJS methods
   */
  async tryLoadConfig(configPath: string): Promise<any> {
    let importError: any = null;

    // Try ESM dynamic import first
    try {
      const configModule = await import(`${configPath}?t=${Date.now()}`);
      return configModule?.default ?? configModule;
    } catch (err) {
      importError = err;
      // Try CommonJS require as fallback
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const requiredConfig = require(configPath);
        return requiredConfig?.default ?? requiredConfig;
      } catch (requireErr) {
        const msg =
          `Failed to load config from ${configPath} with both import and require.\n` +
          `import error: ${
            importError instanceof Error
              ? importError.message
              : String(importError)
          }\n` +
          `require error: ${
            requireErr instanceof Error
              ? requireErr.message
              : String(requireErr)
          }`;
        this.logger.warn(msg);
        return undefined;
      }
    }
  }

  /**
   * Check if file is a config file
   */
  isConfigFile(filePath: string): boolean {
    const fileName = path.basename(filePath);

    // Common configuration file patterns
    const configPatterns = [
      /\.config\.(js|ts|mjs|cjs|json)$/,
      /^(jest|vite|webpack|tailwind|next|eslint|prettier|babel|rollup|tsconfig)\.config\./,
      /^(vitest|nuxt|quasar)\.config\./,
      /^tsconfig.*\.json$/,
      /^\.eslintrc/,
      /^\.prettierrc/,
      /^babel\.config/,
      /^postcss\.config/,
      /^stylelint\.config/,
      /^cypress\.config/,
      /^playwright\.config/,
      /^storybook\.config/,
      /^metro\.config/,
      /^expo\.config/,
    ];

    return configPatterns.some((pattern) => pattern.test(fileName));
  }

  /**
   * Check for console.log statements with proper exclusions
   */
  checkConsoleLog(content: string, filePath: string): boolean {
    if (this.shouldSkipConsoleCheck(filePath)) {
      return false;
    }

    return this.hasConsoleInCode(content);
  }

  private shouldSkipConsoleCheck(filePath: string): boolean {
    const isDebugTestFile =
      filePath.includes('debug') ||
      filePath.includes('dev') ||
      filePath.includes('__tests__');

    // Skip check for debug/test files in all projects
    if (isDebugTestFile) {
      return true;
    }

    // No additional checks needed for non-React Native projects
    if (!isReactNativeProject(filePath)) {
      return false;
    }

    // For React Native, we already checked debug/test files above
    // So we just need to check if it's React Native to apply the rule
    return false;
  }

  private hasConsoleInCode(content: string): boolean {
    const lines = content.split('\n');
    let commentState = { inJSDoc: false, inMultiLineComment: false };

    for (const line of lines) {
      commentState = this.updateCommentState(line, commentState);

      if (this.isInComment(line, commentState)) {
        continue;
      }

      if (this.hasConsoleStatement(line)) {
        return true;
      }
    }
    return false;
  }

  private updateCommentState(
    line: string,
    state: { inJSDoc: boolean; inMultiLineComment: boolean }
  ) {
    // Handle JSDoc state
    if (/^\s*\/\*\*/.test(line)) return { ...state, inJSDoc: true };
    if (state.inJSDoc && /\*\//.test(line)) return { ...state, inJSDoc: false };

    // Handle multi-line comment state (non-JSDoc)
    if (/^\s*\/\*/.test(line) && !/^\s*\/\*\*/.test(line)) {
      return { ...state, inMultiLineComment: true };
    }
    if (state.inMultiLineComment && /\*\//.test(line)) {
      return { ...state, inMultiLineComment: false };
    }

    return state;
  }

  private isInComment(
    line: string,
    state: { inJSDoc: boolean; inMultiLineComment: boolean }
  ): boolean {
    return (
      state.inJSDoc ||
      state.inMultiLineComment ||
      /^\s*\*/.test(line) ||
      /^\s*\/\//.test(line)
    );
  }

  private hasConsoleStatement(line: string): boolean {
    return /console\.(log|warn|error|info|debug)/.test(line);
  }

  /**
   * Check for direct imports from sibling files
   */
  checkDirectImports(content: string, filePath: string): boolean {
    if (this.isIndexFile(filePath)) {
      return false;
    }

    const currentDir = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const importRegex =
      /import\s+(?:(?:{[^}]*})|(?:[\w*]+))\s+from\s+['"`]([^'"`]+)['"`]/g;
    let match;
    let foundViolation = false;

    while ((match = importRegex.exec(content)) !== null && !foundViolation) {
      const importPath = match[1];
      if (importPath === './' || importPath === '.') {
        foundViolation = this.checkIndexImport(currentDir, fileName, match[0]);
      }
    }

    return foundViolation;
  }

  private isIndexFile(filePath: string): boolean {
    const indexFilePatterns = [
      'index.ts',
      'index.tsx',
      'index.js',
      'index.jsx',
    ];
    return indexFilePatterns.includes(path.basename(filePath));
  }

  private checkIndexImport(
    currentDir: string,
    fileName: string,
    importStatement: string
  ): boolean {
    try {
      const indexContent = this.findIndexFileContent(currentDir);
      if (!indexContent) return false;

      const importedSymbols = this.extractImportedSymbols(importStatement);
      const dirFiles = fs.readdirSync(currentDir);

      return this.checkSymbolsAgainstExports(
        importedSymbols,
        dirFiles,
        fileName,
        indexContent,
        currentDir
      );
    } catch (error) {
      this.logger.warn(
        `Error checking index import in directory "${currentDir}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return false;
    }
  }

  private findIndexFileContent(dirPath: string): string | null {
    const extensions = ['ts', 'tsx', 'js', 'jsx'];
    for (const ext of extensions) {
      const testPath = path.join(dirPath, `index.${ext}`);
      if (fs.existsSync(testPath)) {
        return fs.readFileSync(testPath, 'utf8');
      }
    }
    return null;
  }

  private extractImportedSymbols(importStatement: string): string[] {
    const importRegex = /import\s+(?:{([^}]*)}|(\w+))/;
    const symbolsMatch = importRegex.exec(importStatement);
    if (!symbolsMatch) return [];

    if (symbolsMatch[1]) {
      return symbolsMatch[1].split(',').map((s) => s.trim());
    }
    return symbolsMatch[2] ? [symbolsMatch[2]] : [];
  }

  private checkSymbolsAgainstExports(
    symbols: string[],
    dirFiles: string[],
    fileName: string,
    indexContent: string,
    _currentDir: string
  ): boolean {
    for (const dirFile of dirFiles) {
      if (this.shouldSkipFile(dirFile, fileName)) continue;

      const fileBase = this.getFileBaseName(dirFile);
      if (this.isSymbolExported(symbols, fileBase, indexContent, dirFile)) {
        return true;
      }
    }
    return false;
  }

  private shouldSkipFile(dirFile: string, fileName: string): boolean {
    return dirFile.startsWith('index.') || dirFile === fileName;
  }

  private getFileBaseName(filePath: string): string {
    return filePath.replace(/\.(ts|tsx|js|jsx)$/, '');
  }

  private isSymbolExported(
    symbols: string[],
    fileBase: string,
    indexContent: string,
    dirFile: string
  ): boolean {
    const exportPatterns = this.getExportPatterns(
      fileBase,
      dirFile,
      indexContent
    );

    return symbols.some((symbol) =>
      this.checkSymbolExport(symbol, fileBase, indexContent, exportPatterns)
    );
  }

  private getExportPatterns(
    fileBase: string,
    _dirFile: string,
    indexContent: string
  ): string[] {
    const patterns = [
      `export * from './${fileBase}'`,
      `export * from "./${fileBase}"`,
      `export { default } from './${fileBase}'`,
      `export { default } from "./${fileBase}"`,
      `export { default as ${fileBase} }`,
      `export * as ${fileBase}`,
    ];

    const namedExports: string[] = [];
    const exportRegex = new RegExp(
      `export\\s+{([^}]*)}\\s+from\\s+['"]\\./${fileBase}['"]`,
      'g'
    );
    let execResult: RegExpExecArray | null;
    while ((execResult = exportRegex.exec(indexContent)) !== null) {
      namedExports.push(execResult[0]);
    }

    if (namedExports.length > 0) {
      patterns.push(...namedExports);
    }

    return patterns;
  }

  private checkSymbolExport(
    symbol: string,
    fileBase: string,
    indexContent: string,
    exportPatterns: string[]
  ): boolean {
    // Check default exports
    if (
      symbol === fileBase ||
      indexContent.includes(
        `export { default as ${symbol} } from './${fileBase}'`
      ) ||
      indexContent.includes(
        `export { default as ${symbol} } from "./${fileBase}"`
      )
    ) {
      return true;
    }

    // Check named exports
    return exportPatterns.some((pattern) => pattern.includes(symbol));
  }

  /**
   * Helper function for building dependency graph
   */
  buildDependencyGraph(
    filePath: string,
    extensions: string[],
    dependencyGraph: Record<string, Set<string>>
  ): void {
    const visitedFiles: Set<string> = new Set();

    const visit = (filePath: string) => {
      if (visitedFiles.has(filePath)) return;
      visitedFiles.add(filePath);

      const content = readFileContent(filePath);
      if (!content) return;

      const importPaths = extractImportPaths(content);
      const fileDir = path.dirname(filePath);

      for (const importPath of importPaths) {
        const resolvedImport = resolveImportPath(
          fileDir,
          importPath,
          extensions
        );
        if (resolvedImport) {
          dependencyGraph[filePath] ??= new Set();
          dependencyGraph[filePath].add(resolvedImport);
          visit(resolvedImport);
        }
      }
    };

    visit(filePath);
  }
}

/**
 * Lee el contenido de un archivo si existe.
 */
export function readFileContent(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Extrae los paths de importación relativos del contenido de un archivo.
 */
export function extractImportPaths(content: string): string[] {
  const matches = content.match(/import.*from\s+['"]([^'"]+)['"]/g) || [];
  return matches
    .map((imp) => {
      const match = /from\s+['"]([^'"]+)['"]/.exec(imp);
      return match?.[1];
    })
    .filter(
      (imp): imp is string =>
        !!imp && (imp.startsWith('./') || imp.startsWith('../'))
    );
}

/**
 * Resuelve una ruta de import relativa a partir del directorio base y extensiones.
 */
export function resolveImportPath(
  baseDir: string,
  importPath: string,
  extensions: string[]
): string | null {
  let resolved = path.resolve(baseDir, importPath);

  for (const ext of extensions) {
    if (fs.existsSync(resolved + ext)) {
      return resolved + ext;
    }
  }

  if (fs.existsSync(resolved)) {
    return resolved;
  }

  return null;
}
