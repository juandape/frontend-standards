import path from 'path';

/**
 * Safely retrieves the last author of a file using git.
 * Only works if the file exists and is part of a Git repo.
 */
export function getGitLastAuthor(filePath: string, cwd: string): string {
  try {
    const absPath = path.resolve(filePath);
    const args = ['log', '-1', '--pretty=format:%an', '--', absPath];
    const env: Record<string, string> = { PATH: process.env.PATH ?? '' };
    if (process.env.HOME) env.HOME = process.env.HOME;
    if (process.env.USER) env.USER = process.env.USER;
    const result = require('child_process').spawnSync('git', args, {
      cwd,
      encoding: 'utf8',
      shell: false,
      env,
    });
    if (result.error || result.status !== 0) {
      return 'Unknown';
    }
    return result.stdout.trim();
  } catch {
    return 'Unknown';
  }
}
