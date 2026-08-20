import React, { useState } from 'react';
import { GameSetupConfig, Question, AnswerLog, Team, PRESET_THEMES } from '../../types';
import { soundFx } from '../../utils/audio';
import { Dices, Award, Flame } from 'lucide-react';
import { QuestionDisplayModal } from '../QuestionDisplayModal';

interface TugOfWarGameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: Team[], answerLogs: AnswerLog[]) => void;
}

export const TugOfWarGame: React.FC<TugOfWarGameProps> = ({ config, questions, onGameEnd }) => {
  const teams = config.teams.slice(0, 2); // Tug of war is 1v1 battle
  const teamA = teams[0] || { id: 'a', name: 'Đội A', avatar: '🦁', color: '#ef4444', score: 0 };
  const teamB = teams[1] || { id: 'b', name: 'Đội B', avatar: '🐯', color: '#3b82f6', score: 0 };

  // Rope Position: -5 (Team A Win) to +5 (Team B Win), 0 = center
  const [ropePosition, setRopePosition] = useState<number>(0);
  const [scores, setScores] = useState<number[]>([0, 0]);
  const [currentTurnTeamIdx, setCurrentTurnTeamIdx] = useState<number>(0);
  const [usedQuestionIndices, setUsedQuestionIndices] = useState<number[]>([]);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);

  // Turn state
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionNum, setCurrentQuestionNum] = useState<number | null>(null);
  const [gameState, setGameState] = useState<'WAIT_SPIN' | 'WAIT_JUDGE' | 'RESULT'>('WAIT_SPIN');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [manualCorrectText, setManualCorrectText] = useState<string>('');

  const themeInfo = PRESET_THEMES.find(t => t.id === config.theme) || PRESET_THEMES[0];
  const currentTeam = currentTurnTeamIdx === 0 ? teamA : teamB;

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
    setIsAnswerCorrect(isCorrect);

    let nextScores = [...scores];
    let newPos = ropePosition;

    if (isCorrect) {
      soundFx.correct();
      // Pull rope towards current team
      const pullDir = currentTurnTeamIdx === 0 ? -1 : 1;
      newPos = Math.max(-5, Math.min(5, ropePosition + pullDir));
      setRopePosition(newPos);

      // Award points
      nextScores[currentTurnTeamIdx] += (config.pointsPerCorrect || 10);
      setScores(nextScores);

      // Check instant knockout win (-5 or +5)
      if (newPos === -5 || newPos === 5) {
        soundFx.winFanfare();
      }
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
    const newLogs = [...answerLogs, log];
    setAnswerLogs(newLogs);

    // Close turn
    setCurrentQuestion(null);
    setCurrentQuestionNum(null);
    setCurrentTurnTeamIdx((currentTurnTeamIdx + 1) % 2);
    setGameState('WAIT_SPIN');

    const currentTeamsWithScore = [
      { ...teamA, score: nextScores[0] },
      { ...teamB, score: nextScores[1] },
    ];

    if (Math.abs(newPos) >= 5) {
      setTimeout(() => onGameEnd(currentTeamsWithScore, newLogs), 500);
    }
  };

  const handleConfirmTurnClose = () => {
    setCurrentQuestion(null);
    setCurrentQuestionNum(null);
    setCurrentTurnTeamIdx((currentTurnTeamIdx + 1) % 2);
    setGameState('WAIT_SPIN');

    const currentTeamsWithScore = [
      { ...teamA, score: scores[0] },
      { ...teamB, score: scores[1] },
    ];

    if (Math.abs(ropePosition) >= 5) {
      setTimeout(() => onGameEnd(currentTeamsWithScore, answerLogs), 500);
    }
  };

  return (
    <div className={`flex-1 min-h-0 w-full p-4 sm:p-6 bg-gradient-to-b ${themeInfo.bgClass} rounded-2xl shadow-2xl flex flex-col justify-between border-4 border-emerald-800/30`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/90 backdrop-blur border-2 border-emerald-200 p-4 rounded-2xl shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🪢</span>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <span>Đấu Trường Kéo Co Tri Thức</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                1 vs 1 Tug Battle
              </span>
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Trả lời đúng câu hỏi ➔ Kéo dây về phía đội mình ➔ Kéo chạm mốc để Knockout đối thủ!
            </p>
          </div>
        </div>

        {/* Teams Dashboard */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl border-2 border-rose-300 bg-rose-50 text-rose-900 flex items-center gap-2 font-bold text-xs shadow-sm">
            <span className="text-lg">{teamA.avatar}</span>
            <div>
              <div className="text-rose-950 font-black">{teamA.name}</div>
              <div className="text-rose-700 font-mono">{scores[0]}đ</div>
            </div>
          </div>

          <div className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-1 rounded-lg border border-amber-300">VS</div>

          <div className="px-3 py-1.5 rounded-xl border-2 border-sky-300 bg-sky-50 text-sky-900 flex items-center gap-2 font-bold text-xs shadow-sm">
            <span className="text-lg">{teamB.avatar}</span>
            <div>
              <div className="text-sky-950 font-black">{teamB.name}</div>
              <div className="text-sky-700 font-mono">{scores[1]}đ</div>
            </div>
          </div>
        </div>

        <button
          onClick={() =>
            onGameEnd(
              [
                { ...teamA, score: scores[0] },
                { ...teamB, score: scores[1] },
              ],
              answerLogs
            )
          }
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition shadow"
        >
          Tổng Kết Game
        </button>
      </div>

      {/* Main Tug of War Arena */}
      <div className="my-6 space-y-6">
        {/* Rope Visualization Stage */}
        <div className="p-6 sm:p-8 bg-white/95 border-4 border-amber-800/30 rounded-3xl shadow-2xl space-y-6">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="text-4xl animate-bounce">{teamA.avatar}</span>
              <div className="font-black text-rose-700 text-base">{teamA.name}</div>
            </div>

            <div className="text-center bg-amber-50 px-4 py-1.5 rounded-2xl border border-amber-200">
              <div className="text-xs font-mono font-bold text-amber-900">VỊ TRÍ NÚT KÉO</div>
              <div className="text-xl font-black font-mono text-slate-800">
                {ropePosition === 0 ? 'CÂN BẰNG (0)' : ropePosition < 0 ? `<- ${teamA.name} (+${Math.abs(ropePosition)})` : `-> ${teamB.name} (+${ropePosition})`}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="font-black text-sky-700 text-base">{teamB.name}</div>
              <span className="text-4xl animate-bounce">{teamB.avatar}</span>
            </div>
          </div>

          {/* Rope Line & Marker */}
          <div className="relative py-4 my-8 mx-12">
            {/* Left Puller */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-20 w-32 h-32 z-10">
              <img 
                src="/assets/games/tugofwar/redteam.png" 
                alt="Red Team Puller" 
                className="w-full h-full object-contain filter drop-shadow-xl hover:scale-110 transition-transform" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/games/tugofwar/redteam.jpg';
                }}
              />
            </div>

            {/* Right Puller */}
            <div className="absolute top-1/2 -translate-y-1/2 -right-20 w-32 h-32 z-10">
              <img 
                src="/assets/games/tugofwar/blueteam.png" 
                alt="Blue Team Puller" 
                className="w-full h-full object-contain filter drop-shadow-xl hover:scale-110 transition-transform" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/games/tugofwar/blueteam.jpg';
                }}
              />
            </div>

            {/* Background Rope Bar */}
            <div className="h-5 bg-gradient-to-r from-rose-500 via-amber-400 to-sky-500 rounded-full shadow-inner relative overflow-hidden mx-4 border-2 border-amber-900/40">
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_50%,rgba(255,255,255,0.3)_50%)] bg-[length:20px_100%]" />
            </div>

            {/* Rope Red Ribbon Knot Marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -ml-5 w-10 h-10 bg-amber-400 border-4 border-slate-900 rounded-full flex items-center justify-center shadow-2xl transition-all duration-700 ease-out z-20"
              style={{
                left: `calc(${((ropePosition + 5) / 10) * 100}% + ${((ropePosition + 5) / 10) === 0 ? '16px' : ((ropePosition + 5) / 10) === 1 ? '-16px' : '0px'})`,
              }}
            >
              <Flame className="w-5 h-5 text-amber-950 animate-pulse" />
            </div>

            {/* Scale Notches */}
            <div className="flex justify-between px-6 mt-4 text-[10px] font-mono font-bold text-slate-600 relative">
              <span className="text-rose-600 font-extrabold">-5 (WIN A)</span>
              <span>-4</span>
              <span>-3</span>
              <span>-2</span>
              <span>-1</span>
              <span className="text-amber-800 font-extrabold bg-amber-100 px-1 rounded">0</span>
              <span>+1</span>
              <span>+2</span>
              <span>+3</span>
              <span>+4</span>
              <span className="text-sky-600 font-extrabold">+5 (WIN B)</span>
            </div>
          </div>
        </div>

        {/* Turn Control & Question Panel */}
        <div className="bg-white/95 border-2 border-emerald-300 p-4 rounded-2xl shadow-lg flex items-center justify-between">
          <span className="text-xs font-black text-emerald-950 font-mono">
            🎯 LƯỢT KÉO CỦA: {currentTeam.avatar} {currentTeam.name}
          </span>

          {gameState === 'WAIT_SPIN' && (
            <button
              onClick={handleSpinQuestion}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#6B8E5C] hover:bg-[#58784B] border border-[#537346] text-white font-black text-xs rounded-xl shadow-md transition transform hover:scale-105"
            >
              <Dices className="w-4 h-4 text-amber-200" />
              <span>Quay Lựa Chọn Cầu Kéo Co</span>
            </button>
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
          titlePrefix="🪢 KÉO CO -"
          onAnswerSubmit={(isCorrect, correctAnswerText) => {
            handleJudgeAnswer(isCorrect, correctAnswerText);
          }}
        />
      </div>

      <div className="text-center text-xs text-slate-400 font-medium">
        Kéo dây vạch đỏ qua mốc -5 hoặc +5 để giành chiến thắng đoạt cúp vô địch!
      </div>
    </div>
  );
};
