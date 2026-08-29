import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Sparkles, 
  Clock, 
  Bomb, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  RotateCcw, 
  Zap, 
  ShieldAlert,
  ArrowRight,
  Eye,
  Award
} from 'lucide-react';
import { GameSetupConfig, Team, AnswerLog, Question } from '../../types';
import { soundFx } from '../../utils/audio';
import { MathChemRenderer } from '../../utils/mathChemFormatter';

interface MineBoomGameProps {
  config: GameSetupConfig;
  questions?: Question[];
  onGameEnd: (teams: Team[], logs: AnswerLog[]) => void;
}

interface TileItem {
  id: number;
  row: number;
  col: number;
  isBoom: boolean;
  points: number;
  isRevealed: boolean;
  revealedByTeamId?: string;
}

export const MineBoomGame: React.FC<MineBoomGameProps> = ({
  config,
  questions = [],
  onGameEnd,
}) => {
  // Configuration parameters
  const rows = config.mineRows || 4;
  const cols = config.mineCols || 4;
  const totalTiles = rows * cols;
  const boomCount = Math.min(config.mineCount || 3, totalTiles - 1);
  const minScore = config.mineMinScore ?? 10;
  const maxScore = config.mineMaxScore ?? 100;
  const boomPenalty = config.minePenalty ?? 20;
  const maxBoomsToLose = config.mineMaxBoomsToLose ?? 3;
  const timeLimit = config.timeLimitSeconds || 30;

  // Teams & Scores
  const [teams, setTeams] = useState<Team[]>(() => {
    if (config.teams && config.teams.length > 0) {
      return config.teams.map(t => ({ ...t, score: t.score || 0 }));
    }
    return [
      { id: 'team-1', name: 'Đội 1', avatar: '🦁', color: '#E08283', score: 0 },
      { id: 'team-2', name: 'Đội 2', avatar: '🐯', color: '#3B82F6', score: 0 },
    ];
  });

  // Track team boom counts: { [teamId]: number }
  const [teamBooms, setTeamBooms] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    teams.forEach(t => { initial[t.id] = 0; });
    return initial;
  });

  // Turn management
  const [currentTeamIndex, setCurrentTeamIndex] = useState<number>(0);
  const activeTeam = teams[currentTeamIndex] || teams[0];

  // Grid of tiles
  const [grid, setGrid] = useState<TileItem[]>([]);
  const [isTilePickingPhase, setIsTilePickingPhase] = useState<boolean>(false);
  const [justRevealedTile, setJustRevealedTile] = useState<TileItem | null>(null);

  // Question bank
  const safeQuestions = useMemo(() => {
    if (questions && questions.length > 0) return questions;
    return [
      { id: 'q1', content: 'Thủ đô của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam là gì?', options: ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Huế'], correct: 0 },
      { id: 'q2', content: 'Hình tam giác có tổng số đo ba góc trong bằng bao nhiêu độ?', options: ['90°', '180°', '360°', '270°'], correct: 1 },
      { id: 'q3', content: 'Hành tinh nào gần Mặt Trời nhất trong Hệ Mặt Trời?', options: ['Sao Kim', 'Sao Hỏa', 'Sao Thủy', 'Trái Đất'], correct: 2 },
      { id: 'q4', content: 'Chất khí nào chiếm thể tích lớn nhất trong không khí quyển Trái Đất?', options: ['Oxy', 'Cacbonic', 'Nitơ', 'Khí hiếm'], correct: 2 },
      { id: 'q5', content: 'Đơn vị đo cường độ dòng điện trong hệ SI là gì?', options: ['Vôn (V)', 'Ampe (A)', 'Oát (W)', 'Jun (J)'], correct: 1 },
      { id: 'q6', content: 'Bác Hồ đọc Tuyên ngôn Độc lập khai sinh nước VNDCCH vào năm nào?', options: ['1945', '1954', '1975', '1930'], correct: 0 },
      { id: 'q7', content: 'Cơ quan nào trong cơ thể con người lọc máu và tạo ra nước tiểu?', options: ['Tim', 'Gan', 'Thận', 'Phổi'], correct: 2 },
      { id: 'q8', content: 'Tác giả bài thơ "Đồng chí" nổi tiếng là ai?', options: ['Chính Hữu', 'Phạm Tiến Duật', 'Huy Cận', 'Tố Hữu'], correct: 0 },
    ];
  }, [questions]);

  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const currentQuestion = safeQuestions[questionIndex % safeQuestions.length];
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);

  // Timer
  const [timeLeft, setTimeLeft] = useState<number>(timeLimit);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Game Board (Randomize ONCE per match)
  const initBoard = () => {
    // Generate boom indices
    const boomIndices = new Set<number>();
    while (boomIndices.size < boomCount) {
      const rand = Math.floor(Math.random() * totalTiles);
      boomIndices.add(rand);
    }

    const newGrid: TileItem[] = [];
    for (let i = 0; i < totalTiles; i++) {
      const isBoom = boomIndices.has(i);
      // Randomize points between minScore & maxScore in steps of 10
      const step = 10;
      const steps = Math.floor((maxScore - minScore) / step);
      const points = isBoom ? 0 : minScore + (Math.floor(Math.random() * (steps + 1)) * step);

      newGrid.push({
        id: i,
        row: Math.floor(i / cols),
        col: i % cols,
        isBoom,
        points,
        isRevealed: false,
      });
    }

    setGrid(newGrid);
    setIsTilePickingPhase(false);
    setJustRevealedTile(null);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setTimeLeft(timeLimit);
    setIsTimerRunning(true);
  };

  useEffect(() => {
    initBoard();
  }, [rows, cols, boomCount]);

  // Timer effect
  useEffect(() => {
    if (!isTimerRunning || isTilePickingPhase || isAnswerChecked) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, isTilePickingPhase, isAnswerChecked, currentTeamIndex]);

  // Handle Timeout
  const handleTimeOut = () => {
    soundFx.wrong();
    setIsAnswerChecked(true);
    // Log
    const newLog: AnswerLog = {
      questionNumber: questionIndex + 1,
      questionContent: currentQuestion.content,
      selectedAnswer: 'Hết giờ',
      correctAnswer: currentQuestion.options?.[Number(currentQuestion.correct)] || String(currentQuestion.correct),
      teamId: activeTeam.id,
      teamName: activeTeam.name,
      isCorrect: false,
      timestamp: Date.now(),
    };
    setAnswerLogs(prev => [...prev, newLog]);

    setTimeout(() => {
      passToNextTeam();
    }, 2000);
  };

  // Check if team is eliminated
  const isTeamEliminated = (teamId: string) => {
    return (teamBooms[teamId] || 0) >= maxBoomsToLose;
  };

  // Find next active team
  const passToNextTeam = () => {
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setIsTilePickingPhase(false);
    setJustRevealedTile(null);
    setQuestionIndex(prev => prev + 1);
    setTimeLeft(timeLimit);
    setIsTimerRunning(true);

    // Find next non-eliminated team
    let nextIdx = (currentTeamIndex + 1) % teams.length;
    let attempts = 0;
    while (isTeamEliminated(teams[nextIdx].id) && attempts < teams.length) {
      nextIdx = (nextIdx + 1) % teams.length;
      attempts++;
    }

    // Check if only 1 active team remains
    const activeTeams = teams.filter(t => !isTeamEliminated(t.id));
    if (activeTeams.length <= 1 && teams.length > 1) {
      // Game Over! One team survived
      soundFx.victory();
      confetti({ particleCount: 120, spread: 80 });
      return;
    }

    setCurrentTeamIndex(nextIdx);
  };

  // Answer submit
  const handleSelectOption = (idx: number) => {
    if (isAnswerChecked || isTilePickingPhase) return;
    setSelectedOption(idx);
    setIsAnswerChecked(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = idx === Number(currentQuestion.correct);

    const newLog: AnswerLog = {
      questionNumber: questionIndex + 1,
      questionContent: currentQuestion.content,
      selectedAnswer: currentQuestion.options?.[idx] || String(idx),
      correctAnswer: currentQuestion.options?.[Number(currentQuestion.correct)] || String(currentQuestion.correct),
      teamId: activeTeam.id,
      teamName: activeTeam.name,
      isCorrect,
      timestamp: Date.now(),
    };
    setAnswerLogs(prev => [...prev, newLog]);

    if (isCorrect) {
      soundFx.correct();
      // Unlock tile picking phase
      setTimeout(() => {
        setIsTilePickingPhase(true);
      }, 1000);
    } else {
      soundFx.wrong();
      setTimeout(() => {
        passToNextTeam();
      }, 2000);
    }
  };

  // Tile click when team answered correctly
  const handleTileClick = (tile: TileItem) => {
    if (!isTilePickingPhase || tile.isRevealed) return;

    const updatedGrid = grid.map(t => {
      if (t.id === tile.id) {
        return { ...t, isRevealed: true, revealedByTeamId: activeTeam.id };
      }
      return t;
    });
    setGrid(updatedGrid);

    const revealed = { ...tile, isRevealed: true, revealedByTeamId: activeTeam.id };
    setJustRevealedTile(revealed);

    if (tile.isBoom) {
      // BOOM HIT!
      soundFx.laser(); // Boom sound
      const currentBooms = (teamBooms[activeTeam.id] || 0) + 1;
      setTeamBooms(prev => ({ ...prev, [activeTeam.id]: currentBooms }));

      // Deduct penalty points (minimum 0)
      setTeams(prev => prev.map(t => {
        if (t.id === activeTeam.id) {
          return { ...t, score: Math.max(0, t.score - boomPenalty) };
        }
        return t;
      }));

      // Check if team is eliminated
      if (currentBooms >= maxBoomsToLose) {
        soundFx.wrong();
      }
    } else {
      // SCORE HIT!
      soundFx.pointBeep();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      setTeams(prev => prev.map(t => {
        if (t.id === activeTeam.id) {
          return { ...t, score: t.score + tile.points };
        }
        return t;
      }));
    }

    // Auto advance turn after revealing
    setTimeout(() => {
      // Check if all tiles revealed
      const unrevealed = updatedGrid.filter(t => !t.isRevealed);
      if (unrevealed.length === 0) {
        soundFx.victory();
        return;
      }
      passToNextTeam();
    }, 2800);
  };

  const handleFinishGame = () => {
    onGameEnd(teams, answerLogs);
  };

  const activeTeamsCount = teams.filter(t => !isTeamEliminated(t.id)).length;
  const isOnlyOneSurvivor = teams.length > 1 && activeTeamsCount === 1;

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-between p-3 sm:p-5 max-w-6xl mx-auto select-none">
      {/* Top Header & Scoreboard */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/90 backdrop-blur-sm p-4 rounded-3xl border-2 border-w-border shadow-sm mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl shadow-xs">
            💣
          </div>
          <div>
            <h1 className="text-xl font-[900] text-w-text-main flex items-center gap-2">
              Dò Boom Tri Thức
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                {boomCount} 💣 Ẩn Giấu
              </span>
            </h1>
            <p className="text-xs font-bold text-w-text-muted">
              Trả lời đúng để dò ô nhận điểm thưởng • Tránh xa bẫy Boom! (3 Boom = Loại)
            </p>
          </div>
        </div>

        {/* Team Score Pills */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {teams.map((t, idx) => {
            const booms = teamBooms[t.id] || 0;
            const isEliminated = booms >= maxBoomsToLose;
            const isActive = idx === currentTeamIndex;

            return (
              <div
                key={t.id}
                className={`px-4 py-2 rounded-2xl border-2 transition-all flex items-center gap-2.5 ${
                  isEliminated
                    ? 'bg-slate-100 border-slate-300 opacity-60'
                    : isActive
                    ? 'bg-w-accent-light border-w-primary-dark shadow-md scale-105 ring-2 ring-w-primary-dark/20'
                    : 'bg-w-bg-card border-w-border'
                }`}
              >
                <span className="text-xl">{t.avatar}</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-w-text-main">{t.name}</span>
                    {isEliminated && (
                      <span className="text-[10px] bg-red-500 text-w-text-main font-black px-1.5 rounded">
                        BỊ LOẠI
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-black">
                    <span className="text-w-primary-dark">{t.score} đ</span>
                    <span className="text-red-500 flex items-center text-[10px]">
                      {Array.from({ length: maxBoomsToLose }).map((_, bIdx) => (
                        <span key={bIdx} className={bIdx < booms ? 'opacity-100 scale-110' : 'opacity-25'}>
                          💣
                        </span>
                      ))}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          <button
            onClick={handleFinishGame}
            className="px-3.5 py-2 bg-w-primary-dark hover:bg-[#3D522F] text-w-text-main text-xs font-black rounded-xl shadow-xs transition"
          >
            Tổng Kết
          </button>
        </div>
      </div>

      {/* Survivor Victory Banner */}
      {isOnlyOneSurvivor && (
        <div className="w-full mb-4 p-4 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 border-2 border-amber-500 rounded-2xl text-center shadow-lg animate-bounce">
          <h3 className="text-lg sm:text-2xl font-[900] text-w-text-main flex items-center justify-center gap-2">
            🏆 Chúc Mừng {teams.find(t => !isTeamEliminated(t.id))?.name} Đã Sống Sót & Chiến Thắng! 🏆
          </h3>
        </div>
      )}

      {/* Main Play Area */}
      <div className="w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Question Stage */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-white rounded-3xl p-5 border-2 border-w-border shadow-sm min-h-[380px]">
          {/* Question Header & Timer */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-w-border mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-w-accent-light text-w-primary-dark border border-w-accent-border">
                  Câu {questionIndex + 1}
                </span>
                <span className="text-xs font-bold text-w-text-muted">
                  Lượt của: <strong className="text-w-primary-dark">{activeTeam.name}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>{timeLeft}s</span>
              </div>
            </div>

            {/* Question Content */}
            <div className="text-base sm:text-lg font-[800] text-w-text-main leading-snug mb-4">
              <MathChemRenderer text={currentQuestion.content} />
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-2.5 my-auto">
            {currentQuestion.options?.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === Number(currentQuestion.correct);
              let btnClass = 'bg-w-bg-card hover:bg-[#F8F4E6] text-w-text-main border-w-border';

              if (isAnswerChecked) {
                if (isCorrect) {
                  btnClass = 'bg-emerald-100 border-emerald-500 text-emerald-950 font-black ring-2 ring-emerald-400';
                } else if (isSelected && !isCorrect) {
                  btnClass = 'bg-red-100 border-red-400 text-red-950 font-bold';
                } else {
                  btnClass = 'bg-slate-50 border-slate-200 text-w-text-muted opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswerChecked || isTilePickingPhase}
                  className={`w-full p-3 text-left text-sm rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${btnClass}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-white border border-w-border flex items-center justify-center text-xs font-black text-w-primary-dark">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-bold"><MathChemRenderer text={opt} /></span>
                  </div>
                  {isAnswerChecked && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  {isAnswerChecked && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                </button>
              );
            })}
          </div>

          {/* Guide / Status Box */}
          <div className="mt-4 pt-3 border-t border-w-border text-center">
            {isTilePickingPhase ? (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-black animate-pulse flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>CHÍNH XÁC! Hãy chọn 1 ô bất kỳ trên bảng Dò Boom để nhận điểm!</span>
              </div>
            ) : isAnswerChecked ? (
              <div className="p-2.5 bg-red-50 border border-red-300 rounded-xl text-red-800 text-xs font-bold flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Chưa chính xác! Mất lượt dò ô, chuyển sang đội tiếp theo...</span>
              </div>
            ) : (
              <p className="text-[11px] font-bold text-w-text-muted">
                Chọn đáp án đúng để kích hoạt quyền mở ô kho báu Dò Boom
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Boom Grid */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-gradient-to-b from-w-bg-card to-[#F5EFE0] rounded-3xl p-5 border-2 border-w-border shadow-sm min-h-[380px] relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-w-primary-dark bg-white px-3 py-1 rounded-xl border border-w-accent-border">
                Bản Đồ Kho Báu ({rows}x{cols})
              </span>
              <span className="text-xs font-bold text-w-text-muted">
                Đã mở: {grid.filter(t => t.isRevealed).length}/{grid.length}
              </span>
            </div>

            <button
              onClick={initBoard}
              className="p-2 bg-white hover:bg-slate-100 text-w-primary-dark border border-w-border rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              title="Khởi tạo lại bảng mới"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Làm Mới Bảng</span>
            </button>
          </div>

          {/* Tiles Grid */}
          <div 
            className="grid gap-3 w-full my-auto"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            }}
          >
            {grid.map(tile => {
              const isRevealed = tile.isRevealed;
              const isJustRevealed = justRevealedTile?.id === tile.id;

              return (
                <motion.button
                  key={tile.id}
                  whileHover={!isRevealed && isTilePickingPhase ? { scale: 1.05 } : {}}
                  whileTap={!isRevealed && isTilePickingPhase ? { scale: 0.95 } : {}}
                  onClick={() => handleTileClick(tile)}
                  disabled={isRevealed || !isTilePickingPhase}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 text-center transition-all relative overflow-hidden border-2 shadow-xs cursor-pointer ${
                    isRevealed
                      ? tile.isBoom
                        ? 'bg-gradient-to-br from-red-500 to-rose-600 border-red-700 text-w-text-main shadow-md'
                        : 'bg-gradient-to-br from-amber-100 to-yellow-200 border-amber-400 text-amber-900 shadow-md'
                      : isTilePickingPhase
                      ? 'bg-white hover:bg-w-accent-light border-w-primary-dark text-w-primary-dark shadow-md ring-2 ring-w-primary-dark/30 animate-pulse'
                      : 'bg-w-bg-card border-w-border text-w-text-muted'
                  }`}
                >
                  {isRevealed ? (
                    tile.isBoom ? (
                      <div className="flex flex-col items-center">
                        <span className="text-2xl sm:text-3xl animate-bounce">💣</span>
                        <span className="text-[11px] font-black uppercase tracking-wider text-red-100">
                          BOOM! -{boomPenalty}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="text-xl sm:text-2xl">⭐</span>
                        <span className="text-base sm:text-xl font-[900] text-amber-900">
                          +{tile.points}
                        </span>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-sm sm:text-base font-black text-w-primary-dark">
                        {tile.id + 1}
                      </span>
                      <span className="text-[10px] font-extrabold text-w-text-muted">
                        ❓
                      </span>
                    </div>
                  )}

                  {/* Just revealed spotlight */}
                  {isJustRevealed && (
                    <span className="absolute inset-0 border-4 border-yellow-400 rounded-2xl pointer-events-none animate-ping opacity-60" />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Notification Overlay for Boom or Score */}
          <AnimatePresence>
            {justRevealedTile && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`w-full mt-3 p-3 rounded-2xl border-2 flex items-center justify-between shadow-md ${
                  justRevealedTile.isBoom
                    ? 'bg-red-50 border-red-400 text-red-900'
                    : 'bg-amber-50 border-amber-400 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {justRevealedTile.isBoom ? '💥' : '🎉'}
                  </span>
                  <div>
                    <h4 className="text-xs font-black">
                      {justRevealedTile.isBoom
                        ? `Ô ${justRevealedTile.id + 1} DÍNH BOOM! Trừ ${boomPenalty} điểm!`
                        : `Ô ${justRevealedTile.id + 1} TRÚNG THƯỞNG +${justRevealedTile.points} ĐIỂM!`}
                    </h4>
                    <p className="text-[10px] font-bold opacity-80">
                      {justRevealedTile.isBoom
                        ? `${activeTeam.name} đã tích lũy ${teamBooms[activeTeam.id] || 1}/${maxBoomsToLose} quả Boom.`
                        : `Điểm số đã được cộng trực tiếp vào ${activeTeam.name}.`}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-white/80 border border-current">
                  {justRevealedTile.isBoom ? `💥 BOOM` : `+${justRevealedTile.points} Đ`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
