import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Zap,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import { apiManager } from '../../services/apiManager';
import { GeminiApiConfig, KeyPoolPublicState } from '../../types';

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
  const [poolState, setPoolState] = useState<KeyPoolPublicState>(apiManager.getPoolState());

  useEffect(() => {
    if (isOpen) {
      setPoolState(apiManager.getPoolState());
      return apiManager.subscribe(() => {
        setPoolState(apiManager.getPoolState());
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalKeys = poolState.totalConfigured || poolState.keys.length;

  const handleProceed = () => {
    const active = apiManager.getActiveApi();
    if (active) {
      onSelectAndProceed(active);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-w-bg-card rounded-3xl shadow-2xl border-2 border-w-accent-muted overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="bg-w-primary-dark px-5 py-4 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-[#E9D58F] to-[#d6c175] text-w-primary-dark rounded-2xl shadow-sm">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h2 className="text-base font-black text-white leading-tight">
                  Mạng Lưới Gemini Key Pool
                </h2>
                <p className="text-xs text-w-accent-muted font-medium mt-0.5">
                  Tự động xoay vòng cho: {featureTitle}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            <div className="bg-w-bg-alt p-4 rounded-2xl border border-w-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-w-text-main uppercase tracking-wider">Trạng Thái Hệ Thống</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {totalKeys} Key Sẵn Sàng
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hệ thống đang sử dụng cơ chế <strong>Round-Robin Key Pool</strong> trên Vercel kết hợp <strong>Tự Động Hạ Model</strong>, bạn không cần phải chọn API key thủ công.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-white rounded-xl border border-w-border">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Cấp Model Mặc Định</span>
                <span className="font-black text-purple-800 text-xs mt-0.5 block">Cấp 1: Gemini 3.7 Flash</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-w-border">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Cơ Chế Dự Phòng</span>
                <span className="font-black text-emerald-700 text-xs mt-0.5 block">Cách ly 429 & Xoay Key</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={handleProceed}
                className="w-full sm:flex-1 py-3 bg-w-primary hover:bg-w-primary-hover text-white rounded-xl font-black text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Tiếp Tục Sử Dụng {featureTitle}</span>
              </button>

              {onOpenFullManager && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenFullManager();
                  }}
                  className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Xem Key Pool
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
