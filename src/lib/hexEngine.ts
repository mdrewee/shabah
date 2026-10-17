import { HexCell, QuestionItem, TeamId } from '../types/game';

// 5x5 Hexagonal Grid Constants
export const GRID_ROWS = 5;
export const GRID_COLS = 5;
export const TOTAL_CELLS = 25;

// ==========================================
// 1. QUESTION BANKS
// ==========================================

export const ARABIC_LETTERS = [
  'أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر',
  'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف',
  'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'
];

export const ENGLISH_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y'
];

// Arabic Classic Letter Question Bank (Starts with letter)
export const ARABIC_QUESTIONS: Record<string, QuestionItem[]> = {
  'أ': [
    { id: 'ar_a1', letter: 'أ', question: 'مدينة سعودية تشتهر بواحة النخيل وعيون الماء العذبة؟', answer: 'الأحساء' },
    { id: 'ar_a2', letter: 'أ', question: 'أكبر محيطات كوكب الأرض مساحة؟', answer: 'المحيط الهادئ (أو الأطلسي)' },
    { id: 'ar_a3', letter: 'أ', question: 'طائر جارح يرمز للقوة وعلم بعض الدول العربية؟', answer: 'العقاب / الصقر / أشهب' },
  ],
  'ب': [
    { id: 'ar_b1', letter: 'ب', question: 'عاصمة دولة عربية تشتهر ببرج إيفل الشرق وساحة النجمة؟', answer: 'بيروت' },
    { id: 'ar_b2', letter: 'ب', question: 'مشروب سحري أسود يُعد من حبوب البن المحمصة؟', answer: 'القهوة / بن' },
    { id: 'ar_b3', letter: 'ب', question: 'دولة خليجية تتكون من أرخبيل جزر وعاصمتها المنامة؟', answer: 'البحرين' },
  ],
  'ت': [
    { id: 'ar_t1', letter: 'ت', question: 'فاكهة مباركة ورد ذكرها في القرآن مقرونة بالزيتون؟', answer: 'التين' },
    { id: 'ar_t2', letter: 'ت', question: 'عاصمة الجمهورية التونسية؟', answer: 'تونس' },
    { id: 'ar_t3', letter: 'ت', question: 'حيوان مفترس مخطط باللونين البرتقالي والأسود؟', answer: 'التمر / التَّيْجَر / التمساح' },
  ],
  'ث': [
    { id: 'ar_th1', letter: 'ث', question: 'حيوان ماكر مضرب المثل في الحيلة والدهاء؟', answer: 'الثعلب' },
    { id: 'ar_th2', letter: 'ث', question: 'نبات عشبي عطري يستخدم كثيراً مع الشاي في الشتاء؟', answer: 'الثوم / الثمام / الثلج' },
    { id: 'ar_th3', letter: 'ث', question: 'سورة في القرآن تسمى أيضاً سورة النعم؟', answer: 'النحل / الثقلين' },
  ],
  'ج': [
    { id: 'ar_j1', letter: 'ج', question: 'عروس البحر الأحمر وبوابة مكة المكرمة الساحلية؟', answer: 'جدة' },
    { id: 'ar_j2', letter: 'ج', question: 'سفينة الصحراء وأهم ركائب العرب قديماً؟', answer: 'الجمل' },
    { id: 'ar_j3', letter: 'ج', question: 'أعلى قمة جبلية في شبه الجزيرة العربية؟', answer: 'جبل النبي شعيب' },
  ],
  'ح': [
    { id: 'ar_h1', letter: 'ح', question: 'عروس الشمال السعودي وتشتهر بكرم أهلها وجبل أجا وسلمى؟', answer: 'حائل' },
    { id: 'ar_h2', letter: 'ح', question: 'طائر جارح معروف بسرعته وانقضاضه الحاد؟', answer: 'الحر (الصقر الحر)' },
    { id: 'ar_h3', letter: 'ح', question: 'طائر صغير الحجم ملون مشهور بتغريده في الصباح؟', answer: 'الحسون' },
  ],
  'خ': [
    { id: 'ar_kh1', letter: 'خ', question: 'مدينة سعودية تابعة لمنطقة الرياض تشتهر بمزارع الألبان؟', answer: 'الخرج' },
    { id: 'ar_kh2', letter: 'خ', question: 'حيوان يرمز للفروسية والأصالة وله سلالات عربية عريقة؟', answer: 'الخيل' },
    { id: 'ar_kh3', letter: 'خ', question: 'بيت الشعر المصنوع من صوف وصبار في البادية؟', answer: 'الخيمة' },
  ],
  'د': [
    { id: 'ar_d1', letter: 'د', question: 'وعاء نحاسي تقليدي يُطبخ فيه البن وتُصب منه القهوة السعودية؟', answer: 'الدلة' },
    { id: 'ar_d2', letter: 'د', question: 'عاصمة دولة قطر الشقيقة؟', answer: 'الدوحة' },
    { id: 'ar_d3', letter: 'د', question: 'كائن بحري ذكي جداً صديق للإنسان من الثدييات؟', answer: 'الدلفين' },
  ],
  'ر': [
    { id: 'ar_r1', letter: 'ر', question: 'عاصمة المملكة العربية السعودية وقلبها النابض؟', answer: 'الرياض' },
    { id: 'ar_r2', letter: 'ر', question: 'شهر الصيام والقرآن الكريم؟', answer: 'رمضان' },
    { id: 'ar_r3', letter: 'ر', question: 'أحد أشهر أطباق وجبات الخليج الرئيسية المطهوة مع اللحم أو الدجاج؟', answer: 'الرز / الرز البخاري' },
  ],
  'ز': [
    { id: 'ar_z1', letter: 'ز', question: 'أطول كائن حي ثديي على وجه الأرض؟', answer: 'الزرافة' },
    { id: 'ar_z2', letter: 'ز', question: 'بهار أحمر فاخر غالي الثمن يُضاف إلى القهوة والشاي؟', answer: 'الزعفران' },
    { id: 'ar_z3', letter: 'ز', question: 'سائل ذهبي مبارك يُستخرج من عصر ثمار شجرة في حوض المتوسط؟', answer: 'زيت الزيتون' },
  ],
  'س': [
    { id: 'ar_s1', letter: 'س', question: 'حلقات من الخرز تُستخدم للتسبيح والذكر في المجلس؟', answer: 'السبحة' },
    { id: 'ar_s2', letter: 'س', question: 'سلاح أبيض حاد تراثي يرمز للشجاعة ويزين العرضة السعودية؟', answer: 'السيف' },
    { id: 'ar_s3', letter: 'س', question: 'أكبر صحراء رملية متصلة في العالم تقع في جنوب الجزيرة العربية؟', answer: 'صحراء الربع الخالي / الساحل' },
  ],
  'ش': [
    { id: 'ar_sh1', letter: 'ش', question: 'مشروب سحري ساخن رفيق السمرات الشتوية على الحطب؟', answer: 'الشاي' },
    { id: 'ar_sh2', letter: 'ش', question: 'غطاء الرأس العربي للرجال بالألوان الأحمر والأبيض؟', answer: 'الشماغ' },
    { id: 'ar_sh3', letter: 'ش', question: 'أحد فصول السنة يرتبط بطلعات البر وشبة النار؟', answer: 'الشتاء' },
  ],
  'ص': [
    { id: 'ar_sa1', letter: 'ص', question: 'طائر جارح عزيز النفس يربيه أهل المقناص؟', answer: 'الصقر' },
    { id: 'ar_sa2', letter: 'ص', question: 'عاصمة الجمهورية اليمنية التاريخية؟', answer: 'صنعاء' },
    { id: 'ar_sa3', letter: 'ص', question: 'نبات شوكي صحراوي يتحمل العطش والجفاف لشهور؟', answer: 'الصبار' },
  ],
  'ط': [
    { id: 'ar_ta1', letter: 'ط', question: 'مدينة الورد الجبلي وعروس المصايف السعودية؟', answer: 'الطائف' },
    { id: 'ar_ta2', letter: 'ط', question: 'غطاء رأس تقليدي خفيف يُلبس تحت الشماغ والغترة؟', answer: 'الطاقية' },
    { id: 'ar_ta3', letter: 'ط', question: 'وسيلة نقل حديثة تحلق في الجو وتسافر بين القارات؟', answer: 'الطائرة' },
  ],
  'ع': [
    { id: 'ar_ayn1', letter: 'ع', question: 'منطقة سعودية في الجنوب تشتهر بالجبال الخضراء وأبها والضباب؟', answer: 'عسير' },
    { id: 'ar_ayn2', letter: 'ع', question: 'رقصة شعبية حماسية تُؤدى بالسيوف والطبول في المناسبات الوطنية؟', answer: 'العرضة' },
    { id: 'ar_ayn3', letter: 'ع', question: 'مدينة أثرية عالمية شمال غرب السعودية تضم مدائن صالح ومقابر دادان؟', answer: 'العلا' },
  ],
  'ف': [
    { id: 'ar_fa1', letter: 'ف', question: 'كأس صغير من الخزف تُسكب فيه القهوة العربية الأصيلة؟', answer: 'الفنجال' },
    { id: 'ar_fa2', letter: 'ف', question: 'أضخم حيوان ثديي على اليابسة وله خرطوم طويل؟', answer: 'الفيل' },
    { id: 'ar_fa3', letter: 'ف', question: 'نجم قطبي مشهور يستدل به العرب في أسفارهم؟', answer: 'الفرقد / الفجر' },
  ],
  'ق': [
    { id: 'ar_qaf1', letter: 'ق', question: 'منطقة سعودية تشتهر بمهرجان التمور وعاصمتها بريدة؟', answer: 'القصيم' },
    { id: 'ar_qaf2', letter: 'ق', question: 'المشروب العربي الأكثر رمزية للضيافة والكرم؟', answer: 'القهوة' },
    { id: 'ar_qaf3', letter: 'ق', question: 'عاصمة جمهورية مصر العربية وأكبر مدنها سكاناً؟', answer: 'القاهرة' },
  ],
  'ك': [
    { id: 'ar_kaf1', letter: 'ك', question: 'دولة خليجية مجاورة للمملكة تشتهر بأبراج الكويت وجزيرة فيلكا؟', answer: 'الكويت' },
    { id: 'ar_kaf2', letter: 'ك', question: 'قبلة المسلمين التي يتجه إليها الملايين في صلواتهم يومياً؟', answer: 'الكعبة المشرفة' },
    { id: 'ar_kaf3', letter: 'ك', question: 'حيوان جرابي أسترالي يقفز على رجليه ويحمل صغيره في جيبه؟', answer: 'الكنغر' },
  ],
  'م': [
    { id: 'ar_m1', letter: 'م', question: 'أقدس بقاع الأرض ومهبط الوحي ومولد نبي الأمة؟', answer: 'مكة المكرمة' },
    { id: 'ar_m2', letter: 'م', question: 'المكان المخصص لجلوس الرجال والضيوف للسمر وتبادل الأحاديث؟', answer: 'المجلس' },
    { id: 'ar_m3', letter: 'م', question: 'أداة تُستخدم لتصويب السهام في الرماية قديماً؟', answer: 'القوس / الميداس' },
  ],
  'ن': [
    { id: 'ar_n1', letter: 'ن', question: 'شجرة مباركة تنتج التمر وتعتبر رمزاً رسمياً في شعار المملكة؟', answer: 'النخلة' },
    { id: 'ar_n2', letter: 'ن', question: 'منطقة تاريخية في وسط شبه الجزيرة العربية تقع فيها الرياض؟', answer: 'نجد' },
    { id: 'ar_n3', letter: 'ن', question: 'طائر ضخم لا يستطيع الطيران لكنه سريع جداً في العدو؟', answer: 'النعامة' },
  ],
  'هـ': [
    { id: 'ar_ha1', letter: 'هـ', question: 'إبل الركوب والسباقات السريعة في سباقات الجزيرة؟', answer: 'الهجين' },
    { id: 'ar_ha2', letter: 'هـ', question: 'شكل القمر عندما يظهر كقوس رفيع في بداية الشهر الهجري؟', answer: 'الهلال' },
    { id: 'ar_ha3', letter: 'هـ', question: 'حبيبات بيضاء عطرية توضع في القهوة مع الهيل والزعفران؟', answer: 'الهيل' },
  ],
  'و': [
    { id: 'ar_w1', letter: 'و', question: 'منطقة خضراء وسط الرمال تفيض بالنخيل والماء؟', answer: 'الواحة' },
    { id: 'ar_w2', letter: 'و', question: 'حيوان صحراوي زاحف يشبه التمساح الصغير يُعرف في البراري؟', answer: 'الورل' },
    { id: 'ar_w3', letter: 'و', question: 'عاصمة الولايات المتحدة الأمريكية؟', answer: 'واشنطن' },
  ],
  'ي': [
    { id: 'ar_y1', letter: 'ي', question: 'مدينة ساحلية سعودية تابعة لمنطقة المدينة المنورة وتشتهر بالصناعة والبحر؟', answer: 'ينبع' },
    { id: 'ar_y2', letter: 'ي', question: 'حجر كريم ذو ألوان براقة ومنه الأحمر والياقوتي؟', answer: 'الياقوت' },
    { id: 'ar_y3', letter: 'ي', question: 'نبات شجري يُزرع لزهوره البيضاء ذات الرائحة الفواحة؟', answer: 'الياسمين' },
  ],
};

// English Letter Questions (Starts with letter)
export const ENGLISH_QUESTIONS: Record<string, QuestionItem[]> = {
  'A': [{ id: 'en_a', letter: 'A', question: 'The largest continent on Earth?', answer: 'Asia' }],
  'B': [{ id: 'en_b', letter: 'B', question: 'The capital of Germany?', answer: 'Berlin' }],
  'C': [{ id: 'en_c', letter: 'C', question: 'A desert animal with humps that can survive weeks without water?', answer: 'Camel' }],
  'D': [{ id: 'en_d', letter: 'D', question: 'A traditional Arabic coffee pot?', answer: 'Dallah' }],
  'E': [{ id: 'en_e', letter: 'E', question: 'The largest land mammal with big ears and a trunk?', answer: 'Elephant' }],
  'F': [{ id: 'en_f', letter: 'F', question: 'A bird of prey trained for hunting in the Arabian Gulf?', answer: 'Falcon' }],
  'G': [{ id: 'en_g', letter: 'G', question: 'The tallest living terrestrial animal with a long neck?', answer: 'Giraffe' }],
  'H': [{ id: 'en_h', letter: 'H', question: 'A noble animal with a mane, known for speed in Arabian races?', answer: 'Horse' }],
  'I': [{ id: 'en_i', letter: 'I', question: 'A country in Southern Europe shaped like a boot?', answer: 'Italy' }],
  'J': [{ id: 'en_j', letter: 'J', question: 'The coastal Saudi city known as the Bride of the Red Sea?', answer: 'Jeddah' }],
  'K': [{ id: 'en_k', letter: 'K', question: 'A Gulf country with its capital in Kuwait City?', answer: 'Kuwait' }],
  'L': [{ id: 'en_l', letter: 'L', question: 'The king of the jungle?', answer: 'Lion' }],
  'M': [{ id: 'en_m', letter: 'M', question: 'The holiest city in Islam and the birthplace of the Prophet?', answer: 'Mecca' }],
  'N': [{ id: 'en_n', letter: 'N', question: 'The longest river in the world flowing through Egypt?', answer: 'Nile' }],
  'O': [{ id: 'en_o', letter: 'O', question: 'A bird active at night with large eyes and 360-degree neck turn?', answer: 'Owl' }],
  'P': [{ id: 'en_p', letter: 'P', question: 'The capital city of France?', answer: 'Paris' }],
  'Q': [{ id: 'en_q', letter: 'Q', question: 'The holy book of Islam revealed in Arabic?', answer: 'Quran' }],
  'R': [{ id: 'en_r', letter: 'R', question: 'The capital city of the Kingdom of Saudi Arabia?', answer: 'Riyadh' }],
  'S': [{ id: 'en_s', letter: 'S', question: 'A curved single-edged blade weapon carried in the Saudi Ardah?', answer: 'Sword' }],
  'T': [{ id: 'en_t', letter: 'T', question: 'A traditional portable dwelling of woven wool used by Bedouins?', answer: 'Tent' }],
  'U': [{ id: 'en_u', letter: 'U', question: 'A mythical horse-like creature with a single horn on its forehead?', answer: 'Unicorn' }],
  'V': [{ id: 'en_v', letter: 'V', question: 'An instrument with four strings played with a bow?', answer: 'Violin' }],
  'W': [{ id: 'en_w', letter: 'W', question: 'The largest animal ever known to have lived on Earth?', answer: 'Whale' }],
  'X': [{ id: 'en_x', letter: 'X', question: 'A musical percussion instrument with wooden bars struck by mallets?', answer: 'Xylophone' }],
  'Y': [{ id: 'en_y', letter: 'Y', question: 'A Saudi coastal city in Al Madinah region famous for red sea diving?', answer: 'Yanbu' }],
};

// Last Letter Mode (Answer strictly ENDS with the target letter)
export const LAST_LETTER_QUESTIONS: Record<string, QuestionItem[]> = {
  'أ': [
    { id: 'll_alif_1', letter: 'أ', question: 'الاسم الذي يطلق على الصحراء الشاسعة الواسعة؟', answer: 'البيداء / الصحراء', hintEnding: 'أ' },
    { id: 'll_alif_2', letter: 'أ', question: 'أول سورة نزلت في القرآن الكريم وتبدأ بـ "اقرأ"؟', answer: 'العلق / اقرأ', hintEnding: 'أ' },
  ],
  'ب': [
    { id: 'll_ba_1', letter: 'ب', question: 'مكان في المجلس تُوقد فيه النار وتُعد عليه القهوة؟', answer: 'المشب', hintEnding: 'ب' },
    { id: 'll_ba_2', letter: 'ب', question: 'جهاز حاسوب محمول خفيف يمكن حمله في الحقيبة؟', answer: 'اللابتوب / الحاسوب', hintEnding: 'ب' },
  ],
  'ت': [
    { id: 'll_ta_1', letter: 'ت', question: 'سهرة أهل البر في الخيام ليلاً؟', answer: 'المبيت / الكشتات', hintEnding: 'ت' },
    { id: 'll_ta_2', letter: 'ت', question: 'ثمار خضراء أو سوداء تُعصر لاستخراج زيت مبارك؟', answer: 'الزيتون / النبتات', hintEnding: 'ت' },
  ],
  'ث': [
    { id: 'll_tha_1', letter: 'ث', question: 'ما يتركه الإنسان بعد رحيله لأبنائه من أموال وممتلكات؟', answer: 'الميراث / الإرث', hintEnding: 'ث' },
    { id: 'll_tha_2', letter: 'ث', question: 'الرقم الذي يلي الرقم اثنين في العد؟', answer: 'ثلاث / الثالث', hintEnding: 'ث' },
  ],
  'ج': [
    { id: 'll_jeem_1', letter: 'ج', question: 'الركن الخامس من أركان الإسلام ويؤدى في مكة؟', answer: 'الحج', hintEnding: 'ج' },
    { id: 'll_jeem_2', letter: 'ج', question: 'بلورات متجمدة بيضاء تتساقط في الشتاء في تبوك وجبال اللوز؟', answer: 'الثلج', hintEnding: 'ج' },
  ],
  'ح': [
    { id: 'll_ha_1', letter: 'ح', question: 'مادة بيضاء تستخرج من البحر تعطي الطعام نكهته؟', answer: 'الملح', hintEnding: 'ح' },
    { id: 'll_ha_2', letter: 'ح', question: 'طائر جارح يطلق على الصقر الحر؟', answer: 'اللوح / الجارح', hintEnding: 'ح' },
  ],
  'خ': [
    { id: 'll_kha_1', letter: 'خ', question: 'بيت صغير ريفي يُبنى من القش أو الخشب؟', answer: 'الكوخ', hintEnding: 'خ' },
    { id: 'll_kha_2', letter: 'خ', question: 'المكان المخصص لطهي الأطعمة والولائم في البيت؟', answer: 'المطبخ', hintEnding: 'خ' },
  ],
  'د': [
    { id: 'll_dal_1', letter: 'د', question: 'سلاح أبيض حاد يرفع في العرضة الوطنية ورمز الشجاعة؟', answer: 'المهند / الغامد', hintEnding: 'د' },
    { id: 'll_dal_2', letter: 'د', question: 'منطقة نجد التاريخية قلب الجزيرة؟', answer: 'نجد', hintEnding: 'د' },
  ],
  'ذ': [
    { id: 'll_dhal_1', letter: 'ذ', question: 'أحد الحبوب الزراعية الذهبية التي يُصنع منها الفشار؟', answer: 'الذرة / الشاذ', hintEnding: 'ذ' },
    { id: 'll_dhal_2', letter: 'ذ', question: 'طائر جارح سريع من فصيلة الصقور؟', answer: 'الشوحذ', hintEnding: 'ذ' },
  ],
  'ر': [
    { id: 'll_ra_1', letter: 'ر', question: 'طائر جارح عزيز النفس في الجزيرة العربية؟', answer: 'الصقر', hintEnding: 'ر' },
    { id: 'll_ra_2', letter: 'ر', question: 'حطب مشتعل خفيف يُعد عليه الشاي في البر؟', answer: 'الجمر', hintEnding: 'ر' },
    { id: 'll_ra_3', letter: 'ر', question: 'عروس البحر الأحمر وبوابة مكة المكرمة الساحلية؟', answer: 'البحر', hintEnding: 'ر' },
  ],
  'ز': [
    { id: 'll_zay_1', letter: 'ز', question: 'أهم أطباق الولائم السعودية المطهوة مع اللحم؟', answer: 'الرز', hintEnding: 'ز' },
    { id: 'll_zay_2', letter: 'ز', question: 'شجر مبارك طيب الرائحة يُخلط مع الطيب؟', answer: 'الخزام / الأرز', hintEnding: 'ز' },
  ],
  'س': [
    { id: 'll_seen_1', letter: 'س', question: 'النجم المركزي المضيء الذي يمد المجموعة الشمسية بالدفء؟', answer: 'الشمس', hintEnding: 'س' },
    { id: 'll_seen_2', letter: 'س', question: 'أداة خشبية أو جلدية للجلوس في المجلس؟', answer: 'الكرسي / المجلس', hintEnding: 'س' },
  ],
  'ش': [
    { id: 'll_sheen_1', letter: 'ش', question: 'طائر جارح يضرب به المثل في حدة البصر وسرعة الانقضاض؟', answer: 'الوحش / الطاهش', hintEnding: 'ش' },
    { id: 'll_sheen_2', letter: 'ش', question: 'أحد أشهر أقمشة الملابس التقليدية الفاخرة؟', answer: 'القماش / النقش', hintEnding: 'ش' },
  ],
  'ص': [
    { id: 'll_sad_1', letter: 'ص', question: 'طائر جارح يُربى لرحلات الصيد والمقناص؟', answer: 'القنص / الشاهين الخالص', hintEnding: 'ص' },
    { id: 'll_sad_2', letter: 'ص', question: 'مكان محمي لحبس الطيور أو الحيوانات؟', answer: 'القفص', hintEnding: 'ص' },
  ],
  'ض': [
    { id: 'll_dad_1', letter: 'ض', question: 'عاصمة المملكة العربية السعودية وقلبها النابض؟', answer: 'الرياض', hintEnding: 'ض' },
    { id: 'll_dad_2', letter: 'ض', question: 'الكوكب الذي نعيش على سطحه؟', answer: 'الأرض', hintEnding: 'ض' },
  ],
  'ط': [
    { id: 'll_t1', letter: 'ط', question: 'عاصمة المملكة المغربية التي تطل على المحيط الأطلسي؟', answer: 'الرباط', hintEnding: 'ط' },
    { id: 'll_t2', letter: 'ط', question: 'سائل بترولي خام يُستخرج من باطن الأرض؟', answer: 'النفط', hintEnding: 'ط' },
  ],
  'ظ': [
    { id: 'll_za_1', letter: 'ظ', question: 'شدة حرارة الصيف والشمس في الصحراء؟', answer: 'القيظ', hintEnding: 'ظ' },
    { id: 'll_za_2', letter: 'ظ', question: 'النصيب والتوفيق الحسن الذي يُرزق به الإنسان؟', answer: 'الحظ', hintEnding: 'ظ' },
  ],
  'ع': [
    { id: 'll_ayn_1', letter: 'ع', question: 'نبات عشبي عطري يوضع مع الشاي في السهرات؟', answer: 'النعناع', hintEnding: 'ع' },
    { id: 'll_ayn_2', letter: 'ع', question: 'حشرة مضيئة تصدر نوراً في الظلام؟', answer: 'اليراع', hintEnding: 'ع' },
  ],
  'غ': [
    { id: 'll_ghayn_1', letter: 'غ', question: 'طائر صوته حسن يُضرب به المثل في الفصاحة؟', answer: 'البليغ', hintEnding: 'غ' },
    { id: 'll_ghayn_2', letter: 'غ', question: 'مادة ملونة تستخدم لتلوين الأقمشة والجلود؟', answer: 'الصباغ', hintEnding: 'غ' },
  ],
  'ف': [
    { id: 'll_fa_1', letter: 'ف', question: 'كتاب الله الكريم الذي يضم سور القرآن؟', answer: 'المصحف', hintEnding: 'ف' },
    { id: 'll_fa_2', letter: 'ف', question: 'سلاح أبيض قاطع من أدوات الحرب القديمة؟', answer: 'السيف', hintEnding: 'ف' },
  ],
  'ق': [
    { id: 'll_qaf_1', letter: 'ق', question: 'وميض ضوئي خاطف يظهر في السماء مع الرعد؟', answer: 'البرق', hintEnding: 'ق' },
    { id: 'll_qaf_2', letter: 'ق', question: 'طريق تجاري قديم مشهور كان يربط الشرق بالغرب؟', answer: 'طريق الحرير / الشرق', hintEnding: 'ق' },
  ],
  'ك': [
    { id: 'll_kaf_1', letter: 'ك', question: 'اللقب الرسمي لحاكم المملكة العربية السعودية؟', answer: 'الملك', hintEnding: 'ك' },
    { id: 'll_kaf_2', letter: 'ك', question: 'مخلوق نوراني طاهر خلقه الله من نور؟', answer: 'المَلَك', hintEnding: 'ك' },
  ],
  'ل': [
    { id: 'll_l1', letter: 'ل', question: 'سفينة الصحراء والركوبة التاريخية للعرب؟', answer: 'الجمل', hintEnding: 'ل' },
    { id: 'll_l2', letter: 'ل', question: 'كأس صغير تُسكب فيه القهوة السعودية الأصيلة؟', answer: 'الفنجال', hintEnding: 'ل' },
    { id: 'll_l3', letter: 'ل', question: 'شجرة مباركة تستخرج منها التمور في الواحات؟', answer: 'النخل', hintEnding: 'ل' },
  ],
  'م': [
    { id: 'll_meem_1', letter: 'م', question: 'المكان الذي يجتمع فيه الأصحاب والضيوف للسمر والحديث؟', answer: 'المجلس', hintEnding: 'م' },
    { id: 'll_meem_2', letter: 'م', question: 'عنصر طبيعي يُبنى منه بيوت الطين التراثية؟', answer: 'الطين / الرجام', hintEnding: 'م' },
  ],
  'ن': [
    { id: 'll_n1', letter: 'ن', question: 'دولة خليجية شقيقة عاصمتها المنامة؟', answer: 'البحرين', hintEnding: 'ن' },
    { id: 'll_n2', letter: 'ن', question: 'بهار أحمر ذهبي غالي الثمن يُطيب القهوة؟', answer: 'الزعفران', hintEnding: 'ن' },
  ],
  'هـ': [
    { id: 'll_ha_end_1', letter: 'هـ', question: 'المشروب العربي الأكثر دلالة على الكرم والضيافة؟', answer: 'القهوة', hintEnding: 'هـ' },
    { id: 'll_ha_end_2', letter: 'هـ', question: 'خرزات منظومة في سلك تُستخدم للتسبيح والذكر؟', answer: 'السبحة', hintEnding: 'هـ' },
    { id: 'll_ha_end_3', letter: 'هـ', question: 'قبلة المسلمين التي يتجهون إليها في مكة المكرمة؟', answer: 'الكعبة', hintEnding: 'هـ' },
  ],
  'و': [
    { id: 'll_waw_1', letter: 'و', question: 'المكان الواسع الرحب في مدخل البيت أو القصر؟', answer: 'البهو', hintEnding: 'و' },
    { id: 'll_waw_2', letter: 'و', question: 'النقاء والصفاء في الماء أو سماء الصحراء؟', answer: 'الصفو', hintEnding: 'و' },
  ],
  'ي': [
    { id: 'll_ya_1', letter: 'ي', question: 'مشروب ساخن مخدر رفيق السمرات الشتوية على الحطب؟', answer: 'الشاي', hintEnding: 'ي' },
    { id: 'll_ya_2', letter: 'ي', question: 'عشبة برية طيبة الرائحة تنبت بعد هطول الأمطار؟', answer: 'الشيح / الجعدي', hintEnding: 'ي' },
  ],
};

// Categories Hex Questions
export const CATEGORY_TOPICS = [
  'رياضة', 'جغرافيا', 'إسلاميات', 'تقنية', 'تاريخ',
  'سيارات', 'أكلات شعبية', 'أمثال وحكم', 'أفلام وسينما', 'شعر وأدب',
  'معالم وطنية', 'عالم الحيوان', 'ألعاب فيديو', 'لغات وعواصم', 'الطب والصحة',
  'فضاء وفلك', 'بحار ومحيطات', 'شعراء العرب', 'اختراعات', 'مسلسلات',
  'أعلام ودول', 'سياحة ومصايف', 'ألغاز ذكاء', 'تجارة واقتصاد', 'موسيقى وفنون'
];

export const CATEGORY_QUESTIONS: Record<string, QuestionItem[]> = {
  'رياضة': [
    { id: 'cat_spo_1', letter: 'رياضة', question: 'كم عدد لاعبي فريق كرة القدم الأساسيين داخل المستطيل الأخضر؟', answer: '11 لاعباً' },
    { id: 'cat_spo_2', letter: 'رياضة', question: 'الدولة التي فازت بكأس العالم 2022 في قطر؟', answer: 'الأرجنتين' },
  ],
  'جغرافيا': [
    { id: 'cat_geo_1', letter: 'جغرافيا', question: 'أكبر دولة في العالم من حيث المساحة الإجمالية؟', answer: 'روسيا' },
    { id: 'cat_geo_2', letter: 'جغرافيا', question: 'أطول نهر في العالم يمر عبر القارة الأفريقية؟', answer: 'نهر النيل' },
  ],
  'إسلاميات': [
    { id: 'cat_isl_1', letter: 'إسلاميات', question: 'أطول سورة في القرآن الكريم؟', answer: 'سورة البقرة' },
    { id: 'cat_isl_2', letter: 'إسلاميات', question: 'أول مسجد بُني في الإسلام يقع في المدينة المنورة؟', answer: 'مسجد قباء' },
  ],
  'تقنية': [
    { id: 'cat_tec_1', letter: 'تقنية', question: 'نظام تشغيل الهواتف الذكية الأكثر انتشاراً الذي طورته جوجل؟', answer: 'أندرويد (Android)' },
    { id: 'cat_tec_2', letter: 'تقنية', question: 'الشركة المصنعة لهواتف الآيفون وأجهزة الماك؟', answer: 'أبل (Apple)' },
  ],
  'أكلات شعبية': [
    { id: 'cat_foo_1', letter: 'أكلات شعبية', question: 'الطبق الوطني السعودي المكون من الأرز واللحم المتبل والمطبوخ بنكهة تراثية؟', answer: 'الكبسة' },
    { id: 'cat_foo_2', letter: 'أكلات شعبية', question: 'طبق شتوي نجدّي دافئ مصنوع من دقيق البر والتمر والسمن؟', answer: 'الحنيني' },
  ],
  'تاريخ': [
    { id: 'cat_his_1', letter: 'تاريخ', question: 'عام تأسيس الدولة السعودية الأولى على يد الإمام محمد بن سعود؟', answer: '1727م (يوم التأسيس)' },
    { id: 'cat_his_2', letter: 'تاريخ', question: 'الملك المؤسس للمملكة العربية السعودية طيب الله ثراه؟', answer: 'الملك عبد العزيز بن عبد الرحمن آل سعود' },
  ],
  'سيارات': [
    { id: 'cat_car_1', letter: 'سيارات', question: 'شركة السيارات اليابانية صاحبة شعار الحلقات الثلاث البيضاوية المتداخلة؟', answer: 'تويوتا (Toyota)' },
    { id: 'cat_car_2', letter: 'سيارات', question: 'ما هو المكون المسؤول عن إيقاف السيارة عند الضغط على الدواسة؟', answer: 'الفرامل (المكابح)' },
  ],
};

// ==========================================
// 2. BFS GRAPH WIN-CONDITION CHECKER
// ==========================================

// Get adjacent neighbors for odd-r horizontal staggered layout
export function getHexNeighbors(row: number, col: number): { row: number; col: number }[] {
  const neighbors: { row: number; col: number }[] = [];
  const isOdd = row % 2 !== 0;

  // Left & Right
  neighbors.push({ row, col: col - 1 });
  neighbors.push({ row, col: col + 1 });

  if (!isOdd) {
    // Even row
    neighbors.push({ row: row - 1, col: col - 1 });
    neighbors.push({ row: row - 1, col: col });
    neighbors.push({ row: row + 1, col: col - 1 });
    neighbors.push({ row: row + 1, col: col });
  } else {
    // Odd row
    neighbors.push({ row: row - 1, col: col });
    neighbors.push({ row: row - 1, col: col + 1 });
    neighbors.push({ row: row + 1, col: col });
    neighbors.push({ row: row + 1, col: col + 1 });
  }

  // Filter valid grid coordinates (0..4)
  return neighbors.filter(
    (n) => n.row >= 0 && n.row < GRID_ROWS && n.col >= 0 && n.col < GRID_COLS
  );
}

/**
 * Breadth-First Search (BFS) to detect winning unbroken connection
 * Team A (Olivine Green): Connects Left edge (col=0) to Right edge (col=4)
 * Team B (Ochre Yellow): Connects Top edge (row=0) to Bottom edge (row=4)
 */
export function checkWinCondition(grid: HexCell[]): {
  winner: TeamId | null;
  winningPath: string[]; // cell IDs in the winning path
} {
  const gridMap = new Map<string, HexCell>();
  grid.forEach((c) => gridMap.set(`${c.row},${c.col}`, c));

  // --- Check Team A (Horizontal: Left col=0 to Right col=4) ---
  const teamAStarts = grid.filter((c) => c.owner === 'team_a' && c.col === 0);
  for (const start of teamAStarts) {
    const visited = new Set<string>();
    const parentMap = new Map<string, string>();
    const queue: HexCell[] = [start];
    visited.add(`${start.row},${start.col}`);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.col === GRID_COLS - 1) {
        // Reconstruct path
        const path: string[] = [];
        let currKey: string | undefined = `${current.row},${current.col}`;
        while (currKey) {
          const cell = gridMap.get(currKey);
          if (cell) path.push(cell.id);
          currKey = parentMap.get(currKey);
        }
        return { winner: 'team_a', winningPath: path };
      }

      for (const n of getHexNeighbors(current.row, current.col)) {
        const key = `${n.row},${n.col}`;
        const neighborCell = gridMap.get(key);
        if (neighborCell && neighborCell.owner === 'team_a' && !visited.has(key)) {
          visited.add(key);
          parentMap.set(key, `${current.row},${current.col}`);
          queue.push(neighborCell);
        }
      }
    }
  }

  // --- Check Team B (Vertical: Top row=0 to Bottom row=4) ---
  const teamBStarts = grid.filter((c) => c.owner === 'team_b' && c.row === 0);
  for (const start of teamBStarts) {
    const visited = new Set<string>();
    const parentMap = new Map<string, string>();
    const queue: HexCell[] = [start];
    visited.add(`${start.row},${start.col}`);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.row === GRID_ROWS - 1) {
        // Reconstruct path
        const path: string[] = [];
        let currKey: string | undefined = `${current.row},${current.col}`;
        while (currKey) {
          const cell = gridMap.get(currKey);
          if (cell) path.push(cell.id);
          currKey = parentMap.get(currKey);
        }
        return { winner: 'team_b', winningPath: path };
      }

      for (const n of getHexNeighbors(current.row, current.col)) {
        const key = `${n.row},${n.col}`;
        const neighborCell = gridMap.get(key);
        if (neighborCell && neighborCell.owner === 'team_b' && !visited.has(key)) {
          visited.add(key);
          parentMap.set(key, `${current.row},${current.col}`);
          queue.push(neighborCell);
        }
      }
    }
  }

  return { winner: null, winningPath: [] };
}

// ==========================================
// 3. HEX BOARD GENERATOR
// ==========================================

// ==========================================
// 3. HEX BOARD GENERATOR (Strict Fisher-Yates 25 Unique Sampling)
// ==========================================

export function fisherYatesShuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

export function generateHexGrid(gameModeId: string = 'letter-classic'): HexCell[] {
  const cells: HexCell[] = [];
  let index = 0;

  if (gameModeId === 'letter-en') {
    // English mode: sample 25 strictly UNIQUE letters
    const allEn = ENGLISH_LETTERS.length >= TOTAL_CELLS ? ENGLISH_LETTERS : [...ENGLISH_LETTERS, 'Z'];
    const uniqueLetters = fisherYatesShuffle(allEn).slice(0, TOTAL_CELLS);

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const letter = uniqueLetters[index];
        const qList = ENGLISH_QUESTIONS[letter] || [{
          id: `q_${letter}`,
          letter,
          question: `Name an authentic word starting with ${letter}?`,
          answer: letter + ' word'
        }];
        const q = qList[Math.floor(Math.random() * qList.length)];

        cells.push({
          id: `cell_${row}_${col}`,
          row,
          col,
          label: letter,
          owner: 'none',
          question: q,
        });
        index++;
      }
    }
  } else if (gameModeId === 'letter-last') {
    // Last Letter mode: sample 25 strictly UNIQUE Arabic letters (NO duplicates!)
    const uniqueLetters = fisherYatesShuffle(ARABIC_LETTERS).slice(0, TOTAL_CELLS);

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const endingLetter = uniqueLetters[index];
        const qList = LAST_LETTER_QUESTIONS[endingLetter] || [{
          id: `q_last_${endingLetter}`,
          letter: endingLetter,
          question: `كلمة تنتهي بحرف ${endingLetter}؟`,
          answer: `إجابة تنتهي بـ ${endingLetter}`,
          hintEnding: endingLetter
        }];
        const q = qList[Math.floor(Math.random() * qList.length)];

        cells.push({
          id: `cell_${row}_${col}`,
          row,
          col,
          label: endingLetter,
          owner: 'none',
          question: q,
        });
        index++;
      }
    }
  } else if (gameModeId === 'letter-categories') {
    // Category Hex mode: sample 25 strictly UNIQUE categories
    const uniqueTopics = fisherYatesShuffle(CATEGORY_TOPICS).slice(0, TOTAL_CELLS);

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const topic = uniqueTopics[index] || 'معلومات عامة';
        const qList = CATEGORY_QUESTIONS[topic] || [{
          id: `q_cat_${index}`,
          letter: topic,
          question: `سؤال في مجال ${topic}؟`,
          answer: `إجابة السؤال`
        }];
        const q = qList[Math.floor(Math.random() * qList.length)];

        cells.push({
          id: `cell_${row}_${col}`,
          row,
          col,
          label: topic,
          owner: 'none',
          question: q,
        });
        index++;
      }
    }
  } else {
    // Default: Classic Arabic Letter Hex: sample 25 strictly UNIQUE Arabic letters
    const uniqueLetters = fisherYatesShuffle(ARABIC_LETTERS).slice(0, TOTAL_CELLS);

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const letter = uniqueLetters[index];
        const qList = ARABIC_QUESTIONS[letter] || [{
          id: `q_ar_${letter}`,
          letter,
          question: `سؤال يبدأ بحرف ${letter}؟`,
          answer: `إجابة تبدأ بحرف ${letter}`
        }];
        const q = qList[Math.floor(Math.random() * qList.length)];

        cells.push({
          id: `cell_${row}_${col}`,
          row,
          col,
          label: letter,
          owner: 'none',
          question: q,
        });
        index++;
      }
    }
  }

  return cells;
}

/**
 * Fetch a fresh random question for the exact same letter/cell from question bank with zero repetition depletion
 */
export function getRandomQuestionForCell(
  cell: HexCell,
  gameModeId?: string,
  excludeId?: string,
  usedQuestionIds: string[] = []
): { question: QuestionItem; baseId: string } {
  const label = cell.label;
  let qList: QuestionItem[] = [];

  if (gameModeId === 'letter-last') {
    qList = LAST_LETTER_QUESTIONS[label] || [];
  } else if (gameModeId === 'letter-en') {
    qList = ENGLISH_QUESTIONS[label] || [];
  } else if (gameModeId === 'letter-categories') {
    qList = CATEGORY_QUESTIONS[label] || [];
  } else {
    qList = ARABIC_QUESTIONS[label] || [];
  }

  // Depletion Engine: filter out all questions whose base ID is already in usedQuestionIds
  let available = qList.filter((q) => !usedQuestionIds.includes(q.id) && (!excludeId || q.id !== excludeId));

  // If all questions for this letter/category have been exhausted, reset depletion pool for this letter
  if (available.length === 0) {
    available = excludeId ? qList.filter((q) => q.id !== excludeId) : qList;
    if (available.length === 0) available = qList;
  }

  if (available.length > 0) {
    const picked = available[Math.floor(Math.random() * available.length)];
    return {
      question: {
        ...picked,
        id: `${picked.id}_${Date.now()}`,
      },
      baseId: picked.id,
    };
  }

  const fallbackBaseId = `q_alt_${cell.id}`;
  return {
    question: {
      id: `${fallbackBaseId}_${Date.now()}`,
      letter: label,
      question: `سؤال بديل: ما هو الشيء أو المعنى الأكثر شهرة المرتبط بـ (${label})؟`,
      answer: label + ' (إجابة مقبولة)',
      category: cell.question?.category,
      hintEnding: cell.question?.hintEnding,
    },
    baseId: fallbackBaseId,
  };
}
