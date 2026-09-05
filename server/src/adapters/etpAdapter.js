/**
 * Prototype Energistics ETP Adapter (Academic Demo)
 * Simulates connecting to an ETP 1.2 server and streaming data.
 */
const { validateTelemetry } = require('../services/telemetryService');

class ETPAdapter {
  constructor(io) {
    this.io = io;
    this.connected = false;
  }

  connect(url) {
    console.log(`Simulating ETP Connection to ${url}`);
    this.connected = true;
    return true;
  }

  disconnect() {
    this.connected = false;
    console.log("ETP Disconnected");
  }

  simulateIncomingStream() {
    if (!this.connected) return;
    
    // Simulating an incoming ETP ChannelData message
    const dummyWellId = "W001";
    const dummyDeviceId = "D_ETP_01";
    
    const payload = {
      deviceId: dummyDeviceId,
      value: 120, // e.g. RPM
      unit: 'rpm',
      timestamp: new Date().toISOString(),
      source: 'ETP_ADAPTER'
    };

    validateTelemetry(payload, dummyWellId, 'rpm', this.io).then(validation => {
      if (validation.valid) {
        console.log("Processed ETP data:", validation.normalizedData);
        // In full flow, this would go to MongoDB and Socket.IO
      }
    });
  }
}

module.exports = { ETPAdapter };
