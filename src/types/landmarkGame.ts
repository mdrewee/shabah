export type LandmarkScope = 'saudi' | 'world';

export type LandmarkGameState =
  | 'LOBBY'
  | 'PLAYING'
  | 'REVEALING'
  | 'ROUND_INTERMISSION'
  | 'GAME_OVER';

export interface LandmarkItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  scope: LandmarkScope;
  city?: string;
  country?: string;
  description?: string;
}

export interface LandmarkPlayer {
  id: string;
  name: string;
  score: number;
  isReady: boolean;
  currentLat: number | null;
  currentLng: number | null;
  currentDistanceKm: number | null;
  currentPointsAwarded: number;
  hasSubmitted: boolean;
}

export interface LandmarkRoomState {
  gameState: LandmarkGameState;
  scope: LandmarkScope;
  players: Record<string, LandmarkPlayer>;
  currentRound: number;
  totalRounds: number;
  currentLandmarkId: string | null;
  roundEndsAt: number | null; // Authoritative Unix timestamp in ms
  sessionLandmarkIds: string[]; // 5 unique landmarks for the match
  playedLandmarkIds: string[]; // Depletion pool tracking
  roundReadyPlayers: Record<string, boolean>; // { [playerId]: true }
  revealStartedAt?: number | null;
}
