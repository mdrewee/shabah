import { normalizeArabicWord } from '../../../services/arabicEngine';
import type { ArabicRoomState, ContestantEvaluation } from './types';

// Recalculate the entire round after judging or a vote, including duplicate and speed deltas.
export function recalculateArabicRound(state: ArabicRoomState, evaluations: Record<string, ContestantEvaluation>) {
  const next = Object.fromEntries(Object.entries(evaluations).map(([id, ev]) => [id, {
    ...ev, answers: ev.answers.map(answer => ({ ...answer })),
  }]));
  const players = Object.values(next);
  for (const player of players) {
    for (const answer of player.answers) {
      const count = players.filter(p => p.answers.some(a => a.categoryIndex === answer.categoryIndex && a.isValid &&
        normalizeArabicWord(a.rawAnswer) === normalizeArabicWord(answer.rawAnswer))).length;
      answer.points = answer.isValid ? (count > 1 ? 5 : 10) : 0;
      answer.isUnique = answer.isValid && count === 1;
    }
    player.roundPoints = player.answers.reduce((sum, a) => sum + a.points, 0);
    player.speedBonus = 0;
  }
  const eligible = players.filter(p => p.answers.filter(a => a.isValid).length >= 3 &&
    Number.isFinite(state.submissions[p.contestantId]?.submissionDurationMs) &&
    (state.submissions[p.contestantId]?.submissionDurationMs ?? 0) > 0 &&
    (state.submissions[p.contestantId]?.submissionDurationMs ?? 60000) < 60000);
  const fastest = Math.min(...eligible.map(p => state.submissions[p.contestantId].submissionDurationMs ?? 60000));
  for (const player of eligible) {
    if (state.submissions[player.contestantId].submissionDurationMs === fastest) player.speedBonus = 5;
  }
  const cumulativeScores = { ...state.cumulativeScores };
  for (const player of players) {
    player.totalRoundPoints = player.roundPoints + player.speedBonus;
    const previous = state.phase === 'RESULTS' ? state.evaluations[player.contestantId]?.totalRoundPoints || 0 : 0;
    cumulativeScores[player.contestantId] = (cumulativeScores[player.contestantId] || 0) + player.totalRoundPoints - previous;
  }
  return {
    evaluations: next, cumulativeScores,
    playerEvaluations: players.map(p => ({ playerId: p.contestantId, playerName: p.contestantName,
      totalScore: p.totalRoundPoints, speedBonus: p.speedBonus,
      results: p.answers.map(a => ({ category: a.categoryName, answer: a.rawAnswer, isCorrect: a.isValid,
        score: a.points, reason: a.isValid && a.points === 5 ? 'صحيحة ومكررة' : a.comment, needsReview: a.needsReview })),
    })),
  };
}
