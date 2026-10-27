import { JudgeRoomState, WorstExcuseRecord } from './types';
import { getNextUnplayedJudgeCase, JUDGE_CASES_POOL } from '../../../data/judgePredicaments';

const STORAGE_PREFIX = 'shabah_judge_state_';

export function getPersistedJudgeState(roomCode: string): JudgeRoomState | null {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${roomCode}`);
    if (raw) {
      const state = JSON.parse(raw);
      // Purge any stale legacy case that does not belong to the 40 cases pool
      if (
        state &&
        state.currentPredicament &&
        state.currentPredicament.id &&
        state.currentPredicament.id.startsWith('case_')
      ) {
        return state;
      }
    }
  } catch {}
  return null;
}

export function savePersistedJudgeState(roomCode: string, state: JudgeRoomState): void {
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${roomCode}`, JSON.stringify(state));
  } catch (err) {
    console.warn('[JudgeSync] Failed to save state to sessionStorage:', err);
  }
}

export function createInitialJudgeState(roomCode: string): JudgeRoomState {
  const existing = getPersistedJudgeState(roomCode);
  if (existing) {
    return existing;
  }

  const initialCase = getNextUnplayedJudgeCase([]);

  const initial: JudgeRoomState = {
    roomCode,
    phase: 'LOBBY',
    roundNumber: 1,
    totalRounds: 5,
    currentPredicament: initialCase,
    usedPredicamentIds: [initialCase.id],
    timerSeconds: 60,
    excuses: {},
    verdicts: {},
    revealState: 'anonymous',
    cumulativeScores: {},
    worstExcuses: {},
    readyPlayersNextRound: [],
  };

  savePersistedJudgeState(roomCode, initial);
  return initial;
}

export interface RankedJudgeContestant {
  id: string;
  name: string;
  score: number;
  rank: number;
}

export function getRankedJudgeContestants(
  cumulativeScores: Record<string, number>,
  contestants: Array<{ id: string; name: string }>
): RankedJudgeContestant[] {
  const list: RankedJudgeContestant[] = contestants.map((c) => ({
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
