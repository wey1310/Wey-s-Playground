import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MonopolyTile, MonopolyTeamState, FloatingMoneyEffect } from './monopolyTypes';
import { Home, Hotel, Shield, Sparkles, Building2, Flag } from 'lucide-react';

interface MonopolyBoardProps {
  tiles: MonopolyTile[];
  teams: MonopolyTeamState[];
  currentTeamIndex: number;
  activeTileIndex: number | null;
  floatingEffects: FloatingMoneyEffect[];
  onTileClick?: (tile: MonopolyTile) => void;
  centerContent?: React.ReactNode;
}

// 7x7 Grid coordinate lookup for the 24 perimeter tiles
const TILE_GRID_POSITIONS: { [index: number]: { row: number; col: number; isCorner?: boolean } } = {
  // Bottom Row (Right -> Left)
  0: { row: 6, col: 6, isCorner: true }, // START
  1: { row: 6, col: 5 },
  2: { row: 6, col: 4 },
  3: { row: 6, col: 3 },
  4: { row: 6, col: 2 },
  5: { row: 6, col: 1 },
  6: { row: 6, col: 0, isCorner: true }, // JAIL

  // Left Column (Bottom -> Top)
  7: { row: 5, col: 0 },
  8: { row: 4, col: 0 },
  9: { row: 3, col: 0 },
  10: { row: 2, col: 0 },
  11: { row: 1, col: 0 },
  12: { row: 0, col: 0, isCorner: true }, // REST / FREE PARKING

  // Top Row (Left -> Right)
  13: { row: 0, col: 1 },
  14: { row: 0, col: 2 },
  15: { row: 0, col: 3 },
  16: { row: 0, col: 4 },
  17: { row: 0, col: 5 },
  18: { row: 0, col: 6, isCorner: true }, // GO TO JAIL

  // Right Column (Top -> Bottom)
  19: { row: 1, col: 6 },
  20: { row: 2, col: 6 },
  21: { row: 3, col: 6 },
  22: { row: 4, col: 6 },
  23: { row: 5, col: 6 },
};

export const MonopolyBoard: React.FC<MonopolyBoardProps> = ({
  tiles,
  teams,
  currentTeamIndex,
  activeTileIndex,
  floatingEffects,
  onTileClick,
  centerContent
}) => {
  const currentTeam = teams[currentTeamIndex];

  // Helper to find all pawns standing on a given tile index
  const getPawnsOnTile = (tileIndex: number) => {
    return teams.filter(t => !t.isBankrupt && t.position === tileIndex);
  };

  // Helper to find owner team
  const getOwnerTeam = (ownerId: string | null) => {
    if (!ownerId) return null;
    return teams.find(t => t.id === ownerId) || null;
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto aspect-square sm:aspect-[1/0.95] max-h-[82vh] p-1.5 sm:p-3 bg-[#FAF7EE] border-4 border-[#DED5B8] rounded-3xl shadow-[0_16px_40px_rgba(53,69,46,0.15)] flex flex-col justify-between select-none overflow-hidden">
      
      {/* 7x7 Perimeter Grid */}
      <div className="grid grid-cols-7 grid-rows-7 gap-1 sm:gap-1.5 w-full h-full relative">

        {/* 24 Perimeter Tiles */}
        {tiles.map((tile) => {
          const gridPos = TILE_GRID_POSITIONS[tile.index] || { row: 0, col: 0 };
          const owner = getOwnerTeam(tile.ownerTeamId);
          const pawnsHere = getPawnsOnTile(tile.index);
          const isTargeted = activeTileIndex === tile.index;

          return (
            <div
              key={`tile_${tile.index}`}
              onClick={() => onTileClick && onTileClick(tile)}
              style={{
                gridRowStart: gridPos.row + 1,
                gridColumnStart: gridPos.col + 1,
              }}
              className={`relative rounded-xl sm:rounded-2xl transition-all duration-300 flex flex-col justify-between p-1 sm:p-1.5 cursor-pointer overflow-hidden border-2 ${
                isTargeted
                  ? 'border-amber-400 bg-amber-50 ring-4 ring-amber-400/40 shadow-lg z-20 scale-[1.03]'
                  : owner
                  ? 'bg-white shadow-xs'
                  : 'bg-[#FFFDF5] border-[#DED5B8] hover:border-[#B9CDA0] hover:shadow-sm'
              }`}
            >
              {/* Top Group Color Banner (For Property Tiles) */}
              {tile.type === 'property' && (
                <div
                  className="w-full h-2 sm:h-3 rounded-md mb-0.5 flex items-center justify-between px-1"
                  style={{ backgroundColor: tile.groupColor || '#94a3b8' }}
                >
                  {/* House / Hotel Level Icons */}
                  <div className="flex items-center gap-0.5">
                    {tile.level === 1 && <Home className="w-2.5 h-2.5 text-white fill-white" />}
                    {tile.level === 2 && (
                      <div className="flex items-center gap-0.5">
                        <Home className="w-2.5 h-2.5 text-white fill-white" />
                        <Home className="w-2.5 h-2.5 text-white fill-white" />
                      </div>
                    )}
                    {tile.level >= 3 && <Hotel className="w-2.5 h-2.5 text-amber-200 fill-amber-200" />}
                  </div>

                  {owner && (
                    <div
                      className="w-2.5 h-2.5 rounded-full border border-white shrink-0"
                      style={{ backgroundColor: owner.color }}
                      title={`Chủ sở hữu: ${owner.name}`}
                    />
                  )}
                </div>
              )}

              {/* Special Tile Header Badge */}
              {tile.type !== 'property' && (
                <div className={`w-full py-0.5 px-1 rounded text-[8px] sm:text-[9px] font-black uppercase text-center truncate ${
                  tile.type === 'start' ? 'bg-emerald-600 text-white' :
                  tile.type === 'jail' ? 'bg-slate-700 text-white' :
                  tile.type === 'rest' ? 'bg-amber-600 text-white' :
                  tile.type === 'goto_jail' ? 'bg-rose-600 text-white' :
                  tile.type === 'event' ? 'bg-purple-600 text-white' :
                  tile.type === 'luck' ? 'bg-teal-600 text-white' :
                  tile.type === 'tax' ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tile.type === 'start' ? 'START' :
                   tile.type === 'jail' ? 'NHÀ TÙ' :
                   tile.type === 'rest' ? 'TRẠM NGHỈ' :
                   tile.type === 'goto_jail' ? 'VÀO TÙ' :
                   tile.type === 'event' ? 'CƠ HỘI' :
                   tile.type === 'luck' ? 'MAY MẮN' :
                   tile.type === 'tax' ? 'THUẾ' : 'ĐẶC BIỆT'}
                </div>
              )}

              {/* Main Content: Icon & Name */}
              <div className="flex-1 flex flex-col items-center justify-center text-center my-0.5 z-10">
                <span className="text-base sm:text-xl md:text-2xl drop-shadow-xs">{tile.icon}</span>
                <span className="text-[9px] sm:text-[10px] md:text-[11px] font-[900] text-[#293B23] line-clamp-1 leading-tight px-0.5 mt-0.5">
                  {tile.name}
                </span>
                {tile.subtitle && (
                  <span className="text-[7px] sm:text-[8px] text-[#55634D] font-bold hidden md:inline truncate max-w-full">
                    {tile.subtitle}
                  </span>
                )}
              </div>

              {/* Bottom Footer: Price or Rent or Action - Crystal Clear */}
              <div className="pt-0.5 z-10">
                {tile.type === 'property' ? (
                  owner ? (
                    <div className="w-full flex items-center justify-between px-1 py-0.5 rounded bg-rose-50 border border-rose-200 text-[#35452E]">
                      <span className="text-[7px] sm:text-[8px] font-bold text-rose-800">Thuê:</span>
                      <span className="text-[8px] sm:text-[9px] font-black text-rose-900">${tile.rentLevels[tile.level] || tile.baseRent}</span>
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-between px-1 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[#293B23]">
                      <span className="text-[7px] sm:text-[8px] font-bold text-emerald-800">Giá:</span>
                      <span className="text-[8px] sm:text-[9px] font-black text-emerald-950">${tile.price}</span>
                    </div>
                  )
                ) : tile.type === 'start' ? (
                  <div className="w-full py-0.5 rounded bg-emerald-100 text-emerald-900 font-black text-center text-[8px] sm:text-[9px]">
                    +$200
                  </div>
                ) : tile.type === 'tax' ? (
                  <div className="w-full py-0.5 rounded bg-rose-100 text-rose-900 font-black text-center text-[8px] sm:text-[9px]">
                    -${tile.price || 50}
                  </div>
                ) : (
                  <div className="w-full py-0.5 text-center text-[8px] font-extrabold text-[#74806B]">
                    Ô #{tile.index}
                  </div>
                )}
              </div>

              {/* Owner Flag Tag on Corner */}
              {owner && (
                <div
                  className="absolute top-0 right-0 w-4 h-4 rounded-bl-lg shadow-xs flex items-center justify-center text-[8px] text-white font-black z-20"
                  style={{ backgroundColor: owner.color }}
                  title={`Chủ đất: ${owner.name}`}
                >
                  ★
                </div>
              )}

              {/* Pawns Standing on this Tile - Floating without covering text */}
              {pawnsHere.length > 0 && (
                <div className="absolute top-1 left-1 pointer-events-none flex items-center gap-0.5 z-30 flex-wrap max-w-[80%]">
                  {pawnsHere.map((pawn) => {
                    const isCurrentTurn = pawn.id === currentTeam?.id;
                    return (
                      <motion.div
                        key={pawn.id}
                        layoutId={`pawn_${pawn.id}`}
                        animate={isCurrentTurn ? {
                          scale: [1, 1.2, 1],
                          y: [0, -3, 0]
                        } : { scale: 1, y: 0 }}
                        transition={{ repeat: isCurrentTurn ? Infinity : 0, duration: 1.2 }}
                        className="relative"
                      >
                        <div
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[8px] sm:text-[10px] transform font-black"
                          style={{
                            backgroundColor: pawn.color,
                            boxShadow: `0 2px 6px ${pawn.color}99`
                          }}
                          title={`${pawn.name} ($${pawn.money})`}
                        >
                          <span>{pawn.avatar}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Center 5x5 Hub Area */}
        <div
          style={{
            gridRowStart: 2,
            gridRowEnd: 7,
            gridColumnStart: 2,
            gridColumnEnd: 7,
          }}
          className="relative bg-gradient-to-br from-[#FFFDF8] via-white to-[#F6F1E3] border-2 border-[#DED5B8]/80 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-inner flex flex-col items-center justify-center z-10 overflow-hidden"
        >
          {centerContent}

          {/* Floating Money Effects Animations */}
          <AnimatePresence>
            {floatingEffects.map((eff) => (
              <motion.div
                key={eff.id}
                initial={{ opacity: 0, y: 15, scale: 0.8 }}
                animate={{ opacity: 1, y: -45, scale: 1.2 }}
                exit={{ opacity: 0, scale: 1.4 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className={`absolute pointer-events-none font-black text-base sm:text-xl md:text-2xl px-3 py-1 rounded-full shadow-lg border-2 z-50 ${
                  eff.isGain
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-rose-600 text-white border-rose-400'
                }`}
              >
                {eff.isGain ? `+$${eff.amount}` : `-$${eff.amount}`}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
