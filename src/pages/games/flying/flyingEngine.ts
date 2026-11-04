import { FlyingQuestion } from './flyingQuestions';
import { FlyingSubmission, FlyingContestantResult, FlyingTier } from './types';
import { callGeminiWithFallback } from '../../../services/geminiClient';

/**
 * Remove any emojis or pictographs from strings
 */
export function stripEmojis(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .trim();
}

/**
 * Normalize Arabic text for duplicate comparison
 */
function normalizeArabic(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // Remove tashkeel
    .replace(/\s+/g, ' ');
}

/**
 * Extract JSON safely from AI output even if wrapped in markdown
 */
function cleanAndParseJSON(rawText: string): any {
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
 * Offline Heuristic Fallback in case of total network outage or API downtime
 * Guarantees every non-empty answer gets altitude and the game never freezes.
 */
function evaluateOfflineSubmissions(
  submissions: FlyingSubmission[],
  exactDupeIds: Set<string>,
  previousMeters: Record<string, number>
): FlyingContestantResult[] {
  return submissions.map((sub) => {
    const prev = previousMeters[sub.contestantId] || 0;
    const clean = stripEmojis(sub.answer || '').trim();

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

    if (!clean || clean.length === 0) {
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

    let earned = 260;
    let tier: FlyingTier = 'uncommon';
    let comment = 'إجابة مسجلة، استمر بالتحليق';

    if (clean.length > 7) {
      earned = 550;
      tier = 'rare';
      comment = 'إجابة نادرة ومميزة';
    } else if (clean.length <= 3) {
      earned = 100;
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
 * Evaluates all submissions via Multi-Model Gemini Fallback Cascade,
 * enforcing duplicate zeroing and doubled rarity tiers without emojis.
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
    const rawAnswer = stripEmojis(s.answer || '').trim();
    if (rawAnswer) {
      const norm = normalizeArabic(rawAnswer);
      if (norm) {
        const list = normMap.get(norm) || [];
        list.push(s.contestantId);
        normMap.set(norm, list);
      }
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
    answer: stripEmojis((s.answer || '').trim()),
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
   - إذا كتب اللاعب أي كلمة حقيقية وصحيحة تنتمي للسؤال، اعتبرها صحيحة فوراً isValid = true.
   - إذا كانت الإجابة فارغة تماماً أو لا تمت للموضوع بصلة إطلاقاً:
     اجعل isValid = false، و isDuplicated = false، و roundMeters = 0، و tier = "failed"، والتعليق: "إجابة خاطئة، صفر متر".

3. فحص التكرار اللفظي والدلالي (isDuplicated):
   - إذا كان isExactDuplicate = true، أو كتب متسابقان نفس الإجابة بمعناها (مثال: فستق وبستاشيو، أو مرسيدس وبنز):
     اجعل isDuplicated = true، و roundMeters = 0، و tier = "duplicated"، والتعليق حرفياً: "إجابة مكررة، صفر متر".

4. حساب الندرة والأمتار المضاعفة (roundMeters من 60 إلى 1000 متر) للإجابات الصحيحة وغير المكررة:
   - "common" (إجابة شائعة وبديهية): إجابة متوقعة وأول ما يخطر ببال الناس. الأمتار: بين 60 و 140 متراً.
   - "uncommon" (إجابة متوسطة): إجابة صحيحة ومعروفة لكنها ليست الخيار الأول. الأمتار: بين 180 و 350 متراً.
   - "rare" (إجابة نادرة ومميزة): إجابة ذكية ومميزة وغير متوقعة من الأغلبية. الأمتار: بين 400 و 650 متراً.
   - "legendary" (إجابة أسطورية خارقة): إجابة عبقرية ونادرة جداً وصحيحة تماماً ومبهرة. الأمتار: بين 700 و 1000 متر للجولة الواحدة.

5. التعليق (comment):
   - جملة عربية صافية قصيرة جداً (من 3 إلى 6 كلمات) بدون أي إيموجي إطلاقاً.

المطلوب إرجاع JSON صالح وحصري بهذا الشكل:
{
  "results": [
    {
      "contestantId": "string",
      "isValid": true,
      "isDuplicated": false,
      "roundMeters": 520,
      "tier": "rare",
      "comment": "إجابة نادرة وذكية جدا"
    }
  ]
}`;

  try {
    const rawResponse = await callGeminiWithFallback(
      `قيم إجابات المتسابقين للسؤال: "${question.title}" وأرجع الـ JSON المطلوب.`,
      {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        jsonMode: true,
      }
    );

    const parsed = cleanAndParseJSON(rawResponse);

    if (!parsed || !Array.isArray(parsed.results)) {
      console.warn('[flyingEngine] Invalid AI JSON response, applying safe offline fallback');
      return evaluateOfflineSubmissions(submissions, exactDupeIds, previousMeters);
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
      const cleanAnswer = stripEmojis(sub.answer || '').trim();

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

      // Check empty answer
      if (!cleanAnswer || cleanAnswer.length === 0) {
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

      // If AI didn't include this contestant, award safe default
      if (!aiItem) {
        const fallbackEarned = cleanAnswer.length > 6 ? 500 : 250;
        return {
          contestantId: sub.contestantId,
          contestantName: sub.contestantName,
          answer: cleanAnswer,
          isValid: true,
          isDuplicated: false,
          roundMeters: fallbackEarned,
          tier: (cleanAnswer.length > 6 ? 'rare' : 'uncommon') as FlyingTier,
          comment: 'إجابة مسجلة، استمر بالتحليق',
          previousTotalMeters: prev,
          newTotalMeters: prev + fallbackEarned,
        };
      }

      const isDuplicated = Boolean(aiItem.isDuplicated);
      const isAIValid = Boolean(aiItem.isValid);
      // Safety rule: if player typed a genuine non-empty answer and wasn't marked duplicated, default isValid to true
      const isValid = !isDuplicated && (isAIValid || cleanAnswer.length >= 2);

      let roundMeters = 0;
      let tier: FlyingTier = 'failed';

      if (isDuplicated) {
        roundMeters = 0;
        tier = 'duplicated';
      } else if (!isValid) {
        roundMeters = 0;
        tier = 'failed';
      } else {
        // Safe extraction of meters with doubled scale (60 to 1000m)
        const parsedMeters = Number(aiItem.roundMeters);
        const rawMeters =
          !isNaN(parsedMeters) && parsedMeters > 0
            ? parsedMeters
            : cleanAnswer.length > 6
            ? 500
            : 250;

        roundMeters = Math.max(60, Math.min(1000, Math.round(rawMeters)));

        if (roundMeters >= 700) tier = 'legendary';
        else if (roundMeters >= 400) tier = 'rare';
        else if (roundMeters >= 180) tier = 'uncommon';
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
    console.error(
      '[FLYING_ENGINE] Gemini totally unavailable, applying safe heuristic fallback:',
      err
    );
    return evaluateOfflineSubmissions(submissions, exactDupeIds, previousMeters);
  }
}
