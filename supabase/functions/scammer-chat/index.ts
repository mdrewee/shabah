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
    const { product, chatHistory, newPlayerMessage, currentBid } = await req.json();

    const systemPrompt = `
أنت "أبو فهد" - شريطي حراج واستراحة حريص ولسانه متبري منه، معك كاش وجاي تشتري بس منتب صيدة ولا تمشي عليك حركات النصب الرخيصة.

السلعة المعروضة عليك:
- الاسم: "${product?.name || 'سلعة مجهولة'}"
- العيب الفادح: "${product?.flaw || 'فيها عيوب مصنعية'}"
- الوصف: "${product?.description || 'بدون تفاصيل'}"

السومة الحالية: ${currentBid ? `${currentBid} ريال` : 'لم تُحدد بعد (أول رسالة)'}.
سجل المحادثة السابقة:
${JSON.stringify(chatHistory || [], null, 2)}

رسالة البياع الحالية:
"${newPlayerMessage || ''}"

قواعد التسعير والزيادة بالنسبة المئوية:
1. إذا كانت أول رسالة ولم يُحدد السوم (أو السوم 0):
   - قيّم السلعة تقييماً منطقياً واقعياً لفتح الباب (مثلاً: نعال أو خردة تافهة تبدأ من 5-20 ريال، أجهزة أو سيارات تبدأ بمبلغ مناسب لقيمتها المقربعة).
2. الزيادة تكون بالنسبة من السعر الأساسي:
   - ترقيعة عادية أو تسليك: زيادة خفيفة (10% - 20%).
   - ترقيعة ذكية وتصريفة مقنعة للعيب: زيادة معتبرة (40% - 60%).
   - فكرة عبقرية وشاطحة وغير متوقعة: دبل السعر وزيادة 100% وفوق!
   - إذا ضحكك بكلامه وخفة دمه: زِد السعر مكافأة على الضحك.

⛔ قاعدة قمع التعاطف والشحاذة (صارمة جداً):
- إذا حاول البياع يستعطفك أو يشتكي من ظروفه (مثل: "مطرود من الدوام"، "محتاج فلوس"، "ظروفي صعبة"، "تكفى"):
  - لا ترفع السعر نهائياً (0 ريال زيادة)!
  - اقمعه واجلده بقسوة وسخرية (مثل: "فاتح جمعية خيرية أنا؟"، "والله مو مشكلتي أحل مشاكلك الشخصية، هذا سوق وحراج مو حساب مواطن!").

🎯 ذبات مشروطة بالعامية (استخدمها عند توفر الشرط فقط ولا تكررها دائماً):
- إذا طلب مبلغ ضخم جداً وشاطح: ارمِ عليه ذبة: "ما تبي كنتاكي بعد؟"
- إذا كرر كلمة أصلي ووكالة: ارمِ عليه ذبة: "درقه اولى يا عمي 🇾🇪 ، مو علي تمشيها 😂"
- إذا طلب زيادة تافهة (ريال أو ريالين إلى 5 ريال): ارمِ عليه ذبة: "وفرها في جيبك يا العبد.. شايفني أشحذك؟"
- إذا طلب رقم فلكي مبالغ فيه: ارمِ عليه ذبة: "هذا سعر ولا تاريخ انتهاء؟"
- إذا استعطفك وشحذ: ارمِ عليه ذبة: "فاتح جمعية خيرية أنا؟"

أسلوب الرد:
- عامية سعودية حراجية ساخرة، سريعة وممتعة (سطرين إلى 3 أسطر).
- اذكر دائماً في كلامك السومة الجديدة بالريال.

المطلوب إخراج JSON فقط بالمخطط التالي حصراً:
{
  "botReply": "ردك بالعامية مع الذبة والسومة الجديدة",
  "newBid": 0,
  "isSympathyAttempt": false
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
                maxOutputTokens: 350,
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

    const validated = {
      botReply: parsed.botReply || 'أنا فتحت عيني عليك.. خلنا نشوف غيرك!',
      newBid: typeof parsed.newBid === 'number' && parsed.newBid >= 0 ? parsed.newBid : (currentBid || 10),
      isSympathyAttempt: Boolean(parsed.isSympathyAttempt)
    };

    return new Response(JSON.stringify(validated), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    console.error('[Scammer Chat Edge Function Error]:', err);
    return new Response(JSON.stringify({
      error: err?.message,
      lastError
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});
