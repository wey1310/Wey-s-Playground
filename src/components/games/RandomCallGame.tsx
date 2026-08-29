import React, { useState, useEffect, useRef } from 'react';
import { GameSetupConfig, Question, AnswerLog } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { soundFx } from '../../utils/audio';
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
  Play, 
  Layers, 
  Award, 
  UserCheck,
  History,
  ListOrdered,
  Copy,
  Check,
  Trash2,
  ArrowDownUp,
  FileSpreadsheet
} from 'lucide-react';
import { StudentImportButton } from '../StudentImportButton';
import { MathChemRenderer } from '../../utils/mathChemFormatter';
import { SessionHistoryLog, type SessionCallRecord } from '../SessionHistoryLog';

export type { SessionCallRecord };

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

  // Session History Log States
  const [sessionHistory, setSessionHistory] = useState<SessionCallRecord[]>([]);
  const sessionRoundRef = useRef<number>(0);

  // Batch Call Count (Number of students to call in one batch)
  const [batchCount, setBatchCount] = useState<number>(1);

  // Rolling / Spin States
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [displayRollNames, setDisplayRollNames] = useState<string[]>(['---']);
  const [pickedStudents, setPickedStudents] = useState<string[]>([]);
  const [activeStudentIndex, setActiveStudentIndex] = useState<number>(0);

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

  // Currently focused student in the picked batch
  const currentActiveStudent = pickedStudents[activeStudentIndex] || pickedStudents[0] || null;

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

  // Step 1: Start Name Roulette / Roll with Batch Selection Logic
  const handleRollName = () => {
    if (remainingStudents.length === 0) {
      alert("Đã gọi hết tất cả học sinh! Vui lòng bấm 'Đặt lại lượt' để bắt đầu vòng mới.");
      return;
    }
    if (isRolling) return;

    // Determine actual count to pick, capped to available remaining students
    const effectiveCount = Math.min(Math.max(1, batchCount), remainingStudents.length);

    soundFx.play('click');
    setIsRolling(true);
    setPickedStudents([]);
    setActiveStudentIndex(0);
    setIsQuestionActive(false);
    setCurrentQuestion(null);
    setShowAnswer(false);
    setSelectedOption(null);
    setIsTimerRunning(false);

    // Initialize display roll slots
    setDisplayRollNames(Array.from({ length: effectiveCount }, () => '...'));

    let iterations = 0;
    const maxIterations = 28;
    const speed = 60;

    const rollInterval = setInterval(() => {
      // Pick random candidates for each slot during animation
      const tempRolling: string[] = [];
      const poolCopy = [...remainingStudents];
      
      for (let i = 0; i < effectiveCount; i++) {
        if (poolCopy.length > 0) {
          const randIdx = Math.floor(Math.random() * poolCopy.length);
          tempRolling.push(poolCopy[randIdx]);
        } else {
          tempRolling.push(remainingStudents[Math.floor(Math.random() * remainingStudents.length)]);
        }
      }

      setDisplayRollNames(tempRolling);
      soundFx.play('hover');
      iterations++;

      if (iterations >= maxIterations) {
        clearInterval(rollInterval);
        setIsRolling(false);

        // Final random selection of effectiveCount unique students
        const shuffled = [...remainingStudents].sort(() => Math.random() - 0.5);
        const finalWinners = shuffled.slice(0, effectiveCount);

        setPickedStudents(finalWinners);
        setDisplayRollNames(finalWinners);
        soundFx.play('correct');

        if (noRepeat) {
          setCalledStudents(prev => [...prev, ...finalWinners]);
        }

        // Record into Session History Log
        const nextRound = sessionRoundRef.current + 1;
        sessionRoundRef.current = nextRound;
        const newRecord: SessionCallRecord = {
          id: `session_call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          roundNumber: nextRound,
          timestamp: Date.now(),
          batchSize: effectiveCount,
          students: finalWinners.map(name => ({
            name,
            status: 'called',
            score: 0,
          })),
        };
        setSessionHistory(prev => [...prev, newRecord]);

        confetti({
          particleCount: 120 + effectiveCount * 25,
          spread: 80 + effectiveCount * 10,
          origin: { y: 0.6 },
          colors: ['#E08283', '#E9D58F', '#F59E0B', '#3B82F6', '#EC4899']
        });
      }
    }, speed);
  };

  // Step 2: Random Pick Question for Student(s)
  const handlePickRandomQuestion = (targetStudentIdx?: number) => {
    soundFx.play('whoosh');
    if (typeof targetStudentIdx === 'number') {
      setActiveStudentIndex(targetStudentIdx);
    }

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
  const handleQuickAction = (status: 'correct' | 'incorrect' | 'help', targetStudentName?: string) => {
    const studentToScore = targetStudentName || currentActiveStudent;
    if (!studentToScore) return;
    setIsTimerRunning(false);

    setStudentStatus(prev => ({
      ...prev,
      [studentToScore]: status
    }));

    if (status === 'correct') {
      soundFx.play('correct');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      setStudentScores(prev => ({
        ...prev,
        [studentToScore]: (prev[studentToScore] || 0) + 10
      }));
    } else if (status === 'help') {
      soundFx.play('bonus');
      setStudentScores(prev => ({
        ...prev,
        [studentToScore]: (prev[studentToScore] || 0) + 5
      }));
    } else {
      soundFx.play('wrong');
    }

    // Sync Session History Log
    const scoreVal = status === 'correct' ? 10 : status === 'help' ? 5 : 0;
    setSessionHistory(prev => {
      return prev.map(rec => {
        const hasSt = rec.students.some(s => s.name === studentToScore);
        if (!hasSt) return rec;
        return {
          ...rec,
          students: rec.students.map(s => {
            if (s.name === studentToScore) {
              return { ...s, status, score: scoreVal };
            }
            return s;
          })
        };
      });
    });

    const newLog: AnswerLog = {
      questionId: currentQuestion ? currentQuestion.id : `quick_${Date.now()}`,
      questionContent: currentQuestion ? currentQuestion.content : 'Đánh giá phát biểu trực tiếp',
      selectedAnswer: status === 'correct' ? 'Đúng' : status === 'help' ? 'Cần hỗ trợ' : 'Chưa đúng',
      correctAnswer: 'Đúng',
      isCorrect: status === 'correct',
      timestamp: Date.now(),
      teamId: studentToScore,
      teamName: studentToScore
    };

    setAnswerLogs(prev => [...prev, newLog]);
    if (isQuestionActive) {
      setShowAnswer(true);
    }
  };

  // Batch Quick Action: Grade all picked students in one click
  const handleBatchQuickAction = (status: 'correct' | 'incorrect' | 'help') => {
    if (pickedStudents.length === 0) return;
    setIsTimerRunning(false);

    const updatedStatus = { ...studentStatus };
    const updatedScores = { ...studentScores };
    const newLogs: AnswerLog[] = [];
    const scoreVal = status === 'correct' ? 10 : status === 'help' ? 5 : 0;

    pickedStudents.forEach(student => {
      updatedStatus[student] = status;
      if (status === 'correct') {
        updatedScores[student] = (updatedScores[student] || 0) + 10;
      } else if (status === 'help') {
        updatedScores[student] = (updatedScores[student] || 0) + 5;
      }

      newLogs.push({
        questionId: currentQuestion ? currentQuestion.id : `quick_${Date.now()}_${student}`,
        questionContent: currentQuestion ? currentQuestion.content : 'Đánh giá phát biểu đợt gọi nhóm',
        selectedAnswer: status === 'correct' ? 'Đúng' : status === 'help' ? 'Cần hỗ trợ' : 'Chưa đúng',
        correctAnswer: 'Đúng',
        isCorrect: status === 'correct',
        timestamp: Date.now(),
        teamId: student,
        teamName: student
      });
    });

    // Sync all picked students in session history log
    setSessionHistory(prev => {
      return prev.map(rec => {
        return {
          ...rec,
          students: rec.students.map(s => {
            if (pickedStudents.includes(s.name)) {
              return { ...s, status, score: scoreVal };
            }
            return s;
          })
        };
      });
    });

    setStudentStatus(updatedStatus);
    setStudentScores(updatedScores);
    setAnswerLogs(prev => [...prev, ...newLogs]);

    if (status === 'correct') {
      soundFx.play('correct');
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
    } else if (status === 'help') {
      soundFx.play('bonus');
    } else {
      soundFx.play('wrong');
    }

    if (isQuestionActive) {
      setShowAnswer(true);
    }
  };

  // Toggle student status directly from session history list
  const handleToggleStudentStatusInHistory = (recordId: string, studentName: string) => {
    setSessionHistory(prev => {
      return prev.map(rec => {
        if (rec.id !== recordId) return rec;
        return {
          ...rec,
          students: rec.students.map(st => {
            if (st.name !== studentName) return st;
            const cycleMap: Record<string, 'correct' | 'help' | 'incorrect' | 'called'> = {
              'called': 'correct',
              'correct': 'help',
              'help': 'incorrect',
              'incorrect': 'called',
            };
            const nextStatus = cycleMap[st.status] || 'correct';
            const nextScore = nextStatus === 'correct' ? 10 : nextStatus === 'help' ? 5 : 0;
            const oldScore = st.score || 0;

            setStudentScores(sc => ({
              ...sc,
              [studentName]: Math.max(0, (sc[studentName] || 0) - oldScore + nextScore)
            }));

            if (nextStatus !== 'called') {
              setStudentStatus(s => ({ ...s, [studentName]: nextStatus }));
            }

            return {
              ...st,
              status: nextStatus,
              score: nextScore
            };
          })
        };
      });
    });
    soundFx.play('click');
  };

  // Clear session history log
  const handleClearSessionHistory = () => {
    if (sessionHistory.length === 0) return;
    setSessionHistory([]);
    sessionRoundRef.current = 0;
    soundFx.play('click');
  };

  // Step 3: Grade student answer
  const handleGrade = (isCorrect: boolean) => {
    handleQuickAction(isCorrect ? 'correct' : 'incorrect');
  };

  // Step 4: Next turn
  const handleNextTurn = () => {
    setPickedStudents([]);
    setActiveStudentIndex(0);
    setCurrentQuestion(null);
    setIsQuestionActive(false);
    setShowAnswer(false);
    setSelectedOption(null);
    setIsTimerRunning(false);
    setDisplayRollNames(['---']);
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
      color: '#E08283',
      score: studentScores[name] || 0
    }));
    onGameEnd(finalTeams, answerLogs);
  };

  return (
    <div className="w-full h-full min-h-[640px] flex flex-col md:flex-row bg-w-bg-card rounded-3xl overflow-hidden shadow-2xl border-4 border-w-accent-muted">
      
      {/* CỘT TRÁI: QUẢN LÝ DANH SÁCH HỌC SINH & CẤU HÌNH ĐỢT GỌI */}
      <div className="w-full md:w-80 lg:w-96 bg-w-bg-tag border-r-2 border-w-accent-muted p-4 sm:p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-w-text-main flex items-center gap-2">
              <Users className="w-5 h-5 text-w-primary-dark" />
              <span>Danh Sách Học Sinh</span>
            </h3>
            <span className="px-2.5 py-1 bg-w-primary-dark text-w-text-main text-xs font-black rounded-lg shadow-xs">
              {students.length} HS
            </span>
          </div>

          {/* Statistics Bar */}
          <div className="grid grid-cols-2 gap-2 bg-w-accent-light p-2.5 rounded-xl border border-w-accent-border">
            <div className="text-center">
              <span className="block text-[11px] font-bold text-w-text-muted">Còn lại</span>
              <span className="text-lg font-black text-w-primary-dark">{remainingStudents.length}</span>
            </div>
            <div className="text-center border-l border-w-accent-border">
              <span className="block text-[11px] font-bold text-w-text-muted">Đã gọi</span>
              <span className="text-lg font-black text-[#D86C70]">{calledStudents.length}</span>
            </div>
          </div>

          {/* Batch Count Selection UI Component */}
          <div className="space-y-2 bg-white p-3 rounded-2xl border-2 border-w-accent-muted shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-w-text-main flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-w-primary-dark" />
                <span>Số lượng gọi 1 lượt:</span>
              </label>
              <span className="px-2 py-0.5 bg-w-accent-light text-w-primary-dark text-xs font-black rounded-md border border-w-accent-border">
                {batchCount} HS
              </span>
            </div>

            {/* Quick batch presets chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setBatchCount(num)}
                  disabled={isRolling}
                  className={`flex-1 min-w-[42px] py-1 text-xs font-black rounded-lg transition border cursor-pointer ${
                    batchCount === num
                      ? 'bg-w-primary-dark text-w-text-main border-w-primary-hover shadow-xs'
                      : 'bg-w-bg-tag text-w-text-muted hover:bg-w-accent-light border-w-accent-muted'
                  } disabled:opacity-50`}
                >
                  {num} HS
                </button>
              ))}
            </div>

            {/* Dropdown / Stepper for Custom Batch Size */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-w-text-muted shrink-0">Tùy chọn:</span>
              <select
                value={batchCount}
                onChange={(e) => setBatchCount(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={isRolling}
                className="w-full bg-w-bg-tag border border-w-accent-muted text-w-text-main rounded-xl px-2.5 py-1 text-xs font-black focus:outline-none focus:border-w-primary-dark shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {Array.from({ length: Math.min(Math.max(students.length, 10), 30) }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>
                    Gọi {n} học sinh / lượt {n > remainingStudents.length && noRepeat ? `(Còn ${remainingStudents.length} HS)` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggle No-Repeat Mode */}
          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-w-accent-muted shadow-xs">
            <span className="text-xs font-bold text-w-text-main">Chế độ không lặp lại:</span>
            <button
              type="button"
              onClick={() => setNoRepeat(!noRepeat)}
              className={`w-11 h-6 rounded-full transition p-1 relative cursor-pointer ${
                noRepeat ? 'bg-w-primary-dark' : 'bg-slate-300'
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
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-w-text-muted">
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
              rows={5}
              className="w-full h-36 p-3 rounded-xl border-2 border-w-accent-muted focus:border-w-primary-dark focus:ring-2 focus:ring-w-primary-dark/20 bg-white font-bold text-xs text-w-text-main resize-none outline-none custom-scrollbar shadow-inner"
              value={studentsText}
              onChange={(e) => setStudentsText(e.target.value)}
              placeholder="Nhập tên học sinh..."
            />
          </div>

          {/* List of called students preview */}
          {noRepeat && calledStudents.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-w-text-muted">Học sinh đã gọi ({calledStudents.length}):</span>
                <button
                  type="button"
                  onClick={handleResetCalled}
                  className="text-[11px] font-bold text-[#D86C70] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Đặt lại
                </button>
              </div>
              <div className="max-h-24 overflow-y-auto bg-white p-2 rounded-xl border border-w-accent-muted space-y-1 custom-scrollbar">
                {calledStudents.map((name, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-0.5 px-1.5 bg-slate-50 rounded text-slate-600 font-semibold">
                    <span>{name}</span>
                    <span className="text-[10px] text-w-primary-dark font-bold">
                      {studentScores[name] ? `+${studentScores[name]}đ` : '✓'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-w-accent-muted flex gap-2">
          <button
            type="button"
            onClick={handleEnd}
            className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs rounded-xl transition cursor-pointer"
          >
            Kết Thúc & Báo Cáo
          </button>
        </div>
      </div>

      {/* CỘT PHẢI: KHU VỰC QUAY TÊN BATCH & BỐC CÂU HỎI */}
      <div className="flex-1 relative overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-center custom-scrollbar">
        
        {/* Background gradient decorative glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#FEF9E7] via-w-bg-card to-white pointer-events-none" />

        {/* TOP HEADER & BATCH BADGE */}
        <div className="relative z-10 text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-w-accent-light text-w-primary-dark text-xs font-black rounded-full border border-w-accent-border mb-2 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chế độ gọi: {batchCount > 1 ? `Đợt ${batchCount} Học Sinh Cùng Lúc` : '1 Học Sinh / Lượt'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-w-text-main tracking-tight">
            🎯 GỌI TÊN NGẪU NHIÊN
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-w-text-muted mt-1">
            {pickedStudents.length > 0
              ? (isQuestionActive 
                  ? `Đang trả lời câu hỏi (${pickedStudents.length > 1 ? `Đang chọn: ${currentActiveStudent}` : currentActiveStudent})` 
                  : `Đã chọn ${pickedStudents.length} học sinh! Giáo viên có thể chấm điểm nhanh hoặc bốc câu hỏi bên dưới.`)
              : `Bấm nút "QUAY GỌI ${batchCount} HỌC SINH" để bốc thăm ngẫu nhiên`}
          </p>
        </div>

        {/* STAGE 1: NAME SPINNER ROULETTE & WINNERS BANNER */}
        {!isQuestionActive && (
          <div className="relative z-10 flex flex-col items-center max-w-2xl w-full">
            
            {/* Roulette Multi-Slot Board */}
            <div className="w-full bg-w-text-main p-6 sm:p-8 rounded-3xl border-4 border-w-border shadow-[0_15px_40px_rgba(53,69,46,0.35)] text-center relative overflow-hidden">
              <div className="absolute top-3 left-4 text-xs font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bảng Quay Gọi Tên ({isRolling ? `Đang quay ${displayRollNames.length} bạn...` : `${displayRollNames.length} Học Sinh`})</span>
              </div>

              {/* Single Student View or Multi-Student Roll View */}
              {displayRollNames.length <= 1 ? (
                <div className="py-6 sm:py-8">
                  <motion.div
                    id="displayName"
                    data-state={isRolling ? 'rolling' : (pickedStudents.length > 0 ? 'selected' : 'idle')}
                    key={isRolling ? "rolling" : (displayRollNames[0] || "empty")}
                    initial={
                      pickedStudents.length > 0
                        ? { y: 24, scale: 0.92, opacity: 0 }
                        : { y: -12, opacity: 0.7 }
                    }
                    animate={
                      pickedStudents.length > 0
                        ? { y: [24, -8, 4, -2, 0], scale: [0.92, 1.05, 0.98, 1.01, 1], opacity: 1 }
                        : { y: 0, scale: 1, opacity: 1 }
                    }
                    transition={
                      pickedStudents.length > 0
                        ? { duration: 0.55, times: [0, 0.55, 0.72, 0.86, 1], ease: "easeOut" }
                        : { duration: 0.12 }
                    }
                    className={`text-3xl sm:text-5xl font-black tracking-tight ${
                      isRolling ? 'text-amber-500' : (pickedStudents.length > 0 ? 'text-w-bg-card drop-shadow-[0_4px_12px_rgba(233,213,143,0.5)]' : 'text-w-text-muted')
                    }`}
                  >
                    {displayRollNames[0] || '---'}
                  </motion.div>
                </div>
              ) : (
                <div className="pt-6 pb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {displayRollNames.map((name, idx) => (
                    <motion.div
                      key={isRolling ? `rolling_${idx}` : `final_${idx}_${name}`}
                      initial={pickedStudents.length > 0 ? { scale: 0.8, opacity: 0 } : { opacity: 0.8 }}
                      animate={pickedStudents.length > 0 ? { scale: 1, opacity: 1 } : { opacity: 1 }}
                      transition={{ delay: idx * 0.08, duration: 0.3 }}
                      className={`p-3.5 rounded-2xl border-2 flex items-center gap-2.5 text-left transition ${
                        pickedStudents.length > 0
                          ? 'bg-[#43573A] border-w-border text-w-bg-card shadow-md'
                          : 'bg-[#2E3C27] border-w-primary-dark text-amber-500'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-w-text-main font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-w-accent-muted font-extrabold uppercase">Học sinh {idx + 1}</div>
                        <div className="text-base sm:text-lg font-black truncate">{name}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Rolling Animation Indicator */}
              {isRolling && (
                <div className="flex justify-center gap-1.5 pt-2">
                  <span className="w-2 h-2 rounded-full bg-amber-100 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-amber-100 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-amber-100 animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
            </div>

            {/* Winner Action Options (Single or Multi-Student Cards) */}
            <AnimatePresence>
              {pickedStudents.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="mt-6 text-center w-full space-y-4"
                >
                  {/* Single Student Assessment Bar */}
                  {pickedStudents.length === 1 ? (
                    <div className="bg-w-bg-card p-3 rounded-2xl border-2 border-w-accent-muted shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 max-w-lg mx-auto">
                      <div className="text-xs font-bold text-w-text-muted flex items-center gap-1.5">
                        <span>Đánh giá {pickedStudents[0]}:</span>
                        {studentStatus[pickedStudents[0]] && (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            studentStatus[pickedStudents[0]] === 'correct' 
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                              : studentStatus[pickedStudents[0]] === 'help'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-rose-100 text-rose-700 border border-rose-300'
                          }`}>
                            {studentStatus[pickedStudents[0]] === 'correct' ? '✓ Đúng' : studentStatus[pickedStudents[0]] === 'help' ? '🤝 Cần hỗ trợ' : '✗ Chưa đúng'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickAction('correct', pickedStudents[0])}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-w-text-main font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                          title="Ghi nhận trả lời đúng (+10 điểm)"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Đúng (+10đ)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAction('help', pickedStudents[0])}
                          className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-w-text-main font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                          title="Ghi nhận cần hỗ trợ (+5 điểm)"
                        >
                          <span>🤝 Cần hỗ trợ</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAction('incorrect', pickedStudents[0])}
                          className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-w-text-main font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                          title="Ghi nhận chưa đúng"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Chưa đúng</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Multi-Student Individual Assessment & Focus Cards Grid */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2 px-1">
                        <span className="text-xs font-black text-w-text-main flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-w-primary-dark" />
                          <span>Danh sách {pickedStudents.length} học sinh được gọi đợt này:</span>
                        </span>
                        
                        {/* Batch Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleBatchQuickAction('correct')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-w-text-main font-bold text-[11px] rounded-lg shadow-2xs transition cursor-pointer"
                          >
                            ✓ Đúng Cả Đợt (+10đ)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBatchQuickAction('help')}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-w-text-main font-bold text-[11px] rounded-lg shadow-2xs transition cursor-pointer"
                          >
                            🤝 Hỗ Trợ Cả Đợt (+5đ)
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                        {pickedStudents.map((stName, idx) => {
                          const isCurrentActive = activeStudentIndex === idx;
                          const stState = studentStatus[stName];

                          return (
                            <div
                              key={stName}
                              className={`p-3 rounded-2xl border-2 transition flex flex-col justify-between gap-2 shadow-sm ${
                                isCurrentActive
                                  ? 'bg-[#F4F8F0] border-w-primary-dark ring-2 ring-w-primary-dark/30'
                                  : 'bg-white border-w-accent-muted hover:border-w-accent-border'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-w-accent-light text-w-primary-dark font-black text-xs flex items-center justify-center shrink-0">
                                    #{idx + 1}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-black text-w-text-main truncate">{stName}</div>
                                    <div className="text-[10px] text-w-text-muted font-semibold">
                                      Điểm: <span className="font-bold text-w-primary-dark">{studentScores[stName] || 0}đ</span>
                                    </div>
                                  </div>
                                </div>

                                {stState && (
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase shrink-0 ${
                                    stState === 'correct' 
                                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                                      : stState === 'help'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : 'bg-rose-100 text-rose-700 border border-rose-300'
                                  }`}>
                                    {stState === 'correct' ? '✓ Đúng' : stState === 'help' ? '🤝 Hỗ trợ' : '✗ Sai'}
                                  </span>
                                )}
                              </div>

                              {/* Individual student scoring actions */}
                              <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleQuickAction('correct', stName)}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-w-text-main rounded-lg text-[11px] font-bold border border-emerald-200 transition cursor-pointer"
                                    title="Chấm đúng (+10đ)"
                                  >
                                    ✓ Đúng
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickAction('help', stName)}
                                    className="px-2 py-1 bg-amber-50 hover:bg-amber-500 text-amber-800 hover:text-w-text-main rounded-lg text-[11px] font-bold border border-amber-200 transition cursor-pointer"
                                    title="Cần hỗ trợ (+5đ)"
                                  >
                                    🤝 Hỗ trợ
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickAction('incorrect', stName)}
                                    className="px-1.5 py-1 bg-rose-50 hover:bg-rose-500 text-rose-700 hover:text-w-text-main rounded-lg text-[11px] font-bold border border-rose-200 transition cursor-pointer"
                                    title="Chưa đúng"
                                  >
                                    ✗ Sai
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handlePickRandomQuestion(idx)}
                                  className="px-2.5 py-1 bg-w-primary-dark hover:bg-w-primary-hover text-w-text-main rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                                >
                                  <span>Bốc câu hỏi</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Primary Action Buttons */}
                  <div className="flex flex-wrap gap-3 justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => handlePickRandomQuestion(activeStudentIndex)}
                      className="px-8 py-3.5 bg-gradient-to-r from-w-primary-dark to-w-primary-hover hover:from-w-primary-hover hover:to-[#2B3B1E] text-w-text-main font-black text-base sm:text-lg rounded-2xl shadow-xl transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles className="w-5 h-5 text-amber-500 fill-current" />
                      <span>
                        {pickedStudents.length === 1 
                          ? `Bốc Câu Hỏi Cho ${pickedStudents[0]}` 
                          : `Bốc Câu Hỏi Cho ${currentActiveStudent || 'Nhóm Học Sinh'}`}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRollName}
                      className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-2xl border-2 border-slate-300 shadow-sm transition cursor-pointer flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Quay Đợt Mới ({batchCount} HS)</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Initial Roll Button */}
            {pickedStudents.length === 0 && (
              <div className="mt-8 flex flex-col items-center gap-3">
                <button 
                  type="button"
                  onClick={handleRollName}
                  disabled={isRolling || remainingStudents.length === 0}
                  className="px-10 py-4 bg-gradient-to-r from-w-primary-dark to-w-primary-hover hover:from-w-primary-hover hover:to-[#2B3B1E] text-w-text-main font-black text-xl sm:text-2xl rounded-2xl shadow-xl transition transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider flex items-center gap-3"
                >
                  <Shuffle className="w-6 h-6 text-amber-500" />
                  <span>
                    {isRolling 
                      ? `Đang Quay ${batchCount} Học Sinh...` 
                      : `QUAY GỌI ${batchCount} HỌC SINH`}
                  </span>
                </button>

                {/* Inline batch size hint & quick picker */}
                <div className="flex items-center gap-2 bg-w-bg-tag px-3.5 py-1.5 rounded-full border border-w-accent-muted text-xs font-bold text-w-text-muted">
                  <span>Chọn số lượng:</span>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setBatchCount(n)}
                      className={`px-2 py-0.5 rounded-md text-xs font-black transition ${
                        batchCount === n 
                          ? 'bg-w-primary-dark text-w-text-main shadow-2xs' 
                          : 'text-w-text-main hover:bg-w-accent-light'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <span className="text-w-primary-dark">|</span>
                  <select
                    value={batchCount}
                    onChange={(e) => setBatchCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-transparent text-xs font-black text-w-primary-dark focus:outline-none cursor-pointer"
                  >
                    {Array.from({ length: 15 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n} HS</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STAGE 2: QUESTION & ANSWER PANEL (ENHANCED FOR BATCH PARTICIPATION) */}
        {isQuestionActive && currentQuestion && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative z-10 w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-w-accent-muted space-y-6"
          >
            {/* Header: Student Info / Batch Selector & Timer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-w-accent-muted">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-w-accent-light text-w-primary-dark flex items-center justify-center text-xl font-black shadow-xs shrink-0">
                  🎓
                </div>
                <div>
                  <div className="text-xs font-bold text-w-text-muted uppercase tracking-wider">
                    {pickedStudents.length > 1 ? `Đợt gọi (${pickedStudents.length} học sinh)` : 'Học sinh trả lời'}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    {pickedStudents.length <= 1 ? (
                      <span className="text-lg sm:text-xl font-black text-w-text-main">{currentActiveStudent}</span>
                    ) : (
                      /* Clickable Tabs for Batch Members */
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {pickedStudents.map((st, idx) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setActiveStudentIndex(idx)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer ${
                              activeStudentIndex === idx
                                ? 'bg-w-primary-dark text-w-text-main shadow-xs'
                                : 'bg-w-bg-tag text-w-text-main hover:bg-w-accent-light border border-w-accent-muted'
                            }`}
                          >
                            <span>{st}</span>
                            {studentStatus[st] && (
                              <span className="text-[10px]">
                                {studentStatus[st] === 'correct' ? '✓' : studentStatus[st] === 'help' ? '🤝' : '✗'}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {currentActiveStudent && studentStatus[currentActiveStudent] && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        studentStatus[currentActiveStudent] === 'correct' 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                          : studentStatus[currentActiveStudent] === 'help'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-700 border border-rose-300'
                      }`}>
                        {studentStatus[currentActiveStudent] === 'correct' ? '✓ Đúng' : studentStatus[currentActiveStudent] === 'help' ? '🤝 Cần hỗ trợ' : '✗ Chưa đúng'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Quick Action Badges for active student */}
                <div className="hidden sm:flex items-center gap-1 bg-w-bg-tag p-1 rounded-xl border border-w-accent-muted">
                  <button
                    type="button"
                    onClick={() => handleQuickAction('correct', currentActiveStudent || undefined)}
                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-w-text-main font-bold text-[11px] rounded-lg transition cursor-pointer"
                    title="Chấm Đúng (+10đ)"
                  >
                    ✓ Đúng
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAction('help', currentActiveStudent || undefined)}
                    className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-w-text-main font-bold text-[11px] rounded-lg transition cursor-pointer"
                    title="Cần hỗ trợ (+5đ)"
                  >
                    🤝 Hỗ trợ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAction('incorrect', currentActiveStudent || undefined)}
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
            <div className="space-y-4">
              <div className="text-xs font-extrabold text-w-text-muted uppercase tracking-wider">
                Câu hỏi #{questionIndex}
              </div>
              <div className="text-base sm:text-xl font-black text-w-text-main leading-relaxed">
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

            {/* Bottom Grading & Next Turn Actions */}
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
                    <CheckCircle className="w-4 h-4 text-amber-500" />
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
                    onClick={handleNextTurn}
                    className="px-8 py-3 bg-gradient-to-r from-w-primary-dark to-w-primary-hover hover:from-w-primary-hover hover:to-[#2B3B1E] text-w-text-main font-black text-sm sm:text-base rounded-2xl shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
                  >
                    <span>Gọi Đợt Học Sinh Tiếp Theo</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* STAGE 3: SESSION HISTORY LOG (CHRONOLOGICAL CALLED STUDENTS LIST BELOW MAIN STAGE) */}
        <SessionHistoryLog
          history={sessionHistory}
          onToggleStudentStatus={handleToggleStudentStatusInHistory}
          onClearHistory={handleClearSessionHistory}
          studentScores={studentScores}
          totalCalledCount={calledStudents.length}
        />

      </div>
    </div>
  );
};
