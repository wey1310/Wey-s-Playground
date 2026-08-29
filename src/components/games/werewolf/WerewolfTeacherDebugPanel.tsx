import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Eye, Key, X, ChevronDown, ChevronUp, AlertCircle, Sparkles } from 'lucide-react';
import { NPCVillager, NightAction, WerewolfRole, NightResolution } from './werewolfTypes';
import { PERSONALITY_PROFILES } from './werewolfVillageData';

interface WerewolfTeacherDebugPanelProps {
  npcs: NPCVillager[];
  nightHistory: NightResolution[];
  isOpen: boolean;
  onClose: () => void;
}

export const WerewolfTeacherDebugPanel: React.FC<WerewolfTeacherDebugPanelProps> = ({
  npcs,
  nightHistory,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'roles' | 'suspicion' | 'actions'>('roles');
  const [selectedNpcId, setSelectedNpcId] = useState<string>(npcs[0]?.id || '');

  if (!isOpen) return null;

  const selectedNpc = npcs.find(n => n.id === selectedNpcId);

  const getRoleLabel = (role: WerewolfRole) => {
    switch (role) {
      case 'werewolf':
        return { text: 'Ma Sói (Bóng đêm)', color: 'bg-red-600 text-white' };
      case 'seer':
        return { text: 'Tiên Tri (Soi nhân dạng)', color: 'bg-indigo-600 text-white' };
      case 'guard':
        return { text: 'Bảo Vệ (Khiên thần)', color: 'bg-emerald-600 text-white' };
      case 'witch':
        return { text: 'Phù Thủy (Cứu/Độc)', color: 'bg-purple-600 text-white' };
      case 'hunter':
        return { text: 'Thợ Săn (Bắn trả)', color: 'bg-amber-600 text-white' };
      case 'villager':
      default:
        return { text: 'Dân Làng', color: 'bg-slate-600 text-white' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md select-none animate-fade-in">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-4xl bg-zinc-900 border-2 border-indigo-500/50 rounded-3xl text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 bg-zinc-950 border-b border-indigo-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>BẢNG ĐIỀU KHIỂN BÍ MẬT DÀNH CHO GIÁO VIÊN</span>
                <span className="text-[10px] bg-red-950 text-red-300 px-2 py-0.5 rounded border border-red-700 font-bold uppercase">
                  Teacher Secret Debug
                </span>
              </h3>
              <p className="text-[11px] text-w-text-muted">
                Toàn bộ vai trò thật, ma trận hoài nghi và lịch sử hành động AI ban đêm.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-w-accent-light hover:bg-slate-700 text-w-primary-dark transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-w-border bg-w-bg-card px-4 gap-2 pt-2">
          {[
            { id: 'roles', label: '🎭 Danh Sách 12 Vai Trò Thật' },
            { id: 'suspicion', label: '🧠 Trí Nhớ & Hoài Nghi AI' },
            { id: 'actions', label: '📜 Nhật Ký Đêm Của AI' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-black rounded-t-xl transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-w-bg-alt text-indigo-300 border-t-2 border-indigo-400'
                  : 'text-w-text-muted hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'roles' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {npcs.map(npc => {
                const roleBadge = getRoleLabel(npc.role);
                const personality = PERSONALITY_PROFILES[npc.personality];

                return (
                  <div
                    key={npc.id}
                    className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                      !npc.isAlive
                        ? 'bg-w-bg-card border-red-900/50 opacity-70'
                        : 'bg-w-accent-light border-w-accent-border'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{npc.avatar}</span>
                      <div className="overflow-hidden flex-1">
                        <div className="font-extrabold text-sm text-w-text-main flex items-center justify-between">
                          <span>{npc.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                            npc.isAlive ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-red-950 text-red-300 border border-red-700'
                          }`}>
                            {npc.isAlive ? 'SỐNG' : 'TỬ NẠN'}
                          </span>
                        </div>
                        <div className="text-xs text-w-text-muted truncate">
                          {npc.job} • {npc.age} tuổi
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-w-accent-border">
                      <div className={`px-2.5 py-1 rounded-lg text-xs font-black text-center ${roleBadge.color}`}>
                        {roleBadge.text}
                      </div>

                      <div className="text-[11px] text-w-text-muted flex items-center justify-between">
                        <span>Tính cách: <strong>{personality?.name}</strong> {personality?.badge}</span>
                        {npc.isRevealed && (
                          <span className="text-amber-600 font-bold">⭐ Đã hé lộ</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'suspicion' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* NPC Selector List */}
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                <span className="text-xs font-black text-w-text-muted uppercase block mb-1">
                  Chọn NPC để kiểm tra AI state:
                </span>
                {npcs.map(npc => (
                  <button
                    key={npc.id}
                    onClick={() => setSelectedNpcId(npc.id)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                      selectedNpcId === npc.id
                        ? 'bg-w-bg-alt border-indigo-400 text-w-text-main shadow-sm'
                        : 'bg-w-accent-light border-w-accent-border text-w-primary-dark hover:bg-slate-750'
                    }`}
                  >
                    <span className="text-xl">{npc.avatar}</span>
                    <div className="flex-1 overflow-hidden">
                      <div className="font-bold text-xs truncate">{npc.name} ({npc.role})</div>
                      <div className="text-[10px] text-w-text-muted">{npc.job}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Detailed AI Brain State */}
              <div className="md:col-span-2 bg-w-bg-card p-4 rounded-2xl border border-w-border space-y-4">
                {selectedNpc ? (
                  <>
                    <div className="flex items-center justify-between pb-3 border-b border-w-border">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{selectedNpc.avatar}</span>
                        <div>
                          <h4 className="font-black text-sm text-w-text-main flex items-center gap-2">
                            <span>{selectedNpc.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-200">
                              {selectedNpc.role.toUpperCase()}
                            </span>
                          </h4>
                          <p className="text-xs text-w-text-muted">
                            Nỗi sợ: {Math.round(selectedNpc.behaviorState.fearLevel * 100)}% • Cảnh giác: {Math.round(selectedNpc.behaviorState.alertness * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Suspicion Scores toward others */}
                    <div>
                      <h5 className="text-xs font-black text-amber-600 uppercase mb-2">
                        👁️ Điểm Hoài Nghi Đối Với Các NPC Khác (0.00 - 1.00):
                      </h5>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(selectedNpc.suspicion).map(([targetId, score]) => {
                          const target = npcs.find(n => n.id === targetId);
                          return (
                            <div key={targetId} className="p-2 bg-w-bg-alt rounded-lg border border-w-border text-[11px] flex items-center justify-between">
                              <span className="truncate text-w-primary-dark">{target?.name || targetId}:</span>
                              <span className={`font-mono font-black ${
                                score >= 0.7 ? 'text-red-400' : score >= 0.4 ? 'text-yellow-400' : 'text-emerald-400'
                              }`}>
                                {score.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Memory Entries */}
                    <div>
                      <h5 className="text-xs font-black text-cyan-300 uppercase mb-2">
                        📜 Trí Nhớ & Chuỗi Sự Kiện Đã Chứng Kiến:
                      </h5>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {selectedNpc.memory.map((m, i) => (
                          <div key={i} className="p-2 bg-w-bg-alt rounded-lg text-xs text-w-primary-dark border border-w-border">
                            {m.event}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-500">Chưa chọn NPC</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-4">
              {nightHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Chưa có đêm nào diễn ra. Bắt đầu Đêm 1 để ghi nhận hành động AI!
                </div>
              ) : (
                nightHistory.map(item => (
                  <div key={item.night} className="p-4 bg-w-bg-card rounded-2xl border border-w-border space-y-2">
                    <h4 className="text-xs font-black text-indigo-400 uppercase flex items-center gap-2">
                      <span>🌙 Đêm {item.night}</span>
                      <span className="text-[10px] text-slate-500">({item.actionsTaken.length} hành động)</span>
                    </h4>

                    <div className="space-y-1.5">
                      {item.actionsTaken.map((act, i) => (
                        <div key={i} className="p-2.5 bg-zinc-800/80 rounded-xl text-xs flex items-center justify-between border border-zinc-700">
                          <div>
                            <strong className="text-zinc-100">{act.actorName} ({act.role}):</strong>{' '}
                            <span className="text-amber-300">{act.reason || act.actionType}</span>
                          </div>
                          {act.targetName && (
                            <span className="px-2 py-0.5 rounded bg-zinc-900 text-indigo-300 border border-indigo-700 text-[11px] font-bold shrink-0 ml-2">
                              Mục tiêu: {act.targetName}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition cursor-pointer"
          >
            Đóng Panel Debug
          </button>
        </div>
      </motion.div>
    </div>
  );
};
