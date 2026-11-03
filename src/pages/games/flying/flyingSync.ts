import { FlyingRoomState, RankedFlyingContestant } from './types';
import { getRandomFlyingQuestion } from './flyingQuestions';

const STORAGE_PREFIX = 'shabah_flying_state_';

export function getPersistedFlyingState(roomCode: string): FlyingRoomState | null {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${roomCode}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function savePersistedFlyingState(roomCode: string, state: FlyingRoomState): void {
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${roomCode}`, JSON.stringify(state));
  } catch (err) {
    console.warn('[FlyingSync] Failed to save state to sessionStorage:', err);
  }
}

export function clearPersistedFlyingState(roomCode: string): void {
  try {
    sessionStorage.removeItem(`${STORAGE_PREFIX}${roomCode}`);
  } catch {}
}

export function createInitialFlyingState(roomCode: string): FlyingRoomState {
  const existing = getPersistedFlyingState(roomCode);
  if (existing) {
    return existing;
  }

  const initialQuestion = getRandomFlyingQuestion([]);

  const initial: FlyingRoomState = {
    roomCode,
    phase: 'LOBBY',
    roundNumber: 1,
    totalRounds: 5,
    currentQuestion: initialQuestion,
    usedQuestionIds: [initialQuestion.id],
    timerSeconds: 35,
    roundStartedAt: 0,
    submissions: {},
    results: {},
    cumulativeMeters: {},
    activeSpotlightIndex: 0,
    cameraMode: 'spotlight',
    readyPlayersNextRound: [],
  };

  savePersistedFlyingState(roomCode, initial);
  return initial;
}

export function getRankedFlyingContestants(
  cumulativeMeters: Record<string, number>,
  contestants: Array<{ id: string; name: string }>,
  results: Record<string, any> = {}
): RankedFlyingContestant[] {
  const list: RankedFlyingContestant[] = contestants.map((c) => {
    const res = results[c.id];
    return {
      id: c.id,
      name: c.name,
      totalMeters: cumulativeMeters[c.id] || 0,
      rank: 1,
      lastRoundMeters: res?.roundMeters,
      lastTier: res?.tier,
    };
  });

  list.sort((a, b) => b.totalMeters - a.totalMeters);

  return list.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}
