import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  ChevronDown,
  Layers,
  Clock,
  ExternalLink
} from 'lucide-react';
import { apiManager } from '../../services/apiManager';
import { KeyPoolPublicState } from '../../types';

interface NavbarApiStatusProps {
  onOpenSelectModal: () => void;
  onOpenManagerModal: () => void;
}

export const NavbarApiStatus: React.FC<NavbarApiStatusProps> = ({
  onOpenManagerModal,
}) => {
  const [poolState, setPoolState] = useState<KeyPoolPublicState>(apiManager.getPoolState());
  const [isOpen, setIsOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = apiManager.subscribe(() => {
      setPoolState(apiManager.getPoolState());
    });
    setPoolState(apiManager.getPoolState());
    return unsub;
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const totalKeys = poolState.totalConfigured || poolState.keys.length;
  const activeKeys = poolState.keys.filter(k => k.status === 'ACTIVE').length;
  const cooldownKeys = poolState.cooldowns.length;

  const handleTestNow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTesting(true);
    try {
      await apiManager.testRotation("Test nhanh từ Navbar");
      setPoolState(apiManager.getPoolState());
    } catch (err) {
      console.error(err);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition border shadow-xs cursor-pointer ${
          totalKeys === 0
            ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 ring-2 ring-rose-400/20'
            : cooldownKeys > 0
            ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
            : 'bg-w-accent-light hover:bg-[#DDE8CA] text-w-text-main border-w-accent-border'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                totalKeys === 0 ? 'bg-rose-400' : cooldownKeys > 0 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                totalKeys === 0 ? 'bg-rose-500' : cooldownKeys > 0 ? 'bg-amber-500' : 'bg-emerald-600'
              }`}
            />
          </span>

          <Sparkles className="w-3.5 h-3.5 text-w-primary" />
        </div>

        <span className="hidden sm:inline font-black">
          {totalKeys === 0 ? 'Thiếu Key Pool' : `Key Pool: ${totalKeys} Keys`}
        </span>
        <span className="sm:hidden font-black">
          {totalKeys === 0 ? 'Thiếu Key' : `${totalKeys} Keys`}
        </span>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-w-border shadow-xl z-50 p-4 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-w-accent-light flex items-center justify-center text-w-text-main">
                  <Sparkles className="w-4 h-4 text-w-primary" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800">Vercel Gemini Key Pool</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Round-Robin & Auto Downgrade</p>
                </div>
              </div>

              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                totalKeys > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {totalKeys > 0 ? '🟢 Đang chạy' : '🔴 Cần cấu hình'}
              </span>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-w-bg-alt p-2 rounded-xl border border-w-border">
                <div className="text-[9px] font-bold text-slate-400 uppercase">Tổng Key</div>
                <div className="font-black text-slate-800 text-sm mt-0.5">{totalKeys}</div>
              </div>
              <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                <div className="text-[9px] font-bold text-emerald-700 uppercase">Thành Công</div>
                <div className="font-black text-emerald-700 text-sm mt-0.5">{poolState.stats?.totalSuccess || 0}</div>
              </div>
              <div className="bg-amber-50 p-2 rounded-xl border border-amber-200">
                <div className="text-[9px] font-bold text-amber-700 uppercase">Xoay 429</div>
                <div className="font-black text-amber-700 text-sm mt-0.5">{poolState.stats?.rotate429Count || 0}</div>
              </div>
            </div>

            {/* Last Used Model */}
            <div className="bg-w-bg-alt p-2.5 rounded-xl border border-w-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Layers className="w-3.5 h-3.5 text-w-primary" />
                <span className="text-[11px] font-bold">Model vừa dùng:</span>
              </div>
              <span className="font-mono font-extrabold text-purple-700 text-[11px]">
                {poolState.lastUsedModel || 'gemini-3.7-flash'}
              </span>
            </div>

            {/* Cooldown notice if any */}
            {poolState.cooldowns.length > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Có <strong>{poolState.cooldowns.length}</strong> mục đang tạm nghỉ (cách ly 429).</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-1 flex items-center gap-2">
              <button
                onClick={handleTestNow}
                disabled={isTesting || totalKeys === 0}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Zap className={`w-3.5 h-3.5 ${isTesting ? 'animate-bounce' : ''}`} />
                <span>{isTesting ? 'Đang test...' : 'Test Xoay Key'}</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenManagerModal();
                }}
                className="flex-1 py-2 bg-w-primary hover:bg-w-primary-hover text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Xem Chi Tiết Pool</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
