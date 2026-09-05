import React, { useState, useEffect } from 'react';
import telemetryEngine from '../services/telemetryEngine';
import { AlertTriangle, CheckCircle, Check, ShieldAlert, Zap, ShieldCheck } from 'lucide-react';

const Alerts = () => {
  const [telemetry, setTelemetry] = useState(telemetryEngine.getCurrentState());
  const [alerts, setAlerts] = useState([
    {
      id: 'ALT-1092',
      time: '10:24:40',
      ruleId: 'R004_STICK_SLIP',
      wellId: 'OIL-NHK-542',
      severity: 'WARNING',
      message: 'Harmonic stick-slip oscillation exceeded 75% on lower BHA assembly in Barail sandstone section.',
      param: 'SSI',
      value: '78%',
      threshold: '50%',
      status: 'ACTIVE'
    },
    {
      id: 'ALT-1091',
      time: '10:22:15',
      ruleId: 'R001_STICKING',
      wellId: 'OIL-NHK-542',
      severity: 'INFO',
      message: 'Standpipe pressure transient spike (+80 psi) during drill pipe connection.',
      param: 'SPP',
      value: '3,160 psi',
      threshold: '3,100 psi',
      status: 'ACKNOWLEDGED'
    }
  ]);

  useEffect(() => {
    const unsub = telemetryEngine.subscribe((state) => {
      setTelemetry({ ...state });
      if (state.flowStatus === 'KICK_WARNING') {
        setAlerts(prev => {
          if (prev.some(a => a.ruleId === 'R002_KICK_INFLUX' && a.status === 'ACTIVE')) return prev;
          return [
            {
              id: `ALT-${Date.now().toString().slice(-4)}`,
              time: state.timestamp,
              ruleId: 'R002_KICK_INFLUX',
              wellId: state.wellId,
              severity: 'CRITICAL',
              message: `Hydrocarbon influx detected! Flow out exceeds flow in by ${state.deltaFlow} GPM with 80 psi SPP drop.`,
              param: 'Flow Delta',
              value: `+${state.deltaFlow} GPM`,
              threshold: '15 GPM',
              status: 'ACTIVE'
            },
            ...prev
          ];
        });
      }
    });
    return () => unsub();
  }, []);

  const acknowledgeAlert = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a));
  };

  const hasCritical = alerts.some(a => a.severity === 'CRITICAL' && a.status === 'ACTIVE');
  const activeCount = alerts.filter(a => a.status === 'ACTIVE').length;

  return (
    <div className="flex flex-col h-full space-y-4 font-sans select-none">
      
      {/* ================= HEADER ================= */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shadow-xs">
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black font-mono text-slate-900 tracking-tight">
                eRTMAC SCADA ACTIVE ALARMS & INCIDENT RESPONSE LOG
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                OIL ASSAM FIELD
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5 font-medium">
              Real-time Influx, Vibration Resonance, and Overpressure Tripwire Surveillance
            </p>
          </div>
        </div>
        <span className={`text-xs font-mono font-bold px-3.5 py-1.5 rounded-lg border shadow-xs ${
          activeCount > 0
            ? 'bg-amber-50 text-amber-800 border-amber-300'
            : 'bg-emerald-50 text-emerald-700 border-emerald-300'
        }`}>
          {activeCount} UNACKNOWLEDGED INCIDENTS
        </span>
      </div>

      {/* ================= AI SAFETY & INCIDENT DIRECTIVE BANNER ================= */}
      <div className={`p-4 rounded-xl border-2 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
        hasCritical
          ? 'bg-rose-50 border-rose-500 text-rose-950'
          : activeCount > 0
          ? 'bg-amber-50 border-amber-500 text-amber-950'
          : 'bg-emerald-50 border-emerald-500 text-emerald-950'
      }`}>
        <div className="flex items-start md:items-center gap-3.5">
          <div className={`p-2.5 rounded-xl border shrink-0 ${
            hasCritical
              ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
              : activeCount > 0
              ? 'bg-amber-600 text-white border-amber-700'
              : 'bg-emerald-600 text-white border-emerald-700'
          }`}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/90 border border-current shadow-xs">
                eRTMAC AI INCIDENT SUPERVISOR
              </span>
              <span className="text-xs font-mono font-bold text-slate-600">
                SCADA TRIPWIRE ENGINE • OIL-NHK-542
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-black tracking-tight mt-1 text-slate-950">
              {hasCritical
                ? 'CRITICAL WELL CONTROL ALERT: IMMEDIATE RIG FLOOR INTERVENTION'
                : activeCount > 0
                ? 'WARNING: PARAMETER DRIFT EXCEEDING OPERATIONAL THRESHOLDS'
                : 'ALL SCADA SAFETY TRIPWIRES OPERATING NOMINALLY'}
            </h3>
            <p className="text-sm font-semibold text-slate-800 mt-1 max-w-4xl">
              {hasCritical
                ? 'Automated flow sensor differential triggered kick protocol. Space out drillstring, disengage rotary drive, shut in annular preventer, and monitor wellhead shut-in pressures.'
                : activeCount > 0
                ? 'Torsional vibrations elevated in Barail formation. Review telemetry dynamics and implement automated RPM detuning to protect BHA cutters.'
                : 'No unacknowledged safety tripwire deviations detected. Wellbore integrity, mud flow loop, and drillstring mechanics operating within safe engineering margins.'}
            </p>
          </div>
        </div>
        <div className="shrink-0 flex md:flex-col items-end justify-between gap-1 text-right">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">SEVERITY LEVEL</span>
          <span className={`px-3 py-1 rounded-lg text-xs font-black tracking-wide border shadow-xs ${
            hasCritical
              ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
              : activeCount > 0
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}>
            {hasCritical ? 'CRITICAL TIER-1' : activeCount > 0 ? 'WARNING TIER-2' : 'NOMINAL TIER-0'}
          </span>
        </div>
      </div>

      {/* ================= ALARMS LIST ================= */}
      <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
        {alerts.map((alert) => {
          const isCritical = alert.severity === 'CRITICAL';
          const isWarning = alert.severity === 'WARNING';
          const isActive = alert.status === 'ACTIVE';

          const cardBgBorder = isCritical
            ? 'border-rose-400 bg-rose-50/40 shadow-xs'
            : isWarning
            ? 'border-amber-300 bg-amber-50/40 shadow-xs'
            : 'border-slate-200 bg-white shadow-xs';

          return (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardBgBorder}`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${isActive ? (isCritical ? 'bg-rose-600 animate-ping' : 'bg-amber-500') : 'bg-slate-400'}`}></span>
                  <span className="text-xs font-mono font-black text-slate-900">{alert.id}</span>
                  <span className="text-xs font-mono font-bold text-sky-700">{alert.wellId}</span>
                  <span className="text-[10px] font-mono font-semibold text-slate-500">[{alert.time}]</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                    isCritical
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : isWarning
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{alert.message}</p>
                <div className="flex items-center gap-4 text-xs font-mono text-slate-600 pt-0.5">
                  <span>Rule: <strong className="text-slate-800">{alert.ruleId}</strong></span>
                  <span>Parameter: <strong className="text-slate-800">{alert.param}</strong></span>
                  <span>Measured: <strong className={isCritical ? 'text-rose-700 font-black' : isWarning ? 'text-amber-700 font-black' : 'text-slate-900'}>{alert.value}</strong></span>
                  <span>Threshold Limit: <strong className="text-slate-800">{alert.threshold}</strong></span>
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-end">
                {alert.status === 'ACTIVE' ? (
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-sky-600 hover:bg-sky-700 text-white border border-sky-700 shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Check size={15} /> Acknowledge Alert
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                    <CheckCircle size={15} /> Acknowledged
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Alerts;
