import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { GameUIConfig } from '../types/gameUI';
import { getDefaultElementsForGame } from '../data/gameUIDefaults';

const STORAGE_PREFIX = 'wey_game_ui_config_';

/**
 * In-memory cache to ensure instantaneous style access during gameplay
 */
const configCache: Record<string, GameUIConfig> = {};

/**
 * Generate standard base config from defaults if no custom config exists
 */
export function createDefaultGameUIConfig(gameId: string): GameUIConfig {
  const defaultList = getDefaultElementsForGame(gameId);
  const elements: Record<string, any> = {};
  defaultList.forEach((elem) => {
    elements[elem.id] = { ...elem };
  });

  return {
    gameId,
    elements,
    version: 1,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Load Game UI Config with tiered caching:
 * 1. Memory cache
 * 2. LocalStorage cache
 * 3. Firestore cloud document (`gameUIConfigs/{gameId}`)
 */
export async function loadGameUIConfig(gameId: string): Promise<GameUIConfig> {
  const cleanId = gameId.toLowerCase().trim();

  // 1. Check memory cache
  if (configCache[cleanId]) {
    return configCache[cleanId];
  }

  // 2. Check localStorage
  let localData: GameUIConfig | null = null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${cleanId}`);
    if (raw) {
      localData = JSON.parse(raw);
      if (localData && localData.elements) {
        configCache[cleanId] = localData;
      }
    }
  } catch (e) {
    console.warn(`[GameUI] Error reading localStorage for ${cleanId}:`, e);
  }

  // 3. Check Firestore
  try {
    const docRef = doc(db, 'gameUIConfigs', cleanId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const cloudData = docSnap.data() as GameUIConfig;
      if (cloudData && cloudData.elements) {
        configCache[cleanId] = cloudData;
        try {
          localStorage.setItem(`${STORAGE_PREFIX}${cleanId}`, JSON.stringify(cloudData));
        } catch {}
        return cloudData;
      }
    }
  } catch (e) {
    // Firestore might be offline, unauthenticated or rule-restricted
    console.debug(`[GameUI] Firestore fetch skipped/failed for ${cleanId}:`, e);
  }

  // Return local if available, or fall back to default
  if (localData && localData.elements) {
    return localData;
  }

  const freshDefault = createDefaultGameUIConfig(cleanId);
  configCache[cleanId] = freshDefault;
  return freshDefault;
}

/**
 * Get synchronously from cache/localStorage (zero latency for renders)
 */
export function getGameUIConfigSync(gameId: string): GameUIConfig {
  const cleanId = gameId.toLowerCase().trim();
  if (configCache[cleanId]) {
    return configCache[cleanId];
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${cleanId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.elements) {
        configCache[cleanId] = parsed;
        return parsed;
      }
    }
  } catch {}

  const def = createDefaultGameUIConfig(cleanId);
  configCache[cleanId] = def;
  return def;
}

/**
 * Save Game UI Config to Firestore and LocalStorage
 */
export async function saveGameUIConfig(
  gameId: string,
  config: GameUIConfig,
  userEmail?: string
): Promise<{ success: boolean; error?: string }> {
  const cleanId = gameId.toLowerCase().trim();

  const toSave: GameUIConfig = {
    ...config,
    gameId: cleanId,
    updatedAt: new Date().toISOString(),
    updatedBy: userEmail || 'admin',
    version: (config.version || 1) + 1,
  };

  // Update memory cache immediately
  configCache[cleanId] = toSave;

  // Save to localStorage
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${cleanId}`, JSON.stringify(toSave));
  } catch (e: any) {
    console.warn(`[GameUI] Error saving to localStorage for ${cleanId}:`, e);
  }

  // Save to Firestore
  try {
    const docRef = doc(db, 'gameUIConfigs', cleanId);
    await setDoc(docRef, toSave, { merge: true });
    return { success: true };
  } catch (err: any) {
    console.warn(`[GameUI] Error saving to Firestore for ${cleanId}:`, err);
    // Even if Firestore fails (e.g. offline), local save succeeded
    return { success: true, error: 'Đã lưu trên trình duyệt (Đồng bộ đám mây thất bại)' };
  }
}

/**
 * Reset Game UI Config to defaults
 */
export async function resetGameUIConfig(gameId: string): Promise<boolean> {
  const cleanId = gameId.toLowerCase().trim();
  const freshDefault = createDefaultGameUIConfig(cleanId);
  configCache[cleanId] = freshDefault;

  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${cleanId}`);
  } catch {}

  try {
    const docRef = doc(db, 'gameUIConfigs', cleanId);
    await deleteDoc(docRef);
  } catch (e) {
    console.debug(`[GameUI] Firestore delete skipped for ${cleanId}:`, e);
  }

  return true;
}
