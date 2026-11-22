import { supabase } from '../lib/supabaseClient';

export interface CallGeminiOptions {
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  jsonMode?: boolean;
}

export async function requestRoomAI(roomCode: string, prompt: string, options: CallGeminiOptions): Promise<string> {
  const secret = localStorage.getItem('shabah_host_' + roomCode);
  if (!secret) throw new Error('تحتاج اتصالًا بالمضيف لتحليل الإجابة');
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 40000);
  try {
    const { data, error } = await supabase.functions.invoke('shabah-ai', {
      body: { roomCode, secret, prompt, options },
      signal: controller.signal,
    });
    if (error || typeof data?.text !== 'string') throw new Error('تعذّر التحليل، حاول مرة أخرى');
    return data.text;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function callGeminiWithFallback(
  prompt: string,
  optionsOrSystemInstruction: string | CallGeminiOptions = {}
): Promise<string> {
  const options = typeof optionsOrSystemInstruction === 'string'
    ? { systemInstruction: optionsOrSystemInstruction } : optionsOrSystemInstruction;
  const parts = window.location.pathname.split('/');
  const roomCode = (parts[1] === 'room' ? parts[2] : parts[3] || '').toUpperCase();
  if (!/^[A-HJ-NP-Z2-9]{4}$/.test(roomCode)) throw new Error('افتح غرفة قبل طلب التحليل');
  if (localStorage.getItem('shabah_host_' + roomCode)) return requestRoomAI(roomCode, prompt, options);

  const { roomBus } = await import('../lib/roomBus');
  const requestId = crypto.randomUUID();
  const playerId = localStorage.getItem('shabah_player_id') || localStorage.getItem('taghesi_playerId');
  return new Promise((resolve, reject) => {
    const off = roomBus.on('AI_RESPONSE', (event) => {
      const result = event.data;
      if (result?.requestId !== requestId) return;
      off();
      window.clearTimeout(timer);
      if (typeof result.text === 'string') resolve(result.text);
      else reject(new Error('تعذّر التحليل، حاول مرة أخرى'));
    }, roomCode);
    const timer = window.setTimeout(() => {
      off();
      reject(new Error('المضيف لم يرد خلال الوقت المحدد'));
    }, 45000);
    roomBus.emit('AI_REQUEST', roomCode, { requestId, playerId, prompt, options });
  });
}
