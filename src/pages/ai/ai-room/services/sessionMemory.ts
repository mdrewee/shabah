// src/pages/ai/ai-room/services/sessionMemory.ts

export interface SessionMemory {
  cumulativeSlang: Set<string>;        // Real slang/dialect words harvested from human players
  laughStyles: Set<string>;            // How the group laughs (e.g., 'هههههه', 'خخخخ', 'ههه')
  referencedTopics: string[];          // Memorable quotes/words from previous questions & answers
  humanMessageAvgLength: number;       // Group typing habit (short bursts vs medium phrases)
  previousAiArchetypes: string[];      // To prevent picking the same personality twice
}

export const createInitialSessionMemory = (): SessionMemory => ({
  cumulativeSlang: new Set<string>(),
  laughStyles: new Set<string>(),
  referencedTopics: [],
  humanMessageAvgLength: 4,
  previousAiArchetypes: []
});

export const initialSessionMemory: SessionMemory = createInitialSessionMemory();

// Extracts new vocabulary and habits from human messages at the end of each phase/round
export const harvestHumanHabits = (
  messages: string[],
  answers: string[],
  currentMemory: SessionMemory
): SessionMemory => {
  const updated: SessionMemory = {
    cumulativeSlang: new Set(currentMemory.cumulativeSlang),
    laughStyles: new Set(currentMemory.laughStyles),
    referencedTopics: [...currentMemory.referencedTopics],
    humanMessageAvgLength: currentMemory.humanMessageAvgLength,
    previousAiArchetypes: [...currentMemory.previousAiArchetypes]
  };

  const allTexts = [...messages, ...answers];
  let totalWordCount = 0;
  let sampleCount = 0;

  allTexts.forEach((text) => {
    if (!text || typeof text !== 'string') return;

    // 1. Harvest laugh style
    const laughMatch = text.match(/([هخ]{3,})/g);
    if (laughMatch) {
      laughMatch.forEach((l) => updated.laughStyles.add(l));
    }

    // 2. Harvest slang keywords (words between 3-8 chars that are common dialect)
    const words = text.split(/\s+/);
    if (words.length > 0) {
      totalWordCount += words.length;
      sampleCount++;
    }

    words.forEach((w) => {
      const clean = w.replace(/[.،؛!؟"']/g, '').trim();
      const stopWords = ['على', 'في', 'من', 'الى', 'عن', 'هو', 'هي', 'هم', 'نحن', 'أنا', 'انا', 'كان', 'هذا', 'هذه', 'مع'];
      if (clean.length >= 3 && clean.length <= 12 && !stopWords.includes(clean)) {
        updated.cumulativeSlang.add(clean);
      }
    });

    // 3. Keep memorable short statements from answers for cross-round callbacks
    if (text.length > 5 && text.length < 40) {
      if (updated.referencedTopics.length < 12 && !updated.referencedTopics.includes(text.trim())) {
        updated.referencedTopics.push(text.trim());
      }
    }
  });

  if (sampleCount > 0) {
    updated.humanMessageAvgLength = Math.round(totalWordCount / sampleCount) || 4;
  }

  return updated;
};
