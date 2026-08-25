import React, { useState, useEffect } from 'react';
import { GameSetupConfig, Question, AnswerLog, Team } from '../../types';
import { soundFx } from '../../utils/audio';
import { Sparkles, Dices, Award, RefreshCw, Check, X, Trophy, Wand2, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { QuestionDisplayModal } from '../QuestionDisplayModal';

interface MagicWheelGameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: Team[], logs: AnswerLog[]) => void;
}

// Letter sets
const ACCENTED_LETTERS = [
  'A', 'Ă', 'Â', 'B', 'C', 'D', 'Đ', 'E', 'Ê', 'G', 'H', 'I',
  'K', 'L', 'M', 'N', 'O', 'Ô', 'Ơ', 'P', 'Q', 'R', 'S', 'T',
  'U', 'Ư', 'V', 'X', 'Y'
];
const UNACCENTED_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'G', 'H', 'I', 'K', 'L', 'M', 'N',
  'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'X', 'Y'
];

function removeVietnameseAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/ă|â/g, 'a').replace(/Ă|Â/g, 'A')
    .replace(/ê/g, 'e').replace(/Ê/g, 'E')
    .replace(/ô|ơ/g, 'o').replace(/Ô|Ơ/g, 'O')
    .replace(/ư/g, 'u').replace(/Ư/g, 'U');
}

function getVietnameseBaseLetter(char: string, mode: 'accent' | 'no-accent'): string {
  if (!char || char === ' ') return ' ';
  const upper = char.toUpperCase();

  if (mode === 'no-accent') {
    return upper
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/Đ/g, 'D')
      .replace(/Ă|Â/g, 'A')
      .replace(/Ê/g, 'E')
      .replace(/Ô|Ơ/g, 'O')
      .replace(/Ư/g, 'U');
  }

  // Accent mode: Remove tone marks (\u0300 grave, \u0301 acute, \u0303 tilde, \u0309 hook, \u0323 dot below)
  // Keeps Ă, Â, Ê, Ô, Ơ, Ư, Đ
  return upper
    .normalize('NFD')
    .replace(/[\u0300\u0301\u0303\u0309\u0323]/g, '')
    .normalize('NFC');
}

function getUnrevealedCellsCount(phrase: string, revealed: Set<string>, mode: 'accent' | 'no-accent'): number {
  let count = 0;
  phrase.toUpperCase().split('').forEach((char) => {
    if (char !== ' ') {
      const charBase = getVietnameseBaseLetter(char, mode);
      const isAlreadyRevealed = Array.from(revealed).some(
        (r) => getVietnameseBaseLetter(r, mode) === charBase
      );
      if (!isAlreadyRevealed) {
        count++;
      }
    }
  });
  return count;
}

export function MagicWheelGame({ config, questions, onGameEnd }: MagicWheelGameProps) {
  // Derive settings strictly from Setup config
  const playMode = config.playMode || (config.mode === 'bank' ? 1 : 2);
  const letterMode = config.letterMode || 'accent'; // 'accent' or 'no-accent'
  const pointsPerLetter = config.pointsPerLetter || 100;
  const isRandomEnabled = config.randomEnabled !== false && playMode !== 3;

  // Custom phrases or Bank questions list
  const customPhrasesList = config.customPhrases && config.customPhrases.length > 0
    ? config.customPhrases
    : ['NĂNG LƯỢNG MẶT TRỜI', 'QUANG HỢP Ở THỰC VẬT', 'HỆ TUẦN HOÀN NGƯỜI'];

  // Teams state
  const [teamsState, setTeamsState] = useState<Team[]>(
    config.teams && config.teams.length > 0
      ? config.teams
      : [
          { id: '1', name: 'Đội Đỏ', avatar: '🦁', color: '#ef4444', score: 0 },
          { id: '2', name: 'Đội Xanh', avatar: '🦄', color: '#3b82f6', score: 0 },
        ]
  );
  const [activeTeamIndex, setActiveTeamIndex] = useState<number>(0);
  const [logs, setLogs] = useState<AnswerLog[]>([]);

  // Phrase / Question Indexing
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState<number>(0);
  const [activePhrase, setActivePhrase] = useState<string>('');
  
  // Game state
  const [revealedLetters, setRevealedLetters] = useState<Set<string>>(new Set());
  const [usedKeyboardKeys, setUsedKeyboardKeys] = useState<Set<string>>(new Set());

  // Random spin & Question modal state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [showQuestionModal, setShowQuestionModal] = useState<boolean>(false);
  
  // In PlayMode 3 (Sequential), teams can directly pick letters!
  // In PlayMode 1/2 (Random/Bank), teams must answer or click Random first
  const [canGuessLetter, setCanGuessLetter] = useState<boolean>(playMode === 3);
  const [lastRevealedPoints, setLastRevealedPoints] = useState<number | null>(null);
  const [lastMatchCount, setLastMatchCount] = useState<number>(0);
  
  const [isGuessingFullPhrase, setIsGuessingFullPhrase] = useState<boolean>(false);

  const activeTeam = teamsState[activeTeamIndex] || teamsState[0];

  // Helper to extract phrase answer from a question or list item
  const getPhraseFromCurrentIndex = (idx: number): string => {
    if (playMode === 1 && questions && questions.length > 0) {
      const q = questions[idx % questions.length];
      if (!q) return 'NĂNG LƯỢNG MẶT TRỜI';
      // If q.content contains phrase after colon or directly
      if (q.content.includes(':')) {
        const parts = q.content.split(':');
        return parts[parts.length - 1].trim().toUpperCase();
      }
      return q.content.trim().toUpperCase();
    }
    return (customPhrasesList[idx % customPhrasesList.length] || 'NĂNG LƯỢNG MẶT TRỜI').trim().toUpperCase();
  };

  // Initialize phrase on start and when phrase index changes
  useEffect(() => {
    const phrase = getPhraseFromCurrentIndex(currentPhraseIndex);
    setActivePhrase(phrase);
    setRevealedLetters(new Set());
    setUsedKeyboardKeys(new Set());
    setLastRevealedPoints(null);
    if (playMode === 3) {
      setCanGuessLetter(true);
    }
  }, [currentPhraseIndex, playMode]);

  // Handle clicking a letter on the keyboard
  const handleKeyboardClick = (letter: string) => {
    if (usedKeyboardKeys.has(letter)) return;

    const newUsed = new Set(usedKeyboardKeys);
    newUsed.add(letter);
    setUsedKeyboardKeys(newUsed);

    const letterBase = getVietnameseBaseLetter(letter, letterMode);
    const phraseChars = activePhrase.toUpperCase().split('');
    let matchCount = 0;
    const newRevealed = new Set(revealedLetters);

    for (let char of phraseChars) {
      if (char === ' ') continue;
      
      const charBase = getVietnameseBaseLetter(char, letterMode);
      if (charBase === letterBase) {
        newRevealed.add(char);
        matchCount++; // Each matching cell position increments matchCount!
      }
    }

    setRevealedLetters(newRevealed);
    
    // Consume guess permission in playMode 1 & 2 if set
    if (playMode !== 3) {
      setCanGuessLetter(false);
    }

    if (matchCount > 0) {
      soundFx.correct();
      const pointsWon = matchCount * pointsPerLetter;
      setLastMatchCount(matchCount);
      setLastRevealedPoints(pointsWon);
      setTeamsState((prev) =>
        prev.map((t, idx) => (idx === activeTeamIndex ? { ...t, score: t.score + pointsWon } : t))
      );
    } else {
      soundFx.wrong();
      setLastMatchCount(0);
      setLastRevealedPoints(0);
    }

    // Always pass turn to next team after every letter pick!
    setActiveTeamIndex((prev) => (prev + 1) % teamsState.length);
  };

  // Random spin button logic (Mode 1 & Mode 2)
  const handleRandomSpin = () => {
    if (playMode === 1 && questions && questions.length > 0) {
      setIsSpinning(true);
      soundFx.buttonClick();
      setTimeout(() => {
        const randIdx = Math.floor(Math.random() * questions.length);
        setCurrentQuestionIndex(randIdx);
        setIsSpinning(false);
        setShowQuestionModal(true);
      }, 800);
    } else if (playMode === 2) {
      setIsSpinning(true);
      soundFx.buttonClick();
      setTimeout(() => {
        const randIdx = Math.floor(Math.random() * customPhrasesList.length);
        setCurrentPhraseIndex(randIdx);
        setIsSpinning(false);
        setCanGuessLetter(true);
      }, 800);
    }
  };

  const handleQuestionAnswer = (isCorrect: boolean, correctAnswerText: string) => {
    setShowQuestionModal(false);
    
    setLogs((prev) => [
      ...prev,
      {
        questionNumber: logs.length + 1,
        questionText: questions[currentQuestionIndex]?.content || "Câu hỏi ngẫu nhiên",
        correctAnswer: correctAnswerText,
        teamName: activeTeam.name,
        isCorrect: isCorrect,
      },
    ]);

    if (isCorrect) {
      soundFx.correct();
      setCanGuessLetter(true);
    } else {
      soundFx.wrong();
      setActiveTeamIndex((prev) => (prev + 1) % teamsState.length);
    }
  };

  // Handle Guessing Full Phrase (Đoán cả câu)
  const handleConfirmFullPhraseGuess = (isCorrect: boolean) => {
    setIsGuessingFullPhrase(false);
    if (isCorrect) {
      soundFx.winFanfare();
      const unrevealedCellsCount = getUnrevealedCellsCount(activePhrase, revealedLetters, letterMode);
      const allLetters = new Set<string>();
      
      activePhrase.toUpperCase().split('').forEach(char => {
        if (char !== ' ') {
          allLetters.add(char);
        }
      });
      
      const remainingPoints = unrevealedCellsCount * pointsPerLetter;
      setRevealedLetters(allLetters);
      setLastMatchCount(unrevealedCellsCount);
      setLastRevealedPoints(remainingPoints);
      
      setTeamsState((prev) =>
        prev.map((t, idx) => (idx === activeTeamIndex ? { ...t, score: t.score + remainingPoints } : t))
      );
      
      setLogs((prev) => [
        ...prev,
        {
          questionNumber: logs.length + 1,
          questionText: `Đoán cả câu: ${activePhrase}`,
          correctAnswer: activePhrase,
          teamName: activeTeam.name,
          isCorrect: true,
        },
      ]);
    } else {
      soundFx.wrong();
      setLastMatchCount(0);
      setLastRevealedPoints(0);
      setActiveTeamIndex((prev) => (prev + 1) % teamsState.length);
    }
  };

  const isLetterInPhrase = (letter: string, phrase: string, mode: 'accent' | 'no-accent'): boolean => {
    const letterBase = getVietnameseBaseLetter(letter, mode);
    return phrase.toUpperCase().split('').some(c => c !== ' ' && getVietnameseBaseLetter(c, mode) === letterBase);
  };

  const currentKeyboard = letterMode === 'accent' ? ACCENTED_LETTERS : UNACCENTED_LETTERS;
  const words = activePhrase.split(' ').filter(w => w.length > 0);

  return (
    <div className="flex-1 min-h-0 w-full p-4 sm:p-6 bg-gradient-to-b from-indigo-50 via-purple-50 to-fuchsia-50 rounded-3xl shadow-2xl flex flex-col justify-between border-4 border-indigo-200">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/95 backdrop-blur p-4 rounded-2xl border-2 border-indigo-200 shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-3xl animate-spin-slow">🎡</span>
          <div>
            <h2 className="text-xl font-extrabold text-indigo-950 flex items-center gap-2">
              <span>Chiếc Nón Kỳ Diệu</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 font-bold border border-indigo-300">
                {playMode === 1 ? 'Chế Độ 1: Ngân Hàng' : playMode === 2 ? 'Chế Độ 2: Giáo Viên Nhập' : 'Chế Độ 3: Câu Đố Tuần Tự'}
              </span>
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Chế độ chữ: <b className="text-indigo-700">{letterMode === 'accent' ? 'Có Dấu' : 'Không Dấu'}</b> | Điểm/chữ: <b className="text-amber-600">+{pointsPerLetter}đ</b>
            </p>
          </div>
        </div>
        
        {/* Teams Score Board */}
        <div className="flex items-center gap-3">
          {teamsState.map((team, idx) => (
            <div
              key={team.id}
              className={`px-3 py-1.5 rounded-xl border-2 transition-all flex items-center gap-2 font-bold text-xs ${
                activeTeamIndex === idx
                  ? 'border-indigo-500 bg-indigo-100 text-indigo-950 shadow-md scale-105 ring-2 ring-indigo-400/30'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              <span className="text-base">{team.avatar}</span>
              <div>
                <div className="text-[11px] font-black">{team.name}</div>
                <div className="text-indigo-800 font-mono">{team.score}đ</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Puzzle Playing Area */}
      <div className="my-6 space-y-6 flex-1 flex flex-col items-center">
        {/* Active Team Turn Status */}
        <div className="w-full bg-white/95 border-2 border-indigo-300 p-4 rounded-2xl shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{activeTeam.avatar}</span>
            <span className="text-sm font-black text-indigo-950">
              LƯỢT CỦA: <span className="text-indigo-700">{activeTeam.name}</span>
            </span>
          </div>
          <div className="text-xs font-extrabold text-slate-600">
            {lastRevealedPoints !== null && (
              <span className={lastRevealedPoints > 0 ? "text-emerald-600 font-black animate-pulse" : "text-rose-600 font-bold"}>
                {lastRevealedPoints > 0
                  ? `✨ Mở ${lastMatchCount} ô chữ! (+${lastRevealedPoints} điểm)`
                  : '❌ Không có chữ này! Mất lượt.'}
              </span>
            )}
            {playMode !== 3 && canGuessLetter && (
               <span className="text-amber-600 animate-pulse ml-4 font-black">
                 ✓ ĐÃ GIÀNH QUYỀN! HÃY CHỌN 1 CHỮ CÁI BẤM LẬT!
               </span>
            )}
            {playMode === 3 && (
               <span className="text-emerald-600 font-bold ml-4">
                 ✓ ĐƯỢC CHỌN CHỮ CÁI TRỰC TIẾP TỰ DO!
               </span>
            )}
          </div>
        </div>

        {/* Puzzle Tiles - Word separated cleanly */}
        <div className="p-6 sm:p-10 bg-slate-900 border-4 border-slate-700 rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col items-center justify-center min-h-[300px]">
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-6">
            {words.map((word, wIdx) => (
              <div key={wIdx} className="flex gap-1.5 sm:gap-2">
                {word.split('').map((char, cIdx) => {
                  const charBase = getVietnameseBaseLetter(char, letterMode);
                  let isRevealed = Array.from(revealedLetters).some(
                    (r) => getVietnameseBaseLetter(r, letterMode) === charBase
                  );

                  return (
                    <div
                      key={cIdx}
                      className={`w-10 h-14 sm:w-12 sm:h-16 flex items-center justify-center border-4 rounded-xl text-2xl sm:text-3xl font-black shadow-lg transition-all duration-500 transform ${
                        isRevealed
                          ? 'bg-gradient-to-br from-amber-100 to-amber-300 border-amber-400 text-slate-900 scale-100 shadow-amber-200/50 animate-pop'
                          : 'bg-gradient-to-br from-indigo-600 to-blue-700 border-blue-400 text-transparent scale-95 shadow-indigo-900/50'
                      }`}
                    >
                      {isRevealed ? char : '?'}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Onscreen Keyboard */}
        <div className="w-full max-w-4xl bg-white/95 p-5 rounded-3xl border-2 border-indigo-200 shadow-xl">
          <div className="flex flex-wrap justify-center gap-2">
            {currentKeyboard.map(letter => {
              const isUsed = usedKeyboardKeys.has(letter);
              const isCorrect = isUsed && isLetterInPhrase(letter, activePhrase, letterMode);

              let keyStyle = 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300 text-indigo-900 active:border-b-0 active:translate-y-1 hover:-translate-y-1';
              if (isUsed) {
                if (isCorrect) {
                  keyStyle = 'bg-emerald-500 border-emerald-600 text-white font-black shadow-emerald-200/50 shadow-md scale-105 ring-2 ring-emerald-400';
                } else {
                  keyStyle = 'bg-rose-500 border-rose-600 text-white font-black opacity-80 cursor-not-allowed scale-95 shadow-inner';
                }
              }

              return (
                <button
                  key={letter}
                  onClick={() => handleKeyboardClick(letter)}
                  disabled={isUsed}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl font-black text-sm sm:text-base border-b-4 transition-all ${keyStyle}`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Control Toolbar */}
      <div className="bg-white/90 backdrop-blur p-4 rounded-2xl border border-indigo-200 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* RANDOM button for Mode 1 & Mode 2 */}
          {isRandomEnabled && (
            <button
              onClick={handleRandomSpin}
              disabled={isSpinning}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <Dices className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>
                {playMode === 1 ? 'RANDOM CÂU HỎI MỚI' : 'RANDOM CỤM TỪ MỚI'}
              </span>
            </button>
          )}

          {/* Sequential Mode Navigation Controls (Mode 3) */}
          {playMode === 3 && (
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-300">
              <button
                onClick={() => setCurrentPhraseIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentPhraseIndex === 0}
                className="px-3 py-1.5 bg-white text-slate-700 font-bold text-xs rounded-lg shadow hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Câu Trước</span>
              </button>
              <span className="text-xs font-black px-2 text-indigo-900">
                Câu {currentPhraseIndex + 1} / {customPhrasesList.length}
              </span>
              <button
                onClick={() => setCurrentPhraseIndex((prev) => (prev + 1) % customPhrasesList.length)}
                className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-lg shadow hover:bg-indigo-700 flex items-center gap-1"
              >
                <span>Câu Tiếp</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsGuessingFullPhrase(true)}
            className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>ĐOÁN CẢ CÂU</span>
          </button>
          
          <button
            onClick={() => onGameEnd(teamsState, logs)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            <span>KẾT THÚC GAME</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Guessing Full Phrase */}
      {isGuessingFullPhrase && (() => {
        const currentUnrevealed = getUnrevealedCellsCount(activePhrase, revealedLetters, letterMode);
        const calcPoints = currentUnrevealed * pointsPerLetter;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border-4 border-rose-200 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-center p-6 space-y-5">
              <HelpCircle className="w-16 h-16 text-rose-500 mx-auto animate-bounce" />
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase">
                  XÁC NHẬN ĐÁP ÁN: {activeTeam.name}?
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Giáo viên lắng nghe đáp án của <b>{activeTeam.name}</b> và bấm xác nhận:
                </p>
              </div>
              
              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 space-y-2">
                 <div className="text-xs font-bold text-slate-500">CỤM TỪ ĐÁP ÁN CHÍNH XÁC:</div>
                 <div className="text-lg font-black text-indigo-900 uppercase tracking-widest">
                    {activePhrase}
                 </div>
                 <div className="text-xs font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 py-1.5 px-3 rounded-lg inline-block">
                    Còn {currentUnrevealed} ô chưa mở ➔ Thưởng +{calcPoints} điểm ({currentUnrevealed} ô × {pointsPerLetter}đ)
                 </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleConfirmFullPhraseGuess(true)}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl transition flex flex-col items-center justify-center gap-0.5 shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center gap-1.5">
                    <Check className="w-5 h-5" />
                    <span>CHÍNH XÁC</span>
                  </div>
                  <span className="text-[11px] opacity-90 font-bold">+{calcPoints} điểm</span>
                </button>
                <button
                  onClick={() => handleConfirmFullPhraseGuess(false)}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm rounded-xl transition flex flex-col items-center justify-center gap-0.5 shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center gap-1.5">
                    <X className="w-5 h-5" />
                    <span>SAI RỒI</span>
                  </div>
                  <span className="text-[11px] opacity-90 font-bold">Mất lượt chơi</span>
                </button>
              </div>
              
              <button
                 onClick={() => setIsGuessingFullPhrase(false)}
                 className="w-full py-2 text-slate-500 font-bold text-xs hover:text-slate-700 transition"
              >
                 Hủy Bỏ
              </button>
            </div>
          </div>
        );
      })()}
      
      {/* Question Modal for Mode 1 */}
      {showQuestionModal && (
        <QuestionDisplayModal
          isOpen={showQuestionModal}
          questionNumber={currentQuestionIndex + 1}
          question={questions[currentQuestionIndex] || null}
          mode={config.mode}
          teamName={activeTeam.name}
          teamAvatar={activeTeam.avatar}
          timerEnabled={config.timerEnabled}
          timeLimitSeconds={config.timeLimitSeconds}
          titlePrefix="CHIẾC NÓN KỲ DIỆU -"
          onAnswerSubmit={(isCorrect, correctAnswerText) => {
             handleQuestionAnswer(isCorrect, correctAnswerText);
          }}
        />
      )}
    </div>
  );
}
