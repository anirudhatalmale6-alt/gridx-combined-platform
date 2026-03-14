const homeClassificationService = require('./homeClassificationService');

// POST - Save a new home classification
exports.saveClassification = function(req, res) {
  const data = req.body;

  if (!data.DRN) {
    return res.status(400).json({ error: 'DRN is required' });
  }
  if (!data.selected_loads || !Array.isArray(data.selected_loads) || data.selected_loads.length === 0) {
    return res.status(400).json({ error: 'selected_loads array is required and cannot be empty' });
  }

  const row = {
    DRN: data.DRN,
    classification_type: data.classification_type || null,
    total_expected_power: data.total_expected_power || 0,
    total_expected_current: data.total_expected_current || 0,
    calibration_status: data.calibration_status || 'pending',
    calibration_passed: data.calibration_passed != null ? data.calibration_passed : null,
    measured_power: data.measured_power || null,
    measured_current: data.measured_current || null,
    measured_voltage: data.measured_voltage || null,
    power_deviation: data.power_deviation || null,
    selected_loads: JSON.stringify(data.selected_loads),
    technician_name: data.technician_name || null,
    tester_app_version: data.tester_app_version || null,
    notes: data.notes || null,
  };

  homeClassificationService.saveClassification(row)
    .then(result => {
      res.status(201).json({ success: true, id: result.insertId });
    })
    .catch(error => {
      console.error('Error saving home classification:', error);
      res.status(500).json({ error: 'Failed to save classification', details: error.message });
    });
};

// GET - Get all classifications for a meter
exports.getClassificationsByDRN = function(req, res) {
  const DRN = req.params.DRN;

  homeClassificationService.getClassificationsByDRN(DRN)
    .then(results => {
      if (results.length === 0) {
        return res.json([]);
      }
      results.forEach(r => {
        if (r.selected_loads && typeof r.selected_loads === 'string') {
          try { r.selected_loads = JSON.parse(r.selected_loads); } catch (e) {}
        }
      });
      res.json(results);
    })
    .catch(error => {
      console.error('Error fetching home classifications:', error);
      res.status(500).json({ error: 'Failed to fetch classifications', details: error.message });
    });
};

// GET - Get latest classification for a meter
exports.getLatestClassificationByDRN = function(req, res) {
  const DRN = req.params.DRN;

  homeClassificationService.getLatestClassificationByDRN(DRN)
    .then(result => {
      if (!result) {
        return res.json(null);
      }
      if (result.selected_loads && typeof result.selected_loads === 'string') {
        try { result.selected_loads = JSON.parse(result.selected_loads); } catch (e) {}
      }
      res.json(result);
    })
    .catch(error => {
      console.error('Error fetching latest classification:', error);
      res.status(500).json({ error: 'Failed to fetch classification', details: error.message });
    });
};

// GET - Get a single classification by ID
exports.getClassificationById = function(req, res) {
  const id = req.params.id;

  homeClassificationService.getClassificationById(id)
    .then(result => {
      if (!result) {
        return res.status(404).json({ error: 'Classification not found' });
      }
      if (result.selected_loads && typeof result.selected_loads === 'string') {
        try { result.selected_loads = JSON.parse(result.selected_loads); } catch (e) {}
      }
      res.json(result);
    })
    .catch(error => {
      console.error('Error fetching classification:', error);
      res.status(500).json({ error: 'Failed to fetch classification', details: error.message });
    });
};
