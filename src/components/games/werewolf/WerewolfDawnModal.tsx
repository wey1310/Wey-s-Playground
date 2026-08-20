import React from 'react';
import { motion } from 'motion/react';
import { Sun, Skull, ShieldCheck, Sparkles, AlertTriangle, ArrowRight, UserCheck } from 'lucide-react';
import { NightResolution, NPCVillager, WerewolfTeamState } from './werewolfTypes';

interface WerewolfDawnModalProps {
  nightNumber: number;
  resolution: NightResolution;
  npcs: NPCVillager[];
  selectedTeam: WerewolfTeamState;
  onProceedToQuestion: () => void;
  enablePublicClues?: boolean;
}

export const WerewolfDawnModal: React.FC<WerewolfDawnModalProps> = ({
  nightNumber,
  resolution,
  npcs,
  selectedTeam,
  onProceedToQuestion,
  enablePublicClues = true,
}) => {
  const hasCasualties = resolution.casualties.length > 0;
  const deadNpcs = resolution.casualties.map(id => npcs.find(n => n.id === id)).filter(Boolean) as NPCVillager[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-fade-in select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-[#FFFDF5] border-2 border-[#DED5B8] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header - Rising Sun */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-inner">
              <Sun className="w-6 h-6 text-yellow-100 animate-spin-slow" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-100">
                Diễn Biến Sau Đêm {nightNumber}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white">
                🌅 BÌNH MINH LÓ RẠNG
              </h3>
            </div>
          </div>

          <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold text-white border border-white/30">
            Đêm {nightNumber} / {nightNumber + 1}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Casualties or Peaceful Announcement */}
          {hasCasualties ? (
            <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <Skull className="w-5 h-5 text-red-600" />
                <h4 className="text-sm font-extrabold text-red-900 uppercase">
                  Tin buồn trong ngôi làng
                </h4>
              </div>
              <div className="space-y-2">
                {deadNpcs.map(npc => (
                  <div key={npc.id} className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-red-100 shadow-xs">
                    <span className="text-2xl">{npc.avatar}</span>
                    <div className="flex-1">
                      <div className="font-extrabold text-xs text-red-950 flex items-center gap-2">
                        <span>{npc.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-red-100 text-red-700 rounded font-semibold">
                          {npc.job}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Đã không thể qua khỏi trong màn đêm bí ẩn...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xl shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-emerald-900">
                  Một Đêm Bình Yên!
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Không có nạn nhân nào tử nạn đêm qua. Toàn bộ cư dân làng an toàn!
                </p>
              </div>
            </div>
          )}

          {/* Public Clues (if enabled) */}
          {enablePublicClues && resolution.clues.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-black text-indigo-900 uppercase">
                  Manh mối điều tra công khai
                </h4>
              </div>
              <ul className="space-y-1 text-xs text-indigo-950 list-disc list-inside">
                {resolution.clues.map((clue, i) => (
                  <li key={i} className="leading-relaxed">{clue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Random Team Selected Announcement */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#E9F0D9] via-[#F4F8EC] to-[#E9F0D9] border-2 border-[#B9CDA0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#4F683C] flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                <span>Lượt Điều Tra Đêm {nightNumber}</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#35452E] border border-[#B9CDA0]">
                Random 1 Đội
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#B9CDA0] shadow-xs">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm text-white font-black"
                style={{ backgroundColor: selectedTeam.color }}
              >
                {selectedTeam.avatar}
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-bold text-slate-500">
                  Đội được chọn trả lời & mở quyền đoán:
                </div>
                <h4 className="text-base font-black text-slate-900">
                  {selectedTeam.name}
                </h4>
              </div>
            </div>
            <p className="text-[11px] text-[#4F683C] font-semibold mt-2 text-center">
              💡 Trả lời đúng câu hỏi kiến thức để mở khóa quyền chọn và đoán NPC!
            </p>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-[#F8F3E5] border-t border-[#DED5B8] flex items-center justify-end">
          <button
            onClick={onProceedToQuestion}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <span>Bắt Đầu Câu Hỏi Cho {selectedTeam.name}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
