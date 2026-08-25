import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Flame, Sparkles } from 'lucide-react';
import { BowlingTeamState } from './bowlingTypes';

interface BowlingScoreboardProps {
  teams: BowlingTeamState[];
  activeTeamIndex: number;
  currentFrame: number;
}

export const BowlingScoreboard: React.FC<BowlingScoreboardProps> = ({
  teams,
  activeTeamIndex,
  currentFrame,
}) => {
  return (
    <div className="w-full bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800 p-3 sm:p-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-3">
        {teams.map((team, idx) => {
          const isActive = idx === activeTeamIndex;

          return (
            <motion.div
              key={team.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{
                scale: isActive ? 1.04 : 1,
                borderColor: isActive ? '#f59e0b' : '#3f3f46',
              }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all min-w-[200px] flex-1 max-w-[260px] ${
                isActive
                  ? 'bg-zinc-900/95 border-amber-400 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/30'
                  : 'bg-zinc-900/70 border-zinc-800'
              }`}
            >
              {/* Avatar */}
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border"
                style={{ backgroundColor: `${team.color || '#f59e0b'}20`, borderColor: team.color || '#f59e0b' }}
              >
                {team.avatar || '🎳'}
              </div>

              {/* Team Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-black text-xs sm:text-sm text-zinc-100 truncate">
                    {team.name}
                  </span>
                  <span className="text-xs font-black text-amber-400 shrink-0 flex items-center gap-0.5">
                    <Trophy className="w-3.5 h-3.5" /> {team.totalScore}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                  <span>💥 Đổ: <strong>{team.totalPinsKnocked}</strong> pin</span>
                  {team.strikeCount > 0 && (
                    <span className="text-amber-400 font-bold flex items-center gap-0.5">
                      <Flame className="w-3 h-3" /> {team.strikeCount} Strike
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
