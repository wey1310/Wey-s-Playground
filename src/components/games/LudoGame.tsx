import { safeAlert, safeConfirm } from "../../utils/safeAlert";
import React, { useState } from 'react';
import { GameSetupConfig, Question, AnswerLog } from '../../types';
import { soundFx } from '../../utils/audio';
import { Dices, Sparkles, Zap, Shield, Trophy, Palette } from 'lucide-react';
import { QuestionDisplayModal } from '../QuestionDisplayModal';

interface LudoGameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: any[], answerLogs: AnswerLog[]) => void;
}

export interface TeamLudoInfo {
  id: string;
  name: string;
  color: string;
  bgClass: string;
  lightBg: string;
  borderClass: string;
  startIdx: number;
  emoji: string;
}

export const LUDO_TEAMS: TeamLudoInfo[] = [
  { id: 'red', name: 'Đội Đỏ', color: '#ef4444', bgClass: 'bg-rose-500', lightBg: 'bg-rose-100', borderClass: 'border-rose-600', startIdx: 0, emoji: '🔴' },
  { id: 'blue', name: 'Đội Lam', color: '#3b82f6', bgClass: 'bg-blue-500', lightBg: 'bg-blue-100', borderClass: 'border-blue-600', startIdx: 13, emoji: '🔵' },
  { id: 'yellow', name: 'Đội Vàng', color: '#f59e0b', bgClass: 'bg-amber-500', lightBg: 'bg-amber-100', borderClass: 'border-amber-600', startIdx: 26, emoji: '🟡' },
  { id: 'green', name: 'Đội Lục', color: '#10b981', bgClass: 'bg-emerald-500', lightBg: 'bg-emerald-100', borderClass: 'border-emerald-600', startIdx: 39, emoji: '🟢' },
];

export interface HorseSkin {
  id: string;
  name: string;
  avatar: string;
  imagePath?: string;
  badgeClass: string;
}

export const HORSE_SKINS: Record<string, HorseSkin[]> = {
  blue: [
    { id: 'blue1', name: 'Blue 1 (Cơ Bản)', avatar: '🐴💙', imagePath: '/assets/games/ludo/Blue.png', badgeClass: 'bg-blue-500 border-blue-700' },
    { id: 'blue2', name: 'Blue 2 (Skin 1)', avatar: '🐴🛡️', imagePath: '/assets/games/ludo/Blue1.png', badgeClass: 'bg-cyan-600 border-cyan-800' },
    { id: 'blue3', name: 'Blue 3 (Skin 2)', avatar: '🐴🧢', imagePath: '/assets/games/ludo/Blue2.png', badgeClass: 'bg-indigo-600 border-indigo-800' },
    { id: 'blue4', name: 'Blue 4 (Skin 3)', avatar: '🐴🚀', imagePath: '/assets/games/ludo/Blue3.png', badgeClass: 'bg-blue-700 border-blue-900' },
  ],
  red: [
    { id: 'red1', name: 'Red 1 (Cơ Bản)', avatar: '🐴🔥', imagePath: '/assets/games/ludo/Red.png', badgeClass: 'bg-rose-500 border-rose-700' },
    { id: 'red2', name: 'Red 2 (Skin 1)', avatar: '🐴⚔️', imagePath: '/assets/games/ludo/Red1.png', badgeClass: 'bg-rose-600 border-rose-800' },
    { id: 'red3', name: 'Red 3 (Skin 2)', avatar: '🐴👑', imagePath: '/assets/games/ludo/Red2.png', badgeClass: 'bg-red-500 border-red-700' },
    { id: 'red4', name: 'Red 4 (Skin 3)', avatar: '🐴🦸', imagePath: '/assets/games/ludo/Red3.png', badgeClass: 'bg-rose-700 border-rose-900' },
  ],
  yellow: [
    { id: 'yellow1', name: 'Yellow 1 (Cơ Bản)', avatar: '🐴🥕', imagePath: '/assets/games/ludo/Yellow.png', badgeClass: 'bg-amber-500 border-amber-700' },
    { id: 'yellow2', name: 'Yellow 2 (Skin 1)', avatar: '🐴⭐', imagePath: '/assets/games/ludo/Yellow1.png', badgeClass: 'bg-yellow-500 border-yellow-700' },
    { id: 'yellow3', name: 'Yellow 3 (Skin 2)', avatar: '🐴🤠', imagePath: '/assets/games/ludo/Yellow2.png', badgeClass: 'bg-amber-600 border-amber-800' },
    { id: 'yellow4', name: 'Yellow 4 (Skin 3)', avatar: '🐴🐝', imagePath: '/assets/games/ludo/Yellow3.png', badgeClass: 'bg-yellow-600 border-yellow-800' },
  ],
  green: [
    { id: 'green1', name: 'Green 1 (Cơ Bản)', avatar: '🐴🌱', imagePath: '/assets/games/ludo/Green.png', badgeClass: 'bg-emerald-500 border-emerald-700' },
    { id: 'green2', name: 'Green 2 (Skin 1)', avatar: '🐴🌿', imagePath: '/assets/games/ludo/Green1.png', badgeClass: 'bg-green-600 border-green-800' },
    { id: 'green3', name: 'Green 3 (Skin 2)', avatar: '🐴🍏', imagePath: '/assets/games/ludo/Green2.png', badgeClass: 'bg-emerald-600 border-emerald-800' },
    { id: 'green4', name: 'Green 4 (Skin 3)', avatar: '🐴🦖', imagePath: '/assets/games/ludo/Green3.png', badgeClass: 'bg-teal-600 border-teal-800' },
  ],
};

const PATH_MAP = [
  { r: 14, c: 7 }, { r: 13, c: 7 }, { r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 6 }, { r: 9, c: 5 }, { r: 9, c: 4 }, { r: 9, c: 3 }, { r: 9, c: 2 }, { r: 9, c: 1 }, { r: 8, c: 1 }, { r: 7, c: 1 },
  { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }, { r: 7, c: 6 }, { r: 6, c: 7 }, { r: 5, c: 7 }, { r: 4, c: 7 }, { r: 3, c: 7 }, { r: 2, c: 7 }, { r: 1, c: 7 }, { r: 1, c: 8 }, { r: 1, c: 9 },
  { r: 2, c: 9 }, { r: 3, c: 9 }, { r: 4, c: 9 }, { r: 5, c: 9 }, { r: 6, c: 9 }, { r: 7, c: 10 }, { r: 7, c: 11 }, { r: 7, c: 12 }, { r: 7, c: 13 }, { r: 7, c: 14 }, { r: 7, c: 15 }, { r: 8, c: 15 }, { r: 9, c: 15 },
  { r: 9, c: 14 }, { r: 9, c: 13 }, { r: 9, c: 12 }, { r: 9, c: 11 }, { r: 9, c: 10 }, { r: 10, c: 9 }, { r: 11, c: 9 }, { r: 12, c: 9 }, { r: 13, c: 9 }, { r: 14, c: 9 }, { r: 15, c: 9 }, { r: 15, c: 8 }, { r: 15, c: 7 }
];

const HOMES: Record<string, { r: number; c: number }[]> = {
  red:    [{ r: 14, c: 8 }, { r: 13, c: 8 }, { r: 12, c: 8 }, { r: 11, c: 8 }, { r: 10, c: 8 }, { r: 9, c: 8 }],
  blue:   [{ r: 8, c: 2 }, { r: 8, c: 3 }, { r: 8, c: 4 }, { r: 8, c: 5 }, { r: 8, c: 6 }, { r: 8, c: 7 }],
  yellow: [{ r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 }, { r: 6, c: 8 }, { r: 7, c: 8 }],
  green:  [{ r: 8, c: 14 }, { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 }]
};

export const LudoGame: React.FC<LudoGameProps> = ({ config, questions, onGameEnd }) => {
  const teams = config.teams;
  const numTeams = Math.min(4, Math.max(2, teams.length));

  // Horse positions: -1 = in base, 0-51 = track cells, 101-106 = finish barn slots 1-6
  const [horsePositions, setHorsePositions] = useState<number[][]>(() =>
    Array.from({ length: numTeams }, () => [-1, -1, -1, -1])
  );

  const [scores, setScores] = useState<number[]>(new Array(numTeams).fill(0));
  const [currentTurnTeamIdx, setCurrentTurnTeamIdx] = useState<number>(0);
  const [usedQuestionIndices, setUsedQuestionIndices] = useState<number[]>([]);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);

  // Dice settings: 1 or 2 dice
  const [diceCount, setDiceCount] = useState<1 | 2>(1);
  const [diceVals, setDiceVals] = useState<[number, number]>([1, 1]);
  const [totalDice, setTotalDice] = useState<number>(0);
  const [isSpecialRoll, setIsSpecialRoll] = useState<boolean>(false);
  const [canRollAgain, setCanRollAgain] = useState<boolean>(false);
  const [forcedSix, setForcedSix] = useState<boolean>(false);

  // Ghost hover preview
  const [ghostPos, setGhostPos] = useState<{ r: number; c: number } | null>(null);

  const isSkipQuestions = config.mode === 'none';

  // Question & game state
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionNum, setCurrentQuestionNum] = useState<number | null>(null);
  const [gameState, setGameState] = useState<'WAIT_SPIN' | 'WAIT_JUDGE' | 'WAIT_DICE' | 'WAIT_MOVE' | 'SPEED_SELECT'>(
    isSkipQuestions ? 'WAIT_DICE' : 'WAIT_SPIN'
  );
  const [isRollingDice, setIsRollingDice] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>(
    isSkipQuestions ? 'Hãy bấm "Lắc Xí Ngầu" để bắt đầu lượt di chuyển!' : 'Bấm "Quay Lựa Chọn Câu Hỏi" để bắt đầu lượt!'
  );

  // Skill purchase per turn
  const [boughtSkills, setBoughtSkills] = useState<Record<string, boolean>>({});

  // Selected Horse Skins per team (e.g. Blue 1..4, Red 1..4, Yellow 1..4, Green 1..4)
  const [selectedSkinIdxs, setSelectedSkinIdxs] = useState<Record<string, number>>({
    red: 0,
    blue: 0,
    yellow: 0,
    green: 0,
  });

  // Helper to get active skin avatar for a team
  const getHorseAvatar = (teamKey: string, horseIndex: number) => {
    const skins = HORSE_SKINS[teamKey] || HORSE_SKINS.red;
    const skinIdx = selectedSkinIdxs[teamKey] ?? 0;
    const skin = skins[skinIdx % skins.length];
    if (skin && skin.imagePath) {
      return <img src={skin.imagePath} alt={skin.name} className="w-[85%] h-[85%] object-contain" />;
    }
    return skin ? skin.avatar : '🐴';
  };

  const activeTeamInfo = LUDO_TEAMS[currentTurnTeamIdx] || LUDO_TEAMS[0];

  const handleSpinQuestion = () => {
    if (config.mode === 'none') {
      soundFx.winFanfare();
      setGameState('WAIT_DICE');
      setStatusMessage(`${activeTeamInfo.name} đang tiến hành tung xúc xắc.`);
      return;
    }

    soundFx.diceRoll();

    if (config.mode === 'bank') {
      let available = questions.map((_, i) => i).filter(i => !usedQuestionIndices.includes(i));
      if (available.length === 0) {
        available = questions.map((_, i) => i);
        setUsedQuestionIndices([]);
      }
      const randIdx = available[Math.floor(Math.random() * available.length)];
      setUsedQuestionIndices(prev => [...prev, randIdx]);
      setCurrentQuestion(questions[randIdx]);
      setCurrentQuestionNum(randIdx + 1);
    } else {
      let randNum = Math.floor(Math.random() * config.totalQuestionsNumber) + 1;
      setUsedQuestionIndices(prev => [...prev, randNum]);
      setCurrentQuestion(null);
      setCurrentQuestionNum(randNum);
    }

    setGameState('WAIT_JUDGE');
  };

  const handleJudgeAnswer = (isCorrect: boolean, correctAnswerText: string) => {
    if (isCorrect) {
      soundFx.correct();
      const log: AnswerLog = {
        questionNumber: currentQuestionNum || 1,
        questionText: currentQuestion ? currentQuestion.content : `Câu số ${currentQuestionNum}`,
        correctAnswer: correctAnswerText,
        teamName: teams[currentTurnTeamIdx].name,
        isCorrect: true,
      };
      setAnswerLogs(prev => [...prev, log]);
      setGameState('WAIT_DICE');
      setStatusMessage('🎉 Trả lời ĐÚNG! Hãy lắc xí ngầu!');
    } else {
      soundFx.wrong();
      const log: AnswerLog = {
        questionNumber: currentQuestionNum || 1,
        questionText: currentQuestion ? currentQuestion.content : `Câu số ${currentQuestionNum}`,
        correctAnswer: correctAnswerText,
        teamName: teams[currentTurnTeamIdx].name,
        isCorrect: false,
      };
      setAnswerLogs(prev => [...prev, log]);
      setStatusMessage('😢 Trả lời SAI! Mất lượt di chuyển.');
      setTimeout(() => {
        nextTurn();
      }, 1200);
    }
  };

  const handleRollDice = () => {
    setIsRollingDice(true);
    soundFx.diceRoll();

    setTimeout(() => {
      let d1 = Math.floor(Math.random() * 6) + 1;
      let d2 = Math.floor(Math.random() * 6) + 1;

      if (forcedSix) {
        d1 = 6;
        if (diceCount === 2) d2 = 6;
        setForcedSix(false);
      }

      setDiceVals([d1, d2]);
      setIsRollingDice(false);

      let total = d1;
      let isSpecial = false;
      let extraTurn = false;

      if (diceCount === 1) {
        total = d1;
        // 1 Dice Rules: 1 or 6 deploys from base; 6 gives extra turn
        if (d1 === 1 || d1 === 6) isSpecial = true;
        if (d1 === 6) extraTurn = true;
      } else {
        total = d1 + d2;
        // 2 Dice Rules: Double or (1 and 6) deploys from base; Double or 1-6 gives extra turn
        if (d1 === d2 || (d1 === 1 && d2 === 6) || (d1 === 6 && d2 === 1)) {
          isSpecial = true;
          extraTurn = true;
        }
      }

      setTotalDice(total);
      setIsSpecialRoll(isSpecial);
      setCanRollAgain(extraTurn);

      // Check if any move is possible
      const canAnyMove = checkAnyMovePossible(isSpecial);

      if (canAnyMove) {
        soundFx.cardPower();
        setGameState('WAIT_MOVE');
        let msg = `🎲 Xí ngầu ra ${total} nước! Chọn 1 ngựa để đi.`;
        if (isSpecial) msg += ' (Đủ điều kiện RA QUÂN!)';
        if (extraTurn) msg += ' 🌟 Thêm lượt quay!';
        setStatusMessage(msg);
      } else {
        soundFx.wrong();
        setStatusMessage(`😥 Đổ ra ${total} nước nhưng không có nước đi nào khả thi!`);
        setTimeout(() => {
          if (extraTurn) {
            setGameState('WAIT_DICE');
            setStatusMessage('🌟 Được thêm lượt quay xí ngầu!');
          } else {
            nextTurn();
          }
        }, 1500);
      }
    }, 700);
  };

  // Helper: check if a track cell is occupied by any horse
  const getHorseAtTrackCell = (cellIdx: number): { teamIdx: number; horseIdx: number } | null => {
    for (let t = 0; t < numTeams; t++) {
      for (let h = 0; h < 4; h++) {
        if (horsePositions[t][h] === cellIdx) {
          return { teamIdx: t, horseIdx: h };
        }
      }
    }
    return null;
  };

  // Helper: check if a barn slot (101..106) is occupied by own team
  const isBarnSlotOccupied = (teamIdx: number, slotIdx: number): boolean => {
    return horsePositions[teamIdx].includes(100 + slotIdx);
  };

  /**
   * Comprehensive Ludo Rules:
   * 1. Deploy (Ra quan):
   *    - In base (-1) -> can deploy to startIdx if special roll (6 or 1 with 1 dice; Pair or 1-6 with 2 dice)
   *    - Cannot deploy if startIdx is blocked by own team's horse.
   *    - Can deploy and KICK if startIdx has opponent's horse!
   * 2. Move on Track (Di chuyen):
   *    - Cannot jump over ANY horse (own or opponent) in intermediate path cells (Block/Chan).
   *    - Destination cell:
   *      - If own horse -> Blocked (Cannot land).
   *      - If opponent horse -> Allowed, KICK opponent horse back to base!
   * 3. Enter Barn (Vo chuong):
   *    - From Gate (cell right before startIdx): can enter barn slot S (1..6) corresponding to dice or steps.
   *    - Cannot enter if intermediate slots or target slot is blocked by own horse.
   * 4. Advance inside Barn (Len chuong):
   *    - In slot K (1..5): can advance to K + steps (up to 6) if not blocked by own horse.
   */
  const calculateTargetPos = (pos: number, steps: number, teamIdx: number, specialDeploy: boolean): number => {
    const ludoTeam = LUDO_TEAMS[teamIdx];
    const startIdx = ludoTeam.startIdx;
    const gateIdx = (startIdx + 51) % 52;

    // 1. RA QUÂN (Xuất chuồng từ -1)
    if (pos === -1) {
      if (!specialDeploy) return -999;
      // Check if startIdx has own team horse
      if (horsePositions[teamIdx].includes(startIdx)) {
        return -999; // Bị quân mình chặn ngay ô xuất phát
      }
      return startIdx;
    }

    // 2. KỸ NĂNG TĂNG TỐC (Speed skill)
    if (gameState === 'SPEED_SELECT') {
      if (pos >= 100) return -999;
      const target = (pos + 2) % 52;
      if (horsePositions[teamIdx].includes(target)) return -999;
      return target;
    }

    // 3. TIẾN BẬC TRONG CHUỒNG (101..106)
    if (pos >= 101 && pos <= 106) {
      const currentSlot = pos - 100;
      const targetSlot = currentSlot + steps;
      if (targetSlot > 6) return -999; // Vượt quá đỉnh chuồng 6

      // Kiểm tra xem có ngựa mình cản trên các bậc từ currentSlot + 1 đến targetSlot không
      for (let s = currentSlot + 1; s <= targetSlot; s++) {
        if (isBarnSlotOccupied(teamIdx, s)) {
          return -999; // Bị ngựa mình chặn bậc chuồng
        }
      }
      return 100 + targetSlot;
    }

    // 4. VÔ CHUỒNG TỪ CỬA CHUỒNG HOẶC ĐƯỜNG ĐUA CUỐI VÒNG
    const relativePos = (pos - startIdx + 52) % 52;
    const newRelativePos = relativePos + steps;

    if (newRelativePos > 51) {
      if (relativePos < 51) {
        return -999; // Phải đứng đúng cửa chuồng mới được lên
      }

      // Đang đứng ở cửa chuồng (relativePos === 51)
      const targetSlot = steps; // Số bước chính là bậc chuồng muốn lên
      if (targetSlot < 1 || targetSlot > 6) return -999; // Vượt quá đỉnh chuồng 6

      // Kiểm tra cản đường trong các bậc chuồng từ 1 đến targetSlot
      for (let s = 1; s <= targetSlot; s++) {
        if (isBarnSlotOccupied(teamIdx, s)) {
          return -999; // Bị ngựa mình cản đường trong chuồng
        }
      }

      return 100 + targetSlot;
    }

    // 5. DI CHUYỂN TRÊN ĐƯỜNG ĐUA (Track Move)
    // Kiểm tra cản đường (Block) trên các ô trung gian: cờ cá ngựa KHÔNG ĐƯỢC NHẢY QUA quân khác!
    for (let step = 1; step < steps; step++) {
      const intermediateCell = (pos + step) % 52;
      // Nếu có bất kỳ con ngựa nào (mình hoặc đối phương) ở ô trung gian -> BỊ CHẶN ĐƯỜNG
      if (getHorseAtTrackCell(intermediateCell) !== null) {
        return -999; // Bị cản đường không thể nhảy qua
      }
    }

    const targetTrackCell = (pos + steps) % 52;

    // Kiểm tra ô đích đến có phải ngựa cùng màu không
    if (horsePositions[teamIdx].includes(targetTrackCell)) {
      return -999; // Không thể đứng cùng ô với quân mình
    }

    return targetTrackCell;
  };

  const getValidStepsToTry = () => {
    if (gameState === 'SPEED_SELECT') return [2];
    if (diceCount === 1) return [diceVals[0]];
    return [diceVals[0] + diceVals[1], Math.max(diceVals[0], diceVals[1]), Math.min(diceVals[0], diceVals[1])];
  };

  const getBestTargetPos = (pos: number, teamIdx: number, specialDeploy: boolean) => {
    const stepsToTry = getValidStepsToTry();
    for (const steps of stepsToTry) {
      const target = calculateTargetPos(pos, steps, teamIdx, specialDeploy);
      if (target !== -999) return { target, stepsUsed: steps };
    }
    return { target: -999, stepsUsed: 0 };
  };

  const canHorseMove = (pos: number, teamIdx: number, specialDeploy: boolean) => {
    return getBestTargetPos(pos, teamIdx, specialDeploy).target !== -999;
  };

  const checkAnyMovePossible = (specialDeploy: boolean) => {
    return horsePositions[currentTurnTeamIdx].some(pos =>
      canHorseMove(pos, currentTurnTeamIdx, specialDeploy)
    );
  };

  const handleSelectHorse = (horseIdx: number) => {
    if (gameState !== 'WAIT_MOVE' && gameState !== 'SPEED_SELECT') return;

    const currentPos = horsePositions[currentTurnTeamIdx][horseIdx];
    const special = gameState === 'SPEED_SELECT' ? false : isSpecialRoll;

    const bestMove = getBestTargetPos(currentPos, currentTurnTeamIdx, special);
    if (bestMove.target === -999) return;

    const targetPos = bestMove.target;
    const steps = bestMove.stepsUsed;

    // Đá ngựa đối thủ nếu ô đích là ô đường đua có ngựa đối thủ
    let kickHappened = false;
    let kickedTeamName = '';

    const updated = horsePositions.map((tHorses, tIdx) => {
      if (tIdx === currentTurnTeamIdx) {
        const copy = [...tHorses];
        copy[horseIdx] = targetPos;
        return copy;
      } else {
        return tHorses.map(p => {
          if (p === targetPos && targetPos < 100 && targetPos >= 0) {
            kickHappened = true;
            kickedTeamName = teams[tIdx]?.name || `Đội ${tIdx + 1}`;
            return -1; // Đá văng về chuồng xuất phát
          }
          return p;
        });
      }
    });

    setHorsePositions(updated);
    setGhostPos(null);

    // Xử lý điểm & thông báo
    if (kickHappened) {
      soundFx.capture();
      setScores(prev => {
        const c = [...prev];
        c[currentTurnTeamIdx] += 30; // Thưởng +30đ khi đá ngựa đối phương
        return c;
      });
      setStatusMessage(`⚡ TUYỆT VỜI! Đã ĐÁ NGỰA của ${kickedTeamName} về chuồng (+30đ)!`);
    } else if (targetPos >= 101 && targetPos <= 106) {
      soundFx.cardPower();
      const barnSlot = targetPos - 100;
      setScores(prev => {
        const c = [...prev];
        c[currentTurnTeamIdx] += barnSlot * 10; // Thưởng điểm theo bậc chuồng (Bậc 1 = +10đ, Bậc 6 = +60đ)
        return c;
      });
      setStatusMessage(`🏁 TIẾN CHUỒNG THÀNH CÔNG! Ngựa #${horseIdx + 1} đã lên bậc ${barnSlot} (+${barnSlot * 10}đ)!`);
    } else if (currentPos === -1 && targetPos >= 0) {
      soundFx.cardPower();
      setStatusMessage(`🚀 XUẤT CHUỒNG THÀNH CÔNG! Ngựa #${horseIdx + 1} đã ra vạch xuất phát!`);
    } else {
      soundFx.seedDrop();
      setStatusMessage(`🐎 Ngựa #${horseIdx + 1} đã tiến ${steps} bước tới ô ${targetPos}.`);
    }

    if (canRollAgain && gameState !== 'SPEED_SELECT') {
      setTimeout(() => {
        setGameState('WAIT_DICE');
        setStatusMessage('🌟 Được thêm lượt đổ xí ngầu do gieo được mặt đặc biệt!');
      }, 900);
    } else {
      setTimeout(() => {
        nextTurn();
      }, 1000);
    }
  };

  const nextTurn = () => {
    setGhostPos(null);
    setCurrentQuestion(null);
    setCurrentQuestionNum(null);
    setBoughtSkills({});
    setCanRollAgain(false);
    setIsSpecialRoll(false);
    setCurrentTurnTeamIdx((currentTurnTeamIdx + 1) % numTeams);
    const nextTeamName = teams[(currentTurnTeamIdx + 1) % numTeams]?.name || 'Đội tiếp theo';
    if (isSkipQuestions) {
      setGameState('WAIT_DICE');
      setStatusMessage(`Lượt của ${nextTeamName}! Hãy bấm "Lắc Xí Ngầu" để di chuyển.`);
    } else {
      setGameState('WAIT_SPIN');
      setStatusMessage(`Lượt của ${nextTeamName}! Bấm "Quay Lựa Chọn Câu Hỏi"`);
    }
  };

  // Hover ghost preview
  const handleHorseHover = (horseIdx: number) => {
    if (gameState !== 'WAIT_MOVE' && gameState !== 'SPEED_SELECT') return;
    const currentPos = horsePositions[currentTurnTeamIdx][horseIdx];
    const special = gameState === 'SPEED_SELECT' ? false : isSpecialRoll;

    const bestMove = getBestTargetPos(currentPos, currentTurnTeamIdx, special);
    if (bestMove.target === -999) {
      setGhostPos(null);
      return;
    }

    const targetPos = bestMove.target;
    const ludoTeam = LUDO_TEAMS[currentTurnTeamIdx];

    if (targetPos < 100) {
      const p = PATH_MAP[targetPos];
      setGhostPos(p);
    } else {
      const p = HOMES[ludoTeam.id]?.[targetPos - 100 - 1]; // Fix array index for HOMES
      if (p) setGhostPos(p);
    }
  };

  // Skill purchases
  const buySkill = (type: 'hint' | 'speed' | 'luck', cost: number) => {
    if (boughtSkills[type]) return;
    if (scores[currentTurnTeamIdx] < cost) {
      safeAlert('Không đủ điểm để mua kỹ năng này!');
      return;
    }

    setScores(prev => {
      const copy = [...prev];
      copy[currentTurnTeamIdx] -= cost;
      return copy;
    });

    setBoughtSkills(prev => ({ ...prev, [type]: true }));
    soundFx.cardPower();

    if (type === 'hint') {
      safeAlert('💡 GỢI Ý: Lắng nghe kỹ nội dung câu hỏi hoặc chú ý từ khóa chính!');
    } else if (type === 'speed') {
      setGameState('SPEED_SELECT');
      setStatusMessage('⚡ TĂNG TỐC: Chọn 1 ngựa trên đường đua để tiến 2 ô!');
    } else if (type === 'luck') {
      setForcedSix(true);
      safeAlert('🎲 SIÊU MAY MẮN: Lần đổ xí ngầu tới chắc chắn ra 6!');
    }
  };

  return (
    <div className="flex-1 min-h-0 w-full p-3 sm:p-4 bg-gradient-to-b from-amber-100 via-amber-50 to-amber-100 text-stone-900 rounded-3xl shadow-2xl border-4 border-amber-800 flex flex-col justify-between overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-amber-200/90 border-2 border-amber-700/60 p-4 rounded-2xl shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🐎</span>
          <div>
            <h2 className="text-xl font-extrabold text-amber-950 flex items-center gap-2">
              <span>Cờ Cá Ngựa Tri Thức</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-600 text-white font-bold">
                {numTeams} Đội Đua
              </span>
            </h2>
            <p className="text-xs text-amber-900 font-medium">
              Trả lời đúng ➔ Đổ xí ngầu ➔ Ra quân & Tiến chuồng!
            </p>
          </div>
        </div>

        {/* Dice Selector & Teams Dashboard */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-amber-300/80 p-1.5 rounded-xl border border-amber-600 text-xs font-bold text-amber-950">
            <span>Xúc xắc:</span>
            <button
              onClick={() => setDiceCount(1)}
              className={`px-2 py-0.5 rounded-lg transition ${diceCount === 1 ? 'bg-amber-700 text-white shadow' : 'hover:bg-amber-400'}`}
            >
              1
            </button>
            <button
              onClick={() => setDiceCount(2)}
              className={`px-2 py-0.5 rounded-lg transition ${diceCount === 2 ? 'bg-amber-700 text-white shadow' : 'hover:bg-amber-400'}`}
            >
              2
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {teams.slice(0, numTeams).map((team, idx) => {
              const isTurn = idx === currentTurnTeamIdx;
              const ludoInfo = LUDO_TEAMS[idx];
              return (
                <div
                  key={team.id}
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition ${
                    isTurn
                      ? `${ludoInfo.lightBg} ${ludoInfo.borderClass} ring-2 ring-amber-500 scale-105 font-bold shadow-md`
                      : 'bg-amber-100/60 border-amber-400 text-stone-700'
                  }`}
                >
                  <span className="text-lg">{team.avatar}</span>
                  <div className="text-xs">
                    <div className="font-bold leading-none">{team.name}</div>
                    <div className="font-mono text-amber-950 font-black mt-0.5">{scores[idx]} điểm</div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() =>
              onGameEnd(
                teams.map((t, idx) => ({ ...t, score: scores[idx] || 0 })),
                answerLogs
              )
            }
            className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition shadow-md"
          >
            Tổng Kết Game
          </button>
        </div>
      </div>

      {/* Horse Skin Selector Bar */}
      <div className="mt-3 p-3 bg-amber-200/90 border-2 border-amber-700/60 rounded-2xl shadow flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-black text-amber-950 font-mono">
          <Palette className="w-4 h-4 text-amber-800" />
          <span>GIAO DIỆN NGỰA TEAM (4 MẪU/TEAM):</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {LUDO_TEAMS.slice(0, numTeams).map(team => {
            const skins = HORSE_SKINS[team.id] || [];
            const activeIdx = selectedSkinIdxs[team.id] ?? 0;
            return (
              <div key={team.id} className="flex items-center gap-1.5 bg-amber-100 p-1.5 rounded-xl border border-amber-400">
                <span className="font-bold text-[11px]" style={{ color: team.color }}>
                  {team.name}:
                </span>
                <div className="flex items-center gap-1">
                  {skins.map((skin, sIdx) => (
                    <button
                      key={skin.id}
                      onClick={() => setSelectedSkinIdxs(prev => ({ ...prev, [team.id]: sIdx }))}
                      className={`px-2 py-0.5 rounded-lg font-bold text-[10px] transition border ${
                        activeIdx === sIdx
                          ? 'bg-amber-800 text-white border-amber-950 shadow scale-105'
                          : 'bg-white text-stone-700 border-amber-300 hover:bg-amber-200'
                      }`}
                      title={skin.name}
                    >
                      {skin.avatar} {sIdx + 1}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Board Stage */}
      <div className="my-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Game Control & Question Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-amber-200/90 border-2 border-amber-700/60 p-4 rounded-2xl shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 font-mono flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-ping" />
                LƯỢT ĐUA: {teams[currentTurnTeamIdx]?.avatar} {teams[currentTurnTeamIdx]?.name}
              </span>
            </div>

            {gameState === 'WAIT_SPIN' && (
              <button
                onClick={handleSpinQuestion}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition transform hover:scale-105"
              >
                <Dices className="w-4 h-4" />
                <span>Quay Lựa Chọn Câu Hỏi</span>
              </button>
            )}

            {gameState === 'WAIT_DICE' && (
              <div className="space-y-3 pt-2 text-center">
                <div className="flex justify-center gap-3">
                  <div className="w-12 h-12 bg-white border-2 border-amber-800 rounded-xl shadow-md flex items-center justify-center text-2xl font-black text-amber-950">
                    {diceVals[0]}
                  </div>
                  {diceCount === 2 && (
                    <div className="w-12 h-12 bg-white border-2 border-amber-800 rounded-xl shadow-md flex items-center justify-center text-2xl font-black text-amber-950">
                      {diceVals[1]}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleRollDice}
                  disabled={isRollingDice}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-black text-xs rounded-xl shadow-lg transition animate-bounce"
                >
                  {isRollingDice ? '🎲 Đang Lắc...' : '🎲 Đổ Xí Ngầu'}
                </button>
              </div>
            )}

            {gameState === 'WAIT_MOVE' && (
              <div className="space-y-2 text-center">
                <div className="text-base font-black text-amber-950 font-mono">
                  🎲 MẶT XÍ NGẦU: {diceCount === 1 ? diceVals[0] : `${diceVals[0]} + ${diceVals[1]} = ${totalDice}`}
                </div>
                <p className="text-xs text-amber-900 font-medium">
                  Rê chuột vào ngựa để xem trước nước đi, bấm chọn ngựa để di chuyển:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {horsePositions[currentTurnTeamIdx].map((pos, hIdx) => {
                    const inBase = pos === -1;
                    const inBarn = pos >= 101;
                    const moveable = canHorseMove(pos, currentTurnTeamIdx, isSpecialRoll);

                    return (
                      <button
                        key={hIdx}
                        onClick={() => handleSelectHorse(hIdx)}
                        onMouseEnter={() => handleHorseHover(hIdx)}
                        onMouseLeave={() => setGhostPos(null)}
                        disabled={!moveable}
                        className={`p-2 rounded-xl text-xs font-extrabold transition shadow flex flex-col items-center justify-center gap-0.5 ${
                          moveable
                            ? 'bg-amber-400 hover:bg-amber-300 text-stone-950 border-2 border-amber-700 animate-pulse cursor-pointer'
                            : 'bg-stone-200 text-stone-500 border border-stone-300 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <span>Ngựa #{hIdx + 1}</span>
                        <span className="text-[10px] font-normal">
                          {inBase ? '🏠 Chuồng' : inBarn ? `🏁 Ô ${pos - 100}` : `📍 Ô ${pos}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {gameState === 'SPEED_SELECT' && (
              <div className="space-y-2 text-center">
                <div className="text-sm font-black text-emerald-950 font-mono">
                  ⚡ KỸ NĂNG TĂNG TỐC: Tiến 2 ô
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {horsePositions[currentTurnTeamIdx].map((pos, hIdx) => {
                    const moveable = canHorseMove(pos, currentTurnTeamIdx, false);
                    return (
                      <button
                        key={hIdx}
                        onClick={() => handleSelectHorse(hIdx)}
                        onMouseEnter={() => handleHorseHover(hIdx)}
                        onMouseLeave={() => setGhostPos(null)}
                        disabled={!moveable}
                        className={`p-2 rounded-xl text-xs font-bold transition ${
                          moveable ? 'bg-emerald-400 hover:bg-emerald-300 text-stone-950 border-2 border-emerald-700' : 'bg-stone-200 opacity-50'
                        }`}
                      >
                        Ngựa #{hIdx + 1} (+2 ô)
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="p-2 bg-amber-100 rounded-xl border border-amber-400 text-xs text-amber-950 font-medium text-center">
              {statusMessage}
            </div>
          </div>

          {/* Skill Shop */}
          <div className="bg-amber-200/90 border-2 border-amber-700/60 p-4 rounded-2xl shadow-lg space-y-2">
            <div className="text-xs font-black text-amber-950 flex items-center justify-between border-b border-amber-600/40 pb-1.5">
              <span>🏪 CỬA HÀNG KỸ NĂNG</span>
              <span className="text-amber-900 font-mono">{scores[currentTurnTeamIdx]}đ</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs bg-amber-100 p-2 rounded-xl border border-amber-300">
                <span className="font-semibold text-amber-950">💡 Gợi ý (1đ)</span>
                <button
                  onClick={() => buySkill('hint', 1)}
                  disabled={scores[currentTurnTeamIdx] < 1 || boughtSkills['hint']}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-300 text-white font-bold rounded-lg text-[11px]"
                >
                  Mua
                </button>
              </div>

              <div className="flex items-center justify-between text-xs bg-amber-100 p-2 rounded-xl border border-amber-300">
                <span className="font-semibold text-amber-950">⚡ Tăng tốc 2 ô (2đ)</span>
                <button
                  onClick={() => buySkill('speed', 2)}
                  disabled={scores[currentTurnTeamIdx] < 2 || boughtSkills['speed']}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-300 text-white font-bold rounded-lg text-[11px]"
                >
                  Mua
                </button>
              </div>

              <div className="flex items-center justify-between text-xs bg-amber-100 p-2 rounded-xl border border-amber-300">
                <span className="font-semibold text-amber-950">🎲 Siêu may mắn - Lắc ra 6 (4đ)</span>
                <button
                  onClick={() => buySkill('luck', 4)}
                  disabled={scores[currentTurnTeamIdx] < 4 || boughtSkills['luck']}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-stone-300 text-white font-bold rounded-lg text-[11px]"
                >
                  Mua
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: 15x15 Cờ Cá Ngựa Grid Map */}
        <div className="lg:col-span-8 flex justify-center">
          <div className="relative w-full max-w-[550px] aspect-square bg-gradient-to-br from-amber-300 via-yellow-200 to-amber-300 border-8 border-amber-900 rounded-3xl shadow-2xl p-2 select-none overflow-hidden">
            {/* 15x15 Board Grid */}
            <div className="w-full h-full grid grid-cols-15 grid-rows-15 gap-0.5 bg-amber-950/20 p-1 rounded-2xl relative">
              {/* Bases in 4 corners */}
              {/* Blue Base Top-Left */}
              <div className="col-span-6 row-span-6 bg-blue-100 border-2 border-blue-600 rounded-2xl p-2 flex flex-col justify-between relative shadow-inner">
                <div className="flex items-center justify-between text-[10px] font-black text-blue-900 uppercase tracking-wide">
                  <span>🏠 CHUỒNG LAM</span>
                  <span className="px-1.5 py-0.5 rounded bg-white border border-blue-400 shadow-xs font-mono text-[9px] text-blue-950">
                    {scores[1] || 0}đ
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 p-1">
                  {horsePositions[1]?.map((pos, hIdx) => (
                    <div key={hIdx} className="relative flex flex-col items-center">
                      <div className="absolute -top-1.5 z-10 px-1 py-0.2 rounded-full bg-white border border-blue-700 text-[8px] font-black font-mono text-blue-950 shadow-xs">
                        #{hIdx + 1}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-white border-2 border-blue-500 shadow-md flex items-center justify-center text-base font-black pt-1">
                        {pos === -1 ? getHorseAvatar('blue', hIdx) : '✓'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Yellow Base Top-Right */}
              <div className="col-start-10 col-span-6 row-span-6 bg-amber-100 border-2 border-amber-600 rounded-2xl p-2 flex flex-col justify-between relative shadow-inner">
                <div className="flex items-center justify-between text-[10px] font-black text-amber-900 uppercase tracking-wide">
                  <span>🏠 CHUỒNG VÀNG</span>
                  <span className="px-1.5 py-0.5 rounded bg-white border border-amber-400 shadow-xs font-mono text-[9px] text-amber-950">
                    {scores[2] || 0}đ
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 p-1">
                  {horsePositions[2]?.map((pos, hIdx) => (
                    <div key={hIdx} className="relative flex flex-col items-center">
                      <div className="absolute -top-1.5 z-10 px-1 py-0.2 rounded-full bg-white border border-amber-700 text-[8px] font-black font-mono text-amber-950 shadow-xs">
                        #{hIdx + 1}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-white border-2 border-amber-500 shadow-md flex items-center justify-center text-base font-black pt-1">
                        {pos === -1 ? getHorseAvatar('yellow', hIdx) : '✓'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Red Base Bottom-Left */}
              <div className="row-start-10 col-span-6 row-span-6 bg-rose-100 border-2 border-rose-600 rounded-2xl p-2 flex flex-col justify-between relative shadow-inner">
                <div className="flex items-center justify-between text-[10px] font-black text-rose-900 uppercase tracking-wide">
                  <span>🏠 CHUỒNG ĐỎ</span>
                  <span className="px-1.5 py-0.5 rounded bg-white border border-rose-400 shadow-xs font-mono text-[9px] text-rose-950">
                    {scores[0] || 0}đ
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 p-1">
                  {horsePositions[0]?.map((pos, hIdx) => (
                    <div key={hIdx} className="relative flex flex-col items-center">
                      <div className="absolute -top-1.5 z-10 px-1 py-0.2 rounded-full bg-white border border-rose-700 text-[8px] font-black font-mono text-rose-950 shadow-xs">
                        #{hIdx + 1}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-white border-2 border-rose-500 shadow-md flex items-center justify-center text-base font-black pt-1">
                        {pos === -1 ? getHorseAvatar('red', hIdx) : '✓'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Green Base Bottom-Right */}
              <div className="row-start-10 col-start-10 col-span-6 row-span-6 bg-emerald-100 border-2 border-emerald-600 rounded-2xl p-2 flex flex-col justify-between relative shadow-inner">
                <div className="flex items-center justify-between text-[10px] font-black text-emerald-900 uppercase tracking-wide">
                  <span>🏠 CHUỒNG LỤC</span>
                  <span className="px-1.5 py-0.5 rounded bg-white border border-emerald-400 shadow-xs font-mono text-[9px] text-emerald-950">
                    {scores[3] || 0}đ
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 p-1">
                  {horsePositions[3]?.map((pos, hIdx) => (
                    <div key={hIdx} className="relative flex flex-col items-center">
                      <div className="absolute -top-1.5 z-10 px-1 py-0.2 rounded-full bg-white border border-emerald-700 text-[8px] font-black font-mono text-emerald-950 shadow-xs">
                        #{hIdx + 1}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-white border-2 border-emerald-500 shadow-md flex items-center justify-center text-base font-black pt-1">
                        {pos === -1 ? getHorseAvatar('green', hIdx) : '✓'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Center Goal 3x3 */}
              <div className="col-start-7 col-span-3 row-start-7 row-span-3 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 border-4 border-amber-800 rounded-full flex flex-col items-center justify-center shadow-xl z-20">
                <Trophy className="w-8 h-8 text-amber-950 animate-bounce" />
                <span className="text-[9px] font-black text-amber-950 tracking-wider uppercase">ĐÍCH</span>
              </div>

              {/* 52 Track Cells */}
              {PATH_MAP.map((pos, idx) => {
                let isStart = idx === 0 || idx === 13 || idx === 26 || idx === 39;
                let startBg =
                  idx === 0
                    ? 'bg-rose-500 text-white'
                    : idx === 13
                    ? 'bg-blue-500 text-white'
                    : idx === 26
                    ? 'bg-amber-500 text-white'
                    : idx === 39
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/80 border-amber-300';

                return (
                  <div
                    key={`track-${idx}`}
                    style={{ gridRowStart: pos.r, gridColumnStart: pos.c }}
                    className={`rounded-full border border-amber-800/40 flex items-center justify-center text-[8px] font-mono font-bold shadow-xs relative ${startBg}`}
                  >
                    {isStart && '🚩'}
                  </div>
                );
              })}

              {/* Finish Barn Track Cells for Each Team */}
              {Object.entries(HOMES).map(([teamKey, homeCells]) => {
                const bg =
                  teamKey === 'red'
                    ? 'bg-rose-400'
                    : teamKey === 'blue'
                    ? 'bg-blue-400'
                    : teamKey === 'yellow'
                    ? 'bg-amber-400'
                    : 'bg-emerald-400';

                return homeCells.map((pos, idx) => (
                  <div
                    key={`home-${teamKey}-${idx}`}
                    style={{ gridRowStart: pos.r, gridColumnStart: pos.c }}
                    className={`rounded-lg border border-amber-800/60 ${bg} text-white flex items-center justify-center text-[9px] font-extrabold shadow-inner`}
                  >
                    {idx + 1}
                  </div>
                ));
              })}

              {/* Ghost Hover Marker */}
              {ghostPos && (
                <div
                  style={{ gridRowStart: ghostPos.r, gridColumnStart: ghostPos.c }}
                  className="rounded-full bg-amber-400/80 border-2 border-amber-700 animate-ping z-30 pointer-events-none flex items-center justify-center text-xs"
                >
                  🐴
                </div>
              )}

              {/* Render Active Horses on Track */}
              {horsePositions.map((teamHorses, tIdx) => {
                const ludoTeam = LUDO_TEAMS[tIdx];

                return teamHorses.map((pos, hIdx) => {
                  if (pos === -1) return null; // In base

                  let gridR = 0;
                  let gridC = 0;

                  if (pos < 100) {
                    const p = PATH_MAP[pos];
                    gridR = p.r;
                    gridC = p.c;
                  } else {
                    const p = HOMES[ludoTeam.id]?.[pos - 100];
                    if (p) {
                      gridR = p.r;
                      gridC = p.c;
                    }
                  }

                  if (!gridR || !gridC) return null;

                  return (
                    <div
                      key={`horse-${tIdx}-${hIdx}`}
                      style={{ gridRowStart: gridR, gridColumnStart: gridC }}
                      className={`z-40 rounded-full ${ludoTeam.bgClass} border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-black transform hover:scale-125 transition cursor-pointer p-0.5`}
                      title={`${ludoTeam.name} - Ngựa #${hIdx + 1}`}
                    >
                      {getHorseAvatar(ludoTeam.id, hIdx)}
                    </div>
                  );
                });
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Question Modal */}
      <QuestionDisplayModal
        isOpen={gameState === 'WAIT_JUDGE'}
        questionNumber={currentQuestionNum || 1}
        question={currentQuestion}
        mode={config.mode}
        teamName={teams[currentTurnTeamIdx]?.name}
        teamAvatar={teams[currentTurnTeamIdx]?.avatar}
        timerEnabled={config.timerEnabled}
        timeLimitSeconds={config.timeLimitSeconds}
        titlePrefix="🐎 CỜ CÁ NGỰA -"
        onAnswerSubmit={(isCorrect, correctAnswerText) => {
          handleJudgeAnswer(isCorrect, correctAnswerText);
        }}
      />
    </div>
  );
};
