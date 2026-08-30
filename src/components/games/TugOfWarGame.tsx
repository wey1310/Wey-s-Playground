import React, { useState, useEffect, useRef } from 'react';
import { GameSetupConfig, Question, AnswerLog, Team } from '../../types';
import { soundFx } from '../../utils/audio';
import { 
  Trophy, Volume2, VolumeX, Maximize, Minimize, Clock, 
  Flame, Sparkles, Swords, RefreshCw
} from 'lucide-react';
import { useParallelDuel } from './duel/useParallelDuel';
import { ParallelDuelPanel } from './duel/ParallelDuelPanel';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

interface TugOfWarGameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: Team[], answerLogs: AnswerLog[]) => void;
}

export const TugOfWarGame: React.FC<TugOfWarGameProps> = ({ config, questions, onGameEnd }) => {
  const teams = config.teams.slice(0, 2); 
  // In reference photo: Left is Đội Xanh (Blue) or Đội A, Right is Đội Đỏ (Red) or Đội B
  const teamA = teams[0] || { id: 'a', name: 'Đội Đỏ', avatar: '🦁', color: '#ef4444', score: 0 };
  const teamB = teams[1] || { id: 'b', name: 'Đội Xanh', avatar: '🐯', color: '#3b82f6', score: 0 };

  // Rope Position: -10 (Team A win / Left pull) to +10 (Team B win / Right pull), 0 = center
  const [ropePosition, setRopePosition] = useState<number>(0);
  const [scores, setScores] = useState<number[]>([0, 0]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [winnerTeam, setWinnerTeam] = useState<Team | null>(null);

  // 5-minute default countdown timer or from config
  const initialSeconds = 300; // 5:00
  const [timeLeft, setTimeLeft] = useState<number>(initialSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Timer countdown loop
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
    // Determine winner by score or rope position
    const winningIdx = scores[0] > scores[1] ? 0 : (scores[1] > scores[0] ? 1 : (ropePosition < 0 ? 0 : 1));
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
       const pullDir = teamIdx === 0 ? -1 : 1;
       const strength = isCorrect ? 1.5 : -1; // If wrong, lose some ground
       
       setRopePosition(prev => {
          let newPos = prev + (pullDir * strength);
          // Check win condition
          if (newPos <= -9) {
             newPos = -10;
             soundFx.winFanfare();
             confetti({ particleCount: 200, spread: 100, origin: { x: 0.2, y: 0.5 } });
             setWinnerTeam({ ...teamA, score: scores[0] + (isCorrect ? amount : 0) });
          } else if (newPos >= 9) {
             newPos = 10;
             soundFx.winFanfare();
             confetti({ particleCount: 200, spread: 100, origin: { x: 0.8, y: 0.5 } });
             setWinnerTeam({ ...teamB, score: scores[1] + (isCorrect ? amount : 0) });
          }
          return Math.max(-10, Math.min(10, newPos));
       });

       if (isCorrect) {
          setScores(prev => {
            const next = [...prev];
            next[teamIdx] += amount;
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
      { ...teamA, score: scores[0] },
      { ...teamB, score: scores[1] }
    ], logs);
  };

  return (
    <div className="w-full flex-1 min-h-[min(650px,100dvh)] h-full bg-w-bg-alt text-slate-100 flex flex-col font-sans select-none overflow-y-auto">
      
      {/* 1. TOP HEADER BAR (Like in reference photo) */}
      <header className="bg-w-bg-card px-4 py-2.5 flex items-center justify-between border-b border-white/10 z-30 shrink-0">
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center shadow-md">
            <Swords className="w-5 h-5 text-w-text-main" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-[900] tracking-wide text-w-text-main flex items-center gap-2">
              Trò chơi kéo co kiến thức
            </h1>
            <p className="text-[10px] text-w-text-muted font-semibold hidden md:block">
              {config.topic || 'Song đấu kiến thức — Trả lời nhanh để kéo dây chiến thắng!'}
            </p>
          </div>
        </div>

        {/* Center Countdown Clock */}
        <div className="flex items-center gap-2 bg-w-bg-alt px-4 py-1.5 rounded-2xl border border-white/10 shadow-inner">
          <Clock className={`w-4 h-4 ${timeLeft < 60 ? 'text-rose-400 animate-spin' : 'text-amber-600'}`} />
          <span className={`font-mono font-[900] text-base sm:text-lg tracking-wider ${timeLeft < 60 ? 'text-rose-400 animate-pulse' : 'text-w-text-main'}`}>
            {formatTimer(timeLeft)}
          </span>
        </div>

        {/* Action Controls */}
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
        
        {/* Left Column (Team A / Đỏ): 4.25 cols */}
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

        {/* Center Arena (Tug-of-War Stadium): 3.5 to 4 cols */}
        <div className="col-span-4 lg:col-span-4 h-full rounded-2xl overflow-hidden shadow-2xl bg-white border-2 border-slate-200 flex flex-col relative">
          
          {/* Central Referee Stadium Field with Vertical Dotted Centerline */}
          <div className="absolute inset-0 bg-[#fafafa] flex items-center justify-center">
            {/* Field Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />

            {/* Vertical Dotted Center Line (Vạch đích trung tâm) */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 border-r-2 border-dashed border-emerald-500/80 z-0 flex flex-col justify-between py-3 items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
            </div>

            {/* Left/Right Victory Zones markers */}
            <div className="absolute top-3 left-3 text-[10px] font-black uppercase text-rose-500/70 tracking-widest">
              ← Sân Đỏ
            </div>
            <div className="absolute top-3 right-3 text-[10px] font-black uppercase text-blue-500/70 tracking-widest">
              Sân Xanh →
            </div>

            {/* Tension / Warning text when close to victory */}
            {ropePosition <= -6 && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-rose-500 text-w-text-main font-black text-xs px-3 py-1 rounded-full shadow-lg animate-bounce z-20">
                🔥 {teamA.name} SẮP THẮNG!
              </div>
            )}
            {ropePosition >= 6 && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-blue-500 text-w-text-main font-black text-xs px-3 py-1 rounded-full shadow-lg animate-bounce z-20">
                🔥 {teamB.name} SẮP THẮNG!
              </div>
            )}

            {/* Dynamic Tug of War Assembly (Sliding smoothly left/right) */}
            <motion.div 
              className="relative w-full max-w-[540px] px-2 flex items-center justify-center z-10"
              animate={{ x: `${(ropePosition / 10) * 80}px` }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              
              {/* SQUAD A (Left / Red Pullers) */}
              <div className={`flex items-center gap-0.5 -mr-4 z-10 transition-transform ${playerA.lastAnswerIsCorrect ? 'scale-105' : ''}`}>
                {/* 3 Animated Vector Cartoon Pullers (Red Team) */}
                <div className="w-16 sm:w-20 filter drop-shadow-md">
                  <svg viewBox="0 0 100 120" className="w-full h-auto overflow-visible">
                    {/* Body pulling back */}
                    <g transform="rotate(-15 50 100)">
                      {/* Head */}
                      <circle cx="45" cy="25" r="14" fill="#fbcfe8" stroke="#be185d" strokeWidth="2.5" />
                      {/* Hair / Headband */}
                      <path d="M35 15 Q45 8 55 15" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
                      {/* Face */}
                      <circle cx="41" cy="24" r="2.5" fill="#1e293b" />
                      <path d="M40 31 Q45 35 48 31" stroke="#be185d" strokeWidth="2" fill="none" />
                      {/* Red Shirt */}
                      <path d="M34 38 L56 38 L52 75 L38 75 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="2.5" />
                      {/* Red Arms holding rope */}
                      <path d="M38 48 L65 58" stroke="#fbcfe8" strokeWidth="8" strokeLinecap="round" />
                      {/* Pants */}
                      <path d="M38 75 L30 110 L42 110 L45 82 L48 110 L60 110 L52 75 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
                    </g>
                  </svg>
                </div>

                <div className="w-16 sm:w-20 -ml-8 filter drop-shadow-md">
                  <svg viewBox="0 0 100 120" className="w-full h-auto overflow-visible">
                    <g transform="rotate(-20 50 100)">
                      <circle cx="45" cy="25" r="14" fill="#fcd34d" stroke="#b45309" strokeWidth="2.5" />
                      <path d="M35 15 Q45 8 55 15" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
                      <circle cx="41" cy="24" r="2.5" fill="#1e293b" />
                      <path d="M34 38 L56 38 L52 75 L38 75 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="2.5" />
                      <path d="M38 48 L65 58" stroke="#fcd34d" strokeWidth="8" strokeLinecap="round" />
                      <path d="M38 75 L28 110 L40 110 L45 82 L48 110 L60 110 L52 75 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
                    </g>
                  </svg>
                </div>
              </div>

              {/* CENTRAL ROPE WITH RED RIBBON / KNOT */}
              <div className="relative flex-1 h-5 bg-[#d97706] rounded-full border-2 border-[#78350f] shadow-inner mx-1 z-0 flex items-center justify-center">
                {/* Rope Braided Texture */}
                <div 
                  className="absolute inset-0 opacity-40 rounded-full"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #78350f, #78350f 4px, #f59e0b 4px, #f59e0b 8px)'
                  }}
                />

                {/* Central Red Ribbon Knot */}
                <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-rose-600 border-2 border-white shadow-xl flex items-center justify-center z-20">
                  <div className="w-2 h-2 rounded-full bg-white" />
                  {/* Hanging Ribbon Tails */}
                  <div className="absolute top-5 left-1 w-2.5 h-5 bg-rose-600 border border-rose-800 rotate-12 rounded-b" />
                  <div className="absolute top-5 right-1 w-2.5 h-5 bg-rose-600 border border-rose-800 -rotate-12 rounded-b" />
                </div>
              </div>

              {/* SQUAD B (Right / Blue Pullers) */}
              <div className={`flex items-center gap-0.5 -ml-4 z-10 transition-transform ${playerB.lastAnswerIsCorrect ? 'scale-105' : ''}`}>
                <div className="w-16 sm:w-20 filter drop-shadow-md">
                  <svg viewBox="0 0 100 120" className="w-full h-auto overflow-visible">
                    <g transform="scale(-1, 1) translate(-100, 0) rotate(-15 50 100)">
                      <circle cx="45" cy="25" r="14" fill="#fcd34d" stroke="#b45309" strokeWidth="2.5" />
                      <path d="M35 15 Q45 8 55 15" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" />
                      <circle cx="41" cy="24" r="2.5" fill="#1e293b" />
                      <path d="M40 31 Q45 35 48 31" stroke="#b45309" strokeWidth="2" fill="none" />
                      <path d="M34 38 L56 38 L52 75 L38 75 Z" fill="#2563eb" stroke="#1e40af" strokeWidth="2.5" />
                      <path d="M38 48 L65 58" stroke="#fcd34d" strokeWidth="8" strokeLinecap="round" />
                      <path d="M38 75 L30 110 L42 110 L45 82 L48 110 L60 110 L52 75 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
                    </g>
                  </svg>
                </div>

                <div className="w-16 sm:w-20 -ml-8 filter drop-shadow-md">
                  <svg viewBox="0 0 100 120" className="w-full h-auto overflow-visible">
                    <g transform="scale(-1, 1) translate(-100, 0) rotate(-20 50 100)">
                      <circle cx="45" cy="25" r="14" fill="#fed7aa" stroke="#c2410c" strokeWidth="2.5" />
                      <path d="M35 15 Q45 8 55 15" stroke="#3b82f6" strokeWidth="5" strokeLinecap="round" />
                      <circle cx="41" cy="24" r="2.5" fill="#1e293b" />
                      <path d="M34 38 L56 38 L52 75 L38 75 Z" fill="#1d4ed8" stroke="#1e40af" strokeWidth="2.5" />
                      <path d="M38 48 L65 58" stroke="#fed7aa" strokeWidth="8" strokeLinecap="round" />
                      <path d="M38 75 L28 110 L40 110 L45 82 L48 110 L60 110 L52 75 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
                    </g>
                  </svg>
                </div>
              </div>

            </motion.div>

            {/* Bottom Tug Progress Gauge Bar */}
            <div className="absolute bottom-4 left-6 right-6 flex flex-col gap-1 z-20">
              <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                <span className="text-rose-600">Đỏ ({Math.max(0, -Math.round(ropePosition))}m)</span>
                <span>Vạch đích</span>
                <span className="text-blue-600">Xanh ({Math.max(0, Math.round(ropePosition))}m)</span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden p-0.5 relative flex items-center border border-slate-300">
                <div 
                  className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-blue-500 rounded-full transition-all duration-300" 
                  style={{ 
                    width: '100%' 
                  }} 
                />
                {/* Center marker on gauge */}
                <div 
                  className="absolute w-4 h-4 bg-w-bg-alt border-2 border-white rounded-full shadow-md transition-all duration-300 top-1/2 -translate-y-1/2 -ml-2"
                  style={{ left: `calc(50% + ${(ropePosition / 10) * 45}%)` }}
                />
              </div>
            </div>

          </div>

        </div>

        {/* Right Column (Team B / Xanh): 4.25 cols */}
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

      {/* 3. WINNER CELEBRATION MODAL */}
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
                👑
              </div>

              <div className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                CHIẾN THẮNG KÉO CO!
              </div>

              <h2 className="text-3xl font-[900] text-w-text-main mb-2">
                Chúc mừng {winnerTeam.avatar} {winnerTeam.name}!
              </h2>

              <p className="text-w-primary-dark text-sm mb-6">
                Đã xuất sắc kéo sợi dây kiến thức về vạch đích của đội mình!
              </p>

              <div className="flex items-center justify-center gap-6 mb-8 bg-white/5 p-4 rounded-2xl border border-white/10 w-full">
                <div className="text-center">
                  <div className="text-xs font-bold text-rose-400">{teamA.name}</div>
                  <div className="text-2xl font-[900] text-w-text-main">{scores[0]}đ</div>
                </div>
                <div className="text-xl font-black text-slate-500">vs</div>
                <div className="text-center">
                  <div className="text-xs font-bold text-blue-700">{teamB.name}</div>
                  <div className="text-2xl font-[900] text-w-text-main">{scores[1]}đ</div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => {
                    setRopePosition(0);
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
