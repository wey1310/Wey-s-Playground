import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Key,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Plus,
  Zap,
  X,
  Info
} from 'lucide-react';
import { apiManager } from '../../services/apiManager';
import { GeminiApiConfig, ApiStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface ApiSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureTitle?: string;
  onSelectAndProceed: (config: GeminiApiConfig) => void;
  onOpenFullManager?: () => void;
}

export const ApiSelectModal: React.FC<ApiSelectModalProps> = ({
  isOpen,
  onClose,
  featureTitle = 'Tính năng AI',
  onSelectAndProceed,
  onOpenFullManager,
}) => {
  const [configs, setConfigs] = useState<GeminiApiConfig[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<{ id: string; text: string; isError?: boolean } | null>(null);
  const { isAdmin } = useAuth();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Quick Add Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [newModel, setNewModel] = useState('gemini-2.5-flash');
  const [addingError, setAddingError] = useState<string | null>(null);
  const [isAddingAndTesting, setIsAddingAndTesting] = useState(false);

  const loadData = () => {
    setConfigs(apiManager.getConfigs());
    setActiveId(apiManager.getActiveApiId());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      return apiManager.subscribe(loadData);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectAndVerify = async (config: GeminiApiConfig) => {
    setVerifyingId(config.id);
    setVerifyMessage(null);

    // Luồng: SELECT API → VERIFY API → AI READY
    const result = await apiManager.validateApi(config);
    setVerifyingId(null);

    if (result.success && result.status === 'ACTIVE') {
      apiManager.setActiveApiId(config.id);
      setVerifyMessage({
        id: config.id,
        text: `✓ API sẵn sàng (${result.responseTimeMs}ms) - Bắt đầu thực thi AI...`,
      });

      // Tự động đóng modal và chuyển sang tính năng AI sau 700ms
      setTimeout(() => {
        const updatedConfig = apiManager.getActiveApi();
        if (updatedConfig) {
          onSelectAndProceed(updatedConfig);
          onClose();
        }
      }, 700);
    } else {
      setVerifyMessage({
        id: config.id,
        text: `❌ ${result.error || 'API không thể sử dụng. Vui lòng kiểm tra lại.'}`,
        isError: true,
      });
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApiKey.trim()) {
      setAddingError('Vui lòng nhập Gemini API Key');
      return;
    }
    if (!newEmail.trim()) {
      setAddingError('Vui lòng nhập Gmail / Dự án sở hữu để dễ phân biệt');
      return;
    }

    setIsAddingAndTesting(true);
    setAddingError(null);

    try {
      const created = apiManager.saveConfig({
        name: newName.trim() || `API (${newEmail.trim()})`,
        email: newEmail.trim(),
        apiKey: newApiKey.trim(),
        model: newModel,
        enabled: true,
      });

      // Test ngay lập tức
      const testRes = await apiManager.validateApi(created);
      setIsAddingAndTesting(false);

      if (testRes.success) {
        apiManager.setActiveApiId(created.id);
        setShowQuickAdd(false);
        setNewName('');
        setNewEmail('');
        setNewApiKey('');
        onSelectAndProceed(created);
        onClose();
      } else {
        setAddingError(testRes.error || 'API Key không hợp lệ hoặc không có kết nối.');
      }
    } catch (err: any) {
      setIsAddingAndTesting(false);
      setAddingError(err.message || 'Lỗi khi thêm API');
    }
  };

  const getStatusBadge = (status: ApiStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E9F0D9] text-[#4F683C] border border-[#B9CDA0]">
            <span className="w-2 h-2 rounded-full bg-[#4F683C] animate-pulse"></span>
            Hoạt động
          </span>
        );
      case 'WARNING':
      case 'RATE_LIMITED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Quá tải / Chờ
          </span>
        );
      case 'QUOTA_EXCEEDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Hết hạn Quota
          </span>
        );
      case 'ERROR':
      case 'INVALID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Lỗi kết nối
          </span>
        );
      case 'CHECKING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
            Đang kiểm tra
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Chưa kiểm tra
          </span>
        );
    }
  };

  const maskApiKey = (key: string) => {
    if (!key || key.length < 8) return '••••••••';
    return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-[#FFFDF5] rounded-3xl shadow-2xl border-2 border-[#DCEBCB] overflow-hidden flex flex-col max-h-[90vh] wey-paper-card"
        >
          {/* Header - Wey Forest Style */}
          <div className="bg-[#4F683C] px-6 py-4 text-white flex items-center justify-between shadow-xs border-b border-[#3D522B]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#E9F0D9] text-[#4F683C] rounded-2xl shadow-xs">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black flex items-center gap-2 text-white">
                  Xác Thực & Chọn Gemini API
                </h3>
                <p className="text-xs text-[#DCEBCB] font-semibold">
                  Dành cho: <span className="font-bold text-[#E9D58F]">{featureTitle}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
            {/* Info Banner */}
            <div className="bg-[#E9F0D9] border border-[#B9CDA0] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#35452E]">
              <Info className="w-5 h-5 text-[#4F683C] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-black text-sm text-[#35452E]">Quy trình kiểm tra API trực tiếp (Real-time)</p>
                <p className="text-xs text-[#4F683C] font-semibold leading-relaxed">
                  Khi bạn bấm <span className="font-bold text-[#35452E]">"Chọn & Xác Thực"</span>, hệ thống sẽ gửi request kiểm tra thật đến Google Gemini. Khi kết quả hoạt động 🟢, tính năng AI sẽ tự động bắt đầu ngay.
                </p>
              </div>
            </div>

            {/* Quick Add Form View (Admin Only) */}
            {showQuickAdd && isAdmin ? (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleQuickAdd}
                className="bg-[#F8F4E8] border-2 border-[#DCEBCB] rounded-2xl p-5 space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#DCEBCB]">
                  <h4 className="font-black text-sm text-[#35452E] flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#4F683C]" />
                    Thêm Gemini API Mới
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowQuickAdd(false)}
                    className="text-xs font-bold text-[#74806B] hover:text-[#35452E] cursor-pointer"
                  >
                    Quay lại danh sách
                  </button>
                </div>

                {addingError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{addingError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#35452E] mb-1">
                      Tên cấu hình (Gợi nhớ)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: API Dự phòng 1"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold border border-[#DCEBCB] rounded-xl focus:ring-2 focus:ring-[#4F683C]/20 focus:border-[#4F683C] focus:outline-none bg-white text-[#35452E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#35452E] mb-1">
                      Gmail / Dự án sở hữu <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="VD: giaovien@gmail.com"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold border border-[#DCEBCB] rounded-xl focus:ring-2 focus:ring-[#4F683C]/20 focus:border-[#4F683C] focus:outline-none bg-white text-[#35452E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#35452E] mb-1">
                    Gemini API Key <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="AIzaSy..."
                    value={newApiKey}
                    onChange={e => setNewApiKey(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#DCEBCB] rounded-xl focus:ring-2 focus:ring-[#4F683C]/20 focus:border-[#4F683C] focus:outline-none bg-white text-[#35452E]"
                  />
                  <p className="text-[11px] text-[#74806B] font-semibold mt-1">
                    Lấy API Key miễn phí tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[#4F683C] underline font-bold">Google AI Studio</a>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#35452E] mb-1">
                    Model mặc định
                  </label>
                  <select
                    value={newModel}
                    onChange={e => setNewModel(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold border border-[#DCEBCB] rounded-xl focus:ring-2 focus:ring-[#4F683C]/20 focus:border-[#4F683C] focus:outline-none bg-white text-[#35452E]"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Khuyên dùng - Nhanh & Ổn định)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Thông minh cao cấp)</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickAdd(false)}
                    className="px-4 py-2 text-xs font-bold text-[#74806B] hover:bg-[#E9F0D9] rounded-xl transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingAndTesting}
                    className="px-5 py-2 text-xs font-black text-white bg-[#4F683C] hover:bg-[#3D522B] rounded-xl transition shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isAddingAndTesting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Đang xác thực API...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Lưu & Sử Dụng Ngay
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            ) : null}

            {/* List of Configs or Standard Mode Selector */}
            {configs.length === 0 && !showQuickAdd ? (
              <div className="text-center py-8 px-4 bg-[#F8F4E8] border-2 border-dashed border-[#DCEBCB] rounded-2xl space-y-4">
                <div className="w-12 h-12 bg-[#E9F0D9] text-[#4F683C] rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-[#35452E]">
                    {isAdmin ? 'Chưa có cấu hình Gemini API tùy chỉnh' : 'Chế Độ AI Hệ Thống Sẵn Sàng'}
                  </h4>
                  <p className="text-xs text-[#74806B] font-semibold max-w-md mx-auto mt-1">
                    {isAdmin
                      ? 'Admin có thể thêm các Gemini API Key từ nhiều tài khoản để hệ thống tự động xoay vòng quota.'
                      : 'Hệ thống đã tích hợp sẵn Gemini AI máy chủ. Bạn có thể sử dụng các tính năng tạo câu hỏi và phân tích trực tiếp.'}
                  </p>
                </div>
                {isAdmin ? (
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setShowQuickAdd(true)}
                      className="px-4.5 py-2.5 bg-[#4F683C] hover:bg-[#3D522B] text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      + Thêm API Mới
                    </button>
                    {onOpenFullManager && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenFullManager();
                        }}
                        className="px-4.5 py-2.5 bg-white border border-[#DCEBCB] text-[#35452E] hover:bg-[#E9F0D9] font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                      >
                        Quản lý chi tiết
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="pt-2">
                    <button
                      onClick={onClose}
                      className="px-6 py-2.5 bg-[#4F683C] hover:bg-[#3D522B] text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                    >
                      Bắt Đầu Sử Dụng AI
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#74806B]">
                    Danh sách API khả dụng ({configs.filter(c => c.enabled).length}/{configs.length})
                  </span>
                  {!showQuickAdd && isAdmin && (
                    <button
                      onClick={() => setShowQuickAdd(true)}
                      className="text-xs font-black text-[#4F683C] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Thêm API
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {configs.map(config => {
                    const isSelected = activeId === config.id;
                    const isVerifying = verifyingId === config.id;
                    const msg = verifyMessage?.id === config.id ? verifyMessage : null;

                    return (
                      <div
                        key={config.id}
                        className={`p-4 rounded-2xl border-2 transition-all ${
                          isSelected
                            ? 'bg-[#E9F0D9] border-[#4F683C] ring-2 ring-[#B9CDA0] shadow-sm'
                            : 'bg-white border-[#DCEBCB] hover:border-[#B9CDA0]'
                        } ${!config.enabled ? 'opacity-60 bg-slate-50' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-[#35452E] text-sm">{config.name}</span>
                              {isSelected && (
                                <span className="px-2 py-0.5 bg-[#4F683C] text-white text-[10px] font-black rounded-md">
                                  Đang chọn
                                </span>
                              )}
                              {getStatusBadge(isVerifying ? 'CHECKING' : config.status)}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-[#74806B] font-semibold flex-wrap">
                              <span>📧 {config.email}</span>
                              <span>•</span>
                              <span className="font-mono bg-[#FAF3D1] px-1.5 py-0.5 rounded text-[11px] text-[#7A6218] border border-[#E9D58F]">
                                {maskApiKey(config.apiKey)}
                              </span>
                              <span>•</span>
                              <span className="font-black text-[#35452E]">{config.model}</span>
                            </div>

                            {config.responseTimeMs ? (
                              <div className="text-[11px] text-[#74806B] flex items-center gap-1 mt-0.5 font-medium">
                                <Zap className="w-3 h-3 text-amber-600" />
                                Phản hồi: <span className="font-bold text-[#35452E]">{config.responseTimeMs}ms</span>
                                {config.lastCheckedAt && (
                                  <>
                                    <span>•</span>
                                    <span>Kiểm tra: {new Date(config.lastCheckedAt).toLocaleTimeString('vi-VN')}</span>
                                  </>
                                )}
                              </div>
                            ) : null}

                            {config.lastError && config.status !== 'ACTIVE' && (
                              <div className="text-[11px] text-rose-700 bg-rose-50 p-1.5 rounded-xl border border-rose-200 mt-1 font-bold">
                                ⚠️ {config.lastError}
                              </div>
                            )}

                            {msg && (
                              <div
                                className={`text-xs p-2 rounded-xl mt-2 font-bold flex items-center gap-1.5 ${
                                  msg.isError
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {msg.isError ? (
                                  <AlertCircle className="w-4 h-4 shrink-0" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                                )}
                                <span>{msg.text}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleSelectAndVerify(config)}
                              disabled={isVerifying || !config.enabled}
                              className={`px-4 py-2 rounded-xl text-xs font-black transition shadow-sm flex items-center gap-1.5 cursor-pointer ${
                                isSelected && config.status === 'ACTIVE'
                                  ? 'bg-[#4F683C] text-white hover:bg-[#3D522B]'
                                  : 'bg-[#4F683C] hover:bg-[#3D522B] text-white'
                              } disabled:opacity-50`}
                            >
                              {isVerifying ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  Đang kiểm tra...
                                </>
                              ) : isSelected && config.status === 'ACTIVE' ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#E9D58F]" />
                                  Đang dùng • Xác thực lại
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3.5 h-3.5 text-[#E9D58F]" />
                                  Chọn & Xác Thực
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-[#F8F4E8] border-t border-[#DCEBCB] px-6 py-3.5 flex items-center justify-between">
            <div className="text-xs text-[#74806B] font-semibold">
              Mẹo: Thêm nhiều API từ các Gmail khác nhau để luân phiên khi hết quota.
            </div>
            <div className="flex items-center gap-2">
              {onOpenFullManager && isAdmin && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenFullManager();
                  }}
                  className="px-3.5 py-1.5 text-xs font-black text-[#4F683C] hover:bg-[#E9F0D9] border border-[#B9CDA0] rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  Mở Trình Quản Lý API
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-black text-[#74806B] hover:bg-[#E9F0D9] rounded-xl transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
