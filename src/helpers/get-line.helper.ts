import nthline from 'nthline';

/**
 * Gets a specific line from a file (1-based index).
 * Returns undefined if the line or file does not exist.
 */
export async function getLineFromFile(
  filePath: string,
  line: number
): Promise<string | undefined> {
  if (!filePath || !line || line < 1) return undefined;
  try {
    const content = await nthline(line, filePath);
    return content !== undefined ? content : undefined;
  } catch {
    return undefined;
  }
}
