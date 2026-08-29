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
        optToken = `${currentQuestionNum}`;
      }
    }

    setLastStampedToken(optToken);

    if (isCorrect) {
      soundFx.correct();
    } else {
      soundFx.wrong();
    }

    // Update teams score if answered correctly
    let nextTeams = teams.map((t, idx) =>
      (idx === currentTurnTeamIdx && isCorrect)
        ? { ...t, score: t.score + (config.pointsPerCorrect || 10) }
        : t
    );

    // AUTO-TICK: When question is judged/completed, auto tick matching cell on ALL team cards
    const qNumStr = `${currentQuestionNum}`;
    const updatedBingoGrids = teamBingoGrids.map(tState => {
      const newStamped = tState.stamped.map(row => [...row]);

      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          const cellVal = String(tState.grid[r][c]).trim().toUpperCase();
          // Match criteria:
          // 1. Exact token: "3B" === "3B"
          // 2. Question number prefix match if token has letter
          // 3. Simple question number: "3" or "CÂU 3"
          if (
            cellVal === optToken.toUpperCase() ||
            cellVal === qNumStr ||
            cellVal === `CÂU ${qNumStr}` ||
            cellVal === `Q${qNumStr}` ||
            (optToken && cellVal.startsWith(`${qNumStr}`) && optToken.startsWith(`${qNumStr}`))
          ) {
            newStamped[r][c] = true;
          }
        }
      }

      const isBingo = checkBingoLine(newStamped, gridSize);
      if (isBingo && !tState.hasBingo) {
        soundFx.winFanfare();
        // Award bonus score for completing a line
        nextTeams = nextTeams.map(t =>
          t.id === tState.teamId ? { ...t, score: t.score + 50 } : t
        );
      }

      return { ...tState, stamped: newStamped, hasBingo: isBingo };
    });

    setTeams(nextTeams);
    setTeamBingoGrids(updatedBingoGrids);

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
    <div className="flex-1 min-h-[100dvh] w-full p-3 sm:p-5 bg-w-bg-main text-w-text-main flex flex-col justify-between overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-w-bg-card border border-w-border p-4 rounded-2xl shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🧩</span>
          <div>
            <h2 className="text-lg sm:text-xl font-[900] text-w-text-main flex items-center gap-2">
              <span>Bingo Tri Thức - Bảng Toàn Bộ Đội</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-w-accent-light text-w-primary border border-w-accent-border font-bold">
                {gridSize}x{gridSize} Tự Động Tick
              </span>
            </h2>
            <p className="text-xs text-w-text-muted">
              Trả lời câu hỏi ➔ Tự động Tick ô tương ứng (dạng 1D, 3D, 4A, 5Đ, 6S) cho các nhóm!
            </p>
          </div>
        </div>

        <button
          onClick={() => onGameEnd(teams, answerLogs)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs cursor-pointer"
        >
          Tổng Kết Game
        </button>
      </div>

      {/* Main Control Panel & Spin Button */}
      <div className="my-3 space-y-3 shrink-0">
        <div className="bg-w-bg-card border border-w-border p-3 sm:p-4 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-w-primary font-mono uppercase tracking-wider">
              BẢNG QUAY CÂU HỎI BINGO
            </span>
            {lastStampedToken && (
              <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shadow-xs flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Vừa Auto-Tick Ô: {lastStampedToken}</span>
              </span>
            )}
          </div>

          {gameState === 'WAIT_SPIN' && (
            <button
              onClick={handleSpinQuestion}
              className="flex items-center gap-2 px-6 py-2.5 wey-btn-primary font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Dices className="w-4 h-4" />
              <span>Quay Chọn Câu Hỏi</span>
            </button>
          )}
        </div>

        {/* Active turn team indicator */}
        <div className="flex items-center justify-between bg-w-bg-card p-3 rounded-xl border border-w-border">
          <span className="text-xs font-bold text-w-text-main flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            LƯỢT QUAY: {teams[currentTurnTeamIdx]?.avatar} <strong className="text-w-primary">{teams[currentTurnTeamIdx]?.name}</strong>
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {teams.map((team, idx) => {
            const tState = teamBingoGrids[idx] || generateBingoGrid(team.id, config, questions, gridSize);

            return (
              <div
                key={team.id}
                className={`p-3.5 rounded-2xl border transition shadow-xs flex flex-col justify-between space-y-2.5 ${
                  tState.hasBingo
                    ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/40'
                    : 'bg-w-bg-card border-w-border hover:border-w-primary/50'
                }`}
              >
                {/* Team Info Header */}
                <div className="flex items-center justify-between border-b border-w-border pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{team.avatar}</span>
                    <div>
                      <div className="font-extrabold text-sm text-w-text-main flex items-center gap-1.5">
                        <span>{team.name}</span>
                        {tState.hasBingo && (
                          <Trophy className="w-4 h-4 text-amber-500 animate-bounce" />
                        )}
                      </div>
                      <div className="text-xs font-bold text-w-primary">
                        Điểm: {team.score}đ
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRegenerateBingoGrid(team.id)}
                    className="p-1.5 rounded-lg bg-w-bg-alt hover:bg-w-accent-light text-w-text-muted hover:text-w-text-main transition text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    title="Đổi phiếu Bingo mới cho đội này"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Đổi phiếu</span>
                  </button>
                </div>

                {tState.hasBingo && (
                  <div className="px-2 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs text-center shadow-xs animate-pulse">
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
                          className={`aspect-square rounded-xl border p-1 text-[11px] font-black font-mono transition flex flex-col items-center justify-center text-center shadow-xs cursor-pointer ${
                            isStamped
                              ? 'bg-amber-400 text-slate-950 border-amber-500 ring-2 ring-amber-300 font-extrabold scale-105'
                              : 'bg-w-bg-alt/70 border-w-border text-w-text-main hover:border-w-primary/60 hover:bg-w-accent-light'
                          }`}
                        >
                          {isStamped ? (
                            <CheckCircle2 className="w-4 h-4 text-slate-950 fill-amber-300" />
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

      <div className="text-center text-xs text-w-text-muted font-medium pt-2 pb-1 shrink-0">
        Mỗi khi câu hỏi có kết quả, hệ thống tự động tick các ô tương ứng trên tất cả phiếu Bingo!
      </div>
    </div>
  );
};

