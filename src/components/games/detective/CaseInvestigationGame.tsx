import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, HelpCircle, Sparkles, CheckCircle2, XCircle, 
  ArrowRight, Users, Eye, Lock, FileText, Pin, Clock, User
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameSetupConfig, Question } from '../../../types';
import { DetectiveCase, Suspect, Clue, TeamCaseState } from './caseTypes';
import { CASE_PRESETS } from './casePresets';
import { generateProceduralCase } from './caseGenerator';
import { CaseSuspectDossierModal } from './CaseSuspectDossierModal';
import { CaseTimelineView } from './CaseTimelineView';
import { CaseAccusationModal } from './CaseAccusationModal';
import { CaseTruthRevealModal } from './CaseTruthRevealModal';
import { CaseTeacherDebugPanel } from './CaseTeacherDebugPanel';
import { CaseStudentManagerModal } from './CaseStudentManagerModal';
import { CaseRandomStudentModal } from './CaseRandomStudentModal';
import { CaseIntro } from './CaseIntro';
import { soundFx } from '../../../utils/audio';

interface CaseInvestigationGameProps {
  config: GameSetupConfig;
  questions: Question[];
  onBackToHome: () => void;
}

export const CaseInvestigationGame: React.FC<CaseInvestigationGameProps> = ({
  config,
  questions,
  onBackToHome
}) => {
  // 1. Generate Detective Cases (One per team)
  const [teamCases, setTeamCases] = useState<DetectiveCase[]>(() => {
    const isSharedMode = config.caseInvestigationMode === 'shared_board'; 
    const numTeams = config.teams?.length || 2;
    const generated: DetectiveCase[] = [];

    if (config.casePresetId) {
      const found = CASE_PRESETS.find(p => p.id === config.casePresetId);
      if (found) {
        for (let i = 0; i < numTeams; i++) generated.push(found);
        return generated;
      }
    }

    let sharedCase: DetectiveCase | null = null;
    if (isSharedMode) {
      sharedCase = generateProceduralCase();
    }

    for (let i = 0; i < numTeams; i++) {
      if (isSharedMode && sharedCase) {
        generated.push(sharedCase);
      } else {
        generated.push(generateProceduralCase({
          difficulty: 'medium', 
          avoidSignatures: generated.map(c => c.id.split('_')[0]) 
        }));
      }
    }
    return generated;
  });

  const [currentTeamIndex, setCurrentTeamIndex] = useState<number>(0);
  const currentCase = teamCases[currentTeamIndex] || teamCases[0];

  // 2. Initialize Teams State
  const [teams, setTeams] = useState<TeamCaseState[]>(() => {
    const rawTeams = config.teams && config.teams.length > 0
      ? config.teams
      : [
          { id: 'team_1', name: 'Đội Thám Tử 1', color: '#f59e0b', avatar: '🕵️‍♂️' },
          { id: 'team_2', name: 'Đội Thám Tử 2', color: '#3b82f6', avatar: '🕵️‍♀️' }
        ];

    return rawTeams.map((t, index) => {
      const teamCase = teamCases[index] || teamCases[0];
      return {
        teamId: t.id,
        teamName: t.name,
        avatar: t.avatar || '🕵️',
        color: t.color || '#f59e0b',
        score: 0,
        guessesLeft: config.caseMaxGuesses || 2,
        unlockedClueIds: teamCase.clues.filter(c => c.isUnlockedByDefault).map(c => c.id),
        interrogatedSuspectIds: [],
        solved: false,
        failed: false
      };
    });
  });

  const activeTeam = teams[currentTeamIndex];

  // 3. Initialize Students
  const [students, setStudents] = useState<string[]>(() => {
    if (config.studentsList && Array.isArray(config.studentsList) && config.studentsList.length > 0) {
      return config.studentsList;
    }
    try {
      const saved = localStorage.getItem('wey_saved_students_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  
  const [activeStudent, setActiveStudent] = useState<string | null>(null);
  const [calledStudents, setCalledStudents] = useState<string[]>([]);
  
  const handleUpdateStudents = (newList: string[]) => {
    setStudents(newList);
    localStorage.setItem('wey_saved_students_list', JSON.stringify(newList));
  };

  const handleStudentSelectedFromRandom = (studentName: string) => {
    setActiveStudent(studentName);
    if (!calledStudents.includes(studentName)) {
      setCalledStudents(prev => [...prev, studentName]);
    }
  };

  // Modals state
  const [isIntroOpen, setIsIntroOpen] = useState(true);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isRandomStudentModalOpen, setIsRandomStudentModalOpen] = useState(false);
  const [isTruthRevealOpen, setIsTruthRevealOpen] = useState(false);

  const [inspectedSuspect, setInspectedSuspect] = useState<Suspect | null>(null);
  const [inspectedClue, setInspectedClue] = useState<Clue | null>(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isAccusationOpen, setIsAccusationOpen] = useState(false);
  
  const [isCaseBriefOpen, setIsCaseBriefOpen] = useState(false);

  // Quiz State
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [targetClueToUnlock, setTargetClueToUnlock] = useState<string | null>(null);

  // --- Handlers ---
  const handleInspectSuspect = (suspect: Suspect) => {
    setTeams(prev => prev.map((t, idx) => {
      if (idx === currentTeamIndex && !t.interrogatedSuspectIds.includes(suspect.id)) {
        return {
          ...t,
          interrogatedSuspectIds: [...t.interrogatedSuspectIds, suspect.id]
        };
      }
      return t;
    }));
    setInspectedSuspect(suspect);
  };

  const handleInspectClue = (clue: Clue) => {
    if (activeTeam.unlockedClueIds.includes(clue.id)) {
      setInspectedClue(clue);
    } else {
      handleRequestUnlockClue(clue.id);
    }
  };

  const handleRequestUnlockClue = (clueId: string) => {
    if (!activeTeam.unlockedClueIds.includes(clueId)) {
      if (questions && questions.length > 0) {
        setTargetClueToUnlock(clueId);
        setIsQuizModalOpen(true);
      } else {
        // Unlock immediately if no questions
        unlockClueForTeam(clueId, currentTeamIndex);
      }
    }
  };

  const unlockClueForTeam = (clueId: string, teamIdx: number) => {
    setTeams(prev => prev.map((t, idx) => {
      if (idx === teamIdx) {
        if (!t.unlockedClueIds.includes(clueId)) {
          return {
            ...t,
            score: t.score + (config.caseBaseScore || 50),
            unlockedClueIds: [...t.unlockedClueIds, clueId]
          };
        }
      }
      return t;
    }));
  };

  const handleAnswerQuestion = (optionIdx: number) => {
    if (answerSubmitted) return;
    setSelectedAnswerIndex(optionIdx);
    setAnswerSubmitted(true);

    const q = questions[currentQuestionIndex % questions.length];
    const isCorrect = typeof q.correct === 'number' 
      ? optionIdx === q.correct 
      : (typeof q.correct === 'string' && q.options ? q.options[optionIdx] === q.correct : false);

    if (isCorrect) {
      soundFx.playCorrect();
      if (targetClueToUnlock) unlockClueForTeam(targetClueToUnlock, currentTeamIndex);
    } else {
      soundFx.playWrong();
    }

    setTimeout(() => {
      setIsQuizModalOpen(false);
      setAnswerSubmitted(false);
      setSelectedAnswerIndex(null);
      setTargetClueToUnlock(null);
      setCurrentQuestionIndex(prev => (prev + 1) % (questions.length || 1));
      // switch team turn
      setCurrentTeamIndex(prev => (prev + 1) % teams.length);
    }, 1800);
  };

  const handleAccusationResult = (result: {
    isCorrect: boolean;
    suspectId: string;
    suspectName: string;
    pointsAwarded: number;
    feedback: string;
  }) => {
    setTeams(prev => prev.map((t, idx) => {
      if (idx === currentTeamIndex) {
        const newGuesses = t.guessesLeft - 1;
        const isSolved = result.isCorrect;
        const isFailed = !isSolved && newGuesses <= 0;
        return {
          ...t,
          score: t.score + (result.isCorrect ? result.pointsAwarded : 0),
          guessesLeft: Math.max(0, newGuesses),
          solved: isSolved || t.solved,
          failed: isFailed
        };
      }
      return t;
    }));
    
    setIsAccusationOpen(false);

    if (result.isCorrect) {
      setTimeout(() => setIsTruthRevealOpen(true), 500);
    } else {
      setCurrentTeamIndex(prev => (prev + 1) % teams.length);
    }
  };

  const handleSwitchCasePreset = (presetId: string) => {
    const found = CASE_PRESETS.find(p => p.id === presetId);
    if (found) {
      setTeamCases(prev => prev.map(() => found));
      setIsIntroOpen(true);
      setTeams(prev => prev.map(t => ({
        ...t,
        score: 0,
        guessesLeft: config.caseMaxGuesses || 2,
        unlockedClueIds: found.clues.filter(c => c.isUnlockedByDefault).map(c => c.id),
        interrogatedSuspectIds: [],
        solved: false,
        failed: false
      })));
    }
  };

  const isClueUnlocked = (clueId: string) => activeTeam.unlockedClueIds.includes(clueId);

  return (
    <div className="w-full flex-1 min-h-[min(650px,100dvh)] h-full overflow-y-auto bg-[#1f1a16] font-sans text-amber-50 flex flex-col detective-game select-none">
      
      {/* 1. COMPACT TOP BAR */}
      <div className="h-12 bg-[#120e0c] border-b border-[#3b2a1c] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToHome}
            className="text-xs font-bold text-amber-200/80 hover:text-amber-200 bg-[#2c1d11] px-3 py-1.5 rounded-lg border border-[#4a321d]"
          >
            ← Sảnh Game
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-black text-amber-500 uppercase tracking-wider">THÁM TỬ SUY LUẬN</span>
          </div>
        </div>

        {/* TEAM STRIP */}
        <div className="flex items-center gap-2 flex-1 justify-center max-w-2xl overflow-hidden">
          {teams.map((t, idx) => {
            const isActive = idx === currentTeamIndex;
            return (
              <button 
                key={t.teamId}
                onClick={() => setCurrentTeamIndex(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive 
                    ? 'bg-amber-600 text-w-text-main shadow-[0_0_10px_rgba(217,119,6,0.4)] border border-amber-400' 
                    : 'bg-[#2a1d12] text-amber-500/70 border border-[#3d2716] hover:bg-[#382718]'
                }`}
              >
                <span>{t.avatar}</span>
                <span className="truncate max-w-[80px]">{t.teamName}</span>
                <span className="bg-white/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px]">{t.score}đ</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setIsStudentModalOpen(true)} className="p-2 text-amber-500 hover:bg-amber-900/40 rounded-lg">
            <Users className="w-4 h-4" />
          </button>
          <button onClick={() => setIsDebugOpen(true)} className="p-2 text-amber-500 hover:bg-amber-900/40 rounded-lg">
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. COMPACT CASE HEADER */}
      <div className="h-16 bg-gradient-to-r from-[#2c1c11] to-[#1f1a16] border-b border-[#3b2a1c] flex flex-col justify-center px-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-900/60 flex items-center justify-center text-xl border border-amber-700/50">
              {currentCase.coverIcon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 font-bold border border-amber-500/30">
                  {currentCase.badge}
                </span>
                <h1 className="text-lg font-black text-amber-100">{currentCase.title}</h1>
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-600 mt-0.5">
                <span className="flex items-center gap-1"><Pin className="w-3 h-3"/> {currentCase.crimeSceneName}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><User className="w-3 h-3"/> Nạn nhân: {currentCase.victim.name}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsCaseBriefOpen(true)}
            className="hidden sm:flex items-center gap-1 text-xs font-bold text-amber-200 bg-[#3d2716] hover:bg-[#4a321d] px-3 py-1.5 rounded-lg border border-[#5c4028]"
          >
            <FileText className="w-3.5 h-3.5" />
            XEM HỒ SƠ
          </button>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD GRID */}
      <div className="flex-1 flex overflow-hidden p-2 gap-2">
        {/* LEFT PANEL: Case Brief */}
        <div className="hidden lg:flex w-64 bg-[#261c14] border border-[#3b2a1c] rounded-xl flex-col p-3 overflow-y-auto custom-scrollbar">
          <h2 className="text-xs font-black text-amber-500/80 uppercase tracking-widest mb-3 border-b border-[#3b2a1c] pb-2">HỒ SƠ VỤ ÁN</h2>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg border-2 border-amber-400 flex items-center justify-center text-2xl">{currentCase.victim.avatar}</div>
            <div>
              <div className="text-[10px] text-red-400 font-bold uppercase">Nạn nhân</div>
              <div className="text-sm font-black text-amber-50">{currentCase.victim.name}</div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-[#1f150e] p-2 rounded-lg border border-[#3b2a1c]">
              <div className="text-[10px] text-amber-500/70 font-bold mb-1">TÌNH TRẠNG</div>
              <div className="text-xs text-amber-100 leading-relaxed">{currentCase.victim.incidentType}</div>
            </div>
            <div className="bg-[#1f150e] p-2 rounded-lg border border-[#3b2a1c]">
              <div className="text-[10px] text-amber-500/70 font-bold mb-1">HIỆN TRƯỜNG</div>
              <div className="text-xs text-amber-100 leading-relaxed">{currentCase.crimeSceneName}</div>
            </div>
            <div className="bg-[#1f150e] p-2 rounded-lg border border-[#3b2a1c]">
              <div className="text-[10px] text-amber-500/70 font-bold mb-1">TÓM TẮT</div>
              <div className="text-xs text-amber-100/80 leading-relaxed line-clamp-4">{currentCase.synopsis}</div>
            </div>
          </div>
          <button 
            onClick={() => setIsCaseBriefOpen(true)}
            className="mt-4 w-full py-2 rounded-lg bg-amber-900/30 text-amber-600 text-xs font-bold border border-amber-900/50 hover:bg-amber-900/50"
          >
            ĐỌC TOÀN BỘ HỒ SƠ
          </button>
        </div>

        {/* CENTER PANEL: Suspects + Clues */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          
          {/* Suspects */}
          <div className="h-32 bg-[#261c14] border border-[#3b2a1c] rounded-xl flex flex-col p-2.5">
             <div className="flex items-center justify-between mb-2 px-1">
               <h2 className="text-xs font-black text-amber-500/80 uppercase tracking-widest flex items-center gap-1"><Users className="w-3.5 h-3.5"/> NGHI PHẠM ({currentCase.suspects.length})</h2>
               <span className="text-[10px] text-amber-500/50 font-medium">Nhấn để thẩm vấn</span>
             </div>
             <div className="flex-1 flex gap-2 overflow-x-auto custom-scrollbar items-center pb-1">
               {currentCase.suspects.map(s => {
                 const isInterrogated = activeTeam.interrogatedSuspectIds.includes(s.id);
                 return (
                   <button 
                     key={s.id}
                     onClick={() => handleInspectSuspect(s)}
                     className="shrink-0 flex items-center gap-2 bg-[#1f150e] hover:bg-[#2c1d11] border border-[#3b2a1c] p-2 rounded-lg w-44 transition text-left"
                   >
                     <div className="w-10 h-10 rounded-md bg-stone-800 flex items-center justify-center text-lg">{s.avatar}</div>
                     <div className="flex-1 min-w-0">
                       <div className="text-xs font-black text-amber-50 truncate">{s.name}</div>
                       <div className="text-[9px] text-amber-500/70 truncate">{s.title}</div>
                       {isInterrogated ? (
                         <div className="text-[9px] text-emerald-400 font-bold mt-0.5">✓ ĐÃ HỎI</div>
                       ) : (
                         <div className="text-[9px] text-stone-500 font-bold mt-0.5">? CHƯA HỎI</div>
                       )}
                     </div>
                   </button>
                 );
               })}
             </div>
          </div>

          {/* Clues */}
          <div className="flex-1 bg-[#261c14] border border-[#3b2a1c] rounded-xl flex flex-col p-2.5 min-h-0 relative">
             {/* Corkboard texture background */}
             <div className="absolute inset-0 opacity-20 pointer-events-none rounded-xl" style={{ backgroundImage: `radial-gradient(#4a3728 1px, transparent 1px)`, backgroundSize: '16px 16px' }} />
             
             <div className="flex items-center justify-between mb-2 px-1 relative z-10">
               <h2 className="text-xs font-black text-amber-500/80 uppercase tracking-widest flex items-center gap-1"><Search className="w-3.5 h-3.5"/> MANH MỐI ({currentCase.clues.length})</h2>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {currentCase.clues.map((clue, idx) => {
                    const isUnlocked = isClueUnlocked(clue.id);
                    if (!isUnlocked) {
                      return (
                        <button 
                          key={clue.id}
                          onClick={() => handleInspectClue(clue)}
                          className="bg-[#1f150e]/80 border-2 border-dashed border-[#3b2a1c] hover:border-amber-700/50 p-3 rounded-xl flex flex-col items-center justify-center gap-2 aspect-square transition"
                        >
                          <Lock className="w-6 h-6 text-stone-600" />
                          <div className="text-[10px] font-bold text-stone-500 text-center">MANH MỐI CHƯA MỞ</div>
                        </button>
                      );
                    }
                    return (
                      <button 
                        key={clue.id}
                        onClick={() => handleInspectClue(clue)}
                        className="bg-[#fffdf8] p-3 rounded-xl border border-stone-300 shadow-md flex flex-col items-start aspect-square relative transform hover:-translate-y-1 transition text-left"
                      >
                         <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-600 border border-white shadow-sm" />
                         <div className="text-2xl mb-1 mt-1">{clue.icon}</div>
                         <div className="text-xs font-black text-stone-900 leading-tight line-clamp-2">{clue.title}</div>
                         <div className="text-[9px] text-stone-500 mt-1 uppercase font-bold">{clue.type}</div>
                         <div className="text-[10px] text-stone-700 mt-auto line-clamp-2 leading-tight">{clue.summary}</div>
                      </button>
                    );
                  })}
                </div>
             </div>
          </div>
        </div>

        {/* RIGHT PANEL: Progress & Actions */}
        <div className="w-48 bg-[#261c14] border border-[#3b2a1c] rounded-xl flex flex-col p-3">
           <h2 className="text-xs font-black text-amber-500/80 uppercase tracking-widest mb-3 border-b border-[#3b2a1c] pb-2">TIẾN ĐỘ ĐIỀU TRA</h2>
           <div className="space-y-2 flex-1">
             <div className="flex justify-between items-center text-xs">
                <span className="text-amber-50/70">Manh mối</span>
                <span className="font-black text-amber-600">{activeTeam.unlockedClueIds.length} / {currentCase.clues.length}</span>
             </div>
             <div className="flex justify-between items-center text-xs">
                <span className="text-amber-50/70">Đã tra vấn</span>
                <span className="font-black text-amber-600">{activeTeam.interrogatedSuspectIds.length} / {currentCase.suspects.length}</span>
             </div>
             <div className="flex justify-between items-center text-xs">
                <span className="text-amber-50/70">Lượt đoán</span>
                <span className="font-black text-red-400">{activeTeam.guessesLeft} / {config.caseMaxGuesses || 2}</span>
             </div>
             <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-[#3b2a1c]">
                <span className="text-amber-50/70">Điểm</span>
                <span className="font-black text-amber-600 text-lg">{activeTeam.score}</span>
             </div>
           </div>

           <div className="space-y-2">
             <button 
               onClick={() => setIsTimelineOpen(true)}
               className="w-full py-2 bg-[#1f150e] hover:bg-[#2c1d11] border border-[#3b2a1c] rounded-lg text-xs font-bold text-amber-200 flex items-center justify-center gap-1"
             >
               <Clock className="w-3.5 h-3.5"/> TIMELINE
             </button>
             <button 
               onClick={() => setIsAccusationOpen(true)}
               disabled={activeTeam.guessesLeft <= 0 || activeTeam.solved}
               className="w-full py-2.5 bg-red-700 hover:bg-red-600 disabled:bg-stone-800 disabled:text-stone-500 rounded-lg text-xs font-black text-w-text-main flex items-center justify-center gap-1 border border-red-500 shadow-md"
             >
               <Sparkles className="w-3.5 h-3.5"/> CHỈ ĐIỂM HUNG THỦ
             </button>
           </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      {isIntroOpen && (
        <CaseIntro currentCase={currentCase} onStartInvestigation={() => setIsIntroOpen(false)} onClose={() => setIsIntroOpen(false)} />
      )}
      
      {/* Case Brief Modal */}
      {isCaseBriefOpen && (
        <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fcf7ed] w-full max-w-2xl max-h-[85vh] rounded-2xl p-6 overflow-y-auto custom-scrollbar border-4 border-[#cfa574] relative">
            <button onClick={() => setIsCaseBriefOpen(false)} className="absolute top-4 right-4 p-1 rounded bg-stone-200 text-stone-600 hover:text-stone-900"><XCircle className="w-6 h-6"/></button>
            <h2 className="text-2xl font-black text-stone-900 mb-4">{currentCase.title}</h2>
            <div className="space-y-4 text-stone-800 text-sm">
              <p className="font-bold text-stone-600 uppercase border-b border-stone-300 pb-1">Tóm tắt vụ án</p>
              <p className="leading-relaxed whitespace-pre-wrap">{currentCase.synopsis}</p>
              <p className="font-bold text-stone-600 uppercase border-b border-stone-300 pb-1 mt-4">Nạn nhân: {currentCase.victim.name}</p>
              <p>Tình trạng: {currentCase.victim.incidentType}</p>
              <p className="italic bg-amber-50 p-3 rounded-lg border border-amber-200">{currentCase.victim.medicalReport}</p>
            </div>
          </div>
        </div>
      )}

      {inspectedSuspect && (
        <CaseSuspectDossierModal
          suspect={inspectedSuspect}
          onClose={() => setInspectedSuspect(null)}
          currentCase={currentCase}
          teamState={activeTeam}
          onInterrogateStatement={() => {}}
          onAccuseSuspect={suspect => {
            setInspectedSuspect(null);
            setIsAccusationOpen(true);
          }}
        />
      )}

      {/* Clue Detail Modal */}
      {inspectedClue && (
        <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fcf7ed] w-full max-w-xl max-h-[85vh] rounded-2xl p-6 overflow-y-auto custom-scrollbar border-4 border-[#cfa574] relative">
            <button onClick={() => setInspectedClue(null)} className="absolute top-4 right-4 p-1 rounded bg-stone-200 text-stone-600 hover:text-stone-900"><XCircle className="w-6 h-6"/></button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-white border border-stone-300 shadow-sm flex items-center justify-center text-4xl">{inspectedClue.icon}</div>
              <div>
                <h2 className="text-xl font-black text-stone-900 leading-tight">{inspectedClue.title}</h2>
                <div className="text-xs font-bold text-stone-500 uppercase flex items-center gap-2 mt-1">
                  <span className="bg-stone-200 px-2 py-0.5 rounded">{inspectedClue.type}</span>
                  <span>📍 {inspectedClue.locationFound}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4 text-sm text-stone-800">
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                 <h3 className="text-xs font-bold text-stone-500 uppercase mb-2">Tóm tắt</h3>
                 <p className="font-semibold">{inspectedClue.summary}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                 <h3 className="text-xs font-bold text-stone-500 uppercase mb-2">Phân tích chi tiết</h3>
                 <p className="leading-relaxed">{inspectedClue.detailedAnalysis}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isTimelineOpen && (
        <CaseTimelineView
          currentCase={currentCase}
          teamState={activeTeam}
          onClose={() => setIsTimelineOpen(false)}
        />
      )}

      {isAccusationOpen && (
        <CaseAccusationModal
          currentCase={currentCase}
          teamState={activeTeam}
          initialSuspect={null}
          onClose={() => setIsAccusationOpen(false)}
          onAccusationResult={handleAccusationResult}
          baseScore={config.caseBaseScore || 100}
          multiplier={config.caseGuessMultiplier || 2}
        />
      )}

      {isTruthRevealOpen && (
        <CaseTruthRevealModal
          currentCase={currentCase}
          teams={teams}
          onClose={() => setIsTruthRevealOpen(false)}
          onRestartCase={() => {
            setIsTruthRevealOpen(false);
            handleSwitchCasePreset(currentCase.id);
          }}
          onBackToHome={onBackToHome}
        />
      )}

      {isDebugOpen && (
        <CaseTeacherDebugPanel
          currentCase={currentCase}
          teams={teams}
          onClose={() => setIsDebugOpen(false)}
          onUnlockAllClues={idx => {
            setTeams(prev => prev.map((t, i) => i === idx ? {
              ...t,
              unlockedClueIds: teamCases[i].clues.map(c => c.id)
            } : t));
          }}
          onAddPoints={(idx, pts) => {
            setTeams(prev => prev.map((t, i) => i === idx ? {
              ...t,
              score: t.score + pts
            } : t));
          }}
          onResetGuesses={idx => {
            setTeams(prev => prev.map((t, i) => i === idx ? {
              ...t,
              guessesLeft: 2,
              failed: false
            } : t));
          }}
          onSwitchCasePreset={handleSwitchCasePreset}
          onTriggerTruthReveal={() => setIsTruthRevealOpen(true)}
        />
      )}

      <CaseStudentManagerModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        students={students}
        activeStudent={activeStudent}
        calledStudents={calledStudents}
        onUpdateStudents={handleUpdateStudents}
        onSelectActiveStudent={st => setActiveStudent(st)}
        onPickRandomStudent={() => setIsRandomStudentModalOpen(true)}
        onResetCalled={() => setCalledStudents([])}
      />

      <CaseRandomStudentModal
        isOpen={isRandomStudentModalOpen}
        onClose={() => setIsRandomStudentModalOpen(false)}
        students={students}
        calledStudents={calledStudents}
        onStudentSelected={handleStudentSelectedFromRandom}
      />

      <AnimatePresence>
        {isQuizModalOpen && questions.length > 0 && (
          <div className="fixed inset-0 z-[100] bg-white/70 backdrop-blur-sm backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1e1510] text-amber-50 max-w-xl w-full rounded-3xl border-2 border-amber-500/80 p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-amber-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-black font-black flex items-center justify-center text-sm">
                    ❓
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-amber-600">
                      THỬ THÁCH GIẢI MÃ VẬT CHỨNG
                    </h3>
                  </div>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl border border-amber-900/60">
                <p className="text-sm font-bold text-zinc-100 leading-relaxed">
                  {questions[currentQuestionIndex % questions.length]?.content}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {questions[currentQuestionIndex % questions.length]?.options?.map((opt, idx) => {
                  const currentQ = questions[currentQuestionIndex % questions.length];
                  const isSelected = selectedAnswerIndex === idx;
                  const isCorrect = typeof currentQ.correct === 'number' 
                    ? idx === currentQ.correct 
                    : (typeof currentQ.correct === 'string' && opt === currentQ.correct);
                  
                  let btnStyle = 'bg-zinc-900/90 border-zinc-700 hover:bg-zinc-800';
                  if (answerSubmitted) {
                    if (isCorrect) btnStyle = 'bg-emerald-900 border-emerald-400 animate-pulse';
                    else if (isSelected) btnStyle = 'bg-rose-900 border-rose-400';
                  }

                  return (
                    <button
                      key={idx}
                      disabled={answerSubmitted}
                      onClick={() => handleAnswerQuestion(idx)}
                      className={`p-3 rounded-xl border-2 text-left text-xs transition flex items-center gap-2 ${btnStyle}`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-white/70 backdrop-blur-sm font-black flex items-center justify-center shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="font-semibold line-clamp-2">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
