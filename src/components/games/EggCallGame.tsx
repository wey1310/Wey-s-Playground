import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GameSetupConfig, Question, AnswerLog } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { soundFx } from '../../utils/audio';
import { StudentImportButton } from '../StudentImportButton';
import { 
  Users, 
  Shuffle, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Clock, 
  Eye, 
  Sparkles, 
  ChevronRight, 
  HelpCircle,
  Award,
  Grid,
  Trophy
} from 'lucide-react';

interface GameProps {
  config: GameSetupConfig;
  questions?: Question[];
  onGameEnd: (teams: any[], logs: AnswerLog[]) => void;
}

interface EggItem {
  id: number;
  studentName: string;
  isOpened: boolean;
  isCorrect: boolean | null;
  score: number;
}

export const EggCallGame: React.FC<GameProps> = ({ config, questions = [], onGameEnd }) => {
  // Student List management with localStorage persistence
  const initialNames = useMemo(() => {
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
      'Vũ Thùy Linh', 'Đỗ Quang Minh', 'Bùi Hải Nam', 'Đặng Phương Nga', 'Trương Quốc Phong',
      'Ngô Gia Bảo', 'Đinh Khánh Huyền'
    ];
  }, [config.studentsList, config.teams]);

  const [studentsText, setStudentsText] = useState<string>(initialNames.join('\n'));
  const [students, setStudents] = useState<string[]>(initialNames);
  const [noRepeat, setNoRepeat] = useState<boolean>(config.noRepeatStudents !== false);
  const [studentScores, setStudentScores] = useState<Record<string, number>>({});

  // Egg Grid Setup
  const [eggs, setEggs] = useState<EggItem[]>([]);
  const [selectedEggIndex, setSelectedEggIndex] = useState<number | null>(null);
  const [crackingEggIndex, setCrackingEggIndex] = useState<number | null>(null);

  // Active Question & Turn States
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

  // Sync textarea with students array & initialize eggs
  useEffect(() => {
    const parsed = studentsText.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    setStudents(parsed);
    if (parsed.length > 0) {
      try {
        localStorage.setItem('wey_saved_students_list', JSON.stringify(parsed));
      } catch (e) {}
    }
  }, [studentsText]);

  // Distribute students into eggs
  const generateEggGrid = (studentList: string[]) => {
    if (studentList.length === 0) return [];
    
    // Shuffle student names into eggs
    const shuffledNames = [...studentList].sort(() => Math.random() - 0.5);
    return shuffledNames.map((name, index) => ({
      id: index + 1,
      studentName: name,
      isOpened: false,
      isCorrect: null,
      score: 0
    }));
  };

  // Initialize eggs on start or student changes
  useEffect(() => {
    if (students.length > 0) {
      setEggs(generateEggGrid(students));
      setSelectedEggIndex(null);
      setCrackingEggIndex(null);
      setIsQuestionActive(false);
      setCurrentQuestion(null);
    }
  }, [students]);

  // Statistics
  const openedCount = eggs.filter(e => e.isOpened).length;
  const remainingCount = eggs.length - openedCount;

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

  // Step 1: Click an egg on the grid to crack & reveal student
  const handleSelectEgg = (index: number) => {
    const egg = eggs[index];
    if (!egg || egg.isOpened || crackingEggIndex !== null) return;

    soundFx.play('click');
    setCrackingEggIndex(index);
    setSelectedEggIndex(null);
    setIsQuestionActive(false);
    setCurrentQuestion(null);
    setShowAnswer(false);
    setSelectedOption(null);
    setIsTimerRunning(false);

    // Shake & Crack delay
    setTimeout(() => {
      soundFx.play('correct');
      setCrackingEggIndex(null);
      setSelectedEggIndex(index);

      // Mark this egg as opened
      setEggs(prev => prev.map((e, idx) => idx === index ? { ...e, isOpened: true } : e));

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#98FB98', '#87CEFA', '#FF69B4']
      });
    }, 1200);
  };

  // Quick pick random unopened egg
  const handlePickRandomEgg = () => {
    const unopenedIndices = eggs
      .map((egg, idx) => (!egg.isOpened ? idx : -1))
      .filter(idx => idx !== -1);

    if (unopenedIndices.length === 0) {
      alert("Tất cả các quả trứng đã được mở! Vui lòng bấm 'Đặt lại vườn trứng' để bắt đầu vòng mới.");
      return;
    }

    const randomIdx = unopenedIndices[Math.floor(Math.random() * unopenedIndices.length)];
    handleSelectEgg(randomIdx);
  };

  // Step 2: Random pick question for current student
  const handlePickQuestionForCurrentStudent = () => {
    if (selectedEggIndex === null) return;
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
      const qNum = Math.floor(Math.random() * 50) + 1;
      setQuestionIndex(qNum);
      chosenQ = {
        id: `q_egg_${qNum}`,
        type: 'mcq',
        content: `Câu hỏi số ${qNum} (Giáo viên đọc câu hỏi bài học trong tài liệu ngoài)`,
        options: ['Đáp Án A', 'Đáp Án B', 'Đáp Án C', 'Đáp Án D'],
        correct: 0,
        explanation: 'Giáo viên đối chiếu đáp án với tài liệu bài học.'
      };
    }

    setCurrentQuestion(chosenQ);
    setIsQuestionActive(true);
    setShowAnswer(false);
    setSelectedOption(null);
    setTimeLeft(config.timeLimitSeconds || 30);
    setIsTimerRunning(config.timerEnabled !== false);
  };

  // Quick Action evaluation for EggCall
  const handleQuickAction = (status: 'correct' | 'incorrect' | 'help') => {
    if (selectedEggIndex === null) return;
    const studentName = eggs[selectedEggIndex].studentName;
    setIsTimerRunning(false);

    if (status === 'correct') {
      soundFx.play('correct');
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      setStudentScores(prev => ({
        ...prev,
        [studentName]: (prev[studentName] || 0) + 10
      }));
      setEggs(prev => prev.map((e, idx) => idx === selectedEggIndex ? { ...e, isCorrect: true, score: 10 } : e));
    } else if (status === 'help') {
      soundFx.play('bonus');
      setStudentScores(prev => ({
        ...prev,
        [studentName]: (prev[studentName] || 0) + 5
      }));
      setEggs(prev => prev.map((e, idx) => idx === selectedEggIndex ? { ...e, isCorrect: true, score: 5 } : e));
    } else {
      soundFx.play('wrong');
      setEggs(prev => prev.map((e, idx) => idx === selectedEggIndex ? { ...e, isCorrect: false, score: 0 } : e));
    }

    const newLog: AnswerLog = {
      questionId: currentQuestion ? currentQuestion.id : `egg_quick_${Date.now()}`,
      questionContent: currentQuestion ? currentQuestion.content : 'Đánh giá trả lời đập trứng',
      selectedAnswer: status === 'correct' ? 'Đúng' : status === 'help' ? 'Cần hỗ trợ' : 'Chưa đúng',
      correctAnswer: 'Đúng',
      isCorrect: status === 'correct',
      timestamp: Date.now(),
      teamId: studentName,
      teamName: studentName
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

  // Step 4: Close current turn card and return to egg grid
  const handleFinishTurn = () => {
    setSelectedEggIndex(null);
    setCurrentQuestion(null);
    setIsQuestionActive(false);
    setShowAnswer(false);
    setSelectedOption(null);
    setIsTimerRunning(false);
  };

  // Reset all eggs
  const handleResetEggs = () => {
    soundFx.play('click');
    setEggs(generateEggGrid(students));
    setSelectedEggIndex(null);
    setCrackingEggIndex(null);
    setIsQuestionActive(false);
    setCurrentQuestion(null);
  };

  // End Game
  const handleEnd = () => {
    const finalTeams = students.map((name, idx) => ({
      id: `student_${idx + 1}`,
      name,
      avatar: '🐣',
      color: '#E08283',
      score: studentScores[name] || 0
    }));
    onGameEnd(finalTeams, answerLogs);
  };

  const currentEgg = selectedEggIndex !== null ? eggs[selectedEggIndex] : null;

  return (
    <div className="w-full h-full min-h-[640px] flex flex-col md:flex-row bg-w-bg-card rounded-3xl overflow-hidden shadow-2xl border-4 border-w-accent-muted">
      
      {/* CỘT TRÁI: QUẢN LÝ DANH SÁCH & TRẠNG THÁI VƯỜN TRỨNG (Scrollable & Fixed size) */}
      <div className="w-full md:w-80 lg:w-96 bg-w-bg-tag border-r-2 border-w-accent-muted p-4 sm:p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-w-text-main flex items-center gap-2">
              <Users className="w-5 h-5 text-w-primary-dark" />
              <span>Vườn Trứng ({eggs.length} Quả)</span>
            </h3>
            <span className="px-2.5 py-1 bg-w-primary-dark text-w-text-main text-xs font-black rounded-lg shadow-xs">
              {students.length} HS
            </span>
          </div>

          {/* Statistics Bar */}
          <div className="grid grid-cols-2 gap-2 bg-w-accent-light p-2.5 rounded-xl border border-w-accent-border">
            <div className="text-center">
              <span className="block text-[11px] font-bold text-w-text-muted">Chưa mở</span>
              <span className="text-lg font-black text-w-primary-dark">{remainingCount}</span>
            </div>
            <div className="text-center border-l border-w-accent-border">
              <span className="block text-[11px] font-bold text-w-text-muted">Đã đập</span>
              <span className="text-lg font-black text-[#D86C70]">{openedCount}</span>
            </div>
          </div>

          {/* Quick Action Button: Random Pick Egg */}
          <button
            type="button"
            onClick={handlePickRandomEgg}
            disabled={remainingCount === 0 || crackingEggIndex !== null}
            className="w-full py-3 bg-gradient-to-r from-[#D86C70] to-[#C55A5E] hover:from-[#C55A5E] hover:to-[#A84B4E] text-w-text-main font-black text-xs sm:text-sm rounded-xl shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            <Shuffle className="w-4 h-4 text-w-text-main" />
            <span>Chọn Ngẫu Nhiên 1 Quả Trứng</span>
          </button>

          {/* Scrollable Editable Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-w-text-muted">
                Danh sách học sinh:
              </label>
              <div className="flex items-center gap-1">
                <StudentImportButton
                  onImport={(imported) => {
                    if (imported.length > 0) {
                      setStudentsText(imported.join('\n'));
                    }
                  }}
                  variant="compact"
                  buttonText="📁 File Excel/CSV"
                />
                <button
                  type="button"
                  onClick={handleResetEggs}
                  className="text-[11px] font-bold text-w-primary-dark hover:underline cursor-pointer flex items-center gap-1 px-1.5 py-0.5 rounded bg-w-accent-light"
                  title="Trộn lại và đặt lại tất cả trứng"
                >
                  <RotateCcw className="w-3 h-3" /> Trộn Lại
                </button>
              </div>
            </div>
            <textarea 
              rows={5}
              className="w-full h-36 p-3 rounded-xl border-2 border-w-accent-muted focus:border-w-primary-dark focus:ring-2 focus:ring-w-primary-dark/20 bg-white font-bold text-xs text-w-text-main resize-none outline-none custom-scrollbar shadow-inner"
              value={studentsText}
              onChange={(e) => setStudentsText(e.target.value)}
              placeholder="Nhập tên học sinh..."
            />
          </div>

          {/* Opened Eggs / Students List */}
          {openedCount > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-w-text-muted">Học sinh đã xuất hiện:</span>
              <div className="max-h-24 overflow-y-auto bg-white p-2 rounded-xl border border-w-accent-muted space-y-1 custom-scrollbar">
                {eggs.filter(e => e.isOpened).map(egg => (
                  <div key={egg.id} className="flex items-center justify-between text-xs py-0.5 px-2 bg-slate-50 rounded text-slate-700 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span>🥚 #{egg.id}</span>
                      <span className="font-bold text-w-text-main">{egg.studentName}</span>
                    </span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                      egg.isCorrect === true ? 'bg-emerald-100 text-emerald-800' :
                      egg.isCorrect === false ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {egg.isCorrect === true ? '+10đ' : egg.isCorrect === false ? '0đ' : 'Đã gọi'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-w-accent-muted flex gap-2">
          <button
            type="button"
            onClick={handleEnd}
            className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs rounded-xl transition cursor-pointer"
          >
            Kết Thúc & Báo Cáo
          </button>
        </div>
      </div>

      {/* CỘT PHẢI: MA TRẬN VƯỜN TRỨNG BÍ ẨN (EGG GRID LIKE OPENBOX) */}
      <div className="flex-1 relative overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-start custom-scrollbar">
        
        {/* Decorative background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#FEF9E7] via-w-bg-card to-white pointer-events-none" />

        {/* Header Title */}
        <div className="relative z-10 text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-black text-w-text-main tracking-tight flex items-center justify-center gap-2">
            <span>🥚 ĐẬP TRỨNG GỌI TÊN</span>
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-w-text-muted mt-1">
            {selectedEggIndex !== null
              ? `Đã đập trúng quả trứng #${eggs[selectedEggIndex].id}! Nhấn nút bên dưới để bốc câu hỏi.`
              : 'Chọn bất kỳ quả trứng nào bên dưới để đập vỡ và hé lộ tên học sinh may mắn'}
          </p>
        </div>

        {/* MA TRẬN TRỨNG (EGG GRID) */}
        {selectedEggIndex === null && (
          <div className="relative z-10 w-full max-w-4xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-5">
              {eggs.map((egg, idx) => {
                const isCracking = crackingEggIndex === idx;

                return (
                  <motion.div
                    key={egg.id}
                    whileHover={!egg.isOpened && crackingEggIndex === null ? { scale: 1.06, y: -4 } : {}}
                    whileTap={!egg.isOpened && crackingEggIndex === null ? { scale: 0.96 } : {}}
                    onClick={() => handleSelectEgg(idx)}
                    className={`relative p-4 rounded-3xl border-3 transition-all duration-300 flex flex-col items-center justify-center min-h-[140px] sm:min-h-[160px] cursor-pointer select-none shadow-md ${
                      egg.isOpened 
                        ? 'bg-gradient-to-b from-[#FAF3D1] to-[#EFE2B3] border-[#E9D58F] opacity-90 cursor-default'
                        : isCracking
                        ? 'bg-gradient-to-b from-amber-100 to-amber-200 border-amber-400 shadow-xl'
                        : 'bg-gradient-to-b from-white to-[#F9F6EA] border-w-accent-muted hover:border-w-primary-dark hover:shadow-xl'
                    }`}
                  >
                    {/* Number Badge */}
                    <div className="absolute top-2.5 left-3 text-[11px] font-black text-w-text-muted bg-white/90 px-2 py-0.5 rounded-full border border-w-accent-muted shadow-2xs">
                      #{egg.id}
                    </div>

                    {/* Egg Visual & Animation */}
                    <div className="my-2">
                      <motion.div
                        className="text-5xl sm:text-6xl filter drop-shadow-md"
                        animate={
                          isCracking ? {
                            rotate: [0, -18, 18, -18, 18, -10, 10, 0],
                            scale: [1, 1.2, 1.2, 1.2, 1]
                          } : egg.isOpened ? {
                            scale: [1, 1.1, 1]
                          } : {
                            y: [0, -3, 0]
                          }
                        }
                        transition={
                          isCracking ? { duration: 1.2, ease: "easeInOut" } :
                          egg.isOpened ? { duration: 0.4 } :
                          { duration: 3, repeat: Infinity, ease: "easeInOut", delay: idx * 0.15 }
                        }
                      >
                        {egg.isOpened ? '🐣' : (isCracking ? '⚡' : '🥚')}
                      </motion.div>
                    </div>

                    {/* Status Text / Student Name */}
                    {egg.isOpened ? (
                      <div className="text-center mt-1">
                        <span className="block text-xs sm:text-sm font-black text-w-text-main truncate max-w-[130px]">
                          {egg.studentName}
                        </span>
                        {egg.isCorrect !== null && (
                          <span className={`inline-block mt-0.5 text-[10px] font-black px-2 py-0.2 rounded-full ${
                            egg.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {egg.isCorrect ? '✓ Đúng (+10đ)' : '✗ Chưa đúng'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-center mt-1">
                        <span className="text-xs font-black text-w-primary-dark bg-w-accent-light px-2.5 py-0.5 rounded-full border border-w-accent-border">
                          {isCracking ? 'Đang Đập...' : 'Nhấp Đập Trứng'}
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* All Eggs Opened Trophy View */}
            {remainingCount === 0 && (
              <div className="mt-8 text-center bg-white p-6 rounded-3xl border-2 border-w-accent-muted shadow-xl space-y-3">
                <div className="text-5xl">🏆</div>
                <h3 className="text-xl font-black text-w-text-main">Đã Mở Hết Tất Cả Quả Trứng Trong Vườn!</h3>
                <p className="text-xs text-w-text-muted">Tất cả học sinh đã hoàn thành lượt gọi tên.</p>
                <button
                  type="button"
                  onClick={handleResetEggs}
                  className="px-6 py-2.5 bg-w-primary-dark hover:bg-w-primary-hover text-w-text-main font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  Trộn Lại Vườn Trứng & Bắt Đầu Vòng Mới
                </button>
              </div>
            )}
          </div>
        )}

        {/* REVEALED STUDENT CARD & QUESTION FLOW */}
        {selectedEggIndex !== null && currentEgg && (
          <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
            
            {/* STAGE A: STUDENT WINNER BANNER */}
            {!isQuestionActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-3 border-[#E9D58F] text-center space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF3D1] text-[#7A6218] border border-[#E9D58F] text-xs font-black">
                  <Sparkles className="w-4 h-4 text-amber-500 fill-current" />
                  <span>Quả Trứng May Mắn #{currentEgg.id}</span>
                </div>

                <div className="text-7xl leading-none">🐣</div>

                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-w-text-muted mb-1">
                    Học sinh xuất hiện bên trong trứng:
                  </div>
                  <div className="text-3xl sm:text-5xl font-black text-w-text-main py-2 px-4 bg-w-accent-light rounded-2xl border-2 border-w-accent-border inline-block shadow-inner">
                    {currentEgg.studentName}
                  </div>
                </div>

                {/* Quick Action Assessment Bar for Egg */}
                <div className="bg-w-bg-card p-3 rounded-2xl border-2 border-w-accent-muted shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 max-w-lg mx-auto">
                  <div className="text-xs font-bold text-w-text-muted flex items-center gap-1.5">
                    <span>Đánh giá nhanh:</span>
                    {currentEgg.isCorrect !== null && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        currentEgg.isCorrect 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                          : 'bg-rose-100 text-rose-700 border border-rose-300'
                      }`}>
                        {currentEgg.isCorrect ? (currentEgg.score === 5 ? '🤝 Cần hỗ trợ' : '✓ Đúng') : '✗ Chưa đúng'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickAction('correct')}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-w-text-main font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                      title="Ghi nhận trả lời đúng (+10 điểm)"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Đúng (+10đ)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAction('help')}
                      className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-w-text-main font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                      title="Ghi nhận cần hỗ trợ (+5 điểm)"
                    >
                      <span>🤝 Cần hỗ trợ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAction('incorrect')}
                      className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-w-text-main font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                      title="Ghi nhận chưa đúng"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Chưa đúng</span>
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 justify-center pt-2">
                  <button
                    type="button"
                    onClick={handlePickQuestionForCurrentStudent}
                    className="px-8 py-3.5 bg-gradient-to-r from-w-primary-dark to-w-primary-hover hover:from-w-primary-hover hover:to-[#2B3B1E] text-w-text-main font-black text-base sm:text-lg rounded-2xl shadow-xl transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5 text-[#E9D58F] fill-current" />
                    <span>Bốc Câu Hỏi Cho {currentEgg.studentName}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFinishTurn}
                    className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl border border-slate-300 transition cursor-pointer"
                  >
                    Quay Lại Vườn Trứng
                  </button>
                </div>
              </motion.div>
            )}

            {/* STAGE B: QUESTION & ANSWER PANEL */}
            {isQuestionActive && currentQuestion && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-w-accent-muted space-y-6"
              >
                {/* Header: Student Info & Timer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-w-accent-muted">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-w-accent-light text-w-primary-dark flex items-center justify-center text-2xl font-black shadow-xs shrink-0">
                      🐣
                    </div>
                    <div>
                      <div className="text-xs font-bold text-w-text-muted uppercase tracking-wider">
                        Đang trả lời (Trứng #{currentEgg.id})
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg sm:text-xl font-black text-w-text-main">{currentEgg.studentName}</span>
                        {currentEgg.isCorrect !== null && (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            currentEgg.isCorrect 
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                              : 'bg-rose-100 text-rose-700 border border-rose-300'
                          }`}>
                            {currentEgg.isCorrect ? (currentEgg.score === 5 ? '🤝 Cần hỗ trợ' : '✓ Đúng') : '✗ Chưa đúng'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quick Action Badges */}
                    <div className="hidden sm:flex items-center gap-1 bg-w-bg-tag p-1 rounded-xl border border-w-accent-muted">
                      <button
                        type="button"
                        onClick={() => handleQuickAction('correct')}
                        className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-w-text-main font-bold text-[11px] rounded-lg transition cursor-pointer"
                        title="Chấm Đúng (+10đ)"
                      >
                        ✓ Đúng
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAction('help')}
                        className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-w-text-main font-bold text-[11px] rounded-lg transition cursor-pointer"
                        title="Cần hỗ trợ (+5đ)"
                      >
                        🤝 Hỗ trợ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAction('incorrect')}
                        className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-w-text-main font-bold text-[11px] rounded-lg transition cursor-pointer"
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
                          : 'bg-w-accent-light border-w-accent-border text-w-primary-dark'
                      }`}>
                        <Clock className="w-4 h-4" />
                        <span>{timeLeft}s</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Question Box */}
                <div className="space-y-3">
                  <div className="text-xs font-extrabold text-w-text-muted uppercase tracking-wider">
                    Câu hỏi #{questionIndex}
                  </div>
                  <p className="text-base sm:text-xl font-black text-w-text-main leading-relaxed">
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
                          optStyle = "bg-emerald-500 text-w-text-main border-emerald-600 shadow-md font-black";
                        } else if (isSelected) {
                          optStyle = "bg-rose-500 text-w-text-main border-rose-600";
                        }
                      } else if (isSelected) {
                        optStyle = "bg-w-primary-dark text-w-text-main border-w-primary-hover";
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => !showAnswer && setSelectedOption(idx)}
                          className={`p-3.5 rounded-2xl border-2 text-left font-bold text-xs sm:text-sm transition flex items-center gap-3 cursor-pointer ${optStyle}`}
                        >
                          <span className="w-6 h-6 rounded-lg bg-white/70 backdrop-blur-sm flex items-center justify-center text-xs font-black shrink-0">
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

                {/* Bottom Grading & Finish Turn Actions */}
                <div className="pt-4 border-t border-w-accent-muted flex flex-wrap items-center justify-between gap-3">
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
                        className="px-5 py-2.5 bg-w-primary-dark hover:bg-w-primary-hover text-w-text-main font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4 text-[#E9D58F]" />
                        <span>Chấm Đúng (+10đ)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleGrade(false)}
                        className="px-5 py-2.5 bg-[#D86C70] hover:bg-[#C55A5E] text-w-text-main font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Chưa Đúng</span>
                      </button>
                    </div>
                  ) : (
                    <div className="w-full flex justify-end">
                      <button
                        type="button"
                        onClick={handleFinishTurn}
                        className="px-8 py-3 bg-gradient-to-r from-w-primary-dark to-w-primary-hover hover:from-w-primary-hover hover:to-[#2B3B1E] text-w-text-main font-black text-sm sm:text-base rounded-2xl shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
                      >
                        <span>Xong • Trở Lại Vườn Trứng</span>
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
