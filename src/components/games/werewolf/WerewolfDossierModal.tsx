import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Award, Skull, RotateCcw, Home, Sparkles, CheckCircle2 } from 'lucide-react';
import { NPCVillager, WerewolfRole, WerewolfTeamState } from './werewolfTypes';
import { PERSONALITY_PROFILES } from './werewolfVillageData';

interface WerewolfDossierModalProps {
  teams: WerewolfTeamState[];
  npcs: NPCVillager[];
  totalNights: number;
  onPlayAgain: () => void;
  onBackToHome: () => void;
}

export const WerewolfDossierModal: React.FC<WerewolfDossierModalProps> = ({
  teams,
  npcs,
  totalNights,
  onPlayAgain,
  onBackToHome,
}) => {
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
  const winner = sortedTeams[0];

  const aliveWolves = npcs.filter(n => n.role === 'werewolf' && n.isAlive);
  const isVillagersWin = aliveWolves.length === 0;

  const getRoleLabel = (role: WerewolfRole) => {
    switch (role) {
      case 'werewolf':
        return { text: 'Ma Sói', color: 'bg-red-600 text-w-text-main', icon: '🐺' };
      case 'seer':
        return { text: 'Tiên Tri', color: 'bg-indigo-600 text-w-text-main', icon: '🔮' };
      case 'guard':
        return { text: 'Bảo Vệ', color: 'bg-emerald-600 text-w-text-main', icon: '🛡️' };
      case 'witch':
        return { text: 'Phù Thủy', color: 'bg-purple-600 text-w-text-main', icon: '🧪' };
      case 'hunter':
        return { text: 'Thợ Săn', color: 'bg-amber-600 text-w-text-main', icon: '🏹' };
      case 'villager':
      default:
        return { text: 'Dân Làng', color: 'bg-slate-600 text-w-text-main', icon: '🌿' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-white/70 backdrop-blur-sm backdrop-blur-md select-none overflow-y-auto animate-fade-in">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-4xl bg-w-bg-card border-2 border-w-border rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Header Banner */}
        <div className={`p-5 sm:p-6 text-w-text-main text-center relative overflow-hidden shrink-0 ${
          isVillagersWin
            ? 'bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-800'
            : 'bg-gradient-to-r from-red-950 via-slate-900 to-red-950'
        }`}>
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-white/20 text-w-text-main uppercase tracking-widest mb-2 shadow-xs border border-white/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isVillagersWin ? '🎉 DÂN LÀNG TOÀN THẮNG' : '🐺 MA SÓI CHIẾM LÀNG'} ({totalNights} Đêm)</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-w-text-main">
              {isVillagersWin 
                ? '🏆 TOÀN BỘ MA SÓI ĐÃ BỊ VẠCH TRẦN & TIÊU DIỆT!' 
                : '☠️ BẦY MA SÓI ĐÃ ÁP ĐẢO & THỐNG TRỊ NGÔI LÀNG!'}
            </h2>
            <p className="text-xs text-w-text-main/90 font-medium mt-1">
              {isVillagersWin
                ? 'Ngôi làng đã tìm lại được ánh sáng hòa bình nhờ sự tài trí của các điều tra viên!'
                : 'Màn đêm vĩnh cửu bao trùm ngôi làng, các cư dân lương thiện đã gục ngã.'}
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* 1. Team Leaderboard Ranking */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-w-text-main mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Thứ Hạng & Điểm Số Các Đội Điều Tra</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {sortedTeams.map((team, idx) => {
                const isChampion = idx === 0;

                return (
                  <div
                    key={team.id}
                    className={`p-4 rounded-2xl border-2 transition relative flex flex-col justify-between ${
                      isChampion
                        ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/40 shadow-md'
                        : 'bg-white border-w-border'
                    }`}
                  >
                    {isChampion && (
                      <div className="absolute -top-3 right-3 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] shadow-sm flex items-center gap-1">
                        <span>👑 QUÁN QUÂN</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black shadow-xs text-w-text-main"
                        style={{ backgroundColor: team.color }}
                      >
                        {team.avatar}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="text-[11px] font-bold text-slate-500">
                          Hạng #{idx + 1}
                        </div>
                        <h4 className="font-black text-sm text-slate-900 truncate">
                          {team.name}
                        </h4>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-w-border flex items-center justify-between">
                      <div className="text-xs text-slate-600">
                        Đoán trúng: <strong>{team.correctGuessesCount}</strong>
                      </div>
                      <div className="text-lg font-black text-w-primary-dark">
                        {team.score} đ
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Full Village Dossier (Hồ Sơ Ngôi Làng 12 NPC) */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-w-text-main mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-w-primary-dark" />
              <span>Hồ Sơ Toàn Bộ 12 Cư Dân (Hé Lộ Nhân Dạng Thật)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {npcs.map(npc => {
                const roleBadge = getRoleLabel(npc.role);

                return (
                  <div
                    key={npc.id}
                    className={`p-3 rounded-2xl border-2 flex flex-col justify-between ${
                      !npc.isAlive
                        ? 'bg-slate-100 border-slate-300 opacity-75'
                        : 'bg-white border-w-border'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-1">{npc.avatar}</div>
                      <h5 className="font-extrabold text-xs text-slate-900 truncate">{npc.name}</h5>
                      <p className="text-[10px] text-slate-500 truncate">{npc.job}</p>
                    </div>

                    {npc.statement && (
                      <div className="my-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[9.5px] leading-tight text-slate-700 line-clamp-2 italic">
                        "{npc.statement.content}"
                      </div>
                    )}

                    <div className="mt-1 pt-1.5 border-t border-[#E5DEC7] space-y-1">
                      <div className={`px-1.5 py-0.5 rounded-lg text-[10px] font-black text-center ${roleBadge.color}`}>
                        {roleBadge.icon} {roleBadge.text}
                      </div>
                      <div className="text-[9px] text-center text-slate-500 font-semibold">
                        {npc.isAlive ? '✨ Còn sống' : '☠️ Đã tử nạn'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-w-bg-main border-t border-w-border flex items-center justify-between">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-w-border transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Về Màn Hình Chính</span>
          </button>

          <button
            onClick={onPlayAgain}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-w-text-main font-black text-xs shadow-md transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Chơi Ván Mới (Reset Toàn Bộ NPC)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
