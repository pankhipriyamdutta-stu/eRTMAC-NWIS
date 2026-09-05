const Rule = require('../models/Rule');
const { createAlert } = require('./alertService');
const { requestActuatorCommand } = require('./actuatorService');
const { createEvent } = require('./eventService');
const { calculateMSE } = require('./physics/drillingMechanics');
const { calculateFlowDelta, calculateECD } = require('./physics/wellControl');

// State to track persistence of conditions
const stateStore = {};

const checkCooldown = (rule) => {
  if (!rule.lastTriggered) return true;
  const now = new Date();
  const diff = (now - rule.lastTriggered) / 1000;
  return diff >= (rule.cooldown || 60);
};

const evaluateRules = async (reading, io, mqttClient) => {
  try {
    const wellId = reading.wellId;
    if (!stateStore[wellId]) {
      stateStore[wellId] = {
        history: {},
        conditions: {}
      };
    }
    
    // Store latest reading in history
    stateStore[wellId].history[reading.parameter] = reading.value;

    const state = stateStore[wellId].history;

    // Evaluate Complex Rules every time telemetry arrives, but debounce
    const rules = await Rule.find({ enabled: true });
    
    for (let rule of rules) {
      let triggered = false;
      let msg = '';
      
      // Simple Rules
      if (rule.parameter && reading.parameter === rule.parameter) {
        switch (rule.condition) {
          case '>': triggered = reading.value > rule.threshold; break;
          case '<': triggered = reading.value < rule.threshold; break;
          case '>=': triggered = reading.value >= rule.threshold; break;
          case '<=': triggered = reading.value <= rule.threshold; break;
          case '==': triggered = reading.value === rule.threshold; break;
          case '!=': triggered = reading.value !== rule.threshold; break;
        }
        if (triggered) {
          msg = `${rule.name}: ${reading.parameter} is ${reading.value} (Threshold: ${rule.condition} ${rule.threshold})`;
        }
      } 
      // Complex Rules
      else {
        if (rule.ruleId === 'R001_PIPE_STICKING') {
          // SPP > 3100 AND Hook Load < 240 AND Torque > 5500
          if (state.spp > 3100 && state.hookload < 240 && state.torque > 5500) {
            triggered = true;
            msg = `PIPE STICKING WARNING: SPP High (${state.spp}), Hook Load Low (${state.hookload}), Torque High (${state.torque})`;
          }
        }
        else if (rule.ruleId === 'R003_KICK') {
          if (state.flowout > (state.flowin + 10) && state.mudvolume > 2050) {
            triggered = true;
            msg = `KICK ALARM: FlowOut (${state.flowout}) > FlowIn (${state.flowin}) and Mud Volume Rising (${state.mudvolume})`;
          }
        }
        else if (rule.ruleId === 'R004_LOST_CIRCULATION') {
          if (state.flowout < (state.flowin - 10) && state.mudvolume < 1950) {
            triggered = true;
            msg = `LOST CIRCULATION WARNING: FlowOut (${state.flowout}) < FlowIn (${state.flowin})`;
          }
        }
      }

      // Persistence logic
      if (triggered) {
        const condKey = `${wellId}_${rule.ruleId}`;
        if (!stateStore[wellId].conditions[condKey]) {
           stateStore[wellId].conditions[condKey] = new Date();
        }
        const timeInState = (new Date() - stateStore[wellId].conditions[condKey]) / 1000;
        
        if (timeInState >= (rule.duration || 0)) {
          // Check cooldown
          if (checkCooldown(rule)) {
            rule.lastTriggered = new Date();
            await rule.save();

            const alert = await createAlert(
                reading.wellId, 
                reading.deviceId, 
                rule.ruleId, 
                msg, 
                rule.severity, 
                reading.parameter || 'MULTIPLE', 
                reading.value || 0, 
                rule.threshold || 0, 
                "Investigate IMMEDIATELY", 
                io
            );

            if (alert) {
              io.emit('rule:triggered', { rule, reading });
              await createEvent('RULE_TRIGGERED', reading.wellId, reading.deviceId, `Rule ${rule.ruleId} triggered: ${alert.message}`, io);

              if (rule.action === 'PUMP_OFF') {
                 await requestActuatorCommand(reading.wellId, 'A001', 'PUMP_OFF', 'SYSTEM', io);
              }
            }
          }
        }
      } else {
        // Reset persistence timer
        delete stateStore[wellId].conditions[`${wellId}_${rule.ruleId}`];
      }
    }

    // Run Physics Engine and emit results
    if (state.wob && state.rpm && state.torque && state.rop) {
       const mech = calculateMSE(state.wob, state.rpm, state.torque, state.rop);
       io.emit('physics:drillingMechanics', { wellId, ...mech });
    }
    
    if (state.flowin && state.flowout) {
       const flowDelta = calculateFlowDelta(state.flowin, state.flowout);
       io.emit('physics:flowDelta', { wellId, delta: flowDelta });
    }

  } catch (error) {
    console.error('Error evaluating rules:', error.message);
  }
};

module.exports = { evaluateRules };
