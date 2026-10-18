export type BrokerGamePhase = 'LOBBY' | 'AUCTION' | 'ROUND_WINNER' | 'GAME_OVER';

export interface BrokerItem {
  id: string;
  name: string;
  fatalFlaw: string;
  openingBid: number; // in SAR
  category: string;
  lore?: string;
}

export interface ContestantBidState {
  playerId: string;
  playerName: string;
  currentBid: number; // in SAR
  bulletsRemaining: number; // max quota per round (e.g. 7)
  rank: number; // 1, 2, 3...
  bestQuote?: string;
  lastBidIncrease?: number;
  lastBidTimestamp?: number;
  totalScore: number; // accumulated round wins / points (+5 per win)
}

export interface BrokerChatMessage {
  id: string;
  sender: 'contestant' | 'broker';
  text: string;
  persuasionScore?: number; // 1 to 10
  bidIncrease?: number; // 0 or +150 to +1200
  newBid?: number;
  soundFx?: 'cash' | 'buzz';
  timestamp: number;
}

export interface BrokerAnnouncement {
  id: string;
  text: string;
  timestamp: number;
}

export interface BrokerRoomState {
  roomCode: string;
  phase: BrokerGamePhase;
  roundNumber: number;
  currentItem: BrokerItem;
  timerSeconds: number;
  contestantBids: Record<string, ContestantBidState>;
  announcements: BrokerAnnouncement[];
  winnerId?: string | null;
  winnerName?: string | null;
  winningBid?: number | null;
  winningQuote?: string | null;
}
