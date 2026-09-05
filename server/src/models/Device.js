const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  wellId: { type: String, required: true },
  type: { type: String, enum: ['SENSOR', 'ACTUATOR', 'EDGE_CONTROLLER'], required: true },
  status: { type: String, enum: ['ONLINE', 'OFFLINE', 'ERROR'], default: 'OFFLINE' },
  lastSeen: { type: Date, default: Date.now },
  batteryLevel: { type: Number },
  signalStrength: { type: Number },
  firmwareVersion: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Device', deviceSchema);
