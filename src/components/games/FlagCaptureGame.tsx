import React, { useState, useEffect } from 'react';
import { GameSetupConfig, Question, AnswerLog, Team } from '../../types';
import { soundFx } from '../../utils/audio';
import { 
  Trophy, Volume2, VolumeX, Maximize, Minimize, Clock, 
  Sparkles, Swords, RefreshCw, Flag
} from 'lucide-react';
import { useParallelDuel } from './duel/useParallelDuel';
import { ParallelDuelPanel } from './duel/ParallelDuelPanel';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

interface FlagCaptureGameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: Team[], answerLogs: AnswerLog[]) => void;
}

export const FlagCaptureGame: React.FC<FlagCaptureGameProps> = ({ config, questions, onGameEnd }) => {
  const teams = config.teams.slice(0, 2); 
  const teamA = teams[0] || { id: 'a', name: 'Đội Đỏ', avatar: '🐉', color: '#ef4444', score: 0 };
  const teamB = teams[1] || { id: 'b', name: 'Đội Xanh', avatar: '🦅', color: '#3b82f6', score: 0 };

  // Distance: 0 (Start) to 10 (Capture Flag in Center)
  const [distanceA, setDistanceA] = useState<number>(0);
  const [distanceB, setDistanceB] = useState<number>(0);
  const [scores, setScores] = useState<number[]>([0, 0]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [winnerTeam, setWinnerTeam] = useState<Team | null>(null);

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
    const winningIdx = scores[0] > scores[1] ? 0 : (scores[1] > scores[0] ? 1 : (distanceA > distanceB ? 0 : 1));
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
          if (teamIdx === 0) {
             setDistanceA(prev => {
                const next = prev + 1;
                if (next >= 10) {
                   soundFx.winFanfare();
                   confetti({ particleCount: 200, spread: 100, origin: { x: 0.2, y: 0.5 } });
                   setWinnerTeam({ ...teamA, score: scores[0] + amount });
                }
                return Math.min(10, next);
             });
          } else {
             setDistanceB(prev => {
                const next = prev + 1;
                if (next >= 10) {
                   soundFx.winFanfare();
                   confetti({ particleCount: 200, spread: 100, origin: { x: 0.8, y: 0.5 } });
                   setWinnerTeam({ ...teamB, score: scores[1] + amount });
                }
                return Math.min(10, next);
             });
          }
          setScores(prev => {
            const next = [...prev];
            next[teamIdx] += amount;
            return next;
          });
       } else {
          // Wrong answer penalty: step back
          if (teamIdx === 0) setDistanceA(p => Math.max(0, p - 1));
          else setDistanceB(p => Math.max(0, p - 1));
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
      { ...teamA, score: scores[0] },
      { ...teamB, score: scores[1] }
    ], logs);
  };

  return (
    <div className="w-full h-[100dvh] bg-slate-900 text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      
      {/* 1. TOP HEADER BAR */}
      <header className="bg-slate-950/90 px-4 py-2.5 flex items-center justify-between border-b border-white/10 z-30 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center shadow-md">
            <Flag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-[900] tracking-wide text-white flex items-center gap-2">
              Trò chơi cướp cờ song đấu
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold hidden md:block">
              {config.topic || 'Đội nào tiến đến lá cờ trung tâm trước sẽ giành chiến thắng!'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 px-4 py-1.5 rounded-2xl border border-white/10 shadow-inner">
          <Clock className={`w-4 h-4 ${timeLeft < 60 ? 'text-rose-400 animate-spin' : 'text-amber-400'}`} />
          <span className={`font-mono font-[900] text-base sm:text-lg tracking-wider ${timeLeft < 60 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
            {formatTimer(timeLeft)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10"
            title="Bật/Tắt âm thanh"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 hidden sm:flex"
            title="Toàn màn hình"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button 
            onClick={handleFinishGame}
            className="px-3.5 py-1.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Trophy className="w-4 h-4" />
            Thoát
          </button>
        </div>
      </header>

      {/* 2. THREE-COLUMN MAIN WORKSPACE */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden bg-slate-950 p-2 sm:p-3 gap-2 sm:gap-3">
        
        {/* Left Column (Team A / Đỏ) */}
        <div className="col-span-4 lg:col-span-4 h-full rounded-2xl overflow-hidden shadow-xl bg-white border border-slate-200">
          <ParallelDuelPanel 
            playerState={playerA} 
            team={teamA} 
            score={scores[0]}
            isPlayerA={true} 
            config={config} 
            onTeacherJudge={(res) => handleTeacherJudge(true, res)}
            onAnswer={(optIdx) => handleAnswer(true, optIdx)}
            onSmash={() => handleSmash(true)}
          />
        </div>

        {/* Center Arena (Capture Flag Stadium) */}
        <div className="col-span-4 lg:col-span-4 h-full rounded-2xl overflow-hidden shadow-2xl bg-slate-900 border-2 border-slate-700 flex flex-col relative p-4 items-center justify-between">
          
          <div className="w-full flex justify-between items-center text-xs font-black uppercase text-slate-400">
            <span className="text-rose-400">{distanceA}/10 bước</span>
            <span className="text-amber-400">Đua Cướp Cờ</span>
            <span className="text-blue-400">{distanceB}/10 bước</span>
          </div>

          {/* Running Track & Center Flag */}
          <div className="relative w-full max-w-sm aspect-square border-4 border-slate-700 rounded-full flex items-center justify-center bg-slate-950/70 shadow-2xl my-auto">
            
            {/* Center Flag */}
            <div className="w-20 h-20 bg-amber-500/20 border-2 border-amber-400 rounded-full flex flex-col items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.3)] z-20 animate-pulse">
              <Flag className="w-8 h-8 text-amber-400" />
              <span className="text-[9px] font-black text-amber-300">ĐÍCH</span>
            </div>

            {/* Runner A (Red, moving left to center) */}
            <motion.div 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-gradient-to-tr from-rose-600 to-red-500 border-2 border-white rounded-2xl flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(244,63,94,0.6)] z-30"
              animate={{ left: `calc(12px + ${(distanceA / 10) * 35}%)` }}
              transition={{ type: 'spring', stiffness: 150 }}
            >
              {teamA.avatar}
            </motion.div>

            {/* Runner B (Blue, moving right to center) */}
            <motion.div 
              className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-500 border-2 border-white rounded-2xl flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(59,130,246,0.6)] z-30"
              animate={{ right: `calc(12px + ${(distanceB / 10) * 35}%)` }}
              transition={{ type: 'spring', stiffness: 150 }}
            >
              {teamB.avatar}
            </motion.div>

          </div>

          {/* Stepper indicators */}
          <div className="w-full flex items-center gap-2">
            <div className="flex-1 bg-slate-800 rounded-full h-3 p-0.5 overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-rose-500 rounded-full transition-all duration-300"
                style={{ width: `${(distanceA / 10) * 100}%` }}
              />
            </div>
            <div className="flex-1 bg-slate-800 rounded-full h-3 p-0.5 overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300 ml-auto"
                style={{ width: `${(distanceB / 10) * 100}%` }}
              />
            </div>
          </div>

        </div>

        {/* Right Column (Team B / Xanh) */}
        <div className="col-span-4 lg:col-span-4 h-full rounded-2xl overflow-hidden shadow-xl bg-white border border-slate-200">
          <ParallelDuelPanel 
            playerState={playerB} 
            team={teamB} 
            score={scores[1]}
            isPlayerA={false} 
            config={config} 
            onTeacherJudge={(res) => handleTeacherJudge(false, res)}
            onAnswer={(optIdx) => handleAnswer(false, optIdx)}
            onSmash={() => handleSmash(false)}
          />
        </div>

      </div>

      {/* WINNER CELEBRATION MODAL */}
      <AnimatePresence>
        {winnerTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.6, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.6, opacity: 0 }}
              className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-8 max-w-lg w-full text-center shadow-[0_0_60px_rgba(251,191,36,0.4)] flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-4xl mb-4 animate-bounce">
                🚩
              </div>

              <div className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                CƯỚP CỜ THÀNH CÔNG!
              </div>

              <h2 className="text-3xl font-[900] text-white mb-2">
                Chúc mừng {winnerTeam.avatar} {winnerTeam.name}!
              </h2>

              <p className="text-slate-300 text-sm mb-6">
                Đã bứt tốc xuất sắc và chạm tay vào lá cờ vinh quang!
              </p>

              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => {
                    setDistanceA(0);
                    setDistanceB(0);
                    setWinnerTeam(null);
                    setTimeLeft(initialSeconds);
                  }}
                  className="flex-1 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all border border-white/10 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Đấu Lại
                </button>

                <button
                  onClick={handleFinishGame}
                  className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-black rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
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
