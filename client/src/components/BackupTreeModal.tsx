import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, 
  Folder, 
  FolderOpen, 
  FileText, 
  Download, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  Loader2,
  Calendar,
  FileCode,
  FileSpreadsheet,
  FileImage,
  FileAudio,
  FileVideo
} from 'lucide-react';
import type { FileTreeItem } from '../types';
import { formatBytes, formatDate } from '../utils/formatters';

interface BackupTreeModalProps {
  backupId: string | null;
  onClose: () => void;
  onDownloadZip: (id: string, name: string) => void;
  onDeleteBackup: (id: string) => void;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!ext) return <FileText className="w-4 h-4 text-slate-400 shrink-0" />;

  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'svg':
      return <FileImage className="w-4 h-4 text-pink-400 shrink-0" />;
    case 'mp4':
    case 'mkv':
    case 'mov':
    case 'avi':
      return <FileVideo className="w-4 h-4 text-purple-400 shrink-0" />;
    case 'mp3':
    case 'wav':
    case 'flac':
    case 'aac':
      return <FileAudio className="w-4 h-4 text-amber-400 shrink-0" />;
    case 'js':
    case 'ts':
    case 'tsx':
    case 'jsx':
    case 'html':
    case 'css':
    case 'json':
    case 'py':
    case 'go':
    case 'java':
    case 'cpp':
    case 'c':
      return <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />;
    case 'csv':
    case 'xlsx':
    case 'xls':
      return <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />;
    default:
      return <FileText className="w-4 h-4 text-slate-400 shrink-0" />;
  }
};

const TreeNode: React.FC<{
  item: FileTreeItem;
  backupId: string;
  onDeleteFile: (path: string) => void;
  level?: number;
}> = ({ item, backupId, onDeleteFile, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (item.isDirectory) {
    return (
      <div>
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          className="flex items-center justify-between py-2 pr-3 hover:bg-slate-850 hover:bg-slate-800/50 cursor-pointer rounded-lg transition-colors group"
        >
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className="text-slate-500 group-hover:text-slate-300">
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </span>
            {isOpen ? (
              <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="font-medium text-slate-200 text-xs truncate">{item.name}</span>
          </div>
          <span className="text-xs font-mono text-slate-500 shrink-0">
            {formatBytes(item.size)}
          </span>
        </div>

        {isOpen && item.children && (
          <div className="border-l border-slate-800 ml-4">
            {item.children.map((child, idx) => (
              <TreeNode
                key={idx}
                item={child}
                backupId={backupId}
                onDeleteFile={onDeleteFile}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Single file download link
  const downloadUrl = `/api/backups/${backupId}/download?file=${encodeURIComponent(item.relativePath)}`;

  return (
    <div
      style={{ paddingLeft: `${level * 16 + 12}px` }}
      className="flex items-center justify-between py-2 pr-3 hover:bg-slate-800/40 rounded-lg transition-colors group text-xs"
    >
      <div className="flex items-center gap-2 min-w-0 pr-2">
        <span className="w-4" /> {/* Spacer for chevron alignment */}
        {getFileIcon(item.name)}
        <span className="font-mono text-slate-300 truncate" title={item.relativePath}>
          {item.name}
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="font-mono text-slate-500">{formatBytes(item.size)}</span>
        <a
          href={downloadUrl}
          download={item.name}
          className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
          title="ดาวน์โหลดไฟล์นี้"
        >
          <Download className="w-3.5 h-3.5" />
        </a>
        <button
          onClick={() => onDeleteFile(item.relativePath)}
          className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
          title="ลบไฟล์นี้"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const BackupTreeModal: React.FC<BackupTreeModalProps> = ({
  backupId,
  onClose,
  onDownloadZip,
  onDeleteBackup,
}) => {
  const [loading, setLoading] = useState(true);
  const [backupData, setBackupData] = useState<{
    id: string;
    name: string;
    createdAt: string;
    totalSize: number;
    totalFiles: number;
    tree: FileTreeItem[];
  } | null>(null);

  const fetchTree = async () => {
    if (!backupId) return;
    try {
      setLoading(true);
      const res = await axios.get(`/api/backups/${backupId}`);
      if (res.data.success) {
        setBackupData(res.data.backup);
      }
    } catch (err) {
      console.error('Failed to load backup tree:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, [backupId]);

  const handleDeleteFile = async (filePath: string) => {
    if (!backupId) return;
    if (!confirm(`คุณต้องการลบไฟล์ "${filePath}" ใช่หรือไม่?`)) return;

    try {
      const res = await axios.delete(`/api/backups/${backupId}?file=${encodeURIComponent(filePath)}`);
      if (res.data.backupDeleted) {
        onDeleteBackup(backupId);
        onClose();
      } else {
        await fetchTree();
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      alert('ไม่สามารถลบไฟล์ได้');
    }
  };

  if (!backupId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white truncate max-w-md">
                {backupData?.name || backupId}
              </h3>
              {backupData && (
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    {formatDate(backupData.createdAt)}
                  </span>
                  <span>•</span>
                  <span>{backupData.totalFiles} ไฟล์</span>
                  <span>•</span>
                  <span className="font-mono text-cyan-300">{formatBytes(backupData.totalSize)}</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tree Content Body */}
        <div className="p-6 overflow-y-auto flex-1 divide-y divide-slate-800/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-3" />
              <p className="text-xs">กำลังโหลดโครงสร้างไฟล์...</p>
            </div>
          ) : backupData && backupData.tree.length > 0 ? (
            <div className="space-y-1">
              {backupData.tree.map((item, idx) => (
                <TreeNode
                  key={idx}
                  item={item}
                  backupId={backupId}
                  onDeleteFile={handleDeleteFile}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 text-sm">
              ไม่พบไฟล์ในชุดข้อมูลสำรองนี้
            </div>
          )}
        </div>

        {/* Bottom Actions Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบชุดข้อมูลสำรองนี้ทั้งหมด?')) {
                onDeleteBackup(backupId);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            ลบชุดข้อมูลสำรองนี้
          </button>

          <button
            onClick={() => {
              if (backupData) onDownloadZip(backupData.id, backupData.name);
            }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
          >
            <Download className="w-4 h-4" />
            ดาวน์โหลดทั้งหมดเป็น .ZIP
          </button>
        </div>
      </div>
    </div>
  );
};
