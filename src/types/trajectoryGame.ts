export type TrajectoryGameState =
  | 'GAME_LOBBY'
  | 'LOBBY'
  | 'ROUND_ACTIVE'
  | 'PLAYING'
  | 'REVEALING'
  | 'ROUND_INTERMISSION'
  | 'GAME_OVER';

export interface TrajectoryRound {
  id: string;
  originCountry: string;
  originCountryEn: string;
  originIso: string;
  originCoords: [number, number]; // [lng, lat]
  bearing: number; // degrees
  lineLengthKm?: number;
  description?: string;
}

export interface TrajectoryPlayer {
  id: string;
  name: string;
  score: number;
  isReady: boolean;
  hasSubmitted: boolean;
  guessedCountryAr: string | null;
  guessedCountryEn: string | null;
  guessedIso3: string | null;
  isValidIntersect: boolean;
  entryDistanceKm: number | null; // distance from origin to country entry
  rank: number | null; // 1, 2, 3 or null
  currentPointsAwarded: number;
}

export interface TrajectoryHitCountry {
  iso3: string;
  nameAr: string;
  nameEn: string;
  distanceKm: number;
  entryCoords?: [number, number];
}

export interface TrajectoryRoomState {
  gameState: TrajectoryGameState;
  players: Record<string, TrajectoryPlayer>;
  currentRound: number;
  totalRounds: number;
  currentRoundData: TrajectoryRound | null;
  roundEndsAt: number | null; // Unix timestamp in ms
  sessionRoundIds: string[];
  playedRoundIds: string[];
  roundReadyPlayers: Record<string, boolean>;
  revealStartedAt?: number | null;
  hitCountries: TrajectoryHitCountry[]; // All countries hit by current trajectory in order of distance
}
