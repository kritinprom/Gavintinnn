import React from 'react';
import { RefreshCw, RotateCcw, ShieldAlert } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

const SAFE_RESET_KEYS = [
  'centro_rama2_filters_v1',
  'centro_rama2_active_tab_v1',
  'centro_rama2_overlay_mode_v1',
  'centro_rama2_selected_plot_v1',
];

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application Error:', error, info);
  }

  handleResetUiAndContinue = () => {
    try {
      for (const key of SAFE_RESET_KEYS) {
        localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      let friendly = 'ระบบซิงค์ข้อมูลขัดข้องชั่วคราว สามารถกดลองเข้าสู่หน้าเว็บต่อหรือโหลดหน้าใหม่ได้';
      try {
        const parsed = JSON.parse(this.state.message) as { error?: string };
        if (parsed.error?.includes('Missing or insufficient permissions')) {
          friendly =
            'บัญชีนี้ยังไม่มีสิทธิ์แก้ไขข้อมูลส่วนที่ถูกล็อก หรือกรุณาตรวจสอบการเข้าสู่ระบบใหม่อีกครั้ง';
        }
      } catch {
        // plain error string
      }

      return (
        <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#FFFEFC] border border-[#E4DFD3] rounded-3xl p-7 text-center shadow-[0_14px_40px_rgba(20,25,31,0.1)] space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-[#14191F] border border-[#C59B48]/40 text-[#E5C57B] flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-[#14191F] font-display">
                ไม่สามารถดำเนินการต่อได้ชั่วคราว
              </h2>
              <p className="text-sm text-zinc-600 leading-relaxed">{friendly}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={this.handleResetUiAndContinue}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#14191F] bg-[#E5C57B] hover:bg-[#D5B263] rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className="w-4 h-4" />
                รีเซ็ตแคชหน้าจอและเข้าใช้งานต่อ
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#14191F] hover:bg-[#232B36] rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4 text-[#E5C57B]" />
                โหลดหน้าใหม่
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
