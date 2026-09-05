import React, { useState } from 'react';
import { Settings, Save, Server, Radio, Database, ShieldCheck } from 'lucide-react';

const DEFAULT_CONFIG = {
  rigId: 'ASSAM-RIG-04',
  operator: 'Oil India Limited (OIL)',
  basin: 'Upper Assam Shelf',
  hqUrl: 'https://ertmac.oilindia.in/api/v4',
  mqttBroker: 'mqtt://localhost:1883',
  witsmlVersion: 'WITSML 1.4.1.1 (ETP 1.2)',
  samplingRate: '10 Hz',
  pressureThreshold: 4000,
  kickTripMargin: 15,
  autoActuatorTrip: true
};

const SettingsPage = () => {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('ertmac_system_config');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('ertmac_system_config', JSON.stringify(config));
    } catch {
      // ignore storage error
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full space-y-4 font-sans select-none">
      <div className="p-4 rounded-xl bg-scada-card border border-scada-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Settings size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold font-mono text-white tracking-wide uppercase">
              eRTMAC-NWIS System Configuration & Telemetry Gateways
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Oil India Limited Corporate Operations Center Connectivity
            </p>
          </div>
        </div>
        {saved && (
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/30">
            ✓ CONFIGURATION SAVED
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="p-6 rounded-xl bg-scada-card border border-scada-border space-y-6 flex-1 overflow-y-auto custom-scrollbar font-mono text-xs">
        <div>
          <h3 className="text-xs font-bold uppercase text-white pb-2 border-b border-scada-border mb-4 flex items-center gap-2">
            <Server size={14} className="text-cyan-400" /> Rig Field Station & Telemetry Uplink
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 block mb-1">RIG IDENTIFIER</label>
              <input
                type="text"
                value={config.rigId}
                onChange={e => setConfig({ ...config, rigId: e.target.value })}
                className="w-full bg-slate-900 border border-scada-border rounded-lg p-2.5 text-white outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">OPERATOR ORGANIZATION</label>
              <input
                type="text"
                value={config.operator}
                disabled
                className="w-full bg-slate-900/60 border border-scada-border/50 rounded-lg p-2.5 text-slate-400 outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">MQTT BROKER URL (NODE.JS / AEDES)</label>
              <input
                type="text"
                value={config.mqttBroker}
                onChange={e => setConfig({ ...config, mqttBroker: e.target.value })}
                className="w-full bg-slate-900 border border-scada-border rounded-lg p-2.5 text-cyan-300 outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">WITSML DATA PROTOCOL</label>
              <input
                type="text"
                value={config.witsmlVersion}
                disabled
                className="w-full bg-slate-900/60 border border-scada-border/50 rounded-lg p-2.5 text-slate-400 outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase text-white pb-2 border-b border-scada-border mb-4 flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400" /> Safety Actuator & Trip Thresholds
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 block mb-1">STANDPIPE MAX PRESSURE TRIP (PSI)</label>
              <input
                type="number"
                value={config.pressureThreshold}
                onChange={e => setConfig({ ...config, pressureThreshold: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-scada-border rounded-lg p-2.5 text-rose-400 font-bold outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">KICK DETECTION TRIP MARGIN (ΔQ GPM)</label>
              <input
                type="number"
                value={config.kickTripMargin}
                onChange={e => setConfig({ ...config, kickTripMargin: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-scada-border rounded-lg p-2.5 text-amber-400 font-bold outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-scada-border flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-lg shadow-cyan-900/30"
          >
            <Save size={14} /> SAVE CONFIGURATION
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
