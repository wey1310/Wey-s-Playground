/**
 * Web Speech Synthesis Service for Wey-Play
 * Provides natural Vietnamese voice announcement for student names, winners, and game prompts.
 */

export interface SpeechSettings {
  enabled: boolean;
  rate: number; // 0.5 to 2.0 (default 0.95 for clear classroom Vietnamese)
  pitch: number; // 0.5 to 1.5 (default 1.05)
  volume: number; // 0.0 to 1.0 (default 1.0)
  voiceURI?: string;
  phraseTemplate: 'name_only' | 'congrats' | 'invite' | 'lucky_star';
}

const SETTINGS_KEY = 'wey_speech_settings_v1';

const DEFAULT_SETTINGS: SpeechSettings = {
  enabled: true,
  rate: 0.95,
  pitch: 1.05,
  volume: 1.0,
  phraseTemplate: 'lucky_star',
};

class SpeechService {
  private settings: SpeechSettings;
  private voices: SpeechSynthesisVoice[] = [];
  private isInitialized = false;

  constructor() {
    this.settings = this.loadSettings();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
    }
  }

  private loadSettings(): SpeechSettings {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return { ...DEFAULT_SETTINGS };
  }

  public saveSettings(newSettings: Partial<SpeechSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      // ignore
    }
  }

  public getSettings(): SpeechSettings {
    return { ...this.settings };
  }

  public getIsMuted(): boolean {
    return !this.settings.enabled;
  }

  public toggleMute(): boolean {
    this.settings.enabled = !this.settings.enabled;
    this.saveSettings({ enabled: this.settings.enabled });
    if (!this.settings.enabled) {
      this.stop();
    }
    return !this.settings.enabled;
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  private initVoices() {
    if (!this.isSupported()) return;

    const populateVoices = () => {
      this.voices = window.speechSynthesis.getVoices();
      this.isInitialized = true;
    };

    populateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.isSupported()) return [];
    if (this.voices.length === 0) {
      this.voices = window.speechSynthesis.getVoices();
    }
    return this.voices;
  }

  public getBestVietnameseVoice(): SpeechSynthesisVoice | null {
    const allVoices = this.getVoices();
    if (allVoices.length === 0) return null;

    // If user explicitly picked a voiceURI
    if (this.settings.voiceURI) {
      const matched = allVoices.find(v => v.voiceURI === this.settings.voiceURI);
      if (matched) return matched;
    }

    // Priority 1: Vietnamese language voices
    const viVoices = allVoices.filter(
      v => v.lang && (v.lang.toLowerCase().startsWith('vi') || v.lang.toLowerCase().includes('vietnam'))
    );

    if (viVoices.length > 0) {
      // Prefer Google Tiếng Việt or natural online voices if available
      const natural = viVoices.find(
        v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('HoaiMy') || v.name.includes('NamMinh')
      );
      return natural || viVoices[0];
    }

    // Priority 2: Default voice
    const defaultVoice = allVoices.find(v => v.default);
    return defaultVoice || allVoices[0];
  }

  public stop() {
    if (!this.isSupported()) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }

  public speak(text: string, options?: { rate?: number; pitch?: number; volume?: number; onEnd?: () => void }) {
    if (!this.isSupported() || !this.settings.enabled || !text.trim()) return;

    try {
      window.speechSynthesis.cancel(); // Stop any pending utterance to avoid queue buildup

      const utterance = new SpeechSynthesisUtterance(text.trim());
      const voice = this.getBestVietnameseVoice();
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || 'vi-VN';
      } else {
        utterance.lang = 'vi-VN';
      }

      utterance.rate = options?.rate ?? this.settings.rate;
      utterance.pitch = options?.pitch ?? this.settings.pitch;
      utterance.volume = options?.volume ?? this.settings.volume;

      if (options?.onEnd) {
        utterance.onend = options.onEnd;
      }

      // Workaround for Chrome bug where utterance freezes after 15 seconds
      const resumeInterval = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearInterval(resumeInterval);
        } else {
          window.speechSynthesis.resume();
        }
      }, 5000);

      utterance.onerror = () => {
        clearInterval(resumeInterval);
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore synthesis errors
    }
  }

  public announceStudentWinner(studentName: string, templateOverride?: SpeechSettings['phraseTemplate']) {
    if (!studentName || !this.settings.enabled) return;

    const template = templateOverride || this.settings.phraseTemplate;
    let phrase = studentName;

    switch (template) {
      case 'lucky_star':
        phrase = `Chúc mừng ngôi sao may mắn: ${studentName}!`;
        break;
      case 'congrats':
        phrase = `Xin chúc mừng bạn ${studentName}!`;
        break;
      case 'invite':
        phrase = `Xin mời bạn: ${studentName}!`;
        break;
      case 'name_only':
      default:
        phrase = studentName;
        break;
    }

    this.speak(phrase);
  }

  public announceMultipleWinners(names: string[]) {
    if (!names || names.length === 0 || !this.settings.enabled) return;

    if (names.length === 1) {
      this.announceStudentWinner(names[0]);
      return;
    }

    const phrase = `Chúc mừng các bạn: ${names.join(', ')}!`;
    this.speak(phrase);
  }
}

export const speechService = new SpeechService();
