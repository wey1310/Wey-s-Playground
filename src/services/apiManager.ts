import { GeminiApiConfig, ApiStatus, ApiUsageHistoryItem } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, getDoc, getDocs, onSnapshot, deleteDoc, updateDoc, Timestamp, query, orderBy, limit } from 'firebase/firestore';

const STORAGE_KEYS = {
  ACTIVE_ID: 'wey_active_api_id',
  USAGE_HISTORY: 'wey_api_usage_history',
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notifyListeners() {
  listeners.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.error('Error in apiManager listener:', e);
    }
  });
}

let localConfigs: GeminiApiConfig[] = [];
let localActiveId: string | null = localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
let isInitialized = false;

function initFirebaseSync() {
  if (isInitialized) return;
  isInitialized = true;

  onSnapshot(collection(db, 'geminiApisPublic'), (snapshot) => {
    const configs: GeminiApiConfig[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      configs.push({
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        lastCheckedAt: data.lastCheckedAt?.toDate ? data.lastCheckedAt.toDate().toISOString() : data.lastCheckedAt,
        lastUsedAt: data.lastUsedAt?.toDate ? data.lastUsedAt.toDate().toISOString() : data.lastUsedAt,
      } as GeminiApiConfig);
    });
    
    // Default to the first active API if localActiveId is invalid or null
    if (!localActiveId || !configs.some(c => c.id === localActiveId && c.enabled)) {
      const firstEnabled = configs.find(c => c.enabled);
      if (firstEnabled) {
        localActiveId = firstEnabled.id;
        localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, firstEnabled.id);
      }
    }

    localConfigs = configs;
    notifyListeners();
  }, (err) => {
    console.error("Error listening to geminiApisPublic", err);
  });
}

export const apiManager = {
  subscribe(fn: Listener) {
    if (!isInitialized) initFirebaseSync();
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  getConfigs(): GeminiApiConfig[] {
    if (!isInitialized) initFirebaseSync();
    return localConfigs;
  },

  getActiveApiId(): string | null {
    return localActiveId;
  },

  setActiveApiId(id: string | null) {
    try {
      localActiveId = id;
      if (id) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_ID);
      }
      notifyListeners();
    } catch (e) {
      console.error('Failed to set active api id:', e);
    }
  },

  getActiveApi(): GeminiApiConfig | null {
    const configs = this.getConfigs();
    if (localActiveId) {
      const found = configs.find(c => c.id === localActiveId && c.enabled);
      if (found) return found;
    }
    const firstEnabled = configs.find(c => c.enabled);
    if (firstEnabled) {
      this.setActiveApiId(firstEnabled.id);
      return firstEnabled;
    }
    return null;
  },

  getAvailableApis(): GeminiApiConfig[] {
    return this.getConfigs().filter(c => c.enabled);
  },

  getActiveOrFirstAvailableApi(): GeminiApiConfig | null {
    const active = this.getActiveApi();
    if (active) return active;
    const available = this.getAvailableApis();
    return available[0] || null;
  },

  hasAnyApis(): boolean {
    return this.getConfigs().length > 0;
  },

  hasActiveApi(): boolean {
    const active = this.getActiveApi();
    return !!active && (active.status === 'ACTIVE' || active.status === 'UNCHECKED');
  },

  async saveConfig(
    data: {
      id?: string;
      name: string;
      email: string;
      apiKey: string;
      model?: string;
      notes?: string;
      enabled?: boolean;
      status?: ApiStatus;
    }
  ): Promise<GeminiApiConfig> {
    const now = new Date().toISOString();
    const cleanKey = data.apiKey.trim();
    const cleanEmail = data.email.trim();
    const cleanName = data.name.trim() || `API (${cleanEmail || 'Gemini'})`;
    const model = data.model?.trim() || 'gemini-2.5-flash';
    const initialStatus = data.status || 'UNCHECKED';

    const id = data.id || `api_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // This runs on client side. Admin must be logged in.
    // Save public info
    const publicData = {
      name: cleanName,
      email: cleanEmail,
      model,
      notes: data.notes?.trim() || '',
      enabled: data.enabled !== undefined ? data.enabled : true,
      status: initialStatus,
      updatedAt: Timestamp.now(),
    };
    
    if (!data.id) {
      Object.assign(publicData, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        createdAt: Timestamp.now(),
      });
    }

    try {
      await setDoc(doc(db, 'geminiApisPublic', id), publicData, { merge: true });
      
      // Save secret info (Only admin can write here)
      await setDoc(doc(db, 'geminiApiSecrets', id), { apiKey: cleanKey }, { merge: true });
      
      this.setActiveApiId(id);

      return {
        id,
        ...publicData,
        createdAt: now,
        updatedAt: now,
        apiKey: cleanKey, // Temporarily include it for UI (it won't be saved in public)
      } as GeminiApiConfig;
    } catch (e: any) {
      throw new Error("Lỗi khi lưu cấu hình: " + e.message);
    }
  },

  async deleteConfig(id: string) {
    try {
      await deleteDoc(doc(db, 'geminiApisPublic', id));
      await deleteDoc(doc(db, 'geminiApiSecrets', id));
      if (this.getActiveApiId() === id) {
        const nextActive = localConfigs.find(c => c.id !== id && c.enabled);
        this.setActiveApiId(nextActive ? nextActive.id : null);
      }
    } catch (e: any) {
      console.error("Lỗi khi xóa cấu hình:", e);
    }
  },

  async toggleEnabled(id: string) {
    const config = localConfigs.find(c => c.id === id);
    if (config) {
      try {
        await updateDoc(doc(db, 'geminiApisPublic', id), {
          enabled: !config.enabled,
          updatedAt: Timestamp.now()
        });
        if (config.enabled && this.getActiveApiId() === id) { // It was enabled, now disabled
          const nextActive = localConfigs.find(c => c.id !== id && c.enabled);
          this.setActiveApiId(nextActive ? nextActive.id : null);
        }
      } catch (e) {
        console.error("Lỗi toggle enabled:", e);
      }
    }
  },

  // Need to get secret for testing
  async getSecretApiKey(id: string): Promise<string> {
    try {
      const docSnap = await getDoc(doc(db, 'geminiApiSecrets', id));
      if (docSnap.exists()) {
        return docSnap.data().apiKey;
      }
    } catch(e) {}
    return '';
  },

  async validateApi(
    configOrId: string | GeminiApiConfig
  ): Promise<{
    success: boolean;
    status: ApiStatus;
    error?: string;
    responseTimeMs?: number;
    model?: string;
    message?: string;
  }> {
    let id: string;
    let apiKey: string = '';
    let model = 'gemini-2.5-flash';
    
    if (typeof configOrId === 'string') {
      id = configOrId;
      const conf = localConfigs.find(c => c.id === id);
      if (conf) model = conf.model || 'gemini-2.5-flash';
      // Fetch key from secret
       // Import here or top
    } else {
      id = configOrId.id;
      apiKey = configOrId.apiKey;
      model = configOrId.model || 'gemini-2.5-flash';
    }

    if (!apiKey) {
        
        try {
            const docSnap = await getDoc(doc(db, 'geminiApiSecrets', id));
            if (docSnap.exists()) {
                apiKey = docSnap.data().apiKey;
            }
        } catch(e) {}
    }

    if (!apiKey) {
      return { success: false, status: 'ERROR', error: 'Không tìm thấy API Key bí mật.' };
    }

    // Set status to CHECKING
    this.updateStatus(id, 'CHECKING');

    try {
      const res = await fetch('/api/gemini-keys/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey,
          model: model,
        }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textError = await res.text();
        throw new Error(`Lỗi máy chủ (${res.status}): Không thể xác thực API Key ngay lúc này.`);
      }

      const data = await res.json();
      
      if (data.success && data.status === 'ACTIVE') {
        await this.updateConfig(id, {
          status: 'ACTIVE',
          lastCheckedAt: Timestamp.now() as any,
          responseTimeMs: data.responseTimeMs,
          lastError: null as any,
        });
        return {
          success: true,
          status: 'ACTIVE',
          responseTimeMs: data.responseTimeMs,
          model: data.model,
          message: data.message || '✓ API hoạt động bình thường',
        };
      } else {
        const status: ApiStatus = data.status || 'ERROR';
        const errorMsg = data.error || 'Kiểm tra API thất bại';
        await this.updateConfig(id, {
          status,
          lastCheckedAt: Timestamp.now() as any,
          responseTimeMs: data.responseTimeMs,
          lastError: errorMsg,
        });
        return {
          success: false,
          status,
          error: errorMsg,
          responseTimeMs: data.responseTimeMs,
        };
      }
    } catch (e: any) {
      const errorMsg = e.message || 'Lỗi mạng khi kiểm tra API';
      await this.updateConfig(id, {
        status: 'ERROR',
        lastCheckedAt: Timestamp.now() as any,
        lastError: errorMsg,
      });
      return {
        success: false,
        status: 'ERROR',
        error: errorMsg,
      };
    }
  },

  async updateStatus(id: string, status: ApiStatus) {
    try {
      await updateDoc(doc(db, 'geminiApisPublic', id), { status });
    } catch (e) {}
  },

  async testAllConfigs() {
    const configs = this.getConfigs();
    for (const config of configs) {
      if (config.enabled) {
        await this.validateApi(config.id);
      }
    }
  },

  async updateConfig(id: string, updates: Partial<GeminiApiConfig>) {
    try {
      // Remove apiKey from public updates if it exists
      const publicUpdates = { ...updates };
      delete publicUpdates.apiKey;
      delete publicUpdates.id;
      
      await updateDoc(doc(db, 'geminiApisPublic', id), {
        ...publicUpdates,
        updatedAt: Timestamp.now(),
      });
    } catch (e) {
      console.error("Lỗi updateConfig:", e);
    }
  },

  // Record AI execution usage (frontend logs)
  recordUsage(
    featureName: string,
    success: boolean,
    responseTimeMs?: number,
    error?: string
  ) {
    const active = this.getActiveApi();
    const now = new Date().toISOString();

    if (active) {
       // Only increment local and async update firestore to avoid blocking
       import('firebase/firestore').then(({ increment }) => {
          updateDoc(doc(db, 'geminiApisPublic', active.id), {
            lastUsedAt: Timestamp.now(),
            totalRequests: increment(1),
            successfulRequests: increment(success ? 1 : 0),
            failedRequests: increment(success ? 0 : 1),
            ...(responseTimeMs ? { responseTimeMs } : {}),
            ...(error ? { lastError: error } : {})
          }).catch(console.error);
       });
    }

    // Append to usage history log (Local Storage is fine for logs since it's just history)
    try {
      const history = this.getUsageHistory();
      const item: ApiUsageHistoryItem = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: now,
        featureName,
        apiId: active?.id || 'default_system',
        apiName: active?.name || 'Mặc định hệ thống',
        apiEmail: active?.email || 'system@gemini',
        model: active?.model || 'gemini-2.5-flash',
        status: success ? 'SUCCESS' : 'ERROR',
        responseTimeMs,
        error,
      };
      const newHistory = [item, ...history].slice(0, 200);
      localStorage.setItem(STORAGE_KEYS.USAGE_HISTORY, JSON.stringify(newHistory));
      notifyListeners();
    } catch (e) {}
  },

  getUsageHistory(): ApiUsageHistoryItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USAGE_HISTORY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  clearUsageHistory() {
    try {
      localStorage.removeItem(STORAGE_KEYS.USAGE_HISTORY);
      notifyListeners();
    } catch (e) {}
  },

  // Auto handle error when an AI request fails
  handleApiError(err: any): { isKeyError: boolean; status?: ApiStatus; message: string } {
    const errorStr = String(err?.message || err || '');
    const active = this.getActiveApi();

    let isKeyError = false;
    let newStatus: ApiStatus | undefined;
    let userMsg = errorStr;

    if (
      errorStr.includes('API_KEY_INVALID') ||
      errorStr.includes('API key not valid') ||
      errorStr.includes('INVALID_ARGUMENT') ||
      errorStr.includes('Chưa cấu hình API') ||
      errorStr.includes('chưa được nạp Gemini API Key')
    ) {
      isKeyError = true;
      newStatus = 'INVALID';
      userMsg = 'API Key hiện tại không hợp lệ. Hệ thống sẽ đổi tự động, hoặc vui lòng chọn API khác.';
    } else if (
      errorStr.includes('RESOURCE_EXHAUSTED') ||
      errorStr.includes('quota') ||
      errorStr.includes('Quota')
    ) {
      isKeyError = true;
      if (errorStr.toLowerCase().includes('rate limit') || errorStr.toLowerCase().includes('rate_limit')) {
        newStatus = 'RATE_LIMITED';
        userMsg = 'API hiện tại đang bận (Rate Limit). Hệ thống sẽ đổi tự động...';
      } else {
        newStatus = 'QUOTA_EXCEEDED';
        userMsg = 'API hiện tại đã hết hạn mức Quota. Hệ thống sẽ đổi tự động...';
      }
    } else if (errorStr.includes('PERMISSION_DENIED')) {
      isKeyError = true;
      newStatus = 'INVALID';
      userMsg = 'API Key không có quyền truy cập Gemini.';
    }

    if (isKeyError && newStatus && active) {
      this.updateConfig(active.id, {
        status: newStatus,
        lastError: userMsg,
      });
      // Fallback
      setTimeout(() => {
         this.switchToNextActiveApi();
      }, 500);
    }

    return { isKeyError, status: newStatus, message: userMsg };
  },

  // Switch to next available active API automatically
  switchToNextActiveApi(): GeminiApiConfig | null {
    const currentId = this.getActiveApiId();
    const available = this.getAvailableApis().filter(c => c.id !== currentId && c.status === 'ACTIVE');
    if (available.length > 0) {
      this.setActiveApiId(available[0].id);
      return available[0];
    }
    return null;
  }
};
