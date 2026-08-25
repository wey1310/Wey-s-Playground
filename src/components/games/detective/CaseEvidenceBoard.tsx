import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Lock, 
  Unlock, 
  Sparkles, 
  Eye, 
  AlertCircle, 
  HelpCircle, 
  FileText, 
  Pin, 
  Layers, 
  Users, 
  Fingerprint, 
  Flame,
  CheckCircle2,
  X
} from 'lucide-react';
import { DetectiveCase, Clue, Suspect, TeamCaseState } from './caseTypes';

interface CaseEvidenceBoardProps {
  currentCase: DetectiveCase;
  teamState: TeamCaseState;
  activeTab: 'overview' | 'suspects' | 'clues' | 'timeline' | 'deduction';
  onInspectSuspect: (suspect: Suspect) => void;
  onInspectClue: (clue: Clue) => void;
  onUnlockClue: (clueId: string) => void;
  onAccuseSuspect: (suspect: Suspect) => void;
}

export const CaseEvidenceBoard: React.FC<CaseEvidenceBoardProps> = ({
  currentCase,
  teamState,
  activeTab,
  onInspectSuspect,
  onInspectClue,
  onUnlockClue,
  onAccuseSuspect
}) => {
  const [selectedClueModal, setSelectedClueModal] = useState<Clue | null>(null);

  const isClueUnlocked = (clueId: string) => {
    const clue = currentCase.clues.find(c => c.id === clueId);
    if (clue?.isUnlockedByDefault) return true;
    return teamState.unlockedClueIds.includes(clueId);
  };

  return (
    <div className="w-full relative min-h-[calc(100vh-140px)] bg-[#271d18] text-amber-50 p-3 sm:p-6 select-none overflow-hidden">
      {/* Background Board Overlay / Wood Frame Texture */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#4a3728 1px, transparent 1px), radial-gradient(#38271a 1px, #1a120c 1px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px'
        }}
      />

      {/* Pinboard Header & Controls */}
      {activeTab === 'overview' && (
        <div className="relative z-10 max-w-7xl mx-auto mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#1e140e]/80 p-3.5 rounded-2xl border-2 border-[#5c4028] shadow-2xl backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-900 border border-amber-400/50 flex items-center justify-center text-xl shadow-inner">
              📌
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-amber-200 uppercase tracking-wider flex items-center gap-2">
                <span>BẢNG SUY LUẬN VỤ ÁN</span>
                <span className="text-xs font-normal lowercase bg-amber-950 px-2 py-0.5 rounded-md text-amber-300 border border-amber-600/40">
                  (Evidence Board)
                </span>
              </h1>
              <p className="text-xs text-amber-300/70 font-medium">
                Khám phá các manh mối, giải mã lời khai và nối dây đỏ tìm ra sự thật vụ án.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Cork Pinboard Grid Area */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Victim & Case Brief Note */}
        {activeTab === 'overview' && (
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 bg-[#fff8eb] text-[#2b1810] p-4 sm:p-5 rounded-2xl shadow-xl border-2 border-[#d4af37] relative overflow-hidden transform -rotate-0.5">
            {/* Red Push Pin */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 border-2 border-white shadow-md flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-white opacity-80" />
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-3xl shadow-md shrink-0">
                {currentCase.victim.avatar || '👤'}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300">
                    NẠN NHÂN / MỤC TIÊU
                  </span>
                  <h3 className="text-base font-black text-amber-950">
                    {currentCase.victim.name} — <span className="font-semibold text-sm text-stone-700">{currentCase.victim.title}</span>
                  </h3>
                </div>
                <p className="text-xs text-stone-800 font-bold leading-relaxed">
                  ⚠️ <strong>Tình trạng:</strong> {currentCase.victim.incidentType}
                </p>
                <p className="text-xs text-stone-600 font-medium">
                  🕒 <strong>Lần cuối xuất hiện:</strong> {currentCase.victim.lastSeen}
                </p>
                <div className="pt-1 text-xs text-stone-700 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 italic leading-relaxed">
                  🩺 <strong>Báo cáo khám nghiệm:</strong> {currentCase.victim.medicalReport}
                </div>
              </div>
            </div>
          </div>

          {/* Investigation Stats Memo Tag */}
          <div className="bg-[#fef9c3] text-[#422006] p-4 rounded-2xl shadow-xl border-2 border-amber-300 relative transform rotate-1 flex flex-col justify-between">
            <div className="absolute top-2 right-3 text-red-600 font-black text-xs uppercase tracking-widest border border-red-500/40 px-2 py-0.5 rounded rotate-3">
              MẬT 📁
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-amber-700" />
                <span>Tiến Độ Điều Tra</span>
              </h4>
              <div className="space-y-1 text-xs font-bold text-amber-950">
                <div className="flex justify-between border-b border-amber-200 pb-1">
                  <span>Manh mối đã mở:</span>
                  <span className="text-amber-800 font-black">
                    {currentCase.clues.filter(c => isClueUnlocked(c.id)).length} / {currentCase.clues.length}
                  </span>
                </div>
                <div className="flex justify-between border-b border-amber-200 pb-1">
                  <span>Nghi phạm đã tra vấn:</span>
                  <span className="text-amber-800 font-black">
                    {teamState.interrogatedSuspectIds.length} / {currentCase.suspects.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Lượt đoán còn lại:</span>
                  <span className="text-red-700 font-black">
                    {teamState.guessesLeft} / 2 🔎
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-amber-200 text-[11px] text-amber-800/90 font-medium">
              💡 <em>Trả lời đúng câu hỏi kiến thức để mở khóa thêm điểm khám nghiệm hiện trường.</em>
            </div>
          </div>
        </div>
        )}

        {/* Suspects Polaroid Gallery */}
        {(activeTab === 'overview' || activeTab === 'suspects') && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Danh Sách Đối Tượng Tình Nghi ({currentCase.suspects.length})</span>
              </h3>
              <span className="text-[11px] text-amber-400/80 font-medium">
                Bấm vào hồ sơ để thẩm vấn & soi xét lời khai
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentCase.suspects.map((suspect, idx) => {
                const isInterrogated = teamState.interrogatedSuspectIds.includes(suspect.id);
                return (
                  <motion.div
                    key={suspect.id}
                    whileHover={{ scale: 1.02, rotate: idx % 2 === 0 ? 1 : -1 }}
                    onClick={() => onInspectSuspect(suspect)}
                    className="bg-[#faf5ee] text-[#2e1d11] p-3.5 rounded-2xl shadow-xl border-2 border-[#c7a76c] relative cursor-pointer group flex flex-col justify-between min-h-[260px]"
                  >
                    {/* Pin icon on top */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 border border-white shadow flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-white" />
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {/* Avatar & Badge */}
                      <div className="relative w-full aspect-square max-h-36 rounded-xl bg-amber-100/90 border border-amber-300 flex items-center justify-center text-5xl shadow-inner group-hover:bg-amber-200/90 transition">
                        <span>{suspect.avatar || '👤'}</span>
                        {isInterrogated && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black uppercase shadow-xs">
                            Đã Thẩm Vấn
                          </div>
                        )}
                      </div>

                      {/* Name & Title */}
                      <div>
                        <h4 className="text-sm font-black text-amber-950 group-hover:text-amber-800 transition line-clamp-1">
                          {suspect.name}
                        </h4>
                        <p className="text-[11px] text-stone-600 font-bold line-clamp-1">
                          {suspect.title} ({suspect.age} tuổi)
                        </p>
                      </div>

                      {/* Initial Quote Preview */}
                      <p className="text-[11px] text-stone-700 italic bg-amber-50/90 p-2 rounded-lg border border-amber-200 line-clamp-2">
                        {suspect.initialQuote}
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-3 pt-2 border-t border-amber-200 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-amber-800 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>Xem Hồ Sơ</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAccuseSuspect(suspect);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase transition cursor-pointer shadow-xs"
                      >
                        Chỉ Điểm
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Physical Evidence & Clues Pinboard Cards */}
        {(activeTab === 'overview' || activeTab === 'clues') && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-amber-400" />
                <span>Vật Chứng & Dấu Vết Hiện Trường ({currentCase.clues.length})</span>
              </h3>
              <span className="text-[11px] text-amber-400/80 font-medium">
                Bấm vào vật chứng để xem báo cáo giám định hoặc mở khóa
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentCase.clues.map((clue, idx) => {
                const unlocked = isClueUnlocked(clue.id);
                return (
                  <motion.div
                    key={clue.id}
                    whileHover={{ scale: 1.015, y: -4 }}
                    onClick={() => {
                      if (unlocked) {
                        onInspectClue(clue);
                        setSelectedClueModal(clue);
                      }
                    }}
                    className={`p-4 rounded-2xl shadow-xl border-2 transition-all duration-300 relative flex flex-col justify-between min-h-[190px] group overflow-hidden ${
                      unlocked
                        ? 'bg-[#fcf8ec] text-[#2b1810] border-[#c49a45] cursor-pointer hover:shadow-2xl hover:border-amber-500 hover:shadow-amber-500/20'
                        : 'bg-[#1e1510]/90 text-zinc-400 border-zinc-700/80 cursor-default'
                    }`}
                  >
                    {/* Hover Glow Effect */}
                    {unlocked && (
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/0 via-amber-400/0 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    )}

                    {/* Top Pin */}
                    <div className={`absolute -top-2 left-6 w-3.5 h-3.5 rounded-full border shadow z-10 ${
                      unlocked ? 'bg-amber-600 border-amber-200' : 'bg-zinc-600 border-zinc-400'
                    }`} />

                    <div className="space-y-2 relative z-10">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl shadow-xs border transition-transform duration-300 group-hover:scale-110 ${
                            unlocked 
                              ? 'bg-amber-100 text-amber-900 border-amber-300 group-hover:bg-amber-200' 
                              : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                          }`}>
                            {unlocked ? (clue.icon || '🔍') : '❓'}
                          </div>
                          <div>
                            <h4 className={`text-xs font-black line-clamp-1 transition-colors ${unlocked ? 'text-amber-950 group-hover:text-amber-700' : 'text-zinc-400'}`}>
                              {unlocked ? clue.title : 'Manh Mối Chưa Khám Phá'}
                            </h4>
                            {unlocked ? (
                              <span className="text-[10px] font-bold text-amber-700/80 block">
                                📍 {clue.locationFound}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-zinc-500 block">
                                📍 Không rõ địa điểm
                              </span>
                            )}
                          </div>
                        </div>

                        {clue.isKeyDecisiveEvidence && unlocked && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-red-600 text-white shadow-xs animate-pulse">
                            CỐT LÕI
                          </span>
                        )}
                      </div>

                      {/* Summary text with reveal effect */}
                      {unlocked ? (
                        <div className="relative grid">
                          <p className="col-start-1 row-start-1 text-xs text-stone-700 font-medium line-clamp-3 leading-relaxed transition-all duration-300 group-hover:opacity-0 group-hover:blur-sm z-0">
                            {clue.summary}
                          </p>
                          <div className="col-start-1 row-start-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 flex items-center justify-center bg-amber-100/95 rounded-lg p-2 border border-amber-300/80 backdrop-blur-sm z-10 shadow-inner">
                             <p className="text-xs font-bold text-amber-950 text-center leading-relaxed line-clamp-3">
                               {clue.detailedAnalysis}
                             </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-700/60 text-center space-y-1">
                          <Lock className="w-4 h-4 text-amber-500 mx-auto" />
                          <p className="text-[11px] text-zinc-400 font-medium">
                            Cần {clue.pointsToUnlock || 30} Điểm Điều Tra (AP) để phân tích vật chứng này.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-3 pt-2 border-t border-amber-200/60 flex items-center justify-between relative z-10">
                      {unlocked ? (
                        <>
                          <span className="text-[10px] font-extrabold text-amber-800 flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Bấm để soi kính lúp</span>
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                            ✓ Đã Giải Mã
                          </span>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnlockClue(clue.id);
                          }}
                          className="w-full py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Mở Khóa ({clue.pointsToUnlock || 30} AP)</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Clue Detailed Magnifying Glass Inspection Modal */}
      <AnimatePresence>
        {selectedClueModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#faf5ee] text-[#2e1d11] max-w-lg w-full rounded-3xl p-5 sm:p-6 border-4 border-[#c7a76c] shadow-2xl relative space-y-4"
            >
              <button
                type="button"
                onClick={() => setSelectedClueModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-amber-200/80 hover:bg-amber-300 text-amber-900 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-amber-300 pb-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-200 border-2 border-amber-400 flex items-center justify-center text-2xl shadow-inner">
                  {selectedClueModal.icon || '🔎'}
                </div>
                <div>
                  <h3 className="text-base font-black text-amber-950">
                    {selectedClueModal.title}
                  </h3>
                  <p className="text-xs text-amber-800 font-bold">
                    📍 Vị trí tìm thấy: {selectedClueModal.locationFound}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-stone-800">
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-1">
                  <span className="font-black text-amber-900 uppercase tracking-wider block text-[10px]">
                    📋 Mô Tả Hiện Trường:
                  </span>
                  <p>{selectedClueModal.summary}</p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border-2 border-amber-300 space-y-1 shadow-inner">
                  <span className="font-black text-red-900 uppercase tracking-wider block text-[10px] flex items-center gap-1">
                    <Search className="w-3.5 h-3.5 text-red-600" />
                    <span>Kết Quả Giám Định Chuyên Sâu (Pháp Y / Kỹ Thuật):</span>
                  </span>
                  <p className="font-bold text-stone-900">
                    {selectedClueModal.detailedAnalysis}
                  </p>
                </div>

                {selectedClueModal.leadsToDeduction && (
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-300 text-emerald-950 space-y-1">
                    <span className="font-black uppercase text-[10px] text-emerald-800 block">
                      💡 Đầu Mối Suy Luận:
                    </span>
                    <p className="font-bold">{selectedClueModal.leadsToDeduction}</p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedClueModal(null)}
                  className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-extrabold transition cursor-pointer shadow-md"
                >
                  Đóng Báo Cáo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
