const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../admin/authMiddllware');
const connection = require('../config/db');
const winston = require('winston');

// Set up Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ],
});

/**
 * @route   POST /meter/config/prepaid
 * @desc    Configure prepaid billing for a meter
 * @access  Private
 */
router.post('/config/prepaid', authenticateToken, async (req, res) => {
  let {
    DRN,
    credit_option,
    notification_types,
    notification_frequency,
    automatic_credit_updates,
    meter_tier  // Add meter tier to the accepted parameters
  } = req.body;

  // Validate input
  if (!DRN) {
    return res.status(400).json({ error: 'DRN is required' });
  }

  // Validate credit_option
  if (!['Fixed Amount', 'Flexible Amount'].includes(credit_option)) {
    return res.status(400).json({ error: 'Invalid credit option' });
  }

  // Validate notification_types
  if (notification_types && !Array.isArray(notification_types)) {
    return res.status(400).json({ error: 'Notification types must be an array' });
  }

  // Validate notification_frequency
  if (!['Daily', 'Weekly', 'Monthly'].includes(notification_frequency)) {
    return res.status(400).json({ error: 'Invalid notification frequency' });
  }

  // Validate tier if provided
  if (meter_tier) {
    const validTiers = ['Tier 1', 'Tier 2', 'Tier 3'];
    if (!validTiers.includes(meter_tier)) {
      return res.status(400).json({ error: 'Invalid tier. Must be "Tier 1", "Tier 2", or "Tier 3"' });
    }
  }

  try {
    // Check if configuration already exists for this meter
    const checkQuery = 'SELECT * FROM MeterBillingConfiguration WHERE DRN = ?';
    const checkResult = await new Promise((resolve, reject) => {
      connection.query(checkQuery, [DRN], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Convert notification_types array to SET format
    const notificationTypesString = notification_types ? notification_types.join(',') : 'SMS';

    if (checkResult.length > 0) {
      // Update existing configuration
      const updateQuery = `
        UPDATE MeterBillingConfiguration 
        SET billing_mode = 'Prepaid',
            credit_option = ?,
            notification_types = ?,
            notification_frequency = ?,
            automatic_credit_updates = ?,
            meter_tier = COALESCE(?, meter_tier)
        WHERE DRN = ?
      `;
      
      await new Promise((resolve, reject) => {
        connection.query(
          updateQuery, 
          [
            credit_option,
            notificationTypesString,
            notification_frequency,
            automatic_credit_updates || false,
            meter_tier, // Add meter_tier to parameters
            DRN
          ], 
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });

      res.status(200).json({ message: 'Prepaid billing configuration updated successfully' });
    } else {
      // Insert new configuration
      const insertQuery = `
        INSERT INTO MeterBillingConfiguration 
        (DRN, billing_mode, credit_option, notification_types, notification_frequency, automatic_credit_updates, meter_tier)
        VALUES (?, 'Prepaid', ?, ?, ?, ?, ?)
      `;
      
      await new Promise((resolve, reject) => {
        connection.query(
          insertQuery, 
          [
            DRN,
            credit_option,
            notificationTypesString,
            notification_frequency,
            automatic_credit_updates || false,
            meter_tier || null  // Add meter_tier to parameters, default to null if not provided
          ], 
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });

      res.status(201).json({ message: 'Prepaid billing configuration created successfully' });
    }
  } catch (err) {
    logger.error('Error configuring prepaid billing:', err);
    res.status(500).json({ error: 'Failed to configure prepaid billing', details: err.message });
  }
});

/**
 * @route   POST /meter/config/postpaid
 * @desc    Configure postpaid billing for a meter
 * @access  Private
 */
router.post('/config/postpaid', authenticateToken, async (req, res) => {
  let {
    DRN,
    turn_off_max_amount,
    turn_on_max_amount,
    amount_notifications,
    billing_period,
    custom_billing_day,
    billing_credit_days,
    notification_types,
    meter_tier
  } = req.body;

  // Validate input
  if (!DRN) {
    return res.status(400).json({ error: 'DRN is required' });
  }

  // Normalize the billing_period value (case-insensitive)
  let normalizedBillingPeriod = billing_period;
  
  // Handle different formats for end of month billing period
  if (billing_period && typeof billing_period === 'string') {
    const lowerBillingPeriod = billing_period.toLowerCase();
    
    if (lowerBillingPeriod === 'end' || 
        lowerBillingPeriod === 'end of the month' || 
        lowerBillingPeriod === 'end of month') {
      normalizedBillingPeriod = 'End of the month';
    }
  }
  
  // Validate billing_period
  const validBillingPeriods = ['1st', '15th', 'End of the month', 'Custom'];
  if (!validBillingPeriods.includes(normalizedBillingPeriod)) {
    return res.status(400).json({ 
      error: `Invalid billing period: "${billing_period}". Must be "1st", "15th", "End of the month", or "Custom"` 
    });
  }

  // Validate custom_billing_day if billing_period is 'Custom'
  if (normalizedBillingPeriod === 'Custom') {
    if (!custom_billing_day || custom_billing_day < 1 || custom_billing_day > 31) {
      return res.status(400).json({ error: 'Custom billing day must be between 1 and 31' });
    }
  }

  // Validate billing_credit_days
  const validCreditDays = ['7 Days', '14 Days', '30 Days'];
  if (!validCreditDays.includes(billing_credit_days)) {
    return res.status(400).json({ error: 'Invalid billing credit days' });
  }

  // Validate notification_types
  if (notification_types && !Array.isArray(notification_types)) {
    return res.status(400).json({ error: 'Notification types must be an array' });
  }

  // Validate tier if provided
  if (meter_tier) {
    const validTiers = ['Tier 1', 'Tier 2', 'Tier 3'];
    if (!validTiers.includes(meter_tier)) {
      return res.status(400).json({ error: 'Invalid tier. Must be "Tier 1", "Tier 2", or "Tier 3"' });
    }
  }

  try {
    // Check if configuration already exists for this meter
    const checkQuery = 'SELECT * FROM MeterBillingConfiguration WHERE DRN = ?';
    const checkResult = await new Promise((resolve, reject) => {
      connection.query(checkQuery, [DRN], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Convert notification_types array to SET format
    const notificationTypesString = notification_types ? notification_types.join(',') : 'SMS';

    if (checkResult.length > 0) {
      // Update existing configuration
      const updateQuery = `
        UPDATE MeterBillingConfiguration 
        SET billing_mode = 'Postpaid',
            turn_off_max_amount = ?,
            turn_on_max_amount = ?,
            amount_notifications = ?,
            billing_period = ?,
            custom_billing_day = ?,
            billing_credit_days = ?,
            notification_types = ?,
            meter_tier = COALESCE(?, meter_tier)
        WHERE DRN = ?
      `;
      
      await new Promise((resolve, reject) => {
        connection.query(
          updateQuery, 
          [
            turn_off_max_amount || false,
            turn_on_max_amount || false,
            amount_notifications || false,
            normalizedBillingPeriod,
            normalizedBillingPeriod === 'Custom' ? custom_billing_day : null,
            billing_credit_days,
            notificationTypesString,
            meter_tier, // Add meter_tier to parameters
            DRN
          ], 
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });

      res.status(200).json({ message: 'Postpaid billing configuration updated successfully' });
    } else {
      // Insert new configuration
      const insertQuery = `
        INSERT INTO MeterBillingConfiguration 
        (DRN, billing_mode, turn_off_max_amount, turn_on_max_amount, amount_notifications, 
        billing_period, custom_billing_day, billing_credit_days, notification_types, meter_tier)
        VALUES (?, 'Postpaid', ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await new Promise((resolve, reject) => {
        connection.query(
          insertQuery, 
          [
            DRN,
            turn_off_max_amount || false,
            turn_on_max_amount || false,
            amount_notifications || false,
            normalizedBillingPeriod,
            normalizedBillingPeriod === 'Custom' ? custom_billing_day : null,
            billing_credit_days,
            notificationTypesString,
            meter_tier || null  // Add meter_tier to parameters, default to null if not provided
          ], 
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });

      res.status(201).json({ message: 'Postpaid billing configuration created successfully' });
    }
  } catch (err) {
    logger.error('Error configuring postpaid billing:', err);
    res.status(500).json({ error: 'Failed to configure postpaid billing', details: err.message });
  }
});

/**
 * @route   POST /meter/config/tier
 * @desc    Set tier information for a meter
 * @access  Private
 */
router.post('/config/tier', authenticateToken, async (req, res) => {
  const { DRN, tier } = req.body;

  // Validate input
  if (!DRN) {
    return res.status(400).json({ error: 'DRN is required' });
  }

  // Validate tier
  const validTiers = ['Tier 1', 'Tier 2', 'Tier 3'];
  if (!validTiers.includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier. Must be "Tier 1", "Tier 2", or "Tier 3"' });
  }

  try {
    // Check if configuration already exists for this meter
    const checkQuery = 'SELECT * FROM MeterBillingConfiguration WHERE DRN = ?';
    const checkResult = await new Promise((resolve, reject) => {
      connection.query(checkQuery, [DRN], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    if (checkResult.length > 0) {
      // Update existing configuration with ONLY tier information
      const updateQuery = `
        UPDATE MeterBillingConfiguration 
        SET meter_tier = ?
        WHERE DRN = ?
      `;
      
      await new Promise((resolve, reject) => {
        connection.query(
          updateQuery, 
          [
            tier,
            DRN
          ], 
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });

      res.status(200).json({ message: 'Meter tier configuration updated successfully' });
    } else {
      // Insert minimal new record with ONLY DRN and tier
      const insertQuery = `
        INSERT INTO MeterBillingConfiguration 
        (DRN, meter_tier)
        VALUES (?, ?)
      `;
      
      await new Promise((resolve, reject) => {
        connection.query(
          insertQuery, 
          [
            DRN,
            tier
          ], 
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });

      res.status(201).json({ message: 'Meter tier configuration created successfully' });
    }
  } catch (err) {
    logger.error('Error configuring meter tier:', err);
    res.status(500).json({ error: 'Failed to configure meter tier', details: err.message });
  }
});

/**
 * @route   GET /meter/config/:DRN
 * @desc    Get billing configuration for a specific meter
 * @access  Private
 */
router.get('/config/:DRN', authenticateToken, async (req, res) => {
  const { DRN } = req.params;

  try {
    const query = 'SELECT * FROM MeterBillingConfiguration WHERE DRN = ?';
    const result = await new Promise((resolve, reject) => {
      connection.query(query, [DRN], (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    if (result.length === 0) {
      return res.status(404).json({ message: 'No billing configuration found for this meter' });
    }

    // Parse notification_types from SET to array
    const config = result[0];
    if (config.notification_types) {
      config.notification_types = config.notification_types.split(',');
    }

    res.json(config);
  } catch (err) {
    logger.error('Error fetching meter billing configuration:', err);
    res.status(500).json({ error: 'Failed to fetch billing configuration', details: err.message });
  }
});

// ============================================================
// Tariff Rate Table Management
// ============================================================

/**
 * @route   POST /meter/config/tariff-rates
 * @desc    Update tariff rate table for a meter and push via MQTT
 * @body    { "DRN": "...", "rates": [0.00, 1.50, 2.80, 3.50, 4.50, 2.80, 2.80, 2.80, 2.80, 2.80] }
 *          OR { "DRN": "...", "rates": { "0": 0.00, "3": 4.20 } } for partial updates
 * @access  Private
 */
router.post('/config/tariff-rates', authenticateToken, async (req, res) => {
  const { DRN, rates } = req.body;

  if (!DRN) {
    return res.status(400).json({ error: 'DRN is required' });
  }

  if (!rates) {
    return res.status(400).json({ error: 'rates is required (array of 10 rates or object with index:rate pairs)' });
  }

  try {
    let rateArray = new Array(10).fill(null);

    if (Array.isArray(rates)) {
      if (rates.length > 10) {
        return res.status(400).json({ error: 'Maximum 10 tariff indices (0-9)' });
      }
      for (let i = 0; i < rates.length; i++) {
        if (typeof rates[i] !== 'number' || rates[i] < 0) {
          return res.status(400).json({ error: `Invalid rate at index ${i}: must be a non-negative number` });
        }
        rateArray[i] = rates[i];
      }
    } else if (typeof rates === 'object') {
      for (const [key, value] of Object.entries(rates)) {
        const index = parseInt(key);
        if (isNaN(index) || index < 0 || index > 9) {
          return res.status(400).json({ error: `Invalid index "${key}": must be 0-9` });
        }
        if (typeof value !== 'number' || value < 0) {
          return res.status(400).json({ error: `Invalid rate for index ${key}: must be a non-negative number` });
        }
        rateArray[index] = value;
      }
    } else {
      return res.status(400).json({ error: 'rates must be an array or object' });
    }

    // Ensure MeterTariffRates table exists
    await new Promise((resolve, reject) => {
      connection.query(`
        CREATE TABLE IF NOT EXISTS MeterTariffRates (
          id INT AUTO_INCREMENT PRIMARY KEY,
          DRN VARCHAR(50) NOT NULL UNIQUE,
          tariff_rates JSON NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_drn (DRN)
        )
      `, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Load existing rates from DB for merge
    const existing = await new Promise((resolve, reject) => {
      connection.query(
        'SELECT tariff_rates FROM MeterTariffRates WHERE DRN = ?',
        [DRN],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    const defaultRates = [0.00, 1.50, 2.80, 3.50, 4.50, 2.80, 2.80, 2.80, 2.80, 2.80];
    let currentRates = defaultRates;

    if (existing.length > 0 && existing[0].tariff_rates) {
      try {
        currentRates = JSON.parse(existing[0].tariff_rates);
      } catch (e) {
        currentRates = defaultRates;
      }
    }

    // Merge: only overwrite indices that were provided
    for (let i = 0; i < 10; i++) {
      if (rateArray[i] !== null) {
        currentRates[i] = rateArray[i];
      }
    }

    // Upsert into database
    const ratesJson = JSON.stringify(currentRates);
    if (existing.length > 0) {
      await new Promise((resolve, reject) => {
        connection.query(
          'UPDATE MeterTariffRates SET tariff_rates = ?, updated_at = NOW() WHERE DRN = ?',
          [ratesJson, DRN],
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });
    } else {
      await new Promise((resolve, reject) => {
        connection.query(
          'INSERT INTO MeterTariffRates (DRN, tariff_rates, updated_at) VALUES (?, ?, NOW())',
          [DRN, ratesJson],
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });
    }

    // Send to meter via MQTT
    const mqttHandler = require('../services/mqttHandler');
    mqttHandler.publishCommand(DRN, { trt: currentRates });

    const rateLabels = ['Free/Emergency', 'Lifeline', 'Standard', 'Commercial', 'Industrial',
                        'Custom 5', 'Custom 6', 'Custom 7', 'Custom 8', 'Custom 9'];

    res.json({
      success: true,
      message: `Tariff rates updated and sent to meter ${DRN}`,
      rates: currentRates.map((rate, i) => ({
        index: i,
        label: rateLabels[i],
        rate: rate,
        display: `N$ ${rate.toFixed(4)}/kWh`
      }))
    });

  } catch (err) {
    logger.error('Error updating tariff rates:', err);
    res.status(500).json({ error: 'Failed to update tariff rates', details: err.message });
  }
});

/**
 * @route   GET /meter/config/tariff-rates/:DRN
 * @desc    Get tariff rate table for a meter
 * @access  Private
 */
router.get('/config/tariff-rates/:DRN', authenticateToken, async (req, res) => {
  const { DRN } = req.params;

  const rateLabels = ['Free/Emergency', 'Lifeline', 'Standard', 'Commercial', 'Industrial',
                      'Custom 5', 'Custom 6', 'Custom 7', 'Custom 8', 'Custom 9'];
  const defaultRates = [0.00, 1.50, 2.80, 3.50, 4.50, 2.80, 2.80, 2.80, 2.80, 2.80];

  try {
    const result = await new Promise((resolve, reject) => {
      connection.query(
        'SELECT tariff_rates, updated_at FROM MeterTariffRates WHERE DRN = ?',
        [DRN],
        (err, data) => {
          if (err) reject(err);
          else resolve(data);
        }
      );
    });

    if (result.length === 0) {
      return res.json({
        DRN,
        source: 'defaults',
        rates: defaultRates.map((rate, i) => ({
          index: i, label: rateLabels[i], rate, display: `N$ ${rate.toFixed(4)}/kWh`
        }))
      });
    }

    const rates = JSON.parse(result[0].tariff_rates);
    res.json({
      DRN,
      source: 'database',
      updated_at: result[0].updated_at,
      rates: rates.map((rate, i) => ({
        index: i, label: rateLabels[i], rate, display: `N$ ${rate.toFixed(4)}/kWh`
      }))
    });

  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.json({
        DRN,
        source: 'defaults',
        rates: defaultRates.map((rate, i) => ({
          index: i, label: rateLabels[i], rate, display: `N$ ${rate.toFixed(4)}/kWh`
        }))
      });
    }
    logger.error('Error fetching tariff rates:', err);
    res.status(500).json({ error: 'Failed to fetch tariff rates', details: err.message });
  }
});

/**
 * @route   POST /meter/config/tariff-index
 * @desc    Set the active tariff index on a meter via MQTT
 * @body    { "DRN": "...", "index": 3 }
 * @access  Private
 */
router.post('/config/tariff-index', authenticateToken, async (req, res) => {
  const { DRN, index } = req.body;

  if (!DRN) {
    return res.status(400).json({ error: 'DRN is required' });
  }

  if (index === undefined || index === null || index < 0 || index > 9) {
    return res.status(400).json({ error: 'index must be 0-9' });
  }

  try {
    const mqttHandler = require('../services/mqttHandler');
    mqttHandler.publishCommand(DRN, { ti: index });

    const rateLabels = ['Free/Emergency', 'Lifeline', 'Standard', 'Commercial', 'Industrial',
                        'Custom 5', 'Custom 6', 'Custom 7', 'Custom 8', 'Custom 9'];

    res.json({
      success: true,
      message: `Tariff index ${index} (${rateLabels[index]}) sent to meter ${DRN}`,
      index,
      label: rateLabels[index]
    });

  } catch (err) {
    logger.error('Error setting tariff index:', err);
    res.status(500).json({ error: 'Failed to set tariff index', details: err.message });
  }
});

/**
 * @route   POST /config/tariff-rates/all
 * @desc    Push tariff rate table to ALL GRIDx meters via MQTT
 * @body    { "rates": [0.00, 1.50, 2.80, 3.50, 4.50, 2.80, 2.80, 2.80, 2.80, 2.80] }
 * @access  Private (Admin)
 */
router.post('/config/tariff-rates/all', authenticateToken, async (req, res) => {
  var rates = req.body.rates;

  if (!rates) {
    return res.status(400).json({ error: 'rates is required (array of 10 rates)' });
  }

  if (!Array.isArray(rates) || rates.length !== 10) {
    return res.status(400).json({ error: 'rates must be an array of exactly 10 values' });
  }

  for (var i = 0; i < 10; i++) {
    if (typeof rates[i] !== 'number' || rates[i] < 0) {
      return res.status(400).json({ error: 'Invalid rate at index ' + i + ': must be a non-negative number' });
    }
  }

  try {
    // Get all GRIDx meter DRNs
    var meters = await new Promise(function(resolve, reject) {
      connection.query('SELECT DRN FROM MeterProfileReal', function(err, result) {
        if (err) reject(err);
        else resolve(result);
      });
    });

    if (!meters || meters.length === 0) {
      return res.status(404).json({ error: 'No meters found in the system' });
    }

    // Ensure MeterTariffRates table exists
    await new Promise(function(resolve, reject) {
      connection.query(
        'CREATE TABLE IF NOT EXISTS MeterTariffRates (' +
        '  id INT AUTO_INCREMENT PRIMARY KEY,' +
        '  DRN VARCHAR(50) NOT NULL UNIQUE,' +
        '  tariff_rates JSON NOT NULL,' +
        '  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,' +
        '  INDEX idx_drn (DRN)' +
        ')',
        function(err, result) {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    var mqttHandler = require('../services/mqttHandler');
    var ratesJson = JSON.stringify(rates);
    var sent = 0;
    var failed = 0;

    for (var m = 0; m < meters.length; m++) {
      var drn = meters[m].DRN;
      try {
        // Upsert rates in DB for each meter
        await new Promise(function(resolve, reject) {
          connection.query(
            'INSERT INTO MeterTariffRates (DRN, tariff_rates, updated_at) VALUES (?, ?, NOW()) ' +
            'ON DUPLICATE KEY UPDATE tariff_rates = ?, updated_at = NOW()',
            [drn, ratesJson, ratesJson],
            function(err, result) {
              if (err) reject(err);
              else resolve(result);
            }
          );
        });

        // Push via MQTT
        mqttHandler.publishCommand(drn, { trt: rates });
        sent++;
      } catch (e) {
        logger.error('Failed to push tariff to meter ' + drn + ':', e.message);
        failed++;
      }
    }

    var rateLabels = ['Free/Emergency', 'Lifeline', 'Standard', 'Commercial', 'Industrial',
                      'Custom 5', 'Custom 6', 'Custom 7', 'Custom 8', 'Custom 9'];

    res.json({
      success: true,
      message: 'Tariff rates pushed to ' + sent + ' meters' + (failed > 0 ? ' (' + failed + ' failed)' : ''),
      totalMeters: meters.length,
      sent: sent,
      failed: failed,
      rates: rates.map(function(rate, i) {
        return { index: i, label: rateLabels[i], rate: rate, display: 'N$ ' + rate.toFixed(4) + '/kWh' };
      })
    });

  } catch (err) {
    logger.error('Error pushing tariff rates to all meters:', err);
    res.status(500).json({ error: 'Failed to push tariff rates', details: err.message });
  }
});

/**
 * @route   POST /config/tariff-index/all
 * @desc    Set the active tariff index on ALL GRIDx meters via MQTT
 * @body    { "index": 2 }
 * @access  Private (Admin)
 */
router.post('/config/tariff-index/all', authenticateToken, async (req, res) => {
  var index = req.body.index;

  if (index === undefined || index === null || index < 0 || index > 9) {
    return res.status(400).json({ error: 'index must be 0-9' });
  }

  try {
    var meters = await new Promise(function(resolve, reject) {
      connection.query('SELECT DRN FROM MeterProfileReal', function(err, result) {
        if (err) reject(err);
        else resolve(result);
      });
    });

    if (!meters || meters.length === 0) {
      return res.status(404).json({ error: 'No meters found in the system' });
    }

    var mqttHandler = require('../services/mqttHandler');
    var sent = 0;
    var failed = 0;

    for (var m = 0; m < meters.length; m++) {
      try {
        mqttHandler.publishCommand(meters[m].DRN, { ti: index });
        sent++;
      } catch (e) {
        logger.error('Failed to set tariff index on meter ' + meters[m].DRN + ':', e.message);
        failed++;
      }
    }

    var rateLabels = ['Free/Emergency', 'Lifeline', 'Standard', 'Commercial', 'Industrial',
                      'Custom 5', 'Custom 6', 'Custom 7', 'Custom 8', 'Custom 9'];

    res.json({
      success: true,
      message: 'Tariff index ' + index + ' (' + rateLabels[index] + ') sent to ' + sent + ' meters' + (failed > 0 ? ' (' + failed + ' failed)' : ''),
      totalMeters: meters.length,
      sent: sent,
      failed: failed,
      index: index,
      label: rateLabels[index]
    });

  } catch (err) {
    logger.error('Error setting tariff index on all meters:', err);
    res.status(500).json({ error: 'Failed to set tariff index', details: err.message });
  }
});

/**
 * @route   GET /config/tariff-rates/global
 * @desc    Get the global tariff rate configuration (from first stored or defaults)
 * @access  Private
 */
router.get('/config/tariff-rates/global', authenticateToken, async (req, res) => {
  var rateLabels = ['Free/Emergency', 'Lifeline', 'Standard', 'Commercial', 'Industrial',
                    'Custom 5', 'Custom 6', 'Custom 7', 'Custom 8', 'Custom 9'];
  var defaultRates = [0.00, 1.50, 2.80, 3.50, 4.50, 2.80, 2.80, 2.80, 2.80, 2.80];

  try {
    var result = await new Promise(function(resolve, reject) {
      connection.query(
        'SELECT tariff_rates, updated_at FROM MeterTariffRates ORDER BY updated_at DESC LIMIT 1',
        function(err, data) {
          if (err) reject(err);
          else resolve(data);
        }
      );
    });

    // Get total meter count
    var meterCount = await new Promise(function(resolve, reject) {
      connection.query('SELECT COUNT(*) as total FROM MeterProfileReal', function(err, data) {
        if (err) reject(err);
        else resolve(data);
      });
    });

    var totalMeters = (meterCount && meterCount[0]) ? meterCount[0].total : 0;

    if (!result || result.length === 0) {
      return res.json({
        source: 'defaults',
        totalMeters: totalMeters,
        rates: defaultRates.map(function(rate, i) {
          return { index: i, label: rateLabels[i], rate: rate, display: 'N$ ' + rate.toFixed(4) + '/kWh' };
        })
      });
    }

    var rates = JSON.parse(result[0].tariff_rates);
    res.json({
      source: 'database',
      totalMeters: totalMeters,
      updated_at: result[0].updated_at,
      rates: rates.map(function(rate, i) {
        return { index: i, label: rateLabels[i], rate: rate, display: 'N$ ' + rate.toFixed(4) + '/kWh' };
      })
    });

  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.json({
        source: 'defaults',
        totalMeters: 0,
        rates: defaultRates.map(function(rate, i) {
          return { index: i, label: rateLabels[i], rate: rate, display: 'N$ ' + rate.toFixed(4) + '/kWh' };
        })
      });
    }
    logger.error('Error fetching global tariff rates:', err);
    res.status(500).json({ error: 'Failed to fetch tariff rates', details: err.message });
  }
});

module.exports = router;
