import {useRoundTransition} from '../../../hooks/useRoundTransition';
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
  loadPersistedGuideState,
  acceptsGuidePin,
  allGuidePinsLocked,
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

export const GuideTVRoot: React.FC<{ mobileContestants?: Array<{ id: string; name: string }> }> = ({ mobileContestants }) => {
  const { code: rawCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const roomCode = (rawCode || 'SHBH').trim().toUpperCase();

  const { room } = useRoom(roomCode);
  const activeRoom = room || roomBus.getRoom(roomCode);

  // Maintain stable realtime presence connection for Host TV
  const { connectedPlayers: realtimeContestants, hasPresenceSnapshot } = useRoomSync({
    roomCode: mobileContestants ? '' : roomCode,
    role: 'host',
  });

  const [guideState, setGuideState] = useState<GuideRoomState>(() =>
    loadPersistedGuideState(roomCode) ?? createInitialGuideState(roomCode)
  );

  const stateRef = useRef(guideState);

  useEffect(() => roomBus.on('REQUEST_ROOM_STATE', () => {
    roomBus.broadcastGuideSync(roomCode, stateRef.current);
  }, roomCode), [roomCode]);
  useEffect(() => {
    stateRef.current = guideState;
    savePersistedGuideState(roomCode, guideState);
  }, [guideState, roomCode]);

  // Merged connected contestants list
  const mergedContestants = mobileContestants ?? (
    hasPresenceSnapshot || realtimeContestants.length > 0
      ? realtimeContestants
      : (activeRoom?.players || []).filter((p) => p.id !== 'host_tv'));


  // The room bus coalesces outgoing snapshots.
  const syncState = useCallback(
    (newState: GuideRoomState) => {
      stateRef.current = newState;
      setGuideState(newState);
      roomBus.broadcastGuideSync(roomCode, newState);
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
    if (curr.phase !== 'GUESSING') return;

    sound.playVictory();
    const target = curr.currentLandmark;
    const computedResults: Record<string, ContestantRoundResult> = {};
    const updatedCumulative = { ...(curr.cumulativeScores || {}) };
    const updatedMisses: Record<string, BiggestMissRecord> = { ...(curr.biggestMisses || {}) };

    const guessesToEvaluate = Object.fromEntries(Object.entries(overrideGuesses || curr.guesses || {})
      .filter(([id, guess]) => id !== 'host_tv' && guess.contestantId !== 'host_tv'));
    const evaluatedGuessKeys = new Set<string>();

    // 1. Evaluate each connected contestant
    mergedContestants.forEach((c) => {
      // Check exact ID match or fallback name/contestantId match
      let g = guessesToEvaluate[c.id];
      let matchedKey = c.id;

      if (!g) {
        const found = Object.entries(guessesToEvaluate).find(
          ([key, guess]) =>
            key === c.id || guess.contestantId === c.id
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
          hasGuess: true,
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
          hasGuess: false,
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
        hasGuess: true,
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
    const curr = stateRef.current;
    if(curr.phase!=='RESULTS')return;

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
    if (!await roomBus.terminateRoom(roomCode)) {
      alert('تعذر إنهاء الغرفة، حاول مرة أخرى');
      return;
    }
  }, [roomCode]);

  const handleReturnToLobby = useCallback(() => {
    if (!window.confirm('ترجع للوبي وتنهي الجولة الحالية؟')) return;
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
    let graceTimer: ReturnType<typeof setTimeout> | undefined;
    const roundNumber = guideState.roundNumber;

    // Pure state updates only inside setState; side effects (sound, broadcast, evaluation) run outside.
    const interval = setInterval(() => {
      const prev = stateRef.current;
      if (prev.phase !== 'GUESSING') return;

      const nextSec = Math.max(0, Math.ceil((prev.roundStartedAt + 60000 - Date.now()) / 1000));

      if (nextSec <= 0) {
        clearInterval(interval);
        const expiredState = { ...prev, timerSeconds: 0 };
        stateRef.current = expiredState;
        setGuideState(expiredState);
        roomBus.broadcastGuideSync(roomCode, expiredState);
        // Allow pins already in flight to arrive without affecting a later round.
        graceTimer = setTimeout(() => {
          if (stateRef.current.roundNumber === roundNumber) evaluateRef.current();
        }, 1500);
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

      // Broadcast when a new clue unlocks.
      if (nextClueIdx !== prev.activeClueIndex) {
        sound.playBeep();
        roomBus.broadcastGuideSync(roomCode, updated);
      }
    }, 1000);

    return () => { clearInterval(interval); clearTimeout(graceTimer); };
  }, [guideState.phase, guideState.roundNumber, roomCode]);

  useEffect(() => {
    if (allGuidePinsLocked(stateRef.current, mergedContestants.map(c => c.id))) executeRoundEvaluation();
  }, [guideState.phase, guideState.guesses, mergedContestants, executeRoundEvaluation]);

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
      const contestant = mergedContestants.find(c => c.id === contestantId);
      if (!contestant || !acceptsGuidePin(curr, payload, mergedContestants.map(c => c.id))) return;
      const updatedGuesses: Record<string, ContestantGuess> = {
        ...curr.guesses,
        [contestantId]: {
          contestantId,
          contestantName: contestant.name,
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
      roomBus.broadcastGuideSync(roomCode, updatedState);

    }, roomCode);

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
  }, [roomCode, mergedContestants, syncState, executeRoundEvaluation]);

  // -------------------------------------------------------------
  // View Rendering
  // -------------------------------------------------------------

  // 1. Lobby Phase
  useEffect(() => roomBus.on('GAME_STARTED', () => {
    if (stateRef.current.phase === 'LOBBY') void handleStartGame();
  }, roomCode), [roomCode, handleStartGame]);

  useEffect(() => {
    if (!mobileContestants || guideState.phase !== 'INTRO') return;
    const timer = setTimeout(() => { void startGuessingRound(); }, 4500);
    return () => clearTimeout(timer);
  }, [mobileContestants, guideState.phase, startGuessingRound]);

  useEffect(() => roomBus.on('RETURN_TO_LOBBY', () => {
    const fresh = createInitialGuideState(roomCode);
    syncState(fresh);
  }, roomCode), [roomCode, syncState]);

  useRoundTransition(guideState.phase==='RESULTS'?'RESULTS:'+guideState.roundNumber:null,guideState.roundTransition,
    roundTransition=>syncState({...stateRef.current,roundTransition}),handleNextRound);
  if (mobileContestants) return null;

  if (guideState.phase === 'LOBBY') {
    return (
      <UnifiedShabahLobby
        roomCode={roomCode}
        gameId="ai-guide"
        gameTitle="الشبح المرشد"
        role="host"
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
        readyCount={mergedContestants.filter(p => guideState.readyPlayersNextRound?.includes(p.id)).length}
        totalConnectedCount={mergedContestants.length}
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
      onExit={handleEndGame}
      onReturnToLobby={handleReturnToLobby}
    />
  );
};

export default GuideTVRoot;
