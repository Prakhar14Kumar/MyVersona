/**
 * Global Error Boundary
 * Wraps the entire React component tree. If any hook or component throws a fatal error,
 * this catches the UI thread crash and displays a smooth recovery interface.
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught DOM Exception:", error, errorInfo);
  }

  private handleReset = () => {
    // A hard reset clears stale cached state completely.
    localStorage.removeItem('versona-persona-storage');
    window.location.href = '/';
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm text-center border-t-8 border-t-indigo-500">
            <AlertTriangle size={64} className="text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-black text-gray-900 mb-2">Whoops.</h1>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Versona encountered a critical memory glitch. We just dispatched an automated report.
            </p>
            
            <button 
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg transition"
            >
              <RefreshCcw size={20} />
              Reboot App
            </button>
            <p className="text-xs text-gray-400 mt-6 opacity-50">
              Debug: {this.state.errorMsg.slice(0, 50)}...
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}