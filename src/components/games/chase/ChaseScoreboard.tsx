import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Flame, Zap, Award } from 'lucide-react';
import { ChaseTeamState } from './chaseTypes';

interface ChaseScoreboardProps {
  teams: ChaseTeamState[];
  currentTeamIndex: number;
  onAdjustScore?: (teamId: string, delta: number) => void;
}

export const ChaseScoreboard: React.FC<ChaseScoreboardProps> = ({
  teams,
  currentTeamIndex,
  onAdjustScore,
}) => {
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-5xl mx-auto mb-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {teams.map((team, idx) => {
          const isCurrentTurn = idx === currentTeamIndex;
          const rank = sortedTeams.findIndex(t => t.id === team.id) + 1;

          return (
            <motion.div
              key={team.id}
              animate={{
                scale: isCurrentTurn ? 1.03 : 1,
                borderColor: isCurrentTurn ? '#f59e0b' : 'rgba(255,255,255,0.1)',
              }}
              className={`relative rounded-2xl p-3 sm:p-4 border-2 transition-all backdrop-blur-md ${
                isCurrentTurn
                  ? 'bg-purple-950/50 shadow-lg shadow-purple-500/20 ring-2 ring-purple-400/40'
                  : 'bg-zinc-900/60'
              }`}
            >
              {isCurrentTurn && (
                <div className="absolute -top-2.5 right-3 bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-md animate-pulse">
                  <span>LƯỢT NÀY</span>
                </div>
              )}

              {/* Team Info Header */}
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black text-white shadow-inner"
                  style={{ backgroundColor: team.color || '#3b82f6' }}
                >
                  {team.avatar || '🐱'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-black text-zinc-100 truncate">
                    {team.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-bold">
                    <span>Hạng #{rank}</span>
                    {team.streak > 1 && (
                      <span className="text-yellow-400 flex items-center gap-0.5">
                        <Flame className="w-3 h-3 fill-yellow-400" /> {team.streak}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Score Display & Catch count */}
              <div className="flex items-end justify-between pt-1 border-t border-zinc-800/80">
                <div>
                  <span className="text-[10px] text-zinc-400 block font-bold">ĐIỂM SỐ</span>
                  <span className="text-lg sm:text-2xl font-black text-yellow-300">
                    {team.score}
                  </span>
                </div>

                <div className="text-right text-[10px] text-zinc-300 font-bold flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/30 px-2 py-1 rounded-lg">
                  <span>🐭 x{team.jerryCatchesCount}</span>
                </div>
              </div>

              {/* Teacher Quick Point Adjust Buttons */}
              {onAdjustScore && (
                <div className="flex items-center justify-end gap-1 mt-2 pt-1 border-t border-zinc-800/50">
                  <button
                    type="button"
                    title="Trừ 5 điểm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdjustScore(team.id, -5);
                    }}
                    className="w-5 h-5 rounded bg-zinc-800 hover:bg-rose-600 text-zinc-300 hover:text-white text-xs font-black flex items-center justify-center transition-colors"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    title="Cộng 10 điểm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdjustScore(team.id, 10);
                    }}
                    className="w-5 h-5 rounded bg-zinc-800 hover:bg-emerald-600 text-zinc-300 hover:text-white text-xs font-black flex items-center justify-center transition-colors"
                  >
                    +10
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
