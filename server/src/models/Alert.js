const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  alertId: { type: String, required: true, unique: true },
  wellId: { type: String, required: true },
  ruleId: { type: String },
  message: { type: String, required: true },
  severity: { type: String, enum: ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: true },
  status: { type: String, enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'], default: 'OPEN' },
  parameter: { type: String },
  value: { type: Number },
  threshold: { type: Number },
  acknowledgedBy: { type: String },
  acknowledgedAt: { type: Date },
  recommendation: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Alert', alertSchema);
