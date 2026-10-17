/**
 * Curated Common Arabic Words Whitelist & Archaic Filter
 * Prunes obsolete/archaic dictionary entries (e.g., 'خنغ') to ensure
 * party game players only form familiar, modern and authentic Arabic words.
 */

// Explicitly banned obsolete / archaic roots and rare dictionary dust
export const ARCHAIC_OBSOLETE_BLACKLIST = new Set([
  'خنغ', 'فدغ', 'بعثط', 'عثلط', 'شنف', 'خنط', 'عنقف', 'خربق', 'عفلق', 'زفرط',
  'قعس', 'عرط', 'زبم', 'قفش', 'جخ', 'شخ', 'فظظ', 'شنتر', 'جعفل', 'قرطم',
  'زغل', 'زعبل', 'خنطل', 'فشخ', 'فرطس', 'بلطس', 'هلقس', 'صلصل', 'خرطش'
]);

/**
 * Filter a candidate word against the archaic blacklist
 */
export function isNotArchaic(word: string): boolean {
  if (!word) return false;
  const clean = word.trim().replace(/[\u064B-\u065F\u0670]/g, '');
  return !ARCHAIC_OBSOLETE_BLACKLIST.has(clean);
}
