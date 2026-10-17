export type TourismGameState =
  | 'GAME_LOBBY'
  | 'LOBBY'
  | 'PLAYING'
  | 'REVEALING'
  | 'ROUND_INTERMISSION'
  | 'GAME_OVER';

export interface TourismItem {
  id: string;
  target: string;
  type: string;
  hints: [string, string, string, string, string];
  aliases?: string[];
}

export interface TourismPlayer {
  id: string;
  name: string;
  score: number;
  isReady: boolean;
  hasLockedIn: boolean;
  lockedInStage: number | null;
  lockedInAnswer: string | null;
  isCorrect: boolean;
  pointsAwarded: number;
}

export interface TourismRoomState {
  gameState: TourismGameState;
  players: Record<string, TourismPlayer>;
  currentRound: number;
  totalRounds: number;
  currentItem: TourismItem | null;
  currentStage: number;
  stageEndsAt: number | null;
  sessionItemIds: string[];
  playedItemIds: string[];
  roundReadyPlayers: Record<string, boolean>;
  revealStartedAt?: number | null;
  skipHintVotes?: Record<string, boolean>;
}
