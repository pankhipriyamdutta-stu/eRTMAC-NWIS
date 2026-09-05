const Device = require('../models/Device');
const { createEvent } = require('./eventService');

// Heartbeat timeout (e.g. 10 seconds for demo)
const HEARTBEAT_TIMEOUT_MS = process.env.HEARTBEAT_TIMEOUT || 10000;

const updateDeviceStatus = async (wellId, deviceId, status, payload, io) => {
  try {
    const prevDevice = await Device.findOne({ deviceId });
    const isStatusChange = !prevDevice || prevDevice.status !== status;

    const device = await Device.findOneAndUpdate(
      { deviceId },
      { 
        wellId, 
        status: status, 
        lastSeen: new Date(),
        batteryLevel: payload.batteryLevel,
        signalStrength: payload.signalStrength,
        type: payload.type || 'SENSOR'
      },
      { upsert: true, new: true }
    );
    
    if (isStatusChange && io) {
      await createEvent(
        status === 'ONLINE' ? 'DEVICE_ONLINE' : 'DEVICE_OFFLINE', 
        wellId, 
        deviceId, 
        `Device ${deviceId} is now ${status}`, 
        io
      );
      io.emit('device:update', device);
    }
    
    return device;
  } catch (error) {
    console.error('Error updating device status:', error.message);
  }
};

const updateDeviceLastSeen = async (deviceId) => {
    try {
      await Device.findOneAndUpdate(
        { deviceId },
        { lastSeen: new Date(), status: 'ONLINE' }
      );
    } catch (error) {
      console.error('Error updating device last seen:', error.message);
    }
}

// Background job to check for offline devices
const checkOfflineDevices = async (io) => {
  try {
    const threshold = new Date(Date.now() - HEARTBEAT_TIMEOUT_MS);
    const offlineDevices = await Device.find({
      status: 'ONLINE',
      lastSeen: { $lt: threshold }
    });

    for (let device of offlineDevices) {
      device.status = 'OFFLINE';
      await device.save();
      
      if (io) {
        await createEvent(
          'DEVICE_OFFLINE', 
          device.wellId, 
          device.deviceId, 
          `Device ${device.deviceId} went OFFLINE (timeout)`, 
          io
        );
        io.emit('device:update', device);
      }
    }
  } catch (error) {
    console.error('Error checking offline devices:', error.message);
  }
};

const startDeviceMonitor = (io) => {
  setInterval(() => checkOfflineDevices(io), 5000); // Check every 5 seconds
};

module.exports = { updateDeviceStatus, updateDeviceLastSeen, startDeviceMonitor };
