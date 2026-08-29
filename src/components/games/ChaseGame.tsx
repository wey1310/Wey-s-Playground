import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, RotateCcw, HelpCircle, ArrowLeft, Volume2, VolumeX, Sparkles, Trophy } from 'lucide-react';
import { GameSetupConfig, Question } from '../../types';
import { ChaseGameState } from './chase/chaseTypes';
import { ChaseEngine, ROOM_LOCATIONS } from './chase/chaseEngine';
import { ChaseRoomMap } from './chase/ChaseRoomMap';
import { ChaseScoreboard } from './chase/ChaseScoreboard';
import { soundFx } from '../../utils/audio';
import { MathChemRenderer } from '../../utils/mathChemFormatter';

interface ChaseGameProps {
  config: GameSetupConfig;
  questions: Question[];
  onBackToHome: () => void;
}

export const ChaseGame: React.FC<ChaseGameProps> = ({
  config,
  questions,
  onBackToHome,
}) => {
  const [gameState, setGameState] = useState<ChaseGameState>(() =>
    ChaseEngine.initializeGameState(config, questions)
  );

  const [isMuted, setIsMuted] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [answeredCorrectlyThisTurn, setAnsweredCorrectlyThisTurn] = useState<boolean | null>(null);

  const activeTeam = gameState.teams[gameState.currentTeamIndex] || gameState.teams[0];
  const currentQuestion = gameState.currentQuestion;

  const handleToggleMute = () => {
    soundFx.playClick();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundFx.setMuted(nextMuted);
  };

  const handleAnimationComplete = () => {
    setGameState(prev => {
      if (prev.phase === 'tom_finding') {
        soundFx.playSpin();
        return { ...prev, phase: 'tom_running' };
      }
      if (prev.phase === 'tom_running') {
        return { ...prev, phase: 'tom_arrived' };
      }
      if (prev.phase === 'tom_arrived') {
        const revealedState = ChaseEngine.revealObject(prev);
        if (revealedState.isJerryCaught) {
          soundFx.playCorrect();
        } else {
          soundFx.playWrong();
        }
        return revealedState;
      }
      if (prev.phase === 'reveal_object') {
        return ChaseEngine.resolveCatch(prev);
      }
      if (prev.phase === 'jerry_found' || prev.phase === 'jerry_missed') {
        return { ...prev, phase: 'round_end' };
      }
      return prev;
    });
  };

  // Open QA Modal
  const handleOpenQA = () => {
    soundFx.playClick();
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setIsQuestionModalOpen(true);
  };

  // Submit/Answer question
  const handleAnswerQuestion = (isCorrect: boolean) => {
    setIsAnswerRevealed(true);
    setAnsweredCorrectlyThisTurn(isCorrect);
    if (isCorrect) {
      soundFx.playCorrect();
    } else {
      soundFx.playWrong();
    }

    setTimeout(() => {
      setIsQuestionModalOpen(false);
      setIsAnswerRevealed(false);
      setSelectedOption(null);
      
      if (isCorrect) {
        // Correct answer: Add score, ready to let Tom catch
        setGameState(prev => ({
          ...prev,
          teams: prev.teams.map((t, idx) =>
            idx === prev.currentTeamIndex
              ? {
                  ...t,
                  score: t.score + prev.baseQuestionPoints,
                  streak: t.streak + 1,
                  maxStreak: Math.max(t.maxStreak, t.streak + 1),
                  questionsCorrect: t.questionsCorrect + 1,
                  questionsAnswered: t.questionsAnswered + 1,
                }
              : t
          ),
          logs: [`Đội ${activeTeam.name} trả lời đúng câu hỏi (+${prev.baseQuestionPoints}đ).`, ...prev.logs],
        }));
      } else {
        // Wrong answer: End turn
        setGameState(prev => ChaseEngine.resolveAnswer(prev, false));
      }
    }, 1200);
  };

  // Trigger Tom to catch Jerry
  const handleTriggerTomCatch = (targetId?: number) => {
    soundFx.playSpin();
    setGameState(prev => {
      const chosenTarget = targetId || prev.tomTarget || Math.floor(Math.random() * 9) + 1;
      return {
        ...prev,
        tomTarget: chosenTarget,
        phase: 'tom_finding',
      };
    });
  };

  const handleNextTurn = () => {
    soundFx.playClick();
    setAnsweredCorrectlyThisTurn(null);
    setGameState(prev => ChaseEngine.nextTurn(prev, questions));
  };

  const handleAdjustScore = (teamId: string, delta: number) => {
    setGameState(prev => ({
      ...prev,
      teams: prev.teams.map(t =>
        t.id === teamId ? { ...t, score: Math.max(0, t.score + delta) } : t
      ),
    }));
  };

  const handleResetGame = () => {
    soundFx.playClick();
    setAnsweredCorrectlyThisTurn(null);
    setGameState(ChaseEngine.initializeGameState(config, questions));
  };

  const isHuntingReady = gameState.phase === 'idle' && answeredCorrectlyThisTurn === true;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-3 sm:p-5 flex flex-col justify-between select-none">
      
      {/* Top Header Bar */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-2 mb-2">
        <button
          onClick={onBackToHome}
          className="px-3.5 py-2 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs sm:text-sm font-bold flex items-center gap-1.5 border border-zinc-700 shadow-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Trang Chủ</span>
        </button>

        {/* Center Title Badge */}
        <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-400/30 px-4 py-1.5 rounded-full shadow-inner">
          <span className="text-xl">🐱🧀🐭</span>
          <h1 className="text-sm sm:text-base font-black text-amber-400 uppercase tracking-wide">
            TOM & JERRY: CUỘC RƯỢT ĐUỔI TRONG PHÒNG KHÁCH
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Chơi lại từ đầu"
            onClick={handleResetGame}
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

      {/* Team Scoreboard */}
      <ChaseScoreboard
        teams={gameState.teams}
        currentTeamIndex={gameState.currentTeamIndex}
        onAdjustScore={handleAdjustScore}
      />

      {/* Game Stage (Room Map) */}
      <div className="flex-1 flex flex-col items-center justify-center my-2 relative">
        <ChaseRoomMap 
          gameState={gameState} 
          onAnimationComplete={handleAnimationComplete}
          onSelectTargetLocation={(locId) => {
            if (gameState.phase === 'idle') {
              handleTriggerTomCatch(locId);
            }
          }}
        />

        {/* Round End Overlay */}
        {gameState.phase === 'round_end' && gameState.lastRoundSummary && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-4 border-yellow-400 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-[0_0_60px_rgba(234,179,8,0.4)] text-center"
            >
              <div className="text-5xl mb-2">
                {gameState.lastRoundSummary.isJerryCaught ? '🎉🐭🐱🧀' : '💨🐶'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-yellow-400 mb-3 uppercase tracking-wide">
                {gameState.lastRoundSummary.isJerryCaught ? 'TÓM GỌN CHUỘT JERRY!' : 'KẾT THÚC LƯỢT CHƠI'}
              </h2>
              <p className="text-base sm:text-lg text-zinc-200 mb-6 leading-relaxed">
                {gameState.lastRoundSummary.message}
              </p>
              <button
                onClick={handleNextTurn}
                className="px-8 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 hover:scale-105 transition-transform rounded-2xl font-black text-black shadow-xl text-base sm:text-lg w-full uppercase tracking-wider"
              >
                LƯỢT TIẾP THEO &rarr;
              </button>
            </motion.div>
          </div>
        )}
      </div>

      {/* BOTTOM CONTROL BAR (Format directly matching Image 2) */}
      <div className="w-full max-w-5xl mx-auto mt-2 px-2 py-3 bg-zinc-900/90 border-2 border-purple-900/50 rounded-3xl backdrop-blur-md flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shadow-2xl">
        
        {/* LEFT BUTTON: "CLICK HERE FOR THE QA" (Purple Arrow Banner with Cheese ?) */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleOpenQA}
          disabled={gameState.phase !== 'idle'}
          className={`relative flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl sm:rounded-r-full font-black text-black text-xs sm:text-sm tracking-wider uppercase transition-all shadow-lg overflow-hidden border-2 border-amber-300 ${
            gameState.phase === 'idle'
              ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:shadow-amber-500/50 cursor-pointer animate-pulse'
              : 'bg-zinc-800/80 text-zinc-500 border-zinc-700 cursor-not-allowed'
          }`}
          style={{
            clipPath: 'polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%)',
          }}
        >
          {/* Cheese slice with question mark */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-black flex items-center justify-center font-black text-lg shadow-md shrink-0">
            🧀?
          </div>
          <span className="pr-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            CLICK HERE FOR THE QA
          </span>
        </motion.button>

        {/* CENTER: Jerry Row Counter (Displaying active Jerry mice poses) */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 py-1 px-3 bg-zinc-900/90 backdrop-blur-sm border border-yellow-500/20 rounded-2xl overflow-x-auto">
          {[1, 2, 3, 4, 5].map((idx) => {
            const hasCaught = activeTeam.jerryCatchesCount >= idx;
            return (
              <motion.div
                key={idx}
                animate={{ y: hasCaught ? [0, -4, 0] : 0 }}
                transition={{ repeat: hasCaught ? Infinity : 0, duration: 1.5, delay: idx * 0.2 }}
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl p-1 flex items-center justify-center transition-all ${
                  hasCaught
                    ? 'bg-yellow-400/20 border-2 border-yellow-400 ring-2 ring-yellow-400/30'
                    : 'bg-zinc-800/50 border border-zinc-700 opacity-70'
                }`}
              >
                <img
                  src={`/assets/games/tom_jerry/jerry${((idx - 1) % 6) + 1}.png`}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/assets/games/chase/jerry.webp';
                  }}
                  alt={`Jerry ${idx}`}
                  className="w-full h-full object-contain"
                />
              </motion.div>
            );
          })}
        </div>

        {/* RIGHT BUTTON: "CLICK ON TOM TO CATCH JERRY" (Green Arrow Banner with Tom) */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleTriggerTomCatch()}
          disabled={gameState.phase !== 'idle'}
          className={`relative flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl sm:rounded-l-full font-black text-white text-xs sm:text-sm tracking-wider uppercase transition-all shadow-lg overflow-hidden border-2 border-sky-400/60 ${
            gameState.phase === 'idle'
              ? 'bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:shadow-sky-500/50 cursor-pointer'
              : 'bg-zinc-800/80 text-zinc-500 border-zinc-700 cursor-not-allowed'
          }`}
          style={{
            clipPath: 'polygon(10% 0%, 100% 0%, 100% 100%, 10% 100%, 0% 50%)',
          }}
        >
          <span className="pl-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            CLICK ON TOM TO CATCH JERRY
          </span>
          {/* Tom circle avatar */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 p-0.5 shadow-md shrink-0 flex items-center justify-center overflow-hidden">
            <img
              src="/assets/games/tom_jerry/tomrun.gif"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/assets/games/chase/tomrun.gif';
              }}
              alt="Tom"
              className="w-full h-full object-cover"
            />
          </div>
        </motion.button>

      </div>

      {/* QA MODAL POPUP */}
      <AnimatePresence>
        {isQuestionModalOpen && currentQuestion && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-4 border-purple-500 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-[0_0_50px_rgba(168,85,247,0.4)] relative"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-xs sm:text-sm font-black">
                    Lượt của: {activeTeam.name}
                  </span>
                  <span className="text-xs text-zinc-400 font-bold">
                    (+{gameState.baseQuestionPoints} điểm)
                  </span>
                </div>
                
                {/* Teacher fast verify buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAnswerQuestion(true)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1 shadow-md transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> ĐÚNG
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAnswerQuestion(false)}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1 shadow-md transition-all cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" /> SAI
                  </button>
                </div>
              </div>

              {/* Question Content Box */}
              <div className="bg-zinc-800/90 border border-purple-500/30 rounded-2xl p-5 sm:p-6 mb-6 text-center shadow-inner">
                <div className="text-xl sm:text-2xl font-black text-white leading-relaxed">
                  <MathChemRenderer text={currentQuestion.content} />
                </div>
              </div>

              {/* Options Grid */}
              {currentQuestion.options && currentQuestion.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrectAnswer = idx === Number(currentQuestion.correct);
                    
                    let btnStyle = 'bg-zinc-800/80 border-zinc-700 text-zinc-100 hover:border-purple-400 hover:bg-zinc-700/80';
                    if (isAnswerRevealed) {
                      if (isCorrectAnswer) {
                        btnStyle = 'bg-emerald-950/80 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400';
                      } else if (isSelected) {
                        btnStyle = 'bg-rose-950/80 border-rose-400 text-rose-100 ring-2 ring-rose-400';
                      }
                    } else if (isSelected) {
                      btnStyle = 'bg-purple-900/60 border-purple-400 text-purple-100 ring-2 ring-purple-400';
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (!isAnswerRevealed) {
                            setSelectedOption(idx);
                            handleAnswerQuestion(isCorrectAnswer);
                          }
                        }}
                        className={`p-4 rounded-2xl border-2 text-left text-sm sm:text-base font-bold flex items-center gap-3 transition-all cursor-pointer ${btnStyle}`}
                      >
                        <span className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1 leading-snug"><MathChemRenderer text={option} /></span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Close / Skip button */}
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-bold transition-colors"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

