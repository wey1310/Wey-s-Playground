import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  MessageSquare, 
  Clock, 
  AlertTriangle, 
  Search, 
  FileText, 
  ShieldCheck, 
  ShieldAlert, 
  HelpCircle,
  Sparkles,
  Flame
} from 'lucide-react';
import { Suspect, DetectiveCase, TeamCaseState } from './caseTypes';

interface CaseSuspectDossierModalProps {
  suspect: Suspect | null;
  onClose: () => void;
  currentCase: DetectiveCase;
  teamState: TeamCaseState;
  onInterrogateStatement: (statementId: string) => void;
  onAccuseSuspect: (suspect: Suspect) => void;
}

export const CaseSuspectDossierModal: React.FC<CaseSuspectDossierModalProps> = ({
  suspect,
  onClose,
  currentCase,
  teamState,
  onInterrogateStatement,
  onAccuseSuspect
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'statements' | 'alibi'>('statements');

  if (!suspect) return null;

  const isClueUnlocked = (clueId?: string) => {
    if (!clueId) return false;
    const clue = currentCase.clues.find(c => c.id === clueId);
    if (clue?.isUnlockedByDefault) return true;
    return teamState.unlockedClueIds.includes(clueId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        className="bg-[#faf5ee] text-[#2e1d11] max-w-2xl w-full rounded-3xl border-4 border-[#b58b4c] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Folder Header */}
        <div className="bg-[#e8d8b9] px-5 py-3.5 border-b-2 border-[#b58b4c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-amber-900 text-amber-100 font-black text-[10px] uppercase tracking-widest">
              HỒ SƠ ĐIỀU TRA
            </span>
            <h2 className="text-sm sm:text-base font-black text-amber-950 flex items-center gap-2">
              <span>{suspect.name}</span>
              <span className="text-xs font-semibold text-stone-600">({suspect.title})</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-amber-200/80 hover:bg-amber-300 text-amber-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-amber-300/80 bg-amber-100/50 px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('statements')}
            className={`px-4 py-2 rounded-t-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'statements'
                ? 'bg-[#faf5ee] text-amber-950 border-t-2 border-x-2 border-amber-400 font-black shadow-xs'
                : 'text-amber-900/70 hover:text-amber-950'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Lời Khai & Đối Chất ({suspect.statements.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('alibi')}
            className={`px-4 py-2 rounded-t-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'alibi'
                ? 'bg-[#faf5ee] text-amber-950 border-t-2 border-x-2 border-amber-400 font-black shadow-xs'
                : 'text-amber-900/70 hover:text-amber-950'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Chứng Cứ Ngoại Phạm</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-t-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-[#faf5ee] text-amber-950 border-t-2 border-x-2 border-amber-400 font-black shadow-xs'
                : 'text-amber-900/70 hover:text-amber-950'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Lý Lịch & Động Cơ</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
          {/* TAB 1: STATEMENTS & INTERROGATION */}
          {activeTab === 'statements' && (
            <div className="space-y-3">
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs text-stone-700 italic">
                💬 <strong>Trích dẫn ban đầu:</strong> “{suspect.initialQuote}”
              </div>

              <div className="space-y-3">
                {suspect.statements.map((stmt, idx) => {
                  const contradictionRevealed = stmt.hasContradiction && isClueUnlocked(stmt.contradictedByClueId);
                  const isLockedByClue = stmt.hasContradiction && !isClueUnlocked(stmt.contradictedByClueId);

                  return (
                    <div
                      key={stmt.id}
                      className={`p-3.5 rounded-2xl border-2 transition space-y-2 ${
                        contradictionRevealed
                          ? 'bg-red-50/90 border-red-400 shadow-md'
                          : 'bg-white border-amber-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black uppercase text-amber-900 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 text-[10px] flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <span>Chủ đề: {stmt.topic}</span>
                        </span>

                        {contradictionRevealed && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-red-600 text-w-text-main flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            <span>MÂU THUẪN ĐÃ LỘ</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-800 font-medium leading-relaxed bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                        “{stmt.statementText}”
                      </p>

                      {/* Contradiction Explanation if unlocked */}
                      {contradictionRevealed && (
                        <div className="p-3 bg-red-100/90 rounded-xl border border-red-300 text-xs text-red-950 space-y-1">
                          <span className="font-black uppercase text-[10px] text-red-800 block flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                            <span>LỜI KHAI BỊ BÁC BỎ BỞI VẬT CHỨNG:</span>
                          </span>
                          <p className="font-bold">{stmt.contradictionExplanation}</p>
                        </div>
                      )}

                      {isLockedByClue && (
                        <div className="text-[11px] text-stone-500 italic flex items-center gap-1 pt-1">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Cần thêm vật chứng hiện trường để xác thực lời khai này...</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CLAIMED ALIBI */}
          {activeTab === 'alibi' && (
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-2xl border-2 border-amber-300 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-900">
                    Khung Giờ Nghi Vấn ({suspect.claimedAlibi.timeSlot}):
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                    suspect.claimedAlibi.verified 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}>
                    {suspect.claimedAlibi.verified ? '✓ ĐÃ XÁC THỰC NGOẠI PHẠM' : '⚠️ NGOẠI PHẠM BỊ NGHI VẤN'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    <strong className="text-amber-900 block text-[11px]">Vị trí tự khai:</strong>
                    <span>{suspect.claimedAlibi.location}</span>
                  </div>
                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    <strong className="text-amber-900 block text-[11px]">Hành vi tự khai:</strong>
                    <span>{suspect.claimedAlibi.claimedActivity}</span>
                  </div>
                </div>

                {suspect.claimedAlibi.brokenReason && (
                  <div className="p-3 bg-red-50 rounded-xl border border-red-300 text-xs text-red-950 space-y-1">
                    <strong className="text-red-900 uppercase tracking-wider text-[10px] block">
                      Điểm nghi vấn bác bỏ ngoại phạm:
                    </strong>
                    <p className="font-bold">{suspect.claimedAlibi.brokenReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PROFILE & MOTIVE */}
          {activeTab === 'profile' && (
            <div className="space-y-3 text-xs">
              <div className="flex gap-4 items-center bg-amber-100/60 p-3.5 rounded-2xl border border-amber-300">
                <div className="w-16 h-16 rounded-2xl bg-amber-200 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-inner">
                  {suspect.avatar || '👤'}
                </div>
                <div>
                  <h3 className="text-base font-black text-amber-950">{suspect.name}</h3>
                  <p className="text-stone-700 font-bold">{suspect.title} — {suspect.age} tuổi</p>
                  <p className="text-stone-600 font-medium">Tính cách: {suspect.personality}</p>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-amber-200 space-y-1.5">
                <strong className="text-amber-950 uppercase tracking-wider text-[11px] block">
                  Mối Quan Hệ Với Nạn Nhân:
                </strong>
                <p className="text-stone-700 leading-relaxed">{suspect.relationshipToVictim}</p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-amber-200 space-y-1.5">
                <strong className="text-red-950 uppercase tracking-wider text-[11px] block">
                  Động Cơ Gây Án Nghi Vấn:
                </strong>
                <p className="text-stone-700 leading-relaxed">{suspect.motive.apparent}</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-[#e8d8b9] p-3.5 border-t-2 border-[#b58b4c] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-amber-50 text-amber-950 text-xs font-bold border border-amber-300 transition cursor-pointer"
          >
            Đóng Hồ Sơ
          </button>

          <button
            type="button"
            onClick={() => onAccuseSuspect(suspect)}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-w-text-main text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Chỉ Điểm Nghi Phạm Này Là Hung Thủ</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
