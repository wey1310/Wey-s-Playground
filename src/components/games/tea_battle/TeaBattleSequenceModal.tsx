import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { BattleTeamState, TeaCup } from './teaBattleTypes';

interface TeaBattleSequenceModalProps {
  isOpen: boolean;
  isWon: boolean;
  cup: TeaCup;
  team: BattleTeamState;
  pointsDelta: number;
  onContinue: () => void;
}

type SequencePhase =
  | 'idle'
  | 'battle'
  | 'win1'
  | 'win2'
  | 'lose_gif'
  | 'lose_png1'
  | 'lose_png2'
  | 'complete';

export const TeaBattleSequenceModal: React.FC<TeaBattleSequenceModalProps> = ({
  isOpen,
  isWon,
  cup,
  team,
  pointsDelta,
  onContinue,
}) => {
  const [phase, setPhase] = useState<SequencePhase>('idle');
  const [runId, setRunId] = useState(0);

  // Constants for durations
  const BATTLE_LOOP_DURATION = 1500; // estimated ms per loop of battle.gif
  const WIN1_DURATION = 2000;
  const WIN2_DURATION = 3000;
  const LOSE_GIF_DURATION = 2500;
  const LOSE_PNG1_DURATION = 1500;
  const LOSE_PNG2_DURATION = 2000;

  useEffect(() => {
    if (isOpen) {
      setRunId(Date.now());
      setPhase('battle');
      if (isWon) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } else {
      setPhase('idle');
    }
  }, [isOpen, isWon]);

  useEffect(() => {
    if (!isOpen || phase === 'idle' || phase === 'complete') return;

    let timeoutId: NodeJS.Timeout;

    if (phase === 'battle') {
      const loops = Math.random() > 0.5 ? 2 : 1;
      const duration = loops * BATTLE_LOOP_DURATION;
      timeoutId = setTimeout(() => {
        if (isWon) {
          setPhase('win1');
        } else {
          // Randomize 1 trong 2 kiểu thất bại theo yêu cầu:
          // Kiểu 1: battle => lose.png => lose1.png hiệu ứng hất trà
          // Kiểu 2: battle => lose.gif
          const pickVariant = Math.random() < 0.5 ? 'type1_png_sequence' : 'type2_gif';
          if (pickVariant === 'type2_gif') {
            setPhase('lose_gif');
          } else {
            setPhase('lose_png1');
          }
        }
      }, duration);
    } else if (phase === 'win1') {
      timeoutId = setTimeout(() => {
        setPhase('win2');
      }, WIN1_DURATION);
    } else if (phase === 'win2') {
      timeoutId = setTimeout(() => {
        setPhase('complete');
      }, WIN2_DURATION);
    } else if (phase === 'lose_gif') {
      // Kiểu 2: lose.gif
      timeoutId = setTimeout(() => {
        setPhase('complete');
      }, LOSE_GIF_DURATION);
    } else if (phase === 'lose_png1') {
      // Kiểu 1 - Bước 1: lose.png
      timeoutId = setTimeout(() => {
        setPhase('lose_png2');
      }, LOSE_PNG1_DURATION);
    } else if (phase === 'lose_png2') {
      // Kiểu 1 - Bước 2: lose1.png hiệu ứng hất trà
      timeoutId = setTimeout(() => {
        setPhase('complete');
      }, LOSE_PNG2_DURATION);
    }

    return () => clearTimeout(timeoutId);
  }, [phase, isOpen, isWon]);

  if (!isOpen) return null;

  const renderVisual = () => {
    switch (phase) {
      case 'battle':
        return (
          <img
            key={`battle-${runId}`}
            src="/assets/games/tea_battle/battle.gif"
            alt="Battle"
            className="w-full max-h-[60vh] object-contain rounded-2xl shadow-xl"
          />
        );
      case 'win1':
        return (
          <motion.img
            key={`win1-${runId}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            src="/assets/games/tea_battle/win1.png"
            alt="Win 1"
            className="w-full max-h-[60vh] object-contain rounded-2xl shadow-xl"
          />
        );
      case 'win2':
        return (
          <img
            key={`win2-${runId}`}
            src="/assets/games/tea_battle/win2.gif"
            alt="Win 2"
            className="w-full max-h-[60vh] object-contain rounded-2xl shadow-xl"
          />
        );
      case 'lose_gif':
        return (
          <img
            key={`lose_gif-${runId}`}
            src="/assets/games/tea_battle/lose.gif"
            alt="Lose"
            className="w-full max-h-[60vh] object-contain rounded-2xl shadow-xl"
          />
        );
      case 'lose_png1':
        return (
          <motion.img
            key={`lose_png1-${runId}`}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            src="/assets/games/tea_battle/lose.png"
            alt="Lose 1"
            className="w-full max-h-[60vh] object-contain rounded-2xl shadow-xl"
          />
        );
      case 'lose_png2':
        return (
          <motion.div className="relative w-full max-h-[60vh] flex items-center justify-center">
            <img
              src="/assets/games/tea_battle/lose.png"
              alt="Lose Base"
              className="w-full max-h-[60vh] object-contain rounded-2xl shadow-xl"
            />
            <motion.img
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              src="/assets/games/tea_battle/lose1.png"
              alt="Lose Splash"
              className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-80"
            />
          </motion.div>
        );
      case 'complete':
        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center p-8 bg-zinc-900/80 rounded-2xl border-2 border-zinc-700"
          >
            <h2 className={`text-4xl sm:text-5xl font-black uppercase mb-4 ${isWon ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isWon ? 'CHIẾN THẮNG!' : 'THẤT BẠI!'}
            </h2>
            <p className="text-xl text-zinc-300">
              {team.name} {isWon ? 'nhận được' : 'bị trừ'} {Math.abs(pointsDelta)} điểm
            </p>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center">
        {/* Visual Layer */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full flex items-center justify-center"
          >
            {renderVisual()}
          </motion.div>
        </AnimatePresence>

        {/* HUD Overlay / Controls */}
        <div className="absolute bottom-[-60px] left-0 right-0 flex justify-center gap-4">
          <button
            type="button"
            onClick={() => setPhase('complete')}
            className={`px-6 py-2 rounded-xl font-black text-white shadow-lg transition-all ${
              phase === 'complete' ? 'hidden' : 'bg-zinc-700 hover:bg-zinc-600'
            }`}
          >
            SKIP ANIMATION
          </button>
          {phase === 'complete' && (
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              type="button"
              onClick={onContinue}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-black text-black text-lg shadow-xl hover:scale-105 transition-transform"
            >
              TIẾP TỤC
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};
