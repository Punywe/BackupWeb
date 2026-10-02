import React, { useState } from 'react';
import { 
  FolderArchive, 
  FileText, 
  Trash2, 
  Send, 
  Layers, 
  Tag, 
  HardDrive,
  FolderOpen
} from 'lucide-react';
import type { StagedFile } from '../types';
import { formatBytes } from '../utils/formatters';

interface UploadQueueProps {
  files: StagedFile[];
  backupName: string;
  isFolder: boolean;
  onBackupNameChange: (name: string) => void;
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
  onStartUpload: () => void;
}

export const UploadQueue: React.FC<UploadQueueProps> = ({
  files,
  backupName,
  isFolder,
  onBackupNameChange,
  onRemoveFile,
  onClearAll,
  onStartUpload,
}) => {
  const [showAllFiles, setShowAllFiles] = useState(false);

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  const displayedFiles = showAllFiles ? files : files.slice(0, 8);

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header with Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400">
            {isFolder ? <FolderArchive className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              พร้อมสำหรับการสำรองข้อมูล
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 text-xs border border-cyan-500/30 font-medium">
                {files.length} รายการ
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ตรวจสอบไฟล์และกำหนดชื่อสำหรับการค้นหาในอนาคต
            </p>
          </div>
        </div>

        {/* Total Size Indicator */}
        <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400">ขนาดรวมทั้งหมด:</span>
            <span className="text-sm font-bold text-white font-mono">{formatBytes(totalBytes)}</span>
          </div>
        </div>
      </div>

      {/* Backup Name Input */}
      <div className="py-5">
        <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-cyan-400" />
          ตั้งชื่อชุดข้อมูลสำรอง (Backup Name):
        </label>
        <div className="relative">
          <input
            type="text"
            value={backupName}
            onChange={(e) => onBackupNameChange(e.target.value)}
            placeholder="เช่น Project_SourceCode_2026, Photo_Backup..."
            className="w-full px-4 py-3 bg-slate-950/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all font-medium"
          />
        </div>
      </div>

      {/* File List Table / Preview */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl overflow-hidden mb-6">
        <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800 text-xs font-semibold text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-cyan-400" />
            <span>เส้นทางไฟล์ / โครงสร้างโฟลเดอร์ ({files.length} รายการ)</span>
          </div>
          <span>ขนาดไฟล์</span>
        </div>

        <div className="divide-y divide-slate-800/50 max-h-[320px] overflow-y-auto">
          {displayedFiles.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between px-4 py-2.5 text-xs hover:bg-slate-900/40 transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-3">
                <FileText className="w-4 h-4 text-slate-500 shrink-0 group-hover:text-cyan-400 transition-colors" />
                <span className="font-mono text-slate-200 truncate" title={item.relativePath}>
                  {item.relativePath}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-slate-400 font-medium">{formatBytes(item.size)}</span>
                <button
                  onClick={() => onRemoveFile(item.id)}
                  className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                  title="ลบไฟล์นี้ออก"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {files.length > 8 && (
          <div className="p-2.5 bg-slate-900/40 border-t border-slate-800 text-center">
            <button
              onClick={() => setShowAllFiles(!showAllFiles)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              {showAllFiles ? 'แสดงแบบย่อ' : `ดูทั้งหมดอีก +${files.length - 8} รายการ...`}
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          onClick={onClearAll}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition-colors"
        >
          ล้างรายการทั้งหมด
        </button>

        <button
          onClick={onStartUpload}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Send className="w-4 h-4" />
          เริ่มอัปโหลดสำรองข้อมูล ({formatBytes(totalBytes)})
        </button>
      </div>
    </div>
  );
};
