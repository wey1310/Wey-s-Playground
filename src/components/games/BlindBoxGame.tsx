import React, { useState, useEffect } from 'react';
import { GameSetupConfig, Question, AnswerLog } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Package, X, Star, Gift, Crown, Trophy, RefreshCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundFx } from '../../utils/audio';

interface GameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: any[], logs: AnswerLog[]) => void;
}

const THEMES = ['conan', 'anime', 'vbiz', 'disney', 'animals', 'country', 'food', 'dinosaurs', 'pokemon'];

export const BlindBoxGame: React.FC<GameProps> = ({ config, questions, onGameEnd }) => {
  const [teams, setTeams] = useState(config.teams.map(t => ({ ...t, score: 0 })));
  const [currentTurnTeamId, setCurrentTurnTeamId] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>('conan');
  
  const [boxes, setBoxes] = useState<{ id: number, opened: boolean, points: number, itemIndex: number, ownerId?: string }[]>([]);
  
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [targetBoxId, setTargetBoxId] = useState<number | null>(null);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);

  // Init boxes
  useEffect(() => {
    const newBoxes = Array.from({ length: 20 }).map((_, i) => {
      const pointsOptions = [10, 20, 30, 50, -10];
      return {
        id: i,
        opened: false,
        points: pointsOptions[Math.floor(Math.random() * pointsOptions.length)],
        itemIndex: Math.floor(Math.random() * 20) + 1
      };
    });
    setBoxes(newBoxes);
  }, [selectedTheme]);

  const handleBoxClick = (boxId: number) => {
    if (boxes[boxId].opened) return;
    if (!currentTurnTeamId) {
      alert('Vui lòng chọn đội chơi trước!');
      return;
    }
    
    // Pick random question
    const q = questions[Math.floor(Math.random() * questions.length)];
    setActiveQuestion(q);
    setTargetBoxId(boxId);
    setShowQuestionModal(true);
  };

  const handleAnswerSubmit = (isCorrect: boolean, selectedAnswer: string) => {
    setShowQuestionModal(false);
    
    setAnswerLogs(prev => [...prev, {
      questionNumber: prev.length + 1,
      questionText: activeQuestion?.content || '',
      correctAnswer: String(activeQuestion?.correct ?? selectedAnswer),
      teamName: teams.find(t => t.id === currentTurnTeamId)?.name || 'Đội',
      isCorrect,
    }]);

    if (isCorrect) {
      soundFx.play('correct');
      // Open the box
      setTimeout(() => {
        if (targetBoxId === null) return;
        const box = boxes[targetBoxId];
        
        setBoxes(prev => prev.map(b => b.id === targetBoxId ? { ...b, opened: true, ownerId: currentTurnTeamId } : b));
        setTeams(prev => prev.map(t => t.id === currentTurnTeamId ? { ...t, score: t.score + box.points } : t));
        
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 500);
    } else {
      soundFx.play('wrong');
      // Pass turn
      setCurrentTurnTeamId(null);
    }
  };

  return (
    <div className="w-full h-[80vh] min-h-[600px] flex flex-col bg-[#0f172a] rounded-2xl overflow-hidden shadow-2xl relative"
         style={{
            backgroundImage: `url('/assets/games/blindbox/themes/${selectedTheme}/background-${selectedTheme}.webp')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundBlendMode: 'overlay',
            backgroundRepeat: 'no-repeat'
         }}
    >
      {/* Header */}
      <div className="bg-black/60 backdrop-blur-sm p-4 flex flex-wrap items-center justify-between border-b border-white/10 z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-[900] text-white flex items-center gap-2">
            <Gift className="text-pink-500" />
            BLIND BOX
          </h2>
          <select 
            value={selectedTheme} 
            onChange={e => setSelectedTheme(e.target.value)}
            className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-1.5 font-bold outline-none"
          >
            {THEMES.map(t => (
              <option key={t} value={t} className="text-black">{t.toUpperCase()}</option>
            ))}
          </select>
        </div>
        
        <button 
          onClick={() => onGameEnd(teams, answerLogs)}
          className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors"
        >
          Kết Thúc
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row p-4 gap-6 z-10 overflow-y-auto">
        {/* Left Column: Teams */}
        <div className="w-full lg:w-1/4 space-y-3">
          <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-4">Chọn đội để bắt đầu lượt</h3>
          {teams.map(team => (
            <div 
              key={team.id}
              onClick={() => setCurrentTurnTeamId(team.id)}
              className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${
                currentTurnTeamId === team.id 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 border-white shadow-[0_0_15px_rgba(236,72,153,0.5)] transform scale-105' 
                  : 'bg-white/10 border-white/10 hover:bg-white/20'
              }`}
            >
              <div className="flex items-center justify-between text-white mb-2">
                <span className="font-[900] truncate">{team.name}</span>
                {currentTurnTeamId === team.id && <Crown className="w-5 h-5 text-yellow-300" />}
              </div>
              <div className="text-2xl font-[900] text-yellow-300">{team.score} <span className="text-sm font-normal text-white/70">điểm</span></div>
            </div>
          ))}
        </div>

        {/* Right Column: Boxes */}
        <div className="w-full lg:w-3/4 grid grid-cols-4 sm:grid-cols-5 gap-3 sm:gap-4 content-start">
          {boxes.map((box) => (
            <motion.div
              key={box.id}
              whileHover={!box.opened ? { scale: 1.05, y: -5 } : {}}
              whileTap={!box.opened ? { scale: 0.95 } : {}}
              onClick={() => handleBoxClick(box.id)}
              className={`relative aspect-square rounded-2xl cursor-pointer transition-all overflow-hidden shadow-lg border-2 ${
                box.opened 
                  ? 'bg-white border-white/50' 
                  : 'bg-gradient-to-br from-indigo-500 to-purple-700 border-white/20 hover:border-pink-400'
              }`}
            >
              {box.opened ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                  {/* Fallback image wrapper */}
                  <div className="w-full h-full flex items-center justify-center relative bg-slate-100 rounded-xl overflow-hidden mb-1">
                    <img 
                      src={`/assets/games/blindbox/themes/${selectedTheme}/openedbox-${box.itemIndex}-${selectedTheme}.webp`}
                      alt="Item"
                      className="w-full h-full object-contain absolute inset-0 z-10"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('fallback-bg');
                      }}
                    />
                    <div className="absolute inset-0 z-0 flex flex-col items-center justify-center text-slate-400">
                       <Gift className="w-8 h-8 opacity-50 mb-1" />
                       <span className="text-[10px] font-bold">Mẫu {box.itemIndex}</span>
                    </div>
                  </div>
                  <div className={`text-sm font-[900] ${box.points > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {box.points > 0 ? '+' : ''}{box.points}
                  </div>
                  {/* Show which team opened it */}
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full border border-white" style={{backgroundColor: teams.find(t => t.id === box.ownerId)?.color || '#ccc'}} />
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <img 
                    src={`/assets/games/blindbox/themes/${selectedTheme}/closedbox-${selectedTheme}.webp`}
                    alt="Blind Box"
                    className="w-3/4 h-3/4 object-contain relative z-10"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <Package className="w-1/2 h-1/2 text-white/30 absolute z-0" />
                  <div className="absolute bottom-2 text-white/50 font-[900] text-sm">#{box.id + 1}</div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Question Modal */}
      <AnimatePresence>
        {showQuestionModal && activeQuestion && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border-4 border-pink-500 flex flex-col max-h-[90vh]"
            >
              <div className="bg-pink-500 text-white p-4 sm:p-6 text-center relative flex-shrink-0">
                <button 
                  onClick={() => setShowQuestionModal(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="text-pink-100 font-bold uppercase tracking-widest text-sm mb-1">Câu Hỏi Khám Phá</div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-[900] leading-tight">
                  {activeQuestion.content}
                </h3>
              </div>

              <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['A', 'B', 'C', 'D'].map((label, index) => {
                    const optionText = activeQuestion.options?.[index];
                    if (!optionText) return null;
                    
                    // Simple correct check logic
                    let isCorrect = false;
                    if (typeof activeQuestion.correct === 'number') {
                      isCorrect = activeQuestion.correct === index;
                    } else if (typeof activeQuestion.correct === 'string') {
                      isCorrect = activeQuestion.correct === label;
                    }
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswerSubmit(isCorrect, label)}
                        className="bg-white border-2 border-slate-200 p-6 rounded-2xl text-left hover:border-pink-500 hover:bg-pink-50 transition-all group shadow-sm hover:shadow-md flex items-center gap-4"
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-pink-500 group-hover:text-white text-slate-500 flex items-center justify-center font-[900] text-xl transition-colors flex-shrink-0">
                          {label}
                        </div>
                        <span className="text-lg font-[700] text-slate-700">{optionText}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
