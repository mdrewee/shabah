import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';

function extractJson(text: string) {
  if (!text) return {};
  const cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {}
    }
    return {};
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
  }

  let lastError: any = null;

  try {
    const { eventPair, theories } = await req.json();

    const systemPrompt = `
أنت "كبير المحققين في الجمعيات السرية ومكافحة المؤامرات الكونية". أمامك حدثان عشوائيان ظاهرياً:
- الحدث الأول: "${eventPair?.eventA || 'حدث غامض الأول'}"
- الحدث الثاني: "${eventPair?.eventB || 'حدث غامض الثاني'}"

المطلوب منك تدقيق ملفات ونظريات المؤامرة التي قدمها المشتبه بهم (اللاعبون):
${JSON.stringify(theories || [], null, 2)}

قواعد التحقيق والتقييم الصارمة:
1. معيار الفوز (winnerPlayerId):
   - النظرية الأكثر إبداعاً وجنوناً وربطاً منطقياً ساخراً بين الحدثين (بحيث يجعلك تضحك وتقول "والله ممكن تكون صح!").
   - استبعد النظريات الساذجة أو التسليكية السطحية (مثل "كلهم بالصدفة" أو "مافي علاقة").
2. أطلق اسماً كودياً استخباراتياً ساخراً لكل لاعب (codeName) مع نسبة خطورة المؤامرة (dangerLevel من 20% إلى 99%).
3. اختر فائزاً واحداً، وامنحه اسماً رسمياً للمؤامرة (classifiedTitle مثل: "عملية كوبري الفضاء المزدوجة").
4. اكتب تقرير استخباراتي ساخر (verdictCommentary) في سطرين بالعامية السعودية يشرح ليش هذي المؤامرة هي الأخطر وتستحق الاعتماد.

المطلوب إخراج JSON فقط بالمخطط:
{
  "winnerPlayerId": "string (معرف اللاعب الفائز)",
  "winnerName": "string (اسم اللاعب الفائز)",
  "classifiedTitle": "string (عنوان سري مضحك للمؤامرة)",
  "verdictCommentary": "string (سطران بالعامية السعودية لتحليل المؤامرة وعامل الفوز)",
  "theoriesAudit": [
    {
      "playerId": "string",
      "dangerLevel": 75,
      "codeName": "string (اسم كودي استخباراتي مثل العميل المسلك)",
      "quickRoast": "string (ذبة استخباراتية سريعة على نظريته)"
    }
  ]
}
`.trim();

    const candidateModels = [
      'gemini-2.5-flash',
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.6-flash'
    ];

    let data: any = null;

    for (const model of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
              generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.8,
                responseMimeType: 'application/json'
              }
            })
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`[Gemini ${model} Error]: ${response.status} - ${errText}`);
          lastError = `${response.status} - ${errText}`;
          continue;
        }

        data = await response.json();
        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          break;
        }
      } catch (e: any) {
        lastError = e?.message || String(e);
        console.warn(`[Gemini ${model} Exception]:`, e);
      }
    }

    const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = extractJson(rawJson || '');

    if (!parsed || Object.keys(parsed).length === 0) {
      throw new Error(`Parse failed or no data. Last error: ${lastError}. Raw: ${rawJson}`);
    }

    // Fallback checks
    const firstTheory = theories?.[0] || { playerId: 'none', playerName: 'متسابق' };
    const validated = {
      winnerPlayerId: parsed.winnerPlayerId || firstTheory.playerId,
      winnerName: parsed.winnerName || firstTheory.playerName,
      classifiedTitle: parsed.classifiedTitle || 'عملية الخيوط الخفية السرية',
      verdictCommentary: parsed.verdictCommentary || 'تحليل خطير يسلط الضوء على خفايا ما يجري خلف الكواليس!',
      theoriesAudit: Array.isArray(parsed.theoriesAudit) ? parsed.theoriesAudit : []
    };

    return new Response(JSON.stringify(validated), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    console.error('[Conspiracy Judge Edge Function Error]:', err);
    const firstTheory = (req as any)?.theories?.[0] || { playerId: 'none', playerName: 'متسابق' };
    return new Response(JSON.stringify({
      winnerPlayerId: firstTheory.playerId,
      winnerName: firstTheory.playerName,
      classifiedTitle: 'ملف المؤامرة المسرّبة',
      verdictCommentary: 'تحليل دقيق كشف خفايا الربط العجيب بين الحدثين!',
      theoriesAudit: []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});
