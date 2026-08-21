import { GeminiApiConfig, ApiStatus, ApiUsageHistoryItem } from '../types';

const STORAGE_KEYS = {
  CONFIGS: 'wey_gemini_api_configs',
  ACTIVE_ID: 'wey_active_api_id',
  USAGE_HISTORY: 'wey_api_usage_history',
};

// Event listeners for reactive state updates
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

export const apiManager = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  getConfigs(): GeminiApiConfig[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CONFIGS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to load api configs from localStorage:', e);
      return [];
    }
  },

  setConfigs(configs: GeminiApiConfig[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIGS, JSON.stringify(configs));
      notifyListeners();
    } catch (e) {
      console.error('Failed to save api configs to localStorage:', e);
    }
  },

  getActiveApiId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
    } catch {
      return null;
    }
  },

  setActiveApiId(id: string | null) {
    try {
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
    const activeId = this.getActiveApiId();
    const configs = this.getConfigs();
    if (activeId) {
      const found = configs.find(c => c.id === activeId && c.enabled);
      if (found) return found;
    }
    // Fallback: nếu chưa chọn ID cụ thể, tự động lấy cấu hình đầu tiên đang bật
    const firstEnabled = configs.find(c => c.enabled);
    if (firstEnabled) {
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

  saveConfig(
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
  ): GeminiApiConfig {
    const configs = this.getConfigs();
    const now = new Date().toISOString();
    const cleanKey = data.apiKey.trim();
    const cleanEmail = data.email.trim();
    const cleanName = data.name.trim() || `API (${cleanEmail || 'Gemini'})`;
    const model = data.model?.trim() || 'gemini-2.5-flash';
    // Mặc định nạp key vào là sẵn sàng ACTIVE ngay
    const initialStatus = data.status || 'ACTIVE';

    let target: GeminiApiConfig;

    if (data.id) {
      const idx = configs.findIndex(c => c.id === data.id);
      if (idx !== -1) {
        const existing = configs[idx];
        target = {
          ...existing,
          name: cleanName,
          email: cleanEmail,
          apiKey: cleanKey,
          model,
          notes: data.notes?.trim() || '',
          enabled: data.enabled !== undefined ? data.enabled : existing.enabled,
          status: initialStatus,
          updatedAt: now,
        };
        configs[idx] = target;
      } else {
        target = {
          id: data.id,
          name: cleanName,
          email: cleanEmail,
          apiKey: cleanKey,
          model,
          notes: data.notes?.trim() || '',
          enabled: data.enabled !== undefined ? data.enabled : true,
          status: initialStatus,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          createdAt: now,
          updatedAt: now,
        };
        configs.push(target);
      }
    } else {
      target = {
        id: `api_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: cleanName,
        email: cleanEmail,
        apiKey: cleanKey,
        model,
        notes: data.notes?.trim() || '',
        enabled: data.enabled !== undefined ? data.enabled : true,
        status: initialStatus,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        createdAt: now,
        updatedAt: now,
      };
      configs.push(target);
    }

    this.setConfigs(configs);

    // Luôn chọn API vừa nạp/sửa làm API hoạt động mặc định
    this.setActiveApiId(target.id);

    return target;
  },

  deleteConfig(id: string) {
    const configs = this.getConfigs().filter(c => c.id !== id);
    this.setConfigs(configs);
    if (this.getActiveApiId() === id) {
      const nextActive = configs.find(c => c.enabled);
      this.setActiveApiId(nextActive ? nextActive.id : null);
    }
  },

  toggleEnabled(id: string) {
    const configs = this.getConfigs();
    const idx = configs.findIndex(c => c.id === id);
    if (idx !== -1) {
      configs[idx].enabled = !configs[idx].enabled;
      configs[idx].updatedAt = new Date().toISOString();
      this.setConfigs(configs);
      if (!configs[idx].enabled && this.getActiveApiId() === id) {
        const nextActive = configs.find(c => c.id !== id && c.enabled);
        this.setActiveApiId(nextActive ? nextActive.id : null);
      }
    }
  },

  // Perform genuine verification test against Gemini backend
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
    let config: GeminiApiConfig | undefined;
    if (typeof configOrId === 'string') {
      config = this.getConfigs().find(c => c.id === configOrId);
      if (!config) {
        return { success: false, status: 'ERROR', error: 'Không tìm thấy cấu hình API.' };
      }
    } else {
      config = configOrId;
    }

    // Set status to CHECKING
    this.updateStatus(config.id, 'CHECKING');

    try {
      const res = await fetch('/api/gemini-keys/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: config.apiKey,
          model: config.model || 'gemini-2.5-flash',
        }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textError = await res.text();
        console.warn("Phản hồi không phải JSON từ validate API:", res.status, textError.slice(0, 100));
        throw new Error(`Lỗi máy chủ (${res.status}): Không thể xác thực API Key ngay lúc này.`);
      }

      const data = await res.json();
      const now = new Date().toISOString();

      if (data.success && data.status === 'ACTIVE') {
        this.updateConfig(config.id, {
          status: 'ACTIVE',
          lastCheckedAt: now,
          responseTimeMs: data.responseTimeMs,
          lastError: undefined,
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
        this.updateConfig(config.id, {
          status,
          lastCheckedAt: now,
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
      const now = new Date().toISOString();
      const errorMsg = e.message || 'Lỗi mạng khi kiểm tra API';
      this.updateConfig(config.id, {
        status: 'ERROR',
        lastCheckedAt: now,
        lastError: errorMsg,
      });
      return {
        success: false,
        status: 'ERROR',
        error: errorMsg,
      };
    }
  },

  updateStatus(id: string, status: ApiStatus) {
    const configs = this.getConfigs();
    const idx = configs.findIndex(c => c.id === id);
    if (idx !== -1) {
      configs[idx].status = status;
      this.setConfigs(configs);
    }
  },

  async testAllConfigs() {
    const configs = this.getConfigs();
    for (const config of configs) {
      if (config.enabled) {
        await this.validateApi(config);
      }
    }
  },

  updateConfig(id: string, updates: Partial<GeminiApiConfig>) {
    const configs = this.getConfigs();
    const idx = configs.findIndex(c => c.id === id);
    if (idx !== -1) {
      configs[idx] = {
        ...configs[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.setConfigs(configs);
    }
  },

  // Record AI execution usage
  recordUsage(
    featureName: string,
    success: boolean,
    responseTimeMs?: number,
    error?: string
  ) {
    const active = this.getActiveApi();
    const now = new Date().toISOString();

    if (active) {
      const updates: Partial<GeminiApiConfig> = {
        lastUsedAt: now,
        totalRequests: (active.totalRequests || 0) + 1,
        successfulRequests: (active.successfulRequests || 0) + (success ? 1 : 0),
        failedRequests: (active.failedRequests || 0) + (success ? 0 : 1),
      };
      if (responseTimeMs) updates.responseTimeMs = responseTimeMs;
      if (error) updates.lastError = error;
      this.updateConfig(active.id, updates);
    }

    // Append to usage history log
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
      const newHistory = [item, ...history].slice(0, 200); // Keep latest 200 logs
      localStorage.setItem(STORAGE_KEYS.USAGE_HISTORY, JSON.stringify(newHistory));
      notifyListeners();
    } catch (e) {
      console.error('Failed to record api usage history:', e);
    }
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
    } catch (e) {
      console.error('Failed to clear usage history:', e);
    }
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
      errorStr.includes('Chưa cấu hình API')
    ) {
      isKeyError = true;
      newStatus = 'INVALID';
      userMsg = 'API Key hiện tại không hợp lệ hoặc đã bị hủy. Vui lòng chọn hoặc cấu hình API khác.';
    } else if (
      errorStr.includes('RESOURCE_EXHAUSTED') ||
      errorStr.includes('quota') ||
      errorStr.includes('Quota')
    ) {
      isKeyError = true;
      if (errorStr.toLowerCase().includes('rate limit') || errorStr.toLowerCase().includes('rate_limit')) {
        newStatus = 'RATE_LIMITED';
        userMsg = 'API hiện tại đã chạm giới hạn tốc độ (Rate Limit). Vui lòng đổi sang API khác hoặc thử lại sau.';
      } else {
        newStatus = 'QUOTA_EXCEEDED';
        userMsg = 'API hiện tại đã hết hạn mức Quota. Vui lòng chọn API từ tài khoản Gmail/Project khác.';
      }
    } else if (errorStr.includes('PERMISSION_DENIED')) {
      isKeyError = true;
      newStatus = 'INVALID';
      userMsg = 'API Key không có quyền truy cập Gemini. Vui lòng kiểm tra lại cấu hình tài khoản.';
    }

    if (isKeyError && newStatus && active) {
      this.updateConfig(active.id, {
        status: newStatus,
        lastError: userMsg,
      });
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
