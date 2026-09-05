const calculateMSE = (wob, rpm, torque, rop, bitArea = 75) => {
  // Prevent NaN or Infinity
  if (!rop || rop <= 0) rop = 1; // prevent division by zero
  if (!bitArea || bitArea <= 0) bitArea = 75;
  if (wob === undefined || rpm === undefined || torque === undefined) return null;

  // MSE = (WOB / A_bit) + (120 × π × RPM × Torque) / (A_bit × ROP)
  const mse1 = (wob * 1000) / bitArea; // WOB is in klbs
  const mse2 = (120 * Math.PI * rpm * torque) / (bitArea * rop);
  const mse = mse1 + mse2;
  
  const baselineMSE = 30000; // Prototype baseline
  const deviation = ((mse - baselineMSE) / baselineMSE) * 100;
  
  let riskLevel = 'LOW';
  if (deviation > 50) riskLevel = 'CRITICAL';
  else if (deviation > 20) riskLevel = 'HIGH';
  else if (deviation > 10) riskLevel = 'WARNING';

  return {
    mse: parseFloat(mse.toFixed(2)),
    baselineMSE,
    deviation: parseFloat(deviation.toFixed(2)),
    riskLevel
  };
};

module.exports = { calculateMSE };
