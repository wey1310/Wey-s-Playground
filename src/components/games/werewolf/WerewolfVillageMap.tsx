import React from 'react';
import { motion } from 'motion/react';
import { Shield, Eye, Skull, Sparkles, User, HelpCircle, CheckCircle2 } from 'lucide-react';
import { NPCVillager, WerewolfRole } from './werewolfTypes';
import { PERSONALITY_PROFILES } from './werewolfVillageData';

interface WerewolfVillageMapProps {
  npcs: NPCVillager[];
  isNight: boolean;
  selectedNpcId?: string | null;
  onSelectNpc?: (npc: NPCVillager) => void;
  revealRoleOnDeath?: boolean;
  isGuessingMode?: boolean;
}

export const WerewolfVillageMap: React.FC<WerewolfVillageMapProps> = ({
  npcs,
  isNight,
  selectedNpcId,
  onSelectNpc,
  revealRoleOnDeath = false,
  isGuessingMode = false,
}) => {
  const getRoleBadge = (role: WerewolfRole) => {
    switch (role) {
      case 'werewolf':
        return { label: 'Ma Sói', color: 'bg-red-600 text-w-text-main', icon: '🐺' };
      case 'seer':
        return { label: 'Tiên Tri', color: 'bg-indigo-600 text-w-text-main', icon: '🔮' };
      case 'guard':
        return { label: 'Bảo Vệ', color: 'bg-emerald-600 text-w-text-main', icon: '🛡️' };
      case 'witch':
        return { label: 'Phù Thủy', color: 'bg-purple-600 text-w-text-main', icon: '🧪' };
      case 'hunter':
        return { label: 'Thợ Săn', color: 'bg-amber-600 text-w-text-main', icon: '🏹' };
      case 'villager':
      default:
        return { label: 'Dân Làng', color: 'bg-slate-600 text-w-text-main', icon: '🌿' };
    }
  };

  return (
    <div className={`relative rounded-3xl p-4 sm:p-6 transition-colors duration-1000 border-2 overflow-hidden shadow-2xl ${
      isNight 
        ? 'bg-gradient-to-b from-[#090d16] via-[#0f172a] to-[#050811] border-indigo-900/60 text-slate-100' 
        : 'bg-gradient-to-b from-[#f8fafc] via-[#e2e8f0] to-[#f1f5f9] border-w-border text-slate-800'
    }`}>
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute -top-10 -left-10 w-96 h-96 rounded-full blur-3xl bg-indigo-500/20" />
        <div className="absolute -bottom-10 -right-10 w-96 h-96 rounded-full blur-3xl bg-emerald-500/10" />
      </div>

      {/* Header Info */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{isNight ? '🌙' : '☀️'}</span>
          <div>
            <h3 className={`font-black text-sm sm:text-base flex items-center gap-2 ${isNight ? 'text-indigo-200' : 'text-slate-900'}`}>
              <span>Quần Thể Cư Dân (12 NPC)</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isNight ? 'bg-w-bg-alt text-indigo-300 border border-indigo-700/50' : 'bg-w-accent-light text-w-primary-dark border border-w-accent-border'
              }`}>
                {isNight ? 'Trạng thái ban đêm' : 'Bình minh đang thức giấc'}
              </span>
            </h3>
            <p className={`text-xs ${isNight ? 'text-indigo-300/70' : 'text-slate-500'}`}>
              {isGuessingMode 
                ? '🎯 Nhấp chọn 1 NPC còn sống để thực hiện điều tra và đoán vai trò!' 
                : '12 cư dân thông minh với tính cách, ký ức và mức độ hoài nghi độc lập.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 ${
            isNight ? 'bg-w-accent-light text-emerald-300 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Còn sống: {npcs.filter(n => n.isAlive).length}/12</span>
          </span>
          <span className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 ${
            isNight ? 'bg-w-accent-light text-amber-600 border border-amber-500/30' : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Đã hé lộ: {npcs.filter(n => n.isRevealed).length}</span>
          </span>
        </div>
      </div>

      {/* 12 NPC Grid (3x4 on desktop, 2x6 on tablet, 2x6 on mobile) */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {npcs.map((npc, idx) => {
          const personality = PERSONALITY_PROFILES[npc.personality];
          const isSelected = selectedNpcId === npc.id;
          const isDead = !npc.isAlive;
          const canBeSelected = isGuessingMode && npc.isAlive;

          // Determine role display
          const shouldShowRole = npc.isRevealed || (isDead && revealRoleOnDeath);
          const roleBadge = shouldShowRole ? getRoleBadge(npc.role) : null;

          return (
            <motion.div
              key={npc.id}
              whileHover={canBeSelected ? { scale: 1.04, y: -4 } : { scale: 1.01 }}
              whileTap={canBeSelected ? { scale: 0.98 } : undefined}
              onClick={() => {
                if (onSelectNpc && (!isGuessingMode || npc.isAlive)) {
                  onSelectNpc(npc);
                }
              }}
              className={`relative rounded-2xl p-3 border-2 transition-all flex flex-col justify-between select-none ${
                isDead
                  ? isNight
                    ? 'bg-w-bg-alt border-red-900/30 opacity-60 grayscale'
                    : 'bg-slate-100/60 border-slate-300 opacity-60 grayscale'
                  : isSelected
                  ? 'bg-amber-500/20 border-amber-400 ring-4 ring-amber-400/30 shadow-lg'
                  : isNight
                  ? 'bg-w-bg-alt hover:bg-w-accent-light border-indigo-800/40 shadow-sm'
                  : 'bg-white hover:bg-slate-50 border-w-border shadow-sm'
              } ${canBeSelected ? 'cursor-pointer hover:border-amber-400 hover:shadow-md' : 'cursor-default'}`}
            >
              {/* Top Badge Indicators */}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                  isNight ? 'bg-w-accent-light text-w-primary-dark' : 'bg-slate-100 text-slate-600'
                }`}>
                  #{idx + 1}
                </span>

                <div className="flex items-center gap-1">
                  {npc.isRevealed && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black flex items-center gap-0.5" title="Đã bị đội điều tra phát hiện">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>HÉ LỘ</span>
                    </span>
                  )}
                  {isDead ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-600/80 text-w-text-main font-bold flex items-center gap-0.5">
                      <Skull className="w-2.5 h-2.5" />
                      <span>TỬ NẠN</span>
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold">
                      SỐNG
                    </span>
                  )}
                </div>
              </div>

              {/* Avatar & Info */}
              <div className="flex flex-col items-center my-1.5">
                <div className="relative">
                  <div className={`w-13 h-13 sm:w-15 sm:h-15 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-inner border-2 ${
                    isDead
                      ? 'bg-w-accent-light border-w-accent-border'
                      : isNight
                      ? 'bg-w-bg-alt border-indigo-700/50'
                      : 'bg-w-bg-card border-w-accent-light'
                  }`}>
                    {isDead ? '☠️' : npc.avatar}
                  </div>

                  {/* Statement Type Icon Pin */}
                  {!isDead && npc.statement && (
                    <div 
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-w-bg-alt border border-white/30 text-xs flex items-center justify-center shadow-md cursor-help"
                      title={`${npc.statement.typeLabel}: ${npc.statement.content}`}
                    >
                      {npc.statement.icon}
                    </div>
                  )}
                </div>

                <div className="text-center mt-1.5 w-full">
                  <h4 className={`font-black text-xs sm:text-sm truncate ${
                    isDead ? 'line-through text-red-400' : isNight ? 'text-slate-100' : 'text-slate-900'
                  }`}>
                    {npc.name}
                  </h4>
                  <p className={`text-[10px] font-semibold truncate ${
                    isNight ? 'text-indigo-300/70' : 'text-slate-500'
                  }`}>
                    {npc.job} ({npc.age}t)
                  </p>
                </div>
              </div>

              {/* 🗣️ NPC Statement / Testimony Box (Thay vì tính cách) */}
              {!isDead && npc.statement ? (
                <div className={`my-1.5 p-2 rounded-xl text-[11px] leading-snug border transition-all ${
                  isNight
                    ? 'bg-w-bg-card border-indigo-900/60 text-slate-200'
                    : 'bg-[#FBF8EF] border-[#E5DEC7] text-slate-800'
                }`}>
                  <div className="flex items-center gap-1 font-bold text-[10px] mb-0.5 text-amber-500">
                    <span>{npc.statement.icon}</span>
                    <span className="uppercase tracking-wider truncate">{npc.statement.typeLabel}</span>
                  </div>
                  <p className="line-clamp-3 italic opacity-95 text-[10.5px]">
                    "{npc.statement.content}"
                  </p>
                </div>
              ) : isDead ? (
                <div className="my-1.5 p-1.5 rounded-xl bg-red-950/30 border border-red-900/40 text-[10px] text-red-400 text-center italic">
                  Đã ngừng thở trong đêm...
                </div>
              ) : null}

              {/* Role Reveal or Mystery Status */}
              <div className="mt-2 pt-2 border-t border-white/10 text-center">
                {roleBadge ? (
                  <div className={`py-1 px-1.5 rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-1 shadow-xs ${roleBadge.color}`}>
                    <span>{roleBadge.icon}</span>
                    <span className="truncate">{roleBadge.label}</span>
                  </div>
                ) : (
                  <div className={`py-1 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 ${
                    isNight ? 'bg-w-accent-light text-w-text-muted border border-w-accent-border' : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    <HelpCircle className="w-3 h-3" />
                    <span>Ẩn nhân dạng</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
