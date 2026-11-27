import type { FlyingContestantResult, FlyingSubmission } from './types';

export const METERS_PER_FLYING_ROUND = 1000;
export const SPOTLIGHT_DURATION_MS = 3400;
export const FLIGHT_LAUNCH_DELAY_MS = 260;
export const FLIGHT_DURATION_MS = 1500;
export const FLYING_QUESTION_SECONDS = 35;

export function flyingSecondsLeft(roundStartedAt: number, now = Date.now()) {
  return Math.max(0, Math.min(FLYING_QUESTION_SECONDS,
    Math.ceil((roundStartedAt + FLYING_QUESTION_SECONDS * 1000 - now) / 1000)));
}

export function flyingAltitudeRatio(meters: number, rounds: number) {
  return Math.min(1, Math.max(0, meters / (METERS_PER_FLYING_ROUND * Math.max(1, rounds))));
}

// Results are frozen by the host at evaluation time. Presence can change during the reveal.
export function flyingRevealRoster(results: Record<string, FlyingContestantResult>) {
  return Object.values(results).map(({ contestantId, contestantName }) => ({ id: contestantId, name: contestantName }));
}

export function hasAllFlyingAnswers(players: Array<{ id: string }>, submissions: Record<string, FlyingSubmission>) {
  const active = players.filter((player) => player.id !== 'host_tv');
  return active.length > 0 && active.every((player) => Boolean(submissions[player.id]?.answer.trim()));
}
