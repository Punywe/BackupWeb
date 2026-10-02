import React from 'react';
import { HardDrive, Files, Database, Wifi } from 'lucide-react';
import type { SystemInfo } from '../types';
import { formatBytes } from '../utils/formatters';

interface StorageStatsProps {
  systemInfo: SystemInfo | null;
  onOpenNetworkModal: () => void;
}

export const StorageStats: React.FC<StorageStatsProps> = ({ systemInfo, onOpenNetworkModal }) => {
  if (!systemInfo) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full">
      {/* Storage Used */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md flex items-center gap-3.5">
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
          <HardDrive className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-400 font-medium">ความจุที่ใช้ไป</p>
          <h4 className="text-base sm:text-lg font-bold text-white font-mono truncate">
            {formatBytes(systemInfo.totalStorageBytes)}
          </h4>
        </div>
      </div>

      {/* Total Files */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md flex items-center gap-3.5">
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
          <Files className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-400 font-medium">จำนวนไฟล์รวม</p>
          <h4 className="text-base sm:text-lg font-bold text-white font-mono truncate">
            {systemInfo.totalFiles.toLocaleString()} ไฟล์
          </h4>
        </div>
      </div>

      {/* Backup Batches */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md flex items-center gap-3.5">
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
          <Database className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-400 font-medium">ชุดข้อมูลสำรอง</p>
          <h4 className="text-base sm:text-lg font-bold text-white font-mono truncate">
            {systemInfo.totalBackups} ชุด
          </h4>
        </div>
      </div>

      {/* Gateway LAN Access */}
      <div 
        onClick={onOpenNetworkModal}
        className="bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl p-4 backdrop-blur-md flex items-center gap-3.5 cursor-pointer transition-all group"
      >
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
          <Wifi className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-400 font-medium">LAN Gateway IP</p>
          <h4 className="text-xs sm:text-sm font-bold text-cyan-400 font-mono truncate group-hover:underline">
            {systemInfo.lanIps[0] || '127.0.0.1'}
          </h4>
        </div>
      </div>
    </div>
  );
};
