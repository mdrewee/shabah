import { wordStartsWithLetter, normalizeArabicLetter } from '../data/arabicCategories';

export interface PlayerCategoryResult {
  category: string;
  answer: string;
  isCorrect: boolean;
  score: number; // 10 للمنفرد الصحيح، 5 للمكرر، 0 للخاطئة أو الفارغة
  reason: string; // تعليل مقتضب جداً (كلمة إلى ٣ كلمات فقط)
}

export interface PlayerArabicEvaluation {
  playerId: string;
  playerName: string;
  totalScore: number;
  results: PlayerCategoryResult[];
}

export interface PlayerArabicSubmission {
  playerId: string;
  playerName: string;
  answers: Record<string | number, string>;
}

// Clean emojis from strings to maintain clean brutalist typography
function stripEmojis(text: string): string {
  return (text || '')
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/gu, '')
    .trim();
}

/**
 * فحص وتجريد أداة التعريف "الـ" وتطبيع الحروف برمجياً (Pre-Processing)
 * يشمل إزالة التشكيل (Tashkeel) وتوحيد المسافات لضمان دقة كشف الكلمات المكررة
 */
export function normalizeArabicWord(word: string): string {
  if (!word) return '';
  let cleaned = word
    .trim()
    // إزالة التشكيل العربي بالكامل (Tashkeel: تنوين، فتحة، ضمة، كسرة، سكون، شدة)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // توحيد المسافات المتعددة والمخفية
    .replace(/\s+/g, ' ');

  // إزالة "الـ" التعريف في بداية الكلمة إذا كانت الكلمة أطول من 3 حروف
  if (cleaned.startsWith('ال') && cleaned.length > 3) {
    cleaned = cleaned.substring(2);
  }

  // توحيد الهمزات والأحرف الشائعة للمقارنة
  cleaned = cleaned
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ـ]/g, ''); // إزالة الكشيدة

  return cleaned.trim();
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
    // إذا كان الكائن يحتوي على مصفوفة بداخله مثل { results: [...] } أو { evaluations: [...] }
    const nestedArray = Object.values(parsedData).find((val) => Array.isArray(val));
    if (nestedArray) {
      return nestedArray as any[];
    }
    // إذا كان كائن تقييم لمتسابق واحد فقط { playerId, playerName, results }
    return [parsedData];
  }
  return [];
}

/**
 * 2. سلسلة الموديلات المعتمدة والمستقرة والنشطة (Active Production Models Cascade)
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
  if (!rawText) return [];
  let cleaned = rawText.trim();

  // إزالة علامات الماركداون إذا وجدت ```json أو ```
  if (cleaned.includes('```')) {
    cleaned = cleaned.replace(/```(?:json)?([\s\S]*?)```/gi, '$1').trim();
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

export async function executeGeminiPrompt(prompt: string): Promise<any[]> {
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1, // أقصى درجات الثبات والسرعة
            maxOutputTokens: 1000,
          },
        }),
      });

      if (!response.ok) {
        console.warn(`[Gemini Engine] Model ${model} returned HTTP ${response.status}. Trying next candidate...`);
        continue;
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const parsed = cleanAndParseJSON(rawText);
      const normalized = normalizeToArray(parsed);

      if (normalized && normalized.length > 0) {
        return normalized;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini Engine] Exception on model ${model}:`, err);
    }
  }

  throw new Error(`All candidate models failed. Last error: ${lastError?.message || 'Unknown'}`);
}

/**
 * 3. دالة احتساب النقاط والتكرار التلقائي محلياً (Duplicate Detection & Scoring)
 * - الكلمة الصحيحة المنفردة: 10 نقاط
 * - الكلمة الصحيحة المكررة بين متسابقين أو أكثر في نفس الفئة: 5 نقاط
 * - الخاطئة أو الفارغة: 0 نقطة
 */
export function applyScoringAndDuplicates(
  evaluations: any[],
  categories: string[],
  allSubmissions: PlayerArabicSubmission[]
): PlayerArabicEvaluation[] {
  // خريطة لتسجيل الكلمات الصحيحة لكل فئة: Record<Category, Record<NormalizedWord, count>>
  const categoryWordCounts: Record<string, Record<string, number>> = {};

  evaluations.forEach((playerEval: any) => {
    const rawRes = playerEval.results || playerEval.evaluation || playerEval.evaluations || [];
    let items: Array<{ category: string; answer: string; isCorrect: boolean }> = [];

    if (Array.isArray(rawRes)) {
      items = rawRes.map((r: any) => ({
        category: String(r.category || '').trim(),
        answer: String(r.answer || '').trim(),
        isCorrect: Boolean(
          r.isCorrect ||
          r.status === 'صحيح' ||
          r.status === 'correct' ||
          (r.points && r.points > 0)
        ),
      }));
    } else if (rawRes && typeof rawRes === 'object') {
      items = Object.entries(rawRes).map(([cat, val]: [string, any]) => ({
        category: cat.trim(),
        answer: String(val?.answer || '').trim(),
        isCorrect: Boolean(
          val?.isCorrect ||
          val?.status === 'صحيح' ||
          val?.status === 'correct' ||
          (val?.points && val?.points > 0)
        ),
      }));
    }

    items.forEach((res) => {
      if (res.isCorrect && res.answer?.trim()) {
        const norm = normalizeArabicWord(res.answer);
        if (!categoryWordCounts[res.category]) {
          categoryWordCounts[res.category] = {};
        }
        categoryWordCounts[res.category][norm] = (categoryWordCounts[res.category][norm] || 0) + 1;
      }
    });
  });

  // تعيين النقاط بناءً على التفرد ومطابقة كافة الفئات الخمس
  return allSubmissions.map((sub, idx) => {
    const playerEval =
      evaluations.find((pe: any) => pe.playerId === sub.playerId) ||
      evaluations[idx] ||
      {};

    const rawRes = playerEval.results || playerEval.evaluation || playerEval.evaluations || [];
    let totalScore = 0;

    const scoredResults: PlayerCategoryResult[] = categories.map((cat, catIdx) => {
      const origAnswer = (
        sub.answers[cat] ??
        sub.answers[catIdx] ??
        sub.answers[String(catIdx)] ??
        ''
      ).trim();

      let foundRes: any = null;
      if (Array.isArray(rawRes)) {
        foundRes =
          rawRes.find((r: any) => r.category === cat) ||
          rawRes[catIdx];
      } else if (rawRes && typeof rawRes === 'object') {
        foundRes = rawRes[cat] || Object.values(rawRes)[catIdx];
      }

      const ans = stripEmojis(String(foundRes?.answer || origAnswer || ''));
      const isCorrect = Boolean(
        foundRes?.isCorrect ??
        foundRes?.status === 'صحيح' ??
        foundRes?.status === 'correct' ??
        (foundRes?.points && foundRes?.points > 0)
      );

      if (!isCorrect || !ans) {
        return {
          category: cat,
          answer: ans,
          isCorrect: false,
          score: 0,
          reason: stripEmojis(
            String(foundRes?.reason || foundRes?.comment || (!ans ? 'لم يكتب إجابة' : 'إجابة خاطئة'))
          ),
        };
      }

      const norm = normalizeArabicWord(ans);
      const occurrences = categoryWordCounts[cat]?.[norm] || 1;

      if (occurrences > 1) {
        totalScore += 5;
        const baseReason = stripEmojis(String(foundRes?.reason || foundRes?.comment || 'صحيح'));
        return {
          category: cat,
          answer: ans,
          isCorrect: true,
          score: 5,
          reason:
            baseReason === 'صحيح' || baseReason === 'صحيحة وفصيحة'
              ? 'مكرر مع متسابق (+5)'
              : `${baseReason} (مكرر +5)`,
        };
      } else {
        totalScore += 10;
        return {
          category: cat,
          answer: ans,
          isCorrect: true,
          score: 10,
          reason: stripEmojis(String(foundRes?.reason || foundRes?.comment || 'صحيح')),
        };
      }
    });

    return {
      playerId: sub.playerId,
      playerName: sub.playerName || 'متسابق',
      totalScore,
      results: scoredResults,
    };
  });
}

/**
 * Strict linguistic evaluation engine for "الشبح العربي" (The Arabic Ghost)
 * Evaluates all contestants' submissions in a single ultra-fast batch request via Gemini
 * Enforces strict traditional rules, anti-fraud detection, and local duplicate scoring.
 */
export async function evaluateAllArabicAnswers(
  letter: string,
  categories: string[],
  allSubmissions: PlayerArabicSubmission[]
): Promise<PlayerArabicEvaluation[]> {
  if (!allSubmissions || allSubmissions.length === 0) {
    return [];
  }

  // Format submissions with normalized category keys for the prompt
  const formattedSubmissions = allSubmissions.map((sub) => {
    const answersRecord: Record<string, string> = {};
    categories.forEach((cat, idx) => {
      const val = sub.answers[cat] ?? sub.answers[idx] ?? sub.answers[String(idx)] ?? '';
      answersRecord[cat] = (val || '').trim();
    });

    return {
      playerId: sub.playerId,
      playerName: sub.playerName,
      answers: answersRecord,
    };
  });

  const prompt = `أنت الحكم اللغوي الصارم في مسابقة حروف.
الحرف المطلوب: [ ${letter} ]
الفئات: ${categories.join(' - ')}

قواعد التدقيق الإلزامية:
1. قاعدة "الـ": لا تُحسب أداة التعريف في بداية الكلمة. انظر للحرف الأصلي بعد "الـ".
   - مثال للحرف (ب): "البحرين" تبدأ بـ ب (صحيحة). "الأردن" تبدأ بـ أ (خاطئة).
2. التسامح الإملائي الحقيقي: تسامح مع (ا/أ/إ/آ)، (ه/ة)، (ي/ى)، وأشكال الهمزة (ء/ئ/ؤ).
3. كشف الاحتيال والتحريف المتعمد: ارفض فوراً أي كلمة عامية أو محرفة عمداً للتحايل على الحرف (مثل: "شربلونه" بدل برشلونة بحرف ش، أو "شنيا" بدل كينيا، أو "أحمد" في فئة جماد) -> خاطئة (isCorrect: false) والسبب: "تحريف أو فئة خاطئة".
4. التعليل (reason): كلمة إلى ٣ كلمات فقط كحد أقصى (مثال: "صحيح"، "عامي مرفوض"، "لا تبدأ بالحرف"، "فئة خاطئة").
5. ممنوع استخدام أي إيموجي نهائياً في أي حقل.

قيّم هذه الإجابات وأرجع JSON مصفوفة فقط بنفس المعرفات:
${JSON.stringify(formattedSubmissions)}

الصيغة المطلوبة:
[
  {
    "playerId": "string",
    "results": [
      {
        "category": "string",
        "answer": "string",
        "isCorrect": true,
        "reason": "مقتضب جداً"
      }
    ]
  }
]`;

  try {
    const normalizedAI = await executeGeminiPrompt(prompt);

    // بعد استلام نتائج الـ AI: طبق نقاط التكرار (10 للمنفرد / 5 للمكرر) محلياً
    const scoredEvaluations = applyScoringAndDuplicates(
      normalizedAI,
      categories,
      allSubmissions
    );

    return scoredEvaluations;
  } catch (err) {
    console.warn('[arabicEngine] executeGeminiPrompt error, engaging resilient local fallback:', err);
  }

  // Local Rule Fallback when AI call is unreachable
  const fallbackRawEvaluations = allSubmissions.map((sub) => {
    const rawResults = categories.map((cat, idx) => {
      const rawAns = (sub.answers[cat] ?? sub.answers[idx] ?? sub.answers[String(idx)] ?? '').trim();

      if (!rawAns) {
        return {
          category: cat,
          answer: '',
          isCorrect: false,
          reason: 'لم يكتب إجابة',
        };
      }

      const startsWithTarget = wordStartsWithLetter(rawAns, letter);

      if (!startsWithTarget) {
        return {
          category: cat,
          answer: rawAns,
          isCorrect: false,
          reason: `لا تبدأ بحرف (${letter})`,
        };
      }

      return {
        category: cat,
        answer: rawAns,
        isCorrect: true,
        reason: 'صحيح',
      };
    });

    return {
      playerId: sub.playerId,
      playerName: sub.playerName,
      results: rawResults,
    };
  });

  return applyScoringAndDuplicates(fallbackRawEvaluations, categories, allSubmissions);
}
