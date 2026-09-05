const mongoose = require('mongoose');

const offsetWellSchema = new mongoose.Schema({
  wellId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  distance: { type: Number },
  formation: { type: String },
  depth: { type: Number },
  similarityScore: { type: Number },
  historicalParameters: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});

module.exports = mongoose.model('OffsetWell', offsetWellSchema);
