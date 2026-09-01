import { ElementUIStyle, GameUIConfig, StylePreset, ViewportSize } from '../types/gameUI';

export const VIEWPORT_SIZES: ViewportSize[] = [
  {
    id: 'responsive',
    label: 'Tự co giãn',
    icon: 'Maximize',
    width: '100%',
    height: '100%',
    deviceLabel: 'Tự thích ứng theo kích thước màn hình hiện tại',
  },
  {
    id: 'desktop-fhd',
    label: '1920×1080',
    icon: 'Monitor',
    width: 1920,
    height: 1080,
    deviceLabel: 'Máy chiếu lớp học / Màn hình FHD',
  },
  {
    id: 'laptop',
    label: '1366×768',
    icon: 'Laptop',
    width: 1366,
    height: 768,
    deviceLabel: 'Laptop giáo viên phổ thông',
  },
  {
    id: 'desktop-hd',
    label: '1280×720',
    icon: 'Tv',
    width: 1280,
    height: 720,
    deviceLabel: 'Màn hình HD tiêu chuẩn',
  },
  {
    id: 'tablet',
    label: '768×1024',
    icon: 'Tablet',
    width: 768,
    height: 1024,
    deviceLabel: 'Máy tính bảng iPad / Android',
  },
  {
    id: 'mobile',
    label: '375×667',
    icon: 'Smartphone',
    width: 375,
    height: 667,
    deviceLabel: 'Điện thoại thông minh',
  },
];

export const THEME_COLOR_TOKENS = [
  { id: 'theme:primary', name: 'Màu chính (Primary)', value: 'var(--color-primary, #6366f1)' },
  { id: 'theme:secondary', name: 'Màu phụ (Secondary)', value: 'var(--color-secondary, #ec4899)' },
  { id: 'theme:accent', name: 'Màu nhấn (Accent)', value: 'var(--color-accent, #f59e0b)' },
  { id: 'theme:background', name: 'Màu nền trang (Bg)', value: 'var(--color-bg, #0f172a)' },
  { id: 'theme:card', name: 'Nền thẻ / Hộp (Card)', value: 'var(--color-card, #1e293b)' },
  { id: 'theme:text', name: 'Màu chữ chính (Text)', value: 'var(--color-text, #f8fafc)' },
  { id: 'theme:muted', name: 'Màu chữ phụ (Muted)', value: 'var(--color-muted, #94a3b8)' },
  { id: 'theme:border', name: 'Màu viền (Border)', value: 'var(--color-border, #334155)' },
  { id: 'theme:success', name: 'Thành công (Xanh lá)', value: '#10b981' },
  { id: 'theme:warning', name: 'Cảnh báo (Vàng hổ phách)', value: '#f59e0b' },
  { id: 'theme:danger', name: 'Nguy hiểm (Đỏ cam)', value: '#ef4444' },
];

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'soft-rounded',
    name: 'Bo tròn dễ thương',
    description: 'Bo góc lớn, màu sắc tươi vui, viền mềm mại phù hợp học sinh tiểu học',
    previewColor: '#ec4899',
    style: {
      borderRadius: 24,
      borderWidth: 2,
      borderStyle: 'solid',
      borderColor: '#fbcfe8',
      backgroundColor: '#fdf2f8',
      textColor: '#831843',
      boxShadow: 'soft',
      padding: 16,
    },
  },
  {
    id: 'modern-clean',
    name: 'Tối giản hiện đại',
    description: 'Viền mảnh thanh lịch, nền kính mờ nhẹ, tập trung vào nội dung',
    previewColor: '#3b82f6',
    style: {
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: '#e2e8f0',
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
      boxShadow: 'none',
      padding: 14,
    },
  },
  {
    id: 'elevated-shadow',
    name: 'Đổ bóng nổi bật',
    description: 'Tạo chiều sâu rõ rệt với bóng đổ nhiều lớp mượt mà',
    previewColor: '#6366f1',
    style: {
      borderRadius: 16,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: '#cbd5e1',
      backgroundColor: '#ffffff',
      textColor: '#1e293b',
      boxShadow: 'large',
      padding: 20,
    },
  },
  {
    id: 'royal-gold',
    name: 'Vàng kim vinh quang',
    description: 'Phong cách sân khấu trao giải, viền vàng óng ánh, bóng phát sáng',
    previewColor: '#f59e0b',
    style: {
      borderRadius: 20,
      borderWidth: 3,
      borderStyle: 'solid',
      borderColor: '#f59e0b',
      backgroundColor: '#1e1b4b',
      textColor: '#fef08a',
      boxShadow: 'glow-amber',
      padding: 18,
      fontWeight: '800',
    },
  },
  {
    id: 'neon-cyber',
    name: 'Neon Huyền Ảo',
    description: 'Viền phát sáng phong cách viễn tưởng tương lai',
    previewColor: '#06b6d4',
    style: {
      borderRadius: 16,
      borderWidth: 2,
      borderStyle: 'solid',
      borderColor: '#06b6d4',
      backgroundColor: '#020617',
      textColor: '#67e8f9',
      boxShadow: 'glow-cyan',
      padding: 16,
      fontWeight: '700',
    },
  },
  {
    id: 'compact-focus',
    name: 'Gọn gàng tối ưu',
    description: 'Khoảng cách thu hẹp, hiển thị tối đa câu hỏi trên một màn hình',
    previewColor: '#64748b',
    style: {
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: 'solid',
      padding: 8,
      margin: 4,
      gap: 6,
      boxShadow: 'soft',
    },
  },
];

/**
 * Standard default elements defined for each game
 */
export const GAME_DEFAULT_ELEMENTS: Record<string, ElementUIStyle[]> = {
  lucky_star: [
    {
      id: 'gameHeader',
      name: 'Thanh tiêu đề game',
      category: 'header',
      fontSize: 22,
      fontWeight: '800',
      textAlign: 'center',
      padding: 12,
      margin: 8,
      borderRadius: 16,
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      textColor: '#fef08a',
      boxShadow: 'soft',
    },
    {
      id: 'gameTitle',
      name: 'Dòng chữ Tiêu đề game',
      category: 'header',
      fontSize: 24,
      fontWeight: '900',
      textAlign: 'center',
      textColor: '#fde047',
      customText: 'NGÔI SAO MAY MẮN',
    },
    {
      id: 'starStage',
      name: 'Vũ trụ / Sàn sao lượn sóng',
      category: 'stage',
      borderRadius: 24,
      borderWidth: 2,
      borderColor: 'rgba(251, 191, 36, 0.3)',
      backgroundColor: 'rgba(10, 15, 30, 0.95)',
      boxShadow: 'glow-amber',
      padding: 16,
    },
    {
      id: 'controlBar',
      name: 'Thanh điều khiển nút bấm',
      category: 'button',
      padding: 14,
      borderRadius: 20,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    {
      id: 'startBtn',
      name: 'Nút QUAY / BẮT ĐẦU',
      category: 'button',
      fontSize: 16,
      fontWeight: '800',
      padding: 12,
      borderRadius: 16,
      backgroundColor: '#f59e0b',
      textColor: '#020617',
      boxShadow: 'glow-amber',
    },
    {
      id: 'stopBtn',
      name: 'Nút DỪNG LẠI',
      category: 'button',
      fontSize: 16,
      fontWeight: '800',
      padding: 12,
      borderRadius: 16,
      backgroundColor: '#ef4444',
      textColor: '#ffffff',
      boxShadow: 'large',
    },
    {
      id: 'resultCard',
      name: 'Bảng chúc mừng học sinh may mắn',
      category: 'modal',
      padding: 24,
      borderRadius: 28,
      borderWidth: 3,
      borderColor: '#fde047',
      backgroundColor: '#0f172a',
      boxShadow: 'glow-amber',
    },
    {
      id: 'winnerName',
      name: 'Tên học sinh trúng giải',
      category: 'modal',
      fontSize: 28,
      fontWeight: '900',
      textAlign: 'center',
      textColor: '#fef08a',
    },
  ],
  random_call: [
    {
      id: 'gameHeader',
      name: 'Thanh tiêu đề',
      category: 'header',
      padding: 12,
      fontSize: 20,
      fontWeight: '800',
      textAlign: 'center',
    },
    {
      id: 'rouletteBox',
      name: 'Khung gọi tên học sinh',
      category: 'stage',
      padding: 24,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: '#3b82f6',
      backgroundColor: '#ffffff',
      boxShadow: 'medium',
    },
    {
      id: 'nameSlot',
      name: 'Thẻ tên học sinh hiển thị',
      category: 'stage',
      fontSize: 32,
      fontWeight: '900',
      textAlign: 'center',
      textColor: '#1e293b',
    },
    {
      id: 'callBtn',
      name: 'Nút QUAY TÊN',
      category: 'button',
      fontSize: 18,
      fontWeight: '800',
      padding: 14,
      borderRadius: 16,
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      boxShadow: 'glow-primary',
    },
    {
      id: 'questionPanel',
      name: 'Bảng câu hỏi kiểm tra',
      category: 'question',
      padding: 16,
      borderRadius: 16,
      backgroundColor: '#f8fafc',
      borderWidth: 1,
      borderColor: '#e2e8f0',
    },
    {
      id: 'sessionHistory',
      name: 'Nhật ký gọi tên phiên này',
      category: 'stage',
      padding: 16,
      borderRadius: 20,
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#e2e8f0',
    },
  ],
  egg_call: [
    {
      id: 'gameHeader',
      name: 'Thanh tiêu đề',
      category: 'header',
      padding: 12,
      fontSize: 20,
      fontWeight: '800',
    },
    {
      id: 'eggGrid',
      name: 'Khu vực tổ trứng thần kỳ',
      category: 'stage',
      padding: 20,
      borderRadius: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      boxShadow: 'soft',
    },
    {
      id: 'eggItem',
      name: 'Quả trứng gọi tên',
      category: 'stage',
      borderRadius: 20,
      padding: 12,
    },
  ],
  openbox: [
    {
      id: 'gameHeader',
      name: 'Thanh tiêu đề',
      category: 'header',
      padding: 12,
      fontSize: 20,
      fontWeight: '800',
    },
    {
      id: 'boxGrid',
      name: 'Lưới các hộp quà bí ẩn',
      category: 'stage',
      padding: 20,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
    },
    {
      id: 'questionModal',
      name: 'Hộp thoại câu hỏi khi mở hộp',
      category: 'question',
      padding: 24,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: '#3b82f6',
      backgroundColor: '#ffffff',
      boxShadow: 'large',
    },
  ],
  general: [
    {
      id: 'gameHeader',
      name: 'Thanh tiêu đề chung',
      category: 'header',
      padding: 12,
      fontSize: 20,
      fontWeight: '800',
    },
    {
      id: 'stageContainer',
      name: 'Khung trò chơi chính',
      category: 'stage',
      padding: 16,
      borderRadius: 20,
      boxShadow: 'soft',
    },
    {
      id: 'questionCard',
      name: 'Khung hiển thị câu hỏi',
      category: 'question',
      padding: 16,
      borderRadius: 16,
      boxShadow: 'soft',
    },
    {
      id: 'primaryButton',
      name: 'Nút hành động chính',
      category: 'button',
      fontSize: 16,
      fontWeight: '700',
      padding: 12,
      borderRadius: 14,
    },
  ],
};

/**
 * Get default element list for a game ID
 */
export function getDefaultElementsForGame(gameId: string): ElementUIStyle[] {
  const normalizedId = gameId.toLowerCase().replace(/[-_]/g, '_');
  if (GAME_DEFAULT_ELEMENTS[normalizedId]) {
    return GAME_DEFAULT_ELEMENTS[normalizedId];
  }
  if (normalizedId.includes('star') || normalizedId.includes('lucky')) {
    return GAME_DEFAULT_ELEMENTS.lucky_star;
  }
  if (normalizedId.includes('random') || normalizedId.includes('call')) {
    return GAME_DEFAULT_ELEMENTS.random_call;
  }
  if (normalizedId.includes('egg')) {
    return GAME_DEFAULT_ELEMENTS.egg_call;
  }
  if (normalizedId.includes('box')) {
    return GAME_DEFAULT_ELEMENTS.openbox;
  }
  return GAME_DEFAULT_ELEMENTS.general;
}

/**
 * WCAG contrast ratio calculator
 */
export function getLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  if (hex.length < 6) return 0.5;
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const a = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

export function checkContrast(textHex: string, bgHex: string): { ratio: number; isAdequate: boolean } {
  try {
    if (!textHex.startsWith('#') || !bgHex.startsWith('#')) {
      return { ratio: 4.5, isAdequate: true };
    }
    const lum1 = getLuminance(textHex);
    const lum2 = getLuminance(bgHex);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    const ratio = (brightest + 0.05) / (darkest + 0.05);
    return { ratio: Math.round(ratio * 10) / 10, isAdequate: ratio >= 4.5 };
  } catch {
    return { ratio: 4.5, isAdequate: true };
  }
}
