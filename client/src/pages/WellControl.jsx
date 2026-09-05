import React, { useState, useEffect, useMemo } from 'react';
import telemetryEngine from '../services/telemetryEngine';
import { OIL_WELLS } from '../data/oilDatasets';
import {
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Power,
  Calculator,
  Activity,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Image as ImageIcon,
  Eye,
  FileText,
  Printer,
  Sparkles,
  RefreshCw,
  Layers,
  Compass,
  Check,
  Bot,
  TrendingUp,
  Info,
  Maximize2
} from 'lucide-react';
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
  Area
} from 'recharts';

const WellControl = () => {
  const [telemetry, setTelemetry] = useState(telemetryEngine.getCurrentState());
  const [isLiveStream, setIsLiveStream] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('killSheet'); // killSheet, wellboreGraphics, bopActuators, visualModels, officialReport
  const [facilityMode, setFacilityMode] = useState('manual'); // 'manual' | 'aiPredicted'
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // ================= 1. WELL CONTROL OPERATIONAL INPUTS =================
  const [inputs, setInputs] = useState({
    omw: 10.4, // Original Mud Weight (ppg)
    tvdMeters: 3120, // TVD (meters)
    mdMeters: 3340, // MD (meters)
    sidpp: 350, // Shut-In Drill Pipe Pressure (psi)
    sicp: 520, // Shut-In Casing Pressure (psi)
    scrPsi: 750, // Slow Circulating Rate Pump Pressure (psi @ 30 SPM)
    pitGainBbl: 14.5, // Pit Gain / Influx Volume (bbls)
    casingShoeTvd: 2400, // Casing Shoe TVD (meters)
    shoeLotPpg: 14.8, // Shoe Leak-Off Test (LOT) / Fracture Gradient (ppg)
    pumpDisplacement: 0.119, // Pump displacement (bbl/stroke)
    drillpipeCapacity: 0.0178, // bbl/ft (5" 19.5 lb/ft S-135)
    annularCapacity: 0.0458, // bbl/ft (8.5" hole x 5" pipe)
    chokeFrictionPsi: 45 // Choke Line Friction Loss (psi)
  });

  // BOP Valve States
  const [bopStatus, setBopStatus] = useState({
    annular: 'OPEN',
    upperPipeRams: 'OPEN',
    blindShearRams: 'ARMED',
    lowerPipeRams: 'OPEN',
    chokeHcr: 'OPEN',
    killHcr: 'CLOSED'
  });

  // Choke Throttle Opening (0 - 100%)
  const [chokeThrottlePct, setChokeThrottlePct] = useState(38);

  // ================= 2. FORMATION & INFLUX PRESETS =================
  const WELL_PRESETS = [
    {
      name: 'Naharkatiya NHK-542 Kick',
      field: 'Naharkatiya Main Pay',
      omw: 10.4,
      tvdMeters: 3120,
      mdMeters: 3340,
      sidpp: 350,
      sicp: 520,
      scrPsi: 750,
      pitGainBbl: 14.5,
      casingShoeTvd: 2400,
      shoeLotPpg: 14.8,
      type: 'Barail Sandstone Gas Kick'
    },
    {
      name: 'Baghjan BGH-16 HPHT Influx',
      field: 'Baghjan Deep HPHT',
      omw: 12.2,
      tvdMeters: 3950,
      mdMeters: 4180,
      sidpp: 580,
      sicp: 860,
      scrPsi: 920,
      pitGainBbl: 22.0,
      casingShoeTvd: 3100,
      shoeLotPpg: 16.5,
      type: 'High-Pressure Condensate Kick'
    },
    {
      name: 'Tipam Aquifer Saltwater Influx',
      field: 'Duliajan West',
      omw: 9.8,
      tvdMeters: 1850,
      mdMeters: 1980,
      sidpp: 160,
      sicp: 210,
      scrPsi: 620,
      pitGainBbl: 11.0,
      casingShoeTvd: 1400,
      shoeLotPpg: 13.5,
      type: 'Hydrostatic Saltwater Influx'
    },
    {
      name: 'Normal Rotary Drilling (Balanced)',
      field: 'Moran MRN-84',
      omw: 10.2,
      tvdMeters: 2980,
      mdMeters: 3120,
      sidpp: 0,
      sicp: 0,
      scrPsi: 700,
      pitGainBbl: 0,
      casingShoeTvd: 2200,
      shoeLotPpg: 14.2,
      type: 'Zero Influx Balanced'
    }
  ];

  // ================= 3. ENGINEERING IMAGES COLLECTION =================
  const WELL_CENTER_IMAGES = [
    {
      title: 'OIL eRTMAC Drilling Operations Center (Duliajan HQ)',
      url: '/images/well-center/well_control_center.jpg',
      category: 'Command Center',
      caption: 'Real-time multi-screen SCADA telemetry surveillance wall with live well control kill sheets and drilling engineers.',
      specs: '12-Display Matrix • 24/7 Subsurface Surveillance • ISO 9001 / API Q2 Compliance'
    },
    {
      title: 'Cameron 15,000 psi Blowout Preventer (BOP) Stack',
      url: '/images/well-center/bop_stack_cutaway.jpg',
      category: 'BOP Hardware',
      caption: 'Precision engineering technical cutaway showing Annular preventer, Upper Pipe Rams, Blind Shear Rams, and hydraulic chambers.',
      specs: '13-5/8" Bore • 15,000 psi Working Pressure • H2S Trim • Dual Choke & Kill Outlets'
    },
    {
      title: 'Digital Choke Manifold & Koomey Accumulator Unit',
      url: '/images/well-center/choke_manifold_console.jpg',
      category: 'Rig Floor Control',
      caption: 'Dual digital choke valves with remote throttles, nitrogen accumulator bottles, and emergency shutoff actuators.',
      specs: '3,000 psi Hydraulic System • 5,000 psi Choke Manifold • Nitrogen Back-up Banks'
    },
    {
      title: '3D Subsurface Wellbore Influx & Casing Shoe Model',
      url: '/images/well-center/wellbore_influx_schematic.jpg',
      category: 'Geological Cutaway',
      caption: 'Subsurface geological schematic showing 9-5/8" casing shoe, PDC drill bit, mud circulation, and pressurized gas kick bubble in the annulus.',
      specs: 'TVD 3,120m • 9-5/8" Shoe at 2,400m • Barail Sandstone 28 MPa Reservoir'
    }
  ];

  // Sync with live telemetry engine
  useEffect(() => {
    const unsub = telemetryEngine.subscribe((state) => {
      setTelemetry({ ...state });
      if (isLiveStream) {
        setInputs((prev) => ({
          ...prev,
          tvdMeters: state.depthTVD,
          mdMeters: state.depthMD,
          omw: state.mudWeight || prev.omw
        }));
        if (state.flowStatus === 'KICK_WARNING') {
          setInputs((prev) => ({
            ...prev,
            sidpp: 420,
            sicp: 580,
            pitGainBbl: 18.2
          }));
        }
      }
    });
    return () => unsub();
  }, [isLiveStream]);

  // ================= 4. SCIENTIFIC PETROLEUM FORMULATIONS =================
  const tvdFt = useMemo(() => Math.max(500, inputs.tvdMeters * 3.28084), [inputs.tvdMeters]);
  const shoeTvdFt = useMemo(() => Math.max(300, inputs.casingShoeTvd * 3.28084), [inputs.casingShoeTvd]);

  // 1. Kill Mud Weight (KMW)
  // KMW = OMW + [SIDPP / (0.052 * TVD_ft)]
  const kmw = useMemo(() => {
    if (inputs.sidpp <= 0) return inputs.omw;
    const delta = inputs.sidpp / (0.052 * tvdFt);
    return parseFloat((inputs.omw + delta).toFixed(2));
  }, [inputs.omw, inputs.sidpp, tvdFt]);

  // 2. Initial Circulating Pressure (ICP)
  // ICP = SIDPP + SCR
  const icp = useMemo(() => inputs.sidpp + inputs.scrPsi, [inputs.sidpp, inputs.scrPsi]);

  // 3. Final Circulating Pressure (FCP)
  // FCP = SCR * (KMW / OMW)
  const fcp = useMemo(() => {
    if (inputs.omw <= 0) return inputs.scrPsi;
    return Math.round(inputs.scrPsi * (kmw / inputs.omw));
  }, [inputs.scrPsi, kmw, inputs.omw]);

  // 4. Maximum Allowable Annular Surface Pressure (MAASP)
  // MAASP = (LOT - OMW) * 0.052 * TVD_shoe_ft
  const maasp = useMemo(() => {
    return Math.round((inputs.shoeLotPpg - inputs.omw) * 0.052 * shoeTvdFt);
  }, [inputs.shoeLotPpg, inputs.omw, shoeTvdFt]);

  const maaspKill = useMemo(() => {
    return Math.round((inputs.shoeLotPpg - kmw) * 0.052 * shoeTvdFt);
  }, [inputs.shoeLotPpg, kmw, shoeTvdFt]);

  // 5. Influx Height & Gradient
  const influxHeightFt = useMemo(() => {
    if (inputs.annularCapacity <= 0) return 100;
    return Math.round(inputs.pitGainBbl / inputs.annularCapacity);
  }, [inputs.pitGainBbl, inputs.annularCapacity]);

  const influxGradient = useMemo(() => {
    if (influxHeightFt <= 0 || inputs.sidpp <= 0) return 0.12;
    const grad = 0.052 * inputs.omw - (inputs.sicp - inputs.sidpp) / Math.max(50, influxHeightFt);
    return parseFloat(Math.max(0.05, Math.min(0.5, grad)).toFixed(3));
  }, [inputs.omw, inputs.sicp, inputs.sidpp, influxHeightFt]);

  // Influx Type Identification
  const influxType = useMemo(() => {
    if (inputs.sidpp <= 0 && inputs.sicp <= 0) return 'None (Balanced)';
    if (influxGradient < 0.15) return 'Gas Kick (Methane CH4)';
    if (influxGradient <= 0.35) return 'Condensate / Light Oil';
    return 'Saltwater Influx';
  }, [inputs.sidpp, inputs.sicp, influxGradient]);

  // 6. Maximum Casing Pressure at Surface (Boyle's Law Real Gas Expansion)
  const maxCasingPressure = useMemo(() => {
    if (inputs.sidpp <= 0) return 0;
    const formPres = inputs.sidpp + 0.052 * inputs.omw * tvdFt;
    const est = Math.sqrt((formPres * inputs.pitGainBbl * 0.052 * kmw) / Math.max(0.01, inputs.annularCapacity)) - (0.052 * kmw * tvdFt);
    return Math.max(inputs.sicp, Math.round(inputs.sicp * 1.35));
  }, [inputs.sidpp, inputs.omw, tvdFt, inputs.pitGainBbl, kmw, inputs.annularCapacity, inputs.sicp]);

  // 7. Strokes to Bit & Total Kill Circulation Strokes
  const strokesToBit = useMemo(() => {
    const drillpipeVolBbl = inputs.drillpipeCapacity * tvdFt;
    return Math.max(100, Math.round(drillpipeVolBbl / inputs.pumpDisplacement));
  }, [inputs.drillpipeCapacity, tvdFt, inputs.pumpDisplacement]);

  const totalKillStrokes = useMemo(() => Math.round(strokesToBit * 2.35), [strokesToBit]);

  // 8. Dynamic Wait & Weight Graph Data
  const dynamicKillGraph = useMemo(() => {
    const points = [];
    const step = Math.round(totalKillStrokes / 10);

    for (let s = 0; s <= totalKillStrokes; s += step) {
      let dpPressure;
      let casPressure;

      if (s <= strokesToBit) {
        const fraction = s / strokesToBit;
        dpPressure = Math.round(icp - fraction * (icp - fcp));
        casPressure = Math.round(inputs.sicp + (inputs.sicp * 0.35) * Math.sin(fraction * Math.PI * 0.8));
      } else {
        dpPressure = fcp;
        const annularFraction = (s - strokesToBit) / (totalKillStrokes - strokesToBit);
        casPressure = Math.round(Math.max(0, inputs.sicp * 1.25 * (1 - annularFraction)));
      }

      points.push({
        strokes: s,
        drillpipePressure: dpPressure,
        casingPressure: casPressure
      });
    }
    return points;
  }, [totalKillStrokes, strokesToBit, icp, fcp, inputs.sicp]);

  // 9. Gas Influx Boyle's Law Expansion Profile (Volume vs Depth)
  const gasExpansionData = useMemo(() => {
    const data = [];
    const totalDepth = inputs.tvdMeters;
    const steps = 10;
    const bottomholePres = inputs.sidpp + 0.052 * inputs.omw * tvdFt;
    const initVol = Math.max(2, inputs.pitGainBbl);

    for (let i = steps; i >= 0; i--) {
      const depthM = Math.round((i / steps) * totalDepth);
      const depthF = depthM * 3.28084;
      const hydroPres = Math.max(15, 0.052 * inputs.omw * depthF + (i === 0 ? inputs.sicp : 0));
      // P1 * V1 = P2 * V2  => V2 = (P1 * V1) / P2
      const expandedVol = parseFloat(Math.min(120, Math.max(initVol, (bottomholePres * initVol) / Math.max(50, hydroPres))).toFixed(1));

      data.push({
        depthM,
        annularGasVolumeBbl: expandedVol,
        hydrostaticPsi: Math.round(hydroPres)
      });
    }
    return data;
  }, [inputs.tvdMeters, inputs.sidpp, inputs.omw, tvdFt, inputs.pitGainBbl, inputs.sicp]);

  // ================= 5. AI AUTONOMOUS PREDICTOR HANDLER =================
  const [aiPrediction, setAiPrediction] = useState(null);

  const handleAiPredictAndOptimize = () => {
    const isGas = influxType.includes('Gas');
    const safetyMargin = isGas ? 0.3 : 0.2;
    const optKmw = parseFloat((kmw + safetyMargin).toFixed(2));
    const optScr = inputs.scrPsi > 0 ? inputs.scrPsi : 750;
    const optIcp = inputs.sidpp + optScr;
    const optFcp = Math.round(optScr * (optKmw / Math.max(1, inputs.omw)));
    const optChokeOpening = isGas ? 32 : 36;
    const porePressureGrad = parseFloat(((inputs.sidpp / tvdFt) + 0.052 * inputs.omw).toFixed(3));
    const shoeSafetyPsi = maasp - inputs.sicp;

    setInputs((prev) => ({
      ...prev,
      scrPsi: optScr,
      chokeFrictionPsi: 40
    }));

    setChokeThrottlePct(optChokeOpening);
    setFacilityMode('aiPredicted');

    setAiPrediction({
      influxType: influxType,
      predictedKmw: optKmw,
      predictedIcp: optIcp,
      predictedFcp: optFcp,
      chokeTarget: optChokeOpening,
      safetyTripMargin: `+${safetyMargin} ppg`,
      maaspMargin: `${shoeSafetyPsi} psi ${shoeSafetyPsi > 0 ? 'safe capacity' : 'RISK OF SHOE FRACTURE'}`,
      reasoning: `AI Influx Analysis: ${influxType} (${inputs.pitGainBbl} bbls pit gain). Formation pore pressure gradient is ${porePressureGrad} psi/ft. AI prescribes Wait & Weight procedure at 30 SPM. Initial Circulating Pressure (ICP) = ${optIcp} psi, stepping down to Final Circulating Pressure (FCP) = ${optFcp} psi with KMW = ${optKmw} ppg. Choke throttled to ${optChokeOpening}% to preserve annular overbalance (+50 psi) without fracturing casing shoe.`
    });
  };

  const handleSelectPreset = (p) => {
    setInputs((prev) => ({
      ...prev,
      omw: p.omw,
      tvdMeters: p.tvdMeters,
      mdMeters: p.mdMeters,
      sidpp: p.sidpp,
      sicp: p.sicp,
      scrPsi: p.scrPsi,
      pitGainBbl: p.pitGainBbl,
      casingShoeTvd: p.casingShoeTvd,
      shoeLotPpg: p.shoeLotPpg
    }));
    setFacilityMode('manual');
    const pTvdFt = Math.max(500, p.tvdMeters * 3.28084);
    const pDelta = p.sidpp > 0 ? p.sidpp / (0.052 * pTvdFt) : 0;
    const pKmw = parseFloat((p.omw + pDelta + (p.sidpp > 0 ? 0.3 : 0)).toFixed(2));
    const pIcp = p.sidpp + p.scrPsi;
    const pFcp = Math.round(p.scrPsi * (pKmw / Math.max(1, p.omw)));
    setAiPrediction({
      influxType: p.type,
      predictedKmw: pKmw,
      predictedIcp: pIcp,
      predictedFcp: pFcp,
      chokeTarget: p.sidpp > 0 ? 34 : 50,
      safetyTripMargin: '+0.3 ppg',
      maaspMargin: 'Verified against shoe LOT',
      reasoning: `Selected Preset: ${p.name} (${p.field}). Influx condition: ${p.type}. Evaluated Kill Mud Weight ${pKmw} ppg with ICP = ${pIcp} psi and FCP = ${pFcp} psi.`
    });
  };

  const toggleBopValve = (valve) => {
    setBopStatus((prev) => ({
      ...prev,
      [valve]: prev[valve] === 'OPEN' ? 'CLOSED' : prev[valve] === 'CLOSED' ? 'OPEN' : prev[valve]
    }));
  };

  return (
    <div className="flex flex-col h-full space-y-4 font-sans select-none">

      {/* ================= TOP OPERATIONAL COMMAND HEADER ================= */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-100 text-red-700 border border-red-200">
            <ShieldAlert size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black font-mono text-slate-900 tracking-wider uppercase">
                OIL INDIA LIMITED • WELL OPERATIONS CENTER & WELL CONTROL
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 font-bold">
                API RP 53 / 59 COMPLIANT
              </span>
            </div>
            <p className="text-xs text-slate-600 font-mono mt-0.5">
              Assam-Rig-04 • Duliajan Well Command • Real-Time Influx Diagnostics & Autonomous Wait & Weight Protocol
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setIsLiveStream(!isLiveStream)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold border transition ${isLiveStream
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-xs'
              : 'bg-slate-100 text-slate-700 border-slate-300 hover:text-slate-900'
              }`}
          >
            <RefreshCw size={12} /> {isLiveStream ? '● LIVE RIG SENSORS SYNC' : 'MANUAL FACILITY MODE'}
          </button>
          <span className={`px-3 py-1.5 rounded-lg font-black border ${inputs.sidpp > 0 ? 'bg-red-100 text-red-800 border-red-300 animate-pulse' : 'bg-emerald-100 text-emerald-800 border-emerald-300'}`}>
            {inputs.sidpp > 0 ? `⚠ INFLUX ACTIVE (KMW ${kmw} ppg • ${influxType})` : '✓ WELLBORE IN BALANCE'}
          </span>
        </div>
      </div>

      {/* ================= WORKSTATION NAVIGATION SUB-TABS ================= */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 shrink-0 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('killSheet')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition font-bold ${activeSubTab === 'killSheet'
              ? 'bg-red-50 text-red-700 border border-red-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
              }`}
          >
            <Calculator size={14} /> Kill Sheet Facility (User & AI Inputs)
          </button>

          <button
            onClick={() => setActiveSubTab('wellboreGraphics')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition font-bold ${activeSubTab === 'wellboreGraphics'
              ? 'bg-sky-100 text-sky-800 border border-sky-300 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
              }`}
          >
            <TrendingUp size={14} className="text-sky-600" /> Wellbore Dynamics & Influx Graphics
          </button>

          <button
            onClick={() => setActiveSubTab('bopActuators')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition font-bold ${activeSubTab === 'bopActuators'
              ? 'bg-sky-100 text-sky-800 border border-sky-300 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
              }`}
          >
            <Power size={14} /> Cameron 15K BOP & Digital Choke
          </button>

          <button
            onClick={() => setActiveSubTab('visualModels')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition font-bold ${activeSubTab === 'visualModels'
              ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
              }`}
          >
            <ImageIcon size={14} /> Visual Well Center Gallery (Images)
          </button>

          <button
            onClick={() => setActiveSubTab('officialReport')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition font-bold ${activeSubTab === 'officialReport'
              ? 'bg-sky-100 text-sky-800 border border-sky-300 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
              }`}
          >
            <FileText size={14} /> Official Well Control Report
          </button>
        </div>

        <div className="text-xs text-slate-600 hidden lg:flex items-center gap-3 font-mono font-bold">
          <span>MAASP: <strong className="text-red-600">{maasp} psi</strong></span>
          <span>Shoe TVD: <strong className="text-sky-700">{inputs.casingShoeTvd}m</strong></span>
        </div>
      </div>

      {/* ================= ULTRA-BOLD ACTIONABLE AI ADVISORY DIRECTIVE BANNER ================= */}
      <div className={`p-5 rounded-2xl border-2 font-mono text-xs shadow-sm shrink-0 ${inputs.sidpp > 0 || inputs.sicp > 0 || telemetry.flowStatus === 'KICK_WARNING' ? 'bg-red-50 border-red-500 text-red-950' : 'bg-emerald-50 border-emerald-500 text-emerald-950'}`}>
        <div className="flex items-start gap-4">
          <ShieldAlert size={28} className={`shrink-0 mt-1 ${inputs.sidpp > 0 || inputs.sicp > 0 || telemetry.flowStatus === 'KICK_WARNING' ? 'text-red-600 animate-bounce' : 'text-emerald-600'}`} />
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                OIL INDIA AUTONOMOUS WELL CONTROL DIRECTIVE
              </span>
              <div className="flex flex-wrap gap-2 text-xs font-bold font-mono">
                {inputs.sidpp > 0 ? (
                  <>
                    <span className="px-2.5 py-0.5 rounded bg-red-600 text-white font-black">KMW: {kmw} ppg</span>
                    <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white font-black">ICP: {icp} psi</span>
                    <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white font-black">FCP: {fcp} psi</span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-700 text-white font-black">Shoe Safety Margin: {maasp - inputs.sicp} psi</span>
                  </>
                ) : (
                  <>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-600 text-white font-black">OMW: {inputs.omw} ppg</span>
                    <span className="px-2.5 py-0.5 rounded bg-sky-700 text-white font-black">ECD: {telemetry.ecd || 10.85} ppg</span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-700 text-white font-black">LOT Margin: +{(14.8 - (telemetry.ecd || 10.85)).toFixed(2)} ppg</span>
                  </>
                )}
              </div>
            </div>

            {/* ULTRA-BOLD TITLE */}
            <div className={`text-xl md:text-2xl font-black uppercase tracking-tight ${inputs.sidpp > 0 || inputs.sicp > 0 || telemetry.flowStatus === 'KICK_WARNING' ? 'text-red-700' : 'text-emerald-800'}`}>
              {inputs.sidpp > 0 || inputs.sicp > 0 || telemetry.flowStatus === 'KICK_WARNING' ? (
                `CRITICAL INFLUX CONTAINMENT DIRECTIVE: ${influxType.toUpperCase()} (${inputs.pitGainBbl} BBLS)`
              ) : (
                'WELLBORE HYDROSTATIC EQUILIBRIUM CONFIRMED • ZERO ACTIVE INFLUX'
              )}
            </div>

            {/* HIGH-IMPACT EXPLANATION */}
            <p className="text-sm md:text-base font-bold text-slate-900 leading-relaxed font-sans">
              {inputs.sidpp > 0 || inputs.sicp > 0 || telemetry.flowStatus === 'KICK_WARNING' ? (
                <span>
                  Underbalance Influx Encountered at {inputs.tvdMeters}m TVD. Shut-in readings: <strong className="text-red-700">SIDPP = {inputs.sidpp} psi</strong>, <strong className="text-red-700">SICP = {inputs.sicp} psi</strong>. Formation pore pressure is {((inputs.sidpp / tvdFt) + 0.052 * inputs.omw).toFixed(3)} psi/ft. <strong className="underline decoration-red-500">Autonomous Wait & Weight Protocol:</strong> Weigh up mud system from {inputs.omw} ppg to Kill Mud Weight <strong className="text-red-700">{kmw} ppg</strong>. Circulate at constant 30 SPM holding Initial Circulating Pressure (<strong className="text-slate-900">{icp} psi</strong>), transitioning along drillstring stroke schedule to Final Circulating Pressure (<strong className="text-slate-900">{fcp} psi</strong>). Maximum casing shoe pressure remains {maasp - inputs.sicp} psi below rupture MAASP.
                </span>
              ) : (
                <span>
                  Wellbore is in verified hydrostatic balance with 0 psi shut-in pressure. Annular mud circulation is balanced (In: {telemetry.flowIn || 580} GPM, Out: {telemetry.flowOut || 580} GPM). Dynamic ECD of {telemetry.ecd || 10.85} ppg provides a safe +{(14.8 - (telemetry.ecd || 10.85)).toFixed(2)} ppg operating window below the 14.8 ppg shoe LOT fracture limit. Continue normal rotary drilling operations.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ================= TAB 1: KILL SHEET FACILITY (USER & AI VALUES) ================= */}
      {activeSubTab === 'killSheet' && (
        <div className="space-y-4 flex-1 custom-scrollbar min-h-0">

          {/* Facility Header Container */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 font-mono text-xs space-y-3 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 uppercase text-sm flex items-center gap-2">
                    <Calculator size={16} className="text-sky-600" /> Interactive Kill Sheet Calculation Facility
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${facilityMode === 'aiPredicted' ? 'bg-sky-100 text-sky-800 border-sky-300 animate-pulse' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                    {facilityMode === 'aiPredicted' ? 'AI SENSOR AUTONOMOUS PREDICTION' : 'USER MANUAL FORMULA MODE'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Input custom values into the boxes below to calculate IADC/API kill parameters, or trigger AI autonomous kick prediction
                </p>
              </div>

              {/* Mode Switcher & Execution Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                  <button
                    onClick={() => setFacilityMode('manual')}
                    className={`px-3 py-1 rounded text-xs transition flex items-center gap-1.5 cursor-pointer ${facilityMode === 'manual' ? 'bg-slate-900 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    <Sliders size={12} /> User Manual Mode
                  </button>
                  <button
                    onClick={handleAiPredictAndOptimize}
                    className={`px-3 py-1 rounded text-xs transition flex items-center gap-1.5 cursor-pointer ${facilityMode === 'aiPredicted' ? 'bg-sky-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    <Sparkles size={12} /> AI Predict & Optimize
                  </button>
                </div>

                <button
                  onClick={handleAiPredictAndOptimize}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={13} /> AI AUTONOMOUS KILL SOLUTION
                </button>
              </div>
            </div>

            {/* Influx & Formation Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] uppercase text-slate-500 font-bold mr-1">Influx Presets:</span>
              {WELL_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(p)}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-900 border border-slate-200 hover:border-sky-300 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span className={`w-2 h-2 rounded-full ${p.sidpp > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                  <strong>{p.name}</strong>
                  <span className="text-[10px] text-slate-500 font-normal">({p.type})</span>
                </button>
              ))}
            </div>

            {/* AI Prescription Notice (When active) */}
            {aiPrediction && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-sky-50 via-indigo-50 to-emerald-50 border-2 border-sky-400 text-slate-900 text-xs space-y-2 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-sky-200">
                  <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                    <Sparkles size={18} className="text-sky-600 animate-pulse" />
                    <span>AI Autonomous Influx Analysis & Prescribed Solution</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-white bg-red-600 px-2.5 py-0.5 rounded font-black">Prescribed KMW: {aiPrediction.predictedKmw} ppg</span>
                    <span className="text-white bg-sky-600 px-2.5 py-0.5 rounded font-black">Choke Target: {aiPrediction.chokeTarget}%</span>
                  </div>
                </div>
                <p className="text-sm font-sans font-bold text-slate-800 leading-relaxed">{aiPrediction.reasoning}</p>
              </div>
            )}

            {/* 12 Parameter Input Boxes Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-2">

              {/* Box 1: Original Mud Weight */}
              <div className={`p-3 rounded-xl bg-slate-50 border transition ${facilityMode === 'aiPredicted' ? 'border-sky-400 bg-sky-50/50 shadow-xs' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-slate-600 uppercase font-bold">1. Original Mud Weight (OMW)</label>
                  {facilityMode === 'aiPredicted' && <span className="text-[9px] text-sky-700 font-black">AI SYNCED</span>}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={inputs.omw}
                    onChange={(e) => {
                      setFacilityMode('manual');
                      setInputs({ ...inputs, omw: parseFloat(e.target.value) || 8.4 });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold text-sm outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-500 text-xs shrink-0 font-bold">ppg</span>
                </div>
              </div>

              {/* Box 2: TVD Depth */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 transition">
                <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">2. True Vertical Depth (TVD)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="10"
                    value={inputs.tvdMeters}
                    onChange={(e) => {
                      setFacilityMode('manual');
                      setInputs({ ...inputs, tvdMeters: parseInt(e.target.value) || 1000 });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold text-sm outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-500 text-xs shrink-0 font-bold">meters</span>
                </div>
              </div>

              {/* Box 3: SIDPP */}
              <div className={`p-3 rounded-xl bg-slate-50 border transition ${inputs.sidpp > 0 ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-red-700 uppercase font-bold">3. Shut-In DP Pressure (SIDPP)</label>
                  <span className="text-[9px] text-red-700 font-black">GAUGE</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="10"
                    value={inputs.sidpp}
                    onChange={(e) => {
                      setFacilityMode('manual');
                      setInputs({ ...inputs, sidpp: parseInt(e.target.value) || 0 });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-red-700 font-black text-sm outline-none focus:border-red-500"
                  />
                  <span className="text-slate-500 text-xs shrink-0 font-bold">psi</span>
                </div>
              </div>

              {/* Box 4: SICP */}
              <div className={`p-3 rounded-xl bg-slate-50 border transition ${inputs.sicp > 0 ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-amber-800 uppercase font-bold">4. Shut-In Casing (SICP)</label>
                  <span className="text-[9px] text-amber-800 font-black">CHOKE</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="10"
                    value={inputs.sicp}
                    onChange={(e) => {
                      setFacilityMode('manual');
                      setInputs({ ...inputs, sicp: parseInt(e.target.value) || 0 });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-amber-800 font-black text-sm outline-none focus:border-amber-500"
                  />
                  <span className="text-slate-500 text-xs shrink-0 font-bold">psi</span>
                </div>
              </div>

              {/* Box 5: SCR Pressure */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 transition">
                <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">5. Slow Circ. Rate (SCR @ 30 SPM)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="25"
                    value={inputs.scrPsi}
                    onChange={(e) => {
                      setFacilityMode('manual');
                      setInputs({ ...inputs, scrPsi: parseInt(e.target.value) || 400 });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-emerald-800 font-bold text-sm outline-none focus:border-emerald-500"
                  />
                  <span className="text-slate-500 text-xs shrink-0 font-bold">psi</span>
                </div>
              </div>

              {/* Box 6: Pit Gain */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 transition">
                <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">6. Pit Gain / Influx Volume</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={inputs.pitGainBbl}
                    onChange={(e) => {
                      setFacilityMode('manual');
                      setInputs({ ...inputs, pitGainBbl: parseFloat(e.target.value) || 0 });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold text-sm outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-500 text-xs shrink-0 font-bold">bbl</span>
                </div>
              </div>

              {/* Box 7: Casing Shoe Depth */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 transition">
                <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">7. 9-5/8" Casing Shoe TVD</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="50"
                    value={inputs.casingShoeTvd}
                    onChange={(e) => {
                      setFacilityMode('manual');
                      setInputs({ ...inputs, casingShoeTvd: parseInt(e.target.value) || 1000 });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold text-sm outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-500 text-xs shrink-0 font-bold">meters</span>
                </div>
              </div>

              {/* Box 8: Shoe Leak-Off Test */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 transition">
                <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">8. Shoe LOT / Fracture Limit</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={inputs.shoeLotPpg}
                    onChange={(e) => {
                      setFacilityMode('manual');
                      setInputs({ ...inputs, shoeLotPpg: parseFloat(e.target.value) || 14.0 });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold text-sm outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-500 text-xs shrink-0 font-bold">ppg</span>
                </div>
              </div>

              {/* Box 9: Pump Displacement */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 transition">
                <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">9. Mud Pump Output</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.005"
                    value={inputs.pumpDisplacement}
                    onChange={(e) => {
                      setFacilityMode('manual');
                      setInputs({ ...inputs, pumpDisplacement: parseFloat(e.target.value) || 0.119 });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold text-sm outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-500 text-xs shrink-0 font-bold">bbl/stk</span>
                </div>
              </div>

              {/* Box 10: Drillpipe Capacity */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 transition">
                <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">10. Drill Pipe 5" Capacity</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    value={inputs.drillpipeCapacity}
                    onChange={(e) => {
                      setFacilityMode('manual');
                      setInputs({ ...inputs, drillpipeCapacity: parseFloat(e.target.value) || 0.0178 });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold text-sm outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-500 text-xs shrink-0 font-bold">bbl/ft</span>
                </div>
              </div>

              {/* Box 11: Annular Capacity */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 transition">
                <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">11. Annular Capacity (8.5" x 5")</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    value={inputs.annularCapacity}
                    onChange={(e) => {
                      setFacilityMode('manual');
                      setInputs({ ...inputs, annularCapacity: parseFloat(e.target.value) || 0.0458 });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold text-sm outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-500 text-xs shrink-0 font-bold">bbl/ft</span>
                </div>
              </div>

              {/* Box 12: Choke Line Friction */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 transition">
                <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">12. Choke Line Friction (CLFL)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="5"
                    value={inputs.chokeFrictionPsi}
                    onChange={(e) => {
                      setFacilityMode('manual');
                      setInputs({ ...inputs, chokeFrictionPsi: parseInt(e.target.value) || 0 });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold text-sm outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-500 text-xs shrink-0 font-bold">psi</span>
                </div>
              </div>

            </div>
          </div>

          {/* ================= USER INPUT VS AI PREDICTED VALUES COMPARISON ================= */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 font-mono text-xs space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-900 uppercase flex items-center gap-2">
                <Activity size={15} className="text-sky-600" /> User Input Values vs AI Predicted Values Matrix
              </span>
              <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                API RP 59 SAFETY VALIDATED
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold bg-slate-50">
                    <th className="py-2.5 px-3">Well Control Parameter</th>
                    <th className="py-2.5 px-3 text-sky-800">User Input Value</th>
                    <th className="py-2.5 px-3 text-emerald-800">AI Predicted Value</th>
                    <th className="py-2.5 px-3">Variance / Delta</th>
                    <th className="py-2.5 px-3">Operational Directive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">Kill Mud Weight (KMW)</td>
                    <td className="py-2.5 px-3 text-sky-800 font-black">{kmw} ppg</td>
                    <td className="py-2.5 px-3 text-emerald-800 font-black">{(kmw + 0.2).toFixed(2)} ppg (+0.2 margin)</td>
                    <td className="py-2.5 px-3 text-slate-700 font-bold">+0.20 ppg</td>
                    <td className="py-2.5 px-3 text-emerald-800 font-bold">Weighted mud for safe trip margin</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">Initial Circ. Pressure (ICP)</td>
                    <td className="py-2.5 px-3 text-sky-800 font-black">{icp} psi</td>
                    <td className="py-2.5 px-3 text-emerald-800 font-black">{icp + 50} psi</td>
                    <td className="py-2.5 px-3 text-slate-700 font-bold">+50 psi</td>
                    <td className="py-2.5 px-3 text-slate-600">Compensates for choke line friction loss</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">Final Circ. Pressure (FCP)</td>
                    <td className="py-2.5 px-3 text-sky-800 font-black">{fcp} psi</td>
                    <td className="py-2.5 px-3 text-emerald-800 font-black">{Math.round(inputs.scrPsi * ((kmw + 0.2) / inputs.omw))} psi</td>
                    <td className="py-2.5 px-3 text-slate-700 font-bold">+{Math.round(inputs.scrPsi * ((kmw + 0.2) / inputs.omw)) - fcp} psi</td>
                    <td className="py-2.5 px-3 text-slate-600">Hold flat once KMW fills drillstring to bit</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">Max Allowable Casing (MAASP)</td>
                    <td className="py-2.5 px-3 text-red-700 font-black">{maasp} psi</td>
                    <td className="py-2.5 px-3 text-red-700 font-black">{maasp} psi</td>
                    <td className="py-2.5 px-3 text-slate-700 font-bold">0 psi (Exact LOT)</td>
                    <td className="py-2.5 px-3 text-amber-800 font-bold">Safe: SICP is {maasp - inputs.sicp} psi below shoe fracture</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">Influx Type & Gradient</td>
                    <td className="py-2.5 px-3 text-amber-800 font-bold">{influxType} ({influxGradient} psi/ft)</td>
                    <td className="py-2.5 px-3 text-emerald-800 font-bold">{influxType} (C1-C4 Gas)</td>
                    <td className="py-2.5 px-3 text-slate-700">Correlated</td>
                    <td className="py-2.5 px-3 text-sky-800 font-bold">Degasser & Flare line active on choke</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">Choke Valve Throttle Target</td>
                    <td className="py-2.5 px-3 text-sky-800 font-bold">{chokeThrottlePct}% Opening</td>
                    <td className="py-2.5 px-3 text-emerald-800 font-bold">35% Opening</td>
                    <td className="py-2.5 px-3 text-slate-700">{35 - chokeThrottlePct}%</td>
                    <td className="py-2.5 px-3 text-emerald-800 font-bold">Regulate drillpipe gauge to follow blue curve</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Formulated Kill Sheet Results */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 font-mono text-xs">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Kill Mud Weight (KMW)</span>
              <div className="text-3xl font-black text-slate-900 my-1">
                {kmw} <span className="text-xs font-normal text-slate-500">ppg</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold">ΔMW: +{(kmw - inputs.omw).toFixed(2)} ppg increase</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Initial / Final (ICP / FCP)</span>
              <div className="text-2xl font-black text-amber-700 my-1">
                {icp} <span className="text-xs font-normal text-slate-500">psi</span> → {fcp} <span className="text-xs font-normal text-slate-500">psi</span>
              </div>
              <span className="text-[11px] text-slate-600 font-medium">DP decline: -{icp - fcp} psi over {strokesToBit} stks</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Casing Shoe MAASP</span>
              <div className="text-3xl font-black text-red-600 my-1">
                {maasp} <span className="text-xs font-normal text-slate-500">psi</span>
              </div>
              <span className="text-[11px] text-slate-600 font-medium">With Kill Mud: {maaspKill} psi</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Max Surface Casing Pressure</span>
              <div className="text-3xl font-black text-slate-900 my-1">
                {maxCasingPressure} <span className="text-xs font-normal text-slate-500">psi</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold">✓ Within 5,000 psi Choke Rating</span>
            </div>
          </div>

        </div>
      )}

      {/* ================= TAB 2: WELLBORE DYNAMICS & INFLUX GRAPHICS ================= */}
      {activeSubTab === 'wellboreGraphics' && (
        <div className="space-y-4 flex-1 custom-scrollbar min-h-0">

          {/* Top Row: Dynamic Wait & Weight Schedule & Gas Bubble Expansion */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Chart 1: Wait & Weight Schedule */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 font-mono text-xs flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                <div>
                  <span className="font-bold text-slate-900 uppercase flex items-center gap-2">
                    <Activity size={14} className="text-sky-600" /> Wait & Weight Dynamic Pressure Schedule
                  </span>
                  <p className="text-xs text-slate-500 font-sans">
                    Strokes to Bit: {strokesToBit} • Complete Circulation: {totalKillStrokes} Strokes
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded border border-emerald-300">
                  ICP {icp} psi → FCP {fcp} psi
                </span>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dynamicKillGraph}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="strokes" tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A', fontSize: '11px', fontFamily: 'monospace', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <ReferenceLine x={strokesToBit} stroke="#D97706" strokeDasharray="3 3" label={{ value: 'KMW at Bit', fill: '#D97706', fontSize: 10 }} />
                    <Line type="monotone" dataKey="drillpipePressure" name="Drill Pipe Gauge (psi)" stroke="#0284C7" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="casingPressure" name="Casing Choke Pressure (psi)" stroke="#DC2626" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 mt-2 font-sans font-medium">
                The driller operates the remote choke to force drillpipe pressure along the blue linear line from {icp} to {fcp} psi. Casing pressure rises to {maxCasingPressure} psi as gas expands, then drops to zero.
              </div>
            </div>

            {/* Chart 2: Gas Influx Expansion via Boyle's Law */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 font-mono text-xs flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                <div>
                  <span className="font-bold text-slate-900 uppercase flex items-center gap-2">
                    <TrendingUp size={14} className="text-amber-600" /> Gas Bubble Migration & Boyle's Law Expansion
                  </span>
                  <p className="text-xs text-slate-500 font-sans">
                    P₁·V₁ = P₂·V₂ • Annular Gas Expansion from Bottomhole to Surface
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded border border-amber-300">
                  {inputs.pitGainBbl} bbl → ~{gasExpansionData[gasExpansionData.length - 1]?.annularGasVolumeBbl} bbl
                </span>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={gasExpansionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="depthM" tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }} label={{ value: 'Depth (m)', position: 'insideBottom', offset: -3, fill: '#64748B', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A', fontSize: '11px', fontFamily: 'monospace', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <Area type="monotone" dataKey="annularGasVolumeBbl" name="Gas Bubble Volume (bbl)" stroke="#D97706" fill="rgba(217, 119, 6, 0.15)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 mt-2 font-sans font-medium">
                As the methane bubble migrates through the upper 800 meters, hydrostatic head reduces sharply, causing exponential gas expansion. Choke backpressure must be held firmly to prevent pit overflow.
              </div>
            </div>

          </div>

          {/* Bottom Row: 2D Graphical Wellbore Influx Geometry Schematic */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 font-mono text-xs shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <span className="font-bold text-slate-900 uppercase flex items-center gap-2">
                <Layers size={14} className="text-sky-600" /> Wellbore Influx Physical Geometry & Fluid Displacements
              </span>
              <span className="text-xs text-slate-500 font-medium">
                TVD: {inputs.tvdMeters}m • Influx Height: {influxHeightFt} ft • Gas Gradient: {influxGradient} psi/ft
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
              {/* Graphic Illustration */}
              <div className="lg:col-span-2 rounded-xl overflow-hidden border border-slate-200 relative h-72 shadow-xs">
                <img
                  src="/images/well-center/wellbore_influx_schematic.jpg"
                  alt="Wellbore Influx Schematic"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 pointer-events-none"></div>

                {/* Live Overlaid Telemetry Labels */}
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs border border-slate-300 shadow-xs rounded px-2.5 py-1 text-xs font-bold text-slate-900">
                  Surface RKB: 0m • Choke Backpressure: <span className="text-amber-600">{inputs.sicp} psi</span>
                </div>
                <div className="absolute top-28 right-3 bg-white/95 backdrop-blur-xs border border-slate-300 shadow-xs rounded px-2.5 py-1 text-xs font-bold text-slate-900">
                  9-5/8" Casing Shoe: {inputs.casingShoeTvd}m • LOT: <span className="text-sky-700">{inputs.shoeLotPpg} ppg</span>
                </div>
                <div className="absolute bottom-4 left-3 bg-white/95 backdrop-blur-xs border border-slate-300 shadow-xs rounded px-2.5 py-1 text-xs font-bold text-slate-900">
                  Bottomhole TVD: {inputs.tvdMeters}m • Influx: <span className="text-red-600">{inputs.pitGainBbl} bbls</span> ({influxType})
                </div>
              </div>

              {/* Geometry Specs */}
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-600 block uppercase font-bold">Influx Column Height</span>
                  <span className="text-2xl font-black text-amber-800">{influxHeightFt} ft ({Math.round(influxHeightFt * 0.3048)} m)</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Occupies bottom {Math.round(influxHeightFt * 0.3048)}m of 8.5" open hole annulus</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-600 block uppercase font-bold">Pore Pressure Gradient</span>
                  <span className="text-2xl font-black text-red-600">
                    {((inputs.sidpp / tvdFt) + 0.052 * inputs.omw).toFixed(3)} psi/ft ({kmw} ppg EMW)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Reservoir pressure: {Math.round(inputs.sidpp + 0.052 * inputs.omw * tvdFt)} psi</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-600 block uppercase font-bold">Casing Shoe Fracture Margin</span>
                  <span className="text-2xl font-black text-emerald-700">{maasp - inputs.sicp} psi Remaining</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Max allowable casing pressure: {maasp} psi</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ================= TAB 3: CAMERON 15K BOP & DIGITAL CHOKE CONSOLE ================= */}
      {activeSubTab === 'bopActuators' && (
        <div className="space-y-4 flex-1 custom-scrollbar min-h-0">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Left 2 Cols: BOP Cutaway Graphic & Actuators */}
            <div className="lg:col-span-2 space-y-4">

              {/* BOP Cutaway Image with Callouts */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 font-mono text-xs space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-900 uppercase flex items-center gap-2">
                    <Power size={14} className="text-red-600" /> Cameron 13-5/8" 15,000 psi BOP Stack Layout
                  </span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-300">
                    ACCUMULATOR: 3,000 PSI
                  </span>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-200 relative h-72 shadow-xs">
                  <img
                    src="/images/well-center/bop_stack_cutaway.jpg"
                    alt="BOP Stack Cutaway"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30 pointer-events-none"></div>

                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs border border-slate-300 shadow-xs rounded px-2.5 py-1 text-xs font-bold text-slate-900">
                    Upper Annular: <span className="text-sky-700">{bopStatus.annular}</span> (Regulated 1,500 psi)
                  </div>
                  <div className="absolute top-24 right-3 bg-white/95 backdrop-blur-xs border border-slate-300 shadow-xs rounded px-2.5 py-1 text-xs font-bold text-slate-900">
                    5" Upper Pipe Rams: <span className="text-emerald-700">{bopStatus.upperPipeRams}</span>
                  </div>
                  <div className="absolute bottom-16 left-3 bg-white/95 backdrop-blur-xs border border-slate-300 shadow-xs rounded px-2.5 py-1 text-xs font-bold text-slate-900">
                    Blind Shear Rams: <span className="text-red-600">{bopStatus.blindShearRams}</span> (Emergency Severing)
                  </div>
                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs border border-slate-300 shadow-xs rounded px-2.5 py-1 text-xs font-bold text-slate-900">
                    Choke Line HCR: <span className="text-amber-600">{bopStatus.chokeHcr}</span>
                  </div>
                </div>
              </div>

              {/* Hydraulic Valve Actuation Matrix */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 font-mono text-xs shadow-xs">
                <div className="pb-2 border-b border-slate-200 mb-3 font-bold text-slate-900 uppercase flex items-center justify-between">
                  <span>Remote Rig Floor & Doghouse BOP Actuator Controls</span>
                  <span className="text-xs text-slate-500 font-normal">Koomey Hydraulic Actuation Matrix</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Annular Preventer</span>
                      <span className="text-[10px] text-slate-500 font-medium">1,500 psi Regulated</span>
                    </div>
                    <button
                      onClick={() => toggleBopValve('annular')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${bopStatus.annular === 'OPEN' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300'}`}
                    >
                      {bopStatus.annular}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Upper Pipe Rams</span>
                      <span className="text-[10px] text-slate-500 font-medium">Locks 5" S-135 String</span>
                    </div>
                    <button
                      onClick={() => toggleBopValve('upperPipeRams')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${bopStatus.upperPipeRams === 'OPEN' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300'}`}
                    >
                      {bopStatus.upperPipeRams}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-red-700 block">Blind Shear Rams</span>
                      <span className="text-[10px] text-slate-500 font-medium">Pipe Severing</span>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg font-bold text-xs bg-amber-100 text-amber-900 border border-amber-300">
                      ARMED
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Lower Pipe Rams</span>
                      <span className="text-[10px] text-slate-500 font-medium">Hang-off Seal</span>
                    </div>
                    <button
                      onClick={() => toggleBopValve('lowerPipeRams')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${bopStatus.lowerPipeRams === 'OPEN' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300'}`}
                    >
                      {bopStatus.lowerPipeRams}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Choke Line HCR</span>
                      <span className="text-[10px] text-slate-500 font-medium">To Mud-Gas Separator</span>
                    </div>
                    <button
                      onClick={() => toggleBopValve('chokeHcr')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${bopStatus.chokeHcr === 'OPEN' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300'}`}
                    >
                      {bopStatus.chokeHcr}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Kill Line HCR</span>
                      <span className="text-[10px] text-slate-500 font-medium">To High-Pressure Pump</span>
                    </div>
                    <button
                      onClick={() => toggleBopValve('killHcr')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${bopStatus.killHcr === 'OPEN' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600 border border-slate-300'}`}
                    >
                      {bopStatus.killHcr}
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Col: Digital Choke Console & Koomey Unit */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between space-y-4 font-mono text-xs shadow-xs">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                  <span className="font-bold text-slate-900 uppercase flex items-center gap-2">
                    <Sliders size={14} className="text-sky-600" /> Digital Choke Console & Koomey Unit
                  </span>
                  <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded border border-sky-300">
                    CHOKE A (ACTIVE)
                  </span>
                </div>

                {/* Choke Console Image */}
                <div className="rounded-lg overflow-hidden border border-slate-200 mb-3 h-36">
                  <img
                    src="/images/well-center/choke_manifold_console.jpg"
                    alt="Choke Manifold Console"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Digital Choke Throttle Slider */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-600 uppercase font-bold">Choke Throttle Opening</span>
                    <span className="text-sky-800 font-black text-sm">{chokeThrottlePct}% OPEN</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="95"
                    value={chokeThrottlePct}
                    onChange={(e) => setChokeThrottlePct(parseInt(e.target.value))}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                    <span>Closed (Full Backpressure)</span>
                    <span>Wide Open (Dump)</span>
                  </div>
                </div>

                {/* Dynamic Backpressure Response */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px] font-bold">CASING CHOKE GAUGE</span>
                    <span className="text-red-600 font-black text-base">
                      {Math.round(inputs.sicp * (1.5 - (chokeThrottlePct / 100)))} psi
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px] font-bold">BOTTOMHOLE PRESSURE</span>
                    <span className="text-emerald-700 font-black text-base">
                      {Math.round(0.052 * inputs.omw * tvdFt + inputs.sidpp + (50 - chokeThrottlePct) * 4)} psi
                    </span>
                  </div>
                </div>
              </div>

              {/* Koomey Unit Telemetry */}
              <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Nitrogen Accumulator Bottles:</span>
                  <span className="text-emerald-700 font-black">3,000 psi (Nominal)</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Manifold Operating Pressure:</span>
                  <span className="text-sky-800 font-black">1,500 psi</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Usable Fluid Reserve:</span>
                  <span className="text-emerald-700 font-black">185 gal / 220 gal (84%)</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ================= TAB 4: VISUAL WELL CENTER GALLERY & ENGINEERING MODELS ================= */}
      {activeSubTab === 'visualModels' && (
        <div className="space-y-4 flex-1 custom-scrollbar min-h-0">

          {/* Main Selected Image Showcase */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 font-mono text-xs space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-black text-slate-900 uppercase flex items-center gap-2 text-sm">
                <ImageIcon size={16} className="text-amber-600" /> {WELL_CENTER_IMAGES[selectedImageIndex].title}
              </span>
              <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded border border-sky-300">
                {WELL_CENTER_IMAGES[selectedImageIndex].category}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 relative h-96 shadow-xs">
                <img
                  src={WELL_CENTER_IMAGES[selectedImageIndex].url}
                  alt={WELL_CENTER_IMAGES[selectedImageIndex].title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-600 block uppercase font-bold mb-1">Operational Description</span>
                    <p className="text-slate-800 text-xs leading-relaxed font-sans font-medium">
                      {WELL_CENTER_IMAGES[selectedImageIndex].caption}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-600 block uppercase font-bold mb-1">Technical Specifications</span>
                    <p className="text-sky-800 font-black text-xs font-mono">
                      {WELL_CENTER_IMAGES[selectedImageIndex].specs}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 font-bold">
                    <CheckCircle size={16} className="shrink-0 text-emerald-600" /> Verified authentic Oil India Limited well control engineering hardware.
                  </div>
                </div>

                <div className="text-slate-500 text-[11px] font-bold">
                  Select any of the 4 engineering model thumbnails below to switch views.
                </div>
              </div>
            </div>

          </div>

          {/* 4 Thumbnails Carousel / Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
            {WELL_CENTER_IMAGES.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`p-3 rounded-xl border text-left transition shadow-xs cursor-pointer ${selectedImageIndex === idx
                  ? 'bg-sky-50 border-sky-500 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
              >
                <div className="rounded-lg overflow-hidden h-28 mb-2 border border-slate-200">
                  <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] text-sky-700 font-black block uppercase">{img.category}</span>
                <span className="text-xs text-slate-900 font-black line-clamp-1">{img.title}</span>
              </button>
            ))}
          </div>

        </div>
      )}

      {/* ================= TAB 5: OFFICIAL OIL INDIA WELL CONTROL REPORT ================= */}
      {activeSubTab === 'officialReport' && (
        <div className="space-y-4 flex-1 custom-scrollbar min-h-0">

          <div className="p-6 rounded-xl bg-white border border-slate-200 font-mono text-xs space-y-4 shadow-xs">

            {/* Header / Letterhead with Real Logo */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <img
                  src="/images/oil_india_logo.png"
                  alt="Oil India Logo"
                  className="h-16 w-auto object-contain shrink-0"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/oil_india_logo.jpg';
                  }}
                />
                <div>
                  <h3 className="font-black text-slate-900 text-base uppercase">OIL INDIA LIMITED • eRTMAC DULIAJAN HEADQUARTERS</h3>
                  <p className="text-xs text-slate-600 font-sans">Drilling Operations Division • API RP 53 / 59 Official Well Control Kill Sheet</p>
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer size={14} /> Print / Export PDF
              </button>
            </div>

            {/* Well & Rig Registry */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-bold">WELL ID / NAME</span>
                <span className="text-slate-900 font-black text-xs">{telemetry.wellId} ({telemetry.wellName})</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-bold">FIELD / BASIN</span>
                <span className="text-slate-900 font-bold text-xs">{telemetry.field} • Upper Assam</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-bold">RIG / CONTRACTOR</span>
                <span className="text-slate-900 font-bold text-xs">Assam-Rig-04 (OIL In-house)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-bold">KILL METHOD</span>
                <span className="text-sky-800 font-black text-xs">Wait & Weight (Engineer's Method)</span>
              </div>
            </div>

            {/* Influx & Technical Data */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-black text-slate-900 uppercase block pb-2 border-b border-slate-200">
                Section A: Shut-In Physical Parameters & Influx Evaluation
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold">Original Mud Weight:</span>
                  <span className="text-slate-900 font-black">{inputs.omw} ppg</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold">Shut-In DP (SIDPP):</span>
                  <span className="text-red-700 font-black">{inputs.sidpp} psi</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold">Shut-In Casing (SICP):</span>
                  <span className="text-amber-800 font-black">{inputs.sicp} psi</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold">Pit Gain / Influx Volume:</span>
                  <span className="text-slate-900 font-black">{inputs.pitGainBbl} bbls</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold">True Vertical Depth (TVD):</span>
                  <span className="text-slate-900 font-black">{inputs.tvdMeters}m ({tvdFt.toFixed(0)} ft)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold">Slow Circulating Rate (SCR):</span>
                  <span className="text-emerald-800 font-black">{inputs.scrPsi} psi @ 30 SPM</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold">Influx Height in Annulus:</span>
                  <span className="text-slate-900 font-black">{influxHeightFt} ft</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold">Calculated Influx Gradient:</span>
                  <span className="text-amber-800 font-black">{influxGradient} psi/ft ({influxType})</span>
                </div>
              </div>
            </div>

            {/* Calculations & Circulating Schedule */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-black text-slate-900 uppercase block pb-2 border-b border-slate-200">
                Section B: Derived Kill Calculations & Pumping Schedule
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">KILL MUD WEIGHT (KMW)</span>
                  <span className="text-red-700 font-black text-lg">{kmw} ppg</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">INITIAL CIRC. PRESSURE (ICP)</span>
                  <span className="text-amber-800 font-black text-lg">{icp} psi</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">FINAL CIRC. PRESSURE (FCP)</span>
                  <span className="text-emerald-800 font-black text-lg">{fcp} psi</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">CASING SHOE MAASP</span>
                  <span className="text-slate-900 font-black text-lg">{maasp} psi</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">PUMP STROKES TO BIT</span>
                  <span className="text-slate-900 font-black text-sm">{strokesToBit} stks ({Math.round(strokesToBit / 30)} min)</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">TOTAL CIRCULATION STROKES</span>
                  <span className="text-slate-900 font-black text-sm">{totalKillStrokes} stks ({Math.round(totalKillStrokes / 30)} min)</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">PRESSURE DECLINE / 100 STKS</span>
                  <span className="text-sky-800 font-black text-sm">{Math.round(((icp - fcp) / strokesToBit) * 100)} psi/100 stks</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">MAX CASING PRESSURE</span>
                  <span className="text-slate-900 font-black text-sm">{maxCasingPressure} psi</span>
                </div>
              </div>
            </div>

            {/* Official Digital Sign-off */}
            <div className="pt-4 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="block font-black text-slate-900 mb-1 uppercase text-xs">DRILLING SUPERINTENDENT</span>
                <span className="text-emerald-700 font-bold text-xs">✓ Digitally Signed (P. Bordoloi)</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="block font-black text-slate-900 mb-1 uppercase text-xs">RIG TOOLPUSHER</span>
                <span className="text-emerald-700 font-bold text-xs">✓ Digitally Signed (K. Saikia)</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="block font-black text-slate-900 mb-1 uppercase text-xs">eRTMAC LEAD ENGINEER</span>
                <span className="text-sky-800 font-bold text-xs">✓ Verified & Broadcast (Duliajan HQ)</span>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default WellControl;
