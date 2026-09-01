import React from 'react';
import { useGameUI } from '../../contexts/GameUIContext';
import { useAuth } from '../../contexts/AuthContext';

interface GameUIElementProps {
  id: string;
  gameId: string;
  defaultName?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  onClick?: (e: React.MouseEvent) => void;
  [key: string]: any;
}

export const GameUIElement: React.FC<GameUIElementProps> = ({
  id,
  gameId,
  defaultName,
  className = '',
  style = {},
  children,
  as: Component = 'div',
  onClick,
  ...rest
}) => {
  const {
    getElementComputedStyle,
    isElementVisible,
    isEditorOpen,
    activeEditorGameId,
    selectedElementId,
    setSelectedElementId,
    hoveredElementId,
    setHoveredElementId,
    isPreviewMode,
    currentConfig,
  } = useGameUI();

  const { isAdmin } = useAuth();

  const isCurrentGameInEditor =
    isEditorOpen &&
    !isPreviewMode &&
    isAdmin &&
    activeEditorGameId.toLowerCase() === gameId.toLowerCase();

  const isSelected = isCurrentGameInEditor && selectedElementId === id;
  const isHovered = isCurrentGameInEditor && hoveredElementId === id && !isSelected;

  const isVisible = isElementVisible(gameId, id);

  if (!isVisible && !isCurrentGameInEditor) {
    return null;
  }

  // Get dynamic custom style configured by Admin
  const computedStyle = getElementComputedStyle(gameId, id, style);

  // Element label from config or defaultName
  const elemName = currentConfig?.elements?.[id]?.name || defaultName || id;

  const handleClick = (e: React.MouseEvent) => {
    if (isCurrentGameInEditor) {
      e.stopPropagation();
      e.preventDefault();
      setSelectedElementId(id);
    }
    if (onClick) {
      onClick(e);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (isCurrentGameInEditor) {
      e.stopPropagation();
      setHoveredElementId(id);
    }
  };

  const handleMouseLeave = () => {
    if (isCurrentGameInEditor && hoveredElementId === id) {
      setHoveredElementId(null);
    }
  };

  // Compose dynamic class names for editor feedback
  const editorClasses = isCurrentGameInEditor
    ? `relative cursor-pointer transition-all duration-150 ${
        isSelected
          ? 'outline-2 outline-amber-400 outline-offset-2 shadow-[0_0_15px_rgba(251,191,36,0.5)] z-30 ring-2 ring-amber-400/40'
          : isHovered
          ? 'outline-2 outline-dashed outline-sky-400 outline-offset-1 z-20'
          : 'hover:outline-1 hover:outline-dashed hover:outline-sky-400/70'
      }`
    : '';

  return (
    <Component
      className={`${className} ${editorClasses}`}
      style={computedStyle}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-game-element-id={id}
      {...rest}
    >
      {/* Editor Badge Tag */}
      {isCurrentGameInEditor && (isSelected || isHovered) && (
        <span
          className={`absolute -top-3.5 left-2 px-2 py-0.5 text-[10px] font-bold rounded-md shadow-md z-40 pointer-events-none flex items-center gap-1 select-none whitespace-nowrap ${
            isSelected
              ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-300 animate-pulse'
              : 'bg-sky-600 text-white'
          }`}
        >
          <span>🏷️</span>
          <span>{elemName}</span>
        </span>
      )}
      {children}
    </Component>
  );
};
