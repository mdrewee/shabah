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
    const { fighterA, fighterB } = await req.json();

    const systemPrompt = `
أنت "معلق ومحاكي حلبة قتال استراحة شعبية". يتقاتل أمامك اثنان من الشباب في نزال مباشر (1 ضد 1) بدون أي نقاط حياة أو هيلث بار.
حسم القتال يعتمد بالكامل على "المنطق الفيزيائي والكوميدي" لتصادم الأسلحة والدفاعات والقوى الخارقة التي اختارها الطرفان.

بيانات المقاتل الأول (${fighterA.playerName}):
- السلاح: "${fighterA.weapon}"
- الدفاع: "${fighterA.defense}"
- القوة الخارقة: "${fighterA.superpower}"

بيانات المقاتل الثاني (${fighterB.playerName}):
- السلاح: "${fighterB.weapon}"
- الدفاع: "${fighterB.defense}"
- القوة الخارقة: "${fighterB.superpower}"

قواعد محاكاة النزال الصارمة:
1. ادرس تفاعل العناصر ضد بعضها بدقة (تضاد الأسلحة والدفاعات والقوى):
   - كيف تصدى دفاع أحدهما لهجوم الآخر؟ (مثال: صينية الاستيل عكست ضربة المكنسة، أو البطانية لفت الساطور وشلّت حركته).
   - كيف قلبت القوة الخارقة موازين القتال في اللحظة الحاسمة؟
2. اكتب قصة النزال (clashStory) في 3 إلى 4 جمل مشوقة ومضحكة بالعامية السعودية تسرد فيها سيناريو الهجوم والدفاع والضربة القاضية بدون أي هيلث بار.
3. حسم فائز واحد فقط حتماً (winnerPlayerId): المقاتل الذي تمكن عتاده وقوته من كسر عتاد الخصم وإسقاطه أرضاً.
4. اذكر سبب الفوز الحاسم في سطر واحد (decidingFactor).

المطلوب إخراج JSON فقط بالمخطط التالي حصراً:
{
  "winnerPlayerId": "${fighterA.playerId}" أو "${fighterB.playerId}",
  "winnerName": "اسم الفائز",
  "clashStory": "سرد القتال والاشتباك الحاسم بالعامية السعودية الواقعية والساخرة في 3-4 جمل",
  "decidingFactor": "السبب الفيزيائي أو الكوميدي الصريح لحسم الفوز"
}
`.trim();

    const candidateModels = [
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.6-flash',
      'gemini-2.5-flash'
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
                maxOutputTokens: 600,
                temperature: 0.8,
                responseMimeType: 'application/json'
              }
            })
          }
        );

        if (response.ok) {
          data = await response.json();
          if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            break;
          }
        }
      } catch {
        // try next model
      }
    }

    const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawJson || '{}');

    // Robust fallbacks
    if (!parsed.winnerPlayerId) {
      parsed.winnerPlayerId = fighterA.playerId;
      parsed.winnerName = fighterA.playerName;
    }
    if (!parsed.clashStory) {
      parsed.clashStory = `هجم ${fighterA.playerName} بـ ${fighterA.weapon} محاولاً مباغتة ${fighterB.playerName}، لكن دفاع ${fighterB.defense} تدخل بذكاء. في اللحظة الأخيرة قلبت قوة ${parsed.winnerName} الموازين وحسمت الجولة بضربة قاضية أطاحت بالخصم!`;
    }
    if (!parsed.decidingFactor) {
      parsed.decidingFactor = `تفوق ذكي في استغلال عتاد المعركة وتوقيت الهجوم!`;
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
