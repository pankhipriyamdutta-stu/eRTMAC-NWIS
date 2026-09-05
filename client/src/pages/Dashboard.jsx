import React, { useState, useEffect } from 'react';
import telemetryEngine from '../services/telemetryEngine';
import { OIL_WELLS } from '../data/oilDatasets';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  Gauge,
  Server,
  Power,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  BrainCircuit,
  Info,
  Terminal,
  Play,
  Pause,
  Zap,
  Flame,
  Activity,
  Compass,
  Radio,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';

const Dashboard = () => {
  const [telemetry, setTelemetry] = useState(telemetryEngine.getCurrentState());
  const [history, setHistory] = useState(telemetryEngine.getHistory());
  const [selectedStream, setSelectedStream] = useState('mechanics'); // mechanics, hydraulics, petrophysics, vibration
  const [timeWindow, setTimeWindow] = useState('30s');
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [activeScenario, setActiveScenario] = useState('NORMAL');

  useEffect(() => {
    const unsubscribe = telemetryEngine.subscribe((state, hist) => {
      setTelemetry({ ...state });
      setHistory([...hist]);
    });
    return () => unsubscribe();
  }, []);

  const handlePlayPause = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    telemetryEngine.setPlayPause(next);
  };

  const handleSpeedChange = (mult) => {
    setSpeed(mult);
    telemetryEngine.setSpeed(mult);
  };

  const handleWellChange = (e) => {
    telemetryEngine.setActiveWell(e.target.value);
  };

  const handleScenarioChange = (e) => {
    const scen = e.target.value;
    setActiveScenario(scen);
    telemetryEngine.setScenario(scen);
  };

  const windowCount = timeWindow === '15s' ? 15 : timeWindow === '30s' ? 30 : 60;
  const displayHistory = history.slice(-windowCount);

  const isAnomaly = telemetry.pressure > 3800 || telemetry.flowStatus === 'KICK_WARNING' || telemetry.ssiPct > 80;

  return (
    <div className="flex flex-col h-full space-y-5">
      
      {/* ================= TOP OFFICE OPERATIONS BAR ================= */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-xs">
            <Radio size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black font-mono text-slate-900 tracking-wide uppercase">
                OIL INDIA eRTMAC TELEMETRY COMMAND
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                LIVE 5G LINK
              </span>
            </div>
            <span className="text-xs font-mono text-slate-600">
              Active Basin: Upper Assam Shelf • Rig: {telemetry.rig || 'ASSAM-RIG-04'} • Well: {telemetry.wellId}
            </span>
          </div>
        </div>

        {/* Well Selector & Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono uppercase font-bold text-slate-600">Well:</span>
            <select
              value={telemetry.wellId}
              onChange={handleWellChange}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono font-bold rounded-lg px-3 py-1.5 outline-none focus:border-sky-500 shadow-xs"
            >
              {Object.values(OIL_WELLS).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono uppercase font-bold text-slate-600">Simulation:</span>
            <select
              value={activeScenario}
              onChange={handleScenarioChange}
              className="bg-amber-50 border border-amber-300 text-amber-900 text-xs font-mono font-bold rounded-lg px-3 py-1.5 outline-none focus:border-amber-500 shadow-xs"
            >
              <option value="NORMAL">Normal Rotary Drilling</option>
              <option value="KICK_INFLUX">Gas Influx / Kick Alert</option>
              <option value="STICK_SLIP">Stick-Slip Torsional Resonance</option>
              <option value="BIT_BALLING">Bit Balling / MSE Surge</option>
              <option value="LOST_CIRCULATION">Thief Zone / Lost Circulation</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 border border-slate-300 rounded-lg p-1 shadow-xs">
            <button
              onClick={handlePlayPause}
              className={`p-1.5 rounded-md transition ${isPlaying ? 'text-emerald-700 bg-emerald-100 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              title={isPlaying ? 'Pause Stream' : 'Resume Stream'}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              onClick={() => handleSpeedChange(speed === 1 ? 2 : speed === 2 ? 5 : 1)}
              className="px-2 py-1 text-[11px] font-mono font-bold rounded text-sky-800 bg-sky-100 border border-sky-300 hover:bg-sky-200 transition"
              title="Toggle Telemetry Speed"
            >
              {speed}x
            </button>
          </div>
        </div>
      </div>

      {/* ================= HIGH-TECH OIL RIG GRAPHIC HERO BANNER ================= */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white relative">
        <div className="relative h-48 md:h-56 w-full">
          <img 
            src="/images/oil_rig_assam_hero.jpg" 
            alt="Oil India Upper Assam Drilling Rig" 
            className="w-full h-full object-cover object-center"
          />
          {/* Subtle gradient overlay to make text and badges pop with light clarity */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/60 to-transparent flex flex-col justify-between p-5 text-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-md bg-red-600 text-white font-mono text-[11px] font-black tracking-wider uppercase shadow-xs">
                  OIL INDIA LIMITED
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-md text-white font-mono text-[11px] font-bold border border-white/30">
                  DERRICK OPERATIONAL COMMAND • RIG ASSAM-04
                </span>
              </div>
              <span className="text-xs font-mono bg-emerald-500/90 text-white px-2.5 py-1 rounded font-bold backdrop-blur-xs flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                ACTIVE ROTARY DRILLING PHASE
              </span>
            </div>

            <div className="space-y-1 max-w-xl">
              <h2 className="text-xl md:text-2xl font-black font-sans tracking-tight text-white drop-shadow-md">
                Naharkatiya NHK-542 Deep Exploration Well
              </h2>
              <p className="text-xs font-mono text-slate-200 line-clamp-2 drop-shadow-sm">
                Upper Assam Basin Stratigraphy • Spud Target Depth: 3,850m TVD • Primary Objective: Barail Sandstone Oligocene Reservoir. Continuous autonomous drilling telemetry streaming via 5G edge relay.
              </p>
            </div>

            {/* Drilling Phase Steps Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-white/20 text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                <CheckCircle size={14} /> 1. Conductor (26")
              </div>
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                <CheckCircle size={14} /> 2. Surface (17-1/2")
              </div>
              <div className="flex items-center gap-1.5 text-amber-300 font-bold bg-white/10 px-2 py-0.5 rounded">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> 3. Intermediate (12-1/4") Active
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <ChevronRight size={14} /> 4. Production (8-1/2") Next
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 3 CRITICAL STATUS CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 shrink-0">
        
        {/* Card 1: Well Pressure Transducer */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 relative overflow-hidden flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-600 uppercase flex items-center gap-2">
              <Gauge className="w-4 h-4 text-sky-600" /> Well {telemetry.wellId} Pressure
            </span>
            <span className="text-[10px] font-mono text-sky-700 bg-sky-100 px-2 py-0.5 rounded font-bold border border-sky-300">
              LIVE TRANSDUCER
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className={`text-4xl font-mono font-black tracking-tight ${isAnomaly ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
              {telemetry.pressure ? telemetry.pressure.toLocaleString() : '3,120'}
            </span>
            <span className="text-xs font-mono text-slate-500 uppercase font-bold">psi</span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono border-t border-slate-200 pt-2.5">
            <span className={isAnomaly ? 'text-red-600 font-bold' : 'text-emerald-700 font-bold'}>
              {isAnomaly ? '⚠ CRITICAL SPIKE / INFLUX' : '✓ In Safe Margin (±2.5%)'}
            </span>
            <span className="text-slate-500 font-semibold">Limit: 4,000 psi</span>
          </div>
        </div>

        {/* Card 2: Edge Controller */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 relative overflow-hidden flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-600 uppercase flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-600" /> Edge Controller
            </span>
            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold border border-emerald-300">
              99.98% UPTIME
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-mono font-black tracking-tight text-slate-900">
              ONLINE (NODE 17)
            </div>
            <div className="text-xs font-mono text-slate-600 mt-1 font-semibold">
              Latency: {telemetry.edgeLatency}ms • Pipelining active
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-mono border-t border-slate-200 pt-2.5">
            <span className="text-slate-600 font-semibold">Telemetry Sync: 100%</span>
            <span className="text-emerald-700 font-bold">TX/RX STABLE</span>
          </div>
        </div>

        {/* Card 3: Safety Actuator */}
        <div className={`p-5 rounded-xl bg-white relative overflow-hidden flex flex-col justify-between shadow-xs border ${telemetry.pumpStatus === 'ON' ? 'border-emerald-300 glow-green' : 'border-red-300 glow-red'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-600 uppercase flex items-center gap-2">
              <Power className={`w-4 h-4 ${telemetry.pumpStatus === 'ON' ? 'text-emerald-600' : 'text-red-600'}`} /> Safety Actuator
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${telemetry.pumpStatus === 'ON' ? 'text-emerald-800 bg-emerald-100 border-emerald-300' : 'text-red-800 bg-red-100 border-red-300'}`}>
              {telemetry.pumpStatus === 'ON' ? 'ARMED' : 'TRIPPED'}
            </span>
          </div>
          <div className="my-2 flex items-center justify-between">
            <div>
              <div className={`text-2xl font-mono font-black ${telemetry.pumpStatus === 'ON' ? 'text-slate-900' : 'text-red-600 animate-pulse'}`}>
                {telemetry.pumpStatus === 'ON' ? 'READY & ENGAGED' : 'SYSTEM HALTED'}
              </div>
              <div className="text-xs font-mono text-slate-600 mt-1 font-semibold">
                Hydraulic Pressure: 2,980 psi • N2 Precharge OK
              </div>
            </div>
            <ShieldCheck className={`w-10 h-10 ${telemetry.pumpStatus === 'ON' ? 'text-emerald-500' : 'text-red-500'}`} />
          </div>
          <div className="flex items-center justify-between text-xs font-mono border-t border-slate-200 pt-2.5">
            <span className="text-slate-600 font-semibold">Actuator Link:</span>
            <span className={`font-bold tracking-wider ${telemetry.pumpStatus === 'ON' ? 'text-emerald-700' : 'text-red-700'}`}>
              EXCELLENT
            </span>
          </div>
        </div>

      </div>

      {/* ================= MAIN VISUAL GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-0">
        
        {/* Left 2 Cols: Real-Time High Frequency Telemetry Stream */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between h-full min-h-[420px]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600 animate-pulse"></span>
              <h2 className="text-xs font-black font-mono uppercase tracking-wider text-slate-900">
                Subsurface Multivariant Telemetry Stream ({telemetry.wellId})
              </h2>
              <span className="text-[10px] font-mono text-sky-800 bg-sky-100 px-2 py-0.5 rounded font-bold border border-sky-300">
                LIVE STREAMING
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <select 
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-mono font-bold rounded-lg px-2.5 py-1.5 outline-none shadow-xs"
              >
                <option value="mechanics">Mechanics: SPP, Torque, ROP</option>
                <option value="hydraulics">Hydraulics: Flow In, Flow Out, ΔQ</option>
                <option value="petrophysics">LWD: Gamma Ray, Resistivity</option>
                <option value="vibration">Dynamics: Vibration & Stick-Slip</option>
              </select>
              <select 
                value={timeWindow}
                onChange={(e) => setTimeWindow(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-mono font-bold rounded-lg px-2.5 py-1.5 outline-none shadow-xs"
              >
                <option value="15s">Real-Time (15s)</option>
                <option value="30s">Real-Time (30s)</option>
                <option value="60s">Real-Time (60s)</option>
              </select>
            </div>
          </div>

          <div className="flex-1 relative w-full h-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }} 
                  axisLine={{ stroke: '#CBD5E1' }} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }} 
                  axisLine={{ stroke: '#CBD5E1' }} 
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    borderColor: '#CBD5E1', 
                    color: '#0F172A', 
                    fontSize: '11px', 
                    fontFamily: 'monospace',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }}
                  itemStyle={{ fontFamily: 'monospace', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px', fontWeight: 'bold' }} />

                {selectedStream === 'mechanics' && (
                  <>
                    <Line type="monotone" dataKey="spp" name="Standpipe Pressure (psi)" stroke="#0284C7" strokeWidth={2.2} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="torque" name="Torque (ft-lbs)" stroke="#DC2626" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="rop" name="ROP (m/hr)" stroke="#16A34A" strokeWidth={2.2} dot={false} isAnimationActive={false} />
                  </>
                )}

                {selectedStream === 'hydraulics' && (
                  <>
                    <Line type="monotone" dataKey="flowIn" name="Flow In (GPM)" stroke="#0284C7" strokeWidth={2.2} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="flowOut" name="Flow Out (GPM)" stroke="#D97706" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="deltaFlow" name="Flow Delta (GPM)" stroke="#DC2626" strokeWidth={2.2} dot={false} isAnimationActive={false} />
                  </>
                )}

                {selectedStream === 'petrophysics' && (
                  <>
                    <Line type="monotone" dataKey="gammaRay" name="Gamma Ray (API)" stroke="#16A34A" strokeWidth={2.2} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="resistivityDeep" name="Deep Resistivity (ohm-m)" stroke="#0284C7" strokeWidth={2.2} dot={false} isAnimationActive={false} />
                  </>
                )}

                {selectedStream === 'vibration' && (
                  <>
                    <Line type="monotone" dataKey="ssiPct" name="Stick-Slip Index (%)" stroke="#DC2626" strokeWidth={2.2} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="vibrationLateral" name="Lateral Vibration (g RMS)" stroke="#D97706" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3.5 border-t border-slate-200 text-xs font-mono text-slate-800 shrink-0 mt-2">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-600 font-semibold">TVD Depth:</span>
              <span className="text-sky-700 font-black">{telemetry.depthTVD} m</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-600 font-semibold">Teale's MSE:</span>
              <span className="text-emerald-700 font-black">{telemetry.mse ? telemetry.mse.toLocaleString() : 0} psi</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-600 font-semibold">Dynamic ECD:</span>
              <span className="text-amber-700 font-black">{telemetry.ecd} ppg</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-600 font-semibold">Flow Delta:</span>
              <span className={`font-black ${Math.abs(telemetry.deltaFlow) > 10 ? 'text-red-700' : 'text-emerald-700'}`}>
                {telemetry.deltaFlow > 0 ? `+${telemetry.deltaFlow}` : telemetry.deltaFlow} GPM
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Intelligence Feed & Live System Log */}
        <div className="space-y-5 flex flex-col justify-between h-full">
          
          {/* ULTRA-BOLD AI INTELLIGENCE FEED */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-sky-600" />
                <span className="text-xs font-black font-mono uppercase text-slate-900">
                  OIL INDIA AI INTELLIGENCE FEED
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-800 border border-sky-300 font-mono">
                {activeScenario !== 'NORMAL' ? 'EVENT ACTIVE' : '3 RECENT'}
              </span>
            </div>

            <div className="mt-3.5 space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {activeScenario === 'KICK_INFLUX' && (
                <div className="p-4 rounded-xl bg-red-50 border-2 border-red-400 flex items-start gap-3 shadow-sm">
                  <Flame className="w-6 h-6 text-red-600 shrink-0 mt-0.5 animate-bounce" />
                  <div className="space-y-1">
                    <p className="text-base font-black text-red-800 tracking-tight">
                      ADVISORY DIRECTIVE: CRITICAL KICK INFLUX DETECTED
                    </p>
                    <p className="text-xs text-red-950 font-mono font-bold leading-relaxed">
                      Flow Out exceeds Flow In by +{telemetry.deltaFlow} GPM. Pit volume expanding. Immediately space out, stop rotary drive, shut-in annular preventer, and prepare Kill Mud Weight circulation!
                    </p>
                  </div>
                </div>
              )}

              {activeScenario === 'STICK_SLIP' && (
                <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-400 flex items-start gap-3 shadow-sm">
                  <Zap className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-1">
                    <p className="text-base font-black text-amber-900 tracking-tight">
                      ADVISORY DIRECTIVE: TORSIONAL RESONANCE & STICK-SLIP
                    </p>
                    <p className="text-xs text-amber-950 font-mono font-bold leading-relaxed">
                      Stick-Slip Index at {telemetry.ssiPct}%. Cyclic torsional stalling on lower BHA. Shift surface RPM to detune from Campbell natural frequency and engage soft-speed controller.
                    </p>
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-sm font-black text-emerald-900">
                    AI STRATIGRAPHY LOCK: BARAIL OIL RESERVOIR
                  </p>
                  <p className="text-xs text-emerald-950 font-mono leading-relaxed">
                    Hydrocarbon pay zone boundary locked at 2,980m TVD. Archie water saturation Sw = 22.4%, Shc = 77.6%. Maintain geosteering toolface.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-300 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-sm font-black text-sky-950">
                    AUTONOMOUS DRILLING SWEET SPOT ACTIVE
                  </p>
                  <p className="text-xs text-sky-900 font-mono leading-relaxed">
                    Mechanical Specific Energy (MSE) optimized at {telemetry.mse} psi. WOB/RPM sweet spot yielding maximum penetration rate with zero drillstring buckling.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* System Log */}
          <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] shrink-0 h-44 flex flex-col shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2 text-slate-300 shrink-0">
              <span className="font-bold flex items-center gap-1.5 text-white">
                <Terminal className="w-3.5 h-3.5 text-sky-400" /> RIG TELEMETRY LOG
              </span>
              <span className="text-[10px] text-emerald-400 font-bold animate-pulse">STREAMING (5G)</span>
            </div>
            <div className="space-y-1.5 text-slate-300 flex-1 overflow-y-auto custom-scrollbar pr-1">
              <p>
                <span className="text-slate-500">[{telemetry.timestamp}]</span> <span className="text-sky-400 font-bold">INFO</span> eRTMAC node sync verified: {telemetry.wellId}
              </p>
              <p>
                <span className="text-slate-500">[{telemetry.timestamp}]</span> <span className="text-emerald-400 font-bold">CALC</span> MSE = {telemetry.mse} psi | ECD = {telemetry.ecd} ppg
              </p>
              <p>
                <span className="text-slate-500">[{telemetry.timestamp}]</span> <span className="text-sky-400 font-bold">WITSML</span> Subsurface MWD packets receiving at 10Hz
              </p>
              <p>
                <span className="text-slate-500">[{telemetry.timestamp}]</span> <span className="text-amber-400 font-bold">RIG</span> Assam Rig-04 BHA telemetry link verified
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;
