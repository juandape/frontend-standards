import * as acorn from 'acorn';

export interface IDeclaredVariable {
  node: acorn.Node;
  exported: boolean;
}

export interface INamingRule {
  dir: string;
  regex: RegExp;
  desc: string;
}

export interface IValidationError {
  rule: string;
  message: string;
  filePath: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  category?: string;
}
