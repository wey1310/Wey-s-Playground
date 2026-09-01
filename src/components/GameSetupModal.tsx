import { apiManager } from "../services/apiManager";
import { fetchWithAuth } from '../utils/api';
import { safeAlert, safeConfirm } from "../utils/safeAlert";
import React, { useState, useRef } from 'react';
import { X, Play, Users, Clock, Palette, Database, Hash, Sparkles, BookOpen, HelpCircle, FileSpreadsheet, Moon, Shield, Eye, Settings2, RefreshCw, MapPin, Check } from 'lucide-react';
import { type GameId, type GameSetupConfig, type GameMode, type GameTheme, type QuestionBank, PRESET_AVATARS, PRESET_THEMES, type Team } from "../types";
import { StudentImportButton } from "./StudentImportButton";

interface GameSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: GameId;
  gameTitle: string;
  gameIcon: string;
  gameDescription: string;
  availableThemes?: GameTheme[];
  banks: QuestionBank[];
  activeBankId: string;
  onStartGame: (config: GameSetupConfig) => void;
  onOpenQuickGuide?: (gameId: GameId) => void;
}

export const GameSetupModal: React.FC<GameSetupModalProps> = ({
  isOpen,
  onClose,
  gameId,
  gameTitle,
  gameIcon,
  gameDescription,
  availableThemes = ['basic', 'ocean', 'detective', 'cowboy', 'cloud', 'note', 'rainbow', 'galaxy', 'forest'],
  banks = [],
  activeBankId,
  onStartGame,
  onOpenQuickGuide,
}) => {
  const [mode, setMode] = useState<GameMode>('bank');
  const [selectedBankId, setSelectedBankId] = useState<string>(() => {
    if (gameId === 'pictogram') {
      const picBank = (banks || []).find(b => b.id === 'bank_nhin_hinh_doan_chu');
      if (picBank) return picBank.id;
    }
    return activeBankId || (banks[0]?.id ?? '');
  });
  const [totalQuestionsNumber, setTotalQuestionsNumber] = useState<number>(10);

  // Team settings
  const isTwoTeamGame = gameId === 'caro' || gameId === 'chess' || gameId === 'tug_of_war' || gameId === 'tugofwar';
  const [teamMode, setTeamMode] = useState<boolean>(true);
  const [teamCount, setTeamCount] = useState<number>(2);
  const [teamData, setTeamCountData] = useState<Team[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem(`wey_teams_${gameId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setTeamCountData(parsed);
          setTeamCount(parsed.length);
          return;
        }
      } catch {}

      if (gameId === 'caro') {
        setTeamCountData([
          { id: 'team_1', name: 'Đội X (Đỏ)', avatar: '🐉', color: '#ef4444', score: 0 },
          { id: 'team_2', name: 'Đội O (Xanh)', avatar: '🦅', color: '#3b82f6', score: 0 },
        ]);
        setTeamCount(2);
      } else if (gameId === 'chess') {
        setTeamCountData([
          { id: 'team_1', name: 'Đội Trắng (White)', avatar: '⚪', color: '#f8fafc', score: 0 },
          { id: 'team_2', name: 'Đội Đen (Black)', avatar: '⚫', color: '#1e293b', score: 0 },
        ]);
        setTeamCount(2);
      } else {
        setTeamCountData([
          { id: 'team_1', name: 'Đội Đỏ', avatar: '🐉', color: '#ef4444', score: 0 },
          { id: 'team_2', name: 'Đội Xanh', avatar: '🦅', color: '#3b82f6', score: 0 },
          { id: 'team_3', name: 'Đội Vàng', avatar: '🦁', color: '#f59e0b', score: 0 },
          { id: 'team_4', name: 'Đội Lục', avatar: '🐼', color: '#10b981', score: 0 },
        ]);
        setTeamCount(2);
      }
    }
  }, [gameId, isOpen]);

  // Timer settings
  const [timerEnabled, setTimerEnabled] = useState<boolean>(true);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number>(30);

  // Theme settings
  const [theme, setTheme] = useState<GameTheme>(availableThemes[0] || 'basic');

  // Race Game Vehicle Theme Selector
  const [raceVehicleType, setRaceVehicleType] = useState<'moto' | 'car' | 'snail' | 'space' | 'horse' | 'doramini'>('moto');

  // Magic Wheel Specific Setup States
  const [wheelPlayMode, setWheelPlayMode] = useState<1 | 2 | 3>(1);
  const [wheelLetterMode, setWheelLetterMode] = useState<'accent' | 'no-accent'>('accent');
  const [wheelPointsPerLetter, setWheelPointsPerLetter] = useState<number>(100);
  const [wheelCustomPhrasesText, setWheelCustomPhrasesText] = useState<string>(`NĂNG LƯỢNG MẶT TRỜI
QUANG HỢP Ở THỰC VẬT
HỆ TUẦN HOÀN NGƯỜI`);
  
  // Custom Topics Storage
  const [savedTopics, setSavedTopics] = useState<{id: string, name: string, phrases: string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('wey_saved_topics') || '[]'); } catch { return []; }
  });
  const handleSaveTopic = () => {
    if (!wheelTopicInput.trim() || !wheelCustomPhrasesText.trim()) {
      safeAlert('Vui lòng nhập tên chủ đề và danh sách cụm từ trước khi lưu!');
      return;
    }
    const newTopic = { id: `topic_${Date.now()}`, name: wheelTopicInput.trim(), phrases: wheelCustomPhrasesText.trim() };
    const newTopics = [...savedTopics, newTopic];
    setSavedTopics(newTopics);
    localStorage.setItem('wey_saved_topics', JSON.stringify(newTopics));
    safeAlert('Đã lưu chủ đề vào kho!');
  };
  const handleLoadTopic = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) return;
    const t = savedTopics.find(x => x.id === id);
    if (t) {
      setWheelTopicInput(t.name);
      setWheelCustomPhrasesText(t.phrases);
    }
  };
  const [wheelTopicInput, setWheelTopicInput] = useState<string>('Môi trường & Khoa học');

  // Random Call / Egg Call / Lucky Star states
  const isRandomCallGame = gameId === 'randomcall' || gameId === 'eggcall' || gameId === 'lucky_star' || gameId === 'luckystar';
  const [randomCallStudentsText, setRandomCallStudentsText] = useState<string>(() => {
    try {
      const savedLucky = localStorage.getItem('luckyStarStudents');
      if (savedLucky && (gameId === 'lucky_star' || gameId === 'luckystar')) {
        const parsed = JSON.parse(savedLucky);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: any) => typeof s === 'string' ? s : s.name).join('\n');
        }
      }
      return localStorage.getItem('wey_randomcall_students') || `Nguyễn Văn An\nTrần Thị Bình\nLê Hoàng Cường\nPhạm Minh Dũng\nHoàng Gia Em\nVũ Thùy Linh\nĐỗ Quang Minh\nBùi Hải Nam\nĐặng Phương Nga\nTrương Quốc Phong`;
    } catch {
      return `Nguyễn Văn An\nTrần Thị Bình\nLê Hoàng Cường\nPhạm Minh Dũng\nHoàng Gia Em\nVũ Thùy Linh\nĐỗ Quang Minh\nBùi Hải Nam\nĐặng Phương Nga\nTrương Quốc Phong`;
    }
  });
  const [noRepeatStudents, setNoRepeatStudents] = useState<boolean>(true);
  const [randomCallSkipQuestions, setRandomCallSkipQuestions] = useState<boolean>(() => {
    try {
      return localStorage.getItem('wey_randomcall_skip_questions') === 'true';
    } catch {
      return false;
    }
  });

  // 1. Whack-a-Mole Setup States
  const isWhackAMole = gameId === 'whack_a_mole' || gameId === 'whackamole';
  const [whackHoleCount, setWhackHoleCount] = useState<number>(9);
  const [whackMoleSpeed, setWhackMoleSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [whackHasTrap, setWhackHasTrap] = useState<boolean>(true);

  // 2. Classification Setup States
  const isClassification = gameId === 'classification';
  const [classificationCategories, setClassificationCategories] = useState<{ id: string; name: string; color: string; icon: string }[]>([
    { id: 'cat_1', name: 'Động Vật Có Xương Sống', color: '#E08283', icon: '🦁' },
    { id: 'cat_2', name: 'Động Vật Không Xương Sống', color: '#3B82F6', icon: '🐙' },
  ]);
  const [classificationItemsText, setClassificationItemsText] = useState<string>(`Chó Corgi: 1
Cá Heo: 1
Bạch Tuộc: 2
Chim Bồ Câu: 1
Con Sứa Biển: 2
Con Ong Mật: 2
Ếch Cây: 1
Ốc Sên Vườn: 2`);

  // 3. Flag Capture Setup States
  const isFlagCapture = gameId === 'flag_capture' || gameId === 'flagcapture';
  const [flagRounds, setFlagRounds] = useState<number>(8);
  const [flagPointsCapture, setFlagPointsCapture] = useState<number>(15);

  // 4. Sack Race Setup States
  const isSackRace = gameId === 'sack_race' || gameId === 'sackrace';
  const [sackTrackLength, setSackTrackLength] = useState<number>(7);
  const [sackStepPerCorrect, setSackStepPerCorrect] = useState<number>(1);
  const [sackPenaltyWrong, setSackPenaltyWrong] = useState<number>(0);

  // 5. Snail Word Search Setup States
  const isSnailWordSearch = gameId === 'snail_word_search' || gameId === 'snail_words';
  const [snailWordsText, setSnailWordsText] = useState<string>(`QUANG HỢP
HÔ HẤP
DIỆP LỤC
KHÍ KHỔNG
OXYGEN
MÔI TRƯỜNG
SINH HỌC`);
  const [snailGridSize, setSnailGridSize] = useState<number>(10);
  const [snailDifficulty, setSnailDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // 6. Mine Boom (Dò Boom) Setup States
  const isMineBoom = gameId === 'mine_boom' || gameId === 'mineboom' || gameId === 'doboom';
  const [boomGridRows, setBoomGridRows] = useState<number>(4);
  const [boomGridCols, setBoomGridCols] = useState<number>(5);
  const [boomCount, setBoomCount] = useState<number>(4);
  const [boomMaxToLose, setBoomMaxToLose] = useState<number>(3);
  const [boomPenalty, setBoomPenalty] = useState<number>(15);

  // 7. Gold Miner (Đào Vàng) Setup States
  const isGoldMiner = gameId === 'gold_miner' || gameId === 'goldminer' || gameId === 'daovang';
  const [minerGoldCount, setMinerGoldCount] = useState<number>(5);
  const [minerRockCount, setMinerRockCount] = useState<number>(3);
  const [minerHasSecretBag, setMinerHasSecretBag] = useState<boolean>(true);
  const [minerHookSpeed, setMinerHookSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');

  // 8. Bear Passing (Truyền Gấu) Setup States
  const isBearPassing = gameId === 'bear_pass' || gameId === 'bearpass' || gameId === 'truyengau';
  const [bearStudentsText, setBearStudentsText] = useState<string>(() => {
    try {
      return localStorage.getItem('wey_saved_students_list') || `Nguyễn Văn An\nTrần Thị Bình\nLê Hoàng Cường\nPhạm Minh Dũng\nHoàng Gia Em\nVũ Thùy Linh\nĐỗ Quang Minh\nBùi Hải Nam\nĐặng Phương Nga\nTrương Quốc Phong\nNgô Gia Bảo\nĐinh Khánh Huyền\nLâm Tuấn Kiệt\nVõ Mai Phương\nHồ Đức Trí`;
    } catch {
      return `Nguyễn Văn An\nTrần Thị Bình\nLê Hoàng Cường\nPhạm Minh Dũng\nHoàng Gia Em\nVũ Thùy Linh\nĐỗ Quang Minh\nBùi Hải Nam\nĐặng Phương Nga\nTrương Quốc Phong\nNgô Gia Bảo\nĐinh Khánh Huyền\nLâm Tuấn Kiệt\nVõ Mai Phương\nHồ Đức Trí`;
    }
  });
  const [bearMusicMode, setBearMusicMode] = useState<'order' | 'random'>('random');

  // 9. Letter Arrange (Sắp Xếp Chữ Cái) Setup States
  const isLetterArrange = gameId === 'letter_arrange' || gameId === 'letterarrange' || gameId === 'sapxepchu';
  const [letterWordsText, setLetterWordsText] = useState<string>(`MẶT TRỜI
QUANG HỢP
HỆ SINH THÁI
TAM GIÁC ĐỀU
CHÂN LÝ
ĐỘNG NĂNG`);
  const [letterShowHint, setLetterShowHint] = useState<boolean>(true);
  const [letterShowSpace, setLetterShowSpace] = useState<boolean>(true);
  const [letterPenaltyWrong, setLetterPenaltyWrong] = useState<boolean>(false);

  // 10. Apple Pick (Hái Táo - Ông Smith) Setup States
  const isApplePick = gameId === 'apple_pick' || gameId === 'applepick' || gameId === 'haitao';
  const [appleBoardTiles, setAppleBoardTiles] = useState<number>(36);
  const [appleTargetCount, setAppleTargetCount] = useState<number>(6);
  const [appleSmithSecretMode, setAppleSmithSecretMode] = useState<'random' | 'manual'>('random');
  const [appleSmithSecretNumber, setAppleSmithSecretNumber] = useState<number>(3);
  const [appleShowSmithSecret, setAppleShowSmithSecret] = useState<boolean>(false);

  // 11. Son Tinh - Thuy Tinh Setup States
  const isSonTinhThuyTinh = gameId === 'son_tinh_thuy_tinh' || gameId === 'sontinhthuytinh' || gameId === 'sontinh_thuytinh';
  const [stttFactionMode, setStttFactionMode] = useState<'2_factions' | 'free_for_all'>('2_factions');
  const [stttMaxRounds, setStttMaxRounds] = useState<number>(10);
  const [stttTargetSinhLe, setStttTargetSinhLe] = useState<number>(3);

  // 12. Monopoly (Cờ Tỷ Phú) Setup States
  const isMonopoly = gameId === 'monopoly' || gameId === 'cotyphu' || gameId === 'co_ty_phu';
  const [monopolyStartingMoney, setMonopolyStartingMoney] = useState<number>(1500);
  const [monopolySalaryAmount, setMonopolySalaryAmount] = useState<number>(200);
  const [monopolyWinCondition, setMonopolyWinCondition] = useState<'bankruptcy' | 'time_limit' | 'target_wealth'>('bankruptcy');
  const [monopolyTargetWealth, setMonopolyTargetWealth] = useState<number>(3000);
  const [monopolyBoardTheme, setMonopolyBoardTheme] = useState<'vietnam' | 'school' | 'science' | 'city' | 'fantasy'>('vietnam');
  const [monopolyActiveTab, setMonopolyActiveTab] = useState<'general' | 'tiles'>('general');
  const [monopolyCustomTiles, setMonopolyCustomTiles] = useState<Array<{
    id: number;
    name: string;
    subtitle?: string;
    price?: number;
    baseRent?: number;
    upgradeCost?: number;
    groupName?: string;
    icon?: string;
  }>>([
    { id: 1, name: 'Cần Thơ', subtitle: 'Bến Ninh Kiều & Chợ Nổi', price: 100, baseRent: 15, groupName: 'Miền Tây Nam Bộ', icon: '⛵' },
    { id: 2, name: 'Phú Quốc', subtitle: 'Đảo Ngọc Thiên Đường', price: 120, baseRent: 20, groupName: 'Miền Tây Nam Bộ', icon: '🏝️' },
    { id: 4, name: 'Vũng Tàu', subtitle: 'Bãi Sau & Mũi Nghinh Phong', price: 140, baseRent: 25, groupName: 'Đông Nam Bộ', icon: '🌊' },
    { id: 5, name: 'TP. Hồ Chí Minh', subtitle: 'Chợ Bến Thành & Landmark 81', price: 160, baseRent: 30, groupName: 'Đông Nam Bộ', icon: '🏙️' },
    { id: 7, name: 'Đà Lạt', subtitle: 'Hồ Xuân Hương & Ngàn Hoa', price: 180, baseRent: 35, groupName: 'Tây Nguyên & Nam Trung Bộ', icon: '🌲' },
    { id: 8, name: 'Nha Trang', subtitle: 'Tháp Bà Ponagar & Vịnh Biển', price: 200, baseRent: 40, groupName: 'Tây Nguyên & Nam Trung Bộ', icon: '🏖️' },
    { id: 9, name: 'Quy Nhơn', subtitle: 'Eo Gió & Kỳ Co Tuyệt Đẹp', price: 220, baseRent: 45, groupName: 'Tây Nguyên & Nam Trung Bộ', icon: '🌅' },
    { id: 11, name: 'Quảng Bình', subtitle: 'Hang Sơn Đoòng & Phong Nha', price: 240, baseRent: 50, groupName: 'Di Sản Miền Trung', icon: '⛰️' },
    { id: 13, name: 'Cố Đô Huế', subtitle: 'Đại Nội & Chùa Thiên Mụ', price: 260, baseRent: 55, groupName: 'Di Sản Miền Trung', icon: '🏯' },
    { id: 14, name: 'Phố Cổ Hội An', subtitle: 'Chùa Cầu & Đèn Lồng Cổ', price: 280, baseRent: 60, groupName: 'Di Sản Miền Trung', icon: '🏮' },
    { id: 16, name: 'Đà Nẵng', subtitle: 'Cầu Rồng & Bà Nà Hills', price: 300, baseRent: 65, groupName: 'Đô Thị Đáng Sống', icon: '🌉' },
    { id: 17, name: 'Hải Phòng', subtitle: 'Hoa Phượng Đỏ & Quần Đảo Cát Bà', price: 320, baseRent: 70, groupName: 'Đô Thị Đáng Sống', icon: '⚓' },
    { id: 19, name: 'Sa Pa', subtitle: 'Đỉnh Fansipan Nóc Nhà Đông Dương', price: 340, baseRent: 75, groupName: 'Kỳ Quan Bắc Bộ', icon: '🏔️' },
    { id: 20, name: 'Vịnh Hạ Long', subtitle: 'Kỳ Quan Thiên Nhiên Thế Giới', price: 360, baseRent: 80, groupName: 'Kỳ Quan Bắc Bộ', icon: '⛵' },
    { id: 22, name: 'Hà Nội - Hồ Gươm', subtitle: 'Tháp Rùa & 36 Phố Phường', price: 380, baseRent: 85, groupName: 'Thủ Đô Ngàn Năm Văn Hiến', icon: '🐢' },
    { id: 23, name: 'Hà Nội - Ba Đình', subtitle: 'Quảng Trường & Văn Miếu', price: 400, baseRent: 90, groupName: 'Thủ Đô Ngàn Năm Văn Hiến', icon: '⭐' },
  ]);

  // 13. Werewolf (Ma Sói - Ngôi Làng Bí Ẩn) Setup States
  const isWerewolf = gameId === 'werewolf_village' || gameId === 'masoi' || gameId === 'werewolf' || gameId === 'ma_soi';
  const [werewolfSkipQuestions, setWerewolfSkipQuestions] = useState<boolean>(false);
  const [werewolfWolfCount, setWerewolfWolfCount] = useState<number>(3);
  const [werewolfRolePreset, setWerewolfRolePreset] = useState<'standard' | 'balanced' | 'investigative' | 'custom'>('standard');
  const [werewolfAllowedRoles, setWerewolfAllowedRoles] = useState<{
    seer: boolean;
    guard: boolean;
    witch: boolean;
    hunter: boolean;
  }>({
    seer: true,
    guard: true,
    witch: true,
    hunter: true,
  });
  const [werewolfBaseGuessPoint, setWerewolfBaseGuessPoint] = useState<number>(100);
  const [werewolfGuessMultiplier, setWerewolfGuessMultiplier] = useState<number>(2);
  const [werewolfGuessMode, setWerewolfGuessMode] = useState<'is_werewolf' | 'exact_role'>('is_werewolf');
  const [werewolfGameMode, setWerewolfGameMode] = useState<'score_hunt' | 'village_survival'>('score_hunt');
  const [werewolfDifficulty, setWerewolfDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [werewolfRevealRoleOnDeath, setWerewolfRevealRoleOnDeath] = useState<boolean>(false);
  const [werewolfEnablePublicClues, setWerewolfEnablePublicClues] = useState<boolean>(true);

  // 14. Case Investigation (Hồ Sơ Vụ Án) Setup States
  const isCaseInvestigation = gameId === 'case_investigation' || gameId === 'case_mystery' || gameId === 'hosovuan';
  const [casePresetId, setCasePresetId] = useState<string>('case_lab_poison');
  const [caseDifficulty, setCaseDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [caseMaxGuesses, setCaseMaxGuesses] = useState<number>(2);
  const [caseShowTruthOnEnd, setCaseShowTruthOnEnd] = useState<boolean>(true);

  // 15. Tea Battle (Trận Chiến Trà) Setup States
  const isTeaBattle = gameId === 'tea_battle' || gameId === 'teabattle' || gameId === 'tranchientra';
  const [teaBattleTheme, setTeaBattleTheme] = useState<'tea' | 'cookie' | 'energy' | 'cat_fish' | 'castle' | 'forest' | 'space'>('tea');
  const [teaBattleInitialHp, setTeaBattleInitialHp] = useState<number>(5);
  const [teaBattleActionMode, setTeaBattleActionMode] = useState<'manual' | 'random' | 'hybrid'>('manual');
  const [teaBattleWinCondition, setTeaBattleWinCondition] = useState<'last_standing' | 'highest_score'>('last_standing');

  // 16. Bowling Setup States
  const isBowling = gameId === 'bowling' || gameId === 'bowling_game';
  const [bowlingFrames, setBowlingFrames] = useState<number>(5);
  const [bowlingSpecialPins, setBowlingSpecialPins] = useState<boolean>(true);
  const [bowlingEnableSpin, setBowlingEnableSpin] = useState<boolean>(true);
  const [bowlingDifficulty, setBowlingDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [bowlingLaneFriction, setBowlingLaneFriction] = useState<number>(1.0);

  // Persistence Indicator State
  const [savedIndicator, setSavedIndicator] = useState<'randomCall' | 'bear' | null>(null);
  const txtCsvInputRef = useRef<HTMLInputElement>(null);
  const bearTxtCsvInputRef = useRef<HTMLInputElement>(null);

  const handleImportTxtCsv = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void, storageKey: string, indicatorKey: 'randomCall' | 'bear') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        // Simple processing: filter out completely empty lines if desired, or just take raw text
        const cleaned = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0).join('\n');
        setter(cleaned);
        
        // Handle differences in how we save arrays vs strings
        if (storageKey === 'wey_saved_students_list') {
           localStorage.setItem(storageKey, JSON.stringify(cleaned.split('\n')));
        } else {
           localStorage.setItem(storageKey, cleaned);
        }
        
        setSavedIndicator(indicatorKey);
        setTimeout(() => setSavedIndicator(null), 2500);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 17. Chase (Cuộc Đuổi Bắt) Setup States
  const isChase = gameId === 'chase' || gameId === 'chase_race' || gameId === 'cuocduoibat';
  const [chaseBoardTiles, setChaseBoardTiles] = useState<number>(20);
  const [chaseSpecialTileDensity, setChaseSpecialTileDensity] = useState<'off' | 'low' | 'medium' | 'high'>('medium');

  if (!isOpen) return null;

  const handleTeamCountChange = (count: number) => {
    setTeamCount(count);
    const updated = [...teamData];
    while (updated.length < count) {
      const idx = updated.length;
      const avatarPreset = PRESET_AVATARS[idx % PRESET_AVATARS.length];
      updated.push({
        id: `team_${idx + 1}`,
        name: `Đội ${idx + 1}`,
        avatar: avatarPreset.emoji,
        color: avatarPreset.color,
        score: 0,
      });
    }
    setTeamCountData(updated.slice(0, count));
  };

  const handleUpdateTeamName = (index: number, name: string) => {
    const updated = [...teamData];
    updated[index].name = name;
    setTeamCountData(updated);
  };

  const handleUpdateTeamAvatar = (index: number, avatar: string, color: string) => {
    const updated = [...teamData];
    updated[index].avatar = avatar;
    updated[index].color = color;
    setTeamCountData(updated);
  };

  const handleLaunch = () => {
    if (teamMode) {
      localStorage.setItem(`wey_teams_${gameId}`, JSON.stringify(teamData.slice(0, teamCount)));
    }

    if (gameId === 'randomcall' || gameId === 'eggcall') {
      const parsedStudents = randomCallStudentsText
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const studentsToUse = parsedStudents.length > 0 ? parsedStudents : [
        'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Hoàng Cường', 'Phạm Minh Dũng', 'Hoàng Gia Em'
      ];

      try {
        localStorage.setItem('wey_randomcall_students', randomCallStudentsText);
      } catch {}

      const selectedBank = (banks || []).find(b => b.id === (selectedBankId || activeBankId));

      const randomCallConfig: GameSetupConfig = {
        gameId,
        mode: 'bank',
        selectedBankId: selectedBankId || activeBankId,
        totalQuestionsNumber: (selectedBank?.questions || []).length || 10,
        teamMode: false,
        teams: studentsToUse.map((name, i) => ({
          id: `student_${i + 1}`,
          name,
          avatar: '🎓',
          color: '#3b82f6',
          score: 0,
        })),
        studentsList: studentsToUse,
        noRepeatStudents,
        timerEnabled,
        timeLimitSeconds,
        theme,
      };

      onStartGame(randomCallConfig);
      onClose();
      return;
    }

    if (gameId === 'magicwheel' || gameId === 'magic_wheel') {
      const selectedBank = (banks || []).find(b => b.id === (selectedBankId || activeBankId));
      if (wheelPlayMode === 1 && selectedBank && (selectedBank.questions || []).length === 0) {
        safeAlert('Ngân hàng câu hỏi này đang trống! Vui lòng chọn ngân hàng khác hoặc nạp câu hỏi.');
        return;
      }

      const parsedPhrases = wheelCustomPhrasesText
        .split('\n')
        .map(l => l.trim().toUpperCase())
        .filter(l => l.length > 0);

      const phrasesToUse = parsedPhrases.length > 0
        ? parsedPhrases
        : ['NĂNG LƯỢNG MẶT TRỜI', 'QUANG HỢP Ở THỰC VẬT', 'HỆ TUẦN HOÀN NGƯỜI'];

      const magicWheelConfig: GameSetupConfig = {
        gameId,
        mode: wheelPlayMode === 1 ? 'bank' : 'custom',
        playMode: wheelPlayMode,
        selectedBankId: wheelPlayMode === 1 ? (selectedBankId || activeBankId) : undefined,
        totalQuestionsNumber: wheelPlayMode === 1 ? ((selectedBank?.questions || []).length || 10) : phrasesToUse.length,
        pointsPerLetter: wheelPointsPerLetter,
        letterMode: wheelLetterMode,
        customPhrases: phrasesToUse,
        randomEnabled: wheelPlayMode !== 3,
        teamMode,
        teams: teamMode ? teamData.slice(0, teamCount) : [
          { id: 'solo', name: 'Học Sinh', avatar: '🎓', color: '#3b82f6', score: 0 }
        ],
        timerEnabled,
        timeLimitSeconds,
        theme,
      };

      onStartGame(magicWheelConfig);
      onClose();
      return;
    }

    const selectedBank = (banks || []).find(b => b.id === (selectedBankId || activeBankId));
    if (mode === 'bank' && selectedBank && (selectedBank.questions || []).length === 0) {
      safeAlert('Ngân hàng câu hỏi này đang trống! Vui lòng chọn ngân hàng khác hoặc nạp câu hỏi.');
      return;
    }

    // Classification Items parser
    const parsedClassificationItems = classificationItemsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((line, idx) => {
        const parts = line.split(':');
        const content = parts[0]?.trim() || `Mục ${idx + 1}`;
        const catNum = parseInt(parts[1]?.trim() || '1', 10);
        const targetCat = classificationCategories[catNum - 1] || classificationCategories[0];
        return {
          id: `item_${idx + 1}`,
          content,
          categoryId: targetCat.id,
        };
      });

    // Snail Words parser
    const parsedSnailWords = snailWordsText
      .split('\n')
      .map(w => w.trim().toUpperCase())
      .filter(w => w.length > 0);

    // Bear Students parser
    const parsedBearStudents = bearStudentsText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Letter words parser
    const parsedLetterWords = letterWordsText
      .split('\n')
      .map(w => w.trim().toUpperCase())
      .filter(w => w.length > 0);

    // Random Call / Lucky Star students parser
    const parsedRandomCallStudents = randomCallStudentsText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const config: GameSetupConfig = {
      gameId,
      mode: (isRandomCallGame && randomCallSkipQuestions) ? 'none' : mode,
      selectedBankId: (isRandomCallGame && randomCallSkipQuestions) ? undefined : (mode === 'bank' ? (selectedBankId || activeBankId) : undefined),
      totalQuestionsNumber: (isRandomCallGame && randomCallSkipQuestions) ? 0 : (mode === 'bank' ? ((selectedBank?.questions || []).length || 10) : totalQuestionsNumber),
      teamMode,
      teams: teamMode ? teamData.slice(0, teamCount) : [
        { id: 'solo', name: 'Học Sinh', avatar: '🎓', color: '#3b82f6', score: 0 }
      ],
      timerEnabled,
      timeLimitSeconds,
      theme,
      studentsList: isRandomCallGame ? parsedRandomCallStudents : (isBearPassing ? parsedBearStudents : undefined),
      raceVehicleType: gameId === 'race' ? raceVehicleType : undefined,
      randomCallSkipQuestions: isRandomCallGame ? randomCallSkipQuestions : undefined,
      skipQuestions: isRandomCallGame ? randomCallSkipQuestions : (gameId === 'werewolf' ? werewolfSkipQuestions : undefined),
      randomCallConfetti: isRandomCallGame ? (() => {
        try {
          const savedCfg = localStorage.getItem('wey_web_config');
          if (savedCfg) {
            const parsed = JSON.parse(savedCfg);
            if (typeof parsed.randomCallConfetti === 'boolean') return parsed.randomCallConfetti;
          }
          const localSetting = localStorage.getItem('wey_randomcall_confetti');
          if (localSetting !== null) return localSetting !== 'false';
        } catch {}
        return true;
      })() : undefined,
      confettiEnabled: isRandomCallGame ? (() => {
        try {
          const savedCfg = localStorage.getItem('wey_web_config');
          if (savedCfg) {
            const parsed = JSON.parse(savedCfg);
            if (typeof parsed.randomCallConfetti === 'boolean') return parsed.randomCallConfetti;
          }
          const localSetting = localStorage.getItem('wey_randomcall_confetti');
          if (localSetting !== null) return localSetting !== 'false';
        } catch {}
        return true;
      })() : undefined,

      // 1. Whack a mole
      holeCount: whackHoleCount,
      moleSpeed: whackMoleSpeed,
      hasTrapMoles: whackHasTrap,

      // 2. Classification
      classificationCategories,
      classificationItems: parsedClassificationItems,

      // 3. Flag capture
      totalRounds: flagRounds,
      pointsPerCapture: flagPointsCapture,

      // 4. Sack race
      trackLength: sackTrackLength,
      stepPerCorrect: sackStepPerCorrect,
      penaltyStepsWrong: sackPenaltyWrong,

      // 5. Snail word search
      wordSearchList: parsedSnailWords,
      gridSize: snailGridSize,
      wordDifficulty: snailDifficulty,

      // 6. Mine Boom
      boomGridRows,
      boomGridCols,
      boomCount,
      boomMaxToLose,
      boomPenalty,

      // 7. Gold Miner
      goldCount: minerGoldCount,
      rockCount: minerRockCount,
      hasSecretBag: minerHasSecretBag,
      hookSpeed: minerHookSpeed,

      // 8. Bear Passing
      bearStudentsList: parsedBearStudents,
      bearMusicMode,

      // 9. Letter Arrange
      letterWordsList: parsedLetterWords,
      letterShowHint,
      letterShowSpace,
      letterPenaltyWrong,

      // 10. Apple Pick (Hái Táo)
      appleBoardTiles,
      appleTargetCount,
      appleSmithSecretMode,
      appleSmithSecretNumber,
      appleShowSmithSecret,

      // 11. Son Tinh - Thuy Tinh
      stttFactionMode,
      stttMaxRounds,
      stttTargetSinhLe,

      // 12. Monopoly
      monopolyStartingMoney,
      monopolySalaryAmount,
      monopolyWinCondition,
      monopolyTargetWealth,
      monopolyBoardTheme,
      monopolyCustomTiles,

      // 13. Werewolf (Ma Sói)
      werewolfSkipQuestions,
      werewolfWolfCount,
      werewolfRolePreset,
      werewolfAllowedRoles,
      werewolfBaseGuessPoint,
      werewolfGuessMultiplier,
      werewolfGuessMode,
      werewolfGameMode,
      werewolfDifficulty,
      werewolfRevealRoleOnDeath,
      werewolfEnablePublicClues,
      werewolfNpcCount: 12,

      // 14. Case Investigation (Hồ Sơ Vụ Án)
      casePresetId,
      caseDifficulty,
      caseMaxGuesses,
      caseShowTruthOnEnd,

      // 15. Tea Battle (Trận Chiến Trà)
      teaBattleTheme,
      teaBattleInitialHp,
      teaBattleActionMode,
      teaBattleWinCondition,

      // 16. Bowling
      bowlingFrames,
      bowlingSpecialPins,
      bowlingEnableSpin,
      bowlingDifficulty,
      bowlingLaneFriction,

      // 17. Chase (Cuộc Đuổi Bắt)
      chaseBoardTiles,
      chaseSpecialTileDensity,
    };

    onStartGame(config);
    onClose();
  };

  const themesToDisplay = PRESET_THEMES.filter(t => availableThemes.includes(t.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-w-text-main/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-w-bg-card border border-w-border w-full max-w-2xl rounded-[22px] sm:rounded-[26px] shadow-[0_12px_36px_rgba(79,104,60,0.18)] overflow-hidden flex flex-col max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] my-auto wey-paper-card">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-w-bg-main border-b border-w-border flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{gameIcon}</span>
            <div>
              <h2 className="text-lg sm:text-xl font-[800] text-w-text-main flex items-center gap-2">
                <span>{gameTitle}</span>
                <span className="text-xs font-[800] text-w-primary-dark bg-w-accent-light px-2.5 py-0.5 rounded-full border border-w-accent-border">
                  Cấu Hình Setup
                </span>
              </h2>
              <p className="text-xs font-[600] text-w-text-muted">{gameDescription}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenQuickGuide && (
              <button
                type="button"
                onClick={() => onOpenQuickGuide(gameId)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-w-bg-card hover:bg-w-accent-light text-w-primary-dark text-xs font-bold rounded-xl border border-w-accent-border shadow-xs transition hover:-translate-y-0.5 cursor-pointer"
                title="Xem hướng dẫn và luật chơi"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Luật Chơi</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-[12px] text-w-text-muted hover:text-w-text-main hover:bg-w-bg-main transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isRandomCallGame ? (
            <div className="space-y-5">
              {/* 1. NGÂN HÀNG CÂU HỎI & CHẾ ĐỘ BỎ QUA CÂU HỎI */}
              <div className="space-y-3 bg-w-accent-light p-4 rounded-2xl border border-w-accent-border">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-w-text-main flex items-center gap-2">
                    <Database className="w-4 h-4 text-w-primary-dark" />
                    <span>1. Ngân Hàng Câu Hỏi (Bốc ngẫu nhiên)</span>
                  </label>

                  {/* Checkbox Chế độ bỏ qua câu hỏi */}
                  <label htmlFor="randomCallSkipQuestionsCheckbox" className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-w-accent-border cursor-pointer shadow-2xs hover:bg-amber-50/70 transition">
                    <input
                      type="checkbox"
                      id="randomCallSkipQuestionsCheckbox"
                      checked={randomCallSkipQuestions}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setRandomCallSkipQuestions(checked);
                        try {
                          localStorage.setItem('wey_randomcall_skip_questions', String(checked));
                        } catch {}
                      }}
                      className="w-4 h-4 rounded text-w-primary-dark accent-amber-600 focus:ring-w-primary-dark cursor-pointer"
                    />
                    <span className="text-xs font-black text-amber-900 flex items-center gap-1">
                      <span>⚡ Chế độ bỏ qua câu hỏi</span>
                    </span>
                  </label>
                </div>

                {randomCallSkipQuestions ? (
                  <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl text-xs font-medium text-amber-900 flex items-start gap-2.5 shadow-2xs">
                    <span className="text-lg leading-none">⚡</span>
                    <div className="space-y-1">
                      <p className="font-black text-amber-950">Đang kích hoạt: Chế độ bỏ qua câu hỏi (Chơi nhanh)</p>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Toàn bộ phần chọn ngân hàng câu hỏi và các tương tác bốc quiz đã được ẩn và vô hiệu hóa. Giáo viên sẽ gọi tên học sinh ngẫu nhiên trực tiếp và chấm điểm linh hoạt mà không bị gián đoạn bởi câu hỏi trắc nghiệm.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative space-y-1.5">
                    <div className="text-[11px] font-bold text-w-text-muted flex items-center justify-between">
                      <span>Chọn bộ câu hỏi cho trò chơi (nếu muốn bốc câu hỏi sau khi gọi tên):</span>
                    </div>
                    <select
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      className="w-full rounded-xl px-3 py-2 text-xs font-bold shadow-sm transition bg-white border border-w-accent-border text-slate-800 focus:outline-none focus:border-w-primary-dark cursor-pointer"
                    >
                      <optgroup label="📝 ÔN TẬP HỌC KÌ (KHTN 8)">
                        {(banks || []).filter(b => b.id.includes('on_tap')).map(b => (
                          <option key={b.id} value={b.id}>
                            ⭐ {b.name} ({(b.questions || []).length} câu)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="⚗️ CHƯƠNG I & II: HÓA HỌC (Bài 1 - 12)">
                        {(banks || []).filter(b => b.id.startsWith('bank_khtn8_b') && parseInt(b.id.replace('bank_khtn8_b', '')) <= 12).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({(b.questions || []).length} câu)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="⚙️ CHƯƠNG III - VI: VẬT LÝ (Bài 13 - 29)">
                        {(banks || []).filter(b => {
                          if (!b.id.startsWith('bank_khtn8_b')) return false;
                          const num = parseInt(b.id.replace('bank_khtn8_b', ''));
                          return num >= 13 && num <= 29;
                        }).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({(b.questions || []).length} câu)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🧬 CHƯƠNG VII & VIII: SINH HỌC & MÔI TRƯỜNG (Bài 30 - 47)">
                        {(banks || []).filter(b => {
                          if (!b.id.startsWith('bank_khtn8_b')) return false;
                          const num = parseInt(b.id.replace('bank_khtn8_b', ''));
                          return num >= 30 && num <= 47;
                        }).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({(b.questions || []).length} câu)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🎯 CÂU HỎI KHÁC / CỦA BẠN">
                        {(banks || []).filter(b => !b.id.startsWith('bank_khtn8')).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({(b.questions || []).length} câu)
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                )}
              </div>

              {/* 2. DANH SÁCH HỌC SINH */}
              <div className="space-y-3 bg-w-bg-card p-4 rounded-2xl border-2 border-w-accent-muted">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black uppercase tracking-wider text-w-text-main flex items-center gap-2">
                    <Users className="w-4 h-4 text-w-primary-dark" />
                    <span>2. Danh Sách Học Sinh (1 học sinh / 1 dòng)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-w-primary-dark bg-w-accent-light px-2.5 py-1 rounded-lg border border-w-accent-border">
                      Sĩ số: {randomCallStudentsText.split('\n').filter(s => s.trim()).length} HS
                    </span>
                  </div>
                </div>

                <textarea
                  value={randomCallStudentsText}
                  onChange={(e) => {
                    setRandomCallStudentsText(e.target.value);
                    localStorage.setItem('wey_randomcall_students', e.target.value);
                    setSavedIndicator('randomCall');
                    setTimeout(() => setSavedIndicator(null), 2500);
                  }}
                  placeholder="Nhập hoặc dán danh sách học sinh (mỗi học sinh trên 1 dòng)..."
                  className="w-full h-44 sm:h-48 p-3.5 bg-white border-2 border-w-accent-muted focus:border-w-primary-dark focus:ring-2 focus:ring-w-primary-dark/20 rounded-xl text-xs sm:text-sm font-semibold text-w-text-main outline-none resize-none custom-scrollbar shadow-inner relative"
                />

                <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StudentImportButton
                      onImport={(students) => {
                        if (students.length > 0) {
                          const val = students.join('\n');
                          setRandomCallStudentsText(val);
                          localStorage.setItem('wey_randomcall_students', val);
                          setSavedIndicator('randomCall');
                          setTimeout(() => setSavedIndicator(null), 2500);
                        }
                      }}
                      buttonText="Tải file Excel"
                    />
                    
                    <input 
                      type="file" 
                      accept=".txt,.csv" 
                      className="hidden" 
                      ref={txtCsvInputRef}
                      onChange={(e) => handleImportTxtCsv(e, setRandomCallStudentsText, 'wey_randomcall_students', 'randomCall')}
                    />
                    <button
                      type="button"
                      onClick={() => txtCsvInputRef.current?.click()}
                      className="px-3 py-1.5 bg-w-accent-light hover:bg-w-accent-muted text-w-primary-dark text-xs font-bold rounded-xl border border-w-accent-border transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>📄 Nhập .txt/.csv</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const sample = `Nguyễn Văn An\nTrần Thị Bình\nLê Hoàng Cường\nPhạm Minh Dũng\nHoàng Gia Em\nVũ Thùy Linh\nĐỗ Quang Minh\nBùi Hải Nam\nĐặng Phương Nga\nTrương Quốc Phong`;
                        setRandomCallStudentsText(sample);
                        localStorage.setItem('wey_randomcall_students', sample);
                      }}
                      className="px-3 py-1.5 bg-w-accent-light hover:bg-w-accent-muted text-w-primary-dark text-xs font-bold rounded-xl border border-w-accent-border transition cursor-pointer"
                    >
                      + Mẫu 10 HS
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRandomCallStudentsText('');
                        localStorage.setItem('wey_randomcall_students', '');
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer"
                    >
                      Xóa Hết
                    </button>
                  </div>
                  
                  {savedIndicator === 'randomCall' ? (
                    <span className="text-[11px] text-emerald-600 font-bold italic animate-pulse flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Đã lưu tự động
                    </span>
                  ) : (
                    <span className="text-[11px] text-w-text-muted italic hidden md:inline">
                      *Mọi thay đổi đều được lưu tự động
                    </span>
                  )}
                </div>
              </div>

              {/* 3. TÙY CHỌN LẶP LẠI */}
              <div className="space-y-3 bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
                <label className="block text-xs font-black uppercase tracking-wider text-amber-900">
                  3. Quy Tắc Lặp Lại Học Sinh
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setNoRepeatStudents(true)}
                    className={`p-3.5 rounded-2xl border-2 transition text-left cursor-pointer ${
                      noRepeatStudents
                        ? 'bg-w-primary-dark text-white font-bold shadow-md border-w-primary-hover'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">🎯</span>
                      <span className="font-black text-sm">Không Lặp Lại (Khuyên Dùng)</span>
                    </div>
                    <p className={`text-[11px] leading-snug ${noRepeatStudents ? 'text-amber-500' : 'text-slate-500'}`}>
                      Học sinh đã gọi sẽ được đánh dấu đã trả lời và tạm thời không xuất hiện ở các lượt quay kế tiếp.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNoRepeatStudents(false)}
                    className={`p-3.5 rounded-2xl border-2 transition text-left cursor-pointer ${
                      !noRepeatStudents
                        ? 'bg-w-primary-dark text-white font-bold shadow-md border-w-primary-hover'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">🔁</span>
                      <span className="font-black text-sm">Cho Phép Lặp Lại</span>
                    </div>
                    <p className={`text-[11px] leading-snug ${!noRepeatStudents ? 'text-amber-500' : 'text-slate-500'}`}>
                      Mọi học sinh đều có thể được gọi lại ở bất kỳ lượt nào mà không bị loại trừ.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          ) : gameId === 'magicwheel' || gameId === 'magic_wheel' ? (
            <div className="space-y-5">
              {/* 1. CHẾ ĐỘ CHƠI */}
              <div className="space-y-3 bg-indigo-50/60 p-4 rounded-2xl border border-indigo-200">
                <label className="block text-xs font-black uppercase tracking-wider text-indigo-900">
                  1. Chế Độ Chơi (Play Mode)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Mode 1 */}
                  <button
                    type="button"
                    onClick={() => setWheelPlayMode(1)}
                    className={`p-3.5 rounded-2xl border-2 transition text-left flex flex-col justify-between ${
                      wheelPlayMode === 1
                        ? 'bg-indigo-600 text-white font-bold shadow-lg border-indigo-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Database className={`w-4 h-4 ${wheelPlayMode === 1 ? 'text-amber-300' : 'text-indigo-600'}`} />
                      <span className="font-black text-sm">Chế Độ 1 – Ngân Hàng</span>
                    </div>
                    <p className={`text-[11px] leading-snug ${wheelPlayMode === 1 ? 'text-indigo-100' : 'text-slate-500'}`}>
                      Dùng câu từ ngân hàng. Có nút <b>RANDOM</b> ngẫu nhiên.
                    </p>
                  </button>

                  {/* Mode 2 */}
                  <button
                    type="button"
                    onClick={() => setWheelPlayMode(2)}
                    className={`p-3.5 rounded-2xl border-2 transition text-left flex flex-col justify-between ${
                      wheelPlayMode === 2
                        ? 'bg-amber-600 text-white font-bold shadow-lg border-amber-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className={`w-4 h-4 ${wheelPlayMode === 2 ? 'text-yellow-200' : 'text-amber-600'}`} />
                      <span className="font-black text-sm">Chế Độ 2 – Giáo Viên Nhập</span>
                    </div>
                    <p className={`text-[11px] leading-snug ${wheelPlayMode === 2 ? 'text-amber-100' : 'text-slate-500'}`}>
                      Nhập nhiều cụm từ. Có nút <b>RANDOM</b> câu tiếp theo.
                    </p>
                  </button>

                  {/* Mode 3 */}
                  <button
                    type="button"
                    onClick={() => setWheelPlayMode(3)}
                    className={`p-3.5 rounded-2xl border-2 transition text-left flex flex-col justify-between ${
                      wheelPlayMode === 3
                        ? 'bg-emerald-600 text-white font-bold shadow-lg border-emerald-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">🧩</span>
                      <span className="font-black text-sm">Chế Độ 3 – Câu Đố (Tuần Tự)</span>
                    </div>
                    <p className={`text-[11px] leading-snug ${wheelPlayMode === 3 ? 'text-emerald-100' : 'text-slate-500'}`}>
                      Chơi lần lượt. <b>ẨN HOÀN TOÀN RANDOM</b>. Chọn chữ lật trực tiếp.
                    </p>
                  </button>
                </div>

                {/* Mode Details */}
                {wheelPlayMode === 1 && (
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Chọn Ngân Hàng Câu Hỏi:
                    </label>
                    <select
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      className="w-full bg-white border border-indigo-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-indigo-400 shadow-sm"
                    >
                      <optgroup label="📝 ÔN TẬP HỌC KÌ (KHTN 8)">
                        {(banks || []).filter(b => b.id.includes('on_tap')).map(b => (
                          <option key={b.id} value={b.id}>
                            ⭐ {b.name} ({(b.questions || []).length} câu)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="⚗️ CHƯƠNG I & II: HÓA HỌC (Bài 1 - 12)">
                        {(banks || []).filter(b => b.id.startsWith('bank_khtn8_b') && parseInt(b.id.replace('bank_khtn8_b', '')) <= 12).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({(b.questions || []).length} câu)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="⚙️ CHƯƠNG III - VI: VẬT LÝ (Bài 13 - 29)">
                        {(banks || []).filter(b => {
                          if (!b.id.startsWith('bank_khtn8_b')) return false;
                          const num = parseInt(b.id.replace('bank_khtn8_b', ''));
                          return num >= 13 && num <= 29;
                        }).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({(b.questions || []).length} câu)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🧬 CHƯƠNG VII & VIII: SINH HỌC & MÔI TRƯỜNG (Bài 30 - 47)">
                        {(banks || []).filter(b => {
                          if (!b.id.startsWith('bank_khtn8_b')) return false;
                          const num = parseInt(b.id.replace('bank_khtn8_b', ''));
                          return num >= 30 && num <= 47;
                        }).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({(b.questions || []).length} câu)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🎯 CÂU HỎI KHÁC / CỦA BẠN">
                        {(banks || []).filter(b => !b.id.startsWith('bank_khtn8')).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({(b.questions || []).length} câu)
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                )}

                {(wheelPlayMode === 2 || wheelPlayMode === 3) && (
                  <div className="pt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">Kho Chủ Đề Đã Lưu:</label>
                      <select onChange={handleLoadTopic} className="bg-white border border-slate-200 text-slate-700 rounded-lg px-2 py-1 text-xs outline-none">
                        <option value="">-- Chọn chủ đề có sẵn --</option>
                        {savedTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Danh sách cụm từ (Mỗi dòng 1 cụm từ / câu đố):
                      </label>
                      <textarea
                        rows={4}
                        value={wheelCustomPhrasesText}
                        onChange={(e) => setWheelCustomPhrasesText(e.target.value)}
                        placeholder={`NĂNG LƯỢNG MẶT TRỜI\nQUANG HỢP Ở THỰC VẬT\nHỆ TUẦN HOÀN NGƯỜI`}
                        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500 shadow-inner"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-200">
                      <input
                        type="text"
                        value={wheelTopicInput}
                        onChange={(e) => setWheelTopicInput(e.target.value)}
                        placeholder="Nhập tên chủ đề (VD: Lịch sử, Tên loài vật...)"
                        className="flex-1 bg-white border border-slate-300 text-slate-800 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-400"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSaveTopic}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-black shadow transition flex items-center gap-1"
                        >
                          Lưu Kho
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. CHẾ ĐỘ CHỮ CÁI BÀN PHÍM */}
              <div className="space-y-3 bg-sky-50/60 p-4 rounded-2xl border border-sky-200">
                <label className="block text-xs font-black uppercase tracking-wider text-sky-900">
                  2. Chế Độ Chữ Cái Bàn Phím (Letter Mode)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setWheelLetterMode('accent')}
                    className={`p-3 rounded-2xl border-2 transition text-left ${
                      wheelLetterMode === 'accent'
                        ? 'bg-sky-600 text-white font-bold shadow-md border-sky-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-black text-sm mb-0.5">Có Dấu Tiếng Việt</div>
                    <div className={`text-[11px] font-mono leading-relaxed ${wheelLetterMode === 'accent' ? 'text-sky-100' : 'text-slate-500'}`}>
                      A Ă Â B C D Đ E Ê G H I K L M N O Ô Ơ P Q R S T U Ư V X Y
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWheelLetterMode('no-accent')}
                    className={`p-3 rounded-2xl border-2 transition text-left ${
                      wheelLetterMode === 'no-accent'
                        ? 'bg-sky-600 text-white font-bold shadow-md border-sky-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-black text-sm mb-0.5">Không Dấu</div>
                    <div className={`text-[11px] font-mono leading-relaxed ${wheelLetterMode === 'no-accent' ? 'text-sky-100' : 'text-slate-500'}`}>
                      A B C D E G H I K L M N O P Q R S T U V X Y
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. ĐIỂM SỐ MỖI CHỮ CÁI */}
              <div className="space-y-3 bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
                <label className="block text-xs font-black uppercase tracking-wider text-amber-900">
                  3. Điểm Tặng Cho Mỗi Chữ Cái Xuất Hiện
                </label>

                <div className="flex flex-wrap gap-2">
                  {[50, 100, 200, 500].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setWheelPointsPerLetter(pts)}
                      className={`px-5 py-2 rounded-xl text-xs font-black transition border-2 ${
                        wheelPointsPerLetter === pts
                          ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      +{pts} điểm / chữ
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Standard Generic Setup for other games */
            <div className="space-y-6">
              {/* Section 1: Mode Selection */}
              <div className="space-y-3 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-indigo-700">
                  1. Chế Độ Chơi (Mode Selection)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('bank')}
                    className={`p-3 rounded-xl border transition text-left flex items-start gap-3 ${
                      mode === 'bank'
                        ? 'bg-indigo-500 text-white font-bold shadow-md border-indigo-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Database className={`w-5 h-5 mt-0.5 ${mode === 'bank' ? 'text-amber-200' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-sm">Chế Độ Ngân Hàng</div>
                      <div className={`text-[11px] mt-0.5 ${mode === 'bank' ? 'text-indigo-100' : 'text-slate-500'}`}>
                        Dùng câu hỏi/cụm từ từ Ngân Hàng Câu Hỏi
                      </div>
                    </div>
                  </button>

                  {gameId === 'pictogram' ? (
                    <button
                      type="button"
                      onClick={() => setMode('custom')}
                      className={`p-3 rounded-xl border transition text-left flex items-start gap-3 ${
                        mode === 'custom'
                          ? 'bg-amber-500 text-white font-bold shadow-md border-amber-600'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-center w-5 h-5 mt-0.5">
                        <span className="text-sm">✨</span>
                      </div>
                      <div>
                        <div className="font-bold text-sm">Chế Độ Giáo Viên Nhập</div>
                        <div className={`text-[11px] mt-0.5 ${mode === 'custom' ? 'text-amber-100' : 'text-slate-500'}`}>
                          Giáo viên tự nhập cụm từ & chỉnh sửa hình gợi ý
                        </div>
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMode('number')}
                      className={`p-3 rounded-xl border transition text-left flex items-start gap-3 ${
                        mode === 'number'
                          ? 'bg-indigo-500 text-white font-bold shadow-md border-indigo-600'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Hash className={`w-5 h-5 mt-0.5 ${mode === 'number' ? 'text-amber-200' : 'text-slate-400'}`} />
                      <div>
                        <div className="font-bold text-sm">Chế Độ Số Thứ Tự</div>
                        <div className={`text-[11px] mt-0.5 ${mode === 'number' ? 'text-indigo-100' : 'text-slate-500'}`}>
                          Tự do gọi số (1, 2, 3...) kết hợp file trình chiếu ngoài
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setMode('none')}
                    className={`p-3 rounded-xl border transition text-left flex items-start gap-3 ${
                      mode === 'none'
                        ? 'bg-emerald-500 text-white font-bold shadow-md border-emerald-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Play className={`w-5 h-5 mt-0.5 ${mode === 'none' ? 'text-emerald-100' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-sm">Chế Độ Bỏ Qua Câu Hỏi</div>
                      <div className={`text-[11px] mt-0.5 ${mode === 'none' ? 'text-emerald-100' : 'text-slate-500'}`}>
                        Vào thẳng màn chơi Boardgame
                      </div>
                    </div>
                  </button>
                </div>

                {/* Mode-specific settings */}
                {mode === 'bank' ? (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Chọn Ngân Hàng Câu Hỏi:
                    </label>
                    <select
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-400 shadow-sm"
                    >
                      <optgroup label="📝 ÔN TẬP HỌC KÌ (KHTN 8)">
                        {(banks || []).filter(b => b.id.includes('on_tap')).map(b => (
                          <option key={b.id} value={b.id}>
                            ⭐ {b.name} ({(b.questions || []).length} câu)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="⚗️ CHƯƠNG I & II: HÓA HỌC (Bài 1 - 12)">
                        {(banks || []).filter(b => b.id.startsWith('bank_khtn8_b') && parseInt(b.id.replace('bank_khtn8_b', '')) <= 12).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({(b.questions || []).length} câu)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="⚙️ CHƯƠNG III - VI: VẬT LÝ (Bài 13 - 29)">
                        {(banks || []).filter(b => {
                          if (!b.id.startsWith('bank_khtn8_b')) return false;
                          const num = parseInt(b.id.replace('bank_khtn8_b', ''));
                          return num >= 13 && num <= 29;
                        }).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({(b.questions || []).length} câu)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🧬 CHƯƠNG VII & VIII: SINH HỌC & MÔI TRƯỜNG (Bài 30 - 47)">
                        {(banks || []).filter(b => {
                          if (!b.id.startsWith('bank_khtn8_b')) return false;
                          const num = parseInt(b.id.replace('bank_khtn8_b', ''));
                          return num >= 30 && num <= 47;
                        }).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({(b.questions || []).length} câu)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🎯 CÂU HỎI KHÁC / CỦA BẠN">
                        {(banks || []).filter(b => !b.id.startsWith('bank_khtn8')).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({(b.questions || []).length} câu)
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                ) : mode === 'number' ? (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tổng Số Câu Hỏi / Số Ô (N):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={64}
                      value={totalQuestionsNumber}
                      onChange={(e) => setTotalQuestionsNumber(Math.max(1, parseInt(e.target.value) || 10))}
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-400 shadow-sm"
                    />
                  </div>
                ) : mode === 'custom' && gameId === 'pictogram' ? (
                  <div className="pt-2 text-xs font-semibold text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    ✨ Số lượng hình gợi ý sẽ do AI tự động phân tích và tạo dựa theo cụm từ & mức độ do giáo viên thiết lập.
                  </div>
                ) : mode === 'none' ? (
                  <div className="pt-2 text-xs font-bold text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center gap-2">
                    <span className="text-base">⚡</span>
                    <span>Chế độ <b>Bỏ qua câu hỏi</b>: Trò chơi sẽ vào thẳng màn chơi mà không yêu cầu ngân hàng câu hỏi hay số câu.</span>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Section 2: Team Mode */}
          {!isRandomCallGame && (
            <div className="space-y-3 bg-purple-50/40 p-4 rounded-2xl border border-purple-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-purple-700 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>2. Chế Độ Đội Đối Kháng</span>
                </label>
                <button
                  type="button"
                  onClick={() => setTeamMode(!teamMode)}
                  className={`w-12 h-6 rounded-full transition p-1 relative ${
                    teamMode ? 'bg-purple-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition transform ${
                      teamMode ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {teamMode && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-slate-700">
                      {isTwoTeamGame ? 'Số Lượng Đội (Cố định 2 đội):' : 'Số Lượng Đội (1 - 4):'}
                    </label>
                    {isTwoTeamGame ? (
                      <span className="px-3 py-1 bg-purple-600 text-white rounded-xl text-xs font-black shadow-xs">
                        2 Đội Đối Kháng
                      </span>
                    ) : (
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleTeamCountChange(num)}
                            className={`w-8 h-8 rounded-xl text-xs font-black transition ${
                              teamCount === num
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-white text-slate-600 hover:text-slate-800 border border-slate-200'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {teamData.slice(0, teamCount).map((team, idx) => (
                      <div key={team.id} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2 shadow-sm">
                        {/* Avatar Selector Dropdown */}
                        <select
                          value={team.avatar}
                          onChange={(e) => {
                            const found = PRESET_AVATARS.find(a => a.emoji === e.target.value);
                            handleUpdateTeamAvatar(idx, e.target.value, found?.color || team.color);
                          }}
                          className="bg-slate-100 border border-slate-200 rounded-lg p-1 text-base cursor-pointer focus:outline-none"
                        >
                          {PRESET_AVATARS.map((av) => (
                            <option key={av.id} value={av.emoji}>
                              {av.emoji} {av.name}
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          value={team.name}
                          onChange={(e) => handleUpdateTeamName(idx, e.target.value)}
                          placeholder={`Tên Đội ${idx + 1}`}
                          className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Time Limit */}
          <div className="space-y-3 bg-pink-50/40 p-4 rounded-2xl border border-pink-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-pink-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>3. Giới Hạn Thời Gian Mỗi Câu</span>
              </label>
              <button
                type="button"
                onClick={() => setTimerEnabled(!timerEnabled)}
                className={`w-12 h-6 rounded-full transition p-1 relative ${
                  timerEnabled ? 'bg-pink-500' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition transform ${
                    timerEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {timerEnabled && (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs text-slate-700 font-semibold">Thời gian suy nghĩ:</span>
                <select
                  value={timeLimitSeconds}
                  onChange={(e) => setTimeLimitSeconds(Number(e.target.value))}
                  className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-pink-400 shadow-sm"
                >
                  <option value={15}>15 giây</option>
                  <option value={30}>30 giây</option>
                  <option value={45}>45 giây</option>
                  <option value={60}>60 giây (1 phút)</option>
                  <option value={90}>90 giây (1.5 phút)</option>
                  <option value={120}>120 giây (2 phút)</option>
                </select>
              </div>
            )}
          </div>

          
          {gameId === 'puzzle' && (
            <div className="space-y-3 bg-amber-50/40 p-4 rounded-2xl border border-amber-100">
              <label className="text-xs font-extrabold uppercase tracking-wider text-amber-700 flex items-center gap-2">
                <span>🖼️ Ảnh Mảnh Ghép Bí Ẩn</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="URL ảnh hoặc từ khóa AI (VD: dog, cat...)"
                  className="flex-1 bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-amber-400 shadow-sm"
                  onChange={(e) => {
                    const val = e.target.value;
                    const win = window as unknown as { puzzleCustomImage?: string };
                    if (val.startsWith('http')) {
                      // Save directly to a local variable or handle it
                      win.puzzleCustomImage = val;
                    } else if (val) {
                      win.puzzleCustomImage = 'https://source.unsplash.com/800x600/?' + encodeURIComponent(val);
                    }
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => safeAlert("Chức năng tạo ảnh AI sẽ cập nhật sớm, vui lòng dùng URL ảnh!")} 
                  className="px-3 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Tạo Bằng AI
                </button>
              </div>
            </div>
          )}

          {/* 1. WHACK-A-MOLE SPECIFIC SETTINGS */}
          {isWhackAMole && (
            <div className="space-y-3 bg-w-accent-light/50 p-4 rounded-2xl border border-w-accent-border">
              <label className="text-xs font-extrabold uppercase tracking-wider text-w-primary-dark flex items-center gap-2">
                <span>🔨 Cấu Hình Đập Chuột Chũi</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-xs text-w-text-main font-bold block mb-1">Số hang chuột:</span>
                  <select
                    value={whackHoleCount}
                    onChange={(e) => setWhackHoleCount(Number(e.target.value))}
                    className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                  >
                    <option value={6}>6 hang (3x2)</option>
                    <option value={8}>8 hang (4x2)</option>
                    <option value={9}>9 hang (3x3 - Chuẩn)</option>
                    <option value={12}>12 hang (4x3 - Rộng)</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs text-w-text-main font-bold block mb-1">Tốc độ chuột trồi lên:</span>
                  <select
                    value={whackMoleSpeed}
                    onChange={(e) => setWhackMoleSpeed(e.target.value as any)}
                    className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                  >
                    <option value="slow">Chậm (Dễ quan sát)</option>
                    <option value="medium">Vừa (Chuẩn nhịp độ)</option>
                    <option value="fast">Nhanh (Phản xạ cao)</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs text-w-text-main font-bold block mb-1">Chuột bẫy bom:</span>
                  <button
                    type="button"
                    onClick={() => setWhackHasTrap(!whackHasTrap)}
                    className={`w-full py-1.5 px-3 rounded-xl text-xs font-extrabold border transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                      whackHasTrap ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <span>{whackHasTrap ? '💣 Có Chuột Bẫy (-điểm)' : '🛡️ Không Có Bẫy'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. CLASSIFICATION SPECIFIC SETTINGS */}
          {isClassification && (
            <div className="space-y-3 bg-w-accent-light/50 p-4 rounded-2xl border border-w-accent-border">
              <label className="text-xs font-extrabold uppercase tracking-wider text-w-primary-dark flex items-center justify-between">
                <span>📁 Cấu Hình Nhóm & Đối Tượng Phân Loại</span>
                <span className="text-[10px] text-w-text-muted font-bold">Hỗ trợ mọi môn học & kiến thức</span>
              </label>

              {/* Categories list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-w-text-main">
                  <span>Danh Sách Nhóm Phân Loại ({classificationCategories.length} nhóm):</span>
                  {classificationCategories.length < 4 && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextId = `cat_${classificationCategories.length + 1}`;
                        setClassificationCategories(prev => [
                          ...prev,
                          { id: nextId, name: `Nhóm ${prev.length + 1}`, color: '#f59e0b', icon: '📦' }
                        ]);
                      }}
                      className="px-2.5 py-1 bg-w-primary-dark text-white rounded-lg text-[11px] font-extrabold hover:bg-[#3E522F] transition cursor-pointer"
                    >
                      + Thêm Nhóm
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {classificationCategories.map((cat, idx) => (
                    <div key={cat.id} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-w-border shadow-2xs">
                      <span className="text-xs font-extrabold text-w-primary-dark w-6 text-center">{idx + 1}.</span>
                      <input
                        type="text"
                        value={cat.name}
                        onChange={(e) => {
                          const updated = [...classificationCategories];
                          updated[idx].name = e.target.value;
                          setClassificationCategories(updated);
                        }}
                        placeholder={`Tên Nhóm ${idx + 1}`}
                        className="flex-1 bg-w-bg-tag border border-[#E8DFCA] rounded-lg px-2 py-1 text-xs font-bold text-w-text-main focus:outline-none"
                      />
                      {classificationCategories.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            setClassificationCategories(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="text-rose-500 hover:text-rose-700 text-xs px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Items Textarea */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-w-text-main">
                  <span>Danh Sách Đối Tượng (Cú pháp: "Tên đối tượng : Số thứ tự nhóm"):</span>
                  <button
                    type="button"
                    onClick={() => {
                      setClassificationItemsText(`Mặt Trời: 1\nTrái Đất: 2\nSao Hỏa: 2\nSao Mộc: 2\nSao Bắc Cực: 1\nSao Kim: 2`);
                    }}
                    className="text-[10px] text-w-primary-dark underline hover:font-bold"
                  >
                    Nạp mẫu Thiên văn
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={classificationItemsText}
                  onChange={(e) => setClassificationItemsText(e.target.value)}
                  placeholder={`Ví dụ:\nChó Corgi : 1\nBạch Tuộc : 2\nCá Heo : 1`}
                  className="w-full bg-white border border-w-border text-w-text-main rounded-xl p-2.5 text-xs font-mono font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                />
              </div>
            </div>
          )}

          {/* 3. FLAG CAPTURE SPECIFIC SETTINGS */}
          {isFlagCapture && (
            <div className="space-y-3 bg-w-accent-light/50 p-4 rounded-2xl border border-w-accent-border">
              <label className="text-xs font-extrabold uppercase tracking-wider text-w-primary-dark flex items-center gap-2">
                <span>🚩 Cấu Hình Trò Chơi Cướp Cờ</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-xs text-w-text-main font-bold block mb-1">Số vòng thi đấu:</span>
                  <select
                    value={flagRounds}
                    onChange={(e) => setFlagRounds(Number(e.target.value))}
                    className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                  >
                    <option value={5}>5 Vòng cướp cờ</option>
                    <option value={8}>8 Vòng cướp cờ (Chuẩn)</option>
                    <option value={10}>10 Vòng cướp cờ</option>
                    <option value={15}>15 Vòng cướp cờ</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs text-w-text-main font-bold block mb-1">Điểm thưởng mỗi lần cướp cờ:</span>
                  <select
                    value={flagPointsCapture}
                    onChange={(e) => setFlagPointsCapture(Number(e.target.value))}
                    className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                  >
                    <option value={10}>+10 Điểm / cờ</option>
                    <option value={15}>+15 Điểm / cờ (Chuẩn)</option>
                    <option value={20}>+20 Điểm / cờ</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 4. SACK RACE SPECIFIC SETTINGS */}
          {isSackRace && (
            <div className="space-y-3 bg-w-accent-light/50 p-4 rounded-2xl border border-w-accent-border">
              <label className="text-xs font-extrabold uppercase tracking-wider text-w-primary-dark flex items-center gap-2">
                <span>🌾 Cấu Hình Đường Đua Nhảy Bao Bố</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-xs text-w-text-main font-bold block mb-1">Độ dài đường đua (bước):</span>
                  <select
                    value={sackTrackLength}
                    onChange={(e) => setSackTrackLength(Number(e.target.value))}
                    className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                  >
                    <option value={5}>5 Bước (Đua ngắn)</option>
                    <option value={7}>7 Bước (Chuẩn)</option>
                    <option value={10}>10 Bước (Đua dài kịch tính)</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs text-w-text-main font-bold block mb-1">Bước tiến khi đúng:</span>
                  <select
                    value={sackStepPerCorrect}
                    onChange={(e) => setSackStepPerCorrect(Number(e.target.value))}
                    className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                  >
                    <option value={1}>Tiến 1 bước</option>
                    <option value={2}>Tiến 2 bước (Bứt tốc)</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs text-w-text-main font-bold block mb-1">Khi trả lời sai:</span>
                  <select
                    value={sackPenaltyWrong}
                    onChange={(e) => setSackPenaltyWrong(Number(e.target.value))}
                    className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                  >
                    <option value={0}>Đứng yên</option>
                    <option value={1}>Lùi 1 bước</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 5. SNAIL WORD SEARCH SPECIFIC SETTINGS */}
          {isSnailWordSearch && (
            <div className="space-y-3 bg-w-accent-light/50 p-4 rounded-2xl border border-w-accent-border">
              <label className="text-xs font-extrabold uppercase tracking-wider text-w-primary-dark flex items-center justify-between">
                <span>🐌 Cấu Hình Ma Trận Chữ & Ốc Sên</span>
                <span className="text-[10px] text-w-text-muted font-bold">Hỗ trợ tiếng Việt có dấu/không dấu</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-xs text-w-text-main font-bold block mb-1">Kích thước bảng ma trận:</span>
                  <select
                    value={snailGridSize}
                    onChange={(e) => setSnailGridSize(Number(e.target.value))}
                    className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                  >
                    <option value={8}>8 x 8 (Dễ - Chữ lớn)</option>
                    <option value={10}>10 x 10 (Chuẩn - Cân đối)</option>
                    <option value={12}>12 x 12 (Rộng - Thử thách)</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs text-w-text-main font-bold block mb-1">Độ khó hướng đặt từ:</span>
                  <select
                    value={snailDifficulty}
                    onChange={(e) => setSnailDifficulty(e.target.value as any)}
                    className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                  >
                    <option value="easy">Dễ (Chỉ Ngang & Dọc)</option>
                    <option value="medium">Vừa (Ngang, Dọc, Chéo)</option>
                    <option value="hard">Nâng cao (Cả hướng ngược)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-xs font-bold text-w-text-main block">
                  Danh sách từ cần tìm (Mỗi từ trên một dòng):
                </span>
                <textarea
                  rows={4}
                  value={snailWordsText}
                  onChange={(e) => setSnailWordsText(e.target.value)}
                  placeholder={`QUANG HỢP\nHÔ HẤP\nDIỆP LỤC\nKHÍ KHỔNG`}
                  className="w-full bg-white border border-w-border text-w-text-main rounded-xl p-2.5 text-xs font-mono font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                />
              </div>
            </div>
          )}

          {/* 6. MINE BOOM (DÒ BOOM) SPECIFIC SETTINGS */}
          {isMineBoom && (
            <div className="space-y-3 bg-w-accent-light/50 p-4 rounded-2xl border border-w-accent-border">
              <label className="text-xs font-extrabold uppercase tracking-wider text-w-primary-dark flex items-center justify-between">
                <span>💣 Cấu Hình Bãi Dò Boom</span>
                <span className="text-[10px] text-w-text-muted font-bold">Kịch tính & Cân não</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-xs text-w-text-main font-bold block mb-1">Kích thước bảng ô:</span>
                  <select
                    value={`${boomGridRows}x${boomGridCols}`}
                    onChange={(e) => {
                      const [r, c] = e.target.value.split('x').map(Number);
                      setBoomGridRows(r);
                      setBoomGridCols(c);
                    }}
                    className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                  >
                    <option value="4x4">4 x 4 (16 ô)</option>
                    <option value="4x5">4 x 5 (20 ô - Chuẩn)</option>
                    <option value="5x5">5 x 5 (25 ô)</option>
                    <option value="4x6">4 x 6 (24 ô)</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs text-w-text-main font-bold block mb-1">Số lượng Boom ẩn:</span>
                  <select
                    value={boomCount}
                    onChange={(e) => setBoomCount(Number(e.target.value))}
                    className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                  >
                    <option value={3}>3 Quả Boom</option>
                    <option value={4}>4 Quả Boom (Cân bằng)</option>
                    <option value={5}>5 Quả Boom (Thử thách)</option>
                    <option value={6}>6 Quả Boom (Khó)</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs text-w-text-main font-bold block mb-1">Dính bao nhiêu Boom thì thua:</span>
                  <select
                    value={boomMaxToLose}
                    onChange={(e) => setBoomMaxToLose(Number(e.target.value))}
                    className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                  >
                    <option value={2}>2 Quả Boom (Rất gắt)</option>
                    <option value={3}>3 Quả Boom (Chuẩn luật)</option>
                    <option value={4}>4 Quả Boom</option>
                  </select>
                </div>
              </div>

              <div>
                <span className="text-xs text-w-text-main font-bold block mb-1">Điểm phạt khi trúng Boom:</span>
                <select
                  value={boomPenalty}
                  onChange={(e) => setBoomPenalty(Number(e.target.value))}
                  className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                >
                  <option value={10}>-10 Điểm</option>
                  <option value={15}>-15 Điểm (Chuẩn)</option>
                  <option value={20}>-20 Điểm</option>
                </select>
              </div>
            </div>
          )}

          {/* 7. GOLD MINER (ĐÀO VÀNG) SPECIFIC SETTINGS */}
          {isGoldMiner && (
            <div className="space-y-3 bg-w-accent-light/50 p-4 rounded-2xl border border-w-accent-border">
              <label className="text-xs font-extrabold uppercase tracking-wider text-w-primary-dark flex items-center justify-between">
                <span>⛏️ Cấu Hình Mỏ Đào Vàng</span>
                <span className="text-[10px] text-w-text-muted font-bold">Canh chuẩn thời điểm thả móc neo</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-xs text-w-text-main font-bold block mb-1">Số lượng vàng trong mỏ:</span>
                  <select
                    value={minerGoldCount}
                    onChange={(e) => setMinerGoldCount(Number(e.target.value))}
                    className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                  >
                    <option value={4}>4 Cục vàng</option>
                    <option value={5}>5 Cục vàng (Chuẩn)</option>
                    <option value={7}>7 Cục vàng (Nhiều)</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs text-w-text-main font-bold block mb-1">Số lượng đá cản trở:</span>
                  <select
                    value={minerRockCount}
                    onChange={(e) => setMinerRockCount(Number(e.target.value))}
                    className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                  >
                    <option value={2}>2 Khối đá</option>
                    <option value={3}>3 Khối đá (Chuẩn)</option>
                    <option value={5}>5 Khối đá (Dày đặc)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-xs text-w-text-main font-bold block mb-1">Tốc độ đung đưa móc neo:</span>
                  <select
                    value={minerHookSpeed}
                    onChange={(e) => setMinerHookSpeed(e.target.value as any)}
                    className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                  >
                    <option value="slow">Chậm (Dễ canh)</option>
                    <option value="medium">Vừa phải (Chuẩn)</option>
                    <option value="fast">Nhanh (Thử thách phản xạ)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-w-border mt-4 sm:mt-0">
                  <span className="text-xs font-bold text-w-text-main">Có Túi Quà Bí Mật 🎁:</span>
                  <input
                    type="checkbox"
                    checked={minerHasSecretBag}
                    onChange={(e) => setMinerHasSecretBag(e.target.checked)}
                    className="w-4 h-4 accent-w-primary-dark cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 8. BEAR PASSING (TRUYỀN GẤU) SPECIFIC SETTINGS */}
          {isBearPassing && (
            <div className="space-y-3 bg-w-accent-light/50 p-4 rounded-2xl border border-w-accent-border">
              <label className="text-xs font-extrabold uppercase tracking-wider text-w-primary-dark flex items-center justify-between">
                <span>🧸 Cấu Hình Sân Khấu Truyền Gấu</span>
                <span className="text-[10px] text-w-text-muted font-bold">Dừng nhạc bất ngờ tìm người may mắn</span>
              </label>

              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-w-text-main flex items-center gap-2">
                    Danh sách học sinh (Mỗi tên 1 dòng):
                    {savedIndicator === 'bear' ? (
                      <span className="text-[10px] text-emerald-600 font-bold italic animate-pulse flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Đã lưu tự động
                      </span>
                    ) : (
                      <span className="text-[10px] text-w-text-muted italic font-normal">
                        (Mọi thay đổi tự động lưu)
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <StudentImportButton
                      onImport={(students) => {
                        if (students.length > 0) {
                          setBearStudentsText(students.join('\n'));
                          try {
                            localStorage.setItem('wey_saved_students_list', JSON.stringify(students));
                            setSavedIndicator('bear');
                            setTimeout(() => setSavedIndicator(null), 2500);
                          } catch (err) {}
                        }
                      }}
                      buttonText="Tải Excel"
                      variant="compact"
                    />
                    <input 
                      type="file" 
                      accept=".txt,.csv" 
                      className="hidden" 
                      ref={bearTxtCsvInputRef}
                      onChange={(e) => handleImportTxtCsv(e, setBearStudentsText, 'wey_saved_students_list', 'bear')}
                    />
                    <button
                      type="button"
                      onClick={() => bearTxtCsvInputRef.current?.click()}
                      className="px-2 py-1 bg-w-accent-light hover:bg-w-accent-muted text-w-primary-dark text-xs font-bold rounded-lg border border-w-accent-border transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      📄 TXT/CSV
                    </button>
                    <span className="text-[11px] font-bold text-w-primary-dark bg-white px-2 py-0.5 rounded-lg border border-w-border">
                      {bearStudentsText.split('\n').filter(s => s.trim().length > 0).length} HS
                    </span>
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={bearStudentsText}
                  onChange={(e) => {
                    setBearStudentsText(e.target.value);
                    try {
                      const list = e.target.value.split('\n').map(s => s.trim()).filter(s => s.length > 0);
                      localStorage.setItem('wey_saved_students_list', JSON.stringify(list));
                      setSavedIndicator('bear');
                      setTimeout(() => setSavedIndicator(null), 2500);
                    } catch (err) {}
                  }}
                  className="w-full bg-white border border-w-border text-w-text-main rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-w-primary-dark shadow-xs"
                />
              </div>

              <div>
                <span className="text-xs text-w-text-main font-bold block mb-1">Chế độ chọn nhạc nền:</span>
                <select
                  value={bearMusicMode}
                  onChange={(e) => setBearMusicMode(e.target.value as any)}
                  className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                >
                  <option value="random">Phát ngẫu nhiên giữa các bài nhạc nền</option>
                  <option value="order">Theo bài đã chọn sẵn</option>
                </select>
              </div>
            </div>
          )}

          {/* 9. LETTER ARRANGE (SẮP XẾP CHỮ CÁI) SPECIFIC SETTINGS */}
          {isLetterArrange && (
            <div className="space-y-3 bg-w-accent-light/50 p-4 rounded-2xl border border-w-accent-border">
              <label className="text-xs font-extrabold uppercase tracking-wider text-w-primary-dark flex items-center justify-between">
                <span>🔤 Cấu Hình Sắp Xếp Chữ Cái</span>
                <span className="text-[10px] text-w-text-muted font-bold">Xáo trộn ký tự tiếng Việt</span>
              </label>

              <div className="space-y-1">
                <span className="text-xs font-bold text-w-text-main block">
                  Danh sách từ khóa / cụm từ (Mỗi từ 1 dòng):
                </span>
                <textarea
                  rows={4}
                  value={letterWordsText}
                  onChange={(e) => setLetterWordsText(e.target.value)}
                  placeholder={`MẶT TRỜI\nQUANG HỢP\nHỆ SINH THÁI`}
                  className="w-full bg-white border border-w-border text-w-text-main rounded-xl p-2.5 text-xs font-mono font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-w-border">
                  <span className="text-xs font-bold text-w-text-main">Hiện nút Gợi Ý:</span>
                  <input
                    type="checkbox"
                    checked={letterShowHint}
                    onChange={(e) => setLetterShowHint(e.target.checked)}
                    className="w-4 h-4 accent-w-primary-dark cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-w-border">
                  <span className="text-xs font-bold text-w-text-main">Có phím Dấu Cách:</span>
                  <input
                    type="checkbox"
                    checked={letterShowSpace}
                    onChange={(e) => setLetterShowSpace(e.target.checked)}
                    className="w-4 h-4 accent-w-primary-dark cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 10. APPLE PICK (HÁI TÁO - ÔNG SMITH) SPECIFIC SETTINGS */}
          {isApplePick && (
            <div className="space-y-3 bg-w-bg-alt p-4 rounded-2xl border-2 border-[#E3DCBA]">
              <label className="text-xs font-black uppercase tracking-wider text-w-text-main flex items-center justify-between">
                <span>🍎 Cấu Hình Bàn Cờ Hái Táo (Ông Smith)</span>
                <span className="text-[10px] text-w-text-muted font-bold">Boardgame Vườn Táo & Quy Tắc Chia Hết</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-xs text-w-text-main font-bold block mb-1">Số lượng ô trên bàn cờ:</span>
                  <select
                    value={appleBoardTiles}
                    onChange={(e) => setAppleBoardTiles(Number(e.target.value))}
                    className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                  >
                    <option value={24}>24 Ô (Ván nhanh)</option>
                    <option value={30}>30 Ô</option>
                    <option value={36}>36 Ô (Chuẩn cân bằng)</option>
                    <option value={42}>42 Ô (Đường dài)</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs text-w-text-main font-bold block mb-1">Mục tiêu số táo để thắng:</span>
                  <select
                    value={appleTargetCount}
                    onChange={(e) => setAppleTargetCount(Number(e.target.value))}
                    className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                  >
                    <option value={4}>4 Quả Táo 🍏 (Nhanh)</option>
                    <option value={6}>6 Quả Táo 🍎 (Chuẩn)</option>
                    <option value={8}>8 Quả Táo 🍏 (Thử thách)</option>
                    <option value={10}>10 Quả Táo 🍎</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-xs text-w-text-main font-bold block mb-1">Số Bí Mật Ông Smith:</span>
                  <select
                    value={appleSmithSecretMode}
                    onChange={(e) => setAppleSmithSecretMode(e.target.value as any)}
                    className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                  >
                    <option value="random">Ngẫu nhiên mỗi ván (Khuyên dùng)</option>
                    <option value="manual">Tự chọn số cố định</option>
                  </select>
                </div>

                {appleSmithSecretMode === 'manual' ? (
                  <div>
                    <span className="text-xs text-w-text-main font-bold block mb-1">Chọn số chia hết (Bị bắt):</span>
                    <select
                      value={appleSmithSecretNumber}
                      onChange={(e) => setAppleSmithSecretNumber(Number(e.target.value))}
                      className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                    >
                      <option value={2}>Chia hết cho 2</option>
                      <option value={3}>Chia hết cho 3</option>
                      <option value={4}>Chia hết cho 4</option>
                      <option value={5}>Chia hết cho 5</option>
                      <option value={6}>Chia hết cho 6</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-w-border mt-4 sm:mt-0">
                    <span className="text-xs font-bold text-w-text-main">Hiện số bí mật cho cả lớp:</span>
                    <input
                      type="checkbox"
                      checked={appleShowSmithSecret}
                      onChange={(e) => setAppleShowSmithSecret(e.target.checked)}
                      className="w-4 h-4 accent-w-primary-dark cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 11. SON TINH - THUY TINH SPECIFIC SETTINGS */}
          {isSonTinhThuyTinh && (
            <div className="space-y-3 bg-[#F4F8F1] p-4 rounded-2xl border-2 border-w-accent-muted">
              <label className="text-xs font-black uppercase tracking-wider text-w-text-main flex items-center justify-between">
                <span>⚔️ Cấu Hình Đại Chiến Sơn Tinh – Thủy Tinh</span>
                <span className="text-[10px] text-w-text-muted font-bold">Boardgame Thu Thập Sính Lễ Vua Hùng</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-xs text-w-text-main font-bold block mb-1">Số hiệp tối đa (Rounds):</span>
                  <select
                    value={stttMaxRounds}
                    onChange={(e) => setStttMaxRounds(Number(e.target.value))}
                    className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                  >
                    <option value={6}>6 Hiệp (Nhanh)</option>
                    <option value={8}>8 Hiệp</option>
                    <option value={10}>10 Hiệp (Chuẩn thi đấu)</option>
                    <option value={15}>15 Hiệp (Chiến thuật sâu)</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs text-w-text-main font-bold block mb-1">Số lượng Sính Lễ cần dâng:</span>
                  <select
                    value={stttTargetSinhLe}
                    onChange={(e) => setStttTargetSinhLe(Number(e.target.value))}
                    className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                  >
                    <option value={3}>3 Sính Lễ (Voi 9 ngà, Gà 9 cựa, Ngựa 9 hồng mao)</option>
                  </select>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-w-accent-muted text-xs text-w-text-muted font-medium leading-relaxed">
                💡 <strong>Luật chơi chiến thuật:</strong> Trả lời đúng câu hỏi để nhận <strong className="text-w-text-main">Điểm Thần Lực (AP)</strong>. Dùng AP để di chuyển tìm sính lễ, thi triển Dâng Núi (Sơn Tinh) hoặc Dâng Nước Lũ (Thủy Tinh) và cống nạp tại Cung Điện Hùng Vương để giành chiến thắng.
              </div>
            </div>
          )}

          {/* 12. MONOPOLY (CỜ TỶ PHÚ) SPECIFIC SETTINGS */}
          {isMonopoly && (
            <div className="space-y-4 bg-[#FBF8EF] p-4 rounded-2xl border-2 border-w-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-w-text-main flex items-center gap-2">
                  <span>🎩 Cấu Hình Cờ Tỷ Phú Tri Thức</span>
                </label>
                <div className="flex bg-[#EFE9D7] p-0.5 rounded-xl border border-w-border">
                  <button
                    type="button"
                    onClick={() => setMonopolyActiveTab('general')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      monopolyActiveTab === 'general'
                        ? 'bg-white text-w-text-main shadow-2xs'
                        : 'text-w-text-muted hover:text-w-text-main'
                    }`}
                  >
                    ⚙️ Thiết Lập Chung
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonopolyActiveTab('tiles')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                      monopolyActiveTab === 'tiles'
                        ? 'bg-w-primary-dark text-white shadow-2xs'
                        : 'text-w-text-muted hover:text-w-text-main'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Tùy Chỉnh 16 Ô Đất</span>
                  </button>
                </div>
              </div>

              {monopolyActiveTab === 'general' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-xs text-w-text-main font-bold block mb-1">Tiền vốn khởi điểm:</span>
                      <select
                        value={monopolyStartingMoney}
                        onChange={(e) => setMonopolyStartingMoney(Number(e.target.value))}
                        className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                      >
                        <option value={1000}>$1,000 (Thử thách sinh tồn)</option>
                        <option value={1500}>$1,500 (Chuẩn quốc tế)</option>
                        <option value={2000}>$2,000 (Dồi dào đầu tư)</option>
                        <option value={3000}>$3,000 (Thịnh vượng)</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-xs text-w-text-main font-bold block mb-1">Thưởng qua ô START:</span>
                      <select
                        value={monopolySalaryAmount}
                        onChange={(e) => setMonopolySalaryAmount(Number(e.target.value))}
                        className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                      >
                        <option value={100}>+$100 / vòng</option>
                        <option value={200}>+$200 / vòng (Chuẩn)</option>
                        <option value={300}>+$300 / vòng</option>
                        <option value={500}>+$500 / vòng (Tăng tốc)</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-xs text-w-text-main font-bold block mb-1">Điều kiện chiến thắng:</span>
                      <select
                        value={monopolyWinCondition}
                        onChange={(e) => setMonopolyWinCondition(e.target.value as any)}
                        className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                      >
                        <option value="bankruptcy">Độc Tôn (Các đội khác Phá Sản)</option>
                        <option value="target_wealth">Chạm mốc Tài Sản Mục Tiêu</option>
                        <option value="time_limit">Hết giờ tính Tổng Tài Sản</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-xs text-w-text-main font-bold block mb-1">Chủ đề bàn cờ:</span>
                      <select
                        value={monopolyBoardTheme}
                        onChange={(e) => setMonopolyBoardTheme(e.target.value as any)}
                        className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                      >
                        <option value="vietnam">Danh Lam Thắng Cảnh Việt Nam (Khuyên dùng)</option>
                        <option value="science">Khoa Học Tự Nhiên & STEM</option>
                      </select>
                    </div>

                    {monopolyWinCondition === 'target_wealth' && (
                      <div>
                        <span className="text-xs text-w-text-main font-bold block mb-1">Mốc tài sản cần đạt ($):</span>
                        <select
                          value={monopolyTargetWealth}
                          onChange={(e) => setMonopolyTargetWealth(Number(e.target.value))}
                          className="w-full bg-white border border-w-border text-w-text-main rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-w-primary-dark shadow-xs"
                        >
                          <option value={2500}>$2,500 (Trận đấu nhanh)</option>
                          <option value={3500}>$3,500 (Vừa phải)</option>
                          <option value={5000}>$5,000 (Kỳ phùng địch thủ)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-w-border text-xs text-w-text-muted font-medium leading-relaxed">
                    💡 <strong>Nguyên tắc cốt lõi:</strong> Trả lời đúng câu hỏi để được gieo xúc xắc du ngoạn các thành phố Việt Nam, mua đất, xây khách sạn, rút thẻ sự kiện và thu tiền thuê khi đối thủ đáp vào đất của mình! Trả lời sai bị mất lượt.
                  </div>
                </div>
              ) : (
                /* Tab Tùy Chỉnh 16 Ô Đất */
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-xs text-w-text-muted font-medium">
                      Chỉnh sửa tên thành phố/địa danh, giá mua và giá thuê cho 16 ô đất bất động sản:
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setMonopolyCustomTiles([
                            { id: 1, name: 'Cần Thơ', subtitle: 'Bến Ninh Kiều & Chợ Nổi', price: 100, baseRent: 15, groupName: 'Miền Tây Nam Bộ', icon: '⛵' },
                            { id: 2, name: 'Phú Quốc', subtitle: 'Đảo Ngọc Thiên Đường', price: 120, baseRent: 20, groupName: 'Miền Tây Nam Bộ', icon: '🏝️' },
                            { id: 4, name: 'Vũng Tàu', subtitle: 'Bãi Sau & Mũi Nghinh Phong', price: 140, baseRent: 25, groupName: 'Đông Nam Bộ', icon: '🌊' },
                            { id: 5, name: 'TP. Hồ Chí Minh', subtitle: 'Chợ Bến Thành & Landmark 81', price: 160, baseRent: 30, groupName: 'Đông Nam Bộ', icon: '🏙️' },
                            { id: 7, name: 'Đà Lạt', subtitle: 'Hồ Xuân Hương & Ngàn Hoa', price: 180, baseRent: 35, groupName: 'Tây Nguyên & Nam Trung Bộ', icon: '🌲' },
                            { id: 8, name: 'Nha Trang', subtitle: 'Tháp Bà Ponagar & Vịnh Biển', price: 200, baseRent: 40, groupName: 'Tây Nguyên & Nam Trung Bộ', icon: '🏖️' },
                            { id: 9, name: 'Quy Nhơn', subtitle: 'Eo Gió & Kỳ Co Tuyệt Đẹp', price: 220, baseRent: 45, groupName: 'Tây Nguyên & Nam Trung Bộ', icon: '🌅' },
                            { id: 11, name: 'Quảng Bình', subtitle: 'Hang Sơn Đoòng & Phong Nha', price: 240, baseRent: 50, groupName: 'Di Sản Miền Trung', icon: '⛰️' },
                            { id: 13, name: 'Cố Đô Huế', subtitle: 'Đại Nội & Chùa Thiên Mụ', price: 260, baseRent: 55, groupName: 'Di Sản Miền Trung', icon: '🏯' },
                            { id: 14, name: 'Phố Cổ Hội An', subtitle: 'Chùa Cầu & Đèn Lồng Cổ', price: 280, baseRent: 60, groupName: 'Di Sản Miền Trung', icon: '🏮' },
                            { id: 16, name: 'Đà Nẵng', subtitle: 'Cầu Rồng & Bà Nà Hills', price: 300, baseRent: 65, groupName: 'Đô Thị Đáng Sống', icon: '🌉' },
                            { id: 17, name: 'Hải Phòng', subtitle: 'Hoa Phượng Đỏ & Quần Đảo Cát Bà', price: 320, baseRent: 70, groupName: 'Đô Thị Đáng Sống', icon: '⚓' },
                            { id: 19, name: 'Sa Pa', subtitle: 'Đỉnh Fansipan Nóc Nhà Đông Dương', price: 340, baseRent: 75, groupName: 'Kỳ Quan Bắc Bộ', icon: '🏔️' },
                            { id: 20, name: 'Vịnh Hạ Long', subtitle: 'Kỳ Quan Thiên Nhiên Thế Giới', price: 360, baseRent: 80, groupName: 'Kỳ Quan Bắc Bộ', icon: '⛵' },
                            { id: 22, name: 'Hà Nội - Hồ Gươm', subtitle: 'Tháp Rùa & 36 Phố Phường', price: 380, baseRent: 85, groupName: 'Thủ Đô Ngàn Năm Văn Hiến', icon: '🐢' },
                            { id: 23, name: 'Hà Nội - Ba Đình', subtitle: 'Quảng Trường & Văn Miếu', price: 400, baseRent: 90, groupName: 'Thủ Đô Ngàn Năm Văn Hiến', icon: '⭐' },
                          ]);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 transition flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Mặc Định</span>
                      </button>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                    {monopolyCustomTiles.map((tile, idx) => (
                      <div key={tile.id} className="p-2.5 bg-white rounded-xl border border-w-border flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="w-6 h-6 rounded-lg bg-w-bg-tag text-xs font-black flex items-center justify-center border border-w-border text-w-text-muted">
                            #{tile.id}
                          </span>
                          <span className="text-base">{tile.icon || '🏠'}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {tile.groupName}
                          </span>
                        </div>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-1.5 w-full">
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              value={tile.name}
                              placeholder="Tên ô đất..."
                              onChange={(e) => {
                                const next = [...monopolyCustomTiles];
                                next[idx] = { ...next[idx], name: e.target.value };
                                setMonopolyCustomTiles(next);
                              }}
                              className="w-full bg-w-bg-card border border-slate-200 focus:border-w-primary-dark text-w-text-main font-bold text-xs px-2 py-1 rounded-lg focus:outline-none"
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold text-slate-500">Giá: $</span>
                              <input
                                type="number"
                                value={tile.price || 100}
                                min={20}
                                step={10}
                                onChange={(e) => {
                                  const next = [...monopolyCustomTiles];
                                  next[idx] = { ...next[idx], price: Number(e.target.value) };
                                  setMonopolyCustomTiles(next);
                                }}
                                className="w-full bg-w-bg-card border border-slate-200 focus:border-w-primary-dark text-emerald-800 font-bold text-xs px-1.5 py-1 rounded-lg focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold text-slate-500">Thuê: $</span>
                              <input
                                type="number"
                                value={tile.baseRent || 15}
                                min={5}
                                step={5}
                                onChange={(e) => {
                                  const next = [...monopolyCustomTiles];
                                  next[idx] = { ...next[idx], baseRent: Number(e.target.value) };
                                  setMonopolyCustomTiles(next);
                                }}
                                className="w-full bg-w-bg-card border border-slate-200 focus:border-w-primary-dark text-amber-800 font-bold text-xs px-1.5 py-1 rounded-lg focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 13. WEREWOLF (MA SÓI - NGÔI LÀNG BÍ ẨN) SPECIFIC SETTINGS */}
          {isWerewolf && (
            <div className="space-y-4 bg-slate-900/90 text-slate-100 p-4 sm:p-5 rounded-2xl border-2 border-indigo-500/40 shadow-xl">
              <div className="flex items-center justify-between pb-1 border-b border-indigo-500/30">
                <label className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span>🐺 Cấu Hình Ma Sói: Ngôi Làng Bí Ẩn</span>
                </label>
                <span className="text-[10px] text-indigo-300 font-black bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-400/40">
                  12 AI NPCs Engine
                </span>
              </div>

              {/* Grid Cấu Hình Cơ Bản */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-xs text-indigo-200 font-bold block mb-1">Chế độ câu hỏi kiến thức:</span>
                  <select
                    value={werewolfSkipQuestions ? 'skip' : 'normal'}
                    onChange={(e) => setWerewolfSkipQuestions(e.target.value === 'skip')}
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-indigo-400 shadow-xs"
                  >
                    <option value="normal">📖 Trả lời câu hỏi ➔ Mở quyền vote</option>
                    <option value="skip">⚡ Bỏ qua câu hỏi ➔ Vào thẳng vote</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs text-indigo-200 font-bold block mb-1">Số lượng Ma Sói ẩn mình:</span>
                  <select
                    value={werewolfWolfCount}
                    onChange={(e) => setWerewolfWolfCount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-indigo-400 shadow-xs"
                  >
                    <option value={2}>2 Ma Sói (Dễ điều tra)</option>
                    <option value={3}>3 Ma Sói (Chuẩn 12 NPC)</option>
                    <option value={4}>4 Ma Sói (Nguy hiểm cực độ)</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs text-indigo-200 font-bold block mb-1">Chế độ đoán nhân dạng:</span>
                  <select
                    value={werewolfGuessMode}
                    onChange={(e) => setWerewolfGuessMode(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-indigo-400 shadow-xs"
                  >
                    <option value="is_werewolf">Chỉ đoán Sói / Dân (Dễ)</option>
                    <option value="exact_role">Đoán đúng chức năng chi tiết (Khó)</option>
                  </select>
                </div>
              </div>

              {/* Phân bổ chức năng đặc biệt */}
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
                <span className="text-xs text-indigo-300 font-bold block">
                  🛡️ Kích hoạt chức năng đặc biệt của Dân làng:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <label className="flex items-center gap-2 p-2 bg-slate-900/90 rounded-lg border border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={werewolfAllowedRoles.seer}
                      onChange={(e) => setWerewolfAllowedRoles(prev => ({ ...prev, seer: e.target.checked }))}
                      className="w-3.5 h-3.5 accent-indigo-500 rounded"
                    />
                    <span className="text-xs font-bold text-slate-200">🔮 Tiên Tri</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-900/90 rounded-lg border border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={werewolfAllowedRoles.guard}
                      onChange={(e) => setWerewolfAllowedRoles(prev => ({ ...prev, guard: e.target.checked }))}
                      className="w-3.5 h-3.5 accent-indigo-500 rounded"
                    />
                    <span className="text-xs font-bold text-slate-200">🛡️ Bảo Vệ</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-900/90 rounded-lg border border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={werewolfAllowedRoles.witch}
                      onChange={(e) => setWerewolfAllowedRoles(prev => ({ ...prev, witch: e.target.checked }))}
                      className="w-3.5 h-3.5 accent-indigo-500 rounded"
                    />
                    <span className="text-xs font-bold text-slate-200">🧪 Phù Thủy</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-900/90 rounded-lg border border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={werewolfAllowedRoles.hunter}
                      onChange={(e) => setWerewolfAllowedRoles(prev => ({ ...prev, hunter: e.target.checked }))}
                      className="w-3.5 h-3.5 accent-indigo-500 rounded"
                    />
                    <span className="text-xs font-bold text-slate-200">🏹 Thợ Săn</span>
                  </label>
                </div>
              </div>

              {/* Cài đặt điểm & Manh mối */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-xs text-indigo-200 font-bold block mb-1">Điểm cơ bản mỗi câu:</span>
                  <select
                    value={werewolfBaseGuessPoint}
                    onChange={(e) => setWerewolfBaseGuessPoint(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-indigo-400 shadow-xs"
                  >
                    <option value={50}>50 Điểm</option>
                    <option value={100}>100 Điểm (Chuẩn)</option>
                    <option value={150}>150 Điểm</option>
                    <option value={200}>200 Điểm</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs text-indigo-200 font-bold block mb-1">Hệ số đoán đúng nhân dạng:</span>
                  <select
                    value={werewolfGuessMultiplier}
                    onChange={(e) => setWerewolfGuessMultiplier(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-indigo-400 shadow-xs"
                  >
                    <option value={1.5}>×1.5 (Vừa phải)</option>
                    <option value={2}>×2.0 (Chuẩn thưởng)</option>
                    <option value={3}>×3.0 (Đại tiệc điểm)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-center space-y-1.5 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={werewolfEnablePublicClues}
                      onChange={(e) => setWerewolfEnablePublicClues(e.target.checked)}
                      className="w-4 h-4 accent-indigo-500 rounded"
                    />
                    <span className="text-xs font-bold text-slate-300">Hiện manh mối hiện trường sáng</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={werewolfRevealRoleOnDeath}
                      onChange={(e) => setWerewolfRevealRoleOnDeath(e.target.checked)}
                      className="w-4 h-4 accent-indigo-500 rounded"
                    />
                    <span className="text-xs font-bold text-slate-300">Lộ vai trò khi NPC tử nạn</span>
                  </label>
                </div>
              </div>

              <div className="p-2.5 bg-indigo-950/70 rounded-xl border border-indigo-500/30 text-xs text-indigo-200 font-medium leading-relaxed">
                🕵️‍♂️ <strong>Cơ chế điều tra giáo dục:</strong> Hệ thống bốc ngẫu nhiên 1 đội mỗi lượt. Đội trả lời đúng câu hỏi kiến thức để mở khóa quyền chọn 1 NPC còn sống và dự đoán vai trò. Đoán đúng cộng điểm thưởng và hé lộ nhân dạng; trả lời sai hoặc đoán sai sẽ chuyển lượt tiếp theo. Giáo viên có thể bật <strong>Bảng Debug Bí Mật</strong> để xem toàn bộ tư duy AI.
              </div>
            </div>
          )}

          {/* 14. Case Investigation (Hồ Sơ Vụ Án) */}
          {isCaseInvestigation && (
            <div className="space-y-4 bg-amber-950/90 p-4 sm:p-5 rounded-2xl border-2 border-amber-500/60 text-amber-50 shadow-xl">
              <div className="flex items-center justify-between border-b border-amber-700/60 pb-3">
                <label className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <span className="text-base">🔎</span>
                  <span>Thiết Lập Vụ Án Thám Tử (Conan Mystery)</span>
                </label>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-600 text-white shadow-xs">
                  Logic Deduction
                </span>
              </div>

              {/* Case Preset Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                  <span>📁 Chọn Vụ Án Điều Tra:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'case_lab_poison',
                      title: 'Vụ Án Phòng Thí Nghiệm',
                      badge: 'Đầu Độc & Đánh Tráo',
                      icon: '🧪',
                      desc: 'Bình mẫu enzyme bị đổ, viên nang giải độc bị đánh tráo.'
                    },
                    {
                      id: 'case_gallery_theft',
                      title: 'Vụ Trộm Tranh Sơn Mài Cổ',
                      badge: 'Tráo Tranh & Khói Nhân Tạo',
                      icon: '🎨',
                      desc: 'Bức tranh quý biến mất trong 2 phút mất điện tại phòng tranh.'
                    },
                    {
                      id: 'case_theatre_collapse',
                      title: 'Sự Cố Đèn Chùm Rạp Hát',
                      badge: 'Cắt Dây Cáp & Giả Chứng Cứ',
                      icon: '🎭',
                      desc: 'Dây cáp đèn sân khấu bị cắt ngọt trước giờ công diễn 15 phút.'
                    }
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCasePresetId(c.id)}
                      className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                        casePresetId === c.id
                          ? 'bg-amber-900/90 border-amber-400 text-amber-100 shadow-lg shadow-amber-950/60 scale-[1.02]'
                          : 'bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{c.icon}</span>
                          <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/40">
                            {c.badge}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-amber-200 line-clamp-1">{c.title}</h4>
                        <p className="text-[11px] text-zinc-300 font-medium line-clamp-2 mt-1 leading-relaxed">
                          {c.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Investigation Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-200">
                    🎯 Số Lượt Đoán Tối Đa (Max Guesses):
                  </label>
                  <select
                    value={caseMaxGuesses}
                    onChange={(e) => setCaseMaxGuesses(parseInt(e.target.value, 10))}
                    className="w-full bg-zinc-900 text-amber-100 p-2.5 rounded-xl border border-amber-600/40 text-xs font-bold focus:outline-none focus:border-amber-400"
                  >
                    <option value={1}>1 Lượt Đoán (Thử Thách Cao)</option>
                    <option value={2}>2 Lượt Đoán (Tiêu Chuẩn)</option>
                    <option value={3}>3 Lượt Đoán (Dễ Hơn)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-200">
                    ⚖️ Độ Khó Suy Luận:
                  </label>
                  <select
                    value={caseDifficulty}
                    onChange={(e) => setCaseDifficulty(e.target.value as any)}
                    className="w-full bg-zinc-900 text-amber-100 p-2.5 rounded-xl border border-amber-600/40 text-xs font-bold focus:outline-none focus:border-amber-400"
                  >
                    <option value="easy">Dễ (Nhiều manh mối mở sẵn)</option>
                    <option value="medium">Vừa (Đầy đủ Red Herrings)</option>
                    <option value="hard">Khó (Đòi hỏi xâu chuỗi nhiều lời khai)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-amber-900/60 rounded-xl border border-amber-600/40 text-xs text-amber-200 leading-relaxed font-medium">
                💡 <strong>Luật chơi phá án:</strong> Mỗi đội trả lời câu hỏi kiến thức để mở khóa điểm điều tra (AP) khám nghiệm vật chứng, thẩm vấn nghi phạm và đối chiếu timeline. Đội chỉ điểm đúng hung thủ + vật chứng quyết định sẽ phá án thành công và mở màn sự thật!
              </div>
            </div>
          )}

          {/* 15. TEA BATTLE (TRẬN CHIẾN TRÀ) CONFIG PANEL */}
          {isTeaBattle && (
            <div className="space-y-4 bg-emerald-950/80 p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/40 text-emerald-100 shadow-xl">
              <div className="flex items-center justify-between border-b border-emerald-800/80 pb-2">
                <label className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                  <span>🍵 Cấu Hình Trận Chiến Trà / Đối Kháng</span>
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Battle Engine
                </span>
              </div>

              {/* Theme selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-emerald-200">
                  🎨 Chủ Đề Trận Chiến:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'tea', name: 'Trận Chiến Trà', icon: '🍵' },
                    { id: 'cookie', name: 'Đại Chiến Bánh Quy', icon: '🍪' },
                    { id: 'energy', name: 'Đại Chiến Năng Lượng', icon: '⚡' },
                    { id: 'cat_fish', name: 'Mèo Tranh Cá', icon: '🐱' },
                    { id: 'castle', name: 'Công Thành Chiến', icon: '🏰' },
                    { id: 'space', name: 'Chiến Hạm Vũ Trụ', icon: '🚀' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTeaBattleTheme(t.id as any)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                        teaBattleTheme === t.id
                          ? 'bg-emerald-600 text-white font-bold border-emerald-400 shadow-md'
                          : 'bg-emerald-900/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/70'
                      }`}
                    >
                      <span className="text-lg">{t.icon}</span>
                      <span className="text-xs">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* HP and Action Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-200">
                    ❤️ Lượng Máu Khởi Đầu (HP):
                  </label>
                  <select
                    value={teaBattleInitialHp}
                    onChange={e => setTeaBattleInitialHp(Number(e.target.value))}
                    className="w-full bg-emerald-900/90 text-emerald-100 p-2.5 rounded-xl border border-emerald-700 text-xs font-bold focus:outline-none focus:border-emerald-400 cursor-pointer"
                  >
                    <option value={3}>3 HP (Ván đấu nhanh)</option>
                    <option value={5}>5 HP (Tiêu chuẩn lớp học)</option>
                    <option value={10}>10 HP (Chiến dịch dài)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-200">
                    ⚔️ Cách Thức Ra Đòn:
                  </label>
                  <select
                    value={teaBattleActionMode}
                    onChange={e => setTeaBattleActionMode(e.target.value as any)}
                    className="w-full bg-emerald-900/90 text-emerald-100 p-2.5 rounded-xl border border-emerald-700 text-xs font-bold focus:outline-none focus:border-emerald-400 cursor-pointer"
                  >
                    <option value="manual">Tự chọn chiêu thức (Chiến thuật)</option>
                    <option value="random">Quay vòng quay ngẫu nhiên (May rủi)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 16. BOWLING CONFIG PANEL */}
          {isBowling && (
            <div className="space-y-4 bg-stone-900 p-4 sm:p-5 rounded-2xl border-2 border-amber-500/40 text-amber-100 shadow-xl">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <label className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <span>🎳 Cấu Hình Bowling Trí Tuệ</span>
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Physics & Spin Engine
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-200">
                    🎯 Số Khung Ném (Frames):
                  </label>
                  <select
                    value={bowlingFrames}
                    onChange={e => setBowlingFrames(Number(e.target.value))}
                    className="w-full bg-stone-950 text-amber-100 p-2.5 rounded-xl border border-amber-600/40 text-xs font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value={3}>3 Khung (Nhanh)</option>
                    <option value={5}>5 Khung (Tiêu Chuẩn)</option>
                    <option value={10}>10 Khung (Thi Đấu)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-200">
                    ⭐ Pin Đặc Biệt (Vàng / Thưởng):
                  </label>
                  <select
                    value={bowlingSpecialPins ? 'yes' : 'no'}
                    onChange={e => setBowlingSpecialPins(e.target.value === 'yes')}
                    className="w-full bg-stone-950 text-amber-100 p-2.5 rounded-xl border border-amber-600/40 text-xs font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="yes">Bật (Pin Vàng x2, Pin Thưởng +10)</option>
                    <option value="no">Tắt (Pin Bình Thường)</option>
                  </select>
                </div>
              </div>

              {/* Difficulty & Lane Friction Setting */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-200 flex items-center justify-between">
                    <span>🎚️ Độ Khó & Ma Sát Sàn (Lane Friction):</span>
                  </label>
                  <select
                    value={bowlingDifficulty}
                    onChange={e => {
                      const diff = e.target.value as 'easy' | 'medium' | 'hard';
                      setBowlingDifficulty(diff);
                      if (diff === 'easy') setBowlingLaneFriction(1.45);
                      else if (diff === 'hard') setBowlingLaneFriction(0.55);
                      else setBowlingLaneFriction(1.0);
                    }}
                    className="w-full bg-stone-950 text-amber-100 p-2.5 rounded-xl border border-amber-600/40 text-xs font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="easy">Dễ (Sàn Khô - Ma Sát Cao 1.45x - Hook mạnh)</option>
                    <option value="medium">Vừa (Sàn Chuẩn - Cân Bằng 1.0x - Chuẩn thi đấu)</option>
                    <option value="hard">Khó (Sàn Dầu - Ma Sát Thấp 0.55x - Trơn trượt)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-200">
                    🌪️ Cơ Chế Xoáy Bóng (Spin Mechanic):
                  </label>
                  <div className="p-2.5 bg-stone-950/80 rounded-xl border border-stone-800 text-xs text-amber-300/90 font-medium">
                    {bowlingDifficulty === 'easy' && (
                      <p>🟢 <strong>Sàn Khô:</strong> Lực ma sát cao giúp bóng ăn xoáy sớm từ 22% chiều dài sàn, tạo đường lượn hook rộng và dễ kiểm soát.</p>
                    )}
                    {bowlingDifficulty === 'medium' && (
                      <p>🟡 <strong>Sàn Chuẩn:</strong> Dầu chuyển tiếp ở 32% sàn, độ lượn spin cân bằng theo chuẩn giải đấu.</p>
                    )}
                    {bowlingDifficulty === 'hard' && (
                      <p>🔴 <strong>Sàn Dầu:</strong> Sàn trơn làm bóng trượt xa tới 45% mới bám sàn, góc hook hẹp đòi hỏi căn chỉnh chính xác.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 17. CHASE (CUỘC ĐUỔI BẮT) CONFIG PANEL */}
          {isChase && (
            <div className="space-y-4 bg-slate-900 p-4 sm:p-5 rounded-2xl border-2 border-indigo-500/40 text-indigo-100 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <label className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                  <span>🏃‍♂️ Cấu Hình Cuộc Đuổi Bắt (Chase Race)</span>
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Boardgame Race
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-indigo-200">
                    🏁 Chiều Dài Đường Đua:
                  </label>
                  <select
                    value={chaseBoardTiles}
                    onChange={e => setChaseBoardTiles(Number(e.target.value))}
                    className="w-full bg-slate-950 text-indigo-100 p-2.5 rounded-xl border border-indigo-600/40 text-xs font-bold focus:outline-none focus:border-indigo-400 cursor-pointer"
                  >
                    <option value={15}>15 Ô (Đua Chớp Nhoáng)</option>
                    <option value={20}>20 Ô (Tiêu Chuẩn)</option>
                    <option value={30}>30 Ô (Đường Dài Thử Thách)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-indigo-200">
                    🎲 Mật Độ Ô Đặc Biệt (Bẫy, Boost, Đổi Chỗ):
                  </label>
                  <select
                    value={chaseSpecialTileDensity}
                    onChange={e => setChaseSpecialTileDensity(e.target.value as any)}
                    className="w-full bg-slate-950 text-indigo-100 p-2.5 rounded-xl border border-indigo-600/40 text-xs font-bold focus:outline-none focus:border-indigo-400 cursor-pointer"
                  >
                    <option value="low">Ít (Đua ổn định)</option>
                    <option value="medium">Vừa (Đầy đủ bất ngờ)</option>
                    <option value="high">Nhiều (Hỗn loạn cực vui)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {gameId === 'race' && (
            <div className="space-y-3 bg-blue-50/40 p-4 rounded-2xl border border-blue-100">
              <label className="text-xs font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-2">
                <span>🏎️ Chủ Đề Phương Tiện Đua</span>
              </label>
              <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {[
                  { id: 'moto', name: 'Mô Tô', icon: '🏍️' },
                  { id: 'car', name: 'Ô Tô', icon: '🚗' },
                  { id: 'snail', name: 'Ốc Sên', icon: '🐌' },
                  { id: 'space', name: 'Phi Thuyền', icon: '🚀' },
                  { id: 'horse', name: 'Ngựa', icon: '🐎' },
                  { id: 'doramini', name: 'Doramini', icon: '🚁' }
                ].map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setRaceVehicleType(v.id as any)}
                    className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                      raceVehicleType === v.id
                        ? 'bg-blue-500 text-white border-blue-600 shadow-sm font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg">{v.icon}</span>
                    <span className="text-xs">{v.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Game Theme Selection */}
          {themesToDisplay.length > 1 && (
            <div className="space-y-3 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
              <label className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <span>4. Giao Diện Theme Game</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {themesToDisplay.map((tm) => (
                  <button
                    key={tm.id}
                    type="button"
                    onClick={() => setTheme(tm.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                      theme === tm.id
                        ? 'bg-emerald-500 text-white font-bold shadow-sm border-emerald-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg">{tm.icon}</span>
                    <span className="text-xs font-semibold">{tm.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-w-bg-main border-t border-w-border flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-w-bg-card hover:bg-w-bg-main text-w-text-main font-[700] text-xs sm:text-sm rounded-[14px] border border-w-border transition cursor-pointer min-h-[44px]"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleLaunch}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-w-primary hover:bg-w-primary-hover text-white font-[800] text-sm rounded-[15px] shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 border border-w-primary-hover cursor-pointer min-h-[44px]"
          >
            <Play className="w-4 h-4 fill-current text-amber-500" />
            <span>Vào Chơi Game</span>
          </button>
        </div>
      </div>
    </div>
  );
};
