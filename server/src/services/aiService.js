const axios = require('axios');
const Event = require('../models/Event');

// We cache the AI scores slightly so we don't spam the python service every second for normal data.
let lastAIScores = new Map();

const evaluateAI = async (reading, io) => {
  try {
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    // Check cooldown to avoid spam
    const cooldownKey = `${reading.wellId}-${reading.parameter}`;
    const lastTime = lastAIScores.get(cooldownKey) || 0;
    
    if (Date.now() - lastTime > 5000) { // Every 5 seconds per parameter max
      lastAIScores.set(cooldownKey, Date.now());
      
      const response = await axios.post(`${aiUrl}/api/ai/analyze`, {
        wellId: reading.wellId,
        deviceId: reading.deviceId,
        parameter: reading.parameter,
        value: reading.value,
        timestamp: reading.timestamp
      });

      const result = response.data;

      if (result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL') {
        io.emit('ai:insight', result);

        const event = new Event({
          type: 'AI_ANALYSIS',
          wellId: reading.wellId,
          deviceId: reading.deviceId,
          details: `AI detected ${result.riskLevel} risk for ${reading.parameter}. Anomaly Score: ${result.anomalyScore}`
        });
        await event.save();
        io.emit('event:new', event);
      }
    }
  } catch (error) {
    // AI failure must not stop basic monitoring (Phase 15 requirement)
    // console.warn('AI Service unavailable, continuing normal monitoring.');
  }
};

module.exports = { evaluateAI };
