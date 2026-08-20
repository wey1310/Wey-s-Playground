import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Key,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Zap,
  ChevronDown,
  Settings,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers
} from 'lucide-react';
import { apiManager } from '../../services/apiManager';
import { GeminiApiConfig, ApiStatus } from '../../types';

interface NavbarApiStatusProps {
  onOpenSelectModal: () => void;
  onOpenManagerModal: () => void;
}

export const NavbarApiStatus: React.FC<NavbarApiStatusProps> = ({
  onOpenSelectModal,
  onOpenManagerModal,
}) => {
  const [activeApi, setActiveApi] = useState<GeminiApiConfig | null>(() => apiManager.getActiveApi());
  const [allConfigs, setAllConfigs] = useState<GeminiApiConfig[]>(() => apiManager.getConfigs());
  const [isOpen, setIsOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync with apiManager events
  const syncState = () => {
    setActiveApi(apiManager.getActiveApi());
    setAllConfigs(apiManager.getConfigs());
  };

  useEffect(() => {
    syncState();
    const unsubscribe = apiManager.subscribe(syncState);
    return () => unsubscribe();
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

  // Determine current overall health status
  const getHealthInfo = () => {
    if (!activeApi) {
      const hasConfigs = allConfigs.length > 0;
      return {
        badgeType: 'none',
        label: hasConfigs ? 'Chưa chọn API' : 'Thiếu API Key',
        shortLabel: 'Thiếu API',
        bgClass: 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 ring-2 ring-rose-400/30',
        dotClass: 'bg-rose-500',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-bounce" />,
        isError: true,
        title: 'Chưa có API Gemini nào được kích hoạt!',
        subtitle: hasConfigs 
          ? 'Hệ thống đã lưu danh sách API nhưng chưa chọn API mặc định để chạy.'
          : 'Chưa có API Key nào được cài đặt trong hệ thống.',
      };
    }

    if (activeApi.status === 'ACTIVE') {
      return {
        badgeType: 'active',
        label: `${activeApi.name || 'Gemini API'}${activeApi.responseTimeMs ? ` (${activeApi.responseTimeMs}ms)` : ''}`,
        shortLabel: 'API Sẵn Sàng',
        bgClass: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-xs',
        dotClass: 'bg-emerald-500',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
        isError: false,
        title: 'API Hoạt Động Bình Thường',
        subtitle: `Kết nối ổn định với mô hình ${activeApi.model || 'gemini-2.5-flash'}.`,
      };
    }

    if (activeApi.status === 'CHECKING') {
      return {
        badgeType: 'checking',
        label: 'Đang kiểm tra API...',
        shortLabel: 'Đang kiểm tra',
        bgClass: 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-300',
        dotClass: 'bg-sky-500',
        icon: <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin" />,
        isError: false,
        title: 'Đang kiểm tra kết nối API',
        subtitle: 'Hệ thống đang gửi tín hiệu xác thực tới Gemini API...',
      };
    }

    if (activeApi.status === 'UNCHECKED') {
      return {
        badgeType: 'unchecked',
        label: `${activeApi.name || 'Gemini API'} (Chưa test)`,
        shortLabel: 'Chưa kiểm tra',
        bgClass: 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300',
        dotClass: 'bg-amber-500',
        icon: <Zap className="w-3.5 h-3.5 text-amber-600" />,
        isError: false,
        title: 'API Chưa Được Kiểm Tra',
        subtitle: 'Khuyên dùng kiểm tra nhanh để đảm bảo tính năng AI hoạt động mượt mà.',
      };
    }

    // Error / Rate Limited / Invalid / Quota Exceeded
    const isRateLimit = activeApi.status === 'RATE_LIMITED' || activeApi.status === 'QUOTA_EXCEEDED';
    return {
      badgeType: 'error',
      label: isRateLimit ? 'Hết Quota / Giới Hạn' : 'Lỗi Kết Nối API',
      shortLabel: 'Lỗi API',
      bgClass: 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-400 ring-2 ring-rose-400/40 animate-pulse',
      dotClass: 'bg-rose-600',
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />,
      isError: true,
      title: isRateLimit ? 'Hạn Mức API Đã Hết (Rate Limit)' : 'API Đang Gặp Sự Cố',
      subtitle: activeApi.lastError || 'Không thể kết nối hoặc API Key bị từ chối từ Gemini.',
    };
  };

  const health = getHealthInfo();

  // Test active API directly
  const handleQuickValidate = async () => {
    if (!activeApi) return;
    setIsTesting(true);
    setTestFeedback(null);
    try {
      const res = await apiManager.validateApi(activeApi);
      if (res.success && res.status === 'ACTIVE') {
        setTestFeedback({
          success: true,
          msg: `✓ API hoạt động tốt (${res.responseTimeMs}ms)`,
        });
      } else {
        setTestFeedback({
          success: false,
          msg: `❌ ${res.error || 'Kiểm tra thất bại'}`,
        });
      }
    } catch (e: any) {
      setTestFeedback({
        success: false,
        msg: `❌ Lỗi: ${e.message || 'Không thể kiểm tra'}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div id="navbar-api-status-container" className="relative inline-block text-left" ref={containerRef}>
      {/* Navbar Trigger Button */}
      <button
        id="navbar-api-status-trigger"
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setTestFeedback(null);
        }}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-[16px] text-xs font-[700] border transition-all duration-200 cursor-pointer select-none ${health.bgClass}`}
        title="Trạng thái kết nối Gemini AI API"
      >
        {/* Pulsing Status Dot */}
        <span className="relative flex h-2 w-2">
          {health.badgeType === 'active' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          {health.badgeType === 'error' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          )}
          {health.badgeType === 'none' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${health.dotClass}`} />
        </span>

        {/* Icon */}
        <span className="shrink-0">{health.icon}</span>

        {/* Text Label */}
        <span className="hidden sm:inline max-w-[140px] md:max-w-[180px] truncate">
          {health.label}
        </span>
        <span className="sm:hidden">
          {health.shortLabel}
        </span>

        <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Interactive Status Popover & Warning Details */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="navbar-api-status-dropdown"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 mt-2 w-[320px] sm:w-[360px] bg-white rounded-[22px] shadow-[0_12px_36px_rgba(0,0,0,0.16)] border-2 border-[#E2EED3] p-4.5 z-50 overflow-hidden font-sans text-slate-800"
          >
            {/* Header / Health Banner */}
            <div className={`p-3 rounded-[16px] mb-3 flex items-start gap-3 border ${
              health.isError 
                ? 'bg-rose-50 border-rose-200 text-rose-900' 
                : health.badgeType === 'active'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="mt-0.5 shrink-0">
                {health.isError ? (
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                ) : health.badgeType === 'active' ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Activity className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-[800] leading-tight">
                  {health.title}
                </h4>
                <p className="text-[11px] font-[600] opacity-90 mt-1 leading-normal break-words">
                  {health.subtitle}
                </p>
              </div>
            </div>

            {/* Warning Prompt Box if No Active API or Error */}
            {health.isError && (
              <div className="mb-3.5 p-3 bg-amber-50/90 border border-amber-200/80 rounded-[14px] text-amber-950">
                <div className="flex items-center gap-1.5 text-xs font-[800] mb-1 text-amber-900">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>Hướng dẫn khắc phục:</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed font-[500]">
                  {!activeApi 
                    ? 'Nhấn "Chọn API Khác" bên dưới để kích hoạt một API có sẵn hoặc "Quản Lý API" để thêm API Key mới miễn phí.'
                    : 'API hiện tại không phản hồi. Bạn có thể nhấn "Kiểm Tra Lại" hoặc chuyển sang API dự phòng khác.'}
                </p>
              </div>
            )}

            {/* Active API Details Card (if API exists) */}
            {activeApi && (
              <div className="bg-slate-50 border border-slate-200 rounded-[16px] p-3 mb-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-[700] text-slate-500">Tên cấu hình:</span>
                  <span className="font-[800] text-slate-800 max-w-[180px] truncate">{activeApi.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-[700] text-slate-500">Email:</span>
                  <span className="font-[600] text-slate-700 max-w-[180px] truncate">{activeApi.email || 'Mặc định'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-[700] text-slate-500">Mô hình AI:</span>
                  <span className="font-[700] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md text-[10px]">
                    {activeApi.model || 'gemini-2.5-flash'}
                  </span>
                </div>
                {activeApi.responseTimeMs !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-[700] text-slate-500">Độ trễ phản hồi:</span>
                    <span className="font-[800] text-slate-800">{activeApi.responseTimeMs}ms</span>
                  </div>
                )}
                {activeApi.totalRequests !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-[700] text-slate-500">Lượt gọi AI:</span>
                    <span className="font-[600] text-slate-700">
                      {activeApi.successfulRequests || 0} thành công / {activeApi.totalRequests || 0} tổng
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Inline Test Feedback if available */}
            {testFeedback && (
              <div className={`mb-3 p-2.5 rounded-[12px] text-xs font-[700] flex items-center gap-2 ${
                testFeedback.success 
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}>
                <span>{testFeedback.msg}</span>
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              {/* If activeApi exists, provide direct Test button */}
              {activeApi && (
                <button
                  type="button"
                  onClick={handleQuickValidate}
                  disabled={isTesting}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#E9F0D9] hover:bg-[#D4E4C1] text-[#3D522B] font-[800] text-xs rounded-[14px] transition cursor-pointer border border-[#B9CDA0] disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#4F683C] ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Đang kiểm tra kết nối...' : 'Kiểm Tra Lại API Này'}</span>
                </button>
              )}

              {/* Select or switch API button */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSelectModal();
                }}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-[14px] font-[800] text-xs transition cursor-pointer shadow-xs ${
                  health.isError
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-[#4F683C] hover:bg-[#3E522F] text-[#FFFDF5]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{health.isError ? '⚡ Chọn / Kích Hoạt API Hoạt Động' : 'Đổi Sang API Khác'}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>

              {/* Full API Manager Modal button */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenManagerModal();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-[700] text-xs rounded-[14px] transition cursor-pointer border border-slate-200"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Quản Lý Danh Sách & Thêm API Mới</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
