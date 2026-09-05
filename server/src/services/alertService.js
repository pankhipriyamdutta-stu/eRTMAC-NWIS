const Alert = require('../models/Alert');
const { createEvent } = require('./eventService');

// Store last alert times to implement cooldowns (prevent thousands of alerts)
const alertCooldowns = new Map();

const createAlert = async (wellId, deviceId, ruleId, message, severity, parameter, value, threshold, recommendation, io) => {
  try {
    const cooldownKey = `${wellId}-${ruleId}-${parameter}`;
    const lastAlertTime = alertCooldowns.get(cooldownKey) || 0;
    const now = Date.now();
    
    // Cooldown of 60 seconds per specific rule/parameter combination
    if (now - lastAlertTime > 60000) {
      alertCooldowns.set(cooldownKey, now);

      const alert = new Alert({
        alertId: `ALT-${Date.now()}`,
        wellId,
        ruleId,
        message,
        severity,
        status: 'OPEN',
        parameter,
        value,
        threshold,
        recommendation
      });
      
      await alert.save();
      
      if (io) {
        io.emit('alert:new', alert);
      }

      await createEvent('ALERT_CREATED', wellId, deviceId, `Created ${severity} alert: ${message}`, io);

      return alert;
    }
    return null; // Suppressed due to cooldown
  } catch (error) {
    console.error('Error creating alert:', error.message);
    return null;
  }
};

const acknowledgeAlert = async (alertId, userId, io) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { alertId },
      { status: 'ACKNOWLEDGED', acknowledgedBy: userId, acknowledgedAt: new Date() },
      { new: true }
    );

    if (alert && io) {
      io.emit('alert:update', alert);
      await createEvent('ALERT_ACKNOWLEDGED', alert.wellId, null, `Alert ${alertId} acknowledged by user ${userId}`, io, userId);
    }
    
    return alert;
  } catch (error) {
    console.error('Error acknowledging alert:', error.message);
  }
};

const resolveAlert = async (alertId, io) => {
    try {
      const alert = await Alert.findOneAndUpdate(
        { alertId },
        { status: 'RESOLVED' },
        { new: true }
      );
  
      if (alert && io) {
        io.emit('alert:update', alert);
      }
      
      return alert;
    } catch (error) {
      console.error('Error resolving alert:', error.message);
    }
  };

module.exports = { createAlert, acknowledgeAlert, resolveAlert };
