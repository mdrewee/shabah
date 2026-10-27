import { supabase } from '../lib/supabase';
import { roomBus } from '../lib/roomBus';
import { normalizeGameId } from '../utils/gameIds';

/**
 * Normalizes user input room codes:
 * 1. Trims whitespace
 * 2. Converts Eastern Arabic / Hindi numerals (٠-٩) to Western (0-9)
 * 3. Enforces uppercase
 */
export function normalizeRoomCode(inputCode: string): string {
  if (!inputCode) return '';
  return inputCode
    .trim()
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .toUpperCase();
}

/**
 * Authoritative Supabase room creation.
 * Persists room into 'rooms' table so cross-device and mobile players can verify and join instantly.
 */
export async function createRoom(
  generatedCode: string,
  gameId: string,
  hostId: string | null = null
): Promise<{ ok: boolean; code: string; error?: string }> {
  const cleanCode = normalizeRoomCode(generatedCode);
  if (!cleanCode) {
    return { ok: false, code: '', error: 'كود الغرفة غير صالح' };
  }

  const canonicalGameId = normalizeGameId(gameId) || 'ai-judge';

  try {
    const { error } = await supabase
      .from('rooms')
      .upsert(
        {
          room_code: cleanCode,
          game_id: canonicalGameId,
          host_id: hostId,
          status: 'lobby',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'room_code' }
      );

    if (error) {
      console.warn('[RoomService] Supabase room creation warning:', error);
      return { ok: false, code: cleanCode, error: error.message };
    }

    return { ok: true, code: cleanCode };
  } catch (err: any) {
    console.error('[RoomService] createRoom error:', err);
    return { ok: false, code: cleanCode, error: err?.message || 'تعذر تسجيل الغرفة' };
  }
}

const inFlightChecks = new Map<string, Promise<{ exists: boolean; gameId?: string; status?: string; error?: string }>>();
const recentChecksCache = new Map<string, { timestamp: number; result: { exists: boolean; gameId?: string; status?: string; error?: string } }>();
const lastStatusUpdate = new Map<string, string>();

/**
 * Update room status (e.g. 'lobby' -> 'playing' -> 'ended')
 */
export async function updateRoomStatus(
  inputCode: string,
  status: 'lobby' | 'playing' | 'ended',
  gameId?: string
): Promise<void> {
  const cleanCode = normalizeRoomCode(inputCode);
  if (!cleanCode) return;

  const key = `${cleanCode}:${status}:${gameId || ''}`;
  if (lastStatusUpdate.get(cleanCode) === key) return;
  lastStatusUpdate.set(cleanCode, key);

  try {
    const payload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (gameId) {
      const canon = normalizeGameId(gameId);
      if (canon) payload.game_id = canon;
    }
    await supabase
      .from('rooms')
      .update(payload)
      .eq('room_code', cleanCode);
  } catch (err) {
    console.warn('[RoomService] updateRoomStatus error:', err);
  }
}

/**
 * Authoritative Supabase room verification.
 * Verifies room existence across all devices (TV, desktop, external mobile).
 * Features in-flight deduplication and 4s cache to kill runaway /rest/v1/rooms queries.
 */
export async function checkRoomExists(
  inputCode: string
): Promise<{ exists: boolean; gameId?: string; status?: string; error?: string }> {
  const cleanCode = normalizeRoomCode(inputCode);
  if (!cleanCode || cleanCode.length < 3) {
    return { exists: false, error: 'كود الغرفة غير مكتمل' };
  }

  const now = Date.now();
  const cached = recentChecksCache.get(cleanCode);
  if (cached && now - cached.timestamp < 4000) {
    return cached.result;
  }

  if (inFlightChecks.has(cleanCode)) {
    return inFlightChecks.get(cleanCode)!;
  }

  const checkPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('room_code, game_id, status')
        .eq('room_code', cleanCode)
        .in('status', ['lobby', 'playing'])
        .maybeSingle();

      if (error) {
        console.warn('[RoomCheck] Supabase query fallback:', error);
        const local = roomBus.getRoom(cleanCode);
        if (local && !(local as any).isTerminated && local.selectedGameId) {
          return { exists: true, gameId: normalizeGameId(local.selectedGameId) || undefined, status: 'lobby' };
        }
        return { exists: false, error: 'تعذر الاتصال بالخادم، تأكد من اتصال الإنترنت' };
      }

      if (data) {
        return { exists: true, gameId: normalizeGameId(data.game_id) || undefined, status: data.status };
      }

      // Local check fallback (if just created locally before remote sync)
      const local = roomBus.getRoom(cleanCode);
      if (local && !(local as any).isTerminated && local.selectedGameId) {
        return { exists: true, gameId: normalizeGameId(local.selectedGameId) || undefined, status: 'lobby' };
      }

      const judgeRaw = localStorage.getItem(`shabah_judge_state_${cleanCode}`);
      if (judgeRaw) {
        try {
          const parsed = JSON.parse(judgeRaw);
          if (parsed && parsed.phase !== 'TERMINATED') {
            return { exists: true, gameId: 'ai-judge', status: parsed.phase === 'LOBBY' ? 'lobby' : 'playing' };
          }
        } catch {}
      }

      const arabicRaw = localStorage.getItem(`shabah_arabic_state_${cleanCode}`);
      if (arabicRaw) {
        try {
          const parsed = JSON.parse(arabicRaw);
          if (parsed && parsed.phase !== 'TERMINATED') {
            return { exists: true, gameId: 'ai-arabic', status: parsed.phase === 'LOBBY' ? 'lobby' : 'playing' };
          }
        } catch {}
      }

      const brokerRaw = sessionStorage.getItem(`shabah_broker_state_${cleanCode}`) || localStorage.getItem(`shabah_broker_state_${cleanCode}`);
      if (brokerRaw) {
        try {
          const parsed = JSON.parse(brokerRaw);
          if (parsed && parsed.phase !== 'GAME_OVER') {
            return { exists: true, gameId: 'ai-broker', status: parsed.phase === 'LOBBY' ? 'lobby' : 'playing' };
          }
        } catch {}
      }

      const coachRaw = localStorage.getItem(`shabah_coach_state_${cleanCode}`);
      if (coachRaw) {
        try {
          const parsed = JSON.parse(coachRaw);
          if (parsed && parsed.phase !== 'TERMINATED') {
            return { exists: true, gameId: 'ai-coach', status: parsed.phase === 'LOBBY' ? 'lobby' : 'playing' };
          }
        } catch {}
      }

      return { exists: false, error: 'كود الغرفة غير صحيح أو الغرفة غير موجودة حالياً' };
    } catch (err) {
      console.error('[RoomCheck] Error:', err);
      const local = roomBus.getRoom(cleanCode);
      if (local && !(local as any).isTerminated && local.selectedGameId) {
        return { exists: true, gameId: normalizeGameId(local.selectedGameId) || undefined, status: 'lobby' };
      }
      return { exists: false, error: 'تعذر الاتصال بالخادم، حاول مرة أخرى' };
    }
  })();

  inFlightChecks.set(cleanCode, checkPromise);
  try {
    const res = await checkPromise;
    recentChecksCache.set(cleanCode, { timestamp: Date.now(), result: res });
    return res;
  } finally {
    inFlightChecks.delete(cleanCode);
  }
}
