import React from 'react';
import { motion } from 'motion/react';
import { MonopolyTile, MonopolyTeamState, EventCard } from './monopolyTypes';
import { 
  Home, 
  Hotel, 
  ShieldCheck, 
  Sparkles, 
  Coins, 
  X, 
  Check, 
  AlertCircle, 
  ArrowRight,
  TrendingUp,
  Building
} from 'lucide-react';

interface MonopolyActionModalProps {
  isOpen: boolean;
  type: 'buy' | 'upgrade' | 'rent' | 'card' | 'tax' | 'jail' | 'rest' | 'bankruptcy';
  currentTeam: MonopolyTeamState;
  tile?: MonopolyTile | null;
  ownerTeam?: MonopolyTeamState | null;
  rentAmount?: number;
  card?: EventCard | null;
  onConfirmBuy?: () => void;
  onSkipBuy?: () => void;
  onConfirmUpgrade?: () => void;
  onSkipUpgrade?: () => void;
  onPayRent?: () => void;
  onUseFreeRentShield?: () => void;
  onAcceptCard?: () => void;
  onClose?: () => void;
}

export const MonopolyActionModal: React.FC<MonopolyActionModalProps> = ({
  isOpen,
  type,
  currentTeam,
  tile,
  ownerTeam,
  rentAmount = 0,
  card,
  onConfirmBuy,
  onSkipBuy,
  onConfirmUpgrade,
  onSkipUpgrade,
  onPayRent,
  onUseFreeRentShield,
  onAcceptCard,
  onClose
}) => {
  if (!isOpen) return null;

  const canAffordBuy = tile ? currentTeam.money >= tile.price : false;
  const canAffordUpgrade = tile ? currentTeam.money >= tile.upgradeCost : false;
  const canAffordRent = currentTeam.money >= rentAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-white/70 backdrop-blur-sm backdrop-blur-xs animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-w-bg-card border-2 border-w-border w-full max-w-md rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col"
      >
        {/* BUY PROPERTY ACTION */}
        {type === 'buy' && tile && (
          <div className="p-5 sm:p-6 text-center space-y-4">
            {/* Group Banner */}
            <div
              className="py-2.5 px-4 rounded-2xl text-w-text-main font-black text-sm uppercase shadow-sm flex items-center justify-between"
              style={{ backgroundColor: tile.groupColor || '#E08283' }}
            >
              <span>{tile.groupName || 'Khu Đất'}</span>
              <span>Ô #{tile.index}</span>
            </div>

            {/* Land Info */}
            <div className="space-y-1">
              <div className="text-4xl drop-shadow-sm">{tile.icon}</div>
              <h3 className="text-xl font-black text-w-text-main">{tile.name}</h3>
              {tile.subtitle && (
                <p className="text-xs text-w-text-muted font-semibold">{tile.subtitle}</p>
              )}
            </div>

            {/* Price & Rent Details Card */}
            <div className="bg-w-bg-alt border border-[#E3DCBA] rounded-2xl p-3.5 space-y-2 text-left text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-w-text-muted">Giá mua khu đất:</span>
                <span className="text-sm font-black text-emerald-700">${tile.price}</span>
              </div>
              <div className="flex items-center justify-between font-bold">
                <span className="text-w-text-muted">Tiền thuê cơ bản (Cấp 0):</span>
                <span className="font-extrabold text-rose-700">${tile.rentLevels[0]}</span>
              </div>
              <div className="flex items-center justify-between font-bold">
                <span className="text-w-text-muted">Tiền thuê khi có Nhà / Khách sạn:</span>
                <span className="font-extrabold text-rose-700">${tile.rentLevels[1]} / ${tile.rentLevels[2]} / ${tile.rentLevels[3]}</span>
              </div>
              <div className="pt-2 border-t border-w-border flex items-center justify-between">
                <span className="text-w-text-muted">Số dư của {currentTeam.name}:</span>
                <span className={`font-black ${canAffordBuy ? 'text-emerald-700' : 'text-rose-600'}`}>
                  ${currentTeam.money.toLocaleString()}
                </span>
              </div>
            </div>

            {!canAffordBuy && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Bạn không đủ tiền để mua khu đất này!</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={onSkipBuy}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-extrabold rounded-2xl border border-slate-300 transition cursor-pointer"
              >
                Bỏ Qua
              </button>

              <button
                type="button"
                disabled={!canAffordBuy}
                onClick={onConfirmBuy}
                className={`flex-1 py-3 px-4 text-w-text-main text-xs sm:text-sm font-black rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                  canAffordBuy
                    ? 'bg-w-primary-dark hover:bg-w-primary-hover hover:scale-102 active:scale-98'
                    : 'bg-slate-300 cursor-not-allowed opacity-50'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Mua Đất (${tile.price})</span>
              </button>
            </div>
          </div>
        )}

        {/* UPGRADE PROPERTY ACTION */}
        {type === 'upgrade' && tile && (
          <div className="p-5 sm:p-6 text-center space-y-4">
            <div
              className="py-2 px-4 rounded-2xl text-w-text-main font-black text-xs uppercase shadow-sm flex items-center justify-between"
              style={{ backgroundColor: tile.groupColor || '#E08283' }}
            >
              <span>{tile.groupName || 'Khu Đất Của Bạn'}</span>
              <span>Cấp Hiện Tại: {tile.level === 0 ? 'Đất Trống' : `Nhà Cấp ${tile.level}`}</span>
            </div>

            <div className="space-y-1">
              <div className="text-4xl drop-shadow-sm">{tile.icon}</div>
              <h3 className="text-xl font-black text-w-text-main">{tile.name}</h3>
              <p className="text-xs text-w-text-muted font-semibold">
                Bạn đã đến khu đất do chính đội mình làm chủ sở hữu!
              </p>
            </div>

            <div className="bg-w-bg-alt border border-[#E3DCBA] rounded-2xl p-3.5 space-y-2 text-left text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-w-text-muted">Chi phí xây nâng cấp:</span>
                <span className="text-sm font-black text-emerald-700">${tile.upgradeCost}</span>
              </div>
              <div className="flex items-center justify-between font-bold">
                <span className="text-w-text-muted">Tiền thuê tăng từ:</span>
                <span className="font-extrabold text-rose-700">
                  ${tile.rentLevels[tile.level]} ➔ ${tile.rentLevels[Math.min(tile.level + 1, 3)]}
                </span>
              </div>
              <div className="pt-2 border-t border-w-border flex items-center justify-between">
                <span className="text-w-text-muted">Số dư của bạn:</span>
                <span className={`font-black ${canAffordUpgrade ? 'text-emerald-700' : 'text-rose-600'}`}>
                  ${currentTeam.money.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={onSkipUpgrade}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-extrabold rounded-2xl border border-slate-300 transition cursor-pointer"
              >
                Để Lần Sau
              </button>

              <button
                type="button"
                disabled={!canAffordUpgrade || tile.level >= 3}
                onClick={onConfirmUpgrade}
                className={`flex-1 py-3 px-4 text-w-text-main text-xs sm:text-sm font-black rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                  canAffordUpgrade && tile.level < 3
                    ? 'bg-w-primary-dark hover:bg-w-primary-hover hover:scale-102 active:scale-98'
                    : 'bg-slate-300 cursor-not-allowed opacity-50'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Nâng Cấp (${tile.upgradeCost})</span>
              </button>
            </div>
          </div>
        )}

        {/* PAY RENT TO OPPONENT ACTION */}
        {type === 'rent' && tile && ownerTeam && (
          <div className="p-5 sm:p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-rose-100 text-rose-700 border-2 border-rose-300 flex items-center justify-center text-3xl mx-auto shadow-xs">
              💸
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-rose-700">ĐÁP VÀO ĐẤT ĐỐI THỦ!</h3>
              <p className="text-xs text-w-text-muted font-semibold">
                Khu đất <strong className="text-w-text-main">{tile.name}</strong> thuộc sở hữu của{' '}
                <strong style={{ color: ownerTeam.color }}>{ownerTeam.name}</strong>
              </p>
            </div>

            {/* Rent Breakdown */}
            <div className="bg-w-bg-alt border border-[#E3DCBA] rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-w-text-muted">Tiền thuê đất cần nộp:</span>
                <span className="text-base font-black text-rose-700">${rentAmount}</span>
              </div>
              <div className="flex items-center justify-between font-bold">
                <span className="text-w-text-muted">Số dư của {currentTeam.name}:</span>
                <span className="font-extrabold text-w-text-main">${currentTeam.money}</span>
              </div>
            </div>

            {/* Free Rent Shield Button if has tokens */}
            {currentTeam.freeRentTokens > 0 && (
              <button
                type="button"
                onClick={onUseFreeRentShield}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-w-text-main text-xs sm:text-sm font-black rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer animate-pulse"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Dùng Thẻ Miễn Phí Thuê Đất (Còn {currentTeam.freeRentTokens} thẻ)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onPayRent}
              className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-w-text-main text-xs sm:text-sm font-black rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Coins className="w-4 h-4" />
              <span>{canAffordRent ? `Trả Tiền Thuê ($${rentAmount})` : `Phá Sản & Trả Toàn Bộ ($${currentTeam.money})`}</span>
            </button>
          </div>
        )}

        {/* EVENT / LUCK CARD DISPLAY */}
        {type === 'card' && card && (
          <div className="p-5 sm:p-6 text-center space-y-4">
            <div className={`py-1.5 px-4 rounded-xl text-w-text-main font-black text-xs uppercase shadow-xs mx-auto inline-block ${
              card.badge === 'May Mắn' ? 'bg-teal-600' :
              card.badge === 'Cơ Hội' ? 'bg-purple-600' :
              card.badge === 'Thử Thách' ? 'bg-amber-600' : 'bg-rose-600'
            }`}>
              🎴 Thẻ {card.badge}
            </div>

            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-amber-300 flex items-center justify-center text-4xl mx-auto shadow-sm animate-bounce">
              {card.icon}
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-w-text-main">{card.title}</h3>
              <p className="text-xs sm:text-sm text-w-text-muted font-bold leading-relaxed px-2 bg-w-bg-alt p-3 rounded-2xl border border-[#E3DCBA]">
                {card.description}
              </p>
            </div>

            <button
              type="button"
              onClick={onAcceptCard}
              className="w-full py-3 px-4 bg-w-primary-dark hover:bg-w-primary-hover text-w-text-main text-xs sm:text-sm font-black rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Áp Dụng Thẻ Ngay</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
