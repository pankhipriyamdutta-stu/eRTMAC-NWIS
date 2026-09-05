import React, { useState } from 'react';
import { Box, Sliders, ShieldAlert, CheckCircle, AlertTriangle, Play, Settings2 } from 'lucide-react';

const RuleEngine = () => {
  const [rules, setRules] = useState([
    {
      id: 'R001_STICKING',
      name: 'Pipe Sticking / Pack-Off Warning',
      condition: 'SPP > 3,100 psi AND HookLoad < 170 klbs AND Torque > 6,000 ft-lbs',
      severity: 'CRITICAL',
      action: 'NOTIFY_CREW',
      enabled: true,
      cooldown: '30s'
    },
    {
      id: 'R002_KICK_INFLUX',
      name: 'Hydrocarbon Gas Influx / Kick Alarm',
      condition: 'FlowOut > FlowIn + 15 GPM AND PitGain > 8 bbls',
      severity: 'EMERGENCY',
      action: 'SOUND_ALARM_AUTO_DIVERTER',
      enabled: true,
      cooldown: '10s'
    },
    {
      id: 'R003_LOST_CIRC',
      name: 'Thief Zone Lost Circulation',
      condition: 'FlowOut < FlowIn - 15 GPM AND PitVolume < 1,300 bbls',
      severity: 'WARNING',
      action: 'REDUCE_FLOW_PUMP_LCM',
      enabled: true,
      cooldown: '60s'
    },
    {
      id: 'R004_STICK_SLIP',
      name: 'Severe Torsional Stick-Slip Resonance',
      condition: 'SSI > 80% AND LateralVibration > 1.5g RMS',
      severity: 'WARNING',
      action: 'TRIGGER_SOFT_TORQUE',
      enabled: true,
      cooldown: '45s'
    },
    {
      id: 'R005_OVERPRESSURE',
      name: 'Standpipe Overpressure Actuator Cutoff',
      condition: 'SPP >= 4,000 psi (Burst Disc Limit)',
      severity: 'CRITICAL',
      action: 'PUMP_OFF_ACTUATOR_TRIP',
      enabled: true,
      cooldown: '5s'
    }
  ]);

  const toggleRule = (id) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <div className="flex flex-col h-full space-y-4 font-sans select-none">
      <div className="p-4 rounded-xl bg-scada-card border border-scada-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Box size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold font-mono text-white tracking-wide uppercase">
              eRTMAC Autonomous Rule Engine & Alarm Logic Matrix
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Real-Time SCADA Multi-Variant Logic • Automated Safety Interlocks • IADC Safety Rules
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/30">
          5 / 5 ACTIVE RULES EVALUATING
        </span>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
        {rules.map((rule) => (
          <div key={rule.id} className="p-4 rounded-xl bg-scada-card border border-scada-border flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono font-bold text-white">{rule.name}</span>
                <span className="text-[10px] font-mono text-slate-400">({rule.id})</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${rule.severity === 'EMERGENCY' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : rule.severity === 'CRITICAL' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'}`}>
                  {rule.severity}
                </span>
              </div>
              <p className="text-xs font-mono text-cyan-300/90">{rule.condition}</p>
              <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
                <span>Action: <strong className="text-white">{rule.action}</strong></span>
                <span>Cooldown: <strong className="text-slate-300">{rule.cooldown}</strong></span>
              </div>
            </div>

            <button
              onClick={() => toggleRule(rule.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${rule.enabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
            >
              {rule.enabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RuleEngine;
