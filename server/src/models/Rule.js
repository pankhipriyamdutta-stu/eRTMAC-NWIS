const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  ruleId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  parameter: { type: String }, // Optional for complex rules
  condition: { type: String, required: true }, // Can be a simple operator or a complex condition name
  threshold: { type: Number },
  duration: { type: Number, default: 0 }, // seconds the condition must persist
  severity: { type: String, enum: ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'SAFETY_CRITICAL'], required: true },
  priority: { type: Number, default: 1 },
  cooldown: { type: Number, default: 60 }, // seconds before rule can trigger again
  action: { type: String },
  enabled: { type: Boolean, default: true },
  lastTriggered: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('Rule', ruleSchema);
