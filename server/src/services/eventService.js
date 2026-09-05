const Event = require('../models/Event');

const createEvent = async (type, wellId, deviceId, details, io, userId = null, metadata = {}) => {
  try {
    const event = new Event({
      type,
      wellId,
      deviceId,
      userId,
      details,
      metadata
    });
    
    await event.save();
    
    if (io) {
      io.emit('event:new', event);
    }
    
    return event;
  } catch (error) {
    console.error('Error creating event:', error.message);
  }
};

module.exports = { createEvent };
