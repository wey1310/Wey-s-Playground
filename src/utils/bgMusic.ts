// Background Music Manager for Wey's Playground

export interface MusicTrack {
  id: string;
  name: string;
  file: string;
  description: string;
}

export const BG_MUSIC_TRACKS: MusicTrack[] = [
  { id: 'music1', name: 'Nhạc Nền 1 - Êm Dịu', file: '/assets/nhacnen/music1.mp3', description: 'Giai điệu thư giãn, nhẹ nhàng' },
  { id: 'music2', name: 'Nhạc Nền 2 - Vui Tươi', file: '/assets/nhacnen/music2.mp3', description: 'Âm sắc tươi sáng, năng động' },
  { id: 'music3', name: 'Nhạc Nền 3 - Khám Phá', file: '/assets/nhacnen/music3.mp3', description: 'Gợi mở trí tưởng tượng' },
  { id: 'music4', name: 'Nhạc Nền 4 - Tập Trung', file: '/assets/nhacnen/music4.mp3', description: 'Hỗ trợ tập trung suy nghĩ' },
  { id: 'music5', name: 'Nhạc Nền 5 - Thư Thái', file: '/assets/nhacnen/music5.mp3', description: 'Thanh thoát, êm đềm' },
];

class BackgroundMusicManager {
  private audio: HTMLAudioElement | null = null;
  private currentTrackIndex: number = 0;
  private isPlaying: boolean = false;
  private volume: number = 0.35;
  private isMuted: boolean = false;
  private synthLoopInterval: any = null;
  private synthAudioCtx: AudioContext | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Load saved preferences
    try {
      const savedVol = localStorage.getItem('wey_bg_music_volume');
      if (savedVol !== null) this.volume = parseFloat(savedVol);
      const savedTrack = localStorage.getItem('wey_bg_music_track');
      if (savedTrack) {
        const idx = BG_MUSIC_TRACKS.findIndex(t => t.id === savedTrack);
        if (idx !== -1) this.currentTrackIndex = idx;
      }
    } catch {}
  }

  public subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch {}
    });
  }

  public getStatus() {
    return {
      isPlaying: this.isPlaying,
      currentTrack: BG_MUSIC_TRACKS[this.currentTrackIndex],
      currentTrackIndex: this.currentTrackIndex,
      volume: this.volume,
      isMuted: this.isMuted,
      tracks: BG_MUSIC_TRACKS,
    };
  }

  public async play(trackIndex?: number) {
    if (typeof trackIndex === 'number' && trackIndex >= 0 && trackIndex < BG_MUSIC_TRACKS.length) {
      this.currentTrackIndex = trackIndex;
      try {
        localStorage.setItem('wey_bg_music_track', BG_MUSIC_TRACKS[trackIndex].id);
      } catch {}
    }

    const track = BG_MUSIC_TRACKS[this.currentTrackIndex];
    this.stopSynthFallback();

    if (!this.audio) {
      this.audio = new Audio();
      this.audio.loop = true;
      this.audio.addEventListener('error', () => {
        // If file not found in public/assets/nhacnen, smoothly fallback to gentle web audio synth ambient chime loop
        if (this.isPlaying) {
          this.startSynthFallback();
        }
      });
    }

    this.audio.src = track.file;
    this.audio.volume = this.isMuted ? 0 : this.volume;
    this.audio.loop = true;

    try {
      await this.audio.play();
      this.isPlaying = true;
    } catch {
      // Autoplay or missing file fallback
      this.isPlaying = true;
      this.startSynthFallback();
    }
    this.notify();
  }

  public pause() {
    this.isPlaying = false;
    if (this.audio) {
      this.audio.pause();
    }
    this.stopSynthFallback();
    this.notify();
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public setTrack(index: number) {
    this.currentTrackIndex = index;
    try {
      localStorage.setItem('wey_bg_music_track', BG_MUSIC_TRACKS[index].id);
    } catch {}
    if (this.isPlaying) {
      this.play(index);
    } else {
      this.notify();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('wey_bg_music_volume', this.volume.toString());
    } catch {}
    if (this.audio && !this.isMuted) {
      this.audio.volume = this.volume;
    }
    this.notify();
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.audio) {
      this.audio.volume = this.isMuted ? 0 : this.volume;
    }
    this.notify();
  }

  // Soft Ambient Synth Loop Fallback when mp3s are being uploaded
  private startSynthFallback() {
    this.stopSynthFallback();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.synthAudioCtx = new AudioCtx();

      const chords = [
        [261.63, 329.63, 392.00, 523.25], // C Major
        [220.00, 261.63, 329.63, 440.00], // A Minor
        [174.61, 220.00, 261.63, 349.23], // F Major
        [196.00, 246.94, 293.66, 392.00], // G Major
      ];
      let step = 0;

      const playChord = () => {
        if (!this.isPlaying || this.isMuted || !this.synthAudioCtx) return;
        const currentChord = chords[step % chords.length];
        step++;

        currentChord.forEach((freq, i) => {
          if (!this.synthAudioCtx) return;
          const osc = this.synthAudioCtx.createOscillator();
          const gain = this.synthAudioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.synthAudioCtx.currentTime);

          const volLevel = this.volume * 0.04;
          gain.gain.setValueAtTime(0.001, this.synthAudioCtx.currentTime + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(volLevel, this.synthAudioCtx.currentTime + i * 0.1 + 0.4);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.synthAudioCtx.currentTime + i * 0.1 + 2.8);

          osc.connect(gain);
          gain.connect(this.synthAudioCtx.destination);

          osc.start(this.synthAudioCtx.currentTime + i * 0.1);
          osc.stop(this.synthAudioCtx.currentTime + i * 0.1 + 3.0);
        });
      };

      playChord();
      this.synthLoopInterval = setInterval(playChord, 3200);
    } catch {}
  }

  private stopSynthFallback() {
    if (this.synthLoopInterval) {
      clearInterval(this.synthLoopInterval);
      this.synthLoopInterval = null;
    }
    if (this.synthAudioCtx) {
      try {
        this.synthAudioCtx.close();
      } catch {}
      this.synthAudioCtx = null;
    }
  }
}

export const bgMusicManager = new BackgroundMusicManager();
