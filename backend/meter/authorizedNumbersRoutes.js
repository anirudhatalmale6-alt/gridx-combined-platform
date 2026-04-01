/**
 * Authorized Numbers Routes
 * CRUD for meter authorized phone numbers (stored in MeterAuthorizedNumbers table)
 */
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../admin/authMiddllware');

function queryAll(sql, params) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err); else resolve(results);
    });
  });
}

function execute(sql, params) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err); else resolve(result);
    });
  });
}

// GET /:drn - list authorized numbers for a meter
router.get('/:drn', authenticateToken, async (req, res) => {
  try {
    const rows = await queryAll(
      'SELECT id, drn, phone_number, updated_at FROM MeterAuthorizedNumbers WHERE drn = ? ORDER BY id',
      [req.params.drn]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:drn - add an authorized number
router.post('/:drn', authenticateToken, async (req, res) => {
  try {
    const { phone_number } = req.body;
    if (!phone_number) return res.status(400).json({ error: 'phone_number is required' });
    await execute(
      'INSERT INTO MeterAuthorizedNumbers (drn, phone_number) VALUES (?, ?) ON DUPLICATE KEY UPDATE updated_at = NOW()',
      [req.params.drn, phone_number]
    );
    res.json({ message: 'Authorized number added', drn: req.params.drn, phone_number });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:drn/:id - remove an authorized number
router.delete('/:drn/:id', authenticateToken, async (req, res) => {
  try {
    await execute('DELETE FROM MeterAuthorizedNumbers WHERE drn = ? AND id = ?', [req.params.drn, req.params.id]);
    res.json({ message: 'Authorized number removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
