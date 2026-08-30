import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Settings,
  Database,
  Trash2,
  Ban,
  CheckCircle,
  Plus,
  RefreshCw,
  Search,
  Palette,
  Sparkles,
  Gamepad2,
  Clock,
  Mail,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Sliders,
  Check,
  AlertTriangle,
  Play,
  Upload
} from 'lucide-react';
import { type QuestionBank, type AppUser, ADMIN_EMAILS, type UserActivityLog } from "../types";
import { getAllUsers, setUserBlockStatus, getActivityLogs } from '../lib/db';
import { safeAlert, safeConfirm } from '../utils/safeAlert';
import { uploadImageFile } from '../utils/imageStorage';
import { GAMES_LIST } from '../data/gamesList';
import { APP_THEMES, applyThemeToDom } from '../theme/themeConfig';

export interface WebConfig {
  siteTitle: string;
  siteSubtitle: string;
  bgImageUrl: string;
  announcement: string;
  gemConverterUrl?: string;
  primaryTheme: 'pastel' | 'brightclassroom' | 'deepspace' | 'matcha' | 'sakura' | 'sky' | 'mono';
  gameAvatars?: Record<string, string>;
}

interface AdminViewProps {
  onBackToHome: () => void;
  questionBanks: QuestionBank[];
  activeBankId: string;
  onSelectActiveBank: (bankId: string) => void;
  onDeleteBank: (id: string) => Promise<void> | void;
  onKeepOnlyLatestBank: () => void;
  onOpenBankManager: (bankId: string) => void;
  webConfig: WebConfig;
  onUpdateWebConfig: (config: WebConfig) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  onBackToHome,
  questionBanks,
  activeBankId,
  onSelectActiveBank,
  onDeleteBank,
  onKeepOnlyLatestBank,
  onOpenBankManager,
  webConfig,
  onUpdateWebConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'web' | 'banks' | 'limits' | 'logs'>('users');
  const [userList, setUserList] = useState<AppUser[]>([]);
  const [activityLogs, setActivityLogs] = useState<UserActivityLog[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');

  // Web config state
  const [localConfig, setLocalConfig] = useState<WebConfig>(webConfig);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadingAvatars, setUploadingAvatars] = useState<Record<string, boolean>>({});
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);


  // Keep localConfig synced if prop changes
  useEffect(() => {
    setLocalConfig(prev => {
      if (
        prev.siteTitle !== webConfig.siteTitle ||
        prev.siteSubtitle !== webConfig.siteSubtitle ||
        prev.bgImageUrl !== webConfig.bgImageUrl ||
        prev.announcement !== webConfig.announcement ||
        prev.gemConverterUrl !== webConfig.gemConverterUrl ||
        prev.primaryTheme !== webConfig.primaryTheme ||
        JSON.stringify(prev.gameAvatars) !== JSON.stringify(webConfig.gameAvatars)
      ) {
        return webConfig;
      }
      return prev;
    });
  }, [webConfig]);


  // Fetch Firestore users
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const users = await getAllUsers();
      setUserList(users);
    } catch (e) {
      console.error('Error fetching users in admin:', e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const logs = await getActivityLogs(100);
      setActivityLogs(logs);
    } catch (e) {
      console.error('Error fetching logs:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab]);

  const handleToggleBlock = async (user: AppUser) => {
    const isCurrentlyBlocked = user.isBlocked ?? false;
    const actionText = isCurrentlyBlocked ? 'Mở khóa' : 'Chặn';
    
    if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      safeAlert('Không thể khóa tài khoản của Quản Trị Viên!');
      return;
    }

    if (!safeConfirm(`Bạn có chắc chắn muốn ${actionText} tài khoản: ${user.email}?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      await setUserBlockStatus(user.uid, !isCurrentlyBlocked);
      // Update local state
      setUserList(prev =>
        prev.map(u => (u.uid === user.uid ? { ...u, isBlocked: !isCurrentlyBlocked } : u))
      );
      safeAlert(`Đã ${actionText} thành công tài khoản ${user.email}`);
    } catch (err: any) {
      safeAlert(`Lỗi khi ${actionText} tài khoản: ` + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>, gameId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      safeAlert("Vui lòng chọn ảnh nhỏ hơn 10MB");
      return;
    }

    setUploadingAvatars(prev => ({ ...prev, [gameId]: true }));

    try {
      const secureOrDataUrl = await uploadImageFile(file, null, 400);
      if (secureOrDataUrl) {
        const updated = {
          ...localConfig,
          gameAvatars: {
            ...(localConfig.gameAvatars || {}),
            [gameId]: secureOrDataUrl
          }
        };
        setLocalConfig(updated);
        onUpdateWebConfig(updated);
      }
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      safeAlert("Có lỗi xảy ra khi tải ảnh: " + (error?.message || "Vui lòng thử lại"));
    } finally {
      setUploadingAvatars(prev => ({ ...prev, [gameId]: false }));
      e.target.value = '';
    }
  };

  const handleRemoveAvatar = (gameId: string) => {
    const nextAvatars = { ...(localConfig.gameAvatars || {}) };
    delete nextAvatars[gameId];
    const updated = {
      ...localConfig,
      gameAvatars: nextAvatars
    };
    setLocalConfig(updated);
    onUpdateWebConfig(updated);
  };

  const handleBgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      safeAlert("Vui lòng chọn ảnh nhỏ hơn 15MB");
      return;
    }

    setIsUploadingBg(true);
    try {
      const secureOrDataUrl = await uploadImageFile(file, null, 1920);
      if (secureOrDataUrl) {
        const updated = {
          ...localConfig,
          bgImageUrl: secureOrDataUrl
        };
        setLocalConfig(updated);
        onUpdateWebConfig(updated);
        safeAlert("Đã tải lên và áp dụng ảnh nền thành công!");
      }
    } catch (error: any) {
      console.error("Background upload error:", error);
      safeAlert("Có lỗi xảy ra khi tải ảnh nền: " + (error?.message || "Vui lòng thử lại"));
    } finally {
      setIsUploadingBg(false);
      e.target.value = '';
    }
  };

  const handleSaveWebConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWebConfig(localConfig);
    try {
      localStorage.setItem('wey_web_config', JSON.stringify(localConfig));
    } catch (err) {}
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const filteredUsers = userList.filter(user => {
    const query = searchUserQuery.toLowerCase().trim();
    const matchQuery =
      user.email.toLowerCase().includes(query) ||
      (user.displayName && user.displayName.toLowerCase().includes(query));

    if (userStatusFilter === 'active') {
      return matchQuery && !user.isBlocked;
    }
    if (userStatusFilter === 'blocked') {
      return matchQuery && !!user.isBlocked;
    }
    return matchQuery;
  });

  const filteredLogs = activityLogs.filter(log => {
    const query = logSearchQuery.toLowerCase().trim();
    return (
      (log.userEmail && log.userEmail.toLowerCase().includes(query)) ||
      (log.actionType && log.actionType.toLowerCase().includes(query)) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(query))
    );
  });

  const totalUsers = userList.length;
  const blockedUsersCount = userList.filter(u => u.isBlocked).length;
  const activeUsersCount = totalUsers - blockedUsersCount;

  return (
    <div className="w-full min-h-[calc(100dvh-80px)] space-y-6 animate-fade-in pb-12 overflow-y-auto">
      {/* Top Header & Breadcrumb */}
      <div className="bg-w-bg-card border border-w-border rounded-[24px] p-5 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4 wey-paper-card">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center gap-2 px-3.5 py-2 bg-w-accent-light hover:bg-w-accent-muted text-w-primary-hover font-extrabold text-xs rounded-xl border border-w-accent-border shadow-2xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay Lại Trang Chủ</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-rose-600" />
                <span>Super Admin Hub</span>
              </span>
              <span className="text-xs font-bold text-slate-500">
                • Hệ thống Quản trị Tập trung
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-[900] text-w-text-main tracking-tight mt-1">
              Bảng Quản Trị Hệ Thống Toàn Diện
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-w-bg-card border border-w-border text-xs font-bold text-w-primary">
            <span>Tổng người dùng:</span>
            <span className="px-2 py-0.5 rounded-md bg-w-accent-light text-w-primary">{totalUsers}</span>
          </div>

          <button
            type="button"
            onClick={onBackToHome}
            className="px-4 py-2 wey-btn-primary font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current text-white" />
            <span>Xem Giao Diện Game</span>
          </button>
        </div>
      </div>

      {/* Main Admin Dashboard Container */}
      <div className="bg-w-bg-card border border-w-border rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex border-b border-w-border bg-w-bg-alt px-4 sm:px-6 pt-3 gap-2 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'users'
                ? 'border-w-primary text-w-primary bg-w-bg-card shadow-xs'
                : 'border-transparent text-w-text-muted hover:text-w-text-main'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Người Dùng ({totalUsers})</span>
          </button>

          <button
            onClick={() => setActiveTab('limits')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'limits'
                ? 'border-w-primary text-w-primary bg-w-bg-card shadow-xs'
                : 'border-transparent text-w-text-muted hover:text-w-text-main'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Lượt Chơi Khách (3 Lượt/Ngày)</span>
          </button>

          <button
            onClick={() => setActiveTab('web')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'web'
                ? 'border-w-primary text-w-primary bg-w-bg-card shadow-xs'
                : 'border-transparent text-w-text-muted hover:text-w-text-main'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Giao Diện & Background</span>
          </button>

          <button
            onClick={() => setActiveTab('banks')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'banks'
                ? 'border-w-primary text-w-primary bg-w-bg-card shadow-xs'
                : 'border-transparent text-w-text-muted hover:text-w-text-main'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Bộ Câu Hỏi ({questionBanks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'logs'
                ? 'border-w-primary text-w-primary bg-w-bg-card shadow-xs'
                : 'border-transparent text-w-text-muted hover:text-w-text-main'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Nhật Ký Tài Khoản ({activityLogs.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 sm:p-8 space-y-6">
          {/* TAB 1: USERS MANAGEMENT & BLOCKING */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-w-bg-alt border border-w-border p-4 rounded-2xl">
                  <div className="text-xs font-bold text-slate-500">Tổng tài khoản</div>
                  <div className="text-2xl font-black text-w-text-main mt-1">{totalUsers}</div>
                </div>
                <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl">
                  <div className="text-xs font-bold text-emerald-700">Đang hoạt động</div>
                  <div className="text-2xl font-black text-emerald-800 mt-1">{activeUsersCount}</div>
                </div>
                <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-2xl">
                  <div className="text-xs font-bold text-rose-700">Đã bị chặn</div>
                  <div className="text-2xl font-black text-rose-800 mt-1">{blockedUsersCount}</div>
                </div>
              </div>

              {/* Control Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-w-bg-alt p-3.5 rounded-2xl border border-w-border">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchUserQuery}
                    onChange={e => setSearchUserQuery(e.target.value)}
                    placeholder="Tìm theo email hoặc tên hiển thị..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-w-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-w-primary"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={userStatusFilter}
                    onChange={e => setUserStatusFilter(e.target.value as any)}
                    className="px-3 py-2 bg-white border border-w-border rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="blocked">Bị khóa (Chặn)</option>
                  </select>

                  <button
                    onClick={fetchUsers}
                    disabled={isLoadingUsers}
                    className="p-2 bg-white hover:bg-w-accent-light text-w-primary-dark border border-w-border rounded-xl transition cursor-pointer"
                    title="Làm mới danh sách"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="border border-w-border rounded-2xl overflow-hidden shadow-2xs">
                {isLoadingUsers ? (
                  <div className="p-12 text-center text-slate-400 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-w-primary" />
                    <p className="text-xs font-bold">Đang tải danh sách người dùng...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-600">Không tìm thấy người dùng nào</p>
                    <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-w-bg-alt border-b border-w-border text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
                          <th className="p-4">Người dùng</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Vai trò</th>
                          <th className="p-4">Trạng thái</th>
                          <th className="p-4">Đăng nhập gần nhất</th>
                          <th className="p-4 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-w-border">
                        {filteredUsers.map(u => {
                          const isAdmin = ADMIN_EMAILS.includes(u.email.toLowerCase());
                          const isBlocked = !!u.isBlocked;
                          return (
                            <tr key={u.uid} className="hover:bg-w-bg-alt/50 transition">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-w-accent-light border border-w-accent-border flex items-center justify-center text-sm font-black text-w-primary-hover shrink-0">
                                    {u.displayName ? u.displayName.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-800">{u.displayName || 'Người dùng'}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">UID: {u.uid.slice(0, 8)}...</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 font-mono font-medium text-slate-700">{u.email}</td>
                              <td className="p-4">
                                {isAdmin ? (
                                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-extrabold text-[10px] inline-flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                                    <span>Super Admin</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold text-[10px]">
                                    Giáo Viên / Học Sinh
                                  </span>
                                )}
                              </td>
                              <td className="p-4">
                                {isBlocked ? (
                                  <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-extrabold text-[10px] inline-flex items-center gap-1">
                                    <Ban className="w-3 h-3 text-rose-600" />
                                    <span>Đã Chặn</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[10px] inline-flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    <span>Hoạt Động</span>
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-slate-500">
                                {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('vi-VN') : 'Mới đăng ký'}
                              </td>
                              <td className="p-4 text-right">
                                {isAdmin ? (
                                  <span className="text-[11px] text-slate-400 italic">Mặc định quyền Admin</span>
                                ) : (
                                  <button
                                    onClick={() => handleToggleBlock(u)}
                                    disabled={isProcessing}
                                    className={`px-3 py-1.5 rounded-xl font-bold text-[11px] border transition cursor-pointer shadow-2xs ${
                                      isBlocked
                                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                                    }`}
                                  >
                                    {isBlocked ? 'Mở Chặn' : 'Chặn Tài Khoản'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LIMITS & GUEST PLAY */}
          {activeTab === 'limits' && (
            <div className="space-y-6">
              <div className="bg-w-bg-alt border border-w-border p-5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-w-primary" />
                  <h3 className="font-extrabold text-w-text-main text-base">Cơ Chế Giới Hạn Lượt Chơi Khách</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Để khuyến khích giáo viên và học sinh đăng nhập, hệ thống tự động áp dụng chính sách:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-4 rounded-xl bg-white border border-w-border">
                    <div className="font-black text-w-text-main text-sm">👤 Khách vãng lai (Chưa đăng nhập)</div>
                    <p className="text-xs text-slate-500 mt-1">Giới hạn <strong>3 lượt chơi / ngày</strong>. Khi hết lượt hệ thống hiển thị popup yêu cầu đăng nhập.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <div className="font-black text-emerald-900 text-sm">✨ Đã Đăng Nhập Google</div>
                    <p className="text-xs text-emerald-700 mt-1"><strong>KHÔNG GIỚI HẠN</strong> số lượt chơi và toàn quyền truy cập tất cả tính năng trò chơi.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WEB CONFIG & BACKGROUND */}
          {activeTab === 'web' && (
            <form onSubmit={handleSaveWebConfig} className="space-y-6 max-w-3xl">
              <div className="space-y-6">
                {/* Theme Selector */}
                <div className="p-4 bg-w-bg-alt rounded-2xl border border-w-border space-y-3">
                  <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-w-primary" />
                    <label className="text-xs font-black text-w-text-main uppercase">
                      Theme Chủ Đạo Toàn Web (Color Scheme)
                    </label>
                  </div>
                  <p className="text-xs text-w-text-muted">
                    Chọn phong cách màu sắc hiển thị toàn hệ thống (nút, bảng điểm, viền và thẻ trò chơi).
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {APP_THEMES.map(th => {
                      const isSelected = (localConfig.primaryTheme || 'pastel') === th.id;
                      const { colors } = th;
                      return (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => {
                            const newTheme = th.id;
                            const updated = { ...localConfig, primaryTheme: newTheme };
                            setLocalConfig(updated);
                            onUpdateWebConfig(updated);
                            applyThemeToDom(newTheme);
                          }}
                          className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col gap-2.5 relative ${
                            isSelected
                              ? 'border-w-primary shadow-md ring-2 ring-w-primary/30 scale-[1.01]'
                              : 'border-w-border hover:border-w-border-hover hover:shadow-xs'
                          }`}
                          style={{ backgroundColor: colors.bgCard }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{th.icon}</span>
                              <div>
                                <span 
                                  className="text-xs font-[900] block"
                                  style={{ color: colors.textMain }}
                                >
                                  {th.name}
                                </span>
                                <span 
                                  className="text-[10px] font-[600] line-clamp-1"
                                  style={{ color: colors.textMuted }}
                                >
                                  {th.desc}
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <span 
                                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                                style={{ backgroundColor: colors.primary }}
                              >
                                ✓
                              </span>
                            )}
                          </div>

                          {/* Palette preview bar */}
                          <div 
                            className="p-1.5 rounded-lg border grid grid-cols-5 gap-1 h-5 overflow-hidden"
                            style={{ backgroundColor: colors.bgMain, borderColor: colors.border }}
                          >
                            <div className="rounded-xs" title="Nền" style={{ backgroundColor: colors.bgMain }} />
                            <div className="rounded-xs" title="Mặt phẳng" style={{ backgroundColor: colors.bgCard }} />
                            <div className="rounded-xs" title="Màu chính" style={{ backgroundColor: colors.primary }} />
                            <div className="rounded-xs" title="Nhấn" style={{ backgroundColor: colors.accentMuted }} />
                            <div className="rounded-xs" title="Văn bản" style={{ backgroundColor: colors.textMain }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Site Title & Subtitle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-w-text-main uppercase mb-1">
                      Tiêu Đề Trang Web
                    </label>
                    <input
                      type="text"
                      value={localConfig.siteTitle}
                      onChange={e => {
                        const val = e.target.value;
                        setLocalConfig(prev => ({ ...prev, siteTitle: val }));
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-w-border rounded-xl text-xs focus:ring-2 focus:ring-w-primary"
                      placeholder="WEY'S PLAYGROUND..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-w-text-main uppercase mb-1">
                      Phụ Đề / Slogan
                    </label>
                    <input
                      type="text"
                      value={localConfig.siteSubtitle}
                      onChange={e => {
                        const val = e.target.value;
                        setLocalConfig(prev => ({ ...prev, siteSubtitle: val }));
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-w-border rounded-xl text-xs focus:ring-2 focus:ring-w-primary"
                      placeholder="Kho Game Online Sinh Động Của Wey..."
                    />
                  </div>
                </div>

                {/* Custom Background Wallpaper */}
                <div className="p-4 bg-w-bg-alt rounded-2xl border border-w-border space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-w-text-main uppercase flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Hình Nền Trang Chủ (Background Wallpaper)</span>
                    </label>
                    {localConfig.bgImageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...localConfig, bgImageUrl: '/assets/home-bg.webp' };
                          setLocalConfig(updated);
                          onUpdateWebConfig(updated);
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Mặc Định Lớp Học</span>
                      </button>
                    )}
                  </div>

                  {/* Preview Banner */}
                  {localConfig.bgImageUrl && (
                    <div className="relative w-full h-28 rounded-xl overflow-hidden border border-w-border shadow-2xs group">
                      <img 
                        src={localConfig.bgImageUrl} 
                        alt="Background Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/home-bg.webp';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-extrabold bg-black/60 px-3 py-1 rounded-full">
                          Hình nền đang áp dụng trực tiếp
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={localConfig.bgImageUrl}
                      onChange={e => {
                        const val = e.target.value;
                        setLocalConfig(prev => ({ ...prev, bgImageUrl: val }));
                      }}
                      className="flex-1 px-3.5 py-2.5 bg-white border border-w-border rounded-xl text-xs focus:ring-2 focus:ring-w-primary"
                      placeholder="Dán liên kết ảnh URL (https://...)"
                    />
                    
                    <label 
                      className={`flex items-center justify-center gap-1.5 px-4 py-2.5 bg-w-accent-light hover:bg-w-accent-muted text-w-primary-hover font-bold text-xs border border-w-accent-border rounded-xl transition ${
                        isUploadingBg ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer shadow-2xs'
                      }`}
                      title="Tải ảnh nền từ máy tính hoặc điện thoại"
                    >
                      {isUploadingBg ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-w-primary" />
                          <span>Đang nén & tải...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Tải Ảnh Lên</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingBg}
                        onChange={handleBgImageUpload}
                      />
                    </label>
                  </div>

                  {/* Preset Background Options */}
                  <div className="pt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-w-text-muted">Gợi ý mẫu nền:</span>
                    {[
                      { name: '🏫 Lớp Học Pastel', url: '/assets/home-bg.webp' },
                      { name: '🌸 Sakura Mơ Màng', url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1600&auto=format&fit=crop&q=80' },
                      { name: '🌲 Rừng Cây Tươi Mát', url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?w=1600&auto=format&fit=crop&q=80' },
                      { name: '🌌 Dải Ngân Hà', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80' },
                      { name: '🌊 Đại Dương Xanh', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80' },
                    ].map(p => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          const updated = { ...localConfig, bgImageUrl: p.url };
                          setLocalConfig(updated);
                          onUpdateWebConfig(updated);
                        }}
                        className="text-[10px] font-bold px-2.5 py-1 bg-white hover:bg-w-accent-light text-w-text-main rounded-lg border border-w-border transition cursor-pointer"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Announcement Banner */}
                <div>
                  <label className="block text-xs font-black text-w-text-main uppercase mb-1">
                    Thông Báo Đầu Trang (Announcement Banner)
                  </label>
                  <input
                    type="text"
                    value={localConfig.announcement}
                    onChange={e => {
                      const val = e.target.value;
                      setLocalConfig(prev => ({ ...prev, announcement: val }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-w-border rounded-xl text-xs focus:ring-2 focus:ring-w-primary"
                    placeholder="Chào mừng quý thầy cô và các em học sinh tham gia sân chơi tương tác..."
                  />
                </div>

                {/* Gem Converter Link for Teachers */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-black text-w-text-main uppercase">
                      Liên Kết Gem Chuyển Đổi Format Câu Hỏi (Gemini / AI Converter)
                    </label>
                    <span className="text-[10px] font-bold text-w-primary bg-w-accent-light px-2 py-0.5 rounded-md border border-w-accent-border">
                      Dành cho Giáo Viên
                    </span>
                  </div>
                  <input
                    type="url"
                    value={localConfig.gemConverterUrl || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setLocalConfig(prev => ({ ...prev, gemConverterUrl: val }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-w-border rounded-xl text-xs focus:ring-2 focus:ring-w-primary font-mono text-slate-700"
                    placeholder="https://gemini.google.com/gems/... hoặc link công cụ chuyển đổi đề thi"
                  />
                  <p className="text-[11px] text-w-text-muted mt-1">
                    Khi nhập link này, nút <strong>"🤖 Chuyển Đổi Bằng Gem AI"</strong> sẽ xuất hiện trực tiếp tại cửa sổ nạp & soạn câu hỏi để thầy cô bấm vào chuyển đổi định dạng tài liệu nhanh chóng.
                  </p>
                </div>
                
                {/* Game Avatars & Icons */}
                <div className="pt-6 border-t border-w-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="w-5 h-5 text-w-primary" />
                      <h3 className="text-sm font-black text-w-text-main uppercase">
                        Ảnh Đại Diện & Biểu Tượng Các Game
                      </h3>
                    </div>
                    {Object.keys(localConfig.gameAvatars || {}).length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (safeConfirm('Khôi phục toàn bộ icon mặc định cho tất cả game?')) {
                            const updated = { ...localConfig, gameAvatars: {} };
                            setLocalConfig(updated);
                            onUpdateWebConfig(updated);
                          }
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Xóa tất cả avatar tùy chỉnh</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-w-text-muted">
                    Tải ảnh từ máy tính hoặc dán liên kết URL để thay đổi biểu tượng của từng trò chơi trên màn hình trang chủ. 
                    Hệ thống tự động nén tối ưu (WebP) để load nhanh và hoạt động bền vững 100%.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
                    {GAMES_LIST.map((game) => {
                      const avatarUrl = (localConfig.gameAvatars || {})[game.id] || '';
                      const isUploading = !!uploadingAvatars[game.id];
                      
                      return (
                        <div 
                          key={game.id} 
                          className="p-3.5 bg-w-bg-card rounded-2xl border border-w-border hover:border-w-accent-border transition-all flex flex-col justify-between gap-2.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-w-accent-light border border-w-accent-border flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                                {avatarUrl ? (
                                  <img 
                                    src={avatarUrl} 
                                    alt={game.title} 
                                    className="w-full h-full object-cover" 
                                  />
                                ) : (
                                  <span className="text-lg">{game.icon}</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-black text-w-text-main truncate">
                                  {game.title}
                                </h4>
                                <span className="text-[10px] font-bold text-w-text-muted">
                                  {avatarUrl ? 'Đang dùng ảnh tùy chỉnh' : 'Dùng icon mặc định'}
                                </span>
                              </div>
                            </div>

                            {avatarUrl && (
                              <button
                                type="button"
                                onClick={() => handleRemoveAvatar(game.id)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Xóa ảnh và dùng lại icon gốc"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="flex gap-2 items-center">
                            <input
                              type="url"
                              value={avatarUrl}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLocalConfig(prev => ({
                                  ...prev,
                                  gameAvatars: {
                                    ...(prev.gameAvatars || {}),
                                    [game.id]: val
                                  }
                                }));
                              }}
                              className="flex-1 px-3 py-2 bg-white border border-w-border rounded-xl text-[11px] focus:ring-2 focus:ring-w-primary"
                              placeholder="Dán URL ảnh..."
                            />
                            
                            <label 
                              className={`flex items-center justify-center px-3 py-2 shrink-0 bg-w-accent-light hover:bg-w-accent-muted text-w-primary-hover border border-w-accent-border rounded-xl transition ${
                                isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer shadow-2xs'
                              }`} 
                              title="Tải ảnh avatar từ thiết bị"
                            >
                              {isUploading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-w-primary" />
                              ) : (
                                <div className="flex items-center gap-1 text-[11px] font-bold">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Tải ảnh</span>
                                </div>
                              )}
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                disabled={isUploading}
                                onChange={(e) => handleAvatarUpload(e, game.id)}
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-w-border">
                <button
                  type="submit"
                  className={`px-6 py-2.5 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2 hover:-translate-y-0.5 ${
                    saveSuccess ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-w-primary hover:bg-w-primary-hover'
                  }`}
                >
                  <Check className={`w-4 h-4 ${saveSuccess ? 'animate-bounce' : ''}`} />
                  <span>{saveSuccess ? 'Đã Lưu Thành Công!' : 'Lưu Toàn Bộ Cấu Hình & Giao Diện'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: QUESTION BANKS */}
          {activeTab === 'banks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3 bg-w-bg-alt p-3.5 rounded-2xl border border-w-border">
                <div className="text-xs font-bold text-slate-700">
                  Tổng cộng: <strong>{questionBanks.length}</strong> bộ câu hỏi trong hệ thống
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (safeConfirm('Bạn có chắc muốn xóa tất cả các bộ cũ và CHỈ GIỮ LẠI bộ mới nhất?')) {
                        onKeepOnlyLatestBank();
                      }
                    }}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Chỉ Giữ Bộ Mới Nhất</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {questionBanks.map(b => {
                  const isActive = b.id === activeBankId;
                  return (
                    <div
                      key={b.id}
                      className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-3 ${
                        isActive
                          ? 'bg-w-accent-light/70 border-w-primary shadow-xs'
                          : 'bg-white border-w-border hover:border-w-accent-border'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white border border-w-border text-slate-600">
                            {b.subject || 'Tổng hợp'} • {b.grade || 'Chung'}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-w-primary text-white">
                              Đang dùng
                            </span>
                          )}
                        </div>
                        <h4 className="font-black text-slate-800 text-sm mt-2">{b.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">{b.questions.length} câu hỏi</p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-w-border">
                        <button
                          onClick={() => onSelectActiveBank(b.id)}
                          className="flex-1 py-1.5 bg-white hover:bg-w-bg-alt text-w-primary-dark text-xs font-bold rounded-lg border border-w-border transition cursor-pointer"
                        >
                          Chọn Dùng
                        </button>
                        <button
                          onClick={() => onOpenBankManager(b.id)}
                          className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition cursor-pointer"
                          title="Chỉnh sửa bộ câu hỏi"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (safeConfirm(`Xóa bộ câu hỏi "${b.name}"?`)) {
                              await onDeleteBank(b.id);
                              safeAlert('Đã xóa bộ câu hỏi thành công!');
                            }
                          }}
                          className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 rounded-lg border border-rose-200 transition cursor-pointer"
                          title="Xóa bộ này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-w-bg-alt p-3.5 rounded-2xl border border-w-border">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={e => setLogSearchQuery(e.target.value)}
                    placeholder="Tìm nhật ký theo email, hành động..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-w-border rounded-xl text-xs focus:ring-2 focus:ring-w-primary"
                  />
                </div>

                <button
                  onClick={fetchLogs}
                  disabled={isLoadingLogs}
                  className="p-2 bg-white hover:bg-w-accent-light text-w-primary-dark border border-w-border rounded-xl transition cursor-pointer"
                  title="Làm mới nhật ký"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Logs Table */}
              <div className="border border-w-border rounded-2xl overflow-hidden">
                {isLoadingLogs ? (
                  <div className="p-12 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-w-primary" />
                    <p className="text-xs font-bold mt-2">Đang tải nhật ký...</p>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <Clock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-600">Chưa có nhật ký hoạt động nào</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-w-bg-alt border-b border-w-border text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
                          <th className="p-4">Thời gian</th>
                          <th className="p-4">Người dùng</th>
                          <th className="p-4">Hành động</th>
                          <th className="p-4">Chi tiết</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-w-border">
                        {filteredLogs.map(log => (
                          <tr key={log.id} className="hover:bg-w-bg-alt/50 transition">
                            <td className="p-4 text-slate-500 whitespace-nowrap">
                              {log.timestamp ? new Date(log.timestamp).toLocaleString('vi-VN') : '--'}
                            </td>
                            <td className="p-4 font-mono font-medium text-slate-800">
                              {log.userEmail || 'Khách (Chưa đăng nhập)'}
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded-full bg-w-accent-light text-w-primary-hover font-extrabold text-[10px]">
                                {log.actionType}
                              </span>
                            </td>
                            <td className="p-4 text-slate-600 font-mono text-[11px] max-w-xs truncate">
                              {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || '')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
