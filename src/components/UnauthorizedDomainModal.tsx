import React, { useState } from 'react';
import { ShieldAlert, Copy, Check, ExternalLink, X, UserCheck, AlertTriangle, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UnauthorizedDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain?: string;
}

export const UnauthorizedDomainModal: React.FC<UnauthorizedDomainModalProps> = ({
  isOpen,
  onClose,
  domain = typeof window !== 'undefined' ? window.location.hostname : '',
}) => {
  const [copied, setCopied] = useState(false);
  const { devLoginAsAdmin } = useAuth();
  const [selectedAdminEmail, setSelectedAdminEmail] = useState('hoangbang1310@gmail.com');

  if (!isOpen) return null;

  const currentHost = domain || (typeof window !== 'undefined' ? window.location.hostname : '');

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentHost);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleQuickAdminLogin = () => {
    if (devLoginAsAdmin) {
      devLoginAsAdmin(selectedAdminEmail);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-w-bg-card border-2 border-w-border w-full max-w-lg rounded-[28px] shadow-2xl overflow-hidden flex flex-col relative animate-scale-up">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-600 via-rose-600 to-red-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30 shrink-0">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-base leading-tight">Chưa Ủy Quyền Tên Miền (Firebase)</h3>
              <p className="text-xs text-rose-100 font-medium">Lỗi: auth/unauthorized-domain</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-w-text-main max-h-[80vh] overflow-y-auto">
          {/* Explanation */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs space-y-2">
            <div className="flex items-center gap-2 font-black text-amber-900 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Tại sao xuất hiện lỗi này?</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              Google Firebase bảo vệ ứng dụng bằng cách chỉ cho phép đăng nhập từ danh sách tên miền được phê duyệt. Tên miền hiện tại của môi trường preview chưa được thêm vào Firebase Console.
            </p>
          </div>

          {/* Current Domain Box with Copy */}
          <div className="space-y-2">
            <label className="text-xs font-black text-w-primary-dark uppercase tracking-wide flex items-center justify-between">
              <span>Tên miền cần thêm vào Firebase:</span>
              {copied && <span className="text-emerald-600 text-[11px] font-bold">Đã sao chép!</span>}
            </label>
            <div className="flex items-center gap-2 p-2.5 bg-slate-900 text-amber-300 font-mono text-xs rounded-xl border border-slate-700">
              <span className="truncate flex-1 font-bold select-all">{currentHost}</span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 transition active:scale-95 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>
          </div>

          {/* Step by step guide */}
          <div className="space-y-2.5 bg-white p-4 rounded-2xl border border-w-border">
            <h4 className="text-xs font-black text-w-primary-dark uppercase tracking-wide">
              Cách khắc phục trên Firebase Console (chỉ mất 30 giây):
            </h4>
            <ol className="space-y-2 text-xs text-w-primary-dark list-decimal list-inside font-semibold leading-relaxed">
              <li>
                Truy cập{' '}
                <a
                  href="https://console.firebase.google.com/project/wey-playground/authentication/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline font-bold inline-flex items-center gap-1 hover:text-blue-700"
                >
                  Firebase Console Settings <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Chọn tab <strong>Authorized domains (Miền được ủy quyền)</strong></li>
              <li>Bấm nút <strong>Add domain (Thêm miền)</strong></li>
              <li>Dán tên miền <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-amber-900">{currentHost}</code> và bấm <strong>Save</strong></li>
              <li>Quay lại đây và bấm <strong>Đăng nhập Google</strong>!</li>
            </ol>
          </div>

          {/* Quick Access / Teacher Dev Login option */}
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 font-black text-emerald-900 text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Đăng nhập nhanh để trải nghiệm / Quản trị ngay:</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Bạn có thể đăng nhập tức thì với tư cách Quản Trị Viên (Admin) để kiểm tra tất cả tính năng, tạo câu hỏi AI, và chơi không giới hạn mà không bị chặn.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <select
                value={selectedAdminEmail}
                onChange={e => setSelectedAdminEmail(e.target.value)}
                className="bg-white border border-emerald-300 text-xs font-bold text-emerald-900 rounded-xl px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="hoangbang1310@gmail.com">hoangbang1310@gmail.com (Super Admin)</option>
                <option value="pthngan1310@gmail.com">pthngan1310@gmail.com (Admin)</option>
                <option value="giaovien@demo.edu.vn">giaovien@demo.edu.vn (Giáo viên Demo)</option>
              </select>
              <button
                onClick={handleQuickAdminLogin}
                className="px-4 py-2 bg-w-primary-dark hover:bg-[#3D522E] text-[#E9D58F] font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 shrink-0"
              >
                <UserCheck className="w-4 h-4 text-[#E9D58F]" />
                <span>Vào Ngay (Admin)</span>
              </button>
            </div>
          </div>

          {/* Close / Action button */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 bg-[#E2EED3] hover:bg-[#D4E4C1] text-w-primary-hover font-black text-xs rounded-[16px] transition border border-w-accent-border"
            >
              Đã hiểu, đóng cửa sổ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
