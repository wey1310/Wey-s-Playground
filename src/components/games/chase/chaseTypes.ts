import { Team, Question } from '../../../types';

export interface RoomLocation {
  id: number; // 1 to 9
  name?: string;
  shortName?: string;
  isSpike?: boolean;
  coords: { x: number; y: number }; // % relative on room map
}

export interface JerryInstance {
  id: number;
  positionId: number;
  asset: string;
}

export interface ChaseTeamState extends Team {
  score: number;
  streak: number;
  maxStreak: number;
  questionsAnswered: number;
  questionsCorrect: number;
  jerryCatchesCount: number;
}

export type ChaseGamePhase =
  | 'idle'
  | 'question_open'
  | 'tom_finding'
  | 'tom_running'
  | 'tom_arrived'
  | 'reveal_object'
  | 'jerry_found'
  | 'jerry_missed'
  | 'round_end'
  | 'game_over';

export interface ChaseGameState {
  phase: ChaseGamePhase;
  teams: ChaseTeamState[];
  currentTeamIndex: number;
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  baseQuestionPoints: number;
  
  jerries: JerryInstance[];
  tomTarget: number | null;
  tomStartPosition: { x: number; y: number } | null;
  
  revealedLocation: number | null;
  isJerryCaught: boolean | null;

  lastRoundSummary: {
    teamName: string;
    isQuestionCorrect: boolean;
    isJerryCaught: boolean;
    pointsAwarded: number;
    message: string;
  } | null;
  
  turnNumber: number;
  logs: string[];
}
