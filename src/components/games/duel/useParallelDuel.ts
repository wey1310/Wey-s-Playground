import { useState, useEffect, useCallback, useRef } from 'react';
import { GameSetupConfig, Question, AnswerLog } from '../../../types';
import { soundFx } from '../../../utils/audio';

export type DuelPlayerState = {
  score: number;
  currentQuestion: Question | null;
  currentQuestionNum: number | null;
  usedIndices: number[];
  canAnswer: boolean;
  isWaitingTeacher: boolean;
  lastAnswerIsCorrect: boolean | null;
  streak: number;
};

export function useParallelDuel(
  config: GameSetupConfig, 
  questions: Question[], 
  onAction: (teamIdx: 0 | 1, isCorrect: boolean, amount: number) => void
) {
  const [playerA, setPlayerA] = useState<DuelPlayerState>({
    score: 0, 
    currentQuestion: null, 
    currentQuestionNum: null, 
    usedIndices: [], 
    canAnswer: true, 
    isWaitingTeacher: false, 
    lastAnswerIsCorrect: null,
    streak: 0
  });

  const [playerB, setPlayerB] = useState<DuelPlayerState>({
    score: 0, 
    currentQuestion: null, 
    currentQuestionNum: null, 
    usedIndices: [], 
    canAnswer: true, 
    isWaitingTeacher: false, 
    lastAnswerIsCorrect: null,
    streak: 0
  });
  
  const [logs, setLogs] = useState<AnswerLog[]>([]);

  // Refs for current states to prevent closure race conditions
  const playerARef = useRef(playerA);
  const playerBRef = useRef(playerB);
  playerARef.current = playerA;
  playerBRef.current = playerB;

  const getNextQuestionData = useCallback((usedIndices: number[]) => {
    if (config.mode === 'bank' && questions.length > 0) {
      let available = questions.map((_, i) => i).filter(i => !usedIndices.includes(i));
      let nextUsed = [...usedIndices];
      if (available.length === 0) {
        available = questions.map((_, i) => i);
        nextUsed = [];
      }
      const randIdx = available[Math.floor(Math.random() * available.length)];
      nextUsed.push(randIdx);
      return { 
        q: questions[randIdx], 
        num: randIdx + 1, 
        idx: randIdx, 
        updatedUsed: nextUsed 
      };
    } else {
      const maxNum = config.totalQuestionsNumber || 10;
      let available = Array.from({ length: maxNum }, (_, i) => i + 1).filter(n => !usedIndices.includes(n));
      let nextUsed = [...usedIndices];
      if (available.length === 0) {
        available = Array.from({ length: maxNum }, (_, i) => i + 1);
        nextUsed = [];
      }
      const randNum = available[Math.floor(Math.random() * available.length)] || Math.floor(Math.random() * maxNum) + 1;
      nextUsed.push(randNum);
      return { 
        q: null, 
        num: randNum, 
        idx: randNum, 
        updatedUsed: nextUsed 
      };
    }
  }, [config.mode, config.totalQuestionsNumber, questions]);

  const loadQuestionFor = useCallback((isPlayerA: boolean) => {
    const currentUsed = isPlayerA ? playerARef.current.usedIndices : playerBRef.current.usedIndices;
    const next = getNextQuestionData(currentUsed);

    const updateState = (prev: DuelPlayerState): DuelPlayerState => ({
      ...prev,
      currentQuestion: next.q,
      currentQuestionNum: next.num,
      usedIndices: next.updatedUsed,
      canAnswer: true,
      isWaitingTeacher: config.mode === 'number',
      lastAnswerIsCorrect: null
    });

    if (isPlayerA) {
      setPlayerA(updateState);
    } else {
      setPlayerB(updateState);
    }
  }, [getNextQuestionData, config.mode]);

  // Initial load
  useEffect(() => {
    if (config.mode !== 'custom') {
      loadQuestionFor(true);
      loadQuestionFor(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = useCallback((isPlayerA: boolean, optionIdx: number) => {
    const pState = isPlayerA ? playerARef.current : playerBRef.current;
    if (!pState.canAnswer || config.mode === 'custom' || pState.isWaitingTeacher || !pState.currentQuestion) return;
    
    // Check correctness
    let isCorrect = false;
    const correctVal = pState.currentQuestion.correct;
    if (typeof correctVal === 'number') {
      isCorrect = correctVal === optionIdx;
    } else if (typeof correctVal === 'string') {
      const labels = ['A', 'B', 'C', 'D'];
      isCorrect = correctVal.trim().toUpperCase() === labels[optionIdx] || 
                  correctVal.trim().toUpperCase() === pState.currentQuestion.options?.[optionIdx]?.trim().toUpperCase();
    }

    if (isCorrect) {
      soundFx.correct();
    } else {
      soundFx.wrong();
    }

    const pointGain = config.pointsPerCorrect || 10;
    const pointLoss = config.pointsPerWrong || 5;
    const amount = isCorrect ? pointGain : -pointLoss;

    onAction(isPlayerA ? 0 : 1, isCorrect, amount);
    
    const teamName = isPlayerA 
      ? (config.teams[0]?.name || 'Đội A') 
      : (config.teams[1]?.name || 'Đội B');

    setLogs(prev => [...prev, {
      questionNumber: pState.currentQuestionNum || prev.length + 1,
      questionText: pState.currentQuestion?.content || `Câu ${pState.currentQuestionNum}`,
      correctAnswer: typeof pState.currentQuestion?.correct === 'number' && pState.currentQuestion?.options 
        ? pState.currentQuestion.options[pState.currentQuestion.correct] 
        : String(pState.currentQuestion?.correct),
      teamName,
      isCorrect,
      selectedAnswer: pState.currentQuestion?.options?.[optionIdx] || `Đáp án ${['A','B','C','D'][optionIdx]}`
    }]);

    if (isPlayerA) {
      setPlayerA(p => ({ 
        ...p, 
        canAnswer: false, 
        lastAnswerIsCorrect: isCorrect,
        streak: isCorrect ? p.streak + 1 : 0
      }));
      setTimeout(() => loadQuestionFor(true), 1100);
    } else {
      setPlayerB(p => ({ 
        ...p, 
        canAnswer: false, 
        lastAnswerIsCorrect: isCorrect,
        streak: isCorrect ? p.streak + 1 : 0
      }));
      setTimeout(() => loadQuestionFor(false), 1100);
    }
  }, [config, onAction, loadQuestionFor]);

  const handleTeacherJudge = useCallback((isPlayerA: boolean, isCorrect: boolean) => {
    const pState = isPlayerA ? playerARef.current : playerBRef.current;
    if (!pState.isWaitingTeacher) return;

    if (isCorrect) {
      soundFx.correct();
    } else {
      soundFx.wrong();
    }

    const pointGain = config.pointsPerCorrect || 10;
    const pointLoss = config.pointsPerWrong || 5;
    const amount = isCorrect ? pointGain : -pointLoss;

    onAction(isPlayerA ? 0 : 1, isCorrect, amount);

    const teamName = isPlayerA 
      ? (config.teams[0]?.name || 'Đội A') 
      : (config.teams[1]?.name || 'Đội B');

    setLogs(prev => [...prev, {
      questionNumber: pState.currentQuestionNum || prev.length + 1,
      questionText: `Câu hỏi số ${pState.currentQuestionNum}`,
      correctAnswer: isCorrect ? 'Đúng' : 'Sai',
      teamName,
      isCorrect
    }]);

    if (isPlayerA) {
      setPlayerA(p => ({ 
        ...p, 
        isWaitingTeacher: false, 
        canAnswer: false, 
        lastAnswerIsCorrect: isCorrect,
        streak: isCorrect ? p.streak + 1 : 0
      }));
      setTimeout(() => loadQuestionFor(true), 1100);
    } else {
      setPlayerB(p => ({ 
        ...p, 
        isWaitingTeacher: false, 
        canAnswer: false, 
        lastAnswerIsCorrect: isCorrect,
        streak: isCorrect ? p.streak + 1 : 0
      }));
      setTimeout(() => loadQuestionFor(false), 1100);
    }
  }, [config, onAction, loadQuestionFor]);

  const handleSmash = useCallback((isPlayerA: boolean) => {
    if (config.mode !== 'custom') return;
    soundFx.buttonClick();
    onAction(isPlayerA ? 0 : 1, true, 1);
  }, [config.mode, onAction]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      // Player A key bindings
      if (['w', 'a', 's', 'd', '1', '2', '3', '4'].includes(key)) {
        if (config.mode === 'custom') {
          handleSmash(true);
        } else if (config.mode === 'bank') {
          const map: Record<string, number> = { 
            'w': 0, '1': 0,
            'a': 1, '2': 1,
            's': 2, '3': 2,
            'd': 3, '4': 3
          };
          if (map[key] !== undefined) {
            handleAnswer(true, map[key]);
          }
        }
      }

      // Player B key bindings
      if (['arrowup', 'arrowleft', 'arrowdown', 'arrowright', 'i', 'j', 'k', 'l', '7', '8', '9', '0'].includes(key)) {
        if (config.mode === 'custom') {
          handleSmash(false);
        } else if (config.mode === 'bank') {
          const map: Record<string, number> = {
            'arrowup': 0, 'i': 0, '7': 0,
            'arrowleft': 1, 'j': 1, '8': 1,
            'arrowdown': 2, 'k': 2, '9': 2,
            'arrowright': 3, 'l': 3, '0': 3
          };
          if (map[key] !== undefined) {
            handleAnswer(false, map[key]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config.mode, handleAnswer, handleSmash]);

  return { playerA, playerB, logs, handleTeacherJudge, handleAnswer, handleSmash };
}
