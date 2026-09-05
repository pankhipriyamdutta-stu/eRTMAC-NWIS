const mqtt = require('mqtt');
const readline = require('readline');

const MQTT_BROKER = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const WELL_ID = process.env.WELL_ID || 'OIL-NHK-542';
const DEVICE_ID = 'D001';
const ACTUATOR_ID = 'A001';

// NORMAL, STICKING, VIBRATION, KICK, LOST_CIRCULATION, COLLISION, LITHOLOGY, OFFLINE
let mode = 'NORMAL'; 
let pumpStatus = 'ON';

// State variables for Oil India Limited Naharkatiya-542
let state = {
  pressure: 3120,
  temperature: 88.5,
  flowin: 580,
  flowout: 582,
  mudvolume: 1420,
  rpm: 120,
  torque: 5200,
  wob: 24.5,
  rop: 22.4,
  spp: 3080,
  hookload: 188,
  vibration: 0.65,
  gammaray: 48.5,
  resistivity: 38.2,
  depth: 10648,
  timeInMode: 0
};

console.log(`Simulator starting... connecting to ${MQTT_BROKER}`);

const client = mqtt.connect(MQTT_BROKER, {
  clientId: `ertmac-sim-${Math.random().toString(16).substr(2, 8)}`,
  clean: true,
  reconnectPeriod: 1000
});

client.on('connect', () => {
  console.log('Connected to MQTT Broker.');
  client.subscribe(`ertmac/well/${WELL_ID}/actuator/${ACTUATOR_ID}/command`, (err) => {
    if (!err) console.log(`Subscribed to actuator commands for ${ACTUATOR_ID}`);
  });
  publishStatus('ONLINE');
  setInterval(publishTelemetry, 2000);
});

client.on('message', (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    if (topic.includes(`/actuator/${ACTUATOR_ID}/command`)) {
      console.log(`[COMMAND RECEIVED] ${payload.command}`);
      if (payload.command === 'PUMP_OFF') pumpStatus = 'OFF';
      else if (payload.command === 'PUMP_ON') pumpStatus = 'ON';
      
      const ackPayload = {
        commandId: payload.commandId,
        status: 'ONLINE',
        state: pumpStatus,
        timestamp: new Date().toISOString()
      };
      client.publish(`ertmac/well/${WELL_ID}/actuator/${ACTUATOR_ID}/status`, JSON.stringify(ackPayload));
      console.log(`[ACTUATOR ACK] Sent state: ${pumpStatus}`);
    }
  } catch (err) {
    console.error('Error parsing MQTT message:', err);
  }
});

function publishStatus(status) {
  if (client.connected) {
    const payload = { status, batteryLevel: 98, signalStrength: -65 };
    client.publish(`ertmac/well/${WELL_ID}/device/${DEVICE_ID}/status`, JSON.stringify(payload));
  }
}

function publishParam(param, value, unit) {
  const payload = {
    deviceId: DEVICE_ID,
    value: parseFloat(value.toFixed(2)),
    unit,
    timestamp: new Date().toISOString(),
    quality: 'GOOD',
    source: 'SIMULATOR'
  };
  client.publish(`ertmac/well/${WELL_ID}/sensor/${param}`, JSON.stringify(payload));
}

function addNoise(val, percent) {
  const noise = val * percent * (Math.random() - 0.5);
  return val + noise;
}

function publishTelemetry() {
  if (mode === 'OFFLINE') return;

  state.timeInMode++;
  state.depth += 0.01; // Drill progressing slowly

  if (pumpStatus === 'OFF') {
    state.flowin = 0;
    state.flowout = 0;
    state.spp = 0;
    state.rpm = 0;
    state.rop = 0;
  } else {
    // Normal baseline
    let target = {
      pressure: 2950, temperature: 150, flowin: 500, flowout: 500,
      mudvolume: 2000, rpm: 120, torque: 5000, wob: 30, rop: 50,
      spp: 3000, hookload: 250, vibration: 5, gammaray: 60, resistivity: 10
    };

    if (mode === 'NORMAL') {
      // Stay near baseline
    } else if (mode === 'STICKING') {
      // SPP increases, Hook Load decreases, Torque increases
      target.spp = 3000 + (state.timeInMode * 20); // gradually rise
      target.hookload = 250 - (state.timeInMode * 2); // gradually drop
      target.torque = 5000 + (state.timeInMode * 50); 
      target.rop = Math.max(0, 50 - state.timeInMode);
    } else if (mode === 'VIBRATION') {
      // RPM oscillates rapidly, vibration spikes
      target.rpm = 120 + (Math.sin(state.timeInMode) * 60); // High SSI
      target.vibration = 50 + (Math.random() * 30);
    } else if (mode === 'KICK') {
      // FlowOut > FlowIn, Mud Volume increases
      target.flowout = 500 + (state.timeInMode * 5);
      target.mudvolume = 2000 + (state.timeInMode * 10);
    } else if (mode === 'LOST_CIRCULATION') {
      // FlowOut < FlowIn, Mud volume decreases
      target.flowout = Math.max(0, 500 - (state.timeInMode * 10));
      target.mudvolume = Math.max(0, 2000 - (state.timeInMode * 20));
    } else if (mode === 'LITHOLOGY') {
      // Sudden shift in Gamma Ray and Resistivity
      target.gammaray = 120; // Shale
      target.resistivity = 2; // Low resistivity
    }

    // Apply targets with noise
    state.pressure = addNoise(target.pressure, 0.02);
    state.temperature = addNoise(target.temperature, 0.01);
    state.flowin = addNoise(target.flowin, 0.01);
    state.flowout = addNoise(target.flowout, 0.02);
    state.mudvolume = addNoise(target.mudvolume, 0.005);
    state.rpm = mode === 'VIBRATION' ? target.rpm : addNoise(target.rpm, 0.05);
    state.torque = addNoise(target.torque, 0.05);
    state.wob = addNoise(target.wob, 0.05);
    state.rop = addNoise(target.rop, 0.05);
    state.spp = addNoise(target.spp, 0.02);
    state.hookload = addNoise(target.hookload, 0.01);
    state.vibration = addNoise(target.vibration, 0.1);
    state.gammaray = addNoise(target.gammaray, 0.05);
    state.resistivity = addNoise(target.resistivity, 0.05);
  }

  if (client.connected) {
    publishParam('pressure', state.pressure, 'psi');
    publishParam('temperature', state.temperature, 'C');
    publishParam('flowin', state.flowin, 'gpm');
    publishParam('flowout', state.flowout, 'gpm');
    publishParam('mudvolume', state.mudvolume, 'bbl');
    publishParam('rpm', state.rpm, 'rpm');
    publishParam('torque', state.torque, 'ft-lbs');
    publishParam('wob', state.wob, 'klbs');
    publishParam('rop', state.rop, 'ft/hr');
    publishParam('spp', state.spp, 'psi');
    publishParam('hookload', state.hookload, 'klbs');
    publishParam('vibration', state.vibration, 'g');
    publishParam('gammaray', state.gammaray, 'API');
    publishParam('resistivity', state.resistivity, 'ohm-m');
    publishParam('depth', state.depth, 'ft');
    console.log(`[TELEMETRY] Mode: ${mode} | SPP: ${state.spp.toFixed(0)} | FlowOut: ${state.flowout.toFixed(0)} | RPM: ${state.rpm.toFixed(0)}`);
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("Commands: normal, sticking, vibration, kick, lost_circulation, collision, lithology, offline");
rl.on('line', (line) => {
  const cmd = line.trim().toUpperCase();
  const validModes = ['NORMAL', 'STICKING', 'VIBRATION', 'KICK', 'LOST_CIRCULATION', 'COLLISION', 'LITHOLOGY', 'OFFLINE'];
  if (validModes.includes(cmd)) {
    mode = cmd;
    state.timeInMode = 0;
    if (cmd === 'OFFLINE') publishStatus('OFFLINE');
    else if (cmd === 'NORMAL') { pumpStatus = 'ON'; publishStatus('ONLINE'); }
    console.log(`Mode set to: ${mode}`);
  } else {
    console.log(`Invalid mode. Try one of: ${validModes.join(', ')}`);
  }
});

// Process arguments (for testing/automation)
const args = process.argv.slice(2);
args.forEach(arg => {
  if (arg.startsWith('--mode=')) {
    const argMode = arg.split('=')[1].toUpperCase();
    if (['NORMAL', 'STICKING', 'VIBRATION', 'KICK', 'LOST_CIRCULATION', 'COLLISION', 'LITHOLOGY', 'OFFLINE'].includes(argMode)) {
      mode = argMode;
      console.log(`Started in mode: ${mode}`);
    }
  }
});
