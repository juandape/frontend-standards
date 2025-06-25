// Temporary type declarations for additional-validators.js
// TODO: Migrate this file to TypeScript for proper type safety

export function checkInlineStyles(content: string, filePath: string): any[];
export function checkCommentedCode(content: string, filePath: string): any[];
export function checkHardcodedData(content: string, filePath: string): any[];
export function checkFunctionComments(content: string, filePath: string): any[];
export function checkFunctionNaming(content: string, filePath: string): any[];
export function checkInterfaceNaming(content: string, filePath: string): any[];
export function checkStyleConventions(content: string, filePath: string): any[];
export function checkEnumsOutsideTypes(filePath: string): any;
export function checkHookFileExtension(filePath: string): any;
export function checkAssetNaming(filePath: string): any;
export function checkNamingConventions(filePath: string): any;
export function checkDirectoryNaming(dirPath: string): any[];
export function checkComponentStructure(dirPath: string): any[];
