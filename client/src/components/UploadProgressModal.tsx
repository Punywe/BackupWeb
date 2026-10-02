import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { UploadCloud, CheckCircle2, Zap, Clock, HardDrive, Sparkles } from 'lucide-react';
import type { UploadProgressState } from '../types';
import { formatBytes, formatSpeed, formatETA } from '../utils/formatters';

interface UploadProgressModalProps {
  progress: UploadProgressState;
  onDone: () => void;
}

export const UploadProgressModal: React.FC<UploadProgressModalProps> = ({ progress, onDone }) => {
  const isFinished = progress.percentage === 100 && !progress.isUploading;

  useEffect(() => {
    if (isFinished) {
      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isFinished]);

  if (!progress.isUploading && !isFinished) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Status Icon */}
          <div className="mb-6">
            {isFinished ? (
              <div className="w-20 h-20 rounded-3xl bg-green-500/10 border border-green-500/30 text-green-400 flex items-center justify-center shadow-lg shadow-green-500/20 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 glow-box">
                <UploadCloud className="w-10 h-10 animate-pulse" />
              </div>
            )}
          </div>

          {/* Heading */}
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
            {isFinished ? 'สำรองข้อมูลสำเร็จเรียบร้อย!' : 'กำลังอัปโหลดข้อมูล...'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mb-6 truncate max-w-sm">
            {progress.backupName || 'ชุดข้อมูลสำรอง'}
          </p>

          {/* Large Percentage Display */}
          <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent mb-4">
            {progress.percentage}%
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-950 rounded-full h-4 p-1 border border-slate-800 mb-6 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-200 shadow-lg shadow-cyan-500/50"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          {/* Metrics Grid */}
          <div className="w-full grid grid-cols-3 gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-950/70 border border-slate-800 rounded-2xl mb-6 text-xs">
            {/* Speed */}
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/60">
              <div className="flex items-center gap-1 text-slate-400 mb-1">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>ความเร็ว</span>
              </div>
              <span className="font-bold font-mono text-cyan-300">
                {isFinished ? 'สมบูรณ์' : formatSpeed(progress.speed)}
              </span>
            </div>

            {/* Transferred */}
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/60">
              <div className="flex items-center gap-1 text-slate-400 mb-1">
                <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                <span>ขนาดส่งแล้ว</span>
              </div>
              <span className="font-bold font-mono text-slate-200 truncate w-full text-center">
                {formatBytes(progress.loaded)} / {formatBytes(progress.total)}
              </span>
            </div>

            {/* Time Left */}
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/60">
              <div className="flex items-center gap-1 text-slate-400 mb-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>เวลาที่เหลือ</span>
              </div>
              <span className="font-bold font-mono text-indigo-300">
                {isFinished ? '0s' : formatETA(progress.estimatedSecondsRemaining)}
              </span>
            </div>
          </div>

          {/* Done / Close Button */}
          {isFinished && (
            <button
              onClick={onDone}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-sm shadow-xl shadow-green-600/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              ดูรายการข้อมูลสำรองทั้งหมด
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
