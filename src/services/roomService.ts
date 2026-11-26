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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');
    // Verify that this browser can retain the host credential before creating a cloud room.
    const probeKey = 'shabah_test_' + token.slice(0, 8);
    try {
      localStorage.setItem(probeKey, token);
      localStorage.removeItem(probeKey);
    } catch {
      return { ok: false, error: 'تعذر حفظ بيانات المضيف على هذا الجهاز. تحقق من مساحة المتصفح والسماح بتخزين بيانات الموقع.' };
    }
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = Array.from(crypto.getRandomValues(new Uint8Array(4)), (byte) =>
        alphabet[byte & 31]
      ).join('');
      const { data, error, status } = await supabase.rpc('create_shabah_room', {
        code,
        game: normalizeGameId(gameId) || 'ai-judge',
        player: hostId,
        secret: token,
      }).abortSignal(controller.signal);
      if (error) {
        const code = error.code || String(status || 'NETWORK');
        console.warn('[RoomService] Creation rejected:', { code, status });
        const message = controller.signal.aborted ? 'انتهت مهلة الاتصال بخادم الغرف؛ حاول مرة أخرى' :
          code === 'PGRST202' ? 'خدمة إنشاء الغرف تحتاج تحديثًا على الخادم' :
          status === 401 || status === 403 ? 'خادم الغرف رفض الاتصال؛ تحتاج إعدادات الموقع مراجعة' :
          status >= 500 ? 'خادم الغرف غير متاح مؤقتًا؛ حاول بعد قليل' :
          'تعذر الاتصال بخادم الغرف؛ جرّب شبكة أخرى أو أعد المحاولة';
        return { ok: false, error: `${message} (${code})` };
      }
      if (!data) continue;
      localStorage.setItem('shabah_host_' + code, token);
      return { ok: true, code };
    }
    return { ok: false, error: 'تعذر تخصيص كود للغرفة، حاول مرة أخرى' };
  } catch (err) {
    console.warn('[RoomService] Room creation failed:', err);
    return { ok: false, error: 'تعذر إنشاء الغرفة، تحقق من الاتصال وحاول مرة أخرى' };
  } finally {
    clearTimeout(timeout);
  }
}

const inFlightChecks = new Map<string, Promise<{ exists: boolean; gameId?: string; error?: string }>>();

export async function checkRoomExists(inputCode: string): Promise<{ exists: boolean; gameId?: string; error?: string }> {
  const code = normalizeRoomCode(inputCode);
  if (!/^[A-HJ-NP-Z2-9]{4}$/.test(code)) {
    return { exists: false, error: 'كود الغرفة غير صحيح' };
  }

  const pending = inFlightChecks.get(code);
  if (pending) return pending;

  const check = (async () => {
    try {
      const lookup = await supabase.rpc('lookup_shabah_room', { code });
      if (!lookup.error) {
        const gameId = normalizeGameId(lookup.data);
        return gameId
          ? { exists: true, gameId }
          : { exists: false, error: 'كود الغرفة غير صحيح أو الغرفة غير موجودة حالياً' };
      }
      // Support sites upgraded before the additive database migration.
      if (lookup.error.code !== 'PGRST202') throw lookup.error;
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
