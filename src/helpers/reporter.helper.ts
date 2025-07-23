import { execSync } from 'child_process';
import path from 'path';

/**
 * Safely retrieves the last author of a file using git.
 * Only works if the file exists and is part of a Git repo.
 */
export function getGitLastAuthor(filePath: string, cwd: string): string {
  try {
    const absPath = path.resolve(filePath);
    const output = execSync(
      `git log -1 --pretty=format:'%an' -- "${absPath}"`,
      { cwd, encoding: 'utf8' }
    );
    return output.trim();
  } catch {
    return 'Unknown';
  }
}
