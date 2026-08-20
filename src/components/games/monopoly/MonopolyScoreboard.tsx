import React from 'react';
import { motion } from 'motion/react';
import { MonopolyTeamState, MonopolyTile, MonopolyTransactionLog } from './monopolyTypes';
import { 
  Building, 
  Coins, 
  Trophy, 
  Clock, 
  ShieldAlert, 
  History, 
  Home, 
  Sparkles,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

interface MonopolyScoreboardProps {
  teams: MonopolyTeamState[];
  tiles: MonopolyTile[];
  currentTeamIndex: number;
  logs: MonopolyTransactionLog[];
  winCondition: 'bankruptcy' | 'time_limit' | 'target_wealth';
  targetWealth?: number;
  gameTimeRemaining?: number | null; // in seconds
  onInspectTeam: (team: MonopolyTeamState) => void;
  onOpenRules?: () => void;
}

export const MonopolyScoreboard: React.FC<MonopolyScoreboardProps> = ({
  teams,
  tiles,
  currentTeamIndex,
  logs,
  winCondition,
  targetWealth = 3000,
  gameTimeRemaining,
  onInspectTeam,
}) => {
  // Calculate total net worth for each team (Cash + Property cost + Upgrades cost)
  const calculateNetWorth = (team: MonopolyTeamState) => {
    let propValue = 0;
    team.properties.forEach(pIdx => {
      const tile = tiles.find(t => t.index === pIdx);
      if (tile) {
        propValue += tile.price + (tile.level * tile.upgradeCost);
      }
    });
    return team.money + propValue;
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Top Banner: Win Condition & Timer */}
      <div className="bg-[#FFFDF5] border border-[#DED5B8] rounded-2xl p-3 shadow-xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#E9F0D9] text-[#4F683C] flex items-center justify-center font-bold text-sm">
            🎲
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#74806B]">
              Chế Độ Thắng
            </div>
            <div className="text-xs font-black text-[#35452E] flex items-center gap-1.5">
              {winCondition === 'bankruptcy' && 'Độc Tôn Thị Trường (Phá Sản)'}
              {winCondition === 'time_limit' && 'Chạy Đua Thời Gian'}
              {winCondition === 'target_wealth' && `Chạm Mốc $${targetWealth.toLocaleString()}`}
            </div>
          </div>
        </div>

        {gameTimeRemaining !== null && gameTimeRemaining !== undefined && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-black">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>Thời Gian: {formatTime(gameTimeRemaining)}</span>
          </div>
        )}
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
        {teams.map((team, idx) => {
          const isCurrentTurn = idx === currentTeamIndex;
          const netWorth = calculateNetWorth(team);
          const ownedTiles = tiles.filter(t => t.ownerTeamId === team.id);

          return (
            <motion.div
              key={team.id}
              onClick={() => onInspectTeam(team)}
              animate={isCurrentTurn ? { scale: 1.02 } : { scale: 1 }}
              className={`relative rounded-2xl p-3 sm:p-3.5 transition-all cursor-pointer border-2 flex flex-col justify-between ${
                team.isBankrupt
                  ? 'bg-slate-100/70 border-slate-300 opacity-60 grayscale'
                  : isCurrentTurn
                  ? 'bg-white border-[#4F683C] shadow-md ring-2 ring-[#4F683C]/20'
                  : 'bg-[#FFFDF5] border-[#DED5B8] hover:border-[#B9CDA0] hover:bg-white shadow-xs'
              }`}
            >
              {/* Header: Avatar, Name & Turn Pill */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl border-2 border-white shadow-xs flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: team.color }}
                  >
                    <span>{team.avatar}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-extrabold text-[#35452E] truncate flex items-center gap-1.5">
                      <span>{team.name}</span>
                      {isCurrentTurn && !team.isBankrupt && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse shrink-0">
                          Đang Đi
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-[#74806B] font-bold">
                      <span>Đúng: {team.correctAnswersCount}/{team.totalQuestionsAnswered} câu</span>
                      {team.freeRentTokens > 0 && (
                        <span className="text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                          🛡️ Khiên x{team.freeRentTokens}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bankrupt or In Jail Badges */}
                {team.isBankrupt && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-300 uppercase">
                    Phá Sản
                  </span>
                )}
                {team.inJail && !team.isBankrupt && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 border border-slate-400">
                    🔒 Trong Tù ({team.jailTurnsRemaining} lượt)
                  </span>
                )}
              </div>

              {/* Financial Stats Bar */}
              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[#DED5B8]/60 text-center">
                <div className="bg-[#FAF7EE] p-1.5 rounded-xl border border-[#E3DCBA]/60">
                  <div className="text-[9px] font-bold text-[#74806B] uppercase">Tiền Mặt</div>
                  <div className="text-xs sm:text-sm font-black text-emerald-700">
                    ${team.money.toLocaleString()}
                  </div>
                </div>

                <div className="bg-[#FAF7EE] p-1.5 rounded-xl border border-[#E3DCBA]/60">
                  <div className="text-[9px] font-bold text-[#74806B] uppercase">Khu Đất</div>
                  <div className="text-xs sm:text-sm font-black text-[#35452E] flex items-center justify-center gap-1">
                    <Home className="w-3 h-3 text-[#4F683C]" />
                    <span>{ownedTiles.length}</span>
                  </div>
                </div>

                <div className="bg-[#FAF7EE] p-1.5 rounded-xl border border-[#E3DCBA]/60">
                  <div className="text-[9px] font-bold text-[#74806B] uppercase">Tổng Tài Sản</div>
                  <div className="text-xs sm:text-sm font-black text-[#4F683C]">
                    ${netWorth.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="mt-1.5 text-[9px] font-bold text-[#74806B] flex items-center justify-end gap-1 hover:text-[#4F683C]">
                <span>Xem chi tiết tài sản</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Transaction & Activity Log Feed */}
      <div className="bg-[#FFFDF5] border border-[#DED5B8] rounded-2xl p-3 shadow-xs flex-1 max-h-48 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#74806B] mb-2 pb-1 border-b border-[#DED5B8]/60 sticky top-0 bg-[#FFFDF5]">
          <History className="w-3.5 h-3.5 text-[#4F683C]" />
          <span>Nhật Ký Giao Dịch</span>
        </div>

        {logs.length === 0 ? (
          <div className="text-xs text-[#74806B] italic text-center py-4">
            Chưa có giao dịch nào diễn ra...
          </div>
        ) : (
          <div className="space-y-1.5">
            {logs.slice(0, 15).map((log) => (
              <div
                key={log.id}
                className="text-[11px] font-medium text-[#35452E] flex items-start gap-1.5 p-1 rounded-lg hover:bg-[#FAF7EE]"
              >
                <span className="shrink-0">{log.teamAvatar}</span>
                <div className="flex-1 leading-tight">
                  <strong className="font-extrabold text-[#35452E]">{log.teamName}</strong>: {log.description}
                </div>
                {log.amount && (
                  <span className={`text-[10px] font-black shrink-0 ${
                    log.type === 'rent' || log.type === 'tax' || log.type === 'buy'
                      ? 'text-rose-600'
                      : 'text-emerald-700'
                  }`}>
                    {log.type === 'rent' || log.type === 'tax' || log.type === 'buy' ? `-$${log.amount}` : `+$${log.amount}`}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
