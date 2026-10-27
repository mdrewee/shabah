import { GuideRoomState } from './types';
import { getRandomGuideLandmarks, GUIDE_LANDMARKS_POOL } from '../../../data/guideLandmarks';

const STORAGE_KEY_PREFIX = 'SHABAH_GUIDE_STATE_';

export function createInitialGuideState(roomCode: string): GuideRoomState {
  const initialLandmark = getRandomGuideLandmarks(1)[0] || GUIDE_LANDMARKS_POOL[0];

  return {
    roomCode,
    phase: 'LOBBY',
    roundNumber: 1,
    totalRounds: 5,
    currentLandmark: initialLandmark,
    usedLandmarkIds: [initialLandmark.id],
    timerSeconds: 60,
    activeClueIndex: 0,
    roundStartedAt: 0,
    guesses: {},
    results: {},
    cumulativeScores: {},
    biggestMisses: {},
    readyPlayersNextRound: [],
  };
}

export function savePersistedGuideState(roomCode: string, state: GuideRoomState): void {
  try {
    sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${roomCode}`, JSON.stringify(state));
  } catch (e) {
    console.warn('[guideSync] Failed to persist guide state to sessionStorage:', e);
  }
}

export function loadPersistedGuideState(roomCode: string): GuideRoomState | null {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${roomCode}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[guideSync] Failed to load persisted guide state:', e);
    return null;
  }
}

export interface RankedGuideContestant {
  playerId: string;
  playerName: string;
  totalScore: number;
  rank: number;
  biggestMiss?: {
    landmarkName: string;
    distanceKm: number;
  };
}

export function getRankedGuideContestants(
  cumulativeScores: Record<string, number>,
  contestants: Array<{ id: string; name: string }>,
  biggestMisses: Record<string, { landmarkName: string; distanceKm: number }> = {}
): RankedGuideContestant[] {
  // Ensure all known contestants have an entry
  const list = contestants.map((c) => ({
    playerId: c.id,
    playerName: c.name,
    totalScore: cumulativeScores[c.id] || 0,
    biggestMiss: biggestMisses[c.id],
  }));

  // Sort descending by score
  list.sort((a, b) => b.totalScore - a.totalScore);

  return list.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}
