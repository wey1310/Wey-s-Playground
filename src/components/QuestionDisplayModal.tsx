import React, { useState, useEffect } from 'react';
import type { Question, GameMode } from '../types';
import { soundFx } from '../utils/audio';
import { Check, X, Clock, HelpCircle, Eye, Sparkles, AlertCircle } from 'lucide-react';
import { MathChemRenderer } from '../utils/mathChemFormatter';

export interface QuestionDisplayModalProps {
  isOpen: boolean;
  questionNumber: number;
  question: Question | null; // null in Number mode
  mode: GameMode;
  teamName?: string;
  teamAvatar?: string;
  timerEnabled?: boolean;
  timeLimitSeconds?: number;
  titlePrefix?: string;
  onAnswerSubmit: (isCorrect: boolean, correctAnswerText: string) => void;
  onClose?: () => void;
}

export const QuestionDisplayModal: React.FC<QuestionDisplayModalProps> = ({
  isOpen,
  questionNumber,
  question,
  mode,
  teamName,
  teamAvatar,
  timerEnabled = false,
  timeLimitSeconds = 30,
  titlePrefix = 'CÂU HỎI',
  onAnswerSubmit,
  onClose,
}) => {
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [selectedTfChoice, setSelectedTfChoice] = useState<boolean | null>(null);
  const [showTextAnswer, setShowTextAnswer] = useState<boolean>(false);
  
  const [showResult, setShowResult] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [manualCorrectText, setManualCorrectText] = useState<string>('');

  // Timer
  const [timeLeft, setTimeLeft] = useState<number>(timeLimitSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setSelectedOptionIdx(null);
      setSelectedTfChoice(null);
      setShowTextAnswer(false);
      setShowResult(false);
      setIsCorrect(false);
      setManualCorrectText('');

      if (timerEnabled && timeLimitSeconds > 0) {
        setTimeLeft(timeLimitSeconds);
        setIsTimerRunning(true);
      } else {
        setIsTimerRunning(false);
      }
    }
  }, [isOpen, questionNumber, question, timerEnabled, timeLimitSeconds]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            soundFx.timerTick();
            setIsTimerRunning(false);
            return 0;
          }
          if (prev <= 5) soundFx.timerTick();
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  if (!isOpen) return null;

  // Handle MCQ Choice click
  const handleSelectMcq = (optIdx: number) => {
    if (showResult) return;
    setIsTimerRunning(false);

    setSelectedOptionIdx(optIdx);
    const correctIdx = Number(question?.correct ?? 0);
    const correct = optIdx === correctIdx;

    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      soundFx.correct();
    } else {
      soundFx.wrong();
    }
  };

  // Handle True / False Choice click
  const handleSelectTf = (userChoice: boolean) => {
    if (showResult) return;
    setIsTimerRunning(false);

    setSelectedTfChoice(userChoice);
    const expected = Boolean(question?.correct);
    const correct = userChoice === expected;

    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      soundFx.correct();
    } else {
      soundFx.wrong();
    }
  };

  // Handle Text question judgment
  const handleJudgeTextQuestion = (correct: boolean) => {
    setIsTimerRunning(false);
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      soundFx.correct();
    } else {
      soundFx.wrong();
    }
  };

  // Handle Number mode manual judgment
  const handleJudgeNumberMode = (correct: boolean) => {
    setIsTimerRunning(false);
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      soundFx.correct();
    } else {
      soundFx.wrong();
    }
  };

  const getAnswerLogText = (): string => {
    if (mode === 'bank' && question) {
      if (question.type === 'mcq') {
        const cIdx = Number(question.correct ?? 0);
        const optText = question.options?.[cIdx] || '';
        return `${String.fromCharCode(65 + cIdx)}. ${optText}`;
      } else if (question.type === 'tf') {
        return question.correct ? 'ĐÚNG' : 'SAI';
      } else {
        return String(question.correct || 'Đã trả lời');
      }
    }
    return manualCorrectText || (isCorrect ? 'Đúng' : 'Sai');
  };

  const handleConfirm = () => {
    onAnswerSubmit(isCorrect, getAnswerLogText());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#35452E]/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-[#FFFDF5] border border-[#DED5B8] w-full max-w-xl sm:max-w-2xl rounded-[22px] sm:rounded-[26px] shadow-[0_12px_36px_rgba(79,104,60,0.18)] overflow-hidden flex flex-col max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] my-auto wey-paper-card">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#F8F3E5] border-b border-[#DED5B8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl">❓</span>
            <div>
              <h2 className="text-base sm:text-lg font-[800] text-[#35452E] flex items-center gap-2">
                <span>{titlePrefix} #{questionNumber}</span>
                {mode === 'bank' ? (
                  <span className="text-[11px] font-[800] text-[#3D522B] bg-[#E2EED3] px-2.5 py-0.5 rounded-full border border-[#B9CDA0]">
                    Ngân Hàng
                  </span>
                ) : (
                  <span className="text-[11px] font-[800] text-[#8C3A50] bg-[#FCE8EE] px-2.5 py-0.5 rounded-full border border-[#F2B6C7]">
                    Chế Độ Số
                  </span>
                )}
              </h2>
              {teamName && (
                <p className="text-xs font-[600] text-[#74806B] mt-0.5 flex items-center gap-1">
                  <span>Lượt trả lời:</span>
                  <span className="font-[800] text-[#35452E]">{teamAvatar} {teamName}</span>
                </p>
              )}
            </div>
          </div>

          {timerEnabled && (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-[800] border shadow-sm ${
              timeLeft <= 5
                ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                : 'bg-[#E9F0D9] text-[#35452E] border-[#B9CDA0]'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {mode === 'bank' && question ? (
            /* BANK MODE QUESTION */
            <div className="space-y-4">
              <div className="p-4 bg-[#F8F3E5]/70 border border-[#DED5B8] rounded-[20px]">
                <h3 className="text-base sm:text-lg font-[800] text-[#35452E] leading-relaxed">
                  <MathChemRenderer text={question.content} />
                </h3>
                {question.imageUrl && (
                  <div className="mt-3 rounded-[16px] overflow-hidden border border-[#DED5B8] bg-white flex items-center justify-center p-1 max-h-[220px]">
                    <img
                      src={question.imageUrl}
                      alt="Hình minh họa"
                      className="max-h-[210px] w-auto object-contain rounded-[12px]"
                    />
                  </div>
                )}
              </div>

              {/* MCQ Options */}
              {question.type === 'mcq' && question.options && (
                <div className="space-y-2.5 pt-1">
                  <p className="text-xs font-[800] text-[#74806B] uppercase tracking-wider">
                    {showResult ? 'Chỉ dẫn kết quả:' : 'Bấm chọn 1 đáp án để kiểm tra:'}
                  </p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {question.options.map((opt, oIdx) => {
                      const isOptionCorrect = Number(question.correct) === oIdx;
                      const isUserSelected = selectedOptionIdx === oIdx;

                      let buttonStyle = "bg-white border-[#DED5B8] text-[#35452E] hover:border-[#6F8F55] hover:bg-[#F8F3E5] shadow-sm";
                      if (showResult) {
                        if (isOptionCorrect) {
                          buttonStyle = "bg-[#E2EED3] border-[#B9CDA0] text-[#35452E] font-[800] shadow-sm ring-2 ring-[#8FA875]";
                        } else if (isUserSelected && !isOptionCorrect) {
                          buttonStyle = "bg-[#FCE8EE] border-[#F2B6C7] text-[#8C3A50] font-[800] shadow-sm";
                        } else {
                          buttonStyle = "bg-[#FFFDF5] border-[#DED5B8] text-[#74806B] opacity-50";
                        }
                      }

                      return (
                        <button
                          key={oIdx}
                          disabled={showResult}
                          onClick={() => handleSelectMcq(oIdx)}
                          className={`w-full p-3.5 rounded-[18px] border text-left text-xs sm:text-sm transition flex items-center justify-between gap-3 cursor-pointer ${buttonStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-7 h-7 rounded-[12px] font-mono font-[800] text-xs flex items-center justify-center shrink-0 ${
                              showResult && isOptionCorrect
                                ? 'bg-[#6F8F55] text-white'
                                : showResult && isUserSelected
                                ? 'bg-[#E05252] text-white'
                                : 'bg-[#E9F0D9] text-[#35452E]'
                            }`}>
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="font-[700]"><MathChemRenderer text={opt} /></span>
                          </div>

                          {showResult && isOptionCorrect && (
                            <span className="flex items-center gap-1 text-xs font-[800] text-[#3D522B] bg-[#E2EED3] px-2 py-0.5 rounded-lg shrink-0">
                              <Check className="w-4 h-4" /> Đúng
                            </span>
                          )}
                          {showResult && isUserSelected && !isOptionCorrect && (
                            <span className="flex items-center gap-1 text-xs font-[800] text-[#8C3A50] bg-[#FCE8EE] px-2 py-0.5 rounded-lg shrink-0">
                              <X className="w-4 h-4" /> Sai
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TRUE / FALSE Options */}
              {question.type === 'tf' && (
                <div className="space-y-2.5 pt-1">
                  <p className="text-xs font-[800] text-[#74806B] uppercase tracking-wider">
                    {showResult ? 'Kết quả:' : 'Chọn ĐÚNG hoặc SAI:'}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[true, false].map((choice) => {
                      const isExpected = Boolean(question.correct) === choice;
                      const isSelected = selectedTfChoice === choice;

                      let style = "bg-white border-[#DED5B8] text-[#35452E] hover:border-[#6F8F55] shadow-sm";
                      if (showResult) {
                        if (isExpected) {
                          style = "bg-[#E2EED3] border-[#B9CDA0] text-[#35452E] font-[800] shadow-sm ring-2 ring-[#8FA875]";
                        } else if (isSelected && !isExpected) {
                          style = "bg-[#FCE8EE] border-[#F2B6C7] text-[#8C3A50] font-[800] shadow-sm";
                        } else {
                          style = "bg-[#FFFDF5] border-[#DED5B8] text-[#74806B] opacity-50";
                        }
                      }

                      return (
                        <button
                          key={String(choice)}
                          disabled={showResult}
                          onClick={() => handleSelectTf(choice)}
                          className={`p-4 rounded-[18px] border text-center font-[800] text-sm transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${style}`}
                        >
                          <span className="text-2xl">{choice ? '✅' : '❌'}</span>
                          <span>{choice ? 'ĐÚNG' : 'SAI'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TEXT / ESSAY / OPEN Question */}
              {question.type === 'text' && (
                <div className="space-y-3 pt-1">
                  {!showTextAnswer ? (
                    <button
                      onClick={() => setShowTextAnswer(true)}
                      className="w-full py-3 bg-[#E9F0D9] hover:bg-[#DCEBCB] text-[#35452E] font-[800] text-xs rounded-[18px] transition flex items-center justify-center gap-2 border border-[#B9CDA0] shadow-sm cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Hiện Đáp Án Chuẩn</span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-[#E2EED3] border border-[#B9CDA0] rounded-[18px] text-xs text-[#35452E] font-[700]">
                        <span className="text-[#3D522B] uppercase font-[800] tracking-wider block text-[10px] mb-0.5">Đáp án chuẩn:</span>
                        <span><MathChemRenderer text={String(question.correct)} /></span>
                      </div>

                      {!showResult && (
                        <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 pt-1">
                          <button
                            onClick={() => handleJudgeTextQuestion(true)}
                            className="w-full sm:flex-1 py-3 bg-[#6F8F55] hover:bg-[#5F7E4B] text-white font-[800] text-xs sm:text-sm rounded-[15px] shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                          >
                            <Check className="w-4 h-4" /> Trả Lời Đúng
                          </button>
                          <button
                            onClick={() => handleJudgeTextQuestion(false)}
                            className="w-full sm:flex-1 py-3 bg-[#E05252] hover:bg-[#C84040] text-white font-[800] text-xs sm:text-sm rounded-[15px] shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                          >
                            <X className="w-4 h-4" /> Trả Lời Sai
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* NUMBER MODE */
            <div className="py-4 space-y-4 text-center">
              <div className="inline-flex p-3 bg-[#E2EED3] text-[#3D522B] rounded-[20px] border border-[#B9CDA0] shadow-sm">
                <HelpCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-[800] text-[#35452E]">CÂU HỎI SỐ #{questionNumber}</h3>
                <p className="text-xs font-[600] text-[#74806B] mt-1">
                  Học sinh xem câu hỏi trên bảng / phiếu bài tập và trả lời.
                </p>
              </div>

              {!showResult ? (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-2">
                  <button
                    onClick={() => handleJudgeNumberMode(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#6F8F55] hover:bg-[#5F7E4B] text-white font-[800] text-xs sm:text-sm rounded-[18px] shadow-md transition cursor-pointer min-h-[44px]"
                  >
                    <Check className="w-4 h-4" /> Trả Lời ĐÚNG (+10đ)
                  </button>
                  <button
                    onClick={() => handleJudgeNumberMode(false)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#E05252] hover:bg-[#C84040] text-white font-[800] text-xs sm:text-sm rounded-[18px] shadow-md transition cursor-pointer min-h-[44px]"
                  >
                    <X className="w-4 h-4" /> Trả Lời SAI (0đ)
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Result Feedback Banner */}
          {showResult && (
            <div className="space-y-3 pt-2 animate-fade-in">
              <div className={`p-4 rounded-[20px] text-center font-[800] text-sm sm:text-base border shadow-sm flex items-center justify-center gap-2 ${
                isCorrect
                  ? 'bg-[#E2EED3] border-[#B9CDA0] text-[#35452E]'
                  : 'bg-[#FCE8EE] border-[#F2B6C7] text-[#8C3A50]'
              }`}>
                {isCorrect ? (
                  <>
                    <Sparkles className="w-5 h-5 text-[#6F8F55] shrink-0" />
                    <span>TRẢ LỜI CHÍNH XÁC! CỘNG 10 ĐIỂM</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-[#E05252] shrink-0" />
                    <span>TRẢ LỜI CHƯA ĐÚNG! 0 ĐIỂM</span>
                  </>
                )}
              </div>

              {/* Explanation in Bank mode */}
              {mode === 'bank' && question?.explanation && (
                <div className="p-3 bg-[#F8F3E5] border border-[#DED5B8] rounded-[18px] text-xs text-[#35452E] font-[600]">
                  <span className="font-[800] text-[#4F683C]">💡 Giải thích: </span>
                  <span>{question.explanation}</span>
                </div>
              )}

              {/* Manual input in Number mode */}
              {mode === 'number' && (
                <div className="text-left space-y-1">
                  <label className="text-xs font-[800] text-[#74806B]">
                    Ghi chú / Đáp án chuẩn (để lưu bảng tổng kết):
                  </label>
                  <input
                    type="text"
                    value={manualCorrectText}
                    onChange={(e) => setManualCorrectText(e.target.value)}
                    placeholder="VD: Đáp án A hoặc Lời giải..."
                    className="w-full bg-[#FFFDF7] border border-[#DED5B8] text-[#35452E] rounded-[14px] px-3 py-2 text-xs font-[600] focus:outline-none focus:border-[#6F8F55] shadow-sm"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Action */}
        {showResult && (
          <div className="p-4 bg-[#F8F3E5] border-t border-[#DED5B8] flex items-center justify-end shrink-0">
            <button
              onClick={handleConfirm}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#6F8F55] hover:bg-[#5F7E4B] text-white font-[800] text-xs sm:text-sm rounded-[15px] shadow-md transition cursor-pointer border border-[#5F7E4B]"
            >
              Xác Nhận & Tiếp Tục
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
