import React, { useState, useEffect, useRef } from 'react';
import { Flag, Trophy, Sparkles, Clock, Zap, CheckCircle2, XCircle, Award, Volume2, Shield } from 'lucide-react';
import { GameSetupConfig, Question, Team, AnswerLog } from '../../types';
import { soundFx } from '../../utils/audio';

interface FlagCaptureGameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: Team[], logs: AnswerLog[]) => void;
}

export const FlagCaptureGame: React.FC<FlagCaptureGameProps> = ({
  config,
  questions,
  onGameEnd,
}) => {
  // Game Configuration Parameters
  const totalRounds = config.totalRounds || config.totalQuestionsNumber || 8;
  const pointsCapture = config.pointsPerCapture || config.pointsPerCorrect || 15;
  const penaltyWrong = config.penaltyPerWrong || config.pointsPerWrong || 5;
  const timeLimit = config.timerEnabled ? (config.timeLimitSeconds || 30) : 0;

  // Teams & State
  const [teams, setTeams] = useState<Team[]>(() => {
    if (config.teams && config.teams.length > 0) {
      return config.teams.map(t => ({ ...t, score: 0 }));
    }
    return [
      { id: 'team_1', name: 'Đội Đỏ', avatar: '🐉', color: '#ef4444', score: 0 },
      { id: 'team_2', name: 'Đội Xanh', avatar: '🦅', color: '#3b82f6', score: 0 },
    ];
  });
  const [currentTeamTurn, setCurrentTeamTurn] = useState(0);

  // Active Questions
  const activeQuestions = React.useMemo(() => {
    if (!questions || questions.length === 0) {
      return [
        {
          id: 'q_flag_1',
          content: 'Sông Mê Kông chảy qua bao nhiêu quốc gia?',
          options: ['4 quốc gia', '5 quốc gia', '6 quốc gia', '7 quốc gia'],
          correct: 2,
        },
        {
          id: 'q_flag_2',
          content: 'Đỉnh núi cao nhất Việt Nam là đỉnh núi nào?',
          options: ['Phan Xi Păng', 'Bạch Mộc Lương Tử', 'Pu Si Lung', 'Tây Côn Lĩnh'],
          correct: 0,
        },
      ];
    }
    return questions.slice(0, totalRounds);
  }, [questions, totalRounds]);

  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const currentQuestion = activeQuestions[currentRoundIndex] || activeQuestions[0];

  // Animation Stages: 'question' | 'running_to_flag' | 'capturing' | 'running_home' | 'round_result'
  const [stage, setStage] = useState<'question' | 'running_to_flag' | 'capturing' | 'running_home' | 'round_result'>('question');
  const [winningTeamIndex, setWinningTeamIndex] = useState<number | null>(null);
  const [runnerPositionPercent, setRunnerPositionPercent] = useState<number>(0); // 0% (Base) -> 50% (Flag) -> 0% (Home)
  const [flagIsCaptured, setFlagIsCaptured] = useState(false);

  // Selected Option
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);

  // Timer per round
  useEffect(() => {
    if (!config.timerEnabled || timeLimit <= 0 || stage !== 'question') return;

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
  }, [currentRoundIndex, stage, config.timerEnabled, timeLimit]);

  const handleTimeOut = () => {
    soundFx.wrong();
    setIsAnswerRevealed(true);
    const activeTeam = teams[currentTeamTurn] || teams[0];

    const log: AnswerLog = {
      questionNumber: currentRoundIndex + 1,
      questionId: currentQuestion.id,
      questionText: currentQuestion.content,
      correctAnswer: typeof currentQuestion.correct === 'number' && currentQuestion.options ? currentQuestion.options[currentQuestion.correct] : String(currentQuestion.correct),
      teamName: activeTeam.name,
      teamId: activeTeam.id,
      isCorrect: false,
      selectedAnswer: 'Hết giờ cướp cờ',
      timestamp: Date.now(),
    };
    setAnswerLogs(prev => [...prev, log]);
    setStage('round_result');
  };

  // Team answers the question
  const handleSelectAnswer = (optionIndex: number) => {
    if (stage !== 'question' || isAnswerRevealed) return;

    setSelectedOption(optionIndex);
    setIsAnswerRevealed(true);
    const isCorrect = optionIndex === currentQuestion.correct;
    const activeTeam = teams[currentTeamTurn] || teams[0];

    const log: AnswerLog = {
      questionNumber: currentRoundIndex + 1,
      questionId: currentQuestion.id,
      questionText: currentQuestion.content,
      correctAnswer: typeof currentQuestion.correct === 'number' && currentQuestion.options ? currentQuestion.options[currentQuestion.correct] : String(currentQuestion.correct),
      selectedAnswer: currentQuestion.options ? currentQuestion.options[optionIndex] : String(optionIndex),
      isCorrect,
      teamName: activeTeam.name,
      teamId: activeTeam.id,
      timestamp: Date.now(),
    };
    setAnswerLogs(prev => [...prev, log]);

    if (isCorrect) {
      // START FLAG CAPTURE RUN ANIMATION!
      soundFx.correct();
      soundFx.powerup();
      setWinningTeamIndex(currentTeamTurn);
      setStage('running_to_flag');

      // Animate runner to center flag
      let progress = 0;
      const runToFlagInterval = setInterval(() => {
        progress += 10;
        setRunnerPositionPercent(progress);
        if (progress >= 50) {
          clearInterval(runToFlagInterval);
          // Grab flag!
          setFlagIsCaptured(true);
          setStage('capturing');
          soundFx.cardFlip();

          setTimeout(() => {
            // Run back home!
            setStage('running_home');
            let returnProgress = 50;
            const runHomeInterval = setInterval(() => {
              returnProgress -= 10;
              setRunnerPositionPercent(returnProgress);
              if (returnProgress <= 0) {
                clearInterval(runHomeInterval);
                soundFx.winFanfare();
                setFlagIsCaptured(false);
                setStage('round_result');

                // Award points
                setTeams(prev => prev.map((t, idx) => {
                  if (idx === currentTeamTurn) return { ...t, score: t.score + pointsCapture };
                  return t;
                }));
              }
            }, 60);
          }, 400);
        }
      }, 60);
    } else {
      // WRONG ANSWER
      soundFx.wrong();
      setTeams(prev => prev.map((t, idx) => {
        if (idx === currentTeamTurn) return { ...t, score: Math.max(0, t.score - penaltyWrong) };
        return t;
      }));
      setStage('round_result');
    }
  };

  const handleNextRound = () => {
    setIsAnswerRevealed(false);
    setSelectedOption(null);
    setRunnerPositionPercent(0);
    setFlagIsCaptured(false);
    setWinningTeamIndex(null);
    setStage('question');

    // Cycle turn
    if (teams.length > 1) {
      setCurrentTeamTurn(prev => (prev + 1) % teams.length);
    }

    if (currentRoundIndex + 1 < activeQuestions.length) {
      setCurrentRoundIndex(prev => prev + 1);
    } else {
      soundFx.winFanfare();
      onGameEnd(teams, answerLogs);
    }
  };

  const activeTeam = teams[currentTeamTurn] || teams[0];

  return (
    <div className="flex-1 flex flex-col items-center w-full max-w-6xl mx-auto select-none px-2 sm:px-4 py-2">
      {/* Top Header: Teams, Round counter, Timer */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3 items-center bg-[#FFFDF5] border border-[#DED5B8] p-3 sm:p-4 rounded-2xl shadow-xs wey-paper-card mb-3">
        {/* Teams Scoreboard */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {teams.map((t, idx) => {
            const isTurn = idx === currentTeamTurn;
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

        {/* Round Counter */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E9F0D9] text-[#4F683C] border border-[#B9CDA0] rounded-full text-xs font-bold shadow-2xs">
            <Flag className="w-4 h-4 text-rose-500 fill-rose-500" />
            Vòng Cướp Cờ {currentRoundIndex + 1} / {activeQuestions.length}
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

      {/* Flag Stadium Track View */}
      <div className="w-full bg-gradient-to-r from-[#507F37] via-[#659B47] to-[#507F37] rounded-3xl p-4 sm:p-6 border-4 border-[#3D5C28] shadow-inner mb-4 relative overflow-hidden min-h-[220px] sm:min-h-[260px] flex flex-col justify-between">
        {/* Track Lines */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-20 bg-white/15 border-y-2 border-dashed border-white/40 flex items-center justify-between px-8 pointer-events-none" />

        {/* Left Team Base */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/90 border-3 border-[#ef4444] shadow-md flex items-center justify-center text-3xl">
            {teams[0]?.avatar || '🐉'}
          </div>
          <span className="text-[10px] font-extrabold text-white bg-black/40 px-2 py-0.5 rounded-full mt-1">
            {teams[0]?.name}
          </span>
        </div>

        {/* Center Golden Flag Stand */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-amber-400/30 border-2 border-amber-300 animate-ping absolute" />
          <div className="w-12 h-12 rounded-full bg-[#E9D58F] border-3 border-amber-500 shadow-lg flex items-center justify-center z-10">
            {!flagIsCaptured ? (
              <Flag className="w-7 h-7 text-red-600 fill-red-600 animate-bounce" />
            ) : (
              <span className="text-xs font-bold text-amber-900">🚩💨</span>
            )}
          </div>
          <span className="text-[9px] font-extrabold text-amber-200 uppercase tracking-widest mt-1 bg-black/40 px-2 py-0.5 rounded-full">
            Cờ Danh Dự (+{pointsCapture}đ)
          </span>
        </div>

        {/* Right Team Base */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/90 border-3 border-[#3b82f6] shadow-md flex items-center justify-center text-3xl">
            {teams[1]?.avatar || '🦅'}
          </div>
          <span className="text-[10px] font-extrabold text-white bg-black/40 px-2 py-0.5 rounded-full mt-1">
            {teams[1]?.name || 'Đội 2'}
          </span>
        </div>

        {/* Active Animated Runner */}
        {winningTeamIndex !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 z-20 transition-all duration-75 text-3xl sm:text-4xl flex items-center gap-1"
            style={{
              left: winningTeamIndex === 0
                ? `calc(10% + ${runnerPositionPercent * 0.75}%)`
                : `calc(90% - ${runnerPositionPercent * 0.75}%)`,
              transform: `translate(-50%, -50%) ${winningTeamIndex === 1 && runnerPositionPercent > 0 ? 'scaleX(-1)' : ''}`,
            }}
          >
            <span>{teams[winningTeamIndex]?.avatar || '🏃'}</span>
            {flagIsCaptured && <Flag className="w-6 h-6 text-red-600 fill-red-600 animate-bounce" />}
          </div>
        )}
      </div>

      {/* Question Box & Answer Options */}
      <div className="w-full bg-[#FFFDF5] border-2 border-[#4F683C]/20 rounded-3xl p-4 sm:p-6 shadow-sm wey-paper-card text-center space-y-4">
        <div className="flex items-center justify-between text-xs font-[800] text-[#74806B]">
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#E9D58F]" />
            Lượt trả lời & cướp cờ: <strong className="text-[#4F683C]">{activeTeam.name}</strong>
          </span>
          <span>Đúng: +{pointsCapture}đ | Sai: -{penaltyWrong}đ</span>
        </div>

        <h3 className="text-lg sm:text-xl font-[800] text-[#35452E] max-w-3xl mx-auto leading-relaxed">
          {currentQuestion?.content}
        </h3>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto pt-2">
          {currentQuestion?.options?.map((opt, idx) => {
            const isCorrect = idx === currentQuestion.correct;
            const isChosen = selectedOption === idx;

            let btnStyle = 'bg-white hover:bg-[#F8F4E8] text-[#35452E] border-[#DED5B8]';
            if (isAnswerRevealed) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-500 text-white border-emerald-600 shadow-md animate-bounce';
              } else if (isChosen) {
                btnStyle = 'bg-rose-500 text-white border-rose-600 shadow-md';
              } else {
                btnStyle = 'bg-slate-100 text-slate-400 border-slate-200 opacity-60';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswerRevealed}
                onClick={() => handleSelectAnswer(idx)}
                className={`p-3.5 sm:p-4 rounded-2xl border-2 font-[800] text-sm text-left transition-all transform cursor-pointer flex items-center gap-3 shadow-xs active:scale-98 ${btnStyle}`}
              >
                <span className="w-7 h-7 rounded-xl bg-black/10 flex items-center justify-center font-[900] text-xs shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Round End Next Button Modal */}
      {stage === 'round_result' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FFFDF5] border-2 border-[#DED5B8] rounded-3xl p-6 max-w-md w-full text-center shadow-2xl wey-paper-card space-y-4">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-4xl shadow-inner border-2 border-slate-200">
              {winningTeamIndex !== null ? '🚩' : '❌'}
            </div>

            <div>
              <h3 className={`text-xl font-[900] ${
                winningTeamIndex !== null ? 'text-[#4F683C]' : 'text-rose-600'
              }`}>
                {winningTeamIndex !== null
                  ? `${teams[winningTeamIndex]?.name} CƯỚP CỜ THÀNH CÔNG!`
                  : 'CƯỚP CỜ THẤT BẠI!'}
              </h3>
              <p className="text-xs font-bold text-[#637357] mt-1">
                {winningTeamIndex !== null
                  ? `Trả lời chính xác và mang cờ về căn cứ (+${pointsCapture} điểm)`
                  : `Đáp án chưa chính xác, mất quyền cướp cờ (-${penaltyWrong} điểm)`}
              </p>
            </div>

            <button
              onClick={handleNextRound}
              className="w-full py-3 bg-[#4F683C] hover:bg-[#3E522F] text-white font-[800] text-sm rounded-2xl shadow-md transition transform hover:scale-102 active:scale-98 cursor-pointer"
            >
              {currentRoundIndex + 1 < activeQuestions.length ? 'Vòng Tiếp Theo ➔' : 'Xem Tổng Kết Điểm 🏆'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
