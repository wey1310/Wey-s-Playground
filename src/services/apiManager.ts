import { 
  KeyPoolPublicState, 
  PoolKeyPublic, 
  PoolCooldownItem, 
  GeminiApiConfig, 
  ApiStatus, 
  ApiUsageHistoryItem 
} from '../types';

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

const STORAGE_KEYS = {
  USAGE_HISTORY: 'wey_api_usage_history',
};

let cachedPoolState: KeyPoolPublicState | null = null;
let isLoadingPool = false;
let hasInitialized = false;

async function fetchPoolStateFromServer(): Promise<KeyPoolPublicState | null> {
  const statusEndpoints = [
    '/api/gemini/status',
    '/api/gemini/rotation-status',
    '/api/gemini-keys/pool'
  ];

  let lastError: Error | null = null;
  isLoadingPool = true;

  for (const endpoint of statusEndpoints) {
    try {
      const res = await fetch(`${endpoint}?t=${Date.now()}`, { 
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      });
      
      // If 404 or 405, continue to fallback endpoint
      if (res.status === 404 || res.status === 405) {
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data && typeof data === 'object') {
        const totalKeys = typeof data.totalKeysConfigured === 'number'
          ? data.totalKeysConfigured
          : (typeof data.totalConfigured === 'number' ? data.totalConfigured : (data.keys ? data.keys.length : 0));

        cachedPoolState = {
          success: data.success ?? true,
          totalConfigured: totalKeys,
          totalKeysConfigured: totalKeys,
          usableKeysNow: typeof data.usableKeysNow === 'number' ? data.usableKeysNow : totalKeys,
          ignoredKeys: data.ignoredKeys || [],
          quarantinedKeys: data.quarantinedKeys || [],
          keys: data.keys || [],
          stats: data.stats || {
            totalRequests: 0,
            totalSuccess: 0,
            totalFail: 0,
            rotate429Count: 0,
            fallbackModelCount: 0,
            fallbackKeyCount: 0
          },
          cooldowns: data.cooldowns || [],
          modelPriority: data.modelPriority || data.modelTiers || [],
          modelTiers: data.modelTiers || data.modelPriority || [],
          lastUsedModel: data.lastUsedModel || 'gemini-3.7-flash',
          error: data.error
        };
        isLoadingPool = false;
        notifyListeners();
        return cachedPoolState;
      }
    } catch (e: any) {
      lastError = e;
      // Do not log spam on 404/405 fallback, but record last error
      if (!e.message?.includes('404') && !e.message?.includes('405')) {
        console.warn(`[KeyPool] Status fetch failed at ${endpoint}:`, e.message || e);
      }
    }
  }

  isLoadingPool = false;
  if (lastError) {
    console.warn('Could not load Gemini Key Pool state from server:', lastError);
    if (!cachedPoolState) {
      cachedPoolState = {
        success: false,
        totalConfigured: 0,
        totalKeysConfigured: 0,
        usableKeysNow: 0,
        ignoredKeys: [],
        quarantinedKeys: [],
        keys: [],
        stats: {
          totalRequests: 0,
          totalSuccess: 0,
          totalFail: 0,
          rotate429Count: 0,
          fallbackModelCount: 0,
          fallbackKeyCount: 0
        },
        cooldowns: [],
        modelPriority: [],
        modelTiers: [],
        lastUsedModel: 'gemini-3.7-flash',
        error: lastError.message || 'Lỗi kết nối máy chủ Key Pool'
      };
      notifyListeners();
    }
  }

  return cachedPoolState;
}

export const apiManager = {
  subscribe(fn: Listener) {
    if (!hasInitialized) {
      hasInitialized = true;
      fetchPoolStateFromServer();
    }
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  getPoolState(): KeyPoolPublicState {
    if (!hasInitialized) {
      hasInitialized = true;
      fetchPoolStateFromServer();
    }
    return cachedPoolState || {
      success: true,
      totalConfigured: 0,
      keys: [],
      stats: {
        totalRequests: 0,
        totalSuccess: 0,
        totalFail: 0,
        rotate429Count: 0,
        fallbackModelCount: 0,
        fallbackKeyCount: 0
      },
      cooldowns: [],
      modelPriority: [
        { tier: 1, model: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', description: 'Model mạnh nhất, tối ưu chiều sâu worldbuilding và độ nhất quán lore', isLastUsed: true },
        { tier: 2, model: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', description: 'Cân bằng hiệu năng cao và tốc độ phản hồi nhanh' },
        { tier: 3, model: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', description: 'Bản xem trước thế hệ Gemini 3 tốc độ cao' },
        { tier: 4, model: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', description: 'Mô hình siêu nhẹ, tiết kiệm tài nguyên' },
        { tier: 5, model: 'gemini-flash-latest', name: 'Gemini Flash Latest', description: 'Mô hình dự phòng ổn định cao nhất' },
      ],
      lastUsedModel: 'gemini-3.7-flash'
    };
  },

  async refreshPool(): Promise<KeyPoolPublicState> {
    try {
      isLoadingPool = true;
      const refreshEndpoints = [
        '/api/gemini/refresh',
        '/api/gemini-keys/pool/refresh'
      ];

      let res: Response | null = null;
      for (const ep of refreshEndpoints) {
        try {
          res = await fetch(ep, { 
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
          });
          if (res.ok) break;
        } catch {
          // continue to next endpoint
        }
      }

      if (res && res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          const totalKeys = typeof data.totalKeysConfigured === 'number'
            ? data.totalKeysConfigured
            : (typeof data.totalConfigured === 'number' ? data.totalConfigured : (data.keys ? data.keys.length : 0));

          cachedPoolState = {
            success: data.success ?? true,
            totalConfigured: totalKeys,
            totalKeysConfigured: totalKeys,
            usableKeysNow: typeof data.usableKeysNow === 'number' ? data.usableKeysNow : totalKeys,
            ignoredKeys: data.ignoredKeys || [],
            quarantinedKeys: data.quarantinedKeys || [],
            keys: data.keys || [],
            stats: data.stats || {
              totalRequests: 0,
              totalSuccess: 0,
              totalFail: 0,
              rotate429Count: 0,
              fallbackModelCount: 0,
              fallbackKeyCount: 0
            },
            cooldowns: data.cooldowns || [],
            modelPriority: data.modelPriority || data.modelTiers || [],
            modelTiers: data.modelTiers || data.modelPriority || [],
            lastUsedModel: data.lastUsedModel || 'gemini-3.7-flash',
            error: data.error
          };
          notifyListeners();
          return cachedPoolState;
        }
      }
    } catch (e) {
      console.warn('Refresh pool notice:', e);
    } finally {
      isLoadingPool = false;
    }
    return this.getPoolState();
  },

  async testRotation(prompt?: string): Promise<{
    success: boolean;
    text?: string;
    usedModel?: string;
    keyIndexUsed?: number;
    keyMasked?: string;
    downgraded?: boolean;
    meta?: {
      keyId?: string;
      envName?: string;
      keyMasked?: string;
      keyIndex?: number;
      keyLength?: number;
      modelUsed?: string;
      usedModel?: string;
      latency?: number;
      keyRotations?: number;
      modelFallbacks?: number;
      fallbackModelCount?: number;
      fallbackKeyCount?: number;
      downgraded?: boolean;
    };
    error?: string;
  }> {
    const testPrompt = prompt || 'Kiểm tra kết nối hệ thống xoay key. Hãy chào ngắn gọn 1 câu.';
    try {
      let res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: testPrompt })
      });

      if (res.status === 404 || res.status === 405) {
        res = await fetch('/api/gemini-keys/test-rotation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: testPrompt })
        });
      }

      const data = await res.json();
      setTimeout(() => {
        fetchPoolStateFromServer();
      }, 300);
      return data;
    } catch (e: any) {
      return {
        success: false,
        error: e.message || 'Lỗi mạng khi kiểm tra xoay vòng key'
      };
    }
  },

  // Backward compatibility helpers
  hasAnyApis(): boolean {
    const pool = this.getPoolState();
    return pool.totalConfigured > 0;
  },

  hasActiveApi(): boolean {
    const pool = this.getPoolState();
    return pool.totalConfigured > 0 && pool.keys.some(k => k.status === 'ACTIVE');
  },

  getActiveApi(): GeminiApiConfig | null {
    const pool = this.getPoolState();
    const activeKey = pool.keys.find(k => k.status === 'ACTIVE') || pool.keys[0];
    if (!activeKey) return null;
    return {
      id: activeKey.id,
      name: activeKey.envName,
      email: 'vercel@environment',
      apiKey: activeKey.masked,
      model: pool.lastUsedModel || 'gemini-3.7-flash',
      enabled: true,
      status: activeKey.status as ApiStatus,
      totalRequests: pool.stats.totalRequests,
      successfulRequests: pool.stats.totalSuccess,
      failedRequests: pool.stats.totalFail,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  getActiveApiId(): string | null {
    const active = this.getActiveApi();
    return active?.id || null;
  },

  setActiveApiId(_id: string | null) {
    // No-op in Key Pool architecture (auto managed server side)
    notifyListeners();
  },

  getConfigs(): GeminiApiConfig[] {
    const pool = this.getPoolState();
    return pool.keys.map(k => ({
      id: k.id,
      name: k.envName,
      email: 'vercel@environment',
      apiKey: k.masked,
      model: pool.lastUsedModel || 'gemini-3.7-flash',
      enabled: true,
      status: k.status as ApiStatus,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  },

  handleApiError(errorStr: string) {
    console.warn("API Error caught in frontend:", errorStr);
    // Refresh pool in background to capture latest server-side cooldowns
    fetchPoolStateFromServer();
  },

  recordUsage(
    featureName: string,
    success: boolean,
    responseTimeMs?: number,
    error?: string
  ) {
    try {
      const history = this.getUsageHistory();
      const pool = this.getPoolState();
      const item: ApiUsageHistoryItem = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        featureName,
        apiId: 'vercel_pool',
        apiName: 'Vercel Key Pool',
        apiEmail: 'system@gemini-pool',
        model: pool.lastUsedModel || 'gemini-3.7-flash',
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
  }
};
