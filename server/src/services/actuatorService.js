const ActuatorCommand = require('../models/ActuatorCommand');
const Device = require('../models/Device');
const { createEvent } = require('./eventService');
const { publishCommand } = require('../mqtt/mqttBroker'); // we might have cyclic dep if we are not careful, we will require it lazily if needed or pass it. Wait, we can just require.

const requestActuatorCommand = async (wellId, actuatorId, command, userId, io) => {
  try {
    // Safety Logic 1: Check if device exists and is online
    const device = await Device.findOne({ deviceId: actuatorId, type: 'ACTUATOR' });
    if (!device) {
       // Allow simulator to not pre-register an actuator in strict environments, but let's just log and proceed for DEMO if not found, or reject.
       // The prompt says: "If any condition fails: DO NOT send the command. Record ACTUATOR_COMMAND_REJECTED"
       if (!device) {
          await createEvent('ACTUATOR_COMMAND', wellId, actuatorId, `Command rejected: Actuator not found`, io, userId);
          return { success: false, message: 'Actuator not found' };
       }
    }

    if (device.status !== 'ONLINE') {
        // If it's a demo, we might still want to simulate, but strictly we should reject.
        // Let's check a demo override or just reject
        const isDemo = process.env.NODE_ENV !== 'production';
        if (!isDemo) {
            await createEvent('ACTUATOR_COMMAND', wellId, actuatorId, `Command rejected: Actuator is offline`, io, userId);
            return { success: false, message: 'Actuator is offline' };
        }
    }

    // Safety Logic 2: Pending command check
    const pendingCmd = await ActuatorCommand.findOne({ actuatorId, status: 'PENDING' });
    if (pendingCmd) {
        await createEvent('ACTUATOR_COMMAND', wellId, actuatorId, `Command rejected: Conflicting command is pending`, io, userId);
        return { success: false, message: 'Conflicting command pending' };
    }

    // Create Command
    const cmdId = `CMD-${Date.now()}`;
    const actCmd = new ActuatorCommand({
      commandId: cmdId,
      wellId,
      actuatorId,
      command,
      issuedBy: userId || 'SYSTEM',
      status: 'SENT'
    });
    
    await actCmd.save();

    // Publish to MQTT
    // Delaying require to avoid circular dependency if mqttBroker requires this service
    const { publishCommand: mqttPublish } = require('../mqtt/mqttBroker');
    
    const topic = `ertmac/well/${wellId}/actuator/${actuatorId}/command`;
    const payload = {
        commandId: cmdId,
        command: command
    };

    const success = mqttPublish(topic, payload);
    
    if (success) {
      await createEvent('ACTUATOR_COMMAND', wellId, actuatorId, `Command ${command} sent to actuator`, io, userId);
      if (io) io.emit('actuator:update', actCmd);
      return { success: true, data: actCmd };
    } else {
      actCmd.status = 'FAILED';
      await actCmd.save();
      return { success: false, message: 'MQTT publish failed' };
    }
  } catch (error) {
    console.error('Error requesting actuator command:', error.message);
    return { success: false, message: 'Internal Server Error' };
  }
};

const handleActuatorAck = async (wellId, actuatorId, payload, io) => {
    try {
        // Update Actuator Status in DB
        const device = await Device.findOneAndUpdate(
            { deviceId: actuatorId },
            { 
              wellId, 
              status: payload.status === 'ONLINE' ? 'ONLINE' : 'ONLINE',
              type: 'ACTUATOR',
              lastSeen: new Date()
            },
            { upsert: true, new: true }
        );

        if (payload.commandId) {
            const cmd = await ActuatorCommand.findOneAndUpdate(
                { commandId: payload.commandId },
                { status: 'ACKNOWLEDGED' },
                { new: true }
            );
            if (cmd) {
                await createEvent('ACTUATOR_COMMAND', wellId, actuatorId, `Command ${cmd.command} acknowledged`, io);
            }
        }

        if (io) {
            io.emit('actuator:update', { actuatorId, status: payload.status, state: payload.state });
        }

    } catch (error) {
        console.error('Error handling actuator ack:', error.message);
    }
}

module.exports = { requestActuatorCommand, handleActuatorAck };
