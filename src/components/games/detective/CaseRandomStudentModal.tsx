import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shuffle, 
  Sparkles, 
  X, 
  Award, 
  UserCheck, 
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { soundFx } from '../../../utils/audio';
import confetti from 'canvas-confetti';

interface CaseRandomStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: string[];
  calledStudents: string[];
  onStudentSelected: (student: string) => void;
}

export const CaseRandomStudentModal: React.FC<CaseRandomStudentModalProps> = ({
  isOpen,
  onClose,
  students,
  calledStudents,
  onStudentSelected,
}) => {
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>('---');
  const [winner, setWinner] = useState<string | null>(null);

  const availableStudents = students.filter(s => !calledStudents.includes(s));
  const pool = availableStudents.length > 0 ? availableStudents : students;

  useEffect(() => {
    if (isOpen && students.length > 0) {
      startSpin();
    } else {
      setIsSpinning(false);
      setWinner(null);
      setDisplayName('---');
    }
  }, [isOpen]);

  const startSpin = () => {
    if (students.length === 0) return;
    setIsSpinning(true);
    setWinner(null);
    soundFx.cardFlip();

    let iterations = 0;
    const maxIterations = 24;
    const speed = 70;

    const interval = setInterval(() => {
      const randIdx = Math.floor(Math.random() * pool.length);
      setDisplayName(pool[randIdx]);
      soundFx.playClick();
      iterations++;

      if (iterations >= maxIterations) {
        clearInterval(interval);
        const finalWinner = pool[Math.floor(Math.random() * pool.length)];
        setDisplayName(finalWinner);
        setWinner(finalWinner);
        setIsSpinning(false);
        onStudentSelected(finalWinner);

        soundFx.winFanfare();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }, speed);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="bg-[#1c140e] text-amber-50 max-w-lg w-full rounded-3xl border-4 border-amber-500 shadow-2xl overflow-hidden p-6 text-center relative"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-950/80 text-amber-300 text-xs font-black rounded-full border border-amber-600/50 mb-3 shadow-inner">
          <Sparkles className="w-3.5 h-3.5" />
          <span>VÒNG QUAY CHỈ ĐỊNH THÁM TỬ</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-amber-300 tracking-wide mb-1">
          🕵️ AI SẼ LÀ NGƯỜI PHÁ ÁN TIẾP THEO?
        </h2>
        <p className="text-xs text-amber-400/70 mb-6">
          Hệ thống đang ngẫu nhiên chỉ định một thám tử từ danh sách lớp học
        </p>

        {/* Roulette Display Card */}
        <div className="bg-gradient-to-b from-[#2e1d11] to-[#1a100a] p-6 sm:p-8 rounded-3xl border-3 border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.25)] relative overflow-hidden mb-6 min-h-[140px] flex flex-col items-center justify-center">
          <div className="text-4xl mb-2 animate-bounce">
            {winner ? '🌟' : '🎲'}
          </div>

          <motion.div
            key={displayName}
            initial={{ scale: 0.9, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            className={`text-2xl sm:text-4xl font-black tracking-tight ${
              winner 
                ? 'text-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]' 
                : 'text-zinc-300 animate-pulse'
            }`}
          >
            {displayName}
          </motion.div>

          {winner && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-xs font-bold text-emerald-400 flex items-center gap-1"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã chọn làm thám tử đại diện!</span>
            </motion.div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex gap-2.5 justify-center">
          <button
            type="button"
            disabled={isSpinning}
            onClick={startSpin}
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-200 border border-amber-700/60 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Quay Lại</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black rounded-xl text-xs shadow-lg transition cursor-pointer"
          >
            Vào Phá Án Ngay
          </button>
        </div>
      </motion.div>
    </div>
  );
};
