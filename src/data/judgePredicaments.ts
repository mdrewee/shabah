import { JUDGE_PARTY_CASES } from './judgePartyCases';
export interface JudgeCase {
  id: string;
  category: 'تلاعب رقمي وجغرافي' | 'تلبس وأدلة مادية' | 'خيانة وتضارب مصالح';
  title: string;
  description: string;
  keyEvidence: string;
  contextTag?: string; // For backward compatibility
}

export type Predicament = JudgeCase;

const digitalCases = new Set([2, 4, 11, 14, 17, 19, 21, 23, 31, 32, 33, 36, 39]);
const conflictCases = new Set([5, 9, 12, 13, 18, 20, 22, 25, 27, 28, 34, 35, 37, 40]);

export const JUDGE_CASES_POOL: JudgeCase[] = JUDGE_PARTY_CASES.map(([title,description,keyEvidence], i) => ({
  id: 'case_party_' + (i + 1), title, description, keyEvidence,
  category: digitalCases.has(i + 1) ? 'تلاعب رقمي وجغرافي' : conflictCases.has(i + 1) ? 'خيانة وتضارب مصالح' : 'تلبس وأدلة مادية',
  contextTag:'محكمة التصريف',
}));

const STORAGE_KEY = 'shabah_judge_played_cases_v2';

/**
 * يجلب قضية عشوائية لم تُلعب من قبل في هذا الحساب/المتصفح.
 * إذا تم لعب جميع الـ ٤٠ قضية، يقوم بتصفير السجل تلقائياً ويبدأ دورة جديدة.
 */
export function getNextUnplayedJudgeCase(excludeIdsInCurrentSession: string[] = []): JudgeCase {
  let playedIds: string[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      playedIds = JSON.parse(raw);
      if (!Array.isArray(playedIds)) playedIds = [];
    }
  } catch (e) {
    playedIds = [];
  }

  // دمج القضايا المحفوظة في الحساب مع القضايا التي ظهرت في الجلسة الحالية
  const allExcluded = new Set([...playedIds, ...excludeIdsInCurrentSession]);
  const lastId = excludeIdsInCurrentSession.at(-1) ?? playedIds.at(-1);
  const lastCategory = JUDGE_CASES_POOL.find(c => c.id === lastId)?.category;
  const otherCategories = JUDGE_CASES_POOL.filter(c => c.category !== lastCategory && c.id !== lastId);

  let availableCases = JUDGE_CASES_POOL.filter((c) => !allExcluded.has(c.id));

  // إذا خلص البنك بالكامل (تم لعب الـ ٤٠ قضية كلها)، نصفر الذاكرة ونبدأ من جديد
  if (availableCases.length === 0) {
    playedIds = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    availableCases = JUDGE_CASES_POOL.filter(
      (c) => !excludeIdsInCurrentSession.includes(c.id)
    );
    if (availableCases.length === 0) {
      availableCases = [...JUDGE_CASES_POOL];
    }
  }
  const different = availableCases.filter(c => c.category !== lastCategory);
  if (different.length) availableCases = different;
  else if (otherCategories.length) {
    const outsideSession = otherCategories.filter(c => !excludeIdsInCurrentSession.includes(c.id));
    availableCases = outsideSession.length ? outsideSession : otherCategories;
  }

  const randomIndex = Math.floor(Math.random() * availableCases.length);
  const selectedCase = availableCases[randomIndex];

  // حفظ القضية فوراً في localStorage لضمان عدم تكرارها في الحساب
  try {
    const updatedPlayed = [...playedIds.filter(id => id !== selectedCase.id), selectedCase.id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayed));
  } catch (e) {}

  return selectedCase;
}

// Backward compatibility aliases
export const getRandomJudgeCase = getNextUnplayedJudgeCase;
export const getRandomPredicament = getNextUnplayedJudgeCase;
export const REAL_PREDICAMENTS = JUDGE_CASES_POOL;
export const JUDGE_PREDICAMENTS_POOL = JUDGE_CASES_POOL;
