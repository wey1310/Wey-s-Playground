import React from 'react';
import { Sparkles, Database, Volume2, VolumeX } from 'lucide-react';
import type { GameId } from "../types";

interface NavbarProps {
  onOpenBankManager: () => void;
  onOpenAiGenerator: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  activeGameId: GameId | null;
  onSelectGame: (gameId: GameId) => void;
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenBankManager,
  onOpenAiGenerator,
  soundEnabled,
  onToggleSound,
  onGoHome,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Logo */}
        <div 
          onClick={onGoHome} 
          className="flex items-center gap-3 cursor-pointer group hover:opacity-95 transition"
        >
          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md group-hover:scale-105 transition transform flex-shrink-0 bg-white p-0.5">
            <img src="/assets/Picture1.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-extrabold text-lg sm:text-xl text-emerald-400 leading-tight">
              WEY'S PLAYGROUND
            </h1>
            <p className="text-xs text-pink-300 font-medium">Kho Game Online Sinh Động Của Wey</p>
          </div>
          <img 
            src="/assets/Picture2.png" 
            alt="Chibi Wey" 
            className="h-10 w-10 object-cover rounded-full hidden sm:block animate-bounce ml-2 drop-shadow-md border-2 border-white/20"
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
          {/* AI Generator Button */}
          <button
            onClick={onOpenAiGenerator}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-[#6B8E5C] hover:bg-[#58784B] text-amber-50 font-bold text-xs sm:text-sm shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 border border-[#547245]"
          >
            <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
            <span>Tạo Bằng AI</span>
          </button>
          {/* Question Bank Manager */}
          <button
            onClick={onOpenBankManager}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-[#8FA87B] hover:bg-[#7A9367] text-white font-bold text-xs sm:text-sm shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 border border-[#728A61]"
          >
            <Database className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Cấu Hình</span>
            <span className="sm:hidden">Cấu Hình</span>
          </button>
          {/* Audio Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
            className={`p-2 rounded-xl border transition ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                : 'bg-rose-950/40 border-rose-800 text-rose-400 hover:bg-rose-900/50'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
