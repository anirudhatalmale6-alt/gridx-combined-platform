const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../admin/authMiddllware');

// All routes require admin auth
router.use(authenticateToken);

// GET /status/:drn - Get current config status for a meter
router.get('/status/:drn', (req, res) => {
  const { drn } = req.params;
  const queries = {
    mainsControl: `SELECT state, processed, date_time FROM MeterMainsControlTable WHERE DRN = ? ORDER BY id DESC LIMIT 1`,
    heaterControl: `SELECT state, processed, date_time FROM MeterHeaterControlTable WHERE DRN = ? ORDER BY id DESC LIMIT 1`,
    mainsState: `SELECT state, processed, date_time FROM MeterMainsStateTable WHERE DRN = ? ORDER BY id DESC LIMIT 1`,
    heaterState: `SELECT state, processed, date_time FROM MeterHeaterStateTable WHERE DRN = ? ORDER BY id DESC LIMIT 1`,
    smsResponse: `SELECT sms_response_number, sms_response_enabled, processed, date_time FROM MeterSMSResponseNumberTable WHERE DRN = ? ORDER BY id DESC LIMIT 1`,
    sleepMode: `SELECT sleep_mode_enabled, processed, date_time FROM MeterRemoteCommandFlags WHERE DRN = ? ORDER BY id DESC LIMIT 1`,
    pendingToken: `SELECT token_ID, processed, date_time FROM SendSTSToken WHERE DRN = ? ORDER BY ID DESC LIMIT 1`,
  };

  const result = {};
  const keys = Object.keys(queries);
  let completed = 0;

  keys.forEach((key) => {
    db.query(queries[key], [drn], (err, rows) => {
      result[key] = err ? null : (rows && rows.length ? rows[0] : null);
      completed++;
      if (completed === keys.length) {
        res.json({ success: true, data: result });
      }
    });
  });
});

// POST /auth-number/:drn - Add authorized number
router.post('/auth-number/:drn', (req, res) => {
  const { drn } = req.params;
  const { number } = req.body;
  if (!number) return res.status(400).json({ error: 'Number is required' });

  const sql = `INSERT INTO MeterAuthNumberQueue (DRN, authorized_number, processed, user, reason) VALUES (?, ?, 0, 'WebUI', 'Web UI')`;
  db.query(sql, [drn, number], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Authorized number command queued' });
  });
});

// POST /sleep/:drn - Set sleep mode
router.post('/sleep/:drn', (req, res) => {
  const { drn } = req.params;
  const { sleep_mode_enabled } = req.body;

  const sql = `INSERT INTO MeterRemoteCommandFlags (DRN, user, sleep_mode_enabled, processed, reason, date_time) VALUES (?, 'WebUI', ?, 0, 'Web UI', NOW())`;
  db.query(sql, [drn, sleep_mode_enabled ? 1 : 0], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Sleep mode command queued' });
  });
});

// POST /base-url/:drn - Update base URL
router.post('/base-url/:drn', (req, res) => {
  const { drn } = req.params;
  const { base_url } = req.body;
  if (!base_url) return res.status(400).json({ error: 'URL is required' });

  // Store in a general command queue - the meter will pick it up
  const sql = `INSERT INTO MeterRemoteCommandFlags (DRN, user, sleep_mode_enabled, processed, reason, date_time) VALUES (?, 'WebUI', 0, 0, ?, NOW())`;
  db.query(sql, [drn, `base_url:${base_url}`], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Base URL update command queued' });
  });
});

module.exports = router;
