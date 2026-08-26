import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, Clock, CheckCircle2, XCircle, Folder, Layers, ArrowRight, RotateCcw, Award } from 'lucide-react';
import { GameSetupConfig, Team, AnswerLog, ClassificationCategory, ClassificationItem, Question } from '../../types';
import { soundFx } from '../../utils/audio';

interface ClassificationGameProps {
  config: GameSetupConfig;
  questions?: Question[];
  onGameEnd: (teams: Team[], logs: AnswerLog[]) => void;
}

export const ClassificationGame: React.FC<ClassificationGameProps> = ({
  config,
  onGameEnd,
}) => {
  // Categories & Items from configuration with versatile defaults
  const categories: ClassificationCategory[] = React.useMemo(() => {
    if (config.classificationCategories && config.classificationCategories.length >= 2) {
      return config.classificationCategories;
    }
    return [
      { id: 'cat_1', name: 'Động Vật Có Xương Sống', color: '#E08283', icon: '🦁' },
      { id: 'cat_2', name: 'Động Vật Không Xương Sống', color: '#3B82F6', icon: '🐙' },
    ];
  }, [config.classificationCategories]);

  const allItems: ClassificationItem[] = React.useMemo(() => {
    if (config.classificationItems && config.classificationItems.length > 0) {
      return config.classificationItems;
    }
    return [
      { id: 'item_1', content: 'Chó Corgi', categoryId: 'cat_1' },
      { id: 'item_2', content: 'Cá Heo', categoryId: 'cat_1' },
      { id: 'item_3', content: 'Bạch Tuộc', categoryId: 'cat_2' },
      { id: 'item_4', content: 'Chim Bồ Câu', categoryId: 'cat_1' },
      { id: 'item_5', content: 'Con Sứa Biển', categoryId: 'cat_2' },
      { id: 'item_6', content: 'Con Ong Mật', categoryId: 'cat_2' },
      { id: 'item_7', content: 'Ếch Cây', categoryId: 'cat_1' },
      { id: 'item_8', content: 'Ốc Sên Vườn', categoryId: 'cat_2' },
    ];
  }, [config.classificationItems]);

  // Teams & State
  const [teams, setTeams] = useState<Team[]>(() => {
    if (config.teams && config.teams.length > 0) {
      return config.teams.map(t => ({ ...t, score: 0 }));
    }
    return [{ id: 'team_1', name: 'Đội 1', avatar: '🐉', color: '#ef4444', score: 0 }];
  });
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);

  // Gameplay state
  const [remainingItems, setRemainingItems] = useState<ClassificationItem[]>(() => [...allItems].sort(() => Math.random() - 0.5));
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [classifiedMap, setClassifiedMap] = useState<Record<string, ClassificationItem[]>>(() => {
    const init: Record<string, ClassificationItem[]> = {};
    categories.forEach(c => { init[c.id] = []; });
    return init;
  });

  const [activeFeedback, setActiveFeedback] = useState<{
    type: 'correct' | 'wrong';
    message: string;
    targetCatId?: string;
  } | null>(null);

  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);
  const pointsCorrect = config.pointsPerCorrect ?? 10;
  const pointsWrong = config.pointsPerWrong ?? 5;

  // Timer
  const timeLimit = config.timerEnabled ? (config.timeLimitSeconds || 60) : 0;
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    if (!config.timerEnabled || timeLimit <= 0) return;
    if (remainingItems.length === 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeOut();
          return 0;
        }
        if (prev <= 6) soundFx.timerTick();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [config.timerEnabled, timeLimit, remainingItems.length]);

  const handleTimeOut = () => {
    soundFx.wrong();
    onGameEnd(teams, answerLogs);
  };

  // Drag & Drop or Click-to-Select Logic
  const handleSelectItem = (item: ClassificationItem) => {
    soundFx.buttonClick();
    setSelectedItemId(item.id === selectedItemId ? null : item.id);
  };

  const handlePlaceIntoCategory = (targetCategoryId: string) => {
    if (!selectedItemId) return;
    const currentItem = remainingItems.find(i => i.id === selectedItemId);
    if (!currentItem) return;

    const activeTeam = teams[currentTeamIndex] || teams[0];
    const isCorrect = currentItem.categoryId === targetCategoryId;
    const targetCategory = categories.find(c => c.id === targetCategoryId);
    const correctCategory = categories.find(c => c.id === currentItem.categoryId);

    if (isCorrect) {
      // CORRECT
      soundFx.correct();
      soundFx.powerup();

      // Add to classified bucket & remove from pool
      setClassifiedMap(prev => ({
        ...prev,
        [targetCategoryId]: [...(prev[targetCategoryId] || []), currentItem],
      }));
      const nextRemaining = remainingItems.filter(i => i.id !== currentItem.id);
      setRemainingItems(nextRemaining);
      setSelectedItemId(null);

      // Score
      setTeams(prev => prev.map((t, idx) => {
        if (idx === currentTeamIndex) return { ...t, score: t.score + pointsCorrect };
        return t;
      }));

      // Log
      const log: AnswerLog = {
        questionNumber: allItems.length - nextRemaining.length,
        questionText: `Phân loại đối tượng: "${currentItem.content}"`,
        correctAnswer: correctCategory?.name || 'Chính xác',
        selectedAnswer: targetCategory?.name || 'Nhóm đã chọn',
        isCorrect: true,
        teamName: activeTeam.name,
        teamId: activeTeam.id,
        timestamp: Date.now(),
      };
      setAnswerLogs(prev => [...prev, log]);

      setActiveFeedback({
        type: 'correct',
        message: `Chính xác! "${currentItem.content}" thuộc nhóm ${targetCategory?.name} (+${pointsCorrect}đ)`,
        targetCatId: targetCategoryId,
      });

      // Switch team turn if multiple
      if (teams.length > 1 && nextRemaining.length > 0) {
        setCurrentTeamIndex(prev => (prev + 1) % teams.length);
      }

      // Check if finished
      if (nextRemaining.length === 0) {
        setTimeout(() => {
          soundFx.winFanfare();
          onGameEnd(teams, [...answerLogs, log]);
        }, 800);
      }
    } else {
      // WRONG
      soundFx.wrong();
      setSelectedItemId(null);

      setTeams(prev => prev.map((t, idx) => {
        if (idx === currentTeamIndex) return { ...t, score: Math.max(0, t.score - pointsWrong) };
        return t;
      }));

      const log: AnswerLog = {
        questionNumber: allItems.length - remainingItems.length + 1,
        questionText: `Phân loại đối tượng: "${currentItem.content}"`,
        correctAnswer: correctCategory?.name || 'Chính xác',
        selectedAnswer: targetCategory?.name || 'Nhóm sai',
        isCorrect: false,
        teamName: activeTeam.name,
        teamId: activeTeam.id,
        timestamp: Date.now(),
      };
      setAnswerLogs(prev => [...prev, log]);

      setActiveFeedback({
        type: 'wrong',
        message: `Chưa đúng! "${currentItem.content}" không thuộc nhóm ${targetCategory?.name} (-${pointsWrong}đ)`,
        targetCatId: targetCategoryId,
      });

      if (teams.length > 1) {
        setCurrentTeamIndex(prev => (prev + 1) % teams.length);
      }
    }

    setTimeout(() => setActiveFeedback(null), 2500);
  };

  const activeTeam = teams[currentTeamIndex] || teams[0];

  return (
    <div className="flex-1 flex flex-col items-center w-full max-w-6xl mx-auto select-none px-2 sm:px-4 py-2">
      {/* Top Header Controls: Scores, Progress, Timer */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3 items-center bg-w-bg-card border border-w-border p-3 sm:p-4 rounded-2xl shadow-xs wey-paper-card mb-3">
        {/* Teams Scoreboard */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {teams.map((t, idx) => {
            const isTurn = idx === currentTeamIndex;
            return (
              <div
                key={t.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                  isTurn
                    ? 'bg-w-accent-light border-w-primary-dark shadow-sm scale-105 ring-2 ring-w-primary-dark/30'
                    : 'bg-white border-slate-200 opacity-80'
                }`}
              >
                <span className="text-xl">{t.avatar || '🐉'}</span>
                <div>
                  <div className="text-[11px] font-bold text-w-text-main flex items-center gap-1">
                    {t.name}
                    {isTurn && <span className="w-2 h-2 rounded-full bg-w-primary-dark animate-ping" />}
                  </div>
                  <div className="text-xs font-extrabold text-w-primary-dark">{t.score} đ</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Remaining Items Progress */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-w-accent-light text-w-primary-dark border border-w-accent-border rounded-full text-xs font-bold shadow-2xs">
            <Layers className="w-4 h-4" />
            Đã phân loại: {allItems.length - remainingItems.length} / {allItems.length}
          </span>
        </div>

        {/* Timer */}
        <div className="flex justify-end items-center gap-2">
          {config.timerEnabled && timeLimit > 0 && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-extrabold text-sm ${
              timeLeft <= 10
                ? 'bg-rose-100 border-rose-300 text-rose-700 animate-pulse'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{timeLeft}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Guide Banner */}
      <div className="w-full bg-w-accent-light border border-w-accent-border rounded-2xl px-4 py-2.5 mb-3 flex items-center justify-between gap-2 shadow-2xs text-xs font-bold text-w-text-main">
        <div className="flex items-center gap-2">
          <span className="text-base">💡</span>
          <span>
            {selectedItemId
              ? '👉 Bước 2: Nhấp chọn một NHÓM PHÙ HỢP bên dưới để xếp đối tượng vào.'
              : '👉 Bước 1: Nhấp chọn một ĐỐI TƯỢNG ở ô trung tâm trước.'}
          </span>
        </div>
        <span className="text-[11px] font-extrabold text-w-primary-dark uppercase px-2 py-0.5 bg-white rounded-lg border border-w-accent-border">
          Lượt: {activeTeam.name}
        </span>
      </div>

      {/* Center Carousel: Items to Classify */}
      <div className="w-full bg-w-bg-card border-2 border-w-primary-dark/20 rounded-3xl p-4 sm:p-5 shadow-sm mb-4 wey-paper-card text-center">
        <h3 className="text-xs font-[800] uppercase tracking-wider text-w-text-muted mb-3 flex items-center justify-center gap-1.5">
          <Folder className="w-4 h-4 text-w-primary-dark" />
          Kho Đối Tượng Cần Phân Loại ({remainingItems.length} đối tượng còn lại)
        </h3>

        {remainingItems.length > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 max-h-48 overflow-y-auto p-1">
            {remainingItems.map((item) => {
              const isSelected = item.id === selectedItemId;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`px-4 py-2.5 rounded-2xl font-[800] text-xs sm:text-sm border-2 transition-all transform cursor-pointer flex items-center gap-2 shadow-xs ${
                    isSelected
                      ? 'bg-w-primary-dark text-w-text-main border-[#384C2A] scale-110 ring-4 ring-w-primary-dark/20 shadow-md animate-bounce'
                      : 'bg-white hover:bg-w-bg-tag text-w-text-main border-w-border hover:scale-105 active:scale-95'
                  }`}
                >
                  {item.image && (
                    <img src={item.image} alt="" className="w-6 h-6 object-cover rounded-md" />
                  )}
                  <span>{item.content}</span>
                  {isSelected && <ArrowRight className="w-4 h-4 animate-pulse" />}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-w-primary-dark font-extrabold text-base flex flex-col items-center gap-2">
            <Trophy className="w-10 h-10 text-amber-500 animate-bounce" />
            <span>Chúc mừng! Toàn bộ đối tượng đã được phân loại chính xác!</span>
          </div>
        )}
      </div>

      {/* Target Category Baskets / Trays */}
      <div 
        className="w-full grid gap-4 flex-1"
        style={{
          gridTemplateColumns: categories.length === 2 ? 'repeat(2, 1fr)' : categories.length === 3 ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(240px, 1fr))',
        }}
      >
        {categories.map((category) => {
          const itemsInside = classifiedMap[category.id] || [];
          const isFeedbackTarget = activeFeedback?.targetCatId === category.id;

          return (
            <div
              key={category.id}
              onClick={() => handlePlaceIntoCategory(category.id)}
              className={`flex flex-col rounded-3xl p-4 border-3 transition-all cursor-pointer relative overflow-hidden min-h-[220px] ${
                selectedItemId
                  ? 'border-w-primary-dark bg-w-bg-card hover:bg-[#F4F9EC] hover:scale-102 ring-4 ring-w-primary-dark/10 shadow-lg animate-pulse'
                  : 'border-w-border bg-w-bg-card shadow-xs'
              } ${isFeedbackTarget && activeFeedback?.type === 'wrong' ? 'animate-shake border-rose-500 bg-rose-50' : ''}`}
            >
              {/* Category Header */}
              <div 
                className="flex items-center justify-between gap-2 p-3 rounded-2xl text-w-text-main font-[900] shadow-xs mb-3"
                style={{ backgroundColor: category.color || '#E08283' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl shrink-0">{category.icon || '📁'}</span>
                  <span className="text-xs sm:text-sm truncate">{category.name}</span>
                </div>
                <span className="text-[11px] font-extrabold px-2 py-0.5 bg-white/70 backdrop-blur-sm rounded-full shrink-0">
                  {itemsInside.length} mục
                </span>
              </div>

              {/* Items Classified Inside Tray */}
              <div className="flex-1 bg-[#FAF6EC] rounded-2xl p-2.5 border border-[#E8DFCA] flex flex-wrap gap-1.5 content-start overflow-y-auto max-h-56">
                {itemsInside.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#9CA3AF] text-xs font-bold italic py-6">
                    <span>Thả hoặc chọn vào đây</span>
                  </div>
                ) : (
                  itemsInside.map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-w-border rounded-xl text-xs font-bold text-w-text-main shadow-2xs animate-fade-in"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {item.content}
                    </span>
                  ))
                )}
              </div>

              {/* Click prompt overlay when an item is ready to be dropped */}
              {selectedItemId && (
                <div className="mt-2 text-center text-xs font-[800] text-w-primary-dark bg-w-accent-light py-1.5 rounded-xl border border-w-accent-border">
                  ➕ Nhấp để xếp vào nhóm này
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Feedback Alert */}
      {activeFeedback && (
        <div className="fixed bottom-6 z-50 animate-bounce">
          <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl border-2 font-[800] text-sm ${
            activeFeedback.type === 'correct'
              ? 'bg-w-accent-light text-[#2F4422] border-w-primary-dark'
              : 'bg-rose-100 text-rose-900 border-rose-400'
          }`}>
            {activeFeedback.type === 'correct' ? (
              <CheckCircle2 className="w-5 h-5 text-w-primary-dark" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>{activeFeedback.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
