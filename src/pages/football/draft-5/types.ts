import { DraftCondition } from '../../../data/draftConditions';
import { FootballPlayer } from '../../../data/footballMasterData';
import { DraftClub } from '../../../data/draftClubs';

export type DraftPosition = 'FWD' | 'MID' | 'DEF_1' | 'DEF_2' | 'GK';

export const DRAFT_POSITION_NAMES: Record<DraftPosition, string> = {
  FWD: 'مهاجم (FWD)',
  MID: 'خط وسط (MID)',
  DEF_1: 'مدافع أول (DEF 1)',
  DEF_2: 'مدافع ثانٍ (DEF 2)',
  GK: 'حارس مرمى (GK)',
};

export const DRAFT_POSITION_SHORT_NAMES: Record<DraftPosition, string> = {
  FWD: 'مهاجم',
  MID: 'وسط',
  DEF_1: 'مدافع 1',
  DEF_2: 'مدافع 2',
  GK: 'حارس',
};

// Formation grid order from Top (Attack) to Bottom (Goalie)
export const DRAFT_SLOTS_ORDER: DraftPosition[] = [
  'FWD',
  'MID',
  'DEF_1',
  'DEF_2',
  'GK',
];

// Alias for backwards compatibility / round-based slot mappings
export const DRAFT_ROUND_POSITIONS: DraftPosition[] = DRAFT_SLOTS_ORDER;

// Calculate round pick queue using Round-Robin rotation
export const getRoundPickOrder = (
  players: { id: string; name: string }[],
  roundNumber: number // 1 to 5
): { id: string; name: string }[] => {
  if (!players || players.length === 0) return [];
  const shiftIndex = (roundNumber - 1) % players.length;
  return [
    ...players.slice(shiftIndex),
    ...players.slice(0, shiftIndex),
  ];
};

export type DraftPhase = 'LOBBY' | 'DRAFTING' | 'AI_REVEAL' | 'EVALUATION' | 'MATCH_OVER';

export interface PlayerSquadSlot {
  playerName: string;
  playerPhoto?: string;
  conditionId?: string;
  conditionTitle?: string;
  conditionPrompt?: string;
}

export interface PlayerSquad {
  playerId: string;
  playerName: string;
  teamLogo?: string;
  selectedClub?: DraftClub | null;
  slots: Partial<Record<DraftPosition, PlayerSquadSlot>>;
}

export interface DraftContestantPick {
  position: DraftPosition;
  player: FootballPlayer;
  roundConditionId?: string;
  roundConditionTitle?: string;
  roundConditionPrompt?: string;
  pickedAtRound: number;
}

export interface DraftContestant {
  id: string;
  name: string;
  isReady?: boolean;
  selectedClub?: DraftClub | null;
  picks: Record<DraftPosition, FootballPlayer | null>;
  // Store condition applied to each slot pick
  pickConditions?: Record<DraftPosition, DraftCondition | null>;
  // Round scores / victories across the 5 rounds
  totalWins?: number;
  readyForNextRound?: boolean;
}

export interface PlayerConditionVerification {
  position: DraftPosition;
  playerName: string;
  playerPhoto?: string;
  conditionTitle: string;
  isValid: boolean; // Pillar 1: Condition Adherence
  reason: string;   // Pillar 1: Explicit error/success explanation
  isPositionValid?: boolean; // Pillar 2: Positional Accuracy
  positionReason?: string;   // Pillar 2: Sarcastic/tactical positional critique
  naturalPosition?: string;
}

export interface SquadEvaluationResult {
  playerId: string;
  playerName: string;
  teamLogo: string;
  validConditionsCount: number;
  validPositionsCount: number;
  overallPercentage: number;
  slotsAnalysis: Record<string, {
    playerName: string;
    conditionTitle: string;
    isConditionMet: boolean;
    conditionReason: string;
    isPositionValid: boolean;
    positionReason: string;
  }>;
  critiqueSummary: string;
}

export interface SquadAIEvaluation {
  playerId: string;
  playerName: string;
  selectedClub?: DraftClub | null;
  teamLogo?: string;
  validConditionsCount: number; // 0 to 5
  validPositionsCount: number;  // 0 to 5
  totalValidCount?: number;     // 0 to 10
  conditionVerifications: PlayerConditionVerification[];
  slotsAnalysis?: Record<string, {
    playerName: string;
    conditionTitle: string;
    isConditionMet: boolean;
    conditionReason: string;
    isPositionValid: boolean;
    positionReason: string;
  }>;
  ratings: {
    gk: number;        // out of 100
    defense: number;   // out of 100 (DEF_1 + DEF_2)
    midfield: number;  // out of 100
    attack: number;    // out of 100
    synergy: number;   // out of 100
  };
  overallPercentage: number; // e.g. 88%
  critiqueTitle: string;     // e.g. 'هجوم فتاك ودفاع يغرق في شبر مية'
  critiqueSummary?: string;
  detailedBreakdown: {
    strengths: string[];     // نقاط القوة
    weaknesses: string[];    // نقاط الضعف
    tacticalSummary: string; // تحليل تكتيكي ساخر ودقيق
  };
}

export interface DraftVerdictResult {
  evaluations: SquadAIEvaluation[];
  winnerId: string;
  winnerName: string;
  winnerClub?: DraftClub | null;
  isTie: boolean;
  tiedContestantIds: string[];
  maxConditionsMet: number;
  verdictBanner: string;
  tieBreakAnalysis?: string;
}

export type DraftAction =
  | 'PLAYER_READY'
  | 'KICK_PLAYER'
  | 'GAME_START'
  | 'LIVE_PICK_COMMITTED'
  | 'PICK_LOCKED'
  | 'PLAYER_PICKED'
  | 'PLAYER_LOCKED'
  | 'DRAFT_COMPLETE'
  | 'ROUND_ADVANCE'
  | 'AI_EVALUATION_START'
  | 'AI_EVALUATION_DONE'
  | 'PLAYER_NEXT_ROUND_READY'
  | 'START_NEXT_ROUND'
  | 'RESET_LOBBY'
  | 'ROOM_TERMINATED'
  | 'DRAFT_FINISHED'
  | 'PUSH_FINAL_SQUAD'
  | 'FORCE_PUSH_SQUADS';

export interface DraftEventPayload {
  action: DraftAction;
  phase?: DraftPhase;
  round?: number;           // 1 to 5
  totalRounds?: number;     // 5
  activeCondition?: DraftCondition;
  turnOrder?: string[];     // Array of playerIds in order for current round
  currentPickerId?: string; // PlayerId who has the turn
  currentPickerName?: string;
  pickedPosition?: DraftPosition;
  pickedPlayer?: FootballPlayer;
  appliedCondition?: DraftCondition;
  player?: {
    name: string;
    photo?: string;
    conditionTitle?: string;
    conditionPrompt?: string;
  };
  // Specific payload for PLAYER_PICKED, PLAYER_LOCKED and DRAFT_COMPLETE
  slotKey?: DraftPosition;
  pickedPlayerName?: string;
  pickerName?: string;
  lockedPlayerName?: string;
  conditionId?: string;
  conditionTitle?: string;
  teamLogo?: string;
  squad?: PlayerSquad;
  allSquads?: Record<string, PlayerSquad>;
  draftedPlayerIds?: string[]; // Global anti-steal list
  evaluations?: SquadAIEvaluation[];
  verdictResult?: DraftVerdictResult;
  contestants?: DraftContestant[];
  targetPlayerId?: string;
  playerId?: string;
  playerName?: string;
  selectedClub?: DraftClub | null;
  isReady?: boolean;
}
