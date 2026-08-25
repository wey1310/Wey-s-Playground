import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles } from 'lucide-react';
import { AdminApiSection } from './AdminApiSection';

interface ApiManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiManagerModal: React.FC<ApiManagerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-[#FAF7EE] w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border border-[#DED5B8] overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-white/90 backdrop-blur-md border-b border-[#DED5B8] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E9F0D9] flex items-center justify-center text-[#35452E]">
                <Sparkles className="w-4 h-4 text-[#6F8F55]" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#35452E] leading-tight">
                  Quản Lý Gemini Key Pool
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">Hệ thống Round-Robin Key & Tự Động Hạ Model</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <AdminApiSection />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
