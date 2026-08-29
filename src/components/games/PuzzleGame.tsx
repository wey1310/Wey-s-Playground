import React, { useState } from 'react';
import { GameSetupConfig, Question, AnswerLog } from '../../types';
import { Check, X } from 'lucide-react';
import { soundFx } from '../../utils/audio';
import { MathChemRenderer } from '../../utils/mathChemFormatter';

interface GameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: any[], logs: AnswerLog[]) => void;
}

export const PuzzleGame: React.FC<GameProps> = ({ config, questions, onGameEnd }) => {
  const [currentQuestionNum, setCurrentQuestionNum] = useState(1);
  const [activeTeamId, setActiveTeamId] = useState(config.teams[0].id);
  const [showQuestion, setShowQuestion] = useState(false);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);
  
  // Each team gets a puzzle grid state (array of boolean indicating which piece is revealed)
  const [teamsState, setTeamsState] = useState(
    config.teams.map(t => ({ ...t, pieces: Array(16).fill(false) }))
  );

  const activeTeamIndex = teamsState.findIndex(t => t.id === activeTeamId);
  const activeTeam = teamsState[activeTeamIndex];
  const question = questions[currentQuestionNum - 1];

  const handleNextTurn = () => {
    const nextIdx = (activeTeamIndex + 1) % teamsState.length;
    setActiveTeamId(teamsState[nextIdx].id);
    setCurrentQuestionNum(prev => prev + 1);
    setShowQuestion(false);
  };

  const handleAnswer = (isCorrect: boolean) => {
    const newLog: AnswerLog = {
      questionNumber: currentQuestionNum,
      questionText: question?.content,
      correctAnswer: question?.correct?.toString() || '',
      teamName: activeTeam.name,
      isCorrect,
    };
    const updatedLogs = [...answerLogs, newLog];
    setAnswerLogs(updatedLogs);

    let puzzleComplete = false;

    const updatedTeams = teamsState.map(t => {
      if (t.id === activeTeamId) {
        if (isCorrect) {
          soundFx.correct();
          // Find first hidden piece and reveal it
          const nextPieces = [...t.pieces];
          const hiddenIdx = nextPieces.findIndex(p => !p);
          if (hiddenIdx !== -1) {
            nextPieces[hiddenIdx] = true;
          }
          if (nextPieces.every(p => p === true)) puzzleComplete = true;
          return { ...t, pieces: nextPieces, score: t.score + (puzzleComplete ? config.pointsPerCorrect * 2 : config.pointsPerCorrect || 10) };
        } else {
          soundFx.wrong();
          return { ...t, score: Math.max(0, t.score - (config.pointsPerWrong || 0)) };
        }
      }
      return t;
    });

    setTeamsState(updatedTeams);

    if (puzzleComplete || currentQuestionNum >= (config.numberOfQuestions || 10)) {
       setTimeout(() => onGameEnd(updatedTeams, updatedLogs), 2500);
    } else {
       setTimeout(() => {
          handleNextTurn();
       }, 2000);
    }
  };

  // Mock themes for puzzle
  const getPuzzleBg = (teamIndex: number) => {
    const colors = ['bg-indigo-300', 'bg-emerald-300', 'bg-rose-300', 'bg-amber-300'];
    return colors[teamIndex % colors.length];
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full relative p-4 sm:p-8 bg-[#F4F1E1] rounded-3xl overflow-hidden shadow-inner">
       <div className="flex justify-between items-center z-10 mb-6 bg-white/60 backdrop-blur px-6 py-3 rounded-2xl border border-[#E9E4D4]">
         <h2 className="text-2xl font-black text-[#5C5544]">Mảnh Ghép Bí Ẩn</h2>
         <div className="px-4 py-1.5 bg-[#5C5544] text-[#FDFBF7] rounded-full font-bold text-sm">Câu {Math.min(currentQuestionNum, config.numberOfQuestions || 10)} / {config.numberOfQuestions}</div>
       </div>

       <div className="flex-1 flex gap-6 z-10 overflow-x-auto pb-8">
         {teamsState.map((team, tIdx) => {
           const solvedCount = team.pieces.filter(p => p).length;
           return (
           <div key={team.id} className={`flex-1 min-w-[300px] flex flex-col items-center p-4 rounded-3xl transition-all border-4 ${activeTeamId === team.id ? 'border-amber-400 bg-white shadow-xl' : 'border-transparent bg-white/50'}`}>
             <div className="flex items-center gap-3 w-full mb-4 bg-[#F9F7F1] p-3 rounded-2xl border border-[#E9E4D4]">
               <span className="text-2xl">{team.emoji}</span>
               <div className="flex-1">
                 <span className="font-black text-[#5C5544] block truncate">{team.name}</span>
                 <span className="text-xs text-slate-500 font-bold">{team.score} điểm</span>
               </div>
               <div className="text-right">
                 <div className="text-[10px] font-bold text-w-text-muted">Tiến độ</div>
                 <div className="font-black text-indigo-500">{solvedCount}/16</div>
               </div>
             </div>

             <div className="w-full aspect-square relative rounded-xl overflow-hidden shadow-inner bg-slate-100 border border-slate-200">
               {/* Secret Image Mock (colored placeholder) */}
               <div className={`absolute inset-0 ${getPuzzleBg(tIdx)} flex items-center justify-center`}>
                  <span className="text-w-text-main font-black text-2xl opacity-50 text-center px-4">Bức Ảnh<br/>Bí Ẩn</span>
               </div>
               
               {/* Grid Overlay */}
               <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-0.5 p-0.5">
                 {team.pieces.map((isRevealed, idx) => (
                   <div key={idx} className={`w-full flex-1 min-h-0 w-full bg-[#E9E4D4] border border-white/20 transition-all duration-700 ${isRevealed ? 'opacity-0 scale-95' : 'opacity-100'} flex items-center justify-center`}>
                     {!isRevealed && <span className="text-xs font-bold text-[#A39E8D]">{idx + 1}</span>}
                   </div>
                 ))}
               </div>
             </div>
           </div>
         )})}
       </div>

       {/* Question Area */}
       {showQuestion ? (
         <div className="absolute inset-0 bg-white/70 backdrop-blur-sm backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-[#FDFBF7] p-8 rounded-3xl max-w-xl w-full shadow-2xl transform scale-100 animate-in zoom-in-95 duration-200 border-2 border-[#E9E4D4]">
             <h3 className="text-xl font-bold text-slate-800 mb-6 text-center leading-relaxed">
               {question?.content ? <MathChemRenderer text={question.content} /> : 'Câu hỏi thủ công (đọc cho học sinh)'}
             </h3>
             <div className="flex flex-col gap-4">
                <button onClick={() => handleAnswer(true)} className="py-4 bg-emerald-100 hover:bg-emerald-200 border-2 border-emerald-300 text-emerald-800 rounded-2xl font-black text-lg shadow-sm flex items-center justify-center gap-2"><Check className="w-6 h-6"/> Trả Lời Đúng</button>
                <button onClick={() => handleAnswer(false)} className="py-4 bg-rose-100 hover:bg-rose-200 border-2 border-rose-300 text-rose-800 rounded-2xl font-black text-lg shadow-sm flex items-center justify-center gap-2"><X className="w-6 h-6"/> Trả Lời Sai</button>
             </div>
           </div>
         </div>
       ) : (
         <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
           <button onClick={() => setShowQuestion(true)} className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:scale-105 text-w-text-main font-black rounded-full shadow-xl transition-all border-4 border-white">Lật mảnh ghép cho {activeTeam.name}</button>
         </div>
       )}
    </div>
  );
};
