import { type QuestionBank, type AppUser, ADMIN_EMAILS, type UserActivityLog, type GameSessionRecord, type WebConfig } from "../types";
import { db, auth } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  Timestamp,
  updateDoc,
  orderBy,
  limit,
  increment
} from 'firebase/firestore';

/**
 * Record user profile upon Google Login and check if user is blocked
 */
export async function syncUserOnLogin(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}): Promise<{ isBlocked: boolean; appUser: AppUser | null }> {
  try {
    if (!user.uid) return { isBlocked: false, appUser: null };

    const normalizedEmail = (user.email || '').toLowerCase().trim();
    const isAdminUser = ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === normalizedEmail);

    // If not authenticated via Firebase Auth (e.g. dev login, guest, offline)
    if (!auth.currentUser || user.uid.startsWith('dev-')) {
      const devAppUser: AppUser = {
        uid: user.uid,
        email: normalizedEmail,
        displayName: user.displayName || 'Người dùng',
        photoURL: user.photoURL || null,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isBlocked: false,
        role: isAdminUser ? 'admin' : 'user',
        totalPlays: 0,
        lastAction: 'Đăng nhập',
      };
      return { isBlocked: false, appUser: devAppUser };
    }

    const userDocRef = doc(db, 'users', user.uid);
    const userSnapshot = await getDoc(userDocRef);

    const nowIso = new Date().toISOString();

    if (userSnapshot.exists()) {
      const existingData = userSnapshot.data();
      const isBlocked = !!existingData.isBlocked;

      if (isBlocked && !isAdminUser) {
        return { isBlocked: true, appUser: null };
      }

      const updatedUser: AppUser = {
        uid: user.uid,
        email: normalizedEmail || existingData.email,
        displayName: user.displayName || existingData.displayName || 'Người dùng',
        photoURL: user.photoURL || existingData.photoURL || null,
        createdAt: existingData.createdAt || nowIso,
        lastLoginAt: nowIso,
        isBlocked: false,
        role: isAdminUser ? 'admin' : (existingData.role || 'user'),
        totalPlays: existingData.totalPlays || 0,
        lastAction: 'Đăng nhập',
      };

      // Update user doc with merge: true to avoid schema lockouts
      await setDoc(userDocRef, {
        displayName: updatedUser.displayName,
        email: updatedUser.email,
        photoURL: updatedUser.photoURL,
        lastLoginAt: nowIso,
        lastAction: 'Đăng nhập',
        role: updatedUser.role,
      }, { merge: true });

      // Log action
      await logUserAction('LOGIN', { method: 'Google OAuth' }, updatedUser);

      return { isBlocked: false, appUser: updatedUser };
    } else {
      // First time user
      const newUser: AppUser = {
        uid: user.uid,
        email: normalizedEmail,
        displayName: user.displayName || 'Người dùng mới',
        photoURL: user.photoURL || null,
        createdAt: nowIso,
        lastLoginAt: nowIso,
        isBlocked: false,
        role: isAdminUser ? 'admin' : 'user',
        totalPlays: 0,
        lastAction: 'Đăng ký mới',
      };

      await setDoc(userDocRef, newUser, { merge: true });
      await logUserAction('LOGIN', { method: 'Google OAuth (Tài khoản mới)' }, newUser);

      return { isBlocked: false, appUser: newUser };
    }
  } catch (e) {
    console.warn('Could not sync user profile to remote database, using local profile session:', e);
    const normalizedEmail = (user.email || '').toLowerCase().trim();
    const isAdminUser = ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === normalizedEmail);
    return {
      isBlocked: false,
      appUser: {
        uid: user.uid,
        email: normalizedEmail,
        displayName: user.displayName || 'Người dùng',
        photoURL: user.photoURL || null,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isBlocked: false,
        role: isAdminUser ? 'admin' : 'user',
        totalPlays: 0,
        lastAction: 'Đăng nhập',
      },
    };
  }
}

/**
 * Log user actions with userEmail to track resource usage and user activities
 */
export async function logUserAction(
  actionType: UserActivityLog['actionType'],
  details?: Record<string, any>,
  userInfo?: { uid?: string; email?: string | null; displayName?: string | null }
): Promise<void> {
  try {
    const currentAuthUser = auth.currentUser;
    if (!currentAuthUser) return; // Skip writing remote logs when not authenticated

    const uid = userInfo?.uid || currentAuthUser?.uid || 'guest';
    const email = (userInfo?.email || currentAuthUser?.email || 'guest@khach.local').toLowerCase().trim();
    const displayName = userInfo?.displayName || currentAuthUser?.displayName || (uid === 'guest' ? 'Khách chưa đăng nhập' : 'Người dùng');

    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const logDocRef = doc(db, 'userActivityLogs', logId);

    const logData: UserActivityLog = {
      id: logId,
      userId: uid,
      userEmail: email,
      displayName,
      actionType,
      details: details || {},
      timestamp: new Date().toISOString(),
    };

    await setDoc(logDocRef, logData);

    // Also update user's last action in 'users' collection if registered user
    if (uid !== 'guest' && !uid.startsWith('dev-')) {
      try {
        const userDocRef = doc(db, 'users', uid);
        await updateDoc(userDocRef, {
          lastAction: `${actionType}${details?.gameTitle ? ` (${details.gameTitle})` : details?.name ? ` (${details.name})` : ''}`,
          lastLoginAt: new Date().toISOString(),
        });
      } catch (innerErr) {
        // Non-blocking
      }
    }
  } catch (e) {
    console.warn('Could not write user activity log:', e);
  }
}

/**
 * Record a game session with userEmail & game details
 */
export async function recordGameSession(
  gameData: {
    gameId: string;
    gameTitle: string;
    questionsCount?: number;
    teamsCount?: number;
    mode?: string;
  },
  userInfo?: { uid?: string; email?: string | null; displayName?: string | null }
): Promise<void> {
  try {
    const currentAuthUser = auth.currentUser;
    if (!currentAuthUser) return;

    const uid = userInfo?.uid || currentAuthUser?.uid || 'guest';
    const email = (userInfo?.email || currentAuthUser?.email || 'guest@khach.local').toLowerCase().trim();
    const displayName = userInfo?.displayName || currentAuthUser?.displayName || (uid === 'guest' ? 'Khách chưa đăng nhập' : 'Người dùng');

    const sessionId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sessionDocRef = doc(db, 'gameSessions', sessionId);

    const sessionRecord: GameSessionRecord = {
      id: sessionId,
      userId: uid,
      userEmail: email,
      displayName,
      gameId: gameData.gameId,
      gameTitle: gameData.gameTitle,
      questionsCount: gameData.questionsCount || 0,
      teamsCount: gameData.teamsCount || 0,
      mode: gameData.mode || 'bank',
      timestamp: new Date().toISOString(),
    };

    await setDoc(sessionDocRef, sessionRecord);

    // Increment play count on user document if logged in
    if (uid !== 'guest' && !uid.startsWith('dev-')) {
      try {
        const userDocRef = doc(db, 'users', uid);
        await updateDoc(userDocRef, {
          totalPlays: increment(1),
          lastAction: `Chơi game ${gameData.gameTitle}`,
        });
      } catch (err) {
        // Non-blocking
      }
    }

    // Also write to user activity log
    await logUserAction('PLAY_GAME', {
      gameId: gameData.gameId,
      gameTitle: gameData.gameTitle,
      questionsCount: gameData.questionsCount,
      teamsCount: gameData.teamsCount,
    }, { uid, email, displayName });
  } catch (e) {
    console.warn('Error recording game session:', e);
  }
}

/**
 * Fetch all registered users for Admin panel
 */
export async function getAllUsers(): Promise<AppUser[]> {
  try {
    if (!auth.currentUser) return [];
    const q = query(collection(db, 'users'));
    const querySnapshot = await getDocs(q);
    const users: AppUser[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      users.push({
        uid: docSnap.id,
        email: data.email || '',
        displayName: data.displayName || 'Chưa đặt tên',
        photoURL: data.photoURL || null,
        createdAt: data.createdAt || '',
        lastLoginAt: data.lastLoginAt || data.createdAt || '',
        isBlocked: !!data.isBlocked,
        role: data.role || 'user',
        totalPlays: data.totalPlays || 0,
        lastAction: data.lastAction || 'Đăng nhập',
      });
    });
    // Sort by latest login
    users.sort((a, b) => new Date(b.lastLoginAt || 0).getTime() - new Date(a.lastLoginAt || 0).getTime());
    return users;
  } catch (e) {
    console.warn('Error fetching all users for admin:', e);
    return [];
  }
}

/**
 * Fetch recent user activity logs for Admin panel
 */
export async function getActivityLogs(limitCount: number = 60): Promise<UserActivityLog[]> {
  try {
    if (!auth.currentUser) return [];
    const q = query(
      collection(db, 'userActivityLogs'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const logs: UserActivityLog[] = [];
    querySnapshot.forEach((docSnap) => {
      logs.push(docSnap.data() as UserActivityLog);
    });
    return logs;
  } catch (e) {
    try {
      if (!auth.currentUser) return [];
      // Fallback in case composite index is not yet built
      const q = query(collection(db, 'userActivityLogs'), limit(limitCount));
      const querySnapshot = await getDocs(q);
      const logs: UserActivityLog[] = [];
      querySnapshot.forEach((docSnap) => {
        logs.push(docSnap.data() as UserActivityLog);
      });
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return logs;
    } catch (innerErr) {
      console.warn('Error fetching activity logs:', innerErr);
      return [];
    }
  }
}

/**
 * Admin block / unblock user
 */
export async function setUserBlockStatus(uid: string, isBlocked: boolean): Promise<boolean> {
  try {
    if (!auth.currentUser || uid.startsWith('dev-')) return true;
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      isBlocked: isBlocked,
    });
    return true;
  } catch (e) {
    console.error('Error updating user block status:', e);
    return false;
  }
}

/**
 * Save Question Bank to Firestore with userEmail and owner metadata
 */
export async function saveQuestionBankToCloud(
  bank: QuestionBank,
  userId?: string,
  userEmail?: string
): Promise<boolean> {
  try {
    const currentAuthUser = auth.currentUser;
    const uid = userId || currentAuthUser?.uid;
    if (!uid) return false;
    if (!currentAuthUser || uid.startsWith('dev-')) {
      // Handled locally
      return true;
    }

    const email = (userEmail || currentAuthUser?.email || bank.userEmail || '').toLowerCase().trim();

    const bankToSave = {
      ...bank,
      ownerId: uid,
      userId: uid,
      userEmail: email,
      ownerEmail: email,
      updatedAt: Timestamp.now(),
      createdAt: bank.createdAt || Timestamp.now(),
    };

    const docRef = doc(db, 'questionBanks', bank.id);
    await setDoc(docRef, bankToSave);

    // Log the action with email
    await logUserAction('SAVE_BANK', {
      bankId: bank.id,
      bankName: bank.name,
      questionsCount: bank.questions?.length || 0,
      subject: bank.subject,
      grade: bank.grade,
    }, { uid, email, displayName: currentAuthUser?.displayName });

    return true;
  } catch (e) {
    console.warn('Error saving question bank to Firestore:', e);
    return false;
  }
}

/**
 * Delete Question Bank from Firestore
 */
export async function deleteCloudQuestionBank(bankId: string): Promise<boolean> {
  try {
    const currentAuthUser = auth.currentUser;
    if (!currentAuthUser) return true;

    const docRef = doc(db, 'questionBanks', bankId);
    await deleteDoc(docRef);

    await logUserAction('DELETE_BANK', { bankId }, {
      uid: currentAuthUser?.uid,
      email: currentAuthUser?.email,
      displayName: currentAuthUser?.displayName,
    });

    return true;
  } catch (e) {
    console.warn('Error deleting question bank from Firestore:', e);
    return false;
  }
}

/**
 * Fetch Question Banks for user
 */
export async function getCloudQuestionBanks(userId?: string): Promise<QuestionBank[]> {
  try {
    const currentAuthUser = auth.currentUser;
    if (!currentAuthUser) return [];

    const uid = userId || currentAuthUser.uid;
    if (!uid || uid.startsWith('dev-')) return [];

    const q = query(
      collection(db, 'questionBanks'),
      where('ownerId', '==', uid)
    );
    
    const querySnapshot = await getDocs(q);
    const banks: QuestionBank[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      banks.push({
        ...data,
        id: docSnap.id,
        userEmail: data.userEmail || data.ownerEmail || currentAuthUser.email || '',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as QuestionBank);
    });
    return banks;
  } catch (e) {
    console.warn('Error fetching question banks from Firestore:', e);
    return [];
  }
}

/**
 * Fetch Web Configuration (including custom game avatars, theme, title) from Firestore
 */
export async function getWebConfigCloud(): Promise<Partial<WebConfig> | null> {
  try {
    const docRef = doc(db, 'system', 'webConfig');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Partial<WebConfig>;
    }
    return null;
  } catch (e) {
    console.warn('Error fetching webConfig from Firestore:', e);
    return null;
  }
}

/**
 * Save Web Configuration to Firestore for cross-client persistence
 */
export async function saveWebConfigCloud(config: WebConfig): Promise<boolean> {
  try {
    const docRef = doc(db, 'system', 'webConfig');
    await setDoc(docRef, {
      ...config,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (e) {
    console.warn('Error saving webConfig to Firestore:', e);
    return false;
  }
}

