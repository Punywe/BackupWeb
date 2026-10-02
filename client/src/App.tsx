import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Navbar } from './components/Navbar';
import { Dropzone } from './components/Dropzone';
import { UploadQueue } from './components/UploadQueue';
import { UploadProgressModal } from './components/UploadProgressModal';
import { BackupList } from './components/BackupList';
import { BackupTreeModal } from './components/BackupTreeModal';
import { NetworkInfoModal } from './components/NetworkInfoModal';
import { StorageStats } from './components/StorageStats';
import type { StagedFile, BackupSession, SystemInfo, UploadProgressState } from './types';

export const App: React.FC = () => {
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [backupName, setBackupName] = useState('');
  const [isFolder, setIsFolder] = useState(false);
  const [backups, setBackups] = useState<BackupSession[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [selectedBackupIdForTree, setSelectedBackupIdForTree] = useState<string | null>(null);

  // Upload Progress State
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState>({
    isUploading: false,
    loaded: 0,
    total: 0,
    percentage: 0,
    speed: 0,
    estimatedSecondsRemaining: 0,
    statusText: '',
    backupName: '',
  });

  const speedTrackerRef = useRef<{
    lastTime: number;
    lastLoaded: number;
    speeds: number[];
  }>({
    lastTime: 0,
    lastLoaded: 0,
    speeds: [],
  });

  // Fetch backups and system info
  const fetchSystemInfo = async () => {
    try {
      const res = await axios.get('/api/system/info');
      if (res.data.success) {
        setSystemInfo(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch system info:', err);
    }
  };

  const fetchBackups = async () => {
    try {
      setLoadingBackups(true);
      const res = await axios.get('/api/backups');
      if (res.data.success) {
        setBackups(res.data.backups);
      }
    } catch (err) {
      console.error('Failed to fetch backups:', err);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchBackups(), fetchSystemInfo()]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    handleRefreshAll();
  }, []);

  // Staging handlers
  const handleFilesStaged = (staged: {
    files: StagedFile[];
    suggestedName: string;
    isFolder: boolean;
  }) => {
    setStagedFiles(staged.files);
    setBackupName(staged.suggestedName);
    setIsFolder(staged.isFolder);
  };

  const handleRemoveStagedFile = (id: string) => {
    setStagedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleClearStaging = () => {
    setStagedFiles([]);
    setBackupName('');
    setIsFolder(false);
  };

  // Upload execution handler
  const handleStartUpload = async () => {
    if (stagedFiles.length === 0) return;

    const totalBytes = stagedFiles.reduce((acc, f) => acc + f.size, 0);
    const finalBackupName = backupName.trim() || `Backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;

    // Initialize progress tracking
    speedTrackerRef.current = {
      lastTime: Date.now(),
      lastLoaded: 0,
      speeds: [],
    };

    setUploadProgress({
      isUploading: true,
      loaded: 0,
      total: totalBytes,
      percentage: 0,
      speed: 0,
      estimatedSecondsRemaining: 0,
      statusText: 'กำลังเริ่มส่งข้อมูล...',
      backupName: finalBackupName,
    });

    const formData = new FormData();
    formData.append('backupName', finalBackupName);
    formData.append('isFolder', String(isFolder));
    formData.append('folderName', backupName);

    const relativePaths: string[] = [];
    stagedFiles.forEach(sf => {
      formData.append('files', sf.file);
      relativePaths.push(sf.relativePath);
    });
    formData.append('paths', JSON.stringify(relativePaths));

    try {
      await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const loaded = progressEvent.loaded;
          const total = progressEvent.total || totalBytes;
          const percentage = Math.min(99, Math.round((loaded * 100) / total));

          const currentTime = Date.now();
          const timeDelta = (currentTime - speedTrackerRef.current.lastTime) / 1000;

          let currentSpeed = 0;
          if (timeDelta > 0.3) {
            const bytesDelta = loaded - speedTrackerRef.current.lastLoaded;
            const instSpeed = bytesDelta / timeDelta;

            // Rolling average of last 5 samples
            speedTrackerRef.current.speeds.push(instSpeed);
            if (speedTrackerRef.current.speeds.length > 5) {
              speedTrackerRef.current.speeds.shift();
            }

            const avgSpeed =
              speedTrackerRef.current.speeds.reduce((a, b) => a + b, 0) /
              speedTrackerRef.current.speeds.length;

            currentSpeed = avgSpeed;
            speedTrackerRef.current.lastTime = currentTime;
            speedTrackerRef.current.lastLoaded = loaded;
          } else {
            currentSpeed =
              speedTrackerRef.current.speeds.length > 0
                ? speedTrackerRef.current.speeds[speedTrackerRef.current.speeds.length - 1]
                : 0;
          }

          const remainingBytes = Math.max(0, total - loaded);
          const eta = currentSpeed > 0 ? remainingBytes / currentSpeed : 0;

          setUploadProgress(prev => ({
            ...prev,
            loaded,
            total,
            percentage,
            speed: currentSpeed,
            estimatedSecondsRemaining: eta,
            statusText: percentage >= 98 ? 'กำลังบันทึกลงดิสก์เซิร์ฟเวอร์...' : 'กำลังอัปโหลด...',
          }));
        },
      });

      // Complete
      setUploadProgress(prev => ({
        ...prev,
        isUploading: false,
        percentage: 100,
        loaded: totalBytes,
        speed: 0,
        estimatedSecondsRemaining: 0,
        statusText: 'สำรองข้อมูลสำเร็จเรียบร้อยแล้ว!',
      }));

      // Refresh list
      await Promise.all([fetchBackups(), fetchSystemInfo()]);
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert(`การอัปโหลดล้มเหลว: ${err?.response?.data?.message || err.message}`);
      setUploadProgress(prev => ({ ...prev, isUploading: false }));
    }
  };

  const handleDownloadZip = (id: string, name: string) => {
    const downloadUrl = `/api/backups/${id}/download`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${name}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeleteBackup = async (id: string) => {
    try {
      const res = await axios.delete(`/api/backups/${id}`);
      if (res.data.success) {
        await Promise.all([fetchBackups(), fetchSystemInfo()]);
      }
    } catch (err) {
      console.error('Failed to delete backup:', err);
      alert('เกิดข้อผิดพลาดในการลบข้อมูลสำรอง');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation */}
      <Navbar
        systemInfo={systemInfo}
        onOpenNetworkModal={() => setIsNetworkModalOpen(true)}
        onRefresh={handleRefreshAll}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 p-6 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4">
              ✨ LAN Backup Transfer Gateway
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3 leading-tight">
              ส่งผ่านและสำรองข้อมูลไฟล์หรือโฟลเดอร์ <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                ผ่านเครือข่ายวง LAN ได้อย่างรวดเร็วและปลอดภัย
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl">
              เพียงแค่ลากไฟล์หรือโฟลเดอร์มาวาง ระบบจะคำนวณขนาดและจำลองโครงสร้างโฟลเดอร์ไว้บนเซิร์ฟเวอร์ พร้อมหลอดบอกความคืบหน้าแบบ Real-time
            </p>
          </div>
        </div>

        {/* Dashboard Storage Stats */}
        <StorageStats
          systemInfo={systemInfo}
          onOpenNetworkModal={() => setIsNetworkModalOpen(true)}
        />

        {/* Upload Staging Zone */}
        {stagedFiles.length > 0 ? (
          <UploadQueue
            files={stagedFiles}
            backupName={backupName}
            isFolder={isFolder}
            onBackupNameChange={setBackupName}
            onRemoveFile={handleRemoveStagedFile}
            onClearAll={handleClearStaging}
            onStartUpload={handleStartUpload}
          />
        ) : (
          <Dropzone
            onFilesStaged={handleFilesStaged}
            disabled={uploadProgress.isUploading}
          />
        )}

        {/* Stored Backups List Explorer */}
        <BackupList
          backups={backups}
          loading={loadingBackups}
          onExploreBackup={(id) => setSelectedBackupIdForTree(id)}
          onDownloadZip={handleDownloadZip}
          onDeleteBackup={handleDeleteBackup}
        />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <p>LAN Backup Gateway • รันบน Docker & วงแลนเฉพาะบุคคลเพื่อความปลอดภัยสูงสุด</p>
      </footer>

      {/* Progress Modal */}
      <UploadProgressModal
        progress={uploadProgress}
        onDone={() => {
          handleClearStaging();
          setUploadProgress(prev => ({ ...prev, percentage: 0 }));
        }}
      />

      {/* Network Info & QR Code Modal */}
      <NetworkInfoModal
        isOpen={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
        systemInfo={systemInfo}
      />

      {/* Backup File Tree Modal */}
      <BackupTreeModal
        backupId={selectedBackupIdForTree}
        onClose={() => setSelectedBackupIdForTree(null)}
        onDownloadZip={handleDownloadZip}
        onDeleteBackup={handleDeleteBackup}
      />
    </div>
  );
};

export default App;
