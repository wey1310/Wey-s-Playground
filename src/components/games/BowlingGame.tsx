import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameSetupConfig, Question } from '../../types';
import { BowlingGameState, BowlingTeamState } from './bowling/bowlingTypes';
import { BowlingEngine } from './bowling/bowlingEngine';
import { BowlingLane } from './bowling/BowlingLane';
import { BowlingScoreboard } from './bowling/BowlingScoreboard';
import { BowlingTeacherPanel } from './bowling/BowlingTeacherPanel';
import { soundFx } from '../../utils/audio';

interface BowlingGameProps {
  config: GameSetupConfig;
  questions: Question[];
  onBackToHome: () => void;
}

export const BowlingGame: React.FC<BowlingGameProps> = ({
  config,
  questions,
  onBackToHome,
}) => {
  const [gameState, setGameState] = useState<BowlingGameState>(() =>
    BowlingEngine.initializeGameState(config)
  );

  const [isMuted, setIsMuted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [canThrow, setCanThrow] = useState(false);
  const [isRolling, setIsRolling] = useState(false);

  const activeTeam = gameState.teams[gameState.currentTeamIndex];
  const currentQuestion = questions[gameState.currentQuestionIndex % (questions.length || 1)];

  const handleToggleMute = () => {
    soundFx.playClick();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundFx.setMuted(nextMuted);
  };

  // 1. Answer question
  const handleAnswer = (optionIdx: number) => {
    if (isAnswerRevealed) return;
    setSelectedAnswer(optionIdx);
    setIsAnswerRevealed(true);

    const isCorrect = optionIdx === Number(currentQuestion.correct);

    if (isCorrect) {
      soundFx.playCorrect();
      // Unlock lane for throwing
      setTimeout(() => {
        setCanThrow(true);
      }, 1000);
    } else {
      soundFx.playWrong();
      // Wrong answer -> 0 pins or missed roll, advance turn
      setTimeout(() => {
        advanceTurn();
      }, 2000);
    }
  };

  // 2. Execute Throw Simulation
  const handleThrowCompleted = (aim: number, power: number, spin: number) => {
    setIsRolling(true);

    // Run deterministic physics calculation taking lane friction/difficulty into account
    const result = BowlingEngine.simulateRoll(
      gameState.pins,
      aim,
      power,
      spin,
      gameState.laneFriction ?? gameState.difficulty ?? 'medium'
    );

    setTimeout(() => {
      setIsRolling(false);
      setCanThrow(false);

      // Update pins
      const updatedPins = gameState.pins.map(p => {
        if (result.knockedPins.includes(p.id)) {
          return { ...p, isKnocked: true };
        }
        return p;
      });

      // Update team score
      const pointsPerPin = config.bowlingPointsPerPin || 10;
      const rollPoints = result.knockedPins.length * pointsPerPin + result.bonusScore;

      let outcome: 'STRIKE' | 'SPARE' | 'GUTTER' | 'NORMAL' = 'NORMAL';
      if (result.isStrike) outcome = 'STRIKE';
      else if (result.isSpare) outcome = 'SPARE';
      else if (result.isGutter) outcome = 'GUTTER';

      if (result.isStrike || result.isSpare) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }

      setGameState(prev => {
        const updatedTeams = [...prev.teams];
        const team = { ...updatedTeams[prev.currentTeamIndex] };
        team.totalPinsKnocked += result.knockedPins.length;
        team.totalScore += rollPoints;
        if (result.isStrike) team.strikeCount += 1;
        if (result.isSpare) team.spareCount += 1;
        updatedTeams[prev.currentTeamIndex] = team;

        return {
          ...prev,
          pins: updatedPins,
          teams: updatedTeams,
          knockedThisRoll: result.knockedPins.length,
          lastRollOutcome: outcome,
        };
      });

      // Advance turn or reset pins for next frame
      setTimeout(() => {
        advanceTurn();
      }, 2500);
    }, 400);
  };

  // 3. Advance Turn
  const advanceTurn = () => {
    setGameState(prev => {
      const nextTeamIdx = (prev.currentTeamIndex + 1) % prev.teams.length;
      let nextFrame = prev.currentFrame;
      if (nextTeamIdx === 0) {
        nextFrame += 1;
      }

      const isGameOver = nextFrame > prev.totalFrames || prev.currentQuestionIndex + 1 >= questions.length;

      let winner: BowlingTeamState | null = null;
      if (isGameOver) {
        winner = [...prev.teams].sort((a, b) => b.totalScore - a.totalScore)[0] || null;
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }

      // Reset pins for new turn/frame
      const freshPins = BowlingEngine.generateStandard10Pins(
        config.bowlingSpecialPins,
        config.bowlingSpecialPinVisibility === 'secret'
      );

      return {
        ...prev,
        status: isGameOver ? 'game_over' : 'lane_ready',
        currentTeamIndex: nextTeamIdx,
        currentFrame: nextFrame,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        pins: freshPins,
        lastRollOutcome: null,
        winnerTeam: winner,
      };
    });

    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    setCanThrow(false);
  };

  const handleTeacherScore = (teamId: string, delta: number) => {
    setGameState(prev => ({
      ...prev,
      teams: prev.teams.map(t =>
        t.id === teamId ? { ...t, totalScore: Math.max(0, t.totalScore + delta) } : t
      ),
    }));
  };

  const handleResetGame = () => {
    setGameState(BowlingEngine.initializeGameState(config));
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    setCanThrow(false);
    setIsRolling(false);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-stone-950 via-zinc-950 to-stone-900 text-zinc-100 flex flex-col justify-between select-none relative overflow-x-hidden">
      {/* Top Navbar */}
      <header className="px-4 py-3 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-w-text-main transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎳</span>
            <div>
              <h1 className="font-black text-sm sm:text-base text-amber-600">
                {config.bowlingGameTitle || 'Bowling Trí Tuệ (Bowling Game)'}
              </h1>
              <span className="text-[11px] text-zinc-400">
                Lượt Khung {gameState.currentFrame}/{gameState.totalFrames} • Câu {gameState.currentQuestionIndex + 1}/{questions.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMute}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-w-text-main transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button
            onClick={handleResetGame}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-w-text-main transition-colors"
            title="Chơi lại ván đấu"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Scoreboard */}
      <BowlingScoreboard
        teams={gameState.teams}
        activeTeamIndex={gameState.currentTeamIndex}
        currentFrame={gameState.currentFrame}
      />

      {/* Main Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center gap-6">
        <BowlingLane
          pins={gameState.pins}
          activeTeam={activeTeam}
          onThrowCompleted={handleThrowCompleted}
          isRolling={isRolling}
          canThrow={canThrow}
          lastOutcome={gameState.lastRollOutcome}
          enableSpin={config.bowlingEnableSpin}
          difficulty={gameState.difficulty}
          laneFriction={gameState.laneFriction}
        />

        {/* Question Panel */}
        {gameState.status !== 'game_over' && !canThrow && currentQuestion && (
          <div className="w-full max-w-4xl mx-auto bg-zinc-900/95 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-black text-amber-600 uppercase tracking-wider">
                  CÂU HỎI MỞ KHÓA LƯỢT NÉM: <strong className="text-w-text-main">{activeTeam?.name}</strong>
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Đúng = Mở Khóa Đường Ném
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-zinc-100 mb-4 leading-relaxed">
              {currentQuestion.content}
            </h3>

            {currentQuestion.options && currentQuestion.options.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion.options.map((option, idx) => {
                  const isChosen = selectedAnswer === idx;
                  const isCorrect = idx === Number(currentQuestion.correct);
                  const showSuccess = isAnswerRevealed && isCorrect;
                  const showFailure = isAnswerRevealed && isChosen && !isCorrect;

                  return (
                    <motion.button
                      key={idx}
                      whileHover={!isAnswerRevealed ? { scale: 1.02 } : undefined}
                      whileTap={!isAnswerRevealed ? { scale: 0.98 } : undefined}
                      disabled={isAnswerRevealed}
                      onClick={() => handleAnswer(idx)}
                      className={`p-3.5 sm:p-4 rounded-2xl border text-left font-bold text-xs sm:text-sm flex items-center justify-between transition-all ${
                        showSuccess
                          ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/20'
                          : showFailure
                          ? 'bg-rose-600/30 border-rose-500 text-rose-300 shadow-lg shadow-rose-500/20'
                          : 'bg-zinc-950 border-zinc-800 hover:border-amber-400 text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-black text-amber-600">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{option}</span>
                      </div>
                      {showSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                      {showFailure && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Teacher Control Floating Panel */}
      <BowlingTeacherPanel
        teams={gameState.teams}
        onReThrow={() => setCanThrow(true)}
        onSkipTurn={advanceTurn}
        onAdjustScore={handleTeacherScore}
        onResetGame={handleResetGame}
      />

      {/* Victory Screen */}
      <AnimatePresence>
        {gameState.status === 'game_over' && gameState.winnerTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border-2 border-amber-400 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl relative overflow-hidden"
            >
              <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl mx-auto mb-4 text-amber-600 shadow-xl shadow-amber-500/30">
                🏆
              </div>

              <span className="text-xs font-black uppercase tracking-widest text-amber-600">
                NHÀ VÔ ĐỊCH BOWLING
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-w-text-main mt-1 mb-4">
                {gameState.winnerTeam.name}
              </h2>

              <div className="grid grid-cols-3 gap-3 my-6 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-black">Tổng Điểm</span>
                  <div className="text-lg font-black text-amber-600 mt-0.5">
                    {gameState.winnerTeam.totalScore}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-black">Số Pin Đổ</span>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">
                    {gameState.winnerTeam.totalPinsKnocked}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-black">Strikes</span>
                  <div className="text-lg font-black text-orange-400 mt-0.5">
                    {gameState.winnerTeam.strikeCount}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleResetGame}
                  className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black rounded-2xl shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Chơi Lại</span>
                </button>
                <button
                  onClick={onBackToHome}
                  className="px-6 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-2xl transition-colors"
                >
                  Về Sảnh
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
