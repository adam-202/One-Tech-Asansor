import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

class RootErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || 'An unexpected error occurred' };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ElevatorOps Application Error:', error, errorInfo);
  }

  private handleResetCache = () => {
    try {
      localStorage.removeItem('elevatorops_sites_data_v1');
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100">
          <div className="max-w-md w-full bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-lg font-bold text-white">ElevatorOps Preview Notice</h2>
            <p className="text-xs text-slate-300">
              The application encountered a runtime issue during initialization:
            </p>
            <div className="bg-slate-950 p-3 rounded-lg text-left text-xs text-rose-300 font-mono overflow-x-auto border border-rose-900/40">
              {this.state.errorMessage}
            </div>
            <button
              onClick={this.handleResetCache}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-600/30"
            >
              Reset Local Database & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
