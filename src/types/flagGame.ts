export type FlagGameState = 'LOBBY' | 'PLAYING' | 'REVEALING' | 'ROUND_INTERMISSION' | 'ROUND_OVER' | 'GAME_OVER';

export interface FlagPlayer {
  id: string;
  name: string;
  score: number;
  isReady: boolean;
  currentGuessHex: string | null;
  currentAccuracy: number | null;
}

export interface WorldFlagItem {
  id: string;
  country: string;       // e.g., "السعودية", "قطر", "مصر", "البرازيل", "فرنسا", "اليابان"
  countryCode: string;   // ISO 2-letter (sa, qa, eg, br, fr, jp)
  targetHex: string;     // Exact authentic pantone/hex of the hidden segment
  svgMaskSelector: string; // The specific path/rect selector that turns gray
  name: string;          // "علم [الدولة]"
}

// Alias for backwards compatibility
export type FlagData = WorldFlagItem;

export interface FlagRoomState {
  gameState: FlagGameState;
  players: Record<string, FlagPlayer>;
  currentRound: number;
  totalRounds: number;
  currentFlagId: string | null;
  countdown: number;
  revealedPlayerIds: string[]; // Order of player cards during the reveal sequence
  roundReadyPlayers: Record<string, boolean>; // { [playerId]: true }
  sessionFlagIds: string[]; // 5 unique random flags selected for the session without repetition
  playedFlagIds?: string[]; // Depletion engine: all flags played in the room so far

  // Host-authoritative timing (timestamps from the TV/host clock)
  roundEndsAt?: number | null;
  revealStartedAt?: number | null;

  // Players the host has not heard from recently (excluded from "everyone ready" checks)
  offlinePlayerIds?: string[];
}
