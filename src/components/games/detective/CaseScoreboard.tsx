import React from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  HelpCircle, 
  RotateCcw, 
  Eye, 
  Key, 
  Sparkles, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  ArrowLeft,
  FileSearch,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Shuffle,
  X
} from 'lucide-react';
import { TeamCaseState, DetectiveCase } from './caseTypes';

interface CaseScoreboardProps {
  currentCase: DetectiveCase;
  teams: TeamCaseState[];
  currentTeamIndex: number;
  onSelectTeam?: (index: number) => void;
  onOpenDebug: () => void;
  onOpenBriefing?: () => void;
  onOpenQuickGuide?: () => void;
  onResetTurn?: () => void;
  onBackToHome: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenAccusation: () => void;
  onOpenTimeline: () => void;
  canAccuse: boolean;
  activeStudent?: string | null;
  studentsCount?: number;
  onOpenStudentModal?: () => void;
  onPickRandomStudent?: () => void;
  onClearActiveStudent?: () => void;
}

export const CaseScoreboard: React.FC<CaseScoreboardProps> = ({
  currentCase,
  teams,
  currentTeamIndex,
  onSelectTeam,
  onOpenDebug,
  onOpenBriefing,
  onOpenQuickGuide,
  onBackToHome,
  isMuted,
  onToggleMute,
  onOpenAccusation,
  onOpenTimeline,
  canAccuse,
  activeStudent,
  studentsCount = 0,
  onOpenStudentModal,
  onPickRandomStudent,
  onClearActiveStudent
}) => {
  const activeTeam = teams[currentTeamIndex] || teams[0];

  return (
    <div className="w-full bg-[#18181b]/95 border-b-2 border-amber-500/30 text-amber-50 px-3 sm:px-6 py-2.5 shadow-xl backdrop-blur-md sticky top-0 z-30 space-y-2">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Case Info & Navigation */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <button
            type="button"
            onClick={onBackToHome}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Quay lại sảnh chính"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Sảnh Game</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-lg shadow-md border border-amber-400/40">
              {currentCase.coverIcon || '🔎'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-black text-amber-300 tracking-wide line-clamp-1">
                  {currentCase.title}
                </h2>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40">
                  {currentCase.badge}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium line-clamp-1">
                {currentCase.crimeSceneName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:hidden">
            <button
              type="button"
              onClick={onToggleMute}
              className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Center: Teams Switcher / Score Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 md:pb-0 custom-scrollbar">
          {teams.map((t, idx) => {
            const isActive = idx === currentTeamIndex;
            return (
              <button
                key={t.teamId}
                type="button"
                onClick={() => onSelectTeam && onSelectTeam(idx)}
                className={`relative px-3 py-1.5 rounded-xl border transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-950 to-zinc-900 border-amber-400 text-amber-200 shadow-lg shadow-amber-950/50 scale-105'
                    : 'bg-zinc-900/80 border-zinc-700/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <div 
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shadow-xs"
                  style={{ backgroundColor: t.color || '#f59e0b', color: '#fff' }}
                >
                  {t.avatar || '🕵️'}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold line-clamp-1 flex items-center gap-1">
                    <span>{t.teamName}</span>
                    {t.solved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />}
                    {t.failed && <XCircle className="w-3.5 h-3.5 text-rose-400 inline" />}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="text-amber-400 font-extrabold">{t.score} điểm</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-300">
                      {t.guessesLeft}/2 🔎
                    </span>
                  </div>
                </div>

                {isActive && (
                  <motion.div
                    layoutId="activeTeamGlow"
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Actions (Student Tools, Timeline, Accusation, Debug) */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {/* Student Picker Buttons */}
          {onPickRandomStudent && (
            <button
              type="button"
              onClick={onPickRandomStudent}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
              title="Quay bốc ngẫu nhiên 1 thám tử học sinh"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Bốc Thám Tử</span>
            </button>
          )}

          {onOpenStudentModal && (
            <button
              type="button"
              onClick={onOpenStudentModal}
              className="px-2.5 py-1.5 rounded-xl bg-[#2e1d11] hover:bg-[#3d2717] text-amber-200 border border-amber-600/50 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Mở danh sách học sinh và nạp file"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">DS Học Sinh</span>
              {studentsCount > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 border border-amber-700">
                  {studentsCount}
                </span>
              )}
            </button>
          )}

          {onOpenBriefing && (
            <button
              type="button"
              onClick={onOpenBriefing}
              className="px-2.5 py-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900 text-amber-200 border border-amber-600/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Xem lại báo cáo hồ sơ vụ án (Briefing)"
            >
              <FileSearch className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Hồ Sơ</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenTimeline}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-200 border border-zinc-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Xem dòng thời gian vụ án"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Timeline</span>
          </button>

          <button
            type="button"
            onClick={onOpenAccusation}
            disabled={!canAccuse}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-md ${
              canAccuse
                ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white border border-red-400/60 animate-pulse'
                : 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
            }`}
            title="Chỉ điểm hung thủ Conan Style"
          >
            <Search className="w-3.5 h-3.5" />
            <span>CHỈ ĐIỂM HUNG THỦ</span>
          </button>

          <div className="hidden md:flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleMute}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition"
              title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {onOpenQuickGuide && (
              <button
                type="button"
                onClick={onOpenQuickGuide}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-300 border border-zinc-700 transition"
                title="Hướng dẫn luật chơi"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onOpenDebug}
              className="p-2 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-600/50 transition"
              title="Bảng điều khiển giáo viên (Bí Mật)"
            >
              <Key className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Active Detective Banner */}
      {activeStudent && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto bg-gradient-to-r from-amber-500/20 via-amber-600/30 to-amber-500/20 border border-amber-400/80 rounded-xl px-3 py-1.5 flex items-center justify-between shadow-md"
        >
          <div className="flex items-center gap-2 text-xs">
            <span className="w-6 h-6 rounded-lg bg-amber-400 text-zinc-950 flex items-center justify-center font-black text-xs shadow-xs">
              🕵️‍♂️
            </span>
            <span className="text-amber-300 font-bold uppercase tracking-wider text-[11px]">
              Thám Tử Đang Phá Án:
            </span>
            <span className="text-white font-black text-xs sm:text-sm bg-black/40 px-2.5 py-0.5 rounded-lg border border-amber-400/40">
              {activeStudent}
            </span>
            <span className="hidden sm:inline text-amber-400/70 text-[11px]">
              (Đại diện cho {activeTeam.teamName})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {onPickRandomStudent && (
              <button
                type="button"
                onClick={onPickRandomStudent}
                className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-lg text-[10px] flex items-center gap-1 transition cursor-pointer"
                title="Bốc lại học sinh khác"
              >
                <Shuffle className="w-3 h-3" />
                <span className="hidden sm:inline">Quay Lại</span>
              </button>
            )}
            {onClearActiveStudent && (
              <button
                type="button"
                onClick={onClearActiveStudent}
                className="p-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
                title="Bỏ chọn thám tử này"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
