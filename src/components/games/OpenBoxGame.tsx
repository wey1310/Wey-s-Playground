import React, { useState, useEffect } from 'react';
import { GameSetupConfig, Question, AnswerLog, PRESET_THEMES, GameTheme } from '../../types';
import { soundFx } from '../../utils/audio';
import { QuestionDisplayModal } from '../QuestionDisplayModal';

interface OpenBoxGameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: any[], answerLogs: AnswerLog[]) => void;
}

// Custom theme box graphic component rendering unique closed/open-correct/open-wrong visual designs
const getOpenBoxImages = (theme: string) => {
  const webpMap: Record<string, string> = {
    'ocean': 'daiduong',
    'detective': 'thamtu',
    'cowboy': 'caoboi',
    'cloud': 'may',
    'basic': 'basic'
  };
  
  if (webpMap[theme]) {
    const pfx = webpMap[theme];
    return {
      closed: `/assets/games/openbox/${pfx}closed.webp`,
      correct: `/assets/games/openbox/${pfx}opened-correct.webp`,
      wrong: `/assets/games/openbox/${pfx}opened-wrong.webp`
    };
  }

  // Uses .jpg for newly generated themes
  const jpgMap: Record<string, string> = {
    'forest': 'forest',
    'galaxy': 'galaxy',
    'rainbow': 'rainbow',
    'note': 'note'
  };

  const pfx = jpgMap[theme] || 'basic';
  const ext = jpgMap[theme] ? 'jpg' : 'webp';
  return {
    closed: `/assets/games/openbox/${pfx}closed.${ext}`,
    correct: `/assets/games/openbox/${pfx}opened-correct.${ext}`,
    wrong: `/assets/games/openbox/${pfx}opened-wrong.${ext}`
  };
};

const ThemeBoxGraphic: React.FC<{
  theme: GameTheme;
  boxNumber: number;
  isOpened: boolean;
  isCorrect: boolean | null;
}> = ({ theme, boxNumber, isOpened, isCorrect }) => {
  const imgs = getOpenBoxImages(theme);
  
  let src = imgs.closed;
  if (isOpened) {
    src = isCorrect ? imgs.correct : imgs.wrong;
  }

  const fallbackSrc = isOpened 
    ? (isCorrect ? '/assets/games/openbox/basicopened-correct.webp' : '/assets/games/openbox/basicopened-wrong.webp')
    : '/assets/games/openbox/basicclosed.webp';

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none transform hover:scale-105 transition">
      <img 
        src={src} 
        alt="Box" 
        className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-2xl filter hover:brightness-110 transition-all"
        onError={(e) => {
          (e.target as HTMLImageElement).src = fallbackSrc;
        }}
      />
      {!isOpened && (
        <div className="absolute bottom-1 sm:bottom-2 text-[11px] sm:text-xs font-black text-amber-900 bg-white/95 px-2.5 py-0.5 rounded-full border-2 border-amber-500 shadow-md pointer-events-none">
          Hộp #{boxNumber}
        </div>
      )}
      {isOpened && (
        <div className={`absolute bottom-0 text-[10px] font-black px-2 py-0.5 rounded-full border-2 shadow-lg pointer-events-none ${isCorrect ? 'text-emerald-900 bg-emerald-100 border-emerald-500' : 'text-rose-900 bg-rose-100 border-rose-500'}`}>
          #{boxNumber} {isCorrect ? 'Đúng' : 'Sai'}
        </div>
      )}
    </div>
  );
};

export const OpenBoxGame: React.FC<OpenBoxGameProps> = ({ config, questions, onGameEnd }) => {
  const totalCount = config.mode === 'bank' ? questions.length : config.totalQuestionsNumber;
  const [openedBoxes, setOpenedBoxes] = useState<boolean[]>(new Array(totalCount).fill(false));
  const [boxResults, setBoxResults] = useState<(boolean | null)[]>(new Array(totalCount).fill(null));
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null);
  const [currentTurnTeamIdx, setCurrentTurnTeamIdx] = useState<number>(0);
  const [teams, setTeams] = useState(config.teams);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);

  // Active question state
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionNum, setCurrentQuestionNum] = useState<number>(1);

  // Timer
  const [timeLeft, setTimeLeft] = useState<number>(config.timeLimitSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  const themeInfo = PRESET_THEMES.find(t => t.id === config.theme) || PRESET_THEMES[0];

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            soundFx.timerTick();
            setIsTimerRunning(false);
            return 0;
          }
          if (prev <= 5) soundFx.timerTick();
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const handlePickBox = (index: number) => {
    if (openedBoxes[index]) return;

    soundFx.cardPower();
    setSelectedBoxIndex(index);
    const boxNum = index + 1;
    setCurrentQuestionNum(boxNum);

    if (config.mode === 'bank') {
      const q = questions[index % questions.length];
      setCurrentQuestion(q);
    } else {
      setCurrentQuestion(null);
    }

    if (config.timerEnabled) {
      setTimeLeft(config.timeLimitSeconds);
      setIsTimerRunning(true);
    }
  };

  const handleConfirmTurnClose = (isCorrect: boolean, correctAnswerText: string) => {
    if (selectedBoxIndex === null) return;

    // Mark box as opened and record result
    const updatedBoxes = [...openedBoxes];
    updatedBoxes[selectedBoxIndex] = true;
    setOpenedBoxes(updatedBoxes);

    const updatedResults = [...boxResults];
    updatedResults[selectedBoxIndex] = isCorrect;
    setBoxResults(updatedResults);

    // Add score if correct
    let finalTeams = teams;
    if (isCorrect && config.teamMode) {
      finalTeams = teams.map((t, idx) => idx === currentTurnTeamIdx ? { ...t, score: t.score + 10 } : t);
      setTeams(finalTeams);
    }

    // Record answer log
    const currentTeam = teams[currentTurnTeamIdx];
    const log: AnswerLog = {
      questionNumber: currentQuestionNum,
      questionText: currentQuestion ? currentQuestion.content : `Hộp số ${currentQuestionNum}`,
      correctAnswer: correctAnswerText,
      teamName: currentTeam ? currentTeam.name : undefined,
      isCorrect: isCorrect,
    };

    const newLogs = [...answerLogs, log];
    setAnswerLogs(newLogs);

    // Reset box view
    setSelectedBoxIndex(null);
    setCurrentQuestion(null);

    // Rotate team turn if team mode enabled
    if (config.teamMode) {
      setCurrentTurnTeamIdx((currentTurnTeamIdx + 1) % teams.length);
    }

    // Check if all boxes opened
    if (updatedBoxes.every(b => b)) {
      soundFx.winFanfare();
      setTimeout(() => onGameEnd(finalTeams, newLogs), 600);
    }
  };

  // Background style helper
  const getThemeBgStyle = (theme: GameTheme) => {
    return {
      backgroundImage: `url(/assets/themes/${theme}.jpg)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };
  };

  return (
    <div className="game-fit-screen p-2 sm:p-4 rounded-2xl shadow-xl flex flex-col justify-between border-2 border-amber-900/20 relative overflow-hidden max-w-full" style={getThemeBgStyle(config.theme)}>
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-white/70 backdrop-blur-sm"></div>
      
      {/* Game Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-w-bg-card/95 backdrop-blur border border-w-border px-3 py-2 rounded-xl shadow-md z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl filter drop-shadow">🎁</span>
          <div>
            <h2 className="text-xs sm:text-sm font-black text-w-text-main flex items-center gap-2 font-mono">
              <span>MỞ HỘP BÍ MẬT</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 font-sans border border-amber-400/30">
                {themeInfo.icon} {themeInfo.name}
              </span>
            </h2>
            <p className="text-[10px] text-w-text-muted font-medium">
              {config.mode === 'bank' ? 'Ngân hàng câu hỏi' : 'Chế độ Số'} • Đã mở {openedBoxes.filter(Boolean).length}/{totalCount} hộp
            </p>
          </div>
        </div>

        {/* Teams Dashboard */}
        {config.teamMode && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {teams.map((team, idx) => {
              const isCurrentTurn = idx === currentTurnTeamIdx;
              return (
                <div
                  key={team.id}
                  className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition transform ${
                    isCurrentTurn
                      ? 'bg-amber-500/20 border-amber-400 text-amber-600 ring-2 ring-amber-400/40 shadow-xs'
                      : 'bg-w-bg-alt border-w-border text-w-text-main'
                  }`}
                >
                  <span className="text-base">{team.avatar}</span>
                  <div className="text-[11px]">
                    <div className="font-bold leading-none">{team.name}</div>
                    <div className="font-mono text-amber-600 font-extrabold">{team.score}đ</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={() => onGameEnd(teams, answerLogs)}
          className="wey-btn-danger px-3 py-1.5 text-xs rounded-xl cursor-pointer shrink-0"
        >
          Kết Thúc Game
        </button>
      </div>

      {/* Grid of Theme Boxes */}
      <div className="my-auto py-2 flex-1 min-h-0 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 z-10 justify-items-center items-center max-w-5xl mx-auto w-full">
        {Array.from({ length: totalCount }).map((_, idx) => {
          const isOpened = openedBoxes[idx];
          const isCorrect = boxResults[idx];
          return (
            <button
              key={idx}
              disabled={isOpened}
              onClick={() => handlePickBox(idx)}
              className="w-full max-w-[110px] sm:max-w-[125px] aspect-square flex items-center justify-center p-0.5 focus:outline-none cursor-pointer hover:scale-105 transition-transform"
            >
              <ThemeBoxGraphic
                theme={config.theme}
                boxNumber={idx + 1}
                isOpened={isOpened}
                isCorrect={isCorrect}
              />
            </button>
          );
        })}
      </div>

      {/* Question Display Modal */}
      <QuestionDisplayModal
        isOpen={selectedBoxIndex !== null}
        questionNumber={currentQuestionNum}
        question={currentQuestion}
        mode={config.mode}
        teamName={config.teamMode ? teams[currentTurnTeamIdx]?.name : undefined}
        teamAvatar={config.teamMode ? teams[currentTurnTeamIdx]?.avatar : undefined}
        timerEnabled={config.timerEnabled}
        timeLimitSeconds={config.timeLimitSeconds}
        titlePrefix="🎁 MỞ HỘP SỐ"
        onAnswerSubmit={(isCorrect, correctAnswerText) => {
          handleConfirmTurnClose(isCorrect, correctAnswerText);
        }}
      />

      {/* Footer Instructions */}
      <div className="text-center text-[11px] font-bold tracking-wide text-w-text-muted bg-w-bg-card/90 py-1.5 px-4 rounded-full border border-w-border mx-auto z-10 shadow-xs shrink-0">
        Mỗi đội chọn 1 hộp ➔ Trả lời câu hỏi ➔ Đúng nhận +10đ & mở hộp!
      </div>
    </div>
  );
};

