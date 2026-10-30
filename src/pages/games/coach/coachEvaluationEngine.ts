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

    // 100 Comprehensive Open Coach Criteria (Genders, Leagues, Roles, Skills, Milestones)
    // 1. Nationalities (001 - 010)
    case 'crit_001':
      if (player?.nationality === 'البرازيل' || includesIn(['بيليه', 'رونالدو', 'رونالدينيو', 'نيمار', 'كاكا', 'فينيسيوس', 'ريفالدو', 'روماريو', 'كافو', 'روبرتو كارلوس', 'اليسون', 'كاسيميرو', 'رودريغو', 'سيلفا'])) {
        return { isValid: true, reason: 'نجم برازيلي من راقصي السامبا' };
      }
      return { isValid: false, reason: 'ليس لاعباً برازيلياً' };

    case 'crit_002':
      if (player?.nationality === 'الأرجنتين' || includesIn(['ميسي', 'مارادونا', 'دي ماريا', 'باتيستوتا', 'اغويرو', 'ديبالا', 'الفاريز', 'لاوتارو', 'مارتينيز', 'ريكيلمي', 'كريسبو', 'فيرون', 'ماسكيرانو'])) {
        return { isValid: true, reason: 'نجم أرجنتيني من بلاد التانغو' };
      }
      return { isValid: false, reason: 'ليس لاعباً أرجنتينياً' };

    case 'crit_003':
      if (player?.nationality === 'فرنسا' || includesIn(['زيدان', 'مبابي', 'بنزيما', 'هنري', 'كانتي', 'بوغبا', 'غريزمان', 'فاران', 'لوريس', 'ريبيري', 'بلاتيني', 'ديمبيلي', 'تشواميني', 'كامافينغا'])) {
        return { isValid: true, reason: 'نجم فرنسي من الديوك' };
      }
      return { isValid: false, reason: 'ليس لاعباً فرنسياً' };

    case 'crit_004':
      if (player?.nationality === 'ألمانيا' || includesIn(['نوير', 'كروس', 'مولر', 'بيكنباور', 'كلوزه', 'شفاينشتايغر', 'لام', 'اوزيل', 'كان', 'موسيالا', 'ساني', 'غوندوغان', 'رودريغر', 'بالاك'])) {
        return { isValid: true, reason: 'نجم ألماني من المانشافت' };
      }
      return { isValid: false, reason: 'ليس لاعباً ألمانياً' };

    case 'crit_005':
      if (player?.nationality === 'إنجلترا' || includesIn(['بيكهام', 'روني', 'كين', 'جيرارد', 'لامبارد', 'سكولز', 'تيري', 'فيرديناند', 'بيلينغهام', 'فودين', 'ساكا', 'اوين', 'شيرار', 'ووكر'])) {
        return { isValid: true, reason: 'نجم إنجليزي من مهد كرة القدم' };
      }
      return { isValid: false, reason: 'ليس لاعباً إنجليزياً' };

    case 'crit_006':
      if (player?.nationality === 'إسبانيا' || includesIn(['تشافي', 'انييستا', 'كاسياس', 'راموس', 'بويول', 'بيكيه', 'بوسكيتس', 'فيا', 'توريس', 'راؤول', 'رودري', 'بيدري', 'غافي', 'كارفاخال', 'الونسو'])) {
        return { isValid: true, reason: 'نجم إسباني من الماتادور' };
      }
      return { isValid: false, reason: 'ليس لاعباً إسبانياً' };

    case 'crit_007':
      if (player?.nationality === 'إيطاليا' || includesIn(['بوفون', 'مالديني', 'بيرلو', 'كانافارو', 'توتي', 'ديل بييرو', 'باجيو', 'نيستا', 'كيليني', 'بونوتشي', 'دوناروما', 'غاتوزو', 'دي روسي', 'بارتيز'])) {
        return { isValid: true, reason: 'نجم إيطالي من الآتزوري' };
      }
      return { isValid: false, reason: 'ليس لاعباً إيطالياً' };

    case 'crit_008':
      const africaNations = ['مصر', 'المغرب', 'الجزائر', 'تونس', 'السنغال', 'نيجيريا', 'الكاميرون', 'ساحل العاج', 'غانا', 'مالي'];
      if ((player?.nationality && africaNations.includes(player.nationality)) || includesIn(['صلاح', 'محرز', 'ماني', 'دروغبا', 'ايتو', 'حكيمي', 'بونو', 'اوسيمين', 'توريه', 'وياه', 'كوليبالي'])) {
        return { isValid: true, reason: 'نجم من القارة الأفريقية' };
      }
      return { isValid: false, reason: 'ليس من القارة الأفريقية' };

    case 'crit_009':
      const arabNations = ['السعودية', 'مصر', 'المغرب', 'الجزائر', 'تونس', 'العراق', 'الإمارات', 'قطر', 'الكويت', 'الأردن', 'عمان', 'البحرين'];
      if ((player?.nationality && arabNations.includes(player.nationality)) || includesIn(['سالم الدوسري', 'ماجد عبدالله', 'صلاح', 'محرز', 'حكيمي', 'بونو', 'زياش', 'العويس', 'الدعيع', 'السومة', 'النني', 'حجازي', 'ابوتريكة'])) {
        return { isValid: true, reason: 'نجم عربي أصيل' };
      }
      return { isValid: false, reason: 'ليس لاعباً عربياً' };

    case 'crit_010':
      if (player?.nationality === 'هولندا' || includesIn(['كرويف', 'فان باستن', 'فان داييك', 'روبن', 'فان بيرسي', 'سنايدر', 'سيدورف', 'فان در سار', 'بيركامب', 'خوليت', 'دي يونغ', 'ديباي'])) {
        return { isValid: true, reason: 'نجم هولندي من الطواحين' };
      }
      return { isValid: false, reason: 'ليس لاعباً هولندياً' };

    // 2. Leagues & Clubs (011 - 025)
    case 'crit_011':
      if (player?.clubs?.some((c) => ['مانشستر سيتي', 'مانشستر يونايتد', 'ليفربول', 'تشيلسي', 'أرسنال', 'توتنهام', 'نيوكاسل'].includes(c)) || includesIn(['رونالدو', 'صلاح', 'هنري', 'كين', 'دي بروين', 'هازارد', 'اغويرو', 'هالاند', 'كانتي', 'فان دايك'])) {
        return { isValid: true, reason: 'لعب في الدوري الإنجليزي الممتاز' };
      }
      return { isValid: false, reason: 'لم يلعب في البريميرليغ' };

    case 'crit_012':
      if (player?.clubs?.some((c) => ['ريال مدريد', 'برشلونة', 'أتلتيكو مدريد', 'إشبيلية', 'فالنسيا'].includes(c)) || includesIn(['ميسي', 'رونالدو', 'بنزيما', 'مودريتش', 'تشافي', 'انييستا', 'راموس', 'بيلينغهام', 'فينيسيوس'])) {
        return { isValid: true, reason: 'لعب في الدوري الإسباني (La Liga)' };
      }
      return { isValid: false, reason: 'لم يلعب في الليغا' };

    case 'crit_013':
      if (player?.clubs?.some((c) => ['يوفنتوس', 'إنتر ميلان', 'ميلان', 'روما', 'نابولي', 'لاتسيو'].includes(c)) || includesIn(['رونالدو', 'زيدان', 'ابراهيموفيتش', 'كاكا', 'بوفون', 'مالديني', 'بيرلو', 'ديبالا', 'لاوتارو'])) {
        return { isValid: true, reason: 'لعب في الدوري الإيطالي (Serie A)' };
      }
      return { isValid: false, reason: 'لم يلعب في الكالتشيو' };

    case 'crit_014':
      if (player?.clubs?.some((c) => ['بايرن ميونخ', 'بروسيا دورتموند', 'لايبزيغ', 'باير ليفركوزن'].includes(c)) || includesIn(['ليفاندوفسكي', 'نوير', 'مولر', 'هالاند', 'بيلينغهام', 'روبن', 'ريبيري', 'كروس'])) {
        return { isValid: true, reason: 'لعب في الدوري الألماني (Bundesliga)' };
      }
      return { isValid: false, reason: 'لم يلعب في البوندسليغا' };

    case 'crit_015':
      if (player?.clubs?.some((c) => ['باريس سان جيرمان', 'موناكو', 'مارسيليا', 'ليون', 'ليل'].includes(c)) || includesIn(['ميسي', 'نيمار', 'مبابي', 'ابراهيموفيتش', 'بنزيما', 'هازارد', 'كافاني', 'دي ماريا', 'راموس'])) {
        return { isValid: true, reason: 'لعب في الدوري الفرنسي (Ligue 1)' };
      }
      return { isValid: false, reason: 'لم يلعب في الدوري الفرنسي' };

    case 'crit_016':
      if (player?.clubs?.some((c) => ['الهلال', 'النصر', 'الاتحاد', 'الأهلي', 'الشباب', 'الاتفاق'].includes(c)) || includesIn(['رونالدو', 'بنزيما', 'نيمار', 'كانتي', 'محرز', 'بونو', 'سالم الدوسري', 'ميتروفيتش', 'سافيتش', 'نيفيز'])) {
        return { isValid: true, reason: 'لعب في دوري روشن السعودي' };
      }
      return { isValid: false, reason: 'لم يلعب في الدوري السعودي' };

    case 'crit_017':
      if (includesIn(['ميسي', 'بيكهام', 'ابراهيموفيتش', 'هنري', 'كاكا', 'فيلا', 'بيرلو', 'لامبارد', 'جيرارد', 'روني', 'سواريز', 'بوسكيتس', 'البا'])) {
        return { isValid: true, reason: 'خاض تجربة في الدوري الأمريكي (MLS)' };
      }
      return { isValid: false, reason: 'لم يلعب في الدوري الأمريكي' };

    case 'crit_019':
      if (includesIn(['ابراهيموفيتش', 'رونالدو نازاريو', 'بيرلو', 'سيدورف', 'كريسبو', 'فييري', 'بالوتيلي', 'بونوتشي', 'مالديني', 'خافيير زانيتي', 'ميليتو', 'كاكا'])) {
        return { isValid: true, reason: 'مثل قطبي ميلانو (إنتر أو ميلان)' };
      }
      return { isValid: false, reason: 'لم يمثل إنتر أو ميلان' };

    case 'crit_020':
      if (includesIn(['ميسي', 'رونالدو', 'بنزيما', 'مودريتش', 'تشافي', 'انييستا', 'راموس', 'بويول', 'بيكيه', 'زيدان', 'فيغو', 'رونالدو الظاهرة', 'فينيسيوس', 'بيلينغهام', 'كروس', 'كاسياس'])) {
        return { isValid: true, reason: 'مثل ريال مدريد أو برشلونة' };
      }
      return { isValid: false, reason: 'لم يلعب لريال مدريد أو برشلونة' };

    case 'crit_021':
      if (includesIn(['رونالدو', 'جيرارد', 'صلاح', 'روني', 'فان دايك', 'سواريز', 'سكولز', 'فيرديناند', 'توري', 'اوين', 'ماني', 'اليسون', 'بيكهام', 'غيغز'])) {
        return { isValid: true, reason: 'مثل مانشستر يونايتد أو ليفربول' };
      }
      return { isValid: false, reason: 'لم يلعب لليونايتد أو ليفربول' };

    case 'crit_022':
      if (includesIn(['ليفاندوفسكي', 'هالاند', 'نوير', 'مولر', 'بيلينغهام', 'رويس', 'روبن', 'ريبيري', 'غوتزه', 'هوملز', 'كروس', 'كان'])) {
        return { isValid: true, reason: 'مثل بايرن ميونخ أو بروسيا دورتموند' };
      }
      return { isValid: false, reason: 'لم يلعب للبايرن أو دورتموند' };

    case 'crit_024':
      if (includesIn(['توتي', 'مالديني', 'بويول', 'غيغز', 'سكولز', 'كاراغر', 'نيستا'])) {
        return { isValid: true, reason: 'قضى مسيرته في نادٍ واحد (وفاء مطلق)' };
      }
      return { isValid: false, reason: 'لعب لأكثر من نادٍ في مسيرته' };

    case 'crit_025':
      if (includesIn(['ميسي', 'تشافي', 'انييستا', 'بوسكيتس', 'دي بروين', 'هالاند', 'رودري', 'برناردو سيلفا', 'روبن', 'ريبيري', 'نوير', 'الابا', 'فودين', 'ووكر', 'سيرجيو اغويرو', 'كومباني', 'الفيس'])) {
        return { isValid: true, reason: 'لعب تحت قيادة الفيلسوف بيب غوارديولا' };
      }
      return { isValid: false, reason: 'لم يلعب تحت قيادة غوارديولا' };

    // 3. Tactical Roles & Positions (026 - 040)
    case 'crit_026':
    case 'crit_034':
    case 'crit_043':
      if (includesIn(GK_LIST) || player?.position === 'GK') {
        return { isValid: true, reason: 'حارس مرمى في تاريخ اللعبة' };
      }
      return { isValid: false, reason: 'ليس حارس مرمى' };

    case 'crit_027':
    case 'crit_028':
    case 'crit_033':
      if (includesIn(DEF_LIST) || player?.position === 'DEF') {
        return { isValid: true, reason: 'مدافع تاريخي صلب' };
      }
      return { isValid: false, reason: 'ليس مدافعاً' };

    case 'crit_029':
    case 'crit_030':
    case 'crit_035':
      if (includesIn(MID_LIST) || player?.position === 'MID') {
        return { isValid: true, reason: 'لاعب خط وسط تكتيكي' };
      }
      return { isValid: false, reason: 'ليس لاعب خط وسط' };

    case 'crit_031':
    case 'crit_032':
      if (includesIn(FWD_LIST) || player?.position === 'FWD') {
        return { isValid: true, reason: 'مهاجم أو جناح هجومي' };
      }
      return { isValid: false, reason: 'ليس مهاجماً أو جناحاً' };

    case 'crit_037':
      if (includesIn(LEFTHANDED_FOOT) || includesIn(['ميسي', 'صلاح', 'مارادونا', 'روبن', 'دي ماريا', 'غريزمان', 'هالاند', 'روبرتو كارلوس', 'محرز', 'فان بيرسي', 'ديبالا', 'البا'])) {
        return { isValid: true, reason: 'لاعب أعسر يلعب بالقدم اليسرى' };
      }
      return { isValid: false, reason: 'ليس لاعباً أعسر' };

    case 'crit_040':
      if (includesIn(CAPTAINS) || includesIn(['ميسي', 'رونالدو', 'راموس', 'كاسياس', 'بوفون', 'كانافارو', 'مارادونا', 'مودريتش', 'فان دايك', 'جيرارد', 'بويول', 'تيري', 'سالم الدوسري'])) {
        return { isValid: true, reason: 'قائد ارتدى شارة القيادة لفترة طويلة' };
      }
      return { isValid: false, reason: 'لم يشتهر بحمل شارة القيادة' };

    // 4. Skills (041 - 055)
    case 'crit_041':
      if (includesIn(['جونينيو', 'بيكهام', 'ميسي', 'رونالدينيو', 'بيرلو', 'رونالدو', 'روبرتو كارلوس', 'ميهايلوفيتش', 'مارادونا', 'زيكو', 'ديل بييرو', 'سالم الدوسري', 'شنايدر'])) {
        return { isValid: true, reason: 'متخصص ركلات حرة مباشرة' };
      }
      return { isValid: false, reason: 'لم يشتهر بالركلات الحرة المباشرة' };

    case 'crit_051':
      if (includesIn(SHIRT_7) || includesIn(['رونالدو', 'كريستيانو', 'بيكهام', 'راؤول', 'فيغو', 'كانتونا', 'ديبروين', 'سون', 'فينيسيوس', 'ديمبيلي', 'ساكا', 'غريزمان'])) {
        return { isValid: true, reason: 'ارتدى القميص رقم 7 الأيقوني' };
      }
      return { isValid: false, reason: 'لم يشتهر بارتداء الرقم 7' };

    case 'crit_052':
      if (includesIn(['رونالدو الظاهرة', 'بنزيما', 'ليفاندوفسكي', 'سواريز', 'هالاند', 'ابراهيموفيتش', 'كين', 'ايتو', 'توريس', 'موراتا', 'فالكاو'])) {
        return { isValid: true, reason: 'ارتدى القميص رقم 9 الأيقوني' };
      }
      return { isValid: false, reason: 'لم يشتهر بارتداء الرقم 9' };

    case 'crit_053':
      if (includesIn(SHIRT_10) || includesIn(['ميسي', 'مارادونا', 'بيليه', 'زيدان', 'مودريتش', 'رونالدينيو', 'نيمار', 'مبابي', 'توتي', 'باجيو', 'سالم الدوسري', 'محرز'])) {
        return { isValid: true, reason: 'ارتدى القميص رقم 10 الأيقوني' };
      }
      return { isValid: false, reason: 'لم يشتهر بارتداء الرقم 10' };

    // 7. Trophies & Milestones (086 - 100)
    case 'crit_086':
      if (includesIn(WORLD_CUP_WINNERS) || player?.trophies?.some((t) => t.includes('كأس العالم'))) {
        return { isValid: true, reason: 'فائز ببطولة كأس العالم' };
      }
      return { isValid: false, reason: 'لم يفز بكأس العالم' };

    case 'crit_088':
      if (player?.trophies?.some((t) => t.includes('أبطال')) || includesIn(['ميسي', 'رونالدو', 'بنزيما', 'كروس', 'مودريتش', 'راموس', 'كاسياس', 'بيكيه', 'تشافي', 'انييستا', 'بويول', 'نيمار', 'فينيسيوس', 'هالاند', 'دي بروين', 'ليفاندوفسكي'])) {
        return { isValid: true, reason: 'فائز بدوري أبطال أوروبا' };
      }
      return { isValid: false, reason: 'لم يرفع لقب دوري الأبطال' };

    case 'crit_089':
      if (includesIn(['ميسي', 'رونالدو', 'بنزيما', 'مودريتش', 'كاكا', 'كانافارو', 'شيفشينكو', 'ندفيد', 'رونالدو الظاهرة', 'ريفالدو', 'زيدان', 'فيغو', 'اوين', 'باجيو', 'فان باستن', 'بلاتيني', 'بيليه', 'مارادونا', 'رونالدينيو'])) {
        return { isValid: true, reason: 'فائز بجائزة الكرة الذهبية (Ballon d\'Or)' };
      }
      return { isValid: false, reason: 'لم يتوج بالكرة الذهبية' };

    case 'crit_091':
      if (includesIn(['ميسي', 'دي ماريا', 'نيمار', 'سواريز', 'الفيس', 'سانشيز', 'رونالدو', 'رونالدينيو', 'ريفالدو', 'روماريو', 'كافو', 'روبرتو كارلوس', 'مارتينيز', 'لاوتارو'])) {
        return { isValid: true, reason: 'فائز ببطولة كوبا أمريكا' };
      }
      return { isValid: false, reason: 'لم يفز بكوبا أمريكا' };

    case 'crit_092':
      if (includesIn(['كريستيانو رونالدو', 'تشافي', 'انييستا', 'كاسياس', 'راموس', 'بويول', 'كيليني', 'بونوتشي', 'دوناروما', 'زيدان', 'بلاتيني', 'فان باستن', 'رودري', 'كارفاخال', 'موراتا', 'يامال'])) {
        return { isValid: true, reason: 'فائز ببطولة كأس أمم أوروبا (اليورو)' };
      }
      return { isValid: false, reason: 'لم يفز باليورو' };

    case 'crit_093':
      if (includesIn(['صلاح', 'ماني', 'محرز', 'ايتو', 'دروغبا', 'توريه', 'بونو', 'حكيمي', 'ابوتريكة', 'حجي'])) {
        return { isValid: true, reason: 'فائز بكأس أمم أفريقيا' };
      }
      return { isValid: false, reason: 'لم يفز بكأس أمم أفريقيا' };

    case 'crit_095':
      if (includesIn(['ميسي', 'تشافي', 'انييستا', 'بويول', 'بيكيه', 'بوسكيتس', 'الفيس', 'هنري', 'ايتو', 'سيدورف', 'ميليتو', 'شنايدر', 'زانيتي', 'مولر', 'نوير', 'ريبيري', 'روبن', 'دي بروين', 'هالاند', 'رودري', 'برناردو', 'غوندوغان', 'سكولز', 'بيكهام'])) {
        return { isValid: true, reason: 'حقق الثلاثية التاريخية في موسم واحد' };
      }
      return { isValid: false, reason: 'لم يحقق الثلاثية التاريخية' };

    case 'crit_100':
      if (includesIn(['كروس', 'كريستيانو', 'رونالدو', 'سيدورف', 'بيكيه', 'ايتو', 'الونسو', 'ديشان', 'كوفاسيتش', 'الابا', 'شاكيري', 'ستوريدج'])) {
        return { isValid: true, reason: 'فاز بدوري أبطال أوروبا مع ناديين مختلفين' };
      }
      return { isValid: false, reason: 'لم يتوج بدوري الأبطال مع ناديين مختلفين' };

    // Legacy Criteria Mappings
      if (includesIn(['كروس', 'كريستيانو', 'رونالدو', 'سيدورف', 'بيكيه', 'ايتو', 'الونسو', 'ديشان', 'كوفاسيتش', 'الابا', 'شاكيري', 'ستوريدج'])) {
        return { isValid: true, reason: 'توج بدوري الأبطال مع ناديين مختلفين' };
      }
      return { isValid: false, reason: 'لم يتوج بدوري الأبطال مع ناديين مختلفين' };

    case 'crit_top_scorer_country':
      if (includesIn(['رونالدو', 'ميسي', 'نيمار', 'كين', 'ماجد عبدالله', 'صلاح', 'سواريز', 'دروغبا', 'ايتو', 'ليفاندوفسكي', 'لوكاكو', 'دزيكو', 'ابراهيموفيتش', 'كلوزه', 'فيا'])) {
        return { isValid: true, reason: 'الهداف التاريخي لمنتخب بلاده' };
      }
      return { isValid: false, reason: 'ليس الهداف التاريخي الأول لمنتخبه' };

    case 'crit_seriea_laliga':
      if (includesIn(['رونالدو', 'زيدان', 'ابراهيموفيتش', 'كانافارو', 'فيغو', 'موراتا', 'سيدورف', 'اليسون', 'تياغو سيلفا', 'الفيس', 'هيغواين', 'دي ماريا', 'كاكا', 'سانشيز', 'رونالدينيو', 'ريفالدو', 'كوفاسيتش'])) {
        return { isValid: true, reason: 'لعب في الدوري الإيطالي والدوري الإسباني' };
      }
      return { isValid: false, reason: 'لم يلعب في كلا الدوريين (الإيطالي والإسباني)' };

    case 'crit_ballon_dor_podium':
      if (includesIn(['ميسي', 'رونالدو', 'كريستيانو', 'بنزيما', 'مودريتش', 'تشافي', 'انييستا', 'كاكا', 'ريبيري', 'هالاند', 'فينيسيوس', 'ليفاندوفسكي', 'زيدان', 'رونالدينيو', 'هنري', 'كانافارو', 'بوفون', 'نيمار', 'غريزمان', 'صلاح', 'فان دايك', 'شيفشينكو', 'ندفيد', 'اوين', 'ريفالدو', 'فيغو', 'مبابي'])) {
        return { isValid: true, reason: 'صعد منصة التتويج بالكرة الذهبية' };
      }
      return { isValid: false, reason: 'لم يصل للمراكز الثلاثة الأولى في الكرة الذهبية' };

    case 'crit_defender_mid_50_goals':
      if (includesIn(['راموس', 'لامبارد', 'جيرارد', 'كومان', 'تيري', 'سكولز', 'روبرتو كارلوس', 'هييرو', 'بلان', 'بيرلو', 'دي بروين', 'بالاك', 'سيسك', 'فيدال', 'بيلينغهام', 'بيكيه'])) {
        return { isValid: true, reason: 'سجل أكثر من 50 هدفاً من الخط الخلفي أو الوسط' };
      }
      return { isValid: false, reason: 'لم يتجاوز 50 هدفاً رسمياً كلاعب وسط أو دفاع' };

    case 'crit_world_cup_gk':
      if (includesIn(['نوير', 'بوفون', 'كاسياس', 'مارتينيز', 'لوريس', 'بارتيز', 'زوف', 'ماير', 'تافاريل'])) {
        return { isValid: true, reason: 'حارس مرمى فائز بكأس العالم' };
      }
      return { isValid: false, reason: 'حارس لم يتوج بلقب كأس العالم' };

    case 'crit_real_and_barca':
      if (includesIn(['فيغو', 'رونالدو', 'لاودروب', 'انريكي', 'سافيولا', 'ايتو', 'هاجي'])) {
        return { isValid: true, reason: 'لعب لكلا الغريمين ريال مدريد وبرشلونة' };
      }
      return { isValid: false, reason: 'لم يلعب لريال مدريد وبرشلونة معاً' };

    case 'crit_pl_golden_boot':
      if (includesIn(['صلاح', 'هنري', 'كين', 'اغويرو', 'سواريز', 'دروغبا', 'سون', 'هالاند', 'فان بيرسي', 'روني', 'رونالدو', 'اوين', 'انيلكا', 'تيفيز', 'ماني', 'فاردي', 'اوباميانغ'])) {
        return { isValid: true, reason: 'فاز بالحذاء الذهبي كهداف للدوري الإنجليزي' };
      }
      return { isValid: false, reason: 'لم يفز بلقب هداف الدوري الإنجليزي الممتاز' };

    case 'crit_world_cup_and_ucl':
      if (includesIn(['زيدان', 'كاسياس', 'راموس', 'بيكيه', 'تشافي', 'انييستا', 'بويول', 'ميسي', 'كروس', 'مولر', 'روبرتو كارلوس', 'ريفالدو', 'رونالدينيو', 'فاران', 'بوسكيتس', 'نوير', 'دي ماريا', 'الفاريز', 'هنري', 'بيرلو'])) {
        return { isValid: true, reason: 'جمع بين لقبي كأس العالم ودوري أبطال أوروبا' };
      }
      return { isValid: false, reason: 'لم يجمع بين كأس العالم ودوري أبطال أوروبا' };

    case 'crit_roshn_and_europe':
      if (includesIn(['رونالدو', 'بنزيما', 'نيمار', 'كانتي', 'محرز', 'ميندي', 'فابينيو', 'بونو', 'فيرمينو', 'سافيتش', 'نيفيز', 'لابورت', 'كيسي', 'ميتروفيتش'])) {
        return { isValid: true, reason: 'لعب في دوري روشن ودوري أبطال أوروبا' };
      }
      return { isValid: false, reason: 'لم يشارك في كل من دوري روشن ودوري أبطال أوروبا' };

    case 'crit_treble_winner':
      if (includesIn(['ميسي', 'تشافي', 'انييستا', 'بويول', 'بيكيه', 'بوسكيتس', 'الفيس', 'هنري', 'ايتو', 'سيدورف', 'ميليتو', 'شنايدر', 'زانيتي', 'مولر', 'نوير', 'ريبيري', 'روبن', 'دي بروين', 'هالاند', 'رودري', 'برناردو', 'غوندوغان', 'ووكر', 'سيلفا', 'غيغز', 'سكولز', 'بيكهام'])) {
        return { isValid: true, reason: 'توج بالثلاثية التاريخية في موسم واحد' };
      }
      return { isValid: false, reason: 'لم يحقق الثلاثية التاريخية مع ناديه' };

    case 'crit_freekick_legend':
      if (includesIn(['جونينيو', 'بيكهام', 'ميسي', 'رونالدينيو', 'بيرلو', 'رونالدو', 'روبرتو كارلوس', 'ميهايلوفيتش', 'مارادونا', 'ديل بييرو', 'سالم الدوسري'])) {
        return { isValid: true, reason: 'أسطورة تسجيل الركلات الحرة المباشرة' };
      }
      return { isValid: false, reason: 'لم يشتهر بتسجيل ركلات حرة مباشرة كثيرة' };

    case 'crit_one_club_legend':
      if (includesIn(['توتي', 'مالديني', 'غيغز', 'سكولز', 'بويول', 'كاراغر', 'نيستا'])) {
        return { isValid: true, reason: 'أسطورة نادي واحد (One-Club Man)' };
      }
      return { isValid: false, reason: 'لعب لأكثر من نادٍ في مسيرته الاحترافية' };

    case 'crit_african_legend':
      if (includesIn(['ايتو', 'دروغبا', 'صلاح', 'ماني', 'توريه', 'محرز', 'وياه', 'اوسيمين', 'كانو', 'بونو', 'حكيمي'])) {
        return { isValid: true, reason: 'أسطورة أفريقية متوجة بأفضل لاعب في أفريقيا' };
      }
      return { isValid: false, reason: 'لم يتوج بجائزة أفضل لاعب في أفريقيا' };

    case 'crit_south_american_copa':
      if (includesIn(['ميسي', 'دي ماريا', 'نيمار', 'سواريز', 'الفيس', 'سانشيز', 'رونالدو', 'رونالدينيو', 'ريفالدو', 'روماريو', 'كافو', 'روبرتو كارلوس', 'مارتينيز', 'لاوتارو', 'فالفيردي'])) {
        return { isValid: true, reason: 'نجم لاتيني متوج بلقب كوبا أمريكا' };
      }
      return { isValid: false, reason: 'لم يفز بلقب بطولة كوبا أمريكا' };

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
 * AI verification result for an individual pick
 */
export interface SinglePickAIResult {
  isValid: boolean;
  points: number;
  comment: string;
}

/**
 * Strict single-pick AI verification adhering to Coach instructions
 */
export async function verifySinglePickWithAI(
  playerName: string,
  slotKey: CoachSlotKey,
  criterion: { title: string; description: string }
): Promise<SinglePickAIResult> {
  const slotPosition = COACH_SLOT_CONFIG[slotKey]?.label || slotKey;

  const prompt = `أنت "الشبح المدرب"؛ حكم ومحلل كروي عالمي صارم جداً ولا يقبل الخطأ.
الشرط المطلوب في الجولة: [ ${criterion.title} - ${criterion.description} ]
المركز المحدد: [ ${slotPosition} ]
اللاعب المختار: [ ${playerName} ]

القواعد الصارمة:
1. تحقق تاريخياً بدقة تامة: هل تنطبق مواصفات أو إنجازات الشرط على هذا اللاعب فعلياً؟
2. إذا كان اللاعب لا يطابق الشرط تماماً (أو تشابه أسماء أو معلومة مغلوطة): ارفضه فوراً (isValid: false) مع تعليق مدرب ساخر ومقتضب يوضح خطأه.
3. هل المركز المختار منطقي ومقبول للاعب؟ (لا تقبل وضع حارس في الهجوم أو العكس).

أرجع JSON فقط:
{
  "isValid": true/false,
  "points": 10 أو 0,
  "comment": "تعليق فني مقتضب وصارم (أقل من 6 كلمات)"
}`;

  try {
    const responseText = await generateWithGemini(prompt, {
      temperature: 0.2,
      jsonMode: true,
      maxOutputTokens: 250,
    });

    if (responseText) {
      const parsed = JSON.parse(responseText);
      const isValid = Boolean(parsed.isValid && (parsed.points === 10 || parsed.points > 0));
      return {
        isValid,
        points: isValid ? 10 : 0,
        comment: parsed.comment || (isValid ? 'متطابق تكتيكياً وتاريخياً' : 'مخالف للشرط والمركز'),
      };
    }
  } catch (err) {
    console.warn('[verifySinglePickWithAI] Gemini error:', err);
  }

  return {
    isValid: false,
    points: 0,
    comment: 'تعذر التحقق التلقائي',
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
        slotKey: slotKey as CoachSlotKey,
        slotPosition: COACH_SLOT_CONFIG[slotKey as CoachSlotKey]?.label || slotKey,
        playerName: pick?.playerName || 'خانة فارغة',
        conditionTitle: pick?.conditionTitle || '',
        conditionDescription: pick?.conditionPrompt || pick?.conditionTitle || '',
      })),
    }));

    const systemPrompt = `
أنت "الشبح المدرب"؛ حكم ومحلل كروي عالمي صارم جداً ولا يقبل الخطأ.
مهمتك: التدقيق الصارم في اختيارات المتسابقين وتشكيلاتهم الخماسية بعد انتهاء الجولات.

القواعد الصارمة:
1. تحقق تاريخياً بدقة تامة: هل تنطبق مواصفات أو إنجازات الشرط المطلوب على كل لاعب تم اختياره؟
2. إذا كان اللاعب لا يطابق الشرط تماماً (أو تشابه أسماء أو خانة فارغة أو معلومة مغلوطة): ارفضه فوراً (isValid: false, points: 0) مع تعليق فني ساخر ومقتضب يوضح خطأه (أقل من 6 كلمات).
3. هل المركز المحدد منطقي ومقبول للاعب؟ (لا تقبل وضع حارس في الهجوم أو العكس). إذا كان المركز غير منطقي: ارفضه فوراً (isValid: false, points: 0).
4. في حال تطابق الشرط والمركز تماماً: اجعل (isValid: true, points: 10) مع تعليق إشادة فني مقتضب (أقل من 6 كلمات).
5. لكل متسابق، ضع تعليقاً تكتيكياً ساخراً لاذعاً ومقتضباً (critique) بالعامية يجلد العك الكروي أو يمدح التكتيك.

أرجع JSON فقط بالهيكل التالي:
{
  "winnerPlayerId": "string",
  "coachBanner": "string (سطر إعلان البطل بحماس كروي صارم بدون أي إيموجي)",
  "evaluations": [
    {
      "playerId": "string",
      "critique": "string (تعليق ساخر لاذع بالعامية)",
      "slots": [
        {
          "slotKey": "GK",
          "isValid": true,
          "points": 10,
          "comment": "string"
        }
      ]
    }
  ]
}
`.trim();

    const userPrompt = `التشكيلات المقدمة:\n${JSON.stringify(squadsData, null, 2)}`;

    const responseText = await generateWithGemini(userPrompt, {
      systemPrompt,
      temperature: 0.2,
      jsonMode: true,
      maxOutputTokens: 1600,
    });

    if (responseText) {
      const parsed = JSON.parse(responseText);
      if (parsed?.evaluations && Array.isArray(parsed.evaluations)) {
        parsed.evaluations.forEach((aiEval: any) => {
          const match = deterministicVerdict.evaluations.find(
            (e) => e.playerId === aiEval.playerId
          );
          if (!match) return;

          if (aiEval.critique) {
            match.critique = aiEval.critique;
          }

          if (aiEval.slots && Array.isArray(aiEval.slots)) {
            let validConditionsCount = 0;
            let validPositionsCount = 0;
            let totalPowerSum = 0;

            aiEval.slots.forEach((aiSlot: any) => {
              const currentSlot = match.slots[aiSlot.slotKey as CoachSlotKey];
              if (!currentSlot) return;

              const isSlotValid = Boolean(aiSlot.isValid && (aiSlot.points === 10 || aiSlot.points > 0));
              if (isSlotValid) {
                currentSlot.isValidCondition = true;
                currentSlot.isValidPosition = true;
                if (aiSlot.comment) currentSlot.conditionReason = aiSlot.comment;
                validConditionsCount += 1;
                validPositionsCount += 1;
                totalPowerSum += currentSlot.playerPower > 0 ? currentSlot.playerPower : 75;
              } else {
                currentSlot.isValidCondition = false;
                currentSlot.isValidPosition = false;
                currentSlot.playerPower = 0;
                if (aiSlot.comment) {
                  currentSlot.conditionReason = aiSlot.comment;
                  currentSlot.positionReason = aiSlot.comment;
                }
              }
            });

            match.conditionPoints = validConditionsCount * 8;
            match.positionPoints = validPositionsCount * 5;
            match.powerPoints = Math.round((totalPowerSum / 5) * 0.35);
            match.totalPercentage = Math.min(
              100,
              Math.max(0, match.conditionPoints + match.positionPoints + match.powerPoints)
            );
          }
        });

        // Re-sort evaluations based on updated totalPercentage
        deterministicVerdict.evaluations.sort((a, b) => {
          if (b.totalPercentage !== a.totalPercentage) return b.totalPercentage - a.totalPercentage;
          if (b.conditionPoints !== a.conditionPoints) return b.conditionPoints - a.conditionPoints;
          return b.positionPoints - a.positionPoints;
        });

        // Reassign ranks
        deterministicVerdict.evaluations.forEach((item, idx) => {
          item.rank = idx + 1;
          if (idx === 0) item.matchPointsAwarded = 5;
          else if (idx === 1) item.matchPointsAwarded = 3;
          else if (idx === 2) item.matchPointsAwarded = 1;
          else item.matchPointsAwarded = 0;
        });

        const newWinner = deterministicVerdict.evaluations[0];
        if (newWinner) {
          deterministicVerdict.winnerId = newWinner.playerId;
          deterministicVerdict.winnerName = newWinner.playerName;
          deterministicVerdict.winnerScore = newWinner.totalPercentage;
          deterministicVerdict.coachBanner =
            parsed.coachBanner ||
            `بطل التشكيلات: ${newWinner.playerName} بنسبة قوة ${formatPercent(newWinner.totalPercentage)}!`;
        }
      }
    }
  } catch (err) {
    console.warn('[Coach AI Evaluation] Fallback to deterministic evaluation:', err);
  }

  return deterministicVerdict;
}

