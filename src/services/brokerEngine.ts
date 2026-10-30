import { generateWithGemini } from '../config/gemini';
import { BrokerItem, ensureBrokerItem } from '../data/brokerItems';
import { toArabicDigits } from '../pages/games/broker/brokerUtils';

export interface BrokerEvaluationResult {
  persuasionScore: number; // 1 to 10
  reply: string;
  bidIncrease: number; // in SAR
  newBid: number; // in SAR
  soundFx: 'cash' | 'buzz';
  publicAnnouncement: string;
}

// -------------------------------------------------------------
// 1. Local Zero-Token Guardrails (STRICT ZERO EMOJI)
// -------------------------------------------------------------

const BRIBERY_REGEX = /(سيارة|شاشة|ايفون|آيفون|هدية|هدايا|هديه|رصيد|ولد فلان|تحويل|احول لك|أحول لك|كاش خارجي|فوقها|فوق البيعة|معاها|اعطيك فوقها|أعطيك فوقها|بعطيك فوقها|بطاقة شحن|عطية|أنا ولد|انا ولد)/i;
const BRIBERY_QUIPS = [
  'تحسبني غشيم تمشي علي حركات العيال؟ أنا جاي اشتري هالسلعة بس، وفر خردتك لك!',
  'داخل حراج ولا مصلحة رشاوي؟ ركّز في السلعة وفكنا من هداياك الوهمية!',
  'ما تمشي علي هالحركات، لا سيارة ولا آيفون.. كلامك في السلعة وعيبها فقط أو وفر سومك!',
  'ولد فلان ولا علان ما تفرق عندي! الشريطي ما يشوف إلا السلعة اللي قدامه، سوم بذكاء ولا توكل!',
  'شايفني أبيع ذمتي بهدية؟ وفر خرابيطك، الزيادة صفر وسومتك مرفوضة!',
];

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
  'والله حلوة النكتة بس ارجع للأرض يا بعدي!',
  'تبي أنقص سومتي على ذا السعر الفضائي؟',
  'شين وقوي عين.. اصحى يا نايم!',
];

const TRIVIAL_PRICE_REGEX = /(ريال|ريالين|نص ريال|هللة|هللات|قروش|كم فلس)/i;
const TRIVIAL_PRICE_QUIPS = [
  'صدقة يعني ولا وشو؟ خردتي أغلى من كذا!',
  'حتى المسكين ما يقبلها! هات سومة تسوى!',
  'يلا بزيدك بس لا تعيد هالسومات المقروطة!',
  'الله يعطينا ويعطيك.. وفرها بجيبك واشتر لك عصير ربيع!',
  'بوس يدي وأعطيك إياها!',
  'لا ما راح تفوز بهالريال، كبّر راسك وسوم زي الناس!',
];

function checkLocalGuardrails(pitch: string): { matches: boolean; quip: string } | null {
  const clean = pitch.trim();

  if (BRIBERY_REGEX.test(clean)) {
    const quip = BRIBERY_QUIPS[Math.floor(Math.random() * BRIBERY_QUIPS.length)];
    return { matches: true, quip };
  }

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
// 2. Increments calculation based on item tiers
// -------------------------------------------------------------

function calculateTierIncrement(
  score: number,
  tiers: BrokerItem['incrementTiers']
): number {
  if (score < 4) {
    return tiers.weak; // 0
  }
  if (score >= 4 && score <= 6) {
    return tiers.medium;
  }
  if (score >= 7 && score <= 8) {
    return tiers.strong;
  }
  return tiers.legendary; // 9-10
}

function stripEmojis(text: string): string {
  return (text || '').replace(
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/gu,
    ''
  ).trim();
}

function extractBidAmountFromPitch(pitch: string, baseline: number): number {
  if (!pitch) return baseline;
  const western = pitch.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const matches = western.match(/\b\d{2,7}\b/g);
  if (matches && matches.length > 0) {
    const lastNum = parseInt(matches[matches.length - 1], 10);
    if (!isNaN(lastNum) && lastNum > 0) return lastNum;
  }
  return baseline;
}

function cleanAndParseJSON(rawText: string): any {
  if (!rawText) return null;
  let cleaned = rawText.trim();
  if (cleaned.includes('```')) {
    cleaned = cleaned.replace(/```(?:json)?([\s\S]*?)```/gi, '$1').trim();
  }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

// -------------------------------------------------------------
// 3. Fallback Heuristic Engine (Offline / Network blip)
// -------------------------------------------------------------

function generateOfflineBrokerResponse(
  rawItem: BrokerItem,
  pitch: string,
  currentBid: number,
  playerName: string,
  isOpening = false
): BrokerEvaluationResult {
  const item = ensureBrokerItem(rawItem);
  const cleanPitch = pitch.trim();
  const len = cleanPitch.length;

  // Catch bribery even in offline mode
  if (BRIBERY_REGEX.test(cleanPitch)) {
    return {
      persuasionScore: 1,
      reply: 'تحسبني غشيم تمشي علي حركات العيال؟ أنا جاي اشتري هالسلعة بس، وفر خردتك لك!',
      bidIncrease: 0,
      newBid: currentBid,
      soundFx: 'buzz',
      publicAnnouncement: `الشريطي قصف جبهة ${playerName} لتقديم وعود خارجية ورشاوى وهمية!`,
    };
  }

  if (isOpening) {
    const isClever = len >= 20;
    const openingPrice = isClever
      ? item.openingBaseline + item.incrementTiers.medium
      : Math.max(10, Math.floor(item.openingBaseline * 0.7));

    return {
      persuasionScore: isClever ? 8 : 4,
      reply: isClever
        ? `أرحبو يا ${playerName}! فتحة باب طيبة وجازت لي بـ ${toArabicDigits(openingPrice)} ريال!`
        : `سومة لك عليها يا ${playerName} بس مشيناها فتحة باب بـ ${toArabicDigits(openingPrice)} ريال!`,
      bidIncrease: openingPrice,
      newBid: openingPrice,
      soundFx: 'cash',
      publicAnnouncement: `افتتح ${playerName} السوم بـ ${toArabicDigits(openingPrice)} ريال!`,
    };
  }

  let score = 5;
  if (len < 8) score = 2;
  else if (len > 35) score = 8;
  else score = Math.floor(Math.random() * 4) + 4; // 4 to 7

  const inc = calculateTierIncrement(score, item.incrementTiers);
  const soundFx: 'cash' | 'buzz' = inc > 0 ? 'cash' : 'buzz';

  let reply = '';
  let announcement = '';

  if (inc === 0) {
    reply = `سمعت كلامك وما جاز لي أبداً.. السلعة فيها "${item.flaw}" وما أقنعتني أفك جيبي!`;
    announcement = `الشريطي صدم ${playerName} ورفض الزيادة!`;
  } else if (inc === item.incrementTiers.medium) {
    reply = `كلام منطقي.. مشّيتها لك ورفعت السوم +${toArabicDigits(inc)} ريال!`;
    announcement = `سومة جديدة من ${playerName} بـ +${toArabicDigits(inc)} ريال!`;
  } else if (inc === item.incrementTiers.strong) {
    reply = `حجة قوية وذكية منك! تستاهل رفع السوم +${toArabicDigits(inc)} ريال!`;
    announcement = `قفزة قوية في السوم من ${playerName} (+${toArabicDigits(inc)} ريال)!`;
  } else {
    reply = `يا ساتر عليك يا الشريطي المحنّك! عذرك أسطوري وضحكتني.. خذ لك +${toArabicDigits(inc)} ريال!`;
    announcement = `زلزال في الحراج! سومة أسطورية من ${playerName} (+${toArabicDigits(inc)} ريال)!`;
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
// 4. Main Broker Engine (Guardrails + Opening baseline + Gemini Flash)
// -------------------------------------------------------------

export async function evaluateBrokerPitch(params: {
  item: BrokerItem;
  pitch: string;
  currentBid: number;
  isFirstBid: boolean;
  playerName: string;
}): Promise<BrokerEvaluationResult> {
  const item = ensureBrokerItem(params.item);
  const { pitch, currentBid, isFirstBid, playerName } = params;

  // Step 1: Check Local Zero-Token Guardrails
  const guardrailMatch = checkLocalGuardrails(pitch);
  if (guardrailMatch) {
    return {
      persuasionScore: 1,
      reply: guardrailMatch.quip,
      bidIncrease: 0,
      newBid: currentBid,
      soundFx: 'buzz',
      publicAnnouncement: `الشريطي قصف جبهة ${playerName} بسبب مخالفة أصول الحراج!`,
    };
  }

  const isOpening = isFirstBid || currentBid === 0;
  const estimatedValue = item.estimatedValue || item.openingBaseline * 4;
  const bidAmount = extractBidAmountFromPitch(pitch, item.openingBaseline);

  let systemPrompt = '';
  let userPrompt = '';

  if (isOpening) {
    systemPrompt = `أنت "الشريطي"؛ تاجر حراج عتيق، ذيبان، لا تثق بأحد، وشديد الحرص في الريال.
السلعة المعروضة لفتحة الباب: [ ${item.name} ]
السعر الأصلي المقدر: ${estimatedValue} ريال.
العيب القاتل في السلعة: ${item.flaw}

المتسابق: ${playerName}
فتحة الباب المقترحة منه: ${bidAmount} ريال.
كلامه وحجته لفتحة الباب: "${pitch}"

قواعد صارمة وتصعيب التفاوض لفتحة الباب:
1. صيد ثغرة العروض الخارجية والرشاوى الوهمية (CRITICAL):
   - يُمنع منعاً باتاً قبول أي إغراءات أو وعود بأشياء خارجية غير السلعة نفسها (مثل: "بعطيك فوقها سيارة"، "معاها آيفون هدية"، "بحول لك رصيد"، "أنا ولد فلان"، "فوق البيعة").
   - إذا حاول المتسابق استخدام هذه الحيلة: ارفض فتحة الباب فوراً (accepted: false, finalOpeningPrice: 0)، واجلده برد شريطي ساخر وقاسٍ (مثال: "تحسبني غشيم تمشي علي حركات العيال؟ أنا جاي اشتري هالسلعة بس، وفر خردتك لك!").
2. شح فتحة الباب وصعوبة الإقناع:
   - الشريطي بطبعه لا يقبل فتحة الباب بسهولة.
   - إذا كتب كلاماً شريطياً محنكاً أو ترقيعة ذكية لعيب السلعة (${item.flaw}) -> اقبل فتحة بابه (accepted: true).
   - إذا كان كلامه تسليكياً أو بخساً شنيعاً بريال أو ريالين -> ارفض فتحة بابه برّد ساخر واكسر سومته.
3. الرد: سطر واحد مقتضب وساخر بالعامية الحراجية السعودية وبدون أي إيموجي نهائياً.

المطلوب إرجاع JSON:
{
  "accepted": true أو false,
  "finalOpeningPrice": السعر المعتمد لفتحة بابه برقم واقعي,
  "brokerReply": "رد الشريطي المقتضب والساخر بلهجة حراج سعودية صريحة (سطر واحد وبدون إيموجي)"
}`;

    userPrompt = `حلل فتحة باب المتسابق (${playerName}) على سلعة "${item.name}":
فتحة بابه: ${bidAmount} ريال.
كلامه: "${pitch}".
أرجع JSON فوراً.`;
  } else {
    const minInc = Math.max(5, Math.round(estimatedValue * 0.05));
    const maxInc = Math.max(minInc, Math.round(estimatedValue * 0.15));

    systemPrompt = `أنت "الشريطي"؛ تاجر حراج عتيق، ذيبان، لا تثق بأحد، وشديد الحرص في الريال.
السلعة المعروضة للمفاوضة حالياً: [ ${item.name} ]
السعر الأصلي المقدر: ${estimatedValue} ريال.
العيب القاتل في السلعة: ${item.flaw}
السومة الحالية: ${currentBid} ريال.

المتسابق: ${playerName}
كلامه وحجته لرفع السوم: "${pitch}"

قواعد صارمة وتصعيب التفاوض:
1. صيد ثغرة العروض الخارجية والرشاوى الوهمية (CRITICAL):
   - يُمنع منعاً باتاً قبول أي إغراءات أو وعود بأشياء خارجية غير السلعة نفسها (مثل: "بعطيك فوقها سيارة"، "معاها آيفون هدية"، "بحول لك رصيد"، "أنا ولد فلان"، "فوق البيعة").
   - إذا حاول المتسابق استخدام هذه الحيلة: ارفض الزيادة فوراً (زيادة: 0 ريال)، واجلده برد شريطي ساخر وقاسٍ (مثال: "تحسبني غشيم تمشي علي حركات العيال؟ أنا جاي اشتري هالسلعة بس، وفر خردتك لك!").

2. شح الزيادة وصعوبة الإقناع:
   - الشريطي بطبعه لا يرفع السعر بسهولة، وأي ريال يطلعه كأنه طالع من روحه.
   - لا ترفع السعر إلا إذا قدّم المتسابق "ترقيعة منطقية وذكية" تخص عيب السلعة نفسه (${item.flaw}) (مثال: إذا كان العيب "المكيف حار"، وقال: "ترى الكمبروسر سليم بس ناقصه فريون بـ 50 ريال ويرجع فريزر" -> هنا يقبل زيادة بسيطة ومحسوبة).
   - الترقيعات الغبية أو الكلام الإنشائي ("والله نظيفة"، "تستاهل أكثر"، "أنا محتاج فلوس"، "ما تلقى زيها") تقابل برد بارد وزيادة 0 أو سخرية.

3. معايير الزيادة:
   - الردود العادية والضعيفة والخارجية: 0 ريال.
   - ترقيعة ذكية ومقنعة جداً في صلب السلعة وعيبها: زيادة ما بين 5% إلى 15% فقط من قيمة السلعة كحد أقصى (ما بين ${minInc} إلى ${maxInc} ريال).

4. الرد: سطر واحد مقتضب وساخر بالعامية الحراجية السعودية وبدون أي إيموجي نهائياً.

المطلوب إرجاع JSON:
{
  "persuasionScore": number (من 1 إلى 10),
  "bidIncrease": number (بين 0 و ${maxInc}),
  "brokerReply": "رد الشريطي بلهجة سعودية حراجية صريحة وسطر واحد وبدون إيموجي"
}`;

    userPrompt = `المتسابق (${playerName}) يفاوض لرفع السوم على "${item.name}" (السومة الحالية: ${currentBid} ريال):
كلامه: "${pitch}".
أرجع JSON فوراً.`;
  }

  try {
    const rawResponse = await generateWithGemini(userPrompt, {
      systemPrompt,
      temperature: 0.8,
      maxOutputTokens: 350,
      jsonMode: true,
    });

    if (rawResponse) {
      const parsed = cleanAndParseJSON(rawResponse);

      if (parsed) {
        const cleanReply = stripEmojis(parsed.brokerReply || parsed.reply || '');

        if (isOpening) {
          const accepted = Boolean(parsed.accepted);
          const finalPrice = Math.max(
            0,
            Number(parsed.finalOpeningPrice ?? (accepted ? item.openingBaseline : 0))
          );

          if (accepted && finalPrice > 0) {
            return {
              persuasionScore: 8,
              reply: cleanReply || `فتحة باب مقبولة يا ${playerName} بـ ${toArabicDigits(finalPrice)} ريال!`,
              bidIncrease: finalPrice,
              newBid: finalPrice,
              soundFx: 'cash',
              publicAnnouncement: `افتتح ${playerName} السوم بـ ${toArabicDigits(finalPrice)} ريال!`,
            };
          } else {
            return {
              persuasionScore: 2,
              reply: cleanReply || 'هذا بخس مو فتحة باب! اعقل سومتك وتعال كلمني!',
              bidIncrease: finalPrice,
              newBid: finalPrice,
              soundFx: 'buzz',
              publicAnnouncement: `الشريطي كسر فتحة باب ${playerName} ورفض البخس!`,
            };
          }
        } else {
          const inc = Math.max(0, Number(parsed.bidIncrease ?? 0));
          const newBid = currentBid + inc;
          const soundFx: 'cash' | 'buzz' = inc > 0 ? 'cash' : 'buzz';

          let announcement = `الشريطي صدم ${playerName} ورفض الزيادة!`;
          if (inc >= item.incrementTiers.strong) {
            announcement = `قفزة قوية في السوم من ${playerName} (+${toArabicDigits(inc)} ريال)!`;
          } else if (inc > 0) {
            announcement = `سومة جديدة من ${playerName} (+${toArabicDigits(inc)} ريال)!`;
          }

          return {
            persuasionScore: Number(parsed.persuasionScore) || (inc > 0 ? 6 : 2),
            reply: cleanReply || (inc > 0 ? `مشيتها لك وزدتك +${toArabicDigits(inc)} ريال!` : 'حجة ضعيفة وما تخارجني!'),
            bidIncrease: inc,
            newBid,
            soundFx,
            publicAnnouncement: announcement,
          };
        }
      }
    }
  } catch (err) {
    console.warn('[BrokerEngine] Gemini call failed, using heuristic engine:', err);
  }

  // Step 4: Reliable heuristic fallback
  return generateOfflineBrokerResponse(item, pitch, currentBid, playerName, isOpening);
}
