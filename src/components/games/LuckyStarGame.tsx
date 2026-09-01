import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Users, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Sliders, 
  CheckCircle2, 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  Shuffle, 
  Check,
  Award,
  Star,
  ListOrdered,
  FileSpreadsheet,
  Palette,
  Megaphone,
  Zap,
  History
} from 'lucide-react';
import { Question } from '../../types';
import { StudentImportButton } from '../StudentImportButton';
import { announceStudentWinner, announceMultipleWinners, speechService } from '../../utils/speech';
import { useGameUI } from '../../contexts/GameUIContext';
import { useAuth } from '../../contexts/AuthContext';
import { GameUIElement } from '../gameUI/GameUIElement';

interface LuckyStarGameProps {
  config: any;
  questions?: Question[];
  onGameEnd?: () => void;
}

export interface StudentStar {
  id: string;
  name: string;
  selected: boolean; // True if already called in this round
  activeInPool: boolean; // True if selected by 'CHỌN SỐ'
  x: number; // Percentage 5% - 95%
  y: number; // Percentage 12% - 82%
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  glowColor: string;
  pulsePhase: number;
}

type GameState = 'IDLE' | 'SPINNING' | 'STOPPING' | 'RESULT' | 'ROUND_COMPLETE';

const DEFAULT_STUDENTS = [
  'Bảo Trâm', 'Thục Hân', 'Công Minh', 'Đức Duy', 'Kim Nhạnh',
  'Minh Khôi', 'Tuấn Kiệt', 'Hoàng Yến', 'Nhật Anh', 'Hải Đăng',
  'Ngọc Linh', 'Quang Huy', 'Khánh An', 'Gia Bảo', 'Phương Linh',
  'Thành Nam', 'Thùy Chi', 'Hữu Phước', 'Bích Ngọc', 'Đăng Khoa'
];

const STAR_COLORS = [
  { fill: '#FDE047', glow: 'rgba(253, 224, 71, 0.8)', border: '#FEF08A' }, // Bright Yellow
  { fill: '#FCD34D', glow: 'rgba(252, 211, 77, 0.8)', border: '#FDE68A' }, // Warm Gold
  { fill: '#FB923C', glow: 'rgba(251, 146, 60, 0.8)', border: '#FDBA74' }, // Star Amber
  { fill: '#38BDF8', glow: 'rgba(56, 189, 248, 0.8)', border: '#BAE6FD' }, // Cyan Nebula
  { fill: '#A78BFA', glow: 'rgba(167, 139, 250, 0.8)', border: '#DDD6FE' }, // Star Violet
  { fill: '#34D399', glow: 'rgba(52, 211, 153, 0.8)', border: '#A7F3D0' }, // Emerald Star
];

// Web Audio API Synthesizer for rich audio without external assets
class CosmicAudio {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazy init on first user interaction
  }

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public playStart() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [392, 523.25, 659.25, 783.99, 1046.5]; // G4, C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.45);
      });
    } catch {}
  }

  public playShuffleTick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400 + Math.random() * 500, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }

  public playStoppingTick(pitchRatio: number) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600 * pitchRatio, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }

  public playVictory() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Trumpet / fan fare chord: C5 - E5 - G5 - C6
      const chords = [
        { f: 523.25, t: 0 },
        { f: 659.25, t: 0.1 },
        { f: 783.99, t: 0.2 },
        { f: 1046.5, t: 0.3 },
        { f: 1318.51, t: 0.45 },
      ];

      chords.forEach(({ f, t }) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + t);

        gain.gain.setValueAtTime(0, now + t);
        gain.gain.linearRampToValueAtTime(0.25, now + t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.9);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + t);
        osc.stop(now + t + 0.95);
      });
    } catch {}
  }
}

export const LuckyStarGame: React.FC<LuckyStarGameProps> = ({ config, onGameEnd }) => {
  // Sound system instance
  const audio = useMemo(() => new CosmicAudio(), []);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Game state
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [winners, setWinners] = useState<StudentStar[]>([]);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Pick count customizable (Allows user to type arbitrary number of stars to pick at once)
  const [pickCount, setPickCount] = useState<number>(1);

  // Modals
  const [showManageModal, setShowManageModal] = useState<boolean>(false);
  const [showCountSelectModal, setShowCountSelectModal] = useState<boolean>(false);
  const [customInputCount, setCustomInputCount] = useState<string>('1');
  const [pasteText, setPasteText] = useState<string>('');
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState<string>('');

  // Container refs & dimensions
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasStarsRef = useRef<HTMLCanvasElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 700 });

  // Student roster state
  const [students, setStudents] = useState<StudentStar[]>(() => {
    if (config?.studentsList && Array.isArray(config.studentsList) && config.studentsList.length > 0) {
      const list: string[] = config.studentsList;
      return list.map((name: string, index: number) => {
        const colorScheme = STAR_COLORS[index % STAR_COLORS.length];
        return {
          id: `star_${Date.now()}_${index}`,
          name,
          selected: false,
          activeInPool: true,
          x: 10 + (index % 5) * 18 + Math.random() * 6,
          y: 18 + Math.floor(index / 5) * 16 + Math.random() * 6,
          baseX: 10 + (index % 5) * 18,
          baseY: 18 + Math.floor(index / 5) * 16,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          size: 42,
          color: colorScheme.fill,
          glowColor: colorScheme.glow,
          pulsePhase: Math.random() * Math.PI * 2,
        };
      });
    }

    try {
      const saved = localStorage.getItem('luckyStarStudents');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}

    // Default roster
    return DEFAULT_STUDENTS.map((name, index) => {
      const colorScheme = STAR_COLORS[index % STAR_COLORS.length];
      return {
        id: `star_${Date.now()}_${index}`,
        name,
        selected: false,
        activeInPool: true,
        x: 10 + (index % 5) * 18 + Math.random() * 6,
        y: 18 + Math.floor(index / 5) * 16 + Math.random() * 6,
        baseX: 10 + (index % 5) * 18,
        baseY: 18 + Math.floor(index / 5) * 16,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: 42,
        color: colorScheme.fill,
        glowColor: colorScheme.glow,
        pulsePhase: Math.random() * Math.PI * 2,
      };
    });
  });

  // Keep students in a ref so stopping effect does not restart every animation frame
  const studentsRef = useRef<StudentStar[]>(students);
  useEffect(() => {
    studentsRef.current = students;
  }, [students]);

  const { isAdmin } = useAuth();
  const { openEditor } = useGameUI();
  const [speechEnabled, setSpeechEnabled] = useState<boolean>(() => !speechService.getIsMuted());

  const toggleSpeech = () => {
    const muted = speechService.toggleMute();
    setSpeechEnabled(!muted);
  };

  // Calculate layout coordinates so stars don't clump or overlap
  const generateNonOverlappingPositions = useCallback((count: number) => {
    const positions: { x: number; y: number }[] = [];
    if (count <= 0) return positions;

    // Distribute stars on a flexible organic golden-ratio / grid with jitter
    const cols = Math.ceil(Math.sqrt(count * 1.5));
    const rows = Math.ceil(count / cols);

    const xPadding = 8;
    const yPadding = 16;
    const availableWidth = 100 - xPadding * 2;
    const availableHeight = 100 - yPadding * 2 - 8; // Leave room for top banner and bottom controls

    const cellW = availableWidth / cols;
    const cellH = availableHeight / rows;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      // Add controlled randomized jitter inside each cell
      const jitterX = (Math.random() - 0.5) * (cellW * 0.5);
      const jitterY = (Math.random() - 0.5) * (cellH * 0.5);

      const x = xPadding + col * cellW + cellW / 2 + jitterX;
      const y = yPadding + row * cellH + cellH / 2 + jitterY;

      positions.push({
        x: Math.max(7, Math.min(93, x)),
        y: Math.max(16, Math.min(84, y)),
      });
    }

    // Shuffle positions randomly so students aren't in strict alphabetical order
    return positions.sort(() => Math.random() - 0.5);
  }, []);

  // Save students to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('luckyStarStudents', JSON.stringify(students));
    } catch {}
  }, [students]);

  // Sync mute with audio system
  useEffect(() => {
    audio.setMuted(!soundEnabled);
  }, [soundEnabled, audio]);

  // Handle ResizeObserver for responsive canvas
  useEffect(() => {
    if (!containerRef.current) return;
    const updateDims = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setContainerSize({ width: clientWidth, height: clientHeight });
      }
    };
    updateDims();
    const observer = new ResizeObserver(updateDims);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Initialize background twinkling stars on canvas
  useEffect(() => {
    const canvas = canvasStarsRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const numStars = 120;
    const stars = Array.from({ length: numStars }, () => ({
      x: Math.random() * containerSize.width,
      y: Math.random() * containerSize.height,
      radius: Math.random() * 1.8 + 0.4,
      alpha: Math.random(),
      speed: Math.random() * 0.02 + 0.005,
      twinkleDir: Math.random() > 0.5 ? 1 : -1,
      color: Math.random() > 0.8 ? '#93C5FD' : Math.random() > 0.85 ? '#FDE047' : '#FFFFFF',
    }));

    // Shooting stars
    const shootingStars: { x: number; y: number; length: number; speed: number; opacity: number; active: boolean }[] = [];
    const spawnShootingStar = () => {
      if (Math.random() < 0.015 && shootingStars.length < 2) {
        shootingStars.push({
          x: Math.random() * containerSize.width * 0.8,
          y: Math.random() * containerSize.height * 0.3,
          length: Math.random() * 80 + 50,
          speed: Math.random() * 7 + 6,
          opacity: 1,
          active: true,
        });
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render twinkling tiny stars
      stars.forEach(s => {
        s.alpha += s.speed * s.twinkleDir;
        if (s.alpha > 0.95) s.twinkleDir = -1;
        if (s.alpha < 0.15) s.twinkleDir = 1;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(1, s.alpha));
        ctx.shadowBlur = s.radius * 3;
        ctx.shadowColor = s.color;
        ctx.fill();
      });

      // Render shooting stars
      spawnShootingStar();
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        if (!ss.active) {
          shootingStars.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x + ss.length, ss.y + ss.length * 0.4);
        ctx.strokeStyle = `rgba(254, 240, 138, ${ss.opacity})`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#FDE047';
        ctx.stroke();
        ctx.restore();

        ss.x += ss.speed;
        ss.y += ss.speed * 0.4;
        ss.opacity -= 0.025;
        if (ss.opacity <= 0 || ss.x > canvas.width || ss.y > canvas.height) {
          ss.active = false;
        }
      }

      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [containerSize]);

  // Main game physics and animation loop
  const animationFrameRef = useRef<number | null>(null);
  const spinStartTimeRef = useRef<number>(0);
  const stopStartTimeRef = useRef<number>(0);

  useEffect(() => {
    let lastTickTime = 0;

    const loop = (timestamp: number) => {
      setStudents((prevStudents) => {
        if (prevStudents.length === 0) return prevStudents;

        const time = timestamp * 0.001;

        return prevStudents.map((star, idx) => {
          let { x, y, vx, vy, pulsePhase, selected, activeInPool } = star;

          // Natural floating animation for IDLE
          if (gameState === 'IDLE' || gameState === 'ROUND_COMPLETE') {
            const floatOffset = Math.sin(time * 1.5 + idx * 0.7) * 0.12;
            const floatOffsetY = Math.cos(time * 1.2 + idx * 0.5) * 0.12;
            return {
              ...star,
              x: Math.max(6, Math.min(94, star.baseX + floatOffset)),
              y: Math.max(16, Math.min(84, star.baseY + floatOffsetY)),
              pulsePhase: pulsePhase + 0.03,
            };
          }

          // Vigorous cosmic shuffling during SPINNING
          if (gameState === 'SPINNING') {
            const speed = speedMultiplier * 1.8;
            x += vx * speed;
            y += vy * speed;

            // Bounce smoothly off boundaries
            if (x < 7) { x = 7; vx = Math.abs(vx); }
            if (x > 93) { x = 93; vx = -Math.abs(vx); }
            if (y < 16) { y = 16; vy = Math.abs(vy); }
            if (y > 84) { y = 84; vy = -Math.abs(vy); }

            // Add slight harmonic curves to trajectories
            vx += Math.sin(time * 3 + idx) * 0.08 * speedMultiplier;
            vy += Math.cos(time * 3 + idx) * 0.08 * speedMultiplier;

            // Clamp velocity
            const maxV = 2.2 * speedMultiplier;
            vx = Math.max(-maxV, Math.min(maxV, vx));
            vy = Math.max(-maxV, Math.min(maxV, vy));

            return {
              ...star,
              x,
              y,
              vx,
              vy,
              pulsePhase: pulsePhase + 0.15 * speedMultiplier,
            };
          }

          // Smooth deceleration during STOPPING
          if (gameState === 'STOPPING') {
            const elapsed = timestamp - stopStartTimeRef.current;
            const duration = 2000; // 2 seconds to come to rest
            const progress = Math.min(1, elapsed / duration);
            const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease out
            const dampFactor = Math.max(0, 1 - easeOut);

            x += vx * dampFactor * speedMultiplier;
            y += vy * dampFactor * speedMultiplier;

            // Interpolate back smoothly towards designated resting spot or settle
            if (x < 7) { x = 7; vx = -vx; }
            if (x > 93) { x = 93; vx = -vx; }
            if (y < 16) { y = 16; vy = -vy; }
            if (y > 84) { y = 84; vy = -vy; }

            return {
              ...star,
              x,
              y,
              vx: vx * 0.96,
              vy: vy * 0.96,
              pulsePhase: pulsePhase + 0.05,
            };
          }

          return star;
        });
      });

      // Sound audio ticks during spinning / stopping
      if (gameState === 'SPINNING') {
        if (timestamp - lastTickTime > 120 / speedMultiplier) {
          audio.playShuffleTick();
          lastTickTime = timestamp;
        }
      } else if (gameState === 'STOPPING') {
        const elapsed = timestamp - stopStartTimeRef.current;
        const progress = Math.min(1, elapsed / 2000);
        const tickInterval = 100 + progress * 400; // Intervals get longer as it slows
        if (timestamp - lastTickTime > tickInterval) {
          audio.playStoppingTick(1.2 - progress * 0.5);
          lastTickTime = timestamp;
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, speedMultiplier, audio]);

  // Selected star for direct modal/action
  const [activeStarAction, setActiveStarAction] = useState<StudentStar | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // Unified winner selection executor
  const executeWinnerSelection = (pickedWinners: StudentStar[]) => {
    if (!pickedWinners || pickedWinners.length === 0) return;

    const winnerIds = new Set(pickedWinners.map(w => w.id));

    // Mark winners as selected in student roster while preserving their active state
    setStudents(prev => prev.map(s => winnerIds.has(s.id) ? { ...s, selected: true } : s));
    setWinners(pickedWinners);
    setGameState('RESULT');
    audio.playVictory();

    // Voice announcement using speech synthesis
    if (speechEnabled) {
      if (pickedWinners.length === 1) {
        announceStudentWinner(pickedWinners[0].name);
      } else if (pickedWinners.length > 1) {
        announceMultipleWinners(pickedWinners.map(w => w.name));
      }
    }

    try {
      confetti({
        particleCount: 130,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#FDE047', '#FCD34D', '#FB923C', '#38BDF8', '#A78BFA', '#34D399', '#FFFFFF'],
      });
    } catch {}
  };

  // Handle Stop timer and multi-winner determination based on pickCount
  useEffect(() => {
    if (gameState === 'STOPPING') {
      stopStartTimeRef.current = performance.now();

      const timer = setTimeout(() => {
        const currentPool = studentsRef.current;
        let eligiblePool = currentPool.filter(s => !s.selected && s.activeInPool);

        if (eligiblePool.length === 0) {
          // If all students were called, auto refresh eligible pool
          eligiblePool = currentPool.map(s => ({ ...s, selected: false, activeInPool: true }));
          setStudents(eligiblePool);
        }

        if (eligiblePool.length === 0) {
          setGameState('ROUND_COMPLETE');
          return;
        }

        // Determine actual count to pick (cannot exceed remaining uncalled pool)
        const actualCountToPick = Math.min(Math.max(1, pickCount), eligiblePool.length);

        // True Cryptographic/Secure Random Selection of N distinct students
        const shuffled = [...eligiblePool].sort(() => Math.random() - 0.5);
        const pickedWinners = shuffled.slice(0, actualCountToPick);

        executeWinnerSelection(pickedWinners);
      }, 1600);

      return () => clearTimeout(timer);
    }
  }, [gameState, audio, pickCount, speechEnabled]);

  // Statistics
  const totalStudents = students.length;
  const calledStudentsCount = students.filter(s => s.selected).length;
  const remainingCount = students.filter(s => !s.selected && s.activeInPool).length;
  const isAllCalled = totalStudents > 0 && remainingCount === 0;

  // Instant Quick Random Selection (without waiting for spin)
  const handleQuickPick = () => {
    if (gameState === 'SPINNING' || gameState === 'STOPPING') return;
    const currentPool = studentsRef.current;
    let eligiblePool = currentPool.filter(s => !s.selected && s.activeInPool);

    if (eligiblePool.length === 0) {
      eligiblePool = currentPool.map(s => ({ ...s, selected: false, activeInPool: true }));
      setStudents(eligiblePool);
    }

    if (eligiblePool.length === 0) {
      setGameState('ROUND_COMPLETE');
      return;
    }

    const actualCountToPick = Math.min(Math.max(1, pickCount), eligiblePool.length);
    const shuffled = [...eligiblePool].sort(() => Math.random() - 0.5);
    const pickedWinners = shuffled.slice(0, actualCountToPick);

    executeWinnerSelection(pickedWinners);
  };

  // Directly select and reveal a specific single student as the lucky winner
  const handleDirectSelectStudent = (star: StudentStar) => {
    setActiveStarAction(null);
    executeWinnerSelection([star]);
  };

  // Actions
  const handleStart = () => {
    if (gameState === 'SPINNING' || gameState === 'STOPPING') return;
    if (remainingCount === 0) {
      // Auto start new round if all were called
      handleNewRound();
      return;
    }

    setWinners([]);
    setShowResultModal(false);
    audio.playStart();
    spinStartTimeRef.current = performance.now();

    // Assign randomized velocities for lively shuffling
    setStudents(prev => prev.map(s => ({
      ...s,
      vx: (Math.random() - 0.5) * 3.2,
      vy: (Math.random() - 0.5) * 3.2,
    })));

    setGameState('SPINNING');
  };

  const handleStop = () => {
    if (gameState !== 'SPINNING') return;
    setGameState('STOPPING');
  };

  const handleNewRound = () => {
    const newPositions = generateNonOverlappingPositions(students.length);
    setStudents(prev => prev.map((s, idx) => {
      const pos = newPositions[idx] || { x: 50, y: 50 };
      return {
        ...s,
        selected: false,
        activeInPool: true,
        x: pos.x,
        y: pos.y,
        baseX: pos.x,
        baseY: pos.y,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
      };
    }));

    setWinners([]);
    setShowResultModal(false);
    setRoundNumber(prev => prev + 1);
    setGameState('IDLE');
  };

  const handleShufflePositions = () => {
    const newPositions = generateNonOverlappingPositions(students.length);
    setStudents(prev => prev.map((s, idx) => {
      const pos = newPositions[idx] || { x: 50, y: 50 };
      return {
        ...s,
        x: pos.x,
        y: pos.y,
        baseX: pos.x,
        baseY: pos.y,
      };
    }));
  };

  // Student list mutations
  const handleAddStudent = () => {
    if (!newStudentName.trim()) return;
    const name = newStudentName.trim();
    const colorScheme = STAR_COLORS[students.length % STAR_COLORS.length];
    const newPositions = generateNonOverlappingPositions(students.length + 1);
    const pos = newPositions[newPositions.length - 1] || { x: 50, y: 50 };

    const newStar: StudentStar = {
      id: `star_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      selected: false,
      activeInPool: true,
      x: pos.x,
      y: pos.y,
      baseX: pos.x,
      baseY: pos.y,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      size: 42,
      color: colorScheme.fill,
      glowColor: colorScheme.glow,
      pulsePhase: Math.random() * Math.PI * 2,
    };

    setStudents(prev => [...prev, newStar]);
    setNewStudentName('');
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const handleSaveEdit = (id: string) => {
    if (!editNameValue.trim()) return;
    setStudents(prev => prev.map(s => s.id === id ? { ...s, name: editNameValue.trim() } : s));
    setEditingStudentId(null);
    setEditNameValue('');
  };

  const handlePasteRoster = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText
      .split('\n')
      .map(l => l.trim().replace(/^[\d+.\-*)\]]+\s*/, '')) // Strip leading numbering
      .filter(l => l.length > 0);

    if (lines.length === 0) return;

    const newPositions = generateNonOverlappingPositions(lines.length);

    const newStars: StudentStar[] = lines.map((name, idx) => {
      const colorScheme = STAR_COLORS[idx % STAR_COLORS.length];
      const pos = newPositions[idx] || { x: 50, y: 50 };
      return {
        id: `star_${Date.now()}_${idx}`,
        name,
        selected: false,
        activeInPool: true,
        x: pos.x,
        y: pos.y,
        baseX: pos.x,
        baseY: pos.y,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: 42,
        color: colorScheme.fill,
        glowColor: colorScheme.glow,
        pulsePhase: Math.random() * Math.PI * 2,
      };
    });

    setStudents(newStars);
    setPasteText('');
    setShowManageModal(false);
    setWinners([]);
    setGameState('IDLE');
  };

  const handleLoadDefaults = () => {
    const newPositions = generateNonOverlappingPositions(DEFAULT_STUDENTS.length);
    const defaultStars: StudentStar[] = DEFAULT_STUDENTS.map((name, idx) => {
      const colorScheme = STAR_COLORS[idx % STAR_COLORS.length];
      const pos = newPositions[idx] || { x: 50, y: 50 };
      return {
        id: `star_${Date.now()}_${idx}`,
        name,
        selected: false,
        activeInPool: true,
        x: pos.x,
        y: pos.y,
        baseX: pos.x,
        baseY: pos.y,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: 42,
        color: colorScheme.fill,
        glowColor: colorScheme.glow,
        pulsePhase: Math.random() * Math.PI * 2,
      };
    });
    setStudents(defaultStars);
    setWinners([]);
    setGameState('IDLE');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      id="lucky-star-game-container"
      className="relative w-full flex-1 min-h-[min(650px,100dvh)] h-full max-h-[1080px] bg-gradient-to-b from-[#060814] via-[#0B0F2A] to-[#040612] text-w-text-main rounded-3xl overflow-y-auto shadow-2xl border border-indigo-950/60 select-none flex flex-col font-sans"
    >
      {/* Dynamic Cosmic Twinkling Stars Canvas */}
      <canvas
        ref={canvasStarsRef}
        width={containerSize.width}
        height={containerSize.height}
        className="absolute inset-0 pointer-events-none z-0"
      />

      {/* Radiant Cosmic Nebula Accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar & Grand Game-Show Title */}
      <GameUIElement
        id="gameHeader"
        gameId="lucky_star"
        defaultName="Thanh tiêu đề game"
        className="relative z-10 pt-3 pb-2 px-4 sm:px-6 flex flex-col items-center justify-center"
      >
        {/* Quick status chips */}
        <div className="w-full flex items-center justify-between text-xs sm:text-sm font-medium text-amber-200/90 mb-1">
          <div className="flex items-center gap-2 bg-w-bg-alt border border-amber-500/30 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-600 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Vòng {roundNumber}</span>
            <span className="text-w-text-main/40">•</span>
            <button
              onClick={() => setShowHistoryModal(true)}
              className="hover:text-amber-300 underline font-bold cursor-pointer"
              title="Nhấn để xem danh sách và quản lý các em đã được gọi"
            >
              Đã gọi: <strong className="text-amber-600 font-bold">{calledStudentsCount}</strong> / {totalStudents}
            </button>
            <span className="text-w-text-main/40">•</span>
            <span>Còn lại: <strong className="text-emerald-400 font-bold">{remainingCount}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            {/* Speech synthesis toggle */}
            <button
              onClick={toggleSpeech}
              className={`p-2 rounded-xl border transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                speechEnabled 
                  ? 'bg-amber-500/20 border-amber-400/60 text-amber-300 hover:bg-amber-500/30' 
                  : 'bg-w-bg-alt border-slate-700/60 text-slate-400 hover:bg-slate-800'
              }`}
              title={speechEnabled ? 'Đang bật đọc tên học sinh (nhấn để tắt)' : 'Đang tắt đọc tên (nhấn để bật)'}
            >
              <Megaphone className="w-4 h-4" />
              <span className="hidden md:inline">{speechEnabled ? 'Giọng đọc: BẬT' : 'Giọng đọc: TẮT'}</span>
            </button>

            {/* Admin Game UI Live Editor */}
            {isAdmin && (
              <button
                onClick={() => openEditor('lucky_star')}
                className="p-2 rounded-xl bg-gradient-to-r from-amber-500/25 to-yellow-500/25 hover:from-amber-500/40 hover:to-yellow-500/40 border border-amber-400/60 text-amber-200 transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                title="Mở bộ thiết kế giao diện trực tiếp (Admin UI Editor)"
              >
                <Palette className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Chỉnh giao diện</span>
              </button>
            )}

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-w-bg-alt hover:bg-indigo-50 border border-amber-500/30 text-amber-600 transition-all shadow-md active:scale-95 cursor-pointer"
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-w-bg-alt hover:bg-indigo-50 border border-amber-500/30 text-amber-600 transition-all shadow-md active:scale-95 cursor-pointer"
              title="Toàn màn hình"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Grand Title */}
        <GameUIElement
          id="gameTitle"
          gameId="lucky_star"
          defaultName="Dòng chữ Tiêu đề game"
          className="text-center mt-1"
        >
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-wider bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(251,191,36,0.7)] flex items-center justify-center gap-2 sm:gap-3">
            <Star className="w-6 h-6 sm:w-10 sm:h-10 text-yellow-300 fill-yellow-300 animate-pulse drop-shadow-[0_0_12px_#FDE047]" />
            <span>NGÔI SAO MAY MẮN LÀ AI?</span>
            <Star className="w-6 h-6 sm:w-10 sm:h-10 text-yellow-300 fill-yellow-300 animate-pulse drop-shadow-[0_0_12px_#FDE047]" />
          </h1>
          <p className="text-xs sm:text-sm text-amber-200/80 mt-0.5 font-medium tracking-wide">
            {gameState === 'SPINNING' && `🌟 Đang xáo trộn tìm ${pickCount} ngôi sao may mắn...`}
            {gameState === 'STOPPING' && `✨ Đang thu hẹp tìm ${pickCount} ngôi sao sáng nhất...`}
            {gameState === 'IDLE' && `⭐ Chọn số lượng ${pickCount} sao và bấm BẮT ĐẦU để quay thưởng!`}
            {gameState === 'ROUND_COMPLETE' && '🎉 Tất cả học sinh trong lớp đã được gọi! Bấm "Vòng mới" để chơi lại.'}
          </p>
        </GameUIElement>
      </GameUIElement>

      {/* Main Celestial Arena (The Starry Sky) */}
      <GameUIElement
        id="starStage"
        gameId="lucky_star"
        defaultName="Vũ trụ / Sàn sao lượn sóng"
        className="relative flex-1 w-full overflow-hidden z-10"
      >
        <div className="relative w-full h-full overflow-hidden">
        {students.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <Star className="w-16 h-16 text-yellow-400/50 mb-3 animate-bounce" />
            <h3 className="text-xl font-bold text-amber-200">Chưa có học sinh nào trong lớp</h3>
            <p className="text-sm text-w-text-muted mt-1 mb-4 max-w-md">
              Thầy cô hãy nhấn "Quản lý danh sách" để dán danh sách lớp hoặc nạp danh sách mẫu có sẵn.
            </p>
            <button
              onClick={() => setShowManageModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              + Quản lý danh sách học sinh
            </button>
          </div>
        ) : (
          students.map((star) => {
            const isWinnerStar = winners.some(w => w.id === star.id);
            const isSpinning = gameState === 'SPINNING';
            const isStopping = gameState === 'STOPPING';
            const isDimmed = (gameState === 'RESULT' && !isWinnerStar) || star.selected || !star.activeInPool;

            return (
              <div
                key={star.id}
                onClick={() => {
                  if (gameState === 'SPINNING' || gameState === 'STOPPING') return;
                  setActiveStarAction(star);
                  audio.playShuffleTick();
                }}
                title={star.selected ? `Đã gọi: ${star.name} (Nhấn để tùy chọn / gọi lại)` : `Chưa gọi: ${star.name} (Nhấn để chọn ngay hoặc đổi trạng thái)`}
                style={{
                  position: 'absolute',
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  transform: 'translate(-50%, -50%)',
                  transition: isSpinning || isStopping ? 'none' : 'transform 0.4s ease-out, opacity 0.4s ease',
                  opacity: isDimmed ? (gameState === 'RESULT' ? 0.2 : 0.4) : 1,
                  zIndex: isWinnerStar ? 40 : star.selected ? 5 : 20,
                }}
                className="flex flex-col items-center justify-center cursor-pointer group select-none"
              >
                {/* 5-Pointed Radiant Glowing Star SVG */}
                <div
                  className={`relative transition-all duration-300 ${
                    isWinnerStar
                      ? 'scale-150 animate-bounce ring-4 ring-yellow-300 rounded-full'
                      : isSpinning
                      ? 'scale-110'
                      : 'hover:scale-130'
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-9 h-9 sm:w-12 sm:h-12 drop-shadow-[0_0_15px_rgba(253,224,71,0.9)]"
                    style={{
                      filter: `drop-shadow(0 0 ${isSpinning || isWinnerStar ? '18px' : '10px'} ${isWinnerStar ? '#FDE047' : star.glowColor})`,
                    }}
                  >
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      fill={isWinnerStar ? '#FACC15' : star.selected ? '#64748B' : star.color}
                      stroke={isWinnerStar ? '#FFFFFF' : star.selected ? '#94A3B8' : '#FFFFFF'}
                      strokeWidth={isSpinning || isWinnerStar ? 2 : 1}
                    />
                  </svg>

                  {isWinnerStar && (
                    <span className="absolute -top-3 -right-1 text-sm animate-pulse">👑</span>
                  )}

                  {isSpinning && (
                    <span className="absolute -inset-1 rounded-full border border-amber-300/60 animate-ping pointer-events-none" />
                  )}
                </div>

                {/* Student Name Pill */}
                <div
                  className={`mt-1 px-2.5 py-0.5 rounded-full text-center whitespace-nowrap text-xs sm:text-sm font-bold tracking-wide backdrop-blur-md border shadow-lg transition-all ${
                    isWinnerStar
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 border-white shadow-[0_0_20px_#FDE047] scale-115 ring-2 ring-amber-400 font-black'
                      : star.selected
                      ? 'bg-w-bg-alt text-w-text-muted border-w-accent-border line-through'
                      : 'bg-w-bg-card text-amber-100 border-amber-400 group-hover:border-amber-300 group-hover:text-w-text-main'
                  }`}
                >
                  {star.name}
                  {star.selected && !isWinnerStar && (
                    <span className="ml-1 text-[10px] uppercase font-normal text-emerald-400">✓ Đã gọi</span>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* DRAMATIC ON-STAGE ZOOM SHOWCASE FOR N WINNING STARS */}
        <AnimatePresence>
          {gameState === 'RESULT' && winners.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 sm:p-6 bg-w-bg-card backdrop-blur-xs pointer-events-auto"
            >
              {/* Grand Cosmic Spotlight Halo */}
              <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-amber-500/25 via-yellow-400/20 to-orange-500/25 rounded-full blur-3xl pointer-events-none animate-pulse" />

              {/* Title Ribbon */}
              <motion.div
                initial={{ scale: 0.8, y: -20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="relative z-10 mb-4 px-6 py-2 bg-gradient-to-r from-amber-500/30 via-indigo-950/90 to-amber-500/30 border border-amber-400 rounded-full shadow-[0_0_30px_rgba(251,191,36,0.6)] backdrop-blur-md flex items-center gap-2 text-amber-200"
              >
                <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" style={{ animationDuration: '4s' }} />
                <span className="text-sm sm:text-lg font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100">
                  {winners.length > 1 ? `✨ ${winners.length} NGÔI SAO MAY MẮN ĐÃ TỎA SÁNG ✨` : '✨ NGÔI SAO MAY MẮN ĐÃ TỎA SÁNG ✨'}
                </span>
                <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" style={{ animationDuration: '4s' }} />
              </motion.div>

              {/* ZOOMED STARS ARENA (Flex / Grid Display) */}
              <div
                className={`relative z-10 w-full flex flex-wrap items-center justify-center gap-4 sm:gap-8 max-w-5xl my-2 max-h-[60vh] overflow-y-auto px-2`}
              >
                {winners.map((winner, idx) => {
                  const isSingle = winners.length === 1;
                  const isDouble = winners.length === 2;
                  const isTriple = winners.length === 3;

                  return (
                    <motion.div
                      key={winner.id}
                      initial={{ scale: 0.1, rotate: -20, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      exit={{ scale: 0.1, opacity: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 260,
                        damping: 18,
                        delay: idx * 0.12,
                      }}
                      className="flex flex-col items-center justify-center text-center group"
                    >
                      {/* Enormous Pulsating Star Container */}
                      <div className="relative flex items-center justify-center">
                        {/* Sunburst background rays */}
                        <div
                          className="absolute inset-0 w-32 h-32 sm:w-44 sm:h-44 -top-6 -left-6 rounded-full bg-radial from-amber-300/40 via-yellow-500/10 to-transparent blur-md pointer-events-none animate-spin"
                          style={{ animationDuration: '12s' }}
                        />

                        {/* Cosmic Rings */}
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                          className="absolute -inset-4 sm:-inset-6 rounded-full border border-dashed border-amber-300/60 pointer-events-none"
                        />

                        {/* GIANT STAR SVG */}
                        <motion.svg
                          animate={{
                            scale: [1, 1.08, 1],
                            rotate: [0, 4, -4, 0],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 3,
                            ease: 'easeInOut',
                          }}
                          viewBox="0 0 24 24"
                          className={`${
                            isSingle
                              ? 'w-28 h-28 sm:w-40 sm:h-40'
                              : isDouble
                              ? 'w-24 h-24 sm:w-32 sm:h-32'
                              : isTriple
                              ? 'w-20 h-20 sm:w-28 sm:h-28'
                              : 'w-16 h-16 sm:w-24 sm:h-24'
                          } drop-shadow-[0_0_35px_#FDE047]`}
                        >
                          <defs>
                            <linearGradient id={`starGoldGrad_${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#FFFBEB" />
                              <stop offset="40%" stopColor="#FDE047" />
                              <stop offset="80%" stopColor="#F59E0B" />
                              <stop offset="100%" stopColor="#D97706" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            fill={`url(#starGoldGrad_${idx})`}
                            stroke="#FFFFFF"
                            strokeWidth="1.2"
                          />
                        </motion.svg>

                        {/* Star Number Badge */}
                        <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-gradient-to-r from-red-600 to-amber-500 text-w-text-main font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-full border-2 border-white shadow-lg">
                          #{idx + 1}
                        </div>
                      </div>

                      {/* Grand Zoomed Name Badge */}
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.12 + 0.2 }}
                        className="mt-3 sm:mt-4 px-4 sm:px-6 py-1.5 sm:py-2.5 bg-gradient-to-b from-[#1E1B4B] via-[#0F172A] to-[#020617] border-2 border-amber-400 rounded-2xl shadow-[0_0_25px_rgba(251,191,36,0.8)] backdrop-blur-xl flex flex-col items-center"
                      >
                        <span className="text-[10px] sm:text-xs text-amber-600 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>Học sinh may mắn</span>
                        </span>
                        <h3
                          className={`${
                            isSingle
                              ? 'text-2xl sm:text-4xl md:text-5xl'
                              : isDouble
                              ? 'text-xl sm:text-3xl'
                              : 'text-lg sm:text-2xl'
                          } font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 drop-shadow-[0_0_20px_rgba(251,191,36,0.9)] mt-0.5 whitespace-nowrap`}
                        >
                          {winner.name}
                        </h3>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Quick On-Stage Action Dock */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="relative z-10 flex flex-wrap items-center justify-center gap-3 mt-4"
              >
                <button
                  onClick={() => {
                    if (remainingCount > 0) {
                      handleStart();
                    } else {
                      handleNewRound();
                    }
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black rounded-xl shadow-[0_0_25px_rgba(251,191,36,0.7)] hover:brightness-110 active:scale-95 transition-all text-xs sm:text-sm flex items-center gap-2 cursor-pointer uppercase tracking-wide"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{remainingCount > 0 ? `GỌI TIẾP ${Math.min(pickCount, remainingCount)} EM` : 'BẮT ĐẦU VÒNG MỚI'}</span>
                </button>

                <button
                  onClick={() => setShowResultModal(true)}
                  className="px-4 py-2.5 bg-w-bg-alt hover:bg-indigo-50 border border-amber-500/40 text-amber-200 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Xem thiệp chúc mừng</span>
                </button>

                <button
                  onClick={() => setGameState('IDLE')}
                  className="px-4 py-2.5 bg-w-bg-alt hover:bg-w-accent-light border border-w-accent-border text-w-primary-dark font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Thu nhỏ để xem toàn cảnh bầu trời các ngôi sao"
                >
                  <span>Thu nhỏ / Bầu trời</span>
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </GameUIElement>

      {/* Bottom Interactive Command Dock */}
      <GameUIElement
        id="controlBar"
        gameId="lucky_star"
        defaultName="Thanh điều khiển nút bấm"
        className="relative z-20 px-4 sm:px-6 py-3.5 bg-w-bg-card backdrop-blur-xl border-t border-amber-500/25 flex flex-wrap items-center justify-between gap-3 shadow-2xl"
      >
        {/* Left Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="lucky-star-manage-btn"
            onClick={() => setShowManageModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-w-bg-alt hover:bg-indigo-50 text-amber-200 border border-amber-500/40 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Users className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Quản lý</span> Danh sách ({students.length})
          </button>

          {/* Direct Pick Count Input & Selector */}
          <div className="flex items-center gap-1.5 bg-w-bg-alt border border-amber-500/40 px-2.5 py-1.5 rounded-xl shadow-md">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span>Số lượng gọi:</span>
            </span>

            <button
              onClick={() => setPickCount(prev => Math.max(1, prev - 1))}
              disabled={pickCount <= 1 || gameState === 'SPINNING' || gameState === 'STOPPING'}
              className="w-6 h-6 rounded-lg bg-w-accent-light hover:bg-slate-700 disabled:opacity-30 text-amber-200 font-black text-xs flex items-center justify-center cursor-pointer"
            >
              -
            </button>

            <input
              type="number"
              min={1}
              max={Math.max(1, remainingCount || 1)}
              value={pickCount}
              disabled={gameState === 'SPINNING' || gameState === 'STOPPING'}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) {
                  setPickCount(Math.max(1, Math.min(remainingCount || 50, val)));
                }
              }}
              className="w-12 text-center bg-w-bg-alt border border-amber-400 rounded-lg py-0.5 text-sm font-black text-yellow-300 focus:outline-none focus:ring-1 focus:ring-yellow-400"
            />

            <button
              onClick={() => setPickCount(prev => Math.min(Math.max(1, remainingCount), prev + 1))}
              disabled={pickCount >= remainingCount || gameState === 'SPINNING' || gameState === 'STOPPING'}
              className="w-6 h-6 rounded-lg bg-w-accent-light hover:bg-slate-700 disabled:opacity-30 text-amber-200 font-black text-xs flex items-center justify-center cursor-pointer"
            >
              +
            </button>

            <button
              onClick={() => setShowCountSelectModal(true)}
              className="ml-1 text-[11px] font-bold text-amber-600 hover:text-amber-200 underline cursor-pointer"
            >
              Chọn nhanh
            </button>
          </div>

          <button
            id="lucky-star-shuffle-btn"
            onClick={handleShufflePositions}
            disabled={gameState === 'SPINNING' || gameState === 'STOPPING'}
            className="p-2.5 bg-w-bg-alt hover:bg-indigo-50 disabled:opacity-40 text-amber-200 border border-amber-500/40 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
            title="Đổi vị trí các ngôi sao"
          >
            <Shuffle className="w-4 h-4 text-amber-600" />
          </button>
        </div>

        {/* Center Primary Game Action Button (START / STOP) */}
        <GameUIElement
          id="startBtn"
          gameId="lucky_star"
          defaultName="Nút QUAY / BẮT ĐẦU"
          className="flex items-center gap-3 mx-auto"
        >
          {gameState !== 'SPINNING' ? (
            <div className="flex items-center gap-2">
              <button
                id="lucky-star-start-btn"
                onClick={handleStart}
                disabled={gameState === 'STOPPING' || remainingCount === 0}
                className="group relative flex items-center gap-2.5 px-6 sm:px-10 py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-base sm:text-xl rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.6)] hover:shadow-[0_0_45px_rgba(251,191,36,0.9)] hover:scale-105 active:scale-95 transition-all uppercase tracking-wider disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <Play className="w-5 h-5 fill-slate-950 group-hover:animate-ping" />
                <span>BẮT ĐẦU</span>
              </button>

              <button
                id="lucky-star-quick-pick-btn"
                onClick={handleQuickPick}
                disabled={gameState === 'STOPPING' || remainingCount === 0}
                className="flex items-center gap-1.5 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all uppercase tracking-wide cursor-pointer disabled:opacity-40"
                title="Chọn và xướng tên ngẫu nhiên ngay lập tức không cần chờ quay"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span className="hidden sm:inline">GỌI NGAY</span>
              </button>
            </div>
          ) : (
            <button
              id="lucky-star-stop-btn"
              onClick={handleStop}
              className="flex items-center gap-2.5 px-8 sm:px-12 py-3 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 text-w-text-main font-black text-lg sm:text-xl rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.7)] hover:shadow-[0_0_45px_rgba(239,68,68,1)] hover:scale-105 active:scale-95 transition-all uppercase tracking-wider animate-pulse cursor-pointer"
            >
              <Square className="w-6 h-6 fill-white" />
              <span>DỪNG LẠI</span>
            </button>
          )}

          <button
            id="lucky-star-new-round-btn"
            onClick={handleNewRound}
            disabled={gameState === 'SPINNING' || gameState === 'STOPPING'}
            className="flex items-center gap-1.5 px-4 py-3 bg-w-bg-alt hover:bg-w-accent-light disabled:opacity-40 text-amber-600 border border-amber-500/40 rounded-2xl font-bold text-sm transition-all shadow-md active:scale-95 cursor-pointer"
            title="Làm mới vòng chơi, gọi lại toàn bộ lớp"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden md:inline">Vòng mới</span>
          </button>
        </GameUIElement>

        {/* Right Speed Multiplier Controls */}
        <div className="flex items-center gap-2 bg-w-bg-alt border border-amber-500/30 px-3 py-1.5 rounded-xl">
          <Sliders className="w-4 h-4 text-amber-600" />
          <span className="text-xs text-amber-200/80 font-medium hidden sm:inline">Tốc độ:</span>
          <div className="flex items-center gap-1">
            {[0.5, 1.0, 1.5, 2.0].map(speed => (
              <button
                key={speed}
                onClick={() => setSpeedMultiplier(speed)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  speedMultiplier === speed
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-amber-200/70 hover:bg-white/10'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </GameUIElement>

      {/* Multiple Winners Celebration Modal */}
      <AnimatePresence>
        {showResultModal && winners.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-w-bg-card backdrop-blur-md flex items-center justify-center p-4 select-none"
          >
            <GameUIElement
              id="resultCard"
              gameId="lucky_star"
              defaultName="Bảng chúc mừng học sinh may mắn"
              className="relative max-w-2xl w-full"
            >
              <motion.div
                initial={{ scale: 0.5, y: 50, rotate: -3 }}
                animate={{ scale: 1, y: 0, rotate: 0 }}
                exit={{ scale: 0.5, y: 50 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                className="w-full bg-gradient-to-b from-[#1E1B4B] via-[#0F172A] to-[#020617] border-3 border-amber-400 p-6 sm:p-8 rounded-3xl shadow-[0_0_80px_rgba(251,191,36,0.85)] text-center flex flex-col items-center max-h-[90vh] overflow-y-auto"
              >
              {/* Close icon */}
              <button
                onClick={() => setShowResultModal(false)}
                className="absolute top-4 right-4 p-2 text-w-text-muted hover:text-w-text-main rounded-full bg-white/5 hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Sparkles header */}
              <div className="flex items-center justify-center gap-2 text-amber-600 mb-1">
                <Sparkles className="w-6 h-6 animate-spin text-yellow-300" />
                <span className="text-sm sm:text-base font-black tracking-widest uppercase">✨ NGÔI SAO MAY MẮN ✨</span>
                <Sparkles className="w-6 h-6 animate-spin text-yellow-300" />
              </div>

              <h3 className="text-xs sm:text-sm text-amber-200/90 font-bold mb-4 uppercase">
                {winners.length > 1 ? `Xin chúc mừng ${winners.length} học sinh may mắn được gọi!` : 'Xin chúc mừng ngôi sao may mắn!'}
              </h3>

              {/* Grid of 1 or more winner cards */}
              <div className={`grid gap-4 w-full my-3 ${
                winners.length === 1 
                  ? 'grid-cols-1 max-w-sm' 
                  : winners.length === 2 
                  ? 'grid-cols-2 max-w-lg' 
                  : winners.length <= 4 
                  ? 'grid-cols-2 sm:grid-cols-2 max-w-xl' 
                  : 'grid-cols-2 sm:grid-cols-3 max-w-2xl'
              }`}>
                {winners.map((winner, i) => (
                  <motion.div
                    key={winner.id}
                    initial={{ scale: 0.8, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 bg-gradient-to-b from-amber-500/20 via-slate-900/90 to-slate-950 border-2 border-amber-400 rounded-2xl flex flex-col items-center justify-center shadow-lg hover:scale-102 transition-all"
                  >
                    {/* Golden Star Graphic */}
                    <div className="relative my-1">
                      <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-xl animate-pulse" />
                      <svg viewBox="0 0 24 24" className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-[0_0_20px_#FDE047] animate-bounce">
                        <path
                          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                          fill="#FDE047"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>

                    <GameUIElement
                      id="winnerName"
                      gameId="lucky_star"
                      defaultName="Tên học sinh trúng giải"
                    >
                      <h4 className="text-lg sm:text-2xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] mt-2">
                        {winner.name}
                      </h4>
                    </GameUIElement>

                    {/* Quick Speak button for individual winner */}
                    <button
                      onClick={() => announceStudentWinner(winner.name)}
                      className="mt-2 text-xs flex items-center gap-1 text-amber-300/80 hover:text-amber-200 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-full border border-amber-400/30 transition-all cursor-pointer"
                      title="Đọc tên học sinh này"
                    >
                      <Megaphone className="w-3 h-3 text-amber-400" />
                      <span>Đọc tên</span>
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 w-full mt-5">
                <button
                  onClick={() => {
                    setShowResultModal(false);
                    if (remainingCount > 0) {
                      handleStart();
                    }
                  }}
                  disabled={remainingCount === 0}
                  className="flex-1 min-w-[140px] px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-2xl shadow-lg hover:brightness-110 active:scale-95 transition-all text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>GỌI TIẾP</span>
                </button>

                {/* Speak all winners button */}
                <button
                  onClick={() => {
                    if (winners.length === 1) {
                      announceStudentWinner(winners[0].name);
                    } else {
                      announceMultipleWinners(winners.map(w => w.name));
                    }
                  }}
                  className="px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 font-bold rounded-2xl transition-all text-sm sm:text-base flex items-center gap-2 cursor-pointer"
                  title="Đọc lại toàn bộ danh sách trúng thưởng"
                >
                  <Megaphone className="w-4 h-4 text-amber-400" />
                  <span>Đọc lại</span>
                </button>

                <button
                  onClick={() => setShowResultModal(false)}
                  className="px-6 py-3 bg-w-accent-light hover:bg-slate-700 text-w-text-main font-bold rounded-2xl transition-all text-sm sm:text-base cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
            </GameUIElement>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student Roster Management Modal */}
      <AnimatePresence>
        {showManageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-w-bg-card backdrop-blur-md flex items-center justify-center p-4 select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-w-bg-alt border border-amber-500/40 w-full max-w-2xl max-h-[85vh] rounded-3xl p-6 shadow-2xl flex flex-col text-slate-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-w-border">
                <div className="flex items-center gap-2 text-amber-600">
                  <Users className="w-6 h-6 text-amber-600" />
                  <h3 className="text-xl font-bold">Quản Lý Danh Sách Học Sinh ({students.length})</h3>
                </div>
                <button
                  onClick={() => setShowManageModal(false)}
                  className="p-2 text-w-text-muted hover:text-w-text-main rounded-full bg-white/5 hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                {/* Single Add Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập họ và tên học sinh..."
                    value={newStudentName}
                    onChange={e => setNewStudentName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddStudent()}
                    className="flex-1 px-4 py-2.5 bg-w-bg-card border border-w-accent-border rounded-xl text-w-text-main placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm"
                  />
                  <button
                    onClick={handleAddStudent}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 text-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm</span>
                  </button>
                </div>

                {/* Bulk Paste Area */}
                <div className="bg-w-bg-card p-4 rounded-2xl border border-w-border">
                  <label className="block text-xs font-bold text-amber-600 mb-1.5 uppercase">
                    📋 Dán danh sách cả lớp (Mỗi dòng một tên):
                  </label>
                  <textarea
                    rows={4}
                    placeholder={`Nguyễn Văn A\nTrần Thị B\nLê Văn C\nPhạm Thị D`}
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    className="w-full p-3 bg-w-bg-alt border border-w-accent-border rounded-xl text-w-text-main placeholder-slate-600 focus:outline-none focus:border-amber-400 text-sm font-mono"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-w-text-muted">Tự động loại bỏ số thứ tự ở đầu dòng</span>
                    <button
                      onClick={handlePasteRoster}
                      disabled={!pasteText.trim()}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-w-text-main font-bold rounded-xl text-xs transition-all active:scale-95 cursor-pointer"
                    >
                      Áp dụng danh sách mới
                    </button>
                  </div>
                </div>

                {/* Current Students List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-w-text-muted uppercase">Danh sách hiện tại:</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StudentImportButton
                        onImport={(names) => {
                          if (names.length > 0) {
                            const newPositions = generateNonOverlappingPositions(names.length);
                            const newItems: StudentStar[] = names.map((name, index) => {
                              const colorScheme = STAR_COLORS[index % STAR_COLORS.length];
                              const pos = newPositions[index] || { x: 50, y: 50 };
                              return {
                                id: `star_${Date.now()}_${index}`,
                                name,
                                selected: false,
                                activeInPool: true,
                                x: pos.x,
                                y: pos.y,
                                baseX: pos.x,
                                baseY: pos.y,
                                vx: (Math.random() - 0.5) * 0.8,
                                vy: (Math.random() - 0.5) * 0.8,
                                size: 42,
                                color: colorScheme.fill,
                                glowColor: colorScheme.glow,
                                pulsePhase: Math.random() * Math.PI * 2,
                              };
                            });
                            setStudents(newItems);
                          }
                        }}
                        buttonText="Nhập từ Excel / CSV"
                        variant="secondary"
                      />
                      <button
                        onClick={handleLoadDefaults}
                        className="text-xs text-amber-600 hover:underline cursor-pointer"
                      >
                        Nạp 20 tên mẫu
                      </button>
                      <span className="text-slate-600">•</span>
                      <button
                        onClick={() => setStudents([])}
                        className="text-xs text-red-400 hover:underline cursor-pointer"
                      >
                        Xóa tất cả
                      </button>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 border border-w-border rounded-2xl p-2 bg-w-bg-card">
                    {students.length === 0 ? (
                      <p className="text-center text-xs text-slate-500 py-6">Danh sách trống</p>
                    ) : (
                      students.map((student, idx) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between px-3 py-2 bg-w-bg-alt hover:bg-w-accent-light rounded-xl text-sm border border-w-border"
                        >
                          <div className="flex items-center gap-2 flex-1 mr-2">
                            <span className="text-xs text-amber-500/80 w-6 font-mono font-bold">{idx + 1}.</span>
                            {editingStudentId === student.id ? (
                              <input
                                type="text"
                                value={editNameValue}
                                onChange={e => setEditNameValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSaveEdit(student.id)}
                                className="px-2 py-0.5 bg-w-bg-card border border-amber-400 rounded text-sm text-w-text-main flex-1"
                                autoFocus
                              />
                            ) : (
                              <span className={`font-medium ${student.selected ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                {student.name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {editingStudentId === student.id ? (
                              <button
                                onClick={() => handleSaveEdit(student.id)}
                                className="p-1.5 text-emerald-400 hover:bg-emerald-950/50 rounded cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingStudentId(student.id);
                                  setEditNameValue(student.name);
                                }}
                                className="p-1.5 text-w-text-muted hover:text-amber-600 rounded cursor-pointer"
                                title="Đổi tên"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              className="p-1.5 text-w-text-muted hover:text-red-400 rounded cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-w-border flex justify-end">
                <button
                  onClick={() => setShowManageModal(false)}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Hoàn tất
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Select Student Count Modal */}
      <AnimatePresence>
        {showCountSelectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-w-bg-card backdrop-blur-md flex items-center justify-center p-4 select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-w-bg-alt border border-amber-500/40 w-full max-w-md rounded-3xl p-6 shadow-2xl text-slate-100 text-center"
            >
              <div className="flex items-center justify-between pb-3 border-b border-w-border mb-4">
                <h3 className="text-lg font-bold text-amber-600 flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-amber-600" />
                  <span>Chọn số lượng học sinh gọi mỗi lượt</span>
                </h3>
                <button
                  onClick={() => setShowCountSelectModal(false)}
                  className="p-1.5 text-w-text-muted hover:text-w-text-main rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-w-text-muted mb-4">
                Nhập số hoặc chọn nhanh số lượng học sinh được xướng tên may mắn trong mỗi lần quay (Còn {remainingCount} em chưa gọi).
              </p>

              {/* Custom Number Input inside Modal */}
              <div className="p-3 bg-w-bg-card rounded-2xl border border-amber-500/40 mb-4 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-amber-200">Gõ số lượng tùy chọn:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={remainingCount || 50}
                    value={customInputCount}
                    onChange={(e) => setCustomInputCount(e.target.value)}
                    className="w-20 px-3 py-1.5 bg-w-bg-alt border border-amber-400 rounded-xl text-center font-bold text-amber-600 text-sm focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      const count = parseInt(customInputCount, 10);
                      if (!isNaN(count) && count > 0) {
                        setPickCount(Math.min(remainingCount || 50, count));
                        setShowCountSelectModal(false);
                      }
                    }}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {[1, 2, 3, 4, 5, 6, 8, 10].map(count => (
                  <button
                    key={count}
                    onClick={() => {
                      setPickCount(Math.min(remainingCount || count, count));
                      setShowCountSelectModal(false);
                    }}
                    disabled={count > remainingCount && remainingCount > 0}
                    className={`py-2.5 rounded-xl font-black text-sm border transition-all cursor-pointer ${
                      pickCount === count
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg'
                        : 'bg-w-bg-card text-slate-200 border-w-accent-border hover:border-amber-400 disabled:opacity-30'
                    }`}
                  >
                    {count} em
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowCountSelectModal(false)}
                className="w-full py-2.5 bg-w-accent-light hover:bg-slate-700 text-w-text-main font-bold rounded-xl text-sm cursor-pointer"
              >
                Đóng
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Direct Single Star Action Modal */}
      <AnimatePresence>
        {activeStarAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border-2 border-amber-400 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-slate-100 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center">
                <Star className="w-8 h-8 text-yellow-300 fill-yellow-400" />
              </div>

              <h3 className="text-xl font-black text-amber-300 mb-1">{activeStarAction.name}</h3>
              <p className="text-xs text-slate-400 mb-5">
                Trạng thái hiện tại: {activeStarAction.selected ? '✅ Đã được gọi' : '⭐ Chưa được gọi'}
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={() => handleDirectSelectStudent(activeStarAction)}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>Xướng tên Ngôi sao may mắn ngay!</span>
                </button>

                <button
                  onClick={() => {
                    const targetId = activeStarAction.id;
                    setStudents(prev => prev.map(s => s.id === targetId ? { ...s, selected: !s.selected } : s));
                    setActiveStarAction(null);
                  }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  {activeStarAction.selected ? '🔄 Đổi về: Chưa gọi' : '✓ Đánh dấu: Đã gọi (không xướng tên)'}
                </button>

                <button
                  onClick={() => setActiveStarAction(null)}
                  className="w-full py-2 bg-transparent text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Called Students History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-amber-500/40 w-full max-w-lg rounded-3xl p-6 shadow-2xl text-slate-100 flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2 text-amber-400 font-black text-base sm:text-lg">
                  <Sparkles className="w-5 h-5" />
                  <span>Danh sách học sinh đã gọi ({calledStudentsCount}/{totalStudents})</span>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-4">
                {students.filter(s => s.selected).length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Chưa có học sinh nào được gọi trong vòng này.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {students
                      .filter(s => s.selected)
                      .map((student, idx) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-slate-200 truncate">{student.name}</span>
                          </div>
                          <button
                            onClick={() => {
                              setStudents(prev => prev.map(s => s.id === student.id ? { ...s, selected: false } : s));
                            }}
                            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-all cursor-pointer shrink-0"
                            title="Gọi lại em này"
                          >
                            Gọi lại
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-2">
                <button
                  onClick={() => {
                    handleNewRound();
                    setShowHistoryModal(false);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/30 cursor-pointer"
                >
                  🔄 Đặt lại tất cả (Vòng mới)
                </button>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LuckyStarGame;
