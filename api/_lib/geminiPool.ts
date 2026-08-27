import { GoogleGenAI } from '@google/genai';
import { initFirebase } from './aiUsage.js';
import dotenv from 'dotenv';
dotenv.config();

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
  key: string;       // Secret key - NEVER exposed to client
  masked: string;    // e.g. "AIza...NhqQ"
  length: number;    // Real length of key
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

export interface ClassifiedError {
  type: ErrorCategory;
  cooldownDurationMs: number;
  userMessage: string;
}

export function maskApiKey(key: string): { masked: string; length: number } {
  const clean = (key || '').trim();
  const len = clean.length;
  if (len === 0) return { masked: '••••••••', length: 0 };
  if (len <= 8) return { masked: '••••••••', length: len };
  const prefix = clean.startsWith('AQ.') ? 'AQ.' : (clean.startsWith('AIza') ? 'AIza' : clean.slice(0, 6));
  const suffix = clean.slice(-4);
  return {
    masked: `${prefix}...${suffix}`,
    length: len
  };
}

/**
 * Mask all characters except the last 4 characters for debugging logs
 */
export function maskKeyExceptLast4(key: string): string {
  if (!key || typeof key !== 'string') return '[EMPTY]';
  const clean = key.trim();
  if (clean.length <= 4) return '****';
  const last4 = clean.slice(-4);
  const prefix = clean.startsWith('AQ.') ? 'AQ.' : (clean.startsWith('AIza') ? 'AIza.' : '');
  const maskedMiddle = '*'.repeat(Math.max(6, clean.length - (prefix.length + 4)));
  return `${prefix}${maskedMiddle}${last4}`;
}

/**
 * Error Classifier
 * Phân loại chính xác các mã lỗi & phản hồi từ Gemini API
 */
export function classifyError(errMessage: string, httpStatus?: number): ClassifiedError {
  const msgLower = (errMessage || '').toLowerCase();

  // 1. Invalid Request (400) - Bad Prompt / Schema -> DO NOT RETRY
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

  // 6. Temporary 5xx / Network / Fetch Error
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

export class ErrorClassifier {
  public static classify(errMessage: string, httpStatus?: number): ClassifiedError {
    return classifyError(errMessage, httpStatus);
  }
}

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
   * Quét và nạp mọi biến môi trường process.env bắt đầu bằng GEMINI_API_KEY_, GOOGLE_API_KEY_, v.v.
   */
  public loadGeminiKeys(): PoolKey[] {
    const loadedList: PoolKey[] = [];
    const scannedKeys = new Set<string>();

    const envSource = (typeof process !== "undefined" ? process.env : {}) as any;

    console.log(`[GeminiPool] 🔄 Initiating Gemini API Key loader... Environment keys available: ${Object.keys(envSource).length} (Vercel Env: ${envSource.VERCEL_ENV || envSource.NODE_ENV || 'local'})`);
    const isVercel = Boolean(envSource.VERCEL || envSource.VERCEL_ENV || envSource.NOW_REGION);
    if (isVercel) {
      console.log(`[GeminiPool] 🌐 Running in Vercel environment (${envSource.VERCEL_ENV || 'production'}).`);
    }

    const sanitizeKey = (raw: any): string => {
      if (!raw || typeof raw !== 'string') return '';
      let clean = raw.trim().replace(/\r/g, '');
      if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
        clean = clean.slice(1, -1).trim();
      }
      return clean;
    };

    const detectKeyFormat = (k: string): string => {
      if (k.startsWith('AQ.')) return `AQ-format (${k.length} chars)`;
      if (k.startsWith('AIza')) return `AIza-format (${k.length} chars)`;
      return `Standard (${k.length} chars)`;
    };

    const parseMultiKeys = (raw: any): string[] => {
      const clean = sanitizeKey(raw);
      if (!clean) return [];
      if (clean.startsWith('[') && clean.endsWith(']')) {
        try {
          const arr = JSON.parse(clean);
          if (Array.isArray(arr)) {
            return arr.map(k => sanitizeKey(k)).filter(Boolean);
          }
        } catch {}
      }
      if (clean.includes(',') || clean.includes(';') || clean.includes('\n')) {
        return clean.split(/[,;\n\r]+/).map(k => sanitizeKey(k)).filter(Boolean);
      }
      // If contains whitespace and looks like multiple keys (AIza or AQ. format)
      if (clean.includes(' ') && (clean.includes('AIza') || clean.includes('AQ.'))) {
        return clean.split(/\s+/).map(k => sanitizeKey(k)).filter(Boolean);
      }
      return [clean];
    };

    const addKey = (rawKey: string, envName: string, preferredNumber?: number) => {
      const clean = sanitizeKey(rawKey);
      if (!clean || scannedKeys.has(clean)) return;
      // Ensure minimum length
      if (clean.length < 20) return;
      const num = preferredNumber ?? (loadedList.length + 1);
      const { masked, length } = maskApiKey(clean);
      loadedList.push({
        id: `key-${num}`,
        envName,
        number: num,
        key: clean,
        masked,
        length
      });
      scannedKeys.add(clean);
    };

    // 0. Quét GEMINI_API_KEYS (dạng danh sách phân tách dấu phẩy / xuống dòng / JSON array)
    const multiKeyEnvs = [
      'GEMINI_API_KEYS',
      'GOOGLE_API_KEYS',
      'GEMINI_KEYS',
      'API_KEYS',
      'GEMINI_KEY_POOL',
      'GOOGLE_KEYS',
      'VITE_GEMINI_API_KEYS'
    ];
    for (const mkName of multiKeyEnvs) {
      const raw = envSource[mkName];
      if (raw) {
        const keyList = parseMultiKeys(raw);
        console.log(`[GeminiPool] 🔑 [Source: process.env.${mkName}] -> Successfully found variable, parsed into ${keyList.length} key element(s)`);
        keyList.forEach((k, idx) => {
          const beforeCount = loadedList.length;
          addKey(k, `${mkName}[${idx + 1}]`, loadedList.length + 1);
          const added = loadedList.length > beforeCount;
          const { masked, length } = maskApiKey(k);
          const format = detectKeyFormat(k);
          const debugMask = maskKeyExceptLast4(k);
          console.log(`[GeminiPool]   ├─ Item #${idx + 1} from ${mkName} | Format: ${format} | Masked(last4): ${debugMask} (len: ${length}) -> ${added ? '✅ VALID & ADDED' : '⚠️ SKIPPED (Duplicate or Ineligible)'}`);
        });
      }
    }

    // 1. Quét theo số thứ tự từ 1 đến 100 (GEMINI_API_KEY_1...N)
    for (let i = 1; i <= 100; i++) {
      const keysToCheck = [
        `GEMINI_API_KEY_${i}`,
        `GEMINI_API_KEY${i}`,
        `VITE_GEMINI_API_KEY_${i}`,
        `NEXT_PUBLIC_GEMINI_API_KEY_${i}`,
        `GOOGLE_API_KEY_${i}`,
        `GOOGLE_API_KEY${i}`,
        `GEMINI_KEY_${i}`,
        `GEMINI_KEY${i}`,
        `API_KEY_${i}`,
        `API_KEY${i}`,
        `KEY_${i}`,
        `KEY${i}`
      ];
      
      for (const keyName of keysToCheck) {
        let value = envSource[keyName];
        if (!value && typeof globalThis !== "undefined" && (globalThis as any).process?.env) {
          value = (globalThis as any).process.env[keyName];
        }

        const cleanVal = sanitizeKey(value);
        if (cleanVal) {
          const keys = parseMultiKeys(cleanVal);
          console.log(`[GeminiPool] 🔑 [Source: process.env.${keyName}] (Index #${i}) -> Successfully loaded variable, parsed ${keys.length} key(s)`);
          keys.forEach((k) => {
            const beforeCount = loadedList.length;
            addKey(k, keyName, i);
            const added = loadedList.length > beforeCount;
            const { masked, length } = maskApiKey(k);
            const format = detectKeyFormat(k);
            const debugMask = maskKeyExceptLast4(k);
            console.log(`[GeminiPool]   └─ Value from ${keyName} | Format: ${format} | Masked(last4): ${debugMask} (len: ${length}) -> ${added ? '✅ VALID & ADDED' : '⚠️ SKIPPED (Duplicate or Ineligible)'}`);
          });
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
      'API_KEY',
      'AI_STUDIO_KEY',
      'GEMINI_SECRET_KEY'
    ];

    for (const keyName of singleKeyNames) {
      let value = envSource[keyName];
      if (!value && typeof globalThis !== "undefined" && (globalThis as any).process?.env) {
        value = (globalThis as any).process.env[keyName];
      }
      const cleanVal = sanitizeKey(value);
      if (cleanVal) {
        const keys = parseMultiKeys(cleanVal);
        console.log(`[GeminiPool] 🔑 [Source: process.env.${keyName}] -> Standard variable detected, parsed ${keys.length} key(s)`);
        keys.forEach((k) => {
          const beforeCount = loadedList.length;
          addKey(k, keyName);
          const added = loadedList.length > beforeCount;
          const { masked, length } = maskApiKey(k);
          const format = detectKeyFormat(k);
          const debugMask = maskKeyExceptLast4(k);
          console.log(`[GeminiPool]   └─ Value from ${keyName} | Format: ${format} | Masked(last4): ${debugMask} (len: ${length}) -> ${added ? '✅ VALID & ADDED' : '⚠️ SKIPPED (Duplicate or Ineligible)'}`);
        });
      }
    }

    // 3. Quét toàn bộ process.env để tìm bất kỳ key nào có định dạng Google API (AIza... hoặc AQ....) hoặc chứa chữ GEMINI/GOOGLE_API
    try {
      for (const [k, v] of Object.entries(envSource)) {
        const cleanVal = sanitizeKey(v);
        if (!cleanVal || scannedKeys.has(cleanVal)) continue;

        const upperKey = k.toUpperCase();
        const isGeminiName = upperKey.includes('GEMINI') || 
                             upperKey.includes('GOOGLE_API') || 
                             upperKey.includes('GENAI') || 
                             upperKey.includes('AIZA') ||
                             upperKey.startsWith('API_KEY') ||
                             upperKey.startsWith('KEY_');
        const isAiZaPattern = (cleanVal.startsWith('AIza') || cleanVal.startsWith('AQ.')) && cleanVal.length >= 25;

        if (isGeminiName || isAiZaPattern) {
          const keys = parseMultiKeys(cleanVal);
          console.log(`[GeminiPool] 🔍 [Source: process.env.${k}] -> Auto-discovered candidate variable, parsed ${keys.length} key(s)`);
          keys.forEach((singleK) => {
            const beforeCount = loadedList.length;
            addKey(singleK, k);
            const added = loadedList.length > beforeCount;
            const { masked, length } = maskApiKey(singleK);
            const format = detectKeyFormat(singleK);
            const debugMask = maskKeyExceptLast4(singleK);
            console.log(`[GeminiPool]   └─ Value from ${k} | Format: ${format} | Masked(last4): ${debugMask} (len: ${length}) -> ${added ? '✅ VALID & ADDED' : '⚠️ SKIPPED (Duplicate or Ineligible)'}`);
          });
        }
      }
    } catch {
      // Ignored
    }

    loadedList.sort((a, b) => a.number - b.number);
    this.keys = loadedList;
    if (this.keys.length > 0) {
      this.isLoaded = true;
      console.log(`[GeminiPool] 🚀 Key initialization SUCCESS: Total ${this.keys.length} valid unique key(s) loaded into Round-Robin Pool.`);
      console.log(`[GeminiPool] 📋 Pool Keys Summary:`, this.keys.map(k => ({ id: k.id, env: k.envName, num: k.number, masked: k.masked, len: k.length })));
    } else {
      const availableKeys = Object.keys(envSource).filter(k => k.includes("GEMINI") || k.includes("GOOGLE") || k.includes("KEY"));
      console.warn("[GeminiPool] ⚠️ No keys found in environment! Available related keys in env:", availableKeys);
    }
    this.syncFromFirestore().catch(() => {});
    return this.keys;
  }
  public loadKeys(): PoolKey[] {
    return this.loadGeminiKeys();
  }

  public getKeys(): PoolKey[] {
    if (!this.isLoaded || this.keys.length === 0) this.loadGeminiKeys();
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

  public isKeyAvailableForModel(keyId: string, model: string): boolean {
    const cdKey = `${keyId}_${model}`;
    const cd = this.cooldowns.get(cdKey);
    if (!cd) return true;
    if (cd.cooldownUntil <= Date.now()) {
      this.cooldowns.delete(cdKey);
      return true;
    }
    return false;
  }

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

  private async syncFromFirestore() {
    try {
      const { adminDb } = initFirebase();
      if (adminDb) {
        const doc = await adminDb.collection('geminiPool').doc('state').get();
        if (doc.exists) {
          const data = doc.data();
          if (data?.cooldowns) {
            const now = Date.now();
            Object.entries(data.cooldowns).forEach(([k, v]: [string, any]) => {
              if (v && typeof v.cooldownUntil === 'number' && v.cooldownUntil > now) {
                this.cooldowns.set(k, v);
              }
            });
          }
          if (data?.stats) {
            this.stats = {
              totalRequests: Math.max(this.stats.totalRequests, data.stats.totalRequests || 0),
              totalSuccess: Math.max(this.stats.totalSuccess, data.stats.totalSuccess || 0),
              totalFail: Math.max(this.stats.totalFail, data.stats.totalFail || 0),
              rotate429Count: Math.max(this.stats.rotate429Count, data.stats.rotate429Count || 0),
              fallbackModelCount: Math.max(this.stats.fallbackModelCount, data.stats.fallbackModelCount || 0),
              fallbackKeyCount: Math.max(this.stats.fallbackKeyCount, data.stats.fallbackKeyCount || 0)
            };
          }
        }
      }
    } catch (e) {
      console.warn("Could not sync gemini pool from Firestore", e);
    }
  }

  private async saveToFirestore() {
    try {
      const { adminDb } = initFirebase();
      if (adminDb) {
        const now = Date.now();
        const cdObj: Record<string, CooldownItem> = {};
        this.cooldowns.forEach((v, k) => {
          if (v.cooldownUntil > now) cdObj[k] = v;
        });
        await adminDb.collection('geminiPool').doc('state').set({
          stats: this.stats,
          cooldowns: cdObj,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (e) {
      // Non-blocking
    }
  }

  public async generate(
    contents: any,
    requestedModel?: string,
    config: any = {}
  ) {
    return this.generateContent(contents, requestedModel, config);
  }

  /**
   * Central Generate Method for ALL AI Features.
   * - Round-Robin Key selection
   * - Key + Model Isolation (429 only isolates that specific key+model pair)
   * - Auto Model Downgrade (ONLY when all keys fail at the current model level)
   */
  public async generateContent(
    contents: any,
    requestedModel?: string,
    config: any = {}
  ): Promise<{
    success: boolean;
    response: any;
    text: string;
    keyId: string;
    keyIndex?: number;
    envName: string;
    keyMasked: string;
    keyLength: number;
    modelUsed: string;
    latency: number;
    keyRotations: number;
    modelFallbacks: number;
  }> {
    if (!this.isLoaded || this.keys.length === 0) this.loadGeminiKeys();

    if (this.keys.length === 0) {
      throw new Error("Hệ thống chưa được cấu hình API Key nào trong Vercel Environment Variables (GEMINI_API_KEY_1...N).");
    }

    this.stats.totalRequests++;

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

      const availableKeysForModel = this.keys.filter(k => this.isKeyAvailableForModel(k.id, model));

      if (availableKeysForModel.length === 0) {
        modelFallbacks++;
        continue;
      }

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

          this.saveToFirestore().catch(() => {});

          return {
            success: true,
            response,
            text: response?.text || '',
            keyId: keyObj.id,
            keyIndex: this.keys.findIndex(k => k.id === keyObj.id),
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
          const classified = classifyError(errMsg, err?.status);

          if (classified.type === 'INVALID_REQUEST') {
            this.stats.totalFail++;
            throw new Error(classified.userMessage);
          }

          if (classified.type === 'INVALID_KEY' || classified.type === 'AUTH_ERROR') {
            // Key is completely invalid or forbidden -> quarantine for ALL models
            for (const m of MODEL_PRIORITY) {
              this.cooldownKeyModel(keyObj, m, classified.type, classified.cooldownDurationMs, classified.userMessage);
            }
          } else {
            // Rate limit (429) or Model unavailable -> isolate only for this specific model
            this.cooldownKeyModel(keyObj, model, classified.type, classified.cooldownDurationMs, classified.userMessage);
          }
          keyRotations++;

          console.warn(`[GeminiKeyPoolManager] Rotated Key: ${keyObj.envName} (${keyObj.masked}) @ ${model} -> ${classified.type}: ${classified.userMessage}`);
        }
      }

      modelFallbacks++;
    }

    this.stats.totalFail++;
    this.saveToFirestore().catch(() => {});

    throw new Error(`Toàn bộ Key và Model trong Key Pool đều không khả dụng. Lỗi cuối cùng: ${lastError?.message || 'Unknown error'}`);
  }

  public getPublicState() {
    try {
      if (!this.isLoaded || !this.keys || this.keys.length === 0) {
        this.loadGeminiKeys();
      }

      const activeCooldowns = this.getActiveCooldowns() || [];
      const currentKeys = this.keys || [];

      const publicKeys = currentKeys.map(k => {
        const modelStatuses: Record<string, { available: boolean; status: string; cooldownUntil?: number; remainingMinutes?: number }> = {};
        let isAnyModelActive = false;

        for (const m of MODEL_PRIORITY) {
          const isAvail = this.isKeyAvailableForModel(k.id, m);
          const cdKey = `${k.id}_${m}`;
          const cd = this.cooldowns?.get(cdKey);

          if (isAvail) {
            modelStatuses[m] = { available: true, status: 'ACTIVE' };
            isAnyModelActive = true;
          } else if (cd) {
            const remainingMinutes = Math.max(1, Math.ceil(((cd.cooldownUntil || Date.now()) - Date.now()) / 60000));
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
          ? 'Model mạnh nhất, tối ưu chiều sâu worldbuilding và độ nhất quán lore'
          : m === 'gemini-3.5-flash'
          ? 'Cân bằng hiệu năng cao và tốc độ phản hồi nhanh'
          : m === 'gemini-3-flash-preview'
          ? 'Bản xem trước thế hệ Gemini 3 tốc độ cao'
          : m === 'gemini-3.1-flash-lite'
          ? 'Mô hình siêu nhẹ, tiết kiệm tài nguyên'
          : 'Mô hình dự phòng ổn định cao nhất',
        isLastUsed: this.lastUsedModel === m
      }));

      const usableKeys = publicKeys.filter(k => k.status === 'ACTIVE');
      const ignoredKeys = publicKeys.filter(k => k.status === 'INVALID').map(k => ({
        keyId: k.id,
        envName: k.envName,
        masked: k.masked,
        reason: 'API Key không hợp lệ hoặc đã hết hạn.'
      }));
      const quarantinedKeys = activeCooldowns.map(c => ({
        keyId: c.keyId,
        envName: c.envName,
        masked: c.masked,
        model: c.model,
        reason: c.reason,
        category: c.category,
        cooldownUntil: c.cooldownUntil,
        remainingMinutes: Math.max(1, Math.ceil((c.cooldownUntil - Date.now()) / 60000))
      }));

      return {
        success: true,
        totalKeysConfigured: currentKeys.length,
        usableKeysNow: usableKeys.length,
        ignoredKeys,
        quarantinedKeys,
        modelTiers: modelPriorityInfo,
        stats: {
          totalRequests: this.stats.totalRequests || 0,
          totalSuccess: this.stats.totalSuccess || 0,
          totalFail: this.stats.totalFail || 0,
          rotate429Count: this.stats.rotate429Count || 0,
          fallbackModelCount: this.stats.fallbackModelCount || 0,
          fallbackKeyCount: this.stats.fallbackKeyCount || 0
        },
        totalConfigured: currentKeys.length,
        keys: publicKeys,
        cooldowns: quarantinedKeys,
        modelPriority: modelPriorityInfo,
        lastUsedModel: this.lastUsedModel || MODEL_PRIORITY[0]
      };
    } catch (err: any) {
      console.error("[GeminiPool] Safe recovery during getPublicState():", err);
      const fallbackCount = (this.keys && this.keys.length) || 0;
      return {
        success: true,
        totalKeysConfigured: fallbackCount,
        usableKeysNow: fallbackCount,
        ignoredKeys: [],
        quarantinedKeys: [],
        modelTiers: MODEL_PRIORITY.map((m, idx) => ({
          tier: idx + 1,
          model: m,
          name: m,
          description: '',
          isLastUsed: idx === 0
        })),
        stats: {
          totalRequests: this.stats?.totalRequests || 0,
          totalSuccess: this.stats?.totalSuccess || 0,
          totalFail: this.stats?.totalFail || 0,
          rotate429Count: this.stats?.rotate429Count || 0,
          fallbackModelCount: this.stats?.fallbackModelCount || 0,
          fallbackKeyCount: this.stats?.fallbackKeyCount || 0
        },
        totalConfigured: fallbackCount,
        keys: (this.keys || []).map(k => ({
          id: k.id,
          envName: k.envName,
          number: k.number,
          masked: k.masked,
          length: k.length,
          status: 'ACTIVE' as const,
          modelStatuses: {}
        })),
        cooldowns: [],
        modelPriority: [],
        lastUsedModel: this.lastUsedModel || MODEL_PRIORITY[0]
      };
    }
  }
}

export const geminiPool = new GeminiKeyPoolManager();
