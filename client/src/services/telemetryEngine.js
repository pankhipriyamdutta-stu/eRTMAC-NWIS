/**
 * Centralized Real-Time Telemetry & SCADA Office Engine
 * Coordinates live streaming from Oil India Limited (OIL) well telemetry feeds,
 * evaluates live petroleum engineering physics, and bridges with Socket.IO.
 */

import socket from './socket';
import { OIL_WELLS } from '../data/oilDatasets';
import {
  calculateMSE,
  calculateECD,
  calculateDcs,
  calculateBitHydraulics,
  calculateSSI,
  evaluateFlowBalance
} from './physicsEngine';

class TelemetryEngine {
  constructor() {
    this.activeWellId = 'OIL-NHK-542';
    this.listeners = new Set();
    this.history = [];
    this.maxHistoryLength = 60;
    this.isRunning = true;
    this.speedMultiplier = 1;
    this.operationalScenario = 'NORMAL'; // NORMAL, KICK_INFLUX, STICK_SLIP, BIT_BALLING, LOST_CIRCULATION
    this.scenarioElapsedSeconds = 0;
    this.timer = null;

    // Current live state initialized from active OIL well
    this.currentState = this._initializeState(this.activeWellId);

    // Track RPM history for Stick-Slip FFT calculation
    this.rpmHistory = Array(20).fill(this.currentState.rpm);

    // Subscribe to Socket.IO for server-side updates if online
    this._initSocketListeners();

    // Start internal high-frequency clock (1000ms base)
    this._startClock();
  }

  _initializeState(wellId) {
    const well = OIL_WELLS[wellId] || OIL_WELLS['OIL-NHK-542'];
    const p = well.nominalParams;

    const physics = calculateMSE(p.wob, p.rpm, p.torque, p.rop, well.bitSize);
    const ecdObj = calculateECD(well.mudWeight, well.currentDepthTVD, p.flowIn, well.bitSize);
    const dcsObj = calculateDcs(p.rop, p.rpm, p.wob, well.bitSize, well.mudWeight);
    const hydraulics = calculateBitHydraulics(p.spp, p.flowIn, well.mudWeight, well.bitSize);

    return {
      wellId: well.id,
      wellName: well.name,
      field: well.field,
      rig: well.rig,
      depthMD: well.currentDepthMD,
      depthTVD: well.currentDepthTVD,
      pressure: p.pressure,
      temperature: p.temperature,
      flowIn: p.flowIn,
      flowOut: p.flowOut,
      deltaFlow: parseFloat((p.flowOut - p.flowIn).toFixed(1)),
      mudVolume: p.mudVolume,
      rpm: p.rpm,
      bitRpm: p.rpm + 45, // Surface + PDM downhole motor
      torque: p.torque,
      wob: p.wob,
      rop: p.rop,
      spp: p.spp,
      hookLoad: p.hookLoad,
      vibrationAxial: p.vibrationAxial,
      vibrationLateral: p.vibrationLateral,
      vibrationTorsional: p.vibrationTorsional,
      ssiPct: p.vibrationTorsional,
      gammaRay: p.gammaRay,
      resistivityDeep: p.resistivityDeep,
      resistivityShallow: p.resistivityShallow,
      density: p.density,
      porosity: p.porosity,
      ecd: ecdObj.ecdPpg,
      mse: physics.msePsi,
      mseEfficiency: physics.efficiencyPct,
      dcs: dcsObj.dcs,
      hhp: hydraulics.totalHhp,
      jif: hydraulics.jetImpactForceLbf,
      flowStatus: 'BALANCED',
      systemHealth: 'HEALTHY',
      edgeStatus: 'ONLINE',
      edgeLatency: 9.4,
      actuatorStatus: 'ARMED',
      pumpStatus: 'ON',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  _initSocketListeners() {
    socket.on('sensor:update', (reading) => {
      if (reading && reading.parameter) {
        this.currentState[reading.parameter] = reading.value;
      }
    });

    socket.on('device:update', (data) => {
      if (data.deviceId === 'D001') {
        this.currentState.edgeStatus = data.status;
      }
    });

    socket.on('actuator:update', (data) => {
      if (data.actuatorId === 'A001') {
        this.currentState.pumpStatus = data.state || 'OFF';
      }
    });
  }

  _startClock() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.isRunning) {
        this._tick();
      }
    }, 1000 / this.speedMultiplier);
  }

  setSpeed(multiplier) {
    this.speedMultiplier = Math.max(0.5, Math.min(10, multiplier));
    this._startClock();
    this._notifyListeners();
  }

  setPlayPause(running) {
    this.isRunning = running;
    this._notifyListeners();
  }

  setActiveWell(wellId) {
    if (OIL_WELLS[wellId]) {
      this.activeWellId = wellId;
      this.operationalScenario = 'NORMAL';
      this.scenarioElapsedSeconds = 0;
      this.currentState = this._initializeState(wellId);
      this.history = [];
      this._notifyListeners();
    }
  }

  setScenario(scenario) {
    this.operationalScenario = scenario;
    this.scenarioElapsedSeconds = 0;
    this._notifyListeners();
  }

  _addNoise(val, percent) {
    return val + val * percent * (Math.random() - 0.5);
  }

  _tick() {
    this.scenarioElapsedSeconds++;
    const well = OIL_WELLS[this.activeWellId] || OIL_WELLS['OIL-NHK-542'];
    const p = well.nominalParams;

    // Slow drilling penetration rate
    const depthIncrement = (this.currentState.rop / 3600) * 0.05 * this.speedMultiplier;
    this.currentState.depthMD = parseFloat((this.currentState.depthMD + depthIncrement).toFixed(2));
    this.currentState.depthTVD = parseFloat((this.currentState.depthTVD + depthIncrement * 0.96).toFixed(2));

    let target = { ...p };

    // Apply Operational Scenarios
    if (this.operationalScenario === 'KICK_INFLUX') {
      // Formation influx entering wellbore:
      target.flowOut = p.flowOut + 12 + Math.min(45, this.scenarioElapsedSeconds * 1.5);
      target.mudVolume = p.mudVolume + Math.min(80, this.scenarioElapsedSeconds * 2.5);
      target.pressure = p.pressure + Math.min(350, this.scenarioElapsedSeconds * 8);
      target.spp = p.spp - Math.min(180, this.scenarioElapsedSeconds * 4); // Annular gas expansion
      target.gasUnits = 850 + this.scenarioElapsedSeconds * 25;
    } else if (this.operationalScenario === 'STICK_SLIP') {
      // Severe torsional drillstring resonance:
      const osc = Math.sin(this.scenarioElapsedSeconds * 1.8);
      target.rpm = Math.max(10, p.rpm + osc * 65);
      target.torque = p.torque + Math.abs(osc) * 2200;
      target.vibrationLateral = 2.4 + Math.random() * 1.2;
      target.vibrationTorsional = 88.0 + Math.random() * 15.0;
    } else if (this.operationalScenario === 'BIT_BALLING') {
      // Bit balling in sticky shale / clogged PDC cutters:
      target.rop = Math.max(2, p.rop - Math.min(18, this.scenarioElapsedSeconds * 0.6));
      target.torque = p.torque + Math.min(2500, this.scenarioElapsedSeconds * 60);
      target.spp = p.spp + Math.min(400, this.scenarioElapsedSeconds * 12);
    } else if (this.operationalScenario === 'LOST_CIRCULATION') {
      // Loss of mud to fractured vuggy zone:
      target.flowOut = Math.max(120, p.flowOut - Math.min(280, this.scenarioElapsedSeconds * 8));
      target.mudVolume = Math.max(800, p.mudVolume - Math.min(300, this.scenarioElapsedSeconds * 6));
    }

    // Apply realistic physical jitter and inertia
    this.currentState.pressure = Math.round(this._addNoise(target.pressure, 0.015));
    this.currentState.temperature = parseFloat(this._addNoise(target.temperature, 0.005).toFixed(1));
    this.currentState.flowIn = Math.round(this._addNoise(target.flowIn, 0.01));
    this.currentState.flowOut = Math.round(this._addNoise(target.flowOut, 0.015));
    this.currentState.deltaFlow = parseFloat((this.currentState.flowOut - this.currentState.flowIn).toFixed(1));
    this.currentState.mudVolume = Math.round(this._addNoise(target.mudVolume, 0.002));
    this.currentState.wob = parseFloat(this._addNoise(target.wob, 0.03).toFixed(1));
    this.currentState.rpm = Math.round(this._addNoise(target.rpm, 0.02));
    this.currentState.bitRpm = this.currentState.rpm + 45;
    this.currentState.torque = Math.round(this._addNoise(target.torque, 0.03));
    this.currentState.rop = parseFloat(this._addNoise(target.rop, 0.04).toFixed(1));
    this.currentState.spp = Math.round(this._addNoise(target.spp, 0.015));
    this.currentState.hookLoad = Math.round(this._addNoise(target.hookLoad, 0.01));
    this.currentState.vibrationAxial = parseFloat(this._addNoise(target.vibrationAxial, 0.08).toFixed(2));
    this.currentState.vibrationLateral = parseFloat(this._addNoise(target.vibrationLateral, 0.08).toFixed(2));
    this.currentState.gammaRay = parseFloat(this._addNoise(target.gammaRay, 0.04).toFixed(1));
    this.currentState.resistivityDeep = parseFloat(this._addNoise(target.resistivityDeep, 0.03).toFixed(1));
    this.currentState.resistivityShallow = parseFloat(this._addNoise(target.resistivityShallow, 0.03).toFixed(1));
    this.currentState.density = parseFloat(this._addNoise(target.density, 0.01).toFixed(2));
    this.currentState.porosity = parseFloat(this._addNoise(target.porosity, 0.02).toFixed(1));

    // Update RPM history buffer
    this.rpmHistory.push(this.currentState.rpm);
    if (this.rpmHistory.length > 20) this.rpmHistory.shift();

    // Re-evaluate engineering physics
    const ssiResult = calculateSSI(this.rpmHistory);
    this.currentState.ssiPct = ssiResult.ssiPct;
    this.currentState.vibrationTorsional = ssiResult.ssiPct;

    const mseResult = calculateMSE(
      this.currentState.wob,
      this.currentState.rpm,
      this.currentState.torque,
      this.currentState.rop,
      well.bitSize
    );
    this.currentState.mse = mseResult.msePsi;
    this.currentState.mseEfficiency = mseResult.efficiencyPct;

    const ecdResult = calculateECD(
      well.mudWeight,
      this.currentState.depthTVD,
      this.currentState.flowIn,
      well.bitSize
    );
    this.currentState.ecd = ecdResult.ecdPpg;

    const dcsResult = calculateDcs(
      this.currentState.rop,
      this.currentState.rpm,
      this.currentState.wob,
      well.bitSize,
      well.mudWeight
    );
    this.currentState.dcs = dcsResult.dcs;

    const hydraulics = calculateBitHydraulics(
      this.currentState.spp,
      this.currentState.flowIn,
      well.mudWeight,
      well.bitSize
    );
    this.currentState.hhp = hydraulics.totalHhp;
    this.currentState.jif = hydraulics.jetImpactForceLbf;

    const flowEval = evaluateFlowBalance(this.currentState.flowIn, this.currentState.flowOut);
    this.currentState.flowStatus = flowEval.status;

    // System health dynamically reflects abnormal physics
    if (flowEval.status === 'KICK_WARNING' || this.currentState.pressure > 4000 || ssiResult.severity === 'CRITICAL_FULL_STALL') {
      this.currentState.systemHealth = 'ALERT';
    } else if (this.operationalScenario !== 'NORMAL') {
      this.currentState.systemHealth = 'DEGRADED';
    } else {
      this.currentState.systemHealth = 'HEALTHY';
    }

    // Always ONLINE on Assam Rig-04 node unless deliberately disconnected
    this.currentState.edgeStatus = 'ONLINE';
    this.currentState.edgeLatency = parseFloat((8.5 + Math.random() * 2).toFixed(1));
    this.currentState.timestamp = new Date().toLocaleTimeString();

    // Record into time-series history
    this.history.push({
      timestamp: this.currentState.timestamp,
      pressure: this.currentState.pressure,
      spp: this.currentState.spp,
      torque: this.currentState.torque,
      rop: this.currentState.rop,
      wob: this.currentState.wob,
      rpm: this.currentState.rpm,
      flowIn: this.currentState.flowIn,
      flowOut: this.currentState.flowOut,
      deltaFlow: this.currentState.deltaFlow,
      mse: this.currentState.mse,
      ecd: this.currentState.ecd,
      vibrationLateral: this.currentState.vibrationLateral,
      ssiPct: this.currentState.ssiPct,
      gammaRay: this.currentState.gammaRay,
      stream1: this.currentState.pressure - 2800, // scaled for multivariant overlays
      stream2: this.currentState.torque / 20 - 200,
      stream3: this.currentState.spp - 2800,
      stream4: this.currentState.deltaFlow * 10
    });

    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }

    this._notifyListeners();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.currentState, this.history);
    return () => this.listeners.delete(callback);
  }

  _notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.currentState, this.history);
    }
  }

  getCurrentState() {
    return this.currentState;
  }

  getHistory() {
    return this.history;
  }
}

// Export singleton instance
export const telemetryEngine = new TelemetryEngine();
export default telemetryEngine;
