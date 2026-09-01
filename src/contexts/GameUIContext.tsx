import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ElementUIStyle, GameUIConfig, ShadowPreset, ViewportMode } from '../types/gameUI';
import {
  getGameUIConfigSync,
  loadGameUIConfig,
  saveGameUIConfig,
  resetGameUIConfig,
  createDefaultGameUIConfig,
} from '../lib/gameUIPersistence';
import { getDefaultElementsForGame, STYLE_PRESETS } from '../data/gameUIDefaults';
import { useAuth } from './AuthContext';

interface GameUIContextType {
  // General Game Presentation Lookup
  getElementComputedStyle: (
    gameId: string,
    elementId: string,
    fallbackStyle?: React.CSSProperties
  ) => React.CSSProperties;
  getElementText: (gameId: string, elementId: string, fallbackText: string) => string;
  isElementVisible: (gameId: string, elementId: string, isMobile?: boolean) => boolean;

  // Editor State
  isEditorOpen: boolean;
  activeEditorGameId: string;
  openEditor: (gameId: string) => void;
  closeEditor: () => void;

  // Editor Actions & Selections
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  hoveredElementId: string | null;
  setHoveredElementId: (id: string | null) => void;
  viewportMode: ViewportMode;
  setViewportMode: (mode: ViewportMode) => void;
  isPreviewMode: boolean;
  setIsPreviewMode: (val: boolean) => void;

  // Active Draft Config
  currentConfig: GameUIConfig | null;
  updateElementStyle: (elementId: string, updates: Partial<ElementUIStyle>) => void;
  resetElementStyle: (elementId: string) => void;
  applyPresetToElement: (elementId: string, presetId: string) => void;
  resetAllGameStyles: () => Promise<void>;

  // Undo / Redo
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  // Persistence status
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  saveNow: () => Promise<boolean>;
}

const GameUIContext = createContext<GameUIContextType | null>(null);

function resolveThemeColor(color?: string): string | undefined {
  if (!color) return undefined;
  if (color.startsWith('theme:')) {
    const token = color.replace('theme:', '');
    switch (token) {
      case 'primary':
        return 'var(--color-primary, #6366f1)';
      case 'secondary':
        return 'var(--color-secondary, #ec4899)';
      case 'accent':
        return 'var(--color-accent, #f59e0b)';
      case 'background':
        return 'var(--color-bg, #0f172a)';
      case 'card':
        return 'var(--color-card, #1e293b)';
      case 'text':
        return 'var(--color-text, #f8fafc)';
      case 'muted':
        return 'var(--color-muted, #94a3b8)';
      case 'border':
        return 'var(--color-border, #334155)';
      case 'success':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'danger':
        return '#ef4444';
      default:
        return undefined;
    }
  }
  return color;
}

function resolveShadow(shadow?: ShadowPreset | string): string | undefined {
  if (!shadow || shadow === 'none') return undefined;
  switch (shadow) {
    case 'soft':
      return '0 2px 8px -1px rgba(0, 0, 0, 0.1), 0 1px 4px -1px rgba(0, 0, 0, 0.06)';
    case 'medium':
      return '0 4px 14px -2px rgba(0, 0, 0, 0.18), 0 2px 6px -2px rgba(0, 0, 0, 0.12)';
    case 'large':
      return '0 12px 28px -4px rgba(0, 0, 0, 0.25), 0 4px 10px -2px rgba(0, 0, 0, 0.15)';
    case 'glow-primary':
      return '0 0 24px rgba(99, 102, 241, 0.65)';
    case 'glow-amber':
      return '0 0 28px rgba(245, 158, 11, 0.75)';
    case 'glow-cyan':
      return '0 0 24px rgba(6, 182, 212, 0.7)';
    case 'neon':
      return '0 0 10px #38bdf8, 0 0 25px rgba(56, 189, 248, 0.4)';
    default:
      return shadow;
  }
}

export const GameUIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();

  // Active configurations in memory
  const [configs, setConfigs] = useState<Record<string, GameUIConfig>>({});

  // Editor states
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [activeEditorGameId, setActiveEditorGameId] = useState<string>('lucky_star');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [viewportMode, setViewportMode] = useState<ViewportMode>('responsive');
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);

  // Undo / Redo stacks for the active editor session
  const [undoStack, setUndoStack] = useState<GameUIConfig[]>([]);
  const [redoStack, setRedoStack] = useState<GameUIConfig[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Auto-save debounce timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or fetch game config
  const ensureGameConfig = useCallback(async (gameId: string) => {
    const cleanId = gameId.toLowerCase().trim();
    if (!configs[cleanId]) {
      const loaded = await loadGameUIConfig(cleanId);
      setConfigs((prev) => ({ ...prev, [cleanId]: loaded }));
    }
  }, [configs]);

  // Open editor for a game
  const openEditor = useCallback((gameId: string) => {
    const cleanId = gameId.toLowerCase().trim();
    setActiveEditorGameId(cleanId);
    ensureGameConfig(cleanId);

    // Initial selected element
    const defElements = getDefaultElementsForGame(cleanId);
    if (defElements.length > 0) {
      setSelectedElementId(defElements[0].id);
    } else {
      setSelectedElementId(null);
    }

    setUndoStack([]);
    setRedoStack([]);
    setHasUnsavedChanges(false);
    setIsPreviewMode(false);
    setIsEditorOpen(true);
  }, [ensureGameConfig]);

  const closeEditor = useCallback(() => {
    setIsEditorOpen(false);
    setSelectedElementId(null);
    setHoveredElementId(null);
  }, []);

  const currentConfig: GameUIConfig | null =
    configs[activeEditorGameId] || getGameUIConfigSync(activeEditorGameId);

  // Save current config
  const saveNow = useCallback(async (): Promise<boolean> => {
    if (!currentConfig || !activeEditorGameId) return false;
    setIsSaving(true);
    try {
      const res = await saveGameUIConfig(activeEditorGameId, currentConfig, user?.email || undefined);
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date().toLocaleTimeString('vi-VN'));
      setIsSaving(false);
      return res.success;
    } catch (e) {
      console.warn('saveNow failed:', e);
      setIsSaving(false);
      return false;
    }
  }, [currentConfig, activeEditorGameId, user]);

  // Debounced auto-save effect
  useEffect(() => {
    if (hasUnsavedChanges && isEditorOpen && currentConfig) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        saveNow();
      }, 1200);
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [hasUnsavedChanges, isEditorOpen, currentConfig, saveNow]);

  // Update element style with Undo tracking
  const updateElementStyle = useCallback(
    (elementId: string, updates: Partial<ElementUIStyle>) => {
      if (!currentConfig) return;

      // Push current to undo stack
      setUndoStack((prev) => [...prev.slice(-20), JSON.parse(JSON.stringify(currentConfig))]);
      setRedoStack([]); // Clear redo stack on new edit

      const currentElem = currentConfig.elements[elementId] || { id: elementId, name: elementId };
      const updatedElem = { ...currentElem, ...updates };

      const updatedConfig: GameUIConfig = {
        ...currentConfig,
        elements: {
          ...currentConfig.elements,
          [elementId]: updatedElem,
        },
      };

      setConfigs((prev) => ({
        ...prev,
        [activeEditorGameId]: updatedConfig,
      }));
      setHasUnsavedChanges(true);
    },
    [currentConfig, activeEditorGameId]
  );

  // Apply a preset to an element
  const applyPresetToElement = useCallback(
    (elementId: string, presetId: string) => {
      const preset = STYLE_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        updateElementStyle(elementId, preset.style);
      }
    },
    [updateElementStyle]
  );

  // Reset a single element style to its system default
  const resetElementStyle = useCallback(
    (elementId: string) => {
      const defaults = getDefaultElementsForGame(activeEditorGameId);
      const def = defaults.find((d) => d.id === elementId);
      if (def) {
        updateElementStyle(elementId, { ...def });
      } else {
        updateElementStyle(elementId, {
          fontSize: undefined,
          textColor: undefined,
          backgroundColor: undefined,
          borderWidth: undefined,
          borderColor: undefined,
          borderRadius: undefined,
          boxShadow: undefined,
          padding: undefined,
          margin: undefined,
          customText: undefined,
        });
      }
    },
    [activeEditorGameId, updateElementStyle]
  );

  // Reset all game styles to default
  const resetAllGameStyles = useCallback(async () => {
    if (!activeEditorGameId) return;
    const fresh = createDefaultGameUIConfig(activeEditorGameId);
    setConfigs((prev) => ({
      ...prev,
      [activeEditorGameId]: fresh,
    }));
    await resetGameUIConfig(activeEditorGameId);
    setUndoStack([]);
    setRedoStack([]);
    setHasUnsavedChanges(false);
  }, [activeEditorGameId]);

  // Undo action
  const undo = useCallback(() => {
    if (undoStack.length === 0 || !currentConfig) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, JSON.parse(JSON.stringify(currentConfig))]);
    setUndoStack((u) => u.slice(0, -1));
    setConfigs((prevMap) => ({
      ...prevMap,
      [activeEditorGameId]: prev,
    }));
    setHasUnsavedChanges(true);
  }, [undoStack, currentConfig, activeEditorGameId]);

  // Redo action
  const redo = useCallback(() => {
    if (redoStack.length === 0 || !currentConfig) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, JSON.parse(JSON.stringify(currentConfig))]);
    setRedoStack((r) => r.slice(0, -1));
    setConfigs((prevMap) => ({
      ...prevMap,
      [activeEditorGameId]: next,
    }));
    setHasUnsavedChanges(true);
  }, [redoStack, currentConfig, activeEditorGameId]);

  // Compute inline style for any element in any game
  const getElementComputedStyle = useCallback(
    (
      gameId: string,
      elementId: string,
      fallbackStyle?: React.CSSProperties
    ): React.CSSProperties => {
      const cleanId = gameId.toLowerCase().trim();
      const cfg = configs[cleanId] || getGameUIConfigSync(cleanId);
      const elem = cfg?.elements?.[elementId];

      if (!elem) {
        return fallbackStyle || {};
      }

      const style: React.CSSProperties = { ...fallbackStyle };

      if (elem.fontSize !== undefined) style.fontSize = `${elem.fontSize}px`;
      if (elem.fontWeight !== undefined) style.fontWeight = elem.fontWeight;
      if (elem.lineHeight !== undefined) style.lineHeight = elem.lineHeight;
      if (elem.textAlign !== undefined) style.textAlign = elem.textAlign;
      if (elem.textColor) style.color = resolveThemeColor(elem.textColor);

      if (elem.backgroundColor) {
        style.backgroundColor = resolveThemeColor(elem.backgroundColor);
      }
      if (elem.backgroundImage) {
        style.backgroundImage = `url(${elem.backgroundImage})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
      }

      if (elem.padding !== undefined) style.padding = `${elem.padding}px`;
      if (elem.margin !== undefined) style.margin = `${elem.margin}px`;
      if (elem.gap !== undefined) style.gap = `${elem.gap}px`;

      if (elem.borderRadius !== undefined) style.borderRadius = `${elem.borderRadius}px`;
      if (elem.borderWidth !== undefined) {
        style.borderWidth = `${elem.borderWidth}px`;
        style.borderStyle = elem.borderStyle || 'solid';
        if (elem.borderColor) {
          style.borderColor = resolveThemeColor(elem.borderColor);
        }
      }

      if (elem.boxShadow) {
        const shadowVal = resolveShadow(elem.boxShadow);
        if (shadowVal) style.boxShadow = shadowVal;
      }

      if (elem.opacity !== undefined) style.opacity = elem.opacity / 100;
      if (elem.width) style.width = elem.width;
      if (elem.maxWidth) style.maxWidth = elem.maxWidth;
      if (elem.height) style.height = elem.height;
      if (elem.scale !== undefined) style.transform = `scale(${elem.scale})`;

      return style;
    },
    [configs]
  );

  // Return customized text or fallback
  const getElementText = useCallback(
    (gameId: string, elementId: string, fallbackText: string): string => {
      const cleanId = gameId.toLowerCase().trim();
      const cfg = configs[cleanId] || getGameUIConfigSync(cleanId);
      const elem = cfg?.elements?.[elementId];
      return elem?.customText?.trim() ? elem.customText : fallbackText;
    },
    [configs]
  );

  // Return visibility status
  const isElementVisible = useCallback(
    (gameId: string, elementId: string, isMobile = false): boolean => {
      const cleanId = gameId.toLowerCase().trim();
      const cfg = configs[cleanId] || getGameUIConfigSync(cleanId);
      const elem = cfg?.elements?.[elementId];
      if (!elem) return true;
      if (isMobile && elem.visibleMobile === false) return false;
      if (!isMobile && elem.visibleDesktop === false) return false;
      return true;
    },
    [configs]
  );

  return (
    <GameUIContext.Provider
      value={{
        getElementComputedStyle,
        getElementText,
        isElementVisible,
        isEditorOpen,
        activeEditorGameId,
        openEditor,
        closeEditor,
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
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        undo,
        redo,
        hasUnsavedChanges,
        isSaving,
        lastSavedAt,
        saveNow,
      }}
    >
      {children}
    </GameUIContext.Provider>
  );
};

export const useGameUI = () => {
  const context = useContext(GameUIContext);
  if (!context) {
    throw new Error('useGameUI must be used within a GameUIProvider');
  }
  return context;
};
