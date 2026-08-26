import React, { useState } from 'react';
import { GameSetupConfig, Question, AnswerLog } from '../../types';
import { Check, X, Flag } from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface GameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: any[], logs: AnswerLog[]) => void;
}

export const RaceGame: React.FC<GameProps> = ({ config, questions, onGameEnd }) => {
  const [currentQuestionNum, setCurrentQuestionNum] = useState(1);
  const [activeTeamId, setActiveTeamId] = useState(config.teams[0].id);
  const [showQuestion, setShowQuestion] = useState(false);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);
  
  const [teamsState, setTeamsState] = useState(
    config.teams.map(t => ({ ...t, position: 0 }))
  );

  const activeTeamIndex = teamsState.findIndex(t => t.id === activeTeamId);
  const activeTeam = teamsState[activeTeamIndex];
  const question = questions[currentQuestionNum - 1];
  const finishLine = 5;

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

    let winner = false;

    const updatedTeams = teamsState.map(t => {
      if (t.id === activeTeamId) {
        if (isCorrect) {
          soundFx.correct();
          const newPos = t.position + 1;
          if (newPos >= finishLine) winner = true;
          return { ...t, position: newPos, score: t.score + (config.pointsPerCorrect || 10) };
        } else {
          soundFx.wrong();
          return { ...t, score: Math.max(0, t.score - (config.pointsPerWrong || 0)) };
        }
      }
      return t;
    });

    setTeamsState(updatedTeams);

    if (winner || currentQuestionNum >= (config.numberOfQuestions || 10)) {
       setTimeout(() => onGameEnd(updatedTeams, updatedLogs), 2500);
    } else {
       setTimeout(() => {
          handleNextTurn();
       }, 2000);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full relative p-4 sm:p-8 bg-[#F4F1E1] rounded-3xl overflow-hidden shadow-inner">
       <div className="flex justify-between items-center z-10 mb-6 bg-white/60 backdrop-blur px-6 py-3 rounded-2xl border border-[#E9E4D4]">
         <h2 className="text-2xl font-black text-[#5C5544]">Đua Đến Đích</h2>
         <div className="px-4 py-1.5 bg-[#5C5544] text-[#FDFBF7] rounded-full font-bold text-sm">Câu {Math.min(currentQuestionNum, config.numberOfQuestions || 10)} / {config.numberOfQuestions}</div>
       </div>

       <div className="flex-1 flex flex-col gap-4 z-10">
         {teamsState.map((team, idx) => (
           <div key={team.id} className={`w-full relative h-24 bg-white/50 rounded-2xl border-2 ${activeTeamId === team.id ? 'border-amber-400' : 'border-[#E9E4D4]'} overflow-hidden flex items-center px-4`}>
             <div className="w-16 shrink-0 flex flex-col items-center z-20">
               <span className="text-2xl drop-shadow-md">{team.emoji}</span>
               <span className="text-[10px] font-black text-slate-500 mt-1 truncate w-full text-center">{team.name}</span>
             </div>
             
             <div className="flex-1 h-8 ml-4 relative bg-[#E9E4D4] rounded-full overflow-hidden shadow-inner flex items-center">
               <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-r from-transparent to-red-500/20 z-10"></div>
               <div className="absolute top-0 bottom-0 left-0 border-r-2 border-dashed border-white/50 z-10 w-full" style={{ backgroundSize: '40px 40px', backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)' }}></div>
               
               <div 
                 className="absolute top-0 bottom-0 left-0 bg-blue-500/10 rounded-full transition-all duration-1000 ease-out flex items-center justify-end"
                 style={{ width: `${Math.max(5, (team.position / finishLine) * 100)}%` }}
               >
                 <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center z-30 translate-x-1/2">
                    {config.raceVehicleType ? (
                       <img 
                         src={`/assets/games/race/${config.raceVehicleType}${Math.min(idx + 1, 4)}.png`} 
                         alt={team.name} 
                         className="w-full h-full object-contain drop-shadow-xl"
                         onError={(e) => {
                           (e.target as HTMLImageElement).style.display = 'none';
                           (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                         }}
                       />
                    ) : null}
                    <div className={`w-8 h-8 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center shadow-lg ${config.raceVehicleType ? 'hidden' : ''}`}>
                       <span className="text-xs">{team.emoji || '🚀'}</span>
                    </div>
                 </div>
               </div>
             </div>
             
             <div className="w-10 shrink-0 flex items-center justify-center z-20">
                <Flag className={`w-6 h-6 ${team.position >= finishLine ? 'text-green-500' : 'text-w-primary-dark'}`} />
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
           <button onClick={() => setShowQuestion(true)} className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:scale-105 text-w-text-main font-black rounded-full shadow-xl transition-all border-4 border-white">Tiến Lên {activeTeam.name}</button>
         </div>
       )}
    </div>
  );
};
