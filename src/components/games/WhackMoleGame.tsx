import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Trophy, Clock, Zap, AlertTriangle, CheckCircle, XCircle, RotateCcw, Volume2, Shield } from 'lucide-react';
import { GameSetupConfig, Question, Team, AnswerLog } from '../../types';
import { soundFx } from '../../utils/audio';

interface WhackMoleGameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: Team[], logs: AnswerLog[]) => void;
}

interface MoleHole {
  id: number;
  isUp: boolean;
  type: 'option' | 'trap' | 'bonus';
  optionIndex?: number;
  optionLabel?: string;
  optionText?: string;
  isCorrect?: boolean;
  isWhacked?: boolean;
  whackResult?: 'hit_correct' | 'hit_wrong' | 'hit_trap';
}

export const WhackMoleGame: React.FC<WhackMoleGameProps> = ({
  config,
  questions,
  onGameEnd,
}) => {
  // Game Configuration Parameters
  const holeCount = config.holeCount || 9;
  const moleSpeed = config.moleSpeed || 'medium'; // 'slow' | 'medium' | 'fast'
  const hasTrapMoles = config.hasTrapMoles !== false;
  const pointsCorrect = config.pointsPerCorrect ?? 10;
  const pointsWrong = config.pointsPerWrong ?? 5;
  const timeLimit = config.timerEnabled ? (config.timeLimitSeconds || 30) : 0;

  // Teams & State
  const [teams, setTeams] = useState<Team[]>(() => {
    if (config.teams && config.teams.length > 0) {
      return config.teams.map(t => ({ ...t, score: 0 }));
    }
    return [{ id: 'team_1', name: 'Đội 1', avatar: '🐉', color: '#ef4444', score: 0 }];
  });
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);

  // Question State
  const activeQuestions = React.useMemo(() => {
    if (!questions || questions.length === 0) {
      return [
        {
          id: 'q_demo_1',
          content: 'Thủ đô của Việt Nam là thành phố nào?',
          options: ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng'],
          correct: 0,
        },
        {
          id: 'q_demo_2',
          content: 'Kết quả của phép tính 15 + 27 là bao nhiêu?',
          options: ['32', '42', '52', '45'],
          correct: 1,
        },
      ];
    }
    const maxQ = config.totalQuestionsNumber || config.numberOfQuestions || questions.length;
    return questions.slice(0, maxQ);
  }, [questions, config.totalQuestionsNumber, config.numberOfQuestions]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const currentQuestion = activeQuestions[currentQuestionIndex] || activeQuestions[0];

  // Timer & Logs
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);
  const [isRoundOver, setIsRoundOver] = useState(false);
  const [roundFeedback, setRoundFeedback] = useState<{
    status: 'correct' | 'wrong' | 'trap' | 'timeout';
    message: string;
    scoreChange: number;
    teamName: string;
  } | null>(null);

  // Hammer Cursor / Touch Effect state
  const [hammerPos, setHammerPos] = useState<{ x: number; y: number; active: boolean } | null>(null);

  // Moles Holes State
  const [holes, setHoles] = useState<MoleHole[]>(() => {
    return Array.from({ length: holeCount }, (_, i) => ({
      id: i,
      isUp: false,
      type: 'option',
    }));
  });

  const moleTimerRef = useRef<any>(null);
  const isQuestionActiveRef = useRef(true);

  // Get speed intervals
  const getSpeedMs = useCallback(() => {
    switch (moleSpeed) {
      case 'fast': return { upTime: 1600, interval: 1900 };
      case 'slow': return { upTime: 2800, interval: 3200 };
      case 'medium':
      default: return { upTime: 2200, interval: 2500 };
    }
  }, [moleSpeed]);

  // Spawn moles periodically with options from current question
  const spawnMoles = useCallback(() => {
    if (!isQuestionActiveRef.current || !currentQuestion) return;

    const options = currentQuestion.options || ['Đúng', 'Sai'];
    const correctIdx = typeof currentQuestion.correct === 'number' ? currentQuestion.correct : 0;

    // Pick 2-4 random holes to show moles
    const numMoles = Math.min(holeCount, Math.max(2, Math.min(4, options.length + (hasTrapMoles ? 1 : 0))));
    const availableHoleIndices = Array.from({ length: holeCount }, (_, i) => i).sort(() => Math.random() - 0.5);
    const chosenHoles = availableHoleIndices.slice(0, numMoles);

    // Prepare contents: must ensure at least 1 correct option mole appears
    const optionIndices = options.map((_, idx) => idx).sort(() => Math.random() - 0.5);
    if (!optionIndices.slice(0, numMoles).includes(correctIdx)) {
      optionIndices[0] = correctIdx;
    }

    setHoles(prev => prev.map((h, idx) => {
      const holeChosenIndex = chosenHoles.indexOf(idx);
      if (holeChosenIndex === -1) {
        return { ...h, isUp: false, isWhacked: false, whackResult: undefined };
      }

      // Check if this hole becomes a trap mole
      const isTrap = hasTrapMoles && Math.random() < 0.25 && holeChosenIndex === chosenHoles.length - 1;
      if (isTrap) {
        return {
          id: idx,
          isUp: true,
          type: 'trap',
          isWhacked: false,
          whackResult: undefined,
        };
      }

      const optIdx = optionIndices[holeChosenIndex % optionIndices.length];
      const optLetter = String.fromCharCode(65 + optIdx); // A, B, C, D
      const optText = options[optIdx];
      const isCorrect = optIdx === correctIdx;

      return {
        id: idx,
        isUp: true,
        type: 'option',
        optionIndex: optIdx,
        optionLabel: optLetter,
        optionText: optText,
        isCorrect,
        isWhacked: false,
        whackResult: undefined,
      };
    }));

    // Auto hide after upTime
    const { upTime } = getSpeedMs();
    setTimeout(() => {
      if (isQuestionActiveRef.current) {
        setHoles(prev => prev.map(h => ({ ...h, isUp: false })));
      }
    }, upTime);
  }, [currentQuestion, holeCount, hasTrapMoles, getSpeedMs]);

  // Setup loop for moles
  useEffect(() => {
    isQuestionActiveRef.current = !isRoundOver;
    if (isRoundOver) {
      if (moleTimerRef.current) clearInterval(moleTimerRef.current);
      return;
    }

    spawnMoles();
    const { interval } = getSpeedMs();
    moleTimerRef.current = setInterval(() => {
      spawnMoles();
    }, interval);

    return () => {
      if (moleTimerRef.current) clearInterval(moleTimerRef.current);
    };
  }, [currentQuestionIndex, isRoundOver, spawnMoles, getSpeedMs]);

  // Timer logic per question
  useEffect(() => {
    if (!config.timerEnabled || timeLimit <= 0 || isRoundOver) return;

    setTimeLeft(timeLimit);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeOut();
          return 0;
        }
        if (prev <= 6) {
          soundFx.timerTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestionIndex, isRoundOver, config.timerEnabled, timeLimit]);

  const handleTimeOut = () => {
    isQuestionActiveRef.current = false;
    soundFx.wrong();
    const activeTeam = teams[currentTeamIndex] || teams[0];

    const log: AnswerLog = {
      questionNumber: currentQuestionIndex + 1,
      questionId: currentQuestion.id,
      questionText: currentQuestion.content,
      correctAnswer: typeof currentQuestion.correct === 'number' && currentQuestion.options ? currentQuestion.options[currentQuestion.correct] : String(currentQuestion.correct),
      teamName: activeTeam.name,
      teamId: activeTeam.id,
      isCorrect: false,
      selectedAnswer: 'Hết giờ',
      timestamp: Date.now(),
    };
    setAnswerLogs(prev => [...prev, log]);

    setRoundFeedback({
      status: 'timeout',
      message: 'Hết giờ đập chuột!',
      scoreChange: 0,
      teamName: activeTeam.name,
    });
    setIsRoundOver(true);
  };

  // Whack mole handler
  const handleWhack = (holeId: number, e: React.MouseEvent | React.TouchEvent) => {
    if (isRoundOver) return;

    const hole = holes.find(h => h.id === holeId);
    if (!hole || !hole.isUp || hole.isWhacked) return;

    // Visual hammer smack
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setHammerPos({ x: clientX, y: clientY, active: true });
    setTimeout(() => setHammerPos(null), 350);

    const activeTeam = teams[currentTeamIndex] || teams[0];

    if (hole.type === 'trap') {
      // Hit a Trap Bomb Mole!
      soundFx.wrong();
      setHoles(prev => prev.map(h => h.id === holeId ? { ...h, isWhacked: true, whackResult: 'hit_trap' } : h));

      setTeams(prev => prev.map((t, idx) => {
        if (idx === currentTeamIndex) {
          return { ...t, score: Math.max(0, t.score - pointsWrong) };
        }
        return t;
      }));

      const log: AnswerLog = {
        questionNumber: currentQuestionIndex + 1,
        questionId: currentQuestion.id,
        questionText: currentQuestion.content,
        correctAnswer: typeof currentQuestion.correct === 'number' && currentQuestion.options ? currentQuestion.options[currentQuestion.correct] : String(currentQuestion.correct),
        teamName: activeTeam.name,
        teamId: activeTeam.id,
        isCorrect: false,
        selectedAnswer: 'Bẫy chuột (- điểm)',
        timestamp: Date.now(),
      };
      setAnswerLogs(prev => [...prev, log]);

      setRoundFeedback({
        status: 'trap',
        message: `Đập trúng Bẫy Chuột! Trừ -${pointsWrong} điểm`,
        scoreChange: -pointsWrong,
        teamName: activeTeam.name,
      });
      setIsRoundOver(true);
      isQuestionActiveRef.current = false;
      return;
    }

    if (hole.isCorrect) {
      // HIT CORRECT MOLE!
      soundFx.correct();
      soundFx.powerup();
      setHoles(prev => prev.map(h => h.id === holeId ? { ...h, isWhacked: true, whackResult: 'hit_correct' } : h));

      setTeams(prev => prev.map((t, idx) => {
        if (idx === currentTeamIndex) {
          return { ...t, score: t.score + pointsCorrect };
        }
        return t;
      }));

      const log: AnswerLog = {
        questionNumber: currentQuestionIndex + 1,
        questionId: currentQuestion.id,
        questionText: currentQuestion.content,
        correctAnswer: typeof currentQuestion.correct === 'number' && currentQuestion.options ? currentQuestion.options[currentQuestion.correct] : String(currentQuestion.correct),
        teamName: activeTeam.name,
        teamId: activeTeam.id,
        isCorrect: true,
        selectedAnswer: `${hole.optionLabel}: ${hole.optionText}`,
        timestamp: Date.now(),
      };
      setAnswerLogs(prev => [...prev, log]);

      setRoundFeedback({
        status: 'correct',
        message: `Chính xác! Đập trúng đáp án đúng (+${pointsCorrect} điểm)`,
        scoreChange: pointsCorrect,
        teamName: activeTeam.name,
      });
      setIsRoundOver(true);
      isQuestionActiveRef.current = false;
    } else {
      // HIT WRONG MOLE!
      soundFx.wrong();
      setHoles(prev => prev.map(h => h.id === holeId ? { ...h, isWhacked: true, whackResult: 'hit_wrong' } : h));

      setTeams(prev => prev.map((t, idx) => {
        if (idx === currentTeamIndex) {
          return { ...t, score: Math.max(0, t.score - pointsWrong) };
        }
        return t;
      }));

      const log: AnswerLog = {
        questionNumber: currentQuestionIndex + 1,
        questionId: currentQuestion.id,
        questionText: currentQuestion.content,
        correctAnswer: typeof currentQuestion.correct === 'number' && currentQuestion.options ? currentQuestion.options[currentQuestion.correct] : String(currentQuestion.correct),
        teamName: activeTeam.name,
        teamId: activeTeam.id,
        isCorrect: false,
        selectedAnswer: `${hole.optionLabel}: ${hole.optionText}`,
        timestamp: Date.now(),
      };
      setAnswerLogs(prev => [...prev, log]);

      setRoundFeedback({
        status: 'wrong',
        message: `Sai rồi! Chuột này mang đáp án chưa đúng (-${pointsWrong} điểm)`,
        scoreChange: -pointsWrong,
        teamName: activeTeam.name,
      });
      setIsRoundOver(true);
      isQuestionActiveRef.current = false;
    }
  };

  // Next question or finish
  const handleNextQuestion = () => {
    setRoundFeedback(null);
    setIsRoundOver(false);

    // Switch team turn if multiple teams
    if (teams.length > 1) {
      setCurrentTeamIndex(prev => (prev + 1) % teams.length);
    }

    if (currentQuestionIndex + 1 < activeQuestions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Game Complete
      soundFx.winFanfare();
      onGameEnd(teams, answerLogs);
    }
  };

  const activeTeam = teams[currentTeamIndex] || teams[0];

  return (
    <div className="flex-1 flex flex-col items-center w-full max-w-6xl mx-auto select-none px-2 sm:px-4 py-2 relative">
      {/* Floating Hammer Animation on click/touch */}
      {hammerPos && (
        <div
          className="fixed z-50 pointer-events-none text-4xl sm:text-5xl transform -translate-x-1/2 -translate-y-1/2 animate-ping"
          style={{ left: hammerPos.x, top: hammerPos.y }}
        >
          🔨💥
        </div>
      )}

      {/* Top Game Bar: Teams, Question Progress, Timer */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3 items-center bg-[#FFFDF5] border border-[#DED5B8] p-3 sm:p-4 rounded-2xl shadow-xs wey-paper-card mb-3">
        {/* Teams Scoreboard */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {teams.map((t, idx) => {
            const isTurn = idx === currentTeamIndex;
            return (
              <div
                key={t.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                  isTurn
                    ? 'bg-[#E9F0D9] border-[#4F683C] shadow-sm scale-105 ring-2 ring-[#4F683C]/30'
                    : 'bg-white border-slate-200 opacity-80'
                }`}
              >
                <span className="text-xl">{t.avatar || '🐉'}</span>
                <div>
                  <div className="text-[11px] font-bold text-[#35452E] flex items-center gap-1">
                    {t.name}
                    {isTurn && <span className="w-2 h-2 rounded-full bg-[#4F683C] animate-ping" />}
                  </div>
                  <div className="text-xs font-extrabold text-[#4F683C]">{t.score} đ</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Question Counter */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E9F0D9] text-[#4F683C] border border-[#B9CDA0] rounded-full text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            Câu {currentQuestionIndex + 1} / {activeQuestions.length}
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

      {/* Main Question Display Box */}
      <div className="w-full bg-[#FFFDF5] border-2 border-[#4F683C]/30 rounded-3xl p-4 sm:p-6 shadow-md mb-4 text-center wey-paper-card relative overflow-hidden">
        <div className="absolute top-2 left-3 text-[10px] font-extrabold uppercase tracking-wider text-[#74806B] flex items-center gap-1">
          <Zap className="w-3 h-3 text-[#E9D58F]" />
          Lượt của: <span className="text-[#4F683C]">{activeTeam.name}</span>
        </div>
        <h2 className="text-lg sm:text-2xl font-[800] text-[#35452E] mt-2 leading-relaxed max-w-3xl mx-auto">
          {currentQuestion?.content}
        </h2>
        {(currentQuestion as any)?.image && (
          <div className="mt-3 flex justify-center">
            <img src={(currentQuestion as any).image} alt="Question illustration" className="max-h-40 rounded-xl shadow-xs border" />
          </div>
        )}
      </div>

      {/* Grass Field With Mole Holes */}
      <div className="w-full flex-1 bg-gradient-to-b from-[#699E4B] via-[#5C8E40] to-[#456C30] rounded-3xl p-4 sm:p-6 border-4 border-[#3D5C28] shadow-inner flex flex-col justify-center relative overflow-hidden min-h-[360px]">
        {/* Grass Texture Elements */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Grid of Holes */}
        <div 
          className="grid gap-3 sm:gap-6 mx-auto w-full max-w-4xl"
          style={{
            gridTemplateColumns: holeCount <= 6 ? 'repeat(3, 1fr)' : holeCount <= 8 ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
          }}
        >
          {holes.map((hole) => {
            return (
              <div
                key={hole.id}
                onClick={(e) => handleWhack(hole.id, e)}
                onTouchStart={(e) => handleWhack(hole.id, e)}
                className="relative flex flex-col items-center justify-end h-32 sm:h-40 cursor-pointer group select-none"
              >
                {/* Mole Mound Hole (Ground) */}
                <div className="w-24 sm:w-36 h-10 sm:h-14 bg-[#2C1D11] border-3 border-[#1A1009] rounded-[50%] shadow-[inset_0_10px_16px_rgba(0,0,0,0.8)] absolute bottom-0 z-0 flex items-center justify-center">
                  <div className="w-20 sm:w-30 h-6 sm:h-8 bg-[#1B1109] rounded-[50%]" />
                </div>

                {/* The Animated Mole Creature */}
                <div
                  className={`w-20 sm:w-28 transition-all duration-300 transform origin-bottom z-10 ${
                    hole.isUp
                      ? 'translate-y-[-10px] sm:translate-y-[-16px] opacity-100 scale-100'
                      : 'translate-y-16 opacity-0 scale-75 pointer-events-none'
                  } ${hole.isWhacked ? 'scale-90 rotate-12 filter brightness-110' : 'group-hover:scale-105'}`}
                >
                  {/* Mole Body Graphic */}
                  <div className={`relative rounded-t-full p-2 sm:p-3 text-center shadow-lg border-2 border-slate-900/30 ${
                    hole.type === 'trap'
                      ? 'bg-gradient-to-b from-slate-800 to-rose-950 text-white'
                      : 'bg-gradient-to-b from-[#8B5A2B] to-[#5C3A1E] text-amber-50'
                  }`}>
                    {/* Eyes and Nose */}
                    <div className="flex justify-center items-center gap-2 mb-1">
                      <div className="w-2 h-2.5 bg-black rounded-full border border-white" />
                      <div className="w-3 h-2 bg-pink-300 rounded-full" />
                      <div className="w-2 h-2.5 bg-black rounded-full border border-white" />
                    </div>

                    {/* Mole Cap or Whack Marker */}
                    {hole.isWhacked ? (
                      <div className="text-xl animate-bounce">
                        {hole.whackResult === 'hit_correct' ? '⭐' : '💥'}
                      </div>
                    ) : hole.type === 'trap' ? (
                      <div className="flex flex-col items-center">
                        <span className="text-xl">💣</span>
                        <span className="text-[9px] font-extrabold text-rose-300 uppercase">BẪY!</span>
                      </div>
                    ) : (
                      <div className="bg-[#FFFDF5] text-[#35452E] rounded-xl px-1.5 py-1 shadow-md border border-[#DED5B8] max-w-full">
                        <div className="text-xs sm:text-sm font-[900] text-[#4F683C] flex items-center justify-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-[#E9F0D9] text-[#4F683C] flex items-center justify-center text-[10px]">
                            {hole.optionLabel}
                          </span>
                        </div>
                        <div className="text-[10px] sm:text-xs font-bold leading-tight line-clamp-2 mt-0.5">
                          {hole.optionText}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Round End Feedback Overlay Modal */}
      {roundFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FFFDF5] border-2 border-[#DED5B8] rounded-3xl p-6 max-w-md w-full text-center shadow-2xl wey-paper-card space-y-4">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl shadow-inner border-2 border-slate-200">
              {roundFeedback.status === 'correct' ? '🎉' : roundFeedback.status === 'trap' ? '💣' : '❌'}
            </div>

            <div>
              <h3 className={`text-xl font-[900] ${
                roundFeedback.status === 'correct' ? 'text-[#4F683C]' : 'text-rose-600'
              }`}>
                {roundFeedback.status === 'correct' ? 'ĐẬP CHUỘT CHÍNH XÁC!' : 'CHƯA CHÍNH XÁC!'}
              </h3>
              <p className="text-xs font-bold text-[#637357] mt-1">
                {roundFeedback.message}
              </p>
            </div>

            {/* Answer recap */}
            <div className="bg-[#F8F4E8] rounded-2xl p-3 border border-[#E8DFCA] text-left text-xs space-y-1">
              <div className="font-bold text-[#74806B]">Đáp án đúng:</div>
              <div className="font-[800] text-[#4F683C] text-sm">
                {typeof currentQuestion.correct === 'number' && currentQuestion.options
                  ? `${String.fromCharCode(65 + currentQuestion.correct)}. ${currentQuestion.options[currentQuestion.correct]}`
                  : String(currentQuestion.correct)}
              </div>
            </div>

            <button
              onClick={handleNextQuestion}
              className="w-full py-3 bg-[#4F683C] hover:bg-[#3E522F] text-white font-[800] text-sm rounded-2xl shadow-md transition transform hover:scale-102 active:scale-98 cursor-pointer"
            >
              {currentQuestionIndex + 1 < activeQuestions.length ? 'Câu Tiếp Theo ➔' : 'Xem Tổng Kết Điểm 🏆'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
