import React, { useState, useMemo } from 'react';
import { 
  X, 
  BookOpen, 
  CheckCircle2, 
  HelpCircle, 
  Eye, 
  RotateCcw, 
  Sparkles, 
  FileText, 
  Printer, 
  Edit3, 
  ChevronRight, 
  ChevronLeft,
  Award,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import type { QuestionBank, Question } from '../types';
import { MathChemRenderer } from '../utils/mathChemFormatter';

interface BankQuickPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bank: QuestionBank | null;
  onOpenEditor?: (bankId: string) => void;
  onOpenPrint?: (bank: QuestionBank) => void;
}

export const BankQuickPreviewModal: React.FC<BankQuickPreviewModalProps> = ({
  isOpen,
  onClose,
  bank,
  onOpenEditor,
  onOpenPrint,
}) => {
  const [mode, setMode] = useState<'teacher' | 'interactive'>('teacher');
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [showResults, setShowResults] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  if (!isOpen || !bank) return null;

  const questions = bank.questions || [];
  const mcqCount = questions.filter(q => q.type === 'mcq').length;
  const tfCount = questions.filter(q => q.type === 'tf').length;
  const textCount = questions.filter(q => q.type === 'text').length;

  const cognitiveStats = {
    nb: questions.filter(q => q.cognitiveLevel === 'Nhận biết').length,
    th: questions.filter(q => q.cognitiveLevel === 'Thông hiểu').length,
    vd: questions.filter(q => q.cognitiveLevel === 'Vận dụng').length,
    vdc: questions.filter(q => q.cognitiveLevel === 'Vận dụng cao').length,
  };

  // Interactive Quiz Score Calculation
  const scoreStats = useMemo(() => {
    if (questions.length === 0) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    questions.forEach(q => {
      const ans = userAnswers[q.id];
      if (ans === undefined) return;
      if (q.type === 'mcq' && ans === q.correct) correct++;
      else if (q.type === 'tf' && ans === q.correct) correct++;
      else if (q.type === 'text' && String(ans).trim().toLowerCase() === String(q.correct).trim().toLowerCase()) correct++;
    });
    return {
      correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100),
    };
  }, [questions, userAnswers]);

  const handleSelectAnswer = (qId: string, answer: any) => {
    setUserAnswers(prev => ({
      ...prev,
      [qId]: answer
    }));
  };

  const handleResetQuiz = () => {
    setUserAnswers({});
    setShowResults(false);
    setActiveQuestionIndex(0);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-w-bg-card w-full max-w-4xl rounded-[28px] shadow-2xl border-2 border-w-border flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-w-bg-main border-b border-w-border flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-w-accent-light text-w-primary-dark rounded-2xl border border-w-accent-border shadow-xs">
              <BookOpen className="w-5 h-5 text-w-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-[900] text-w-text-main line-clamp-1">
                  {bank.name}
                </h3>
                <span className="text-xs font-[800] px-2.5 py-0.5 rounded-full bg-w-primary text-white">
                  {questions.length} câu hỏi
                </span>
              </div>
              <p className="text-xs font-[600] text-w-text-muted mt-0.5">
                Môn: <strong className="text-w-text-main">{bank.subject || 'Tổng hợp'}</strong> • Khối: <strong className="text-w-text-main">{bank.grade || 'Chung'}</strong> {bank.folder ? `• Thư mục: ${bank.folder}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenPrint && questions.length > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPrint(bank);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-w-bg-card hover:bg-w-accent-light text-w-text-main font-[800] text-xs rounded-xl border border-w-border transition-colors cursor-pointer shadow-xs"
                title="In đề thi ra giấy hoặc xuất file Word"
              >
                <Printer className="w-4 h-4 text-w-primary" />
                <span className="hidden sm:inline">In / Xuất Đề Thi</span>
              </button>
            )}

            {onOpenEditor && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEditor(bank.id);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 wey-btn-primary font-[800] text-xs shadow-xs cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Mở Soạn Thảo</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-w-text-muted hover:text-w-text-main hover:bg-w-accent-light rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-bar: Mode Switcher & Summary Badges */}
        <div className="px-5 py-3 bg-w-bg-alt/70 border-b border-w-border flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-w-bg-card rounded-xl border border-w-border shadow-2xs">
            <button
              onClick={() => setMode('teacher')}
              className={`px-3 py-1.5 rounded-lg font-[800] transition-colors cursor-pointer flex items-center gap-1.5 ${
                mode === 'teacher' ? 'bg-w-primary text-white shadow-xs' : 'text-w-text-muted hover:text-w-text-main'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem Đề & Đáp Án (Giáo viên)</span>
            </button>
            <button
              onClick={() => setMode('interactive')}
              className={`px-3 py-1.5 rounded-lg font-[800] transition-colors cursor-pointer flex items-center gap-1.5 ${
                mode === 'interactive' ? 'bg-w-primary text-white shadow-xs' : 'text-w-text-muted hover:text-w-text-main'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Làm Thử Trắc Nghiệm (Mô phỏng)</span>
            </button>
          </div>

          {/* Quick Matrix Breakdown */}
          <div className="flex items-center gap-2 flex-wrap text-[11px] font-[700] text-w-text-muted">
            <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200">
              Nhận biết: {cognitiveStats.nb}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              Thông hiểu: {cognitiveStats.th}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              Vận dụng: {cognitiveStats.vd}
            </span>
            {cognitiveStats.vdc > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                Vận dụng cao: {cognitiveStats.vdc}
              </span>
            )}
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {questions.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-w-border rounded-[24px] bg-w-bg-card p-6">
              <HelpCircle className="w-12 h-12 text-w-text-muted mx-auto mb-2 opacity-50" />
              <h4 className="text-base font-[800] text-w-text-main">Bộ đề này chưa có câu hỏi nào</h4>
              <p className="text-xs text-w-text-muted mt-1 max-w-sm mx-auto">
                Bấm vào "Mở Soạn Thảo" để thêm câu hỏi mới, nạp từ file Word/Excel hoặc dán văn bản!
              </p>
            </div>
          ) : mode === 'teacher' ? (
            /* ========================================================= */
            /* TEACHER FULL PREVIEW MODE                                 */
            /* ========================================================= */
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div 
                  key={q.id || idx}
                  className="p-4 sm:p-5 bg-w-bg-card border-2 border-w-border rounded-2xl shadow-2xs space-y-3"
                >
                  {/* Badges row */}
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-[900] text-xs px-2.5 py-0.5 bg-w-accent-light text-w-primary-dark rounded-md border border-w-accent-border">
                        Câu {idx + 1}
                      </span>
                      <span className="font-[700] text-[11px] px-2 py-0.5 rounded-md bg-w-bg-alt text-w-text-main border border-w-border">
                        {q.type === 'mcq' ? 'Trắc nghiệm (4 lựa chọn)' : q.type === 'tf' ? 'Đúng / Sai' : 'Điền từ / Tự luận'}
                      </span>
                      {q.cognitiveLevel && (
                        <span className="font-[700] text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {q.cognitiveLevel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="text-sm sm:text-base font-[700] text-w-text-main leading-relaxed">
                    <MathChemRenderer text={q.content} />
                  </div>

                  {/* Image if any */}
                  {q.imageUrl && (
                    <div className="pt-1">
                      <img 
                        src={q.imageUrl} 
                        alt={`Minh họa câu ${idx + 1}`} 
                        className="max-h-48 rounded-xl border border-w-border object-contain bg-w-bg-alt p-1"
                      />
                    </div>
                  )}

                  {/* Options (MCQ) */}
                  {q.type === 'mcq' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = q.correct === oIdx;
                        return (
                          <div 
                            key={oIdx}
                            className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                              isCorrect 
                                ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 font-[800] ring-1 ring-emerald-300' 
                                : 'bg-w-bg-alt/80 border-w-border text-w-text-main font-[600]'
                            }`}
                          >
                            <span className={`w-5 font-[900] ${isCorrect ? 'text-emerald-700' : 'text-w-text-muted'}`}>
                              {String.fromCharCode(65 + oIdx)}.
                            </span>
                            <span className="flex-1">
                              <MathChemRenderer text={opt} />
                            </span>
                            {isCorrect && (
                              <span className="text-[10px] font-[900] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 shrink-0">
                                ĐÁP ÁN ĐÚNG
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* True / False answer */}
                  {q.type === 'tf' && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-[800] text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Đáp án chuẩn: <strong>{q.correct ? 'ĐÚNG (True)' : 'SAI (False)'}</strong></span>
                    </div>
                  )}

                  {/* Text fill answer */}
                  {q.type === 'text' && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-[800] text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Đáp án chuẩn: <strong><MathChemRenderer text={String(q.correct)} /></strong></span>
                    </div>
                  )}

                  {/* Explanation if any */}
                  {q.explanation && (
                    <div className="p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs text-amber-900 font-[600] flex items-start gap-2">
                      <span className="font-[800] text-amber-800 shrink-0">💡 Lời giải / Giải thích:</span>
                      <span className="flex-1 leading-relaxed"><MathChemRenderer text={q.explanation} /></span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* ========================================================= */
            /* INTERACTIVE QUIZ SIMULATION MODE                          */
            /* ========================================================= */
            <div className="space-y-5 max-w-2xl mx-auto">
              {/* Question Navigation Bar */}
              <div className="flex items-center justify-between gap-2 p-3 bg-w-bg-card border border-w-border rounded-2xl">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {questions.map((_, i) => {
                    const isAnswered = userAnswers[questions[i].id] !== undefined;
                    const isCurrent = activeQuestionIndex === i;
                    return (
                      <button
                        key={i}
                        onClick={() => setActiveQuestionIndex(i)}
                        className={`w-7 h-7 rounded-lg text-xs font-[800] transition-colors cursor-pointer flex items-center justify-center ${
                          isCurrent 
                            ? 'bg-w-primary text-white shadow-xs scale-105'
                            : isAnswered
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-w-bg-alt text-w-text-muted hover:bg-w-accent-light'
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleResetQuiz}
                  className="px-2.5 py-1 text-xs font-[700] text-w-text-muted hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                  title="Làm lại từ đầu"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm lại</span>
                </button>
              </div>

              {/* Active Question Card */}
              {questions[activeQuestionIndex] && (() => {
                const currentQ = questions[activeQuestionIndex];
                const selectedAns = userAnswers[currentQ.id];
                const isAnswered = selectedAns !== undefined;

                return (
                  <div className="p-5 sm:p-6 bg-w-bg-card border-2 border-w-border rounded-[24px] shadow-sm space-y-4">
                    <div className="flex items-center justify-between text-xs text-w-text-muted">
                      <span className="font-[900] text-w-primary text-sm">
                        Câu {activeQuestionIndex + 1} / {questions.length}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-w-bg-alt text-w-text-main font-[700]">
                        {currentQ.cognitiveLevel || 'Mức độ chuẩn'}
                      </span>
                    </div>

                    <div className="text-base sm:text-lg font-[800] text-w-text-main leading-relaxed">
                      <MathChemRenderer text={currentQ.content} />
                    </div>

                    {currentQ.imageUrl && (
                      <div>
                        <img 
                          src={currentQ.imageUrl} 
                          alt="Minh họa" 
                          className="max-h-52 rounded-xl border border-w-border object-contain bg-w-bg-alt p-1"
                        />
                      </div>
                    )}

                    {/* Options (MCQ) */}
                    {currentQ.type === 'mcq' && currentQ.options && (
                      <div className="space-y-2 pt-2">
                        {currentQ.options.map((opt, oIdx) => {
                          const isSelected = selectedAns === oIdx;
                          const isCorrect = currentQ.correct === oIdx;

                          let btnStyle = 'bg-w-bg-alt border-w-border hover:border-w-primary/50 text-w-text-main';
                          if (isSelected) {
                            if (showResults || isAnswered) {
                              btnStyle = isCorrect
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-2 ring-emerald-300'
                                : 'bg-rose-50 border-rose-400 text-rose-950 ring-2 ring-rose-300';
                            } else {
                              btnStyle = 'bg-w-accent-light border-w-primary text-w-primary-dark ring-2 ring-w-primary/30';
                            }
                          } else if ((showResults || isAnswered) && isCorrect) {
                            btnStyle = 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-[800]';
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleSelectAnswer(currentQ.id, oIdx)}
                              className={`w-full p-3 rounded-2xl border text-left text-xs sm:text-sm font-[700] transition-all flex items-center gap-3 cursor-pointer ${btnStyle}`}
                            >
                              <span className="w-6 h-6 rounded-lg bg-white border border-black/10 flex items-center justify-center font-[900] shrink-0 text-xs">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span className="flex-1 leading-snug">
                                <MathChemRenderer text={opt} />
                              </span>
                              {(showResults || isAnswered) && isCorrect && (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* True/False Input */}
                    {currentQ.type === 'tf' && (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        {[true, false].map((val) => {
                          const isSelected = selectedAns === val;
                          const isCorrect = currentQ.correct === val;
                          return (
                            <button
                              key={String(val)}
                              onClick={() => handleSelectAnswer(currentQ.id, val)}
                              className={`py-3.5 px-4 rounded-2xl border font-[900] text-sm text-center transition-all cursor-pointer ${
                                isSelected
                                  ? (showResults || isAnswered)
                                    ? isCorrect
                                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                                      : 'bg-rose-500 text-white border-rose-600 shadow-sm'
                                    : 'bg-w-primary text-white border-w-primary'
                                  : 'bg-w-bg-alt hover:bg-w-accent-light text-w-text-main border-w-border'
                              }`}
                            >
                              {val ? '👍 ĐÚNG (True)' : '👎 SAI (False)'}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Text Input */}
                    {currentQ.type === 'text' && (
                      <div className="space-y-2 pt-2">
                        <input
                          type="text"
                          value={selectedAns || ''}
                          onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                          placeholder="Nhập câu trả lời của bạn..."
                          className="w-full px-4 py-2.5 bg-w-input-bg border border-w-input-border rounded-xl text-sm font-[700] text-w-text-main focus:outline-none focus:border-w-primary"
                        />
                        {(showResults || isAnswered) && (
                          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-[700]">
                            Đáp án chuẩn: <MathChemRenderer text={String(currentQ.correct)} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Explanation feedback */}
                    {isAnswered && currentQ.explanation && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed font-[600]">
                        💡 <strong>Giải thích:</strong> {currentQ.explanation}
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-3 border-t border-w-border">
                      <button
                        onClick={() => setActiveQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={activeQuestionIndex === 0}
                        className="px-3.5 py-2 rounded-xl bg-w-bg-alt hover:bg-w-accent-light text-w-text-main font-[800] text-xs border border-w-border disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Câu trước</span>
                      </button>

                      <span className="text-xs font-[700] text-w-text-muted">
                        Đã làm {Object.keys(userAnswers).length} / {questions.length} câu
                      </span>

                      <button
                        onClick={() => setActiveQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                        disabled={activeQuestionIndex === questions.length - 1}
                        className="px-3.5 py-2 rounded-xl wey-btn-primary text-xs font-[800] disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
                      >
                        <span>Câu tiếp</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Interactive Score Panel */}
              <div className="p-4 bg-w-bg-card border-2 border-w-border rounded-2xl shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-w-accent-light text-w-primary flex items-center justify-center font-[900] text-lg border border-w-accent-border">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-[900] text-w-text-main">
                      Kết Quả Mô Phỏng: {scoreStats.correct} / {scoreStats.total} ({scoreStats.percentage}%)
                    </h4>
                    <p className="text-xs text-w-text-muted">
                      {scoreStats.percentage >= 80 ? '🌟 Rất tốt! Các đáp án được định dạng chính xác.' : 'Tiếp tục kiểm tra các câu hỏi còn lại.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowResults(!showResults)}
                  className="px-3 py-1.5 rounded-xl bg-w-bg-alt hover:bg-w-accent-light text-w-text-main font-[800] text-xs border border-w-border cursor-pointer transition-colors"
                >
                  {showResults ? 'Ẩn đáp án' : 'Hiện toàn bộ đáp án'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
