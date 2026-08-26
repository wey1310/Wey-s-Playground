import React from 'react';
import { motion } from 'motion/react';
import { MonopolyTile, MonopolyTeamState } from './monopolyTypes';
import { 
  X, 
  Home, 
  Hotel, 
  Coins, 
  Building, 
  ShieldCheck, 
  Sparkles, 
  Trophy,
  CheckCircle2
} from 'lucide-react';

interface MonopolyAssetModalProps {
  isOpen: boolean;
  team: MonopolyTeamState | null;
  tiles: MonopolyTile[];
  onClose: () => void;
}

export const MonopolyAssetModal: React.FC<MonopolyAssetModalProps> = ({
  isOpen,
  team,
  tiles,
  onClose
}) => {
  if (!isOpen || !team) return null;

  const ownedTiles = tiles.filter(t => t.ownerTeamId === team.id);

  let totalPropertyValue = 0;
  ownedTiles.forEach(t => {
    totalPropertyValue += t.price + (t.level * t.upgradeCost);
  });

  const netWorth = team.money + totalPropertyValue;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-white/70 backdrop-blur-sm backdrop-blur-xs animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-w-bg-card border-2 border-w-border w-full max-w-lg rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div
          className="p-4 sm:p-5 flex items-center justify-between text-w-text-main"
          style={{ backgroundColor: team.color }}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center text-2xl shadow-xs">
              {team.avatar}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black">{team.name}</h3>
              <p className="text-xs text-w-text-main/80 font-bold">Danh Mục Tài Sản & Bất Động Sản</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-w-text-main transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Quick Financial Summary */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-w-bg-alt rounded-2xl border border-[#E3DCBA]">
              <div className="text-[10px] font-bold text-w-text-muted uppercase">Tiền Mặt</div>
              <div className="text-sm sm:text-base font-black text-emerald-700">
                ${team.money.toLocaleString()}
              </div>
            </div>

            <div className="p-3 bg-w-bg-alt rounded-2xl border border-[#E3DCBA]">
              <div className="text-[10px] font-bold text-w-text-muted uppercase">Giá Trị Đất</div>
              <div className="text-sm sm:text-base font-black text-w-primary-dark">
                ${totalPropertyValue.toLocaleString()}
              </div>
            </div>

            <div className="p-3 bg-w-bg-alt rounded-2xl border border-[#E3DCBA]">
              <div className="text-[10px] font-bold text-w-text-muted uppercase">Tổng Tài Sản</div>
              <div className="text-sm sm:text-base font-black text-w-text-main">
                ${netWorth.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Cards & Special Items Held */}
          {team.freeRentTokens > 0 && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-700" />
                <div>
                  <div className="text-xs font-black text-purple-900">Thẻ Miễn Phí Thuê Đất VIP</div>
                  <div className="text-[10px] text-purple-700 font-bold">Bảo vệ bạn khỏi 1 lần trả tiền thuê</div>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 bg-purple-600 text-w-text-main rounded-xl">
                x{team.freeRentTokens}
              </span>
            </div>
          )}

          {/* Owned Properties List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-w-text-muted">
              <span>Khu Đất Sở Hữu ({ownedTiles.length})</span>
              <span>Tiền Thuê Hiện Tại</span>
            </div>

            {ownedTiles.length === 0 ? (
              <div className="text-center py-6 text-xs font-bold text-w-text-muted bg-w-bg-alt rounded-2xl border border-[#E3DCBA] italic">
                Đội này chưa mua khu đất nào...
              </div>
            ) : (
              <div className="space-y-2">
                {ownedTiles.map(tile => {
                  const currentRent = tile.rentLevels[tile.level] || tile.baseRent;
                  return (
                    <div
                      key={tile.id}
                      className="p-3 bg-white border border-w-border rounded-2xl shadow-2xs flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 text-w-text-main"
                          style={{ backgroundColor: tile.groupColor || '#E08283' }}
                        >
                          {tile.icon}
                        </div>
                        <div>
                          <div className="text-xs font-black text-w-text-main flex items-center gap-1.5">
                            <span>{tile.name}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              Ô #{tile.index}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-w-text-muted font-bold">
                            <span>{tile.groupName}</span>
                            <span>•</span>
                            <span className="text-w-primary-dark flex items-center gap-0.5">
                              {tile.level === 0 && 'Đất trống'}
                              {tile.level === 1 && 'Nhà cấp 1 🏠'}
                              {tile.level === 2 && 'Nhà cấp 2 🏠🏠'}
                              {tile.level >= 3 && 'Khách sạn 🏨'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-black text-rose-700">
                          ${currentRent}
                        </div>
                        <div className="text-[10px] text-w-text-muted font-bold">
                          Giá mua: ${tile.price}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-w-bg-alt border-t border-w-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-w-primary-dark hover:bg-w-primary-hover text-w-text-main text-xs font-black rounded-xl shadow-xs transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </motion.div>
    </div>
  );
};
