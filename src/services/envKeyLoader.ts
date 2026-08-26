/**
 * Official Source of Truth for Gemini API Key Loading from Environment Variables
 * File: src/services/envKeyLoader.ts
 *
 * Implements robust parsing to detect:
 * 1. `process.env.GEMINI_API_KEYS` (comma, semicolon, newline, JSON array, or space separated)
 * 2. `process.env.GEMINI_API_KEY_1` to `GEMINI_API_KEY_50` (and up to 100)
 * 3. Standalone variables: `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `VITE_GEMINI_API_KEY`, etc.
 * 4. Auto-discovery for any Google API keys ('AQ.' format ~53 chars, 'AIza' format ~39 chars).
 *
 * Outputs explicit startup console.logs with masked values (preserving format prefix & last 4 chars)
 * to verify environment variable recognition on Vercel deployment startup.
 */

export interface EnvKeyEntry {
  id: string;
  index: number;
  source: string;
  key: string;
  masked: string;
  length: number;
  format: 'AQ' | 'AIza' | 'CUSTOM';
  status: 'ACTIVE' | 'COOLDOWN' | 'EXHAUSTED';
}

export interface EnvKeyLoaderSummary {
  totalLoaded: number;
  aqFormatCount: number;
  aizaFormatCount: number;
  customFormatCount: number;
  sources: string[];
  keys: Array<{
    index: number;
    source: string;
    masked: string;
    format: string;
    length: number;
  }>;
}

/**
 * Mask all characters except the prefix and the last 4 characters.
 * Example: "AQ.Ab8xY9123...5678" -> "AQ.****************...5678"
 */
export function maskKeyForDebug(rawKey: string): string {
  if (!rawKey || typeof rawKey !== 'string') return '[EMPTY_KEY]';
  const clean = rawKey.trim();
  if (clean.length <= 4) return '****';

  const last4 = clean.slice(-4);
  const prefix = clean.startsWith('AQ.') ? 'AQ.' : (clean.startsWith('AIza') ? 'AIza.' : '');
  const maskLen = Math.max(6, clean.length - (prefix.length + 4));
  return `${prefix}${'*'.repeat(maskLen)}${last4}`;
}

/**
 * Identify format of the key
 */
export function detectKeyFormat(key: string): 'AQ' | 'AIza' | 'CUSTOM' {
  if (key.startsWith('AQ.')) return 'AQ';
  if (key.startsWith('AIza')) return 'AIza';
  return 'CUSTOM';
}

/**
 * Sanitize raw string by stripping surrounding quotes, carriage returns, and escape characters
 */
export function sanitizeKeyString(raw: any): string {
  if (!raw || typeof raw !== 'string') return '';
  let clean = raw.trim().replace(/\r/g, '').replace(/\\n/g, '\n');
  
  // Remove wrapping single/double quotes if user wrapped them in Vercel UI
  if (
    (clean.startsWith('"') && clean.endsWith('"')) ||
    (clean.startsWith("'") && clean.endsWith("'")) ||
    (clean.startsWith('`') && clean.endsWith('`'))
  ) {
    clean = clean.slice(1, -1).trim();
  }
  return clean;
}

/**
 * Parse single or multi-line/comma-separated/JSON key string into an array of distinct valid keys
 */
export function parseRawKeys(raw: any): string[] {
  const clean = sanitizeKeyString(raw);
  if (!clean) return [];

  // Case 1: JSON array e.g. ["key1", "key2"]
  if (clean.startsWith('[') && clean.endsWith(']')) {
    try {
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) {
        return parsed
          .map((k) => sanitizeKeyString(k))
          .filter((k) => k.length >= 10);
      }
    } catch {
      // Fallback to text parsing
    }
  }

  // Case 2: Comma, semicolon, or newline separated list
  if (clean.includes(',') || clean.includes(';') || clean.includes('\n')) {
    return clean
      .split(/[,;\n\r]+/)
      .map((k) => sanitizeKeyString(k))
      .filter((k) => k.length >= 10);
  }

  // Case 3: Space separated list of multiple keys (common when pasting multiple tokens)
  if (clean.includes(' ') && (clean.includes('AQ.') || clean.includes('AIza'))) {
    return clean
      .split(/\s+/)
      .map((k) => sanitizeKeyString(k))
      .filter((k) => k.length >= 10);
  }

  return clean.length >= 10 ? [clean] : [];
}

/**
 * The Main Core Loader Function
 * Scans environment and outputs clean, structured debug logs
 */
export function loadGeminiApiKeysFromEnv(customEnv?: Record<string, string | undefined>): EnvKeyEntry[] {
  const env = customEnv || ((typeof process !== 'undefined' ? process.env : {}) as Record<string, string | undefined>);
  const isVercel = Boolean(env.VERCEL || env.VERCEL_ENV || env.NOW_REGION);
  const envCount = Object.keys(env).length;

  console.log('\n===============================================================');
  console.log('🚀 [EnvKeyLoader] Scanning Environment for Gemini API Keys...');
  console.log(`🌐 [EnvKeyLoader] Platform: ${isVercel ? `Vercel (${env.VERCEL_ENV || 'Production'})` : (env.NODE_ENV || 'Local/Development')}`);
  console.log(`📦 [EnvKeyLoader] Environment Variables Available: ${envCount}`);
  console.log('===============================================================');

  const loadedEntries: EnvKeyEntry[] = [];
  const registeredKeySet = new Set<string>();

  const registerKey = (rawKey: string, sourceVar: string): boolean => {
    const key = sanitizeKeyString(rawKey);
    if (!key || key.length < 10) return false;

    const masked = maskKeyForDebug(key);
    const format = detectKeyFormat(key);

    if (registeredKeySet.has(key)) {
      console.log(`   ⚠️ [EnvKeyLoader] Duplicate key ignored from [${sourceVar}] (Masked: ${masked})`);
      return false;
    }

    registeredKeySet.add(key);
    const index = loadedEntries.length + 1;
    const entry: EnvKeyEntry = {
      id: `key-${index}`,
      index,
      source: sourceVar,
      key,
      masked,
      length: key.length,
      format,
      status: 'ACTIVE',
    };
    loadedEntries.push(entry);

    console.log(`   ✅ [EnvKeyLoader] KEY #${index} LOADED from [${sourceVar}] | Format: ${format} (${key.length} chars) | Masked: ${masked}`);
    return true;
  };

  // 1. Process Multi-Key environment variables (GEMINI_API_KEYS, etc.)
  const multiKeyNames = [
    'GEMINI_API_KEYS',
    'GEMINI_KEYS',
    'GOOGLE_API_KEYS',
    'VITE_GEMINI_API_KEYS',
  ];

  for (const varName of multiKeyNames) {
    const rawValue = env[varName];
    if (rawValue) {
      console.log(`🔍 [EnvKeyLoader] Parsing Multi-Key Variable: process.env.${varName}`);
      const parsedKeys = parseRawKeys(rawValue);
      console.log(`   ↳ Found ${parsedKeys.length} potential key token(s) in ${varName}`);
      parsedKeys.forEach((singleKey, idx) => {
        registerKey(singleKey, `${varName}[${idx + 1}]`);
      });
    }
  }

  // 2. Process Indexed variables: GEMINI_API_KEY_1 to GEMINI_API_KEY_50 (and up to 100)
  console.log(`🔍 [EnvKeyLoader] Scanning Indexed Variables (GEMINI_API_KEY_1 to 50)...`);
  let indexedFoundCount = 0;

  for (let i = 1; i <= 50; i++) {
    const padded = i < 10 ? `0${i}` : `${i}`;
    const candidateNames = [
      `GEMINI_API_KEY_${i}`,
      `GEMINI_API_KEY_${padded}`,
      `GEMINI_KEY_${i}`,
      `GOOGLE_API_KEY_${i}`,
      `VITE_GEMINI_API_KEY_${i}`,
      `GEMINI_API_KEY${i}`,
    ];

    for (const name of candidateNames) {
      const val = env[name];
      if (val) {
        indexedFoundCount++;
        const keys = parseRawKeys(val);
        keys.forEach((singleKey) => {
          registerKey(singleKey, name);
        });
        break; // Stop after first match for index i
      }
    }
  }
  console.log(`   ↳ Located ${indexedFoundCount} configured indexed variable slot(s) between 1 and 50.`);

  // Extended scan for indices 51 through 100
  for (let i = 51; i <= 100; i++) {
    const candidateNames = [`GEMINI_API_KEY_${i}`, `GEMINI_KEY_${i}`, `GOOGLE_API_KEY_${i}`];
    for (const name of candidateNames) {
      const val = env[name];
      if (val) {
        const keys = parseRawKeys(val);
        keys.forEach((singleKey) => {
          registerKey(singleKey, name);
        });
        break;
      }
    }
  }

  // 3. Process Standard/Single variables
  const singleNames = [
    'GEMINI_API_KEY',
    'GOOGLE_API_KEY',
    'GEMINI_KEY',
    'API_KEY_GEMINI',
    'VITE_GEMINI_API_KEY',
    'VITE_FIREBASE_API_KEY',
  ];

  for (const name of singleNames) {
    const val = env[name];
    if (val) {
      const keys = parseRawKeys(val);
      keys.forEach((singleKey) => {
        registerKey(singleKey, name);
      });
    }
  }

  // 4. Dynamic Discovery for any other env var containing valid Google API keys
  for (const [keyName, val] of Object.entries(env)) {
    if (!val || typeof val !== 'string') continue;
    if (
      multiKeyNames.includes(keyName) ||
      singleNames.includes(keyName) ||
      keyName.startsWith('GEMINI_API_KEY_') ||
      keyName.startsWith('GEMINI_KEY_') ||
      keyName.startsWith('GOOGLE_API_KEY_')
    ) {
      continue; // already processed
    }

    const clean = sanitizeKeyString(val);
    const looksLikeGeminiVar = keyName.toUpperCase().includes('GEMINI') || keyName.toUpperCase().includes('GOOGLE_API');
    const looksLikeGoogleKey = clean.startsWith('AQ.') || clean.startsWith('AIza');

    if (looksLikeGeminiVar || looksLikeGoogleKey) {
      const discoveredKeys = parseRawKeys(clean);
      if (discoveredKeys.length > 0) {
        console.log(`🔍 [EnvKeyLoader] Auto-discovered candidate variable: process.env.${keyName}`);
        discoveredKeys.forEach((singleKey) => {
          registerKey(singleKey, keyName);
        });
      }
    }
  }

  // Summary Report
  const aqCount = loadedEntries.filter((e) => e.format === 'AQ').length;
  const aizaCount = loadedEntries.filter((e) => e.format === 'AIza').length;
  const customCount = loadedEntries.filter((e) => e.format === 'CUSTOM').length;

  console.log('---------------------------------------------------------------');
  console.log(`🏁 [EnvKeyLoader] Initialization Summary:`);
  console.log(`   - Total Active & Unique Keys: ${loadedEntries.length}`);
  console.log(`   - 'AQ.' Format Keys (53 chars): ${aqCount}`);
  console.log(`   - 'AIza' Format Keys (39 chars): ${aizaCount}`);
  console.log(`   - Custom/Other Format Keys: ${customCount}`);

  if (loadedEntries.length === 0) {
    console.warn('⚠️ [EnvKeyLoader] WARNING: Zero Gemini API keys were detected in the environment!');
    console.warn('   Please ensure GEMINI_API_KEYS or GEMINI_API_KEY_1..50 are configured in Vercel / .env');
  }
  console.log('===============================================================\n');

  return loadedEntries;
}

/**
 * Official EnvKeyLoader Service Class & Singleton
 * Acts as the centralized Source of Truth for API Services
 */
export class EnvKeyLoaderService {
  private keyEntries: EnvKeyEntry[] = [];
  private isInitialized = false;
  private roundRobinCursor = 0;

  constructor() {
    this.refresh();
  }

  /**
   * Reload all keys directly from process.env
   */
  public refresh(): EnvKeyEntry[] {
    this.keyEntries = loadGeminiApiKeysFromEnv();
    this.isInitialized = true;
    return [...this.keyEntries];
  }

  /**
   * Get all loaded key entries
   */
  public getKeyEntries(): EnvKeyEntry[] {
    if (!this.isInitialized || this.keyEntries.length === 0) {
      this.refresh();
    }
    return [...this.keyEntries];
  }

  /**
   * Get raw key strings array
   */
  public getRawKeys(): string[] {
    return this.getKeyEntries().map((entry) => entry.key);
  }

  /**
   * Get total number of valid configured keys
   */
  public getTotalCount(): number {
    return this.getKeyEntries().length;
  }

  /**
   * Get next key via round-robin rotation without throwing
   */
  public getNextKey(): string | null {
    const raw = this.getRawKeys();
    if (raw.length === 0) return null;
    const selected = raw[this.roundRobinCursor % raw.length];
    this.roundRobinCursor = (this.roundRobinCursor + 1) % raw.length;
    return selected;
  }

  /**
   * Get key by 1-based index
   */
  public getKeyByIndex(index: number): string | null {
    const raw = this.getRawKeys();
    if (raw.length === 0) return null;
    if (index >= 1 && index <= raw.length) {
      return raw[index - 1];
    }
    return this.getNextKey();
  }

  /**
   * Export structured summary metadata
   */
  public getSummary(): EnvKeyLoaderSummary {
    const entries = this.getKeyEntries();
    return {
      totalLoaded: entries.length,
      aqFormatCount: entries.filter((e) => e.format === 'AQ').length,
      aizaFormatCount: entries.filter((e) => e.format === 'AIza').length,
      customFormatCount: entries.filter((e) => e.format === 'CUSTOM').length,
      sources: Array.from(new Set(entries.map((e) => e.source))),
      keys: entries.map((e) => ({
        index: e.index,
        source: e.source,
        masked: e.masked,
        format: e.format,
        length: e.length,
      })),
    };
  }
}

// Global Singleton Instance
export const envKeyLoader = new EnvKeyLoaderService();
export default envKeyLoader;
export const GEMINI_API_KEYS_ARRAY = envKeyLoader.getRawKeys();
