import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Fingerprint, 
  Flame, 
  ShieldAlert, 
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DetectiveCase, Suspect, Clue, TeamCaseState, AccusationAttempt } from './caseTypes';
import { soundFx } from '../../../utils/audio';

interface CaseAccusationModalProps {
  currentCase: DetectiveCase;
  teamState: TeamCaseState;
  initialSuspect?: Suspect | null;
  onClose: () => void;
  onAccusationResult: (result: {
    isCorrect: boolean;
    suspectId: string;
    suspectName: string;
    pointsAwarded: number;
    feedback: string;
  }) => void;
  baseScore?: number;
  multiplier?: number;
}

export const CaseAccusationModal: React.FC<CaseAccusationModalProps> = ({
  currentCase,
  teamState,
  initialSuspect,
  onClose,
  onAccusationResult,
  baseScore = 100,
  multiplier = 2
}) => {
  const [selectedSuspectId, setSelectedSuspectId] = useState<string>(initialSuspect?.id || currentCase.suspects[0]?.id || '');
  const [selectedClueId, setSelectedClueId] = useState<string>('');
  const [chosenMotiveText, setChosenMotiveText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [verdictOutcome, setVerdictOutcome] = useState<{
    submitted: boolean;
    isCorrect: boolean;
    title: string;
    message: string;
  } | null>(null);

  const selectedSuspect = currentCase.suspects.find(s => s.id === selectedSuspectId);
  const unlockedClues = currentCase.clues.filter(c => 
    c.isUnlockedByDefault || teamState.unlockedClueIds.includes(c.id)
  );

  const handleDeliverAccusation = () => {
    if (!selectedSuspectId) return;

    setIsSubmitting(true);
    soundFx.cardPower();

    setTimeout(() => {
      const isCulpritMatch = selectedSuspectId === currentCase.truth.culpritId;
      const isEvidenceMatch = selectedClueId === currentCase.truth.decisiveClueId || (isCulpritMatch && unlockedClues.some(c => c.isKeyDecisiveEvidence && c.id === selectedClueId));
      
      const isOverallCorrect = isCulpritMatch; // Detective solved if they correctly pinpoint the culprit!

      if (isOverallCorrect) {
        soundFx.winFanfare();
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });

        const pointsWon = baseScore * multiplier;

        setVerdictOutcome({
          submitted: true,
          isCorrect: true,
          title: 'PHÁ ÁN THÀNH CÔNG! CHÍNH LÀ HẮN!',
          message: `Suy luận xuất sắc! ${selectedSuspect?.name} chính là kẻ thủ ác. Vụ án đã được phá giải hoàn toàn!`
        });

        setTimeout(() => {
          onAccusationResult({
            isCorrect: true,
            suspectId: selectedSuspectId,
            suspectName: selectedSuspect?.name || '',
            pointsAwarded: pointsWon,
            feedback: currentCase.truth.decisiveContradiction
          });
        }, 2200);
      } else {
        soundFx.playWrong();
        const feedback = selectedSuspect?.isRedHerring
          ? `${selectedSuspect.name} có điểm đáng ngờ nhưng vô tội! ${selectedSuspect.redHerringExplanation || 'Họ có bằng chứng ngoại phạm vững chắc.'}`
          : `Suy luận chưa chính xác! ${selectedSuspect?.name} không phải là thủ phạm của vụ án này.`;

        setVerdictOutcome({
          submitted: true,
          isCorrect: false,
          title: 'SUY LUẬN BỊ BÁC BỎ!',
          message: feedback
        });

        setTimeout(() => {
          onAccusationResult({
            isCorrect: false,
            suspectId: selectedSuspectId,
            suspectName: selectedSuspect?.name || '',
            pointsAwarded: 0,
            feedback
          });
        }, 2500);
      }
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 min-h-[calc(100vh-140px)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-[#18120c] text-amber-50 w-full rounded-3xl border-4 border-red-600 shadow-2xl overflow-hidden flex flex-col relative"
      >
        {/* Conan Dramatic Spotlight Top Header */}
        <div className="bg-gradient-to-r from-red-950 via-red-900 to-black p-5 border-b-2 border-red-500/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-w-text-main flex items-center justify-center text-2xl shadow-lg border border-red-400 animate-pulse">
              👉
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-600 text-w-text-main">
                  ĐẠI CHIẾN SUY LUẬN
                </span>
                <span className="text-xs text-amber-600 font-bold">
                  (Lượt đoán: {teamState.guessesLeft}/2)
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-w-text-main tracking-wide">
                CHỈ ĐIỂM HUNG THỦ VỤ ÁN
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

        {/* Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
          {/* Step 1: Select Suspect */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-amber-600 tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-black flex items-center justify-center">1</span>
              <span>Chọn Đối Tượng Bạn Buộc Tội Là Hung Thủ:</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {currentCase.suspects.map(s => {
                const isSelected = s.id === selectedSuspectId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSuspectId(s.id)}
                    className={`p-3 rounded-2xl border-2 text-left transition flex flex-col items-center gap-1.5 cursor-pointer relative ${
                      isSelected
                        ? 'bg-red-950/90 border-red-500 text-w-text-main shadow-lg shadow-red-950/50 scale-105'
                        : 'bg-zinc-900/80 border-zinc-700/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-3xl">{s.avatar || '👤'}</span>
                    <span className="text-xs font-black text-center line-clamp-1">{s.name}</span>
                    <span className="text-[10px] text-zinc-400 font-medium line-clamp-1">{s.title}</span>

                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-w-text-main text-[10px] flex items-center justify-center font-black shadow">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Select Decisive Evidence */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-amber-600 tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-black flex items-center justify-center">2</span>
              <span>Chọn Vật Chứng Then Chốt Vạch Trần Thủ Phạm:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {unlockedClues.map(clue => {
                const isSelected = clue.id === selectedClueId;
                return (
                  <button
                    key={clue.id}
                    type="button"
                    onClick={() => setSelectedClueId(clue.id)}
                    className={`p-2.5 rounded-xl border-2 text-left transition flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-950 border-amber-400 text-amber-200 shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850'
                    }`}
                  >
                    <span className="text-xl">{clue.icon || '🔍'}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold block line-clamp-1">{clue.title}</span>
                      <span className="text-[10px] text-zinc-400 block line-clamp-1">{clue.locationFound}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Summary Card */}
          {selectedSuspect && (
            <div className="p-3.5 bg-zinc-900/90 rounded-2xl border border-zinc-700 space-y-1 text-xs">
              <span className="text-amber-600 font-black uppercase tracking-wider text-[10px] block">
                Tóm Tắt Buộc Tội Của Đội {teamState.teamName}:
              </span>
              <p className="text-zinc-200">
                “Chúng tôi khẳng định <strong>{selectedSuspect.name}</strong> ({selectedSuspect.title}) là thủ phạm thực hiện hành vi phạm tội!”
              </p>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="bg-zinc-950 p-4 border-t-2 border-red-500/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            onClick={handleDeliverAccusation}
            disabled={isSubmitting || !selectedSuspectId}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-xl flex items-center gap-2 ${
              isSubmitting
                ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-w-text-main border border-red-400/80 animate-pulse'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>{isSubmitting ? 'Đang Soi Xét Lời Khai...' : 'LUẬN TỘI HUNG THỦ! 👉'}</span>
          </button>
        </div>

        {/* Verdict Overlay */}
        <AnimatePresence>
          {verdictOutcome && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-4"
            >
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-2xl border-4 ${
                verdictOutcome.isCorrect
                  ? 'bg-emerald-600 text-w-text-main border-emerald-300 animate-bounce'
                  : 'bg-red-600 text-w-text-main border-red-300 animate-shake'
              }`}>
                {verdictOutcome.isCorrect ? '🏆' : '❌'}
              </div>

              <div className="space-y-2 max-w-md">
                <h3 className={`text-lg sm:text-xl font-black ${
                  verdictOutcome.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {verdictOutcome.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-200 font-medium leading-relaxed">
                  {verdictOutcome.message}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
