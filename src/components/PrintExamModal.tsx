import React, { useState } from 'react';
import { X, Printer, Download, FileText, CheckCircle2, Eye, EyeOff, Settings } from 'lucide-react';
import type { QuestionBank, Question } from '../types';
import { MathChemRenderer } from '../utils/mathChemFormatter';

interface PrintExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  bank: QuestionBank | null;
}

export const PrintExamModal: React.FC<PrintExamModalProps> = ({
  isOpen,
  onClose,
  bank,
}) => {
  const [schoolName, setSchoolName] = useState('TRƯỜNG THCS / THPT ....................');
  const [examTitle, setExamTitle] = useState('ĐỀ KIỂM TRA ĐÁNH GIÁ THƯỜNG XUYÊN');
  const [duration, setDuration] = useState('45 phút');
  const [examCode, setExamCode] = useState('101');
  const [showAnswerKey, setShowAnswerKey] = useState(true);
  const [showExplanations, setShowExplanations] = useState(false);
  const [separateAnswerSheet, setSeparateAnswerSheet] = useState(true);
  const [optionsColumns, setOptionsColumns] = useState<'2' | '4' | '1'>('2');

  if (!isOpen || !bank) return null;

  const questions = bank.questions || [];

  const handlePrint = () => {
    window.print();
  };

  const handleExportWordDoc = () => {
    const printContent = document.getElementById('exam-printable-area');
    if (!printContent) return;

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${bank.name}</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.4; }
          table { width: 100%; border-collapse: collapse; }
          .header-table td { vertical-align: top; }
          .question-title { font-weight: bold; margin-top: 12pt; }
          .options-grid { display: grid; grid-template-columns: repeat(${optionsColumns}, 1fr); gap: 8pt; margin: 4pt 0 12pt 0; }
          .answer-key-table th, .answer-key-table td { border: 1px solid black; padding: 4pt 8pt; text-align: center; }
          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `De_Thi_${bank.name.replace(/\s+/g, '_')}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-w-bg-card w-full max-w-5xl rounded-[28px] shadow-2xl border-2 border-w-border flex flex-col max-h-[96vh] overflow-hidden my-auto">
        {/* Modal Controls Header */}
        <div className="p-4 sm:p-5 bg-w-bg-main border-b border-w-border flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-w-accent-light text-w-primary-dark rounded-2xl border border-w-accent-border shadow-xs">
              <Printer className="w-5 h-5 text-w-primary" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-[900] text-w-text-main">
                In & Xuất Đề Kiểm Tra Chuẩn
              </h3>
              <p className="text-xs font-[600] text-w-text-muted">
                Định dạng theo mẫu đề thi của Bộ GD&ĐT (Hỗ trợ in trực tiếp hoặc tải file Word .doc)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportWordDoc}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-w-bg-card hover:bg-w-accent-light text-w-text-main font-[800] text-xs border border-w-border transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-w-primary" />
              <span>Tải File Word (.doc)</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 wey-btn-primary font-[800] text-xs shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In Ngay (Print)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-w-text-muted hover:text-w-text-main hover:bg-w-accent-light rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customization Settings Bar */}
        <div className="px-5 py-3 bg-w-bg-alt/70 border-b border-w-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs print:hidden shrink-0">
          <div>
            <label className="block text-[11px] font-[800] text-w-text-muted mb-1">Tên Trường / Đơn vị:</label>
            <input
              type="text"
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-w-input-bg border border-w-input-border rounded-xl text-xs font-[700]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-[800] text-w-text-muted mb-1">Tiêu đề bài thi:</label>
            <input
              type="text"
              value={examTitle}
              onChange={e => setExamTitle(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-w-input-bg border border-w-input-border rounded-xl text-xs font-[700]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-[800] text-w-text-muted mb-1">Thời gian làm bài:</label>
            <input
              type="text"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-w-input-bg border border-w-input-border rounded-xl text-xs font-[700]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-[800] text-w-text-muted mb-1">Mã đề:</label>
            <input
              type="text"
              value={examCode}
              onChange={e => setExamCode(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-w-input-bg border border-w-input-border rounded-xl text-xs font-[700]"
            />
          </div>

          {/* Toggle Checklist */}
          <div className="col-span-full flex items-center gap-4 flex-wrap pt-1 text-xs font-[700]">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showAnswerKey}
                onChange={e => setShowAnswerKey(e.target.checked)}
                className="rounded"
              />
              <span>In Bảng Đáp Án</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showExplanations}
                onChange={e => setShowExplanations(e.target.checked)}
                className="rounded"
              />
              <span>In Kèm Lời Giải Chi Tiết</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={separateAnswerSheet}
                onChange={e => setSeparateAnswerSheet(e.target.checked)}
                className="rounded"
              />
              <span>Tách Bảng Đáp Án Sang Trang Mới</span>
            </label>

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-w-text-muted">Chia cột phương án:</span>
              <select
                value={optionsColumns}
                onChange={e => setOptionsColumns(e.target.value as any)}
                className="px-2 py-1 bg-w-input-bg border border-w-border rounded-lg text-xs"
              >
                <option value="1">1 cột (Dọc)</option>
                <option value="2">2 cột (Cân đối)</option>
                <option value="4">4 cột (Ngang)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Printable Document Paper View */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
          <div 
            id="exam-printable-area"
            className="w-full max-w-3xl bg-white p-8 sm:p-12 shadow-md rounded-xl text-black font-serif leading-relaxed text-[13pt]"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            {/* Header Table */}
            <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
              <div className="text-center w-1/2 pr-2">
                <div className="font-bold uppercase text-[11pt]">{schoolName}</div>
                <div className="font-bold uppercase text-[12pt] mt-1">{examTitle}</div>
                <div className="text-[10pt] italic mt-0.5">Môn: {bank.subject || 'Tổng hợp'} • {bank.grade || ''}</div>
                <div className="text-[10pt] mt-0.5">Thời gian làm bài: <strong>{duration}</strong></div>
              </div>

              <div className="text-center w-1/2 pl-2 border-l border-black/40">
                <div className="font-bold text-[11pt] uppercase">HỌ VÀ TÊN THÍ SINH</div>
                <div className="text-[10pt] mt-2 text-left space-y-1">
                  <div>Họ tên: ....................................................</div>
                  <div>Lớp: ................. SBD: ............................</div>
                  <div className="font-bold mt-1 text-center bg-gray-100 py-1 border border-black/20">
                    MÃ ĐỀ THI: {examCode}
                  </div>
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-5">
              {questions.map((q, idx) => (
                <div key={q.id || idx} className="question-item text-justify">
                  <div className="font-bold">
                    <span>Câu {idx + 1}: </span>
                    <span className="font-normal font-serif">
                      <MathChemRenderer text={q.content} />
                    </span>
                  </div>

                  {/* Image */}
                  {q.imageUrl && (
                    <div className="my-2 text-center">
                      <img 
                        src={q.imageUrl} 
                        alt={`Hình minh họa câu ${idx + 1}`} 
                        className="max-h-40 inline-block object-contain"
                      />
                    </div>
                  )}

                  {/* Options */}
                  {q.type === 'mcq' && q.options && (
                    <div 
                      className={`grid gap-2 mt-2 font-serif text-[12pt] ${
                        optionsColumns === '4' 
                          ? 'grid-cols-4' 
                          : optionsColumns === '2' 
                          ? 'grid-cols-2' 
                          : 'grid-cols-1'
                      }`}
                    >
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-start gap-1">
                          <span className="font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                          <span><MathChemRenderer text={opt} /></span>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === 'tf' && (
                    <div className="flex items-center gap-8 mt-1 text-[12pt]">
                      <span>A. Đúng</span>
                      <span>B. Sai</span>
                    </div>
                  )}

                  {q.type === 'text' && (
                    <div className="mt-1 text-[11pt] italic text-gray-500">
                      ....................................................................................................................................................................
                    </div>
                  )}

                  {showExplanations && q.explanation && (
                    <div className="mt-1.5 p-2 bg-gray-50 text-[11pt] italic border-l-2 border-black">
                      <strong>Lời giải:</strong> <MathChemRenderer text={q.explanation} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* End of test banner */}
            <div className="text-center font-bold my-8 text-[11pt] uppercase tracking-wider">
              ---------- HẾT ----------
              <div className="font-normal italic text-[10pt] capitalize mt-1">
                (Cán bộ coi thi không giải thích gì thêm)
              </div>
            </div>

            {/* Answer Key Section */}
            {showAnswerKey && (
              <div className={`pt-6 border-t-2 border-black ${separateAnswerSheet ? 'page-break mt-12' : 'mt-8'}`}>
                <div className="text-center font-bold text-base uppercase mb-3">
                  ĐÁP ÁN ĐỀ THI - MÃ ĐỀ: {examCode}
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 text-center text-[11pt]">
                  {questions.map((q, idx) => {
                    let ansText = '—';
                    if (q.type === 'mcq' && typeof q.correct === 'number') {
                      ansText = String.fromCharCode(65 + q.correct);
                    } else if (q.type === 'tf') {
                      ansText = q.correct ? 'Đ' : 'S';
                    } else if (q.type === 'text') {
                      ansText = String(q.correct);
                    }
                    return (
                      <div key={idx} className="border border-black p-1">
                        <div className="font-bold text-[10pt] border-b border-black/40 pb-0.5">{idx + 1}</div>
                        <div className="font-bold text-red-700 pt-0.5">{ansText}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
