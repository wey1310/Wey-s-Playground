import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  Loader2, 
  Code2, 
  ListOrdered, 
  CheckSquare, 
  Edit3, 
  Layers,
  Bot,
  ExternalLink
} from 'lucide-react';
import { safeAlert } from '../utils/safeAlert';
import { 
  parseQuestionFile, 
  parseTextToQuestionsWithDiagnostics, 
  type ParsingDiagnostics 
} from '../utils/fileParser';
import type { Question } from '../types';
import { fetchWithAuth } from '../utils/api';

interface ImportQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (questions: Question[]) => void;
  gemConverterUrl?: string;
}

const SAMPLE_TEMPLATES = {
  mcq: `Câu 1: Đơn vị đo cường độ dòng điện trong hệ SI là gì?
A. Vôn (V)
*B. Ampe (A)
C. Ôm (Ω)
D. Oát (W)
Đáp án: B
Giải thích: Ký hiệu của Ampe là A, đặt theo tên nhà vật lý André-Marie Ampère.

Câu 2: Số nguyên tố chẵn duy nhất là số nào?
A. 0
*B. 2
C. 4
D. 6
Đáp án: B`,

  json: `[
  {
    "type": "mcq",
    "content": "Hành tinh nào lớn nhất trong Hệ Mặt Trời?",
    "options": [
      "Sao Hỏa",
      "Sao Thổ",
      "Sao Mộc",
      "Sao Kim"
    ],
    "correct": 2,
    "explanation": "Sao Mộc là hành tinh lớn nhất trong Hệ Mặt Trời (index 2 = Sao Mộc)."
  },
  {
    "type": "tf",
    "content": "Ánh sáng truyền trong chân không với vận tốc xấp xỉ 300.000 km/s.",
    "correct": true,
    "explanation": "Vận tốc ánh sáng chính xác là 299.792.458 m/s."
  },
  {
    "type": "text",
    "content": "Công thức hóa học của muối ăn là gì?",
    "correct": "NaCl",
    "explanation": "Muối ăn là Natri Clorua (NaCl)."
  }
]`,

  all: `Câu 1: Hành tinh nào lớn nhất trong Hệ Mặt Trời?
A. Sao Hỏa
B. Sao Thổ
*C. Sao Mộc
D. Sao Kim
Đáp án: C
Giải thích: Sao Mộc có khối lượng gấp hơn 2,5 lần tổng khối lượng tất cả các hành tinh khác cộng lại.

Câu 2 [Đúng/Sai]: Ánh sáng truyền đi trong chân không với vận tốc xấp xỉ 300.000 km/s.
Đáp án: Đúng
Giải thích: Vận tốc chính xác là 299.792.458 m/s.

Câu 3 [Trả lời ngắn]: Công thức hóa học của muối ăn là gì?
Đáp án: NaCl
Lời giải: Muối ăn là Natri Clorua (NaCl).`,

  tf: `Câu 1: Khí Oxy chiếm khoảng 78% thể tích khí quyển Trái Đất.
Đáp án: Sai
Giải thích: Khí Nitơ chiếm khoảng 78%, khí Oxy chỉ chiếm khoảng 21%.

Câu 2: Mặt Trời là một ngôi sao nằm ở trung tâm của Hệ Mặt Trời.
Đáp án: Đúng
Giải thích: Mặt Trời là một ngôi sao kiểu quang phổ G2V.`,

  text: `Câu 1: Điền từ: Hình chữ nhật có hai đường chéo bằng nhau và cắt nhau tại ... của mỗi đường.
Đáp án: trung điểm
Lời giải: Tính chất cơ bản của hình chữ nhật.

Câu 2: Năm nào Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập?
Đáp án: 1945
Giải thích: Ngày 2 tháng 9 năm 1945 tại Quảng trường Ba Đình.`
};

type TemplateKey = keyof typeof SAMPLE_TEMPLATES;

export const ImportQuestionsModal: React.FC<ImportQuestionsModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  gemConverterUrl
}) => {
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawText, setRawText] = useState('');
  const [diagnostics, setDiagnostics] = useState<ParsingDiagnostics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFormatGuide, setShowFormatGuide] = useState(true);
  const [selectedGuideTab, setSelectedGuideTab] = useState<TemplateKey>('mcq');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Resolve gem converter URL from prop or fallback to localStorage config if available
  const effectiveGemUrl = gemConverterUrl || (() => {
    try {
      const saved = localStorage.getItem('wey_web_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.gemConverterUrl;
      }
    } catch (e) {}
    return undefined;
  })();

  const copyTemplateToClipboard = (type: TemplateKey) => {
    navigator.clipboard.writeText(SAMPLE_TEMPLATES[type]);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const insertSampleText = (type?: TemplateKey) => {
    const key = type || selectedGuideTab;
    setRawText(SAMPLE_TEMPLATES[key]);
    setDiagnostics(null);
    setError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setDiagnostics(null);

    try {
      const parseResult = await parseQuestionFile(file);
      const parsedQuestions = parseResult.questions || [];
      
      if (parseResult.diagnostics) {
        setDiagnostics(parseResult.diagnostics);
      }

      if (parsedQuestions.length === 0) {
        setError(parseResult.diagnostics?.message || 'Không tìm thấy câu hỏi hợp lệ trong file!');
      } else {
        safeAlert(`🎉 Đã trích xuất thành công ${parsedQuestions.length} câu hỏi từ file "${file.name}"!`);
        onImportSuccess(parsedQuestions);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Không thể xử lý file này');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTextImport = async () => {
    if (!rawText.trim()) {
      setError('Vui lòng nhập văn bản đề thi cần phân tích!');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setDiagnostics(null);

    try {
      // Dùng AI để phân tích trước
      let parsedQuestions: Question[] = [];
      try {
        const data = await fetchWithAuth('/api/parse-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawText })
        });
        
        if (data && data.diagnostics) {
          setDiagnostics(data.diagnostics);
        }

        if (data && data.success && Array.isArray(data.questions) && data.questions.length > 0) {
          parsedQuestions = data.questions;
        }
      } catch (aiErr) {
        console.warn("AI text parse failed, fallback to local:", aiErr);
      }

      if (parsedQuestions.length === 0) {
        // Fallback to local regex parser with detailed diagnostics
        const localResult = parseTextToQuestionsWithDiagnostics(rawText);
        setDiagnostics(localResult.diagnostics);
        parsedQuestions = localResult.questions;
      }

      if (parsedQuestions.length === 0) {
        setError(diagnostics?.message || 'Không tìm thấy câu hỏi hợp lệ trong văn bản!');
      } else {
        safeAlert(`🎉 Đã nạp thành công ${parsedQuestions.length} câu hỏi!`);
        onImportSuccess(parsedQuestions);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi phân tích văn bản');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="import-questions-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-w-bg-card border border-w-border rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-w-border bg-w-bg-alt shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-w-accent-light text-w-primary flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-w-text-main">Nạp Câu Hỏi Tự Động Với AI</h2>
                {effectiveGemUrl && (
                  <a
                    href={effectiveGemUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-xs transition hover:scale-105 cursor-pointer animate-pulse"
                    title="Mở Gem AI chuyển đổi câu hỏi thành định dạng chuẩn của Wey"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>🤖 Chuyển Đổi Format Bằng Gem AI</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <p className="text-xs text-w-text-muted">Hỗ trợ trắc nghiệm (MCQ A-D), JSON chuẩn, đúng/sai (TF) & trả lời ngắn</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {effectiveGemUrl && (
              <a
                href={effectiveGemUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold rounded-xl transition cursor-pointer"
                title="Mở công cụ Gem AI Converter đã cài đặt trong Admin"
              >
                <Bot className="w-4 h-4 text-purple-600" />
                <span>Mở Link Gem Converter</span>
                <ExternalLink className="w-3 h-3 text-purple-500" />
              </a>
            )}
            <button 
              id="close-import-modal-btn"
              onClick={onClose} 
              className="p-2 rounded-xl text-w-text-muted hover:bg-w-accent-light hover:text-w-text-main transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 shrink-0">
            <button
              id="mode-file-btn"
              onClick={() => {
                setMode('file');
                setError(null);
                setDiagnostics(null);
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl flex justify-center items-center gap-2 font-bold text-xs sm:text-sm transition cursor-pointer ${
                mode === 'file' ? 'bg-w-primary text-white shadow-md' : 'bg-w-bg-alt text-w-text-muted hover:bg-w-accent-light hover:text-w-text-main'
              }`}
            >
              <Upload className="w-4 h-4" /> Import Từ File (Word, TXT, JSON)
            </button>
            <button
              id="mode-text-btn"
              onClick={() => {
                setMode('text');
                setError(null);
                setDiagnostics(null);
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl flex justify-center items-center gap-2 font-bold text-xs sm:text-sm transition cursor-pointer ${
                mode === 'text' ? 'bg-w-primary text-white shadow-md' : 'bg-w-bg-alt text-w-text-muted hover:bg-w-accent-light hover:text-w-text-main'
              }`}
            >
              <FileText className="w-4 h-4" /> Dán Trực Tiếp Văn Bản / JSON
            </button>
          </div>

          {/* Dedicated Gem AI / Web Converter Link Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 sm:p-3.5 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-pink-500/10 border border-purple-200/80 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs sm:text-sm font-black text-slate-800">
                    Công Cụ Chuyển Đổi Format Câu Hỏi Bằng Gem AI
                  </span>
                  <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                    Cập nhật từ Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  {effectiveGemUrl 
                    ? "Bấm nút để mở liên kết Gem / Web chuyển đổi tài liệu đề thi sang format chuẩn nhanh chóng." 
                    : "Mở công cụ AI để chuẩn hóa câu hỏi thành định dạng Wey Playground (Cập nhật link trong Admin)."}
                </p>
              </div>
            </div>

            <a
              id="open-gem-converter-banner-btn"
              href={effectiveGemUrl || "https://gemini.google.com"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!effectiveGemUrl) {
                  safeAlert("💡 Đang mở Gemini AI. Quản trị viên có thể vào trang Quản Trị (Admin) -> Cài đặt Web để thay đổi liên kết Gem chuyển đổi này!");
                }
              }}
              className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-sm transition hover:scale-[1.02] cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>Chuyển Đổi Bằng Gem AI</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Diagnostics Error Notification Box */}
          {(error || (diagnostics && diagnostics.status === 'invalid') || (diagnostics && diagnostics.issues && diagnostics.issues.length > 0)) && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs space-y-2 shadow-xs animate-fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-rose-900 text-sm">
                    {diagnostics?.status === 'invalid' ? '⚠️ Không thể nhận diện câu hỏi' : '⚠️ Cảnh báo định dạng câu hỏi'}
                  </p>
                  <p className="mt-0.5 text-rose-700 leading-relaxed">
                    {error || diagnostics?.message || 'Vui lòng kiểm tra lại cấu trúc câu hỏi theo mẫu chuẩn bên dưới.'}
                  </p>
                </div>
              </div>

              {/* Chi tiết từng lỗi */}
              {diagnostics?.issues && diagnostics.issues.length > 0 && (
                <div className="mt-2 pt-2 border-t border-rose-200 space-y-1.5">
                  <p className="font-bold text-[11px] text-rose-800 uppercase tracking-wider">
                    Chi tiết các mục cần sửa ({diagnostics.issues.length}):
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                    {diagnostics.issues.map((iss, idx) => (
                      <div key={idx} className="bg-white border border-rose-200 rounded-lg p-2 text-[11px]">
                        <div className="flex items-center justify-between font-bold text-rose-900">
                          <span>📍 {iss.item}</span>
                          <span className="text-rose-600 font-normal">{iss.reason}</span>
                        </div>
                        {iss.suggestion && (
                          <p className="text-emerald-700 mt-0.5 text-[10.5px]">
                            💡 {iss.suggestion}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Main Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-6">
            <div className="md:col-span-3 space-y-3">
              {mode === 'file' ? (
                <div 
                  id="import-dropzone"
                  className="border-2 border-dashed border-w-border rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center bg-w-bg-alt/50 hover:bg-w-accent-light/30 hover:border-w-primary transition cursor-pointer min-h-[280px]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-14 h-14 bg-w-bg-card rounded-full flex items-center justify-center text-w-primary mb-3 shadow-xs border border-w-border">
                    {isProcessing ? <Loader2 className="w-7 h-7 animate-spin" /> : <Upload className="w-7 h-7" />}
                  </div>
                  <h3 className="text-w-text-main font-bold text-sm mb-1">
                    {isProcessing ? 'AI Đang đọc & phân tích đề...' : 'Tải file Word (.docx), PowerPoint (.pptx), TXT, JSON, CSV'}
                  </h3>
                  <p className="text-xs text-w-text-muted max-w-[280px] mb-4">
                    AI sẽ tự động đọc slide PPTX, trích xuất trắc nghiệm, đúng/sai, tự luận & nhận diện đáp án chuẩn
                  </p>
                  <button className="px-5 py-2 wey-btn-primary text-xs font-bold rounded-xl transition cursor-pointer">
                    Chọn File Từ Máy Tính
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.doc,.pptx,.ppt,.txt,.json,.csv,.md,.tsv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="flex flex-col h-full min-h-[280px]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-w-text-main">Nội dung câu hỏi hoặc JSON:</span>
                    <button
                      type="button"
                      onClick={() => insertSampleText('mcq')}
                      className="text-xs font-bold text-w-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>✨ Chèn văn bản mẫu thử nghiệm</span>
                    </button>
                  </div>
                  <textarea
                    id="import-text-input"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Dán nội dung câu hỏi hoặc mảng JSON vào đây (Xem mẫu các định dạng ở cột bên phải)..."
                    className="flex-1 w-full bg-w-input-bg border border-w-input-border rounded-2xl p-3 text-xs sm:text-sm font-mono text-w-text-main focus:outline-none focus:border-w-primary focus:ring-2 focus:ring-w-accent-light resize-none min-h-[180px]"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      id="submit-import-text-btn"
                      onClick={handleTextImport}
                      disabled={isProcessing || !rawText.trim()}
                      className="px-5 py-2.5 wey-btn-primary text-xs sm:text-sm font-bold rounded-xl transition disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>{isProcessing ? 'Đang Phân Tích...' : 'AI Phân Tích & Nạp Đề'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Guide Sidebar */}
            <div className="md:col-span-2 bg-w-bg-alt/80 border border-w-border rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="flex items-center gap-1.5 font-bold text-w-text-main text-xs sm:text-sm">
                    <AlertCircle className="w-4 h-4 text-w-primary" />
                    <span>Mẫu Định Dạng Chuẩn</span>
                  </h4>
                  <div className="flex items-center gap-1.5">
                    {effectiveGemUrl && (
                      <a
                        href={effectiveGemUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-200 rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Mở Gem AI chuyển đổi câu hỏi"
                      >
                        <Bot className="w-3 h-3 text-purple-600" />
                        <span>Gem AI</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => copyTemplateToClipboard(selectedGuideTab)}
                      className="px-2.5 py-1 bg-w-bg-card border border-w-border text-w-text-main rounded-lg text-[10.5px] font-bold hover:bg-w-accent-light flex items-center gap-1 cursor-pointer"
                    >
                      {copiedType === selectedGuideTab ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedType === selectedGuideTab ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                  </div>
                </div>

                {/* Sub-tabs for template types */}
                <div className="flex flex-wrap gap-1 mb-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedGuideTab('mcq')}
                    className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                      selectedGuideTab === 'mcq' ? 'bg-w-primary text-white' : 'bg-w-bg-card text-w-text-muted hover:bg-w-accent-light hover:text-w-text-main'
                    }`}
                  >
                    <ListOrdered className="w-3 h-3" />
                    <span>MCQ (A-D)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedGuideTab('json')}
                    className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                      selectedGuideTab === 'json' ? 'bg-w-primary text-white' : 'bg-w-bg-card text-w-text-muted hover:bg-w-accent-light hover:text-w-text-main'
                    }`}
                  >
                    <Code2 className="w-3 h-3" />
                    <span className="font-mono">JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedGuideTab('all')}
                    className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                      selectedGuideTab === 'all' ? 'bg-w-primary text-white' : 'bg-w-bg-card text-w-text-muted hover:bg-w-accent-light hover:text-w-text-main'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>Hỗn hợp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedGuideTab('tf')}
                    className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                      selectedGuideTab === 'tf' ? 'bg-w-primary text-white' : 'bg-w-bg-card text-w-text-muted hover:bg-w-accent-light hover:text-w-text-main'
                    }`}
                  >
                    <CheckSquare className="w-3 h-3" />
                    <span>Đúng/Sai</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedGuideTab('text')}
                    className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                      selectedGuideTab === 'text' ? 'bg-w-primary text-white' : 'bg-w-bg-card text-w-text-muted hover:bg-w-accent-light hover:text-w-text-main'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Tự luận</span>
                  </button>
                </div>

                <div className="bg-slate-900 border border-slate-800 text-emerald-300 rounded-xl p-2.5 text-[11px] font-mono space-y-1 shadow-inner max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {SAMPLE_TEMPLATES[selectedGuideTab]}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-w-border space-y-1.5 text-[10.5px] text-w-text-muted">
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Dùng <code className="bg-w-bg-card px-1 rounded border border-w-border text-w-text-main">Câu X:</code> bắt đầu câu hoặc mảng <code className="bg-w-bg-card px-1 rounded border border-w-border text-w-text-main">[ ... ]</code> JSON.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Ghi <code className="bg-w-bg-card px-1 rounded border border-w-border text-w-text-main">Đáp án: C</code> hoặc gắn hoa thị <code className="bg-w-bg-card px-1 rounded border border-w-border text-w-text-main">*C.</code></span>
                </div>
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => insertSampleText(selectedGuideTab)}
                    className="px-2.5 py-1 wey-btn-primary rounded-lg text-[10.5px] font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Dán mẫu này vào ô nhập</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
