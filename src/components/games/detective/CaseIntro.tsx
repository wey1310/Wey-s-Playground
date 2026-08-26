import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  MapPin, 
  UserX, 
  AlertTriangle, 
  FileText, 
  Fingerprint, 
  ChevronRight, 
  ShieldAlert, 
  Clock, 
  Sparkles, 
  Users, 
  Flame, 
  Eye, 
  Volume2, 
  VolumeX,
  Compass,
  KeyRound,
  CheckCircle2,
  X
} from 'lucide-react';
import { DetectiveCase, Suspect } from './caseTypes';
import { soundFx } from '../../../utils/audio';

interface CaseIntroProps {
  currentCase: DetectiveCase;
  onStartInvestigation: () => void;
  onClose?: () => void;
  isReviewMode?: boolean; // When opened mid-game from the toolbar
}

export const CaseIntro: React.FC<CaseIntroProps> = ({
  currentCase,
  onStartInvestigation,
  onClose,
  isReviewMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<'briefing' | 'victim' | 'suspects' | 'protocol'>('briefing');
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);

  const handleStart = () => {
    soundFx.powerup();
    onStartInvestigation();
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'easy':
        return { label: 'Độ Khó: Dễ (Nhiều Manh Mối)', bg: 'bg-emerald-950 text-emerald-300 border-emerald-500/50' };
      case 'hard':
        return { label: 'Độ Khó: Khó (Ẩn Đố Sâu)', bg: 'bg-rose-950 text-rose-300 border-rose-500/50' };
      default:
        return { label: 'Độ Khó: Vừa (Tiêu Chuẩn)', bg: 'bg-amber-950 text-amber-600 border-amber-500/50' };
    }
  };

  const diffBadge = getDifficultyBadge(currentCase.difficulty);

  return (
    <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Vignette & Atmospheric Glow Background */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-950/20 via-black/80 to-black opacity-90" />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative w-full max-w-4xl bg-[#140e0a] border-2 border-amber-500/60 rounded-3xl shadow-2xl overflow-hidden text-amber-50 my-auto flex flex-col max-h-[92vh] z-10"
      >
        {/* Top Confidential Header Bar */}
        <div className="bg-gradient-to-r from-amber-950 via-[#1f1610] to-black px-5 py-3.5 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 font-mono">
              HỒ SƠ BÁO CÁO HIỆN TRƯỜNG • TOP SECRET
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diffBadge.bg}`}>
              {diffBadge.label}
            </span>

            {isReviewMode && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-w-text-main transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Cinematic Case Title & Dramatic Stamp Banner */}
        <div className="relative p-5 sm:p-7 border-b border-amber-900/40 bg-gradient-to-b from-amber-950/40 via-transparent to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-900 border-2 border-amber-400 flex items-center justify-center text-3xl sm:text-4xl shadow-xl shrink-0">
                {currentCase.coverIcon || '🔎'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 border border-amber-500/40">
                    VỤ ÁN SỐ #{currentCase.id.toUpperCase().slice(0, 8)}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/40">
                    {currentCase.badge}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-amber-100 tracking-tight leading-snug">
                  {currentCase.title}
                </h1>
                <p className="text-xs sm:text-sm text-amber-200/80 italic font-serif leading-relaxed">
                  "{currentCase.subtitle}"
                </p>
              </div>
            </div>

            {/* Stamp visual */}
            <div className="hidden md:flex flex-col items-center justify-center px-4 py-2 rounded-xl border-2 border-red-600/70 bg-red-950/30 rotate-[-6deg] shadow-lg shrink-0">
              <span className="text-xs font-black text-red-400 uppercase tracking-widest font-mono">
                ĐANG PHÁ ÁN
              </span>
              <span className="text-[9px] text-red-300 font-mono">CONAN DEDUCTION</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 mt-5 border-t border-amber-900/40 pt-3 overflow-x-auto custom-scrollbar">
            {[
              { id: 'briefing', label: 'Tóm Tắt & Kịch Tính', icon: AlertTriangle },
              { id: 'victim', label: 'Nạn Nhân & Hiện Trường', icon: MapPin },
              { id: 'suspects', label: 'Nghi Phạm Ban Đầu', icon: Users },
              { id: 'protocol', label: 'Quy Trình Phá Án', icon: Fingerprint }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setActiveTab(tab.id as any);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-black shadow-md font-black'
                      : 'bg-zinc-900/80 text-amber-200/70 hover:bg-zinc-800 hover:text-amber-100 border border-amber-900/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Body Content based on Tab */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 custom-scrollbar bg-[#110c08]">
          {/* TAB 1: BRIEFING & DRAMATIC HOOK */}
          {activeTab === 'briefing' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Dramatic Hook Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/70 via-amber-900/30 to-black border-2 border-amber-500/40 shadow-xl relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 opacity-10 text-9xl pointer-events-none select-none">
                  🕵️
                </div>
                <div className="flex items-center gap-2 text-amber-600 text-xs font-black uppercase tracking-wider mb-2">
                  <Flame className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span>Móc Xích Kịch Tính (Dramatic Case Hook)</span>
                </div>
                <p className="text-sm sm:text-base text-amber-100 font-serif italic leading-relaxed">
                  "{currentCase.synopsis}"
                </p>
              </div>

              {/* Crime Scene & Location Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-amber-900/50 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span>Địa Điểm Gây Án:</span>
                  </div>
                  <h4 className="text-sm font-black text-amber-100">
                    {currentCase.crimeSceneName}
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                    {currentCase.crimeSceneDescription}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-amber-900/50 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                    <UserX className="w-4 h-4 text-rose-400" />
                    <span>Nạn Nhân Vụ Án:</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-950 border border-rose-600/40 flex items-center justify-center text-xl shrink-0">
                      {currentCase.victim.avatar || '👤'}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-rose-100">
                        {currentCase.victim.name}
                      </h4>
                      <p className="text-[11px] text-zinc-400 font-medium">
                        {currentCase.victim.title}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-amber-200/90 leading-relaxed font-sans bg-rose-950/20 p-2 rounded-xl border border-rose-900/30">
                    ⚠️ <strong>Tình trạng:</strong> {currentCase.victim.incidentType}
                  </p>
                </div>
              </div>

              {/* Key Detective Objectives */}
              <div className="p-4 rounded-2xl bg-[#19110b] border border-amber-700/40 space-y-2.5">
                <h4 className="text-xs font-black uppercase text-amber-600 flex items-center gap-2 tracking-wider">
                  <Compass className="w-4 h-4" />
                  <span>3 Mục Tiêu Then Chốt Để Phá Án Thành Công:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-amber-900/40 flex items-start gap-2">
                    <span className="text-amber-600 font-black">1.</span>
                    <span className="text-zinc-200">Khám nghiệm vật chứng & giải mã câu hỏi kiến thức mở khóa manh mối.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-amber-900/40 flex items-start gap-2">
                    <span className="text-amber-600 font-black">2.</span>
                    <span className="text-zinc-200">Thẩm vấn các nghi phạm & bóc trần mâu thuẫn trong lời khai ngoại phạm.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-amber-900/40 flex items-start gap-2">
                    <span className="text-amber-600 font-black">3.</span>
                    <span className="text-zinc-200">Chỉ điểm đúng kẻ thủ ác và đưa ra vật chứng quyết định không thể chối cãi!</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: VICTIM & CRIME SCENE DETAILS */}
          {activeTab === 'victim' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-5 rounded-2xl bg-zinc-950/90 border-2 border-rose-900/60 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-950 border-2 border-rose-500/50 flex items-center justify-center text-3xl shadow-lg shrink-0">
                  {currentCase.victim.avatar || '👤'}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-600/40">
                      HỒ SƠ NẠN NHÂN
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      ID: #{currentCase.id}_VIC
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-rose-100">
                    {currentCase.victim.name}
                  </h3>
                  <p className="text-xs text-zinc-300 font-medium">
                    {currentCase.victim.title}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-amber-900/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Lần Cuối Nhìn Thấy (Last Seen):</span>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed font-mono bg-white/70 backdrop-blur-sm p-2.5 rounded-xl border border-zinc-800">
                    {currentCase.victim.lastSeen}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-amber-900/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Báo Cáo Giám Định Y Khoa / Pháp Y:</span>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed font-mono bg-white/70 backdrop-blur-sm p-2.5 rounded-xl border border-zinc-800">
                    {currentCase.victim.medicalReport}
                  </p>
                </div>
              </div>

              {/* Crime Scene Atmosphere */}
              <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-amber-700/40 space-y-2">
                <h4 className="text-xs font-bold text-amber-600 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span>Mô Tả Không Gian Hiện Trường:</span>
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {currentCase.crimeSceneDescription}
                </p>
              </div>
            </motion.div>
          )}

          {/* TAB 3: SUSPECTS LINEUP */}
          {activeTab === 'suspects' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-amber-600 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Danh Sách Đối Tượng Khả Nghi ({currentCase.suspects.length} Người)</span>
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">
                  *Hãy thẩm vấn kỹ để tìm ra Red Herrings
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {currentCase.suspects.map((suspect, idx) => (
                  <div
                    key={suspect.id}
                    className="p-3.5 rounded-2xl bg-zinc-950/80 border border-amber-900/50 flex flex-col justify-between hover:border-amber-500/60 transition shadow-md"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-11 h-11 rounded-xl bg-amber-950 border border-amber-600/40 flex items-center justify-center text-2xl shrink-0">
                          {suspect.avatar}
                        </div>
                        <div>
                          <div className="text-xs font-black text-amber-100 line-clamp-1">
                            {suspect.name}
                          </div>
                          <div className="text-[10px] text-zinc-400 line-clamp-1 font-medium">
                            {suspect.title} • {suspect.age} tuổi
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-amber-200/70 italic font-serif line-clamp-2 bg-white/70 backdrop-blur-sm p-2 rounded-xl border border-zinc-800/80 mb-2">
                        {suspect.initialQuote}
                      </p>

                      <div className="text-[10px] text-zinc-400 space-y-1">
                        <div>
                          <strong className="text-zinc-300">Quan hệ:</strong> {suspect.relationshipToVictim}
                        </div>
                        <div>
                          <strong className="text-zinc-300">Ngoại phạm khai:</strong> {suspect.claimedAlibi.timeSlot} ({suspect.claimedAlibi.location})
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-zinc-800 text-[10px] text-amber-600 font-bold flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>Có thể thẩm vấn khi vào hiện trường</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 4: PROTOCOL & RULES */}
          {activeTab === 'protocol' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-600/40 space-y-2">
                <h4 className="text-xs font-black uppercase text-amber-600 flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-amber-600" />
                  <span>Quy Tắc Đấu Trí & Tính Điểm Thám Tử:</span>
                </h4>
                <p className="text-xs text-amber-100/90 leading-relaxed">
                  Các đội thám tử lần lượt khám nghiệm bảng chứng cứ. Để mở khóa giám định vật chứng chuyên sâu hoặc lời khai kín, đội chơi phải trả lời đúng các câu hỏi kiến thức để nhận điểm điều tra.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-amber-900/40 space-y-1.5">
                  <div className="font-bold text-amber-600 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    <span>Lượt Luận Tội (Accusations):</span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-[11px]">
                    Mỗi đội có số lượt đoán giới hạn. Đội chỉ điểm đúng hung thủ + chứng cứ cốt lõi sẽ kết thúc vụ án và nhận điểm thưởng phá án tối cao!
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-amber-900/40 space-y-1.5">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Red Herrings & Bẫy Suy Luận:</span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-[11px]">
                    Có những nghi phạm hành tung mờ ám nhưng hoàn toàn vô tội. Hãy đối chiếu dòng thời gian (Timeline) và vật chứng trước khi đưa ra phán quyết!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-gradient-to-t from-black via-zinc-950 to-[#140e0a] border-t border-amber-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <span className="text-base">🕵️‍♂️</span>
            <span>Chuẩn bị tinh thần xâu chuỗi sự thật và đối chất nghi phạm!</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {isReviewMode && onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-200 font-bold text-xs transition cursor-pointer border border-zinc-700"
              >
                Đóng Hồ Sơ (Quay lại hiện trường)
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStart}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm tracking-wide shadow-xl shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>TIẾP CẬN HIỆN TRƯỜNG & BẮT ĐẦU ĐIỀU TRA</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
