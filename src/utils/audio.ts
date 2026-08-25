// Web Audio Synthesizer for high quality classroom sound effects

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Ignore audio errors
    }
  }

  public correct() {
    // Upward cheerful chime (Do-Mi-Sol-Do)
    const ctx = this.getContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.25, 0.15);
      }, idx * 100);
    });
  }

  public wrong() {
    // Low harsh buzz
    const ctx = this.getContext();
    if (!ctx) return;
    this.playTone(180, 'sawtooth', 0.4, 0.2);
    setTimeout(() => this.playTone(140, 'sawtooth', 0.4, 0.2), 120);
  }

  public diceRoll() {
    const ctx = this.getContext();
    if (!ctx) return;
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const freq = 400 + Math.random() * 400;
        this.playTone(freq, 'square', 0.05, 0.05);
      }, i * 60);
    }
  }

  public wheelTick() {
    this.playTone(800, 'triangle', 0.03, 0.08);
  }

  public seedDrop() {
    // Mancala seed drop sound
    const freq = 450 + Math.random() * 200;
    this.playTone(freq, 'sine', 0.08, 0.1);
  }

  public capture() {
    // Mancala / Ludo capture sound
    const notes = [300, 450, 600, 900];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'square', 0.1, 0.12), i * 80);
    });
  }

  public timerTick() {
    this.playTone(1000, 'sine', 0.04, 0.05);
  }

  public winFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;
    const melody = [
      { f: 523.25, d: 150 },
      { f: 659.25, d: 150 },
      { f: 783.99, d: 150 },
      { f: 1046.50, d: 350 },
      { f: 880.00, d: 150 },
      { f: 1046.50, d: 500 }
    ];
    let time = 0;
    melody.forEach((note) => {
      setTimeout(() => {
        this.playTone(note.f, 'triangle', note.d / 1000, 0.2);
      }, time);
      time += note.d;
    });
  }

  public getMute(): boolean {
    return !this.enabled;
  }

  public setMuted(muted: boolean) {
    this.enabled = !muted;
  }

  public toggleMute(): boolean {
    this.enabled = !this.enabled;
    return !this.enabled;
  }

  public buttonClick() {
    this.playTone(600, 'sine', 0.05, 0.08);
  }

  public cardFlip() {
    this.playTone(700, 'sine', 0.06, 0.08);
    setTimeout(() => this.playTone(950, 'sine', 0.08, 0.08), 40);
  }

  public victory() {
    this.winFanfare();
  }

  public pointBeep() {
    this.playTone(850, 'sine', 0.08, 0.1);
  }

  public laser() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  }

  public cardPower() {
    this.playTone(880, 'sine', 0.15, 0.15);
    setTimeout(() => this.playTone(1320, 'sine', 0.25, 0.15), 100);
  }

  public powerup() {
    this.playTone(587.33, 'sine', 0.1, 0.15);
    setTimeout(() => this.playTone(880, 'sine', 0.15, 0.15), 80);
    setTimeout(() => this.playTone(1174.66, 'sine', 0.25, 0.18), 160);
  }

  public play(sound: string) {
    switch (sound.toLowerCase()) {
      case 'correct':
      case 'right':
      case 'win':
        this.correct();
        break;
      case 'wrong':
      case 'incorrect':
      case 'fail':
      case 'error':
        this.wrong();
        break;
      case 'click':
      case 'select':
      case 'tap':
      case 'button':
        this.buttonClick();
        break;
      case 'flip':
      case 'card':
      case 'open':
        this.cardFlip();
        break;
      case 'roll':
      case 'dice':
      case 'spin':
        this.diceRoll();
        break;
      case 'tick':
      case 'timer':
        this.timerTick();
        break;
      case 'fanfare':
      case 'victory':
      case 'celebrate':
        this.winFanfare();
        break;
      case 'powerup':
      case 'power':
      case 'bonus':
        this.powerup();
        break;
      default:
        this.buttonClick();
        break;
    }
  }

  public playClick() {
    this.buttonClick();
  }

  public playCorrect() {
    this.correct();
  }

  public playWrong() {
    this.wrong();
  }

  public playFanfare() {
    this.winFanfare();
  }

  public playSpin() {
    this.wheelTick();
  }

  public playRoll() {
    this.diceRoll();
  }
}

export const soundFx = new AudioSynthesizer();
export const soundManager = soundFx;
