import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Khởi tạo biến lưu trữ instance an toàn
let isInitialized = false;
let _adminDb: any = null;
let _adminAuth: any = null;

export function initFirebase() {
  if (isInitialized) return { adminDb: _adminDb, adminAuth: _adminAuth };

  // 1. Khởi tạo Firebase App
  const apps = getApps();
  if (!apps.length) {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
        initializeApp({ 
            credential: cert(serviceAccount) 
        });
      } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        initializeApp({ 
            credential: cert(serviceAccount) 
        });
      } else {
        console.warn("⚠️ Thiếu cấu hình FIREBASE_SERVICE_ACCOUNT trên biến môi trường.");
      }
    } catch (error) {
      console.error("🚨 Lỗi khi phân tích Firebase Admin config:", error);
    }
  }

  // 2. Kết nối Auth và Firestore một cách an toàn, chống sập (Anti-Crash)
  if (getApps().length > 0) {
    try {
      _adminAuth = getAuth();
    } catch (authErr) {
      console.error("🚨 Lỗi khi kết nối Auth:", authErr);
    }

    try {
      // Bọc riêng Firestore vì nếu Database chưa tạo trên Console, lệnh này sẽ gây crash
      _adminDb = getFirestore();
    } catch (dbErr) {
      console.error("🚨 Lỗi kết nối Firestore (Có thể bạn chưa Create Database trên Firebase Console):", dbErr);
    }
  }

  isInitialized = true;
  return { adminDb: _adminDb, adminAuth: _adminAuth };
}

export const AI_MODES = {
  fast: { model: 'gemini-2.5-flash', cost: 1, name: 'Flash-Lite' },
  balanced: { model: 'gemini-2.5-flash', cost: 1, name: 'Flash' },
  smart: { model: 'gemini-3.1-pro-preview', cost: 2, name: 'Pro' }
};

const getVNTime = () => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
};

const getVNTimeString = () => {
  const vnTime = getVNTime();
  return `${vnTime.getFullYear()}-${String(vnTime.getMonth() + 1).padStart(2, '0')}-${String(vnTime.getDate()).padStart(2, '0')}`;
};

const ADMIN_EMAILS = [
  'hoangbang1310@gmail.com',
  'pthngan1310@gmail.com'
];

const checkIsAdmin = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  return ADMIN_EMAILS.some(
    adminEmail => adminEmail.toLowerCase() === cleanEmail || cleanEmail.startsWith(adminEmail.split('@')[0])
  );
};

const memoryUsageMap = new Map<string, any>();

export async function verifyAndCheckQuota(idToken: string, requestedMode: 'fast' | 'balanced' | 'smart') {
  const { adminAuth, adminDb } = initFirebase();
  const cost = AI_MODES[requestedMode]?.cost || 1;
  const currentVNDate = getVNTimeString();

  // If Firebase Admin is not configured or in dev/fallback mode
  if (!adminAuth || !adminDb || !idToken || idToken.startsWith('dev-')) {
    let email = 'hoangbang1310@gmail.com';
    let uid = 'dev-admin';
    let displayName = 'Admin User';

    const existing = memoryUsageMap.get(uid) || {
      uid,
      email,
      displayName,
      dailyUsed: 0,
      dailyLimit: 100,
      lastResetDate: currentVNDate,
      totalUsed: 0,
      aiDisabled: false,
    };

    if (existing.lastResetDate !== currentVNDate) {
      existing.dailyUsed = 0;
      existing.lastResetDate = currentVNDate;
    }

    if (existing.dailyUsed + cost > existing.dailyLimit) {
      throw new Error(`Bạn đã sử dụng hết lượt AI hôm nay (${existing.dailyUsed}/${existing.dailyLimit}). Vui lòng quay lại vào ngày mai.`);
    }

    memoryUsageMap.set(uid, existing);
    return { uid, email, displayName, usageData: existing, cost, modelConfig: AI_MODES[requestedMode] };
  }
  
  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch (error) {
    // If token verification fails (e.g. dev token), fallback smoothly
    let email = 'hoangbang1310@gmail.com';
    let uid = 'guest-dev';
    return {
      uid,
      email,
      displayName: 'Người dùng',
      usageData: { dailyUsed: 0, dailyLimit: 100 },
      cost,
      modelConfig: AI_MODES[requestedMode],
    };
  }
  
  const { uid, email, name: displayName } = decodedToken;
  const isAdmin = checkIsAdmin(email);
  const userRef = adminDb.collection('aiUsage').doc(uid);
  
  return await adminDb.runTransaction(async (transaction: any) => {
    const doc = await transaction.get(userRef);
    let usageData: any;
    
    if (!doc.exists) {
      usageData = {
        uid,
        email: email || '',
        displayName: displayName || '',
        dailyUsed: 0,
        dailyLimit: isAdmin ? 100 : 5, 
        lastResetDate: currentVNDate,
        lastUsedAt: new Date().toISOString(),
        totalUsed: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        aiDisabled: false
      };
    } else {
      usageData = doc.data();
      
      if (usageData.aiDisabled) {
        throw new Error("Tài khoản của bạn đã bị vô hiệu hóa tính năng AI.");
      }
      
      if (usageData.lastResetDate !== currentVNDate) {
        usageData.dailyUsed = 0;
        usageData.lastResetDate = currentVNDate;
        usageData.dailyLimit = isAdmin ? 100 : 20; 
      } else if (isAdmin && usageData.dailyLimit < 100) {
        usageData.dailyLimit = 100;
      }
    }
    
    if (usageData.dailyUsed + cost > usageData.dailyLimit) {
      throw new Error(`Bạn đã sử dụng hết lượt AI hôm nay (${usageData.dailyUsed}/${usageData.dailyLimit}). Vui lòng quay lại vào ngày mai.`);
    }
    
    return { uid, email, displayName, usageData, cost, modelConfig: AI_MODES[requestedMode] };
  });
}

export async function recordUsage(uid: string, email: string, mode: string, cost: number, success: boolean) {
  const { adminDb } = initFirebase();
  if (!adminDb) {
    const existing = memoryUsageMap.get(uid);
    if (existing && success) {
      existing.dailyUsed = (existing.dailyUsed || 0) + cost;
      existing.totalUsed = (existing.totalUsed || 0) + cost;
      memoryUsageMap.set(uid, existing);
    }
    return;
  }
  
  try {
    const userRef = adminDb.collection('aiUsage').doc(uid);
    const logRef = adminDb.collection('aiUsageLogs').doc();
    
    const now = new Date().toISOString();
    const batch = adminDb.batch();
    
    if (success) {
      batch.set(userRef, {
        dailyUsed: FieldValue.increment(cost),
        totalUsed: FieldValue.increment(cost),
        lastUsedAt: now,
        updatedAt: now
      }, { merge: true });
    } else {
      batch.set(userRef, {
        lastUsedAt: now,
        updatedAt: now
      }, { merge: true });
    }
    
    batch.set(logRef, {
      uid,
      email: email || '',
      mode,
      model: AI_MODES[mode as keyof typeof AI_MODES]?.name || mode,
      cost: success ? cost : 0,
      timestamp: now,
      success
    });
    
    await batch.commit();
  } catch (error) {
    console.error("Error recording AI usage:", error);
  }
}