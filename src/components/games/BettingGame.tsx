import React, { useState } from 'react';
import { GameSetupConfig, Question, AnswerLog } from '../../types';
import { soundFx } from '../../utils/audio';
import { Shield, Zap, Flame, Dices, Check, X } from 'lucide-react';

interface BettingGameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: any[], answerLogs: AnswerLog[]) => void;
}

interface TeamBetState {
  teamId: string;
  betPoints: number;
  answerText: string;
  cardUsed: 'shield' | 'vampire' | 'double' | null;
}

export const BettingGame: React.FC<BettingGameProps> = ({ config, questions, onGameEnd }) => {
  const [teams, setTeams] = useState(config.teams.map(t => ({ ...t, score: 100 }))); // Start with 100 pts
  const [usedQuestionIndices, setUsedQuestionIndices] = useState<number[]>([]);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);

  // Question & Betting State
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionNum, setCurrentQuestionNum] = useState<number | null>(null);
  const [gameState, setGameState] = useState<'WAIT_SPIN' | 'WAIT_BETS' | 'RESULT'>('WAIT_SPIN');

  const [teamBets, setTeamBets] = useState<TeamBetState[]>(() =>
    config.teams.map(t => ({
      teamId: t.id,
      betPoints: 10,
      answerText: '',
      cardUsed: null,
    }))
  );

  const [manualCorrectText, setManualCorrectText] = useState<string>('');

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

    // Reset bets
    setTeamBets(teams.map(t => ({
      teamId: t.id,
      betPoints: Math.min(10, t.score),
      answerText: '',
      cardUsed: null,
    })));

    setGameState('WAIT_BETS');
  };

  const handleUpdateBet = (teamId: string, field: keyof TeamBetState, value: any) => {
    setTeamBets(prev =>
      prev.map(b => (b.teamId === teamId ? { ...b, [field]: value } : b))
    );
  };

  const handleConfirmBetResults = () => {
    soundFx.cardPower();

    const updatedTeams = teams.map(t => ({ ...t }));
    let vampireSiphonPool = 0;

    // First Pass: Check correct answers & deductions
    const roundResults = teamBets.map(bet => {
      const team = updatedTeams.find(t => t.id === bet.teamId);
      if (!team) return { teamId: bet.teamId, isCorrect: false, scoreChange: 0 };

      let isCorrect = false;
      if (currentQuestion) {
        if (currentQuestion.type === 'mcq') {
          isCorrect = bet.answerText.trim().toUpperCase() === String.fromCharCode(65 + Number(currentQuestion.correct));
        } else if (currentQuestion.type === 'tf') {
          isCorrect = (bet.answerText.trim().toLowerCase() === 'đúng') === Boolean(currentQuestion.correct);
        } else {
          isCorrect = bet.answerText.trim().toLowerCase() === String(currentQuestion.correct).toLowerCase();
        }
      } else {
        // Teacher confirmation or manual input
        isCorrect = bet.answerText.trim().length > 0;
      }

      let betAmount = Math.min(team.score, Math.max(0, bet.betPoints));
      if (bet.cardUsed === 'double') betAmount *= 2;

      let scoreChange = 0;
      if (isCorrect) {
        scoreChange = betAmount;
      } else {
        if (bet.cardUsed === 'shield') {
          scoreChange = 0; // Shield protects points
        } else {
          scoreChange = -betAmount;
          vampireSiphonPool += Math.floor(betAmount / 2);
        }
      }

      team.score += scoreChange;

      return { teamId: bet.teamId, isCorrect, scoreChange };
    });

    // Second Pass: Distribute Vampire Siphon
    const vampireTeams = teamBets.filter(b => b.cardUsed === 'vampire');
    if (vampireTeams.length > 0 && vampireSiphonPool > 0) {
      const share = Math.floor(vampireSiphonPool / vampireTeams.length);
      updatedTeams.forEach(t => {
        if (vampireTeams.some(v => v.teamId === t.id)) {
          t.score += share;
        }
      });
    }

    setTeams(updatedTeams);
    setGameState('RESULT');

    // Save answer logs
    const logs: AnswerLog[] = roundResults.map(r => {
      const tObj = teams.find(t => t.id === r.teamId);
      return {
        questionNumber: currentQuestionNum || 1,
        questionText: currentQuestion ? currentQuestion.content : `Câu số ${currentQuestionNum}`,
        correctAnswer: currentQuestion
          ? (currentQuestion.type === 'mcq'
              ? `${String.fromCharCode(65 + Number(currentQuestion.correct))}. ${currentQuestion.options?.[Number(currentQuestion.correct)]}`
              : String(currentQuestion.correct))
          : (manualCorrectText || 'Đúng'),
        teamName: tObj?.name,
        isCorrect: r.isCorrect,
      };
    });

    setAnswerLogs(prev => [...prev, ...logs]);
  };

  const handleNextRound = () => {
    setCurrentQuestion(null);
    setCurrentQuestionNum(null);
    setGameState('WAIT_SPIN');
  };

  return (
    <div className="flex-1 min-h-0 w-full p-4 sm:p-6 bg-gradient-to-b from-purple-950 via-slate-900 to-indigo-950 text-white rounded-2xl shadow-2xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-purple-500/30 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎰</span>
          <div>
            <h2 className="text-xl font-extrabold text-amber-400 flex items-center gap-2">
              <span>Canh Bạc Tri Thức</span>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-normal">
                Betting Arena
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Đặt cược điểm số + Dùng thẻ Siêu Năng Lực (Khiên, Ma Cà Rồng, x2)!
            </p>
          </div>
        </div>

        <button
          onClick={() => onGameEnd(teams, answerLogs)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition shadow"
        >
          Tổng Kết Game
        </button>
      </div>

      {/* Main Content */}
      <div className="my-6 space-y-6">
        {/* Question Area */}
        <div className="bg-slate-900/90 border border-purple-500/40 p-5 rounded-2xl shadow-xl text-center space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 font-mono">
              ĐẤU TRƯỜNG ĐẶT CƯỢC
            </span>

            {gameState === 'WAIT_SPIN' && (
              <button
                onClick={handleSpinQuestion}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 hover:from-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition animate-bounce"
              >
                <Dices className="w-4 h-4" />
                <span>Quay Câu Hỏi & Mở Cược</span>
              </button>
            )}
          </div>

          {currentQuestionNum !== null && (
            <div className="space-y-3">
              {currentQuestion ? (
                <div className="text-left space-y-2">
                  <span className="text-xs font-extrabold text-amber-400 font-mono">
                    CÂU HỎI #{currentQuestionNum}:
                  </span>
                  <p className="text-base font-bold text-white">{currentQuestion.content}</p>

                  {currentQuestion.type === 'mcq' && currentQuestion.options && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {currentQuestion.options.map((opt, oIdx) => (
                        <div key={oIdx} className="text-xs p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
                          <span className="font-bold text-amber-400 mr-1">{String.fromCharCode(65 + oIdx)}.</span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-2xl font-black text-amber-300">
                  CÂU HỎI SỐ #{currentQuestionNum}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Teams Betting Cards */}
        {gameState !== 'WAIT_SPIN' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {teams.map((team, idx) => {
              const betObj = teamBets.find(b => b.teamId === team.id) || {
                teamId: team.id,
                betPoints: 10,
                answerText: '',
                cardUsed: null,
              };

              return (
                <div
                  key={team.id}
                  className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 shadow-xl flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{team.avatar}</span>
                      <span className="font-bold text-xs text-white">{team.name}</span>
                    </div>
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {team.score} điểm
                    </span>
                  </div>

                  {/* Bet Input & Answer */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-0.5">
                        Điểm Cược:
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={team.score}
                        disabled={gameState === 'RESULT'}
                        value={betObj.betPoints}
                        onChange={(e) =>
                          handleUpdateBet(team.id, 'betPoints', Math.max(1, parseInt(e.target.value) || 0))
                        }
                        className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-0.5">
                        Đáp Án Lựa Chọn:
                      </label>
                      <input
                        type="text"
                        disabled={gameState === 'RESULT'}
                        value={betObj.answerText}
                        onChange={(e) => handleUpdateBet(team.id, 'answerText', e.target.value)}
                        placeholder="VD: A, B, C, D..."
                        className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* Special Cards */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Thẻ Thẻ Đặc Biệt:
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          disabled={gameState === 'RESULT'}
                          onClick={() =>
                            handleUpdateBet(team.id, 'cardUsed', betObj.cardUsed === 'shield' ? null : 'shield')
                          }
                          className={`p-1.5 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-0.5 transition ${
                            betObj.cardUsed === 'shield'
                              ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                              : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>Khiên</span>
                        </button>

                        <button
                          type="button"
                          disabled={gameState === 'RESULT'}
                          onClick={() =>
                            handleUpdateBet(team.id, 'cardUsed', betObj.cardUsed === 'vampire' ? null : 'vampire')
                          }
                          className={`p-1.5 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-0.5 transition ${
                            betObj.cardUsed === 'vampire'
                              ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                              : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Hút</span>
                        </button>

                        <button
                          type="button"
                          disabled={gameState === 'RESULT'}
                          onClick={() =>
                            handleUpdateBet(team.id, 'cardUsed', betObj.cardUsed === 'double' ? null : 'double')
                          }
                          className={`p-1.5 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-0.5 transition ${
                            betObj.cardUsed === 'double'
                              ? 'bg-rose-600/30 border-rose-500 text-rose-300'
                              : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>x2</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Controls */}
        {gameState === 'WAIT_BETS' && (
          <div className="text-center pt-2">
            <button
              onClick={handleConfirmBetResults}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-2xl transition animate-pulse"
            >
              Chốt Cược & Kiểm Tra Đáp Án
            </button>
          </div>
        )}

        {gameState === 'RESULT' && (
          <div className="text-center space-y-3 pt-2">
            {currentQuestion && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold max-w-lg mx-auto">
                Đáp án đúng: {currentQuestion.type === 'mcq' ? `${String.fromCharCode(65 + Number(currentQuestion.correct))}. ${currentQuestion.options?.[Number(currentQuestion.correct)]}` : String(currentQuestion.correct)}
              </div>
            )}
            <button
              onClick={handleNextRound}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-2xl transition"
            >
              Tiếp Tục Lượt Tiếp Theo
            </button>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-slate-400 font-medium">
        Đặc quyền: Thẻ Khiên bảo vệ điểm; Thẻ Hút lấy điểm sai của đối thủ; Thẻ x2 gấp đôi phần thưởng!
      </div>
    </div>
  );
};
