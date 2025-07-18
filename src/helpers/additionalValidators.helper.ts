export const isConfigOrConstantsFile = (filePath: string): boolean => {
  return /config|constants/i.test(filePath) && filePath.endsWith('.ts');
}