import React, { useState, useEffect } from 'react';
import { LayoutGrid, Activity, Cog, ShieldAlert, Radio, Compass, Layers, Cpu, Box, AlertTriangle, Sliders, HardDrive, FileText, Settings, Bell, Bot, X, Send } from 'lucide-react';
import socket from './services/socket';

// Import Pages
import Dashboard from './pages/Dashboard';
import LiveTelemetry from './pages/LiveTelemetry';
import DrillingMechanics from './pages/DrillingMechanics';
import WellControl from './pages/WellControl';
import VibrationAnalysis from './pages/VibrationAnalysis';
import AntiCollision from './pages/AntiCollision';
import SubsurfaceIntelligence from './pages/SubsurfaceIntelligence';
import AIAnalytics from './pages/AIAnalytics';
import RuleEngine from './pages/RuleEngine';
import Alerts from './pages/Alerts';
import Actuators from './pages/Actuators';
import Devices from './pages/Devices';
import EventLog from './pages/EventLog';
import telemetryEngine from './services/telemetryEngine';
import SettingsPage from './pages/Settings';
import ErrorBoundary from './components/ErrorBoundary';
import { generateCopilotResponse, getSectionQuickPrompts } from './services/aiSolutionEngine';

function App() {
  const [systemHealth, setSystemHealth] = useState({ status: 'HEALTHY' });
  const [activeTab, setActiveTab] = useState('Overview');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [telemetry, setTelemetry] = useState(telemetryEngine.getCurrentState());
  const [chatMessages, setChatMessages] = useState([
    { sender: 'AI', text: 'eRTMAC AI Subsurface Copilot active. Continuous multi-channel telemetry monitoring Oil India Limited Naharkatiya (NHK-542) & Baghjan Deep HPHT. Live pressure, MSE, ECD, and trip margins active. How can I assist with trajectory, ROP optimization, vibration, or well control?' }
  ]);
  const [userInput, setUserInput] = useState('');

  useEffect(() => {
    socket.on('system:status', (health) => setSystemHealth(health));
    const unsub = telemetryEngine.subscribe((state) => {
      setSystemHealth({ status: state.systemHealth });
      setTelemetry({ ...state });
    });
    return () => {
      socket.off('system:status');
      unsub();
    };
  }, []);

  const handleUserSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    processUserQuery(userInput);
    setUserInput('');
  };

  const processUserQuery = (query) => {
    setChatMessages(prev => [...prev, { sender: 'USER', text: query }]);
    
    setTimeout(() => {
      const aiResponse = generateCopilotResponse(query, {
        activeTab,
        telemetry
      });

      setChatMessages(prev => [...prev, { sender: 'AI', text: aiResponse }]);
    }, 450);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Overview': return <Dashboard />;
      case 'Live Telemetry': return <LiveTelemetry />;
      case 'Drilling Mechanics': return <DrillingMechanics />;
      case 'Well Center & Control':
      case 'Well Control': return <WellControl />;
      case 'Vibration Analysis': return <VibrationAnalysis />;
      case 'Anti-Collision': return <AntiCollision />;
      case 'Subsurface': return <SubsurfaceIntelligence />;
      case 'AI Analytics': return <AIAnalytics />;
      case 'Rule Engine': return <RuleEngine />;
      case 'Alerts': return <Alerts />;
      case 'Actuators': return <Actuators />;
      case 'Devices': return <Devices />;
      case 'Event Log': return <EventLog />;
      case 'Settings': return <SettingsPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden antialiased select-none bg-slate-50 text-slate-900">
      
      {/* ================= SIDEBAR ================= */}
      <aside className="w-72 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 z-30 shadow-xs">
        <div>
          {/* VISIBLY LARGE OIL INDIA LOGO IN LEFT-MOST CORNER */}
          <div className="h-20 flex items-center px-4 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-3.5 w-full">
              <img 
                src="/images/oil_india_logo.png" 
                alt="Oil India Limited Official Logo" 
                className="h-14 w-auto object-contain shrink-0 drop-shadow-xs"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/oil_india_logo.jpg';
                }}
              />
              <div className="flex flex-col min-w-0">
                <span className="font-black tracking-wide text-slate-900 text-sm leading-tight uppercase font-sans">
                  OIL INDIA
                </span>
                <span className="text-[10px] text-red-600 font-extrabold tracking-wider uppercase font-sans">
                  ऑयल इंडिया
                </span>
                <span className="text-[9px] text-slate-500 font-mono tracking-tighter uppercase truncate mt-0.5">
                  Autonomous Command
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-160px)] custom-scrollbar">
            <div>
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Core Operations</span>
              <nav className="mt-1 space-y-1">
                <NavItem icon={<LayoutGrid size={16} />} label="Overview" active={activeTab === 'Overview'} onClick={() => setActiveTab('Overview')} />
                <NavItem icon={<Activity size={16} />} label="Live Telemetry" active={activeTab === 'Live Telemetry'} onClick={() => setActiveTab('Live Telemetry')} />
                <NavItem icon={<Cog size={16} />} label="Drilling Mechanics" active={activeTab === 'Drilling Mechanics'} onClick={() => setActiveTab('Drilling Mechanics')} />
                <NavItem icon={<ShieldAlert size={16} />} label="Well Center & Control" active={activeTab === 'Well Center & Control' || activeTab === 'Well Control'} onClick={() => setActiveTab('Well Center & Control')} />
              </nav>
            </div>

            <div>
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Advanced Engineering</span>
              <nav className="mt-1 space-y-1">
                <NavItem icon={<Radio size={16} />} label="Vibration Analysis" active={activeTab === 'Vibration Analysis'} onClick={() => setActiveTab('Vibration Analysis')} />
                <NavItem icon={<Compass size={16} />} label="Anti-Collision" active={activeTab === 'Anti-Collision'} onClick={() => setActiveTab('Anti-Collision')} />
                <NavItem icon={<Layers size={16} />} label="Subsurface" active={activeTab === 'Subsurface'} onClick={() => setActiveTab('Subsurface')} />
                <NavItem icon={<Cpu size={16} />} label="AI Analytics" active={activeTab === 'AI Analytics'} onClick={() => setActiveTab('AI Analytics')} />
              </nav>
            </div>

            <div>
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Control & System</span>
              <nav className="mt-1 space-y-1">
                <NavItem icon={<Box size={16} />} label="Rule Engine" active={activeTab === 'Rule Engine'} onClick={() => setActiveTab('Rule Engine')} />
                <NavItem icon={<AlertTriangle size={16} />} label="Alerts" active={activeTab === 'Alerts'} onClick={() => setActiveTab('Alerts')} rightElement={<span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] rounded font-mono font-bold">2</span>} />
                <NavItem icon={<Sliders size={16} />} label="Actuators" active={activeTab === 'Actuators'} onClick={() => setActiveTab('Actuators')} />
                <NavItem icon={<HardDrive size={16} />} label="Devices" active={activeTab === 'Devices'} onClick={() => setActiveTab('Devices')} />
                <NavItem icon={<FileText size={16} />} label="Event Log" active={activeTab === 'Event Log'} onClick={() => setActiveTab('Event Log')} />
                <NavItem icon={<Settings size={16} />} label="Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
              </nav>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[11px] font-mono font-bold text-slate-700">RIG: ASSAM-04</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded border border-sky-300">5G OK</span>
        </div>
      </aside>

      {/* ================= MAIN DASHBOARD VIEWPORT ================= */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50">
        <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between z-20 shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-black tracking-wider text-slate-900 font-mono uppercase">
              eRTMAC–NWIS
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300 rounded uppercase">
              Assam Operational Unit • V4.8
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300">
              <span className={`w-2 h-2 rounded-full ${systemHealth.status === 'HEALTHY' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-pulse'}`}></span>
              <span className={`text-xs font-mono font-bold uppercase tracking-wider ${systemHealth.status === 'HEALTHY' ? 'text-emerald-700' : 'text-red-700'}`}>
                {systemHealth.status === 'HEALTHY' ? 'Telemetry Online' : 'Telemetry Degraded'}
              </span>
            </div>

            <button 
              onClick={() => setIsDrawerOpen(!isDrawerOpen)} 
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 text-xs font-mono font-bold transition shadow-xs cursor-pointer"
            >
              <Bot size={16} className="text-sky-600" />
              <span>AI Copilot</span>
            </button>

            <button
              onClick={() => setActiveTab('Alerts')}
              title="View Active SCADA Alarms"
              className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition hover:text-red-600 cursor-pointer"
            >
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            </button>
          </div>
        </header>

        <div className="p-6 flex-1 flex flex-col min-h-0 custom-scrollbar overflow-y-auto bg-slate-50">
          <ErrorBoundary key={activeTab}>
            {renderActiveTab()}
          </ErrorBoundary>
        </div>

        {/* ================= DRILLING AI COPILOT DRAWER ================= */}
        <div className={`absolute right-0 top-0 bottom-0 w-96 bg-white border-l border-slate-200 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out flex flex-col justify-between ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700 border border-sky-200">
                <Bot size={16} />
              </div>
              <div>
                <h3 className="text-xs font-black font-mono text-slate-900">OIL INDIA AI COPILOT</h3>
                <p className="text-[10px] font-mono text-slate-600">Active: <span className="text-sky-700 font-bold">{activeTab}</span> • {telemetry.wellId || 'NHK-542'}</p>
              </div>
            </div>
            <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 p-4 space-y-3.5 overflow-y-auto custom-scrollbar font-mono text-xs flex flex-col bg-slate-50">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex items-start gap-2.5 ${msg.sender === 'USER' ? 'justify-end' : ''}`}>
                {msg.sender === 'AI' && (
                  <div className="w-6 h-6 rounded bg-red-600 flex items-center justify-center text-white shrink-0 text-[10px] font-black">AI</div>
                )}
                <div className={`p-3 rounded-lg border leading-relaxed shadow-xs ${msg.sender === 'USER' ? 'bg-sky-100 border-sky-300 text-sky-900 font-medium' : 'bg-white border-slate-200 text-slate-800'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-2 border-t border-slate-200 bg-white flex gap-2 overflow-x-auto custom-scrollbar">
            {getSectionQuickPrompts(activeTab).map((chip, idx) => (
              <button
                key={idx}
                onClick={() => processUserQuery(chip.query)}
                className="text-[10px] font-mono whitespace-nowrap bg-slate-100 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 border border-slate-200 rounded px-2.5 py-1 text-slate-700 font-semibold transition"
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-slate-200 bg-white">
            <form onSubmit={handleUserSubmit} className="relative">
              <input 
                type="text" 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask Oil India AI Copilot..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
              />
              <button type="submit" className="absolute right-1.5 top-1.5 p-1 rounded bg-red-600 hover:bg-red-700 text-white transition">
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>

      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, rightElement }) {
  if (active) {
    return (
      <button onClick={onClick} className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-bold shadow-xs">
        <div className="flex items-center gap-3">
          {React.cloneElement(icon, { className: "text-red-600" })}
          <span>{label}</span>
        </div>
        {rightElement}
      </button>
    );
  }
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition">
      <div className="flex items-center gap-3">
        {React.cloneElement(icon, { className: "text-slate-400" })}
        <span>{label}</span>
      </div>
      {rightElement}
    </button>
  );
}

export default App;
