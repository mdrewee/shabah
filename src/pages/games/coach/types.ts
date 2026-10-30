import { DraftCondition } from '../../../data/draftConditions';
import { CoachCriterion } from '../../../data/coachCriteria';

export type CoachGameMode = 'draft' | 'bingo';

export type CoachGamePhase =
  | 'LOBBY'
  | 'DRAFTING'
  | 'ROUND_REVEAL'
  | 'EVALUATING'
  | 'VERDICT'
  | 'BINGO_PLAYING'
  | 'BINGO_WON';

export type CoachSlotKey = 'FWD' | 'MID' | 'DEF_1' | 'DEF_2' | 'GK';

export const COACH_SLOT_CONFIG: Record<
  CoachSlotKey,
  { label: string; role: 'FWD' | 'MID' | 'DEF' | 'GK'; order: number }
> = {
  GK: { label: 'الخانة 1', role: 'GK', order: 1 },
  DEF_1: { label: 'الخانة 2', role: 'DEF', order: 2 },
  DEF_2: { label: 'الخانة 3', role: 'DEF', order: 3 },
  MID: { label: 'الخانة 4', role: 'MID', order: 4 },
  FWD: { label: 'الخانة 5', role: 'FWD', order: 5 },
};

export const COACH_SLOTS_ORDER: CoachSlotKey[] = ['GK', 'DEF_1', 'DEF_2', 'MID', 'FWD'];

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
  playerPower: number; // 0 to 100
}

export interface SquadEvaluationResult {
  playerId: string;
  playerName: string;
  totalPercentage: number; // 0 to 100
  conditionPoints: number; // 40% (each valid condition = +8%)
  positionPoints: number;  // 25% (each valid position = +5%)
  powerPoints: number;     // 35% (player power / prestige tier)
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
  type: 'club' | 'country' | 'trophy' | 'trait' | 'manager';
  targetValue: string;
  imageUrl?: string;
  isMarked: boolean;
  markedPlayerPhoto?: string;
  markedPlayerName?: string;
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
  totalRounds: number; // 5
  slotIndex: number;   // 0 to 4 (GK, DEF_1, DEF_2, MID, FWD)
  activeConditionId?: string;
  activeConditionTitle?: string;
  activeConditionDescription?: string;
  roundEndsAt?: number; // timestamp ms
  claimedPlayers: Record<string, ClaimedPlayerInfo>; // normalizedName -> ClaimedPlayerInfo (all claimed players across match)
  currentRoundSelections: Record<string, CoachPlayerPick>; // contestantId -> pick in current round
  usedPlayersAcrossMatch: string[]; // Global Match Blocklist across all 5 rounds
  readyPlayersNextRound: string[]; // IDs of players who clicked "جاهز للجولة التالية"
  cumulativeScores: Record<string, number>; // playerId -> sum of round percentage scores
  squads: Record<string, CoachSquad>; // playerId -> CoachSquad
  matchConditions?: DraftCondition[]; // 25 non-repeating conditions
  matchCriteria?: CoachCriterion[]; // 5 simultaneous round criteria
  verdict?: CoachVerdict | null;

  // Snake Draft Turn-Based State
  currentTurnPlayerId?: string | null;
  currentTurnPlayerName?: string | null;
  turnOrder?: string[];
  turnIndex?: number;
  turnSecondsRemaining?: number;

  // Bingo Mode State
  bingoCards: Record<string, BingoCard>; // playerId -> BingoCard
  currentRoulettePlayer?: BingoRoulettePlayer | null;
  rouletteHistory: string[]; // playerIds
  rouletteSkipVotes: string[]; // playerIds who voted or marked this roulette player
  bingoWinnerId?: string | null;
  bingoWinnerName?: string | null;
}
