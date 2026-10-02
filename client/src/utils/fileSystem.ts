import type { StagedFile } from '../types';

/**
 * Recursively read all entries from a FileSystemDirectoryReader (handles pagination)
 */
async function readAllDirectoryEntries(reader: any): Promise<any[]> {
  const entries: any[] = [];
  let readBatch = async (): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      reader.readEntries(
        (results: any[]) => resolve(results),
        (error: any) => reject(error)
      );
    });
  };

  let batch = await readBatch();
  while (batch.length > 0) {
    entries.push(...batch);
    batch = await readBatch();
  }
  return entries;
}

/**
 * Recursively traverse a FileSystemEntry (File or Directory)
 */
async function traverseFileSystemEntry(
  entry: any,
  currentPath: string = ''
): Promise<StagedFile[]> {
  const stagedFiles: StagedFile[] = [];

  if (entry.isFile) {
    const file: File = await new Promise((resolve, reject) => {
      entry.file(
        (f: File) => resolve(f),
        (err: any) => reject(err)
      );
    });

    const relativePath = currentPath ? `${currentPath}/${file.name}` : file.name;
    stagedFiles.push({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      file,
      relativePath,
      size: file.size,
      name: file.name,
    });
  } else if (entry.isDirectory) {
    const dirReader = entry.createReader();
    const dirPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
    const subEntries = await readAllDirectoryEntries(dirReader);

    for (const subEntry of subEntries) {
      const nestedFiles = await traverseFileSystemEntry(subEntry, dirPath);
      stagedFiles.push(...nestedFiles);
    }
  }

  return stagedFiles;
}

/**
 * Process dragged DataTransfer items (handles both dropped files and entire dropped directories)
 */
export async function processDataTransfer(dataTransfer: DataTransfer): Promise<{
  files: StagedFile[];
  suggestedName: string;
  isFolder: boolean;
}> {
  const items = dataTransfer.items;
  const allStagedFiles: StagedFile[] = [];
  let suggestedName = '';
  let isFolder = false;

  if (items && items.length > 0) {
    const entryPromises: Promise<StagedFile[]>[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
        if (entry) {
          if (entry.isDirectory) {
            isFolder = true;
            if (!suggestedName) suggestedName = entry.name;
          } else if (!suggestedName) {
            suggestedName = entry.name;
          }
          entryPromises.push(traverseFileSystemEntry(entry));
        } else {
          const file = item.getAsFile();
          if (file) {
            if (!suggestedName) suggestedName = file.name;
            allStagedFiles.push({
              id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              file,
              relativePath: file.name,
              size: file.size,
              name: file.name,
            });
          }
        }
      }
    }

    if (entryPromises.length > 0) {
      const results = await Promise.all(entryPromises);
      for (const res of results) {
        allStagedFiles.push(...res);
      }
    }
  } else if (dataTransfer.files && dataTransfer.files.length > 0) {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      const file = dataTransfer.files[i];
      if (!suggestedName) suggestedName = file.name;
      allStagedFiles.push({
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        file,
        relativePath: (file as any).webkitRelativePath || file.name,
        size: file.size,
        name: file.name,
      });
    }
  }

  if (allStagedFiles.length > 1 && !isFolder) {
    isFolder = true;
  }

  return {
    files: allStagedFiles,
    suggestedName: suggestedName || `Backup_${new Date().toISOString().slice(0, 10)}`,
    isFolder,
  };
}

/**
 * Process input element file selection (e.g. from <input type="file" webkitdirectory />)
 */
export function processInputFiles(fileList: FileList): {
  files: StagedFile[];
  suggestedName: string;
  isFolder: boolean;
} {
  const allStagedFiles: StagedFile[] = [];
  let suggestedName = '';
  let isFolder = false;

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const relPath = (file as any).webkitRelativePath || file.name;
    
    if (relPath.includes('/')) {
      isFolder = true;
      const rootFolder = relPath.split('/')[0];
      if (!suggestedName) suggestedName = rootFolder;
    } else if (!suggestedName) {
      suggestedName = file.name;
    }

    allStagedFiles.push({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${i}`,
      file,
      relativePath: relPath,
      size: file.size,
      name: file.name,
    });
  }

  return {
    files: allStagedFiles,
    suggestedName: suggestedName || `Backup_${new Date().toISOString().slice(0, 10)}`,
    isFolder,
  };
}
