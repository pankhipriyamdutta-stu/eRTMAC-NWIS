import React, { useState } from 'react';
import { FileText, Terminal, Filter, Search, Download } from 'lucide-react';

const EventLog = () => {
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const events = [
    { time: '10:25:45', level: 'AI', source: 'FastDTW-Engine', msg: 'Subsurface Barail Sandstone top entry validated at 2,980m TVD with 98.2% correlation.' },
    { time: '10:25:30', level: 'CMD', source: 'SCADA-Operator', msg: 'Top Drive soft-torque damping setpoint updated to 120 RPM.' },
    { time: '10:25:01', level: 'WARN', source: 'EdgeNode-17', msg: 'BHA lateral acceleration peak of 1.45g recorded during string reaming.' },
    { time: '10:24:55', level: 'INFO', source: 'TelemetryCore', msg: 'System health integrity check: All 14 transducers responding within tolerance.' },
    { time: '10:24:20', level: 'INFO', source: 'WITSML-Streamer', msg: 'WITSML 1.4.1.1 ETP stream verified with Duliajan eRTMAC corporate server.' },
    { time: '10:23:45', level: 'CMD', source: 'Pump-Controller', msg: 'Triplex pump stroke rate stabilized at 580 GPM nominal.' },
    { time: '10:22:10', level: 'INFO', source: 'MWD-Pulser', msg: 'Downhole LWD survey packet received. Inc: 24.5°, Azi: 56.0°, DLS: 1.82°/30m.' },
    { time: '10:20:00', level: 'INFO', source: 'System', msg: 'Rig-04 autonomous monitoring session initiated for well OIL-NHK-542.' }
  ];

  const filteredEvents = events.filter(e => {
    if (filter !== 'ALL' && e.level !== filter) return false;
    if (searchTerm && !e.msg.toLowerCase().includes(searchTerm.toLowerCase()) && !e.source.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full space-y-4 font-sans select-none">
      <div className="p-4 rounded-xl bg-scada-card border border-scada-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <FileText size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold font-mono text-white tracking-wide uppercase">
              eRTMAC Autonomous Operations & Audit Event Log
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Chronological WITSML & SCADA Event Stream
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1 bg-slate-900 border border-scada-border rounded px-2 py-1">
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search event logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-white outline-none text-xs w-36 placeholder-slate-500"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-900 border border-scada-border text-slate-300 rounded px-2.5 py-1 outline-none"
          >
            <option value="ALL">All Levels</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="CMD">CMD</option>
            <option value="AI">AI</option>
          </select>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-black/40 border border-scada-border font-mono text-xs flex-1 overflow-y-auto custom-scrollbar space-y-2">
        {filteredEvents.map((evt, idx) => (
          <div key={idx} className="p-2.5 rounded bg-white/5 border border-white/5 flex items-start gap-3 hover:bg-white/10 transition">
            <span className="text-slate-500 text-[11px] shrink-0 font-bold">[{evt.time}]</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
              evt.level === 'AI' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
              evt.level === 'CMD' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
              evt.level === 'WARN' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
              'bg-slate-700/40 text-slate-300'
            }`}>
              {evt.level}
            </span>
            <span className="text-cyan-400 font-bold shrink-0">{evt.source}:</span>
            <span className="text-slate-200 leading-relaxed">{evt.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventLog;
