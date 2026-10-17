// src/pages/ai/ai-room/services/scoringConfig.ts

import { Suspect, VoteSubmission, RoundScoreResult } from '../types';

export const AI_ROOM_POINTS = {
  CORRECT_VOTE: 5, // Human correctly voted for AI
  AI_SURVIVED: 3, // AI wasn't voted out
  MASTER_BLUFF: 8, // Human player who received the most AI votes
};

export function calculateRoundScores(
  suspects: Suspect[],
  votes: VoteSubmission[],
  currentScores: Record<string, number> = {}
): RoundScoreResult {
  const aiSuspect = suspects.find((s) => s.isAi);
  const aiAvatarId = aiSuspect?.avatarId || '';

  // Count votes per suspect
  const voteTallies: Record<string, number> = {};
  for (const s of suspects) {
    voteTallies[s.avatarId] = 0;
  }

  for (const v of votes) {
    if (voteTallies[v.targetAvatarId] !== undefined) {
      voteTallies[v.targetAvatarId] += 1;
    }
  }

  // Find suspect with highest votes
  let highestVoteCount = -1;
  let mostVotedAvatarId = '';
  let isTie = false;

  for (const [avatarId, count] of Object.entries(voteTallies)) {
    if (count > highestVoteCount) {
      highestVoteCount = count;
      mostVotedAvatarId = avatarId;
      isTie = false;
    } else if (count === highestVoteCount && count > 0) {
      isTie = true;
    }
  }

  // AI caught only if strictly highest votes without tie
  // Tie-breaker: If AI ties for highest votes with a human, AI is considered to have survived.
  const aiCaught = !isTie && mostVotedAvatarId === aiAvatarId && highestVoteCount > 0;
  const aiSurvived = !aiCaught;
  const aiEarnedPoints = aiSurvived ? AI_ROOM_POINTS.AI_SURVIVED : 0;

  // Master Bluffer: Human whose avatar received the most votes as the suspected AI
  let masterBlufferAvatarId: string | undefined = undefined;
  let masterBlufferPlayerId: string | undefined = undefined;

  let highestHumanVotes = -1;
  let topHumanAvatarId = '';
  let humanTie = false;

  for (const s of suspects) {
    if (!s.isAi) {
      const votesForHuman = voteTallies[s.avatarId] || 0;
      if (votesForHuman > highestHumanVotes) {
        highestHumanVotes = votesForHuman;
        topHumanAvatarId = s.avatarId;
        humanTie = false;
      } else if (votesForHuman === highestHumanVotes && votesForHuman > 0) {
        humanTie = true;
      }
    }
  }

  // Award Master Bluff only if human received at least 1 vote and strictly beat other humans
  if (!humanTie && highestHumanVotes > 0 && topHumanAvatarId) {
    masterBlufferAvatarId = topHumanAvatarId;
    const humanSuspect = suspects.find((s) => s.avatarId === topHumanAvatarId);
    masterBlufferPlayerId = humanSuspect?.realPlayerId;
  }

  // Points tracking
  const newPlayerPoints: Record<string, number> = { ...currentScores };
  const roundPointsEarned: Record<string, number> = {};
  const caughtAi: Record<string, boolean> = {};
  const isMasterBluffer: Record<string, boolean> = {};
  const playerBreakdown: Record<string, string[]> = {};
  const correctVoterPlayerIds: string[] = [];
  const correctVoterNames: string[] = [];

  // Initialize
  for (const s of suspects) {
    if (!s.isAi && s.realPlayerId) {
      const pid = s.realPlayerId;
      if (newPlayerPoints[pid] === undefined) {
        newPlayerPoints[pid] = 0;
      }
      roundPointsEarned[pid] = 0;
      caughtAi[pid] = false;
      isMasterBluffer[pid] = false;
      playerBreakdown[pid] = [];
    }
  }

  // 1. Award +5 pt for humans who voted AI correctly
  for (const v of votes) {
    if (v.targetAvatarId === aiAvatarId) {
      const voterSuspect = suspects.find((s) => s.avatarId === v.voterAvatarId);
      if (voterSuspect && !voterSuspect.isAi && voterSuspect.realPlayerId) {
        const pid = voterSuspect.realPlayerId;
        caughtAi[pid] = true;
        correctVoterPlayerIds.push(pid);
        if (voterSuspect.realPlayerName) {
          correctVoterNames.push(voterSuspect.realPlayerName);
        }
        roundPointsEarned[pid] = (roundPointsEarned[pid] || 0) + AI_ROOM_POINTS.CORRECT_VOTE;
        newPlayerPoints[pid] = (newPlayerPoints[pid] || 0) + AI_ROOM_POINTS.CORRECT_VOTE;
        playerBreakdown[pid]?.push(`كشف الذكاء الاصطناعي (+${AI_ROOM_POINTS.CORRECT_VOTE} pt)`);
      }
    }
  }

  // 2. Award +8 pt for Master Bluff
  if (masterBlufferPlayerId && masterBlufferAvatarId) {
    isMasterBluffer[masterBlufferPlayerId] = true;
    roundPointsEarned[masterBlufferPlayerId] =
      (roundPointsEarned[masterBlufferPlayerId] || 0) + AI_ROOM_POINTS.MASTER_BLUFF;
    newPlayerPoints[masterBlufferPlayerId] =
      (newPlayerPoints[masterBlufferPlayerId] || 0) + AI_ROOM_POINTS.MASTER_BLUFF;
    playerBreakdown[masterBlufferPlayerId]?.push(
      `أفضل ممثل - حصد شكوك الفريق (+${AI_ROOM_POINTS.MASTER_BLUFF} pt)`
    );
  }

  return {
    aiRevealed: aiCaught,
    aiSurvived,
    aiVotesCount: voteTallies[aiAvatarId] || 0,
    aiAvatarId,
    aiEarnedPoints,
    masterBlufferPlayerId,
    masterBlufferAvatarId,
    correctVoterPlayerIds,
    correctVoterNames,
    playerPoints: newPlayerPoints,
    roundPointsEarned,
    caughtAi,
    isMasterBluffer,
    playerBreakdown,
  };
}
