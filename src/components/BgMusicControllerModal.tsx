import React, { useState, useEffect } from 'react';
import { Music, Play, Pause, Volume2, VolumeX, X, Radio, Disc } from 'lucide-react';
import { bgMusicManager, BG_MUSIC_TRACKS } from '../utils/bgMusic';

interface BgMusicControllerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BgMusicControllerModal: React.FC<BgMusicControllerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [musicState, setMusicState] = useState(bgMusicManager.getStatus());

  useEffect(() => {
    const unsub = bgMusicManager.subscribe(() => {
      setMusicState(bgMusicManager.getStatus());
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-[#FFFDF5] border border-[#DED5B8] rounded-[24px] shadow-[0_16px_40px_rgba(79,104,60,0.18)] w-full max-w-md overflow-hidden wey-paper-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#E9F0D9] border-b border-[#D8E6C3] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#4F683C] text-[#FFFDF5] flex items-center justify-center shadow-xs">
              <Music className={`w-5 h-5 ${musicState.isPlaying ? 'animate-bounce' : ''}`} />
            </div>
            <div>
              <h3 className="font-[800] text-[#35452E] text-base leading-tight">
                Nhạc Nền Thư Giãn
              </h3>
              <p className="text-[11px] font-[700] text-[#637357]">
                Tự động lặp lại khi ở chế độ chờ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white hover:bg-rose-50 text-[#74806B] hover:text-rose-600 border border-[#DED5B8] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Main Control Banner */}
          <div className="bg-[#F8F4E8] rounded-2xl p-4 border border-[#E8DFCA] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${
                musicState.isPlaying ? 'bg-[#4F683C] animate-spin [animation-duration:4s]' : 'bg-slate-400'
              }`}>
                <Disc className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-[800] text-[#35452E] truncate">
                  {musicState.currentTrack.name}
                </div>
                <div className="text-[10px] font-[600] text-[#74806B] truncate">
                  {musicState.currentTrack.description}
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${musicState.isPlaying ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                  <span className="text-[10px] font-bold text-[#4F683C]">
                    {musicState.isPlaying ? 'Đang phát lặp lại' : 'Đang tạm dừng'}
                  </span>
                </div>
              </div>
            </div>

            {/* Play / Pause Toggle Button */}
            <button
              onClick={() => bgMusicManager.togglePlay()}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition transform hover:scale-105 active:scale-95 cursor-pointer shrink-0 ${
                musicState.isPlaying ? 'bg-[#D96B6B] hover:bg-[#C85656]' : 'bg-[#4F683C] hover:bg-[#3E522F]'
              }`}
              title={musicState.isPlaying ? 'Tạm dừng nhạc' : 'Phát nhạc nền'}
            >
              {musicState.isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
            </button>
          </div>

          {/* Volume Control */}
          <div className="bg-white rounded-2xl p-3.5 border border-[#E5DEC7] space-y-2">
            <div className="flex items-center justify-between text-xs font-[700] text-[#4F683C]">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4" />
                Âm lượng nhạc nền
              </span>
              <span>{Math.round(musicState.volume * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => bgMusicManager.toggleMute()}
                className="text-[#74806B] hover:text-[#4F683C] transition"
              >
                {musicState.isMuted || musicState.volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-500" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicState.isMuted ? 0 : musicState.volume}
                onChange={(e) => bgMusicManager.setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#E9F0D9] rounded-lg appearance-none cursor-pointer accent-[#4F683C]"
              />
            </div>
          </div>

          {/* Playlist Track Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-[800] text-[#4F683C] uppercase tracking-wider block px-1">
              Danh sách bài nhạc (public/assets/nhacnen/)
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
              {BG_MUSIC_TRACKS.map((track, idx) => {
                const isSelected = musicState.currentTrackIndex === idx;
                return (
                  <button
                    key={track.id}
                    onClick={() => bgMusicManager.setTrack(idx)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#E9F0D9] border-[#A8C68A] text-[#35452E] shadow-2xs'
                        : 'bg-white hover:bg-[#F8F4E8] border-[#E8DFCA] text-[#4D5A46]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-[800] shrink-0 ${
                        isSelected ? 'bg-[#4F683C] text-white' : 'bg-[#E9F0D9] text-[#4F683C]'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-[800] truncate">{track.name}</div>
                        <div className="text-[10px] text-[#74806B] truncate">{track.description}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <Radio className="w-4 h-4 text-[#4F683C] fill-[#4F683C] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#F8F4E8] border-t border-[#E8DFCA] px-5 py-3 flex items-center justify-between text-[11px] text-[#74806B]">
          <span>Gợi ý: Thêm file mp3 vào thư mục <code className="bg-white px-1 py-0.5 rounded border text-[10px]">nhacnen</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#4F683C] hover:bg-[#3E522F] text-white font-[800] rounded-xl transition cursor-pointer shadow-2xs"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
};
