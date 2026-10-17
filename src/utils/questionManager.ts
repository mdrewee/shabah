import { TrajectoryRound } from '../types/trajectoryGame';

/**
 * Select next question guaranteeing NO repetition within the match session.
 */
export function selectNextTrajectoryQuestion(
  allQuestions: TrajectoryRound[],
  usedQuestionIds: string[]
): { question: TrajectoryRound; updatedUsedIds: string[] } {
  // Filter out questions already used in this match
  let available = allQuestions.filter((q) => !usedQuestionIds.includes(q.id));

  // If pool exhausted, reset pool
  if (available.length === 0) {
    available = allQuestions;
    usedQuestionIds = [];
  }

  // Pick random question from available pool
  const randomIndex = Math.floor(Math.random() * available.length);
  const selected = available[randomIndex];

  return {
    question: selected,
    updatedUsedIds: [...usedQuestionIds, selected.id],
  };
}
