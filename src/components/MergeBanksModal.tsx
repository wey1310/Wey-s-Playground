import React, { useState, useMemo } from 'react';
import { X, Layers, Sparkles, CheckSquare, Square, BookOpen, AlertCircle } from 'lucide-react';
import type { QuestionBank, Question } from '../types';
import { safeAlert } from '../utils/safeAlert';

interface MergeBanksModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBanks: QuestionBank[];
  availableFolders: string[];
  onMergeSuccess: (mergedBank: QuestionBank) => void;
}

export const MergeBanksModal: React.FC<MergeBanksModalProps> = ({
  isOpen,
  onClose,
  selectedBanks,
  availableFolders,
  onMergeSuccess,
}) => {
  const [mergedName, setMergedName] = useState('');
  const [mergedSubject, setMergedSubject] = useState('');
  const [mergedGrade, setMergedGrade] = useState('');
  const [mergedFolder, setMergedFolder] = useState('');
  const [deduplicate, setDeduplicate] = useState(true);

  // Initialize defaults from selected banks
  React.useEffect(() => {
    if (isOpen && selectedBanks.length > 0) {
      const defaultName = `Gộp [${selectedBanks.map(b => b.name).join(' + ')}]`.slice(0, 80);
      setMergedName(defaultName);
      setMergedSubject(selectedBanks[0]?.subject || 'Tổng hợp');
      setMergedGrade(selectedBanks[0]?.grade || 'Chung');
      setMergedFolder(selectedBanks[0]?.folder || '');
    }
  }, [isOpen, selectedBanks]);

  const previewStats = useMemo(() => {
    const rawQuestions: Question[] = [];
    selectedBanks.forEach(b => {
      if (b.questions && b.questions.length > 0) {
        rawQuestions.push(...b.questions);
      }
    });

    let finalQuestions = rawQuestions;
    if (deduplicate) {
      const seen = new Set<string>();
      finalQuestions = rawQuestions.filter(q => {
        const key = `${q.content.trim().toLowerCase()}_${String(q.correct)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    return {
      rawCount: rawQuestions.length,
      finalCount: finalQuestions.length,
      duplicatesRemoved: rawQuestions.length - finalQuestions.length,
      finalQuestions,
    };
  }, [selectedBanks, deduplicate]);

  if (!isOpen) return null;

  const handleExecuteMerge = () => {
    if (!mergedName.trim()) {
      safeAlert('Vui lòng nhập tên cho bộ đề gộp!');
      return;
    }

    if (previewStats.finalQuestions.length === 0) {
      safeAlert('Các bộ đề được chọn không có câu hỏi nào để gộp!');
      return;
    }

    // Re-id all questions to prevent duplicate key collisions
    const standardizedQuestions: Question[] = previewStats.finalQuestions.map((q, idx) => ({
      ...q,
      id: `q_merged_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
    }));

    const newMergedBank: QuestionBank = {
      id: `bank_merged_${Date.now()}`,
      name: mergedName.trim(),
      subject: mergedSubject.trim() || 'Tổng hợp',
      grade: mergedGrade.trim() || 'Chung',
      topic: `Tổng hợp từ ${selectedBanks.length} bộ đề`,
      folder: mergedFolder.trim() || undefined,
      description: `Bộ đề được gộp từ: ${selectedBanks.map(b => b.name).join(', ')}`,
      tags: ['Đề tổng hợp', 'Gộp đề'],
      questions: standardizedQuestions,
      isPreset: false,
      visibility: 'private',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onMergeSuccess(newMergedBank);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-w-bg-card w-full max-w-lg rounded-[28px] shadow-2xl border-2 border-w-border flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-w-bg-main border-b border-w-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-w-accent-light text-w-primary-dark rounded-2xl border border-w-accent-border shadow-xs">
              <Layers className="w-5 h-5 text-w-primary" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-[900] text-w-text-main">
                Gộp {selectedBanks.length} Bộ Đề Thành 1
              </h3>
              <p className="text-xs font-[600] text-w-text-muted">
                Tạo một bộ đề hoàn chỉnh mới chứa toàn bộ câu hỏi từ các bộ đã chọn
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-w-text-muted hover:text-w-text-main hover:bg-w-accent-light rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Selected Banks List */}
          <div className="p-3 bg-w-bg-alt rounded-2xl border border-w-border space-y-2">
            <div className="text-[11px] font-[800] text-w-text-muted uppercase">
              Danh sách các bộ đề nguồn ({selectedBanks.length}):
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
              {selectedBanks.map(b => (
                <div key={b.id} className="p-2 bg-w-bg-card rounded-xl border border-w-border flex items-center justify-between text-xs">
                  <span className="font-[800] text-w-text-main line-clamp-1 flex-1 mr-2">{b.name}</span>
                  <span className="font-[700] text-[11px] px-2 py-0.5 rounded-full bg-w-accent-light text-w-primary-dark shrink-0">
                    {b.questions?.length || 0} câu
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* New Bank Name */}
          <div>
            <label className="block text-xs font-[800] text-w-text-main mb-1.5">
              Tên bộ đề mới sau khi gộp: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={mergedName}
              onChange={e => setMergedName(e.target.value)}
              placeholder="VD: Tổng hợp đề ôn tập cuối học kỳ..."
              className="w-full px-3.5 py-2.5 bg-w-input-bg border border-w-input-border rounded-xl text-xs sm:text-sm font-[700] text-w-text-main focus:outline-none focus:border-w-primary"
              required
            />
          </div>

          {/* Subject & Grade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-[800] text-w-text-main mb-1.5">
                Môn học:
              </label>
              <input
                type="text"
                value={mergedSubject}
                onChange={e => setMergedSubject(e.target.value)}
                placeholder="Môn học..."
                className="w-full px-3 py-2 bg-w-input-bg border border-w-input-border rounded-xl text-xs font-[700] text-w-text-main focus:outline-none focus:border-w-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-[800] text-w-text-main mb-1.5">
                Khối lớp:
              </label>
              <input
                type="text"
                value={mergedGrade}
                onChange={e => setMergedGrade(e.target.value)}
                placeholder="Khối lớp..."
                className="w-full px-3 py-2 bg-w-input-bg border border-w-input-border rounded-xl text-xs font-[700] text-w-text-main focus:outline-none focus:border-w-primary"
              />
            </div>
          </div>

          {/* Target Folder */}
          <div>
            <label className="block text-xs font-[800] text-w-text-main mb-1.5">
              Lưu vào thư mục:
            </label>
            <select
              value={mergedFolder}
              onChange={e => setMergedFolder(e.target.value)}
              className="w-full px-3 py-2 bg-w-input-bg border border-w-input-border rounded-xl text-xs font-[700] text-w-text-main focus:outline-none focus:border-w-primary cursor-pointer"
            >
              <option value="">📂 Chưa phân loại (Thư mục chung)</option>
              {availableFolders.map(f => (
                <option key={f} value={f}>📁 {f}</option>
              ))}
            </select>
          </div>

          {/* Deduplicate Option */}
          <div 
            onClick={() => setDeduplicate(!deduplicate)}
            className="p-3 bg-w-accent-light/50 border border-w-accent-border/70 rounded-2xl flex items-center gap-2.5 cursor-pointer select-none"
          >
            <button type="button" className="text-w-primary">
              {deduplicate ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-w-text-muted" />}
            </button>
            <div className="flex-1">
              <div className="font-[800] text-xs text-w-text-main">
                Tự động lọc & bỏ câu hỏi trùng lặp
              </div>
              <div className="text-[11px] text-w-text-muted">
                Nếu 2 bộ đề có câu hỏi giống hệt nhau, hệ thống sẽ giữ lại 1 câu duy nhất.
              </div>
            </div>
          </div>

          {/* Summary Preview Strip */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-950 font-[800]">
            <span>Tổng câu hỏi sẽ tạo:</span>
            <span className="text-sm px-2.5 py-0.5 bg-emerald-200 rounded-full font-[900]">
              {previewStats.finalCount} câu
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-w-bg-main border-t border-w-border flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-[700] text-w-text-muted hover:bg-w-accent-light transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleExecuteMerge}
            className="px-5 py-2 wey-btn-primary font-[800] text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Tiến Hành Gộp Bộ Đề</span>
          </button>
        </div>
      </div>
    </div>
  );
};
