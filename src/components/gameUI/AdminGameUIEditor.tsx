import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Save,
  RotateCcw,
  Undo,
  Redo,
  Eye,
  Edit3,
  Monitor,
  Laptop,
  Tv,
  Tablet,
  Smartphone,
  Maximize,
  Sliders,
  Type,
  Layout,
  Palette,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronRight,
  Check,
  AlertTriangle,
  Copy,
  Clipboard,
  Download,
  Upload,
  RefreshCw,
  Search,
  ZoomIn,
  ZoomOut,
  Grid,
  Square,
  CheckCircle2,
  FolderTree,
  Wand2,
  SlidersHorizontal,
  Flame,
  Crown,
  Zap,
  Leaf,
  Heart,
  GraduationCap,
  Pipette,
  Minus,
  Plus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ShieldCheck,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  EyeOff,
  Sun,
  Moon,
  Sparkle,
  Paintbrush,
  ChevronsUpDown,
  Maximize2,
  Minimize2,
  Contrast,
  SlidersVertical
} from 'lucide-react';
import { useGameUI } from '../../contexts/GameUIContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  VIEWPORT_SIZES,
  THEME_COLOR_TOKENS,
  STYLE_PRESETS,
  getDefaultElementsForGame,
  checkContrast,
} from '../../data/gameUIDefaults';
import { ElementUIStyle, ViewportMode, ElementCategory, ShadowPreset } from '../../types/gameUI';

interface AdminGameUIEditorProps {
  onClose: () => void;
  renderGameContent: (gameId: string) => React.ReactNode;
}

const AVAILABLE_GAMES = [
  { id: 'lucky_star', name: 'Ngôi Sao May Mắn (Lucky Star)' },
  { id: 'randomcall', name: 'Gọi Tên Ngẫu Nhiên (Random Call)' },
  { id: 'eggcall', name: 'Đập Trứng Gọi Tên (Egg Call)' },
  { id: 'openbox', name: 'Mở Hộp Bí Mật (Open Box)' },
  { id: 'wheel', name: 'Vòng Quay May Mắn (Wheel)' },
  { id: 'bingo', name: 'Đấu Trường Bingo' },
  { id: 'territory', name: 'Chiếm Lĩnh Lãnh Thổ' },
  { id: 'tugofwar', name: 'Kéo Co Tri Thức' },
  { id: 'tower', name: 'Xây Tháp' },
  { id: 'puzzle', name: 'Ghép Hình' },
  { id: 'race', name: 'Đua Xe' },
  { id: 'blindbox', name: 'Hộp Mù' },
  { id: 'pokemon', name: 'Bắt Pokemon' },
  { id: 'battleship', name: 'Bắn Tàu' },
  { id: 'pictogram', name: 'Đuổi Hình Bắt Chữ' },
  { id: 'magic_wheel', name: 'Vòng Quay Phép Thuật' },
  { id: 'posechallenge', name: 'Thử Thách Tạo Dáng' },
  { id: 'caro', name: 'Cờ Ca-rô' },
  { id: 'whackamole', name: 'Đập Chuột' },
  { id: 'classification', name: 'Phân Loại' },
  { id: 'flagcapture', name: 'Cướp Cờ' },
  { id: 'sackrace', name: 'Nhảy Bao Bố' },
  { id: 'snailwordsearch', name: 'Ốc Sên Tìm Chữ' },
  { id: 'mineboom', name: 'Dò Mìn' },
  { id: 'chess', name: 'Cờ Vua' },
  { id: 'goldminer', name: 'Đào Vàng' },
  { id: 'bearpass', name: 'Truyền Gấu' },
  { id: 'letterarrange', name: 'Sắp Xếp Chữ' },
  { id: 'applepick', name: 'Hái Táo' },
  { id: 'sontinhthuytinh', name: 'Sơn Tinh Thủy Tinh' },
  { id: 'cothu', name: 'Cờ Thú' },
  { id: 'monopoly', name: 'Cờ Tỷ Phú' },
  { id: 'werewolf', name: 'Ma Sói' },
  { id: 'case_investigation', name: 'Hồ Sơ Vụ Án' },
  { id: 'teabattle', name: 'Trận Chiến Trà' },
  { id: 'bowling', name: 'Bowling' },
  { id: 'chase', name: 'Cuộc Đuổi Bắt' },
  { id: 'mancala', name: 'Ô Ăn Quan' },
  { id: 'ai_star_call', name: 'Gọi Tên Ngôi Sao AI' },
  { id: 'ai_galaxy_call', name: 'Gọi Tên Ngân Hà AI' },
  { id: 'ai_nebula_call', name: 'Gọi Tên Tinh Vân AI' },
  { id: 'ai_bubble_call', name: 'Gọi Tên Bong Bóng AI' },
  { id: 'ludo', name: 'Cờ Cá Ngựa' },
  { id: 'betting', name: 'Đặt Cược' }
];

interface ThemePack {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  badgeBg: string;
  styles: {
    headerBg: string;
    headerText: string;
    stageBg: string;
    stageBorder: string;
    buttonBg: string;
    buttonText: string;
    buttonShadow: string;
    cardBg: string;
    cardBorder: string;
    cardText: string;
  };
}

const THEME_PACKS: ThemePack[] = [
  {
    id: 'royal_gold',
    name: 'Vàng Hoàng Gia',
    icon: <Crown className="w-4 h-4 text-amber-400" />,
    description: 'Phong cách sân khấu vinh quang, viền vàng óng ánh phát sáng',
    badgeBg: 'from-amber-500 to-yellow-600',
    styles: {
      headerBg: 'rgba(15, 23, 42, 0.9)',
      headerText: '#fde047',
      stageBg: 'rgba(10, 15, 30, 0.95)',
      stageBorder: '#f59e0b',
      buttonBg: '#f59e0b',
      buttonText: '#020617',
      buttonShadow: 'glow-amber',
      cardBg: '#0f172a',
      cardBorder: '#fde047',
      cardText: '#f8fafc',
    },
  },
  {
    id: 'cyber_neon',
    name: 'Cyberpunk Neon',
    icon: <Zap className="w-4 h-4 text-cyan-400" />,
    description: 'Viền phát sáng xanh neon tương lai viễn tưởng',
    badgeBg: 'from-cyan-500 to-blue-600',
    styles: {
      headerBg: 'rgba(2, 6, 23, 0.95)',
      headerText: '#67e8f9',
      stageBg: 'rgba(2, 6, 23, 0.98)',
      stageBorder: '#06b6d4',
      buttonBg: '#06b6d4',
      buttonText: '#020617',
      buttonShadow: 'glow-cyan',
      cardBg: '#090d16',
      cardBorder: '#38bdf8',
      cardText: '#e0f2fe',
    },
  },
  {
    id: 'eco_green',
    name: 'Xanh Sinh Thái',
    icon: <Leaf className="w-4 h-4 text-emerald-400" />,
    description: 'Gần gũi tự nhiên, thư giãn và bảo vệ thị lực',
    badgeBg: 'from-emerald-500 to-teal-600',
    styles: {
      headerBg: 'rgba(6, 78, 59, 0.9)',
      headerText: '#6ee7b7',
      stageBg: 'rgba(4, 47, 36, 0.95)',
      stageBorder: '#10b981',
      buttonBg: '#10b981',
      buttonText: '#ffffff',
      buttonShadow: 'medium',
      cardBg: '#064e3b',
      cardBorder: '#34d399',
      cardText: '#ecfdf5',
    },
  },
  {
    id: 'sweet_candy',
    name: 'Kẹo Ngọt Pastel',
    icon: <Heart className="w-4 h-4 text-pink-400" />,
    description: 'Gam màu tươi sáng, dễ thương, truyền cảm hứng tích cực',
    badgeBg: 'from-pink-500 to-rose-500',
    styles: {
      headerBg: 'rgba(80, 7, 36, 0.9)',
      headerText: '#fbcfe8',
      stageBg: 'rgba(35, 10, 25, 0.95)',
      stageBorder: '#f472b6',
      buttonBg: '#ec4899',
      buttonText: '#ffffff',
      buttonShadow: 'large',
      cardBg: '#500724',
      cardBorder: '#f472b6',
      cardText: '#fff1f2',
    },
  },
  {
    id: 'academic_blue',
    name: 'Học Viện Chuẩn',
    icon: <GraduationCap className="w-4 h-4 text-indigo-400" />,
    description: 'Hiện đại, chuyên nghiệp, cân đối ánh sáng giảng dạy',
    badgeBg: 'from-indigo-600 to-blue-700',
    styles: {
      headerBg: 'rgba(30, 27, 75, 0.9)',
      headerText: '#c7d2fe',
      stageBg: 'rgba(15, 23, 42, 0.95)',
      stageBorder: '#6366f1',
      buttonBg: '#6366f1',
      buttonText: '#ffffff',
      buttonShadow: 'glow-primary',
      cardBg: '#1e293b',
      cardBorder: '#818cf8',
      cardText: '#f8fafc',
    },
  },
  {
    id: 'crimson_fire',
    name: 'Năng Lượng Đỏ',
    icon: <Flame className="w-4 h-4 text-rose-400" />,
    description: 'Sôi nổi, nhiệt huyết, kích thích tinh thần tranh tài',
    badgeBg: 'from-rose-600 to-red-700',
    styles: {
      headerBg: 'rgba(76, 5, 25, 0.9)',
      headerText: '#fecdd3',
      stageBg: 'rgba(30, 10, 15, 0.95)',
      stageBorder: '#f43f5e',
      buttonBg: '#e11d48',
      buttonText: '#ffffff',
      buttonShadow: 'large',
      cardBg: '#4c0519',
      cardBorder: '#fb7185',
      cardText: '#fff1f2',
    },
  },
];

const CATEGORY_NAMES: Record<ElementCategory | 'general', { label: string; icon: string }> = {
  header: { label: 'Tiêu đề & Trạng thái', icon: '👑' },
  stage: { label: 'Sân khấu & Vũ đài', icon: '🎯' },
  button: { label: 'Nút bấm & Điều khiển', icon: '🔘' },
  scoreboard: { label: 'Bảng điểm & Đội thi', icon: '🏆' },
  modal: { label: 'Thẻ kết quả & Hộp thoại', icon: '🪟' },
  question: { label: 'Khung câu hỏi & Đáp án', icon: '❓' },
  general: { label: 'Thành phần khác', icon: '🧩' },
};

// Curated high-contrast accessible colors
const ACCESSIBLE_PALETTES = {
  highContrast: [
    { name: 'Trắng tinh', hex: '#ffffff' },
    { name: 'Xám sáng', hex: '#f8fafc' },
    { name: 'Slate Tối', hex: '#0f172a' },
    { name: 'Đen tuyền', hex: '#020617' },
    { name: 'Xanh Navy', hex: '#1e1b4b' },
    { name: 'Vàng Kim', hex: '#f59e0b' },
  ],
  vibrant: [
    { name: 'Vàng Sáng', hex: '#fde047' },
    { name: 'Xanh Neon', hex: '#06b6d4' },
    { name: 'Xanh Ngọc', hex: '#10b981' },
    { name: 'Tím Hoàng Gia', hex: '#6366f1' },
    { name: 'Đỏ Ruby', hex: '#e11d48' },
    { name: 'Hồng Kẹo', hex: '#ec4899' },
  ],
  pastel: [
    { name: 'Pastel Kem', hex: '#fef3c7' },
    { name: 'Pastel Xanh', hex: '#e0f2fe' },
    { name: 'Pastel Bạc Hà', hex: '#d1fae5' },
    { name: 'Pastel Tím', hex: '#ede9fe' },
    { name: 'Pastel Hồng', hex: '#fce7f3' },
    { name: 'Pastel Cam', hex: '#ffedd5' },
  ]
};

// Opacity Quick Presets
const OPACITY_PRESETS = [
  { label: '100%', val: '1.0' },
  { label: '85%', val: '0.85' },
  { label: '65%', val: '0.65' },
  { label: '40%', val: '0.40' },
  { label: '20%', val: '0.20' },
  { label: '0%', val: '0.0' },
];

/**
 * Helper to adjust hex color lightness (+ / - percent)
 */
function adjustHexLightness(hex: string, percent: number): string {
  if (!hex.startsWith('#') || hex.length < 7) return hex;
  const num = parseInt(hex.slice(1, 7), 16);
  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
  let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Invert Hex color
 */
function invertHexColor(hex: string): string {
  if (!hex.startsWith('#') || hex.length < 7) return '#ffffff';
  const num = parseInt(hex.slice(1, 7), 16);
  const r = 255 - (num >> 16);
  const g = 255 - ((num >> 8) & 0x00ff);
  const b = 255 - (num & 0x0000ff);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Enhanced Accessible Color Picker with live WCAG contrast checking, theme tokens, and color adjustment tools
 */
interface AccessibleColorPickerProps {
  label: string;
  value: string | undefined;
  onChange: (color: string) => void;
  pairedColor?: string; // Opposite color (e.g. text color if setting bg, or bg if setting text)
  isBackground?: boolean;
}

const AccessibleColorPicker: React.FC<AccessibleColorPickerProps> = ({
  label,
  valueRaw = '',
  value,
  onChange,
  pairedColor,
  isBackground = false,
}: any) => {
  const currentColor = value || '';
  const [copied, setCopied] = useState(false);
  const [showPalettes, setShowPalettes] = useState(false);
  const [paletteTab, setPaletteTab] = useState<'tokens' | 'accessible' | 'vibrant' | 'tools'>('tokens');

  // Normalize color for native picker
  const hexValue = currentColor.startsWith('#')
    ? currentColor.length >= 7
      ? currentColor.slice(0, 7)
      : '#1e293b'
    : currentColor.startsWith('rgba') || currentColor.startsWith('rgb')
    ? '#1e293b'
    : '#1e293b';

  const handleCopy = () => {
    if (!currentColor) return;
    navigator.clipboard.writeText(currentColor);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          onChange(result.sRGBHex);
        }
      } catch (e) {
        console.warn('EyeDropper cancelled or failed', e);
      }
    }
  };

  // Contrast calculation
  const contrastResult = useMemo(() => {
    if (!pairedColor || !currentColor) return null;
    const fg = isBackground ? pairedColor : currentColor;
    const bg = isBackground ? currentColor : pairedColor;
    return checkContrast(fg, bg);
  }, [currentColor, pairedColor, isBackground]);

  return (
    <div className="space-y-1.5 p-2.5 bg-slate-850/60 rounded-xl border border-slate-750/70">
      <div className="flex items-center justify-between">
        <label className="text-slate-600 font-bold text-xs flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{label}</span>
        </label>

        {/* Live WCAG Compliance Badge */}
        {contrastResult && (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border flex items-center gap-1 transition ${
              contrastResult.ratio >= 7.0
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : contrastResult.ratio >= 4.5
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
            }`}
            title={`Tỉ lệ tương phản WCAG: ${contrastResult.ratio}:1 (${
              contrastResult.ratio >= 7.0 ? 'AAA Rất tốt' : contrastResult.ratio >= 4.5 ? 'AA Đạt chuẩn' : 'Cảnh báo: Khó đọc trên màn chiếu'
            })`}
          >
            {contrastResult.ratio >= 4.5 ? (
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-3 h-3 text-rose-400" />
            )}
            <span>
              {contrastResult.ratio >= 7.0 ? 'WCAG AAA' : contrastResult.ratio >= 4.5 ? 'WCAG AA' : 'Kém'}{' '}
              ({contrastResult.ratio}:1)
            </span>
          </span>
        )}
      </div>

      {/* Main Input Controls Row */}
      <div className="flex items-center gap-1.5">
        {/* Color preview swatch + native picker trigger */}
        <div
          className="relative shrink-0 w-9 h-9 rounded-xl border border-slate-300 overflow-hidden cursor-pointer shadow-xs hover:border-amber-400 transition"
          style={{
            backgroundImage:
              'linear-gradient(45deg, #334155 25%, transparent 25%), linear-gradient(-45deg, #334155 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #334155 75%), linear-gradient(-45deg, transparent 75%, #334155 75%)',
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
          }}
          title="Bấm để mở bảng chọn màu trực quan"
        >
          <div
            className="w-full h-full"
            style={{
              backgroundColor: currentColor.startsWith('theme:')
                ? undefined
                : currentColor || 'transparent',
            }}
          />
          <input
            type="color"
            value={hexValue}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>

        {/* Text / Hex / Token Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={currentColor}
            placeholder="#000000 hoặc theme:..."
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-100 text-slate-800 px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40"
          />
        </div>

        {/* Native EyeDropper */}
        {'EyeDropper' in window && (
          <button
            type="button"
            onClick={handleEyeDropper}
            className="p-2 bg-slate-100 hover:bg-slate-50 text-slate-600 hover:text-amber-300 border border-slate-300 rounded-xl transition cursor-pointer shrink-0"
            title="Chấm màu từ màn hình (EyeDropper)"
          >
            <Pipette className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Copy Hex Button */}
        <button
          type="button"
          onClick={handleCopy}
          className="p-2 bg-slate-100 hover:bg-slate-50 text-slate-600 hover:text-amber-300 border border-slate-300 rounded-xl transition cursor-pointer shrink-0"
          title="Sao chép mã màu"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>

        {/* Toggle Palette Drawer Button */}
        <button
          type="button"
          onClick={() => setShowPalettes(!showPalettes)}
          className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center gap-1 shrink-0 ${
            showPalettes
              ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-xs'
              : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-50'
          }`}
          title="Xem kho màu chuẩn, chủ đề & công cụ"
        >
          <Paintbrush className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Màu</span>
        </button>
      </div>

      {/* Expandable Palette & Theme Tokens Drawer */}
      <AnimatePresence>
        {showPalettes && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-2 border-t border-slate-750/80 space-y-2 overflow-hidden"
          >
            {/* Palette Navigation Tabs */}
            <div className="flex items-center gap-1 bg-white/80 p-1 rounded-xl border border-slate-750 text-[10px]">
              <button
                type="button"
                onClick={() => setPaletteTab('tokens')}
                className={`flex-1 py-1 rounded-lg font-bold transition text-center ${
                  paletteTab === 'tokens'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                🏷️ Chủ Đề
              </button>
              <button
                type="button"
                onClick={() => setPaletteTab('accessible')}
                className={`flex-1 py-1 rounded-lg font-bold transition text-center ${
                  paletteTab === 'accessible'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                🛡️ Tương Phản
              </button>
              <button
                type="button"
                onClick={() => setPaletteTab('vibrant')}
                className={`flex-1 py-1 rounded-lg font-bold transition text-center ${
                  paletteTab === 'vibrant'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                ✨ Sôi Nổi
              </button>
              <button
                type="button"
                onClick={() => setPaletteTab('tools')}
                className={`flex-1 py-1 rounded-lg font-bold transition text-center ${
                  paletteTab === 'tools'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                ⚙️ Công Cụ
              </button>
            </div>

            {/* TAB 1: Theme System Tokens */}
            {paletteTab === 'tokens' && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-semibold block">
                  Áp dụng biến màu theo hệ thống trò chơi:
                </span>
                <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {THEME_COLOR_TOKENS.map((token) => {
                    const isSelected = currentColor === token.id;
                    return (
                      <button
                        key={token.id}
                        type="button"
                        onClick={() => onChange(token.id)}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-medium border transition cursor-pointer flex items-center justify-between text-left ${
                          isSelected
                            ? 'bg-amber-500/25 border-amber-400 text-amber-200 font-bold'
                            : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-50'
                        }`}
                        title={token.name}
                      >
                        <span className="truncate">{token.name.split('(')[0]}</span>
                        <span className="font-mono text-[9px] text-amber-400 shrink-0">#{token.id.replace('theme:', '')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: Accessible High-Contrast Palette */}
            {paletteTab === 'accessible' && (
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-semibold block">
                  Màu tương phản cao, tối ưu hiển thị máy chiếu:
                </span>
                <div className="grid grid-cols-6 gap-1.5">
                  {ACCESSIBLE_PALETTES.highContrast.map((swatch) => {
                    const isSelected = currentColor.toLowerCase() === swatch.hex.toLowerCase();
                    return (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => onChange(swatch.hex)}
                        className={`h-7 rounded-lg border flex items-center justify-center transition cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-amber-400 border-white scale-105 shadow-md'
                            : 'border-slate-300/80 hover:scale-105'
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                        title={`${swatch.name} (${swatch.hex})`}
                      >
                        {isSelected && (
                          <Check
                            className={`w-3.5 h-3.5 ${
                              swatch.hex === '#ffffff' || swatch.hex === '#f8fafc' || swatch.hex === '#fde047'
                                ? 'text-slate-950'
                                : 'text-white'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: Vibrant & Pastel Palette */}
            {paletteTab === 'vibrant' && (
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1">Rực rỡ & Neon:</span>
                  <div className="grid grid-cols-6 gap-1.5">
                    {ACCESSIBLE_PALETTES.vibrant.map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => onChange(swatch.hex)}
                        className="h-7 rounded-lg border border-slate-300/80 hover:scale-105 transition cursor-pointer"
                        style={{ backgroundColor: swatch.hex }}
                        title={`${swatch.name} (${swatch.hex})`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1">Pastel Dịu Mắt:</span>
                  <div className="grid grid-cols-6 gap-1.5">
                    {ACCESSIBLE_PALETTES.pastel.map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => onChange(swatch.hex)}
                        className="h-7 rounded-lg border border-slate-300/80 hover:scale-105 transition cursor-pointer"
                        style={{ backgroundColor: swatch.hex }}
                        title={`${swatch.name} (${swatch.hex})`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Color Adjustment Tools */}
            {paletteTab === 'tools' && (
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-semibold block">
                  Hiệu chỉnh độ sáng & độ trong suốt:
                </span>
                
                {/* Opacity quick chips */}
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Độ trong suốt:</span>
                  <div className="grid grid-cols-6 gap-1">
                    {OPACITY_PRESETS.map((op) => (
                      <button
                        key={op.label}
                        type="button"
                        onClick={() => {
                          if (currentColor.startsWith('#')) {
                            // convert hex to rgba with alpha
                            const num = parseInt(currentColor.slice(1, 7), 16);
                            const r = num >> 16;
                            const g = (num >> 8) & 0x00ff;
                            const b纯 = num & 0x0000ff;
                            onChange(`rgba(${r}, ${g}, ${b纯}, ${op.val})`);
                          } else if (op.val === '0.0') {
                            onChange('transparent');
                          }
                        }}
                        className="py-1 bg-slate-100 hover:bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-300 transition"
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lightness / Invert buttons */}
                {currentColor.startsWith('#') && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onChange(adjustHexLightness(currentColor, 15))}
                      className="flex-1 py-1 px-2 bg-slate-100 hover:bg-slate-50 text-amber-300 text-[10px] font-semibold rounded-lg border border-slate-300 transition flex items-center justify-center gap-1"
                    >
                      <Sun className="w-3 h-3" />
                      <span>Sáng hơn (+15%)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onChange(adjustHexLightness(currentColor, -15))}
                      className="flex-1 py-1 px-2 bg-slate-100 hover:bg-slate-50 text-sky-300 text-[10px] font-semibold rounded-lg border border-slate-300 transition flex items-center justify-center gap-1"
                    >
                      <Moon className="w-3 h-3" />
                      <span>Tối hơn (-15%)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onChange(invertHexColor(currentColor))}
                      className="p-1 px-2 bg-slate-100 hover:bg-slate-50 text-slate-600 text-[10px] font-semibold rounded-lg border border-slate-300 transition flex items-center gap-1"
                      title="Đảo ngược màu sắc"
                    >
                      <Contrast className="w-3 h-3" />
                      <span>Đảo màu</span>
                    </button>
                  </div>
                )}

                {/* Clear to default/transparent */}
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="w-full py-1 text-[10px] text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition"
                >
                  Khôi phục màu mặc định
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AdminGameUIEditor: React.FC<AdminGameUIEditorProps> = ({
  onClose,
  renderGameContent,
}) => {
  const { isAdmin } = useAuth();
  const {
    activeEditorGameId,
    openEditor,
    selectedElementId,
    setSelectedElementId,
    hoveredElementId,
    setHoveredElementId,
    viewportMode,
    setViewportMode,
    isPreviewMode,
    setIsPreviewMode,
    currentConfig,
    updateElementStyle,
    resetElementStyle,
    applyPresetToElement,
    resetAllGameStyles,
    canUndo,
    canRedo,
    undo,
    redo,
    hasUnsavedChanges,
    isSaving,
    lastSavedAt,
    saveNow,
  } = useGameUI();

  // Panels & View States
  const [showLeftTree, setShowLeftTree] = useState<boolean>(true);
  const [showThemeBar, setShowThemeBar] = useState<boolean>(false);
  const [elementSearch, setElementSearch] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [copiedStyle, setCopiedStyle] = useState<Partial<ElementUIStyle> | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [showConfirmResetAll, setShowConfirmResetAll] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [jsonExportText, setJsonExportText] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);

  // Accordion Sections State
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    layout: true,
    typography: true,
    color: true,
    border: true,
    presets: false,
  });

  // Collapsible Categories in Left Element Tree
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Canvas visual controls
  const [customZoom, setCustomZoom] = useState<number | 'fit'>('fit');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showSafeArea, setShowSafeArea] = useState<boolean>(false);

  // Viewport wrapper ref
  const viewportWrapperRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 1000, height: 700 });

  useEffect(() => {
    const updateDimensions = () => {
      if (viewportWrapperRef.current) {
        setContainerDimensions({
          width: viewportWrapperRef.current.clientWidth,
          height: viewportWrapperRef.current.clientHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Keyboard shortcuts (Ctrl+S, Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        if (canRedo) redo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  // Current elements list for active game
  const elementsList = useMemo(() => {
    const defaults = getDefaultElementsForGame(activeEditorGameId);
    const existing = currentConfig?.elements || {};

    const merged: ElementUIStyle[] = defaults.map((def) => ({
      ...def,
      ...(existing[def.id] || {}),
    }));

    Object.keys(existing).forEach((id) => {
      if (!merged.some((m) => m.id === id)) {
        merged.push(existing[id]);
      }
    });

    return merged;
  }, [activeEditorGameId, currentConfig]);

  // Filtered elements by search query & category filter
  const filteredElements = useMemo(() => {
    return elementsList.filter((elem) => {
      // Category filter
      if (selectedCategoryFilter !== 'all' && (elem.category || 'general') !== selectedCategoryFilter) {
        return false;
      }
      // Text search
      if (elementSearch.trim()) {
        const q = elementSearch.toLowerCase();
        return (
          elem.name.toLowerCase().includes(q) ||
          elem.id.toLowerCase().includes(q) ||
          (elem.customText && elem.customText.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [elementsList, elementSearch, selectedCategoryFilter]);

  // Group elements by category
  const groupedElements = useMemo(() => {
    const map: Record<string, ElementUIStyle[]> = {};
    filteredElements.forEach((elem) => {
      const cat = elem.category || 'general';
      if (!map[cat]) map[cat] = [];
      map[cat].push(elem);
    });
    return map;
  }, [filteredElements]);

  // Active selected element
  const activeElement = useMemo(() => {
    if (!selectedElementId) return elementsList[0] || null;
    return (
      currentConfig?.elements?.[selectedElementId] ||
      elementsList.find((e) => e.id === selectedElementId) ||
      null
    );
  }, [selectedElementId, currentConfig, elementsList]);

  // Check how many elements have customized styles
  const customizedCount = useMemo(() => {
    return Object.keys(currentConfig?.elements || {}).length;
  }, [currentConfig]);

  // Toggle Accordion Section
  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  // Expand / Collapse All Accordions
  const handleExpandAll = (expand: boolean) => {
    setExpandedSections({
      layout: expand,
      typography: expand,
      color: expand,
      border: expand,
      presets: expand,
    });
  };

  // Toggle category collapsed in Left Element Tree
  const toggleCategoryCollapsed = (catKey: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }));
  };

  // Save handler
  const handleSave = async () => {
    const ok = await saveNow();
    if (ok) {
      setSaveToast('Đã lưu thành công cấu hình giao diện!');
      setTimeout(() => setSaveToast(null), 3000);
    } else {
      setSaveToast('Lỗi khi lưu cấu hình');
      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  

  // Close with dirty-check
  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn đóng trình chỉnh sửa?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Copy style
  const handleCopyStyle = () => {
    if (!activeElement) return;
    const { id, name, category, ...styleProps } = activeElement;
    setCopiedStyle(styleProps);
    setSaveToast('Đã sao chép kiểu dáng!');
    setTimeout(() => setSaveToast(null), 2000);
  };

  // Paste style
  const handlePasteStyle = () => {
    if (!activeElement || !copiedStyle) return;
    updateElementStyle(activeElement.id, copiedStyle);
    setSaveToast('Đã áp dụng kiểu dáng đã sao chép!');
    setTimeout(() => setSaveToast(null), 2000);
  };

  // Apply Theme Pack to Entire Game
  const handleApplyThemePack = (pack: ThemePack) => {
    elementsList.forEach((elem) => {
      const cat = elem.category || 'general';
      const updates: Partial<ElementUIStyle> = {};

      if (cat === 'header') {
        updates.backgroundColor = pack.styles.headerBg;
        updates.textColor = pack.styles.headerText;
      } else if (cat === 'stage') {
        updates.backgroundColor = pack.styles.stageBg;
        updates.borderColor = pack.styles.stageBorder;
        updates.boxShadow = pack.id === 'cyber_neon' ? 'glow-cyan' : pack.id === 'royal_gold' ? 'glow-amber' : 'medium';
      } else if (cat === 'button') {
        updates.backgroundColor = pack.styles.buttonBg;
        updates.textColor = pack.styles.buttonText;
        updates.boxShadow = pack.styles.buttonShadow as any;
      } else if (cat === 'modal' || cat === 'scoreboard') {
        updates.backgroundColor = pack.styles.cardBg;
        updates.borderColor = pack.styles.cardBorder;
        updates.textColor = pack.styles.cardText;
      }
      if (Object.keys(updates).length > 0) {
        updateElementStyle(elem.id, updates);
      }
    });

    setSaveToast(`Đã áp dụng chủ đề "${pack.name}" cho toàn bộ trò chơi!`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Viewport calculation
  const currentViewport = VIEWPORT_SIZES.find((v) => v.id === viewportMode) || VIEWPORT_SIZES[0];

  const viewportStyle = useMemo(() => {
    if (viewportMode === 'responsive') {
      const scaleVal = typeof customZoom === 'number' ? customZoom : 1;
      return {
        width: '100%',
        height: '100%',
        transform: `scale(${scaleVal})`,
        transformOrigin: 'center center',
      };
    }
    const targetW = typeof currentViewport.width === 'number' ? currentViewport.width : 1200;
    const targetH = typeof currentViewport.height === 'number' ? currentViewport.height : 800;

    const availableW = Math.max(300, containerDimensions.width - 48);
    const availableH = Math.max(300, containerDimensions.height - 48);

    let scale = Math.min(availableW / targetW, availableH / targetH);
    if (typeof customZoom === 'number') {
      scale = customZoom;
    }

    return {
      width: `${targetW}px`,
      height: `${targetH}px`,
      transform: `scale(${scale})`,
      transformOrigin: 'center center',
    };
  }, [viewportMode, currentViewport, containerDimensions, customZoom]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-50 text-slate-800 select-none overflow-hidden font-sans">
      {/* TOPBAR */}
      <header className="h-14 border-b border-slate-200 bg-white/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 shrink-0 z-50">
        {/* Left: Brand & Game Switcher & Tree Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowLeftTree(!showLeftTree)}
            className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
              showLeftTree
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-100 text-slate-400 border-slate-300 hover:text-slate-700'
            }`}
            title="Bật/Tắt Danh Sách Thành Phần & Lớp Giao Diện"
          >
            {showLeftTree ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            <span className="text-xs font-bold hidden md:inline">Thành phần</span>
          </button>

          <div className="flex items-center gap-1.5 text-amber-400 font-black tracking-wide text-xs sm:text-sm">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span className="hidden lg:inline">LIVE GAME DESIGNER</span>
          </div>

          <div className="h-5 w-[1px] bg-slate-200 mx-0.5 hidden md:block" />

          {/* Game Switcher Dropdown */}
          <div className="relative">
            <select
              value={activeEditorGameId}
              onChange={(e) => openEditor(e.target.value)}
              className="bg-slate-100 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold rounded-xl px-3 py-1.5 border border-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer pr-7 max-w-[180px] sm:max-w-[240px] truncate shadow-xs"
            >
              {AVAILABLE_GAMES.map((g) => (
                <option key={g.id} value={g.id}>
                  🎮 {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Quick Bar Toggle */}
          <button
            onClick={() => setShowThemeBar(!showThemeBar)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer shadow-xs ${
              showThemeBar
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-slate-100 text-amber-300 border-amber-500/30 hover:bg-slate-50'
            }`}
            title="Mở Bộ Sưu Tập Chủ Đề Game Toàn Diện"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chủ Đề Nhanh</span>
          </button>
        </div>

        {/* Center: Viewport Switcher */}
        <div className="hidden xl:flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-300/60 gap-1">
          {VIEWPORT_SIZES.map((vp) => {
            const isActive = viewportMode === vp.id;
            return (
              <button
                key={vp.id}
                onClick={() => setViewportMode(vp.id)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
                title={`${vp.deviceLabel} (${vp.label})`}
              >
                {vp.id === 'responsive' && <Maximize className="w-3.5 h-3.5" />}
                {vp.id === 'desktop-fhd' && <Monitor className="w-3.5 h-3.5" />}
                {vp.id === 'laptop' && <Laptop className="w-3.5 h-3.5" />}
                {vp.id === 'desktop-hd' && <Tv className="w-3.5 h-3.5" />}
                {vp.id === 'tablet' && <Tablet className="w-3.5 h-3.5" />}
                {vp.id === 'mobile' && <Smartphone className="w-3.5 h-3.5" />}
                <span>{vp.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Undo/Redo, Preview, Auto-Save Status, Save & Close */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-300">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                canUndo ? 'text-slate-700 hover:bg-slate-200' : 'text-slate-600 cursor-not-allowed'
              }`}
              title="Hoàn tác (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                canRedo ? 'text-slate-700 hover:bg-slate-200' : 'text-slate-600 cursor-not-allowed'
              }`}
              title="Làm lại (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle Preview Mode */}
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border cursor-pointer ${
              isPreviewMode
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/30'
                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
            }`}
            title={isPreviewMode ? 'Chuyển sang chế độ Sửa (hiện khung chọn)' : 'Chuyển sang chế độ Xem thử thực tế'}
          >
            {isPreviewMode ? <Eye className="w-3.5 h-3.5 text-sky-400" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isPreviewMode ? 'Xem Thử' : 'Chế Độ Sửa'}</span>
          </button>

          {/* Auto-save status indicator */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400 px-2 py-1 bg-slate-100/60 rounded-lg border border-slate-750">
            {isSaving ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                <span>Đang lưu...</span>
              </>
            ) : hasUnsavedChanges ? (
              <span className="text-amber-300 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Chưa lưu
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Đã lưu
              </span>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold shadow-amber-500/20 animate-pulse'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-300'
            }`}
            title="Lưu tất cả thay đổi (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu</span>
          </button>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            title="Đóng trình chỉnh sửa"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* THEME PACK QUICK DRAWER (IF OPEN) */}
      <AnimatePresence>
        {showThemeBar && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-slate-200 bg-white/98 backdrop-blur-md px-4 py-3 z-40 shrink-0 overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                  Bộ Sưu Tập Chủ Đề Game Toàn Diện (1-Click Theme Packs)
                </h3>
                <span className="text-[11px] text-slate-400 hidden md:inline">
                  — Tự động hòa phối màu sắc, hiệu ứng phát sáng cho tất cả phần tử trong game
                </span>
              </div>
              <button
                onClick={() => setShowThemeBar(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {THEME_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  onClick={() => handleApplyThemePack(pack)}
                  className="p-2.5 rounded-xl border border-slate-750 bg-slate-850 hover:bg-slate-100 hover:border-amber-400/70 transition cursor-pointer group flex flex-col justify-between space-y-1.5 shadow-sm"
                >
                  <div className="flex items-center gap-1.5">
                    {pack.icon}
                    <span className="font-bold text-slate-700 text-xs group-hover:text-amber-300">
                      {pack.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                    {pack.description}
                  </p>
                  <div className="flex items-center gap-1 pt-1">
                    <span
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: pack.styles.buttonBg }}
                    />
                    <span
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: pack.styles.stageBorder }}
                    />
                    <span
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: pack.styles.cardBg }}
                    />
                    <span className="text-[9px] text-amber-400 font-bold ml-auto opacity-0 group-hover:opacity-100 transition">
                      Áp dụng ➔
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN WORKSPACE: 3 COLUMNS */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* LEFT COLUMN: ELEMENT TREE & HIERARCHY EXPLORER */}
        {showLeftTree && (
          <aside className="w-72 sm:w-80 border-r border-slate-200 bg-white/98 flex flex-col h-full shrink-0 z-40 shadow-xl transition-all duration-200 min-h-0">
            {/* Tree Header */}
            <div className="p-3 border-b border-slate-200 bg-slate-850/80 space-y-2.5 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderTree className="w-4 h-4" />
                  Cây Thành Phần ({elementsList.length})
                </span>
                {customizedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {customizedCount} đã sửa
                  </span>
                )}
              </div>

              {/* Element Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={elementSearch}
                  onChange={(e) => setElementSearch(e.target.value)}
                  placeholder="Tìm thành phần theo tên..."
                  className="w-full bg-slate-100 text-slate-700 pl-8.5 pr-8 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-400"
                />
                {elementSearch && (
                  <button
                    onClick={() => setElementSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Category Quick Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedCategoryFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-100 text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Tất cả ({elementsList.length})
                </button>
                {Object.entries(CATEGORY_NAMES).map(([key, item]) => {
                  const isActive = selectedCategoryFilter === key;
                  const count = elementsList.filter((e) => (e.category || 'general') === key).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(key)}
                      className={`px-2 py-1 rounded-lg font-medium transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                          : 'bg-slate-100 text-slate-400 hover:text-slate-700'
                      }`}
                      title={item.label}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label.split(' ')[0]}</span>
                      <span className="text-[10px] opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tree Items List with Smooth Scrollbar */}
            <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-850">
              {Object.entries(groupedElements).map(([catKey, items]) => {
                const catInfo = CATEGORY_NAMES[catKey as ElementCategory] || {
                  label: catKey,
                  icon: '📦',
                };
                const isCollapsed = collapsedCategories[catKey];

                return (
                  <div key={catKey} className="bg-slate-850/40 rounded-xl border border-slate-200/80 overflow-hidden">
                    {/* Category Header with Toggle Collapse */}
                    <button
                      type="button"
                      onClick={() => toggleCategoryCollapsed(catKey)}
                      className="w-full px-2.5 py-1.5 bg-slate-100/50 hover:bg-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{catInfo.icon}</span>
                        <span>{catInfo.label}</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-mono">({items.length})</span>
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Category Items */}
                    {!isCollapsed && (
                      <div className="p-1.5 space-y-1">
                        {items.map((elem) => {
                          const isSelected = selectedElementId === elem.id;
                          const isHovered = hoveredElementId === elem.id;
                          const isModified = Boolean(currentConfig?.elements?.[elem.id]);

                          return (
                            <div
                              key={elem.id}
                              onClick={() => setSelectedElementId(elem.id)}
                              onMouseEnter={() => setHoveredElementId(elem.id)}
                              onMouseLeave={() => setHoveredElementId(null)}
                              className={`px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-between group ${
                                isSelected
                                  ? 'bg-amber-500/25 text-amber-200 border border-amber-400 shadow-xs ring-1 ring-amber-400/40 font-bold'
                                  : isHovered
                                  ? 'bg-slate-100 text-slate-800 border border-slate-300'
                                  : 'bg-slate-850/60 text-slate-600 hover:bg-slate-100 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    isSelected
                                      ? 'bg-amber-400 animate-ping'
                                      : isModified
                                      ? 'bg-amber-400'
                                      : 'bg-slate-600'
                                  }`}
                                />
                                <span className="truncate">{elem.name}</span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {isModified && (
                                  <span className="text-[10px] text-amber-400 font-bold px-1 rounded bg-amber-400/10" title="Đã có tùy biến">
                                    Đã sửa
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition">
                                  #{elem.id}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredElements.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Không tìm thấy thành phần nào phù hợp.
                </div>
              )}
            </div>

            {/* Tree Footer */}
            <div className="p-2.5 border-t border-slate-200 bg-slate-850 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
              <span>Trò chơi: <strong className="text-amber-400">{activeEditorGameId}</strong></span>
              <button
                type="button"
                onClick={() => setShowLeftTree(false)}
                className="text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
                <span>Thu gọn</span>
              </button>
            </div>
          </aside>
        )}

        {/* CENTER COLUMN: LIVE INTERACTIVE CANVAS */}
        <div
          ref={viewportWrapperRef}
          className="flex-1 bg-slate-50 flex flex-col items-center justify-center p-4 overflow-hidden relative min-h-0"
        >
          {/* Background subtle grid pattern */}
          {showGrid && (
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            />
          )}

          {/* Floating Canvas Controls Overlay */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-xl text-xs">
            <button
              onClick={() => setCustomZoom(typeof customZoom === 'number' ? Math.max(0.4, customZoom - 0.1) : 0.9)}
              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span className="px-2 py-0.5 font-mono text-[11px] text-amber-300 font-bold">
              {typeof customZoom === 'number' ? `${Math.round(customZoom * 100)}%` : 'Tự Vừa'}
            </span>

            <button
              onClick={() => setCustomZoom(typeof customZoom === 'number' ? Math.min(1.5, customZoom + 0.1) : 1.1)}
              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setCustomZoom('fit')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                customZoom === 'fit' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-100'
              }`}
              title="Tự động vừa màn hình"
            >
              Vừa Khung
            </button>

            <div className="h-4 w-[1px] bg-slate-50 mx-1" />

            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${showGrid ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-slate-600'}`}
              title="Bật/Tắt Lưới Tọa Độ"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowSafeArea(!showSafeArea)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${showSafeArea ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-slate-600'}`}
              title="Bật/Tắt Vùng An Toàn Máy Chiếu Lớp Học (Safe Area)"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Active Highlight Info Toast */}
          {activeElement && !isPreviewMode && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-500/40 text-xs shadow-xl">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-slate-400">Đang chọn:</span>
              <span className="font-bold text-amber-300">{activeElement.name}</span>
            </div>
          )}

          {/* Viewport Frame */}
          <div
            className={`relative flex flex-col bg-white border border-slate-300/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 ${
              viewportMode !== 'responsive' ? 'ring-4 ring-slate-800/60' : ''
            }`}
            style={viewportStyle}
          >
            {/* Viewport Header Bar (for devices) */}
            {viewportMode !== 'responsive' && (
              <div className="h-6 bg-slate-850 border-b border-slate-300/60 px-3 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500/70" />
                  <span className="w-2 h-2 rounded-full bg-amber-500/70" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500/70" />
                </div>
                <span className="font-mono font-bold text-slate-600">{currentViewport.deviceLabel}</span>
                <span className="font-mono text-[10px]">{currentViewport.width} × {currentViewport.height}</span>
              </div>
            )}

            {/* Safe Area Guideline Overlay (If enabled) */}
            {showSafeArea && (
              <div className="absolute inset-4 border-2 border-dashed border-emerald-500/40 pointer-events-none z-40 rounded-xl flex items-start justify-end p-2">
                <span className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  Khung An Toàn Máy Chiếu
                </span>
              </div>
            )}

            {/* Game Renderer Stage */}
            <div className="flex-1 w-full h-full relative overflow-auto">
              {renderGameContent(activeEditorGameId)}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INSPECTOR PROPERTY PANELS (ACCORDION STYLE) */}
        {!isPreviewMode && (
          <aside className="w-84 sm:w-96 border-l border-slate-200 bg-white/98 flex flex-col h-full shrink-0 z-40 shadow-2xl min-h-0">
            {/* Inspector Header: Element Selector & Action Bar */}
            <div className="p-3 border-b border-slate-200 bg-slate-850 space-y-2.5 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                    Thuộc tính phần tử
                  </span>
                </div>

                {/* Copy / Paste style action */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopyStyle}
                    disabled={!activeElement}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg text-xs transition cursor-pointer"
                    title="Sao chép kiểu dáng phần tử này"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handlePasteStyle}
                    disabled={!copiedStyle || !activeElement}
                    className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                      copiedStyle
                        ? 'text-amber-400 hover:bg-slate-50'
                        : 'text-slate-600 cursor-not-allowed'
                    }`}
                    title="Dán kiểu dáng đã sao chép"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => activeElement && resetElementStyle(activeElement.id)}
                    disabled={!activeElement}
                    className="p-1.5 text-rose-400 hover:bg-slate-50 rounded-lg text-xs transition cursor-pointer"
                    title="Khôi phục phần tử này về mặc định"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Element Dropdown Selector */}
              <div className="relative">
                <select
                  value={selectedElementId || ''}
                  onChange={(e) => setSelectedElementId(e.target.value)}
                  className="w-full bg-slate-100 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 border border-slate-300 focus:outline-none focus:border-amber-400 cursor-pointer shadow-xs truncate"
                >
                  {elementsList.map((elem) => (
                    <option key={elem.id} value={elem.id}>
                      🏷️ {elem.name} ({elem.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Accordion Expand / Collapse Controls */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  Nhóm thuộc tính tùy chỉnh
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleExpandAll(true)}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-50 text-slate-600 text-[10px] font-medium border border-slate-750 transition"
                  >
                    Mở tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExpandAll(false)}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-50 text-slate-600 text-[10px] font-medium border border-slate-750 transition"
                  >
                    Thu gọn
                  </button>
                </div>
              </div>
            </div>

            {/* ACCORDION PROPERTY PANELS (SCROLLABLE) */}
            <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-3 text-xs scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-850">
              {activeElement ? (
                <>
                  {/* ACCORDION 1: LAYOUT & SPACING */}
                  <div className="rounded-xl border border-slate-200 bg-slate-850/50 overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('layout')}
                      className="w-full px-3 py-2.5 bg-slate-100/80 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-between transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Layout className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Bố Cục & Kích Thước (Layout)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {Boolean(activeElement.padding || activeElement.margin || activeElement.scale) && (
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                        )}
                        {expandedSections.layout ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {expandedSections.layout && (
                      <div className="p-3.5 space-y-4 border-t border-slate-200">
                        {/* Width Presets */}
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1.5">
                            Chiều rộng (Width)
                          </label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {['auto', '50%', '75%', '100%'].map((w) => (
                              <button
                                key={w}
                                onClick={() => updateElementStyle(activeElement.id, { width: w })}
                                className={`py-1.5 rounded-xl border text-[11px] font-medium transition cursor-pointer ${
                                  (activeElement.width || 'auto') === w
                                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-xs'
                                    : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {w === 'auto' ? 'Tự động' : w}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Padding Slider + Stepper */}
                        <div>
                          <div className="flex justify-between items-center text-slate-600 mb-1.5">
                            <span className="font-semibold">Khoảng đệm trong (Padding)</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  updateElementStyle(activeElement.id, {
                                    padding: Math.max(0, (activeElement.padding ?? 16) - 2),
                                  })
                                }
                                className="p-1 bg-slate-100 hover:bg-slate-50 text-slate-600 rounded border border-slate-300 cursor-pointer"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="font-mono text-amber-400 font-bold px-1.5">
                                {activeElement.padding ?? 16}px
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateElementStyle(activeElement.id, {
                                    padding: Math.min(64, (activeElement.padding ?? 16) + 2),
                                  })
                                }
                                className="p-1 bg-slate-100 hover:bg-slate-50 text-slate-600 rounded border border-slate-300 cursor-pointer"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="56"
                            step="2"
                            value={activeElement.padding ?? 16}
                            onChange={(e) =>
                              updateElementStyle(activeElement.id, { padding: Number(e.target.value) })
                            }
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                            <span>Gọn 0px</span>
                            <span>Chuẩn 16px</span>
                            <span>Rộng 32px</span>
                            <span>Cực rộng 56px</span>
                          </div>
                        </div>

                        {/* Margin Slider + Stepper */}
                        <div>
                          <div className="flex justify-between items-center text-slate-600 mb-1.5">
                            <span className="font-semibold">Khoảng cách ngoài (Margin)</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  updateElementStyle(activeElement.id, {
                                    margin: Math.max(0, (activeElement.margin ?? 0) - 2),
                                  })
                                }
                                className="p-1 bg-slate-100 hover:bg-slate-50 text-slate-600 rounded border border-slate-300 cursor-pointer"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="font-mono text-amber-400 font-bold px-1.5">
                                {activeElement.margin ?? 0}px
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateElementStyle(activeElement.id, {
                                    margin: Math.min(48, (activeElement.margin ?? 0) + 2),
                                  })
                                }
                                className="p-1 bg-slate-100 hover:bg-slate-50 text-slate-600 rounded border border-slate-300 cursor-pointer"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="48"
                            step="2"
                            value={activeElement.margin ?? 0}
                            onChange={(e) =>
                              updateElementStyle(activeElement.id, { margin: Number(e.target.value) })
                            }
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>

                        {/* Gap Slider */}
                        <div>
                          <div className="flex justify-between items-center text-slate-600 mb-1.5">
                            <span className="font-semibold">Khoảng cách mục con (Gap)</span>
                            <span className="font-mono text-amber-400 font-bold">{activeElement.gap ?? 8}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="32"
                            step="2"
                            value={activeElement.gap ?? 8}
                            onChange={(e) =>
                              updateElementStyle(activeElement.id, { gap: Number(e.target.value) })
                            }
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>

                        {/* Scale Slider */}
                        <div>
                          <div className="flex justify-between items-center text-slate-600 mb-1.5">
                            <span className="font-semibold">Tỉ lệ phóng to (Scale)</span>
                            <span className="font-mono text-amber-400 font-bold">
                              {Math.round((activeElement.scale ?? 1.0) * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.8"
                            max="1.3"
                            step="0.05"
                            value={activeElement.scale ?? 1.0}
                            onChange={(e) =>
                              updateElementStyle(activeElement.id, { scale: Number(e.target.value) })
                            }
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>

                        {/* Visibility Toggles */}
                        <div className="pt-3 border-t border-slate-200 space-y-2">
                          <span className="text-slate-400 font-semibold block text-[11px]">
                            📱 Khả Năng Hiển Thị:
                          </span>
                          <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-850 border border-slate-750 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={activeElement.visibleDesktop !== false}
                              onChange={(e) =>
                                updateElementStyle(activeElement.id, { visibleDesktop: e.target.checked })
                              }
                              className="rounded accent-amber-400 w-4 h-4"
                            />
                            <span className="text-slate-700">Hiển thị trên Máy tính / Máy chiếu</span>
                          </label>

                          <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-850 border border-slate-750 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={activeElement.visibleMobile !== false}
                              onChange={(e) =>
                                updateElementStyle(activeElement.id, { visibleMobile: e.target.checked })
                              }
                              className="rounded accent-amber-400 w-4 h-4"
                            />
                            <span className="text-slate-700">Hiển thị trên Điện thoại / Di động</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACCORDION 2: TYPOGRAPHY & TEXT */}
                  <div className="rounded-xl border border-slate-200 bg-slate-850/50 overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('typography')}
                      className="w-full px-3 py-2.5 bg-slate-100/80 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-between transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Type className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Phông Chữ & Văn Bản (Typography)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {Boolean(activeElement.fontSize || activeElement.textColor || activeElement.customText) && (
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                        )}
                        {expandedSections.typography ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {expandedSections.typography && (
                      <div className="p-3.5 space-y-4 border-t border-slate-200">
                        {/* Custom Text Override */}
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1.5">
                            Nội dung chữ hiển thị (Tùy chỉnh tiêu đề/nhãn)
                          </label>
                          <input
                            type="text"
                            value={activeElement.customText || ''}
                            placeholder={activeElement.name}
                            onChange={(e) =>
                              updateElementStyle(activeElement.id, { customText: e.target.value })
                            }
                            className="w-full bg-slate-100 text-slate-800 px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-400 shadow-xs"
                          />
                        </div>

                        {/* Font Size Slider + Stepper */}
                        <div>
                          <div className="flex justify-between items-center text-slate-600 mb-1.5">
                            <span className="font-semibold">Cỡ chữ (Font Size)</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  updateElementStyle(activeElement.id, {
                                    fontSize: Math.max(10, (activeElement.fontSize ?? 16) - 1),
                                  })
                                }
                                className="p-1 bg-slate-100 hover:bg-slate-50 text-slate-600 rounded border border-slate-300 cursor-pointer"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="font-mono text-amber-400 font-bold px-1.5">
                                {activeElement.fontSize ?? 16}px
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateElementStyle(activeElement.id, {
                                    fontSize: Math.min(64, (activeElement.fontSize ?? 16) + 1),
                                  })
                                }
                                className="p-1 bg-slate-100 hover:bg-slate-50 text-slate-600 rounded border border-slate-300 cursor-pointer"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="12"
                            max="64"
                            step="1"
                            value={activeElement.fontSize ?? 16}
                            onChange={(e) =>
                              updateElementStyle(activeElement.id, { fontSize: Number(e.target.value) })
                            }
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>

                        {/* Font Weight */}
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1.5">
                            Độ đậm của chữ (Font Weight)
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { label: 'Thường', val: 'normal' },
                              { label: 'Đậm vừa (600)', val: '600' },
                              { label: 'Đậm (700)', val: '700' },
                              { label: 'Rất đậm (800)', val: '800' },
                              { label: 'Siêu đậm (900)', val: '900' },
                            ].map((fw) => (
                              <button
                                key={fw.val}
                                onClick={() => updateElementStyle(activeElement.id, { fontWeight: fw.val as any })}
                                className={`py-1.5 rounded-xl border text-[11px] transition cursor-pointer ${
                                  (activeElement.fontWeight || 'normal') === fw.val
                                    ? 'bg-amber-500 text-slate-950 font-extrabold border-amber-400 shadow-xs'
                                    : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {fw.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Text Alignment */}
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1.5">
                            Căn lề chữ (Alignment)
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { label: 'Trái', icon: <AlignLeft className="w-3.5 h-3.5" />, val: 'left' },
                              { label: 'Giữa', icon: <AlignCenter className="w-3.5 h-3.5" />, val: 'center' },
                              { label: 'Phải', icon: <AlignRight className="w-3.5 h-3.5" />, val: 'right' },
                            ].map((ta) => (
                              <button
                                key={ta.val}
                                onClick={() => updateElementStyle(activeElement.id, { textAlign: ta.val as any })}
                                className={`py-1.5 rounded-xl border text-[11px] transition cursor-pointer flex items-center justify-center gap-1 ${
                                  (activeElement.textAlign || 'left') === ta.val
                                    ? 'bg-amber-500 text-slate-950 font-extrabold border-amber-400 shadow-xs'
                                    : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {ta.icon}
                                <span>{ta.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Text Color Selection via AccessibleColorPicker */}
                        <AccessibleColorPicker
                          label="Màu Chữ (Text Color)"
                          value={activeElement.textColor}
                          onChange={(color: string) => updateElementStyle(activeElement.id, { textColor: color })}
                          pairedColor={activeElement.backgroundColor || '#0f172a'}
                          isBackground={false}
                        />
                      </div>
                    )}
                  </div>

                  {/* ACCORDION 3: BACKGROUND & GLASSMORPHISM */}
                  <div className="rounded-xl border border-slate-200 bg-slate-850/50 overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('color')}
                      className="w-full px-3 py-2.5 bg-slate-100/80 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-between transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Màu Nền & Kính Mờ (Background)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {Boolean(activeElement.backgroundColor || activeElement.backgroundImage) && (
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                        )}
                        {expandedSections.color ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {expandedSections.color && (
                      <div className="p-3.5 space-y-4 border-t border-slate-200">
                        {/* Background Color via AccessibleColorPicker */}
                        <AccessibleColorPicker
                          label="Màu Nền (Background Color)"
                          value={activeElement.backgroundColor}
                          onChange={(color: string) => updateElementStyle(activeElement.id, { backgroundColor: color })}
                          pairedColor={activeElement.textColor || '#ffffff'}
                          isBackground={true}
                        />

                        {/* Background Image URL */}
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1.5">
                            Ảnh nền (Background Image URL)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={activeElement.backgroundImage || ''}
                              placeholder="https://... hoặc data:image/..."
                              onChange={(e) =>
                                updateElementStyle(activeElement.id, { backgroundImage: e.target.value })
                              }
                              className="flex-1 bg-slate-100 text-slate-800 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-400"
                            />
                            {activeElement.backgroundImage && (
                              <button
                                onClick={() => updateElementStyle(activeElement.id, { backgroundImage: '' })}
                                className="px-3 py-2 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold cursor-pointer hover:bg-rose-500/30 transition"
                              >
                                Xóa
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Glassmorphism & Backdrop Blur */}
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1.5">
                            Kính mờ xuyên thấu (Glassmorphism Blur)
                          </label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[
                              { label: 'Không mờ', val: undefined },
                              { label: 'Mờ nhẹ (4px)', val: 'blur-xs' },
                              { label: 'Mờ vừa (12px)', val: 'blur-md' },
                              { label: 'Mờ đậm (24px)', val: 'blur-xl' },
                            ].map((gl) => (
                              <button
                                key={gl.label}
                                type="button"
                                onClick={() =>
                                  updateElementStyle(activeElement.id, {
                                    backgroundColor: activeElement.backgroundColor || 'rgba(15, 23, 42, 0.75)',
                                  })
                                }
                                className="py-1.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-50 text-slate-600 text-[10px] font-medium transition cursor-pointer"
                              >
                                {gl.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Element Opacity Slider */}
                        <div>
                          <div className="flex justify-between items-center text-slate-600 mb-1.5">
                            <span className="font-semibold">Độ mờ đục toàn phần tử (Opacity)</span>
                            <span className="font-mono text-amber-400 font-bold">{activeElement.opacity ?? 100}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            step="5"
                            value={activeElement.opacity ?? 100}
                            onChange={(e) =>
                              updateElementStyle(activeElement.id, { opacity: Number(e.target.value) })
                            }
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACCORDION 4: BORDER & SHADOW */}
                  <div className="rounded-xl border border-slate-200 bg-slate-850/50 overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('border')}
                      className="w-full px-3 py-2.5 bg-slate-100/80 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-between transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Viền, Bo Góc & Đổ Bóng (Borders & Glow)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {Boolean(activeElement.borderRadius || activeElement.borderWidth || activeElement.boxShadow) && (
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                        )}
                        {expandedSections.border ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {expandedSections.border && (
                      <div className="p-3.5 space-y-4 border-t border-slate-200">
                        {/* Border Radius Slider + Quick Presets */}
                        <div>
                          <div className="flex justify-between items-center text-slate-600 mb-1.5">
                            <span className="font-semibold">Bo góc (Border Radius)</span>
                            <span className="font-mono text-amber-400 font-bold">{activeElement.borderRadius ?? 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="48"
                            step="2"
                            value={activeElement.borderRadius ?? 0}
                            onChange={(e) =>
                              updateElementStyle(activeElement.id, { borderRadius: Number(e.target.value) })
                            }
                            className="w-full accent-amber-400 cursor-pointer mb-2"
                          />
                          <div className="grid grid-cols-5 gap-1">
                            {[0, 8, 16, 24, 9999].map((rad) => (
                              <button
                                key={rad}
                                type="button"
                                onClick={() => updateElementStyle(activeElement.id, { borderRadius: rad })}
                                className={`py-1 rounded-lg border text-[10px] font-bold transition cursor-pointer ${
                                  (activeElement.borderRadius ?? 0) === rad
                                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                                    : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {rad === 9999 ? 'Tròn' : `${rad}px`}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Border Width */}
                        <div>
                          <div className="flex justify-between items-center text-slate-600 mb-1.5">
                            <span className="font-semibold">Độ dày viền (Border Width)</span>
                            <span className="font-mono text-amber-400 font-bold">{activeElement.borderWidth ?? 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="12"
                            step="1"
                            value={activeElement.borderWidth ?? 0}
                            onChange={(e) =>
                              updateElementStyle(activeElement.id, { borderWidth: Number(e.target.value) })
                            }
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>

                        {/* Border Style */}
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1.5">Kiểu đường viền</label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {['solid', 'dashed', 'dotted', 'none'].map((st) => (
                              <button
                                key={st}
                                onClick={() => updateElementStyle(activeElement.id, { borderStyle: st as any })}
                                className={`py-1.5 rounded-xl border text-[11px] transition cursor-pointer ${
                                  (activeElement.borderStyle || 'solid') === st
                                    ? 'bg-amber-500 text-slate-950 font-extrabold border-amber-400 shadow-xs'
                                    : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {st === 'solid' ? 'Nét liền' : st === 'dashed' ? 'Nét đứt' : st === 'dotted' ? 'Chấm bi' : 'Không viền'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Border Color via AccessibleColorPicker */}
                        <AccessibleColorPicker
                          label="Màu Viền (Border Color)"
                          value={activeElement.borderColor}
                          onChange={(color: string) => updateElementStyle(activeElement.id, { borderColor: color })}
                          pairedColor={activeElement.backgroundColor || '#0f172a'}
                          isBackground={false}
                        />

                        {/* Box Shadow Presets */}
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1.5">
                            Đổ bóng & Phát sáng (Shadow & Glow)
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: 'none', label: 'Không bóng' },
                              { id: 'soft', label: 'Bóng nhẹ' },
                              { id: 'medium', label: 'Bóng vừa' },
                              { id: 'large', label: 'Bóng sâu' },
                              { id: 'glow-primary', label: 'Sáng Xanh Tím' },
                              { id: 'glow-amber', label: 'Sáng Vàng Kim' },
                              { id: 'glow-cyan', label: 'Sáng Cyan Neon' },
                            ].map((sh) => (
                              <button
                                key={sh.id}
                                onClick={() => updateElementStyle(activeElement.id, { boxShadow: sh.id as any })}
                                className={`p-2 rounded-xl border text-left text-xs transition cursor-pointer ${
                                  (activeElement.boxShadow || 'none') === sh.id
                                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-xs'
                                    : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {sh.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACCORDION 5: QUICK PRESETS */}
                  <div className="rounded-xl border border-slate-200 bg-slate-850/50 overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => toggleSection('presets')}
                      className="w-full px-3 py-2.5 bg-slate-100/80 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-between transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Mẫu Thiết Kế Sẵn (Style Presets)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {expandedSections.presets ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {expandedSections.presets && (
                      <div className="p-3.5 space-y-3 border-t border-slate-200">
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          Áp dụng nhanh các phong cách thiết kế đã tối ưu sẵn cho phần tử{' '}
                          <strong className="text-amber-400">{activeElement.name}</strong>:
                        </p>

                        {STYLE_PRESETS.map((preset) => (
                          <div
                            key={preset.id}
                            onClick={() => applyPresetToElement(activeElement.id, preset.id)}
                            className="p-3 bg-slate-100 hover:bg-slate-50 border border-slate-300 hover:border-amber-400/60 rounded-xl cursor-pointer transition group shadow-sm"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: preset.previewColor }}
                              />
                              <h4 className="font-bold text-slate-700 group-hover:text-amber-300 text-xs">
                                {preset.name}
                              </h4>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-snug">{preset.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <p>Chọn một phần tử từ danh sách bên trái hoặc bấm trực tiếp trên màn hình game để bắt đầu chỉnh sửa.</p>
                </div>
              )}
            </div>

            {/* Bottom Actions: Reset Game / Export JSON */}
            <div className="p-3 border-t border-slate-200 bg-slate-850 flex items-center justify-between text-xs shrink-0">
              <button
                onClick={() => setShowConfirmResetAll(true)}
                className="px-2.5 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                title="Khôi phục toàn bộ giao diện trò chơi về nguyên bản"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi phục mặc định</span>
              </button>

              <button
                onClick={() => {
                  setJsonExportText(JSON.stringify(currentConfig, null, 2));
                  setShowExportModal(true);
                }}
                className="px-3 py-1.5 text-slate-600 hover:text-white bg-slate-100 hover:bg-slate-50 rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-slate-300"
                title="Xuất / Nhập mã cấu hình JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* TOAST FEEDBACK */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] px-4 py-2.5 bg-slate-850 border border-amber-400 text-amber-200 font-bold rounded-xl shadow-2xl flex items-center gap-2 text-xs"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{saveToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRM RESET ALL MODAL */}
      {showConfirmResetAll && (
        <div className="fixed inset-0 z-[10001] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-300 p-6 rounded-2xl shadow-2xl text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Khôi phục toàn bộ giao diện?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Thao tác này sẽ xóa toàn bộ các tùy chỉnh kích thước, màu sắc, phông chữ của game này và trở về
              giao diện chuẩn ban đầu. Bạn có chắc chắn không?
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setShowConfirmResetAll(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={async () => {
                  await resetAllGameStyles();
                  setShowConfirmResetAll(false);
                  setSaveToast('Đã khôi phục toàn bộ giao diện về mặc định!');
                  setTimeout(() => setSaveToast(null), 3000);
                }}
                className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-500 shadow-md cursor-pointer"
              >
                Xác nhận khôi phục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT / IMPORT JSON MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-[10001] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white border border-slate-300 p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Download className="w-4 h-4 text-amber-400" />
                Cấu hình giao diện JSON (Xuất & Nhập)
              </h3>
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setImportError(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-800 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Bạn có thể sao chép mã JSON bên dưới để sao lưu hoặc dán mã JSON cấu hình mới để nạp vào trò chơi.
            </p>

            <textarea
              value={jsonExportText}
              onChange={(e) => {
                setJsonExportText(e.target.value);
                setImportError(null);
              }}
              rows={12}
              className="w-full bg-slate-50 text-slate-600 font-mono text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
            />

            {importError && (
              <p className="text-xs text-rose-400 font-semibold bg-rose-950/30 p-2 rounded-lg border border-rose-800">
                {importError}
              </p>
            )}

            <div className="flex justify-between items-center pt-2 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(jsonExportText);
                    setSaveToast('Đã chép mã JSON vào bộ nhớ đệm!');
                    setTimeout(() => setSaveToast(null), 2000);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép JSON</span>
                </button>

                <button
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(jsonExportText);
                      if (parsed && typeof parsed === 'object' && parsed.elements) {
                        Object.entries(parsed.elements).forEach(([elemId, style]: [string, any]) => {
                          updateElementStyle(elemId, style);
                        });
                        setShowExportModal(false);
                        setSaveToast('Đã nạp và áp dụng cấu hình JSON thành công!');
                        setTimeout(() => setSaveToast(null), 3000);
                      } else {
                        setImportError('Mã JSON không đúng định dạng GameUIConfig hợp lệ (thiếu trường elements).');
                      }
                    } catch (err: any) {
                      setImportError(`Lỗi cú pháp JSON: ${err.message}`);
                    }
                  }}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Nạp cấu hình này</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setShowExportModal(false);
                  setImportError(null);
                }}
                className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGameUIEditor;
