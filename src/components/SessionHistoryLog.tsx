import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Clock, 
  ArrowDownUp, 
  Copy, 
  Check, 
  Trash2, 
  Sparkles,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  ListFilter,
  Layers,
  ChevronDown
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

export interface FlattenedCallEntry {
  uniqueKey: string;
  recordId: string;
  callIndex: number;
  roundNumber: number;
  timestamp: number;
  studentName: string;
  status: 'correct' | 'help' | 'incorrect' | 'called';
  score: number;
}

export interface SessionHistoryLogProps {
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
  // Sort order: 'desc' displays newest calls first, 'asc' displays chronological calls (1st to last)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  // View mode: 'names' (chronological individual names list) or 'rounds' (grouped by roll round)
  const [viewMode, setViewMode] = useState<'names' | 'rounds'>('names');
  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Status filter
  const [statusFilter, setStatusFilter] = useState<'all' | 'correct' | 'help' | 'incorrect' | 'called'>('all');
  // Copy feedback toast
  const [copyToast, setCopyToast] = useState<boolean>(false);
  // Confirm clear dialog state
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Flatten history into individual chronological student call entries
  const flattenedChronologicalList = useMemo<FlattenedCallEntry[]>(() => {
    // Sort original history by timestamp ascending to calculate exact chronological order (1st, 2nd, 3rd...)
    const chronologicalHistory = [...history].sort((a, b) => a.timestamp - b.timestamp);
    const list: FlattenedCallEntry[] = [];
    let count = 0;

    chronologicalHistory.forEach((rec) => {
      rec.students.forEach((st, studentIdx) => {
        count++;
        list.push({
          uniqueKey: `${rec.id}_${studentIdx}_${st.name}`,
          recordId: rec.id,
          callIndex: count,
          roundNumber: rec.roundNumber,
          timestamp: rec.timestamp,
          studentName: st.name,
          status: st.status,
          score: st.score,
        });
      });
    });

    return list;
  }, [history]);

  // Filtered and sorted individual entries
  const displayedNameEntries = useMemo(() => {
    let result = [...flattenedChronologicalList];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => item.studentName.toLowerCase().includes(q));
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((item) => item.status === statusFilter);
    }

    // Sort order
    result.sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.timestamp !== a.timestamp ? b.timestamp - a.timestamp : b.callIndex - a.callIndex;
      }
      return a.timestamp !== b.timestamp ? a.timestamp - b.timestamp : a.callIndex - b.callIndex;
    });

    return result;
  }, [flattenedChronologicalList, searchQuery, statusFilter, sortOrder]);

  // Filtered and sorted round records
  const displayedRoundRecords = useMemo(() => {
    let result = [...history];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((rec) =>
        rec.students.some((s) => s.name.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((rec) =>
        rec.students.some((s) => s.status === statusFilter)
      );
    }

    result.sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.timestamp - a.timestamp;
      }
      return a.timestamp - b.timestamp;
    });

    return result;
  }, [history, searchQuery, statusFilter, sortOrder]);

  // Copy full session history to clipboard
  const handleCopyHistory = () => {
    if (flattenedChronologicalList.length === 0) return;
    const lines: string[] = [
      `📋 NHẬT KÝ GỌI TÊN THEO THỨ TỰ PHIÊN NÀY - WEY PLAY`,
      `Thời gian xuất: ${new Date().toLocaleTimeString('vi-VN')} (${new Date().toLocaleDateString('vi-VN')})`,
      `Tổng số lượt gọi: ${history.length} lượt (${flattenedChronologicalList.length} lượt học sinh)`,
      `------------------------------------------`,
    ];

    flattenedChronologicalList.forEach((item) => {
      const timeStr = new Date(item.timestamp).toLocaleTimeString('vi-VN');
      const statusLabel =
        item.status === 'correct'
          ? 'Đúng (+10đ)'
          : item.status === 'help'
          ? 'Cần hỗ trợ (+5đ)'
          : item.status === 'incorrect'
          ? 'Chưa đúng (0đ)'
          : 'Đã gọi';
      lines.push(`#${item.callIndex}. ${item.studentName} [${timeStr}] - Lượt #${item.roundNumber} - ${statusLabel}`);
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
    setShowClearConfirm(false);
    if (onClearHistory) {
      onClearHistory();
    }
  };

  const totalScore = Object.values(studentScores).reduce((a, b) => a + b, 0);
  const totalCalls = totalCalledCount !== undefined ? totalCalledCount : flattenedChronologicalList.length;
  const uniqueStudentsCalled = new Set(flattenedChronologicalList.map((i) => i.studentName)).size;

  return (
    <div
      id="session-history-log-section"
      className={`relative z-10 w-full bg-white rounded-3xl p-4 sm:p-6 shadow-xl border-2 border-w-accent-muted space-y-4 ${className}`}
    >
      {/* SECTION 1: HEADER & PRIMARY CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-w-accent-muted">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-w-accent-light text-w-primary-dark border border-w-accent-border flex items-center justify-center shadow-xs">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-black text-w-text-main flex items-center gap-2">
              <span>{title}</span>
              <span className="px-2.5 py-0.5 bg-w-accent-light text-w-primary-dark text-xs font-black rounded-lg border border-w-accent-border shadow-2xs">
                {flattenedChronologicalList.length} lượt gọi
              </span>
            </h4>
            <p className="text-xs font-semibold text-w-text-muted">
              Danh sách ghi nhận theo trình tự thời gian thực, tự động cập nhật và có hiệu ứng xuất hiện.
            </p>
          </div>
        </div>

        {/* Action Buttons: View Toggle, Sort, Copy, Clear */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher: Từng Tên vs Theo Lượt */}
          <div className="inline-flex bg-w-bg-tag p-1 rounded-xl border border-w-accent-muted">
            <button
              type="button"
              onClick={() => {
                setViewMode('names');
                soundFx.play('click');
              }}
              className={`px-2.5 py-1 text-xs font-black rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'names'
                  ? 'bg-w-primary-dark text-w-text-main shadow-xs'
                  : 'text-w-text-muted hover:text-w-text-main'
              }`}
              title="Xem danh sách tên học sinh theo thứ tự thời gian gọi"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Từng Bạn</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('rounds');
                soundFx.play('click');
              }}
              className={`px-2.5 py-1 text-xs font-black rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'rounds'
                  ? 'bg-w-primary-dark text-w-text-main shadow-xs'
                  : 'text-w-text-muted hover:text-w-text-main'
              }`}
              title="Xem nhóm theo từng lượt bốc thăm"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Theo Lượt</span>
            </button>
          </div>

          {flattenedChronologicalList.length > 0 && (
            <>
              {/* Chronological Sort Toggle */}
              <button
                type="button"
                onClick={() => {
                  setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                  soundFx.play('click');
                }}
                className="px-2.5 py-1.5 bg-w-bg-tag hover:bg-w-accent-light text-w-text-main text-xs font-bold rounded-xl border border-w-accent-muted transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title={sortOrder === 'desc' ? 'Đang xếp: Mới nhất trên cùng (Bấm để xếp từ lượt #1)' : 'Đang xếp: Thứ tự từ lượt #1 (Bấm để đưa mới nhất lên đầu)'}
              >
                <ArrowDownUp className="w-3.5 h-3.5 text-w-primary-dark" />
                <span className="font-bold">{sortOrder === 'desc' ? 'Mới nhất ↓' : 'Lượt #1 ↑'}</span>
              </button>

              {/* Copy Full History */}
              <button
                type="button"
                onClick={handleCopyHistory}
                className="px-3 py-1.5 bg-w-bg-tag hover:bg-w-accent-light text-w-text-main text-xs font-bold rounded-xl border border-w-accent-muted transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Sao chép toàn bộ nhật ký phiên này"
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

              {/* Clear History */}
              {onClearHistory && (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
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

      {/* CONFIRM CLEAR DIALOG */}
      {showClearConfirm && (
        <div className="p-3 bg-rose-50 border-2 border-rose-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-rose-800 font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Bạn có chắc chắn muốn xóa sạch toàn bộ nhật ký gọi tên phiên này?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-black transition cursor-pointer"
            >
              Xác nhận xóa
            </button>
            <button
              type="button"
              onClick={() => setShowClearConfirm(false)}
              className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold transition cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* SECTION 2: SEARCH & FILTER BAR (Active when items exist) */}
      {flattenedChronologicalList.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 pb-1">
          {/* Search by student name */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-w-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên học sinh..."
              className="w-full pl-8 pr-3 py-1.5 bg-w-bg-tag border border-w-accent-muted rounded-xl text-xs font-bold text-w-text-main placeholder-w-text-muted focus:outline-none focus:border-w-primary-dark transition shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[10px] text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick status filter chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-w-text-muted hidden md:inline">Lọc:</span>
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'correct', label: '✓ Đúng' },
              { key: 'help', label: '🤝 Hỗ trợ' },
              { key: 'incorrect', label: '✗ Chưa đúng' },
              { key: 'called', label: 'Đã gọi' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key as any)}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition border cursor-pointer ${
                  statusFilter === f.key
                    ? 'bg-w-primary-dark text-w-text-main border-w-primary-hover shadow-2xs font-black'
                    : 'bg-w-bg-tag text-w-text-muted hover:bg-w-accent-light border-w-accent-muted'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: ANIMATED CHRONOLOGICAL LIST (FADE-IN SLIDE-UP ANIMATION) */}
      {flattenedChronologicalList.length === 0 ? (
        <div className="py-8 text-center text-w-text-muted space-y-2 bg-w-bg-tag rounded-2xl border-2 border-dashed border-w-accent-muted">
          <div className="text-3xl">📋</div>
          <p className="text-sm font-black text-w-text-main">Chưa có học sinh nào được gọi trong phiên này</p>
          <p className="text-xs text-w-text-muted max-w-md mx-auto">
            Bấm nút quay để bắt đầu. Mỗi học sinh được gọi sẽ tự động xuất hiện với hiệu ứng trượt lên theo đúng trình tự thời gian.
          </p>
        </div>
      ) : viewMode === 'names' ? (
        /* VIEW MODE 1: CHRONOLOGICAL INDIVIDUAL NAMES LIST */
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
          {displayedNameEntries.length === 0 ? (
            <div className="py-6 text-center text-xs text-w-text-muted bg-w-bg-tag rounded-xl">
              Không tìm thấy học sinh nào phù hợp với bộ lọc tìm kiếm.
            </div>
          ) : (
            <AnimatePresence initial={false} mode="popLayout">
              {displayedNameEntries.map((item) => {
                const timeStr = new Date(item.timestamp).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                const statusStyle =
                  item.status === 'correct'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : item.status === 'help'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : item.status === 'incorrect'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-white text-slate-700 border-slate-200';

                const statusLabel =
                  item.status === 'correct'
                    ? '✓ Đúng (+10đ)'
                    : item.status === 'help'
                    ? '🤝 Hỗ trợ (+5đ)'
                    : item.status === 'incorrect'
                    ? '✗ Chưa đúng'
                    : 'Đã gọi';

                return (
                  <motion.div
                    key={item.uniqueKey}
                    layout
                    initial={{ opacity: 0, y: 24, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.95 }}
                    transition={{
                      duration: 0.38,
                      ease: [0.16, 1, 0.3, 1],
                      layout: { duration: 0.25 },
                    }}
                    className="p-3 bg-gradient-to-r from-w-bg-tag to-white hover:from-w-accent-light/50 hover:to-white rounded-2xl border border-w-accent-muted transition-colors flex items-center justify-between gap-3 shadow-2xs"
                  >
                    {/* Left: Sequence index & Student Name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Chronological Sequence Badge (#1, #2, ...) */}
                      <div className="w-8 h-8 rounded-xl bg-w-accent-light text-w-primary-dark border border-w-accent-border font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        #{item.callIndex}
                      </div>

                      {/* Name & Round details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-w-text-main truncate">
                            {item.studentName}
                          </span>
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-w-accent-light text-w-primary-dark border border-w-accent-border shrink-0">
                            Lượt #{item.roundNumber}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-w-text-muted flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3 text-w-primary-dark/70" />
                          <span>{timeStr}</span>
                          {studentScores[item.studentName] !== undefined && (
                            <>
                              <span>•</span>
                              <span className="text-w-primary-dark font-bold">
                                Điểm tích lũy: {studentScores[item.studentName]}đ
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Status / Score Tag (Interactive toggle) */}
                    <div className="shrink-0 flex items-center gap-2">
                      {onToggleStudentStatus ? (
                        <button
                          type="button"
                          onClick={() => onToggleStudentStatus(item.recordId, item.studentName)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-black border transition cursor-pointer hover:opacity-85 shadow-2xs flex items-center gap-1 ${statusStyle}`}
                          title="Bấm vào để đổi trạng thái chấm điểm (Đúng / Cần hỗ trợ / Chưa đúng)"
                        >
                          <span>{statusLabel}</span>
                        </button>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black border shadow-2xs ${statusStyle}`}>
                          {statusLabel}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      ) : (
        /* VIEW MODE 2: ROUND-BY-ROUND GROUPED LIST */
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
          {displayedRoundRecords.length === 0 ? (
            <div className="py-6 text-center text-xs text-w-text-muted bg-w-bg-tag rounded-xl">
              Không tìm thấy lượt nào phù hợp với bộ lọc tìm kiếm.
            </div>
          ) : (
            <AnimatePresence initial={false} mode="popLayout">
              {displayedRoundRecords.map((record) => {
                const timeStr = new Date(record.timestamp).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <motion.div
                    key={record.id}
                    layout
                    initial={{ opacity: 0, y: 24, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.95 }}
                    transition={{
                      duration: 0.38,
                      ease: [0.16, 1, 0.3, 1],
                      layout: { duration: 0.25 },
                    }}
                    className="p-3.5 bg-w-bg-tag hover:bg-w-accent-light/50 rounded-2xl border border-w-accent-muted transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
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
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                        {record.students.length} HS
                      </span>
                    </div>

                    {/* Right: Students Called in this Round */}
                    <div className="flex items-center gap-1.5 flex-wrap flex-1 justify-start sm:justify-end">
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
          )}
        </div>
      )}

      {/* SECTION 4: STATS FOOTER & HINTS */}
      {flattenedChronologicalList.length > 0 && (
        <div className="pt-3 border-t-2 border-w-accent-muted flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-w-text-muted">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 bg-w-bg-tag px-2.5 py-1 rounded-xl border border-w-accent-muted text-w-text-main">
              <Users className="w-3.5 h-3.5 text-w-primary-dark" />
              <span>Tổng lượt gọi: <strong>{totalCalls}</strong></span>
            </span>
            <span className="flex items-center gap-1.5 bg-w-bg-tag px-2.5 py-1 rounded-xl border border-w-accent-muted text-w-text-main">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Số học sinh khác nhau: <strong>{uniqueStudentsCalled}</strong></span>
            </span>
            <span className="flex items-center gap-1.5 bg-w-bg-tag px-2.5 py-1 rounded-xl border border-w-accent-muted text-w-text-main">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tổng điểm phiên: <strong className="text-w-primary-dark">{totalScore}đ</strong></span>
            </span>
          </div>

          <div className="text-[11px] text-w-text-muted italic flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-w-primary-dark/70" />
            <span>Bấm vào nhãn điểm học sinh để hiệu chỉnh trạng thái</span>
          </div>
        </div>
      )}
    </div>
  );
};
