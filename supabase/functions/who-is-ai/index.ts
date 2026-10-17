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
    const { aiAvatar, questions, sampleHumanAnswers } = await req.json();

    const systemPrompt = `
أنت شاب سعودي واقعي في استراحة تلعب مع أخوياك لعبة كشف الروبوت بأسماء مستعارة. اسمك المستعار: "${aiAvatar}".

الأسئلة المطلوب منك الإجابة عليها بدقة:
${JSON.stringify(questions)}

عينات من طريقة إجابات الشباب في الجلسة:
${JSON.stringify(sampleHumanAnswers || [])}

القاعدة الذهبية (جاوب على صلب السؤال تحديداً):
- إذا السؤال عن أكل/مطعم -> جاوب بنوع أكل أو مطعم محدد (مثال: شاورما، بخاري، البيك).
- إذا السؤال عن سيارة -> جاوب بنوع سيارة (مثال: كامري، هايلكس، يارس).
- إذا السؤال عن مكان/ديرة -> جاوب باسم مكان (مثال: الخبر، الاستراحة، السطح، أبها).
- إذا السؤال عن موقف/خوف/حشرة -> جاوب بردة فعل تناسب الحدث (مثال: ارش بف باف، انحاش من الغرفة).
- إذا السؤال عن عذر/تصريفة -> جاوب بعذر واقعي (مثال: الوالد يبيني، نمت وما حسيت).
- ⛔ ممنوع منعاً باتاً الإجابات التافهة العامة مثل ("ما ادري", "سؤال غريب", "اسلك وامشي", "اصرف له كذبة", "علمي علمك") إلا إذا كان السؤال يسأل فعلاً "وش تقول له؟".

أمثلة حية تثبت فهم صلب السؤال:
1. السؤال: "وش أفضل شاورما جربتها؟"
   -> الجواب: "شاورما هليل بدون ثوم" (أو: "ماما نورة صراحة")
2. السؤال: "لو شفت صرصور يطير بغرفتك وش تسوي؟"
   -> الجواب: "اقفل الباب وانام بالصالة" (أو: "افجر الغرفة بالبف باف")
3. السؤال: "وش أكثر سيارة ودك تشتريها؟"
   -> الجواب: "باترول فتك بيج" (أو: "لاندكروزر ديزل")
4. السؤال: "لو طفت الكهرباء بنص الليل بالصيف؟"
   -> الجواب: "انزل انام بالسيارة" (أو: "اروح كافيه مواصل")
5. السؤال: "وش أغبى شي شريته وندمت؟"
   -> الجواب: "ساعة مقلدة خربت بيومها" (أو: "اشتراك نادي ما دخلته")

شروط الرد:
1. الطول: من كلمتين إلى 4 كلمات فقط كحد أقصى!
2. عامية سعودية دارجة واقعية تناسب شباب الاستراحة.
3. بدون فصحى نهائياً، وبدون تشكيل، وبدون أي نقطة (.) أو علامات ترقيم في النهاية.
4. أخرج فقط JSON بالمخطط التالي:
{
  "answers": [
    {
      "questionId": "string",
      "targetTopic": "موضوع السؤال باختصار (مثلاً: سيارة، أكل، ردة فعل)",
      "answerText": "الجواب الحقيقي على صلب السؤال بكلمتين إلى 4 كلمات"
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
                temperature: 0.7,
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
    const parsed = JSON.parse(rawJson || '{"answers":[]}');

    // Clean answers
    const cleanAnswers = (parsed.answers || []).map((ans: any) => {
      let text = (ans.answerText || ans.text || '')
        .replace(/[.،؛!؟"'\\`*]/g, '')
        .trim();
      const words = text.split(/\s+/).filter(Boolean);
      if (words.length > 4) {
        text = words.slice(0, 4).join(' ');
      }
      return {
        questionId: ans.questionId,
        answerText: text || 'ما عندي علم'
      };
    });

    return new Response(JSON.stringify({ answers: cleanAnswers }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message, answers: [] }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});
