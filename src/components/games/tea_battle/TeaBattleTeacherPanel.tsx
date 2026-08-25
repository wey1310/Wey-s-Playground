import React, { useState } from 'react';
import { Settings, RefreshCw, Plus, Minus, UserCheck, Shuffle, Trophy } from 'lucide-react';
import { BattleTeamState, TeaCup } from './teaBattleTypes';

interface TeaBattleTeacherPanelProps {
  teams: BattleTeamState[];
  currentTeamIndex: number;
  teaCups: TeaCup[];
  onAdjustScore: (teamId: string, delta: number) => void;
  onSetTurn: (teamIndex: number) => void;
  onResetAllCups: () => void;
  onShuffleQuestions: () => void;
}

export const TeaBattleTeacherPanel: React.FC<TeaBattleTeacherPanelProps> = ({
  teams,
  currentTeamIndex,
  teaCups,
  onAdjustScore,
  onSetTurn,
  onResetAllCups,
  onShuffleQuestions,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full max-w-6xl mx-auto mt-4">
      {/* Toggle button */}
      <div className="flex justify-center mb-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold border border-zinc-700 flex items-center gap-1.5 transition-colors shadow"
        >
          <Settings className="w-3.5 h-3.5 text-amber-400" />
          <span>{isOpen ? 'ĐÓNG BẢNG ĐIỀU KHIỂN GIÁO VIÊN' : 'BẢNG ĐIỀU KHIỂN CỦA GIÁO VIÊN'}</span>
        </button>
      </div>

      {isOpen && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Điểm số các đội */}
            <div>
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" /> ĐIỀU CHỈNH ĐIỂM & ĐỔI LƯỢT CHƠI
              </h4>
              <div className="space-y-2">
                {teams.map((team, idx) => (
                  <div
                    key={team.id}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border ${
                      idx === currentTeamIndex
                        ? 'bg-amber-950/30 border-amber-500/50'
                        : 'bg-zinc-950/50 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSetTurn(idx)}
                        className={`text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 transition-colors ${
                          idx === currentTeamIndex
                            ? 'bg-amber-500 text-black'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>{team.name}</span>
                      </button>
                      <span className="text-sm font-black text-amber-300">
                        {team.score}đ
                      </span>
                    </div>

                    {/* Point buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onAdjustScore(team.id, -10)}
                        className="px-2 py-0.5 rounded-lg bg-rose-950 border border-rose-600/40 text-rose-300 hover:bg-rose-600 hover:text-white text-xs font-black"
                      >
                        -10
                      </button>
                      <button
                        type="button"
                        onClick={() => onAdjustScore(team.id, -5)}
                        className="px-2 py-0.5 rounded-lg bg-rose-950 border border-rose-600/40 text-rose-300 hover:bg-rose-600 hover:text-white text-xs font-black"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() => onAdjustScore(team.id, 5)}
                        className="px-2 py-0.5 rounded-lg bg-emerald-950 border border-emerald-600/40 text-emerald-300 hover:bg-emerald-600 hover:text-white text-xs font-black"
                      >
                        +5
                      </button>
                      <button
                        type="button"
                        onClick={() => onAdjustScore(team.id, 10)}
                        className="px-2 py-0.5 rounded-lg bg-emerald-950 border border-emerald-600/40 text-emerald-300 hover:bg-emerald-600 hover:text-white text-xs font-black"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Cài đặt bàn cờ & Reset */}
            <div>
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4" /> QUẢN LÝ BÀN TRÀ & CỐC
              </h4>
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between">
                  <span>Trạng thái cốc:</span>
                  <span className="font-bold text-amber-300">
                    {teaCups.filter(c => c.status === 'won').length} Thắng / {teaCups.filter(c => c.status === 'lost').length} Thua / {teaCups.filter(c => c.status === 'unopened').length} Chưa mở
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onResetAllCups}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>LÀM MỚI TẤT CẢ CỐC TRÀ</span>
                  </button>

                  <button
                    type="button"
                    onClick={onShuffleQuestions}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>XÁO TRỘN CÂU HỎI</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
