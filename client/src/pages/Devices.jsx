import React from 'react';
import { HardDrive, Server, Wifi, CheckCircle2, RefreshCw, Cpu, Zap, ShieldCheck } from 'lucide-react';

const Devices = () => {
  const devices = [
    {
      id: 'D001',
      name: 'Assam Rig-04 Edge SCADA Gateway (Node 17)',
      type: 'Industrial ARM Cortex Edge Controller',
      location: 'Doghouse Main Instrumentation Rack',
      ip: '192.168.10.17',
      status: 'ONLINE',
      latency: '8.4 ms',
      firmware: 'v4.8.2-rtmac',
      uptime: '42d 18h 22m',
      cpuLoad: '18%',
      temp: '41°C',
      throughput: '124 kbps'
    },
    {
      id: 'D002',
      name: 'Subsurface MWD Pulser & EML Tool',
      type: 'Downhole LWD Telemetry Assembly',
      location: 'BHA 6-3/4" Non-Magnetic Drill Collar',
      ip: 'EML Bus #01',
      status: 'ONLINE',
      latency: '24.0 ms',
      firmware: 'mwd-pulse-rev7',
      uptime: '148 hrs (Downhole)',
      cpuLoad: '34%',
      temp: '88°C',
      throughput: '12 bps (Mud Pulse)'
    },
    {
      id: 'D003',
      name: 'Surface Mud Logging Chromatograph RTU',
      type: 'FID Hydrocarbon Gas Analyzer',
      location: 'Mud Logging Cabin',
      ip: '192.168.10.42',
      status: 'ONLINE',
      latency: '4.2 ms',
      firmware: 'gas-fid-v2.1',
      uptime: '18d 04h 10m',
      cpuLoad: '12%',
      temp: '32°C',
      throughput: '64 kbps'
    },
    {
      id: 'D004',
      name: 'Top Drive VFD Fieldbus Gateway',
      type: 'Profibus-to-MQTT Bridge',
      location: 'Power Control Room (PCR)',
      ip: '192.168.10.88',
      status: 'ONLINE',
      latency: '2.1 ms',
      firmware: 'vfd-profibus-1.4',
      uptime: '62d 11h 05m',
      cpuLoad: '28%',
      temp: '38°C',
      throughput: '256 kbps'
    }
  ];

  return (
    <div className="flex flex-col h-full space-y-4 font-sans select-none">
      
      {/* ================= HEADER ================= */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 shadow-xs">
            <HardDrive size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black font-mono text-slate-900 tracking-tight">
                RIG FLOOR EDGE HARDWARE & INDUSTRIAL RTU CONTROLLERS
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                WITS0 / WITSML
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5 font-medium">
              Oil India Assam Basin Operations • Fieldbus Networks • Downhole MWD Modules • Edge Pipelining
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-lg border border-emerald-300 shadow-xs flex items-center gap-1.5">
          <CheckCircle2 size={14} /> ALL 4 HARDWARE NODES ONLINE & SYNCHRONIZED
        </span>
      </div>

      {/* ================= AI HARDWARE & FIELDBUS SUPERVISOR DIRECTIVE ================= */}
      <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-950 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white border border-emerald-700 shrink-0 shadow-xs">
            <Zap size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/90 border border-emerald-300 shadow-xs">
                eRTMAC AI EDGE HARDWARE SUPERVISOR
              </span>
              <span className="text-xs font-mono font-bold text-emerald-800">
                DULIAJAN TELEMETRY HUB • ZERO PACKET LOSS (0.00%)
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-black tracking-tight mt-1 text-slate-950">
              OPTIMAL EDGE HARDWARE INTEGRITY: ALL FIELDBUS HUBS NOMINAL
            </h3>
            <p className="text-sm font-semibold text-slate-800 mt-1 max-w-4xl">
              Continuous telemetry heartbeat verified across Doghouse SCADA gateway, downhole MWD electromagnetic pulser, mud logging chromatograph, and top drive Profibus bridge. Latency margin remains within 24.0ms downhole threshold with 100% frame synchronization.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex md:flex-col items-end justify-between gap-1 text-right">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">BUS HEALTH</span>
          <span className="px-3 py-1 rounded-lg text-xs font-black tracking-wide border shadow-xs bg-emerald-100 text-emerald-800 border-emerald-300">
            99.98% UPTIME
          </span>
        </div>
      </div>

      {/* ================= DEVICES GRID ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto custom-scrollbar">
        {devices.map((dev) => (
          <div key={dev.id} className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-black font-mono text-slate-900 uppercase tracking-tight">{dev.name}</span>
                <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 shadow-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {dev.status}
                </span>
              </div>
              <p className="text-xs font-mono font-medium text-slate-500 mt-1">{dev.type} • {dev.location}</p>
            </div>

            {/* Hardware Metrics Grid */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs">
              <div>
                <span className="text-slate-400 text-[10px] font-bold block">BUS / IP</span>
                <span className="text-sky-700 font-black">{dev.ip}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold block">PING LATENCY</span>
                <span className="text-emerald-700 font-black">{dev.latency}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold block">SYSTEM UPTIME</span>
                <span className="text-slate-800 font-bold">{dev.uptime}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold block">CPU / LOAD</span>
                <span className="text-slate-800 font-bold">{dev.cpuLoad}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold block">OPERATING TEMP</span>
                <span className="text-amber-700 font-bold">{dev.temp}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold block">STREAM RATE</span>
                <span className="text-indigo-700 font-bold">{dev.throughput}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono border-t border-slate-100 pt-2.5">
              <span className="text-slate-500">Firmware: <strong className="text-slate-800 font-bold">{dev.firmware}</strong></span>
              <span className="text-emerald-700 font-black flex items-center gap-1">
                <CheckCircle2 size={13} /> TX/RX 100% OK
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Devices;
