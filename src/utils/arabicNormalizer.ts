/**
 * Robust Arabic Text Normalizer for search queries, country names, and aliases.
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    // Remove all Tashkeel / Diacritics
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize Alef variations (أ, إ, آ -> ا)
    .replace(/[أإآ]/g, 'ا')
    // Normalize Taa Marbuta (ة -> ه)
    .replace(/ة/g, 'ه')
    // Normalize Yaa (ى -> ي)
    .replace(/ى/g, 'ي')
    // Normalize Hamza variants
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    // Remove Tatweel/Kashida (ـ)
    .replace(/ـ/g, '')
    .trim()
    .toLowerCase();
}
