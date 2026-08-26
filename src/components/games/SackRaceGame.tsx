import React, { useState, useEffect } from 'react';
import { Trophy, Sparkles, Clock, Zap, CheckCircle2, XCircle, Award, Flag, ChevronRight } from 'lucide-react';
import { GameSetupConfig, Question, Team, AnswerLog } from '../../types';
import { soundFx } from '../../utils/audio';

interface SackRaceGameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: Team[], logs: AnswerLog[]) => void;
}

export const SackRaceGame: React.FC<SackRaceGameProps> = ({
  config,
  questions,
  onGameEnd,
}) => {
  // Config parameters
  const trackLength = config.trackLength || 7; // Steps to reach finish line
  const stepPerCorrect = config.stepPerCorrect || 1;
  const penaltyStepsWrong = config.penaltyStepsWrong || 0; // 0 = stand still, 1 = move back 1 step
  const pointsCorrect = config.pointsPerCorrect || 10;
  const pointsWrong = config.pointsPerWrong || 0;
  const timeLimit = config.timerEnabled ? (config.timeLimitSeconds || 30) : 0;

  // Teams & positions
  const [teams, setTeams] = useState<Team[]>(() => {
    if (config.teams && config.teams.length > 0) {
      return config.teams.map(t => ({ ...t, score: 0 }));
    }
    return [
      { id: 'team_1', name: 'Đội Đỏ', avatar: '🦁', color: '#ef4444', score: 0 },
      { id: 'team_2', name: 'Đội Xanh', avatar: '🦅', color: '#3b82f6', score: 0 },
      { id: 'team_3', name: 'Đội Vàng', avatar: '🐯', color: '#f59e0b', score: 0 },
    ];
  });

  const [teamPositions, setTeamPositions] = useState<number[]>(() => new Array(teams.length).fill(0));
  const [jumpingTeamIndex, setJumpingTeamIndex] = useState<number | null>(null);
  const [currentTurnTeamIndex, setCurrentTurnTeamIndex] = useState<number>(0);

  // Question list
  const activeQuestions = React.useMemo(() => {
    if (!questions || questions.length === 0) {
      return [
        {
          id: 'q_sack_1',
          content: 'Hành tinh nào gần Mặt Trời nhất trong Hệ Mặt Trời?',
          options: ['Sao Thủy', 'Sao Kim', 'Trái Đất', 'Sao Hỏa'],
          correct: 0,
        },
        {
          id: 'q_sack_2',
          content: 'Quốc gia nào có diện tích lớn nhất thế giới?',
          options: ['Nga', 'Canada', 'Hoa Kỳ', 'Trung Quốc'],
          correct: 0,
        },
      ];
    }
    const maxQ = config.totalQuestionsNumber || config.numberOfQuestions || questions.length;
    return questions.slice(0, maxQ);
  }, [questions, config.totalQuestionsNumber, config.numberOfQuestions]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const currentQuestion = activeQuestions[currentQuestionIndex] || activeQuestions[0];

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(timeLimit);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);
  const [winnerTeam, setWinnerTeam] = useState<Team | null>(null);

  // Timer per question
  useEffect(() => {
    if (!config.timerEnabled || timeLimit <= 0 || isAnswerRevealed || winnerTeam) return;

    setTimeLeft(timeLimit);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeOut();
          return 0;
        }
        if (prev <= 5) soundFx.timerTick();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestionIndex, isAnswerRevealed, winnerTeam, config.timerEnabled, timeLimit]);

  const handleTimeOut = () => {
    soundFx.wrong();
    setIsAnswerRevealed(true);
    const activeTeam = teams[currentTurnTeamIndex] || teams[0];

    const log: AnswerLog = {
      questionNumber: currentQuestionIndex + 1,
      questionId: currentQuestion.id,
      questionText: currentQuestion.content,
      correctAnswer: typeof currentQuestion.correct === 'number' && currentQuestion.options ? currentQuestion.options[currentQuestion.correct] : String(currentQuestion.correct),
      teamName: activeTeam.name,
      teamId: activeTeam.id,
      isCorrect: false,
      selectedAnswer: 'Hết giờ nhảy bao bố',
      timestamp: Date.now(),
    };
    setAnswerLogs(prev => [...prev, log]);
  };

  const handleAnswer = (optIndex: number) => {
    if (isAnswerRevealed || winnerTeam) return;

    setSelectedOption(optIndex);
    setIsAnswerRevealed(true);

    const isCorrect = optIndex === currentQuestion.correct;
    const activeTeam = teams[currentTurnTeamIndex] || teams[0];

    const log: AnswerLog = {
      questionNumber: currentQuestionIndex + 1,
      questionId: currentQuestion.id,
      questionText: currentQuestion.content,
      correctAnswer: typeof currentQuestion.correct === 'number' && currentQuestion.options ? currentQuestion.options[currentQuestion.correct] : String(currentQuestion.correct),
      selectedAnswer: currentQuestion.options ? currentQuestion.options[optIndex] : String(optIndex),
      isCorrect,
      teamName: activeTeam.name,
      teamId: activeTeam.id,
      timestamp: Date.now(),
    };
    setAnswerLogs(prev => [...prev, log]);

    if (isCorrect) {
      soundFx.correct();
      soundFx.powerup();

      // Trigger sack jumping animation
      setJumpingTeamIndex(currentTurnTeamIndex);
      setTimeout(() => setJumpingTeamIndex(null), 700);

      // Advance team position
      setTeamPositions(prev => {
        const next = [...prev];
        const newPos = Math.min(trackLength, next[currentTurnTeamIndex] + stepPerCorrect);
        next[currentTurnTeamIndex] = newPos;

        // Check if crossed finish line
        if (newPos >= trackLength) {
          setTimeout(() => {
            soundFx.winFanfare();
            setWinnerTeam(activeTeam);
          }, 600);
        }
        return next;
      });

      // Award points
      setTeams(prev => prev.map((t, idx) => {
        if (idx === currentTurnTeamIndex) return { ...t, score: t.score + pointsCorrect };
        return t;
      }));
    } else {
      soundFx.wrong();
      if (penaltyStepsWrong > 0) {
        setTeamPositions(prev => {
          const next = [...prev];
          next[currentTurnTeamIndex] = Math.max(0, next[currentTurnTeamIndex] - penaltyStepsWrong);
          return next;
        });
      }
      if (pointsWrong > 0) {
        setTeams(prev => prev.map((t, idx) => {
          if (idx === currentTurnTeamIndex) return { ...t, score: Math.max(0, t.score - pointsWrong) };
          return t;
        }));
      }
    }
  };

  const handleNextTurn = () => {
    setIsAnswerRevealed(false);
    setSelectedOption(null);

    // Cycle team turn
    if (teams.length > 1) {
      setCurrentTurnTeamIndex(prev => (prev + 1) % teams.length);
    }

    if (currentQuestionIndex + 1 < activeQuestions.length && !winnerTeam) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      soundFx.winFanfare();
      onGameEnd(teams, answerLogs);
    }
  };

  const activeTeam = teams[currentTurnTeamIndex] || teams[0];

  return (
    <div className="flex-1 flex flex-col items-center w-full max-w-6xl mx-auto select-none px-2 sm:px-4 py-2">
      {/* Top Header: Scoreboard & Progress */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3 items-center bg-w-bg-card border border-w-border p-3 sm:p-4 rounded-2xl shadow-xs wey-paper-card mb-3">
        {/* Teams Scoreboard */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {teams.map((t, idx) => {
            const isTurn = idx === currentTurnTeamIndex;
            return (
              <div
                key={t.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                  isTurn
                    ? 'bg-w-accent-light border-w-primary-dark shadow-sm scale-105 ring-2 ring-w-primary-dark/30'
                    : 'bg-white border-slate-200 opacity-80'
                }`}
              >
                <span className="text-xl">{t.avatar || '🦁'}</span>
                <div>
                  <div className="text-[11px] font-bold text-w-text-main flex items-center gap-1">
                    {t.name}
                    {isTurn && <span className="w-2 h-2 rounded-full bg-w-primary-dark animate-ping" />}
                  </div>
                  <div className="text-xs font-extrabold text-w-primary-dark">{t.score} đ</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Question Counter */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-w-accent-light text-w-primary-dark border border-w-accent-border rounded-full text-xs font-bold shadow-2xs">
            <Sparkles className="w-4 h-4" />
            Lượt {currentQuestionIndex + 1} / {activeQuestions.length}
          </span>
        </div>

        {/* Timer */}
        <div className="flex justify-end items-center gap-2">
          {config.timerEnabled && timeLimit > 0 && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-extrabold text-sm ${
              timeLeft <= 5
                ? 'bg-rose-100 border-rose-300 text-rose-700 animate-pulse'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{timeLeft}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Multi-lane Sack Race Stadium */}
      <div className="w-full bg-gradient-to-b from-[#6B9E48] via-[#5C8E3C] to-[#4A782D] rounded-3xl p-4 sm:p-5 border-4 border-[#3D5C28] shadow-inner mb-4 space-y-3 relative overflow-hidden">
        {/* Track Header with Start / Finish Labels */}
        <div className="flex items-center justify-between text-[11px] font-[900] text-w-text-main px-2 uppercase tracking-wider">
          <span className="bg-white/70 backdrop-blur-sm px-2 py-0.5 rounded-md">🏁 Vạch Xuất Phát</span>
          <span className="bg-amber-500 text-amber-950 px-2.5 py-0.5 rounded-md shadow-xs flex items-center gap-1">
            🏆 VẠCH ĐÍCH (Đích đến)
          </span>
        </div>

        {/* Running Lanes for each Team */}
        <div className="space-y-2.5">
          {teams.map((team, idx) => {
            const currentPos = teamPositions[idx] || 0;
            const progressPercent = Math.min(100, (currentPos / trackLength) * 100);
            const isJumping = jumpingTeamIndex === idx;

            return (
              <div
                key={team.id}
                className="relative bg-white/15 rounded-2xl p-2 border border-white/25 flex items-center h-14 sm:h-16 overflow-hidden"
              >
                {/* Lane Track Grid Steps */}
                <div className="absolute inset-0 flex justify-between px-3 pointer-events-none opacity-30">
                  {Array.from({ length: trackLength + 1 }).map((_, stepIdx) => (
                    <div key={stepIdx} className="h-full border-r border-dashed border-white flex flex-col justify-end pb-1">
                      <span className="text-[9px] text-w-text-main font-bold">{stepIdx}</span>
                    </div>
                  ))}
                </div>

                {/* Animated Character in Sack */}
                <div
                  className={`absolute z-10 transition-all duration-500 flex items-center gap-1 ${
                    isJumping ? 'animate-bounce' : ''
                  }`}
                  style={{
                    left: `calc(10px + ${progressPercent * 0.82}%)`,
                  }}
                >
                  <div className="relative flex flex-col items-center">
                    {/* Animal / Mascot */}
                    <span className="text-2xl sm:text-3xl -mb-2.5 z-10">{team.avatar || '🦁'}</span>
                    {/* Burlap Sack Graphic */}
                    <div className="w-9 h-8 sm:w-10 sm:h-9 bg-[#C19A6B] border-2 border-[#8B6508] rounded-b-2xl shadow-md flex items-center justify-center text-[10px] font-extrabold text-[#5C4033]">
                      🌾
                    </div>
                  </div>
                  <span className="hidden sm:inline text-[10px] font-extrabold text-w-text-main bg-white/70 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    {team.name} ({currentPos}/{trackLength})
                  </span>
                </div>

                {/* Finish Line Ribbon */}
                <div className="absolute right-3 top-0 bottom-0 w-3 bg-red-500 flex items-center justify-center border-l-2 border-dashed border-white">
                  <span className="text-[8px] font-black text-w-text-main transform -rotate-90">GOAL</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Question Box & Options */}
      <div className="w-full bg-w-bg-card border-2 border-w-primary-dark/20 rounded-3xl p-4 sm:p-6 shadow-sm wey-paper-card text-center space-y-4">
        <div className="flex items-center justify-between text-xs font-[800] text-w-text-muted">
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#E9D58F]" />
            Lượt nhảy của: <strong className="text-w-primary-dark">{activeTeam.name}</strong>
          </span>
          <span>Đúng: Tiến +{stepPerCorrect} bước (+{pointsCorrect}đ)</span>
        </div>

        <h3 className="text-lg sm:text-xl font-[800] text-w-text-main max-w-3xl mx-auto leading-relaxed">
          {currentQuestion?.content}
        </h3>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto pt-2">
          {currentQuestion?.options?.map((opt, idx) => {
            const isCorrect = idx === currentQuestion.correct;
            const isChosen = selectedOption === idx;

            let btnStyle = 'bg-white hover:bg-w-bg-tag text-w-text-main border-w-border';
            if (isAnswerRevealed) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-500 text-w-text-main border-emerald-600 shadow-md animate-bounce';
              } else if (isChosen) {
                btnStyle = 'bg-rose-500 text-w-text-main border-rose-600 shadow-md';
              } else {
                btnStyle = 'bg-slate-100 text-w-text-muted border-slate-200 opacity-60';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswerRevealed}
                onClick={() => handleAnswer(idx)}
                className={`p-3.5 sm:p-4 rounded-2xl border-2 font-[800] text-sm text-left transition-all transform cursor-pointer flex items-center gap-3 shadow-xs active:scale-98 ${btnStyle}`}
              >
                <span className="w-7 h-7 rounded-xl bg-white/70 backdrop-blur-sm flex items-center justify-center font-[900] text-xs shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Next Turn Button */}
        {isAnswerRevealed && !winnerTeam && (
          <div className="pt-2">
            <button
              onClick={handleNextTurn}
              className="px-6 py-2.5 bg-w-primary-dark hover:bg-[#3E522F] text-w-text-main font-[800] text-sm rounded-2xl shadow-md transition transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              Lượt Nhảy Tiếp Theo ➔
            </button>
          </div>
        )}
      </div>

      {/* Winner Congratulations Modal */}
      {winnerTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-w-bg-alt backdrop-blur-xs animate-fade-in">
          <div className="bg-w-bg-card border-2 border-w-border rounded-3xl p-6 max-w-md w-full text-center shadow-2xl wey-paper-card space-y-4">
            <div className="w-20 h-20 rounded-full mx-auto bg-amber-100 border-3 border-amber-400 flex items-center justify-center text-4xl shadow-md animate-bounce">
              🏆
            </div>

            <div>
              <h3 className="text-2xl font-[900] text-w-primary-dark">
                {winnerTeam.name} ĐÃ VỀ ĐÍCH ĐẦU TIÊN!
              </h3>
              <p className="text-xs font-bold text-[#637357] mt-1">
                Xuất sắc hoàn thành chặng đua nhảy bao bố và giành chiến thắng vinh quang!
              </p>
            </div>

            <button
              onClick={() => onGameEnd(teams, answerLogs)}
              className="w-full py-3 bg-w-primary-dark hover:bg-[#3E522F] text-w-text-main font-[800] text-sm rounded-2xl shadow-md transition transform hover:scale-102 active:scale-98 cursor-pointer"
            >
              Xem Tổng Kết Điểm 🏆
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
