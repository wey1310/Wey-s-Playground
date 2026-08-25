import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface TeaBattleInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeaBattleInstructionsModal: React.FC<TeaBattleInstructionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-2xl bg-gradient-to-b from-[#2e1c4e] via-[#1a0f30] to-[#0d0718] border-4 border-purple-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-white select-none"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-rose-600 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <span className="text-4xl mb-1 block">🍵🎴🦋</span>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-300 uppercase tracking-wide">
              HƯỚNG DẪN: ĐẠI CHIẾN TRÀ ĐẠO
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/80">
              Phỏng theo bài huấn luyện phản xạ Kimetsu no Yaiba (Tanjiro vs Kanao)
            </p>
          </div>

          {/* Instruction steps matching Screenshot 1 */}
          <div className="space-y-3.5 text-sm sm:text-base">
            <div className="flex items-start gap-3 bg-purple-950/60 border border-purple-500/40 rounded-2xl p-3.5">
              <span className="w-7 h-7 rounded-xl bg-purple-500 text-white font-black text-sm flex items-center justify-center shrink-0">
                1
              </span>
              <p className="text-zinc-200">
                <strong className="text-amber-300">Bàn Trà Tatami:</strong> Ban đầu xuất hiện các cốc trà bằng tre được gắn số thứ tự tương ứng với số câu hỏi trong ngân hàng câu hỏi.
              </p>
            </div>

            <div className="flex items-start gap-3 bg-purple-950/60 border border-purple-500/40 rounded-2xl p-3.5">
              <span className="w-7 h-7 rounded-xl bg-purple-500 text-white font-black text-sm flex items-center justify-center shrink-0">
                2
              </span>
              <p className="text-zinc-200">
                <strong className="text-amber-300">Chọn Cốc Trà:</strong> Mỗi đội đến lượt sẽ thảo luận và chọn 1 cốc trà trên bàn thi đấu để mở câu hỏi.
              </p>
            </div>

            <div className="flex items-start gap-3 bg-purple-950/60 border border-purple-500/40 rounded-2xl p-3.5">
              <span className="w-7 h-7 rounded-xl bg-purple-500 text-white font-black text-sm flex items-center justify-center shrink-0">
                3
              </span>
              <p className="text-zinc-200">
                <strong className="text-emerald-400">Trả Lời ĐÚNG:</strong> Tanjiro nhanh tay đoạt cốc trà úp lên đầu Kanao, toàn đội chiến thắng khiêu chiến và được <span className="text-emerald-300 font-bold">+ Điểm thưởng</span> kèm video ăn mừng!
              </p>
            </div>

            <div className="flex items-start gap-3 bg-purple-950/60 border border-purple-500/40 rounded-2xl p-3.5">
              <span className="w-7 h-7 rounded-xl bg-purple-500 text-white font-black text-sm flex items-center justify-center shrink-0">
                4
              </span>
              <p className="text-zinc-200">
                <strong className="text-rose-400">Trả Lời SAI:</strong> Kanao ra tay chớp nhoáng tạt nguyên chén trà xanh vào mặt Tanjiro, đội mất điểm hoặc không nhận được điểm.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 font-black text-black text-base shadow-lg shadow-amber-500/30 transition-transform active:scale-95"
            >
              ĐÃ HIỂU - BẮT ĐẦU KHIÊU CHIẾN
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
