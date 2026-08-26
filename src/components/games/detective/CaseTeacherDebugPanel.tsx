import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Key, 
  Unlock, 
  Sparkles, 
  Eye, 
  Plus, 
  CheckCircle2, 
  AlertTriangle,
  FolderOpen,
  RotateCcw,
  Zap
} from 'lucide-react';
import { DetectiveCase, TeamCaseState } from './caseTypes';
import { CASE_PRESETS } from './casePresets';

interface CaseTeacherDebugPanelProps {
  currentCase: DetectiveCase;
  teams: TeamCaseState[];
  onClose: () => void;
  onUnlockAllClues: (teamIndex: number) => void;
  onAddPoints: (teamIndex: number, points: number) => void;
  onResetGuesses: (teamIndex: number) => void;
  onSwitchCasePreset: (presetId: string) => void;
  onTriggerTruthReveal: () => void;
}

export const CaseTeacherDebugPanel: React.FC<CaseTeacherDebugPanelProps> = ({
  currentCase,
  teams,
  onClose,
  onUnlockAllClues,
  onAddPoints,
  onResetGuesses,
  onSwitchCasePreset,
  onTriggerTruthReveal
}) => {
  const [selectedTeamIdx, setSelectedTeamIdx] = useState<number>(0);
  const culprit = currentCase.suspects.find(s => s.id === currentCase.truth.culpritId);

  return (
    <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-[#18181b] text-zinc-100 max-w-2xl w-full rounded-3xl border-2 border-amber-500/80 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-zinc-900 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black text-xl shadow-md">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-amber-600">
                BẢNG ĐIỀU KHIỂN GIÁO VIÊN / QUẢN TRÒ (DEBUG PANEL)
              </h2>
              <p className="text-xs text-zinc-400">
                Xem trước đáp án vụ án và can thiệp điểm số điều tra của học sinh
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-w-text-main transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar text-xs flex-1">
          {/* Secret Case Solution Box */}
          <div className="bg-red-950/60 border border-red-500/60 rounded-2xl p-4 space-y-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-600 text-w-text-main">
              BÍ MẬT VỤ ÁN (CHỈ DÀNH CHO GIÁO VIÊN)
            </span>
            <div className="space-y-1 pt-1">
              <p className="text-zinc-200">
                👉 <strong>Hung thủ:</strong> <span className="text-red-300 font-black text-sm">{currentCase.truth.culpritName}</span> ({culprit?.title})
              </p>
              <p className="text-zinc-300">
                🎯 <strong>Động cơ thật:</strong> {currentCase.truth.realMotive}
              </p>
              <p className="text-zinc-300">
                💡 <strong>Mâu thuẫn then chốt:</strong> {currentCase.truth.decisiveContradiction}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTriggerTruthReveal();
                }}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-w-text-main font-black text-xs transition cursor-pointer shadow-md"
              >
                Mở Màn Phơi Bày Sự Thật Ngay
              </button>
            </div>
          </div>

          {/* Quick Team Management */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <h3 className="font-black text-zinc-200 uppercase text-xs">
              Trợ Giúp & Can Thiệp Điểm Từng Đội:
            </h3>

            {/* Team tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {teams.map((t, idx) => (
                <button
                  key={t.teamId}
                  type="button"
                  onClick={() => setSelectedTeamIdx(idx)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    selectedTeamIdx === idx
                      ? 'bg-amber-500 text-black border-amber-400 shadow-sm'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                  }`}
                >
                  {t.teamName} ({t.score}đ)
                </button>
              ))}
            </div>

            {/* Selected Team Actions */}
            {teams[selectedTeamIdx] && (
              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-3">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Đang chọn: <strong>{teams[selectedTeamIdx].teamName}</strong></span>
                  <span>Lượt đoán: <strong>{teams[selectedTeamIdx].guessesLeft}/2</strong></span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onUnlockAllClues(selectedTeamIdx)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-600 border border-zinc-700 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Mở Hết Manh Mối</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAddPoints(selectedTeamIdx, 50)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+50 Điểm AP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onResetGuesses(selectedTeamIdx)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-cyan-400 border border-zinc-700 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Hồi Phục 2 Lượt Đoán</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Switch Case Presets */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <h3 className="font-black text-zinc-200 uppercase text-xs flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-amber-600" />
              <span>Chuyển Sang Vụ Án Khác:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {CASE_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onSwitchCasePreset(preset.id);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    preset.id === currentCase.id
                      ? 'bg-amber-950/80 border-amber-400 text-amber-200'
                      : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  <span className="text-xl mb-1">{preset.coverIcon}</span>
                  <span className="font-bold text-xs line-clamp-1">{preset.title}</span>
                  <span className="text-[10px] text-zinc-400 line-clamp-1">{preset.badge}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-900 px-6 py-3 border-t border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-w-text-main font-bold text-xs transition cursor-pointer"
          >
            Đóng Bảng Quản Trò
          </button>
        </div>
      </motion.div>
    </div>
  );
};
