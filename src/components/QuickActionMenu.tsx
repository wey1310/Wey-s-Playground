import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Shuffle,
  RotateCcw,
  Trash2,
  Users,
  Volume2,
  VolumeX,
  BookOpen,
  X,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundFx } from '../utils/audio';

interface QuickActionMenuProps {
  onOpenStudentPicker?: () => void;
  onOpenStudentManager?: () => void;
  onOpenQuestionBanks?: () => void;
  onResetActiveGame?: () => void;
  isGameActive?: boolean;
}

export const QuickActionMenu: React.FC<QuickActionMenuProps> = ({
  onOpenStudentPicker,
  onOpenStudentManager,
  onOpenQuestionBanks,
  onResetActiveGame,
  isGameActive = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isQuickShuffleOpen, setIsQuickShuffleOpen] = useState(false);
  const [isClearCacheModalOpen, setIsClearCacheModalOpen] = useState(false);
  const [shuffleWinner, setShuffleWinner] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Student list for quick shuffle
  const [students, setStudents] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wey_saved_students_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Hoàng Cường',
      'Phạm Minh Dũng', 'Hoàng Gia Em', 'Vũ Thùy Linh',
      'Đỗ Quang Minh', 'Bùi Hải Nam', 'Đặng Phương Nga', 'Trương Quốc Phong'
    ];
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleMute = () => {
    soundFx.playClick();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundFx.setMuted(nextMuted);
    showToast(nextMuted ? '🔇 Đã tắt âm thanh toàn hệ thống' : '🔊 Đã bật âm thanh sống động');
  };

  const handleStartShuffle = () => {
    if (students.length === 0) return;
    setIsRolling(true);
    setShuffleWinner(null);
    soundFx.playSpin();

    let rollCount = 0;
    const maxRolls = 24;
    const intervalTime = 65;

    const rollInterval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * students.length);
      setShuffleWinner(students[randomIdx]);
      rollCount++;

      if (rollCount >= maxRolls) {
        clearInterval(rollInterval);
        const finalWinner = students[Math.floor(Math.random() * students.length)];
        setShuffleWinner(finalWinner);
        setIsRolling(false);
        soundFx.playCorrect();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }, intervalTime);
  };

  const handleClearCache = () => {
    try {
      // Clear non-critical temporary game states and preserves question banks & active api keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('wey_teams_') || k.startsWith('wey_temp_') || k.startsWith('wey_cache_') || k.startsWith('game_state_'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
      setIsClearCacheModalOpen(false);
      soundFx.playCorrect();
      showToast('🧹 Đã dọn dẹp cache & trạng thái game tạm thành công!');
    } catch (e) {
      showToast('❌ Lỗi khi dọn dẹp bộ nhớ đệm');
    }
  };

  const handleResetGameDirectly = () => {
    if (onResetActiveGame) {
      onResetActiveGame();
    } else {
      // Clear game keys
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('wey_teams_')) {
          localStorage.removeItem(k);
        }
      }
    }
    soundFx.playClick();
    showToast('🔄 Đã đặt lại trạng thái và điểm số các game!');
    setIsOpen(false);
  };

  return (
    <>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-[9999] bg-zinc-900/95 text-amber-300 px-4 py-3 rounded-2xl shadow-2xl border border-amber-500/30 backdrop-blur-md flex items-center gap-3 text-sm font-semibold"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Speed Dial Container - Positioned on bottom-left to avoid obstructing mascot Wey */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2 select-none">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 12, originX: 0, originY: 1 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 12 }}
              transition={{ type: 'spring', damping: 22, stiffness: 350 }}
              className="bg-zinc-900/95 backdrop-blur-xl border border-amber-500/40 rounded-2xl p-2.5 shadow-2xl shadow-black/80 flex flex-col gap-1.5 w-60 mb-1"
            >
              <div className="px-2 py-1 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] font-black tracking-wider uppercase bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-400" /> Tác Vụ Nhanh
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Action 1: Shuffle / Random Call */}
              <button
                id="quick-action-shuffle-btn"
                onClick={() => {
                  soundFx.playClick();
                  setIsOpen(false);
                  setIsQuickShuffleOpen(true);
                  if (onOpenStudentPicker) onOpenStudentPicker();
                }}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-amber-500/15 text-zinc-200 hover:text-amber-300 transition-all text-left text-xs font-bold group border border-transparent hover:border-amber-500/20"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-400 text-zinc-950 flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-transform shrink-0">
                  <Shuffle className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <div className="font-bold text-[12px] text-amber-200 group-hover:text-amber-100 truncate">Bốc Thăm Học Sinh</div>
                  <div className="text-[10px] text-zinc-400 font-normal truncate">Quay tên ngẫu nhiên tức thì</div>
                </div>
              </button>

              {/* Action 2: Reset Game */}
              <button
                id="quick-action-reset-game-btn"
                onClick={handleResetGameDirectly}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-rose-500/15 text-zinc-200 hover:text-rose-300 transition-all text-left text-xs font-bold group border border-transparent hover:border-rose-500/20"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-transform shrink-0">
                  <RotateCcw className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <div className="font-bold text-[12px] text-rose-200 group-hover:text-rose-100 truncate">Đặt Lại Game</div>
                  <div className="text-[10px] text-zinc-400 font-normal truncate">Khởi động lại ván đấu</div>
                </div>
              </button>

              {/* Action 3: Student Roster */}
              <button
                id="quick-action-manage-students-btn"
                onClick={() => {
                  soundFx.playClick();
                  setIsOpen(false);
                  if (onOpenStudentManager) onOpenStudentManager();
                  else setIsQuickShuffleOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-blue-500/15 text-zinc-200 hover:text-blue-300 transition-all text-left text-xs font-bold group border border-transparent hover:border-blue-500/20"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-transform shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <div className="font-bold text-[12px] text-blue-200 group-hover:text-blue-100 truncate">Danh Sách Lớp</div>
                  <div className="text-[10px] text-zinc-400 font-normal truncate">{students.length} học sinh</div>
                </div>
              </button>

              {/* Action 4: Question Bank Quick Jump */}
              {onOpenQuestionBanks && (
                <button
                  id="quick-action-open-bank-btn"
                  onClick={() => {
                    soundFx.playClick();
                    setIsOpen(false);
                    onOpenQuestionBanks();
                  }}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-emerald-500/15 text-zinc-200 hover:text-emerald-300 transition-all text-left text-xs font-bold group border border-transparent hover:border-emerald-500/20"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-transform shrink-0">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-[12px] text-emerald-200 group-hover:text-emerald-100 truncate">Kho Câu Hỏi</div>
                    <div className="text-[10px] text-zinc-400 font-normal truncate">Mở quản lý câu hỏi</div>
                  </div>
                </button>
              )}

              {/* Action 5: Sound Toggle */}
              <button
                id="quick-action-mute-toggle-btn"
                onClick={handleToggleMute}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-purple-500/15 text-zinc-200 hover:text-purple-300 transition-all text-left text-xs font-bold group border border-transparent hover:border-purple-500/20"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-500 to-fuchsia-600 text-white flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-transform shrink-0">
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </div>
                <div className="truncate">
                  <div className="font-bold text-[12px] text-purple-200 group-hover:text-purple-100 truncate">
                    {isMuted ? 'Bật Âm Thanh' : 'Tắt Âm Thanh'}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-normal truncate">Âm thanh hiệu ứng</div>
                </div>
              </button>

              {/* Action 6: Clear Cache */}
              <button
                id="quick-action-clear-cache-btn"
                onClick={() => {
                  soundFx.playClick();
                  setIsOpen(false);
                  setIsClearCacheModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all text-left text-[11px] font-medium group border-t border-zinc-800/80 mt-0.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-zinc-500 group-hover:text-rose-400 transition-colors shrink-0" />
                <span className="truncate">Dọn dẹp bộ nhớ đệm</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Master Floating Trigger Button - Compact, placed at Bottom-Left */}
        <motion.button
          id="quick-action-master-fab"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            soundFx.playClick();
            setIsOpen(!isOpen);
          }}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full shadow-lg flex items-center justify-center font-black transition-all border backdrop-blur-md ${
            isOpen
              ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-amber-500/40 ring-2 ring-amber-400/30'
              : 'bg-zinc-900/90 hover:bg-zinc-800 text-amber-400 border-amber-500/40 shadow-black/70 hover:border-amber-400 hover:text-amber-300 opacity-85 hover:opacity-100'
          }`}
          title="Tác Vụ Nhanh (Quick Actions)"
        >
          {isOpen ? (
            <X className="w-3.5 h-3.5 text-zinc-950" />
          ) : (
            <motion.div
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
            </motion.div>
          )}
        </motion.button>
      </div>


      {/* Quick Student Shuffle Modal */}
      <AnimatePresence>
        {isQuickShuffleOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              {/* Glow Accent */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Shuffle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-amber-300 text-lg">Bốc Thăm Học Sinh</h3>
                    <p className="text-xs text-zinc-400">Gọi tên ngẫu nhiên tức thì ({students.length} học sinh)</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsQuickShuffleOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Roulette Wheel Stage */}
              <div className="my-6 p-6 rounded-2xl bg-zinc-950/80 border border-amber-500/30 text-center flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden">
                {shuffleWinner ? (
                  <motion.div
                    key={shuffleWinner}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl mb-2 text-amber-300">
                      🎓
                    </div>
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
                      {shuffleWinner}
                    </span>
                    {!isRolling && (
                      <span className="text-[11px] text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Người được chọn trả lời!
                      </span>
                    )}
                  </motion.div>
                ) : (
                  <div className="text-zinc-500 text-sm flex flex-col items-center gap-2">
                    <Shuffle className="w-8 h-8 text-zinc-600 animate-pulse" />
                    <span>Nhấn nút bên dưới để quay tên ngẫu nhiên</span>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  id="quick-shuffle-spin-btn"
                  disabled={isRolling || students.length === 0}
                  onClick={handleStartShuffle}
                  className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-zinc-950 font-black rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95"
                >
                  <Shuffle className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
                  <span>{isRolling ? 'Đang quay...' : 'Bốc Thăm Ngay!'}</span>
                </button>
                <button
                  onClick={() => setIsQuickShuffleOpen(false)}
                  className="px-5 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-2xl transition-colors"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Cache Confirmation Dialog */}
      <AnimatePresence>
        {isClearCacheModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-black text-white text-lg mb-1">Dọn Dẹp Bộ Nhớ Đệm?</h3>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                Hệ thống sẽ làm sạch các điểm số tạm thời và trạng thái ván game cũ. Ngân hàng câu hỏi và cài đặt tài khoản của bạn vẫn được giữ nguyên an toàn.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleClearCache}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-600/30 transition-colors"
                >
                  Dọn Dẹp Ngay
                </button>
                <button
                  onClick={() => setIsClearCacheModalOpen(false)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors"
                >
                  Hủy
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
