import { supabase } from '../lib/supabase';
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
    .toUpperCase()
    .replace(/^ROOM_/, '');
}

export function isRoomHost(roomCode: string): boolean {
  return Boolean(localStorage.getItem('shabah_host_' + normalizeRoomCode(roomCode)));
}

export async function createRoom(
  gameId: string,
  hostId: string
): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  try {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = Array.from(crypto.getRandomValues(new Uint8Array(4)), (byte) =>
        alphabet[byte & 31]
      ).join('');
      const { data, error } = await supabase.rpc('create_shabah_room', {
        code,
        game: normalizeGameId(gameId) || 'ai-judge',
        player: hostId,
        secret: token,
      });
      if (error) throw error;
      if (!data) continue;
      localStorage.setItem('shabah_host_' + code, token);
      return { ok: true, code };
    }
    return { ok: false, error: 'تعذر تخصيص كود للغرفة، حاول مرة أخرى' };
  } catch (err) {
    console.warn('[RoomService] Room creation failed:', err);
    return { ok: false, error: 'تعذر إنشاء الغرفة، تحقق من الاتصال وحاول مرة أخرى' };
  }
}

const inFlightChecks = new Map<string, Promise<{ exists: boolean; gameId?: string; error?: string }>>();

export async function checkRoomExists(inputCode: string): Promise<{ exists: boolean; gameId?: string; error?: string }> {
  const code = normalizeRoomCode(inputCode);
  if (!/^[A-Z0-9]{3,8}$/.test(code)) {
    return { exists: false, error: 'كود الغرفة غير صحيح' };
  }

  const pending = inFlightChecks.get(code);
  if (pending) return pending;

  const check = (async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('game_id')
        .eq('room_code', code)
        .in('status', ['lobby', 'playing'])
        .maybeSingle();
      if (error) throw error;
      if (data) return { exists: true, gameId: normalizeGameId(data.game_id) || undefined };
      return { exists: false, error: 'كود الغرفة غير صحيح أو الغرفة غير موجودة حالياً' };
    } catch (err) {
      console.warn('[RoomCheck] Room lookup failed:', err);
      return { exists: false, error: 'تعذر الاتصال بالخادم، حاول مرة أخرى' };
    }
  })();
  inFlightChecks.set(code, check);
  try {
    return await check;
  } finally {
    inFlightChecks.delete(code);
  }
}
