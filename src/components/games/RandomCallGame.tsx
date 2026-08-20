import React, { useState, useEffect, useRef } from 'react';
import { GameSetupConfig, Question, AnswerLog } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { soundFx } from '../../utils/audio';
import { Users, Shuffle, CheckCircle, XCircle, RotateCcw, Clock, Eye, Sparkles, ChevronRight, Play } from 'lucide-react';
import { StudentImportButton } from '../StudentImportButton';

interface GameProps {
  config: GameSetupConfig;
  questions?: Question[];
  onGameEnd: (teams: any[], logs: AnswerLog[]) => void;
}

export const RandomCallGame: React.FC<GameProps> = ({ config, questions = [], onGameEnd }) => {
  // Student List management with localStorage persistence
  const initialNames = React.useMemo(() => {
    if (config.studentsList && config.studentsList.length > 0) {
      return config.studentsList;
    }
    try {
      const saved = localStorage.getItem('wey_saved_students_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    if (config.teams && config.teams.length > 0) {
      return config.teams.map(t => t.name);
    }
    return [
      'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Hoàng Cường', 'Phạm Minh Dũng', 'Hoàng Gia Em',
      'Vũ Thùy Linh', 'Đỗ Quang Minh', 'Bùi Hải Nam', 'Đặng Phương Nga', 'Trương Quốc Phong'
    ];
  }, [config.studentsList, config.teams]);

  const [studentsText, setStudentsText] = useState<string>(initialNames.join('\n'));
  const [students, setStudents] = useState<string[]>(initialNames);
  const [calledStudents, setCalledStudents] = useState<string[]>([]);
  const [noRepeat, setNoRepeat] = useState<boolean>(config.noRepeatStudents !== false);
  const [studentScores, setStudentScores] = useState<Record<string, number>>({});

  // Rolling / Spin States
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [displayRollName, setDisplayRollName] = useState<string>('---');
  const [pickedStudent, setPickedStudent] = useState<string | null>(null);

  // Question Flow States
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isQuestionActive, setIsQuestionActive] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [usedQuestionIndices, setUsedQuestionIndices] = useState<number[]>([]);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);

  // Timer
  const [timeLeft, setTimeLeft] = useState<number>(config.timeLimitSeconds || 30);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync textarea with students array & localStorage
  useEffect(() => {
    const parsed = studentsText.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    setStudents(parsed);
    if (parsed.length > 0) {
      try {
        localStorage.setItem('wey_saved_students_list', JSON.stringify(parsed));
      } catch (e) {}
    }
  }, [studentsText]);

  // Compute remaining students
  const remainingStudents = noRepeat 
    ? students.filter(s => !calledStudents.includes(s))
    : students;

  // Timer tick
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (isTimerRunning && timeLeft === 0) {
      soundFx.play('wrong');
      setIsTimerRunning(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isTimerRunning, timeLeft]);

  // Step 1: Start Name Roulette / Roll
  const handleRollName = () => {
    if (remainingStudents.length === 0) {
      alert("Đã gọi hết tất cả học sinh! Vui lòng bấm 'Đặt lại lượt' để bắt đầu vòng mới.");
      return;
    }
    if (isRolling) return;

    soundFx.play('click');
    setIsRolling(true);
    setPickedStudent(null);
    setIsQuestionActive(false);
    setCurrentQuestion(null);
    setShowAnswer(false);
    setSelectedOption(null);
    setIsTimerRunning(false);

    let speed = 60;
    let iterations = 0;
    const maxIterations = 28;

    const rollInterval = setInterval(() => {
      const randomCandidate = remainingStudents[Math.floor(Math.random() * remainingStudents.length)];
      setDisplayRollName(randomCandidate);
      soundFx.play('hover');
      iterations++;

      if (iterations >= maxIterations) {
        clearInterval(rollInterval);
        setIsRolling(false);
        const finalWinner = remainingStudents[Math.floor(Math.random() * remainingStudents.length)];
        setPickedStudent(finalWinner);
        setDisplayRollName(finalWinner);
        soundFx.play('correct');

        if (noRepeat) {
          setCalledStudents(prev => [...prev, finalWinner]);
        }

        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#4F683C', '#E9D58F', '#F59E0B', '#3B82F6', '#EC4899']
        });
      }
    }, speed);
  };

  // Step 2: Random Pick Question for this Student
  const handlePickRandomQuestion = () => {
    soundFx.play('whoosh');
    let chosenQ: Question;

    if (questions.length > 0) {
      let availableIndices = questions.map((_, i) => i).filter(i => !usedQuestionIndices.includes(i));
      if (availableIndices.length === 0) {
        availableIndices = questions.map((_, i) => i);
        setUsedQuestionIndices([]);
      }
      const randomIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      chosenQ = questions[randomIdx];
      setUsedQuestionIndices(prev => [...prev, randomIdx]);
      setQuestionIndex(randomIdx + 1);
    } else {
      // Virtual question fallback
      const qNum = Math.floor(Math.random() * 50) + 1;
      setQuestionIndex(qNum);
      chosenQ = {
        id: `q_virtual_${qNum}`,
        type: 'mcq',
        content: `Câu hỏi số ${qNum} (Giáo viên đọc câu hỏi trong sách hoặc file bài giảng ngoài)`,
        options: ['Đáp Án A', 'Đáp Án B', 'Đáp Án C', 'Đáp Án D'],
        correct: 0,
        explanation: 'Giáo viên đối chiếu với đáp án bài giảng.'
      };
    }

    setCurrentQuestion(chosenQ);
    setIsQuestionActive(true);
    setShowAnswer(false);
    setSelectedOption(null);
    setTimeLeft(config.timeLimitSeconds || 30);
    setIsTimerRunning(config.timerEnabled !== false);
  };

  // Participation Status State
  const [studentStatus, setStudentStatus] = useState<Record<string, 'correct' | 'incorrect' | 'help'>>({});

  // Quick Action Handler for Teacher logging
  const handleQuickAction = (status: 'correct' | 'incorrect' | 'help') => {
    if (!pickedStudent) return;
    setIsTimerRunning(false);

    setStudentStatus(prev => ({
      ...prev,
      [pickedStudent]: status
    }));

    if (status === 'correct') {
      soundFx.play('correct');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      setStudentScores(prev => ({
        ...prev,
        [pickedStudent]: (prev[pickedStudent] || 0) + 10
      }));
    } else if (status === 'help') {
      soundFx.play('bonus');
      setStudentScores(prev => ({
        ...prev,
        [pickedStudent]: (prev[pickedStudent] || 0) + 5
      }));
    } else {
      soundFx.play('wrong');
    }

    const newLog: AnswerLog = {
      questionId: currentQuestion ? currentQuestion.id : `quick_${Date.now()}`,
      questionContent: currentQuestion ? currentQuestion.content : 'Đánh giá phát biểu trực tiếp',
      selectedAnswer: status === 'correct' ? 'Đúng' : status === 'help' ? 'Cần hỗ trợ' : 'Chưa đúng',
      correctAnswer: 'Đúng',
      isCorrect: status === 'correct',
      timestamp: Date.now(),
      teamId: pickedStudent,
      teamName: pickedStudent
    };

    setAnswerLogs(prev => [...prev, newLog]);
    if (isQuestionActive) {
      setShowAnswer(true);
    }
  };

  // Step 3: Grade student answer
  const handleGrade = (isCorrect: boolean) => {
    handleQuickAction(isCorrect ? 'correct' : 'incorrect');
  };

  // Step 4: Next turn
  const handleNextTurn = () => {
    setPickedStudent(null);
    setCurrentQuestion(null);
    setIsQuestionActive(false);
    setShowAnswer(false);
    setSelectedOption(null);
    setIsTimerRunning(false);
  };

  // Reset called history
  const handleResetCalled = () => {
    setCalledStudents([]);
    soundFx.play('click');
  };

  // End Game
  const handleEnd = () => {
    const finalTeams = students.map((name, idx) => ({
      id: `student_${idx + 1}`,
      name,
      avatar: '🎓',
      color: '#4F683C',
      score: studentScores[name] || 0
    }));
    onGameEnd(finalTeams, answerLogs);
  };

  return (
    <div className="w-full h-full min-h-[640px] flex flex-col md:flex-row bg-[#FFFDF5] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#DCEBCB]">
      
      {/* CỘT TRÁI: QUẢN LÝ DANH SÁCH HỌC SINH (Scrollable & Fixed size) */}
      <div className="w-full md:w-80 lg:w-96 bg-[#F8F4E8] border-r-2 border-[#DCEBCB] p-4 sm:p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-[#35452E] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#4F683C]" />
              <span>Danh Sách Học Sinh</span>
            </h3>
            <span className="px-2.5 py-1 bg-[#4F683C] text-white text-xs font-black rounded-lg shadow-xs">
              {students.length} HS
            </span>
          </div>

          {/* Statistics Bar */}
          <div className="grid grid-cols-2 gap-2 bg-[#E9F0D9] p-2.5 rounded-xl border border-[#B9CDA0]">
            <div className="text-center">
              <span className="block text-[11px] font-bold text-[#74806B]">Còn lại</span>
              <span className="text-lg font-black text-[#4F683C]">{remainingStudents.length}</span>
            </div>
            <div className="text-center border-l border-[#B9CDA0]">
              <span className="block text-[11px] font-bold text-[#74806B]">Đã gọi</span>
              <span className="text-lg font-black text-[#D86C70]">{calledStudents.length}</span>
            </div>
          </div>

          {/* Toggle No-Repeat Mode */}
          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#DCEBCB] shadow-xs">
            <span className="text-xs font-bold text-[#35452E]">Chế độ không lặp lại:</span>
            <button
              type="button"
              onClick={() => setNoRepeat(!noRepeat)}
              className={`w-11 h-6 rounded-full transition p-1 relative cursor-pointer ${
                noRepeat ? 'bg-[#4F683C]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition transform ${
                  noRepeat ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Scrollable Editable Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#74806B]">
                Danh sách học sinh:
              </label>
              <StudentImportButton
                onImport={(imported) => {
                  if (imported.length > 0) {
                    setStudentsText(imported.join('\n'));
                  }
                }}
                variant="compact"
                buttonText="📁 Tải file Excel/CSV"
              />
            </div>
            <textarea 
              rows={6}
              className="w-full h-40 p-3 rounded-xl border-2 border-[#DCEBCB] focus:border-[#4F683C] focus:ring-2 focus:ring-[#4F683C]/20 bg-white font-bold text-xs text-[#35452E] resize-none outline-none custom-scrollbar shadow-inner"
              value={studentsText}
              onChange={(e) => setStudentsText(e.target.value)}
              placeholder="Nhập tên học sinh..."
            />
          </div>

          {/* List of called students preview */}
          {noRepeat && calledStudents.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#74806B]">Học sinh đã gọi lượt này:</span>
                <button
                  type="button"
                  onClick={handleResetCalled}
                  className="text-[11px] font-bold text-[#D86C70] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Đặt lại
                </button>
              </div>
              <div className="max-h-24 overflow-y-auto bg-white p-2 rounded-xl border border-[#DCEBCB] space-y-1 custom-scrollbar">
                {calledStudents.map((name, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-0.5 px-1.5 bg-slate-50 rounded text-slate-600 font-semibold">
                    <span>{name}</span>
                    <span className="text-[10px] text-[#4F683C] font-bold">
                      {studentScores[name] ? `+${studentScores[name]}đ` : '✓'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#DCEBCB] flex gap-2">
          <button
            type="button"
            onClick={handleEnd}
            className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs rounded-xl transition cursor-pointer"
          >
            Kết Thúc & Báo Cáo
          </button>
        </div>
      </div>

      {/* CỘT PHẢI: KHU VỰC QUAY TÊN & BỐC CÂU HỎI */}
      <div className="flex-1 relative overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-center custom-scrollbar">
        
        {/* Background gradient decorative glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#FEF9E7] via-[#FFFDF5] to-white pointer-events-none" />

        {/* TOP HEADER */}
        <div className="relative z-10 text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-black text-[#35452E] tracking-tight">
            🎯 GỌI TÊN NGẪU NHIÊN
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-[#74806B] mt-1">
            {pickedStudent 
              ? (isQuestionActive ? 'Học sinh đang trả lời câu hỏi!' : 'Đã gọi trúng tên! Bấm nút bên dưới để bốc câu hỏi.')
              : 'Bấm nút "QUAY TÊN NGẪU NHIÊN" để bốc thăm học sinh phát biểu'}
          </p>
        </div>

        {/* STAGE 1: NAME SPINNER ROULETTE & WINNER BANNER */}
        {!isQuestionActive && (
          <div className="relative z-10 flex flex-col items-center max-w-xl w-full">
            
            {/* Roulette Name Board */}
            <div className="w-full bg-[#35452E] p-6 sm:p-8 rounded-3xl border-4 border-[#E9D58F] shadow-[0_15px_40px_rgba(53,69,46,0.35)] text-center relative overflow-hidden">
              <div className="absolute top-2 left-4 text-xs font-black text-[#E9D58F] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bảng Quay Gọi Tên</span>
              </div>

              <div className="py-6 sm:py-8">
                <motion.div
                  key={displayRollName}
                  initial={{ y: -15, opacity: 0.7 }}
                  animate={{ y: 0, opacity: 1 }}
                  className={`text-3xl sm:text-5xl font-black tracking-tight ${
                    isRolling ? 'text-[#E9D58F]' : (pickedStudent ? 'text-[#FFFDF5]' : 'text-slate-400')
                  }`}
                >
                  {displayRollName}
                </motion.div>
              </div>

              {/* Rolling Animation Indicator */}
              {isRolling && (
                <div className="flex justify-center gap-1.5 pt-2">
                  <span className="w-2 h-2 rounded-full bg-[#E9D58F] animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-[#E9D58F] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-[#E9D58F] animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
            </div>

            {/* Winner Action Options */}
            <AnimatePresence>
              {pickedStudent && (
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="mt-6 text-center w-full space-y-4"
                >
                  {/* Quick Action Assessment Bar */}
                  <div className="bg-[#FFFDF5] p-3 rounded-2xl border-2 border-[#DCEBCB] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 max-w-lg mx-auto">
                    <div className="text-xs font-bold text-[#74806B] flex items-center gap-1.5">
                      <span>Đánh giá nhanh:</span>
                      {studentStatus[pickedStudent] && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          studentStatus[pickedStudent] === 'correct' 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                            : studentStatus[pickedStudent] === 'help'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-rose-100 text-rose-700 border border-rose-300'
                        }`}>
                          {studentStatus[pickedStudent] === 'correct' ? '✓ Đúng' : studentStatus[pickedStudent] === 'help' ? '🤝 Cần hỗ trợ' : '✗ Chưa đúng'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickAction('correct')}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                        title="Ghi nhận trả lời đúng (+10 điểm)"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Đúng (+10đ)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAction('help')}
                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                        title="Ghi nhận cần hỗ trợ (+5 điểm)"
                      >
                        <span>🤝 Cần hỗ trợ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAction('incorrect')}
                        className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                        title="Ghi nhận chưa đúng"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Chưa đúng</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 justify-center">
                    <button
                      type="button"
                      onClick={handlePickRandomQuestion}
                      className="px-8 py-3.5 bg-gradient-to-r from-[#4F683C] to-[#3D522B] hover:from-[#3D522B] hover:to-[#2B3B1E] text-white font-black text-base sm:text-lg rounded-2xl shadow-xl transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles className="w-5 h-5 text-[#E9D58F] fill-current" />
                      <span>Bốc Câu Hỏi Cho {pickedStudent}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRollName}
                      className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-2xl border-2 border-slate-300 shadow-sm transition cursor-pointer"
                    >
                      Quay Lại Tên Khác
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Initial Roll Button */}
            {!pickedStudent && (
              <div className="mt-8">
                <button 
                  type="button"
                  onClick={handleRollName}
                  disabled={isRolling || remainingStudents.length === 0}
                  className="px-10 py-4 bg-gradient-to-r from-[#4F683C] to-[#3D522B] hover:from-[#3D522B] hover:to-[#2B3B1E] text-white font-black text-xl sm:text-2xl rounded-2xl shadow-xl transition transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider flex items-center gap-3"
                >
                  <Shuffle className="w-6 h-6 text-[#E9D58F]" />
                  <span>{isRolling ? 'Đang Quay Tên...' : 'QUAY TÊN NGẪU NHIÊN'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* STAGE 2: QUESTION & ANSWER PANEL */}
        {isQuestionActive && currentQuestion && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative z-10 w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-[#DCEBCB] space-y-6"
          >
            {/* Header: Student Info & Timer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#DCEBCB]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E9F0D9] text-[#4F683C] flex items-center justify-center text-xl font-black shadow-xs shrink-0">
                  🎓
                </div>
                <div>
                  <div className="text-xs font-bold text-[#74806B] uppercase tracking-wider">Học sinh trả lời</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg sm:text-xl font-black text-[#35452E]">{pickedStudent}</span>
                    {studentStatus[pickedStudent] && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        studentStatus[pickedStudent] === 'correct' 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                          : studentStatus[pickedStudent] === 'help'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-700 border border-rose-300'
                      }`}>
                        {studentStatus[pickedStudent] === 'correct' ? '✓ Đúng' : studentStatus[pickedStudent] === 'help' ? '🤝 Cần hỗ trợ' : '✗ Chưa đúng'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Quick Action Badges */}
                <div className="hidden sm:flex items-center gap-1 bg-[#F8F4E8] p-1 rounded-xl border border-[#DCEBCB]">
                  <button
                    type="button"
                    onClick={() => handleQuickAction('correct')}
                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] rounded-lg transition cursor-pointer"
                    title="Chấm Đúng (+10đ)"
                  >
                    ✓ Đúng
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAction('help')}
                    className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] rounded-lg transition cursor-pointer"
                    title="Cần hỗ trợ (+5đ)"
                  >
                    🤝 Hỗ trợ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAction('incorrect')}
                    className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-[11px] rounded-lg transition cursor-pointer"
                    title="Chưa đúng (0đ)"
                  >
                    ✗ Sai
                  </button>
                </div>

                {/* Timer Pill */}
                {config.timerEnabled !== false && (
                  <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-black text-sm border-2 ${
                    timeLeft <= 5 
                      ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                      : 'bg-[#E9F0D9] border-[#B9CDA0] text-[#4F683C]'
                  }`}>
                    <Clock className="w-4 h-4" />
                    <span>{timeLeft}s</span>
                  </div>
                )}
              </div>
            </div>

            {/* Question Box */}
            <div className="space-y-4">
              <div className="text-xs font-extrabold text-[#74806B] uppercase tracking-wider">
                Câu hỏi #{questionIndex}
              </div>
              <p className="text-base sm:text-xl font-black text-[#35452E] leading-relaxed">
                {currentQuestion.content}
              </p>
            </div>

            {/* Options Grid (MCQ) */}
            {currentQuestion.options && currentQuestion.options.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion.options.map((opt, idx) => {
                  const isCorrectAnswer = (typeof currentQuestion.correct === 'number' && currentQuestion.correct === idx) ||
                                          (typeof currentQuestion.correct === 'string' && String(currentQuestion.correct).toUpperCase() === ['A','B','C','D'][idx]);
                  const isSelected = selectedOption === idx;

                  let optStyle = "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100";
                  if (showAnswer) {
                    if (isCorrectAnswer) {
                      optStyle = "bg-emerald-500 text-white border-emerald-600 shadow-md font-black";
                    } else if (isSelected) {
                      optStyle = "bg-rose-500 text-white border-rose-600";
                    }
                  } else if (isSelected) {
                    optStyle = "bg-[#4F683C] text-white border-[#3D522B]";
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => !showAnswer && setSelectedOption(idx)}
                      className={`p-3.5 rounded-2xl border-2 text-left font-bold text-xs sm:text-sm transition flex items-center gap-3 cursor-pointer ${optStyle}`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-black/10 flex items-center justify-center text-xs font-black shrink-0">
                        {['A', 'B', 'C', 'D'][idx]}
                      </span>
                      <span className="flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Explanation / Answer Reveal Box */}
            {showAnswer && currentQuestion.explanation && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-semibold text-amber-900 leading-relaxed">
                <span className="font-black">💡 Lời Giải: </span>
                {currentQuestion.explanation}
              </div>
            )}

            {/* Bottom Grading & Next Turn Actions */}
            <div className="pt-4 border-t border-[#DCEBCB] flex flex-wrap items-center justify-between gap-3">
              {!showAnswer ? (
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowAnswer(!showAnswer)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Hiện Đáp Án</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGrade(true)}
                    className="px-5 py-2.5 bg-[#4F683C] hover:bg-[#3D522B] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4 text-[#E9D58F]" />
                    <span>Chấm Đúng (+10đ)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGrade(false)}
                    className="px-5 py-2.5 bg-[#D86C70] hover:bg-[#C55A5E] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Chưa Đúng</span>
                  </button>
                </div>
              ) : (
                <div className="w-full flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextTurn}
                    className="px-8 py-3 bg-gradient-to-r from-[#4F683C] to-[#3D522B] hover:from-[#3D522B] hover:to-[#2B3B1E] text-white font-black text-sm sm:text-base rounded-2xl shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
                  >
                    <span>Gọi Học Sinh Tiếp Theo</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};
