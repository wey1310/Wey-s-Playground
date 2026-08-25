import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Flame, Target, Zap, RotateCcw, Compass, ArrowLeftRight, Activity, Gauge } from 'lucide-react';
import { PinState, BallState, BowlingTeamState, TrajectoryPoint, BowlingDifficulty } from './bowlingTypes';
import { BowlingEngine } from './bowlingEngine';
import { soundFx } from '../../../utils/audio';

interface BowlingLaneProps {
  pins: PinState[];
  activeTeam: BowlingTeamState;
  onThrowCompleted: (aim: number, power: number, spin: number) => void;
  isRolling: boolean;
  canThrow: boolean;
  lastOutcome: string | null;
  enableSpin?: boolean;
  difficulty?: BowlingDifficulty;
  laneFriction?: number;
}

export const BowlingLane: React.FC<BowlingLaneProps> = ({
  pins,
  activeTeam,
  onThrowCompleted,
  isRolling,
  canThrow,
  lastOutcome,
  enableSpin = true,
  difficulty = 'medium',
  laneFriction,
}) => {
  const [aimX, setAimX] = useState<number>(0); // -60 to 60
  const [power, setPower] = useState<number>(75);
  const [spin, setSpin] = useState<number>(0); // -4 to +4
  const [isPowerOscillating, setIsPowerOscillating] = useState<boolean>(true);
  const [ballAnimationState, setBallAnimationState] = useState<'idle' | 'rolling' | 'hit'>('idle');
  const [activeTrajectory, setActiveTrajectory] = useState<TrajectoryPoint[]>([]);

  // Friction details from engine based on difficulty
  const frictionInfo = BowlingEngine.getFrictionByDifficulty(difficulty);
  const currentFriction = laneFriction ?? frictionInfo.friction;

  // Oscillating power meter loop
  useEffect(() => {
    if (!canThrow || isRolling || !isPowerOscillating) return;
    let direction = 1;
    const interval = setInterval(() => {
      setPower(prev => {
        if (prev >= 98) direction = -1;
        if (prev <= 35) direction = 1;
        return prev + direction * 3;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [canThrow, isRolling, isPowerOscillating]);

  // Compute live trajectory preview using difficulty/friction
  const liveTrajectory = React.useMemo(() => {
    return BowlingEngine.calculateBallTrajectory(aimX, power, spin, 16, currentFriction);
  }, [aimX, power, spin, currentFriction]);

  const handleExecuteThrow = () => {
    if (!canThrow || isRolling) return;
    setIsPowerOscillating(false);
    
    // Generate precise trajectory from bowling engine with friction parameter
    const fullTrajectory = BowlingEngine.calculateBallTrajectory(aimX, power, spin, 24, currentFriction);
    setActiveTrajectory(fullTrajectory);
    setBallAnimationState('rolling');
    soundFx.playSpin();

    setTimeout(() => {
      setBallAnimationState('hit');
      soundFx.playCorrect();
      onThrowCompleted(aimX, power, spin);
      setTimeout(() => {
        setBallAnimationState('idle');
        setIsPowerOscillating(true);
      }, 1400);
    }, 1200);
  };

  // Convert trajectory to keyframes for Framer Motion animation
  const xKeyframes = activeTrajectory.length > 0 
    ? activeTrajectory.map(pt => pt.x * 1.6) 
    : [aimX * 1.6, (aimX + spin * 5) * 1.6];
  const yKeyframes = activeTrajectory.length > 0 
    ? activeTrajectory.map(pt => -(pt.y / 100) * 150) 
    : [0, -150];

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden bg-gradient-to-b from-stone-900 via-zinc-950 to-zinc-900 border-2 border-amber-500/40 shadow-2xl p-4 sm:p-6 flex flex-col items-center justify-between min-h-[470px]">
      {/* Alley Header */}
      <div className="w-full flex flex-wrap items-center justify-between border-b border-zinc-800 pb-3 mb-2 gap-2 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎳</span>
          <div>
            <h3 className="text-sm sm:text-base font-black text-amber-300">
              ĐƯỜNG NÉM BOWLING
            </h3>
            <p className="text-[11px] text-zinc-400">
              Lượt ném của: <strong className="text-white">{activeTeam.name}</strong> (Lần {activeTeam.currentRoll}/2)
            </p>
          </div>
        </div>

        {/* Difficulty & Friction Indicator Badge */}
        <div className="flex items-center gap-2">
          <div className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 ${
            difficulty === 'easy'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : difficulty === 'hard'
              ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
          }`}>
            <Gauge className="w-3.5 h-3.5" />
            <span>Ma sát sàn:</span>
            <span className="font-black underline">
              {difficulty === 'easy' ? 'Cao (Sàn khô)' : difficulty === 'hard' ? 'Thấp (Sàn dầu)' : 'Cân bằng'}
            </span>
            <span className="text-[10px] opacity-75">({currentFriction.toFixed(2)}x)</span>
          </div>

          {/* Outcome Badge */}
          <AnimatePresence>
            {lastOutcome && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-lg ${
                  lastOutcome === 'STRIKE'
                    ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white shadow-amber-500/40 animate-bounce'
                    : lastOutcome === 'SPARE'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-blue-500/40'
                    : lastOutcome === 'GUTTER'
                    ? 'bg-zinc-800 text-zinc-400'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lastOutcome}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Perspective Bowling Alley Stage */}
      <div className="relative w-full flex-1 min-h-[270px] flex flex-col items-center justify-between py-4 perspective-[600px] overflow-hidden">
        {/* Wooden Lane Floor with Perspective */}
        <div className="absolute inset-x-8 top-2 bottom-8 bg-gradient-to-b from-amber-950/80 via-amber-900/50 to-amber-950/90 rounded-2xl border-x-4 border-zinc-800 shadow-inner overflow-hidden flex justify-between">
          {/* Left Gutter */}
          <div className="w-6 h-full bg-zinc-950/90 border-r border-zinc-800 flex items-center justify-center">
            <span className="text-[9px] font-black text-zinc-700 rotate-90 uppercase tracking-widest">Gutter</span>
          </div>

          {/* Center Lane Boards & Oil Transition Pattern */}
          <div className="flex-1 h-full relative">
            {/* Oil pattern boundary indicator (skid to hook transition based on friction breakpoint) */}
            <div 
              className="absolute inset-x-0 h-px bg-amber-400/20 border-b border-dashed border-amber-400/30 transition-all duration-300"
              style={{ top: `${Math.round((1 - frictionInfo.oilBreakpoint) * 70)}%` }}
            />
            <div 
              className="absolute left-1/2 -translate-x-1/2 text-[9px] font-bold text-amber-500/40 pointer-events-none uppercase transition-all duration-300"
              style={{ top: `${Math.round((1 - frictionInfo.oilBreakpoint) * 70) + 2}%` }}
            >
              Vùng Xoáy ({difficulty === 'easy' ? 'Bám Sớm' : difficulty === 'hard' ? 'Bám Muộn / Trơn' : 'Dry Hook Zone'})
            </div>

            {/* Lane Guide Lines */}
            <div className="w-full h-full flex justify-around opacity-20 pointer-events-none">
              <div className="w-px h-full bg-amber-400" />
              <div className="w-px h-full bg-amber-400" />
              <div className="w-px h-full bg-amber-400" />
              <div className="w-px h-full bg-amber-400" />
            </div>

            {/* Trajectory Guide Dots when aiming */}
            {canThrow && ballAnimationState === 'idle' && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {liveTrajectory.map((pt, idx) => (
                  <div
                    key={idx}
                    className={`absolute rounded-full shadow-sm ${
                      difficulty === 'easy' ? 'w-2 h-2 bg-emerald-400/70' : difficulty === 'hard' ? 'w-1.5 h-1.5 bg-rose-400/60' : 'w-1.5 h-1.5 bg-amber-400/60'
                    }`}
                    style={{
                      left: `${50 + (pt.x / 100) * 40}%`,
                      bottom: `${(pt.y / 100) * 80}%`,
                      opacity: 0.2 + (idx / liveTrajectory.length) * 0.7,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Gutter */}
          <div className="w-6 h-full bg-zinc-950/90 border-l border-zinc-800 flex items-center justify-center">
            <span className="text-[9px] font-black text-zinc-700 -rotate-90 uppercase tracking-widest">Gutter</span>
          </div>
        </div>

        {/* 10 Pins Triangle Zone (Top of Lane) */}
        <div className="relative z-10 w-full max-w-[280px] h-32 flex items-center justify-center pt-2">
          <div className="relative w-full h-full">
            {pins.map(pin => {
              const isFallen = pin.isKnocked;
              return (
                <motion.div
                  key={pin.id}
                  animate={{
                    opacity: isFallen ? 0.3 : 1,
                    scale: isFallen ? 0.6 : 1,
                    rotate: isFallen ? (pin.id % 2 === 0 ? 80 : -80) : 0,
                    y: isFallen ? 10 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                  style={{ left: `${pin.x}%`, top: `${pin.y - 65}%` }}
                >
                  <div
                    className={`w-7 h-10 rounded-t-full rounded-b-lg flex flex-col items-center justify-center font-black text-[10px] shadow-lg border relative transition-all ${
                      pin.specialType === 'GOLD'
                        ? 'bg-gradient-to-b from-yellow-300 to-amber-500 text-zinc-950 border-amber-300 ring-2 ring-yellow-400'
                        : pin.specialType === 'FIRE'
                        ? 'bg-gradient-to-b from-orange-400 to-red-600 text-white border-red-400 ring-2 ring-orange-400'
                        : pin.specialType === 'BONUS'
                        ? 'bg-gradient-to-b from-cyan-300 to-blue-500 text-white border-cyan-300 ring-2 ring-cyan-400'
                        : 'bg-gradient-to-b from-zinc-100 to-zinc-300 text-red-600 border-zinc-400'
                    }`}
                  >
                    {pin.specialType === 'NORMAL' && (
                      <div className="w-full h-1 bg-red-600 my-0.5" />
                    )}
                    <span>{pin.id}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Rolling Ball (Animated along curved physics trajectory or ready at foul line) */}
        <div className="relative z-10 w-full flex justify-center pb-2">
          {ballAnimationState === 'rolling' ? (
            <motion.div
              animate={{
                x: xKeyframes,
                y: yKeyframes,
                scale: [1, 0.9, 0.75, 0.6, 0.52],
                rotate: spin < 0 ? [-720, -1440] : [720, 1440],
              }}
              transition={{ duration: 1.15, ease: 'easeIn' }}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-700 via-purple-600 to-blue-500 shadow-2xl flex items-center justify-center text-white border-2 border-white/40"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-black/60" />
            </motion.div>
          ) : (
            <motion.div
              animate={{ x: aimX * 1.6 }}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-blue-500 shadow-2xl flex items-center justify-center text-white border-2 border-white/40 cursor-grab active:cursor-grabbing"
            >
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-black/60" />
                <div className="w-1.5 h-1.5 rounded-full bg-black/60" />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Throw Control Dashboard */}
      <div className="w-full bg-zinc-950/90 rounded-2xl border border-zinc-800 p-3 sm:p-4 flex flex-col gap-3 mt-2 z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          {/* 1. Aim Control */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-bold text-zinc-300">
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-amber-400" /> Hướng Ném
              </span>
              <span className="text-amber-300 text-[11px]">
                {aimX === 0 ? 'Chính diện' : aimX < 0 ? `Trái ${Math.abs(aimX)}` : `Phải ${aimX}`}
              </span>
            </div>
            <input
              type="range"
              min={-55}
              max={55}
              value={aimX}
              disabled={!canThrow || isRolling}
              onChange={e => setAimX(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* 2. Power Meter */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-bold text-zinc-300">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-rose-400" /> Lực Ném (Auto)
              </span>
              <span className="text-rose-400 font-black text-[11px]">{power}%</span>
            </div>
            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700 relative">
              <motion.div
                className={`h-full ${
                  power > 85
                    ? 'bg-gradient-to-r from-orange-500 to-rose-600'
                    : 'bg-gradient-to-r from-amber-400 to-orange-500'
                }`}
                style={{ width: `${power}%` }}
              />
            </div>
          </div>

          {/* 3. Throw Button */}
          <div>
            <button
              id="bowling-throw-ball-btn"
              disabled={!canThrow || isRolling}
              onClick={handleExecuteThrow}
              className="w-full py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 disabled:opacity-40 text-zinc-950 font-black rounded-xl shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transform active:scale-95 transition-all text-xs sm:text-sm"
            >
              <span>🎳 NÉM BÓNG NGAY</span>
            </button>
          </div>
        </div>

        {/* 4. Spin / Hook Curve Mechanic Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400 font-bold">
            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
            <span>Độ xoáy bóng (Spin Hook):</span>
            <span className={`text-[11px] font-black ${spin === 0 ? 'text-zinc-400' : spin < 0 ? 'text-cyan-400' : 'text-orange-400'}`}>
              {spin === 0 ? 'Thẳng (No Spin)' : spin < 0 ? `Xoáy trái (-${Math.abs(spin)})` : `Xoáy phải (+${spin})`}
            </span>
            <span className="text-[10px] text-zinc-500 hidden md:inline">
              (Ảnh hưởng bởi ma sát sàn: {currentFriction.toFixed(2)}x)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[
              { val: -4, label: '◀◀ Hook Trái' },
              { val: -2, label: '◀ Lượn Trái' },
              { val: 0, label: '● Thẳng' },
              { val: 2, label: 'Lượn Phải ▶' },
              { val: 4, label: 'Hook Phải ▶▶' },
            ].map(item => (
              <button
                key={item.val}
                type="button"
                disabled={!canThrow || isRolling}
                onClick={() => setSpin(item.val)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-black transition-all ${
                  spin === item.val
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-400 shadow-md shadow-indigo-500/30'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


