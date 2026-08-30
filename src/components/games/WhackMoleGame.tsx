import React, { useState, useEffect } from 'react';
import { GameSetupConfig, Question, AnswerLog, Team } from '../../types';
import { soundFx } from '../../utils/audio';
import { 
  Trophy, Volume2, VolumeX, Maximize, Minimize, Clock, 
  Sparkles, Swords, RefreshCw, Hammer
} from 'lucide-react';
import { useParallelDuel } from './duel/useParallelDuel';
import { ParallelDuelPanel } from './duel/ParallelDuelPanel';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

interface WhackMoleGameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: Team[], answerLogs: AnswerLog[]) => void;
}

export const WhackMoleGame: React.FC<WhackMoleGameProps> = ({ config, questions, onGameEnd }) => {
  const teams = config.teams.slice(0, 2); 
  const teamA = teams[0] || { id: 'a', name: 'Đội Đỏ', avatar: '🐉', color: '#ef4444', score: 0 };
  const teamB = teams[1] || { id: 'b', name: 'Đội Xanh', avatar: '🦅', color: '#3b82f6', score: 0 };

  const [scores, setScores] = useState<number[]>([0, 0]);
  const [moles, setMoles] = useState<{ id: string, teamIdx: 0 | 1, x: number, y: number, state: 'up' | 'whacked' }[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [winnerTeam, setWinnerTeam] = useState<Team | null>(null);

  const MAX_MOLES_TO_WIN = 15;
  const initialSeconds = 300;
  const [timeLeft, setTimeLeft] = useState<number>(initialSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  useEffect(() => {
    if (!isTimerRunning || timeLeft <= 0 || winnerTeam) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, winnerTeam]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTimeUp = () => {
    soundFx.winFanfare();
    const winningIdx = scores[0] >= scores[1] ? 0 : 1;
    const winTeam = winningIdx === 0 ? teamA : teamB;
    setWinnerTeam(winTeam);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const { playerA, playerB, logs, handleTeacherJudge, handleAnswer, handleSmash } = useParallelDuel(
    config, 
    questions, 
    (teamIdx, isCorrect, amount) => {
       if (isCorrect) {
          setMoles(prev => [...prev, {
            id: Math.random().toString(),
            teamIdx: teamIdx as 0 | 1,
            x: Math.random() * 70 + 15,
            y: Math.random() * 70 + 15,
            state: 'whacked'
          }]);
          
          setScores(prev => {
            const next = [...prev];
            next[teamIdx] += 1;
            if (next[teamIdx] >= MAX_MOLES_TO_WIN) {
               soundFx.winFanfare();
               confetti({ particleCount: 200, spread: 100, origin: { x: teamIdx === 0 ? 0.2 : 0.8, y: 0.5 } });
               setWinnerTeam(teamIdx === 0 ? teamA : teamB);
            }
            return next;
          });
       } else {
          setScores(prev => {
            const next = [...prev];
            next[teamIdx] = Math.max(0, next[teamIdx] - 1);
            return next;
          });
       }
    }
  );

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleFinishGame = () => {
    onGameEnd([
      { ...teamA, score: scores[0] * 10 },
      { ...teamB, score: scores[1] * 10 }
    ], logs);
  };

  return (
    <div className="w-full flex-1 min-h-[min(650px,100dvh)] h-full bg-w-bg-alt text-slate-100 flex flex-col font-sans select-none overflow-y-auto">
      
      {/* 1. TOP HEADER BAR */}
      <header className="bg-w-bg-card px-4 py-2.5 flex items-center justify-between border-b border-white/10 z-30 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-green-500 flex items-center justify-center shadow-md">
            <Hammer className="w-5 h-5 text-w-text-main" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-[900] tracking-wide text-w-text-main flex items-center gap-2">
              Trò chơi đập chuột song đấu
            </h1>
            <p className="text-[10px] text-w-text-muted font-semibold hidden md:block">
              {config.topic || 'Đội nào đập đủ 15 chú chuột trước sẽ giành chiến thắng!'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-w-bg-alt px-4 py-1.5 rounded-2xl border border-white/10 shadow-inner">
          <Clock className={`w-4 h-4 ${timeLeft < 60 ? 'text-rose-400 animate-spin' : 'text-amber-600'}`} />
          <span className={`font-mono font-[900] text-base sm:text-lg tracking-wider ${timeLeft < 60 ? 'text-rose-400 animate-pulse' : 'text-w-text-main'}`}>
            {formatTimer(timeLeft)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-white/10 hover:bg-white/20 text-w-text-main rounded-xl transition-all border border-white/10"
            title="Bật/Tắt âm thanh"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-w-text-muted" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 bg-white/10 hover:bg-white/20 text-w-text-main rounded-xl transition-all border border-white/10 hidden sm:flex"
            title="Toàn màn hình"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button 
            onClick={handleFinishGame}
            className="px-3.5 py-1.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-w-text-main font-black text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Trophy className="w-4 h-4" />
            Thoát
          </button>
        </div>
      </header>

      {/* 2. THREE-COLUMN MAIN WORKSPACE */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden bg-w-bg-card p-2 sm:p-3 gap-2 sm:gap-3">
        
        {/* Left Column (Team A / Đỏ) */}
        <div className="col-span-4 lg:col-span-4 h-full rounded-2xl overflow-hidden shadow-xl bg-white border border-slate-200">
          <ParallelDuelPanel 
            playerState={playerA} 
            team={teamA} 
            score={scores[0] * 10}
            isPlayerA={true} 
            config={config} 
            onTeacherJudge={(res) => handleTeacherJudge(true, res)}
            onAnswer={(optIdx) => handleAnswer(true, optIdx)}
            onSmash={() => handleSmash(true)}
          />
        </div>

        {/* Center Arena (Mole Field) */}
        <div className="col-span-4 lg:col-span-4 h-full rounded-2xl overflow-hidden shadow-2xl bg-emerald-950 border-2 border-emerald-700 flex flex-col relative p-4 items-center justify-between">
          
          <div className="w-full flex justify-between items-center text-xs font-black uppercase text-w-primary-dark">
            <span className="text-rose-400">Đỏ: {scores[0]}/{MAX_MOLES_TO_WIN} 🐭</span>
            <span className="text-amber-600">Đấu Đập Chuột</span>
            <span className="text-blue-700">Xanh: {scores[1]}/{MAX_MOLES_TO_WIN} 🐭</span>
          </div>

          <div className="relative w-full flex-1 border-2 border-emerald-700/50 rounded-2xl bg-emerald-900/40 p-4 my-2 overflow-hidden flex">
            {/* Left Zone */}
            <div className="w-1/2 h-full border-r border-emerald-600/40 relative flex items-center justify-center">
              <div className="text-6xl opacity-20 filter grayscale">🐭</div>
            </div>
            {/* Right Zone */}
            <div className="w-1/2 h-full relative flex items-center justify-center">
              <div className="text-6xl opacity-20 filter grayscale">🐭</div>
            </div>

            {/* Whack Explosion Markers */}
            {moles.map(m => (
              <motion.div
                key={m.id}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute text-3xl pointer-events-none z-30"
                style={{
                  left: m.teamIdx === 0 ? `calc(${m.x}% / 2)` : `calc(50% + ${m.x}% / 2)`,
                  top: `${m.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                💥 🔨
              </motion.div>
            ))}
          </div>

          {/* Stepper Progress */}
          <div className="w-full flex items-center gap-2">
            <div className="flex-1 bg-emerald-900 rounded-full h-3 p-0.5 overflow-hidden border border-emerald-700">
              <div 
                className="h-full bg-rose-500 rounded-full transition-all duration-300"
                style={{ width: `${(scores[0] / MAX_MOLES_TO_WIN) * 100}%` }}
              />
            </div>
            <div className="flex-1 bg-emerald-900 rounded-full h-3 p-0.5 overflow-hidden border border-emerald-700">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300 ml-auto"
                style={{ width: `${(scores[1] / MAX_MOLES_TO_WIN) * 100}%` }}
              />
            </div>
          </div>

        </div>

        {/* Right Column (Team B / Xanh) */}
        <div className="col-span-4 lg:col-span-4 h-full rounded-2xl overflow-hidden shadow-xl bg-white border border-slate-200">
          <ParallelDuelPanel 
            playerState={playerB} 
            team={teamB} 
            score={scores[1] * 10}
            isPlayerA={false} 
            config={config} 
            onTeacherJudge={(res) => handleTeacherJudge(false, res)}
            onAnswer={(optIdx) => handleAnswer(false, optIdx)}
            onSmash={() => handleSmash(false)}
          />
        </div>

      </div>

      {/* WINNER MODAL */}
      <AnimatePresence>
        {winnerTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/70 backdrop-blur-sm backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.6, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.6, opacity: 0 }}
              className="bg-w-bg-alt border-2 border-amber-400 rounded-3xl p-8 max-w-lg w-full text-center shadow-[0_0_60px_rgba(251,191,36,0.4)] flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-4xl mb-4 animate-bounce">
                🔨
              </div>

              <div className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                ĐẬP CHUỘT THẦN TỐC!
              </div>

              <h2 className="text-3xl font-[900] text-w-text-main mb-2">
                Chúc mừng {winnerTeam.avatar} {winnerTeam.name}!
              </h2>

              <div className="flex items-center gap-3 w-full mt-6">
                <button
                  onClick={() => {
                    setScores([0, 0]);
                    setWinnerTeam(null);
                    setTimeLeft(initialSeconds);
                  }}
                  className="flex-1 py-3.5 bg-white/10 hover:bg-white/20 text-w-text-main font-bold rounded-2xl transition-all border border-white/10 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Đấu Lại
                </button>

                <button
                  onClick={handleFinishGame}
                  className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-w-text-main font-black rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  Xem Tổng Kết
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
