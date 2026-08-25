import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowDown, 
  Clock, 
  Layers, 
  Info, 
  Sparkles,
  Server,
  Activity,
  Check,
  AlertTriangle,
  Flame,
  ArrowRight
} from 'lucide-react';
import { apiManager } from '../../services/apiManager';
import { KeyPoolPublicState } from '../../types';

export const AdminApiSection: React.FC = () => {
  const [poolState, setPoolState] = useState<KeyPoolPublicState>(apiManager.getPoolState());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    text?: string;
    usedModel?: string;
    keyIndexUsed?: number;
    keyMasked?: string;
    downgraded?: boolean;
    meta?: {
      keyId?: string;
      envName?: string;
      keyMasked?: string;
      keyIndex?: number;
      keyLength?: number;
      modelUsed?: string;
      usedModel?: string;
      latency?: number;
      keyRotations?: number;
      modelFallbacks?: number;
      fallbackModelCount?: number;
      fallbackKeyCount?: number;
      downgraded?: boolean;
    };
    error?: string;
  } | null>(null);

  useEffect(() => {
    const unsub = apiManager.subscribe(() => {
      setPoolState(apiManager.getPoolState());
    });
    setPoolState(apiManager.getPoolState());
    return unsub;
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const refreshed = await apiManager.refreshPool();
      setPoolState(refreshed);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTestRotation = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await apiManager.testRotation("Hãy trả lời: 'Hệ thống Gemini Key Pool đang hoạt động hoàn hảo!'");
      setTestResult(res);
      setPoolState(apiManager.getPoolState());
    } catch (e: any) {
      setTestResult({
        success: false,
        error: e?.message || "Kiểm tra xoay key thất bại."
      });
    } finally {
      setIsTesting(false);
    }
  };

  const modelPriorityList = poolState.modelPriority && poolState.modelPriority.length > 0 
    ? poolState.modelPriority 
    : [
        { tier: 1, model: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', description: 'Model mạnh nhất, tối ưu chiều sâu worldbuilding và độ nhất quán lore', isLastUsed: true },
        { tier: 2, model: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', description: 'Cân bằng hiệu năng cao và tốc độ phản hồi nhanh' },
        { tier: 3, model: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', description: 'Bản xem trước thế hệ Gemini 3 tốc độ cao' },
        { tier: 4, model: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', description: 'Mô hình siêu nhẹ, tiết kiệm tài nguyên' },
        { tier: 5, model: 'gemini-flash-latest', name: 'Gemini Flash Latest', description: 'Mô hình dự phòng ổn định cao nhất' },
      ];

  const totalKeys = poolState.totalConfigured || poolState.keys.length;
  const activeKeysCount = poolState.keys.filter(k => k.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#24351E] via-[#35452E] to-[#465C38] text-white p-6 rounded-3xl shadow-sm border border-[#526B43]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Vercel Environment Variable Key Pool</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-amber-100">
              Cơ Chế Xoay Vòng Key & Hạ Model Tự Động
            </h2>
            <p className="text-xs md:text-sm text-emerald-100/90 font-medium max-w-2xl leading-relaxed">
              Bảo vệ hạn mức RPM và giữ cho các nút AI không bị đứng bằng cách xoay vòng đa key và cách ly thông minh.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 border border-white/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Đang làm mới...' : 'Làm mới Key Pool'}</span>
            </button>
            <button
              onClick={handleTestRotation}
              disabled={isTesting}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl text-xs font-black transition flex items-center gap-2 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Zap className={`w-3.5 h-3.5 ${isTesting ? 'animate-bounce' : ''}`} />
              <span>{isTesting ? 'Đang test...' : 'Kiểm tra xoay key ngay'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 3 Nguyên lý hoạt động */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#DED5B8] shadow-xs flex flex-col gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#E9F0D9] text-[#35452E] flex items-center justify-center font-bold">
            <RefreshCw className="w-5 h-5 text-[#6F8F55]" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#35452E] text-sm flex items-center gap-1.5">
              <span>🔄 Round-Robin Key</span>
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Mỗi request bốc key kế tiếp trong danh sách để chia đều lưu lượng và tối ưu hóa giới hạn RPM.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#DED5B8] shadow-xs flex flex-col gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-amber-900 text-sm flex items-center gap-1.5">
              <span>⏱ Cách ly có thời hạn</span>
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Key hoặc model gặp lỗi 429 được cách ly riêng biệt theo từng cặp, tạm nghỉ có đếm ngược rồi tự động quay lại pool.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#DED5B8] shadow-xs flex flex-col gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-purple-900 text-sm flex items-center gap-1.5">
              <span>🧱 Tự động hạ model</span>
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Luôn gọi model mạnh nhất trước. Chỉ hạ cấp khi toàn bộ key trong pool đều không thể phục vụ cấp hiện tại.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Thứ tự ưu tiên model */}
      <div className="bg-[#FAF7EE] border border-[#DED5B8] p-5 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#6F8F55]" />
            <h3 className="font-extrabold text-[#35452E] text-base">Thứ Tự Ưu Tiên Model</h3>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Khởi đầu luôn từ Cấp 1
          </span>
        </div>

        <div className="space-y-2.5">
          {modelPriorityList.map((tier, idx) => {
            const isLastUsed = tier.isLastUsed || poolState.lastUsedModel === tier.model;
            return (
              <React.Fragment key={tier.model}>
                <div className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                  isLastUsed 
                    ? 'bg-emerald-50/90 border-emerald-300 shadow-xs' 
                    : 'bg-white border-[#DED5B8]'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                      isLastUsed ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      C{tier.tier}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800">{tier.name}</span>
                        <code className="text-[11px] text-slate-500 font-mono">({tier.model})</code>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{tier.description}</p>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {isLastUsed ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-600 text-white uppercase tracking-wider flex items-center gap-1">
                        <Check className="w-3 h-3" /> Vừa dùng
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">Sẵn sàng</span>
                    )}
                  </div>
                </div>

                {idx < modelPriorityList.length - 1 && (
                  <div className="flex items-center justify-center py-0.5 text-slate-400 gap-1.5 text-[11px] font-bold">
                    <ArrowDown className="w-3 h-3 text-[#6F8F55]" />
                    <span className="text-slate-500 text-[10px]">Hạ xuống khi mọi key đều cạn khả năng phục vụ ở cấp trên</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 4. Trạng thái Key Pool & Thống kê vận hành */}
      <div className="bg-white border border-[#DED5B8] p-5 rounded-3xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DED5B8] pb-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-[#6F8F55]" />
            <h3 className="font-extrabold text-[#35452E] text-base">Trạng Thái Key Pool & Thống Kê Vận Hành</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-3 py-1 rounded-full bg-[#E9F0D9] text-[#35452E] border border-[#B9CDA0]">
              {totalKeys} API Key đang cấu hình
            </span>
          </div>
        </div>

        {/* 4 Thẻ Thống Kê */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#FAF7EE] p-3.5 rounded-2xl border border-[#DED5B8]">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tổng Request</div>
            <div className="text-xl font-black text-slate-800 mt-1">{poolState.stats?.totalRequests || 0}</div>
          </div>
          <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
            <div className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Thành Công</div>
            <div className="text-xl font-black text-emerald-700 mt-1">{poolState.stats?.totalSuccess || 0}</div>
          </div>
          <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200">
            <div className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Lượt Xoay 429</div>
            <div className="text-xl font-black text-amber-700 mt-1">{poolState.stats?.rotate429Count || 0}</div>
          </div>
          <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200">
            <div className="text-[10px] font-black text-purple-800 uppercase tracking-wider">Lượt Hạ Model</div>
            <div className="text-xl font-black text-purple-700 mt-1">{poolState.stats?.fallbackModelCount || 0}</div>
          </div>
        </div>

        {/* Danh sách Key trong Pool */}
        <div className="space-y-2">
          <div className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span>Danh Sách Key Được Phát Hiện ({totalKeys} Key)</span>
            <span className="text-[11px] text-slate-500 font-normal">Nguồn: Vercel Environment Variables (GEMINI_API_KEY_*)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {poolState.keys.map((keyItem) => {
              const isCooldown = keyItem.status === 'COOLDOWN';
              const isInvalid = keyItem.status === 'INVALID';
              return (
                <div
                  key={keyItem.id}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-2 ${
                    isInvalid
                      ? 'bg-rose-50/60 border-rose-200'
                      : isCooldown
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-[#FAF7EE]/60 border-[#DED5B8] hover:border-[#B9CDA0]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#DED5B8] flex items-center justify-center text-xs font-black text-slate-700">
                      #{keyItem.number}
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                        <span>{keyItem.envName}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {keyItem.masked} · {keyItem.length} ký tự
                      </div>
                    </div>
                  </div>

                  <div>
                    {isInvalid ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                        🔴 Invalid
                      </span>
                    ) : isCooldown ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        🟡 Cooldown
                      </span>
                    ) : (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        🟢 Active
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {poolState.keys.length === 0 && (
              <div className="col-span-2 text-center py-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                Chưa phát hiện biến môi trường GEMINI_API_KEY_* nào. Vui lòng thêm trong Vercel Project Settings.
              </div>
            )}
          </div>
        </div>

        {/* Danh sách Cooldown / Tạm nghỉ */}
        <div className="bg-[#FAF7EE] p-4 rounded-2xl border border-[#DED5B8] space-y-2">
          <div className="flex items-center justify-between text-xs font-black text-slate-800">
            <div className="flex items-center gap-1.5 text-amber-900">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>{poolState.cooldowns.length} mục đang tạm nghỉ</span>
            </div>
            {poolState.cooldowns.length === 0 && (
              <span className="text-[11px] font-bold text-emerald-700">Tất cả key và model đều đang sẵn sàng</span>
            )}
          </div>

          {poolState.cooldowns.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              {poolState.cooldowns.map((cd, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-white border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-900">{cd.masked}</span>
                    <span className="text-slate-400">@</span>
                    <code className="text-purple-700 font-bold">{cd.model}</code>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-600">{cd.reason}</span>
                  </div>
                  <div className="text-[11px] font-extrabold text-amber-700 self-end sm:self-auto">
                    Còn ~{cd.remainingMinutes} phút
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">
              Khi gặp mã lỗi 429 hoặc quá tải, cặp (Key + Model) tương ứng sẽ xuất hiện ở đây và tự động phục hồi sau khi hết thời gian chờ.
            </p>
          )}
        </div>

        {/* Khung Test Kết Quả */}
        {testResult && (
          <div className={`p-4 rounded-2xl border text-xs space-y-2 transition-all ${
            testResult.success 
              ? 'bg-emerald-50/90 border-emerald-200' 
              : 'bg-rose-50/90 border-rose-200'
          }`}>
            <div className="flex items-center justify-between font-black">
              <span className={testResult.success ? 'text-emerald-900' : 'text-rose-900'}>
                {testResult.success ? '⚡ Kết Quả Kiểm Tra Xoay Key Thành Công' : '⚠️ Kiểm Tra Thất Bại'}
              </span>
              {testResult.meta?.latency && (
                <span className="text-[11px] text-emerald-700 font-bold">
                  Độ trễ: {testResult.meta.latency}ms
                </span>
              )}
            </div>

            {testResult.success && testResult.meta && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="p-2 rounded-lg bg-white border border-emerald-200">
                  <span className="text-[10px] text-slate-400 block font-bold">Key Đã Chọn</span>
                  <span className="font-mono font-extrabold text-slate-800 text-[11px]">{testResult.meta.keyMasked}</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-emerald-200">
                  <span className="text-[10px] text-slate-400 block font-bold">Tên Biến ENV</span>
                  <span className="font-extrabold text-slate-800 text-[11px]">{testResult.meta.envName}</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-emerald-200">
                  <span className="text-[10px] text-slate-400 block font-bold">Model Xử Lý</span>
                  <span className="font-extrabold text-purple-700 text-[11px]">{testResult.meta.modelUsed}</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-emerald-200">
                  <span className="text-[10px] text-slate-400 block font-bold">Lượt Xoay / Hạ</span>
                  <span className="font-extrabold text-amber-700 text-[11px]">Xoay: {testResult.meta.keyRotations} | Hạ: {testResult.meta.modelFallbacks}</span>
                </div>
              </div>
            )}

            {testResult.text && (
              <div className="p-3 bg-white rounded-xl border border-emerald-200 text-slate-700 italic">
                "{testResult.text}"
              </div>
            )}

            {testResult.error && (
              <div className="text-rose-700 font-medium">
                {testResult.error}
              </div>
            )}
          </div>
        )}

        {/* 5. Khung Lưu ý về Quota */}
        <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong>Lưu ý về Quota:</strong> API Key không đồng nghĩa với một quota độc lập. Hạn mức Gemini phụ thuộc vào project, model và loại quota. Nhiều API Key cùng thuộc một Google Cloud project có thể dùng chung hạn mức. Key Pool có nhiệm vụ phân phối request và xử lý rate limit/fallback, không tự tạo thêm quota từ cùng một project.
          </div>
        </div>

        {/* 6. Hướng dẫn thêm API Key */}
        <div className="p-4 bg-[#E9F0D9]/80 rounded-2xl border border-[#B9CDA0] space-y-2">
          <div className="flex items-center gap-2 text-xs font-black text-[#35452E]">
            <Sparkles className="w-4 h-4 text-[#6F8F55]" />
            <span>Hướng Dẫn Thêm API Key Mới Qua Vercel</span>
          </div>
          <ol className="list-decimal pl-5 text-xs text-slate-700 space-y-1 leading-relaxed">
            <li>Truy cập vào <strong>Vercel Dashboard → Project Settings → Environment Variables</strong>.</li>
            <li>Thêm biến mới dạng <code>GEMINI_API_KEY_N</code> (Ví dụ: <code>GEMINI_API_KEY_11</code>, <code>GEMINI_API_KEY_12</code>...).</li>
            <li>Chọn Environments: <strong>Production</strong>, <strong>Preview</strong>, và <strong>Development</strong>.</li>
            <li>Tiến hành <strong>Redeploy</strong> lại project để Vercel cập nhật biến môi trường mới.</li>
            <li>Quay lại giao diện này và bấm <strong>"Làm mới Key Pool"</strong>.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
