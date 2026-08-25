import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SlidersHorizontal, RotateCcw, SkipForward, ChevronDown, X, Trophy } from 'lucide-react';
import { BowlingTeamState } from './bowlingTypes';
import { soundFx } from '../../../utils/audio';

interface BowlingTeacherPanelProps {
  teams: BowlingTeamState[];
  onReThrow: () => void;
  onSkipTurn: () => void;
  onAdjustScore: (teamId: string, delta: number) => void;
  onResetGame: () => void;
}

export const BowlingTeacherPanel: React.FC<BowlingTeacherPanelProps> = ({
  teams,
  onReThrow,
  onSkipTurn,
  onAdjustScore,
  onResetGame,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="bg-zinc-900 border border-zinc-700 rounded-3xl p-4 sm:p-5 shadow-2xl mb-3 w-[320px] sm:w-[380px] max-h-[80vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <h4 className="font-black text-sm text-zinc-100 uppercase tracking-wider">
                  Điều Khiển Bowling (GV)
                </h4>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => {
                  soundFx.playClick();
                  onReThrow();
                }}
                className="py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Cho Ném Lại</span>
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  onSkipTurn();
                }}
                className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Bỏ Qua Lượt</span>
              </button>
            </div>

            {/* Score Adjustments */}
            <div className="space-y-2">
              <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                Cộng / Trừ Điểm Đội
              </span>
              {teams.map(team => (
                <div
                  key={team.id}
                  className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{team.avatar}</span>
                    <span className="font-bold text-xs text-zinc-200 truncate">{team.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 bg-zinc-900 px-2 py-1 rounded-xl border border-zinc-800">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <button
                      onClick={() => onAdjustScore(team.id, -5)}
                      className="text-[11px] text-zinc-400 hover:text-white px-1 font-bold"
                    >
                      -5
                    </button>
                    <span className="text-xs font-bold text-amber-300">{team.totalScore}</span>
                    <button
                      onClick={() => onAdjustScore(team.id, 5)}
                      className="text-[11px] text-zinc-400 hover:text-white px-1 font-bold"
                    >
                      +5
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                if (confirm('Bạn có chắc chắn muốn chơi lại toàn bộ ván Bowling?')) {
                  onResetGame();
                }
              }}
              className="w-full mt-4 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 text-xs font-bold rounded-xl transition-colors"
            >
              Chơi Lại Toàn Bộ
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 shadow-xl text-zinc-300 hover:text-amber-400 text-xs font-black flex items-center gap-2 transition-all"
      >
        <SlidersHorizontal className="w-4 h-4 text-amber-400" />
        <span>Điều Khiển GV</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};
