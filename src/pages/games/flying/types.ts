import { FlyingQuestion } from './flyingQuestions';

export type FlyingTier = 'common' | 'uncommon' | 'rare' | 'legendary' | 'failed' | 'duplicated';

export type FlyingPhase =
  | 'LOBBY'
  | 'QUESTION'
  | 'CALCULATING'
  | 'REVEALING'
  | 'ROUND_SUMMARY'
  | 'PODIUM';

export interface FlyingSubmission {
  contestantId: string;
  contestantName: string;
  answer: string;
  submittedAt: number;
}

export interface FlyingContestantResult {
  contestantId: string;
  contestantName: string;
  answer: string;
  isValid: boolean;
  isDuplicated: boolean;
  roundMeters: number;
  tier: FlyingTier;
  comment: string;
  previousTotalMeters: number;
  newTotalMeters: number;
}

export interface FlyingRoomState {
  roomCode: string;
  phase: FlyingPhase;
  roundNumber: number; // 1 to 5
  totalRounds: number; // default 5
  currentQuestion: FlyingQuestion;
  usedQuestionIds: string[];
  timerSeconds: number; // 35s
  roundStartedAt: number;
  submissions: Record<string, FlyingSubmission>; // contestantId -> submission
  results: Record<string, FlyingContestantResult>; // contestantId -> result
  cumulativeMeters: Record<string, number>; // contestantId -> total meters
  activeSpotlightIndex: number; // 0..N-1 during REVEALING
  cameraMode: 'spotlight' | 'global_overview';
  readyPlayersNextRound?: string[];
}

export interface RankedFlyingContestant {
  id: string;
  name: string;
  totalMeters: number;
  rank: number;
  lastRoundMeters?: number;
  lastTier?: FlyingTier;
}
