import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled UI Error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-rose-800/50 rounded-2xl p-6 text-center shadow-2xl shadow-rose-950/40">
            <div className="w-14 h-14 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Đã xảy ra lỗi giao diện</h2>
            <p className="text-xs text-slate-400 mb-4">
              Hệ thống đã tự động ghi nhận lỗi. Bạn có thể nhấn nút bên dưới để tải lại ứng dụng.
            </p>
            {this.state.error && (
              <pre className="text-[11px] bg-slate-950 p-3 rounded-lg text-rose-300 text-left overflow-x-auto mb-5 border border-slate-800 max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
