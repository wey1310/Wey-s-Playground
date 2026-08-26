import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Zap, 
  HelpCircle,
  Gem,
  Package,
  Layers,
  ArrowDown
} from 'lucide-react';
import { GameSetupConfig, Team, AnswerLog, Question } from '../../types';
import { soundFx } from '../../utils/audio';

interface GoldMinerGameProps {
  config: GameSetupConfig;
  questions?: Question[];
  onGameEnd: (teams: Team[], logs: AnswerLog[]) => void;
}

type MineItemType = 'gold_small' | 'gold_med' | 'gold_large' | 'rock_small' | 'rock_large' | 'secret_bag';

interface MineItem {
  id: number;
  type: MineItemType;
  x: number; // percentage from 10% to 90%
  y: number; // percentage from 30% to 90%
  radius: number;
  points: number;
  isCollected: boolean;
  color: string;
  label: string;
  icon: string;
}

export const GoldMinerGame: React.FC<GoldMinerGameProps> = ({
  config,
  questions = [],
  onGameEnd,
}) => {
  // Config
  const goldCount = config.goldCount || 5;
  const rockCount = config.rockCount || 3;
  const hasSecretBag = config.hasSecretBag !== false;
  const secretBagGoldRate = config.secretBagGoldRate || 70; // 70% gold, 30% rock
  const goldMin = config.goldMinScore || 10;
  const goldMax = config.goldMaxScore || 100;
  const rockPenalty = config.rockPenalty || 15;
  const speedSetting = config.hookSpeed || 'medium';
  const timeLimit = config.timeLimitSeconds || 30;

  // Teams
  const [teams, setTeams] = useState<Team[]>(() => {
    if (config.teams && config.teams.length > 0) {
      return config.teams.map(t => ({ ...t, score: t.score || 0 }));
    }
    return [
      { id: 'team-1', name: 'Đội 1', avatar: '🦁', color: '#E08283', score: 0 },
      { id: 'team-2', name: 'Đội 2', avatar: '🐯', color: '#3B82F6', score: 0 },
    ];
  });

  const [currentTeamIndex, setCurrentTeamIndex] = useState<number>(0);
  const activeTeam = teams[currentTeamIndex] || teams[0];

  // Questions
  const safeQuestions = useMemo(() => {
    if (questions && questions.length > 0) return questions;
    return [
      { id: 'q1', content: 'Kim loại nào dẫn điện tốt nhất trong các kim loại dưới đây?', options: ['Bạc', 'Đồng', 'Vàng', 'Nhôm'], correct: 0 },
      { id: 'q2', content: 'Quốc gia nào có diện tích lớn nhất thế giới?', options: ['Nga', 'Canada', 'Trung Quốc', 'Mỹ'], correct: 0 },
      { id: 'q3', content: 'Đỉnh núi Phan Xi Păng (Fansipan) cao bao nhiêu mét?', options: ['3.143m', '3.147m', '2.850m', '3.500m'], correct: 0 },
      { id: 'q4', content: 'Cây quang hợp hấp thụ khí gì và giải phóng khí gì?', options: ['Hấp thụ CO2, nhả O2', 'Hấp thụ O2, nhả CO2', 'Hấp thụ N2, nhả O2', 'Hấp thụ O2, nhả N2'], correct: 0 },
      { id: 'q5', content: 'Số nguyên tố nhỏ nhất là số nào?', options: ['2', '1', '0', '3'], correct: 0 },
      { id: 'q6', content: 'Trận Điện Biên Phủ trên không diễn ra vào năm nào?', options: ['1972', '1975', '1954', '1968'], correct: 0 },
    ];
  }, [questions]);

  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const currentQuestion = safeQuestions[questionIndex % safeQuestions.length];
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);

  // Mine field items
  const [items, setItems] = useState<MineItem[]>([]);
  const [collectedResult, setCollectedResult] = useState<{
    item: MineItem;
    revealedType?: 'gold' | 'rock';
    deltaScore: number;
  } | null>(null);

  // Hook Mechanics
  // Phase: 'question' -> 'aiming' (swinging) -> 'shooting' (extending) -> 'reeling' (returning) -> 'revealing'
  const [clawPhase, setClawPhase] = useState<'question' | 'aiming' | 'shooting' | 'reeling' | 'result'>('question');
  const [hookAngle, setHookAngle] = useState<number>(0); // -65 to +65 deg
  const [hookLength, setHookLength] = useState<number>(40); // px
  const [grabbedItemId, setGrabbedItemId] = useState<number | null>(null);

  const angleDirectionRef = useRef<number>(1);
  const animFrameRef = useRef<number | null>(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState<number>(timeLimit);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Speed multiplier
  const swingSpeed = speedSetting === 'fast' ? 2.5 : speedSetting === 'slow' ? 1.0 : 1.7;

  // Initialize Items in Mine
  const initMineField = () => {
    const newItems: MineItem[] = [];
    let itemId = 1;

    // Helper to generate distinct positions
    const usedPositions: { x: number; y: number }[] = [];
    const getPosition = () => {
      let x = 0, y = 0, valid = false, tries = 0;
      while (!valid && tries < 50) {
        x = 12 + Math.random() * 76; // 12% - 88%
        y = 35 + Math.random() * 55; // 35% - 90%
        valid = usedPositions.every(p => {
          const dx = p.x - x;
          const dy = p.y - y;
          return Math.sqrt(dx * dx + dy * dy) > 14;
        });
        tries++;
      }
      usedPositions.push({ x, y });
      return { x, y };
    };

    // 1. Add Golds
    for (let i = 0; i < goldCount; i++) {
      const pos = getPosition();
      const isLarge = i % 3 === 0;
      const isMed = i % 3 === 1;
      const pts = isLarge ? goldMax : isMed ? Math.floor((goldMin + goldMax) / 2) : goldMin;

      newItems.push({
        id: itemId++,
        type: isLarge ? 'gold_large' : isMed ? 'gold_med' : 'gold_small',
        x: pos.x,
        y: pos.y,
        radius: isLarge ? 28 : isMed ? 22 : 16,
        points: pts,
        isCollected: false,
        color: '#F59E0B',
        label: `+${pts}`,
        icon: isLarge ? '🪙' : '✨',
      });
    }

    // 2. Add Rocks
    for (let i = 0; i < rockCount; i++) {
      const pos = getPosition();
      const isLarge = i % 2 === 0;
      newItems.push({
        id: itemId++,
        type: isLarge ? 'rock_large' : 'rock_small',
        x: pos.x,
        y: pos.y,
        radius: isLarge ? 26 : 18,
        points: -rockPenalty,
        isCollected: false,
        color: '#64748B',
        label: `-${rockPenalty}`,
        icon: '🪨',
      });
    }

    // 3. Add Secret Bag
    if (hasSecretBag) {
      const pos = getPosition();
      newItems.push({
        id: itemId++,
        type: 'secret_bag',
        x: pos.x,
        y: pos.y,
        radius: 24,
        points: 0, // decided on reel up
        isCollected: false,
        color: '#8B5CF6',
        label: 'Túi Bí Mật',
        icon: '🎁',
      });
    }

    setItems(newItems);
    setClawPhase('question');
    setHookAngle(0);
    setHookLength(40);
    setGrabbedItemId(null);
    setCollectedResult(null);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setTimeLeft(timeLimit);
  };

  useEffect(() => {
    initMineField();
  }, [goldCount, rockCount, hasSecretBag]);

  // Hook swinging loop when in 'aiming' phase
  useEffect(() => {
    if (clawPhase !== 'aiming') return;

    const swing = () => {
      setHookAngle(prev => {
        let next = prev + angleDirectionRef.current * swingSpeed;
        if (next >= 65) {
          next = 65;
          angleDirectionRef.current = -1;
        } else if (next <= -65) {
          next = -65;
          angleDirectionRef.current = 1;
        }
        return next;
      });
      animFrameRef.current = requestAnimationFrame(swing);
    };

    animFrameRef.current = requestAnimationFrame(swing);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [clawPhase, swingSpeed]);

  // Question Timer
  useEffect(() => {
    if (clawPhase !== 'question' || isAnswerChecked) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [clawPhase, isAnswerChecked, currentTeamIndex]);

  const handleTimeOut = () => {
    soundFx.wrong();
    setIsAnswerChecked(true);
    const newLog: AnswerLog = {
      questionNumber: questionIndex + 1,
      questionContent: currentQuestion.content,
      selectedAnswer: 'Hết giờ',
      correctAnswer: currentQuestion.options?.[Number(currentQuestion.correct)] || String(currentQuestion.correct),
      teamId: activeTeam.id,
      teamName: activeTeam.name,
      isCorrect: false,
      timestamp: Date.now(),
    };
    setAnswerLogs(prev => [...prev, newLog]);

    setTimeout(() => {
      passToNextTurn();
    }, 2000);
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerChecked || clawPhase !== 'question') return;
    setSelectedOption(idx);
    setIsAnswerChecked(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = idx === Number(currentQuestion.correct);

    const newLog: AnswerLog = {
      questionNumber: questionIndex + 1,
      questionContent: currentQuestion.content,
      selectedAnswer: currentQuestion.options?.[idx] || String(idx),
      correctAnswer: currentQuestion.options?.[Number(currentQuestion.correct)] || String(currentQuestion.correct),
      teamId: activeTeam.id,
      teamName: activeTeam.name,
      isCorrect,
      timestamp: Date.now(),
    };
    setAnswerLogs(prev => [...prev, newLog]);

    if (isCorrect) {
      soundFx.correct();
      // Unlock mining phase
      setTimeout(() => {
        setClawPhase('aiming');
      }, 1000);
    } else {
      soundFx.wrong();
      setTimeout(() => {
        passToNextTurn();
      }, 2000);
    }
  };

  // Launch Hook (Player presses KÉO / HOOK button)
  const handleLaunchHook = () => {
    if (clawPhase !== 'aiming') return;
    soundFx.buttonClick();
    setClawPhase('shooting');

    // Simulate Hook Shooting & Collision Check
    const containerWidth = 600; // virtual units
    const containerHeight = 400; // virtual units
    const originX = 50; // 50%
    const originY = 8; // 8%

    const rad = (hookAngle + 90) * (Math.PI / 180);
    let curLen = 40;
    const maxLen = 450;
    const shootStep = 8;

    let hitItem: MineItem | null = null;

    const shootInterval = setInterval(() => {
      curLen += shootStep;
      setHookLength(curLen);

      // Compute tip coords in %
      const tipX = originX + (Math.cos(rad) * curLen) / (containerWidth / 100);
      const tipY = originY + (Math.sin(rad) * curLen) / (containerHeight / 100);

      // Check collision with uncollected items
      const uncollected = items.filter(it => !it.isCollected);
      for (const item of uncollected) {
        const dx = tipX - item.x;
        const dy = tipY - item.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 6) { // hit radius
          hitItem = item;
          break;
        }
      }

      // Check wall boundary or hit
      if (hitItem || curLen >= maxLen || tipX <= 4 || tipX >= 96 || tipY >= 95) {
        clearInterval(shootInterval);
        reelBack(hitItem);
      }
    }, 25);
  };

  // Reel back hook
  const reelBack = (hitItem: MineItem | null) => {
    setClawPhase('reeling');
    if (hitItem) {
      setGrabbedItemId(hitItem.id);
      soundFx.pointBeep();
    }

    const reelStep = hitItem && (hitItem.type.includes('large') || hitItem.type.includes('rock')) ? 5 : 8;

    const reelInterval = setInterval(() => {
      setHookLength(prev => {
        if (prev <= 45) {
          clearInterval(reelInterval);
          finalizeReel(hitItem);
          return 40;
        }
        return prev - reelStep;
      });
    }, 25);
  };

  // Finalize reel and award score / penalties
  const finalizeReel = (hitItem: MineItem | null) => {
    setGrabbedItemId(null);

    if (!hitItem) {
      // Empty hook
      soundFx.wrong();
      setClawPhase('result');
      setTimeout(() => {
        passToNextTurn();
      }, 1500);
      return;
    }

    // Mark collected
    setItems(prev => prev.map(it => it.id === hitItem.id ? { ...it, isCollected: true } : it));

    let finalPoints = hitItem.points;
    let revealedType: 'gold' | 'rock' | undefined = undefined;

    if (hitItem.type === 'secret_bag') {
      const isGold = Math.random() * 100 < secretBagGoldRate;
      revealedType = isGold ? 'gold' : 'rock';
      finalPoints = isGold ? Math.floor((goldMin + goldMax) / 2) : -rockPenalty;
    }

    if (finalPoints > 0) {
      soundFx.victory();
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    } else {
      soundFx.laser();
    }

    setCollectedResult({
      item: hitItem,
      revealedType,
      deltaScore: finalPoints,
    });

    // Update team score
    setTeams(prev => prev.map(t => {
      if (t.id === activeTeam.id) {
        return { ...t, score: Math.max(0, t.score + finalPoints) };
      }
      return t;
    }));

    setClawPhase('result');

    setTimeout(() => {
      passToNextTurn();
    }, 2800);
  };

  const passToNextTurn = () => {
    setClawPhase('question');
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setCollectedResult(null);
    setHookLength(40);
    setHookAngle(0);
    setQuestionIndex(prev => prev + 1);
    setCurrentTeamIndex(prev => (prev + 1) % teams.length);
    setTimeLeft(timeLimit);
  };

  const handleFinishGame = () => {
    onGameEnd(teams, answerLogs);
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-between p-3 sm:p-5 max-w-6xl mx-auto select-none">
      {/* Scoreboard Header */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/90 backdrop-blur-sm p-4 rounded-3xl border-2 border-w-border shadow-sm mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl shadow-xs">
            ⛏️
          </div>
          <div>
            <h1 className="text-xl font-[900] text-w-text-main flex items-center gap-2">
              Đào Vàng Tri Thức
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                Mỏ Vàng Hoàng Kim
              </span>
            </h1>
            <p className="text-xs font-bold text-w-text-muted">
              Trả lời đúng để kích hoạt Móc Neo • Canh chuẩn thời điểm bấm KÉO để giật vàng
            </p>
          </div>
        </div>

        {/* Score display */}
        <div className="flex items-center gap-3">
          {teams.map((t, idx) => (
            <div
              key={t.id}
              className={`px-4 py-2 rounded-2xl border-2 transition-all flex items-center gap-2.5 ${
                idx === currentTeamIndex
                  ? 'bg-w-accent-light border-w-primary-dark shadow-md scale-105 ring-2 ring-w-primary-dark/20'
                  : 'bg-w-bg-card border-w-border'
              }`}
            >
              <span className="text-xl">{t.avatar}</span>
              <div>
                <span className="text-xs font-black text-w-text-main block">{t.name}</span>
                <span className="text-sm font-[900] text-w-primary-dark">{t.score} điểm</span>
              </div>
            </div>
          ))}

          <button
            onClick={handleFinishGame}
            className="px-3.5 py-2 bg-w-primary-dark hover:bg-[#3D522F] text-w-text-main text-xs font-black rounded-xl shadow-xs transition"
          >
            Tổng Kết
          </button>
        </div>
      </div>

      {/* Main Grid: Left Question, Right Mine Stage */}
      <div className="w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Question Box */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-white rounded-3xl p-5 border-2 border-w-border shadow-sm min-h-[380px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-w-border mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-w-accent-light text-w-primary-dark border border-w-accent-border">
                  Câu {questionIndex + 1}
                </span>
                <span className="text-xs font-bold text-w-text-muted">
                  Lượt của: <strong className="text-w-primary-dark">{activeTeam.name}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>{timeLeft}s</span>
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-[800] text-w-text-main leading-snug mb-4">
              {currentQuestion.content}
            </h3>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-2.5 my-auto">
            {currentQuestion.options?.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === Number(currentQuestion.correct);
              let btnClass = 'bg-w-bg-card hover:bg-[#F8F4E6] text-w-text-main border-w-border';

              if (isAnswerChecked) {
                if (isCorrect) {
                  btnClass = 'bg-emerald-100 border-emerald-500 text-emerald-950 font-black ring-2 ring-emerald-400';
                } else if (isSelected && !isCorrect) {
                  btnClass = 'bg-red-100 border-red-400 text-red-950 font-bold';
                } else {
                  btnClass = 'bg-slate-50 border-slate-200 text-w-text-muted opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswerChecked || clawPhase !== 'question'}
                  className={`w-full p-3 text-left text-sm rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${btnClass}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-white border border-w-border flex items-center justify-center text-xs font-black text-w-primary-dark">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-bold">{opt}</span>
                  </div>
                  {isAnswerChecked && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  {isAnswerChecked && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                </button>
              );
            })}
          </div>

          {/* Bottom Prompt / Hook Button */}
          <div className="mt-4 pt-3 border-t border-w-border text-center">
            {clawPhase === 'aiming' ? (
              <button
                onClick={handleLaunchHook}
                className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-600 hover:to-yellow-500 text-amber-950 text-base font-[900] rounded-2xl shadow-lg border-2 border-amber-600 animate-bounce cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowDown className="w-5 h-5" />
                <span>BẤM ĐÂY ĐỂ THẢ MÓC KÉO VÀNG!</span>
              </button>
            ) : clawPhase === 'shooting' || clawPhase === 'reeling' ? (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-black animate-pulse">
                Đang kéo vật thể... Hãy chờ xem!
              </div>
            ) : isAnswerChecked ? (
              <div className="p-2.5 bg-red-50 border border-red-300 rounded-xl text-red-800 text-xs font-bold">
                Chưa chính xác! Mất lượt đào vàng, chuyển đội kế tiếp...
              </div>
            ) : (
              <p className="text-[11px] font-bold text-w-text-muted">
                Chọn đáp án đúng để nhận quyền thả móc đào vàng!
              </p>
            )}
          </div>
        </div>

        {/* Right: Underground Gold Mine Stage */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-gradient-to-b from-[#8E6F52] via-[#634832] to-[#3D2817] rounded-3xl p-5 border-4 border-[#301F12] shadow-inner min-h-[420px] relative overflow-hidden">
          {/* Top Platform / Surface */}
          <div className="w-full flex items-center justify-between z-10 bg-[#301F12]/80 px-4 py-2 rounded-2xl border border-amber-900/50 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
              <span>Độ sâu: Mỏ Vàng Tầng 1</span>
              <span>•</span>
              <span>Còn lại: {items.filter(i => !i.isCollected).length} vật phẩm</span>
            </div>
            <button
              onClick={initMineField}
              className="px-2.5 py-1 bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-800 text-[11px] font-bold rounded-lg transition flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Đào Mỏ Mới</span>
            </button>
          </div>

          {/* Hook Crane System at Center Top */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
            {/* Crane Base */}
            <div className="w-12 h-6 bg-w-accent-light border-2 border-slate-500 rounded-t-lg flex items-center justify-center text-xs text-amber-600 font-black shadow-md">
              ⚙️
            </div>

            {/* Rotating Hook Pivot */}
            <div
              className="origin-top flex flex-col items-center transition-transform"
              style={{
                transform: `rotate(${hookAngle}deg)`,
              }}
            >
              {/* Cable Line */}
              <div 
                className="w-1 bg-amber-200/90 shadow-sm transition-all"
                style={{ height: `${hookLength}px` }}
              />

              {/* Hook Claw Head */}
              <div className="relative -mt-1 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-amber-300 flex items-center justify-center text-xs shadow-lg">
                  ⚓
                </div>

                {/* Attached item during reeling */}
                {grabbedItemId && (
                  <div className="absolute top-6 animate-bounce">
                    {(() => {
                      const item = items.find(it => it.id === grabbedItemId);
                      if (!item) return null;
                      return (
                        <div className="px-2 py-1 bg-amber-400 text-amber-950 text-xs font-black rounded-lg shadow-md border border-amber-600">
                          {item.icon} {item.label}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Underground Terrain with scattered Items */}
          <div className="w-full flex-1 relative my-4">
            {items.map(item => {
              if (item.isCollected && grabbedItemId !== item.id) return null;

              return (
                <div
                  key={item.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all flex flex-col items-center justify-center ${
                    item.isCollected ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
                  }`}
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                  }}
                >
                  <div
                    className={`rounded-2xl border-2 flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${
                      item.type.includes('gold')
                        ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-500 border-amber-200 text-amber-950'
                        : item.type.includes('rock')
                        ? 'bg-gradient-to-br from-slate-500 to-stone-700 border-stone-400 text-stone-100'
                        : 'bg-gradient-to-br from-purple-400 to-indigo-600 border-purple-200 text-w-text-main'
                    }`}
                    style={{
                      width: `${item.radius * 2}px`,
                      height: `${item.radius * 2}px`,
                    }}
                  >
                    <span className="text-base sm:text-xl drop-shadow-xs">{item.icon}</span>
                  </div>
                  <span className="text-[10px] font-black text-amber-200 mt-0.5 bg-white/70 backdrop-blur-sm px-1.5 rounded">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Result Banner Overlay */}
          <AnimatePresence>
            {collectedResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`w-full z-30 p-3 rounded-2xl border-2 flex items-center justify-between shadow-xl ${
                  collectedResult.deltaScore > 0
                    ? 'bg-amber-100 border-amber-400 text-amber-950'
                    : 'bg-red-100 border-red-400 text-red-950'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl">
                    {collectedResult.deltaScore > 0 ? '🏆' : '🪨'}
                  </span>
                  <div>
                    <h4 className="text-sm font-[900]">
                      {collectedResult.deltaScore > 0
                        ? `KÉO ĐƯỢC VÀNG! +${collectedResult.deltaScore} ĐIỂM!`
                        : `TRÚNG PHẢI ĐÁ! Trừ ${Math.abs(collectedResult.deltaScore)} điểm!`}
                    </h4>
                    {collectedResult.item.type === 'secret_bag' && (
                      <p className="text-xs font-bold text-purple-700">
                        🎁 Mở Túi Bí Mật: {collectedResult.revealedType === 'gold' ? 'Ra Vàng Quý!' : 'Ra Đá Nặng!'}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-black px-3 py-1.5 rounded-xl bg-white border border-current">
                  {collectedResult.deltaScore > 0 ? `+${collectedResult.deltaScore} Đ` : `${collectedResult.deltaScore} Đ`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
