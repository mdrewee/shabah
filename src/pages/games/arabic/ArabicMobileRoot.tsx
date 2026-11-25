import { ShabahThinkingScreen } from '../../../components/common/ShabahThinkingScreen';
import { isRoomHost } from '../../../services/roomService';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom, roomBus } from '../../../lib/roomBus';
import { useRoomSync } from '../../../hooks/useRoomSync';
import { sound } from '../../../lib/audio';
import { UnifiedShabahLobby } from '../../../components/lobby/UnifiedShabahLobby';
import { ArabicRoomState, ObjectionState, PlayerArabicEvaluation } from './types';
import { createInitialArabicState, getRankedContestants } from './arabicSync';
import {
  getOrCreatePlayerId,
  getOrCreatePlayerName,
  getPersistedPlayerName,
} from '../../../utils/playerSession';
import { ArabicRouletteStage } from './components/ArabicRouletteStage';
import { ArabicMobileInput } from './components/ArabicMobileInput';
import { ArabicMobileResults } from './components/ArabicMobileResults';
import { ArabicFinalPodium } from './components/ArabicFinalPodium';
import { Clock } from 'lucide-react';

export const ArabicMobileRoot: React.FC<{onNextRound?:()=>void}> = ({onNextRound}) => {
  const { code: rawCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const roomCode = (rawCode || 'SHBH').trim().toUpperCase();

  const [playerId] = useState<string>(() => getOrCreatePlayerId());
  const [playerName] = useState<string>(() => {
    return getPersistedPlayerName() || getOrCreatePlayerName('متسابق');
  });

  // Maintain Supabase Realtime channel
  useRoomSync({
    roomCode,
    role: 'contestant',
    playerId,
    playerName,
  });

  const { room } = useRoom(roomCode);
  const activeRoom = room || roomBus.getRoom(roomCode);

  const [arabicState, setArabicState] = useState<ArabicRoomState>(() =>
    createInitialArabicState(roomCode)
  );

  const [hasSubmittedThisRound, setHasSubmittedThisRound] = useState<boolean>(false);
  const [isReadyForNextRound, setIsReadyForNextRound] = useState<boolean>(false);

  // Synchronize with TV host state
  useEffect(() => {
    const unsubSync = roomBus.on('ARABIC_STATE_SYNC', (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (!payload) return;
      setArabicState(payload);

      // Reset submission flag when a new round starts
      if (payload.phase === 'ROULETTE' || payload.phase === 'INPUT') {
        setIsReadyForNextRound(false);
      }
      const submitted = Boolean(payload.submissions?.[playerId]);
      if (submitted || payload.phase === 'ROULETTE') {
        setHasSubmittedThisRound(submitted);
      }
    }, roomCode);

    const unsubResults = roomBus.on('ARABIC_RESULTS_READY', (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (!payload?.evaluations) return;

      const playerEvals: PlayerArabicEvaluation[] = payload.evaluations;
      const legacyMap: Record<string, any> = {};

      playerEvals.forEach((pe) => {
        legacyMap[pe.playerId] = {
          contestantId: pe.playerId,
          contestantName: pe.playerName,
          totalRoundPoints: pe.totalScore,
          roundPoints: pe.totalScore - (pe.speedBonus || 0),
          speedBonus: pe.speedBonus || 0,
          answers: pe.results.map((r, idx) => ({
            categoryIndex: idx,
            categoryName: r.category,
            rawAnswer: r.answer,
            isValid: r.isCorrect,
            isUnique: r.score === 10,
            points: r.score,
            comment: r.reason,
            needsReview: r.needsReview,
          })),
        };
      });

      setArabicState((prev) => ({
        ...prev,
        phase: 'RESULTS',
        playerEvaluations: playerEvals,
        evaluations: legacyMap,
      }));
    });

    const unsubResolved = roomBus.on('ARABIC_OBJECTION_RESOLVED', (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (!payload) return;

      if (payload.isOverturned) {
        sound.playVictory();
      } else {
        sound.playIncorrect?.();
      }
    });

    const unsubLobby = roomBus.on('RETURN_TO_LOBBY', (evt: any) => {
      const incomingCode = evt?.roomCode;
      if (incomingCode && incomingCode !== roomCode) return;
      setArabicState((prev) => ({
        ...prev,
        phase: 'LOBBY',
      }));
      setHasSubmittedThisRound(false);
      setIsReadyForNextRound(false);
    });

    return () => {
      unsubSync?.();
      unsubResults?.();
      unsubResolved?.();
      unsubLobby?.();
    };
  }, [roomCode]);

  useEffect(() => {
    roomBus.emit('REQUEST_ROOM_STATE', roomCode, {});
  }, [roomCode]);

  // Handle Answer Submission
  const handleSubmitAnswers = (answers: Record<number, string>, durationMs: number) => {
    setHasSubmittedThisRound(true);
    sound.playClick();

    const payload = {
      contestantId: playerId,
      contestantName: playerName,
      playerId,
      playerName,
      answers,
      finishedAt: Date.now(),
      durationMs,
      roundNumber: arabicState.roundNumber,
    };

    roomBus.broadcastArabicAnswers(roomCode, payload);
    // Also emit SUBMIT_ARABIC_ANSWERS for compatibility
    roomBus.safeBroadcast(roomCode, 'SUBMIT_ARABIC_ANSWERS', payload);
  };

  // Handle Objection Filing
  const handleFileObjection = (categoryIndex: number, answer: string) => {
    sound.playClick();
    const categoryName = arabicState.currentCategories[categoryIndex] || '';
    const payload = {
      contestantId: playerId,
      contestantName: playerName,
      category: categoryName,
      categoryIndex,
      answer,
      roundNumber: arabicState.roundNumber,
    };
    roomBus.broadcastArabicObjection(roomCode, payload);
    roomBus.safeBroadcast(roomCode, 'ARABIC_OBJECTION_RAISED', payload);
  };

  // Handle Objection Vote
  const handleVoteObjection = (objectionId: string, voteFor: boolean) => {
    sound.playClick();
    roomBus.broadcastArabicVote(roomCode, {
      contestantId: playerId,
      objectionId,
      voteFor,
    });
  };

  // Handle Ready Toggle
  const handleToggleReady = () => {
    const nextReady = !isReadyForNextRound;
    setIsReadyForNextRound(nextReady);
    roomBus.broadcastPlayerReadyUpdate(roomCode, playerId, nextReady, playerName);
  };

  // Handle Return to Lobby
  const handleReturnToLobby = () => {
    if (!isRoomHost(roomCode) || !window.confirm('ترجع للوبي وتنهي الجولة؟')) return;
    roomBus.broadcastReturnToLobby(roomCode);
    setArabicState((prev) => ({
      ...prev,
      phase: 'LOBBY',
    }));
  };

  // 1. Lobby Phase
  if (arabicState.phase === 'LOBBY') {
    return (
      <UnifiedShabahLobby
        roomCode={roomCode}
        gameId="ai-arabic"
        gameTitle="الشبح العربي"
        role="contestant"
        isPlayerHost={isRoomHost(roomCode)}
        currentPlayerId={playerId}
        onExit={() => {
          roomBus.leavePlayer(roomCode, playerId);
          navigate('/');
        }}
      />
    );
  }

  // 2. Roulette Phase
  if (arabicState.phase === 'ROULETTE') {
    return (
      <ArabicRouletteStage
        targetLetter={arabicState.currentLetter}
        roundNumber={arabicState.roundNumber}
        totalRounds={arabicState.totalRounds}
        isTV={false}
      />
    );
  }

  // 3. Dedicated Correction Waiting Screen (JUDGING)
  if (arabicState.phase === 'JUDGING') {
    return <ShabahThinkingScreen title="الشبح العربي يدقّق الكلمات"
      onRetry={isRoomHost(roomCode) ? () => window.location.reload() : undefined}
      onReturnToLobby={isRoomHost(roomCode) ? () => roomBus.broadcastReturnToLobby(roomCode) : undefined} />;
  }

  // 4. Solving Phase (Mobile Input)
  if (arabicState.phase === 'INPUT') {
    return (
      <ArabicMobileInput
        contestantId={playerId}
        contestantName={playerName}
        currentLetter={arabicState.currentLetter}
        categories={arabicState.currentCategories}
        timerSeconds={arabicState.timerSeconds}
        hasSubmitted={hasSubmittedThisRound}
        onSubmit={handleSubmitAnswers}
        roundStartTime={arabicState.roundStartedAt}
      />
    );
  }

  // 5. Results & Objection Phase
  if (arabicState.phase === 'RESULTS') {
    const connectedContestantsCount = Math.max(1, activeRoom?.players?.length || 1);

    return (
      <ArabicMobileResults
        onNextRound={isRoomHost(roomCode)?onNextRound:undefined}
        currentContestantId={playerId}
        evaluations={arabicState.evaluations || {}}
        categories={arabicState.currentCategories || []}
        currentLetter={arabicState.currentLetter}
        activeObjection={arabicState.activeObjection}
        onFileObjection={handleFileObjection}
        onVoteObjection={handleVoteObjection}
        isReadyForNextRound={isReadyForNextRound}
        onToggleReady={handleToggleReady}
        readyContestantsCount={arabicState.readyPlayersNextRound?.length || 0}
        totalContestantsCount={connectedContestantsCount}
        onReturnToLobby={isRoomHost(roomCode) ? handleReturnToLobby : undefined}
      />
    );
  }

  // 5. Final Podium Phase
  const ranked = getRankedContestants(
    arabicState.cumulativeScores || {},
    activeRoom?.players || [{ id: playerId, name: playerName }]
  );

  return (
    <ArabicFinalPodium
      rankedContestants={ranked}
      isTV={false}
      onReturnToLobby={isRoomHost(roomCode) ? handleReturnToLobby : undefined}
    />
  );
};

export default ArabicMobileRoot;
