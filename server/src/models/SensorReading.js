const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema({
  wellId: { type: String, required: true, index: true },
  deviceId: { type: String, required: true, index: true },
  parameter: { type: String, required: true, index: true },
  value: { type: Number, required: true },
  unit: { type: String },
  timestamp: { type: Date, required: true, index: true },
  quality: { type: String, enum: ['GOOD', 'BAD', 'UNCERTAIN'], default: 'GOOD' },
  source: { type: String, default: 'SIMULATOR' }
}, {
  timestamps: true
});

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
