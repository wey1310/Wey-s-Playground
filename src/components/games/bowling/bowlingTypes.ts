import { Team, Question } from '../../../types';

export type BowlingSpecialPin = 'NORMAL' | 'GOLD' | 'BONUS' | 'FIRE' | 'FREEZE';

export type BowlingDifficulty = 'easy' | 'medium' | 'hard';

export interface PinState {
  id: number;
  row: number;
  col: number;
  x: number; // 0 - 100%
  y: number; // 0 - 100%
  isKnocked: boolean;
  specialType: BowlingSpecialPin;
  rotation: number;
  isSecret?: boolean;
}

export type BallStatus = 'READY' | 'AIMING' | 'POWERING' | 'ROLLING' | 'COLLISION' | 'STOPPED' | 'RESULT';

export interface BallState {
  x: number; // -100 to 100 (0 is center)
  y: number; // 0 (start) to 100 (pins)
  velocity: number;
  power: number; // 30 - 100
  angle: number; // degrees
  spin: number; // -5 to +5
  status: BallStatus;
}

export interface TrajectoryPoint {
  x: number; // -100 to 100 lane coordinate
  y: number; // 0 to 100 distance along lane
  vx: number; // current x-velocity component
  vy: number; // current y-velocity component
  spin: number;
  isGutter: boolean;
}

export interface RollSimulationResult {
  knockedPins: number[];
  isGutter: boolean;
  isStrike: boolean;
  isSpare: boolean;
  bonusScore: number;
  trajectory: TrajectoryPoint[];
  finalImpactX: number;
  entryAngle: number;
}

export interface BowlingFrameScore {
  frameNumber: number;
  roll1Knocked: number | null;
  roll2Knocked: number | null;
  isStrike: boolean;
  isSpare: boolean;
  score: number;
}

export interface BowlingTeamState extends Team {
  frameScores: BowlingFrameScore[];
  totalScore: number;
  totalPinsKnocked: number;
  strikeCount: number;
  spareCount: number;
  bonusPoints: number;
  currentRoll: 1 | 2;
}

export type BowlingEventName =
  | 'QUESTION_CORRECT'
  | 'QUESTION_WRONG'
  | 'ROLL_START'
  | 'BALL_THROW'
  | 'BALL_ROLLING'
  | 'PIN_HIT'
  | 'PIN_KNOCKED'
  | 'STRIKE'
  | 'SPARE'
  | 'GUTTER'
  | 'MISS'
  | 'ROLL_END'
  | 'FRAME_END'
  | 'GAME_WIN'
  | 'GAME_END';

export interface BowlingGameState {
  status: 'intro' | 'question' | 'lane_ready' | 'ball_rolling' | 'roll_result' | 'frame_summary' | 'game_over';
  teams: BowlingTeamState[];
  currentTeamIndex: number;
  currentFrame: number;
  totalFrames: number;
  currentQuestionIndex: number;
  ball: BallState;
  pins: PinState[];
  knockedThisRoll: number;
  isTwoRollsMode: boolean;
  lastRollOutcome: 'STRIKE' | 'SPARE' | 'GUTTER' | 'NORMAL' | 'MISS' | null;
  winnerTeam: BowlingTeamState | null;
  difficulty: BowlingDifficulty;
  laneFriction: number;
}
