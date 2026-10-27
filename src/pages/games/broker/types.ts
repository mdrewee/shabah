import { BrokerItem } from '../../../data/brokerItems';
export { type BrokerItem, type ItemCategory } from '../../../data/brokerItems';

export type BrokerGamePhase = 'LOBBY' | 'SHOWCASE' | 'NEGOTIATION' | 'ROUND_WINNER' | 'FINAL_PODIUM';

export interface ContestantBidState {
  playerId: string;
  playerName: string;
  currentBid: number; // in SAR, starts strictly at 0
  bulletsRemaining: number; // max quota per round (7 bullets)
  rank: number; // 1, 2, 3...
  bestQuote?: string; // best pitch text submitted
  bestPitchScore?: number;
  lastBidIncrease?: number;
  lastBidTimestamp?: number;
  totalBankroll: number; // sum of round bids won/accumulated
  isReadyForNextRound?: boolean;
}

export interface BrokerChatMessage {
  id: string;
  sender: 'contestant' | 'broker';
  text: string;
  persuasionScore?: number; // 1 to 10
  bidIncrease?: number;
  newBid?: number;
  soundFx?: 'cash' | 'buzz';
  timestamp: number;
}

export interface BrokerAnnouncement {
  id: string;
  text: string;
  timestamp: number;
}

export interface BrokerRoundResult {
  roundNumber: number;
  item: BrokerItem;
  winnerId: string;
  winnerName: string;
  winningBid: number;
  winningQuote: string;
}

export interface BrokerRoomState {
  roomCode: string;
  phase: BrokerGamePhase;
  roundNumber: number;
  totalRounds: number;
  currentItem: BrokerItem;
  usedItemIds?: string[]; // All items played in this session to prevent repetition
  timerSeconds: number;
  contestantBids: Record<string, ContestantBidState>;
  announcements: BrokerAnnouncement[];
  winnerId?: string | null;
  winnerName?: string | null;
  winningBid?: number | null;
  winningQuote?: string | null;
  roundHistory?: BrokerRoundResult[];
}
