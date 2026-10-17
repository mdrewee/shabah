import {
  DraftContestant,
  SquadAIEvaluation,
  SquadEvaluationResult,
  DraftVerdictResult,
  PlayerConditionVerification,
  PlayerSquad,
  DRAFT_SLOTS_ORDER,
  DraftPosition,
} from '../pages/football/draft-5/types';
import { DraftCondition, DRAFT_CONDITIONS_BANK } from '../data/draftConditions';
import { FootballPlayer, FOOTBALL_PLAYERS_MASTER } from '../data/footballMasterData';
import { normalizeArabicFootball } from './footballHistoryEngine';

export type { SquadEvaluationResult };

/**
 * ============================================================================
 *  Built-in Tactical AI Evaluator — "كوّن فريقك"
 * ============================================================================
 *  100% local, synchronous and deterministic. No network / LLM dependency, so
 *  the TV evaluation screen can never hang or stay blank.
 *
 *  4 criteria per squad:
 *   1. Condition Adherence  — did each pick satisfy the condition of its slot?
 *   2. Position Fit         — real GK in GK, DEF in DEF, MID in MID, FWD in FWD.
 *   3. Tactical Strength %  — 50 base, +8/condition, +2/position,
 *                             -15 outfield-GK, +1..+3 legends, clamp 30..99.
 *   4. Pundit Critique      — witty Arabic breakdown driven by line ratings.
 *
 *  Winner: most valid conditions → highest strength % → most valid positions.
 * ============================================================================
 */

type NaturalPos = 'GK' | 'DEF' | 'MID' | 'FWD';

const norm = (s: string) => normalizeArabicFootball(s || '');

// ---------------------------------------------------------------------------
// Player resolution (never trust stub pick objects for position/attributes)
// ---------------------------------------------------------------------------
let MASTER_INDEX: Map<string, FootballPlayer> | null = null;

function getMasterIndex(): Map<string, FootballPlayer> {
  if (MASTER_INDEX) return MASTER_INDEX;
  MASTER_INDEX = new Map();
  FOOTBALL_PLAYERS_MASTER.forEach((p) => {
    MASTER_INDEX!.set(norm(p.name), p);
    (p.aliases || []).forEach((a) => {
      const k = norm(a);
      if (k && !MASTER_INDEX!.has(k)) MASTER_INDEX!.set(k, p);
    });
  });
  return MASTER_INDEX;
}

export function resolvePlayerFromDB(name: string): FootballPlayer | null {
  if (!name) return null;
  const key = norm(name);
  const idx = getMasterIndex();
  const exact = idx.get(key);
  if (exact) return exact;
  if (key.length >= 4) {
    for (const p of FOOTBALL_PLAYERS_MASTER) {
      const pn = norm(p.name);
      if (pn.includes(key) || key.includes(pn)) return p;
    }
  }
  return null;
}

/** Haystack of every known spelling of the player (normalized). */
function nameHaystack(name: string, dbPlayer: FootballPlayer | null): string {
  return [name, dbPlayer?.name || '', ...(dbPlayer?.aliases || [])].map(norm).join(' | ');
}

function matchesAny(haystack: string, list: string[]): boolean {
  return list.some((n) => haystack.includes(norm(n)));
}

// ---------------------------------------------------------------------------
// Knowledge lists (heuristics for attributes the DB does not store)
// ---------------------------------------------------------------------------
const GK_NAMES = ['بوفون', 'كاسياس', 'نوير', 'كورتوا', 'أليسون', 'إيدرسون', 'دي خيا', 'ياسين بونو', 'العويس', 'المعيوف', 'تير شتيغن', 'دوناروما', 'نافاس', 'بارتيز', 'بيتر تشيك', 'لوريس', 'أوليفر كان', 'أوبلاك', 'إيميليانو مارتينيز', 'أونانا', 'رامسديل', 'سومر', 'مينيان', 'شيزني', 'ياشين', 'شمايكل', 'فان در سار', 'زوف', 'الحبسي', 'الدعيع', 'الشناوي', 'الحضري'];
const DEF_NAMES = ['مالديني', 'راموس', 'فان دايك', 'بويول', 'كانافارو', 'بيكيه', 'تياغو سيلفا', 'كوليبالي', 'مارسيلو', 'ألفيس', 'أرنولد', 'روبرتسون', 'روبن دياز', 'البليهي', 'هوساوي', 'حجازي', 'والكر', 'حكيمي', 'نيستا', 'تيري', 'فيرديناند', 'بيبي', 'فاران', 'ماركينيوس', 'فيليب لام', 'روبرتو كارلوس', 'زانيتي', 'كافو', 'نيفيل', 'كيميش', 'ألابا', 'دافيز', 'ساليبا', 'تشيلليني', 'بونوتشي', 'كيليني', 'ستونز', 'غفارديول', 'ثيو هيرنانديز', 'ألبا', 'كارفاخال', 'روديغر', 'الشهراني', 'غريب', 'عبدالحميد'];
const MID_NAMES = ['زيدان', 'مودريتش', 'تشافي', 'إنييستا', 'كروس', 'دي بروين', 'كانتي', 'كاسيميرو', 'بوسكيتس', 'بيرلو', 'جيرارد', 'لامبارد', 'سافيتش', 'نيفيز', 'سالم الدوسري', 'عطيف', 'بوغبا', 'رودري', 'فالفيردي', 'بيلينغهام', 'بيدري', 'غافي', 'شفاينشتايغر', 'سكولز', 'فييرا', 'كاكا', 'رونالدينيو', 'ريكيلمي', 'فيراتي', 'كوفاتشيتش', 'تونالي', 'باريلا', 'برونو فيرنانديز', 'أوديغارد', 'كيميتش', 'فرينكي دي يونغ', 'تشواميني', 'كامافينغا', 'غوندوغان', 'المالكي', 'محمد كنو'];
const LEGENDS = ['ميسي', 'كريستيانو رونالدو', 'رونالدو نازاريو', 'زيدان', 'مارادونا', 'بيليه', 'رونالدينيو', 'كرويف', 'بيكنباور', 'مالديني', 'هنري', 'إنييستا', 'تشافي', 'مودريتش', 'بوفون', 'كاكا', 'بلاتيني', 'فان باستن', 'دي ستيفانو', 'بوشكاش', 'إيبوسيبيو', 'ياشين', 'كانافارو', 'راؤول', 'توتي', 'بيرلو', 'نوير', 'راموس', 'صلاح', 'ليفاندوفسكي', 'بنزيما', 'مبابي', 'هالاند', 'نيمار', 'سامي الجابر', 'ماجد عبدالله'];

const AFRICA = ['مصر', 'المغرب', 'الجزائر', 'تونس', 'السنغال', 'نيجيريا', 'الكاميرون', 'غانا', 'ساحل العاج', 'كوت ديفوار', 'مالي', 'غينيا', 'الغابون', 'الجابون', 'جنوب أفريقيا', 'الكونغو', 'توغو', 'بوركينا فاسو', 'زامبيا', 'ليبيا', 'السودان', 'إثيوبيا', 'كينيا', 'أنغولا', 'الرأس الأخضر', 'بنين', 'زيمبابوي'];
const SOUTH_AMERICA = ['البرازيل', 'الأرجنتين', 'الأوروغواي', 'أوروجواي', 'كولومبيا', 'تشيلي', 'الإكوادور', 'الباراغواي', 'باراجواي', 'بيرو', 'فنزويلا', 'بوليفيا'];
const ASIA = ['السعودية', 'اليابان', 'كوريا', 'إيران', 'العراق', 'الإمارات', 'قطر', 'الصين', 'أستراليا', 'الأردن', 'سوريا', 'الكويت', 'عمان', 'البحرين', 'أوزبكستان', 'تايلاند', 'فيتنام', 'الهند', 'لبنان', 'فلسطين', 'اليمن', 'ماليزيا', 'إندونيسيا'];
const NON_EURO_CLUBS = ['الهلال', 'النصر', 'الاتحاد', 'الأهلي', 'الشباب', 'الاتفاق', 'القادسية', 'التعاون', 'الفيحاء', 'ضمك', 'الرائد', 'الخليج', 'الفتح', 'الوحدة', 'الرياض', 'الأخدود', 'الفتح', 'السد', 'الدحيل', 'الريان', 'العربي', 'الغرافة', 'العين', 'شباب الأهلي', 'إنتر ميامي', 'لوس أنجلوس', 'نيويورك', 'تورونتو', 'شيكاغو', 'بوكا جونيورز', 'ريفر بليت', 'سانتوس', 'فلامنغو', 'بالميراس', 'ساو باولو', 'كورينثيانز', 'غريميو', 'نيولز', 'إنترناسيونال', 'فلومينينسي', 'بوتافوغو', 'أتلتيكو مينيرو', 'كروزيرو', 'فاسكو', 'غوانزو', 'شنغهاي', 'بكين', 'الزمالك', 'الوداد', 'الرجاء', 'الترجي', 'صن داونز', 'مازيمبي', 'أوراوا', 'كاشيما', 'فيسيل كوبي'];
const ROSHN_CLUBS = ['الهلال', 'النصر', 'الاتحاد', 'الأهلي', 'الشباب', 'الاتفاق', 'القادسية', 'التعاون', 'الفيحاء', 'ضمك', 'الرائد', 'الخليج', 'الفتح', 'الوحدة', 'الرياض', 'الأخدود', 'الفيصلي', 'الحزم', 'العروبة', 'الخلود', 'النجمة'];

const COND_LISTS: Record<string, string[]> = {
  c_bald: ['زيدان', 'آريين روبن', 'كانتي', 'كومباني', 'ستام', 'بارتيز', 'هنري', 'بيبي', 'سكيرتل', 'كولاروف', 'رونالدو نازاريو', 'روبرتو كارلوس', 'غاتوزو', 'كولينا', 'شيلفي', 'ماركينيوس'],
  c_afro: ['فيلايني', 'كوكوريا', 'ساني', 'مارسيلو', 'ديفيد لويز', 'فالديراما', 'كولوتشيني', 'غوندوزي', 'ويليان', 'بوغبا', 'ريكارد', 'رود خوليت', 'إنزو فيرنانديز'],
  c_long_hair: ['مودريتش', 'إبراهيموفيتش', 'كافاني', 'بويول', 'كانيجيا', 'باتيستوتا', 'بيرلو', 'نيدفيد', 'غريزمان', 'هالاند', 'باجيو', 'بيكهام', 'فالديراما', 'رونالدينيو', 'سيرخيو راموس', 'تشيلافيرت', 'ماتيوس كونيا'],
  c_beard: ['صلاح', 'بنزيما', 'ميسي', 'جيرو', 'أليسون', 'بيكيه', 'توران', 'دي روسي', 'راموس', 'كافاني', 'إبراهيموفيتش', 'برونو فيرنانديز', 'ليوناردو بونوتشي', 'كوكي', 'ماتيوس'],
  c_dark_skin: ['كانتي', 'فينيسيوس', 'مبابي', 'كوليبالي', 'بوغبا', 'توريه', 'ماني', 'ديمبيلي', 'سيسوكو', 'ليروي ساني', 'كامافينغا', 'دروغبا', 'إيتو', 'رونالدينيو', 'بيليه', 'تيري هنري', 'تشواميني', 'ساكا', 'روديغر', 'ألابا', 'أوسيمين', 'ستيرلينغ', 'ميندي'],
  c_handsome: ['بيكهام', 'جيرو', 'مالديني', 'كاكا', 'كريستيانو رونالدو', 'كانافارو', 'غريزمان', 'موراتا', 'توريس', 'إيكر كاسياس', 'إيكاردي', 'جوردان هندرسون', 'ماركيزيو', 'بيكيه'],
  c_no_tattoos: ['كريستيانو رونالدو', 'صلاح', 'ماني', 'كانتي', 'كاسيميرو', 'بوسكيتس', 'إنييستا', 'تشافي', 'كروس', 'مودريتش', 'بنزيما', 'زيدان'],
  c_tall_giant: ['هالاند', 'كورتوا', 'فان دايك', 'إبراهيموفيتش', 'بيكيه', 'بونو', 'نوير', 'دوناروما', 'ماتيتش', 'كراوتش', 'لوكاكو', 'فيلايني', 'ميلينكوفيتش', 'دجيكو', 'جيرو', 'دي ليخت', 'كونيه', 'ساليبا', 'تشيك'],
  c_short_speed: ['ميسي', 'كانتي', 'إنسيني', 'فيراتي', 'مارادونا', 'كازورلا', 'جيوفينكو', 'مودريتش', 'إنييستا', 'تشافي', 'ديفيد سيلفا', 'أغويرو', 'ستيرلينغ', 'يامال', 'ريبيري', 'روماريو', 'سالم الدوسري'],
  c_lefty: ['ميسي', 'روبن', 'دي ماريا', 'محرز', 'صلاح', 'مارادونا', 'بيل', 'برناردو سيلفا', 'خاميس', 'مارسيلو', 'روبرتو كارلوس', 'فالفيردي', 'أوديغارد', 'ساكا', 'روبرتسون', 'ديفيز', 'ألبا', 'يامال', 'فودين', 'دي بروين', 'رافينيا', 'بالمر'],
  c_captain: ['راموس', 'ميسي', 'كريستيانو رونالدو', 'مالديني', 'جيرارد', 'توتي', 'بوفون', 'نوير', 'بويول', 'كومباني', 'هاري كين', 'تيري', 'فان دايك', 'مودريتش', 'كاسياس', 'زانيتي', 'سالم الدوسري', 'ياسر القحطاني', 'سامي الجابر', 'فيرديناند', 'فيليب لام', 'أوديغارد', 'برونو فيرنانديز'],
  c_shirt_10: ['ميسي', 'بيليه', 'مارادونا', 'زيدان', 'مودريتش', 'توتي', 'نيمار', 'رونالدينيو', 'هازارد', 'مبابي', 'أوزيل', 'كاكا', 'ريفالدو', 'بلاتيني', 'ريكيلمي', 'روني', 'ديل بييرو', 'باجيو', 'موسيالا', 'سالم الدوسري', 'يامال'],
  c_shirt_7: ['كريستيانو رونالدو', 'بيكهام', 'كانتونا', 'راؤول', 'سون هيونغ مين', 'ريبيري', 'فيغو', 'غريزمان', 'مبابي', 'شيفتشينكو', 'دي ماريا', 'ساكا', 'فينيسيوس', 'جيست', 'ديمبيلي'],
  c_muslim: ['بنزيما', 'صلاح', 'كانتي', 'ماني', 'زيدان', 'أوزيل', 'بوغبا', 'حكيمي', 'محرز', 'ريبيري', 'توريه', 'ديمبيلي', 'زياش', 'ماتيب', 'روديغر', 'غوندوغان', 'أبيدال', 'كوليبالي', 'تشواميني', 'كامافينغا', 'مزراوي', 'سايس'],
  c_naturalized: ['ديكو', 'بيبي', 'دييغو كوستا', 'تياغو موتا', 'كامورانيسي', 'جورجينيو', 'إيمرسون بالميري', 'لابورت', 'كلوزه', 'بودولسكي', 'ماركوس سينا', 'ليوناردو', 'رافينيا', 'أوليفر نوفيل'],
  c_u23: ['يامال', 'غافي', 'بيدري', 'بيلينغهام', 'موسيالا', 'فيرتز', 'كوبارسي', 'إندريك', 'غارناتشو', 'ماينو', 'زاير إيمري', 'ديزيريه دوي', 'كامافينغا', 'غولر', 'نيكو ويليامز', 'باليستر'],
  c_veteran_35: ['كريستيانو رونالدو', 'ميسي', 'مودريتش', 'بنزيما', 'ليفاندوفسكي', 'نوير', 'بوفون', 'إبراهيموفيتش', 'بيبي', 'داني ألفيس', 'راموس', 'دي ماريا', 'سواريز', 'جيرو', 'تياغو سيلفا', 'بوسكيتس', 'ألبا', 'مالديني', 'زانيتي', 'توتي', 'كاسياس', 'روجيه ميلا', 'بيرلو', 'كانافارو', 'زلاتان', 'ياسر القحطاني', 'سامي الجابر', 'ماجد عبدالله', 'دروغبا', 'إيتو', 'مولر', 'دجيكو', 'كازورلا'],
  c_goals_150: ['ميسي', 'كريستيانو رونالدو', 'ليفاندوفسكي', 'بنزيما', 'سواريز', 'إبراهيموفيتش', 'هاري كين', 'أغويرو', 'هنري', 'روني', 'كافاني', 'هالاند', 'مبابي', 'صلاح', 'نيمار', 'فان بيرسي', 'إيتو', 'دروغبا', 'شيفتشينكو', 'راؤول', 'توتي', 'إنزاغي', 'دافيد فيا', 'كلوزه', 'مولر', 'غريزمان', 'لوكاكو', 'إيموبيلي', 'ميتروفيتش', 'حمدالله', 'رونالدو نازاريو', 'روماريو', 'باتيستوتا', 'بيليه', 'ماجد عبدالله', 'سامي الجابر', 'دجيكو', 'جيرو', 'أوباميانغ', 'ديل بييرو', 'فان نيستلروي', 'شيرر'],
  c_world_cup_winner: ['ميسي', 'مبابي', 'كانتي', 'بوفون', 'إنييستا', 'زيدان', 'رونالدو نازاريو', 'ريفالدو', 'تشافي', 'راموس', 'نوير', 'كروس', 'فاران', 'لوريس', 'غريزمان', 'بوغبا', 'جيرو', 'دي ماريا', 'مارتينيز', 'كافو', 'روبرتو كارلوس', 'رونالدينيو', 'كانافارو', 'بيرلو', 'توتي', 'مولر', 'لام', 'بيكيه', 'بوسكيتس', 'كاسياس', 'دافيد فيا', 'ماسكيرانو'],
};

const POSITION_ARABIC: Record<string, string> = {
  GK: 'حارس مرمى', DEF: 'مدافع', DEF_1: 'مدافع أول', DEF_2: 'مدافع ثانٍ', MID: 'لاعب وسط', FWD: 'مهاجم',
};

// ---------------------------------------------------------------------------
// Criterion 2: Position fit
// ---------------------------------------------------------------------------
export function getPlayerNaturalPosition(
  player: FootballPlayer | { name: string; position?: string }
): NaturalPos {
  const db = resolvePlayerFromDB(player.name);
  if (db?.position) return db.position;
  const hay = nameHaystack(player.name, null);
  if (matchesAny(hay, GK_NAMES)) return 'GK';
  if (matchesAny(hay, DEF_NAMES)) return 'DEF';
  if (matchesAny(hay, MID_NAMES)) return 'MID';
  return 'FWD';
}

function verifyPosition(name: string, db: FootballPlayer | null, slot: DraftPosition) {
  const known = Boolean(db) || matchesAny(nameHaystack(name, null), [...GK_NAMES, ...DEF_NAMES, ...MID_NAMES]);
  const natural = getPlayerNaturalPosition({ name });
  const naturalName = POSITION_ARABIC[natural];
  const slotGroup: NaturalPos = slot === 'DEF_1' || slot === 'DEF_2' ? 'DEF' : (slot as NaturalPos);

  // Unknown outfield player: give benefit of the doubt everywhere except the GK slot
  if (!known && slotGroup !== 'GK') {
    return { isPositionValid: true, isOutfieldInGoal: false, naturalName: 'غير مسجل', reason: `✓ المركز مقبول مبدئياً: ${name} غير مسجل في قاعدة البيانات.` };
  }

  const ok = natural === slotGroup;
  const isOutfieldInGoal = slotGroup === 'GK' && natural !== 'GK';
  let reason: string;
  if (ok) {
    reason = {
      GK: `✓ المركز صحيح: ${name} حارس مرمى حقيقي.`,
      DEF: `✓ المركز صحيح: ${name} مدافع في مكانه الطبيعي.`,
      MID: `✓ المركز صحيح: ${name} لاعب وسط ويضبط الإيقاع.`,
      FWD: `✓ المركز صحيح: ${name} مهاجم يعرف طريق المرمى.`,
    }[slotGroup];
  } else if (isOutfieldInGoal) {
    reason = `✗ كارثة تكتيكية: وضع لاعب ميدان (${name} - ${naturalName}) في مركز حراسة المرمى!`;
  } else {
    reason = `✗ المركز خاطئ: ${name} ${naturalName} بالأساس وليس ${POSITION_ARABIC[slot]}.`;
  }
  return { isPositionValid: ok, isOutfieldInGoal, naturalName, reason };
}

// ---------------------------------------------------------------------------
// Criterion 1: Condition adherence
// ---------------------------------------------------------------------------
function teammatesOf(star: string, db: FootballPlayer | null, name: string): boolean {
  const starDb = resolvePlayerFromDB(star);
  if (!starDb || !db || norm(db.name) === norm(starDb.name)) return false;
  const starClubs = new Set(starDb.clubs.map(norm));
  if (db.clubs.some((c) => starClubs.has(norm(c)))) return true;
  return norm(db.nationality) === norm(starDb.nationality);
}

function checkCondition(name: string, db: FootballPlayer | null, condition: DraftCondition | null): boolean | null {
  if (!condition) return true;
  const hay = nameHaystack(name, db);
  const traits = (db?.traits || []).map(norm).join(' ');
  const trophies = (db?.trophies || []).map(norm).join(' ');
  const clubs = (db?.clubs || []).map(norm);
  const nat = norm(db?.nationality || '');
  const list = COND_LISTS[condition.id] || [];
  const inList = matchesAny(hay, list);
  const hasTrait = (...t: string[]) => t.some((x) => traits.includes(norm(x)));
  const inNat = (arr: string[]) => Boolean(nat) && arr.some((c) => nat.includes(norm(c)) || norm(c).includes(nat));
  const clubIn = (arr: string[]) => clubs.some((c) => arr.some((x) => c === norm(x) || c.includes(norm(x))));

  switch (condition.id) {
    case 'c_bald': return inList || hasTrait('أصلع');
    case 'c_afro': return inList || hasTrait('كدش', 'أفرو', 'افرو');
    case 'c_long_hair': return inList || hasTrait('شعر طويل');
    case 'c_beard': return inList || hasTrait('لحية');
    case 'c_dark_skin': return inList || hasTrait('أسمر', 'سمراء') || inNat(AFRICA.filter((c) => !['مصر', 'المغرب', 'الجزائر', 'تونس', 'ليبيا'].includes(c)));
    case 'c_handsome': return inList || hasTrait('وسيم');
    case 'c_no_tattoos': return inList || hasTrait('بدون وشم');
    case 'c_tall_giant': return inList || hasTrait('عملاق', 'طويل القامة');
    case 'c_short_speed': return inList || hasTrait('قصير');
    case 'c_lefty': return inList || hasTrait('أعسر', 'أشول', 'يسرى');
    case 'c_captain': return inList || hasTrait('قائد', 'كابتن');
    case 'c_shirt_10': return inList || hasTrait('10');
    case 'c_shirt_7': return inList || hasTrait('7');
    case 'c_muslim': return inList || hasTrait('مسلم') || inNat([...AFRICA.slice(0, 5), 'السعودية', 'الإمارات', 'قطر', 'الكويت', 'عمان', 'البحرين', 'العراق', 'الأردن', 'سوريا', 'فلسطين', 'اليمن', 'إيران', 'السنغال', 'مالي', 'غينيا', 'تركيا', 'البوسنة', 'ألبانيا']);
    case 'c_naturalized': return inList || hasTrait('مجنس');
    case 'c_africa': return inNat(AFRICA) || (!db && inList);
    case 'c_south_america': return inNat(SOUTH_AMERICA);
    case 'c_asia': return inNat(ASIA);
    case 'c_played_messi_ronaldo': return teammatesOf('ميسي', db, name) || teammatesOf('كريستيانو رونالدو', db, name);
    case 'c_two_continents': {
      if (!clubs.length) return false;
      const nonEuro = clubIn(NON_EURO_CLUBS);
      const euro = clubs.some((c) => !NON_EURO_CLUBS.some((x) => c === norm(x) || c.includes(norm(x))));
      return nonEuro && euro;
    }
    case 'c_five_clubs': return new Set(clubs).size >= 5;
    case 'c_roshn': return clubIn(ROSHN_CLUBS) || inList || matchesAny(hay, ['كريستيانو رونالدو', 'بنزيما', 'نيمار', 'كانتي', 'محرز', 'فيرمينو', 'سافيتش', 'نيفيز', 'ميتروفيتش', 'بونو', 'ساديو ماني', 'إيفان توني', 'هيرنانديز']);
    case 'c_u23': return inList || hasTrait('شاب', 'موهبة');
    case 'c_veteran_35': return inList || hasTrait('مخضرم', 'أسطورة');
    case 'c_goals_150': return inList || (db?.position === 'FWD' && hasTrait('هداف') && (db?.trophies?.length || 0) >= 3);
    case 'c_world_cup_winner': return trophies.includes(norm('كأس العالم')) || inList;
    default: return null; // unknown condition type → cannot verify automatically
  }
}

function verifyCondition(name: string, db: FootballPlayer | null, condition: DraftCondition | null) {
  const result = checkCondition(name, db, condition);
  const title = condition?.title || 'شرط الجولة';
  if (!condition) return { isValid: true, reason: '✓ لا يوجد شرط محدد لهذا المركز.' };
  if (result === null) return { isValid: true, reason: `✓ تم قبول ${name} مبدئياً لشرط [${title}] (تعذّر التحقق الآلي).` };
  return result
    ? { isValid: true, reason: `✓ ${name} حقق شرط [${title}] بنجاح.` }
    : { isValid: false, reason: `✗ ${name} لم يحقق شرط [${title}].` };
}

// ---------------------------------------------------------------------------
// Criterion 4: Pundit critique
// ---------------------------------------------------------------------------
function buildCritique(
  r: { gk: number; defense: number; midfield: number; attack: number },
  gkBlunder: boolean,
  validCond: number
): { title: string; summary: string } {
  const parts: string[] = [];
  if (gkBlunder) parts.push('الحارس لاعب ميدان! المرمى مفتوح مثل باب البقالة، والخصم بيسجل من نص الملعب.');
  else if (r.gk >= 85) parts.push('حارس مرعب يقفل المرمى بالضبة والمفتاح.');

  if (r.defense < 55) parts.push('دفاع شوارع ومخترق، والاعتماد بالكامل على مهارات الهجوم الفردية.');
  else if (r.defense >= 85) parts.push('خط دفاع حديدي ما يعدّي منه حتى الهواء.');

  if (r.midfield >= 85) parts.push('خط وسط أسطوري يفرض سيطرته التامة على ريتم المباراة.');
  else if (r.midfield < 55) parts.push('الوسط مقطوع، والكرة تطير من الدفاع للهجوم بدون تذكرة عبور.');

  if (r.attack >= 85) parts.push('هجوم فتاك يرعب أي دفاع في العالم.');
  else if (r.attack < 55) parts.push('الهجوم عقيم، ولو لعبوا للصبح ما سجلوا.');

  const lines = [r.gk, r.defense, r.midfield, r.attack];
  const balanced = Math.max(...lines) - Math.min(...lines) <= 15 && Math.min(...lines) >= 65;
  if (balanced || parts.length === 0) parts.push('تشكيلة متوازنة تكتيكياً وقادرة على حسم المباريات في اللحظات الحاسمة.');

  if (validCond <= 2) parts.push('لكن الشروط؟ الواضح إن المدرب ما قرأ ورقة التعليمات أصلاً.');
  else if (validCond === 5) parts.push('والتزام كامل بالشروط الخمسة — شغل محترفين.');

  let title = 'تشكيلة متوازنة بطموح البطولة';
  if (gkBlunder) title = 'مغامرة انتحارية بدون حارس حقيقي';
  else if (r.defense < 55 && r.attack >= 80) title = 'هجوم ناري ودفاع يغرق في شبر موية';
  else if (r.midfield >= 85) title = 'مايسترو في الوسط وسيطرة كاملة';
  else if (r.defense >= 85 && r.attack < 60) title = 'باص مركون أمام المرمى';
  else if (validCond <= 2) title = 'فريق قوي على الورق لكنه خالف الشروط';

  return { title, summary: parts.join(' ') };
}

// ---------------------------------------------------------------------------
// Squad evaluation (criteria 1–4)
// ---------------------------------------------------------------------------
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));

function lineRating(entry: SlotEntry | null): number {
  if (!entry) return 10;
  if (!entry.pos.isPositionValid) return entry.pos.isOutfieldInGoal ? 20 : 40;
  const trophies = Math.min(3, entry.db?.trophies?.length || 0);
  return clamp(70 + trophies * 4 + (entry.cond.isValid ? 6 : 0) + (entry.isLegend ? 7 : 0), 0, 99);
}

interface SlotEntry {
  name: string;
  photo: string;
  db: FootballPlayer | null;
  condition: DraftCondition | null;
  cond: { isValid: boolean; reason: string };
  pos: ReturnType<typeof verifyPosition>;
  isLegend: boolean;
}

export function evaluateContestant(c: DraftContestant): SquadAIEvaluation {
  const entries: Partial<Record<DraftPosition, SlotEntry | null>> = {};
  const verifications: PlayerConditionVerification[] = [];
  let validCond = 0;
  let validPos = 0;
  let empty = 0;
  let gkBlunder = false;
  let legends = 0;

  DRAFT_SLOTS_ORDER.forEach((slot) => {
    const pick = c.picks?.[slot];
    const condition = c.pickConditions?.[slot] || null;
    const name = (pick?.name || '').trim();

    if (!name || name === 'فارغ' || name === 'لم يحدد') {
      empty++;
      entries[slot] = null;
      verifications.push({
        position: slot, playerName: 'فارغ', playerPhoto: '', conditionTitle: condition?.title || 'شرط الجولة',
        isValid: false, reason: '✗ لم يتم اختيار أي لاعب في هذا المركز!',
        isPositionValid: false, positionReason: '✗ المركز فارغ تماماً!', naturalPosition: '-',
      });
      if (slot === 'GK') gkBlunder = true;
      return;
    }

    const db = resolvePlayerFromDB(name);
    const displayName = db?.name || name;
    const cond = verifyCondition(displayName, db, condition);
    const pos = verifyPosition(displayName, db, slot);
    const isLegend = matchesAny(nameHaystack(displayName, db), LEGENDS);
    if (cond.isValid) validCond++;
    if (pos.isPositionValid) validPos++;
    if (pos.isOutfieldInGoal) gkBlunder = true;
    if (isLegend) legends++;

    entries[slot] = { name: displayName, photo: pick?.photo || db?.photo || '', db, condition, cond, pos, isLegend };
    verifications.push({
      position: slot, playerName: displayName, playerPhoto: pick?.photo || db?.photo || '',
      conditionTitle: condition?.title || 'بدون شرط', isValid: cond.isValid, reason: cond.reason,
      isPositionValid: pos.isPositionValid, positionReason: pos.reason, naturalPosition: pos.naturalName,
    });
  });

  // Criterion 3: Strength % (spec formula)
  const outfieldInGoal = Boolean(entries.GK?.pos.isOutfieldInGoal);
  let overall = 50 + validCond * 8 + validPos * 2;
  if (outfieldInGoal) overall -= 15;
  overall += Math.min(3, legends);
  overall -= empty * 5; // missing players weaken the squad
  const overallPercentage = clamp(overall, 30, 99);

  const ratings = {
    gk: lineRating(entries.GK || null),
    defense: Math.round((lineRating(entries.DEF_1 || null) + lineRating(entries.DEF_2 || null)) / 2),
    midfield: lineRating(entries.MID || null),
    attack: lineRating(entries.FWD || null),
    synergy: clamp(40 + validPos * 8 + validCond * 4, 30, 99),
  };

  const critique = buildCritique(ratings, gkBlunder, validCond);

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (entries.FWD?.pos.isPositionValid) strengths.push(`حسم أمام المرمى بفضل ${entries.FWD.name}`);
  if (entries.MID?.pos.isPositionValid) strengths.push(`تحكم في الوسط بقيادة ${entries.MID.name}`);
  if (entries.DEF_1?.pos.isPositionValid && entries.DEF_2?.pos.isPositionValid) strengths.push(`ثنائي دفاعي صلب: ${entries.DEF_1.name} و${entries.DEF_2.name}`);
  if (entries.GK?.pos.isPositionValid) strengths.push(`أمان في المرمى مع ${entries.GK.name}`);
  if (gkBlunder) weaknesses.push(entries.GK ? `${entries.GK.name} ليس حارس مرمى` : 'لا يوجد حارس مرمى');
  verifications.filter((v) => !v.isValid && v.playerName !== 'فارغ').forEach((v) => weaknesses.push(v.reason));

  const slotsAnalysis: SquadAIEvaluation['slotsAnalysis'] = {};
  verifications.forEach((v) => {
    slotsAnalysis![v.position] = {
      playerName: v.playerName, conditionTitle: v.conditionTitle, isConditionMet: v.isValid,
      conditionReason: v.reason, isPositionValid: Boolean(v.isPositionValid), positionReason: v.positionReason || '',
    };
  });

  return {
    playerId: c.id,
    playerName: c.name,
    selectedClub: c.selectedClub || null,
    teamLogo: c.selectedClub?.badgeUrl || '',
    validConditionsCount: validCond,
    validPositionsCount: validPos,
    totalValidCount: validCond + validPos,
    conditionVerifications: verifications,
    slotsAnalysis,
    ratings,
    overallPercentage,
    critiqueTitle: critique.title,
    critiqueSummary: critique.summary,
    detailedBreakdown: {
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 4),
      tacticalSummary: critique.summary,
    },
  };
}

export const evaluateSquad = evaluateContestant;

// ---------------------------------------------------------------------------
// Squad → contestant merge (zero-loss)
// ---------------------------------------------------------------------------
const EMPTY_PICKS = (): Record<DraftPosition, FootballPlayer | null> => ({ FWD: null, MID: null, DEF_1: null, DEF_2: null, GK: null });
const EMPTY_CONDS = (): Record<DraftPosition, DraftCondition | null> => ({ FWD: null, MID: null, DEF_1: null, DEF_2: null, GK: null });

function findCondition(id?: string, title?: string): DraftCondition | null {
  if (!id && !title) return null;
  return (
    DRAFT_CONDITIONS_BANK.find((c) => (id && c.id === id) || (title && c.title === title)) ||
    { id: id || 'c_custom', title: title || 'شرط الجولة', rulePrompt: title || '' } as DraftCondition
  );
}

export function mergeContestantsWithSquads(
  contestants: DraftContestant[],
  squads: Record<string, PlayerSquad> = {}
): DraftContestant[] {
  const pool = new Map<string, DraftContestant>();
  contestants.forEach((c) => pool.set(c.id, { ...c, picks: { ...EMPTY_PICKS(), ...(c.picks || {}) }, pickConditions: { ...EMPTY_CONDS(), ...(c.pickConditions || {}) } }));

  Object.entries(squads || {}).forEach(([id, sq]) => {
    if (!sq) return;
    const base = pool.get(id) || {
      id, name: sq.playerName || 'متسابق', isReady: true,
      selectedClub: sq.selectedClub || (sq.teamLogo ? { id: 'club', name: 'النادي', league: '', country: '', badgeUrl: sq.teamLogo } as any : null),
      picks: EMPTY_PICKS(), pickConditions: EMPTY_CONDS(),
    };
    DRAFT_SLOTS_ORDER.forEach((slot) => {
      const s = sq.slots?.[slot];
      if (!s?.playerName) return;
      if (!base.picks[slot]) {
        base.picks[slot] = { id: `squad_${slot}_${id}`, name: s.playerName, photo: s.playerPhoto, aliases: [], nationality: '', nationalityCode: '', clubs: [], currentClub: '', position: 'FWD' } as FootballPlayer;
      }
      if (!base.pickConditions![slot]) base.pickConditions![slot] = findCondition(s.conditionId, s.conditionTitle);
    });
    if (!base.selectedClub && sq.selectedClub) base.selectedClub = sq.selectedClub;
    pool.set(id, base);
  });

  return Array.from(pool.values());
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
/**
 * Synchronous, never-throwing evaluation of every squad.
 * Pass both the live contestants list and any persisted squads; they are merged
 * so no contestant is ever dropped.
 */
export function evaluateAllSquadsLocally(
  contestants: DraftContestant[],
  squads: Record<string, PlayerSquad> = {}
): DraftVerdictResult {
  const merged = mergeContestantsWithSquads(contestants || [], squads || {});
  const evaluations: SquadAIEvaluation[] = [];
  merged.forEach((c) => {
    try {
      evaluations.push(evaluateContestant(c));
    } catch (err) {
      console.error('[Tactical Judge] Failed to evaluate', c?.name, err);
    }
  });
  return buildVerdictResult(evaluations);
}

/** Backwards-compatible async wrapper (no network calls). */
export async function evaluateDraftSquadsWithAI(
  contestants: DraftContestant[],
  _usedConditions?: DraftCondition[]
): Promise<DraftVerdictResult> {
  return evaluateAllSquadsLocally(contestants);
}

/** Compact per-contestant results map (spec-shaped). */
export function toSquadResultsMap(verdict: DraftVerdictResult): Record<string, SquadEvaluationResult> {
  const out: Record<string, SquadEvaluationResult> = {};
  verdict.evaluations.forEach((e) => {
    out[e.playerId] = {
      playerId: e.playerId, playerName: e.playerName, teamLogo: e.teamLogo || '',
      validConditionsCount: e.validConditionsCount, validPositionsCount: e.validPositionsCount,
      overallPercentage: e.overallPercentage, slotsAnalysis: e.slotsAnalysis || {}, critiqueSummary: e.critiqueSummary || '',
    };
  });
  return out;
}

function buildVerdictResult(evaluations: SquadAIEvaluation[]): DraftVerdictResult {
  if (evaluations.length === 0) {
    return {
      evaluations: [], winnerId: '', winnerName: '', isTie: false, tiedContestantIds: [], maxConditionsMet: 0,
      verdictBanner: 'لم تصل أي تشكيلة للتقييم',
    };
  }

  const sorted = [...evaluations].sort((a, b) =>
    b.validConditionsCount - a.validConditionsCount ||
    b.overallPercentage - a.overallPercentage ||
    b.validPositionsCount - a.validPositionsCount
  );

  const winner = sorted[0];
  const runnerUp = sorted[1];
  const isTie = Boolean(runnerUp && runnerUp.validConditionsCount === winner.validConditionsCount);
  const tiedIds = isTie ? sorted.filter((e) => e.validConditionsCount === winner.validConditionsCount).map((e) => e.playerId) : [];

  return {
    evaluations: sorted,
    winnerId: winner.playerId,
    winnerName: winner.playerName,
    winnerClub: winner.selectedClub,
    isTie,
    tiedContestantIds: tiedIds,
    maxConditionsMet: winner.validConditionsCount,
    verdictBanner: `🏆 الفائز بالبطولة: ${winner.playerName} بنسبة قوة ${winner.overallPercentage}% وتحقيق ${winner.validConditionsCount}/5 شروط!`,
    tieBreakAnalysis: isTie
      ? `تعادل في الشروط (${winner.validConditionsCount}/5) مع ${runnerUp!.playerName}، وحُسم الفوز لـ ${winner.playerName} بنسبة القوة التكتيكية ${winner.overallPercentage}% مقابل ${runnerUp!.overallPercentage}%.`
      : undefined,
  };
}
