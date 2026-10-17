// src/pages/ai/ai-room/services/postSanitizer.ts

export const sanitizeAndValidateReply = (rawText: string, aiAvatar: string): string => {
  console.log('[AI Raw Model Output]:', rawText);

  let cleaned = (rawText || '')
    .replace(/[.،؛!؟"'`\*]/g, '') // Strip punctuation & markdown
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .trim();

  // 1. Circuit Breaker: ONLY reject explicit robotic admissions
  const strictlyRobotic = [
    /نموذج ذكاء اصطناعي/,
    /ذكاء اصطناعي/,
    /انا روبوت/,
    /نموذج لغوي/,
    /بصفتي ذكاء/
  ];

  for (const pattern of strictlyRobotic) {
    if (pattern.test(cleaned)) {
      console.warn('[Circuit Breaker] Explicit robot giveaway caught:', cleaned);
      cleaned = getRandomFallback(aiAvatar);
      break;
    }
  }

  // 2. Length Breaker: Keep up to 10 words, only truncate if excessively long paragraph
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length > 10) {
    cleaned = words.slice(0, 8).join(' ');
  }

  // 3. Gibberish / Empty Fallback
  if (!cleaned || cleaned.length < 2) {
    cleaned = getRandomFallback(aiAvatar);
  }

  console.log('[AI Sanitized Output]:', cleaned);
  return cleaned;
};

const getRandomFallback = (aiAvatar: string): string => {
  const fallbacks = [
    'ههههههه اسلم بس',
    'ما عندك سالفة والله',
    'روقنا انت وياه',
    'ترا الوضع مريب كلكم',
    'صامل انت الحين؟'
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
};
