const { createEvent } = require('./eventService');

// Demo engineering limits
const LIMITS = {
  pressure: { min: 0, max: 10000 },
  temperature: { min: -50, max: 300 },
  flowin: { min: 0, max: 2000 },
  flowout: { min: 0, max: 2000 },
  mudvolume: { min: 0, max: 5000 },
  vibration: { min: 0, max: 200 },
  rpm: { min: 0, max: 500 },
  torque: { min: 0, max: 20000 },
  wob: { min: 0, max: 150 },
  rop: { min: 0, max: 500 },
  depth: { min: 0, max: 30000 },
  spp: { min: 0, max: 6000 },
  hookload: { min: 0, max: 1000 },
  gammaray: { min: 0, max: 300 },
  resistivity: { min: 0.1, max: 10000 }
};

const normalizeParameterName = (param) => {
  return param.toLowerCase().trim();
};

const validateTelemetry = async (payload, wellId, parameter, io) => {
  const normParam = normalizeParameterName(parameter);
  
  if (!wellId || !payload.deviceId || payload.value === undefined || payload.value === null) {
    return { valid: false, reason: 'Missing required fields' };
  }
  
  const value = Number(payload.value);
  if (isNaN(value) || !isFinite(value)) {
    return { valid: false, reason: 'Value is not a valid number' };
  }

  // Check demo ranges
  let quality = 'GOOD';
  const limits = LIMITS[normParam];
  
  if (limits) {
    if (value < limits.min || value > limits.max) {
      quality = 'INVALID';
      // Create Event for invalid telemetry
      await createEvent(
        'SENSOR_RECEIVED', 
        wellId, 
        payload.deviceId, 
        `Invalid data for ${normParam}: ${value} is outside valid engineering bounds.`, 
        io
      );
      // Optional: you could reject it here completely, but for demo we will mark it INVALID
    }
  }

  return {
    valid: true,
    normalizedData: {
      wellId,
      deviceId: payload.deviceId,
      parameter: normParam,
      value: value,
      unit: payload.unit || '',
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      quality: quality,
      source: payload.source || 'SIMULATOR'
    }
  };
};

module.exports = { validateTelemetry, normalizeParameterName };
