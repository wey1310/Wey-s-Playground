import { safeAlert, safeConfirm } from "../../utils/safeAlert";
import React, { useState } from 'react';
import { GameSetupConfig, Question, AnswerLog, PRESET_THEMES } from '../../types';
import { soundFx } from '../../utils/audio';
import { Check, X, Swords, Shield, Flag, Gift, Sparkles, AlertCircle, Trophy, RefreshCw, Zap, Lock } from 'lucide-react';
import { QuestionDisplayModal } from '../QuestionDisplayModal';

interface TerritoryGameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: any[], answerLogs: AnswerLog[]) => void;
}

export type TerrainType = 'forest' | 'mountain' | 'sea' | 'plains';

export interface TerritoryCell {
  id: number;
  row: number;
  col: number;
  terrain: TerrainType;
  baseDef: number; // 1, 2, or 3
  bonusDef: number; // added by cards e.g. Kiên Thành
  hasBonusCard: boolean;
  ownerTeamIdx: number | null; // null if uncaptured
  lockTurns: number; // >0 if locked by Phong Tỏa
  questionNum: number;
}

export interface BonusCard {
  id: string;
  code: string;
  name: string;
  quote: string;
  desc: string;
  icon: string;
  isReaction?: boolean;
}

export const BONUS_CARDS: BonusCard[] = [
  { id: 'b1', code: '01', name: 'LIỀN Ô', quote: '“Anh em ta cứ thế thôi!”', desc: 'Nhận 1 ô trống liền kề miễn phí (không cần trả lời câu hỏi).', icon: '🔗' },
  { id: 'b2', code: '02', name: 'HỒI ĐÁP', quote: '“Chưa hết đâu, cho tôi làm lại!”', desc: 'Trả lời lại 1 câu hỏi khác nếu lỡ trả lời sai khi chiếm ô.', icon: '🔄' },
  { id: 'b3', code: '03', name: 'CẢN LỘ', quote: '“Khoan! Đi đâu mà vội?”', desc: 'Chọn 1 đội đối thủ, đội đó mất lượt kế tiếp.', icon: '🛑' },
  { id: 'b4', code: '04', name: 'KIÊN THÀNH', quote: '“Ô này có thành trì rồi nha!”', desc: 'Chọn 1 ô mình sở hữu, DEF +1 (tối đa DEF 3) đến hết trận.', icon: '🏰' },
  { id: 'b5', code: '05', name: 'THỦ Ô', quote: '“Giữ được thì giữ thử xem!”', desc: 'Bắt đối thủ trả lời 1 câu phòng thủ ngay. Nếu sai ➔ bạn cướp ô.', icon: '⚔️' },
  { id: 'b6', code: '06', name: 'ĐỘT KÍCH', quote: '“Xin phép đi đường tắt!”', desc: 'Chiếm 1 ô trống BẤT KỲ miễn phí (không cần trả lời câu hỏi).', icon: '⚡' },
  { id: 'b7', code: '07', name: 'ĐOẠT LẠI', quote: '“Của tôi thì trả tôi đây!”', desc: 'Tấn công 1 ô đối thủ chỉ cần trả lời ĐÚNG 1 câu.', icon: '🎯' },
  { id: 'b8', code: '08', name: 'SONG CHIẾN', quote: '“Một ô sao đủ?”', desc: 'Thực hiện 2 lần chiếm ô trong cùng 1 lượt.', icon: '🔥' },
  { id: 'b9', code: '09', name: 'PHÁ THẾ', quote: '“Phòng thủ gì mà mong manh dữ vậy?”', desc: 'Giảm DEF 1 ô đối thủ xuống -1 (DEF tối thiểu là 1).', icon: '🔨' },
  { id: 'b10', code: '10', name: 'XÓA SỔ', quote: '“Reset nhẹ cái nha!”', desc: 'Biến 1 ô đối thủ thành Ô TRỐNG (giữ nguyên địa hình & DEF).', icon: '💣' },
  { id: 'b11', code: '11', name: 'PHONG TỎA', quote: '“Khu này tạm thời đóng cửa!”', desc: 'Khóa 1 ô sở hữu trong 2 lượt đối thủ (không thể bị tấn công).', icon: '🔒' },
  { id: 'b12', code: '12', name: 'LIÊN KÍCH', quote: '“Đã vào guồng thì tới luôn!”', desc: 'Nếu chiếm ô thành công, được tấn công thêm 1 ô đối thủ.', icon: '🏹' },
  { id: 'b13', code: '13', name: 'PHÁ GIỚI', quote: '“Phòng thủ để làm gì?”', desc: 'Bỏ qua DEF ô đang chiếm, chỉ cần 1 câu đúng là chiếm thành công.', icon: '💥' },
  { id: 'b14', code: '14', name: 'PHẢN KÍCH', quote: '“Tấn công tôi á? Nghĩ kỹ chưa?”', desc: 'Dùng khi bị tấn công: trả lời 1 câu đúng để chặn đòn & bắt đối thủ mất lượt.', icon: '🛡️', isReaction: true },
  { id: 'b15', code: '15', name: 'PHẢN ĐOẠT', quote: '“Khoan, tôi lấy lại!”', desc: 'Dùng ngay sau khi mất ô: trả lời 1 câu đúng để cướp lại ô lập tức.', icon: '🪃', isReaction: true },
];

export const TERRAIN_CONFIG: Record<TerrainType, { name: string; icon: string; defaultDef: number; bgClass: string; textClass: string; desc: string; bgImage: string }> = {
  forest: { name: 'Rừng', icon: '🌳', defaultDef: 2, bgClass: 'bg-emerald-950/80 border-emerald-600', textClass: 'text-emerald-300', desc: 'Phòng thủ tốt (DEF 2)', bgImage: '/assets/games/territory/forest.jpg' },
  mountain: { name: 'Núi', icon: '⛰️', defaultDef: 3, bgClass: 'bg-stone-900/90 border-stone-600', textClass: 'text-stone-300', desc: 'Pháo đài kiên cố (DEF 3)', bgImage: '/assets/games/territory/mountain.jpg' },
  sea: { name: 'Biển', icon: '🌊', defaultDef: 1, bgClass: 'bg-cyan-950/80 border-cyan-600', textClass: 'text-cyan-300', desc: 'Dễ chiếm (DEF 1), mở rộng nhanh', bgImage: '/assets/games/territory/sea.jpg' },
  plains: { name: 'Đồng bằng', icon: '🏞️', defaultDef: 1, bgClass: 'bg-amber-950/80 border-amber-600', textClass: 'text-amber-600', desc: 'Cân bằng (DEF 1), tích lũy phát triển', bgImage: '/assets/games/territory/plains.jpg' },
};

// Helper: Generate 6x6 organic map with connected contiguous biomes (Coast, Mountain ridge, Deep forest, Plains)
const generateClusteredMap = (
  gridSize: number,
  totalQuestions: number,
  isBankMode: boolean
): TerritoryCell[] => {
  const totalCells = gridSize * gridSize;

  // Define 4 seed biome origin centers on the 6x6 grid for organic layout
  const seeds: { type: TerrainType; r: number; c: number }[] = [
    { type: 'sea', r: 0.5 + Math.random() * 0.5, c: 0.5 + Math.random() * 0.5 }, // Coast top-left
    { type: 'mountain', r: 0.5 + Math.random() * 0.5, c: 4.5 + Math.random() * 0.5 }, // Peaks top-right
    { type: 'forest', r: 4.5 + Math.random() * 0.5, c: 0.5 + Math.random() * 0.5 }, // Woods bottom-left
    { type: 'plains', r: 3.5 + Math.random() * 0.5, c: 3.5 + Math.random() * 0.5 }, // Valley center-right
  ];

  // Calculate distances for each cell
  const cellScores: { idx: number; r: number; c: number; distances: Record<TerrainType, number> }[] = [];

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const idx = r * gridSize + c;
      const distances: Record<TerrainType, number> = { sea: 0, mountain: 0, forest: 0, plains: 0 };

      seeds.forEach(s => {
        // Euclidean distance with random jitter to create natural organic borders
        const dist = Math.hypot(r - s.r, c - s.c) + (Math.random() * 0.8 - 0.4);
        distances[s.type] = dist;
      });

      cellScores.push({ idx, r, c, distances });
    }
  }

  // Allocate 9 cells per biome strictly to maintain game balance
  const assignments: TerrainType[] = Array(totalCells).fill('plains');
  const assignedSet = new Set<number>();
  const terrainsOrder: TerrainType[] = ['sea', 'mountain', 'forest', 'plains'];

  terrainsOrder.forEach(terrain => {
    // Sort unassigned cells by proximity to this terrain seed
    cellScores.sort((a, b) => a.distances[terrain] - b.distances[terrain]);
    
    let count = 0;
    for (const item of cellScores) {
      if (count >= 9) break;
      if (!assignedSet.has(item.idx)) {
        assignedSet.add(item.idx);
        assignments[item.idx] = terrain;
        count++;
      }
    }
  });

  // Pick 8 random cells for Bonus Card gifts 🎁
  const bonusIndices = new Set<number>();
  while (bonusIndices.size < 8) {
    bonusIndices.add(Math.floor(Math.random() * totalCells));
  }

  return Array.from({ length: totalCells }, (_, i) => {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    const t = assignments[i] || 'plains';
    const cfg = TERRAIN_CONFIG[t];

    return {
      id: i,
      row,
      col,
      terrain: t,
      baseDef: cfg.defaultDef,
      bonusDef: 0,
      hasBonusCard: bonusIndices.has(i),
      ownerTeamIdx: null,
      lockTurns: 0,
      questionNum: (i % totalQuestions) + 1,
    };
  });
};

export const TerritoryGame: React.FC<TerritoryGameProps> = ({ config, questions, onGameEnd }) => {
  const gridSize = 6; // 6x6 = 36 tiles
  const totalCells = gridSize * gridSize;
  const teams = config.teams;
  const qCount = config.mode === 'bank' ? questions.length : config.totalQuestionsNumber;

  // Generate initial contiguous organic map
  const [grid, setGrid] = useState<TerritoryCell[]>(() => {
    return generateClusteredMap(gridSize, Math.max(1, qCount), config.mode === 'bank');
  });

  const handleRegenerateMap = () => {
    soundFx.buttonClick();
    setGrid(generateClusteredMap(gridSize, Math.max(1, qCount), config.mode === 'bank'));
    setStatusMessage('Bản đồ đã được tái tạo địa hình tự nhiên!');
  };

  const [currentTurnTeamIdx, setCurrentTurnTeamIdx] = useState<number>(0);
  const [teamHands, setTeamHands] = useState<Record<number, BonusCard[]>>(() => {
    // Each team starts with 2 random Bonus cards
    const initialHands: Record<number, BonusCard[]> = {};
    teams.forEach((_, idx) => {
      const card1 = BONUS_CARDS[Math.floor(Math.random() * BONUS_CARDS.length)];
      const card2 = BONUS_CARDS[Math.floor(Math.random() * BONUS_CARDS.length)];
      initialHands[idx] = [card1, card2];
    });
    return initialHands;
  });

  const [teamSkipTurns, setTeamSkipTurns] = useState<Record<number, boolean>>({});
  const [teamStreakBonusCount, setTeamStreakBonusCount] = useState<Record<number, number>>({});
  const [usedQuestionIndices, setUsedQuestionIndices] = useState<number[]>([]);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);

  // Action / Attack state
  const [selectedCellIdx, setSelectedCellIdx] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'EXPAND' | 'ATTACK' | 'CARD' | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionNum, setCurrentQuestionNum] = useState<number>(1);

  // Question Step counter for Multi-Question DEF (DEF 1: 1 Q, DEF 2: 2 Qs, DEF 3: 3 Qs)
  const [defStepNeeded, setDefStepNeeded] = useState<number>(1);
  const [defStepCurrent, setDefStepCurrent] = useState<number>(1);
  const [isDefenderPhase, setIsDefenderPhase] = useState<boolean>(false); // Defender answering defense Q
  const [activeBonusCard, setActiveBonusCard] = useState<BonusCard | null>(null);

  const [gameState, setGameState] = useState<'SELECT' | 'QUESTION_MODAL' | 'RESULT'>('SELECT');
  const [statusMessage, setStatusMessage] = useState<string>('Chọn 1 ô trống để Mở Rộng hoặc ô đối thủ để Tấn Công!');
  const [winnerTeamIdx, setWinnerTeamIdx] = useState<number | null>(null);

  const themeInfo = PRESET_THEMES.find(t => t.id === config.theme) || PRESET_THEMES[0];
  const currentTeam = teams[currentTurnTeamIdx] || teams[0];

  // Draw 1 bonus card for team
  const drawBonusCard = (tIdx: number) => {
    const card = BONUS_CARDS[Math.floor(Math.random() * BONUS_CARDS.length)];
    setTeamHands(prev => {
      const hand = prev[tIdx] || [];
      if (hand.length >= 4) {
        // Discard first card if hand size exceeds 4
        return { ...prev, [tIdx]: [...hand.slice(1), card] };
      }
      return { ...prev, [tIdx]: [...hand, card] };
    });
    soundFx.cardPower();
  };

  // Check 5-in-a-row (Liên Thành) or 12 tiles (Thống Lĩnh)
  const checkWinCondition = (currentGrid: TerritoryCell[], tIdx: number): boolean => {
    // Condition 2: 12 tiles
    const ownedCount = currentGrid.filter(c => c.ownerTeamIdx === tIdx).length;
    if (ownedCount >= 12) {
      return true;
    }

    // Condition 1: 5-in-a-row (Horizontal, Vertical, Diagonal)
    const isOwned = (r: number, c: number) => {
      if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return false;
      const cell = currentGrid[r * gridSize + c];
      return cell && cell.ownerTeamIdx === tIdx;
    };

    // Horizontal
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c <= gridSize - 5; c++) {
        if ([0, 1, 2, 3, 4].every(i => isOwned(r, c + i))) return true;
      }
    }
    // Vertical
    for (let r = 0; r <= gridSize - 5; r++) {
      for (let c = 0; c < gridSize; c++) {
        if ([0, 1, 2, 3, 4].every(i => isOwned(r + i, c))) return true;
      }
    }
    // Diagonal Down-Right
    for (let r = 0; r <= gridSize - 5; r++) {
      for (let c = 0; c <= gridSize - 5; c++) {
        if ([0, 1, 2, 3, 4].every(i => isOwned(r + i, c + i))) return true;
      }
    }
    // Diagonal Up-Right
    for (let r = 4; r < gridSize; r++) {
      for (let c = 0; c <= gridSize - 5; c++) {
        if ([0, 1, 2, 3, 4].every(i => isOwned(r - i, c + i))) return true;
      }
    }

    return false;
  };

  // Select a cell on map
  const handleSelectCell = (cellIdx: number) => {
    const cell = grid[cellIdx];

    if (cell.lockTurns > 0) {
      safeAlert(`Ô này đang bị Phong Tỏa trong ${cell.lockTurns} lượt! Không thể tấn công.`);
      return;
    }

    setSelectedCellIdx(cellIdx);

    if (cell.ownerTeamIdx === null) {
      // Empty cell -> Expand
      setActionType('EXPAND');
      const effectiveDef = activeBonusCard?.code === '13' ? 1 : Math.min(3, cell.baseDef + cell.bonusDef);
      setDefStepNeeded(effectiveDef);
      setDefStepCurrent(1);
      setIsDefenderPhase(false);
      prepareNextQuestion(cellIdx);
      setGameState('QUESTION_MODAL');
    } else if (cell.ownerTeamIdx !== currentTurnTeamIdx) {
      // Enemy cell -> Attack
      setActionType('ATTACK');
      const effectiveDef = activeBonusCard?.code === '13' ? 1 : Math.min(3, Math.max(1, cell.baseDef + cell.bonusDef));
      setDefStepNeeded(effectiveDef);
      setDefStepCurrent(1);
      setIsDefenderPhase(false);
      prepareNextQuestion(cellIdx);
      setGameState('QUESTION_MODAL');
    } else {
      safeAlert('Đây là lãnh thổ của đội bạn! Chọn ô trống hoặc ô đối thủ.');
    }
  };

  const prepareNextQuestion = (cellIdx: number) => {
    if (config.mode === 'bank' && questions.length > 0) {
      let avail = questions.map((_, i) => i).filter(i => !usedQuestionIndices.includes(i));
      if (avail.length === 0) {
        avail = questions.map((_, i) => i);
        setUsedQuestionIndices([]);
      }
      const randIdx = avail[Math.floor(Math.random() * avail.length)];
      setUsedQuestionIndices(prev => [...prev, randIdx]);
      setCurrentQuestion(questions[randIdx]);
      setCurrentQuestionNum(randIdx + 1);
    } else {
      const randNum = Math.floor(Math.random() * config.totalQuestionsNumber) + 1;
      setCurrentQuestion(null);
      setCurrentQuestionNum(randNum);
    }
  };

  const handleAnswerSubmit = (isCorrect: boolean, correctAnswerText: string) => {
    if (selectedCellIdx === null) return;
    const cell = grid[selectedCellIdx];

    // Save answer log
    const log: AnswerLog = {
      questionNumber: currentQuestionNum,
      questionText: currentQuestion ? currentQuestion.content : `Câu hỏi ô #${selectedCellIdx + 1}`,
      correctAnswer: correctAnswerText,
      teamName: isDefenderPhase ? teams[cell.ownerTeamIdx!]?.name : currentTeam.name,
      isCorrect,
    };
    setAnswerLogs(prev => [...prev, log]);

    if (!isDefenderPhase) {
      // Attacker phase
      if (isCorrect) {
        soundFx.correct();
        if (defStepCurrent < defStepNeeded) {
          // Move to next required question for this DEF
          setDefStepCurrent(prev => prev + 1);
          prepareNextQuestion(selectedCellIdx);
        } else {
          // Attacker passed all required DEF questions!
          if (actionType === 'ATTACK' && cell.ownerTeamIdx !== null) {
            // Give Defender a chance to defend (1 Defense Question)
            setIsDefenderPhase(true);
            prepareNextQuestion(selectedCellIdx);
            setStatusMessage(`Đội tấn công đã trả lời đúng ${defStepNeeded} câu! Đội ${teams[cell.ownerTeamIdx]?.name} có 1 câu phòng thủ!`);
          } else {
            // Expand success!
            applyTerritoryCapture(selectedCellIdx, currentTurnTeamIdx);
          }
        }
      } else {
        soundFx.wrong();
        setStatusMessage('Trả lời sai! Chiếm lãnh thổ thất bại.');
        setTimeout(() => endTurn(), 1200);
      }
    } else {
      // Defender phase (Defender answering 1 defense Q)
      if (isCorrect) {
        soundFx.correct();
        setStatusMessage(`Đội phòng thủ ${teams[cell.ownerTeamIdx!]?.name} trả lời ĐÚNG! Giữ được lãnh thổ.`);
        setTimeout(() => endTurn(), 1200);
      } else {
        soundFx.wrong();
        setStatusMessage(`Đội phòng thủ trả lời SAI! Ô #${selectedCellIdx + 1} thuộc về đội ${currentTeam.name}!`);
        applyTerritoryCapture(selectedCellIdx, currentTurnTeamIdx);
      }
    }
  };

  const applyTerritoryCapture = (cellIdx: number, teamIdx: number) => {
    const targetCell = grid[cellIdx];
    const newGrid = [...grid];

    newGrid[cellIdx] = {
      ...targetCell,
      ownerTeamIdx: teamIdx,
      bonusDef: 0,
    };

    setGrid(newGrid);
    soundFx.winFanfare();

    // Gift Bonus card if tile has 🎁
    if (targetCell.hasBonusCard) {
      drawBonusCard(teamIdx);
    }

    // Check Win
    if (checkWinCondition(newGrid, teamIdx)) {
      setWinnerTeamIdx(teamIdx);
      setStatusMessage(`🎉 CHIẾN THẮNG BẮT ĐẦU! ĐỘI ${teams[teamIdx].name} ĐÃ ĐẠT ĐIỀU KIỆN THẮNG LÃNH THỔ!`);
      return;
    }

    // Check 3-in-a-row bonus reward (max 2 times per team)
    const currentStreakCount = teamStreakBonusCount[teamIdx] || 0;
    if (currentStreakCount < 2) {
      setTeamStreakBonusCount(prev => ({ ...prev, [teamIdx]: currentStreakCount + 1 }));
      drawBonusCard(teamIdx);
    }

    setTimeout(() => endTurn(), 1200);
  };

  // End turn & move to next active team
  const endTurn = () => {
    setGameState('SELECT');
    setSelectedCellIdx(null);
    setActionType(null);
    setActiveBonusCard(null);

    // Reduce lock turns for locked cells
    setGrid(prev =>
      prev.map(c => (c.lockTurns > 0 ? { ...c, lockTurns: c.lockTurns - 1 } : c))
    );

    // Determine next team (check skip turns from Cản Lộ)
    let nextIdx = (currentTurnTeamIdx + 1) % teams.length;
    if (teamSkipTurns[nextIdx]) {
      setTeamSkipTurns(prev => ({ ...prev, [nextIdx]: false }));
      nextIdx = (nextIdx + 1) % teams.length;
    }

    setCurrentTurnTeamIdx(nextIdx);
  };

  // Play a Bonus card from hand
  const handlePlayBonusCard = (card: BonusCard) => {
    // Remove card from hand
    setTeamHands(prev => ({
      ...prev,
      [currentTurnTeamIdx]: (prev[currentTurnTeamIdx] || []).filter(c => c.id !== card.id),
    }));

    setActiveBonusCard(card);
    soundFx.cardPower();

    if (card.code === '01') {
      // LIỀN Ô: Claim 1 adjacent empty tile for free
      safeAlert('LIỀN Ô: Chọn 1 ô trống liền kề trên bản đồ để nhận ngay miễn phí!');
    } else if (card.code === '03') {
      // CẢN LỘ: Target enemy team loses next turn
      const enemyIdx = (currentTurnTeamIdx + 1) % teams.length;
      setTeamSkipTurns(prev => ({ ...prev, [enemyIdx]: true }));
      safeAlert(`CẢN LỘ: Đội ${teams[enemyIdx].name} sẽ bị mất lượt tiếp theo!`);
    } else if (card.code === '06') {
      // ĐỘT KÍCH: Claim ANY empty tile for free
      safeAlert('ĐỘT KÍCH: Bấm vào 1 ô trống bất kỳ trên map để chiếm ngay miễn phí!');
    } else if (card.code === '08') {
      // SONG CHIẾN: Take 2 actions
      safeAlert('SONG CHIẾN: Bạn có thể thực hiện 2 lượt chiếm/tấn công liên tiếp!');
    }
  };

  const currentTeamHand = teamHands[currentTurnTeamIdx] || [];

  return (
    <div className={`flex-1 min-h-0 w-full p-4 sm:p-6 bg-gradient-to-b ${themeInfo.bgClass} text-w-text-main rounded-2xl shadow-2xl flex flex-col justify-between`}>
      {/* Game Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-w-bg-card border border-amber-500/30 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🗺️</span>
          <div>
            <h2 className="text-xl font-extrabold text-amber-600 flex items-center gap-2">
              <span>Đấu Trường Chiếm Lãnh Thổ 6x6</span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 font-normal">
                36 Ô Lãnh Thổ
              </span>
            </h2>
            <p className="text-xs text-w-primary-dark">
              Mở rộng ➔ Tấn công đối thủ ➔ Sử dụng 15 Thẻ Bonus ➔ Tạo chuỗi 5 ô (Liên Thành) hoặc 12 ô (Thống Lĩnh)!
            </p>
          </div>
        </div>

        {/* Dashboard Teams */}
        <div className="flex items-center gap-2 flex-wrap">
          {teams.map((team, idx) => {
            const isTurn = idx === currentTurnTeamIdx;
            const capturedCount = grid.filter(c => c.ownerTeamIdx === idx).length;

            return (
              <div
                key={team.id}
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition ${
                  isTurn
                    ? 'bg-amber-500/20 border-amber-400 text-amber-600 ring-2 ring-amber-400/50 scale-105'
                    : 'bg-w-bg-alt border-w-border text-w-text-muted'
                }`}
              >
                <span className="text-lg">{team.avatar}</span>
                <div className="text-xs">
                  <div className="font-bold leading-none">{team.name}</div>
                  <div className="font-mono text-amber-600 font-extrabold mt-0.5">
                    {capturedCount} ô ({(capturedCount / 36 * 100).toFixed(0)}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() =>
            onGameEnd(
              teams.map((t, idx) => ({
                ...t,
                score: grid.filter(c => c.ownerTeamIdx === idx).length * 10,
              })),
              answerLogs
            )
          }
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-w-text-main font-bold text-xs rounded-xl transition shadow"
        >
          Tổng Kết Game
        </button>
      </div>

      {/* Main Map & Hand Display */}
      <div className="my-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Hand & Cards */}
        <div className="lg:col-span-4 bg-w-bg-card border border-amber-500/30 p-4 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-w-border pb-2">
            <span className="text-xs font-black text-amber-600 font-mono uppercase flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>THẺ BONUS CỦA {currentTeam.avatar} {currentTeam.name}</span>
            </span>
            <span className="text-[10px] text-w-text-muted font-mono">
              ({currentTeamHand.length}/4 Thẻ)
            </span>
          </div>

          {currentTeamHand.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              Đội chưa có thẻ Bonus. Chiếm ô 🎁 hoặc nối 3 ô liên tiếp để nhận thẻ!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {currentTeamHand.map((card, cIdx) => (
                <div
                  key={`${card.id}_${cIdx}`}
                  className="p-3 bg-w-bg-alt border border-amber-500/40 rounded-xl space-y-1 hover:border-amber-400 transition"
                >
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span className="text-amber-600 flex items-center gap-1">
                      <span>{card.icon}</span>
                      <span>[{card.code}] {card.name}</span>
                    </span>
                    <button
                      onClick={() => handlePlayBonusCard(card)}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded-lg shadow transition"
                    >
                      Dùng Thẻ
                    </button>
                  </div>
                  <p className="text-[11px] text-w-primary-dark italic">{card.quote}</p>
                  <p className="text-[10px] text-w-text-muted">{card.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: 6x6 Map Grid with Seamless Biome Connections */}
        <div className="lg:col-span-8 bg-w-bg-card border-4 border-amber-600/60 p-4 rounded-2xl shadow-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-w-border pb-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-amber-600">🗺️ BẢN ĐỒ CHIẾM ĐẤT TỰ NHIÊN:</span>
              <span className="text-w-primary-dark">{statusMessage}</span>
            </div>
            
            <button
              onClick={handleRegenerateMap}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-600 border border-amber-500/40 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
              title="Tạo lại phân bố địa hình dạng sinh thái tự nhiên"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tái Tạo Biomes</span>
            </button>
          </div>

          {/* Map Terrain Legend */}
          <div className="flex flex-wrap items-center justify-around gap-2 bg-w-bg-alt p-2 rounded-xl border border-w-border text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-cyan-300">
              <span>🌊</span> <span>Biển (DEF 1)</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-600">
              <span>🏞️</span> <span>Đồng Bằng (DEF 1)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-300">
              <span>🌳</span> <span>Rừng (DEF 2)</span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-300">
              <span>⛰️</span> <span>Núi (DEF 3)</span>
            </div>
          </div>

          {/* Tactical Map Grid with Coordinates */}
          <div className="relative max-w-2xl mx-auto p-3 bg-w-bg-alt rounded-2xl border border-amber-500/30 shadow-inner">
            {/* Column Coordinate Labels (A - F) */}
            <div className="grid grid-cols-6 text-center text-[10px] font-mono font-bold text-amber-600 mb-1.5">
              <span>A</span><span>B</span><span>C</span><span>D</span><span>E</span><span>F</span>
            </div>

            {/* 6x6 Grid */}
            <div className="grid grid-cols-6 gap-1 aspect-square bg-w-bg-card p-1.5 rounded-xl border border-w-border">
              {grid.map(cell => {
                const cfg = TERRAIN_CONFIG[cell.terrain];
                const owner = cell.ownerTeamIdx !== null ? teams[cell.ownerTeamIdx] : null;
                const isLocked = cell.lockTurns > 0;

                const r = cell.row;
                const c = cell.col;

                // Adjacent neighbor lookup
                const topNeighbor = r > 0 ? grid[(r - 1) * gridSize + c] : null;
                const bottomNeighbor = r < gridSize - 1 ? grid[(r + 1) * gridSize + c] : null;
                const leftNeighbor = c > 0 ? grid[r * gridSize + (c - 1)] : null;
                const rightNeighbor = c < gridSize - 1 ? grid[r * gridSize + (c + 1)] : null;

                // Same terrain connections for seamless biome merging
                const sameTop = topNeighbor?.terrain === cell.terrain;
                const sameBottom = bottomNeighbor?.terrain === cell.terrain;
                const sameLeft = leftNeighbor?.terrain === cell.terrain;
                const sameRight = rightNeighbor?.terrain === cell.terrain;

                // Coastline detection (Land next to Sea)
                const isCoastTop = cell.terrain !== 'sea' && topNeighbor?.terrain === 'sea';
                const isCoastBottom = cell.terrain !== 'sea' && bottomNeighbor?.terrain === 'sea';
                const isCoastLeft = cell.terrain !== 'sea' && leftNeighbor?.terrain === 'sea';
                const isCoastRight = cell.terrain !== 'sea' && rightNeighbor?.terrain === 'sea';

                // Team Empire connection (Adjacent cells owned by same team)
                const sameOwnerTop = owner && topNeighbor?.ownerTeamIdx === cell.ownerTeamIdx;
                const sameOwnerBottom = owner && bottomNeighbor?.ownerTeamIdx === cell.ownerTeamIdx;
                const sameOwnerLeft = owner && leftNeighbor?.ownerTeamIdx === cell.ownerTeamIdx;
                const sameOwnerRight = owner && rightNeighbor?.ownerTeamIdx === cell.ownerTeamIdx;

                // Border classes
                const borderTopClass = sameOwnerTop ? 'border-t-transparent' : sameTop ? 'border-t-slate-700/30' : 'border-t-slate-600/80';
                const borderBottomClass = sameOwnerBottom ? 'border-b-transparent' : sameBottom ? 'border-b-slate-700/30' : 'border-b-slate-600/80';
                const borderLeftClass = sameOwnerLeft ? 'border-l-transparent' : sameLeft ? 'border-l-slate-700/30' : 'border-l-slate-600/80';
                const borderRightClass = sameOwnerRight ? 'border-r-transparent' : sameRight ? 'border-r-slate-700/30' : 'border-r-slate-600/80';

                return (
                  <button
                    key={cell.id}
                    onClick={() => handleSelectCell(cell.id)}
                    className={`aspect-square p-1 flex flex-col justify-between items-center relative transition transform hover:scale-105 active:scale-95 shadow-md overflow-hidden border ${borderTopClass} ${borderBottomClass} ${borderLeftClass} ${borderRightClass} ${
                      owner
                        ? 'font-black ring-1 ring-amber-300/50'
                        : `hover:border-amber-400`
                    }`}
                    style={{
                      backgroundColor: owner ? `${owner.color}CC` : 'rgba(15, 23, 42, 0.6)',
                      backgroundImage: `url(${cfg.bgImage})`,
                      backgroundSize: '115% 115%',
                      backgroundPosition: `${(c / 5) * 100}% ${(r / 5) * 100}%`, // Continuous map coordinates texture offset!
                      backgroundBlendMode: owner ? 'multiply' : 'normal',
                      borderColor: owner ? owner.color : undefined,
                      boxShadow: owner ? `inset 0 0 10px ${owner.color}66` : undefined,
                    }}
                  >
                    {/* Coastline Shoreline Waves & Beach Foam */}
                    {isCoastTop && <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-b from-cyan-200/70 to-transparent pointer-events-none" />}
                    {isCoastBottom && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-t from-cyan-200/70 to-transparent pointer-events-none" />}
                    {isCoastLeft && <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-r from-cyan-200/70 to-transparent pointer-events-none" />}
                    {isCoastRight && <div className="absolute top-0 bottom-0 right-0 w-1.5 bg-gradient-to-l from-cyan-200/70 to-transparent pointer-events-none" />}

                    {/* Top row: Terrain Icon + DEF badge */}
                    <div className="w-full flex items-center justify-between text-[10px] font-mono font-bold leading-none z-10">
                      <span className="drop-shadow">{cfg.icon}</span>
                      <span className="px-1 py-0.2 rounded bg-w-bg-card text-amber-600 border border-amber-500/40 text-[9px]">
                        DEF {cell.baseDef + cell.bonusDef}
                      </span>
                    </div>

                    {/* Center: Owner Emblem / Question Num / Bonus Gift */}
                    <div className="my-auto flex flex-col items-center justify-center z-10">
                      {owner ? (
                        <div className="relative">
                          <span className="text-xl drop-shadow-md animate-pulse">{owner.avatar}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono font-black text-amber-200 bg-w-bg-card px-1.5 py-0.5 rounded border border-amber-500/30">
                          #{cell.questionNum}
                        </span>
                      )}

                      {cell.hasBonusCard && !owner && (
                        <span className="text-xs animate-bounce mt-0.5" title="Ô Thưởng Bonus Card">🎁</span>
                      )}

                      {isLocked && (
                        <Lock className="w-3.5 h-3.5 text-rose-400 animate-pulse mt-0.5" />
                      )}
                    </div>

                    {/* Bottom row: Terrain Name or Owner Name */}
                    <div className="text-[8.5px] font-extrabold truncate max-w-full text-slate-100 uppercase z-10 bg-w-bg-card px-1 rounded w-full text-center">
                      {owner ? owner.name : cfg.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Winner Victory Celebration Overlay */}
      {winnerTeamIdx !== null && (
        <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-w-bg-alt border-2 border-amber-400 p-6 sm:p-8 rounded-3xl max-w-md w-full text-center shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="text-5xl animate-bounce">👑</div>
            <h3 className="text-2xl font-black text-amber-600">
              {teams[winnerTeamIdx]?.name} THẮNG TRẬN!
            </h3>
            <p className="text-xs text-w-primary-dark">
              Đội {teams[winnerTeamIdx]?.name} đã hoàn thành điều kiện chiếm lĩnh lãnh thổ xuất sắc (+50đ thưởng chiến thắng)!
            </p>
            <div className="bg-w-bg-card p-3 rounded-xl border border-amber-500/30 text-amber-600 font-mono font-bold text-sm">
              Lãnh thổ chiếm: {grid.filter(c => c.ownerTeamIdx === winnerTeamIdx).length} ô
            </div>
            <button
              onClick={() =>
                onGameEnd(
                  teams.map((t, idx) => ({
                    ...t,
                    score:
                      grid.filter(c => c.ownerTeamIdx === idx).length * 10 +
                      (idx === winnerTeamIdx ? 50 : 0),
                  })),
                  answerLogs
                )
              }
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-black text-sm rounded-xl shadow-lg transition"
            >
              Xem Bảng Tổng Kết Trò Chơi
            </button>
          </div>
        </div>
      )}

      {/* Question Display Modal for DEF Attack/Expand */}
      <QuestionDisplayModal
        isOpen={gameState === 'QUESTION_MODAL'}
        questionNumber={currentQuestionNum}
        question={currentQuestion}
        mode={config.mode}
        timerEnabled={config.timerEnabled}
        timeLimitSeconds={config.timeLimitSeconds}
        titlePrefix={
          isDefenderPhase
            ? `🛡️ CÂU PHÒNG THỦ DÀNH CHO ${teams[grid[selectedCellIdx || 0]?.ownerTeamIdx!]?.name}`
            : `⚔️ THỬ THÁCH DEF ${defStepCurrent}/${defStepNeeded} CỦA Ô #${(selectedCellIdx || 0) + 1}`
        }
        onAnswerSubmit={(isCorrect, correctAnswerText) => {
          handleAnswerSubmit(isCorrect, correctAnswerText);
        }}
      />

      <div className="text-center text-xs text-w-text-muted font-medium">
        Đội nào nối đủ 5 ô thẳng hàng (Liên Thành) hoặc chiếm giữ 12 ô (Thống Lĩnh) sẽ lập tức thắng trận!
      </div>
    </div>
  );
};

