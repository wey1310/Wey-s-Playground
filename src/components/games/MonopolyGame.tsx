import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  BookOpen, 
  Maximize2, 
  Sparkles, 
  Trophy, 
  Award, 
  Dices, 
  Coins, 
  Home, 
  ShieldCheck, 
  History, 
  CheckCircle2, 
  XCircle, 
  Play, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';

import { GameSetupConfig, Question, QuestionBank } from '../../types';
import { soundFx } from '../../utils/audio';
import { QuestionDisplayModal } from '../QuestionDisplayModal';

import { 
  MonopolyTile, 
  MonopolyTeamState, 
  MonopolyGamePhase, 
  EventCard, 
  MonopolyTransactionLog, 
  FloatingMoneyEffect 
} from './monopoly/monopolyTypes';
import { createMonopolyBoard } from './monopoly/monopolyBoardData';
import { getRandomEventCard } from './monopoly/monopolyCards';
import { MonopolyBoard } from './monopoly/MonopolyBoard';
import { MonopolyDice } from './monopoly/MonopolyDice';
import { MonopolyScoreboard } from './monopoly/MonopolyScoreboard';
import { MonopolyActionModal } from './monopoly/MonopolyActionModal';
import { MonopolyAssetModal } from './monopoly/MonopolyAssetModal';

interface MonopolyGameProps {
  config: GameSetupConfig;
  banks?: QuestionBank[];
  activeBankId?: string;
  onBackToHome: () => void;
  onOpenQuickGuide?: (gameId: string) => void;
}

export const MonopolyGame: React.FC<MonopolyGameProps> = ({
  config,
  banks = [],
  activeBankId,
  onBackToHome,
  onOpenQuickGuide
}) => {
  // 1. SETUP & INITIALIZATION
  const startingMoney = config.monopolyStartingMoney || 1500;
  const salaryAmount = config.monopolySalaryAmount || 200;
  const winCondition = config.monopolyWinCondition || 'bankruptcy';
  const targetWealth = config.monopolyTargetWealth || 3000;
  const boardTheme = config.monopolyBoardTheme || 'vietnam';
  const customTiles = config.monopolyCustomTiles;

  const [tiles, setTiles] = useState<MonopolyTile[]>(() => createMonopolyBoard(boardTheme, customTiles));
  
  // Teams setup
  const [teams, setTeams] = useState<MonopolyTeamState[]>(() => {
    const rawTeams = (config.teams && config.teams.length > 0) ? config.teams : [
      { id: 'team_1', name: 'Đội Đỏ', avatar: '🦁', color: '#dc2626', score: 0 },
      { id: 'team_2', name: 'Đội Xanh', avatar: '🐬', color: '#2563eb', score: 0 },
    ];

    return rawTeams.map((t, idx) => ({
      id: t.id || `team_${idx + 1}`,
      name: t.name || `Đội ${idx + 1}`,
      color: t.color || (idx === 0 ? '#dc2626' : idx === 1 ? '#2563eb' : idx === 2 ? '#16a34a' : '#ea580c'),
      avatar: t.avatar || (idx === 0 ? '🦁' : idx === 1 ? '🐬' : idx === 2 ? '🦅' : '🦊'),
      money: startingMoney,
      position: 0,
      properties: [],
      inJail: false,
      jailTurnsRemaining: 0,
      isBankrupt: false,
      freeRentTokens: 0,
      totalQuestionsAnswered: 0,
      correctAnswersCount: 0
    }));
  });

  const isSkipQuestions = config.mode === 'none' || (config as any).monopolySkipQuestions === true || config.mode === 'no_questions';

  // Current Turn State
  const [currentTeamIndex, setCurrentTeamIndex] = useState<number>(0);
  const [turnCount, setTurnCount] = useState<number>(1);
  const [phase, setPhase] = useState<MonopolyGamePhase>(isSkipQuestions ? 'DICE_READY' : 'QUESTION');
  const [lastDiceRoll, setLastDiceRoll] = useState<number>(1);
  const [isRollingDice, setIsRollingDice] = useState<boolean>(false);
  const [activeTileIndex, setActiveTileIndex] = useState<number | null>(0);

  // Question Handling
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState<boolean>(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [questionPool, setQuestionPool] = useState<Question[]>([]);

  // Action Modals & Inspection
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'buy' | 'upgrade' | 'rent' | 'card' | 'tax' | 'jail' | 'rest' | 'bankruptcy';
    tile?: MonopolyTile | null;
    ownerTeam?: MonopolyTeamState | null;
    rentAmount?: number;
    card?: EventCard | null;
  }>({
    isOpen: false,
    type: 'buy',
  });

  const [inspectedTeam, setInspectedTeam] = useState<MonopolyTeamState | null>(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState<boolean>(false);

  // Floating Effects & Logs
  const [floatingEffects, setFloatingEffects] = useState<FloatingMoneyEffect[]>([]);
  const [logs, setLogs] = useState<MonopolyTransactionLog[]>([]);

  // Winner & Game Over
  const [winnerTeam, setWinnerTeam] = useState<MonopolyTeamState | null>(null);

  // Time limit game timer (if applicable)
  const [gameTimeRemaining, setGameTimeRemaining] = useState<number | null>(() => {
    if (winCondition === 'time_limit') {
      return (config.timeLimitSeconds || 600); // 10 minutes default
    }
    return null;
  });

  const currentTeam = teams[currentTeamIndex] || teams[0];

  // 2. LOAD QUESTIONS POOL
  useEffect(() => {
    const selectedBank = banks.find(b => b.id === (config.selectedBankId || activeBankId));
    if (selectedBank && selectedBank.questions && selectedBank.questions.length > 0) {
      setQuestionPool(selectedBank.questions);
    } else {
      // Fallback default educational questions
      setQuestionPool([
        {
          id: 'fb_1',
          type: 'mcq',
          content: 'Hành tinh nào gần Mặt Trời nhất trong Hệ Mặt Trời?',
          options: ['Sao Kim', 'Sao Thủy', 'Sao Hỏa', 'Trái Đất'],
          correct: 1
        },
        {
          id: 'fb_2',
          type: 'mcq',
          content: 'Đơn vị đo cường độ dòng điện trong hệ SI là gì?',
          options: ['Vôn (V)', 'Ampe (A)', 'Oát (W)', 'Jun (J)'],
          correct: 1
        },
        {
          id: 'fb_3',
          type: 'mcq',
          content: 'Ai là tác giả của tác phẩm "Truyện Kiều"?',
          options: ['Nguyễn Trãi', 'Nguyễn Du', 'Hồ Xuân Hương', 'Nguyễn Khuyến'],
          correct: 1
        },
        {
          id: 'fb_4',
          type: 'mcq',
          content: 'Tổng ba góc trong một tam giác bằng bao nhiêu độ?',
          options: ['90°', '180°', '270°', '360°'],
          correct: 1
        },
        {
          id: 'fb_5',
          type: 'mcq',
          content: 'Khí nào chiếm thể tích lớn nhất trong không khí quyển Trái Đất?',
          options: ['Oxy (O2)', 'Nitơ (N2)', 'Cacbonic (CO2)', 'Argon (Ar)'],
          correct: 1
        },
      ]);
    }
  }, [config.selectedBankId, activeBankId, banks]);

  // Timer Tick (if winCondition === 'time_limit')
  useEffect(() => {
    if (winCondition !== 'time_limit' || gameTimeRemaining === null || winnerTeam) return;

    const timer = setInterval(() => {
      setGameTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          evaluateTimeLimitWinner();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [winCondition, gameTimeRemaining, winnerTeam]);

  // Add a transaction log helper
  const addLog = (
    team: MonopolyTeamState,
    type: MonopolyTransactionLog['type'],
    description: string,
    amount?: number
  ) => {
    const newLog: MonopolyTransactionLog = {
      id: `log_${Date.now()}_${Math.random()}`,
      turn: turnCount,
      teamId: team.id,
      teamName: team.name,
      teamAvatar: team.avatar,
      type,
      amount,
      description,
      timestamp: new Date()
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Trigger floating money animation
  const triggerFloatingMoney = (teamId: string, amount: number, isGain: boolean) => {
    const effId = `eff_${Date.now()}_${Math.random()}`;
    const newEff: FloatingMoneyEffect = {
      id: effId,
      teamId,
      amount,
      isGain
    };
    setFloatingEffects(prev => [...prev, newEff]);
    setTimeout(() => {
      setFloatingEffects(prev => prev.filter(e => e.id !== effId));
    }, 1200);
  };

  // 3. STEP 1: OPEN QUESTION AT START OF TURN
  const handleStartQuestion = () => {
    // If team is in jail, check if they want to pay bail or answer question to get out
    if (currentTeam.inJail) {
      if (currentTeam.jailTurnsRemaining <= 1) {
        // Release from jail
        setTeams(prev => prev.map((t, idx) => idx === currentTeamIndex ? {
          ...t,
          inJail: false,
          jailTurnsRemaining: 0
        } : t));
        addLog(currentTeam, 'jail', 'Đã hoàn thành thời gian cách ly và được tự do!');
        soundFx.winFanfare();
      } else {
        setTeams(prev => prev.map((t, idx) => idx === currentTeamIndex ? {
          ...t,
          jailTurnsRemaining: t.jailTurnsRemaining - 1
        } : t));
        addLog(currentTeam, 'jail', `Vẫn còn đang cách ly trong tù (${currentTeam.jailTurnsRemaining - 1} lượt còn lại)`);
      }
    }

    if (config.mode === 'none') {
      // Chế độ bỏ qua câu hỏi -> trực tiếp sang gieo xúc xắc
      setPhase('DICE_READY');
      return;
    }

    setIsQuestionModalOpen(true);
  };

  // Question Answer Result
  const handleAnswerSubmit = (isCorrect: boolean) => {
    setIsQuestionModalOpen(false);

    // Update answered count
    setTeams(prev => prev.map((t, idx) => idx === currentTeamIndex ? {
      ...t,
      totalQuestionsAnswered: t.totalQuestionsAnswered + 1,
      correctAnswersCount: isCorrect ? t.correctAnswersCount + 1 : t.correctAnswersCount
    } : t));

    if (isCorrect) {
      soundFx.correct();
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      setPhase('DICE_READY');
      addLog(currentTeam, 'challenge', 'Trả lời chính xác câu hỏi tri thức! Được quyền gieo xúc xắc di chuyển.');
    } else {
      soundFx.wrong();
      addLog(currentTeam, 'challenge', 'Trả lời sai! Bị mất lượt di chuyển.');
      setPhase('TURN_SUMMARY');
    }
  };

  // 4. STEP 2: DICE ROLL & MOVEMENT
  const handleRollComplete = (diceValue: number) => {
    setLastDiceRoll(diceValue);
    setPhase('PAWN_MOVING');

    const oldPos = currentTeam.position;
    const totalTiles = tiles.length; // 24
    let stepsMoved = 0;

    const moveInterval = setInterval(() => {
      stepsMoved++;
      const nextPos = (oldPos + stepsMoved) % totalTiles;

      // Update current pawn position
      setTeams(prev => prev.map((t, idx) => idx === currentTeamIndex ? {
        ...t,
        position: nextPos
      } : t));
      setActiveTileIndex(nextPos);
      soundFx.pointBeep();

      // Check if passing START (tile 0)
      if (nextPos === 0 && stepsMoved < diceValue) {
        soundFx.powerup();
        triggerFloatingMoney(currentTeam.id, salaryAmount, true);
        setTeams(prev => prev.map((t, idx) => idx === currentTeamIndex ? {
          ...t,
          money: t.money + salaryAmount
        } : t));
        addLog(currentTeam, 'salary', `Đi qua ô START và nhận lương thưởng +$${salaryAmount}`, salaryAmount);
      }

      if (stepsMoved >= diceValue) {
        clearInterval(moveInterval);
        setIsRollingDice(false);

        // Landed on destination tile
        const destTile = tiles[nextPos];
        handleTileLanded(destTile, nextPos);
      }
    }, 240);
  };

  // 5. STEP 3: TILE ACTION RESOLVER
  const handleTileLanded = (destTile: MonopolyTile, tileIndex: number) => {
    setActiveTileIndex(tileIndex);

    // Case 1: START Tile
    if (destTile.type === 'start') {
      soundFx.winFanfare();
      triggerFloatingMoney(currentTeam.id, salaryAmount, true);
      setTeams(prev => prev.map((t, idx) => idx === currentTeamIndex ? {
        ...t,
        money: t.money + salaryAmount
      } : t));
      addLog(currentTeam, 'salary', `Đáp đúng ô START! Nhận thưởng xuất sắc +$${salaryAmount}`, salaryAmount);
      setPhase('TURN_SUMMARY');
      return;
    }

    // Case 2: PROPERTY Tile
    if (destTile.type === 'property') {
      if (!destTile.ownerTeamId) {
        // Unowned -> Open Buy Modal
        setActionModal({
          isOpen: true,
          type: 'buy',
          tile: destTile
        });
      } else if (destTile.ownerTeamId === currentTeam.id) {
        // Own property -> Open Upgrade Modal if not max level
        if (destTile.level < 3) {
          setActionModal({
            isOpen: true,
            type: 'upgrade',
            tile: destTile
          });
        } else {
          soundFx.pointBeep();
          addLog(currentTeam, 'upgrade', `Thăm khu đất cao cấp nhất của mình: ${destTile.name}`);
          setPhase('TURN_SUMMARY');
        }
      } else {
        // Opponent's property -> Pay Rent!
        const owner = teams.find(t => t.id === destTile.ownerTeamId);
        const rentToPay = destTile.rentLevels[destTile.level] || destTile.baseRent;

        setActionModal({
          isOpen: true,
          type: 'rent',
          tile: destTile,
          ownerTeam: owner,
          rentAmount: rentToPay
        });
      }
      return;
    }

    // Case 3: EVENT or LUCK Tile
    if (destTile.type === 'event' || destTile.type === 'luck') {
      const drawnCard = getRandomEventCard();
      soundFx.powerup();
      setActionModal({
        isOpen: true,
        type: 'card',
        card: drawnCard
      });
      return;
    }

    // Case 4: TAX Tile
    if (destTile.type === 'tax') {
      const taxAmount = destTile.price || 80;
      soundFx.wrong();
      triggerFloatingMoney(currentTeam.id, taxAmount, false);

      setTeams(prev => prev.map((t, idx) => idx === currentTeamIndex ? {
        ...t,
        money: Math.max(0, t.money - taxAmount)
      } : t));
      addLog(currentTeam, 'tax', `Đóng học phí / lệ phí cơ sở vật chất -$${taxAmount}`, taxAmount);
      setPhase('TURN_SUMMARY');
      checkTargetWealthOrBankruptcy();
      return;
    }

    // Case 5: GO TO JAIL Tile
    if (destTile.type === 'goto_jail') {
      soundFx.wrong();
      // Send directly to tile 6
      setTeams(prev => prev.map((t, idx) => idx === currentTeamIndex ? {
        ...t,
        position: 6,
        inJail: true,
        jailTurnsRemaining: 2
      } : t));
      setActiveTileIndex(6);
      addLog(currentTeam, 'jail', 'Bị đưa vào Phòng Kỷ Luật / Cách Ly! (Tạm dừng 2 lượt)');
      setPhase('TURN_SUMMARY');
      return;
    }

    // Case 6: REST Tile or JAIL (Just Visiting)
    if (destTile.type === 'rest' || destTile.type === 'jail') {
      soundFx.pointBeep();
      addLog(currentTeam, 'salary', `Nghỉ ngơi an toàn tại ${destTile.name}`);
      setPhase('TURN_SUMMARY');
    }
  };

  // 6. ACTION MODAL HANDLERS
  // Buy Property Confirm
  const handleConfirmBuy = () => {
    const tile = actionModal.tile;
    if (!tile || currentTeam.money < tile.price) return;

    soundFx.buttonClick();
    soundFx.winFanfare();
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    triggerFloatingMoney(currentTeam.id, tile.price, false);

    // Deduct money & assign ownership
    setTeams(prev => prev.map((t, idx) => idx === currentTeamIndex ? {
      ...t,
      money: t.money - tile.price,
      properties: [...t.properties, tile.index]
    } : t));

    setTiles(prev => prev.map(t => t.index === tile.index ? {
      ...t,
      ownerTeamId: currentTeam.id
    } : t));

    addLog(currentTeam, 'buy', `Đã mua thành công khu đất "${tile.name}" với giá $${tile.price}`, tile.price);
    setActionModal({ isOpen: false, type: 'buy' });
    setPhase('TURN_SUMMARY');
    checkTargetWealthOrBankruptcy();
  };

  const handleSkipBuy = () => {
    setActionModal({ isOpen: false, type: 'buy' });
    setPhase('TURN_SUMMARY');
  };

  // Upgrade Property Confirm
  const handleConfirmUpgrade = () => {
    const tile = actionModal.tile;
    if (!tile || currentTeam.money < tile.upgradeCost || tile.level >= 3) return;

    soundFx.buttonClick();
    soundFx.winFanfare();
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    triggerFloatingMoney(currentTeam.id, tile.upgradeCost, false);

    setTeams(prev => prev.map((t, idx) => idx === currentTeamIndex ? {
      ...t,
      money: t.money - tile.upgradeCost
    } : t));

    setTiles(prev => prev.map(t => t.index === tile.index ? {
      ...t,
      level: t.level + 1
    } : t));

    addLog(currentTeam, 'upgrade', `Đã nâng cấp nhà tại "${tile.name}" lên Cấp ${tile.level + 1}!`, tile.upgradeCost);
    setActionModal({ isOpen: false, type: 'upgrade' });
    setPhase('TURN_SUMMARY');
    checkTargetWealthOrBankruptcy();
  };

  const handleSkipUpgrade = () => {
    setActionModal({ isOpen: false, type: 'upgrade' });
    setPhase('TURN_SUMMARY');
  };

  // Pay Rent Confirm
  const handlePayRent = () => {
    const tile = actionModal.tile;
    const owner = actionModal.ownerTeam;
    const rent = actionModal.rentAmount || 0;

    if (!tile || !owner) return;

    soundFx.wrong();
    triggerFloatingMoney(currentTeam.id, rent, false);
    triggerFloatingMoney(owner.id, rent, true);

    const actualPaid = Math.min(currentTeam.money, rent);

    // Transfer money
    setTeams(prev => prev.map(t => {
      if (t.id === currentTeam.id) {
        const newMoney = t.money - rent;
        return {
          ...t,
          money: Math.max(0, newMoney),
          isBankrupt: newMoney < 0
        };
      }
      if (t.id === owner.id) {
        return {
          ...t,
          money: t.money + actualPaid
        };
      }
      return t;
    }));

    addLog(currentTeam, 'rent', `Đã trả tiền thuê $${actualPaid} cho ${owner.name} tại "${tile.name}"`, actualPaid);

    if (currentTeam.money < rent) {
      // Bankrupt!
      handleBankrupt(currentTeam);
    }

    setActionModal({ isOpen: false, type: 'rent' });
    setPhase('TURN_SUMMARY');
    checkTargetWealthOrBankruptcy();
  };

  // Use Free Rent Shield
  const handleUseFreeRentShield = () => {
    if (currentTeam.freeRentTokens <= 0) return;

    soundFx.winFanfare();
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });

    setTeams(prev => prev.map((t, idx) => idx === currentTeamIndex ? {
      ...t,
      freeRentTokens: t.freeRentTokens - 1
    } : t));

    addLog(currentTeam, 'card', `Đã kích hoạt Thẻ Miễn Phí Thuê Đất để tránh trả tiền thuê!`);
    setActionModal({ isOpen: false, type: 'rent' });
    setPhase('TURN_SUMMARY');
  };

  // Accept Event Card
  const handleAcceptCard = () => {
    const card = actionModal.card;
    if (!card) return;

    soundFx.buttonClick();

    switch (card.type) {
      case 'money_gain': {
        const gain = card.amount || 100;
        triggerFloatingMoney(currentTeam.id, gain, true);
        setTeams(prev => prev.map((t, idx) => idx === currentTeamIndex ? {
          ...t,
          money: t.money + gain
        } : t));
        addLog(currentTeam, 'card', `Rút thẻ "${card.title}": Nhận +$${gain}`, gain);
        break;
      }
      case 'money_loss': {
        const loss = card.amount || 50;
        triggerFloatingMoney(currentTeam.id, loss, false);
        setTeams(prev => prev.map((t, idx) => idx === currentTeamIndex ? {
          ...t,
          money: Math.max(0, t.money - loss)
        } : t));
        addLog(currentTeam, 'card', `Rút thẻ "${card.title}": Bị trừ -$${loss}`, loss);
        break;
      }
      case 'free_rent': {
        setTeams(prev => prev.map((t, idx) => idx === currentTeamIndex ? {
          ...t,
          freeRentTokens: t.freeRentTokens + 1
        } : t));
        addLog(currentTeam, 'card', `Rút thẻ "${card.title}": Nhận 1 Thẻ Khiên Miễn Phí Thuê Đất!`);
        break;
      }
      case 'all_give_money': {
        const gift = card.amount || 30;
        let totalReceived = 0;
        setTeams(prev => prev.map(t => {
          if (t.id === currentTeam.id) return t;
          if (!t.isBankrupt) {
            totalReceived += gift;
            return { ...t, money: Math.max(0, t.money - gift) };
          }
          return t;
        }));
        setTeams(prev => prev.map((t, idx) => idx === currentTeamIndex ? {
          ...t,
          money: t.money + totalReceived
        } : t));
        triggerFloatingMoney(currentTeam.id, totalReceived, true);
        addLog(currentTeam, 'card', `Rút thẻ "${card.title}": Nhận $${gift} từ tất cả các đội khác (Tổng +$${totalReceived})`, totalReceived);
        break;
      }
      case 'goto_start': {
        setTeams(prev => prev.map((t, idx) => idx === currentTeamIndex ? {
          ...t,
          position: 0,
          money: t.money + salaryAmount
        } : t));
        setActiveTileIndex(0);
        triggerFloatingMoney(currentTeam.id, salaryAmount, true);
        addLog(currentTeam, 'card', `Rút thẻ "${card.title}": Bay thẳng về START và nhận lương +$${salaryAmount}!`, salaryAmount);
        break;
      }
      case 'move_forward': {
        const steps = card.steps || 3;
        const newPos = (currentTeam.position + steps) % tiles.length;
        setTeams(prev => prev.map((t, idx) => idx === currentTeamIndex ? {
          ...t,
          position: newPos
        } : t));
        setActiveTileIndex(newPos);
        addLog(currentTeam, 'card', `Rút thẻ "${card.title}": Tiến ${steps} ô về phía trước.`);
        break;
      }
      case 'move_backward': {
        const steps = card.steps || 2;
        const newPos = (currentTeam.position - steps + tiles.length) % tiles.length;
        setTeams(prev => prev.map((t, idx) => idx === currentTeamIndex ? {
          ...t,
          position: newPos
        } : t));
        setActiveTileIndex(newPos);
        addLog(currentTeam, 'card', `Rút thẻ "${card.title}": Lùi lại ${steps} ô.`);
        break;
      }
      case 'property_tax': {
        const perHouse = card.amount || 30;
        const totalOwned = tiles.filter(t => t.ownerTeamId === currentTeam.id).length;
        const taxCost = totalOwned * perHouse;
        if (taxCost > 0) {
          triggerFloatingMoney(currentTeam.id, taxCost, false);
          setTeams(prev => prev.map((t, idx) => idx === currentTeamIndex ? {
            ...t,
            money: Math.max(0, t.money - taxCost)
          } : t));
          addLog(currentTeam, 'card', `Rút thẻ "${card.title}": Đóng thuế sửa chữa $${perHouse}/nhà (Tổng -$${taxCost})`, taxCost);
        } else {
          addLog(currentTeam, 'card', `Rút thẻ "${card.title}": Không có bất động sản nào, được miễn phí!`);
        }
        break;
      }
    }

    setActionModal({ isOpen: false, type: 'card' });
    setPhase('TURN_SUMMARY');
    checkTargetWealthOrBankruptcy();
  };

  // Handle Bankruptcy
  const handleBankrupt = (bankruptTeam: MonopolyTeamState) => {
    soundFx.wrong();
    // Release all properties back to bank
    setTiles(prev => prev.map(t => t.ownerTeamId === bankruptTeam.id ? {
      ...t,
      ownerTeamId: null,
      level: 0
    } : t));

    addLog(bankruptTeam, 'bankrupt', `Đã phá sản! Toàn bộ khu đất được hoàn trả về Ngân Hàng.`);
    checkTargetWealthOrBankruptcy();
  };

  // Check victory conditions
  const checkTargetWealthOrBankruptcy = () => {
    // 1. Target Wealth check
    if (winCondition === 'target_wealth') {
      const winner = teams.find(t => {
        let propVal = 0;
        t.properties.forEach(pIdx => {
          const tile = tiles.find(tl => tl.index === pIdx);
          if (tile) propVal += tile.price + (tile.level * tile.upgradeCost);
        });
        return (t.money + propVal) >= targetWealth;
      });

      if (winner) {
        declareWinner(winner);
        return;
      }
    }

    // 2. Bankruptcy check: If only 1 team is not bankrupt
    const activeTeams = teams.filter(t => !t.isBankrupt);
    if (activeTeams.length === 1 && teams.length > 1) {
      declareWinner(activeTeams[0]);
    }
  };

  const evaluateTimeLimitWinner = () => {
    // Highest Net Worth wins
    let bestTeam: MonopolyTeamState | null = null;
    let maxWealth = -1;

    teams.forEach(t => {
      let propVal = 0;
      t.properties.forEach(pIdx => {
        const tile = tiles.find(tl => tl.index === pIdx);
        if (tile) propVal += tile.price + (tile.level * tile.upgradeCost);
      });
      const netWorth = t.money + propVal;
      if (netWorth > maxWealth) {
        maxWealth = netWorth;
        bestTeam = t;
      }
    });

    if (bestTeam) {
      declareWinner(bestTeam);
    }
  };

  const declareWinner = (team: MonopolyTeamState) => {
    setWinnerTeam(team);
    setPhase('GAME_OVER');
    soundFx.winFanfare();
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
  };

  // 7. ADVANCE TO NEXT TEAM'S TURN
  const handleNextTurn = () => {
    soundFx.buttonClick();
    let nextIdx = (currentTeamIndex + 1) % teams.length;

    // Skip bankrupt teams
    let loopCount = 0;
    while (teams[nextIdx]?.isBankrupt && loopCount < teams.length) {
      nextIdx = (nextIdx + 1) % teams.length;
      loopCount++;
    }

    if (nextIdx === 0) {
      setTurnCount(prev => prev + 1);
    }

    setCurrentTeamIndex(nextIdx);
    setActiveTileIndex(teams[nextIdx].position);
    setPhase(isSkipQuestions ? 'DICE_READY' : 'QUESTION');
  };

  // Reset Game
  const handleRestartGame = () => {
    soundFx.buttonClick();
    setTiles(createMonopolyBoard(boardTheme));
    setTeams(prev => prev.map(t => ({
      ...t,
      money: startingMoney,
      position: 0,
      properties: [],
      inJail: false,
      jailTurnsRemaining: 0,
      isBankrupt: false,
      freeRentTokens: 0,
      totalQuestionsAnswered: 0,
      correctAnswersCount: 0
    })));
    setCurrentTeamIndex(0);
    setTurnCount(1);
    setPhase(isSkipQuestions ? 'DICE_READY' : 'QUESTION');
    setWinnerTeam(null);
    setLogs([]);
    setActiveTileIndex(0);
    if (winCondition === 'time_limit') {
      setGameTimeRemaining(config.timeLimitSeconds || 600);
    }
  };

  // Get current question for the modal
  const activeQuestion = useMemo(() => {
    if (questionPool.length === 0) return null;
    return questionPool[currentQuestionIdx % questionPool.length];
  }, [questionPool, currentQuestionIdx]);

  return (
    <div className="w-full flex-1 min-h-[100dvh] bg-[#F4EFE0] flex flex-col justify-between text-w-text-main select-none p-2 sm:p-4 overflow-y-auto">
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="bg-w-bg-card border-2 border-w-border rounded-2xl sm:rounded-3xl p-2 sm:p-3.5 shadow-xs flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="p-2 sm:px-3 sm:py-2 bg-w-bg-main hover:bg-w-accent-light text-w-primary-dark text-xs font-black rounded-xl border border-w-accent-border shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Trang Chủ</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">🎩</span>
            <div>
              <h1 className="text-sm sm:text-base font-black text-w-text-main flex items-center gap-1.5">
                <span>CỜ TỶ PHÚ TRI THỨC</span>
                <span className="text-[10px] font-extrabold px-2 py-0.2 bg-w-accent-light text-w-primary-dark rounded-full border border-w-accent-border">
                  Vòng {turnCount}
                </span>
              </h1>
              <p className="text-[10px] text-w-text-muted font-bold hidden md:block">
                Boardgame giáo dục kinh tế &amp; thử thách tri thức theo lượt
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onOpenQuickGuide && (
            <button
              type="button"
              onClick={() => onOpenQuickGuide('monopoly')}
              className="p-2 bg-w-bg-card hover:bg-w-accent-light text-w-primary-dark text-xs font-black rounded-xl border border-w-accent-border shadow-2xs transition flex items-center gap-1 cursor-pointer"
              title="Xem luật chơi"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:inline">Luật Chơi</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRestartGame}
            className="p-2 bg-w-bg-card hover:bg-rose-50 text-rose-700 text-xs font-black rounded-xl border border-rose-200 shadow-2xs transition flex items-center gap-1 cursor-pointer"
            title="Chơi lại ván mới"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden md:inline">Chơi Lại</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN PLAYFIELD: BOARD (LEFT/CENTER) + SCOREBOARD (RIGHT) */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 items-start max-w-7xl mx-auto w-full">
        
        {/* LEFT/CENTER: 24-TILE PERIMETER BOARD */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center">
          <MonopolyBoard
            tiles={tiles}
            teams={teams}
            currentTeamIndex={currentTeamIndex}
            activeTileIndex={activeTileIndex}
            floatingEffects={floatingEffects}
            onTileClick={(tile) => {
              // Quick view tile deed or owner
              const owner = teams.find(t => t.id === tile.ownerTeamId);
              if (tile.type === 'property') {
                setActionModal({
                  isOpen: true,
                  type: 'buy',
                  tile
                });
              }
            }}
            centerContent={
              <div className="w-full h-full flex flex-col items-center justify-between text-center p-2 sm:p-3">
                {/* Center Header: Current Team Turn Pill */}
                <div
                  className="px-3.5 py-1.5 rounded-full text-w-text-main text-xs sm:text-sm font-black shadow-sm flex items-center gap-2 border border-white"
                  style={{ backgroundColor: currentTeam.color }}
                >
                  <span className="text-base">{currentTeam.avatar}</span>
                  <span>LƯỢT CỦA {currentTeam.name.toUpperCase()}</span>
                </div>

                {/* Main Dynamic Center Hub */}
                <div className="my-auto space-y-3 w-full max-w-xs flex flex-col items-center">
                  
                  {/* PHASE 1: READY FOR QUESTION */}
                  {phase === 'QUESTION' && (
                    <div className="space-y-2.5 animate-fade-in">
                      <div className="text-3xl sm:text-4xl animate-bounce">📚</div>
                      <div className="text-xs sm:text-sm font-black text-w-text-main">
                        Thử Thách Tri Thức
                      </div>
                      <p className="text-[11px] text-w-text-muted font-bold">
                        Trả lời đúng câu hỏi để mở khóa lượt gieo xúc xắc di chuyển!
                      </p>

                      <button
                        type="button"
                        onClick={handleStartQuestion}
                        className="px-6 py-3 bg-w-primary-dark hover:bg-w-primary-hover text-w-text-main text-xs sm:text-sm font-black rounded-2xl shadow-md transition hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mx-auto cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Mở Câu Hỏi Tri Thức</span>
                      </button>
                    </div>
                  )}

                  {/* PHASE 2: DICE READY (ANSWERED CORRECTLY) */}
                  {(phase === 'DICE_READY' || phase === 'DICE_ROLLING') && (
                    <div className="space-y-2 animate-fade-in">
                      <MonopolyDice
                        onRollComplete={handleRollComplete}
                        isRolling={phase === 'DICE_ROLLING'}
                        currentValue={lastDiceRoll}
                        currentTeamName={currentTeam.name}
                        currentTeamColor={currentTeam.color}
                      />
                    </div>
                  )}

                  {/* PHASE 3: MOVING PAWN */}
                  {phase === 'PAWN_MOVING' && (
                    <div className="space-y-2 animate-fade-in">
                      <div className="text-3xl animate-pulse">🚶‍♂️💨</div>
                      <div className="text-xs sm:text-sm font-black text-w-text-main">
                        Đang di chuyển {lastDiceRoll} bước...
                      </div>
                    </div>
                  )}

                  {/* PHASE 4: TURN SUMMARY / READY TO ADVANCE */}
                  {phase === 'TURN_SUMMARY' && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="text-3xl">✨</div>
                      <div className="text-xs sm:text-sm font-black text-w-text-main">
                        Hoàn thành lượt chơi!
                      </div>

                      <button
                        type="button"
                        onClick={handleNextTurn}
                        className="px-6 py-3 bg-w-primary-dark hover:bg-w-primary-hover text-w-text-main text-xs sm:text-sm font-black rounded-2xl shadow-md transition hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mx-auto cursor-pointer"
                      >
                        <span>Chuyển Lượt Đội Tiếp Theo</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Center Footer Stats */}
                <div className="text-[10px] text-w-text-muted font-bold">
                  Số dư hiện tại: <strong className="text-emerald-700 font-black">${currentTeam.money.toLocaleString()}</strong>
                </div>
              </div>
            }
          />
        </div>

        {/* RIGHT: SCOREBOARD, TEAMS, NET WORTH & LOGS */}
        <div className="lg:col-span-4 w-full">
          <MonopolyScoreboard
            teams={teams}
            tiles={tiles}
            currentTeamIndex={currentTeamIndex}
            logs={logs}
            winCondition={winCondition}
            targetWealth={targetWealth}
            gameTimeRemaining={gameTimeRemaining}
            onInspectTeam={(team) => {
              setInspectedTeam(team);
              setIsAssetModalOpen(true);
            }}
          />
        </div>
      </main>

      {/* 3. MODALS & POPUPS */}
      {/* A. Question Modal */}
      <QuestionDisplayModal
        isOpen={isQuestionModalOpen}
        questionNumber={currentQuestionIdx + 1}
        question={activeQuestion}
        mode={config.mode || 'bank'}
        teamName={currentTeam.name}
        teamAvatar={currentTeam.avatar}
        timerEnabled={config.timerEnabled}
        timeLimitSeconds={config.timeLimitSeconds || 30}
        titlePrefix="CÂU HỎI THỬ THÁCH"
        onAnswerSubmit={(isCorrect) => {
          handleAnswerSubmit(isCorrect);
          setCurrentQuestionIdx(prev => prev + 1);
        }}
        onClose={() => setIsQuestionModalOpen(false)}
      />

      {/* B. Monopoly Action Modal (Buy / Upgrade / Rent / Card) */}
      <MonopolyActionModal
        isOpen={actionModal.isOpen}
        type={actionModal.type}
        currentTeam={currentTeam}
        tile={actionModal.tile}
        ownerTeam={actionModal.ownerTeam}
        rentAmount={actionModal.rentAmount}
        card={actionModal.card}
        onConfirmBuy={handleConfirmBuy}
        onSkipBuy={handleSkipBuy}
        onConfirmUpgrade={handleConfirmUpgrade}
        onSkipUpgrade={handleSkipUpgrade}
        onPayRent={handlePayRent}
        onUseFreeRentShield={handleUseFreeRentShield}
        onAcceptCard={handleAcceptCard}
        onClose={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* C. Team Asset Portfolio Inspector Modal */}
      <MonopolyAssetModal
        isOpen={isAssetModalOpen}
        team={inspectedTeam}
        tiles={tiles}
        onClose={() => setIsAssetModalOpen(false)}
      />

      {/* D. GAME OVER VICTORY MODAL */}
      {phase === 'GAME_OVER' && winnerTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/70 backdrop-blur-sm backdrop-blur-sm animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-w-bg-card border-4 border-w-border rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-5"
          >
            <div className="text-5xl sm:text-6xl animate-bounce">🏆</div>

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-w-text-main">
                QUÁN QUÂN CỜ TỶ PHÚ!
              </h2>
              <p className="text-xs sm:text-sm text-w-text-muted font-bold">
                Chúc mừng đội đã xuất sắc chiến thắng đấu trường tri thức &amp; bất động sản!
              </p>
            </div>

            {/* Winner Badge */}
            <div
              className="p-4 rounded-2xl text-w-text-main shadow-md flex items-center justify-center gap-3"
              style={{ backgroundColor: winnerTeam.color }}
            >
              <span className="text-3xl">{winnerTeam.avatar}</span>
              <div className="text-left">
                <div className="text-lg font-black">{winnerTeam.name}</div>
                <div className="text-xs text-w-text-main/90 font-bold">
                  Tổng tài sản: ${winnerTeam.money.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onBackToHome}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-black rounded-2xl border border-slate-300 transition cursor-pointer"
              >
                Về Trang Chủ
              </button>

              <button
                type="button"
                onClick={handleRestartGame}
                className="flex-1 py-3 bg-w-primary-dark hover:bg-w-primary-hover text-w-text-main text-xs sm:text-sm font-black rounded-2xl shadow-md transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                Chơi Ván Mới
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
