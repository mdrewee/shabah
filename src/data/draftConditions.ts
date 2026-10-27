export interface DraftCondition {
  id: string;
  title: string;
  rulePrompt: string; // Fed strictly to the AI judge
}

export const DRAFT_CONDITIONS_BANK: DraftCondition[] = [
  { id: 'c_bald', title: 'لاعب أصلع تماماً', rulePrompt: 'اللاعب أصلع بالكامل أو حليق الرأس' },
  { id: 'c_afro', title: 'لاعب كدش أو أفروا كثيف', rulePrompt: 'اللاعب يمتلك شعر كدش أو أفروا أو كيرلي ضخم' },
  { id: 'c_long_hair', title: 'لاعب شعره طويل مسدول أو مربوط', rulePrompt: 'اللاعب معروف بشعر طويل' },
  { id: 'c_beard', title: 'لاعب له لحية واضحة وكثيفة', rulePrompt: 'اللاعب يمتلك لحية واضحة في مسيرته' },
  { id: 'c_dark_skin', title: 'لاعب أسمر البشرة', rulePrompt: 'اللاعب من ذوي البشرة السمراء' },
  { id: 'c_handsome', title: 'لاعب وسيم ومعروف بجمال ملامحه', rulePrompt: 'اللاعب مشهور بوسامته وملامحه الجذابة في الإعلام الرياضي' },
  { id: 'c_no_tattoos', title: 'لاعب بدون أي وشم على جسده', rulePrompt: 'اللاعب معروف بعدم امتلاكه أي أوشام' },
  { id: 'c_tall_giant', title: 'طوله أكثر من 190 سم', rulePrompt: 'طول اللاعب الرسمي 190 سم فما فوق' },
  { id: 'c_short_speed', title: 'طوله أقل من 172 سم', rulePrompt: 'طول اللاعب الرسمي أقل من 172 سم' },
  { id: 'c_lefty', title: 'لاعب أشول (يلعب بالقدم اليسرى)', rulePrompt: 'اللاعب يعتمد كلياً على قدمه اليسرى' },
  { id: 'c_captain', title: 'كابتن فريقه أو منتخب بلاده', rulePrompt: 'اللاعب ارتدى شارة القيادة لفريقه أو لمنتخب بلاده' },
  { id: 'c_shirt_10', title: 'اشتهر بارتداء القميص رقم 10', rulePrompt: 'اللاعب ارتدى الرقم 10 في فترات بارزة من مسيرته' },
  { id: 'c_shirt_7', title: 'اشتهر بارتداء القميص رقم 7', rulePrompt: 'اللاعب ارتدى الرقم 7 في فترات بارزة من مسيرته' },
  { id: 'c_muslim', title: 'لاعب ديانته مسلم', rulePrompt: 'اللاعب مسلم الديانة رسمياً' },
  { id: 'c_naturalized', title: 'يمثل غير منتخب بلده الأصلي', rulePrompt: 'اللاعب يحمل جنسية مزدوجة أو مثل منتخباً غير مسقط رأسه' },
  { id: 'c_africa', title: 'جنسيته من قارة أفريقيا', rulePrompt: 'اللاعب يحمل جنسية دولة أفريقية' },
  { id: 'c_south_america', title: 'جنسيته من أمريكا الجنوبية', rulePrompt: 'اللاعب يحمل جنسية دولة من قارة أمريكا الجنوبية' },
  { id: 'c_asia', title: 'جنسيته من قارة آسيا', rulePrompt: 'اللاعب يحمل جنسية دولة آسيوية' },
  { id: 'c_played_messi_ronaldo', title: 'زامل ميسي أو كريستيانو رونالدو', rulePrompt: 'اللاعب لعب في نفس الفريق أو المنتخب مع ميسي أو رونالدو' },
  { id: 'c_two_continents', title: 'لعب لأندية في قارتين مختلفتين', rulePrompt: 'اللاعب مثل أندية في قارتين مختلفتين على الأقل' },
  { id: 'c_five_clubs', title: 'لعب لأكثر من 4 أندية في مسيرته', rulePrompt: 'اللاعب لعب لـ 5 أندية احترافية مختلفة أو أكثر' },
  { id: 'c_roshn', title: 'لعب في دوري روشن السعودي', rulePrompt: 'اللاعب مثل أحد أندية الدوري السعودي للمحترفين' },
  { id: 'c_u23', title: 'عمره 23 سنة أو أصغر', rulePrompt: 'عمر اللاعب الحالي 23 سنة أو أقل' },
  { id: 'c_veteran_35', title: 'عمره 35 سنة أو أكبر', rulePrompt: 'عمر اللاعب 35 سنة أو أكثر أو اعتزل بعد الـ 35' },
  { id: 'c_goals_150', title: 'سجل أكثر من 150 هدفاً في مسيرته', rulePrompt: 'اللاعب تخطى حاجز 150 هدفاً رسمياً' },
  { id: 'c_world_cup_winner', title: 'حقق بطولة كأس العالم', rulePrompt: 'اللاعب توج بلقب كأس العالم مع منتخب بلاده' },
  { id: 'c_ucl_winner', title: 'حقق دوري أبطال أوروبا', rulePrompt: 'اللاعب توج بلقب دوري أبطال أوروبا' },
  { id: 'c_ballon_dor', title: 'فاز بجائزة الكرة الذهبية أو ترشح للتوب 3', rulePrompt: 'اللاعب فاز بالكرة الذهبية أو وصل لقائمتها النهائية' },
  { id: 'c_premier_league', title: 'لعب في الدوري الإنجليزي الممتاز', rulePrompt: 'اللاعب خاض تجربة في البريميرليغ' },
  { id: 'c_laliga', title: 'لعب في الدوري الإسباني (الليغا)', rulePrompt: 'اللاعب لعب لأحد أندية الدوري الإسباني' },
  { id: 'c_serie_a', title: 'لعب في الدوري الإيطالي (الكالتشيو)', rulePrompt: 'اللاعب لعب في الدوري الإيطالي' },
  { id: 'c_bundesliga', title: 'لعب في الدوري الألماني (البوندسليغا)', rulePrompt: 'اللاعب خاض مباريات في الدوري الألماني' },
  { id: 'c_one_club_man', title: 'لاعب مخلص (لعب لأقل من ناديين)', rulePrompt: 'اللاعب قضى مسيرته في نادٍ واحد أو نادين فقط' },
  { id: 'c_brother_players', title: 'أخوه لاعب كرة قدم محترف', rulePrompt: 'اللاعب لديه أخ يمارس كرة القدم الاحترافية' },
  { id: 'c_freekick_specialist', title: 'متخصص بتسجيل الركلات الحرة', rulePrompt: 'اللاعب مشهور بأهدافه من الكرات الثابتة المباشرة' },
  { id: 'c_red_card_king', title: 'اشتهر بالتدخلات القوية والبطاقات', rulePrompt: 'اللاعب معروف بالخشونة أو نيل بطاقات حمراء كثيرة' },
];

export function getRandomDraftCondition(excludedIds: Set<string> = new Set()): DraftCondition {
  const available = DRAFT_CONDITIONS_BANK.filter((c) => !excludedIds.has(c.id));
  const pool = available.length > 0 ? available : DRAFT_CONDITIONS_BANK;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

/**
 * Draw 25 guaranteed unique conditions for a 5-round match (5 conditions per round)
 */
export function generateMatchConditions(total = 25): DraftCondition[] {
  const shuffled = [...DRAFT_CONDITIONS_BANK].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(total, shuffled.length));
}
