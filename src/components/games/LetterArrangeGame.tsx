import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Lightbulb, 
  Delete, 
  Eraser, 
  ArrowRight,
  HelpCircle,
  Award,
  Layers,
  Shuffle
} from 'lucide-react';
import { GameSetupConfig, Team, AnswerLog, Question } from '../../types';
import { soundFx } from '../../utils/audio';

interface LetterArrangeGameProps {
  config: GameSetupConfig;
  questions?: Question[];
  onGameEnd: (teams: Team[], logs: AnswerLog[]) => void;
}

interface LetterTile {
  id: string;
  char: string;
  isSpace: boolean;
  isPlaced: boolean;
}

interface WordPuzzle {
  id: string;
  targetWord: string;
  hint?: string;
  points: number;
}

export const LetterArrangeGame: React.FC<LetterArrangeGameProps> = ({
  config,
  questions = [],
  onGameEnd,
}) => {
  // Config
  const timeLimit = config.timeLimitSeconds || 45;
  const showHint = config.letterShowHint !== false;
  const showSpace = config.letterShowSpace !== false;
  const pointsPerCorrect = config.pointsPerCorrect || 20;
  const penaltyWrong = config.letterPenaltyWrong || false;

  // Teams
  const [teams, setTeams] = useState<Team[]>(() => {
    if (config.teams && config.teams.length > 0) {
      return config.teams.map(t => ({ ...t, score: t.score || 0 }));
    }
    return [
      { id: 'team-1', name: 'Đội 1', avatar: '🦁', color: '#E08283', score: 0 },
      { id: 'team-2', name: 'Đội 2', avatar: '🐯', color: '#3B82F6', score: 0 },
    ];
  });

  const [currentTeamIndex, setCurrentTeamIndex] = useState<number>(0);
  const activeTeam = teams[currentTeamIndex] || teams[0];

  // Puzzles generation from Custom List or Question Bank
  const puzzles: WordPuzzle[] = useMemo(() => {
    // 1. Custom list from config
    if (config.letterWordsList && config.letterWordsList.length > 0) {
      return config.letterWordsList.map((word, idx) => ({
        id: `custom_${idx}`,
        targetWord: word.trim().toUpperCase(),
        hint: `Từ khóa kiến thức #${idx + 1}`,
        points: pointsPerCorrect,
      }));
    }

    // 2. Extract from Question Bank if available
    if (questions && questions.length > 0) {
      const extracted: WordPuzzle[] = [];
      questions.forEach((q, idx) => {
        let word = '';
        if (q.options && q.options.length > 0 && typeof q.correct === 'number') {
          word = q.options[q.correct];
        } else if (typeof q.correct === 'string') {
          word = q.correct;
        }

        // Clean up word (keep letters and spaces)
        word = word.trim().toUpperCase();
        if (word.length >= 2 && word.length <= 25) {
          extracted.push({
            id: `q_${idx}`,
            targetWord: word,
            hint: q.content,
            points: pointsPerCorrect,
          });
        }
      });

      if (extracted.length > 0) return extracted;
    }

    // 3. Fallback rich scientific & educational terms
    return [
      { id: 'p1', targetWord: 'MẶT TRỜI', hint: 'Ngôi sao trung tâm của Hệ Mặt Trời mang lại ánh sáng cho Trái Đất', points: pointsPerCorrect },
      { id: 'p2', targetWord: 'QUANG HỢP', hint: 'Quá trình thực vật sử dụng ánh sáng để tổng hợp chất hữu cơ và giải phóng Oxy', points: pointsPerCorrect },
      { id: 'p3', targetWord: 'HỆ SINH THÁI', hint: 'Tập hợp các sinh vật và môi trường sống của chúng trong tự nhiên', points: pointsPerCorrect },
      { id: 'p4', targetWord: 'TAM GIÁC ĐỀU', hint: 'Hình hình học có ba cạnh bằng nhau và ba góc bằng nhau (60 độ)', points: pointsPerCorrect },
      { id: 'p5', targetWord: 'CHÂN LÝ', hint: 'Tri thức đúng đắn đã được thực tiễn kiểm nghiệm', points: pointsPerCorrect },
      { id: 'p6', targetWord: 'ĐỘNG NĂNG', hint: 'Dạng năng lượng một vật có được do chuyển động', points: pointsPerCorrect },
    ];
  }, [config.letterWordsList, questions, pointsPerCorrect]);

  const [puzzleIndex, setPuzzleIndex] = useState<number>(0);
  const currentPuzzle = puzzles[puzzleIndex % puzzles.length];

  // Letter tiles pool & Placed answer tiles
  const [letterPool, setLetterPool] = useState<LetterTile[]>([]);
  const [placedTiles, setPlacedTiles] = useState<LetterTile[]>([]);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [isCorrectResult, setIsCorrectResult] = useState<boolean | null>(null);
  const [hintRevealed, setHintRevealed] = useState<boolean>(false);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);

  // Timer
  const [timeLeft, setTimeLeft] = useState<number>(timeLimit);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Accurate Vietnamese Character Splitter using Array.from to preserve Unicode codepoints
  const splitVietnameseWord = (word: string): string[] => {
    return Array.from(word);
  };

  // Prepare & Shuffle Word into Letter Tiles
  const loadPuzzle = useCallback((puzzle: WordPuzzle) => {
    const chars = splitVietnameseWord(puzzle.targetWord);
    
    // Create distinct tiles with unique IDs
    const tiles: LetterTile[] = chars.map((ch, idx) => ({
      id: `${puzzle.id}_char_${idx}_${ch}`,
      char: ch,
      isSpace: ch === ' ',
      isPlaced: false,
    }));

    // Shuffle non-space tiles
    const nonSpaceTiles = tiles.filter(t => !t.isSpace);
    const shuffledNonSpace = [...nonSpaceTiles].sort(() => Math.random() - 0.5);

    // If accidental identical shuffle, shuffle once more
    const isIdentical = shuffledNonSpace.map(t => t.char).join('') === nonSpaceTiles.map(t => t.char).join('');
    if (isIdentical && shuffledNonSpace.length > 2) {
      shuffledNonSpace.reverse();
    }

    setLetterPool(shuffledNonSpace);
    setPlacedTiles([]);
    setIsAnswerChecked(false);
    setIsCorrectResult(null);
    setHintRevealed(false);
    setTimeLeft(timeLimit);
  }, [timeLimit]);

  useEffect(() => {
    if (currentPuzzle) {
      loadPuzzle(currentPuzzle);
    }
  }, [currentPuzzle, loadPuzzle]);

  // Timer tick
  useEffect(() => {
    if (isAnswerChecked) return;

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
  }, [isAnswerChecked, currentTeamIndex, puzzleIndex]);

  const handleTimeOut = () => {
    soundFx.wrong();
    setIsAnswerChecked(true);
    setIsCorrectResult(false);

    const newLog: AnswerLog = {
      questionNumber: puzzleIndex + 1,
      questionContent: currentPuzzle.hint || currentPuzzle.targetWord,
      selectedAnswer: 'Hết giờ',
      correctAnswer: currentPuzzle.targetWord,
      teamId: activeTeam.id,
      teamName: activeTeam.name,
      isCorrect: false,
      timestamp: Date.now(),
    };
    setAnswerLogs(prev => [...prev, newLog]);

    setTimeout(() => {
      passToNextTurn();
    }, 2200);
  };

  // Click letter in pool -> Place into answer row
  const handleSelectPoolTile = (tile: LetterTile) => {
    if (tile.isPlaced || isAnswerChecked) return;
    soundFx.buttonClick();

    setLetterPool(prev => prev.map(t => t.id === tile.id ? { ...t, isPlaced: true } : t));
    setPlacedTiles(prev => [...prev, tile]);
  };

  // Click letter in answer row -> Return to pool
  const handleRemovePlacedTile = (tile: LetterTile, index: number) => {
    if (isAnswerChecked) return;
    soundFx.buttonClick();

    setPlacedTiles(prev => prev.filter((_, idx) => idx !== index));
    setLetterPool(prev => prev.map(t => t.id === tile.id ? { ...t, isPlaced: false } : t));
  };

  // Add Space
  const handleAddSpace = () => {
    if (isAnswerChecked) return;
    soundFx.buttonClick();
    const spaceTile: LetterTile = {
      id: `space_${Date.now()}`,
      char: ' ',
      isSpace: true,
      isPlaced: true,
    };
    setPlacedTiles(prev => [...prev, spaceTile]);
  };

  // Clear last tile
  const handleBackspace = () => {
    if (placedTiles.length === 0 || isAnswerChecked) return;
    soundFx.buttonClick();

    const lastTile = placedTiles[placedTiles.length - 1];
    setPlacedTiles(prev => prev.slice(0, -1));
    if (!lastTile.isSpace) {
      setLetterPool(prev => prev.map(t => t.id === lastTile.id ? { ...t, isPlaced: false } : t));
    }
  };

  // Clear all
  const handleClearAll = () => {
    if (isAnswerChecked) return;
    soundFx.buttonClick();
    setPlacedTiles([]);
    setLetterPool(prev => prev.map(t => ({ ...t, isPlaced: false })));
  };

  // Check Answer
  const handleCheckAnswer = () => {
    if (isAnswerChecked) return;
    if (timerRef.current) clearInterval(timerRef.current);

    // Build assembled word (normalize spaces)
    const assembledWord = placedTiles.map(t => t.char).join('').trim();
    const targetWord = currentPuzzle.targetWord.trim();

    // Check equality (case-insensitive and whitespace-trimmed)
    const isCorrect = assembledWord.replace(/\s+/g, ' ') === targetWord.replace(/\s+/g, ' ');

    setIsAnswerChecked(true);
    setIsCorrectResult(isCorrect);

    const newLog: AnswerLog = {
      questionNumber: puzzleIndex + 1,
      questionContent: currentPuzzle.hint || currentPuzzle.targetWord,
      selectedAnswer: assembledWord || '(Để trống)',
      correctAnswer: targetWord,
      teamId: activeTeam.id,
      teamName: activeTeam.name,
      isCorrect,
      timestamp: Date.now(),
    };
    setAnswerLogs(prev => [...prev, newLog]);

    if (isCorrect) {
      soundFx.victory();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

      // Award points
      setTeams(prev => prev.map(t => {
        if (t.id === activeTeam.id) {
          return { ...t, score: t.score + currentPuzzle.points };
        }
        return t;
      }));

      setTimeout(() => {
        passToNextTurn();
      }, 2500);
    } else {
      soundFx.wrong();
      if (penaltyWrong) {
        setTeams(prev => prev.map(t => {
          if (t.id === activeTeam.id) {
            return { ...t, score: Math.max(0, t.score - 5) };
          }
          return t;
        }));
      }

      setTimeout(() => {
        passToNextTurn();
      }, 2500);
    }
  };

  const passToNextTurn = () => {
    setPuzzleIndex(prev => prev + 1);
    setCurrentTeamIndex(prev => (prev + 1) % teams.length);
  };

  const handleFinishGame = () => {
    onGameEnd(teams, answerLogs);
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-between p-3 sm:p-5 max-w-6xl mx-auto select-none">
      {/* Top Header & Scoreboard */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/90 backdrop-blur-sm p-4 rounded-3xl border-2 border-w-border shadow-sm mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl shadow-xs">
            🔤
          </div>
          <div>
            <h1 className="text-xl font-[900] text-w-text-main flex items-center gap-2">
              Sắp Xếp Chữ Cái
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Câu {puzzleIndex + 1}/{puzzles.length}
              </span>
            </h1>
            <p className="text-xs font-bold text-w-text-muted">
              Ghép các thẻ chữ cái bị xáo trộn thành từ khóa tiếng Việt chuẩn xác
            </p>
          </div>
        </div>

        {/* Score & Controls */}
        <div className="flex items-center gap-3">
          {teams.map((t, idx) => (
            <div
              key={t.id}
              className={`px-4 py-2 rounded-2xl border-2 transition-all flex items-center gap-2.5 ${
                idx === currentTeamIndex
                  ? 'bg-w-accent-light border-w-primary-dark shadow-md scale-105 ring-2 ring-w-primary-dark/20'
                  : 'bg-w-bg-card border-w-border'
              }`}
            >
              <span className="text-xl">{t.avatar}</span>
              <div>
                <span className="text-xs font-black text-w-text-main block">{t.name}</span>
                <span className="text-sm font-[900] text-w-primary-dark">{t.score} điểm</span>
              </div>
            </div>
          ))}

          <button
            onClick={handleFinishGame}
            className="px-3.5 py-2 bg-w-primary-dark hover:bg-[#3D522F] text-w-text-main text-xs font-black rounded-xl shadow-xs transition cursor-pointer"
          >
            Tổng Kết
          </button>
        </div>
      </div>

      {/* Main Puzzle Stage */}
      <div className="w-full flex-1 bg-gradient-to-b from-w-bg-card to-[#F5EFE0] rounded-3xl p-5 sm:p-8 border-2 border-w-border shadow-sm flex flex-col justify-between min-h-[460px]">
        {/* Question Header & Hint */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-w-border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-w-primary-dark bg-white px-3 py-1 rounded-xl border border-w-accent-border">
              Lượt của: {activeTeam.name}
            </span>
            {currentPuzzle.hint && (
              <span className="text-xs font-bold text-w-text-muted hidden sm:inline">
                💡 {currentPuzzle.hint}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showHint && currentPuzzle.hint && (
              <button
                onClick={() => setHintRevealed(!hintRevealed)}
                className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 transition"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Gợi Ý</span>
              </button>
            )}
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>{timeLeft}s</span>
            </div>
          </div>
        </div>

        {/* Revealed Hint Box */}
        {hintRevealed && currentPuzzle.hint && (
          <div className="mt-3 p-3 bg-amber-100/90 border border-amber-300 rounded-2xl text-amber-950 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{currentPuzzle.hint}</span>
          </div>
        )}

        {/* 1. Answer Target Row (Placed Letters) */}
        <div className="my-auto py-6 flex flex-col items-center justify-center">
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-w-text-muted mb-2 flex items-center gap-1">
            <span>VÙNG ĐÁP ÁN CỦA ĐỘI</span>
            <span>({placedTiles.length} Ký Tự Đã Đặt)</span>
          </div>

          {/* Answer Slot Container */}
          <div className="min-h-[72px] w-full max-w-4xl p-3 bg-white/90 rounded-3xl border-2 border-w-border shadow-inner flex items-center justify-center gap-2 flex-wrap">
            {placedTiles.length === 0 ? (
              <span className="text-xs font-bold text-w-text-muted italic">
                Chạm hoặc bấm các thẻ chữ cái bên dưới để sắp xếp vào đây...
              </span>
            ) : (
              placedTiles.map((tile, idx) => {
                if (tile.isSpace) {
                  return (
                    <button
                      key={tile.id}
                      onClick={() => handleRemovePlacedTile(tile, idx)}
                      className="px-3 py-3 rounded-2xl bg-amber-50 border-2 border-dashed border-amber-300 text-amber-800 text-xs font-black hover:bg-amber-100 transition cursor-pointer"
                      title="Khoảng trắng (Chạm để xóa)"
                    >
                      [DẤU CÁCH]
                    </button>
                  );
                }

                return (
                  <motion.button
                    key={tile.id}
                    layoutId={tile.id}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRemovePlacedTile(tile, idx)}
                    className="w-12 h-14 sm:w-14 sm:h-16 rounded-2xl bg-gradient-to-b from-w-primary to-w-primary-dark border-2 border-[#3D522F] text-w-text-main text-xl sm:text-2xl font-[900] shadow-md flex items-center justify-center transition cursor-pointer"
                    title="Chạm để đưa lại về kho chữ"
                  >
                    {tile.char}
                  </motion.button>
                );
              })
            )}
          </div>

          {/* Validation Feedback Banner */}
          {isAnswerChecked && (
            <div
              className={`mt-4 p-3 rounded-2xl border-2 flex items-center gap-3 animate-bounce shadow-md ${
                isCorrectResult
                  ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-black'
                  : 'bg-red-100 border-red-500 text-red-950 font-bold'
              }`}
            >
              {isCorrectResult ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <span>CHÍNH XÁC! Đáp án là "{currentPuzzle.targetWord}" (+{currentPuzzle.points} điểm)</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-500" />
                  <span>Chưa chính xác! Đáp án đúng là: "{currentPuzzle.targetWord}"</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* 2. Scrambled Letter Tiles Pool */}
        <div className="w-full flex flex-col items-center">
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-w-text-muted mb-2">
            KHO KÝ TỰ BỊ XÁO TRỘN
          </div>

          {/* Letter Tiles */}
          <div className="flex items-center justify-center gap-2.5 flex-wrap max-w-3xl mb-4">
            {letterPool.map(tile => {
              if (tile.isPlaced) {
                return (
                  <div
                    key={tile.id}
                    className="w-12 h-14 sm:w-14 sm:h-16 rounded-2xl bg-slate-200/60 border-2 border-dashed border-slate-300 opacity-40"
                  />
                );
              }

              return (
                <motion.button
                  key={tile.id}
                  layoutId={tile.id}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectPoolTile(tile)}
                  disabled={isAnswerChecked}
                  className="w-12 h-14 sm:w-14 sm:h-16 rounded-2xl bg-white hover:bg-w-accent-light border-2 border-w-border hover:border-w-primary-dark text-w-text-main text-xl sm:text-2xl font-[900] shadow-sm hover:shadow-md flex items-center justify-center transition cursor-pointer"
                >
                  {tile.char}
                </motion.button>
              );
            })}
          </div>

          {/* Control Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap justify-center">
            {showSpace && (
              <button
                onClick={handleAddSpace}
                disabled={isAnswerChecked}
                className="px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-black rounded-2xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>➕ Thêm Dấu Cách</span>
              </button>
            )}

            <button
              onClick={handleBackspace}
              disabled={placedTiles.length === 0 || isAnswerChecked}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-black rounded-2xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Delete className="w-4 h-4" />
              <span>Xóa Chữ Vừa Đặt</span>
            </button>

            <button
              onClick={handleClearAll}
              disabled={placedTiles.length === 0 || isAnswerChecked}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-black rounded-2xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Eraser className="w-4 h-4" />
              <span>Xóa Tất Cả</span>
            </button>

            <button
              onClick={handleCheckAnswer}
              disabled={placedTiles.length === 0 || isAnswerChecked}
              className="px-6 py-2.5 bg-w-primary-dark hover:bg-[#3D522F] text-w-text-main text-xs font-black rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>HOÀN TẤT & KIỂM TRA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
