import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapTile, TeamState, SinhLeItem, Faction } from './SonTinhThuyTinhGame';

interface SonTinhThuyTinhBoardProps {
  mapTiles: MapTile[];
  teams: TeamState[];
  sinhLeList: SinhLeItem[];
  currentTeamIndex: number;
  waterLevel: number;
}

export const SonTinhThuyTinhBoard: React.FC<SonTinhThuyTinhBoardProps> = ({
  mapTiles,
  teams,
  sinhLeList,
  currentTeamIndex,
  waterLevel
}) => {
  // A helper to visually map 24 tiles to a more thematic "Mountain vs Water" layout
  // We can use a 6-column grid.
  // Left side: Mountains. Right side: Water. Center: Palaces/Plains.
  
  const getTileGridClass = (tileId: number) => {
    // Just a basic thematic grouping wrapper, we use flex wrap or a grid
    return "col-span-1";
  };

  return (
    <div className="w-full h-full min-h-[400px] flex flex-col relative bg-[#F4F8F1] rounded-2xl overflow-hidden border-2 border-w-accent-muted">
      
      {/* Environmental overlay based on water level */}
      {waterLevel > 1 && (
        <div 
          className="absolute inset-0 bg-blue-500/10 pointer-events-none transition-all duration-1000 z-10"
          style={{ opacity: (waterLevel - 1) * 0.15 }}
        />
      )}

      {/* Grid container */}
      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar p-2 sm:p-4">
        <div className="min-w-[800px] grid grid-cols-6 gap-3 lg:gap-4 relative z-20">
          
          {mapTiles.map(tile => {
            const pawnsHere = teams.filter(t => t.position === tile.id);
            const sinhLeHere = sinhLeList.find(s => s.tilePosition === tile.id && !s.isCollected);

            let tileBg = 'bg-w-bg-alt border-[#E3DCBA] text-slate-700';
            let tileIcon = '🌾';

            if (tile.type === 'palace') {
              tileBg = 'bg-gradient-to-br from-amber-100 to-amber-200 border-amber-400 text-amber-900 shadow-md ring-2 ring-amber-300/50 scale-105 z-10';
              tileIcon = '👑';
            } else if (tile.type === 'mountain') {
              tileBg = 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-400 text-emerald-900';
              tileIcon = '🏔️';
            } else if (tile.type === 'water' || tile.isFlooded) {
              tileBg = 'bg-gradient-to-br from-blue-50 to-blue-200 border-blue-400 text-blue-900';
              tileIcon = '🌊';
            }

            // Highlight if a team is currently here and it's their turn
            const hasActiveTeam = pawnsHere.some(p => p.id === teams[currentTeamIndex]?.id);
            if (hasActiveTeam) {
              tileBg += ' ring-2 ring-rose-400 shadow-lg';
            }

            return (
              <div
                key={tile.id}
                className={`min-h-[90px] p-2 sm:p-3 rounded-2xl border-2 flex flex-col justify-between relative transition-all duration-300 ${tileBg} hover:-translate-y-1`}
              >
                {/* Tile Header */}
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="w-6 h-6 rounded-lg bg-white/60 flex items-center justify-center border border-black/10 shadow-sm">
                    {tile.id}
                  </span>
                  <span className="text-lg filter drop-shadow-sm" title={tile.name}>
                    {tileIcon}
                  </span>
                </div>

                {/* Sinh Le Indicator */}
                <AnimatePresence>
                  {sinhLeHere && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.2, 1] }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl filter drop-shadow-md z-10"
                      title={`Sính Lễ: ${sinhLeHere.name}`}
                    >
                      {sinhLeHere.icon}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Defensive Wall */}
                {tile.hasStoneWall && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black text-w-primary-dark bg-w-accent-light px-2 py-0.5 rounded-md border-2 border-w-accent-border shadow-sm z-20 whitespace-nowrap">
                    🛡️ Lũy Đá
                  </div>
                )}

                {/* Team Pawns */}
                <div className="flex flex-wrap gap-2 items-center justify-center mt-2 z-20 relative">
                  {pawnsHere.map(pawn => {
                    const isActiveTurn = teams[currentTeamIndex]?.id === pawn.id;
                    return (
                    <motion.div
                      key={pawn.id}
                      layoutId={`board_pawn_${pawn.id}`}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md font-black relative group transition-all duration-300
                        ${isActiveTurn ? 'border-2 border-white ring-4 ring-rose-500 ring-offset-2 ring-offset-[#F4F8F1] animate-pulse scale-125 z-30' : 'border-2 border-white opacity-80'}
                      `}
                      style={{ backgroundColor: pawn.color }}
                      title={pawn.name}
                    >
                      <span className="text-[12px] filter drop-shadow-sm">{pawn.avatar}</span>
                      
                      {/* Active turn indicator bubble */}
                      {isActiveTurn && (
                        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
                      )}
                    </motion.div>
                  )})}
                </div>

                {/* Tile Name Footer */}
                <div className="mt-1 text-[9px] sm:text-[10px] font-extrabold text-center truncate opacity-80 uppercase tracking-wider">
                  {tile.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
