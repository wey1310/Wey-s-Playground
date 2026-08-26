import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Trophy, Sparkles, Clock, CheckCircle2, XCircle, Search, Eye, Award, Check, Shuffle } from 'lucide-react';
import { GameSetupConfig, Team, AnswerLog, Question } from '../../types';
import { soundFx } from '../../utils/audio';

interface SnailWordSearchGameProps {
  config: GameSetupConfig;
  questions?: Question[];
  onGameEnd: (teams: Team[], logs: AnswerLog[]) => void;
}

interface CellPos {
  r: number;
  c: number;
}

interface FoundWord {
  word: string;
  cells: CellPos[];
  color: string;
  foundByTeam: string;
}

const HIGHLIGHT_COLORS = [
  'bg-emerald-400/70 border-emerald-500 text-emerald-950 font-black',
  'bg-amber-400/70 border-amber-500 text-amber-950 font-black',
  'bg-sky-400/70 border-sky-500 text-sky-950 font-black',
  'bg-pink-400/70 border-pink-500 text-pink-950 font-black',
  'bg-purple-400/70 border-purple-500 text-purple-950 font-black',
  'bg-orange-400/70 border-orange-500 text-orange-950 font-black',
  'bg-teal-400/70 border-teal-500 text-teal-950 font-black',
  'bg-indigo-400/70 border-indigo-500 text-indigo-950 font-black',
];

const VIETNAMESE_CHARS = 'AĂÂBCDĐEÊGHIKLMNOÔƠPQRSTUƯVXY'.split('');

export const SnailWordSearchGame: React.FC<SnailWordSearchGameProps> = ({
  config,
  onGameEnd,
}) => {
  // Config Parameters
  const gridSize = config.gridSize || 10; // 8, 10, 12
  const difficulty = config.wordDifficulty || 'medium';
  const pointsPerWord = config.pointsPerCorrect || 20;
  const timeLimit = config.timerEnabled ? (config.timeLimitSeconds || 90) : 0;

  // Words list from configuration
  const targetWords: string[] = useMemo(() => {
    if (config.wordSearchList && config.wordSearchList.length > 0) {
      return config.wordSearchList.map(w => w.trim().toUpperCase()).filter(Boolean);
    }
    if (config.customPhrases && config.customPhrases.length > 0) {
      return config.customPhrases.map(w => w.trim().toUpperCase()).filter(Boolean);
    }
    return ['QUANG HỢP', 'HÔ HẤP', 'DIỆP LỤC', 'KHÍ KHỔNG', 'OXYGEN', 'MÔI TRƯỜNG', 'SINH HỌC'];
  }, [config.wordSearchList, config.customPhrases]);

  // Teams & State
  const [teams, setTeams] = useState<Team[]>(() => {
    if (config.teams && config.teams.length > 0) {
      return config.teams.map(t => ({ ...t, score: 0 }));
    }
    return [{ id: 'team_1', name: 'Đội 1', avatar: '🐌', color: '#E08283', score: 0 }];
  });
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);

  // Matrix generation algorithm
  const [grid, setGrid] = useState<string[][]>([]);
  const [wordPlacements, setWordPlacements] = useState<{ word: string; cells: CellPos[] }[]>([]);
  const [foundWords, setFoundWords] = useState<FoundWord[]>([]);

  // Selection state (click first cell then last cell OR dragging)
  const [startCell, setStartCell] = useState<CellPos | null>(null);
  const [hoverCell, setHoverCell] = useState<CellPos | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Mascot Snail Mood
  const [snailMood, setSnailMood] = useState<'happy' | 'cheering' | 'thinking' | 'victory'>('thinking');
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  // Generate Matrix
  const generateMatrix = useCallback(() => {
    const size = gridSize;
    const matrix: string[][] = Array.from({ length: size }, () => new Array(size).fill(''));
    const placements: { word: string; cells: CellPos[] }[] = [];

    // Directions allowed based on difficulty
    const directions: [number, number][] = [[0, 1], [1, 0]]; // Left-to-right & Top-to-bottom
    if (difficulty === 'medium' || difficulty === 'hard') {
      directions.push([1, 1], [-1, 1]); // Diagonals
    }
    if (difficulty === 'hard') {
      directions.push([0, -1], [-1, 0]); // Reversed
    }

    // Place each word
    for (const rawWord of targetWords) {
      const cleanWord = rawWord.replace(/\s+/g, '');
      const wordLen = cleanWord.length;
      if (wordLen > size) continue;

      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 150) {
        attempts++;
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const [dr, dc] = dir;

        const maxR = dr === 1 ? size - wordLen : dr === -1 ? size - 1 : size - 1;
        const minR = dr === -1 ? wordLen - 1 : 0;
        const maxC = dc === 1 ? size - wordLen : dc === -1 ? size - 1 : size - 1;
        const minC = dc === -1 ? wordLen - 1 : 0;

        if (maxR < minR || maxC < minC) continue;

        const startR = minR + Math.floor(Math.random() * (maxR - minR + 1));
        const startC = minC + Math.floor(Math.random() * (maxC - minC + 1));

        // Check if path is free or overlaps identical character
        let canPlace = true;
        const cells: CellPos[] = [];

        for (let i = 0; i < wordLen; i++) {
          const r = startR + dr * i;
          const c = startC + dc * i;
          if (r < 0 || r >= size || c < 0 || c >= size) {
            canPlace = false;
            break;
          }
          const char = cleanWord[i];
          if (matrix[r][c] !== '' && matrix[r][c] !== char) {
            canPlace = false;
            break;
          }
          cells.push({ r, c });
        }

        if (canPlace) {
          cells.forEach((cell, idx) => {
            matrix[cell.r][cell.c] = cleanWord[idx];
          });
          placements.push({ word: rawWord, cells });
          placed = true;
        }
      }
    }

    // Fill remaining empty cells with random Vietnamese letters
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c] === '') {
          matrix[r][c] = VIETNAMESE_CHARS[Math.floor(Math.random() * VIETNAMESE_CHARS.length)];
        }
      }
    }

    setGrid(matrix);
    setWordPlacements(placements);
    setFoundWords([]);
    setStartCell(null);
    setHoverCell(null);
  }, [gridSize, difficulty, targetWords]);

  useEffect(() => {
    generateMatrix();
  }, [generateMatrix]);

  // Timer
  useEffect(() => {
    if (!config.timerEnabled || timeLimit <= 0) return;
    if (foundWords.length >= wordPlacements.length && wordPlacements.length > 0) return;

    setTimeLeft(timeLimit);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          soundFx.wrong();
          onGameEnd(teams, answerLogs);
          return 0;
        }
        if (prev <= 5) soundFx.timerTick();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [config.timerEnabled, timeLimit, foundWords.length, wordPlacements.length]);

  // Calculate straight-line path between two cells
  const getSelectedPath = useCallback((start: CellPos, end: CellPos): CellPos[] => {
    const dr = end.r - start.r;
    const dc = end.c - start.c;
    const dist = Math.max(Math.abs(dr), Math.abs(dc));
    if (dist === 0) return [start];

    const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
    const stepC = dc === 0 ? 0 : dc / Math.abs(dc);

    // Only allow horizontal, vertical, and exact 45-degree diagonals
    if (Math.abs(dr) !== 0 && Math.abs(dc) !== 0 && Math.abs(dr) !== Math.abs(dc)) {
      return [start];
    }

    const path: CellPos[] = [];
    for (let i = 0; i <= dist; i++) {
      path.push({ r: start.r + stepR * i, c: start.c + stepC * i });
    }
    return path;
  }, []);

  const currentSelectionCells = useMemo(() => {
    if (!startCell) return [];
    if (!hoverCell) return [startCell];
    return getSelectedPath(startCell, hoverCell);
  }, [startCell, hoverCell, getSelectedPath]);

  // Check selection
  const verifySelection = (cells: CellPos[]) => {
    if (cells.length === 0) return;

    // Check against word placements
    const matchingPlacement = wordPlacements.find(p => {
      if (foundWords.some(f => f.word === p.word)) return false;
      if (p.cells.length !== cells.length) return false;

      // Normal or reverse match
      const normalMatch = p.cells.every((c, i) => c.r === cells[i].r && c.c === cells[i].c);
      const reverseMatch = p.cells.every((c, i) => c.r === cells[cells.length - 1 - i].r && c.c === cells[cells.length - 1 - i].c);
      return normalMatch || reverseMatch;
    });

    const activeTeam = teams[currentTeamIndex] || teams[0];

    if (matchingPlacement) {
      // MATCH FOUND!
      soundFx.correct();
      soundFx.powerup();

      const newFound: FoundWord = {
        word: matchingPlacement.word,
        cells: matchingPlacement.cells,
        color: HIGHLIGHT_COLORS[foundWords.length % HIGHLIGHT_COLORS.length],
        foundByTeam: activeTeam.name,
      };

      const nextFound = [...foundWords, newFound];
      setFoundWords(nextFound);

      // Score
      setTeams(prev => prev.map((t, idx) => {
        if (idx === currentTeamIndex) return { ...t, score: t.score + pointsPerWord };
        return t;
      }));

      // Mascot reaction
      setSnailMood('cheering');
      setTimeout(() => setSnailMood('happy'), 1800);

      const log: AnswerLog = {
        questionNumber: nextFound.length,
        questionText: `Tìm từ khóa: "${matchingPlacement.word}"`,
        correctAnswer: matchingPlacement.word,
        selectedAnswer: matchingPlacement.word,
        isCorrect: true,
        teamName: activeTeam.name,
        teamId: activeTeam.id,
        timestamp: Date.now(),
      };
      setAnswerLogs(prev => [...prev, log]);

      // Switch turn
      if (teams.length > 1 && nextFound.length < wordPlacements.length) {
        setCurrentTeamIndex(prev => (prev + 1) % teams.length);
      }

      // Check if all found!
      if (nextFound.length >= wordPlacements.length) {
        soundFx.winFanfare();
        setSnailMood('victory');
        setTimeout(() => {
          onGameEnd(teams, [...answerLogs, log]);
        }, 1200);
      }
    } else if (cells.length > 1) {
      soundFx.buttonClick();
    }

    setStartCell(null);
    setHoverCell(null);
  };

  const handleCellClick = (r: number, c: number) => {
    if (!startCell) {
      soundFx.buttonClick();
      setStartCell({ r, c });
      setHoverCell({ r, c });
    } else {
      const path = getSelectedPath(startCell, { r, c });
      verifySelection(path);
    }
  };

  const handleCellHover = (r: number, c: number) => {
    if (startCell) {
      setHoverCell({ r, c });
    }
  };

  const activeTeam = teams[currentTeamIndex] || teams[0];

  return (
    <div className="flex-1 flex flex-col items-center w-full max-w-6xl mx-auto select-none px-2 sm:px-4 py-2">
      {/* Top Bar: Teams, Progress, Timer */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3 items-center bg-w-bg-card border border-w-border p-3 sm:p-4 rounded-2xl shadow-xs wey-paper-card mb-3">
        {/* Teams */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {teams.map((t, idx) => {
            const isTurn = idx === currentTeamIndex;
            return (
              <div
                key={t.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                  isTurn
                    ? 'bg-w-accent-light border-w-primary-dark shadow-sm scale-105 ring-2 ring-w-primary-dark/30'
                    : 'bg-white border-slate-200 opacity-80'
                }`}
              >
                <span className="text-xl">{t.avatar || '🐌'}</span>
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

        {/* Found Words Progress */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-w-accent-light text-w-primary-dark border border-w-accent-border rounded-full text-xs font-bold shadow-2xs">
            <Search className="w-4 h-4 text-w-primary-dark" />
            Đã tìm thấy: {foundWords.length} / {wordPlacements.length} từ
          </span>
        </div>

        {/* Timer */}
        <div className="flex justify-end items-center gap-2">
          {config.timerEnabled && timeLimit > 0 && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-extrabold text-sm ${
              timeLeft <= 10
                ? 'bg-rose-100 border-rose-300 text-rose-700 animate-pulse'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{timeLeft}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid & Words List Layout */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 items-start">
        {/* Left Side: Mascot Snail + Target Words Checklist */}
        <div className="lg:col-span-1 space-y-3">
          {/* Animated Mascot Snail Box */}
          <div className="bg-w-bg-card border-2 border-w-border rounded-3xl p-4 shadow-sm text-center wey-paper-card">
            <div className="text-5xl sm:text-6xl mb-1 transform transition-transform hover:scale-110 cursor-pointer animate-bounce">
              {snailMood === 'cheering' ? '🐌🎉' : snailMood === 'victory' ? '🏆🐌' : '🐌🔍'}
            </div>
            <div className="text-xs font-[800] text-w-text-main">
              Ốc Sên Tinh Mắt
            </div>
            <p className="text-[10px] font-bold text-w-text-muted mt-0.5">
              {snailMood === 'cheering'
                ? 'Hoan hô! Bạn tìm ra 1 từ rồi!'
                : 'Nhấp chữ đầu rồi nhấp chữ cuối của từ!'}
            </p>
          </div>

          {/* Words List to Search */}
          <div className="bg-w-bg-card border border-w-border rounded-3xl p-4 shadow-sm wey-paper-card space-y-2">
            <h4 className="text-xs font-[900] uppercase tracking-wider text-w-primary-dark flex items-center justify-between">
              <span>Danh Sách Từ Cần Tìm</span>
              <span className="text-[10px] bg-w-accent-light text-w-primary-dark px-2 py-0.5 rounded-full">
                {wordPlacements.length} từ
              </span>
            </h4>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {wordPlacements.map((item) => {
                const isFound = foundWords.some(f => f.word === item.word);
                return (
                  <div
                    key={item.word}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs font-[800] transition-all ${
                      isFound
                        ? 'bg-w-accent-light text-w-primary-dark line-through border border-w-accent-border'
                        : 'bg-white text-w-text-main border border-[#E8DFCA]'
                    }`}
                  >
                    <span>{item.word}</span>
                    {isFound ? (
                      <Check className="w-4 h-4 text-w-primary-dark" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-300" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center/Right: Word Matrix Canvas Board */}
        <div className="lg:col-span-3 bg-w-bg-card border-2 border-w-primary-dark/30 rounded-3xl p-3 sm:p-6 shadow-md wey-paper-card flex flex-col items-center justify-center">
          <div
            className="grid gap-1 sm:gap-2 p-2 sm:p-4 bg-w-bg-tag rounded-2xl border-2 border-[#E8DFCA] shadow-inner"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            }}
          >
            {grid.map((row, r) =>
              row.map((char, c) => {
                // Check if part of already found word
                const foundItem = foundWords.find(f => f.cells.some(cell => cell.r === r && cell.c === c));
                // Check if part of active selection
                const isSelected = currentSelectionCells.some(cell => cell.r === r && cell.c === c);

                let cellStyle = 'bg-white hover:bg-w-accent-light text-w-text-main border-w-border';
                if (foundItem) {
                  cellStyle = foundItem.color;
                } else if (isSelected) {
                  cellStyle = 'bg-w-primary-dark text-w-text-main border-[#384C2A] scale-105 ring-2 ring-w-primary-dark/30 shadow-md';
                }

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => handleCellClick(r, c)}
                    onMouseEnter={() => handleCellHover(r, c)}
                    className={`w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl border font-mono font-[900] text-xs sm:text-base md:text-lg flex items-center justify-center transition-all transform cursor-pointer ${cellStyle}`}
                  >
                    {char}
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-3 text-center text-xs font-bold text-w-text-muted">
            Mẹo: Nhấp chuột vào ô chữ cái đầu tiên, sau đó nhấp vào ô chữ cái kết thúc của từ để khoanh vùng!
          </div>
        </div>
      </div>
    </div>
  );
};
