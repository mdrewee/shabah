import { BrokerRoomState, ContestantBidState, BrokerItem } from './types';
import { getNextUniqueBrokerItem, getBrokerItemByIndex, ensureBrokerItem } from '../../../data/brokerItems';

const STORAGE_PREFIX = 'shabah_broker_state_';

export function getPersistedBrokerState(roomCode: string): BrokerRoomState | null {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${roomCode}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) {
        parsed.currentItem = ensureBrokerItem(parsed.currentItem, parsed.roundNumber || 1);
        return parsed;
      }
    }
  } catch {}
  return null;
}

export function savePersistedBrokerState(roomCode: string, state: BrokerRoomState): void {
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${roomCode}`, JSON.stringify(state));
  } catch (err) {
    console.warn('[BrokerSync] Failed to save state to sessionStorage:', err);
  }
}

export function sortAndRankContestants(
  bids: Record<string, ContestantBidState>
): ContestantBidState[] {
  const list = Object.values(bids);
  list.sort((a, b) => {
    if (b.currentBid !== a.currentBid) {
      return b.currentBid - a.currentBid;
    }
    // Tie-breaker: earlier bid timestamp wins
    return (a.lastBidTimestamp || 0) - (b.lastBidTimestamp || 0);
  });

  return list.map((c, index) => ({
    ...c,
    rank: index + 1,
  }));
}

export function createInitialBrokerState(roomCode: string): BrokerRoomState {
  const existing = getPersistedBrokerState(roomCode);
  if (existing) {
    return existing;
  }

  const { item: initialItem, updatedUsedIds } = getNextUniqueBrokerItem([]);

  const initial: BrokerRoomState = {
    roomCode,
    phase: 'LOBBY',
    roundNumber: 1,
    totalRounds: 5,
    currentItem: initialItem,
    usedItemIds: updatedUsedIds,
    timerSeconds: 10,
    contestantBids: {},
    announcements: [
      {
        id: 'init_1',
        text: 'مرحباً بكم في حراج الشبح الشريطي! جهزوا سوماتكم وأقوى كلام عندكم.',
        timestamp: Date.now(),
      },
    ],
    winnerId: null,
    winnerName: null,
    winningBid: null,
    winningQuote: null,
    roundHistory: [],
  };

  savePersistedBrokerState(roomCode, initial);
  return initial;
}
