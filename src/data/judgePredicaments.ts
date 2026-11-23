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

export const JUDGE_CASES_POOL: JudgeCase[] = JUDGE_PARTY_CASES.map(([title,description,keyEvidence], i) => ({
  id: 'case_party_' + (i + 1), title, description, keyEvidence, category:'تلبس وأدلة مادية', contextTag:'محكمة التصريف',
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

  const randomIndex = Math.floor(Math.random() * availableCases.length);
  const selectedCase = availableCases[randomIndex];

  // حفظ القضية فوراً في localStorage لضمان عدم تكرارها في الحساب
  try {
    const updatedPlayed = Array.from(new Set([...playedIds, selectedCase.id]));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayed));
  } catch (e) {}

  return selectedCase;
}

// Backward compatibility aliases
export const getRandomJudgeCase = getNextUnplayedJudgeCase;
export const getRandomPredicament = getNextUnplayedJudgeCase;
export const REAL_PREDICAMENTS = JUDGE_CASES_POOL;
export const JUDGE_PREDICAMENTS_POOL = JUDGE_CASES_POOL;
