import React from 'react';
import { DuelPlayerState } from './useParallelDuel';
import { GameSetupConfig, Team } from '../../../types';
import { CheckCircle2, XCircle, Zap, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ParallelDuelPanelProps {
  playerState: DuelPlayerState;
  team: Team;
  score: number;
  isPlayerA: boolean;
  config: GameSetupConfig;
  onTeacherJudge: (isCorrect: boolean) => void;
  onAnswer?: (optionIdx: number) => void;
  onSmash?: () => void;
}

export const ParallelDuelPanel: React.FC<ParallelDuelPanelProps> = ({
  playerState, 
  team, 
  score,
  isPlayerA, 
  config, 
  onTeacherJudge, 
  onAnswer, 
  onSmash
}) => {
  // Theme color styles
  const isBlue = !isPlayerA; // Player A is Red (Left), Player B is Blue (Right) OR according to team.color
  // In user photo: Left is Blue (Đội Xanh), Right is Red (Đội Đỏ) or customizable
  // Let's dynamically check team color or default
  const theme = isPlayerA 
    ? {
        headerBg: 'bg-gradient-to-r from-rose-600 to-red-600',
        cardBg: 'bg-red-600 text-white',
        border: 'border-red-400/30',
        ring: 'ring-red-500/30',
        buttonBg: 'bg-white hover:bg-red-50 active:bg-red-100 text-slate-800 border-red-200',
        badgeBg: 'bg-red-600 text-white',
        accentColor: '#dc2626',
        keys: ['W', 'A', 'S', 'D']
      }
    : {
        headerBg: 'bg-gradient-to-r from-blue-600 to-indigo-600',
        cardBg: 'bg-blue-600 text-white',
        border: 'border-blue-400/30',
        ring: 'ring-blue-500/30',
        buttonBg: 'bg-white hover:bg-blue-50 active:bg-blue-100 text-slate-800 border-blue-200',
        badgeBg: 'bg-blue-600 text-white',
        accentColor: '#2563eb',
        keys: ['↑', '←', '↓', '→']
      };

  if (config.mode === 'custom') {
    return (
      <div className={`flex flex-col items-center justify-center p-4 sm:p-6 h-full ${isPlayerA ? 'bg-rose-500/5' : 'bg-blue-500/5'} border-x border-slate-200`}>
        <div className="text-5xl mb-3 filter drop-shadow-md animate-bounce">{team.avatar}</div>
        <div className="text-xl font-black text-slate-800 mb-1">{team.name}</div>
        <div className="text-2xl font-black text-amber-500 mb-4">{score} điểm</div>
        <div className="text-xs font-bold text-slate-500 mb-6 text-center">
          Nhấn liên tục phím hoặc bấm nút dưới đây để tăng tốc:
        </div>
        
        <button
          onClick={onSmash}
          className={`w-full max-w-xs py-6 px-6 rounded-3xl font-black text-2xl text-white shadow-2xl transform active:scale-95 transition-all flex flex-col items-center gap-2 ${
            isPlayerA 
              ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/30' 
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-blue-500/30'
          }`}
        >
          <Zap className="w-10 h-10 animate-pulse" />
          <span>NHẤN KÉO!</span>
          <span className="text-xs font-medium text-white/80 mt-1">
            Phím: {isPlayerA ? 'W, A, S, D' : '↑, ←, ↓, →'}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full p-2.5 sm:p-3.5 relative select-none ${isPlayerA ? 'bg-slate-100/80' : 'bg-slate-100/80'}`}>
      
      {/* 1. Header Bar: Team Name + Big Yellow Score Badge (Exactly like the photo) */}
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-2xl shadow-md ${theme.headerBg} text-white mb-2.5 shrink-0`}>
        <div className="flex items-center gap-2.5 truncate">
          <span className="text-2xl filter drop-shadow">{team.avatar}</span>
          <span className="font-black text-base sm:text-lg tracking-wide uppercase truncate">
            {team.name}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {playerState.streak > 1 && (
            <div className="flex items-center gap-1 bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full text-xs font-black animate-pulse">
              <Flame className="w-3.5 h-3.5" />
              {playerState.streak}x
            </div>
          )}

          {/* Big Score Box */}
          <div className="bg-amber-400 text-slate-950 px-3.5 py-0.5 rounded-xl font-[900] text-xl sm:text-2xl shadow-inner min-w-[48px] text-center">
            {score}
          </div>
        </div>
      </div>

      {/* 2. Main Question Card + Options Area */}
      <div className="flex-1 flex flex-col gap-2.5 relative overflow-hidden">
        
        {/* Status Feedback Overlay (Correct / Wrong) */}
        <AnimatePresence>
          {!playerState.canAnswer && !playerState.isWaitingTeacher && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm z-30 flex items-center justify-center p-4 text-center rounded-2xl"
            >
              {playerState.lastAnswerIsCorrect === true && (
                <div className="flex flex-col items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-16 h-16 animate-bounce" />
                  <span className="font-black text-2xl tracking-wider text-white">CHÍNH XÁC!</span>
                  <span className="text-sm text-emerald-300 font-bold bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/50">
                    +{config.pointsPerCorrect || 10} điểm
                  </span>
                </div>
              )}
              {playerState.lastAnswerIsCorrect === false && (
                <div className="flex flex-col items-center gap-1.5 text-rose-400">
                  <XCircle className="w-16 h-16 animate-shake" />
                  <span className="font-black text-2xl tracking-wider text-white">CHƯA ĐÚNG!</span>
                  <span className="text-sm text-rose-300 font-bold bg-rose-950/80 px-3 py-1 rounded-full border border-rose-500/50">
                    -{config.pointsPerWrong || 5} điểm
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bank Mode: Large Colored Question Box on Top */}
        {config.mode === 'bank' && playerState.currentQuestion && (
          <>
            {/* Big Question Container (Solid Team Color, bold white text) */}
            <div className={`flex-1 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col justify-center text-center overflow-y-auto ${theme.cardBg} border ${theme.border}`}>
              <div className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-1">
                CÂU HỎI SỐ #{playerState.currentQuestionNum}
              </div>
              <div className="text-sm sm:text-base md:text-lg font-bold leading-relaxed text-white drop-shadow-sm line-clamp-6">
                {playerState.currentQuestion.content}
              </div>
            </div>

            {/* 2x2 Option Buttons Grid (A, B on row 1, C, D on row 2) */}
            <div className="grid grid-cols-2 gap-2 shrink-0 h-40 sm:h-44">
              {['A', 'B', 'C', 'D'].map((label, i) => {
                const opt = playerState.currentQuestion?.options?.[i] || '';
                const keyLabel = theme.keys[i];

                return (
                  <button
                    key={i}
                    disabled={!playerState.canAnswer}
                    onClick={() => onAnswer?.(i)}
                    className={`h-full flex flex-col justify-between p-2.5 rounded-xl border-2 text-left transition-all ${theme.buttonBg} ${
                      !playerState.canAnswer ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.98]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shadow-sm ${theme.badgeBg}`}>
                        {label}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {keyLabel}
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm font-semibold text-slate-700 leading-snug line-clamp-2 my-auto">
                      {opt}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Number / Oral Mode: Teacher Evaluation */}
        {config.mode === 'number' && (
          <div className="flex-1 bg-white rounded-2xl p-4 shadow-md border flex flex-col items-center justify-between">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">
              CÂU HỎI SỐ THỨ TỰ
            </div>

            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-slate-900 text-white flex items-center justify-center text-5xl sm:text-6xl font-[900] shadow-2xl border-4 border-amber-400 my-auto">
              {playerState.currentQuestionNum}
            </div>

            <div className="w-full text-center mb-2">
              <p className="text-xs font-bold text-slate-500 mb-4">
                Học sinh trả lời theo câu hỏi #{playerState.currentQuestionNum}. Giáo viên đánh giá:
              </p>

              {playerState.isWaitingTeacher && (
                <div className="flex items-center gap-2.5 w-full">
                  <button 
                    onClick={() => onTeacherJudge(true)} 
                    className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    ĐÚNG (+{config.pointsPerCorrect || 10}đ)
                  </button>
                  <button 
                    onClick={() => onTeacherJudge(false)} 
                    className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-5 h-5" />
                    SAI (-{config.pointsPerWrong || 5}đ)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
