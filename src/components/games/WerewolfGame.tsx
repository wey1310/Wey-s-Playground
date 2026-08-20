import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  HelpCircle, 
  BookOpen, 
  RotateCcw, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  ShieldCheck, 
  Skull,
  Award,
  ScrollText
} from 'lucide-react';

import { GameSetupConfig, Question, QuestionBank } from '../../types';
import { soundFx } from '../../utils/audio';
import { QuestionDisplayModal } from '../QuestionDisplayModal';

import { 
  NPCVillager, 
  NightAction, 
  NightResolution, 
  WerewolfGamePhase, 
  WerewolfTeamState, 
  WerewolfInvestigationRecord 
} from './werewolf/werewolfTypes';
import { initializeVillageNPCs } from './werewolf/werewolfRoleEngine';
import { executeNightSimulation, getAliveNPCs } from './werewolf/werewolfSimulationEngine';
import { WerewolfVillageMap } from './werewolf/WerewolfVillageMap';
import { WerewolfNightOverlay } from './werewolf/WerewolfNightOverlay';
import { WerewolfDawnModal } from './werewolf/WerewolfDawnModal';
import { WerewolfGuessModal } from './werewolf/WerewolfGuessModal';
import { WerewolfTeacherDebugPanel } from './werewolf/WerewolfTeacherDebugPanel';
import { WerewolfDossierModal } from './werewolf/WerewolfDossierModal';
import { WerewolfScoreboard } from './werewolf/WerewolfScoreboard';

interface WerewolfGameProps {
  config: GameSetupConfig;
  banks?: QuestionBank[];
  activeBankId?: string;
  onBackToHome: () => void;
  onOpenQuickGuide?: (gameType?: string) => void;
}

export const WerewolfGame: React.FC<WerewolfGameProps> = ({
  config,
  banks = [],
  activeBankId,
  onBackToHome,
  onOpenQuickGuide,
}) => {
  // 1. CONFIGURATION EXTRACT
  const maxNights = config.werewolfMaxNights || 5;
  const wolfCount = config.werewolfWolfCount || 3;
  const basePoint = config.werewolfBaseGuessPoint || 100;
  const guessMultiplier = config.werewolfGuessMultiplier || 2;
  const guessMode = config.werewolfGuessMode || 'is_werewolf';
  const revealRoleOnDeath = config.werewolfRevealRoleOnDeath ?? false;
  const enablePublicClues = config.werewolfEnablePublicClues ?? true;
  const timeLimitSeconds = config.timeLimitSeconds || 30;

  // 2. STATE MANAGEMENT
  const [currentNight, setCurrentNight] = useState<number>(1);
  const [phase, setPhase] = useState<WerewolfGamePhase>('NIGHT_START');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDebugOpen, setIsDebugOpen] = useState<boolean>(false);

  // Question bank extraction
  const questionPool = useMemo<Question[]>(() => {
    const currentBank = banks.find(b => b.id === (activeBankId || ''));
    if (currentBank && currentBank.questions.length > 0) {
      return currentBank.questions;
    }
    return [
      {
        id: 'sample_1',
        content: 'Thủ đô của Việt Nam là gì?',
        options: ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Huế'],
        correct: 0,
        type: 'mcq'
      },
      {
        id: 'sample_2',
        content: 'Trái Đất quay một vòng quanh Mặt Trời mất bao lâu?',
        options: ['365 ngày', '24 giờ', '30 ngày', '12 giờ'],
        correct: 0,
        type: 'mcq'
      },
      {
        id: 'sample_3',
        content: 'Nước đóng băng ở bao nhiêu độ C?',
        options: ['0°C', '100°C', '-10°C', '50°C'],
        correct: 0,
        type: 'mcq'
      }
    ] as Question[];
  }, [banks, activeBankId]);

  const [questionIndex, setQuestionIndex] = useState<number>(0);

  // Teams setup
  const [teams, setTeams] = useState<WerewolfTeamState[]>(() => {
    const rawTeams = (config.teams && config.teams.length > 0) ? config.teams : [
      { id: 'team_1', name: 'Đội Đỏ', avatar: '🦁', color: '#dc2626', score: 0 },
      { id: 'team_2', name: 'Đội Xanh', avatar: '🐬', color: '#2563eb', score: 0 },
      { id: 'team_3', name: 'Đội Vàng', avatar: '🦅', color: '#d97706', score: 0 },
      { id: 'team_4', name: 'Đội Xanh Lá', avatar: '🍀', color: '#16a34a', score: 0 },
    ];

    return rawTeams.map(t => ({
      id: t.id,
      name: t.name,
      color: t.color || '#4F683C',
      avatar: t.avatar || '🛡️',
      score: 0,
      correctAnswersCount: 0,
      totalQuestionsAnswered: 0,
      correctGuessesCount: 0,
      totalGuessesCount: 0,
    }));
  });

  const [activeTeamIndex, setActiveTeamIndex] = useState<number>(0);

  // 12 NPCs state
  const [npcs, setNpcs] = useState<NPCVillager[]>(() => {
    return initializeVillageNPCs({
      wolfCount,
      allowedRoles: config.werewolfAllowedRoles
    });
  });

  // Night resolutions history
  const [currentResolution, setCurrentResolution] = useState<NightResolution | null>(null);
  const [nightHistory, setNightHistory] = useState<NightResolution[]>([]);
  const [investigationLogs, setInvestigationLogs] = useState<WerewolfInvestigationRecord[]>([]);

  // Selected NPC for detail view in village map
  const [inspectedNpc, setInspectedNpc] = useState<NPCVillager | null>(null);

  // Question modal state
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState<boolean>(false);
  const [isDawnModalOpen, setIsDawnModalOpen] = useState<boolean>(false);
  const [isGuessModalOpen, setIsGuessModalOpen] = useState<boolean>(false);

  // Feedback Notification Banner
  const [feedbackBanner, setFeedbackBanner] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'danger' | 'info';
    points?: number;
  } | null>(null);

  // Active Team object
  const activeTeam = teams[activeTeamIndex] || teams[0];

  // 3. GAME RESTART LOGIC
  const handleRestartGame = useCallback(() => {
    setCurrentNight(1);
    setPhase('NIGHT_START');
    setNpcs(initializeVillageNPCs({
      wolfCount,
      allowedRoles: config.werewolfAllowedRoles
    }));
    setTeams(prev => prev.map(t => ({
      ...t,
      score: 0,
      correctAnswersCount: 0,
      totalQuestionsAnswered: 0,
      correctGuessesCount: 0,
      totalGuessesCount: 0,
    })));
    setActiveTeamIndex(0);
    setCurrentResolution(null);
    setNightHistory([]);
    setInvestigationLogs([]);
    setInspectedNpc(null);
    setIsQuestionModalOpen(false);
    setIsDawnModalOpen(false);
    setIsGuessModalOpen(false);
    setFeedbackBanner(null);
  }, [wolfCount, config.werewolfAllowedRoles]);

  // 4. NIGHT SIMULATION RESOLUTION
  const handleNightComplete = () => {
    // Execute AI simulation for currentNight
    const { updatedNpcs, resolution } = executeNightSimulation(npcs, currentNight);

    setNpcs(updatedNpcs);
    setCurrentResolution(resolution);
    setNightHistory(prev => [...prev, resolution]);

    // Randomly pick an active team for this night's investigation
    const nextTeamIdx = Math.floor(Math.random() * teams.length);
    setActiveTeamIndex(nextTeamIdx);

    // Switch to DAWN phase
    setPhase('DAWN');
    setIsDawnModalOpen(true);
  };

  // 5. QUESTION SUBMIT RESOLUTION
  const handleProceedToQuestion = () => {
    setIsDawnModalOpen(false);
    setPhase('QUESTION');
    setIsQuestionModalOpen(true);
  };

  const handleAnswerSubmit = (isCorrect: boolean) => {
    setIsQuestionModalOpen(false);

    // Update team stats
    setTeams(prev => prev.map((t, idx) => {
      if (idx !== activeTeamIndex) return t;
      return {
        ...t,
        totalQuestionsAnswered: t.totalQuestionsAnswered + 1,
        correctAnswersCount: isCorrect ? t.correctAnswersCount + 1 : t.correctAnswersCount
      };
    }));

    if (isCorrect) {
      if (!isMuted) soundFx.correct();
      // Correct! Open guess modal
      setPhase('GUESS_CHOICE');
      setIsGuessModalOpen(true);
    } else {
      if (!isMuted) soundFx.wrong();
      // Wrong! Mất lượt đoán
      setFeedbackBanner({
        show: true,
        title: 'TRẢ LỜI CHƯA CHÍNH XÁC',
        message: `${activeTeam.name} chưa trả lời đúng nên đã mất quyền điều tra đêm nay!`,
        type: 'danger'
      });

      setTimeout(() => {
        setFeedbackBanner(null);
        checkAdvanceToNextNight();
      }, 3000);
    }

    setQuestionIndex(prev => prev + 1);
  };

  // 6. GUESS SUBMIT RESOLUTION
  const handleConfirmGuess = (targetNpc: NPCVillager, guessVal: string) => {
    setIsGuessModalOpen(false);
    const potentialPoints = Math.round(basePoint * guessMultiplier);

    let isGuessCorrect = false;

    if (guessMode === 'is_werewolf') {
      const isActuallyWolf = targetNpc.role === 'werewolf';
      isGuessCorrect = (guessVal === 'yes' && isActuallyWolf) || (guessVal === 'no' && !isActuallyWolf);
    } else {
      isGuessCorrect = targetNpc.role === guessVal;
    }

    // Update Team score & stats
    setTeams(prev => prev.map((t, idx) => {
      if (idx !== activeTeamIndex) return t;
      return {
        ...t,
        score: isGuessCorrect ? t.score + potentialPoints : t.score,
        totalGuessesCount: t.totalGuessesCount + 1,
        correctGuessesCount: isGuessCorrect ? t.correctGuessesCount + 1 : t.correctGuessesCount
      };
    }));

    // If correct, reveal the NPC
    if (isGuessCorrect) {
      setNpcs(prev => prev.map(n => {
        if (n.id === targetNpc.id) {
          return {
            ...n,
            isRevealed: true,
            revealedRole: targetNpc.role
          };
        }
        return n;
      }));

      if (!isMuted) soundFx.winFanfare();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      setFeedbackBanner({
        show: true,
        title: 'DỰ ĐOÁN XUẤT SẮC!',
        message: `${activeTeam.name} đã đoán CHÍNH XÁC nhân dạng của ${targetNpc.name} (${targetNpc.role.toUpperCase()})!`,
        type: 'success',
        points: potentialPoints
      });
    } else {
      if (!isMuted) soundFx.wrong();
      setFeedbackBanner({
        show: true,
        title: 'DỰ ĐOÁN CHƯA CHÍNH XÁC',
        message: `${activeTeam.name} chưa đoán đúng nhân dạng của ${targetNpc.name}. Nhân dạng vẫn được giữ bí mật!`,
        type: 'info'
      });
    }

    // Record investigation log
    setInvestigationLogs(prev => [
      ...prev,
      {
        night: currentNight,
        teamId: activeTeam.id,
        teamName: activeTeam.name,
        teamColor: activeTeam.color,
        teamAvatar: activeTeam.avatar,
        questionAnsweredCorrectly: true,
        guessed: true,
        targetNpcId: targetNpc.id,
        targetNpcName: targetNpc.name,
        guessMode,
        guessValue: guessVal,
        isGuessCorrect,
        pointsEarned: isGuessCorrect ? potentialPoints : 0,
        timestamp: Date.now()
      }
    ]);

    setTimeout(() => {
      setFeedbackBanner(null);
      checkAdvanceToNextNight();
    }, 3500);
  };

  // 7. CHECK WIN OR ADVANCE NIGHT
  const checkAdvanceToNextNight = () => {
    // Check end condition:
    // 1. All wolves are revealed or eliminated
    const aliveWolves = npcs.filter(n => n.role === 'werewolf' && n.isAlive);
    const unrevealedWolves = npcs.filter(n => n.role === 'werewolf' && !n.isRevealed);
    const aliveVillagers = npcs.filter(n => n.role !== 'werewolf' && n.isAlive);

    const isGameOver = 
      currentNight >= maxNights ||
      aliveWolves.length === 0 ||
      unrevealedWolves.length === 0 ||
      aliveVillagers.length <= aliveWolves.length;

    if (isGameOver) {
      setPhase('GAME_OVER');
      if (!isMuted) soundFx.winFanfare();
      try {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 }
        });
      } catch (e) {}
    } else {
      // Advance to next night
      setCurrentNight(prev => prev + 1);
      setPhase('NIGHT_START');
    }
  };

  const currentQuestion = questionPool[questionIndex % questionPool.length];

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-between text-slate-100 select-none">
      {/* 1. TOP SCOREBOARD */}
      <WerewolfScoreboard
        currentNight={currentNight}
        maxNights={maxNights}
        teams={teams}
        activeTeamIndex={activeTeamIndex}
        isMuted={isMuted}
        onToggleSound={() => setIsMuted(prev => !prev)}
        onRestartGame={handleRestartGame}
        onBackToHome={onBackToHome}
        onOpenDebug={() => setIsDebugOpen(true)}
        onOpenQuickGuide={() => onOpenQuickGuide?.('werewolf')}
      />

      {/* Feedback Banner Notification */}
      <AnimatePresence>
        {feedbackBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
          >
            <div className={`p-4 rounded-2xl shadow-2xl border-2 text-center flex items-center justify-center gap-3 ${
              feedbackBanner.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-400 text-emerald-100 shadow-emerald-950/50'
                : feedbackBanner.type === 'danger'
                ? 'bg-red-950/95 border-red-500 text-red-100 shadow-red-950/50'
                : 'bg-indigo-950/95 border-indigo-400 text-indigo-100 shadow-indigo-950/50'
            }`}>
              {feedbackBanner.type === 'success' ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0 animate-bounce" />
              ) : (
                <XCircle className="w-8 h-8 text-red-400 shrink-0" />
              )}
              <div>
                <h4 className="font-black text-sm uppercase tracking-wider">
                  {feedbackBanner.title}
                </h4>
                <p className="text-xs font-semibold opacity-90 mt-0.5">
                  {feedbackBanner.message}
                </p>
                {feedbackBanner.points && (
                  <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-xs">
                    +{feedbackBanner.points} ĐIỂM
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MAIN PLAYFIELD: 12 NPC VILLAGE MAP & EVENT LOG */}
      <main className="flex-1 p-3 sm:p-5 max-w-7xl mx-auto w-full flex flex-col justify-center gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1">
          <div className="lg:col-span-3 h-full flex flex-col min-h-[400px]">
            <WerewolfVillageMap
              npcs={npcs}
              isNight={phase === 'NIGHT_START' || phase === 'NIGHT_SIMULATION'}
              selectedNpcId={inspectedNpc?.id}
              onSelectNpc={(npc) => setInspectedNpc(npc)}
              revealRoleOnDeath={revealRoleOnDeath}
              isGuessingMode={phase === 'GUESS_CHOICE'}
            />
          </div>

          {/* Night Event Log */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col h-full max-h-[60vh] lg:max-h-none overflow-hidden">
            <h3 className="text-sm font-black text-indigo-400 uppercase flex items-center gap-2 mb-3 shrink-0">
              <ScrollText className="w-4 h-4" />
              <span>Bản Tin Ngôi Làng</span>
            </h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {nightHistory.map((history) => (
                <div key={history.night} className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 border-b border-slate-700/50 pb-1">
                    🌙 Đêm {history.night}
                  </h4>
                  <div className="space-y-1.5">
                    {history.clues.map((clue, idx) => (
                      <div key={idx} className="text-[11px] text-slate-300 bg-slate-800/50 p-2 rounded-lg leading-relaxed border border-slate-700/50 shadow-sm">
                        • {clue}
                      </div>
                    ))}
                    {history.clues.length === 0 && (
                      <div className="text-[11px] text-slate-500 italic p-2">Đêm qua yên bình, không có manh mối gì.</div>
                    )}
                  </div>
                </div>
              ))}
              {nightHistory.length === 0 && (
                <div className="text-xs text-slate-500 text-center py-8">
                  Chưa có sự kiện nào.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Quick Status Bar */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Đang thực hiện lượt:</span>
            <span 
              className="px-2.5 py-0.5 rounded-lg text-white font-black flex items-center gap-1 shadow-xs"
              style={{ backgroundColor: activeTeam.color }}
            >
              <span>{activeTeam.avatar}</span>
              <span>{activeTeam.name}</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Tiến độ đêm: <strong className="text-indigo-300">{currentNight} / {maxNights}</strong></span>
            <span>•</span>
            <span>Cư dân sống: <strong className="text-emerald-400">{getAliveNPCs(npcs).length}/12</strong></span>
            <span>•</span>
            <span>Ma Sói đã phát hiện: <strong className="text-amber-400">{npcs.filter(n => n.role === 'werewolf' && n.isRevealed).length}/{npcs.filter(n => n.role === 'werewolf').length}</strong></span>
          </div>
        </div>
      </main>

      {/* 3. MODALS & OVERLAYS */}

      {/* Night Overlay */}
      {phase === 'NIGHT_START' && (
        <WerewolfNightOverlay
          nightNumber={currentNight}
          onComplete={handleNightComplete}
        />
      )}

      {/* Dawn Modal */}
      {isDawnModalOpen && currentResolution && (
        <WerewolfDawnModal
          nightNumber={currentNight}
          resolution={currentResolution}
          npcs={npcs}
          selectedTeam={activeTeam}
          onProceedToQuestion={handleProceedToQuestion}
          enablePublicClues={enablePublicClues}
        />
      )}

      {/* Question Modal */}
      <QuestionDisplayModal
        isOpen={isQuestionModalOpen}
        questionNumber={questionIndex + 1}
        question={currentQuestion}
        mode="bank"
        teamName={activeTeam.name}
        teamAvatar={activeTeam.avatar}
        timerEnabled={true}
        timeLimitSeconds={timeLimitSeconds}
        titlePrefix={`CÂU HỎI ĐIỀU TRA — ${activeTeam.name.toUpperCase()}`}
        onAnswerSubmit={handleAnswerSubmit}
        onClose={() => setIsQuestionModalOpen(false)}
      />

      {/* Guess Modal */}
      {isGuessModalOpen && (
        <WerewolfGuessModal
          team={activeTeam}
          npcs={npcs}
          basePoint={basePoint}
          multiplier={guessMultiplier}
          guessMode={guessMode}
          onConfirmGuess={handleConfirmGuess}
        />
      )}

      {/* Teacher Debug Panel */}
      <WerewolfTeacherDebugPanel
        npcs={npcs}
        nightHistory={nightHistory}
        isOpen={isDebugOpen}
        onClose={() => setIsDebugOpen(false)}
      />

      {/* Game Over Dossier Modal */}
      {phase === 'GAME_OVER' && (
        <WerewolfDossierModal
          teams={teams}
          npcs={npcs}
          totalNights={currentNight}
          onPlayAgain={handleRestartGame}
          onBackToHome={onBackToHome}
        />
      )}
    </div>
  );
};
