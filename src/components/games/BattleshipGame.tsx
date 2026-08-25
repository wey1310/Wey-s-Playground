import { safeAlert, safeConfirm } from "../../utils/safeAlert";
import React, { useState, useEffect } from 'react';
import { GameSetupConfig, Question, AnswerLog, Team } from '../../types';
import {
  Crosshair,
  Settings,
  RefreshCw,
  Trophy,
  Check,
  X,
  Flame,
  HelpCircle,
  Sparkles,
  Zap,
  Shield,
  Gift,
  Wrench,
  Flame as FireIcon,
  RotateCw,
  Award
} from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface BattleshipGameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: Team[], logs: AnswerLog[]) => void;
}

export type BonusType = 'DOUBLE_STRIKE' | 'SHIELD' | 'HEAVY_SHELL' | 'REPAIR' | 'QUICK_STRIKE';

export interface BonusInfo {
  type: BonusType;
  title: string;
  icon: string;
  description: string;
  color: string;
}

export const BONUSES_LIST: BonusInfo[] = [
  {
    type: 'DOUBLE_STRIKE',
    title: 'ĐẠN ĐÔI',
    icon: '💥',
    description: 'Bắn 2 tàu liên tiếp trong lượt này!',
    color: '#f59e0b',
  },
  {
    type: 'SHIELD',
    title: 'KHIÊN BẢO VỆ',
    icon: '🛡️',
    description: 'Tự động chặn 1 đòn tấn công từ đối phương!',
    color: '#3b82f6',
  },
  {
    type: 'HEAVY_SHELL',
    title: 'ĐẠN MẠNH',
    icon: '🔥',
    description: 'Đòn tiếp theo gây 2 sát thương!',
    color: '#ef4444',
  },
  {
    type: 'REPAIR',
    title: 'SỬA TÀU',
    icon: '❤️',
    description: 'Hồi phục 1 HP cho 1 tàu của đội mình!',
    color: '#10b981',
  },
  {
    type: 'QUICK_STRIKE',
    title: 'ĐÁNH NHANH',
    icon: '⚡',
    description: 'Tăng +100 điểm thưởng chiến thuật!',
    color: '#8b5cf6',
  },
];

export interface TeamShip {
  id: string; // e.g. "team_0_tau1"
  shipId: string; // "tau1".."tau6"
  teamId: string;
  teamName: string;
  teamColor: string;
  name: string;
  asset: string;
  maxHp: number;
  currentHp: number;
  isSunk: boolean;
  xPercent: number;
  yPercent: number;
  scale: number;
  bobClass: string;
}

export interface ShipBaseConfig {
  shipId: string;
  name: string;
  asset: string;
  maxHp: number;
  scale: number;
}

export const SHIP_BASE_MODELS: ShipBaseConfig[] = [
  { shipId: 'tau1', name: 'Tàu Tuần Tra', asset: '/assets/games/battleship/tau1.png', maxHp: 1, scale: 1.0 },
  { shipId: 'tau2', name: 'Tàu Pháo', asset: '/assets/games/battleship/tau2.png', maxHp: 1, scale: 1.0 },
  { shipId: 'tau3', name: 'Tàu Hạm Đội', asset: '/assets/games/battleship/tau3.png', maxHp: 2, scale: 1.1 },
  { shipId: 'tau4', name: 'Tàu Tuần Dương', asset: '/assets/games/battleship/tau4.png', maxHp: 2, scale: 1.1 },
  { shipId: 'tau5', name: 'Tàu Thiết Giáp', asset: '/assets/games/battleship/tau5.png', maxHp: 3, scale: 1.2 },
  { shipId: 'tau6', name: 'Tàu Sân Bay', asset: '/assets/games/battleship/tau6.png', maxHp: 3, scale: 1.25 },
];

// Helper to generate fleet per team distributed on sea
function generateTeamFleets(teams: Team[]): TeamShip[] {
  const result: TeamShip[] = [];
  const numTeams = teams.length;

  // 6 ship models available
  // Distribute models among teams so all tau1..tau6 are represented
  teams.forEach((team, tIdx) => {
    // Determine which ship models belong to this team
    let assignedModels: ShipBaseConfig[] = [];
    if (numTeams === 2) {
      if (tIdx === 0) {
        // Red Team: tau1, tau3, tau5
        assignedModels = [SHIP_BASE_MODELS[0], SHIP_BASE_MODELS[2], SHIP_BASE_MODELS[4]];
      } else {
        // Blue Team: tau2, tau4, tau6
        assignedModels = [SHIP_BASE_MODELS[1], SHIP_BASE_MODELS[3], SHIP_BASE_MODELS[5]];
      }
    } else {
      // 3+ teams: 2 ships per team
      const m1 = SHIP_BASE_MODELS[(tIdx * 2) % 6];
      const m2 = SHIP_BASE_MODELS[(tIdx * 2 + 1) % 6];
      assignedModels = [m1, m2];
    }

    // Sector bounds based on team index
    // e.g. Team 0 on Left ocean, Team 1 on Right ocean
    const minX = numTeams === 2 ? (tIdx === 0 ? 8 : 54) : (tIdx * (80 / numTeams) + 6);
    const maxX = numTeams === 2 ? (tIdx === 0 ? 44 : 90) : ((tIdx + 1) * (80 / numTeams) - 4);

    assignedModels.forEach((model, mIdx) => {
      const yStep = 80 / (assignedModels.length + 1);
      const yPercent = yStep * (mIdx + 1) + (Math.random() * 8 - 4);
      const xPercent = minX + Math.random() * (maxX - minX);

      result.push({
        id: `ship_${team.id}_${model.shipId}`,
        shipId: model.shipId,
        teamId: team.id,
        teamName: team.name,
        teamColor: team.color,
        name: model.name,
        asset: model.asset,
        maxHp: model.maxHp,
        currentHp: model.maxHp,
        isSunk: false,
        xPercent: Math.max(6, Math.min(90, xPercent)),
        yPercent: Math.max(12, Math.min(84, yPercent)),
        scale: model.scale,
        bobClass: `ship-bob-${(tIdx * 3 + mIdx) % 6}`,
      });
    });
  });

  return result;
}

export function BattleshipGame({ config, questions, onGameEnd }: BattleshipGameProps) {
  // Teams State
  const [teamsState, setTeamsState] = useState<Team[]>(
    config.teams && config.teams.length > 0
      ? config.teams
      : [
          { id: '1', name: 'Đội Đỏ', avatar: '🐉', color: '#ef4444', score: 0 },
          { id: '2', name: 'Đội Xanh', avatar: '🦅', color: '#3b82f6', score: 0 },
        ]
  );
  const [activeTeamIndex, setActiveTeamIndex] = useState<number>(0);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);

  // Team Bonuses Inventory: teamId -> array of BonusType
  const [teamBonuses, setTeamBonuses] = useState<Record<string, BonusType[]>>({});

  // Active Team Buffs for Current Turn
  const [activeHeavyShell, setActiveHeavyShell] = useState<boolean>(false);
  const [remainingShots, setRemainingShots] = useState<number>(1);

  // Questions State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const totalQuestions = config.numberOfQuestions || questions.length || 10;
  const currentQuestion = questions[currentQuestionIndex % (questions.length || 1)];

  // Fleet & Ships State
  const [fleetShips, setFleetShips] = useState<TeamShip[]>(() => generateTeamFleets(teamsState));

  // Gameplay Flow States
  const [attackGranted, setAttackGranted] = useState<boolean>(false);
  const [attackingShipId, setAttackingShipId] = useState<string | null>(null);
  const [explosionTarget, setExplosionTarget] = useState<{ id: string; x: number; y: number; isShieldBlocked?: boolean } | null>(null);
  const [lastActionResult, setLastActionResult] = useState<string | null>(null);

  // Random Bonus Roulette Wheel Modal
  const [rouletteModal, setRouletteModal] = useState<{
    isOpen: boolean;
    sunkShipName: string;
    winningBonus: BonusInfo | null;
    isSpinning: boolean;
  }>({
    isOpen: false,
    sunkShipName: '',
    winningBonus: null,
    isSpinning: false,
  });

  // Points Configuration
  const pointsPerHit = config.pointsPerCorrect || 100;
  const bonusPerSunk = 200;
  const pointsPerWrong = config.pointsPerWrong || 0;

  const activeTeam = teamsState[activeTeamIndex] || teamsState[0];

  // Reshuffle Fleets
  const handleReshuffleFleets = () => {
    soundFx.buttonClick();
    setFleetShips(generateTeamFleets(teamsState));
    setLastActionResult('🔄 Đã sắp xếp lại vị trí các tàu chiến trên biển!');
  };

  // Teacher clicks CORRECT (Grant attack right)
  const handleAnswerCorrect = () => {
    soundFx.correct();
    setAttackGranted(true);
    setRemainingShots(1);
    setActiveHeavyShell(false);

    setLastActionResult(
      `🎯 ${activeTeam.name} TRẢ LỜI ĐÚNG! Hãy chọn 1 tàu chiến của ĐỘI ĐỐI PHƯƠNG để bắn!`
    );
  };

  // Teacher clicks WRONG (Lose turn)
  const handleAnswerWrong = () => {
    soundFx.wrong();
    setAttackGranted(false);
    setLastActionResult(`❌ ${activeTeam.name} TRẢ LỜI SAI – Mất lượt tấn công!`);

    if (pointsPerWrong > 0) {
      setTeamsState(prev =>
        prev.map((t, idx) =>
          idx === activeTeamIndex ? { ...t, score: Math.max(0, t.score - pointsPerWrong) } : t
        )
      );
    }

    setAnswerLogs(prev => [
      ...prev,
      {
        questionNumber: currentQuestionIndex + 1,
        questionText: currentQuestion?.content || `Câu ${currentQuestionIndex + 1}`,
        correctAnswer: String(currentQuestion?.correct || 'Sai'),
        teamName: activeTeam.name,
        isCorrect: false,
      },
    ]);

    setTimeout(() => {
      advanceTurn();
    }, 1500);
  };

  // Use a Bonus from Active Team Inventory
  const handleUseBonus = (bonusType: BonusType) => {
    const currentList = teamBonuses[activeTeam.id] || [];
    if (!currentList.includes(bonusType)) return;

    soundFx.buttonClick();

    // Consume bonus
    setTeamBonuses(prev => {
      const list = [...(prev[activeTeam.id] || [])];
      const idx = list.indexOf(bonusType);
      if (idx !== -1) list.splice(idx, 1);
      return { ...prev, [activeTeam.id]: list };
    });

    if (bonusType === 'DOUBLE_STRIKE') {
      setRemainingShots(2);
      setLastActionResult(`💥 ${activeTeam.name} SỬ DỤNG ĐẠN ĐÔI! Được bắn 2 lượt trong ván này!`);
    } else if (bonusType === 'HEAVY_SHELL') {
      setActiveHeavyShell(true);
      setLastActionResult(`🔥 ${activeTeam.name} SỬ DỤNG ĐẠN MẠNH! Đòn tiếp theo gây 2 HP sát thương!`);
    } else if (bonusType === 'REPAIR') {
      // Find damaged ship of active team
      const damagedShipIndex = fleetShips.findIndex(
        s => s.teamId === activeTeam.id && !s.isSunk && s.currentHp < s.maxHp
      );
      if (damagedShipIndex !== -1) {
        setFleetShips(prev =>
          prev.map((s, idx) =>
            idx === damagedShipIndex ? { ...s, currentHp: s.currentHp + 1 } : s
          )
        );
        soundFx.correct();
        setLastActionResult(`❤️ ${activeTeam.name} ĐÃ HỒI PHỤC 1 HP CHO TÀU CỦA ĐỘI MÌNH!`);
      } else {
        setLastActionResult(`❤️ Tất cả tàu của ${activeTeam.name} đang đầy HP!`);
      }
    } else if (bonusType === 'QUICK_STRIKE') {
      // Add +100 bonus score
      setTeamsState(prev =>
        prev.map((t, idx) =>
          idx === activeTeamIndex ? { ...t, score: t.score + 100 } : t
        )
      );
      soundFx.winFanfare();
      setLastActionResult(`⚡ ${activeTeam.name} SỬ DỤNG ĐÁNH NHANH! Thêm +100 điểm thưởng!`);
    } else if (bonusType === 'SHIELD') {
      setLastActionResult(`🛡️ KHIÊN BẢO VỆ CỦA ${activeTeam.name} ĐANG TỰ ĐỘNG BẢO VỆ HẠM ĐỘI!`);
    }
  };

  // Perform Attack on Enemy Ship
  const handleAttackTargetShip = (targetShip: TeamShip) => {
    // CANNOT attack own team's ships!
    if (targetShip.teamId === activeTeam.id) {
      safeAlert(`⚠️ Không thể tự tấn công tàu của hạm đội đội mình! Hãy chọn tàu đối phương.`);
      return;
    }

    if (!attackGranted || targetShip.isSunk || attackingShipId) return;

    soundFx.buttonClick();
    setAttackingShipId(targetShip.id);

    const targetTeamId = targetShip.teamId;
    const targetTeamBonuses = teamBonuses[targetTeamId] || [];
    const hasShield = targetTeamBonuses.includes('SHIELD');

    // Trigger missile flight
    setExplosionTarget({
      id: targetShip.id,
      x: targetShip.xPercent,
      y: targetShip.yPercent,
      isShieldBlocked: hasShield,
    });

    setTimeout(() => {
      if (hasShield) {
        // Shield Blocks Attack!
        soundFx.wrong();
        // Consume Shield from target team
        setTeamBonuses(prev => {
          const list = [...(prev[targetTeamId] || [])];
          const sIdx = list.indexOf('SHIELD');
          if (sIdx !== -1) list.splice(sIdx, 1);
          return { ...prev, [targetTeamId]: list };
        });

        setLastActionResult(
          `🛡️ KHIÊN BẢO VỆ CỦA ${targetShip.teamName.toUpperCase()} ĐÃ CHẶN ĐÒN TẤN CÔNG CỦA ${activeTeam.name.toUpperCase()}!`
        );

        setAttackingShipId(null);
        setTimeout(() => setExplosionTarget(null), 1000);

        // Check remaining shots
        if (remainingShots > 1) {
          setRemainingShots(prev => prev - 1);
        } else {
          setAttackGranted(false);
          setTimeout(() => advanceTurn(), 1800);
        }
        return;
      }

      // Normal Strike
      soundFx.correct();
      const damage = activeHeavyShell ? 2 : 1;
      const updatedHp = Math.max(0, targetShip.currentHp - damage);
      const isSunkNow = updatedHp <= 0;

      // Update Ship HP
      setFleetShips(prev =>
        prev.map(s => (s.id === targetShip.id ? { ...s, currentHp: updatedHp, isSunk: isSunkNow } : s))
      );

      // Points calculation
      const earned = pointsPerHit + (isSunkNow ? bonusPerSunk : 0);
      setTeamsState(prev =>
        prev.map((t, idx) => (idx === activeTeamIndex ? { ...t, score: t.score + earned } : t))
      );

      // Log action
      setAnswerLogs(prev => [
        ...prev,
        {
          questionNumber: currentQuestionIndex + 1,
          questionText: currentQuestion?.content || `Tấn công ${targetShip.name}`,
          correctAnswer: isSunkNow ? `Đánh chìm ${targetShip.name}` : `Bắn trúng ${targetShip.name}`,
          teamName: activeTeam.name,
          isCorrect: true,
        },
      ]);

      setAttackingShipId(null);
      setTimeout(() => setExplosionTarget(null), 1000);

      // IF SUNK ➔ Trigger Random Bonus Roulette Modal! 🎁
      if (isSunkNow) {
        soundFx.winFanfare();

        // Spin Roulette Modal
        const randomBonus = BONUSES_LIST[Math.floor(Math.random() * BONUSES_LIST.length)];
        setRouletteModal({
          isOpen: true,
          sunkShipName: targetShip.name,
          winningBonus: null,
          isSpinning: true,
        });

        // Simulate Roulette Animation delay
        setTimeout(() => {
          setRouletteModal({
            isOpen: true,
            sunkShipName: targetShip.name,
            winningBonus: randomBonus,
            isSpinning: false,
          });

          // Add awarded bonus to active team's inventory
          setTeamBonuses(prev => ({
            ...prev,
            [activeTeam.id]: [...(prev[activeTeam.id] || []), randomBonus.type],
          }));

          setLastActionResult(
            `💥 ĐÃ ĐÁNH CHÌM HOÀN TOÀN TÀU ${targetShip.name.toUpperCase()} CỦA ${targetShip.teamName.toUpperCase()}! 🎉 ${activeTeam.name} NHẬN ĐƯỢC BONUS: ${randomBonus.title}!`
          );
        }, 1800);
      } else {
        setLastActionResult(
          `💥 BẮN TRÚNG TÀU ${targetShip.name.toUpperCase()} CỦA ${targetShip.teamName.toUpperCase()}! (Còn ${updatedHp} HP) (+${earned}đ)`
        );
      }

      // Check overall fleet survival
      // If an enemy team has lost ALL their ships
      const survivingTeams = teamsState.filter(t => {
        const teamShips = fleetShips.filter(s => (s.id === targetShip.id ? !isSunkNow : !s.isSunk) && s.teamId === t.id);
        return teamShips.length > 0;
      });

      if (survivingTeams.length <= 1) {
        setTimeout(() => {
          const winner = survivingTeams[0] || activeTeam;
          safeAlert(`🏆 CHIẾN THẮNG RỰC RỠ! ${winner.name} LÀ HẠM ĐỘI CUỐI CÙNG CÒN SỐNG TRÊN BIỂN!`);
          onGameEnd(teamsState, answerLogs);
        }, 2200);
      } else {
        // Multi shot check
        if (remainingShots > 1) {
          setRemainingShots(prev => prev - 1);
          setActiveHeavyShell(false);
        } else {
          setAttackGranted(false);
          setActiveHeavyShell(false);
          if (!isSunkNow) {
            setTimeout(() => advanceTurn(), 2000);
          }
        }
      }
    }, 400);
  };

  const advanceTurn = () => {
    setActiveTeamIndex(prev => (prev + 1) % teamsState.length);
    setCurrentQuestionIndex(prev => prev + 1);
    setAttackGranted(false);
    setAttackingShipId(null);
    setActiveHeavyShell(false);
    setRemainingShots(1);
  };

  return (
    <div className="flex-1 min-h-0 w-full p-3 sm:p-5 bg-gradient-to-b from-sky-950 via-blue-950 to-slate-950 rounded-3xl shadow-2xl flex flex-col justify-between border-4 border-sky-400 text-white relative overflow-hidden select-none">
      {/* Keyframe Animations */}
      <style>{`
        @keyframes floatBob1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(1.5deg); }
        }
        @keyframes floatBob2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(-2deg); }
        }
        @keyframes boomPulse {
          0% { transform: scale(0.4); opacity: 1; }
          50% { transform: scale(1.8); opacity: 0.9; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes spinWheel {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(1440deg); }
        }
        .ship-bob-0 { animation: floatBob1 4s ease-in-out infinite; }
        .ship-bob-1 { animation: floatBob2 4.5s ease-in-out infinite 0.5s; }
        .ship-bob-2 { animation: floatBob1 3.8s ease-in-out infinite 1s; }
        .ship-bob-3 { animation: floatBob2 5s ease-in-out infinite 0.2s; }
        .ship-bob-4 { animation: floatBob1 4.2s ease-in-out infinite 0.8s; }
        .ship-bob-5 { animation: floatBob2 3.6s ease-in-out infinite 1.2s; }
      `}</style>

      {/* TOP HEADER */}
      <div className="z-10 bg-slate-900/90 backdrop-blur border-2 border-sky-400/60 p-3 sm:p-4 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl animate-bounce">⚓</span>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-sky-300 tracking-wider flex items-center gap-2">
              <span>ĐÁNH TÀU CHIẾN</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/40 font-bold">
                HẠM ĐỘI ĐỐI ĐẦU + BONUS
              </span>
            </h2>
            <p className="text-xs text-sky-200/80 font-medium">
              Trả lời đúng ➔ Bắn tàu ĐỘI ĐỐI PHƯƠNG ➔ Đánh chìm nhận RANDOM BONUS!
            </p>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="px-3 py-1.5 bg-sky-950/80 border border-sky-400/50 rounded-xl font-mono text-xs font-bold text-sky-200">
            CÂU {Math.min(currentQuestionIndex + 1, totalQuestions)} / {totalQuestions}
          </div>

          <div className="px-3 py-1.5 bg-amber-500/20 border border-amber-400/50 rounded-xl text-xs font-black text-amber-300 flex items-center gap-1.5">
            <span>🚩 LƯỢT:</span>
            <span style={{ color: activeTeam.color }}>{activeTeam.name}</span>
          </div>

          <button
            onClick={handleReshuffleFleets}
            className="px-3 py-1.5 bg-sky-800 hover:bg-sky-700 text-sky-100 rounded-xl border border-sky-400/50 transition shadow text-xs font-bold flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Xếp Tàu Mới</span>
          </button>

          <button
            onClick={() => onGameEnd(teamsState, answerLogs)}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow transition flex items-center gap-1"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Kết Thúc</span>
          </button>
        </div>
      </div>

      {/* RANDOM BONUS ROULETTE MODAL */}
      {rouletteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border-4 border-amber-400 p-6 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-4 relative overflow-hidden">
            <div className="text-2xl font-black text-amber-300 uppercase tracking-widest flex items-center justify-center gap-2">
              <Gift className="w-7 h-7 text-amber-400 animate-bounce" />
              <span>🎁 CHÚC MỪNG! ĐÁNH CHÌM TÀU</span>
            </div>

            <p className="text-xs text-sky-200">
              Đã đánh chìm <strong className="text-amber-300">{rouletteModal.sunkShipName}</strong>! Vòng quay may mắn trao phần thưởng chiến thuật:
            </p>

            {/* Roulette Spinning vs Result View */}
            <div className="py-6 flex flex-col items-center justify-center">
              {rouletteModal.isSpinning ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full border-4 border-amber-400 border-t-transparent animate-[spinWheel_1.5s_linear_infinite] flex items-center justify-center text-3xl">
                    🎁
                  </div>
                  <span className="text-xs font-bold text-amber-300 animate-pulse">
                    Đang quay phần thưởng ngẫu nhiên...
                  </span>
                </div>
              ) : (
                rouletteModal.winningBonus && (
                  <div className="p-4 bg-slate-800 rounded-2xl border-2 border-amber-400 space-y-2 animate-bounce">
                    <span className="text-5xl">{rouletteModal.winningBonus.icon}</span>
                    <h3
                      className="text-lg font-black tracking-wider uppercase"
                      style={{ color: rouletteModal.winningBonus.color }}
                    >
                      {rouletteModal.winningBonus.title}
                    </h3>
                    <p className="text-xs text-slate-200 font-medium">
                      {rouletteModal.winningBonus.description}
                    </p>
                  </div>
                )
              )}
            </div>

            {!rouletteModal.isSpinning && (
              <button
                onClick={() => {
                  setRouletteModal({ isOpen: false, sunkShipName: '', winningBonus: null, isSpinning: false });
                  if (remainingShots <= 1) advanceTurn();
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-lg border border-amber-300 transition"
              >
                NHẬN BONUS VÀ TÍẾP TỤC ➔
              </button>
            )}
          </div>
        </div>
      )}

      {/* MAIN CONTENT: LEFT TEAMS & BONUSES + CENTER OCEAN BATTLEFIELD */}
      <div className="z-10 my-3 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT PANEL: TEAMS STATUS & ACTIVE BONUSES */}
        <div className="lg:col-span-3 space-y-3">
          {/* Teams Status Cards */}
          <div className="bg-slate-900/85 border border-sky-400/40 p-3 rounded-2xl shadow-md space-y-2.5">
            <h3 className="text-xs font-black text-sky-300 uppercase tracking-wider flex items-center justify-between">
              <span>HẠM ĐỘI & BONUS</span>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full border border-sky-400/30">
                {teamsState.length} Đội
              </span>
            </h3>

            <div className="space-y-2">
              {teamsState.map((team, idx) => {
                const isActive = activeTeamIndex === idx;
                const teamShips = fleetShips.filter(s => s.teamId === team.id);
                const aliveCount = teamShips.filter(s => !s.isSunk).length;
                const bonuses = teamBonuses[team.id] || [];

                return (
                  <div
                    key={team.id}
                    className={`p-3 rounded-2xl border-2 transition-all relative overflow-hidden ${
                      isActive
                        ? 'bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border-amber-400 shadow-xl scale-102 ring-2 ring-amber-400/30'
                        : 'bg-slate-900/60 border-slate-700/80 text-slate-300 opacity-90'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{team.avatar}</span>
                        <div>
                          <div className="text-xs font-black text-white flex items-center gap-1">
                            <span style={{ color: team.color }}>{team.name}</span>
                            {isActive && (
                              <span className="px-1.5 py-0.5 text-[9px] bg-amber-500 text-slate-950 font-black rounded-full animate-pulse">
                                ĐANG BẮN
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-amber-300 font-mono font-bold">
                            {team.score} Điểm
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-sky-200">
                        Tàu sống: <span className="text-emerald-400">{aliveCount}/{teamShips.length}</span>
                      </div>
                    </div>

                    {/* TEAM'S BONUS INVENTORY (🎁 BONUS CỦA ĐỘI) */}
                    <div className="mt-2 pt-2 border-t border-slate-800">
                      <div className="text-[10px] font-bold text-amber-300 mb-1 flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        <span>🎁 BONUS CỦA ĐỘI ({bonuses.length}):</span>
                      </div>
                      {bonuses.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {bonuses.map((bType, bIdx) => {
                            const bInfo = BONUSES_LIST.find(b => b.type === bType);
                            if (!bInfo) return null;
                            return (
                              <button
                                key={bIdx}
                                disabled={!isActive || !attackGranted}
                                onClick={() => handleUseBonus(bType)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition ${
                                  isActive && attackGranted
                                    ? 'bg-amber-500/30 border-amber-400 text-amber-200 hover:bg-amber-500 hover:text-slate-950 cursor-pointer animate-pulse'
                                    : 'bg-slate-800 border-slate-700 text-slate-400'
                                }`}
                                title={bInfo.description}
                              >
                                <span>{bInfo.icon}</span>
                                <span>{bInfo.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Chưa có bonus</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Ships Status Overview */}
          <div className="bg-slate-900/85 border border-sky-400/40 p-3 rounded-2xl shadow-md space-y-2 max-h-48 overflow-y-auto pr-1">
            <div className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>DANH SÁCH TÀU HẠM ĐỘI</span>
            </div>
            <div className="space-y-1.5">
              {fleetShips.map(s => (
                <div
                  key={s.id}
                  className={`p-1.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                    s.isSunk
                      ? 'bg-rose-950/60 border-rose-600/50 text-rose-300 line-through opacity-60'
                      : 'bg-slate-800/80 border-sky-400/30 text-sky-100'
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold text-[11px]">
                    <span style={{ color: s.teamColor }}>● {s.teamName}</span>
                    <span className="text-slate-300">- {s.name}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-xs">
                    {s.isSunk ? (
                      <span className="text-[9px] text-rose-400 font-bold uppercase">ĐÃ CHÌM</span>
                    ) : (
                      Array.from({ length: s.maxHp }).map((_, hIdx) => (
                        <span key={hIdx} className={hIdx < s.currentHp ? 'text-rose-500 scale-105' : 'text-slate-600'}>
                          ♥
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER OCEAN BATTLEFIELD: sea.png WITH TEAM FLEETS FLOATING */}
        <div className="lg:col-span-9 flex flex-col items-center justify-center">
          <div className="relative w-full aspect-[4/3] max-h-[520px] bg-sky-950 rounded-3xl border-4 border-sky-400/80 shadow-2xl overflow-hidden flex items-center justify-center select-none">
            {/* Background Sea Image (sea.png) */}
            <img
              src="/assets/games/battleship/sea.png"
              alt="Sea Ocean Background"
              className="absolute inset-0 w-full h-full object-cover filter contrast-110 brightness-95"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />

            {/* Sea Waves Glow Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-500/10 via-transparent to-sky-950/40 pointer-events-none" />

            {/* Action Header Banner */}
            {attackGranted && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 bg-amber-500/95 text-slate-950 font-black text-xs rounded-full border-2 border-amber-300 shadow-2xl animate-bounce flex items-center gap-1.5">
                <Crosshair className="w-4 h-4 text-slate-950 animate-spin" />
                <span>BẤM TRỰC TIẾP VÀO TÀU ĐỐI PHƯƠNG ĐỂ BẮN!</span>
              </div>
            )}

            {/* FLOATING TEAM SHIPS ON OCEAN */}
            <div className="absolute inset-0 p-4">
              {fleetShips.map(ship => {
                const isOwnShip = ship.teamId === activeTeam.id;
                const isSunk = ship.isSunk;
                const isTargetable = attackGranted && !isOwnShip && !isSunk;

                return (
                  <div
                    key={ship.id}
                    onClick={() => handleAttackTargetShip(ship)}
                    style={{
                      left: `${ship.xPercent}%`,
                      top: `${ship.yPercent}%`,
                    }}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
                      isSunk
                        ? 'opacity-30 grayscale pointer-events-none scale-75'
                        : isTargetable
                        ? 'cursor-pointer hover:scale-110 z-20'
                        : 'cursor-not-allowed opacity-90'
                    }`}
                  >
                    <div className={`relative group flex flex-col items-center ${!isSunk ? ship.bobClass : ''}`}>
                      {/* TEAM NAME & HP BADGE ABOVE SHIP */}
                      {!isSunk && (
                        <div
                          className="mb-1 px-2 py-0.5 rounded-full shadow-lg border flex items-center gap-1 text-[10px] font-black"
                          style={{
                            backgroundColor: '#0f172a',
                            borderColor: ship.teamColor,
                          }}
                        >
                          <span style={{ color: ship.teamColor }}>{ship.teamName}</span>
                          <span className="text-slate-300">| {ship.name}</span>
                          <div className="flex items-center gap-0.5 ml-1">
                            {Array.from({ length: ship.maxHp }).map((_, hIdx) => (
                              <span
                                key={hIdx}
                                className={
                                  hIdx < ship.currentHp ? 'text-rose-500 scale-110' : 'text-slate-600 line-through'
                                }
                              >
                                ♥
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SHIP IMAGE (tau1.png -> tau6.png) */}
                      <div className="relative">
                        <img
                          src={ship.asset}
                          alt={ship.name}
                          style={{
                            width: `${110 * ship.scale}px`,
                            height: 'auto',
                          }}
                          className={`object-contain transition-all duration-300 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] ${
                            isTargetable
                              ? 'filter drop-shadow-[0_0_12px_rgba(251,191,36,0.9)] group-hover:brightness-125'
                              : ''
                          }`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />

                        {/* Sunk Overlay */}
                        {isSunk && (
                          <div className="absolute inset-0 flex items-center justify-center bg-rose-950/60 rounded-xl">
                            <span className="text-3xl animate-ping">💥</span>
                          </div>
                        )}
                      </div>

                      {/* Target Crosshair Glow */}
                      {isTargetable && (
                        <div className="absolute -inset-2 rounded-2xl border-2 border-dashed border-amber-400/80 animate-spin pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* EXPLOSION / SHIELD BLOCK ANIMATION OVERLAY */}
              {explosionTarget && (
                <div
                  style={{
                    left: `${explosionTarget.x}%`,
                    top: `${explosionTarget.y}%`,
                  }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40"
                >
                  {explosionTarget.isShieldBlocked ? (
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-6xl animate-bounce">🛡️</span>
                      <span className="text-sm font-black text-blue-300 bg-slate-900/90 px-3 py-1 rounded-full border border-blue-400">
                        KHIÊN BẢO VỆ CHẶN ĐÒN!
                      </span>
                    </div>
                  ) : (
                    <div className="relative flex items-center justify-center">
                      <span className="text-6xl animate-[boomPulse_0.8s_ease-out_forwards]">💥</span>
                      <span className="absolute text-3xl font-black text-amber-300 animate-bounce">
                        BOOM!
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM CONTROL & QUESTION PANEL */}
      <div className="z-10 mt-2 bg-slate-900/95 border-2 border-sky-400/70 p-4 rounded-2xl shadow-xl space-y-3">
        {/* Action Status Banner */}
        <div className="p-3 bg-slate-950/90 rounded-xl border border-sky-400/40 text-center flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-left">
            <span className="text-2xl">{activeTeam.avatar}</span>
            <div>
              <div className="text-xs font-black text-sky-300 uppercase tracking-wider">
                LƯỢT THI ĐẤU: <span style={{ color: activeTeam.color }}>{activeTeam.name}</span>
                {remainingShots > 1 && (
                  <span className="ml-2 px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full">
                    💥 ĐẠN ĐÔI (Còn {remainingShots} lượt bắn)
                  </span>
                )}
                {activeHeavyShell && (
                  <span className="ml-2 px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-full">
                    🔥 ĐẠN MẠNH (2 HP)
                  </span>
                )}
              </div>
              <div className="text-[11px] font-bold text-amber-300">
                {lastActionResult
                  ? lastActionResult
                  : attackGranted
                  ? '🎯 ĐÃ ĐƯỢC QUYỀN TẤN CÔNG! HÃY BẤM TRỰC TIẾP VÀO TÀU ĐỐI PHƯƠNG!'
                  : 'Hãy trả lời câu hỏi bên dưới để nhận quyền tấn công!'}
              </div>
            </div>
          </div>

          {/* Teacher Judgment Controls */}
          <div className="flex items-center gap-2">
            {!attackGranted ? (
              <>
                <button
                  onClick={handleAnswerCorrect}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 border border-emerald-400"
                >
                  <Check className="w-4 h-4" />
                  <span>✓ ĐÚNG (Cho Bắn Tàu)</span>
                </button>

                <button
                  onClick={handleAnswerWrong}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 border border-rose-400"
                >
                  <X className="w-4 h-4" />
                  <span>✕ SAI (Mất Lượt)</span>
                </button>
              </>
            ) : (
              <div className="px-4 py-2 bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow border border-amber-300 flex items-center gap-1.5 animate-pulse">
                <Zap className="w-4 h-4" />
                <span>Đang chờ {activeTeam.name} chọn tàu đối phương...</span>
              </div>
            )}
          </div>
        </div>

        {/* Question Box */}
        <div className="p-4 bg-sky-950/70 rounded-xl border border-sky-400/30 space-y-3">
          <div className="flex items-center justify-between text-xs text-sky-300 font-bold border-b border-sky-800/80 pb-2">
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>CÂU HỎI #{currentQuestionIndex + 1}</span>
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              Giáo viên xem câu trả lời của học sinh ➔ Nhấn "✓ ĐÚNG" hoặc "✕ SAI"
            </span>
          </div>

          {currentQuestion ? (
            <div className="space-y-3">
              <div className="text-sm sm:text-base font-black text-white leading-relaxed">
                {currentQuestion.content}
              </div>

              {currentQuestion.options && currentQuestion.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {currentQuestion.options.map((opt, optIdx) => {
                    const optionLetter = ['A', 'B', 'C', 'D'][optIdx] || String(optIdx + 1);
                    return (
                      <div
                        key={optIdx}
                        className="p-2.5 bg-slate-900/80 border border-sky-400/30 rounded-xl text-xs font-bold text-sky-100 flex items-center gap-2 hover:border-amber-400/60 transition"
                      >
                        <span className="w-6 h-6 rounded-lg bg-sky-800 text-amber-300 flex items-center justify-center font-mono font-black text-xs shrink-0">
                          {optionLetter}
                        </span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-400 font-bold italic py-2">
              Chưa có câu hỏi. Nhấn "✓ ĐÚNG" để cho phép học sinh chọn tàu bắn trực tiếp!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
