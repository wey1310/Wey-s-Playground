import React, { useState } from 'react';
import type { QuestionBank, GameSetupConfig } from "../types";
import { X, Database, Hash, PlaySquare, Trophy, Sparkles } from 'lucide-react';
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
      <div className="bg-[#FFFDF5] border-2 border-[#DED5B8] rounded-[26px] shadow-2xl w-full max-w-lg overflow-hidden relative z-10 flex flex-col max-h-[90vh] my-auto wey-paper-card">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#DED5B8] flex items-center justify-between bg-[#F8F3E5]">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚠️</span>
            <div>
              <h2 className="text-base sm:text-lg font-[800] text-[#35452E] flex items-center gap-2">
                <span>Đã Hết Câu Hỏi!</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  Lựa chọn tiếp tục
                </span>
              </h2>
              <p className="text-[11px] font-semibold text-[#74806B]">
                Trò chơi đã sử dụng hết câu hỏi trong bộ nạp hiện tại
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-500 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Main Choice Cards */}
        <div className="p-5 overflow-y-auto space-y-4">
          <p className="text-xs font-bold text-slate-700">
            Thầy/Cô vui lòng chọn một trong các phương án dưới đây để tiếp tục:
          </p>

          {/* Option 1: Nạp câu hỏi để chơi tiếp */}
          <div className="bg-white border-2 border-indigo-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                  1
                </span>
                <h3 className="font-extrabold text-sm text-indigo-950">
                  Nạp Câu Hỏi Để Chơi Tiếp
                </h3>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                Khuyên Dùng
              </span>
            </div>

            {/* Sub-choice: Bank or Number */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('refill_bank')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                  activeTab === 'refill_bank'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Từ Ngân Hàng</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('refill_number')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                  activeTab === 'refill_number'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                <span>Số Lượng Câu Ảo</span>
              </button>
            </div>

            {activeTab === 'refill_bank' && (
              <div className="space-y-1.5 animate-fade-in pt-1">
                <label className="text-[11px] font-bold text-slate-600">
                  Chọn Ngân Hàng Câu Hỏi Mới:
                </label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs"
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
                <label className="text-[11px] font-bold text-slate-600">
                  Số Lượng Câu Hỏi Ảo Cần Nạp:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={totalQuestionsNumber}
                    onChange={(e) => setTotalQuestionsNumber(Math.max(1, parseInt(e.target.value) || 10))}
                    className="w-24 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 text-center focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-500">câu hỏi số tự do</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleApplyRefill}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Nạp Câu Hỏi & Tiếp Tục Chơi Ngay</span>
            </button>
          </div>

          {/* Option 2: Tiếp tục chơi mà không nạp (Chơi tự do) */}
          <div className="bg-white border-2 border-emerald-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs">
                  2
                </span>
                <h3 className="font-extrabold text-sm text-emerald-950">
                  Tiếp Tục Chơi Tự Do (Không Cần Câu Hỏi)
                </h3>
              </div>
              <p className="text-[11px] font-medium text-slate-600 pl-8">
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
          <div className="bg-white border-2 border-rose-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-black text-xs">
                  3
                </span>
                <h3 className="font-extrabold text-sm text-rose-950">
                  Tổng Kết Trò Chơi
                </h3>
              </div>
              <p className="text-[11px] font-medium text-slate-600 pl-8">
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
        <div className="p-3.5 bg-[#F8F3E5] border-t border-[#DED5B8] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer"
          >
            Đóng Popup
          </button>
        </div>
      </div>
    </div>
  );
};

