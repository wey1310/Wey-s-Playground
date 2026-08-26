/**
 * Backend & Universal API Key Pool Service
 * File: src/services/apiPool.ts
 *
 * Uses src/services/envKeyLoader.ts as the official Source of Truth for environment keys.
 */

import {
  EnvKeyEntry,
  envKeyLoader,
  loadGeminiApiKeysFromEnv,
  maskKeyForDebug,
  detectKeyFormat,
  sanitizeKeyString,
  parseRawKeys,
} from './envKeyLoader';

export interface ParsedApiKeyInfo {
  index: number;
  source: string;
  key: string;
  masked: string;
  length: number;
  format: 'AQ' | 'AIza' | 'CUSTOM';
  status: 'ACTIVE' | 'COOLDOWN' | 'EXHAUSTED';
}

export const maskKeyExceptLast4 = maskKeyForDebug;
export const sanitizeApiKey = sanitizeKeyString;
export const parseMultiKeyString = parseRawKeys;

class ApiPoolService {
  /**
   * Explicitly scan and load all keys from process.env via the official envKeyLoader
   */
  public loadFromEnvironment(): string[] {
    return envKeyLoader.refresh().map((e) => e.key);
  }

  /**
   * Get all active parsed key strings in array
   */
  public getKeys(): string[] {
    return envKeyLoader.getRawKeys();
  }

  /**
   * Get parsed key details for admin / status interfaces
   */
  public getKeyInfos(): ParsedApiKeyInfo[] {
    return envKeyLoader.getKeyEntries();
  }

  /**
   * Get next key in round-robin fashion without crashing
   */
  public getNextKey(): string | null {
    return envKeyLoader.getNextKey();
  }

  /**
   * Get key by 1-based index or return fallback
   */
  public getKeyByIndex(index: number): string | null {
    return envKeyLoader.getKeyByIndex(index);
  }

  /**
   * Force reload from environment
   */
  public reload(): string[] {
    return this.loadFromEnvironment();
  }
}

// Global Singleton Instance
export const apiPool = new ApiPoolService();
export { envKeyLoader, loadGeminiApiKeysFromEnv };
export default apiPool;
