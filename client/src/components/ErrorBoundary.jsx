import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[eRTMAC UI Error Caught]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-rose-500/40 text-slate-200 font-mono text-xs space-y-4 max-w-2xl mx-auto my-10 shadow-2xl">
          <div className="flex items-center gap-3 text-rose-400">
            <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/30">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase text-white">Component Recovered from Runtime Anomaly</h3>
              <p className="text-[11px] text-slate-400">eRTMAC telemetry sandbox safely intercepted the render exception.</p>
            </div>
          </div>

          <div className="p-3 rounded bg-black/60 border border-white/5 text-[11px] text-rose-300 overflow-x-auto">
            {this.state.error?.message || 'Unknown render exception caught'}
          </div>

          <div className="flex justify-end">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-2 transition text-xs shadow-md shadow-cyan-900/40"
            >
              <RefreshCw size={14} /> Reset Component
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
