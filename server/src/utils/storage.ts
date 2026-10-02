import fs from 'fs-extra';
import path from 'path';

export interface FileItem {
  name: string;
  relativePath: string;
  size: number;
  isDirectory: boolean;
  mtime: Date;
  extension?: string;
  children?: FileItem[];
}

export interface BackupSession {
  id: string;
  name: string;
  createdAt: string;
  totalSize: number;
  totalFiles: number;
  isFolder: boolean;
  folderName?: string;
  filesSummary?: string[];
}

/**
 * Calculates total size and count of files recursively in a directory
 */
export async function getDirectoryStats(dirPath: string): Promise<{ size: number; count: number }> {
  let size = 0;
  let count = 0;

  if (!await fs.pathExists(dirPath)) {
    return { size: 0, count: 0 };
  }

  async function calculate(currentPath: string) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await calculate(fullPath);
      } else if (entry.isFile()) {
        if (entry.name === '.meta.json') continue; // skip metadata file
        const stats = await fs.stat(fullPath);
        size += stats.size;
        count++;
      }
    }
  }

  await calculate(dirPath);
  return { size, count };
}

/**
 * Build recursive file tree of a backup
 */
export async function getBackupTree(baseDir: string, relativeDir: string = ''): Promise<FileItem[]> {
  const currentPath = path.join(baseDir, relativeDir);
  if (!await fs.pathExists(currentPath)) return [];

  const entries = await fs.readdir(currentPath, { withFileTypes: true });
  const items: FileItem[] = [];

  for (const entry of entries) {
    if (entry.name === '.meta.json') continue;

    const entryRelative = relativeDir ? path.join(relativeDir, entry.name).replace(/\\/g, '/') : entry.name;
    const fullPath = path.join(currentPath, entry.name);

    if (entry.isDirectory()) {
      const children = await getBackupTree(baseDir, entryRelative);
      const stats = await fs.stat(fullPath);
      items.push({
        name: entry.name,
        relativePath: entryRelative,
        size: children.reduce((acc, c) => acc + c.size, 0),
        isDirectory: true,
        mtime: stats.mtime,
        children,
      });
    } else if (entry.isFile()) {
      const stats = await fs.stat(fullPath);
      items.push({
        name: entry.name,
        relativePath: entryRelative,
        size: stats.size,
        isDirectory: false,
        mtime: stats.mtime,
        extension: path.extname(entry.name).toLowerCase(),
      });
    }
  }

  // Sort directories first, then files alphabetically
  return items.sort((a, b) => {
    if (a.isDirectory === b.isDirectory) {
      return a.name.localeCompare(b.name);
    }
    return a.isDirectory ? -1 : 1;
  });
}
