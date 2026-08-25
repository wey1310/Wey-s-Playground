import { GoogleGenAI } from '@google/genai';

export const MODEL_PRIORITY = [
  "gemini-3.7-flash",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest"
] as const;

export type ModelName = typeof MODEL_PRIORITY[number];

export interface PoolKey {
  id: string;        // e.g. "key-1", "key-2", "key-10"
  envName: string;   // e.g. "GEMINI_API_KEY_1", "GEMINI_API_KEY_10"
  number: number;    // e.g. 1, 2, 10
  key: string;       // Secret API key
  masked: string;    // e.g. "AIza...NhqQ"
  length: number;    // Length of the key
}

export type ErrorCategory = 
  | 'RATE_LIMIT' 
  | 'DAILY_QUOTA' 
  | 'AUTH_ERROR' 
  | 'INVALID_KEY' 
  | 'MODEL_UNAVAILABLE' 
  | 'TEMPORARY_ERROR' 
  | 'INVALID_REQUEST' 
  | 'UNKNOWN';

export interface ClassifiedError {
  type: ErrorCategory;
  cooldownDurationMs: number;
  userMessage: string;
}

export interface CooldownItem {
  keyId: string;
  envName: string;
  masked: string;
  model: string;
  reason: string;
  category: ErrorCategory;
  cooldownUntil: number;
}

export interface PoolStats {
  totalRequests: number;
  totalSuccess: number;
  totalFail: number;
  rotate429Count: number;
  fallbackModelCount: number;
  fallbackKeyCount: number;
}

export interface GenerateResult {
  success: boolean;
  response: any;
  text: string;
  keyId: string;
  envName: string;
  keyMasked: string;
  keyLength: number;
  modelUsed: string;
  latency: number;
  keyRotations: number;
  modelFallbacks: number;
}

export function maskApiKey(key: string): { masked: string; length: number } {
  const clean = (key || '').trim();
  const len = clean.length;
  if (len === 0) return { masked: '••••••••', length: 0 };
  if (len <= 8) return { masked: '••••••••', length: len };
  const prefix = clean.slice(0, 6);
  const suffix = clean.slice(-4);
  return {
    masked: `${prefix}...${suffix}`,
    length: len
  };
}

/**
 * ErrorClassifier
 * Phân loại chính xác các loại lỗi từ Google Gemini API:
 * - RATE_LIMIT (429 / RPM limit)
 * - DAILY_QUOTA (Daily limit exhausted)
 * - AUTH_ERROR (403 / Permission denied / Disabled project)
 * - INVALID_KEY (401 / Invalid API Key)
 * - MODEL_UNAVAILABLE (404 / Model not supported)
 * - TEMPORARY_ERROR (500, 503, Network)
 * - INVALID_REQUEST (400 / Bad request, Schema error - no cooldown)
 */
export class ErrorClassifier {
  public static classify(errMessage: string, httpStatus?: number): ClassifiedError {
    const msgLower = (errMessage || '').toLowerCase();

    // 1. Invalid Request (400) - Bad Prompt / Schema -> DO NOT RETRY OR COOLDOWN
    if (
      msgLower.includes('invalid argument') ||
      msgLower.includes('bad request') ||
      msgLower.includes('contents must not be empty') ||
      msgLower.includes('schema validation')
    ) {
      return {
        type: 'INVALID_REQUEST',
        cooldownDurationMs: 0,
        userMessage: 'Yêu cầu không hợp lệ hoặc dữ liệu đầu vào không đúng định dạng.'
      };
    }

    // 2. Authentication / Invalid Key (401)
    if (
      msgLower.includes('api_key_invalid') ||
      msgLower.includes('api key not valid') ||
      msgLower.includes('unauthenticated') ||
      msgLower.includes('key expired') ||
      httpStatus === 401
    ) {
      return {
        type: 'INVALID_KEY',
        cooldownDurationMs: 24 * 3600 * 1000, // 24 hours
        userMessage: 'API Key không hợp lệ hoặc đã hết hạn.'
      };
    }

    // 3. Permission / Disabled Project (403)
    if (
      msgLower.includes('permission_denied') ||
      msgLower.includes('consumer_invalid') ||
      msgLower.includes('project_disabled') ||
      httpStatus === 403
    ) {
      return {
        type: 'AUTH_ERROR',
        cooldownDurationMs: 24 * 3600 * 1000, // 24 hours
        userMessage: 'Không có quyền truy cập hoặc Project Google Cloud đã bị tắt.'
      };
    }

    // 4. Model not found (404)
    if (
      msgLower.includes('not_found') ||
      msgLower.includes('models/') ||
      msgLower.includes('unsupported model') ||
      httpStatus === 404
    ) {
      return {
        type: 'MODEL_UNAVAILABLE',
        cooldownDurationMs: 24 * 3600 * 1000, // 24 hours
        userMessage: 'Mô hình AI không khả dụng cho API Key này.'
      };
    }

    // 5. Rate Limit vs Daily Quota (429 / RESOURCE_EXHAUSTED)
    if (
      msgLower.includes('resource_exhausted') ||
      msgLower.includes('quota') ||
      msgLower.includes('429') ||
      httpStatus === 429
    ) {
      if (
        msgLower.includes('per day') ||
        msgLower.includes('daily') ||
        msgLower.includes('quota exceeded for quota metric') ||
        msgLower.includes('free tier')
      ) {
        return {
          type: 'DAILY_QUOTA',
          cooldownDurationMs: 6 * 3600 * 1000, // 6 hours
          userMessage: 'API Key đã sử dụng hết hạn mức theo ngày (Daily Quota).'
        };
      }

      // RPM limit
      let retryAfterSeconds = 60;
      const retryMatch = msgLower.match(/retry after\s*(\d+)/i) || msgLower.match(/retry in\s*(\d+)/i);
      if (retryMatch && retryMatch[1]) {
        retryAfterSeconds = Math.max(10, Math.min(3600, parseInt(retryMatch[1], 10)));
      }

      return {
        type: 'RATE_LIMIT',
        cooldownDurationMs: retryAfterSeconds * 1000,
        userMessage: `Vượt quá giới hạn tần suất RPM (429). Tạm nghỉ ${retryAfterSeconds}s.`
      };
    }

    // 6. Temporary 5xx / Network
    if (
      msgLower.includes('fetch_error') ||
      msgLower.includes('econnrefused') ||
      msgLower.includes('enotfound') ||
      msgLower.includes('etimedout') ||
      msgLower.includes('network') ||
      msgLower.includes('503') ||
      msgLower.includes('500') ||
      msgLower.includes('socket hang up') ||
      msgLower.includes('service unavailable')
    ) {
      return {
        type: 'TEMPORARY_ERROR',
        cooldownDurationMs: 15 * 1000, // 15 seconds
        userMessage: 'Lỗi mạng hoặc dịch vụ tạm thời không phản hồi.'
      };
    }

    return {
      type: 'UNKNOWN',
      cooldownDurationMs: 30 * 1000,
      userMessage: errMessage.slice(0, 150) || 'Lỗi không xác định.'
    };
  }
}

export function classifyError(errMessage: string, httpStatus?: number): ClassifiedError {
  return ErrorClassifier.classify(errMessage, httpStatus);
}

/**
 * GeminiKeyPoolManager
 * Quản lý kho API Key Gemini đa nguồn, hỗ trợ:
 * 1. Đọc và lọc tất cả process.env.GEMINI_API_KEY_*
 * 2. Thuật toán Round-Robin phân phối đều tải
 * 3. Phân loại lỗi ErrorClassifier
 * 4. Cơ chế Cooldown cô lập theo từng cặp (Key + Model)
 * 5. Phương thức generate() tự động retry và hạ cấp mô hình theo thứ tự ưu tiên:
 *    gemini-3.7-flash -> gemini-3.5-flash -> gemini-3-flash-preview -> gemini-3.1-flash-lite -> gemini-flash-latest
 */
export class GeminiKeyPoolManager {
  private keys: PoolKey[] = [];
  private currentKeyIndex = 0;
  private cooldowns: Map<string, CooldownItem> = new Map();
  private stats: PoolStats = {
    totalRequests: 0,
    totalSuccess: 0,
    totalFail: 0,
    rotate429Count: 0,
    fallbackModelCount: 0,
    fallbackKeyCount: 0
  };
  private lastUsedModel: string = MODEL_PRIORITY[0];
  private isLoaded = false;

  constructor() {
    this.loadGeminiKeys();
  }

  /**
   * 1. Đọc tất cả biến process.env.GEMINI_API_KEY_*, loại bỏ giá trị rỗng và sắp xếp theo thứ tự số vào pool.
   */
  public loadGeminiKeys(): PoolKey[] {
    const loadedList: PoolKey[] = [];
    const scannedKeys = new Set<string>();

    const envSource = (typeof process !== "undefined" ? process.env : {}) as any;

    const sanitizeKey = (raw: any): string => {
      if (!raw || typeof raw !== 'string') return '';
      let clean = raw.trim();
      if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
        clean = clean.slice(1, -1).trim();
      }
      return clean;
    };

    // 1. Quét theo số thứ tự từ 1 đến 50
    for (let i = 1; i <= 50; i++) {
      const keysToCheck = [
        `GEMINI_API_KEY_${i}`,
        `VITE_GEMINI_API_KEY_${i}`,
        `NEXT_PUBLIC_GEMINI_API_KEY_${i}`,
        `GOOGLE_API_KEY_${i}`,
        `GEMINI_KEY_${i}`,
        `API_KEY_${i}`
      ];
      
      for (const keyName of keysToCheck) {
        let value = envSource[keyName];
        if (!value && typeof globalThis !== "undefined" && (globalThis as any).process?.env) {
          value = (globalThis as any).process.env[keyName];
        }

        const cleanVal = sanitizeKey(value);
        if (cleanVal && !scannedKeys.has(cleanVal)) {
          const { masked, length } = maskApiKey(cleanVal);
          loadedList.push({
            id: `key-${i}`,
            envName: keyName,
            number: i,
            key: cleanVal,
            masked,
            length
          });
          scannedKeys.add(cleanVal);
        }
      }
    }

    // 2. Quét các tên biến đơn lẻ phổ biến
    const singleKeyNames = [
      'GEMINI_API_KEY',
      'VITE_GEMINI_API_KEY',
      'NEXT_PUBLIC_GEMINI_API_KEY',
      'GOOGLE_API_KEY',
      'GEMINI_KEY',
      'GOOGLE_GEMINI_API_KEY',
      'API_KEY'
    ];

    for (const keyName of singleKeyNames) {
      let value = envSource[keyName];
      if (!value && typeof globalThis !== "undefined" && (globalThis as any).process?.env) {
        value = (globalThis as any).process.env[keyName];
      }
      const cleanVal = sanitizeKey(value);
      if (cleanVal && !scannedKeys.has(cleanVal)) {
        const nextNum = loadedList.length + 1;
        const { masked, length } = maskApiKey(cleanVal);
        loadedList.push({
          id: `key-${nextNum}`,
          envName: keyName,
          number: nextNum,
          key: cleanVal,
          masked,
          length
        });
        scannedKeys.add(cleanVal);
      }
    }

    // 3. Quét toàn bộ process.env để tìm bất kỳ key nào có định dạng Google API (AIza... hoặc AQ....) hoặc chứa chữ GEMINI/GOOGLE_API
    try {
      for (const [k, v] of Object.entries(envSource)) {
        const cleanVal = sanitizeKey(v);
        if (!cleanVal || scannedKeys.has(cleanVal)) continue;

        const upperKey = k.toUpperCase();
        const isGeminiName = upperKey.includes('GEMINI') || upperKey.includes('GOOGLE_API') || upperKey.includes('GENAI');
        const isAiZaPattern = (cleanVal.startsWith('AIza') || cleanVal.startsWith('AQ.')) && cleanVal.length >= 30;

        if (isGeminiName || isAiZaPattern) {
          const nextNum = loadedList.length + 1;
          const { masked, length } = maskApiKey(cleanVal);
          loadedList.push({
            id: `key-${nextNum}`,
            envName: k,
            number: nextNum,
            key: cleanVal,
            masked,
            length
          });
          scannedKeys.add(cleanVal);
        }
      }
    } catch {
      // Ignored
    }

    // 4. Fallback nếu có danh sách dạng GEMINI_API_KEYS (ngăn cách bởi dấu phẩy)
    if (envSource.GEMINI_API_KEYS) {
      const parts = envSource.GEMINI_API_KEYS.split(',');
      parts.forEach((p: string, idx: number) => {
        const cleanVal = sanitizeKey(p);
        if (cleanVal && !scannedKeys.has(cleanVal)) {
          const num = loadedList.length + 1;
          const { masked, length } = maskApiKey(cleanVal);
          loadedList.push({
            id: `key-${num}`,
            envName: `GEMINI_API_KEYS_${idx + 1}`,
            number: num,
            key: cleanVal,
            masked,
            length
          });
          scannedKeys.add(cleanVal);
        }
      });
    }

    loadedList.sort((a, b) => a.number - b.number);
    this.keys = loadedList;
    if (this.keys.length > 0) {
      this.isLoaded = true;
    }
    return this.keys;
  }

  public loadKeys(): PoolKey[] {
    return this.loadGeminiKeys();
  }

  public getKeys(): PoolKey[] {
    if (!this.isLoaded) this.loadGeminiKeys();
    return this.keys;
  }

  public getStats(): PoolStats {
    return { ...this.stats };
  }

  public getActiveCooldowns(): CooldownItem[] {
    const now = Date.now();
    const active: CooldownItem[] = [];
    for (const item of this.cooldowns.values()) {
      if (item.cooldownUntil > now) {
        active.push(item);
      }
    }
    return active;
  }

  /**
   * 4. Cooldown Mechanism cô lập lỗi theo cặp (Key + Model)
   * Kiểm tra xem cặp Key + Model có khả dụng hay đang trong thời gian cooldown
   */
  public isKeyAvailableForModel(keyId: string, model: string): boolean {
    const cdKey = `${keyId}_${model}`;
    const cd = this.cooldowns.get(cdKey);
    if (!cd) return true;
    if (cd.cooldownUntil <= Date.now()) {
      // Cooldown đã hết hạn, tự động mở khóa
      this.cooldowns.delete(cdKey);
      return true;
    }
    return false;
  }

  /**
   * Đưa riêng cặp (Key + Model) vào trạng thái Cooldown
   */
  public cooldownKeyModel(
    key: PoolKey,
    model: string,
    category: ErrorCategory,
    durationMs: number,
    reason: string
  ) {
    if (durationMs <= 0) return;
    const cdKey = `${key.id}_${model}`;
    const item: CooldownItem = {
      keyId: key.id,
      envName: key.envName,
      masked: key.masked,
      model,
      reason,
      category,
      cooldownUntil: Date.now() + durationMs
    };
    this.cooldowns.set(cdKey, item);
  }

  /**
   * 2 & 5. Phương thức generate() / generateContent()
   * - Sử dụng Round-Robin chọn key
   * - Tự động retry và cô lập lỗi
   * - Tự động hạ cấp model theo thứ tự ưu tiên:
   *   3.7 Flash -> 3.5 Flash -> 3 Flash Preview -> 3.1 Flash Lite -> Flash Latest
   */
  public async generate(
    contents: any,
    requestedModel?: string,
    config: any = {}
  ): Promise<GenerateResult> {
    return this.generateContent(contents, requestedModel, config);
  }

  public async generateContent(
    contents: any,
    requestedModel?: string,
    config: any = {}
  ): Promise<GenerateResult> {
    if (!this.isLoaded) this.loadGeminiKeys();

    if (this.keys.length === 0) {
      throw new Error("Hệ thống chưa được cấu hình API Key nào trong Vercel Environment Variables (GEMINI_API_KEY_1...N).");
    }

    this.stats.totalRequests++;

    // 5. Xác định danh sách Model theo thứ tự ưu tiên
    let startIdx = 0;
    if (requestedModel && requestedModel !== 'auto') {
      const foundIdx = MODEL_PRIORITY.indexOf(requestedModel as any);
      if (foundIdx !== -1) {
        startIdx = foundIdx;
      }
    }

    const modelsToTry: string[] = [
      ...(requestedModel && requestedModel !== 'auto' && MODEL_PRIORITY.indexOf(requestedModel as any) === -1 ? [requestedModel] : []),
      ...MODEL_PRIORITY.slice(startIdx)
    ];

    let lastError: any = null;
    let keyRotations = 0;
    let modelFallbacks = 0;
    const maxTotalAttempts = Math.min(30, this.keys.length * modelsToTry.length);
    let totalAttempts = 0;

    for (let mIdx = 0; mIdx < modelsToTry.length; mIdx++) {
      const model = modelsToTry[mIdx];

      // Lọc các key KHÔNG bị cooldown ở model này (cô lập Key + Model)
      const availableKeysForModel = this.keys.filter(k => this.isKeyAvailableForModel(k.id, model));

      if (availableKeysForModel.length === 0) {
        // Toàn bộ key đều bị cooldown ở model này -> Hạ cấp sang model tiếp theo
        modelFallbacks++;
        continue;
      }

      // 2. Thuật toán Round-Robin: Xoay vòng chọn key từ danh sách khả dụng
      const keysToAttempt = [...availableKeysForModel];
      let keyAttempts = 0;

      while (keyAttempts < keysToAttempt.length && totalAttempts < maxTotalAttempts) {
        const keyIndexToPick = (this.currentKeyIndex++) % keysToAttempt.length;
        const keyObj = keysToAttempt[keyIndexToPick];
        keyAttempts++;
        totalAttempts++;

        const startTime = Date.now();

        try {
          const ai = new GoogleGenAI({ apiKey: keyObj.key });
          const response = await ai.models.generateContent({
            model: model,
            contents: contents,
            config: config
          });

          const latency = Date.now() - startTime;
          this.stats.totalSuccess++;
          this.stats.rotate429Count += keyRotations;
          this.stats.fallbackModelCount += modelFallbacks;
          this.lastUsedModel = model;

          return {
            success: true,
            response,
            text: response?.text || '',
            keyId: keyObj.id,
            envName: keyObj.envName,
            keyMasked: keyObj.masked,
            keyLength: keyObj.length,
            modelUsed: model,
            latency,
            keyRotations,
            modelFallbacks
          };
        } catch (err: any) {
          lastError = err;
          const errMsg = String(err?.message || err);
          const classified = ErrorClassifier.classify(errMsg, err?.status);

          // Nếu request lỗi cú pháp (prompt rỗng, schema sai...), dừng lại báo lỗi ngay
          if (classified.type === 'INVALID_REQUEST') {
            this.stats.totalFail++;
            throw new Error(classified.userMessage);
          }

          // 4. Cách ly riêng cặp (KEY + MODEL) vào Cooldown
          this.cooldownKeyModel(keyObj, model, classified.type, classified.cooldownDurationMs, classified.userMessage);
          keyRotations++;

          console.warn(`[GeminiKeyPoolManager] Rotated Key: ${keyObj.envName} (${keyObj.masked}) @ ${model} -> ${classified.type}: ${classified.userMessage}`);
        }
      }

      // Mọi key đều thất bại ở model hiện tại -> Hạ cấp model tiếp theo
      modelFallbacks++;
    }

    this.stats.totalFail++;
    throw new Error(`Toàn bộ Key và Model trong Key Pool đều không khả dụng. Lỗi cuối cùng: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Lấy trạng thái công khai cho UI và kiểm tra sức khỏe hệ thống
   */
  public getPublicState() {
    if (!this.isLoaded) this.loadGeminiKeys();

    const activeCooldowns = this.getActiveCooldowns();

    const publicKeys = this.keys.map(k => {
      const modelStatuses: Record<string, { available: boolean; status: string; cooldownUntil?: number; remainingMinutes?: number }> = {};
      let isAnyModelActive = false;

      for (const m of MODEL_PRIORITY) {
        const isAvail = this.isKeyAvailableForModel(k.id, m);
        const cdKey = `${k.id}_${m}`;
        const cd = this.cooldowns.get(cdKey);

        if (isAvail) {
          modelStatuses[m] = { available: true, status: 'ACTIVE' };
          isAnyModelActive = true;
        } else if (cd) {
          const remainingMinutes = Math.max(1, Math.ceil((cd.cooldownUntil - Date.now()) / 60000));
          modelStatuses[m] = {
            available: false,
            status: cd.category === 'DAILY_QUOTA' ? 'DAILY_QUOTA' : 'COOLDOWN',
            cooldownUntil: cd.cooldownUntil,
            remainingMinutes
          };
        }
      }

      const overallStatus = isAnyModelActive
        ? 'ACTIVE'
        : activeCooldowns.some(c => c.keyId === k.id && c.category === 'INVALID_KEY')
        ? 'INVALID'
        : 'COOLDOWN';

      return {
        id: k.id,
        envName: k.envName,
        number: k.number,
        masked: k.masked,
        length: k.length,
        status: overallStatus as 'ACTIVE' | 'COOLDOWN' | 'INVALID',
        modelStatuses
      };
    });

    const modelPriorityInfo = MODEL_PRIORITY.map((m, idx) => ({
      tier: idx + 1,
      model: m,
      name: m === 'gemini-3.7-flash' ? 'Gemini 3.7 Flash' :
            m === 'gemini-3.5-flash' ? 'Gemini 3.5 Flash' :
            m === 'gemini-3-flash-preview' ? 'Gemini 3 Flash Preview' :
            m === 'gemini-3.1-flash-lite' ? 'Gemini 3.1 Flash Lite' : 'Gemini Flash Latest',
      description: m === 'gemini-3.7-flash'
        ? 'Model mạnh nhất, tối ưu chiều sâu và độ nhất quán'
        : m === 'gemini-3.5-flash'
        ? 'Cân bằng hiệu năng cao và tốc độ phản hồi nhanh'
        : m === 'gemini-3-flash-preview'
        ? 'Bản xem trước thế hệ Gemini 3 tốc độ cao'
        : m === 'gemini-3.1-flash-lite'
        ? 'Mô hình siêu nhẹ, tiết kiệm tài nguyên'
        : 'Mô hình dự phòng ổn định cao nhất',
      isLastUsed: this.lastUsedModel === m
    }));

    return {
      success: true,
      totalConfigured: this.keys.length,
      keys: publicKeys,
      stats: {
        totalRequests: this.stats.totalRequests,
        totalSuccess: this.stats.totalSuccess,
        totalFail: this.stats.totalFail,
        rotate429Count: this.stats.rotate429Count,
        fallbackModelCount: this.stats.fallbackModelCount,
        fallbackKeyCount: this.stats.fallbackKeyCount
      },
      cooldowns: activeCooldowns.map(c => ({
        keyId: c.keyId,
        envName: c.envName,
        masked: c.masked,
        model: c.model,
        reason: c.reason,
        category: c.category,
        cooldownUntil: c.cooldownUntil,
        remainingMinutes: Math.max(1, Math.ceil((c.cooldownUntil - Date.now()) / 60000))
      })),
      modelPriority: modelPriorityInfo,
      lastUsedModel: this.lastUsedModel
    };
  }
}

export const geminiPool = new GeminiKeyPoolManager();
