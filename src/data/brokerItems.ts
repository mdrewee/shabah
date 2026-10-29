export type ItemCategory =
  | 'سيارات ودبابات'
  | 'إلكترونيات وأجهزة'
  | 'تراثيات ومقتنيات'
  | 'أغراض غريبة'
  | 'tech'
  | 'vehicles'
  | 'antiques'
  | 'real_estate'
  | 'oddities';

export interface BrokerItem {
  id: string;
  name: string;
  category: ItemCategory;
  categoryLabel?: string;
  estimatedValue: number; // السعر التقديري الحقيقي بالسوق
  description: string;
  flaw: string; // العيب أو المشكلة للمفاوضة
  perk: string; // الميزة النادرة
  openingGreeting: string; // أول رسالة افتتاحية للشريطي تناسب السلعة
  openingBaseline: number; // فتحة الباب التقديرية المبدئية
  specs: string[]; // مواصفات سريعة للمعاينة
  incrementTiers: {
    weak: number;     // حجة ضعيفة أو تسليك
    medium: number;   // حجة مقبولة / منطقية
    strong: number;   // حجة مقنعة جداً أو ذكية
    legendary: number;// حجة تضحك وفصلة شريطية
  };
}

function computeIncrementTiers(estimatedValue: number) {
  if (estimatedValue >= 20000) {
    return {
      weak: 0,
      medium: Math.round(estimatedValue * 0.015),
      strong: Math.round(estimatedValue * 0.035),
      legendary: Math.round(estimatedValue * 0.08),
    };
  } else if (estimatedValue >= 1000) {
    return {
      weak: 0,
      medium: Math.max(30, Math.round(estimatedValue * 0.03)),
      strong: Math.max(70, Math.round(estimatedValue * 0.07)),
      legendary: Math.max(160, Math.round(estimatedValue * 0.15)),
    };
  } else {
    return {
      weak: 0,
      medium: Math.max(15, Math.round(estimatedValue * 0.06)),
      strong: Math.max(35, Math.round(estimatedValue * 0.14)),
      legendary: Math.max(80, Math.round(estimatedValue * 0.28)),
    };
  }
}

interface RawBrokerItemInput {
  id: string;
  name: string;
  category: 'سيارات ودبابات' | 'إلكترونيات وأجهزة' | 'تراثيات ومقتنيات' | 'أغراض غريبة';
  estimatedValue: number;
  description: string;
  flaw: string;
  perk: string;
  openingGreeting: string;
  specs?: string[];
}

const RAW_ITEMS_POOL: RawBrokerItemInput[] = [
  // ١. سيارات ومحركات
  {
    id: 'item_01',
    name: 'كامري ٢٠٠٢ قراندي بيضاء استخدام شايب',
    category: 'سيارات ودبابات',
    estimatedValue: 28000,
    description: 'كامري 2002 مسجلة باسم شايب متقاعد، العداد واقف على 180 ألف، فرش الوكالة عليه نايلون وباقي ريحة التوكيلات فيها.',
    flaw: 'مكيفها يقلب حار بالظهر، والباب الخلفي ما ينفتح إلا من برا بالمفتاح.',
    perk: 'مكينة وقير بلد ما انفكت وصوتها أنعم من الساعة.',
    openingGreeting: 'أرحبووو يا شبيحة الحراج! اليوم الموتر ملك الخط، كامري 2002 قراندي بيضاء قطبة شيبان.. عطونا فتحة باب تبيض الوجه ولا تبخسونها!',
    specs: ['ممشى 180 ألف حقيقي', 'فرش وكالة بنايلون', 'قير ومكينة بلد شرط'],
  },
  {
    id: 'item_02',
    name: 'ددسن دبل ٩٨ غمارتين صبغة فرن',
    category: 'سيارات ودبابات',
    estimatedValue: 22000,
    description: 'نيسان ددسن 98 خط أحمر، عليها شد بري وتانكي موية وتواير بوالين جديدة.',
    flaw: 'الدبل الثقيل يعلق بعض الأحيان ولازم تنزل تحتها بمطرقة ترجعه.',
    perk: 'عزمها جبار وما تصرف بنزين ومرهم لها مساعدات شاص.',
    openingGreeting: 'سمّوا بالرحمن يا ربع البر! ددسن 98 جاهزة للمقناص والطعوس.. ورونا سوماتكم اللي تفتح النفس ولا حد يقول لي بـ 500!',
    specs: ['شد بري جاهز', 'تانكي موية استيل', 'بوالين جديدة'],
  },
  {
    id: 'item_03',
    name: 'بانشي ٣٥٠ تيربو معدل هيدرز وصوت طرب',
    category: 'سيارات ودبابات',
    estimatedValue: 15000,
    description: 'دباب ياماها بانشي 350 أصفر، هيدرز T5 وجنزير سباق ولحية تبريد.',
    flaw: 'ما يشتغل هندل إلا بعد ٢٠ سحبة، ويشرب علبة زيت خلط بكل مشوار.',
    perk: 'يطير طيران بالنفود وعليه لوحة واستمارة رسمية نادرة.',
    openingGreeting: 'يا حيّ الله حقين الطعوس والتهور! بانشي 350 يطرب مسامعك طرب.. عطونا فتحة باب دسمة ولا تجلسون تتفرجون!',
    specs: ['هيدرز T5 أصلي', 'جنزير سباق', 'لوحة واستمارة رسمية'],
  },
  {
    id: 'item_04',
    name: 'فكتوريا ٢٠١١ بوليسي بطاقة جمركية',
    category: 'سيارات ودبابات',
    estimatedValue: 35000,
    description: 'فورد كراون فكتوريا 2011 أمن طرق سابق، دعامية أمامية وجنوط سود وشكمانين مفصولة.',
    flaw: 'المرتبة الخلفية جلد بلد قاسي كأنها صبة، والداش كام محيوس بالأسلاك.',
    perk: 'مكينة هيفي ديوتي ومبردات إضافية وممشى حقيقي.',
    openingGreeting: 'وحش الخطوط السريعة وصل! فكتوريا 2011 بوليسي، هيبة ورزة بالشارع.. فتحة باب يا الذيابة وترا ما نبيع ببلاش!',
    specs: ['دعامية بوليسية وكالة', 'مبردات قير هيفي ديوتي', 'شكمانين مفصولة طرب'],
  },
  {
    id: 'item_05',
    name: 'شاص ٢٠١٥ ونش ودفلك بريمي',
    category: 'سيارات ودبابات',
    estimatedValue: 85000,
    description: 'شاص تويوتا 2015 بيج رفرف، ونش ودفلك وثلاجة، بدي وكالة ما عدا طرف الرفرف.',
    flaw: 'فيه صوت طقطقة خفيف بالفحمة إذا ضغطت كلتش، والمسجل يبلع الأشرطة.',
    perk: 'المحركات شرط الفحص وأوراق الفحص الدوري جديدة أمس صادرة.',
    openingGreeting: 'صلوا على النبي.. جيب شاص بريمي فل كامل، سلاح بالنفود.. عطونا سومة رجال صاملين ولا حد يبخس حلال الناس!',
    specs: ['ونش ودفلك وثلاجة', 'بدي وكالة نظيف', 'فحص دوري جديد'],
  },

  // ٢. إلكترونيات وأجهزة
  {
    id: 'item_06',
    name: 'سوني ٢ الفضي العريض مهكر مع هاردسك ألعاب',
    category: 'إلكترونيات وأجهزة',
    estimatedValue: 450,
    description: 'PlayStation 2 Fat سيلفر ياباني، مركب له قطعة شبكة وهاردسك 500 قيقا مليان ألعاب زمن الطيبين وميدنايت كلوب وبيبسي مان.',
    flaw: 'درج السيدي معلق ما يطلع إلا إذا ضربته بيدك من فوق، ويده الثانية زر X فيها رخو.',
    perk: 'يشغل الألعاب من الهاردسك بلمح البصر بدون ما يحتاج عدسة ليزر.',
    openingGreeting: 'نوادر الألعاب وذكريات الطفولة! سوني 2 فات فضي مهكر وجاهز.. عطونا فتحة باب تسوى ترا الهاردسك لحاله كنز!',
    specs: ['هاردسك 500GB محمل', 'يدين تحكم', 'ألعاب زمن الطيبين جاهزة'],
  },
  {
    id: 'item_07',
    name: 'آيفون ٦ بلس ذهبي مقفل على شبكة أمريكية',
    category: 'إلكترونيات وأجهزة',
    estimatedValue: 200,
    description: 'iPhone 6 Plus ذهبي 64GB، شاشته وكالة بدون ولا خدش، البطارية 89%.',
    flaw: 'مقفل iCloud أو شريحة أمريكية، البصمة ما تشتغل، والكاميرا ترجف.',
    perk: 'شكله الخارجي كأنه طالع من الكرتون ينفع قطع غيار أو كاميرا مراقبة.',
    openingGreeting: 'التحفة الكلاسيكية من أبل.. آيفون 6 بلس قطبة نظيف للمهندسين وحقين القطع، وروني سوماتكم الذكية!',
    specs: ['شاشة بلد أصلية', 'بدي بدون ولا خدش', 'بطارية 89%'],
  },
  {
    id: 'item_08',
    name: 'تلفزيون سوني برافيا ٥٥ بوصة فيه خط أخضر',
    category: 'إلكترونيات وأجهزة',
    estimatedValue: 500,
    description: 'شاشة Sony Bravia 4K ذكية، صوت جبار وتدعم نتفلكس واليوتيوب.',
    flaw: 'فيه خط عمودي أخضر نحيف بالطرف الأيمن وسماعة اليسار تطلع وشوشة.',
    perk: 'الألوان والسطوع سينمائي ومعه قاعدته والريموت الأصلي.',
    openingGreeting: 'شاشة سهرة واستراحات! برافيا 55 بوصة، راعيها يبي يفتك منها عشان الخط.. عطونا سومة شريطية زقرت!',
    specs: ['دقة 4K سمارت', 'قاعدة أصلية', 'ريموت وكالة'],
  },
  {
    id: 'item_09',
    name: 'كمبيوتر قيمنق كرت شاشة RTX 3070 وتبريد مائي',
    category: 'إلكترونيات وأجهزة',
    estimatedValue: 3200,
    description: 'بي سي قيمنق كيس أبيض RGB، كرت 3070، معالج i7، يشغل كل الألعاب 2K.',
    flaw: 'المروحة الأمامية تطلع صوت صفير كأنها طيارة تقلع، وكيبل الباور مهتري.',
    perk: 'معه كراتين كل القطع والفواتير والحرارة ما تتعدى 65 درجة.',
    openingGreeting: 'حقين الفريمات والشوتر! تجميعة قيمنق ثقيلة تبرد التسبد.. وروني مين بيفتح الباب بسومة عاقلة!',
    specs: ['RTX 3070 8GB', 'تبريد مائي RGB', 'كراتين وفواتير كاملة'],
  },
  {
    id: 'item_10',
    name: 'كاميرا كانون 5D Mark III مع عدسة 50mm',
    category: 'إلكترونيات وأجهزة',
    estimatedValue: 2400,
    description: 'كاميرا تصوير احترافي فل فريم، شترها قليل، استخدام داخل استديو فقط.',
    flaw: 'غطا مدخل الميموري مكسور ولاصق بسكوتش، والبطارية تجلس ساعة فقط.',
    perk: 'حساس نظيف جداً بدون أي بقع أو غبار والعدسة ممتازة للعزل.',
    openingGreeting: 'أهل التصوير والإنتاج! كانون مارك 3 أسطورة الكاميرات.. عطونا سومة عدلة ولا حد يكسر قيمتها بالتراب!',
    specs: ['مستشعر فل فريم نقي', 'عدسة 50mm F1.8', 'شتر استديو منخفض'],
  },

  // ٣. تراثيات ومقتنيات
  {
    id: 'item_11',
    name: 'دلة رسلان نحاس أصلية ختم قديم',
    category: 'تراثيات ومقتنيات',
    estimatedValue: 1200,
    description: 'دلة قهوة سورية رسلان أصلية دقة يد ونحاس ثقيل يوزن 2 كيلو.',
    flaw: 'تحتاج جلي وتبييض من الداخل لأن فيها صدى قديم وغطاها يركب بمايل.',
    perk: 'الختم العثماني القديم واضح عليها وتعتبر قطعة متحفية.',
    openingGreeting: 'أهل الكيف والنوادر التراثية! دلة رسلان أصيلة ريحة الهيل تفوح منها.. عطونا فتحة باب تليق بأهل المجلس!',
    specs: ['ختم عثماني محفور', 'نحاس ثقيل 2 كجم', 'دقة يد أثرية'],
  },
  {
    id: 'item_12',
    name: 'ساعة سيتيزن أوتوماتيك كلاسيك السبعينات',
    category: 'تراثيات ومقتنيات',
    estimatedValue: 350,
    description: 'ساعة يد Citizen حركة أوتوماتيكية، ميناء أخضر زيتي مميز مع تاريخ اليوم.',
    flaw: 'الزجاجة فيها شخط خفيف وسيرها يبيله تضييق حبتين.',
    perk: 'مكينتها شغالة تدور بالهز وتضبط الوقت بالثانية بدون بطارية.',
    openingGreeting: 'يا حيّ الله حقين الفخامة القديمة! سيتيزن السبعينات خضراء كلاسيك.. وروني السومات الطيبة!',
    specs: ['حركة أوتوماتيك بالهز', 'ميناء أخضر زيتي', 'صناعة يابانية أصلية'],
  },
  {
    id: 'item_13',
    name: 'راديو ناشيونال باناوسنيك ياباني خشب',
    category: 'تراثيات ومقتنيات',
    estimatedValue: 400,
    description: 'راديو National ياباني ملبس خشب جوز، يستقبل موجات AM/FM/SW بصوت دافئ.',
    flaw: 'الأنتل الخارجي مكسور نصه، وزر الترددات يبغاله بخاخ صدأ عشان يتحرك بسلاسة.',
    perk: 'يشتغل على الكهرب والبطاريات الكبيرة ونادر تلقى مثله نظيف.',
    openingGreeting: 'صوت لندن وإذاعة القرآن بزمن الطيبين! راديو ناشيونال ياباني مخشب.. عطونا فتحة باب تسوى هالتحفة!',
    specs: ['خشب جوز طبيعي', 'موجات قصيرة وطويلة', 'صوت دافئ كلاسيكي'],
  },
  {
    id: 'item_14',
    name: 'خنجر جنوبي قديم بقرن وراغ وفضة',
    category: 'تراثيات ومقتنيات',
    estimatedValue: 3000,
    description: 'جنبية/خنجر قديم بصياغة فضة ثقيلة ومقبض قرن طبيعي وسلة فولاذ حادة.',
    flaw: 'الحزام الجلدي مهترئ من الخلف وفيه فص عقيق واحد مفقود بالطرف.',
    perk: 'النصلة هندية قديمة تصد الحديد ومحفوظة بدهن حار.',
    openingGreeting: 'نوادر أهل الجنوب ورزة العرضة! خنجر كفو وفضة أصيلة.. وروني السومات اللي تجمد على الشارب!',
    specs: ['صياغة فضة ثقيلة', 'مقبض قرن وراغ طبيعي', 'سلة فولاذ جوهر'],
  },
  {
    id: 'item_15',
    name: 'بشت حساوي صوف وارد البغلي غاط خفيف',
    category: 'تراثيات ومقتنيات',
    estimatedValue: 2800,
    description: 'بشت حساوي لون بيج سكري، خياطة زري ألماني مذهب يدوي مقاس 30.',
    flaw: 'فيه رقعة ميكروسكوبية عند الكم الأيسر ما تبان إلا بالمجهر.',
    perk: 'قماش ياباني غاط خفيف هفهوف وطايح على الكتف.',
    openingGreeting: 'رزة المعاريس وهيبة المشايخ! بشت حساوي شغل نظيف وزري ملكي.. عطونا فتحة باب زينة!',
    specs: ['زري ألماني مذهب يدوي', 'قماش ياباني غاط خفيف', 'مقاس 30 ملكي'],
  },

  // ٤. أغراض غريبة ولقطات حراج
  {
    id: 'item_16',
    name: 'مكينة قهوة احترافية خربان بلف التبخير',
    category: 'أغراض غريبة',
    estimatedValue: 1800,
    description: 'مكينة إسبريسو إيطالية دبل بويلر ستانلس ستيل، استخلاص 9 بار ثابت.',
    flaw: 'عصا التبخير تطلع موية بدال بخار لأن البلف مسدود بأملاح.',
    perk: 'قروب هيد E61 أصلي، ومضختها صامتة وشغالة 100%.',
    openingGreeting: 'حقين الكورتادو والسبانش لاتيه! مكينة إيطالية للمقاهي قطبة ستيل.. ورونا مين الشريطي الفاهم بيسومها!',
    specs: ['قروب هيد E61 إيطالي', 'دبل بويلر ستانلس', 'استخلاص 9 بار ثابت'],
  },
  {
    id: 'item_17',
    name: 'ماطور كهرباء كوماتسو ياباني ديزل صامت',
    category: 'أغراض غريبة',
    estimatedValue: 4500,
    description: 'مولد كهرباء 7.5 كيلو واط ديزل، يشغل مخيم كامل بمكيفين وثلاجة.',
    flaw: 'ثقيل جداً يوزن 140 كيلو ويحتاج 3 أشخاص عشان يشيلونه، والسلف مفصول سلكه.',
    perk: 'ما يصرف ديزل وتانكيه يكفي 18 ساعة متواصلة وصوته ناعم.',
    openingGreeting: 'عزبة الشتاء والمخيمات! ماطور ياباني يشيل ديرة لحاله.. عطونا فتحة باب تسوى ولا تبخسون المعدات!',
    specs: ['قدرة 7.5KW ديزل', 'تانكي يكفي 18 ساعة', 'كوماتسو ياباني أصلي'],
  },
  {
    id: 'item_18',
    name: 'لوحة محل شاورما نيون قديمة حروف بارزة',
    category: 'أغراض غريبة',
    estimatedValue: 350,
    description: 'لوحة نيون معدنية كلاسيكية مكتوب فيها (شاورما المعلم) بطول مترين وإضاءة أحمر وأصفر.',
    flaw: 'حرف الميم يرمش كل ثانيتين والمحول حار يلسع.',
    perk: 'تنفع ديكور فخم لغرفة قيمنق أو مقهى ريترو مطلوب بالسوق.',
    openingGreeting: 'لقطة ديكور وأنتيك شوارع! لوحة نيون شاورما شغالة وطرب بصري.. وروني سوماتكم يا حقين التحف!',
    specs: ['طول مترين كاملة', 'إضاءة نيون كلاسيك', 'تصميم ريترو نادر'],
  },
  {
    id: 'item_19',
    name: 'طقم كفرات بالون ماكسس مقاس ٩٠٠ مع جنوط مرسيدس',
    category: 'أغراض غريبة',
    estimatedValue: 1900,
    description: '٤ كفرات بوالين Maxxis نقشة 80% مع جنوط دايتون مرسيدس سوداء مخرطة للباترول.',
    flaw: 'كفر واحد فيه رقعة تيوبلس بالجنب يرج خفيف على سرعة 100.',
    perk: 'التاريخ جديد إنتاج نهاية السنة الماضية وما شافت الشمس واجد.',
    openingGreeting: 'تجهيزات الشتاء والمراقي! طقم بوالين رزة وهيبة للمواتر.. عطونا فتحة باب جامدة!',
    specs: ['نقشة 80% باقية', 'جنوط دايتون مخرطة', 'تاريخ حديث مخزن'],
  },
  {
    id: 'item_20',
    name: 'سكوتر ذكي درفت كهربائي بطارية ٣٦ فولت',
    category: 'أغراض غريبة',
    estimatedValue: 380,
    description: 'سكوتر درفت 36V مع إضاءات LED بالجنوط وبلوتوث ومفتاحين تشغيل.',
    flaw: 'الكفر الخلفي ممسوح صاير ناعم جداً والشاحن مو أصلي.',
    perk: 'الدرفت فيه مجنون وسريع ويتحمل وزن لين 80 كيلو.',
    openingGreeting: 'لعب وتفحيط الحارة! سكوتر درفت سريع ويطرب.. وروني مين يفتح بابه بسومة زينة حق العيال!',
    specs: ['بطارية 36V قوية', 'إضاءات LED وبلوتوث', 'تحمل حتى 80 كجم'],
  },
  {
    id: 'item_21',
    name: 'غسالة ملابس كورية حوضين تنشيف صاروخي',
    category: 'أغراض غريبة',
    estimatedValue: 400,
    description: 'غسالة حوضين 12 كيلو، حوض غسيل قوي وحوض تنشيف يدور 1400 دورة.',
    flaw: 'حوض التنشيف يرقص ويزحف بالحمام إذا ما وزنت الملابس زين.',
    perk: 'تنظف البقع المستحيلة وتكد معك 20 سنة بدون صيانة.',
    openingGreeting: 'أجهزة الاستراحة والبيت! غسالة حوضين تكرف كرف الحمير.. عطونا فتحة باب صاملة!',
    specs: ['سعة 12 كجم', 'تنشيف 1400 دورة', 'موتور كوري جبار'],
  },
  {
    id: 'item_22',
    name: 'مكيف سبليت ماندو بلس طنين ونصف بارد ثلج',
    category: 'أغراض غريبة',
    estimatedValue: 900,
    description: 'مكيف سبليت Mando Plus كمبروسر كبير ياباني أصلي، يقلب الصالة فريزر.',
    flaw: 'الريش الأوتوماتيك مكسورة ومثبتة بعود أسنَان عشان توجه لتحت.',
    perk: 'تبريده جبار ومغسول ومفرغ من الفريون القديم ومعه نحاس ٤ متر.',
    openingGreeting: 'موسم الصيف جاي والحر ما يرحم! ماندو طنين ونص يجمّد الركب.. وروني سوماتكم ولا تبخسون المكيف!',
    specs: ['قدرة طنين ونصف', 'كمبروسر كبير ياباني', 'معه نحاس 4 متر'],
  },
  {
    id: 'item_23',
    name: 'كرسي مساج جلدي فاخر فيه تدفئة وZero Gravity',
    category: 'أغراض غريبة',
    estimatedValue: 2200,
    description: 'كرسي تدليك كامل للجسم بالهواء والرولات مع ميزة انعدام الجاذبية ومدخل شاحن.',
    flaw: 'الجلد مقشر عند مسند الرأس، وبلوتوث السماعات الداخلية ما يشبك مع الآيفون.',
    perk: 'المساج الميكانيكي والرولات والحرارة شغالة 100% كأنك داخل سبا.',
    openingGreeting: 'كرسي الملوك والراحة بعد الدوام! تدليك وانعدام جاذبية قطبة فخمة.. عطونا فتحة باب تستاهل التعب!',
    specs: ['ميزة انعدام الجاذبية', 'رولات حرارية كاملة', 'مساج هوائي للأطراف'],
  },
  {
    id: 'item_24',
    name: 'طقم طاولات بلوت أرضية خشب زان مع لباد ملكي',
    category: 'أغراض غريبة',
    estimatedValue: 600,
    description: 'طاولة بلوت سداسية أرضية، خشب زان أصلي، ملبسة لباد كازينو أخضر فاخر مع حوامل أكواب كاسات الشاي.',
    flaw: 'طرف اللباد فيه حلقة فنجان قهوة قديمة ما راحت بالغسيل.',
    perk: 'ثقيلة وثابتة وصوت نزلة الورقة عليها يطرب الشارع.',
    openingGreeting: 'حيا الله حقين الصن والحكم! طاولة بلوت ملوكية للجلسات الطيبة.. ورونا سوماتكم يا هل الصكات!',
    specs: ['خشب زان أصلي', 'لباد كازينو أخضر فاخر', 'حوامل أكواب مدمجة'],
  },
  {
    id: 'item_25',
    name: 'درابيل سايز ألماني أصلي 7x50 عدسات باردة',
    category: 'تراثيات ومقتنيات',
    estimatedValue: 1400,
    description: 'دربيل Carl Zeiss ألماني عسكري قديم، عدسات زرقاء نقية، يقرأ البعيد بوضوح خيالي.',
    flaw: 'حزام الجلد منقطع ومربوط بسلك شاحن، وفيه غبرة خفيفة بالعدسة اليمين.',
    perk: 'صفاوة وعزل ووضوح حتى مع انكسار شمس العصر.',
    openingGreeting: 'شوف العين وعين الصقر! دربيل ألماني أصلي يجيب لك الطير من أقصى الأفق.. عطونا سومة خبير فاهم بالنوادر!',
    specs: ['تقريب 7x50 عسكري', 'عدسات زرقاء باردة', 'Carl Zeiss ألماني أصلي'],
  },
];

/**
 * البنك الموسع المعالج للسلع مع كافة الطبقات السعرية والمواصفات
 */
export const BROKER_ITEMS: BrokerItem[] = RAW_ITEMS_POOL.map((item) => ({
  id: item.id,
  name: item.name,
  category: item.category,
  categoryLabel: item.category,
  estimatedValue: item.estimatedValue,
  description: item.description,
  flaw: item.flaw,
  perk: item.perk,
  openingGreeting: item.openingGreeting,
  openingBaseline: Math.max(10, Math.round(item.estimatedValue * 0.1)),
  specs: item.specs && item.specs.length > 0 ? item.specs : [item.perk, item.description],
  incrementTiers: computeIncrementTiers(item.estimatedValue),
}));

export const BROKER_ITEMS_POOL = BROKER_ITEMS;

/**
 * يختار سلعة عشوائية غير مكررة طوال الجلسة
 */
export function getNextUniqueBrokerItem(alreadyUsedIds: string[] = []): {
  item: BrokerItem;
  updatedUsedIds: string[];
} {
  let available = BROKER_ITEMS.filter((it) => !(alreadyUsedIds || []).includes(it.id));
  let baseUsed = alreadyUsedIds || [];

  if (available.length === 0) {
    available = [...BROKER_ITEMS];
    baseUsed = [];
  }

  const randomIndex = Math.floor(Math.random() * available.length);
  const selected = available[randomIndex];
  const updatedUsedIds = [...baseUsed, selected.id];

  return { item: selected, updatedUsedIds };
}

/**
 * استرجاع سلعة حسب رقم الجولة مع دعم التدوير وعدم التكرار
 */
export function getBrokerItemByIndex(roundNumber: number, alreadyUsedIds: string[] = []): BrokerItem {
  if (alreadyUsedIds.length > 0) {
    return getNextUniqueBrokerItem(alreadyUsedIds).item;
  }
  const index = Math.max(0, (roundNumber - 1) % BROKER_ITEMS.length);
  return BROKER_ITEMS[index];
}

/**
 * دالة حماية وضمان صحة السلعة المعروضة (تمنع التعليق وتصحح السلع المتداخلة أو الفارغة)
 */
export function ensureBrokerItem(candidate: any, fallbackRound = 1): BrokerItem {
  if (!candidate) {
    return getBrokerItemByIndex(fallbackRound);
  }
  // في حال كانت السلعة مغلفة بداخل كائن { item: BrokerItem }
  if (candidate.item && typeof candidate.item === 'object' && candidate.item.name) {
    return ensureBrokerItem(candidate.item, fallbackRound);
  }
  // إذا كانت السلعة تحوي الاسم والـ id
  if (candidate.id && candidate.name) {
    return {
      id: candidate.id,
      name: candidate.name,
      category: candidate.category || 'أغراض غريبة',
      categoryLabel: candidate.categoryLabel || candidate.category || 'أغراض غريبة',
      estimatedValue: candidate.estimatedValue || 1000,
      description: candidate.description || '',
      flaw: candidate.flaw || 'بدون عيب ظاهر',
      perk: candidate.perk || '',
      openingGreeting: candidate.openingGreeting || `حياكم الله في حراج الشبح! السلعة المعروضة هي ${candidate.name}، عطونا فتحة باب تسوى!`,
      openingBaseline: candidate.openingBaseline || Math.max(10, Math.round((candidate.estimatedValue || 1000) * 0.1)),
      specs: candidate.specs && candidate.specs.length > 0 ? candidate.specs : [candidate.perk || '', candidate.description || ''].filter(Boolean),
      incrementTiers: candidate.incrementTiers || computeIncrementTiers(candidate.estimatedValue || 1000),
    };
  }
  return getBrokerItemByIndex(fallbackRound);
}
