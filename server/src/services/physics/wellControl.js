const calculateFlowDelta = (flowIn, flowOut) => {
  if (flowIn === undefined || flowOut === undefined) return null;
  return parseFloat((flowOut - flowIn).toFixed(2));
};

const calculateECD = (depth, pressure, mudWeight = 10, annularPressureLoss = 200) => {
  // Academic Prototype ECD
  // ECD = MudWeight + (AnnularPressureLoss / (0.052 * TrueVerticalDepth))
  if (!depth || depth <= 0) return null;
  
  const ecd = mudWeight + (annularPressureLoss / (0.052 * depth));
  let riskLevel = 'LOW';
  
  // Demo limits
  if (ecd > 15) riskLevel = 'CRITICAL';
  else if (ecd > 13) riskLevel = 'HIGH';
  else if (ecd > 12) riskLevel = 'WARNING';

  return {
    ecd: parseFloat(ecd.toFixed(3)),
    pressureLoss: annularPressureLoss,
    density: mudWeight,
    riskLevel
  };
};

module.exports = { calculateFlowDelta, calculateECD };
