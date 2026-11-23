const KEY = 'shabah_flying_seen_questions_v1';
const memory = new Set<string>();
let checkedPreviousGames = false;

export function getSeenFlyingQuestions(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (Array.isArray(saved)) saved.filter((id): id is string => typeof id === 'string').forEach((id) => memory.add(id));
  } catch { /* Storage may be unavailable in private browsing. */ }
  if (!checkedPreviousGames) {
    checkedPreviousGames = true;
    try {
      if (localStorage.getItem(KEY) !== null) return [...memory];
      for (let index = 0; index < sessionStorage.length; index++) {
        const key = sessionStorage.key(index);
        if (!key?.startsWith('shabah_flying_state_')) continue;
        const state = JSON.parse(sessionStorage.getItem(key) || '{}');
        if (Array.isArray(state.usedQuestionIds)) state.usedQuestionIds.filter((id: unknown): id is string => typeof id === 'string').forEach((id: string) => memory.add(id));
      }
    } catch { /* Older sessions may have incomplete cached state. */ }
  }
  return [...memory];
}

export function rememberFlyingQuestion(id: string) {
  getSeenFlyingQuestions();
  memory.add(id);
  try { localStorage.setItem(KEY, JSON.stringify([...memory])); } catch { /* Retain session memory. */ }
}

export function restartFlyingQuestionCycle() {
  memory.clear();
  checkedPreviousGames = true;
  try { localStorage.setItem(KEY, '[]'); } catch { /* Retain session memory. */ }
}
