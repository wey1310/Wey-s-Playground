import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  ListOrdered
} from 'lucide-react';
import { Question } from '../../types';

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
  const [winner, setWinner] = useState<StudentStar | null>(null);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Modals
  const [showManageModal, setShowManageModal] = useState<boolean>(false);
  const [showCountSelectModal, setShowCountSelectModal] = useState<boolean>(false);
  const [selectedPoolCount, setSelectedPoolCount] = useState<number | 'all'>('all');
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

  // Handle Stop timer and final winner determination
  useEffect(() => {
    if (gameState === 'STOPPING') {
      stopStartTimeRef.current = performance.now();

      const timer = setTimeout(() => {
        // Pool of available uncalled students
        const eligiblePool = students.filter(s => !s.selected && s.activeInPool);

        if (eligiblePool.length === 0) {
          setGameState('ROUND_COMPLETE');
          return;
        }

        // True Cryptographic/Secure Random Selection
        let winnerIndex = 0;
        if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
          const randArray = new Uint32Array(1);
          window.crypto.getRandomValues(randArray);
          winnerIndex = randArray[0] % eligiblePool.length;
        } else {
          winnerIndex = Math.floor(Math.random() * eligiblePool.length);
        }

        const pickedWinner = eligiblePool[winnerIndex];

        // Mark winner as selected
        setStudents(prev => prev.map(s => s.id === pickedWinner.id ? { ...s, selected: true } : s));
        setWinner(pickedWinner);
        setGameState('RESULT');
        setShowResultModal(true);
        audio.playVictory();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [gameState, students, audio]);

  // Statistics
  const totalStudents = students.length;
  const calledStudentsCount = students.filter(s => s.selected).length;
  const remainingCount = students.filter(s => !s.selected && s.activeInPool).length;
  const isAllCalled = totalStudents > 0 && remainingCount === 0;

  // Actions
  const handleStart = () => {
    if (gameState === 'SPINNING' || gameState === 'STOPPING') return;
    if (remainingCount === 0) {
      setGameState('ROUND_COMPLETE');
      return;
    }

    setWinner(null);
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

    setWinner(null);
    setShowResultModal(false);
    setSelectedPoolCount('all');
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
    setWinner(null);
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
    setWinner(null);
    setGameState('IDLE');
  };

  const handleApplyCountPool = (count: number | 'all') => {
    setSelectedPoolCount(count);
    if (count === 'all') {
      setStudents(prev => prev.map(s => ({ ...s, activeInPool: true })));
    } else {
      // Pick first N uncalled students or random subset
      let activated = 0;
      setStudents(prev => prev.map(s => {
        if (!s.selected && activated < count) {
          activated++;
          return { ...s, activeInPool: true };
        } else if (s.selected) {
          return { ...s, activeInPool: true };
        } else {
          return { ...s, activeInPool: false };
        }
      }));
    }
    setShowCountSelectModal(false);
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
      className="relative w-full h-[90vh] min-h-[640px] max-h-[1080px] bg-gradient-to-b from-[#060814] via-[#0B0F2A] to-[#040612] text-white rounded-3xl overflow-hidden shadow-2xl border border-indigo-950/60 select-none flex flex-col font-sans"
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
      <div className="relative z-10 pt-4 pb-2 px-6 flex flex-col items-center justify-center">
        {/* Quick status chips */}
        <div className="w-full flex items-center justify-between text-xs sm:text-sm font-medium text-amber-200/90 mb-1">
          <div className="flex items-center gap-2 bg-indigo-950/70 border border-amber-500/30 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Vòng {roundNumber}</span>
            <span className="text-white/40">•</span>
            <span>Đã gọi: <strong className="text-amber-300 font-bold">{calledStudentsCount}</strong> / {totalStudents}</span>
            <span className="text-white/40">•</span>
            <span>Còn lại: <strong className="text-emerald-400 font-bold">{remainingCount}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 border border-amber-500/30 text-amber-300 transition-all shadow-md active:scale-95"
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 border border-amber-500/30 text-amber-300 transition-all shadow-md active:scale-95"
              title="Toàn màn hình"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Grand Title */}
        <div className="text-center mt-1">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-wider bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(251,191,36,0.7)] flex items-center justify-center gap-2 sm:gap-3">
            <Star className="w-6 h-6 sm:w-10 sm:h-10 text-yellow-300 fill-yellow-300 animate-pulse drop-shadow-[0_0_12px_#FDE047]" />
            <span>NGÔI SAO MAY MẮN LÀ AI?</span>
            <Star className="w-6 h-6 sm:w-10 sm:h-10 text-yellow-300 fill-yellow-300 animate-pulse drop-shadow-[0_0_12px_#FDE047]" />
          </h1>
          <p className="text-xs sm:text-sm text-amber-200/70 mt-0.5 font-medium tracking-wide">
            {gameState === 'SPINNING' && '🌟 Các vì sao đang xáo trộn dữ dội trong vũ trụ...'}
            {gameState === 'STOPPING' && '✨ Vũ trụ đang thu hẹp để tìm kiếm ngôi sao sáng nhất...'}
            {gameState === 'IDLE' && '⭐ Sẵn sàng gọi tên học sinh may mắn tiếp theo!'}
            {gameState === 'ROUND_COMPLETE' && '🎉 Tất cả học sinh trong lớp đã được gọi! Bấm "Vòng mới" để chơi lại.'}
          </p>
        </div>
      </div>

      {/* Main Celestial Arena (The Starry Sky) */}
      <div className="relative flex-1 w-full overflow-hidden z-10">
        {students.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <Star className="w-16 h-16 text-yellow-400/50 mb-3 animate-bounce" />
            <h3 className="text-xl font-bold text-amber-200">Chưa có học sinh nào trong lớp</h3>
            <p className="text-sm text-slate-400 mt-1 mb-4 max-w-md">
              Thầy cô hãy nhấn "Quản lý học sinh" để dán danh sách lớp hoặc nạp danh sách mẫu có sẵn.
            </p>
            <button
              onClick={() => setShowManageModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              + Quản lý danh sách học sinh
            </button>
          </div>
        ) : (
          students.map((star, idx) => {
            const isWinnerStar = winner?.id === star.id;
            const isSpinning = gameState === 'SPINNING';
            const isStopping = gameState === 'STOPPING';
            const isDimmed = (gameState === 'RESULT' && !isWinnerStar) || star.selected || !star.activeInPool;

            return (
              <div
                key={star.id}
                style={{
                  position: 'absolute',
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  transform: 'translate(-50%, -50%)',
                  transition: isSpinning || isStopping ? 'none' : 'transform 0.4s ease-out, opacity 0.4s ease',
                  opacity: isDimmed ? 0.35 : 1,
                  zIndex: isWinnerStar ? 40 : star.selected ? 5 : 20,
                }}
                className="flex flex-col items-center justify-center cursor-pointer group"
              >
                {/* 5-Pointed Radiant Glowing Star SVG */}
                <div
                  className={`relative transition-all duration-300 ${
                    isWinnerStar
                      ? 'scale-150 animate-bounce'
                      : isSpinning
                      ? 'scale-110'
                      : 'hover:scale-125'
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-9 h-9 sm:w-12 sm:h-12 drop-shadow-[0_0_15px_rgba(253,224,71,0.9)]"
                    style={{
                      filter: `drop-shadow(0 0 ${isSpinning ? '18px' : '10px'} ${star.glowColor})`,
                    }}
                  >
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      fill={star.selected ? '#64748B' : star.color}
                      stroke={star.selected ? '#94A3B8' : '#FFFFFF'}
                      strokeWidth={isSpinning ? 1.5 : 1}
                    />
                  </svg>

                  {/* Sparkle halo when spinning */}
                  {isSpinning && (
                    <span className="absolute -inset-1 rounded-full border border-amber-300/60 animate-ping pointer-events-none" />
                  )}
                </div>

                {/* Student Name Pill */}
                <div
                  className={`mt-1 px-2.5 py-0.5 rounded-full text-center whitespace-nowrap text-xs sm:text-sm font-bold tracking-wide backdrop-blur-md border shadow-lg transition-all ${
                    star.selected
                      ? 'bg-slate-900/80 text-slate-400 border-slate-700/60 line-through'
                      : isWinnerStar
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 border-white shadow-[0_0_20px_#FDE047] scale-110'
                      : 'bg-slate-950/80 text-amber-100 border-amber-400/40 group-hover:border-amber-300 group-hover:text-white'
                  }`}
                >
                  {star.name}
                  {star.selected && (
                    <span className="ml-1 text-[10px] uppercase font-normal text-emerald-400">✓ Đã gọi</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Interactive Command Dock */}
      <div className="relative z-20 px-6 py-4 bg-slate-950/85 backdrop-blur-xl border-t border-amber-500/25 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
        {/* Left Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="lucky-star-manage-btn"
            onClick={() => setShowManageModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-950/80 hover:bg-indigo-900 text-amber-200 border border-amber-500/40 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Quản lý</span> Học sinh
          </button>

          <button
            id="lucky-star-select-count-btn"
            onClick={() => setShowCountSelectModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-950/80 hover:bg-indigo-900 text-amber-200 border border-amber-500/40 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95"
          >
            <ListOrdered className="w-4 h-4 text-amber-400" />
            <span>Chọn số {selectedPoolCount !== 'all' ? `(${selectedPoolCount})` : ''}</span>
          </button>

          <button
            id="lucky-star-shuffle-btn"
            onClick={handleShufflePositions}
            disabled={gameState === 'SPINNING' || gameState === 'STOPPING'}
            className="p-2.5 bg-indigo-950/80 hover:bg-indigo-900 disabled:opacity-40 text-amber-200 border border-amber-500/40 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95"
            title="Đổi vị trí các ngôi sao"
          >
            <Shuffle className="w-4 h-4 text-amber-400" />
          </button>
        </div>

        {/* Center Primary Game Action Button (START / STOP) */}
        <div className="flex items-center gap-3 mx-auto">
          {gameState !== 'SPINNING' ? (
            <button
              id="lucky-star-start-btn"
              onClick={handleStart}
              disabled={gameState === 'STOPPING' || remainingCount === 0}
              className="group relative flex items-center gap-2.5 px-8 sm:px-12 py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-lg sm:text-xl rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.6)] hover:shadow-[0_0_45px_rgba(251,191,36,0.9)] hover:scale-105 active:scale-95 transition-all uppercase tracking-wider disabled:opacity-50 disabled:pointer-events-none"
            >
              <Play className="w-6 h-6 fill-slate-950 group-hover:animate-ping" />
              <span>BẮT ĐẦU</span>
            </button>
          ) : (
            <button
              id="lucky-star-stop-btn"
              onClick={handleStop}
              className="flex items-center gap-2.5 px-8 sm:px-12 py-3 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 text-white font-black text-lg sm:text-xl rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.7)] hover:shadow-[0_0_45px_rgba(239,68,68,1)] hover:scale-105 active:scale-95 transition-all uppercase tracking-wider animate-pulse"
            >
              <Square className="w-6 h-6 fill-white" />
              <span>DỪNG LẠI</span>
            </button>
          )}

          <button
            id="lucky-star-new-round-btn"
            onClick={handleNewRound}
            disabled={gameState === 'SPINNING' || gameState === 'STOPPING'}
            className="flex items-center gap-1.5 px-4 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-amber-300 border border-amber-500/40 rounded-2xl font-bold text-sm transition-all shadow-md active:scale-95"
            title="Làm mới vòng chơi, gọi lại toàn bộ lớp"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden md:inline">Vòng mới</span>
          </button>
        </div>

        {/* Right Speed Multiplier Controls */}
        <div className="flex items-center gap-2 bg-indigo-950/80 border border-amber-500/30 px-3 py-1.5 rounded-xl">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-amber-200/80 font-medium hidden sm:inline">Tốc độ:</span>
          <div className="flex items-center gap-1">
            {[0.5, 1.0, 1.5, 2.0].map(speed => (
              <button
                key={speed}
                onClick={() => setSpeedMultiplier(speed)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
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
      </div>

      {/* Winner Result Modal Celebration */}
      <AnimatePresence>
        {showResultModal && winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50, rotate: -5 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.5, y: 50 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              className="relative max-w-lg w-full bg-gradient-to-b from-[#1E1B4B] via-[#0F172A] to-[#020617] border-2 border-amber-400 p-8 rounded-3xl shadow-[0_0_70px_rgba(251,191,36,0.8)] text-center flex flex-col items-center"
            >
              {/* Close icon */}
              <button
                onClick={() => setShowResultModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Sparkles header */}
              <div className="flex items-center justify-center gap-2 text-amber-300 mb-2">
                <Sparkles className="w-6 h-6 animate-spin text-yellow-300" />
                <span className="text-sm sm:text-base font-bold tracking-widest uppercase">✨ NGÔI SAO MAY MẮN ✨</span>
                <Sparkles className="w-6 h-6 animate-spin text-yellow-300" />
              </div>

              {/* Huge Golden Star */}
              <div className="my-4 relative">
                <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-2xl animate-pulse" />
                <svg viewBox="0 0 24 24" className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-[0_0_30px_#FDE047] animate-bounce">
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill="#FDE047"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>

              {/* Winner Student Name */}
              <h2 className="text-3xl sm:text-5xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 drop-shadow-[0_0_20px_rgba(251,191,36,0.8)] mb-2">
                {winner.name}
              </h2>

              <p className="text-sm text-amber-200/80 mb-6 font-medium">
                Xin chúc mừng em đã trở thành ngôi sao sáng nhất lượt này! ⭐
              </p>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                <button
                  onClick={() => {
                    setShowResultModal(false);
                    if (remainingCount > 0) {
                      handleStart();
                    }
                  }}
                  disabled={remainingCount === 0}
                  className="flex-1 min-w-[140px] px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-2xl shadow-lg hover:brightness-110 active:scale-95 transition-all text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>GỌI TIẾP</span>
                </button>

                <button
                  onClick={() => setShowResultModal(false)}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all text-sm sm:text-base"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
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
            className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-amber-500/40 w-full max-w-2xl max-h-[85vh] rounded-3xl p-6 shadow-2xl flex flex-col text-slate-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2 text-amber-300">
                  <Users className="w-6 h-6 text-amber-400" />
                  <h3 className="text-xl font-bold">Quản Lý Danh Sách Học Sinh ({students.length})</h3>
                </div>
                <button
                  onClick={() => setShowManageModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10"
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
                    className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm"
                  />
                  <button
                    onClick={handleAddStudent}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 text-sm transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm</span>
                  </button>
                </div>

                {/* Bulk Paste Area */}
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <label className="block text-xs font-bold text-amber-300 mb-1.5 uppercase">
                    📋 Dán danh sách nhiều học sinh (Mỗi dòng một tên):
                  </label>
                  <textarea
                    rows={4}
                    placeholder={`Nguyễn Văn A\nTrần Thị B\nLê Văn C\nPhạm Thị D`}
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-sm font-mono"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-400">Tự động loại bỏ số thứ tự ở đầu dòng</span>
                    <button
                      onClick={handlePasteRoster}
                      disabled={!pasteText.trim()}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-all active:scale-95"
                    >
                      Áp dụng danh sách mới
                    </button>
                  </div>
                </div>

                {/* Current Students List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Danh sách hiện tại:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleLoadDefaults}
                        className="text-xs text-amber-400 hover:underline"
                      >
                        Nạp 20 tên mẫu
                      </button>
                      <span className="text-slate-600">•</span>
                      <button
                        onClick={() => setStudents([])}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Xóa tất cả
                      </button>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-800 rounded-2xl p-2 bg-slate-950/50">
                    {students.length === 0 ? (
                      <p className="text-center text-xs text-slate-500 py-6">Danh sách trống</p>
                    ) : (
                      students.map((student, idx) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between px-3 py-2 bg-slate-900 hover:bg-slate-800/80 rounded-xl text-sm border border-slate-800"
                        >
                          <div className="flex items-center gap-2 flex-1 mr-2">
                            <span className="text-xs text-amber-500/80 w-6 font-mono font-bold">{idx + 1}.</span>
                            {editingStudentId === student.id ? (
                              <input
                                type="text"
                                value={editNameValue}
                                onChange={e => setEditNameValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSaveEdit(student.id)}
                                className="px-2 py-0.5 bg-slate-950 border border-amber-400 rounded text-sm text-white flex-1"
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
                                className="p-1.5 text-emerald-400 hover:bg-emerald-950/50 rounded"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingStudentId(student.id);
                                  setEditNameValue(student.name);
                                }}
                                className="p-1.5 text-slate-400 hover:text-amber-300 rounded"
                                title="Đổi tên"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              className="p-1.5 text-slate-400 hover:text-red-400 rounded"
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
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowManageModal(false)}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all"
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
            className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-amber-500/40 w-full max-w-md rounded-3xl p-6 shadow-2xl text-slate-100 text-center"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-amber-400" />
                  <span>Chọn số lượng học sinh tham gia</span>
                </h3>
                <button
                  onClick={() => setShowCountSelectModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-4">
                Chọn số lượng học sinh đưa vào vòng gọi tên hiện tại (Tổng lớp: {totalStudents} học sinh).
              </p>

              <div className="grid grid-cols-3 gap-2.5 mb-6">
                {[5, 10, 15, 20, 30].map(count => (
                  <button
                    key={count}
                    onClick={() => handleApplyCountPool(count)}
                    disabled={count > totalStudents}
                    className={`py-3 rounded-2xl font-black text-base border transition-all ${
                      selectedPoolCount === count
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg'
                        : 'bg-slate-950 text-slate-200 border-slate-700 hover:border-amber-400 disabled:opacity-30'
                    }`}
                  >
                    {count} em
                  </button>
                ))}

                <button
                  onClick={() => handleApplyCountPool('all')}
                  className={`py-3 rounded-2xl font-black text-base border transition-all ${
                    selectedPoolCount === 'all'
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg'
                      : 'bg-slate-950 text-slate-200 border-slate-700 hover:border-amber-400'
                  }`}
                >
                  Tất cả ({totalStudents})
                </button>
              </div>

              <button
                onClick={() => setShowCountSelectModal(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm"
              >
                Đóng
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LuckyStarGame;
