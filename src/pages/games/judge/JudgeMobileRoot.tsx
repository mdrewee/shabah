import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom, roomBus } from '../../../lib/roomBus';
import { useRoomSync } from '../../../hooks/useRoomSync';
import { sound } from '../../../lib/audio';
import { UnifiedShabahLobby } from '../../../components/lobby/UnifiedShabahLobby';
import { JudgeRoomState } from './types';
import { createInitialJudgeState, getRankedJudgeContestants } from './judgeSync';
import {
  getOrCreatePlayerId,
  getOrCreatePlayerName,
  getPersistedPlayerName,
} from '../../../utils/playerSession';
import { JudgeMobileView } from './components/JudgeMobileView';
import { JudgeCourtWaitingScreen } from './components/JudgeCourtWaitingScreen';
import { JudgeFinalPodium } from './components/JudgeFinalPodium';

export const JudgeMobileRoot: React.FC = () => {
  const { code: rawCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const roomCode = (rawCode || 'SHBH').trim().toUpperCase();

  const [playerId] = useState<string>(() => getOrCreatePlayerId());
  const [playerName] = useState<string>(() => {
    return getPersistedPlayerName() || getOrCreatePlayerName('متهم');
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

  const [judgeState, setJudgeState] = useState<JudgeRoomState>(() =>
    createInitialJudgeState(roomCode)
  );

  const [hasSubmittedThisRound, setHasSubmittedThisRound] = useState<boolean>(false);
  const [isReadyForNextRound, setIsReadyForNextRound] = useState<boolean>(false);

  // Synchronize with TV host state
  useEffect(() => {
    const unsubSync = roomBus.on('JUDGE_STATE_SYNC', (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (!payload) return;
      setJudgeState(payload);

      // Reset submission flag when a new round starts
      if (payload.phase === 'EXCUSE_INPUT' && payload.roundNumber !== judgeState.roundNumber) {
        setHasSubmittedThisRound(false);
        setIsReadyForNextRound(false);
      }
    });

    const unsubLobby = roomBus.on('RETURN_TO_LOBBY', (evt: any) => {
      const incomingCode = evt?.roomCode;
      if (incomingCode && incomingCode !== roomCode) return;
      setJudgeState((prev) => ({
        ...prev,
        phase: 'LOBBY',
      }));
      setHasSubmittedThisRound(false);
      setIsReadyForNextRound(false);
    });

    const unsubResultsReady = roomBus.on('JUDGE_RESULTS_READY', (evt: any) => {
      const payload = evt?.data ?? evt;
      sound.playGavelStrike();
      if (payload?.verdicts) {
        const verdictsArr: any[] = Array.isArray(payload.verdicts)
          ? payload.verdicts
          : Object.values(payload.verdicts);

        const verdictsMap: Record<string, any> = {};
        verdictsArr.forEach((v) => {
          if (v && v.playerId) {
            verdictsMap[v.playerId] = v;
          }
        });

        setJudgeState((prev) => ({
          ...prev,
          phase: 'COURTROOM_VERDICT',
          verdicts: {
            ...prev.verdicts,
            ...verdictsMap,
          },
          verdictList: verdictsArr,
        }));
      }
    });

    const unsubNewRound = roomBus.on('JUDGE_NEW_ROUND', (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (!payload?.currentCase) return;

      setJudgeState((prev) => ({
        ...prev,
        phase: 'EXCUSE_INPUT',
        currentPredicament: payload.currentCase,
        roundNumber: payload.roundNumber || prev.roundNumber,
        timerSeconds: 60,
        excuses: {},
        verdicts: {},
        verdictList: [],
      }));
      setHasSubmittedThisRound(false);
      setIsReadyForNextRound(false);
    });

    const unsubTerminated = roomBus.on('ROOM_TERMINATED', (evt: any) => {
      const payload = evt?.data ?? evt;
      roomBus.leaveRoom();
      sessionStorage.clear();
      localStorage.removeItem('current_room_code');
      alert(payload?.reason || 'تم إنهاء اللعبة والعودة للرئيسية.');
      window.location.href = '/';
    });

    return () => {
      unsubSync?.();
      unsubNewRound?.();
      unsubResultsReady?.();
      unsubLobby?.();
      unsubTerminated?.();
    };
  }, [roomCode, judgeState.roundNumber]);

  // Handle Excuse Submission
  const handleSubmitExcuse = (excuse: string, wasAutoSubmitted = false) => {
    setHasSubmittedThisRound(true);
    sound.playClick();

    const payload = {
      playerId,
      playerName,
      excuse,
      wasAutoSubmitted,
    };

    roomBus.broadcastJudgeExcuse(roomCode, payload);
    roomBus.broadcast('SUBMIT_EXCUSE', payload);
  };

  // Handle Ready Toggle for Next Round
  const handleToggleReady = () => {
    const nextReady = !isReadyForNextRound;
    setIsReadyForNextRound(nextReady);
    roomBus.broadcastPlayerReadyUpdate(roomCode, playerId, nextReady, playerName);
  };

  // Handle Return to Lobby
  const handleReturnToLobby = () => {
    roomBus.broadcastReturnToLobby(roomCode);
    setJudgeState((prev) => ({
      ...prev,
      phase: 'LOBBY',
    }));
  };

  // 1. Lobby Phase
  if (judgeState.phase === 'LOBBY') {
    return (
      <UnifiedShabahLobby
        roomCode={roomCode}
        gameId="ai-judge"
        gameTitle="الشبح القاضي"
        role="contestant"
        currentPlayerId={playerId}
        onExit={() => {
          roomBus.leavePlayer(roomCode, playerId);
          navigate('/');
        }}
      />
    );
  }

  // 2. Judging Phase - Suspicious Court Waiting Screen
  if (judgeState.phase === 'JUDGING') {
    return <JudgeCourtWaitingScreen isTV={false} />;
  }

  // 3. Input & Courtroom Verdict Phase
  if (
    judgeState.phase === 'EXCUSE_INPUT' ||
    judgeState.phase === 'COURTROOM_VERDICT'
  ) {
    const myVerdict = judgeState.verdicts ? judgeState.verdicts[playerId] : undefined;
    const isCourtroomVerdict = judgeState.phase === 'COURTROOM_VERDICT';
    const connectedContestantsCount = Math.max(1, activeRoom?.players?.length || 1);

    return (
      <JudgeMobileView
        predicament={judgeState.currentPredicament}
        roundNumber={judgeState.roundNumber}
        totalRounds={judgeState.totalRounds}
        timerSeconds={judgeState.timerSeconds}
        hasSubmitted={hasSubmittedThisRound}
        onSubmitExcuse={handleSubmitExcuse}
        myVerdict={myVerdict}
        isCourtroomVerdict={isCourtroomVerdict}
        isReadyForNextRound={isReadyForNextRound}
        onToggleReady={handleToggleReady}
        readyCount={judgeState.readyPlayersNextRound?.length || 0}
        totalConnectedCount={connectedContestantsCount}
      />
    );
  }

  // 3. Final Podium Phase
  const ranked = getRankedJudgeContestants(
    judgeState.cumulativeScores || {},
    activeRoom?.players || [{ id: playerId, name: playerName }]
  );

  return (
    <JudgeFinalPodium
      rankedContestants={ranked}
      worstExcuses={judgeState.worstExcuses || {}}
      isTV={false}
      onReturnToLobby={handleReturnToLobby}
    />
  );
};

export default JudgeMobileRoot;
