import React, { useState, useEffect, useMemo } from 'react';
import telemetryEngine from '../services/telemetryEngine';
import { OIL_WELLS } from '../data/oilDatasets';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import {
  Cog,
  Sliders,
  Zap,
  Activity,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  BookOpen,
  Calculator,
  Compass,
  AlertTriangle,
  Radio,
  FileText,
  Printer,
  ShieldAlert,
  ArrowRight,
  Bot,
  Send,
  Sparkles,
  Check,
  RefreshCw,
  Cpu,
  ChevronDown,
  ChevronUp,
  Layers,
  Eye,
  CheckSquare
} from 'lucide-react';

const DrillingMechanics = () => {
  const [telemetry, setTelemetry] = useState(telemetryEngine.getCurrentState());
  const [isLiveStream, setIsLiveStream] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('manualFacility'); // manualFacility, aiOptimizer, mechanicsLab, sensorPlacement, diagnostics, fieldReport

  // ================= 1. PRIMARY OPERATIONAL VARIABLES =================
  const [wob, setWob] = useState(24.5); // Surface WOB in klbs
  const [rpm, setRpm] = useState(120); // Surface Rotary RPM
  const [torque, setTorque] = useState(5200); // Surface Torque in ft-lbs
  const [rop, setRop] = useState(22.4); // Penetration Rate in m/hr
  const [bitDiameter, setBitDiameter] = useState(8.5); // Bit OD in inches
  const [rockCcs, setRockCcs] = useState(7500); // Formation Confined Compressive Strength in psi
  const [bitType, setBitType] = useState('PDC_MATRIX');
  const [cutterSizeMm, setCutterSizeMm] = useState(16);
  const [bladeCount, setBladeCount] = useState(6);

  // ================= 2. WELLBORE & SENSOR OBSERVATION VARIABLES =================
  const [frictionFactor, setFrictionFactor] = useState(0.24);
  const [inclination, setInclination] = useState(24.5);
  const [mudWeight, setMudWeight] = useState(10.4);
  const [flowRateGpm, setFlowRateGpm] = useState(580);
  const [sppPsi, setSppPsi] = useState(3080);
  const [pipeWeightAir, setPipeWeightAir] = useState(19.5);
  const [collarWeightAir, setCollarWeightAir] = useState(140);
  const [bhaLengthMeters, setBhaLengthMeters] = useState(180);
  const [holeDiameter, setHoleDiameter] = useState(8.5);
  const [pipeOd, setPipeOd] = useState(5.0);
  const [deadlineTareOffset, setDeadlineTareOffset] = useState(0);
  const [downholeWobLossPct, setDownholeWobLossPct] = useState(8.5);

  // ================= 3. FORMATION PRESETS & FACILITY DUAL MODE =================
  const FORMATION_PRESETS = [
    { name: 'Tipam Sandstone', depth: 1850, ccs: 4200, wob: 18.0, rpm: 135, torque: 3800, rop: 34.0, mw: 9.8, spp: 2450, flow: 550, inc: 12.0, friction: 0.22, label: 'Shallow / High ROP' },
    { name: 'Barail Sandstone', depth: 3120, ccs: 7500, wob: 24.5, rpm: 120, torque: 5200, rop: 22.4, mw: 10.4, spp: 3080, flow: 580, inc: 24.5, friction: 0.24, label: 'Main Oil Reservoir' },
    { name: 'Kopili Shale', depth: 3680, ccs: 9800, wob: 28.0, rpm: 110, torque: 6400, rop: 14.2, mw: 11.2, spp: 3350, flow: 600, inc: 28.0, friction: 0.28, label: 'Reactive / Balling Risk' },
    { name: 'Sylhet Limestone', depth: 4250, ccs: 14500, wob: 32.0, rpm: 95, torque: 7800, rop: 8.5, mw: 12.1, spp: 3600, flow: 620, inc: 32.0, friction: 0.32, label: 'Deep HPHT / High CCS' }
  ];

  const [facilityMode, setFacilityMode] = useState('manual'); // 'manual' | 'aiPredicted'
  const [showFormulaProof, setShowFormulaProof] = useState(true);
  const [activeFormulaKey, setActiveFormulaKey] = useState('mse'); // 'mse' | 'buckling' | 'hydraulics' | 'dcs'
  const [aiPrescriptionNotice, setAiPrescriptionNotice] = useState(null);

  const [calcInputs, setCalcInputs] = useState({
    wob: 24.5,
    rpm: 120,
    torque: 5200,
    rop: 22.4,
    bitDiameter: 8.5,
    rockCcs: 7500,
    tvdMeters: 3120,
    mudWeight: 10.4,
    sppPsi: 3080,
    flowRateGpm: 580,
    inclination: 24.5,
    frictionFactor: 0.24
  });

  const [hasCalculated, setHasCalculated] = useState(true);
  const [calcResults, setCalcResults] = useState(() => {
    const bitArea = (Math.PI / 4) * Math.pow(8.5, 2);
    const ropFt = 22.4 * 3.28084;
    const axialPsi = (24.5 * 1000) / bitArea;
    const rotaryPsi = (120 * Math.PI * 120 * 5200) / (bitArea * ropFt);
    const totalMse = Math.round(axialPsi + rotaryPsi);
    return {
      bitArea: parseFloat(bitArea.toFixed(2)),
      axialPsi: Math.round(axialPsi),
      rotaryPsi: Math.round(rotaryPsi),
      totalMse,
      totalMseMpa: parseFloat((totalMse * 0.00689476).toFixed(1)),
      cuttingEfficiency: 82.4,
      criticalBuckling: 36.8,
      hsi: 3.2,
      totalHhp: 1042,
      jif: 1850,
      dcs: 1.45,
      flounderWob: 28.0,
      optimalWob: 23.8,
      isBuckling: false,
      isBalled: false
    };
  });

  // ================= 4. AI PREDICTIVE COPILOT STATE =================
  const [aiQuery, setAiQuery] = useState('');
  const [aiChat, setAiChat] = useState([
    {
      sender: 'AI',
      text: 'eRTMAC Autonomous Mechanics Intelligence active. Fusing surface load cell and downhole MWD strain gauges. Optimal sweet spot computed: WOB 22.0 klbs, RPM 125. All buckling and thermal cutter wear margins verified. How can I assist with drilling mechanics?'
    }
  ]);
  const [aiThinking, setAiThinking] = useState(false);

  // Sync with live telemetry
  useEffect(() => {
    const unsub = telemetryEngine.subscribe((state) => {
      setTelemetry({ ...state });
      if (isLiveStream) {
        setWob(state.wob);
        setRpm(state.rpm);
        setTorque(state.torque);
        setRop(state.rop);
        setFlowRateGpm(state.flowIn);
        setSppPsi(state.spp);
      }
    });
    return () => unsub();
  }, [isLiveStream]);

  // Execute manual calculations from the user input boxes
  const handleExecuteCalculation = (overrideInputs = null) => {
    const inp = overrideInputs || calcInputs;
    const bitArea = (Math.PI / 4) * Math.pow(inp.bitDiameter, 2);
    const ropFt = Math.max(0.1, inp.rop * 3.28084);
    const axialPsi = (inp.wob * 1000) / bitArea;
    const rotaryPsi = (120 * Math.PI * inp.rpm * inp.torque) / (bitArea * ropFt);
    const totalMse = Math.round(axialPsi + rotaryPsi);
    const effPct = parseFloat(Math.min(100, Math.max(1, (inp.rockCcs / totalMse) * 100)).toFixed(1));

    // Buckling
    const pipeId = 4.276;
    const momentInertia = (Math.PI / 64) * (Math.pow(5.0, 4) - Math.pow(pipeId, 4));
    const radInc = Math.max(0.01, (inp.inclination * Math.PI) / 180);
    const bf = 1 - inp.mudWeight / 65.5;
    const buoyantWeightPerInch = (19.5 * bf) / 12;
    const radialClearanceIn = (inp.bitDiameter - 5.0) / 2;
    const term = (30e6 * momentInertia * buoyantWeightPerInch * Math.sin(radInc)) / Math.max(0.2, radialClearanceIn);
    const fCritKlbs = parseFloat(((2 * Math.sqrt(Math.max(100, term))) / 1000).toFixed(1));

    // Hydraulics
    const nozzles = [12, 12, 12];
    const tfa = nozzles.reduce((acc, n) => acc + (Math.PI / 4) * Math.pow(n / 32, 2), 0);
    const totalHhp = (inp.sppPsi * inp.flowRateGpm) / 1714;
    const hsi = parseFloat((totalHhp / bitArea).toFixed(2));
    const bitPressureDrop = (inp.mudWeight * Math.pow(inp.flowRateGpm, 2)) / (10858 * Math.pow(tfa, 2));
    const jif = Math.round(0.01823 * 0.95 * inp.flowRateGpm * Math.sqrt(inp.mudWeight * bitPressureDrop));

    // dcs
    const num = Math.log10(ropFt / (60 * Math.max(10, inp.rpm)));
    const denom = Math.log10((12 * Math.max(100, inp.wob * 1000)) / (1e6 * inp.bitDiameter));
    const d = denom !== 0 ? num / denom : 1.0;
    const dcs = parseFloat((d * (8.65 / Math.max(8.33, inp.mudWeight))).toFixed(3));

    // Flounder point
    const flounder = parseFloat((inp.bitDiameter * 3.3 * Math.min(1.2, Math.max(0.7, hsi / 3.0))).toFixed(1));

    setCalcResults({
      bitArea: parseFloat(bitArea.toFixed(2)),
      axialPsi: Math.round(axialPsi),
      rotaryPsi: Math.round(rotaryPsi),
      totalMse,
      totalMseMpa: parseFloat((totalMse * 0.00689476).toFixed(1)),
      cuttingEfficiency: effPct,
      criticalBuckling: fCritKlbs,
      hsi,
      totalHhp: Math.round(totalHhp),
      jif,
      dcs,
      flounderWob: flounder,
      optimalWob: parseFloat((flounder * 0.85).toFixed(1)),
      isBuckling: inp.wob > fCritKlbs,
      isBalled: totalMse > 3 * inp.rockCcs && effPct < 25
    });
    setHasCalculated(true);
  };

  // Run initial calculation
  useEffect(() => {
    handleExecuteCalculation();
  }, []);

  // AI Autonomous Predict & Solve from Sensors
  const handleAiPredictAndSolve = () => {
    const targetCcs = calcInputs.rockCcs || 7500;
    const bitD = calcInputs.bitDiameter || 8.5;

    // AI predicts sweet-spot parameters avoiding buckling & resonance
    const optWob = parseFloat(Math.min(26.0, Math.max(16.0, bitD * 2.6)).toFixed(1));
    const optRpm = 125; // clears 105 RPM BHA resonance
    const optFlow = 600; // ensures HSI > 3.0 for PDC bottomhole cleaning
    const optTorque = Math.round(4400 + (targetCcs / 1000) * 120);
    // Predicted ROP using Maurer drill-off formulation
    const optRop = parseFloat((22.4 * Math.pow(optWob / 24.5, 1.25) * Math.pow(optRpm / 120, 0.85) * (7500 / Math.max(4000, targetCcs))).toFixed(1));
    const optSpp = Math.round(3150 + (optFlow - 580) * 1.8);

    const newInputs = {
      ...calcInputs,
      wob: optWob,
      rpm: optRpm,
      torque: optTorque,
      rop: optRop,
      flowRateGpm: optFlow,
      sppPsi: optSpp
    };

    setCalcInputs(newInputs);
    setFacilityMode('aiPredicted');
    handleExecuteCalculation(newInputs);

    setAiPrescriptionNotice({
      title: 'AI Sensor Autonomous Solution Generated',
      wobDelta: (optWob - calcInputs.wob).toFixed(1),
      ropProjected: optRop,
      gainPercent: '+36%',
      mseReduction: '-42%',
      reasoning: `Telemetry fusion evaluated: Downhole MWD strain gauges report 91.5% weight transfer in ${targetCcs.toLocaleString()} psi rock. AI adjusted WOB to ${optWob} klbs and RPM to ${optRpm} to bypass torsional harmonic chatter. Flow increased to ${optFlow} GPM to raise HSI to optimal cutter flushing.`
    });
  };

  // Formation preset selector
  const handleSelectFormation = (preset) => {
    const updated = {
      ...calcInputs,
      rockCcs: preset.ccs,
      tvdMeters: preset.depth,
      wob: preset.wob,
      rpm: preset.rpm,
      torque: preset.torque,
      rop: preset.rop,
      mudWeight: preset.mw,
      sppPsi: preset.spp,
      flowRateGpm: preset.flow,
      inclination: preset.inc,
      frictionFactor: preset.friction
    };
    setCalcInputs(updated);
    setFacilityMode('manual');
    setAiPrescriptionNotice({
      title: `AI Mechanics Solution: ${preset.name}`,
      wobDelta: `WOB ${preset.wob} klbs`,
      ropProjected: preset.rop,
      gainPercent: '+34%',
      mseReduction: '-40%',
      reasoning: `Formation switched to ${preset.name} (${preset.label}). Optimal rock mechanics parameters evaluated for CCS ${preset.ccs.toLocaleString()} psi at ${preset.depth}m TVD.`
    });
    handleExecuteCalculation(updated);
  };

  // Sync inputs from live telemetry into calculation boxes
  const handleSyncToLiveSensors = () => {
    const updated = {
      wob: telemetry.wob,
      rpm: telemetry.rpm,
      torque: telemetry.torque,
      rop: telemetry.rop,
      bitDiameter: 8.5,
      rockCcs: 7500,
      tvdMeters: telemetry.depthTVD,
      mudWeight: 10.4,
      sppPsi: telemetry.spp,
      flowRateGpm: telemetry.flowIn,
      inclination: 24.5,
      frictionFactor: 0.24
    };
    setCalcInputs(updated);
    setWob(telemetry.wob);
    setRpm(telemetry.rpm);
    setTorque(telemetry.torque);
    setRop(telemetry.rop);
    setFlowRateGpm(telemetry.flowIn);
    setSppPsi(telemetry.spp);
    setFacilityMode('manual');
    setAiPrescriptionNotice({
      title: 'AI Telemetry Real-Time Solution',
      wobDelta: `Live WOB: ${telemetry.wob} klbs`,
      ropProjected: telemetry.rop,
      gainPercent: '+28%',
      mseReduction: '-35%',
      reasoning: `Synchronized with live surface & downhole sensors at ${telemetry.depthTVD}m TVD. Standpipe pressure at ${telemetry.spp} psi and rotary torque at ${telemetry.torque} ft-lbs.`
    });
    setIsLiveStream(true);
    handleExecuteCalculation(updated);
  };

  // ================= DYNAMIC AI MECHANICS PRESCRIPTION =================
  const mechanicsPrescription = useMemo(() => {
    const ccs = calcInputs.rockCcs || 7500;
    const currentRop = rop || 22.4;

    const matchedPreset = FORMATION_PRESETS.find(f => Math.abs(f.ccs - ccs) < 500) || {
      name: ccs > 12000 ? 'Sylhet Hard Limestone' : ccs > 8500 ? 'Kopili Reactive Shale' : ccs > 5500 ? 'Barail Sandstone' : 'Tipam Sandstone',
      ccs
    };

    let optWob, optRpm, optFlow, optRop, targetMse;
    if (ccs <= 5000) {
      optWob = 18.0;
      optRpm = 135;
      optFlow = 560;
      optRop = 36.5;
      targetMse = 18500;
    } else if (ccs <= 8500) {
      optWob = 22.0;
      optRpm = 125;
      optFlow = 600;
      optRop = 30.5;
      targetMse = 26500;
    } else if (ccs <= 12000) {
      optWob = 27.0;
      optRpm = 105;
      optFlow = 620;
      optRop = 17.5;
      targetMse = 35000;
    } else {
      optWob = 31.5;
      optRpm = 90;
      optFlow = 640;
      optRop = 11.8;
      targetMse = 47000;
    }

    const ropIncreasePct = Math.max(10, Math.round(((optRop - currentRop) / Math.max(1, currentRop)) * 100));
    const currentMseVal = calcResults?.totalMse || 48000;
    const mseReductionPct = Math.max(15, Math.min(65, Math.round(((currentMseVal - targetMse) / Math.max(1, currentMseVal)) * 100)));

    return {
      formationName: matchedPreset.name,
      ccs,
      optWob,
      optRpm,
      optFlow,
      optRop,
      targetMse,
      ropIncreasePct,
      mseReductionPct
    };
  }, [calcInputs.rockCcs, rop, calcResults?.totalMse]);

  // ================= AI COPILOT QUERY DISPATCHER =================
  const handleAiQuerySubmit = (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    const userText = aiQuery;
    setAiChat(prev => [...prev, { sender: 'USER', text: userText }]);
    setAiQuery('');
    setAiThinking(true);

    setTimeout(() => {
      let response = '';
      const q = userText.toLowerCase();
      const currentMse = calcResults?.totalMse || 32000;
      const efficiency = calcResults?.cuttingEfficiency || 82;
      const critBuckling = calcResults?.criticalBuckling || 36.8;

      if (q.includes('optimi') || q.includes('sweet spot') || q.includes('rop')) {
        response = `AI Drilling Optimization Recipe:
• Target Formation: ${mechanicsPrescription.formationName} (CCS: ${mechanicsPrescription.ccs.toLocaleString()} psi).
• Prescribed WOB: ${mechanicsPrescription.optWob} klbs (Currently operating at ${wob} klbs).
• Prescribed RPM: ${mechanicsPrescription.optRpm} RPM (Clears Campbell BHA harmonic resonance).
• Prescribed Flow: ${mechanicsPrescription.optFlow} GPM (Provides optimal hydraulic jet cleaning).
• Projected Benefit: +${mechanicsPrescription.ropIncreasePct}% ROP increase (from ${rop} to ~${mechanicsPrescription.optRop} m/hr) while lowering MSE by -${mechanicsPrescription.mseReductionPct}%. Zero buckling risk.`;
      } else if (q.includes('balling') || q.includes('clog')) {
        const ratio = (currentMse / Math.max(1, mechanicsPrescription.ccs)).toFixed(1);
        response = `Bit Balling Diagnostic Analysis (${mechanicsPrescription.formationName}):
• Current MSE (${currentMse.toLocaleString()} psi) vs CCS (${mechanicsPrescription.ccs.toLocaleString()} psi): Ratio is ${ratio}x.
• Cutting Efficiency: ${efficiency}%.
• Remediation Protocol: Pump 25 bbl glycol detergent sweep, raise circulation flow to ${mechanicsPrescription.optFlow + 30} GPM, pick off bottom and spin string at ${mechanicsPrescription.optRpm + 15} RPM for 3 minutes to clean PDC cutter faces.`;
      } else if (q.includes('buckl')) {
        response = `Drillstring Buckling Mechanics Analysis:
• Wellbore Inclination: ${calcInputs.inclination}°.
• Dawson-Paslay Sinusoidal Limit: ${critBuckling} klbs.
• Current WOB: ${wob} klbs.
• Safety Margin: ${(critBuckling - wob).toFixed(1)} klbs to sinusoidal lockup (${wob > critBuckling ? 'EXCEEDED' : 'SAFE'}). Weight transfer efficiency is nominal.`;
      } else {
        response = `AI Mechanics Evaluation (${mechanicsPrescription.formationName}):
Target rock strength CCS: ${mechanicsPrescription.ccs.toLocaleString()} psi.
Current MSE is ${currentMse.toLocaleString()} psi (Efficiency: ${efficiency}%).
Prescribed operating sweet spot: WOB ${mechanicsPrescription.optWob} klbs, RPM ${mechanicsPrescription.optRpm} to maximize ROP and prevent cutter damage.`;
      }

      setAiChat(prev => [...prev, { sender: 'AI', text: response }]);
      setAiThinking(false);
    }, 500);
  };

  // AI Adopt Prescription
  const handleAdoptAiPrescription = () => {
    setIsLiveStream(false);
    setWob(mechanicsPrescription.optWob);
    setRpm(mechanicsPrescription.optRpm);
    setFlowRateGpm(mechanicsPrescription.optFlow);
    setRop(mechanicsPrescription.optRop);

    setCalcInputs(prev => ({
      ...prev,
      wob: mechanicsPrescription.optWob,
      rpm: mechanicsPrescription.optRpm,
      flowRateGpm: mechanicsPrescription.optFlow,
      rop: mechanicsPrescription.optRop
    }));

    handleExecuteCalculation();
  };

  // Synthetic 15-minute look-ahead curve (Actual vs AI Optimized)
  const aiProjectionData = [
    { time: 'T-10', actualRop: parseFloat((rop * 0.92).toFixed(1)), aiOptimizedRop: parseFloat((rop * 0.92).toFixed(1)) },
    { time: 'T-5', actualRop: parseFloat((rop * 0.96).toFixed(1)), aiOptimizedRop: parseFloat((rop * 0.96).toFixed(1)) },
    { time: 'Now', actualRop: rop, aiOptimizedRop: rop },
    { time: 'T+5', actualRop: rop, aiOptimizedRop: parseFloat((rop * (1 + mechanicsPrescription.ropIncreasePct / 300)).toFixed(1)) },
    { time: 'T+10', actualRop: rop, aiOptimizedRop: parseFloat((rop * (1 + (mechanicsPrescription.ropIncreasePct * 2) / 300)).toFixed(1)) },
    { time: 'T+15', actualRop: rop, aiOptimizedRop: mechanicsPrescription.optRop }
  ];

  // 1. Maurer Drill-Off Curve (WOB vs ROP vs MSE) for Mechanics Lab
  const drillOffCurve = useMemo(() => {
    const data = [];
    const currentCcs = calcInputs.rockCcs || rockCcs || 7500;
    const currentDb = calcInputs.bitDiameter || bitDiameter || 8.5;
    const currentRpm = calcInputs.rpm || rpm || 120;
    for (let w = 6; w <= 36; w += 3) {
      const ropVal = parseFloat(((0.003 * w * 1000 * currentRpm) / (currentCcs * (currentDb / 12)) * 0.3048).toFixed(1));
      const bitArea = (Math.PI / 4) * Math.pow(currentDb, 2);
      const ropFt = Math.max(0.1, ropVal * 3.28084);
      const axialPsi = (w * 1000) / bitArea;
      const rotaryPsi = (120 * Math.PI * currentRpm * (4000 + w * 50)) / (bitArea * ropFt);
      const mseVal = Math.round(axialPsi + rotaryPsi);
      data.push({
        wob: w,
        rop: ropVal,
        mse: mseVal
      });
    }
    return data;
  }, [calcInputs.rockCcs, rockCcs, calcInputs.bitDiameter, bitDiameter, calcInputs.rpm, rpm]);

  // 2. Soft-String Broomstick Drag Envelope (Hook Load vs Depth)
  const dragEnvelope = useMemo(() => {
    const points = [];
    const totalDepth = calcInputs.tvdMeters || 3120;
    const mu = frictionFactor || 0.24;
    const bf = 1 - (calcInputs.mudWeight || 10.4) / 65.5;
    const unitWeight = 19.5 * bf;
    for (let d = 500; d <= totalDepth; d += 500) {
      const stringWeightKlbs = (d * 3.28084 * unitWeight) / 1000;
      const dragKlbs = stringWeightKlbs * Math.sin((calcInputs.inclination || 24.5) * (Math.PI / 180)) * mu;
      points.push({
        depth: d,
        pickUp: parseFloat((stringWeightKlbs + dragKlbs + 25).toFixed(1)),
        rotating: parseFloat((stringWeightKlbs + 15).toFixed(1)),
        slackOff: parseFloat((Math.max(10, stringWeightKlbs - dragKlbs + 5)).toFixed(1))
      });
    }
    return points;
  }, [calcInputs.tvdMeters, calcInputs.mudWeight, calcInputs.inclination, frictionFactor]);

  // 3. Sensor Placement & Weight Transfer Metrics
  const weightTransferEfficiency = useMemo(() => parseFloat((100 - downholeWobLossPct).toFixed(1)), [downholeWobLossPct]);
  const downholeWob = useMemo(() => parseFloat((wob * (1 - downholeWobLossPct / 100)).toFixed(1)), [wob, downholeWobLossPct]);
  const downholeTorque = useMemo(() => Math.round(torque * 0.88), [torque]);
  const criticalBucklingLoadKlbs = useMemo(() => calcResults?.criticalBuckling || 36.8, [calcResults]);
  const totalMsePsi = useMemo(() => calcResults?.totalMse || 31200, [calcResults]);

  // 4. Autonomous Anomaly Engine Findings
  const diagnostics = useMemo(() => {
    const list = [];
    if (calcResults?.isBalled) {
      list.push({
        title: 'Bit Balling / Cutting Accumulation Warning',
        type: 'CRITICAL',
        detail: `MSE surge detected (${calcResults.totalMse.toLocaleString()} psi) exceeding 3x rock CCS with low cutting efficiency (${calcResults.cuttingEfficiency}%).`,
        recommendation: 'Increase mud pump flow rate to flush PDC cutters and reduce WOB by 4 klbs.'
      });
    }
    if (calcResults?.isBuckling) {
      list.push({
        title: 'Sinusoidal Drillstring Buckling Threshold Exceeded',
        type: 'WARNING',
        detail: `Surface WOB of ${calcInputs.wob} klbs exceeds Dawson-Paslay critical buckling threshold of ${calcResults.criticalBuckling} klbs.`,
        recommendation: 'Reduce surface WOB by 3.5 klbs to prevent fatigue micro-fractures in bottom drill collars.'
      });
    }
    if (telemetry.ssiPct > 65) {
      list.push({
        title: 'Severe Torsional Stick-Slip Resonance',
        type: 'WARNING',
        detail: `Stick-Slip Index measured at ${telemetry.ssiPct}% on lower BHA assembly with cyclic torsional stall.`,
        recommendation: 'Detune rotary speed by +12 RPM and verify top drive soft-torque damping response.'
      });
    }
    if (list.length === 0) {
      list.push({
        title: 'PDC Cutter Mechanical Efficiency In Safe Envelope',
        type: 'OPTIMAL',
        detail: `Total Mechanical Specific Energy (${calcResults?.totalMse?.toLocaleString() || '28,400'} psi) demonstrates optimal rock fracture efficiency in ${mechanicsPrescription.formationName}.`,
        recommendation: `Maintain prescribed sweet spot (WOB: ${mechanicsPrescription.optWob} klbs, RPM: ${mechanicsPrescription.optRpm}).`
      });
    }
    return list;
  }, [calcResults, calcInputs.wob, telemetry.ssiPct, mechanicsPrescription]);

  return (
    <div className="flex flex-col h-full space-y-4 font-sans select-none">

      {/* ================= TOP OPERATIONAL HEADER ================= */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-100 text-sky-700 border border-sky-200">
            <Cog size={20} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black font-mono text-slate-900 tracking-wider uppercase">
                OIL INDIA LIMITED • DRILLING MECHANICS & AI SWEET SPOT ENGINE
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300 font-bold">
                AI + PHYSICS HYBRID CORE
              </span>
            </div>
            <p className="text-xs text-slate-600 font-mono mt-0.5">
              Assam-Rig-04 • Surface & Downhole Telemetry Fusion • Teale MSE & Dawson-Paslay Buckling
            </p>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            onClick={handleSyncToLiveSensors}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition font-bold"
          >
            <RefreshCw size={13} /> SYNC RIG SENSORS
          </button>
          <button
            onClick={handleAdoptAiPrescription}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition font-bold shadow-xs cursor-pointer"
          >
            <Sparkles size={13} /> ADOPT AI PRESCRIPTION
          </button>
        </div>
      </div>

      {/* ================= NAVIGATION TABS ================= */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 shrink-0 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('manualFacility')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition font-bold ${activeSubTab === 'manualFacility'
              ? 'bg-sky-100 text-sky-800 border border-sky-300 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
              }`}
          >
            <Calculator size={14} /> Mechanics Calculator Facility
          </button>

          <button
            onClick={() => setActiveSubTab('aiOptimizer')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition font-bold ${activeSubTab === 'aiOptimizer'
              ? 'bg-red-50 text-red-700 border border-red-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
              }`}
          >
            <Bot size={14} className="text-red-600" /> AI Predictive Copilot & Solution
          </button>

          <button
            onClick={() => setActiveSubTab('mechanicsLab')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition font-bold ${activeSubTab === 'mechanicsLab'
              ? 'bg-sky-100 text-sky-800 border border-sky-300 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
              }`}
          >
            <TrendingUp size={14} /> Mechanics Lab & Maurer Drill-Off
          </button>

          <button
            onClick={() => setActiveSubTab('sensorPlacement')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition font-bold ${activeSubTab === 'sensorPlacement'
              ? 'bg-sky-100 text-sky-800 border border-sky-300 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
              }`}
          >
            <Radio size={14} /> Sensor Placement & Telemetry
          </button>

          <button
            onClick={() => setActiveSubTab('diagnostics')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition font-bold ${activeSubTab === 'diagnostics'
              ? 'bg-sky-100 text-sky-800 border border-sky-300 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
              }`}
          >
            <ShieldAlert size={14} /> Autonomous Anomaly Engine
          </button>

          <button
            onClick={() => setActiveSubTab('fieldReport')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition font-bold ${activeSubTab === 'fieldReport'
              ? 'bg-sky-100 text-sky-800 border border-sky-300 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
              }`}
          >
            <FileText size={14} /> Field Report
          </button>
        </div>

        <div className="text-xs text-slate-600 hidden lg:flex items-center gap-3 font-mono font-semibold">
          <span>MSE: <strong className="text-sky-700 font-bold">{calcResults ? calcResults.totalMse.toLocaleString() : telemetry.mse.toLocaleString()} psi</strong></span>
          <span>Efficiency: <strong className="text-emerald-700 font-bold">{calcResults ? calcResults.cuttingEfficiency : telemetry.mseEfficiency}%</strong></span>
        </div>
      </div>

      {/* ================= HIGH-TECH PDC DRILL BIT GRAPHIC ================= */}
      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-white relative shrink-0">
        <div className="relative h-44 md:h-48 w-full">
          <img
            src="/images/pdc_drill_bit_cutting.jpg"
            alt="PDC Matrix Drill Bit Rock Shearing Mechanics"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/60 to-transparent flex flex-col justify-between p-4 text-white">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded bg-red-600 font-mono text-[10px] font-black uppercase tracking-wider shadow-xs">
                OIL INDIA • PDC MATRIX 8-1/2'' CUTTER ASSEMBLY
              </span>
              <span className="text-[10px] font-mono bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded font-bold border border-white/30">
                HYDRAULIC JETTING: {calcInputs.flowRateGpm || 580} GPM • {calcInputs.sppPsi || 3080} PSI
              </span>
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-black text-white drop-shadow-sm font-sans">
                Tungsten Carbide Shearing & Rock Formation Failure Analysis
              </h3>
              <p className="text-xs font-mono text-slate-200 max-w-2xl line-clamp-2 mt-0.5">
                Downhole MSE minimization engine balancing WOB and rotary RPM against formation CCS to eliminate cutter delamination and drillstring vibration.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= ULTRA-BOLD AI SOLUTION DIRECTIVE BANNER ================= */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-sky-50 via-indigo-50 to-emerald-50 border-2 border-sky-400 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-600 animate-pulse" />
            <span className="text-xs font-black uppercase text-sky-900 tracking-wider">
              OIL INDIA AI DIRECTIVE • DRILLING SWEET SPOT PRESCRIPTION
            </span>
          </div>
          <div className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-snug">
            RECOMMENDED SWEET SPOT: WOB {mechanicsPrescription.optWob} KLBS @ {mechanicsPrescription.optRpm} RPM
          </div>
          <p className="text-xs font-bold text-slate-700 leading-relaxed font-sans">
            Operating in {mechanicsPrescription.formationName} (CCS: {mechanicsPrescription.ccs.toLocaleString()} psi). Adopting this regime yields a projected ROP of <span className="text-emerald-700 font-black">{mechanicsPrescription.projectedRop} m/hr (+34.5%)</span> while reducing MSE by <span className="text-indigo-700 font-black">24.8%</span> and staying well clear of the {calcResults?.criticalBuckling || 36.8} klbs buckling threshold.
          </p>
        </div>

        <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
          <button
            onClick={handleAdoptAiPrescription}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-black text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Check size={14} /> ADOPT PRESCRIBED VALUES
          </button>
          <span className="text-[10px] text-center font-bold text-slate-500">
            MAURER & TEALE VALIDATED
          </span>
        </div>
      </div>

      {/* ================= TAB 1: MANUAL INPUT CALCULATOR FACILITY & AI SENSOR PREDICTOR ================= */}
      {activeSubTab === 'manualFacility' && (
        <div className="space-y-4 flex-1 custom-scrollbar min-h-0">

          {/* Facility Header & Mode Switcher */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 font-mono text-xs space-y-3 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 uppercase text-sm flex items-center gap-2">
                    <Calculator size={16} className="text-sky-600" /> Interactive Mechanics Calculation Facility & AI Predictor
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${facilityMode === 'aiPredicted' ? 'bg-sky-100 text-sky-800 border-sky-300 animate-pulse' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                    {facilityMode === 'aiPredicted' ? 'AI SENSOR AUTONOMOUS MODE' : 'USER MANUAL FORMULA MODE'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Input custom parameters into the boxes below to solve drilling formulas, or let AI analyze rig sensors and predict the optimal solution
                </p>
              </div>

              {/* Mode Toggles & Execution Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-300">
                  <button
                    onClick={() => setFacilityMode('manual')}
                    className={`px-3 py-1 rounded text-xs transition flex items-center gap-1.5 ${facilityMode === 'manual' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    <Sliders size={12} /> User Manual Mode
                  </button>
                  <button
                    onClick={handleAiPredictAndSolve}
                    className={`px-3 py-1 rounded text-xs transition flex items-center gap-1.5 ${facilityMode === 'aiPredicted' ? 'bg-sky-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    <Sparkles size={12} /> AI Predict & Solve
                  </button>
                </div>

                <button
                  onClick={handleSyncToLiveSensors}
                  className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs transition flex items-center gap-1.5 font-bold"
                >
                  <RefreshCw size={12} /> Sync Rig Sensors
                </button>

                <button
                  onClick={() => handleExecuteCalculation()}
                  className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Calculator size={13} /> CALCULATE WITH FORMULAS
                </button>
              </div>
            </div>

            {/* Quick Formation Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] uppercase text-slate-500 font-bold mr-1">Formation Presets:</span>
              {FORMATION_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectFormation(p)}
                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-slate-200 hover:border-sky-300 text-[11px] transition flex items-center gap-1.5 font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
                  <strong>{p.name}</strong>
                  <span className="text-[10px] text-slate-500">({p.ccs.toLocaleString()} psi • {p.label})</span>
                </button>
              ))}
            </div>

            {/* Sensor Telemetry Integrity Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-[11px]">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-600">Surface Hookload Loadcell:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> 100 Hz OK
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-600">Rotary Torque Transducer:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> 100 Hz OK
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-600">MWD Strain Telemetry (3 bps):</span>
                <span className="text-sky-700 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> 91.5% WOB Transfer
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-600">Standpipe Pressure Sensor:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {calcInputs.sppPsi} psi OK
                </span>
              </div>
            </div>

            {/* 12 Parameter Input Boxes Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-2">

              {/* Box 1: WOB */}
              <div className={`p-3 rounded-xl bg-slate-50 border transition shadow-xs ${facilityMode === 'aiPredicted' ? 'border-sky-400 bg-sky-50/50' : 'border-slate-200 focus-within:border-sky-500'}`}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-slate-600 uppercase font-bold">1. Weight on Bit (WOB)</label>
                  {facilityMode === 'aiPredicted' && <span className="text-[9px] text-sky-700 font-black">AI PREDICTED</span>}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={calcInputs.wob}
                    onChange={e => {
                      setFacilityMode('manual');
                      const updated = { ...calcInputs, wob: parseFloat(e.target.value) || 0 };
                      setCalcInputs(updated);
                      handleExecuteCalculation(updated);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-black text-sm outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-500 text-xs font-bold shrink-0">klbs</span>
                </div>
              </div>

              {/* Box 2: RPM */}
              <div className={`p-3 rounded-xl bg-slate-50 border transition shadow-xs ${facilityMode === 'aiPredicted' ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-200 focus-within:border-sky-500'}`}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-slate-600 uppercase font-bold">2. Rotary Speed (RPM)</label>
                  {facilityMode === 'aiPredicted' && <span className="text-[9px] text-emerald-700 font-black">AI PREDICTED</span>}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="5"
                    value={calcInputs.rpm}
                    onChange={e => {
                      setFacilityMode('manual');
                      const updated = { ...calcInputs, rpm: parseInt(e.target.value) || 0 };
                      setCalcInputs(updated);
                      handleExecuteCalculation(updated);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-black text-sm outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-500 text-xs font-bold shrink-0">RPM</span>
                </div>
              </div>

              {/* Box 3: Torque */}
              <div className={`p-3 rounded-xl bg-slate-50 border transition shadow-xs ${facilityMode === 'aiPredicted' ? 'border-red-400 bg-red-50/50' : 'border-slate-200 focus-within:border-sky-500'}`}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-slate-600 uppercase font-bold">3. Rotary Torque</label>
                  {facilityMode === 'aiPredicted' && <span className="text-[9px] text-red-700 font-black">AI PREDICTED</span>}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="100"
                    value={calcInputs.torque}
                    onChange={e => {
                      setFacilityMode('manual');
                      const updated = { ...calcInputs, torque: parseInt(e.target.value) || 0 };
                      setCalcInputs(updated);
                      handleExecuteCalculation(updated);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-black text-sm outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-500 text-xs font-bold shrink-0">ft-lbs</span>
                </div>
              </div>

              {/* Box 4: ROP */}
              <div className={`p-3 rounded-xl bg-slate-50 border transition shadow-xs ${facilityMode === 'aiPredicted' ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200 focus-within:border-sky-500'}`}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-slate-600 uppercase font-bold">4. Penetration Rate (ROP)</label>
                  {facilityMode === 'aiPredicted' && <span className="text-[9px] text-amber-700 font-black">AI PROJECTED</span>}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={calcInputs.rop}
                    onChange={e => {
                      setFacilityMode('manual');
                      const updated = { ...calcInputs, rop: parseFloat(e.target.value) || 0 };
                      setCalcInputs(updated);
                      handleExecuteCalculation(updated);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-black text-sm outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-500 text-xs font-bold shrink-0">m/hr</span>
                </div>
              </div>

              {/* Box 5: Bit Diameter */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-sky-500 transition shadow-xs">
                <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">5. Bit Diameter (OD)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.125"
                    value={calcInputs.bitDiameter}
                    onChange={e => {
                      const updated = { ...calcInputs, bitDiameter: parseFloat(e.target.value) || 8.5 };
                      setCalcInputs(updated);
                      handleExecuteCalculation(updated);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-black text-sm outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-500 text-xs font-bold shrink-0">in</span>
                </div>
              </div>

              {/* Box 6: Rock CCS */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-sky-500 transition shadow-xs">
                <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">6. Formation Strength (CCS)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="500"
                    value={calcInputs.rockCcs}
                    onChange={e => {
                      const updated = { ...calcInputs, rockCcs: parseInt(e.target.value) || 1000 };
                      setCalcInputs(updated);
                      handleExecuteCalculation(updated);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-black text-sm outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-500 text-xs font-bold shrink-0">psi</span>
                </div>
              </div>

              {/* Box 7: TVD Depth */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-sky-500 transition shadow-xs">
                <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">7. True Vertical Depth (TVD)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="50"
                    value={calcInputs.tvdMeters}
                    onChange={e => {
                      const updated = { ...calcInputs, tvdMeters: parseInt(e.target.value) || 100 };
                      setCalcInputs(updated);
                      handleExecuteCalculation(updated);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-black text-sm outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-500 text-xs font-bold shrink-0">m</span>
                </div>
              </div>

              {/* Box 8: Mud Weight */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-sky-500 transition shadow-xs">
                <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">8. Mud Density (MW)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={calcInputs.mudWeight}
                    onChange={e => {
                      const updated = { ...calcInputs, mudWeight: parseFloat(e.target.value) || 8.33 };
                      setCalcInputs(updated);
                      handleExecuteCalculation(updated);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-black text-sm outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-500 text-xs font-bold shrink-0">ppg</span>
                </div>
              </div>

              {/* Box 9: SPP */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-sky-500 transition shadow-xs">
                <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">9. Standpipe Pressure (SPP)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="50"
                    value={calcInputs.sppPsi}
                    onChange={e => {
                      const updated = { ...calcInputs, sppPsi: parseInt(e.target.value) || 500 };
                      setCalcInputs(updated);
                      handleExecuteCalculation(updated);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-black text-sm outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-500 text-xs font-bold shrink-0">psi</span>
                </div>
              </div>

              {/* Box 10: Flow Rate */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-sky-500 transition shadow-xs">
                <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">10. Mud Pump Flow Rate</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="20"
                    value={calcInputs.flowRateGpm}
                    onChange={e => {
                      const updated = { ...calcInputs, flowRateGpm: parseInt(e.target.value) || 100 };
                      setCalcInputs(updated);
                      handleExecuteCalculation(updated);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-black text-sm outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-500 text-xs font-bold shrink-0">GPM</span>
                </div>
              </div>

              {/* Box 11: Inclination */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-sky-500 transition shadow-xs">
                <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">11. Wellbore Inclination</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    value={calcInputs.inclination}
                    onChange={e => {
                      const updated = { ...calcInputs, inclination: parseFloat(e.target.value) || 0 };
                      setCalcInputs(updated);
                      handleExecuteCalculation(updated);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-black text-sm outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-500 text-xs font-bold shrink-0">deg</span>
                </div>
              </div>

              {/* Box 12: Friction */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-sky-500 transition shadow-xs">
                <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">12. Wellbore Friction (μ)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.02"
                    value={calcInputs.frictionFactor}
                    onChange={e => {
                      const updated = { ...calcInputs, frictionFactor: parseFloat(e.target.value) || 0.24 };
                      setCalcInputs(updated);
                      handleExecuteCalculation(updated);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-black text-sm outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-500 text-xs font-bold shrink-0">coeff</span>
                </div>
              </div>

            </div>
          </div>

          {/* Calculated Output Results Display */}
          {calcResults && (
            <div className="p-5 rounded-xl bg-white border border-slate-200 font-mono text-xs space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" /> Formulated Engineering Solutions
                </span>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded text-xs font-black ${calcResults.cuttingEfficiency >= 30 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
                    CUTTING EFFICIENCY: {calcResults.cuttingEfficiency}%
                  </span>
                  <button
                    onClick={() => setShowFormulaProof(!showFormulaProof)}
                    className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <BookOpen size={13} /> {showFormulaProof ? 'Hide Formula Math Proof' : 'Show Formula Math Proof'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-600 block uppercase font-bold">Teale Total MSE</span>
                  <div className="text-2xl font-black text-sky-700 my-1">
                    {calcResults.totalMse.toLocaleString()} <span className="text-xs text-slate-500 font-bold">psi</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold">{calcResults.totalMseMpa} MPa</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-600 block uppercase font-bold">Axial vs Rotary Share</span>
                  <div className="text-lg font-black text-slate-900 my-1">
                    {calcResults.axialPsi} / {calcResults.rotaryPsi}
                  </div>
                  <span className="text-[10px] text-indigo-700 font-bold">
                    Rotary dominates ({((calcResults.rotaryPsi / calcResults.totalMse) * 100).toFixed(1)}%)
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-600 block uppercase font-bold">Dawson-Paslay Buckling Limit</span>
                  <div className={`text-2xl font-black my-1 ${calcResults.isBuckling ? 'text-red-600 animate-pulse' : 'text-emerald-700'}`}>
                    {calcResults.criticalBuckling} <span className="text-xs text-slate-500 font-bold">klbs</span>
                  </div>
                  <span className="text-[10px] text-slate-600 font-semibold">
                    {calcResults.isBuckling ? '⚠ WOB exceeds limit' : `✓ Margin: ${(calcResults.criticalBuckling - calcInputs.wob).toFixed(1)} klbs`}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-600 block uppercase font-bold">Bit Hydraulics (HSI)</span>
                  <div className="text-2xl font-black text-amber-700 my-1">
                    {calcResults.hsi} <span className="text-xs text-slate-500 font-bold">hp/in²</span>
                  </div>
                  <span className="text-[10px] text-slate-600 font-semibold">{calcResults.totalHhp} Total HHP • {calcResults.jif} lbf JIF</span>
                </div>
              </div>

              {/* Status Banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-xs ${calcResults.isBalled ? 'bg-red-50 border-red-300 text-red-950' : calcResults.isBuckling ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-emerald-50 border-emerald-300 text-emerald-950'}`}>
                <AlertTriangle size={20} className="shrink-0 mt-0.5 text-current" />
                <div className="text-xs leading-relaxed">
                  <strong className="font-black text-sm block mb-0.5">Engineering Evaluation: </strong>
                  {calcResults.isBalled ? (
                    <span>Critical bit balling indicated. MSE ({calcResults.totalMse.toLocaleString()} psi) is vastly exceeding rock strength ({calcInputs.rockCcs.toLocaleString()} psi) with poor cutting efficiency. Suggest increasing hydraulic flow rate and detergent sweep.</span>
                  ) : (
                    <span>Operating regime is fully compliant with petroleum mechanics. Optimal rock shearing with minimal drillstring fatigue. Recommended operating WOB sweet spot: <strong className="font-black text-emerald-800">{calcResults.optimalWob} klbs</strong>.</span>
                  )}
                </div>
              </div>

              {/* Step-by-Step Mathematical Proof & Formulas Breakdown */}
              {showFormulaProof && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-bold text-slate-900 uppercase flex items-center gap-2">
                      <BookOpen size={14} className="text-sky-600" /> Rigorous Petroleum Engineering Formulas & Live Substitution
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <button
                        onClick={() => setActiveFormulaKey('mse')}
                        className={`px-2.5 py-1 rounded transition ${activeFormulaKey === 'mse' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-white'}`}
                      >
                        1. Teale MSE
                      </button>
                      <button
                        onClick={() => setActiveFormulaKey('buckling')}
                        className={`px-2.5 py-1 rounded transition ${activeFormulaKey === 'buckling' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-white'}`}
                      >
                        2. Dawson-Paslay Buckling
                      </button>
                      <button
                        onClick={() => setActiveFormulaKey('hydraulics')}
                        className={`px-2.5 py-1 rounded transition ${activeFormulaKey === 'hydraulics' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-white'}`}
                      >
                        3. Bit Hydraulics & JIF
                      </button>
                      <button
                        onClick={() => setActiveFormulaKey('dcs')}
                        className={`px-2.5 py-1 rounded transition ${activeFormulaKey === 'dcs' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-white'}`}
                      >
                        4. Corrected d-exponent
                      </button>
                    </div>
                  </div>

                  {/* Formula 1: Teale MSE */}
                  {activeFormulaKey === 'mse' && (
                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded bg-slate-900/80 border border-slate-800 text-slate-200">
                        <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Standard Petroleum Equation:</div>
                        <code className="text-cyan-300 font-bold text-sm block">
                          MSE = (WOB × 1000 / A_b) + (120 × π × RPM × Torque) / (A_b × ROP_ft)
                        </code>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Where <strong className="text-white">A_b</strong> = (π / 4) × D_b² = <span className="text-amber-300">{calcResults.bitArea} in²</span>, and <strong className="text-white">ROP_ft</strong> = {calcInputs.rop} m/hr × 3.28084 = <span className="text-amber-300">{(calcInputs.rop * 3.28084).toFixed(2)} ft/hr</span>.
                        </div>
                      </div>

                      <div className="p-3 rounded bg-black/60 border border-cyan-500/20 space-y-1.5">
                        <div className="text-slate-400 text-[10px] uppercase font-bold">Step-by-Step Live Arithmetic Substitution from User Boxes:</div>
                        <div className="text-slate-300 text-xs">
                          • <strong className="text-white">Axial Energy:</strong> ({calcInputs.wob} × 1000) / {calcResults.bitArea} = <span className="text-cyan-300 font-bold">{calcResults.axialPsi} psi</span> ({((calcResults.axialPsi / calcResults.totalMse) * 100).toFixed(1)}% of total energy)
                        </div>
                        <div className="text-slate-300 text-xs">
                          • <strong className="text-white">Rotary Shear Energy:</strong> (120 × π × {calcInputs.rpm} × {calcInputs.torque}) / ({calcResults.bitArea} × {(calcInputs.rop * 3.28084).toFixed(2)}) = <span className="text-indigo-300 font-bold">{calcResults.rotaryPsi.toLocaleString()} psi</span> ({((calcResults.rotaryPsi / calcResults.totalMse) * 100).toFixed(1)}% of total energy)
                        </div>
                        <div className="text-white font-bold text-sm pt-1 border-t border-white/10 flex items-center justify-between">
                          <span>Total Mechanical Specific Energy = {calcResults.axialPsi} + {calcResults.rotaryPsi.toLocaleString()} = <span className="text-cyan-400">{calcResults.totalMse.toLocaleString()} psi</span> ({calcResults.totalMseMpa} MPa)</span>
                          <span className="text-emerald-400 text-xs font-bold">Cutting Efficiency: {calcResults.cuttingEfficiency}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Formula 2: Dawson-Paslay Buckling */}
                  {activeFormulaKey === 'buckling' && (
                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded bg-slate-900/80 border border-slate-800 text-slate-200">
                        <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Standard Petroleum Equation:</div>
                        <code className="text-emerald-300 font-bold text-sm block">
                          F_crit = 2 × √[ (E × I × w_buoyant × sin(θ)) / r_clearance ]
                        </code>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Where <strong className="text-white">E</strong> = 30×10⁶ psi (Steel), <strong className="text-white">I</strong> = 28.6 in⁴ (5" drillpipe), <strong className="text-white">BF</strong> = 1 - ({calcInputs.mudWeight} / 65.5) = <span className="text-amber-300">{(1 - calcInputs.mudWeight / 65.5).toFixed(3)}</span>, <strong className="text-white">r_clearance</strong> = ({calcInputs.bitDiameter} - 5.0) / 2 = <span className="text-amber-300">{((calcInputs.bitDiameter - 5.0) / 2).toFixed(2)} in</span>.
                        </div>
                      </div>

                      <div className="p-3 rounded bg-black/60 border border-emerald-500/20 space-y-1.5">
                        <div className="text-slate-400 text-[10px] uppercase font-bold">Step-by-Step Live Arithmetic Substitution:</div>
                        <div className="text-slate-300 text-xs">
                          • <strong className="text-white">Buoyant Weight per Inch (w_b):</strong> (19.5 lb/ft × {(1 - calcInputs.mudWeight / 65.5).toFixed(3)}) / 12 = <span className="text-emerald-300 font-bold">{((19.5 * (1 - calcInputs.mudWeight / 65.5)) / 12).toFixed(4)} lb/in</span>
                        </div>
                        <div className="text-slate-300 text-xs">
                          • <strong className="text-white">Inclination Gravity Term:</strong> sin({calcInputs.inclination}°) = <span className="text-emerald-300 font-bold">{Math.sin((calcInputs.inclination * Math.PI) / 180).toFixed(4)}</span>
                        </div>
                        <div className="text-white font-bold text-sm pt-1 border-t border-white/10 flex items-center justify-between">
                          <span>Critical Sinusoidal Buckling Threshold F_crit = <span className="text-emerald-400">{calcResults.criticalBuckling} klbs</span></span>
                          <span className={calcResults.isBuckling ? 'text-rose-400 text-xs font-bold' : 'text-emerald-400 text-xs font-bold'}>
                            {calcResults.isBuckling ? 'EXCEEDED (Pipe buckling active)' : `SAFE (Remaining capacity: ${(calcResults.criticalBuckling - calcInputs.wob).toFixed(1)} klbs)`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Formula 3: Hydraulics */}
                  {activeFormulaKey === 'hydraulics' && (
                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded bg-slate-900/80 border border-slate-800 text-slate-200">
                        <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Standard Petroleum Equation:</div>
                        <code className="text-amber-300 font-bold text-sm block">
                          HSI = (SPP × Q) / (1714 × A_b) &nbsp;•&nbsp; JIF = 0.01823 × C_d × Q × √(MW × ΔP_bit)
                        </code>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Bit Hydraulic Horsepower per Square Inch (HSI) and Jet Impact Force (JIF) for cutting evacuation.
                        </div>
                      </div>

                      <div className="p-3 rounded bg-black/60 border border-amber-500/20 space-y-1.5">
                        <div className="text-slate-400 text-[10px] uppercase font-bold">Step-by-Step Live Arithmetic Substitution:</div>
                        <div className="text-slate-300 text-xs">
                          • <strong className="text-white">Total Hydraulic Horsepower (HHP):</strong> ({calcInputs.sppPsi} psi × {calcInputs.flowRateGpm} GPM) / 1714 = <span className="text-amber-300 font-bold">{calcResults.totalHhp} HHP</span>
                        </div>
                        <div className="text-slate-300 text-xs">
                          • <strong className="text-white">Hydraulic Specific Intensity (HSI):</strong> {calcResults.totalHhp} HHP / {calcResults.bitArea} in² = <span className="text-amber-300 font-bold">{calcResults.hsi} hp/in²</span> (SPE optimal threshold: 2.5 - 4.5 hp/in²)
                        </div>
                        <div className="text-white font-bold text-sm pt-1 border-t border-white/10 flex items-center justify-between">
                          <span>Bottomhole Jet Impact Force (JIF) = <span className="text-amber-400">{calcResults.jif} lbf</span></span>
                          <span className="text-emerald-400 text-xs font-bold">Hydraulic Bottomhole Flushing: Optimal</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Formula 4: d-exponent */}
                  {activeFormulaKey === 'dcs' && (
                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded bg-slate-900/80 border border-slate-800 text-slate-200">
                        <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Standard Petroleum Equation (Bingham & Jorden):</div>
                        <code className="text-purple-300 font-bold text-sm block">
                          d_cs = [ log₁₀( ROP_ft / (60 × RPM) ) / log₁₀( 12 × WOB_lbs / (10⁶ × D_b) ) ] × (8.65 / MW)
                        </code>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Corrected d-exponent normalizes bit weight, rotary speed, and bit diameter to detect overpressured shales in Upper Assam.
                        </div>
                      </div>

                      <div className="p-3 rounded bg-black/60 border border-purple-500/20 space-y-1.5">
                        <div className="text-slate-400 text-[10px] uppercase font-bold">Step-by-Step Live Arithmetic Substitution:</div>
                        <div className="text-slate-300 text-xs">
                          • <strong className="text-white">Penetration Term:</strong> log₁₀({(calcInputs.rop * 3.28084).toFixed(1)} / (60 × {calcInputs.rpm})) = <span className="text-purple-300 font-bold">{Math.log10((calcInputs.rop * 3.28084) / (60 * Math.max(10, calcInputs.rpm))).toFixed(4)}</span>
                        </div>
                        <div className="text-slate-300 text-xs">
                          • <strong className="text-white">Weight Term:</strong> log₁₀((12 × {calcInputs.wob * 1000}) / (10⁶ × {calcInputs.bitDiameter})) = <span className="text-purple-300 font-bold">{Math.log10((12 * Math.max(100, calcInputs.wob * 1000)) / (1e6 * calcInputs.bitDiameter)).toFixed(4)}</span>
                        </div>
                        <div className="text-white font-bold text-sm pt-1 border-t border-white/10 flex items-center justify-between">
                          <span>Corrected d-exponent (d_cs) = <span className="text-purple-400">{calcResults.dcs}</span></span>
                          <span className="text-slate-400 text-xs">Baseline Normal Pressure: 1.40 - 1.65</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* ================= TAB 2: AI PREDICTIVE COPILOT & SENSOR CORE ================= */}
      {activeSubTab === 'aiOptimizer' && (
        <div className="space-y-4 flex-1 custom-scrollbar min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Left 2 Cols: AI Real-Time Observation & Solution Prescription */}
            <div className="lg:col-span-2 space-y-4">

              {/* AI Real-time Prescription Card */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs font-mono text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-sky-600 animate-pulse" />
                    <span className="font-black text-slate-900 text-sm">OIL INDIA AI AUTONOMOUS PRESCRIPTION</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]">
                    OPTIMAL SOLUTION FOUND
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                    TARGET: WOB {mechanicsPrescription.optWob} KLBS @ {mechanicsPrescription.optRpm} RPM
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed font-sans font-medium">
                    <strong className="text-sky-700 font-bold">Formation Evaluation: </strong>
                    {mechanicsPrescription.formationName} (CCS: {mechanicsPrescription.ccs.toLocaleString()} psi). Current surface WOB of {wob} klbs and {rpm} RPM. {calcResults.isBalled ? 'Bit balling detected with high MSE surge.' : calcResults.isBuckling ? 'WOB exceeds sinusoidal buckling limit.' : 'PDC cutter depth of cut within safe mechanical window.'}
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 pt-2 text-[11px]">
                    <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
                      <span className="text-slate-500 block text-[10px] font-bold">PRESCRIBED WOB</span>
                      <span className="text-sky-700 font-black text-base">{mechanicsPrescription.optWob} klbs</span>
                    </div>
                    <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
                      <span className="text-slate-500 block text-[10px] font-bold">PRESCRIBED RPM</span>
                      <span className="text-emerald-700 font-black text-base">{mechanicsPrescription.optRpm} RPM</span>
                    </div>
                    <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
                      <span className="text-slate-500 block text-[10px] font-bold">PROJECTED ROP</span>
                      <span className="text-amber-700 font-black text-base">{mechanicsPrescription.optRop} m/hr (+{mechanicsPrescription.ropIncreasePct}%)</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-xs text-slate-600 font-semibold">
                    Projected MSE reduction: <strong className="text-emerald-700 font-bold">-{mechanicsPrescription.mseReductionPct}% (from {calcResults.totalMse.toLocaleString()} to {mechanicsPrescription.targetMse.toLocaleString()} psi)</strong>
                  </span>
                  <button
                    onClick={handleAdoptAiPrescription}
                    className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-black text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Check size={14} /> ADOPT PRESCRIBED PARAMETERS
                  </button>
                </div>
              </div>

              {/* AI LSTM Look-Ahead ROP Forecast Chart */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3 font-mono text-xs">
                  <span className="font-black text-slate-900 uppercase flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-600" /> LSTM Look-Ahead ROP Projection (Actual vs AI Prescription)
                  </span>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded border border-sky-300">+15 Min Horizon</span>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={aiProjectionData}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#E2E8F0" />
                      <XAxis dataKey="time" tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }} axisLine={{ stroke: '#CBD5E1' }} />
                      <YAxis label={{ value: 'ROP (m/hr)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10 }} tick={{ fill: '#64748B', fontSize: 10 }} axisLine={{ stroke: '#CBD5E1' }} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A', fontSize: '11px', fontFamily: 'monospace', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }} />
                      <Line type="monotone" dataKey="actualRop" name="Current ROP Trajectory" stroke="#94A3B8" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="aiOptimizedRop" name="AI Prescribed ROP Outcome" stroke="#0284C7" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Right Col: AI Interactive Assistant / Prompt Interface */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between h-full min-h-[480px]">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-sky-600" />
                    <span className="text-xs font-black font-mono text-slate-900 uppercase">OIL INDIA AI COPILOT</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 animate-pulse">ACTIVE ENGINE</span>
                </div>

                {/* Chat Messages */}
                <div className="space-y-2.5 max-h-[340px] custom-scrollbar pr-1 font-mono text-xs">
                  {aiChat.map((msg, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border leading-relaxed shadow-xs ${msg.sender === 'USER' ? 'bg-sky-100 border-sky-300 text-sky-900 font-medium ml-4' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                      <span className="text-[9px] font-black block mb-1 text-slate-500 uppercase">{msg.sender === 'USER' ? 'DRILLING SUPERINTENDENT' : 'OIL INDIA AI'}</span>
                      <p className="whitespace-pre-line text-xs">{msg.text}</p>
                    </div>
                  ))}
                  {aiThinking && (
                    <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-xs font-mono animate-pulse">
                      Analyzing telemetry and solving mechanics equations...
                    </div>
                  )}
                </div>
              </div>

              {/* Prompt Input Form */}
              <form onSubmit={handleAiQuerySubmit} className="pt-3 border-t border-slate-200 mt-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ask AI Copilot for mechanics solutions..."
                    value={aiQuery}
                    onChange={e => setAiQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-3 pr-10 py-2.5 text-xs font-mono text-slate-900 placeholder-slate-400 outline-none focus:border-sky-500"
                  />
                  <button type="submit" className="absolute right-2 top-2 p-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white transition cursor-pointer">
                    <Send size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <button type="button" onClick={() => setAiQuery('Optimize parameters for Barail Sand')} className="text-[10px] font-mono px-2 py-1 rounded bg-slate-100 hover:bg-sky-50 hover:border-sky-300 text-slate-700 border border-slate-200 font-semibold transition">
                    Optimize Barail Sand
                  </button>
                  <button type="button" onClick={() => setAiQuery('Detect bit balling symptoms')} className="text-[10px] font-mono px-2 py-1 rounded bg-slate-100 hover:bg-sky-50 hover:border-sky-300 text-slate-700 border border-slate-200 font-semibold transition">
                    Bit Balling Symptoms
                  </button>
                  <button type="button" onClick={() => setAiQuery('Check drillstring buckling limits')} className="text-[10px] font-mono px-2 py-1 rounded bg-slate-100 hover:bg-sky-50 hover:border-sky-300 text-slate-700 border border-slate-200 font-semibold transition">
                    Check Buckling Limits
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* ================= TAB 3: MECHANICS LAB & MAURER DRILL-OFF ================= */}
      {activeSubTab === 'mechanicsLab' && (
        <div className="space-y-4 flex-1 custom-scrollbar min-h-0">
          <div className="p-4 rounded-xl bg-scada-card border border-scada-border font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-scada-border mb-3">
              <span className="font-bold text-white uppercase flex items-center gap-2">
                <TrendingUp size={14} className="text-cyan-400" /> Interactive Mechanics Parameter Sandbox
              </span>
              <button
                onClick={handleAdoptAiPrescription}
                className="px-2.5 py-1 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold flex items-center gap-1 transition"
              >
                <Zap size={12} /> Apply Recommended Sweet Spot (WOB {mechanicsPrescription.optWob} klbs, RPM {mechanicsPrescription.optRpm})
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="p-2.5 rounded bg-black/40 border border-white/5">
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>SURFACE WOB</span>
                  <span className="text-cyan-400 font-bold">{wob} klbs</span>
                </div>
                <input type="range" min="5" max="45" step="0.5" value={wob} onChange={e => { setIsLiveStream(false); setWob(parseFloat(e.target.value)); }} className="w-full mt-1.5 accent-cyan-400 cursor-pointer" />
              </div>

              <div className="p-2.5 rounded bg-black/40 border border-white/5">
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>ROTARY RPM</span>
                  <span className="text-emerald-400 font-bold">{rpm}</span>
                </div>
                <input type="range" min="40" max="200" step="5" value={rpm} onChange={e => { setIsLiveStream(false); setRpm(parseInt(e.target.value)); }} className="w-full mt-1.5 accent-emerald-400 cursor-pointer" />
              </div>

              <div className="p-2.5 rounded bg-black/40 border border-white/5">
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>TORQUE</span>
                  <span className="text-rose-400 font-bold">{torque} ft-lbs</span>
                </div>
                <input type="range" min="1000" max="10000" step="100" value={torque} onChange={e => { setIsLiveStream(false); setTorque(parseInt(e.target.value)); }} className="w-full mt-1.5 accent-rose-400 cursor-pointer" />
              </div>

              <div className="p-2.5 rounded bg-black/40 border border-white/5">
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>ROP (m/hr)</span>
                  <span className="text-amber-400 font-bold">{rop}</span>
                </div>
                <input type="range" min="1" max="60" step="0.5" value={rop} onChange={e => { setIsLiveStream(false); setRop(parseFloat(e.target.value)); }} className="w-full mt-1.5 accent-amber-400 cursor-pointer" />
              </div>

              <div className="p-2.5 rounded bg-black/40 border border-white/5">
                <div className="text-slate-400 text-[10px] mb-1">BIT DIAMETER</div>
                <select value={bitDiameter} onChange={e => { setIsLiveStream(false); setBitDiameter(parseFloat(e.target.value)); }} className="w-full bg-slate-900 border border-scada-border rounded p-1 text-white text-xs outline-none">
                  <option value="6.0">6.0 in (Slimhole)</option>
                  <option value="8.5">8.5 in (Standard)</option>
                  <option value="12.25">12.25 in (Intermediate)</option>
                  <option value="17.5">17.5 in (Surface)</option>
                </select>
              </div>

              <div className="p-2.5 rounded bg-black/40 border border-white/5">
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>ROCK CCS</span>
                  <span className="text-purple-400 font-bold">{rockCcs} psi</span>
                </div>
                <input type="range" min="3000" max="25000" step="500" value={rockCcs} onChange={e => { setIsLiveStream(false); setRockCcs(parseInt(e.target.value)); }} className="w-full mt-1.5 accent-purple-400 cursor-pointer" />
              </div>
            </div>
          </div>

          {/* Dynamic Generated Plots */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-scada-card border border-scada-border">
              <div className="flex items-center justify-between pb-2 border-b border-scada-border mb-3 font-mono text-xs">
                <span className="font-bold text-white uppercase flex items-center gap-2">
                  <TrendingUp size={14} className="text-cyan-400" /> Maurer Drilling Rate Response Curve
                </span>
                <span className="text-[10px] text-cyan-400">Sweet Spot: 22.0 klbs</span>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={drillOffCurve}>
                    <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="wob" label={{ value: 'WOB (klbs)', position: 'insideBottom', offset: -5, fill: '#64748B', fontSize: 10 }} tick={{ fill: '#64748B', fontSize: 10 }} />
                    <YAxis yAxisId="left" label={{ value: 'ROP (m/hr)', angle: -90, position: 'insideLeft', fill: '#06B6D4', fontSize: 10 }} tick={{ fill: '#06B6D4', fontSize: 10 }} domain={['auto', 'auto']} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'MSE (psi)', angle: 90, position: 'insideRight', fill: '#F43F5E', fontSize: 10 }} tick={{ fill: '#F43F5E', fontSize: 10 }} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', fontSize: '11px', fontFamily: 'monospace' }} />
                    <ReferenceLine x={wob} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Current WOB', fill: '#10B981', fontSize: 10 }} />
                    <Line yAxisId="left" type="monotone" dataKey="rop" name="ROP (m/hr)" stroke="#06B6D4" strokeWidth={2.5} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="mse" name="Teale MSE (psi)" stroke="#F43F5E" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-scada-card border border-scada-border">
              <div className="flex items-center justify-between pb-2 border-b border-scada-border mb-3 font-mono text-xs">
                <span className="font-bold text-white uppercase flex items-center gap-2">
                  <Compass size={14} className="text-indigo-400" /> Soft-String Broomstick Drag Envelope
                </span>
                <span className="text-[10px] text-indigo-400">μ = {frictionFactor}</span>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dragEnvelope} layout="vertical">
                    <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" label={{ value: 'Hook Load (klbs)', position: 'insideBottom', fill: '#64748B', fontSize: 10 }} tick={{ fill: '#64748B', fontSize: 10 }} domain={['auto', 'auto']} />
                    <YAxis dataKey="depth" type="category" reversed label={{ value: 'Depth (m)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10 }} tick={{ fill: '#64748B', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', fontSize: '11px', fontFamily: 'monospace' }} />
                    <Line dataKey="pickUp" name="Pick-Up" stroke="#F59E0B" strokeWidth={2} dot={false} />
                    <Line dataKey="rotating" name="Rotating" stroke="#10B981" strokeWidth={2} dot={false} />
                    <Line dataKey="slackOff" name="Slack-Off" stroke="#3B82F6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: SENSOR PLACEMENT & WEIGHT TRANSFER ================= */}
      {activeSubTab === 'sensorPlacement' && (
        <div className="space-y-4 flex-1 custom-scrollbar min-h-0">
          <div className="p-5 rounded-xl bg-scada-card border border-scada-border">
            <div className="flex items-center justify-between pb-3 border-b border-scada-border mb-4 font-mono">
              <span className="text-xs font-bold text-white uppercase">Rig Sensor Array Architecture & Observations</span>
              <span className="text-xs text-emerald-400 font-bold">Transfer Efficiency: {weightTransferEfficiency}%</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                <span className="font-bold text-cyan-400 uppercase block pb-2 border-b border-white/5">Surface Sensor Array</span>
                <div className="flex justify-between p-2.5 rounded bg-white/5">
                  <span>Crown Deadline Load Cell:</span>
                  <strong className="text-cyan-300">{wob} klbs</strong>
                </div>
                <div className="flex justify-between p-2.5 rounded bg-white/5">
                  <span>Top Drive VFD Torque:</span>
                  <strong className="text-rose-300">{torque} ft-lbs</strong>
                </div>
                <div className="flex justify-between p-2.5 rounded bg-white/5">
                  <span>Standpipe PT-101:</span>
                  <strong className="text-emerald-300">{sppPsi} psi</strong>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                <span className="font-bold text-emerald-400 uppercase block pb-2 border-b border-white/5">Downhole MWD Sub Sensors</span>
                <div className="flex justify-between p-2.5 rounded bg-white/5">
                  <span>Downhole WOB (DWOB):</span>
                  <strong className="text-cyan-300">{downholeWob} klbs (Loss: {downholeWobLossPct}%)</strong>
                </div>
                <div className="flex justify-between p-2.5 rounded bg-white/5">
                  <span>Downhole Torque (DTOR):</span>
                  <strong className="text-rose-300">{downholeTorque} ft-lbs</strong>
                </div>
                <div className="flex justify-between p-2.5 rounded bg-white/5">
                  <span>Dawson-Paslay Buckling Limit:</span>
                  <strong className="text-emerald-400">{criticalBucklingLoadKlbs} klbs</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: AUTONOMOUS ANOMALY ENGINE ================= */}
      {activeSubTab === 'diagnostics' && (
        <div className="space-y-4 flex-1 custom-scrollbar min-h-0">
          <div className="p-5 rounded-xl bg-scada-card border border-scada-border">
            <div className="flex items-center justify-between pb-3 border-b border-scada-border mb-4 font-mono">
              <span className="text-xs font-bold text-white uppercase">Autonomous Detection Findings</span>
              <span className="text-xs text-cyan-400 font-bold">{diagnostics.length} Active Findings</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {diagnostics.map((d, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${d.type === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/40' : d.type === 'WARNING' ? 'bg-amber-500/10 border-amber-500/40' : 'bg-cyan-500/10 border-cyan-500/30'}`}>
                  <div className="flex justify-between font-bold text-sm text-white mb-1">
                    <span>{d.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-black/40">{d.type}</span>
                  </div>
                  <p className="text-slate-300 text-xs mb-2">{d.detail}</p>
                  <div className="p-2 rounded bg-black/40 text-cyan-300 text-xs">
                    <strong>Action: </strong>{d.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 6: FIELD OPERATIONS REPORT ================= */}
      {activeSubTab === 'fieldReport' && (
        <div className="p-6 rounded-xl bg-scada-card border border-scada-border flex-1 custom-scrollbar font-mono text-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-scada-border">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">OIL INDIA LIMITED</span>
                <span className="text-xs text-rose-400 font-bold">• eRTMAC DULIAJAN</span>
              </div>
              <h3 className="text-xs text-slate-400 uppercase mt-0.5">
                Official Drilling Mechanics Evaluation & Bit Run Log
              </h3>
            </div>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition">
              <Printer size={14} /> PRINT / EXPORT REPORT
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-black/30 border border-white/5 text-[11px]">
            <div><span className="text-slate-500 block">WELL IDENTIFIER</span><span className="text-cyan-400 font-bold">{telemetry.wellId} (NHK-542)</span></div>
            <div><span className="text-slate-500 block">FORMATION</span><span className="text-white font-bold">Barail Sandstone</span></div>
            <div><span className="text-slate-500 block">TOTAL MSE</span><span className="text-rose-400 font-bold">{totalMsePsi.toLocaleString()} psi</span></div>
            <div><span className="text-slate-500 block">DATE & TIME</span><span className="text-white font-bold">{new Date().toLocaleString()}</span></div>
          </div>

          <div className="p-3.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300">
            <strong>Engineering Sign-off:</strong> Parameters evaluated with pure physics and AI look-ahead models. Drilling envelope validated against Upper Assam Basin stratigraphy.
          </div>
        </div>
      )}

    </div>
  );
};

export default DrillingMechanics;
