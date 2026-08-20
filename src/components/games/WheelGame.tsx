import { safeAlert, safeConfirm } from "../../utils/safeAlert";
import React, { useState } from 'react';
import { GameSetupConfig, Question, AnswerLog, PRESET_THEMES, GameTheme } from '../../types';
import { soundFx } from '../../utils/audio';
import { Disc } from 'lucide-react';
import { QuestionDisplayModal } from '../QuestionDisplayModal';

interface WheelGameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: any[], answerLogs: AnswerLog[]) => void;
}

export interface ThemeWheelConfig {
  wheelColors: string[];
  wheelBorder: string;
  wheelCenter: string;
  wheelCenterBorder: string;
  wheelText: string;
  wheelDivider: string;
  pointerColor: string;
  shadowColor: string;
}

export const THEME_WHEEL_CONFIGS: Record<GameTheme, ThemeWheelConfig> = {
  basic: {
    // 🎨 Cơ Bản (Kẹo Ngọt) - Pastel
    wheelColors: ['#f472b6', '#fbbf24', '#38bdf8', '#c084fc', '#fb923c', '#4ade80', '#f43f5e', '#a7f3d0'],
    wheelBorder: '#ec4899',
    wheelCenter: '#ffffff',
    wheelCenterBorder: '#f472b6',
    wheelText: '#ffffff',
    wheelDivider: '#ffffff',
    pointerColor: '#ec4899',
    shadowColor: 'rgba(236, 72, 153, 0.4)',
  },
  ocean: {
    // 🌊 Đại Dương Mơ Màng
    wheelColors: ['#7dd3fc', '#22d3ee', '#2dd4bf', '#3b82f6', '#1d4ed8', '#06b6d4', '#60a5fa', '#0284c7'],
    wheelBorder: '#0284c7',
    wheelCenter: '#f0f9ff',
    wheelCenterBorder: '#0369a1',
    wheelText: '#ffffff',
    wheelDivider: '#f0f9ff',
    pointerColor: '#0ea5e9',
    shadowColor: 'rgba(2, 132, 199, 0.4)',
  },
  detective: {
    // 🔍 Sổ Tay Thám Tử
    wheelColors: ['#fef08a', '#fde68a', '#d97706', '#65a30d', '#dc2626', '#64748b', '#b45309', '#475569'],
    wheelBorder: '#78350f',
    wheelCenter: '#fef3c7',
    wheelCenterBorder: '#92400e',
    wheelText: '#ffffff',
    wheelDivider: '#78350f',
    pointerColor: '#b45309',
    shadowColor: 'rgba(120, 53, 15, 0.4)',
  },
  cowboy: {
    // 🤠 Thảo Nguyên Nắng
    wheelColors: ['#facc15', '#f97316', '#16a34a', '#0ea5e9', '#b45309', '#f59e0b', '#dc2626', '#854d0e'],
    wheelBorder: '#92400e',
    wheelCenter: '#fffbeb',
    wheelCenterBorder: '#d97706',
    wheelText: '#ffffff',
    wheelDivider: '#ffffff',
    pointerColor: '#ea580c',
    shadowColor: 'rgba(146, 64, 14, 0.4)',
  },
  cloud: {
    // ☁️ Mây Mộng Mơ
    wheelColors: ['#93c5fd', '#fef3c7', '#ddd6fe', '#fbcfe8', '#a7f3d0', '#c084fc', '#818cf8', '#f472b6'],
    wheelBorder: '#a855f7',
    wheelCenter: '#ffffff',
    wheelCenterBorder: '#c084fc',
    wheelText: '#ffffff',
    wheelDivider: '#ffffff',
    pointerColor: '#9333ea',
    shadowColor: 'rgba(168, 85, 247, 0.4)',
  },
  note: {
    // 📝 Sổ Tay Pastel
    wheelColors: ['#fca5a5', '#e9d5ff', '#bfdbfe', '#fef08a', '#fed7aa', '#bbf7d0', '#f472b6', '#818cf8'],
    wheelBorder: '#f59e0b',
    wheelCenter: '#ffffff',
    wheelCenterBorder: '#fbbf24',
    wheelText: '#ffffff',
    wheelDivider: '#ffffff',
    pointerColor: '#f59e0b',
    shadowColor: 'rgba(245, 158, 11, 0.4)',
  },
  rainbow: {
    // 🌈 Cầu Vồng Pastel
    wheelColors: ['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#c084fc', '#f472b6', '#38bdf8'],
    wheelBorder: '#e11d48',
    wheelCenter: '#ffffff',
    wheelCenterBorder: '#f43f5e',
    wheelText: '#ffffff',
    wheelDivider: '#ffffff',
    pointerColor: '#e11d48',
    shadowColor: 'rgba(225, 29, 72, 0.4)',
  },
  galaxy: {
    // 🌌 Vũ Trụ Huyền Diệu
    wheelColors: ['#312e81', '#6b21a8', '#3730a3', '#0284c7', '#86198f', '#1e1b4b', '#4c1d95', '#0f172a'],
    wheelBorder: '#a855f7',
    wheelCenter: '#0f172a',
    wheelCenterBorder: '#c084fc',
    wheelText: '#ffffff',
    wheelDivider: '#a855f7',
    pointerColor: '#f43f5e',
    shadowColor: 'rgba(168, 85, 247, 0.5)',
  },
  forest: {
    // 🌲 Khu Rừng Thơ Mộng
    wheelColors: ['#15803d', '#86efac', '#4d7c0f', '#854d0e', '#eab308', '#059669', '#166534', '#15803d'],
    wheelBorder: '#166534',
    wheelCenter: '#f0fdf4',
    wheelCenterBorder: '#15803d',
    wheelText: '#ffffff',
    wheelDivider: '#ffffff',
    pointerColor: '#16a34a',
    shadowColor: 'rgba(22, 101, 52, 0.4)',
  },
};

function getSliceColor(idx: number, totalSlices: number, palette: string[]): string {
  if (!palette || palette.length === 0) return '#3b82f6';
  let colorIdx = idx % palette.length;
  // If the last slice touches the first slice with the same color, shift palette index
  if (totalSlices > 1 && idx === totalSlices - 1 && colorIdx === 0) {
    colorIdx = (colorIdx + 1) % palette.length;
  }
  return palette[colorIdx];
}

export const WheelGame: React.FC<WheelGameProps> = ({ config, questions, onGameEnd }) => {
  const totalSlices = config.mode === 'bank' ? questions.length : config.totalQuestionsNumber;
  const [rotation, setRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [selectedSliceIdx, setSelectedSliceIdx] = useState<number | null>(null);
  const [usedSliceIndices, setUsedSliceIndices] = useState<number[]>([]);

  const [teams, setTeams] = useState(config.teams);
  const [currentTurnTeamIdx, setCurrentTurnTeamIdx] = useState<number>(0);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);

  // Question modal state
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionNum, setCurrentQuestionNum] = useState<number | null>(null);
  const [showAnswerResult, setShowAnswerResult] = useState<boolean>(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

  const themeInfo = PRESET_THEMES.find(t => t.id === config.theme) || PRESET_THEMES[0];
  const themeConfig = THEME_WHEEL_CONFIGS[config.theme] || THEME_WHEEL_CONFIGS.basic;
  const currentTeam = teams[currentTurnTeamIdx] || teams[0];

  const handleSpinWheel = () => {
    if (isSpinning) return;

    let available = Array.from({ length: totalSlices }, (_, i) => i).filter(i => !usedSliceIndices.includes(i));
    if (available.length === 0) {
      safeAlert('Tất cả vạch trên vòng quay đã được chọn! Đang kết thúc game.');
      setTimeout(() => onGameEnd(teams, answerLogs), 500);
      return;
    }

    const winnerIdxInAvailable = Math.floor(Math.random() * available.length);
    const winnerSlice = available[winnerIdxInAvailable];

    const sliceAngle = 360 / totalSlices;
    const sliceCenterAngle = winnerSlice * sliceAngle + sliceAngle / 2;

    // Calculate target rotation so winnerSlice lands under top pointer at 12 o'clock (270° in SVG angle)
    const currentMod = (rotation % 360 + 360) % 360;
    let targetMod = (270 - sliceCenterAngle) % 360;
    if (targetMod < 0) targetMod += 360;

    let delta = targetMod - currentMod;
    if (delta <= 0) delta += 360;

    const extraTurns = (5 + Math.floor(Math.random() * 3)) * 360;
    const targetDegree = rotation + extraTurns + delta;

    setIsSpinning(true);
    soundFx.diceRoll();

    let tickCount = 0;
    const tickInterval = setInterval(() => {
      soundFx.wheelTick();
      tickCount++;
      if (tickCount > 35) clearInterval(tickInterval);
    }, 100);

    setRotation(targetDegree);

    setTimeout(() => {
      clearInterval(tickInterval);
      setIsSpinning(false);
      setSelectedSliceIdx(winnerSlice);
      setUsedSliceIndices(prev => [...prev, winnerSlice]);

      const qNum = winnerSlice + 1;
      setCurrentQuestionNum(qNum);

      if (config.mode === 'bank') {
        setCurrentQuestion(questions[winnerSlice % questions.length] || null);
      } else {
        setCurrentQuestion(null);
      }

      setShowAnswerResult(false);
      setIsAnswerCorrect(null);
    }, 4000);
  };

  const handleConfirmTurnClose = (isCorrect: boolean, correctAnswerText: string) => {
    if (selectedSliceIdx === null) return;

    const pointsEarned = config.pointsPerCorrect || 100;

    let finalTeams = teams;
    if (isCorrect && config.teamMode) {
      finalTeams = teams.map((t, idx) => idx === currentTurnTeamIdx ? { ...t, score: t.score + pointsEarned } : t);
      setTeams(finalTeams);
    }

    const log: AnswerLog = {
      questionNumber: currentQuestionNum || 1,
      questionText: currentQuestion ? currentQuestion.content : `Vạch số ${currentQuestionNum}`,
      correctAnswer: correctAnswerText,
      teamName: currentTeam.name,
      isCorrect: isCorrect,
    };

    const newLogs = [...answerLogs, log];
    setAnswerLogs(newLogs);

    setSelectedSliceIdx(null);
    setCurrentQuestion(null);

    if (config.teamMode) {
      setCurrentTurnTeamIdx((currentTurnTeamIdx + 1) % teams.length);
    }

    if (usedSliceIndices.length >= totalSlices) {
      soundFx.winFanfare();
      setTimeout(() => onGameEnd(finalTeams, newLogs), 600);
    }
  };

  // Font size calculation depending on number of slices
  let mainFontSize = 4.5;
  let subFontSize = 3.0;
  if (totalSlices > 12) {
    mainFontSize = 3.2;
    subFontSize = 2.2;
  } else if (totalSlices > 8) {
    mainFontSize = 3.8;
    subFontSize = 2.6;
  }

  return (
    <div 
      className="flex-1 min-h-0 w-full p-4 sm:p-6 rounded-3xl shadow-2xl flex flex-col justify-between relative overflow-hidden select-none border-4"
      style={{
        backgroundImage: `url(/assets/themes/${config.theme}.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderColor: themeConfig.wheelBorder,
      }}
    >
      <div className="absolute inset-0 pointer-events-none bg-slate-950/40 backdrop-blur-[2px]"></div>
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/75 backdrop-blur-md border border-white/20 p-4 rounded-2xl z-10 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-3xl animate-bounce">🎡</span>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>Vòng Quay Kỳ Diệu</span>
              <span 
                className="text-xs px-2.5 py-0.5 rounded-full font-bold border"
                style={{
                  backgroundColor: `${themeConfig.wheelBorder}33`,
                  borderColor: themeConfig.wheelBorder,
                  color: themeConfig.wheelCenter,
                }}
              >
                {themeInfo.icon} {themeInfo.name}
              </span>
            </h2>
            <p className="text-xs text-slate-200 font-medium">
              Quay vòng quay ➔ Trúng vạch câu hỏi ➔ Trả lời nhận điểm thưởng!
            </p>
          </div>
        </div>

        {/* Teams Dashboard */}
        {config.teamMode && (
          <div className="flex items-center gap-2 flex-wrap">
            {teams.map((team, idx) => {
              const isTurn = idx === currentTurnTeamIdx;
              return (
                <div
                  key={team.id}
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all ${
                    isTurn
                      ? 'bg-amber-500/30 border-amber-400 text-amber-200 ring-2 ring-amber-400/60 scale-105 shadow-lg'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="text-lg">{team.avatar}</span>
                  <div className="text-xs">
                    <div className="font-bold leading-none" style={{ color: team.color }}>{team.name}</div>
                    <div className="font-mono text-amber-300 font-extrabold mt-0.5">{team.score} điểm</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={() => onGameEnd(teams, answerLogs)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl transition shadow-lg"
        >
          Kết Thúc
        </button>
      </div>

      {/* Wheel Arena */}
      <div className="my-6 flex flex-col items-center justify-center space-y-6 z-10">
        <div className="relative flex flex-col items-center">
          {/* Top Pointer Indicator */}
          <div className="z-20 -mb-5 relative flex items-center justify-center">
            <svg width="38" height="38" viewBox="0 0 38 38" className="drop-shadow-2xl filter">
              <polygon 
                points="19,34 6,8 32,8" 
                fill={themeConfig.pointerColor} 
                stroke="#ffffff" 
                strokeWidth="2.5" 
                strokeLinejoin="round" 
              />
            </svg>
          </div>

          {/* SVG Wheel Container */}
          <div
            className="w-80 sm:w-[420px] h-80 sm:h-[420px] rounded-full shadow-2xl transition-transform ease-out relative"
            style={{
              transform: `rotate(${rotation}deg)`,
              transitionDuration: isSpinning ? '4000ms' : '0ms',
              boxShadow: `0 20px 50px ${themeConfig.shadowColor}`,
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full rounded-full overflow-hidden">
              {/* Outer Border Circle */}
              <circle cx="50" cy="50" r="49.5" fill="none" stroke={themeConfig.wheelBorder} strokeWidth="1.5" />

              {/* Render Slices */}
              {Array.from({ length: totalSlices }).map((_, idx) => {
                const sliceAngle = 360 / totalSlices;
                const startAngle = idx * sliceAngle;
                const endAngle = (idx + 1) * sliceAngle;
                
                // SVG Path math for pie slice
                const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);
                const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                const sliceColor = getSliceColor(idx, totalSlices, themeConfig.wheelColors);
                const isUsed = usedSliceIndices.includes(idx);

                // Math for Text Placement strictly at 66% Radius along midAngle
                const midAngle = startAngle + sliceAngle / 2;
                const midAngleRad = (midAngle * Math.PI) / 180;
                const textR = 33; // 66% of radius 50
                const cx = 50 + textR * Math.cos(midAngleRad);
                const cy = 50 + textR * Math.sin(midAngleRad);

                // Check text orientation: If in bottom-left half (90° to 270°), flip 180° so text is NEVER upside down!
                const normAngle = (midAngle % 360 + 360) % 360;
                const isFlipped = normAngle > 90 && normAngle < 270;
                const textAngle = isFlipped ? normAngle + 180 : normAngle;

                // Slice Labels
                const isBank = config.mode === 'bank';
                const mainLabel = isBank ? `Câu ${idx + 1}` : `+${(idx % 5 + 1) * 100}đ`;
                const subLabel = isBank && config.pointsPerCorrect ? `+${config.pointsPerCorrect}đ` : null;

                return (
                  <g key={idx}>
                    <path
                      d={pathData}
                      fill={isUsed ? '#334155' : sliceColor}
                      stroke={themeConfig.wheelDivider}
                      strokeWidth="0.6"
                      opacity={isUsed ? 0.45 : 0.95}
                    />

                    {/* Centered Segment Text */}
                    <g transform={`translate(${cx}, ${cy}) rotate(${textAngle})`}>
                      <text
                        x="0"
                        y={subLabel ? "-1.2" : "0"}
                        fill={themeConfig.wheelText}
                        fontSize={mainFontSize}
                        fontWeight="900"
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{
                          filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.85))',
                          fontFamily: 'sans-serif',
                        }}
                      >
                        {mainLabel}
                      </text>
                      {subLabel && (
                        <text
                          x="0"
                          y={mainFontSize * 0.75}
                          fill="#fef08a"
                          fontSize={subFontSize}
                          fontWeight="800"
                          textAnchor="middle"
                          dominantBaseline="central"
                          style={{
                            filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.85))',
                            fontFamily: 'sans-serif',
                          }}
                        >
                          {subLabel}
                        </text>
                      )}
                    </g>
                  </g>
                );
              })}

              {/* Center Circle Hub */}
              <circle cx="50" cy="50" r="10" fill={themeConfig.wheelCenter} stroke={themeConfig.wheelCenterBorder} strokeWidth="1.8" />
              <text 
                x="50" 
                y="50" 
                textAnchor="middle" 
                dominantBaseline="central" 
                fontSize="4.5" 
                fontWeight="900" 
                fill={themeConfig.wheelCenterBorder}
              >
                ★
              </text>
            </svg>
          </div>

          {/* Spin Action Button */}
          <div className="mt-6">
            <button
              disabled={isSpinning}
              onClick={handleSpinWheel}
              className="flex items-center gap-2.5 px-8 py-3.5 text-slate-950 font-black text-sm rounded-full shadow-2xl transition transform hover:scale-105 active:scale-95 disabled:opacity-50 border-2 border-white/80 cursor-pointer"
              style={{
                backgroundColor: themeConfig.pointerColor,
                color: '#ffffff',
                boxShadow: `0 10px 30px ${themeConfig.shadowColor}`,
              }}
            >
              <Disc className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? 'Đang Quay Vòng...' : `Lượt: ${currentTeam.name} - QUAY NGAY!`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Question Modal */}
      <QuestionDisplayModal
        isOpen={selectedSliceIdx !== null}
        questionNumber={currentQuestionNum || 1}
        question={currentQuestion}
        mode={config.mode}
        teamName={config.teamMode ? currentTeam.name : undefined}
        teamAvatar={config.teamMode ? currentTeam.avatar : undefined}
        timerEnabled={config.timerEnabled}
        timeLimitSeconds={config.timeLimitSeconds}
        titlePrefix="🎡 VÒNG QUAY SỐ"
        onAnswerSubmit={(isCorrect, correctAnswerText) => {
          handleConfirmTurnClose(isCorrect, correctAnswerText);
        }}
      />

      <div className="text-center text-xs text-slate-200 font-medium pt-2 z-10">
        Vòng quay hiển thị theo chủ đề <strong className="text-amber-300">{themeInfo.name}</strong>. Mỗi vạch ứng với một câu hỏi ôn tập!
      </div>
    </div>
  );
};
