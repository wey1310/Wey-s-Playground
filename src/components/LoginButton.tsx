import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LogIn, Shield, Loader2, Mail } from 'lucide-react';
import type { QuestionBank } from "../types";
import { getCloudQuestionBanks } from '../lib/db';

interface LoginButtonProps {
  onCloudBanksLoaded?: (banks: QuestionBank[]) => void;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ onCloudBanksLoaded }) => {
  const { user, loginWithGoogle, logout, isAdmin, loading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const ok = await loginWithGoogle();
      if (ok && onCloudBanksLoaded) {
        const banks = await getCloudQuestionBanks();
        onCloudBanksLoaded(banks);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading || isLoggingIn) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#E9F0D9] border border-[#B9CDA0] rounded-[18px] text-xs font-[700] text-[#4F683C]">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span className="hidden sm:inline">Đang kết nối...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2 bg-[#E9F0D9] border border-[#B9CDA0] pl-2 pr-1.5 py-1 rounded-[20px] text-xs font-[800] text-[#35452E] shadow-[0_2px_8px_rgba(79,104,60,0.06)]">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-6 h-6 rounded-full object-cover border border-[#B9CDA0]"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-[#4F683C] text-white flex items-center justify-center text-[10px] font-black">
            {(user.displayName || user.email || 'U')[0].toUpperCase()}
          </div>
        )}
        <div className="flex flex-col text-left max-w-[120px] sm:max-w-[160px] truncate leading-tight">
          <span className="truncate text-[11px] font-bold text-[#35452E]">
            {user.displayName || user.email?.split('@')[0]}
          </span>
          <span className="text-[9px] text-[#637559] truncate font-medium">
            {user.email}
          </span>
        </div>
        {isAdmin && (
          <span className="bg-[#4F683C] text-[#E9D58F] px-1.5 py-0.5 rounded-full text-[9px] font-black tracking-wider flex items-center gap-0.5">
            <Shield className="w-2.5 h-2.5" />
            ADMIN
          </span>
        )}
        <button
          onClick={logout}
          title="Đăng xuất"
          className="p-1.5 hover:bg-[#DCEBCB] hover:text-[#E05252] rounded-full text-[#4F683C] transition ml-0.5"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FFFDF5] hover:bg-[#F8F3E5] text-[#4F683C] font-[800] text-xs rounded-[18px] border border-[#C9D8B8] shadow-[0_2px_8px_rgba(79,104,60,0.06)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
      title="Đăng nhập tài khoản Google để lưu trữ đám mây & không giới hạn lượt chơi"
    >
      <LogIn className="w-3.5 h-3.5 text-[#6F8F55]" />
      <span className="hidden sm:inline">Đăng Nhập Google</span>
      <span className="sm:hidden">Đăng Nhập</span>
    </button>
  );
};
