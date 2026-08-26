import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Target, Trophy, Gamepad2 } from 'lucide-react';

interface Props {
  playCounts: Record<string, number>;
  totalQuestions: number;
  gamesList: { id: string; title: string; color: string }[];
}

export const GameStatisticsPanel: React.FC<Props> = ({ playCounts, totalQuestions, gamesList }) => {
  const data = gamesList
    .map(g => ({
      name: g.title,
      plays: playCounts[g.id] || 0,
      color: g.color.split(' ')[0].replace('from-', '')
    }))
    .filter(d => d.plays > 0)
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 5);

  const getColorHex = (index: number) => {
    const colors = ['#F1948A', '#E4B363', '#E05D5D', '#4A90E2', '#9B59B6'];
    return colors[index % colors.length];
  };

  const totalPlays = Object.values(playCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-[#FFFDFB] border border-w-border p-5 sm:p-6 rounded-[22px] shadow-sm mb-8">
      <h3 className="text-xl font-[800] text-w-text-main flex items-center gap-2.5 mb-6">
        <Target className="w-6 h-6 text-w-primary" />
        <span>Thống Kê Hoạt Động</span>
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Stats Cards */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-w-accent-light p-5 rounded-2xl border border-w-accent-border flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
              <Gamepad2 className="w-6 h-6 text-w-primary" />
            </div>
            <div>
              <p className="text-sm font-[700] text-w-text-muted">Tổng số lượt chơi</p>
              <p className="text-3xl font-[900] text-w-primary-dark">{totalPlays}</p>
            </div>
          </div>

          <div className="bg-[#FAF3D1] p-5 rounded-2xl border border-[#E9D58F] flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
              <Trophy className="w-6 h-6 text-[#D4A346]" />
            </div>
            <div>
              <p className="text-sm font-[700] text-[#917622]">Số câu đã trả lời</p>
              <p className="text-3xl font-[900] text-[#7A6218]">{totalQuestions}</p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2 bg-white border border-[#F0EBE1] rounded-2xl p-4 sm:p-5">
          <h4 className="text-sm font-[800] text-w-text-muted mb-4 uppercase tracking-wider">Top Trò Chơi Yêu Thích</h4>
          {data.length > 0 ? (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#7F8C8D', fontSize: 11, fontWeight: 600 }}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis 
                    tick={{ fill: '#7F8C8D', fontSize: 12, fontWeight: 600 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    cursor={{ fill: '#F9FAFB' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #FADBD8', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="plays" radius={[6, 6, 0, 0]} maxBarSize={50}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getColorHex(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] w-full flex items-center justify-center text-[#9CA3AF] font-[600]">
              Chưa có dữ liệu. Hãy chơi game để thống kê!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
