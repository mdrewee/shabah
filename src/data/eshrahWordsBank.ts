import { EshrahCategory, EshrahPromptItem } from '../types/eshrah';

export const ESHRAH_CATEGORIES_CONFIG: { id: EshrahCategory; label: string; iconName: string }[] = [
  { id: 'football', label: 'كرة قدم', iconName: 'Trophy' },
  { id: 'tv_series', label: 'مسلسلات', iconName: 'Tv' },
  { id: 'movies', label: 'أفلام', iconName: 'Film' },
  { id: 'proverbs', label: 'حكمة ومثل', iconName: 'Quote' },
  { id: 'theater', label: 'مسرحية', iconName: 'Drama' },
  { id: 'tools', label: 'أدوات', iconName: 'Wrench' },
  { id: 'food', label: 'أكلات', iconName: 'Utensils' },
  { id: 'countries', label: 'دول', iconName: 'Globe' }
];

export const ESHRAH_WORDS_BANK: EshrahPromptItem[] = [
  // ==========================================
  // 1. كرة قدم (FOOTBALL)
  // ==========================================
  { id: 'fb_01', category: 'football', text: 'سالم الدوسري', forbiddenWords: ['الهلال', 'خلط', 'تورنيدو', 'جناح'] },
  { id: 'fb_02', category: 'football', text: 'ماجد عبد الله', forbiddenWords: ['النصر', 'السهم الملتهب', 'رقم 9', 'أساطير'] },
  { id: 'fb_03', category: 'football', text: 'سامي الجابر', forbiddenWords: ['الهلال', 'ذئب', 'كابتن', 'بلنتي'] },
  { id: 'fb_04', category: 'football', text: 'يوسف الثنيان', forbiddenWords: ['الفيلسوف', 'مهارات', 'مراوغة', 'الهلال'] },
  { id: 'fb_05', category: 'football', text: 'محمد نور', forbiddenWords: ['الاتحاد', 'العميد', 'وسط', 'قوة'] },
  { id: 'fb_06', category: 'football', text: 'كريستيانو رونالدو', forbiddenWords: ['النصر', 'الدون', 'سي', 'البرتغال'] },
  { id: 'fb_07', category: 'football', text: 'تقنية الفار (VAR)', forbiddenWords: ['شاشة', 'حكم', 'إعادة', 'تسلل'] },
  { id: 'fb_08', category: 'football', text: 'بلنتي ضايع', forbiddenWords: ['ضربة جزاء', 'عارضة', 'حارس', 'شوتة'] },
  { id: 'fb_09', category: 'football', text: 'تسلل', forbiddenWords: ['راية', 'خط', 'مهاجم', 'مدافع'] },
  { id: 'fb_10', category: 'football', text: 'كوبري', forbiddenWords: ['بين رجلين', 'حركة', 'إهانة', 'سحب'] },
  { id: 'fb_11', category: 'football', text: 'كرت أحمر', forbiddenWords: ['طرد', 'حكم', 'مخالفة', 'ملعب'] },
  { id: 'fb_12', category: 'football', text: 'ضربة مقصية', forbiddenWords: ['دبل كيك', 'هواء', 'شقلبة', 'هدف'] },
  { id: 'fb_13', category: 'football', text: 'هدف عكسي', forbiddenWords: ['مرماه', 'مدافع', 'غلطة', 'حارس'] },
  { id: 'fb_14', category: 'football', text: 'تبديل في الدقيقة 90', forbiddenWords: ['وقت ضائع', 'مدرب', 'خروج', 'لوحة'] },
  { id: 'fb_15', category: 'football', text: 'ملعب الجوهرة المشعة', forbiddenWords: ['جدة', 'استاد', 'مباراة', 'نهائي'] },
  { id: 'fb_16', category: 'football', text: 'رابطة المشجعين', forbiddenWords: ['مكبر صوت', 'أهازيج', 'طبلة', 'مدرج'] },
  { id: 'fb_17', category: 'football', text: 'حائط صد', forbiddenWords: ['فاول', 'لاعبين', 'صف', 'حماية'] },
  { id: 'fb_18', category: 'football', text: 'ركلة ركنية', forbiddenWords: ['زاوية', 'عرضية', 'رأسية', 'خط'] },
  { id: 'fb_19', category: 'football', text: 'إصابة في العضلة الضامة', forbiddenWords: ['شد', 'نقالة', 'دكتور', 'علاج'] },
  { id: 'fb_20', category: 'football', text: 'بلنتي بانينكا', forbiddenWords: ['ساقطة', 'نص المرمى', 'استهتار', 'خفة'] },

  // ==========================================
  // 2. مسلسلات (TV SERIES)
  // ==========================================
  { id: 'tv_01', category: 'tv_series', text: 'طاش ما طاش', forbiddenWords: ['ناصر', 'عبدالله', 'رمضان', 'كوميديا'] },
  { id: 'tv_02', category: 'tv_series', text: 'شباب البومب', forbiddenWords: ['عامر', 'شكش', 'كفتة', 'استراحة'] },
  { id: 'tv_03', category: 'tv_series', text: 'رشاش', forbiddenWords: ['صحراء', 'عصابة', 'شاهد', 'مطاردة'] },
  { id: 'tv_04', category: 'tv_series', text: 'سكة سفر', forbiddenWords: ['محطة', 'بنزين', 'ثلاثة إخوان', 'جنوب'] },
  { id: 'tv_05', category: 'tv_series', text: 'منهو ولدنا', forbiddenWords: ['تبديل', 'فقير', 'غني', 'شركة'] },
  { id: 'tv_06', category: 'tv_series', text: 'الزير سالم', forbiddenWords: ['كليب', 'جساس', 'حرب البسوس', 'سيف'] },
  { id: 'tv_07', category: 'tv_series', text: 'درب الزلق', forbiddenWords: ['عبدالحسين', 'سعد الفرج', 'أهرامات', 'كلاب'] },
  { id: 'tv_08', category: 'tv_series', text: 'خالتي قماشة', forbiddenWords: ['حياة الفهد', 'كاميرات', 'بيت', 'زوجات'] },
  { id: 'tv_09', category: 'tv_series', text: 'الحيالة', forbiddenWords: ['مانع', 'دواس', 'فخرية', 'خرفان'] },
  { id: 'tv_10', category: 'tv_series', text: 'دنيا القوي', forbiddenWords: ['دراما', 'صياح', 'كويت', 'فلوس'] },
  { id: 'tv_11', category: 'tv_series', text: 'أم خماس', forbiddenWords: ['كرتون', 'عجايز', 'برقع', 'فالة'] },
  { id: 'tv_12', category: 'tv_series', text: 'أبو الملايين', forbiddenWords: ['ناصر القصبي', 'عبدالحسين', 'بنك', 'تهريب'] },
  { id: 'tv_13', category: 'tv_series', text: 'صقور البادية', forbiddenWords: ['خيل', 'صحراء', 'غزو', 'قصيد'] },
  { id: 'tv_14', category: 'tv_series', text: 'خريف القلب', forbiddenWords: ['تركي', 'حزن', 'حب', 'شتاء'] },
  { id: 'tv_15', category: 'tv_series', text: 'باب الحارة', forbiddenWords: ['أبو عصام', 'حارة الضبع', 'عكيد', 'فرنسا'] },
  { id: 'tv_16', category: 'tv_series', text: 'شارع الهرم', forbiddenWords: ['هدى حسين', 'عرس', 'أطباء', 'رقص'] },
  { id: 'tv_17', category: 'tv_series', text: 'العوف', forbiddenWords: ['حلقات', 'قديم', 'تلفزيون', 'زمان'] },
  { id: 'tv_18', category: 'tv_series', text: 'أمينة حاف', forbiddenWords: ['ضرات', 'أربع زوجات', 'فلوس', 'فارس'] },
  { id: 'tv_19', category: 'tv_series', text: 'غشمشم', forbiddenWords: ['فهد الحيان', 'ضحك', 'قرية', 'سيارة'] },
  { id: 'tv_20', category: 'tv_series', text: 'بيني وبينك', forbiddenWords: ['مناحي', 'مفرح', 'دنحي', 'طاش'] },

  // ==========================================
  // 3. أفلام (MOVIES)
  // ==========================================
  { id: 'mv_01', category: 'movies', text: 'شمس المعارف', forbiddenWords: ['يوتيوب', 'مدرسة', 'كاميرا', 'إخراج'] },
  { id: 'mv_02', category: 'movies', text: 'سطار', forbiddenWords: ['مصارعة', 'خوخة', 'حلبة', 'فيلم'] },
  { id: 'mv_03', category: 'movies', text: 'الهامور ح.ع', forbiddenWords: ['مساهمات', 'فلوس', 'احتيال', 'حامد'] },
  { id: 'mv_04', category: 'movies', text: 'الخلاط+', forbiddenWords: ['تلفاز', 'أربع قصص', 'سرقة', 'كذب'] },
  { id: 'mv_05', category: 'movies', text: 'مندوب الليل', forbiddenWords: ['توصيل', 'تطبيق', 'ليل', 'الرياض'] },
  { id: 'mv_06', category: 'movies', text: 'حوجن', forbiddenWords: ['جني', 'إنسية', 'رواية', 'سحر'] },
  { id: 'mv_07', category: 'movies', text: 'حد الطار', forbiddenWords: ['سياف', 'طقاقة', 'عرس', 'حب'] },
  { id: 'mv_08', category: 'movies', text: 'ولاد رزق', forbiddenWords: ['أحمد عز', 'سرقة', 'أكشن', 'مصر'] },
  { id: 'mv_09', category: 'movies', text: 'الفيل الأزرق', forbiddenWords: ['كريم عبدالعزيز', 'مستشفى مجانين', 'وشم', 'جن'] },
  { id: 'mv_10', category: 'movies', text: 'تيتانيك', forbiddenWords: ['سفينة', 'جليد', 'غرق', 'جاك'] },
  { id: 'mv_11', category: 'movies', text: 'الجوكر', forbiddenWords: ['مهرج', 'ضحكة', 'باتمان', 'مكياج'] },
  { id: 'mv_12', category: 'movies', text: 'أفاتار', forbiddenWords: ['كائنات زرقاء', 'غابة', 'طيران', 'شجرة'] },
  { id: 'mv_13', category: 'movies', text: 'العراب (The Godfather)', forbiddenWords: ['مافيا', 'إيطاليا', 'مسدس', 'عائلة'] },
  { id: 'mv_14', category: 'movies', text: 'سبايدرمان', forbiddenWords: ['عنكبوت', 'شبكة', 'بيتر باركر', 'قناع'] },
  { id: 'mv_15', category: 'movies', text: 'كيرة والجن', forbiddenWords: ['إنجليز', 'ثورة', 'مقاومة', 'تاريخ'] },
  { id: 'mv_16', category: 'movies', text: 'رولم', forbiddenWords: ['جدة', 'سينما', 'كاميرا', 'سعودي'] },
  { id: 'mv_17', category: 'movies', text: 'الناظر', forbiddenWords: ['علاء ولي الدين', 'صلاح الدين', 'مدرسة', 'عاطف'] },
  { id: 'mv_18', category: 'movies', text: 'صعيدي في الجامعة الأمريكية', forbiddenWords: ['محمد هنيدي', 'بدلة صفراء', 'خلف الدهشوري', 'أمريكا'] },
  { id: 'mv_19', category: 'movies', text: 'أمير البحار', forbiddenWords: ['قرصان', 'سفينة', 'بحر', 'هنيدي'] },
  { id: 'mv_20', category: 'movies', text: 'حرامية في تايلاند', forbiddenWords: ['لوحة', 'بانكوك', 'كريم عبدالعزيز', 'سرقة'] },

  // ==========================================
  // 4. حكمة ومثل (PROVERBS)
  // ==========================================
  { id: 'pr_01', category: 'proverbs', text: 'القرد في عين أمه غزال', forbiddenWords: ['حيوان', 'أم', 'جمال', 'غابة'] },
  { id: 'pr_02', category: 'proverbs', text: 'اللي ما يطول العنب حامض عنه يقول', forbiddenWords: ['فاكهة', 'شجرة', 'حامض', 'طعام'] },
  { id: 'pr_03', category: 'proverbs', text: 'من طق طبله قال أنا قبله', forbiddenWords: ['طبل', 'عرس', 'حفلة', 'أول'] },
  { id: 'pr_04', category: 'proverbs', text: 'الباب اللي يجيك منه ريح سده واستريح', forbiddenWords: ['هواء', 'خشب', 'قفل', 'راحة'] },
  { id: 'pr_05', category: 'proverbs', text: 'عصفور باليد ولا عشرة على الشجرة', forbiddenWords: ['طير', 'أغصان', 'صيد', 'أفضل'] },
  { id: 'pr_06', category: 'proverbs', text: 'حبل الكذب قصير', forbiddenWords: ['صدق', 'حقيقة', 'انكشف', 'طويل'] },
  { id: 'pr_07', category: 'proverbs', text: 'إذا فات الفوت ما ينفع الصوت', forbiddenWords: ['وقت', 'صراخ', 'ندم', 'تأخير'] },
  { id: 'pr_08', category: 'proverbs', text: 'يا شين السرج على البقر', forbiddenWords: ['حصان', 'حمار', 'شكل', 'راكب'] },
  { id: 'pr_09', category: 'proverbs', text: 'يسرق الكحل من العين', forbiddenWords: ['حرامي', 'مكياج', 'شاطر', 'سرقة'] },
  { id: 'pr_10', category: 'proverbs', text: 'اللي ما يعرف الصقر يشويه', forbiddenWords: ['طير', 'نار', 'لحم', 'صيد'] },
  { id: 'pr_11', category: 'proverbs', text: 'مداح نفسه كذاب', forbiddenWords: ['مدح', 'كذب', 'غرور', 'تفاخر'] },
  { id: 'pr_12', category: 'proverbs', text: 'يد وحدة ما تصفق', forbiddenWords: ['كف', 'تعاون', 'اثنان', 'صوت'] },
  { id: 'pr_13', category: 'proverbs', text: 'الصبر مفتاح الفرج', forbiddenWords: ['انتظار', 'حل', 'باب', 'هم'] },
  { id: 'pr_14', category: 'proverbs', text: 'كل ساقط وله لاقط', forbiddenWords: ['طاح', 'أخذ', 'شخص', 'نصيب'] },
  { id: 'pr_15', category: 'proverbs', text: 'رجعت حليمة لعادتها القديمة', forbiddenWords: ['تكرار', 'ما تغير', 'طبع', 'سابق'] },
  { id: 'pr_16', category: 'proverbs', text: 'على قد لحافك مد رجليك', forbiddenWords: ['بطانية', 'نوم', 'فلوس', 'صرف'] },
  { id: 'pr_17', category: 'proverbs', text: 'ضربني وبكى وسبقني واشتكى', forbiddenWords: ['ظلم', 'دموع', 'محكمة', 'كذب'] },
  { id: 'pr_18', category: 'proverbs', text: 'وافق شن طبقة', forbiddenWords: ['تشابه', 'زواج', 'اتفاق', 'مثل'] },
  { id: 'pr_19', category: 'proverbs', text: 'يا مدور الهين ترى الكايد أحلى', forbiddenWords: ['سهل', 'صعب', 'تعب', 'طريق'] },
  { id: 'pr_20', category: 'proverbs', text: 'ما طار طير وارتفع إلا كما طار وقع', forbiddenWords: ['سقوط', 'غرور', 'سماء', 'جناح'] },

  // ==========================================
  // 5. مسرحية (THEATER)
  // ==========================================
  { id: 'th_01', category: 'theater', text: 'مدرسة المشاغبين', forbiddenWords: ['عادل إمام', 'سعيد صالح', 'فصل', 'ناظر'] },
  { id: 'th_02', category: 'theater', text: 'باي باي لندن', forbiddenWords: ['عبدالحسين', 'سفر', 'بريطانيا', 'غانم الصالح'] },
  { id: 'th_03', category: 'theater', text: 'الواد سيد الشغال', forbiddenWords: ['عادل إمام', 'خادم', 'بشوات', 'شربات'] },
  { id: 'th_04', category: 'theater', text: 'العيال كبرت', forbiddenWords: ['رمضان السكري', 'سلطان', 'كمال', 'عاطف'] },
  { id: 'th_05', category: 'theater', text: 'شاهد ما شفش حاجة', forbiddenWords: ['سرحان عبدالبصير', 'محكمة', 'أرنب', 'قتل'] },
  { id: 'th_06', category: 'theater', text: 'لولاكي', forbiddenWords: ['طارق العلي', 'ولد الديرة', 'خدم', 'كويت'] },
  { id: 'th_07', category: 'theater', text: 'المتزوجون', forbiddenWords: ['سمير غانم', 'جورج سيدهم', 'بيض', 'صرصار'] },
  { id: 'th_08', category: 'theater', text: 'سيف العرب', forbiddenWords: ['عبدالحسين', 'صدام', 'غزو', 'جيش'] },
  { id: 'th_09', category: 'theater', text: 'خاربة خاربة', forbiddenWords: ['طارق العلي', 'عبدالرحمن العقل', 'بيت', 'ضحك'] },
  { id: 'th_10', category: 'theater', text: 'قناص خيطان', forbiddenWords: ['عبدالحسين', 'حياة الفهد', 'عمارة', 'بندق'] },
  { id: 'th_11', category: 'theater', text: 'حاميها حراميها', forbiddenWords: ['طارق العلي', 'شرطي', 'حرامي', 'سرقة'] },
  { id: 'th_12', category: 'theater', text: 'الزعيم', forbiddenWords: ['عادل إمام', 'رئيس', 'جمهورية', 'شبه'] },
  { id: 'th_13', category: 'theater', text: 'سك على بناتك', forbiddenWords: ['فؤاد المهندس', 'سوسن بدر', 'أب', 'زواج'] },
  { id: 'th_14', category: 'theater', text: 'ضحية بيت العز', forbiddenWords: ['سعد الفرج', 'عبدالعزيز النمش', 'أم عليوي', 'كويت'] },
  { id: 'th_15', category: 'theater', text: 'بشت المدير', forbiddenWords: ['طارق العلي', 'شركة', 'فلوس', 'ترقية'] },

  // ==========================================
  // 6. أدوات وأشياء (TOOLS)
  // ==========================================
  { id: 'tl_01', category: 'tools', text: 'منفاخ كفرات', forbiddenWords: ['سيارة', 'هواء', 'بنشري', 'ضغط'] },
  { id: 'tl_02', category: 'tools', text: 'دلة رسلان', forbiddenWords: ['قهوة', 'فنجال', 'هيل', 'صب'] },
  { id: 'tl_03', category: 'tools', text: 'عصا مكنسة', forbiddenWords: ['تنظيف', 'خشب', 'أرض', 'غبار'] },
  { id: 'tl_04', category: 'tools', text: 'اشتراك سيارة', forbiddenWords: ['بطارية', 'كيبل', 'كهرباء', 'طفت'] },
  { id: 'tl_05', category: 'tools', text: 'شاحن سفري (باور بانك)', forbiddenWords: ['سلك', 'جوال', 'شحن', 'بطارية'] },
  { id: 'tl_06', category: 'tools', text: 'طفاية حريق', forbiddenWords: ['نار', 'أحمر', 'بودرة', 'دخان'] },
  { id: 'tl_07', category: 'tools', text: 'دريل كهربائي', forbiddenWords: ['خرق', 'جدار', 'مسمار', 'صوت'] },
  { id: 'tl_08', category: 'tools', text: 'مركى استراحة', forbiddenWords: ['جلسة', 'اتكاء', 'قماش', 'أرض'] },
  { id: 'tl_09', category: 'tools', text: 'ولاعة فحم', forbiddenWords: ['شيشة', 'شواء', 'غاز', 'نار'] },
  { id: 'tl_10', category: 'tools', text: 'دافور غاز', forbiddenWords: ['كشتة', 'طبخ', 'برتقالي', 'شاي'] },
  { id: 'tl_11', category: 'tools', text: 'ساطور مشحوذ', forbiddenWords: ['لحم', 'تقطيع', 'سكين', 'مطبخ'] },
  { id: 'tl_12', category: 'tools', text: 'مقص أظافر', forbiddenWords: ['يد', 'رجل', 'قص', 'حديد'] },
  { id: 'tl_13', category: 'tools', text: 'مفتاح عجل', forbiddenWords: ['جنط', 'كفر', 'سيارة', 'صليب'] },
  { id: 'tl_14', category: 'tools', text: 'مروحة شفط', forbiddenWords: ['مطبخ', 'حمام', 'هواء', 'دخان'] },
  { id: 'tl_15', category: 'tools', text: 'ميزان حرارة', forbiddenWords: ['سخونة', 'حرارة', 'فم', 'طبيب'] },
  { id: 'tl_16', category: 'tools', text: 'مظلة مطر', forbiddenWords: ['شمسية', 'ماء', 'شتاء', 'حماية'] },
  { id: 'tl_17', category: 'tools', text: 'كاوية بخار', forbiddenWords: ['ثوب', 'ملابس', 'حار', 'مغسلة'] },
  { id: 'tl_18', category: 'tools', text: 'كرتون مناديل رول', forbiddenWords: ['مسح', 'حمام', 'ورق', 'استراحة'] },
  { id: 'tl_19', category: 'tools', text: 'مغناطيس', forbiddenWords: ['حديد', 'سحب', 'قطب', 'يلصق'] },
  { id: 'tl_20', category: 'tools', text: 'منبه عقارب قديم', forbiddenWords: ['ساعة', 'صوت', 'نوم', 'جرس'] },

  // ==========================================
  // 7. أكلات (FOOD)
  // ==========================================
  { id: 'fd_01', category: 'food', text: 'كبسة حاشي', forbiddenWords: ['رز', 'لحم جمل', 'مضغوط', 'قدر'] },
  { id: 'fd_02', category: 'food', text: 'معصوب بالقشطة', forbiddenWords: ['موز', 'فطيرة', 'عسل', 'جبن'] },
  { id: 'fd_03', category: 'food', text: 'سليق طائفي', forbiddenWords: ['حليب', 'دجاج', 'سمن', 'رز مصري'] },
  { id: 'fd_04', category: 'food', text: 'مندي لحم', forbiddenWords: ['حفرة', 'برميل', 'تيس', 'شحم'] },
  { id: 'fd_05', category: 'food', text: 'مطازيز', forbiddenWords: ['عجين', 'مرق', 'خضار', 'قرص'] },
  { id: 'fd_06', category: 'food', text: 'جريش أحمر', forbiddenWords: ['قمح', 'لبن', 'بصل', 'سمن'] },
  { id: 'fd_07', category: 'food', text: 'قرصان', forbiddenWords: ['خبز ناشف', 'لحم', 'كوسة', 'تشريب'] },
  { id: 'fd_08', category: 'food', text: 'حنيني', forbiddenWords: ['تمر', 'سمن', 'شتاء', 'دفا'] },
  { id: 'fd_09', category: 'food', text: 'كبدة حاشي صاج', forbiddenWords: ['فطور', 'جبن', 'شطة', 'خبز'] },
  { id: 'fd_10', category: 'food', text: 'شاورما صاروخ', forbiddenWords: ['ثوم', 'دجاج', 'مخلل', 'بطاطس'] },
  { id: 'fd_11', category: 'food', text: 'مفطح نعيمي', forbiddenWords: ['خروف', 'عزيمة', 'بيض', 'زعفران'] },
  { id: 'fd_12', category: 'food', text: 'تميس بسكوت', forbiddenWords: ['فرن', 'فول', 'خبز', 'حار'] },
  { id: 'fd_13', category: 'food', text: 'فول قلابة', forbiddenWords: ['جرة', 'زيت زيتون', 'كمون', 'فطور'] },
  { id: 'fd_14', category: 'food', text: 'مرقوق باللحم', forbiddenWords: ['عجين رقيق', 'خضار', 'قرع', 'مرقة'] },
  { id: 'fd_15', category: 'food', text: 'كنافة نابلسية', forbiddenWords: ['جبنة', 'شيرة', 'خشنة', 'فستق'] },
  { id: 'fd_16', category: 'food', text: 'بخاري دجاج شواية', forbiddenWords: ['جزر', 'حمص', 'شطة', 'رز أحمر'] },
  { id: 'fd_17', category: 'food', text: 'أم علي', forbiddenWords: ['مكسرات', 'حليب', 'فرن', 'حلى'] },
  { id: 'fd_18', category: 'food', text: 'بلاليط', forbiddenWords: ['شعيرية', 'بيض', 'هيل', 'سكر'] },
  { id: 'fd_19', category: 'food', text: 'عريكة جنوبية', forbiddenWords: ['سمن', 'عسل', 'تمر', 'رضيفة'] },
  { id: 'fd_20', category: 'food', text: 'سمبوسة جبن', forbiddenWords: ['رمضان', 'زيت', 'قلي', 'عجين'] },

  // ==========================================
  // 8. دول (COUNTRIES)
  // ==========================================
  { id: 'cn_01', category: 'countries', text: 'اليابان', forbiddenWords: ['طوكيو', 'سوشي', 'أنمي', 'آسيا'] },
  { id: 'cn_02', category: 'countries', text: 'البرازيل', forbiddenWords: ['كرة قدم', 'سامبا', 'ريو', 'غابات'] },
  { id: 'cn_03', category: 'countries', text: 'مصر', forbiddenWords: ['القاهرة', 'أهرامات', 'نيل', 'فراعنة'] },
  { id: 'cn_04', category: 'countries', text: 'تركيا', forbiddenWords: ['إسطنبول', 'شاورما', 'مسلسلات', 'سياحة'] },
  { id: 'cn_05', category: 'countries', text: 'جورجيا', forbiddenWords: ['جبال', 'طبيعة', 'تبليسي', 'ثلوج'] },
  { id: 'cn_06', category: 'countries', text: 'بريطانيا', forbiddenWords: ['لندن', 'ساعة بيج بن', 'ضباب', 'شاي'] },
  { id: 'cn_07', category: 'countries', text: 'إيطاليا', forbiddenWords: ['بيتزا', 'باستا', 'روما', 'برج بيزا'] },
  { id: 'cn_08', category: 'countries', text: 'المغرب', forbiddenWords: ['كازابلانكا', 'أتاي', 'كسكس', 'طاجين'] },
  { id: 'cn_09', category: 'countries', text: 'كندا', forbiddenWords: ['شتاء', 'برد', 'شجرة القيقب', 'أمريكا'] },
  { id: 'cn_10', category: 'countries', text: 'الهند', forbiddenWords: ['فلفل', 'حار', 'بوليوود', 'تاج محل'] },
  { id: 'cn_11', category: 'countries', text: 'فرنسا', forbiddenWords: ['باريس', 'برج إيفل', 'عطور', 'كرواسون'] },
  { id: 'cn_12', category: 'countries', text: 'أستراليا', forbiddenWords: ['كنغر', 'سيدني', 'قارة', 'كوالا'] },
  { id: 'cn_13', category: 'countries', text: 'تايلاند', forbiddenWords: ['بانكوك', 'مساج', 'فيلة', 'جزر'] },
  { id: 'cn_14', category: 'countries', text: 'الكويت', forbiddenWords: ['أبراج', 'سوق المباركية', 'دينار', 'خليج'] },
  { id: 'cn_15', category: 'countries', text: 'الأرجنتين', forbiddenWords: ['ميسي', 'مارادونا', 'تانغو', 'بوينس آيرس'] },
  { id: 'cn_16', category: 'countries', text: 'سويسرا', forbiddenWords: ['جبال الألب', 'ساعات', 'شوكولاتة', 'بنوك'] },
  { id: 'cn_17', category: 'countries', text: 'إسبانيا', forbiddenWords: ['مدريد', 'برشلونة', 'مصارعة ثيران', 'أندلس'] },
  { id: 'cn_18', category: 'countries', text: 'روسيا', forbiddenWords: ['موسكو', 'برد', 'بوتين', 'دب'] },
  { id: 'cn_19', category: 'countries', text: 'اليونان', forbiddenWords: ['أثينا', 'جزر', 'فلسفة', 'أبيض وأزرق'] },
  { id: 'cn_20', category: 'countries', text: 'كوريا الجنوبية', forbiddenWords: ['سيول', 'كيبوب', 'دراما', 'سامسونج'] },

  // ==========================================
  // كلمات حديثة إضافية (MODERN KEYWORDS)
  // ==========================================
  { id: 'mod_01', category: 'football', text: 'جود بيلينغهام', forbiddenWords: ['ريال مدريد', 'إنجلترا', 'احتفال فتح اليدين', 'وسط'] },
  { id: 'mod_02', category: 'football', text: 'كيليان مبابي', forbiddenWords: ['فرنسا', 'باريس', 'سرعة', 'قناع'] },
  { id: 'mod_03', category: 'football', text: 'دوري روشن', forbiddenWords: ['السعودية', 'صندوق الاستثمارات', 'نجوم', 'الدوري'] },
  { id: 'mod_04', category: 'football', text: 'ديربي الرياض', forbiddenWords: ['الهلال', 'النصر', 'المملكة أرينا', 'قمة'] },
  { id: 'mod_05', category: 'football', text: 'ياسين بونو', forbiddenWords: ['الهلال', 'المغرب', 'حارس', 'ابتسامة'] },
  { id: 'mod_06', category: 'football', text: 'إرلينغ هالاند', forbiddenWords: ['مانشستر سيتي', 'النرويج', 'أهداف', 'فايكنج'] },
  { id: 'mod_07', category: 'tv_series', text: 'البيت بيتي', forbiddenWords: ['بينو', 'كراكيري', 'قصر', 'رعب كوميدي'] },
  { id: 'mod_08', category: 'tv_series', text: 'لعبة الحبار (Squid Game)', forbiddenWords: ['كوريا', 'دمية', 'أرقام', 'بدلة خضراء'] },
  { id: 'mod_09', category: 'tv_series', text: 'سترينجر ثينقز', forbiddenWords: ['إيليفن', 'وحش', 'عالم مقلوب', 'ثمانينات'] },
  { id: 'mod_10', category: 'tv_series', text: 'التاج (The Crown)', forbiddenWords: ['ملكة إنجلترا', 'بريطانيا', 'قصر', 'إليزابيث'] },
  { id: 'mod_11', category: 'movies', text: 'أوبنهايمر', forbiddenWords: ['قنبلة نووية', 'فيزياء', 'نولان', 'انفجار'] },
  { id: 'mod_12', category: 'movies', text: 'باربي', forbiddenWords: ['وردي', 'كين', 'عروسة', 'عالم مثالي'] },
  { id: 'mod_13', category: 'movies', text: 'نورة', forbiddenWords: ['فيلم سعودي', 'كان', 'رسم', 'قرية'] },
  { id: 'mod_14', category: 'movies', text: 'توب غان: مافريك', forbiddenWords: ['طيران', 'توم كروز', 'مقاتلة', 'سرعة'] },
  { id: 'mod_15', category: 'tools', text: 'سماعة إيربودز', forbiddenWords: ['أبل', 'بلوتوث', 'أذن', 'شحن'] },
  { id: 'mod_16', category: 'tools', text: 'سكوتر كهربائي', forbiddenWords: ['شحن', 'شارع', 'عجلتين', 'سرعة'] },
  { id: 'mod_17', category: 'tools', text: 'طائرة درون', forbiddenWords: ['تصوير', 'ريموت', 'طيران', 'كاميرا'] },
  { id: 'mod_18', category: 'tools', text: 'نظارة الواقع الافتراضي (VR)', forbiddenWords: ['ميتا', 'عدسات', 'ألعاب', 'عالم افتراضي'] },
  { id: 'mod_19', category: 'tools', text: 'ساعة ذكية', forbiddenWords: ['أبل واتش', 'نبض', 'خطوات', 'شاشة'] },
  { id: 'mod_20', category: 'tools', text: 'ماك بوك برو', forbiddenWords: ['أبل', 'لابتوب', 'تفاحة', 'برمجة'] },
  { id: 'mod_21', category: 'food', text: 'سبانش لاتيه', forbiddenWords: ['حليب مكثف', 'قهوة', 'بارد', 'كافيه'] },
  { id: 'mod_22', category: 'food', text: 'كوكيز كندر', forbiddenWords: ['بسكوت', 'شوكولاتة بيضاء', 'فرن', 'حلى'] },
  { id: 'mod_23', category: 'food', text: 'فرنش توست بالكراميل', forbiddenWords: ['بريوش', 'بيض', 'فطور', 'آيسكريم'] },
  { id: 'mod_24', category: 'food', text: 'شاي كرك', forbiddenWords: ['هيل', 'زعفران', 'حليب بوني', 'حار'] },
  { id: 'mod_25', category: 'food', text: 'ماتشا باردة', forbiddenWords: ['شاي أخضر', 'ياباني', 'حليب لوز', 'مشروب'] },
  { id: 'mod_26', category: 'food', text: 'برجر سماش ترَفِل', forbiddenWords: ['فطر', 'لحم مضغوط', 'خبز بطاطس', 'صوص'] },
  { id: 'mod_27', category: 'food', text: 'شاي بوبا (فقاعات)', forbiddenWords: ['تابيوكا', 'قصبة عريضة', 'تايوان', 'كرات سوداء'] },
  { id: 'mod_28', category: 'countries', text: 'آيسلندا', forbiddenWords: ['شفق قطبي', 'براكين', 'جليد', 'أوروبا'] },
  { id: 'mod_29', category: 'countries', text: 'سنغافورة', forbiddenWords: ['مارينا باي', 'جزيرة', 'نظافة', 'حدائق'] },
  { id: 'mod_30', category: 'countries', text: 'النرويج', forbiddenWords: ['مضايق مائية', 'برد', 'أوسلو', 'شمال'] }
];

export const getPromptsForCategories = (
  categories: EshrahCategory[],
  usedIds: Set<string> = new Set()
): EshrahPromptItem[] => {
  const allowed = ESHRAH_WORDS_BANK.filter(
    (item) => categories.includes(item.category) && !usedIds.has(item.id)
  );
  if (allowed.length === 0) {
    return ESHRAH_WORDS_BANK.filter((item) => categories.includes(item.category));
  }
  return allowed;
};

export const getRandomPrompt = (
  categories: EshrahCategory[],
  usedIds: Set<string> = new Set()
): EshrahPromptItem => {
  const pool = getPromptsForCategories(categories, usedIds);
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex] || ESHRAH_WORDS_BANK[0];
};
