// src/pages/ai/ai-room/services/styleProfiler.ts

export interface GroupStyleProfile {
  avgWordCount: number;
  laughterStyle: 'none' | 'short' | 'long'; // هه vs هههههه
  usesHamza: boolean;
  brevityLevel: 'short' | 'medium' | 'detailed';
  commonSlangDetected: string[];
  stylePromptInjection: string;
}

const COMMON_SLANG_WORDS = [
  'وش',
  'ليش',
  'عشان',
  'يا رجال',
  'صدق',
  'مدري',
  'شلون',
  'كذا',
  'ترى',
  'حق',
  'حقين',
  'اصلا',
  'والله',
];

export function analyzeGroupStyle(answers: string[]): GroupStyleProfile {
  if (!answers || answers.length === 0) {
    return {
      avgWordCount: 5,
      laughterStyle: 'short',
      usesHamza: false,
      brevityLevel: 'short',
      commonSlangDetected: [],
      stylePromptInjection: 'اكتب بإيجاز شديد وعفوية (3 إلى 6 كلمات) باللهجة السعودية.',
    };
  }

  const validAnswers = answers.filter((a) => typeof a === 'string' && a.trim().length > 0);
  if (validAnswers.length === 0) {
    return {
      avgWordCount: 5,
      laughterStyle: 'short',
      usesHamza: false,
      brevityLevel: 'short',
      commonSlangDetected: [],
      stylePromptInjection: 'اكتب بإيجاز شديد وعفوية (3 إلى 6 كلمات) باللهجة السعودية.',
    };
  }

  const wordCounts = validAnswers.map((a) => a.trim().split(/\s+/).length);
  const totalWords = wordCounts.reduce((acc, curr) => acc + curr, 0);
  const avgWordCount = Math.round(totalWords / validAnswers.length);

  const fullText = validAnswers.join(' ');

  // Analyze laughter
  let laughterStyle: 'none' | 'short' | 'long' = 'none';
  if (/ههههه+/i.test(fullText)) {
    laughterStyle = 'long';
  } else if (/هه+/i.test(fullText)) {
    laughterStyle = 'short';
  }

  // Analyze hamza usage
  const usesHamza = /[أإآ]/.test(fullText);

  // Analyze brevity
  let brevityLevel: 'short' | 'medium' | 'detailed' = 'short';
  if (avgWordCount >= 10) {
    brevityLevel = 'detailed';
  } else if (avgWordCount >= 6) {
    brevityLevel = 'medium';
  }

  // Find matching slang
  const detectedSlang = COMMON_SLANG_WORDS.filter((w) => fullText.includes(w));

  // Build prompt injection instruction
  const guidelines: string[] = [];
  if (brevityLevel === 'short') {
    guidelines.push(`اللاعبون يكتبون إجابات قصيرة جداً (متوسط ${Math.max(2, avgWordCount)} كلمات). اكتب إجابة مقتضبة لا تتعدى ${Math.max(3, avgWordCount + 2)} كلمات.`);
  } else if (brevityLevel === 'medium') {
    guidelines.push(`اللاعبون يكتبون إجابات متوسطة (${avgWordCount} كلمات). لا تطل.`);
  } else {
    guidelines.push(`اللاعبون يكتبون بتفصيل نسبي (${avgWordCount} كلمات تقريباً).`);
  }

  if (laughterStyle === 'long') {
    guidelines.push('اللاعبون يضحكون مطولاً (هههههه). يمكنك الضحك بنفس الطريقة.');
  } else if (laughterStyle === 'short') {
    guidelines.push('اللاعبون يضحكون بخفة (ههه).');
  }

  if (!usesHamza) {
    guidelines.push('لا تدقق في الهمزات (اكتب "اصلا" بدلاً من "أصلاً"، و"انك" بدلاً من "أنك").');
  }

  return {
    avgWordCount,
    laughterStyle,
    usesHamza,
    brevityLevel,
    commonSlangDetected: detectedSlang,
    stylePromptInjection: guidelines.join(' '),
  };
}
