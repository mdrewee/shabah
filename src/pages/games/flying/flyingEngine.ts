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
export function cleanAndParseJSON<T = any>(rawText: string): T {
  let cleaned = rawText.trim();
  // إزالة وسوم markdown للـ json إن وجدت
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '');

  // استخراج المحتوى بين أول { وآخر }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned) as T;
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
        comment: 'احترقت الإجابة بالتكرار',
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

    let earned = 240;
    let tier: FlyingTier = 'uncommon';
    let comment = 'إجابة مسجلة، استمر بالتحليق';

    if (clean.length > 7) {
      earned = 500;
      tier = 'rare';
      comment = 'إجابة نادرة ومميزة';
    } else if (clean.length <= 3) {
      earned = 90;
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
 * enforcing strict semantic validation, zero emojis, and doubled altitude tiers.
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

  const SYSTEM_INSTRUCTION = `أنت "حكم الشبح الطائر"؛ قاضٍ صارم جداً، دقيق لغوياً وواقعياً، ولا يقبل المجاملة أو الإجابات التقريبية.
مهمتك تقييم إجابات المتسابقين على السؤال المطروح وتحديد الارتفاع بالأمتار وفق قواعد ندرة صارمة.

السؤال المطروح: [ ${question.title} ]
تصنيف السؤال: ${question.category}

قواعد الفحص والصرامة (CRITICAL):
1. التحقق من الصحة (isValid):
   - الإجابة يجب أن تكون شيئاً حقيقياً، موجوداً وواقعياً، ومطابقاً لطلب السؤال بنسبة 100%.
   - إذا كانت الإجابة استهبالاً، أو خيالية، أو عامة بشكل مبالغ فيه (مثل كتابة "فاكهة حمراء" بدل اسم فاكهة)، أو لا تنتمي للتصنيف:
     اجعل isValid = false، و roundMeters = 0، و tier = "failed"، والتعليق يوضح الخطأ باقتضاب (أقل من 5 كلمات بدون إيموجي).

2. فحص التكرار (isDuplicated):
   - إذا كتب أكثر من متسابق نفس الإجابة أو نفس المعنى (مثل "طماطم" و"طماط" أو "بطيخ" و"جح"):
     اجعل isDuplicated = true و roundMeters = 0 لجميع من كررها مع تعليق "احترقت الإجابة بالتكرار".

3. سلم الأمتار الصارم (المقياس المضاعف: 0 إلى 1000 متر):
   - إجابة شائعة جداً (أول ما يخطر ببال 80% من الناس، مثل فانيليا/شوكولاتة/تفاح):
     tier = "common", roundMeters بين 60 و 120 متراً فقط.
   - إجابة متوسطة (معروفة لكن ليست البديهية الأولى):
     tier = "uncommon", roundMeters بين 180 و 320 متراً.
   - إجابة نادرة ومميزة (صحيحة 100% ونادراً ما يتذكرها العامة):
     tier = "rare", roundMeters بين 400 و 650 متراً.
   - إجابة أسطورية استثنائية (صحيحة وعبقرية وغير متوقعة إطلاقاً):
     tier = "legendary", roundMeters بين 750 و 1000 متراً.

4. صيغة الرد:
   - أرجع JSON صالحاً فقط بدون أي مقدمات أو شروحات خارج الكائن.`;

  const USER_PROMPT = `قيّم هذه الإجابات بدقة وصرامة تامة:
${JSON.stringify(
  submissions.map((s) => ({
    contestantId: s.contestantId,
    answer: stripEmojis(s.answer || ''),
  }))
)}

الهيكل المطلوب حصراً:
{
  "results": [
    {
      "contestantId": "string",
      "answer": "string",
      "isValid": boolean,
      "isDuplicated": boolean,
      "roundMeters": number,
      "tier": "common" | "uncommon" | "rare" | "legendary" | "failed" | "duplicated",
      "comment": "تعليق صارم ومقتضب أقل من 5 كلمات بدون إيموجي"
    }
  ]
}`;

  try {
    const rawResponse = await callGeminiWithFallback(USER_PROMPT, {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.1,
      jsonMode: true,
    });

    const parsed = cleanAndParseJSON<{ results: any[] }>(rawResponse);

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
          comment: 'احترقت الإجابة بالتكرار',
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

      // If AI didn't include this contestant, award safe fallback
      if (!aiItem) {
        const fallbackEarned = cleanAnswer.length > 6 ? 420 : 200;
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
      const isValid = !isDuplicated && isAIValid;

      let roundMeters = 0;
      let tier: FlyingTier = 'failed';

      if (isDuplicated) {
        roundMeters = 0;
        tier = 'duplicated';
      } else if (!isValid) {
        roundMeters = 0;
        tier = 'failed';
      } else {
        const parsedMeters = Number(aiItem.roundMeters);
        const rawMeters =
          !isNaN(parsedMeters) && parsedMeters > 0
            ? parsedMeters
            : cleanAnswer.length > 6
            ? 450
            : 200;

        roundMeters = Math.max(60, Math.min(1000, Math.round(rawMeters)));

        if (roundMeters >= 750) tier = 'legendary';
        else if (roundMeters >= 400) tier = 'rare';
        else if (roundMeters >= 180) tier = 'uncommon';
        else tier = 'common';
      }

      const rawComment = stripEmojis(String(aiItem.comment || '')).trim();
      const finalComment = isDuplicated
        ? 'احترقت الإجابة بالتكرار'
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
      '[FLYING_ENGINE] Gemini unavailable, applying safe heuristic fallback:',
      err
    );
    return evaluateOfflineSubmissions(submissions, exactDupeIds, previousMeters);
  }
}
