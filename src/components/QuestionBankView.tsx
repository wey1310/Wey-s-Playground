import { safeAlert, safeConfirm } from "../utils/safeAlert";
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Plus, FileText, Lock, Globe, Star, MoreVertical, Trash2, Copy, 
  ArrowLeft, Folder, FolderPlus, Grid, List, Layers, 
  BookOpen, CheckCircle2, ChevronDown, ChevronRight,
  Tag, GripVertical, CheckSquare, Square, FolderCheck, X, Edit3,
  FolderOpen, Sparkles, ExternalLink, Eye, Printer, ArrowUpDown, Filter
} from 'lucide-react';
import type { QuestionBank, Question } from "../types";
import { useAuth } from '../contexts/AuthContext';
import { CreateBankModal } from './CreateBankModal';
import { BankQuickPreviewModal } from './BankQuickPreviewModal';
import { MergeBanksModal } from './MergeBanksModal';
import { PrintExamModal } from './PrintExamModal';
import { GRADES, ALL_SUBJECTS } from '../data/curriculumData';
import { MathChemRenderer } from '../utils/mathChemFormatter';
import { soundFx } from '../utils/audio';

interface QuestionBankViewProps {
  onBack: () => void;
  questionBanks: QuestionBank[];
  onUpdateBanks: (banks: QuestionBank[]) => void;
  onOpenQuickManager: (bankId: string) => void;
  activeBankId?: string;
  onSelectActiveBank?: (bankId: string) => void;
}

type TabType = 'all' | 'presets' | 'mine' | 'public' | 'private' | 'favorite' | 'trash';
type ViewMode = 'folders' | 'grid' | 'table' | 'questions';
type GroupByMode = 'grade' | 'subject' | 'folder';
type SortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'questions_desc' | 'questions_asc';

const CUSTOM_FOLDERS_STORAGE_KEY = 'wey_custom_folders_list';

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  onBack,
  questionBanks,
  onUpdateBanks,
  onOpenQuickManager,
}) => {
  const { user, isAdmin } = useAuth();
  
  // Helpers for Author and Edit Permissions
  const getBankCreator = (bank: QuestionBank): string => {
    if (bank.creatorName) return bank.creatorName;
    if (bank.authorName) return bank.authorName;
    if (bank.isPreset) return 'Admin';
    return 'Giáo viên';
  };

  const canEditBank = (bank: QuestionBank): boolean => {
    if (isAdmin) return true;
    if (bank.isPreset) return false;
    if (!bank.ownerId && !bank.userId) return true; // legacy unassigned
    return Boolean(user && (bank.ownerId === user.uid || bank.userId === user.uid));
  };

  const handleDuplicateAndEdit = (bank: QuestionBank) => {
    const creator = isAdmin ? 'Admin' : (user?.displayName || user?.email?.split('@')[0] || 'Giáo viên');
    const newBank: QuestionBank = {
      ...bank,
      id: `bank_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: `${bank.name} (Bản sao)`,
      isPreset: false,
      ownerId: user?.uid || (isAdmin ? 'admin_system' : 'guest'),
      userId: user?.uid || (isAdmin ? 'admin_system' : 'guest'),
      userEmail: user?.email,
      creatorName: creator,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onUpdateBanks([newBank, ...questionBanks]);
    showToast(`Đã tạo bản sao riêng "${newBank.name}"!`);
    onOpenQuickManager(newBank.id);
  };

  const handleOpenBankManager = (bank: QuestionBank) => {
    if (canEditBank(bank)) {
      onOpenQuickManager(bank.id);
    } else {
      const creator = getBankCreator(bank);
      if (safeConfirm(`Bộ câu hỏi này do tác giả "${creator}" tạo công khai. Bạn không thể sửa trực tiếp bản gốc.\n\nBạn có muốn hệ thống tạo ngay một BẢN SAO RIÊNG để bạn tự do chỉnh sửa không?`)) {
        handleDuplicateAndEdit(bank);
      }
    }
  };
  
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('folders');
  const [groupByMode, setGroupByMode] = useState<GroupByMode>('folder');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [hasQuestionsFilter, setHasQuestionsFilter] = useState<'all' | 'has_questions' | 'empty' | 'ten_plus'>('all');
  
  // Custom Folders State (Persisted in localStorage & combined with existing banks)
  const [customFolders, setCustomFolders] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_FOLDERS_STORAGE_KEY);
      const parsed: string[] = stored ? JSON.parse(stored) : [];
      const bankFolders = questionBanks
        .map(b => b.folder?.trim())
        .filter((f): f is string => Boolean(f));
      return Array.from(new Set([...parsed, ...bankFolders])).sort();
    } catch {
      return ['Đề kiểm tra 15 phút', 'Đề thi Giữa kỳ', 'Đề thi Học kỳ', 'Chuyên đề Nâng cao'];
    }
  });

  // Save custom folders when updated
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_FOLDERS_STORAGE_KEY, JSON.stringify(customFolders));
    } catch (e) {
      console.warn('Could not persist custom folders', e);
    }
  }, [customFolders]);

  // Modals & Popups
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [previewBank, setPreviewBank] = useState<QuestionBank | null>(null);
  const [printBank, setPrintBank] = useState<QuestionBank | null>(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [inlineCreatingFolder, setInlineCreatingFolder] = useState(false);
  const [inlineFolderName, setInlineFolderName] = useState('');
  const [editingFolderOriginal, setEditingFolderOriginal] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  // Move to Folder Modal
  const [bankToMove, setBankToMove] = useState<QuestionBank | null>(null);
  const [selectedTargetFolder, setSelectedTargetFolder] = useState<string>('');

  // Drag-and-Drop States
  const [draggedBankId, setDraggedBankId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  // Batch Selection State
  const [selectedBankIds, setSelectedBankIds] = useState<Set<string>>(new Set());
  const [batchTargetFolder, setBatchTargetFolder] = useState<string>('');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Collapsed sections in Folder view
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Extract all available folders (combining customFolders list and banks' folders)
  const availableFolders = useMemo(() => {
    const folders = new Set<string>(customFolders);
    questionBanks.forEach(b => {
      if (b.folder && b.folder.trim() && !b.isDeleted) {
        folders.add(b.folder.trim());
      }
    });
    return Array.from(folders).sort();
  }, [customFolders, questionBanks]);

  // Overall Statistics for the repository
  const repoStats = useMemo(() => {
    const activeBanks = questionBanks.filter(b => !b.isDeleted);
    const totalQuestions = activeBanks.reduce((sum, b) => sum + (b.questions?.length || 0), 0);
    const subjectsCount = new Set(activeBanks.map(b => b.subject).filter(Boolean)).size;
    const gradesCount = new Set(activeBanks.map(b => b.grade).filter(Boolean)).size;
    return {
      totalBanks: activeBanks.length,
      totalQuestions,
      subjectsCount,
      gradesCount,
      presetsCount: activeBanks.filter(b => b.isPreset).length,
      userBanksCount: activeBanks.filter(b => !b.isPreset).length,
      favoritesCount: activeBanks.filter(b => b.favorite).length,
      trashCount: questionBanks.filter(b => b.isDeleted).length,
    };
  }, [questionBanks]);

  // Folder bank counts map
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    availableFolders.forEach(f => { counts[f] = 0; });
    questionBanks.forEach(b => {
      if (!b.isDeleted && b.folder && b.folder.trim()) {
        const f = b.folder.trim();
        counts[f] = (counts[f] || 0) + 1;
      }
    });
    return counts;
  }, [availableFolders, questionBanks]);

  const unorganizedCount = useMemo(() => {
    return questionBanks.filter(b => !b.isDeleted && (!b.folder || !b.folder.trim())).length;
  }, [questionBanks]);

  // Filtered & Sorted Banks
  const filteredBanks = useMemo(() => {
    const filtered = questionBanks.filter(bank => {
      // Trash handling
      if (activeTab === 'trash') return bank.isDeleted;
      if (bank.isDeleted) return false;

      // Tab filters
      if (activeTab === 'presets' && !bank.isPreset) return false;
      if (activeTab === 'mine' && user && bank.ownerId !== user.uid) return false;
      if (activeTab === 'public' && bank.visibility !== 'public' && !bank.isPreset) return false;
      if (activeTab === 'private' && bank.visibility !== 'private') return false;
      if (activeTab === 'favorite' && !bank.favorite) return false;

      // Sidebar folder selection
      if (selectedFolder !== null) {
        if (selectedFolder === '__unorganized__') {
          if (bank.folder && bank.folder.trim()) return false;
        } else {
          if (bank.folder !== selectedFolder) return false;
        }
      }

      // Dropdown filters
      if (subjectFilter && bank.subject !== subjectFilter) return false;
      if (gradeFilter && bank.grade !== gradeFilter) return false;

      // Question count filter
      if (hasQuestionsFilter === 'has_questions' && (!bank.questions || bank.questions.length === 0)) return false;
      if (hasQuestionsFilter === 'empty' && bank.questions && bank.questions.length > 0) return false;
      if (hasQuestionsFilter === 'ten_plus' && (!bank.questions || bank.questions.length < 10)) return false;

      // Search query
      if (viewMode !== 'questions' && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = bank.name.toLowerCase().includes(query);
        const matchesTopic = (bank.topic || '').toLowerCase().includes(query);
        const matchesSubject = (bank.subject || '').toLowerCase().includes(query);
        const matchesGrade = (bank.grade || '').toLowerCase().includes(query);
        const matchesFolder = (bank.folder || '').toLowerCase().includes(query);
        const matchesTags = (bank.tags || []).some(t => t.toLowerCase().includes(query));
        const matchesQuestions = (bank.questions || []).some(q => q.content.toLowerCase().includes(query));
        if (!matchesName && !matchesTopic && !matchesSubject && !matchesGrade && !matchesFolder && !matchesTags && !matchesQuestions) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      }
      if (sortBy === 'oldest') {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeA - timeB;
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name, 'vi');
      }
      if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name, 'vi');
      }
      if (sortBy === 'questions_desc') {
        return (b.questions?.length || 0) - (a.questions?.length || 0);
      }
      if (sortBy === 'questions_asc') {
        return (a.questions?.length || 0) - (b.questions?.length || 0);
      }
      return 0;
    });
  }, [questionBanks, activeTab, selectedFolder, subjectFilter, gradeFilter, hasQuestionsFilter, searchQuery, user, viewMode, sortBy]);

  // Filtered Questions (for 'questions' view mode)
  const filteredQuestionsList = useMemo(() => {
    if (viewMode !== 'questions') return [];
    
    const questionsList: { question: Question; bank: QuestionBank }[] = [];
    
    filteredBanks.forEach(bank => {
      if (bank.questions && bank.questions.length > 0) {
        bank.questions.forEach(q => {
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            const matchesContent = q.content.toLowerCase().includes(query);
            const matchesTopic = (bank.topic || '').toLowerCase().includes(query);
            const matchesFolder = (bank.folder || '').toLowerCase().includes(query);
            const matchesBank = bank.name.toLowerCase().includes(query);
            
            if (!matchesContent && !matchesBank && !matchesTopic && !matchesFolder) {
              return;
            }
          }
          questionsList.push({ question: q, bank });
        });
      }
    });
    
    return questionsList;
  }, [filteredBanks, viewMode, searchQuery]);

  // Grouped Banks for the "Kho & Thư Mục (Folders View)"
  const groupedBanks = useMemo(() => {
    const groups: Record<string, QuestionBank[]> = {};

    // When grouping by folder, include empty custom folders if viewing all
    if (groupByMode === 'folder' && !selectedFolder) {
      availableFolders.forEach(f => {
        groups[f] = [];
      });
      groups['Chưa phân loại'] = [];
    }

    filteredBanks.forEach(bank => {
      let key = 'Chưa phân loại';
      if (groupByMode === 'grade') {
        key = bank.grade || 'Khác';
      } else if (groupByMode === 'subject') {
        key = bank.subject || 'Tổng hợp';
      } else if (groupByMode === 'folder') {
        key = bank.folder ? bank.folder.trim() : 'Chưa phân loại';
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(bank);
    });

    // Sort group keys logically
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === 'Chưa phân loại') return 1;
      if (b === 'Chưa phân loại') return -1;
      if (groupByMode === 'grade') {
        const numA = parseInt(a.replace(/\D/g, '')) || 99;
        const numB = parseInt(b.replace(/\D/g, '')) || 99;
        return numA - numB;
      }
      return a.localeCompare(b, 'vi');
    });

    return sortedKeys.map(key => ({
      key,
      banks: groups[key],
      totalQuestions: groups[key].reduce((acc, b) => acc + (b.questions?.length || 0), 0)
    }));
  }, [filteredBanks, groupByMode, availableFolders, selectedFolder]);

  // Handle Drag and Drop Assignment of bank to folder
  const handleAssignBankToFolder = (bankId: string, folderName: string | null) => {
    const bank = questionBanks.find(b => b.id === bankId);
    if (!bank) return;

    const cleanFolder = folderName && folderName.trim() ? folderName.trim() : undefined;
    const updatedBanks = questionBanks.map(b => 
      b.id === bankId 
        ? { ...b, folder: cleanFolder, updatedAt: new Date().toISOString() } 
        : b
    );
    onUpdateBanks(updatedBanks);
    soundFx.cardFlip();

    const targetDesc = cleanFolder ? `thư mục "${cleanFolder}"` : 'Thư mục chung (Bỏ phân loại)';
    showToast(`Đã chuyển bộ đề "${bank.name}" vào ${targetDesc}`);
  };

  // Handle Drag Start
  const handleDragStart = (e: React.DragEvent, bankId: string) => {
    e.dataTransfer.setData('text/plain', bankId);
    setDraggedBankId(bankId);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setDraggedBankId(null);
    setIsDragging(false);
    setDragOverFolder(null);
  };

  // Handle Drop on a specific Folder
  const handleDropOnFolder = (e: React.DragEvent, targetFolder: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    const bankId = e.dataTransfer.getData('text/plain') || draggedBankId;
    if (bankId) {
      handleAssignBankToFolder(bankId, targetFolder);
    }
    setDragOverFolder(null);
    setIsDragging(false);
    setDraggedBankId(null);
  };

  // Handle Create New Folder
  const handleCreateNewFolder = (folderName: string) => {
    const trimmed = folderName.trim();
    if (!trimmed) {
      safeAlert('Vui lòng nhập tên thư mục!');
      return;
    }
    if (availableFolders.includes(trimmed)) {
      safeAlert('Thư mục này đã tồn tại!');
      return;
    }
    const updated = [...customFolders, trimmed].sort();
    setCustomFolders(updated);
    setSelectedFolder(trimmed);
    setGroupByMode('folder');
    soundFx.buttonClick();
    showToast(`Đã tạo thư mục mới: "${trimmed}"`);
    setInlineCreatingFolder(false);
    setInlineFolderName('');
  };

  // Handle Rename Folder
  const handleRenameFolder = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingFolderOriginal(null);
      return;
    }
    const updatedFolders = customFolders.map(f => f === oldName ? trimmed : f).sort();
    setCustomFolders(updatedFolders);
    const updatedBanks = questionBanks.map(b => b.folder === oldName ? { ...b, folder: trimmed, updatedAt: new Date().toISOString() } : b);
    onUpdateBanks(updatedBanks);
    if (selectedFolder === oldName) {
      setSelectedFolder(trimmed);
    }
    setEditingFolderOriginal(null);
    showToast(`Đã đổi tên thư mục thành "${trimmed}"`);
  };

  // Handle Delete Folder
  const handleDeleteFolder = (folderName: string) => {
    const count = folderCounts[folderName] || 0;
    const msg = count > 0 
      ? `Bạn có chắc muốn xóa thư mục "${folderName}"? ${count} bộ đề bên trong sẽ được chuyển về "Chưa phân loại".`
      : `Bạn có chắc muốn xóa thư mục "${folderName}"?`;
      
    if (safeConfirm(msg)) {
      setCustomFolders(customFolders.filter(f => f !== folderName));
      const updatedBanks = questionBanks.map(b => b.folder === folderName ? { ...b, folder: undefined, updatedAt: new Date().toISOString() } : b);
      onUpdateBanks(updatedBanks);
      if (selectedFolder === folderName) {
        setSelectedFolder(null);
      }
      showToast(`Đã xóa thư mục "${folderName}"`);
    }
  };

  // Batch Selection Handlers
  const toggleSelectBank = (bankId: string) => {
    setSelectedBankIds(prev => {
      const next = new Set(prev);
      if (next.has(bankId)) next.delete(bankId);
      else next.add(bankId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedBankIds.size === filteredBanks.length) {
      setSelectedBankIds(new Set());
    } else {
      setSelectedBankIds(new Set(filteredBanks.map(b => b.id)));
    }
  };

  const handleBatchMove = () => {
    if (selectedBankIds.size === 0) {
      safeAlert('Vui lòng chọn ít nhất một bộ đề để di chuyển!');
      return;
    }
    const cleanFolder = batchTargetFolder.trim() || undefined;
    const updatedBanks = questionBanks.map(b => {
      if (selectedBankIds.has(b.id)) {
        return { ...b, folder: cleanFolder, updatedAt: new Date().toISOString() };
      }
      return b;
    });
    onUpdateBanks(updatedBanks);
    soundFx.cardFlip();
    const targetDesc = cleanFolder ? `thư mục "${cleanFolder}"` : 'Thư mục chung';
    showToast(`Đã chuyển ${selectedBankIds.size} bộ đề vào ${targetDesc}`);
    setSelectedBankIds(new Set());
    setBatchTargetFolder('');
  };

  const handleBatchFavorite = () => {
    if (selectedBankIds.size === 0) return;
    const updatedBanks = questionBanks.map(b => {
      if (selectedBankIds.has(b.id)) {
        return { ...b, favorite: true, updatedAt: new Date().toISOString() };
      }
      return b;
    });
    onUpdateBanks(updatedBanks);
    showToast(`Đã thêm ${selectedBankIds.size} bộ đề vào Yêu thích`);
    setSelectedBankIds(new Set());
  };

  const handleBatchDelete = () => {
    if (selectedBankIds.size === 0) return;
    if (safeConfirm(`Bạn có chắc muốn chuyển ${selectedBankIds.size} bộ đề vào thùng rác?`)) {
      const updatedBanks = questionBanks.map(b => {
        if (selectedBankIds.has(b.id)) {
          return { ...b, isDeleted: true, updatedAt: new Date().toISOString() };
        }
        return b;
      });
      onUpdateBanks(updatedBanks);
      showToast(`Đã chuyển ${selectedBankIds.size} bộ đề vào thùng rác`);
      setSelectedBankIds(new Set());
    }
  };

  return (
    <div className="w-full flex flex-col space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-w-primary text-white font-[800] text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 border border-white/20">
          <FolderCheck className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            className="p-2.5 hover:bg-w-accent-light text-w-primary-dark rounded-2xl transition-colors border border-w-border bg-w-bg-card shadow-xs cursor-pointer"
            title="Quay lại bảng điều khiển chính"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-[900] text-w-text-main flex items-center gap-2">
                🏛️ Kho Lưu Trữ Bộ Đề & Câu Hỏi
              </h2>
              <span className="bg-w-accent-light text-w-primary-dark text-xs font-[800] px-2.5 py-1 rounded-full border border-w-accent-border">
                {repoStats.totalBanks} bộ đề
              </span>
            </div>
            <p className="text-w-text-muted text-xs sm:text-sm font-[600] mt-0.5">
              Hỗ trợ kéo thả vào thư mục, di chuyển hàng loạt và phân loại thông minh.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setInlineCreatingFolder(true);
              setInlineFolderName('');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-w-bg-card hover:bg-w-accent-light text-w-primary-dark font-[800] text-xs sm:text-sm border border-w-accent-border shadow-xs transition-all cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            + Tạo Thư Mục Mới
          </button>

          <button
            onClick={() => {
              setEditingBank(null);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl wey-btn-primary text-xs sm:text-sm shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tạo Bộ Đề Mới
          </button>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout with Left Sidebar */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        
        {/* ===================================================================== */}
        {/* LEFT SIDEBAR: THƯ MỤC & PHÂN LOẠI (DRAG & DROP DROP ZONES)            */}
        {/* ===================================================================== */}
        <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4">
          
          {/* Main Sidebar Box */}
          <div className="bg-w-bg-card border-2 border-w-border rounded-[24px] p-4 shadow-xs flex flex-col space-y-4">
            
            {/* Sidebar Title & 'New Folder' button */}
            <div className="flex items-center justify-between pb-3 border-b border-w-border">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-w-primary" />
                <h3 className="font-[900] text-sm text-w-text-main">
                  Thư Mục & Phân Loại
                </h3>
              </div>
              <button
                onClick={() => setInlineCreatingFolder(prev => !prev)}
                className="text-[11px] font-[800] text-w-primary-dark hover:text-w-primary px-2 py-1 rounded-lg bg-w-accent-light hover:bg-w-accent-muted transition-colors flex items-center gap-1 cursor-pointer"
                title="Tạo thêm thư mục nhóm mới"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thư mục</span>
              </button>
            </div>

            {/* Inline New Folder Input */}
            {inlineCreatingFolder && (
              <div className="p-3 bg-w-bg-alt border border-w-border rounded-2xl space-y-2 animate-in fade-in">
                <div className="text-[11px] font-[800] text-w-text-main flex items-center justify-between">
                  <span>Đặt tên thư mục mới:</span>
                  <button 
                    onClick={() => setInlineCreatingFolder(false)}
                    className="text-w-text-muted hover:text-w-text-main p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="VD: Ôn thi Giữa kỳ 1..."
                  value={inlineFolderName}
                  onChange={(e) => setInlineFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateNewFolder(inlineFolderName);
                    if (e.key === 'Escape') setInlineCreatingFolder(false);
                  }}
                  autoFocus
                  className="w-full px-3 py-1.5 bg-w-input-bg border border-w-input-border rounded-xl text-xs font-[700] text-w-text-main focus:outline-none focus:border-w-primary"
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => setInlineCreatingFolder(false)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-[700] text-w-text-muted hover:bg-w-bg-card"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => handleCreateNewFolder(inlineFolderName)}
                    className="px-3 py-1 rounded-lg text-[11px] font-[800] wey-btn-primary"
                  >
                    Tạo Ngay
                  </button>
                </div>
              </div>
            )}

            {/* System Presets & Navigation Tabs */}
            <div className="space-y-1">
              <div className="text-[10px] font-[800] text-w-text-muted uppercase tracking-wider px-2 mb-1">
                Bộ sưu tập hệ thống
              </div>

              {[
                { id: 'all', label: 'Tất cả ngân hàng', icon: '📚', count: repoStats.totalBanks },
                { id: 'presets', label: 'Mẫu KHTN Chuẩn SGK', icon: '🔬', count: repoStats.presetsCount },
                { id: 'mine', label: 'Bộ của tôi', icon: '👤', count: repoStats.userBanksCount },
                { id: 'favorite', label: 'Yêu thích', icon: '⭐', count: repoStats.favoritesCount },
                { id: 'trash', label: 'Thùng rác', icon: '🗑️', count: repoStats.trashCount },
              ].map(tab => {
                const isActive = activeTab === tab.id && selectedFolder === null;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as TabType);
                      setSelectedFolder(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-[800] transition-all cursor-pointer ${
                      isActive
                        ? 'bg-w-primary text-white shadow-xs'
                        : 'text-w-text-main hover:bg-w-accent-light'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-[700] ${
                      isActive ? 'bg-white/20 text-white' : 'bg-w-bg-alt text-w-text-muted'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Folders Section (DRAG AND DROP TARGETS) */}
            <div className="space-y-1.5 pt-2 border-t border-w-border">
              <div className="flex items-center justify-between px-2 mb-1">
                <span className="text-[10px] font-[800] text-w-text-muted uppercase tracking-wider">
                  Thư mục tùy chỉnh ({availableFolders.length})
                </span>
                {isDragging && (
                  <span className="text-[10px] font-[800] text-w-primary animate-pulse flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Thả vào đây
                  </span>
                )}
              </div>

              {/* List of Custom Folders */}
              <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
                {availableFolders.map(folder => {
                  const isSelected = selectedFolder === folder;
                  const isDragTarget = dragOverFolder === folder;
                  const count = folderCounts[folder] || 0;
                  const isEditingThis = editingFolderOriginal === folder;

                  return (
                    <div
                      key={folder}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverFolder(folder);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (dragOverFolder === folder) setDragOverFolder(null);
                      }}
                      onDrop={(e) => handleDropOnFolder(e, folder)}
                      className={`group relative rounded-xl border-2 transition-all select-none ${
                        isDragTarget
                          ? 'border-dashed border-w-primary bg-w-accent-light text-w-primary-dark shadow-md scale-[1.02] p-2'
                          : isSelected
                          ? 'bg-w-primary-dark text-white border-transparent shadow-xs p-2'
                          : 'bg-w-bg-card hover:bg-w-accent-light border-transparent text-w-text-main p-2'
                      }`}
                    >
                      {isEditingThis ? (
                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingFolderName}
                            onChange={e => setEditingFolderName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRenameFolder(folder, editingFolderName);
                              if (e.key === 'Escape') setEditingFolderOriginal(null);
                            }}
                            autoFocus
                            className="flex-1 px-2 py-1 bg-w-input-bg border border-w-primary rounded-lg text-xs font-[700] text-w-text-main"
                          />
                          <button
                            onClick={() => handleRenameFolder(folder, editingFolderName)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingFolderOriginal(null)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => {
                            setSelectedFolder(isSelected ? null : folder);
                            setActiveTab('all');
                          }}
                        >
                          <div className="flex items-center gap-2 truncate pr-1">
                            <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-amber-500'}`} />
                            <span className="text-xs font-[800] truncate">
                              {folder}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-[700] ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-w-bg-alt text-w-text-muted'
                            }`}>
                              {count}
                            </span>

                            {/* Folder actions dropdown / buttons on hover */}
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingFolderOriginal(folder);
                                  setEditingFolderName(folder);
                                }}
                                className="p-1 text-w-text-muted hover:text-w-primary rounded"
                                title="Đổi tên thư mục"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFolder(folder);
                                }}
                                className="p-1 text-w-text-muted hover:text-rose-500 rounded"
                                title="Xóa thư mục"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {availableFolders.length === 0 && (
                  <div className="p-3 text-center text-w-text-muted text-xs font-[600] border border-dashed border-w-border rounded-xl">
                    Chưa có thư mục nào. Nhấn "+ Thư mục" để tạo!
                  </div>
                )}
              </div>

              {/* Unorganized / Thư mục chung Drop Target */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOverFolder('__unorganized__');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (dragOverFolder === '__unorganized__') setDragOverFolder(null);
                }}
                onDrop={(e) => handleDropOnFolder(e, null)}
                onClick={() => {
                  setSelectedFolder(selectedFolder === '__unorganized__' ? null : '__unorganized__');
                  setActiveTab('all');
                }}
                className={`p-2 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between text-xs font-[800] ${
                  dragOverFolder === '__unorganized__'
                    ? 'border-dashed border-w-primary bg-w-accent-light text-w-primary-dark shadow-md scale-[1.02]'
                    : selectedFolder === '__unorganized__'
                    ? 'bg-w-primary-dark text-white border-transparent'
                    : 'bg-w-bg-alt/70 hover:bg-w-accent-light border-transparent text-w-text-muted'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-w-text-muted" />
                  <span>Chưa phân loại (Chung)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-w-bg-card text-w-text-muted font-[700]">
                  {unorganizedCount}
                </span>
              </div>
            </div>

            {/* Quick Drag & Drop Hint */}
            <div className="p-2.5 rounded-xl bg-w-accent-light/60 border border-w-accent-border/50 text-[11px] font-[600] text-w-primary-dark flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-w-primary shrink-0 mt-0.5" />
              <span>
                <strong>Mẹo nhanh:</strong> Nhấp giữ thẻ bộ đề bên phải và kéo thả thẳng vào thư mục bên trái để phân loại ngay lập tức!
              </span>
            </div>
          </div>

          {/* =================================================================== */}
          {/* BATCH ACTION CONTROLLER (WHEN 1 OR MORE BANKS ARE CHECKED)           */}
          {/* =================================================================== */}
          {selectedBankIds.size > 0 && (
            <div className="bg-w-bg-card border-2 border-w-primary rounded-[24px] p-4 shadow-lg flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between pb-2 border-b border-w-border">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-w-primary" />
                  <span className="font-[900] text-xs text-w-text-main">
                    Đã chọn {selectedBankIds.size} bộ đề
                  </span>
                </div>
                <button
                  onClick={() => setSelectedBankIds(new Set())}
                  className="text-[10px] font-[700] text-w-text-muted hover:text-w-text-main"
                >
                  Bỏ chọn
                </button>
              </div>

              {/* Merge Action Button (if 2 or more selected) */}
              {selectedBankIds.size >= 2 && (
                <button
                  onClick={() => setIsMergeModalOpen(true)}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-[800] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <Layers className="w-4 h-4" />
                  <span>Gộp {selectedBankIds.size} Bộ Đề Thành 1</span>
                </button>
              )}

              {/* Target Folder Selector for Batch Move */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-[800] text-w-text-muted">
                  Chuyển {selectedBankIds.size} bộ vào thư mục:
                </label>
                <select
                  value={batchTargetFolder}
                  onChange={(e) => setBatchTargetFolder(e.target.value)}
                  className="w-full px-3 py-2 bg-w-input-bg border border-w-input-border rounded-xl text-xs font-[700] text-w-text-main focus:outline-none focus:border-w-primary"
                >
                  <option value="">📂 Bỏ phân loại (Thư mục chung)</option>
                  {availableFolders.map(f => (
                    <option key={f} value={f}>📁 {f}</option>
                  ))}
                </select>
                <button
                  onClick={handleBatchMove}
                  className="w-full py-2 wey-btn-primary text-xs font-[800] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FolderCheck className="w-4 h-4" />
                  <span>Xác Nhận Chuyển Thư Mục</span>
                </button>
              </div>

              {/* Batch secondary actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleBatchFavorite}
                  className="py-1.5 px-2 bg-w-bg-alt hover:bg-w-accent-light text-w-text-main font-[700] text-[11px] rounded-xl border border-w-border transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Star className="w-3 h-3 text-amber-500" />
                  <span>Yêu thích</span>
                </button>
                <button
                  onClick={handleBatchDelete}
                  className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-[700] text-[11px] rounded-xl border border-rose-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* ===================================================================== */}
        {/* RIGHT MAIN CONTENT AREA                                               */}
        {/* ===================================================================== */}
        <div className="flex-1 w-full space-y-4">
          
          {/* Summary Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-w-bg-card border-2 border-w-border p-3.5 rounded-[22px] shadow-xs">
            <div className="flex items-center gap-3 px-3 py-1.5 border-r border-w-border/60 last:border-0">
              <div className="w-9 h-9 rounded-xl bg-w-accent-light text-w-primary-dark flex items-center justify-center font-[800] border border-w-accent-border">
                📚
              </div>
              <div>
                <div className="text-[11px] font-[700] text-w-text-muted">Tổng số bộ đề</div>
                <div className="text-base font-[900] text-w-text-main">{repoStats.totalBanks} bộ</div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-3 py-1.5 border-r border-w-border/60 last:border-0">
              <div className="w-9 h-9 rounded-xl bg-w-accent-light text-w-primary-dark flex items-center justify-center font-[800] border border-w-accent-border">
                📝
              </div>
              <div>
                <div className="text-[11px] font-[700] text-w-text-muted">Tổng số câu hỏi</div>
                <div className="text-base font-[900] text-w-text-main">{repoStats.totalQuestions} câu</div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-3 py-1.5 border-r border-w-border/60 last:border-0">
              <div className="w-9 h-9 rounded-xl bg-w-accent-light text-w-primary-dark flex items-center justify-center font-[800] border border-w-accent-border">
                🎓
              </div>
              <div>
                <div className="text-[11px] font-[700] text-w-text-muted">Khối lớp & Môn</div>
                <div className="text-base font-[900] text-w-text-main">{repoStats.gradesCount} khối • {repoStats.subjectsCount} môn</div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-3 py-1.5">
              <div className="w-9 h-9 rounded-xl bg-w-accent-light text-w-primary-dark flex items-center justify-center font-[800] border border-w-accent-border">
                📁
              </div>
              <div>
                <div className="text-[11px] font-[700] text-w-text-muted">Thư mục chuyên đề</div>
                <div className="text-base font-[900] text-w-text-main">{availableFolders.length} thư mục</div>
              </div>
            </div>
          </div>

          {/* Active Folder Filter Tag (if any) */}
          {selectedFolder !== null && (
            <div className="p-3 bg-w-accent-light border border-w-accent-border rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-[800] text-w-primary-dark">
                <Folder className="w-4 h-4" />
                <span>
                  Đang lọc theo thư mục:{' '}
                  <strong>{selectedFolder === '__unorganized__' ? 'Chưa phân loại' : selectedFolder}</strong>
                </span>
                <span className="text-[11px] font-[700] px-2 py-0.5 rounded-full bg-w-bg-card border border-w-border text-w-text-main">
                  {filteredBanks.length} bộ đề
                </span>
              </div>
              <button
                onClick={() => setSelectedFolder(null)}
                className="text-xs font-[800] text-w-text-muted hover:text-w-text-main px-2 py-1 rounded-lg hover:bg-w-bg-card transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Xem tất cả</span>
              </button>
            </div>
          )}

          {/* Search, Filter Dropdowns & View Mode Bar */}
          <div className="bg-w-bg-card border-2 border-w-border p-3.5 rounded-[22px] shadow-sm flex flex-col gap-3">
            {/* Row 1: Search & Filter Dropdowns */}
            <div className="flex flex-col md:flex-row gap-3 items-center">
              {/* Search Input */}
              <div className="flex-1 relative w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-w-text-muted" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên bộ đề, bài học SGK, môn, khối lớp, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 bg-w-input-bg border border-w-border rounded-[16px] text-xs sm:text-sm font-[600] text-w-text-main focus:outline-none focus:border-w-primary transition-all shadow-xs"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-[700] text-w-text-muted hover:text-w-text-main"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick Selectors */}
              <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full md:w-auto items-center">
                {/* Grade Filter */}
                <select
                  value={gradeFilter}
                  onChange={e => setGradeFilter(e.target.value)}
                  className="flex-1 sm:flex-none px-3 py-2 bg-w-input-bg border border-w-border rounded-[14px] text-xs font-[700] text-w-primary-dark cursor-pointer shadow-xs focus:outline-none focus:border-w-primary"
                >
                  <option value="">🎓 Khối Lớp</option>
                  {GRADES.map(gr => (
                    <option key={gr} value={gr}>{gr}</option>
                  ))}
                </select>

                {/* Subject Filter */}
                <select 
                  value={subjectFilter}
                  onChange={e => setSubjectFilter(e.target.value)}
                  className="flex-1 sm:flex-none px-3 py-2 bg-w-input-bg border border-w-border rounded-[14px] text-xs font-[700] text-w-primary-dark cursor-pointer shadow-xs focus:outline-none focus:border-w-primary"
                >
                  <option value="">📚 Môn Học</option>
                  {ALL_SUBJECTS.map(subj => (
                    <option key={subj} value={subj}>{subj}</option>
                  ))}
                </select>

                {/* Question Count Filter */}
                <select
                  value={hasQuestionsFilter}
                  onChange={e => setHasQuestionsFilter(e.target.value as any)}
                  className="flex-1 sm:flex-none px-3 py-2 bg-w-input-bg border border-w-border rounded-[14px] text-xs font-[700] text-w-primary-dark cursor-pointer shadow-xs focus:outline-none focus:border-w-primary"
                >
                  <option value="all">📝 Mọi số lượng</option>
                  <option value="has_questions">✅ Có câu hỏi (&gt;0)</option>
                  <option value="ten_plus">🔥 Nhiều câu (≥10)</option>
                  <option value="empty">⚠️ Chưa có câu hỏi (0)</option>
                </select>

                {/* Sort Option */}
                <div className="flex items-center gap-1 bg-w-input-bg border border-w-border rounded-[14px] px-2 py-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-w-text-muted shrink-0" />
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as SortOption)}
                    className="bg-transparent text-xs font-[700] text-w-text-main cursor-pointer focus:outline-none"
                  >
                    <option value="newest">🕒 Mới nhất</option>
                    <option value="oldest">🕰️ Cũ nhất</option>
                    <option value="name_asc">🔤 Tên A → Z</option>
                    <option value="name_desc">🔤 Tên Z → A</option>
                    <option value="questions_desc">📊 Số câu nhiều nhất</option>
                    <option value="questions_asc">📉 Số câu ít nhất</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Row 2: Select All, View Modes & Grouping Switcher */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-w-border/60">
              
              {/* Batch Select Checkbox Toggle & Merge trigger */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 rounded-xl bg-w-bg-alt hover:bg-w-accent-light text-w-text-main font-[800] text-xs border border-w-border transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {selectedBankIds.size === filteredBanks.length && filteredBanks.length > 0 ? (
                    <>
                      <CheckSquare className="w-4 h-4 text-w-primary" />
                      <span>Bỏ chọn tất cả</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4 text-w-text-muted" />
                      <span>Chọn tất cả ({filteredBanks.length})</span>
                    </>
                  )}
                </button>

                {selectedBankIds.size >= 2 && (
                  <button
                    onClick={() => setIsMergeModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-[800] text-xs border border-purple-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Gộp {selectedBankIds.size} bộ</span>
                  </button>
                )}
              </div>

              {/* View Mode & Group Switchers */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
                {viewMode === 'folders' && (
                  <div className="flex items-center gap-1 bg-w-bg-alt p-1 rounded-xl border border-w-border">
                    <span className="text-[10px] font-[800] text-w-text-muted px-1.5">Gom theo:</span>
                    <button
                      onClick={() => setGroupByMode('folder')}
                      className={`text-[11px] font-[800] px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        groupByMode === 'folder' ? 'bg-w-primary text-white shadow-xs' : 'text-w-text-main hover:bg-w-accent-light'
                      }`}
                    >
                      📁 Thư Mục
                    </button>
                    <button
                      onClick={() => setGroupByMode('grade')}
                      className={`text-[11px] font-[800] px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        groupByMode === 'grade' ? 'bg-w-primary text-white shadow-xs' : 'text-w-text-main hover:bg-w-accent-light'
                      }`}
                    >
                      🎓 Khối Lớp
                    </button>
                    <button
                      onClick={() => setGroupByMode('subject')}
                      className={`text-[11px] font-[800] px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        groupByMode === 'subject' ? 'bg-w-primary text-white shadow-xs' : 'text-w-text-main hover:bg-w-accent-light'
                      }`}
                    >
                      📚 Môn Học
                    </button>
                  </div>
                )}

                {/* View Mode Icons */}
                <div className="flex items-center bg-w-bg-alt p-1 rounded-xl border border-w-border">
                  <button
                    onClick={() => setViewMode('folders')}
                    title="Chế độ Kho & Thư mục phân cấp"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-[800] ${
                      viewMode === 'folders' ? 'bg-w-primary text-white shadow-xs' : 'text-w-text-muted hover:bg-w-accent-light'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Kho phân cấp</span>
                  </button>

                  <button
                    onClick={() => setViewMode('grid')}
                    title="Chế độ Lưới thẻ trực quan"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-[800] ${
                      viewMode === 'grid' ? 'bg-w-primary text-white shadow-xs' : 'text-w-text-muted hover:bg-w-accent-light'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Thẻ lưới</span>
                  </button>

                  <button
                    onClick={() => setViewMode('table')}
                    title="Chế độ Bảng danh sách thu gọn"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-[800] ${
                      viewMode === 'table' ? 'bg-w-primary text-white shadow-xs' : 'text-w-text-muted hover:bg-w-accent-light'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Bảng gọn</span>
                  </button>
                  
                  <button
                    onClick={() => setViewMode('questions')}
                    title="Chế độ Tìm kiếm Câu hỏi"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-[800] ${
                      viewMode === 'questions' ? 'bg-w-primary text-white shadow-xs' : 'text-w-text-muted hover:bg-w-accent-light'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Tìm câu</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 1. FOLDERS / SHELVES HIERARCHICAL VIEW                                    */}
          {/* ========================================================================= */}
          {viewMode === 'folders' && (
            <div className="space-y-4">
              {groupedBanks.map(({ key, banks, totalQuestions }) => {
                const isCollapsed = Boolean(collapsedGroups[key]);
                const isFolderDropTarget = groupByMode === 'folder' && dragOverFolder === key;

                return (
                  <div 
                    key={key} 
                    onDragOver={(e) => {
                      if (groupByMode === 'folder') {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverFolder(key);
                      }
                    }}
                    onDragLeave={(e) => {
                      if (groupByMode === 'folder') {
                        e.preventDefault();
                        e.stopPropagation();
                        if (dragOverFolder === key) setDragOverFolder(null);
                      }
                    }}
                    onDrop={(e) => {
                      if (groupByMode === 'folder') {
                        handleDropOnFolder(e, key === 'Chưa phân loại' ? null : key);
                      }
                    }}
                    className={`bg-w-bg-card border-2 rounded-[24px] shadow-xs overflow-hidden transition-all ${
                      isFolderDropTarget 
                        ? 'border-dashed border-w-primary ring-2 ring-w-primary/30 scale-[1.005]' 
                        : 'border-w-border'
                    }`}
                  >
                    {/* Group Accordion Header */}
                    <div 
                      onClick={() => toggleGroupCollapse(key)}
                      className="flex items-center justify-between p-4 bg-w-bg-alt/70 hover:bg-w-accent-light cursor-pointer transition-colors select-none border-b border-w-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-w-accent-light text-w-primary-dark border border-w-accent-border">
                          <Folder className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-[900] text-w-text-main text-base sm:text-lg flex items-center gap-2">
                            {key}
                            <span className="text-xs font-[800] px-2.5 py-0.5 rounded-full bg-w-primary text-white">
                              {banks.length} bộ đề
                            </span>
                          </h3>
                          <p className="text-[12px] font-[600] text-w-text-muted">
                            Tổng cộng {totalQuestions} câu hỏi đã sẵn sàng
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isDragging && groupByMode === 'folder' && (
                          <span className="text-xs font-[800] text-w-primary px-2.5 py-1 bg-w-bg-card rounded-lg border border-w-primary/40 animate-pulse">
                            Thả vào nhóm này
                          </span>
                        )}
                        <span className="text-xs font-[700] text-w-text-muted hidden sm:inline">
                          {isCollapsed ? 'Mở rộng' : 'Thu gọn'}
                        </span>
                        <button className="p-1 rounded-lg text-w-text-muted cursor-pointer">
                          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Group Content (List of Cards) */}
                    {!isCollapsed && (
                      <div className="p-4 sm:p-5">
                        {banks.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {banks.map(bank => {
                              const canEdit = canEditBank(bank);
                              const creator = getBankCreator(bank);
                              return (
                                <BankCardItem
                                  key={bank.id}
                                  bank={bank}
                                  activeTab={activeTab}
                                  canEdit={canEdit}
                                  creatorName={creator}
                                  isSelected={selectedBankIds.has(bank.id)}
                                  onToggleSelect={() => toggleSelectBank(bank.id)}
                                  onDragStart={(e) => handleDragStart(e, bank.id)}
                                  onDragEnd={handleDragEnd}
                                  onOpenQuickManager={(id) => handleOpenBankManager(bank)}
                                  onPreview={() => setPreviewBank(bank)}
                                  onPrint={() => setPrintBank(bank)}
                                  onToggleFavorite={() => onUpdateBanks(questionBanks.map(b => b.id === bank.id ? {...b, favorite: !b.favorite} : b))}
                                  onEdit={() => {
                                    setEditingBank(bank);
                                    setIsCreateModalOpen(true);
                                  }}
                                  onDuplicate={() => {
                                    const newBank: QuestionBank = {
                                      ...bank,
                                      id: `bank_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                                      name: `${bank.name} (Bản sao)`,
                                      isPreset: false,
                                      ownerId: user?.uid || (isAdmin ? 'admin_system' : 'guest'),
                                      userId: user?.uid || (isAdmin ? 'admin_system' : 'guest'),
                                      userEmail: user?.email,
                                      creatorName: isAdmin ? 'Admin' : (user?.displayName || user?.email?.split('@')[0] || 'Giáo viên'),
                                      createdAt: new Date().toISOString(),
                                      updatedAt: new Date().toISOString(),
                                    };
                                    onUpdateBanks([...questionBanks, newBank]);
                                    showToast(`Đã nhân bản bộ đề "${bank.name}"`);
                                  }}
                                  onDuplicateAndEdit={() => handleDuplicateAndEdit(bank)}
                                  onMoveFolder={() => {
                                    setBankToMove(bank);
                                    setSelectedTargetFolder(bank.folder || '');
                                  }}
                                  onDelete={() => {
                                    onUpdateBanks(questionBanks.map(b => b.id === bank.id ? { ...b, isDeleted: true } : b));
                                    showToast(`Đã chuyển bộ đề "${bank.name}" vào thùng rác`);
                                  }}
                                  onRestore={() => {
                                    onUpdateBanks(questionBanks.map(b => b.id === bank.id ? { ...b, isDeleted: false } : b));
                                    showToast(`Đã khôi phục bộ đề "${bank.name}"`);
                                  }}
                                  onPermanentDelete={() => {
                                    if (safeConfirm('Bạn chắc chắn muốn xóa vĩnh viễn bộ câu hỏi này?')) {
                                      onUpdateBanks(questionBanks.filter(b => b.id !== bank.id));
                                    }
                                  }}
                                />
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-8 text-center border-2 border-dashed border-w-border rounded-2xl bg-w-bg-alt/40 p-4">
                            <p className="text-xs font-[700] text-w-text-muted">
                              Thư mục này hiện đang trống.
                            </p>
                            <p className="text-[11px] text-w-text-muted/80 mt-1">
                              Hãy kéo thả một bộ đề từ nhóm khác vào đây để phân loại!
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {groupedBanks.length === 0 && (
                <div className="py-16 text-center text-w-text-muted font-medium border-2 border-dashed border-w-border rounded-[24px] bg-w-bg-card">
                  <p className="text-base font-[800] text-w-text-main">Không tìm thấy bộ câu hỏi nào phù hợp với bộ lọc hiện tại.</p>
                  <p className="text-xs text-w-text-muted mt-1">Hãy thử xóa từ khóa tìm kiếm hoặc chọn "Tất cả ngân hàng" ở thanh bên trái.</p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. GRID VIEW (THẺ LƯỚI TRỰC QUAN VỚI DRAG & DROP + CHECKBOX)             */}
          {/* ========================================================================= */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBanks.map(bank => {
                const canEdit = canEditBank(bank);
                const creator = getBankCreator(bank);
                return (
                  <BankCardItem
                    key={bank.id}
                    bank={bank}
                    activeTab={activeTab}
                    canEdit={canEdit}
                    creatorName={creator}
                    isSelected={selectedBankIds.has(bank.id)}
                    onToggleSelect={() => toggleSelectBank(bank.id)}
                    onDragStart={(e) => handleDragStart(e, bank.id)}
                    onDragEnd={handleDragEnd}
                    onOpenQuickManager={(id) => handleOpenBankManager(bank)}
                    onPreview={() => setPreviewBank(bank)}
                    onPrint={() => setPrintBank(bank)}
                    onToggleFavorite={() => onUpdateBanks(questionBanks.map(b => b.id === bank.id ? {...b, favorite: !b.favorite} : b))}
                    onEdit={() => {
                      setEditingBank(bank);
                      setIsCreateModalOpen(true);
                    }}
                    onDuplicate={() => {
                      const newBank: QuestionBank = {
                        ...bank,
                        id: `bank_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                        name: `${bank.name} (Bản sao)`,
                        isPreset: false,
                        ownerId: user?.uid || (isAdmin ? 'admin_system' : 'guest'),
                        userId: user?.uid || (isAdmin ? 'admin_system' : 'guest'),
                        userEmail: user?.email,
                        creatorName: isAdmin ? 'Admin' : (user?.displayName || user?.email?.split('@')[0] || 'Giáo viên'),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      };
                      onUpdateBanks([...questionBanks, newBank]);
                      showToast(`Đã nhân bản bộ đề "${bank.name}"`);
                    }}
                    onDuplicateAndEdit={() => handleDuplicateAndEdit(bank)}
                    onMoveFolder={() => {
                      setBankToMove(bank);
                      setSelectedTargetFolder(bank.folder || '');
                    }}
                    onDelete={() => {
                      onUpdateBanks(questionBanks.map(b => b.id === bank.id ? { ...b, isDeleted: true } : b));
                      showToast(`Đã chuyển bộ đề "${bank.name}" vào thùng rác`);
                    }}
                    onRestore={() => {
                      onUpdateBanks(questionBanks.map(b => b.id === bank.id ? { ...b, isDeleted: false } : b));
                      showToast(`Đã khôi phục bộ đề "${bank.name}"`);
                    }}
                    onPermanentDelete={() => {
                      if (safeConfirm('Bạn chắc chắn muốn xóa vĩnh viễn bộ câu hỏi này?')) {
                        onUpdateBanks(questionBanks.filter(b => b.id !== bank.id));
                      }
                    }}
                  />
                );
              })}

              {filteredBanks.length === 0 && (
                <div className="col-span-full py-16 text-center text-w-text-muted font-medium border-2 border-dashed border-w-border rounded-[24px] bg-w-bg-card">
                  <p className="text-base font-[800] text-w-text-main">Không tìm thấy bộ câu hỏi nào.</p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. COMPACT TABLE VIEW (SIÊU GỌN GÀNG, HỖ TRỢ CHỌN HÀNG LOẠT VÀ DRAG)     */}
          {/* ========================================================================= */}
          {viewMode === 'table' && (
            <div className="bg-w-bg-card border-2 border-w-border rounded-[22px] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-w-bg-alt border-b border-w-border font-[800] text-w-text-muted">
                      <th className="py-3 px-3 w-10 text-center">
                        <input 
                          type="checkbox"
                          checked={selectedBankIds.size === filteredBanks.length && filteredBanks.length > 0}
                          onChange={handleSelectAll}
                          className="rounded cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-3 w-10 text-center">Kéo</th>
                      <th className="py-3 px-3">Tên Bộ Đề</th>
                      <th className="py-3 px-3">Người Tạo</th>
                      <th className="py-3 px-3">Môn & Khối</th>
                      <th className="py-3 px-3">Thư Mục</th>
                      <th className="py-3 px-3 text-center">Số Câu</th>
                      <th className="py-3 px-3 text-center">Loại</th>
                      <th className="py-3 px-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-w-border/60">
                    {filteredBanks.map(bank => {
                      const isSelected = selectedBankIds.has(bank.id);
                      const canEdit = canEditBank(bank);
                      const creator = getBankCreator(bank);
                      return (
                        <tr 
                          key={bank.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, bank.id)}
                          onDragEnd={handleDragEnd}
                          className={`hover:bg-w-accent-light transition-colors ${
                            isSelected ? 'bg-w-accent-light/80' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectBank(bank.id)}
                              className="rounded cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center cursor-grab active:cursor-grabbing text-w-text-muted hover:text-w-primary">
                            <GripVertical className="w-4 h-4 mx-auto" />
                          </td>
                          <td className="py-2.5 px-3">
                            <span 
                              onClick={() => handleOpenBankManager(bank)}
                              className="font-[800] text-w-text-main hover:text-w-primary cursor-pointer line-clamp-1"
                              title={canEdit ? 'Nhấn để soạn đề' : `Bộ đề do ${creator} tạo (Nhấn để sao chép & sửa)`}
                            >
                              {bank.name}
                            </span>
                            {bank.topic && (
                              <span className="text-[10px] text-w-text-muted line-clamp-1">
                                {bank.topic}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              creator === 'Admin' 
                                ? 'bg-amber-100 text-amber-900 border-amber-300' 
                                : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            }`}>
                              👤 {creator}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-[600] text-w-text-muted whitespace-nowrap">
                            {bank.subject || '—'} • {bank.grade || '—'}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {bank.folder ? (
                              <span className="text-[10px] font-[700] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                📁 {bank.folder}
                              </span>
                            ) : (
                              <span className="text-[10px] text-w-text-muted italic">
                                Chung
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-[800] text-w-text-main">
                            {bank.questions?.length || 0}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            {bank.isPreset ? (
                              <span className="text-[10px] font-[700] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                SGK
                              </span>
                            ) : (
                              <span className="text-[10px] font-[700] px-2 py-0.5 rounded-full bg-w-bg-alt text-w-text-muted">
                                Tự tạo
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setPreviewBank(bank)}
                                title="Xem trước / Thi thử"
                                className="p-1.5 bg-w-bg-card hover:bg-w-accent-light text-w-primary-dark border border-w-border rounded-lg cursor-pointer transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setPrintBank(bank)}
                                title="In đề thi / Xuất Word"
                                className="p-1.5 bg-w-bg-card hover:bg-w-accent-light text-w-text-main border border-w-border rounded-lg cursor-pointer transition-colors"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              {canEdit ? (
                                <button
                                  onClick={() => onOpenQuickManager(bank.id)}
                                  className="px-3 py-1 bg-w-primary-dark hover:bg-w-primary text-white font-[800] text-[11px] rounded-lg cursor-pointer"
                                >
                                  Soạn
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDuplicateAndEdit(bank)}
                                  className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-white font-[800] text-[11px] rounded-lg cursor-pointer flex items-center gap-1"
                                  title="Sao chép để chỉnh sửa"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Sao chép</span>
                                </button>
                              )}
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

          {/* ========================================================================= */}
          {/* 4. QUESTIONS FLAT VIEW                                                    */}
          {/* ========================================================================= */}
          {viewMode === 'questions' && (
            <div className="bg-w-bg-card border-2 border-w-border rounded-[22px] shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-w-border pb-3">
                <h3 className="text-lg font-[900] text-w-text-main flex items-center gap-2">
                  <Search className="w-5 h-5 text-w-primary" />
                  Tìm kiếm Câu hỏi ({filteredQuestionsList.length} kết quả)
                </h3>
              </div>
              
              <div className="space-y-3">
                {filteredQuestionsList.slice(0, 100).map((item, idx) => (
                  <div 
                    key={`${item.question.id}-${idx}`}
                    className="bg-w-bg-card border border-w-border p-4 rounded-2xl hover:border-w-accent-border hover:shadow-md transition-all cursor-pointer"
                    onClick={() => onOpenQuickManager(item.bank.id)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <span className="inline-block px-2 py-0.5 bg-w-bg-alt text-w-text-muted text-[10px] font-bold rounded mb-2">
                          {item.question.type === 'mcq' ? 'Trắc nghiệm' : item.question.type === 'tf' ? 'Đúng/Sai' : 'Tự luận'}
                        </span>
                        <p className="text-sm font-[700] text-w-text-main leading-relaxed line-clamp-3">
                          <MathChemRenderer text={item.question.content} />
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-w-border/40">
                      <span className="text-[11px] font-[700] text-w-primary-dark bg-w-accent-light px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Folder className="w-3 h-3" /> 
                        {item.bank.name}
                      </span>
                      
                      {item.bank.subject && (
                        <span className="text-[11px] font-[700] text-w-text-main bg-w-bg-alt px-2 py-0.5 rounded-lg border border-w-border flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {item.bank.subject} {item.bank.grade}
                        </span>
                      )}
                      
                      {item.bank.folder && (
                        <span className="text-[11px] font-[700] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                          📁 {item.bank.folder}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredQuestionsList.length > 100 && (
                  <div className="text-center py-4 text-xs font-[700] text-w-text-muted">
                    Hiển thị 100 kết quả đầu tiên. Vui lòng sử dụng bộ lọc hoặc từ khóa chi tiết hơn.
                  </div>
                )}
                
                {filteredQuestionsList.length === 0 && (
                  <div className="py-12 text-center text-w-text-muted font-medium border-2 border-dashed border-w-border rounded-[24px] bg-w-bg-card">
                    <p className="text-base font-[700] text-w-text-main">Không tìm thấy câu hỏi nào.</p>
                    <p className="text-xs mt-1">Hãy thử tìm theo từ khóa nội dung câu hỏi, chủ đề, hoặc tên bài học.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS: CREATE/EDIT BANK, QUICK PREVIEW, MERGE, PRINT, MOVE TO FOLDER      */}
      {/* ========================================================================= */}

      {/* Quick Preview / Test Modal */}
      {previewBank && (
        <BankQuickPreviewModal
          isOpen={Boolean(previewBank)}
          onClose={() => setPreviewBank(null)}
          bank={previewBank}
          onOpenEditor={() => {
            const bankId = previewBank.id;
            setPreviewBank(null);
            onOpenQuickManager(bankId);
          }}
          onOpenPrint={() => {
            const bankToPrint = previewBank;
            setPreviewBank(null);
            setPrintBank(bankToPrint);
          }}
        />
      )}

      {/* Print / Export Word Exam Modal */}
      {printBank && (
        <PrintExamModal
          isOpen={Boolean(printBank)}
          onClose={() => setPrintBank(null)}
          bank={printBank}
        />
      )}

      {/* Merge Banks Modal */}
      <MergeBanksModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        selectedBanks={questionBanks.filter(b => selectedBankIds.has(b.id))}
        availableFolders={availableFolders}
        onMergeSuccess={(newBank) => {
          onUpdateBanks([newBank, ...questionBanks]);
          setSelectedBankIds(new Set());
          showToast(`Đã gộp thành công thành bộ đề "${newBank.name}" (${newBank.questions.length} câu)`);
          onOpenQuickManager(newBank.id);
        }}
      />

      {/* Create / Edit Bank Modal */}
      <CreateBankModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingBank(null);
        }}
        initialData={editingBank || undefined}
        availableFolders={availableFolders}
        onSave={(newBankData) => {
          if (editingBank) {
            onUpdateBanks(questionBanks.map(b => b.id === editingBank.id ? { ...b, ...newBankData, updatedAt: new Date().toISOString() } : b));
          } else {
            const newBank: QuestionBank = {
              id: `bank_${Date.now()}`,
              name: newBankData.name || '',
              subject: newBankData.subject || '',
              grade: newBankData.grade || '',
              topic: newBankData.topic || '',
              folder: newBankData.folder || (selectedFolder && selectedFolder !== '__unorganized__' ? selectedFolder : undefined),
              description: newBankData.description || '',
              tags: newBankData.tags || [],
              visibility: newBankData.visibility || 'private',
              ownerId: user?.uid,
              questions: [],
              createdAt: new Date().toISOString(),
            };
            onUpdateBanks([newBank, ...questionBanks]);
            onOpenQuickManager(newBank.id);
          }
          setIsCreateModalOpen(false);
          setEditingBank(null);
        }}
      />

      {/* Move to Folder Modal */}
      {bankToMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-w-bg-card border-2 border-w-border rounded-[24px] p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-[900] text-w-text-main flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-w-primary" />
              Chuyển Vào Thư Mục
            </h3>
            <p className="text-xs text-w-text-muted font-[600]">
              Chọn thư mục phân loại cho bộ đề: <strong>"{bankToMove.name}"</strong>
            </p>

            <div className="space-y-2">
              <label className="text-xs font-[800] text-w-text-main">
                Chọn từ thư mục có sẵn:
              </label>
              <select
                value={selectedTargetFolder}
                onChange={(e) => setSelectedTargetFolder(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-w-input-bg border border-w-border rounded-[16px] text-xs sm:text-sm font-[600] text-w-text-main focus:outline-none focus:border-w-primary"
              >
                <option value="">📂 Bỏ phân loại (Thư mục chung)</option>
                {availableFolders.map(f => (
                  <option key={f} value={f}>📁 {f}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setBankToMove(null);
                  setSelectedTargetFolder('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-[700] text-w-text-muted hover:bg-w-accent-light cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  handleAssignBankToFolder(bankToMove.id, selectedTargetFolder);
                  setBankToMove(null);
                  setSelectedTargetFolder('');
                }}
                className="px-5 py-2 wey-btn-primary text-xs font-[800] shadow-xs cursor-pointer"
              >
                Lưu Vào Thư Mục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// SUB-COMPONENT: BANK CARD ITEM WITH DRAG HANDLE, BATCH CHECKBOX & COGNITIVE BAR
// =============================================================================
interface BankCardItemProps {
  bank: QuestionBank;
  activeTab: TabType;
  canEdit?: boolean;
  creatorName?: string;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onOpenQuickManager: (bankId: string) => void;
  onPreview: () => void;
  onPrint: () => void;
  onToggleFavorite: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDuplicateAndEdit?: () => void;
  onMoveFolder: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onPermanentDelete: () => void;
}

const BankCardItem: React.FC<BankCardItemProps> = ({
  bank,
  activeTab,
  canEdit = true,
  creatorName = 'Admin',
  isSelected = false,
  onToggleSelect,
  onDragStart,
  onDragEnd,
  onOpenQuickManager,
  onPreview,
  onPrint,
  onToggleFavorite,
  onEdit,
  onDuplicate,
  onDuplicateAndEdit,
  onMoveFolder,
  onDelete,
  onRestore,
  onPermanentDelete,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const questions = bank.questions || [];
  const questionsCount = questions.length;
  const mcqCount = questions.filter(q => q.type === 'mcq').length;
  const tfCount = questions.filter(q => q.type === 'tf').length;
  const textCount = questions.filter(q => q.type === 'text').length;

  // Cognitive Level Counts
  const nbCount = questions.filter(q => q.cognitiveLevel === 'NB' || q.cognitiveLevel === 'Nhận biết').length;
  const thCount = questions.filter(q => q.cognitiveLevel === 'TH' || q.cognitiveLevel === 'Thông hiểu').length;
  const vdCount = questions.filter(q => q.cognitiveLevel === 'VD' || q.cognitiveLevel === 'Vận dụng').length;
  const vdcCount = questions.filter(q => q.cognitiveLevel === 'VDC' || q.cognitiveLevel === 'Vận dụng cao').length;
  const hasCognitive = questionsCount > 0 && (nbCount > 0 || thCount > 0 || vdCount > 0 || vdcCount > 0);

  return (
    <div 
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`bg-w-bg-card border-2 rounded-[22px] p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative group hover:border-w-accent-border ${
        isSelected ? 'border-w-primary ring-2 ring-w-primary/30 bg-w-accent-light/40' : 'border-w-border'
      }`}
    >
      <div>
        {/* Top Badges, Drag Handle, Checkbox & Favorite */}
        <div className="flex justify-between items-start mb-2.5 gap-2">
          
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Batch Selection Checkbox */}
            {onToggleSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelect}
                className="rounded cursor-pointer w-4 h-4"
                title="Chọn bộ đề này để thao tác hàng loạt"
              />
            )}

            {/* Drag Handle Icon */}
            <div 
              className="cursor-grab active:cursor-grabbing p-1 text-w-text-muted hover:text-w-primary rounded hover:bg-w-bg-alt"
              title="Kéo thả vào thư mục bên trái để phân loại"
            >
              <GripVertical className="w-4 h-4" />
            </div>

            {/* Creator Badge */}
            <span className={`text-[10px] font-[800] px-2 py-0.5 rounded-full flex items-center gap-1 border ${
              creatorName === 'Admin' 
                ? 'bg-amber-100/90 text-amber-900 border-amber-300' 
                : 'bg-indigo-50 text-indigo-800 border-indigo-200'
            }`} title={`Người tạo: ${creatorName}`}>
              👤 {creatorName}
            </span>

            {bank.isPreset ? (
              <span className="text-[10px] font-[800] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                ⭐ SGK Chuẩn
              </span>
            ) : (
              <span className={`text-[10px] font-[800] px-2 py-0.5 rounded-full flex items-center gap-1 ${
                bank.visibility === 'private' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {bank.visibility === 'private' ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                {bank.visibility === 'private' ? 'RIÊNG TƯ' : 'CÔNG KHAI'}
              </span>
            )}

            {bank.folder && (
              <span className="text-[10px] font-[700] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                📁 {bank.folder}
              </span>
            )}
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="text-w-border hover:text-amber-400 transition-colors p-1 cursor-pointer"
          >
            <Star className={`w-4 h-4 ${bank.favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
        </div>

        {/* Title */}
        <h4 
          onClick={() => {
            if (canEdit) onOpenQuickManager(bank.id);
            else if (onDuplicateAndEdit) onDuplicateAndEdit();
            else onOpenQuickManager(bank.id);
          }}
          className="font-[800] text-w-text-main text-base leading-snug mb-1.5 line-clamp-2 hover:text-w-primary cursor-pointer"
          title={canEdit ? 'Nhấn để soạn đề' : `Bộ đề do ${creatorName} tạo công khai (Nhấn để tạo bản sao và sửa)`}
        >
          {bank.name}
        </h4>

        {/* Meta Info */}
        <div className="space-y-1 text-xs font-[600] text-w-text-muted mb-3">
          <p className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-w-primary" />
            <span>{bank.subject || 'Tổng hợp'} • {bank.grade || 'Mọi khối'}</span>
          </p>
          {bank.topic && (
            <p className="flex items-center gap-1.5 line-clamp-1 text-[11px]">
              <Tag className="w-3 h-3 text-w-primary shrink-0" />
              <span>{bank.topic}</span>
            </p>
          )}
        </div>

        {/* Question Type Breakdown Pills */}
        <div className="flex flex-wrap items-center gap-1.5 py-2 px-2.5 bg-w-bg-alt rounded-xl border border-w-border/60 text-[11px] font-[700] text-w-text-main mb-2">
          <span className="font-[800] text-w-text-main flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> {questionsCount} câu hỏi:
          </span>
          {mcqCount > 0 && <span className="text-[10px] px-1.5 py-0.2 bg-w-bg-card rounded-md border border-w-border">{mcqCount} trắc nghiệm</span>}
          {tfCount > 0 && <span className="text-[10px] px-1.5 py-0.2 bg-w-bg-card rounded-md border border-w-border">{tfCount} đúng/sai</span>}
          {textCount > 0 && <span className="text-[10px] px-1.5 py-0.2 bg-w-bg-card rounded-md border border-w-border">{textCount} tự luận</span>}
          {questionsCount === 0 && <span className="text-amber-700 italic text-[10px]">Chưa có câu hỏi</span>}
        </div>

        {/* Cognitive Matrix Mini-Bar (if available) */}
        {hasCognitive && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] font-[700] text-w-text-muted mb-1">
              <span>Ma trận nhận thức:</span>
              <span className="text-w-primary-dark font-[800]">
                {nbCount} NB • {thCount} TH • {vdCount} VD {vdcCount > 0 ? `• ${vdcCount} VDC` : ''}
              </span>
            </div>
            <div className="h-1.5 w-full bg-w-bg-alt rounded-full overflow-hidden flex border border-w-border/40">
              {nbCount > 0 && <div style={{ width: `${(nbCount / questionsCount) * 100}%` }} className="bg-sky-400" title={`Nhận biết: ${nbCount}`} />}
              {thCount > 0 && <div style={{ width: `${(thCount / questionsCount) * 100}%` }} className="bg-emerald-400" title={`Thông hiểu: ${thCount}`} />}
              {vdCount > 0 && <div style={{ width: `${(vdCount / questionsCount) * 100}%` }} className="bg-amber-400" title={`Vận dụng: ${vdCount}`} />}
              {vdcCount > 0 && <div style={{ width: `${(vdcCount / questionsCount) * 100}%` }} className="bg-purple-400" title={`Vận dụng cao: ${vdcCount}`} />}
            </div>
          </div>
        )}
      </div>

      {/* Card Footer & Actions */}
      <div className="pt-3 border-t border-w-border/60 flex items-center justify-between">
        <span className="text-[10px] text-w-text-muted font-[600]">
          {new Date(bank.updatedAt || bank.createdAt).toLocaleDateString('vi-VN')}
        </span>

        <div className="flex items-center gap-1.5">
          {/* Quick Preview / Test Button */}
          <button
            onClick={onPreview}
            title="Xem trước & Thi thử"
            className="p-1.5 bg-w-bg-card hover:bg-w-accent-light text-w-primary-dark border border-w-border rounded-lg cursor-pointer transition-colors shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Quick Print Button */}
          <button
            onClick={onPrint}
            title="In đề & Đáp án"
            className="p-1.5 bg-w-bg-card hover:bg-w-accent-light text-w-text-main border border-w-border rounded-lg cursor-pointer transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {canEdit ? (
            <button 
              onClick={() => onOpenQuickManager(bank.id)}
              className="px-3.5 py-1.5 wey-btn-primary text-xs cursor-pointer shadow-xs font-[800]"
            >
              Soạn Đề
            </button>
          ) : (
            <button 
              onClick={() => onDuplicateAndEdit ? onDuplicateAndEdit() : onDuplicate()}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-[800] text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
              title="Bộ câu hỏi do người khác tạo công khai. Nhấn để tạo bản sao và tự do chỉnh sửa!"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Sao Chép & Sửa</span>
            </button>
          )}

          {/* More Actions Dropdown */}
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen(!dropdownOpen);
              }}
              className="p-1.5 text-w-text-muted hover:bg-w-accent-light rounded-lg transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 bottom-full mb-1 w-48 bg-w-bg-card border border-w-border rounded-[16px] shadow-xl z-50 overflow-hidden py-1">
                  {activeTab !== 'trash' ? (
                    <>
                      <button
                        onClick={() => {
                          onPreview();
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-[700] text-w-text-main hover:bg-w-accent-light flex items-center gap-2 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-w-primary" /> Xem trước / Thi thử
                      </button>

                      <button
                        onClick={() => {
                          onPrint();
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-[700] text-w-text-main hover:bg-w-accent-light flex items-center gap-2 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-w-primary" /> In đề / Xuất Word
                      </button>

                      <div className="border-t border-w-border/60 my-1" />

                      {canEdit ? (
                        <>
                          <button
                            onClick={() => {
                              onEdit();
                              setDropdownOpen(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-[700] text-w-text-main hover:bg-w-accent-light flex items-center gap-2 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" /> Sửa thông tin bộ
                          </button>

                          <button
                            onClick={() => {
                              onMoveFolder();
                              setDropdownOpen(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-[700] text-w-text-main hover:bg-w-accent-light flex items-center gap-2 cursor-pointer"
                          >
                            <FolderPlus className="w-3.5 h-3.5 text-amber-500" /> Chuyển thư mục
                          </button>

                          <button
                            onClick={() => {
                              onDuplicate();
                              setDropdownOpen(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-[700] text-w-text-main hover:bg-w-accent-light flex items-center gap-2 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" /> Nhân bản bộ này
                          </button>

                          <div className="border-t border-w-border/60 my-1" />

                          <button
                            onClick={() => {
                              onDelete();
                              setDropdownOpen(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-[700] text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Chuyển thùng rác
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            if (onDuplicateAndEdit) onDuplicateAndEdit();
                            else onDuplicate();
                            setDropdownOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-[700] text-amber-800 hover:bg-amber-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 text-amber-500" /> Tạo bản sao để sửa
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          onRestore();
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-[700] text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Khôi phục
                      </button>

                      <button
                        onClick={() => {
                          onPermanentDelete();
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-[700] text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xóa vĩnh viễn
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
