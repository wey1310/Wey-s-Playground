import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Upload,
  Download,
  FileText,
  Check,
  HelpCircle,
  Copy,
  Star,
  FolderOutput,
  Save,
  RotateCcw,
  ShieldCheck,
  Search,
  Filter,
  Layers,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  ArrowRight,
  Image as ImageIcon,
  BookOpen,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Database,
  Bot,
  ExternalLink
} from 'lucide-react';
import type { QuestionBank, Question, QuestionType, CognitiveLevel } from '../types';
import { COGNITIVE_LEVELS_INFO } from '../data/curriculumData';
import { uploadImageFile } from '../utils/imageStorage';
import { MathChemRenderer } from '../utils/mathChemFormatter';
import { ImportQuestionsModal } from './ImportQuestionsModal';
import { safeAlert, safeConfirm } from '../utils/safeAlert';

interface QuestionBankEditorProps {
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
}

const AUTOSAVE_STORAGE_KEY = 'wey_qbank_editor_autosave';

interface AutoSaveData {
  timestamp: number;
  bankId: string;
  bankName: string;
  questionsCount: number;
  questions: Question[];
}

export const QuestionBankEditor: React.FC<QuestionBankEditorProps> = ({
  onClose,
  banks,
  questionBanks,
  activeBankId,
  onSelectBank,
  onCreateBank,
  onUpdateBank,
  onSaveBank,
  onDeleteBank,
}) => {
  const bankList = banks || questionBanks || [];
  const handleUpdate = onUpdateBank || onSaveBank;

  const currentBank = useMemo(() => {
    return bankList.find(b => b.id === activeBankId) || bankList[0];
  }, [bankList, activeBankId]);

  // Retrieve Gem AI Converter URL from saved web configuration
  const gemConverterUrl = useMemo(() => {
    try {
      const saved = localStorage.getItem('wey_web_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.gemConverterUrl;
      }
    } catch (e) {}
    return undefined;
  }, []);

  // Sidebar & Bank Search
  const [bankSearch, setBankSearch] = useState('');
  const [showCreateBankModal, setShowCreateBankModal] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newBankSubject, setNewBankSubject] = useState('Toán');
  const [newBankGrade, setNewBankGrade] = useState('Lớp 5');

  // Question Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | QuestionType>('all');
  const [cognitiveFilter, setCognitiveFilter] = useState<'all' | CognitiveLevel>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [targetBankId, setTargetBankId] = useState('');

  // Add / Edit Modal
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form States
  const [qType, setQType] = useState<QuestionType>('mcq');
  const [qContent, setQContent] = useState('');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qMcqCorrect, setQMcqCorrect] = useState<number>(0);
  const [qTfCorrect, setQTfCorrect] = useState<boolean>(true);
  const [qTextCorrect, setQTextCorrect] = useState<string>('');
  const [qExplanation, setQExplanation] = useState('');
  const [qImageUrl, setQImageUrl] = useState('');
  const [qCognitiveLevel, setQCognitiveLevel] = useState<CognitiveLevel>('Thông hiểu');
  const [qLearningOutcome, setQLearningOutcome] = useState('');
  const [qCompetency, setQCompetency] = useState('');
  const [focusedField, setFocusedField] = useState<'content' | 'opt0' | 'opt1' | 'opt2' | 'opt3' | 'text' | 'explanation'>('content');

  // Modals & Auto-Save
  const [showImportModal, setShowImportModal] = useState(false);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<number | null>(null);
  const [savedDraftAvailable, setSavedDraftAvailable] = useState<AutoSaveData | null>(null);

  // Filtered Banks for Sidebar
  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return bankList;
    const q = bankSearch.toLowerCase();
    return bankList.filter(
      b =>
        b.name.toLowerCase().includes(q) ||
        (b.subject && b.subject.toLowerCase().includes(q)) ||
        (b.grade && b.grade.toLowerCase().includes(q))
    );
  }, [bankList, bankSearch]);

  // Filtered Questions in Active Bank
  const filteredQuestions = useMemo(() => {
    if (!currentBank || !currentBank.questions) return [];
    return currentBank.questions.filter(q => {
      // Type Filter
      if (typeFilter !== 'all' && q.type !== typeFilter) return false;

      // Cognitive Filter
      if (cognitiveFilter !== 'all' && q.cognitiveLevel !== cognitiveFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const contentMatch = q.content.toLowerCase().includes(query);
        const explanationMatch = q.explanation?.toLowerCase().includes(query);
        const optionsMatch = q.options?.some(opt => opt.toLowerCase().includes(query));
        const correctMatch = String(q.correct).toLowerCase().includes(query);
        if (!contentMatch && !explanationMatch && !optionsMatch && !correctMatch) return false;
      }

      return true;
    });
  }, [currentBank, typeFilter, cognitiveFilter, searchQuery]);

  // Check autosave on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
      if (raw) {
        const parsed: AutoSaveData = JSON.parse(raw);
        if (Date.now() - parsed.timestamp < 72 * 60 * 60 * 1000) {
          if (parsed.bankId === activeBankId && parsed.questions.length !== (currentBank?.questions || []).length) {
            setSavedDraftAvailable(parsed);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse autosave draft:', e);
    }
  }, [activeBankId]);

  // Periodic autosave every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (!currentBank) return;
      try {
        const saveData: AutoSaveData = {
          timestamp: Date.now(),
          bankId: currentBank.id,
          bankName: currentBank.name,
          questionsCount: currentBank.questions.length,
          questions: currentBank.questions,
        };
        localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(saveData));
        setLastAutoSaveTime(Date.now());
      } catch (e) {
        console.warn('Auto-save error:', e);
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [currentBank]);

  // Clear selections when switching bank
  useEffect(() => {
    setSelectedIds([]);
  }, [activeBankId]);

  // -------------------------------------------------------------
  // HANDLERS FOR ADD / EDIT QUESTION (FIXED COMPLETELY)
  // -------------------------------------------------------------
  const handleOpenAddQuestion = () => {
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
    setShowQuestionModal(true);
  };

  const handleOpenEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setQType(q.type || 'mcq');
    setQContent(q.content || '');
    setQExplanation(q.explanation || '');
    setQImageUrl(q.imageUrl || '');
    setQCognitiveLevel((q.cognitiveLevel as CognitiveLevel) || 'Thông hiểu');
    setQLearningOutcome(q.learningOutcome || '');
    setQCompetency(q.competency || '');

    // Map MCQ options
    if (q.type === 'mcq') {
      const opts = Array.isArray(q.options) && q.options.length > 0
        ? [...q.options, '', '', ''].slice(0, 4)
        : ['', '', '', ''];
      setQOptions(opts);
      setQMcqCorrect(typeof q.correct === 'number' && q.correct >= 0 && q.correct <= 3 ? q.correct : 0);
    } else if (q.type === 'tf') {
      setQTfCorrect(typeof q.correct === 'boolean' ? q.correct : q.correct === 'true' || q.correct === 1);
    } else {
      setQTextCorrect(String(q.correct ?? ''));
    }

    setShowQuestionModal(true);
  };

  const handleSaveQuestionForm = (e?: React.FormEvent, forceDuplicate = false) => {
    if (e) e.preventDefault();

    if (!qContent.trim()) {
      safeAlert('Vui lòng nhập nội dung câu hỏi!');
      return;
    }

    let finalCorrect: number | boolean | string = 0;

    if (qType === 'mcq') {
      if (qOptions.some(opt => !opt.trim())) {
        safeAlert('Vui lòng nhập đầy đủ cả 4 phương án A, B, C, D!');
        return;
      }
      finalCorrect = qMcqCorrect;
    } else if (qType === 'tf') {
      finalCorrect = qTfCorrect;
    } else {
      if (!qTextCorrect.trim()) {
        safeAlert('Vui lòng nhập đáp án chính xác!');
        return;
      }
      finalCorrect = qTextCorrect.trim();
    }

    const questionToSave: Question = {
      id: editingQuestion && !forceDuplicate ? editingQuestion.id : `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: qType,
      content: qContent.trim(),
      options: qType === 'mcq' ? qOptions.map(o => o.trim()) : undefined,
      correct: finalCorrect,
      explanation: qExplanation.trim(),
      imageUrl: qImageUrl.trim() || undefined,
      cognitiveLevel: qCognitiveLevel,
      learningOutcome: qLearningOutcome.trim() || undefined,
      competency: qCompetency.trim() || undefined,
      isFavorite: editingQuestion && !forceDuplicate ? editingQuestion.isFavorite : false,
    };

    if (!currentBank) {
      safeAlert('Lỗi: Không tìm thấy ngân hàng câu hỏi hiện tại!');
      return;
    }

    let updatedQuestions = [...(currentBank.questions || [])];

    if (editingQuestion && !forceDuplicate) {
      // Update existing item
      const targetIndex = updatedQuestions.findIndex(q => q.id === editingQuestion.id);
      if (targetIndex !== -1) {
        updatedQuestions[targetIndex] = questionToSave;
      } else {
        updatedQuestions.push(questionToSave);
      }
    } else {
      // Add new or duplicate
      updatedQuestions.push(questionToSave);
    }

    const updatedBank: QuestionBank = {
      ...currentBank,
      questions: updatedQuestions,
      updatedAt: new Date().toISOString(),
    };

    if (handleUpdate) {
      handleUpdate(updatedBank);
    }

    setShowQuestionModal(false);
    setEditingQuestion(null);
    safeAlert(editingQuestion && !forceDuplicate ? '✅ Đã cập nhật câu hỏi thành công!' : '✅ Đã thêm câu hỏi vào bộ đề!');
  };

  const handleDeleteSingleQuestion = (qId: string) => {
    if (!currentBank) return;
    if (safeConfirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      const remaining = currentBank.questions.filter(q => q.id !== qId);
      const updatedBank = {
        ...currentBank,
        questions: remaining,
        updatedAt: new Date().toISOString(),
      };
      if (handleUpdate) handleUpdate(updatedBank);
      setSelectedIds(prev => prev.filter(id => id !== qId));
    }
  };

  const handleDuplicateQuestion = (q: Question) => {
    if (!currentBank) return;
    const duplicated: Question = {
      ...q,
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    const updatedBank = {
      ...currentBank,
      questions: [...currentBank.questions, duplicated],
      updatedAt: new Date().toISOString(),
    };
    if (handleUpdate) handleUpdate(updatedBank);
    safeAlert('✅ Đã nhân bản câu hỏi thành công!');
  };

  const handleToggleFavorite = (qId: string) => {
    if (!currentBank) return;
    const updated = currentBank.questions.map(q => {
      if (q.id === qId) {
        return { ...q, isFavorite: !q.isFavorite };
      }
      return q;
    });
    if (handleUpdate) handleUpdate({ ...currentBank, questions: updated });
  };

  // -------------------------------------------------------------
  // BULK ACTIONS
  // -------------------------------------------------------------
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredQuestions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredQuestions.map(q => q.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (!currentBank || selectedIds.length === 0) return;
    if (safeConfirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} câu hỏi đã chọn?`)) {
      const remaining = currentBank.questions.filter(q => !selectedIds.includes(q.id));
      if (handleUpdate) {
        handleUpdate({
          ...currentBank,
          questions: remaining,
          updatedAt: new Date().toISOString(),
        });
      }
      setSelectedIds([]);
      safeAlert(`✅ Đã xóa ${selectedIds.length} câu hỏi!`);
    }
  };

  const handleBulkChangeCognitive = (level: CognitiveLevel) => {
    if (!currentBank || selectedIds.length === 0) return;
    const updated = currentBank.questions.map(q => {
      if (selectedIds.includes(q.id)) {
        return { ...q, cognitiveLevel: level };
      }
      return q;
    });
    if (handleUpdate) {
      handleUpdate({
        ...currentBank,
        questions: updated,
        updatedAt: new Date().toISOString(),
      });
    }
    safeAlert(`✅ Đã chuyển ${selectedIds.length} câu hỏi sang mức độ: ${level}!`);
  };

  const handleBulkMove = () => {
    if (!currentBank || selectedIds.length === 0 || !targetBankId) return;
    const destBank = bankList.find(b => b.id === targetBankId);
    if (!destBank) return;

    const questionsToMove = currentBank.questions.filter(q => selectedIds.includes(q.id));
    const remainingQuestions = currentBank.questions.filter(q => !selectedIds.includes(q.id));

    // Update current bank
    if (handleUpdate) {
      handleUpdate({
        ...currentBank,
        questions: remainingQuestions,
        updatedAt: new Date().toISOString(),
      });
      // Update destination bank
      handleUpdate({
        ...destBank,
        questions: [...destBank.questions, ...questionsToMove],
        updatedAt: new Date().toISOString(),
      });
    }

    setSelectedIds([]);
    setShowMoveModal(false);
    safeAlert(`✅ Đã di chuyển ${questionsToMove.length} câu hỏi sang bộ "${destBank.name}"!`);
  };

  // -------------------------------------------------------------
  // FORM HELPERS
  // -------------------------------------------------------------
  const handleInsertToken = (token: string) => {
    if (focusedField === 'content') {
      setQContent(prev => prev + ' ' + token);
    } else if (focusedField === 'opt0') {
      setQOptions(prev => [prev[0] + ' ' + token, prev[1], prev[2], prev[3]]);
    } else if (focusedField === 'opt1') {
      setQOptions(prev => [prev[0], prev[1] + ' ' + token, prev[2], prev[3]]);
    } else if (focusedField === 'opt2') {
      setQOptions(prev => [prev[0], prev[1], prev[2] + ' ' + token, prev[3]]);
    } else if (focusedField === 'opt3') {
      setQOptions(prev => [prev[0], prev[1], prev[2], prev[3] + ' ' + token]);
    } else if (focusedField === 'text') {
      setQTextCorrect(prev => prev + ' ' + token);
    } else if (focusedField === 'explanation') {
      setQExplanation(prev => prev + ' ' + token);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImageFile(file, 'teacher@weyplay.edu.vn');
      setQImageUrl(url);
      safeAlert('Đã tải ảnh lên thành công!');
    } catch (err: any) {
      safeAlert(`Lỗi tải ảnh: ${err.message}`);
    }
  };

  const handleExportBank = () => {
    if (!currentBank) return;
    const jsonStr = JSON.stringify(currentBank, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentBank.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim()) return;
    const newB: QuestionBank = {
      id: `bank_${Date.now()}`,
      name: newBankName.trim(),
      subject: newBankSubject,
      grade: newBankGrade,
      topic: 'Luyện tập',
      questions: [],
      isPreset: false,
      createdAt: new Date().toISOString(),
    };
    if (onCreateBank) onCreateBank(newB);
    onSelectBank(newB.id);
    setNewBankName('');
    setShowCreateBankModal(false);
    safeAlert('✅ Đã tạo bộ câu hỏi mới!');
  };

  const formulaChips = [
    { label: 'x²', text: 'x^2' },
    { label: 'x₁', text: 'x_1' },
    { label: 'a/b', text: '\\frac{a}{b}' },
    { label: '√x', text: '\\sqrt{x}' },
    { label: 'H₂O', text: 'H2O' },
    { label: 'CO₂', text: 'CO2' },
    { label: '±', text: '\\pm' },
    { label: '≤', text: '\\le' },
    { label: '≥', text: '\\ge' },
    { label: 'π', text: '\\pi' },
    { label: '°C', text: '^\\circ C' },
    { label: '→', text: '->' },
  ];

  return (
    <div className="bg-w-bg-card border border-w-border w-full rounded-[26px] shadow-[0_12px_36px_rgba(79,104,60,0.14)] overflow-hidden flex flex-col wey-paper-card min-h-[750px] max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="p-4 sm:p-5 bg-w-bg-main border-b border-w-border flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-w-accent-light text-w-primary-dark rounded-[16px] border border-w-accent-border shadow-xs">
            <Database className="w-6 h-6 text-w-primary" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-[800] text-w-text-main flex items-center gap-2">
              <span>Quản Lý Ngân Hàng Câu Hỏi</span>
              {currentBank && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-w-primary/10 text-w-primary font-bold border border-w-primary/20">
                  {currentBank.questions?.length || 0} câu
                </span>
              )}
            </h2>
            <p className="text-xs font-[600] text-w-text-muted">
              Quản lý danh sách câu hỏi, lọc thông minh, soạn thảo và gán đáp án trực quan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-w-border rounded-[14px] text-w-text-muted font-[700] text-xs hover:text-w-text-main hover:bg-w-bg-main transition shadow-sm cursor-pointer"
          >
            Đóng & Trở về
          </button>
        </div>
      </div>

      {/* Main Container: 2 Columns */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* LEFT COLUMN: Bank List & Actions */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-w-border bg-w-bg-alt/50 p-4 flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-[800] text-w-text-main uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-w-primary" />
              Bộ Đề ({bankList.length})
            </span>
            <button
              onClick={() => setShowCreateBankModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl wey-btn-primary text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo Mới</span>
            </button>
          </div>

          {/* Bank Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-w-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={bankSearch}
              onChange={e => setBankSearch(e.target.value)}
              placeholder="Tìm kiếm bộ đề..."
              className="w-full pl-8 pr-3 py-1.5 bg-w-input-bg border border-w-input-border rounded-xl text-xs text-w-text-main placeholder:text-w-text-muted/60 focus:outline-none focus:border-w-primary"
            />
          </div>

          {/* List of Banks */}
          <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[500px] pr-1">
            {filteredBanks.map(bank => {
              const isActive = bank.id === activeBankId;
              return (
                <div
                  key={bank.id}
                  onClick={() => onSelectBank(bank.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-w-accent-light/80 border-w-primary shadow-xs ring-1 ring-w-primary/30'
                      : 'bg-w-bg-card border-w-border hover:border-w-accent-border hover:bg-w-accent-light'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <h4 className={`text-xs font-bold leading-snug line-clamp-1 ${isActive ? 'text-w-primary font-extrabold' : 'text-w-text-main'}`}>
                      {bank.name}
                    </h4>
                    {bank.isPreset && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold shrink-0">
                        ⭐ Mẫu
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[11px] text-w-text-muted">
                    <span>
                      {bank.subject || 'Tổng hợp'} • {bank.grade || 'Chung'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      isActive ? 'bg-w-primary text-white' : 'bg-w-bg-alt text-w-text-main'
                    }`}>
                      {bank.questions?.length || 0} câu
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bank Management Options */}
          {currentBank && (
            <div className="pt-2 border-t border-w-border space-y-2">
              <div className="flex items-center justify-between text-xs text-w-text-muted font-semibold">
                <span>Bộ đang chọn:</span>
                <span className="text-w-primary font-bold">{currentBank.questions?.length || 0} câu</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-w-bg-card hover:bg-w-accent-light border border-w-border text-w-text-main text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-w-primary" />
                  <span>Nạp file</span>
                </button>
                <button
                  onClick={handleExportBank}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-w-bg-card hover:bg-w-accent-light border border-w-border text-w-text-main text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-w-primary" />
                  <span>Xuất JSON</span>
                </button>
              </div>

              {!currentBank.isPreset && bankList.length > 1 && (
                <button
                  onClick={() => {
                    if (safeConfirm(`Xác nhận xóa bộ đề "${currentBank.name}"?`)) {
                      if (onDeleteBank) onDeleteBank(currentBank.id);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa bộ đề này</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Question List & Tools */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Active Bank Header & Add Question CTA */}
          <div className="bg-w-bg-card p-4 rounded-2xl border border-w-border shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-[800] text-w-text-main">
                  {currentBank?.name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {currentBank?.questions?.length || 0} câu hỏi
                </span>
              </div>
              <p className="text-xs text-w-text-muted mt-0.5">
                Môn: <span className="font-bold text-w-text-main">{currentBank?.subject}</span> • Khối: <span className="font-bold text-w-text-main">{currentBank?.grade}</span> • Chủ đề: <span className="font-bold text-w-text-main">{currentBank?.topic || 'Luyện tập'}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {gemConverterUrl && (
                <a
                  href={gemConverterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition hover:scale-105 cursor-pointer"
                  title="Chuyển đổi văn bản câu hỏi thành format chuẩn bằng Gem AI"
                >
                  <Bot className="w-4 h-4" />
                  <span>Chuyển Đổi Bằng Gem AI</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={handleOpenAddQuestion}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl wey-btn-primary text-xs sm:text-sm shadow-sm transition hover:-translate-y-0.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Câu Hỏi Mới</span>
              </button>
            </div>
          </div>

          {/* SMART SEARCH & FILTER TOOLBAR */}
          <div className="bg-w-bg-card p-3.5 rounded-2xl border border-w-border shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              {/* Search input */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-w-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo nội dung, đáp án, hoặc giải thích..."
                  className="w-full pl-9 pr-8 py-2 bg-w-input-bg border border-w-input-border rounded-xl text-xs sm:text-sm text-w-text-main focus:bg-w-bg-card focus:outline-none focus:border-w-primary transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-w-text-muted hover:text-w-text-main p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View Switcher */}
              <div className="flex items-center p-1 bg-w-bg-alt rounded-xl border border-w-border shrink-0">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                    viewMode === 'cards' ? 'bg-w-bg-card text-w-primary shadow-xs' : 'text-w-text-muted hover:text-w-text-main'
                  }`}
                  title="Xem dạng thẻ chi tiết"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Thẻ</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                    viewMode === 'table' ? 'bg-w-bg-card text-w-primary shadow-xs' : 'text-w-text-muted hover:text-w-text-main'
                  }`}
                  title="Xem dạng bảng"
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">Bảng</span>
                </button>
              </div>
            </div>

            {/* Filter Pills (CLICK > GÕ) */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-w-border/60 text-xs">
              <span className="text-w-text-muted font-bold flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5 text-w-primary" />
                Loại câu:
              </span>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'mcq', label: '🔘 Trắc nghiệm' },
                { id: 'tf', label: '⚖️ Đúng / Sai' },
                { id: 'text', label: '✍️ Điền từ' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTypeFilter(t.id as any)}
                  className={`px-2.5 py-1 rounded-xl font-bold transition cursor-pointer ${
                    typeFilter === t.id
                      ? 'bg-w-primary text-white shadow-xs'
                      : 'bg-w-bg-alt hover:bg-w-accent-light text-w-text-main'
                  }`}
                >
                  {t.label}
                </button>
              ))}

              <div className="h-4 w-px bg-w-border mx-1 hidden sm:block"></div>

              <span className="text-w-text-muted font-bold shrink-0">Nhận thức:</span>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'Nhận biết', label: 'Nhận biết' },
                { id: 'Thông hiểu', label: 'Thông hiểu' },
                { id: 'Vận dụng', label: 'Vận dụng' },
                { id: 'Vận dụng cao', label: 'Vận dụng cao' },
              ].map(cog => (
                <button
                  key={cog.id}
                  onClick={() => setCognitiveFilter(cog.id as any)}
                  className={`px-2.5 py-1 rounded-xl font-bold transition cursor-pointer ${
                    cognitiveFilter === cog.id
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-w-bg-alt hover:bg-w-accent-light text-w-text-main'
                  }`}
                >
                  {cog.label}
                </button>
              ))}
            </div>
          </div>

          {/* BULK ACTIONS TOOLBAR (Appears when >= 1 question selected) */}
          {selectedIds.length > 0 && (
            <div className="bg-amber-500 text-slate-950 p-3 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-3 animate-fade-in border border-amber-600">
              <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                <CheckSquare className="w-4 h-4 text-slate-900" />
                <span>Đã chọn {selectedIds.length} câu hỏi</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa các câu đã chọn</span>
                </button>

                {/* Dropdown to change cognitive level */}
                <div className="relative inline-block">
                  <select
                    onChange={e => {
                      if (e.target.value) {
                        handleBulkChangeCognitive(e.target.value as CognitiveLevel);
                        e.target.value = '';
                      }
                    }}
                    className="px-3 py-1.5 bg-white text-slate-800 rounded-xl font-bold text-xs shadow-xs border border-slate-300 cursor-pointer focus:outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>🎯 Đổi mức độ nhận thức...</option>
                    <option value="Nhận biết">Nhận biết</option>
                    <option value="Thông hiểu">Thông hiểu</option>
                    <option value="Vận dụng">Vận dụng</option>
                    <option value="Vận dụng cao">Vận dụng cao</option>
                  </select>
                </div>

                {/* Move to another bank */}
                <button
                  onClick={() => setShowMoveModal(true)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FolderOutput className="w-3.5 h-3.5 text-w-primary" />
                  <span>Di chuyển sang bộ khác</span>
                </button>

                <button
                  onClick={() => setSelectedIds([])}
                  className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          )}

          {/* Select all header */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleSelectAll}
                className="flex items-center gap-1.5 hover:text-slate-800 transition cursor-pointer"
              >
                {selectedIds.length === filteredQuestions.length && filteredQuestions.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-w-primary" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Chọn tất cả ({filteredQuestions.length} câu)</span>
              </button>
            </div>
            <span>Hiển thị {filteredQuestions.length} câu hỏi</span>
          </div>

          {/* EMPTY STATE */}
          {filteredQuestions.length === 0 && (
            <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8 space-y-3">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">Không tìm thấy câu hỏi nào</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchQuery || typeFilter !== 'all' || cognitiveFilter !== 'all'
                  ? 'Không có câu hỏi nào khớp với bộ lọc. Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.'
                  : 'Bộ đề này hiện chưa có câu hỏi nào. Bấm nút "Thêm Câu Hỏi Mới" hoặc "Nạp file" để bắt đầu!'}
              </p>
              <button
                onClick={handleOpenAddQuestion}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-w-primary-dark text-white font-bold text-xs shadow-sm hover:bg-w-primary transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Câu Hỏi Đầu Tiên</span>
              </button>
            </div>
          )}

          {/* CARD VIEW */}
          {viewMode === 'cards' && filteredQuestions.length > 0 && (
            <div className="space-y-3">
              {filteredQuestions.map((q, idx) => {
                const isSelected = selectedIds.includes(q.id);
                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-amber-50/50 border-amber-400 shadow-xs'
                        : 'bg-w-bg-card border-w-border hover:border-w-accent-border shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleSelectOne(q.id)}
                        className="mt-0.5 text-w-text-muted hover:text-w-primary transition cursor-pointer shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-w-primary" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      {/* Main Info */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Badges row */}
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="px-2 py-0.5 rounded-md font-bold bg-w-bg-alt text-w-text-main font-mono text-[11px]">
                            #{idx + 1}
                          </span>

                          <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] border ${
                            q.type === 'mcq'
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : q.type === 'tf'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          }`}>
                            {q.type === 'mcq' ? 'Trắc nghiệm' : q.type === 'tf' ? 'Đúng / Sai' : 'Điền từ'}
                          </span>

                          {q.cognitiveLevel && (
                            <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {q.cognitiveLevel}
                            </span>
                          )}

                          {q.imageUrl && (
                            <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              Ảnh minh họa
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="text-sm font-semibold text-w-text-main leading-relaxed">
                          <MathChemRenderer text={q.content} />
                        </div>

                        {/* Image preview if exists */}
                        {q.imageUrl && (
                          <div className="mt-1">
                            <img
                              src={q.imageUrl}
                              alt="Minh họa"
                              className="max-h-28 rounded-xl border border-w-border object-contain bg-w-bg-alt p-1"
                            />
                          </div>
                        )}

                        {/* Options for MCQ */}
                        {q.type === 'mcq' && q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect = q.correct === oIdx;
                              return (
                                <div
                                  key={oIdx}
                                  className={`text-xs px-2.5 py-1.5 rounded-xl border flex items-center gap-2 ${
                                    isCorrect
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                      : 'bg-w-bg-alt/70 border-w-border text-w-text-main'
                                  }`}
                                >
                                  <span className="font-bold text-w-text-muted font-mono text-[11px]">
                                    {String.fromCharCode(65 + oIdx)}.
                                  </span>
                                  <span className="flex-1 truncate">
                                    <MathChemRenderer text={opt} />
                                  </span>
                                  {isCorrect && (
                                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-200/80 px-1.5 py-0.5 rounded">
                                      ĐÚNG
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* TF Answer */}
                        {q.type === 'tf' && (
                          <p className="text-xs text-emerald-800 font-bold pt-0.5">
                            Đáp án đúng: <span className="underline">{q.correct ? 'ĐÚNG (True)' : 'SAI (False)'}</span>
                          </p>
                        )}

                        {/* Text Answer */}
                        {q.type === 'text' && (
                          <p className="text-xs text-emerald-800 font-bold pt-0.5">
                            Đáp án đúng: <span className="underline"><MathChemRenderer text={String(q.correct)} /></span>
                          </p>
                        )}

                        {/* Explanation */}
                        {q.explanation && (
                          <p className="text-xs text-w-text-muted italic bg-w-bg-alt p-2 rounded-xl border border-w-border/60">
                            💡 Giải thích: {q.explanation}
                          </p>
                        )}
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleOpenEditQuestion(q)}
                          className="px-3 py-1.5 bg-w-accent-light hover:bg-w-accent-muted text-w-primary-dark font-bold text-xs rounded-xl border border-w-accent-border transition flex items-center gap-1 cursor-pointer"
                          title="Sửa câu hỏi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>
                        <button
                          onClick={() => handleDuplicateQuestion(q)}
                          className="p-1.5 text-w-text-muted hover:text-w-text-main hover:bg-w-accent-light rounded-xl transition cursor-pointer"
                          title="Nhân bản câu hỏi"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleFavorite(q.id)}
                          className="p-1.5 text-w-text-muted hover:text-amber-500 hover:bg-w-accent-light rounded-xl transition cursor-pointer"
                          title="Đánh dấu câu hay"
                        >
                          <Star className={`w-4 h-4 ${q.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleDeleteSingleQuestion(q.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Xóa câu hỏi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TABLE VIEW */}
          {viewMode === 'table' && filteredQuestions.length > 0 && (
            <div className="bg-w-bg-card rounded-2xl border border-w-border overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-w-bg-alt border-b border-w-border text-w-text-muted font-bold">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">
                        <button onClick={handleToggleSelectAll} className="cursor-pointer">
                          {selectedIds.length === filteredQuestions.length && filteredQuestions.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-w-primary" />
                          ) : (
                            <Square className="w-4 h-4 text-w-text-muted" />
                          )}
                        </button>
                      </th>
                      <th className="py-2.5 px-3 w-12 text-center">STT</th>
                      <th className="py-2.5 px-4 min-w-[280px]">Nội dung câu hỏi</th>
                      <th className="py-2.5 px-3 w-28">Loại</th>
                      <th className="py-2.5 px-3 w-28">Mức độ</th>
                      <th className="py-2.5 px-4 min-w-[140px]">Đáp án</th>
                      <th className="py-2.5 px-3 w-28 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-w-border/60">
                    {filteredQuestions.map((q, idx) => {
                      const isSelected = selectedIds.includes(q.id);
                      return (
                        <tr
                          key={q.id}
                          className={`hover:bg-w-accent-light transition-colors ${
                            isSelected ? 'bg-amber-50/50' : ''
                          }`}
                        >
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleToggleSelectOne(q.id)}
                              className="cursor-pointer text-w-text-muted hover:text-w-primary"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-w-primary" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-w-text-muted">
                            #{idx + 1}
                          </td>
                          <td className="py-3 px-4 font-semibold text-w-text-main max-w-md">
                            <div className="line-clamp-2">
                              <MathChemRenderer text={q.content} />
                            </div>
                            {q.imageUrl && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-purple-600 font-bold mt-1">
                                <ImageIcon className="w-3 h-3" /> Có ảnh minh họa
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-w-bg-alt text-w-text-main">
                              {q.type === 'mcq' ? 'Trắc nghiệm' : q.type === 'tf' ? 'Đúng/Sai' : 'Điền từ'}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {q.cognitiveLevel || 'Thông hiểu'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-800 max-w-xs truncate">
                            {q.type === 'mcq' ? (
                              <span>
                                {typeof q.correct === 'number'
                                  ? `${String.fromCharCode(65 + q.correct)}. ${q.options?.[q.correct] || ''}`
                                  : 'A'}
                              </span>
                            ) : q.type === 'tf' ? (
                              <span>{q.correct ? 'ĐÚNG' : 'SAI'}</span>
                            ) : (
                              <MathChemRenderer text={String(q.correct)} />
                            )}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditQuestion(q)}
                                className="p-1.5 text-w-primary hover:bg-w-accent-light rounded-lg transition cursor-pointer"
                                title="Sửa"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDuplicateQuestion(q)}
                                className="p-1.5 text-w-text-muted hover:bg-w-accent-light rounded-lg transition cursor-pointer"
                                title="Nhân bản"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSingleQuestion(q.id)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* ADD / EDIT QUESTION MODAL (PROFESSIONAL DIALOG OVERHAUL)       */}
      {/* ============================================================= */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-w-bg-card border border-w-border rounded-[28px] shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-in my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                  {editingQuestion ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-[800] text-amber-950">
                    {editingQuestion ? 'Chỉnh Sửa Câu Hỏi' : 'Thêm Câu Hỏi Mới'}
                  </h3>
                  <p className="text-xs text-amber-800 font-medium">
                    {currentBank?.name} • Môn {currentBank?.subject}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowQuestionModal(false);
                  setEditingQuestion(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white/60 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={e => handleSaveQuestionForm(e, false)} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Question Type Selector (Segmented Buttons) */}
              <div>
                <label className="block text-xs font-bold text-w-text-main mb-1.5">
                  1. Loại câu hỏi:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'mcq', label: '🔘 Trắc nghiệm (4 lựa chọn)' },
                    { id: 'tf', label: '⚖️ Đúng / Sai' },
                    { id: 'text', label: '✍️ Điền từ / Ngắn' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setQType(t.id as QuestionType)}
                      className={`py-2.5 px-3 rounded-xl font-extrabold text-xs transition border cursor-pointer ${
                        qType === t.id
                          ? 'bg-w-primary text-white border-w-primary shadow-xs'
                          : 'bg-w-bg-alt hover:bg-w-accent-light text-w-text-main border-w-border'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cognitive Level Selector (4 Buttons) */}
              <div>
                <label className="block text-xs font-bold text-w-text-main mb-1.5">
                  2. Mức độ nhận thức (CT GDPT 2018):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { level: 'Nhận biết', color: 'bg-sky-50 text-sky-800 border-sky-300' },
                    { level: 'Thông hiểu', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
                    { level: 'Vận dụng', color: 'bg-amber-50 text-amber-800 border-amber-300' },
                    { level: 'Vận dụng cao', color: 'bg-purple-50 text-purple-800 border-purple-300' },
                  ].map(cog => (
                    <button
                      key={cog.level}
                      type="button"
                      onClick={() => setQCognitiveLevel(cog.level as CognitiveLevel)}
                      className={`py-2 px-2.5 rounded-xl font-bold text-xs border transition cursor-pointer text-center ${
                        qCognitiveLevel === cog.level
                          ? 'bg-amber-500 text-slate-950 font-black border-amber-600 shadow-xs ring-2 ring-amber-300'
                          : `${cog.color} hover:brightness-95`
                      }`}
                    >
                      {cog.level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Math & Chemistry Token Chips */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-w-text-muted">
                    Chèn nhanh công thức Toán / Hóa:
                  </span>
                  <span className="text-[10px] text-w-text-muted">
                    Bấm vào chip để chèn vào ô đang gõ
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {formulaChips.map(chip => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleInsertToken(chip.text)}
                      className="px-2.5 py-1 bg-w-bg-alt hover:bg-w-primary hover:text-white text-w-text-main text-xs font-bold rounded-lg border border-w-border transition cursor-pointer shadow-xs"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Content Input */}
              <div>
                <label className="block text-xs font-bold text-w-text-main mb-1">
                  3. Nội dung câu hỏi: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={qContent}
                  onFocus={() => setFocusedField('content')}
                  onChange={e => setQContent(e.target.value)}
                  placeholder="Nhập nội dung câu hỏi (hỗ trợ công thức LaTeX, $x^2$, H2O...)..."
                  className="w-full bg-w-input-bg border border-w-input-border text-w-text-main rounded-xl p-3 text-sm focus:outline-none focus:border-w-primary focus:ring-2 focus:ring-w-accent-light"
                  required
                />
                {/* Live Formula Preview */}
                {qContent.trim() && (
                  <div className="mt-1.5 p-2.5 bg-w-accent-light/50 border border-w-accent-border rounded-xl flex items-start gap-2">
                    <span className="text-[10px] font-extrabold uppercase text-w-primary-dark shrink-0 mt-0.5 bg-w-accent-light px-1.5 py-0.5 rounded">
                      Xem trước:
                    </span>
                    <div className="flex-1 font-semibold text-w-text-main text-xs sm:text-sm">
                      <MathChemRenderer text={qContent} />
                    </div>
                  </div>
                )}
              </div>

              {/* DYNAMIC ANSWER SECTION DEPENDING ON TYPE */}
              {qType === 'mcq' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-w-text-main">
                      4. Bốn phương án trả lời: <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-emerald-700 font-bold">
                      👉 Bấm vào ô tròn hoặc dòng đáp án để chọn ĐÁP ÁN ĐÚNG
                    </span>
                  </div>

                  {['A', 'B', 'C', 'D'].map((label, idx) => {
                    const isCorrect = qMcqCorrect === idx;
                    const optKey = `opt${idx}` as any;
                    return (
                      <div
                        key={label}
                        onClick={() => setQMcqCorrect(idx)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isCorrect
                            ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-300/60'
                            : 'bg-w-bg-alt border-w-border hover:border-w-accent-border'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correctMcq"
                            checked={isCorrect}
                            onChange={() => setQMcqCorrect(idx)}
                            className="w-4 h-4 text-emerald-600 accent-emerald-600 cursor-pointer"
                          />
                          <span className={`w-5 font-black text-xs ${isCorrect ? 'text-emerald-900' : 'text-w-text-muted'}`}>
                            {label}.
                          </span>
                          <input
                            type="text"
                            value={qOptions[idx] || ''}
                            onFocus={() => setFocusedField(optKey)}
                            onChange={e => {
                              const updated = [...qOptions];
                              updated[idx] = e.target.value;
                              setQOptions(updated);
                            }}
                            placeholder={`Nội dung phương án ${label}...`}
                            className="flex-1 bg-w-input-bg border border-w-input-border text-w-text-main rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                            required
                          />
                          {isCorrect && (
                            <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md font-extrabold text-[10px] shrink-0">
                              ĐÁP ÁN ĐÚNG
                            </span>
                          )}
                        </div>
                        {qOptions[idx]?.trim() && (
                          <div className="ml-7 mt-1.5 text-xs text-w-text-main flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-w-text-muted uppercase">Xem trước:</span>
                            <span className="font-semibold"><MathChemRenderer text={qOptions[idx]} /></span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {qType === 'tf' && (
                <div>
                  <label className="block text-xs font-bold text-w-text-main mb-1.5">
                    4. Đáp án đúng: <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setQTfCorrect(true)}
                      className={`p-3 rounded-xl border font-black text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                        qTfCorrect
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                          : 'bg-w-bg-alt hover:bg-w-accent-light text-w-text-main border-w-border'
                      }`}
                    >
                      <Check className="w-5 h-5" />
                      <span>ĐÚNG (True)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQTfCorrect(false)}
                      className={`p-3 rounded-xl border font-black text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                        !qTfCorrect
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-300'
                          : 'bg-w-bg-alt hover:bg-w-accent-light text-w-text-main border-w-border'
                      }`}
                    >
                      <X className="w-5 h-5" />
                      <span>SAI (False)</span>
                    </button>
                  </div>
                </div>
              )}

              {qType === 'text' && (
                <div>
                  <label className="block text-xs font-bold text-w-text-main mb-1">
                    4. Đáp án chính xác (điền từ): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={qTextCorrect}
                    onFocus={() => setFocusedField('text')}
                    onChange={e => setQTextCorrect(e.target.value)}
                    placeholder="Nhập từ hoặc đáp số đúng..."
                    className="w-full bg-w-input-bg border border-w-input-border text-w-text-main rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-w-primary"
                    required
                  />
                  {qTextCorrect.trim() && (
                    <div className="mt-1.5 p-2 bg-w-bg-alt border border-w-border rounded-xl text-xs text-w-text-main">
                      Xem trước: <span className="font-bold"><MathChemRenderer text={qTextCorrect} /></span>
                    </div>
                  )}
                </div>
              )}

              {/* Image Attachment (Upload or URL) */}
              <div>
                <label className="block text-xs font-bold text-w-text-main mb-1">
                  5. Hình ảnh minh họa (tùy chọn):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qImageUrl}
                    onChange={e => setQImageUrl(e.target.value)}
                    placeholder="Dán link ảnh tại đây hoặc bấm 'Tải ảnh lên'..."
                    className="flex-1 bg-w-input-bg border border-w-input-border text-w-text-main rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-w-primary"
                  />
                  <label className="px-3 py-2 bg-w-bg-alt hover:bg-w-accent-light text-w-text-main border border-w-border rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải ảnh</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  {qImageUrl && (
                    <button
                      type="button"
                      onClick={() => setQImageUrl('')}
                      className="px-2.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>
                {qImageUrl && (
                  <div className="mt-2 p-2 bg-w-bg-alt border border-w-border rounded-xl flex items-center justify-center max-h-36 overflow-hidden">
                    <img src={qImageUrl} alt="Preview" className="max-h-32 w-auto object-contain rounded-lg" />
                  </div>
                )}
              </div>

              {/* Explanation Input */}
              <div>
                <label className="block text-xs font-bold text-w-text-main mb-1">
                  6. Lời giải thích / Gợi ý (tùy chọn):
                </label>
                <textarea
                  rows={2}
                  value={qExplanation}
                  onFocus={() => setFocusedField('explanation')}
                  onChange={e => setQExplanation(e.target.value)}
                  placeholder="Giải thích vì sao đáp án trên là chính xác..."
                  className="w-full bg-w-input-bg border border-w-input-border text-w-text-main rounded-xl p-2.5 text-xs focus:outline-none focus:border-w-primary"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-w-border flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuestionModal(false);
                    setEditingQuestion(null);
                  }}
                  className="px-4 py-2 bg-w-bg-alt hover:bg-w-accent-light text-w-text-main font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <div className="flex items-center gap-2">
                  {editingQuestion && (
                    <button
                      type="button"
                      onClick={() => handleSaveQuestionForm(undefined, true)}
                      className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                      title="Tạo thêm 1 bản ghi mới thay vì đè lên câu cũ"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Nhân bản thành câu mới</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    className="px-5 py-2.5 wey-btn-primary font-extrabold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingQuestion ? 'Cập Nhật Câu Hỏi' : 'Lưu Câu Hỏi'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* CREATE NEW BANK MODAL                                          */}
      {/* ============================================================= */}
      {showCreateBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-w-bg-card rounded-2xl border border-w-border p-5 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-w-text-main">Tạo Bộ Câu Hỏi Mới</h3>
              <button onClick={() => setShowCreateBankModal(false)} className="text-w-text-muted hover:text-w-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBank} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-w-text-main mb-1">Tên bộ câu hỏi:</label>
                <input
                  type="text"
                  value={newBankName}
                  onChange={e => setNewBankName(e.target.value)}
                  placeholder="Ví dụ: Ôn tập Hóa học HK1 Lớp 8..."
                  className="w-full bg-w-input-bg border border-w-input-border rounded-xl p-2.5 text-w-text-main text-sm focus:outline-none focus:border-w-primary"
                  required
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-w-text-main mb-1">Môn học:</label>
                  <input
                    type="text"
                    value={newBankSubject}
                    onChange={e => setNewBankSubject(e.target.value)}
                    className="w-full bg-w-input-bg border border-w-input-border rounded-xl p-2 text-w-text-main focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-w-text-main mb-1">Khối lớp:</label>
                  <input
                    type="text"
                    value={newBankGrade}
                    onChange={e => setNewBankGrade(e.target.value)}
                    className="w-full bg-w-input-bg border border-w-input-border rounded-xl p-2 text-w-text-main focus:outline-none"
                  />
                </div>
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateBankModal(false)}
                  className="px-3.5 py-1.5 bg-w-bg-alt text-w-text-main font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 wey-btn-primary font-bold rounded-xl shadow-xs"
                >
                  Tạo Bộ Đề
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* BULK MOVE QUESTIONS MODAL                                      */}
      {/* ============================================================= */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-w-bg-card rounded-2xl border border-w-border p-5 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-w-text-main">Di Chuyển {selectedIds.length} Câu Hỏi</h3>
              <button onClick={() => setShowMoveModal(false)} className="text-w-text-muted hover:text-w-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-w-text-muted">
              Chọn bộ đề bạn muốn chuyển các câu hỏi đã chọn sang:
            </p>
            <select
              value={targetBankId}
              onChange={e => setTargetBankId(e.target.value)}
              className="w-full bg-w-input-bg border border-w-input-border text-w-text-main rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
            >
              <option value="">-- Chọn bộ đề đích --</option>
              {bankList
                .filter(b => b.id !== currentBank?.id)
                .map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.questions?.length || 0} câu)
                  </option>
                ))}
            </select>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMoveModal(false)}
                className="px-3.5 py-1.5 bg-w-bg-alt text-w-text-main font-bold rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!targetBankId}
                onClick={handleBulkMove}
                className="px-4 py-2 wey-btn-primary font-bold rounded-xl text-xs shadow-xs disabled:opacity-50"
              >
                Xác Nhận Chuyển
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {showImportModal && currentBank && (
        <ImportQuestionsModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          gemConverterUrl={gemConverterUrl}
          onImportSuccess={(importedQuestions) => {
            if (handleUpdate) {
              handleUpdate({
                ...currentBank,
                questions: [...currentBank.questions, ...importedQuestions],
                updatedAt: new Date().toISOString(),
              });
            }
            setShowImportModal(false);
            safeAlert(`✅ Đã nạp thêm ${importedQuestions.length} câu hỏi thành công!`);
          }}
        />
      )}
    </div>
  );
};
