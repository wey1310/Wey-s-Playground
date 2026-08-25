import { safeAlert, safeConfirm } from "../utils/safeAlert";
import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, FileText, Lock, Globe, Star, MoreVertical, Trash2, Copy, 
  ArrowLeft, History, Folder, FolderPlus, Grid, List, Layers, 
  Filter, Sparkles, BookOpen, CheckCircle2, ChevronDown, ChevronRight,
  MoveRight, Check, Tag, Info
} from 'lucide-react';
import type { QuestionBank, Question } from "../types";
import { useAuth } from '../contexts/AuthContext';
import { CreateBankModal } from './CreateBankModal';
import { GRADES, ALL_SUBJECTS } from '../data/curriculumData';

interface QuestionBankViewProps {
  onBack: () => void;
  questionBanks: QuestionBank[];
  onUpdateBanks: (banks: QuestionBank[]) => void;
  onOpenQuickManager: (bankId: string) => void;
  onOpenAiGenerator?: () => void;
}

type TabType = 'all' | 'presets' | 'mine' | 'public' | 'private' | 'favorite' | 'trash';
type ViewMode = 'folders' | 'grid' | 'table' | 'questions';
type GroupByMode = 'grade' | 'subject' | 'folder';

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  onBack,
  questionBanks,
  onUpdateBanks,
  onOpenQuickManager,
  onOpenAiGenerator
}) => {
  const { user } = useAuth();
  
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('folders');
  const [groupByMode, setGroupByMode] = useState<GroupByMode>('grade');
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [folderFilter, setFolderFilter] = useState('');
  const [hasQuestionsFilter, setHasQuestionsFilter] = useState<'all' | 'has_questions' | 'empty'>('all');
  
  // Modals & Popups
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  
  // Folder Creation Modal
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Move to Folder Modal
  const [bankToMove, setBankToMove] = useState<QuestionBank | null>(null);
  const [selectedTargetFolder, setSelectedTargetFolder] = useState<string>('');

  // Collapsed sections in Folder view
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Extract all unique custom folders from existing banks
  const availableFolders = useMemo(() => {
    const folders = new Set<string>();
    questionBanks.forEach(b => {
      if (b.folder && b.folder.trim() && !b.isDeleted) {
        folders.add(b.folder.trim());
      }
    });
    return Array.from(folders).sort();
  }, [questionBanks]);

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
    };
  }, [questionBanks]);

  // Filtered Banks
  const filteredBanks = useMemo(() => {
    return questionBanks.filter(bank => {
      // Trash handling
      if (activeTab === 'trash') return bank.isDeleted;
      if (bank.isDeleted) return false;

      // Tab filters
      if (activeTab === 'presets' && !bank.isPreset) return false;
      if (activeTab === 'mine' && user && bank.ownerId !== user.uid) return false;
      if (activeTab === 'public' && bank.visibility !== 'public' && !bank.isPreset) return false;
      if (activeTab === 'private' && bank.visibility !== 'private') return false;
      if (activeTab === 'favorite' && !bank.favorite) return false;

      // Dropdown filters
      if (subjectFilter && bank.subject !== subjectFilter) return false;
      if (gradeFilter && bank.grade !== gradeFilter) return false;
      if (folderFilter && (bank.folder || 'Chưa phân loại') !== folderFilter) return false;

      // Question count filter
      if (hasQuestionsFilter === 'has_questions' && (!bank.questions || bank.questions.length === 0)) return false;
      if (hasQuestionsFilter === 'empty' && bank.questions && bank.questions.length > 0) return false;

      // Search query (for Banks view modes)
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
  }, [questionBanks, activeTab, subjectFilter, gradeFilter, folderFilter, hasQuestionsFilter, searchQuery, user, viewMode]);

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

    filteredBanks.forEach(bank => {
      let key = 'Chưa phân loại';
      if (groupByMode === 'grade') {
        key = bank.grade || 'Khác';
      } else if (groupByMode === 'subject') {
        key = bank.subject || 'Tổng hợp';
      } else if (groupByMode === 'folder') {
        key = bank.folder || '📁 Thư mục chung';
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(bank);
    });

    // Sort group keys logically
    const sortedKeys = Object.keys(groups).sort((a, b) => {
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
  }, [filteredBanks, groupByMode]);

  // Handle moving bank to folder
  const handleMoveToFolder = (targetFolder: string) => {
    if (!bankToMove) return;
    const cleanFolder = targetFolder.trim() || undefined;
    onUpdateBanks(questionBanks.map(b => b.id === bankToMove.id ? { ...b, folder: cleanFolder, updatedAt: new Date().toISOString() } : b));
    setBankToMove(null);
    setSelectedTargetFolder('');
  };

  return (
    <div className="w-full flex flex-col space-y-5">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            className="p-2.5 hover:bg-[#E9F0D9] text-[#4F683C] rounded-2xl transition-colors border border-[#DED5B8] bg-[#FFFDF5] shadow-xs cursor-pointer"
            title="Quay lại bảng điều khiển chính"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-[900] text-[#35452E] flex items-center gap-2">
                🏛️ Kho Lưu Trữ Bộ Đề & Câu Hỏi
              </h2>
              <span className="bg-[#E9F0D9] text-[#4F683C] text-xs font-[800] px-2.5 py-1 rounded-full border border-[#B9CDA0]">
                {repoStats.totalBanks} bộ đề
              </span>
            </div>
            <p className="text-[#74806B] text-xs sm:text-sm font-[600] mt-0.5">
              Kho kiến thức tập trung: phân loại thông minh theo khối lớp, môn học và thư mục chuyên đề.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenAiGenerator && (
            <button
              onClick={onOpenAiGenerator}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-[800] text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              AI Tạo Đề Nhanh
            </button>
          )}

          <button
            onClick={() => setIsFolderModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[#FFFDF5] hover:bg-[#E9F0D9] text-[#4F683C] font-[700] text-xs sm:text-sm border border-[#B9CDA0] shadow-xs transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            Tạo Thư Mục
          </button>

          <button
            onClick={() => {
              setEditingBank(null);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#6F8F55] hover:bg-[#5F7E4B] text-white font-[800] text-xs sm:text-sm shadow-[0_4px_12px_rgba(79,104,60,0.2)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tạo Bộ Đề Mới
          </button>
        </div>
      </div>

      {/* Summary Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FFFDF5] border border-[#DED5B8] p-3.5 rounded-[22px] shadow-xs">
        <div className="flex items-center gap-3 px-3 py-1.5 border-r border-[#DED5B8]/60 last:border-0">
          <div className="w-9 h-9 rounded-xl bg-[#E9F0D9] text-[#4F683C] flex items-center justify-center font-[800]">
            📚
          </div>
          <div>
            <div className="text-[11px] font-[700] text-[#74806B]">Tổng số bộ đề</div>
            <div className="text-base font-[900] text-[#35452E]">{repoStats.totalBanks} bộ</div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 py-1.5 border-r border-[#DED5B8]/60 last:border-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-[800]">
            📝
          </div>
          <div>
            <div className="text-[11px] font-[700] text-[#74806B]">Tổng số câu hỏi</div>
            <div className="text-base font-[900] text-emerald-800">{repoStats.totalQuestions} câu</div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 py-1.5 border-r border-[#DED5B8]/60 last:border-0">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-[800]">
            🎓
          </div>
          <div>
            <div className="text-[11px] font-[700] text-[#74806B]">Khối lớp & Môn</div>
            <div className="text-base font-[900] text-[#35452E]">{repoStats.gradesCount} khối • {repoStats.subjectsCount} môn</div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 py-1.5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-[800]">
            📁
          </div>
          <div>
            <div className="text-[11px] font-[700] text-[#74806B]">Thư mục chuyên đề</div>
            <div className="text-base font-[900] text-amber-800">{availableFolders.length} thư mục</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search + Filters + View Mode Switcher */}
      <div className="bg-[#FFFDF5] border border-[#DED5B8] p-3.5 rounded-[22px] shadow-sm flex flex-col gap-3">
        {/* Row 1: Search & Dropdowns */}
        <div className="flex flex-col lg:flex-row gap-3 items-center">
          {/* Search Input */}
          <div className="flex-1 relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74806B]" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên bộ đề, bài học SGK, môn, khối lớp, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DED5B8] rounded-[16px] text-xs sm:text-sm font-[600] text-[#35452E] focus:outline-none focus:border-[#6F8F55] focus:ring-2 focus:ring-[#6F8F55]/20 transition-all shadow-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-[700] text-[#74806B] hover:text-[#35452E]"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Quick Dropdown Selectors */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full lg:w-auto items-center">
            {/* Grade Filter */}
            <select
              value={gradeFilter}
              onChange={e => setGradeFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 bg-white border border-[#DED5B8] rounded-[14px] text-xs font-[700] text-[#4F683C] cursor-pointer shadow-xs focus:outline-none focus:border-[#6F8F55]"
            >
              <option value="">🎓 Tất cả Khối Lớp</option>
              {GRADES.map(gr => (
                <option key={gr} value={gr}>{gr}</option>
              ))}
            </select>

            {/* Subject Filter */}
            <select 
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 bg-white border border-[#DED5B8] rounded-[14px] text-xs font-[700] text-[#4F683C] cursor-pointer shadow-xs focus:outline-none focus:border-[#6F8F55]"
            >
              <option value="">📚 Tất cả Môn Học</option>
              {ALL_SUBJECTS.map(subj => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>

            {/* Custom Folder Filter */}
            {availableFolders.length > 0 && (
              <select
                value={folderFilter}
                onChange={e => setFolderFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 bg-white border border-[#DED5B8] rounded-[14px] text-xs font-[700] text-[#4F683C] cursor-pointer shadow-xs focus:outline-none focus:border-[#6F8F55]"
              >
                <option value="">📁 Tất cả Thư Mục</option>
                {availableFolders.map(f => (
                  <option key={f} value={f}>📁 {f}</option>
                ))}
              </select>
            )}

            {/* Question Count Filter */}
            <select
              value={hasQuestionsFilter}
              onChange={e => setHasQuestionsFilter(e.target.value as any)}
              className="flex-1 sm:flex-none px-3 py-2 bg-white border border-[#DED5B8] rounded-[14px] text-xs font-[700] text-[#4F683C] cursor-pointer shadow-xs focus:outline-none focus:border-[#6F8F55]"
            >
              <option value="all">📝 Mọi số lượng câu</option>
              <option value="has_questions">✅ Có câu hỏi (&gt;0)</option>
              <option value="empty">⚠️ Chưa có câu hỏi (0)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Category Tabs & View Mode Toggles */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-[#DED5B8]/60">
          {/* Quick Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full hide-scrollbar">
            {[
              { id: 'all', label: 'Tất cả kho', icon: '📚' },
              { id: 'presets', label: 'Mẫu KHTN Chuẩn SGK', icon: '🔬' },
              { id: 'mine', label: 'Bộ của tôi', icon: '👤' },
              { id: 'favorite', label: 'Yêu thích', icon: '⭐' },
              { id: 'public', label: 'Công khai', icon: '🌎' },
              { id: 'private', label: 'Riêng tư', icon: '🔒' },
              { id: 'trash', label: 'Thùng rác', icon: '🗑' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-3 py-1.5 rounded-xl font-[800] text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id 
                    ? 'bg-[#4F683C] text-white shadow-xs' 
                    : 'bg-[#F8F3E5] text-[#556948] hover:bg-[#E9F0D9]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* View Mode & Group Switchers */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {viewMode === 'folders' && (
              <div className="flex items-center gap-1 bg-[#F8F3E5] p-1 rounded-xl border border-[#DED5B8]">
                <span className="text-[10px] font-[800] text-[#74806B] px-1.5">Gom theo:</span>
                <button
                  onClick={() => setGroupByMode('grade')}
                  className={`text-[11px] font-[700] px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                    groupByMode === 'grade' ? 'bg-[#4F683C] text-white' : 'text-[#556948] hover:bg-[#E9F0D9]'
                  }`}
                >
                  Khối Lớp
                </button>
                <button
                  onClick={() => setGroupByMode('subject')}
                  className={`text-[11px] font-[700] px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                    groupByMode === 'subject' ? 'bg-[#4F683C] text-white' : 'text-[#556948] hover:bg-[#E9F0D9]'
                  }`}
                >
                  Môn Học
                </button>
                <button
                  onClick={() => setGroupByMode('folder')}
                  className={`text-[11px] font-[700] px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                    groupByMode === 'folder' ? 'bg-[#4F683C] text-white' : 'text-[#556948] hover:bg-[#E9F0D9]'
                  }`}
                >
                  Thư Mục
                </button>
              </div>
            )}

            {/* View Mode Icons */}
            <div className="flex items-center bg-[#F8F3E5] p-1 rounded-xl border border-[#DED5B8]">
              <button
                onClick={() => setViewMode('folders')}
                title="Chế độ Kho & Thư mục phân cấp (Dễ quan sát)"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-[700] ${
                  viewMode === 'folders' ? 'bg-[#4F683C] text-white shadow-xs' : 'text-[#74806B] hover:bg-[#E9F0D9]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Kho phân cấp</span>
              </button>

              <button
                onClick={() => setViewMode('table')}
                title="Chế độ Bảng danh sách thu gọn (Đỡ kéo nhiều, xem được nhiều bộ)"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-[700] ${
                  viewMode === 'table' ? 'bg-[#4F683C] text-white shadow-xs' : 'text-[#74806B] hover:bg-[#E9F0D9]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Bảng siêu gọn</span>
              </button>

              <button
                onClick={() => setViewMode('grid')}
                title="Chế độ Lưới thẻ trực quan"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-[700] ${
                  viewMode === 'grid' ? 'bg-[#4F683C] text-white shadow-xs' : 'text-[#74806B] hover:bg-[#E9F0D9]'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Thẻ lưới</span>
              </button>
              
              <button
                onClick={() => setViewMode('questions')}
                title="Chế độ Tìm kiếm Câu hỏi"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-[700] ${
                  viewMode === 'questions' ? 'bg-[#4F683C] text-white shadow-xs' : 'text-[#74806B] hover:bg-[#E9F0D9]'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Tìm câu hỏi</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area based on ViewMode */}

      {/* ========================================================================= */}
      {/* 1. FOLDERS / SHELVES HIERARCHICAL VIEW (GOM THEO KHỐI/MÔN/THƯ MỤC)        */}
      {/* ========================================================================= */}
      {viewMode === 'folders' && (
        <div className="space-y-4">
          {groupedBanks.map(({ key, banks, totalQuestions }) => {
            const isCollapsed = Boolean(collapsedGroups[key]);
            return (
              <div 
                key={key} 
                className="bg-[#FFFDF5] border border-[#DED5B8] rounded-[22px] shadow-sm overflow-hidden transition-all"
              >
                {/* Group Accordion Header */}
                <div 
                  onClick={() => toggleGroupCollapse(key)}
                  className="flex items-center justify-between p-4 bg-[#F8F3E5]/80 hover:bg-[#F2ECD8] cursor-pointer transition-colors select-none border-b border-[#DED5B8]/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#E9F0D9] text-[#4F683C] border border-[#B9CDA0]">
                      <Folder className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-[900] text-[#35452E] text-base sm:text-lg flex items-center gap-2">
                        {key}
                        <span className="text-xs font-[800] px-2 py-0.5 rounded-full bg-[#4F683C] text-white">
                          {banks.length} bộ đề
                        </span>
                      </h3>
                      <p className="text-[12px] font-[600] text-[#74806B]">
                        Tổng cộng {totalQuestions} câu hỏi đã sẵn sàng
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-[700] text-[#74806B] hidden sm:inline">
                      {isCollapsed ? 'Nhấn để mở' : 'Nhấn để thu gọn'}
                    </span>
                    <button className="p-1 rounded-lg text-[#74806B]">
                      {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Group Content (List of Cards) */}
                {!isCollapsed && (
                  <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {banks.map(bank => (
                      <BankCardItem
                        key={bank.id}
                        bank={bank}
                        activeTab={activeTab}
                        onOpenQuickManager={onOpenQuickManager}
                        onToggleFavorite={() => onUpdateBanks(questionBanks.map(b => b.id === bank.id ? {...b, favorite: !b.favorite} : b))}
                        onEdit={() => {
                          setEditingBank(bank);
                          setIsCreateModalOpen(true);
                        }}
                        onDuplicate={() => {
                          const newBank: QuestionBank = {
                            ...bank,
                            id: `bank_${Date.now()}`,
                            name: `${bank.name} (Bản sao)`,
                            isPreset: false,
                            createdAt: new Date().toISOString(),
                          };
                          onUpdateBanks([...questionBanks, newBank]);
                        }}
                        onMoveFolder={() => {
                          setBankToMove(bank);
                          setSelectedTargetFolder(bank.folder || '');
                        }}
                        onDelete={() => {
                          onUpdateBanks(questionBanks.map(b => b.id === bank.id ? { ...b, isDeleted: true } : b));
                        }}
                        onRestore={() => {
                          onUpdateBanks(questionBanks.map(b => b.id === bank.id ? { ...b, isDeleted: false } : b));
                        }}
                        onPermanentDelete={() => {
                          if (safeConfirm('Bạn chắc chắn muốn xóa vĩnh viễn bộ câu hỏi này?')) {
                            onUpdateBanks(questionBanks.filter(b => b.id !== bank.id));
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {groupedBanks.length === 0 && (
            <div className="py-16 text-center text-[#74806B] font-medium border-2 border-dashed border-[#DED5B8] rounded-[24px] bg-[#FFFDF5]">
              <p className="text-base font-[700] text-[#35452E]">Không tìm thấy bộ câu hỏi nào phù hợp với bộ lọc hiện tại.</p>
              <p className="text-xs text-[#74806B] mt-1">Hãy thử xóa từ khóa tìm kiếm hoặc chọn "Tất cả kho" để xem đầy đủ.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. COMPACT TABLE VIEW (SIÊU GỌN GÀNG, ĐỠ KÉO NHIỀU, XEM ĐƯỢC NHIỀU BỘ)    */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <div className="bg-[#FFFDF5] border border-[#DED5B8] rounded-[22px] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F3E5] border-b border-[#DED5B8] text-[11px] font-[800] text-[#4F683C] uppercase tracking-wider">
                  <th className="py-3 px-4 w-10 text-center">⭐</th>
                  <th className="py-3 px-4">Tên Bộ Đề & Chủ Đề</th>
                  <th className="py-3 px-3">Khối / Lớp</th>
                  <th className="py-3 px-3">Môn Học</th>
                  <th className="py-3 px-3">Thư Mục</th>
                  <th className="py-3 px-3 text-center">Số Câu</th>
                  <th className="py-3 px-3">Quyền</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DED5B8]/60 text-xs font-[600]">
                {filteredBanks.map(bank => {
                  const qCount = bank.questions?.length || 0;
                  return (
                    <tr 
                      key={bank.id}
                      className="hover:bg-[#E9F0D9]/40 transition-colors group cursor-pointer"
                      onClick={() => onOpenQuickManager(bank.id)}
                    >
                      {/* Favorite star */}
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => onUpdateBanks(questionBanks.map(b => b.id === bank.id ? {...b, favorite: !b.favorite} : b))}
                          className="text-[#DED5B8] hover:text-amber-400 transition-colors"
                        >
                          <Star className={`w-4 h-4 ${bank.favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </td>

                      {/* Name & Topic */}
                      <td className="py-3 px-4">
                        <div className="font-[800] text-[#35452E] group-hover:text-[#4F683C] text-sm flex items-center gap-1.5">
                          {bank.isPreset && (
                            <span className="text-[9px] font-[800] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 shrink-0">
                              SGK Chuẩn
                            </span>
                          )}
                          <span className="line-clamp-1">{bank.name}</span>
                        </div>
                        {bank.topic && (
                          <div className="text-[11px] text-[#74806B] line-clamp-1 mt-0.5 font-[500]">
                            {bank.topic}
                          </div>
                        )}
                      </td>

                      {/* Grade */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-[#E9F0D9] text-[#4F683C] font-[700] text-[11px] whitespace-nowrap">
                          {bank.grade}
                        </span>
                      </td>

                      {/* Subject */}
                      <td className="py-3 px-3 text-[#35452E] whitespace-nowrap">
                        {bank.subject}
                      </td>

                      {/* Folder */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {bank.folder ? (
                          <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            📁 {bank.folder}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#74806B]/70 italic">-</span>
                        )}
                      </td>

                      {/* Question count */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-[800] text-[11px] ${
                          qCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {qCount} câu
                        </span>
                      </td>

                      {/* Visibility */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`text-[10px] font-[700] px-2 py-0.5 rounded-full ${
                          bank.visibility === 'private' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {bank.visibility === 'private' ? 'Riêng tư' : 'Công khai'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenQuickManager(bank.id)}
                            className="px-3 py-1 bg-[#4F683C] hover:bg-[#3D522B] text-white font-[700] text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                          >
                            Mở Soạn
                          </button>
                          
                          <button
                            onClick={() => {
                              setEditingBank(bank);
                              setIsCreateModalOpen(true);
                            }}
                            title="Sửa thông tin bộ"
                            className="p-1.5 text-[#74806B] hover:bg-[#E9F0D9] hover:text-[#35452E] rounded-lg transition-colors cursor-pointer"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setBankToMove(bank);
                              setSelectedTargetFolder(bank.folder || '');
                            }}
                            title="Chuyển vào thư mục"
                            className="p-1.5 text-[#74806B] hover:bg-[#E9F0D9] hover:text-[#35452E] rounded-lg transition-colors cursor-pointer"
                          >
                            <Folder className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (activeTab === 'trash') {
                                if (safeConfirm('Bạn chắc chắn muốn xóa vĩnh viễn?')) {
                                  onUpdateBanks(questionBanks.filter(b => b.id !== bank.id));
                                }
                              } else {
                                onUpdateBanks(questionBanks.map(b => b.id === bank.id ? { ...b, isDeleted: true } : b));
                              }
                            }}
                            title={activeTab === 'trash' ? 'Xóa vĩnh viễn' : 'Xóa bộ đề'}
                            className="p-1.5 text-[#8C3A50] hover:bg-[#FCE8EE] rounded-lg transition-colors cursor-pointer"
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

          {filteredBanks.length === 0 && (
            <div className="py-16 text-center text-[#74806B] font-medium">
              <p className="text-base font-[700] text-[#35452E]">Không tìm thấy bộ câu hỏi nào.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. GRID CARDS VIEW                                                        */}
      {/* ========================================================================= */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBanks.map(bank => (
            <BankCardItem
              key={bank.id}
              bank={bank}
              activeTab={activeTab}
              onOpenQuickManager={onOpenQuickManager}
              onToggleFavorite={() => onUpdateBanks(questionBanks.map(b => b.id === bank.id ? {...b, favorite: !b.favorite} : b))}
              onEdit={() => {
                setEditingBank(bank);
                setIsCreateModalOpen(true);
              }}
              onDuplicate={() => {
                const newBank: QuestionBank = {
                  ...bank,
                  id: `bank_${Date.now()}`,
                  name: `${bank.name} (Bản sao)`,
                  isPreset: false,
                  createdAt: new Date().toISOString(),
                };
                onUpdateBanks([...questionBanks, newBank]);
              }}
              onMoveFolder={() => {
                setBankToMove(bank);
                setSelectedTargetFolder(bank.folder || '');
              }}
              onDelete={() => {
                onUpdateBanks(questionBanks.map(b => b.id === bank.id ? { ...b, isDeleted: true } : b));
              }}
              onRestore={() => {
                onUpdateBanks(questionBanks.map(b => b.id === bank.id ? { ...b, isDeleted: false } : b));
              }}
              onPermanentDelete={() => {
                if (safeConfirm('Bạn chắc chắn muốn xóa vĩnh viễn bộ câu hỏi này?')) {
                  onUpdateBanks(questionBanks.filter(b => b.id !== bank.id));
                }
              }}
            />
          ))}

          {filteredBanks.length === 0 && (
            <div className="col-span-full py-16 text-center text-[#74806B] font-medium border-2 border-dashed border-[#DED5B8] rounded-[24px] bg-[#FFFDF5]">
              <p className="text-base font-[700] text-[#35452E]">Không tìm thấy bộ câu hỏi nào.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. QUESTIONS FLAT VIEW                                                    */}
      {/* ========================================================================= */}
      {viewMode === 'questions' && (
        <div className="bg-[#FFFDF5] border border-[#DED5B8] rounded-[22px] shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#DED5B8]/60 pb-3">
            <h3 className="text-lg font-[900] text-[#35452E] flex items-center gap-2">
              <Search className="w-5 h-5 text-[#6F8F55]" />
              Tìm kiếm Câu hỏi ({filteredQuestionsList.length} kết quả)
            </h3>
          </div>
          
          <div className="space-y-3">
            {filteredQuestionsList.slice(0, 100).map((item, idx) => (
              <div 
                key={`${item.question.id}-${idx}`}
                className="bg-white border border-[#DED5B8] p-4 rounded-2xl hover:border-[#B9CDA0] hover:shadow-md transition-all cursor-pointer"
                onClick={() => onOpenQuickManager(item.bank.id)}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <span className="inline-block px-2 py-0.5 bg-[#F8F3E5] text-[#74806B] text-[10px] font-bold rounded mb-2">
                      {item.question.type === 'mcq' ? 'Trắc nghiệm' : item.question.type === 'tf' ? 'Đúng/Sai' : 'Tự luận'}
                    </span>
                    <p className="text-sm font-[700] text-[#35452E] leading-relaxed line-clamp-3">
                      {item.question.content}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#DED5B8]/40">
                  <span className="text-[11px] font-[700] text-[#4F683C] bg-[#E9F0D9] px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <Folder className="w-3 h-3" /> 
                    {item.bank.name}
                  </span>
                  
                  {item.bank.subject && (
                    <span className="text-[11px] font-[700] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {item.bank.subject} {item.bank.grade}
                    </span>
                  )}
                  
                  {item.bank.topic && (
                    <span className="text-[11px] font-[700] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                      Chủ đề: {item.bank.topic}
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {filteredQuestionsList.length > 100 && (
              <div className="text-center py-4 text-xs font-[700] text-[#74806B]">
                Hiển thị 100 kết quả đầu tiên. Vui lòng sử dụng bộ lọc hoặc từ khóa chi tiết hơn.
              </div>
            )}
            
            {filteredQuestionsList.length === 0 && (
              <div className="py-12 text-center text-[#74806B] font-medium border-2 border-dashed border-[#DED5B8] rounded-[24px] bg-[#FFFDF5]">
                <p className="text-base font-[700] text-[#35452E]">Không tìm thấy câu hỏi nào.</p>
                <p className="text-xs mt-1">Hãy thử tìm theo từ khóa nội dung câu hỏi, chủ đề, hoặc tên bài học.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: CREATE/EDIT BANK, CREATE FOLDER, MOVE TO FOLDER                   */}
      {/* ========================================================================= */}

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
              folder: newBankData.folder || undefined,
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

      {/* Create Folder Modal */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#35452E]/40 backdrop-blur-xs">
          <div className="bg-[#FFFDF5] border border-[#DED5B8] rounded-[24px] p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-[900] text-[#35452E] flex items-center gap-2 mb-2">
              <FolderPlus className="w-5 h-5 text-[#6F8F55]" />
              Tạo Thư Mục Lưu Trữ Mới
            </h3>
            <p className="text-xs text-[#74806B] font-[600] mb-4">
              Thư mục giúp bạn gom nhóm các bộ đề thi (VD: "Đề kiểm tra 15 phút", "Đề thi Giữa Kì 1", "Chuyên đề Vật lí").
            </p>
            <input
              type="text"
              placeholder="Tên thư mục mới..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-[#DED5B8] rounded-[16px] text-sm font-[600] text-[#35452E] focus:outline-none focus:border-[#6F8F55] mb-5"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsFolderModalOpen(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-[700] text-[#74806B] hover:bg-[#E9F0D9]"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newFolderName.trim()) {
                    safeAlert('Vui lòng nhập tên thư mục!');
                    return;
                  }
                  // Set active folder filter to the new folder
                  setFolderFilter(newFolderName.trim());
                  setIsFolderModalOpen(false);
                  setNewFolderName('');
                  safeAlert(`Đã tạo thư mục "${newFolderName.trim()}"! Bạn có thể chuyển các bộ đề vào thư mục này ngay.`);
                }}
                className="px-5 py-2 rounded-xl text-xs font-[800] bg-[#6F8F55] hover:bg-[#5F7E4B] text-white shadow-xs"
              >
                Tạo Thư Mục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move to Folder Modal */}
      {bankToMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#35452E]/40 backdrop-blur-xs">
          <div className="bg-[#FFFDF5] border border-[#DED5B8] rounded-[24px] p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-[900] text-[#35452E] flex items-center gap-2 mb-2">
              <Folder className="w-5 h-5 text-[#6F8F55]" />
              Chuyển Bộ Đề Vào Thư Mục
            </h3>
            <p className="text-xs text-[#74806B] font-[600] mb-4">
              Chọn thư mục cho bộ đề: <strong className="text-[#35452E]">"{bankToMove.name}"</strong>
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-[11px] font-[700] text-[#74806B] mb-1">Chọn từ danh sách thư mục:</label>
                <select
                  value={selectedTargetFolder}
                  onChange={(e) => setSelectedTargetFolder(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DED5B8] rounded-[16px] text-xs sm:text-sm font-[600] text-[#35452E] focus:outline-none focus:border-[#6F8F55]"
                >
                  <option value="">(Không có thư mục / Thư mục chung)</option>
                  {availableFolders.map(f => (
                    <option key={f} value={f}>📁 {f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-[700] text-[#74806B] mb-1">Hoặc nhập tên thư mục mới:</label>
                <input
                  type="text"
                  placeholder="Nhập tên thư mục mới..."
                  value={selectedTargetFolder}
                  onChange={(e) => setSelectedTargetFolder(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DED5B8] rounded-[16px] text-xs sm:text-sm font-[600] text-[#35452E] focus:outline-none focus:border-[#6F8F55]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setBankToMove(null);
                  setSelectedTargetFolder('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-[700] text-[#74806B] hover:bg-[#E9F0D9]"
              >
                Hủy
              </button>
              <button
                onClick={() => handleMoveToFolder(selectedTargetFolder)}
                className="px-5 py-2 rounded-xl text-xs font-[800] bg-[#6F8F55] hover:bg-[#5F7E4B] text-white shadow-xs"
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
// SUB-COMPONENT: BANK CARD ITEM
// =============================================================================
interface BankCardItemProps {
  bank: QuestionBank;
  activeTab: TabType;
  onOpenQuickManager: (bankId: string) => void;
  onToggleFavorite: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onMoveFolder: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onPermanentDelete: () => void;
}

const BankCardItem: React.FC<BankCardItemProps> = ({
  bank,
  activeTab,
  onOpenQuickManager,
  onToggleFavorite,
  onEdit,
  onDuplicate,
  onMoveFolder,
  onDelete,
  onRestore,
  onPermanentDelete,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const questionsCount = bank.questions?.length || 0;
  const mcqCount = (bank.questions || []).filter(q => q.type === 'mcq').length;
  const tfCount = (bank.questions || []).filter(q => q.type === 'tf').length;
  const textCount = (bank.questions || []).filter(q => q.type === 'text').length;

  return (
    <div className="bg-[#FFFDF5] border border-[#DED5B8] rounded-[22px] p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative group hover:border-[#B9CDA0]">
      <div>
        {/* Top Badges & Favorite */}
        <div className="flex justify-between items-start mb-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {bank.isPreset ? (
              <span className="text-[10px] font-[800] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                ⭐ SGK Chuẩn
              </span>
            ) : (
              <span className={`text-[10px] font-[800] px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
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
            className="text-[#DED5B8] hover:text-amber-400 transition-colors p-1"
          >
            <Star className={`w-4 h-4 ${bank.favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
        </div>

        {/* Title */}
        <h4 
          onClick={() => onOpenQuickManager(bank.id)}
          className="font-[800] text-[#35452E] text-base leading-snug mb-1.5 line-clamp-2 hover:text-[#4F683C] cursor-pointer"
        >
          {bank.name}
        </h4>

        {/* Meta Info */}
        <div className="space-y-1 text-xs font-[600] text-[#74806B] mb-3">
          <p className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#6F8F55]" />
            <span>{bank.subject} • {bank.grade}</span>
          </p>
          {bank.topic && (
            <p className="flex items-center gap-1.5 line-clamp-1 text-[11px]">
              <Tag className="w-3 h-3 text-[#6F8F55] shrink-0" />
              <span>{bank.topic}</span>
            </p>
          )}
        </div>

        {/* Question Type Breakdown Pills */}
        <div className="flex flex-wrap items-center gap-1.5 py-2 px-2.5 bg-[#F8F3E5] rounded-xl border border-[#DED5B8]/60 text-[11px] font-[700] text-[#4F683C] mb-3">
          <span className="font-[800] text-[#35452E] flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> {questionsCount} câu hỏi:
          </span>
          {mcqCount > 0 && <span className="text-[10px] px-1.5 py-0.2 bg-white rounded-md border border-[#DED5B8]">{mcqCount} trắc nghiệm</span>}
          {tfCount > 0 && <span className="text-[10px] px-1.5 py-0.2 bg-white rounded-md border border-[#DED5B8]">{tfCount} đúng/sai</span>}
          {textCount > 0 && <span className="text-[10px] px-1.5 py-0.2 bg-white rounded-md border border-[#DED5B8]">{textCount} tự luận</span>}
          {questionsCount === 0 && <span className="text-amber-700 italic text-[10px]">Chưa có câu hỏi</span>}
        </div>
      </div>

      {/* Card Footer & Actions */}
      <div className="pt-3 border-t border-[#DED5B8]/60 flex items-center justify-between">
        <span className="text-[10px] text-[#74806B] font-[600]">
          {new Date(bank.updatedAt || bank.createdAt).toLocaleDateString('vi-VN')}
        </span>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => onOpenQuickManager(bank.id)}
            className="px-3.5 py-1.5 bg-[#4F683C] hover:bg-[#3D522B] text-white font-[800] text-xs rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Mở Soạn
          </button>

          {/* More Actions Dropdown */}
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen(!dropdownOpen);
              }}
              className="p-1.5 text-[#74806B] hover:bg-[#E9F0D9] rounded-lg transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 bottom-full mb-1 w-44 bg-[#FFFDF5] border border-[#DED5B8] rounded-[16px] shadow-[0_8px_24px_rgba(79,104,60,0.15)] z-50 overflow-hidden py-1">
                  {activeTab !== 'trash' ? (
                    <>
                      <button
                        onClick={() => {
                          onEdit();
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-[700] text-[#35452E] hover:bg-[#E9F0D9] flex items-center gap-2"
                      >
                        <FileText className="w-3.5 h-3.5" /> Sửa thông tin bộ
                      </button>

                      <button
                        onClick={() => {
                          onMoveFolder();
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-[700] text-[#35452E] hover:bg-[#E9F0D9] flex items-center gap-2"
                      >
                        <Folder className="w-3.5 h-3.5 text-[#6F8F55]" /> Chuyển thư mục
                      </button>

                      <button
                        onClick={() => {
                          onDuplicate();
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-[700] text-[#35452E] hover:bg-[#E9F0D9] flex items-center gap-2"
                      >
                        <Copy className="w-3.5 h-3.5 text-[#6F8F55]" /> Nhân bản bộ đề
                      </button>

                      <div className="h-px bg-[#DED5B8]/60 my-1"></div>

                      <button
                        onClick={() => {
                          onDelete();
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-[700] text-[#8C3A50] hover:bg-[#FCE8EE] flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Đưa vào thùng rác
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          onRestore();
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-[700] text-[#35452E] hover:bg-[#E9F0D9] flex items-center gap-2"
                      >
                        <History className="w-3.5 h-3.5 text-[#6F8F55]" /> Khôi phục
                      </button>
                      <button
                        onClick={() => {
                          onPermanentDelete();
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-[700] text-[#8C3A50] hover:bg-[#FCE8EE] flex items-center gap-2"
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
