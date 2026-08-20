import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Key,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  Power,
  Eye,
  EyeOff,
  History,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
  Server
} from 'lucide-react';
import { apiManager } from '../../services/apiManager';
import { GeminiApiConfig, ApiStatus, ApiUsageHistoryItem } from '../../types';

interface ApiManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiManagerModal: React.FC<ApiManagerModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'logs'>('list');
  const [configs, setConfigs] = useState<GeminiApiConfig[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [logs, setLogs] = useState<ApiUsageHistoryItem[]>([]);
  const [editingConfig, setEditingConfig] = useState<GeminiApiConfig | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formModel, setFormModel] = useState('gemini-2.5-flash');
  const [formNotes, setFormNotes] = useState('');
  const [formEnabled, setFormEnabled] = useState(true);

  // Status & testing
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; msg: string } | null>(null);
  const [isSavingAndTesting, setIsSavingAndTesting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showKeyMap, setShowKeyMap] = useState<Record<string, boolean>>({});
  const [isTestingAll, setIsTestingAll] = useState(false);

  const loadData = () => {
    setConfigs(apiManager.getConfigs());
    setActiveId(apiManager.getActiveApiId());
    setLogs(apiManager.getUsageHistory());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      return apiManager.subscribe(loadData);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEdit = (config: GeminiApiConfig) => {
    setEditingConfig(config);
    setFormName(config.name);
    setFormEmail(config.email);
    setFormApiKey(config.apiKey);
    setFormModel(config.model || 'gemini-2.5-flash');
    setFormNotes(config.notes || '');
    setFormEnabled(config.enabled);
    setFormError(null);
    setActiveTab('create');
  };

  const handleResetForm = () => {
    setEditingConfig(null);
    setFormName('');
    setFormEmail('');
    setFormApiKey('');
    setFormModel('gemini-2.5-flash');
    setFormNotes('');
    setFormEnabled(true);
    setFormError(null);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formApiKey.trim()) {
      setFormError('Vui lòng nhập Gemini API Key');
      return;
    }
    if (!formEmail.trim()) {
      setFormError('Vui lòng nhập Gmail hoặc Tên dự án sở hữu');
      return;
    }

    setIsSavingAndTesting(true);
    setFormError(null);

    try {
      const saved = apiManager.saveConfig({
        id: editingConfig?.id,
        name: formName.trim() || `API (${formEmail.trim()})`,
        email: formEmail.trim(),
        apiKey: formApiKey.trim(),
        model: formModel,
        notes: formNotes.trim(),
        enabled: formEnabled,
      });

      // Test real connection immediately
      const validationRes = await apiManager.validateApi(saved);
      setIsSavingAndTesting(false);

      if (validationRes.success) {
        if (!activeId || !editingConfig) {
          apiManager.setActiveApiId(saved.id);
        }
        handleResetForm();
        setActiveTab('list');
      } else {
        setFormError(`Đã lưu nhưng test API thất bại: ${validationRes.error}`);
        setActiveTab('list');
      }
    } catch (err: any) {
      setIsSavingAndTesting(false);
      setFormError(err.message || 'Lỗi khi lưu cấu hình API');
    }
  };

  const handleTestSingle = async (config: GeminiApiConfig) => {
    setTestingId(config.id);
    setTestResult(null);

    const result = await apiManager.validateApi(config);
    setTestingId(null);

    setTestResult({
      id: config.id,
      success: result.success,
      msg: result.success
        ? `🟢 Hoạt động tốt! Độ trễ: ${result.responseTimeMs}ms`
        : `🔴 Lỗi: ${result.error || 'Không kết nối được'}`,
    });
  };

  const handleTestAll = async () => {
    setIsTestingAll(true);
    await apiManager.testAllConfigs();
    setIsTestingAll(false);
  };

  const toggleShowKey = (id: string) => {
    setShowKeyMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskApiKey = (key: string, visible?: boolean) => {
    if (visible) return key;
    if (!key || key.length < 8) return '••••••••';
    return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
  };

  // Metrics
  const totalApis = configs.length;
  const activeApis = configs.filter(c => c.status === 'ACTIVE').length;
  const warningApis = configs.filter(c => c.status === 'WARNING' || c.status === 'RATE_LIMITED').length;
  const errorApis = configs.filter(
    c => c.status === 'ERROR' || c.status === 'INVALID' || c.status === 'QUOTA_EXCEEDED'
  ).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-5xl bg-[#FFFDF5] rounded-3xl shadow-2xl border-2 border-[#DCEBCB] overflow-hidden flex flex-col max-h-[92vh] wey-paper-card"
        >
          {/* Header */}
          <div className="bg-[#4F683C] px-6 py-4 text-white flex items-center justify-between shadow-xs border-b border-[#3D522B]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#E9F0D9] text-[#4F683C] rounded-2xl shadow-xs">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>Hệ Thống Quản Lý Gemini API</span>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#E9D58F] text-[#4F683C]">
                    Admin
                  </span>
                </h2>
                <p className="text-xs text-[#DCEBCB] font-semibold mt-0.5">
                  Tập hợp và luân phiên các API Key từ nhiều tài khoản Gmail/Project để đảm bảo AI luôn sẵn sàng 24/7.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#E9F0D9] hover:bg-[#D4E4C1] border border-[#B9CDA0] rounded-xl text-xs font-black text-[#4F683C] transition shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Lấy Key Google AI
              </a>
              <button
                onClick={onClose}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Overview Metrics Cards */}
          <div className="bg-[#F8F4E8] border-b border-[#DCEBCB] px-6 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-2xl border border-[#DCEBCB] shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E9F0D9] text-[#4F683C] flex items-center justify-center font-black">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-[#35452E]">{totalApis}</div>
                <div className="text-[11px] text-[#74806B] font-bold">Tổng số API</div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-[#DCEBCB] shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-emerald-700">{activeApis}</div>
                <div className="text-[11px] text-[#74806B] font-bold">Hoạt động (🟢)</div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-[#DCEBCB] shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-amber-700">{warningApis}</div>
                <div className="text-[11px] text-[#74806B] font-bold">Chờ / Quá tải (🟡)</div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-[#DCEBCB] shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-black">
                <X className="w-5 h-5" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-rose-700">{errorApis}</div>
                <div className="text-[11px] text-[#74806B] font-bold">Lỗi / Hết hạn (🔴)</div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between px-6 border-b border-[#DCEBCB] bg-white">
            <div className="flex space-x-2 py-2.5">
              <button
                onClick={() => setActiveTab('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  activeTab === 'list'
                    ? 'bg-[#4F683C] text-white shadow-xs'
                    : 'text-[#74806B] hover:bg-[#E9F0D9]'
                }`}
              >
                <Key className="w-4 h-4" />
                Danh Sách API ({configs.length})
              </button>

              <button
                onClick={() => {
                  handleResetForm();
                  setActiveTab('create');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  activeTab === 'create'
                    ? 'bg-[#4F683C] text-white shadow-xs'
                    : 'text-[#74806B] hover:bg-[#E9F0D9]'
                }`}
              >
                <Plus className="w-4 h-4" />
                {editingConfig ? 'Chỉnh Sửa API' : 'Thêm API Mới'}
              </button>

              <button
                onClick={() => setActiveTab('logs')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  activeTab === 'logs'
                    ? 'bg-[#4F683C] text-white shadow-xs'
                    : 'text-[#74806B] hover:bg-[#E9F0D9]'
                }`}
              >
                <History className="w-4 h-4" />
                Lịch Sử Gọi AI ({logs.length})
              </button>
            </div>

            {activeTab === 'list' && configs.length > 0 && (
              <button
                onClick={handleTestAll}
                disabled={isTestingAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E9F0D9] hover:bg-[#D4E4C1] text-[#4F683C] rounded-xl text-xs font-black transition disabled:opacity-50 cursor-pointer border border-[#B9CDA0]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingAll ? 'animate-spin' : ''}`} />
                {isTestingAll ? 'Đang kiểm tra tất cả...' : 'Kiểm tra toàn bộ API'}
              </button>
            )}
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto flex-1 bg-[#FDFBF7] custom-scrollbar">
            {/* TAB 1: LIST */}
            {activeTab === 'list' && (
              <div className="space-y-4">
                {configs.length === 0 ? (
                  <div className="text-center py-16 px-4 bg-white border-2 border-dashed border-[#DCEBCB] rounded-3xl space-y-4">
                    <div className="w-16 h-16 bg-[#E9F0D9] text-[#4F683C] rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                      <Key className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-[#35452E]">Chưa có API Key nào được cấu hình</h3>
                      <p className="text-xs text-[#74806B] font-semibold max-w-md mx-auto mt-1">
                        Hãy thêm API Key của bạn để mở khóa toàn bộ các tính năng AI thông minh trong ứng dụng.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        handleResetForm();
                        setActiveTab('create');
                      }}
                      className="px-5 py-2.5 bg-[#4F683C] hover:bg-[#3D522B] text-white font-black text-xs rounded-xl shadow-md transition inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      + Thêm API Đầu Tiên
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3.5">
                    {configs.map(config => {
                      const isCurrentActive = activeId === config.id;
                      const isTesting = testingId === config.id;
                      const isKeyVisible = !!showKeyMap[config.id];
                      const singleTestRes = testResult?.id === config.id ? testResult : null;

                      return (
                        <div
                          key={config.id}
                          className={`bg-white rounded-2xl border-2 p-5 transition-all shadow-xs ${
                            isCurrentActive
                              ? 'border-[#4F683C] ring-2 ring-[#B9CDA0] bg-[#FFFDF5]'
                              : 'border-[#DCEBCB] hover:border-[#B9CDA0]'
                          } ${!config.enabled ? 'opacity-60 bg-slate-50' : ''}`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Left info */}
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="font-black text-sm sm:text-base text-[#35452E]">{config.name}</span>
                                {isCurrentActive && (
                                  <span className="px-2.5 py-0.5 bg-[#4F683C] text-white text-[10px] font-black rounded-md shadow-2xs flex items-center gap-1">
                                    <Check className="w-3 h-3 text-[#E9D58F]" /> ĐANG DÙNG
                                  </span>
                                )}

                                {/* Status Badge */}
                                {config.status === 'ACTIVE' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    🟢 Hoạt động
                                  </span>
                                )}
                                {(config.status === 'WARNING' || config.status === 'RATE_LIMITED') && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    🟡 Quá tải / Rate Limit
                                  </span>
                                )}
                                {config.status === 'QUOTA_EXCEEDED' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                    🔴 Hết Quota
                                  </span>
                                )}
                                {(config.status === 'ERROR' || config.status === 'INVALID') && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                    🔴 Không hoạt động
                                  </span>
                                )}
                                {config.status === 'CHECKING' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                    <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                                    ⚙️ Đang kiểm tra...
                                  </span>
                                )}
                                {config.status === 'UNCHECKED' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                    ⚪ Chưa kiểm tra
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs text-[#74806B] font-semibold flex-wrap">
                                <span className="font-bold text-[#4F683C]">📧 {config.email}</span>
                                <span>•</span>
                                <div className="flex items-center gap-1 bg-[#FAF3D1] px-2 py-0.5 rounded font-mono text-[11px] text-[#7A6218] border border-[#E9D58F]">
                                  <span>{maskApiKey(config.apiKey, isKeyVisible)}</span>
                                  <button
                                    type="button"
                                    onClick={() => toggleShowKey(config.id)}
                                    className="p-0.5 text-[#7A6218] hover:text-[#35452E]"
                                    title={isKeyVisible ? 'Ẩn key' : 'Hiện key'}
                                  >
                                    {isKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                                <span>•</span>
                                <span className="bg-[#E9F0D9] text-[#4F683C] font-black px-2 py-0.5 rounded border border-[#B9CDA0]">
                                  Model: {config.model}
                                </span>
                              </div>

                              {config.notes && (
                                <p className="text-xs text-[#74806B] italic bg-[#F8F4E8] px-2.5 py-1 rounded-xl border border-[#DCEBCB]">
                                  💬 {config.notes}
                                </p>
                              )}

                              {/* Performance & Requests Stats */}
                              <div className="flex items-center gap-4 text-[11px] text-[#74806B] pt-1 flex-wrap font-medium">
                                {config.responseTimeMs ? (
                                  <span className="flex items-center gap-1 text-emerald-700 font-bold">
                                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                                    Độ trễ: {config.responseTimeMs}ms
                                  </span>
                                ) : null}
                                <span>
                                  Tổng request: <strong>{config.totalRequests || 0}</strong> (Thành công:{' '}
                                  <strong className="text-emerald-700">{config.successfulRequests || 0}</strong> / Thất bại:{' '}
                                  <strong className="text-rose-700">{config.failedRequests || 0}</strong>)
                                </span>
                                {config.lastCheckedAt && (
                                  <span>
                                    Kiểm tra: {new Date(config.lastCheckedAt).toLocaleTimeString('vi-VN')} {new Date(config.lastCheckedAt).toLocaleDateString('vi-VN')}
                                  </span>
                                )}
                              </div>

                              {/* Inline Test Result Message */}
                              {singleTestRes && (
                                <div
                                  className={`text-xs p-2 rounded-xl mt-2 font-bold flex items-center gap-1.5 ${
                                    singleTestRes.success
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  {singleTestRes.success ? (
                                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                                  )}
                                  <span>{singleTestRes.msg}</span>
                                </div>
                              )}
                            </div>

                            {/* Right Action buttons */}
                            <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                              <button
                                onClick={() => handleTestSingle(config)}
                                disabled={isTesting || !config.enabled}
                                className="px-3 py-2 bg-[#E9F0D9] hover:bg-[#D4E4C1] text-[#4F683C] rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer border border-[#B9CDA0]"
                                title="Kiểm tra kết nối trực tiếp đến Gemini"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                                {isTesting ? 'Đang test...' : 'Kiểm tra'}
                              </button>

                              {!isCurrentActive ? (
                                <button
                                  onClick={() => apiManager.setActiveApiId(config.id)}
                                  disabled={!config.enabled}
                                  className="px-3 py-2 bg-[#4F683C] hover:bg-[#3D522B] text-white rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5 text-[#E9D58F]" />
                                  Chọn dùng
                                </button>
                              ) : null}

                              <button
                                onClick={() => apiManager.toggleEnabled(config.id)}
                                className={`p-2 rounded-xl text-xs font-black transition cursor-pointer ${
                                  config.enabled
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                }`}
                                title={config.enabled ? 'Tắt API này' : 'Bật API này'}
                              >
                                <Power className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleEdit(config)}
                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition cursor-pointer"
                                title="Chỉnh sửa"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`Bạn có chắc muốn xóa cấu hình API "${config.name}"?`)) {
                                    apiManager.deleteConfig(config.id);
                                  }
                                }}
                                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-black transition cursor-pointer"
                                title="Xóa API"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CREATE / EDIT */}
            {activeTab === 'create' && (
              <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#DCEBCB] shadow-sm">
                <div className="pb-4 mb-6 border-b border-[#DCEBCB] flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-[#35452E]">
                      {editingConfig ? 'Chỉnh Sửa Cấu Hình Gemini API' : 'Thêm Cấu Hình Gemini API Mới'}
                    </h3>
                    <p className="text-xs text-[#74806B] font-semibold mt-0.5">
                      Mỗi API cấu hình tương ứng với một tài khoản Gmail/Google Cloud Project độc lập.
                    </p>
                  </div>
                  {editingConfig && (
                    <button
                      onClick={() => {
                        handleResetForm();
                        setActiveTab('list');
                      }}
                      className="text-xs font-black text-[#74806B] hover:text-[#35452E] cursor-pointer"
                    >
                      Hủy chỉnh sửa
                    </button>
                  )}
                </div>

                {formError && (
                  <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>{formError}</div>
                  </div>
                )}

                <form onSubmit={handleSaveForm} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#35452E] mb-1.5">
                        Tên gợi nhớ API
                      </label>
                      <input
                        type="text"
                        placeholder="VD: API Chính (Gmail Thầy Bằng)"
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs font-bold border border-[#DCEBCB] rounded-xl focus:ring-2 focus:ring-[#4F683C]/20 focus:border-[#4F683C] focus:outline-none bg-white text-[#35452E]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#35452E] mb-1.5">
                        Gmail / Tài khoản sở hữu <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="VD: hoangbang1310@gmail.com"
                        value={formEmail}
                        onChange={e => setFormEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs font-bold border border-[#DCEBCB] rounded-xl focus:ring-2 focus:ring-[#4F683C]/20 focus:border-[#4F683C] focus:outline-none bg-white text-[#35452E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#35452E] mb-1.5">
                      Gemini API Key <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="AIzaSy..."
                      value={formApiKey}
                      onChange={e => setFormApiKey(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-mono border border-[#DCEBCB] rounded-xl focus:ring-2 focus:ring-[#4F683C]/20 focus:border-[#4F683C] focus:outline-none bg-white text-[#35452E]"
                    />
                    <div className="flex items-center justify-between text-[11px] text-[#74806B] mt-1 font-semibold">
                      <span>Key được mã hóa bảo mật và chỉ dùng gửi request qua server.</span>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#4F683C] underline font-bold flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Lấy key Google AI
                      </a>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#35452E] mb-1.5">
                      Model mặc định
                    </label>
                    <select
                      value={formModel}
                      onChange={e => setFormModel(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-bold border border-[#DCEBCB] rounded-xl focus:ring-2 focus:ring-[#4F683C]/20 focus:border-[#4F683C] focus:outline-none bg-white text-[#35452E]"
                    >
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash (Khuyên dùng - Cực nhanh & Ổn định)</option>
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro (Mô hình suy luận cao cấp nhất)</option>
                      <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#35452E] mb-1.5">
                      Ghi chú thêm
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ghi chú về quota, dự án hoặc ngày tạo..."
                      value={formNotes}
                      onChange={e => setFormNotes(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-bold border border-[#DCEBCB] rounded-xl focus:ring-2 focus:ring-[#4F683C]/20 focus:border-[#4F683C] focus:outline-none bg-white text-[#35452E]"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#35452E]">
                      <input
                        type="checkbox"
                        checked={formEnabled}
                        onChange={e => setFormEnabled(e.target.checked)}
                        className="w-4 h-4 text-[#4F683C] rounded focus:ring-[#4F683C]"
                      />
                      Kích hoạt API này ngay sau khi lưu
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DCEBCB]">
                    <button
                      type="button"
                      onClick={() => {
                        handleResetForm();
                        setActiveTab('list');
                      }}
                      className="px-5 py-2.5 text-xs font-bold text-[#74806B] hover:bg-[#E9F0D9] rounded-xl transition cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingAndTesting}
                      className="px-6 py-2.5 text-xs font-black text-white bg-[#4F683C] hover:bg-[#3D522B] rounded-xl transition shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingAndTesting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Đang kiểm tra kết nối...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          {editingConfig ? 'Cập Nhật & Kiểm Tra' : 'Lưu & Kiểm Tra Ngay'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: USAGE LOGS */}
            {activeTab === 'logs' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-[#74806B] font-semibold">
                    Ghi lại các lần ứng dụng gọi các chức năng AI (tạo đề, đọc file, tạo ảnh, gợi ý chữ...).
                  </div>
                  {logs.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm('Bạn có chắc muốn xóa sạch lịch sử gọi AI?')) {
                          apiManager.clearUsageHistory();
                        }
                      }}
                      className="text-xs text-rose-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xóa toàn bộ log
                    </button>
                  )}
                </div>

                {logs.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-3xl border border-[#DCEBCB] text-[#74806B]">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#4F683C]" />
                    Chưa có lượt gọi AI nào được ghi nhận.
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-[#DCEBCB] overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-[#35452E]">
                        <thead className="bg-[#F8F4E8] text-[#74806B] font-black border-b border-[#DCEBCB]">
                          <tr>
                            <th className="py-3 px-4">Thời gian</th>
                            <th className="py-3 px-4">Tính năng AI</th>
                            <th className="py-3 px-4">API sử dụng</th>
                            <th className="py-3 px-4">Model</th>
                            <th className="py-3 px-4">Trạng thái</th>
                            <th className="py-3 px-4">Độ trễ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0ECE1] font-semibold">
                          {logs.map(log => (
                            <tr key={log.id} className="hover:bg-[#FFFDF7] transition">
                              <td className="py-2.5 px-4 text-[#74806B] whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleTimeString('vi-VN')} {new Date(log.timestamp).toLocaleDateString('vi-VN')}
                              </td>
                              <td className="py-2.5 px-4 font-black text-[#35452E]">
                                {log.featureName.replace('/api/', '')}
                              </td>
                              <td className="py-2.5 px-4">
                                <div className="font-bold text-[#4F683C]">{log.apiName}</div>
                                <div className="text-[10px] text-[#74806B]">{log.apiEmail}</div>
                              </td>
                              <td className="py-2.5 px-4 font-mono text-[11px] text-[#7A6218]">
                                {log.model}
                              </td>
                              <td className="py-2.5 px-4">
                                {log.status === 'SUCCESS' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                    ✓ Thành công
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800" title={log.error}>
                                    ✕ Thất bại
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-[#74806B] font-mono">
                                {log.responseTimeMs ? `${log.responseTimeMs}ms` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Footer */}
          <div className="bg-[#F8F4E8] border-t border-[#DCEBCB] px-6 py-4 flex items-center justify-between">
            <div className="text-xs text-[#74806B] font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#4F683C]" />
              Tất cả API Key được lưu trên client và mã hóa proxy an toàn qua backend.
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-black text-[#74806B] hover:bg-[#E9F0D9] rounded-xl transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
