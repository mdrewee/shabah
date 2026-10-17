/**
 * Session Non-Repeating Question Engine
 * Tracks used item IDs in sessionStorage per room to prevent repetition
 * until the whole candidate pool has been exhausted.
 */

const STORAGE_PREFIX = 'game_used_items_';

export function getUsedItemIds(roomCode: string, poolKey: string): string[] {
  if (typeof window === 'undefined' || !roomCode) return [];
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${roomCode}_${poolKey}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read used items from sessionStorage', e);
    return [];
  }
}

export function markItemIdUsed(roomCode: string, poolKey: string, itemId: string): void {
  if (typeof window === 'undefined' || !roomCode || !itemId) return;
  try {
    const used = getUsedItemIds(roomCode, poolKey);
    if (!used.includes(itemId)) {
      used.push(itemId);
      sessionStorage.setItem(`${STORAGE_PREFIX}${roomCode}_${poolKey}`, JSON.stringify(used));
    }
  } catch (e) {
    console.error('Failed to mark item as used in sessionStorage', e);
  }
}

export function resetUsedItemIds(roomCode: string, poolKey: string): void {
  if (typeof window === 'undefined' || !roomCode) return;
  try {
    sessionStorage.removeItem(`${STORAGE_PREFIX}${roomCode}_${poolKey}`);
  } catch (e) {
    console.error('Failed to reset used items in sessionStorage', e);
  }
}

/**
 * Selects an unused item from the given pool.
 * If all items have been used, it clears the used pool history for this room and picks anew.
 */
export function pickNextUnusedItem<T extends { id: string } | string>(
  roomCode: string,
  poolKey: string,
  pool: T[]
): T | null {
  if (!pool || pool.length === 0) return null;

  const getId = (item: T): string => (typeof item === 'string' ? item : item.id);
  const used = new Set(getUsedItemIds(roomCode, poolKey));

  let available = pool.filter(item => !used.has(getId(item)));

  if (available.length === 0) {
    // Pool exhausted! Reset and recycle.
    resetUsedItemIds(roomCode, poolKey);
    available = [...pool];
  }

  const selectedIndex = Math.floor(Math.random() * available.length);
  const selected = available[selectedIndex];
  markItemIdUsed(roomCode, poolKey, getId(selected));
  return selected;
}
