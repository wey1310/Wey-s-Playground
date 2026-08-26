import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  Key, 
  Sparkles, 
  Trophy, 
  UserCheck 
} from 'lucide-react';
import { WerewolfTeamState } from './werewolfTypes';

interface WerewolfScoreboardProps {
  currentNight: number;
  maxNights?: number;
  teams: WerewolfTeamState[];
  activeTeamIndex: number;
  isMuted: boolean;
  skipQuestions?: boolean;
  onToggleSkipQuestions?: () => void;
  onToggleSound: () => void;
  onRestartGame: () => void;
  onBackToHome: () => void;
  onOpenDebug: () => void;
  onOpenQuickGuide?: () => void;
}

export const WerewolfScoreboard: React.FC<WerewolfScoreboardProps> = ({
  currentNight,
  maxNights,
  teams,
  activeTeamIndex,
  isMuted,
  skipQuestions = false,
  onToggleSkipQuestions,
  onToggleSound,
  onRestartGame,
  onBackToHome,
  onOpenDebug,
  onOpenQuickGuide,
}) => {
  const activeTeam = teams[activeTeamIndex] || teams[0];

  return (
    <div className="bg-w-bg-card border-b-2 border-w-border p-3 sm:p-4 sticky top-0 z-30 shadow-xs flex flex-wrap items-center justify-between gap-3">
      {/* Left: Game Info & Back */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onBackToHome}
          className="p-2 rounded-xl bg-w-bg-main hover:bg-w-accent-light text-w-primary-dark border border-w-border transition cursor-pointer"
          title="Về trang chủ"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-w-bg-alt text-indigo-200 border border-indigo-700/60 flex items-center justify-center text-xl shadow-xs">
            🐺
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-w-text-main tracking-tight">
                MA SÓI: NGÔI LÀNG BÍ ẨN
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-200 border border-indigo-700">
                🌙 Đêm {currentNight}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-w-text-muted">
              Phiên bản Điều tra Tri thức AI • 12 NPC Cư dân
            </p>
          </div>
        </div>
      </div>

      {/* Center: Teams Score Cards */}
      <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 custom-scrollbar">
        {teams.map((t, idx) => {
          const isActive = idx === activeTeamIndex;

          return (
            <div
              key={t.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border-2 transition shrink-0 ${
                isActive
                  ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
                  : 'bg-white border-w-border'
              }`}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black text-w-text-main shadow-2xs"
                style={{ backgroundColor: t.color }}
              >
                {t.avatar}
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 truncate max-w-[80px]">
                  {t.name}
                </div>
                <div className="text-xs font-black text-w-text-main">
                  {t.score} đ
                </div>
              </div>
              {isActive && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping ml-0.5" title="Đang đến lượt điều tra" />
              )}
            </div>
          );
        })}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Quick toggle skip questions */}
        {onToggleSkipQuestions && (
          <button
            onClick={onToggleSkipQuestions}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black border transition cursor-pointer ${
              skipQuestions
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-600 shadow-xs'
                : 'bg-w-bg-main hover:bg-w-accent-light text-w-primary-dark border-w-accent-border'
            }`}
            title="Bật/Tắt chế độ bỏ qua câu hỏi kiến thức (Vào thẳng lượt vote treo cổ)"
          >
            <span>⚡ {skipQuestions ? 'Vote Trực Tiếp: BẬT' : 'Bỏ qua câu hỏi: TẮT'}</span>
          </button>
        )}

        {/* Teacher Secret Debug Button */}
        <button
          onClick={onOpenDebug}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-w-bg-alt hover:bg-w-accent-light text-indigo-300 text-xs font-bold border border-indigo-700/60 shadow-xs transition cursor-pointer"
          title="Bảng điều khiển bí mật của Giáo viên (Xem vai trò thật, suspicion)"
        >
          <Key className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden sm:inline">GV Debug</span>
        </button>

        {onOpenQuickGuide && (
          <button
            onClick={onOpenQuickGuide}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-w-bg-main hover:bg-w-accent-light text-w-primary-dark text-xs font-bold border border-w-accent-border shadow-xs transition cursor-pointer"
            title="Xem luật chơi"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Luật</span>
          </button>
        )}

        <button
          onClick={onToggleSound}
          className="p-2 rounded-xl bg-w-bg-main hover:bg-w-accent-light text-w-primary-dark border border-w-border transition cursor-pointer"
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onRestartGame}
          className="p-2 rounded-xl bg-w-bg-main hover:bg-w-accent-light text-w-primary-dark border border-w-border transition cursor-pointer"
          title="Chơi lại ván mới"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
