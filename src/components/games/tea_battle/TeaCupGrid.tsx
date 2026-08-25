import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Trophy, Check, X, Flame } from 'lucide-react';
import { TeaCup, BattleTeamState } from './teaBattleTypes';

interface TeaCupGridProps {
  teaCups: TeaCup[];
  selectedCup: TeaCup | null;
  activeTeam: BattleTeamState;
  onSelectCup: (cupId: number) => void;
  disabled?: boolean;
}

export const TeaCupGrid: React.FC<TeaCupGridProps> = ({
  teaCups,
  selectedCup,
  activeTeam,
  onSelectCup,
  disabled = false,
}) => {
  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {/* Tatami Floor Frame */}
      <div className="relative bg-[#2d3a24]/90 border-4 border-[#8b5a2b] rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Tatami straw line texture overlay */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, #859900 0px, #859900 2px, transparent 2px, transparent 12px),
                             repeating-linear-gradient(90deg, #b58900 0px, #b58900 2px, transparent 2px, transparent 24px)`,
          }}
        />

        {/* Dojo Header / Status */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#8b5a2b]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-xl shadow-inner">
              🍵
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-amber-200 tracking-wide flex items-center gap-2">
                BÀN TRÀ THI ĐẤU ĐIỆP PHỦ
                <span className="text-xs bg-emerald-900/80 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                  {teaCups.filter(c => c.status === 'unopened').length} Cốc Còn Lại
                </span>
              </h3>
              <p className="text-xs text-amber-100/70">
                Lượt thi đấu của <span className="font-bold text-amber-300">{activeTeam.name}</span> — Hãy chọn 1 cốc trà!
              </p>
            </div>
          </div>

          {/* Tanjiro & Kanao mini emblem */}
          <div className="flex items-center gap-2 text-xs font-bold text-amber-200/90 bg-black/40 px-3 py-1.5 rounded-2xl border border-amber-500/30">
            <span className="flex items-center gap-1">
              <span className="text-base">🎴</span> Tanjiro (Đội bạn)
            </span>
            <span className="text-amber-400 font-black">VS</span>
            <span className="flex items-center gap-1">
              <span className="text-base">🦋</span> Kanao (Đối thủ)
            </span>
          </div>
        </div>

        {/* Grid of Tea Cups (Responsive: 4 to 8 columns) */}
        <div className="relative z-10 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 sm:gap-3.5 max-h-[58vh] overflow-y-auto pr-1 custom-scrollbar">
          {teaCups.map((cup) => {
            const isUnopened = cup.status === 'unopened';
            const isWon = cup.status === 'won';
            const isLost = cup.status === 'lost';
            const isSelected = selectedCup?.id === cup.id;

            return (
              <motion.button
                key={cup.id}
                type="button"
                id={`teacup-${cup.id}`}
                disabled={!isUnopened || disabled}
                whileHover={isUnopened && !disabled ? { scale: 1.08, y: -4 } : {}}
                whileTap={isUnopened && !disabled ? { scale: 0.95 } : {}}
                onClick={() => isUnopened && !disabled && onSelectCup(cup.id)}
                className={`relative group rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-between aspect-[3/4] border-2 transition-all select-none shadow-md ${
                  isSelected
                    ? 'bg-amber-500/30 border-amber-300 ring-4 ring-amber-400/50 shadow-amber-500/30'
                    : isWon
                    ? 'bg-emerald-950/70 border-emerald-500/60 opacity-80 cursor-not-allowed'
                    : isLost
                    ? 'bg-rose-950/70 border-rose-500/60 opacity-80 cursor-not-allowed'
                    : 'bg-gradient-to-b from-[#5c4033] to-[#3a271d] border-[#a07855] hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/20 cursor-pointer'
                }`}
              >
                {/* Status Badge on Top */}
                <div className="w-full flex items-center justify-between text-[10px] font-black px-1">
                  <span
                    className={`rounded-full px-1.5 py-0.2 ${
                      isWon
                        ? 'bg-emerald-500 text-white'
                        : isLost
                        ? 'bg-rose-500 text-white'
                        : 'bg-black/50 text-amber-200'
                    }`}
                  >
                    #{cup.id}
                  </span>
                  {isWon && <Check className="w-3.5 h-3.5 text-emerald-300 font-bold" />}
                  {isLost && <X className="w-3.5 h-3.5 text-rose-300 font-bold" />}
                  {isUnopened && (
                    <span className="text-[9px] text-amber-300/80 font-bold">
                      +{cup.points}đ
                    </span>
                  )}
                </div>

                {/* Bamboo Tea Cup Illustration */}
                <div className="relative my-auto flex items-center justify-center">
                  {/* Steam particle animation if unopened */}
                  {isUnopened && (
                    <motion.div
                      animate={{ y: [-2, -8, -2], opacity: [0.3, 0.8, 0.3] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                      className="absolute -top-3.5 text-[10px] text-emerald-200 pointer-events-none select-none"
                    >
                      ♨️
                    </motion.div>
                  )}

                  <div
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 flex flex-col items-center justify-center transition-transform ${
                      isWon
                        ? 'rotate-180 opacity-50 grayscale'
                        : isLost
                        ? 'opacity-30 grayscale'
                        : ''
                    }`}
                  >
                    <img 
                      src="/assets/games/tea_battle/teacup.webp" 
                      alt="Tea Cup" 
                      className="w-full h-full object-contain filter drop-shadow-lg"
                    />
                    
                    {/* Number Overlay for unopened cups */}
                    {isUnopened && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-sm sm:text-base font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                          {cup.id}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer status text */}
                <div className="w-full text-center">
                  <span
                    className={`text-[9px] font-bold truncate block ${
                      isWon
                        ? 'text-emerald-300'
                        : isLost
                        ? 'text-rose-300'
                        : 'text-amber-200/90 group-hover:text-amber-100'
                    }`}
                  >
                    {isWon ? 'ĐÃ THẮNG' : isLost ? 'ĐÃ THUA' : 'CHỌN CỐC'}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
