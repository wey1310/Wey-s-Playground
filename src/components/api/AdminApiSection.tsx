import React, { useState, useEffect } from 'react';
import {
  Key,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  Power,
  Eye,
  EyeOff,
  History,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  Server
} from 'lucide-react';
import { apiManager } from '../../services/apiManager';
import { GeminiApiConfig, ApiStatus, ApiUsageHistoryItem } from '../../types';

export const AdminApiSection: React.FC = () => {
  const [subTab, setSubTab] = useState<'list' | 'add' | 'logs'>('list');
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

  // Testing & verification
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
    loadData();
    return apiManager.subscribe(loadData);
  }, []);

    const handleEdit = async (config: GeminiApiConfig) => {
    setEditingConfig(config);
    setFormName(config.name);
    setFormEmail(config.email);
    setFormModel(config.model || 'gemini-2.5-flash');
    setFormNotes(config.notes || '');
    setFormEnabled(config.enabled);
    setFormError(null);
    setSubTab('add');
    
    // Fetch actual secret key
    const secretKey = await apiManager.getSecretApiKey(config.id);
    setFormApiKey(secretKey);
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
      const saved = await apiManager.saveConfig({
        id: editingConfig?.id,
        name: formName.trim() || `API (${formEmail.trim()})`,
        email: formEmail.trim(),
        apiKey: formApiKey.trim(),
        model: formModel,
        notes: formNotes.trim(),
        enabled: formEnabled,
      });

      // Tự động kiểm tra API ngay khi lưu
      const testRes = await apiManager.validateApi(saved);
      setIsSavingAndTesting(false);

      if (testRes.success) {
        handleResetForm();
        setSubTab('list');
      } else {
        setFormError(`Đã lưu cấu hình, nhưng kiểm tra thất bại: ${testRes.error}`);
      }
    } catch (err: any) {
      setIsSavingAndTesting(false);
      setFormError(err.message || 'Lỗi khi lưu cấu hình');
    }
  };

  const handleTestSingle = async (config: GeminiApiConfig) => {
    setTestingId(config.id);
    setTestResult(null);

    const res = await apiManager.validateApi(config);
    setTestingId(null);

    setTestResult({
      id: config.id,
      success: res.success,
      msg: res.success
        ? `✓ Kết nối thành công (${res.responseTimeMs}ms) - API sẵn sàng!`
        : `❌ Lỗi: ${res.error}`,
    });
  };

  const handleTestAll = async () => {
    setIsTestingAll(true);
    const available = apiManager.getAvailableApis();
    for (const config of available) {
      await apiManager.validateApi(config);
    }
    setIsTestingAll(false);
  };

  const toggleShowKey = (id: string) => {
    setShowKeyMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskApiKey = (key: string, show: boolean) => {
    if (show) return key;
    if (!key || key.length < 8) return '••••••••';
    return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
  };

  // Metrics
  const totalApis = configs.length;
  const activeApis = configs.filter(c => c.status === 'ACTIVE' && c.enabled).length;
  const warningApis = configs.filter(c => c.status === 'WARNING' || c.status === 'RATE_LIMITED').length;
  const errorApis = configs.filter(
    c => c.status === 'ERROR' || c.status === 'INVALID' || c.status === 'QUOTA_EXCEEDED'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Info */}
      <div className="bg-gradient-to-r from-[#1e293b] via-[#0f172a] to-[#1e293b] text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl">
            <Key className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              Hệ Thống Quản Lý Gemini API Đa Khóa
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                Hoạt động đồng bộ
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Cung cấp danh sách các Gemini API từ nhiều tài khoản Google khác nhau. Hệ thống tự động xác thực thực tế, luân phiên và cảnh báo khi hết Quota.
            </p>
          </div>
        </div>

        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Lấy Key Google AI Studio</span>
        </a>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#FAF7EE] p-4 rounded-xl border border-[#DED5B8] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-800">{totalApis}</div>
            <div className="text-[11px] text-slate-500 font-bold">Tổng số API</div>
          </div>
        </div>

        <div className="bg-[#FAF7EE] p-4 rounded-xl border border-[#DED5B8] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-emerald-700">{activeApis}</div>
            <div className="text-[11px] text-slate-500 font-bold">Đang hoạt động (🟢)</div>
          </div>
        </div>

        <div className="bg-[#FAF7EE] p-4 rounded-xl border border-[#DED5B8] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-amber-700">{warningApis}</div>
            <div className="text-[11px] text-slate-500 font-bold">Quá tải / Chờ (🟡)</div>
          </div>
        </div>

        <div className="bg-[#FAF7EE] p-4 rounded-xl border border-[#DED5B8] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-rose-700">{errorApis}</div>
            <div className="text-[11px] text-slate-500 font-bold">Lỗi / Hết quota (🔴)</div>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-[#DED5B8] pb-3 gap-2 flex-wrap">
        <div className="flex space-x-2">
          <button
            onClick={() => setSubTab('list')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              subTab === 'list'
                ? 'bg-[#6F8F55] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-[#DED5B8] hover:bg-[#FAF7EE]'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Danh Sách API ({configs.length})</span>
          </button>

          <button
            onClick={() => {
              handleResetForm();
              setSubTab('add');
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              subTab === 'add'
                ? 'bg-[#6F8F55] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-[#DED5B8] hover:bg-[#FAF7EE]'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{editingConfig ? 'Chỉnh Sửa API' : '+ Thêm API Mới'}</span>
          </button>

          <button
            onClick={() => setSubTab('logs')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              subTab === 'logs'
                ? 'bg-[#6F8F55] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-[#DED5B8] hover:bg-[#FAF7EE]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Nhật Ký Sử Dụng ({logs.length})</span>
          </button>
        </div>

        {subTab === 'list' && configs.length > 0 && (
          <button
            onClick={handleTestAll}
            disabled={isTestingAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DED5B8] hover:bg-[#E9F0D9] text-[#3D522B] rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingAll ? 'animate-spin' : ''}`} />
            <span>{isTestingAll ? 'Đang kiểm tra tất cả...' : 'Kiểm tra toàn bộ API'}</span>
          </button>
        )}
      </div>

      {/* SUBTAB 1: LIST */}
      {subTab === 'list' && (
        <div className="space-y-3.5">
          {configs.length === 0 ? (
            <div className="text-center py-14 px-4 bg-[#FAF7EE] border-2 border-dashed border-[#DED5B8] rounded-2xl space-y-3">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                <Key className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-800 text-base">Chưa có cấu hình Gemini API nào</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Hãy thêm ít nhất một Gemini API Key để toàn bộ giáo viên và học sinh có thể sử dụng các tính năng tạo đề, phân tích câu hỏi tự động.
              </p>
              <button
                onClick={() => {
                  handleResetForm();
                  setSubTab('add');
                }}
                className="px-4 py-2 bg-[#6F8F55] hover:bg-[#5F7E4B] text-white font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm API Ngay</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {configs.map(config => {
                const isCurrentActive = activeId === config.id;
                const isTesting = testingId === config.id;
                const isKeyVisible = !!showKeyMap[config.id];
                const singleTestRes = testResult?.id === config.id ? testResult : null;

                return (
                  <div
                    key={config.id}
                    className={`bg-white rounded-2xl border p-4 sm:p-5 transition shadow-xs ${
                      isCurrentActive
                        ? 'border-[#6F8F55] ring-2 ring-[#B9CDA0] bg-[#FAFDF7]'
                        : 'border-[#DED5B8] hover:border-[#B9CDA0]'
                    } ${!config.enabled ? 'opacity-60 bg-slate-50' : ''}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left info */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm text-slate-900">{config.name}</span>
                          {isCurrentActive && (
                            <span className="px-2 py-0.5 bg-[#6F8F55] text-white text-[10px] font-black rounded-md flex items-center gap-1">
                              <Check className="w-3 h-3" /> ĐANG DÙNG
                            </span>
                          )}

                          {/* Status Badge */}
                          {config.status === 'ACTIVE' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              🟢 Hoạt động
                            </span>
                          )}
                          {(config.status === 'WARNING' || config.status === 'RATE_LIMITED') && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              🟡 Quá tải / Chờ
                            </span>
                          )}
                          {config.status === 'QUOTA_EXCEEDED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                              🔴 Hết Quota
                            </span>
                          )}
                          {(config.status === 'ERROR' || config.status === 'INVALID') && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                              🔴 Không hoạt động
                            </span>
                          )}
                          {config.status === 'CHECKING' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                              <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                              ⚙️ Đang test...
                            </span>
                          )}
                          {config.status === 'UNCHECKED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                              ⚪ Chưa kiểm tra
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                          <span className="font-semibold text-[#3D522B]">📧 {config.email}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1 bg-[#FAF7EE] border border-[#DED5B8] px-2 py-0.5 rounded font-mono text-[11px]">
                            <span>{maskApiKey(config.apiKey, isKeyVisible)}</span>
                            <button
                              type="button"
                              onClick={() => toggleShowKey(config.id)}
                              className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                              title={isKeyVisible ? 'Ẩn key' : 'Hiện key'}
                            >
                              {isKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <span>•</span>
                          <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-[11px] border border-indigo-200">
                            {config.model}
                          </span>
                        </div>

                        {config.notes && (
                          <p className="text-xs text-slate-500 italic bg-[#FAF7EE] px-2.5 py-1 rounded-lg border border-[#EFE8D6]">
                            💬 {config.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-0.5 flex-wrap">
                          {config.responseTimeMs ? (
                            <span className="flex items-center gap-1 text-emerald-700 font-bold">
                              <Zap className="w-3.5 h-3.5 text-amber-500" />
                              Phản hồi: {config.responseTimeMs}ms
                            </span>
                          ) : null}
                          <span>
                            Request: <strong>{config.totalRequests || 0}</strong> (Thành công:{' '}
                            <strong className="text-emerald-700">{config.successfulRequests || 0}</strong> / Thất bại:{' '}
                            <strong className="text-rose-600">{config.failedRequests || 0}</strong>)
                          </span>
                          {config.lastCheckedAt && (
                            <span>
                              Test gần nhất: {new Date(config.lastCheckedAt).toLocaleTimeString('vi-VN')} {new Date(config.lastCheckedAt).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>

                        {singleTestRes && (
                          <div
                            className={`text-xs p-2 rounded-xl mt-1.5 font-bold flex items-center gap-1.5 ${
                              singleTestRes.success
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {singleTestRes.success ? (
                              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
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
                          className="px-3 py-1.5 bg-[#FAF7EE] hover:bg-[#E9F0D9] text-[#3D522B] border border-[#DED5B8] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          title="Kiểm tra kết nối thực tế với Google AI"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                          <span>{isTesting ? 'Đang test...' : 'Kiểm tra'}</span>
                        </button>

                        {!isCurrentActive ? (
                          <button
                            onClick={() => apiManager.setActiveApiId(config.id)}
                            disabled={!config.enabled}
                            className="px-3 py-1.5 bg-[#E9F0D9] hover:bg-[#D4E4C1] text-[#2D3F22] border border-[#B9CDA0] rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Dùng</span>
                          </button>
                        ) : null}

                        <button
                          onClick={() => apiManager.toggleEnabled(config.id)}
                          className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer ${
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
                          className="p-2 bg-[#FAF7EE] hover:bg-[#E9F0D9] text-slate-700 border border-[#DED5B8] rounded-xl text-xs font-bold transition cursor-pointer"
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
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
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

      {/* SUBTAB 2: ADD / EDIT */}
      {subTab === 'add' && (
        <div className="max-w-2xl bg-white p-6 rounded-2xl border border-[#DED5B8] shadow-xs space-y-4">
          <div className="pb-3 border-b border-[#EFE8D6] flex items-center justify-between">
            <div>
              <h4 className="font-black text-base text-slate-900">
                {editingConfig ? 'Cập Nhật Cấu Hình Gemini API' : 'Thêm Cấu Hình Gemini API Mới'}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhập thông tin API Key và Gmail sở hữu. Hệ thống sẽ tự động xác thực kết nối ngay khi bấm Lưu.
              </p>
            </div>
            {editingConfig && (
              <button
                type="button"
                onClick={() => {
                  handleResetForm();
                  setSubTab('list');
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Hủy chỉnh sửa
              </button>
            )}
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>{formError}</div>
            </div>
          )}

          <form onSubmit={handleSaveForm} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên gợi nhớ API
                </label>
                <input
                  type="text"
                  placeholder="VD: API Dự Phòng 1 (Gmail Cá Nhân)"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6F8F55] focus:outline-none bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gmail / Tên dự án sở hữu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="VD: giaovien123@gmail.com"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6F8F55] focus:outline-none bg-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Gemini API Key <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="AIzaSy..."
                value={formApiKey}
                onChange={e => setFormApiKey(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6F8F55] focus:outline-none bg-white font-mono"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span>Chỉ lưu an toàn trên máy chủ của bạn.</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#3D522B] font-bold underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> Lấy key Google AI
                </a>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Model mặc định
              </label>
              <select
                value={formModel}
                onChange={e => setFormModel(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6F8F55] focus:outline-none bg-white font-semibold"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Khuyên dùng - Cực nhanh & Ổn định)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Suy luận cao cấp nhất)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ghi chú
              </label>
              <textarea
                rows={2}
                placeholder="Ghi chú về quota hoặc dự án liên quan..."
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6F8F55] focus:outline-none bg-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={formEnabled}
                  onChange={e => setFormEnabled(e.target.checked)}
                  className="w-4 h-4 text-[#6F8F55] rounded focus:ring-[#6F8F55]"
                />
                Kích hoạt API này ngay sau khi lưu
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EFE8D6]">
              <button
                type="button"
                onClick={() => {
                  handleResetForm();
                  setSubTab('list');
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSavingAndTesting}
                className="px-5 py-2 text-xs font-black text-white bg-[#6F8F55] hover:bg-[#5F7E4B] rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSavingAndTesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang kiểm tra kết nối...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingConfig ? 'Cập Nhật & Kiểm Tra' : 'Lưu & Kiểm Tra Ngay'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB 3: LOGS */}
      {subTab === 'logs' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Nhật ký thực thi các tác vụ AI gần nhất trong ứng dụng.
            </span>
            {logs.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Bạn có chắc muốn xóa sạch lịch sử gọi AI?')) {
                    apiManager.clearUsageHistory();
                  }
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa toàn bộ log</span>
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-12 bg-[#FAF7EE] rounded-2xl border border-[#DED5B8] text-slate-400 text-xs font-bold">
              Chưa có lượt gọi AI nào được ghi nhận.
            </div>
          ) : (
            <div className="border border-[#DED5B8] rounded-2xl overflow-hidden bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FAF7EE] border-b border-[#DED5B8] text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Thời gian</th>
                      <th className="p-3.5">Tính năng AI</th>
                      <th className="p-3.5">API sử dụng</th>
                      <th className="p-3.5">Model</th>
                      <th className="p-3.5">Trạng thái</th>
                      <th className="p-3.5">Độ trễ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE8D6] font-medium">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-[#FAF7EE]/50 transition">
                        <td className="p-3.5 text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString('vi-VN')} {new Date(log.timestamp).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {log.featureName.replace('/api/', '')}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-[#3D522B]">{log.apiName}</div>
                          <div className="text-[10px] text-slate-400">{log.apiEmail}</div>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-indigo-700">
                          {log.model}
                        </td>
                        <td className="p-3.5">
                          {log.status === 'SUCCESS' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              ✓ Thành công
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800" title={log.error}>
                              ✕ Thất bại
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">
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
  );
};
