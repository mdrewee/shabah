/**
 * Utility functions for Eastern Arabic numerals and pricing in Broker game
 */

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toArabicDigits(val: number | string): string {
  if (val === undefined || val === null) return '٠';
  const str = typeof val === 'number' ? val.toLocaleString('en-US') : val.toString();
  return str
    .replace(/\d/g, (d) => ARABIC_DIGITS[parseInt(d, 10)])
    .replace(/,/g, '،');
}

export function formatPriceArabic(price: number): string {
  const safePrice = Math.max(0, Math.round(price || 0));
  return `${toArabicDigits(safePrice)} ريال`;
}

export function formatIncrementArabic(inc: number): string {
  if (inc <= 0) return '+٠ ريال';
  return `+${toArabicDigits(inc)} ريال`;
}

export function getRankOrdinalArabic(rank: number): string {
  switch (rank) {
    case 1:
      return 'الأول 🥇';
    case 2:
      return 'الثاني 🥈';
    case 3:
      return 'الثالث 🥉';
    case 4:
      return 'الرابع';
    case 5:
      return 'الخامس';
    case 6:
      return 'السادس';
    case 7:
      return 'السابع';
    case 8:
      return 'الثامن';
    case 9:
      return 'التاسع';
    case 10:
      return 'العاشر';
    default:
      return `${toArabicDigits(rank)}`;
  }
}
