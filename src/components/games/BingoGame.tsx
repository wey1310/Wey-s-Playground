import React, { useState } from 'react';
import { GameSetupConfig, Question, AnswerLog } from '../../types';
import { soundFx } from '../../utils/audio';
import { Dices, Trophy, RefreshCw, CheckCircle2, Sparkles } from 'lucide-react';
import { QuestionDisplayModal } from '../QuestionDisplayModal';

interface BingoGameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: any[], answerLogs: AnswerLog[]) => void;
}

interface TeamBingoState {
  teamId: string;
  grid: string[][]; // 5x5 grid values e.g. "1A", "3D", "4A", "5Đ", "6S"
  stamped: boolean[][];
  hasBingo: boolean;
}

export const BingoGame: React.FC<BingoGameProps> = ({ config, questions, onGameEnd }) => {
  const gridSize = 5; // 5x5 Grid for rich & playable layout
  const [teams, setTeams] = useState(config.teams);
  const [currentTurnTeamIdx, setCurrentTurnTeamIdx] = useState<number>(0);
  const [usedQuestionIndices, setUsedQuestionIndices] = useState<number[]>([]);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);

  // Question State
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionNum, setCurrentQuestionNum] = useState<number | null>(null);
  const [gameState, setGameState] = useState<'WAIT_SPIN' | 'WAIT_JUDGE' | 'RESULT'>('WAIT_SPIN');
  const [lastStampedToken, setLastStampedToken] = useState<string | null>(null);

  // Initialize Team Bingo Grids
  const [teamBingoGrids, setTeamBingoGrids] = useState<TeamBingoState[]>(() => {
    return config.teams.map(team => generateBingoGrid(team.id, config, questions, gridSize));
  });

  function generateBingoGrid(
    teamId: string,
    cfg: GameSetupConfig,
    qList: Question[],
    size: number
  ): TeamBingoState {
    const totalItems = size * size;
    const values: string[] = [];

    // Format options: 1A, 1B, 1C, 1D, 2Đ, 2S, 3A, 3D, 4A, 5Đ, 6S, etc.
    const maxQ = cfg.mode === 'bank' && qList.length > 0 ? qList.length : cfg.totalQuestionsNumber || 20;

    for (let i = 1; i <= totalItems; i++) {
      const qNum = ((i - 1) % maxQ) + 1;
      let optCode = 'A';
      if (cfg.mode === 'bank' && qList[qNum - 1]) {
        const q = qList[qNum - 1];
        if (q.type === 'tf') {
          optCode = (i % 2 === 0) ? 'Đ' : 'S';
        } else {
          const opts = ['A', 'B', 'C', 'D'];
          optCode = opts[(i + Math.floor(i / 2)) % opts.length];
        }
      } else {
        const opts = ['A', 'B', 'C', 'D', 'Đ', 'S'];
        optCode = opts[i % opts.length];
      }
      values.push(`${qNum}${optCode}`);
    }

    // Shuffle values
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }

    // Build 2D grid
    const grid: string[][] = [];
    const stamped: boolean[][] = [];
    for (let r = 0; r < size; r++) {
      grid[r] = [];
      stamped[r] = [];
      for (let c = 0; c < size; c++) {
        grid[r][c] = values[r * size + c];
        stamped[r][c] = false;
      }
    }

    return { teamId, grid, stamped, hasBingo: false };
  }

  const handleSpinQuestion = () => {
    soundFx.diceRoll();

    if (config.mode === 'bank') {
      let available = questions.map((_, i) => i).filter(i => !usedQuestionIndices.includes(i));
      if (available.length === 0) {
        available = questions.map((_, i) => i);
        setUsedQuestionIndices([]);
      }
      const randIdx = available[Math.floor(Math.random() * available.length)];
      setUsedQuestionIndices(prev => [...prev, randIdx]);
      setCurrentQuestion(questions[randIdx]);
      setCurrentQuestionNum(randIdx + 1);
    } else {
      let randNum = Math.floor(Math.random() * config.totalQuestionsNumber) + 1;
      setUsedQuestionIndices(prev => [...prev, randNum]);
      setCurrentQuestion(null);
      setCurrentQuestionNum(randNum);
    }

    setGameState('WAIT_JUDGE');
  };

  const handleJudgeAnswer = (isCorrect: boolean, correctAnswerText: string) => {
    const currentTeam = teams[currentTurnTeamIdx] || teams[0];
    if (isCorrect) {
      soundFx.correct();

      // Extract Answer Option Token (e.g., "1D", "3D", "4A", "5Đ", "6S")
      let optToken = '';
      if (currentQuestion) {
        if (currentQuestion.type === 'mcq') {
          const letter = String.fromCharCode(65 + Number(currentQuestion.correct));
          optToken = `${currentQuestionNum}${letter}`;
        } else if (currentQuestion.type === 'tf') {
          const letter = currentQuestion.correct ? 'Đ' : 'S';
          optToken = `${currentQuestionNum}${letter}`;
        } else {
          optToken = `${currentQuestionNum}A`;
        }
      } else {
        // Mode number or manual answer format check
        const cleanText = correctAnswerText.trim().toUpperCase();
        if (cleanText.startsWith('A') || cleanText.startsWith('B') || cleanText.startsWith('C') || cleanText.startsWith('D') || cleanText.startsWith('Đ') || cleanText.startsWith('S')) {
          optToken = `${currentQuestionNum}${cleanText[0]}`;
        } else {
          optToken = `${currentQuestionNum}A`;
        }
      }

      setLastStampedToken(optToken);

      // Add points for current team that answered correctly
      let nextTeams = teams.map((t, idx) =>
        idx === currentTurnTeamIdx ? { ...t, score: t.score + (config.pointsPerCorrect || 10) } : t
      );

      // Auto stamp current token (e.g. "1D") across ALL team grids!
      const updatedBingoGrids = teamBingoGrids.map(tState => {
        const newStamped = tState.stamped.map(row => [...row]);

        for (let r = 0; r < gridSize; r++) {
          for (let c = 0; c < gridSize; c++) {
            const cellVal = String(tState.grid[r][c]).trim().toUpperCase();
            // Check exact token or question num match
            if (cellVal === optToken.toUpperCase() || cellVal === `${currentQuestionNum}` || cellVal === `CÂU ${currentQuestionNum}`) {
              newStamped[r][c] = true;
            }
          }
        }

        const isBingo = checkBingoLine(newStamped, gridSize);
        if (isBingo && !tState.hasBingo) {
          soundFx.winFanfare();
          // Award bonus score
          nextTeams = nextTeams.map(t =>
            t.id === tState.teamId ? { ...t, score: t.score + 50 } : t
          );
        }

        return { ...tState, stamped: newStamped, hasBingo: isBingo };
      });

      setTeams(nextTeams);
      setTeamBingoGrids(updatedBingoGrids);
    } else {
      soundFx.wrong();
    }

    // Save log
    const log: AnswerLog = {
      questionNumber: currentQuestionNum || 1,
      questionText: currentQuestion ? currentQuestion.content : `Câu số ${currentQuestionNum}`,
      correctAnswer: correctAnswerText,
      teamName: currentTeam.name,
      isCorrect,
    };
    setAnswerLogs(prev => [...prev, log]);

    // Rotate turn to next team
    setCurrentTurnTeamIdx((currentTurnTeamIdx + 1) % teams.length);
    setGameState('WAIT_SPIN');
  };

  function checkBingoLine(stamped: boolean[][], size: number): boolean {
    // Check rows & columns
    for (let i = 0; i < size; i++) {
      if (stamped[i].every(Boolean)) return true;
      if (stamped.map(r => r[i]).every(Boolean)) return true;
    }
    // Check diagonals
    if (Array.from({ length: size }).every((_, i) => stamped[i][i])) return true;
    if (Array.from({ length: size }).every((_, i) => stamped[i][size - 1 - i])) return true;
    return false;
  }

  const handleRegenerateBingoGrid = (teamId: string) => {
    soundFx.cardPower();
    setTeamBingoGrids(prev =>
      prev.map(t => (t.teamId === teamId ? generateBingoGrid(teamId, config, questions, gridSize) : t))
    );
  };

  return (
    <div className="flex-1 min-h-0 w-full p-4 sm:p-6 bg-gradient-to-b from-indigo-950 via-slate-900 to-purple-950 text-w-text-main rounded-2xl shadow-2xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-w-bg-alt border border-indigo-500/30 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🧩</span>
          <div>
            <h2 className="text-xl font-extrabold text-amber-600 flex items-center gap-2">
              <span>Bingo Tri Thức - Bảng Toàn Bộ Đội</span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-normal">
                {gridSize}x{gridSize} Auto-Tick
              </span>
            </h2>
            <p className="text-xs text-w-primary-dark">
              Trả lời câu hỏi ➔ Tự động Tick cho TẤT CẢ các nhóm có ô đáp án (dạng 1D, 3D, 4A, 5Đ, 6S)!
            </p>
          </div>
        </div>

        <button
          onClick={() => onGameEnd(teams, answerLogs)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-w-text-main font-bold text-xs rounded-xl transition shadow"
        >
          Tổng Kết Game
        </button>
      </div>

      {/* Main Control Panel & Spin Button */}
      <div className="my-4 space-y-4">
        <div className="bg-w-bg-alt border border-indigo-200 p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-wider">
              BẢNG QUAY CÂU HỎI BINGO
            </span>
            {lastStampedToken && (
              <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Vừa Auto-Tick Đáp Án: {lastStampedToken}</span>
              </span>
            )}
          </div>

          {gameState === 'WAIT_SPIN' && (
            <button
              onClick={handleSpinQuestion}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition animate-bounce"
            >
              <Dices className="w-4 h-4" />
              <span>Quay Chọn Câu Hỏi</span>
            </button>
          )}
        </div>

        {/* Active turn team indicator */}
        <div className="flex items-center justify-between bg-w-bg-card p-3 rounded-xl border border-indigo-500/20">
          <span className="text-xs font-bold text-amber-600 font-mono flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            LƯỢT QUAY: {teams[currentTurnTeamIdx]?.avatar} {teams[currentTurnTeamIdx]?.name}
          </span>
        </div>

        {/* Question Modal */}
        <QuestionDisplayModal
          isOpen={gameState === 'WAIT_JUDGE'}
          questionNumber={currentQuestionNum || 1}
          question={currentQuestion}
          mode={config.mode}
          teamName={teams[currentTurnTeamIdx]?.name}
          teamAvatar={teams[currentTurnTeamIdx]?.avatar}
          timerEnabled={config.timerEnabled}
          timeLimitSeconds={config.timeLimitSeconds}
          titlePrefix="🧩 BINGO CÂU HỎI -"
          onAnswerSubmit={(isCorrect, correctAnswerText) => {
            handleJudgeAnswer(isCorrect, correctAnswerText);
          }}
        />

        {/* ALL TEAM BINGO CARDS DISPLAYED SIMULTANEOUSLY SIDE-BY-SIDE */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {teams.map((team, idx) => {
            const tState = teamBingoGrids[idx] || generateBingoGrid(team.id, config, questions, gridSize);

            return (
              <div
                key={team.id}
                className={`p-4 rounded-2xl border transition shadow-xl flex flex-col justify-between space-y-3 ${
                  tState.hasBingo
                    ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/50'
                    : 'bg-w-bg-alt border-indigo-200 hover:border-indigo-400'
                }`}
              >
                {/* Team Info Header */}
                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{team.avatar}</span>
                    <div>
                      <div className="font-extrabold text-sm text-w-text-main flex items-center gap-1.5">
                        <span>{team.name}</span>
                        {tState.hasBingo && (
                          <Trophy className="w-4 h-4 text-amber-600 animate-bounce" />
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-amber-600 font-bold">
                        Điểm: {team.score}đ
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRegenerateBingoGrid(team.id)}
                    className="p-1.5 rounded-lg bg-w-accent-light hover:bg-slate-700 text-w-primary-dark hover:text-amber-600 transition text-[10px] flex items-center gap-1"
                    title="Đổi phiếu Bingo mới cho đội này"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Tạo Mới</span>
                  </button>
                </div>

                {tState.hasBingo && (
                  <div className="px-2 py-1 rounded bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[11px] text-center shadow animate-pulse">
                    🎉 BINGO CẮM CỜ THÀNH CÔNG! (+50Đ)
                  </div>
                )}

                {/* 5x5 Grid for this team */}
                <div className="grid grid-cols-5 gap-1.5">
                  {tState.grid.map((row, r) =>
                    row.map((val, c) => {
                      const isStamped = tState.stamped[r][c];
                      return (
                        <button
                          key={`${r}_${c}`}
                          onClick={() => {
                            // Manual toggle stamp
                            const newStamped = tState.stamped.map(rw => [...rw]);
                            newStamped[r][c] = !newStamped[r][c];
                            const isBingo = checkBingoLine(newStamped, gridSize);
                            setTeamBingoGrids(prev =>
                              prev.map(t =>
                                t.teamId === team.id
                                  ? { ...t, stamped: newStamped, hasBingo: isBingo }
                                  : t
                              )
                            );
                          }}
                          className={`aspect-square rounded-lg border p-1 text-[10px] font-black font-mono transition flex flex-col items-center justify-center text-center shadow ${
                            isStamped
                              ? 'bg-amber-400 text-slate-950 border-amber-200 ring-2 ring-amber-300/60 scale-105'
                              : 'bg-w-bg-card border-w-border text-w-primary-dark hover:border-slate-600'
                          }`}
                        >
                          {isStamped ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 fill-amber-300" />
                          ) : (
                            <span className="truncate max-w-full">{val}</span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center text-xs text-w-text-muted font-medium pt-2">
        Mỗi đáp án đúng sẽ tự động tick ô có mã tương ứng (ví dụ: 1D, 3D, 4A, 5Đ) trên tất cả phiếu Bingo!
      </div>
    </div>
  );
};

