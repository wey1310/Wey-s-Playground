export type ThemeId =
  | 'pastel'
  | 'brightclassroom'
  | 'deepspace'
  | 'matcha'
  | 'sakura'
  | 'sky'
  | 'mono';

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryDark: string;
  primaryText: string;
  bgMain: string;
  bgCard: string;
  bgAlt: string;
  bgTag: string;
  border: string;
  borderHover: string;
  borderFocus: string;
  accentLight: string;
  accentMuted: string;
  accentBorder: string;
  textMain: string;
  textMuted: string;
  inputBg: string;
  inputBorder: string;
  ring: string;
  selectionBg: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  icon: string;
  desc: string;
  isDark: boolean;
  colors: ThemeColors;
}

export const APP_THEMES: ThemeDefinition[] = [
  {
    id: 'pastel',
    name: 'Pastel Đào & Bạc Hà',
    icon: '🎨',
    desc: 'Hồng pastel & kem ấm, giao diện nhẹ nhàng dịu mắt',
    isDark: false,
    colors: {
      primary: '#F29E9F',
      primaryHover: '#E88B8C',
      primaryDark: '#D9787A',
      primaryText: '#FFFFFF',
      bgMain: '#FFFBF5',
      bgCard: '#FFFFFF',
      bgAlt: '#FBF4EA',
      bgTag: '#FDF1EB',
      border: '#EFE4D6',
      borderHover: '#DEC8B3',
      borderFocus: '#F29E9F',
      accentLight: '#F0F8F3',
      accentMuted: '#D9EFE2',
      accentBorder: '#B7E2C9',
      textMain: '#2E2623',
      textMuted: '#7A6E6B',
      inputBg: '#FFFFFF',
      inputBorder: '#E8DCD0',
      ring: 'rgba(242, 158, 159, 0.35)',
      selectionBg: '#FDF1EB',
    },
  },
  {
    id: 'brightclassroom',
    name: 'Lớp Học Tươi Sáng',
    icon: '🏫',
    desc: 'Xanh ngọc lục bảo & trắng sáng, năng động tập trung',
    isDark: false,
    colors: {
      primary: '#25855A',
      primaryHover: '#1F6E4A',
      primaryDark: '#18573A',
      primaryText: '#FFFFFF',
      bgMain: '#F7FAF7',
      bgCard: '#FFFFFF',
      bgAlt: '#EFF6F0',
      bgTag: '#E4F2E7',
      border: '#CFE5D4',
      borderHover: '#A8D4B1',
      borderFocus: '#25855A',
      accentLight: '#E8F6ED',
      accentMuted: '#C7EBD2',
      accentBorder: '#93D5A5',
      textMain: '#1A3022',
      textMuted: '#506857',
      inputBg: '#FFFFFF',
      inputBorder: '#CFE5D4',
      ring: 'rgba(37, 133, 90, 0.35)',
      selectionBg: '#C7EBD2',
    },
  },
  {
    id: 'deepspace',
    name: 'Deep Space (Chế Độ Tối)',
    icon: '🌌',
    desc: 'Vũ trụ huyền bí, độ tương phản cao, bảo vệ thị lực ban đêm',
    isDark: true,
    colors: {
      primary: '#6366F1',
      primaryHover: '#7C80F7',
      primaryDark: '#4F46E5',
      primaryText: '#FFFFFF',
      bgMain: '#090D16',
      bgCard: '#131B2E',
      bgAlt: '#1C263E',
      bgTag: '#243250',
      border: '#273550',
      borderHover: '#3D527D',
      borderFocus: '#6366F1',
      accentLight: '#1A233A',
      accentMuted: '#2A3A60',
      accentBorder: '#475E8C',
      textMain: '#F1F5F9',
      textMuted: '#94A3B8',
      inputBg: '#182238',
      inputBorder: '#2F3F60',
      ring: 'rgba(99, 102, 241, 0.45)',
      selectionBg: '#312E81',
    },
  },
  {
    id: 'matcha',
    name: 'Matcha Zen',
    icon: '🍵',
    desc: 'Xanh trà thanh tịnh, tông ấm mộc mạc thư thái',
    isDark: false,
    colors: {
      primary: '#5B7B3E',
      primaryHover: '#4B6633',
      primaryDark: '#3A5027',
      primaryText: '#FFFFFF',
      bgMain: '#F6F4ED',
      bgCard: '#FEFCF6',
      bgAlt: '#ECE7D7',
      bgTag: '#E7E3D0',
      border: '#D5CDAF',
      borderHover: '#B8AC85',
      borderFocus: '#5B7B3E',
      accentLight: '#E7EED7',
      accentMuted: '#D4E3BB',
      accentBorder: '#A8C582',
      textMain: '#283320',
      textMuted: '#637059',
      inputBg: '#FEFCF6',
      inputBorder: '#D5CDAF',
      ring: 'rgba(91, 123, 62, 0.35)',
      selectionBg: '#D4E3BB',
    },
  },
  {
    id: 'sakura',
    name: 'Sakura Blossom',
    icon: '🌸',
    desc: 'Hoa anh đào nở rộ, sắc hồng ngọt ngào tươi vui',
    isDark: false,
    colors: {
      primary: '#E05370',
      primaryHover: '#CC405D',
      primaryDark: '#B3324C',
      primaryText: '#FFFFFF',
      bgMain: '#FFF7F8',
      bgCard: '#FFFFFF',
      bgAlt: '#FDE8EB',
      bgTag: '#FBD5DB',
      border: '#F8BAC4',
      borderHover: '#F295A5',
      borderFocus: '#E05370',
      accentLight: '#FFF0F3',
      accentMuted: '#FCD0D8',
      accentBorder: '#F7A3B3',
      textMain: '#3D1F25',
      textMuted: '#825760',
      inputBg: '#FFFFFF',
      inputBorder: '#F8BAC4',
      ring: 'rgba(224, 83, 112, 0.35)',
      selectionBg: '#FCD0D8',
    },
  },
  {
    id: 'sky',
    name: 'Sky Blue',
    icon: '🌤️',
    desc: 'Biển xanh & bầu trời trong lành, thoáng đãng hiện đại',
    isDark: false,
    colors: {
      primary: '#1D78D6',
      primaryHover: '#1563B3',
      primaryDark: '#0F4F91',
      primaryText: '#FFFFFF',
      bgMain: '#F0F6FC',
      bgCard: '#FFFFFF',
      bgAlt: '#E0EEFA',
      bgTag: '#D3E7F8',
      border: '#BBD8F2',
      borderHover: '#8EC1EA',
      borderFocus: '#1D78D6',
      accentLight: '#EBF5FE',
      accentMuted: '#CEE5FB',
      accentBorder: '#95C8F5',
      textMain: '#122436',
      textMuted: '#4E657D',
      inputBg: '#FFFFFF',
      inputBorder: '#BBD8F2',
      ring: 'rgba(29, 120, 214, 0.35)',
      selectionBg: '#CEE5FB',
    },
  },
  {
    id: 'mono',
    name: 'Mono Minimalist',
    icon: '📓',
    desc: 'Trắng đen tối giản, đồ họa tương phản dứt khoát',
    isDark: false,
    colors: {
      primary: '#2B3240',
      primaryHover: '#1A202C',
      primaryDark: '#0F131A',
      primaryText: '#FFFFFF',
      bgMain: '#F5F6F8',
      bgCard: '#FFFFFF',
      bgAlt: '#E8EAEF',
      bgTag: '#DFE2E8',
      border: '#CCD1DB',
      borderHover: '#A1AAB8',
      borderFocus: '#2B3240',
      accentLight: '#F0F2F5',
      accentMuted: '#D8DCE3',
      accentBorder: '#B0B8C5',
      textMain: '#111620',
      textMuted: '#5B6474',
      inputBg: '#FFFFFF',
      inputBorder: '#CCD1DB',
      ring: 'rgba(43, 50, 64, 0.35)',
      selectionBg: '#D8DCE3',
    },
  },
];

export const getThemeById = (id: string): ThemeDefinition => {
  return APP_THEMES.find(t => t.id === id) || APP_THEMES[0];
};

/**
 * Apply theme variables directly to document root and body
 */
export const applyThemeToDom = (themeId: ThemeId) => {
  if (typeof document === 'undefined') return;

  const theme = getThemeById(themeId);
  const root = document.documentElement;
  const body = document.body;

  // Clear previous theme classes
  APP_THEMES.forEach(t => {
    root.classList.remove(`theme-${t.id}`);
    body.classList.remove(`theme-${t.id}`);
  });

  // Set attribute and class
  root.setAttribute('data-theme', theme.id);
  root.classList.add(`theme-${theme.id}`);
  body.classList.add(`theme-${theme.id}`);

  // Also set is-dark class helper
  if (theme.isDark) {
    root.classList.add('dark');
    body.classList.add('dark');
  } else {
    root.classList.remove('dark');
    body.classList.remove('dark');
  }

  // Set CSS variables directly on root so changes take effect immediately
  const c = theme.colors;
  root.style.setProperty('--w-bg-main', c.bgMain);
  root.style.setProperty('--w-bg-card', c.bgCard);
  root.style.setProperty('--w-bg-alt', c.bgAlt);
  root.style.setProperty('--w-bg-tag', c.bgTag);
  root.style.setProperty('--w-border', c.border);
  root.style.setProperty('--w-border-hover', c.borderHover);
  root.style.setProperty('--w-border-focus', c.borderFocus);
  root.style.setProperty('--w-accent-light', c.accentLight);
  root.style.setProperty('--w-accent-muted', c.accentMuted);
  root.style.setProperty('--w-accent-border', c.accentBorder);
  root.style.setProperty('--w-primary', c.primary);
  root.style.setProperty('--w-primary-dark', c.primaryDark);
  root.style.setProperty('--w-primary-hover', c.primaryHover);
  root.style.setProperty('--w-btn-text', c.primaryText);
  root.style.setProperty('--w-text-main', c.textMain);
  root.style.setProperty('--w-text-muted', c.textMuted);
  root.style.setProperty('--w-input-bg', c.inputBg);
  root.style.setProperty('--w-input-border', c.inputBorder);
  root.style.setProperty('--w-ring', c.ring);
  root.style.setProperty('--w-selection-bg', c.selectionBg);
};
