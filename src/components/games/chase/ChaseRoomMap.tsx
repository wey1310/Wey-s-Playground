import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RoomLocation, ChaseGameState } from './chaseTypes';
import { ROOM_LOCATIONS } from './chaseEngine';
import { soundFx } from '../../../utils/audio';

interface ChaseRoomMapProps {
  gameState: ChaseGameState;
  onAnimationComplete: () => void;
  onSelectTargetLocation?: (locationId: number) => void;
}

export const ChaseRoomMap: React.FC<ChaseRoomMapProps> = ({
  gameState,
  onAnimationComplete,
  onSelectTargetLocation,
}) => {
  const { phase, tomTarget, jerries, revealedLocation, isJerryCaught, tomStartPosition } = gameState;

  const [tomPos, setTomPos] = useState({ x: 50, y: 95 });

  useEffect(() => {
    if (phase === 'tom_finding' || phase === 'idle' || phase === 'question_open') {
      setTomPos(tomStartPosition || { x: 50, y: 95 });
    } else if (phase === 'tom_running' && tomTarget) {
      const targetLoc = ROOM_LOCATIONS.find(l => l.id === tomTarget);
      if (targetLoc) {
        setTomPos(targetLoc.coords);
      }
    }
  }, [phase, tomTarget, tomStartPosition]);

  // Handle animation sequence
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (phase === 'tom_finding') {
      timeout = setTimeout(() => {
        onAnimationComplete(); // Next is tom_running
      }, 900);
    } else if (phase === 'tom_running') {
      // Tom takes 1.4s to run to the location
      timeout = setTimeout(() => {
        onAnimationComplete(); // Next is tom_arrived
      }, 1400);
    } else if (phase === 'tom_arrived') {
      timeout = setTimeout(() => {
        onAnimationComplete(); // Next is reveal_object
      }, 600);
    } else if (phase === 'reveal_object') {
      timeout = setTimeout(() => {
        onAnimationComplete(); // Next is jerry_found or jerry_missed
      }, 1100);
    } else if (phase === 'jerry_found' || phase === 'jerry_missed') {
      timeout = setTimeout(() => {
        onAnimationComplete(); // Next is round_end
      }, 2400);
    }

    return () => clearTimeout(timeout);
  }, [phase, onAnimationComplete]);

  const canClickFurniture = (phase === 'idle' || phase === 'tom_finding') && onSelectTargetLocation;

  return (
    <div className="relative w-full max-w-6xl mx-auto rounded-[28px] overflow-hidden shadow-2xl border-4 border-amber-900/60 bg-zinc-950">
      <div className="relative w-full aspect-[16/9] min-h-[380px] sm:min-h-[520px] overflow-hidden select-none">
        
        {/* Background Image of Living Room */}
        <img 
          src="/assets/games/tom_jerry/background.webp"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src.includes('tom_jerry')) {
              target.src = '/assets/games/chase/background.webp';
            }
          }}
          alt="Tom and Jerry Room"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Subtle vignette lighting for dramatic atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none" />

        {/* 9 Interactive Furniture Objects with Numbered Badges (Matching Screenshot 1 to 9) */}
        {ROOM_LOCATIONS.map(loc => {
          const isRevealed = revealedLocation === loc.id;
          const isTargeted = tomTarget === loc.id;
          const hasJerry = jerries.find(j => j.positionId === loc.id);

          return (
            <div
              key={loc.id}
              onClick={() => {
                if (canClickFurniture) {
                  soundFx.playClick();
                  onSelectTargetLocation(loc.id);
                }
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-transform ${
                canClickFurniture ? 'hover:scale-105 active:scale-95' : ''
              }`}
              style={{
                left: `${loc.coords.x}%`,
                top: `${loc.coords.y}%`,
                width: '18%',
                height: '24%',
                zIndex: isRevealed || isTargeted ? 25 : 15,
              }}
            >
              {/* Jerry hidden underneath */}
              {hasJerry && isRevealed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.3, y: 30 }}
                  animate={{ opacity: 1, scale: 1.1, y: -10 }}
                  transition={{ type: 'spring', damping: 10 }}
                  className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                >
                  <img
                    src={`/assets/games/tom_jerry/${hasJerry.asset}`}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src.includes('tom_jerry')) {
                        target.src = `/assets/games/chase/${hasJerry.asset}`;
                      } else {
                        target.src = '/assets/games/chase/jerry.webp';
                      }
                    }}
                    alt="Jerry Hiding"
                    className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(234,179,8,0.6)]"
                  />
                </motion.div>
              )}

              {/* Spike bulldog alert if object 8 */}
              {loc.id === 8 && isRevealed && (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  className="absolute -top-6 left-1/2 -translate-x-1/2 bg-rose-600/90 text-white text-[11px] font-black px-2 py-0.5 rounded-full border border-rose-300 shadow-lg z-30 whitespace-nowrap"
                >
                  🐶 Chó Spike thức giấc!
                </motion.div>
              )}

              {/* The Furniture Object Image */}
              <motion.img
                animate={{
                  opacity: isRevealed ? 0.35 : 1,
                  scale: isRevealed ? 1.05 : 1,
                }}
                transition={{ duration: 0.4 }}
                src={`/assets/games/tom_jerry/${loc.id}.png`}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src.includes('tom_jerry')) {
                    target.src = `/assets/games/chase/${loc.id}.png`;
                  }
                }}
                alt={`Furniture ${loc.id}`}
                className="w-full h-full object-contain drop-shadow-2xl select-none pointer-events-none"
              />

              {/* Vibrant Numbered Badge (Matching the 1-9 round badges in Image 2) */}
              <motion.div
                animate={{
                  scale: isTargeted ? [1, 1.25, 1] : 1,
                }}
                transition={{ repeat: isTargeted ? Infinity : 0, duration: 1 }}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black text-base sm:text-xl shadow-[0_4px_16px_rgba(0,0,0,0.6)] border-2 transition-all ${
                  isRevealed
                    ? 'bg-zinc-800/80 text-zinc-400 border-zinc-600 opacity-60'
                    : isTargeted
                    ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-black border-yellow-100 ring-4 ring-yellow-400/50 shadow-yellow-500/50'
                    : 'bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 text-white border-white/80 group-hover:scale-115 group-hover:shadow-pink-500/50'
                }`}
              >
                <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{loc.id}</span>
              </motion.div>
            </div>
          );
        })}

        {/* Tom Character Running / Finding / Catching Layer */}
        {phase !== 'idle' && phase !== 'question_open' && (
          <motion.div
            animate={{ left: `${tomPos.x}%`, top: `${tomPos.y}%` }}
            transition={{
              duration: phase === 'tom_running' ? 1.4 : 0,
              ease: 'easeInOut',
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none"
            style={{ width: '22%', height: '28%' }}
          >
            {/* Tom Running state */}
            {phase === 'tom_running' && (
              <img
                src="/assets/games/tom_jerry/tomrun.gif"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/assets/games/chase/tomrun.gif';
                }}
                alt="Tom Running"
                className="w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
              />
            )}

            {/* Tom Finding / Stalking */}
            {phase === 'tom_finding' && (
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src="/assets/games/tom_jerry/tomguess.webp"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/assets/games/chase/tomguess.webp';
                }}
                alt="Tom Searching"
                className="w-full h-full object-contain drop-shadow-2xl"
              />
            )}

            {/* Tom Arrived & Checking */}
            {phase === 'tom_arrived' && (
              <motion.img
                initial={{ scale: 0.9 }}
                animate={{ scale: 1.15 }}
                src="/assets/games/tom_jerry/tombump.png"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/assets/games/chase/tomtruestand.webp';
                }}
                alt="Tom Arrived"
                className="w-full h-full object-contain drop-shadow-2xl"
              />
            )}

            {/* Tom Catching / Stolen Jerry Action */}
            {phase === 'jerry_found' && (
              <motion.div
                initial={{ scale: 0.3, rotate: -15, opacity: 0 }}
                animate={{ scale: [0.8, 1.3, 1.1], rotate: [0, 5, 0], opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="relative w-[130%] h-[130%] -top-[15%] -left-[15%]"
              >
                <img
                  src="/assets/games/tom_jerry/stolen.png"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/assets/games/chase/tomtruelay.webp';
                  }}
                  alt="Jerry Caught"
                  className="w-full h-full object-contain drop-shadow-[0_15px_30px_rgba(245,158,11,0.8)]"
                />
              </motion.div>
            )}

            {/* Tom Missed / Bumped */}
            {phase === 'jerry_missed' && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-full h-full flex flex-col items-center justify-center"
              >
                <img
                  src="/assets/games/tom_jerry/tombump.png"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/assets/games/chase/tomguess.webp';
                  }}
                  alt="Tom Bumped"
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Jerry Escape Notice if missed */}
        <AnimatePresence>
          {phase === 'jerry_missed' && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/60 z-50 p-4 backdrop-blur-xs"
            >
              <div className="bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-4 border-yellow-400 p-6 sm:p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(234,179,8,0.4)] max-w-md">
                <div className="text-5xl mb-2">🐭💨</div>
                <h3 className="text-2xl sm:text-3xl font-black text-yellow-400 uppercase tracking-wide mb-1">
                  JERRY ĐÃ TRỐN THOÁT!
                </h3>
                <p className="text-zinc-200 text-sm font-semibold">
                  Tom kiểm tra vị trí này nhưng không tìm thấy chuột Jerry.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

