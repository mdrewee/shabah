import type { FlyingSubmission } from './types';

export function hasAllFlyingAnswers(players: Array<{ id: string }>, submissions: Record<string, FlyingSubmission>) {
  const active = players.filter((player) => player.id !== 'host_tv');
  return active.length > 0 && active.every((player) => Boolean(submissions[player.id]?.answer.trim()));
}
