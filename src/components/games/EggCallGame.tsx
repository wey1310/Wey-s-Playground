import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GameSetupConfig, Question, AnswerLog } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { soundFx } from '../../utils/audio';
import { StudentImportButton } from '../StudentImportButton';
import { MathChemRenderer } from '../../utils/mathChemFormatter';
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
  Trophy,
  Zap,
  Volume2,
  VolumeX,
  Star,
  Flame,
  Wand2
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
  themeIndex: number;
  mascot: string;
}

const EGG_THEMES = [
  {
    name: 'Hoàng Kim',
    gradient: 'from-amber-300 via-yellow-400 to-amber-600',
    border: 'border-amber-400',
    glow: 'rgba(251, 191, 36, 0.4)',
    accent: 'text-amber-700',
    bgLight: 'bg-amber-50',
    pattern: 'radial-gradient(circle, rgba(255,255,255,0.4) 10%, transparent 20%)',
  },
  {
    name: 'Ngọc Bích',
    gradient: 'from-emerald-300 via-teal-400 to-emerald-600',
    border: 'border-emerald-400',
    glow: 'rgba(52, 211, 153, 0.4)',
    accent: 'text-emerald-700',
    bgLight: 'bg-emerald-50',
    pattern: 'radial-gradient(circle, rgba(255,255,255,0.4) 10%, transparent 20%)',
  },
  {
    name: 'Hồng Ngọc',
    gradient: 'from-rose-300 via-pink-400 to-rose-600',
    border: 'border-rose-400',
    glow: 'rgba(251, 113, 133, 0.4)',
    accent: 'text-rose-700',
    bgLight: 'bg-rose-50',
    pattern: 'radial-gradient(circle, rgba(255,255,255,0.4) 10%, transparent 20%)',
  },
  {
    name: 'Lam Ngọc',
    gradient: 'from-sky-300 via-blue-400 to-indigo-600',
    border: 'border-sky-400',
    glow: 'rgba(56, 189, 248, 0.4)',
    accent: 'text-sky-700',
    bgLight: 'bg-sky-50',
    pattern: 'radial-gradient(circle, rgba(255,255,255,0.4) 10%, transparent 20%)',
  },
  {
    name: 'Thạch Anh Tím',
    gradient: 'from-purple-300 via-fuchsia-400 to-purple-600',
    border: 'border-purple-400',
    glow: 'rgba(192, 132, 252, 0.4)',
    accent: 'text-purple-700',
    bgLight: 'bg-purple-50',
    pattern: 'radial-gradient(circle, rgba(255,255,255,0.4) 10%, transparent 20%)',
  },
  {
    name: 'Cầu Vồng',
    gradient: 'from-amber-300 via-pink-400 to-cyan-500',
    border: 'border-fuchsia-400',
    glow: 'rgba(244, 114, 182, 0.4)',
    accent: 'text-fuchsia-700',
    bgLight: 'bg-fuchsia-50',
    pattern: 'radial-gradient(circle, rgba(255,255,255,0.4) 10%, transparent 20%)',
  },
];

const MASCOTS = ['🐣', '🐥', '🦄', '🐲', '🐧', '🦊', '🐼', '🐰', '🦁', '🦉', '🐨', '🦖'];

const playCrackSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    // Crack clicks
    const now = audioCtx.currentTime;
    for (let i = 0; i < 4; i++) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400 + Math.random() * 600, now + i * 0.15);
      gain.gain.setValueAtTime(0.12, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.08);
    }
  } catch (e) {}
};

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

  // Skip questions mode
  const skipQuestions = Boolean(
    config.mode === 'none' ||
    config.mode === 'no_questions' ||
    config.mode === 'skip_questions' ||
    config.randomCallSkipQuestions === true ||
    config.skipQuestions === true
  );

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
      score: 0,
      themeIndex: index % EGG_THEMES.length,
      mascot: MASCOTS[index % MASCOTS.length]
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
    playCrackSound();
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
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#98FB98', '#87CEFA', '#FF69B4']
      });
    }, 1100);
  };

  // Quick pick random unopened egg
  const handlePickRandomEgg = () => {
    const unopenedIndices = eggs
      .map((egg, idx) => (!egg.isOpened ? idx : -1))
      .filter(idx => idx !== -1);

    if (unopenedIndices.length === 0) {
      handleResetEggs();
      return;
    }

    const randomIdx = unopenedIndices[Math.floor(Math.random() * unopenedIndices.length)];
    handleSelectEgg(randomIdx);
  };

  // Step 2: Random pick question for current student
  const handlePickQuestionForCurrentStudent = () => {
    if (selectedEggIndex === null || skipQuestions) return;
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
    <div className="w-full h-full min-h-[100dvh] flex flex-col lg:flex-row bg-[#FAF8F5] text-w-text-main overflow-hidden font-sans select-none">
      
      {/* CỘT TRÁI: ĐIỀU KHIỂN & DANH SÁCH LỚP */}
      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-w-border bg-white/90 backdrop-blur-md p-4 sm:p-5 flex flex-col gap-4 shrink-0 shadow-sm z-20 overflow-y-auto">
        
        {/* Header Logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center text-xl shadow-md font-bold">
              🥚
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">Đập Trứng Gọi Tên</h1>
              <p className="text-[11px] font-semibold text-slate-500">Vườn trứng may mắn</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-200">
            {openedCount}/{eggs.length} Đã đập
          </span>
        </div>

        {/* Quick Pick CTA */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handlePickRandomEgg}
            disabled={crackingEggIndex !== null}
            className="w-full py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-98 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 fill-current text-yellow-200 animate-spin" />
            <span>ĐẬP TRỨNG NGẪU NHIÊN</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleResetEggs}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Làm mới vườn</span>
            </button>
            <button
              type="button"
              onClick={handleEnd}
              className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Báo Cáo</span>
            </button>
          </div>
        </div>

        {/* Danh Sách Học Sinh Box */}
        <div className="flex-1 flex flex-col gap-2 min-h-[220px]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-600" />
              <span>Danh Sách ({students.length})</span>
            </label>
            <StudentImportButton onImport={(names) => setStudentsText(names.join('\n'))} />
          </div>

          <textarea
            value={studentsText}
            onChange={(e) => setStudentsText(e.target.value)}
            placeholder="Nhập tên mỗi học sinh trên 1 dòng..."
            className="flex-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-none"
            rows={6}
          />
        </div>

        {/* Score Leaderboard Drawer */}
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-black text-amber-900 mb-2">
            <span className="flex items-center gap-1">
              <Award className="w-4 h-4 text-amber-600" /> Bảng Điểm Nhanh
            </span>
            <span>{Object.keys(studentScores).length} bạn có điểm</span>
          </div>
          <div className="max-h-28 overflow-y-auto space-y-1 pr-1 text-xs">
            {Object.keys(studentScores).length === 0 ? (
              <p className="text-[11px] text-amber-700/70 italic text-center py-2">Chưa có lượt chấm điểm</p>
            ) : (
              Object.entries(studentScores).sort((a, b) => b[1] - a[1]).map(([name, score], idx) => (
                <div key={name} className="flex items-center justify-between bg-white/80 px-2.5 py-1 rounded-xl border border-amber-100">
                  <span className="font-bold text-slate-800 truncate max-w-[150px]">
                    {idx + 1}. {name}
                  </span>
                  <span className="font-black text-amber-600">+{score}đ</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* CỘT PHẢI: MA TRẬN VƯỜN TRỨNG BÍ ẨN */}
      <div className="flex-1 relative overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-start custom-scrollbar">
        
        {/* Background ambient glow */}
        <div className="absolute inset-0 bg-radial from-amber-100/40 via-orange-50/20 to-transparent pointer-events-none" />

        {/* Header Title */}
        <div className="relative z-10 text-center mb-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/80 border border-amber-300/80 text-amber-900 text-xs font-extrabold shadow-2xs mb-2">
            <Wand2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Vườn Trứng Khởi Động Sôi Nổi</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {selectedEggIndex !== null ? `🎉 Đã Mở Trứng #${eggs[selectedEggIndex].id}!` : '🥚 Chạm Vào Quả Trứng Để Đập Vỡ'}
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">
            {selectedEggIndex !== null
              ? `Học sinh may mắn: ${eggs[selectedEggIndex].studentName}`
              : `Còn lại ${remainingCount} quả trứng bí mật đang chờ được gọi tên!`}
          </p>
        </div>

        {/* MA TRẬN TRỨNG (EGG GRID) */}
        {selectedEggIndex === null && (
          <div className="relative z-10 w-full max-w-5xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-3.5 sm:gap-4.5">
              {eggs.map((egg, idx) => {
                const isCracking = crackingEggIndex === idx;
                const theme = EGG_THEMES[egg.themeIndex];

                return (
                  <motion.div
                    key={egg.id}
                    whileHover={!egg.isOpened && crackingEggIndex === null ? { scale: 1.05, y: -4 } : {}}
                    whileTap={!egg.isOpened && crackingEggIndex === null ? { scale: 0.95 } : {}}
                    onClick={() => handleSelectEgg(idx)}
                    className={`relative p-4 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center justify-center min-h-[145px] sm:min-h-[165px] cursor-pointer select-none shadow-sm ${
                      egg.isOpened 
                        ? 'bg-slate-100/90 border-slate-200 opacity-85 cursor-default'
                        : isCracking
                        ? 'bg-amber-100 border-amber-500 shadow-xl ring-4 ring-amber-300/50'
                        : 'bg-white border-slate-200/90 hover:border-amber-400 hover:shadow-lg'
                    }`}
                  >
                    {/* Number Badge */}
                    <div className="absolute top-2.5 left-3 text-[11px] font-black text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                      #{egg.id}
                    </div>

                    {/* Egg Shell Visual */}
                    <div className="my-2 relative flex items-center justify-center">
                      {isCracking ? (
                        <motion.div
                          className="relative flex items-center justify-center text-5xl sm:text-6xl"
                          animate={{
                            rotate: [0, -15, 15, -15, 15, -8, 8, 0],
                            scale: [1, 1.25, 1.25, 1.25, 1.1, 1]
                          }}
                          transition={{ duration: 1.1, ease: "easeInOut" }}
                        >
                          <span className="filter drop-shadow-lg">⚡🥚</span>
                        </motion.div>
                      ) : egg.isOpened ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex flex-col items-center justify-center text-4xl sm:text-5xl"
                        >
                          <span className="filter drop-shadow-md">{egg.mascot}</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          className="relative w-14 h-18 sm:w-16 sm:h-20 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-gradient-to-b shadow-md flex items-center justify-center overflow-hidden border-2"
                          style={{
                            backgroundImage: `linear-gradient(to bottom, var(--tw-gradient-stops))`,
                            boxShadow: `0 8px 18px ${theme.glow}`
                          }}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: (idx % 6) * 0.2 }}
                        >
                          {/* Inner shine */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-95`} />
                          <div className="absolute top-1.5 left-2 w-4 h-6 bg-white/40 rounded-full blur-[1px] transform -rotate-25" />
                          <div className="absolute bottom-2 right-2 text-white/30 text-xs font-black">
                            ✨
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Status Text / Student Name */}
                    {egg.isOpened ? (
                      <div className="text-center mt-1 w-full px-1">
                        <span className="block text-xs sm:text-sm font-black text-slate-800 truncate">
                          {egg.studentName}
                        </span>
                        {egg.isCorrect !== null && (
                          <span className={`inline-block mt-0.5 text-[10px] font-black px-2 py-0.5 rounded-full ${
                            egg.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {egg.isCorrect ? '✓ +10đ' : '✗ 0đ'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-center mt-1">
                        <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                          isCracking ? 'bg-amber-500 text-white border-amber-600' : `${theme.bgLight} ${theme.accent} ${theme.border}`
                        }`}>
                          {isCracking ? 'Đang nở...' : 'Nhấp đập'}
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* All Eggs Opened Card */}
            {remainingCount === 0 && (
              <div className="mt-8 text-center bg-white p-6 sm:p-8 rounded-3xl border-2 border-amber-300 shadow-xl space-y-3 max-w-md mx-auto">
                <div className="text-5xl animate-bounce">🏆</div>
                <h3 className="text-xl font-black text-slate-900">Tất Cả Quả Trứng Đã Nở!</h3>
                <p className="text-xs text-slate-600">Toàn bộ danh sách học sinh đã được gọi tên hoàn tất.</p>
                <button
                  type="button"
                  onClick={handleResetEggs}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  Trộn Lại Vườn Trứng & Bắt Đầu Vòng Mới
                </button>
              </div>
            )}
          </div>
        )}

        {/* REVEALED STUDENT CARD & QUESTION FLOW */}
        {selectedEggIndex !== null && currentEgg && (
          <div className="relative z-10 w-full max-w-2xl flex flex-col items-center animate-fade-in">
            
            {/* STAGE A: STUDENT WINNER BANNER */}
            {!isQuestionActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-3 border-amber-300 text-center space-y-5"
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black">
                  <Sparkles className="w-4 h-4 text-amber-600 fill-current" />
                  <span>Quả Trứng May Mắn #{currentEgg.id}</span>
                </div>

                <div className="text-7xl sm:text-8xl leading-none filter drop-shadow-md">
                  {currentEgg.mascot}
                </div>

                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Học sinh được chọn:
                  </div>
                  <div className="text-3xl sm:text-5xl font-black text-slate-900 py-3 px-6 bg-amber-50/80 rounded-2xl border-2 border-amber-200 inline-block shadow-inner">
                    {currentEgg.studentName}
                  </div>
                </div>

                {/* Quick Action Assessment Bar */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-lg mx-auto">
                  <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
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
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Đúng (+10đ)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAction('help')}
                      className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>🤝 Hỗ trợ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAction('incorrect')}
                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Chưa đúng</span>
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 justify-center pt-2">
                  {!skipQuestions ? (
                    <>
                      <button
                        type="button"
                        onClick={handlePickQuestionForCurrentStudent}
                        className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
                      >
                        <Sparkles className="w-5 h-5 text-yellow-200 fill-current" />
                        <span>Bốc Câu Hỏi Cho {currentEgg.studentName}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleFinishTurn}
                        className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl border border-slate-300 transition cursor-pointer"
                      >
                        Quay Lại Vườn Trứng
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleFinishTurn}
                        className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
                      >
                        <Shuffle className="w-5 h-5 text-yellow-200" />
                        <span>⚡ ĐẬP QUẢ TRỨNG TIẾP THEO</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickAction('correct')}
                        className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base rounded-2xl shadow-md transition cursor-pointer flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-200" />
                        <span>✓ Chấm Đúng (+10đ)</span>
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* STAGE B: QUESTION & ANSWER PANEL */}
            {isQuestionActive && currentQuestion && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-slate-200 space-y-6"
              >
                {/* Header: Student Info & Timer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-slate-900 flex items-center justify-center text-2xl font-black shadow-xs shrink-0">
                      {currentEgg.mascot}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Đang trả lời (Trứng #{currentEgg.id})
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg sm:text-xl font-black text-slate-900">{currentEgg.studentName}</span>
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
                    {/* Timer Pill */}
                    {config.timerEnabled !== false && (
                      <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-black text-sm border-2 ${
                        timeLeft <= 5 
                          ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}>
                        <Clock className="w-4 h-4" />
                        <span>{timeLeft}s</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Question Box */}
                <div className="space-y-2">
                  <div className="text-xs font-extrabold text-amber-700 uppercase tracking-wider">
                    Câu hỏi #{questionIndex}
                  </div>
                  <div className="text-base sm:text-xl font-black text-slate-900 leading-relaxed">
                    <MathChemRenderer text={currentQuestion.content} />
                  </div>
                </div>

                {/* Options Grid (MCQ) */}
                {currentQuestion.options && currentQuestion.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentQuestion.options.map((opt, idx) => {
                      const isCorrectAnswer = (typeof currentQuestion.correct === 'number' && currentQuestion.correct === idx) ||
                                              (typeof currentQuestion.correct === 'string' && String(currentQuestion.correct).toUpperCase() === ['A','B','C','D'][idx]);
                      const isSelected = selectedOption === idx;

                      let optStyle = "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100";
                      if (showAnswer) {
                        if (isCorrectAnswer) {
                          optStyle = "bg-emerald-600 text-white border-emerald-700 shadow-md font-black";
                        } else if (isSelected) {
                          optStyle = "bg-rose-600 text-white border-rose-700";
                        }
                      } else if (isSelected) {
                        optStyle = "bg-amber-500 text-white border-amber-600 font-bold";
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => !showAnswer && setSelectedOption(idx)}
                          className={`p-3.5 rounded-2xl border-2 text-left font-bold text-xs sm:text-sm transition flex items-center gap-3 cursor-pointer ${optStyle}`}
                        >
                          <span className="w-6 h-6 rounded-lg bg-white/80 text-slate-900 flex items-center justify-center text-xs font-black shrink-0 shadow-2xs">
                            {['A', 'B', 'C', 'D'][idx]}
                          </span>
                          <span className="flex-1"><MathChemRenderer text={opt} /></span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Explanation / Answer Reveal Box */}
                {showAnswer && currentQuestion.explanation && (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-semibold text-amber-900 leading-relaxed">
                    <span className="font-black">💡 Lời Giải: </span>
                    <MathChemRenderer text={currentQuestion.explanation} />
                  </div>
                )}

                {/* Question Assessment & Turn End */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAnswer(prev => !prev)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{showAnswer ? 'Ẩn Đáp Án' : 'Xem Đáp Án'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickAction('correct')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Đúng (+10đ)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAction('incorrect')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Sai (0đ)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleFinishTurn}
                      className="px-5 py-2 bg-slate-900 hover:bg-black text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Hoàn Thành</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
