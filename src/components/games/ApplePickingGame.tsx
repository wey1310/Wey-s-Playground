import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Trophy, RotateCcw, Volume2, VolumeX, Eye, EyeOff, 
  HelpCircle, Clock, ChevronRight, CheckCircle, XCircle, 
  Sparkles, Dices, ArrowRight, ShieldAlert, Award, AlertTriangle, Users
} from 'lucide-react';
import { GameSetupConfig, Question, AnswerLog, Team } from '../../types';
import { soundFx } from '../../utils/audio';

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
        { id: 'team_2', name: 'Đội Thỏ Trắng 🐇', color: '#4F683C', avatar: '🐇', score: 0 },
        { id: 'team_3', name: 'Đội Gấu Nhỏ 🐻', color: '#D88A35', avatar: '🐻', score: 0 },
      ];

  // Game States
  const [teams, setTeams] = useState<TeamState[]>(() =>
    initialTeams.map(t => ({
      id: t.id,
      name: t.name,
      color: t.color || '#4F683C',
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

  // Board generation with some golden / booster tiles
  const boardTiles = React.useMemo<TileData[]>(() => {
    const tiles: TileData[] = [];
    for (let i = 1; i <= totalTiles; i++) {
      if (i % 7 === 0 && i !== totalTiles) {
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
      color: t.color || '#4F683C',
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
    <div className="w-full max-w-7xl mx-auto flex flex-col min-h-screen bg-[#FAF7EE] text-slate-800 select-none pb-12">
      
      {/* HEADER BAR */}
      <header className="bg-white border-b-2 border-[#E3DCBA] px-4 py-3 sm:px-6 shadow-xs sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#4F683C] text-white flex items-center justify-center text-xl shadow-xs">
            🍎
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-[#35452E] flex items-center gap-2">
              <span>HÁI TÁO</span>
              <span className="text-xs px-2.5 py-0.5 bg-[#E9D58F] text-[#5C4D15] rounded-full font-extrabold uppercase tracking-wide">
                Boardgame Giáo Dục
              </span>
            </h1>
            <p className="text-xs text-[#74806B] font-semibold">
              Mục tiêu: Đội nào hái đủ <strong className="text-[#35452E] font-black">{targetApples} 🍎</strong> trước sẽ chiến thắng!
            </p>
          </div>
        </div>

        {/* Teacher Controls & Smith Master Board */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mr. Smith Secret Indicator */}
          <div className="flex items-center gap-2 bg-[#35452E] text-[#FFFDF5] px-3.5 py-1.5 rounded-2xl border-2 border-[#E9D58F] shadow-xs">
            <div className="text-base">👨‍🌾</div>
            <div className="text-left">
              <div className="text-[10px] uppercase font-extrabold text-[#E9D58F]">Số bí mật Ông Smith:</div>
              <div className="text-xs font-black flex items-center gap-1.5">
                <span>{showSmithSecret ? `Chia hết cho ${smithSecretNumber}` : '❓ Ẩn Bí Mật'}</span>
                <button
                  type="button"
                  onClick={() => setShowSmithSecret(!showSmithSecret)}
                  className="text-[#E9D58F] hover:text-white p-0.5 rounded cursor-pointer"
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
            className="p-2 rounded-xl bg-white border border-[#DCEBCB] hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="Bật/Tắt âm thanh"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#4F683C]" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
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
            className="px-3.5 py-1.5 bg-[#4F683C] hover:bg-[#3D522B] text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer"
          >
            Tổng Kết
          </button>
        </div>
      </header>

      {/* TEAM SCORE & STATUS CARDS BAR */}
      <div className="px-4 py-3 sm:px-6 bg-[#FAF7EE] border-b border-[#E3DCBA]">
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
                    ? 'bg-white border-[#4F683C] shadow-lg ring-2 ring-[#4F683C]/30 scale-[1.02]'
                    : 'bg-white border-[#E3DCBA] shadow-2xs'
                }`}
              >
                {/* Active turn indicator pill */}
                {isTurn && (
                  <div className="absolute top-1.5 right-2 px-2 py-0.2 bg-[#4F683C] text-white text-[9px] font-black rounded-full uppercase tracking-wider animate-pulse">
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
                    <div className="text-xs font-extrabold text-[#35452E] truncate">{t.name}</div>
                    <div className="text-[11px] font-bold text-[#74806B] flex items-center gap-1">
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
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 border-2 border-[#E3DCBA] shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E3DCBA]">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌳</span>
              <div>
                <h3 className="text-sm font-black text-[#35452E] uppercase tracking-wide">
                  Đường Đi Vườn Táo ({totalTiles} Ô Bàn Cờ)
                </h3>
                <p className="text-[11px] text-[#74806B] font-semibold">
                  Cẩn thận: Ô chia hết cho số bí mật của Ông Smith sẽ bị bắt!
                </p>
              </div>
            </div>
            <div className="text-xs font-bold px-2.5 py-1 bg-[#FAF3D1] text-[#7A6218] rounded-xl border border-[#E9D58F]">
              Đích: {totalTiles} Ô
            </div>
          </div>

          {/* Interactive Winding Grid */}
          <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[520px] custom-scrollbar p-2">
            <div 
              className="min-w-[900px] grid grid-rows-6 gap-2 relative"
              style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}
            >
              {/* Mr. Smith's Secret Blocks (Center Area) */}
              <div 
                className="col-start-3 col-end-13 row-start-2 row-end-6 flex items-center justify-center gap-4 bg-slate-50/50 rounded-3xl border-2 border-dashed border-[#E3DCBA] p-4"
              >
                {[2, 3, 4, 5, 6].map(num => {
                  const isActive = smithSecretNumber === num && showSmithSecret;
                  return (
                    <div 
                      key={num}
                      className={`w-16 h-16 flex flex-col items-center justify-center rounded-2xl shadow-sm border-2 transition-all duration-500
                        ${isActive ? 'bg-[#4F683C] border-[#3D522B] text-white scale-110 shadow-lg' : 'bg-white border-[#E3DCBA] text-[#74806B] opacity-70'}
                      `}
                    >
                      <span className="text-[10px] font-black uppercase">Smith</span>
                      <span className="text-2xl font-black">{num}</span>
                    </div>
                  );
                })}
              </div>

              {boardTiles.map(tile => {
                const isDivisiblePreview = showSmithSecret && tile.number % smithSecretNumber === 0;
                // Pawns on this tile
                const pawnsOnTile = teams.filter(t => t.position === tile.number && !t.isCaught);
                const caughtOnTile = teams.filter(t => t.position === tile.number && t.isCaught);

                let tileBg = 'bg-[#FAF7EE] border-[#E3DCBA] text-slate-700';
                if (tile.type === 'golden') {
                  tileBg = 'bg-amber-50 border-amber-300 text-amber-900';
                } else if (tile.type === 'spring') {
                  tileBg = 'bg-sky-50 border-sky-300 text-sky-900';
                }

                if (isDivisiblePreview) {
                  tileBg += ' ring-2 ring-rose-400 bg-rose-50/80 shadow-md';
                }

                // Only render tiles 1-36 for the ring
                if (tile.number > 36) return null;

                return (
                  <div
                    key={tile.number}
                    className={`min-h-[72px] p-1.5 rounded-2xl border-2 flex flex-col justify-between relative transition-all ${tileBg}`}
                    style={{ gridArea: getGridArea(tile.number) }}
                  >
                    {/* Top Tile Info */}
                    <div className="flex items-center justify-between text-[11px] font-black">
                      <span className="w-5 h-5 rounded-lg bg-black/5 flex items-center justify-center">
                        {tile.number}
                      </span>
                      {tile.type === 'golden' && (
                        <span className="text-xs" title="Táo Vàng (+2 Táo)">⭐</span>
                      )}
                      {tile.type === 'spring' && (
                        <span className="text-xs" title="Lò Xo (+2 Ô)">🌀</span>
                      )}
                      {isDivisiblePreview && (
                        <span className="text-[10px] text-rose-500 font-extrabold" title="Ô Nguy Hiểm Của Ông Smith">⚠️</span>
                      )}
                    </div>

                    {/* Pawns Display */}
                    <div className="flex flex-wrap gap-1 items-center justify-center my-1">
                      {pawnsOnTile.map(pawn => (
                        <motion.div
                          key={pawn.id}
                          layoutId={`pawn_${pawn.id}`}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md border-2 border-white font-black"
                          style={{ backgroundColor: pawn.color }}
                          title={`${pawn.name} (Vị trí: ${tile.number})`}
                        >
                          <span className="text-[10px]">{pawn.avatar}</span>
                        </motion.div>
                      ))}

                      {caughtOnTile.map(cp => (
                        <div
                          key={cp.id}
                          className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] shadow-xs border border-white"
                          title={`${cp.name} (Bị bắt)`}
                        >
                          ⛓️
                        </div>
                      ))}
                    </div>

                    {/* Bottom Label if special */}
                    {tile.label && (
                      <div className="text-[8px] font-extrabold text-center truncate opacity-80">
                        {tile.label}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Board Legend */}
          <div className="mt-3 pt-3 border-t border-[#E3DCBA] flex flex-wrap gap-4 text-xs font-semibold text-[#74806B]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[#FAF7EE] border border-[#E3DCBA]" />
              <span>Ô Thường (+1 🍏 nếu an toàn)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-300" />
              <span>Ô Táo Vàng (+2 🍎)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-sky-100 border border-sky-300" />
              <span>Ô Lò Xo (+2 Ô)</span>
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
                : 'bg-white border-[#E3DCBA] text-[#35452E]'
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
              className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#DCEBCB] shadow-sm space-y-4 flex-1 flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#DCEBCB]">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                      style={{ backgroundColor: `${currentTeam.color}25` }}
                    >
                      {currentTeam.avatar}
                    </div>
                    <div>
                      <div className="text-[10px] font-extrabold uppercase text-[#74806B]">Lượt Trả Lời:</div>
                      <div className="text-sm font-black text-[#35452E]">{currentTeam.name}</div>
                    </div>
                  </div>

                  {config.timerEnabled !== false && (
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border-2 ${
                      timeLeft <= 5 ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse' : 'bg-[#E9F0D9] border-[#B9CDA0] text-[#4F683C]'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timeLeft}s</span>
                    </div>
                  )}
                </div>

                {/* Question Content */}
                <div className="mt-4 space-y-2">
                  <div className="text-[11px] font-extrabold text-[#74806B] uppercase tracking-wider">
                    Câu hỏi số #{questionNumber}
                  </div>
                  <p className="text-sm sm:text-base font-black text-[#35452E] leading-relaxed">
                    {currentQuestion.content}
                  </p>
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
                          optStyle = 'bg-emerald-500 text-white border-emerald-600 font-black';
                        } else if (isSelected) {
                          optStyle = 'bg-rose-500 text-white border-rose-600';
                        }
                      } else if (isSelected) {
                        optStyle = 'bg-[#4F683C] text-white border-[#3D522B]';
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => !showAnswer && setSelectedOption(idx)}
                          className={`w-full p-2.5 rounded-xl border-2 text-left font-bold text-xs sm:text-sm transition flex items-center gap-2.5 cursor-pointer ${optStyle}`}
                        >
                          <span className="w-5 h-5 rounded-md bg-black/10 flex items-center justify-center text-[10px] font-black shrink-0">
                            {['A','B','C','D'][idx]}
                          </span>
                          <span className="flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Grading Buttons */}
              <div className="pt-3 border-t border-[#DCEBCB] flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAnswerSubmit(true)}
                    className="px-4 py-2.5 bg-[#4F683C] hover:bg-[#3D522B] text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4 text-[#E9D58F]" />
                    <span>Trả Lời Đúng</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAnswerSubmit(false)}
                    className="px-4 py-2.5 bg-[#D86C70] hover:bg-[#C55A5E] text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
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
              className="bg-white rounded-3xl p-6 border-2 border-[#E9D58F] shadow-md text-center space-y-5 flex-1 flex flex-col items-center justify-center"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF3D1] text-[#7A6218] text-xs font-black">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Xúc Xắc Thần Kỳ</span>
              </div>

              <h4 className="text-base sm:text-lg font-black text-[#35452E]">
                {currentTeam.name} Hãy Tung Xúc Xắc Để Di Chuyển!
              </h4>

              {/* 3D Dice Graphic */}
              <div className="py-4">
                <motion.div
                  animate={isRollingDice ? { rotate: [0, 90, 180, 270, 360], scale: [1, 1.2, 1] } : {}}
                  transition={isRollingDice ? { repeat: Infinity, duration: 0.25 } : {}}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#4F683C] to-[#2B3B1E] border-4 border-[#E9D58F] text-white flex items-center justify-center text-4xl sm:text-5xl font-black shadow-xl mx-auto"
                >
                  {diceValue !== null ? diceValue : '🎲'}
                </motion.div>
              </div>

              <button
                type="button"
                onClick={handleRollDice}
                disabled={isRollingDice}
                className="px-8 py-4 bg-gradient-to-r from-[#4F683C] to-[#3D522B] hover:from-[#3D522B] hover:to-[#2B3B1E] text-white font-black text-base sm:text-lg rounded-2xl shadow-xl transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50 flex items-center gap-2 uppercase tracking-wide"
              >
                <Dices className="w-5 h-5 text-[#E9D58F]" />
                <span>{isRollingDice ? 'Đang Tung...' : 'TUNG XÚC XẮC'}</span>
              </button>
            </motion.div>
          )}

          {/* STAGE 3: MOVING & EVALUATION ANIMATION */}
          {turnStage === 'moving' && (
            <div className="bg-white rounded-3xl p-8 border-2 border-[#DCEBCB] text-center space-y-4 flex-1 flex flex-col items-center justify-center">
              <div className="text-5xl animate-bounce">🏃💨</div>
              <h4 className="text-base font-black text-[#35452E]">
                {currentTeam.name} Đang Tiến Thêm {diceValue} Bước...
              </h4>
              <p className="text-xs text-[#74806B] font-semibold">
                Đang kiểm tra xem ô đến có bị Ông Smith bắt không...
              </p>
            </div>
          )}

          {/* STAGE 4: RESULT PHASE */}
          {turnStage === 'result' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 border-2 border-[#DCEBCB] shadow-sm text-center space-y-5 flex-1 flex flex-col justify-between"
            >
              <div className="space-y-3 pt-4">
                <div className="text-6xl">
                  {lastActionStatus === 'caught' ? '⛓️' : '🍏'}
                </div>
                <h4 className="text-lg font-black text-[#35452E]">
                  {lastActionStatus === 'caught' ? 'Đã Bị Bắt!' : 'Hoàn Thành Lượt!'}
                </h4>
                <p className="text-xs text-[#74806B] font-semibold max-w-sm mx-auto">
                  {actionMessage}
                </p>
              </div>

              <div className="pt-4 border-t border-[#DCEBCB]">
                <button
                  type="button"
                  onClick={handleNextTurn}
                  className="w-full py-3.5 bg-gradient-to-r from-[#4F683C] to-[#3D522B] hover:from-[#3D522B] hover:to-[#2B3B1E] text-white font-black text-sm sm:text-base rounded-2xl shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
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
              className="bg-white rounded-3xl p-6 sm:p-8 border-4 border-[#E9D58F] shadow-2xl text-center space-y-5 flex-1 flex flex-col items-center justify-center"
            >
              <div className="text-6xl sm:text-7xl">
                {winningTeam ? '🏆' : '👨‍🌾'}
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#35452E]">
                  {winningTeam ? `🎉 ${winningTeam.name} CHIẾN THẮNG!` : 'ÔNG SMITH ĐÃ BẮT HẾT TẤT CẢ!'}
                </h3>
                <p className="text-xs sm:text-sm text-[#74806B] font-semibold mt-1">
                  {winningTeam 
                    ? `Xuất sắc hái đủ ${targetApples} quả táo và bảo vệ giỏ táo thành công!`
                    : `Số bí mật của Ông Smith là ${smithSecretNumber}. Hãy thử lại lần sau nhé!`}
                </p>
              </div>

              {/* Leaderboard */}
              <div className="w-full bg-[#FAF7EE] p-3 rounded-2xl border border-[#E3DCBA] space-y-2">
                <div className="text-xs font-black text-[#74806B] uppercase">Bảng Tổng Điểm Thu Hoạch:</div>
                {teams.map(t => (
                  <div key={t.id} className="flex items-center justify-between text-xs py-1 px-2 bg-white rounded-lg font-bold">
                    <span className="flex items-center gap-1.5">
                      <span>{t.avatar}</span>
                      <span>{t.name}</span>
                    </span>
                    <span className="text-[#4F683C] font-black">{t.apples} 🍎 ({t.apples * 10}đ)</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="px-6 py-3 bg-[#4F683C] hover:bg-[#3D522B] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer"
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
    </div>
  );
};
