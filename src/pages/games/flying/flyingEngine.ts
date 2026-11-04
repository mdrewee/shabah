import { generateWithGemini } from '../../../config/gemini';
import { FlyingQuestion } from './flyingQuestions';
import { FlyingSubmission, FlyingContestantResult, FlyingTier } from './types';

/**
 * Strips all emojis and pictographs from any text string
 */
export function stripEmojis(text: string): string {
  if (!text) return '';
  return text
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{FE00}-\u{FE0F}\u{200D}]/gu,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes Arabic text for strict equivalence and duplicate matching
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  const clean = text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u0610-\u061A]/g, '')
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = clean.split(' ').map((w) => {
    if (w.startsWith('ال') && w.length >= 4) {
      return w.slice(2);
    }
    return w;
  });

  return words.join(' ').trim();
}

/**
 * Robust JSON Sanitization & Parsing
 */
export function cleanAndParseJSON(rawText: string): any {
  if (!rawText) return null;
  let cleaned = rawText.trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/**
 * Offline Heuristic Fallback in case of network or API outage
 */
function evaluateOfflineSubmissions(
  _question: FlyingQuestion,
  submissions: FlyingSubmission[],
  exactDupeIds: Set<string>,
  previousMeters: Record<string, number>
): FlyingContestantResult[] {
  return submissions.map((sub) => {
    const prev = previousMeters[sub.contestantId] || 0;
    const clean = stripEmojis(sub.answer || '');

    if (exactDupeIds.has(sub.contestantId)) {
      return {
        contestantId: sub.contestantId,
        contestantName: sub.contestantName,
        answer: clean,
        isValid: true,
        isDuplicated: true,
        roundMeters: 0,
        tier: 'duplicated' as FlyingTier,
        comment: 'إجابة مكررة، صفر متر',
        previousTotalMeters: prev,
        newTotalMeters: prev,
      };
    }

    if (!clean || clean.length < 2) {
      return {
        contestantId: sub.contestantId,
        contestantName: sub.contestantName,
        answer: clean || 'بدون إجابة',
        isValid: false,
        isDuplicated: false,
        roundMeters: 0,
        tier: 'failed' as FlyingTier,
        comment: 'إجابة خاطئة، صفر متر',
        previousTotalMeters: prev,
        newTotalMeters: prev,
      };
    }

    let earned = 95;
    let tier: FlyingTier = 'uncommon';
    let comment = 'إجابة صحيحة وغير شائعة';

    if (clean.length > 7) {
      earned = 185;
      tier = 'rare';
      comment = 'إجابة نادرة ومميزة';
    } else if (clean.length <= 4) {
      earned = 40;
      tier = 'common';
      comment = 'إجابة شائعة ومعروفة';
    }

    return {
      contestantId: sub.contestantId,
      contestantName: sub.contestantName,
      answer: clean,
      isValid: true,
      isDuplicated: false,
      roundMeters: earned,
      tier,
      comment,
      previousTotalMeters: prev,
      newTotalMeters: prev + earned,
    };
  });
}

/**
 * Main AI Evaluation Engine for "الشبح الطائر"
 * Evaluates all submissions in a single atomic batch, enforcing duplicate zeroing and rarity tiers without emojis.
 */
export async function evaluateFlyingAnswers(
  question: FlyingQuestion,
  submissions: FlyingSubmission[],
  previousMeters: Record<string, number> = {}
): Promise<FlyingContestantResult[]> {
  if (!submissions || submissions.length === 0) return [];

  // Step 1: Pre-AI Strict Exact & Normalized Duplication Detection
  const normMap = new Map<string, string[]>();
  submissions.forEach((s) => {
    const norm = normalizeArabic(s.answer);
    if (norm) {
      const list = normMap.get(norm) || [];
      list.push(s.contestantId);
      normMap.set(norm, list);
    }
  });

  const exactDupeIds = new Set<string>();
  normMap.forEach((ids) => {
    if (ids.length > 1) {
      ids.forEach((id) => exactDupeIds.add(id));
    }
  });

  // Step 2: Prepare Gemini AI Prompt
  const payloadForAI = submissions.map((s) => ({
    contestantId: s.contestantId,
    contestantName: s.contestantName,
    answer: stripEmojis(s.answer.trim()),
    isExactDuplicate: exactDupeIds.has(s.contestantId),
  }));

  const systemPrompt = `أنت الحكم الذكي والصارم في لعبة "الشبح الطائر" (سباق الأجوبة النادرة والارتفاع).
السؤال المطروح للمتسابقين: [ ${question.title} ]
تصنيف السؤال: ${question.category}

إجابات المتسابقين المطلوب تقييمها:
${JSON.stringify(payloadForAI, null, 2)}

القواعد الصارمة للتقييم:
1. منع الإيموجي نهائياً:
   - يمنع منعاً باتاً استخدام أي إيموجي أو رموز تعبيرية في حقل comment أو أي حقل آخر. اكتب باللغة العربية الصافية فقط.

2. الفحص المنطقي والصحة الواقعية (isValid):
   - هل الإجابة صحيحة واقعياً ومنطقياً وتنتمي فعلاً للمطلوب في السؤال؟
   - إذا كانت الإجابة خاطئة تماماً أو فارغة أو لا علاقة لها بالسؤال:
     اجعل isValid = false، و isDuplicated = false، و roundMeters = 0، و tier = "failed"، والتعليق يوضح الخطأ باختصار شديد بدون إيموجي.

3. فحص التكرار اللفظي والدلالي (isDuplicated):
   - إذا كان isExactDuplicate = true، أو كتب متسابقان نفس الإجابة بمعناها (مثال: فستق وبستاشيو، أو مرسيدس وبنز):
     اجعل isDuplicated = true، و roundMeters = 0، و tier = "duplicated"، واجعل التعليق حرفياً: "إجابة مكررة، صفر متر".

4. حساب الندرة والأمتار (roundMeters من 15 إلى 300 متر) للإجابات الصحيحة وغير المكررة:
   - "common" (إجابة شائعة): إجابة بديهية ومعتادة أول ما يخطر ببال الناس. الأمتار: بين 15 و 55 متراً.
   - "uncommon" (إجابة غير شائعة): إجابة صحيحة ومعروفة لكنها ليست الخيار الأول. الأمتار: بين 60 و 120 متراً.
   - "rare" (إجابة نادرة): إجابة ذكية ومميزة وغير متوقعة من الأغلبية. الأمتار: بين 130 و 215 متراً.
   - "legendary" (إجابة نادرة جداً): إجابة عبقرية ونادرة جداً وصحيحة تماماً. الأمتار: بين 220 و 300 متراً.

5. التعليق (comment):
   - جملة عربية صافية قصيرة جداً (من 3 إلى 6 كلمات) بدون أي إيموجي إطلاقاً.

المطلوب إرجاع JSON صالح وحصري بهذا الشكل:
{
  "results": [
    {
      "contestantId": "string",
      "isValid": true,
      "isDuplicated": false,
      "roundMeters": 140,
      "tier": "rare",
      "comment": "إجابة نادرة وذكية جداً"
    }
  ]
}`;

  try {
    const rawResponse = await generateWithGemini(systemPrompt, true);
    const parsed = cleanAndParseJSON(rawResponse);

    if (!parsed || !Array.isArray(parsed.results)) {
      return evaluateOfflineSubmissions(question, submissions, exactDupeIds, previousMeters);
    }

    const aiMap = new Map<string, any>();
    parsed.results.forEach((item: any) => {
      if (item && item.contestantId) {
        aiMap.set(String(item.contestantId), item);
      }
    });

    return submissions.map((sub) => {
      const prev = previousMeters[sub.contestantId] || 0;
      const aiItem = aiMap.get(sub.contestantId);
      const cleanAnswer = stripEmojis(sub.answer || '');

      // Enforce Pre-AI exact duplication override
      if (exactDupeIds.has(sub.contestantId)) {
        return {
          contestantId: sub.contestantId,
          contestantName: sub.contestantName,
          answer: cleanAnswer,
          isValid: true,
          isDuplicated: true,
          roundMeters: 0,
          tier: 'duplicated' as FlyingTier,
          comment: 'إجابة مكررة، صفر متر',
          previousTotalMeters: prev,
          newTotalMeters: prev,
        };
      }

      if (!cleanAnswer.trim()) {
        return {
          contestantId: sub.contestantId,
          contestantName: sub.contestantName,
          answer: 'بدون إجابة',
          isValid: false,
          isDuplicated: false,
          roundMeters: 0,
          tier: 'failed' as FlyingTier,
          comment: 'لم يكتب إجابة، صفر متر',
          previousTotalMeters: prev,
          newTotalMeters: prev,
        };
      }

      if (!aiItem) {
        return evaluateOfflineSubmissions(question, [sub], exactDupeIds, previousMeters)[0];
      }

      const isDuplicated = Boolean(aiItem.isDuplicated);
      const isValid = Boolean(aiItem.isValid) && !isDuplicated;

      let roundMeters = 0;
      let tier: FlyingTier = 'failed';

      if (isDuplicated) {
        roundMeters = 0;
        tier = 'duplicated';
      } else if (!isValid) {
        roundMeters = 0;
        tier = 'failed';
      } else {
        const rawMeters = Number(aiItem.roundMeters) || 35;
        roundMeters = Math.max(15, Math.min(300, Math.round(rawMeters)));

        if (roundMeters >= 220) tier = 'legendary';
        else if (roundMeters >= 130) tier = 'rare';
        else if (roundMeters >= 60) tier = 'uncommon';
        else tier = 'common';
      }

      const rawComment = stripEmojis(String(aiItem.comment || '')).trim();
      const finalComment = isDuplicated
        ? 'إجابة مكررة، صفر متر'
        : rawComment || (roundMeters > 0 ? 'إجابة صحيحة وموفقة' : 'إجابة خاطئة، صفر متر');

      return {
        contestantId: sub.contestantId,
        contestantName: sub.contestantName,
        answer: cleanAnswer,
        isValid,
        isDuplicated,
        roundMeters,
        tier,
        comment: finalComment,
        previousTotalMeters: prev,
        newTotalMeters: prev + roundMeters,
      };
    });
  } catch (err) {
    console.warn('[flyingEngine] Gemini evaluation failed, using fallback:', err);
    return evaluateOfflineSubmissions(question, submissions, exactDupeIds, previousMeters);
  }
}
