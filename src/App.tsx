import React, { useState } from 'react';
import { type GameType, type GameId, type GameSetupConfig, type QuestionBank, type Question, type AnswerLog, type Team, PRESET_THEMES } from "./types";
import { DEFAULT_QUESTION_BANKS } from './data/defaultBanks';
import { soundFx } from './utils/audio';

import { QuestionBankEditor } from './components/QuestionBankEditor';
import { GameStatisticsPanel } from './components/GameStatisticsPanel';
import { GameSetupModal } from './components/GameSetupModal';
import { RefillQuestionsModal } from './components/RefillQuestionsModal';
import { SummaryModal } from './components/SummaryModal';
import { GuestLimitModal } from './components/GuestLimitModal';
import { UnauthorizedDomainModal } from './components/UnauthorizedDomainModal';

import { OpenBoxGame } from './components/games/OpenBoxGame';
import { MancalaGame } from './components/games/MancalaGame';
import { WheelGame } from './components/games/WheelGame';
import { LudoGame } from './components/games/LudoGame';
import { BettingGame } from './components/games/BettingGame';
import { BingoGame } from './components/games/BingoGame';
import { TerritoryGame } from './components/games/TerritoryGame';
import { TugOfWarGame } from './components/games/TugOfWarGame';
import { TowerGame } from './components/games/TowerGame';
import { PuzzleGame } from './components/games/PuzzleGame';
import { RaceGame } from './components/games/RaceGame';
import { RandomCallGame } from './components/games/RandomCallGame';
import { AICameraCallGame } from './components/games/AICameraCallGame';
import { LuckyStarGame } from './components/games/LuckyStarGame';

import { EggCallGame } from './components/games/EggCallGame';
import { BlindBoxGame } from './components/games/BlindBoxGame';
import { PokemonGame } from './components/games/PokemonGame';
import { BattleshipGame } from './components/games/BattleshipGame';

import { PictogramGame } from './components/games/PictogramGame';
import { MagicWheelGame } from './components/games/MagicWheelGame';
import { PoseChallengeGame } from './components/games/PoseChallengeGame';
import { CaroGame } from './components/games/CaroGame';
import { ChessGame } from './components/games/ChessGame';

import { WhackMoleGame } from './components/games/WhackMoleGame';
import { ClassificationGame } from './components/games/ClassificationGame';
import { FlagCaptureGame } from './components/games/FlagCaptureGame';
import { SackRaceGame } from './components/games/SackRaceGame';
import { SnailWordSearchGame } from './components/games/SnailWordSearchGame';

import { MineBoomGame } from './components/games/MineBoomGame';
import { GoldMinerGame } from './components/games/GoldMinerGame';
import { BearPassingGame } from './components/games/BearPassingGame';
import { LetterArrangeGame } from './components/games/LetterArrangeGame';
import { ApplePickingGame } from './components/games/ApplePickingGame';
import { SonTinhThuyTinhGame } from "./components/games/SonTinhThuyTinhGame";
import { CoThuGame } from './components/games/CoThuGame';
import { MonopolyGame } from './components/games/MonopolyGame';
import { WerewolfGame } from './components/games/WerewolfGame';
import { CaseInvestigationGame } from './components/games/detective/CaseInvestigationGame';
import { TeaBattleGame } from './components/games/TeaBattleGame';
import { BowlingGame } from './components/games/BowlingGame';
import { ChaseGame } from './components/games/ChaseGame';
import { QuickActionMenu } from './components/QuickActionMenu';

import { BgMusicControllerModal } from './components/BgMusicControllerModal';
import { bgMusicManager } from './utils/bgMusic';

import { LoginButton } from './components/LoginButton';
import { AdminView, WebConfig } from './components/AdminView';
import { QuestionBankView } from './components/QuestionBankView';
import { GameQuickGuideModal } from './components/GameQuickGuideModal';
import { WeyGuideMascot } from './components/WeyGuideMascot';
import { useAuth } from './contexts/AuthContext';
import { useGameUI } from './contexts/GameUIContext';
import { AdminGameUIEditor } from './components/gameUI/AdminGameUIEditor';
import { saveQuestionBankToCloud, deleteCloudQuestionBank, getCloudQuestionBanks, getWebConfigCloud, saveWebConfigCloud } from './lib/db';
import { getPlayLimitStatus, consumePlayCount, PlayLimitStatus } from './utils/playLimit';

import {
  Sparkles,
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Trophy,
  Flame,
  Award,
  Gamepad2,
  CheckCircle2,
  Users,
  Grid,
  HelpCircle,
  Database,
  ShieldCheck,
  Bell,
  Lock,
  Maximize,
  Minimize,
  Key,
  Music,
  Search,
  Tag,
  Filter,
  X,
  Sun,
  Moon,
  Plus,
  Palette,
} from 'lucide-react';

import { GameInfo, GAMES_LIST } from './data/gamesList';

const getTagColor = (tag: string) => {
  return 'bg-w-bg-tag text-w-primary border-w-border/60';
};

const getBadgeStyle = (badge: string) => {
  return 'bg-w-accent-light text-w-primary-dark border-w-accent-border/60';
};

export default function App() {
  const {
    user,
    isAdmin,
    isBlocked,
    errorMessage,
    clearError,
    loginWithGoogle,
    showUnauthorizedModal,
    setShowUnauthorizedModal,
  } = useAuth();

  // Live Game UI Editor Context
  const { isEditorOpen, activeEditorGameId, openEditor, closeEditor } = useGameUI();

  // Render game instance for Admin Live Game UI Editor preview canvas
  const renderEditorGameContent = (gameId: string) => {
    const mockTeams: Team[] = [
      { id: '1', name: 'Đội 1', score: 0, avatar: '🦁', color: '#3B82F6' },
      { id: '2', name: 'Đội 2', score: 0, avatar: '🐯', color: '#EF4444' },
    ];
    const baseMockConfig: GameSetupConfig = {
      gameId: 'lucky_star',
      mode: 'bank',
      teamMode: true,
      teams: mockTeams,
      timerEnabled: true,
      timeLimitSeconds: 30,
      theme: 'basic',
      totalQuestionsNumber: currentQuestions.length || 10,
      studentsList: ['Nguyễn Văn A', 'Trần Thị B', 'Lê Hoàng C', 'Phạm Minh D', 'Vũ Quỳnh E', 'Hoàng Gia F', 'Đặng Thảo G', 'Bùi Đức H'],
    };

    if (gameId === 'lucky_star' || gameId === 'luckystar') {
      return (
        <LuckyStarGame
          config={{ ...baseMockConfig, gameId: 'lucky_star' }}
          questions={currentQuestions}
          onGameEnd={() => {}}
        />
      );
    }
    if (gameId === 'random_call' || gameId === 'randomcall') {
      return (
        <RandomCallGame
          config={{ ...baseMockConfig, gameId: 'randomcall' }}
          questions={currentQuestions}
          onGameEnd={() => {}}
        />
      );
    }
    if (gameId === 'egg_call' || gameId === 'eggcall') {
      return (
        <EggCallGame
          config={{ ...baseMockConfig, gameId: 'eggcall' }}
          questions={currentQuestions}
          onGameEnd={() => {}}
        />
      );
    }
    if (gameId === 'openbox') {
      return (
        <OpenBoxGame
          config={{ ...baseMockConfig, gameId: 'openbox' }}
          questions={currentQuestions}
          onGameEnd={() => {}}
        />
      );
    }
    if (gameId === 'wheel') {
      return (
        <WheelGame
          config={{ ...baseMockConfig, gameId: 'wheel' }}
          questions={currentQuestions}
          onGameEnd={() => {}}
        />
      );
    }
    if (gameId === 'bingo') {
      return (
        <BingoGame
          config={{ ...baseMockConfig, gameId: 'bingo' }}
          questions={currentQuestions}
          onGameEnd={() => {}}
        />
      );
    }
    if (gameId === 'territory') {
      return (
        <TerritoryGame
          config={{ ...baseMockConfig, gameId: 'territory' }}
          questions={currentQuestions}
          onGameEnd={() => {}}
        />
      );
    }
    if (gameId === 'tug_of_war' || gameId === 'tugofwar') {
      return (
        <TugOfWarGame
          config={{ ...baseMockConfig, gameId: 'tugofwar' }}
          questions={currentQuestions}
          onGameEnd={() => {}}
        />
      );
    }
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900 text-white rounded-2xl">
        <h3 className="text-xl font-bold mb-2">Đang xem trước trò chơi {gameId}</h3>
        <p className="text-sm text-slate-400">Chọn các thành phần giao diện trên thanh công cụ để chỉnh sửa trực tiếp.</p>
      </div>
    );
  };

  // Play limit state for guests (3 plays/day)
  const [playLimitStatus, setPlayLimitStatus] = useState<PlayLimitStatus>(() =>
    getPlayLimitStatus(!!user)
  );
  const [isGuestLimitModalOpen, setIsGuestLimitModalOpen] = useState<boolean>(false);

  // Sync play limit when user changes
  React.useEffect(() => {
    setPlayLimitStatus(getPlayLimitStatus(!!user));
  }, [user]);

  // Question banks list with localStorage persistence & automatic preset merging
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>(() => {
    const map = new Map<string, QuestionBank>();
    // Always pre-populate with all default preset question banks (2 standard SGK banks)
    DEFAULT_QUESTION_BANKS.forEach(b => map.set(b.id, b));

    const saved = localStorage.getItem('wey_question_banks_v4') || localStorage.getItem('wey_question_banks_v3') || localStorage.getItem('wey_question_banks_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((b: QuestionBank) => {
            if (b.isPreset) {
              // Only keep preset if it exists in current DEFAULT_QUESTION_BANKS
              const latestPreset = DEFAULT_QUESTION_BANKS.find(def => def.id === b.id);
              if (latestPreset) {
                map.set(b.id, latestPreset);
              }
            } else {
              map.set(b.id, b);
            }
          });
        }
      } catch (e) {}
    }
    return Array.from(map.values());
  });

  // Ensure any newly added DEFAULT_QUESTION_BANKS are merged immediately and obsolete presets removed
  React.useEffect(() => {
    setQuestionBanks(prev => {
      let changed = false;
      const map = new Map<string, QuestionBank>();
      DEFAULT_QUESTION_BANKS.forEach(b => {
        map.set(b.id, b);
      });
      prev.forEach(b => {
        // Keep non-preset banks (user custom created)
        if (!b.isPreset) {
          map.set(b.id, b);
        }
      });
      const result = Array.from(map.values());
      if (result.length !== prev.length) {
        changed = true;
      }
      return changed ? result : prev;
    });
  }, []);

  // Sync questionBanks to localStorage
  React.useEffect(() => {
    localStorage.setItem('wey_question_banks_v4', JSON.stringify(questionBanks));
  }, [questionBanks]);

  // Load cloud question banks when user is logged in
  React.useEffect(() => {
    if (user?.uid) {
      getCloudQuestionBanks(user.uid).then(cloudBanks => {
        if (cloudBanks && cloudBanks.length > 0) {
          setQuestionBanks(prev => {
            const map = new Map<string, QuestionBank>();
            DEFAULT_QUESTION_BANKS.forEach(b => map.set(b.id, b));
            prev.forEach(b => map.set(b.id, b));
            cloudBanks.forEach(b => map.set(b.id, b));
            return Array.from(map.values());
          });
        }
      });
    }
  }, [user?.uid]);

  // Active question bank ID initialized with newest bank
  const [activeBankId, setActiveBankId] = useState<string>(() => {
    const savedId = localStorage.getItem('wey_active_bank_id');
    if (savedId && questionBanks.some(b => b.id === savedId)) return savedId;
    const sorted = [...questionBanks].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    return sorted[0]?.id || DEFAULT_QUESTION_BANKS[0].id;
  });

  React.useEffect(() => {
    localStorage.setItem('wey_active_bank_id', activeBankId);
  }, [activeBankId]);

  // Web Configuration State with localStorage persistence
  const [webConfig, setWebConfig] = useState<WebConfig>(() => {
    const saved = localStorage.getItem('wey_web_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      siteTitle: "WEY'S PLAYGROUND",
      siteSubtitle: "Kho Game Online Sinh Động Của Wey",
      bgImageUrl: "/assets/home-bg.webp",
      announcement: "",
      primaryTheme: "pastel",
      randomCallConfetti: true,
    };
  });

  React.useEffect(() => {
    localStorage.setItem('wey_web_config', JSON.stringify(webConfig));
    document.title = webConfig.siteTitle || "WEY'S PLAYGROUND";
    
    // Apply dynamic theme to both html root and body
    const allThemeNames = ['matcha', 'sakura', 'sky', 'mono', 'deepspace', 'brightclassroom'];
    allThemeNames.forEach(t => {
      document.documentElement.classList.remove(`theme-${t}`);
      document.body.classList.remove(`theme-${t}`);
    });

    const activeTheme = webConfig.primaryTheme || 'pastel';
    if (activeTheme !== 'pastel') {
      document.documentElement.classList.add(`theme-${activeTheme}`);
      document.body.classList.add(`theme-${activeTheme}`);
      document.documentElement.setAttribute('data-theme', activeTheme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [webConfig]);

  // Load web config from cloud on mount
  React.useEffect(() => {
    getWebConfigCloud().then(config => {
      if (config) {
        setWebConfig(prev => ({ ...prev, ...config }));
      }
    });
  }, []);

  // Handler to keep only the single latest question bank ("Chốt cái mới nhất thôi")
  const handleKeepOnlyLatestBank = async () => {
    const sorted = [...questionBanks].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    const latest = sorted[0];
    if (latest) {
      setQuestionBanks([latest]);
      setActiveBankId(latest.id);

      // Also delete old banks from cloud
      const oldBanks = sorted.slice(1);
      for (const bank of oldBanks) {
        if (!bank.isPreset) {
          await deleteCloudQuestionBank(bank.id);
        }
      }
    }
  };

  const [playCounts, setPlayCounts] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('wey_game_play_counts');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('wey_total_questions_answered');
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [gameSortBy, setGameSortBy] = useState<'newest' | 'most_played' | 'alphabetical'>('newest');

  // Audio State
  const [isMuted, setIsMuted] = useState<boolean>(soundFx.getMute());

  // Active Modals
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const [showRefillModal, setShowRefillModal] = useState<boolean>(false);
  const [isQuickGuideOpen, setIsQuickGuideOpen] = useState<boolean>(false);
  const [quickGuideGameId, setQuickGuideGameId] = useState<GameId | string>('openbox');

  const handleRefillConfirm = (updates: Partial<GameSetupConfig>) => {
    if (activeGameConfig) {
      setActiveGameConfig({ ...activeGameConfig, ...updates });
      setShowRefillModal(false);
    }
  };

  // Setup & Active Game state
  const [selectedGameType, setSelectedGameType] = useState<GameType>('openbox');
  const [activeGameConfig, setActiveGameConfig] = useState<GameSetupConfig | null>(null);
  
  // Fullscreen & Stage ResizeObserver state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gameContainerRef = React.useRef<HTMLDivElement>(null);
  const gameStageLayoutRef = React.useRef<HTMLDivElement>(null);
  const [stageMetrics, setStageMetrics] = useState<{
    width: number;
    height: number;
    scale: number;
    isCompactHeight: boolean;
    isVeryCompact: boolean;
    isNarrow: boolean;
    gridTemplateColumns: string;
    gap: string;
    columnCount: number;
  }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    scale: 1,
    isCompactHeight: false,
    isVeryCompact: false,
    isNarrow: false,
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '16px',
    columnCount: 4,
  });

  // ResizeObserver & Fullscreen Aggressive Recalculation on gameContainer and game-stage-layout
  React.useEffect(() => {
    let timeoutIds: any[] = [];

    // Dedicated forcing function to recalculate and dynamically enforce grid-template-columns, gap, and padding
    const forceResetStageLayout = (_entries?: ResizeObserverEntry[]) => {
      const containerEl = gameContainerRef.current;
      const stageEl = gameStageLayoutRef.current;
      const isFsActive = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      // Measure dimensions from stage element or container fallback
      const stageRect = stageEl?.getBoundingClientRect();
      const containerRect = containerEl?.getBoundingClientRect();

      const width = isFsActive
        ? Math.max(window.innerWidth, stageRect?.width || 0, containerRect?.width || 0, document.documentElement.clientWidth || 0)
        : (stageRect?.width || containerRect?.width || window.innerWidth);

      const height = isFsActive
        ? Math.max(window.innerHeight, stageRect?.height || 0, containerRect?.height || 0, document.documentElement.clientHeight || 0)
        : (stageRect?.height || containerRect?.height || window.innerHeight);

      // Calculate adaptive scale factor for standard and projector widescreen displays
      const baseHeight = isFsActive ? 820 : 740;
      const calculatedScale = Math.min(1.2, Math.max(0.75, height / baseHeight));

      const isCompactHeight = height < 740;
      const isVeryCompact = height < 580;
      const isNarrow = width < 768;

      // Dynamically determine gridTemplateColumns & columnCount for true 100% display experience
      let columnCount = 4;
      let gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
      if (width < 500 || (isVeryCompact && width < 600)) {
        columnCount = 1;
        gridTemplateColumns = 'repeat(1, minmax(0, 1fr))';
      } else if (width < 780 || (isCompactHeight && width < 900)) {
        columnCount = 2;
        gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
      } else if (width < 1120) {
        columnCount = 3;
        gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
      } else {
        columnCount = 4;
        gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
      }

      // Dynamically determine gap value to prevent overflow in tight/small window scenarios
      let gap = '16px';
      if (isVeryCompact || width < 480) {
        gap = '6px';
      } else if (isCompactHeight || isNarrow || width < 768) {
        gap = '10px';
      } else if (width < 1024) {
        gap = '12px';
      } else {
        gap = '16px';
      }

      const padY = isVeryCompact ? '4px' : isCompactHeight ? '8px' : isFsActive ? '12px' : '16px';
      const padX = isNarrow ? '6px' : isCompactHeight ? '10px' : isFsActive ? '14px' : '20px';

      // Forcing function directly writes to DOM style properties on both stage and container
      if (stageEl) {
        stageEl.style.setProperty('--stage-grid-cols', gridTemplateColumns);
        stageEl.style.setProperty('--stage-gap', gap);
        stageEl.style.setProperty('--grid-template-columns', gridTemplateColumns);
        stageEl.style.setProperty('--gap', gap);
        stageEl.style.setProperty('--stage-scale', String(calculatedScale));
        stageEl.style.setProperty('--stage-pad-y', padY);
        stageEl.style.setProperty('--stage-pad-x', padX);
      }

      if (containerEl) {
        containerEl.style.setProperty('--stage-width', `${width}px`);
        containerEl.style.setProperty('--stage-height', `${height}px`);
        containerEl.style.setProperty('--stage-scale', String(calculatedScale));
        containerEl.style.setProperty('--stage-pad-y', padY);
        containerEl.style.setProperty('--stage-pad-x', padX);
        containerEl.style.setProperty('--stage-grid-cols', gridTemplateColumns);
        containerEl.style.setProperty('--stage-gap', gap);
        containerEl.style.setProperty('--grid-template-columns', gridTemplateColumns);
        containerEl.style.setProperty('--gap', gap);
      }

      setStageMetrics({
        width,
        height,
        scale: calculatedScale,
        isCompactHeight,
        isVeryCompact,
        isNarrow,
        gridTemplateColumns,
        gap,
        columnCount,
      });
    };

    // Multi-pass recalculation schedule to ensure layout adapts across all browser fullscreen animation phases
    const triggerAggressiveRecalculation = () => {
      // 1. Immediate sync pass
      forceResetStageLayout();

      // 2. RequestAnimationFrame pass
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          forceResetStageLayout();
          window.dispatchEvent(new Event('resize'));
        });
      }

      // 3. Staged timeout passes (20ms, 80ms, 200ms, 400ms)
      [20, 80, 200, 400].forEach(delay => {
        const id = setTimeout(() => {
          forceResetStageLayout();
          window.dispatchEvent(new Event('resize'));
        }, delay);
        timeoutIds.push(id);
      });
    };

    const handleFullscreenChange = () => {
      const isFsActive = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFsActive);
      triggerAggressiveRecalculation();
    };

    // Fullscreen event listeners specifically attached to document, container, and game-stage-layout
    const stageDom = gameStageLayoutRef.current;
    const containerDom = gameContainerRef.current;

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    if (stageDom) {
      stageDom.addEventListener('fullscreenchange', handleFullscreenChange);
      stageDom.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      stageDom.addEventListener('mozfullscreenchange', handleFullscreenChange);
      stageDom.addEventListener('MSFullscreenChange', handleFullscreenChange);
    }

    if (containerDom) {
      containerDom.addEventListener('fullscreenchange', handleFullscreenChange);
      containerDom.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      containerDom.addEventListener('mozfullscreenchange', handleFullscreenChange);
      containerDom.addEventListener('MSFullscreenChange', handleFullscreenChange);
    }

    // ResizeObserver on both the stage layout and outer container
    let resizeObserver: ResizeObserver | null = null;
    try {
      resizeObserver = new ResizeObserver((entries) => {
        forceResetStageLayout(entries);
      });
      if (containerDom) resizeObserver.observe(containerDom);
      if (stageDom) resizeObserver.observe(stageDom);
    } catch (e) {
      console.warn('ResizeObserver initialization:', e);
    }

    const handleWindowResize = () => {
      forceResetStageLayout();
    };
    window.addEventListener('resize', handleWindowResize);

    // Initial update
    triggerAggressiveRecalculation();

    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);

      if (stageDom) {
        stageDom.removeEventListener('fullscreenchange', handleFullscreenChange);
        stageDom.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        stageDom.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        stageDom.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      }

      if (containerDom) {
        containerDom.removeEventListener('fullscreenchange', handleFullscreenChange);
        containerDom.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        containerDom.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        containerDom.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      }

      window.removeEventListener('resize', handleWindowResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [activeGameConfig, isFullscreen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      gameContainerRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true);
        // Aggressively recompute on transition promise resolution
        setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
      }).catch(err => {
        console.warn('Error attempting to enable full-screen mode:', err?.message || err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
      }).catch(err => {
        console.warn('Error attempting to exit full-screen mode:', err?.message || err);
      });
    }
  };

  // Search and Tag Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    GAMES_LIST.forEach(game => {
      if (game.tags) {
        game.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, []);

  const filteredGames = React.useMemo(() => {
    return GAMES_LIST.filter(game => {
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            game.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag ? (game.tags && game.tags.includes(selectedTag)) : true;
      return matchesSearch && matchesTag;
    });
  }, [searchQuery, selectedTag]);

  // View state
  const [currentView, setCurrentView] = useState<'home' | 'question-bank' | 'bank-editor' | 'admin'>('home');
  const [isBgMusicModalOpen, setIsBgMusicModalOpen] = useState<boolean>(false);

  // Summary state
  const [lastGameAnswerLogs, setLastGameAnswerLogs] = useState<AnswerLog[]>([]);
  const [lastGameTeams, setLastGameTeams] = useState<Team[]>([]);
  const [lastGameConfig, setLastGameConfig] = useState<GameSetupConfig | null>(null);

  const toggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  const handleOpenQuickGuide = (gameId: GameId | string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundFx.cardFlip();
    setQuickGuideGameId(gameId);
    setIsQuickGuideOpen(true);
  };

  const handleOpenSetup = (gameType: GameType) => {
    // Check guest play limits
    const status = getPlayLimitStatus(!!user);
    setPlayLimitStatus(status);

    if (!user && !status.allowed) {
      soundFx.wrong();
      setIsGuestLimitModalOpen(true);
      return;
    }

    soundFx.buttonClick();
    setSelectedGameType(gameType);
    setIsSetupModalOpen(true);
  };

  const handleStartGame = (config: GameSetupConfig) => {
    // Check & consume guest play limit
    const status = getPlayLimitStatus(!!user);
    if (!user) {
      if (!status.allowed) {
        soundFx.wrong();
        setIsGuestLimitModalOpen(true);
        return;
      }
      const updated = consumePlayCount(false);
      setPlayLimitStatus(updated);
    }

    setIsSetupModalOpen(false);
    setActiveGameConfig(config);
    setLastGameConfig(config);
    setLastGameTeams(config.teams);

    setPlayCounts(prev => {
      const newCounts = { ...prev, [config.gameId]: (prev[config.gameId] || 0) + 1 };
      localStorage.setItem('wey_game_play_counts', JSON.stringify(newCounts));
      return newCounts;
    });
  };

  const handleEndGame = (param1?: any, param2?: any) => {
    let resolvedTeams = activeGameConfig?.teams ? [...activeGameConfig.teams] : lastGameConfig?.teams ? [...lastGameConfig.teams] : [];
    let resolvedLogs: AnswerLog[] = [];

    if (Array.isArray(param1) && Array.isArray(param2)) {
      resolvedTeams = param1;
      resolvedLogs = param2;
    } else if (Array.isArray(param1)) {
      if (
        param1.length > 0 &&
        ('isCorrect' in param1[0] || 'questionNumber' in param1[0] || 'correctAnswer' in param1[0])
      ) {
        resolvedLogs = param1;
        if (activeGameConfig?.teams) {
          resolvedTeams = activeGameConfig.teams;
        } else if (lastGameConfig?.teams) {
          resolvedTeams = lastGameConfig.teams;
        }
      } else {
        resolvedTeams = param1;
      }
    }

    const safeTeams = (resolvedTeams || []).map((t, idx) => ({
      id: t?.id || `team_${idx + 1}`,
      name: t?.name || `Đội ${idx + 1}`,
      avatar: t?.avatar || t?.emoji || '⭐',
      color: t?.color || '#3b82f6',
      score: typeof t?.score === 'number' && !isNaN(t.score) ? t.score : 0,
    }));

    setLastGameTeams(safeTeams);
    setLastGameAnswerLogs(resolvedLogs);
    if (resolvedLogs.length > 0) {
      setTotalQuestionsAnswered(prev => {
        const next = prev + resolvedLogs.length;
        localStorage.setItem('wey_total_questions_answered', next.toString());
        return next;
      });
    }
    if (activeGameConfig) {
      setLastGameConfig(activeGameConfig);
    }
    setActiveGameConfig(null);
    setIsSummaryModalOpen(true);
  };

  const handlePlayAgain = () => {
    const configToReplay = activeGameConfig || lastGameConfig;

    // Check & consume guest play limit on play again
    const status = getPlayLimitStatus(!!user);
    if (!user) {
      if (!status.allowed) {
        soundFx.wrong();
        setIsGuestLimitModalOpen(true);
        setActiveGameConfig(null);
        return;
      }
      const updated = consumePlayCount(false);
      setPlayLimitStatus(updated);
    }

    setIsSummaryModalOpen(false);
    if (configToReplay) {
      const resetConfig = {
        ...configToReplay,
        teams: configToReplay.teams.map(t => ({ ...t, score: 0 })),
      };
      setActiveGameConfig(resetConfig);
      setLastGameConfig(resetConfig);
    }
  };

  const handleGoHome = () => {
    setIsSummaryModalOpen(false);
    setActiveGameConfig(null);
  };

  const activeBank = questionBanks.find(b => b.id === activeBankId) || questionBanks[0];
  const currentGameBank = activeGameConfig?.selectedBankId
    ? questionBanks.find(b => b.id === activeGameConfig.selectedBankId) || activeBank
    : activeBank;
  const currentQuestions = currentGameBank?.questions || [];
  const selectedGameInfo = GAMES_LIST.find(g => g.id === selectedGameType) || GAMES_LIST[0];

  const isDeepSpace = webConfig.primaryTheme === 'deepspace';

  const toggleDeepSpaceMode = () => {
    soundFx.cardFlip();
    const nextTheme = isDeepSpace ? 'brightclassroom' : 'deepspace';
    setWebConfig(prev => ({
      ...prev,
      primaryTheme: nextTheme,
    }));
  };

  // Theme background helper
  const getAppBackgroundStyle = () => {
    if (activeGameConfig?.theme) {
      return {
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.4)), url(/assets/themes/${activeGameConfig.theme}.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      };
    }
    if (webConfig.primaryTheme === 'deepspace') {
      return {
        backgroundImage: `radial-gradient(ellipse at top, #1E293B 0%, #0F172A 45%, #0B0F19 100%)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      };
    }
    
    // If custom background image (other than default home-bg) was configured
    if (webConfig.bgImageUrl && webConfig.bgImageUrl !== '/assets/home-bg.webp') {
      return {
        backgroundImage: `url(${webConfig.bgImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      };
    }

    if (!webConfig.primaryTheme || webConfig.primaryTheme === 'pastel') {
      return {
        backgroundImage: `url(/assets/home-bg.webp)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      };
    }

    return {};
  };


  return (
    <div
      className={`min-h-[100dvh] text-w-text-main flex flex-col justify-between selection:bg-w-accent-muted selection:text-w-text-main transition-all duration-700 ${
        !activeGameConfig ? 'bg-w-bg-main/60' : ''
      }`}
      style={getAppBackgroundStyle()}
    >
      {/* Top Announcement Banner if set by Admin */}
      {webConfig.announcement && !activeGameConfig && (
        <div className="bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 text-white text-xs sm:text-sm font-extrabold px-4 py-2 text-center shadow-md flex items-center justify-center gap-2">
          <Bell className="w-4 h-4 animate-bounce shrink-0" />
          <span className="truncate">{webConfig.announcement}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-w-bg-card/90 backdrop-blur-md border-b border-w-border/80 shadow-[0_4px_20px_rgba(79,104,60,0.06)] px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div
            onClick={() => {
              setActiveGameConfig(null);
              setCurrentView('home');
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src="/assets/Picture1.png"
              alt="Wey's Playground Logo"
              className="h-12 sm:h-[54px] w-auto object-contain rounded-xl drop-shadow-[0_3px_6px_rgba(79,104,60,0.12)] group-hover:scale-105 group-hover:-rotate-2 transition-transform duration-300 ease-out"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-[800] text-w-primary-dark tracking-tight leading-none">
                {webConfig.siteTitle || "WEY'S PLAYGROUND"}
              </h1>
              <p className="text-[11px] font-[700] text-w-text-muted mt-0.5">
                {webConfig.siteSubtitle || "Kho Game Online Sinh Động Của Wey"}
              </p>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                setActiveGameConfig(null);
                setCurrentView('question-bank');
              }}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-w-accent-light hover:bg-w-accent-muted text-w-primary-dark font-[700] text-[11px] sm:text-xs rounded-[16px] shadow-sm transition-all duration-200 border border-w-accent-border"
            >
              <Database className="w-4 h-4 text-w-primary-dark" />
              <span className="hidden sm:inline">Ngân Hàng Câu Hỏi</span>
              <span className="sm:hidden">NHCH</span>
            </button>

            {/* ONLY RENDER ADMIN BUTTON IF USER IS AUTHORIZED SUPER ADMIN */}
            {isAdmin && (
              <button
                onClick={() => {
                  soundFx.buttonClick();
                  setActiveGameConfig(null);
                  setCurrentView('admin');
                }}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-w-primary-dark hover:bg-w-primary text-w-bg-card text-xs font-[800] rounded-[18px] shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer border border-w-bg-card/30"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-w-bg-card" />
                <span>Admin Hub</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => {
                  soundFx.buttonClick();
                  openEditor(activeGameConfig?.gameId || 'lucky_star');
                }}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-[800] rounded-[18px] shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer border border-amber-400"
                title="Mở trình chỉnh sửa giao diện trò chơi trực tiếp (Admin Game UI Editor)"
              >
                <Palette className="w-3.5 h-3.5 text-white" />
                <span>UI Editor</span>
              </button>
            )}

            <LoginButton
              onCloudBanksLoaded={banks => {
                const allBanks = [...DEFAULT_QUESTION_BANKS];
                const uniqueBanks = banks.reduce((acc, bank) => {
                  if (!acc.find(b => b.id === bank.id)) acc.push(bank);
                  return acc;
                }, [...allBanks]);
                setQuestionBanks(uniqueBanks);
              }}
            />

            <button
              onClick={toggleMute}
              className="p-2.5 bg-w-bg-card hover:bg-w-bg-alt text-w-primary-dark rounded-[18px] border border-w-border shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer"
              title={isMuted ? 'Bật Âm Thanh' : 'Tắt Âm Thanh'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-w-primary" />
              )}
            </button>

            {/* Background Music Modal Controller Button */}
            <button
              onClick={() => {
                soundFx.buttonClick();
                setIsBgMusicModalOpen(true);
              }}
              className="p-2.5 bg-w-bg-card hover:bg-w-accent-light text-w-primary-dark rounded-[18px] border border-w-accent-border shadow-[0_2px_8px_rgba(79,104,60,0.06)] hover:-translate-y-0.5 transition-all cursor-pointer relative group"
              title="Nhạc Nền Thư Giãn (Looping Background Music)"
            >
              <Music className="w-4 h-4 text-w-primary-dark group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping opacity-75" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
            </button>

            {/* Theme Toggle Button: Deep Space (Dark Mode) vs Bright Classroom (Light Mode) */}
            <button
              onClick={toggleDeepSpaceMode}
              className={`p-2.5 rounded-[18px] border shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer relative group flex items-center gap-1.5 ${
                isDeepSpace
                  ? 'bg-w-bg-alt hover:bg-w-accent-muted text-w-primary border-w-accent-border shadow-md'
                  : 'bg-w-bg-card hover:bg-w-bg-tag text-amber-600 border-w-border'
              }`}
              title={
                isDeepSpace
                  ? 'Đang ở chế độ: Deep Space (Tối) - Bấm để chuyển sang Bright Classroom (Sáng)'
                  : 'Đang ở chế độ: Bright Classroom (Sáng) - Bấm để chuyển sang Deep Space (Tối)'
              }
            >
              {isDeepSpace ? (
                <>
                  <Moon className="w-4 h-4 text-indigo-300 group-hover:rotate-12 transition-transform" />
                  <span className="text-[11px] font-[800] text-indigo-200 hidden lg:inline">Deep Space</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-500 group-hover:rotate-45 transition-transform" />
                  <span className="text-[11px] font-[800] text-amber-700 hidden lg:inline">Lớp Học</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className={`flex-1 flex flex-col w-full mx-auto transition-all ${
        activeGameConfig
          ? 'max-w-[1600px] p-1.5 sm:p-2.5 min-h-0'
          : 'max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6'
      }`}>
        
        {/* Error / Blocked notification */}
        {errorMessage && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-[20px] p-4 flex items-center justify-between gap-3 shadow-md animate-fade-in text-rose-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-200 text-rose-900 flex items-center justify-center font-bold text-sm shrink-0">
                ⚠️
              </div>
              <div className="text-xs font-bold leading-relaxed">{errorMessage}</div>
            </div>
            <button
              onClick={clearError}
              className="wey-btn-danger px-3 py-1 text-xs rounded-lg cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Render Active Game Mode */}
        {activeGameConfig ? (
          <div 
            className={`flex flex-col ${stageMetrics.isCompactHeight ? 'space-y-1' : 'space-y-2'} ${
              isFullscreen ? 'p-1.5 sm:p-2.5 overflow-hidden w-full h-[100dvh] max-h-[100dvh]' : 'flex-1 min-h-0 w-full'
            }`}
            ref={gameContainerRef}
            style={{
              ...(isFullscreen ? getAppBackgroundStyle() : {}),
              ['--stage-width' as any]: `${stageMetrics.width}px`,
              ['--stage-height' as any]: `${stageMetrics.height}px`,
              ['--stage-scale' as any]: `${stageMetrics.scale}`,
              ['--stage-pad-y' as any]: stageMetrics.isVeryCompact ? '4px' : stageMetrics.isCompactHeight ? '8px' : '16px',
              ['--stage-pad-x' as any]: stageMetrics.isNarrow ? '6px' : stageMetrics.isCompactHeight ? '12px' : '20px',
              ['--stage-grid-cols' as any]: stageMetrics.gridTemplateColumns,
              ['--stage-gap' as any]: stageMetrics.gap,
              ['--grid-template-columns' as any]: stageMetrics.gridTemplateColumns,
              ['--gap' as any]: stageMetrics.gap,
            }}
          >
            {/* Active Game Top Bar */}
            <div className={`flex flex-wrap items-center justify-between gap-2 bg-w-bg-card border border-w-border ${
              stageMetrics.isCompactHeight ? 'px-2.5 py-1.5' : 'px-3.5 py-2'
            } rounded-xl shadow-xs wey-paper-card shrink-0 ${isFullscreen ? 'sticky top-0 z-50' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl">{selectedGameInfo?.icon || '🎮'}</span>
                <div>
                  <h3 className="text-xs sm:text-sm font-[800] text-w-text-main flex items-center gap-2">
                    <span>{selectedGameInfo?.title || 'Trò chơi'}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-w-accent-light text-w-primary-dark border border-w-accent-border">
                      Đang chơi
                    </span>
                    {isFullscreen && (
                      <span className="hidden sm:inline text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Phóng to máy chiếu
                      </span>
                    )}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => openEditor(activeGameConfig.gameId)}
                    className="wey-btn-secondary flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg cursor-pointer bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 border border-amber-300 hover:from-amber-200 hover:to-yellow-200"
                    title="Chỉnh sửa giao diện trò chơi hiện tại (Admin UI Editor)"
                  >
                    <Palette className="w-3.5 h-3.5 text-amber-600" />
                    <span className="hidden sm:inline">Chỉnh UI</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="wey-btn-secondary flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg cursor-pointer"
                  title={isFullscreen ? "Thu nhỏ" : "Phóng to toàn màn hình máy chiếu"}
                >
                  {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenQuickGuide(activeGameConfig.gameId)}
                  className="wey-btn-secondary flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg cursor-pointer"
                  title="Xem nhanh hướng dẫn luật chơi"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Luật Chơi</span>
                </button>

                <button
                  type="button"
                  onClick={handleGoHome}
                  className="wey-btn-danger px-2.5 py-1 text-xs rounded-lg cursor-pointer"
                >
                  Thoát Game
                </button>
              </div>
            </div>

            {/* Dynamic Game Stage Layout Container */}
            <div 
              ref={gameStageLayoutRef}
              className="game-stage-layout flex-1 flex flex-col min-h-0 w-full"
              style={{
                ['--stage-grid-cols' as any]: stageMetrics.gridTemplateColumns,
                ['--stage-gap' as any]: stageMetrics.gap,
                ['--grid-template-columns' as any]: stageMetrics.gridTemplateColumns,
                ['--gap' as any]: stageMetrics.gap,
              }}
            >
              
              {(activeGameConfig.gameId === 'lucky_star' || activeGameConfig.gameId === 'luckystar') && (
                <LuckyStarGame config={activeGameConfig} questions={currentQuestions} onGameEnd={handleEndGame} />
              )}
              {activeGameConfig.gameId === 'ai_star_call' && (
                <AICameraCallGame config={activeGameConfig} questions={currentQuestions} onGameEnd={handleEndGame} themeType="star" />
              )}
              {activeGameConfig.gameId === 'ai_galaxy_call' && (
                <AICameraCallGame config={activeGameConfig} questions={currentQuestions} onGameEnd={handleEndGame} themeType="galaxy" />
              )}
              {activeGameConfig.gameId === 'ai_nebula_call' && (
                <AICameraCallGame config={activeGameConfig} questions={currentQuestions} onGameEnd={handleEndGame} themeType="nebula" />
              )}
              {activeGameConfig.gameId === 'ai_bubble_call' && (
                <AICameraCallGame config={activeGameConfig} questions={currentQuestions} onGameEnd={handleEndGame} themeType="bubble" />
              )}
{(activeGameConfig.gameId === 'openbox' || activeGameConfig.gameId === 'open_box') && (
              <OpenBoxGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'mancala' && (
              <MancalaGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'wheel' && (
              <WheelGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'ludo' && (
              <LudoGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'betting' && (
              <BettingGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'bingo' && (
              <BingoGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'territory' && (
              <TerritoryGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'tug_of_war' || activeGameConfig.gameId === 'tugofwar') && (
              <TugOfWarGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'tower' && (
              <TowerGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'puzzle' && (
              <PuzzleGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'race' && (
              <RaceGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'randomcall' && (
              <RandomCallGame
                config={{
                  ...activeGameConfig,
                  randomCallConfetti: activeGameConfig.randomCallConfetti ?? webConfig.randomCallConfetti ?? true
                }}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'eggcall' && (
              <EggCallGame config={activeGameConfig} questions={currentQuestions} onGameEnd={handleEndGame} />
            )}
            {activeGameConfig.gameId === 'blindbox' && (
              <BlindBoxGame config={activeGameConfig} questions={currentQuestions} onGameEnd={handleEndGame} />
            )}
            {activeGameConfig.gameId === 'pokemon' && (
              <PokemonGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'battleship' && (
              <BattleshipGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'pictogram' && (
              <PictogramGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'magic_wheel' && (
              <MagicWheelGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'pose_challenge' || activeGameConfig.gameId === 'posechallenge') && (
              <PoseChallengeGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'caro' && (
              <CaroGame
                config={activeGameConfig}
                questions={currentQuestions}
                banks={questionBanks}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'whack_a_mole' || activeGameConfig.gameId === 'whackamole' || activeGameConfig.gameId === 'whack_mole' || activeGameConfig.gameId === 'whackmole' || activeGameConfig.gameId === 'dap_chuot' || activeGameConfig.gameId === 'dapchuot') && (
              <WhackMoleGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'classification' || activeGameConfig.gameId === 'phanloai' || activeGameConfig.gameId === 'phan_loai') && (
              <ClassificationGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'flag_capture' || activeGameConfig.gameId === 'flagcapture' || activeGameConfig.gameId === 'cuopco' || activeGameConfig.gameId === 'cuop_co') && (
              <FlagCaptureGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'sack_race' || activeGameConfig.gameId === 'sackrace' || activeGameConfig.gameId === 'nhaybaobo' || activeGameConfig.gameId === 'nhay_bao_bo') && (
              <SackRaceGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'snail_word_search' || activeGameConfig.gameId === 'snailwordsearch' || activeGameConfig.gameId === 'snail_words' || activeGameConfig.gameId === 'ocsen' || activeGameConfig.gameId === 'oc_sen') && (
              <SnailWordSearchGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'mine_boom' || activeGameConfig.gameId === 'mineboom' || activeGameConfig.gameId === 'doboom' || activeGameConfig.gameId === 'do_boom') && (
              <MineBoomGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'chess' && (
              <ChessGame
                config={activeGameConfig}
                questions={currentQuestions}
                banks={questionBanks}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'gold_miner' || activeGameConfig.gameId === 'goldminer' || activeGameConfig.gameId === 'daovang') && (
              <GoldMinerGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'bear_pass' || activeGameConfig.gameId === 'bearpass' || activeGameConfig.gameId === 'truyengau') && (
              <BearPassingGame
                config={activeGameConfig}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'letter_arrange' || activeGameConfig.gameId === 'letterarrange' || activeGameConfig.gameId === 'sapxepchu') && (
              <LetterArrangeGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'apple_pick' || activeGameConfig.gameId === 'applepick' || activeGameConfig.gameId === 'haitao') && (
              <ApplePickingGame
                config={activeGameConfig}
                questions={currentQuestions}
                onEndGame={handleEndGame}
                onRunOutOfQuestions={() => setShowRefillModal(true)}
                onUpdateScore={(teamId, delta) => {
                  const saved = localStorage.getItem(`wey_teams_${activeGameConfig.gameId}`);
                  if (saved) {
                    try {
                      const teams = JSON.parse(saved);
                      const updated = teams.map((t: Team) => t.id === teamId ? { ...t, score: (t.score || 0) + delta } : t);
                      localStorage.setItem(`wey_teams_${activeGameConfig.gameId}`, JSON.stringify(updated));
                    } catch {}
                  }
                }}
              />
            )}
            {(activeGameConfig.gameId === 'son_tinh_thuy_tinh' || activeGameConfig.gameId === 'sontinhthuytinh' || activeGameConfig.gameId === 'sontinh_thuytinh') && (
              <SonTinhThuyTinhGame
                config={activeGameConfig}
                questions={currentQuestions}
                onEndGame={handleEndGame}
                onRunOutOfQuestions={() => setShowRefillModal(true)}
                onUpdateScore={(teamId, delta) => {
                  const saved = localStorage.getItem(`wey_teams_${activeGameConfig.gameId}`);
                  if (saved) {
                    try {
                      const teams = JSON.parse(saved);
                      const updated = teams.map((t: Team) => t.id === teamId ? { ...t, score: (t.score || 0) + delta } : t);
                      localStorage.setItem(`wey_teams_${activeGameConfig.gameId}`, JSON.stringify(updated));
                    } catch {}
                  }
                }}
              />
            )}
            {(activeGameConfig.gameId === "cothu" || activeGameConfig.gameId === "co_thu") && (
              <CoThuGame
                config={activeGameConfig}
                questions={currentQuestions}
                onEndGame={handleEndGame}
                onRunOutOfQuestions={() => setShowRefillModal(true)}
                onUpdateScore={(teamId, delta) => {
                  const saved = localStorage.getItem(`wey_teams_${activeGameConfig.gameId}`);
                  if (saved) {
                    try {
                      const teams = JSON.parse(saved);
                      const updated = teams.map((t: Team) => t.id === teamId ? { ...t, score: (t.score || 0) + delta } : t);
                      localStorage.setItem(`wey_teams_${activeGameConfig.gameId}`, JSON.stringify(updated));
                    } catch (e) {}
                  }
                }}
              />
            )}
            {(activeGameConfig.gameId === 'monopoly' || activeGameConfig.gameId === 'cotyphu' || activeGameConfig.gameId === 'co_ty_phu') && (
              <MonopolyGame
                config={activeGameConfig}
                banks={questionBanks}
                activeBankId={activeBankId}
                onBackToHome={() => {
                  handleEndGame([], true);
                  setCurrentView('home');
                }}
                onOpenQuickGuide={(gId) => handleOpenQuickGuide(gId)}
              />
            )}
            {(activeGameConfig.gameId === 'werewolf_village' || activeGameConfig.gameId === 'masoi' || activeGameConfig.gameId === 'werewolf' || activeGameConfig.gameId === 'ma_soi') && (
              <WerewolfGame
                config={activeGameConfig}
                banks={questionBanks}
                activeBankId={activeBankId}
                onBackToHome={() => {
                  handleEndGame([], true);
                  setCurrentView('home');
                }}
                onOpenQuickGuide={(gId) => handleOpenQuickGuide(gId)}
              />
            )}
            {(activeGameConfig.gameId === 'case_investigation' || activeGameConfig.gameId === 'hosovuan' || activeGameConfig.gameId === 'case_mystery') && (
              <CaseInvestigationGame
                config={activeGameConfig}
                questions={currentQuestions}
                onBackToHome={() => {
                  handleEndGame([], true);
                  setCurrentView('home');
                }}
              />
            )}
            {(activeGameConfig.gameId === 'tea_battle' || activeGameConfig.gameId === 'teabattle' || activeGameConfig.gameId === 'tranchientra') && (
              <TeaBattleGame
                config={activeGameConfig}
                questions={currentQuestions}
                onBackToHome={() => {
                  handleEndGame([], true);
                  setCurrentView('home');
                }}
              />
            )}
            {(activeGameConfig.gameId === 'bowling' || activeGameConfig.gameId === 'bowling_game') && (
              <BowlingGame
                config={activeGameConfig}
                questions={currentQuestions}
                onBackToHome={() => {
                  handleEndGame([], true);
                  setCurrentView('home');
                }}
              />
            )}
            {(activeGameConfig.gameId === 'chase' || activeGameConfig.gameId === 'chase_race' || activeGameConfig.gameId === 'cuocduoibat') && (
              <ChaseGame
                config={activeGameConfig}
                questions={currentQuestions}
                onBackToHome={() => {
                  handleEndGame([], true);
                  setCurrentView('home');
                }}
              />
            )}
            </div>
          </div>
        ) : currentView === 'admin' ? (
          <AdminView
            onBackToHome={() => setCurrentView('home')}
            questionBanks={questionBanks}
            activeBankId={activeBankId}
            onSelectActiveBank={bankId => setActiveBankId(bankId)}
            onDeleteBank={async id => {
              const bankToDelete = questionBanks.find(b => b.id === id);
              if (bankToDelete && !bankToDelete.isPreset) {
                await deleteCloudQuestionBank(id);
              }
              setQuestionBanks(prev => {
                const remaining = prev.filter(b => b.id !== id);
                if (activeBankId === id && remaining.length > 0) {
                  setActiveBankId(remaining[0].id);
                }
                return remaining;
              });
            }}
            onKeepOnlyLatestBank={handleKeepOnlyLatestBank}
            onOpenBankManager={bankId => {
              setActiveBankId(bankId);
              setCurrentView('bank-editor');
            }}
            webConfig={webConfig}
            onUpdateWebConfig={newConfig => {
              setWebConfig(newConfig);
              saveWebConfigCloud(newConfig);
            }}
          />
        ) : currentView === 'bank-editor' ? (
          <div>
            <QuestionBankEditor
              banks={questionBanks}
              activeBankId={activeBankId}
              onSelectBank={bankId => setActiveBankId(bankId)}
              onClose={() => setCurrentView('home')}
              onSaveBank={async updatedBank => {
                setQuestionBanks(prev =>
                  prev.map(b => (b.id === updatedBank.id ? updatedBank : b))
                );
                if (user?.uid) {
                  await saveQuestionBankToCloud({
                    ...updatedBank,
                    userId: user.uid,
                    userEmail: user.email || undefined,
                  });
                }
              }}
              onUpdateBank={async updatedBank => {
                setQuestionBanks(prev =>
                  prev.map(b => (b.id === updatedBank.id ? updatedBank : b))
                );
                if (user?.uid) {
                  await saveQuestionBankToCloud({
                    ...updatedBank,
                    userId: user.uid,
                    userEmail: user.email || undefined,
                  });
                }
              }}
              onCreateBank={async newBank => {
                setQuestionBanks(prev => [newBank, ...prev]);
                setActiveBankId(newBank.id);
                if (user?.uid) {
                  await saveQuestionBankToCloud({
                    ...newBank,
                    userId: user.uid,
                    userEmail: user.email || undefined,
                  });
                }
              }}
              onDeleteBank={async bankId => {
                setQuestionBanks(prev => prev.filter(b => b.id !== bankId));
                if (user?.uid) {
                  await deleteCloudQuestionBank(bankId);
                }
              }}
            />
          </div>
        ) : currentView === 'question-bank' ? (
          <QuestionBankView
            onBack={() => setCurrentView('home')}
            questionBanks={questionBanks}
            onUpdateBanks={newBanks => setQuestionBanks(newBanks)}
            activeBankId={activeBankId}
            onSelectActiveBank={bankId => setActiveBankId(bankId)}
            onOpenQuickManager={bankId => {
              setActiveBankId(bankId);
              setCurrentView('bank-editor');
            }}
          />
        ) : (
          /* HOME VIEW - GAME CATALOG, SEARCH & TAGS */
          <div className="space-y-6">
            {/* Active Question Bank Banner & Quick Switcher */}
            <div className="bg-w-bg-card border-2 border-w-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-w-accent-light text-w-primary-dark flex items-center justify-center text-xl shrink-0 border border-w-accent-border">
                  📚
                </div>
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-w-text-muted">
                    Ngân Hàng Câu Hỏi Đang Dùng
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-extrabold text-w-text-main">
                      {activeBank?.name || 'Ngân hàng mặc định'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-w-accent-light text-w-primary-dark border border-w-accent-border">
                      {currentQuestions.length} câu hỏi
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setCurrentView('question-bank')}
                  className="flex-1 sm:flex-initial px-3.5 py-2 bg-white hover:bg-slate-50 text-w-primary-hover text-xs font-extrabold rounded-xl border border-w-border shadow-2xs transition hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5 text-w-primary-dark" />
                  <span>Đổi Bộ Câu Hỏi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView('bank-editor')}
                  className="flex-1 sm:flex-initial px-3.5 py-2 wey-btn-primary text-xs font-extrabold rounded-xl shadow-2xs transition hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Soạn & Quản Lý Câu Hỏi</span>
                </button>
              </div>
            </div>

            {/* Search and Tags Filter Bar */}
            <div className="bg-w-bg-card border-2 border-w-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-w-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm trò chơi theo tên hoặc mô tả (ví dụ: 'đua xe', 'gọi tên', 'vòng quay', 'trắc nghiệm')..."
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-w-border rounded-xl text-xs sm:text-sm font-bold text-w-text-main placeholder-w-text-muted/60 focus:outline-none focus:border-w-primary-dark focus:ring-2 focus:ring-w-primary-dark/20 transition shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-w-text-muted hover:text-w-text-main transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Tag Filtering Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-w-text-muted flex items-center gap-1 mr-1">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Phân loại:</span>
                </div>

                {/* 'All' tag chip */}
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1 ${
                    selectedTag === null
                      ? 'bg-w-primary-dark text-white shadow-xs'
                      : 'bg-white text-w-text-muted border border-w-border hover:bg-w-accent-light'
                  }`}
                >
                  <span>Tất cả</span>
                  <span className="text-[10px] opacity-80">({GAMES_LIST.length})</span>
                </button>

                {/* Individual tag chips */}
                {allTags.map((tag) => {
                  const count = GAMES_LIST.filter(g => g.tags && g.tags.includes(tag)).length;
                  const isActive = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(isActive ? null : tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1 ${
                        isActive
                          ? 'bg-w-primary-dark text-white shadow-xs'
                          : 'bg-white text-w-text-muted border border-w-border hover:bg-w-accent-light'
                      }`}
                    >
                      <span>{tag}</span>
                      <span className="text-[10px] opacity-80">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Result Count and Active Filters Bar */}
              {(searchQuery || selectedTag) && (
                <div className="flex items-center justify-between pt-2 border-t border-w-border/60 text-xs font-bold text-w-text-muted">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-w-primary-dark" />
                    <span>
                      Tìm thấy <strong className="text-w-primary-dark">{filteredGames.length}</strong> trò chơi phù hợp
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTag(null);
                    }}
                    className="text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                  >
                    Xóa tất cả bộ lọc
                  </button>
                </div>
              )}
            </div>

            {/* Games Grid */}
            {filteredGames.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {filteredGames.map((game) => {
                  const playCount = playCounts[game.id] || 0;
                  return (
                    <div
                      key={game.id}
                      className="group wey-game-card p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden"
                    >
                      {/* Top Badges & Meta */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-w-accent-light to-w-accent-muted border border-w-accent-border flex items-center justify-center text-2xl shadow-xs group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 overflow-hidden">
                            {webConfig.gameAvatars?.[game.id] ? (
                              <img src={webConfig.gameAvatars[game.id]} alt={game.title} className="w-full h-full object-cover" />
                            ) : (
                              game.icon
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {game.badge && (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-w-accent-light text-w-primary-dark border border-w-accent-border">
                                {game.badge}
                              </span>
                            )}
                            {playCount > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                                Đã chơi {playCount}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h3 className="text-base font-extrabold text-w-text-main group-hover:text-w-primary-dark transition-colors line-clamp-1">
                            {game.title}
                          </h3>
                          <p className="text-xs text-w-text-muted font-medium mt-1 line-clamp-2 leading-relaxed">
                            {game.description}
                          </p>
                        </div>

                        {/* Tag Badges */}
                        {game.tags && game.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap pt-1">
                            {game.tags.map((t) => (
                              <span
                                key={t}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTag(t);
                                }}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-w-bg-tag text-w-text-muted hover:bg-w-accent-light hover:text-w-primary-dark transition cursor-pointer border border-w-border"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-4 mt-4 border-t border-w-border/70 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenSetup(game.id)}
                          className="flex-1 py-2.5 px-3 wey-btn-primary text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transform group-hover:scale-[1.02]"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Chơi Ngay</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleOpenQuickGuide(game.id, e)}
                          className="p-2.5 wey-btn-secondary rounded-xl cursor-pointer"
                          title="Xem luật chơi"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty Search State */
              <div className="bg-w-bg-card border-2 border-w-border rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-w-accent-light text-w-primary-dark flex items-center justify-center text-3xl mx-auto shadow-xs border border-w-accent-border">
                  🔍
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-w-text-main">
                    Không tìm thấy trò chơi nào
                  </h3>
                  <p className="text-xs text-w-text-muted font-medium mt-1 leading-relaxed">
                    Không có trò chơi nào khớp với từ khóa "{searchQuery}" hoặc phân loại đã chọn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTag(null);
                  }}
                  className="px-5 py-2.5 wey-btn-primary text-xs rounded-xl cursor-pointer"
                >
                  Xem Tất Cả Trò Chơi
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      {!activeGameConfig && currentView === 'home' && (
        <footer className="w-full text-center py-6 mt-8 border-t border-w-border bg-w-bg-card/80">
          <p className="text-w-text-muted font-bold text-sm">© 2026 Wey Playground. All rights reserved.</p>
        </footer>
      )}

      {/* Wey Guide Mascot */}
      {!activeGameConfig && currentView === 'home' && (
        <WeyGuideMascot onSelectGame={handleOpenSetup} />
      )}

      {/* Modals */}
      {isSetupModalOpen && selectedGameInfo && (
        <GameSetupModal
          isOpen={isSetupModalOpen}
          onClose={() => setIsSetupModalOpen(false)}
          gameId={selectedGameInfo.id as GameId}
          gameTitle={selectedGameInfo.title}
          gameIcon={selectedGameInfo.icon}
          gameDescription={selectedGameInfo.description || ''}
          availableThemes={PRESET_THEMES.map(t => t.id)}
          banks={questionBanks}
          activeBankId={activeBankId}
          onStartGame={handleStartGame}
        />
      )}

      {showRefillModal && (
        <RefillQuestionsModal
          isOpen={showRefillModal}
          onClose={() => setShowRefillModal(false)}
          banks={questionBanks}
          currentConfig={activeGameConfig!}
          onConfirm={handleRefillConfirm}
          onSummary={() => {
            setShowRefillModal(false);
            if (activeGameConfig) {
              handleEndGame({}, []);
            }
          }}
        />
      )}

      <BgMusicControllerModal
        isOpen={isBgMusicModalOpen}
        onClose={() => setIsBgMusicModalOpen(false)}
      />

      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        teams={lastGameTeams}
        answerLogs={lastGameAnswerLogs}
        onPlayAgain={() => {
          setIsSummaryModalOpen(false);
          if (lastGameConfig) {
            handleStartGame(lastGameConfig);
          }
        }}
        onGoHome={() => {
          setIsSummaryModalOpen(false);
          setActiveGameConfig(null);
          setCurrentView('home');
        }}
      />

      <GuestLimitModal
        isOpen={isGuestLimitModalOpen}
        onClose={() => setIsGuestLimitModalOpen(false)}
        guestId={playLimitStatus?.guestId || ''}
        playsUsed={playLimitStatus?.playsUsed || 0}
        maxPlays={playLimitStatus?.maxPlays || 3}
      />

      <UnauthorizedDomainModal
        isOpen={showUnauthorizedModal}
        onClose={() => setShowUnauthorizedModal(false)}
      />

      <GameQuickGuideModal
        isOpen={isQuickGuideOpen}
        onClose={() => setIsQuickGuideOpen(false)}
        gameId={quickGuideGameId}
        onStartGame={() => {
          setIsQuickGuideOpen(false);
          if (quickGuideGameId) {
            const foundGame = GAMES_LIST.find(g => g.id === quickGuideGameId);
            if (foundGame) {
              handleOpenSetup(foundGame.id as GameType);
            }
          }
        }}
      />

      <QuickActionMenu
        onOpenQuestionBanks={() => setCurrentView('question-bank')}
        isGameActive={activeGameConfig !== null}
        onResetActiveGame={() => {
          if (activeGameConfig) {
            handleStartGame(activeGameConfig);
          }
        }}
      />

      {/* Admin Live Game UI Editor */}
      {isAdmin && isEditorOpen && (
        <AdminGameUIEditor
          onClose={closeEditor}
          renderGameContent={renderEditorGameContent}
        />
      )}
    </div>
  );
}


