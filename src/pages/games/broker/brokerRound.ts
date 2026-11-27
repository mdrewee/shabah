import type { BrokerRoomState } from './types';
import type { BrokerItem } from '../../../data/brokerItems';
import { sortAndRankContestants } from './brokerSync';

export function acceptsBrokerPitch(state: BrokerRoomState, payload: any, activeIds: string[], pending: boolean, now = Date.now()): boolean {
  const bid = state.contestantBids[payload?.playerId];
  return Boolean(bid && payload?.playerId !== 'host_tv' && activeIds.includes(payload?.playerId) && !pending &&
    typeof payload.requestId === 'string' && /^[a-f0-9-]{36}$/i.test(payload.requestId) &&
    payload.requestId !== bid.lastRequestId && typeof payload.pitch === 'string' &&
    payload.pitch.trim() && payload.pitch.length <= 140 && payload.roundNumber === state.roundNumber &&
    payload.itemId === state.currentItem.id && state.phase === 'NEGOTIATION' &&
    (state.roundEndsAt || 0) > now && bid.bulletsRemaining > 0);
}

export function allBrokerTurnsFinished(state: BrokerRoomState, activeIds: string[]): boolean {
  const contestants = activeIds.filter(id => id !== 'host_tv');
  return state.phase === 'NEGOTIATION' && contestants.length > 0 &&
    contestants.every(id => state.contestantBids[id]?.bulletsRemaining === 0);
}

export function beginBrokerNegotiation(state: BrokerRoomState, now = Date.now()): BrokerRoomState {
  if (state.phase !== 'SHOWCASE') return state;
  return { ...state, phase: 'NEGOTIATION', timerSeconds: 180, roundEndsAt: now + 180000 };
}

export function nextBrokerRound(state: BrokerRoomState, item: BrokerItem): BrokerRoomState {
  if (state.phase !== 'ROUND_WINNER') return state;
  if (state.roundNumber >= state.totalRounds) return { ...state, phase: 'FINAL_PODIUM' };
  return { ...state, phase: 'SHOWCASE', roundNumber: state.roundNumber + 1, currentItem: item,
    usedItemIds: [...(state.usedItemIds || []), item.id], timerSeconds: 10, roundEndsAt: undefined,
    winnerId: null, winnerName: null, winningBid: null, winningQuote: null,
    contestantBids: Object.fromEntries(Object.entries(state.contestantBids).map(([id, bid]) => [id, {
      ...bid, currentBid: 0, bulletsRemaining: 7, bestQuote: undefined, bestPitchScore: undefined,
      lastBidIncrease: undefined, lastBidTimestamp: undefined, lastRequestId: undefined, isReadyForNextRound: false,
    }])),
  };
}

export function finishBrokerRound(state: BrokerRoomState, activeIds: string[]): BrokerRoomState {
  if (state.phase !== 'NEGOTIATION') return state;
  const winner = sortAndRankContestants(state.contestantBids).find(p => activeIds.includes(p.playerId) && p.currentBid > 0);
  const contestantBids = Object.fromEntries(Object.entries(state.contestantBids).filter(([id]) => id !== 'host_tv').map(([id, bid]) => [id, {
    ...bid, isReadyForNextRound: false,
    totalBankroll: bid.totalBankroll + (id === winner?.playerId ? winner.currentBid : 0),
  }]));
  return { ...state, phase: 'ROUND_WINNER', timerSeconds: 0, contestantBids,
    winnerId: winner?.playerId || null, winnerName: winner?.playerName || null,
    winningBid: winner?.currentBid || 0, winningQuote: winner?.bestQuote || null,
  };
}
