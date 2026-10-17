// src/pages/ai/ai-lawyer/services/courtScoring.ts
import { DefenseAnalysis, PlayerScore } from '../types';

export function calculateCourtScores(
  currentScores: Record<string, PlayerScore>,
  evaluations: DefenseAnalysis[],
  winnerPlayerId: string
): Record<string, PlayerScore> {
  const updatedScores: Record<string, PlayerScore> = { ...currentScores };

  evaluations.forEach((evaluation) => {
    const isWinner = evaluation.playerId === winnerPlayerId;
    const isAccepted = evaluation.verdict === 'مقبول';

    let roundPoints = 0;
    if (isWinner) {
      roundPoints = 5;
    } else if (isAccepted) {
      roundPoints = 2;
    }

    const prev = updatedScores[evaluation.playerId] || {
      playerId: evaluation.playerId,
      playerName: evaluation.playerName,
      roundScore: 0,
      totalScore: 0,
      winsCount: 0
    };

    updatedScores[evaluation.playerId] = {
      playerId: evaluation.playerId,
      playerName: evaluation.playerName,
      roundScore: roundPoints,
      totalScore: prev.totalScore + roundPoints,
      winsCount: prev.winsCount + (isWinner ? 1 : 0)
    };
  });

  return updatedScores;
}
