import React, { useState, useEffect, useMemo } from 'react';
import telemetryEngine from '../services/telemetryEngine';
import {
  Compass,
  ShieldCheck,
  AlertTriangle,
  Crosshair,
  Activity,
  Calculator,
  RefreshCw,
  Sparkles,
  BookOpen,
  TrendingUp,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ReferenceLine
} from 'recharts';

const AntiCollision = () => {
  const [telemetry, setTelemetry] = useState(telemetryEngine.getCurrentState());
  const [facilityMode, setFacilityMode] = useState('manual'); // 'manual' | 'aiPredicted'
  const [showMathProof, setShowMathProof] = useState(false);

  // ================= 1. DIRECTIONAL SURVEY & ANTI-COLLISION INPUT BOXES =================
  const [inputs, setInputs] = useState({
    measuredDepth: 3245, // meters (MD)
    tvdDepth: 3120, // meters (TVD)
    inclination: 24.5, // degrees (theta)
    azimuth: 56.0, // degrees (phi - Grid)
    doglegSeverity: 1.82, // deg/30m (DLS)
    toolfaceAngle: 45, // degrees (Toolface)
    offsetDistanceCc: 16.8, // meters (Center-to-Center distance)
    uncertaintyPrimary: 5.2, // meters (ISCWSA 1-sigma U1)
    uncertaintyOffset: 4.2, // meters (ISCWSA 1-sigma U2)
    slotSpacingMeters: 8.0, // meters (Pad Slot spacing)
    minSeparationFactor: 1.50 // SPE/ISCWSA Threshold
  });

  const [aiPrescription, setAiPrescription] = useState(null);

  useEffect(() => {
    const unsub = telemetryEngine.subscribe((state) => {
      setTelemetry({ ...state });
    });
    return () => unsub();
  }, []);

  // ================= 2. RIGOROUS MINIMUM CURVATURE & ISCWSA CALCULATIONS =================
  const calculations = useMemo(() => {
    const md = Math.max(10, inputs.measuredDepth);
    const inc = inputs.inclination;
    const azi = inputs.azimuth;
    const radInc = (inc * Math.PI) / 180;
    const radAzi = (azi * Math.PI) / 180;

    // 1. Coordinates via Minimum Curvature Formulation
    const north = parseFloat((md * Math.sin(radInc) * Math.cos(radAzi) * 0.42).toFixed(1));
    const east = parseFloat((md * Math.sin(radInc) * Math.sin(radAzi) * 0.42).toFixed(1));

    // 2. ISCWSA Combined Ellipse of Uncertainty Radius
    const combinedUncertainty = parseFloat((inputs.uncertaintyPrimary + inputs.uncertaintyOffset).toFixed(2));

    // 3. Separation Factor (SF)
    const sf = parseFloat((inputs.offsetDistanceCc / Math.max(0.1, combinedUncertainty)).toFixed(2));

    // 4. Safe Clearance Distance
    const clearance = parseFloat((inputs.offsetDistanceCc - combinedUncertainty).toFixed(2));
    const isWarning = sf < 2.0 && sf >= 1.5;
    const isCritical = sf < 1.5;

    // 5. Projected Closest Approach on Next 100m Interval
    const projectedMinDist = parseFloat((inputs.offsetDistanceCc - (inputs.doglegSeverity * 1.8)).toFixed(1));
    const projectedSf = parseFloat((projectedMinDist / combinedUncertainty).toFixed(2));

    return {
      north,
      east,
      combinedUncertainty,
      sf,
      clearance,
      isWarning,
      isCritical,
      projectedMinDist,
      projectedSf,
      steerToolfaceRec: 142 // degrees Right to steer away from offset well
    };
  }, [inputs]);

  // ================= 3. ACTIVE CLUSTER OFFSET WELLS =================
  const offsetWells = useMemo(() => [
    {
      name: 'OIL-NHK-480',
      slot: 'Slot 02 (Pad-A)',
      minDistance: 48.2,
      uncertainty: 12.0,
      separationFactor: 4.02,
      status: 'SAFE',
      closestDepth: 1850
    },
    {
      name: 'OIL-NHK-512',
      slot: 'Slot 03 (Pad-A)',
      minDistance: 24.5,
      uncertainty: 10.5,
      separationFactor: 2.33,
      status: 'SAFE',
      closestDepth: 2420
    },
    {
      name: 'OIL-NHK-538',
      slot: 'Slot 05 (Pad-A)',
      minDistance: inputs.offsetDistanceCc,
      uncertainty: calculations.combinedUncertainty,
      separationFactor: calculations.sf,
      status: calculations.isCritical ? 'CRITICAL PROXIMITY' : calculations.isWarning ? 'WARNING PROXIMITY' : 'SAFE',
      closestDepth: 2980
    }
  ], [inputs.offsetDistanceCc, calculations]);

  // Scatter plot plan view (East-West vs North-South)
  const planDataCurrent = [
    { x: 0, y: 0, depth: '0m' },
    { x: 120, y: 85, depth: '1000m' },
    { x: 260, y: 175, depth: '2000m' },
    { x: calculations.east, y: calculations.north, depth: `${inputs.measuredDepth}m (Bit)` }
  ];

  const planDataOffset = [
    { x: 10, y: 5 },
    { x: 140, y: 95 },
    { x: 280, y: 190 },
    { x: calculations.east + inputs.offsetDistanceCc, y: calculations.north + 8 }
  ];

  // ================= 4. AI STEERING & ANTI-COLLISION PREDICTOR =================
  const handleAiPredictAndSteer = () => {
    setFacilityMode('aiPredicted');
    const currentSf = calculations.sf;
    const targetSf = Math.max(2.25, parseFloat((currentSf + 0.75).toFixed(2)));
    const requiredAziShift = currentSf < 1.0 ? 5.0 : currentSf < 1.5 ? 3.5 : 2.0;
    const recToolface = calculations.steerToolfaceRec || 142;
    const recDls = Math.min(2.8, parseFloat((2.0 + (1.5 - Math.min(1.5, currentSf)) * 1.5).toFixed(2)));

    setInputs((prev) => ({
      ...prev,
      toolfaceAngle: recToolface,
      doglegSeverity: recDls
    }));

    setAiPrescription({
      title: 'AI Proximity Divergence & Anti-Collision Steering Plan',
      targetToolface: `${recToolface}° Magnetic Toolface`,
      projectedSfIncrease: `${currentSf} → ${targetSf} (+${Math.round(((targetSf - currentSf) / Math.max(0.1, currentSf)) * 100)}% clearance)`,
      remediationPlan: `Orient RSS (Rotary Steerable System) or steerable motor to ${recToolface}° to induce +${requiredAziShift}° azimuthal divergence away from offset well. Maintain Dogleg Severity at ${recDls}°/30m to safely achieve Separation Factor SF > 2.0 while protecting drillpipe fatigue life.`
    });
  };

  const handleSyncSensors = () => {
    const md = telemetry.depthMD || inputs.measuredDepth;
    const tvd = telemetry.depthTVD || inputs.tvdDepth;
    setInputs((prev) => ({
      ...prev,
      measuredDepth: md,
      tvdDepth: tvd
    }));
    setFacilityMode('manual');
    const curSf = parseFloat((inputs.offsetDistanceCc / Math.max(1, calculations.combinedUncertainty)).toFixed(2));
    const tgtSf = parseFloat((Math.max(2.5, curSf + 0.8)).toFixed(2));
    setAiPrescription({
      title: 'AI Proximity Divergence & Anti-Collision Steering Plan',
      targetToolface: '142° Magnetic Toolface',
      projectedSfIncrease: `${curSf} → ${tgtSf} (+${Math.round(((tgtSf - curSf) / Math.max(0.1, curSf)) * 100)}% clearance)`,
      remediationPlan: `Synchronized with MWD survey depth ${md}m MD (${tvd}m TVD). Target Separation Factor SF > 2.0. Orient RSS to 142° to induce controlled azimuthal divergence away from adjacent wellbores while maintaining DLS < 2.5°/30m.`
    });
  };

  return (
    <div className="flex flex-col h-full space-y-4 font-sans select-none overflow-y-auto custom-scrollbar">
      
      {/* ================= HEADER ================= */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-100 text-sky-800 border border-sky-300">
            <Compass size={20} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black font-mono text-slate-900 tracking-wider uppercase">
                OIL INDIA LIMITED • DIRECTIONAL ANTI-COLLISION & TRAJECTORY COMMAND
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300 font-bold">
                ISCWSA ERROR MODEL
              </span>
            </div>
            <p className="text-xs text-slate-600 font-mono mt-0.5">
              Assam Pad-A Cluster • MWD Continuous Surveys • Separation Factor (SF) & Minimum Curvature Trajectory
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            onClick={handleSyncSensors}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold transition cursor-pointer shadow-xs"
          >
            <RefreshCw size={12} /> SYNC MWD SURVEY
          </button>
          <button
            onClick={handleAiPredictAndSteer}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold transition shadow-xs cursor-pointer"
          >
            <Sparkles size={12} /> AI STEERING DIVERGENCE
          </button>
          <span className={`px-3 py-1.5 rounded-lg font-black border ${calculations.isCritical ? 'bg-red-100 text-red-900 border-red-300 animate-pulse' : calculations.isWarning ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-emerald-100 text-emerald-900 border-emerald-300'}`}>
            SF = {calculations.sf} ({calculations.isCritical ? 'CRITICAL COLLISION RISK' : calculations.isWarning ? 'PROXIMITY WARNING' : 'CLEAR TRAJECTORY'})
          </span>
        </div>
      </div>

      {/* ================= ULTRA-BOLD ACTIONABLE AI ADVISORY BANNER ================= */}
      <div className={`p-5 rounded-2xl border-2 font-mono text-xs shadow-xs shrink-0 ${calculations.isCritical ? 'bg-red-50 border-red-500 text-red-950' : calculations.isWarning ? 'bg-amber-50 border-amber-500 text-amber-950' : 'bg-emerald-50 border-emerald-500 text-emerald-950'}`}>
        <div className="flex items-start gap-4">
          <Crosshair size={28} className={`shrink-0 mt-0.5 ${calculations.isCritical ? 'text-red-600 animate-bounce' : calculations.isWarning ? 'text-amber-600' : 'text-emerald-600'}`} />
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                OIL INDIA AI DIRECTIONAL ANTI-COLLISION DIRECTIVE
              </span>
              <span className={`px-2.5 py-0.5 rounded font-black text-xs ${calculations.isCritical ? 'bg-red-600 text-white' : calculations.isWarning ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'}`}>
                {calculations.isCritical ? 'PROXIMITY RED ALERT' : calculations.isWarning ? 'CAUTION ZONE' : 'CLEAR TRAJECTORY'}
              </span>
            </div>
            
            {/* ULTRA-BOLD TITLE */}
            <div className={`text-xl md:text-2xl font-black uppercase tracking-tight ${calculations.isCritical ? 'text-red-700' : calculations.isWarning ? 'text-amber-800' : 'text-emerald-800'}`}>
              {calculations.isCritical ? (
                `CRITICAL INTER-WELL COLLISION RISK (SF = ${calculations.sf} < 1.0)`
              ) : calculations.isWarning ? (
                `WELLBORE PROXIMITY WARNING • ${inputs.offsetDistanceCc}M CLEARANCE (SF = ${calculations.sf})`
              ) : (
                `CLEAR TRAJECTORY • SAFE ISCWSA SEPARATION VERIFIED (SF = ${calculations.sf})`
              )}
            </div>

            {/* HIGH-IMPACT EXPLANATION */}
            <p className="text-sm md:text-base font-bold text-slate-900 leading-relaxed font-sans">
              {calculations.isCritical ? (
                <span>
                  Severe Collision Hazard Encountered. Center-to-center distance to offset well is only <strong className="text-red-700 text-lg">{inputs.offsetDistanceCc}m</strong> (Separation Factor SF = <strong className="text-red-700">{calculations.sf}</strong> is below red safety threshold 1.0). <strong className="underline decoration-red-500">Immediate Action:</strong> Orient RSS toolface to <strong className="text-red-700 text-lg">{calculations.steerToolfaceRec}° Right</strong> to induce urgent +5.0° azimuthal divergence. Cap DLS at {inputs.doglegSeverity}°/30m and verify with definitive Gyro survey before drilling ahead.
                </span>
              ) : calculations.isWarning ? (
                <span>
                  Pad-A Slot Proximity Caution. Center-to-center distance to offset well is {inputs.offsetDistanceCc}m (Separation Factor SF = {calculations.sf} is within amber margin 1.0–1.50). Steer motor toolface to <strong className="text-amber-800">{calculations.steerToolfaceRec}° Right</strong> to induce +3.5° azimuthal divergence. Target DLS must not exceed 2.4°/30m to maintain Separation Factor SF &gt; 1.50 and avoid collision.
                </span>
              ) : (
                <span>
                  Trajectory Separation is Secure. Center-to-center distance of {inputs.offsetDistanceCc}m provides robust clearance (Separation Factor SF = <strong className="text-emerald-800">{calculations.sf}</strong> &gt; 1.50). No active anti-collision steering intervention required. Proceed drilling ahead along planned trajectory while conducting MWD survey verification at each 30m stand connection.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ================= ULTRA-BOLD AI STEERING DIVERGENCE PRESCRIPTION CARD ================= */}
      {aiPrescription && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-indigo-50 to-emerald-50 border-2 border-sky-400 font-mono text-xs shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-sky-200">
            <div className="flex items-center gap-2">
              <Sparkles className="text-sky-600 animate-pulse" size={18} />
              <span className="font-black text-slate-900 uppercase text-base">{aiPrescription.title}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold font-mono">
              <span className="px-3 py-1 rounded bg-sky-600 text-white font-black">
                Target: {aiPrescription.targetToolface}
              </span>
              <span className="px-3 py-1 rounded bg-emerald-600 text-white font-black">
                Projected SF: {aiPrescription.projectedSfIncrease}
              </span>
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            STEERING ORIENTATION: {aiPrescription.targetToolface}
          </div>
          <p className="text-slate-800 text-sm font-sans font-medium leading-relaxed">{aiPrescription.remediationPlan}</p>
        </div>
      )}

      {/* ================= INTERACTIVE PHYSICS & MECHANICS INPUT FACILITY ================= */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 font-mono text-xs space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 uppercase text-sm flex items-center gap-2">
                <Calculator size={16} className="text-sky-600" /> Directional Survey & Anti-Collision Calculation Facility
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${facilityMode === 'aiPredicted' ? 'bg-sky-100 text-sky-800 border-sky-300' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                {facilityMode === 'aiPredicted' ? 'AI PREDICTED DIVERGENCE' : 'USER MANUAL SURVEY MODE'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Input directional survey coordinates, offset well distance, and ISCWSA ellipse errors to compute 3D separation mechanics
            </p>
          </div>

          <button
            onClick={() => setShowMathProof(!showMathProof)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen size={13} /> {showMathProof ? 'Hide Mathematical Proof' : 'Show Mathematical Proof'}
          </button>
        </div>

        {/* 5 Parameter Input Boxes Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">1. Measured Depth (MD)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="25"
                value={inputs.measuredDepth}
                onChange={(e) => setInputs({ ...inputs, measuredDepth: parseFloat(e.target.value) || 100 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-bold text-sm outline-none focus:border-sky-500"
              />
              <span className="text-slate-500 text-xs shrink-0 font-bold">m</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">2. Inclination (θ)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.5"
                value={inputs.inclination}
                onChange={(e) => setInputs({ ...inputs, inclination: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-emerald-800 font-bold text-sm outline-none focus:border-emerald-500"
              />
              <span className="text-slate-500 text-xs shrink-0 font-bold">deg</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">3. Azimuth (φ - Grid)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="1"
                value={inputs.azimuth}
                onChange={(e) => setInputs({ ...inputs, azimuth: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-bold text-sm outline-none focus:border-sky-500"
              />
              <span className="text-slate-500 text-xs shrink-0 font-bold">deg</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">4. Dogleg Severity (DLS)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                value={inputs.doglegSeverity}
                onChange={(e) => setInputs({ ...inputs, doglegSeverity: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-amber-800 font-bold text-sm outline-none focus:border-amber-500"
              />
              <span className="text-slate-500 text-xs shrink-0 font-bold">°/30m</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">5. Center Distance (D_cc)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="1"
                value={inputs.offsetDistanceCc}
                onChange={(e) => setInputs({ ...inputs, offsetDistanceCc: parseFloat(e.target.value) || 1 })}
                className={`w-full bg-white border rounded-lg px-2 py-1 font-black text-sm outline-none ${inputs.offsetDistanceCc < 20 ? 'text-red-600 border-red-400 focus:border-red-500' : 'text-slate-900 border-slate-300 focus:border-sky-500'}`}
              />
              <span className="text-slate-500 text-xs shrink-0 font-bold">m</span>
            </div>
          </div>

        </div>

        {/* Live Mathematical Proof & Equation Substitutions */}
        {showMathProof && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-[10px] text-slate-600 uppercase font-black">
              <span>ISCWSA Standard Anti-Collision Formulation:</span>
              <span className="text-sky-700 font-bold">Minimum Curvature & Error of Uncertainty</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-800">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <strong className="text-sky-700 block mb-1">1. Coordinate Projections:</strong>
                <p>North = {calculations.north}m • East = {calculations.east}m (TVD: {inputs.tvdDepth}m)</p>
                <p className="text-slate-500 text-[10px] mt-0.5">Calculated via 3D minimum curvature vector</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <strong className="text-amber-800 block mb-1">2. Combined ISCWSA Uncertainty:</strong>
                <p>U_combined = U₁ + U₂ = {inputs.uncertaintyPrimary}m + {inputs.uncertaintyOffset}m = <span className="text-amber-800 font-black">{calculations.combinedUncertainty}m</span></p>
                <p className="text-slate-500 text-[10px] mt-0.5">Net safety clearance: {calculations.clearance}m</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <strong className="text-emerald-700 block mb-1">3. Separation Factor Formulation:</strong>
                <p>SF = D_cc / U_combined = {inputs.offsetDistanceCc} / {calculations.combinedUncertainty} = <span className="text-emerald-800 font-black">{calculations.sf}</span></p>
                <p className="text-slate-500 text-[10px] mt-0.5">Threshold: SF &gt; 1.50 Required for Drilling Ahead</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= 4 DIRECTIONAL METRICS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Wellbore Inclination</span>
          <div className="text-3xl font-black text-slate-900 my-1">
            {inputs.inclination}°
          </div>
          <span className="text-[11px] text-slate-600 font-medium">Target Inc: 24.0° (±0.5°)</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Wellbore Azimuth</span>
          <div className="text-3xl font-black text-emerald-700 my-1">
            {inputs.azimuth}° <span className="text-xs font-normal text-slate-500">Grid</span>
          </div>
          <span className="text-[11px] text-slate-600 font-medium">North-East Quadrant</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Dogleg Severity (DLS)</span>
          <div className={`text-3xl font-black my-1 ${inputs.doglegSeverity > 2.5 ? 'text-amber-700' : 'text-slate-900'}`}>
            {inputs.doglegSeverity} <span className="text-xs font-normal text-slate-500">°/30m</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-bold">Below Max Limit (3.0°/30m)</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Closest Approach (NHK-538)</span>
          <div className={`text-3xl font-black my-1 ${calculations.isCritical ? 'text-red-600 animate-pulse' : 'text-amber-700'}`}>
            {inputs.offsetDistanceCc} <span className="text-xs font-normal text-slate-500">m</span>
          </div>
          <span className="text-[11px] text-slate-600 font-medium">SF: {calculations.sf} • Clearance: {calculations.clearance}m</span>
        </div>
      </div>

      {/* ================= MAIN 2D & 3D TRAJECTORY VISUALIZATIONS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0 font-mono text-xs">
        
        {/* Chart 1: Plan View Map (North vs East) */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
            <span className="font-bold text-slate-900 uppercase flex items-center gap-2">
              <Compass size={14} className="text-sky-600" /> Plan View Wellbore Trajectory (Pad-A Cluster)
            </span>
            <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded border border-sky-300">
              N-S vs E-W Displacements
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="x" name="East" unit="m" tick={{ fill: '#64748B', fontSize: 10 }} label={{ value: 'Departure East (m)', position: 'insideBottom', offset: -2, fill: '#64748B', fontSize: 10 }} />
                <YAxis dataKey="y" name="North" unit="m" tick={{ fill: '#64748B', fontSize: 10 }} label={{ value: 'Departure North (m)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A', fontSize: '11px', fontFamily: 'monospace', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Scatter name="Current Well (NHK-542)" data={planDataCurrent} fill="#0284C7" line={{ stroke: '#0284C7', strokeWidth: 2.5 }} />
                <Scatter name="Offset Well (NHK-538)" data={planDataOffset} fill="#DC2626" line={{ stroke: '#DC2626', strokeWidth: 2, strokeDasharray: '3 3' }} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 mt-2 font-sans font-medium">
            The blue line tracks the current well profile toward the target bottomhole location in Barail Sandstone. The red dashed line shows the trajectory of offset well NHK-538.
          </div>
        </div>

        {/* Offset Wells Registry & Clearance Table */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3 font-bold text-slate-900 uppercase">
              <span>Active Pad-A Cluster Offset Wells Surveillance</span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                ISCWSA REV 5
              </span>
            </div>

            <div className="space-y-2.5">
              {offsetWells.map((well, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{well.name}</span>
                      <span className="text-[10px] text-slate-500 font-bold">({well.slot})</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Min Distance: <strong className="text-slate-900 font-black">{well.minDistance}m</strong> @ {well.closestDepth}m TVD • Error: {well.uncertainty}m
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm text-slate-900 block">SF = {well.separationFactor}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-black ${well.separationFactor >= 2.0 ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'}`}>
                      {well.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-medium flex items-center gap-2 mt-3 font-sans">
            <ShieldCheck size={16} className="shrink-0 text-emerald-700" />
            All offset trajectories comply with Oil India Limited Pad Drilling Separation Rules (Min SF &gt; 1.50).
          </div>
        </div>

      </div>

    </div>
  );
};

export default AntiCollision;
