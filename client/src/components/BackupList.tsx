import React, { useState } from 'react';
import { 
  FolderArchive, 
  Layers, 
  Download, 
  Trash2, 
  Search, 
  FolderSearch, 
  ExternalLink,
  Calendar,
  FileCheck2,
  HardDrive
} from 'lucide-react';
import type { BackupSession } from '../types';
import { formatBytes, formatDate } from '../utils/formatters';

interface BackupListProps {
  backups: BackupSession[];
  loading: boolean;
  onExploreBackup: (id: string) => void;
  onDownloadZip: (id: string, name: string) => void;
  onDeleteBackup: (id: string) => void;
}

export const BackupList: React.FC<BackupListProps> = ({
  backups,
  loading,
  onExploreBackup,
  onDownloadZip,
  onDeleteBackup,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBackups = backups.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.folderName && b.folderName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-xl">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            ข้อมูลสำรองบนเซิร์ฟเวอร์
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 text-xs border border-cyan-500/30 font-semibold">
              {backups.length} ชุด
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            รายการไฟล์และโฟลเดอร์ทั้งหมดที่ถูกส่งมาเก็บไว้ในเซิร์ฟเวอร์
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อโฟลเดอร์หรือไฟล์..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
          />
        </div>
      </div>

      {/* Backup Items List */}
      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            กำลังโหลดข้อมูลสำรอง...
          </div>
        ) : filteredBackups.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-slate-500 flex items-center justify-center mb-4">
              <FolderSearch className="w-8 h-8" />
            </div>
            <h4 className="text-base font-semibold text-slate-300 mb-1">
              {searchQuery ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีข้อมูลสำรองบนระบบ'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm">
              {searchQuery ? 'ลองพิมพ์ค้นหาด้วยคำอื่น' : 'เริ่มลากไฟล์หรือโฟลเดอร์เพื่อสำรองข้อมูลผ่านวงแลนได้ทันทีจากด้านบน'}
            </p>
          </div>
        ) : (
          filteredBackups.map((backup) => (
            <div
              key={backup.id}
              className="group relative bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 transition-all duration-200 shadow-md hover:shadow-cyan-500/5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left info */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-950/80 to-blue-950/80 border border-cyan-500/20 text-cyan-400 shrink-0 mt-0.5">
                    {backup.isFolder ? <FolderArchive className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-base font-bold text-white truncate max-w-md group-hover:text-cyan-300 transition-colors">
                        {backup.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700/60">
                        {backup.isFolder ? 'Folder' : 'Files'}
                      </span>
                    </div>

                    {/* Metadata chips */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-mono text-cyan-300 font-semibold">
                        <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                        {formatBytes(backup.totalSize)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
                        {backup.totalFiles} ไฟล์
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(backup.createdAt)}
                      </span>
                    </div>

                    {/* Files Preview chips if available */}
                    {backup.filesSummary && backup.filesSummary.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {backup.filesSummary.map((fname, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800/80 text-[11px] font-mono text-slate-400 truncate max-w-[200px]"
                          >
                            {fname}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                  <button
                    onClick={() => onExploreBackup(backup.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/40 text-slate-200 hover:text-white text-xs font-semibold transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    ดูไฟล์ข้างใน
                  </button>

                  <button
                    onClick={() => onDownloadZip(backup.id, backup.name)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all hover:scale-105"
                  >
                    <Download className="w-3.5 h-3.5" />
                    โหลด .ZIP
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`คุณต้องการลบชุดข้อมูล "${backup.name}" หรือไม่?`)) {
                        onDeleteBackup(backup.id);
                      }
                    }}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-500/30 transition-colors"
                    title="ลบข้อมูลสำรอง"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
