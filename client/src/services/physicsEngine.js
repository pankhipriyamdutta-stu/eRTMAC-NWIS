/**
 * Petroleum Engineering Physics & Mathematics Engine
 * Adheres to SPE (Society of Petroleum Engineers) and IADC standard calculations.
 */

/**
 * Mechanical Specific Energy (Teale's Equation, 1965)
 * MSE = (WOB / A_bit) + (120 * π * RPM * Torque) / (A_bit * ROP)
 * @param {number} wobKlbs - Weight on Bit in klbs
 * @param {number} rpm - Rotary speed in rev/min
 * @param {number} torqueFtLbs - Torque in ft-lbs
 * @param {number} ropMhr - Rate of Penetration in m/hr
 * @param {number} bitDiameterIn - Bit diameter in inches (default 8.5)
 * @returns {object} { msePsi, mseMpa, efficiencyPct, risk }
 */
export function calculateMSE(wobKlbs, rpm, torqueFtLbs, ropMhr, bitDiameterIn = 8.5) {
  const ropFtHr = Math.max(0.1, ropMhr * 3.28084);
  const bitAreaSqIn = (Math.PI / 4) * Math.pow(bitDiameterIn, 2);
  const wobLbs = Math.max(0, wobKlbs * 1000);

  // Axial component (WOB / A_bit)
  const axialComponent = wobLbs / bitAreaSqIn;

  // Rotary / Torsional component
  const rotaryComponent = (120 * Math.PI * rpm * torqueFtLbs) / (bitAreaSqIn * ropFtHr);

  const totalMSE = axialComponent + rotaryComponent;
  const mseMpa = totalMSE * 0.00689476;

  // Apparent rock compressive strength benchmark for Upper Assam Sandstones (~7,500 psi)
  const baselineRockStrength = 7500;
  const efficiency = Math.min(100, Math.max(5, (baselineRockStrength / totalMSE) * 100));

  let risk = 'OPTIMAL';
  if (totalMSE > 65000) risk = 'CRITICAL_INEFFICIENCY'; // Bit balling or severe dull
  else if (totalMSE > 42000) risk = 'ELEVATED';

  return {
    msePsi: Math.round(totalMSE),
    mseMpa: parseFloat(mseMpa.toFixed(1)),
    efficiencyPct: parseFloat(efficiency.toFixed(1)),
    axialPct: parseFloat(((axialComponent / totalMSE) * 100).toFixed(1)),
    rotaryPct: parseFloat(((rotaryComponent / totalMSE) * 100).toFixed(1)),
    risk
  };
}

/**
 * Equivalent Circulating Density (ECD)
 * ECD = MudWeight + (ΔP_annular / (0.052 * TVD))
 * @param {number} mudWeightPpg - Static mud weight in ppg
 * @param {number} tvdMeters - True Vertical Depth in meters
 * @param {number} flowRateGpm - Circulation rate in GPM
 * @param {number} holeDiameterIn - Wellbore diameter in inches
 * @param {number} pipeDiameterIn - Drill pipe OD in inches (default 5.0)
 * @returns {object} { ecdPpg, annularLossPsi, surgeMargin, swabMargin }
 */
export function calculateECD(mudWeightPpg, tvdMeters, flowRateGpm, holeDiameterIn = 8.5, pipeDiameterIn = 5.0) {
  const tvdFt = Math.max(100, tvdMeters * 3.28084);

  // Annular velocity (ft/min) = (24.51 * Q) / (Dh^2 - Dp^2)
  const dh2MinusDp2 = Math.max(1, Math.pow(holeDiameterIn, 2) - Math.pow(pipeDiameterIn, 2));
  const annularVelocityFtMin = (24.51 * flowRateGpm) / dh2MinusDp2;

  // Bingham plastic / Power law annular friction loss approximation:
  // ΔP_annular (psi) ~ (f * ρ * Va^2 * L) / (25.8 * (Dh - Dp))
  const dhMinusDp = Math.max(0.5, holeDiameterIn - pipeDiameterIn);
  const frictionFactor = 0.008; // typical turbulent/laminar transition
  const annularLossPsi = (frictionFactor * mudWeightPpg * Math.pow(annularVelocityFtMin / 60, 1.8) * tvdFt) / (25.8 * dhMinusDp);

  const ecdDelta = annularLossPsi / (0.052 * tvdFt);
  const totalECD = mudWeightPpg + ecdDelta;

  return {
    ecdPpg: parseFloat(totalECD.toFixed(2)),
    annularLossPsi: Math.round(annularLossPsi),
    annularVelocityFtMin: Math.round(annularVelocityFtMin),
    surgeMarginPpg: parseFloat((totalECD + 0.35).toFixed(2)),
    swabMarginPpg: parseFloat((mudWeightPpg - ecdDelta).toFixed(2))
  };
}

/**
 * Corrected d-Exponent (Jorden & Shirley, 1966)
 * Used in real-time logging to detect transition into abnormal / overpressured pore fluid zones.
 * @param {number} ropMhr - ROP in m/hr
 * @param {number} rpm - RPM
 * @param {number} wobKlbs - WOB in klbs
 * @param {number} bitDiameterIn - Bit diameter in inches
 * @param {number} actualMudWeightPpg - Actual mud weight in ppg
 * @param {number} normalMudWeightPpg - Normal pore pressure equivalent (default 8.65 ppg for Upper Assam)
 * @returns {object} { dExponent, dcs, porePressureRisk }
 */
export function calculateDcs(ropMhr, rpm, wobKlbs, bitDiameterIn = 8.5, actualMudWeightPpg = 10.4, normalMudWeightPpg = 8.65) {
  const ropFtHr = Math.max(0.1, ropMhr * 3.28084);
  const wobLbs = Math.max(100, wobKlbs * 1000);
  const safeRpm = Math.max(10, rpm);

  // d = log10( ROP / (60 * N) ) / log10( 12 * WOB / (10^6 * Db) )
  const numerator = Math.log10(ropFtHr / (60 * safeRpm));
  const denominator = Math.log10((12 * wobLbs) / (1e6 * bitDiameterIn));

  let d = 1.0;
  if (denominator !== 0) {
    d = numerator / denominator;
  }

  // Correct for actual vs normal mud density
  const dcs = d * (normalMudWeightPpg / actualMudWeightPpg);

  // If dcs significantly drops while drilling shale, it indicates overpressure ramp
  let porePressureRisk = 'NORMAL_HYDROSTATIC';
  if (dcs < 1.15) porePressureRisk = 'HIGH_OVERPRESSURE_RAMP';
  else if (dcs < 1.35) porePressureRisk = 'MODERATE_PRESSURE_TRANSITION';

  return {
    dExponent: parseFloat(d.toFixed(3)),
    dcs: parseFloat(dcs.toFixed(3)),
    porePressureRisk
  };
}

/**
 * Bit Hydraulics & Jet Impact Force
 * @param {number} sppPsi - Standpipe Pressure in psi
 * @param {number} flowRateGpm - Flow Rate in GPM
 * @param {number} mudWeightPpg - Mud weight in ppg
 * @param {number} bitDiameterIn - Bit diameter in inches
 * @param {Array<number>} nozzlesIn32nds - Nozzle sizes in 32nds of an inch (e.g. [12, 12, 12])
 * @returns {object} { hhp, hsi, jetVelocityFtSec, jetImpactForceLbf, bitPressureDropPsi }
 */
export function calculateBitHydraulics(sppPsi, flowRateGpm, mudWeightPpg = 10.4, bitDiameterIn = 8.5, nozzlesIn32nds = [12, 12, 12]) {
  // Total Flow Area (TFA) = sum( (π/4) * (d_n / 32)^2 )
  const tfa = nozzlesIn32nds.reduce((sum, n) => sum + (Math.PI / 4) * Math.pow(n / 32, 2), 0);
  const bitArea = (Math.PI / 4) * Math.pow(bitDiameterIn, 2);

  // Hydraulic Horsepower: HHP = (SPP * Q) / 1714
  const totalHhp = (sppPsi * flowRateGpm) / 1714;
  const hsi = totalHhp / bitArea;

  // Bit pressure drop: ΔP_bit = (MW * Q^2) / (10858 * TFA^2)
  const bitPressureDrop = (mudWeightPpg * Math.pow(flowRateGpm, 2)) / (10858 * Math.pow(tfa, 2));
  const bitHhp = (bitPressureDrop * flowRateGpm) / 1714;

  // Jet nozzle velocity (ft/sec) = (0.32 * Q) / TFA
  const nozzleVelocityFtSec = (0.3208 * flowRateGpm) / tfa;

  // Jet Impact Force: JIF = 0.01823 * Cd * Q * sqrt(MW * ΔP_bit) (Cd ~ 0.95)
  const jifLbf = 0.01823 * 0.95 * flowRateGpm * Math.sqrt(mudWeightPpg * bitPressureDrop);

  return {
    tfaSqIn: parseFloat(tfa.toFixed(3)),
    totalHhp: Math.round(totalHhp),
    bitHhp: Math.round(bitHhp),
    hsi: parseFloat(hsi.toFixed(2)),
    nozzleVelocityFtSec: Math.round(nozzleVelocityFtSec),
    jetImpactForceLbf: Math.round(jifLbf),
    bitPressureDropPsi: Math.round(bitPressureDrop)
  };
}

/**
 * Stick-Slip Severity Index (SSI)
 * SSI = (RPM_max - RPM_min) / (2 * RPM_mean) * 100%
 * @param {Array<number>} rpmHistory - Array of high-frequency RPM samples
 * @returns {object} { ssiPct, maxRpm, minRpm, meanRpm, severity }
 */
export function calculateSSI(rpmHistory) {
  if (!rpmHistory || rpmHistory.length < 5) {
    return { ssiPct: 15.0, severity: 'SMOOTH' };
  }
  const max = Math.max(...rpmHistory);
  const min = Math.min(...rpmHistory);
  const mean = rpmHistory.reduce((a, b) => a + b, 0) / rpmHistory.length;

  if (mean <= 0) return { ssiPct: 0, severity: 'STATIC' };

  const ssi = ((max - min) / (2 * mean)) * 100;
  let severity = 'SMOOTH';
  if (ssi > 100) severity = 'CRITICAL_FULL_STALL';
  else if (ssi > 50) severity = 'MODERATE_TORSIONAL_OSCILLATION';

  return {
    ssiPct: parseFloat(ssi.toFixed(1)),
    maxRpm: Math.round(max),
    minRpm: Math.round(min),
    meanRpm: Math.round(mean),
    severity
  };
}

/**
 * Flow Differential & Kick / Lost Circulation Monitor
 * @param {number} flowInGpm - Standpipe flow rate in GPM
 * @param {number} flowOutGpm - Return line flow rate in GPM
 * @returns {object} { deltaFlowGpm, status, message }
 */
export function evaluateFlowBalance(flowInGpm, flowOutGpm) {
  const delta = flowOutGpm - flowInGpm;

  let status = 'BALANCED';
  let message = 'Flow loop in equilibrium';

  if (delta > 15) {
    status = 'KICK_WARNING';
    message = `INFLUX ALERT: Flow Out exceeds Flow In by ${delta.toFixed(1)} GPM. Formation fluid entering wellbore!`;
  } else if (delta < -15) {
    status = 'LOST_CIRCULATION';
    message = `THIEF ZONE ALERT: Flow Out deficient by ${Math.abs(delta).toFixed(1)} GPM. Loss of drilling mud to formation!`;
  }

  return {
    deltaFlowGpm: parseFloat(delta.toFixed(1)),
    status,
    message
  };
}
