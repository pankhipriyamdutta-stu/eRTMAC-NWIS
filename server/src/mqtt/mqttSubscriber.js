const SensorReading = require('../models/SensorReading');
const { evaluateRules } = require('../services/ruleEngine');
const { evaluateAI } = require('../services/aiService');
const { validateTelemetry } = require('../services/telemetryService');
const { updateDeviceStatus, updateDeviceLastSeen } = require('../services/deviceService');
const { handleActuatorAck } = require('../services/actuatorService');

const handleTelemetryMessage = async (topic, payload, io, mqttClient) => {
  // Topic formats:
  // ertmac/well/W001/sensor/pressure
  // ertmac/well/W001/device/D001/status
  // ertmac/well/W001/actuator/A001/status
  
  const parts = topic.split('/');
  
  if (topic.includes('/sensor/')) {
    const wellId = parts[2];
    const parameter = parts[4];
    
    // 1. Telemetry Validation
    const validation = await validateTelemetry(payload, wellId, parameter, io);
    if (!validation.valid) {
      console.warn(`Invalid telemetry dropped: ${validation.reason}`);
      return;
    }

    const normData = validation.normalizedData;

    // 2. Save reading to MongoDB
    const reading = new SensorReading(normData);
    await reading.save();

    // 3. Update device last seen
    await updateDeviceLastSeen(normData.deviceId);

    // 4. Broadcast to React via Socket.io
    if (io) {
      io.emit('sensor:update', reading);
    }

    // 5. Evaluate Rules
    await evaluateRules(reading, io, mqttClient);

    // 6. Evaluate AI
    evaluateAI(reading, io);

  } else if (topic.includes('/device/')) {
    const wellId = parts[2];
    const deviceId = parts[4];
    
    // Update Device Status using new service
    await updateDeviceStatus(wellId, deviceId, payload.status, payload, io);
    
  } else if (topic.includes('/actuator/') && topic.endsWith('/status')) {
      const wellId = parts[2];
      const actuatorId = parts[4];
      
      // Handle Actuator Ack
      await handleActuatorAck(wellId, actuatorId, payload, io);
  }
};

module.exports = { handleTelemetryMessage };
