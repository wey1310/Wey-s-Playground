import { Team, Question } from '../../../types';

export interface TeaCup {
  id: number; // Số thứ tự 1..N
  questionIndex: number;
  points: number; // Mặc định +10 pts, có thể tuỳ chỉnh
  status: 'unopened' | 'won' | 'lost';
  openedByTeamId?: string;
  openedByTeamName?: string;
  openedAt?: number;
}

export interface BattleTeamState extends Team {
  score: number;
  streak: number;
  maxStreak: number;
  correctAnswersCount: number;
  wrongAnswersCount: number;
  wonCupsCount: number;
}

export type TeaBattleStatus =
  | 'instructions'   // Màn hình hướng dẫn thể lệ (như Screenshot 1)
  | 'cup_select'     // Màn hình bàn trà tatami chọn cốc trà
  | 'question_open'  // Màn hình câu hỏi tương ứng với cốc trà
  | 'evaluating'     // Trạng thái chờ phân định kết quả
  | 'win_animation'  // Hoạt cảnh/Video Tanjiro úp cốc thắng Kanao
  | 'lose_animation' // Hoạt cảnh/Video Kanao tạt nước trà vào mặt Tanjiro
  | 'game_over';     // Tổng kết chiến thắng

export interface TeaBattleGameState {
  status: TeaBattleStatus;
  teams: BattleTeamState[];
  currentTeamIndex: number;
  teaCups: TeaCup[];
  selectedCup: TeaCup | null;
  totalCups: number;
  pointsPerCorrect: number;
  penaltyPerWrong: number;
  currentQuestion: Question | null;
  selectedAnswer: number | null;
  isAnswerRevealed: boolean;
  winnerTeam: BattleTeamState | null;
  lastOutcomeMessage: string;
  logs: string[];
}
