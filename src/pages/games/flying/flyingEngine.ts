import { generateWithGemini } from '../../../config/gemini';
import { FlyingQuestion } from './flyingQuestions';
import { FlyingSubmission, FlyingContestantResult, FlyingTier } from './types';

/**
 * Normalizes Arabic text for strict equivalence and duplicate matching
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  let clean = text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove tashkeel / harakat
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u0610-\u061A]/g, '')
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, ' ') // Strip special punctuation
    .replace(/\s+/g, ' ')
    .trim();

  // Strip leading "ال" definition if remaining token is significant
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
  question: FlyingQuestion,
  submissions: FlyingSubmission[],
  exactDupeIds: Set<string>,
  previousMeters: Record<string, number>
): FlyingContestantResult[] {
  return submissions.map((sub) => {
    const prev = previousMeters[sub.contestantId] || 0;
    const clean = (sub.answer || '').trim();

    // Check exact duplication
    if (exactDupeIds.has(sub.contestantId)) {
      return {
        contestantId: sub.contestantId,
        contestantName: sub.contestantName,
        answer: sub.answer,
        isValid: true,
        isDuplicated: true,
        roundMeters: 0,
        tier: 'duplicated' as FlyingTier,
        comment: 'احترقت الإجابة لأنكم كررتوها مع بعض! 💥',
        previousTotalMeters: prev,
        newTotalMeters: prev,
      };
    }

    if (!clean || clean.length < 2) {
      return {
        contestantId: sub.contestantId,
        contestantName: sub.contestantName,
        answer: sub.answer || '(فارغ)',
        isValid: false,
        isDuplicated: false,
        roundMeters: 0,
        tier: 'failed' as FlyingTier,
        comment: 'إجابة فاضية، ما تحركت من مكانك!',
        previousTotalMeters: prev,
        newTotalMeters: prev,
      };
    }

    // Heuristic altitude based on uniqueness and specificity
    let earned = 90;
    let tier: FlyingTier = 'uncommon';
    let comment = 'إجابة جيدة طيرتك فوق الغيوم!';

    if (clean.length > 8) {
      earned = 175;
      tier = 'rare';
      comment = 'إجابة ذكية ونادرة رفعتك عالي!';
    } else if (clean.length <= 4) {
      earned = 35;
      tier = 'common';
      comment = 'إجابة شائعة، طيرانك كان منخفض.';
    }

    return {
      contestantId: sub.contestantId,
      contestantName: sub.contestantName,
      answer: sub.answer,
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
 * Evaluates all submissions in a single atomic batch, enforcing duplicate burn and rarity tiers.
 */
export async function evaluateFlyingAnswers(
  question: FlyingQuestion,
  submissions: FlyingSubmission[],
  previousMeters: Record<string, number> = {}
): Promise<FlyingContestantResult[]> {
  if (!submissions || submissions.length === 0) return [];

  // Step 1: Pre-AI Strict Exact & Normalized Duplication Detection
  const normMap = new Map<string, string[]>(); // norm -> [contestantId]
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
    answer: s.answer.trim(),
    isExactDuplicate: exactDupeIds.has(s.contestantId),
  }));

  const systemPrompt = `أنت الحكم الذكي والصارم في لعبة "الشبح الطائر" (سباق الأجوبة النادرة والارتفاع).
السؤال المطروح للمتسابقين: [ ${question.title} ]
تصنيف السؤال: ${question.category}

إجابات المتسابقين المطلوب تقييمها:
${JSON.stringify(payloadForAI, null, 2)}

القواعد الصارمة والواضحة للتقييم:
1. الفحص المنطقي والصحة الواقعية (isValid):
   - هل الإجابة صحيحة واقعياً ومنطقياً وتنتمي فعلاً للمطلوب في السؤال؟
   - إذا كانت الإجابة خاطئة تماماً، أو تأليفاً، أو استهبالاً لا علاقة له بالسؤال:
     اجعل isValid = false، و isDuplicated = false، و roundMeters = 0، و tier = "failed"، والتعليق يوضح الخطأ بسخرية خفيفة.

2. فحص التكرار اللفظي والدلالي (isDuplicated):
   - أي متسابق تم تعليمه كـ isExactDuplicate = true، أو كتب متسابقان نفس الإجابة بدلالات مختلفة (مثال: "فستق" و "بستاشيو" أو "بنز" و "مرسيدس" أو "ليمون" و "حامض"):
     اجعل isDuplicated = true، و roundMeters = 0، و tier = "duplicated"، والتعليق: "احترقت الإجابة لأنكم كررتوها مع بعض! 💥".

3. حساب الندرة والأمتار (roundMeters من 10 إلى 300 متر) للإجابات الصحيحة وغير المكررة:
   - "common" (شائع): إجابة بديهية وسطحية أول ما يخطر ببال عامة الناس (مثل: فانيليا، شوكولاتة، تفاح، تويوتا، ملعقة).
     الأمتار: بين 15 و 45 متراً.
   - "uncommon" (غير شائع): إجابة صحيحة ومعروفة لكنها ليست الخيار الأول الأكثر شيوعاً.
     الأمتار: بين 55 و 110 متراً.
   - "rare" (نادر): إجابة ذكية ومميزة وجميلة وغير متوقعة من الأغلبية.
     الأمتار: بين 125 و 210 متراً.
   - "legendary" (أسطوري 🔥): إجابة عبقرية ونادرة جداً وصحيحة 100% قلّما تخطر على بال أحد وتنم عن ثقافة عالية.
     الأمتار: بين 220 و 300 متراً.

4. التعليق الشبح (comment):
   - تعليق شبحي حماسي وخفيف دم وسعودي/خليجي، مختصر جداً (أقل من 6 كلمات) يفسر طيران الشبح أو سقوطه.

المطلوب إرجاع JSON صالح وحصري بهذا الشكل:
{
  "results": [
    {
      "contestantId": "معرف المتسابق",
      "isValid": true,
      "isDuplicated": false,
      "roundMeters": 185,
      "tier": "rare",
      "comment": "نكهة ذويقة ونادرة، طرت فوق الغيوم!"
    }
  ]
}`;

  try {
    const rawResponse = await generateWithGemini(
      `قيّم هذه الإجابات لسؤال "${question.title}" وأرجع JSON فوراً.`,
      {
        systemPrompt,
        temperature: 0.4,
        maxOutputTokens: 2000,
        jsonMode: true,
      }
    );

    if (rawResponse) {
      const parsed = cleanAndParseJSON(rawResponse);
      const resultsArray: any[] = Array.isArray(parsed?.results)
        ? parsed.results
        : Array.isArray(parsed)
        ? parsed
        : [];

      if (resultsArray.length > 0) {
        const resultMap = new Map<string, any>();
        resultsArray.forEach((r) => {
          if (r && r.contestantId) resultMap.set(r.contestantId, r);
        });

        return submissions.map((sub) => {
          const prev = previousMeters[sub.contestantId] || 0;
          const aiRes = resultMap.get(sub.contestantId);

          if (!aiRes) {
            // Fallback for this single contestant if missing from AI output
            const isExact = exactDupeIds.has(sub.contestantId);
            return {
              contestantId: sub.contestantId,
              contestantName: sub.contestantName,
              answer: sub.answer,
              isValid: !isExact,
              isDuplicated: isExact,
              roundMeters: isExact ? 0 : 70,
              tier: (isExact ? 'duplicated' : 'uncommon') as FlyingTier,
              comment: isExact ? 'احترقت الإجابة لتكرارها! 💥' : 'طيران موفق فوق المدينة!',
              previousTotalMeters: prev,
              newTotalMeters: prev + (isExact ? 0 : 70),
            };
          }

          const isDupe = Boolean(aiRes.isDuplicated || exactDupeIds.has(sub.contestantId));
          const isValid = Boolean(aiRes.isValid) && !isDupe;
          const meters = isDupe || !isValid ? 0 : Math.max(0, Math.min(300, Number(aiRes.roundMeters) || 50));
          const tier: FlyingTier = isDupe
            ? 'duplicated'
            : !isValid
            ? 'failed'
            : (aiRes.tier as FlyingTier) || 'uncommon';

          const comment = isDupe
            ? 'احترقت الإجابة لأنكم كررتوها مع بعض! 💥'
            : !isValid
            ? aiRes.comment || 'إجابة شاطحة غير صحيحة ❌'
            : aiRes.comment || `حلقت بارتفاع +${meters}م!`;

          return {
            contestantId: sub.contestantId,
            contestantName: sub.contestantName,
            answer: sub.answer,
            isValid,
            isDuplicated: isDupe,
            roundMeters: meters,
            tier,
            comment,
            previousTotalMeters: prev,
            newTotalMeters: prev + meters,
          };
        });
      }
    }
  } catch (err) {
    console.warn('[FlyingEngine] Gemini evaluation failed, falling back to heuristic engine:', err);
  }

  // Fallback to local heuristic engine
  return evaluateOfflineSubmissions(question, submissions, exactDupeIds, previousMeters);
}
