import { safeAlert } from "../utils/safeAlert";
import React, { useState, useMemo, useEffect } from 'react';
import { X, BookOpen, Tag, Star, Globe, Lock, Folder, FolderPlus, Plus, Check, User } from 'lucide-react';
import type { QuestionBank } from "../types";
import { GRADES, getSubjectsForGrade, getLessonsForSubjectAndGrade, normalizeGrade } from '../data/curriculumData';
import { useAuth } from '../contexts/AuthContext';

interface CreateBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bank: Partial<QuestionBank>) => void;
  initialData?: QuestionBank | null;
  availableFolders?: string[];
}

/**
 * Robust parser for tags supporting Array, comma-separated string, JSON string, or legacy format
 */
export function parseBankTags(tagsRaw: any): string[] {
  if (!tagsRaw) return [];
  let rawList: any[] = [];

  if (Array.isArray(tagsRaw)) {
    rawList = tagsRaw;
  } else if (typeof tagsRaw === 'string') {
    const trimmed = tagsRaw.trim();
    if (!trimmed) return [];
    // Check if JSON array string e.g. '["Toán 7", "Hình học"]'
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          rawList = parsed;
        } else {
          rawList = [trimmed];
        }
      } catch (e) {
        rawList = [trimmed];
      }
    } else {
      rawList = trimmed.split(/[,;\n]+/);
    }
  } else if (typeof tagsRaw === 'object') {
    rawList = Object.values(tagsRaw);
  }

  const result: string[] = [];
  rawList.forEach(item => {
    if (item === null || item === undefined) return;
    const str = String(item).trim();
    if (!str) return;
    // If the string contains inner comma or semicolon, split further
    if (str.includes(',') || str.includes(';')) {
      str.split(/[,;]+/).forEach(sub => {
        const cleaned = sub.trim().replace(/^["'\[\]]+|["'\[\]]+$/g, '');
        if (cleaned && !result.some(r => r.toLowerCase() === cleaned.toLowerCase())) {
          result.push(cleaned);
        }
      });
    } else {
      const cleaned = str.replace(/^["'\[\]]+|["'\[\]]+$/g, '');
      if (cleaned && !result.some(r => r.toLowerCase() === cleaned.toLowerCase())) {
        result.push(cleaned);
      }
    }
  });

  return result;
}

const POPULAR_TAGS = [
  'Ôn tập',
  'Giữa kì 1',
  'Cuối kì 1',
  'Giữa kì 2',
  'Cuối kì 2',
  'Kiểm tra 15 phút',
  'Trắc nghiệm',
  'Nâng cao',
  'Cơ bản',
  'Học sinh giỏi'
];

export const CreateBankModal: React.FC<CreateBankModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  availableFolders = []
}) => {
  const { user, isAdmin } = useAuth();

  // Pre-calculated default values from initialData
  const initialGrade = normalizeGrade(initialData?.grade) || 'Lớp 7';
  const initialSubject = initialData?.subject?.trim() || 'Khoa học tự nhiên';
  const initialFolder = initialData?.folder ? initialData.folder.trim() : '';

  // Form State initialized directly from initialData
  const [name, setName] = useState<string>(() => initialData?.name || '');
  const [grade, setGrade] = useState<string>(() => initialGrade);
  const [subject, setSubject] = useState<string>(() => initialSubject);
  const [topic, setTopic] = useState<string>(() => initialData?.topic || '');
  const [folderSelection, setFolderSelection] = useState<string>(() => initialFolder);
  const [customFolder, setCustomFolder] = useState<string>('');
  const [description, setDescription] = useState<string>(() => initialData?.description || '');
  const [creatorNameInput, setCreatorNameInput] = useState<string>(() => 
    initialData?.creatorName || (isAdmin ? 'Admin' : (user?.displayName || user?.email?.split('@')[0] || 'Giáo viên'))
  );
  const [tagList, setTagList] = useState<string[]>(() => parseBankTags(initialData?.tags));
  const [newTagInput, setNewTagInput] = useState<string>('');
  
  // Checkboxes
  const [favorite, setFavorite] = useState<boolean>(() => 
    Boolean(initialData?.favorite === true || (initialData?.favorite as any) === 'true' || (initialData?.favorite as any) === 1)
  );
  const [isPublic, setIsPublic] = useState<boolean>(() => 
    initialData?.visibility === 'public' || (initialData as any)?.isPublic === true
  );
  const [isPreset, setIsPreset] = useState<boolean>(() => 
    Boolean(initialData?.isPreset === true || (initialData as any)?.isPreset === 'true')
  );
  const [updateTimestamp, setUpdateTimestamp] = useState<boolean>(true);

  // Track the last loaded bank ID to avoid resetting user edits on unrelated parent re-renders
  const lastLoadedBankIdRef = React.useRef<string | null>(null);

  // Sync and pre-fill when opening modal or when initialData changes
  useEffect(() => {
    if (!isOpen) {
      lastLoadedBankIdRef.current = null;
      return;
    }

    const currentBankId = initialData?.id || '__new__';
    if (lastLoadedBankIdRef.current === currentBankId) {
      return;
    }
    lastLoadedBankIdRef.current = currentBankId;

    const parsedGrade = normalizeGrade(initialData?.grade) || 'Lớp 7';
    const parsedSubject = initialData?.subject?.trim() || 'Khoa học tự nhiên';
    const parsedTags = parseBankTags(initialData?.tags);
    const existingFolder = initialData?.folder ? initialData.folder.trim() : '';

    setName(initialData?.name || '');
    setGrade(parsedGrade);
    setSubject(parsedSubject);
    setTopic(initialData?.topic || '');
    setDescription(initialData?.description || '');
    setCreatorNameInput(initialData?.creatorName || (isAdmin ? 'Admin' : (user?.displayName || user?.email?.split('@')[0] || 'Giáo viên')));
    setTagList(parsedTags);
    setNewTagInput('');

    // Folder dropdown pre-fill logic
    if (existingFolder) {
      setFolderSelection(existingFolder);
      setCustomFolder('');
    } else {
      setFolderSelection('');
      setCustomFolder('');
    }

    // Checkboxes pre-fill
    setFavorite(Boolean(initialData?.favorite === true || (initialData?.favorite as any) === 'true' || (initialData?.favorite as any) === 1));
    setIsPublic(initialData?.visibility === 'public' || (initialData as any)?.isPublic === true);
    setIsPreset(Boolean(initialData?.isPreset === true || (initialData as any)?.isPreset === 'true'));
    setUpdateTimestamp(true);
  }, [isOpen, initialData]);

  // Dynamic Grade Options
  const allGrades = useMemo(() => {
    const defaultGrades = [...GRADES];
    const targetGrade = grade || (initialData?.grade ? normalizeGrade(initialData.grade) : '');
    if (targetGrade && !defaultGrades.includes(targetGrade as any)) {
      return [targetGrade, ...defaultGrades];
    }
    return defaultGrades;
  }, [grade, initialData?.grade]);

  // Dynamic Subject Options for current Grade
  const availableSubjects = useMemo(() => {
    const list = getSubjectsForGrade(grade);
    const set = new Set<string>(list);
    if (subject && subject.trim()) {
      set.add(subject.trim());
    }
    if (initialData?.subject && initialData.subject.trim()) {
      set.add(initialData.subject.trim());
    }
    return Array.from(set);
  }, [grade, subject, initialData?.subject]);

  // Combined Folder Options ensuring the bank's existing folder is always selectable
  const allFolderOptions = useMemo(() => {
    const set = new Set<string>();
    (availableFolders || []).forEach(f => {
      if (f && f.trim()) set.add(f.trim());
    });
    if (initialData?.folder && initialData.folder.trim()) {
      set.add(initialData.folder.trim());
    }
    return Array.from(set);
  }, [availableFolders, initialData?.folder]);

  // Dynamic SGK lesson suggestions
  const suggestedLessons = useMemo(() => {
    return getLessonsForSubjectAndGrade(grade, subject);
  }, [grade, subject]);

  if (!isOpen) return null;

  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade);
    const newSubjects = getSubjectsForGrade(newGrade);
    // If current subject is still valid, retain it; otherwise default to first available
    if (!newSubjects.some(s => s.toLowerCase() === subject.toLowerCase())) {
      setSubject(newSubjects[0] || 'Toán');
    }
  };

  // Tag Handlers
  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim().replace(/^["']|["']$/g, '');
    if (!trimmed) return;
    if (!tagList.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      setTagList(prev => [...prev, trimmed]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTagList(prev => prev.filter(t => t.toLowerCase() !== tagToRemove.toLowerCase()));
  };

  const handleToggleTagCheckbox = (tag: string, checked: boolean) => {
    if (checked) {
      handleAddTag(tag);
    } else {
      handleRemoveTag(tag);
    }
  };

  const handleKeyDownTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(newTagInput);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      return safeAlert('⚠️ Vui lòng nhập Tên bộ câu hỏi!');
    }
    if (!subject.trim()) {
      return safeAlert('⚠️ Vui lòng chọn Môn học!');
    }
    if (!grade.trim()) {
      return safeAlert('⚠️ Vui lòng chọn Khối / Lớp!');
    }

    // Resolve folder from dropdown or custom input
    let resolvedFolder: string | undefined = undefined;
    if (folderSelection === '__custom__') {
      resolvedFolder = customFolder.trim() || undefined;
    } else if (folderSelection.trim()) {
      resolvedFolder = folderSelection.trim();
    }

    // Also include any tag currently being typed if not empty
    let finalTags = [...tagList];
    if (newTagInput.trim()) {
      const extraTags = parseBankTags(newTagInput);
      extraTags.forEach(t => {
        if (!finalTags.some(existing => existing.toLowerCase() === t.toLowerCase())) {
          finalTags.push(t);
        }
      });
    }

    const resolvedCreatorName = creatorNameInput.trim() || (initialData?.creatorName || (isAdmin ? 'Admin' : (user?.displayName || user?.email?.split('@')[0] || 'Giáo viên')));

    onSave({
      name: name.trim(),
      subject: subject.trim(),
      grade: grade.trim(),
      topic: topic.trim() || 'Luyện tập',
      folder: resolvedFolder,
      description: description.trim(),
      tags: finalTags,
      visibility: isPublic ? 'public' : 'private',
      favorite: favorite,
      isPreset: isPreset,
      creatorName: resolvedCreatorName,
      ownerId: initialData?.ownerId || user?.uid || (isAdmin ? 'admin_system' : 'guest'),
      userId: initialData?.userId || user?.uid || (isAdmin ? 'admin_system' : 'guest'),
      userEmail: initialData?.userEmail || user?.email,
      ...(updateTimestamp ? { updatedAt: new Date().toISOString() } : {}),
    });
  };

  const currentCreatorName = creatorNameInput.trim() || initialData?.creatorName || (isAdmin ? 'Admin' : (user?.displayName || 'Giáo viên'));

  return (
    <div 
      id="create-bank-modal-overlay"
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-w-text-main/40 backdrop-blur-sm overflow-y-auto"
    >
      <div 
        id="create-bank-modal-container"
        className="bg-w-bg-card w-full max-w-xl rounded-[24px] shadow-[0_16px_40px_rgba(79,104,60,0.18)] border border-w-border flex flex-col max-h-[92vh] overflow-hidden my-auto wey-paper-card animate-scale-up"
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-w-border bg-w-bg-main shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-w-accent-light text-w-primary font-bold">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-[800] text-w-text-main">
                  {initialData ? 'Chỉnh Sửa Thông Tin Bộ Câu Hỏi' : 'Tạo Bộ Câu Hỏi Mới'}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                  currentCreatorName === 'Admin' || isAdmin
                    ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                    : 'bg-indigo-500/15 text-indigo-600 border-indigo-500/30'
                }`}>
                  👤 Người tạo: {currentCreatorName}
                </span>
              </div>
              <p className="text-xs text-w-text-muted">
                {initialData ? `Mã bộ đề: ${initialData.id}` : 'Điền thông tin giáo án và cấu hình bộ đề'}
              </p>
            </div>
          </div>
          <button 
            id="create-bank-modal-close-btn"
            onClick={onClose} 
            className="p-2 text-w-text-muted hover:bg-w-accent-light rounded-full transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4.5 flex-1 text-left">
          {/* TÊN BỘ CÂU HỎI */}
          <div>
            <label className="block text-xs font-[700] text-w-text-muted mb-1.5">
              Tên bộ câu hỏi <span className="text-rose-500">*</span>
            </label>
            <input 
              id="bank-name-input"
              required
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full bg-w-input-bg border border-w-input-border rounded-[16px] px-4 py-2.5 text-sm font-[600] text-w-text-main focus:outline-none focus:border-w-primary focus:ring-2 focus:ring-w-primary/20 shadow-xs"
              placeholder="VD: KHTN 7 - Chương IV: Âm thanh (Bài 12, 13, 14)..."
            />
          </div>

          {/* DROPDOWNS: KHỐI LỚP & MÔN HỌC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-[700] text-w-text-muted mb-1.5">
                Khối / Lớp (1-12) <span className="text-rose-500">*</span>
              </label>
              <select 
                id="bank-grade-select"
                required
                value={grade} 
                onChange={e => handleGradeChange(e.target.value)}
                className="w-full bg-w-input-bg border border-w-input-border rounded-[16px] px-3.5 py-2.5 text-sm font-[600] text-w-text-main focus:outline-none focus:border-w-primary cursor-pointer shadow-xs"
              >
                {allGrades.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-[700] text-w-text-muted mb-1.5">
                Môn học (CT GDPT 2018) <span className="text-rose-500">*</span>
              </label>
              <select 
                id="bank-subject-select"
                required
                value={subject} 
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-w-input-bg border border-w-input-border rounded-[16px] px-3.5 py-2.5 text-sm font-[600] text-w-text-main focus:outline-none focus:border-w-primary cursor-pointer shadow-xs"
              >
                {availableSubjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* CHỦ ĐỀ / BÀI HỌC SGK */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-[700] text-w-text-muted">
                Chủ đề / Bài học (SGK Kết nối tri thức)
              </label>
              {suggestedLessons.length > 0 && (
                <span className="text-[11px] text-w-primary font-bold">
                  {suggestedLessons.length} bài học gợi ý
                </span>
              )}
            </div>
            <input 
              id="bank-topic-input"
              list="bank-create-lessons"
              value={topic} 
              onChange={e => setTopic(e.target.value)}
              className="w-full bg-w-input-bg border border-w-input-border rounded-[16px] px-4 py-2.5 text-sm font-[600] text-w-text-main focus:outline-none focus:border-w-primary shadow-xs"
              placeholder="Chọn bài học từ danh sách hoặc nhập tự do..."
            />
            <datalist id="bank-create-lessons">
              {suggestedLessons.map((l, i) => (
                <option key={i} value={l} />
              ))}
            </datalist>

            {/* Quick-select lesson chip buttons */}
            {suggestedLessons.length > 0 && (
              <div className="mt-2 p-2 bg-w-bg-alt/50 rounded-[14px] border border-w-border/60">
                <span className="text-[11px] font-[700] text-w-text-muted flex items-center gap-1 mb-1.5">
                  <BookOpen className="w-3 h-3 text-w-primary" /> Chọn nhanh bài học SGK chuẩn:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {suggestedLessons.slice(0, 8).map((les, idx) => {
                    const isSelected = topic === les;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTopic(les);
                          if (!name) setName(`${subject} ${grade} - ${les}`);
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-[10px] border transition cursor-pointer font-[600] text-left ${
                          isSelected 
                            ? 'bg-w-primary text-white border-w-primary shadow-xs' 
                            : 'bg-w-bg-card text-w-text-main border-w-border hover:bg-w-accent-light'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                        {les}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* DROPDOWN: THƯ MỤC / KHO LƯU TRỮ */}
          <div>
            <label className="block text-xs font-[700] text-w-text-muted mb-1.5">
              📁 Thư mục / Phân loại lưu trữ
            </label>
            <div className="space-y-2">
              <select
                id="bank-folder-dropdown"
                value={folderSelection}
                onChange={e => {
                  setFolderSelection(e.target.value);
                  if (e.target.value !== '__custom__') {
                    setCustomFolder('');
                  }
                }}
                className="w-full bg-w-input-bg border border-w-input-border rounded-[16px] px-3.5 py-2.5 text-sm font-[600] text-w-text-main focus:outline-none focus:border-w-primary cursor-pointer shadow-xs"
              >
                <option value="">(Thư mục gốc - Không phân loại)</option>
                {allFolderOptions.map(f => (
                  <option key={f} value={f}>📁 {f}</option>
                ))}
                <option value="__custom__">➕ Tạo thư mục mới / Nhập tùy chỉnh...</option>
              </select>

              {folderSelection === '__custom__' && (
                <div className="flex items-center gap-2 animate-fade-in">
                  <FolderPlus className="w-4 h-4 text-w-primary shrink-0" />
                  <input
                    id="bank-custom-folder-input"
                    type="text"
                    value={customFolder}
                    onChange={e => setCustomFolder(e.target.value)}
                    placeholder="Nhập tên thư mục mới (VD: Đề thi Giữa Kì 1, Kho chuyên đề...)"
                    className="flex-1 bg-w-input-bg border border-w-input-border rounded-[14px] px-3.5 py-2 text-xs sm:text-sm font-[600] text-w-text-main focus:outline-none focus:border-w-primary shadow-xs"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>

          {/* MÔ TẢ BỘ CÂU HỎI */}
          <div>
            <label className="block text-xs font-[700] text-w-text-muted mb-1.5">
              Mô tả / Hướng dẫn giảng dạy
            </label>
            <textarea 
              id="bank-description-textarea"
              value={description} 
              onChange={e => setDescription(e.target.value)}
              placeholder="Ghi chú thêm về nội dung bộ đề, thang điểm, lưu ý khi tổ chức trò chơi..."
              className="w-full bg-w-input-bg border border-w-input-border rounded-[16px] px-4 py-2.5 text-sm font-[600] text-w-text-main focus:outline-none focus:border-w-primary min-h-[68px] shadow-xs"
            />
          </div>

          {/* TÊN NGƯỜI TẠO BỘ ĐỀ (creatorName) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-[700] text-w-text-muted flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-w-primary" />
                Tên tác giả / Người tạo (creatorName)
              </label>
              <span className="text-[11px] text-w-text-muted">
                {isAdmin ? 'Mặc định: Admin' : 'Mặc định: Tên tài khoản của bạn'}
              </span>
            </div>
            <input 
              id="bank-creator-name-input"
              value={creatorNameInput} 
              onChange={e => setCreatorNameInput(e.target.value)}
              placeholder="VD: Admin, Thầy Nam, Cô Hương..."
              className="w-full bg-w-input-bg border border-w-input-border rounded-[16px] px-4 py-2.5 text-sm font-[600] text-w-text-main focus:outline-none focus:border-w-primary shadow-xs"
            />
          </div>

          {/* TAGS (THẺ TỪ KHÓA) + CHECKBOXES THẺ PHỔ BIẾN */}
          <div className="p-3.5 bg-w-bg-alt/40 rounded-[18px] border border-w-border space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-[700] text-w-text-muted flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-w-primary" /> Thẻ từ khóa (Tags):
              </label>
              <span className="text-[11px] text-w-text-muted">
                {tagList.length} thẻ đang chọn
              </span>
            </div>

            {/* Active Tag Badges */}
            {tagList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {tagList.map(t => (
                  <span 
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-w-primary/10 text-w-primary-dark border border-w-primary/20"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:bg-w-primary/20 rounded-full p-0.5 transition cursor-pointer"
                      title={`Xóa thẻ ${t}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Tag text input */}
            <div className="flex items-center gap-2">
              <input 
                id="bank-tag-input"
                value={newTagInput} 
                onChange={e => setNewTagInput(e.target.value)}
                onKeyDown={handleKeyDownTagInput}
                className="flex-1 bg-w-input-bg border border-w-input-border rounded-[14px] px-3.5 py-2 text-xs sm:text-sm font-[600] text-w-text-main focus:outline-none focus:border-w-primary shadow-xs"
                placeholder="Nhập thẻ rồi nhấn Enter hoặc dấu phẩy..."
              />
              <button
                type="button"
                onClick={() => handleAddTag(newTagInput)}
                disabled={!newTagInput.trim()}
                className="px-3 py-2 rounded-[14px] bg-w-accent-light text-w-primary-dark border border-w-accent-border font-bold text-xs hover:bg-w-primary hover:text-white transition disabled:opacity-40 cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm</span>
              </button>
            </div>

            {/* POPULAR TAG CHECKBOXES */}
            <div className="pt-2 border-t border-w-border/60">
              <span className="text-[11px] font-[700] text-w-text-muted block mb-1.5">
                ☑️ Checkbox chọn nhanh các thẻ phân loại phổ biến:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {POPULAR_TAGS.map(ptag => {
                  const isChecked = tagList.some(t => t.toLowerCase() === ptag.toLowerCase());
                  return (
                    <label 
                      key={ptag} 
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[10px] text-xs font-[600] border transition cursor-pointer select-none ${
                        isChecked 
                          ? 'bg-w-accent-light/80 border-w-primary text-w-primary-dark font-bold' 
                          : 'bg-w-bg-card border-w-border text-w-text-main hover:bg-w-bg-alt'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={e => handleToggleTagCheckbox(ptag, e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-w-primary accent-w-primary cursor-pointer"
                      />
                      <span className="truncate">{ptag}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CHECKBOXES & THUỘC TÍNH BỘ ĐỀ */}
          <div className="p-3.5 bg-w-bg-alt/40 rounded-[18px] border border-w-border space-y-3">
            <span className="text-xs font-[700] text-w-text-muted block">
              ⚙️ Cấu hình trạng thái & Quyền hạn bộ đề:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Checkbox: Favorite */}
              <label className="flex items-start gap-2.5 p-2 rounded-[12px] bg-w-bg-card border border-w-border hover:border-w-accent-border transition cursor-pointer select-none">
                <input 
                  id="bank-checkbox-favorite"
                  type="checkbox" 
                  checked={favorite}
                  onChange={e => setFavorite(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-amber-500 accent-amber-500 cursor-pointer shrink-0"
                />
                <div className="text-xs">
                  <span className="font-bold text-w-text-main flex items-center gap-1">
                    <Star className={`w-3.5 h-3.5 ${favorite ? 'fill-amber-400 text-amber-400' : 'text-amber-500'}`} />
                    Yêu thích
                  </span>
                  <p className="text-[11px] text-w-text-muted">Ghim bộ đề lên đầu danh sách</p>
                </div>
              </label>

              {/* Checkbox: Public / Visibility */}
              <label className="flex items-start gap-2.5 p-2 rounded-[12px] bg-w-bg-card border border-w-border hover:border-w-accent-border transition cursor-pointer select-none">
                <input 
                  id="bank-checkbox-public"
                  type="checkbox" 
                  checked={isPublic}
                  onChange={e => setIsPublic(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-w-primary accent-w-primary cursor-pointer shrink-0"
                />
                <div className="text-xs">
                  <span className="font-bold text-w-text-main flex items-center gap-1">
                    {isPublic ? <Globe className="w-3.5 h-3.5 text-blue-600" /> : <Lock className="w-3.5 h-3.5 text-amber-600" />}
                    {isPublic ? 'Công khai' : 'Riêng tư'}
                  </span>
                  <p className="text-[11px] text-w-text-muted">
                    {isPublic ? 'Mọi giáo viên đều xem được' : 'Chỉ mình tôi có quyền xem'}
                  </p>
                </div>
              </label>

              {/* Checkbox: SGK Preset */}
              <label className="flex items-start gap-2.5 p-2 rounded-[12px] bg-w-bg-card border border-w-border hover:border-w-accent-border transition cursor-pointer select-none">
                <input 
                  id="bank-checkbox-preset"
                  type="checkbox" 
                  checked={isPreset}
                  onChange={e => setIsPreset(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-emerald-600 accent-emerald-600 cursor-pointer shrink-0"
                />
                <div className="text-xs">
                  <span className="font-bold text-w-text-main flex items-center gap-1">
                    ⭐ Bộ đề chuẩn SGK
                  </span>
                  <p className="text-[11px] text-w-text-muted">Gắn huy hiệu chuẩn Kết nối tri thức</p>
                </div>
              </label>

              {/* Checkbox: Update Timestamp */}
              <label className="flex items-start gap-2.5 p-2 rounded-[12px] bg-w-bg-card border border-w-border hover:border-w-accent-border transition cursor-pointer select-none">
                <input 
                  id="bank-checkbox-timestamp"
                  type="checkbox" 
                  checked={updateTimestamp}
                  onChange={e => setUpdateTimestamp(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-w-primary accent-w-primary cursor-pointer shrink-0"
                />
                <div className="text-xs">
                  <span className="font-bold text-w-text-main flex items-center gap-1">
                    ⏰ Cập nhật thời gian
                  </span>
                  <p className="text-[11px] text-w-text-muted">Lưu mốc giờ sửa đổi mới nhất</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-w-border flex items-center justify-between gap-3 bg-w-bg-main/80 shrink-0">
          <button 
            id="create-bank-modal-cancel-btn"
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-[14px] text-w-text-muted font-[700] text-sm hover:bg-w-accent-light transition-colors cursor-pointer"
          >
            Hủy
          </button>
          
          <button 
            id="create-bank-modal-submit-btn"
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-[14px] wey-btn-primary font-[800] text-sm shadow-md transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{initialData ? 'Lưu Thay Đổi' : 'Tạo Bộ Mới'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
