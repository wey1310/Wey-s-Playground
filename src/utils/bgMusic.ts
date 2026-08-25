// Background Music Manager with IndexedDB Local Upload, Safe Online Presets & Enhanced Synthesizer

export interface MusicTrack {
  id: string;
  name: string;
  file?: string;
  url?: string;
  blobUrl?: string;
  isCustom?: boolean;
  description: string;
}

export const DEFAULT_BG_MUSIC_TRACKS: MusicTrack[] = [
  { 
    id: 'music1', 
    name: 'Nhạc Nền 1 - Rộn Ràng Lớp Học', 
    file: '/assets/nhacnen/music1.mp3',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=happy-day-113985.mp3',
    description: 'Giai điệu vui tươi, hứng khởi cho giờ học' 
  },
  { 
    id: 'music2', 
    name: 'Nhạc Nền 2 - Vui Tươi Khám Phá', 
    file: '/assets/nhacnen/music2.mp3',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=funny-kids-110188.mp3',
    description: 'Âm sắc tươi sáng, năng động cho trò chơi' 
  },
  { 
    id: 'music3', 
    name: 'Nhạc Nền 3 - Khám Phá Tri Thức', 
    file: '/assets/nhacnen/music3.mp3',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=positive-happy-meditation-10332.mp3',
    description: 'Nhịp điệu gợi mở trí tưởng tượng' 
  },
  { 
    id: 'music4', 
    name: 'Nhạc Nền 4 - Tập Trung Suy Nghĩ', 
    file: '/assets/nhacnen/music4.mp3',
    url: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_7314227362.mp3?filename=playful-game-soundtrack-6377.mp3',
    description: 'Hỗ trợ tập trung suy nghĩ và trả lời' 
  },
  { 
    id: 'music5', 
    name: 'Nhạc Nền 5 - Thư Thái Êm Đềm', 
    file: '/assets/nhacnen/music5.mp3',
    url: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=cute-creature-123498.mp3',
    description: 'Thanh thoát, nhẹ nhàng cho giờ giải lao' 
  },
];

const DB_NAME = 'wey_bg_music_db';
const STORE_NAME = 'custom_tracks';

function openMusicDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

class BackgroundMusicManager {
  private audio: HTMLAudioElement | null = null;
  private currentTrackIndex: number = 0;
  private isPlaying: boolean = false;
  private volume: number = 0.4;
  private isMuted: boolean = false;
  private synthLoopInterval: any = null;
  private synthAudioCtx: AudioContext | null = null;
  private listeners: Set<() => void> = new Set();
  private tracks: MusicTrack[] = [...DEFAULT_BG_MUSIC_TRACKS];

  constructor() {
    this.initSavedPreferences();
    this.loadCustomTracksFromDB();
  }

  private initSavedPreferences() {
    try {
      const savedVol = localStorage.getItem('wey_bg_music_volume');
      if (savedVol !== null) this.volume = parseFloat(savedVol);
      const savedTrack = localStorage.getItem('wey_bg_music_track');
      if (savedTrack) {
        const idx = this.tracks.findIndex(t => t.id === savedTrack);
        if (idx !== -1) this.currentTrackIndex = idx;
      }
    } catch {}
  }

  private async loadCustomTracksFromDB() {
    try {
      const db = await openMusicDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const items: { id: string; name: string; blob: Blob; description: string }[] = req.result || [];
        const customTracks: MusicTrack[] = items.map(item => ({
          id: item.id,
          name: item.name,
          blobUrl: URL.createObjectURL(item.blob),
          isCustom: true,
          description: item.description || 'Bài nhạc do bạn tải lên',
        }));

        if (customTracks.length > 0) {
          this.tracks = [...DEFAULT_BG_MUSIC_TRACKS, ...customTracks];
          this.notify();
        }
      };
    } catch {}
  }

  public async addCustomTrack(file: File): Promise<MusicTrack> {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const name = file.name.replace(/\.[^/.]+$/, '');
    const track: MusicTrack = {
      id,
      name,
      blobUrl: URL.createObjectURL(file),
      isCustom: true,
      description: `Tải lên từ máy (${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
    };

    // Save to IndexedDB
    try {
      const db = await openMusicDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({
        id,
        name,
        blob: file,
        description: track.description,
      });
    } catch (e) {
      console.warn('Could not save custom audio to IndexedDB:', e);
    }

    this.tracks.push(track);
    this.currentTrackIndex = this.tracks.length - 1;
    this.notify();
    await this.play(this.currentTrackIndex);
    return track;
  }

  public async removeCustomTrack(id: string) {
    const idx = this.tracks.findIndex(t => t.id === id);
    if (idx === -1) return;

    try {
      const db = await openMusicDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
    } catch {}

    const wasCurrent = this.currentTrackIndex === idx;
    this.tracks = this.tracks.filter(t => t.id !== id);
    if (this.currentTrackIndex >= this.tracks.length) {
      this.currentTrackIndex = Math.max(0, this.tracks.length - 1);
    }

    if (wasCurrent && this.isPlaying) {
      this.play(this.currentTrackIndex);
    } else {
      this.notify();
    }
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
      currentTrack: this.tracks[this.currentTrackIndex] || this.tracks[0],
      currentTrackIndex: this.currentTrackIndex,
      volume: this.volume,
      isMuted: this.isMuted,
      tracks: this.tracks,
    };
  }

  private getAudioSourceCandidates(track: MusicTrack): string[] {
    const candidates: string[] = [];
    if (track.blobUrl) {
      candidates.push(track.blobUrl);
    }
    if (track.file) {
      const filename = track.file.split('/').pop() || 'music1.mp3';
      candidates.push(
        track.file,
        `/assets/nhacnen/${filename}`,
        `./assets/nhacnen/${filename}`,
        `/nhacnen/${filename}`,
        `/${filename}`
      );
    }
    if (track.url) {
      candidates.push(track.url);
    }
    return candidates;
  }

  public async play(trackIndex?: number) {
    if (typeof trackIndex === 'number' && trackIndex >= 0 && trackIndex < this.tracks.length) {
      this.currentTrackIndex = trackIndex;
      try {
        localStorage.setItem('wey_bg_music_track', this.tracks[trackIndex].id);
      } catch {}
    }

    const track = this.tracks[this.currentTrackIndex] || this.tracks[0];
    this.stopSynthFallback();

    if (!this.audio) {
      this.audio = new Audio();
      this.audio.loop = true;
      this.audio.crossOrigin = 'anonymous';
    }

    const sources = this.getAudioSourceCandidates(track);
    let playbackStarted = false;

    for (const src of sources) {
      try {
        this.audio.src = src;
        this.audio.volume = this.isMuted ? 0 : this.volume;
        this.audio.loop = true;
        await this.audio.play();
        this.isPlaying = true;
        playbackStarted = true;
        break;
      } catch (err) {
        // Try next source candidate
      }
    }

    if (!playbackStarted) {
      // Fallback melodic synth
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
    if (index < 0 || index >= this.tracks.length) return;
    this.currentTrackIndex = index;
    try {
      localStorage.setItem('wey_bg_music_track', this.tracks[index].id);
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

  // Melodic Classroom Ambient Synthesizer
  private startSynthFallback() {
    this.stopSynthFallback();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.synthAudioCtx = new AudioCtx();

      const melodies = [
        [523.25, 659.25, 783.99, 1046.5], // C Major
        [440.00, 554.37, 659.25, 880.00], // A Major
        [349.23, 440.00, 523.25, 698.46], // F Major
        [392.00, 493.88, 587.33, 783.99], // G Major
      ];
      let step = 0;

      const playChime = () => {
        if (!this.isPlaying || this.isMuted || !this.synthAudioCtx) return;
        const currentChords = melodies[step % melodies.length];
        step++;

        currentChords.forEach((freq, i) => {
          if (!this.synthAudioCtx) return;
          const osc = this.synthAudioCtx.createOscillator();
          const gain = this.synthAudioCtx.createGain();
          
          osc.type = i % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, this.synthAudioCtx.currentTime + i * 0.12);

          const volLevel = this.volume * 0.06;
          gain.gain.setValueAtTime(0.001, this.synthAudioCtx.currentTime + i * 0.12);
          gain.gain.linearRampToValueAtTime(volLevel, this.synthAudioCtx.currentTime + i * 0.12 + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.synthAudioCtx.currentTime + i * 0.12 + 2.5);

          osc.connect(gain);
          gain.connect(this.synthAudioCtx.destination);

          osc.start(this.synthAudioCtx.currentTime + i * 0.12);
          osc.stop(this.synthAudioCtx.currentTime + i * 0.12 + 2.6);
        });
      };

      playChime();
      this.synthLoopInterval = setInterval(playChime, 2800);
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
