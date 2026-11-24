import React from 'react';
import { RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

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

  render() {
    if (this.state.hasError) {
      let friendly = 'ระบบซิงค์ข้อมูลขัดข้องชั่วคราว กรุณารีเฟรชหน้าเว็บอีกครั้ง';
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
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#FFFEFC] border border-[#E3DCD0] rounded-2xl p-6 text-center shadow-lg space-y-4">
            <h2 className="text-lg font-bold text-[#1C2621] font-display">
              ไม่สามารถดำเนินการต่อได้ชั่วคราว
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">{friendly}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#164A37] hover:bg-[#0F3527] rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              โหลดหน้าใหม่
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
