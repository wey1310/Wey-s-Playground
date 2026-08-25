import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Trophy, RotateCcw, Volume2, VolumeX, Eye, EyeOff, 
  HelpCircle, Clock, ChevronRight, CheckCircle, XCircle, 
  Sparkles, Dices, Shield, Waves, Mountain, Crown, Swords, Zap
} from 'lucide-react';
import { GameSetupConfig, Question, AnswerLog, Team } from '../../types';
import { soundFx } from '../../utils/audio';

interface SonTinhThuyTinhGameProps {
  config: GameSetupConfig;
  questions?: Question[];
  onEndGame?: (finalScores: Record<string, number>, logs?: AnswerLog[]) => void;
  onRunOutOfQuestions?: () => void;
  onUpdateScore?: (teamId: string, delta: number) => void;
}

import { SonTinhThuyTinhBoard } from './SonTinhThuyTinhBoard';

export type Faction = 'sontinh' | 'thuytinh';

export interface SinhLeItem {
  id: 'voi_9_nga' | 'ga_9_cua' | 'ngua_9_hong_mao';
  name: string;
  icon: string;
  tilePosition: number;
  isCollected: boolean;
  collectedByTeamId?: string;
  isOfferedToKing: boolean;
}

export interface TeamState {
  id: string;
  name: string;
  color: string;
  avatar: string;
  faction: Faction;
  position: number; // 1 to totalTiles
  actionPoints: number; // AP to spend per turn
  sinhLeInventory: SinhLeItem['id'][];
  offeredCount: number;
  score: number;
}

export interface MapTile {
  id: number;
  name: string;
  type: 'mountain' | 'water' | 'plain' | 'palace';
  isFlooded: boolean;
  hasStoneWall: boolean;
  sinhLeId?: SinhLeItem['id'];
}

export const SonTinhThuyTinhGame: React.FC<SonTinhThuyTinhGameProps> = ({
  config,
  questions = [],
  onEndGame,
  onRunOutOfQuestions,
  onUpdateScore
}) => {
  const totalTiles = 24;
  const initialTeams: Team[] = config.teams && config.teams.length >= 2
    ? config.teams
    : [
        { id: 'team_st', name: 'Sơn Tinh (Thần Núi) 🏔️', color: '#4F683C', avatar: '🏔️', score: 0 },
        { id: 'team_tt', name: 'Thủy Tinh (Thần Nước) 🌊', color: '#2563EB', avatar: '🌊', score: 0 },
      ];

  // Map Tile Generation
  const initialTiles: MapTile[] = React.useMemo(() => {
    const tiles: MapTile[] = [];
    for (let i = 1; i <= totalTiles; i++) {
      if (i === 1 || i === 13) {
        tiles.push({ id: i, name: i === 1 ? 'Cung Điện Vua Hùng' : 'Đại Điện Phong Châu', type: 'palace', isFlooded: false, hasStoneWall: false });
      } else if (i >= 2 && i <= 7) {
        tiles.push({ id: i, name: `Núi Tản Viên #${i}`, type: 'mountain', isFlooded: false, hasStoneWall: false });
      } else if (i >= 8 && i <= 12) {
        tiles.push({ id: i, name: `Đồng Bằng #${i}`, type: 'plain', isFlooded: false, hasStoneWall: false });
      } else if (i >= 14 && i <= 19) {
        tiles.push({ id: i, name: `Biển Đông #${i}`, type: 'water', isFlooded: true, hasStoneWall: false });
      } else {
        tiles.push({ id: i, name: `Thung Lũng #${i}`, type: 'plain', isFlooded: false, hasStoneWall: false });
      }
    }
    return tiles;
  }, [totalTiles]);

  const [mapTiles, setMapTiles] = useState<MapTile[]>(initialTiles);

  // 3 Sacred Sinh Le Items
  const [sinhLeList, setSinhLeList] = useState<SinhLeItem[]>([
    { id: 'voi_9_nga', name: 'Voi 9 Ngà', icon: '🐘', tilePosition: 5, isCollected: false, isOfferedToKing: false },
    { id: 'ga_9_cua', name: 'Gà 9 Cựa', icon: '🐓', tilePosition: 10, isCollected: false, isOfferedToKing: false },
    { id: 'ngua_9_hong_mao', name: 'Ngựa 9 Hồng Mao', icon: '🐎', tilePosition: 18, isCollected: false, isOfferedToKing: false },
  ]);

  // Teams State
  const [teams, setTeams] = useState<TeamState[]>(() =>
    initialTeams.map((t, idx) => ({
      id: t.id,
      name: t.name,
      color: t.color || (idx % 2 === 0 ? '#4F683C' : '#2563EB'),
      avatar: t.avatar || (idx % 2 === 0 ? '🏔️' : '🌊'),
      faction: idx % 2 === 0 ? 'sontinh' : 'thuytinh',
      position: idx % 2 === 0 ? 1 : 13,
      actionPoints: 0,
      sinhLeInventory: [],
      offeredCount: 0,
      score: 0,
    }))
  );

  const [currentTeamIndex, setCurrentTeamIndex] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const maxRounds = config.stttMaxRounds || 10;
  const [waterLevel, setWaterLevel] = useState<number>(1);

  // Turn Stages: 'question' -> 'action_menu' -> 'gameover'
  const [turnStage, setTurnStage] = useState<'question' | 'action_menu' | 'gameover'>('question');

  // Question Handling
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [usedQuestionIndices, setUsedQuestionIndices] = useState<number[]>([]);
  const [questionNumber, setQuestionNumber] = useState<number>(1);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);

  // Dice & Notification
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRollingDice, setIsRollingDice] = useState<boolean>(false);
  const [actionLogText, setActionLogText] = useState<string>('Chào mừng đến với Đại Chiến Sơn Tinh – Thủy Tinh!');

  // Timer
  const [timeLeft, setTimeLeft] = useState<number>(config.timeLimitSeconds || 30);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const currentTeam = teams[currentTeamIndex] || teams[0];

  // Pick Next Question
  const pickNewQuestion = () => {
    if (config.mode === 'none') {
      setTurnStage('action_menu');
      return;
    }

    let chosen: Question;
    if (questions.length > 0) {
      let availableIndices = questions.map((_, i) => i).filter(i => !usedQuestionIndices.includes(i));
      if (availableIndices.length === 0) {
        if (onRunOutOfQuestions) {
          onRunOutOfQuestions();
          return;
        } else {
          availableIndices = questions.map((_, i) => i);
          setUsedQuestionIndices([]);
        }
      }
      const randomIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      setUsedQuestionIndices(prev => [...prev, randomIdx]);
      chosen = questions[randomIdx];
    } else {
      const qNum = questionNumber;
      chosen = {
        id: `sttt_q_${qNum}`,
        type: 'mcq',
        content: `Câu hỏi thử thách số ${qNum}: Hãy chọn phương án chính xác để nhận Điểm Thần Lực (AP) & thi triển thần phép!`,
        options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
        correct: 0,
        explanation: 'Giáo viên đối chiếu đáp án với tài liệu học tập.'
      };
    }

    setCurrentQuestion(chosen);
    setSelectedOption(null);
    setShowAnswer(false);
    setTimeLeft(config.timeLimitSeconds || 30);
    setIsTimerRunning(config.timerEnabled !== false);
    setTurnStage('question');
  };

  useEffect(() => {
    pickNewQuestion();
  }, []);

  useEffect(() => {
    if (config.mode === 'none' && turnStage === 'question') {
      setTurnStage('action_menu');
    }
  }, [config.mode, turnStage]);

  // Timer Tick
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          soundFx.play('wrong');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Answer Submit
  const handleAnswerSubmit = (isCorrect: boolean) => {
    if (!currentQuestion || !currentTeam) return;
    setIsTimerRunning(false);
    setShowAnswer(true);

    const log: AnswerLog = {
      questionId: currentQuestion.id,
      questionContent: currentQuestion.content,
      selectedAnswer: selectedOption !== null && currentQuestion.options ? currentQuestion.options[selectedOption] : (isCorrect ? 'Đúng' : 'Sai'),
      correctAnswer: typeof currentQuestion.correct === 'number' && currentQuestion.options ? currentQuestion.options[currentQuestion.correct] : String(currentQuestion.correct),
      isCorrect,
      timestamp: Date.now(),
      teamId: currentTeam.id,
      teamName: currentTeam.name
    };
    setAnswerLogs(prev => [...prev, log]);

    if (isCorrect) {
      soundFx.play('correct');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      const earnedAp = 3;
      setTeams(prev => prev.map((t, idx) => idx === currentTeamIndex ? { ...t, actionPoints: t.actionPoints + earnedAp } : t));
      setActionLogText(`🎉 ${currentTeam.name} trả lời ĐÚNG! Nhận +${earnedAp} Điểm Thần Lực (AP) để thực hiện chiến thuật.`);
      setTurnStage('action_menu');
    } else {
      soundFx.play('wrong');
      setActionLogText(`❌ ${currentTeam.name} trả lời CHƯA ĐÚNG! Mất lượt hành động trong hiệp này.`);
      setTimeout(() => {
        handleEndTurn();
      }, 1800);
    }
  };

  // ACTION 1: ROLL DICE & MOVE (Costs 1 AP)
  const handleMoveAction = () => {
    if (currentTeam.actionPoints < 1 || isRollingDice) return;
    setIsRollingDice(true);
    soundFx.play('cardFlip');

    let count = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 8) {
        clearInterval(interval);
        const rolled = Math.floor(Math.random() * 6) + 1;
        setDiceValue(rolled);
        setIsRollingDice(false);
        soundFx.play('correct');

        let newPos = currentTeam.position + rolled;
        if (newPos > totalTiles) {
          newPos = newPos % totalTiles || totalTiles;
        }

        // Deduct 1 AP and update position
        setTeams(prev => prev.map((t, idx) => {
          if (idx === currentTeamIndex) {
            return {
              ...t,
              position: newPos,
              actionPoints: t.actionPoints - 1
            };
          }
          return t;
        }));

        // Check if landed on Sinh Le tile
        const foundItem = sinhLeList.find(s => s.tilePosition === newPos && !s.isCollected);
        if (foundItem) {
          soundFx.play('bonus');
          confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
          setSinhLeList(prev => prev.map(s => s.id === foundItem.id ? { ...s, isCollected: true, collectedByTeamId: currentTeam.id } : s));
          setTeams(prev => prev.map((t, idx) => {
            if (idx === currentTeamIndex) {
              return {
                ...t,
                sinhLeInventory: [...t.sinhLeInventory, foundItem.id],
                score: t.score + 20
              };
            }
            return t;
          }));
          setActionLogText(`✨ TUYỆT VỜI! ${currentTeam.name} đã tìm thấy ${foundItem.icon} ${foundItem.name}! (+20đ)`);
        } else {
          setActionLogText(`🚶 ${currentTeam.name} di chuyển đến ô #${newPos} (${mapTiles[newPos - 1]?.name}).`);
        }
      }
    }, 70);
  };

  // ACTION 2: CAST FACTION MAGIC (Costs 2 AP)
  const handleCastMagic = () => {
    if (currentTeam.actionPoints < 2) return;
    soundFx.play('bonus');

    if (currentTeam.faction === 'sontinh') {
      // Sơn Tinh Skill: DÂNG NÚI / ĐẮP LŨY ĐÁ
      confetti({ particleCount: 40, colors: ['#4F683C', '#8D5B4C', '#E9D58F'] });
      // Clear floods on current or adjacent tile and build stone wall
      const targetPos = currentTeam.position;
      setMapTiles(prev => prev.map(tile => {
        if (tile.id === targetPos || tile.id === (targetPos % totalTiles + 1)) {
          return { ...tile, isFlooded: false, hasStoneWall: true };
        }
        return tile;
      }));
      setTeams(prev => prev.map((t, idx) => idx === currentTeamIndex ? { ...t, actionPoints: t.actionPoints - 2, score: t.score + 15 } : t));
      setActionLogText(`🏔️ SƠN TINH DÂNG NÚI! Đắp lũy đá kiên cố tại ô #${targetPos}, ngăn chặn nước lũ! (+15đ)`);
    } else {
      // Thủy Tinh Skill: DÂNG NƯỚC LŨ / CUỒNG PHONG
      confetti({ particleCount: 40, colors: ['#2563EB', '#60A5FA', '#93C5FD'] });
      const targetPos = currentTeam.position;
      setMapTiles(prev => prev.map(tile => {
        if (tile.id === targetPos || tile.id === (targetPos % totalTiles + 1)) {
          return { ...tile, isFlooded: true, hasStoneWall: false };
        }
        return tile;
      }));
      setWaterLevel(prev => Math.min(prev + 1, 5));
      setTeams(prev => prev.map((t, idx) => idx === currentTeamIndex ? { ...t, actionPoints: t.actionPoints - 2, score: t.score + 15 } : t));
      setActionLogText(`🌊 THỦY TINH DÂNG NƯỚC! Nước lũ dâng cao ngập ô #${targetPos}! Mực nước cấp ${Math.min(waterLevel + 1, 5)}! (+15đ)`);
    }
  };

  // ACTION 3: OFFER SINH LE TO KING (At Palace tiles 1 or 13, Costs 1 AP)
  const handleOfferSinhLe = () => {
    const isAtPalace = currentTeam.position === 1 || currentTeam.position === 13;
    if (!isAtPalace || currentTeam.sinhLeInventory.length === 0 || currentTeam.actionPoints < 1) return;

    soundFx.play('victory');
    confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });

    const offeredItems = [...currentTeam.sinhLeInventory];
    const bonusScore = offeredItems.length * 50;

    setSinhLeList(prev => prev.map(s => offeredItems.includes(s.id) ? { ...s, isOfferedToKing: true } : s));
    
    setTeams(prev => prev.map((t, idx) => {
      if (idx === currentTeamIndex) {
        const nextOffered = t.offeredCount + offeredItems.length;
        if (onUpdateScore) {
          onUpdateScore(t.id, bonusScore);
        }
        return {
          ...t,
          sinhLeInventory: [],
          offeredCount: nextOffered,
          score: t.score + bonusScore,
          actionPoints: t.actionPoints - 1
        };
      }
      return t;
    }));

    setActionLogText(`👑 VUA HÙNG TIẾP NHẬN SÍNH LỄ! ${currentTeam.name} đã cống nạp ${offeredItems.length} Sính Lễ quý báu! (+${bonusScore}đ)`);

    // Check if team offered all 3 sinh le
    const totalOfferedByThisTeam = currentTeam.offeredCount + offeredItems.length;
    if (totalOfferedByThisTeam >= 3) {
      setTimeout(() => {
        soundFx.play('victory');
        setTurnStage('gameover');
      }, 1000);
    }
  };

  // End Current Turn & Pass to Next Team
  const handleEndTurn = () => {
    const nextIdx = (currentTeamIndex + 1) % teams.length;
    if (nextIdx === 0) {
      const nextRound = currentRound + 1;
      setCurrentRound(nextRound);
      if (nextRound > maxRounds) {
        soundFx.play('victory');
        setTurnStage('gameover');
        return;
      }
    }

    setCurrentTeamIndex(nextIdx);
    setQuestionNumber(prev => prev + 1);
    setDiceValue(null);
    pickNewQuestion();
  };

  // Restart Round
  const handleRestart = () => {
    setTeams(initialTeams.map((t, idx) => ({
      id: t.id,
      name: t.name,
      color: t.color || (idx % 2 === 0 ? '#4F683C' : '#2563EB'),
      avatar: t.avatar || (idx % 2 === 0 ? '🏔️' : '🌊'),
      faction: idx % 2 === 0 ? 'sontinh' : 'thuytinh',
      position: idx % 2 === 0 ? 1 : 13,
      actionPoints: 0,
      sinhLeInventory: [],
      offeredCount: 0,
      score: 0,
    })));
    setSinhLeList([
      { id: 'voi_9_nga', name: 'Voi 9 Ngà', icon: '🐘', tilePosition: 5, isCollected: false, isOfferedToKing: false },
      { id: 'ga_9_cua', name: 'Gà 9 Cựa', icon: '🐓', tilePosition: 10, isCollected: false, isOfferedToKing: false },
      { id: 'ngua_9_hong_mao', name: 'Ngựa 9 Hồng Mao', icon: '🐎', tilePosition: 18, isCollected: false, isOfferedToKing: false },
    ]);
    setMapTiles(initialTiles);
    setCurrentTeamIndex(0);
    setCurrentRound(1);
    setWaterLevel(1);
    setQuestionNumber(1);
    setDiceValue(null);
    pickNewQuestion();
  };

  const handleEndGame = () => {
    if (onEndGame) {
      const finalScores: Record<string, number> = {};
      teams.forEach(t => {
        finalScores[t.id] = t.score + t.offeredCount * 50;
      });
      onEndGame(finalScores, answerLogs);
    }
  };

  const winningTeam = [...teams].sort((a, b) => (b.score + b.offeredCount * 50) - (a.score + a.offeredCount * 50))[0];

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col min-h-screen bg-[#F4F8F1] text-slate-800 select-none pb-12">
      
      {/* HEADER BAR */}
      <header className="bg-white border-b-2 border-[#DCEBCB] px-4 py-3 sm:px-6 shadow-xs sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#4F683C] to-[#2563EB] text-white flex items-center justify-center text-xl shadow-xs">
            ⚔️
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-[#35452E] flex items-center gap-2">
              <span>SƠN TINH – THỦY TINH</span>
              <span className="text-xs px-2.5 py-0.5 bg-[#E9F0D9] text-[#4F683C] rounded-full font-extrabold uppercase tracking-wide border border-[#B9CDA0]">
                Boardgame Chiến Thuật
              </span>
            </h1>
            <p className="text-xs text-[#74806B] font-semibold">
              Hiệp đấu: <strong className="text-[#35452E] font-black">{currentRound}/{maxRounds}</strong> | Mực Nước Lũ: <strong className="text-blue-600 font-black">Cấp {waterLevel} 🌊</strong>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-white border border-[#DCEBCB] hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="Bật/Tắt âm thanh"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#4F683C]" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chơi Lại</span>
          </button>

          <button
            type="button"
            onClick={handleEndGame}
            className="px-3.5 py-1.5 bg-[#4F683C] hover:bg-[#3D522B] text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer"
          >
            Tổng Kết
          </button>
        </div>
      </header>

      {/* SACRED SINH LE TRACKER BAR */}
      <div className="px-4 py-2.5 sm:px-6 bg-[#FAF7EE] border-b border-[#E3DCBA] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[#74806B]">
          <Crown className="w-4 h-4 text-amber-500" />
          <span>SÍNH LỄ HÙNG VƯƠNG:</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {sinhLeList.map(item => (
            <div
              key={item.id}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-2 border-2 transition ${
                item.isOfferedToKing
                  ? 'bg-amber-100 border-amber-400 text-amber-900 ring-1 ring-amber-400'
                  : item.isCollected
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                  : 'bg-white border-slate-300 text-slate-600'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.name}</span>
              <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded-md bg-black/5">
                {item.isOfferedToKing ? 'Đã Cống Nạp 👑' : item.isCollected ? 'Đang Giữ 🎒' : `Ô #${item.tilePosition}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* TEAMS STATUS BAR */}
      <div className="px-4 py-3 sm:px-6 bg-[#F4F8F1] border-b border-[#DCEBCB]">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {teams.map((t, idx) => {
            const isTurn = idx === currentTeamIndex && turnStage !== 'gameover';
            const isSonTinh = t.faction === 'sontinh';

            return (
              <div
                key={t.id}
                className={`p-3 rounded-2xl border-2 transition-all relative overflow-hidden ${
                  isTurn
                    ? 'bg-white border-[#4F683C] shadow-lg ring-2 ring-[#4F683C]/30 scale-[1.02]'
                    : 'bg-white border-[#DCEBCB] shadow-2xs'
                }`}
              >
                {isTurn && (
                  <div className="absolute top-1.5 right-2 px-2 py-0.2 bg-[#4F683C] text-white text-[9px] font-black rounded-full uppercase tracking-wider animate-pulse">
                    Đến Lượt
                  </div>
                )}

                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black shrink-0 border"
                    style={{ backgroundColor: `${t.color}20`, borderColor: t.color }}
                  >
                    {t.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold text-[#35452E] truncate">{t.name}</div>
                    <div className="text-[11px] font-bold text-[#74806B] flex items-center gap-2">
                      <span>Ô: <strong>#{t.position}</strong></span>
                      <span>•</span>
                      <span className="text-[#4F683C] font-black">AP: {t.actionPoints} ⚡</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                  <div className="text-amber-700">
                    👑 Cống nạp: <strong>{t.offeredCount}/3</strong>
                  </div>
                  <div className="text-[#4F683C] font-black">
                    {t.score}đ
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTAINER: BOARD + ACTION CONSOLE */}
      <div className="flex-1 px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: THE PHONG CHAU STRATEGIC MAP (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 border-2 border-[#DCEBCB] shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#DCEBCB]">
            <div className="flex items-center gap-2">
              <span className="text-xl">🗺️</span>
              <div>
                <h3 className="text-sm font-black text-[#35452E] uppercase tracking-wide">
                  Bản Đồ Phong Châu – Núi Tản & Biển Đông
                </h3>
                <p className="text-[11px] text-[#74806B] font-semibold">
                  Di chuyển để tìm Sính Lễ và cống nạp tại Cung Điện Hùng Vương (Ô #1 hoặc #13)
                </p>
              </div>
            </div>
            <div className="text-xs font-bold px-2.5 py-1 bg-[#E9F0D9] text-[#4F683C] rounded-xl border border-[#B9CDA0]">
              24 Ô Chiến Lược
            </div>
          </div>

          {/* Map Grid */}
          <div className="flex-1 min-h-[400px]">
            <SonTinhThuyTinhBoard 
              mapTiles={mapTiles}
              teams={teams}
              sinhLeList={sinhLeList}
              currentTeamIndex={currentTeamIndex}
              waterLevel={waterLevel}
            />
          </div>

          {/* Map Legend */}
          <div className="mt-3 pt-3 border-t border-[#DCEBCB] flex flex-wrap gap-4 text-xs font-semibold text-[#74806B]">
            <div className="flex items-center gap-1.5">
              <span>👑 Ô Cung Điện (Cống Nạp)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>🏔️ Vùng Núi Tản Viên</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>🌊 Vùng Biển / Ngập Lũ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>🛡️ Lũy Đá Phòng Thủ</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTION & QUESTION CONSOLE (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* ACTION LOG BANNER */}
          <motion.div
            key={actionLogText}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-3xl border-2 border-[#DCEBCB] bg-white shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl mt-0.5">📜</div>
              <div className="text-xs sm:text-sm font-bold text-[#35452E] leading-relaxed">
                {actionLogText}
              </div>
            </div>
          </motion.div>

          {/* STAGE 1: QUESTION PHASE */}
          {turnStage === 'question' && currentQuestion && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#DCEBCB] shadow-sm space-y-4 flex-1 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#DCEBCB]">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                      style={{ backgroundColor: `${currentTeam.color}25` }}
                    >
                      {currentTeam.avatar}
                    </div>
                    <div>
                      <div className="text-[10px] font-extrabold uppercase text-[#74806B]">Thử Thách Lượt:</div>
                      <div className="text-sm font-black text-[#35452E]">{currentTeam.name}</div>
                    </div>
                  </div>

                  {config.timerEnabled !== false && (
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border-2 ${
                      timeLeft <= 5 ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse' : 'bg-[#E9F0D9] border-[#B9CDA0] text-[#4F683C]'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timeLeft}s</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <div className="text-[11px] font-extrabold text-[#74806B] uppercase tracking-wider">
                    Câu hỏi #{questionNumber} (Nhận +3 Điểm Thần Lực AP nếu đúng)
                  </div>
                  <p className="text-sm sm:text-base font-black text-[#35452E] leading-relaxed">
                    {currentQuestion.content}
                  </p>
                </div>

                {currentQuestion.options && currentQuestion.options.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {currentQuestion.options.map((opt, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrect = (typeof currentQuestion.correct === 'number' && currentQuestion.correct === idx) ||
                                        (typeof currentQuestion.correct === 'string' && String(currentQuestion.correct).toUpperCase() === ['A','B','C','D'][idx]);

                      let optStyle = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100';
                      if (showAnswer) {
                        if (isCorrect) {
                          optStyle = 'bg-emerald-500 text-white border-emerald-600 font-black';
                        } else if (isSelected) {
                          optStyle = 'bg-rose-500 text-white border-rose-600';
                        }
                      } else if (isSelected) {
                        optStyle = 'bg-[#4F683C] text-white border-[#3D522B]';
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => !showAnswer && setSelectedOption(idx)}
                          className={`w-full p-2.5 rounded-xl border-2 text-left font-bold text-xs sm:text-sm transition flex items-center gap-2.5 cursor-pointer ${optStyle}`}
                        >
                          <span className="w-5 h-5 rounded-md bg-black/10 flex items-center justify-center text-[10px] font-black shrink-0">
                            {['A','B','C','D'][idx]}
                          </span>
                          <span className="flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#DCEBCB] flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAnswerSubmit(true)}
                    className="px-4 py-2.5 bg-[#4F683C] hover:bg-[#3D522B] text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4 text-[#E9D58F]" />
                    <span>Trả Lời Đúng (+3 AP)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAnswerSubmit(false)}
                    className="px-4 py-2.5 bg-[#D86C70] hover:bg-[#C55A5E] text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Chưa Đúng</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl border border-slate-300 transition cursor-pointer"
                >
                  {showAnswer ? 'Ẩn Lời Giải' : 'Hiện Đáp Án'}
                </button>
              </div>
            </motion.div>
          )}

          {/* STAGE 2: STRATEGIC ACTION MENU */}
          {turnStage === 'action_menu' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#DCEBCB] shadow-sm space-y-4 flex-1 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#DCEBCB]">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{currentTeam.avatar}</span>
                    <div>
                      <div className="text-[10px] font-extrabold uppercase text-[#74806B]">Lựa Chọn Chiến Lược:</div>
                      <div className="text-sm font-black text-[#35452E]">{currentTeam.name}</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-black flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>AP Còn Lại: {currentTeam.actionPoints}</span>
                  </div>
                </div>

                {/* Strategic Action Cards */}
                <div className="mt-4 space-y-2.5">
                  {/* Action 1: Di Chuyển (1 AP) */}
                  <button
                    type="button"
                    onClick={handleMoveAction}
                    disabled={currentTeam.actionPoints < 1 || isRollingDice}
                    className="w-full p-3 bg-gradient-to-r from-[#FAF7EE] to-white hover:bg-slate-50 border-2 border-[#E3DCBA] hover:border-[#4F683C] rounded-2xl text-left transition flex items-center justify-between gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#4F683C] text-white flex items-center justify-center text-lg font-black shadow-xs">
                        🎲
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-black text-[#35452E] group-hover:text-[#4F683C]">
                          Tung Xúc Xắc & Di Chuyển Tìm Sính Lễ
                        </div>
                        <div className="text-[11px] text-[#74806B] font-semibold">
                          Tung 1-6 bước để tiến đến ô chứa Sính Lễ
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 bg-[#E9F0D9] text-[#4F683C] rounded-xl border border-[#B9CDA0]">
                      Tốn 1 AP
                    </span>
                  </button>

                  {/* Action 2: Faction Magic (2 AP) */}
                  <button
                    type="button"
                    onClick={handleCastMagic}
                    disabled={currentTeam.actionPoints < 2}
                    className="w-full p-3 bg-gradient-to-r from-[#FAF7EE] to-white hover:bg-slate-50 border-2 border-[#E3DCBA] hover:border-blue-500 rounded-2xl text-left transition flex items-center justify-between gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F683C] to-[#2563EB] text-white flex items-center justify-center text-lg font-black shadow-xs">
                        ⚡
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-black text-[#35452E]">
                          {currentTeam.faction === 'sontinh' ? 'Dâng Núi & Đắp Lũy Đá (+15đ)' : 'Dâng Nước Lũ & Cuồng Phong (+15đ)'}
                        </div>
                        <div className="text-[11px] text-[#74806B] font-semibold">
                          {currentTeam.faction === 'sontinh' ? 'Xây lũy đá ngăn nước lũ dâng' : 'Dâng ngập nước tại ô chiến lược'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 bg-amber-100 text-amber-900 rounded-xl border border-amber-300">
                      Tốn 2 AP
                    </span>
                  </button>

                  {/* Action 3: Cống Nạp Sính Lễ (1 AP) */}
                  <button
                    type="button"
                    onClick={handleOfferSinhLe}
                    disabled={
                      (currentTeam.position !== 1 && currentTeam.position !== 13) ||
                      currentTeam.sinhLeInventory.length === 0 ||
                      currentTeam.actionPoints < 1
                    }
                    className="w-full p-3 bg-gradient-to-r from-amber-50 to-white border-2 border-amber-300 rounded-2xl text-left transition flex items-center justify-between gap-3 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center text-lg font-black shadow-xs">
                        👑
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-black text-amber-900">
                          Cống Nạp Sính Lễ Lên Vua Hùng (+50đ/món)
                        </div>
                        <div className="text-[11px] text-amber-800 font-semibold">
                          {currentTeam.position === 1 || currentTeam.position === 13 
                            ? `Đang ở Cung Điện! (${currentTeam.sinhLeInventory.length} Sính Lễ sẵn sàng)`
                            : 'Cần đứng ở Cung Điện (Ô #1 hoặc #13)'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 bg-amber-200 text-amber-900 rounded-xl border border-amber-400">
                      Tốn 1 AP
                    </span>
                  </button>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-[#DCEBCB] flex justify-end">
                <button
                  type="button"
                  onClick={handleEndTurn}
                  className="px-6 py-3 bg-gradient-to-r from-[#4F683C] to-[#3D522B] hover:from-[#3D522B] hover:to-[#2B3B1E] text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
                >
                  <span>Hoàn Tất Lượt & Chuyển Đội Tiếp</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STAGE 3: GAME OVER / VICTORY */}
          {turnStage === 'gameover' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-6 sm:p-8 border-4 border-[#E9D58F] shadow-2xl text-center space-y-5 flex-1 flex flex-col items-center justify-center"
            >
              <div className="text-6xl sm:text-7xl">🏆</div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#35452E]">
                  🎉 {winningTeam.name} ĐẠI THẮNG RƯỚC CÔNG CHÚA MỴ NƯƠNG!
                </h3>
                <p className="text-xs sm:text-sm text-[#74806B] font-semibold mt-1">
                  Đã hoàn thành xuất sắc các sính lễ và đạt vinh quang cao nhất trước Vua Hùng!
                </p>
              </div>

              {/* Final Scores */}
              <div className="w-full bg-[#FAF7EE] p-3 rounded-2xl border border-[#E3DCBA] space-y-2">
                <div className="text-xs font-black text-[#74806B] uppercase">Bảng Vinh Dự Phong Châu:</div>
                {teams.map(t => (
                  <div key={t.id} className="flex items-center justify-between text-xs py-1.5 px-3 bg-white rounded-lg font-bold">
                    <span className="flex items-center gap-2">
                      <span>{t.avatar}</span>
                      <span>{t.name}</span>
                    </span>
                    <span className="text-[#4F683C] font-black">
                      {t.score}đ ({t.offeredCount} Sính Lễ)
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="px-6 py-3 bg-[#4F683C] hover:bg-[#3D522B] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer"
                >
                  Chơi Trận Mới
                </button>
                <button
                  type="button"
                  onClick={handleEndGame}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer"
                >
                  Xem Báo Cáo
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};
