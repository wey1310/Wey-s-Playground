import React, { useState } from 'react';
import type { QuestionBank, GameSetupConfig } from "../types";
import { X, Database, Hash, PlaySquare, Trophy, RefreshCw } from 'lucide-react';
import { safeAlert } from '../utils/safeAlert';

interface RefillQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  banks: QuestionBank[];
  currentConfig: GameSetupConfig;
  onConfirm: (updates: Partial<GameSetupConfig>) => void;
  onSummary?: () => void;
}

export const RefillQuestionsModal: React.FC<RefillQuestionsModalProps> = ({
  isOpen,
  onClose,
  banks,
  currentConfig,
  onConfirm,
  onSummary,
}) => {
  const [activeTab, setActiveTab] = useState<'refill_bank' | 'refill_number' | 'free_play'>('refill_bank');
  const [selectedBankId, setSelectedBankId] = useState<string>(
    currentConfig.selectedBankId || (banks[0]?.id || '')
  );
  const [totalQuestionsNumber, setTotalQuestionsNumber] = useState<number>(
    currentConfig.totalQuestionsNumber || 10
  );

  if (!isOpen) return null;

  const handleApplyRefill = () => {
    if (activeTab === 'refill_bank') {
      const selectedBank = banks.find(b => b.id === selectedBankId);
      if (!selectedBank || (selectedBank.questions || []).length === 0) {
        safeAlert('Ngân hàng câu hỏi này đang trống! Vui lòng chọn ngân hàng khác.');
        return;
      }
      onConfirm({
        mode: 'bank',
        selectedBankId: selectedBankId,
        totalQuestionsNumber: selectedBank.questions.length,
      });
    } else if (activeTab === 'refill_number') {
      if (totalQuestionsNumber < 1 || totalQuestionsNumber > 1000) {
        safeAlert('Số lượng câu hỏi phải từ 1 đến 1000.');
        return;
      }
      onConfirm({
        mode: 'number',
        totalQuestionsNumber,
      });
    } else {
      onConfirm({ mode: 'none' });
    }
    onClose();
  };

  const handleFreePlay = () => {
    onConfirm({ mode: 'none' });
    onClose();
  };

  const handleEndGameSummary = () => {
    onClose();
    if (onSummary) {
      onSummary();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-w-bg-card border-2 border-w-border rounded-[26px] shadow-2xl w-full max-w-lg overflow-hidden relative z-10 flex flex-col max-h-[90vh] my-auto wey-paper-card">
        {/* Header */}
        <div className="px-5 py-4 border-b border-w-border flex items-center justify-between bg-w-bg-main">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚠️</span>
            <div>
              <h2 className="text-base sm:text-lg font-[800] text-w-text-main flex items-center gap-2">
                <span>Đã Hết Câu Hỏi!</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-400/30">
                  Lựa chọn tiếp tục
                </span>
              </h2>
              <p className="text-[11px] font-semibold text-w-text-muted">
                Trò chơi đã sử dụng hết câu hỏi trong bộ nạp hiện tại
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-w-bg-alt rounded-xl text-w-text-muted hover:text-w-text-main transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Main Choice Cards */}
        <div className="p-5 overflow-y-auto space-y-4">
          <p className="text-xs font-bold text-w-text-muted">
            Thầy/Cô vui lòng chọn một trong các phương án dưới đây để tiếp tục:
          </p>

          {/* Option 1: Nạp câu hỏi để chơi tiếp */}
          <div className="bg-w-bg-card border-2 border-w-border rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-w-accent-light text-w-primary flex items-center justify-center font-black text-xs border border-w-accent-border">
                  1
                </span>
                <h3 className="font-extrabold text-sm text-w-text-main">
                  Nạp Câu Hỏi Để Chơi Tiếp
                </h3>
              </div>
              <span className="text-[10px] font-bold text-w-primary bg-w-accent-light px-2 py-0.5 rounded-lg border border-w-accent-border">
                Khuyên Dùng
              </span>
            </div>

            {/* Sub-choice: Bank or Number */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('refill_bank')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                  activeTab === 'refill_bank'
                    ? 'bg-w-primary text-white border-w-primary-dark shadow-xs'
                    : 'bg-w-bg-alt text-w-text-muted border-w-border hover:bg-w-accent-light hover:text-w-text-main'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Từ Ngân Hàng</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('refill_number')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                  activeTab === 'refill_number'
                    ? 'bg-w-primary text-white border-w-primary-dark shadow-xs'
                    : 'bg-w-bg-alt text-w-text-muted border-w-border hover:bg-w-accent-light hover:text-w-text-main'
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                <span>Số Lượng Câu Ảo</span>
              </button>
            </div>

            {activeTab === 'refill_bank' && (
              <div className="space-y-1.5 animate-fade-in pt-1">
                <label className="text-[11px] font-bold text-w-text-muted">
                  Chọn Ngân Hàng Câu Hỏi Mới:
                </label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full bg-w-input-bg border border-w-input-border rounded-xl px-3 py-2 text-xs font-bold text-w-text-main focus:outline-none focus:border-w-primary shadow-xs"
                >
                  <option value="" disabled>-- Chọn Ngân Hàng --</option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name} ({bank.questions?.length || 0} câu)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === 'refill_number' && (
              <div className="space-y-1.5 animate-fade-in pt-1">
                <label className="text-[11px] font-bold text-w-text-muted">
                  Số Lượng Câu Hỏi Ảo Cần Nạp:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={totalQuestionsNumber}
                    onChange={(e) => setTotalQuestionsNumber(Math.max(1, parseInt(e.target.value) || 10))}
                    className="w-24 bg-w-input-bg border border-w-input-border rounded-xl px-3 py-1.5 text-xs font-bold text-w-text-main text-center focus:outline-none focus:border-w-primary"
                  />
                  <span className="text-xs font-medium text-w-text-muted">câu hỏi số tự do</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleApplyRefill}
              className="w-full py-2.5 wey-btn-primary text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Nạp Câu Hỏi & Tiếp Tục Chơi Ngay</span>
            </button>
          </div>

          {/* Option 2: Tiếp tục chơi mà không nạp (Chơi tự do) */}
          <div className="bg-w-bg-card border-2 border-emerald-500/30 rounded-2xl p-4 shadow-sm flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-black text-xs border border-emerald-500/30">
                  2
                </span>
                <h3 className="font-extrabold text-sm text-w-text-main">
                  Tiếp Tục Chơi Tự Do (Không Cần Câu Hỏi)
                </h3>
              </div>
              <p className="text-[11px] font-medium text-w-text-muted pl-8">
                Chuyển ván đấu sang lượt đi tự do: các đội lần lượt đi nước cờ / thao tác trên bàn cờ mà không cần random câu hỏi nữa.
              </p>
            </div>

            <button
              type="button"
              onClick={handleFreePlay}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlaySquare className="w-4 h-4 text-emerald-100" />
              <span>Chuyển Sang Chơi Tự Do</span>
            </button>
          </div>

          {/* Option 3: Tổng kết trò chơi */}
          <div className="bg-w-bg-card border-2 border-rose-500/30 rounded-2xl p-4 shadow-sm flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-rose-500/15 text-rose-600 flex items-center justify-center font-black text-xs border border-rose-500/30">
                  3
                </span>
                <h3 className="font-extrabold text-sm text-w-text-main">
                  Tổng Kết Trò Chơi
                </h3>
              </div>
              <p className="text-[11px] font-medium text-w-text-muted pl-8">
                Kết thúc ván đấu ngay bây giờ và chuyển thẳng tới màn hình vinh danh, xếp hạng điểm số và nhật ký trả lời.
              </p>
            </div>

            <button
              type="button"
              onClick={handleEndGameSummary}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-200" />
              <span>Kết Thúc & Mở Bảng Tổng Kết</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-w-bg-main border-t border-w-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-w-bg-card hover:bg-w-accent-light text-w-text-main text-xs font-bold rounded-xl border border-w-border transition cursor-pointer"
          >
            Đóng Popup
          </button>
        </div>
      </div>
    </div>
  );
};

