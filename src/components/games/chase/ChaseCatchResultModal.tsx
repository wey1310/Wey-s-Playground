import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ArrowRight, Sparkles, XCircle, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChaseTeamState, RoomLocation } from './chaseTypes';

interface ChaseCatchResultModalProps {
  isOpen: boolean;
  isCaught: boolean;
  team: ChaseTeamState;
  location: RoomLocation;
  bonusPoints: number;
  totalPoints: number;
  onContinue: () => void;
}

export const ChaseCatchResultModal: React.FC<ChaseCatchResultModalProps> = ({
  isOpen,
  isCaught,
  team,
  location,
  bonusPoints,
  totalPoints,
  onContinue,
}) => {
  useEffect(() => {
    if (isOpen && isCaught) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen, isCaught]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/70 backdrop-blur-sm backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          className={`relative w-full max-w-2xl rounded-3xl p-6 sm:p-8 border-4 shadow-2xl overflow-hidden text-center select-none ${
            isCaught
              ? 'bg-gradient-to-b from-[#1c3022] via-[#0f2115] to-[#07130a] border-yellow-400 shadow-yellow-500/30'
              : 'bg-gradient-to-b from-[#2e1c25] via-[#1f1017] to-[#12080d] border-purple-500/60 shadow-purple-500/20'
          }`}
        >
          {/* Header */}
          <div className="mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              className="inline-flex items-center justify-center text-5xl sm:text-6xl mb-2"
            >
              {isCaught ? '🐭🎉🐱' : '💨🐶🐱'}
            </motion.div>

            <h2
              className={`text-2xl sm:text-4xl font-black tracking-wider uppercase drop-shadow-md ${
                isCaught ? 'text-yellow-300' : 'text-purple-300'
              }`}
            >
              {isCaught ? 'BẮT TRÚNG CHUỘT JERRY!' : 'CHƯA TÌM THẤY JERRY!'}
            </h2>

            <p className="text-sm sm:text-base font-bold text-zinc-200 mt-1">
              Đội <span className="text-yellow-300">{team.name}</span> đã kiểm tra:{' '}
              <span className="text-w-text-main font-extrabold">{location.name}</span>
            </p>
          </div>

          {/* Action Scene Animation Box */}
          <div className="relative w-full max-h-[260px] aspect-video rounded-2xl overflow-hidden border-2 border-zinc-700/80 bg-white/70 backdrop-blur-sm mx-auto mb-6 flex flex-col items-center justify-center p-6 shadow-inner">
            {isCaught ? (
              <div className="flex flex-col items-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="flex items-center gap-6 text-6xl mb-3"
                >
                  <span>🐱</span>
                  <span className="text-4xl">⚡🧀</span>
                  <span>🐭!</span>
                </motion.div>
                <div className="bg-emerald-950/80 border border-emerald-400/50 rounded-xl px-4 py-2 text-emerald-200 text-xs sm:text-sm font-bold">
                  Jerry kinh ngạc nhảy ra khỏi {location.shortName}! Tom đã tóm gọn thành công!
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <motion.div
                  animate={{ x: [-4, 4, -4] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="flex items-center gap-6 text-6xl mb-3"
                >
                  <span>🐱🔍</span>
                  <span className="text-4xl">💨</span>
                  {location.isSpike ? <span>🐶💢</span> : <span>📭</span>}
                </motion.div>
                <div className="bg-purple-950/80 border border-purple-400/50 rounded-xl px-4 py-2 text-purple-200 text-xs sm:text-sm font-bold">
                  {location.isSpike
                    ? 'Chạm vào chú chó Spike làm Spike thức giấc gầm gừ!'
                    : `Không thấy dấu vết của Jerry tại ${location.shortName}!`}
                </div>
              </div>
            )}

            {/* Score Multiplier Badge */}
            <div
              className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full font-black text-sm sm:text-base border shadow-lg ${
                isCaught
                  ? 'bg-yellow-500 text-black border-yellow-200 animate-bounce'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-600'
              }`}
            >
              {isCaught ? `YOU WON x2 POINTS (+${totalPoints} PTS)!` : `GIỮ NGUYÊN ĐIỂM (+${totalPoints} PTS)`}
            </div>
          </div>

          {/* Continue Button */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              id="chase-modal-continue-btn"
              onClick={onContinue}
              className="px-8 py-3.5 rounded-2xl font-black text-base sm:text-lg text-black bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 border-2 border-yellow-200"
            >
              <span>TIẾP TỤC VÒNG CHƠI</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
