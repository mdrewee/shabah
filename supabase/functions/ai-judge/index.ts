import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
  }

  try {
    const { courtCase, playerDefenses } = await req.json();

    const systemPrompt = `
أنت "القاضي العرفي" في محكمة استراحة سعودية شعبية. قاضٍ داهية، ساخر، لسانك متبري منك، تفهم عيال الاستراحة وتعرف كل ألاعيبهم وترقيعاتهم.

القضية المطروحة:
- العنوان: "${courtCase?.title || 'قضية الاستراحة'}"
- التهمة: "${courtCase?.charge || 'توريط الجلسة'}"
- الموقف: "${courtCase?.context || 'المتهمين متورطين ومطلوب ترقيعاتهم'}"

مرافعات المتهمين:
${JSON.stringify(playerDefenses || [], null, 2)}

قواعد الحكم الصارمة جداً (Anti-Exploits):
1. ⛔ الأعذار المبالغ فيها والدراما الكاذبة (Extreme Fake Drama):
   - إذا كتب متهم عذراً درامياً مبالغاً فيه لموقف تافه (مثل: "مات أبوي", "جاني سرطان", "كنت بموت بالعناية", "عندي عزا", "صار لي حادث وانقلبت ٦ مرات", "خالتي ماتت").
   - الحكم الإجباري: ❌ "مرفوض" فوراً مع تقييم logicScore = 1 أو 2.
   - اجلده في roastReason على دراماته الرخيصة والكذب الفاضح في لعبة طقطقة (مثال: "قاعد تفاول على أهلك وتدخلنا بعناية مركزة عشان سحبة عشاء؟ مردودة عليك وعلى وجهك").

2. ⛔ كرت الأعذار الدينية والتسليك بالعبادات (Religious Exploits):
   - إذا حاول لاعب الهروب بكرت "كنت أصلي" أو "كنت أقرأ قرآن" أو "بالمسجد" بدون مبرر منطقي للوقت والسياق (مثل تأخر ساعتين عن عزيمة أو سحبة قطية).
   - الحكم: لا تقبله لمجرد أنه ديني! إذا كان تسليكاً مفضوحاً اهجم عليه واجلده (مثال: "مسوي لي الشيخ السديس الحين؟ جالس تصلي العصر ٤ ساعات ومقفل جوالك؟ لا تلعب بالدين عشان ترقع"). لا تقبله إلا إذا ركبه بحبكة ذكية حقيقية.

3. معايير القبول والفوز:
   - "مقبول": العذر الذكي، الترقيعة الطريفة المترابطة، قلب التهمة على المشتكي بذكاء، أو الاعتراف المحنك المضحك.
   - "مرفوض": الأعذار الكسولة ("نسيت", "مالي خلق", "كنت نايم"), الكذب الدرامي المبالغ فيه، والتهرب السخيف.
   - اختر فائزاً واحداً فقط (winnerPlayerId) وهو صاحب أقوى أو أطرف حجة صامدة.

المطلوب: إخراج JSON فقط بالمخطط:
{
  "winnerPlayerId": "string",
  "winnerReason": "string (ليش هذا بالذات فاز وتفوق على الباقين)",
  "judgeSummary": "string (سطرين طقطقة على مستوى المتهمين بالجلسة)",
  "evaluations": [
    {
      "playerId": "string",
      "playerName": "string",
      "verdict": "مقبول" | "مرفوض",
      "logicScore": 8,
      "roastReason": "string (تحليل العذر وجلد الترقيعة بالتفصيل بالعامية السعودية الساخرة)"
    }
  ]
}
`.trim();

    const candidateModels = [
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.6-flash',
      'gemini-2.5-flash'
    ];

    let data: any = null;
    let usedModel = '';

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
                maxOutputTokens: 1200,
                temperature: 0.75,
                responseMimeType: 'application/json'
              }
            })
          }
        );

        if (response.ok) {
          data = await response.json();
          if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            usedModel = model;
            break;
          }
        }
      } catch {
        // try next model
      }
    }

    const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawJson || '{}');

    // Ensure evaluations array exists and matches players
    if (!parsed.evaluations || !Array.isArray(parsed.evaluations)) {
      parsed.evaluations = [];
    }

    // Safety fallback for any missing player evaluations
    (playerDefenses || []).forEach((pd: any, idx: number) => {
      let found = parsed.evaluations.find((e: any) => e.playerId === pd.playerId);
      if (!found) {
        found = {
          playerId: pd.playerId,
          playerName: pd.playerName,
          verdict: idx === 0 ? 'مقبول' : 'مرفوض',
          logicScore: idx === 0 ? 8 : 3,
          roastReason: pd.argumentText
            ? `ترقيعة مريبة بكلامك: "${pd.argumentText}". القاضي ما مشت عليه!`
            : 'حتى عذر ما كلف نفسه يكتبه.. مذنب مع مرتبة الشرف!'
        };
        parsed.evaluations.push(found);
      }
    });

    if (!parsed.winnerPlayerId && playerDefenses && playerDefenses.length > 0) {
      parsed.winnerPlayerId = playerDefenses[0].playerId;
      parsed.winnerReason = 'أقلهم كذباً وسلكت معه المحكمة بحسن نية!';
    }

    if (!parsed.judgeSummary) {
      parsed.judgeSummary = 'جلسة مليانة ترقيع مفضوح.. الله يخلف على أهاليكم بس!';
    }

    return new Response(JSON.stringify(parsed), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});
