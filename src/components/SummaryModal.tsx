import React, { useEffect } from 'react';
import { Trophy, RotateCcw, Home, CheckCircle2, XCircle, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Team, AnswerLog } from "../types";

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  answerLogs: AnswerLog[];
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  teams,
  answerLogs,
  onPlayAgain,
  onGoHome,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Trigger confetti celebration
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Normalize and sort teams by score descending
  const normalizedTeams = (teams || []).map(t => ({
    ...t,
    score: typeof t.score === 'number' ? t.score : 0,
  }));
  const sortedTeams = [...normalizedTeams].sort((a, b) => (b.score || 0) - (a.score || 0));
  const winner = sortedTeams.length > 0 ? sortedTeams[0] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-w-text-main/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-w-bg-card border border-w-border w-full max-w-3xl rounded-[22px] sm:rounded-[26px] shadow-[0_12px_36px_rgba(79,104,60,0.18)] overflow-hidden flex flex-col max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] my-auto wey-paper-card">
        {/* Header */}
        <div className="p-5 bg-w-bg-main border-b border-w-border text-center relative shrink-0">
          <div className="inline-flex p-3 bg-amber-100 text-w-text-main rounded-[20px] border border-w-border shadow-sm mb-2 animate-bounce">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-[800] text-w-text-main tracking-tight">
            TỔNG KẾT KẾT QUẢ
          </h2>
          <p className="text-xs text-w-text-muted font-[600] mt-0.5">Bảng Vinh Danh & Nhật Ký Đáp Án Bài Học</p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Winner Banner */}
          {winner && (
            <div className="bg-gradient-to-r from-amber-100/80 via-yellow-100/80 to-amber-100/80 border border-amber-300 rounded-2xl p-4 sm:p-5 text-center relative overflow-hidden shadow-sm">
              <div className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">
                🏆 CHIẾN THẮNG CHUNG CUỘC 🏆
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-900 flex items-center justify-center gap-2">
                <span>{winner.avatar}</span>
                <span>{winner.name}</span>
              </div>
              <div className="text-sm font-extrabold text-amber-800 mt-1">
                Tổng điểm: <span className="text-xl font-mono text-amber-950 font-black">{winner.score}</span> điểm
              </div>
            </div>
          )}

          {/* Rankings List */}
          <div>
            <h3 className="text-xs font-extrabold text-w-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Bảng Xếp Hạng Đội Chơi</span>
            </h3>

            <div className="space-y-2">
              {sortedTeams.map((team, idx) => {
                const isWinner = idx === 0;
                return (
                  <div
                    key={team.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                      isWinner
                        ? 'bg-amber-500/15 border-amber-400 text-w-text-main font-bold shadow-xs'
                        : 'bg-w-bg-alt border-w-border text-w-text-main'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-extrabold text-xs font-mono ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : idx === 1
                          ? 'bg-w-accent-muted text-w-text-main'
                          : idx === 2
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-w-bg-tag text-w-text-muted border border-w-border'
                      }`}>
                        #{idx + 1}
                      </span>
                      <span className="text-xl">{team.avatar}</span>
                      <span className="font-bold text-sm text-w-text-main">{team.name}</span>
                    </div>

                    <div className="font-mono font-black text-sm text-amber-500">
                      {team.score} điểm
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question Answer Logs */}
          {answerLogs.length > 0 && (
            <div>
              <h3 className="text-xs font-extrabold text-w-text-muted uppercase tracking-wider mb-2">
                📋 Nhật Ký Đáp Án Đã Trả Lời ({answerLogs.length} câu)
              </h3>

              <div className="border border-w-border rounded-2xl overflow-hidden bg-w-bg-alt">
                <div className="max-h-60 overflow-y-auto divide-y divide-w-border">
                  {answerLogs.map((log, index) => (
                    <div key={index} className="p-3 flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="font-bold text-w-primary flex items-center gap-1.5">
                          <span>Câu {log.questionNumber}</span>
                          {log.teamName && (
                            <span className="text-[10px] bg-w-accent-light text-w-text-main border border-w-accent-border px-1.5 py-0.5 rounded font-bold">
                              Đội: {log.teamName}
                            </span>
                          )}
                        </div>
                        {log.questionText && (
                          <p className="text-w-text-main font-semibold text-xs">{log.questionText}</p>
                        )}
                        <p className="text-emerald-600 font-bold">
                          Đáp án đúng: <span className="text-w-text-main">{log.correctAnswer}</span>
                        </p>
                      </div>

                      {log.isCorrect !== undefined && (
                        <div className="shrink-0">
                          {log.isCorrect ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 font-bold text-[10px] border border-emerald-400/30">
                              <CheckCircle2 className="w-3 h-3" /> Đúng
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-500/15 text-rose-600 font-bold text-[10px] border border-rose-400/30">
                              <XCircle className="w-3 h-3" /> Sai
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 bg-w-bg-main border-t border-w-border flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <button
            onClick={onGoHome}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-w-bg-card hover:bg-w-accent-light text-w-text-main font-[700] text-xs sm:text-sm rounded-[14px] border border-w-border transition cursor-pointer min-h-[44px]"
          >
            <Home className="w-4 h-4" />
            <span>Trang Chủ</span>
          </button>

          <button
            onClick={onPlayAgain}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 wey-btn-primary text-xs sm:text-sm font-[800] rounded-[15px] cursor-pointer min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Chơi Lại Ván Này</span>
          </button>
        </div>
      </div>
    </div>
  );
};
