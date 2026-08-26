import { safeAlert, safeConfirm } from "../../utils/safeAlert";
import React, { useState, useEffect } from 'react';
import { GameSetupConfig, Question, AnswerLog } from '../../types';
import { soundFx } from '../../utils/audio';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Dices } from 'lucide-react';
import { QuestionDisplayModal } from '../QuestionDisplayModal';

interface MancalaGameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: any[], answerLogs: AnswerLog[]) => void;
}

interface Cell {
  id: number;
  isQuan: boolean;
  dan: number;
  quan: number;
  ownerTeamIdx?: number; // Which team owns this dân cell
}

export const MancalaGame: React.FC<MancalaGameProps> = ({ config, questions, onGameEnd }) => {
  const teams = config.teams;
  const numTeams = Math.min(4, Math.max(2, teams.length));

  const getTrianglePos = (idx: number) => {
    // Quan cells at the 3 vertices:
    if (idx === 11) return { x: 50, y: 15, rot: 0, isQuan: true }; // Top apex
    if (idx === 5) return { x: 85, y: 75, rot: 0, isQuan: true }; // Bottom right
    if (idx === 17) return { x: 15, y: 75, rot: 0, isQuan: true }; // Bottom left

    // Bottom side: Team 0 (cells 0, 1, 2, 3, 4) from left to right (from 17 to 5)
    if (idx >= 0 && idx <= 4) {
      const step = idx + 1;
      const x = 15 + step * 11.666;
      const y = 75;
      return { x, y, rot: 0, isQuan: false };
    }

    // Right side: Team 1 (cells 6, 7, 8, 9, 10) going up from bottom right to top apex
    if (idx >= 6 && idx <= 10) {
      const step = (idx - 5);
      const x = 85 - step * 5.833;
      const y = 75 - step * 10;
      return { x, y, rot: 0, isQuan: false };
    }

    // Left side: Team 2 (cells 12, 13, 14, 15, 16) going down from top apex to bottom left
    if (idx >= 12 && idx <= 16) {
      const step = (idx - 11);
      const x = 50 - step * 5.833;
      const y = 15 + step * 10;
      return { x, y, rot: 0, isQuan: false };
    }

    return { x: 50, y: 50, rot: 0, isQuan: false };
  };

  // Initialize Mancala Board depending on team count:
  // 2 teams: 10 dân cells (0-4 Team 0, 6-10 Team 1) and 2 quan cells (5 Right, 11 Left) -> 12 cells total
  // 3 teams: 15 dân cells (0-4 Team 0, 6-10 Team 1, 12-16 Team 2) and 3 quan cells (5, 11, 17) -> 18 cells total
  // 4 teams: 20 dân cells (0-4 Team 0, 6-10 Team 1, 12-16 Team 2, 18-22 Team 3) and 4 quan cells (5, 11, 17, 23) -> 24 cells total
  const [board, setBoard] = useState<Cell[]>(() => {
    if (numTeams === 2) {
      return Array.from({ length: 12 }, (_, i) => {
        if (i === 5 || i === 11) return { id: i, isQuan: true, dan: 0, quan: 1 };
        return {
          id: i,
          isQuan: false,
          dan: 5,
          quan: 0,
          ownerTeamIdx: i <= 4 ? 0 : 1,
        };
      });
    } else if (numTeams === 3) {
      return Array.from({ length: 18 }, (_, i) => {
        if (i === 5 || i === 11 || i === 17) return { id: i, isQuan: true, dan: 0, quan: 1 };
        return {
          id: i,
          isQuan: false,
          dan: 5,
          quan: 0,
          ownerTeamIdx: i <= 4 ? 0 : i <= 10 ? 1 : 2,
        };
      });
    } else {
      return Array.from({ length: 24 }, (_, i) => {
        if (i === 5 || i === 11 || i === 17 || i === 23) return { id: i, isQuan: true, dan: 0, quan: 1 };
        return {
          id: i,
          isQuan: false,
          dan: 5,
          quan: 0,
          ownerTeamIdx: i <= 4 ? 0 : i <= 10 ? 1 : i <= 16 ? 2 : 3,
        };
      });
    }
  });

  const [scores, setScores] = useState<number[]>(new Array(numTeams).fill(0));
  const [currentTurnTeamIdx, setCurrentTurnTeamIdx] = useState<number>(0);
  const [usedQuestionIndices, setUsedQuestionIndices] = useState<number[]>([]);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);

  // Turn state
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionNum, setCurrentQuestionNum] = useState<number | null>(null);
  const [gameState, setGameState] = useState<'WAIT_SPIN' | 'WAIT_JUDGE' | 'WAIT_SELECT_CELL' | 'ANIMATING'>('WAIT_SPIN');
  const [selectedCellIdx, setSelectedCellIdx] = useState<number | null>(null);
  const [manualCorrectText, setManualCorrectText] = useState<string>('');

  const currentTeam = teams[currentTurnTeamIdx] || teams[0];

  const handleSpinQuestion = () => {
    soundFx.diceRoll();

    if (config.mode === 'bank') {
      let availableIndices = questions.map((_, idx) => idx).filter(idx => !usedQuestionIndices.includes(idx));
      if (availableIndices.length === 0) {
        safeAlert('Đã quay hết câu hỏi! Đang lặp lại ngân hàng câu hỏi.');
        availableIndices = questions.map((_, idx) => idx);
        setUsedQuestionIndices([]);
      }
      const randIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      setUsedQuestionIndices(prev => [...prev, randIdx]);
      setCurrentQuestion(questions[randIdx]);
      setCurrentQuestionNum(randIdx + 1);
    } else {
      let randNum = Math.floor(Math.random() * config.totalQuestionsNumber) + 1;
      let count = 0;
      while (usedQuestionIndices.includes(randNum) && count < 100) {
        randNum = Math.floor(Math.random() * config.totalQuestionsNumber) + 1;
        count++;
      }
      setUsedQuestionIndices(prev => [...prev, randNum]);
      setCurrentQuestion(null);
      setCurrentQuestionNum(randNum);
    }

    setGameState('WAIT_JUDGE');
  };

  const handleJudgeAnswer = (isCorrect: boolean, correctAnswerText: string) => {
    if (isCorrect) {
      soundFx.correct();
      setGameState('WAIT_SELECT_CELL');
    } else {
      soundFx.wrong();
      // Record failed log
      const log: AnswerLog = {
        questionNumber: currentQuestionNum || 1,
        questionText: currentQuestion ? currentQuestion.content : `Câu số ${currentQuestionNum}`,
        correctAnswer: correctAnswerText,
        teamName: currentTeam.name,
        isCorrect: false,
      };
      setAnswerLogs(prev => [...prev, log]);

      // Switch turn
      nextTurn();
    }
  };

  const nextTurn = () => {
    setSelectedCellIdx(null);
    setCurrentQuestion(null);
    setCurrentQuestionNum(null);
    setCurrentTurnTeamIdx((currentTurnTeamIdx + 1) % numTeams);
    setGameState('WAIT_SPIN');
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Seed Sowing Logic (Rải Quân)
  const handleStartSowing = async (startIdx: number, direction: 'cw' | 'ccw') => {
    if (gameState !== 'WAIT_SELECT_CELL' || board[startIdx].isQuan || board[startIdx].dan === 0) return;

    setGameState('ANIMATING');
    setSelectedCellIdx(null);

    const step = direction === 'cw' ? 1 : -1;
    const boardSize = board.length;
    let newBoard = board.map(cell => ({ ...cell }));

    let currIdx = startIdx;
    let hand = newBoard[currIdx].dan;
    newBoard[currIdx].dan = 0;
    setBoard([...newBoard]);
    await sleep(300);

    let totalPointsCaptured = 0;

    while (true) {
      // Sow seeds from hand
      while (hand > 0) {
        currIdx = (currIdx + step + boardSize) % boardSize;
        hand--;
        newBoard[currIdx].dan++;
        soundFx.seedDrop();
        setBoard([...newBoard]);
        await sleep(350);
      }

      await sleep(250);

      // Check next cell
      let nextIdx = (currIdx + step + boardSize) % boardSize;

      // Rule 1: If next is Quan -> Stop
      if (newBoard[nextIdx].isQuan) {
        break;
      }

      // Rule 2: If next has seeds -> Pick up and sow again
      if (newBoard[nextIdx].dan > 0) {
        hand = newBoard[nextIdx].dan;
        newBoard[nextIdx].dan = 0;
        currIdx = nextIdx;
        setBoard([...newBoard]);
        await sleep(350);
        continue;
      }

      // Rule 3: If next cell is empty -> Check target cell after empty cell for CAPTURE (Ăn quân)
      if (newBoard[nextIdx].dan === 0) {
        let emptyCheckIdx = nextIdx;
        let targetCheckIdx = (emptyCheckIdx + step + boardSize) % boardSize;

        while (
          newBoard[emptyCheckIdx].dan === 0 &&
          (newBoard[targetCheckIdx].dan > 0 || newBoard[targetCheckIdx].quan > 0)
        ) {
          // CAPTURE
          const capturedScore = newBoard[targetCheckIdx].dan + newBoard[targetCheckIdx].quan * 10;
          totalPointsCaptured += capturedScore;

          newBoard[targetCheckIdx].dan = 0;
          newBoard[targetCheckIdx].quan = 0;

          soundFx.capture();
          setBoard([...newBoard]);
          await sleep(500);

          // Check consecutive captures
          emptyCheckIdx = (targetCheckIdx + step + boardSize) % boardSize;
          targetCheckIdx = (emptyCheckIdx + step + boardSize) % boardSize;
        }

        break; // End sowing
      }
    }

    // Award captured score to current team
    if (totalPointsCaptured > 0) {
      setScores(prev => {
        const updated = [...prev];
        updated[currentTurnTeamIdx] += totalPointsCaptured;
        return updated;
      });
    }

    // Save answer log
    const log: AnswerLog = {
      questionNumber: currentQuestionNum || 1,
      questionText: currentQuestion ? currentQuestion.content : `Câu số ${currentQuestionNum}`,
      correctAnswer: currentQuestion
        ? (currentQuestion.type === 'mcq'
            ? `${String.fromCharCode(65 + Number(currentQuestion.correct))}. ${currentQuestion.options?.[Number(currentQuestion.correct)]}`
            : currentQuestion.type === 'tf'
            ? (currentQuestion.correct ? 'ĐÚNG' : 'SAI')
            : String(currentQuestion.correct))
        : (manualCorrectText || 'Đúng'),
      teamName: currentTeam.name,
      isCorrect: true,
    };
    setAnswerLogs(prev => [...prev, log]);

    // Check if all Quan are captured -> Game Over
    const quanCells = newBoard.filter(c => c.isQuan);
    const allQuanCaptured = quanCells.every(c => c.quan === 0 && c.dan === 0);

    const currentTeamsWithScores = teams.map((t, idx) => ({ ...t, score: scores[idx] || 0 }));
    if (allQuanCaptured) {
      soundFx.winFanfare();
      setTimeout(() => onGameEnd(currentTeamsWithScores, [...answerLogs, log]), 600);
    } else {
      nextTurn();
    }
  };

  // Automatic refill rule: If active player has no seeds in any of their 5 ô dân, auto-fill 1 seed per cell and deduct 5 points
  useEffect(() => {
    if (gameState === 'WAIT_SELECT_CELL') {
      const ownedCells = board.filter(c => !c.isQuan && c.ownerTeamIdx === currentTurnTeamIdx);
      const isAllEmpty = ownedCells.length > 0 && ownedCells.every(c => c.dan === 0);

      if (isAllEmpty) {
        setBoard(prev =>
          prev.map(c => {
            if (!c.isQuan && c.ownerTeamIdx === currentTurnTeamIdx) {
              return { ...c, dan: 1 };
            }
            return c;
          })
        );
        setScores(prev => {
          const updated = [...prev];
          updated[currentTurnTeamIdx] -= 5;
          return updated;
        });
        soundFx.seedDrop();
      }
    }
  }, [gameState, currentTurnTeamIdx, board]);

  // Color Theme helper matching team names or colors
  const getTeamColorTheme = (teamIdx?: number, teamName?: string, teamColorHex?: string) => {
    const nameLower = (teamName || '').toLowerCase();

    if (nameLower.includes('đỏ') || nameLower.includes('red') || teamColorHex === '#ef4444') {
      return {
        bg: 'bg-rose-100/90',
        border: 'border-rose-600',
        text: 'text-rose-900',
        ring: 'ring-rose-500',
        badge: 'bg-rose-600 text-w-text-main border-rose-700',
        stoneFrom: 'from-rose-300 via-rose-400 to-rose-600',
        stoneBorder: 'border-rose-700',
        activeBg: 'bg-rose-200 border-rose-600',
      };
    }

    if (nameLower.includes('xanh') || nameLower.includes('blue') || nameLower.includes('cyan') || teamColorHex === '#3b82f6') {
      return {
        bg: 'bg-cyan-100/90',
        border: 'border-cyan-600',
        text: 'text-cyan-900',
        ring: 'ring-cyan-500',
        badge: 'bg-cyan-600 text-w-text-main border-cyan-700',
        stoneFrom: 'from-cyan-200 via-cyan-300 to-cyan-500',
        stoneBorder: 'border-cyan-600',
        activeBg: 'bg-cyan-200 border-cyan-600',
      };
    }

    if (nameLower.includes('vàng') || nameLower.includes('yellow') || nameLower.includes('gold') || teamColorHex === '#f59e0b') {
      return {
        bg: 'bg-amber-100/90',
        border: 'border-amber-600',
        text: 'text-amber-900',
        ring: 'ring-amber-500',
        badge: 'bg-amber-600 text-w-text-main border-amber-700',
        stoneFrom: 'from-amber-200 via-yellow-300 to-amber-500',
        stoneBorder: 'border-amber-700',
        activeBg: 'bg-amber-200 border-amber-600',
      };
    }

    if (nameLower.includes('lục') || nameLower.includes('lá') || nameLower.includes('green') || teamColorHex === '#10b981') {
      return {
        bg: 'bg-emerald-100/90',
        border: 'border-emerald-600',
        text: 'text-emerald-900',
        ring: 'ring-emerald-500',
        badge: 'bg-emerald-600 text-w-text-main border-emerald-700',
        stoneFrom: 'from-emerald-200 via-emerald-300 to-emerald-500',
        stoneBorder: 'border-emerald-700',
        activeBg: 'bg-emerald-200 border-emerald-600',
      };
    }

    if (nameLower.includes('tím') || nameLower.includes('purple')) {
      return {
        bg: 'bg-purple-100/90',
        border: 'border-purple-600',
        text: 'text-purple-900',
        ring: 'ring-purple-500',
        badge: 'bg-purple-600 text-w-text-main border-purple-700',
        stoneFrom: 'from-purple-200 via-purple-300 to-purple-500',
        stoneBorder: 'border-purple-700',
        activeBg: 'bg-purple-200 border-purple-600',
      };
    }

    if (nameLower.includes('cam') || nameLower.includes('orange')) {
      return {
        bg: 'bg-orange-100/90',
        border: 'border-orange-600',
        text: 'text-orange-900',
        ring: 'ring-orange-500',
        badge: 'bg-orange-600 text-w-text-main border-orange-700',
        stoneFrom: 'from-orange-200 via-orange-300 to-orange-500',
        stoneBorder: 'border-orange-700',
        activeBg: 'bg-orange-200 border-orange-600',
      };
    }

    if (nameLower.includes('hồng') || nameLower.includes('pink')) {
      return {
        bg: 'bg-pink-100/90',
        border: 'border-pink-600',
        text: 'text-pink-900',
        ring: 'ring-pink-500',
        badge: 'bg-pink-600 text-w-text-main border-pink-700',
        stoneFrom: 'from-pink-200 via-pink-300 to-pink-500',
        stoneBorder: 'border-pink-700',
        activeBg: 'bg-pink-200 border-pink-600',
      };
    }

    // Fallback by index
    switch (teamIdx) {
      case 0:
        return {
          bg: 'bg-rose-100/90',
          border: 'border-rose-600',
          text: 'text-rose-950',
          ring: 'ring-rose-500',
          badge: 'bg-rose-600 text-w-text-main border-rose-700',
          stoneFrom: 'from-rose-200 via-rose-400 to-rose-600',
          stoneBorder: 'border-rose-700',
          activeBg: 'bg-rose-200 border-rose-600',
        };
      case 1:
        return {
          bg: 'bg-cyan-100/90',
          border: 'border-cyan-600',
          text: 'text-cyan-950',
          ring: 'ring-cyan-500',
          badge: 'bg-cyan-600 text-w-text-main border-cyan-700',
          stoneFrom: 'from-cyan-200 via-cyan-300 to-cyan-500',
          stoneBorder: 'border-cyan-600',
          activeBg: 'bg-cyan-200 border-cyan-600',
        };
      case 2:
        return {
          bg: 'bg-amber-100/90',
          border: 'border-amber-600',
          text: 'text-amber-950',
          ring: 'ring-amber-500',
          badge: 'bg-amber-600 text-w-text-main border-amber-700',
          stoneFrom: 'from-amber-200 via-yellow-300 to-amber-500',
          stoneBorder: 'border-amber-700',
          activeBg: 'bg-amber-200 border-amber-600',
        };
      case 3:
        return {
          bg: 'bg-emerald-100/90',
          border: 'border-emerald-600',
          text: 'text-emerald-950',
          ring: 'ring-emerald-500',
          badge: 'bg-emerald-600 text-w-text-main border-emerald-700',
          stoneFrom: 'from-emerald-200 via-emerald-300 to-emerald-500',
          stoneBorder: 'border-emerald-700',
          activeBg: 'bg-emerald-200 border-emerald-600',
        };
      default:
        return {
          bg: 'bg-amber-50',
          border: 'border-stone-500',
          text: 'text-stone-900',
          ring: 'ring-amber-500',
          badge: 'bg-stone-700 text-w-text-main border-stone-800',
          stoneFrom: 'from-stone-200 via-stone-300 to-stone-400',
          stoneBorder: 'border-stone-500',
          activeBg: 'bg-amber-200 border-amber-600',
        };
    }
  };

  // Render organic river stone / pebble with random rotation and overlap
  const renderPebble = (
    sIdx: number,
    theme: ReturnType<typeof getTeamColorTheme>,
    isQuanStone: boolean = false
  ) => {
    // Generate organic stone border radii
    const shapes = [
      'rounded-[55%_45%_65%_35%/45%_55%_35%_65%]',
      'rounded-[42%_58%_48%_52%/58%_42%_52%_48%]',
      'rounded-[60%_40%_50%_50%/50%_50%_40%_60%]',
      'rounded-[48%_52%_38%_62%/52%_48%_62%_38%]',
    ];
    const shape = shapes[sIdx % shapes.length];
    const rotDeg = ((sIdx * 37) % 24) - 12; // -12deg to +12deg

    if (isQuanStone) {
      return (
        <div
          key={`quan-${sIdx}`}
          style={{ transform: `rotate(${rotDeg}deg)` }}
          className="w-7 sm:w-9 h-7 sm:h-9 rounded-[48%_52%_55%_45%/50%_45%_55%_50%] bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-100 shadow-md border-2 border-amber-800 flex items-center justify-center text-xs sm:text-sm font-black text-amber-950 hover:scale-105 z-10 shrink-0 select-none"
          title="Quân Quan (10 điểm)"
        >
          👑
        </div>
      );
    }

    return (
      <div
        key={`dan-${sIdx}`}
        style={{ transform: `rotate(${rotDeg}deg)` }}
        className={`w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 ${shape} bg-gradient-to-br ${theme.stoneFrom} border ${theme.stoneBorder} shadow-2xs hover:scale-110 z-0 shrink-0 select-none`}
      />
    );
  };

  // Maps physical cell position to intuitive screen direction buttons
  interface DirectionBtn {
    type: 'left' | 'right' | 'up' | 'down';
    sowDir: 'cw' | 'ccw';
    label: string;
  }

  const getDirectionsForCell = (idx: number, teamCount: number): DirectionBtn[] => {
    if (teamCount === 2) {
      // Bottom row (0..4): Left-to-right
      if (idx >= 0 && idx <= 4) {
        return [
          { type: 'left', sowDir: 'ccw', label: 'Rải sang Trái (về Ô Quan Trái)' },
          { type: 'right', sowDir: 'cw', label: 'Rải sang Phải (về Ô Quan Phải)' },
        ];
      }
      // Top row (6..10): Right-to-left ([10, 9, 8, 7, 6])
      if (idx >= 6 && idx <= 10) {
        return [
          { type: 'left', sowDir: 'cw', label: 'Rải sang Trái (về Ô Quan Trái)' },
          { type: 'right', sowDir: 'ccw', label: 'Rải sang Phải (về Ô Quan Phải)' },
        ];
      }
    }

    if (teamCount === 3) {
      // Bottom row (0..4): Left-to-right
      if (idx >= 0 && idx <= 4) {
        return [
          { type: 'left', sowDir: 'ccw', label: 'Rải sang Trái (về Ô Quan Trái)' },
          { type: 'right', sowDir: 'cw', label: 'Rải sang Phải (về Ô Quan Phải)' },
        ];
      }
      // Right column (6..10): Bottom-to-top ([6 bottom, 10 top])
      if (idx >= 6 && idx <= 10) {
        return [
          { type: 'up', sowDir: 'cw', label: 'Rải lên Trên (về Ô Quan Đỉnh)' },
          { type: 'down', sowDir: 'ccw', label: 'Rải xuống Dưới (về Ô Quan Phải)' },
        ];
      }
      // Left column (12..16): Top-to-bottom ([12 top, 16 bottom])
      if (idx >= 12 && idx <= 16) {
        return [
          { type: 'up', sowDir: 'ccw', label: 'Rải lên Trên (về Ô Quan Đỉnh)' },
          { type: 'down', sowDir: 'cw', label: 'Rải xuống Dưới (về Ô Quan Trái)' },
        ];
      }
    }

    if (teamCount === 4) {
      // Bottom row (0..4): Left-to-right
      if (idx >= 0 && idx <= 4) {
        return [
          { type: 'left', sowDir: 'ccw', label: 'Rải sang Trái' },
          { type: 'right', sowDir: 'cw', label: 'Rải sang Phải' },
        ];
      }
      // Right column (6..10): Bottom-to-top ([6 bottom, 10 top])
      if (idx >= 6 && idx <= 10) {
        return [
          { type: 'up', sowDir: 'cw', label: 'Rải lên Trên' },
          { type: 'down', sowDir: 'ccw', label: 'Rải xuống Dưới' },
        ];
      }
      // Top row (12..16): Right-to-left ([12 right, 16 left])
      if (idx >= 12 && idx <= 16) {
        return [
          { type: 'left', sowDir: 'cw', label: 'Rải sang Trái' },
          { type: 'right', sowDir: 'ccw', label: 'Rải sang Phải' },
        ];
      }
      // Left column (18..22): Top-to-bottom ([18 top, 22 bottom])
      if (idx >= 18 && idx <= 22) {
        return [
          { type: 'down', sowDir: 'cw', label: 'Rải xuống Dưới' },
          { type: 'up', sowDir: 'ccw', label: 'Rải lên Trên' },
        ];
      }
    }

    return [
      { type: 'left', sowDir: 'ccw', label: 'Ngược chiều' },
      { type: 'right', sowDir: 'cw', label: 'Thuận chiều' },
    ];
  };

  const renderDanCell = (idx: number, extraClasses: string = '', inlineStyle?: React.CSSProperties) => {
    const cell = board[idx];
    if (!cell) return null;
    const isOwner = cell.ownerTeamIdx === currentTurnTeamIdx;
    const canSelect = gameState === 'WAIT_SELECT_CELL' && isOwner && cell.dan > 0;
    const isSelected = selectedCellIdx === idx;
    const team = teams[cell.ownerTeamIdx!];
    const theme = getTeamColorTheme(cell.ownerTeamIdx, team?.name, team?.color);

    return (
      <div
        key={idx}
        onClick={() => canSelect && setSelectedCellIdx(idx)}
        style={inlineStyle}
        className={`w-14 sm:w-20 h-24 sm:h-28 rounded-2xl border-2 p-1.5 flex flex-col items-center justify-between text-center transition relative shadow-[inset_0_2px_6px_rgba(120,53,15,0.25)] ${
          canSelect
            ? `cursor-pointer ${theme.activeBg} hover:scale-105 shadow-xl animate-pulse ring-2 ring-amber-500`
            : `${theme.bg} ${theme.border}`
        } ${isSelected ? 'ring-4 ring-amber-600 scale-105 bg-amber-300' : ''} ${extraClasses}`}
      >
        <span className={`text-[8px] sm:text-[9px] font-black uppercase px-1 rounded border shadow-sm ${theme.badge}`}>
          {team?.name || `Đội ${cell.ownerTeamIdx! + 1}`}
        </span>

        {/* Pebble Seeds Stack - strictly bounded within cell */}
        <div className="flex flex-wrap items-center justify-center gap-0.5 my-0.5 max-h-12 w-full max-w-full overflow-hidden px-0.5">
          {Array.from({ length: Math.min(cell.dan, 10) }).map((_, sI) => renderPebble(sI, theme))}
          {cell.dan > 10 && (
            <span className="text-[8px] font-black text-amber-900 bg-amber-200/90 px-1 rounded-full border border-amber-500 shrink-0">
              +{cell.dan - 10}
            </span>
          )}
        </div>

        <span className={`text-[9px] sm:text-xs font-mono font-black ${theme.text}`}>
          {cell.dan} quân
        </span>

        {/* Direction Overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-stone-900/95 rounded-2xl flex items-center justify-center gap-1 p-1 z-30 animate-scale-in shadow-2xl">
            {getDirectionsForCell(idx, numTeams).map((btn, bIdx) => (
              <button
                key={bIdx}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartSowing(idx, btn.sowDir);
                }}
                className="p-1.5 sm:p-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center shadow-lg transition hover:scale-110 active:scale-95"
                title={btn.label}
              >
                {btn.type === 'left' && <ArrowLeft className="w-4 h-4" />}
                {btn.type === 'right' && <ArrowRight className="w-4 h-4" />}
                {btn.type === 'up' && <ArrowUp className="w-4 h-4" />}
                {btn.type === 'down' && <ArrowDown className="w-4 h-4" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderQuanCell = (idx: number, shapeClasses: string = '', inlineStyle?: React.CSSProperties) => {
    const cell = board[idx];
    if (!cell) return null;
    const defaultTheme = getTeamColorTheme(0);

    return (
      <div
        key={idx}
        style={inlineStyle}
        className={`w-20 sm:w-28 h-28 sm:h-36 bg-gradient-to-b from-amber-200 via-yellow-100 to-amber-200 border-2 border-amber-800/90 flex flex-col items-center justify-between p-2 shadow-[inset_0_3px_8px_rgba(120,53,15,0.3)] text-center relative ${shapeClasses}`}
      >
        <span className="text-[8px] sm:text-[10px] font-black text-amber-950 uppercase tracking-wider bg-amber-400/60 px-2 py-0.5 rounded-full border border-amber-600 shadow-xs shrink-0">
          👑 Ô QUAN
        </span>

        {/* Bounded pebble & crown container */}
        <div className="flex flex-wrap items-center justify-center gap-0.5 my-0.5 max-h-16 w-full max-w-full overflow-hidden px-1">
          {Array.from({ length: cell.quan }).map((_, qI) => renderPebble(qI, defaultTheme, true))}
          {Array.from({ length: Math.min(cell.dan, 8) }).map((_, dI) => renderPebble(dI, defaultTheme, false))}
          {cell.dan > 8 && (
            <span className="text-[8px] font-black text-amber-900 bg-amber-200/90 px-1 rounded-full border border-amber-500 shrink-0">
              +{cell.dan - 8}
            </span>
          )}
        </div>

        <span className="text-[9px] sm:text-xs font-mono font-black text-amber-950 bg-amber-300/90 px-2 py-0.5 rounded-lg border border-amber-600 shadow-xs shrink-0">
          {cell.quan * 10 + cell.dan}đ
        </span>
      </div>
    );
  };

  return (
    <div className="mancala-game-container flex-1 w-full p-3 sm:p-5 bg-gradient-to-b from-amber-100 via-amber-50 to-amber-100 text-stone-900 rounded-3xl shadow-2xl border-4 border-amber-800 flex flex-col justify-between overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-amber-200/80 border-2 border-amber-700/60 p-4 rounded-2xl shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏺</span>
          <div>
            <h2 className="text-xl font-extrabold text-amber-950 flex items-center gap-2">
              <span>Trò Chơi Ô Ăn Quan</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-600 text-w-text-main font-bold">
                {numTeams} Đội Chơi
              </span>
            </h2>
            <p className="text-xs text-amber-900/80 font-medium">
              Quay câu hỏi ➔ Trả lời đúng ➔ Rải quân sỏi & Ăn điểm!
            </p>
          </div>
        </div>

        {/* Teams Scoreboard */}
        <div className="flex items-center gap-2 flex-wrap">
          {teams.slice(0, numTeams).map((team, idx) => {
            const isTurn = idx === currentTurnTeamIdx;
            const theme = getTeamColorTheme(idx, team.name, team.color);
            return (
              <div
                key={team.id}
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition ${
                  isTurn
                    ? `${theme.bg} ${theme.border} ${theme.text} ring-2 ${theme.ring} scale-105 font-bold shadow-md`
                    : 'bg-amber-100/60 border-amber-400 text-stone-700'
                }`}
              >
                <span className="text-lg">{team.avatar}</span>
                <div className="text-xs">
                  <div className="font-bold leading-none">{team.name}</div>
                  <div className="font-mono text-amber-900 font-black mt-0.5">{scores[idx]} điểm</div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() =>
            onGameEnd(
              teams.map((t, idx) => ({ ...t, score: scores[idx] || 0 })),
              answerLogs
            )
          }
          className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-w-text-main font-bold text-xs rounded-xl transition shadow-md"
        >
          Tổng Kết Game
        </button>
      </div>

      {/* Game Center Stage: Question Control or Board */}
      <div className="my-6 space-y-6">
        {/* Active Question Bar */}
        <div className="bg-amber-200/90 border-2 border-amber-700/60 p-4 sm:p-5 rounded-2xl shadow-lg flex items-center justify-between">
          <span className="text-xs font-bold text-amber-950 font-mono flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-ping" />
            LƯỢT CỦA: {currentTeam.avatar} {currentTeam.name}
          </span>

          {gameState === 'WAIT_SPIN' && (
            <button
              onClick={handleSpinQuestion}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-xs rounded-xl shadow-lg transition transform hover:scale-105"
            >
              <Dices className="w-4 h-4" />
              <span>Quay Chọn Câu Hỏi</span>
            </button>
          )}

          {gameState === 'WAIT_SELECT_CELL' && (
            <div className="p-2 px-4 bg-amber-400/30 border border-amber-600 rounded-xl text-amber-950 text-xs font-bold animate-pulse">
              👉 Mời {currentTeam.name} chọn 1 ô Dân của đội mình bên dưới & bấm hướng rải quân!
            </div>
          )}
        </div>

        {/* Question Modal */}
        <QuestionDisplayModal
          isOpen={gameState === 'WAIT_JUDGE'}
          questionNumber={currentQuestionNum || 1}
          question={currentQuestion}
          mode={config.mode}
          teamName={currentTeam.name}
          teamAvatar={currentTeam.avatar}
          timerEnabled={config.timerEnabled}
          timeLimitSeconds={config.timeLimitSeconds}
          titlePrefix="🏺 Ô ĂN QUAN -"
          onAnswerSubmit={(isCorrect, correctAnswerText) => {
            handleJudgeAnswer(isCorrect, correctAnswerText);
          }}
        />

        {/* Board Display */}
        <div className="p-4 sm:p-6 bg-gradient-to-br from-amber-300 via-amber-200 to-yellow-300 border-8 border-amber-900/90 rounded-3xl shadow-2xl flex items-center justify-center min-h-[320px] overflow-x-auto">
          {/* 2-PLAYER TRADITIONAL BOARD: 10 Dân (2 rows of 5) + 2 Ô Quan Semi-Circles */}
          {numTeams === 2 && (
            <div className="flex items-center justify-center gap-2 sm:gap-3 p-4 bg-amber-100/90 border-4 border-amber-800 rounded-3xl shadow-2xl max-w-4xl w-full">
              {/* Left Semi-Circle Quan (Cell 11) */}
              {renderQuanCell(11, 'rounded-l-full border-r-2 border-amber-800 shadow-xl')}

              {/* 2x5 Grid */}
              <div className="flex flex-col gap-2">
                {/* Top Row: Team 1 (Cells 10, 9, 8, 7, 6 left-to-right) */}
                <div className="flex gap-2">
                  {[10, 9, 8, 7, 6].map(idx => renderDanCell(idx))}
                </div>
                {/* Bottom Row: Team 0 (Cells 0, 1, 2, 3, 4 left-to-right) */}
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4].map(idx => renderDanCell(idx))}
                </div>
              </div>

              {/* Right Semi-Circle Quan (Cell 5) */}
              {renderQuanCell(5, 'rounded-r-full border-l-2 border-amber-800 shadow-xl')}
            </div>
          )}

          {/* 3-PLAYER EQUILATERAL TRIANGLE BOARD (Ô Ăn Quan 3 Đội: 3 Hàng Quân + 3 Ô Quan Tam Giác) */}
          {numTeams === 3 && (
            <div className="relative w-full max-w-[840px] aspect-[1.12/1] mx-auto p-2 sm:p-4 bg-gradient-to-b from-amber-100 via-[#FFF9E6] to-amber-100 border-4 border-amber-900/90 rounded-3xl shadow-2xl overflow-hidden select-none">
              {/* Wooden Inlay & Triangular SVG Outline matching Oanquan3n.jpg */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Triangular Wood Base */}
                <polygon
                  points="50,4 96,92 4,92"
                  fill="rgba(254, 243, 199, 0.85)"
                  stroke="#78350f"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                <polygon
                  points="50,11 88,87 12,87"
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                  opacity="0.8"
                />
                {/* Inner Triangular Hollow */}
                <polygon
                  points="50,30 71,72 29,72"
                  fill="#FFFBF0"
                  stroke="#b45309"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  opacity="0.9"
                />
              </svg>

              {/* Central Courtyard Hub */}
              <div
                className="absolute flex flex-col items-center justify-center text-center p-2 sm:p-3 bg-gradient-to-b from-amber-200/95 to-yellow-100/95 border-2 border-amber-800/80 rounded-2xl shadow-inner max-w-[170px] sm:max-w-[220px] pointer-events-none z-10"
                style={{
                  top: '52%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="text-2xl sm:text-3xl drop-shadow">🏺</div>
                <div className="text-[11px] sm:text-xs font-black text-amber-950 font-mono tracking-wide mt-0.5">
                  BÀN Ô ĂN QUAN 3 ĐỘI
                </div>
                <div className="text-[9px] sm:text-[10px] text-amber-900 font-bold bg-amber-300/90 px-2 py-0.5 rounded-full border border-amber-600 my-0.5">
                  15 Dân • 3 Ô Quan Tam Giác
                </div>
                <div className="text-[9px] sm:text-[10px] text-stone-700 font-semibold leading-tight truncate max-w-full">
                  Lượt: <span className="font-bold text-amber-950">{currentTeam.avatar} {currentTeam.name}</span>
                </div>
              </div>

              {/* 1. TOP VERTEX: Quan 11 (Ô Quan Đỉnh - To & Rộng Rãi) */}
              <div
                className="absolute flex flex-col items-center justify-center z-20"
                style={{ top: '11%', left: '50%', transform: 'translate(-50%, -50%)' }}
              >
                {renderQuanCell(
                  11,
                  '!w-20 sm:!w-24 md:!w-28 !h-20 sm:!h-24 md:!h-28 rounded-full border-4 border-amber-800 shadow-2xl ring-4 ring-amber-500/50 bg-gradient-to-b from-amber-200 to-yellow-100 text-center'
                )}
              </div>

              {/* 2. BOTTOM-RIGHT VERTEX: Quan 5 (Ô Quan Phải - To & Rộng Rãi) */}
              <div
                className="absolute flex flex-col items-center justify-center z-20"
                style={{ top: '87%', left: '88%', transform: 'translate(-50%, -50%)' }}
              >
                {renderQuanCell(
                  5,
                  '!w-20 sm:!w-24 md:!w-28 !h-20 sm:!h-24 md:!h-28 rounded-full border-4 border-amber-800 shadow-2xl ring-4 ring-amber-500/50 bg-gradient-to-b from-amber-200 to-yellow-100 text-center'
                )}
              </div>

              {/* 3. BOTTOM-LEFT VERTEX: Quan 17 (Ô Quan Trái - To & Rộng Rãi) */}
              <div
                className="absolute flex flex-col items-center justify-center z-20"
                style={{ top: '87%', left: '12%', transform: 'translate(-50%, -50%)' }}
              >
                {renderQuanCell(
                  17,
                  '!w-20 sm:!w-24 md:!w-28 !h-20 sm:!h-24 md:!h-28 rounded-full border-4 border-amber-800 shadow-2xl ring-4 ring-amber-500/50 bg-gradient-to-b from-amber-200 to-yellow-100 text-center'
                )}
              </div>

              {/* BOTTOM HORIZONTAL ROW (Team 0 - Đội 1): Cells 0, 1, 2, 3, 4 (Between Quan 17 & Quan 5) */}
              {[
                { id: 0, x: 24.5 },
                { id: 1, x: 37.25 },
                { id: 2, x: 50.0 },
                { id: 3, x: 62.75 },
                { id: 4, x: 75.5 },
              ].map(({ id, x }) => (
                <div
                  key={id}
                  className="absolute z-20"
                  style={{ top: '87%', left: `${x}%`, transform: 'translate(-50%, -50%)' }}
                >
                  {renderDanCell(
                    id,
                    '!w-12 sm:!w-15 md:!w-17 !h-17 sm:!h-21 md:!h-24 !rounded-xl border-2 shadow-md text-center'
                  )}
                </div>
              ))}

              {/* RIGHT SLOPING ROW (Team 1 - Đội 2): Cells 6, 7, 8, 9, 10 (From Quan 5 up to Quan 11) */}
              {[
                { id: 6, x: 81.67, y: 74.33 },
                { id: 7, x: 75.33, y: 61.67 },
                { id: 8, x: 69.00, y: 49.00 },
                { id: 9, x: 62.67, y: 36.33 },
                { id: 10, x: 56.33, y: 23.67 },
              ].map(({ id, x, y }) => (
                <div
                  key={id}
                  className="absolute z-20"
                  style={{ top: `${y}%`, left: `${x}%`, transform: 'translate(-50%, -50%)' }}
                >
                  {renderDanCell(
                    id,
                    '!w-12 sm:!w-15 md:!w-17 !h-17 sm:!h-21 md:!h-24 !rounded-xl border-2 shadow-md text-center'
                  )}
                </div>
              ))}

              {/* LEFT SLOPING ROW (Team 2 - Đội 3): Cells 12, 13, 14, 15, 16 (From Quan 11 down to Quan 17) */}
              {[
                { id: 12, x: 43.67, y: 23.67 },
                { id: 13, x: 37.33, y: 36.33 },
                { id: 14, x: 31.00, y: 49.00 },
                { id: 15, x: 24.67, y: 61.67 },
                { id: 16, x: 18.33, y: 74.33 },
              ].map(({ id, x, y }) => (
                <div
                  key={id}
                  className="absolute z-20"
                  style={{ top: `${y}%`, left: `${x}%`, transform: 'translate(-50%, -50%)' }}
                >
                  {renderDanCell(
                    id,
                    '!w-12 sm:!w-15 md:!w-17 !h-17 sm:!h-21 md:!h-24 !rounded-xl border-2 shadow-md text-center'
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 4-PLAYER SQUARE BOARD (Ô Làng 4 Người: 20 Dân + 4 Ô Quan) */}
          {numTeams === 4 && (
            <div className="inline-flex flex-col items-center justify-center p-3 sm:p-5 bg-amber-100/95 border-4 border-amber-800 rounded-3xl shadow-2xl">
              {/* Top Side: Quan 2 (Cell 17 TL), Team 2 Cells (16..12), Quan 1 (Cell 11 TR) */}
              <div className="flex items-center justify-center gap-2">
                {renderQuanCell(17, 'rounded-tl-3xl border-b-2 border-amber-800 shadow-xl')}
                <div className="flex gap-2">
                  {[16, 15, 14, 13, 12].map(idx => renderDanCell(idx))}
                </div>
                {renderQuanCell(11, 'rounded-tr-3xl border-b-2 border-amber-800 shadow-xl')}
              </div>

              {/* Center Row: Left Column (Team 3), Hollow Center, Right Column (Team 1) */}
              <div className="flex items-stretch justify-between gap-2 my-2 w-full">
                {/* Left Column: Cells 18, 19, 20, 21, 22 (Team 3) - Aligned under Quan 17 */}
                <div className="flex flex-col gap-2 items-center justify-center w-20 sm:w-28">
                  {[18, 19, 20, 21, 22].map(idx => renderDanCell(idx))}
                </div>

                {/* Compact Hollow Center Info matching width of 5 Dan cells */}
                <div className="flex-1 p-4 bg-amber-200/90 border-2 border-amber-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 shadow-inner my-1">
                  <div className="text-2xl text-amber-800">🔲</div>
                  <div className="text-xs sm:text-sm font-black text-amber-950 font-mono">BÀN Ô LÀNG 4 ĐỘI</div>
                  <div className="text-[11px] text-amber-900 font-bold">20 Ô Dân • 4 Ô Quan Góc</div>
                  <div className="text-[10px] text-amber-800 font-mono">Bàn cờ hình vuông cân đối</div>
                </div>

                {/* Right Column: Cells 10, 9, 8, 7, 6 (Team 1) - Aligned under Quan 11 */}
                <div className="flex flex-col gap-2 items-center justify-center w-20 sm:w-28">
                  {[10, 9, 8, 7, 6].map(idx => renderDanCell(idx))}
                </div>
              </div>

              {/* Bottom Side: Quan 3 (Cell 23 BL), Team 0 Cells (0..4), Quan 0 (Cell 5 BR) */}
              <div className="flex items-center justify-center gap-2">
                {renderQuanCell(23, 'rounded-bl-3xl border-t-2 border-amber-800 shadow-xl')}
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4].map(idx => renderDanCell(idx))}
                </div>
                {renderQuanCell(5, 'rounded-br-3xl border-t-2 border-amber-800 shadow-xl')}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-xs text-amber-950 font-bold">
        Quy tắc: Rải từng hòn sỏi qua các ô. Đụng ô Quan thì dừng; đụng ô trống thì Ăn quân ô liền sau!
      </div>
    </div>
  );
};

