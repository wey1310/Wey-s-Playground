import { safeAlert } from "../utils/safeAlert";
import React, { useState, useMemo } from 'react';
import { X, BookOpen } from 'lucide-react';
import type { QuestionBank } from "../types";
import { GRADES, getSubjectsForGrade, getLessonsForSubjectAndGrade } from '../data/curriculumData';

interface CreateBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bank: Partial<QuestionBank>) => void;
  initialData?: QuestionBank;
  availableFolders?: string[];
}

export const CreateBankModal: React.FC<CreateBankModalProps> = ({ isOpen, onClose, onSave, initialData, availableFolders = [] }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [grade, setGrade] = useState(initialData?.grade || 'Lớp 7');
  const [subject, setSubject] = useState(initialData?.subject || 'Khoa học tự nhiên');
  const [topic, setTopic] = useState(initialData?.topic || '');
  const [folder, setFolder] = useState(initialData?.folder || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || '');
  const [visibility, setVisibility] = useState<'private' | 'public'>(initialData?.visibility || 'private');

  React.useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setGrade(initialData?.grade || 'Lớp 7');
      setSubject(initialData?.subject || 'Khoa học tự nhiên');
      setTopic(initialData?.topic || '');
      setFolder(initialData?.folder || '');
      setDescription(initialData?.description || '');
      setTags(initialData?.tags?.join(', ') || '');
      setVisibility(initialData?.visibility || 'private');
    }
  }, [isOpen, initialData]);

  const availableSubjects = useMemo(() => {
    return getSubjectsForGrade(grade);
  }, [grade]);

  const suggestedLessons = useMemo(() => {
    return getLessonsForSubjectAndGrade(grade, subject);
  }, [grade, subject]);

  if (!isOpen) return null;

  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade);
    const newSubjects = getSubjectsForGrade(newGrade);
    if (!newSubjects.includes(subject)) {
      setSubject(newSubjects[0] || 'Toán');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-w-text-main/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-w-bg-card w-full max-w-lg rounded-[24px] shadow-[0_16px_40px_rgba(79,104,60,0.18)] border border-w-border flex flex-col max-h-[92vh] overflow-hidden my-auto wey-paper-card">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-w-border bg-w-bg-main shrink-0">
          <h2 className="text-lg font-[800] text-w-text-main">
            {initialData ? 'Chỉnh Sửa Bộ Câu Hỏi' : 'Tạo Bộ Câu Hỏi Mới'}
          </h2>
          <button onClick={onClose} className="p-2 text-w-text-muted hover:bg-w-accent-light rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="block text-xs font-[700] text-w-text-muted mb-1.5">Tên bộ câu hỏi *</label>
            <input 
              required
              value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-w-input-bg border border-w-input-border rounded-[16px] px-4 py-2.5 text-sm font-[600] text-w-text-main focus:outline-none focus:border-w-primary focus:ring-2 focus:ring-w-primary/20 shadow-xs"
              placeholder="VD: Ôn tập Toán giữa kì 1..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-[700] text-w-text-muted mb-1.5">Khối / Lớp (1-12) *</label>
              <select 
                required
                value={grade} onChange={e => handleGradeChange(e.target.value)}
                className="w-full bg-w-input-bg border border-w-input-border rounded-[16px] px-4 py-2.5 text-sm font-[600] text-w-text-main focus:outline-none focus:border-w-primary cursor-pointer shadow-xs"
              >
                {GRADES.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-[700] text-w-text-muted mb-1.5">Môn học (GDPT 2018) *</label>
              <select 
                required
                value={subject} onChange={e => setSubject(e.target.value)}
                className="w-full bg-w-input-bg border border-w-input-border rounded-[16px] px-4 py-2.5 text-sm font-[600] text-w-text-main focus:outline-none focus:border-w-primary cursor-pointer shadow-xs"
              >
                {availableSubjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-[700] text-w-text-muted mb-1.5">
              Chủ đề / Bài học (SGK Kết nối tri thức)
            </label>
            <input 
              list="bank-create-lessons"
              value={topic} onChange={e => setTopic(e.target.value)}
              className="w-full bg-w-input-bg border border-w-input-border rounded-[16px] px-4 py-2.5 text-sm font-[600] text-w-text-main focus:outline-none focus:border-w-primary shadow-xs"
              placeholder="Chọn bài học gợi ý hoặc nhập tự do..."
            />
            <datalist id="bank-create-lessons">
              {suggestedLessons.map((l, i) => (
                <option key={i} value={l} />
              ))}
            </datalist>
          </div>

          {/* Suggested lesson chips */}
          {suggestedLessons.length > 0 && (
            <div>
              <span className="text-[11px] font-[700] text-w-text-muted flex items-center gap-1 mb-1">
                <BookOpen className="w-3.5 h-3.5 text-w-primary" /> Gợi ý bài học SGK:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-w-bg-alt/50 rounded-[12px] border border-w-border/60">
                {suggestedLessons.slice(0, 6).map((les, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTopic(les);
                      if (!name) setName(`${subject} - ${les}`);
                    }}
                    className={`text-[11px] px-2 py-0.5 rounded-[8px] border transition cursor-pointer font-[600] ${
                      topic === les ? 'bg-w-primary text-white border-w-primary' : 'bg-w-bg-card text-w-text-main border-w-border hover:bg-w-accent-light'
                    }`}
                  >
                    {les}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-[700] text-w-text-muted mb-1.5">
              📁 Thư mục / Kho lưu trữ (Tùy chọn)
            </label>
            <input 
              list="bank-create-folders"
              value={folder} onChange={e => setFolder(e.target.value)}
              className="w-full bg-w-input-bg border border-w-input-border rounded-[16px] px-4 py-2.5 text-sm font-[600] text-w-text-main focus:outline-none focus:border-w-primary shadow-xs"
              placeholder="VD: Đề thi Giữa Kì 1, Kho chuyên đề, Đề 15 phút..."
            />
            <datalist id="bank-create-folders">
              {availableFolders.map((f, i) => (
                <option key={i} value={f} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-[700] text-w-text-muted mb-1.5">Mô tả bộ câu hỏi</label>
            <textarea 
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Ghi chú thêm về bộ câu hỏi, lưu ý khi giảng dạy..."
              className="w-full bg-w-input-bg border border-w-input-border rounded-[16px] px-4 py-2.5 text-sm font-[600] text-w-text-main focus:outline-none focus:border-w-primary min-h-[70px] shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-[700] text-w-text-muted mb-1.5">Tags (cách nhau bởi dấu phẩy)</label>
            <input 
              value={tags} onChange={e => setTags(e.target.value)}
              className="w-full bg-w-input-bg border border-w-input-border rounded-[16px] px-4 py-2.5 text-sm font-[600] text-w-text-main focus:outline-none focus:border-w-primary shadow-xs"
              placeholder="VD: ôn thi, giữa kì 1, nâng cao, học kì 2"
            />
          </div>

          <div>
            <label className="block text-xs font-[700] text-w-text-muted mb-2">Quyền chia sẻ</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="visibility" 
                  value="private" 
                  checked={visibility === 'private'} 
                  onChange={() => setVisibility('private')} 
                  className="w-4 h-4 text-w-primary focus:ring-w-primary"
                />
                <span className="text-sm font-[600] text-w-text-main">🔒 Riêng tư</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="visibility" 
                  value="public" 
                  checked={visibility === 'public'} 
                  onChange={() => setVisibility('public')} 
                  className="w-4 h-4 text-w-primary focus:ring-w-primary"
                />
                <span className="text-sm font-[600] text-w-text-main">🌎 Công khai cho mọi giáo viên</span>
              </label>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 border-t border-w-border flex justify-end gap-3 bg-w-bg-main/70 shrink-0">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-[14px] text-w-text-muted font-[700] text-sm hover:bg-w-accent-light transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button 
            onClick={() => {
              if(!name.trim() || !subject.trim() || !grade.trim()) return safeAlert('Vui lòng điền đủ Tên, Môn học và Khối lớp!');
              onSave({
                name: name.trim(), 
                subject: subject.trim(), 
                grade: grade.trim(), 
                topic: topic.trim(), 
                folder: folder.trim() || undefined,
                description: description.trim(),
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                visibility
              });
            }}
            className="px-5 py-2.5 rounded-[14px] wey-btn-primary font-[700] text-sm shadow-md transition-colors cursor-pointer"
          >
            {initialData ? 'Lưu Thay Đổi' : 'Tạo Bộ Mới'}
          </button>
        </div>
      </div>
    </div>
  );
};
