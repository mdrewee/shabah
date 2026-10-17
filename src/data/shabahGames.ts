export interface ShabahGame {
  id: string;
  title: string;
  badgeText: string;       // النص المختصر في الشكل أعلى الكرت
  shortExplanation: string; // الشرح الذي يظهر عند الضغط على زر [شرح]
  placeholderImage: string; // مسار الصورة المبدئية
  route: string;
}

export const SHABAH_GAMES: ShabahGame[] = [
  {
    id: 'ai-judge',
    title: 'الشبح القاضي',
    badgeText: 'ورطات وأعذار',
    shortExplanation: 'شبح يحطك في تهمة أو ورطة محرجة! اكتب أقوى عذر يطلعك منها، والشبح بيحكم بينكم ويقصف جبهة صاحب أضعف عذر ويعلن البريء.',
    placeholderImage: '/images/games/judge-placeholder.svg',
    route: '/game/ai-judge'
  },
  {
    id: 'ai-coach',
    title: 'الشبح المدرب',
    badgeText: 'تحدي التشكيلات',
    shortExplanation: 'ابنِ تشكيلتك التكتيكية من 5 لاعبين حسب الشروط المطلوبة في كل جولة، وشبح المدرب بيحلل قوة فريقك ومراكزك ويختار التشكيلة الأقوى.',
    placeholderImage: '/images/games/coach-placeholder.svg',
    route: '/game/ai-coach'
  },
  {
    id: 'ai-broker',
    title: 'الشبح الشريطي',
    badgeText: 'تثمين وصيدة',
    shortExplanation: 'شبح الشريطي يعرض لك سلع وأرقام وصفقات غريبة، خمن السعر أو الرقم الأقرب للحقيقة قبل ما يكسر الشريطي بضاعتك!',
    placeholderImage: '/images/games/broker-placeholder.svg',
    route: '/game/ai-broker'
  },
  {
    id: 'ai-arabic',
    title: 'الشبح العربي',
    badgeText: 'حروف وسرعة',
    shortExplanation: 'سباق سرعة في 5 فئات بحرف واحد يختاره الشبح! اكتب كلماتك بسرعة والشبح الفصيح يصحح الكلمات فوراً ويكشف الكلمات المؤلفة.',
    placeholderImage: '/images/games/arabic-placeholder.svg',
    route: '/game/ai-arabic'
  },
  {
    id: 'ai-guide',
    title: 'الشبح المرشد السياحي',
    badgeText: 'تلميحات ودول',
    shortExplanation: '5 تلميحات تدريجية عن دولة أو مدينة حول العالم؛ كل ما عرفت الإجابة من تلميح أبكر كل ما كسبت نقاط أعلى!',
    placeholderImage: '/images/games/guide-placeholder.svg',
    route: '/game/ai-guide'
  }
];
