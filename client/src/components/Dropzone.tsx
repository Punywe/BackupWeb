import React, { useState, useRef } from 'react';
import { UploadCloud, FolderUp, FileUp, Sparkles, Loader2 } from 'lucide-react';
import { processDataTransfer, processInputFiles } from '../utils/fileSystem';
import type { StagedFile } from '../types';

interface DropzoneProps {
  onFilesStaged: (staged: { files: StagedFile[]; suggestedName: string; isFolder: boolean }) => void;
  disabled?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesStaged, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate if leaving the dropzone boundary
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    try {
      setIsProcessing(true);
      const result = await processDataTransfer(e.dataTransfer);
      if (result.files.length > 0) {
        onFilesStaged(result);
      }
    } catch (err) {
      console.error('Error processing dropped files:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const result = processInputFiles(e.target.files);
      onFilesStaged(result);
      e.target.value = '';
    }
  };

  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const result = processInputFiles(e.target.files);
      onFilesStaged(result);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
        disabled={disabled}
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
        onChange={handleFolderInputChange}
        disabled={disabled}
      />

      {/* Main Drag & Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative overflow-hidden group cursor-pointer transition-all duration-300 rounded-3xl border-2 border-dashed p-8 md:p-12 text-center flex flex-col items-center justify-center min-h-[280px] ${
          isDragging
            ? 'dropzone-active bg-cyan-950/30 border-cyan-400 ring-4 ring-cyan-400/20'
            : 'border-slate-800 hover:border-cyan-500/50 bg-slate-900/40 hover:bg-slate-900/70 backdrop-blur-xl'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        onClick={() => fileInputRef.current?.click()}
      >
        {/* Ambient Glow Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none" />

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-8 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-white">กำลังคำนวณและสแกนโครงสร้างโฟลเดอร์...</h4>
              <p className="text-xs text-slate-400 mt-1">กรุณารอสักครู่ ระบบกำลังรวบรวมไฟล์และคำนวณขนาดทั้งหมด</p>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center max-w-xl">
            {/* Animated Icon Container */}
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 mb-6 shadow-xl ${
                isDragging
                  ? 'bg-cyan-500 text-slate-950 scale-110 rotate-3 shadow-cyan-500/50'
                  : 'bg-gradient-to-b from-slate-800 to-slate-900 text-cyan-400 border border-slate-700/80 group-hover:border-cyan-500/40 group-hover:scale-105'
              }`}
            >
              <UploadCloud className="w-10 h-10 transition-transform duration-300" />
            </div>

            {/* Main Text */}
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
              {isDragging ? 'ปล่อยเพื่อวางไฟล์หรือโฟลเดอร์' : 'ลากไฟล์หรือโฟลเดอร์มาวางที่นี่'}
            </h3>
            <p className="text-sm text-slate-400 mb-6 max-w-md">
              รองรับการอัปโหลดไฟล์เดี่ยว หลายไฟล์ หรือลากทั้งโฟลเดอร์ที่มีโฟลเดอร์ย่อยหลายชั้น ระบบจะคำนวณขนาดและจัดเก็บโครงสร้างให้อัตโนมัติ
            </p>

            {/* Quick Action Buttons */}
            <div
              className="flex flex-wrap items-center justify-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold shadow-lg shadow-cyan-600/25 transition-all hover:scale-105"
              >
                <FileUp className="w-4 h-4" />
                เลือกไฟล์
              </button>

              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 text-slate-200 hover:text-white text-sm font-semibold shadow-md transition-all hover:scale-105"
              >
                <FolderUp className="w-4 h-4 text-cyan-400" />
                เลือกทั้งโฟลเดอร์
              </button>
            </div>

            {/* Bottom mini-feature pill */}
            <div className="mt-8 flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>ความเร็วระดับ Gigabit LAN • ไม่จำกัดจำนวนไฟล์ • แสดง % ความคืบหน้าแบบ Real-time</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
