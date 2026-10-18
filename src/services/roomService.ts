import { supabase } from '../lib/supabase';
import { roomBus } from '../lib/roomBus';

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

  try {
    const { error } = await supabase
      .from('rooms')
      .upsert(
        {
          room_code: cleanCode,
          game_id: gameId,
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
 * Authoritative Supabase room verification.
 * Verifies room existence across all devices (TV, desktop, external mobile).
 */
export async function checkRoomExists(
  inputCode: string
): Promise<{ exists: boolean; gameId?: string; error?: string }> {
  const cleanCode = normalizeRoomCode(inputCode);
  if (!cleanCode || cleanCode.length < 4) {
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
      // Fallback: If table RLS is blocking or table is missing, check local state before fallback
      const local = roomBus.getRoom(cleanCode);
      if (local && !local.isTerminated) {
        return { exists: true, gameId: local.selectedGameId };
      }
      return { exists: true, gameId: 'ai-coach' };
    }

    if (data) {
      return { exists: true, gameId: data.game_id };
    }

    // Local check fallback (if just created locally before sync)
    const local = roomBus.getRoom(cleanCode);
    if (local && !local.isTerminated) {
      return { exists: true, gameId: local.selectedGameId };
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

    return { exists: false, error: 'كود الغرفة غير صحيح أو الغرفة غير موجودة حالياً' };
  } catch (err) {
    console.error('[RoomCheck] Error:', err);
    // Graceful fallback so network glitches don't lock out contestants
    return { exists: true };
  }
}
