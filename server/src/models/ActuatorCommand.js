const mongoose = require('mongoose');

const actuatorCommandSchema = new mongoose.Schema({
  commandId: { type: String, required: true, unique: true },
  wellId: { type: String, required: true },
  actuatorId: { type: String, required: true },
  command: { type: String, required: true }, // e.g., PUMP_OFF, PUMP_ON
  issuedBy: { type: String, default: 'SYSTEM' }, // 'SYSTEM' or 'userId'
  status: { type: String, enum: ['PENDING', 'SENT', 'ACKNOWLEDGED', 'FAILED'], default: 'PENDING' },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});

module.exports = mongoose.model('ActuatorCommand', actuatorCommandSchema);
