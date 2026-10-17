// src/pages/ai/ai-room/services/dialectDetector.ts

export const detectRoomDialect = (recentMessages: string[]): string => {
  const text = recentMessages.join(' ');

  if (/(شنو|شسمه|زين|حجي|صج|شفيك|وايد|اشدعوه)/.test(text)) {
    return 'حساوي / شرقاوي';
  }
  if (/(ايش|فين|دحين|يا واد|ابوي|سيبه|اشبك|ياواد)/.test(text)) {
    return 'حجازي';
  }
  if (/(وش|ليه|اركد|يا رجال|تكفى|مير|تهقى|صامل)/.test(text)) {
    return 'نجدي';
  }
  if (/(مغزل|ذلحين|كنك|علامك|وش قومك)/.test(text)) {
    return 'جنوبي';
  }

  return 'عامية سعودية بيضاء دارجة';
};
