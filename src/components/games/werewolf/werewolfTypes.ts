export type WerewolfRole =
  | 'werewolf'
  | 'seer'
  | 'guard'
  | 'witch'
  | 'hunter'
  | 'villager';

export type WerewolfFaction = 'werewolf' | 'villager' | 'neutral';

export type WerewolfPersonality =
  | 'cautious'
  | 'aggressive'
  | 'suspicious'
  | 'logical'
  | 'loyal'
  | 'chaotic'
  | 'observant';

export interface NPCStatement {
  type: 'testimony' | 'defense' | 'suspicion' | 'speculation';
  typeLabel: string; // 'Lời khai' | 'Biện hộ' | 'Nghi ngờ' | 'Suy đoán'
  icon: string; // 📜 | 🛡️ | 👁️ | 💡
  content: string;
  night: number;
}

export interface PersonalityProfile {
  id: WerewolfPersonality;
  name: string;
  badge: string;
  description: string;
  riskTolerance: number; // 0.0 to 1.0
  aggression: number; // 0.0 to 1.0
  skepticism: number; // 0.0 to 1.0
  memoryRetention: number; // 0.0 to 1.0
}

export interface NPCVillager {
  id: string; // 'npc_01' .. 'npc_12'
  name: string;
  avatar: string;
  age: number;
  job: string;
  bio?: string;
  statement?: NPCStatement; // Lời khai, biện hộ, nghi ngờ, suy đoán mới nhất
  statementHistory?: NPCStatement[]; // Lịch sử lời khai qua các đêm
  personality: WerewolfPersonality;
  personalityProfile?: PersonalityProfile;
  faction: WerewolfFaction;
  role: WerewolfRole;
  isAlive: boolean;
  isRevealed: boolean; // Has been correctly guessed by teams
  revealedRole?: WerewolfRole;
  suspicion: Record<string, number>; // suspicion score towards other NPC IDs (0.0 to 1.0)
  memory: Array<{
    night: number;
    event: string;
    type: 'observed' | 'investigated' | 'targeted' | 'saved' | 'attacked' | 'clue';
  }>;
  relationships: Record<string, number>; // -1.0 (hostile) to 1.0 (trusting ally)
  nightActionHistory: Array<{
    night: number;
    actionType: string;
    targetId?: string;
    targetName?: string;
    outcome?: string;
  }>;
  knownInformation: {
    investigatedNpcs: Record<string, 'werewolf' | 'villager'>; // for Seer
    witchPotions: {
      healUsed: boolean;
      poisonUsed: boolean;
    };
    wolfPartners: string[]; // for Werewolves
    lastGuardedId?: string; // for Guard (prevent duplicate guard)
    hunterShotTargetId?: string; // for Hunter retaliation
  };
  behaviorState: {
    fearLevel: number; // 0 to 1
    alertness: number; // 0 to 1
    lastThreatSeen?: string;
  };
}

export type NightActionType =
  | 'wolf_kill'
  | 'seer_check'
  | 'guard_protect'
  | 'witch_save'
  | 'witch_poison'
  | 'hunter_retaliate';

export interface NightAction {
  actorId: string;
  actorName: string;
  role: WerewolfRole;
  actionType: NightActionType;
  targetId?: string;
  targetName?: string;
  priority: number; // Execution order: Guard(1) -> Seer(2) -> Wolf(3) -> Witch(4) -> Hunter(5)
  reason?: string;
}

export interface NightResolution {
  night: number;
  casualties: string[]; // NPC IDs of those who died
  savedIds: string[]; // NPC IDs who were saved (by Guard or Witch)
  poisonedIds: string[]; // NPC IDs poisoned by Witch
  hunterKilledId?: string; // NPC ID shot by dying Hunter
  seerInvestigation?: {
    seerId: string;
    targetId: string;
    targetName: string;
    isWerewolf: boolean;
  };
  actionsTaken: NightAction[];
  clues: string[]; // public enigmatic clues that students can inspect
  publicSummary: string[]; // public announcements revealed at dawn
}

export type WerewolfGamePhase =
  | 'NIGHT_START'
  | 'NIGHT_SIMULATION'
  | 'DAWN'
  | 'TEAM_SELECTION'
  | 'QUESTION'
  | 'CORRECT_FEEDBACK'
  | 'WRONG_FEEDBACK'
  | 'GUESS_CHOICE'
  | 'GUESS_FEEDBACK'
  | 'NIGHT_SUMMARY'
  | 'GAME_OVER';

export interface WerewolfTeamState {
  id: string;
  name: string;
  color: string;
  avatar: string;
  score: number;
  correctAnswersCount: number;
  totalQuestionsAnswered: number;
  correctGuessesCount: number;
  totalGuessesCount: number;
}

export interface WerewolfInvestigationRecord {
  night: number;
  teamId: string;
  teamName: string;
  teamColor: string;
  teamAvatar: string;
  questionAnsweredCorrectly: boolean;
  guessed: boolean;
  targetNpcId?: string;
  targetNpcName?: string;
  guessMode?: 'is_werewolf' | 'exact_role';
  guessValue?: string; // 'yes' | 'no' | WerewolfRole
  isGuessCorrect?: boolean;
  pointsEarned: number;
  timestamp: number;
}
