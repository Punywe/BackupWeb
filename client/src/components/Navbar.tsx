import React from 'react';
import { ShieldCheck, Wifi, QrCode, RefreshCw, HardDrive } from 'lucide-react';
import type { SystemInfo } from '../types';
import { formatBytes } from '../utils/formatters';

interface NavbarProps {
  systemInfo: SystemInfo | null;
  onOpenNetworkModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  systemInfo,
  onOpenNetworkModal,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  LAN Backup Gateway
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-950/90 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-400">ระบบทางผ่านสำรองข้อมูลไฟล์และโฟลเดอร์ในวงแลน</p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Storage stat badge */}
            {systemInfo && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                <span>ใช้ไป: <strong className="text-white font-medium">{formatBytes(systemInfo.totalStorageBytes)}</strong></span>
                <span className="text-slate-600">|</span>
                <span><strong className="text-white font-medium">{systemInfo.totalBackups}</strong> รายการ</span>
              </div>
            )}

            {/* LAN Connect Button */}
            <button
              onClick={onOpenNetworkModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-950/60 to-blue-950/60 hover:from-cyan-900/60 hover:to-blue-900/60 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 text-xs sm:text-sm font-medium transition-all shadow-sm"
              title="ดูไอพีและ QR Code สำหรับเชื่อมต่อผ่านมือถือหรืออุปกรณ์อื่นในวงแลน"
            >
              <Wifi className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">การเชื่อมต่อ LAN</span>
              <QrCode className="w-3.5 h-3.5 opacity-80" />
            </button>

            {/* Refresh button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all disabled:opacity-50"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
