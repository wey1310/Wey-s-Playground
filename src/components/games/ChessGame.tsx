import React, { useState, useEffect } from 'react';
import { GameSetupConfig, Question, AnswerLog, PRESET_THEMES, Team, QuestionBank } from '../../types';
import { soundFx } from '../../utils/audio';
import {
  Dices,
  Trophy,
  RotateCcw,
  Sparkles,
  Award,
  PlaySquare,
  RefreshCw,
  Crown,
  ShieldAlert,
  ChevronRight,
  Flag,
} from 'lucide-react';
import { QuestionDisplayModal } from '../QuestionDisplayModal';
import { RefillQuestionsModal } from '../RefillQuestionsModal';

interface ChessGameProps {
  config: GameSetupConfig;
  questions: Question[];
  banks?: QuestionBank[];
  onGameEnd: (teams: Team[], answerLogs: AnswerLog[]) => void;
}

export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface ChessPiece {
  id: string;
  type: PieceType;
  color: PieceColor;
}

export type BoardState = (ChessPiece | null)[][]; // 8x8 grid [row][col]

export interface Move {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  piece: ChessPiece;
  captured?: ChessPiece | null;
  notation: string;
}

// Initial 8x8 standard chess starting layout
const createInitialBoard = (): BoardState => {
  const board: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));

  // Black pieces (row 0 & 1)
  const blackBackRow: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let c = 0; c < 8; c++) {
    board[0][c] = { id: `b_${blackBackRow[c]}_${c}`, type: blackBackRow[c], color: 'b' };
    board[1][c] = { id: `b_p_${c}`, type: 'p', color: 'b' };
  }

  // White pieces (row 6 & 7)
  const whiteBackRow: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let c = 0; c < 8; c++) {
    board[6][c] = { id: `w_p_${c}`, type: 'p', color: 'w' };
    board[7][c] = { id: `w_${whiteBackRow[c]}_${c}`, type: whiteBackRow[c], color: 'w' };
  }

  return board;
};

// Unicode & Display names for Chess Pieces
export const PIECE_ICONS: Record<PieceColor, Record<PieceType, string>> = {
  w: {
    k: '♔',
    q: '♕',
    r: '♖',
    b: '♗',
    n: '♘',
    p: '♙',
  },
  b: {
    k: '♚',
    q: '♛',
    r: '♜',
    b: '♝',
    n: '♞',
    p: '♟',
  },
};

export const PIECE_NAMES: Record<PieceType, string> = {
  k: 'Vua',
  q: 'Hậu',
  r: 'Xe',
  b: 'Tượng',
  n: 'Mã',
  p: 'Tốt',
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export const ChessGame: React.FC<ChessGameProps> = ({
  config,
  questions,
  banks = [],
  onGameEnd,
}) => {
  const [currentConfig, setCurrentConfig] = useState<GameSetupConfig>(config);
  const [teams, setTeams] = useState<Team[]>(() => {
    const rawTeams = (config.teams || []).slice(0, 2);
    const team1 = rawTeams[0] || {
      id: 'team_white',
      name: 'Đội Trắng (White)',
      avatar: '⚪',
      color: '#f8fafc',
      score: 0,
    };
    const team2 = rawTeams[1] || {
      id: 'team_black',
      name: 'Đội Đen (Black)',
      avatar: '⚫',
      color: '#1e293b',
      score: 0,
    };
    return [
      { ...team1, score: team1.score || 0 },
      { ...team2, score: team2.score || 0 },
    ];
  });

  const [currentTurnIdx, setCurrentTurnIdx] = useState<number>(0); // 0 = White ('w'), 1 = Black ('b')
  const [board, setBoard] = useState<BoardState>(createInitialBoard);
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [capturedByWhite, setCapturedByWhite] = useState<ChessPiece[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<ChessPiece[]>([]);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [lastMove, setLastMove] = useState<{ from: [number, number]; to: [number, number] } | null>(null);

  const [roundWinner, setRoundWinner] = useState<Team | 'DRAW' | null>(null);
  const [hasMoveRight, setHasMoveRight] = useState<boolean>(config.mode === 'none');

  // Question Flow States
  const [usedQuestionIndices, setUsedQuestionIndices] = useState<number[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionNum, setCurrentQuestionNum] = useState<number | null>(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState<boolean>(false);
  const [isRefillModalOpen, setIsRefillModalOpen] = useState<boolean>(false);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);
  const [turnMessage, setTurnMessage] = useState<string>('Ván cờ bắt đầu! Lượt đầu thuộc về Đội Trắng.');

  const ptsPerQuestion = 10;
  const winMultiplier = 5;
  const winBonusPts = ptsPerQuestion * winMultiplier; // 50 pts

  const themeInfo = PRESET_THEMES.find(t => t.id === currentConfig.theme) || PRESET_THEMES[0];
  const currentTeam = teams[currentTurnIdx];
  const currentPieceColor: PieceColor = currentTurnIdx === 0 ? 'w' : 'b';

  // Calculate Legal Destination Moves for a piece at [r, c]
  const getLegalMovesForSquare = (r: number, c: number, currentBoard: BoardState): [number, number][] => {
    const piece = currentBoard[r][c];
    if (!piece) return [];

    const moves: [number, number][] = [];
    const color = piece.color;
    const enemyColor: PieceColor = color === 'w' ? 'b' : 'w';

    const isInside = (row: number, col: number) => row >= 0 && row < 8 && col >= 0 && col < 8;

    if (piece.type === 'p') {
      // Pawn
      const forwardDir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;

      // 1 square forward
      const nextR = r + forwardDir;
      if (isInside(nextR, c) && !currentBoard[nextR][c]) {
        moves.push([nextR, c]);

        // 2 squares forward from start
        const doubleR = r + forwardDir * 2;
        if (r === startRow && isInside(doubleR, c) && !currentBoard[doubleR][c]) {
          moves.push([doubleR, c]);
        }
      }

      // Diagonal captures
      const diagCols = [c - 1, c + 1];
      for (const diagC of diagCols) {
        if (isInside(nextR, diagC)) {
          const target = currentBoard[nextR][diagC];
          if (target && target.color === enemyColor) {
            moves.push([nextR, diagC]);
          }
        }
      }
    } else if (piece.type === 'n') {
      // Knight (L-shape)
      const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ];
      for (const [dr, dc] of knightOffsets) {
        const nr = r + dr;
        const nc = c + dc;
        if (isInside(nr, nc)) {
          const target = currentBoard[nr][nc];
          if (!target || target.color === enemyColor) {
            moves.push([nr, nc]);
          }
        }
      }
    } else if (piece.type === 'b' || piece.type === 'r' || piece.type === 'q') {
      // Sliding pieces
      const directions: [number, number][] = [];
      if (piece.type === 'b' || piece.type === 'q') {
        directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]); // Diagonals
      }
      if (piece.type === 'r' || piece.type === 'q') {
        directions.push([-1, 0], [1, 0], [0, -1], [0, 1]); // Orthogonals
      }

      for (const [dr, dc] of directions) {
        let step = 1;
        while (true) {
          const nr = r + dr * step;
          const nc = c + dc * step;
          if (!isInside(nr, nc)) break;

          const target = currentBoard[nr][nc];
          if (!target) {
            moves.push([nr, nc]);
          } else {
            if (target.color === enemyColor) {
              moves.push([nr, nc]);
            }
            break; // blocked
          }
          step++;
        }
      }
    } else if (piece.type === 'k') {
      // King (1 square in any direction)
      const kingDirs = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1],
      ];
      for (const [dr, dc] of kingDirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (isInside(nr, nc)) {
          const target = currentBoard[nr][nc];
          if (!target || target.color === enemyColor) {
            moves.push([nr, nc]);
          }
        }
      }
    }

    return moves;
  };

  // Random Question Handler
  const handleRandomQuestion = () => {
    if (roundWinner) return;

    soundFx.diceRoll();

    if (currentConfig.mode === 'bank') {
      if (questions.length === 0) {
        setIsRefillModalOpen(true);
        return;
      }

      let available = questions.map((_, i) => i).filter(i => !usedQuestionIndices.includes(i));
      if (available.length === 0) {
        setIsRefillModalOpen(true);
        return;
      }

      const randIdx = available[Math.floor(Math.random() * available.length)];
      setUsedQuestionIndices(prev => [...prev, randIdx]);
      setCurrentQuestion(questions[randIdx]);
      setCurrentQuestionNum(randIdx + 1);
      setIsQuestionModalOpen(true);
    } else if (currentConfig.mode === 'number') {
      const totalNumber = currentConfig.totalQuestionsNumber || 10;
      let available = Array.from({ length: totalNumber }, (_, i) => i + 1).filter(
        num => !usedQuestionIndices.includes(num)
      );

      if (available.length === 0) {
        setIsRefillModalOpen(true);
        return;
      }

      const randNum = available[Math.floor(Math.random() * available.length)];
      setUsedQuestionIndices(prev => [...prev, randNum]);
      setCurrentQuestion(null);
      setCurrentQuestionNum(randNum);
      setIsQuestionModalOpen(true);
    } else {
      setHasMoveRight(true);
    }
  };

  // Question Answer Handler
  const handleAnswerSubmit = (isCorrect: boolean, correctAnswerText: string) => {
    setIsQuestionModalOpen(false);

    const log: AnswerLog = {
      questionNumber: currentQuestionNum || 1,
      questionText: currentQuestion ? currentQuestion.content : `Câu hỏi số ${currentQuestionNum}`,
      correctAnswer: correctAnswerText,
      teamName: currentTeam.name,
      isCorrect,
    };
    setAnswerLogs(prev => [...prev, log]);

    if (isCorrect) {
      soundFx.correct();
      // Award question points
      setTeams(prev => {
        const next = [...prev];
        next[currentTurnIdx].score += ptsPerQuestion;
        return next;
      });
      setHasMoveRight(true);
      setTurnMessage(`🎯 ${currentTeam.name} trả lời ĐÚNG (+${ptsPerQuestion}đ)! Hãy chọn quân để đi 1 nước cờ.`);
    } else {
      soundFx.wrong();
      setHasMoveRight(false);
      setSelectedSquare(null);
      setValidMoves([]);
      setTurnMessage(`❌ ${currentTeam.name} trả lời SAI! Mất lượt đi cờ.`);
      // Switch turn
      setTimeout(() => {
        setCurrentTurnIdx(prev => (prev === 0 ? 1 : 0));
        if (currentConfig.mode === 'none') {
          setHasMoveRight(true);
        } else {
          setHasMoveRight(false);
        }
      }, 1200);
    }
  };

  // Handle Square Selection and Movement
  const handleSquareClick = (r: number, c: number) => {
    if (roundWinner) return;

    const clickedPiece = board[r][c];

    // If currently not permitted to move
    if (!hasMoveRight && currentConfig.mode !== 'none') {
      soundFx.wrong();
      setTurnMessage(`⚠️ ${currentTeam.name} cần bấm "Random Câu Hỏi" và trả lời đúng để nhận lượt đi cờ!`);
      return;
    }

    // If we have a piece selected, check if clicking a valid move
    if (selectedSquare) {
      const [fromR, fromC] = selectedSquare;
      const isValidTarget = validMoves.some(([vr, vc]) => vr === r && vc === c);

      if (isValidTarget) {
        // EXECUTE MOVE
        executeMove(fromR, fromC, r, c);
        return;
      }
    }

    // Otherwise, select a friendly piece
    if (clickedPiece && clickedPiece.color === currentPieceColor) {
      soundFx.buttonClick();
      setSelectedSquare([r, c]);
      const moves = getLegalMovesForSquare(r, c, board);
      setValidMoves(moves);
      setTurnMessage(`Đang chọn ${PIECE_NAMES[clickedPiece.type]} (${FILES[c]}${8 - r}) - Hãy nhấp vào các ô được đánh dấu màu xanh lá/đỏ để di chuyển.`);
    } else {
      // Clicked on empty square or enemy piece without moving
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  // Execute Move on the Board
  const executeMove = (fromR: number, fromC: number, toR: number, toCol: number) => {
    const movingPiece = board[fromR][fromC];
    if (!movingPiece) return;

    const targetPiece = board[toR][toCol];
    const newBoard = board.map(row => [...row]);

    // Handle Pawn Promotion to Queen if reaching end rank
    let finalPiece = { ...movingPiece };
    if (movingPiece.type === 'p') {
      if ((movingPiece.color === 'w' && toR === 0) || (movingPiece.color === 'b' && toR === 7)) {
        finalPiece.type = 'q'; // Promoted to Queen!
        soundFx.powerup();
      }
    }

    newBoard[toR][toCol] = finalPiece;
    newBoard[fromR][fromC] = null;

    if (targetPiece) {
      soundFx.powerup(); // Capture sound
      if (movingPiece.color === 'w') {
        setCapturedByWhite(prev => [...prev, targetPiece]);
      } else {
        setCapturedByBlack(prev => [...prev, targetPiece]);
      }
    } else {
      soundFx.buttonClick();
    }

    setBoard(newBoard);
    setLastMove({ from: [fromR, fromC], to: [toR, toCol] });

    // Notation
    const notation = `${PIECE_NAMES[movingPiece.type]} ${FILES[fromC]}${8 - fromR} ${targetPiece ? '⚔' : '➜'} ${FILES[toCol]}${8 - toR}`;
    const newMoveRecord: Move = {
      fromRow: fromR,
      fromCol: fromC,
      toRow: toR,
      toCol,
      piece: movingPiece,
      captured: targetPiece,
      notation,
    };
    setMoveHistory(prev => [newMoveRecord, ...prev]);

    // Check Win by King capture
    if (targetPiece && targetPiece.type === 'k') {
      soundFx.winFanfare();
      setRoundWinner(currentTeam);
      // Award x5 bonus points
      setTeams(prev => {
        const next = [...prev];
        next[currentTurnIdx].score += winBonusPts;
        return next;
      });
      setTurnMessage(`👑 CHIẾN THẮNG TUYỆT ĐỐI! ${currentTeam.name} đã bắt được Vua đối phương (+${winBonusPts}đ thưởng x5)!`);
      setSelectedSquare(null);
      setValidMoves([]);
      setHasMoveRight(false);
      return;
    }

    // Reset selection & pass turn
    setSelectedSquare(null);
    setValidMoves([]);

    const nextTurn = currentTurnIdx === 0 ? 1 : 0;
    setCurrentTurnIdx(nextTurn);
    setTurnMessage(`Đã đi: ${notation}. Đến lượt ${teams[nextTurn].name}`);
    if (currentConfig.mode === 'none') {
      setHasMoveRight(true);
    } else {
      setHasMoveRight(false);
    }
  };

  // Undo Last Move
  const handleUndoMove = () => {
    if (moveHistory.length === 0 || roundWinner) return;

    soundFx.buttonClick();
    const last = moveHistory[0];
    const newBoard = board.map(row => [...row]);

    // Restore moved piece
    newBoard[last.fromRow][last.fromCol] = last.piece;
    newBoard[last.toRow][last.toCol] = last.captured || null;

    // Restore captured lists
    if (last.captured) {
      if (last.piece.color === 'w') {
        setCapturedByWhite(prev => prev.slice(0, -1));
      } else {
        setCapturedByBlack(prev => prev.slice(0, -1));
      }
    }

    setBoard(newBoard);
    setMoveHistory(prev => prev.slice(1));
    setLastMove(null);
    setSelectedSquare(null);
    setValidMoves([]);

    // Flip turn back
    const prevTurn = currentTurnIdx === 0 ? 1 : 0;
    setCurrentTurnIdx(prevTurn);
    setHasMoveRight(true);
    setTurnMessage(`Đã hoàn tác nước đi của ${teams[prevTurn].name}.`);
  };

  // Reset entire chessboard
  const handleResetBoard = () => {
    soundFx.buttonClick();
    setBoard(createInitialBoard());
    setSelectedSquare(null);
    setValidMoves([]);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setMoveHistory([]);
    setLastMove(null);
    setRoundWinner(null);
    setCurrentTurnIdx(0);
    setHasMoveRight(currentConfig.mode === 'none');
    setTurnMessage('Đã xếp lại bàn cờ mới! Lượt đầu thuộc về Đội Trắng.');
  };

  // Refill questions callback
  const handleRefillConfirm = (updates: Partial<GameSetupConfig>) => {
    setCurrentConfig(prev => ({ ...prev, ...updates }));
    setUsedQuestionIndices([]);
    if (updates.mode === 'none') {
      setHasMoveRight(true);
      setTurnMessage('Đã chuyển sang chế độ cờ vua tự do (Không cần random câu hỏi)!');
    } else {
      setHasMoveRight(false);
      setTurnMessage('Đã nạp thêm câu hỏi thành công! Bấm "Random Câu Hỏi" để tiếp tục.');
    }
  };

  return (
    <div className={`flex-1 min-h-0 w-full p-2 sm:p-5 bg-gradient-to-b ${themeInfo.bgClass} rounded-[24px] shadow-2xl flex flex-col justify-between border-2 sm:border-4 border-w-border relative`}>
      {/* Top Header & Scoreboard */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/95 backdrop-blur-md border border-w-border p-3 sm:p-4 rounded-2xl shadow-sm">
        {/* Team 1: White */}
        <div
          className={`flex-1 flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border-2 transition-all ${
            currentTurnIdx === 0 && !roundWinner
              ? 'bg-amber-50/90 border-amber-500 shadow-md scale-102 ring-2 ring-amber-300'
              : 'bg-slate-50/80 border-slate-200 opacity-85'
          }`}
        >
          <div className="text-2xl sm:text-3xl p-1.5 rounded-xl bg-white border border-slate-300 shadow-xs">
            {teams[0].avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-800 text-sm sm:text-base truncate">
                {teams[0].name}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-black text-xs border border-slate-300">
                ♔ Trắng
              </span>
            </div>
            <div className="text-xs font-bold text-slate-600 mt-0.5">
              Điểm: <span className="text-amber-800 font-extrabold text-sm sm:text-base">{teams[0].score}</span>
            </div>
          </div>
        </div>

        {/* Center Chess Badge */}
        <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-1 px-4 py-1.5 bg-amber-100/90 border border-amber-300 rounded-xl">
          <div className="flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-amber-700" />
            <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
              CỜ VUA
            </span>
          </div>
          <div className="text-[10px] font-bold text-amber-800 bg-amber-200/70 px-2.5 py-0.5 rounded-full">
            Thắng cờ: +{winBonusPts}đ (x5)
          </div>
        </div>

        {/* Team 2: Black */}
        <div
          className={`flex-1 flex items-center justify-end gap-3 p-2.5 sm:p-3 rounded-xl border-2 transition-all ${
            currentTurnIdx === 1 && !roundWinner
              ? 'bg-w-bg-alt border-w-accent-border text-w-text-main shadow-md scale-102 ring-2 ring-slate-500'
              : 'bg-w-accent-light text-slate-200 border-w-accent-border opacity-85'
          }`}
        >
          <div className="flex-1 text-right min-w-0">
            <div className="flex items-center justify-end gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-100 font-black text-xs border border-slate-600">
                ♚ Đen
              </span>
              <span className="font-black text-w-text-main text-sm sm:text-base truncate">
                {teams[1].name}
              </span>
            </div>
            <div className="text-xs font-bold text-w-primary-dark mt-0.5">
              Điểm: <span className="text-amber-600 font-extrabold text-sm sm:text-base">{teams[1].score}</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl p-1.5 rounded-xl bg-slate-700 border border-slate-600 shadow-xs">
            {teams[1].avatar}
          </div>
        </div>
      </div>

      {/* Turn Banner & Prompt Message */}
      <div className="my-2 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-slate-200 shadow-xs text-xs sm:text-sm font-bold text-slate-800">
          <span className="w-2.5 h-2.5 rounded-full animate-ping bg-emerald-500" />
          <span>{turnMessage}</span>
        </div>
      </div>

      {/* Main Board & Side Panels Layout */}
      <div className="flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 my-2">
        {/* Left Side: Captured pieces by Black & Move Log */}
        <div className="w-full lg:w-48 flex flex-col gap-2 order-2 lg:order-1">
          {/* Black captured panel */}
          <div className="bg-white/90 backdrop-blur-xs p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-black text-slate-700 mb-1 flex items-center gap-1">
              <span>Quân Trắng bị ăn ({capturedByBlack.length}):</span>
            </div>
            <div className="flex flex-wrap gap-1 min-h-[32px] p-1.5 bg-slate-100/80 rounded-xl border border-slate-200">
              {capturedByBlack.map((p, idx) => (
                <span key={idx} className="text-lg text-slate-900 drop-shadow-xs" title={PIECE_NAMES[p.type]}>
                  {PIECE_ICONS.w[p.type]}
                </span>
              ))}
              {capturedByBlack.length === 0 && (
                <span className="text-[10px] text-w-text-muted italic font-medium">Chưa có</span>
              )}
            </div>
          </div>

          {/* Move History */}
          <div className="bg-white/90 backdrop-blur-xs p-3 rounded-2xl border border-slate-200 shadow-xs flex-1 max-h-48 overflow-y-auto hidden sm:block">
            <div className="text-[11px] font-black text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Lịch Sử Nước Đi:</span>
              <span className="text-[10px] text-w-text-muted">{moveHistory.length} nước</span>
            </div>
            <div className="space-y-1">
              {moveHistory.slice(0, 10).map((m, idx) => (
                <div key={idx} className="text-[10px] font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
                  <span className="text-w-text-muted">#{moveHistory.length - idx}</span>
                  <span className="font-extrabold">{m.notation}</span>
                </div>
              ))}
              {moveHistory.length === 0 && (
                <span className="text-[10px] text-w-text-muted italic">Chưa có nước đi nào</span>
              )}
            </div>
          </div>
        </div>

        {/* Center: 8x8 Chessboard */}
        <div className="relative p-2 sm:p-3.5 bg-[#5c3e21] border-3 sm:border-4 border-[#3d2714] rounded-[20px] sm:rounded-[24px] shadow-[0_12px_32px_rgba(40,25,10,0.35)] order-1 lg:order-2 shrink-0">
          {/* Coordinates Top: A-H */}
          <div className="grid grid-cols-8 gap-0 text-center mb-1 text-[9px] sm:text-[10px] font-black text-amber-200/80 pl-3 sm:pl-4">
            {FILES.map(f => (
              <span key={f} className="uppercase">{f}</span>
            ))}
          </div>

          <div className="flex items-stretch">
            {/* Coordinates Left: 8-1 */}
            <div className="flex flex-col justify-around pr-1 text-[9px] sm:text-[10px] font-black text-amber-200/80 w-3 sm:w-4 text-center">
              {[8, 7, 6, 5, 4, 3, 2, 1].map(r => (
                <span key={r} className="flex-1 flex items-center justify-center">{r}</span>
              ))}
            </div>

            {/* 8x8 Chessboard Grid */}
            <div className="w-[min(78vw,52vh,420px)] aspect-square grid grid-cols-8 grid-rows-8 border-2 border-[#3d2714] rounded-lg overflow-hidden shadow-inner bg-[#f0d9b5]">
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const isLightSquare = (r + c) % 2 === 0;
                  const isSelected = selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c;
                  const isValidTarget = validMoves.some(([vr, vc]) => vr === r && vc === c);
                  const isLastMoveSquare =
                    lastMove &&
                    ((lastMove.from[0] === r && lastMove.from[1] === c) ||
                      (lastMove.to[0] === r && lastMove.to[1] === c));

                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      onClick={() => handleSquareClick(r, c)}
                      className={`w-full h-full aspect-square relative flex items-center justify-center transition-all cursor-pointer select-none ${
                        isLightSquare ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'
                      } ${isSelected ? 'ring-3 sm:ring-4 ring-amber-400 z-10 bg-amber-200' : ''} ${
                        isLastMoveSquare ? 'bg-amber-100/90' : ''
                      }`}
                    >
                      {/* Piece Visual */}
                      {cell && (
                        <span
                          className={`text-xl sm:text-2xl md:text-3xl font-normal leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform ${
                            cell.color === 'w'
                              ? 'text-w-text-main drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]'
                              : 'text-slate-950 drop-shadow-[0_2px_3px_rgba(255,255,255,0.4)]'
                          } ${isSelected ? 'scale-110' : 'hover:scale-105'}`}
                        >
                          {PIECE_ICONS[cell.color][cell.type]}
                        </span>
                      )}

                      {/* Valid Move Guidance Indicator (Định hướng vị trí có thể đi) */}
                      {isValidTarget && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                          {cell ? (
                            // Capture Indicator (Red glowing ring around enemy piece)
                            <div className="w-full h-full border-2 sm:border-4 border-rose-500 bg-rose-500/30 rounded-xs animate-pulse ring-1 sm:ring-2 ring-rose-400 shadow-lg" />
                          ) : (
                            // Empty Square Move Indicator (Glowing green dot)
                            <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse ring-1 sm:ring-2 ring-white" />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Victory / Draw Overlay */}
          {roundWinner && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm backdrop-blur-xs rounded-[24px] flex flex-col items-center justify-center p-6 text-center animate-fade-in z-30">
              <div className="text-5xl mb-2">👑</div>
              <h3 className="text-xl sm:text-2xl font-black text-amber-600 mb-1">
                {roundWinner === 'DRAW' ? 'VÁN CỜ HÒA!' : `${roundWinner.name} THẮNG CỜ VUA!`}
              </h3>
              <p className="text-xs sm:text-sm text-w-text-main font-extrabold mb-4 bg-amber-500/30 px-4 py-1.5 rounded-full border border-amber-400">
                {roundWinner === 'DRAW'
                  ? 'Hai bên chấp nhận kết quả hòa'
                  : `Thưởng thắng cờ x5 = +${winBonusPts} Điểm!`}
              </p>

              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={handleResetBoard}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-w-text-main font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Xếp Lại Bàn Cờ</span>
                </button>
                <button
                  type="button"
                  onClick={() => onGameEnd(teams, answerLogs)}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-w-text-main font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-amber-200" />
                  <span>Tổng Kết Trò Chơi</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Captured pieces by White & Quick Tips */}
        <div className="w-full lg:w-48 flex flex-col gap-2 order-3">
          {/* White captured panel */}
          <div className="bg-white/90 backdrop-blur-xs p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-black text-slate-700 mb-1 flex items-center gap-1">
              <span>Quân Đen bị ăn ({capturedByWhite.length}):</span>
            </div>
            <div className="flex flex-wrap gap-1 min-h-[32px] p-1.5 bg-slate-100/80 rounded-xl border border-slate-200">
              {capturedByWhite.map((p, idx) => (
                <span key={idx} className="text-lg text-slate-900 drop-shadow-xs" title={PIECE_NAMES[p.type]}>
                  {PIECE_ICONS.b[p.type]}
                </span>
              ))}
              {capturedByWhite.length === 0 && (
                <span className="text-[10px] text-w-text-muted italic font-medium">Chưa có</span>
              )}
            </div>
          </div>

          {/* Quick Guide card */}
          <div className="bg-amber-50/90 p-3 rounded-2xl border border-amber-200 shadow-xs text-xs font-semibold text-amber-900">
            <div className="font-bold text-[11px] uppercase mb-1 text-amber-950 flex items-center gap-1">
              <span>💡 Hướng dẫn:</span>
            </div>
            <ul className="text-[11px] space-y-1 text-amber-900/90 list-disc list-inside">
              <li>Nhấp quân cờ để xem các ô đi hợp lệ (chấm xanh lá).</li>
              <li>Ăn quân đối phương hiển thị viền đỏ.</li>
              <li>Bắt được Vua đối phương: Thắng ngay lập tức!</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="bg-white/95 backdrop-blur-md border border-w-border p-3 sm:p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Left Status */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="p-1.5 bg-amber-100 rounded-lg text-amber-800">
            {currentConfig.mode === 'none' ? '🎮 Cờ Tự Do' : currentConfig.mode === 'bank' ? '📚 Ngân Hàng' : '🔢 Số Ảo'}
          </span>
          <span className="hidden sm:inline text-slate-500">
            {currentConfig.mode !== 'none'
              ? `Đã dùng: ${usedQuestionIndices.length} câu`
              : 'Chế độ không cần câu hỏi'}
          </span>
        </div>

        {/* Center Main Action */}
        <div className="flex items-center gap-2">
          {currentConfig.mode !== 'none' && !roundWinner && (
            <button
              type="button"
              onClick={handleRandomQuestion}
              disabled={hasMoveRight}
              className={`px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 border cursor-pointer ${
                hasMoveRight
                  ? 'bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed'
                  : currentTurnIdx === 0
                  ? 'bg-amber-600 hover:bg-amber-700 text-w-text-main border-amber-700 shadow-amber-200 animate-pulse hover:scale-105'
                  : 'bg-w-accent-light hover:bg-w-bg-alt text-w-text-main border-slate-900 shadow-slate-300 animate-pulse hover:scale-105'
              }`}
            >
              <Dices className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200" />
              <span>
                {hasMoveRight ? `Đang có lượt đi (${currentTurnIdx === 0 ? 'Trắng' : 'Đen'})` : `Lấy Câu Hỏi Cho ${currentTeam.name}`}
              </span>
            </button>
          )}

          {currentConfig.mode === 'none' && !roundWinner && (
            <div className="px-4 py-2 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 font-extrabold text-xs flex items-center gap-1.5">
              <PlaySquare className="w-4 h-4 text-emerald-700" />
              <span>Lượt của {currentTeam.name}: Nhấp vào quân của bạn để di chuyển</span>
            </div>
          )}
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndoMove}
            disabled={moveHistory.length === 0}
            className="p-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-300 shadow-2xs flex items-center gap-1 cursor-pointer"
            title="Hoàn tác nước đi trước"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hoàn Tác</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRefillModalOpen(true)}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-300 shadow-2xs flex items-center gap-1 cursor-pointer"
            title="Nạp thêm câu hỏi hoặc đổi chế độ"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Nạp Câu Hỏi</span>
          </button>

          <button
            type="button"
            onClick={handleResetBoard}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-300 shadow-2xs flex items-center gap-1 cursor-pointer"
            title="Xếp lại bàn cờ từ đầu"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xếp Lại</span>
          </button>

          <button
            type="button"
            onClick={() => onGameEnd(teams, answerLogs)}
            className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-w-text-main rounded-xl text-xs font-extrabold transition shadow-sm flex items-center gap-1 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-200" />
            <span>Tổng Kết</span>
          </button>
        </div>
      </div>

      {/* Question Modal */}
      <QuestionDisplayModal
        isOpen={isQuestionModalOpen}
        questionNumber={currentQuestionNum || 1}
        question={currentQuestion}
        mode={currentConfig.mode}
        teamName={currentTeam.name}
        teamAvatar={currentTeam.avatar}
        timerEnabled={currentConfig.timerEnabled}
        timeLimitSeconds={currentConfig.timeLimitSeconds}
        titlePrefix="CÂU HỎI CỜ VUA"
        onAnswerSubmit={handleAnswerSubmit}
        onClose={() => setIsQuestionModalOpen(false)}
      />

      {/* Out of Questions / Refill Modal */}
      <RefillQuestionsModal
        isOpen={isRefillModalOpen}
        onClose={() => setIsRefillModalOpen(false)}
        banks={banks}
        currentConfig={currentConfig}
        onConfirm={handleRefillConfirm}
        onSummary={() => onGameEnd(teams, answerLogs)}
      />
    </div>
  );
};
