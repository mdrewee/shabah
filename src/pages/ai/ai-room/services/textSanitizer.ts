// src/pages/ai/ai-room/services/textSanitizer.ts

export const QUESTION_BLACKLIST = [
  'لابس',
  'ملابس',
  'نظارة',
  'ثوب',
  'يدك',
  'يدك اليمين',
  'احلف',
  'قسم بالله',
  'كاميرا',
  'صوتك',
  'احسب',
  'كود',
  'برمجة',
];

export function validateQuestion(question: string): { isValid: boolean; reason?: string } {
  const trimmed = question.trim();
  if (!trimmed || trimmed.length < 3) {
    return { isValid: false, reason: 'السؤال قصير جداً' };
  }

  const lower = trimmed.toLowerCase();
  for (const word of QUESTION_BLACKLIST) {
    if (lower.includes(word)) {
      return {
        isValid: false,
        reason: `السؤال يحتوي على كلمة غير مسموح بها ضمن فخاخ الواقع ("${word}")`,
      };
    }
  }

  return { isValid: true };
}

// Strip emojis, robot giveaways, and repetitive tell-tale phrases
const REPETITIVE_TELL_PATTERNS = [
  /بالله\s+ه[ذد]ا\s+جواب/gi,
  /وش\s+ه[ذد]ا\s+الجواب/gi,
  /وش\s+هالجواب/gi,
  /ه[ذد]ا\s+جواب\s+بالله/gi,
  /وش\s+ذا\s+السؤال/gi,
  /وش\s+هالسؤال/gi,
  /بالله\s+ذا\s+سؤال/gi,
];

const NATURAL_REPLACEMENTS = [
  'روقنا بس',
  'شكلك متورط وتصرف',
  'واضح انك مسوي بريء',
  'لا تلف وتدور',
  'مضيع انت روقنا',
  'من جدك انت',
  'اركد فديتك لا تدرعم',
];

export function sanitizeAiOutput(text: string): string {
  if (!text) return '';

  let cleaned = text
    // Remove quotation marks
    .replace(/^["'«“]+|["'»”]+$/g, '')
    // Strip emojis
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '')
    // Replace robot giveaways if any slipped through
    .replace(/كنموذج لغوي/g, 'كإنسان')
    .replace(/أنا ذكاء اصطناعي/g, 'أنا إنسان')
    .replace(/كذكاء اصطناعي/g, '')
    // Convert formal Alif with Hamza to simple Alif (natural youth mobile typing)
    .replace(/[أإآ]/g, 'ا')
    // Remove formal punctuation (trailing periods, commas, semicolons)
    .replace(/[،؛.:]+$/g, '')
    .trim();

  // Intercept and replace repetitive tells so AI doesn't give itself away
  for (const pattern of REPETITIVE_TELL_PATTERNS) {
    if (pattern.test(cleaned)) {
      const randomSub = NATURAL_REPLACEMENTS[Math.floor(Math.random() * NATURAL_REPLACEMENTS.length)];
      cleaned = cleaned.replace(pattern, randomSub);
    }
  }

  return cleaned.trim();
}

// Calculate natural human typing latency matching real phone thumb typing
// Formula: Base reading & thumb-typing (1800ms) + 180ms per word + natural variance
export function calculateHumanDelay(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = Math.max(1, words.length);
  const baseMs = 1800 + wordCount * 220;
  const variance = 0.8 + Math.random() * 0.5; // 0.8 to 1.3
  return Math.round(baseMs * variance);
}
