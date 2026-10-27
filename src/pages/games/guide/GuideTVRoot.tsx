import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom, roomBus } from '../../../lib/roomBus';
import { useRoomSync } from '../../../hooks/useRoomSync';
import { sound } from '../../../lib/audio';
import { UnifiedShabahLobby } from '../../../components/lobby/UnifiedShabahLobby';
import {
  GuideRoomState,
  ContestantGuess,
  ContestantRoundResult,
  BiggestMissRecord,
} from './types';
import {
  createInitialGuideState,
  savePersistedGuideState,
  getRankedGuideContestants,
} from './guideSync';
import {
  getRandomGuideLandmarks,
  GUIDE_LANDMARKS_POOL,
} from '../../../data/guideLandmarks';
import {
  calculateDistanceKm,
  evaluateGuess,
  inferContinentFromCoords,
} from '../../../services/guideScoring';
import { GuideIntroStage } from './components/GuideIntroStage';
import { GuideTVView } from './components/GuideTVView';
import { GuideResultsStage } from './components/GuideResultsStage';
import { GuideFinalPodium } from './components/GuideFinalPodium';

export const GuideTVRoot: React.FC = () => {
  const { code: rawCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const roomCode = (rawCode || 'SHBH').trim().toUpperCase();

  const { room } = useRoom(roomCode);
  const activeRoom = room || roomBus.getRoom(roomCode);

  // Maintain stable realtime presence connection for Host TV
  const { connectedPlayers: realtimeContestants } = useRoomSync({
    roomCode,
    role: 'host',
  });

  const [guideState, setGuideState] = useState<GuideRoomState>(() =>
    createInitialGuideState(roomCode)
  );

  const stateRef = useRef(guideState);
  useEffect(() => {
    stateRef.current = guideState;
    savePersistedGuideState(roomCode, guideState);
  }, [guideState, roomCode]);

  // Merged connected contestants list
  const mergedContestants =
    realtimeContestants.length > 0
      ? realtimeContestants
      : (activeRoom?.players || []).filter((p) => p.id !== 'host_tv');

  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);
  const lastBroadcastRef = useRef<string>('');

  // Synchronize state across network with deduplication guard
  const syncState = useCallback(
    (newState: GuideRoomState) => {
      setGuideState(newState);
      const syncKey = `${newState.phase}_${newState.roundNumber}_${newState.activeClueIndex}_${newState.currentLandmark?.id}_${Object.keys(newState.results || {}).length}`;
      if (lastBroadcastRef.current !== syncKey) {
        lastBroadcastRef.current = syncKey;
        roomBus.broadcastGuideSync(roomCode, newState);
      }
    },
    [roomCode]
  );

  // -------------------------------------------------------------
  // Round Transitions
  // -------------------------------------------------------------

  const handleStartGame = useCallback(() => {
    const curr = stateRef.current;
    const initialLandmark = getRandomGuideLandmarks(1)[0] || GUIDE_LANDMARKS_POOL[0];

    const introState: GuideRoomState = {
      ...curr,
      phase: 'INTRO',
      roundNumber: 1,
      currentLandmark: initialLandmark,
      usedLandmarkIds: [initialLandmark.id],
      timerSeconds: 60,
      activeClueIndex: 0,
      guesses: {},
      results: {},
      readyPlayersNextRound: [],
    };
    roomBus.broadcastGameStarted(roomCode, { gameId: 'ai-guide', state: introState });
    syncState(introState);
  }, [roomCode, syncState]);

  const startGuessingRound = useCallback(() => {
    const curr = stateRef.current;
    const guessingState: GuideRoomState = {
      ...curr,
      phase: 'GUESSING',
      timerSeconds: 60,
      activeClueIndex: 0,
      roundStartedAt: Date.now(),
      guesses: {},
      results: {},
      readyPlayersNextRound: [],
    };
    syncState(guessingState);
  }, [syncState]);

  const executeRoundEvaluation = useCallback((overrideGuesses?: Record<string, ContestantGuess>) => {
    const curr = stateRef.current;
    if (curr.phase === 'RESULTS' || curr.phase === 'PODIUM') return;

    sound.playVictory();
    const target = curr.currentLandmark;
    const computedResults: Record<string, ContestantRoundResult> = {};
    const updatedCumulative = { ...(curr.cumulativeScores || {}) };
    const updatedMisses: Record<string, BiggestMissRecord> = { ...(curr.biggestMisses || {}) };

    const guessesToEvaluate = overrideGuesses || curr.guesses || {};
    const evaluatedGuessKeys = new Set<string>();

    // 1. Evaluate each connected contestant
    mergedContestants.forEach((c) => {
      // Check exact ID match or fallback name/contestantId match
      let g = guessesToEvaluate[c.id];
      let matchedKey = c.id;

      if (!g) {
        const found = Object.entries(guessesToEvaluate).find(
          ([key, guess]) =>
            key === c.id ||
            guess.contestantId === c.id ||
            (guess.contestantName && c.name && guess.contestantName.trim().toLowerCase() === c.name.trim().toLowerCase())
        );
        if (found) {
          matchedKey = found[0];
          g = found[1];
        }
      }

      if (g) {
        evaluatedGuessKeys.add(matchedKey);
        evaluatedGuessKeys.add(g.contestantId);
        const dist = calculateDistanceKm(target.lat, target.lng, g.lat, g.lng);
        const guessedContinent = inferContinentFromCoords(g.lat, g.lng);
        const isSameContinent = guessedContinent === target.continent;
        const evalScore = evaluateGuess(dist, isSameContinent);

        computedResults[c.id] = {
          contestantId: c.id,
          contestantName: c.name || g.contestantName,
          lat: g.lat,
          lng: g.lng,
          distanceKm: dist,
          points: evalScore.points,
          label: evalScore.label,
          tier: evalScore.tier,
        };

        updatedCumulative[c.id] = (updatedCumulative[c.id] || 0) + evalScore.points;

        // Track biggest miss
        const currentWorst = updatedMisses[c.id]?.distanceKm || 0;
        if (dist > currentWorst) {
          updatedMisses[c.id] = {
            contestantId: c.id,
            contestantName: c.name || g.contestantName,
            landmarkName: target.name,
            distanceKm: dist,
          };
        }
      } else {
        // No guess placed
        computedResults[c.id] = {
          contestantId: c.id,
          contestantName: c.name,
          lat: 0,
          lng: 0,
          distanceKm: 20000,
          points: 0,
          label: 'لم يضع دبوساً على الخريطة!',
          tier: 'miss',
        };
      }
    });

    // 2. SAFETY NET: Include any submitted guesses from players not currently in mergedContestants
    Object.entries(guessesToEvaluate).forEach(([key, g]) => {
      if (evaluatedGuessKeys.has(key) || evaluatedGuessKeys.has(g.contestantId)) return;
      const cId = g.contestantId || key;
      const cName = g.contestantName || 'رحالة';
      const dist = calculateDistanceKm(target.lat, target.lng, g.lat, g.lng);
      const guessedContinent = inferContinentFromCoords(g.lat, g.lng);
      const isSameContinent = guessedContinent === target.continent;
      const evalScore = evaluateGuess(dist, isSameContinent);

      computedResults[cId] = {
        contestantId: cId,
        contestantName: cName,
        lat: g.lat,
        lng: g.lng,
        distanceKm: dist,
        points: evalScore.points,
        label: evalScore.label,
        tier: evalScore.tier,
      };

      updatedCumulative[cId] = (updatedCumulative[cId] || 0) + evalScore.points;

      const currentWorst = updatedMisses[cId]?.distanceKm || 0;
      if (dist > currentWorst) {
        updatedMisses[cId] = {
          contestantId: cId,
          contestantName: cName,
          landmarkName: target.name,
          distanceKm: dist,
        };
      }
    });

    const resultsState: GuideRoomState = {
      ...curr,
      phase: 'RESULTS',
      guesses: guessesToEvaluate,
      results: computedResults,
      cumulativeScores: updatedCumulative,
      biggestMisses: updatedMisses,
      readyPlayersNextRound: [],
    };
    stateRef.current = resultsState;
    syncState(resultsState);
  }, [mergedContestants, syncState]);

  const handleNextRound = useCallback(() => {
    setAutoAdvanceCountdown(null);
    const curr = stateRef.current;

    // After 5 rounds, transition to final podium
    if (curr.roundNumber >= curr.totalRounds) {
      const podiumState: GuideRoomState = {
        ...curr,
        phase: 'PODIUM',
      };
      syncState(podiumState);
      sound.playVictory();
      return;
    }

    // Pick new unique landmark
    const nextLandmark = getRandomGuideLandmarks(1, curr.usedLandmarkIds)[0] || GUIDE_LANDMARKS_POOL[0];

    const nextIntroState: GuideRoomState = {
      ...curr,
      phase: 'INTRO',
      roundNumber: curr.roundNumber + 1,
      currentLandmark: nextLandmark,
      usedLandmarkIds: [...curr.usedLandmarkIds, nextLandmark.id],
      timerSeconds: 60,
      activeClueIndex: 0,
      guesses: {},
      results: {},
      readyPlayersNextRound: [],
    };
    syncState(nextIntroState);
  }, [syncState]);

  const handleEndGame = useCallback(async () => {
    sound.stopAllAudio();
    try {
      await roomBus.terminateRoom(roomCode, 'تم إنهاء الغرفة بواسطة المضيف');
    } catch (err) {
      console.warn('[GuideTVRoot] terminateRoom error:', err);
    }
    sessionStorage.clear();
    localStorage.removeItem('current_room_code');
    window.location.href = '/';
  }, [roomCode]);

  const handleReturnToLobby = useCallback(() => {
    sound.stopAllAudio();
    const nextState: GuideRoomState = {
      ...createInitialGuideState(roomCode),
      phase: 'LOBBY',
    };
    roomBus.broadcastReturnToLobby(roomCode);
    syncState(nextState);
  }, [roomCode, syncState]);

  // Audio Kill-Switch on phase changes
  useEffect(() => {
    return () => {
      sound.stopAllAudio();
    };
  }, [guideState.phase]);

  // -------------------------------------------------------------
  // Countdown Timer & Progressive Clues Unlocking in GUESSING Phase
  // -------------------------------------------------------------
  const evaluateRef = useRef(executeRoundEvaluation);
  useEffect(() => {
    evaluateRef.current = executeRoundEvaluation;
  }, [executeRoundEvaluation]);

  useEffect(() => {
    if (guideState.phase !== 'GUESSING') return;

    // Pure state updates only inside setState; side effects (sound, broadcast, evaluation) run outside.
    const interval = setInterval(() => {
      const prev = stateRef.current;
      if (prev.phase !== 'GUESSING') return;

      const nextSec = prev.timerSeconds - 1;

      if (nextSec <= 0) {
        clearInterval(interval);
        const expiredState = { ...prev, timerSeconds: 0 };
        stateRef.current = expiredState;
        setGuideState(expiredState);
        // 600ms safety grace period for in-flight pin submissions arriving right at 0
        setTimeout(() => {
          evaluateRef.current();
        }, 600);
        return;
      }

      // Unlock a new clue every 12 seconds
      const elapsed = 60 - nextSec;
      const nextClueIdx = Math.min(4, Math.floor(elapsed / 12));

      if (nextSec <= 5) {
        sound.playTick();
      }

      const updated: GuideRoomState = {
        ...prev,
        timerSeconds: nextSec,
        activeClueIndex: nextClueIdx,
      };
      stateRef.current = updated;
      setGuideState(updated);

      // ONLY broadcast when a new clue unlocks, deduplicated through lastBroadcastRef
      if (nextClueIdx !== prev.activeClueIndex) {
        sound.playBeep();
        const clueSyncKey = `${prev.phase}_${prev.roundNumber}_${nextClueIdx}_${prev.currentLandmark?.id}_clue`;
        if (lastBroadcastRef.current !== clueSyncKey) {
          lastBroadcastRef.current = clueSyncKey;
          roomBus.broadcastGuideSync(roomCode, updated);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [guideState.phase, roomCode]);

  // -------------------------------------------------------------
  // Realtime Broadcast Listeners
  // -------------------------------------------------------------
  useEffect(() => {
    // 1. Contestant Submits / Locks Pin
    const unsubPin = roomBus.on('GUIDE_PIN_SUBMITTED', (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (!payload?.contestantId) return;

      const curr = stateRef.current;
      if (curr.phase !== 'GUESSING') return;

      const contestantId = String(payload.contestantId);
      const updatedGuesses: Record<string, ContestantGuess> = {
        ...curr.guesses,
        [contestantId]: {
          contestantId,
          contestantName: payload.contestantName || 'رحالة',
          lat: Number(payload.lat),
          lng: Number(payload.lng),
          submittedAt: payload.submittedAt || Date.now(),
        },
      };

      const updatedState: GuideRoomState = {
        ...curr,
        guesses: updatedGuesses,
      };

      // Synchronously update stateRef.current before evaluating
      stateRef.current = updatedState;
      setGuideState(updatedState);

      // Early Advance Check: If all connected contestants have locked pins
      const connectedCount = Math.max(1, mergedContestants.length);
      const lockedCount = Object.keys(updatedGuesses).length;

      if (lockedCount >= connectedCount) {
        executeRoundEvaluation(updatedGuesses);
      }
    });

    // 2. Inter-round Ready update
    const unsubReady = roomBus.on('PLAYER_READY_UPDATE', (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (!payload?.playerId) return;

      const curr = stateRef.current;
      if (curr.phase !== 'RESULTS') return;

      const currentReady = new Set(curr.readyPlayersNextRound || []);
      if (payload.isReady) {
        currentReady.add(payload.playerId);
      } else {
        currentReady.delete(payload.playerId);
      }

      const nextReadyList = Array.from(currentReady);
      const updatedState: GuideRoomState = {
        ...curr,
        readyPlayersNextRound: nextReadyList,
      };

      syncState(updatedState);
    });

    return () => {
      unsubPin?.();
      unsubReady?.();
    };
  }, [roomCode, mergedContestants.length, syncState, executeRoundEvaluation]);

  // -------------------------------------------------------------
  // 3-Second Auto-Advance Countdown when readyCount >= 2 in RESULTS
  // -------------------------------------------------------------
  useEffect(() => {
    if (guideState.phase !== 'RESULTS') {
      setAutoAdvanceCountdown(null);
      return;
    }

    const readyCount = (guideState.readyPlayersNextRound || []).length;
    const requiredReady = Math.min(2, Math.max(1, mergedContestants.length));

    if (readyCount >= requiredReady) {
      if (autoAdvanceCountdown === null) {
        setAutoAdvanceCountdown(3);
      }
    } else {
      setAutoAdvanceCountdown(null);
    }
  }, [guideState.phase, guideState.readyPlayersNextRound, mergedContestants.length, autoAdvanceCountdown]);

  useEffect(() => {
    if (autoAdvanceCountdown === null) return;

    if (autoAdvanceCountdown <= 0) {
      handleNextRound();
      return;
    }

    sound.playTick();
    const timer = setTimeout(() => {
      setAutoAdvanceCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoAdvanceCountdown, handleNextRound]);

  // -------------------------------------------------------------
  // View Rendering
  // -------------------------------------------------------------

  // 1. Lobby Phase
  if (guideState.phase === 'LOBBY') {
    return (
      <UnifiedShabahLobby
        roomCode={roomCode}
        gameId="ai-guide"
        gameTitle="الشبح المرشد"
        role="host"
        onStartGame={handleStartGame}
      />
    );
  }

  // 2. Cinematic 3D Globe & Explorer Intro Phase
  if (guideState.phase === 'INTRO') {
    return (
      <GuideIntroStage
        roundNumber={guideState.roundNumber}
        totalRounds={guideState.totalRounds}
        landmark={guideState.currentLandmark}
        onComplete={startGuessingRound}
        onSkip={startGuessingRound}
      />
    );
  }

  // 3. Guessing & Progressive Clues Phase (TV View)
  if (guideState.phase === 'GUESSING') {
    return (
      <GuideTVView
        roundNumber={guideState.roundNumber}
        totalRounds={guideState.totalRounds}
        landmark={guideState.currentLandmark}
        timerSeconds={guideState.timerSeconds}
        activeClueIndex={guideState.activeClueIndex}
        connectedContestants={mergedContestants}
        guesses={guideState.guesses}
        onForceAdvance={executeRoundEvaluation}
        onReturnToLobby={handleReturnToLobby}
        onEndGame={handleEndGame}
      />
    );
  }

  // 4. Reveal & Results Phase
  if (guideState.phase === 'RESULTS') {
    return (
      <GuideResultsStage
        isTV={true}
        landmark={guideState.currentLandmark}
        roundNumber={guideState.roundNumber}
        totalRounds={guideState.totalRounds}
        results={guideState.results}
        cumulativeScores={guideState.cumulativeScores}
        onNextRound={handleNextRound}
        onReturnToLobby={handleReturnToLobby}
        readyCount={guideState.readyPlayersNextRound?.length || 0}
        totalConnectedCount={Math.max(1, mergedContestants.length)}
      />
    );
  }

  // 5. Final Podium Phase
  const ranked = getRankedGuideContestants(
    guideState.cumulativeScores,
    mergedContestants,
    guideState.biggestMisses
  );

  return (
    <GuideFinalPodium
      isTV={true}
      rankedContestants={ranked}
      onReturnToLobby={handleReturnToLobby}
    />
  );
};

export default GuideTVRoot;
