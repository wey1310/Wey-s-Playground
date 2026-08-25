import React, { useState, useEffect, useRef } from 'react';
import { Music, Play, Pause, Volume2, VolumeX, X, Radio, Disc, Upload, Trash2, CheckCircle2 } from 'lucide-react';
import { bgMusicManager } from '../utils/bgMusic';

interface BgMusicControllerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BgMusicControllerModal: React.FC<BgMusicControllerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [musicState, setMusicState] = useState(bgMusicManager.getStatus());
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = bgMusicManager.subscribe(() => {
      setMusicState(bgMusicManager.getStatus());
    });
    return unsub;
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.wav') || file.name.endsWith('.m4a') || file.name.endsWith('.ogg')) {
        const track = await bgMusicManager.addCustomTrack(file);
        setUploadSuccess(`Đã thêm bài hát: ${track.name}`);
        setTimeout(() => setUploadSuccess(null), 3000);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-[#FFFDF5] border border-[#DED5B8] rounded-[24px] shadow-[0_16px_40px_rgba(79,104,60,0.18)] w-full max-w-md overflow-hidden wey-paper-card flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#E9F0D9] border-b border-[#D8E6C3] px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#4F683C] text-[#FFFDF5] flex items-center justify-center shadow-xs">
              <Music className={`w-5 h-5 ${musicState.isPlaying ? 'animate-bounce' : ''}`} />
            </div>
            <div>
              <h3 className="font-[800] text-[#35452E] text-base leading-tight">
                Nhạc Nền Trò Chơi & Lớp Học
              </h3>
              <p className="text-[11px] font-[700] text-[#637357]">
                Tự động lặp lại, hỗ trợ tải file MP3 từ máy tính
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
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Upload alert if any */}
          {uploadSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

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
                  {musicState.currentTrack?.name || 'Chưa chọn bài'}
                </div>
                <div className="text-[10px] font-[600] text-[#74806B] truncate">
                  {musicState.currentTrack?.description || ''}
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

          {/* Add Custom MP3 File Button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-[#4F683C] to-[#3E522F] hover:brightness-110 text-white font-[800] text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Tải file MP3 / Nhạc từ máy tính của bạn</span>
            </button>
            <p className="text-[10px] text-[#74806B] text-center mt-1">
              Hỗ trợ file .mp3, .wav, .m4a. Nhạc tải lên sẽ được lưu trong trình duyệt của bạn.
            </p>
          </div>

          {/* Playlist Track Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-[800] text-[#4F683C] uppercase tracking-wider block">
                Danh sách bài nhạc ({musicState.tracks.length})
              </label>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1">
              {musicState.tracks.map((track, idx) => {
                const isSelected = musicState.currentTrackIndex === idx;
                return (
                  <div
                    key={track.id}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-[#E9F0D9] border-[#A8C68A] text-[#35452E] shadow-2xs'
                        : 'bg-white hover:bg-[#F8F4E8] border-[#E8DFCA] text-[#4D5A46]'
                    }`}
                  >
                    <button
                      onClick={() => bgMusicManager.setTrack(idx)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-[800] shrink-0 ${
                        isSelected ? 'bg-[#4F683C] text-white' : 'bg-[#E9F0D9] text-[#4F683C]'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-[800] truncate">{track.name}</span>
                          {track.isCustom && (
                            <span className="text-[9px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.2 rounded-full">
                              Tải lên
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#74806B] truncate">{track.description}</div>
                      </div>
                    </button>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {track.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            bgMusicManager.removeCustomTrack(track.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition"
                          title="Xóa bài nhạc này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isSelected && (
                        <Radio className="w-4 h-4 text-[#4F683C] fill-[#4F683C]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#F8F4E8] border-t border-[#E8DFCA] px-5 py-3 flex items-center justify-between text-[11px] text-[#74806B] shrink-0">
          <span>Gợi ý: Thầy cô có thể tải bài hát trực tiếp ở nút trên</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#4F683C] hover:bg-[#3E522F] text-white font-[800] rounded-xl transition cursor-pointer shadow-2xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
