export interface ShabahGame {
  id: string;
  title: string;
  badgeText: string;
  shortExplanation: string;
  placeholderImage: string;
  glowColor: 'purple' | 'green' | 'orange' | 'blue' | 'red';
  route: string;
}

export const SHABAH_GAMES: ShabahGame[] = [
  {
    id: 'ai-judge',
    title: 'الشبح القاضي',
    badgeText: 'ورطات وأعذار',
    shortExplanation: 'شبح يحطك في تهمة أو ورطة محرجة! اكتب أقوى عذر، والشبح بيحكم بينكم ويقصف جبهة صاحب أضعف عذر ويعلن البريء.',
    placeholderImage: '/images/games/judge-placeholder.svg',
    glowColor: 'purple',
    route: '/game/ai-judge'
  },
  {
    id: 'ai-coach',
    title: 'الشبح المدرب',
    badgeText: 'تحدي التشكيلات',
    shortExplanation: 'ابنِ تشكيلتك من 5 لاعبين بشروط تكتيكية صعبة، والشبح يحلل قوتها ومراكزها كمدرب عصبي بدون مجاملة.',
    placeholderImage: '/images/games/coach-placeholder.svg',
    glowColor: 'green',
    route: '/game/ai-coach'
  },
  {
    id: 'ai-broker',
    title: 'الشبح الشريطي',
    badgeText: 'تثمين وصيدة',
    shortExplanation: 'سلعة خردة وفيها عيب قاتل للجميع؛ فاوض الشريطي في شات مباشر وأقنعه يرفع السوم لأعلى سعر!',
    placeholderImage: '/images/games/broker-placeholder.svg',
    glowColor: 'orange',
    route: '/game/ai-broker'
  },
  {
    id: 'ai-arabic',
    title: 'الشبح العربي',
    badgeText: 'حروف وسرعة',
    shortExplanation: 'سباق حروف وفئات عمودية سريعة؛ اكتب إجاباتك والشبح الفصيح يصحح فوراً ويفضح الشطحات مع إمكانية الاعتراض.',
    placeholderImage: '/images/games/arabic-placeholder.svg',
    glowColor: 'blue',
    route: '/game/ai-arabic'
  },
  {
    id: 'ai-guide',
    title: 'الشبح المرشد السياحي',
    badgeText: 'معالم ودول',
    shortExplanation: 'طورين: اكتشف الدولة من 5 تلميحات ذكية، أو حدد موقع المعالم على خريطة دارك مود بالسعودية والعالم.',
    placeholderImage: '/images/games/guide-placeholder.svg',
    glowColor: 'red',
    route: '/game/ai-guide'
  }
];
