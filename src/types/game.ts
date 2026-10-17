export type Role = 'tv' | 'player' | 'host';

export type AvatarId = 'dallah' | 'finjan' | 'palm' | 'sword' | 'falcon' | 'misbaha' | 'camel' | 'tent' | (string & {});

export type TeamId = 'team_a' | 'team_b'; // team_a: الفريق الأول (أخضر زيتوني - أفقي), team_b: الفريق الثاني (طيني - رأسي)

export interface PlayerAvatar {
  id: AvatarId;
  name: string;
  iconName: string;
  bg: string;
  fg: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: AvatarId;
  team: TeamId;
  joinedAt: number;
  isHost?: boolean;
  isVip?: boolean;
  isOnline: boolean;
  lastPingMs?: number;
  lastBuzzerAt?: number;
  isBot?: boolean; // Demo/test player driven by the host
  isReady?: boolean;
}

export interface QuestionItem {
  id: string;
  letter: string;
  question: string;
  answer: string;
  hintEnding?: string; // used in last-letter mode
  category?: string;
}

export interface HexCell {
  id: string;
  row: number; // 0..4
  col: number; // 0..4
  label: string; // The letter or category name
  subLabel?: string;
  owner: 'none' | TeamId;
  question: QuestionItem;
}

export type BuzzerStatus = 'idle' | 'reading' | 'unlocked' | 'buzzed' | 'passed';

export interface QuestionTurnState {
  cellId: string;
  letter: string;
  currentQuestionId: string;
  attemptPhase: 'INITIAL' | 'REBOUND_TEAM_B' | 'REROLL';
  lockedTeamId: TeamId | null;
}

export interface BuzzerLockState {
  status: BuzzerStatus;
  unlockedAt?: number;
  buzzedPlayerId?: string;
  buzzedPlayerName?: string;
  buzzedTeam?: TeamId;
  lockedTeamId?: TeamId | null;
  attemptPhase?: 'INITIAL' | 'REBOUND_TEAM_B' | 'REROLL';
  endsAt?: number | null; // Authoritative Unix timestamp in ms when the active timer window expires
  idleEndsAt?: number | null; // Authoritative Unix timestamp in ms for 10s idle buzzer window
  countdownRemaining: number; // 3 or 5 to 0
  timerDuration: number; // 3 for 1st attempt, 5 for rebound
  attemptNumber: number; // 1 or 2
  countdownStartedAt?: number;
  isFrozen?: boolean; // When 0s is reached, freeze and await host manual evaluation
  idleCountdownRemaining?: number; // 10s countdown when buzzer is unlocked awaiting any press
}

export interface TeamScore {
  name: string;
  color: 'olive' | 'ochre';
  connectDirection: 'horizontal' | 'vertical'; // team_a: Left to Right, team_b: Top to Bottom
  cellsWon: number;
  roundsWon: number;
}

export interface RoomScores {
  team_a: TeamScore;
  team_b: TeamScore;
}

export interface HostRequest {
  playerId: string;
  playerName: string;
  requestedAt: number;
}

export interface RoomState {
  id: string;
  code: string;
  createdAt: number;
  status: 'lobby' | 'playing' | 'round_won';
  hostConnected: boolean;
  hostPasscode: string;
  hostPlayerId: string | null;
  hostRequest: HostRequest | null;
  selectedGameId: string;
  players: Player[];
  lastActivity: number;

  // Hex Game Engine State
  hexGrid: HexCell[];
  activeCellId: string | null;
  activeQuestion: QuestionItem | null;
  questionTurnState?: QuestionTurnState;
  buzzerLock: BuzzerLockState;
  scores: RoomScores;
  winnerTeam: TeamId | null;
  winningPath: string[];
  roundNumber: number;

  // Winner next cell picker
  lastWinnerPlayerId: string | null;
  cellPickerPlayerId: string | null;
  cellPickerPlayerName: string | null;

  // Depletion engine: all questions used in this room/session
  usedQuestionIds?: string[];

  // Temporary Toast message for TV and users (e.g. idle timeout reroll)
  toastMessage?: string | null;

  // Sync metadata (monotonic version so stale copies never overwrite newer state)
  version?: number;
  updatedAt?: number;
  writerId?: string;

  // Flag Color Guesser Game State
  flagState?: import('./flagGame').FlagRoomState;

  // Landmark Pinning Game State
  landmarkState?: import('./landmarkGame').LandmarkRoomState;

  // Trajectory Game State
  trajectoryState?: import('./trajectoryGame').TrajectoryRoomState;

  // Blind Tourism Game State
  tourismState?: import('./tourismGame').TourismRoomState;
}

