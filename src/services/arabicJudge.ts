import { generateWithGemini } from '../config/gemini';
import {
  ContestantRoundSubmission,
  ContestantEvaluation,
  ContestantAnswer,
} from '../pages/games/arabic/types';
import { wordStartsWithLetter, normalizeArabicLetter } from '../data/arabicCategories';

// Strict zero-emoji cleaner
function stripEmojis(text: string): string {
  return (text || '').replace(
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/gu,
    ''
  ).trim();
}

/**
 * Normalizes an answer for duplicate detection across contestants.
 */
function normalizeAnswerForComparison(ans: string): string {
  if (!ans) return '';
  let clean = ans.trim();
  // Strip 'ال' prefix if it exists to compare root word
  if (clean.startsWith('ال') && clean.length > 2) {
    clean = clean.slice(2).trim();
  }
  return clean
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/\s+/g, ' ');
}

// Local witty quips for local fallback or supplementary roasts
const LOCAL_WRONG_QUIPS = [
  'شطحة من كوكب زحل! لا الحرف صح ولا الفئة تدري عنك.',
  'الكلمة ما تبدأ بالحرف المطلوب، وين مسافر الله يحفظك؟',
  'ما تمشي علي هالتصريفة، حاول في الجولة الجاية.',
  'إجابة فضائية ما مرت على المعاجم العربية.',
  'الظاهر الكيبورد كتب لحاله!',
  'فئة في وادي وإجابتك في وادي ثاني خالص.'
];

const LOCAL_TYPO_QUIPS = [
  'مشيتها لك عشان الحرف قريب، بس المرة الجاية ما فيه تساهل!',
  'فيها شوية أخطاء إملائية بس روح الشبح الفصيح قبلتها.',
  'إملاء مشي حالك، بس صحيحة كمعنى.'
];

const LOCAL_VALID_QUIPS = [
  'إجابة فصيحة في قلب الهدف!',
  'جبتها على الجرح، ممتازة وسريعة.',
  'فنان، إجابة ولا أروع.',
  'حاضرة في البال وثابتة في المعجم.',
  'عاش الفصيح! نقطة مستحقة بجدارة.'
];

interface RawJudgeResult {
  categoryIndex: number;
  isValid: boolean;
  comment: string;
}

interface RawContestantJudge {
  contestantId: string;
  results: RawJudgeResult[];
}

/**
 * Evaluates all submissions in a single batch via Gemini Flash,
 * with seamless local fallback if offline or API limits hit.
 */
export async function evaluateBatchAnswers(
  currentLetter: string,
  categories: string[],
  submissions: Record<string, ContestantRoundSubmission>
): Promise<Record<string, ContestantEvaluation>> {
  const submissionList = Object.values(submissions);
  if (submissionList.length === 0) return {};

  const contestantsPayload = submissionList.map((s) => ({
    contestantId: s.contestantId,
    contestantName: s.contestantName,
    answers: s.answers || {},
  }));

  const systemPrompt = `أنت "الشبح الفصيح"، لغوي وخبير معاجم لغة عربية فصحى صارم وحكم معتمد يستند إلى أمهات المعاجم (لسان العرب، القاموس المحيط، معجم المعاني الجامع).
مهمتك تقييم إجابات المتسابقين دفعة واحدة بناء على المعايير الصارمة التالية:
1. التحقق الصارم من الحرف المطلوب: الكلمة يجب أن تبدأ بالحرف المطلوب تماماً (بعد تجريد "ال" التعريف). إذا لم تبدأ بالحرف فاعتبرها غير صحيحة فوراً (isValid: false).
2. رفض العامية والشطحات: ممنوع منعاً باتاً قبول الكلمات العامية أو الهجينة أو الألفاظ الدارجة غير الفصيحة. إذا كانت الكلمة عامية فـ (isValid: false) مع تعليق "لفظ عامي غير معجمي".
3. التحقق المعجمي من الفئة: الكلمة يجب أن تنتمي للفئة المحددة بدقة علمية ومعجمية.
4. التبرير: اكتب مبرراً لغوياً موجزاً ودقيقاً ومحكماً في جملة واحدة واضحة تشرح سبب القبول أو الرفض.
5. منع الإيموجي: ممنوع منعاً باتاً استخدام أي إيموجي نهائياً في المبررات أو التعليقات.

يجب إرجاع النتيجة بصيغة JSON فقط بهذا الهيكل:
{
  "evaluations": [
    {
      "contestantId": "id_here",
      "results": [
        {
          "categoryIndex": 0,
          "isValid": true,
          "comment": "مبرر لغوي موجز هنا"
        }
      ]
    }
  ]
}`;

  const userPrompt = JSON.stringify({
    letter: currentLetter,
    categories,
    submissions: contestantsPayload,
  });

  let rawMap: Record<string, Record<number, { isValid: boolean; comment: string }>> = {};

  try {
    const responseText = await generateWithGemini(userPrompt, {
      systemPrompt,
      temperature: 0.2,
      jsonMode: true,
      maxOutputTokens: 2000,
    });

    if (responseText) {
      const parsed = JSON.parse(responseText);
      const evals: RawContestantJudge[] = parsed.evaluations || parsed;
      if (Array.isArray(evals)) {
        evals.forEach((c) => {
          rawMap[c.contestantId] = {};
          if (Array.isArray(c.results)) {
            c.results.forEach((r) => {
              rawMap[c.contestantId][r.categoryIndex] = {
                isValid: Boolean(r.isValid),
                comment: stripEmojis(r.comment || ''),
              };
            });
          }
        });
      }
    }
  } catch (err) {
    console.warn('[ArabicJudge] Gemini batch evaluation fallback engaged:', err);
  }

  // Pre-process submissions & apply local fallback for any missing evaluations
  const evaluations: Record<string, ContestantEvaluation> = {};

  // Step 1: Collect initial answers with validity
  const processedAnswersByContestant: Record<string, ContestantAnswer[]> = {};

  for (const sub of submissionList) {
    const contestantAnswers: ContestantAnswer[] = [];

    for (let catIdx = 0; catIdx < categories.length; catIdx++) {
      const categoryName = categories[catIdx];
      const rawAns = (sub.answers[catIdx] || '').trim();

      let isValid = false;
      let comment = '';

      if (!rawAns) {
        isValid = false;
        comment = 'ما كتبت شيء! راحت عليك النقطة.';
      } else {
        const startsWith = wordStartsWithLetter(rawAns, currentLetter);
        if (!startsWith) {
          isValid = false;
          comment = `الكلمة ما تبدأ بحرف "${currentLetter}"! شطحة واضحة.`;
        } else if (rawMap[sub.contestantId]?.[catIdx]) {
          const aiRes = rawMap[sub.contestantId][catIdx];
          isValid = aiRes.isValid;
          comment = aiRes.comment || (isValid ? 'إجابة صحيحة!' : 'غير مطابقة للفئة.');
        } else {
          // Heuristic Fallback
          isValid = rawAns.length >= 2;
          const quipList = isValid ? LOCAL_VALID_QUIPS : LOCAL_WRONG_QUIPS;
          comment = quipList[Math.floor(Math.random() * quipList.length)];
        }
      }

      contestantAnswers.push({
        categoryIndex: catIdx,
        categoryName,
        rawAnswer: rawAns,
        isValid,
        isUnique: false, // will calculate next
        points: 0,
        comment: stripEmojis(comment),
      });
    }

    processedAnswersByContestant[sub.contestantId] = contestantAnswers;
  }

  // Step 2: Uniqueness check across contestants for each category
  for (let catIdx = 0; catIdx < categories.length; catIdx++) {
    const validGroup: Array<{ contestantId: string; normalized: string; answerObj: ContestantAnswer }> = [];

    for (const sub of submissionList) {
      const ansObj = processedAnswersByContestant[sub.contestantId][catIdx];
      if (ansObj.isValid && ansObj.rawAnswer) {
        validGroup.push({
          contestantId: sub.contestantId,
          normalized: normalizeAnswerForComparison(ansObj.rawAnswer),
          answerObj: ansObj,
        });
      }
    }

    // Count occurrences of each normalized answer
    const answerCounts: Record<string, number> = {};
    validGroup.forEach((item) => {
      answerCounts[item.normalized] = (answerCounts[item.normalized] || 0) + 1;
    });

    validGroup.forEach((item) => {
      const isUnique = answerCounts[item.normalized] === 1;
      item.answerObj.isUnique = isUnique;
      item.answerObj.points = isUnique ? 10 : 5;
      if (!isUnique && !item.answerObj.comment.includes('مكررة')) {
        item.answerObj.comment = `${item.answerObj.comment} (إجابة مكررة +٥)`.trim();
      }
    });
  }

  // Step 3: Speed bonus calculation
  // Fastest contestant to finish with at least 3 correct answers gets +5
  let fastestContestantId: string | null = null;
  let minDuration = Infinity;

  for (const sub of submissionList) {
    if (sub.finishedAt && sub.submissionDurationMs && sub.submissionDurationMs > 0) {
      if (sub.submissionDurationMs < minDuration) {
        const validCount = processedAnswersByContestant[sub.contestantId].filter(
          (a) => a.isValid
        ).length;
        if (validCount >= 3) {
          minDuration = sub.submissionDurationMs;
          fastestContestantId = sub.contestantId;
        }
      }
    }
  }

  // Step 4: Assemble total points
  for (const sub of submissionList) {
    const answers = processedAnswersByContestant[sub.contestantId];
    const roundPoints = answers.reduce((sum, a) => sum + (a.points || 0), 0);
    const speedBonus = sub.contestantId === fastestContestantId ? 5 : 0;

    evaluations[sub.contestantId] = {
      contestantId: sub.contestantId,
      contestantName: sub.contestantName,
      answers,
      roundPoints,
      speedBonus,
      totalRoundPoints: roundPoints + speedBonus,
    };
  }

  return evaluations;
}
