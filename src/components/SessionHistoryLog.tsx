import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Clock, 
  ArrowDownUp, 
  Copy, 
  Check, 
  Trash2, 
  Sparkles,
  Users
} from 'lucide-react';
import { soundFx } from '../utils/audio';

export interface SessionCallRecord {
  id: string;
  roundNumber: number;
  timestamp: number;
  batchSize: number;
  students: {
    name: string;
    status: 'correct' | 'help' | 'incorrect' | 'called';
    score: number;
  }[];
}

interface SessionHistoryLogProps {
  history: SessionCallRecord[];
  onToggleStudentStatus?: (recordId: string, studentName: string) => void;
  onClearHistory?: () => void;
  studentScores?: Record<string, number>;
  totalCalledCount?: number;
  title?: string;
  className?: string;
}

export const SessionHistoryLog: React.FC<SessionHistoryLogProps> = ({
  history,
  onToggleStudentStatus,
  onClearHistory,
  studentScores = {},
  totalCalledCount,
  title = 'Nhật Ký Gọi Tên Phiên Này',
  className = '',
}) => {
  // Most recent entries displayed at the top by default ('desc')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [copyToast, setCopyToast] = useState<boolean>(false);

  // Copy full session history to clipboard
  const handleCopyHistory = () => {
    if (history.length === 0) return;
    const lines: string[] = [
      `📋 NHẬT KÝ GỌI TÊN TRONG PHIÊN - WEY PLAY`,
      `Thời gian: ${new Date().toLocaleTimeString('vi-VN')} (${new Date().toLocaleDateString('vi-VN')})`,
      `Tổng số lượt gọi: ${history.length} lượt`,
      `------------------------------------------`,
    ];

    // Sorted chronological for clean export
    const exportList = [...history].sort((a, b) => a.roundNumber - b.roundNumber);
    exportList.forEach((rec) => {
      const timeStr = new Date(rec.timestamp).toLocaleTimeString('vi-VN');
      const stDetails = rec.students
        .map((st) => {
          const statusLabel =
            st.status === 'correct'
              ? 'Đúng (+10đ)'
              : st.status === 'help'
              ? 'Cần hỗ trợ (+5đ)'
              : st.status === 'incorrect'
              ? 'Chưa đúng (0đ)'
              : 'Đã gọi';
          return `${st.name} [${statusLabel}]`;
        })
        .join(', ');
      lines.push(`• Lượt #${rec.roundNumber} (${timeStr}): ${stDetails}`);
    });

    const totalPts = Object.values(studentScores).reduce((a, b) => a + b, 0);
    lines.push(`------------------------------------------`);
    lines.push(`Tổng điểm cả lớp đạt được: ${totalPts}đ`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2500);
    soundFx.play('click');
  };

  const handleClear = () => {
    if (onClearHistory) {
      onClearHistory();
    }
  };

  // Sort items: 'desc' displays the most recent entries at the top
  const displayedHistory = [...history].sort((a, b) => {
    if (sortOrder === 'desc') {
      return b.timestamp - a.timestamp;
    }
    return a.timestamp - b.timestamp;
  });

  const totalScore = Object.values(studentScores).reduce((a, b) => a + b, 0);
  const calledCount = totalCalledCount !== undefined ? totalCalledCount : history.reduce((acc, h) => acc + h.students.length, 0);

  return (
    <div
      id="session-history-log-section"
      className={`relative z-10 w-full max-w-2xl mt-8 bg-white rounded-3xl p-5 sm:p-6 shadow-xl border-2 border-w-accent-muted space-y-4 ${className}`}
    >
      {/* History Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-w-accent-muted">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-w-accent-light text-w-primary-dark flex items-center justify-center shadow-xs">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-black text-w-text-main flex items-center gap-2">
              <span>{title}</span>
              <span className="px-2 py-0.5 bg-w-accent-light text-w-primary-dark text-xs font-black rounded-lg border border-w-accent-border">
                {history.length} lượt
              </span>
            </h4>
            <p className="text-[11px] font-semibold text-w-text-muted">
              {sortOrder === 'desc' 
                ? 'Lượt mới nhất hiển thị trên cùng kèm hiệu ứng mượt mà' 
                : 'Hiển thị theo thứ tự gọi từ đầu đến cuối phiên'}
            </p>
          </div>
        </div>

        {/* Actions: Sort, Copy, Clear */}
        <div className="flex items-center gap-2 flex-wrap">
          {history.length > 0 && (
            <>
              {/* Sort Toggle (Default: Mới nhất trên cùng) */}
              <button
                type="button"
                onClick={() => {
                  setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                  soundFx.play('click');
                }}
                className="px-2.5 py-1.5 bg-w-bg-tag hover:bg-w-accent-light text-w-text-main text-xs font-bold rounded-xl border border-w-accent-muted transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title={sortOrder === 'desc' ? 'Đang xếp: Mới nhất trên cùng (Bấm để đảo)' : 'Đang xếp: Cũ nhất trên cùng (Bấm để đảo)'}
              >
                <ArrowDownUp className="w-3.5 h-3.5 text-w-primary-dark" />
                <span className="font-bold">{sortOrder === 'desc' ? 'Mới nhất ↑' : 'Cũ nhất ↑'}</span>
              </button>

              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopyHistory}
                className="px-2.5 py-1.5 bg-w-bg-tag hover:bg-w-accent-light text-w-text-main text-xs font-bold rounded-xl border border-w-accent-muted transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Sao chép nhật ký ra bảng / văn bản"
              >
                {copyToast ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-black">Đã chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-w-primary-dark" />
                    <span className="hidden sm:inline font-bold">Sao chép</span>
                  </>
                )}
              </button>

              {/* Clear Button */}
              {onClearHistory && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition cursor-pointer shadow-2xs"
                  title="Xóa nhật ký phiên này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Animated History List */}
      {history.length === 0 ? (
        <div className="py-7 text-center text-w-text-muted space-y-1.5 bg-w-bg-tag rounded-2xl border border-dashed border-w-accent-muted">
          <div className="text-2xl">📋</div>
          <p className="text-xs font-bold text-w-text-main">Chưa có học sinh nào được gọi trong phiên này</p>
          <p className="text-[11px]">Bấm quay hoặc mở gọi tên để bắt đầu tự động ghi nhận nhật ký.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
          <AnimatePresence initial={false}>
            {displayedHistory.map((record) => {
              const timeStr = new Date(record.timestamp).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <motion.div
                  key={record.id}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.96 }}
                  transition={{ 
                    duration: 0.35, 
                    ease: [0.16, 1, 0.3, 1],
                    layout: { duration: 0.25 }
                  }}
                  className="p-3 bg-w-bg-tag hover:bg-w-accent-light/60 rounded-2xl border border-w-accent-muted transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs"
                >
                  {/* Left: Round Badge & Timestamp */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 bg-w-primary-dark text-w-text-main text-xs font-black rounded-lg shadow-2xs">
                      Lượt #{record.roundNumber}
                    </span>
                    <span className="text-[11px] font-bold text-w-text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3 text-w-primary-dark/70" />
                      <span>{timeStr}</span>
                    </span>
                  </div>

                  {/* Right: Students Called in this Round */}
                  <div className="flex items-center gap-2 flex-wrap flex-1 justify-start sm:justify-end">
                    {record.students.map((st) => {
                      const statusStyle =
                        st.status === 'correct'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : st.status === 'help'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : st.status === 'incorrect'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-white text-slate-700 border-slate-200';

                      const statusLabel =
                        st.status === 'correct'
                          ? '✓ Đúng (+10đ)'
                          : st.status === 'help'
                          ? '🤝 Hỗ trợ (+5đ)'
                          : st.status === 'incorrect'
                          ? '✗ Chưa đúng'
                          : 'Đã gọi';

                      return (
                        <div
                          key={st.name}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-xl border border-w-accent-muted shadow-2xs text-xs"
                        >
                          <span className="font-black text-w-text-main">{st.name}</span>
                          {onToggleStudentStatus ? (
                            <button
                              type="button"
                              onClick={() => onToggleStudentStatus(record.id, st.name)}
                              className={`px-1.5 py-0.5 rounded-md text-[10px] font-black border transition cursor-pointer hover:opacity-85 ${statusStyle}`}
                              title="Bấm để đổi nhanh trạng thái chấm điểm"
                            >
                              {statusLabel}
                            </button>
                          ) : (
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black border ${statusStyle}`}>
                              {statusLabel}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Session Stats Summary Footer */}
      {history.length > 0 && (
        <div className="pt-3 border-t border-w-accent-muted flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-w-text-muted">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-w-primary-dark" />
              Tổng đã gọi: <strong className="text-w-text-main">{calledCount}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Tổng điểm phiên: <strong className="text-w-primary-dark font-black">{totalScore}đ</strong>
            </span>
          </div>
          <div className="text-[11px] text-w-text-muted italic">
            * Bấm vào nhãn điểm học sinh để hiệu chỉnh nhanh
          </div>
        </div>
      )}
    </div>
  );
};
