const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: [
      'LOGIN', 'SENSOR_RECEIVED', 'RULE_TRIGGERED', 'ALERT_CREATED', 
      'ALERT_ACKNOWLEDGED', 'AI_ANALYSIS', 'ACTUATOR_COMMAND', 
      'DEVICE_OFFLINE', 'DEVICE_ONLINE', 'CONFIG_CHANGED'
    ], 
    required: true 
  },
  wellId: { type: String },
  deviceId: { type: String },
  userId: { type: String },
  details: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);
