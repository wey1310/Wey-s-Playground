export interface PlayLimitStatus {
  allowed: boolean;
  playsUsed: number;
  maxPlays: number;
  remainingPlays: number;
  isGuest: boolean;
  guestId: string;
}

const GUEST_ID_KEY = 'wey_guest_id';
const PLAY_TRACKER_KEY = 'wey_play_tracker_v1';
const MAX_GUEST_DAILY_PLAYS = 3;

/**
 * Get or create a unique guest ID
 */
export function getGuestId(): string {
  try {
    let guestId = localStorage.getItem(GUEST_ID_KEY);
    if (!guestId) {
      guestId = `guest_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem(GUEST_ID_KEY, guestId);
    }
    return guestId;
  } catch (e) {
    return 'guest_temp_' + Math.floor(Math.random() * 100000);
  }
}

/**
 * Get today's local date key (YYYY-MM-DD)
 */
function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if the user is allowed to play a game
 */
export function getPlayLimitStatus(isLoggedIn: boolean): PlayLimitStatus {
  const guestId = getGuestId();
  
  if (isLoggedIn) {
    return {
      allowed: true,
      playsUsed: 0,
      maxPlays: Infinity,
      remainingPlays: Infinity,
      isGuest: false,
      guestId,
    };
  }

  const today = getTodayKey();
  try {
    const raw = localStorage.getItem(PLAY_TRACKER_KEY);
    let tracker = { date: today, count: 0, guestId };

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        tracker = parsed;
      }
    }

    const playsUsed = typeof tracker.count === 'number' ? tracker.count : 0;
    const remainingPlays = Math.max(0, MAX_GUEST_DAILY_PLAYS - playsUsed);
    const allowed = playsUsed < MAX_GUEST_DAILY_PLAYS;

    return {
      allowed,
      playsUsed,
      maxPlays: MAX_GUEST_DAILY_PLAYS,
      remainingPlays,
      isGuest: true,
      guestId,
    };
  } catch (e) {
    return {
      allowed: true,
      playsUsed: 0,
      maxPlays: MAX_GUEST_DAILY_PLAYS,
      remainingPlays: MAX_GUEST_DAILY_PLAYS,
      isGuest: true,
      guestId,
    };
  }
}

/**
 * Consume one play count (called when starting a game)
 */
export function consumePlayCount(isLoggedIn: boolean): PlayLimitStatus {
  if (isLoggedIn) {
    return getPlayLimitStatus(true);
  }

  const today = getTodayKey();
  const guestId = getGuestId();

  try {
    const raw = localStorage.getItem(PLAY_TRACKER_KEY);
    let count = 0;

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today && typeof parsed.count === 'number') {
        count = parsed.count;
      }
    }

    count += 1;
    localStorage.setItem(
      PLAY_TRACKER_KEY,
      JSON.stringify({ date: today, count, guestId, lastPlayedAt: new Date().toISOString() })
    );

    const remainingPlays = Math.max(0, MAX_GUEST_DAILY_PLAYS - count);
    const allowed = count <= MAX_GUEST_DAILY_PLAYS;

    return {
      allowed,
      playsUsed: count,
      maxPlays: MAX_GUEST_DAILY_PLAYS,
      remainingPlays,
      isGuest: true,
      guestId,
    };
  } catch (e) {
    return getPlayLimitStatus(false);
  }
}
