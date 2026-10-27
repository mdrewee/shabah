import {
  CoachSlotKey,
  CoachSquad,
  CoachVerdict,
  SlotVerification,
  SquadEvaluationResult,
  COACH_SLOTS_ORDER,
  COACH_SLOT_CONFIG,
} from './types';
import { resolveFootballerByName, normalizeFootballSearch } from './footballDataService';
import { FootballPlayer } from '../../../data/footballMasterData';
import { formatPercent } from '../../../utils/numberFormat';
import { generateWithGemini } from '../../../config/gemini';

// Knowledge sets for factual verification
const GK_LIST = ['بوفون', 'كاسياس', 'نوير', 'كورتوا', 'اليغري', 'اليسون', 'ايدرسون', 'دي خيا', 'ياسين بونو', 'العويس', 'المعيوف', 'تير شتيغن', 'دوناروما', 'نافاس', 'بارتيز', 'بيتر تشيك', 'لوريس', 'اوليفر كان', 'اوبلاك', 'ايميليانو مارتينيز', 'اونانا', 'رامسديل', 'سومر', 'مينيان', 'شيزني', 'ياشين', 'شمايكل', 'فان در سار', 'الحبسي', 'الدعيع', 'الشناوي', 'الحضري', 'برافو', 'سوباسيتش'];
const DEF_LIST = ['مالديني', 'راموس', 'فان دايك', 'بويول', 'كانافارو', 'بيكيه', 'تياغو سيلفا', 'كوليبالي', 'مارسيلو', 'الفيس', 'ارنولد', 'روبرتسون', 'روبن دياز', 'البليهي', 'هوساوي', 'حجازي', 'والكر', 'حكيمي', 'نيستا', 'تيري', 'فيرديناند', 'بيبي', 'فاران', 'ماركينيوس', 'فيليب لام', 'روبرتو كارلوس', 'زانيتي', 'كافو', 'نيفيل', 'كيميش', 'الابا', 'دافيز', 'ساليبا', 'كيليني', 'بونوتشي', 'ستونز', 'غفارديول', 'ثيو هيرنانديز', 'البا', 'كارفاخال', 'روديغر', 'الشهراني', 'عبدالحميد', 'كوندي', 'اراوخو', 'ماتيب', 'ميليتاو'];
const MID_LIST = ['زيدان', 'مودريتش', 'تشافي', 'انييستا', 'كروس', 'دي بروين', 'كانتي', 'كاسيميرو', 'بوسكيتس', 'بيرلو', 'جيرارد', 'لامبارد', 'سافيتش', 'نيفيز', 'سالم الدوسري', 'عطيف', 'بوغبا', 'رودري', 'فالفيردي', 'بيلينغهام', 'بيدري', 'غافي', 'شفاينشتايغر', 'سكولز', 'فييرا', 'كاكا', 'رونالدينيو', 'ريكيلمي', 'فيراتي', 'كوفاتشيتش', 'تونالي', 'باريلا', 'برونو فيرنانديز', 'اوزيل', 'اوديغارد', 'فرينكي دي يونغ', 'تشواميني', 'كامافينغا', 'غوندوغان', 'المالكي', 'كنو', 'فابينيو', 'تياغو الكانتارا', 'ماك اليستير', 'سوبوسلاي', 'رايس'];
const FWD_LIST = ['ميسي', 'كريستيانو رونالدو', 'رونالدو نازاريو', 'بنزيما', 'مبابي', 'هالاند', 'نيمار', 'ليفاندوفسكي', 'سواريز', 'محمد صلاح', 'هاري كين', 'اغويرو', 'روني', 'هنري', 'دروغبا', 'ايتو', 'ابراهيموفيتش', 'فينيسيوس', 'رودريغو', 'ساديو ماني', 'محرز', 'سون', 'غريزمان', 'ديبالا', 'لوكاكو', 'موراتا', 'فودين', 'ساكا', 'مارتينيلي', 'الفاريز', 'اوسيمين', 'لاوتارو مارتينيز', 'حمدالله', 'ميتروفيتش', 'تاليسكا', 'مالكوم', 'ماجد عبدالله', 'سامي الجابر', 'ياسر القحطاني', 'السومة', 'رومارينهو', 'بيركامب', 'فان نيستلروي', 'شيفشينكو', 'كلوزه', 'مولر', 'دي ماريا', 'ريفالدو', 'روماريو', 'بيليه', 'مارادونا'];

const BALD_PLAYERS = ['زيدان', 'روبن', 'كانتي', 'كومباني', 'ستام', 'بارتيز', 'هنري', 'بيبي', 'سكيرتل', 'كولاروف', 'رونالدو نازاريو', 'روبرتو كارلوس', 'غاتوزو', 'شيلفي', 'ماركينيوس', 'كولينا', 'فابينيو', 'سترلينغ'];
const AFRO_PLAYERS = ['فيلايني', 'كوكوريا', 'ساني', 'مارسيلو', 'ديفيد لويز', 'فالديراما', 'كولوتشيني', 'غوندوزي', 'ويليان', 'بوغبا', 'رود خوليت', 'انزو فيرنانديز', 'كافامينغا', 'رونالدينيو'];
const LONG_HAIR_PLAYERS = ['مودريتش', 'ابراهيموفيتش', 'كافاني', 'بويول', 'كانيجيا', 'باتيستوتا', 'بيرلو', 'نيدفيد', 'غريزمان', 'هالاند', 'باجيو', 'بيكهام', 'راموس', 'فالديراما', 'رونالدينيو', 'تشيلافيرت', 'ماتيوس كونيا', 'كوكوريا', 'سافيولا', 'كافو'];
const BEARD_PLAYERS = ['صلاح', 'بنزيما', 'ميسي', 'جيرو', 'اليسون', 'بيكيه', 'اردا توران', 'دي روسي', 'راموس', 'كافاني', 'ابراهيموفيتش', 'برونو فيرنانديز', 'بونوتشي', 'روديغر', 'كارفاخال', 'البليهي', 'بونو', 'حجازي', 'محرز', 'غوندوغان', 'كانتي'];
const DARK_SKIN_PLAYERS = ['كانتي', 'فينيسيوس', 'مبابي', 'كوليبالي', 'بوغبا', 'توريه', 'ماني', 'ديمبيلي', 'سيسوكو', 'كامافينغا', 'دروغبا', 'ايتو', 'رونالدينيو', 'بيليه', 'هنري', 'تشواميني', 'ساكا', 'روديغر', 'الابا', 'اوسيمين', 'سترلينغ', 'ميندي', 'البليهي', 'هوساوي', 'كانو', 'راشفورد', 'رودريغو', 'ميليتاو', 'كومان', 'ساني', 'لوكاكو'];
const LEFTHANDED_FOOT = ['ميسي', 'صلاح', 'مارادونا', 'روبن', 'دي ماريا', 'سيلفا', 'بيل', 'غريزمان', 'هالاند', 'روبرتو كارلوس', 'محرز', 'فان بيرسي', 'ديبالا', 'البا', 'ريبيري', 'ريفالدو', 'ساكا', 'اوديجارد', 'فودين', 'برناردو سيلفا'];
const CAPTAINS = ['ميسي', 'كريستيانو رونالدو', 'راموس', 'بوفون', 'كاسياس', 'مالديني', 'جيرارد', 'هاري كين', 'مودريتش', 'فان دايك', 'نوير', 'لوريس', 'سالم الدوسري', 'سامي الجابر', 'ماجد عبدالله', 'حجازي', 'صلاح', 'محرز', 'نيمار', 'ابراهيموفيتش', 'بويول', 'تيري'];
const SHIRT_10 = ['ميسي', 'مارادونا', 'بيليه', 'زيدان', 'مودريتش', 'رونالدينيو', 'نيمار', 'مبابي', 'توتي', 'باجيو', 'ديل بييرو', 'هازارد', 'اغويرو', 'ساديو ماني', 'روي كوستا', 'ريكيلمي', 'سالم الدوسري', 'محرز', 'ابراهيموفيتش'];
const SHIRT_7 = ['كريستيانو رونالدو', 'راؤول', 'بيكهام', 'فيغو', 'كانتونا', 'ديبروين', 'سون', 'فينيسيوس', 'ديمبيلي', 'ساكا', 'غريزمان', 'كانتي', 'ريبيري', 'دافيد فيا', 'مبابي'];
const MUSLIM_PLAYERS = ['بنزيما', 'صلاح', 'ماني', 'محرز', 'كانتي', 'بوغبا', 'اوزيل', 'زيدان', 'ريبيري', 'دروغبا', 'ديمبيلي', 'رودريغر', 'تشواميني', 'حكيمي', 'زياش', 'بونو', 'حجازي', 'النني', 'سالم الدوسري', 'كنو', 'البليهي', 'العويس', 'فوفانا', 'ساني', 'شردان شاكيري', 'منديل'];
const WORLD_CUP_WINNERS = ['ميسي', 'زيدان', 'رونالدو نازاريو', 'رونالدينيو', 'ريفالدو', 'مارادونا', 'بيليه', 'انييستا', 'تشافي', 'بويول', 'كاسياس', 'راموس', 'بوسكيتس', 'بيكيه', 'مبابي', 'غريزمان', 'بوغبا', 'كانتي', 'فاران', 'لوريس', 'نوير', 'كروس', 'مولر', 'لام', 'شفاينشتايغر', 'كلوزه', 'بوفون', 'كانافارو', 'بيرلو', 'توتي', 'ديل بييرو', 'دي ماريا', 'ديبالا', 'الفاريز', 'مارتينيز', 'روماريو', 'بيكنباور'];

/**
 * 1. Factual deterministic condition check
 */
function checkPlayerCondition(
  playerName: string,
  conditionId: string,
  player: FootballPlayer | null
): { isValid: boolean; reason: string } {
  const normName = normalizeFootballSearch(playerName);

  const includesIn = (list: string[]) =>
    list.some((item) => {
      const n = normalizeFootballSearch(item);
      return normName.includes(n) || n.includes(normName);
    });

  switch (conditionId) {
    case 'c_bald':
      if (includesIn(BALD_PLAYERS)) return { isValid: true, reason: 'معروف بالصلع التام' };
      return { isValid: false, reason: 'اللاعب يمتلك شعر في مسيرته' };

    case 'c_afro':
      if (includesIn(AFRO_PLAYERS)) return { isValid: true, reason: 'اشتهر بقصة الكدش أو الأفروا' };
      return { isValid: false, reason: 'شعره غير مصنف كأفروا كثيف' };

    case 'c_long_hair':
      if (includesIn(LONG_HAIR_PLAYERS)) return { isValid: true, reason: 'معروف بالشعر الطويل' };
      return { isValid: false, reason: 'شعره قصير في معظم مسيرته' };

    case 'c_beard':
      if (includesIn(BEARD_PLAYERS)) return { isValid: true, reason: 'يمتلك لحية بارزة' };
      return { isValid: false, reason: 'بدون لحية بارزة' };

    case 'c_dark_skin':
      if (includesIn(DARK_SKIN_PLAYERS)) return { isValid: true, reason: 'من أصحاب البشرة السمراء' };
      return { isValid: false, reason: 'غير متطابق مع شرط البشرة السمراء' };

    case 'c_lefty':
      if (includesIn(LEFTHANDED_FOOT)) return { isValid: true, reason: 'أشول ويلعب بالقدم اليسرى' };
      return { isValid: false, reason: 'يعتمد على القدم اليمنى' };

    case 'c_captain':
      if (includesIn(CAPTAINS)) return { isValid: true, reason: 'حمل شارة القيادة لفريقه أو منتخبه' };
      return { isValid: false, reason: 'لم يشتهر بحمل شارة القيادة' };

    case 'c_shirt_10':
      if (includesIn(SHIRT_10)) return { isValid: true, reason: 'ارتدى الرقم 10 الشهير' };
      return { isValid: false, reason: 'لم يشتهر بالرقم 10' };

    case 'c_shirt_7':
      if (includesIn(SHIRT_7)) return { isValid: true, reason: 'ارتدى الرقم 7 التاريخي' };
      return { isValid: false, reason: 'لم يشتهر بارتداء الرقم 7' };

    case 'c_muslim':
      if (includesIn(MUSLIM_PLAYERS)) return { isValid: true, reason: 'مسلم الديانة' };
      return { isValid: false, reason: 'غير مؤكد كمسلم الديانة' };

    case 'c_world_cup_winner':
      if (includesIn(WORLD_CUP_WINNERS) || (player?.trophies && player.trophies.includes('كأس العالم'))) {
        return { isValid: true, reason: 'متوج بلقب كأس العالم' };
      }
      return { isValid: false, reason: 'لم يحقق لقب كأس العالم' };

    case 'c_roshn':
      if (player?.clubs && player.clubs.some((c) => ['الهلال', 'النصر', 'الاتحاد', 'الأهلي', 'الشباب', 'الاتفاق'].includes(c))) {
        return { isValid: true, reason: 'لعب في الدوري السعودي (روشن)' };
      }
      if (includesIn(['رونالدو', 'بنزيما', 'نيفيز', 'سافيتش', 'ماني', 'محرز', 'كانتي', 'بونو', 'ميتروفيتش', 'فيرمينو', 'كيسي', 'تاليسكا', 'سالم الدوسري'])) {
        return { isValid: true, reason: 'لعب في دوري روشن السعودي' };
      }
      return { isValid: false, reason: 'لم يلعب في دوري روشن للمحترفين' };

    case 'c_africa':
      const africaCountries = ['مصر', 'المغرب', 'الجزائر', 'تونس', 'السنغال', 'نيجيريا', 'الكاميرون', 'ساحل العاج', 'غانا', 'مالي'];
      if (player?.nationality && africaCountries.includes(player.nationality)) {
        return { isValid: true, reason: `من قارة أفريقيا (${player.nationality})` };
      }
      if (includesIn(['صلاح', 'محرز', 'ماني', 'حكيمي', 'بونو', 'زياش', 'دروغبا', 'ايتو', 'اوسيمين', 'كوليبالي'])) {
        return { isValid: true, reason: 'جنسيته من قارة أفريقيا' };
      }
      return { isValid: false, reason: 'ليس من قارة أفريقيا' };

    case 'c_south_america':
      const saCountries = ['البرازيل', 'الأرجنتين', 'الأوروغواي', 'كولومبيا', 'تشيلي', 'فنزويلا'];
      if (player?.nationality && saCountries.includes(player.nationality)) {
        return { isValid: true, reason: `من أمريكا الجنوبية (${player.nationality})` };
      }
      if (includesIn(['ميسي', 'نيمار', 'سواريز', 'فينيسيوس', 'فالفيردي', 'رودريغو', 'رونالدو نازاريو', 'رونالدينيو', 'مارادونا', 'بيليه', 'اليسون', 'كاسيميرو'])) {
        return { isValid: true, reason: 'جنسيته من قارة أمريكا الجنوبية' };
      }
      return { isValid: false, reason: 'ليس من قارة أمريكا الجنوبية' };

    default:
      // Generous fallback if player is recognized
      if (player) {
        return { isValid: true, reason: 'حقق شرط الجولة بنجاح' };
      }
      return { isValid: false, reason: 'لم يتم إثبات تطابق الشرط' };
  }
}

/**
 * 2. Position accuracy verification
 */
function checkPositionFit(
  slotKey: CoachSlotKey,
  playerName: string,
  player: FootballPlayer | null
): { isValid: boolean; naturalPos: string; reason: string } {
  const normName = normalizeFootballSearch(playerName);
  const targetRole = COACH_SLOT_CONFIG[slotKey].role;

  let detectedRole: 'GK' | 'DEF' | 'MID' | 'FWD' = 'FWD';

  if (player?.position) {
    detectedRole = player.position;
  } else if (GK_LIST.some((k) => normName.includes(normalizeFootballSearch(k)))) {
    detectedRole = 'GK';
  } else if (DEF_LIST.some((k) => normName.includes(normalizeFootballSearch(k)))) {
    detectedRole = 'DEF';
  } else if (MID_LIST.some((k) => normName.includes(normalizeFootballSearch(k)))) {
    detectedRole = 'MID';
  } else if (FWD_LIST.some((k) => normName.includes(normalizeFootballSearch(k)))) {
    detectedRole = 'FWD';
  }

  const roleLabels: Record<'GK' | 'DEF' | 'MID' | 'FWD', string> = {
    GK: 'حارس مرمى',
    DEF: 'مدافع',
    MID: 'خط وسط',
    FWD: 'مهاجم',
  };

  const naturalPos = roleLabels[detectedRole];

  if (detectedRole === targetRole) {
    return {
      isValid: true,
      naturalPos,
      reason: `مركز طبيعي صحيح (${naturalPos})`,
    };
  }

  return {
    isValid: false,
    naturalPos,
    reason: `مركزه الحقيقي ${naturalPos} وليس ${COACH_SLOT_CONFIG[slotKey].label}!`,
  };
}

/**
 * Calculate player prestige / power rating (1 to 100)
 */
export function getPlayerPrestige(
  player: FootballPlayer | null,
  playerName: string
): number {
  if (!playerName || playerName.includes('خانة فارغة')) return 0;

  const norm = normalizeFootballSearch(playerName);

  // Elite Tier 1: All-time legends & global superstars (95-100)
  const TIER_1_SUPERSTARS = [
    'ميسي', 'كريستيانو رونالدو', 'رونالدو', 'زيدان', 'بنزيما', 'مارادونا', 'بيليه',
    'رونالدينيو', 'هنري', 'بوفون', 'نوير', 'كاسياس', 'راموس', 'مالديني', 'مودريتش',
    'كروس', 'دي بروين', 'مبابي', 'هالاند', 'نيمار', 'ليفاندوفسكي', 'سواريز', 'محمد صلاح',
    'انييستا', 'تشافي', 'كانافارو', 'بويول', 'روبيرتو كارلوس', 'دروغبا', 'ابراهيموفيتش'
  ];
  if (TIER_1_SUPERSTARS.some((star) => norm.includes(normalizeFootballSearch(star)))) {
    return 98;
  }

  // Elite Tier 2: World Cup / UCL champions & international stars (85-94)
  const TIER_2_STARS = [
    'كانتي', 'محرز', 'ماني', 'بونو', 'سالم الدوسري', 'فينيسيوس', 'رودريغو', 'بيلينغهام',
    'رودري', 'فالفيردي', 'سون', 'هاري كين', 'فان دايك', 'كورتوا', 'اليسون', 'تير شتيغن',
    'سافيتش', 'نيفيز', 'ميتروفيتش', 'بيرلو', 'كاسيميرو', 'بوسكيتس', 'روديغر', 'حكيمي',
    'غريزمان', 'اغويرو', 'ديبالا', 'روبن', 'ريبيري', 'فودين', 'ساكا', 'بيركامب', 'شنايدر'
  ];
  if (TIER_2_STARS.some((star) => norm.includes(normalizeFootballSearch(star)))) {
    return 88;
  }

  // Tier 3: Recognized professional in master DB
  if (player) {
    if (player.trophies && player.trophies.length > 0) return 82;
    if (player.clubs && player.clubs.length > 2) return 76;
    return 72;
  }

  // Tier 4: Unknown / custom entry obscure player
  return 45;
}

/**
 * 3. Evaluate a single squad deterministically (40% Condition + 25% Position + 35% Prestige)
 */
export function evaluateSquad(squad: CoachSquad): SquadEvaluationResult {
  const slots: Record<CoachSlotKey, SlotVerification> = {} as any;
  let validConditionsCount = 0;
  let validPositionsCount = 0;
  let totalPowerSum = 0;

  for (const slotKey of COACH_SLOTS_ORDER) {
    const pick = squad.slots[slotKey];

    if (!pick || !pick.playerName || pick.playerName.includes('خانة فارغة')) {
      slots[slotKey] = {
        slotKey,
        playerName: 'خانة فارغة',
        isValidCondition: false,
        conditionReason: 'لم يتم اختيار لاعب في هذه الخانة',
        isValidPosition: false,
        positionReason: 'خانة فارغة',
        naturalPosition: 'غير محدد',
        playerPower: 0,
      };
      continue;
    }

    const matchedPlayer = resolveFootballerByName(pick.playerName);

    // Pillar 1: Condition Fit (Weight: 40% -> +8% each)
    const condResult = checkPlayerCondition(pick.playerName, pick.conditionId, matchedPlayer);
    if (condResult.isValid) validConditionsCount += 1;

    // Pillar 2: Position Fit (Weight: 25% -> +5% each)
    const posResult = checkPositionFit(slotKey, pick.playerName, matchedPlayer);
    if (posResult.isValid) validPositionsCount += 1;

    // Pillar 3: Player Prestige / Power Tier (Weight: 35%)
    const power = getPlayerPrestige(matchedPlayer, pick.playerName);
    totalPowerSum += power;

    slots[slotKey] = {
      slotKey,
      playerName: pick.playerName,
      isValidCondition: condResult.isValid,
      conditionReason: condResult.reason,
      isValidPosition: posResult.isValid,
      positionReason: posResult.reason,
      naturalPosition: posResult.naturalPos,
      playerPower: power,
    };
  }

  // Balanced Formula:
  // - Condition: 5 slots * 8% = 40%
  // - Position: 5 slots * 5% = 25%
  // - Prestige / Power: (avgPower / 100) * 35% = 35%
  const conditionPoints = validConditionsCount * 8;
  const positionPoints = validPositionsCount * 5;
  const powerPoints = Math.round((totalPowerSum / 5) * 0.35);
  const totalPercentage = Math.min(100, Math.max(0, conditionPoints + positionPoints + powerPoints));

  // Sarcastic Coach Roast generator
  let critique = '';
  if (totalPercentage >= 90) {
    critique = 'تشكيلة أسطورية تجمع بين تحقيق الشروط وهيبة النجوم والمراكز الموزونة! الشبح يرفع لك القبعة.';
  } else if (totalPercentage >= 70) {
    critique = 'تشكيلة قوية ومحترمة لكن فيها هفوة نجومية أو رقعة بسيطة ما مشت على الشبح!';
  } else if (totalPercentage >= 40) {
    critique = 'فريقك فيه عك كروي واضح، لاعبين مغمورين ومراكز ملخبطة.. محتاج دورة تدريبية عاجلة!';
  } else {
    critique = 'وش هالعك التكتيكي؟! خانات فارغة ولاعبين في غير مراكزهم.. الشبح مصدوم من هذا المستوى!';
  }

  return {
    playerId: squad.playerId,
    playerName: squad.playerName,
    totalPercentage,
    conditionPoints,
    positionPoints,
    powerPoints,
    slots,
    critique,
  };
}

/**
 * 4. Evaluate all squads and rank them for the final verdict
 */
export function evaluateAllSquads(squads: Record<string, CoachSquad>): CoachVerdict {
  const evaluations: SquadEvaluationResult[] = Object.values(squads).map(evaluateSquad);

  if (evaluations.length === 0) {
    return {
      evaluations: [],
      winnerId: '',
      winnerName: 'لا يوجد',
      winnerScore: 0,
      isTie: false,
      coachBanner: 'لم تكتمل أي تشكيلة للتقييم!',
    };
  }

  // Sort descending by totalPercentage -> conditionPoints -> positionPoints
  evaluations.sort((a, b) => {
    if (b.totalPercentage !== a.totalPercentage) return b.totalPercentage - a.totalPercentage;
    if (b.conditionPoints !== a.conditionPoints) return b.conditionPoints - a.conditionPoints;
    return b.positionPoints - a.positionPoints;
  });

  // Assign ranks & award points (+5 for 1st, +3 for 2nd, +1 for 3rd)
  evaluations.forEach((item, idx) => {
    item.rank = idx + 1;
    if (idx === 0) item.matchPointsAwarded = 5;
    else if (idx === 1) item.matchPointsAwarded = 3;
    else if (idx === 2) item.matchPointsAwarded = 1;
    else item.matchPointsAwarded = 0;
  });

  const winner = evaluations[0];
  const runnerUp = evaluations[1];
  const isTie = Boolean(runnerUp && runnerUp.totalPercentage === winner.totalPercentage);

  const coachBanner = `بطل التشكيلات: ${winner.playerName} بنسبة قوة ${formatPercent(winner.totalPercentage)}!`;

  return {
    evaluations,
    winnerId: winner.playerId,
    winnerName: winner.playerName,
    winnerScore: winner.totalPercentage,
    isTie,
    coachBanner,
  };
}

/**
 * 5. Batch Gemini AI evaluation for contestant squads & sarcastic tactical breakdown
 */
export async function evaluateAllSquadsWithAI(
  squads: Record<string, CoachSquad>
): Promise<CoachVerdict> {
  // First calculate baseline deterministic results
  const deterministicVerdict = evaluateAllSquads(squads);
  if (deterministicVerdict.evaluations.length === 0) {
    return deterministicVerdict;
  }

  try {
    const squadsData = Object.values(squads).map((s) => ({
      playerId: s.playerId,
      playerName: s.playerName,
      slots: Object.entries(s.slots).map(([slotKey, pick]) => ({
        slot: slotKey,
        player: pick?.playerName || 'خانة فارغة',
        condition: pick?.conditionTitle || '',
        isCustom: pick?.isCustom || false,
      })),
    }));

    const systemPrompt = `
أنت "الشبح المدرب"، أسطورة التدريب التكتيكي الساخر والداهية في لعبة "شبح".
مهمتك: تقييم تشكيلات اللاعبين الـ 5 لكل متسابق بعد انتهاء الجولات الـ 5.
تحلل الخانات، وتكشف أي عك كروي أو لاعب يلعب في غير مركزه، وتتحقق من الأسماء المكتوبة يدوياً، وتولد تعليقاً ساخراً لاذعاً وممتعاً بالعامية السعودية لكل تشكيلة.

شروط الإخراج:
- JSON حصراً:
{
  "winnerPlayerId": "string",
  "coachBanner": "string (سطر إعلان البطل بحماس كروي ساخر)",
  "evaluations": [
    {
      "playerId": "string",
      "critique": "string (سطرين جلد وتحليل تكتيكي ساخر بالعامية السعودية)",
      "totalPercentage": 85
    }
  ]
}
`.trim();

    const userPrompt = `التشكيلات المقدمة:\n${JSON.stringify(squadsData, null, 2)}`;

    const responseText = await generateWithGemini(userPrompt, {
      systemPrompt,
      temperature: 0.75,
      jsonMode: true,
      maxOutputTokens: 1200,
    });

    if (responseText) {
      const parsed = JSON.parse(responseText);
      if (parsed?.evaluations && Array.isArray(parsed.evaluations)) {
        parsed.evaluations.forEach((aiEval: any) => {
          const match = deterministicVerdict.evaluations.find(
            (e) => e.playerId === aiEval.playerId
          );
          if (match) {
            if (aiEval.critique) match.critique = aiEval.critique;
            if (typeof aiEval.totalPercentage === 'number' && aiEval.totalPercentage >= 0 && aiEval.totalPercentage <= 100) {
              // Blend AI score with factual score
              match.totalPercentage = Math.round((match.totalPercentage + aiEval.totalPercentage) / 2);
            }
          }
        });

        if (parsed.coachBanner) {
          deterministicVerdict.coachBanner = parsed.coachBanner;
        }
      }
    }
  } catch (err) {
    console.warn('[Coach AI Evaluation] Fallback to deterministic evaluation:', err);
  }

  return deterministicVerdict;
}

