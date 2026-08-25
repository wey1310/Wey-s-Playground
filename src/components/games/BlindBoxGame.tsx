import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameSetupConfig, Question, AnswerLog, Team } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, X, Gift, Crown, Trophy, RefreshCcw, Sparkles, 
  CheckCircle2, XCircle, HelpCircle, Dices, ChevronRight, Volume2, Plus, Minus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundFx } from '../../utils/audio';

interface GameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: Team[], logs: AnswerLog[]) => void;
}

interface BoxItem {
  id: number;
  opened: boolean;
  points: number;
  itemIndex: number;
  name: string;
  emoji: string;
  ownerId?: string;
  ownerName?: string;
  ownerColor?: string;
  ownerAvatar?: string;
}

const THEMES = [
  { id: 'conan', name: '🕵️ Thám Tử Conan', bg: '/assets/games/openbox/thamtubackground.jpg' },
  { id: 'anime', name: '⚡ Thế Giới Anime', bg: '/assets/games/openbox/galaxyclosed.jpg' },
  { id: 'pokemon', name: '⚡ Bảo Bối Pokemon', bg: '/assets/games/openbox/rainbowbackground.jpg' },
  { id: 'disney', name: '🏰 Vương Quốc Disney', bg: '/assets/games/openbox/maybackground.webp' },
  { id: 'daiduong', name: '🌊 Đại Dương Bí Ẩn', bg: '/assets/games/openbox/daiduongbackground.jpg' },
  { id: 'galaxy', name: '🌌 Thiên Hà Vũ Trụ', bg: '/assets/games/openbox/galaxybackground.jpg' },
  { id: 'caoboi', name: '🤠 Miền Tây Hoang Dã', bg: '/assets/games/openbox/caoboibackground.jpg' },
  { id: 'forest', name: '🌲 Rừng Xanh Kỳ Bí', bg: '/assets/games/openbox/forestbackground.jpg' },
  { id: 'basic', name: '🎁 Hộp Quà May Mắn', bg: '/assets/games/openbox/basicbackground.webp' },
];

const MYSTERY_REWARDS = [
  { name: 'Cúp Vàng Danh Dự', points: 50, emoji: '🏆' },
  { name: 'Kim Cương Huyền Thoại', points: 100, emoji: '💎' },
  { name: 'Hộp Quà May Mắn', points: 30, emoji: '🎁' },
  { name: 'Ngôi Sao Hy Vọng', points: 20, emoji: '⭐' },
  { name: 'Huy Chương Vàng', points: 40, emoji: '🥇' },
  { name: 'Túi Thần Kỳ', points: 30, emoji: '🎒' },
  { name: 'Đá Quý Quyền Năng', points: 50, emoji: '🔮' },
  { name: 'Bảo Bối Tối Thượng', points: 80, emoji: '👑' },
  { name: 'Kẹo Ngọt Phép Thuật', points: 15, emoji: '🍬' },
  { name: 'Thẻ Điểm Tăng Tốc', points: 25, emoji: '🚀' },
  { name: 'Ngọc Trai Biển Sâu', points: 35, emoji: '🦪' },
  { name: 'Bình Độc Dược Bí Mật', points: 10, emoji: '🧪' },
  { name: 'Chiếc Nhẫn Phép Thuật', points: 45, emoji: '💍' },
  { name: 'Hũ Vàng May Mắn', points: 60, emoji: '🏺' },
  { name: 'Bom Xui Xẻo', points: -10, emoji: '💣' },
  { name: 'Trái Tim Nhân Đôi', points: 40, emoji: '💖' },
  { name: 'Sấm Sét Tốc Độ', points: 20, emoji: '⚡' },
  { name: 'Cỏ Bốn Lá May Mắn', points: 30, emoji: '🍀' },
  { name: 'Vương Miện Hoàng Gia', points: 70, emoji: '👑' },
  { name: 'Kho Báu Hoàng Kim', points: 90, emoji: '💰' },
];

export const BlindBoxGame: React.FC<GameProps> = ({ config, questions, onGameEnd }) => {
  const [teams, setTeams] = useState<Team[]>(() => 
    config.teams.map((t, idx) => ({ 
      ...t, 
      score: t.score || 0,
      color: t.color || (['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][idx % 6])
    }))
  );

  const [currentTurnIdx, setCurrentTurnIdx] = useState<number>(0);
  const [selectedTheme, setSelectedTheme] = useState<string>('conan');
  const [boxes, setBoxes] = useState<BoxItem[]>([]);
  
  // Game Flow States
  // 'IDLE' -> 'DRAWING' -> 'QUESTION' -> 'CAN_PICK_BOX' -> 'REVEALED_BOX'
  const [phase, setPhase] = useState<'IDLE' | 'DRAWING' | 'QUESTION' | 'CAN_PICK_BOX' | 'REVEALED_BOX'>('IDLE');
  
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [activeQuestionNum, setActiveQuestionNum] = useState<number>(1);
  const [usedQuestionIndices, setUsedQuestionIndices] = useState<number[]>([]);
  
  const [revealedBox, setRevealedBox] = useState<BoxItem | null>(null);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const currentTeam = teams[currentTurnIdx] || teams[0];

  // Initialize 20 mystery boxes
  const initBoxes = useCallback(() => {
    const shuffledRewards = [...MYSTERY_REWARDS].sort(() => Math.random() - 0.5);
    const newBoxes: BoxItem[] = Array.from({ length: 20 }).map((_, i) => {
      const reward = shuffledRewards[i % shuffledRewards.length];
      return {
        id: i,
        opened: false,
        points: reward.points,
        itemIndex: (i % 20) + 1,
        name: reward.name,
        emoji: reward.emoji,
      };
    });
    setBoxes(newBoxes);
    setPhase('IDLE');
    setActiveQuestion(null);
    setRevealedBox(null);
  }, []);

  useEffect(() => {
    initBoxes();
  }, [initBoxes, selectedTheme]);

  const showToast = (text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Step 1: Draw a random question for the current active team
  const handleDrawQuestion = () => {
    if (phase !== 'IDLE') return;

    soundFx.wheelTick();
    setPhase('DRAWING');

    setTimeout(() => {
      let q: Question | null = null;
      let num = 1;

      if (config.mode === 'bank' && questions.length > 0) {
        let available = questions.map((_, i) => i).filter(i => !usedQuestionIndices.includes(i));
        if (available.length === 0) {
          available = questions.map((_, i) => i);
          setUsedQuestionIndices([]);
        }
        const randIdx = available[Math.floor(Math.random() * available.length)];
        q = questions[randIdx];
        num = randIdx + 1;
        setUsedQuestionIndices(prev => [...prev, randIdx]);
      } else {
        const total = config.totalQuestionsNumber || 10;
        let available = Array.from({ length: total }, (_, i) => i + 1).filter(n => !usedQuestionIndices.includes(n));
        if (available.length === 0) {
          available = Array.from({ length: total }, (_, i) => i + 1);
          setUsedQuestionIndices([]);
        }
        num = available[Math.floor(Math.random() * available.length)] || 1;
        setUsedQuestionIndices(prev => [...prev, num]);
      }

      setActiveQuestion(q);
      setActiveQuestionNum(num);
      setPhase('QUESTION');
      soundFx.cardFlip();
    }, 800);
  };

  // Step 2: Handle Answer Submission
  const handleAnswerSubmit = (isCorrect: boolean, selectedAnswerText?: string) => {
    // Log answer
    setAnswerLogs(prev => [...prev, {
      questionNumber: activeQuestionNum,
      questionText: activeQuestion?.content || `Câu hỏi số ${activeQuestionNum}`,
      correctAnswer: activeQuestion 
        ? (typeof activeQuestion.correct === 'number' && activeQuestion.options ? activeQuestion.options[activeQuestion.correct] : String(activeQuestion.correct))
        : (isCorrect ? 'Đúng' : 'Sai'),
      teamName: currentTeam.name,
      isCorrect,
      selectedAnswer: selectedAnswerText
    }]);

    if (isCorrect) {
      soundFx.correct();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 }
      });
      showToast(`🎉 CHÍNH XÁC! ${currentTeam.name} hãy chọn 1 Hộp Mù bất kỳ để mở quà!`, 'success');
      setPhase('CAN_PICK_BOX');
    } else {
      soundFx.wrong();
      showToast(`❌ Chưa chính xác! Rất tiếc ${currentTeam.name} mất lượt mở hộp.`, 'error');
      setPhase('IDLE');
      // Pass turn to next team
      setCurrentTurnIdx(prev => (prev + 1) % teams.length);
    }
  };

  // Step 3: Team picks a Blind Box to open (ONLY enabled if phase === 'CAN_PICK_BOX')
  const handleBoxClick = (boxId: number) => {
    const box = boxes[boxId];
    if (box.opened) return;

    if (phase !== 'CAN_PICK_BOX') {
      if (phase === 'IDLE') {
        showToast('👉 Hãy bấm "BỐC CÂU HỎI" trước! Trả lời đúng mới được mở hộp.', 'info');
      }
      return;
    }

    // Open box
    soundFx.powerup();
    soundFx.cardFlip();

    const updatedBox: BoxItem = {
      ...box,
      opened: true,
      ownerId: currentTeam.id,
      ownerName: currentTeam.name,
      ownerColor: currentTeam.color,
      ownerAvatar: currentTeam.avatar
    };

    setBoxes(prev => prev.map(b => b.id === boxId ? updatedBox : b));
    setRevealedBox(updatedBox);
    setPhase('REVEALED_BOX');

    // Update team score
    setTeams(prev => prev.map((t, idx) => 
      idx === currentTurnIdx ? { ...t, score: Math.max(0, t.score + box.points) } : t
    ));

    if (box.points >= 50) {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 }
      });
    }
  };

  // Next Turn after reviewing revealed box
  const handleNextTurn = () => {
    setRevealedBox(null);
    setPhase('IDLE');
    setCurrentTurnIdx(prev => (prev + 1) % teams.length);
  };

  // Score Manual Adjust
  const handleAdjustScore = (teamIdx: number, delta: number) => {
    setTeams(prev => prev.map((t, i) => i === teamIdx ? { ...t, score: Math.max(0, t.score + delta) } : t));
  };

  const themeConfig = useMemo(() => 
    THEMES.find(t => t.id === selectedTheme) || THEMES[0],
    [selectedTheme]
  );

  const unopenedCount = boxes.filter(b => !b.opened).length;

  return (
    <div 
      className="w-full h-[100dvh] flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans relative select-none"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 30%, rgba(30, 27, 75, 0.8), rgba(2, 6, 23, 0.95)), url('${themeConfig.bg}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Top Navigation Bar */}
      <header className="bg-black/60 backdrop-blur-md px-4 py-3 flex flex-wrap items-center justify-between border-b border-white/10 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Gift className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-[900] tracking-tight text-white flex items-center gap-2">
              BLIND BOX
              <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-bold">
                Mở Hộp Bí Ẩn
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Trả lời đúng câu hỏi để giành quyền mở hộp quà may mắn!
            </p>
          </div>
        </div>

        {/* Theme selector & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <select 
            value={selectedTheme} 
            onChange={e => setSelectedTheme(e.target.value)}
            className="bg-slate-800/90 text-white text-xs font-bold border border-white/20 rounded-xl px-3 py-2 outline-none hover:border-pink-500 transition-colors cursor-pointer"
          >
            {THEMES.map(t => (
              <option key={t.id} value={t.id} className="bg-slate-900 text-white">{t.name}</option>
            ))}
          </select>

          <button
            onClick={initBoxes}
            title="Làm mới 20 hộp"
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCcw className="w-4 h-4" />
            <span className="hidden md:inline">Xáo Lại Hộp</span>
          </button>

          <button 
            onClick={() => onGameEnd(teams, answerLogs)}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Trophy className="w-4 h-4" />
            Kết Thúc
          </button>
        </div>
      </header>

      {/* Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl font-bold text-sm shadow-2xl backdrop-blur-md border flex items-center gap-2 ${
              toastMessage.type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400' :
              toastMessage.type === 'error' ? 'bg-rose-500/90 text-white border-rose-400' :
              'bg-blue-500/90 text-white border-blue-400'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            {toastMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row p-3 sm:p-5 gap-4 lg:gap-6 overflow-hidden z-10">
        
        {/* Left Side: Teams & Turn Controller */}
        <div className="w-full lg:w-72 xl:w-80 flex flex-col gap-3 shrink-0">
          
          {/* Turn Action Card */}
          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                Lượt Của Đội
              </span>
              <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
                Còn {unopenedCount} Hộp
              </span>
            </div>

            {/* Current Active Team Display */}
            <div 
              className="p-3 rounded-xl border flex items-center gap-3 transition-all"
              style={{ 
                backgroundColor: `${currentTeam.color}20`,
                borderColor: currentTeam.color 
              }}
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md font-bold shrink-0 text-white"
                style={{ backgroundColor: currentTeam.color }}
              >
                {currentTeam.avatar}
              </div>
              <div className="truncate flex-1">
                <div className="font-black text-base text-white truncate">{currentTeam.name}</div>
                <div className="text-xs font-bold text-amber-300">{currentTeam.score} điểm</div>
              </div>
            </div>

            {/* Main Action Button according to phase */}
            {phase === 'IDLE' && (
              <button
                onClick={handleDrawQuestion}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-black text-sm rounded-xl shadow-lg shadow-pink-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 animate-pulse"
              >
                <Dices className="w-5 h-5" />
                BỐC CÂU HỎI CHO ĐỘI
              </button>
            )}

            {phase === 'DRAWING' && (
              <div className="w-full py-3.5 px-4 bg-white/10 text-pink-300 font-black text-sm rounded-xl border border-pink-500/30 flex items-center justify-center gap-2">
                <Dices className="w-5 h-5 animate-spin" />
                Đang quay câu hỏi...
              </div>
            )}

            {phase === 'CAN_PICK_BOX' && (
              <div className="w-full py-3 px-4 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-black text-xs rounded-xl flex items-center justify-center gap-2 animate-bounce">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                HÃY CHỌN 1 HỘP TRÊN BẢNG ĐỂ MỞ!
              </div>
            )}

            {phase === 'QUESTION' && (
              <div className="w-full py-2.5 px-4 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl text-center">
                Đang trả lời câu hỏi #{activeQuestionNum}...
              </div>
            )}
          </div>

          {/* Leaderboard & Team Switcher */}
          <div className="flex-1 bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-xl flex flex-col overflow-hidden">
            <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Danh Sách Đội ({teams.length})</span>
              <span className="text-[10px] text-slate-500">Bấm để đổi lượt</span>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {teams.map((team, idx) => {
                const isActive = currentTurnIdx === idx;
                return (
                  <div
                    key={team.id}
                    onClick={() => {
                      if (phase === 'IDLE') setCurrentTurnIdx(idx);
                    }}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isActive 
                        ? 'bg-white/15 border-pink-400 shadow-md ring-2 ring-pink-500/30' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-base shadow-sm font-bold text-white shrink-0"
                        style={{ backgroundColor: team.color }}
                      >
                        {team.avatar}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-xs text-white truncate flex items-center gap-1">
                          {team.name}
                          {isActive && <Crown className="w-3 h-3 text-yellow-400 shrink-0" />}
                        </div>
                        <div className="text-[11px] font-extrabold text-amber-300">{team.score}đ</div>
                      </div>
                    </div>

                    {/* Quick score adjust buttons */}
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleAdjustScore(idx, -10)}
                        className="w-6 h-6 rounded-md bg-white/10 hover:bg-rose-500/50 text-white flex items-center justify-center text-xs transition-colors"
                        title="Trừ 10 điểm"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleAdjustScore(idx, 10)}
                        className="w-6 h-6 rounded-md bg-white/10 hover:bg-emerald-500/50 text-white flex items-center justify-center text-xs transition-colors"
                        title="Cộng 10 điểm"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: 20 Blind Boxes Grid */}
        <div className="flex-1 bg-slate-900/60 backdrop-blur-md rounded-2xl p-3 sm:p-5 border border-white/10 shadow-2xl flex flex-col overflow-hidden">
          
          {/* Header instructions */}
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-pink-400" />
              <span className="font-black text-sm text-slate-200">
                BẢNG 20 HỘP MÙ BÍ ẨN
              </span>
            </div>

            {phase === 'CAN_PICK_BOX' && (
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 bg-amber-500/20 border border-amber-500/40 px-3 py-1 rounded-full animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Click vào 1 hộp chưa mở để nhận quà!
              </div>
            )}
          </div>

          {/* 4x5 Boxes Grid */}
          <div className="flex-1 grid grid-cols-4 sm:grid-cols-5 gap-2.5 sm:gap-3.5 content-start overflow-y-auto pr-1">
            {boxes.map((box) => {
              const isPickable = phase === 'CAN_PICK_BOX' && !box.opened;

              return (
                <motion.div
                  key={box.id}
                  whileHover={isPickable ? { scale: 1.08, y: -6 } : { scale: 1.02 }}
                  whileTap={isPickable ? { scale: 0.94 } : {}}
                  onClick={() => handleBoxClick(box.id)}
                  className={`relative aspect-square rounded-2xl flex items-center justify-center transition-all ${
                    box.opened
                      ? 'bg-slate-800/80 border-2 border-white/20 shadow-inner'
                      : isPickable
                        ? 'cursor-pointer ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 bg-gradient-to-br from-purple-900/80 to-pink-900/80 border-2 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.5)] animate-pulse'
                        : 'cursor-pointer bg-slate-800/40 border border-white/10 hover:border-white/30 hover:bg-slate-800/70'
                  }`}
                >
                  {box.opened ? (
                    // Opened Box Content
                    <div className="absolute inset-0 p-2 flex flex-col items-center justify-between text-center overflow-hidden">
                      {/* Owner Tag */}
                      <div 
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full border border-white shadow-md flex items-center justify-center text-xs font-bold text-white z-20"
                        style={{ backgroundColor: box.ownerColor || '#64748b' }}
                        title={`Được mở bởi: ${box.ownerName}`}
                      >
                        {box.ownerAvatar || '👤'}
                      </div>

                      {/* Item Emoji & Index */}
                      <div className="flex-1 flex flex-col items-center justify-center mt-2">
                        <span className="text-3xl sm:text-4xl filter drop-shadow-md">{box.emoji}</span>
                        <span className="text-[10px] font-bold text-slate-300 mt-1 line-clamp-1 max-w-[90%]">
                          {box.name}
                        </span>
                      </div>

                      {/* Points badge */}
                      <div className={`text-xs sm:text-sm font-black px-2 py-0.5 rounded-md shadow-sm ${
                        box.points > 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {box.points > 0 ? `+${box.points}` : box.points}đ
                      </div>
                    </div>
                  ) : (
                    // Closed Blind Box
                    <div className="absolute inset-0 p-2 flex flex-col items-center justify-center text-center">
                      <div className="w-3/4 h-3/4 relative flex items-center justify-center">
                        <img 
                          src={`/assets/games/blindbox/boxclosed-${selectedTheme}.webp`}
                          alt="Mystery Box"
                          className="w-full h-full object-contain filter drop-shadow-md"
                          onError={(e) => {
                            // Fallback if specific webp not found
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <Package className="w-10 h-10 sm:w-12 sm:h-12 text-pink-400/80 group-hover:text-pink-300" />
                      </div>

                      {/* Box Number Tag */}
                      <div className="absolute bottom-1.5 font-black text-xs sm:text-sm text-white/70 bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
                        #{box.id + 1}
                      </div>

                      {isPickable && (
                        <div className="absolute top-1 bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-lg">
                          MỞ TÔI!
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* QUESTION MODAL */}
      <AnimatePresence>
        {phase === 'QUESTION' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border-2 border-pink-500/50 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white p-5 sm:p-6 text-center relative flex-shrink-0">
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <span className="bg-white/20 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                    Lượt của: {currentTeam.avatar} {currentTeam.name}
                  </span>
                </div>
                <h3 className="text-lg sm:text-2xl font-black leading-snug">
                  {config.mode === 'bank' && activeQuestion 
                    ? activeQuestion.content 
                    : `CÂU HỎI SỐ ${activeQuestionNum}`}
                </h3>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-8 overflow-y-auto flex-1 bg-slate-950/80 flex flex-col justify-center">
                {/* MCQ Mode with options */}
                {config.mode === 'bank' && activeQuestion && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {['A', 'B', 'C', 'D'].map((label, index) => {
                      const optionText = activeQuestion.options?.[index];
                      if (!optionText) return null;
                      
                      let isCorrect = false;
                      if (typeof activeQuestion.correct === 'number') {
                        isCorrect = activeQuestion.correct === index;
                      } else if (typeof activeQuestion.correct === 'string') {
                        isCorrect = activeQuestion.correct.trim().toUpperCase() === label ||
                                    activeQuestion.correct.trim().toUpperCase() === optionText.trim().toUpperCase();
                      }
                      
                      return (
                        <button
                          key={index}
                          onClick={() => handleAnswerSubmit(isCorrect, `${label}. ${optionText}`)}
                          className="bg-slate-900 hover:bg-pink-600/20 border-2 border-slate-800 hover:border-pink-500 p-4 sm:p-5 rounded-2xl text-left transition-all group flex items-center gap-3.5 shadow-sm hover:shadow-pink-500/10 active:scale-[0.98]"
                        >
                          <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-pink-500 text-slate-300 group-hover:text-white flex items-center justify-center font-black text-lg transition-colors shrink-0 shadow-inner">
                            {label}
                          </div>
                          <span className="text-sm sm:text-base font-bold text-slate-200 group-hover:text-white">
                            {optionText}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Number / Oral Mode (Teacher judges) */}
                {(config.mode === 'number' || !activeQuestion) && (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <div className="w-28 h-28 rounded-3xl bg-slate-900 border-4 border-pink-500/50 flex items-center justify-center text-6xl font-[900] text-pink-400 shadow-2xl shadow-pink-500/20 mb-6">
                      {activeQuestionNum}
                    </div>
                    <p className="text-sm sm:text-base text-slate-300 font-semibold mb-8 max-w-md">
                      Học sinh đội <strong className="text-pink-400">{currentTeam.name}</strong> trả lời câu hỏi số #{activeQuestionNum}. Giáo viên đánh giá:
                    </p>

                    <div className="flex items-center gap-4 w-full max-w-md">
                      <button
                        onClick={() => handleAnswerSubmit(true, 'Đúng')}
                        className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        ĐÚNG (Được mở hộp)
                      </button>

                      <button
                        onClick={() => handleAnswerSubmit(false, 'Sai')}
                        className="flex-1 py-4 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-base rounded-2xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-5 h-5" />
                        SAI (Mất lượt)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REVEALED BOX MODAL */}
      <AnimatePresence>
        {phase === 'REVEALED_BOX' && revealedBox && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.6, opacity: 0 }}
              className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 max-w-md w-full border-2 border-amber-400 text-center shadow-[0_0_50px_rgba(251,191,36,0.3)] flex flex-col items-center"
            >
              <div className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                MỞ HỘP BÍ ẨN #{revealedBox.id + 1}
              </div>

              <div className="text-sm font-bold text-slate-300 mb-4">
                Chúc mừng <strong className="text-white">{currentTeam.name}</strong> đã nhận được:
              </div>

              {/* Item Avatar / Animation */}
              <div className="w-32 h-32 rounded-3xl bg-amber-500/10 border-2 border-amber-400/40 flex items-center justify-center text-7xl shadow-2xl mb-4 animate-bounce">
                {revealedBox.emoji}
              </div>

              <h4 className="text-2xl font-[900] text-white mb-2">
                {revealedBox.name}
              </h4>

              <div className={`text-3xl font-[900] mb-6 px-4 py-1.5 rounded-2xl shadow-inner ${
                revealedBox.points > 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {revealedBox.points > 0 ? `+${revealedBox.points} Điểm` : `${revealedBox.points} Điểm`}
              </div>

              <button
                onClick={handleNextTurn}
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-base rounded-2xl shadow-xl shadow-pink-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Tiếp Tục Lượt Sau
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
