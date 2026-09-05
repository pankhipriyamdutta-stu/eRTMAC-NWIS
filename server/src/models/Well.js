const mongoose = require('mongoose');

const wellSchema = new mongoose.Schema({
  wellId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'], default: 'ACTIVE' },
  formation: { type: String },
  depth: { type: Number }
}, {
  timestamps: true
});

module.exports = mongoose.model('Well', wellSchema);
