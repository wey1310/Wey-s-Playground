import React from 'react';
import { Database, Volume2, VolumeX } from 'lucide-react';
import type { GameId } from "../types";

interface NavbarProps {
  onOpenBankManager: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  activeGameId: GameId | null;
  onSelectGame: (gameId: GameId) => void;
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenBankManager,
  soundEnabled,
  onToggleSound,
  onGoHome,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-w-bg-card/90 backdrop-blur-md border-b border-w-border text-w-text-main shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Logo */}
        <div 
          onClick={onGoHome} 
          className="flex items-center gap-3 cursor-pointer group hover:opacity-95 transition"
        >
          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm group-hover:scale-105 transition transform flex-shrink-0 bg-white p-0.5 border border-w-border">
            <img src="/assets/Picture1.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-extrabold text-lg sm:text-xl text-w-primary-dark leading-tight">
              WEY'S PLAYGROUND
            </h1>
            <p className="text-xs text-w-text-muted font-medium">Kho Game Online Sinh Động Của Wey</p>
          </div>
          <img 
            src="/assets/Picture2.png" 
            alt="Chibi Wey" 
            className="h-10 w-10 object-cover rounded-full hidden sm:block animate-bounce ml-2 drop-shadow-md border-2 border-w-accent-light"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.endsWith('/assets/hamster.jpg')) {
                target.src = '/assets/hamster.jpg';
              }
            }}
          />
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Question Bank Manager */}
          <button
            onClick={onOpenBankManager}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-w-accent-muted hover:bg-w-accent-border text-w-text-main font-bold text-xs sm:text-sm shadow-sm transition transform hover:-translate-y-0.5 active:translate-y-0 border border-w-accent-border"
          >
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Cấu Hình</span>
            <span className="sm:hidden">Cấu Hình</span>
          </button>

          {/* Audio Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
            className={`p-2 rounded-xl border transition ${
              soundEnabled
                ? 'bg-w-bg-alt border-w-border text-w-primary-dark hover:bg-w-accent-light'
                : 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
