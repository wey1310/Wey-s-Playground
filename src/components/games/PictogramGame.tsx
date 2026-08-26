import { safeAlert, safeConfirm } from "../../utils/safeAlert";
import React, { useState, useEffect } from 'react';
import { GameSetupConfig, Question, AnswerLog, Team } from '../../types';
import { soundFx } from '../../utils/audio';
import { fetchWithAuth } from '../../utils/api';
import {
  Sparkles,
  Check,
  X,
  SkipForward,
  RefreshCw,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Plus,
  Trophy,
  ChevronRight,
  ChevronLeft,
  Database,
  Search,
  Wand2,
  Lock,
  Unlock,
  Settings,
  Upload,
  Trash2,
  HelpCircle,
} from 'lucide-react';

interface PictogramGameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: Team[], logs: AnswerLog[]) => void;
}

export type ImageSourceType = 'SEARCH' | 'GENERATED';

export interface HintImage {
  id: string;
  conceptIdea: string; // Meaning / Idea description (Teacher view ONLY)
  provider: ImageSourceType; // 'SEARCH' | 'GENERATED'
  searchKeyword: string;
  searchImageUrl: string;
  svgDataUri: string;
  imageUrl: string; // The active URL to render
  isRevealed: boolean; // Whether revealed for students
}

// ImageProvider Class Engine
export class ImageProvider {
  static getSearchUrl(keyword: string, seed: number = 1): string {
    const cleanKw = encodeURIComponent(keyword.trim() || 'concept');
    return `https://picsum.photos/seed/${cleanKw}_${seed}/400/400`;
  }

  static generateSvgDataUri(conceptIdea: string, index: number): string {
    const bgColors = [
      'linear-gradient(135deg, #fef08a 0%, #fde047 100%)',
      'linear-gradient(135deg, #bbf7d0 0%, #86efac 100%)',
      'linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%)',
      'linear-gradient(135deg, #fbcfe8 0%, #f472b6 100%)',
      'linear-gradient(135deg, #fed7aa 0%, #fb923c 100%)',
      'linear-gradient(135deg, #ddd6fe 0%, #c084fc 100%)',
    ];
    const emojis = ['⚡', '🌞', '💡', '🌱', '🔥', '⚙️', '⚖️', '🌊', '🚀', '🎯'];
    const emoji = emojis[index % emojis.length];

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="bg_${index}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#fef3c7" stop-opacity="0.8"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="36" fill="url(#bg_${index})" stroke="#f59e0b" stroke-width="4"/>
      <circle cx="100" cy="90" r="48" fill="#ffffff" stroke="#fbbf24" stroke-width="3" shadow="md"/>
      <text x="100" y="102" font-size="44" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
      <rect x="25" y="150" width="150" height="30" rx="12" fill="#d97706" opacity="0.9"/>
      <text x="100" y="169" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="sans-serif">HÌNH GỢI Ý #${index + 1}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  static resolveImageUrl(item: HintImage): string {
    if (item.imageUrl && item.imageUrl.startsWith('data:image')) {
      return item.imageUrl; // Custom uploaded image
    }
    if (item.provider === 'SEARCH') {
      return item.searchImageUrl || this.getSearchUrl(item.searchKeyword || 'concept', 1);
    }
    return item.svgDataUri || this.generateSvgDataUri(item.conceptIdea || `Gợi ý ${item.id}`, 0);
  }
}

export function PictogramGame({ config, questions, onGameEnd }: PictogramGameProps) {
  // Game Setup & Mode
  const isBankMode = config.mode === 'bank' && questions && questions.length > 0;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  const [teamsState, setTeamsState] = useState<Team[]>(
    config.teams && config.teams.length > 0
      ? config.teams
      : [
          { id: '1', name: 'Đội Đỏ', avatar: '🐉', color: '#ef4444', score: 0 },
          { id: '2', name: 'Đội Xanh', avatar: '🦅', color: '#3b82f6', score: 0 },
        ]
  );
  const [activeTeamIndex, setActiveTeamIndex] = useState<number>(0);
  const [logs, setLogs] = useState<AnswerLog[]>([]);

  // Phrase Setup States
  const [inputPhrase, setInputPhrase] = useState<string>('NĂNG LƯỢNG MẶT TRỜI');
  const [rawPhrasesInput, setRawPhrasesInput] = useState<string>(
    'NĂNG LƯỢNG MẶT TRỜI\nQUANG HỢP Ở THỰC VẬT\nHỆ TUẦN HOÀN NGƯỜI'
  );
  const [customInputTab, setCustomInputTab] = useState<'direct' | 'topic'>('direct');
  
  // Custom Topics Storage
  const [savedTopics, setSavedTopics] = useState<{id: string, name: string, phrases: string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('wey_saved_topics') || '[]'); } catch { return []; }
  });
  const handleSaveTopic = () => {
    if (!topicInput.trim() || !rawPhrasesInput.trim()) {
      safeAlert('Vui lòng nhập tên chủ đề và danh sách cụm từ trước khi lưu!');
      return;
    }
    const newTopic = { id: `topic_${Date.now()}`, name: topicInput.trim(), phrases: rawPhrasesInput.trim() };
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
      setTopicInput(t.name);
      setRawPhrasesInput(t.phrases);
      const lines = t.phrases.split('\n').map((l) => l.trim().toUpperCase()).filter((l) => l.length > 0);
      if (lines.length > 0) setInputPhrase(lines[0]);
    }
  };
  const [topicInput, setTopicInput] = useState<string>('Môi trường & Khoa học');
  const [isGeneratingTopicPhrases, setIsGeneratingTopicPhrases] = useState<boolean>(false);

  // Difficulty & Hints
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [hints, setHints] = useState<HintImage[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Gameplay Mode vs Teacher Mode
  const [currentPhrase, setCurrentPhrase] = useState<string>('NĂNG LƯỢNG MẶT TRỜI');
  const [isTeacherEditing, setIsTeacherEditing] = useState<boolean>(!isBankMode);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);

  const activeTeam = teamsState[activeTeamIndex] || teamsState[0];

  // AI Topic Phrase Suggestion Handler
  const handleSuggestPhrasesFromTopic = async () => {
    if (!topicInput.trim()) return;
    setIsGeneratingTopicPhrases(true);
    soundFx.buttonClick();

    try {
      const data = await fetchWithAuth('/api/generate-pictogram-phrases', {
        method: 'POST',
        body: JSON.stringify({ topic: topicInput.trim() }),
      });
      if (data.success && Array.isArray(data.phrases) && data.phrases.length > 0) {
        const text = data.phrases.join('\n');
        setRawPhrasesInput(text);
        setInputPhrase(data.phrases[0]);
        setCustomInputTab('direct');
      } else {
        throw new Error(data.error || 'Không tạo được cụm từ');
      }
    } catch (err: any) {
      safeAlert('Không thể tạo cụm từ theo chủ đề: ' + (err.message || 'Lỗi kết nối AI'));
    } finally {
      setIsGeneratingTopicPhrases(false);
    }
  };

  // Generate Hints API Call
  const generateHintsForPhrase = async (targetPhrase: string, diffLevel: 'easy' | 'medium' | 'hard' = difficulty) => {
    if (!targetPhrase.trim()) return;
    setIsGenerating(true);

    try {
      const data = await fetchWithAuth('/api/generate-pictogram', {
        method: 'POST',
        body: JSON.stringify({
          phrase: targetPhrase.trim().toUpperCase(),
          difficulty: diffLevel,
        }),
      });

      if (data.success && Array.isArray(data.hints) && data.hints.length > 0) {
        const formatted: HintImage[] = data.hints.map((h: any, idx: number) => {
          const provider: ImageSourceType = h.provider === 'SEARCH' ? 'SEARCH' : 'GENERATED';
          const keyword = h.searchKeyword || 'concept';
          const searchImageUrl = h.searchImageUrl || ImageProvider.getSearchUrl(keyword, idx + 1);
          const svgDataUri = h.svgDataUri || ImageProvider.generateSvgDataUri(h.conceptIdea || `Gợi ý ${idx + 1}`, idx);

          return {
            id: h.id || `hint_${Date.now()}_${idx}`,
            conceptIdea: h.conceptIdea || `Ý tưởng gợi ý #${idx + 1}`,
            provider,
            searchKeyword: keyword,
            searchImageUrl,
            svgDataUri,
            imageUrl: provider === 'SEARCH' ? searchImageUrl : svgDataUri,
            isRevealed: idx === 0, // Unlock first hint initially
          };
        });
        setHints(formatted);
        setCurrentPhrase(targetPhrase.trim().toUpperCase());
      } else {
        throw new Error(data.error || 'Lỗi tạo gợi ý từ server');
      }
    } catch (err) {
      console.warn('Fallback local hint generator:', err);
      // Fallback local logic creating 3-5 hint cards
      const targetCount = diffLevel === 'easy' ? 3 : diffLevel === 'hard' ? 5 : 4;
      const fallbackHints: HintImage[] = Array.from({ length: targetCount }).map((_, idx) => {
        const provider: ImageSourceType = idx % 2 === 0 ? 'SEARCH' : 'GENERATED';
        const keyword = `${targetPhrase}_${idx + 1}`;
        const searchImageUrl = ImageProvider.getSearchUrl(keyword, idx + 1);
        const svgDataUri = ImageProvider.generateSvgDataUri(`Ý tưởng #${idx + 1}`, idx);

        return {
          id: `hint_fallback_${Date.now()}_${idx}`,
          conceptIdea: `Ý tưởng gợi ý #${idx + 1} cho "${targetPhrase}"`,
          provider,
          searchKeyword: keyword,
          searchImageUrl,
          svgDataUri,
          imageUrl: provider === 'SEARCH' ? searchImageUrl : svgDataUri,
          isRevealed: idx === 0,
        };
      });
      setHints(fallbackHints);
      setCurrentPhrase(targetPhrase.trim().toUpperCase());
    } finally {
      setIsGenerating(false);
    }
  };

  // Load Bank Question
  const loadBankQuestion = async (index: number) => {
    if (!questions || questions.length === 0) return;
    const q = questions[index % questions.length];
    const phrase = String(q.content || q.correct || '').toUpperCase().trim();
    if (!phrase) return;

    setInputPhrase(phrase);
    setIsAnswerRevealed(false);
    await generateHintsForPhrase(phrase, difficulty);
  };

  useEffect(() => {
    if (isBankMode) {
      loadBankQuestion(0);
    } else {
      // Auto-generate initial hints for default phrase
      generateHintsForPhrase(inputPhrase, difficulty);
    }
  }, [config.mode]);

  const handleNextBankQuestion = () => {
    soundFx.buttonClick();
    if (currentQuestionIndex + 1 < questions.length) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      loadBankQuestion(nextIdx);
    } else {
      safeAlert('Đã hoàn thành tất cả câu hỏi trong ngân hàng!');
      handleFinishGame();
    }
  };

  const handlePrevBankQuestion = () => {
    soundFx.buttonClick();
    if (currentQuestionIndex > 0) {
      const prevIdx = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIdx);
      loadBankQuestion(prevIdx);
    }
  };

  // Teacher Card Management Handlers
  const handleToggleProvider = (index: number) => {
    soundFx.buttonClick();
    setHints((prev) =>
      prev.map((h, idx) => {
        if (idx !== index) return h;
        const newProvider: ImageSourceType = h.provider === 'SEARCH' ? 'GENERATED' : 'SEARCH';
        const newUrl = newProvider === 'SEARCH' ? h.searchImageUrl : h.svgDataUri;
        return {
          ...h,
          provider: newProvider,
          imageUrl: newUrl,
        };
      })
    );
  };

  const handleRegenerateHint = async (hintIndex: number) => {
    soundFx.buttonClick();
    const target = hints[hintIndex];
    if (!target) return;

    try {
      const data = await fetchWithAuth('/api/generate-pictogram', {
        method: 'POST',
        body: JSON.stringify({
          phrase: currentPhrase,
          difficulty,
          hintIndex,
        }),
      });
      if (data.success && data.hints && data.hints.length > 0) {
        const item = data.hints[0];
        setHints((prev) =>
          prev.map((h, idx) =>
            idx === hintIndex
              ? {
                  ...h,
                  conceptIdea: item.conceptIdea || h.conceptIdea,
                  svgDataUri: item.svgDataUri || h.svgDataUri,
                  searchImageUrl: item.searchImageUrl || h.searchImageUrl,
                  imageUrl: h.provider === 'SEARCH' ? (item.searchImageUrl || h.searchImageUrl) : (item.svgDataUri || h.svgDataUri),
                }
              : h
          )
        );
      }
    } catch {
      // Local refresh
      setHints((prev) =>
        prev.map((h, idx) =>
          idx === hintIndex
            ? {
                ...h,
                svgDataUri: ImageProvider.generateSvgDataUri(h.conceptIdea, idx + Date.now()),
                imageUrl: ImageProvider.generateSvgDataUri(h.conceptIdea, idx + Date.now()),
              }
            : h
        )
      );
    }
  };

  const handleUploadImage = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        if (result) {
          setHints((prev) =>
            prev.map((h, idx) => (idx === index ? { ...h, imageUrl: result } : h))
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddManualCard = () => {
    soundFx.buttonClick();
    const newIdx = hints.length;
    const newCard: HintImage = {
      id: `hint_manual_${Date.now()}`,
      conceptIdea: `Gợi ý bổ sung #${newIdx + 1}`,
      provider: 'GENERATED',
      searchKeyword: 'concept',
      searchImageUrl: ImageProvider.getSearchUrl('concept', newIdx + 1),
      svgDataUri: ImageProvider.generateSvgDataUri(`Gợi ý #${newIdx + 1}`, newIdx),
      imageUrl: ImageProvider.generateSvgDataUri(`Gợi ý #${newIdx + 1}`, newIdx),
      isRevealed: false,
    };
    setHints([...hints, newCard]);
  };

  const handleRemoveCard = (index: number) => {
    soundFx.buttonClick();
    setHints((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateConceptIdea = (index: number, newIdea: string) => {
    setHints((prev) =>
      prev.map((h, idx) => (idx === index ? { ...h, conceptIdea: newIdea } : h))
    );
  };

  // Student Gameplay Handlers
  const handleRevealNextHint = () => {
    soundFx.buttonClick();
    const nextUnrevealedIndex = hints.findIndex((h) => !h.isRevealed);
    if (nextUnrevealedIndex !== -1) {
      setHints((prev) =>
        prev.map((h, idx) => (idx === nextUnrevealedIndex ? { ...h, isRevealed: true } : h))
      );
    }
  };

  const handleToggleCardReveal = (index: number) => {
    soundFx.buttonClick();
    setHints((prev) =>
      prev.map((h, idx) => (idx === index ? { ...h, isRevealed: !h.isRevealed } : h))
    );
  };

  const handleAnswerResult = (isCorrect: boolean) => {
    if (isCorrect) {
      soundFx.correct();
      setIsAnswerRevealed(true);
      // Unlock all hints
      setHints((prev) => prev.map((h) => ({ ...h, isRevealed: true })));

      // Award 200 pts
      const points = 200;
      setTeamsState((prev) =>
        prev.map((t, idx) => (idx === activeTeamIndex ? { ...t, score: t.score + points } : t))
      );

      setLogs((prev) => [
        ...prev,
        {
          questionNumber: isBankMode ? currentQuestionIndex + 1 : logs.length + 1,
          questionText: `Nhìn hình đoán chữ: ${currentPhrase}`,
          correctAnswer: currentPhrase,
          teamName: activeTeam.name,
          isCorrect: true,
        },
      ]);
    } else {
      soundFx.wrong();
      setLogs((prev) => [
        ...prev,
        {
          questionNumber: isBankMode ? currentQuestionIndex + 1 : logs.length + 1,
          questionText: `Nhìn hình đoán chữ: ${currentPhrase}`,
          correctAnswer: currentPhrase,
          teamName: activeTeam.name,
          isCorrect: false,
        },
      ]);
      // Switch team turn
      setActiveTeamIndex((prev) => (prev + 1) % teamsState.length);
    }
  };

  const handleSkip = () => {
    soundFx.buttonClick();
    setIsAnswerRevealed(true);
    setHints((prev) => prev.map((h) => ({ ...h, isRevealed: true })));
  };

  const handleFinishGame = () => {
    soundFx.winFanfare();
    onGameEnd(teamsState, logs);
  };

  return (
    <div className="flex-1 min-h-0 w-full p-4 sm:p-6 bg-gradient-to-b from-amber-50 via-sky-50 to-pink-50 rounded-3xl shadow-2xl flex flex-col justify-between border-4 border-amber-300">
      {/* Top Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/95 backdrop-blur p-4 rounded-2xl border-2 border-amber-200 shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎨</span>
          <div>
            <h2 className="text-xl font-extrabold text-amber-950 flex items-center gap-2">
              <span>Nhìn Hình Đoán Chữ</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300 flex items-center gap-1">
                {isBankMode ? <Database className="w-3.5 h-3.5 text-amber-600" /> : <Sparkles className="w-3.5 h-3.5 text-amber-600" />}
                <span>{isBankMode ? `Ngân Hàng (${currentQuestionIndex + 1}/${questions.length})` : 'Giáo Viên Soạn Cụm Từ'}</span>
              </span>
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Quan sát bộ hình gợi ý ➔ Liên tưởng các ý tưởng ➔ Ghép nghĩa đoán câu!
            </p>
          </div>
        </div>

        {/* Team Scoreboard */}
        <div className="flex items-center gap-2 sm:gap-3">
          {teamsState.map((team, idx) => (
            <div
              key={team.id}
              className={`px-3 py-1.5 rounded-xl border-2 transition-all flex items-center gap-2 font-bold text-xs ${
                activeTeamIndex === idx
                  ? 'border-amber-500 bg-amber-100 text-amber-950 shadow-md scale-105 ring-2 ring-amber-400/30'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              <span className="text-base">{team.avatar}</span>
              <div>
                <div className="text-[11px] font-black">{team.name}</div>
                <div className="text-amber-700 font-mono">{team.score}đ</div>
              </div>
            </div>
          ))}

          {/* Toggle Teacher Editing Mode Button */}
          <button
            onClick={() => setIsTeacherEditing(!isTeacherEditing)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm border transition flex items-center gap-1.5 ${
              isTeacherEditing
                ? 'bg-amber-500 text-w-text-main border-amber-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
            title="Màn hình chỉnh sửa hình gợi ý của giáo viên"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">{isTeacherEditing ? 'Chế Độ Học Sinh' : 'Chỉnh Sửa (Giáo Viên)'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isTeacherEditing ? (
        /* MÀN HÌNH GIÁO VIÊN - CHỈNH SỬA & PREVIEW HÌNH GỢI Ý */
        <div className="my-6 max-w-4xl mx-auto w-full bg-white/95 p-6 sm:p-8 rounded-3xl border-4 border-amber-300 shadow-2xl space-y-6">
          <div className="text-center space-y-2 border-b-2 border-amber-100 pb-4">
            <span className="text-4xl inline-block">👩‍🏫</span>
            <h3 className="text-2xl font-black text-amber-950">MÀN HÌNH GIÁO VIÊN – CẤU HÌNH CỤM TỪ & BỘ HÌNH GỢI Ý</h3>
            <p className="text-xs text-slate-600 font-medium">
              Nhập cụm từ/câu, AI sẽ tự động phân tích và tạo bộ 3–6 hình gợi ý. Giáo viên có thể tùy chỉnh nguồn ảnh, tạo lại hoặc tải ảnh riêng.
            </p>
          </div>

          <div className="space-y-6">
            {/* 1. INPUT PHRASE SECTION */}
            <div className="space-y-3 bg-amber-50/70 p-4 rounded-2xl border-2 border-amber-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-black text-amber-950 uppercase tracking-wider">
                  1. NHẬP CỤM TỪ / CÂU ĐÁP ÁN:
                </label>
                <div className="flex bg-white p-1 rounded-xl border border-amber-200 text-xs font-bold gap-1 shadow-sm">
                  <button
                    onClick={() => setCustomInputTab('direct')}
                    className={`px-3 py-1 rounded-lg transition ${
                      customInputTab === 'direct'
                        ? 'bg-amber-500 text-w-text-main shadow-sm'
                        : 'text-slate-600 hover:text-amber-900'
                    }`}
                  >
                    ✏️ Nhập Trực Tiếp
                  </button>
                  <button
                    onClick={() => setCustomInputTab('topic')}
                    className={`px-3 py-1 rounded-lg transition ${
                      customInputTab === 'topic'
                        ? 'bg-amber-500 text-w-text-main shadow-sm'
                        : 'text-slate-600 hover:text-amber-900'
                    }`}
                  >
                    💡 AI Gợi Ý Theo Chủ Đề
                  </button>
                </div>
              </div>

              {customInputTab === 'direct' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-amber-100/50 p-2 rounded-xl border border-amber-200">
                    <label className="block text-xs font-bold text-amber-900">Kho Chủ Đề Đã Lưu:</label>
                    <select onChange={handleLoadTopic} className="bg-white border border-amber-200 text-amber-900 font-bold rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-amber-500">
                      <option value="">-- Chọn chủ đề có sẵn --</option>
                      {savedTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <textarea
                    rows={3}
                    value={rawPhrasesInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRawPhrasesInput(val);
                      const lines = val.split('\n').map((l) => l.trim().toUpperCase()).filter((l) => l.length > 0);
                      if (lines.length > 0) {
                        setInputPhrase(lines[0]);
                      }
                    }}
                    placeholder={`Ví dụ:\nNĂNG LƯỢNG MẶT TRỜI\nQUANG HỢP Ở THỰC VẬT`}
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-amber-300 rounded-xl text-amber-950 font-black text-base focus:outline-none focus:border-amber-500 uppercase shadow-inner resize-y"
                  />
                  {rawPhrasesInput.split('\n').filter((l) => l.trim().length > 0).length > 1 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[11px] font-bold text-amber-900">Chọn câu đang xem:</span>
                      {rawPhrasesInput
                        .split('\n')
                        .map((l) => l.trim().toUpperCase())
                        .filter((l) => l.length > 0)
                        .map((phrase, pIdx) => (
                          <button
                            key={pIdx}
                            onClick={() => {
                              setInputPhrase(phrase);
                              generateHintsForPhrase(phrase, difficulty);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-black transition ${
                              inputPhrase === phrase
                                ? 'bg-amber-500 text-w-text-main shadow'
                                : 'bg-white text-slate-700 border border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            {phrase}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      placeholder="Chủ đề: Quang hợp ở thực vật, Môi trường sống..."
                      className="flex-1 px-3.5 py-2 bg-white border-2 border-amber-300 rounded-xl text-amber-950 font-bold text-xs focus:outline-none focus:border-amber-500 shadow-inner"
                    />
                    <button
                      onClick={handleSuggestPhrasesFromTopic}
                      disabled={isGeneratingTopicPhrases || !topicInput.trim()}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-w-text-main font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isGeneratingTopicPhrases ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingTopicPhrases ? 'Đang tạo...' : '✨ AI Gợi Ý Cụm Từ'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. DIFFICULTY SELECTION */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-amber-950 uppercase tracking-wider">
                2. MỨC ĐỘ VÀ SỐ HÌNH GỢI Ý:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'easy', label: '🟢 Dễ (3–4 hình)', desc: 'Hình minh họa trực tiếp, dễ liên tưởng' },
                  { id: 'medium', label: '🟡 Trung Bình (4–5 hình)', desc: 'Hình mang tính liên tưởng ghép ý' },
                  { id: 'hard', label: '🔴 Khó (5–6 hình)', desc: 'Hình ẩn dụ/trừu tượng, cần tư duy sâu' },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => {
                      setDifficulty(lvl.id as any);
                      generateHintsForPhrase(inputPhrase, lvl.id as any);
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition ${
                      difficulty === lvl.id
                        ? 'border-amber-500 bg-amber-100 text-amber-950 shadow-md font-bold ring-2 ring-amber-300'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-sm font-black">{lvl.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{lvl.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. GENERATED HINT CARDS PREVIEW IN TEACHER VIEW */}
            <div className="p-4 sm:p-5 bg-amber-50/80 rounded-2xl border-2 border-amber-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black text-amber-950 flex items-center gap-1.5 uppercase">
                  <Wand2 className="w-4 h-4 text-amber-600" />
                  <span>3. BỘ HÌNH GỢI Ý BẰNG AI DÀNH CHO: "{inputPhrase}" ({hints.length} HÌNH)</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddManualCard}
                    className="px-2.5 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-xs rounded-xl transition flex items-center gap-1 border border-amber-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>➕ Thêm Hình</span>
                  </button>

                  <button
                    onClick={() => generateHintsForPhrase(inputPhrase, difficulty)}
                    disabled={isGenerating || !inputPhrase.trim()}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-w-text-main font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>{isGenerating ? 'Đang tạo hình...' : '✨ TẠO HÌNH GỢI Ý'}</span>
                  </button>
                </div>
              </div>

              {hints.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                  {hints.map((h, idx) => (
                    <div
                      key={h.id}
                      className="bg-white border-2 border-amber-300 rounded-2xl p-3 space-y-3 relative shadow-md hover:border-amber-500 transition flex flex-col justify-between"
                    >
                      {/* Image Preview Box */}
                      <div className="relative group bg-amber-50/60 rounded-xl p-2 border border-amber-200 flex items-center justify-center h-36 overflow-hidden">
                        <img
                          src={ImageProvider.resolveImageUrl(h)}
                          alt={h.conceptIdea}
                          className="max-h-32 max-w-full object-contain rounded-lg"
                        />

                        {/* Source Tag Badge for Teacher ONLY */}
                        <div className="absolute top-2 left-2 z-10">
                          <button
                            onClick={() => handleToggleProvider(idx)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black shadow flex items-center gap-1 border ${
                              h.provider === 'SEARCH'
                                ? 'bg-sky-500 text-w-text-main border-sky-600'
                                : 'bg-purple-600 text-w-text-main border-purple-700'
                            }`}
                            title="Click để chuyển đổi nguồn SEARCH (kho ảnh) ↔ GENERATED (AI vẽ)"
                          >
                            {h.provider === 'SEARCH' ? <Search className="w-3 h-3" /> : <Wand2 className="w-3 h-3" />}
                            <span>{h.provider}</span>
                          </button>
                        </div>

                        {/* Hover Quick Actions */}
                        <div className="absolute inset-0 bg-w-bg-alt opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 p-1">
                          <label className="p-1.5 bg-white text-slate-800 rounded-xl shadow cursor-pointer hover:bg-amber-100 transition text-[11px] font-bold flex items-center gap-1">
                            <Upload className="w-3.5 h-3.5 text-amber-600" />
                            <span>Tải Ảnh</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleUploadImage(idx, e)}
                              className="hidden"
                            />
                          </label>

                          <button
                            onClick={() => handleRegenerateHint(idx)}
                            title="Yêu cầu AI vẽ lại hình này"
                            className="p-1.5 bg-amber-500 text-w-text-main rounded-xl shadow hover:bg-amber-600 transition text-[11px] font-bold flex items-center gap-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Tạo lại</span>
                          </button>
                        </div>
                      </div>

                      {/* Concept Description for Teacher */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                          <span>Gợi ý #{idx + 1}:</span>
                          <span className="text-[10px] text-w-text-muted italic">Chỉ giáo viên thấy</span>
                        </div>
                        <input
                          type="text"
                          value={h.conceptIdea}
                          onChange={(e) => handleUpdateConceptIdea(idx, e.target.value)}
                          className="w-full text-xs font-bold bg-slate-50 border border-amber-200 rounded-lg py-1 px-2 text-slate-800 focus:outline-none focus:border-amber-400"
                          placeholder="Mô tả ý tưởng hình gợi ý"
                        />
                      </div>

                      {/* Remove Button */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-[10px] text-w-text-muted font-mono">ID: {h.id.slice(-4)}</span>
                        <button
                          onClick={() => handleRemoveCard(idx)}
                          className="px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>🗑 Xóa</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500 font-medium italic">
                  Chưa có hình gợi ý nào. Nhấn "[ ✨ TẠO HÌNH GỢI Ý ]" để hệ thống tự tạo bộ hình minh họa.
                </div>
              )}
            </div>

            {/* LAUNCH GAMEPLAY BUTTON */}
            <button
              onClick={() => {
                if (hints.length === 0) {
                  generateHintsForPhrase(inputPhrase, difficulty);
                }
                setIsTeacherEditing(false);
                soundFx.correct();
              }}
              disabled={isGenerating}
              className="w-full py-4 bg-[#6B8E5C] hover:bg-[#58784B] text-w-text-main font-black text-base rounded-2xl shadow-xl transition flex items-center justify-center gap-2 transform hover:scale-[1.01]"
            >
              {isGenerating ? (
                <RefreshCw className="w-5 h-5 text-amber-200 animate-spin" />
              ) : (
                <Check className="w-5 h-5 text-amber-200" />
              )}
              <span>
                {isGenerating
                  ? 'ĐANG TẠO HÌNH GỢI Ý BẰNG AI...'
                  : '✓ DÙNG HÌNH NÀY & BẮT ĐẦU VÒNG THI (MÀN HÌNH HỌC SINH)'}
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* MÀN HÌNH HỌC SINH - STUDENT GAMEPLAY ARENA */
        <div className="my-6 space-y-6 flex-1 flex flex-col justify-between">
          {/* Active Turn & Navigation Banner */}
          <div className="bg-white/95 border-2 border-amber-300 p-4 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{activeTeam.avatar}</span>
              <div>
                <div className="text-xs font-black text-amber-950">
                  LƯỢT ĐOÁN CỦA: <span className="text-amber-700 font-extrabold">{activeTeam.name}</span>
                </div>
                {isBankMode && (
                  <div className="text-[11px] text-indigo-700 font-bold flex items-center gap-1 mt-0.5">
                    <span>Câu #{currentQuestionIndex + 1} / {questions.length}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bank Navigation Controls */}
            {isBankMode && (
              <div className="flex items-center gap-2 bg-amber-50 p-1.5 rounded-xl border border-amber-200">
                <button
                  onClick={handlePrevBankQuestion}
                  disabled={currentQuestionIndex === 0 || isGenerating}
                  className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-lg border border-amber-300 disabled:opacity-40 transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Câu Trước</span>
                </button>
                <span className="text-xs font-black px-2 text-amber-900 font-mono">
                  #{currentQuestionIndex + 1}
                </span>
                <button
                  onClick={handleNextBankQuestion}
                  disabled={currentQuestionIndex >= questions.length - 1 || isGenerating}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-w-text-main font-bold text-xs rounded-lg shadow-sm disabled:opacity-40 transition flex items-center gap-1"
                >
                  <span>Câu Tiếp</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                Mức độ: {difficulty === 'easy' ? '🟢 Dễ' : difficulty === 'hard' ? '🔴 Khó' : '🟡 Trung Bình'}
              </span>
              <button
                onClick={() => setIsTeacherEditing(true)}
                className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-bold rounded-lg border border-amber-300 transition flex items-center gap-1"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Sửa Hình</span>
              </button>
            </div>
          </div>

          {/* Center Hint Cards Display Area (Student View) */}
          <div className="p-6 sm:p-8 bg-white/95 border-4 border-amber-300 rounded-3xl shadow-2xl space-y-6 flex-1 flex flex-col items-center justify-center relative">
            {isGenerating ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-10 h-10 text-amber-500 animate-spin mx-auto" />
                <div className="text-base font-black text-amber-950">AI đang vẽ bộ hình gợi ý cho đáp án...</div>
                <div className="text-xs text-slate-500">Vui lòng chờ giây lát trong khi AI phân tích ý tưởng</div>
              </div>
            ) : (
              <>
                <div className="text-center space-y-1">
                  <span className="text-xs font-black text-amber-900 bg-amber-100 px-4 py-1.5 rounded-full uppercase tracking-wider border border-amber-200 shadow-sm">
                    🖼️ CÁC HÌNH GỢI Ý
                  </span>
                  <p className="text-[11px] text-slate-500 pt-1 font-medium">
                    Hãy quan sát các hình bên dưới, suy luận mối liên hệ để đoán toàn bộ cụm từ/câu!
                  </p>
                </div>

                {/* Grid of Student Hint Cards */}
                <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6 max-w-5xl">
                  {hints.map((hint, idx) => (
                    <div
                      key={hint.id}
                      onClick={() => handleToggleCardReveal(idx)}
                      className={`relative w-44 h-56 sm:w-52 sm:h-64 rounded-3xl border-4 cursor-pointer transition-all duration-500 transform ${
                        hint.isRevealed
                          ? 'border-amber-400 bg-amber-50 shadow-2xl scale-100 hover:scale-105'
                          : 'border-slate-300 bg-gradient-to-b from-slate-100 to-slate-200 shadow-md scale-95 hover:border-amber-300 hover:scale-100'
                      }`}
                    >
                      {hint.isRevealed ? (
                        /* UNLOCKED CARD - NO WORD TEXT, NO METADATA */
                        <div className="h-full flex flex-col items-center justify-between p-3.5 animate-fade-in">
                          <div className="text-[11px] font-black text-amber-900 bg-amber-200/90 px-3 py-0.5 rounded-full border border-amber-300 shadow-sm">
                            HÌNH {idx + 1}
                          </div>

                          <div className="my-auto flex items-center justify-center w-full h-36 sm:h-40 overflow-hidden">
                            <img
                              src={ImageProvider.resolveImageUrl(hint)}
                              alt={`HÌNH ${idx + 1}`}
                              className="max-h-full max-w-full object-contain drop-shadow-md hover:scale-110 transition duration-300"
                            />
                          </div>

                          {/* ABSOLUTELY NO ANSWER TEXT BELOW IMAGE */}
                          <div className="text-[10px] font-bold text-amber-800/80 bg-amber-100/60 px-2.5 py-0.5 rounded-full">
                            Hình gợi ý #{idx + 1}
                          </div>
                        </div>
                      ) : (
                        /* LOCKED CARD */
                        <div className="h-full flex flex-col items-center justify-center p-4 text-center space-y-3 select-none">
                          <div className="w-16 h-16 rounded-2xl bg-amber-200/60 border-2 border-amber-300 flex items-center justify-center text-3xl font-black text-amber-800 shadow-inner">
                            <Lock className="w-7 h-7 text-amber-800" />
                          </div>
                          <div className="text-xs font-black text-slate-700">HÌNH {idx + 1}</div>
                          <div className="text-[10px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200">
                            Chưa mở (Click để lật)
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* ANSWER DISPLAY AREA FOR TEACHER / REVEAL */}
                <div className="pt-4 text-center space-y-2">
                  <div className="text-xs font-mono font-bold text-amber-900 uppercase tracking-widest flex items-center justify-center gap-1.5">
                    <span>CỤM TỪ / CÂU ĐÁP ÁN:</span>
                  </div>
                  <div className="px-6 py-3 bg-amber-100/90 border-2 border-amber-300 rounded-2xl inline-block shadow-inner">
                    {isAnswerRevealed ? (
                      <span className="text-2xl sm:text-3xl font-black text-amber-950 tracking-wider animate-bounce inline-block">
                        {currentPhrase}
                      </span>
                    ) : (
                      <span className="text-2xl sm:text-3xl font-black text-amber-800/30 tracking-widest select-none">
                        {currentPhrase.replace(
                          /[A-ZĂÂĐÊÔƠƯÁÀẢÃẠẮẰẲẴẶẤẦẨẪẬẾỀỂỄỆỐỒỔỖỘỚỜỞỠỢỨỪỬỮỰÍÌỈĨỊỐỒỔỖỘỨỪỬỮỰÝỲỶỸỴ]/g,
                          '❓ '
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Button Controls Bar */}
          <div className="bg-white/95 border-2 border-amber-300 p-4 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleRevealNextHint}
                disabled={hints.every((h) => h.isRevealed) || isGenerating}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-w-text-main font-black text-xs rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50"
              >
                <Eye className="w-4 h-4" />
                <span>👁 Hiện Hình Tiếp Theo</span>
              </button>

              <button
                onClick={() => setIsAnswerRevealed(!isAnswerRevealed)}
                disabled={isGenerating}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isAnswerRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{isAnswerRevealed ? 'Ẩn Đáp Án' : 'Hiện Đáp Án'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={() => handleAnswerResult(true)}
                disabled={isGenerating}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-w-text-main font-black text-xs rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>ĐÚNG (+200đ)</span>
              </button>

              <button
                onClick={() => handleAnswerResult(false)}
                disabled={isGenerating}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-w-text-main font-black text-xs rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span>SAI (Đổi Lượt)</span>
              </button>

              <button
                onClick={handleSkip}
                disabled={isGenerating}
                className="px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-w-text-main font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <SkipForward className="w-4 h-4" />
                <span>Bỏ Qua</span>
              </button>

              {isBankMode ? (
                <button
                  onClick={handleNextBankQuestion}
                  disabled={currentQuestionIndex >= questions.length - 1 || isGenerating}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-w-text-main font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>Câu Tiếp Theo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setIsTeacherEditing(true)}
                  className="px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-w-text-main font-bold text-xs rounded-xl shadow transition"
                >
                  Soạn Cụm Từ Mới
                </button>
              )}

              <button
                onClick={handleFinishGame}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-w-text-main font-black text-xs rounded-xl shadow transition flex items-center gap-1.5"
              >
                <Trophy className="w-4 h-4" />
                <span>Kết Thúc</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
