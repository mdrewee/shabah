export interface GameItem {
  id: string;
  title: string;
  description: string;
  route: string;
  icon?: string;
}

export interface CategoryItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  games: GameItem[];
}

export const CATEGORIES_REGISTRY: CategoryItem[] = [
  {
    id: 'ai',
    title: 'ذكاء اصطناعي',
    description: 'تحديات الذكاء الاصطناعي ومحاكمات الـ AI التفاعلية',
    icon: 'Scale',
    color: '#8A9A5B',
    games: [
      {
        id: 'conspiracy-maker',
        title: 'صانع المؤامرة',
        description: 'حدثين عشوائيين مالهم دخل ببعض.. والمطلوب منك تسك خطوط مؤامرة سرية ترتبط بينهم والـ AI يقيّم ملفك السري!',
        route: '/room/:code/ai/conspiracy-maker',
        icon: 'FileText',
      },
      {
        id: 'the-scammer',
        title: 'النصاب',
        description: 'منتج غريب ومطلوب منك تصرفه على زبون AI شكّاك.. أقنعه يرفع السوم وأعلى بياع تنعرض محادثته بالشاشة!',
        route: '/room/:code/ai/the-scammer',
        icon: 'Gavel',
      },
      {
        id: 'ai-lawyer',
        title: 'المحامي الـ AI',
        description: 'قضية تورط الكل ومطلوب منك ترقع لنفسك.. والقاضي يحلل عذرك ويجلد ترقيعك!',
        route: '/room/:code/ai/ai-lawyer',
        icon: 'Scale',
      },
    ],
  },

  {
    id: 'words',
    title: 'كلمات',
    description: 'تحديات لغوية وسرعة بديهة وتنافس مباشر في الكلمات',
    icon: 'BookOpen',
    color: '#8A9A5B',
    games: [
      {
        id: 'three-letter-word',
        title: 'كلمة ثلاثية',
        description: 'بدّل حرف واحد من كروتك ونزله فوق الكروت بالساحة لتكوين كلمة ثلاثية صحيحة.. أول من يخلّص كروته الثمانية يفوز!',
        route: '/room/:code/words/three-letter-word',
        icon: 'Layers',
      },
      {
        id: 'scattergories',
        title: 'اسم جماد نبات',
        description: 'التحدي الكلاسيكي بفئات عصرية واختيار وتحكيم يدوي من المضيف',
        route: '/room/:code/words/scattergories',
        icon: 'Sparkles',
      },
      {
        id: 'wordle-rush',
        title: 'سباق ووردل',
        description: 'سباق تخمين لحظي؛ أول من يفك الكلمة السرية يفوز بالجولة',
        route: '/room/:code/words/wordle-rush',
        icon: 'Layers',
      },
      {
        id: 'pentagon-clash',
        title: 'خلية الخماسيات',
        description: '6 أشكال خماسية؛ كوّن كلماتك واخطفها قبل باقي المتسابقين',
        route: '/room/:code/words/pentagon-clash',
        icon: 'Hexagon',
      },
    ],
  },
  {
    id: 'geography',
    title: 'فئة الجغرافيا',
    description: 'تحديات الألوان والخرائط الدقيقة واستكشاف شبه الجزيرة والعالم',
    icon: 'Globe2',
    color: '#C68B59',
    games: [
      {
        id: 'geo-flag-color',
        title: 'لون العلم',
        description: 'تخمين درجة لون العلم الصحيحة',
        route: '/room/:code/flags-tv',
        icon: 'Palette',
      },
      {
        id: 'geo-pin-landmark',
        title: 'حدد الموقع',
        description: 'تحديد إحداثيات المعالم على الخريطة',
        route: '/room/:code/geo-tv',
        icon: 'MapPin',
      },
      {
        id: 'geo-trajectory',
        title: 'على مسار الخط',
        description: 'توقع الدول الواقعة على امتداد المسار',
        route: '/room/:code/trajectory-tv',
        icon: 'Compass',
      },
      {
        id: 'geo-blind-tourism',
        title: 'سياحة عمياء',
        description: 'تخمين الوجهة من ٥ تلميحات تدريجية',
        route: '/room/:code/tourism-tv',
        icon: 'HelpCircle',
      },
    ],
  },
  {
    id: 'eshrah',
    title: 'اشرح',
    description: 'ألعاب فرق وتحديات تمثيل وتخمين وسرعة بالصالة بدون تعقيد',
    icon: 'MessageSquare',
    color: '#8A9A5B',
    games: [
      {
        id: 'wala-kalima',
        title: 'ولا كلمة',
        description: 'تمثيل صامت ونظام سرقة وتحكيم مباشر من الفريق المنافس',
        route: '/room/:code/eshrah/wala-kalima',
        icon: 'EyeOff',
      },
      {
        id: 'forbidden-words',
        title: 'كلمات محظورة',
        description: 'شرح سريع بدون نطق الكلمات الممنوعة مع تدقيق ورصد فوري من الخصم',
        route: '/room/:code/eshrah/forbidden-words',
        icon: 'AlertTriangle',
      },
      {
        id: 'one-word',
        title: 'كلمة واحدة',
        description: 'مواجهة وجه لوجه بنفس الكلمة؛ كلمة واحدة كتلميح لكل دور',
        route: '/room/:code/eshrah/one-word',
        icon: 'MessageSquare',
      },
      {
        id: 'move-the-puppet',
        title: 'حرّك الدمية',
        description: 'الدمية تقف بالصالة وفريقها يوجه أطرافها صامتاً لتجسيد المشهد',
        route: '/room/:code/eshrah/move-the-puppet',
        icon: 'UserCheck',
      },
    ],
  },
  {
    id: 'football',
    title: 'كرة قدم',
    description: 'تحديات كروية وسرعة بديهة وبينقو النجوم والأندية العالمية',
    icon: 'Trophy',
    color: '#8A9A5B',
    games: [
      {
        id: 'football-bingo',
        title: 'بينقو الكروي',
        description: 'لوحة بينقو 16 مربع بصري.. كل 5 ثوان ينزل لاعب عشوائي على الشاشة، اربطه بالمربع الصح وأول من يقفل خط يصرخ بينقو!',
        route: '/room/:code/football/football-bingo',
        icon: 'Grid',
      },
      {
        id: 'mutual-link',
        title: 'حلقة الوصل',
        description: 'اكتشف الرابط السري المشترك بين عملاقين كرويين.. أول من يكتب الإجابة الصحيحة يخطف النقطة ويفوز بالجولة!',
        route: '/room/:code/football/mutual-link',
        icon: 'Link',
      },
      {
        id: 'draft-5',
        title: 'كوّن فريقك',
        description: 'ابنِ تشكيلتك الخماسية وفق شروط ومراكز تكتيكية، والـ AI يقيّم التشكيلات ويعلن البطل!',
        route: '/room/:code/football/draft-5',
        icon: 'Trophy',
      },
      {
        id: 'football-chain',
        title: 'سِكّة اللاعبين',
        description: 'من لاعب البداية إلى لاعب الهدف.. ابنِ أسرع سلسلة ربط بين اللاعبين عبر زملائهم في الأندية والمنتخبات!',
        route: '/room/:code/football/football-chain',
        icon: 'Share2',
      },
    ],
  },
];

