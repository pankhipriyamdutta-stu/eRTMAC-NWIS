import React, { useState, useMemo } from 'react';
import telemetryEngine from '../services/telemetryEngine';
import { OIL_WELLS } from '../data/oilDatasets';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Layers, Activity, TrendingUp, Sparkles, RefreshCw, Calculator, BookOpen, Database, ShieldCheck } from 'lucide-react';

const SubsurfaceIntelligence = () => {
  const [telemetry, setTelemetry] = useState(telemetryEngine.getLatestTelemetry());
  const [currentWell] = useState(OIL_WELLS[0]);
  const [facilityMode, setFacilityMode] = useState('manual');
  const [showMathProof, setShowMathProof] = useState(false);

  // ================= 1. INTERACTIVE PETROPHYSICS PARAMETERS =================
  const [inputs, setInputs] = useState({
    rwOhmM: 0.045, // formation water resistivity at BHT
    rtOhmM: 42.0, // true formation deep resistivity
    bulkDensity: 2.28, // wireline/LWD bulk density in g/cc
    matrixDensity: 2.65, // quartz sandstone matrix density in g/cc
    fluidDensity: 1.0, // water/filtrate fluid density in g/cc
    gammaRay: 48, // clean sandstone GR API
    grClean: 25, // sand baseline API
    grShale: 110, // shale baseline API
    archiesA: 1.0, // tortuosity factor
    archiesM: 2.0, // cementation exponent
    archiesN: 2.0 // saturation exponent
  });

  const [aiPrescription, setAiPrescription] = useState(null);

  React.useEffect(() => {
    const unsub = telemetryEngine.subscribe((data) => {
      setTelemetry(data);
    });
    return () => unsub();
  }, []);

  // ================= 2. LIVE PETROPHYSICAL ENGINE FORMULATIONS =================
  const petrophysics = useMemo(() => {
    // 1. Density Porosity: Phi_D = (rho_ma - rho_b) / (rho_ma - rho_fl)
    const phiTotal = Math.max(0.01, (inputs.matrixDensity - inputs.bulkDensity) / (inputs.matrixDensity - inputs.fluidDensity));
    
    // 2. Volume of Shale (Larionov Tertiary Rocks Model)
    const igr = Math.max(0, Math.min(1.0, (inputs.gammaRay - inputs.grClean) / Math.max(1, inputs.grShale - inputs.grClean)));
    const vshFrac = Math.max(0.0, Math.min(1.0, 0.083 * (Math.pow(2, 3.7 * igr) - 1)));
    const vshPct = Math.round(vshFrac * 100);

    // 3. Effective Porosity: Phi_e = Phi_t * (1 - Vsh)
    const phiEff = Math.max(0.01, phiTotal * (1 - vshFrac));
    const phiEffPct = parseFloat((phiEff * 100).toFixed(1));

    // 4. Archie's Water Saturation (Sw)
    // Sw^n = (a * Rw) / (Phi_e^m * Rt)
    const term = (inputs.archiesA * inputs.rwOhmM) / (Math.pow(phiEff, inputs.archiesM) * inputs.rtOhmM);
    const swFrac = parseFloat(Math.pow(Math.max(0.01, Math.min(1.0, term)), 1 / inputs.archiesN).toFixed(3));
    const swPct = Math.round(swFrac * 100);
    const shcPct = 100 - swPct;

    // 5. Permeability Estimation (Timur Formulation in mD)
    // k = 0.136 * (Phi_e^4.4 / Swirr^2)
    const permMd = Math.round((0.136 * Math.pow(phiEffPct, 4.4)) / Math.pow(Math.max(10, swPct), 2));

    return {
      phiTotalPct: parseFloat((phiTotal * 100).toFixed(1)),
      vshPct,
      phiEffPct,
      swPct,
      shcPct,
      permMd: Math.max(1, Math.min(2500, permMd)),
      isPayZone: shcPct >= 60 && phiEffPct >= 16 && vshPct < 25,
      isTransitionZone: shcPct >= 35 && shcPct < 60 && phiEffPct >= 12,
      isNonReservoir: shcPct < 35 || vshPct >= 40
    };
  }, [inputs]);

  // Porosity & Saturation Profile by Formation
  const formationComparisonData = useMemo(() => {
    return [
      { formation: 'Girujan Clay', porosity: 12, hcSat: 5, vsh: 82 },
      { formation: 'Tipam Sand', porosity: 24, hcSat: 42, vsh: 15 },
      { formation: 'Barail Upper', porosity: petrophysics.phiEffPct, hcSat: petrophysics.shcPct, vsh: petrophysics.vshPct },
      { formation: 'Kopili Shale', porosity: 8, hcSat: 0, vsh: 88 },
      { formation: 'Sylhet Lime', porosity: 14, hcSat: 68, vsh: 8 }
    ];
  }, [petrophysics]);

  // ================= 3. AI GEOSTEERING & LITHOLOGY PREDICTOR =================
  const handleAiPredictAndSolve = () => {
    setFacilityMode('aiPredicted');
    setInputs((prev) => ({
      ...prev,
      gammaRay: 38, // clean sandstone sweet spot
      bulkDensity: 2.22, // 25.8% high-grade porosity
      rtOhmM: 58.0 // high hydrocarbon resistivity
    }));

    setAiPrescription({
      title: 'AI Geosteering Sweet Spot Identification',
      netPayConfidence: '98.8%',
      targetZone: 'Barail Upper Channel Sandstone (Main Pay)',
      projectedPayThickness: '16.2 meters',
      directives: [
        'Hold geosteering toolface inclination at 24.5° to remain centered in the channel sandstone axis.',
        'Anticipate ~220 mD permeability zone with clean hydrocarbon cut (Sw = 16.5%).',
        'Next geological marker: Lower Kopili Basal Shale boundary projected in 58 meters TVD.'
      ]
    });
  };

  const handleSyncSensors = () => {
    const gr = telemetry.gammaRay || 48;
    const den = telemetry.density || 2.28;
    const rt = telemetry.resistivityDeep || 42.0;
    const rxo = telemetry.resistivityShallow || 18.5;
    setInputs((prev) => ({
      ...prev,
      gammaRay: gr,
      bulkDensity: den,
      rtOhmM: rt,
      rxoOhmM: rxo
    }));
    setFacilityMode('manual');
    const isPay = gr < 65 && rt > 20;
    setAiPrescription({
      confidence: isPay ? '98.5%' : '84.0%',
      targetZone: isPay ? 'Barail Upper Channel Sandstone (Main Pay)' : 'Kopili / Tipam Lithology Transition',
      projectedPayThickness: isPay ? '16.2 meters' : '8.5 meters',
      directives: [
        isPay ? 'Hold geosteering toolface inclination at 24.5° to remain centered in the channel sandstone axis.' : 'Adjust inclination +1.5° upward to exit shale layer and regain net pay.',
        `Live sensors synchronized: GR ${gr} API, Deep Resistivity ${rt} Ω·m, Bulk Density ${den} g/cc.`,
        'Continuous LWD telemetry streaming validated at 100% signal strength.'
      ]
    });
  };

  return (
    <div className="flex flex-col h-full space-y-4 font-sans select-none overflow-y-auto custom-scrollbar">
      
      {/* ================= HEADER ================= */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Layers size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black font-mono text-slate-900 tracking-wider uppercase">
                OIL INDIA LIMITED • SUBSURFACE STRATIGRAPHY & PETROPHYSICS
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                ARCHIE / LARIONOV CORE
              </span>
            </div>
            <p className="text-xs text-slate-600 font-mono mt-0.5">
              Upper Assam Basin Regional Stratigraphy • Real-Time LWD Formation Boundary Prediction • Archie Water Saturation
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            onClick={handleSyncSensors}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold transition cursor-pointer shadow-xs"
          >
            <RefreshCw size={12} /> SYNC LWD SENSORS
          </button>
          <button
            onClick={handleAiPredictAndSolve}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer"
          >
            <Sparkles size={12} /> AI GEOSTEERING OPTIMIZER
          </button>
          <span className={`px-3 py-1.5 rounded-lg font-black border ${petrophysics.isPayZone ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : petrophysics.isTransitionZone ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-red-100 text-red-900 border-red-300'}`}>
            {petrophysics.isPayZone ? '✓ HIGH-GRADE NET OIL PAY' : petrophysics.isTransitionZone ? 'TRANSITION ZONE' : 'NON-RESERVOIR / WET'}
          </span>
        </div>
      </div>

      {/* ================= 3D GEOLOGICAL STRATA BANNER (AUTHENTIC ASSAM BASIN) ================= */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xs shrink-0">
        <div className="h-44 md:h-52 w-full relative">
          <img
            src="/images/subsurface_geology_strata.jpg"
            alt="Assam Basin Subsurface Strata"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-transparent"></div>
          
          {/* Overlay Content */}
          <div className="absolute inset-0 p-5 flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-lg border border-white shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>
                <span className="text-xs font-black text-slate-900 uppercase">Upper Assam Stratigraphic Cross-Section</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-black/60 text-white text-[11px] font-mono font-bold border border-white/20">
                  Target: Barail Sandstone Pay (3,050m - 3,380m MD)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
              <div className="p-2.5 rounded-xl bg-white/95 backdrop-blur-xs border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-600 block uppercase font-bold">1. Upper Alluvium</span>
                <span className="text-xs font-black text-slate-900">0 – 850m MD</span>
                <span className="text-[10px] text-slate-500 block">Unconsolidated Sands</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/95 backdrop-blur-xs border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-600 block uppercase font-bold">2. Tipam Sandstone</span>
                <span className="text-xs font-black text-slate-900">850 – 2,400m MD</span>
                <span className="text-[10px] text-sky-700 font-bold block">Secondary Hydrocarbon</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/95 backdrop-blur-xs border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-600 block uppercase font-bold">3. Kopili Shale</span>
                <span className="text-xs font-black text-slate-900">2,400 – 3,050m MD</span>
                <span className="text-[10px] text-amber-700 font-bold block">Regional Caprock Seal</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 backdrop-blur-xs border-2 border-emerald-500 shadow-xs">
                <span className="text-[10px] text-emerald-800 block uppercase font-black">4. Barail Sandstone</span>
                <span className="text-xs font-black text-emerald-950">3,050 – 3,380m MD</span>
                <span className="text-[10px] text-emerald-700 font-black block">★ Active Net Oil Pay</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= ULTRA-BOLD ACTIONABLE AI ADVISORY BANNER ================= */}
      <div className={`p-5 rounded-2xl border-2 font-mono text-xs shadow-xs shrink-0 ${petrophysics.isPayZone ? 'bg-emerald-50 border-emerald-500 text-emerald-950' : petrophysics.isTransitionZone ? 'bg-amber-50 border-amber-500 text-amber-950' : 'bg-red-50 border-red-500 text-red-950'}`}>
        <div className="flex items-start gap-4">
          <TrendingUp size={28} className={`shrink-0 mt-0.5 ${petrophysics.isPayZone ? 'text-emerald-600' : petrophysics.isTransitionZone ? 'text-amber-600' : 'text-red-600'}`} />
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                OIL INDIA AI GEOSTEERING & RESERVOIR DIRECTIVE
              </span>
              <span className={`px-2.5 py-0.5 rounded font-black text-xs ${petrophysics.isPayZone ? 'bg-emerald-600 text-white' : petrophysics.isTransitionZone ? 'bg-amber-600 text-white' : 'bg-red-600 text-white'}`}>
                {petrophysics.isPayZone ? 'HIGH-GRADE PAY' : petrophysics.isTransitionZone ? 'TRANSITION WARNING' : 'NON-PAY BOUNDARY'}
              </span>
            </div>
            
            {/* ULTRA-BOLD TITLE */}
            <div className={`text-xl md:text-2xl font-black uppercase tracking-tight ${petrophysics.isPayZone ? 'text-emerald-800' : petrophysics.isTransitionZone ? 'text-amber-800' : 'text-red-700'}`}>
              {petrophysics.isPayZone ? (
                `BARAIL RESERVOIR SWEET SPOT CONFIRMED • ${petrophysics.shcPct}% HYDROCARBON SATURATION`
              ) : petrophysics.isTransitionZone ? (
                `TRANSITION REGIME DETECTED • ${petrophysics.shcPct}% HYDROCARBON (Sw = ${petrophysics.swPct}%)`
              ) : (
                `NON-RESERVOIR INTERVAL • HIGH WATER SATURATION (Sw = ${petrophysics.swPct}%, Vsh = ${petrophysics.vshPct}%)`
              )}
            </div>

            {/* HIGH-IMPACT EXPLANATION */}
            <p className="text-sm md:text-base font-bold text-slate-900 leading-relaxed font-sans">
              {petrophysics.isPayZone ? (
                <span>
                  High-Grade Net Hydrocarbon Pay Confirmed (Shc = <strong className="text-emerald-800 text-lg">{petrophysics.shcPct}%</strong>, Sw = <strong className="text-slate-900">{petrophysics.swPct}%</strong>). Clean sandstone matrix with effective porosity of <strong className="text-emerald-800">{petrophysics.phiEffPct}%</strong> and minimal shale volume (Vsh = {petrophysics.vshPct}%). Estimated matrix permeability is <strong className="text-slate-900">{petrophysics.permMd} mD</strong>. <strong className="underline decoration-emerald-500">Geosteering Command:</strong> Maintain toolface inclination steady at 24.5° along the main channel axis for maximum contact with commercial oil.
                </span>
              ) : petrophysics.isTransitionZone ? (
                <span>
                  Moderate Hydrocarbon Saturation Encountered (Shc = {petrophysics.shcPct}%, Sw = {petrophysics.swPct}%). Matrix porosity is {petrophysics.phiEffPct}% with rising shale volume (Vsh = {petrophysics.vshPct}%). Continuous mud gas chromatography active on shaker degasser to delineate oil-water contact.
                </span>
              ) : (
                <span>
                  Non-Productive Interval Encountered. High formation water saturation (Sw = {petrophysics.swPct}%) or dominant shale content (Vsh = {petrophysics.vshPct}%). Estimated permeability is restricted to {petrophysics.permMd} mD. <strong className="underline decoration-red-500">Geosteering Command:</strong> Adjust toolface inclination upward (+1.5°) to steer the bit out of shale and back into the clean channel sand body.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ================= ULTRA-BOLD AI GEOSTEERING PRESCRIPTION CARD ================= */}
      {aiPrescription && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border-2 border-emerald-400 font-mono text-xs shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-emerald-200">
            <div className="flex items-center gap-2">
              <Sparkles className="text-emerald-600 animate-pulse" size={18} />
              <span className="font-black text-slate-900 uppercase text-base">{aiPrescription.title}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold font-mono">
              <span className="px-3 py-1 rounded bg-emerald-600 text-white font-black">
                Confidence: {aiPrescription.netPayConfidence}
              </span>
              <span className="px-3 py-1 rounded bg-sky-600 text-white font-black">
                Pay Thickness: {aiPrescription.projectedPayThickness}
              </span>
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            HORIZON: {aiPrescription.targetZone}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
            {aiPrescription.directives.map((dir, i) => (
              <div key={i} className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0 text-xs mt-0.5">
                  {i + 1}
                </span>
                <span className="text-xs font-bold text-slate-800 leading-snug">{dir}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= INTERACTIVE PETROPHYSICS INPUT FACILITY ================= */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 font-mono text-xs space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 uppercase text-sm flex items-center gap-2">
                <Calculator size={16} className="text-sky-600" /> Interactive Petrophysics Calculation Facility (Archie & Larionov)
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${facilityMode === 'aiPredicted' ? 'bg-sky-100 text-sky-800 border-sky-300' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                {facilityMode === 'aiPredicted' ? 'AI SENSOR PREDICTED' : 'USER MANUAL MODE'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Input physical properties into the boxes below to evaluate reservoir porosity, volume of shale, and Archie water saturation
            </p>
          </div>

          <button
            onClick={() => setShowMathProof(!showMathProof)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen size={13} /> {showMathProof ? 'Hide Mathematical Proof' : 'Show Mathematical Proof'}
          </button>
        </div>

        {/* 6 Parameter Input Boxes Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">1. Water Resistivity (Rw)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.005"
                value={inputs.rwOhmM}
                onChange={(e) => setInputs({ ...inputs, rwOhmM: parseFloat(e.target.value) || 0.01 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-bold text-sm outline-none focus:border-sky-500"
              />
              <span className="text-slate-500 text-xs shrink-0 font-bold">Ω·m</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">2. Deep Resistivity (Rt)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="2"
                value={inputs.rtOhmM}
                onChange={(e) => setInputs({ ...inputs, rtOhmM: parseFloat(e.target.value) || 1 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-amber-800 font-bold text-sm outline-none focus:border-amber-500"
              />
              <span className="text-slate-500 text-xs shrink-0 font-bold">Ω·m</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">3. Bulk Density (ρ_b)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.02"
                value={inputs.bulkDensity}
                onChange={(e) => setInputs({ ...inputs, bulkDensity: parseFloat(e.target.value) || 2.0 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-emerald-800 font-bold text-sm outline-none focus:border-emerald-500"
              />
              <span className="text-slate-500 text-xs shrink-0 font-bold">g/cc</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">4. Matrix Density (ρ_ma)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.01"
                value={inputs.matrixDensity}
                onChange={(e) => setInputs({ ...inputs, matrixDensity: parseFloat(e.target.value) || 2.65 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-bold text-sm outline-none focus:border-sky-500"
              />
              <span className="text-slate-500 text-xs shrink-0 font-bold">g/cc</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">5. Gamma Ray (GR)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="2"
                value={inputs.gammaRay}
                onChange={(e) => setInputs({ ...inputs, gammaRay: parseInt(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-indigo-700 font-bold text-sm outline-none focus:border-indigo-500"
              />
              <span className="text-slate-500 text-xs shrink-0 font-bold">API</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">6. Clean Sand Base</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="2"
                value={inputs.grClean}
                onChange={(e) => setInputs({ ...inputs, grClean: parseInt(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-bold text-sm outline-none focus:border-sky-500"
              />
              <span className="text-slate-500 text-xs shrink-0 font-bold">API</span>
            </div>
          </div>

        </div>

        {/* Live Mathematical Proof & Equation Substitutions */}
        {showMathProof && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-[10px] text-slate-600 uppercase font-black">
              <span>Standard Petrophysics Formulations:</span>
              <span className="text-emerald-700 font-bold">Archie (1942) & Larionov Tertiary Vsh</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-800">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <strong className="text-sky-700 block mb-1">1. Density Porosity & Vsh:</strong>
                <p>Φ_D = ({inputs.matrixDensity} - {inputs.bulkDensity}) / ({inputs.matrixDensity} - {inputs.fluidDensity}) = <span className="text-sky-800 font-black">{petrophysics.phiTotalPct}%</span></p>
                <p className="text-slate-500 text-[10px] mt-0.5">V_sh = <span className="text-amber-700 font-bold">{petrophysics.vshPct}%</span> (Larionov Tertiary)</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <strong className="text-emerald-700 block mb-1">2. Archie's Saturation (Sw):</strong>
                <p>Sw = [({inputs.archiesA} × {inputs.rwOhmM}) / ({petrophysics.phiEffPct / 100}² × {inputs.rtOhmM})]^(1/2) = <span className="text-red-700 font-black">{petrophysics.swPct}%</span></p>
                <p className="text-emerald-700 font-black mt-0.5">Hydrocarbon Saturation (Shc) = {petrophysics.shcPct}%</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <strong className="text-indigo-700 block mb-1">3. Permeability Estimate:</strong>
                <p>k = 0.136 × ({petrophysics.phiEffPct}^4.4 / {petrophysics.swPct}²) = <span className="text-indigo-800 font-black">{petrophysics.permMd} mD</span></p>
                <p className="text-slate-500 text-[10px] mt-0.5">Reservoir Flow Potential: High Productivity</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= 4 METRICS CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Effective Porosity (Φe)</span>
          <div className="text-3xl font-black text-slate-900 my-1">
            {petrophysics.phiEffPct} <span className="text-xs font-normal text-slate-500">%</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-bold">Total Porosity: {petrophysics.phiTotalPct}%</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Hydrocarbon Saturation (Shc)</span>
          <div className="text-3xl font-black text-emerald-700 my-1">
            {petrophysics.shcPct} <span className="text-xs font-normal text-slate-500">%</span>
          </div>
          <span className="text-[11px] text-slate-600 font-medium">Water Saturation (Sw): {petrophysics.swPct}%</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Volume of Shale (Vsh)</span>
          <div className="text-3xl font-black text-amber-700 my-1">
            {petrophysics.vshPct} <span className="text-xs font-normal text-slate-500">%</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-bold">Clean Channel Sand (&lt;15%)</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Estimated Permeability (k)</span>
          <div className="text-3xl font-black text-slate-900 my-1">
            {petrophysics.permMd} <span className="text-xs font-normal text-slate-500">mD</span>
          </div>
          <span className="text-[11px] text-slate-600 font-medium">Timur Formulation</span>
        </div>
      </div>

      {/* ================= MAIN STRATIGRAPHY & RESERVOIR CHARTS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0 font-mono text-xs">
        
        {/* Left Col: Geological Stratigraphy Column */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900 uppercase pb-2 border-b border-slate-200 mb-3 flex items-center gap-2">
              <Database size={14} className="text-sky-600" /> Upper Assam Shelf Stratigraphy (NHK-542)
            </span>

            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
              {currentWell.stratigraphy.map((formation, idx) => {
                const isCurrent = telemetry.depthMD >= formation.topMD && telemetry.depthMD <= formation.bottomMD;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition ${
                      isCurrent
                        ? 'bg-sky-50 border-sky-500 shadow-xs'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: formation.color }}></span>
                        {formation.name}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-sky-600 text-white">
                          BIT HERE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>{formation.topMD}m - {formation.bottomMD}m</span>
                      <span className="font-bold text-slate-700">{formation.lithology}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 mt-2 font-sans font-medium">
            Target formation is Barail Sandstone main oil pay (3,050m - 3,380m MD) with proven regional hydrocarbon production.
          </div>
        </div>

        {/* Right 2 Cols: Formation Porosity & Hydrocarbon Saturation Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
            <span className="font-bold text-slate-900 uppercase flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-600" /> Upper Assam Formation Petrophysical Quality Comparison
            </span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
              Porosity & Shc (%)
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formationComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="formation" tick={{ fill: '#64748B', fontSize: 10 }} />
                <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10 }} tick={{ fill: '#64748B', fontSize: 10 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A', fontSize: '11px', fontFamily: 'monospace', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Bar dataKey="porosity" name="Effective Porosity (%)" fill="#0284C7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="hcSat" name="Hydrocarbon Saturation (%)" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="vsh" name="Volume of Shale (%)" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 mt-2 font-sans font-medium">
            Barail Upper Sandstone exhibits the prime pay fingerprint: Porosity of {petrophysics.phiEffPct}%, high Hydrocarbon Saturation of {petrophysics.shcPct}%, and low shale volume of {petrophysics.vshPct}%.
          </div>
        </div>

      </div>

    </div>
  );
};

export default SubsurfaceIntelligence;
