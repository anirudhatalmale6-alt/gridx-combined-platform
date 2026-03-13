const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Firmware storage directory
const FIRMWARE_DIR = path.join(__dirname, '..', 'firmware');
const FIRMWARE_BIN = path.join(FIRMWARE_DIR, 'firmware.bin');
const FIRMWARE_INFO = path.join(FIRMWARE_DIR, 'firmware-info.json');

// Ensure firmware directory exists
if (!fs.existsSync(FIRMWARE_DIR)) {
  fs.mkdirSync(FIRMWARE_DIR, { recursive: true });
  console.log('Created firmware directory:', FIRMWARE_DIR);
}

// Multer configuration for firmware uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, FIRMWARE_DIR),
  filename: (req, file, cb) => cb(null, 'firmware.bin'),
});

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB max (ESP32 firmware)
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.bin')) {
      cb(null, true);
    } else {
      cb(new Error('Only .bin firmware files are accepted'));
    }
  },
});

// OTA API key authentication middleware
const otaAuth = (req, res, next) => {
  const apiKey = process.env.OTA_API_KEY;
  if (!apiKey) {
    console.warn('OTA_API_KEY not set - OTA upload endpoint disabled');
    return res.status(503).json({ error: 'OTA uploads not configured' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== apiKey) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
};

// ─── GET /files/firmware-info.json ───────────────────────────
// Serves the latest firmware metadata (version, URL, size, hash)
// This is what the ESP32 polls periodically over GSM HTTP
router.get('/firmware-info.json', (req, res) => {
  if (!fs.existsSync(FIRMWARE_INFO)) {
    return res.status(404).json({ error: 'No firmware available' });
  }
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(FIRMWARE_INFO);
});

// ─── GET /files/firmware.bin ─────────────────────────────────
// Serves the firmware binary (supports HTTP Range requests for
// chunked downloads by the SIM800 modem)
router.get('/firmware.bin', (req, res) => {
  if (!fs.existsSync(FIRMWARE_BIN)) {
    return res.status(404).json({ error: 'No firmware binary available' });
  }

  const stat = fs.statSync(FIRMWARE_BIN);
  const fileSize = stat.size;

  // Handle Range requests (required for SIM800 chunked downloads)
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'application/octet-stream',
    });

    const stream = fs.createReadStream(FIRMWARE_BIN, { start, end });
    stream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'application/octet-stream',
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(FIRMWARE_BIN).pipe(res);
  }
});

// ─── POST /api/ota/upload ────────────────────────────────────
// Accepts firmware upload from GitHub Actions CI/CD pipeline
// Protected by OTA_API_KEY
router.post('/upload', otaAuth, upload.single('firmware'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No firmware file provided' });
  }

  const { version, hash, size } = req.body;
  if (!version || !hash) {
    // Remove uploaded file if metadata is incomplete
    fs.unlinkSync(FIRMWARE_BIN);
    return res.status(400).json({ error: 'Missing version or hash' });
  }

  // Construct the firmware download URL
  const baseUrl = process.env.FIRMWARE_BASE_URL || `http://${req.headers.host}`;
  const firmwareUrl = `${baseUrl}/files/firmware.bin`;

  // Generate firmware-info.json
  const info = {
    version,
    url: firmwareUrl,
    size: parseInt(size) || req.file.size,
    hash,
  };

  fs.writeFileSync(FIRMWARE_INFO, JSON.stringify(info, null, 2));

  console.log(`OTA: New firmware uploaded - v${version} (${info.size} bytes)`);
  console.log(`OTA: Hash: ${hash}`);
  console.log(`OTA: URL: ${firmwareUrl}`);

  res.json({
    success: true,
    message: `Firmware v${version} uploaded successfully`,
    info,
  });
});

// ─── GET /api/ota/status ─────────────────────────────────────
// Returns current firmware status
router.get('/status', (req, res) => {
  if (!fs.existsSync(FIRMWARE_INFO)) {
    return res.json({ available: false, message: 'No firmware uploaded yet' });
  }

  try {
    const info = JSON.parse(fs.readFileSync(FIRMWARE_INFO, 'utf8'));
    const stat = fs.statSync(FIRMWARE_BIN);
    res.json({
      available: true,
      version: info.version,
      size: info.size,
      hash: info.hash,
      url: info.url,
      uploaded_at: stat.mtime,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read firmware info' });
  }
});

module.exports = router;
