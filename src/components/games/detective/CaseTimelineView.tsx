import React from 'react';
import { motion } from 'motion/react';
import { X, Clock, MapPin, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { DetectiveCase, TeamCaseState } from './caseTypes';

interface CaseTimelineViewProps {
  currentCase: DetectiveCase;
  teamState: TeamCaseState;
  onClose: () => void;
}

export const CaseTimelineView: React.FC<CaseTimelineViewProps> = ({
  currentCase,
  teamState,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="bg-[#faf5ee] text-[#2e1d11] w-full max-w-4xl max-h-[85vh] rounded-3xl border-4 border-[#b58b4c] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#e8d8b9] px-6 py-4 border-b-2 border-[#b58b4c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-700 text-w-text-main flex items-center justify-center text-xl shadow-md">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-amber-950">
                DÒNG THỜI GIAN VỤ ÁN (TIMELINE)
              </h2>
              <p className="text-xs text-stone-600 font-medium">
                Đối chiếu các mốc thời gian thực tế để phát hiện lỗ hổng ngoại phạm
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-amber-200/80 hover:bg-amber-300 text-amber-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Events Scroll Area */}
        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
          <div className="relative border-l-2 border-amber-400 ml-4 space-y-6">
            {currentCase.timeline.map((event, idx) => {
              const involvedSuspects = currentCase.suspects.filter(s => 
                event.involvedSuspectIds.includes(s.id)
              );

              return (
                <div key={event.id} className="relative pl-6">
                  {/* Timeline dot */}
                  <div className={`absolute -left-2.5 top-1.5 w-5 h-5 rounded-full border-2 border-white shadow flex items-center justify-center text-[10px] font-black ${
                    event.isConfirmed ? 'bg-amber-600 text-w-text-main' : 'bg-red-600 text-w-text-main'
                  }`}>
                    {idx + 1}
                  </div>

                  {/* Card Content */}
                  <div className="bg-white p-4 rounded-2xl border-2 border-amber-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-900 text-amber-100 text-xs font-black">
                          🕒 {event.timeStr}
                        </span>
                        <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" />
                          <span>{event.location}</span>
                        </span>
                      </div>

                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        event.isConfirmed 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {event.isConfirmed ? '✓ ĐÃ XÁC THỰC' : '⚠️ THỜI ĐIỂM GÂY ÁN'}
                      </span>
                    </div>

                    <p className="text-xs text-stone-800 font-medium leading-relaxed">
                      {event.description}
                    </p>

                    <div className="pt-2 border-t border-amber-100 flex items-center justify-between text-[11px] text-stone-500">
                      <span>Nguồn xác minh: <strong>{event.source}</strong></span>
                      {involvedSuspects.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span>Liên quan:</span>
                          {involvedSuspects.map(s => (
                            <span key={s.id} className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                              {s.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#e8d8b9] px-6 py-3 border-t-2 border-[#b58b4c] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-w-text-main text-xs font-bold transition cursor-pointer shadow-md"
          >
            Đóng Timeline
          </button>
        </div>
      </motion.div>
    </div>
  );
};
