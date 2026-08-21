import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Sparkles, 
  Music, 
  Volume2, 
  VolumeX, 
  Play, 
  Square, 
  RotateCcw, 
  Upload, 
  Users, 
  CheckCircle2, 
  Award,
  Radio,
  Shuffle
} from 'lucide-react';
import { GameSetupConfig, Team, AnswerLog } from '../../types';
import { soundFx } from '../../utils/audio';
import { StudentImportButton } from '../StudentImportButton';

interface BearPassingGameProps {
  config: GameSetupConfig;
  onGameEnd: (teams: Team[], logs: AnswerLog[]) => void;
}

interface AudioTrack {
  id: string;
  name: string;
  url: string;
  isCustom?: boolean;
}

export const BearPassingGame: React.FC<BearPassingGameProps> = ({
  config,
  onGameEnd,
}) => {
  // Students List management with localStorage persistence
  const initialStudents = useMemo(() => {
    if (config.bearStudentsList && config.bearStudentsList.length > 0) {
      return config.bearStudentsList;
    }
    if (config.studentsList && config.studentsList.length > 0) {
      return config.studentsList;
    }
    try {
      const saved = localStorage.getItem('wey_saved_students_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Hoàng Cường', 'Phạm Minh Dũng', 'Hoàng Gia Em',
      'Vũ Thùy Linh', 'Đỗ Quang Minh', 'Bùi Hải Nam', 'Đặng Phương Nga', 'Trương Quốc Phong',
      'Ngô Gia Bảo', 'Đinh Khánh Huyền', 'Lâm Tuấn Kiệt', 'Võ Mai Phương', 'Hồ Đức Trí'
    ];
  }, [config.bearStudentsList, config.studentsList]);

  const [students, setStudents] = useState<string[]>(initialStudents);
  const [chosenStudents, setChosenStudents] = useState<string[]>([]);
  const [noRepeat, setNoRepeat] = useState<boolean>(true);

  // Music Tracks
  const defaultTracks: AudioTrack[] = [
    { id: 't1', name: 'Nhạc Nền 1', url: 'public/assets/nhacnen/music1.mp3' },
    { id: 't2', name: 'Nhạc Nền 2', url: 'public/assets/nhacnen/music2.mp3' },
    { id: 't3', name: 'Nhạc Nền 3', url: 'public/assets/nhacnen/music3.mp3' },
    { id: 't4', name: 'Nhạc Nền 4', url: 'public/assets/nhacnen/music4.mp3' },
    { id: 't5', name: 'Nhạc Nền 5', url: 'public/assets/nhacnen/music5.mp3' },
  ];

  const [tracks, setTracks] = useState<AudioTrack[]>(defaultTracks);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('t1');
  const [musicMode, setMusicMode] = useState<'order' | 'random'>(config.bearMusicMode || 'random');
  const [volume, setVolume] = useState<number>(0.8);

  // Hidden Duration Settings (in seconds)
  const minDuration = config.bearMinDuration || 10;
  const maxDuration = config.bearMaxDuration || 25;

  // Game / Stage State
  // 'idle' -> 'playing' -> 'stopped_reveal'
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'stopped_reveal'>('idle');
  const [currentBearIndex, setCurrentBearIndex] = useState<number>(0);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [roundNumber, setRoundNumber] = useState<number>(1);

  // Audio Ref & Fallback Synthesizer Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const passingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Available students who haven't been chosen yet
  const availableStudents = useMemo(() => {
    if (!noRepeat) return students;
    return students.filter(s => !chosenStudents.includes(s));
  }, [students, chosenStudents, noRepeat]);

  // Audio Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
      if (passingIntervalRef.current) clearInterval(passingIntervalRef.current);
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    };
  }, []);

  const stopAllAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
  };

  // Play synthetic upbeat music if mp3 file is not available
  const playSynthesizerMelody = () => {
    const melodyNotes = [261.63, 329.63, 392.00, 523.25, 440.00, 349.23, 392.00, 523.25];
    let noteIdx = 0;

    synthIntervalRef.current = setInterval(() => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(melodyNotes[noteIdx % melodyNotes.length], ctx.currentTime);
        gain.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
        noteIdx++;
      } catch (e) {}
    }, 200);
  };

  // Upload Custom MP3
  const handleUploadMp3 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const objectUrl = URL.createObjectURL(file);
    const newTrack: AudioTrack = {
      id: `custom_${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      url: objectUrl,
      isCustom: true,
    };

    setTracks(prev => [newTrack, ...prev]);
    setSelectedTrackId(newTrack.id);
  };

  // Start Bear Passing Round
  const handleStartRound = () => {
    if (availableStudents.length === 0) {
      if (confirm('Tất cả học sinh đã được nhận gấu! Bạn có muốn làm mới danh sách để tiếp tục?')) {
        setChosenStudents([]);
      } else {
        return;
      }
    }

    soundFx.buttonClick();
    setSelectedWinner(null);
    setGameState('playing');

    // 1. Pick track
    let trackToPlay = tracks.find(t => t.id === selectedTrackId) || tracks[0];
    if (musicMode === 'random' && tracks.length > 1) {
      const randIdx = Math.floor(Math.random() * tracks.length);
      trackToPlay = tracks[randIdx];
      setSelectedTrackId(trackToPlay.id);
    }

    // 2. Play Audio
    stopAllAudio();
    try {
      const audio = new Audio(trackToPlay.url);
      audio.volume = volume;
      audio.loop = true;
      audioRef.current = audio;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Audio playback fallback to synth:', err);
          playSynthesizerMelody();
        });
      }
    } catch (err) {
      playSynthesizerMelody();
    }

    // 3. Start Teddy Bear Passing Animation Loop around students
    let stepIndex = currentBearIndex;
    passingIntervalRef.current = setInterval(() => {
      stepIndex = (stepIndex + 1) % students.length;
      setCurrentBearIndex(stepIndex);
      soundFx.pointBeep();
    }, 180);

    // 4. RANDOM HIDDEN DURATION (NO countdown or clues shown to students!)
    const randomDurationMs = (minDuration + Math.random() * (maxDuration - minDuration)) * 1000;

    stopTimeoutRef.current = setTimeout(() => {
      handleStopRound();
    }, randomDurationMs);
  };

  // Immediate Stop when time hits
  const handleStopRound = () => {
    if (passingIntervalRef.current) clearInterval(passingIntervalRef.current);
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    stopAllAudio();

    // Select Winner based on candidate pool
    let candidatePool = noRepeat
      ? students.filter(s => !chosenStudents.includes(s))
      : students;

    if (candidatePool.length === 0) candidatePool = [...students];

    // Pick winner
    const chosenOne = candidatePool[Math.floor(Math.random() * candidatePool.length)];
    const finalStudentIdx = students.indexOf(chosenOne);
    if (finalStudentIdx !== -1) {
      setCurrentBearIndex(finalStudentIdx);
    }

    setSelectedWinner(chosenOne);
    if (noRepeat) {
      setChosenStudents(prev => [...prev, chosenOne]);
    }
    setGameState('stopped_reveal');
    setRoundNumber(prev => prev + 1);

    // Celebration
    soundFx.victory();
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
    });
  };

  // Manual Stop button for teacher
  const handleManualStop = () => {
    handleStopRound();
  };

  const handleFinishGame = () => {
    stopAllAudio();
    const fakeTeams: Team[] = [
      { id: 't1', name: 'Lớp Học', avatar: '🧸', color: '#4F683C', score: chosenStudents.length }
    ];
    onGameEnd(fakeTeams, []);
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-between p-3 sm:p-5 max-w-6xl mx-auto select-none">
      {/* Top Header */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/90 backdrop-blur-sm p-4 rounded-3xl border-2 border-[#DED5B8] shadow-sm mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl shadow-xs">
            🧸
          </div>
          <div>
            <h1 className="text-xl font-[900] text-[#35452E] flex items-center gap-2">
              Truyền Gấu Sân Khấu
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Vòng {roundNumber}
              </span>
            </h1>
            <p className="text-xs font-bold text-[#74806B]">
              Âm nhạc phát rộn ràng • Chú gấu dừng bất ngờ khi nhạc tắt để tìm người may mắn!
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          <StudentImportButton
            onImport={(imported) => {
              if (imported.length > 0) {
                setStudents(imported);
                setChosenStudents([]);
                try {
                  localStorage.setItem('wey_saved_students_list', JSON.stringify(imported));
                } catch (e) {}
              }
            }}
            variant="compact"
            buttonText="📁 Tải file Excel/CSV"
          />

          <div className="text-xs font-bold text-[#74806B] bg-[#FFFDF5] px-3 py-1.5 rounded-xl border border-[#DED5B8]">
            Đã chọn: <strong className="text-[#4F683C]">{chosenStudents.length}/{students.length}</strong> học sinh
          </div>

          <button
            onClick={handleFinishGame}
            className="px-3.5 py-2 bg-[#4F683C] hover:bg-[#3D522F] text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer"
          >
            Hoàn Tất
          </button>
        </div>
      </div>

      {/* Main Play Area */}
      <div className="w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Teacher Control Deck & Music Selector */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-white rounded-3xl p-5 border-2 border-[#DED5B8] shadow-sm min-h-[380px]">
          <div>
            <h3 className="text-sm font-[900] text-[#35452E] flex items-center gap-2 pb-2 border-b border-[#DED5B8] mb-3">
              <Music className="w-4 h-4 text-[#4F683C]" />
              <span>Bảng Điều Khiển Âm Nhạc</span>
            </h3>

            {/* Track Selection List */}
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
              {tracks.map(track => (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrackId(track.id)}
                  disabled={gameState === 'playing'}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center justify-between border transition ${
                    selectedTrackId === track.id
                      ? 'bg-[#E9F0D9] border-[#4F683C] text-[#35452E]'
                      : 'bg-[#FFFDF5] border-[#DED5B8] text-[#74806B] hover:bg-[#F8F4E6]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span>🎵</span>
                    <span className="truncate">{track.name}</span>
                  </div>
                  {selectedTrackId === track.id && (
                    <span className="w-2 h-2 rounded-full bg-[#4F683C]" />
                  )}
                </button>
              ))}
            </div>

            {/* Upload MP3 Option */}
            <label className="w-full py-2.5 px-3 bg-[#FFFDF5] hover:bg-[#E9F0D9] text-[#4F683C] border-2 border-dashed border-[#B9CDA0] rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition mb-4">
              <Upload className="w-4 h-4" />
              <span>Thêm Tệp Nhạc MP3 Của Thầy Cô</span>
              <input
                type="file"
                accept="audio/mp3,audio/*"
                onChange={handleUploadMp3}
                className="hidden"
                disabled={gameState === 'playing'}
              />
            </label>

            {/* Config Mode & Volume */}
            <div className="space-y-2.5 text-xs font-bold text-[#74806B]">
              <div className="flex items-center justify-between">
                <span>Chế độ phát nhạc:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setMusicMode('random')}
                    className={`px-2 py-1 rounded-lg border text-[11px] ${
                      musicMode === 'random' ? 'bg-[#4F683C] text-white border-[#4F683C]' : 'bg-white border-[#DED5B8]'
                    }`}
                  >
                    Ngẫu Nhiên
                  </button>
                  <button
                    onClick={() => setMusicMode('order')}
                    className={`px-2 py-1 rounded-lg border text-[11px] ${
                      musicMode === 'order' ? 'bg-[#4F683C] text-white border-[#4F683C]' : 'bg-white border-[#DED5B8]'
                    }`}
                  >
                    Cố Định
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span>Không chọn lặp lại:</span>
                <input
                  type="checkbox"
                  checked={noRepeat}
                  onChange={e => setNoRepeat(e.target.checked)}
                  className="rounded accent-[#4F683C] cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Volume2 className="w-4 h-4 text-[#4F683C]" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={e => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-[#4F683C] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="mt-4 pt-3 border-t border-[#DED5B8]">
            {gameState === 'playing' ? (
              <button
                onClick={handleManualStop}
                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-[900] text-base rounded-2xl shadow-lg border-2 border-red-600 animate-pulse flex items-center justify-center gap-2 cursor-pointer"
              >
                <Square className="w-5 h-5 fill-current" />
                <span>DỪNG NHẠC NGAY (CHỌN GẤU)</span>
              </button>
            ) : (
              <button
                onClick={handleStartRound}
                className="w-full py-4 bg-[#6F8F55] hover:bg-[#5F7E4B] text-white font-[900] text-base rounded-2xl shadow-lg border-2 border-[#5F7E4B] transform hover:-translate-y-0.5 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>BẮT ĐẦU TRUYỀN GẤU 🧸</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Interactive Stage Area */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-gradient-to-b from-[#FFFDF5] to-[#F5EFE0] rounded-3xl p-5 border-2 border-[#DED5B8] shadow-sm min-h-[420px] relative overflow-hidden">
          {/* Stage Atmosphere Header */}
          <div className="w-full flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#4F683C] bg-white px-3 py-1 rounded-xl border border-[#B9CDA0]">
                Sân Khấu Truyền Gấu ({students.length} Học Sinh)
              </span>
            </div>
            {gameState === 'playing' && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-black animate-pulse">
                <Radio className="w-3.5 h-3.5 text-red-500 animate-ping" />
                <span>ĐANG TRUYỀN GẤU... NHẠC ĐANG PHÁT!</span>
              </div>
            )}
          </div>

          {/* Central Animated Teddy Bear & Stage Spotlight */}
          <div className="relative w-full flex-1 flex flex-col items-center justify-center my-4 min-h-[260px]">
            {/* Spotlight Ray effect */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-72 h-72 rounded-full bg-amber-400 blur-3xl" />
            </div>

            {/* Giant Center Teddy Bear with motion */}
            <motion.div
              animate={
                gameState === 'playing'
                  ? { scale: [1, 1.15, 1], rotate: [-8, 8, -8] }
                  : { scale: 1, rotate: 0 }
              }
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="relative z-10 flex flex-col items-center"
            >
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-amber-100 border-4 border-amber-400 flex items-center justify-center text-6xl sm:text-7xl shadow-xl">
                🧸
              </div>
              <div className="mt-2 text-center">
                <span className="text-xs font-black text-[#4F683C] bg-white/90 px-3 py-1 rounded-full border border-[#DED5B8] shadow-xs">
                  {gameState === 'playing' ? 'Đang Chuyền Tay...' : 'Wey Teddy Bear'}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Student Roster Grid / Circle at Bottom */}
          <div className="w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
              {students.map((student, idx) => {
                const isHoldingBear = currentBearIndex === idx;
                const isAlreadyChosen = chosenStudents.includes(student);
                const isWinner = selectedWinner === student;

                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-2xl border-2 transition-all flex items-center gap-2 text-left relative overflow-hidden ${
                      isWinner
                        ? 'bg-amber-300 border-amber-600 text-amber-950 font-black shadow-lg scale-105 ring-4 ring-amber-400'
                        : isHoldingBear && gameState === 'playing'
                        ? 'bg-[#E9F0D9] border-[#4F683C] text-[#35452E] font-black scale-105 shadow-md'
                        : isAlreadyChosen
                        ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-60'
                        : 'bg-white border-[#DED5B8] text-[#35452E]'
                    }`}
                  >
                    <span className="text-base">
                      {isWinner ? '👑' : isHoldingBear ? '🧸' : isAlreadyChosen ? '✓' : '👤'}
                    </span>
                    <span className="text-xs truncate font-bold">{student}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Winner Reveal Modal / Banner */}
          <AnimatePresence>
            {selectedWinner && gameState === 'stopped_reveal' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-30 p-6 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 border-4 border-amber-500 rounded-3xl shadow-2xl text-center"
              >
                <div className="text-4xl mb-1 animate-bounce">🎉 🧸 👑</div>
                <h2 className="text-xs font-black uppercase tracking-widest text-amber-950 mb-1">
                  NHẠC ĐÃ DỪNG! BẠN ĐÃ ĐƯỢC CHỌN:
                </h2>
                <h1 className="text-2xl sm:text-4xl font-[900] text-[#35452E] tracking-tight bg-white/90 py-2 px-4 rounded-2xl border-2 border-amber-500 max-w-md mx-auto shadow-sm">
                  {selectedWinner}
                </h1>
                <p className="text-xs font-bold text-amber-950 mt-3">
                  Chúc mừng {selectedWinner} đã nhận được Chú Gấu May Mắn vòng {roundNumber - 1}!
                </p>
                <button
                  onClick={handleStartRound}
                  className="mt-4 px-6 py-2.5 bg-[#4F683C] hover:bg-[#3D522F] text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer"
                >
                  Bắt Đầu Vòng Tiếp Theo ➔
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
