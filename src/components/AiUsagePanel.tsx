import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithAuth } from '../utils/api';
import { Zap, Sparkles, Brain, Loader2 } from 'lucide-react';

export type AiMode = 'fast' | 'balanced' | 'smart';

interface AiUsagePanelProps {
  onModeChange: (mode: AiMode) => void;
  selectedMode: AiMode;
  disabled?: boolean;
}

export const AiUsagePanel: React.FC<AiUsagePanelProps> = ({ onModeChange, selectedMode, disabled }) => {
  const { user, loginWithGoogle } = useAuth();
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUsage();
    }
  }, [user]);

  const loadUsage = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/api/ai-usage');
      if (data && data.success && data.usage) {
        setUsage(data.usage);
      } else {
        // Fallback default usage if API returned offline status
        setUsage({
          dailyUsed: 0,
          dailyLimit: 100,
        });
      }
    } catch (e) {
      console.warn("Failed to load AI usage", e);
      setUsage({
        dailyUsed: 0,
        dailyLimit: 100,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 text-center space-y-3">
        <div className="text-purple-800 font-semibold text-sm">
          Đăng nhập Google để sử dụng AI
        </div>
        <button
          onClick={loginWithGoogle}
          className="px-4 py-2 bg-white text-purple-700 rounded-lg shadow font-bold text-xs hover:bg-purple-50 transition"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  const remaining = usage ? usage.dailyLimit - usage.dailyUsed : 0;
  const isOutOfQuota = usage && remaining <= 0;

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <span>🤖</span> SỬ DỤNG AI
        </h3>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        ) : usage && (
          <div className="text-xs font-semibold text-slate-600 text-right">
            Lượt sử dụng:<br/>
            <span className={isOutOfQuota ? "text-rose-500" : "text-purple-600"}>
              {usage.dailyUsed}/{usage.dailyLimit} hôm nay
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <button
          type="button"
          disabled={disabled || isOutOfQuota}
          onClick={() => onModeChange('fast')}
          className={`flex flex-col items-center p-2 rounded-lg border transition ${selectedMode === 'fast' ? 'bg-amber-50 border-amber-400 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'} disabled:opacity-50`}
        >
          <Zap className={`w-4 h-4 mb-1 ${selectedMode === 'fast' ? 'text-amber-500' : 'text-slate-400'}`} />
          <span className="text-[10px] font-bold text-slate-700">Nhanh</span>
          <span className="text-[9px] text-slate-500">1 lượt</span>
        </button>
        <button
          type="button"
          disabled={disabled || isOutOfQuota}
          onClick={() => onModeChange('balanced')}
          className={`flex flex-col items-center p-2 rounded-lg border transition ${selectedMode === 'balanced' ? 'bg-purple-50 border-purple-400 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'} disabled:opacity-50`}
        >
          <Sparkles className={`w-4 h-4 mb-1 ${selectedMode === 'balanced' ? 'text-purple-500' : 'text-slate-400'}`} />
          <span className="text-[10px] font-bold text-slate-700">Cân bằng</span>
          <span className="text-[9px] text-slate-500">1 lượt</span>
        </button>
        <button
          type="button"
          disabled={disabled || isOutOfQuota}
          onClick={() => onModeChange('smart')}
          className={`flex flex-col items-center p-2 rounded-lg border transition ${selectedMode === 'smart' ? 'bg-blue-50 border-blue-400 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'} disabled:opacity-50`}
        >
          <Brain className={`w-4 h-4 mb-1 ${selectedMode === 'smart' ? 'text-blue-500' : 'text-slate-400'}`} />
          <span className="text-[10px] font-bold text-slate-700">Thông minh</span>
          <span className="text-[9px] text-slate-500">2 lượt</span>
        </button>
      </div>

      {isOutOfQuota && (
        <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg font-medium text-center">
          Bạn đã sử dụng hết lượt AI hôm nay. Vui lòng quay lại vào ngày mai.
        </div>
      )}
      {!isOutOfQuota && usage && (
        <div className="text-[11px] text-slate-500 text-center font-medium">
          Còn lại: <span className="font-bold text-slate-700">{remaining} lượt</span>
        </div>
      )}
    </div>
  );
};

export default AiUsagePanel;
