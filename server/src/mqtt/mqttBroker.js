const mqtt = require('mqtt');
const { handleTelemetryMessage } = require('./mqttSubscriber');
const { setMqttStatus } = require('../services/systemHealthService');

let mqttClient = null;
let aedesBroker = null;

const startEmbeddedBroker = (port = 1883) => {
  try {
    const aedes = require('aedes')();
    const serverFactory = require('aedes-server-factory');
    aedesBroker = serverFactory.createServer(aedes);
    aedesBroker.listen(port, () => {
      console.log(`[ZERO-DEPENDENCY] Embedded Aedes MQTT Broker listening on port ${port}`);
    });
    aedesBroker.on('error', (err) => {
      // Port already in use by external Mosquitto or previous instance - perfectly fine
    });
  } catch (err) {
    console.warn(`[AEDES] Notice: ${err.message}`);
  }
};

const initMQTT = (io) => {
  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
  
  if (brokerUrl.includes('localhost') || brokerUrl.includes('127.0.0.1')) {
    startEmbeddedBroker(1883);
  }

  const options = {
    clientId: `ertmac-backend-${Math.random().toString(16).substr(2, 8)}`,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1500,
  };
  if (process.env.MQTT_USERNAME) options.username = process.env.MQTT_USERNAME;
  if (process.env.MQTT_PASSWORD) options.password = process.env.MQTT_PASSWORD;

  mqttClient = mqtt.connect(brokerUrl, options);

  mqttClient.on('connect', () => {
    console.log(`Connected to MQTT Broker at ${brokerUrl}`);
    setMqttStatus(true);
    // Subscribe to all well telemetry topics
    mqttClient.subscribe('ertmac/well/+/sensor/+', (err) => {
      if (err) console.error('MQTT Subscription error:', err);
      else console.log('Subscribed to ertmac/well/+/sensor/+');
    });

    // Subscribe to device status topics
    mqttClient.subscribe('ertmac/well/+/device/+/status', (err) => {
      if (err) console.error('MQTT Subscription error:', err);
      else console.log('Subscribed to ertmac/well/+/device/+/status');
    });

    // Subscribe to actuator status topics
    mqttClient.subscribe('ertmac/well/+/actuator/+/status', (err) => {
      if (err) console.error('MQTT Subscription error:', err);
      else console.log('Subscribed to ertmac/well/+/actuator/+/status');
    });
  });

  mqttClient.on('message', async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      await handleTelemetryMessage(topic, payload, io, mqttClient);
    } catch (err) {
      console.error('Error processing MQTT message:', err.message);
    }
  });

  mqttClient.on('error', (error) => {
    console.error('MQTT Connection Error:', error);
    setMqttStatus(false);
  });

  mqttClient.on('close', () => {
    setMqttStatus(false);
  });

  mqttClient.on('reconnect', () => {
    console.log('MQTT Reconnecting...');
  });
  
  return mqttClient;
};

const publishCommand = (topic, message) => {
  if (mqttClient && mqttClient.connected) {
    mqttClient.publish(topic, JSON.stringify(message));
    console.log(`Published command to ${topic}`);
    return true;
  }
  console.error('Cannot publish command: MQTT Client disconnected');
  return false;
};

module.exports = { initMQTT, publishCommand };
