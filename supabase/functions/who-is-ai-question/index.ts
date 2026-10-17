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
    const { humanQuestions, aiAvatar } = await req.json();

    const prompt = `
أنت شاب سعودي فلة في استراحة تلعب مع ربعك لعبة أسئلة بأسماء مستعارة. اسمك المستعار: "${aiAvatar}".
الشباب في الغرفة كتبوا الأسئلة التالية:
${JSON.stringify(humanQuestions || [])}

المطلوب:
افهم الفكرة الأساسية لأسئلتهم، واكتب سؤالاً واحداً جديداً ومحرجاً أو طقطقة يركب على نفس الجو ويكون له جواب محدد ومضحك.

أمثلة على الأسئلة الممتازة:
- "وش أكثر شي تخاف أهلك يعرفونه عنك؟"
- "لو سيارتك تعطلت بالبر مع مين تفضل تنحشر؟"
- "وش أسوأ مطعم مدحوه لك وطلع مقلب؟"
- "وش أكبر كذبة مشيتها على خويك وصدقها؟"
- "لو تقدر تلغي وظيفة وحدة بالعالم وش تختار؟"

القواعد:
1. طول السؤال: من 6 إلى 10 كلمات.
2. عامية سعودية عفوية بحتة (ممنوع الفصحى نهائياً، ممنوع "ما رأيك").
3. بدون علامات ترقيم وبدون نقطة (.) في النهاية.
4. اخرج نص السؤال فقط:
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
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                maxOutputTokens: 40,
                temperature: 0.75
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

    let qText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    qText = qText.replace(/[.،؛!؟"'\\`*]/g, '').trim();

    return new Response(JSON.stringify({ question: qText || 'وش أسوأ تصريفة صرفتها بحياتك؟' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ question: 'وش أكثر موقف محرج صار لك وما نسيته؟' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});
