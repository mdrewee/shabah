export type CoachGameMode = 'draft' | 'bingo';

export type CoachGamePhase =
  | 'LOBBY'
  | 'DRAFTING'
  | 'EVALUATING'
  | 'VERDICT'
  | 'BINGO_PLAYING'
  | 'BINGO_WON';

export type CoachSlotKey = 'FWD' | 'MID' | 'DEF_1' | 'DEF_2' | 'GK';

export const COACH_SLOT_CONFIG: Record<
  CoachSlotKey,
  { label: string; role: 'FWD' | 'MID' | 'DEF' | 'GK'; order: number }
> = {
  FWD: { label: 'هجوم', role: 'FWD', order: 1 },
  MID: { label: 'وسط', role: 'MID', order: 2 },
  DEF_1: { label: 'مدافع ١', role: 'DEF', order: 3 },
  DEF_2: { label: 'مدافع ٢', role: 'DEF', order: 4 },
  GK: { label: 'حارس', role: 'GK', order: 5 },
};

export const COACH_SLOTS_ORDER: CoachSlotKey[] = ['FWD', 'MID', 'DEF_1', 'DEF_2', 'GK'];

export interface CoachPlayerPick {
  playerName: string;
  isCustom?: boolean;
  playerPhoto?: string;
  matchedDbId?: string;
  conditionId: string;
  conditionTitle: string;
  conditionPrompt?: string;
  confirmedAt?: number;
}

export interface CoachSquad {
  playerId: string;
  playerName: string;
  slots: Partial<Record<CoachSlotKey, CoachPlayerPick>>;
}

export interface ClaimedPlayerInfo {
  normalizedName: string;
  originalName: string;
  contestantId: string;
  contestantName: string;
  timestamp: number;
}

export interface SlotVerification {
  slotKey: CoachSlotKey;
  playerName: string;
  isValidCondition: boolean;
  conditionReason: string;
  isValidPosition: boolean;
  positionReason: string;
  naturalPosition?: string;
}

export interface SquadEvaluationResult {
  playerId: string;
  playerName: string;
  totalPercentage: number; // 0 to 100
  conditionPoints: number; // up to 75% (+15% each)
  positionPoints: number;  // up to 25% (+5% each)
  slots: Record<CoachSlotKey, SlotVerification>;
  critique: string;
  rank?: number;
  matchPointsAwarded?: number; // +5, +3, +1
}

export interface CoachVerdict {
  evaluations: SquadEvaluationResult[];
  winnerId: string;
  winnerName: string;
  winnerScore: number;
  isTie: boolean;
  coachBanner: string;
}

// -------------------------------------------------------------
// Bingo Mode 4x4 Types
// -------------------------------------------------------------

export interface BingoCell {
  id: string;
  title: string;
  description: string;
  type: 'club' | 'country' | 'trophy' | 'trait';
  targetValue: string;
  isMarked: boolean;
}

export interface BingoCard {
  playerId: string;
  cells: BingoCell[]; // Length 16 (indices 0..15)
  isBingo: boolean;
  matchedVector?: number[];
}

export interface BingoRoulettePlayer {
  id: string;
  name: string;
  photoUrl: string;
  currentClub?: string;
  clubs: string[];
  nationality: string;
  trophies: string[];
  traits: string[];
}

// -------------------------------------------------------------
// Full Room Coach State
// -------------------------------------------------------------

export interface CoachRoomState {
  roomCode: string;
  mode: CoachGameMode;
  phase: CoachGamePhase;
  roundNumber: number; // 1 to 5 for Draft
  activeConditionId?: string;
  activeConditionTitle?: string;
  roundEndsAt?: number; // timestamp ms
  claimedPlayers: Record<string, ClaimedPlayerInfo>; // normalizedName -> ClaimedPlayerInfo
  squads: Record<string, CoachSquad>; // playerId -> CoachSquad
  verdict?: CoachVerdict | null;
  // Bingo Mode State
  bingoCards: Record<string, BingoCard>; // playerId -> BingoCard
  currentRoulettePlayer?: BingoRoulettePlayer | null;
  rouletteHistory: string[]; // playerIds
  bingoWinnerId?: string | null;
  bingoWinnerName?: string | null;
}
