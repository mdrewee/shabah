import { GuideLandmark } from '../../../data/guideLandmarks';
import { GuideTier } from '../../../services/guideScoring';

export type GuidePhase =
  | 'LOBBY'
  | 'INTRO'
  | 'GUESSING'
  | 'RESULTS'
  | 'PODIUM';

export interface ContestantGuess {
  contestantId: string;
  contestantName: string;
  lat: number;
  lng: number;
  submittedAt: number;
  durationMs?: number;
}

export interface ContestantRoundResult {
  contestantId: string;
  contestantName: string;
  lat: number;
  lng: number;
  distanceKm: number;
  points: number;
  label: string;
  tier: GuideTier;
}

export interface BiggestMissRecord {
  contestantId: string;
  contestantName: string;
  landmarkName: string;
  distanceKm: number;
}

export interface GuideRoomState {
  roomCode: string;
  phase: GuidePhase;
  roundNumber: number;
  totalRounds: number; // default 5
  currentLandmark: GuideLandmark;
  usedLandmarkIds: string[];
  timerSeconds: number; // 60s
  activeClueIndex: number; // 0..4
  roundStartedAt: number;
  guesses: Record<string, ContestantGuess>; // contestantId -> guess
  results: Record<string, ContestantRoundResult>; // contestantId -> computed result
  cumulativeScores: Record<string, number>; // contestantId -> total match points
  biggestMisses: Record<string, BiggestMissRecord>; // contestantId -> worst miss record
  readyPlayersNextRound: string[];
}
