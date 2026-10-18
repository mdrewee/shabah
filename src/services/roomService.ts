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
  gameId: string = 'ai-coach',
  hostId: string | null = null
): Promise<{ ok: boolean; code: string; error?: string }> {
  const cleanCode = normalizeRoomCode(generatedCode);
  if (!cleanCode) {
    return { ok: false, code: '', error: 'كود الغرفة غير صالح' };
  }

  const canonicalGameId = normalizeGameId(gameId);

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

/**
 * Update room status (e.g. 'lobby' -> 'playing' -> 'ended')
 */
export async function updateRoomStatus(
  inputCode: string,
  status: 'lobby' | 'playing' | 'ended'
): Promise<void> {
  const cleanCode = normalizeRoomCode(inputCode);
  if (!cleanCode) return;
  try {
    await supabase
      .from('rooms')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('room_code', cleanCode);
  } catch (err) {
    console.warn('[RoomService] updateRoomStatus error:', err);
  }
}

/**
 * Authoritative Supabase room verification.
 * Verifies room existence across all devices (TV, desktop, external mobile).
 */
export async function checkRoomExists(
  inputCode: string
): Promise<{ exists: boolean; gameId?: string; error?: string }> {
  const cleanCode = normalizeRoomCode(inputCode);
  if (!cleanCode || cleanCode.length < 3) {
    return { exists: false, error: 'كود الغرفة غير مكتمل' };
  }

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
      if (local && !local.isTerminated) {
        return { exists: true, gameId: normalizeGameId(local.selectedGameId) };
      }
      return { exists: false, error: 'تعذر الاتصال بالخادم، تأكد من اتصال الإنترنت' };
    }

    if (data) {
      return { exists: true, gameId: normalizeGameId(data.game_id) };
    }

    // Local check fallback (if just created locally before remote sync)
    const local = roomBus.getRoom(cleanCode);
    if (local && !local.isTerminated) {
      return { exists: true, gameId: normalizeGameId(local.selectedGameId) };
    }

    const coachRaw = localStorage.getItem(`shabah_coach_state_${cleanCode}`);
    if (coachRaw) {
      try {
        const parsed = JSON.parse(coachRaw);
        if (parsed && parsed.phase !== 'TERMINATED') {
          return { exists: true, gameId: 'ai-coach' };
        }
      } catch {}
    }

    const brokerRaw = sessionStorage.getItem(`shabah_broker_state_${cleanCode}`);
    if (brokerRaw) {
      try {
        const parsed = JSON.parse(brokerRaw);
        if (parsed && parsed.phase !== 'GAME_OVER') {
          return { exists: true, gameId: 'ai-broker' };
        }
      } catch {}
    }

    return { exists: false, error: 'كود الغرفة غير صحيح أو الغرفة غير موجودة حالياً' };
  } catch (err) {
    console.error('[RoomCheck] Error:', err);
    const local = roomBus.getRoom(cleanCode);
    if (local && !local.isTerminated) {
      return { exists: true, gameId: normalizeGameId(local.selectedGameId) };
    }
    return { exists: false, error: 'تعذر الاتصال بالخادم، حاول مرة أخرى' };
  }
}
