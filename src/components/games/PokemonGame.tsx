import { safeAlert, safeConfirm } from "../../utils/safeAlert";
import React, { useState, useEffect } from 'react';
import { GameSetupConfig, Question, AnswerLog } from '../../types';
import { ShieldAlert, Sparkles, Sword, Trophy } from 'lucide-react';
import { soundFx } from '../../utils/audio';
import { QuestionDisplayModal } from '../QuestionDisplayModal';

interface GameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: any[], logs: AnswerLog[]) => void;
}

const POKEMON_GIFS = [
  'Abra.gif', 'Archéduc.gif', 'Baggaïd.gif', 'Baggiguane.gif', 'Braségali.gif',
  'Capidextre.gif', 'Carapuce.gif', 'Charizard.gif', 'Charmillon.gif', 'Chartor.gif',
  'Croâporal.gif', 'Deoxys.gif', 'Ectoplasma.gif', 'Fantominus.gif', 'Feunard d\'Alola.gif',
  'Flotoutan.gif', 'Givrali.gif', 'Goinfrex.gif', 'Goupelin.gif', 'Grotichon.gif',
  'Haydaim Printemps.gif', 'Insécateur.gif', 'Kaiminus.gif', 'Keldeo.gif', 'Kommo.gif',
  'Leuphorie.gif', 'Luminéon.gif', 'M. Mime.gif', 'Mangriff.gif', 'Manternel.gif',
  'Massko.gif', 'Meloetta.gif', 'Miascarade.gif', 'Minidraco.gif', 'Minotaupe.gif',
  'Minun.gif', 'Momartik.gif', 'Moustillon.gif', 'Nodulithe.gif', 'Ohmassacre.gif',
  'Ptitard.gif', 'Pyroli.gif', 'Ramoloss.gif', 'Rayquaza.gif', 'Rosélia.gif',
  'Skitty.gif', 'Sulfura de Galar.gif', 'Séviper.gif', 'Tepig.gif', 'Tiplouf.gif',
  'Togetic.gif', 'Tortank.gif', 'Tutankafer.gif', 'Vipélierre.gif', 'Écrapince.gif'
];

// Grid coordinates (x%, y%) on map.png for 20 positions
const MAP_POSITIONS = [
  { id: 1, x: 14, y: 18 },
  { id: 2, x: 34, y: 18 },
  { id: 3, x: 54, y: 18 },
  { id: 4, x: 74, y: 18 },
  { id: 5, x: 88, y: 22 },
  { id: 6, x: 14, y: 38 },
  { id: 7, x: 34, y: 38 },
  { id: 8, x: 54, y: 38 },
  { id: 9, x: 74, y: 38 },
  { id: 10, x: 88, y: 42 },
  { id: 11, x: 14, y: 58 },
  { id: 12, x: 34, y: 58 },
  { id: 13, x: 54, y: 58 },
  { id: 14, x: 74, y: 58 },
  { id: 15, x: 88, y: 62 },
  { id: 16, x: 18, y: 78 },
  { id: 17, x: 38, y: 78 },
  { id: 18, x: 58, y: 78 },
  { id: 19, x: 78, y: 78 },
  { id: 20, x: 90, y: 80 },
];

interface SpotState {
  id: number;
  x: number;
  y: number;
  pokemon: string;
  multiplier: 3 | 5;
  capturedByTeamId: string | null;
  activeInTeamId: string | null;
  isFailed: boolean;
}

interface TeamEncounter {
  spotId: number;
  pokemon: string;
  multiplier: 3 | 5;
  hp: number;
  maxHp: number;
  strikes: number;
}

export const PokemonGame: React.FC<GameProps> = ({ config, questions, onGameEnd }) => {
  const [currentQuestionNum, setCurrentQuestionNum] = useState(1);
  const [activeTeamId, setActiveTeamId] = useState(config.teams[0].id);
  const [showQuestion, setShowQuestion] = useState(false);
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);
  const [bonusNotification, setBonusNotification] = useState<string | null>(null);

  const [teamsState, setTeamsState] = useState(
    config.teams.map(t => ({ ...t, captures: 0, pokeballs: 0 }))
  );

  const [spots, setSpots] = useState<SpotState[]>([]);
  const [teamEncounters, setTeamEncounters] = useState<Record<string, TeamEncounter | null>>({});

  useEffect(() => {
    // Generate 20 distinct spots with random unrepeated Pokemons
    const shuffledGifs = [...POKEMON_GIFS].sort(() => Math.random() - 0.5);
    const initialSpots: SpotState[] = MAP_POSITIONS.map((pos, idx) => ({
      ...pos,
      pokemon: shuffledGifs[idx % shuffledGifs.length],
      multiplier: Math.random() > 0.6 ? 5 : 3,
      capturedByTeamId: null,
      activeInTeamId: null,
      isFailed: false,
    }));
    setSpots(initialSpots);
  }, []);

  const activeTeamIndex = teamsState.findIndex(t => t.id === activeTeamId);
  const activeTeam = teamsState[activeTeamIndex] || teamsState[0];
  const question = questions[currentQuestionNum - 1];
  const activeEncounter = teamEncounters[activeTeamId] || null;

  const handleNextTurn = () => {
    const nextIdx = (activeTeamIndex + 1) % teamsState.length;
    setActiveTeamId(teamsState[nextIdx].id);
    setCurrentQuestionNum(prev => prev + 1);
    setShowQuestion(false);
  };

  const handleSpotClick = (spotId: number) => {
    if (activeEncounter) {
      safeAlert(`${activeTeam.name} đang trong trận chiến với Pokemon! Hãy hoàn tất lượt tấn công trước.`);
      return;
    }

    const spot = spots.find(s => s.id === spotId);
    if (!spot || spot.capturedByTeamId || spot.activeInTeamId || spot.isFailed) {
      safeAlert("Vị trí này đã có đội khác chọn hoặc đã thu phục/biến mất!");
      return;
    }

    // Assign spot to this team
    setSpots(prev => prev.map(s => s.id === spotId ? { ...s, activeInTeamId: activeTeamId } : s));

    const encounter: TeamEncounter = {
      spotId,
      pokemon: spot.pokemon,
      multiplier: spot.multiplier,
      hp: spot.multiplier,
      maxHp: spot.multiplier,
      strikes: 0,
    };

    setTeamEncounters(prev => ({
      ...prev,
      [activeTeamId]: encounter,
    }));

    soundFx.buttonClick();
  };

  const handleAnswer = (isCorrect: boolean, correctAnswerText: string) => {
    if (!activeEncounter) return;

    setAnswerLogs(prev => [...prev, {
      questionNumber: currentQuestionNum,
      questionText: question?.content || `Câu ${currentQuestionNum}`,
      correctAnswer: correctAnswerText,
      teamName: activeTeam.name,
      isCorrect,
    }]);

    if (isCorrect) {
      soundFx.correct();
      const newHp = activeEncounter.hp - 1;

      if (newHp <= 0) {
        // SUCCESSFUL CAPTURE!
        const isBonus = Math.random() < 0.2; // 20% chance for bonus 2x points
        const basePts = config.pointsPerCorrect || 10;
        const awardedPts = isBonus ? basePts * 2 : basePts;

        if (isBonus) {
          setBonusNotification(`🎉 ${activeTeam.name} BẮT ĐƯỢC POKEMON THÀNH CÔNG VÀ NHẬN BONUS X2 ĐIỂM (+${awardedPts}đ)!`);
          setTimeout(() => setBonusNotification(null), 3500);
        } else {
          setBonusNotification(`✨ ${activeTeam.name} THU PHỤC THÀNH CÔNG POKEMON (+${awardedPts}đ)!`);
          setTimeout(() => setBonusNotification(null), 2500);
        }

        // Update spot state
        setSpots(prev => prev.map(s => s.id === activeEncounter.spotId ? {
          ...s,
          capturedByTeamId: activeTeamId,
          activeInTeamId: null,
        } : s));

        // Update team stats (+1 pokeball, +1 capture)
        setTeamsState(prev => prev.map(t => t.id === activeTeamId ? {
          ...t,
          captures: t.captures + 1,
          pokeballs: t.pokeballs + 1,
          score: t.score + awardedPts,
        } : t));

        // Clear encounter
        setTeamEncounters(prev => ({ ...prev, [activeTeamId]: null }));
      } else {
        // Reduced HP
        setTeamEncounters(prev => ({
          ...prev,
          [activeTeamId]: { ...activeEncounter, hp: newHp },
        }));
        setTeamsState(prev => prev.map(t => t.id === activeTeamId ? {
          ...t,
          score: t.score + (config.pointsPerCorrect || 10),
        } : t));
      }
    } else {
      soundFx.wrong();
      const newStrikes = activeEncounter.strikes + 1;

      if (newStrikes >= 3) {
        // FAILED TO CAPTURE! Pokemon disappears!
        safeAlert(`❌ Rất tiếc! ${activeTeam.name} đã sai 3 lần. Pokemon đã vỗ cánh bay mất!`);
        
        setSpots(prev => prev.map(s => s.id === activeEncounter.spotId ? {
          ...s,
          isFailed: true,
          activeInTeamId: null,
        } : s));

        setTeamEncounters(prev => ({ ...prev, [activeTeamId]: null }));

        setTeamsState(prev => prev.map(t => t.id === activeTeamId ? {
          ...t,
          score: Math.max(0, t.score - (config.pointsPerWrong || 0)),
        } : t));
      } else {
        setTeamEncounters(prev => ({
          ...prev,
          [activeTeamId]: { ...activeEncounter, strikes: newStrikes },
        }));

        setTeamsState(prev => prev.map(t => t.id === activeTeamId ? {
          ...t,
          score: Math.max(0, t.score - (config.pointsPerWrong || 0)),
        } : t));
      }
    }

    if (currentQuestionNum >= (config.numberOfQuestions || 10)) {
       setTimeout(() => onGameEnd(teamsState, answerLogs), 1000);
    } else {
       setTimeout(() => {
          handleNextTurn();
       }, 600);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full relative p-4 sm:p-6 rounded-3xl overflow-hidden shadow-inner bg-slate-900 border-4 border-amber-800/40">
       {/* Top Header */}
       <div className="flex justify-between items-center z-20 mb-4 bg-white/90 backdrop-blur px-6 py-3 rounded-2xl border border-amber-200 shadow-md">
         <div className="flex items-center gap-3">
           <img src="/assets/games/pokemon/Ball.png" alt="Pokeball" className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
           <h2 className="text-xl sm:text-2xl font-black text-amber-900">THU PHỤC THÚ CƯNG</h2>
         </div>
         <div className="px-4 py-1.5 bg-amber-800 text-amber-50 rounded-full font-extrabold text-xs sm:text-sm shadow">
           Câu {Math.min(currentQuestionNum, config.numberOfQuestions || 10)} / {config.numberOfQuestions}
         </div>
       </div>

       {/* Bonus Banner Notification */}
       {bonusNotification && (
         <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-900 px-8 py-3 rounded-2xl font-black text-sm sm:text-base shadow-2xl border-2 border-white animate-bounce text-center">
           {bonusNotification}
         </div>
       )}

       {/* Main Gameplay Container */}
       <div className="flex-1 flex flex-col md:flex-row gap-4 z-10 overflow-hidden">
         {/* Team Side Panel */}
         <div className="w-full md:w-1/4 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto pr-1">
           {teamsState.map(team => {
             const isTurn = activeTeamId === team.id;
             const enc = teamEncounters[team.id];
             return (
               <div 
                 key={team.id} 
                 className={`p-3.5 rounded-2xl border-2 transition-all flex-shrink-0 w-48 md:w-full ${
                   isTurn 
                     ? 'border-amber-400 bg-white shadow-xl scale-102 ring-4 ring-amber-400/30' 
                     : 'border-slate-200 bg-white/80'
                 }`}
               >
                 <div className="flex items-center justify-between mb-1.5">
                   <div className="flex items-center gap-2">
                     <span className="text-xl">{team.avatar || '🎮'}</span>
                     <span className="font-black text-sm text-slate-800">{team.name}</span>
                   </div>
                   <div className="text-xs font-black bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-lg border border-amber-200">
                     {team.score}đ
                   </div>
                 </div>

                 {/* Pokeballs collected */}
                 <div className="flex items-center gap-1 mt-1">
                   <span className="text-[11px] font-bold text-slate-600">Bóng đã bắt:</span>
                   <div className="flex items-center gap-1 flex-wrap">
                     {Array.from({ length: team.pokeballs }).map((_, i) => (
                       <img key={i} src="/assets/games/pokemon/Ball.png" alt="Pokeball" className="w-4 h-4 object-contain inline" />
                     ))}
                     {team.pokeballs === 0 && <span className="text-[11px] text-slate-400 italic">Chưa có</span>}
                   </div>
                 </div>

                 {/* Current Encounter status */}
                 {enc ? (
                   <div className="mt-2.5 p-2 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2">
                     <img src={`/assets/games/pokemon/${encodeURIComponent(enc.pokemon)}`} alt="Pokemon" className="w-8 h-8 object-contain" />
                     <div className="text-[10px] font-bold text-amber-900 leading-tight">
                       <div>Đang đấu: HP {enc.hp}/{enc.maxHp}</div>
                       <div className="text-rose-600">Sai: {enc.strikes}/3</div>
                     </div>
                   </div>
                 ) : (
                   <div className="mt-2 text-[10px] text-slate-400 italic">Đang chọn vị trí...</div>
                 )}
               </div>
             );
           })}
         </div>

         {/* Shared Map View */}
         <div 
           className="flex-1 rounded-3xl border-4 border-amber-900/60 flex flex-col relative shadow-2xl overflow-hidden bg-cover bg-center min-h-[380px]"
           style={{ backgroundImage: "url(/assets/games/pokemon/map.png)" }}
         >
           {/* Map Spots 1..20 */}
           {spots.map((spot) => {
             const isOccupiedByOther = spot.activeInTeamId && spot.activeInTeamId !== activeTeamId;
             const isCaptured = !!spot.capturedByTeamId;

             if (isCaptured || spot.isFailed) {
               // Disappears or shows captured pokeball
               return isCaptured ? (
                 <div
                   key={spot.id}
                   className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10 opacity-80"
                   style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                 >
                   <img src="/assets/games/pokemon/Ball.png" alt="Captured" className="w-7 h-7 object-contain drop-shadow" />
                 </div>
               ) : null;
             }

             return (
               <div 
                 key={spot.id}
                 className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                   spot.activeInTeamId === activeTeamId ? 'scale-125 z-30 ring-4 ring-amber-400 rounded-full p-1 bg-amber-400/20' : 'hover:scale-110 z-20'
                 } ${isOccupiedByOther ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
                 style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                 onClick={() => handleSpotClick(spot.id)}
               >
                 <img 
                   src={`/assets/games/pokemon/${spot.id}.png`} 
                   alt={`Vị trí ${spot.id}`} 
                   className="w-8 sm:w-10 h-8 sm:h-10 object-contain drop-shadow-xl hover:brightness-110" 
                 />
                 {isOccupiedByOther && (
                   <span className="text-[9px] bg-red-600 text-white font-bold px-1 rounded">Đang đấu</span>
                 )}
               </div>
             );
           })}

           {/* Active Team Encounter Popup Banner inside Map */}
           {activeEncounter && (
             <div className="absolute top-4 right-4 z-40 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border-2 border-amber-400 text-white shadow-2xl max-w-xs flex flex-col items-center gap-2 animate-in zoom-in-95">
               <div className="flex items-center justify-between w-full">
                 <span className="text-xs font-black text-amber-300 uppercase tracking-wider">{activeTeam.name} ĐANG ĐẤU</span>
                 <img src={`/assets/games/pokemon/x${activeEncounter.multiplier}.png`} alt="multiplier" className="h-5 object-contain" />
               </div>

               <img 
                 src={`/assets/games/pokemon/${encodeURIComponent(activeEncounter.pokemon)}`} 
                 alt="Active Pokemon" 
                 className="w-24 h-24 object-contain animate-bounce my-1" 
               />

               {/* Health / Progress Bar */}
               <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden border border-slate-700 relative">
                 <div 
                   className="bg-gradient-to-r from-emerald-500 to-teal-400 flex-1 min-h-0 w-full transition-all duration-300"
                   style={{ width: `${(activeEncounter.hp / activeEncounter.maxHp) * 100}%` }}
                 />
                 <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow">
                   HP: {activeEncounter.hp} / {activeEncounter.maxHp}
                 </span>
               </div>

               {/* Strikes warning */}
               {activeEncounter.strikes > 0 && (
                 <div className="flex items-center gap-1 text-rose-400 text-xs font-bold">
                   <ShieldAlert className="w-4 h-4 animate-pulse" />
                   <span>Sai {activeEncounter.strikes}/3 lần!</span>
                 </div>
               )}
             </div>
           )}
         </div>
       </div>

       {/* Question Modal */}
       <QuestionDisplayModal
         isOpen={showQuestion}
         questionNumber={currentQuestionNum}
         question={question || null}
         mode={config.mode}
         teamName={activeTeam?.name}
         teamAvatar={activeTeam?.avatar}
         timerEnabled={config.timerEnabled}
         timeLimitSeconds={config.timeLimitSeconds}
         titlePrefix="THU PHỤC THÚ CƯNG"
         onAnswerSubmit={(isCorrect, correctAnswerText) => {
           setShowQuestion(false);
           handleAnswer(isCorrect, correctAnswerText);
         }}
         onClose={() => setShowQuestion(false)}
       />
       
       {/* Attack / Answer Prompt Action Button */}
       {!showQuestion && (
         <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-40">
           {activeEncounter ? (
             <button 
               onClick={() => setShowQuestion(true)} 
               className="px-8 py-3.5 bg-[#6B8E5C] hover:bg-[#58784B] active:scale-95 text-white font-black rounded-full shadow-2xl transition-all border-2 border-amber-200 flex items-center gap-2 text-sm sm:text-base"
             >
               <Sword className="w-5 h-5 text-amber-200 animate-pulse" />
               <span>Tấn Công / Trả Lời Câu Hỏi</span>
             </button>
           ) : (
             <div className="px-6 py-2.5 bg-slate-900/90 text-amber-300 font-extrabold rounded-full border border-amber-400/50 shadow-lg text-xs sm:text-sm text-center">
               👉 {activeTeam.name}: Lựa chọn 1 vị trí (1 - 20) trên bản đồ để khiêu chiến Pokemon!
             </div>
           )}
         </div>
       )}
    </div>
  );
};
