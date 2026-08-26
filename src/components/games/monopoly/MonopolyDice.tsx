import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Dices, Sparkles } from 'lucide-react';
import { soundFx } from '../../../utils/audio';

interface MonopolyDiceProps {
  onRollComplete: (diceValue: number) => void;
  disabled?: boolean;
  isRolling?: boolean;
  currentValue?: number;
  currentTeamName?: string;
  currentTeamColor?: string;
}

export const MonopolyDice: React.FC<MonopolyDiceProps> = ({
  onRollComplete,
  disabled = false,
  isRolling = false,
  currentValue = 1,
  currentTeamName,
  currentTeamColor = '#E08283',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(currentValue || 1);
  const [localRolling, setLocalRolling] = useState<boolean>(false);

  const handleRoll = () => {
    if (disabled || isRolling || localRolling) return;

    setLocalRolling(true);
    soundFx.diceRoll();

    let rollCount = 0;
    const maxRolls = 14;
    const interval = setInterval(() => {
      const rand = Math.floor(Math.random() * 6) + 1;
      setDisplayValue(rand);
      rollCount++;

      if (rollCount >= maxRolls) {
        clearInterval(interval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDisplayValue(finalValue);
        setLocalRolling(false);
        soundFx.pointBeep();
        onRollComplete(finalValue);
      }
    }, 80);
  };

  // Render dice face dots
  const renderDiceDots = (num: number) => {
    switch (num) {
      case 1:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-rose-600 shadow-sm animate-pulse" />
          </div>
        );
      case 2:
        return (
          <div className="w-full h-full flex flex-col justify-between p-1.5">
            <div className="w-3 h-3 rounded-full bg-w-text-main self-start" />
            <div className="w-3 h-3 rounded-full bg-w-text-main self-end" />
          </div>
        );
      case 3:
        return (
          <div className="w-full h-full flex flex-col justify-between p-1.5">
            <div className="w-3 h-3 rounded-full bg-w-text-main self-start" />
            <div className="w-3 h-3 rounded-full bg-w-text-main self-center" />
            <div className="w-3 h-3 rounded-full bg-w-text-main self-end" />
          </div>
        );
      case 4:
        return (
          <div className="w-full h-full grid grid-cols-2 gap-2 p-1.5 place-items-center">
            <div className="w-3 h-3 rounded-full bg-w-text-main" />
            <div className="w-3 h-3 rounded-full bg-w-text-main" />
            <div className="w-3 h-3 rounded-full bg-w-text-main" />
            <div className="w-3 h-3 rounded-full bg-w-text-main" />
          </div>
        );
      case 5:
        return (
          <div className="w-full h-full relative p-1.5">
            <div className="w-3 h-3 rounded-full bg-w-text-main absolute top-1.5 left-1.5" />
            <div className="w-3 h-3 rounded-full bg-w-text-main absolute top-1.5 right-1.5" />
            <div className="w-3 h-3 rounded-full bg-rose-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <div className="w-3 h-3 rounded-full bg-w-text-main absolute bottom-1.5 left-1.5" />
            <div className="w-3 h-3 rounded-full bg-w-text-main absolute bottom-1.5 right-1.5" />
          </div>
        );
      case 6:
      default:
        return (
          <div className="w-full h-full grid grid-cols-2 gap-1.5 p-1.5 place-items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-w-text-main" />
            <div className="w-2.5 h-2.5 rounded-full bg-w-text-main" />
            <div className="w-2.5 h-2.5 rounded-full bg-w-text-main" />
            <div className="w-2.5 h-2.5 rounded-full bg-w-text-main" />
            <div className="w-2.5 h-2.5 rounded-full bg-w-text-main" />
            <div className="w-2.5 h-2.5 rounded-full bg-w-text-main" />
          </div>
        );
    }
  };

  const isActuallyRolling = isRolling || localRolling;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 3D-feeling Dice Container */}
      <motion.div
        animate={isActuallyRolling ? {
          rotateX: [0, 360, 720, 1080],
          rotateY: [0, 180, 360, 540],
          scale: [1, 1.25, 0.95, 1.15, 1],
          y: [-5, -20, 5, -10, 0]
        } : { rotateX: 0, rotateY: 0, scale: 1, y: 0 }}
        transition={{ duration: isActuallyRolling ? 1.1 : 0.2, ease: "easeInOut" }}
        className="relative"
      >
        <div
          className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-white via-slate-50 to-slate-200 border-2 border-w-accent-border rounded-2xl shadow-[0_8px_20px_rgba(53,69,46,0.22)] p-1.5 flex items-center justify-center transform transition-transform"
          style={{
            boxShadow: `0 8px 24px ${currentTeamColor}33, 0 2px 6px rgba(0,0,0,0.15)`
          }}
        >
          <div className="w-full h-full bg-white rounded-xl border border-slate-200/80 shadow-inner flex items-center justify-center">
            {renderDiceDots(displayValue)}
          </div>
        </div>

        {/* Dice Number Pill */}
        <div className="absolute -bottom-2 -right-2 bg-w-text-main text-w-text-main text-xs font-black px-2 py-0.5 rounded-full border border-white shadow-md">
          {displayValue}
        </div>
      </motion.div>

      {/* Action Button */}
      <button
        type="button"
        disabled={disabled || isActuallyRolling}
        onClick={handleRoll}
        className={`px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl font-black text-xs sm:text-sm text-w-text-main shadow-md transition-all flex items-center gap-2 cursor-pointer ${
          disabled || isActuallyRolling
            ? 'opacity-50 cursor-not-allowed bg-slate-400'
            : 'hover:scale-105 active:scale-95 hover:shadow-lg'
        }`}
        style={{
          backgroundColor: disabled ? '#94a3b8' : currentTeamColor
        }}
      >
        <Dices className={`w-4 h-4 ${isActuallyRolling ? 'animate-spin' : ''}`} />
        <span>{isActuallyRolling ? 'Đang gieo xúc xắc...' : `Gieo Xúc Xắc (${currentTeamName || 'Lượt Chơi'})`}</span>
        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
      </button>
    </div>
  );
};
