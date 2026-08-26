import React from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  ArrowLeft, 
  Sparkles, 
  Search, 
  Flame, 
  ShieldCheck, 
  CheckCircle2, 
  X,
  AlertTriangle,
  Award,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DetectiveCase, TeamCaseState } from './caseTypes';

interface CaseTruthRevealModalProps {
  currentCase: DetectiveCase;
  teams: TeamCaseState[];
  onClose: () => void;
  onRestartCase: () => void;
  onBackToHome: () => void;
}

export const CaseTruthRevealModal: React.FC<CaseTruthRevealModalProps> = ({
  currentCase,
  teams,
  onClose,
  onRestartCase,
  onBackToHome
}) => {
  const culprit = currentCase.suspects.find(s => s.id === currentCase.truth.culpritId);
  const decisiveClue = currentCase.clues.find(c => c.id === currentCase.truth.decisiveClueId);

  const winningTeams = teams.filter(t => t.solved);
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        className="bg-[#18120c] text-amber-50 max-w-3xl w-full rounded-3xl border-4 border-amber-500/80 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
      >
        {/* Climax Header */}
        <div className="bg-gradient-to-r from-amber-950 via-zinc-900 to-black p-5 sm:p-6 border-b-2 border-amber-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-black flex items-center justify-center text-2xl font-black shadow-lg">
              📜
            </div>
            <div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 border border-amber-500/40 tracking-wider">
                HẠ MÀN PHÁ ÁN
              </span>
              <h2 className="text-base sm:text-xl font-black text-amber-100 tracking-wide">
                TOÀN BỘ SỰ THẬT VỤ ÁN ĐƯỢC PHƠI BÀY
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1 text-xs">
          {/* Culprit Spotlight Card */}
          <div className="bg-red-950/80 border-2 border-red-500/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 shadow-xl">
            <div className="w-20 h-20 rounded-2xl bg-red-900/90 border-2 border-red-400 flex items-center justify-center text-4xl shadow-inner shrink-0">
              {culprit?.avatar || '👤'}
            </div>
            <div className="space-y-1 text-center sm:text-left flex-1">
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-red-600 text-w-text-main tracking-wider">
                HUNG THỦ THẬT SỰ
              </span>
              <h3 className="text-lg font-black text-red-200">
                {currentCase.truth.culpritName} — <span className="text-sm font-semibold text-zinc-300">{culprit?.title}</span>
              </h3>
              <p className="text-zinc-300 font-medium leading-relaxed">
                🎯 <strong>Động cơ thật sự:</strong> {currentCase.truth.realMotive}
              </p>
            </div>
          </div>

          {/* Decisive Contradiction Box */}
          <div className="bg-[#241a12] border-2 border-amber-600/70 rounded-2xl p-4 sm:p-5 space-y-2 shadow-md">
            <h4 className="text-amber-600 font-black uppercase text-xs tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-600" />
              <span>MÂU THUẪN THEN CHỐT VẠCH TRẦN TỘI ÁC</span>
            </h4>
            <p className="text-zinc-200 font-medium leading-relaxed bg-white/70 backdrop-blur-sm p-3 rounded-xl border border-amber-700/40">
              {currentCase.truth.decisiveContradiction}
            </p>
            {decisiveClue && (
              <div className="text-[11px] text-amber-600 pt-1 flex items-center gap-1 font-bold">
                <span>Vật chứng quyết định:</span>
                <span className="underline">{decisiveClue.title}</span>
              </div>
            )}
          </div>

          {/* Step by Step Recreation */}
          <div className="bg-[#1f1710] border border-zinc-700/80 rounded-2xl p-4 sm:p-5 space-y-3">
            <h4 className="text-zinc-200 font-black uppercase text-xs tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>TÁI HIỆN MÁNH KHÓE GÂY ÁN CỦA HUNG THỦ</span>
            </h4>
            <p className="text-zinc-300 font-medium leading-relaxed">
              {currentCase.truth.realModusOperandi}
            </p>
            <div className="space-y-2 pt-2">
              {currentCase.truth.recreationSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 bg-white/70 backdrop-blur-sm p-2.5 rounded-xl border border-zinc-800">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-zinc-300 font-medium leading-relaxed">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* How Red Herrings Cleared */}
          {currentCase.truth.howRedHerringsCleared.length > 0 && (
            <div className="bg-[#1a140f] border border-zinc-800 rounded-2xl p-4 space-y-2">
              <h4 className="text-zinc-400 font-black uppercase text-xs tracking-wider">
                GIẢI MÃ CÁC NGHI PHẠM BỊ NGHI OAN (RED HERRINGS):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {currentCase.truth.howRedHerringsCleared.map(rh => (
                  <div key={rh.suspectId} className="p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-1">
                    <span className="font-bold text-amber-600 block">{rh.suspectName}:</span>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">{rh.clearedByReason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teams Final Ranking & Scores */}
          <div className="bg-[#120a06] border border-amber-600/40 rounded-2xl p-4 sm:p-5 space-y-3">
            <h4 className="text-amber-600 font-black uppercase text-xs tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>BẢNG TỔNG KẾT ĐIỂM THÁM TỬ CÁC ĐỘI</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sortedTeams.map((team, idx) => (
                <div
                  key={team.teamId}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    team.solved
                      ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-black w-5">{idx + 1}.</span>
                    <span className="text-xl">{team.avatar || '🕵️'}</span>
                    <div>
                      <span className="font-black block text-xs text-w-text-main">{team.teamName}</span>
                      <span className="text-[10px] opacity-80">
                        {team.solved ? '🏆 Phá án thành công' : 'Chưa phá được án'}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-amber-600">{team.score} điểm</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-zinc-950 p-4 border-t-2 border-amber-500/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Trang Chủ</span>
          </button>

          <button
            type="button"
            onClick={onRestartCase}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-w-text-main text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Chơi Vụ Án Mới</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
