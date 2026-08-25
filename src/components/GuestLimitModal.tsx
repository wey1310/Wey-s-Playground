import React from 'react';
import { X, Sparkles, LogIn, Lock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface GuestLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestId: string;
  playsUsed: number;
  maxPlays: number;
}

export const GuestLimitModal: React.FC<GuestLimitModalProps> = ({
  isOpen,
  onClose,
  guestId,
  playsUsed,
  maxPlays,
}) => {
  const { loginWithGoogle } = useAuth();

  if (!isOpen) return null;

  const handleLogin = async () => {
    const success = await loginWithGoogle();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FFFDF5] border-2 border-[#DED5B8] w-full max-w-md rounded-[28px] shadow-2xl overflow-hidden flex flex-col relative">
        {/* Top Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-base leading-tight">Đã Hết Lượt Chơi Hôm Nay</h3>
              <p className="text-xs text-rose-100 font-medium">Giới hạn 3 lượt/ngày cho tài khoản khách</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-[#35452E]">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-center">
            <div className="text-2xl font-black text-amber-900">
              {playsUsed}/{maxPlays} Lượt
            </div>
            <p className="text-xs font-bold text-amber-800">
              Bạn đã sử dụng hết số lượt chơi miễn phí trong ngày hôm nay.
            </p>
            <div className="text-[11px] font-mono text-amber-700 bg-white/80 py-1 px-2.5 rounded-lg inline-block border border-amber-200">
              Mã khách (Guest ID): <span className="font-bold">{guestId}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase text-[#4F683C] tracking-wide">
              Đăng nhập Google để nhận quyền lợi:
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-xs font-bold text-[#35452E]">
                <CheckCircle2 className="w-4 h-4 text-[#6F8F55] shrink-0" />
                <span>Chơi KHÔNG GIỚI HẠN tất cả các mini game</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-[#35452E]">
                <CheckCircle2 className="w-4 h-4 text-[#6F8F55] shrink-0" />
                <span>Tạo và lưu trữ ngân hàng câu hỏi lên đám mây</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-[#35452E]">
                <CheckCircle2 className="w-4 h-4 text-[#6F8F55] shrink-0" />
                <span>Tạo câu hỏi tự động bằng AI siêu tốc</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-[#DED5B8]">
            <button
              onClick={handleLogin}
              className="w-full py-3.5 px-4 bg-[#6F8F55] hover:bg-[#5F7E4B] text-white font-black text-sm rounded-[18px] shadow-[0_4px_16px_rgba(111,143,85,0.35)] transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập Ngay Bằng Google</span>
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs font-bold text-[#74806B] hover:text-[#35452E] transition"
            >
              Để sau (Quay lại trang chủ)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
