import { PlayerAvatar } from '../types/game';
import { ShabahMood } from '../components/mascot/ShabahGhost';
import { SHABAH_GAMES } from '../data/shabahGames';

export interface GameModeInfo {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  roundDurationMinutes: number;
  tag: string;
  category: 'letters' | 'geography' | 'words' | 'ai' | 'eshrah' | 'football';
  icon: string;
  badgeColor: 'olive' | 'ochre' | 'sand';
  categoryLabel?: string;
  shabahMood?: ShabahMood;
  shabahRemark?: string;
  rulesSummary?: string[];
}

export interface GameCategory {
  id: 'letters' | 'geography' | 'words' | 'ai' | 'eshrah' | 'football';
  title: string;
  englishTitle: string;
  description: string;
  tag: string;
  modes: GameModeInfo[];
}

export const AVATAR_PRESETS: PlayerAvatar[] = [
  { id: 'dallah', name: 'الدلة', iconName: 'Coffee', bg: 'bg-zinc-100', fg: 'text-zinc-900' },
  { id: 'finjan', name: 'الفنجال', iconName: 'CupSoda', bg: 'bg-zinc-100', fg: 'text-zinc-900' },
  { id: 'palm', name: 'النخلة', iconName: 'Palmtree', bg: 'bg-zinc-100', fg: 'text-zinc-900' },
  { id: 'sword', name: 'السيف', iconName: 'Sword', bg: 'bg-zinc-100', fg: 'text-zinc-900' },
  { id: 'falcon', name: 'الصقر', iconName: 'Bird', bg: 'bg-zinc-100', fg: 'text-zinc-900' },
  { id: 'misbaha', name: 'السبحة', iconName: 'CircleDot', bg: 'bg-zinc-100', fg: 'text-zinc-900' },
  { id: 'camel', name: 'الهجين', iconName: 'Compass', bg: 'bg-zinc-100', fg: 'text-zinc-900' },
  { id: 'tent', name: 'البيت', iconName: 'Tent', bg: 'bg-zinc-100', fg: 'text-zinc-900' },
];

export const SHABAH_FEATURED_GAMES: GameModeInfo[] = [
  {
    id: 'ai-judge',
    title: SHABAH_GAMES[0].title,
    subtitle: 'ورطات وأعذار',
    description: SHABAH_GAMES[0].shortExplanation,
    minPlayers: 2,
    maxPlayers: 10,
    roundDurationMinutes: 5,
    tag: 'ورطات وأعذار',
    categoryLabel: 'ورطات وأعذار',
    category: 'ai',
    icon: 'Scale',
    badgeColor: 'olive',
    shabahMood: 'judging',
    shabahRemark: 'تتحداني؟',
    rulesSummary: [
      'شبح يحطك في تهمة أو ورطة محرجة! اكتب أقوى عذر يطلعك منها.',
      'الشبح بيحكم بينكم ويقصف جبهة صاحب أضعف عذر ويعلن البريء.',
    ],
  },
  {
    id: 'ai-coach',
    title: SHABAH_GAMES[1].title,
    subtitle: 'تحدي التشكيلات',
    description: SHABAH_GAMES[1].shortExplanation,
    minPlayers: 2,
    maxPlayers: 10,
    roundDurationMinutes: 6,
    tag: 'تحدي التشكيلات',
    categoryLabel: 'تحدي التشكيلات',
    category: 'football',
    icon: 'Shield',
    badgeColor: 'olive',
    shabahMood: 'angry',
    shabahRemark: 'تعال أعلمك اللعب كيف',
    rulesSummary: [
      'ابنِ تشكيلتك التكتيكية من 5 لاعبين حسب الشروط المطلوبة في كل جولة.',
      'شبح المدرب بيحلل قوة فريقك ومراكزك ويختار التشكيلة الأقوى.',
    ],
  },
  {
    id: 'ai-broker',
    title: SHABAH_GAMES[2].title,
    subtitle: 'تثمين وصيدة',
    description: SHABAH_GAMES[2].shortExplanation,
    minPlayers: 2,
    maxPlayers: 10,
    roundDurationMinutes: 5,
    tag: 'تثمين وصيدة',
    categoryLabel: 'تثمين وصيدة',
    category: 'ai',
    icon: 'Gavel',
    badgeColor: 'olive',
    shabahMood: 'happy',
    shabahRemark: 'ورّني شطارتك',
    rulesSummary: [
      'شبح الشريطي يعرض لك سلع وأرقام وصفقات غريبة.',
      'خمن السعر أو الرقم الأقرب للحقيقة قبل ما يكسر الشريطي بضاعتك!',
    ],
  },
  {
    id: 'ai-arabic',
    title: SHABAH_GAMES[3].title,
    subtitle: 'حروف وسرعة',
    description: SHABAH_GAMES[3].shortExplanation,
    minPlayers: 2,
    maxPlayers: 10,
    roundDurationMinutes: 5,
    tag: 'حروف وسرعة',
    categoryLabel: 'حروف وسرعة',
    category: 'words',
    icon: 'Sparkles',
    badgeColor: 'olive',
    shabahMood: 'idle',
    shabahRemark: 'يلا نلعب',
    rulesSummary: [
      'سباق سرعة في 5 فئات بحرف واحد يختاره الشبح!',
      'اكتب كلماتك بسرعة والشبح الفصيح يصحح الكلمات فوراً ويكشف الكلمات المؤلفة.',
    ],
  },
  {
    id: 'ai-guide',
    title: SHABAH_GAMES[4].title,
    subtitle: 'تلميحات ودول',
    description: SHABAH_GAMES[4].shortExplanation,
    minPlayers: 2,
    maxPlayers: 10,
    roundDurationMinutes: 5,
    tag: 'تلميحات ودول',
    categoryLabel: 'تلميحات ودول',
    category: 'geography',
    icon: 'Compass',
    badgeColor: 'olive',
    shabahMood: 'surprised',
    shabahRemark: 'جاهز ولا خايف؟',
    rulesSummary: [
      '5 تلميحات تدريجية عن دولة أو مدينة حول العالم.',
      'كل ما عرفت الإجابة من تلميح أبكر كل ما كسبت نقاط أعلى!',
    ],
  },
];

// Internal ID aliases so existing engines (ai-lawyer, draft-5, the-scammer, scattergories, geo-blind-tourism) resolve metadata cleanly
export const ALL_GAME_MODES: GameModeInfo[] = [
  ...SHABAH_FEATURED_GAMES,
  { ...SHABAH_FEATURED_GAMES[0], id: 'ai-lawyer' },
  { ...SHABAH_FEATURED_GAMES[1], id: 'draft-5' },
  { ...SHABAH_FEATURED_GAMES[2], id: 'the-scammer' },
  { ...SHABAH_FEATURED_GAMES[3], id: 'scattergories' },
  { ...SHABAH_FEATURED_GAMES[4], id: 'geo-blind-tourism' },
];

export const GAME_CATEGORIES: GameCategory[] = [
  {
    id: 'ai',
    title: 'ألعاب شبح',
    englishTitle: 'SHABAH GAMES',
    description: 'الألعاب الخمس الرسمية لمنصة شبح',
    tag: 'شبح',
    modes: SHABAH_FEATURED_GAMES,
  },
];
