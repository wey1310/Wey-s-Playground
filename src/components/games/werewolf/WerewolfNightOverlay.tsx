import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sparkles, Shield, Eye, Skull, ArrowRight } from 'lucide-react';

interface WerewolfNightOverlayProps {
  nightNumber: number;
  onComplete: () => void;
  autoProgress?: boolean;
}

export const WerewolfNightOverlay: React.FC<WerewolfNightOverlayProps> = ({
  nightNumber,
  onComplete,
  autoProgress = true
}) => {
  const [step, setStep] = useState<number>(0);

  const narrativeSteps = [
    'Ngôi làng cổ kính chìm dần vào bóng tối tĩnh mịch...',
    'Ánh trăng máu rọi chiếu qua từng mái nhà gỗ im lìm...',
    'Những thế lực bóng đêm đang âm thầm toan tính trong làn sương mù...',
    'Bùa hộ mệnh kỳ bí và quả cầu pha lê khẽ phát sáng trong đêm...',
    'Tiếng bước chân bí ẩn dần tan biến khi màn đêm khép lại...'
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 1200);
    const timer2 = setTimeout(() => setStep(2), 2400);
    const timer3 = setTimeout(() => setStep(3), 3600);
    const timer4 = setTimeout(() => setStep(4), 4800);
    const timerEnd = setTimeout(() => {
      onComplete();
    }, 6200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timerEnd);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-[#050811]/95 backdrop-blur-md text-w-text-main select-none overflow-hidden"
    >
      {/* Mystical Moon and Fog Backdrop */}
      <div className="relative flex flex-col items-center max-w-lg w-full text-center">
        {/* Glowing Moon */}
        <motion.div
          animate={{
            scale: [1, 1.06, 1],
            boxShadow: [
              '0 0 30px rgba(165, 180, 252, 0.3)',
              '0 0 70px rgba(165, 180, 252, 0.6)',
              '0 0 30px rgba(165, 180, 252, 0.3)'
            ]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-400 flex items-center justify-center mb-6 text-indigo-950 shadow-2xl relative"
        >
          <Moon className="w-16 h-16 sm:w-20 sm:h-20 text-indigo-900 fill-indigo-800/30" />
          <div className="absolute top-3 right-4 w-4 h-4 rounded-full bg-indigo-300/60 blur-xs" />
          <div className="absolute bottom-5 left-5 w-6 h-6 rounded-full bg-indigo-300/40 blur-xs" />
        </motion.div>

        {/* Night Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-w-bg-alt text-indigo-300 border border-indigo-700/60 mb-2 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Màn Đêm Ma Sói</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-purple-200 tracking-tight">
            🌙 ĐÊM THỨ {nightNumber}
          </h2>
        </motion.div>

        {/* Narrative Rolling Text */}
        <div className="h-16 flex items-center justify-center px-4 mb-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-sm sm:text-base font-semibold text-indigo-200/90 leading-relaxed italic"
            >
              "{narrativeSteps[step] || narrativeSteps[0]}"
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Animated Action Icons Hint */}
        <div className="flex items-center justify-center gap-4 py-3 px-6 rounded-2xl bg-w-bg-alt border border-indigo-800/30 text-indigo-400 text-xs font-bold mb-6">
          <span className="flex items-center gap-1 opacity-70">
            <Shield className="w-4 h-4 text-emerald-400" /> Bảo vệ
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 opacity-70">
            <Eye className="w-4 h-4 text-cyan-400" /> Tiên tri
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 opacity-70">
            <Skull className="w-4 h-4 text-red-400" /> Ma sói
          </span>
        </div>

        {/* Skip button if needed */}
        <button
          onClick={onComplete}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-800 text-indigo-200 text-xs font-bold border border-indigo-700/50 transition cursor-pointer"
        >
          <span>Chuyển sang bình minh ngay</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};
