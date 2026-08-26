import React, { useState, useEffect } from 'react';
import { GameSetupConfig, Question, AnswerLog, PRESET_THEMES, Team, QuestionBank } from '../../types';
import { soundFx } from '../../utils/audio';
import { Dices, Trophy, RotateCcw, Sparkles, CheckCircle2, Award, PlaySquare, AlertCircle, RefreshCw } from 'lucide-react';
import { QuestionDisplayModal } from '../QuestionDisplayModal';
import { RefillQuestionsModal } from '../RefillQuestionsModal';

interface CaroGameProps {
  config: GameSetupConfig;
  questions: Question[];
  banks?: QuestionBank[];
  onGameEnd: (teams: Team[], answerLogs: AnswerLog[]) => void;
}

type CellValue = 'X' | 'O' | null;

export const CaroGame: React.FC<CaroGameProps> = ({ config, questions, banks = [], onGameEnd }) => {
  // Fixed exactly 2 teams
  const [currentConfig, setCurrentConfig] = useState<GameSetupConfig>(config);
  const [teams, setTeams] = useState<Team[]>(() => {
    const rawTeams = (config.teams || []).slice(0, 2);
    const team1 = rawTeams[0] || { id: 'team_1', name: 'Đội X (Đỏ)', avatar: '🐉', color: '#ef4444', score: 0 };
    const team2 = rawTeams[1] || { id: 'team_2', name: 'Đội O (Xanh)', avatar: '🦅', color: '#3b82f6', score: 0 };
    return [
      { ...team1, score: team1.score || 0 },
      { ...team2, score: team2.score || 0 }
    ];
  });

  const [currentTurnIdx, setCurrentTurnIdx] = useState<number>(0); // 0 = Team X, 1 = Team O
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [roundWinner, setRoundWinner] = useState<Team | 'TIE' | null>(null);
  const [roundCount, setRoundCount] = useState<number>(1);
  const [hasMoveRight, setHasMoveRight] = useState<boolean>(config.mode === 'none'); // if free play, moves are always allowed

  // Questions and turn states
  const [usedQuestionIndices, setUsedQuestionIndices] = useState<number[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionNum, setCurrentQuestionNum] = useState<number | null>(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState<boolean>(false);
  const [isRefillModalOpen, setIsRefillModalOpen] = useState<boolean>(false);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);
  const [turnMessage, setTurnMessage] = useState<string>('');

  const ptsPerQuestion = 10;
  const winMultiplier = 3;
  const winBonusPts = ptsPerQuestion * winMultiplier; // 30 pts

  const themeInfo = PRESET_THEMES.find(t => t.id === currentConfig.theme) || PRESET_THEMES[0];
  const currentTeam = teams[currentTurnIdx];
  const currentSymbol: CellValue = currentTurnIdx === 0 ? 'X' : 'O';

  // Check 3x3 Win Condition
  const checkWinner = (squares: CellValue[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winnerSymbol: squares[a], line: lines[i] };
      }
    }

    if (squares.every(cell => cell !== null)) {
      return { winnerSymbol: 'TIE', line: null };
    }

    return null;
  };

  // Random / Spin Question
  const handleRandomQuestion = () => {
    if (roundWinner) return;

    soundFx.diceRoll();

    if (currentConfig.mode === 'bank') {
      const totalBankQuestions = questions.length;
      if (totalBankQuestions === 0) {
        setIsRefillModalOpen(true);
        return;
      }

      let available = questions.map((_, i) => i).filter(i => !usedQuestionIndices.includes(i));
      if (available.length === 0) {
        // Out of questions!
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
        // Out of numbers!
        setIsRefillModalOpen(true);
        return;
      }

      const randNum = available[Math.floor(Math.random() * available.length)];
      setUsedQuestionIndices(prev => [...prev, randNum]);
      setCurrentQuestion(null);
      setCurrentQuestionNum(randNum);
      setIsQuestionModalOpen(true);
    } else {
      // Free play mode
      setHasMoveRight(true);
    }
  };

  // Handle Question Answer Submission
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
      // Award normal question points
      setTeams(prev => {
        const next = [...prev];
        next[currentTurnIdx].score += ptsPerQuestion;
        return next;
      });
      setHasMoveRight(true);
      setTurnMessage(`🎯 ${currentTeam.name} trả lời ĐÚNG (+${ptsPerQuestion}đ)! Hãy chọn 1 ô để đánh quân ${currentSymbol}.`);
    } else {
      soundFx.wrong();
      setHasMoveRight(false);
      setTurnMessage(`❌ ${currentTeam.name} trả lời SAI! Mất lượt đánh cờ.`);
      // Switch turn to other team
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

  // Handle Clicking on a 3x3 Board Cell
  const handleCellClick = (index: number) => {
    if (board[index] !== null || roundWinner) return;

    if (!hasMoveRight && currentConfig.mode !== 'none') {
      soundFx.wrong();
      setTurnMessage(`⚠️ ${currentTeam.name} cần bấm "Random Câu Hỏi" và trả lời đúng trước khi đánh cờ!`);
      return;
    }

    soundFx.buttonClick();
    const newBoard = [...board];
    newBoard[index] = currentSymbol;
    setBoard(newBoard);

    // Check winner
    const winResult = checkWinner(newBoard);

    if (winResult) {
      if (winResult.winnerSymbol === 'TIE') {
        soundFx.powerup();
        setRoundWinner('TIE');
        setTurnMessage('🤝 Ván cờ Hòa! Cả hai đội đấu trí ngang tài ngang sức.');
      } else {
        soundFx.winFanfare();
        setWinningLine(winResult.line);
        setRoundWinner(currentTeam);
        // Award bonus points x3
        setTeams(prev => {
          const next = [...prev];
          next[currentTurnIdx].score += winBonusPts;
          return next;
        });
        setTurnMessage(`🏆 CHÚC MỪNG ${currentTeam.name} THẮNG CARO! Nhận thưởng x3 = +${winBonusPts} điểm!`);
      }
      setHasMoveRight(false);
    } else {
      // Next turn
      const nextTurn = currentTurnIdx === 0 ? 1 : 0;
      setCurrentTurnIdx(nextTurn);
      setTurnMessage(`Đến lượt ${teams[nextTurn].name} (${nextTurn === 0 ? 'X' : 'O'})`);
      if (currentConfig.mode === 'none') {
        setHasMoveRight(true);
      } else {
        setHasMoveRight(false);
      }
    }
  };

  // Start Next Round (keep scores)
  const handleNextRound = () => {
    soundFx.buttonClick();
    setBoard(Array(9).fill(null));
    setWinningLine(null);
    setRoundWinner(null);
    setRoundCount(prev => prev + 1);
    setCurrentTurnIdx((roundCount) % 2); // alternate starting team
    setHasMoveRight(currentConfig.mode === 'none');
    setTurnMessage(`Ván mới bắt đầu! Lượt đầu thuộc về ${teams[(roundCount) % 2].name}`);
  };

  // Reset entire board & round
  const handleResetBoard = () => {
    soundFx.buttonClick();
    setBoard(Array(9).fill(null));
    setWinningLine(null);
    setRoundWinner(null);
    setHasMoveRight(currentConfig.mode === 'none');
    setTurnMessage('Đã làm mới bàn cờ!');
  };

  // Refill questions callback
  const handleRefillConfirm = (updates: Partial<GameSetupConfig>) => {
    setCurrentConfig(prev => ({ ...prev, ...updates }));
    setUsedQuestionIndices([]);
    if (updates.mode === 'none') {
      setHasMoveRight(true);
      setTurnMessage('Đã chuyển sang chế độ chơi tự do (Không cần random câu hỏi)!');
    } else {
      setHasMoveRight(false);
      setTurnMessage('Đã nạp thêm câu hỏi thành công! Bấm "Random Câu Hỏi" để tiếp tục.');
    }
  };

  return (
    <div className={`flex-1 min-h-0 w-full p-3 sm:p-5 bg-gradient-to-b ${themeInfo.bgClass} rounded-[24px] shadow-2xl flex flex-col justify-between border-2 sm:border-4 border-w-border relative`}>
      {/* Top Header & Scoreboard */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/95 backdrop-blur-md border border-w-border p-3 sm:p-4 rounded-2xl shadow-sm">
        {/* Team 1 (X) */}
        <div
          className={`flex-1 flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border-2 transition-all ${
            currentTurnIdx === 0 && !roundWinner
              ? 'bg-rose-50 border-rose-500 shadow-md scale-102 ring-2 ring-rose-300'
              : 'bg-slate-50/80 border-slate-200 opacity-80'
          }`}
        >
          <div className="text-2xl sm:text-3xl p-1.5 rounded-xl bg-white border border-rose-200 shadow-xs">
            {teams[0].avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-rose-600 text-sm sm:text-base truncate">
                {teams[0].name}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-600 text-w-text-main font-black text-xs">
                X
              </span>
            </div>
            <div className="text-xs font-bold text-slate-600 mt-0.5">
              Điểm: <span className="text-rose-700 font-extrabold text-sm sm:text-base">{teams[0].score}</span>
            </div>
          </div>
        </div>

        {/* Center Match Info */}
        <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-2 px-3 py-1 bg-amber-50/80 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-extrabold text-amber-900 uppercase">
              Ván {roundCount}
            </span>
          </div>
          <div className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
            Thắng cờ: +{winBonusPts}đ (x3)
          </div>
        </div>

        {/* Team 2 (O) */}
        <div
          className={`flex-1 flex items-center justify-end gap-3 p-2.5 sm:p-3 rounded-xl border-2 transition-all ${
            currentTurnIdx === 1 && !roundWinner
              ? 'bg-blue-50 border-blue-500 shadow-md scale-102 ring-2 ring-blue-300'
              : 'bg-slate-50/80 border-slate-200 opacity-80'
          }`}
        >
          <div className="flex-1 text-right min-w-0">
            <div className="flex items-center justify-end gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-blue-600 text-w-text-main font-black text-xs">
                O
              </span>
              <span className="font-black text-blue-600 text-sm sm:text-base truncate">
                {teams[1].name}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-600 mt-0.5">
              Điểm: <span className="text-blue-700 font-extrabold text-sm sm:text-base">{teams[1].score}</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl p-1.5 rounded-xl bg-white border border-blue-200 shadow-xs">
            {teams[1].avatar}
          </div>
        </div>
      </div>

      {/* Turn Banner & Prompt Message */}
      <div className="my-2 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-slate-200 shadow-xs text-xs sm:text-sm font-bold text-slate-800">
          <span className="w-2.5 h-2.5 rounded-full animate-ping bg-emerald-500" />
          <span>{turnMessage || `Đang đến lượt ${currentTeam.name} (${currentSymbol})`}</span>
        </div>
      </div>

      {/* Main 3x3 Caro Board Area */}
      <div className="flex-1 flex flex-col items-center justify-center my-2 sm:my-4">
        <div className="relative p-4 sm:p-6 bg-amber-100/90 border-4 border-amber-800/60 rounded-[28px] shadow-[0_16px_36px_rgba(79,104,60,0.22)] backdrop-blur-xs">
          {/* 3x3 Grid */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 bg-amber-900/30 p-3 sm:p-4 rounded-2xl border-2 border-amber-900/40">
            {board.map((cell, idx) => {
              const isWinCell = winningLine?.includes(idx);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleCellClick(idx)}
                  disabled={cell !== null || !!roundWinner}
                  className={`w-20 h-20 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center font-black text-4xl sm:text-6xl transition-all duration-200 shadow-inner border-2 ${
                    isWinCell
                      ? 'bg-amber-300 border-amber-500 text-amber-900 scale-105 animate-pulse shadow-lg ring-4 ring-amber-400'
                      : cell === 'X'
                      ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-md'
                      : cell === 'O'
                      ? 'bg-blue-50 border-blue-300 text-blue-600 shadow-md'
                      : 'bg-white/90 hover:bg-amber-50 border-amber-200 text-transparent hover:scale-102 cursor-pointer'
                  }`}
                >
                  {cell === 'X' && (
                    <span className="drop-shadow-[0_3px_6px_rgba(239,68,68,0.3)] animate-scale-in">
                      ✕
                    </span>
                  )}
                  {cell === 'O' && (
                    <span className="drop-shadow-[0_3px_6px_rgba(59,130,246,0.3)] animate-scale-in">
                      ◯
                    </span>
                  )}
                  {cell === null && !roundWinner && (
                    <span className="text-w-primary-dark opacity-0 hover:opacity-40 text-2xl font-bold">
                      {currentSymbol}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Round Finished Overlay */}
          {roundWinner && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm backdrop-blur-xs rounded-[28px] flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
              {roundWinner === 'TIE' ? (
                <>
                  <div className="text-5xl mb-2">🤝</div>
                  <h3 className="text-xl sm:text-2xl font-black text-w-text-main mb-1">
                    VÁN ĐẤU HÒA!
                  </h3>
                  <p className="text-xs text-amber-200 font-bold mb-4">
                    Cả 9 ô đã được đi kín mà chưa có đội nào tạo được hàng 3.
                  </p>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-2">🏆</div>
                  <h3 className="text-xl sm:text-2xl font-black text-amber-600 mb-1">
                    {roundWinner.name} CHIẾN THẮNG!
                  </h3>
                  <p className="text-xs sm:text-sm text-w-text-main font-extrabold mb-4 bg-amber-500/30 px-4 py-1.5 rounded-full border border-amber-400">
                    Thưởng thắng Caro x3: +{winBonusPts} Điểm!
                  </p>
                </>
              )}

              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={handleNextRound}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-w-text-main font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Chơi Ván Tiếp Theo</span>
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
      </div>

      {/* Bottom Action Controls */}
      <div className="bg-white/95 backdrop-blur-md border border-w-border p-3 sm:p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Left Info / Question Status */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="p-1.5 bg-amber-100 rounded-lg text-amber-800">
            {currentConfig.mode === 'none' ? '🎮 Tự Do' : currentConfig.mode === 'bank' ? '📚 Ngân Hàng' : '🔢 Số Ảo'}
          </span>
          <span className="hidden sm:inline text-slate-500">
            {currentConfig.mode !== 'none'
              ? `Đã dùng: ${usedQuestionIndices.length} câu`
              : 'Chế độ không cần câu hỏi'}
          </span>
        </div>

        {/* Center Main Turn Action Button */}
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
                  ? 'bg-rose-600 hover:bg-rose-700 text-w-text-main border-rose-700 shadow-rose-200 animate-pulse hover:scale-105'
                  : 'bg-blue-600 hover:bg-blue-700 text-w-text-main border-blue-700 shadow-blue-200 animate-pulse hover:scale-105'
              }`}
            >
              <Dices className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200" />
              <span>
                {hasMoveRight ? `Đang có lượt đánh (${currentSymbol})` : `Lấy Câu Hỏi Cho ${currentTeam.name}`}
              </span>
            </button>
          )}

          {currentConfig.mode === 'none' && !roundWinner && (
            <div className="px-4 py-2 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 font-extrabold text-xs flex items-center gap-1.5">
              <PlaySquare className="w-4 h-4 text-emerald-700" />
              <span>Lượt của {currentTeam.name}: Nhấp vào ô trống bất kỳ để đánh {currentSymbol}</span>
            </div>
          )}
        </div>

        {/* Right Aux Controls */}
        <div className="flex items-center gap-2">
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
            title="Làm mới bàn cờ ván này"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Làm Lại Bàn</span>
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
        titlePrefix="CÂU HỎI CARO"
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
