import { createClient } from 'npm:@supabase/supabase-js@2';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};
const reply = (body: object, status = 200) => new Response(JSON.stringify(body), { status, headers });
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  try {
    const raw = await request.text();
    if (raw.length > 120000) return reply({ error: 'Request too large' }, 413);
    const { roomCode, secret, prompt, options = {} } = JSON.parse(raw);
    if (typeof roomCode !== 'string' || !/^[A-HJ-NP-Z2-9]{4}$/.test(roomCode) ||
        typeof secret !== 'string' || !/^[a-f0-9]{64}$/.test(secret) ||
        typeof prompt !== 'string' || !prompt.trim() || prompt.length > 90000 ||
        typeof options !== 'object' || !options || Array.isArray(options) ||
        (options.systemInstruction !== undefined && typeof options.systemInstruction !== 'string')) {
      return reply({ error: 'Invalid request' }, 400);
    }
    const { data: allowed, error } = await admin.rpc('reserve_shabah_ai_request', { code: roomCode, secret });
    if (error) return reply({ error: 'Unable to verify room', code:'AI_ROOM_CHECK_FAILED',retryable:true }, 503);
    if (!allowed) return reply({ error: 'Room permission or request limit',code:'AI_ROOM_DENIED',retryable:false }, 403);
    const key = Deno.env.get('GEMINI_API_KEY');
    if (!key) return reply({ error: 'AI is not configured',code:'AI_NOT_CONFIGURED',retryable:false }, 503);
    const model=Deno.env.get('GEMINI_MODEL') || 'gemini-3.5-flash-lite';
    if(!/^[a-zA-Z0-9._-]+$/.test(model))return reply({error:'Invalid AI model configuration',code:'AI_MODEL_UNAVAILABLE',retryable:false},503);
    const maxOutputTokens = Math.min(8192, Math.max(128, Number(options.maxOutputTokens) || 1500));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            ...(options.systemInstruction ? { systemInstruction: { parts: [{ text: options.systemInstruction.slice(0, 12000) }] } } : {}),
            generationConfig: {
              maxOutputTokens,
              ...(options.jsonMode !== false ? { responseMimeType: 'application/json' } : {}),
            },
          }),
        },
      );
      if (!response.ok) {
        console.warn('Gemini upstream HTTP', response.status);
        const status=response.status;
        const code=status===429?'AI_RATE_LIMIT':status===402?'AI_BILLING_REQUIRED':status===401 || status===403?'AI_ACCESS_DENIED':status===404?'AI_MODEL_UNAVAILABLE':status===400?'AI_REQUEST_INVALID':'AI_UNAVAILABLE';
        const retryable=[408,429,500,502,503,504].includes(status);
        return reply({ error:'AI temporarily unavailable',code,retryable,upstreamStatus:status },status===429?429:502);
      }
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.filter((part: { thought?: boolean }) => !part.thought)
        .map((part: { text?: string }) => part.text || '').join('');
      const blocked=Boolean(data.promptFeedback?.blockReason || data.candidates?.[0]?.finishReason==='SAFETY');
      return text ? reply({ text }) : reply({ error: 'Empty AI response',code:blocked?'AI_CONTENT_BLOCKED':'AI_EMPTY_RESPONSE',retryable:!blocked }, 502);
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    return reply({ error: error instanceof DOMException && error.name === 'AbortError' ? 'AI request timed out' : 'Unable to process request',code:'AI_UNAVAILABLE',retryable:true }, 504);
  }
});
