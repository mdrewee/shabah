import { generateWithGemini } from '../config/gemini';
import { BrokerItem } from '../pages/games/broker/types';

export interface BrokerEvaluationResult {
  persuasionScore: number; // 1 to 10
  reply: string;
  bidIncrease: number; // in SAR
  newBid: number; // in SAR
  soundFx: 'cash' | 'buzz';
  publicAnnouncement: string;
}

// -------------------------------------------------------------
// 1. Local Zero-Token Guardrails
// -------------------------------------------------------------

const RELIGIOUS_REGEX = /(دين|شريعة|صدقة|لوجه الله|ثواب|بالله|حلف|أقسم|يتيم|مسجد|حرام عليك|تصدق)/i;
const RELIGIOUS_QUIPS = [
  'يخوي ترا لعبة لا تجيب طاري الدين والشريعة هنا!',
  'شايفني جمعية خيرية أنا؟ هنا حراج وسوق بيع وشراء!',
  'اذكر ربك وفكنا من هالكلام ترا لعبة ووناسة!',
  'والله مو مشكلتي، أنا شريطي جاي أشتري مو جاي أتبرع!',
  'ما تمشي علي هالسوالف، عطني مواصفات السلعة بدون دراما!',
];

const PITY_REGEX = /(أبوي مات|أمي|فقير|مسكين|محتاج|علاجي|مريض|ظروفي|أنا طفران|ما عندي فلوس|راتبي طار)/i;
const PITY_QUIPS = [
  'الله يستر عليك بس الحراج ما فيه يمه ارحميني!',
  'وفر دموعك يا الحبيب، هنا بيع وشراء حامي ما فيه عواطف!',
  'أنا شريطي محنّك مو طبيب نفسي يا غالي!',
  'كلنا ظروفنا صعبة، بس داخل الحراج كلنا سواسية!',
  'سوق الخردة يبي له قلب حديد، لا تستعطفني!',
];

const CRAZY_PRICE_REGEX = /(مليون|مليار|مئة الف|مية الف|مئات الالاف|خمسمية الف|ملايين)/i;
const CRAZY_PRICE_QUIPS = [
  'ما تبي كنتاكي بعد؟',
  'شايفني بنك الراجحي فاتح لك فرع؟',
  'لو إنك نادي الهلال كان عطيتك هالمبلغ!',
  'نهاية اسمي بن طلال عشان أرمي الملايين في خردة؟',
  'ما تبي أصرف على أهلك بعد؟',
  'شوقر دادي قدامك تحسبني؟',
  'والله حلوة النكتة 😂 بس ارجع للأرض يا بعدي!',
  'تبي أنقص سومتي على ذا السعر الفضائي؟',
  'شين وقوي عين.. اصحى يا نايم!',
];

const TRIVIAL_PRICE_REGEX = /(ريال|ريالين|نص ريال|هللة|هللات|قروش|كم فلس)/i;
const TRIVIAL_PRICE_QUIPS = [
  'صدقة يعني ولا وشو؟ خردتي أغلى من كذا!',
  'حتى الفقير ما يقبلها! هات سومة تسوى!',
  'يلا بزيدك لوجه الله بس لا تعيد هالسومات المقروطة!',
  'الله يعطينا ويعطيك.. وفرها بجيبك واشتر لك عصير ربيع!',
  'بوس يدي 🫳🏻 وأعطيك إياها!',
  'لا ما راح تفوز بهالريال، كبّر راسك وسوم زي الناس!',
];

function checkLocalGuardrails(pitch: string): { matches: boolean; quip: string } | null {
  const clean = pitch.trim();

  if (RELIGIOUS_REGEX.test(clean)) {
    const quip = RELIGIOUS_QUIPS[Math.floor(Math.random() * RELIGIOUS_QUIPS.length)];
    return { matches: true, quip };
  }

  if (PITY_REGEX.test(clean)) {
    const quip = PITY_QUIPS[Math.floor(Math.random() * PITY_QUIPS.length)];
    return { matches: true, quip };
  }

  if (CRAZY_PRICE_REGEX.test(clean)) {
    const quip = CRAZY_PRICE_QUIPS[Math.floor(Math.random() * CRAZY_PRICE_QUIPS.length)];
    return { matches: true, quip };
  }

  if (TRIVIAL_PRICE_REGEX.test(clean)) {
    const quip = TRIVIAL_PRICE_QUIPS[Math.floor(Math.random() * TRIVIAL_PRICE_QUIPS.length)];
    return { matches: true, quip };
  }

  return null;
}

// -------------------------------------------------------------
// 2. Deterministic Server-Side Bid Increment Calculation
// -------------------------------------------------------------

function calculateIncrement(score: number, isFirstBid: boolean): number {
  if (score < 4) {
    return 0;
  }

  if (score >= 4 && score <= 6) {
    // Moderate increment: +150 to +350
    const steps = [150, 200, 250, 300, 350];
    const base = steps[Math.floor(Math.random() * steps.length)];
    return isFirstBid ? base + 100 : base;
  }

  // Massive jump: +500 to +1,200
  const jumps = [500, 600, 750, 850, 1000, 1200];
  const jump = jumps[Math.floor(Math.random() * jumps.length)];
  return isFirstBid ? Math.max(jump, 600) : jump;
}

// -------------------------------------------------------------
// 3. Fallback Engine (when offline or network blip occurs)
// -------------------------------------------------------------

function generateOfflineBrokerResponse(
  item: BrokerItem,
  pitch: string,
  currentBid: number,
  isFirstBid: boolean
): BrokerEvaluationResult {
  const len = pitch.trim().length;

  let score = 5;
  if (len < 6) score = 2;
  else if (len > 35) score = 8;
  else score = Math.floor(Math.random() * 4) + 4; // 4 to 7

  if (isFirstBid) {
    score = Math.max(score, 6);
  }

  const inc = calculateIncrement(score, isFirstBid);
  const soundFx: 'cash' | 'buzz' = inc > 0 ? 'cash' : 'buzz';

  let reply = '';
  let announcement = '';

  if (inc === 0) {
    reply = `سمعت كلامك وما جاز لي أبداً.. السلعة فيها ${item.fatalFlaw} وما أقنعتني أفك جيبي!`;
    announcement = 'الشريطي يرفض سومة أحدهم بقوة!';
  } else if (inc < 500) {
    reply = `أعجبني كلامك شوي.. عشان كذا بزودك سومة خفيفة قدرها ${inc} ريال!`;
    announcement = 'سومة طيبة دخلت الحراج!';
  } else {
    reply = `يا ساتر عليك يا الذيب! عذرك أسطوري وأقنعتني.. خذ لك زيادة دسمة ${inc} ريال!`;
    announcement = 'سومة دسمة جديدة زلزلت الحراج!';
  }

  return {
    persuasionScore: score,
    reply,
    bidIncrease: inc,
    newBid: currentBid + inc,
    soundFx,
    publicAnnouncement: announcement,
  };
}

// -------------------------------------------------------------
// 4. Main Broker Engine (Guardrails + Gemini Flash + Sync)
// -------------------------------------------------------------

export async function evaluateBrokerPitch(params: {
  item: BrokerItem;
  pitch: string;
  currentBid: number;
  isFirstBid: boolean;
  playerName: string;
}): Promise<BrokerEvaluationResult> {
  const { item, pitch, currentBid, isFirstBid } = params;

  // Step 1: Check Local Zero-Token Guardrails
  const guardrailMatch = checkLocalGuardrails(pitch);
  if (guardrailMatch) {
    return {
      persuasionScore: 1,
      reply: guardrailMatch.quip,
      bidIncrease: 0,
      newBid: currentBid,
      soundFx: 'buzz',
      publicAnnouncement: 'الشريطي قصف جبهة أحدهم بسبب سومة مخالفة!',
    };
  }

  // Step 2: System Prompt for Gemini Flash
  const systemPrompt = `
أنت "الشبح الشريطي" (The Shabah Broker) في لعبة حراج جماعية سعودية شهيرة وساخرة.
أنت شريطي محنّك، ذكي، ساخر، بخيل بطبعه، لكنك تقدّر الذكاء والفكاهة وسرعة البديهة.
السلعة المعروضة للبيع حالياً:
- اسم السلعة: "${item.name}"
- العيب القاتل في السلعة: "${item.fatalFlaw}"
- فتحة السوم الأصلية: ${item.openingBid} ريال.

قواعد التحكيم الصارمة:
1. "فتحة السوم": إذا كانت هذه السومة الأولى للمتسابق (${isFirstBid ? 'نعم أول سومة' : 'لا ليست الأولى'})، كن سهلاً ومتحمساً وأعطه تقييماً مشجعاً لبدء المزاد (persuasion_score بين 6 و 9).
2. "الفكاهة والإقناع": إذا كان كلام المتسابق مضحكاً جداً، ذكياً، أو لف على العيب القاتل بحيلة طريفة، كافئه بتقييم عالي جداً (8 إلى 10).
3. "البرود والتفاهة": إذا كتب كلاماً عادياً أو طلب الزيادة بدون أي سبب، ارفض أو أعطه تقييماً ضعيفاً (1 إلى 3).
4. الرد (reply): يجب أن يكون بالعامية السعودية الحجازية أو النجدية الساخرة الودودة، بجملة إلى جملتين كحد أقصى (لا تتفلسف).

يجب أن يكون الناتج حصراً بصيغة JSON التالية:
{
  "persuasion_score": number, // من 1 إلى 10
  "reply": string, // رد الشريطي الساخر بالعامية
  "sound_fx": "cash" | "buzz" // "cash" إذا كان التقييم >= 4، "buzz" إذا كان مرفوض
}
`.trim();

  const userPrompt = `
كلام المتسابق المساوم للشريطي:
"${pitch}"
السومة الحالية الواصل إليها: ${currentBid} ريال.
احكم عليه فوراً بصيغة JSON.
`.trim();

  try {
    const rawResponse = await generateWithGemini(userPrompt, {
      systemPrompt,
      temperature: 0.85,
      maxOutputTokens: 350,
      jsonMode: true,
    });

    if (rawResponse) {
      let parsed: any = null;
      try {
        parsed = JSON.parse(rawResponse);
      } catch {
        const cleaned = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      if (parsed && typeof parsed.persuasion_score === 'number') {
        const score = Math.max(1, Math.min(10, parsed.persuasion_score));
        const inc = calculateIncrement(score, isFirstBid);
        const soundFx: 'cash' | 'buzz' = inc > 0 ? 'cash' : 'buzz';

        let announcement = 'الشريطي يرفض سومة أحدهم بقوة!';
        if (inc >= 500) {
          announcement = 'سومة دسمة جديدة زلزلت الحراج!';
        } else if (inc > 0) {
          announcement = 'سومة طيبة دخلت في الحراج!';
        }

        return {
          persuasionScore: score,
          reply: parsed.reply || (inc > 0 ? `تم، رفعت لك السوم +${inc} ريال!` : 'ما أقنعتني، السومة مرفوضة!'),
          bidIncrease: inc,
          newBid: currentBid + inc,
          soundFx,
          publicAnnouncement: announcement,
        };
      }
    }
  } catch (err) {
    console.warn('[BrokerEngine] Gemini call failed, using heuristic engine:', err);
  }

  // Step 3: Reliable heuristic fallback
  return generateOfflineBrokerResponse(item, pitch, currentBid, isFirstBid);
}
