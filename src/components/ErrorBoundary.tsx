import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  // @ts-ignore
  props: Props;
  // @ts-ignore
  state: State = {
    hasError: false,
    error: null,
  };
  // @ts-ignore
  setState: (state: Partial<State>) => void;

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled runtime error in component:', error, errorInfo);
  }

  public handleReset = () => {
    if (typeof this.setState === 'function') {
      this.setState({ hasError: false, error: null });
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-amber-400 mb-2">Đã xảy ra sự cố nhỏ!</h2>
            <p className="text-xs text-slate-400 font-medium mb-6 leading-relaxed">
              Ứng dụng vừa gặp lỗi xử lý dữ liệu. Bạn có thể bấm nút dưới đây để tải lại trang hoặc khôi phục trạng thái nhanh chóng.
            </p>
            {this.state.error && (
              <div className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-rose-400 font-mono text-left overflow-x-auto mb-6 max-h-24">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" /> Tải Lại Trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
