import React, { useState } from 'react';
import { Settings, RefreshCw, Plus, Minus, UserCheck, Shuffle, Trophy, HelpCircle } from 'lucide-react';
import { ChaseTeamState } from './chaseTypes';
import { ROOM_LOCATIONS } from './chaseEngine';

interface ChaseTeacherPanelProps {
  teams: ChaseTeamState[];
  currentTeamIndex: number;
  jerryLocation: number;
  onAdjustScore: (teamId: string, delta: number) => void;
  onSetTurn: (teamIndex: number) => void;
  onResetGame: () => void;
  onGrantPowerUp: (teamId: string, powerUpKey: 'peekScan' | 'narrow3' | 'cheeseBait') => void;
}

export const ChaseTeacherPanel: React.FC<ChaseTeacherPanelProps> = ({
  teams,
  currentTeamIndex,
  jerryLocation,
  onAdjustScore,
  onSetTurn,
  onResetGame,
  onGrantPowerUp,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentJerryLocObj = ROOM_LOCATIONS.find(l => l.id === jerryLocation);

  return (
    <div className="w-full max-w-5xl mx-auto mt-4">
      {/* Toggle button */}
      <div className="flex justify-center mb-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-w-text-main text-xs font-bold border border-zinc-700 flex items-center gap-1.5 transition-colors shadow"
        >
          <Settings className="w-3.5 h-3.5 text-yellow-400" />
          <span>{isOpen ? 'ĐÓNG BẢNG ĐIỀU KHIỂN GIÁO VIÊN' : 'BẢNG ĐIỀU KHIỂN CỦA GIÁO VIÊN'}</span>
        </button>
      </div>

      {isOpen && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Điểm số các đội & Trợ giúp */}
            <div>
              <h4 className="text-xs font-black text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" /> ĐIỀU CHỈNH ĐIỂM & TẶNG TRỢ GIÚP
              </h4>
              <div className="space-y-2.5">
                {teams.map((team, idx) => (
                  <div
                    key={team.id}
                    className={`p-2.5 rounded-2xl border ${
                      idx === currentTeamIndex
                        ? 'bg-purple-950/40 border-purple-500/50'
                        : 'bg-zinc-950/50 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSetTurn(idx)}
                          className={`text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 transition-colors ${
                            idx === currentTeamIndex
                              ? 'bg-yellow-400 text-black'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>{team.name}</span>
                        </button>
                        <span className="text-sm font-black text-yellow-300">
                          {team.score}đ
                        </span>
                      </div>

                      {/* Point buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onAdjustScore(team.id, -10)}
                          className="px-2 py-0.5 rounded-lg bg-rose-950 border border-rose-600/40 text-rose-300 hover:bg-rose-600 hover:text-w-text-main text-xs font-black"
                        >
                          -10
                        </button>
                        <button
                          type="button"
                          onClick={() => onAdjustScore(team.id, 10)}
                          className="px-2 py-0.5 rounded-lg bg-emerald-950 border border-emerald-600/40 text-emerald-300 hover:bg-emerald-600 hover:text-w-text-main text-xs font-black"
                        >
                          +10
                        </button>
                      </div>
                    </div>

                    {/* Grant Support Power-ups buttons */}
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-zinc-400 font-bold">Thêm:</span>
                      <button
                        type="button"
                        onClick={() => onGrantPowerUp(team.id, 'peekScan')}
                        className="px-2 py-0.5 rounded-md bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-700 hover:text-w-text-main font-bold"
                      >
                        +1 Soi
                      </button>
                      <button
                        type="button"
                        onClick={() => onGrantPowerUp(team.id, 'narrow3')}
                        className="px-2 py-0.5 rounded-md bg-amber-950/70 border border-amber-500/40 text-amber-600 hover:bg-amber-700 hover:text-w-text-main font-bold"
                      >
                        +1 Còn 3
                      </button>
                      <button
                        type="button"
                        onClick={() => onGrantPowerUp(team.id, 'cheeseBait')}
                        className="px-2 py-0.5 rounded-md bg-yellow-950/70 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-700 hover:text-w-text-main font-bold"
                      >
                        +1 Mồi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Trạng thái phòng & Vị trí bí mật của Jerry */}
            <div>
              <h4 className="text-xs font-black text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4" /> THÔNG TIN VỊ TRÍ & RESET
              </h4>
              <div className="space-y-3">
                {/* Secret Jerry Location (Teacher Only) */}
                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-yellow-500/30 text-xs">
                  <span className="text-zinc-400 block font-bold mb-1">
                    🕵️ Vị trí bí mật của Jerry ở vòng này (Dành cho Giáo viên):
                  </span>
                  <span className="text-sm font-black text-yellow-300 flex items-center gap-1.5">
                    <span>🐭</span>
                    <span>{currentJerryLocObj?.name}</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onResetGame}
                  className="w-full px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>LÀM MỚI VÁN CHƠI TỪ ĐẦU</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
