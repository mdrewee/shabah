export const SCATTERGORIES_CATEGORIES = [
  { id: 'girl_name', label: 'اسم بنت' },
  { id: 'boy_name', label: 'اسم ولد' },
  { id: 'jamad', label: 'جماد' },
  { id: 'nabat', label: 'نبات' },
  { id: 'hayawan', label: 'حيوان' },
  { id: 'bilad', label: 'بلاد' },
  { id: 'brand', label: 'ماركة' },
  { id: 'app', label: 'تطبيق' },
  { id: 'food', label: 'أكلة' },
  { id: 'job', label: 'وظيفة' },
  { id: 'celebrity', label: 'مشهور' },
  { id: 'game', label: 'لعبة' },
  { id: 'car', label: 'سيارة' },
  { id: 'human_body', label: 'جسم الإنسان' },
  { id: 'player', label: 'لاعب' },
  { id: 'team', label: 'فريق' },
  { id: 'red_color', label: 'لونه أحمر' },
  { id: 'dialect_word', label: 'كلمة من لهجتك' }
] as const;

export type ScattergoryCategoryId = typeof SCATTERGORIES_CATEGORIES[number]['id'];

export const ARABIC_ALPHABET = [
  'أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ',
  'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص',
  'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق',
  'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'
];

/**
 * Normalizes an Arabic string:
 * - strips diacritics / tashkeel
 * - removes leading "ال" if present for letter check
 * - normalizes alef variants (أ إ آ -> ا)
 * - normalizes taa marbuta (ة -> ه)
 * - normalizes yaa (ى -> ي)
 */
export function cleanArabicWord(word: string): string {
  if (!word) return '';
  return word
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

export function stripDefiniteArticle(word: string): string {
  const trimmed = word.trim();
  if (trimmed.startsWith('ال') && trimmed.length > 2) {
    return trimmed.slice(2).trim();
  }
  return trimmed;
}

export function doesWordStartWithLetter(word: string, targetLetter: string): boolean {
  if (!word || !targetLetter) return false;
  const stripped = stripDefiniteArticle(word);
  if (!stripped) return false;

  const firstChar = stripped[0];
  const normChar = cleanArabicWord(firstChar);
  const normTarget = cleanArabicWord(targetLetter === 'هـ' ? 'ه' : targetLetter);

  return normChar === normTarget;
}

export type WordValidationStatus = 'EMPTY' | 'WRONG_LETTER' | 'DUPLICATE' | 'UNIQUE' | 'VETOED';

export interface PlayerCategoryAnswer {
  category: ScattergoryCategoryId;
  word: string;
  status: WordValidationStatus;
  points: number;
  adminApproved: boolean; // false = vetoed (0 pt)
}

export interface PlayerRoundSubmission {
  playerId: string;
  playerName: string;
  submittedAt: number;
  answers: Record<string, string>; // categoryId -> word string
}
