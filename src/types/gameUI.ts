/**
 * Types and interfaces for the Admin Game UI Editor / Live Game Designer
 * Config-driven, live-updatable presentation layer for games.
 */

export type ElementCategory = 'header' | 'stage' | 'question' | 'button' | 'scoreboard' | 'modal' | 'general';

export type ShadowPreset = 'none' | 'soft' | 'medium' | 'large' | 'glow-primary' | 'glow-amber' | 'glow-cyan' | 'neon';

export type BorderStyleType = 'solid' | 'dashed' | 'dotted' | 'none';

export type TextAlignType = 'left' | 'center' | 'right' | 'justify';

export type FontWeightType = 'normal' | '500' | '600' | '700' | '800' | '900';

export interface ElementUIStyle {
  id: string;
  name: string;
  category?: ElementCategory;
  customText?: string;
  
  // Sizing & Spacing
  width?: string;
  maxWidth?: string;
  height?: string;
  padding?: number; // px
  margin?: number; // px
  gap?: number; // px
  
  // Typography
  fontSize?: number; // px
  fontWeight?: FontWeightType;
  lineHeight?: number;
  textAlign?: TextAlignType;
  textColor?: string;
  
  // Colors & Background
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundOpacity?: number; // 0 - 100%
  
  // Borders & Corners
  borderRadius?: number; // px
  borderWidth?: number; // px
  borderColor?: string;
  borderStyle?: BorderStyleType;
  
  // Effects & Shadows
  boxShadow?: ShadowPreset | string;
  opacity?: number; // 0 - 100%
  scale?: number; // 0.8 - 1.5
  
  // Responsiveness
  visibleDesktop?: boolean;
  visibleMobile?: boolean;
}

export interface GameUIConfig {
  gameId: string;
  gameTitle?: string;
  themeOverride?: string;
  elements: Record<string, ElementUIStyle>;
  updatedAt?: string;
  updatedBy?: string;
  version?: number;
}

export type ViewportMode = 'responsive' | 'desktop-fhd' | 'laptop' | 'desktop-hd' | 'tablet' | 'mobile';

export interface ViewportSize {
  id: ViewportMode;
  label: string;
  icon: string;
  width: number | string;
  height: number | string;
  deviceLabel: string;
}

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  previewColor: string;
  style: Partial<ElementUIStyle>;
}
