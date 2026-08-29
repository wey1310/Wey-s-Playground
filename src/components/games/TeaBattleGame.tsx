import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  HelpCircle,
  Trophy,
  CheckCircle2,
  XCircle,
  Sparkles,
  Flame,
  Award,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameSetupConfig, Question } from '../../types';
import { TeaBattleGameState, BattleTeamState, TeaCup } from './tea_battle/teaBattleTypes';
import { TeaBattleEngine } from './tea_battle/teaBattleEngine';
import { MathChemRenderer } from '../../utils/mathChemFormatter';
import { TeaCupGrid } from './tea_battle/TeaCupGrid';
import { TeaBattleScoreboard } from './tea_battle/TeaBattleScoreboard';
import { TeaBattleSequenceModal } from './tea_battle/TeaBattleSequenceModal';
import { TeaBattleInstructionsModal } from './tea_battle/TeaBattleInstructionsModal';
import { TeaBattleTeacherPanel } from './tea_battle/TeaBattleTeacherPanel';
import { soundFx } from '../../utils/audio';

interface TeaBattleGameProps {
  config: GameSetupConfig;
  questions: Question[];
  onBackToHome: () => void;
}

export const TeaBattleGame: React.FC<TeaBattleGameProps> = ({
  config,
  questions,
  onBackToHome,
}) => {
  const [gameState, setGameState] = useState<TeaBattleGameState>(() =>
    TeaBattleEngine.initializeGameState(config, questions)
  );

  const [isMuted, setIsMuted] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [lastWinOutcome, setLastWinOutcome] = useState<{
    isOpen: boolean;
    isWon: boolean;
    cup: TeaCup | null;
    team: BattleTeamState | null;
    pointsDelta: number;
  }>({
    isOpen: false,
    isWon: true,
    cup: null,
    team: null,
    pointsDelta: 0,
  });

  const activeTeam = gameState.teams[gameState.currentTeamIndex] || gameState.teams[0];
  const currentQuestion = gameState.currentQuestion;

  const handleToggleMute = () => {
    soundFx.playClick();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundFx.setMuted(nextMuted);
  };

  // 1. Pick a Tea Cup
  const handleSelectCup = (cupId: number) => {
    soundFx.playClick();
    setGameState(prev => TeaBattleEngine.selectCup(prev, cupId, questions));
  };

  // 2. Answer Question (or Teacher overrides result)
  const handleAnswer = (optionIdx: number) => {
    if (gameState.isAnswerRevealed || !currentQuestion) return;

    const isCorrect = optionIdx === Number(currentQuestion.correct);
    resolveQuestionOutcome(isCorrect);
  };

  const resolveQuestionOutcome = (isCorrect: boolean) => {
    if (isCorrect) {
      soundFx.playCorrect();
    } else {
      soundFx.playWrong();
    }

    const { nextState, isWon, pointsDelta } = TeaBattleEngine.resolveAnswer(gameState, isCorrect);
    setGameState(nextState);

    // Open Win / Lose Video Modal
    setLastWinOutcome({
      isOpen: true,
      isWon,
      cup: gameState.selectedCup,
      team: activeTeam,
      pointsDelta,
    });
  };

  // 3. Continue from Video Modal to next turn
  const handleContinueAfterVideo = () => {
    setLastWinOutcome(prev => ({ ...prev, isOpen: false }));
    soundFx.playClick();
    setGameState(prev => TeaBattleEngine.nextTurn(prev));
  };

  // Teacher actions
  const handleAdjustScore = (teamId: string, delta: number) => {
    setGameState(prev => ({
      ...prev,
      teams: prev.teams.map(t =>
        t.id === teamId ? { ...t, score: Math.max(0, t.score + delta) } : t
      ),
    }));
  };

  const handleSetTurn = (teamIndex: number) => {
    setGameState(prev => ({
      ...prev,
      currentTeamIndex: teamIndex,
    }));
  };

  const handleResetAllCups = () => {
    setGameState(prev => TeaBattleEngine.initializeGameState(config, questions));
  };

  const handleShuffleQuestions = () => {
    soundFx.playSpin();
    setGameState(prev => {
      const shuffled = [...prev.teaCups].map((cup, idx) => ({
        ...cup,
        questionIndex: Math.floor(Math.random() * (questions.length || 1)),
      }));
      return { ...prev, teaCups: shuffled };
    });
  };

  return (
    <div 
      className="relative min-h-screen text-w-text-main p-3 sm:p-6 flex flex-col justify-between select-none"
      style={{ backgroundImage: 'url(/assets/games/tea_battle/background.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-0"></div>
      
      {/* Container wrapper so children render above background */}
      <div className="relative z-10 flex flex-col h-full justify-between flex-1">
        
      {/* Top Navigation Bar */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-2 mb-3">
        <button
          type="button"
          onClick={onBackToHome}
          className="px-3.5 py-2 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs sm:text-sm font-bold flex items-center gap-1.5 border border-zinc-700 shadow-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Trang Chủ</span>
        </button>

        {/* Center Title Badge */}
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-400 px-4 py-1.5 rounded-full shadow-inner">
          <span className="text-xl">🍵</span>
          <h1 className="text-sm sm:text-base font-black text-amber-600 uppercase tracking-wide">
            CUỘC CHIẾN TRÀ VỚI KANAO
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Xem hướng dẫn"
            onClick={() => setIsInstructionsOpen(true)}
            className="p-2 rounded-2xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/40 text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Hướng Dẫn</span>
          </button>

          <button
            type="button"
            title="Làm mới bàn trà"
            onClick={handleResetAllCups}
            className="p-2 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            onClick={handleToggleMute}
            className={`p-2 rounded-2xl border transition-colors ${
              isMuted
                ? 'bg-rose-900/60 text-rose-300 border-rose-700'
                : 'bg-zinc-800/80 text-zinc-200 border-zinc-700'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Team Scoreboard Banner */}
      <TeaBattleScoreboard
        teams={gameState.teams}
        currentTeamIndex={gameState.currentTeamIndex}
        onAdjustScore={handleAdjustScore}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center my-2">
        {gameState.status === 'cup_select' && (
          <TeaCupGrid
            teaCups={gameState.teaCups}
            selectedCup={gameState.selectedCup}
            activeTeam={activeTeam}
            onSelectCup={handleSelectCup}
          />
        )}

        {/* Question Modal (When a tea cup is selected) */}
        {gameState.status === 'question_open' && currentQuestion && gameState.selectedCup && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-4xl bg-gradient-to-b from-[#2a3c20] to-[#121c0e] border-4 border-[#8b5a2b] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Header with Selected Cup Badge */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#8b5a2b]/60">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-black font-black text-xl flex items-center justify-center shadow-lg border-2 border-amber-200">
                  #{gameState.selectedCup.id}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-amber-200 uppercase">
                    CỐC TRÀ SỐ {gameState.selectedCup.id}
                  </h3>
                  <p className="text-xs text-amber-100/70">
                    Đội đang khiêu chiến: <span className="font-bold text-amber-600">{activeTeam.name}</span> (+{gameState.selectedCup.points} điểm)
                  </p>
                </div>
              </div>

              {/* Quick Teacher Right/Wrong buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => resolveQuestionOutcome(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-w-text-main text-xs font-black flex items-center gap-1 shadow"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>XÁC NHẬN ĐÚNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => resolveQuestionOutcome(false)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-w-text-main text-xs font-black flex items-center gap-1 shadow"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>XÁC NHẬN SAI</span>
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="bg-white/70 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-5 mb-6 text-center">
              <h2 className="text-lg sm:text-2xl font-black text-w-text-main leading-relaxed">
                <MathChemRenderer text={currentQuestion.content} />
              </h2>
            </div>

            {/* Multiple Choice Options (if available) */}
            {currentQuestion.options && currentQuestion.options.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {currentQuestion.options.map((option, optIdx) => {
                  const label = String.fromCharCode(65 + optIdx);
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleAnswer(optIdx)}
                      className="p-4 rounded-2xl bg-zinc-900/80 hover:bg-amber-950/60 border-2 border-zinc-700 hover:border-amber-400 text-left text-sm sm:text-base font-bold text-zinc-100 transition-all flex items-center gap-3 active:scale-98 shadow-md"
                    >
                      <span className="w-8 h-8 rounded-xl bg-amber-500 text-black font-black text-sm flex items-center justify-center shrink-0">
                        {label}
                      </span>
                      <span className="flex-1"><MathChemRenderer text={option} /></span>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Game Over Screen */}
        {gameState.status === 'game_over' && gameState.winnerTeam && (
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl bg-gradient-to-b from-[#2e1c4e] to-[#10071c] border-4 border-amber-400 rounded-3xl p-8 text-center shadow-2xl"
          >
            <span className="text-6xl mb-3 block">👑🏆🎉</span>
            <h2 className="text-3xl sm:text-4xl font-black text-amber-600 uppercase tracking-wide mb-2">
              QUÁN QUÂN ĐẠI CHIẾN TRÀ ĐẠO!
            </h2>
            <p className="text-lg text-emerald-300 font-black mb-6">
              Chúc mừng {gameState.winnerTeam.name} đã xuất sắc chiến thắng với {gameState.winnerTeam.score} điểm!
            </p>

            <button
              type="button"
              onClick={handleResetAllCups}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 font-black text-black text-lg shadow-xl hover:scale-105 transition-transform"
            >
              CHƠI LẠI VÁN MỚI
            </button>
          </motion.div>
        )}
      </div>

      {/* Teacher Bottom Control Panel */}
      <TeaBattleTeacherPanel
        teams={gameState.teams}
        currentTeamIndex={gameState.currentTeamIndex}
        teaCups={gameState.teaCups}
        onAdjustScore={handleAdjustScore}
        onSetTurn={handleSetTurn}
        onResetAllCups={handleResetAllCups}
        onShuffleQuestions={handleShuffleQuestions}
      />

      {/* Win / Lose Action Sequence Modal */}
      {lastWinOutcome.cup && lastWinOutcome.team && (
        <TeaBattleSequenceModal
          isOpen={lastWinOutcome.isOpen}
          isWon={lastWinOutcome.isWon}
          cup={lastWinOutcome.cup}
          team={lastWinOutcome.team}
          pointsDelta={lastWinOutcome.pointsDelta}
          onContinue={handleContinueAfterVideo}
        />
      )}

      {/* Instructions Modal */}
      <TeaBattleInstructionsModal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
      />
      </div>
    </div>
  );
};
