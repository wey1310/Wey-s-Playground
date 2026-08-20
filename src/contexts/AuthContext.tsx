import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { type AppUser, ADMIN_EMAILS } from "../types";
import { syncUserOnLogin } from '../lib/db';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isBlocked: boolean;
  errorMessage: string | null;
  clearError: () => void;
  showUnauthorizedModal: boolean;
  setShowUnauthorizedModal: (show: boolean) => void;
  devLoginAsAdmin: (email?: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => false,
  logout: async () => {},
  isAdmin: false,
  isBlocked: false,
  errorMessage: null,
  clearError: () => {},
  showUnauthorizedModal: false,
  setShowUnauthorizedModal: () => {},
  devLoginAsAdmin: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(() => {
    const savedDevUser = localStorage.getItem('wey_dev_auth_user');
    if (savedDevUser) {
      try {
        return JSON.parse(savedDevUser);
      } catch (e) {}
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUnauthorizedModal, setShowUnauthorizedModal] = useState<boolean>(false);

  const checkIsAdmin = (email?: string | null): boolean => {
    if (!email) return false;
    const cleanEmail = email.toLowerCase().trim();
    return ADMIN_EMAILS.some(
      adminEmail => adminEmail.toLowerCase() === cleanEmail || cleanEmail.startsWith(adminEmail.split('@')[0])
    );
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        localStorage.removeItem('wey_dev_auth_user');
        try {
          const syncResult = await syncUserOnLogin({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });

          if (syncResult.isBlocked) {
            await signOut(auth);
            setUser(null);
            setIsBlocked(true);
            setErrorMessage('Tài khoản của bạn đã bị quản trị viên chặn. Bạn không thể đăng nhập hoặc đồng bộ dữ liệu.');
          } else {
            setIsBlocked(false);
            setUser(syncResult.appUser || {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Người dùng',
              photoURL: firebaseUser.photoURL || null,
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              isBlocked: false,
              role: checkIsAdmin(firebaseUser.email) ? 'admin' : 'user',
            });
          }
        } catch (err) {
          console.error('Error in auth state change sync:', err);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Người dùng',
            photoURL: firebaseUser.photoURL || null,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            isBlocked: false,
            role: checkIsAdmin(firebaseUser.email) ? 'admin' : 'user',
          });
        }
      } else {
        const savedDevUser = localStorage.getItem('wey_dev_auth_user');
        if (savedDevUser) {
          try {
            setUser(JSON.parse(savedDevUser));
          } catch (e) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<boolean> => {
    setLoading(true);
    setErrorMessage(null);
    setIsBlocked(false);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        localStorage.removeItem('wey_dev_auth_user');
        const syncResult = await syncUserOnLogin({
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName,
          photoURL: cred.user.photoURL,
        });

        if (syncResult.isBlocked) {
          await signOut(auth);
          setUser(null);
          setIsBlocked(true);
          setErrorMessage('Tài khoản của bạn đã bị quản trị viên chặn. Không thể đăng nhập.');
          return false;
        }

        setUser(syncResult.appUser);
        return true;
      }
      return false;
    } catch (e: any) {
      console.error('Login error:', e);
      if (e?.code === 'auth/popup-closed-by-user') {
        // User closed popup, no error alert needed
      } else if (e?.code === 'auth/unauthorized-domain' || e?.message?.includes('unauthorized-domain')) {
        setShowUnauthorizedModal(true);
        setErrorMessage(`Tên miền hiện tại (${typeof window !== 'undefined' ? window.location.hostname : ''}) chưa được thêm vào Authorized Domains trên Firebase Console. Vui lòng làm theo hướng dẫn hoặc chọn đăng nhập nhanh.`);
      } else {
        setErrorMessage(e?.message || 'Đăng nhập Google không thành công. Vui lòng thử lại.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const devLoginAsAdmin = (email: string = 'hoangbang1310@gmail.com') => {
    const isSuperAdmin = checkIsAdmin(email);
    const mockUser: AppUser = {
      uid: 'dev-admin-' + Date.now(),
      email: email,
      displayName: email.split('@')[0],
      photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=' + email,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isBlocked: false,
      role: isSuperAdmin ? 'admin' : 'user',
    };
    setUser(mockUser);
    localStorage.setItem('wey_dev_auth_user', JSON.stringify(mockUser));
    setErrorMessage(null);
    setShowUnauthorizedModal(false);
  };

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('wey_dev_auth_user');
      await signOut(auth);
      setUser(null);
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setErrorMessage(null);
    setIsBlocked(false);
  };

  const isAdmin = !!user?.email && checkIsAdmin(user.email);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        logout,
        isAdmin,
        isBlocked,
        errorMessage,
        clearError,
        showUnauthorizedModal,
        setShowUnauthorizedModal,
        devLoginAsAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
