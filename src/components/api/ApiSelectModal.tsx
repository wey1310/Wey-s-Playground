import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Key,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Zap,
  X,
  Info
} from 'lucide-react';
import { apiManager } from '../../services/apiManager';
import { GeminiApiConfig, ApiStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface ApiSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureTitle?: string;
  onSelectAndProceed: (config: GeminiApiConfig) => void;
  onOpenFullManager?: () => void;
}

export const ApiSelectModal: React.FC<ApiSelectModalProps> = ({
  isOpen,
  onClose,
  featureTitle = 'Tính năng AI',
  onSelectAndProceed,
  onOpenFullManager,
}) => {
  const [configs, setConfigs] = useState<GeminiApiConfig[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<{ id: string; text: string; isError?: boolean } | null>(null);
  const { isAdmin } = useAuth();

  const loadData = () => {
    setConfigs(apiManager.getConfigs().filter(c => c.enabled));
    setActiveId(apiManager.getActiveApiId());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      return apiManager.subscribe(loadData);
    }
  }, [isOpen]);

  if (!isOpen) return null;

    const handleSelectAndProceed = (config: GeminiApiConfig) => {
    apiManager.setActiveApiId(config.id);
    setVerifyMessage({
      id: config.id,
      text: `✓ Đã chọn API. Bắt đầu thực thi AI...`,
    });
    setTimeout(() => {
      onSelectAndProceed(config);
      onClose();
    }, 400);
  };


  const maskEmail = (email: string) => {
    if (!email) return '---';
    const [name, domain] = email.split('@');
    if (!domain) return email;
    if (name.length <= 3) return email;
    return `${name.substring(0, 3)}***@${domain}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-[#FFFDF5] rounded-3xl shadow-2xl border-2 border-[#DCEBCB] overflow-hidden flex flex-col max-h-[85vh] wey-paper-card"
        >
          {/* Header */}
          <div className="bg-[#4F683C] px-5 py-4 text-white flex items-center justify-between shadow-xs relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
               <div className="absolute top-0 -right-10 w-40 h-40 bg-white rounded-full mix-blend-overlay blur-2xl"></div>
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2.5 bg-gradient-to-br from-[#E9D58F] to-[#d6c175] text-[#4F683C] rounded-2xl shadow-sm">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white leading-tight">
                  Chọn AI API Mạng Lưới
                </h2>
                <p className="text-xs text-[#DCEBCB] font-semibold mt-0.5">
                  Chọn một Gemini API từ cộng đồng để sử dụng {featureTitle}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="relative z-10 p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Banner Info */}
          <div className="bg-[#F8F4E8] px-5 py-3 border-b border-[#DCEBCB] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#7A6218] mt-0.5 shrink-0" />
            <p className="text-[11px] text-[#74806B] font-semibold leading-relaxed">
              Các API này được chia sẻ bởi cộng đồng Admin. Nếu một API hết hạn mức (Quota Exceeded) hoặc lỗi, hãy thử chọn API khác. Khuyến khích dùng API có màu xanh (🟢).
            </p>
          </div>

          <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-[#FDFBF7]">
            {configs.length === 0 ? (
              <div className="text-center py-12 px-4 bg-white border-2 border-dashed border-[#DCEBCB] rounded-3xl">
                <Key className="w-8 h-8 text-[#B9CDA0] mx-auto mb-3" />
                <h3 className="text-[#35452E] font-black text-sm mb-1">Không có API công khai nào</h3>
                <p className="text-xs text-[#74806B] font-semibold mb-4">
                  Hệ thống chưa có API Key nào được chia sẻ.
                </p>
                {isAdmin && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenFullManager?.();
                    }}
                    className="px-4 py-2 bg-[#4F683C] text-white rounded-xl text-xs font-black shadow-xs cursor-pointer inline-flex items-center gap-2"
                  >
                    Mở Quản lý API
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {configs.map(config => {
                  const isCurrentActive = activeId === config.id;
                  const isVerifying = verifyingId === config.id;
                  const verifyRes = verifyMessage?.id === config.id ? verifyMessage : null;

                  return (
                    <div
                      key={config.id}
                      onClick={() => !isVerifying && handleSelectAndProceed(config)}
                      className={`relative group bg-white rounded-2xl border-2 p-4 transition-all cursor-pointer ${
                        isCurrentActive
                          ? 'border-[#4F683C] ring-4 ring-[#4F683C]/10 bg-[#FFFDF5] shadow-md'
                          : 'border-[#DCEBCB] hover:border-[#B9CDA0] hover:shadow-sm'
                      } ${!config.enabled ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1.5 flex-1 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-sm text-[#35452E]">{config.name}</span>
                            
                            {isCurrentActive && (
                              <span className="px-2 py-0.5 bg-[#E9D58F] text-[#4F683C] text-[9px] uppercase font-black tracking-wide rounded-md">
                                Đang chọn
                              </span>
                            )}

                            {config.status === 'ACTIVE' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Hoạt động
                              </span>
                            )}
                            {(config.status === 'WARNING' || config.status === 'RATE_LIMITED') && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                🟡 Quá tải
                              </span>
                            )}
                            {config.status === 'QUOTA_EXCEEDED' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                🔴 Hết Quota
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 text-[11px] text-[#74806B] font-semibold flex-wrap">
                            <span className="font-mono text-[#7A6218] bg-[#F8F4E8] px-1.5 py-0.5 rounded border border-[#E9D58F]/50">
                              {isAdmin ? config.email : maskEmail(config.email)}
                            </span>
                            <span>•</span>
                            <span>{config.model}</span>
                            {config.responseTimeMs && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-0.5 text-emerald-700">
                                  <Zap className="w-3 h-3 text-amber-500" />
                                  {config.responseTimeMs}ms
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right side verification button/loader */}
                        <div className="shrink-0 flex items-center justify-end">
                          {isVerifying ? (
                            <div className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold flex items-center gap-2 border border-blue-200">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Đang kiểm tra...
                            </div>
                          ) : (
                            <button
                              className={`px-3 py-1.5 rounded-xl text-xs font-black transition border shadow-xs ${
                                isCurrentActive
                                  ? 'bg-[#4F683C] text-white border-[#3D522B]'
                                  : 'bg-[#E9F0D9] text-[#4F683C] border-[#B9CDA0] group-hover:bg-[#4F683C] group-hover:text-white'
                              }`}
                            >
                              {isCurrentActive ? 'Đang dùng' : 'Chọn API này'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Verify Message inline */}
                      <AnimatePresence>
                        {verifyRes && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="overflow-hidden"
                          >
                            <div
                              className={`text-[11px] p-2 rounded-xl font-bold flex items-center gap-1.5 ${
                                verifyRes.isError
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {verifyRes.isError ? (
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              )}
                              <span>{verifyRes.text}</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="bg-white border-t border-[#DCEBCB] p-4 flex justify-between items-center">
            {isAdmin ? (
               <button
                  onClick={() => {
                    onClose();
                    onOpenFullManager?.();
                  }}
                  className="text-xs font-black text-[#4F683C] hover:underline cursor-pointer flex items-center gap-1"
               >
                 <Key className="w-3.5 h-3.5" /> Quản lý API (Admin)
               </button>
            ) : <div></div>}
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-black text-[#74806B] hover:bg-[#F8F4E8] rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
