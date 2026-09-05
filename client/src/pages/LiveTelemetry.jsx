import React, { useState, useEffect } from 'react';
import telemetryEngine from '../services/telemetryEngine';
import { OIL_WELLS, NHK_542_DEPTH_LOG } from '../data/oilDatasets';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';
import {
  Activity,
  Radio,
  Gauge,
  Layers,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wifi,
  Sliders,
  Play,
  Pause,
  RefreshCw,
  Compass,
  Flame,
  Zap,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

const LiveTelemetry = () => {
  const [telemetry, setTelemetry] = useState(telemetryEngine.getCurrentState());
  const [history, setHistory] = useState(telemetryEngine.getHistory());
  const [activeTab, setActiveTab] = useState('gauges'); // gauges, mwdLog, vibration, transducers, math
  const [selectedWell, setSelectedWell] = useState('OIL-NHK-542');
  const [depthLog, setDepthLog] = useState(NHK_542_DEPTH_LOG);

  useEffect(() => {
    const unsubscribe = telemetryEngine.subscribe((state, hist) => {
      setTelemetry({ ...state });
      setHistory([...hist]);
    });
    return () => unsubscribe();
  }, []);

  const handleWellChange = (wellId) => {
    setSelectedWell(wellId);
    telemetryEngine.setActiveWell(wellId);
  };

  const currentWellData = OIL_WELLS[telemetry.wellId] || OIL_WELLS['OIL-NHK-542'];

  // Synthetic live FFT data for vibration dynamics
  const fftData = [
    { freq: '1.0 Hz', amplitude: 0.12, type: 'Normal' },
    { freq: '2.5 Hz', amplitude: 0.35, type: 'Normal' },
    { freq: '3.5 Hz', amplitude: telemetry.ssiPct > 50 ? 1.85 : 0.42, type: 'Bit Bounce Resonance' },
    { freq: '5.0 Hz', amplitude: 0.28, type: 'Normal' },
    { freq: '8.2 Hz', amplitude: telemetry.vibrationLateral > 1.2 ? 2.45 : 0.55, type: 'BHA Whirl' },
    { freq: '12.0 Hz', amplitude: 0.32, type: 'Normal' },
    { freq: '16.5 Hz', amplitude: 0.18, type: 'Normal' },
    { freq: '24.0 Hz', amplitude: 0.08, type: 'Normal' }
  ];

  // 14 Real-time SCADA sensor channels
  const sensorChannels = [
    { tag: 'OIL_ASSAM_PT_101', name: 'Standpipe Pressure (SPP)', value: telemetry.spp, unit: 'psi', rate: '20 Hz', quality: 'GOOD', source: 'Mud Standpipe Transducer' },
    { tag: 'OIL_ASSAM_PT_102', name: 'Annular Wellhead Pressure', value: telemetry.pressure, unit: 'psi', rate: '10 Hz', quality: 'GOOD', source: 'BOP Stack Transducer' },
    { tag: 'OIL_ASSAM_LC_201', name: 'Drillstring Hook Load', value: telemetry.hookLoad, unit: 'klbs', rate: '50 Hz', quality: 'GOOD', source: 'Traveling Block Load Cell' },
    { tag: 'OIL_ASSAM_LC_202', name: 'Weight on Bit (WOB)', value: telemetry.wob, unit: 'klbs', rate: '20 Hz', quality: 'GOOD', source: 'Crown Dead-Line Sensor' },
    { tag: 'OIL_ASSAM_TQ_301', name: 'Top Drive Rotary Torque', value: telemetry.torque, unit: 'ft-lbs', rate: '50 Hz', quality: 'GOOD', source: 'AC VFD Motor Drive' },
    { tag: 'OIL_ASSAM_RP_302', name: 'Rotary Table Speed', value: telemetry.rpm, unit: 'RPM', rate: '50 Hz', quality: 'GOOD', source: 'Digital Optical Tachometer' },
    { tag: 'OIL_ASSAM_FM_401', name: 'Pump Mud Flow In', value: telemetry.flowIn, unit: 'GPM', rate: '10 Hz', quality: 'GOOD', source: 'Triplex Pump Stroke Counter' },
    { tag: 'OIL_ASSAM_FM_402', name: 'Return Mud Flow Out', value: telemetry.flowOut, unit: 'GPM', rate: '10 Hz', quality: Math.abs(telemetry.deltaFlow) > 15 ? 'WARN' : 'GOOD', source: 'Paddle Flow Sensor + Coriolis' },
    { tag: 'OIL_ASSAM_TK_501', name: 'Active Mud Pit Volume', value: telemetry.mudVolume, unit: 'bbl', rate: '5 Hz', quality: 'GOOD', source: 'Ultrasonic Level Transducer' },
    { tag: 'OIL_MWD_GR_601', name: 'Downhole LWD Gamma Ray', value: telemetry.gammaRay, unit: 'API', rate: '2 Hz', quality: 'GOOD', source: 'Scintillation Crystal Detector' },
    { tag: 'OIL_MWD_RES_602', name: 'Deep Propagation Resistivity', value: telemetry.resistivityDeep, unit: 'ohm-m', rate: '2 Hz', quality: 'GOOD', source: '2 MHz Multi-Frequency Array' },
    { tag: 'OIL_MWD_AX_701', name: 'BHA Triaxial Lateral Vibration', value: telemetry.vibrationLateral, unit: 'g RMS', rate: '100 Hz', quality: telemetry.vibrationLateral > 1.5 ? 'WARN' : 'GOOD', source: 'Downhole MEMS Accelerometer' },
    { tag: 'OIL_MWD_SS_702', name: 'Stick-Slip Severity Index', value: telemetry.ssiPct, unit: '% SSI', rate: '10 Hz', quality: telemetry.ssiPct > 70 ? 'CRITICAL' : 'GOOD', source: 'Turbine MWD DSP Core' },
    { tag: 'OIL_MWD_TMP_801', name: 'Annular Mud Temperature', value: telemetry.temperature, unit: '°C', rate: '1 Hz', quality: 'GOOD', source: 'Downhole Resistance RTD' }
  ];

  return (
    <div className="flex flex-col h-full space-y-4 font-sans select-none">

      {/* ================= OIL INDIA EXECUTIVE OPERATIONS HEADER ================= */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 font-black font-mono text-xl shadow-xs">
            OIL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 font-mono tracking-tight">
                OIL INDIA LIMITED • eRTMAC LIVE TELEMETRY CONSOLE
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                WITSML 1.4.1.1
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5 font-medium">
              Assam & Assam-Arakan Basin • Headquarters: Duliajan • Target Formation: <span className="font-bold text-slate-800">{currentWellData.targetFormation}</span>
            </p>
          </div>
        </div>

        {/* Status Indicators & Clock */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <Clock size={14} className="text-sky-600" />
            <div>
              <span className="text-slate-400 text-[10px] block font-semibold">ASSAM FIELD TIME (IST)</span>
              <span className="text-slate-800 font-bold">{telemetry.timestamp}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <Wifi size={14} className="text-emerald-600" />
            <div>
              <span className="text-slate-400 text-[10px] block font-semibold">5G ASSAM RIG LINK</span>
              <span className="text-emerald-600 font-bold">{telemetry.edgeLatency}ms (0% LOSS)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px] font-bold">ACTIVE WELL:</span>
            <select
              value={telemetry.wellId}
              onChange={(e) => handleWellChange(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 font-bold text-xs rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
            >
              {Object.values(OIL_WELLS).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ================= AI TELEMETRY INTELLIGENCE DIRECTIVE BANNER ================= */}
      <div className={`p-4 rounded-xl border-2 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${telemetry.flowStatus === 'KICK_WARNING' || telemetry.ssiPct > 70 || telemetry.vibrationLateral > 1.2
        ? 'bg-rose-50 border-rose-500 text-rose-950'
        : telemetry.spp > 3500 || telemetry.wob > 32 || telemetry.mse > 45000
          ? 'bg-amber-50 border-amber-500 text-amber-950'
          : 'bg-emerald-50 border-emerald-500 text-emerald-950'
        }`}>
        <div className="flex items-start md:items-center gap-3.5">
          <div className={`p-2.5 rounded-xl border shrink-0 ${telemetry.flowStatus === 'KICK_WARNING' || telemetry.ssiPct > 70 || telemetry.vibrationLateral > 1.2
            ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
            : telemetry.spp > 3500 || telemetry.wob > 32 || telemetry.mse > 45000
              ? 'bg-amber-600 text-white border-amber-700'
              : 'bg-emerald-600 text-white border-emerald-700'
            }`}>
            <Zap size={22} className="shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/90 border border-current shadow-xs">
                eRTMAC AI REAL-TIME TELEMETRY SUPERVISOR
              </span>
              <span className="text-xs font-mono font-bold text-slate-600">
                50 Hz SCADA STREAM • {currentWellData.name} ({currentWellData.targetFormation})
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-black tracking-tight mt-1">
              {telemetry.flowStatus === 'KICK_WARNING'
                ? `CRITICAL KICK INFLUX DETECTED: +${telemetry.deltaFlow} GPM MUD GAIN`
                : telemetry.ssiPct > 70
                  ? `ALERT: DRILLSTRING TORSIONAL RESONANCE AT ${telemetry.ssiPct}% SSI`
                  : telemetry.vibrationLateral > 1.2
                    ? `WARNING: ELEVATED BHA LATERAL WHIRL AT ${telemetry.vibrationLateral} g RMS`
                    : telemetry.mse > 45000
                      ? `SUB-OPTIMAL MECHANICAL EFFICIENCY: TEALE MSE AT ${telemetry.mse.toLocaleString()} PSI`
                      : `OPTIMAL DRILLING DYNAMICS: 100% TELEMETRY INTEGRITY & NOMINAL HYDRAULICS`}
            </h3>
            <p className="text-sm font-semibold text-slate-800 mt-1 max-w-4xl">
              {telemetry.flowStatus === 'KICK_WARNING'
                ? `Delta flow rate has deviated by +${telemetry.deltaFlow} GPM with standpipe pressure drop of 80 psi. AI Directive: Space out drillstring, shut down mud pumps, shut in annular preventer on Cameron 15K BOP, and record SIDPP/SICP immediately.`
                : telemetry.ssiPct > 70
                  ? `Torsional stick-slip amplitude exceeds safety envelope in Barail sands. AI Directive: Increase top drive rotary speed from ${telemetry.rpm} RPM by +15 RPM and trim WOB by -2.0 klbs to decouple harmonic bit stall.`
                  : telemetry.vibrationLateral > 1.2
                    ? `Downhole triaxial accelerometer signals severe lateral backward whirl. AI Directive: Modulate rotary speed down by 10 RPM to detune from 8.2 Hz BHA harmonic.`
                    : telemetry.mse > 45000
                      ? `Specific rock energy exceeds uniaxial compressive threshold (7,500 psi). AI Directive: Recalibrate WOB/RPM ratio to elevate instantaneous ROP above ${telemetry.rop} m/hr.`
                      : `Mechanical specific energy (${telemetry.mse.toLocaleString()} psi) is within 92% peak bit efficiency. Flow balance (Qin: ${telemetry.flowIn} GPM, Qout: ${telemetry.flowOut} GPM) stable with 0% influx risk.`}
            </p>
          </div>
        </div>
        <div className="shrink-0 flex md:flex-col items-end justify-between gap-1 text-right">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">AUTONOMOUS STATUS</span>
          <span className={`px-3 py-1 rounded-lg text-xs font-black tracking-wide border shadow-xs ${telemetry.flowStatus === 'KICK_WARNING' || telemetry.ssiPct > 70
            ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}>
            {telemetry.flowStatus === 'KICK_WARNING' ? 'INTERVENTION REQUIRED' : 'SUPERVISORY LOCKED'}
          </span>
        </div>
      </div>

      {/* ================= SUB-NAVIGATION TABS ================= */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <TabButton
            active={activeTab === 'gauges'}
            onClick={() => setActiveTab('gauges')}
            icon={<Gauge size={14} />}
            label="SCADA Gauges Cluster (12 Channels)"
          />
          <TabButton
            active={activeTab === 'mwdLog'}
            onClick={() => setActiveTab('mwdLog')}
            icon={<Layers size={14} />}
            label="MWD/LWD 4-Track Strip Log"
          />
          <TabButton
            active={activeTab === 'vibration'}
            onClick={() => setActiveTab('vibration')}
            icon={<Activity size={14} />}
            label="Vibration Oscilloscope & FFT"
          />
          <TabButton
            active={activeTab === 'transducers'}
            onClick={() => setActiveTab('transducers')}
            icon={<Cpu size={14} />}
            label="Transducer Sensor Inspector"
          />
          <TabButton
            active={activeTab === 'math'}
            onClick={() => setActiveTab('math')}
            icon={<Sliders size={14} />}
            label="Engineering Physics Engine"
          />
        </div>

        <div className="text-[11px] font-mono text-slate-600 flex items-center gap-3">
          <span>MD: <strong className="text-sky-700 font-bold">{telemetry.depthMD} m</strong></span>
          <span>TVD: <strong className="text-emerald-700 font-bold">{telemetry.depthTVD} m</strong></span>
          <span>ROP: <strong className="text-amber-700 font-bold">{telemetry.rop} m/hr</strong></span>
        </div>
      </div>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex-1 custom-scrollbar min-h-0">

        {/* ================= TAB 1: SCADA GAUGES CLUSTER ================= */}
        {activeTab === 'gauges' && (
          <div className="space-y-4">
            {/* Top 6 Primary Mechanical & Hydraulic Gauges */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <TelemetryCard
                title="Standpipe Pressure (SPP)"
                value={telemetry.spp}
                unit="psi"
                status={telemetry.spp > 3500 ? 'warning' : 'optimal'}
                subtext="Pump Output Press."
                color="cyan"
              />
              <TelemetryCard
                title="Weight on Bit (WOB)"
                value={telemetry.wob}
                unit="klbs"
                status={telemetry.wob > 32 ? 'warning' : 'optimal'}
                subtext="Bit Load Margin"
                color="indigo"
              />
              <TelemetryCard
                title="Surface RPM"
                value={telemetry.rpm}
                unit="RPM"
                status={telemetry.ssiPct > 60 ? 'danger' : 'optimal'}
                subtext={`Bit RPM: ${telemetry.bitRpm}`}
                color="emerald"
              />
              <TelemetryCard
                title="Rotary Torque"
                value={telemetry.torque}
                unit="ft-lbs"
                status={telemetry.torque > 6500 ? 'warning' : 'optimal'}
                subtext="Top Drive VFD"
                color="rose"
              />
              <TelemetryCard
                title="Penetration Rate (ROP)"
                value={telemetry.rop}
                unit="m/hr"
                status="optimal"
                subtext="Instantaneous ROP"
                color="amber"
              />
              <TelemetryCard
                title="Hook Load"
                value={telemetry.hookLoad}
                unit="klbs"
                status="optimal"
                subtext="String Total Weight"
                color="cyan"
              />
            </div>

            {/* Bottom 6 Advanced Subsurface & Well Control Gauges */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <TelemetryCard
                title="Flow Rate In (Qin)"
                value={telemetry.flowIn}
                unit="GPM"
                status="optimal"
                subtext="Triplex Mud Pumps"
                color="cyan"
              />
              <TelemetryCard
                title="Flow Rate Out (Qout)"
                value={telemetry.flowOut}
                unit="GPM"
                status={Math.abs(telemetry.deltaFlow) > 15 ? 'danger' : 'optimal'}
                subtext={`ΔQ: ${telemetry.deltaFlow > 0 ? `+${telemetry.deltaFlow}` : telemetry.deltaFlow} GPM`}
                color={Math.abs(telemetry.deltaFlow) > 15 ? 'rose' : 'emerald'}
              />
              <TelemetryCard
                title="Mud Pit Volume"
                value={telemetry.mudVolume}
                unit="bbl"
                status={telemetry.flowStatus === 'KICK_WARNING' ? 'danger' : 'optimal'}
                subtext="Active Tank Level"
                color="indigo"
              />
              <TelemetryCard
                title="Equivalent Circ. Density (ECD)"
                value={telemetry.ecd}
                unit="ppg"
                status={telemetry.ecd > 13.0 ? 'warning' : 'optimal'}
                subtext={`Static MW: ${currentWellData.mudWeight} ppg`}
                color="amber"
              />
              <TelemetryCard
                title="Teale's MSE"
                value={telemetry.mse}
                unit="psi"
                status={telemetry.mse > 45000 ? 'warning' : 'optimal'}
                subtext={`Efficiency: ${telemetry.mseEfficiency}%`}
                color="purple"
              />
              <TelemetryCard
                title="Stick-Slip Index (SSI)"
                value={telemetry.ssiPct}
                unit="%"
                status={telemetry.ssiPct > 80 ? 'danger' : telemetry.ssiPct > 50 ? 'warning' : 'optimal'}
                subtext="Torsional Resonance"
                color={telemetry.ssiPct > 80 ? 'rose' : 'emerald'}
              />
            </div>

            {/* Live Visual Waveforms Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-slate-900 flex items-center gap-2">
                    <Activity size={14} className="text-sky-600" /> Standpipe Pressure & Torque Dynamic Trend (60s)
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                    10 Hz Telemetry
                  </span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history.slice(-30)}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#F1F5F9" />
                      <XAxis dataKey="timestamp" tick={{ fill: '#64748B', fontSize: 9, fontFamily: 'monospace' }} />
                      <YAxis yAxisId="left" tick={{ fill: '#0284C7', fontSize: 9, fontFamily: 'monospace' }} domain={['auto', 'auto']} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: '#E11D48', fontSize: 9, fontFamily: 'monospace' }} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '11px', fontFamily: 'monospace' }} />
                      <Line yAxisId="left" type="monotone" dataKey="spp" name="SPP (psi)" stroke="#0284C7" strokeWidth={2.2} dot={false} isAnimationActive={false} />
                      <Line yAxisId="right" type="monotone" dataKey="torque" name="Torque (ft-lbs)" stroke="#E11D48" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-slate-900 flex items-center gap-2">
                    <Activity size={14} className="text-emerald-600" /> Flow Loop Equilibrium & Kick Influx Integral (60s)
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${Math.abs(telemetry.deltaFlow) > 15 ? 'bg-rose-50 text-rose-700 border border-rose-300 animate-pulse' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    {telemetry.flowStatus}
                  </span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history.slice(-30)}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#F1F5F9" />
                      <XAxis dataKey="timestamp" tick={{ fill: '#64748B', fontSize: 9, fontFamily: 'monospace' }} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 9, fontFamily: 'monospace' }} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '11px', fontFamily: 'monospace' }} />
                      <Area type="monotone" dataKey="flowIn" name="Flow In (GPM)" stroke="#0284C7" fill="#0284C7" fillOpacity={0.15} strokeWidth={2} dot={false} isAnimationActive={false} />
                      <Area type="monotone" dataKey="flowOut" name="Flow Out (GPM)" stroke="#059669" fill="#059669" fillOpacity={0.15} strokeWidth={2} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="deltaFlow" name="ΔQ Delta (GPM)" stroke="#E11D48" strokeWidth={2.2} dot={false} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: MWD/LWD 4-TRACK STRIP LOG ================= */}
        {activeTab === 'mwdLog' && (
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-xs font-black font-mono text-slate-900 tracking-wide uppercase">
                  OIL-NHK-542 Real-Time Continuous Subsurface Petrophysical & Mechanics Log
                </h3>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  Standard API 4-Track Log Format • Upper Assam Basin Barail Sandstone Pay Zone (3,200m - 3,250m)
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> Sandstone Reservoir</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-500"></span> Marine Shale Seal</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-sky-600"></span> Hydrocarbon Pay</span>
              </div>
            </div>

            {/* 4-Track Grid Header */}
            <div className="grid grid-cols-4 gap-3 text-center text-[11px] font-mono font-black text-slate-700 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
              <div>TRACK 1: GAMMA RAY & CALIPER (0 - 150 API)</div>
              <div>TRACK 2: RESISTIVITY (0.2 - 2000 Ω·m)</div>
              <div>TRACK 3: POROSITY & DENSITY (Φn & ρb)</div>
              <div>TRACK 4: DRILLING MECHANICS (MSE & ROP)</div>
            </div>

            {/* Depth Log Multi-Chart Visualization */}
            <div className="grid grid-cols-4 gap-3 h-[420px]">

              {/* Track 1: Gamma Ray */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-2 flex flex-col">
                <div className="text-[10px] font-mono font-bold text-slate-600 flex justify-between px-2">
                  <span>GR (API)</span>
                  <span>0 - 150</span>
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={depthLog} layout="vertical">
                      <CartesianGrid strokeDasharray="2 2" stroke="#E2E8F0" />
                      <XAxis type="number" domain={[0, 150]} tick={{ fill: '#64748B', fontSize: 9 }} />
                      <YAxis dataKey="depth" type="category" reversed tick={{ fill: '#64748B', fontSize: 9 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A', borderRadius: '6px', fontSize: '10px' }} />
                      <Line dataKey="gammaRay" stroke="#D97706" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Track 2: Resistivity */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-2 flex flex-col">
                <div className="text-[10px] font-mono font-bold text-slate-600 flex justify-between px-2">
                  <span>R_deep (Ω·m)</span>
                  <span>0 - 100</span>
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={depthLog} layout="vertical">
                      <CartesianGrid strokeDasharray="2 2" stroke="#E2E8F0" />
                      <XAxis type="number" domain={[0, 80]} tick={{ fill: '#64748B', fontSize: 9 }} />
                      <YAxis dataKey="depth" type="category" reversed hide />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A', borderRadius: '6px', fontSize: '10px' }} />
                      <Line dataKey="resistivityDeep" stroke="#0284C7" strokeWidth={2.2} dot={false} />
                      <Line dataKey="resistivityMedium" stroke="#2563EB" strokeWidth={1.4} strokeDasharray="3 3" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Track 3: Porosity & Density */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-2 flex flex-col">
                <div className="text-[10px] font-mono font-bold text-slate-600 flex justify-between px-2">
                  <span>Porosity (%)</span>
                  <span>0 - 35%</span>
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={depthLog} layout="vertical">
                      <CartesianGrid strokeDasharray="2 2" stroke="#E2E8F0" />
                      <XAxis type="number" domain={[0, 35]} tick={{ fill: '#64748B', fontSize: 9 }} />
                      <YAxis dataKey="depth" type="category" reversed hide />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A', borderRadius: '6px', fontSize: '10px' }} />
                      <Line dataKey="neutronPorosity" stroke="#059669" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Track 4: MSE & ROP */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-2 flex flex-col">
                <div className="text-[10px] font-mono font-bold text-slate-600 flex justify-between px-2">
                  <span>MSE (kpsi) & ROP</span>
                  <span>0 - 60</span>
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={depthLog} layout="vertical">
                      <CartesianGrid strokeDasharray="2 2" stroke="#E2E8F0" />
                      <XAxis type="number" domain={[0, 60]} tick={{ fill: '#64748B', fontSize: 9 }} />
                      <YAxis dataKey="depth" type="category" reversed hide />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A', borderRadius: '6px', fontSize: '10px' }} />
                      <Line dataKey="mse" name="MSE (kpsi)" stroke="#E11D48" strokeWidth={2} dot={false} />
                      <Line dataKey="rop" name="ROP (m/hr)" stroke="#9333EA" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================= TAB 3: VIBRATION OSCILLOSCOPE & FFT ================= */}
        {activeTab === 'vibration' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Left 2 Cols: Real-Time Triaxial Vibration Oscilloscope */}
              <div className="lg:col-span-2 p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-sky-600" />
                    <span className="text-xs font-black font-mono text-slate-900 uppercase">
                      Downhole BHA Triaxial Accelerometer Oscilloscope
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    High Frequency 100 Hz
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history.slice(-25)}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#F1F5F9" />
                      <XAxis dataKey="timestamp" tick={{ fill: '#64748B', fontSize: 9 }} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 9 }} domain={[-3, 3]} />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} />
                      <Line type="monotone" dataKey="vibrationLateral" name="Lateral Vibration (g)" stroke="#E11D48" strokeWidth={2.2} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="vibrationAxial" name="Axial Bit Bounce (g)" stroke="#0284C7" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px] font-bold block">AXIAL VIB (BIT BOUNCE)</span>
                    <span className="text-sky-700 font-black text-sm">{telemetry.vibrationAxial} g RMS</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px] font-bold block">LATERAL VIB (BHA WHIRL)</span>
                    <span className={`font-black text-sm ${telemetry.vibrationLateral > 1.2 ? 'text-rose-600 animate-pulse' : 'text-emerald-700'}`}>
                      {telemetry.vibrationLateral} g RMS
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px] font-bold block">TORSIONAL STICK-SLIP (SSI)</span>
                    <span className={`font-black text-sm ${telemetry.ssiPct > 80 ? 'text-rose-600' : telemetry.ssiPct > 50 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {telemetry.ssiPct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Col: FFT Spectral Energy & Mitigation Advice */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-black font-mono text-slate-900 uppercase">FFT Harmonic Frequency Spectrum</span>
                    <span className="text-[10px] font-mono font-bold text-sky-700">0 - 30 Hz</span>
                  </div>
                  <div className="h-44 w-full mt-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fftData}>
                        <CartesianGrid strokeDasharray="2 2" stroke="#F1F5F9" />
                        <XAxis dataKey="freq" tick={{ fill: '#64748B', fontSize: 9 }} />
                        <YAxis tick={{ fill: '#64748B', fontSize: 9 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A', borderRadius: '6px', fontSize: '10px' }} />
                        <Bar dataKey="amplitude" fill="#0284C7" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* AI Vibration Advisory */}
                <div className={`p-3.5 rounded-xl border text-xs font-mono shadow-xs ${telemetry.ssiPct > 70 || telemetry.vibrationLateral > 1.2 || telemetry.vibrationAxial > 1.0 ? 'bg-rose-50 border-rose-400' : 'bg-emerald-50 border-emerald-400'}`}>
                  <div className={`flex items-center gap-2 font-black mb-1.5 text-sm ${telemetry.ssiPct > 70 || telemetry.vibrationLateral > 1.2 || telemetry.vibrationAxial > 1.0 ? 'text-rose-900' : 'text-emerald-900'}`}>
                    <Zap size={16} /> eRTMAC Dynamics & Vibration AI Directive
                  </div>
                  <p className="text-slate-800 text-[11px] font-medium leading-relaxed">
                    {telemetry.ssiPct > 70
                      ? `Severe torsional stick-slip active (SSI: ${telemetry.ssiPct}%). Drillstring resonant frequency matched at 3.5 Hz. Recommendation: Increase rotary speed from ${telemetry.rpm} RPM by +15 RPM, decrease WOB by 2.0 klbs to release bit torque wrap.`
                      : telemetry.vibrationLateral > 1.2
                        ? `Elevated lateral vibration detected (${telemetry.vibrationLateral}g RMS). Backward BHA whirl pattern emerging. Recommendation: Reduce rotary RPM by 10-15 RPM and verify stabilizer wall contact.`
                        : telemetry.vibrationAxial > 1.0
                          ? `Bit bounce detected (${telemetry.vibrationAxial}g RMS axial acceleration). Weight transfer fluctuating. Recommendation: Increase WOB by +2.0 klbs to stabilize cutter engagement on bottom.`
                          : `Drillstring dynamics operating in optimal harmonic window (SSI: ${telemetry.ssiPct}%, Lateral: ${telemetry.vibrationLateral}g). Steady weight transfer and minimal fatigue verified.`}
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================= TAB 4: TRANSDUCER SENSOR INSPECTOR ================= */}
        {activeTab === 'transducers' && (
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-xs font-black font-mono text-slate-900 tracking-wide uppercase">
                  eRTMAC-NWIS Real-Time Transducer & Telemetry Registry
                </h3>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  Live Sensor Calibration, Sampling Rates, Quality Codes, and Telemetry Source Channels
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-300 shadow-xs">
                14 / 14 ACTIVE TRANSDUCERS
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 bg-slate-50 text-[10px] uppercase font-bold">
                    <th className="py-2.5 px-3">Sensor Tag ID</th>
                    <th className="py-2.5 px-3">Telemetry Parameter</th>
                    <th className="py-2.5 px-3">Live Value</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3">Update Rate</th>
                    <th className="py-2.5 px-3">Quality</th>
                    <th className="py-2.5 px-3">Transducer Hardware</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sensorChannels.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 text-sky-700 font-bold">{c.tag}</td>
                      <td className="py-2.5 px-3 text-slate-900 font-semibold">{c.name}</td>
                      <td className="py-2.5 px-3 text-slate-900 font-black text-sm">
                        {typeof c.value === 'number' ? c.value.toLocaleString() : c.value}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{c.unit}</td>
                      <td className="py-2.5 px-3 text-slate-500">{c.rate}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.quality === 'GOOD' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                          {c.quality}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">{c.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 5: ENGINEERING PHYSICS ENGINE ================= */}
        {activeTab === 'math' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Formula 1: Teale's MSE */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                  <span className="font-black text-slate-900 uppercase text-sm">1. Teale's Mechanical Specific Energy</span>
                  <span className="text-sky-700 font-black text-sm">{telemetry.mse.toLocaleString()} psi</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-sky-900 font-mono font-bold text-[11px] mb-3 leading-relaxed">
                  MSE = (WOB / A_bit) + (120 × π × RPM × Torque) / (A_bit × ROP)
                </div>
                <div className="space-y-1.5 text-slate-700 text-[11px] font-medium">
                  <p>• Bit Diameter: <strong className="text-slate-900">{currentWellData.bitSize}"</strong> → Area: <strong className="text-slate-900">{((Math.PI / 4) * Math.pow(currentWellData.bitSize, 2)).toFixed(2)} in²</strong></p>
                  <p>• Axial Energy: <strong className="text-sky-700 font-bold">{((telemetry.wob * 1000) / ((Math.PI / 4) * Math.pow(currentWellData.bitSize, 2))).toFixed(0)} psi</strong></p>
                  <p>• Rotary Energy: <strong className="text-indigo-700 font-bold">{(telemetry.mse - ((telemetry.wob * 1000) / ((Math.PI / 4) * Math.pow(currentWellData.bitSize, 2)))).toFixed(0)} psi</strong></p>
                  <p>• Formation Compressive Strength: <strong className="text-emerald-700 font-bold">7,500 psi (Assam Sandstone)</strong></p>
                  <p>• Bit Cutting Efficiency: <strong className="text-emerald-700 font-bold">{telemetry.mseEfficiency}%</strong></p>
                </div>
              </div>

              {/* Formula 2: Bingham Dynamic ECD */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                  <span className="font-black text-slate-900 uppercase text-sm">2. Equivalent Circulating Density (ECD)</span>
                  <span className="text-amber-700 font-black text-sm">{telemetry.ecd} ppg</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-amber-900 font-mono font-bold text-[11px] mb-3 leading-relaxed">
                  ECD = MudWeight + [ΔP_annular / (0.052 × TVD)]
                </div>
                <div className="space-y-1.5 text-slate-700 text-[11px] font-medium">
                  <p>• Static Mud Weight: <strong className="text-slate-900">{currentWellData.mudWeight} ppg</strong></p>
                  <p>• True Vertical Depth (TVD): <strong className="text-slate-900">{telemetry.depthTVD} m ({(telemetry.depthTVD * 3.28084).toFixed(0)} ft)</strong></p>
                  <p>• Circulation Rate: <strong className="text-sky-700 font-bold">{telemetry.flowIn} GPM</strong></p>
                  <p>• Annular Friction Pressure Drop: <strong className="text-amber-700 font-bold">{Math.round((telemetry.ecd - currentWellData.mudWeight) * 0.052 * (telemetry.depthTVD * 3.28084))} psi</strong></p>
                  <p>• Fracture Gradient Margin: <strong className="text-emerald-700 font-bold">Safe (+1.45 ppg to leak-off)</strong></p>
                </div>
              </div>

              {/* Formula 3: Corrected d-Exponent */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                  <span className="font-black text-slate-900 uppercase text-sm">3. Corrected d-Exponent (Pore Pressure)</span>
                  <span className="text-emerald-700 font-black text-sm">{telemetry.dcs} dcs</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-emerald-900 font-mono font-bold text-[11px] mb-3 leading-relaxed">
                  dcs = [log10(ROP / 60N) / log10(12·WOB / 10⁶Db)] × (MW_norm / MW_act)
                </div>
                <div className="space-y-1.5 text-slate-700 text-[11px] font-medium">
                  <p>• Normal Pressure Baseline: <strong className="text-slate-900">8.65 ppg (Assam Basin)</strong></p>
                  <p>• Computed dcs: <strong className="text-emerald-700 font-bold">{telemetry.dcs}</strong></p>
                  <p>• Interpretation: <strong className="text-sky-700 font-bold">Normal compaction trend in Tipam/Barail sands</strong></p>
                </div>
              </div>

              {/* Formula 4: Bit Hydraulics & Jet Impact Force */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                  <span className="font-black text-slate-900 uppercase text-sm">4. Hydraulics & Jet Impact Force</span>
                  <span className="text-rose-700 font-black text-sm">{telemetry.hhp} HHP</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-rose-900 font-mono font-bold text-[11px] mb-3 leading-relaxed">
                  HHP = (SPP × Q) / 1714 | JIF = 0.01823 × Cd × Q × √(MW × ΔP_bit)
                </div>
                <div className="space-y-1.5 text-slate-700 text-[11px] font-medium">
                  <p>• Standpipe Pressure: <strong className="text-slate-900">{telemetry.spp} psi</strong></p>
                  <p>• Hydraulic Horsepower (HHP): <strong className="text-rose-700 font-bold">{telemetry.hhp} hp</strong></p>
                  <p>• HHP per Square Inch (HSI): <strong className="text-sky-700 font-bold">{(telemetry.hhp / ((Math.PI / 4) * Math.pow(currentWellData.bitSize, 2))).toFixed(2)} hp/in²</strong></p>
                  <p>• Jet Impact Force: <strong className="text-emerald-700 font-bold">{telemetry.jif} lbf</strong></p>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
};

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${active
        ? 'bg-sky-50 text-sky-700 border border-sky-300 shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
        }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function TelemetryCard({ title, value, unit, status, subtext, color }) {
  const isDanger = status === 'danger';
  const isWarn = status === 'warning';

  const cardBgBorder = isDanger
    ? 'border-rose-400 bg-rose-50/50'
    : isWarn
      ? 'border-amber-400 bg-amber-50/50'
      : 'border-slate-200 bg-white hover:border-slate-300';

  const textColor = isDanger
    ? 'text-rose-700'
    : isWarn
      ? 'text-amber-700'
      : 'text-slate-900';

  return (
    <div className={`p-3.5 rounded-xl ${cardBgBorder} border flex flex-col justify-between relative overflow-hidden transition shadow-xs`}>
      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block truncate">
        {title}
      </span>
      <div className="my-1.5 flex items-baseline gap-1.5">
        <span className={`text-2xl font-mono font-black ${textColor}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{unit}</span>
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono border-t border-slate-100 pt-1.5">
        <span className="text-slate-500 font-medium truncate">{subtext}</span>
        <span className={`w-2 h-2 rounded-full ${isDanger ? 'bg-rose-500 animate-ping' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
      </div>
    </div>
  );
}

export default LiveTelemetry;
