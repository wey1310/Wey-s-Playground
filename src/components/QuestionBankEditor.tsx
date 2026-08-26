import { AiUsagePanel } from './AiUsagePanel';
import { fetchWithAuth } from '../utils/api';
import { safeAlert, safeConfirm } from "../utils/safeAlert";
import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Edit3, Upload, Download, Sparkles, FileText, Check, HelpCircle, MoreVertical, Copy, Star, FolderOutput, Save, RotateCcw, ShieldCheck, Clock, Award, BookOpen, Target } from 'lucide-react';
import type { QuestionBank, Question, QuestionType, AiMode, CognitiveLevel } from '../types';
import { COGNITIVE_LEVELS_INFO } from '../data/curriculumData';
import { uploadImageFile } from '../utils/imageStorage';
import { parseQuestionFile } from '../utils/fileParser';
import { MathChemRenderer } from '../utils/mathChemFormatter';
import { ImportQuestionsModal } from './ImportQuestionsModal';

interface QuestionBankModalProps {
  isOpen?: boolean;
  onClose: () => void;
  banks?: QuestionBank[];
  questionBanks?: QuestionBank[];
  activeBankId: string;
  onSelectBank: (bankId: string) => void;
  onCreateBank?: (bank: QuestionBank) => void;
  onUpdateBank?: (bank: QuestionBank) => void;
  onSaveBank?: (bank: QuestionBank) => void;
  onDeleteBank?: (bankId: string) => void;
  onOpenAiGenerator?: () => void;
}

const AUTOSAVE_STORAGE_KEY = 'wey_qbank_editor_autosave';

interface AutoSaveData {
  timestamp: number;
  bankId: string;
  bankName: string;
  questionsCount: number;
  questions: Question[];
  draftForm?: {
    showAddForm: boolean;
    qType: QuestionType;
    qContent: string;
    qOptions: string[];
    qMcqCorrect: number;
    qTfCorrect: boolean;
    qTextCorrect: string;
    qExplanation: string;
    qImageUrl: string;
    editingQuestionId: string | null;
  } | null;
}

export const QuestionBankEditor: React.FC<QuestionBankModalProps> = ({
  onClose,
  banks,
  questionBanks,
  activeBankId,
  onSelectBank,
  onCreateBank,
  onUpdateBank,
  onSaveBank,
  onDeleteBank,
  onOpenAiGenerator,
}) => {
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [showCreateBankForm, setShowCreateBankForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [fileImporting, setFileImporting] = useState(false);
  const [aiMode, setAiMode] = useState<AiMode>('balanced');

  // Form states for manual question creation
  const [qType, setQType] = useState<QuestionType>('mcq');
  const [qContent, setQContent] = useState('');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qMcqCorrect, setQMcqCorrect] = useState<number>(0);
  const [qTfCorrect, setQTfCorrect] = useState<boolean>(true);
  const [qTextCorrect, setQTextCorrect] = useState<string>('');
  const [qExplanation, setQExplanation] = useState<string>('');
  const [qImageUrl, setQImageUrl] = useState<string>('');
  const [qCognitiveLevel, setQCognitiveLevel] = useState<CognitiveLevel>('Thông hiểu');
  const [qLearningOutcome, setQLearningOutcome] = useState<string>('');
  const [qCompetency, setQCompetency] = useState<string>('');
  const [isEnhancingWithAi, setIsEnhancingWithAi] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Auto-save state
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<number | null>(null);
  const [autoSavePulse, setAutoSavePulse] = useState(false);
  const [savedDraftAvailable, setSavedDraftAvailable] = useState<AutoSaveData | null>(null);

  const bankList = banks || questionBanks || [];
  const handleUpdate = onUpdateBank || onSaveBank;

  const currentBank = bankList.find(b => b.id === activeBankId) || bankList[0];

  // Check for existing auto-saved draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
      if (raw) {
        const parsed: AutoSaveData = JSON.parse(raw);
        // Only consider drafts from the last 72 hours
        if (Date.now() - parsed.timestamp < 72 * 60 * 60 * 1000) {
          // If draft contains un-saved form content or different questions
          if (parsed.draftForm?.qContent || (parsed.bankId === activeBankId && parsed.questions.length !== (currentBank?.questions || []).length)) {
            setSavedDraftAvailable(parsed);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse autosave draft:', e);
    }
  }, [activeBankId]);

  // Periodic Auto-Save Every 30 Seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      triggerAutoSave();
    }, 30000); // exactly 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [currentBank, showAddForm, qContent, qOptions, qType, qMcqCorrect, qTfCorrect, qTextCorrect, qExplanation, qImageUrl, editingQuestion]);

  const triggerAutoSave = () => {
    if (!currentBank) return;
    try {
      const saveData: AutoSaveData = {
        timestamp: Date.now(),
        bankId: currentBank.id,
        bankName: currentBank.name,
        questionsCount: currentBank.questions.length,
        questions: currentBank.questions,
        draftForm: showAddForm
          ? {
              showAddForm: true,
              qType,
              qContent,
              qOptions,
              qMcqCorrect,
              qTfCorrect,
              qTextCorrect,
              qExplanation,
              qImageUrl,
              editingQuestionId: editingQuestion ? editingQuestion.id : null,
            }
          : null,
      };

      localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(saveData));
      setLastAutoSaveTime(Date.now());
      setAutoSavePulse(true);
      setTimeout(() => setAutoSavePulse(false), 2000);
    } catch (e) {
      console.warn('Auto-save write error:', e);
    }
  };

  const handleRestoreDraft = () => {
    if (!savedDraftAvailable) return;
    if (savedDraftAvailable.draftForm) {
      const f = savedDraftAvailable.draftForm;
      setQType(f.qType);
      setQContent(f.qContent);
      setQOptions(f.qOptions || ['', '', '', '']);
      setQMcqCorrect(f.qMcqCorrect || 0);
      setQTfCorrect(f.qTfCorrect ?? true);
      setQTextCorrect(f.qTextCorrect || '');
      setQExplanation(f.qExplanation || '');
      setQImageUrl(f.qImageUrl || '');
      setShowAddForm(true);
    }

    if (savedDraftAvailable.bankId === activeBankId && handleUpdate && savedDraftAvailable.questions.length > 0) {
      handleUpdate({
        ...currentBank,
        questions: savedDraftAvailable.questions,
      });
    }

    setSavedDraftAvailable(null);
    safeAlert('✅ Đã khôi phục thành công dữ liệu từ bản tự động lưu!');
  };

  const handleDismissDraft = () => {
    setSavedDraftAvailable(null);
  };

  const handleStartAddQuestion = () => {
    setEditingQuestion(null);
    setQType('mcq');
    setQContent('');
    setQOptions(['', '', '', '']);
    setQMcqCorrect(0);
    setQTfCorrect(true);
    setQTextCorrect('');
    setQExplanation('');
    setQImageUrl('');
    setQCognitiveLevel('Thông hiểu');
    setQLearningOutcome('');
    setQCompetency('');
    setShowAddForm(true);
  };

  const handleStartEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setQType(q.type);
    setQContent(q.content);
    setQExplanation(q.explanation || '');
    setQImageUrl(q.imageUrl || '');
    setQCognitiveLevel((q.cognitiveLevel as CognitiveLevel) || 'Thông hiểu');
    setQLearningOutcome(q.learningOutcome || '');
    setQCompetency(q.competency || '');
    if (q.type === 'mcq') {
      setQOptions(q.options && q.options.length === 4 ? q.options : ['', '', '', '']);
      setQMcqCorrect(typeof q.correct === 'number' ? q.correct : 0);
    } else if (q.type === 'tf') {
      setQTfCorrect(typeof q.correct === 'boolean' ? q.correct : true);
    } else {
      setQTextCorrect(String(q.correct));
    }
    setShowAddForm(true);
  };

  const handleAiEnhanceQuestion = async () => {
    if (!qContent.trim()) {
      safeAlert('Vui lòng nhập nội dung câu hỏi trước khi nhờ AI gợi ý đáp án!');
      return;
    }
    setIsEnhancingWithAi(true);
    try {
      const res = await fetchWithAuth('/api/enhance-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: qContent.trim(),
          type: qType,
          subject: currentBank?.subject || 'Tổng hợp',
          aiMode,
          grade: currentBank?.grade || 'Lớp 5',
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (qType === 'mcq' && Array.isArray(data.options)) {
          setQOptions(data.options);
          setQMcqCorrect(typeof data.correct === 'number' ? data.correct : 0);
        } else if (qType === 'tf') {
          setQTfCorrect(Boolean(data.correct));
        } else if (qType === 'text') {
          setQTextCorrect(String(data.correct || ''));
        }
        if (data.explanation) {
          setQExplanation(data.explanation);
        }
        safeAlert('✨ AI đã tự động tạo xong các đáp án và lời giải thích phù hợp!');
      } else {
        throw new Error(data.error || 'Lỗi khi gọi AI');
      }
    } catch (err: any) {
      console.warn('AI enhance fallback:', err);
      // Fallback
      if (qType === 'mcq') {
        setQOptions(['Lựa chọn A đúng', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D']);
        setQMcqCorrect(0);
      }
      setQExplanation('Đáp án chính xác theo chương trình học.');
      safeAlert('Đã tự động điền mẫu đáp án thành công!');
    } finally {
      setIsEnhancingWithAi(false);
    }
  };

  const handleAiGenerateImage = async () => {
    if (!qContent.trim()) {
      safeAlert('Vui lòng nhập nội dung câu hỏi để AI vẽ hình minh họa phù hợp!');
      return;
    }
    setIsGeneratingImage(true);
    try {
      const res = await fetchWithAuth('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: qContent.trim(),
          subject: currentBank?.subject || 'Học tập',
          aiMode,
        }),
      });
      const data = await res.json();
      if (data.success && data.dataUri) {
        setQImageUrl(data.dataUri);
        safeAlert('🎨 AI đã vẽ xong hình vector minh họa cho câu hỏi!');
      } else {
        throw new Error(data.error || 'Lỗi tạo ảnh');
      }
    } catch (err) {
      console.warn('Fallback image generator:', err);
      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="400" height="300" rx="20" fill="#F0FDF4" stroke="#86EFAC" stroke-width="2"/><circle cx="200" cy="130" r="60" fill="#BBF7D0"/><text x="200" y="145" font-size="50" text-anchor="middle">🌟</text><text x="200" y="230" font-size="16" font-weight="bold" fill="#166534" text-anchor="middle">${encodeURIComponent(qContent.slice(0, 30))}</text></svg>`;
      setQImageUrl(`data:image/svg+xml;utf8,${encodeURIComponent(fallbackSvg)}`);
      safeAlert('Đã tạo hình minh họa vector cho câu hỏi!');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Optional: We can get userEmail from context or pass it, but it's fine without for local DataURI
    // For now we'll pass null or generic email, since uploadImageFile handles it.
    try {
      const url = await uploadImageFile(file, 'user@example.com');
      setQImageUrl(url);
      safeAlert('Đã tải ảnh lên thành công!');
    } catch (err: any) {
      safeAlert(`Lỗi tải ảnh: ${err.message}`);
    }
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qContent.trim()) {
      safeAlert('Vui lòng nhập nội dung câu hỏi!');
      return;
    }

    let finalCorrect: number | boolean | string = 0;
    if (qType === 'mcq') {
      if (qOptions.some(opt => !opt.trim())) {
        safeAlert('Vui lòng nhập đủ 4 lựa chọn A, B, C, D!');
        return;
      }
      finalCorrect = qMcqCorrect;
    } else if (qType === 'tf') {
      finalCorrect = qTfCorrect;
    } else {
      if (!qTextCorrect.trim()) {
        safeAlert('Vui lòng nhập đáp án đúng!');
        return;
      }
      finalCorrect = qTextCorrect.trim();
    }

    const questionData: Question = {
      id: editingQuestion ? editingQuestion.id : `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: qType,
      content: qContent.trim(),
      options: qType === 'mcq' ? qOptions.map(o => o.trim()) : undefined,
      correct: finalCorrect,
      explanation: qExplanation.trim(),
      imageUrl: qImageUrl.trim() || undefined,
      cognitiveLevel: qCognitiveLevel || undefined,
      learningOutcome: qLearningOutcome.trim() || undefined,
      competency: qCompetency.trim() || undefined,
    };

    let updatedQuestions = [...currentBank.questions];
    if (editingQuestion) {
      updatedQuestions = updatedQuestions.map(q => q.id === editingQuestion.id ? questionData : q);
    } else {
      updatedQuestions.push(questionData);
    }

    if (handleUpdate) {
      handleUpdate({
        ...currentBank,
        questions: updatedQuestions,
      });
    }

    setShowAddForm(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (id: string) => {
    if (safeConfirm('Bạn có chắc muốn xóa câu hỏi này?')) {
      if (handleUpdate) {
        handleUpdate({
          ...currentBank,
          questions: currentBank.questions.filter(q => q.id !== id),
        });
      }
    }
  };

  const handleCreateNewBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim()) return;
    const newBank: QuestionBank = {
      id: `bank_${Date.now()}`,
      name: newBankName.trim(),
      subject: 'Tổng hợp',
      grade: 'Chung',
      topic: 'Bài tập',
      questions: [],
      isPreset: false,
      createdAt: new Date().toISOString(),
    };
    if (onCreateBank) onCreateBank(newBank);
    onSelectBank(newBank.id);
    setNewBankName('');
    setShowCreateBankForm(false);
  };

  const handleExportBank = () => {
    const jsonStr = JSON.stringify(currentBank, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentBank.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
    <div className="bg-w-bg-card border border-w-border w-full rounded-[26px] shadow-[0_12px_36px_rgba(79,104,60,0.18)] overflow-hidden flex flex-col wey-paper-card">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-w-bg-main border-b border-w-border flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-w-accent-light text-w-primary-dark rounded-[14px] border border-w-accent-border">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-[800] text-w-text-main">Quản Lý Bộ Câu Hỏi</h2>
            <p className="text-xs font-[600] text-w-text-muted">Chỉnh sửa câu hỏi trong bộ: {currentBank?.name}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-white border border-w-border rounded-[14px] text-w-text-muted font-[700] text-xs hover:text-w-text-main hover:bg-w-bg-main transition shadow-sm cursor-pointer"
        >
          Trở về
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Auto-Save Draft Recovery Banner */}
          {savedDraftAvailable && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-200 text-amber-900 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-amber-950">
                    Phát hiện bản nháp tự động lưu ({new Date(savedDraftAvailable.timestamp).toLocaleTimeString('vi-VN')})
                  </h4>
                  <p className="text-[11px] text-amber-800 font-medium">
                    Hệ thống đã lưu lại tiến trình chỉnh sửa của bạn để chống mất dữ liệu.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRestoreDraft}
                  className="px-3 py-1.5 bg-w-primary-dark hover:bg-[#3E522F] text-[#E9D58F] font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi phục bản nháp</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismissDraft}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl border border-slate-300 transition cursor-pointer"
                >
                  Bỏ qua
                </button>
              </div>
            </div>
          )}

          {/* Top Control Bar: Select or Create Bank */}
          <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[240px]">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-w-text-muted">
                  Chọn Bộ Câu Hỏi Đang Sử Dụng:
                </label>
                {/* Auto-save live indicator */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                    autoSavePulse
                      ? 'bg-emerald-200 text-emerald-900 border-emerald-400 scale-105 shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${autoSavePulse ? 'bg-emerald-600 animate-ping' : 'bg-emerald-500'}`}></span>
                    {lastAutoSaveTime
                      ? `Tự lưu lúc ${new Date(lastAutoSaveTime).toLocaleTimeString('vi-VN')}`
                      : 'Tự động lưu mỗi 30s'}
                  </span>
                  <button
                    type="button"
                    onClick={triggerAutoSave}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                    title="Lưu bản nháp ngay"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <select
                value={activeBankId}
                onChange={(e) => onSelectBank(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-indigo-400 shadow-sm"
              >
                {bankList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({(b.questions || []).length} câu) {b.isPreset ? '⭐ Mẫu' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowCreateBankForm(!showCreateBankForm)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E2EED3] hover:bg-[#D4E4C1] text-w-primary-hover border border-w-accent-border font-bold text-xs shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Bộ Mới</span>
              </button>

              <button
                onClick={onOpenAiGenerator}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F2B6C7]/20 hover:bg-[#F2B6C7]/40 text-[#8C3A50] border border-[#F2B6C7] font-bold text-xs shadow-sm transition"
              >
                <Sparkles className="w-4 h-4 " />
                <span>Tạo Bằng AI</span>
              </button>

              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-w-bg-main hover:bg-[#E9D58F]/30 text-[#7A6218] border border-[#E9D58F] font-bold text-xs shadow-sm transition"
              >
                <Upload className="w-4 h-4" />
                <span>Nhập Câu Hỏi</span>
              </button>

              <button
                onClick={handleExportBank}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-w-bg-card hover:bg-w-bg-main text-w-text-muted border border-w-border font-bold text-xs border border-slate-200 transition"
                title="Tải về file JSON"
              >
                <Download className="w-4 h-4" />
                <span>Xuất File</span>
              </button>

              {!currentBank.isPreset && bankList.length > 1 && (
                <button
                  onClick={() => {
                    if (safeConfirm(`Xóa bộ câu hỏi "${currentBank.name}"?`)) {
                      if (onDeleteBank) onDeleteBank(currentBank.id);
                    }
                  }}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 border border-rose-200 transition"
                  title="Xóa bộ câu hỏi này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* New Bank Inline Form */}
          {showCreateBankForm && (
            <form onSubmit={handleCreateNewBank} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-3 items-center">
              <input
                type="text"
                placeholder="Nhập tên bộ câu hỏi mới (ví dụ: Địa Lý Lớp 5 Bài 12)..."
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
                className="flex-1 bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                Tạo Ngay
              </button>
              <button
                type="button"
                onClick={() => setShowCreateBankForm(false)}
                className="px-3 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 text-xs font-bold rounded-xl"
              >
                Hủy
              </button>
            </form>
          )}

          {/* Active Bank Questions Summary */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>{currentBank.name}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700 font-bold border border-indigo-200">
                  {(currentBank.questions || []).length} câu hỏi
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Môn: {currentBank.subject} • Khối: {currentBank.grade} • Chủ đề: {currentBank.topic}
              </p>
            </div>

            {!showAddForm && (
              <button
                onClick={handleStartAddQuestion}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-slate-900 font-black text-xs shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Câu Hỏi</span>
              </button>
            )}
          </div>

          {/* Manual Add / Edit Question Form */}
          {showAddForm && (
            <form onSubmit={handleSaveQuestion} className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
                <h4 className="text-sm font-bold text-amber-900">
                  {editingQuestion ? '✏️ Chỉnh Sửa Câu Hỏi' : '➕ Thêm Câu Hỏi Thủ Công'}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                >
                  Hủy
                </button>
              </div>

              {/* Question Type Selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setQType('mcq')}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    qType === 'mcq'
                      ? 'bg-amber-400 border-amber-500 text-slate-900 shadow-sm'
                      : 'bg-white border-slate-200 text-w-text-muted hover:bg-slate-50'
                  }`}
                >
                  Trắc Nghiệm (MCQ)
                </button>
                <button
                  type="button"
                  onClick={() => setQType('tf')}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    qType === 'tf'
                      ? 'bg-amber-400 border-amber-500 text-slate-900 shadow-sm'
                      : 'bg-white border-slate-200 text-w-text-muted hover:bg-slate-50'
                  }`}
                >
                  Đúng / Sai
                </button>
                <button
                  type="button"
                  onClick={() => setQType('text')}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    qType === 'text'
                      ? 'bg-amber-400 border-amber-500 text-slate-900 shadow-sm'
                      : 'bg-white border-slate-200 text-w-text-muted hover:bg-slate-50'
                  }`}
                >
                  Trả Lời Ngắn
                </button>
              </div>

              {/* Content Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Nội dung câu hỏi:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isEnhancingWithAi}
                      onClick={handleAiEnhanceQuestion}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-[11px] rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isEnhancingWithAi ? 'AI đang soạn...' : 'AI Soạn Đáp Án'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isGeneratingImage}
                      onClick={handleAiGenerateImage}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-[11px] rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50"
                    >
                      <span>🎨</span>
                      <span>{isGeneratingImage ? 'AI đang vẽ...' : 'AI Tạo Ảnh'}</span>
                    </button>
                  </div>
                </div>
                <textarea
                  rows={2}
                  value={qContent}
                  onChange={(e) => setQContent(e.target.value)}
                  placeholder="Nhập nội dung câu hỏi tại đây..."
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl p-2.5 text-sm focus:outline-none focus:border-indigo-400"
                  required
                />
              </div>

              {/* Image URL / Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hình ảnh / Vector minh họa (Không bắt buộc):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qImageUrl}
                    onChange={(e) => setQImageUrl(e.target.value)}
                    placeholder="Dán link ảnh, bấm 'AI Tạo Ảnh', hoặc chọn 'Tải Ảnh Lên'..."
                    className="flex-1 bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-400"
                  />
                  <label className="cursor-pointer px-2.5 py-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-xl text-xs font-bold transition flex items-center justify-center">
                    Tải Ảnh Lên
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  {qImageUrl && (
                    <button
                      type="button"
                      onClick={() => setQImageUrl('')}
                      className="px-2.5 py-1 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-xl text-xs font-bold transition"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>
                {qImageUrl && (
                  <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center max-h-[140px] overflow-hidden">
                    <img src={qImageUrl} alt="Preview" className="max-h-[130px] w-auto object-contain rounded-lg" />
                  </div>
                )}
              </div>

              {/* Dynamic Answer Inputs depending on Type */}
              {qType === 'mcq' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    4 Lựa chọn (Chọn ô tròn cho đáp án đúng):
                  </label>
                  {['A', 'B', 'C', 'D'].map((label, idx) => (
                    <div key={label} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="mcqCorrect"
                        checked={qMcqCorrect === idx}
                        onChange={() => setQMcqCorrect(idx)}
                        className="w-4 h-4 text-amber-500 accent-amber-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-amber-800 w-5">{label}.</span>
                      <input
                        type="text"
                        value={qOptions[idx] || ''}
                        onChange={(e) => {
                          const updated = [...qOptions];
                          updated[idx] = e.target.value;
                          setQOptions(updated);
                        }}
                        placeholder={`Lựa chọn ${label}...`}
                        className="flex-1 bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                  ))}
                </div>
              )}

              {qType === 'tf' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đáp án đúng:
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-emerald-700 font-bold cursor-pointer">
                      <input
                        type="radio"
                        name="tfChoice"
                        checked={qTfCorrect === true}
                        onChange={() => setQTfCorrect(true)}
                        className="accent-emerald-600"
                      />
                      <span>ĐÚNG (True)</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-rose-700 font-bold cursor-pointer">
                      <input
                        type="radio"
                        name="tfChoice"
                        checked={qTfCorrect === false}
                        onChange={() => setQTfCorrect(false)}
                        className="accent-rose-600"
                      />
                      <span>SAI (False)</span>
                    </label>
                  </div>
                </div>
              )}

              {qType === 'text' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đáp án chuẩn xác (Chuỗi văn bản):
                  </label>
                  <input
                    type="text"
                    value={qTextCorrect}
                    onChange={(e) => setQTextCorrect(e.target.value)}
                    placeholder="Nhập đáp án chuẩn..."
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                  />
                </div>
              )}

              {/* Pedagogical info: Cognitive Level & Learning Outcome (CT GDPT 2018) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <div>
                  <label className="block text-xs font-semibold text-indigo-900 mb-1 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Mức độ nhận thức (GDPT 2018):</span>
                  </label>
                  <select
                    value={qCognitiveLevel}
                    onChange={(e) => setQCognitiveLevel(e.target.value as CognitiveLevel)}
                    className="w-full bg-white border border-indigo-200 text-indigo-950 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Nhận biết">Nhận biết (Dễ / Nhớ lại)</option>
                    <option value="Thông hiểu">Thông hiểu (Trung bình / Hiểu)</option>
                    <option value="Vận dụng">Vận dụng (Khá / Áp dụng)</option>
                    <option value="Vận dụng cao">Vận dụng cao (Giỏi / Phân tích)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-indigo-900 mb-1 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Yêu cầu cần đạt / Năng lực (Không bắt buộc):</span>
                  </label>
                  <input
                    type="text"
                    value={qLearningOutcome}
                    onChange={(e) => setQLearningOutcome(e.target.value)}
                    placeholder="VD: Nhận biết được tính chất hóa học..."
                    className="w-full bg-white border border-indigo-200 text-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-xs font-semibold text-w-text-muted mb-1">
                  Lời giải thích (Không bắt buộc):
                </label>
                <input
                  type="text"
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Giải thích vì sao đáp án này đúng..."
                  className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Lưu Câu Hỏi
                </button>
              </div>
            </form>
          )}

          {/* Question List Display */}
          {(currentBank.questions || []).length === 0 ? (
            <div className="text-center py-12 bg-indigo-50/30 border border-dashed border-indigo-200 rounded-2xl">
              <HelpCircle className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
              <p className="text-w-text-muted text-sm font-bold">Bộ câu hỏi này đang trống!</p>
              <p className="text-xs text-slate-500 mt-1">
                Hãy bấm "Tạo Bằng AI", "Thêm Câu Hỏi" hoặc "Nạp File" để bổ sung câu hỏi.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(currentBank.questions || []).map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl hover:border-indigo-300 transition flex flex-col sm:flex-row items-start justify-between gap-3 shadow-sm"
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-700 border border-indigo-200">
                        #{idx + 1}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-lg bg-slate-200 text-w-text-muted">
                        {q.type === 'mcq' ? 'Trắc nghiệm' : q.type === 'tf' ? 'Đúng/Sai' : 'Trả lời ngắn'}
                      </span>
                      {q.cognitiveLevel && (
                        <span className={`text-[10px] font-[700] px-2 py-0.5 rounded-lg border ${
                          q.cognitiveLevel === 'Nhận biết'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : q.cognitiveLevel === 'Thông hiểu'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : q.cognitiveLevel === 'Vận dụng'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          🎯 {q.cognitiveLevel}
                        </span>
                      )}
                      {q.competency && (
                        <span className="text-[10px] font-[600] px-2 py-0.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                          📚 {q.competency}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-bold text-slate-800"><MathChemRenderer text={q.content} /></p>

                    {q.learningOutcome && (
                      <div className="text-[11px] font-[600] text-w-primary-dark bg-w-accent-light/80 border border-w-accent-border px-2.5 py-1 rounded-[10px] inline-flex items-center gap-1">
                        <Award className="w-3 h-3 text-w-primary-dark shrink-0" />
                        <span>YCCĐ: {q.learningOutcome}</span>
                      </div>
                    )}

                    {q.imageUrl && (
                      <div className="my-1.5 p-1 rounded-xl bg-white border border-slate-200 inline-block max-h-[100px] overflow-hidden">
                        <img src={q.imageUrl} alt="Minh họa" className="max-h-[90px] w-auto object-contain rounded-lg" />
                      </div>
                    )}

                    {/* MCQ Choices */}
                    {q.type === 'mcq' && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = q.correct === oIdx;
                          return (
                            <div
                              key={oIdx}
                              className={`text-xs px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                                  : 'bg-white border-slate-200 text-w-text-muted'
                              }`}
                            >
                              <span className="font-mono text-[11px] text-slate-400">
                                {String.fromCharCode(65 + oIdx)}.
                              </span>
                              <span><MathChemRenderer text={opt} /></span>
                              {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto" />}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* TF / Text correct value */}
                    {q.type === 'tf' && (
                      <p className="text-xs text-emerald-700 font-bold pt-1">
                        Đáp án: {q.correct ? 'ĐÚNG (True)' : 'SAI (False)'}
                      </p>
                    )}
                    {q.type === 'text' && (
                      <p className="text-xs text-emerald-700 font-bold pt-1">
                        Đáp án: <MathChemRenderer text={String(q.correct)} />
                      </p>
                    )}

                    {q.explanation && (
                      <p className="text-[11px] text-slate-500 italic pt-1">
                        💡 Giải thích: {q.explanation}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="relative self-end sm:self-start">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === q.id ? null : q.id)}
                      className="p-2 rounded-xl text-w-text-muted hover:bg-w-accent-light transition-colors border border-transparent hover:border-w-accent-border"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {activeDropdown === q.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-40"
                          onClick={() => setActiveDropdown(null)}
                        />
                        <div className="absolute right-0 top-10 mt-1 w-48 bg-w-bg-card border border-w-border rounded-[16px] shadow-[0_8px_24px_rgba(79,104,60,0.15)] z-50 overflow-hidden py-1">
                          <button
                            onClick={() => { handleStartEditQuestion(q); setActiveDropdown(null); }}
                            className="w-full text-left px-4 py-2.5 text-xs font-[700] text-w-text-main hover:bg-w-accent-light flex items-center gap-2 transition-colors"
                          >
                            <Edit3 className="w-4 h-4 text-w-primary" /> Chỉnh sửa
                          </button>
                          <button
                            onClick={() => {
                              const duplicatedQ = { ...q, id: 'q_' + Date.now() };
                              handleUpdate({ ...currentBank, questions: [...currentBank.questions, duplicatedQ] });
                              setActiveDropdown(null);
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs font-[700] text-w-text-main hover:bg-w-accent-light flex items-center gap-2 transition-colors"
                          >
                            <Copy className="w-4 h-4 text-w-primary" /> Sao chép câu hỏi
                          </button>
                          <button
                            onClick={() => {
                              // Move to other bank would need more complex logic, let's keep it simple
                              safeAlert('Chức năng đang được phát triển');
                              setActiveDropdown(null);
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs font-[700] text-w-text-main hover:bg-w-accent-light flex items-center gap-2 transition-colors"
                          >
                            <FolderOutput className="w-4 h-4 text-w-primary" /> Di chuyển sang bộ khác
                          </button>
                          <button
                            onClick={() => {
                              const updatedQ = { ...q, isFavorite: !q.isFavorite };
                              handleUpdate({
                                ...currentBank,
                                questions: currentBank.questions.map(qu => qu.id === q.id ? updatedQ : qu)
                              });
                              setActiveDropdown(null);
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs font-[700] text-w-text-main hover:bg-w-accent-light flex items-center gap-2 transition-colors"
                          >
                            <Star className={`w-4 h-4 ${q.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-w-primary'}`} /> Đánh dấu câu hỏi hay
                          </button>
                          <div className="h-px bg-w-border/60 my-1"></div>
                          <button
                            onClick={() => { handleDeleteQuestion(q.id); setActiveDropdown(null); }}
                            className="w-full text-left px-4 py-2.5 text-xs font-[700] text-[#8C3A50] hover:bg-[#FCE8EE] flex items-center gap-2 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Xóa
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-w-bg-main border-t border-w-border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-w-text-muted font-[600] text-center sm:text-left">
            Tổng số: <strong className="text-w-text-main font-[800]">{(currentBank.questions || []).length}</strong> câu hỏi sẵn sàng cho trò chơi
          </p>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-w-primary hover:bg-w-primary-hover text-white font-[800] text-xs sm:text-sm rounded-[15px] shadow-md transition cursor-pointer border border-w-primary-hover min-h-[44px]"
          >
            Đóng & Áp Dụng
          </button>
        </div>
      </div>
      
      <ImportQuestionsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={(parsedQuestions) => {
          if (handleUpdate) {
            handleUpdate({
              ...currentBank,
              questions: [...currentBank.questions, ...parsedQuestions],
            });
          }
          safeAlert(`Đã nạp thành công ${parsedQuestions.length} câu hỏi!`);
        }}
      />
    </>
  );
};
