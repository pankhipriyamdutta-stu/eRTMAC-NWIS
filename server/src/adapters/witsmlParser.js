/**
 * Prototype WITSML Parser (Academic Demo)
 * Simulates the ingestion of WITSML XML data into the normalized telemetry pipeline.
 */
const { validateTelemetry } = require('../services/telemetryService');

const parseWITSML = async (xmlString, io) => {
  // In a real application, we would use an XML parser like fast-xml-parser or xml2js
  // For the prototype, we simulate extraction of a well log or logCurveInfo
  
  console.log("Parsing simulated WITSML XML...");
  
  // Dummy data extraction simulation
  const dummyWellId = "W001";
  const dummyDeviceId = "D_WITSML_01";
  const timestamp = new Date().toISOString();
  
  const simulatedData = [
    { parameter: 'depth', value: 10500.5, unit: 'ft' },
    { parameter: 'rop', value: 45.2, unit: 'ft/hr' },
    { parameter: 'wob', value: 25.1, unit: 'klbs' }
  ];

  const results = [];
  
  for (let point of simulatedData) {
    const payload = {
      deviceId: dummyDeviceId,
      value: point.value,
      unit: point.unit,
      timestamp: timestamp,
      source: 'WITSML_ADAPTER'
    };
    
    // Normalize and validate
    const validation = await validateTelemetry(payload, dummyWellId, point.parameter, io);
    if (validation.valid) {
      results.push(validation.normalizedData);
    }
  }
  
  return results;
};

module.exports = { parseWITSML };
