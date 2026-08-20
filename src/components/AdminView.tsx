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
  Key
} from 'lucide-react';
import { type QuestionBank, type AppUser, ADMIN_EMAILS, type UserActivityLog } from "../types";
import { getAllUsers, setUserBlockStatus, getActivityLogs } from '../lib/db';
import { safeAlert, safeConfirm } from '../utils/safeAlert';
import { AdminApiSection } from './api/AdminApiSection';

export interface WebConfig {
  siteTitle: string;
  siteSubtitle: string;
  bgImageUrl: string;
  announcement: string;
  primaryTheme: 'matcha' | 'default' | 'pastel';
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
  const [activeTab, setActiveTab] = useState<'users' | 'apis' | 'web' | 'banks' | 'limits' | 'logs'>('users');
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

  const handleSaveWebConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWebConfig(localConfig);
    safeAlert('Đã lưu cấu hình giao diện & background thành công!');
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
    <div className="w-full min-h-[calc(100vh-80px)] space-y-6 animate-fade-in pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="bg-[#FFFDF5] border border-[#DED5B8] rounded-[24px] p-5 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4 wey-paper-card">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#E9F0D9] hover:bg-[#D4E4C1] text-[#3D522B] font-extrabold text-xs rounded-xl border border-[#B9CDA0] shadow-2xs transition cursor-pointer"
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
            <h1 className="text-xl sm:text-2xl font-[900] text-[#35452E] tracking-tight mt-1">
              Bảng Quản Trị Hệ Thống Toàn Diện
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#DED5B8] text-xs font-bold text-[#4F683C]">
            <span>Tổng người dùng:</span>
            <span className="px-2 py-0.5 rounded-md bg-[#E9F0D9] text-[#2D3F22]">{totalUsers}</span>
          </div>

          <button
            type="button"
            onClick={onBackToHome}
            className="px-4 py-2 bg-[#6F8F55] hover:bg-[#5F7E4B] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current text-[#E9D58F]" />
            <span>Xem Giao Diện Game</span>
          </button>
        </div>
      </div>

      {/* Main Admin Dashboard Container */}
      <div className="bg-white border border-[#DED5B8] rounded-[24px] shadow-[0_10px_30px_rgba(79,104,60,0.08)] overflow-hidden flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#DED5B8] bg-[#FAF7EE] px-4 sm:px-6 pt-3 gap-2 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'users'
                ? 'border-[#6F8F55] text-[#4F683C] bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Người Dùng ({totalUsers})</span>
          </button>

          <button
            onClick={() => setActiveTab('apis')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'apis'
                ? 'border-[#6F8F55] text-[#4F683C] bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-4 h-4 text-amber-500" />
            <span>🔑 Quản Lý API (Gemini)</span>
          </button>

          <button
            onClick={() => setActiveTab('limits')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'limits'
                ? 'border-[#6F8F55] text-[#4F683C] bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Lượt Chơi Khách (3 Lượt/Ngày)</span>
          </button>

          <button
            onClick={() => setActiveTab('web')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'web'
                ? 'border-[#6F8F55] text-[#4F683C] bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Giao Diện & Background</span>
          </button>

          <button
            onClick={() => setActiveTab('banks')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'banks'
                ? 'border-[#6F8F55] text-[#4F683C] bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Bộ Câu Hỏi ({questionBanks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'logs'
                ? 'border-[#6F8F55] text-[#4F683C] bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
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
                <div className="bg-[#FAF7EE] border border-[#DED5B8] p-4 rounded-2xl">
                  <div className="text-xs font-bold text-slate-500">Tổng tài khoản</div>
                  <div className="text-2xl font-black text-[#35452E] mt-1">{totalUsers}</div>
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
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FAF7EE] p-3.5 rounded-2xl border border-[#DED5B8]">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchUserQuery}
                    onChange={e => setSearchUserQuery(e.target.value)}
                    placeholder="Tìm theo email hoặc tên hiển thị..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-[#DED5B8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#6F8F55]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={userStatusFilter}
                    onChange={e => setUserStatusFilter(e.target.value as any)}
                    className="px-3 py-2 bg-white border border-[#DED5B8] rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="blocked">Bị khóa (Chặn)</option>
                  </select>

                  <button
                    onClick={fetchUsers}
                    disabled={isLoadingUsers}
                    className="p-2 bg-white hover:bg-[#E9F0D9] text-[#4F683C] border border-[#DED5B8] rounded-xl transition cursor-pointer"
                    title="Làm mới danh sách"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="border border-[#DED5B8] rounded-2xl overflow-hidden shadow-2xs">
                {isLoadingUsers ? (
                  <div className="p-12 text-center text-slate-400 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#6F8F55]" />
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
                        <tr className="bg-[#FAF7EE] border-b border-[#DED5B8] text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
                          <th className="p-4">Người dùng</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Vai trò</th>
                          <th className="p-4">Trạng thái</th>
                          <th className="p-4">Đăng nhập gần nhất</th>
                          <th className="p-4 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFE8D6]">
                        {filteredUsers.map(u => {
                          const isAdmin = ADMIN_EMAILS.includes(u.email.toLowerCase());
                          const isBlocked = !!u.isBlocked;
                          return (
                            <tr key={u.uid} className="hover:bg-[#FAF7EE]/50 transition">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-[#E9F0D9] border border-[#B9CDA0] flex items-center justify-center text-sm font-black text-[#3D522B] shrink-0">
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

          {/* TAB: GEMINI API MANAGER */}
          {activeTab === 'apis' && (
            <AdminApiSection />
          )}

          {/* TAB 2: LIMITS & GUEST PLAY */}
          {activeTab === 'limits' && (
            <div className="space-y-6">
              <div className="bg-[#FAF7EE] border border-[#DED5B8] p-5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-[#6F8F55]" />
                  <h3 className="font-extrabold text-[#35452E] text-base">Cơ Chế Giới Hạn Lượt Chơi Khách</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Để khuyến khích giáo viên và học sinh đăng nhập, hệ thống tự động áp dụng chính sách:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-4 rounded-xl bg-white border border-[#DED5B8]">
                    <div className="font-black text-[#35452E] text-sm">👤 Khách vãng lai (Chưa đăng nhập)</div>
                    <p className="text-xs text-slate-500 mt-1">Giới hạn <strong>3 lượt chơi / ngày</strong>. Khi hết lượt hệ thống hiển thị popup yêu cầu đăng nhập.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <div className="font-black text-emerald-900 text-sm">✨ Đã Đăng Nhập Google</div>
                    <p className="text-xs text-emerald-700 mt-1"><strong>KHÔNG GIỚI HẠN</strong> số lượt chơi và số lần tạo câu hỏi AI.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WEB CONFIG & BACKGROUND */}
          {activeTab === 'web' && (
            <form onSubmit={handleSaveWebConfig} className="space-y-6 max-w-2xl">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-[#35452E] uppercase mb-1">
                    Tiêu Đề Trang Web
                  </label>
                  <input
                    type="text"
                    value={localConfig.siteTitle}
                    onChange={e => setLocalConfig({ ...localConfig, siteTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DED5B8] rounded-xl text-xs focus:ring-2 focus:ring-[#6F8F55]"
                    placeholder="WEY'S PLAYGROUND..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#35452E] uppercase mb-1">
                    Phụ Đề / Slogan
                  </label>
                  <input
                    type="text"
                    value={localConfig.siteSubtitle}
                    onChange={e => setLocalConfig({ ...localConfig, siteSubtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DED5B8] rounded-xl text-xs focus:ring-2 focus:ring-[#6F8F55]"
                    placeholder="Sân chơi câu hỏi tương tác dành cho giáo dục..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#35452E] uppercase mb-1">
                    URL Hình Nền Tùy Chỉnh (Background Image)
                  </label>
                  <input
                    type="url"
                    value={localConfig.bgImageUrl}
                    onChange={e => setLocalConfig({ ...localConfig, bgImageUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DED5B8] rounded-xl text-xs focus:ring-2 focus:ring-[#6F8F55]"
                    placeholder="https://images.unsplash.com/..."
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Để trống nếu muốn dùng màu nền Matcha Warm mặc định.</p>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#35452E] uppercase mb-1">
                    Thông Báo Đầu Trang (Announcement Banner)
                  </label>
                  <input
                    type="text"
                    value={localConfig.announcement}
                    onChange={e => setLocalConfig({ ...localConfig, announcement: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DED5B8] rounded-xl text-xs focus:ring-2 focus:ring-[#6F8F55]"
                    placeholder="Chào mừng quý thầy cô và các em học sinh..."
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#6F8F55] hover:bg-[#5F7E4B] text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu Cấu Hình Giao Diện</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: QUESTION BANKS */}
          {activeTab === 'banks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3 bg-[#FAF7EE] p-3.5 rounded-2xl border border-[#DED5B8]">
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
                          ? 'bg-[#E9F0D9]/70 border-[#6F8F55] shadow-xs'
                          : 'bg-white border-[#DED5B8] hover:border-[#B9CDA0]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white border border-[#DED5B8] text-slate-600">
                            {b.subject || 'Tổng hợp'} • {b.grade || 'Chung'}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6F8F55] text-white">
                              Đang dùng
                            </span>
                          )}
                        </div>
                        <h4 className="font-black text-slate-800 text-sm mt-2">{b.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">{b.questions.length} câu hỏi</p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-[#EFE8D6]">
                        <button
                          onClick={() => onSelectActiveBank(b.id)}
                          className="flex-1 py-1.5 bg-white hover:bg-[#FAF7EE] text-[#4F683C] text-xs font-bold rounded-lg border border-[#DED5B8] transition cursor-pointer"
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
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FAF7EE] p-3.5 rounded-2xl border border-[#DED5B8]">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={e => setLogSearchQuery(e.target.value)}
                    placeholder="Tìm nhật ký theo email, hành động..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-[#DED5B8] rounded-xl text-xs focus:ring-2 focus:ring-[#6F8F55]"
                  />
                </div>

                <button
                  onClick={fetchLogs}
                  disabled={isLoadingLogs}
                  className="p-2 bg-white hover:bg-[#E9F0D9] text-[#4F683C] border border-[#DED5B8] rounded-xl transition cursor-pointer"
                  title="Làm mới nhật ký"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Logs Table */}
              <div className="border border-[#DED5B8] rounded-2xl overflow-hidden">
                {isLoadingLogs ? (
                  <div className="p-12 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#6F8F55]" />
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
                        <tr className="bg-[#FAF7EE] border-b border-[#DED5B8] text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
                          <th className="p-4">Thời gian</th>
                          <th className="p-4">Người dùng</th>
                          <th className="p-4">Hành động</th>
                          <th className="p-4">Chi tiết</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFE8D6]">
                        {filteredLogs.map(log => (
                          <tr key={log.id} className="hover:bg-[#FAF7EE]/50 transition">
                            <td className="p-4 text-slate-500 whitespace-nowrap">
                              {log.timestamp ? new Date(log.timestamp).toLocaleString('vi-VN') : '--'}
                            </td>
                            <td className="p-4 font-mono font-medium text-slate-800">
                              {log.userEmail || 'Khách (Chưa đăng nhập)'}
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded-full bg-[#E9F0D9] text-[#3D522B] font-extrabold text-[10px]">
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
