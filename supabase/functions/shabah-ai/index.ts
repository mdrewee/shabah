import { createClient } from 'npm:@supabase/supabase-js@2';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};
const reply = (body: object, status = 200) => new Response(JSON.stringify(body), { status, headers });
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

function budget(name: string, fallback: number) {
  const value = Number(Deno.env.get(name));
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

Deno.serve(async (request) => {
  let room = 'unknown';
  let game = 'unknown';
  const log = (code: string, extra: object = {}) =>
    console.warn(JSON.stringify({ service: 'shabah-ai', game, room, code, ...extra }));
  const fail = (code: string, status: number, extra: object = {}) => {
    log(code, extra);
    return reply({ code, retryable: false, ...extra }, status);
  };
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  try {
    const raw = await request.text();
    if (raw.length > 120000) return fail('AI_REQUEST_TOO_LARGE', 413);
    const { roomCode, secret, prompt, options = {} } = JSON.parse(raw);
    if (typeof roomCode !== 'string' || !/^[A-HJ-NP-Z2-9]{4}$/.test(roomCode) ||
        typeof secret !== 'string' || !/^[a-f0-9]{64}$/.test(secret) ||
        typeof prompt !== 'string' || !prompt.trim() || prompt.length > 90000 ||
        typeof options !== 'object' || !options || Array.isArray(options) ||
        (options.systemInstruction !== undefined && typeof options.systemInstruction !== 'string')) {
      return fail('AI_REQUEST_INVALID', 400);
    }
    room = roomCode;
    let account: string | undefined;
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (token && token !== request.headers.get('apikey') && token !== Deno.env.get('SUPABASE_ANON_KEY')) {
      const { data } = await admin.auth.getUser(token);
      if (data.user && !data.user.is_anonymous) account = data.user.id;
    }
    const { data: usage, error } = await admin.rpc('measure_shabah_ai_request', { code: roomCode, secret, account });
    if (error) return fail('AI_ROOM_CHECK_FAILED', 503);
    if (!usage) return fail('AI_ROOM_DENIED', 403);
    game = usage.game || game;
    for (const [scope, count, limit] of [
      ['room', usage.roomCount, budget('SHABAH_AI_ROOM_WARN_RPM', 90)],
      ['account', usage.accountCount, budget('SHABAH_AI_ACCOUNT_WARN_RPM', 180)],
    ] as const) {
      if (count === Math.ceil(limit * 0.8) || count === limit) {
        log('AI_SOFT_BUDGET', { scope, count, limit });
      }
    }
    const key = Deno.env.get('GEMINI_API_KEY');
    if (!key) return fail('AI_NOT_CONFIGURED', 503);
    const model=Deno.env.get('GEMINI_MODEL') || 'gemini-3.5-flash-lite';
    if(!/^[a-zA-Z0-9._-]+$/.test(model))return fail('AI_MODEL_UNAVAILABLE', 503);
    const maxOutputTokens = Math.min(8192, Math.max(128, Number(options.maxOutputTokens) || 1500));
    const requestBody = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      ...(options.systemInstruction ? { systemInstruction: { parts: [{ text: options.systemInstruction.slice(0, 12000) }] } } : {}),
      generationConfig: {
        maxOutputTokens,
        ...(options.jsonMode !== false ? { responseMimeType: 'application/json' } : {}),
      },
    });

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          signal: AbortSignal.timeout(9000),
          body: requestBody,
        });
        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.filter((part: { thought?: boolean }) => !part.thought)
            .map((part: { text?: string }) => part.text || '').join('');
          const blocked = Boolean(data.promptFeedback?.blockReason || data.candidates?.[0]?.finishReason === 'SAFETY');
          return text ? reply({ text }) : fail(blocked ? 'AI_CONTENT_BLOCKED' : 'AI_EMPTY_RESPONSE', 502);
        }

        const status = response.status;
        const code = status === 429 ? 'AI_RATE_LIMIT' : status === 402 ? 'AI_BILLING_REQUIRED' :
          status === 401 || status === 403 ? 'AI_ACCESS_DENIED' : status === 404 ? 'AI_MODEL_UNAVAILABLE' :
          status === 400 ? 'AI_REQUEST_INVALID' : 'AI_UNAVAILABLE';
        await response.body?.cancel().catch(() => {});
        if (attempt === 2 || (status !== 408 && status !== 429 && status < 500)) {
          return fail(code, status === 429 ? 429 : 502, { upstreamStatus: status });
        }
        log(code, { upstreamStatus: status, attempt: attempt + 1 });
      } catch (error) {
        const timedOut = error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name);
        const code = timedOut ? 'AI_TIMEOUT' : 'AI_NETWORK_ERROR';
        if (attempt === 2) return fail(code, 504, { attempt: attempt + 1 });
        log(code, { attempt: attempt + 1 });
      }
      await new Promise<void>(resolve => setTimeout(resolve, 700 * 2 ** attempt + Math.random() * 350));
    }
    return fail('AI_UNAVAILABLE', 502);
  } catch {
    return fail('AI_UNAVAILABLE', 502);
  }
});
