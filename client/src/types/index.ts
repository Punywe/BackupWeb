export interface StagedFile {
  id: string;
  file: File;
  relativePath: string;
  size: number;
  name: string;
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

export interface FileTreeItem {
  name: string;
  relativePath: string;
  size: number;
  isDirectory: boolean;
  mtime: string;
  extension?: string;
  children?: FileTreeItem[];
}

export interface SystemInfo {
  success: boolean;
  port: number;
  lanIps: string[];
  primaryLanUrl: string;
  storageDir: string;
  totalBackups: number;
  totalStorageBytes: number;
  totalFiles: number;
}

export interface UploadProgressState {
  isUploading: boolean;
  loaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  estimatedSecondsRemaining: number;
  statusText: string;
  backupName: string;
}
