// src/pages/ai/the-scammer/types.ts

export type ScammerPhase =
  | 'LOBBY'
  | 'PRODUCT_REVEAL'      // TV reveals the item (20s)
  | 'NEGOTIATION_CHAT'    // Live 90s chat on mobile between player & AI buyer
  | 'SHOWCASE_TRANSCRIPT' // TV reveals highest bidder & scrolls their full hilarious chat log
  | 'PODIUM';             // Final results & winner crowning

export interface WeirdProduct {
  id: string;
  name: string;
  flaw: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  sender: 'player' | 'bot';
  text: string;
  currentBid: number; // The bid at that specific moment
  timestamp?: number;
}

export interface PlayerNegotiation {
  playerId: string;
  playerName: string;
  currentBid: number;
  messages: ChatMessage[];
  botFinalRoast?: string;
  isFinished?: boolean;
}

export interface ScammerScore {
  playerId: string;
  playerName: string;
  finalBid: number;
  points: number; // +10 pt for 1st place, etc.
}
