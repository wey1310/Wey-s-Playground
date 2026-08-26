import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Award, 
  ShieldAlert, 
  Search,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { NPCVillager, WerewolfRole, WerewolfTeamState } from './werewolfTypes';
import { PERSONALITY_PROFILES } from './werewolfVillageData';

interface WerewolfGuessModalProps {
  team: WerewolfTeamState;
  npcs: NPCVillager[];
  basePoint: number;
  multiplier: number;
  guessMode?: 'is_werewolf' | 'exact_role';
  onConfirmGuess: (targetNpc: NPCVillager, guessValue: string) => void;
}

export const WerewolfGuessModal: React.FC<WerewolfGuessModalProps> = ({
  team,
  npcs,
  basePoint,
  multiplier,
  guessMode = 'is_werewolf',
  onConfirmGuess,
}) => {
  const aliveNpcs = npcs.filter(n => n.isAlive);
  const [selectedNpcId, setSelectedNpcId] = useState<string>(aliveNpcs[0]?.id || '');
  const [guessValue, setGuessValue] = useState<string>(guessMode === 'is_werewolf' ? 'yes' : 'werewolf');

  const selectedNpc = npcs.find(n => n.id === selectedNpcId);
  const potentialPoints = Math.round(basePoint * multiplier);

  const handleConfirm = () => {
    if (!selectedNpc) return;
    onConfirmGuess(selectedNpc, guessValue);
  };

  const roleOptions: Array<{ role: WerewolfRole; label: string; icon: string; desc: string }> = [
    { role: 'werewolf', label: 'Ma Sói', icon: '🐺', desc: 'Bóng đêm hắc ám săn mồi' },
    { role: 'seer', label: 'Tiên Tri', icon: '🔮', desc: 'Soi rọi nhân dạng ban đêm' },
    { role: 'guard', label: 'Bảo Vệ', icon: '🛡️', desc: 'Thi triển khiên hộ mệnh' },
    { role: 'witch', label: 'Phù Thủy', icon: '🧪', desc: 'Sở hữu bình cứu & bình độc' },
    { role: 'hunter', label: 'Thợ Săn', icon: '🏹', desc: 'Bắn phát tiễn khi tử nạn' },
    { role: 'villager', label: 'Dân Làng', icon: '🌿', desc: 'Cư dân lương thiện của làng' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-white/70 backdrop-blur-sm backdrop-blur-md select-none overflow-y-auto animate-fade-in">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-w-bg-card border-2 border-w-border rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-w-text-main flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner font-black"
              style={{ backgroundColor: team.color }}
            >
              {team.avatar}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Quyền Bỏ Phiếu Treo Cổ</span>
              </span>
              <h3 className="text-lg sm:text-xl font-black text-w-text-main">
                ⚖️ {team.name} — QUYẾT ĐỊNH TREO CỔ AI?
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-amber-200 block uppercase">Phần thưởng đúng</span>
            <div className="px-3 py-1 bg-white/20 rounded-xl font-black text-sm text-yellow-300 border border-white/30 inline-block shadow-xs">
              +{potentialPoints} điểm (×{multiplier})
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Step 1: Pick an Alive NPC */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-w-text-main flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-w-primary-dark" />
                <span>1. Chọn 1 Cư Dân Còn Sống Để Treo Cổ ({aliveNpcs.length} người)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">Nhấp để chọn</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1.5 bg-w-bg-main rounded-2xl border border-w-border custom-scrollbar">
              {aliveNpcs.map((npc) => {
                const isSelected = selectedNpcId === npc.id;
                const personality = PERSONALITY_PROFILES[npc.personality];

                return (
                  <button
                    key={npc.id}
                    type="button"
                    onClick={() => setSelectedNpcId(npc.id)}
                    className={`p-2.5 rounded-xl border-2 transition text-left flex items-center gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400 shadow-sm'
                        : 'bg-white border-w-border hover:border-amber-300'
                    }`}
                  >
                    <div className="text-2xl w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      {npc.avatar}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <div className="font-black text-xs text-slate-900 truncate">
                        {npc.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {npc.job}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected NPC Inspection Detail */}
          {selectedNpc && (
            <div className="p-3.5 bg-gradient-to-r from-amber-50 via-white to-amber-50 rounded-2xl border-2 border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-3xl shrink-0">
                  {selectedNpc.avatar}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>{selectedNpc.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 font-bold">
                      {selectedNpc.job} • {selectedNpc.age} tuổi
                    </span>
                  </h4>
                  {selectedNpc.statement ? (
                    <div className="mt-1 p-2 rounded-xl bg-amber-100/70 border border-amber-300/80 text-xs text-amber-950 leading-relaxed">
                      <span className="font-extrabold text-[10px] text-amber-800 uppercase tracking-wider block mb-0.5">
                        {selectedNpc.statement.icon} {selectedNpc.statement.typeLabel}:
                      </span>
                      <span className="italic font-medium">
                        "{selectedNpc.statement.content}"
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 mt-0.5 italic">
                      Chưa có lời khai mới.
                    </p>
                  )}
                </div>
              </div>

              {selectedNpc.isRevealed && (
                <div className="px-2.5 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-black border border-red-300 shrink-0">
                  ĐÃ HÉ LỘ: {selectedNpc.role.toUpperCase()}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Choose Guess Mode */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-w-text-main mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-w-primary-dark" />
              <span>2. Quyết Định Cho {selectedNpc?.name || 'Cư Dân Này'}</span>
            </label>

            {guessMode === 'is_werewolf' ? (
              /* Binary Werewolf Guess */
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGuessValue('yes')}
                  className={`p-4 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    guessValue === 'yes'
                      ? 'bg-red-50 border-red-500 ring-2 ring-red-400 shadow-md text-red-950'
                      : 'bg-white border-w-border hover:bg-red-50/50 text-slate-700'
                  }`}
                >
                  <span className="text-3xl">🐺</span>
                  <div>
                    <div className="text-sm font-black">TREO CỔ (LÀ MA SÓI)</div>
                    <p className="text-[11px] text-slate-500">Giết kẻ đáng ngờ</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setGuessValue('no')}
                  className={`p-4 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    guessValue === 'no'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400 shadow-md text-emerald-950'
                      : 'bg-white border-w-border hover:bg-emerald-50/50 text-slate-700'
                  }`}
                >
                  <span className="text-3xl">🌿</span>
                  <div>
                    <div className="text-sm font-black">KHÔNG TREO CỔ</div>
                    <p className="text-[11px] text-slate-500">Tha mạng cho người này</p>
                  </div>
                </button>
              </div>
            ) : (
              /* Exact Role Guess */
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {roleOptions.map((opt) => (
                  <button
                    key={opt.role}
                    type="button"
                    onClick={() => setGuessValue(opt.role)}
                    className={`p-3 rounded-xl border-2 text-left transition flex items-center gap-2.5 cursor-pointer ${
                      guessValue === opt.role
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400 shadow-sm'
                        : 'bg-white border-w-border hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <div className="overflow-hidden">
                      <div className="font-extrabold text-xs text-slate-900">{opt.label}</div>
                      <div className="text-[10px] text-slate-500 truncate">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed font-medium">
            💡 <strong>Quy tắc điểm:</strong> Nếu quyết định đúng (Treo cổ Sói hoặc Tha cho Dân làng) nhận ngay <strong className="text-emerald-700 font-extrabold">+{potentialPoints} điểm</strong> ({basePoint} × {multiplier}). Người bị treo cổ sẽ chết và bị loại khỏi trò chơi!
          </div>
        </div>

        {/* Footer Confirm */}
        <div className="p-4 bg-w-bg-main border-t border-w-border flex items-center justify-between">
          <div className="text-xs text-slate-600 font-semibold">
            Đội đang chọn: <strong className="text-slate-900">{team.name}</strong>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-w-text-main font-black text-sm shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <span>Thực Thi Quyết Định</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
