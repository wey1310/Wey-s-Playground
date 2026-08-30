export type QuestionType = 'mcq' | 'tf' | 'text';
export type CognitiveLevel = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';

export interface Question {
  id: string;
  type: QuestionType;
  content: string;
  options?: string[]; // 4 options for MCQ
  correct: number | boolean | string; // 0-3 for MCQ, boolean for TF, string for text
  explanation?: string;
  imageUrl?: string;
  isFavorite?: boolean;
  cognitiveLevel?: CognitiveLevel | string; // Mức độ nhận thức (CT GDPT 2018)
  learningOutcome?: string; // Yêu cầu cần đạt (YCCĐ) theo CT GDPT 2018
  competency?: string; // Năng lực đặc thù của môn học
}

export interface QuestionBank {
  id: string;
  type?: 'quiz' | 'word';
  name: string;
  description?: string;
  subject: string;
  grade: string;
  topic: string;
  folder?: string; // Optional user folder/collection name
  tags?: string[];
  visibility?: 'private' | 'public';
  ownerId?: string;
  userId?: string;
  userEmail?: string;
  questions: Question[];
  isPreset?: boolean;
  createdAt: string;
  updatedAt?: string;
  favorite?: boolean;
  viewCount?: number;
  copyCount?: number;
  isDeleted?: boolean;
}

export interface Team {
  id: string;
  name: string;
  avatar: string;
  color: string;
  score: number;
  emoji?: string;
  perks?: {
    shield?: boolean;
    vampire?: boolean;
    double?: boolean;
  };
  challengesLeft?: number; // For Territory game (2 per game)
}

export type GameMode = 'bank' | 'number' | 'custom' | 'none' | 'no_questions' | 'skip_questions';

export type GameId =
  | 'lucky_star'
  | 'luckystar'
  | 'ai_star_call'
  | 'ai_galaxy_call'
  | 'ai_nebula_call'
  | 'ai_bubble_call'
  | 'open_box'
  | 'openbox'
  | 'mancala'
  | 'wheel'
  | 'ludo'
  | 'betting'
  | 'bingo'
  | 'territory'
  | 'tug_of_war'
  | 'tugofwar'
  | 'tower'
  | 'puzzle'
  | 'race'
  | 'pokemon'
  | 'battleship'
  | 'pictogram'
  | 'randomcall'
  | 'eggcall'
  | 'blindbox'
  | 'magicwheel'
  | 'magic_wheel'
  | 'posechallenge'
  | 'pose_challenge'
  | 'caro'
  | 'chess'
  | 'whack_a_mole'
  | 'whackamole'
  | 'whack_mole'
  | 'whackmole'
  | 'dap_chuot'
  | 'dapchuot'
  | 'classification'
  | 'phanloai'
  | 'phan_loai'
  | 'flag_capture'
  | 'flagcapture'
  | 'cuopco'
  | 'cuop_co'
  | 'sack_race'
  | 'sackrace'
  | 'nhaybaobo'
  | 'nhay_bao_bo'
  | 'snail_word_search'
  | 'snail_words'
  | 'snailwordsearch'
  | 'ocsen'
  | 'oc_sen'
  | 'mine_boom'
  | 'mineboom'
  | 'doboom'
  | 'do_boom'
  | 'gold_miner'
  | 'goldminer'
  | 'daovang'
  | 'bear_pass'
  | 'bearpass'
  | 'truyengau'
  | 'letter_arrange'
  | 'letterarrange'
  | 'sapxepchu'
  | 'apple_pick'
  | 'applepick'
  | 'apple_harvest'
  | 'haitao'
  | 'son_tinh_thuy_tinh'
  | 'sontinhthuytinh'
  | 'sontinh_thuytinh'
  | 'cothu'
  | 'co_thu'
  | 'sontinh'
  | 'monopoly'
  | 'cotyphu'
  | 'co_ty_phu'
  | 'werewolf_village'
  | 'masoi'
  | 'werewolf'
  | 'ma_soi'
  | 'case_investigation'
  | 'case_mystery'
  | 'ho_so_vu_an'
  | 'hosovuan'
  | 'detective_case'
  | 'conan_case'
  | 'tea_battle'
  | 'teabattle'
  | 'tran_chien_tra'
  | 'tranchientra'
  | 'tea_fight'
  | 'bowling'
  | 'bowling_game'
  | 'nem_bowling'
  | 'bowling_strike'
  | 'chase_race'
  | 'cuoc_duoi_bat'
  | 'cuocduoibat'
  | 'duoibat'
  | 'chase'
  | 'tom_jerry_chase';

export type GameType = | "lucky_star" | "luckystar" | "ai_star_call" | "ai_galaxy_call" | "ai_nebula_call" | "ai_bubble_call"
  | 'openbox'
  | 'mancala'
  | 'wheel'
  | 'ludo'
  | 'betting'
  | 'bingo'
  | 'territory'
  | 'tugofwar'
  | 'tower'
  | 'puzzle'
  | 'race'
  | 'pokemon'
  | 'battleship'
  | 'pictogram'
  | 'magicwheel'
  | 'posechallenge'
  | 'caro'
  | 'randomcall'
  | 'eggcall'
  | 'blindbox'
  | 'chess'
  | 'whack_a_mole'
  | 'classification'
  | 'flag_capture'
  | 'sack_race'
  | 'snail_word_search'
  | 'mine_boom'
  | 'gold_miner'
  | 'bear_pass'
  | 'letter_arrange'
  | 'apple_pick'
  | 'son_tinh_thuy_tinh'
  | GameId;

export type GamePedagogicalTag =
  | 'Khởi động'
  | 'Luyện tập'
  | 'Tìm hiểu kiến thức'
  | 'Gọi tên'
  | 'Củng cố'
  | 'Vận động'
  | 'Đấu trí'
  | 'Đồng đội';

export type GameTheme =
  | 'basic'
  | 'ocean'
  | 'detective'
  | 'cowboy'
  | 'cloud'
  | 'note'
  | 'rainbow'
  | 'galaxy'
  | 'forest';

// Classification Game Types
export interface ClassificationCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface ClassificationItem {
  id: string;
  content: string;
  categoryId: string;
  image?: string;
}

export interface GameSetupConfig {
  gameId: GameId;
  mode: GameMode; // 'bank' | 'number' | 'custom'
  playMode?: 1 | 2 | 3; // 1: Ngân hàng, 2: Giáo viên nhập (Random), 3: Câu đố (Tuần tự)
  selectedBankId?: string;
  totalQuestionsNumber: number; // for number mode or question count
  numberOfQuestions?: number;
  pointsPerCorrect?: number;
  pointsPerWrong?: number;
  pointsPerLetter?: number; // Point value per letter (e.g., 100, 200, 500)
  letterMode?: 'accent' | 'no-accent'; // 'accent' (Có dấu) or 'no-accent' (Không dấu)
  customPhrases?: string[]; // Custom phrases list for mode 2 & 3
  topicPrompt?: string; // Topic prompt for AI generation
  topic?: string; // Optional topic/lesson title
  lessonTitle?: string; // Optional lesson title
  randomEnabled?: boolean; // true for mode 1 & 2, false for mode 3
  teamMode: boolean; // On or Off
  teams: Team[];
  timerEnabled: boolean;
  timeLimitSeconds: number; // e.g. 30s
  theme: GameTheme;
  raceVehicleType?: 'moto' | 'car' | 'snail' | 'space' | 'horse' | 'doramini' | string;
  studentsList?: string[];
  noRepeatStudents?: boolean;
  randomCallSkipQuestions?: boolean;
  skipQuestions?: boolean;

  // 1. Whack-A-Mole Config
  holeCount?: number; // 6, 8, 9, 12
  moleSpeed?: 'slow' | 'medium' | 'fast';
  hasTrapMoles?: boolean;
  
  // 2. Classification Config
  classificationCategories?: ClassificationCategory[];
  classificationItems?: ClassificationItem[];
  
  // 3. Flag Capture Config
  totalRounds?: number;
  runDurationSeconds?: number;
  pointsPerCapture?: number;
  penaltyPerWrong?: number;
  
  // 4. Sack Race Config
  trackLength?: number; // e.g. 6, 8, 10 steps to finish line
  stepPerCorrect?: number;
  penaltyStepsWrong?: number; // 0: đứng yên, 1: lùi 1 bước
  bonusCheckpoints?: boolean;

  // 5. Snail Word Search Config
  wordSearchList?: string[];
  gridSize?: number; // e.g. 8, 10, 12
  wordDifficulty?: 'easy' | 'medium' | 'hard';
  wordDirections?: ('ltr' | 'rtl' | 'ttb' | 'btt' | 'diag')[];

  // 6. Mine Boom (Dò Boom) Config
  mineRows?: number; // 3, 4, 5
  mineCols?: number; // 3, 4, 5, 6
  mineCount?: number; // 2, 3, 4, 5...
  mineMinScore?: number; // e.g. 10
  mineMaxScore?: number; // e.g. 100
  minePenalty?: number; // e.g. 20
  mineMaxBoomsToLose?: number; // e.g. 3 (3 BOOM = THUA)
  boomGridRows?: number;
  boomGridCols?: number;
  boomCount?: number;
  boomMaxToLose?: number;
  boomPenalty?: number;

  // 7. Gold Miner (Đào Vàng) Config
  goldCount?: number; // e.g. 5
  rockCount?: number; // e.g. 3
  hasSecretBag?: boolean; // true / false
  secretBagGoldRate?: number; // e.g. 70 (70% vàng, 30% đá)
  goldMinScore?: number; // e.g. 10
  goldMaxScore?: number; // e.g. 100
  rockPenalty?: number; // e.g. 15
  hookSpeed?: 'slow' | 'medium' | 'fast';
  totalMiningTurns?: number;

  // 8. Bear Passing (Truyền Gấu) Config
  bearStudentsList?: string[];
  bearMusicFiles?: { id: string; name: string; url: string }[];
  bearMusicMode?: 'order' | 'random';
  bearMinDuration?: number; // e.g. 10s
  bearMaxDuration?: number; // e.g. 25s
  bearTotalRounds?: number; // e.g. 5, 10

  // 9. Letter Arrange (Sắp Xếp Chữ Cái) Config
  letterSource?: 'custom' | 'bank';
  letterWordsList?: string[];
  letterShowHint?: boolean;
  letterShowSpace?: boolean;
  letterShuffleDifficulty?: 'easy' | 'medium' | 'hard';
  letterPenaltyWrong?: boolean;

  // 10. Apple Pick (Hái Táo - Ông Smith) Config
  appleTargetCount?: number; // e.g. 6 (default)
  appleBoardTiles?: number; // e.g. 36 (default)
  appleSmithSecretNumber?: number; // 2, 3, 4, 5, 6 or 0 for random
  appleSmithSecretMode?: 'random' | 'manual';
  appleDiceSides?: number; // default 6
  appleShowSmithSecret?: boolean; // allow teacher to view secret in panel

  // 11. Son Tinh - Thuy Tinh (Sơn Tinh – Thủy Tinh) Config
  stttFactionMode?: '2_factions' | 'free_for_all';
  stttTargetSinhLe?: number; // default 3 (Voi 9 ngà, Gà 9 cựa, Ngựa 9 hồng mao)
  stttBoardSize?: 'small' | 'standard' | 'large';
  stttMaxRounds?: number; // default 10
  stttEnableMagicSkills?: boolean; // default true
  stttWaterLevelIncrement?: boolean; // default true

  // 12. Monopoly (Cờ Tỷ Phú) Config
  monopolyStartingMoney?: number; // default 1500
  monopolySalaryAmount?: number; // default 200
  monopolyWinCondition?: 'bankruptcy' | 'time_limit' | 'target_wealth'; // default 'bankruptcy'
  monopolyTargetWealth?: number; // default 3000
  monopolyBoardTheme?: 'vietnam' | 'school' | 'science' | 'city' | 'fantasy';
  monopolyCustomTiles?: Array<{
    id: number;
    name: string;
    subtitle?: string;
    price?: number;
    baseRent?: number;
    upgradeCost?: number;
    groupName?: string;
    icon?: string;
  }>;

  // 13. Werewolf - Mystery Village (Ma Sói - Ngôi Làng Bí Ẩn) Config
  werewolfMaxNights?: number; // optional / legacy
  werewolfSkipQuestions?: boolean; // default false (nếu true: bỏ qua câu hỏi kiến thức, vào thẳng lượt vote)
  werewolfBaseGuessPoint?: number; // default 100
  werewolfGuessMultiplier?: number; // default 2 (1.5, 2, 3)
  werewolfGuessMode?: 'is_werewolf' | 'exact_role'; // default 'is_werewolf'
  werewolfGameMode?: 'score_hunt' | 'village_survival'; // default 'score_hunt'
  werewolfRolePreset?: 'standard' | 'balanced' | 'investigative' | 'custom';
  werewolfWolfCount?: number; // default 3
  werewolfAllowedRoles?: {
    seer: boolean;
    guard: boolean;
    witch: boolean;
    hunter: boolean;
  };
  werewolfDifficulty?: 'easy' | 'medium' | 'hard';
  werewolfRevealRoleOnDeath?: boolean; // default false
  werewolfEnablePublicClues?: boolean; // default true
  werewolfNpcCount?: number; // default 12

  // 14. Case Investigation (Hồ Sơ Vụ Án - Thám Tử Suy Luận) Config
  casePresetId?: string; // 'preset_lab' | 'preset_gallery' | 'preset_manor' | 'preset_theatre' | 'preset_train' | 'random'
  caseDifficulty?: 'easy' | 'medium' | 'hard';
  caseSkipQuestions?: boolean; // default false (nếu true: không cần trả lời câu hỏi, tập trung điều tra phá án)
  caseBaseScore?: number; // default 100
  caseGuessMultiplier?: number; // default 2 (thành công x2 điểm)
  caseMaxGuesses?: number; // default 2
  caseInvestigationMode?: 'shared_board' | 'independent_teams'; // default 'independent_teams'
  caseShowTruthOnEnd?: boolean;

  // 15. Tea Battle (Trận Chiến Trà / Battle Engine) Config
  teaBattleGameTitle?: string;
  teaBattleTheme?: 'tea' | 'cookie' | 'energy' | 'cat_fish' | 'castle' | 'forest' | 'space';
  teaBattleInitialHp?: number; // default 5 (3, 5, 10, 20, 50, 100)
  teaBattleWinCondition?: 'last_standing' | 'highest_score' | 'target_score' | 'target_damage';
  teaBattleTargetScore?: number;
  teaBattleActionMode?: 'manual' | 'random' | 'hybrid';
  teaBattleAllowedActions?: {
    attack: boolean;
    critical: boolean;
    heal: boolean;
    shield: boolean;
    bonus: boolean;
    steal: boolean;
    random: boolean;
  };
  teaBattleNormalDamage?: number;
  teaBattleCriticalDamage?: number;
  teaBattleRandomDamage?: boolean;
  teaBattleDamageRangeMin?: number;
  teaBattleDamageRangeMax?: number;
  teaBattleCorrectScore?: number;
  teaBattleCriticalScore?: number;
  teaBattleEnableCombo?: boolean;
  teaBattleEnableRandomEvents?: boolean;
  teaBattleEventFrequency?: 'off' | 'low' | 'medium' | 'high' | 'every_5_turns';
  teaBattleTargetMode?: 'manual' | 'random' | 'auto_highest_hp' | 'auto_lowest_hp';

  // 16. Bowling (Bowling Engine) Config
  bowlingGameTitle?: string;
  bowlingMode?: 'simple' | 'classic';
  bowlingDifficulty?: 'easy' | 'medium' | 'hard';
  bowlingLaneFriction?: number; // Friction coefficient multiplier e.g. 0.55 (slick/hard), 1.0 (medium), 1.45 (dry/easy)
  bowlingFrames?: number; // default 5, 10, or unlimited
  bowlingTwoRollsMode?: boolean;
  bowlingPlayerAim?: boolean;
  bowlingPlayerPower?: boolean;
  bowlingEnableSpin?: boolean;
  bowlingPointsPerPin?: number;
  bowlingSpecialPins?: boolean;
  bowlingSpecialPinVisibility?: 'visible' | 'secret';
  bowlingRandomPinSetup?: boolean;
  bowlingRandomEvents?: boolean;
  bowlingEventFrequency?: 'off' | 'low' | 'medium' | 'high';
  bowlingBonusQuestions?: boolean;

  // 17. Cuộc Đuổi Bắt (Chase / Race Engine) Config
  chaseGameTitle?: string;
  chaseBoardTiles?: number; // default 20 (10, 15, 20, 25, 30)
  chaseWinCondition?: 'first_to_finish' | 'catch_target' | 'highest_position' | 'score_and_position';
  chaseGameMode?: 'race' | 'chase' | 'team_vs_team';
  chaseMoveMode?: 'fixed' | 'random' | 'teacher_select' | 'bonus_gated';
  chaseMinMove?: number;
  chaseMaxMove?: number;
  chaseAllowedSpecialTiles?: {
    bonus: boolean;
    trap: boolean;
    boost: boolean;
    freeze: boolean;
    swap: boolean;
    random: boolean;
    obstacle: boolean;
  };
  chaseSpecialTileDensity?: 'off' | 'low' | 'medium' | 'high';
  chaseEnableStreak?: boolean;
  chaseEnableCatchUpBonus?: boolean;
  chaseEnableRandomEvents?: boolean;
  chaseEventFrequency?: 'off' | 'low' | 'medium' | 'high';
}

export interface AnswerLog {
  questionNumber?: number;
  questionId?: string;
  questionText?: string;
  questionContent?: string;
  selectedAnswer?: string;
  correctAnswer: string;
  teamId?: string;
  teamName?: string;
  isCorrect?: boolean;
  timestamp?: number | string;
}

export interface UserActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  displayName?: string | null;
  actionType: 'PLAY_GAME' | 'AI_GENERATE_QUESTIONS' | 'AI_GENERATE_IMAGE' | 'AI_GENERATE_PICTOGRAM' | 'AI_GENERATE_WHEEL' | 'SAVE_BANK' | 'LOGIN' | 'DELETE_BANK';
  details?: Record<string, any>;
  timestamp: string;
}

export interface GameSessionRecord {
  id: string;
  userId: string;
  userEmail: string;
  displayName?: string | null;
  gameId: string;
  gameTitle: string;
  questionsCount?: number;
  teamsCount?: number;
  mode?: string;
  timestamp: string;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  createdAt: string;
  lastLoginAt: string;
  isBlocked?: boolean;
  role?: 'admin' | 'user';
  totalPlays?: number;
  lastAction?: string;
}


export interface AiUsage {
  uid: string;
  email: string;
  displayName?: string | null;
  dailyUsed: number;
  dailyLimit: number;
  lastResetDate: string;
  lastUsedAt: string;
  totalUsed: number;
  createdAt: string;
  updatedAt: string;
  aiDisabled?: boolean;
}

export interface PoolKeyPublic {
  id: string;
  envName: string;
  number: number;
  masked: string;
  length: number;
  status: 'ACTIVE' | 'COOLDOWN' | 'INVALID';
  modelStatuses?: Record<string, { available: boolean; status: string; cooldownUntil?: number; remainingMinutes?: number }>;
}

export interface PoolCooldownItem {
  keyId: string;
  envName: string;
  masked: string;
  model: string;
  reason: string;
  category: string;
  cooldownUntil: number;
  remainingMinutes: number;
}

export interface PoolModelTier {
  tier: number;
  model: string;
  name: string;
  description: string;
  isLastUsed?: boolean;
}

export interface KeyPoolPublicState {
  success: boolean;
  totalKeysConfigured?: number;
  totalConfigured: number;
  usableKeysNow?: number;
  ignoredKeys?: any[];
  quarantinedKeys?: any[];
  keys: PoolKeyPublic[];
  stats: {
    totalRequests: number;
    totalSuccess: number;
    totalFail: number;
    rotate429Count: number;
    fallbackModelCount: number;
    fallbackKeyCount: number;
  };
  cooldowns: PoolCooldownItem[];
  modelPriority: PoolModelTier[];
  modelTiers?: PoolModelTier[];
  lastUsedModel?: string;
  error?: string;
}

export type ApiStatus =
  | 'UNCHECKED'
  | 'CHECKING'
  | 'ACTIVE'
  | 'WARNING'
  | 'RATE_LIMITED'
  | 'QUOTA_EXCEEDED'
  | 'INVALID'
  | 'ERROR'
  | 'DISABLED';

export interface GeminiApiConfig {
  id: string;
  name: string; // Tên hiển thị (ví dụ "API Dự phòng 1")
  email: string; // Gmail / tài khoản sở hữu
  apiKey: string; // Gemini API Key
  model: string; // Model mặc định (ví dụ "gemini-2.5-flash")
  notes?: string; // Ghi chú
  enabled: boolean; // Trạng thái bật / tắt
  status: ApiStatus; // Trạng thái kiểm tra
  lastCheckedAt?: string; // Thời điểm kiểm tra gần nhất
  lastUsedAt?: string; // Thời điểm sử dụng gần nhất
  responseTimeMs?: number; // Độ trễ phản hồi (ms)
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastError?: string; // Lỗi gần nhất nếu có
  createdAt: string;
  updatedAt: string;
}

export interface ApiUsageHistoryItem {
  id: string;
  timestamp: string;
  featureName: string; // Tên tính năng AI (ví dụ: "AI tạo câu hỏi", "AI phân tích tài liệu", "AI gợi ý cụm từ")
  apiId: string;
  apiName: string;
  apiEmail: string;
  model: string;
  status: 'SUCCESS' | 'ERROR';
  responseTimeMs?: number;
  error?: string;
}

export type AiMode = 'fast' | 'balanced' | 'smart';

export const ADMIN_EMAILS = [
  'hoangbang1310@gmail.com',
  'pthngan1310@gmail.com'
];


export const PRESET_AVATARS = [
  { id: 'lion', name: 'Sư Tử', emoji: '🦁', color: '#f59e0b' },
  { id: 'dragon', name: 'Rồng Thần', emoji: '🐲', color: '#ef4444' },
  { id: 'tiger', name: 'Hổ Báo', emoji: '🐯', color: '#ea580c' },
  { id: 'unicorn', name: 'Kỳ Lân', emoji: '🦄', color: '#ec4899' },
  { id: 'eagle', name: 'Đại Bàng', emoji: '🦅', color: '#3b82f6' },
  { id: 'bear', name: 'Gấu Bắp', emoji: '🐻', color: '#8b5cf6' },
  { id: 'fox', name: 'Cáo Mèo', emoji: '🦊', color: '#f97316' },
  { id: 'panda', name: 'Gấu Trúc', emoji: '🐼', color: '#10b981' },
];

export const PRESET_THEMES: { id: GameTheme; name: string; bgClass: string; cardClass: string; icon: string }[] = [
  { id: 'basic', name: 'Cơ Bản (Kẹo Ngọt)', bgClass: 'from-amber-50 via-sky-50 to-pink-50 text-slate-800', cardClass: 'bg-white/90 border-amber-200 shadow-sm', icon: '🎨' },
  { id: 'ocean', name: 'Đại Dương Mơ Màng', bgClass: 'from-sky-100 via-cyan-50 to-blue-100 text-slate-800', cardClass: 'bg-white/90 border-cyan-200 shadow-sm', icon: '🌊' },
  { id: 'detective', name: 'Sổ Tay Thám Tử', bgClass: 'from-amber-100 via-orange-50 to-yellow-100 text-slate-800', cardClass: 'bg-white/95 border-amber-200 shadow-sm', icon: '🔍' },
  { id: 'cowboy', name: 'Thảo Nguyên Nắng', bgClass: 'from-orange-100 via-amber-50 to-yellow-50 text-slate-800', cardClass: 'bg-white/95 border-orange-200 shadow-sm', icon: '🤠' },
  { id: 'cloud', name: 'Mây Mộng Mơ', bgClass: 'from-pink-100 via-purple-50 to-indigo-100 text-slate-800', cardClass: 'bg-white/95 border-pink-200 shadow-sm', icon: '☁️' },
  { id: 'note', name: 'Sổ Tay Pastel', bgClass: 'from-yellow-100 via-amber-50 to-emerald-50 text-slate-800', cardClass: 'bg-white/95 border-amber-200 shadow-sm', icon: '📝' },
  { id: 'rainbow', name: 'Cầu Vồng Pastel', bgClass: 'from-purple-100 via-pink-100 to-rose-100 text-slate-800', cardClass: 'bg-white/95 border-pink-200 shadow-sm', icon: '🌈' },
  { id: 'galaxy', name: 'Vũ Trụ Huyền Diệu', bgClass: 'from-indigo-100 via-violet-100 to-purple-100 text-slate-800', cardClass: 'bg-white/95 border-purple-200 shadow-sm', icon: '🌌' },
  { id: 'forest', name: 'Khu Rừng Thơ Mộng', bgClass: 'from-emerald-100 via-teal-50 to-green-100 text-slate-800', cardClass: 'bg-white/95 border-emerald-200 shadow-sm', icon: '🌲' },
];

export interface WebConfig {
  siteTitle: string;
  siteSubtitle: string;
  bgImageUrl: string;
  announcement: string;
  primaryTheme: 'pastel' | 'brightclassroom' | 'deepspace' | 'matcha' | 'sakura' | 'sky' | 'mono';
  gameAvatars?: Record<string, string>;
}

