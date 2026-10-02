import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import archiver from 'archiver';
import dotenv from 'dotenv';
import { getLocalIpAddresses } from './utils/network.js';
import { getBackupTree, getDirectoryStats, BackupSession } from './utils/storage.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const HOST = '0.0.0.0';

// Storage directory
const STORAGE_DIR = process.env.STORAGE_DIR 
  ? path.resolve(process.env.STORAGE_DIR) 
  : path.resolve(process.cwd(), 'storage');

// Ensure base storage directory exists
fs.ensureDirSync(STORAGE_DIR);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Temporary upload folder for multer
const TEMP_DIR = path.join(STORAGE_DIR, '.temp');
fs.ensureDirSync(TEMP_DIR);

const upload = multer({
  dest: TEMP_DIR,
  limits: {
    // 50GB file upload limit per request
    fileSize: 50 * 1024 * 1024 * 1024,
    files: 5000,
  }
});

// Serve frontend build if exists (Production mode)
const CLIENT_DIST = path.resolve(process.cwd(), '../client/dist');
const CLIENT_DIST_DOCKER = path.resolve(process.cwd(), 'client-dist');

let clientDistPath = '';
if (fs.existsSync(CLIENT_DIST)) {
  clientDistPath = CLIENT_DIST;
} else if (fs.existsSync(CLIENT_DIST_DOCKER)) {
  clientDistPath = CLIENT_DIST_DOCKER;
}

if (clientDistPath) {
  app.use(express.static(clientDistPath));
}

// ==================== API ROUTES ====================

/**
 * GET /api/system/info
 * Returns server network information and disk usage stats
 */
app.get('/api/system/info', async (req, res) => {
  try {
    const ipAddresses = getLocalIpAddresses();
    const stats = await getDirectoryStats(STORAGE_DIR);
    
    // Count backup folders
    const entries = await fs.readdir(STORAGE_DIR, { withFileTypes: true });
    const backupFolders = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));

    res.json({
      success: true,
      port: PORT,
      lanIps: ipAddresses,
      primaryLanUrl: ipAddresses.length > 0 ? `http://${ipAddresses[0]}:${PORT}` : `http://localhost:${PORT}`,
      storageDir: STORAGE_DIR,
      totalBackups: backupFolders.length,
      totalStorageBytes: stats.size,
      totalFiles: stats.count,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/backups
 * Returns list of all stored backups with details
 */
app.get('/api/backups', async (req, res) => {
  try {
    const entries = await fs.readdir(STORAGE_DIR, { withFileTypes: true });
    const backupFolders = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));

    const backups: BackupSession[] = [];

    for (const folder of backupFolders) {
      const folderPath = path.join(STORAGE_DIR, folder.name);
      const metaPath = path.join(folderPath, '.meta.json');
      
      let meta: any = null;
      if (await fs.pathExists(metaPath)) {
        try {
          meta = await fs.readJson(metaPath);
        } catch (e) {
          // ignore corrupted meta
        }
      }

      const stats = await getDirectoryStats(folderPath);
      const folderStat = await fs.stat(folderPath);

      // Get brief top-level files summary for preview
      const subEntries = await fs.readdir(folderPath);
      const visibleFiles = subEntries.filter(f => f !== '.meta.json').slice(0, 5);

      backups.push({
        id: folder.name,
        name: meta?.name || folder.name,
        createdAt: meta?.createdAt || folderStat.birthtime.toISOString(),
        totalSize: stats.size,
        totalFiles: stats.count,
        isFolder: meta?.isFolder ?? (stats.count > 1 || visibleFiles.length > 1),
        folderName: meta?.folderName,
        filesSummary: visibleFiles,
      });
    }

    // Sort newest first
    backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, backups });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/backups/:id
 * Get details & file tree for a backup
 */
app.get('/api/backups/:id', async (req, res) => {
  try {
    const backupId = req.params.id;
    // Security check against directory traversal
    if (backupId.includes('..') || backupId.includes('/') || backupId.includes('\\')) {
      return res.status(400).json({ success: false, message: 'Invalid backup ID' });
    }

    const backupDir = path.join(STORAGE_DIR, backupId);
    if (!await fs.pathExists(backupDir)) {
      return res.status(404).json({ success: false, message: 'Backup not found' });
    }

    const metaPath = path.join(backupDir, '.meta.json');
    let meta: any = {};
    if (await fs.pathExists(metaPath)) {
      meta = await fs.readJson(metaPath);
    }

    const stats = await getDirectoryStats(backupDir);
    const tree = await getBackupTree(backupDir);

    res.json({
      success: true,
      backup: {
        id: backupId,
        name: meta.name || backupId,
        createdAt: meta.createdAt,
        totalSize: stats.size,
        totalFiles: stats.count,
        tree,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/upload
 * Handle file and folder uploads
 */
app.post('/api/upload', upload.array('files'), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files provided' });
    }

    const backupName = req.body.backupName ? String(req.body.backupName).trim() : '';
    const isFolder = req.body.isFolder === 'true' || req.body.isFolder === true;
    const folderName = req.body.folderName ? String(req.body.folderName).trim() : '';
    
    // Parse relative paths if provided
    let relativePaths: string[] = [];
    if (req.body.paths) {
      try {
        if (typeof req.body.paths === 'string') {
          relativePaths = JSON.parse(req.body.paths);
        } else if (Array.isArray(req.body.paths)) {
          relativePaths = req.body.paths;
        }
      } catch (e) {
        // Fallback to empty if not JSON
        relativePaths = [];
      }
    }

    // Generate or use existing backup ID
    const backupId = req.body.backupId && !req.body.backupId.includes('..') 
      ? req.body.backupId 
      : `backup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const targetBackupDir = path.join(STORAGE_DIR, backupId);
    await fs.ensureDir(targetBackupDir);

    let totalUploadedBytes = 0;

    // Process each uploaded file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let relPath = relativePaths[i] || file.originalname;

      // Clean path to prevent directory traversal
      relPath = relPath.replace(/^(\.\.[\/\\])+/, '').replace(/[\\]/g, '/');
      while (relPath.startsWith('/')) {
        relPath = relPath.substring(1);
      }

      const destinationPath = path.join(targetBackupDir, relPath);
      await fs.ensureDir(path.dirname(destinationPath));
      await fs.move(file.path, destinationPath, { overwrite: true });

      totalUploadedBytes += file.size;
    }

    // Save or update .meta.json
    const metaPath = path.join(targetBackupDir, '.meta.json');
    let meta: any = {
      id: backupId,
      name: backupName || (isFolder ? folderName : files[0].originalname),
      createdAt: new Date().toISOString(),
      isFolder,
      folderName,
      lastUpdated: new Date().toISOString()
    };

    if (await fs.pathExists(metaPath)) {
      const existingMeta = await fs.readJson(metaPath);
      meta = { ...existingMeta, lastUpdated: new Date().toISOString() };
    }

    await fs.writeJson(metaPath, meta, { spaces: 2 });

    const stats = await getDirectoryStats(targetBackupDir);

    res.json({
      success: true,
      message: 'Upload completed successfully',
      backupId,
      backupName: meta.name,
      uploadedCount: files.length,
      totalFiles: stats.count,
      totalSize: stats.size,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/backups/:id/download
 * Download single file or entire folder as ZIP
 */
app.get('/api/backups/:id/download', async (req, res) => {
  try {
    const backupId = req.params.id;
    if (backupId.includes('..') || backupId.includes('/') || backupId.includes('\\')) {
      return res.status(400).json({ success: false, message: 'Invalid backup ID' });
    }

    const backupDir = path.join(STORAGE_DIR, backupId);
    if (!await fs.pathExists(backupDir)) {
      return res.status(404).json({ success: false, message: 'Backup not found' });
    }

    const fileSubPath = req.query.file ? String(req.query.file) : '';

    if (fileSubPath) {
      // Download single specific file
      const safeRelPath = path.normalize(fileSubPath).replace(/^(\.\.[\/\\])+/, '');
      const filePath = path.join(backupDir, safeRelPath);

      if (!await fs.pathExists(filePath) || (await fs.stat(filePath)).isDirectory()) {
        return res.status(404).json({ success: false, message: 'File not found' });
      }

      const fileName = path.basename(filePath);
      res.download(filePath, fileName);
    } else {
      // Download whole backup directory as ZIP
      let backupName = backupId;
      const metaPath = path.join(backupDir, '.meta.json');
      if (await fs.pathExists(metaPath)) {
        const meta = await fs.readJson(metaPath);
        if (meta.name) backupName = meta.name.replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_');
      }

      const zipFilename = `${backupName}.zip`;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(zipFilename)}"`);

      const archive = archiver('zip', {
        zlib: { level: 6 } // Good compression balance
      });

      archive.on('error', (err) => {
        throw err;
      });

      archive.pipe(res);

      // Add backup directory content excluding .meta.json
      archive.glob('**/*', {
        cwd: backupDir,
        ignore: ['.meta.json']
      });

      await archive.finalize();
    }
  } catch (error: any) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

/**
 * DELETE /api/backups/:id
 * Delete a backup or a specific file inside it
 */
app.delete('/api/backups/:id', async (req, res) => {
  try {
    const backupId = req.params.id;
    if (backupId.includes('..') || backupId.includes('/') || backupId.includes('\\')) {
      return res.status(400).json({ success: false, message: 'Invalid backup ID' });
    }

    const backupDir = path.join(STORAGE_DIR, backupId);
    if (!await fs.pathExists(backupDir)) {
      return res.status(404).json({ success: false, message: 'Backup not found' });
    }

    const fileSubPath = req.query.file ? String(req.query.file) : '';

    if (fileSubPath) {
      // Delete single file
      const safeRelPath = path.normalize(fileSubPath).replace(/^(\.\.[\/\\])+/, '');
      const filePath = path.join(backupDir, safeRelPath);

      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
      }

      // Check if backup is now empty
      const stats = await getDirectoryStats(backupDir);
      if (stats.count === 0) {
        await fs.remove(backupDir);
        return res.json({ success: true, message: 'File and empty backup deleted', backupDeleted: true });
      }

      return res.json({ success: true, message: 'File deleted successfully', backupDeleted: false });
    } else {
      // Delete entire backup directory
      await fs.remove(backupDir);
      res.json({ success: true, message: 'Backup deleted successfully' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Fallback to client SPA index.html for unknown routes if client is served
if (clientDistPath) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Start Server
app.listen(PORT, HOST, () => {
  const ips = getLocalIpAddresses();
  console.log(`=================================================`);
  console.log(`🚀 Backup Gateway Server is running!`);
  console.log(`📡 Local Access:   http://localhost:${PORT}`);
  ips.forEach(ip => {
    console.log(`🌐 LAN Access:     http://${ip}:${PORT}`);
  });
  console.log(`💾 Storage Path:   ${STORAGE_DIR}`);
  console.log(`=================================================`);
});
