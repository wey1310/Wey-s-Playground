import { GameSetupConfig, Question } from '../../../types';
import { ChaseGameState, ChaseTeamState, RoomLocation, JerryInstance } from './chaseTypes';

// Bố cục 9 đồ vật đúng vị trí trong phòng khách Tom & Jerry (theo ảnh thiết kế 1-9)
export const ROOM_LOCATIONS: RoomLocation[] = [
  { id: 1, name: 'Ghế Sofa Đơn Xanh (1)', shortName: 'Sofa đơn 1', coords: { x: 32, y: 34 } },
  { id: 2, name: 'Ghế Sofa Dài Phòng Khách (2)', shortName: 'Sofa dài 2', coords: { x: 31, y: 73 } },
  { id: 3, name: 'Ghế Sofa Xanh Phải (3)', shortName: 'Sofa đơn 3', coords: { x: 74, y: 65 } },
  { id: 4, name: 'Kệ Sách & Bình Hoa (4)', shortName: 'Kệ sách 4', coords: { x: 47, y: 19 } },
  { id: 5, name: 'Bàn Tròn Gỗ Đỏ (5)', shortName: 'Bàn tròn 5', coords: { x: 19, y: 44 } },
  { id: 6, name: 'Đồng Hồ Quả Lắc Đứng (6)', shortName: 'Đồng hồ 6', coords: { x: 70, y: 25 } },
  { id: 7, name: 'Chiếc Rương Da Cổ (7)', shortName: 'Rương da 7', coords: { x: 56, y: 79 } },
  { id: 8, name: 'Nệm Ngủ Của Chó Spike (8)', shortName: 'Chó Spike 8', isSpike: true, coords: { x: 55, y: 41 } },
  { id: 9, name: 'Bàn Trà Gỗ Chữ Nhật (9)', shortName: 'Bàn trà 9', coords: { x: 49, y: 59 } },
];

export class ChaseEngine {
  public static initializeGameState(
    config: GameSetupConfig,
    questions: Question[] = []
  ): ChaseGameState {
    const teams: ChaseTeamState[] = (config.teams && config.teams.length > 0
      ? config.teams
      : [
          { id: '1', name: 'Đội 1 (Tom A)', color: '#3b82f6', avatar: '🐱', score: 0 },
          { id: '2', name: 'Đội 2 (Tom B)', color: '#ef4444', avatar: '🐱', score: 0 },
        ]
    ).map((t) => ({
      ...t,
      score: t.score || 0,
      streak: 0,
      maxStreak: 0,
      questionsAnswered: 0,
      questionsCorrect: 0,
      jerryCatchesCount: 0,
    }));

    const state: ChaseGameState = {
      phase: 'idle',
      teams,
      currentTeamIndex: 0,
      currentQuestionIndex: 0,
      currentQuestion: questions[0] || null,
      baseQuestionPoints: (config as any).baseScore || config.pointsPerCorrect || 10,

      jerries: [],
      tomTarget: null,
      tomStartPosition: null,
      
      revealedLocation: null,
      isJerryCaught: null,

      lastRoundSummary: null,
      turnNumber: 1,
      logs: ['Game khởi tạo thành công.'],
    };

    return this.randomizeRound(state);
  }

  public static randomizeRound(state: ChaseGameState): ChaseGameState {
    // 1. Shuffle [1..9]
    const positions = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // 2. Chọn 3 position đầu tiên làm Jerry positions
    const jerryPositions = positions.slice(0, 3);

    // 3. Random Jerry asset cho 3 vị trí (từ jerry1 đến jerry6)
    const jerries: JerryInstance[] = jerryPositions.map((posId, idx) => {
      const assetNum = Math.floor(Math.random() * 6) + 1;
      return {
        id: idx + 1,
        positionId: posId,
        asset: `jerry${assetNum}.png`
      };
    });

    // 4. Chọn 1 target position cho Tom ngẫu nhiên từ 1 đến 9
    const tomTarget = Math.floor(Math.random() * 9) + 1;

    return {
      ...state,
      jerries,
      tomTarget,
      tomStartPosition: { x: 50, y: 100 }, // Tom luôn xuất phát từ giữa màn hình dưới
      revealedLocation: null,
      isJerryCaught: null,
    };
  }

  public static resolveAnswer(
    state: ChaseGameState,
    isCorrect: boolean
  ): ChaseGameState {
    const activeTeam = state.teams[state.currentTeamIndex];

    if (!isCorrect) {
      // Đội trả lời sai, chuyển lượt luôn
      const updatedTeams = state.teams.map((team, idx) => {
        if (idx !== state.currentTeamIndex) return team;
        return {
          ...team,
          streak: 0,
          questionsAnswered: team.questionsAnswered + 1,
        };
      });

      return {
        ...state,
        phase: 'round_end',
        teams: updatedTeams,
        lastRoundSummary: {
          teamName: activeTeam.name,
          isQuestionCorrect: false,
          isJerryCaught: false,
          pointsAwarded: 0,
          message: `Đội ${activeTeam.name} trả lời sai và mất lượt bắt Jerry.`,
        },
      };
    } else {
      // Đội trả lời đúng, bắt đầu Tom Finding
      const updatedTeams = state.teams.map((team, idx) => {
        if (idx !== state.currentTeamIndex) return team;
        return {
          ...team,
          score: team.score + state.baseQuestionPoints,
          streak: team.streak + 1,
          maxStreak: Math.max(team.maxStreak, team.streak + 1),
          questionsAnswered: team.questionsAnswered + 1,
          questionsCorrect: team.questionsCorrect + 1,
        };
      });

      return {
        ...state,
        phase: 'tom_finding',
        teams: updatedTeams,
      };
    }
  }

  public static revealObject(state: ChaseGameState): ChaseGameState {
    if (!state.tomTarget) return state;

    const hasJerry = state.jerries.some(j => j.positionId === state.tomTarget);
    return {
      ...state,
      phase: 'reveal_object',
      revealedLocation: state.tomTarget,
      isJerryCaught: hasJerry,
    };
  }

  public static resolveCatch(state: ChaseGameState): ChaseGameState {
    if (state.isJerryCaught === null) return state;

    const activeTeam = state.teams[state.currentTeamIndex];
    const isCaught = state.isJerryCaught;

    const updatedTeams = state.teams.map((team, idx) => {
      if (idx !== state.currentTeamIndex) return team;
      return {
        ...team,
        score: team.score + (isCaught ? state.baseQuestionPoints : 0),
        jerryCatchesCount: team.jerryCatchesCount + (isCaught ? 1 : 0),
      };
    });

    return {
      ...state,
      phase: isCaught ? 'jerry_found' : 'jerry_missed',
      teams: updatedTeams,
      lastRoundSummary: {
        teamName: activeTeam.name,
        isQuestionCorrect: true,
        isJerryCaught: isCaught,
        pointsAwarded: isCaught ? state.baseQuestionPoints : 0,
        message: isCaught 
          ? `Tom đã bắt được Jerry! Thưởng thêm ${state.baseQuestionPoints} điểm.`
          : `Không có Jerry ở đây! Jerry đã chiến thắng.`,
      }
    };
  }

  public static nextTurn(
    state: ChaseGameState,
    questions: Question[]
  ): ChaseGameState {
    const nextTeamIdx = (state.currentTeamIndex + 1) % (state.teams.length || 1);
    const nextQIdx = (state.currentQuestionIndex + 1) % (questions.length || 1);

    const newState: ChaseGameState = {
      ...state,
      phase: 'idle',
      currentTeamIndex: nextTeamIdx,
      currentQuestionIndex: nextQIdx,
      currentQuestion: questions.length > 0 ? questions[nextQIdx] : null,
      turnNumber: state.turnNumber + 1,
    };

    return this.randomizeRound(newState);
  }

  public static log(state: ChaseGameState, msg: string): ChaseGameState {
    const time = new Date().toLocaleTimeString('vi-VN');
    return { ...state, logs: [`[${time}] ${msg}`, ...state.logs].slice(0, 50) };
  }
}
