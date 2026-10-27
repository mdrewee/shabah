import { JudgeCase } from '../data/judgePredicaments';
import { PlayerVerdict, ContestantExcuse } from '../pages/games/judge/types';

// Strict zero-emoji cleaner
function stripEmojis(text: string): string {
  return (text || '').replace(
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/gu,
    ''
  ).trim();
}

/**
 * 1. تطبيع المخرجات إجبارياً إلى Array (Normalize Object to Array)
 * مهما كان شكل استجابة الـ AI (كائن فردي أو مصفوفة)، يحولها إلى مصفوفة صالحة لتجاوز شرط Array.isArray
 */
export function normalizeToArray(parsedData: any): any[] {
  if (Array.isArray(parsedData)) {
    return parsedData;
  }
  if (parsedData && typeof parsedData === 'object') {
    // إذا كان الكائن يحتوي على مصفوفة بداخله مثل { verdicts: [...] } أو { evaluations: [...] } أو { results: [...] }
    const nestedArray = Object.values(parsedData).find((val) => Array.isArray(val));
    if (nestedArray) {
      return nestedArray as any[];
    }
    // إذا كان كائن تقييم لمتسابق واحد فقط { playerId, playerName, verdict, roast, score }
    return [parsedData];
  }
  return [];
}

/**
 * 2. قائمة الموديلات المعتمدة والمستقرة والنشطة (Active Production Models Cascade)
 */
const CANDIDATE_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.8-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

/**
 * تنظيف نص الـ JSON قبل التحويل (Robust JSON Sanitization)
 */
export function cleanAndParseJSON(rawText: string): any {
  let cleaned = rawText.trim();

  // إزالة علامات الماركداون إذا وجدت ```json أو ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  // استخراج ما بين أول [ وآخر ] إذا كان المطلوب مصفوفة
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  } else {
    // أو ما بين أول { وآخر } إذا كان كائناً
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
  }

  return JSON.parse(cleaned);
}

export interface PlayerExcuseSubmission {
  playerId: string;
  playerName: string;
  excuse: string;
}

const RUTHLESS_GUILTY_ROASTS = [
  'عذر سطحي ومستهلك ما يمشي على طفل! الدليل القاطع مثبت عليك بالملي وأنت جاي تبرر ببرود، مذنب مع كامل السخرية.',
  'هذا اعتراف بالغباء مو دفاع قانوني! رميت كلام فارغ وتجاهلت الدليل الرئيسي وكأن المحكمة ما تشوف.',
  'تصريفة مكشوفة وضعيفة جداً! بدل ما تفكك الدليل المادي رحت تتهرب، مكانك قفص الاتهام وبجدارة.',
  'كلامك إنشائي لا يسمن ولا يغني من جوع؛ الأدلة حاصرتك من كل جهة وعذرك زاد الطين بلة!',
];

const RUTHLESS_BAIL_ROASTS = [
  'محاولة ذكية ومجهود يُحترم في الالتفاف، لكنك تركت ثغرة واضحة ما قدرت ترقعها.. حكمت عليك مع وقف التنفيذ.',
  'السيناريو فيه ذكاء وتكتيك، بس الدليل القاطع ما زال يحوم حولك؛ مشيناها لك مع وقف التنفيذ وتحت المراقبة.',
  'حبكت القصة بشكل جيد لكن المنطق انكسر في التفاصيل الصغيرة، إفراج مؤقت مع وقف التنفيذ.',
];

const RUTHLESS_INNOCENT_ROASTS = [
  'مخرج عبقري وثغرة قانونية تفكك الدليل بالملي! قلبت الطاولة بذكاء خارق وأحرجت الادعاء.. براءة مستحقة مع مرتبة الشرف.',
  'هذا هو الذكاء الجنائي الحقيقي؛ فككت التناقض بحجة داهية لا تقبل الشك! رفعت الجلسة وأنت حر طليق.',
  'تحليل عبقري وسيناريو متماسك أحرق كل الأدلة الموجهة ضدك! المحكمة ترفع لك القبعة، براءة تامة.',
];

/**
 * Ruthless High-IQ AI Judge: Evaluates all contestants' excuses in a single batch request
 * without penalties, strictly enforcing ruthless logic against lazy/surface-level excuses.
 */
export async function evaluateAllExcuses(
  currentCase: { title: string; description: string; keyEvidence?: string; contextTag?: string },
  excuses: PlayerExcuseSubmission[]
): Promise<PlayerVerdict[]> {
  if (!excuses || excuses.length === 0) return [];

  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  const keyEvidence = currentCase.keyEvidence || 'الأدلة المادية المسجلة في وقائع القضية';

  const systemPrompt = `أنت "الشبح القاضي"؛ قاضٍ جنائي عبقري، حاد الذكاء، صارم جداً، ولسانك سليط بلهجة خليجية/سعودية ساخرة.

تفاصيل القضية المرفوعة أمامك:
- عنوان القضية: ${currentCase.title}
- وقائع القضية: ${currentCase.description}
- الدليل القاطع ضد المتهم: ${keyEvidence}

قواعد الحكم الصارمة (ممنوع التساهل أو التسليك نهائياً):
1. الرفض القاطع للأعذار السطحية: أي متسابق يكتب عذراً قصيراً، أو يتهرب بعبارات باردة مثل ("مو مشكلتي"، "ما دريت"، "كنت نايم"، "غلطانين"، "مدري"، "نسيت"، "السيارة مهيب لي") أو يتجاهل الدليل القاطع في القضية أو التزم الصمت -> يُحكم عليه فوراً بـ "مذنب" (score: 0) مع قصف جبهة لاذع يسخر من ضعف حجته وغباء تصريفته.
2. شروط الحصول على "بريء" (score: 10): لا تمنح البراءة إلا لمن يقدم ثغرة قانونية/منطقية عبقرية تفكك الدليل القاطع بالملي، أو يبتكر سيناريو ذكياً ومفصلاً يقلب الطاولة، أو عذراً كوميدياً مبتكراً مبنياً على ذكاء حقيقي.
3. شروط "مع وقف التنفيذ" (score: 5): إذا كان العذر ذكياً ومفصلاً وفيه محاولة ممتازة لكن فيه ثغرة صغيرة لم يغطها بالكامل.
4. ممنوع منعاً باتاً كتابة أي عقوبات أو غرامات نهائياً؛ اكتفِ بالحكم والتحليل المنطقي الساخر فقط.
5. ممنوع استخدام أي إيموجي في أي حقل نهائياً.

إليك قائمة المتهمين وأعذارهم:
${JSON.stringify(
  excuses.map((e) => ({
    playerId: e.playerId,
    playerName: e.playerName,
    excuse: (e.excuse || '').trim(),
  })),
  null,
  2
)}

أرجع النتيجة حصراً بصيغة JSON Array مطابقة تماماً للشكل التالي لجميع المتسابقين بدون استثناء:
[
  {
    "playerId": "معرف اللاعب",
    "playerName": "اسم المتسابق",
    "excuse": "نص العذر",
    "verdict": "بريء" أو "مذنب" أو "مع وقف التنفيذ",
    "roast": "تحليل القاضي الساخر والحاد لثغرات العذر (سطرين إلى ٣ أسطر بلهجة سعودية قوية وبدون إيموجي وبدون أي عقوبات)",
    "score": 10 أو 5 أو 0
  }
]`;

  const resultMap = new Map<string, PlayerVerdict>();

  if (apiKey) {
    for (const model of CANDIDATE_MODELS) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7,
              maxOutputTokens: 3000,
            },
          }),
        });

        if (!response.ok) {
          console.warn(`[JudgeEngine] Model ${model} returned HTTP ${response.status}. Trying next candidate...`);
          continue;
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) continue;

        const parsed = cleanAndParseJSON(rawText);
        const list = normalizeToArray(parsed);

        if (list.length > 0) {
          list.forEach((item) => {
            if (!item || !item.playerId) return;
            const orig = excuses.find((e) => e.playerId === item.playerId);
            if (!orig) return;

            let vType: 'بريء' | 'مذنب' | 'مع وقف التنفيذ' = 'مذنب';
            let finalScore = 0;

            const rawVerdict = String(item.verdict || '').trim();
            if (rawVerdict === 'بريء' || rawVerdict.toLowerCase() === 'innocent') {
              vType = 'بريء';
              finalScore = 10;
            } else if (
              rawVerdict === 'مع وقف التنفيذ' ||
              rawVerdict.toLowerCase() === 'bail'
            ) {
              vType = 'مع وقف التنفيذ';
              finalScore = 5;
            } else {
              vType = 'مذنب';
              finalScore = 0;
            }

            const roast = stripEmojis(item.roast || item.judgeRoast || '');

            resultMap.set(item.playerId, {
              playerId: item.playerId,
              playerName: orig.playerName,
              excuse: orig.excuse,
              verdict: vType,
              roast,
              score: finalScore,
              verdictLabel: vType,
              judgeRoast: roast,
              pointsAwarded: finalScore,
            });
          });

          // Successfully processed verdicts
          break;
        }
      } catch (err) {
        console.warn(`[JudgeEngine] Error on candidate model ${model}:`, err);
      }
    }
  }

  // Ensure every contestant has a verdict (Ruthless Heuristic Fallback)
  const finalVerdicts: PlayerVerdict[] = excuses.map((orig, idx) => {
    const existing = resultMap.get(orig.playerId);
    if (existing) return existing;

    const excuseText = (orig.excuse || '').trim();
    const isLazy =
      !excuseText ||
      excuseText.length < 15 ||
      excuseText === 'التزم الصمت ولم يقدم أي دفاع' ||
      /^(ما دريت|مدري|مو مشكلتي|كنت نايم|نسيت|غلطانين|مهيب لي)$/i.test(excuseText);

    let vType: 'بريء' | 'مذنب' | 'مع وقف التنفيذ' = 'مذنب';
    let finalScore = 0;
    let roast = '';

    if (isLazy) {
      vType = 'مذنب';
      finalScore = 0;
      roast = RUTHLESS_GUILTY_ROASTS[idx % RUTHLESS_GUILTY_ROASTS.length];
    } else if (excuseText.length >= 60) {
      vType = 'بريء';
      finalScore = 10;
      roast = RUTHLESS_INNOCENT_ROASTS[idx % RUTHLESS_INNOCENT_ROASTS.length];
    } else {
      vType = 'مع وقف التنفيذ';
      finalScore = 5;
      roast = RUTHLESS_BAIL_ROASTS[idx % RUTHLESS_BAIL_ROASTS.length];
    }

    return {
      playerId: orig.playerId,
      playerName: orig.playerName,
      excuse: orig.excuse,
      verdict: vType,
      roast: stripEmojis(roast),
      score: finalScore,
      verdictLabel: vType,
      judgeRoast: stripEmojis(roast),
      pointsAwarded: finalScore,
    };
  });

  return finalVerdicts;
}

/**
 * Backward compatibility wrapper returning Record<string, PlayerVerdict>
 */
export async function evaluateBatchExcuses(
  currentCase: { title: string; description: string; keyEvidence?: string; contextTag?: string },
  excuses: Record<string, ContestantExcuse>
): Promise<Record<string, PlayerVerdict>> {
  const excuseList: PlayerExcuseSubmission[] = Object.values(excuses).map((e) => ({
    playerId: e.playerId,
    playerName: e.playerName,
    excuse: e.excuse || '',
  }));

  const list = await evaluateAllExcuses(currentCase, excuseList);
  const map: Record<string, PlayerVerdict> = {};
  list.forEach((v) => {
    map[v.playerId] = v;
  });
  return map;
}
