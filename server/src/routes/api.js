const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Models
const User = require('../models/User');
const Well = require('../models/Well');
const Device = require('../models/Device');
const SensorReading = require('../models/SensorReading');
const Alert = require('../models/Alert');
const Rule = require('../models/Rule');
const Event = require('../models/Event');
const ActuatorCommand = require('../models/ActuatorCommand');

// JWT Middleware
const protect = (req, res, next) => {
  // Simplified auth for prototype
  next();
};

// --- AUTH ---
router.post('/auth/register', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json({ success: true, data: user });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, token, data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/auth/me', protect, (req, res) => {
  res.json({ success: true, data: { username: 'admin', role: 'ADMIN' } });
});

// --- WELLS ---
router.get('/wells', async (req, res) => {
  const wells = await Well.find();
  res.json({ success: true, data: wells });
});
router.post('/wells', async (req, res) => {
  const well = await Well.create(req.body);
  res.status(201).json({ success: true, data: well });
});

// --- DEVICES ---
router.get('/devices', async (req, res) => {
  const devices = await Device.find();
  res.json({ success: true, data: devices });
});
router.post('/devices', async (req, res) => {
  const device = await Device.create(req.body);
  res.status(201).json({ success: true, data: device });
});

// --- READINGS ---
router.get('/readings/well/:wellId', async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const readings = await SensorReading.find({ wellId: req.params.wellId }).sort({ timestamp: -1 }).limit(limit);
  res.json({ success: true, data: readings });
});

// --- ALERTS ---
router.get('/alerts', async (req, res) => {
  const alerts = await Alert.find().sort({ createdAt: -1 });
  res.json({ success: true, data: alerts });
});

// --- RULES ---
router.get('/rules', async (req, res) => {
  const rules = await Rule.find();
  res.json({ success: true, data: rules });
});
router.post('/rules', async (req, res) => {
  const rule = await Rule.create(req.body);
  res.status(201).json({ success: true, data: rule });
});

// --- EVENTS ---
router.get('/events', async (req, res) => {
  const events = await Event.find().sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, data: events });
});

// --- ACTUATORS ---
router.post('/actuators/:id/command', async (req, res) => {
  const { command } = req.body;
  const { requestActuatorCommand } = require('../services/actuatorService');
  
  const io = req.app.get('io');
  // For demo, assume wellId is W001 and userId is admin
  const result = await requestActuatorCommand('W001', req.params.id, command, 'admin', io);
  
  if (result.success) {
    res.json({ success: true, data: result.data });
  } else {
    res.status(400).json({ success: false, message: result.message });
  }
});

// --- MQTT BYPASS (For environments without Mosquitto) ---
router.post('/telemetry/simulate', async (req, res) => {
  try {
    const { handleTelemetryMessage } = require('../mqtt/mqttSubscriber');
    const io = req.app.get('io');
    await handleTelemetryMessage(req.body.topic, req.body.payload, io, null);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
