import React, { useState } from 'react';
import { GameSetupConfig, Question, AnswerLog } from '../../types';
import { Check, X, ShieldAlert, Award } from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface GameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: any[], logs: AnswerLog[]) => void;
}

export const TowerGame: React.FC<GameProps> = ({ config, questions, onGameEnd }) => {
  const [currentQuestionNum, setCurrentQuestionNum] = useState(1);
  const [activeTeamId, setActiveTeamId] = useState(config.teams[0].id);
  const [teamsState, setTeamsState] = useState(
    config.teams.map(t => ({ ...t, floors: 0, strikes: 0 }))
  );
  const [showQuestion, setShowQuestion] = useState(false);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);
  const [shakingTeamId, setShakingTeamId] = useState<string | null>(null);

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

    const updatedTeams = teamsState.map(t => {
      if (t.id === activeTeamId) {
        if (isCorrect) {
          soundFx.correct();
          return { ...t, floors: t.floors + 1, score: t.score + (config.pointsPerCorrect || 10) };
        } else {
          soundFx.wrong();
          const newStrikes = t.strikes + 1;
          setShakingTeamId(t.id);
          setTimeout(() => setShakingTeamId(null), 1000);
          if (newStrikes >= 3) {
             soundFx.diceRoll();
             return { ...t, floors: 0, strikes: 0, score: Math.max(0, t.score - (config.pointsPerWrong || 0)) };
          }
          return { ...t, strikes: newStrikes, score: Math.max(0, t.score - (config.pointsPerWrong || 0)) };
        }
      }
      return t;
    });

    setTeamsState(updatedTeams);

    if (currentQuestionNum >= (config.numberOfQuestions || 10)) {
       setTimeout(() => onGameEnd(updatedTeams, updatedLogs), 1500);
    } else {
       setTimeout(() => {
          handleNextTurn();
       }, 2000);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full relative p-4 sm:p-8 bg-[#F4F1E1] rounded-3xl overflow-hidden shadow-inner">
       {/* Background Decoration */}
       <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23a39e8d\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
       
       <div className="flex justify-between items-center z-10 mb-6 bg-white/60 backdrop-blur px-6 py-3 rounded-2xl border border-[#E9E4D4]">
         <h2 className="text-2xl font-black text-[#5C5544]">Xây Tháp Tri Thức</h2>
         <div className="px-4 py-1.5 bg-[#5C5544] text-[#FDFBF7] rounded-full font-bold text-sm">Câu {Math.min(currentQuestionNum, config.numberOfQuestions || 10)} / {config.numberOfQuestions}</div>
       </div>

       <div className="flex-1 flex gap-4 z-10">
         {teamsState.map(team => (
           <div key={team.id} className={`flex-1 flex flex-col justify-end items-center border-b-8 rounded-b-xl pb-2 transition-all relative ${activeTeamId === team.id ? 'border-amber-400 bg-white/40' : 'border-[#D4CDAF] bg-white/10'}`}>
             {team.strikes > 0 && (
               <div className="absolute top-4 right-4 flex gap-1">
                 {Array.from({length: team.strikes}).map((_, i) => <ShieldAlert key={i} className="w-5 h-5 text-red-500 animate-pulse" />)}
               </div>
             )}
             <div className="absolute top-4 left-4 text-xs font-bold text-[#837B63] bg-white px-2 py-1 rounded-lg shadow-sm">Điểm: {team.score}</div>
             
             {/* The Tower */}
             <div className={`flex flex-col-reverse items-center justify-start w-full px-4 mb-4 ${shakingTeamId === team.id ? 'animate-bounce' : ''}`}>
               {Array.from({length: team.floors}).map((_, i) => (
                 <div key={i} className="w-full max-w-[120px] h-14 bg-gradient-to-b from-white to-slate-200 border-2 border-slate-400 rounded-sm shadow-sm flex items-center justify-center relative -mt-0.5 animate-in slide-in-from-top-10" style={{ zIndex: team.floors - i }}>
                   {/* Windows */}
                   <div className="w-8 h-8 bg-blue-100 border-2 border-blue-300 rounded flex flex-wrap p-0.5 gap-0.5">
                     <div className="w-[12px] h-[12px] bg-yellow-200 rounded-sm"></div>
                     <div className="w-[12px] h-[12px] bg-yellow-200 rounded-sm"></div>
                     <div className="w-[12px] h-[12px] bg-yellow-200 rounded-sm"></div>
                     <div className="w-[12px] h-[12px] bg-yellow-200 rounded-sm"></div>
                   </div>
                 </div>
               ))}
               {team.floors > 0 && (
                 <div className="w-full max-w-[140px] h-8 bg-red-500 border-2 border-red-700 rounded-t-xl relative mb-[-2px]" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)', zIndex: 999 }}>
                   <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-yellow-300 rounded-full"></div>
                 </div>
               )}
             </div>
             
             {/* Base / Team info */}
             <div className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl shadow-md border-b-4 border-slate-200 min-w-[120px]">
               <span className="text-3xl">{team.emoji}</span>
               <span className="font-bold text-sm text-slate-700 truncate max-w-[100px]">{team.name}</span>
             </div>
           </div>
         ))}
       </div>

       {/* Question Area */}
       {showQuestion ? (
         <div className="absolute inset-0 bg-white/70 backdrop-blur-sm backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-[#FDFBF7] p-8 rounded-3xl max-w-xl w-full shadow-2xl transform scale-100 animate-in zoom-in-95 duration-200 border-2 border-[#E9E4D4]">
             <h3 className="text-xl font-bold text-slate-800 mb-6 text-center leading-relaxed">{question?.content || 'Câu hỏi thủ công (đọc cho học sinh)'}</h3>
             <div className="flex flex-col gap-4">
                <button onClick={() => handleAnswer(true)} className="py-4 bg-emerald-100 hover:bg-emerald-200 border-2 border-emerald-300 text-emerald-800 rounded-2xl font-black text-lg shadow-sm flex items-center justify-center gap-2"><Check className="w-6 h-6"/> Trả Lời Đúng</button>
                <button onClick={() => handleAnswer(false)} className="py-4 bg-rose-100 hover:bg-rose-200 border-2 border-rose-300 text-rose-800 rounded-2xl font-black text-lg shadow-sm flex items-center justify-center gap-2"><X className="w-6 h-6"/> Trả Lời Sai</button>
             </div>
           </div>
         </div>
       ) : (
         <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
           <button onClick={() => setShowQuestion(true)} className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:scale-105 text-w-text-main font-black rounded-full shadow-xl transition-all border-4 border-white">Lượt của {activeTeam.name}</button>
         </div>
       )}
    </div>
  );
};
