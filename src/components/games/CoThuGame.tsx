import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Clock, RotateCcw, Volume2, VolumeX, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { GameSetupConfig, Question, AnswerLog, Team } from '../../types';
import { soundFx } from '../../utils/audio';

interface CoThuGameProps {
  config: GameSetupConfig;
  questions?: Question[];
  onEndGame?: (finalScores: Record<string, number>, logs?: AnswerLog[]) => void;
  onRunOutOfQuestions?: () => void;
  onUpdateScore?: (teamId: string, delta: number) => void;
}

type AnimalType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface Piece {
  id: string;
  type: AnimalType;
  teamId: string;
  x: number;
  y: number;
  isDead: boolean;
}

const ANIMAL_INFO: Record<AnimalType, { name: string, icon: string }> = {
  1: { name: 'Chuột', icon: '🐭' },
  2: { name: 'Mèo', icon: '🐱' },
  3: { name: 'Sói', icon: '🐺' }, // Note: Wolf is 3 in some variants, Dog is 3. We use standard: 3 Dog, 4 Wolf
  4: { name: 'Chó', icon: '🐶' }, 
  5: { name: 'Báo', icon: '🐆' },
  6: { name: 'Hổ', icon: '🐅' },
  7: { name: 'Sư tử', icon: '🦁' },
  8: { name: 'Voi', icon: '🐘' }
};

// Fix standard ranks: 1 Rat, 2 Cat, 3 Dog, 4 Wolf, 5 Leopard, 6 Tiger, 7 Lion, 8 Elephant
const RANKS: Record<AnimalType, string> = {
  1: '🐭', 2: '🐱', 3: '🐶', 4: '🐺', 5: '🐆', 6: '🐅', 7: '🦁', 8: '🐘'
};

const BOARD_COLS = 7;
const BOARD_ROWS = 9;

const isRiver = (x: number, y: number) => {
  return (y >= 3 && y <= 5) && ((x >= 1 && x <= 2) || (x >= 4 && x <= 5));
};

const isTrap = (x: number, y: number) => {
  if (y === 0 && (x === 2 || x === 4)) return true;
  if (y === 1 && x === 3) return true;
  if (y === 8 && (x === 2 || x === 4)) return true;
  if (y === 7 && x === 3) return true;
  return false;
};

const isDen = (x: number, y: number) => {
  return (x === 3 && y === 0) || (x === 3 && y === 8);
};

export const CoThuGame: React.FC<CoThuGameProps> = ({
  config,
  questions = [],
  onEndGame,
  onRunOutOfQuestions,
  onUpdateScore
}) => {
  const initialTeams: Team[] = config.teams && config.teams.length >= 2
    ? [config.teams[0], config.teams[1]] // Force 2 teams
    : [
        { id: 'team_red', name: 'Đội Đỏ', color: '#ef4444', avatar: '🔴', score: 0 },
        { id: 'team_blue', name: 'Đội Xanh', color: '#3b82f6', avatar: '🔵', score: 0 },
      ];

  const team1Id = initialTeams[0].id;
  const team2Id = initialTeams[1].id;

  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [currentTeamIndex, setCurrentTeamIndex] = useState<number>(0);
  
  const setupInitialPieces = (): Piece[] => {
    return [
      // Team 1 (Top - Row 0 to 2)
      { id: 't1_lion', type: 7, teamId: team1Id, x: 0, y: 0, isDead: false },
      { id: 't1_tiger', type: 6, teamId: team1Id, x: 6, y: 0, isDead: false },
      { id: 't1_dog', type: 3, teamId: team1Id, x: 1, y: 1, isDead: false },
      { id: 't1_cat', type: 2, teamId: team1Id, x: 5, y: 1, isDead: false },
      { id: 't1_rat', type: 1, teamId: team1Id, x: 0, y: 2, isDead: false },
      { id: 't1_leopard', type: 5, teamId: team1Id, x: 2, y: 2, isDead: false },
      { id: 't1_wolf', type: 4, teamId: team1Id, x: 4, y: 2, isDead: false },
      { id: 't1_elephant', type: 8, teamId: team1Id, x: 6, y: 2, isDead: false },

      // Team 2 (Bottom - Row 6 to 8)
      { id: 't2_elephant', type: 8, teamId: team2Id, x: 0, y: 6, isDead: false },
      { id: 't2_wolf', type: 4, teamId: team2Id, x: 2, y: 6, isDead: false },
      { id: 't2_leopard', type: 5, teamId: team2Id, x: 4, y: 6, isDead: false },
      { id: 't2_rat', type: 1, teamId: team2Id, x: 6, y: 6, isDead: false },
      { id: 't2_cat', type: 2, teamId: team2Id, x: 1, y: 7, isDead: false },
      { id: 't2_dog', type: 3, teamId: team2Id, x: 5, y: 7, isDead: false },
      { id: 't2_tiger', type: 6, teamId: team2Id, x: 0, y: 8, isDead: false },
      { id: 't2_lion', type: 7, teamId: team2Id, x: 6, y: 8, isDead: false },
    ];
  };

  const [pieces, setPieces] = useState<Piece[]>(setupInitialPieces);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<{x: number, y: number}[]>([]);

  // Turn Stages
  const [turnStage, setTurnStage] = useState<'question' | 'move' | 'gameover'>('question');

  // Question State
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [usedQuestionIndices, setUsedQuestionIndices] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(config.timeLimitSeconds || 30);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [actionLogText, setActionLogText] = useState<string>('Chào mừng đến với Cờ Thú (Jungle Chess)!');

  const currentTeam = teams[currentTeamIndex];

  const pickNewQuestion = () => {
    if (config.mode === 'none') {
      setTurnStage('move');
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
      chosen = {
        id: `q_${Date.now()}`,
        type: 'mcq',
        content: `Câu hỏi ngẫu nhiên: Vui lòng trả lời để giành quyền đi cờ!`,
        options: ['A', 'B', 'C', 'D'],
        correct: 0,
      };
    }

    setCurrentQuestion(chosen);
    setSelectedOption(null);
    setShowAnswer(false);
    setTimeLeft(config.timeLimitSeconds || 30);
    setIsTimerRunning(config.timerEnabled !== false);
    setTurnStage('question');
    setSelectedPieceId(null);
    setValidMoves([]);
  };

  useEffect(() => {
    pickNewQuestion();
  }, []);

  useEffect(() => {
    if (config.mode === 'none' && turnStage === 'question') {
      setTurnStage('move');
    }
  }, [config.mode, turnStage]);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          soundFx.wrong();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleEndTurn = () => {
    setSelectedPieceId(null);
    setValidMoves([]);
    setCurrentTeamIndex((currentTeamIndex + 1) % 2);
    pickNewQuestion();
  };

  const handleAnswerSubmit = (isCorrect: boolean) => {
    if (!currentQuestion) return;
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
      soundFx.correct();
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
      setActionLogText(`🎉 ${currentTeam.name} trả lời ĐÚNG! Bạn có 1 lượt đi cờ.`);
      
      // Update team score
      if (onUpdateScore) onUpdateScore(currentTeam.id, 10);
      setTeams(prev => prev.map(t => t.id === currentTeam.id ? { ...t, score: t.score + 10 } : t));
      
      setTimeout(() => {
        setTurnStage('move');
      }, 1000);
    } else {
      soundFx.wrong();
      setActionLogText(`❌ ${currentTeam.name} trả lời CHƯA ĐÚNG! Mất lượt đi.`);
      setTimeout(() => {
        handleEndTurn();
      }, 1500);
    }
  };

  // Game Logic
  const getPieceAt = (x: number, y: number) => pieces.find(p => !p.isDead && p.x === x && p.y === y);

  const canCapture = (attacker: Piece, defender: Piece) => {
    // Cannot capture own team
    if (attacker.teamId === defender.teamId) return false;

    // Rat in river cannot capture Elephant on land directly, but wait:
    // "A Rat in the river cannot capture an Elephant on land." -> True in most variants.
    // If attacker is in river and defender is on land, attacker rat cannot capture defender.
    if (attacker.type === 1 && isRiver(attacker.x, attacker.y) && !isRiver(defender.x, defender.y)) return false;

    // Defender in Trap -> any piece can capture it
    const defInTrap = isTrap(defender.x, defender.y);
    // Is it opponent's trap or own trap? Usually "any enemy piece in YOUR trap is rank 0". 
    // We simplify: if it's in a trap, it's vulnerable.
    if (defInTrap) {
      // Is it a trap of the attacker's team?
      const isTeam1Trap = defender.y === 0;
      const isTeam2Trap = defender.y === 8;
      if ((attacker.teamId === team1Id && isTeam1Trap) || (attacker.teamId === team2Id && isTeam2Trap)) {
        return true;
      }
    }

    // Exception: Rat captures Elephant
    if (attacker.type === 1 && defender.type === 8) return true;
    
    // Exception: Elephant cannot capture Rat
    if (attacker.type === 8 && defender.type === 1) return false;

    // Normal capture
    return attacker.type >= defender.type;
  };

  const calculateValidMoves = (piece: Piece) => {
    const moves: {x: number, y: number}[] = [];
    const dirs = [[0,1], [0,-1], [1,0], [-1,0]];

    dirs.forEach(([dx, dy]) => {
      let nx = piece.x + dx;
      let ny = piece.y + dy;

      if (nx < 0 || nx >= BOARD_COLS || ny < 0 || ny >= BOARD_ROWS) return;

      // Check own Den (cannot enter own den)
      if (isDen(nx, ny)) {
        const isTeam1Den = nx === 3 && ny === 0;
        const isTeam2Den = nx === 3 && ny === 8;
        if (piece.teamId === team1Id && isTeam1Den) return;
        if (piece.teamId === team2Id && isTeam2Den) return;
      }

      // Check River
      if (isRiver(nx, ny)) {
        if (piece.type === 1) {
          // Rat can enter river
          const target = getPieceAt(nx, ny);
          if (!target || canCapture(piece, target)) moves.push({x: nx, y: ny});
        } else if (piece.type === 6 || piece.type === 7) {
          // Tiger or Lion can jump the river IF no Rat is in the way
          let jumpX = nx;
          let jumpY = ny;
          let blocked = false;

          // Keep moving in same direction until out of river
          while (isRiver(jumpX, jumpY)) {
            const ratBlock = getPieceAt(jumpX, jumpY);
            if (ratBlock && !ratBlock.isDead) {
              blocked = true;
              break;
            }
            jumpX += dx;
            jumpY += dy;
          }

          if (!blocked && jumpX >= 0 && jumpX < BOARD_COLS && jumpY >= 0 && jumpY < BOARD_ROWS) {
            const target = getPieceAt(jumpX, jumpY);
            if (!target || canCapture(piece, target)) {
              moves.push({x: jumpX, y: jumpY});
            }
          }
        }
      } else {
        // Normal land move
        const target = getPieceAt(nx, ny);
        if (!target || canCapture(piece, target)) {
          moves.push({x: nx, y: ny});
        }
      }
    });

    setValidMoves(moves);
  };

  const handleTileClick = (x: number, y: number) => {
    if (turnStage !== 'move') return;

    const clickedPiece = getPieceAt(x, y);

    // If clicked on own piece, select it
    if (clickedPiece && clickedPiece.teamId === currentTeam.id) {
      setSelectedPieceId(clickedPiece.id);
      calculateValidMoves(clickedPiece);
      return;
    }

    // If clicked on valid move cell
    if (selectedPieceId && validMoves.some(m => m.x === x && m.y === y)) {
      const activePiece = pieces.find(p => p.id === selectedPieceId);
      if (!activePiece) return;

      soundFx.buttonClick();
      let captured = false;

      const newPieces = pieces.map(p => {
        // If there's an enemy piece here, mark it as dead
        if (p.x === x && p.y === y && !p.isDead && p.teamId !== activePiece.teamId) {
          captured = true;
          return { ...p, isDead: true };
        }
        // Move our piece
        if (p.id === activePiece.id) {
          return { ...p, x, y };
        }
        return p;
      });

      setPieces(newPieces);
      
      if (captured) {
        soundFx.correct();
        setActionLogText(`⚔️ ${currentTeam.name} đã ăn một quân cờ của đối phương!`);
      } else {
        setActionLogText(`🐾 ${currentTeam.name} di chuyển quân ${RANKS[activePiece.type]}.`);
      }

      // Check win condition
      const isTeam1Den = x === 3 && y === 0;
      const isTeam2Den = x === 3 && y === 8;
      
      if ((activePiece.teamId === team2Id && isTeam1Den) || (activePiece.teamId === team1Id && isTeam2Den)) {
        // Win!
        soundFx.victory();
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
        
        // Double points for the winner!
        if (onUpdateScore) {
          onUpdateScore(currentTeam.id, currentTeam.score); // Add score again = double
        }
        setTeams(prev => prev.map(t => t.id === currentTeam.id ? { ...t, score: t.score * 2 } : t));
        setActionLogText(`🏆 ĐẠI THẮNG! ${currentTeam.name} đã chiếm được Hang Ổ đối phương! Điểm được x2!`);
        setTurnStage('gameover');
      } else {
        setTimeout(() => {
          handleEndTurn();
        }, 1000);
      }
    } else {
      // Clicked on empty space or invalid
      setSelectedPieceId(null);
      setValidMoves([]);
    }
  };

  const handleRestart = () => {
    setTeams(initialTeams);
    setPieces(setupInitialPieces());
    setCurrentTeamIndex(0);
    setTurnStage('question');
    setActionLogText('Trận đấu mới bắt đầu!');
    pickNewQuestion();
  };

  const handleFinish = () => {
    if (onEndGame) {
      const scores: Record<string, number> = {};
      teams.forEach(t => scores[t.id] = t.score);
      onEndGame(scores, answerLogs);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col min-h-screen bg-[#F4F8F1] text-slate-800 select-none pb-12">
      {/* HEADER */}
      <header className="bg-white border-b-2 border-[#DCEBCB] px-4 py-3 shadow-xs sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#16a34a] to-[#047857] text-white flex items-center justify-center text-xl shadow-xs">
            🐾
          </div>
          <div>
            <h1 className="text-lg font-black text-[#35452E] flex items-center gap-2">
              <span>CỜ THÚ (JUNGLE CHESS)</span>
              <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-800 rounded-full font-bold uppercase border border-green-300">
                Boardgame
              </span>
            </h1>
            <div className="text-xs text-[#74806B] font-semibold flex items-center gap-2">
              <span>Đang tới lượt: </span>
              <span className="font-black px-2 py-0.5 rounded-md text-white" style={{ backgroundColor: currentTeam.color }}>
                {currentTeam.name}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleRestart} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chơi Lại</span>
          </button>
          <button onClick={handleFinish} className="px-3.5 py-1.5 bg-[#4F683C] hover:bg-[#3D522B] text-white text-xs font-black rounded-xl shadow-xs transition">
            Tổng Kết
          </button>
        </div>
      </header>

      {/* TEAMS BAR */}
      <div className="px-4 py-3 bg-[#F4F8F1] border-b border-[#DCEBCB] grid grid-cols-2 gap-4">
        {teams.map((t, idx) => {
          const isTurn = idx === currentTeamIndex && turnStage !== 'gameover';
          return (
            <div key={t.id} className={`p-3 rounded-2xl border-2 transition-all ${isTurn ? 'bg-white border-[#4F683C] shadow-lg ring-2 ring-[#4F683C]/20 scale-[1.02]' : 'bg-white border-[#DCEBCB]'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${t.color}20` }}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-black" style={{ color: t.color }}>{t.name}</div>
                  <div className="text-xs font-bold text-slate-500">Điểm: <span className="text-[#35452E] text-base">{t.score}</span></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex-1 px-4 py-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: GAME BOARD */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-3xl border-2 border-[#DCEBCB] shadow-sm flex flex-col items-center">
            
            {/* The 7x9 Grid */}
            <div className="grid grid-cols-7 gap-1 bg-[#E4C8A0] p-2 rounded-xl border-4 border-[#8B5A2B] shadow-inner max-w-full overflow-x-auto">
              {Array.from({ length: BOARD_ROWS }).map((_, y) => (
                Array.from({ length: BOARD_COLS }).map((_, x) => {
                  const piece = getPieceAt(x, y);
                  const isValidMove = validMoves.some(m => m.x === x && m.y === y);
                  
                  let cellBg = 'bg-[#FDF5E6]';
                  let cellContent = '';

                  if (isRiver(x, y)) {
                    cellBg = 'bg-[#87CEEB]';
                  } else if (isTrap(x, y)) {
                    cellBg = 'bg-[#D2B48C]';
                    cellContent = '🕸️';
                  } else if (isDen(x, y)) {
                    cellBg = 'bg-[#CD853F]';
                    cellContent = '⛺';
                  }

                  if (isValidMove) {
                    cellBg += ' ring-2 ring-inset ring-rose-500 cursor-pointer shadow-inner';
                  }

                  return (
                    <div 
                      key={`${x}-${y}`} 
                      onClick={() => handleTileClick(x, y)}
                      className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center border border-[#DEB887]/50 rounded-sm relative transition-all ${cellBg}`}
                    >
                      {cellContent && !piece && (
                        <span className="text-lg opacity-40 select-none pointer-events-none">{cellContent}</span>
                      )}

                      {piece && (
                        <motion.div
                          layoutId={`piece_${piece.id}`}
                          className={`absolute inset-1 rounded-full flex flex-col items-center justify-center text-sm shadow-md border-2 transition-all
                            ${piece.id === selectedPieceId 
                              ? 'border-white ring-4 ring-yellow-400 scale-110 z-20 shadow-lg' 
                              : (turnStage === 'move' && piece.teamId === currentTeam.id 
                                  ? 'border-amber-300 ring-2 ring-amber-400 ring-offset-1 z-10 cursor-pointer shadow-md' 
                                  : 'border-[#8B5A2B] opacity-90')}
                          `}
                          style={{ backgroundColor: teams.find(t => t.id === piece.teamId)?.color || '#999' }}
                        >
                          <span className="text-base sm:text-lg filter drop-shadow-sm">{RANKS[piece.type]}</span>
                        </motion.div>
                      )}

                      {/* Move dot */}
                      {isValidMove && !piece && (
                        <div className="absolute w-3 h-3 bg-rose-500 rounded-full opacity-60 pointer-events-none animate-pulse" />
                      )}
                    </div>
                  );
                })
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-600 justify-center">
              <div className="flex items-center gap-1">⛺ Hang Ổ (Vào được là Thắng)</div>
              <div className="flex items-center gap-1">🕸️ Bẫy (Vào bẫy sẽ bị ăn)</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 bg-[#87CEEB] rounded-sm inline-block"></span> Sông (Chuột đi được)</div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CONSOLE */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <motion.div
            key={actionLogText}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-3xl border-2 border-[#DCEBCB] bg-white shadow-sm flex items-start gap-3"
          >
            <div className="text-2xl mt-0.5">📜</div>
            <div className="text-sm font-bold text-[#35452E] leading-relaxed">
              {actionLogText}
            </div>
          </motion.div>

          {/* QUESTION PHASE */}
          {turnStage === 'question' && currentQuestion && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl p-5 border-2 border-[#DCEBCB] shadow-sm flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCEBCB]">
                <div className="text-xs font-extrabold uppercase text-[#74806B]">Lượt trả lời: <span style={{ color: currentTeam.color }}>{currentTeam.name}</span></div>
                {config.timerEnabled !== false && (
                  <div className={`px-2 py-1 rounded-lg text-xs font-black border-2 ${timeLeft <= 5 ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse' : 'bg-[#E9F0D9] border-[#B9CDA0] text-[#4F683C]'}`}>
                    ⏱️ {timeLeft}s
                  </div>
                )}
              </div>
              <div className="mt-4 flex-1">
                <p className="text-sm font-black text-[#35452E] leading-relaxed mb-4">{currentQuestion.content}</p>
                <div className="space-y-2">
                  {currentQuestion.options?.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = (typeof currentQuestion.correct === 'number' && currentQuestion.correct === idx) ||
                                      (typeof currentQuestion.correct === 'string' && String(currentQuestion.correct).toUpperCase() === ['A','B','C','D'][idx]);
                    
                    let optStyle = 'bg-slate-50 border-slate-200 text-slate-700';
                    if (showAnswer) {
                      optStyle = isCorrect ? 'bg-emerald-500 text-white border-emerald-600' : (isSelected ? 'bg-rose-500 text-white border-rose-600' : optStyle);
                    } else if (isSelected) {
                      optStyle = 'bg-[#4F683C] text-white border-[#3D522B]';
                    }

                    return (
                      <button key={idx} onClick={() => !showAnswer && setSelectedOption(idx)} className={`w-full p-2.5 rounded-xl border-2 text-left font-bold text-sm transition ${optStyle}`}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="pt-3 mt-4 border-t border-[#DCEBCB] flex gap-2">
                <button onClick={() => handleAnswerSubmit(true)} className="flex-1 py-2 bg-[#4F683C] text-white rounded-xl font-black text-xs">ĐÚNG</button>
                <button onClick={() => handleAnswerSubmit(false)} className="flex-1 py-2 bg-rose-500 text-white rounded-xl font-black text-xs">SAI</button>
              </div>
            </motion.div>
          )}

          {/* MOVE PHASE */}
          {turnStage === 'move' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl p-5 border-2 border-[#DCEBCB] shadow-sm flex-1 flex flex-col justify-center items-center text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl shadow-inner border border-blue-200">
                ♟️
              </div>
              <div>
                <h3 className="text-lg font-black text-[#35452E]">Lượt Đi Cờ: <span style={{ color: currentTeam.color }}>{currentTeam.name}</span></h3>
                <p className="text-sm text-[#74806B] font-semibold mt-1">Hãy nhấp vào quân cờ của bạn để xem đường đi hợp lệ.</p>
              </div>
              <button onClick={handleEndTurn} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold border border-slate-300 mt-4 transition">
                Bỏ Qua Lượt Đi
              </button>
            </motion.div>
          )}

          {/* GAME OVER PHASE */}
          {turnStage === 'gameover' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl p-6 border-4 border-amber-300 shadow-xl flex-1 flex flex-col justify-center items-center text-center space-y-4">
              <Trophy className="w-16 h-16 text-amber-500" />
              <h3 className="text-2xl font-black text-[#35452E]">KẾT THÚC VÁN CỜ!</h3>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 w-full text-amber-900 font-bold">
                <p>Điểm Đội Đỏ: {teams[0].score}</p>
                <p>Điểm Đội Xanh: {teams[1].score}</p>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};
