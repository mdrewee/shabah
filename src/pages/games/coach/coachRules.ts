import type { CoachRoomState, CoachSlotKey } from './types';
import { COACH_SLOTS_ORDER } from './types';
import { doesPlayerMatchBingoCell } from './coachSync';

export function canClaimDraftSlot(state: CoachRoomState, playerId: string, slot: CoachSlotKey, round?: number) {
  const existing = state.squads[playerId]?.slots[slot]?.playerName;
  return state.phase === 'DRAFTING' && !state.currentRoundSelections[playerId] &&
    (round === undefined || round === state.roundNumber) && COACH_SLOTS_ORDER.includes(slot) &&
    Boolean(state.squads[playerId]) && (!existing || existing.includes('خانة فارغة'));
}

export function applyBingoAttempt(state: CoachRoomState, action: {
  playerId: string; roulettePlayerId?: string; rouletteTurn?: number; cellIndex?: number;
}, now = Date.now()): CoachRoomState {
  const player = state.currentRoulettePlayer;
  const card = state.bingoCards[action.playerId];
  if (state.phase !== 'BINGO_PLAYING' || !player || !card ||
      action.roulettePlayerId !== player.id || action.rouletteTurn !== state.rouletteHistory.length ||
      state.rouletteSkipVotes.includes(action.playerId) || (state.rouletteEndsAt && now >= state.rouletteEndsAt)) return state;
  const index = action.cellIndex;
  if (index !== undefined && (!Number.isInteger(index) || !card.cells[index] || card.cells[index].isMarked)) return state;
  const cells = card.cells.map((cell, cellIndex) =>
    cellIndex === index && doesPlayerMatchBingoCell(player, cell)
      ? { ...cell, isMarked: true, markedPlayerName: player.name, markedPlayerPhoto: player.photoUrl }
      : cell);
  return { ...state, rouletteSkipVotes: [...state.rouletteSkipVotes, action.playerId],
    bingoCards: { ...state.bingoCards, [action.playerId]: { ...card, cells } } };
}
