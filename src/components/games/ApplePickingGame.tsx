import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Trophy, RotateCcw, Volume2, VolumeX, Eye, EyeOff, 
  HelpCircle, Clock, ChevronRight, CheckCircle, XCircle, 
  Sparkles, Dices, ArrowRight, ShieldAlert, Award, AlertTriangle, Users,
  Trees, Lock, Unlock, Key, Footprints, ShieldCheck, Star, Search, Info, X
} from 'lucide-react';
import { GameSetupConfig, Question, AnswerLog, Team } from '../../types';
import { soundFx } from '../../utils/audio';
import { MathChemRenderer } from '../../utils/mathChemFormatter';

interface ApplePickingGameProps {
  config: GameSetupConfig;
  questions?: Question[];
  onEndGame?: (finalScores: Record<string, number>, logs?: AnswerLog[]) => void;
  onRunOutOfQuestions?: () => void;
  onUpdateScore?: (teamId: string, delta: number) => void;
}

interface TeamState {
  id: string;
  name: string;
  color: string;
  avatar: string;
  position: number; // tile index (1 to totalTiles)
  apples: number;
  isCaught: boolean;
  isWinner: boolean;
}

interface TileData {
  number: number;
  type: 'normal' | 'golden' | 'spring' | 'safe_spot';
  label?: string;
}

export const ApplePickingGame: React.FC<ApplePickingGameProps> = ({
  config,
  questions = [],
  onEndGame,
  onRunOutOfQuestions,
  onUpdateScore
}) => {
  // Config defaults
  const totalTiles = config.appleBoardTiles || 36;
  const targetApples = config.appleTargetCount || 6;
  const initialTeams: Team[] = config.teams && config.teams.length > 0
    ? config.teams
    : [
        { id: 'team_1', name: 'Đội Sóc Nâu 🐿️', color: '#8D5B4C', avatar: '🐿️', score: 0 },
        { id: 'team_2', name: 'Đội Thỏ Trắng 🐇', color: '#E08283', avatar: '🐇', score: 0 },
        { id: 'team_3', name: 'Đội Gấu Nhỏ 🐻', color: '#D88A35', avatar: '🐻', score: 0 },
      ];

  // Game States
  const [teams, setTeams] = useState<TeamState[]>(() =>
    initialTeams.map(t => ({
      id: t.id,
      name: t.name,
      color: t.color || '#E08283',
      avatar: t.avatar || '🍎',
      position: 1,
      apples: 0,
      isCaught: false,
      isWinner: false,
    }))
  );

  const [currentTeamIndex, setCurrentTeamIndex] = useState<number>(0);
  const [turnStage, setTurnStage] = useState<'question' | 'dice' | 'moving' | 'result' | 'gameover'>('question');
  
  // Smith Secret Divisor Number
  const [smithSecretNumber, setSmithSecretNumber] = useState<number>(() => {
    if (config.appleSmithSecretMode === 'manual' && config.appleSmithSecretNumber) {
      return config.appleSmithSecretNumber;
    }
    // Random from [2, 3, 4, 5, 6]
    const divisors = [2, 3, 4, 5, 6];
    return divisors[Math.floor(Math.random() * divisors.length)];
  });
  const [showSmithSecret, setShowSmithSecret] = useState<boolean>(config.appleShowSmithSecret || false);

  // Question Handling
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [usedQuestionIndices, setUsedQuestionIndices] = useState<number[]>([]);
  const [questionNumber, setQuestionNumber] = useState<number>(1);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);

  // Dice & Movement
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRollingDice, setIsRollingDice] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string>('Chào mừng đến với Vườn Táo Ông Smith!');
  const [lastActionStatus, setLastActionStatus] = useState<'safe' | 'caught' | 'bonus' | null>(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState<number>(config.timeLimitSeconds || 30);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Sound
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Interactive Map Inspector & Rules
  const [inspectedTile, setInspectedTile] = useState<TileData | null>(null);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

  // Board generation with some golden / booster tiles
  const boardTiles = React.useMemo<TileData[]>(() => {
    const tiles: TileData[] = [];
    for (let i = 1; i <= totalTiles; i++) {
      if (i === 1) {
        tiles.push({ number: 1, type: 'safe_spot', label: 'Cổng Vườn' });
      } else if (i % 7 === 0 && i !== totalTiles) {
        tiles.push({ number: i, type: 'golden', label: 'Táo Vàng (+2)' });
      } else if (i % 11 === 0) {
        tiles.push({ number: i, type: 'spring', label: 'Lò Xo (+2 Ô)' });
      } else {
        tiles.push({ number: i, type: 'normal' });
      }
    }
    return tiles;
  }, [totalTiles]);

  // Active Team Helper
  const currentTeam = teams[currentTeamIndex] || teams[0];

  // Pick Next Question
  const pickNewQuestion = () => {
    if (config.mode === 'none') {
      // Play without questions mode
      setTurnStage('dice');
      return;
    }

    let chosen: Question;
    if (questions.length > 0) {
      let availableIndices = questions.map((_, i) => i).filter(i => !usedQuestionIndices.includes(i));
      if (availableIndices.length === 0) {
        if (onRunOutOfQuestions) {
          onRunOutOfQuestions();
          return;
        } else {
          availableIndices = questions.map((_, i) => i);
          setUsedQuestionIndices([]);
        }
      }
      const randomIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      setUsedQuestionIndices(prev => [...prev, randomIdx]);
      chosen = questions[randomIdx];
    } else {
      const qNum = questionNumber;
      chosen = {
        id: `apple_q_${qNum}`,
        type: 'mcq',
        content: `Câu hỏi số ${qNum}: Hãy chọn đáp án chính xác để nhận lượt tung xúc xắc hái táo!`,
        options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
        correct: 0,
        explanation: 'Giáo viên đối chiếu câu trả lời bài học của học sinh.'
      };
    }

    setCurrentQuestion(chosen);
    setSelectedOption(null);
    setShowAnswer(false);
    setTimeLeft(config.timeLimitSeconds || 30);
    setIsTimerRunning(config.timerEnabled !== false);
    setTurnStage('question');
  };

  // Start turn on mount & team changes
  useEffect(() => {
    pickNewQuestion();
  }, []);

  useEffect(() => {
    if (config.mode === 'none' && turnStage === 'question') {
      setTurnStage('dice');
    }
  }, [config.mode, turnStage]);

  // Timer Tick
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          soundFx.play('wrong');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Handle Question Answer
  const handleAnswerSubmit = (isCorrect: boolean) => {
    if (!currentQuestion || !currentTeam) return;
    setIsTimerRunning(false);
    setShowAnswer(true);

    const log: AnswerLog = {
      questionId: currentQuestion.id,
      questionContent: currentQuestion.content,
      selectedAnswer: selectedOption !== null && currentQuestion.options ? currentQuestion.options[selectedOption] : (isCorrect ? 'Đúng' : 'Sai'),
      correctAnswer: typeof currentQuestion.correct === 'number' && currentQuestion.options ? currentQuestion.options[currentQuestion.correct] : String(currentQuestion.correct),
      isCorrect,
      timestamp: Date.now(),
      teamId: currentTeam.id,
      teamName: currentTeam.name
    };
    setAnswerLogs(prev => [...prev, log]);

    if (isCorrect) {
      soundFx.play('correct');
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      setActionMessage(`🎉 ${currentTeam.name} trả lời ĐÚNG! Được quyền tung xúc xắc.`);
      setTurnStage('dice');
    } else {
      soundFx.play('wrong');
      setActionMessage(`❌ ${currentTeam.name} trả lời CHƯA ĐÚNG! Bị mất lượt di chuyển.`);
      setTurnStage('result');
    }
  };

  // Roll Dice & Move
  const handleRollDice = () => {
    if (isRollingDice) return;
    setIsRollingDice(true);
    soundFx.play('cardFlip');

    let rollCount = 0;
    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      if (rollCount > 10) {
        clearInterval(rollInterval);
        const finalDice = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalDice);
        setIsRollingDice(false);
        soundFx.play('correct');
        handleMoveTeam(finalDice);
      }
    }, 80);
  };

  // Move Team Step-by-Step & Check Smith Rule
  const handleMoveTeam = (steps: number) => {
    setTurnStage('moving');
    const oldPos = currentTeam.position;
    let newPos = oldPos + steps;
    if (newPos > totalTiles) {
      newPos = newPos % totalTiles || totalTiles; // Loop around track
    }

    // Step animation
    soundFx.play('buttonClick');
    
    setTimeout(() => {
      // Check special tiles
      const targetTile = boardTiles.find(t => t.number === newPos);
      let bonusApples = 1;
      let extraSteps = 0;

      if (targetTile?.type === 'golden') {
        bonusApples = 2;
      } else if (targetTile?.type === 'spring') {
        extraSteps = 2;
        newPos = (newPos + extraSteps > totalTiles) ? ((newPos + extraSteps) % totalTiles || totalTiles) : newPos + extraSteps;
      }

      // CHECK DIVISIBILITY BY SMITH'S SECRET NUMBER
      const isDivisible = newPos % smithSecretNumber === 0;

      if (isDivisible) {
        // CAUGHT BY MR. SMITH!
        soundFx.play('wrong');
        setLastActionStatus('caught');
        setActionMessage(`😱 Ô SỐ ${newPos} CHIA HẾT CHO SỐ BÍ MẬT ${showSmithSecret ? smithSecretNumber : '???'}! ${currentTeam.name} ĐÃ BỊ ÔNG SMITH BẮT!`);

        setTeams(prev => prev.map((t, idx) => {
          if (idx === currentTeamIndex) {
            return {
              ...t,
              position: newPos,
              isCaught: true,
            };
          }
          return t;
        }));
      } else {
        // SAFE & COLLECT APPLES
        soundFx.play('bonus');
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        setLastActionStatus(bonusApples > 1 ? 'bonus' : 'safe');
        
        const nextApples = currentTeam.apples + bonusApples;
        const reachedTarget = nextApples >= targetApples;

        if (bonusApples > 1) {
          setActionMessage(`🌟 AN TOÀN! ${currentTeam.name} đến ô Táo Vàng và hái được +${bonusApples} quả táo! (Tổng: ${nextApples}/${targetApples} 🍎)`);
        } else {
          setActionMessage(`🍏 AN TOÀN! Ô số ${newPos} không chia hết. ${currentTeam.name} hái được +1 quả táo! (Tổng: ${nextApples}/${targetApples} 🍎)`);
        }

        setTeams(prev => prev.map((t, idx) => {
          if (idx === currentTeamIndex) {
            const updated = {
              ...t,
              position: newPos,
              apples: nextApples,
              isWinner: reachedTarget,
            };
            if (onUpdateScore) {
              onUpdateScore(t.id, bonusApples * 10);
            }
            return updated;
          }
          return t;
        }));

        if (reachedTarget) {
          soundFx.play('victory');
          confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
          setTurnStage('gameover');
          return;
        }
      }

      setTurnStage('result');
    }, 700);
  };

  // Next Team Turn
  const handleNextTurn = () => {
    // Find next active team
    let nextIdx = (currentTeamIndex + 1) % teams.length;
    let attempts = 0;
    while (teams[nextIdx].isCaught && attempts < teams.length) {
      nextIdx = (nextIdx + 1) % teams.length;
      attempts++;
    }

    // If all teams are caught
    const allCaught = teams.every(t => t.isCaught);
    if (allCaught) {
      soundFx.play('wrong');
      setActionMessage('😱 TẤT CẢ CÁC ĐỘI ĐÃ BỊ ÔNG SMITH BẮT! ÔNG SMITH CHIẾN THẮNG!');
      setTurnStage('gameover');
      return;
    }

    setCurrentTeamIndex(nextIdx);
    setQuestionNumber(prev => prev + 1);
    setDiceValue(null);
    setLastActionStatus(null);
    pickNewQuestion();
  };

  // Revive a team (Teacher action)
  const handleReviveTeam = (teamId: string) => {
    soundFx.play('bonus');
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, isCaught: false, position: 1 } : t));
  };

  // Finish and trigger report
  const handleEndGame = () => {
    if (onEndGame) {
      const finalScores: Record<string, number> = {};
      teams.forEach(t => {
        finalScores[t.id] = t.apples * 10;
      });
      onEndGame(finalScores, answerLogs);
    }
  };

  // Restart Round
  const handleRestart = () => {
    const divisors = [2, 3, 4, 5, 6];
    const newSmith = divisors[Math.floor(Math.random() * divisors.length)];
    setSmithSecretNumber(newSmith);
    setTeams(initialTeams.map(t => ({
      id: t.id,
      name: t.name,
      color: t.color || '#E08283',
      avatar: t.avatar || '🍎',
      position: 1,
      apples: 0,
      isCaught: false,
      isWinner: false,
    })));
    setCurrentTeamIndex(0);
    setQuestionNumber(1);
    setDiceValue(null);
    setLastActionStatus(null);
    pickNewQuestion();
  };

  // Helper to map tile 1..36 to a 14x6 rectangular ring grid (like physical board)
  const getGridArea = (num: number) => {
    let r = 1, c = 1;
    if (num >= 1 && num <= 5) {
      r = num; c = 1;
    } else if (num >= 6 && num <= 19) {
      r = 6; c = num - 5;
    } else if (num >= 20 && num <= 23) {
      r = 25 - num; c = 14;
    } else if (num >= 24 && num <= 36) {
      r = 1; c = 38 - num;
    }
    return `${r} / ${c} / span 1 / span 1`;
  };

  const winningTeam = teams.find(t => t.isWinner);

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col min-h-[100dvh] bg-w-bg-alt text-slate-800 select-none pb-12 overflow-y-auto">
      
      {/* HEADER BAR */}
      <header className="bg-white border-b-2 border-[#E3DCBA] px-4 py-3 sm:px-6 shadow-xs sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-w-primary-dark text-w-text-main flex items-center justify-center text-xl shadow-xs">
            🍎
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-w-text-main flex items-center gap-2">
              <span>HÁI TÁO</span>
              <span className="text-xs px-2.5 py-0.5 bg-amber-100 text-[#5C4D15] rounded-full font-extrabold uppercase tracking-wide">
                Boardgame Giáo Dục
              </span>
            </h1>
            <p className="text-xs text-w-text-muted font-semibold">
              Mục tiêu: Đội nào hái đủ <strong className="text-w-text-main font-black">{targetApples} 🍎</strong> trước sẽ chiến thắng!
            </p>
          </div>
        </div>

        {/* Teacher Controls & Smith Master Board */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mr. Smith Secret Indicator */}
          <div className="flex items-center gap-2 bg-w-text-main text-w-bg-card px-3.5 py-1.5 rounded-2xl border-2 border-w-border shadow-xs">
            <div className="text-base">👨‍🌾</div>
            <div className="text-left">
              <div className="text-[10px] uppercase font-extrabold text-amber-500">Số bí mật Ông Smith:</div>
              <div className="text-xs font-black flex items-center gap-1.5">
                <span>{showSmithSecret ? `Chia hết cho ${smithSecretNumber}` : '❓ Ẩn Bí Mật'}</span>
                <button
                  type="button"
                  onClick={() => setShowSmithSecret(!showSmithSecret)}
                  className="text-amber-500 hover:text-w-text-main p-0.5 rounded cursor-pointer"
                  title={showSmithSecret ? "Ẩn số bí mật" : "Xem số bí mật (Dành cho GV)"}
                >
                  {showSmithSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-white border border-w-accent-muted hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="Bật/Tắt âm thanh"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-w-primary-dark" /> : <VolumeX className="w-4 h-4 text-w-text-muted" />}
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chơi Lại</span>
          </button>

          <button
            type="button"
            onClick={handleEndGame}
            className="px-3.5 py-1.5 bg-w-primary-dark hover:bg-w-primary-hover text-w-text-main text-xs font-black rounded-xl shadow-xs transition cursor-pointer"
          >
            Tổng Kết
          </button>
        </div>
      </header>

      {/* TEAM SCORE & STATUS CARDS BAR */}
      <div className="px-4 py-3 sm:px-6 bg-w-bg-alt border-b border-[#E3DCBA]">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {teams.map((t, idx) => {
            const isTurn = idx === currentTeamIndex && turnStage !== 'gameover';
            return (
              <div
                key={t.id}
                className={`p-3 rounded-2xl border-2 transition-all relative overflow-hidden ${
                  t.isWinner
                    ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400 shadow-md'
                    : t.isCaught
                    ? 'bg-rose-50 border-rose-300 opacity-80'
                    : isTurn
                    ? 'bg-white border-w-primary-dark shadow-lg ring-2 ring-w-primary-dark/30 scale-[1.02]'
                    : 'bg-white border-[#E3DCBA] shadow-2xs'
                }`}
              >
                {/* Active turn indicator pill */}
                {isTurn && (
                  <div className="absolute top-1.5 right-2 px-2 py-0.2 bg-w-primary-dark text-w-text-main text-[9px] font-black rounded-full uppercase tracking-wider animate-pulse">
                    Đến Lượt
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div 
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black shrink-0 border"
                    style={{ backgroundColor: `${t.color}20`, borderColor: t.color }}
                  >
                    {t.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold text-w-text-main truncate">{t.name}</div>
                    <div className="text-[11px] font-bold text-w-text-muted flex items-center gap-1">
                      <span>Ô số: <strong className="text-slate-900">{t.position}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Apples basket count */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs font-black text-rose-600">
                    <span>🍎</span>
                    <span>{t.apples} / {targetApples}</span>
                  </div>

                  {t.isCaught ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-black text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded-md">
                        Bị Bắt
                      </span>
                      <button
                        type="button"
                        onClick={() => handleReviveTeam(t.id)}
                        className="text-[9px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                        title="Hồi sinh đội này"
                      >
                        Cứu
                      </button>
                    </div>
                  ) : t.isWinner ? (
                    <span className="text-[10px] font-black text-amber-800 bg-amber-200 px-2 py-0.5 rounded-md">
                      👑 Thắng
                    </span>
                  ) : (
                    <div className="flex gap-0.5">
                      {Array.from({ length: targetApples }).map((_, aIdx) => (
                        <span 
                          key={aIdx} 
                          className={`text-xs ${aIdx < t.apples ? 'opacity-100' : 'opacity-20 grayscale'}`}
                        >
                          🍎
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN GAME CONTAINER: BOARD + ACTION PANEL */}
      <div className="flex-1 px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: THE APPLE ORCHARD BOARD TRACK (7 Cols) */}
        <div className="lg:col-span-7 bg-gradient-to-b from-[#f7fdf9] via-[#f0fdf4] to-[#f5fbf2] rounded-3xl p-3.5 sm:p-5 border-4 border-[#8D5B4C]/70 shadow-xl flex flex-col relative overflow-hidden">
          {/* Subtle Ambient Meadow Glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-200/40 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-200/40 rounded-full blur-2xl pointer-events-none" />

          {/* Top Orchard Signboard Header */}
          <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b-2 border-[#E3DCBA] gap-2 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 text-white flex items-center justify-center text-xl shadow-md border-2 border-emerald-300">
                🌳
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-[#2B3B1E] uppercase tracking-wide flex items-center gap-1.5">
                  <span>Bản Đồ Vườn Táo Ông Smith</span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-extrabold border border-emerald-300">
                    {totalTiles} Ô
                  </span>
                </h3>
                <p className="text-[11px] text-slate-600 font-semibold">
                  Mục tiêu: Đua hái đủ <strong className="text-rose-600 font-black">{targetApples} 🍎</strong> • Né các ô chia hết cho số bí mật!
                </p>
              </div>
            </div>

            {/* Top Right Map Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowRulesModal(true)}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs transition flex items-center gap-1 cursor-pointer"
                title="Xem hướng dẫn luật chơi"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Luật Chơi</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSmithSecret(!showSmithSecret)}
                className={`px-3 py-1.5 text-xs font-black rounded-xl border transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                  showSmithSecret
                    ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                    : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                }`}
                title={showSmithSecret ? "Ẩn số bí mật" : "Soi số bí mật & các ô bẫy (Dành cho Giáo Viên)"}
              >
                {showSmithSecret ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-rose-600" />
                    <span>Ẩn Bẫy</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5 text-amber-700" />
                    <span>Soi Bẫy (GV)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Winding Grid Board */}
          <div className="flex-1 w-full p-1 sm:p-2 flex flex-col justify-center overflow-x-auto custom-scrollbar relative z-10">
            <div 
              className="min-w-[640px] sm:min-w-0 w-full grid grid-rows-6 gap-1 sm:gap-1.5 relative mx-auto max-w-full"
              style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}
            >
              {/* MR. SMITH'S PATROL STATION & SECRET CRATES (Center Area) */}
              <div 
                className="col-start-2 col-end-14 row-start-2 row-end-6 rounded-2xl bg-gradient-to-b from-[#ecfdf5]/95 via-[#fffbeb]/85 to-[#dcfce7]/90 border-2 border-emerald-300/90 shadow-inner p-2.5 sm:p-3.5 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Floating Scenic Leaves / Apples in Center Background */}
                <div className="absolute top-2 right-4 text-xs opacity-50 select-none animate-pulse pointer-events-none">🍃</div>
                <div className="absolute bottom-2 left-4 text-xs opacity-40 select-none pointer-events-none">🌸</div>

                {/* Section 1: Farmer Smith Mascot & Live Status Alert */}
                <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-emerald-200/80">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white border-2 border-emerald-300 shadow-sm flex items-center justify-center text-xl sm:text-2xl shrink-0">
                      {lastActionStatus === 'caught' ? '🚨' : lastActionStatus === 'bonus' ? '🌟' : turnStage === 'moving' ? '👀' : '👨‍🌾'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-emerald-950">Ông Smith (Chủ Vườn)</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shadow-2xs uppercase tracking-wider ${
                          lastActionStatus === 'caught'
                            ? 'bg-rose-500 text-white animate-pulse'
                            : lastActionStatus === 'bonus'
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-700 text-white'
                        }`}>
                          {lastActionStatus === 'caught' ? 'Bắt Được!' : lastActionStatus === 'bonus' ? 'Bội Thu!' : 'Đang Tuần Tra'}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-emerald-900 truncate">
                        {lastActionStatus === 'caught'
                          ? `Ha ha! Ô chia hết cho số bí mật rồi! Nhốt vào chuồng!`
                          : lastActionStatus === 'bonus'
                          ? `Oa! Trúng ô Táo Vàng bội thu thơm ngọt!`
                          : turnStage === 'moving'
                          ? `Đang tiến bước... Cẩn thận dẫm phải bẫy chia hết!`
                          : `Né các ô chia hết cho số bí mật của ta nhé!`}
                      </p>
                    </div>
                  </div>

                  {/* Secret Divisor Teacher Status Pill */}
                  <div className="shrink-0 text-right">
                    <div className="text-[10px] font-black text-emerald-800 uppercase tracking-wide">
                      Số bí mật:
                    </div>
                    <div className={`text-xs font-black px-2 py-0.5 rounded-lg border ${
                      showSmithSecret 
                        ? 'bg-rose-100 text-rose-800 border-rose-300' 
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}>
                      {showSmithSecret ? `Bẫy chia hết cho ${smithSecretNumber}` : '❓ Đang ẩn bí mật'}
                    </div>
                  </div>
                </div>

                {/* Section 2: The 5 Mystery Crates (Barrels [2, 3, 4, 5, 6]) */}
                <div className="my-auto py-1">
                  <div className="text-[10px] sm:text-[11px] font-black text-emerald-950 uppercase tracking-wide flex items-center justify-center gap-1.5 mb-1.5">
                    <span>📦 5 HÒM SỐ BÍ MẬT TIỀM NĂNG:</span>
                    <span className="text-emerald-800 font-extrabold text-[10px]">(Bẫy chia hết cho 1 trong các số này)</span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 max-w-md mx-auto">
                    {[2, 3, 4, 5, 6].map(num => {
                      const isSecret = smithSecretNumber === num && showSmithSecret;
                      return (
                        <div 
                          key={num}
                          onClick={() => {
                            if (!showSmithSecret) {
                              soundFx.play('click');
                            }
                          }}
                          className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl transition-all duration-300 select-none ${
                            isSecret
                              ? 'bg-gradient-to-b from-amber-400 via-yellow-400 to-amber-500 border-2 border-amber-600 text-amber-950 font-black shadow-lg ring-4 ring-yellow-300 scale-105 animate-pulse'
                              : showSmithSecret
                              ? 'bg-white/80 border border-slate-300 text-slate-400 opacity-60'
                              : 'bg-gradient-to-b from-[#fef3c7] via-[#fde68a] to-[#fde047]/30 border-2 border-amber-500/70 text-amber-950 shadow-xs hover:-translate-y-0.5 hover:shadow-md cursor-pointer'
                          }`}
                        >
                          {isSecret ? (
                            <>
                              <span className="text-[10px] sm:text-xs">🗝️✨</span>
                              <span className="text-sm sm:text-base font-black">÷ {num}</span>
                              <span className="text-[8px] font-black uppercase bg-yellow-200/90 text-amber-950 px-1 rounded mt-0.5">BẪY CHIA</span>
                            </>
                          ) : showSmithSecret ? (
                            <>
                              <span className="text-[10px]">✓</span>
                              <span className="text-xs sm:text-sm font-bold text-slate-500">{num}</span>
                              <span className="text-[8px] font-semibold text-slate-400">An toàn</span>
                            </>
                          ) : (
                            <>
                              <span className="text-[10px] sm:text-xs">🔒</span>
                              <span className="text-sm sm:text-base font-black">{num}</span>
                              <span className="text-[8px] font-bold text-amber-800">Bí mật ?</span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Bottom Live Status & Click Hint */}
                <div className="flex items-center justify-between pt-1.5 border-t border-emerald-200/80 text-xs">
                  <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-emerald-300 shadow-2xs font-bold text-emerald-950">
                    <span className="text-amber-500">👉</span>
                    <span>Lượt đi:</span>
                    <span className="text-slate-900 font-black flex items-center gap-1">
                      <span>{currentTeam.avatar}</span>
                      <span>{currentTeam.name}</span>
                    </span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 font-extrabold px-1.5 py-0.5 rounded">
                      Ô {currentTeam.position}
                    </span>
                  </div>

                  <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Chạm vào ô bất kỳ để soi phép chia!</span>
                  </div>
                </div>
              </div>

              {/* 36 STEPPING STONES (Perimeter Path) */}
              {boardTiles.map(tile => {
                const isDivisiblePreview = showSmithSecret && tile.number % smithSecretNumber === 0;
                // Pawns on this tile
                const pawnsOnTile = teams.filter(t => t.position === tile.number && !t.isCaught);
                const caughtOnTile = teams.filter(t => t.position === tile.number && t.isCaught);
                const isActiveTeamHere = pawnsOnTile.some(p => p.id === currentTeam.id);

                let tileBg = 'bg-gradient-to-b from-white via-[#fafaf9] to-[#f4f2ee] border-2 border-[#e7e5e4] border-b-4 border-b-[#d6d3d1] hover:border-emerald-400 text-slate-800';
                
                if (tile.number === 1) {
                  tileBg = 'bg-gradient-to-b from-emerald-100 via-green-50 to-emerald-200 border-2 border-emerald-500 border-b-4 border-b-emerald-700 text-emerald-950 shadow-xs';
                } else if (tile.type === 'golden') {
                  tileBg = 'bg-gradient-to-b from-amber-100 via-yellow-50 to-amber-200 border-2 border-amber-400 border-b-4 border-b-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.35)] text-amber-950';
                } else if (tile.type === 'spring') {
                  tileBg = 'bg-gradient-to-b from-sky-100 via-cyan-50 to-blue-200 border-2 border-sky-400 border-b-4 border-b-sky-600 shadow-[0_0_10px_rgba(14,165,233,0.3)] text-sky-950';
                }

                if (isDivisiblePreview) {
                  tileBg = 'bg-gradient-to-b from-rose-100 via-red-50 to-rose-200 border-2 border-rose-500 border-b-4 border-b-rose-700 ring-2 ring-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse text-rose-950';
                }

                if (isActiveTeamHere) {
                  tileBg += ' ring-4 ring-amber-500 ring-offset-2 ring-offset-emerald-50 scale-[1.04] z-20 shadow-xl';
                }

                // Only render tiles 1-36 for the ring
                if (tile.number > 36) return null;

                return (
                  <div
                    key={tile.number}
                    onClick={() => {
                      soundFx.play('click');
                      setInspectedTile(tile);
                    }}
                    className={`min-h-[46px] sm:min-h-[52px] lg:min-h-[56px] p-1 rounded-xl sm:rounded-2xl flex flex-col justify-between relative transition-all duration-200 cursor-pointer ${tileBg}`}
                    style={{ gridArea: getGridArea(tile.number) }}
                    title={`Ô số ${tile.number} - Bấm để soi chi tiết`}
                  >
                    {/* Active Turn Floating Marker */}
                    {isActiveTeamHere && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow-md whitespace-nowrap animate-bounce z-30">
                        LƯỢT ĐI
                      </div>
                    )}

                    {/* Top Tile Info */}
                    <div className="flex items-center justify-between text-[10px] font-black">
                      <span className="px-1 py-0.2 rounded-md bg-white/80 backdrop-blur-xs flex items-center justify-center text-[9px] shadow-2xs font-black">
                        {tile.number === 1 ? '🚩' : tile.number}
                      </span>

                      {tile.number === 1 ? (
                        <span className="text-[8px] font-black text-emerald-800">START</span>
                      ) : tile.type === 'golden' ? (
                        <span className="text-[10px]" title="Táo Vàng (+2 Táo)">⭐🍎</span>
                      ) : tile.type === 'spring' ? (
                        <span className="text-[10px]" title="Lò Xo (+2 Ô)">🌀</span>
                      ) : isDivisiblePreview ? (
                        <span className="text-[10px] text-rose-600 font-extrabold animate-bounce" title="Bẫy Ông Smith">🏮⚠️</span>
                      ) : (
                        <span className="text-[8px] opacity-40">🍏</span>
                      )}
                    </div>

                    {/* Pawns Display */}
                    <div className="flex flex-wrap gap-1 items-center justify-center my-0.5">
                      {pawnsOnTile.map(pawn => (
                        <motion.div
                          key={pawn.id}
                          layoutId={`pawn_${pawn.id}`}
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center text-xs shadow-md border-2 border-white font-black ${
                            pawn.id === currentTeam.id ? 'scale-110 shadow-lg ring-2 ring-amber-400 animate-bounce' : ''
                          }`}
                          style={{ backgroundColor: pawn.color }}
                          title={`${pawn.name} (Vị trí: ${tile.number} - Đang có ${pawn.apples} 🍎)`}
                        >
                          <span>{pawn.avatar}</span>
                        </motion.div>
                      ))}

                      {caughtOnTile.map(cp => (
                        <div
                          key={cp.id}
                          className="w-5 h-5 rounded-lg bg-rose-600 text-white flex items-center justify-center text-[10px] shadow-xs border border-white"
                          title={`${cp.name} (Đang bị Ông Smith nhốt)`}
                        >
                          ⛓️
                        </div>
                      ))}
                    </div>

                    {/* Bottom Label */}
                    <div className="text-[7px] sm:text-[8px] font-black text-center truncate leading-tight opacity-90">
                      {tile.number === 1
                        ? 'Cổng Vào'
                        : isDivisiblePreview
                        ? `Bẫy ÷${smithSecretNumber}!`
                        : tile.label || '+1 Táo'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Board Legend & Click Hint */}
          <div className="mt-3 pt-3 border-t-2 border-[#E3DCBA] flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-600 relative z-10">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-400" />
                <span className="text-[11px]">🚩 Cổng Vào</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-white border border-slate-300" />
                <span className="text-[11px]">🍏 Ô Thường (+1 🍎)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-400" />
                <span className="text-[11px]">⭐ Táo Vàng (+2 🍎)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-sky-100 border border-sky-400" />
                <span className="text-[11px]">🌀 Lò Xo (+2 Ô)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-rose-100 border border-rose-500" />
                <span className="text-[11px]">🏮 Bẫy Chia Hết</span>
              </div>
            </div>

            <div className="text-[11px] text-emerald-800 font-black bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
              <span>💡 Bấm vào ô để soi phép chia!</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTION & QUESTION CONSOLE (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* ACTION NOTIFICATION BANNER */}
          <motion.div
            key={actionMessage}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-3xl border-2 shadow-sm ${
              lastActionStatus === 'caught'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : lastActionStatus === 'bonus'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-white border-[#E3DCBA] text-w-text-main'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl mt-0.5">
                {lastActionStatus === 'caught' ? '😱' : lastActionStatus === 'bonus' ? '🌟' : '📢'}
              </div>
              <div className="text-xs sm:text-sm font-bold leading-relaxed">
                {actionMessage}
              </div>
            </div>
          </motion.div>

          {/* STAGE 1: QUESTION PHASE */}
          {turnStage === 'question' && currentQuestion && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-w-accent-muted shadow-sm space-y-4 flex-1 flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-w-accent-muted">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                      style={{ backgroundColor: `${currentTeam.color}25` }}
                    >
                      {currentTeam.avatar}
                    </div>
                    <div>
                      <div className="text-[10px] font-extrabold uppercase text-w-text-muted">Lượt Trả Lời:</div>
                      <div className="text-sm font-black text-w-text-main">{currentTeam.name}</div>
                    </div>
                  </div>

                  {config.timerEnabled !== false && (
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border-2 ${
                      timeLeft <= 5 ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse' : 'bg-w-accent-light border-w-accent-border text-w-primary-dark'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timeLeft}s</span>
                    </div>
                  )}
                </div>

                {/* Question Content */}
                <div className="mt-4 space-y-2">
                  <div className="text-[11px] font-extrabold text-w-text-muted uppercase tracking-wider">
                    Câu hỏi số #{questionNumber}
                  </div>
                  <div className="text-sm sm:text-base font-black text-w-text-main leading-relaxed">
                    <MathChemRenderer text={currentQuestion.content} />
                  </div>
                </div>

                {/* Options (MCQ) */}
                {currentQuestion.options && currentQuestion.options.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {currentQuestion.options.map((opt, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrect = (typeof currentQuestion.correct === 'number' && currentQuestion.correct === idx) ||
                                        (typeof currentQuestion.correct === 'string' && String(currentQuestion.correct).toUpperCase() === ['A','B','C','D'][idx]);

                      let optStyle = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100';
                      if (showAnswer) {
                        if (isCorrect) {
                          optStyle = 'bg-emerald-500 text-w-text-main border-emerald-600 font-black';
                        } else if (isSelected) {
                          optStyle = 'bg-rose-500 text-w-text-main border-rose-600';
                        }
                      } else if (isSelected) {
                        optStyle = 'bg-w-primary-dark text-w-text-main border-w-primary-hover';
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => !showAnswer && setSelectedOption(idx)}
                          className={`w-full p-2.5 rounded-xl border-2 text-left font-bold text-xs sm:text-sm transition flex items-center gap-2.5 cursor-pointer ${optStyle}`}
                        >
                          <span className="w-5 h-5 rounded-md bg-white/70 backdrop-blur-sm flex items-center justify-center text-[10px] font-black shrink-0">
                            {['A','B','C','D'][idx]}
                          </span>
                          <span className="flex-1"><MathChemRenderer text={opt} /></span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Grading Buttons */}
              <div className="pt-3 border-t border-w-accent-muted flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAnswerSubmit(true)}
                    className="px-4 py-2.5 bg-w-primary-dark hover:bg-w-primary-hover text-w-text-main font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4 text-amber-500" />
                    <span>Trả Lời Đúng</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAnswerSubmit(false)}
                    className="px-4 py-2.5 bg-[#D86C70] hover:bg-[#C55A5E] text-w-text-main font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Chưa Đúng</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl border border-slate-300 transition cursor-pointer"
                >
                  {showAnswer ? 'Ẩn Lời Giải' : 'Hiện Đáp Án'}
                </button>
              </div>
            </motion.div>
          )}

          {/* STAGE 2: ROLL DICE PHASE */}
          {turnStage === 'dice' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-6 border-2 border-w-border shadow-md text-center space-y-5 flex-1 flex flex-col items-center justify-center"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-w-bg-alt text-amber-800 text-xs font-black">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Xúc Xắc Thần Kỳ</span>
              </div>

              <h4 className="text-base sm:text-lg font-black text-w-text-main">
                {currentTeam.name} Hãy Tung Xúc Xắc Để Di Chuyển!
              </h4>

              {/* 3D Dice Graphic */}
              <div className="py-4">
                <motion.div
                  animate={isRollingDice ? { rotate: [0, 90, 180, 270, 360], scale: [1, 1.2, 1] } : {}}
                  transition={isRollingDice ? { repeat: Infinity, duration: 0.25 } : {}}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-w-primary-dark to-[#2B3B1E] border-4 border-w-border text-w-text-main flex items-center justify-center text-4xl sm:text-5xl font-black shadow-xl mx-auto"
                >
                  {diceValue !== null ? diceValue : '🎲'}
                </motion.div>
              </div>

              <button
                type="button"
                onClick={handleRollDice}
                disabled={isRollingDice}
                className="px-8 py-4 bg-gradient-to-r from-w-primary-dark to-w-primary-hover hover:from-w-primary-hover hover:to-[#2B3B1E] text-w-text-main font-black text-base sm:text-lg rounded-2xl shadow-xl transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50 flex items-center gap-2 uppercase tracking-wide"
              >
                <Dices className="w-5 h-5 text-amber-500" />
                <span>{isRollingDice ? 'Đang Tung...' : 'TUNG XÚC XẮC'}</span>
              </button>
            </motion.div>
          )}

          {/* STAGE 3: MOVING & EVALUATION ANIMATION */}
          {turnStage === 'moving' && (
            <div className="bg-white rounded-3xl p-8 border-2 border-w-accent-muted text-center space-y-4 flex-1 flex flex-col items-center justify-center">
              <div className="text-5xl animate-bounce">🏃💨</div>
              <h4 className="text-base font-black text-w-text-main">
                {currentTeam.name} Đang Tiến Thêm {diceValue} Bước...
              </h4>
              <p className="text-xs text-w-text-muted font-semibold">
                Đang kiểm tra xem ô đến có bị Ông Smith bắt không...
              </p>
            </div>
          )}

          {/* STAGE 4: RESULT PHASE */}
          {turnStage === 'result' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 border-2 border-w-accent-muted shadow-sm text-center space-y-5 flex-1 flex flex-col justify-between"
            >
              <div className="space-y-3 pt-4">
                <div className="text-6xl">
                  {lastActionStatus === 'caught' ? '⛓️' : '🍏'}
                </div>
                <h4 className="text-lg font-black text-w-text-main">
                  {lastActionStatus === 'caught' ? 'Đã Bị Bắt!' : 'Hoàn Thành Lượt!'}
                </h4>
                <p className="text-xs text-w-text-muted font-semibold max-w-sm mx-auto">
                  {actionMessage}
                </p>
              </div>

              <div className="pt-4 border-t border-w-accent-muted">
                <button
                  type="button"
                  onClick={handleNextTurn}
                  className="w-full py-3.5 bg-gradient-to-r from-w-primary-dark to-w-primary-hover hover:from-w-primary-hover hover:to-[#2B3B1E] text-w-text-main font-black text-sm sm:text-base rounded-2xl shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Chuyển Lượt Đội Tiếp Theo</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STAGE 5: GAME OVER / VICTORY MODAL */}
          {turnStage === 'gameover' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-6 sm:p-8 border-4 border-w-border shadow-2xl text-center space-y-5 flex-1 flex flex-col items-center justify-center"
            >
              <div className="text-6xl sm:text-7xl">
                {winningTeam ? '🏆' : '👨‍🌾'}
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-w-text-main">
                  {winningTeam ? `🎉 ${winningTeam.name} CHIẾN THẮNG!` : 'ÔNG SMITH ĐÃ BẮT HẾT TẤT CẢ!'}
                </h3>
                <p className="text-xs sm:text-sm text-w-text-muted font-semibold mt-1">
                  {winningTeam 
                    ? `Xuất sắc hái đủ ${targetApples} quả táo và bảo vệ giỏ táo thành công!`
                    : `Số bí mật của Ông Smith là ${smithSecretNumber}. Hãy thử lại lần sau nhé!`}
                </p>
              </div>

              {/* Leaderboard */}
              <div className="w-full bg-w-bg-alt p-3 rounded-2xl border border-[#E3DCBA] space-y-2">
                <div className="text-xs font-black text-w-text-muted uppercase">Bảng Tổng Điểm Thu Hoạch:</div>
                {teams.map(t => (
                  <div key={t.id} className="flex items-center justify-between text-xs py-1 px-2 bg-white rounded-lg font-bold">
                    <span className="flex items-center gap-1.5">
                      <span>{t.avatar}</span>
                      <span>{t.name}</span>
                    </span>
                    <span className="text-w-primary-dark font-black">{t.apples} 🍎 ({t.apples * 10}đ)</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="px-6 py-3 bg-w-primary-dark hover:bg-w-primary-hover text-w-text-main font-black text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer"
                >
                  Chơi Ván Mới
                </button>
                <button
                  type="button"
                  onClick={handleEndGame}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer"
                >
                  Xem Báo Cáo
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* TILE INSPECTOR MODAL */}
      <AnimatePresence>
        {inspectedTile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border-4 border-[#8D5B4C]/80 relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b-2 border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner border-2 ${
                    inspectedTile.number === 1
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                      : inspectedTile.type === 'golden'
                      ? 'bg-amber-100 border-amber-400 text-amber-900'
                      : inspectedTile.type === 'spring'
                      ? 'bg-sky-100 border-sky-400 text-sky-900'
                      : 'bg-slate-100 border-slate-300 text-slate-800'
                  }`}>
                    {inspectedTile.number === 1 ? '🚩' : inspectedTile.number}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-1.5">
                      <span>Ô Số {inspectedTile.number}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                        {inspectedTile.number === 1
                          ? 'Cổng Vườn'
                          : inspectedTile.type === 'golden'
                          ? '⭐ Táo Vàng'
                          : inspectedTile.type === 'spring'
                          ? '🌀 Lò Xo'
                          : '🍏 Ô Thường'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">
                      {inspectedTile.number === 1
                        ? 'Vạch xuất phát xuất quân của các đội chơi'
                        : inspectedTile.type === 'golden'
                        ? 'Đội đứng vào nhận ngay +2 quả táo ngọt!'
                        : inspectedTile.type === 'spring'
                        ? 'Đội dẫm vào lò xo sẽ bay vọt thêm +2 ô!'
                        : 'Thu hoạch an toàn +1 quả táo vào giỏ!'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedTile(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Divisibility Inspector Table */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Bảng Kiểm Tra Tính Chia Hết:</span>
                  </span>
                  {showSmithSecret && (
                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      Số bí mật: {smithSecretNumber}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {[2, 3, 4, 5, 6].map(divisor => {
                    const isDivisible = inspectedTile.number % divisor === 0;
                    const isSmithDivisor = showSmithSecret && smithSecretNumber === divisor;
                    return (
                      <div
                        key={divisor}
                        className={`p-2 rounded-xl text-center border-2 transition ${
                          isSmithDivisor && isDivisible
                            ? 'bg-rose-500 border-rose-600 text-white font-black shadow-md ring-2 ring-rose-300 scale-105'
                            : isDivisible
                            ? 'bg-amber-50 border-amber-300 text-amber-900 font-black'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <div className="text-[10px] font-bold">÷ {divisor}</div>
                        <div className="text-xs font-black mt-0.5">
                          {isDivisible ? 'Chia hết' : `dư ${inspectedTile.number % divisor}`}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Status Message */}
                <div className={`p-3 rounded-2xl border-2 text-xs font-bold ${
                  showSmithSecret && inspectedTile.number % smithSecretNumber === 0
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}>
                  {showSmithSecret ? (
                    inspectedTile.number % smithSecretNumber === 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⚠️</span>
                        <div>
                          <strong className="block font-black text-rose-900">CẢNH BÁO: ĐÂY LÀ Ô BẪY!</strong>
                          Số {inspectedTile.number} chia hết cho {smithSecretNumber} ({inspectedTile.number} = {smithSecretNumber} × {inspectedTile.number / smithSecretNumber}). Đội nào dừng ở đây sẽ bị Ông Smith bắt!
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">✅</span>
                        <div>
                          <strong className="block font-black text-emerald-900">Ô NÀY HOÀN TOÀN AN TOÀN!</strong>
                          Số {inspectedTile.number} không chia hết cho {smithSecretNumber} ({inspectedTile.number} ÷ {smithSecretNumber} dư {inspectedTile.number % smithSecretNumber}). Thu hoạch táo an toàn!
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔍</span>
                      <div>
                        Nếu số {inspectedTile.number} chia hết cho số bí mật của Ông Smith, ô này sẽ biến thành bẫy! Hãy cẩn trọng phán đoán!
                      </div>
                    </div>
                  )}
                </div>

                {/* Current Pawns on This Tile */}
                {teams.filter(t => t.position === inspectedTile.number).length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="text-[11px] font-black text-slate-700 uppercase mb-1.5">
                      Đội đang đứng ở ô này:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {teams.filter(t => t.position === inspectedTile.number).map(t => (
                        <div
                          key={t.id}
                          className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-1.5 text-xs font-bold"
                        >
                          <span>{t.avatar}</span>
                          <span>{t.name}</span>
                          {t.isCaught && <span className="text-[10px] text-rose-600 font-black">(Đang bị nhốt)</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectedTile(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RULES MODAL */}
      <AnimatePresence>
        {showRulesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border-4 border-[#8D5B4C]/80 relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 border-2 border-amber-300 text-amber-900 flex items-center justify-center text-xl shadow-xs">
                    📜
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Luật Chơi Vườn Táo Ông Smith
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">
                      Toán học dấu hiệu chia hết & Đua hái táo tiếp sức
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRulesModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Rule Details */}
              <div className="mt-4 space-y-3 text-xs sm:text-sm text-slate-700">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <h4 className="font-black text-emerald-950 flex items-center gap-1.5 text-xs sm:text-sm mb-1">
                    <span>🎯</span>
                    <span>1. Mục Tiêu Ván Chơi</span>
                  </h4>
                  <p className="text-xs text-emerald-900">
                    Đội đầu tiên tích lũy đủ <strong>{targetApples} Quả Táo (🍎)</strong> trong giỏ sẽ giành chiến thắng chung cuộc!
                  </p>
                </div>

                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                  <h4 className="font-black text-amber-950 flex items-center gap-1.5 text-xs sm:text-sm mb-1">
                    <span>🎲</span>
                    <span>2. Lượt Chơi & Di Chuyển</span>
                  </h4>
                  <p className="text-xs text-amber-900">
                    Mỗi lượt, đội sẽ trả lời 1 câu hỏi. Trả lời đúng nhận quyền tung xúc xắc để bước tới trên đường đi gồm {totalTiles} ô quanh vườn táo. (Nếu bật chế độ bỏ qua câu hỏi, đội sẽ tung xúc xắc ngay).
                  </p>
                </div>

                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
                  <h4 className="font-black text-rose-950 flex items-center gap-1.5 text-xs sm:text-sm mb-1">
                    <span>👨‍🌾</span>
                    <span>3. Bẫy Chia Hết Của Ông Smith</span>
                  </h4>
                  <p className="text-xs text-rose-900 leading-relaxed">
                    Ông Smith giữ 1 số bí mật trong nhóm <strong>[2, 3, 4, 5, 6]</strong>. Nếu bạn dừng ở ô có số <strong>chia hết cho số bí mật</strong>, Ông Smith sẽ xuất hiện và nhốt bạn vào chuồng! Đội bị nhốt phải trả lời đúng câu hỏi ở lượt sau để được giải cứu.
                  </p>
                </div>

                <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200">
                  <h4 className="font-black text-sky-950 flex items-center gap-1.5 text-xs sm:text-sm mb-1">
                    <span>⭐</span>
                    <span>4. Các Ô Đặc Biệt Trên Bản Đồ</span>
                  </h4>
                  <ul className="text-xs text-sky-900 space-y-1 list-disc list-inside mt-1">
                    <li><strong>🚩 Ô 1 (Cổng vào):</strong> Vị trí an toàn bắt đầu cuộc đua.</li>
                    <li><strong>🍏 Ô Thường:</strong> Nhận +1 Quả Táo khi dừng chân an toàn.</li>
                    <li><strong>⭐ Ô Táo Vàng:</strong> Thưởng lớn +2 Quả Táo ngọt lịm!</li>
                    <li><strong>🌀 Ô Lò Xo Thần Tốc:</strong> Lò xo bật nảy giúp bạn tiến thêm +2 ô!</li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-black text-slate-800 flex items-center gap-1.5 text-xs sm:text-sm mb-1">
                    <span>💡</span>
                    <span>5. Chức Năng Soi Bẫy (Dành Cho Giáo Viên)</span>
                  </h4>
                  <p className="text-xs text-slate-600">
                    Bấm vào nút <strong>"Soi Bẫy (GV)"</strong> trên bản đồ để xem trước số bí mật và các ô bẫy màu đỏ nhấp nháy, giúp giáo viên điều phối và gợi ý cho học sinh một cách sinh động!
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowRulesModal(false)}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm rounded-xl transition cursor-pointer"
                >
                  Đã Hiểu, Bắt Đầu Thôi!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
