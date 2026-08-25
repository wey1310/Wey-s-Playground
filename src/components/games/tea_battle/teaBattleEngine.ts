import { GameSetupConfig, Question } from '../../../types';
import { TeaBattleGameState, BattleTeamState, TeaCup } from './teaBattleTypes';

export class TeaBattleEngine {
  /**
   * Khởi tạo bàn trà Tatami với các cốc trà đánh số thứ tự
   */
  public static initializeGameState(
    config: GameSetupConfig,
    questions: Question[] = []
  ): TeaBattleGameState {
    // Khởi tạo danh sách đội
    const teams: BattleTeamState[] = (config.teams && config.teams.length > 0
      ? config.teams
      : [
          { id: '1', name: 'Đội 1 (Tanjiro)', color: '#10b981', avatar: '🎴', score: 0 },
          { id: '2', name: 'Đội 2 (Zenitsu)', color: '#f59e0b', avatar: '⚡', score: 0 },
          { id: '3', name: 'Đội 3 (Inosuke)', color: '#3b82f6', avatar: '🐗', score: 0 },
          { id: '4', name: 'Đội 4 (Nezuko)', color: '#ec4899', avatar: '🌸', score: 0 },
        ]
    ).map((t, idx) => ({
      ...t,
      score: t.score || 0,
      streak: 0,
      maxStreak: 0,
      correctAnswersCount: 0,
      wrongAnswersCount: 0,
      wonCupsCount: 0,
    }));

    // Số lượng cốc trà: tối thiểu 8, mặc định 32 (hoặc bằng số lượng câu hỏi nếu có nhiều câu)
    const questionCount = questions.length > 0 ? questions.length : 32;
    const totalCups = Math.max(16, Math.min(64, questionCount));

    const teaCups: TeaCup[] = Array.from({ length: totalCups }, (_, idx) => ({
      id: idx + 1,
      questionIndex: questions.length > 0 ? idx % questions.length : idx,
      points: config.teaBattleCorrectScore || 10,
      status: 'unopened',
    }));

    return {
      status: 'cup_select',
      teams,
      currentTeamIndex: 0,
      teaCups,
      selectedCup: null,
      totalCups,
      pointsPerCorrect: (config as any).teaBattleCorrectScore || config.pointsPerCorrect || 10,
      penaltyPerWrong: (config as any).teaBattleWrongPenalty || config.pointsPerWrong || 0,
      currentQuestion: null,
      selectedAnswer: null,
      isAnswerRevealed: false,
      winnerTeam: null,
      lastOutcomeMessage: 'Chọn một cốc trà để khiêu chiến Kanao!',
      logs: ['Trận chiến trà đạo Điệp Phủ chính thức bắt đầu!'],
    };
  }

  /**
   * Chọn cốc trà theo số thứ tự
   */
  public static selectCup(
    state: TeaBattleGameState,
    cupId: number,
    questions: Question[]
  ): TeaBattleGameState {
    const cup = state.teaCups.find(c => c.id === cupId);
    if (!cup || cup.status !== 'unopened') return state;

    const qIdx = cup.questionIndex % (questions.length || 1);
    const question = questions.length > 0 ? questions[qIdx] : null;

    return {
      ...state,
      status: 'question_open',
      selectedCup: cup,
      currentQuestion: question,
      selectedAnswer: null,
      isAnswerRevealed: false,
      lastOutcomeMessage: `Đội ${state.teams[state.currentTeamIndex]?.name} đã chọn Cốc Trà #${cup.id}!`,
    };
  }

  /**
   * Xử lý kết quả trả lời câu hỏi: Thắng Kanao (Đúng) hoặc Thua Kanao (Sai)
   */
  public static resolveAnswer(
    state: TeaBattleGameState,
    isCorrect: boolean
  ): {
    nextState: TeaBattleGameState;
    isWon: boolean;
    pointsDelta: number;
  } {
    if (!state.selectedCup) {
      return { nextState: state, isWon: false, pointsDelta: 0 };
    }

    const currentTeam = state.teams[state.currentTeamIndex];
    const pointsDelta = isCorrect
      ? state.selectedCup.points || state.pointsPerCorrect
      : -state.penaltyPerWrong;

    const updatedTeams = state.teams.map((team, idx) => {
      if (idx !== state.currentTeamIndex) return team;
      const newScore = Math.max(0, team.score + pointsDelta);
      const newStreak = isCorrect ? team.streak + 1 : 0;
      return {
        ...team,
        score: newScore,
        streak: newStreak,
        maxStreak: Math.max(team.maxStreak, newStreak),
        correctAnswersCount: team.correctAnswersCount + (isCorrect ? 1 : 0),
        wrongAnswersCount: team.wrongAnswersCount + (isCorrect ? 0 : 1),
        wonCupsCount: team.wonCupsCount + (isCorrect ? 1 : 0),
      };
    });

    const updatedCups = state.teaCups.map(cup => {
      if (cup.id !== state.selectedCup?.id) return cup;
      return {
        ...cup,
        status: isCorrect ? ('won' as const) : ('lost' as const),
        openedByTeamId: currentTeam?.id,
        openedByTeamName: currentTeam?.name,
        openedAt: Date.now(),
      };
    });

    const isAllCupsDone = updatedCups.every(c => c.status !== 'unopened');
    let winner: BattleTeamState | null = null;
    if (isAllCupsDone) {
      winner = [...updatedTeams].sort((a, b) => b.score - a.score)[0] || null;
    }

    const nextState: TeaBattleGameState = {
      ...state,
      status: isCorrect ? 'win_animation' : 'lose_animation',
      teams: updatedTeams,
      teaCups: updatedCups,
      isAnswerRevealed: true,
      winnerTeam: winner,
      lastOutcomeMessage: isCorrect
        ? `Tuyệt đỉnh phản xạ! ${currentTeam?.name} úp cốc thắng Kanao và nhận +${pointsDelta} điểm!`
        : `Chậm một nhịp! Kanao tạt trà ướt sũng mặt Tanjiro (${pointsDelta < 0 ? pointsDelta + ' điểm' : '0 điểm'})!`,
      logs: [
        ...state.logs,
        isCorrect
          ? `[Cốc #${state.selectedCup.id}] ${currentTeam?.name} THẮNG KANAO (+${pointsDelta}đ)`
          : `[Cốc #${state.selectedCup.id}] ${currentTeam?.name} THUA KANAO (${pointsDelta}đ)`,
      ],
    };

    return { nextState, isWon: isCorrect, pointsDelta };
  }

  /**
   * Chuyển lượt sang đội tiếp theo và quay lại bàn trà Tatami
   */
  public static nextTurn(state: TeaBattleGameState): TeaBattleGameState {
    const isAllCupsDone = state.teaCups.every(c => c.status !== 'unopened');
    if (isAllCupsDone) {
      const winner = [...state.teams].sort((a, b) => b.score - a.score)[0] || null;
      return {
        ...state,
        status: 'game_over',
        selectedCup: null,
        currentQuestion: null,
        selectedAnswer: null,
        isAnswerRevealed: false,
        winnerTeam: winner,
      };
    }

    const nextTeamIdx = (state.currentTeamIndex + 1) % (state.teams.length || 1);
    return {
      ...state,
      status: 'cup_select',
      currentTeamIndex: nextTeamIdx,
      selectedCup: null,
      currentQuestion: null,
      selectedAnswer: null,
      isAnswerRevealed: false,
      lastOutcomeMessage: `Lượt của ${state.teams[nextTeamIdx]?.name}! Hãy chọn cốc trà tiếp theo.`,
    };
  }
}
