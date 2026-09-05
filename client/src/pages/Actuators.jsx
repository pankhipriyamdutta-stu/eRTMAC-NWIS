import React, { useState } from 'react';
import { Sliders, Power, ShieldCheck, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';

const Actuators = () => {
  const [actuators, setActuators] = useState([
    {
      id: 'A001',
      name: 'Triplex Mud Pump Emergency Shutdown (ESD)',
      type: 'Pneumatic Dump Valve',
      location: 'Pump House Skid-01',
      status: 'ARMED',
      state: 'ON',
      pressure: '120 psi Air',
      lastAck: '10:24:12',
      health: 'EXCELLENT'
    },
    {
      id: 'A002',
      name: 'BOP Annular Hydraulic Operator',
      type: 'Hydraulic Cylinder 3000 PSI',
      location: 'Substructure Wellhead Cellar',
      status: 'READY',
      state: 'OPEN',
      pressure: '1,500 psi Hyd',
      lastAck: '10:24:10',
      health: 'EXCELLENT'
    },
    {
      id: 'A003',
      name: 'Automated Drilling Choke Manifold',
      type: 'High-Torque Stepper Orifice',
      location: 'Rig Choke & Kill Skids',
      status: 'AUTO',
      state: 'POSITION: 42%',
      pressure: '3,000 psi Rated',
      lastAck: '10:24:15',
      health: 'EXCELLENT'
    },
    {
      id: 'A004',
      name: 'Top Drive Soft Torque System Actuator',
      type: 'AC VFD Dynamic Brake',
      location: 'Mast Derrick Top Drive',
      status: 'STANDBY',
      state: 'ENGAGED',
      pressure: 'N/A (Electric)',
      lastAck: '10:24:18',
      health: 'EXCELLENT'
    }
  ]);

  const toggleActuator = (id) => {
    setActuators(prev => prev.map(a => {
      if (a.id === id) {
        const nextState = a.state === 'ON' ? 'OFF' : a.state === 'OFF' ? 'ON' : a.state === 'OPEN' ? 'CLOSED' : 'OPEN';
        return { ...a, state: nextState, lastAck: new Date().toLocaleTimeString() };
      }
      return a;
    }));
  };

  return (
    <div className="flex flex-col h-full space-y-4 font-sans select-none">
      <div className="p-4 rounded-xl bg-scada-card border border-scada-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Sliders size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold font-mono text-white tracking-wide uppercase">
              Rig Floor SCADA Actuator Controls & Hydraulic Telemetry
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Remote Solenoid Valves • Koomey Hydraulic Unit Interlocks • Emergency Shutdown Commands
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/30">
          ALL 4 ACTUATORS OPERATIONAL
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto custom-scrollbar">
        {actuators.map((act) => (
          <div key={act.id} className="p-5 rounded-xl bg-scada-card border border-scada-border flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white uppercase">{act.name}</span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">
                  {act.id}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-1">{act.type} • {act.location}</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">OPERATING STATE</span>
                <span className={`font-bold text-sm ${act.state === 'ON' || act.state === 'OPEN' || act.state === 'ENGAGED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {act.state}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">CONTROL PRESSURE</span>
                <span className="text-white font-bold text-sm">{act.pressure}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">LAST ACK</span>
                <span className="text-slate-300 font-bold text-sm">{act.lastAck}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-[11px] font-mono text-slate-400">Health: <strong className="text-emerald-400">{act.health}</strong></span>
              <button
                onClick={() => toggleActuator(act.id)}
                className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition"
              >
                TOGGLE COMMAND
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Actuators;
