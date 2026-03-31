/**
 * MQTT Handler — Bridges MQTT telemetry from ESP32 meters to MySQL.
 * Subscribes to gx/{drn}/{type} topics and parses binary packed payloads.
 * Also provides publishCommand() for sending JSON control commands to meters.
 *
 * Binary Protocol (all little-endian):
 *   0x01 Power  (37B): type(1) current(f32) voltage(f32) active(f32) reactive(f32)
 *                       apparent(f32) temp(f32) freq(f32) pf(f32) epoch(u32)
 *   0x02 Energy (23B): type(1) active_Wh(f32) reactive_Wh(f32) credit_Wh(f32)
 *                       tamper(u8) tamper_ts(u32) resets(u8) epoch(u32)
 *   0x03 Cellular(var): type(1) rssi(i16) operator(lstr) phone(lstr) imei(lstr) epoch(u32)
 *   0x04 Load    (5B): type(1) geyser_state(u8) geyser_ctrl(u8) mains_state(u8) mains_ctrl(u8)
 *   0x05 Token  (var): type(1) token_id(lstr) cls(u8) method(u8) msg(lstr) auth(u8)
 *                       token_result(u8) validation(u8) time(u32) amount(f32)
 *   lstr = 1-byte length prefix + string bytes
 */
const mqtt = require('mqtt');
const http = require('http');
const db = require('../config/db');

let mqttClient = null;

const TOPICS = [
  'gx/+/power',
  'gx/+/energy',
  'gx/+/cellular',
  'gx/+/load',
  'gx/+/token',
  'gx/+/ack',
];

// ==================== Binary Parser Helpers ====================

function readLStr(buf, offset) {
  const len = buf.readUInt8(offset);
  const value = buf.toString('utf8', offset + 1, offset + 1 + len);
  return { value, bytesRead: 1 + len };
}

// ==================== EMQX REST API ====================

function emqxApi(method, path, body) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from('gridxadmin:gridx2026').toString('base64');
    const options = {
      hostname: '127.0.0.1',
      port: 18083,
      path: `/api/v5${path}`,
      method,
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', (e) => reject(e));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function fixEmqxAuth() {
  try {
    console.log('[MQTT] Fixing EMQX authorization settings...');
    await emqxApi('PUT', '/authorization/settings', { no_match: 'allow', deny_action: 'ignore' });

    const sources = await emqxApi('GET', '/authorization/sources');
    if (Array.isArray(sources.data)) {
      for (const src of sources.data) {
        if (src.type === 'http' && src.enable !== false) {
          await emqxApi('PUT', `/authorization/sources/${src.type}`, { ...src, enable: false });
        }
      }
    }

    const authBackends = await emqxApi('GET', '/authentication');
    if (Array.isArray(authBackends.data)) {
      for (const b of authBackends.data) {
        if (b.mechanism === 'password_based' && b.backend === 'http' && b.enable !== false) {
          await emqxApi('PUT', `/authentication/${b.id}`, { ...b, enable: false });
        }
      }
      const builtIn = authBackends.data.find(b => b.backend === 'built_in_database');
      if (builtIn && !builtIn.enable) {
        await emqxApi('PUT', `/authentication/${builtIn.id}`, { ...builtIn, enable: true });
      }
    }

    const users = await emqxApi('GET', '/authentication/password_based:built_in_database/users?page=1&limit=100');
    if (users.data && users.data.data) {
      if (!users.data.data.some(u => u.user_id === 'gridx-backend')) {
        await emqxApi('POST', '/authentication/password_based:built_in_database/users',
          { user_id: 'gridx-backend', password: 'gridx-mqtt-2026', is_superuser: true });
      }
      if (!users.data.data.some(u => u.user_id === 'gridx-meter')) {
        await emqxApi('POST', '/authentication/password_based:built_in_database/users',
          { user_id: 'gridx-meter', password: 'meter-mqtt-2026', is_superuser: false });
      }
    }
    console.log('[MQTT] EMQX authorization fix complete');
  } catch (err) {
    console.error('[MQTT] EMQX fix error (non-fatal):', err.message);
  }
}

// ==================== Init ====================

async function init() {
  await fixEmqxAuth();

  const brokerUrl = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
  mqttClient = mqtt.connect(brokerUrl, {
    clientId: `gridx-backend-${Date.now()}`,
    clean: true,
    reconnectPeriod: 5000,
    username: process.env.MQTT_USER || 'gridx-backend',
    password: process.env.MQTT_PASS || 'gridx-mqtt-2026',
  });

  mqttClient.on('connect', () => {
    console.log('[MQTT] Connected to broker:', brokerUrl);
    mqttClient.subscribe(TOPICS, { qos: 0 }, (err) => {
      if (err) console.error('[MQTT] Subscribe error:', err.message);
      else console.log('[MQTT] Subscribed to:', TOPICS.join(', '));
    });
  });

  mqttClient.on('message', (topic, message) => {
    try { handleMessage(topic, message); }
    catch (err) { console.error('[MQTT] Message handling error:', err.message); }
  });

  mqttClient.on('error', (err) => console.error('[MQTT] Connection error:', err.message));
  mqttClient.on('reconnect', () => console.log('[MQTT] Reconnecting...'));

  return mqttClient;
}

// ==================== Message Router ====================

function handleMessage(topic, buf) {
  const parts = topic.split('/');
  if (parts.length !== 3 || parts[0] !== 'gx') return;

  const drn = parts[1];
  const type = parts[2];

  // Handle command acknowledgments from ESP32
  if (type === 'ack') {
    try {
      const ackData = JSON.parse(buf.toString());
      console.log(`[MQTT] ACK from ${drn}: type=${ackData.type}, status=${ackData.status}`);
      // Mark command as processed in heater control table if applicable
      if (ackData.type === 'geyser_control' || ackData.type === 'geyser_timer') {
        db.query(
          'UPDATE MeterHeaterControlTable SET processed = 1 WHERE DRN = ? AND processed = 0',
          [drn],
          (err) => { if (err) console.error('[MQTT] ACK update error:', err.message); }
        );
      }
    } catch (e) {
      console.log(`[MQTT] ACK from ${drn}: ${buf.toString()}`);
    }
    return;
  }

  const firstByte = buf[0];

  // Binary payloads start with type byte 0x01-0x05
  if (firstByte >= 0x01 && firstByte <= 0x05) {
    console.log(`[MQTT] ${type} from ${drn} (binary, ${buf.length}B)`);
    switch (type) {
      case 'power':    handlePowerBin(drn, buf); break;
      case 'energy':   handleEnergyBin(drn, buf); break;
      case 'cellular': handleCellularBin(drn, buf); break;
      case 'load':     handleLoadBin(drn, buf); break;
      case 'token':    handleTokenBin(drn, buf); break;
      default:         console.warn(`[MQTT] Unknown type: ${type}`);
    }
    return;
  }

  // Legacy JSON fallback
  try {
    const data = JSON.parse(buf.toString());
    console.log(`[MQTT] ${type} from ${drn} (JSON fallback)`);
    handleJsonMessage(drn, type, data);
  } catch (e) {
    console.error(`[MQTT] Invalid payload on ${topic}`);
  }
}

// ==================== Binary Handlers ====================

function handlePowerBin(drn, buf) {
  if (buf.length < 37) return console.error('[MQTT] Power packet too short:', buf.length);
  db.query('INSERT INTO MeteringPower SET ?', {
    DRN: drn,
    current:        buf.readFloatLE(1),
    voltage:        buf.readFloatLE(5),
    active_power:   buf.readFloatLE(9),
    reactive_power: buf.readFloatLE(13),
    apparent_power: buf.readFloatLE(17),
    temperature:    buf.readFloatLE(21),
    frequency:      buf.readFloatLE(25),
    power_factor:   buf.readFloatLE(29),
    record_time:    buf.readUInt32LE(33),
    source: 1,
  }, (err) => { if (err) console.error('[MQTT] Power insert error:', err.message); });
}

function handleEnergyBin(drn, buf) {
  if (buf.length < 23) return console.error('[MQTT] Energy packet too short:', buf.length);
  db.query('INSERT INTO MeterCumulativeEnergyUsage SET ?', {
    DRN: drn,
    active_energy:   buf.readFloatLE(1),
    reactive_energy: buf.readFloatLE(5),
    units:           buf.readFloatLE(9),
    tamper_state:    buf.readUInt8(13),
    tamp_time:       buf.readUInt32LE(14),
    meter_reset:     buf.readUInt8(18),
    record_time:     buf.readUInt32LE(19),
    source: 1,
  }, (err) => { if (err) console.error('[MQTT] Energy insert error:', err.message); });
}

function handleCellularBin(drn, buf) {
  if (buf.length < 10) return console.error('[MQTT] Cellular packet too short:', buf.length);
  let off = 1;
  const rssi = buf.readInt16LE(off); off += 2;
  const op = readLStr(buf, off); off += op.bytesRead;
  const ph = readLStr(buf, off); off += ph.bytesRead;
  const im = readLStr(buf, off); off += im.bytesRead;
  const epoch = buf.readUInt32LE(off);

  db.query('INSERT INTO MeterCellularNetworkProperties SET ?', {
    DRN: drn, signal_strength: rssi, service_provider: op.value,
    sim_phone_number: ph.value, IMEU: im.value, record_time: epoch,
  }, (err) => { if (err) console.error('[MQTT] Cellular insert error:', err.message); });
}

function handleLoadBin(drn, buf) {
  if (buf.length < 5) return console.error('[MQTT] Load packet too short:', buf.length);
  db.query('INSERT INTO MeterLoadControl SET ?', {
    DRN: drn,
    geyser_state:   buf.readUInt8(1),
    geyser_control: buf.readUInt8(2),
    mains_state:    buf.readUInt8(3),
    mains_control:  buf.readUInt8(4),
  }, (err) => { if (err) console.error('[MQTT] Load insert error:', err.message); });
}

function handleTokenBin(drn, buf) {
  if (buf.length < 15) return console.error('[MQTT] Token packet too short:', buf.length);
  let off = 1;
  const tid = readLStr(buf, off); off += tid.bytesRead;
  const cls = buf.readUInt8(off++);
  const method = buf.readUInt8(off++);
  const msg = readLStr(buf, off); off += msg.bytesRead;
  const auth = buf.readUInt8(off++);
  const tres = buf.readUInt8(off++);
  const vres = buf.readUInt8(off++);
  const ttime = buf.readUInt32LE(off); off += 4;
  const amt = buf.readFloatLE(off);

  db.query('INSERT INTO STSTokesInfo SET ?', {
    DRN: drn, token_id: tid.value, token_cls: cls, submission_Method: method,
    display_msg: msg.value, display_auth_result: auth, display_token_result: tres,
    display_validation_result: vres, token_time: ttime, token_amount: amt,
  }, (err) => { if (err) console.error('[MQTT] Token insert error:', err.message); });
}

// ==================== Legacy JSON Fallback ====================

function handleJsonMessage(drn, type, data) {
  switch (type) {
    case 'power': {
      if (!Array.isArray(data) || data.length < 9) return;
      db.query('INSERT INTO MeteringPower SET ?', {
        DRN: drn, current: data[0], voltage: data[1], active_power: data[2],
        reactive_power: data[3], apparent_power: data[4], temperature: data[5],
        frequency: data[6], power_factor: data[7], record_time: data[8], source: 1,
      }, (err) => { if (err) console.error('[MQTT] Power insert error:', err.message); });
      break;
    }
    case 'energy': {
      if (!Array.isArray(data) || data.length < 7) return;
      db.query('INSERT INTO MeterCumulativeEnergyUsage SET ?', {
        DRN: drn, active_energy: data[0], reactive_energy: data[1], units: data[2],
        tamper_state: data[3], tamp_time: data[4], meter_reset: data[5],
        record_time: data[6], source: 1,
      }, (err) => { if (err) console.error('[MQTT] Energy insert error:', err.message); });
      break;
    }
    case 'cellular': {
      if (!Array.isArray(data) || data.length < 5) return;
      db.query('INSERT INTO MeterCellularNetworkProperties SET ?', {
        DRN: drn, signal_strength: data[0], service_provider: data[1],
        sim_phone_number: data[2], IMEU: data[3], record_time: data[4],
      }, (err) => { if (err) console.error('[MQTT] Cellular insert error:', err.message); });
      break;
    }
    case 'load': {
      if (!Array.isArray(data) || data.length < 4) return;
      db.query('INSERT INTO MeterLoadControl SET ?', {
        DRN: drn, geyser_state: data[0], geyser_control: data[1],
        mains_state: data[2], mains_control: data[3],
      }, (err) => { if (err) console.error('[MQTT] Load insert error:', err.message); });
      break;
    }
    case 'token': {
      let record;
      if (Array.isArray(data) && data.length >= 9) {
        record = { DRN: drn, token_id: data[0], token_cls: data[1], submission_Method: data[2],
          display_msg: data[3], display_auth_result: data[4], display_token_result: data[5],
          display_validation_result: data[6], token_time: data[7], token_amount: data[8] };
      } else if (typeof data === 'object' && !Array.isArray(data)) {
        record = { DRN: drn, ...data };
      } else return;
      db.query('INSERT INTO STSTokesInfo SET ?', record, (err) => {
        if (err) console.error('[MQTT] Token insert error:', err.message);
      });
      break;
    }
  }
}

// ==================== Command Publishing ====================

function publishCommand(drn, command) {
  if (!mqttClient || !mqttClient.connected) {
    throw new Error('MQTT client not connected');
  }
  const topic = `gx/${drn}/cmd`;
  const payload = JSON.stringify(command);
  mqttClient.publish(topic, payload, { qos: 1, retain: false }, (err) => {
    if (err) console.error(`[MQTT] Publish error to ${topic}:`, err.message);
    else console.log(`[MQTT] Command sent to ${drn} (QoS 1):`, payload);
  });
}

function getClient() {
  return mqttClient;
}

module.exports = { init, publishCommand, getClient };
