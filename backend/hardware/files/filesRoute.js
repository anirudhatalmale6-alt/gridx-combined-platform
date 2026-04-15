const express = require('express');
const path = require('path');
const router = express.Router();
const { startMqttOta, getFirmwareInfo } = require('../../services/mqttHandler');

// Serve the firmware metadata JSON file


router.get('/firmware-info.json', (req, res) => {
  const filePath = path.join(__dirname, './Data/fw_latest.json'); // Adjust path as necessary
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error serving firmware-info.json:', err);
      res.status(500).send('Error serving firmware metadata file');
    }
  });
});

// Serve the firmware binary file
router.get('/firmware.bin', (req, res) => {
  const filePath = path.join(__dirname, './Data/firmware.bin'); // Adjust path as necessary
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error serving firmware.bin:', err);
      res.status(500).send(err);
    }
  });
});

// Get current firmware info
router.get('/ota/info', (req, res) => {
  const info = getFirmwareInfo();
  if (!info) {
    return res.status(500).json({ error: 'Failed to read firmware info' });
  }
  res.json(info);
});

// Trigger MQTT OTA for a specific device
// POST /files/ota/start { drn: "DRN_001", hash: "optional_override" }
router.post('/ota/start', (req, res) => {
  const { drn, hash } = req.body;
  if (!drn) {
    return res.status(400).json({ error: 'Missing drn parameter' });
  }

  try {
    const cmd = startMqttOta(drn, hash);
    res.json({ success: true, message: `MQTT OTA started for ${drn}`, command: cmd });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
