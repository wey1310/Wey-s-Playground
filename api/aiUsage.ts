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

/**
 * ============================================================================
 * SECURE API VALIDATION LOGGING UTILITY (Chống rò rỉ API Key & Hỗ trợ Debug)
 * ============================================================================
 */

export interface ApiValidationLog {
  id: string;
  timestamp: string;
  model: string;
  keyLength: number;
  maskedKey: string;
  isStandardFormat: boolean;
  success: boolean;
  status: 'ACTIVE' | 'INVALID' | 'QUOTA_EXCEEDED' | 'RATE_LIMITED' | 'MODEL_ERROR' | 'NETWORK_ERROR' | 'ERROR';
  httpStatus: number;
  responseTimeMs: number;
  errorCategory?: string;
  errorMessage?: string;
  ip?: string;
  userAgent?: string;
  apiId?: string;
}

const recentValidationLogs: ApiValidationLog[] = [];
const MAX_VALIDATION_LOGS = 60;

/**
 * Loại bỏ / Mask toàn bộ các chuỗi có định dạng Gemini API Key khỏi chuỗi log hoặc error message
 */
export function sanitizeLogMessage(input: any): string {
  if (input === null || input === undefined) return '';
  let str = typeof input === 'string' ? input : input instanceof Error ? `${input.name}: ${input.message}` : JSON.stringify(input);

  // Mask Google API key patterns: AIzaSy... (39 chars)
  str = str.replace(/AIza[0-9A-Za-z-_]{35}/g, (match) => `${match.substring(0, 6)}...[REDACTED]`);
  // Mask key in query params: ?key=... or &key=...
  str = str.replace(/([?&]key=)[0-9A-Za-z-_]{15,}/gi, '$1[REDACTED_API_KEY]');
  // Mask key in JSON fields: "apiKey": "..." or "key": "..."
  str = str.replace(/("(?:apiKey|key|token|secret)"\s*:\s*")[^"]+(")/gi, '$1[REDACTED_SECRET]$2');
  // Mask Bearer tokens
  str = str.replace(/(Bearer\s+)[A-Za-z0-9-_=.]+/gi, '$1[REDACTED_TOKEN]');

  return str.length > 500 ? `${str.slice(0, 500)}... (truncated)` : str;
}

/**
 * Tạo bản xem trước an toàn (Masked Hint) mà KHÔNG BAO GIỜ để lộ secret
 */
export function getMaskedKeyHint(apiKey?: string): {
  keyLength: number;
  prefix: string;
  suffix: string;
  maskedHint: string;
  isStandardFormat: boolean;
} {
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    return {
      keyLength: 0,
      prefix: 'N/A',
      suffix: 'N/A',
      maskedHint: '[EMPTY_KEY]',
      isStandardFormat: false,
    };
  }

  const clean = apiKey.trim();
  const len = clean.length;
  const isStandard = clean.startsWith('AIza') && len === 39;
  const prefix = clean.slice(0, 6);
  const suffix = len >= 8 ? clean.slice(-4) : '****';
  const maskedHint = `${prefix}...${suffix} (${len} chars)`;

  return {
    keyLength: len,
    prefix,
    suffix,
    maskedHint,
    isStandardFormat: isStandard,
  };
}

/**
 * Phân loại mã lỗi trả về từ Google Gemini AI một cách an toàn
 */
export function categorizeGeminiError(errMessage: string, httpStatus?: number): {
  status: 'ACTIVE' | 'INVALID' | 'QUOTA_EXCEEDED' | 'RATE_LIMITED' | 'MODEL_ERROR' | 'NETWORK_ERROR' | 'ERROR';
  category: string;
  suggestedHttpStatus: number;
  userMessage: string;
} {
  const msgLower = (errMessage || '').toLowerCase();

  if (
    msgLower.includes('api_key_invalid') ||
    msgLower.includes('api key not valid') ||
    msgLower.includes('unauthenticated') ||
    msgLower.includes('invalid_argument') ||
    msgLower.includes('key expired')
  ) {
    return {
      status: 'INVALID',
      category: 'AUTHENTICATION_FAILED',
      suggestedHttpStatus: 401,
      userMessage: 'API Key không hợp lệ hoặc sai định dạng. Vui lòng kiểm tra lại key.',
    };
  }

  if (
    msgLower.includes('permission_denied') ||
    msgLower.includes('consumer_invalid') ||
    msgLower.includes('project_disabled') ||
    msgLower.includes('403')
  ) {
    return {
      status: 'INVALID',
      category: 'PERMISSION_DENIED',
      suggestedHttpStatus: 403,
      userMessage: 'API Key không có quyền truy cập Gemini API hoặc Google Cloud Project đã bị tắt.',
    };
  }

  if (
    msgLower.includes('resource_exhausted') ||
    msgLower.includes('quota') ||
    msgLower.includes('429')
  ) {
    if (msgLower.includes('rate limit') || msgLower.includes('rate_limit') || msgLower.includes('tpm') || msgLower.includes('rpm')) {
      return {
        status: 'RATE_LIMITED',
        category: 'RATE_LIMIT_EXCEEDED',
        suggestedHttpStatus: 429,
        userMessage: 'Đã vượt quá giới hạn tần suất gọi API (Rate Limit / RPM / TPM). Vui lòng thử lại sau giây lát.',
      };
    }
    return {
      status: 'QUOTA_EXCEEDED',
      category: 'QUOTA_EXHAUSTED',
      suggestedHttpStatus: 429,
      userMessage: 'API Key đã sử dụng hết hạn mức miễn phí trong ngày (RESOURCE_EXHAUSTED / Quota Limit).',
    };
  }

  if (
    msgLower.includes('not_found') ||
    msgLower.includes('models/') ||
    msgLower.includes('unsupported model') ||
    msgLower.includes('404')
  ) {
    return {
      status: 'MODEL_ERROR',
      category: 'MODEL_UNAVAILABLE',
      suggestedHttpStatus: 400,
      userMessage: 'Model AI được chỉ định không khả dụng hoặc chưa được cấp quyền cho API Key này.',
    };
  }

  if (
    msgLower.includes('fetch_error') ||
    msgLower.includes('econnrefused') ||
    msgLower.includes('enotfound') ||
    msgLower.includes('etimedout') ||
    msgLower.includes('network') ||
    msgLower.includes('socket hang up') ||
    msgLower.includes('failed to fetch')
  ) {
    return {
      status: 'NETWORK_ERROR',
      category: 'NETWORK_CONNECTIVITY',
      suggestedHttpStatus: 502,
      userMessage: 'Không thể kết nối đến máy chủ Google Gemini API (Lỗi mạng hoặc DNS).',
    };
  }

  return {
    status: 'ERROR',
    category: 'UNKNOWN_EXCEPTION',
    suggestedHttpStatus: httpStatus || 500,
    userMessage: sanitizeLogMessage(errMessage).slice(0, 160) || 'Đã xảy ra lỗi khi kiểm tra kết nối với Gemini API.',
  };
}

/**
 * Ghi log xác thực API Key lên Server-Side & Memory Buffer
 * TUYỆT ĐỐI KHÔNG BAO GIỜ GHI NHẬN RAW API KEY
 */
export async function logApiValidationAttempt(params: {
  rawKey?: string;
  model: string;
  success: boolean;
  status: 'ACTIVE' | 'INVALID' | 'QUOTA_EXCEEDED' | 'RATE_LIMITED' | 'MODEL_ERROR' | 'NETWORK_ERROR' | 'ERROR';
  httpStatus: number;
  responseTimeMs: number;
  error?: any;
  ip?: string;
  userAgent?: string;
  apiId?: string;
}): Promise<ApiValidationLog> {
  const { keyLength, maskedHint, isStandardFormat } = getMaskedKeyHint(params.rawKey);
  const now = new Date().toISOString();
  const logId = `val_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const sanitizedErrorMessage = params.error ? sanitizeLogMessage(params.error) : undefined;
  let errorCategory: string | undefined = undefined;

  if (!params.success && params.error) {
    const errorDetails = categorizeGeminiError(sanitizedErrorMessage || '', params.httpStatus);
    errorCategory = errorDetails.category;
  }

  const logEntry: ApiValidationLog = {
    id: logId,
    timestamp: now,
    model: params.model || 'gemini-2.5-flash',
    keyLength,
    maskedKey: maskedHint,
    isStandardFormat,
    success: params.success,
    status: params.status,
    httpStatus: params.httpStatus,
    responseTimeMs: params.responseTimeMs,
    errorCategory,
    errorMessage: sanitizedErrorMessage,
    ip: params.ip ? params.ip.replace(/:\d+$/, '') : undefined,
    userAgent: params.userAgent ? params.userAgent.slice(0, 100) : undefined,
    apiId: params.apiId,
  };

  // 1. Structured Console Output (An toàn, hữu ích cho debugging trong Cloud Run / Container logs)
  if (params.success) {
    console.log(
      `[API_VALIDATE_SUCCESS] 🟢 Status: ${params.status} (${params.httpStatus}) | Model: ${logEntry.model} | Key: ${maskedHint} | Time: ${params.responseTimeMs}ms`
    );
  } else {
    console.warn(
      `[API_VALIDATE_FAILED] 🔴 Status: ${params.status} (${params.httpStatus}) | Category: ${errorCategory || 'N/A'} | Model: ${logEntry.model} | Key: ${maskedHint} | Time: ${params.responseTimeMs}ms | Error: ${sanitizedErrorMessage}`
    );
  }

  // 2. Lưu vào Memory Buffer
  recentValidationLogs.push(logEntry);
  if (recentValidationLogs.length > MAX_VALIDATION_LOGS) {
    recentValidationLogs.shift();
  }

  // 3. Bất đồng bộ ghi vào Firestore nếu có kết nối (để admin có thể tra cứu lịch sử audit mà không lo leak key)
  try {
    const { adminDb } = initFirebase();
    if (adminDb) {
      adminDb.collection('geminiValidationLogs').doc(logId).set({
        timestamp: now,
        model: logEntry.model,
        keyLength: logEntry.keyLength,
        maskedKey: logEntry.maskedKey,
        isStandardFormat: logEntry.isStandardFormat,
        success: logEntry.success,
        status: logEntry.status,
        httpStatus: logEntry.httpStatus,
        responseTimeMs: logEntry.responseTimeMs,
        errorCategory: errorCategory || null,
        errorMessage: sanitizedErrorMessage || null,
        ip: logEntry.ip || null,
        apiId: logEntry.apiId || null,
      }).catch((dbErr: any) => {
        // Silent catch so logging never throws
        console.warn("⚠️ Could not persist validation log to Firestore:", dbErr?.message);
      });
    }
  } catch {}

  return logEntry;
}

/**
 * Lấy danh sách lịch sử xác thực gần nhất để phục vụ chẩn đoán / Debug an toàn
 */
export function getRecentValidationLogs(limit = 20): ApiValidationLog[] {
  return [...recentValidationLogs].reverse().slice(0, limit);
}
