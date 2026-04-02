var connection = require('../config/db');

// ═══════════════════════════════════════════════════════════════════════════
// AUTO-MIGRATE: Create tables if they don't exist
// ═══════════════════════════════════════════════════════════════════════════

connection.query(
  "CREATE TABLE IF NOT EXISTS MeterAuthorizedNumbers (" +
  "  id INT AUTO_INCREMENT PRIMARY KEY," +
  "  drn VARCHAR(50) NOT NULL," +
  "  phone_number VARCHAR(30) NOT NULL," +
  "  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
  "  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
  "  UNIQUE KEY unique_drn_phone (drn, phone_number)," +
  "  INDEX idx_drn (drn)," +
  "  INDEX idx_phone (phone_number)" +
  ")",
  function(err) {
    if (err && err.message.indexOf('already exists') === -1) {
      console.error('[AuthNumbers] MeterAuthorizedNumbers table error:', err.message);
    }
  }
);

connection.query(
  "CREATE TABLE IF NOT EXISTS AuthorizedNumberAuditLog (" +
  "  id INT AUTO_INCREMENT PRIMARY KEY," +
  "  drn VARCHAR(50) NOT NULL," +
  "  phone_number VARCHAR(30) NOT NULL," +
  "  action ENUM('ADD', 'REMOVE', 'SYNC') NOT NULL," +
  "  source ENUM('METER', 'ADMIN', 'API') DEFAULT 'METER'," +
  "  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
  "  INDEX idx_drn (drn)" +
  ")",
  function(err) {
    if (err && err.message.indexOf('already exists') === -1) {
      console.error('[AuthNumbers] AuthorizedNumberAuditLog table error:', err.message);
    }
  }
);

console.log('[AuthNumbers] Table migrations applied');

// ═══════════════════════════════════════════════════════════════════════════
// PHONE NORMALIZATION
// ═══════════════════════════════════════════════════════════════════════════

function normalizePhone(phone) {
  if (!phone) return '';
  var cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.length > 0 && cleaned[0] !== '+' && cleaned.length >= 10) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNC NUMBERS — full replacement from ESP32 meter
// ═══════════════════════════════════════════════════════════════════════════

exports.syncNumbers = function(drn, numbers, timestamp) {
  var normalizedIncoming = (numbers || []).map(normalizePhone).filter(function(n) { return n.length > 0; });

  return new Promise(function(resolve, reject) {
    connection.query(
      'SELECT phone_number FROM MeterAuthorizedNumbers WHERE drn = ?',
      [drn],
      function(err, currentRows) {
        if (err) return reject(err);

        var currentNumbers = (currentRows || []).map(function(r) { return r.phone_number; });

        var toAdd = normalizedIncoming.filter(function(n) { return currentNumbers.indexOf(n) === -1; });
        var toRemove = currentNumbers.filter(function(n) { return normalizedIncoming.indexOf(n) === -1; });
        var unchanged = normalizedIncoming.length - toAdd.length;

        var operations = [];

        toAdd.forEach(function(phone) {
          operations.push(new Promise(function(res, rej) {
            connection.query(
              'INSERT INTO MeterAuthorizedNumbers (drn, phone_number) VALUES (?, ?) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP',
              [drn, phone],
              function(err2) { if (err2) rej(err2); else res(); }
            );
          }));
          operations.push(new Promise(function(res, rej) {
            connection.query(
              'INSERT INTO AuthorizedNumberAuditLog (drn, phone_number, action, source) VALUES (?, ?, ?, ?)',
              [drn, phone, 'ADD', 'METER'],
              function(err2) { if (err2) rej(err2); else res(); }
            );
          }));
        });

        toRemove.forEach(function(phone) {
          operations.push(new Promise(function(res, rej) {
            connection.query(
              'DELETE FROM MeterAuthorizedNumbers WHERE drn = ? AND phone_number = ?',
              [drn, phone],
              function(err2) { if (err2) rej(err2); else res(); }
            );
          }));
          operations.push(new Promise(function(res, rej) {
            connection.query(
              'INSERT INTO AuthorizedNumberAuditLog (drn, phone_number, action, source) VALUES (?, ?, ?, ?)',
              [drn, phone, 'REMOVE', 'METER'],
              function(err2) { if (err2) rej(err2); else res(); }
            );
          }));
        });

        if (normalizedIncoming.length > 0) {
          operations.push(new Promise(function(res, rej) {
            connection.query(
              'INSERT INTO AuthorizedNumberAuditLog (drn, phone_number, action, source) VALUES (?, ?, ?, ?)',
              [drn, 'SYNC:' + normalizedIncoming.length, 'SYNC', 'METER'],
              function(err2) { if (err2) rej(err2); else res(); }
            );
          }));
        }

        Promise.all(operations).then(function() {
          resolve({ added: toAdd, removed: toRemove, unchanged: unchanged });
        }).catch(reject);
      }
    );
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// GET NUMBERS BY DRN
// ═══════════════════════════════════════════════════════════════════════════

exports.getNumbersByDRN = function(drn) {
  return new Promise(function(resolve, reject) {
    connection.query(
      'SELECT id, drn, phone_number, synced_at, updated_at FROM MeterAuthorizedNumbers WHERE drn = ? ORDER BY phone_number',
      [drn],
      function(err, results) {
        if (err) return reject(err);
        resolve(results || []);
      }
    );
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// CHECK IF PHONE IS AUTHORIZED FOR A DRN
// ═══════════════════════════════════════════════════════════════════════════

exports.isPhoneAuthorized = function(drn, phone) {
  var normalizedInput = normalizePhone(phone);
  return new Promise(function(resolve, reject) {
    connection.query(
      'SELECT phone_number FROM MeterAuthorizedNumbers WHERE drn = ?',
      [drn],
      function(err, results) {
        if (err) return reject(err);
        if (!results || results.length === 0) return resolve(false);

        var found = results.some(function(row) {
          return normalizePhone(row.phone_number) === normalizedInput;
        });
        resolve(found);
      }
    );
  });
};

exports.normalizePhone = normalizePhone;
