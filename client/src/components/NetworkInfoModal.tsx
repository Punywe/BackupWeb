import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Wifi, Globe, Smartphone } from 'lucide-react';
import type { SystemInfo } from '../types';

interface NetworkInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemInfo: SystemInfo | null;
}

export const NetworkInfoModal: React.FC<NetworkInfoModalProps> = ({
  isOpen,
  onClose,
  systemInfo,
}) => {
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  if (!isOpen) return null;

  // Determine actual current window origin or backend LAN IP
  const currentOrigin = window.location.origin;
  const lanIps = systemInfo?.lanIps || [];

  // Generate accessible LAN URLs
  const lanUrls = lanIps.map(ip => {
    // If running in Vite dev mode on port 3000, access client at port 3000
    // If in production/docker, access at port 5000 or window.location.port
    const currentPort = window.location.port ? `:${window.location.port}` : '';
    return `${window.location.protocol}//${ip}${currentPort || (systemInfo?.port ? `:${systemInfo.port}` : '')}`;
  });

  // If no LAN IP detected, add currentOrigin
  if (lanUrls.length === 0) {
    lanUrls.push(currentOrigin);
  }

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedIp(url);
    setTimeout(() => setCopiedIp(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">การเชื่อมต่อผ่านวง LAN เดียวกัน</h3>
            <p className="text-xs text-slate-400">เข้าใช้งานหน้าเว็บนี้จากอุปกรณ์อื่นในเครือข่าย WiFi เดียวกัน</p>
          </div>
        </div>

        {/* QR Code & Active URL */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-950/70 border border-slate-800/80 rounded-xl mb-5">
          <div className="p-3 bg-white rounded-xl shadow-inner mb-3">
            <QRCodeSVG value={lanUrls[0]} size={160} level="M" />
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-2">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            สแกนด้วยกล้องมือถือเพื่อเข้าใช้งานทันที
          </p>
          <div className="flex items-center gap-2 w-full max-w-sm mt-1">
            <input
              type="text"
              readOnly
              value={lanUrls[0]}
              className="w-full px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg text-cyan-300 focus:outline-none"
            />
            <button
              onClick={() => handleCopy(lanUrls[0])}
              className="flex items-center gap-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              {copiedIp === lanUrls[0] ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  คัดลอกแล้ว
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  คัดลอก
                </>
              )}
            </button>
          </div>
        </div>

        {/* Multiple LAN IP addresses if available */}
        {lanUrls.length > 1 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-semibold text-slate-400">ที่อยู่ IP อื่นๆ ในเครื่องนี้:</p>
            {lanUrls.slice(1).map((url, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                <span className="font-mono text-slate-300 truncate mr-2">{url}</span>
                <button
                  onClick={() => handleCopy(url)}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1"
                >
                  {copiedIp === url ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copiedIp === url ? 'คัดลอกแล้ว' : 'คัดลอก'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Notice Info Box */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-xs text-blue-200">
          <Globe className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-blue-100">คำแนะนำ:</span> อุปกรณ์ที่จะเข้ามาอัปโหลดไฟล์ต้องเชื่อมต่อกับ WiFi หรือสาย LAN วงเดียวกันกับเครื่องเซิร์ฟเวอร์นี้
          </div>
        </div>
      </div>
    </div>
  );
};
