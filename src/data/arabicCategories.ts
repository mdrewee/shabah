/**
 * Arabic Ghost (الشبح العربي) Category & Letter Bank
 * 45 diverse, witty categories and 28 alphabet letters
 */

export const ARABIC_CATEGORIES_POOL: string[] = [
  'اسم ذكر', 'مشهور', 'اسم أنثى', 'حيوان', 'فعل', 'نبات', 'بلاد', 'جماد',
  'أغنية', 'أكلة', 'لون', 'سيارة', 'معلم', 'وظيفة', 'مناسبة', 'لبس',
  'في المستشفى', 'في المطبخ', 'في الحمام', 'في السيارة', 'فاكهة', 'خضار',
  'ممنوع', 'جهاز كهربائي', 'حشرة', 'لاعب', 'فريق', 'في الفضاء', 'في البحر',
  'عملة', 'مرض', 'وسيلة مواصلات', 'عضو في الجسم', 'لهجة', 'شيء حاد',
  'يرفع الضغط', 'شخصية كرتونية', 'قدرة خارقة', 'يطير', 'شيء طري',
  'عذر للتأخير', 'ما تسافر بدونه', 'اسم نبي أو صحابي', 'ريحته حلوة', 'في المدرسة'
];

export const ARABIC_LETTERS: string[] = [
  'أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش',
  'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'
];

/**
 * Normalizes Arabic letters for lenient comparison (e.g. أ, إ, آ -> ا; ة -> ه)
 */
export function normalizeArabicLetter(letter: string): string {
  if (!letter) return '';
  const trimmed = letter.trim();
  if (['أ', 'إ', 'آ', 'ا'].includes(trimmed)) return 'ا';
  if (['ة', 'ه', 'هـ'].includes(trimmed)) return 'ه';
  if (['ى', 'ي'].includes(trimmed)) return 'ي';
  return trimmed;
}

/**
 * يختار حرفاً عشوائياً تماماً دون تكرار للأحرف الملعوبة مسبقاً في الجلسة.
 * إذا تم لعب جميع الأحرف، يعيد التصفير ويبدأ سحب جديد.
 */
export function getNextUniqueLetter(alreadyPlayed: string[] = []): { letter: string; updatedPlayed: string[] } {
  const normPlayed = (alreadyPlayed || []).map((l) => normalizeArabicLetter(l));
  let available = ARABIC_LETTERS.filter(
    (l) => !normPlayed.includes(normalizeArabicLetter(l))
  );

  let basePlayed = alreadyPlayed || [];
  if (available.length === 0) {
    available = [...ARABIC_LETTERS];
    basePlayed = [];
  }

  // اختيار عشوائي بحت
  const randomIndex = Math.floor(Math.random() * available.length);
  const selectedLetter = available[randomIndex];
  const updatedPlayed = [...basePlayed, selectedLetter];

  return { letter: selectedLetter, updatedPlayed };
}

/**
 * يختار فئات عشوائية تماماً دون تكرار للفئات الملعوبة في الجلسة.
 * إذا نقصت الفئات المتبقية عن العدد المطلوب، يعيد التصفير ويبدأ من كامل بنك الفئات.
 */
export function getNextUniqueCategories(
  count = 5,
  alreadyUsedCategories: string[] = []
): { categories: string[]; updatedUsedCategories: string[] } {
  let available = ARABIC_CATEGORIES_POOL.filter(
    (c) => !(alreadyUsedCategories || []).includes(c)
  );

  let baseUsed = alreadyUsedCategories || [];
  if (available.length < count) {
    available = [...ARABIC_CATEGORIES_POOL];
    baseUsed = [];
  }

  // خلط عشوائي حقيقي (Fisher-Yates Shuffle)
  const shuffled = [...available];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = shuffled.slice(0, count);
  const updatedUsedCategories = [...baseUsed, ...selected];

  return { categories: selected, updatedUsedCategories };
}

/**
 * Picks 5 unique random categories from the pool, excluding any specified categories.
 */
export function getRandomCategories(count = 5, excludeCategories: string[] = []): string[] {
  return getNextUniqueCategories(count, excludeCategories).categories;
}

/**
 * Picks a random Arabic letter not used in previous rounds of the same match.
 */
export function getRandomLetter(excludeLetters: string[] = []): string {
  return getNextUniqueLetter(excludeLetters).letter;
}

/**
 * Checks if a word starts with the target letter, handling the 'ال' prefix.
 */
export function wordStartsWithLetter(word: string, targetLetter: string): boolean {
  if (!word || !targetLetter) return false;
  let clean = word.trim();
  // Strip common punctuation or symbols
  clean = clean.replace(/^[^\p{L}\p{N}]+/u, '');

  const normTarget = normalizeArabicLetter(targetLetter);

  // If word starts with 'ال', strip it if necessary
  if (clean.startsWith('ال') && clean.length > 2 && normTarget !== 'ا') {
    const stripped = clean.slice(2).trim();
    if (stripped.length > 0) {
      const firstChar = normalizeArabicLetter(stripped[0]);
      if (firstChar === normTarget) return true;
    }
  }

  const directFirst = normalizeArabicLetter(clean[0]);
  return directFirst === normTarget;
}
