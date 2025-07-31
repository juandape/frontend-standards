import { spawnSync } from 'child_process';
import path from 'path';
import which from 'which'; // Necesitarías instalarlo: npm i which

export function getGitLastAuthor(filePath: string, cwd: string): string {
  try {
    const absPath = path.resolve(filePath);
    const gitPath = which.sync('git'); // Te da la ruta absoluta
    const args = ['log', '-1', '--pretty=format:%an', '--', absPath];

    const result = spawnSync(gitPath, args, {
      cwd,
      encoding: 'utf8',
      shell: false,
    });

    if (result.error) return 'Unknown';

    return result.stdout.trim() || 'Unknown';
  } catch {
    return 'Unknown';
  }
}
