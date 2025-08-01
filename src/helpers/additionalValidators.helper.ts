import path from 'path';
import { IValidationError } from '../types/index.js';

export const isConfigOrConstantsFile = (filePath: string): boolean => {
  return /config|constants/i.test(filePath) && filePath.endsWith('.ts');
};

export function shouldProcessFile(filePath: string): boolean {
  const fileName = path.basename(filePath);
  return fileName === 'index.tsx' && filePath.includes('/components/');
}

export function findFunctionMatch(
  content: string
): { functionName: string; lineNumber: number } | null {
  const functionPatterns = [
    // Función nombrada: export default function StoriesList() { ... }
    /export\s+default\s+function\s+(\w+)\s*\(/g,
    // Exportación directa con const: export const StoriesList = () => { ... }
    /export\s+const\s+([a-zA-Z_$][a-zA-Z0-9_$]{0,39})\s*=\s*\(([^)]{0,80})\)\s*=>\s*\{/g,
    // Función anónima asignada: const StoriesList = () => { ... }; export default StoriesList;
    /const\s+([a-zA-Z_$][a-zA-Z0-9_$]{0,39})\s*=\s*\(([^)]{0,80})\)\s*=>\s*\{/g,
    // Declaración de función: function StoriesList() { ... }; export default StoriesList;
    /function\s+(\w+)\s*\(/g,
    // React.FC con nombre: const StoriesList: React.FC = () => { ... }
    /const\s+(\w+)\s*:\s*React\.?FC</g,
    // TypeScript FC: const StoriesList: FC<Props> = () => { ... }
    /const\s+(\w+)\s*:\s*FC<?/g,
  ];

  for (const pattern of functionPatterns) {
    const match = pattern.exec(content);
    if (match?.[1]) {
      return {
        functionName: match[1],
        lineNumber: content.substring(0, match.index).split('\n').length,
      };
    }
  }
  return null;
}

export function validateFunctionName(
  functionName: string,
  dirName: string,
  isPascalCase: boolean,
  filePath: string,
  lineNumber: number
): IValidationError | null {
  if (!isPascalCase) {
    if (functionName.toLowerCase() !== dirName.toLowerCase()) {
      return createNameMismatchError(
        functionName,
        dirName,
        filePath,
        lineNumber
      );
    }
  } else if (functionName !== dirName) {
    return createNameMismatchError(functionName, dirName, filePath, lineNumber);
  }
  return null;
}

export function createNameMismatchError(
  functionName: string,
  dirName: string,
  filePath: string,
  lineNumber: number
): IValidationError {
  return {
    rule: 'Component function name match',
    message: `The function '${functionName}' (line ${lineNumber}) must have the same name as its containing folder '${dirName}'. ${
      dirName === dirName.toLowerCase()
        ? 'The folder must follow PascalCase and the function must have exactly the same name.'
        : `Found: function='${functionName}', folder='${dirName}'.`
    }`,
    filePath: filePath,
    line: lineNumber,
    severity: 'error',
    category: 'naming',
  };
}

export function createNoFunctionError(
  dirName: string,
  filePath: string
): IValidationError {
  return {
    rule: 'Component function name match',
    message: `No main exported function found in index.tsx. The folder '${dirName}' must contain a function with the same name.`,
    filePath: filePath,
    line: 1,
    severity: 'error',
    category: 'naming',
  };
}

export function shouldSkipLine(trimmedLine: string): boolean {
  return (
    !trimmedLine ||
    trimmedLine.startsWith('//') ||
    trimmedLine.startsWith('*') ||
    trimmedLine.startsWith('/*')
  );
}

export function detectFunctionDeclaration(
  trimmedLine: string
): RegExpMatchArray | null {
  // Split the complex regex into simpler ones
  const patterns = [
    // export const FunctionName = () =>
    /export\s+const\s+([a-zA-Z_$][a-zA-Z0-9_$]{1,39})\s*=\s*\(.*\)\s*=>/,
    // export const FunctionName = async () =>
    /export\s+const\s+([a-zA-Z_$][a-zA-Z0-9_$]{1,39})\s*=\s*async\s*\(.*\)\s*=>/,
    // const FunctionName = async () =>
    /const\s+([a-zA-Z_$][a-zA-Z0-9_$]{1,39})\s*=\s*async\s*\(.*\)\s*=>/,
    // export function FunctionName(
    /export\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]{1,39})\s*\(/,
    // const FunctionName = function (
    /const\s+([a-zA-Z_$][a-zA-Z0-9_$]{1,39})\s*=\s*function\s*\(/,
    // function FunctionName(
    /function\s+([a-zA-Z_$][a-zA-Z0-9_$]{1,39})\s*\(/,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(trimmedLine);
    if (match) {
      return match;
    }
  }
  return null;
}

export function getFunctionName(
  functionMatch: RegExpMatchArray
): string | null {
  return functionMatch[1] ?? null;
}

export function shouldSkipFunction(
  trimmedLine: string,
  _functionName: string
): boolean {
  if (trimmedLine.includes('interface ') || trimmedLine.includes('type ')) {
    return true;
  }

  return (
    trimmedLine.includes('=>') &&
    trimmedLine.length < 80 &&
    !trimmedLine.includes('async')
  );
}

export function analyzeFunctionComplexity(
  lines: string[],
  startIndex: number,
  content: string
) {
  let complexityScore = 0;
  let braceCount = 0;
  let inFunction = false;
  let linesInFunction = 0;

  const functionStartLine = lines[startIndex] ?? ''; // Fallback to empty string if undefined

  for (let j = startIndex; j < Math.min(startIndex + 30, lines.length); j++) {
    const bodyLine = lines[j];
    if (!bodyLine) continue;

    braceCount = updateBraceCount(bodyLine, braceCount);
    inFunction = inFunction || braceCount > 0;

    if (inFunction) {
      linesInFunction++;
      complexityScore += calculateLineComplexity(bodyLine);
    }

    if (inFunction && braceCount === 0) {
      break;
    }
  }

  const functionContent =
    content.indexOf(functionStartLine) >= 0
      ? content.substring(content.indexOf(functionStartLine))
      : '';

  const isComplex = determineComplexity(
    complexityScore,
    linesInFunction,
    functionContent
  );

  return { complexityScore, linesInFunction, isComplex };
}

function updateBraceCount(line: string, currentCount: number): number {
  const openBraces = (line.match(/\{/g) || []).length;
  const closeBraces = (line.match(/\}/g) || []).length;
  return currentCount + openBraces - closeBraces;
}

function calculateLineComplexity(line: string): number {
  let score = 0;

  if (/\b(if|else if|switch|case)\b/.test(line)) score += 1;
  if (/\b(for|while|do)\b/.test(line)) score += 2;
  if (/\b(try|catch|finally)\b/.test(line)) score += 2;
  if (
    /\b(async|await|Promise\.all|Promise\.resolve|Promise\.reject|\.then|\.catch)\b/.test(
      line
    )
  )
    score += 2;
  if (/\.(map|filter|reduce|forEach|find|some|every)\s*\(/.test(line))
    score += 1;
  if (/\?\s*[a-zA-Z0-9_$,\s=[]{}:.<>]{0,100}\s*:/.test(line)) score += 1; // Ternary operators
  if (/&&|\|\|/.test(line)) score += 0.5; // Logical operators

  return score;
}

function determineComplexity(
  score: number,
  lines: number,
  functionContent: string
): boolean {
  return (
    score >= 3 ||
    lines > 8 ||
    (score >= 2 && /async|await|Promise/.test(functionContent))
  );
}

export function hasProperComments(
  lines: string[],
  functionLineIndex: number,
  _content: string
): boolean {
  for (
    let k = Math.max(0, functionLineIndex - 15);
    k < functionLineIndex;
    k++
  ) {
    const commentLine = lines[k];
    if (!commentLine) continue;

    const trimmedCommentLine = commentLine.trim();
    if (isValidComment(trimmedCommentLine)) {
      return true;
    }
  }
  return false;
}

function isValidComment(commentLine: string): boolean {
  return (
    commentLine.includes('/**') ||
    commentLine.includes('*/') ||
    (commentLine.startsWith('*') && commentLine.length > 5) ||
    commentLine.includes('/*') ||
    (commentLine.startsWith('//') &&
      commentLine.length > 15 &&
      !/^\s*\/\/\s*(TODO|FIXME|NOTE|HACK)/.test(commentLine))
  );
}

export function createCommentError(
  functionName: string,
  analysis: { complexityScore: number; linesInFunction: number },
  filePath: string,
  lineNumber: number
): IValidationError {
  return {
    rule: 'Missing comment in complex function',
    message: `Complex function '${functionName}' (complexity: ${analysis.complexityScore.toFixed(
      1
    )}, lines: ${
      analysis.linesInFunction
    }) must have comments explaining its behavior.`,
    filePath: `${filePath}:${lineNumber + 1}`,
    line: lineNumber + 1,
    severity: 'warning',
    category: 'documentation',
  };
}
