import { ArabicRoomState } from './types';
import { getRandomCategories, getRandomLetter } from '../../../data/arabicCategories';

const STORAGE_PREFIX = 'shabah_arabic_state_';

export function getPersistedArabicState(roomCode: string): ArabicRoomState | null {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${roomCode}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function savePersistedArabicState(roomCode: string, state: ArabicRoomState): void {
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${roomCode}`, JSON.stringify(state));
  } catch (err) {
    console.warn('[ArabicSync] Failed to save state to sessionStorage:', err);
  }
}

export function clearPersistedArabicState(roomCode: string): void {
  try {
    sessionStorage.removeItem(`${STORAGE_PREFIX}${roomCode}`);
  } catch {}
}

export function createInitialArabicState(roomCode: string): ArabicRoomState {
  const existing = getPersistedArabicState(roomCode);
  if (existing) {
    return existing;
  }

  const initialLetter = getRandomLetter([]);
  const initialCategories = getRandomCategories(5, []);

  const initial: ArabicRoomState = {
    roomCode,
    phase: 'LOBBY',
    roundNumber: 1,
    totalRounds: 5,
    currentLetter: initialLetter,
    usedLetters: [initialLetter],
    currentCategories: initialCategories,
    usedCategories: [...initialCategories],
    timerSeconds: 60,
    roundStartedAt: 0,
    submissions: {},
    evaluations: {},
    cumulativeScores: {},
    activeObjection: null,
    readyPlayersNextRound: [],
  };

  savePersistedArabicState(roomCode, initial);
  return initial;
}

export interface RankedContestant {
  id: string;
  name: string;
  score: number;
  rank: number;
}

export function getRankedContestants(
  cumulativeScores: Record<string, number>,
  contestants: Array<{ id: string; name: string }>
): RankedContestant[] {
  const list: RankedContestant[] = contestants.map((c) => ({
    id: c.id,
    name: c.name,
    score: cumulativeScores[c.id] || 0,
    rank: 1,
  }));

  list.sort((a, b) => b.score - a.score);

  return list.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}
