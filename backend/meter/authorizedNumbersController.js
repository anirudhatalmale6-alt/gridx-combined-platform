var service = require('./authorizedNumbersService');

// ═══════════════════════════════════════════════════════════════════════════
// SYNC AUTHORIZED NUMBERS — called by ESP32 meter
// POST /meterAuthorizedNumbers/sync/:drn
// Body: { numbers: ["+27..."], timestamp: "2026-03-27T..." }
// ═══════════════════════════════════════════════════════════════════════════

exports.syncAuthorizedNumbers = function(req, res) {
  var drn = req.params.drn;
  var numbers = req.body.numbers;
  var timestamp = req.body.timestamp || null;

  if (!drn) {
    return res.status(400).json({ success: false, error: 'DRN is required' });
  }

  if (!Array.isArray(numbers)) {
    return res.status(400).json({ success: false, error: 'numbers must be an array of phone numbers' });
  }

  service.syncNumbers(drn, numbers, timestamp)
    .then(function(result) {
      res.json({
        success: true,
        drn: drn,
        added: result.added.length,
        removed: result.removed.length,
        unchanged: result.unchanged,
        total: result.added.length + result.unchanged,
        details: {
          added: result.added,
          removed: result.removed
        }
      });
    })
    .catch(function(err) {
      console.error('[AuthNumbers] Sync error for DRN ' + drn + ':', err.message);
      res.status(500).json({ success: false, error: 'Failed to sync authorized numbers' });
    });
};

// ═══════════════════════════════════════════════════════════════════════════
// GET AUTHORIZED NUMBERS — admin endpoint
// GET /meterAuthorizedNumbers/:drn
// ═══════════════════════════════════════════════════════════════════════════

exports.getAuthorizedNumbers = function(req, res) {
  var drn = req.params.drn;

  if (!drn) {
    return res.status(400).json({ success: false, error: 'DRN is required' });
  }

  service.getNumbersByDRN(drn)
    .then(function(numbers) {
      res.json({
        success: true,
        drn: drn,
        count: numbers.length,
        numbers: numbers
      });
    })
    .catch(function(err) {
      console.error('[AuthNumbers] Get error for DRN ' + drn + ':', err.message);
      res.status(500).json({ success: false, error: 'Failed to retrieve authorized numbers' });
    });
};
