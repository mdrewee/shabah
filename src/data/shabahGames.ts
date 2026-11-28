import { GUIDE_SCORING_LEGEND } from '../services/guideScoring';

export interface ShabahGame {
  id: string;
  title: string;
  badgeText: string;
  shortExplanation: string;
  cardImage: string;
  glowColor: 'purple' | 'green' | 'orange' | 'blue' | 'red' | 'cyan';
  route: string;
  minPlayers: number;
  maxPlayers: number;
  duration: string;
}

export const SHABAH_GAMES: ShabahGame[] = [
  {
    id: 'ai-coach',
    title: 'الشبح المدرب',
    badgeText: 'تحدي التشكيلات',
    shortExplanation: 'ابنِ تشكيلتك من 5 لاعبين بشروط تكتيكية صعبة، والشبح يحلل قوتها ومراكزها كمدرب عصبي بدون مجاملة.',
    cardImage: '/images/games/coach-card-v2.jpg',
    glowColor: 'green',
    minPlayers: 2,
    maxPlayers: 10,
    duration: '١٠–١٥ دقيقة تقريبًا',
    route: '/game/ai-coach'
  },
  {
    id: 'ai-broker',
    title: 'الشبح الشريطي',
    badgeText: 'تثمين وصيدة',
    shortExplanation: 'أنت البائع والشريطي المشتري؛ سوّق سلعتك بعيوبها وأقنعه يرفع عرض الشراء لأعلى سعر!',
    cardImage: '/images/games/broker-card-v2.jpg',
    glowColor: 'orange',
    minPlayers: 2,
    maxPlayers: 10,
    duration: '١٠–١٥ دقيقة تقريبًا',
    route: '/game/ai-broker'
  },
  {
    id: 'ai-arabic',
    title: 'الشبح العربي',
    badgeText: 'حروف وسرعة',
    shortExplanation: 'العب «حرف عشوائي» بالإجابات المكتوبة أو «ضغط الحروف» بالإجابات الشفهية والتحكيم من المضيف.',
    cardImage: '/images/games/arabic-card-v2.jpg',
    glowColor: 'blue',
    minPlayers: 2,
    maxPlayers: 10,
    duration: '١٠–١٥ دقيقة تقريبًا',
    route: '/game/ai-arabic'
  },
  {
    id: 'ai-guide',
    title: 'الشبح المرشد',
    badgeText: 'تحديد المعالم',
    shortExplanation: '١٢٠ وجهة و٦٠٠ تلميح. حدد الموقع بالدبوس. النقاط حسب المسافة: ' + GUIDE_SCORING_LEGEND,
    cardImage: '/images/games/guide-card-v2.jpg',
    glowColor: 'red',
    minPlayers: 2,
    maxPlayers: 10,
    duration: '١٠–١٥ دقيقة تقريبًا',
    route: '/game/ai-guide'
  },
  {
    id: 'ai-flying',
    title: 'الشبح الطائر',
    badgeText: 'أجوبة نادرة',
    shortExplanation: 'جاوب أندر إجابة وخلّ شبحك يطير لأعلى مسافة في السماء! احذر من تكرار إجابتك مع غيرك فتحترق.',
    cardImage: '/images/games/flying-card-v2.jpg',
    glowColor: 'cyan',
    minPlayers: 2,
    maxPlayers: 10,
    duration: '١٠–١٥ دقيقة تقريبًا',
    route: '/game/ai-flying'
  }
];
