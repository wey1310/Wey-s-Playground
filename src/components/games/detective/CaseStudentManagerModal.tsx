import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Shuffle, 
  Plus, 
  Trash2, 
  X, 
  FileSpreadsheet, 
  Sparkles, 
  Check, 
  RotateCcw, 
  UserCheck, 
  UserPlus,
  Search
} from 'lucide-react';
import { StudentImportButton } from '../../StudentImportButton';
import { soundFx } from '../../../utils/audio';
import confetti from 'canvas-confetti';

interface CaseStudentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: string[];
  activeStudent: string | null;
  calledStudents: string[];
  onUpdateStudents: (newList: string[]) => void;
  onSelectActiveStudent: (student: string | null) => void;
  onPickRandomStudent: () => void;
  onResetCalled: () => void;
}

export const CaseStudentManagerModal: React.FC<CaseStudentManagerModalProps> = ({
  isOpen,
  onClose,
  students,
  activeStudent,
  calledStudents,
  onUpdateStudents,
  onSelectActiveStudent,
  onPickRandomStudent,
  onResetCalled,
}) => {
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [bulkText, setBulkText] = useState<string>('');
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const handleAddSingleStudent = () => {
    const trimmed = newStudentName.trim();
    if (!trimmed) return;
    if (students.includes(trimmed)) {
      soundFx.playWrong();
      return;
    }
    soundFx.playClick();
    onUpdateStudents([...students, trimmed]);
    setNewStudentName('');
  };

  const handleApplyBulk = () => {
    const parsed = bulkText
      .split('\n')
      .map(s => s.trim().replace(/^[\d+.\-–\s]+/, '').trim())
      .filter(s => s.length > 0);
    
    if (parsed.length === 0) return;
    soundFx.playCorrect();
    // Unique list
    const combined = Array.from(new Set([...students, ...parsed]));
    onUpdateStudents(combined);
    setBulkText('');
    setIsBulkMode(false);
  };

  const handleRemoveStudent = (nameToRemove: string) => {
    soundFx.playClick();
    const filtered = students.filter(s => s !== nameToRemove);
    onUpdateStudents(filtered);
    if (activeStudent === nameToRemove) {
      onSelectActiveStudent(null);
    }
  };

  const filteredStudents = students.filter(s => 
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-[#1c140e] text-amber-50 max-w-2xl w-full rounded-3xl border-2 border-amber-500/80 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-[#2a1c13] px-5 py-4 border-b border-amber-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-black flex items-center justify-center font-black text-xl shadow-md border border-amber-400">
              <Users className="w-5 h-5 text-zinc-950" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-amber-600 flex items-center gap-2">
                <span>DANH SÁCH THÁM TỬ HỌC SINH</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-600 text-xs border border-amber-600">
                  {students.length} HS
                </span>
              </h2>
              <p className="text-xs text-amber-600">
                Quản lý học sinh tham gia phá án và chọn ngẫu nhiên thám tử đại diện
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-w-text-main transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar text-xs flex-1">
          {/* Quick Actions Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#2a1c13] p-3 rounded-2xl border border-amber-800/60">
            <button
              type="button"
              onClick={() => {
                onClose();
                onPickRandomStudent();
              }}
              disabled={students.length === 0}
              className="py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Shuffle className="w-4 h-4" />
              <span>🎲 Bốc Thám Tử Ngẫu Nhiên</span>
            </button>

            <div className="flex gap-2">
              <StudentImportButton
                onImport={(imported) => {
                  const combined = Array.from(new Set([...students, ...imported]));
                  onUpdateStudents(combined);
                }}
                variant="compact"
                buttonText="Nạp Excel / CSV"
                className="flex-1 !bg-[#382619] hover:!bg-[#4a3424] !text-amber-200 !border !border-amber-600/50 !rounded-xl !py-2.5 !text-xs font-bold"
              />

              <button
                type="button"
                onClick={() => setIsBulkMode(!isBulkMode)}
                className="px-3 py-2.5 bg-[#382619] hover:bg-[#4a3424] text-amber-200 rounded-xl border border-amber-600/50 font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                <span>{isBulkMode ? 'Ẩn Dán' : 'Dán Nhiều'}</span>
              </button>
            </div>
          </div>

          {/* Active Detective Highlight */}
          {activeStudent && (
            <div className="bg-gradient-to-r from-amber-950 via-[#3a2717] to-amber-950 p-3.5 rounded-2xl border-2 border-amber-400 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-zinc-950 flex items-center justify-center text-lg font-black shadow-xs">
                  🕵️‍♂️
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-amber-600 tracking-wider block">
                    Thám Tử Đang Được Chọn Lượt Này:
                  </span>
                  <span className="text-sm sm:text-base font-black text-amber-100">
                    {activeStudent}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectActiveStudent(null)}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-w-text-main rounded-lg text-[11px] font-bold transition cursor-pointer"
                >
                  Bỏ chọn
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onPickRandomStudent();
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-[11px] font-black transition flex items-center gap-1 cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Quay lại</span>
                </button>
              </div>
            </div>
          )}

          {/* Bulk Paste Area */}
          {isBulkMode && (
            <div className="bg-[#24170f] p-3.5 rounded-2xl border border-amber-700/60 space-y-2">
              <label className="block text-xs font-bold text-amber-600">
                📋 Dán danh sách học sinh (Mỗi dòng một tên):
              </label>
              <textarea
                rows={4}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"Nguyễn Văn An\nTrần Thị Bình\nLê Hoàng Cường"}
                className="w-full p-2.5 bg-white/70 backdrop-blur-sm border border-amber-800 rounded-xl text-amber-100 font-mono text-xs focus:outline-none focus:border-amber-400 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkMode(false)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleApplyBulk}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs font-black"
                >
                  Thêm vào danh sách
                </button>
              </div>
            </div>
          )}

          {/* Add Single Student & Search */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex gap-1.5">
              <input
                type="text"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSingleStudent()}
                placeholder="Thêm tên 1 học sinh..."
                className="flex-1 px-3 py-2 bg-white/70 backdrop-blur-sm border border-amber-800/80 rounded-xl text-amber-100 text-xs focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleAddSingleStudent}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-black rounded-xl text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm</span>
              </button>
            </div>

            <div className="sm:w-48 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-amber-500/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên..."
                className="w-full pl-8 pr-3 py-2 bg-white/70 backdrop-blur-sm border border-amber-800/80 rounded-xl text-amber-100 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Student Grid / List */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-amber-600 font-bold px-1">
              <span>Học sinh trong lớp ({filteredStudents.length}/{students.length})</span>
              {calledStudents.length > 0 && (
                <button
                  type="button"
                  onClick={onResetCalled}
                  className="text-amber-600 hover:text-amber-200 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Đặt lại lượt gọi ({calledStudents.length} đã gọi)</span>
                </button>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white/70 backdrop-blur-sm p-2.5 rounded-2xl border border-amber-900/60 custom-scrollbar">
              {filteredStudents.length === 0 ? (
                <div className="col-span-full py-8 text-center text-amber-500/50">
                  Chưa có học sinh nào. Hãy thêm hoặc nạp danh sách từ file!
                </div>
              ) : (
                filteredStudents.map((st, idx) => {
                  const isSelected = activeStudent === st;
                  const isCalled = calledStudents.includes(st);

                  return (
                    <div
                      key={st}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-black shadow-xs'
                          : isCalled
                          ? 'bg-[#241a13]/70 border-zinc-800 text-zinc-400 font-medium'
                          : 'bg-[#2e1e14] border-amber-800/50 text-amber-100 hover:border-amber-600 font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded bg-amber-950 text-amber-600 text-[10px] font-mono flex items-center justify-center shrink-0 border border-amber-800">
                          {idx + 1}
                        </span>
                        <span className="truncate text-xs">{st}</span>
                        {isCalled && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 shrink-0">
                            Đã gọi
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onSelectActiveStudent(isSelected ? null : st)}
                          className={`p-1.5 rounded-lg transition text-[10px] font-bold cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-zinc-950'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-amber-600'
                          }`}
                          title={isSelected ? 'Đang chọn' : 'Chọn học sinh này'}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveStudent(st)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-300 transition cursor-pointer"
                          title="Xóa học sinh này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#24170f] px-5 py-3 border-t border-amber-800/50 flex items-center justify-between">
          <span className="text-[11px] text-amber-600">
            Danh sách tự động lưu vào bộ nhớ trình duyệt
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-black rounded-xl text-xs transition cursor-pointer"
          >
            Hoàn Tất
          </button>
        </div>
      </motion.div>
    </div>
  );
};
