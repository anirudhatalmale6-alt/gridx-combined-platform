const db = require('../config/db');

// Create the home classification table if it doesn't exist
const createTableSQL = `
CREATE TABLE IF NOT EXISTS MeterHomeClassification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  DRN VARCHAR(50) NOT NULL,

  -- Classification result
  classification_type VARCHAR(100) NULL,
  total_expected_power DOUBLE NULL DEFAULT 0,
  total_expected_current DOUBLE NULL DEFAULT 0,
  calibration_status ENUM('pending', 'in_progress', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  calibration_passed BOOLEAN NULL,

  -- Calibration readings
  measured_power DOUBLE NULL,
  measured_current DOUBLE NULL,
  measured_voltage DOUBLE NULL,
  power_deviation DOUBLE NULL,

  -- Selected loads (JSON array)
  selected_loads JSON NOT NULL,

  -- Technician info
  technician_name VARCHAR(100) NULL,
  tester_app_version VARCHAR(20) NULL,
  notes TEXT NULL,

  date_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_drn (DRN),
  INDEX idx_drn_status (DRN, calibration_status),
  INDEX idx_date (date_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

db.query(createTableSQL, (err) => {
  if (err) {
    console.error('Failed to create MeterHomeClassification table:', err.message);
  } else {
    console.log('MeterHomeClassification table ready');
  }
});

// Save a home classification record
exports.saveClassification = (data) => {
  const sql = `INSERT INTO MeterHomeClassification SET ?`;
  return new Promise((resolve, reject) => {
    db.query(sql, data, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// Get all classifications for a meter (newest first)
exports.getClassificationsByDRN = (DRN) => {
  const sql = `SELECT * FROM MeterHomeClassification WHERE DRN = ? ORDER BY date_time DESC`;
  return new Promise((resolve, reject) => {
    db.query(sql, [DRN], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Get latest classification for a meter
exports.getLatestClassificationByDRN = (DRN) => {
  const sql = `SELECT * FROM MeterHomeClassification WHERE DRN = ? ORDER BY date_time DESC LIMIT 1`;
  return new Promise((resolve, reject) => {
    db.query(sql, [DRN], (err, results) => {
      if (err) reject(err);
      else resolve(results.length > 0 ? results[0] : null);
    });
  });
};

// Get a single classification by ID
exports.getClassificationById = (id) => {
  const sql = `SELECT * FROM MeterHomeClassification WHERE id = ?`;
  return new Promise((resolve, reject) => {
    db.query(sql, [id], (err, results) => {
      if (err) reject(err);
      else resolve(results.length > 0 ? results[0] : null);
    });
  });
};
